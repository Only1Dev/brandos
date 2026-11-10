"""
Evidence engine: builds evidence traces linking findings to source rules/facts/assets.
"""

from __future__ import annotations

import uuid
from typing import Optional, List

from app.models.finding import Evidence, Finding, Suggestion
from app.services.policy_engine import PolicyViolation


SEVERITY_WEIGHTS = {
    "error": 3.0,
    "warning": 1.5,
    "info": 0.5,
}


def compute_governance_impact(
    severity: str,
    evidence_strength: float,
    policy_priority: float,
) -> float:
    """severity_weight × evidence_strength × policy_priority"""
    weight = SEVERITY_WEIGHTS.get(severity, 1.0)
    return round(weight * evidence_strength * policy_priority, 4)


def build_finding_from_violation(
    violation: PolicyViolation,
    review_id: uuid.UUID,
    agent: str,
) -> Finding:
    """Convert a PolicyViolation into a Finding with Evidence."""
    evidence_strength = violation.confidence
    governance_impact = compute_governance_impact(
        violation.severity, evidence_strength, violation.policy_priority
    )

    finding = Finding(
        id=uuid.uuid4(),
        review_id=review_id,
        agent=agent,
        category=violation.category,
        severity=violation.severity,
        title=violation.title,
        description=violation.description,
        content_excerpt=violation.content_excerpt,
        source_location=violation.source_location,
        confidence=violation.confidence,
        evidence_strength=evidence_strength,
        policy_priority=violation.policy_priority,
        governance_impact=governance_impact,
        rule_id=violation.rule_id,
        fact_id=violation.fact_id,
        asset_id=violation.asset_id,
        terminology_rule_id=violation.terminology_rule_id,
        status="open",
    )

    # Build evidence trace
    evidence = Evidence(
        id=uuid.uuid4(),
        finding_id=finding.id,
        evidence_type=violation.evidence_type or "algorithm",
        source_id=str(
            violation.rule_id or violation.fact_id
            or violation.asset_id or violation.terminology_rule_id or ""
        ),
        source_text=violation.evidence_source_text,
        explanation=violation.description,
        relevance_score=violation.confidence,
    )
    finding.evidences = [evidence]
    finding.suggestions = []

    return finding


def build_finding_from_agent(
    review_id: uuid.UUID,
    agent: str,
    category: str,
    severity: str,
    title: str,
    description: str,
    content_excerpt: str = "",
    source_location: str = "",
    confidence: float = 0.8,
    policy_priority: float = 1.0,
    rule_id: uuid.UUID | None = None,
    fact_id: uuid.UUID | None = None,
    asset_id: uuid.UUID | None = None,
    terminology_rule_id: uuid.UUID | None = None,
    evidence_type: str = "algorithm",
    evidence_text: str = "",
    suggestion_text: str | None = None,
    replacement_text: str | None = None,
) -> Finding:
    """Build a Finding from an AI agent's output."""
    evidence_strength = confidence
    governance_impact = compute_governance_impact(severity, evidence_strength, policy_priority)

    finding = Finding(
        id=uuid.uuid4(),
        review_id=review_id,
        agent=agent,
        category=category,
        severity=severity,
        title=title,
        description=description,
        content_excerpt=content_excerpt,
        source_location=source_location,
        confidence=confidence,
        evidence_strength=evidence_strength,
        policy_priority=policy_priority,
        governance_impact=governance_impact,
        rule_id=rule_id,
        fact_id=fact_id,
        asset_id=asset_id,
        terminology_rule_id=terminology_rule_id,
        status="open",
    )

    evidence = Evidence(
        id=uuid.uuid4(),
        finding_id=finding.id,
        evidence_type=evidence_type,
        source_id=str(rule_id or fact_id or asset_id or terminology_rule_id or ""),
        source_text=evidence_text,
        explanation=description,
        relevance_score=confidence,
    )
    finding.evidences = [evidence]

    finding.suggestions = []
    if suggestion_text:
        suggestion = Suggestion(
            id=uuid.uuid4(),
            finding_id=finding.id,
            suggestion_text=suggestion_text,
            replacement_text=replacement_text,
            confidence=confidence,
            status="pending",
        )
        finding.suggestions = [suggestion]

    return finding
