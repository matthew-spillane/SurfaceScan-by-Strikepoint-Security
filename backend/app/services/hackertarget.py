"""HackerTarget API client for additional subdomain enumeration."""

from __future__ import annotations

import httpx


async def query_hackertarget(domain: str, timeout: float = 10.0) -> list[str]:
    """Query HackerTarget hostsearch API for subdomains.

    Returns a deduplicated, sorted list of subdomains.
    The API returns CSV lines: subdomain,ip
    """
    url = "https://api.hackertarget.com/hostsearch/"
    params = {"q": domain}

    try:
        async with httpx.AsyncClient(
            timeout=timeout, follow_redirects=True
        ) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            text = resp.text.strip()
    except httpx.HTTPError:
        return []

    if not text or "error" in text.lower() or "API count exceeded" in text:
        return []

    subdomains: set[str] = set()

    for line in text.split("\n"):
        line = line.strip()
        if not line or "," not in line:
            continue
        parts = line.split(",", 1)
        name = parts[0].strip().lower()
        if name and name.endswith(f".{domain}") or name == domain:
            subdomains.add(name)

    return sorted(subdomains)
