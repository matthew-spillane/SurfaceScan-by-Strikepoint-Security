"""Shodan InternetDB client for port/CVE/technology enrichment per IP."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field

import httpx


@dataclass
class ShodanResult:
    ip: str
    ports: list[int] = field(default_factory=list)
    cves: list[str] = field(default_factory=list)
    hostnames: list[str] = field(default_factory=list)
    tags: list[str] = field(default_factory=list)
    cpes: list[str] = field(default_factory=list)


# Common port-to-service mapping for display
PORT_SERVICES: dict[int, str] = {
    21: "FTP",
    22: "SSH",
    23: "Telnet",
    25: "SMTP",
    53: "DNS",
    80: "HTTP",
    110: "POP3",
    143: "IMAP",
    443: "HTTPS",
    445: "SMB",
    465: "SMTPS",
    587: "Submission",
    993: "IMAPS",
    995: "POP3S",
    1433: "MSSQL",
    1521: "Oracle",
    3306: "MySQL",
    3389: "RDP",
    5432: "PostgreSQL",
    5900: "VNC",
    6379: "Redis",
    8080: "HTTP-Alt",
    8443: "HTTPS-Alt",
    8888: "HTTP-Alt",
    9200: "Elasticsearch",
    27017: "MongoDB",
}


async def query_shodan(ip: str, timeout: float = 8.0) -> ShodanResult:
    """Query Shodan InternetDB for a single IP address.

    Returns enrichment data: open ports, CVEs, tags, CPEs, hostnames.
    """
    url = f"https://internetdb.shodan.io/{ip}"

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.get(url)
            if resp.status_code == 404:
                # IP not found in Shodan — not an error, just no data
                return ShodanResult(ip=ip)
            resp.raise_for_status()
            data = resp.json()
    except (httpx.HTTPError, ValueError):
        return ShodanResult(ip=ip)

    return ShodanResult(
        ip=ip,
        ports=data.get("ports", []),
        cves=data.get("vulns", []),
        hostnames=data.get("hostnames", []),
        tags=data.get("tags", []),
        cpes=data.get("cpes", []),
    )


def get_service_name(port: int) -> str:
    """Map a port number to its common service name."""
    return PORT_SERVICES.get(port, f"port-{port}")


def build_services_map(ports: list[int]) -> dict[int, str]:
    """Build a port -> service name mapping."""
    return {p: get_service_name(p) for p in ports}


async def query_shodan_batch(
    ips: list[str], concurrency: int = 10
) -> dict[str, ShodanResult]:
    """Query Shodan InternetDB for multiple IPs with concurrency control."""
    semaphore = asyncio.Semaphore(concurrency)
    results: dict[str, ShodanResult] = {}

    async def _query_one(ip: str) -> None:
        async with semaphore:
            results[ip] = await query_shodan(ip)

    await asyncio.gather(*[_query_one(ip) for ip in ips])
    return results
