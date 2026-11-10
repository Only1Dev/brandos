"""
Approved Facts Management API.
PRD FR-04: Approved Facts & Versioning.
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
from app.models.fact import Fact
from app.models.user import User
from app.models.organization import Organization
from app.middleware.auth import get_optional_user

router = APIRouter(prefix="/facts", tags=["facts"])


class FactCreate(BaseModel):
    statement: str
    category: str = "general"
    source: Optional[str] = None
    numerical_value: Optional[float] = None
    numerical_unit: Optional[str] = None
    valid_from: Optional[date] = None
    valid_until: Optional[date] = None


class FactResponse(BaseModel):
    id: str
    statement: str
    category: str
    source: Optional[str] = None
    numerical_value: Optional[float] = None
    numerical_unit: Optional[str] = None
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    is_active: bool
    is_expired: bool


@router.get("", response_model=List[FactResponse])
async def list_facts(
    category: Optional[str] = None,
    brand: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    query = select(Fact).where(Fact.is_active == True)
    
    target_org_id = None
    if brand:
        org_res = await db.execute(select(Organization).where(Organization.slug == brand))
        target_org = org_res.scalar_one_or_none()
        if target_org:
            target_org_id = target_org.id
    elif user and user.organization_id and user.role != "superadmin":
        target_org_id = user.organization_id

    if target_org_id:
        query = query.where(Fact.organization_id == target_org_id)
    if category:
        query = query.where(Fact.category == category)
    result = await db.execute(query)
    facts = result.scalars().all()

    return [
        FactResponse(
            id=str(f.id),
            statement=f.statement,
            category=f.category,
            source=f.source,
            numerical_value=f.numerical_value,
            numerical_unit=f.numerical_unit,
            valid_from=f.valid_from.isoformat() if f.valid_from else None,
            valid_until=f.valid_until.isoformat() if f.valid_until else None,
            is_active=f.is_active,
            is_expired=f.is_expired,
        )
        for f in facts
    ]


@router.post("", response_model=FactResponse)
async def create_fact(
    body: FactCreate,
    brand: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    if user and user.role not in ("admin", "superadmin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator authority required to register approved facts into Brand Brain.",
        )
    target_org_id = None
    if brand:
        org_res = await db.execute(select(Organization).where(Organization.slug == brand))
        target_org = org_res.scalar_one_or_none()
        if target_org:
            target_org_id = target_org.id
    if not target_org_id and user and user.organization_id:
        target_org_id = user.organization_id
    if not target_org_id:
        org_res = await db.execute(select(Organization).limit(1))
        org = org_res.scalar_one_or_none()
        if not org:
            org = Organization(name="Default Workspace", slug="default-workspace")
            db.add(org)
            await db.flush()
        target_org_id = org.id

    fact = Fact(
        organization_id=target_org_id,
        category=body.category,
        statement=body.statement,
        source=body.source,
        numerical_value=body.numerical_value,
        numerical_unit=body.numerical_unit,
        valid_from=body.valid_from,
        valid_until=body.valid_until,
    )
    db.add(fact)
    await db.commit()
    await db.refresh(fact)

    return FactResponse(
        id=str(fact.id),
        statement=fact.statement,
        category=fact.category,
        source=fact.source,
        numerical_value=fact.numerical_value,
        numerical_unit=fact.numerical_unit,
        valid_from=fact.valid_from.isoformat() if fact.valid_from else None,
        valid_until=fact.valid_until.isoformat() if fact.valid_until else None,
        is_active=fact.is_active,
        is_expired=fact.is_expired,
    )


@router.delete("/{id}")
async def delete_fact(
    id: str,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    if user and user.role not in ("admin", "superadmin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator authority required to deactivate approved facts.",
        )
    result = await db.execute(select(Fact).where(Fact.id == uuid.UUID(id)))
    fact = result.scalar_one_or_none()
    if not fact:
        raise HTTPException(status_code=404, detail="Fact not found")
    fact.is_active = False
    await db.commit()
    return {"status": "success", "message": "Fact deactivated"}
