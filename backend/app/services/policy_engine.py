"""
Policy engine: deterministic rule matching.
- Terminology violations (exact match / regex)
- Numerical comparison with tolerance
- Date expiry checks
- Policy precedence resolution
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date
from typing import List, Optional
from uuid import UUID


@dataclass
class PolicyViolation:
    rule_id: Optional[UUID] = None
    fact_id: Optional[UUID] = None
    terminology_rule_id: Optional[UUID] = None
    asset_id: Optional[UUID] = None
    category: str = ""
    severity: str = "warning"
    title: str = ""
    description: str = ""
    content_excerpt: str = ""
    source_location: str = ""
    evidence_type: str = ""
    evidence_source_text: str = ""
    policy_priority: float = 1.0
    confidence: float = 1.0


def check_terminology_violations(
    text: str,
    terminology_rules: list,
) -> List[PolicyViolation]:
    """
    Deterministic terminology check.
    Scans text for deprecated/forbidden terms.
    """
    violations: List[PolicyViolation] = []

    for rule in terminology_rules:
        if not rule.is_active:
            continue
        if rule.term_type == "preferred":
            continue  # preferred terms are not violations

        pattern_text = rule.term
        flags = 0 if rule.case_sensitive else re.IGNORECASE

        if rule.is_regex:
            try:
                pattern = re.compile(pattern_text, flags)
            except re.error:
                continue
        else:
            escaped = re.escape(pattern_text)
            pattern = re.compile(rf"\b{escaped}\b", flags)

        for match in pattern.finditer(text):
            start = max(0, match.start() - 30)
            end = min(len(text), match.end() + 30)
            excerpt = text[start:end]

            alt = rule.preferred_alternative or "(no alternative specified)"
            desc = (
                f"{'Forbidden' if rule.term_type == 'forbidden' else 'Deprecated'} "
                f"term '{match.group()}' found. "
                f"Use '{alt}' instead."
            )
            if rule.context:
                desc += f" Context: {rule.context}"

            violations.append(PolicyViolation(
                terminology_rule_id=rule.id,
                category="terminology",
                severity=rule.severity,
                title=f"Terminology violation: '{match.group()}'",
                description=desc,
                content_excerpt=excerpt,
                source_location=f"character {match.start()}",
                evidence_type="terminology_rule",
                evidence_source_text=f"Term '{rule.term}' is {rule.term_type}",
                policy_priority=2.0 if rule.term_type == "forbidden" else 1.0,
                confidence=1.0,
            ))

    return violations


def check_numerical_claims(
    extracted_numbers: list[dict],
    facts: list,
    text: str,
) -> List[PolicyViolation]:
    """
    Compare extracted numerical values against approved facts.
    Uses tolerance for comparison.
    """
    violations: List[PolicyViolation] = []

    for fact in facts:
        if not fact.is_active or fact.numerical_value is None:
            continue

        for num in extracted_numbers:
            num_value = num.get("value")
            num_unit = num.get("unit", "").lower()
            fact_unit = (fact.numerical_unit or "").lower()

            # Only compare if units match or one is empty
            if fact_unit and num_unit and fact_unit != num_unit:
                continue

            if num_value is None:
                continue

            tolerance = fact.numerical_tolerance or 0.0
            diff = abs(num_value - fact.numerical_value)

            if diff > tolerance and diff / max(abs(fact.numerical_value), 1e-9) > 0.01:
                # Potential mismatch — check if the fact statement is related
                raw = num.get("raw", str(num_value))
                violations.append(PolicyViolation(
                    fact_id=fact.id,
                    category="numerical_accuracy",
                    severity="error",
                    title=f"Numerical mismatch: {raw} vs approved {fact.numerical_value}{fact.numerical_unit or ''}",
                    description=(
                        f"Content states '{raw}' but the approved fact is "
                        f"'{fact.numerical_value} {fact.numerical_unit or ''}'.  "
                        f"Difference: {diff:.2f}. "
                        f"Tolerance: ±{tolerance}. "
                        f"Approved fact: '{fact.statement}'"
                    ),
                    content_excerpt=raw,
                    source_location=f"character {num.get('position', '?')}",
                    evidence_type="fact",
                    evidence_source_text=fact.statement,
                    policy_priority=3.0,
                    confidence=0.8,
                ))

    return violations


def check_expired_facts(facts: list) -> List[PolicyViolation]:
    """Flag facts that have expired or are about to expire."""
    violations: List[PolicyViolation] = []
    today = date.today()

    for fact in facts:
        if not fact.is_active:
            continue
        if fact.valid_until and today > fact.valid_until:
            violations.append(PolicyViolation(
                fact_id=fact.id,
                category="fact_expiry",
                severity="error",
                title=f"Expired fact referenced: '{fact.statement[:80]}'",
                description=(
                    f"This fact expired on {fact.valid_until}. "
                    f"Content referencing it may contain outdated information."
                ),
                evidence_type="fact",
                evidence_source_text=fact.statement,
                policy_priority=3.0,
                confidence=1.0,
            ))
        elif fact.valid_until:
            days_left = (fact.valid_until - today).days
            if days_left <= 30:
                violations.append(PolicyViolation(
                    fact_id=fact.id,
                    category="fact_expiry_warning",
                    severity="warning",
                    title=f"Fact expiring soon: '{fact.statement[:80]}'",
                    description=(
                        f"This fact expires on {fact.valid_until} "
                        f"({days_left} days remaining)."
                    ),
                    evidence_type="fact",
                    evidence_source_text=fact.statement,
                    policy_priority=2.0,
                    confidence=1.0,
                ))

    return violations


def resolve_policy_precedence(violations: List[PolicyViolation]) -> List[PolicyViolation]:
    """
    When multiple violations target the same content excerpt,
    keep the one with the highest policy_priority.
    """
    if not violations:
        return violations

    # Group by excerpt
    by_excerpt: dict[str, List[PolicyViolation]] = {}
    for v in violations:
        key = v.content_excerpt.strip().lower() if v.content_excerpt else ""
        by_excerpt.setdefault(key, []).append(v)

    resolved: List[PolicyViolation] = []
    for key, group in by_excerpt.items():
        if not key:
            resolved.extend(group)
            continue
        # Keep the highest-priority violation for the same excerpt, plus any with different categories
        seen_cats: set = set()
        sorted_group = sorted(group, key=lambda v: -v.policy_priority)
        for v in sorted_group:
            cat_key = (v.category, v.title)
            if cat_key not in seen_cats:
                seen_cats.add(cat_key)
                resolved.append(v)

    return resolved



class PolicyEngine:
    """Wrapper class providing policy precedence and evaluation methods."""

    def resolve_precedence(self, violations: List[PolicyViolation]) -> List[PolicyViolation]:
        return resolve_policy_precedence(violations)
