"""
Governance engine: combines all findings, calculates governance score,
determines decision (PASS / PASS_WITH_WARNINGS / REVIEW_REQUIRED / BLOCKED).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List

from app.models.finding import Finding


@dataclass
class GovernanceResult:
    score: float  # 0-100
    decision: str  # PASS | PASS_WITH_WARNINGS | REVIEW_REQUIRED | BLOCKED
    summary: str
    total_findings: int
    error_count: int
    warning_count: int
    info_count: int


class GovernanceEngine:
    """Calculates governance score and publication decisions."""

    SEVERITY_DEDUCTIONS = {
        "critical": 58.0,
        "high": 20.0,
        "error": 20.0,
        "medium": 8.0,
        "warning": 8.0,
        "low": 2.0,
        "info": 2.0,
    }

    def calculate_decision(self, findings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculates decision and score from raw finding dicts."""
        if not findings:
            return {
                "decision": "PASS",
                "governance_score": 100,
                "summary": "Content fully complies with brand guidelines.",
                "risk_summary": {"critical": 0, "high": 0, "medium": 0, "low": 0},
            }

        crit_count = sum(1 for f in findings if f.get("severity") == "critical")
        high_count = sum(1 for f in findings if f.get("severity") in ("high", "error"))
        med_count = sum(1 for f in findings if f.get("severity") in ("medium", "warning"))
        low_count = sum(1 for f in findings if f.get("severity") in ("low", "info"))

        # Zero-Tolerance Direct Disqualification:
        # If any finding flags genuine cross-tenant misalignment, out-of-domain breach,
        # or meaningless placeholder / gibberish text:
        # immediately set governance_score = 0 and decision = "BLOCKED"!
        is_direct_block = any(
            f.get("rule_ref") in ("BRAND-IDENTITY-001", "CROSS-TENANT-001", "BRAND-SUBSTANCE-001")
            or "domain misalignment" in (f.get("title") or "").lower()
            or "cross-tenant" in (f.get("title") or "").lower()
            or "out of domain" in (f.get("title") or "").lower()
            or "out-of-domain" in (f.get("title") or "").lower()
            or "unapproved third-party visual" in (f.get("title") or "").lower()
            or "missing brand identity" in (f.get("title") or "").lower()
            or "placeholder copy" in (f.get("title") or "").lower()
            or "meaningless placeholder" in (f.get("title") or "").lower()
            for f in findings
        )

        if is_direct_block:
            return {
                "decision": "BLOCKED",
                "governance_score": 0,
                "summary": "DISQUALIFIED: Content violates zero-tolerance pre-publication standards (Domain misalignment or meaningless placeholder copy). Score: 0/100.",
                "risk_summary": {
                    "critical": max(1, crit_count),
                    "high": high_count,
                    "medium": med_count,
                    "low": low_count,
                },
                "disqualified": True,
            }

        total_deduction = sum(
            self.SEVERITY_DEDUCTIONS.get(f.get("severity", "medium").lower(), 10.0)
            * float(f.get("confidence", 1.0))
            for f in findings
        )
        score = max(0, min(100, round(100.0 - total_deduction)))

        if crit_count > 0 or score < 40:
            decision = "BLOCKED"
        elif high_count > 0 or score < 75:
            decision = "REVIEW_REQUIRED"
        elif med_count > 0 or score < 90:
            decision = "PASS_WITH_WARNINGS"
        else:
            decision = "PASS"

        return {
            "decision": decision,
            "governance_score": score,
            "risk_summary": {
                "critical": crit_count,
                "high": high_count,
                "medium": med_count,
                "low": low_count,
            },
        }


def compute_governance(findings: List[Finding]) -> GovernanceResult:
    if not findings:
        return GovernanceResult(
            score=100.0,
            decision="PASS",
            summary="No findings. Content is fully compliant.",
            total_findings=0,
            error_count=0,
            warning_count=0,
            info_count=0,
        )

    error_count = sum(1 for f in findings if f.severity in ("error", "critical"))
    warning_count = sum(1 for f in findings if f.severity in ("warning", "high", "medium"))
    info_count = sum(1 for f in findings if f.severity in ("info", "low"))

    is_direct_block = any(
        "misalignment" in (f.title or "").lower()
        or "domain" in (f.title or "").lower()
        or "unapproved third-party" in (f.title or "").lower()
        or "missing brand identity" in (f.title or "").lower()
        or "placeholder copy" in (f.title or "").lower()
        or "meaningless placeholder" in (f.title or "").lower()
        for f in findings
    )
    if is_direct_block:
        return GovernanceResult(
            score=0.0,
            decision="BLOCKED",
            summary="DISQUALIFIED: Content violates zero-tolerance pre-publication standards.",
            total_findings=len(findings),
            error_count=error_count,
            warning_count=warning_count,
            info_count=info_count,
        )

    deduction = (error_count * 25.0) + (warning_count * 8.0) + (info_count * 2.0)
    score = max(0.0, min(100.0, 100.0 - deduction))

    if error_count > 0 or score < 70:
        decision = "REVIEW_REQUIRED" if score >= 40 else "BLOCKED"
    elif warning_count > 0:
        decision = "WARNINGS"
    else:
        decision = "PASS"

    return GovernanceResult(
        score=round(score, 1),
        decision=decision,
        summary=f"Governance score: {score:.1f}/100. Found {len(findings)} issues.",
        total_findings=len(findings),
        error_count=error_count,
        warning_count=warning_count,
        info_count=info_count,
    )
