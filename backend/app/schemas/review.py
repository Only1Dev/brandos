from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field

from app.schemas.finding import FindingRead


class ReviewCreate(BaseModel):
    content_id: uuid.UUID
    content_version_id: uuid.UUID


class ReviewUpdate(BaseModel):
    status: Optional[str] = None
    reviewer_comment: Optional[str] = None


class ReviewRead(BaseModel):
    id: uuid.UUID
    content_id: uuid.UUID
    content_version_id: uuid.UUID
    status: str
    governance_score: Optional[float]
    decision: Optional[str]
    summary: Optional[str]
    total_findings: int
    error_count: int
    warning_count: int
    info_count: int
    reviewer_comment: Optional[str]
    reviewed_by: Optional[uuid.UUID]
    created_by: Optional[uuid.UUID]
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]
    findings: List[FindingRead] = []

    model_config = {"from_attributes": True}


class ReviewSummary(BaseModel):
    """Lightweight review summary without full findings."""
    id: uuid.UUID
    content_id: uuid.UUID
    status: str
    governance_score: Optional[float]
    decision: Optional[str]
    total_findings: int
    error_count: int
    warning_count: int
    info_count: int
    created_at: datetime

    model_config = {"from_attributes": True}
