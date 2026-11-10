from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field


class GuidelineRuleCreate(BaseModel):
    rule_code: str = Field(..., max_length=64)
    category: str = Field(..., max_length=100)
    title: str = Field(..., max_length=512)
    description: str
    severity: str = Field("warning", pattern=r"^(error|warning|info)$")
    check_type: str = Field("llm", pattern=r"^(exact_match|regex|numerical|llm|visual)$")
    check_value: Optional[str] = None
    is_active: bool = True


class GuidelineRuleRead(BaseModel):
    id: uuid.UUID
    guideline_id: uuid.UUID
    rule_code: str
    category: str
    title: str
    description: str
    severity: str
    check_type: str
    check_value: Optional[str]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class GuidelineCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=512)
    description: Optional[str] = None
    category: str = Field(
        "general",
        pattern=r"^(brand_voice|visual|legal|factual|accessibility|general)$",
    )
    priority: float = Field(1.0, ge=0.0, le=10.0)


class GuidelineUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=512)
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[float] = Field(None, ge=0.0, le=10.0)
    is_active: Optional[bool] = None


class GuidelineRead(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    title: str
    description: Optional[str]
    category: str
    source_file_url: Optional[str]
    raw_text: Optional[str]
    version: int
    is_active: bool
    priority: float
    created_at: datetime
    updated_at: datetime
    rules: List[GuidelineRuleRead] = []

    model_config = {"from_attributes": True}


class GuidelineParseRequest(BaseModel):
    """Request to parse raw text from an uploaded guideline document."""
    raw_text: Optional[str] = None
    file_url: Optional[str] = None
