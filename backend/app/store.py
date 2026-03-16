"""In-memory scan store. Scans are ephemeral — no database needed for v1."""

from __future__ import annotations

from datetime import datetime, timezone

from app.models import LogLine, ScanResult


_scans: dict[str, ScanResult] = {}


def create_scan(domain: str) -> ScanResult:
    scan = ScanResult(domain=domain)
    _scans[scan.scan_id] = scan
    return scan


def get_scan(scan_id: str) -> ScanResult | None:
    return _scans.get(scan_id)


def add_log(scan_id: str, message: str, level: str = "info") -> None:
    scan = _scans.get(scan_id)
    if scan is None:
        return
    ts = datetime.now(timezone.utc).strftime("%H:%M:%S")
    scan.log.append(LogLine(timestamp=ts, message=message, level=level))
