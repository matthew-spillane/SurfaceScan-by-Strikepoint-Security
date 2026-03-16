"""Risk scoring engine for discovered assets.

Scoring rules:
  - Open port 21 (FTP): +20
  - Open port 23 (Telnet): +30
  - Open port 3389 (RDP): +25
  - Open port 445 (SMB): +25
  - Any CVE present: +30
  - SSL expired: +20
  - SSL expiring within 30 days: +10
  - Shodan tag "self-signed": +15
  - Hosted in sanctioned country: +25

Risk levels:
  - 0-25: low
  - 26-50: medium
  - 51-75: high
  - 76-100: critical
"""

from __future__ import annotations

from app.models import Asset, RiskLevel


RISKY_PORTS: dict[int, int] = {
    21: 20,    # FTP
    23: 30,    # Telnet
    3389: 25,  # RDP
    445: 25,   # SMB
}

# OFAC / commonly sanctioned country codes
SANCTIONED_COUNTRIES: set[str] = {
    "CU",  # Cuba
    "IR",  # Iran
    "KP",  # North Korea
    "SY",  # Syria
    "RU",  # Russia (partial)
}


def score_asset(asset: Asset) -> tuple[int, RiskLevel]:
    """Calculate risk score and level for a single asset.

    Returns (score, risk_level). Score is capped at 100.
    """
    score = 0

    # Port-based scoring
    for port in asset.ports:
        if port in RISKY_PORTS:
            score += RISKY_PORTS[port]

    # CVE presence
    if asset.cves:
        score += 30

    # SSL issues
    if asset.ssl is not None:
        if asset.ssl.expired:
            score += 20
        elif 0 < asset.ssl.days_remaining <= 30:
            score += 10

    # Self-signed certificate tag
    if "self-signed" in asset.tags:
        score += 15

    # Sanctioned country hosting
    if asset.country_code.upper() in SANCTIONED_COUNTRIES:
        score += 25

    # Cap at 100
    score = min(score, 100)

    # Determine risk level
    if score <= 25:
        level = RiskLevel.LOW
    elif score <= 50:
        level = RiskLevel.MEDIUM
    elif score <= 75:
        level = RiskLevel.HIGH
    else:
        level = RiskLevel.CRITICAL

    return score, level
