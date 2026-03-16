"""ip-api.com geolocation service with batch support."""

from __future__ import annotations

from dataclasses import dataclass

import httpx


@dataclass
class GeoIPResult:
    ip: str
    country: str = ""
    country_code: str = ""
    city: str = ""
    isp: str = ""
    org: str = ""
    asn: str = ""


# ip-api.com free tier: 45 requests/minute for single, batch up to 100 IPs
BATCH_URL = "http://ip-api.com/batch"
BATCH_SIZE = 100


async def query_geoip_batch(
    ips: list[str], timeout: float = 10.0
) -> dict[str, GeoIPResult]:
    """Query ip-api.com batch endpoint for geolocation data.

    Processes IPs in chunks of 100 (API limit).
    Returns a dict mapping IP -> GeoIPResult.
    """
    results: dict[str, GeoIPResult] = {}

    for i in range(0, len(ips), BATCH_SIZE):
        chunk = ips[i : i + BATCH_SIZE]
        chunk_results = await _query_batch_chunk(chunk, timeout)
        results.update(chunk_results)

    return results


async def _query_batch_chunk(
    ips: list[str], timeout: float
) -> dict[str, GeoIPResult]:
    """Query a single batch chunk of up to 100 IPs."""
    payload = [
        {"query": ip, "fields": "query,country,countryCode,city,isp,org,as"}
        for ip in ips
    ]

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(BATCH_URL, json=payload)
            resp.raise_for_status()
            data = resp.json()
    except (httpx.HTTPError, ValueError):
        return {ip: GeoIPResult(ip=ip) for ip in ips}

    results: dict[str, GeoIPResult] = {}

    for entry in data:
        ip = entry.get("query", "")
        if not ip:
            continue

        # Parse ASN from the "as" field (e.g. "AS15169 Google LLC")
        as_field = entry.get("as", "")
        asn = as_field.split(" ", 1)[0] if as_field else ""

        results[ip] = GeoIPResult(
            ip=ip,
            country=entry.get("country", ""),
            country_code=entry.get("countryCode", ""),
            city=entry.get("city", ""),
            isp=entry.get("isp", ""),
            org=entry.get("org", ""),
            asn=asn,
        )

    # Fill in any IPs that weren't in the response
    for ip in ips:
        if ip not in results:
            results[ip] = GeoIPResult(ip=ip)

    return results
