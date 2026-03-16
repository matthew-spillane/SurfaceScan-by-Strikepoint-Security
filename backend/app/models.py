from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ScanStatus(str, Enum):
    RUNNING = "running"
    COMPLETE = "complete"
    FAILED = "failed"


class SSLInfo(BaseModel):
    issuer: str = ""
    subject: str = ""
    expires: str = ""
    days_remaining: int = 0
    expired: bool = False
    valid: bool = True
    sans: list[str] = Field(default_factory=list)


class MXRecord(BaseModel):
    priority: int
    exchange: str


class Asset(BaseModel):
    subdomain: str
    ip: str = ""
    asn: str = ""
    org: str = ""
    isp: str = ""
    country: str = ""
    country_code: str = ""
    city: str = ""
    ports: list[int] = Field(default_factory=list)
    services: dict[int, str] = Field(default_factory=dict)
    technologies: list[str] = Field(default_factory=list)
    cpes: list[str] = Field(default_factory=list)
    cves: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    ssl: Optional[SSLInfo] = None
    mx_records: list[MXRecord] = Field(default_factory=list)
    dns_type: str = "A"
    risk_score: int = 0
    risk_level: RiskLevel = RiskLevel.LOW


class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # "domain", "subdomain", "ip"
    risk_level: RiskLevel = RiskLevel.LOW
    risk_score: int = 0
    metadata: dict = Field(default_factory=dict)


class GraphEdge(BaseModel):
    source: str
    target: str


class GraphData(BaseModel):
    nodes: list[GraphNode] = Field(default_factory=list)
    edges: list[GraphEdge] = Field(default_factory=list)


class LogLine(BaseModel):
    timestamp: str
    message: str
    level: str = "info"  # info, discovery, resolve, enrich, error, success


class ScanSummary(BaseModel):
    total_subdomains: int = 0
    unique_ips: int = 0
    unique_asns: int = 0
    total_open_ports: int = 0
    ssl_issues: int = 0
    high_risk_assets: int = 0


class ScanResult(BaseModel):
    scan_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    domain: str
    status: ScanStatus = ScanStatus.RUNNING
    started_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    completed_at: Optional[str] = None
    summary: ScanSummary = Field(default_factory=ScanSummary)
    assets: list[Asset] = Field(default_factory=list)
    graph: GraphData = Field(default_factory=GraphData)
    log: list[LogLine] = Field(default_factory=list)


class ScanRequest(BaseModel):
    domain: str


class ScanResponse(BaseModel):
    scan_id: str
    domain: str
    status: ScanStatus
