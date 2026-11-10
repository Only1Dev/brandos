from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field


class EvidenceRead(BaseModel):
    id: uuid.UUID
    finding_id: uuid.UUID
    evidence_type: str
    source_id: Optional[str]
    source_text: Optional[str]
    explanation: str
    relevance_score: float
    created_at: datetime

    model_config = {"from_attributes": True}


class SuggestionRead(BaseModel):
    id: uuid.UUID
    finding_id: uuid.UUID
    suggestion_text: str
    replacement_text: Optional[str]
    confidence: float
    status: str
    accepted_by: Optional[uuid.UUID]
    created_at: datetime

    model_config = {"from_attributes": True}


class SuggestionAction(BaseModel):
    status: str = Field(..., pattern=r"^(accepted|rejected)$")


class FindingRead(BaseModel):
    id: uuid.UUID
    review_id: uuid.UUID
    agent: str
    category: str
    severity: str
    title: str
    description: str
    content_excerpt: Optional[str]
    source_location: Optional[str]
    confidence: float
    evidence_strength: float
    policy_priority: float
    governance_impact: float
    rule_id: Optional[uuid.UUID]
    fact_id: Optional[uuid.UUID]
    asset_id: Optional[uuid.UUID]
    terminology_rule_id: Optional[uuid.UUID]
    status: str
    override_reason: Optional[str]
    overridden_by: Optional[uuid.UUID]
    created_at: datetime
    evidences: List[EvidenceRead] = []
    suggestions: List[SuggestionRead] = []

    model_config = {"from_attributes": True}


class FindingOverride(BaseModel):
    status: str = Field(..., pattern=r"^(accepted|rejected|overridden)$")
    override_reason: Optional[str] = None
