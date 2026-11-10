from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AuditEventRead(BaseModel):
    id: uuid.UUID
    organization_id: Optional[uuid.UUID]
    actor_id: Optional[uuid.UUID]
    action: str
    resource_type: str
    resource_id: Optional[str]
    details: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditFilter(BaseModel):
    action: Optional[str] = None
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    actor_id: Optional[uuid.UUID] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
