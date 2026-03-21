"""Strikepoint SurfaceScan — FastAPI backend entry point."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.scan import router as scan_router

app = FastAPI(
    title="Strikepoint SurfaceScan",
    description="Attack Surface Discovery Platform API",
    version="1.0.0",
)

# CORS — allow frontend origins (Vercel + local dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://surfacescan.strikepointsec.com",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scan_router, prefix="/api", tags=["scan"])


@app.get("/health")
async def health():
    """Health check endpoint for Railway."""
    return {"status": "ok", "service": "surfacescan"}


@app.get("/debug/env")
async def debug_env():
    import os
    return {
        "SUPABASE_URL": "set" if os.environ.get("SUPABASE_URL") else "MISSING",
        "SUPABASE_SERVICE_ROLE_KEY": "set" if os.environ.get("SUPABASE_SERVICE_ROLE_KEY") else "MISSING",
        "SUPABASE_JWT_SECRET": "set" if os.environ.get("SUPABASE_JWT_SECRET") else "MISSING",
    }
