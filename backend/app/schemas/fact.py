from __future__ import annotations

import uuid
from datetime import datetime, date
from typing import Optional

from pydantic import BaseModel, Field


class FactCreate(BaseModel):
    category: str = Field("general", max_length=100)
    statement: str
    source: Optional[str] = None
    numerical_value: Optional[float] = None
    numerical_unit: Optional[str] = None
    numerical_tolerance: Optional[float] = None
    valid_from: Optional[date] = None
    valid_until: Optional[date] = None


class FactUpdate(BaseModel):
    category: Optional[str] = None
    statement: Optional[str] = None
    source: Optional[str] = None
    numerical_value: Optional[float] = None
    numerical_unit: Optional[str] = None
    numerical_tolerance: Optional[float] = None
    valid_from: Optional[date] = None
    valid_until: Optional[date] = None
    is_active: Optional[bool] = None


class FactRead(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    category: str
    statement: str
    source: Optional[str]
    numerical_value: Optional[float]
    numerical_unit: Optional[str]
    numerical_tolerance: Optional[float]
    valid_from: Optional[date]
    valid_until: Optional[date]
    is_active: bool
    is_expired: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
