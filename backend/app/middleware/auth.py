"""
Supabase JWT verification middleware.
Extracts user from the Authorization Bearer token.
"""

from __future__ import annotations

import uuid
from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models.user import User

security = HTTPBearer(auto_error=False)
settings = get_settings()


async def _decode_token(token: str) -> dict:
    """Decode and verify a Supabase JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
            options={"verify_aud": False},
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """FastAPI dependency: extracts and validates the current user from JWT."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = await _decode_token(credentials.credentials)
    auth_id = payload.get("sub")
    if not auth_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing 'sub' claim",
        )

    result = await db.execute(select(User).where(User.auth_id == auth_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please complete registration.",
        )

    # Attach user to request state for downstream use
    request.state.user = user
    return user


async def get_optional_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Returns user from JWT or from prototype demo headers (X-User-Role / X-Brand-Slug)."""
    if credentials is not None:
        try:
            payload = await _decode_token(credentials.credentials)
            auth_id = payload.get("sub")
            if auth_id:
                result = await db.execute(select(User).where(User.auth_id == auth_id))
                u = result.scalar_one_or_none()
                if u:
                    return u
        except HTTPException:
            pass

    # Check demo identity headers
    user_email = request.headers.get("x-user-email")
    user_role = request.headers.get("x-user-role")
    brand_slug = request.headers.get("x-brand-slug")

    if user_email:
        u_res = await db.execute(select(User).where(User.email == user_email))
        u = u_res.scalar_one_or_none()
        if u:
            return u

    if user_role:
        from app.models.organization import Organization
        query = select(User).where(User.role == user_role)
        if brand_slug and user_role != "superadmin":
            org_res = await db.execute(select(Organization).where(Organization.slug == brand_slug))
            org = org_res.scalar_one_or_none()
            if org:
                query = query.where(User.organization_id == org.id)
        u_res = await db.execute(query)
        user = u_res.scalars().first()
        if user:
            return user

    return None
