"""Scan API routes."""

from __future__ import annotations

import asyncio
import re
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from app.auth import optional_verify_token, verify_token
from app.database import get_supabase
from app.models import ScanRequest, ScanResponse, ScanStatus
from app.store import create_scan, get_scan
from app.services.scanner import run_scan


router = APIRouter()

# Basic domain validation pattern
DOMAIN_RE = re.compile(
    r"^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63})*\.[A-Za-z]{2,}$"
)

_RISK_LABELS = [
    (76, "Critical"),
    (51, "High"),
    (26, "Medium"),
    (0,  "Low"),
]


def _risk_label(score: int) -> str:
    for threshold, label in _RISK_LABELS:
        if score >= threshold:
            return label
    return "Low"


async def _run_and_persist(
    scan_id: str,
    supabase_scan_id: Optional[str],
    started_at: datetime,
) -> None:
    """Run scan then persist results to Supabase if a DB record exists."""
    await run_scan(scan_id)

    if not supabase_scan_id:
        return

    scan = get_scan(scan_id)
    if scan is None:
        return

    duration_ms = int(
        (datetime.now(timezone.utc) - started_at).total_seconds() * 1000
    )
    max_risk = max((a.risk_score for a in scan.assets), default=0)
    cve_count = sum(len(a.cves) for a in scan.assets)

    print(f"DEBUG: attempting DB update for supabase_scan_id = {supabase_scan_id}")
    try:
        db = get_supabase()
        result = db.table("scans").update(
            {
                "status": scan.status.value,
                "result_json": scan.model_dump(mode="json"),
                "subdomain_count": scan.summary.total_subdomains,
                "open_ports_count": scan.summary.total_open_ports,
                "cve_count": cve_count,
                "risk_score": max_risk,
                "risk_label": _risk_label(max_risk),
                "scan_duration_ms": duration_ms,
                "completed_at": datetime.now(timezone.utc).isoformat(),
            }
        ).eq("id", supabase_scan_id).execute()
        print(f"DEBUG: update result = {result.data}")
        print(f"DEBUG: update error = {result.error if hasattr(result, 'error') else 'N/A'}")
    except Exception as e:
        print(f"DEBUG: Exception during insert: {str(e)}")
        pass  # Don't fail the scan if persistence fails


@router.post("/scan", response_model=ScanResponse)
async def start_scan(
    request: ScanRequest,
    token: Optional[dict] = Depends(optional_verify_token),
):
    """Start a new attack surface scan for the given domain.

    Returns a scan ID immediately. The scan runs as a background task.
    Poll GET /api/scan/{scan_id} for progressive results.
    """
    domain = request.domain.strip().lower()
    domain = re.sub(r"^https?://", "", domain)
    domain = domain.rstrip("/")

    if not DOMAIN_RE.match(domain):
        raise HTTPException(status_code=400, detail="Invalid domain format")

    scan = create_scan(domain)
    started_at = datetime.now(timezone.utc)

    supabase_scan_id: Optional[str] = None
    if token:
        user_id = token.get("sub")
        print(f"DEBUG: user_id = {user_id}")
        print(f"DEBUG: attempting DB insert for domain = {domain}")
        try:
            db = get_supabase()
            resp = (
                db.table("scans")
                .insert({"user_id": user_id, "domain": domain, "status": "running"})
                .execute()
            )
            print(f"DEBUG: insert result = {resp.data}")
            print(f"DEBUG: insert error = {resp.error if hasattr(resp, 'error') else 'N/A'}")
            supabase_scan_id = resp.data[0]["id"]
        except Exception as e:
            print(f"DEBUG: Exception during insert: {str(e)}")
            pass  # Continue without persistence if DB unavailable

    asyncio.create_task(
        _run_and_persist(scan.scan_id, supabase_scan_id, started_at)
    )

    return ScanResponse(
        scan_id=scan.scan_id,
        domain=scan.domain,
        status=scan.status,
    )


@router.get("/scan/{scan_id}")
async def get_scan_status(scan_id: str):
    """Get current scan status and results from in-memory store.

    Returns the full scan object including progressively updated assets.
    Poll every 2s while status is 'running'.
    """
    scan = get_scan(scan_id)
    if scan is None:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan


@router.get("/scan/{scan_id}/graph")
async def get_scan_graph(scan_id: str):
    """Get graph data formatted for D3.js force simulation."""
    scan = get_scan(scan_id)
    if scan is None:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan.graph


# ── Supabase-backed endpoints ─────────────────────────────────────────────────

@router.get("/scans/history")
async def get_scan_history(token: dict = Depends(verify_token)):
    """Return the authenticated user's scan history (most recent 50)."""
    user_id = token.get("sub")
    try:
        db = get_supabase()
        resp = (
            db.table("scans")
            .select(
                "id,domain,status,risk_score,risk_label,"
                "subdomain_count,open_ports_count,cve_count,"
                "scan_duration_ms,created_at,completed_at"
            )
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(50)
            .execute()
        )
        return resp.data
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/scans/{scan_id}")
async def get_scan_from_db(scan_id: str, token: dict = Depends(verify_token)):
    """Fetch a completed scan record (including full result_json) from Supabase."""
    user_id = token.get("sub")
    try:
        db = get_supabase()
        resp = (
            db.table("scans")
            .select("*")
            .eq("id", scan_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        if not resp.data:
            raise HTTPException(status_code=404, detail="Scan not found")
        return resp.data
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
