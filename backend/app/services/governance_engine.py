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
        # vulgar/profane language, prompt injection / system override, curative medical claims,
        # competitor defamation, or meaningless placeholder / gibberish text:
        # immediately set governance_score = 0 and decision = "BLOCKED"!
        is_direct_block = any(
            f.get("rule_ref") in (
                "BRAND-IDENTITY-001", "CROSS-TENANT-001", "BRAND-SUBSTANCE-001",
                "BRAND-SAFETY-001", "SAFETY-001", "SECURITY-INJECTION-001",
                "REG-FDA-001", "COMPETITOR-DEFAMATION-001"
            )
            or "domain misalignment" in (f.get("title") or "").lower()
            or "cross-tenant" in (f.get("title") or "").lower()
            or "out of domain" in (f.get("title") or "").lower()
            or "out-of-domain" in (f.get("title") or "").lower()
            or "unapproved third-party visual" in (f.get("title") or "").lower()
            or "missing brand identity" in (f.get("title") or "").lower()
            or "placeholder copy" in (f.get("title") or "").lower()
            or "meaningless placeholder" in (f.get("title") or "").lower()
            or "vulgar" in (f.get("title") or "").lower()
            or "profan" in (f.get("title") or "").lower()
            or "brand safety" in (f.get("title") or "").lower()
            or "prompt injection" in (f.get("title") or "").lower()
            or "system override" in (f.get("title") or "").lower()
            or "jailbreak" in (f.get("title") or "").lower()
            or "curative medical" in (f.get("title") or "").lower()
            or "unauthorized fda" in (f.get("title") or "").lower()
            or "competitor defamation" in (f.get("title") or "").lower()
            or "libel liability" in (f.get("title") or "").lower()
            for f in findings
        )

        if is_direct_block:
            has_injection = any(
                f.get("rule_ref") == "SECURITY-INJECTION-001"
                or "prompt injection" in (f.get("title") or "").lower()
                or "system override" in (f.get("title") or "").lower()
                for f in findings
            )
            has_regulatory = any(
                f.get("rule_ref") == "REG-FDA-001"
                or "curative medical" in (f.get("title") or "").lower()
                or "unauthorized fda" in (f.get("title") or "").lower()
                for f in findings
            )
            has_defamation = any(
                f.get("rule_ref") == "COMPETITOR-DEFAMATION-001"
                or "competitor defamation" in (f.get("title") or "").lower()
                or "libel liability" in (f.get("title") or "").lower()
                for f in findings
            )
            has_safety = any(
                f.get("rule_ref") in ("BRAND-SAFETY-001", "SAFETY-001")
                or "vulgar" in (f.get("title") or "").lower()
                or "profan" in (f.get("title") or "").lower()
                or "brand safety" in (f.get("title") or "").lower()
                for f in findings
            )

            if has_injection:
                block_summary = "DISQUALIFIED: Adversarial Prompt Injection & System Override Attack detected. Security firewall active. Score: 0/100."
            elif has_regulatory:
                block_summary = "DISQUALIFIED: Unsubstantiated Curative Medical Claim & Unauthorized FDA Clearance. Publication is strictly prohibited under 21 CFR § 101.93. Score: 0/100."
            elif has_defamation:
                block_summary = "DISQUALIFIED: Unlawful Competitor Defamation & Libel Liability detected. Unsubstantiated competitor attacks violate FTC comparative advertising rules. Score: 0/100."
            elif has_safety:
                block_summary = "DISQUALIFIED: Content violates zero-tolerance Brand Safety standards. Vulgar or profane language is strictly prohibited. Score: 0/100."
            else:
                block_summary = "DISQUALIFIED: Content violates zero-tolerance pre-publication standards (Domain misalignment or meaningless placeholder copy). Score: 0/100."

            return {
                "decision": "BLOCKED",
                "governance_score": 0,
                "summary": block_summary,
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

        if crit_count > 0:
            decision = "BLOCKED"
            # When content has critical violations (BLOCKED), governance score CAN NEVER be 80-100!
            # Clamp to max 35 to eliminate score/banner contradictions
            score = min(score, 35)
        elif score < 40:
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
