from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class TerminologyRuleCreate(BaseModel):
    term: str = Field(..., max_length=255)
    term_type: str = Field("preferred", pattern=r"^(preferred|deprecated|forbidden)$")
    preferred_alternative: Optional[str] = None
    context: Optional[str] = None
    severity: str = Field("warning", pattern=r"^(error|warning|info)$")
    case_sensitive: bool = False
    is_regex: bool = False


class TerminologyRuleUpdate(BaseModel):
    term: Optional[str] = None
    term_type: Optional[str] = None
    preferred_alternative: Optional[str] = None
    context: Optional[str] = None
    severity: Optional[str] = None
    case_sensitive: Optional[bool] = None
    is_regex: Optional[bool] = None
    is_active: Optional[bool] = None


class TerminologyRuleRead(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    term: str
    term_type: str
    preferred_alternative: Optional[str]
    context: Optional[str]
    severity: str
    case_sensitive: bool
    is_regex: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
