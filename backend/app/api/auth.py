"""
Authentication endpoints.
Supabase handles the core auth; these endpoints sync user profiles and orgs in PostgreSQL.
"""

from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.organization import Organization
from app.models.user import User
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterUserRequest(BaseModel):
    auth_id: str
    email: str
    full_name: Optional[str] = None
    organization_name: Optional[str] = "Default Workspace"
    role: Optional[str] = "admin"


class UserProfileResponse(BaseModel):
    id: str
    auth_id: str
    email: str
    full_name: Optional[str] = None
    role: str
    organization_id: Optional[str] = None
    organization_name: Optional[str] = None


@router.post("/register", response_model=UserProfileResponse)
async def register_user(
    body: RegisterUserRequest,
    db: AsyncSession = Depends(get_db),
):
    """Sync a newly registered Supabase user into the local database and provision their org."""
    existing = await db.execute(select(User).where(User.auth_id == body.auth_id))
    user = existing.scalar_one_or_none()
    if user:
        return UserProfileResponse(
            id=str(user.id),
            auth_id=user.auth_id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            organization_id=str(user.organization_id) if user.organization_id else None,
        )

    # Create new Organization if specified
    org = Organization(
        name=body.organization_name or "My Brand Organization",
        slug=(body.organization_name or "my-brand").lower().replace(" ", "-") + "-" + uuid.uuid4().hex[:6],
    )
    db.add(org)
    await db.flush()

    user = User(
        auth_id=body.auth_id,
        email=body.email,
        full_name=body.full_name or body.email.split("@")[0],
        role=body.role or "admin",
        organization_id=org.id,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return UserProfileResponse(
        id=str(user.id),
        auth_id=user.auth_id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        organization_id=str(org.id),
        organization_name=org.name,
    )


@router.get("/me", response_model=UserProfileResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve current user profile with org details."""
    org_name = None
    if current_user.organization_id:
        org_res = await db.execute(select(Organization).where(Organization.id == current_user.organization_id))
        org = org_res.scalar_one_or_none()
        if org:
            org_name = org.name

    return UserProfileResponse(
        id=str(current_user.id),
        auth_id=current_user.auth_id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        organization_id=str(current_user.organization_id) if current_user.organization_id else None,
        organization_name=org_name,
    )
