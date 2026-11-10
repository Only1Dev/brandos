"""
Terminology Agent — Deterministic evaluation of text against approved terminology rules.
PRD FR-06: Preferred, deprecated, and forbidden terms.
No LLM calls required — 100% deterministic pattern matching.
"""

from __future__ import annotations

import re
from typing import Any, Dict, List


class TerminologyAgent:
    """Evaluates content against terminology rules deterministically."""

    def evaluate(
        self,
        text: str,
        rules: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """
        Scan text for deprecated and forbidden terms.
        rules: List of dicts representing TerminologyRule objects
        """
        findings = []

        for rule in rules:
            preferred = rule.get("preferred", "")
            forbidden_list = rule.get("forbidden") or []
            deprecated_list = rule.get("deprecated") or []
            rule_id = str(rule.get("id", ""))
            rule_ref = f"TERM-{rule.get('id', '')[:8]}"

            # Check forbidden terms (CRITICAL/HIGH severity)
            for term in forbidden_list:
                if not term:
                    continue
                pattern = rf"\b{re.escape(term)}\b"
                matches = list(re.finditer(pattern, text, re.IGNORECASE))
                for match in matches:
                    detected_text = match.group(0)
                    findings.append({
                        "finding_type": "terminology",
                        "severity": "high",
                        "title": f"Forbidden Terminology Detected: '{detected_text}'",
                        "description": f"The term '{detected_text}' is strictly forbidden by organizational brand guidelines.",
                        "detected_text": detected_text,
                        "explanation": f"Brand policy forbids the usage of '{detected_text}'. Use the approved term '{preferred}' instead.",
                        "confidence": 1.0,  # Deterministic = 100% confidence
                        "evidence": [{
                            "evidence_type": "rule",
                            "source_ref": rule_ref,
                            "description": f"Forbidden term '{term}' violates approved terminology policy.",
                            "data": {
                                "preferred": preferred,
                                "forbidden": term,
                                "match": detected_text,
                                "position": match.start()
                            }
                        }],
                        "suggestion": {
                            "original_text": detected_text,
                            "suggested_text": preferred,
                            "reasoning": f"Replaced forbidden term '{detected_text}' with approved term '{preferred}'."
                        }
                    })

            # Check deprecated terms (MEDIUM severity)
            for term in deprecated_list:
                if not term:
                    continue
                pattern = rf"\b{re.escape(term)}\b"
                matches = list(re.finditer(pattern, text, re.IGNORECASE))
                for match in matches:
                    detected_text = match.group(0)
                    findings.append({
                        "finding_type": "terminology",
                        "severity": "medium",
                        "title": f"Deprecated Terminology: '{detected_text}'",
                        "description": f"The term '{detected_text}' has been deprecated.",
                        "detected_text": detected_text,
                        "explanation": f"'{detected_text}' is phased out. Prefer '{preferred}'.",
                        "confidence": 1.0,
                        "evidence": [{
                            "evidence_type": "rule",
                            "source_ref": rule_ref,
                            "description": f"Deprecated term '{term}' should be updated to '{preferred}'.",
                            "data": {
                                "preferred": preferred,
                                "deprecated": term,
                                "match": detected_text,
                                "position": match.start()
                            }
                        }],
                        "suggestion": {
                            "original_text": detected_text,
                            "suggested_text": preferred,
                            "reasoning": f"Replaced deprecated term '{detected_text}' with preferred term '{preferred}'."
                        }
                    })

        return findings
