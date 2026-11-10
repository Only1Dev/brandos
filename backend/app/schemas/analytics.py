from __future__ import annotations

from typing import Optional, List, Dict, Any
from datetime import datetime

from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_content: int
    total_reviews: int
    total_findings: int
    pass_rate: float
    avg_governance_score: Optional[float]
    error_count: int
    warning_count: int
    info_count: int
    reviews_by_decision: Dict[str, int]
    reviews_by_status: Dict[str, int]


class RecurringIssue(BaseModel):
    rule_code: Optional[str]
    category: str
    title: str
    occurrence_count: int
    avg_severity_weight: float
    agent: str


class GuidelineDrift(BaseModel):
    guideline_id: str
    guideline_title: str
    total_violations: int
    trend: str  # "increasing" | "decreasing" | "stable"
    recent_count: int
    previous_count: int


class ExpiringFact(BaseModel):
    fact_id: str
    statement: str
    valid_until: Optional[datetime]
    days_remaining: int
    linked_content_count: int


class AnalyticsResponse(BaseModel):
    dashboard: DashboardStats
    recurring_issues: List[RecurringIssue]
    guideline_drift: List[GuidelineDrift]
    expiring_facts: List[ExpiringFact]
