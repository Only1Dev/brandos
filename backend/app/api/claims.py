"""
Claims lifecycle management API.
PRD FR-05 & FR-26: Claim Lifecycle Management and Claim Expiration.
"""

from __future__ import annotations

import uuid
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.claim import Claim
from app.models.user import User
from app.models.organization import Organization
from app.middleware.auth import get_optional_user

router = APIRouter(prefix="/claims", tags=["claims"])


class ClaimCreate(BaseModel):
    statement: str
    category: str = "marketing"
    valid_from: Optional[date] = None
    valid_until: Optional[date] = None


class ClaimUpdate(BaseModel):
    status: Optional[str] = None
    statement: Optional[str] = None
    valid_until: Optional[date] = None


class ClaimResponse(BaseModel):
    id: str
    statement: str
    category: str
    status: str
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    is_expired: bool


@router.get("", response_model=List[ClaimResponse])
async def list_claims(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    query = select(Claim)
    if status:
        query = query.where(Claim.status == status)
    result = await db.execute(query)
    claims = result.scalars().all()

    return [
        ClaimResponse(
            id=str(c.id),
            statement=c.statement,
            category=c.category,
            status=c.status,
            valid_from=c.valid_from.isoformat() if c.valid_from else None,
            valid_until=c.valid_until.isoformat() if c.valid_until else None,
            is_expired=c.is_expired,
        )
        for c in claims
    ]


@router.post("", response_model=ClaimResponse)
async def create_claim(
    body: ClaimCreate,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    org_res = await db.execute(select(Organization).limit(1))
    org = org_res.scalar_one_or_none()
    if not org:
        org = Organization(name="Default Workspace", slug="default-workspace")
        db.add(org)
        await db.flush()

    claim = Claim(
        organization_id=user.organization_id if user and user.organization_id else org.id,
        claim_text=body.statement,
        category=body.category,
        status="under_review",
    )
    db.add(claim)
    await db.commit()
    await db.refresh(claim)

    return ClaimResponse(
        id=str(claim.id),
        statement=claim.statement,
        category=claim.category,
        status=claim.status,
        valid_from=claim.valid_from.isoformat() if claim.valid_from else None,
        valid_until=claim.valid_until.isoformat() if claim.valid_until else None,
        is_expired=claim.is_expired,
    )


@router.patch("/{id}/transition")
async def transition_claim(
    id: str,
    new_status: str,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    """Transition claim status (draft -> submitted -> approved -> active -> archived)."""
    result = await db.execute(select(Claim).where(Claim.id == uuid.UUID(id)))
    claim = result.scalar_one_or_none()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    claim.status = new_status
    await db.commit()
    return {"id": str(claim.id), "new_status": claim.status}
