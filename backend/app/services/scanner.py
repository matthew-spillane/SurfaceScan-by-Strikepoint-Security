"""Scan orchestrator — runs the full attack surface discovery pipeline.

Pipeline stages:
  1. Subdomain enumeration (crt.sh + HackerTarget in parallel)
  2. DNS resolution (batch, concurrent)
  3. Enrichment (Shodan + GeoIP + SSL + MX in parallel per IP)
  4. Risk scoring
  5. Graph construction

Results are written progressively to the scan store so the frontend
can poll and display partial results as they arrive.
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from app.models import (
    Asset,
    GraphData,
    GraphEdge,
    GraphNode,
    RiskLevel,
    ScanResult,
    ScanStatus,
)
from app.store import add_log, get_scan
from app.services.crtsh import query_crtsh
from app.services.hackertarget import query_hackertarget
from app.services.dns_resolver import resolve_domain
from app.services.shodan import query_shodan, build_services_map
from app.services.geoip import query_geoip_batch
from app.services.ssl_inspector import inspect_ssl_live
from app.services.google_dns import query_mx_records
from app.services.risk_scorer import score_asset


async def run_scan(scan_id: str) -> None:
    """Execute the full scan pipeline for a given scan ID.

    This is meant to be launched as a background task.
    All progress is written to the scan store.
    """
    scan = get_scan(scan_id)
    if scan is None:
        return

    domain = scan.domain

    try:
        # ── Stage 1: Subdomain enumeration ──────────────────────────
        add_log(scan_id, f"Starting attack surface scan for {domain}", "success")
        add_log(scan_id, f"Querying crt.sh for *.{domain}...", "discovery")
        add_log(scan_id, f"Querying HackerTarget for {domain}...", "discovery")

        crtsh_task = query_crtsh(domain)
        ht_task = query_hackertarget(domain)
        crtsh_results, ht_results = await asyncio.gather(
            crtsh_task, ht_task, return_exceptions=True
        )

        # Handle exceptions from gather
        crtsh_subs: list[str] = (
            crtsh_results if isinstance(crtsh_results, list) else []
        )
        ht_subs: list[str] = (
            ht_results if isinstance(ht_results, list) else []
        )

        if crtsh_subs:
            add_log(
                scan_id,
                f"Found {len(crtsh_subs)} subdomains from certificate transparency logs",
                "discovery",
            )
        else:
            add_log(scan_id, "crt.sh returned no results or timed out", "error")

        if ht_subs:
            add_log(
                scan_id,
                f"Found {len(ht_subs)} subdomains from HackerTarget",
                "discovery",
            )
        else:
            add_log(
                scan_id, "HackerTarget returned no results or timed out", "error"
            )

        # Merge and deduplicate
        all_subdomains = sorted(set(crtsh_subs) | set(ht_subs) | {domain})
        add_log(
            scan_id,
            f"Total unique subdomains after deduplication: {len(all_subdomains)}",
            "success",
        )

        # Create initial assets and update scan
        for sub in all_subdomains:
            scan.assets.append(Asset(subdomain=sub))

        scan.summary.total_subdomains = len(all_subdomains)

        # ── Stage 2: DNS resolution ─────────────────────────────────
        add_log(scan_id, "Resolving DNS A records...", "resolve")

        resolved_count = 0
        failed_count = 0
        semaphore = asyncio.Semaphore(25)

        async def resolve_one(asset: Asset) -> None:
            nonlocal resolved_count, failed_count
            async with semaphore:
                ip = await resolve_domain(asset.subdomain)
                if ip:
                    asset.ip = ip
                    resolved_count += 1
                    add_log(
                        scan_id,
                        f"Resolved {asset.subdomain} → {ip}",
                        "resolve",
                    )
                else:
                    failed_count += 1

        await asyncio.gather(*[resolve_one(a) for a in scan.assets])

        add_log(
            scan_id,
            f"DNS resolution complete: {resolved_count} resolved, {failed_count} failed",
            "success",
        )

        # Filter to only assets with resolved IPs for enrichment
        resolved_assets = [a for a in scan.assets if a.ip]
        unique_ips = list({a.ip for a in resolved_assets})
        scan.summary.unique_ips = len(unique_ips)

        # ── Stage 3: Enrichment (Shodan + GeoIP + SSL + MX) ────────
        add_log(
            scan_id,
            f"Enriching {len(unique_ips)} unique IPs via Shodan InternetDB...",
            "enrich",
        )

        # 3a: Shodan enrichment per unique IP
        shodan_results: dict = {}
        shodan_semaphore = asyncio.Semaphore(10)

        async def enrich_shodan(ip: str) -> None:
            async with shodan_semaphore:
                result = await query_shodan(ip)
                shodan_results[ip] = result
                if result.ports:
                    add_log(
                        scan_id,
                        f"Shodan {ip}: ports {result.ports}, "
                        f"{len(result.cves)} CVEs",
                        "enrich",
                    )

        await asyncio.gather(*[enrich_shodan(ip) for ip in unique_ips])

        add_log(scan_id, "Shodan enrichment complete", "success")

        # 3b: GeoIP batch lookup
        add_log(scan_id, f"Querying geolocation for {len(unique_ips)} IPs...", "enrich")
        geo_results = await query_geoip_batch(unique_ips)
        add_log(scan_id, "Geolocation enrichment complete", "success")

        # 3c: SSL inspection (concurrent, only for resolved hosts)
        add_log(
            scan_id,
            f"Inspecting SSL certificates for {len(resolved_assets)} hosts...",
            "enrich",
        )

        ssl_semaphore = asyncio.Semaphore(15)

        async def enrich_ssl(asset: Asset) -> None:
            async with ssl_semaphore:
                ssl_info = await inspect_ssl_live(asset.subdomain)
                if ssl_info:
                    asset.ssl = ssl_info

        await asyncio.gather(*[enrich_ssl(a) for a in resolved_assets])

        add_log(scan_id, "SSL certificate inspection complete", "success")

        # 3d: MX record lookup for root domain
        add_log(scan_id, f"Querying MX records for {domain}...", "enrich")
        mx_records = await query_mx_records(domain)
        if mx_records:
            add_log(
                scan_id,
                f"Found {len(mx_records)} MX records for {domain}",
                "enrich",
            )
        else:
            add_log(scan_id, "No MX records found", "enrich")

        # ── Stage 4: Apply enrichment data to assets ────────────────
        total_ports = 0
        ssl_issues = 0

        for asset in scan.assets:
            if not asset.ip:
                continue

            # Shodan data
            shodan = shodan_results.get(asset.ip)
            if shodan:
                asset.ports = shodan.ports
                asset.services = build_services_map(shodan.ports)
                asset.cves = shodan.cves
                asset.tags = shodan.tags
                asset.cpes = shodan.cpes
                # Extract technology names from CPEs
                asset.technologies = _extract_technologies(shodan.cpes)
                total_ports += len(shodan.ports)

            # GeoIP data
            geo = geo_results.get(asset.ip)
            if geo:
                asset.asn = geo.asn
                asset.org = geo.org
                asset.isp = geo.isp
                asset.country = geo.country
                asset.country_code = geo.country_code
                asset.city = geo.city

            # MX records — attach to root domain asset
            if asset.subdomain == domain and mx_records:
                asset.mx_records = mx_records

            # SSL issues count
            if asset.ssl and (asset.ssl.expired or asset.ssl.days_remaining <= 30):
                ssl_issues += 1

        # ── Stage 5: Risk scoring ───────────────────────────────────
        add_log(scan_id, "Calculating risk scores...", "enrich")
        high_risk = 0
        for asset in scan.assets:
            s, level = score_asset(asset)
            asset.risk_score = s
            asset.risk_level = level
            if level in (RiskLevel.HIGH, RiskLevel.CRITICAL):
                high_risk += 1

        # ── Stage 6: Build graph ────────────────────────────────────
        scan.graph = _build_graph(domain, scan.assets)

        # ── Finalize ────────────────────────────────────────────────
        unique_asns = {a.asn for a in scan.assets if a.asn}
        scan.summary.unique_asns = len(unique_asns)
        scan.summary.total_open_ports = total_ports
        scan.summary.ssl_issues = ssl_issues
        scan.summary.high_risk_assets = high_risk

        scan.status = ScanStatus.COMPLETE
        scan.completed_at = datetime.now(timezone.utc).isoformat()

        add_log(
            scan_id,
            f"Scan complete — {scan.summary.total_subdomains} subdomains, "
            f"{scan.summary.unique_ips} IPs, "
            f"{scan.summary.total_open_ports} open ports, "
            f"{scan.summary.high_risk_assets} high-risk assets",
            "success",
        )

    except Exception as exc:
        scan.status = ScanStatus.FAILED
        scan.completed_at = datetime.now(timezone.utc).isoformat()
        add_log(scan_id, f"Scan failed: {exc}", "error")


def _extract_technologies(cpes: list[str]) -> list[str]:
    """Extract human-readable technology names from CPE strings.

    CPE format: cpe:/a:vendor:product:version
    """
    techs: set[str] = set()
    for cpe in cpes:
        parts = cpe.split(":")
        if len(parts) >= 4:
            product = parts[3].replace("_", " ").title()
            if product:
                techs.add(product)
    return sorted(techs)


def _build_graph(domain: str, assets: list[Asset]) -> GraphData:
    """Build D3-compatible force graph from scan results.

    Node hierarchy: domain → subdomains → IPs
    """
    nodes: list[GraphNode] = []
    edges: list[GraphEdge] = []
    seen_nodes: set[str] = set()

    # Root domain node
    domain_id = f"domain:{domain}"
    nodes.append(
        GraphNode(
            id=domain_id,
            label=domain,
            type="domain",
            risk_level=RiskLevel.LOW,
            risk_score=0,
        )
    )
    seen_nodes.add(domain_id)

    for asset in assets:
        # Subdomain node
        sub_id = f"sub:{asset.subdomain}"
        if sub_id not in seen_nodes:
            nodes.append(
                GraphNode(
                    id=sub_id,
                    label=asset.subdomain,
                    type="subdomain",
                    risk_level=asset.risk_level,
                    risk_score=asset.risk_score,
                    metadata={
                        "ip": asset.ip,
                        "ports": asset.ports,
                        "country": asset.country,
                    },
                )
            )
            seen_nodes.add(sub_id)

            # Edge: domain → subdomain
            # Skip edge from domain to itself
            if asset.subdomain != domain:
                edges.append(GraphEdge(source=domain_id, target=sub_id))

        # IP node
        if asset.ip:
            ip_id = f"ip:{asset.ip}"
            if ip_id not in seen_nodes:
                nodes.append(
                    GraphNode(
                        id=ip_id,
                        label=asset.ip,
                        type="ip",
                        metadata={
                            "asn": asset.asn,
                            "org": asset.org,
                            "country": asset.country,
                        },
                    )
                )
                seen_nodes.add(ip_id)

            # Edge: subdomain → IP
            edge_key = (sub_id, ip_id)
            edges.append(GraphEdge(source=sub_id, target=ip_id))

    return GraphData(nodes=nodes, edges=edges)
