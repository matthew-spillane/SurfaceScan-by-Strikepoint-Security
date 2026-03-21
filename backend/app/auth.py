import os
from typing import Optional
from fastapi import Header, HTTPException, status
from jose import jwt, JWTError

SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "")


def verify_token(authorization: Optional[str] = Header(default=None)) -> dict:
    """Verify Supabase JWT and return the decoded payload."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )
    token = authorization.removeprefix("Bearer ").strip()
    if not SUPABASE_JWT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_JWT_SECRET not configured",
        )
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        return payload
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        )


def optional_verify_token(
    authorization: Optional[str] = Header(default=None),
) -> Optional[dict]:
    """Like verify_token but returns None instead of raising for unauthenticated requests."""
    if not authorization:
        return None
    try:
        return verify_token(authorization)
    except HTTPException:
        return None
