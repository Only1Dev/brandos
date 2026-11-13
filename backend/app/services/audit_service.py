"""
Audit service: creates immutable audit events for every significant action.
"""

from __future__ import annotations

import json
import uuid
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditEvent
from app.models.user import User


async def log_event(
    db: AsyncSession,
    action: str,
    resource_type: str,
    resource_id: str | None = None,
    actor_id: uuid.UUID | None = None,
    organization_id: uuid.UUID | None = None,
    details: dict[str, Any] | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> AuditEvent:
    """
    Create an immutable audit event.
    This is append-only — events are never updated or deleted.
    """
    event = AuditEvent(
        id=uuid.uuid4(),
        organization_id=organization_id,
        actor_id=actor_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=json.dumps(details) if details else None,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(event)
    # Don't commit here — let the caller/session manage the transaction
    return event



class AuditService:
    @classmethod
    async def log_action(
        cls,
        db: AsyncSession,
        user_id: Optional[uuid.UUID] = None,
        organization_id: Optional[uuid.UUID] = None,
        action: str = "action",
        entity_type: str = "general",
        entity_id: Optional[uuid.UUID] = None,
        details: Optional[dict[str, Any]] = None,
    ) -> AuditEvent:
        if not organization_id and user_id:
            try:
                user_res = await db.get(User, user_id)
                if user_res:
                    organization_id = user_res.organization_id
            except Exception:
                pass
        return await log_event(
            db=db,
            action=action,
            resource_type=entity_type,
            resource_id=str(entity_id) if entity_id else None,
            actor_id=user_id,
            organization_id=organization_id,
            details=details,
        )
