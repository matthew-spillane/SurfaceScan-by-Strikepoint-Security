"""Google DNS API client for MX record lookups."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass

import httpx

from app.models import MXRecord


DNS_URL = "https://dns.google/resolve"


async def query_mx_records(
    domain: str, timeout: float = 8.0
) -> list[MXRecord]:
    """Query Google DNS for MX records of a domain.

    Returns a sorted list of MXRecord(priority, exchange).
    """
    params = {"name": domain, "type": "MX"}

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.get(DNS_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
    except (httpx.HTTPError, ValueError):
        return []

    if data.get("Status") != 0:
        return []

    records: list[MXRecord] = []

    for answer in data.get("Answer", []):
        # MX type is 15
        if answer.get("type") != 15:
            continue
        raw = answer.get("data", "")
        # Format: "10 mail.example.com."
        parts = raw.split(" ", 1)
        if len(parts) != 2:
            continue
        try:
            priority = int(parts[0])
        except ValueError:
            continue
        exchange = parts[1].rstrip(".")
        records.append(MXRecord(priority=priority, exchange=exchange))

    return sorted(records, key=lambda r: r.priority)


async def query_mx_batch(
    domains: list[str], concurrency: int = 10
) -> dict[str, list[MXRecord]]:
    """Query MX records for multiple domains concurrently."""
    semaphore = asyncio.Semaphore(concurrency)
    results: dict[str, list[MXRecord]] = {}

    async def _query_one(domain: str) -> None:
        async with semaphore:
            results[domain] = await query_mx_records(domain)

    await asyncio.gather(*[_query_one(d) for d in domains])
    return results
