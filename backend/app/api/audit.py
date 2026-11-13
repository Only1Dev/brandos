"""
Immutable Audit Trail API.
PRD FR-23: Audit Trail & Compliance Provenance.
Read-only logging of all consequential actions; no update or delete allowed.
"""

from __future__ import annotations

import json
import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.audit import AuditEvent
from app.models.organization import Organization
from app.models.user import User
from app.middleware.auth import get_optional_user

router = APIRouter(prefix="/audit", tags=["audit"])


class AuditResponse(BaseModel):
    id: str
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    user_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    created_at: str


def _parse_details(raw: Any) -> Optional[Dict[str, Any]]:
    if not raw:
        return None
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str):
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, dict):
                return parsed
            return {"value": parsed}
        except Exception:
            return {"raw": raw}
    return {"raw": str(raw)}


@router.get("", response_model=List[AuditResponse])
async def list_audit_events(
    entity_type: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    brand: Optional[str] = None,
    request: Request = None,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    query = select(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(limit)

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
        query = query.where(AuditEvent.organization_id == target_org_id)
    if entity_type:
        query = query.where(AuditEvent.resource_type == entity_type)
    if action:
        query = query.where(AuditEvent.action == action)

    result = await db.execute(query)
    events = result.scalars().all()

    return [
        AuditResponse(
            id=str(e.id),
            action=e.action,
            entity_type=e.resource_type,
            entity_id=str(e.resource_id) if e.resource_id else None,
            user_id=str(e.actor_id) if e.actor_id else None,
            details=_parse_details(e.details),
            created_at=e.created_at.isoformat() if e.created_at else "",
        )
        for e in events
    ]
