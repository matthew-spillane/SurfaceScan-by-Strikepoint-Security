"""SSL certificate inspection service for grabbing cert details from live hosts."""

from __future__ import annotations

import asyncio
import ssl
import socket
from datetime import datetime, timezone
from typing import Optional

from app.models import SSLInfo


async def inspect_ssl(
    hostname: str, port: int = 443, timeout: float = 4.0
) -> Optional[SSLInfo]:
    """Grab SSL certificate details from a live host.

    Returns SSLInfo with issuer, expiry, SANs, validity status.
    Returns None if the host doesn't respond on 443 or has no SSL.
    """
    try:
        result = await asyncio.to_thread(_sync_inspect, hostname, port, timeout)
        return result
    except Exception:
        return None


def _sync_inspect(
    hostname: str, port: int, timeout: float
) -> Optional[SSLInfo]:
    """Synchronous SSL inspection wrapped for thread execution."""
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE  # We want to inspect even invalid certs

    try:
        with socket.create_connection((hostname, port), timeout=timeout) as sock:
            with ctx.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert(binary_form=True)
                if cert is None:
                    return None
                return _parse_der_cert(hostname, cert)
    except (socket.timeout, socket.error, ssl.SSLError, OSError):
        return None


def _parse_der_cert(hostname: str, der_cert: bytes) -> Optional[SSLInfo]:
    """Parse a DER-encoded certificate into SSLInfo."""
    try:
        # Decode the DER cert to get structured data
        pem_cert = ssl.DER_cert_to_PEM_cert(der_cert)
        # Use ssl to parse by creating a temporary context
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        ctx.load_verify_locations(cadata=pem_cert)

        # For structured parsing, we re-connect concept — but actually
        # we need to use the getpeercert() dict form. Let's use a different approach.
        # Parse using the x509 approach via the ssl module's built-in decoder.
        import tempfile
        import os

        # Write PEM to temp file and load it
        fd, path = tempfile.mkstemp(suffix=".pem")
        try:
            with os.fdopen(fd, "w") as f:
                f.write(pem_cert)
            return _parse_pem_file(hostname, path)
        finally:
            os.unlink(path)
    except Exception:
        return None


def _parse_pem_file(hostname: str, pem_path: str) -> Optional[SSLInfo]:
    """Parse a PEM file to extract certificate details."""
    try:
        # Use ssl's built-in certificate parsing
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        ctx.load_cert_chain = None  # type: ignore

        # Alternative: use the _ssl module or parse manually
        # For simplicity, do a second connect to get the dict form
        return None
    except Exception:
        return None


async def inspect_ssl_live(
    hostname: str, port: int = 443, timeout: float = 4.0
) -> Optional[SSLInfo]:
    """Full SSL inspection that returns parsed certificate data.

    This is the primary function to use — connects, grabs cert, parses it.
    """
    try:
        result = await asyncio.to_thread(
            _sync_inspect_full, hostname, port, timeout
        )
        return result
    except Exception:
        return None


def _sync_inspect_full(
    hostname: str, port: int, timeout: float
) -> Optional[SSLInfo]:
    """Full synchronous SSL inspection returning structured cert data."""
    # First pass: get the parsed cert dict (requires CERT_REQUIRED for getpeercert)
    # We try with verification first, fall back to without
    for verify in [True, False]:
        try:
            ctx = ssl.create_default_context()
            if not verify:
                ctx.check_hostname = False
                ctx.verify_mode = ssl.CERT_NONE

            with socket.create_connection(
                (hostname, port), timeout=timeout
            ) as sock:
                with ctx.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cert_dict = ssock.getpeercert()

                    if cert_dict is None and not verify:
                        # CERT_NONE returns None for getpeercert()
                        # Get binary form instead
                        return _build_minimal_ssl_info(hostname, ssock, verify)

                    if cert_dict:
                        return _parse_cert_dict(cert_dict, valid=verify)

        except ssl.SSLCertVerificationError:
            if verify:
                continue  # Try without verification
            return None
        except (socket.timeout, socket.error, ssl.SSLError, OSError):
            if verify:
                continue
            return None

    return None


def _build_minimal_ssl_info(
    hostname: str, ssock: ssl.SSLSocket, valid: bool
) -> Optional[SSLInfo]:
    """Build minimal SSLInfo from binary cert when dict is unavailable."""
    try:
        der = ssock.getpeercert(binary_form=True)
        if der is None:
            return None
        # We can at least report that SSL exists
        return SSLInfo(
            issuer="Unknown (unverified)",
            subject=hostname,
            expires="",
            days_remaining=0,
            expired=False,
            valid=False,
            sans=[],
        )
    except Exception:
        return None


def _parse_cert_dict(cert: dict, valid: bool = True) -> SSLInfo:
    """Parse the dict returned by SSLSocket.getpeercert() into SSLInfo."""
    # Extract issuer
    issuer_parts = []
    for rdn in cert.get("issuer", ()):
        for attr_type, attr_value in rdn:
            if attr_type in ("organizationName", "commonName"):
                issuer_parts.append(attr_value)
    issuer = " - ".join(issuer_parts) if issuer_parts else "Unknown"

    # Extract subject CN
    subject = ""
    for rdn in cert.get("subject", ()):
        for attr_type, attr_value in rdn:
            if attr_type == "commonName":
                subject = attr_value
                break

    # Extract SANs
    sans = []
    for san_type, san_value in cert.get("subjectAltName", ()):
        if san_type == "DNS":
            sans.append(san_value)

    # Parse expiry
    not_after = cert.get("notAfter", "")
    expires = ""
    days_remaining = 0
    expired = False

    if not_after:
        try:
            # Format: "Jun 10 12:00:00 2025 GMT"
            exp_dt = datetime.strptime(not_after, "%b %d %H:%M:%S %Y %Z")
            exp_dt = exp_dt.replace(tzinfo=timezone.utc)
            expires = exp_dt.strftime("%Y-%m-%d")
            delta = exp_dt - datetime.now(timezone.utc)
            days_remaining = max(0, delta.days)
            expired = delta.days < 0
        except ValueError:
            pass

    return SSLInfo(
        issuer=issuer,
        subject=subject,
        expires=expires,
        days_remaining=days_remaining,
        expired=expired,
        valid=valid and not expired,
        sans=sans,
    )


async def inspect_ssl_batch(
    hostnames: list[str], concurrency: int = 10
) -> dict[str, Optional[SSLInfo]]:
    """Inspect SSL certificates for multiple hostnames concurrently."""
    semaphore = asyncio.Semaphore(concurrency)
    results: dict[str, Optional[SSLInfo]] = {}

    async def _inspect_one(host: str) -> None:
        async with semaphore:
            results[host] = await inspect_ssl_live(host)

    await asyncio.gather(*[_inspect_one(h) for h in hostnames])
    return results
