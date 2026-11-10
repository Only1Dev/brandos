"""
Terminology Rules Management API.
PRD FR-06: Preferred, Deprecated, and Forbidden Terminology.
"""

from __future__ import annotations

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.terminology import TerminologyRule
from app.models.organization import Organization
from app.models.user import User
from app.middleware.auth import get_optional_user

router = APIRouter(prefix="/terminology", tags=["terminology"])


class TerminologyCreate(BaseModel):
    term: str
    preferred_alternative: str
    status: str = "forbidden"  # preferred | deprecated | forbidden
    category: str = "general"
    context: Optional[str] = None


class TerminologyResponse(BaseModel):
    id: str
    term: str
    preferred_alternative: str
    status: str
    category: str
    context: Optional[str] = None
    is_active: bool


@router.get("", response_model=List[TerminologyResponse])
async def list_terminology(
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    query = select(TerminologyRule).where(TerminologyRule.is_active == True)
    if status_filter:
        query = query.where(TerminologyRule.status == status_filter)
    result = await db.execute(query)
    terms = result.scalars().all()

    return [
        TerminologyResponse(
            id=str(t.id),
            term=t.term,
            preferred_alternative=t.preferred_alternative,
            status=t.status,
            category=t.category,
            context=t.context,
            is_active=t.is_active,
        )
        for t in terms
    ]


@router.post("", response_model=TerminologyResponse)
async def create_terminology(
    body: TerminologyCreate,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    org_res = await db.execute(select(Organization).limit(1))
    org = org_res.scalar_one_or_none()
    if not org:
        org = Organization(name="Default Workspace", slug="default-workspace")
        db.add(org)
        await db.flush()

    rule = TerminologyRule(
        organization_id=user.organization_id if user and user.organization_id else org.id,
        term=body.term,
        preferred_alternative=body.preferred_alternative,
        term_type=body.status,
        context=body.context,
    )
    db.add(rule)
    await db.commit()
    await db.refresh(rule)

    return TerminologyResponse(
        id=str(rule.id),
        term=rule.term,
        preferred_alternative=rule.preferred_alternative,
        status=rule.status,
        category=rule.category,
        context=rule.context,
        is_active=rule.is_active,
    )


@router.delete("/{id}")
async def delete_terminology(id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TerminologyRule).where(TerminologyRule.id == uuid.UUID(id)))
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    rule.is_active = False
    await db.commit()
    return {"status": "success", "message": "Terminology rule deactivated"}
