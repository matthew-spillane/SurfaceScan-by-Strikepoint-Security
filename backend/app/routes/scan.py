"""Scan API routes."""

from __future__ import annotations

import asyncio
import re

from fastapi import APIRouter, HTTPException

from app.models import ScanRequest, ScanResponse, ScanStatus
from app.store import create_scan, get_scan
from app.services.scanner import run_scan


router = APIRouter()

# Basic domain validation pattern
DOMAIN_RE = re.compile(
    r"^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63})*\.[A-Za-z]{2,}$"
)


@router.post("/scan", response_model=ScanResponse)
async def start_scan(request: ScanRequest):
    """Start a new attack surface scan for the given domain.

    Returns a scan ID immediately. The scan runs as a background task.
    Poll GET /scan/{scan_id} for progressive results.
    """
    domain = request.domain.strip().lower()

    # Strip protocol if accidentally included
    domain = re.sub(r"^https?://", "", domain)
    domain = domain.rstrip("/")

    if not DOMAIN_RE.match(domain):
        raise HTTPException(status_code=400, detail="Invalid domain format")

    scan = create_scan(domain)

    # Launch scan as background task (not tied to request lifecycle)
    asyncio.create_task(run_scan(scan.scan_id))

    return ScanResponse(
        scan_id=scan.scan_id,
        domain=scan.domain,
        status=scan.status,
    )


@router.get("/scan/{scan_id}")
async def get_scan_status(scan_id: str):
    """Get current scan status, results, and log.

    Returns the full scan object including progressively updated assets.
    """
    scan = get_scan(scan_id)
    if scan is None:
        raise HTTPException(status_code=404, detail="Scan not found")

    return scan


@router.get("/scan/{scan_id}/graph")
async def get_scan_graph(scan_id: str):
    """Get graph data formatted for D3.js force simulation.

    Returns {nodes: [...], edges: [...]} for the scan's network graph.
    """
    scan = get_scan(scan_id)
    if scan is None:
        raise HTTPException(status_code=404, detail="Scan not found")

    return scan.graph
