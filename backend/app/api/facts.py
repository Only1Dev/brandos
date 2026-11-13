"""
Approved Facts Management API.
PRD FR-04: Approved Facts & Versioning.
"""

from __future__ import annotations

import uuid
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
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


class FactUpdate(BaseModel):
    statement: Optional[str] = None
    category: Optional[str] = None
    source: Optional[str] = None
    numerical_value: Optional[float] = None
    numerical_unit: Optional[str] = None
    valid_from: Optional[date] = None
    valid_until: Optional[date] = None
    is_active: Optional[bool] = None


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
    request: Request = None,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    query = select(Fact).where(Fact.is_active == True)
    
    target_org_id = None
    brand_slug = brand or (request.headers.get("x-brand-slug") if request else None)
    if brand_slug:
        org_res = await db.execute(select(Organization).where(Organization.slug == brand_slug))
        target_org = org_res.scalar_one_or_none()
        if target_org:
            target_org_id = target_org.id
        else:
            return []
    elif user and user.organization_id and user.role != "superadmin":
        target_org_id = user.organization_id
    else:
        aureon_res = await db.execute(select(Organization).where(Organization.slug == "aureon"))
        aureon = aureon_res.scalar_one_or_none()
        if aureon:
            target_org_id = aureon.id

    if target_org_id:
        query = query.where(Fact.organization_id == target_org_id)
    if category:
        query = query.where(Fact.category == category)
    query = query.order_by(Fact.created_at.desc())
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
    request: Request = None,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    role = (user.role if user else None) or (request.headers.get("x-user-role") if request else None) or "admin"
    if role not in ("admin", "superadmin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator authority required to register approved facts into Brand Brain.",
        )
    target_org_id = None
    brand_slug = brand or (request.headers.get("x-brand-slug") if request else None)
    if brand_slug:
        org_res = await db.execute(select(Organization).where(Organization.slug == brand_slug))
        target_org = org_res.scalar_one_or_none()
        if target_org:
            target_org_id = target_org.id
        else:
            raise HTTPException(status_code=404, detail=f"Brand organization '{brand_slug}' not found.")
    elif user and user.organization_id:
        target_org_id = user.organization_id
    else:
        aureon_res = await db.execute(select(Organization).where(Organization.slug == "aureon"))
        org = aureon_res.scalar_one_or_none()
        if not org:
            org_res = await db.execute(select(Organization).limit(1))
            org = org_res.scalar_one_or_none()
        if not org:
            org = Organization(name="Default Workspace", slug="default-workspace")
            db.add(org)
            await db.flush()
        target_org_id = org.id

    # Check if this exact fact statement already exists actively
    existing_res = await db.execute(
        select(Fact).where(
            Fact.organization_id == target_org_id,
            Fact.statement == body.statement,
            Fact.is_active.is_(True),
        )
    )
    existing_fact = existing_res.scalars().first()
    if existing_fact:
        return FactResponse(
            id=str(existing_fact.id),
            statement=existing_fact.statement,
            category=existing_fact.category,
            source=existing_fact.source,
            numerical_value=existing_fact.numerical_value,
            numerical_unit=existing_fact.numerical_unit,
            valid_from=existing_fact.valid_from.isoformat() if existing_fact.valid_from else None,
            valid_until=existing_fact.valid_until.isoformat() if existing_fact.valid_until else None,
            is_active=existing_fact.is_active,
            is_expired=existing_fact.is_expired,
        )

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


@router.put("/{id}", response_model=FactResponse)
async def update_fact(
    id: str,
    body: FactUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    role = (user.role if user else None) or request.headers.get("x-user-role", "admin")
    if role not in ("admin", "superadmin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator authority required to edit approved facts.",
        )
    result = await db.execute(select(Fact).where(Fact.id == uuid.UUID(id)))
    fact = result.scalar_one_or_none()
    if not fact:
        raise HTTPException(status_code=404, detail="Fact not found")

    if body.statement is not None:
        fact.statement = body.statement
    if body.category is not None:
        fact.category = body.category
    if body.source is not None:
        fact.source = body.source
    if body.numerical_value is not None:
        fact.numerical_value = body.numerical_value
    if body.numerical_unit is not None:
        fact.numerical_unit = body.numerical_unit
    if body.valid_from is not None:
        fact.valid_from = body.valid_from
    if body.valid_until is not None:
        fact.valid_until = body.valid_until
    if body.is_active is not None:
        fact.is_active = body.is_active

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
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    role = (user.role if user else None) or request.headers.get("x-user-role", "admin")
    if role not in ("admin", "superadmin"):
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
