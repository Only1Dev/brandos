from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ClaimCreate(BaseModel):
    claim_text: str
    category: str = Field("general", max_length=100)
    numerical_value: Optional[float] = None
    numerical_unit: Optional[str] = None
    source_location: Optional[str] = None
    content_id: Optional[uuid.UUID] = None


class ClaimUpdate(BaseModel):
    status: Optional[str] = Field(
        None,
        pattern=r"^(extracted|under_review|verified|disputed|rejected)$",
    )
    matched_fact_id: Optional[uuid.UUID] = None
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)


class ClaimRead(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    content_id: Optional[uuid.UUID]
    claim_text: str
    category: str
    status: str
    numerical_value: Optional[float]
    numerical_unit: Optional[str]
    matched_fact_id: Optional[uuid.UUID]
    confidence: float
    source_location: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
