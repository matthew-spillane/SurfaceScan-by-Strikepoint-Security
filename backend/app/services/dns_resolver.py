"""DNS resolution service using dnspython for async A record lookups."""

from __future__ import annotations

import asyncio
from typing import Optional

import dns.resolver


async def resolve_domain(subdomain: str, timeout: float = 5.0) -> Optional[str]:
    """Resolve a subdomain to its A record IP address.

    Returns the first A record IP or None if resolution fails.
    """
    try:
        result = await asyncio.to_thread(_sync_resolve, subdomain, timeout)
        return result
    except Exception:
        return None


def _sync_resolve(subdomain: str, timeout: float) -> Optional[str]:
    """Synchronous DNS resolution wrapped for thread execution."""
    try:
        resolver = dns.resolver.Resolver()
        resolver.timeout = timeout
        resolver.lifetime = timeout
        resolver.nameservers = ["8.8.8.8", "8.8.4.4", "1.1.1.1"]

        answers = resolver.resolve(subdomain, "A")
        for rdata in answers:
            return str(rdata)
    except (
        dns.resolver.NXDOMAIN,
        dns.resolver.NoAnswer,
        dns.resolver.NoNameservers,
        dns.resolver.Timeout,
        dns.exception.DNSException,
    ):
        return None
    return None


async def resolve_batch(
    subdomains: list[str], concurrency: int = 20
) -> dict[str, Optional[str]]:
    """Resolve multiple subdomains concurrently.

    Returns a dict mapping subdomain -> IP (or None).
    """
    semaphore = asyncio.Semaphore(concurrency)
    results: dict[str, Optional[str]] = {}

    async def _resolve_one(sub: str) -> None:
        async with semaphore:
            ip = await resolve_domain(sub)
            results[sub] = ip

    await asyncio.gather(*[_resolve_one(s) for s in subdomains])
    return results
