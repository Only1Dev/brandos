"""
Immutable Audit Trail API.
PRD FR-23: Audit Trail & Compliance Provenance.
Read-only logging of all consequential actions; no update or delete allowed.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.audit import AuditEvent
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


@router.get("", response_model=List[AuditResponse])
async def list_audit_events(
    entity_type: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    query = select(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(limit)
    if entity_type:
        query = query.where(AuditEvent.entity_type == entity_type)
    if action:
        query = query.where(AuditEvent.action == action)

    result = await db.execute(query)
    events = result.scalars().all()

    return [
        AuditResponse(
            id=str(e.id),
            action=e.action,
            entity_type=e.entity_type,
            entity_id=str(e.entity_id) if e.entity_id else None,
            user_id=str(e.user_id) if e.user_id else None,
            details=e.details,
            created_at=e.created_at.isoformat() if e.created_at else "",
        )
        for e in events
    ]
