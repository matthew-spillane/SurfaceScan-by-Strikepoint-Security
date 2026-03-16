"""crt.sh certificate transparency log client for subdomain enumeration."""

from __future__ import annotations

import httpx


async def query_crtsh(domain: str, timeout: float = 15.0) -> list[str]:
    """Query crt.sh for subdomains via certificate transparency logs.

    Returns a deduplicated, sorted list of valid subdomains for the given domain.
    """
    url = "https://crt.sh/"
    params = {"q": f"%.{domain}", "output": "json"}

    try:
        async with httpx.AsyncClient(
            timeout=timeout, follow_redirects=True
        ) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            entries = resp.json()
    except (httpx.HTTPError, ValueError):
        return []

    subdomains: set[str] = set()

    for entry in entries:
        name_value = entry.get("name_value", "")
        for name in name_value.split("\n"):
            name = name.strip().lower()
            # Skip wildcards, empty, and entries not under our domain
            if not name or name.startswith("*") or not name.endswith(f".{domain}"):
                continue
            # Basic validation: no spaces, reasonable length
            if " " in name or len(name) > 253:
                continue
            subdomains.add(name)

    # Always include the root domain itself
    subdomains.add(domain)

    return sorted(subdomains)
