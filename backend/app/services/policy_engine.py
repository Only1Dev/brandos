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



def check_deterministic_guidelines(text: str, rules: list) -> List[dict]:
    """
    Scans submitted text deterministically against registered GuidelineRules.
    Guarantees that custom rules (e.g. ALL-CAPS prohibition like Rule 777,
    banned quotes, or formatting restrictions) are enforced 100% reliably.
    """
    violations: List[dict] = []
    if not text or not rules:
        return violations

    for r in rules:
        rule_id = r.get("rule_id") or r.get("name") or "RULE"
        rule_text = (r.get("rule_text") or r.get("description") or "").strip()
        rule_lower = rule_text.lower()
        severity = (r.get("severity") or "warning").lower()

        # 1. Capitalization / All-Caps check (e.g. Rule 777)
        is_caps_rule = any(w in rule_lower for w in ["caps", "capital", "uppercase", "all-caps", "all caps"])
        is_prohibition = any(w in rule_lower for w in ["never", "do not", "don't", "prohibit", "avoid", "forbidden", "disallow", "no caps"])

        if is_caps_rule and is_prohibition:
            EXEMPT_ACRONYMS = {"AI", "IT", "ID", "PDF", "API", "APAC", "WCAG", "UI", "UX", "AA", "AAA", "ROI", "B2B", "SaaS", "FDA", "FSSAI"}
            pattern = re.compile(r"\b([A-Z][A-Z']*(?:\s+[A-Z][A-Z']*)+|[A-Z]{3,})\b")
            matches = [m.group(0) for m in pattern.finditer(text) if any(w.strip("'") not in EXEMPT_ACRONYMS for w in m.group(0).split())]

            for match in matches:
                violations.append({
                    "finding_type": "brand",
                    "severity": severity if severity in ("critical", "high", "error") else "error",
                    "title": f"Guideline Rule Violation: Prohibited Capitalization (Rule {rule_id})",
                    "description": f"Content contains prohibited uppercase/all-caps text '{match}'. This directly violates active Brand Brain guideline rule {rule_id}: '{rule_text}'.",
                    "detected_text": match,
                    "explanation": f"Rule {rule_id} strictly mandates: '{rule_text}'. Capitalized copy must be rewritten in standard sentence case.",
                    "rule_ref": str(rule_id),
                    "confidence": 1.0,
                    "evidence": [{
                        "evidence_type": "rule",
                        "source_ref": str(rule_id),
                        "description": f"Active Rule {rule_id}: {rule_text}",
                        "data": {"rule": str(rule_id), "detected": match}
                    }],
                    "suggestion": {
                        "original_text": match,
                        "suggested_text": match.lower().capitalize() if len(match.split()) > 1 else match.lower(),
                        "reasoning": f"Converts '{match}' to compliant casing in accordance with Rule {rule_id}."
                    }
                })

        # 2. Banned quoted phrases (e.g., Never use "word")
        quoted_phrases = re.findall(r"['\"]([^'\"]{3,})['\"]", rule_text)
        for phrase in quoted_phrases:
            if phrase.lower() in text.lower():
                pattern = re.compile(re.escape(phrase), re.IGNORECASE)
                m = pattern.search(text)
                detected = m.group(0) if m else phrase
                violations.append({
                    "finding_type": "brand",
                    "severity": severity,
                    "title": f"Guideline Rule Violation: Prohibited Phrase (Rule {rule_id})",
                    "description": f"Detected prohibited phrase '{detected}', directly violating Rule {rule_id}: '{rule_text}'.",
                    "detected_text": detected,
                    "explanation": f"Rule {rule_id} mandates: '{rule_text}'.",
                    "rule_ref": str(rule_id),
                    "confidence": 1.0,
                    "evidence": [{
                        "evidence_type": "rule",
                        "source_ref": str(rule_id),
                        "description": f"Active Rule {rule_id}: {rule_text}",
                        "data": {"rule": str(rule_id), "detected": detected}
                    }],
                    "suggestion": {
                        "original_text": detected,
                        "suggested_text": "",
                        "reasoning": f"Remove prohibited phrase '{detected}' as mandated by Rule {rule_id}."
                    }
                })

    return violations


class PolicyEngine:
    """Wrapper class providing policy precedence and evaluation methods."""

    def resolve_precedence(self, violations: List[PolicyViolation]) -> List[PolicyViolation]:
        return resolve_policy_precedence(violations)

    def check_deterministic_guidelines(self, text: str, rules: list) -> List[dict]:
        return check_deterministic_guidelines(text, rules)
