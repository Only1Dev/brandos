"""
Devil's Advocate Agent — Challenges findings to reduce false positives.
PRD FR-14: Devil's Advocate Agent
Runs after Brand and Fact agents to sanity-check findings against context, channel nuances, and mitigating factors.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, List

from app.services.model_router import get_model_router, GROQ_MODEL_SMALL

logger = logging.getLogger(__name__)


DEVILS_ADVOCATE_PROMPT = """You are the Devil's Advocate Agent for BrandOS, an enterprise content governance system.
Your mission is to CHALLENGE potential false positives and reduce unnecessary friction for creators.

Channel: {channel}
Content Type: {content_type}
Original Content Excerpt:
\"\"\"{content_excerpt}\"\"\"

Findings proposed by governance agents:
{findings_json}

Evaluate each finding critically:
1. Is this finding overly pedantic, ignoring natural idiomatic phrasing or context?
2. Does the channel (e.g. social media, casual blog, press release) grant stylistic leeway that justifies downgrading severity?
3. Is a finding genuinely high risk (e.g. factual falsity, legal liability, prohibited guarantee) that MUST remain unchanged?
4. Non-negotiable Brand Governance: If a finding flags 'Brand Identity & Domain Misalignment', 'Content Quality Standard: Meaningless Placeholder Copy', 'Missing Brand Identity / Unapproved Third-Party Visual', specific Guideline Rule Violations (e.g. Rule 777, mandatory keyword inclusion rules, required tokens, prohibited capitalization / all-caps, or custom administrator rules), or unverified factual claims, you MUST 'MAINTAIN' it at its original severity. Administrator configured rules are absolute and must never be dismissed.

For each finding in the list, determine whether to:
- "MAINTAIN" (finding is valid, keep original severity)
- "DOWNGRADE" (e.g. high -> medium, or medium -> low, with explanation)
- "DISMISS" (finding is a clear false positive or misunderstanding)

Return ONLY a valid JSON array of objects:
[
  {{
    "index": 0,
    "action": "MAINTAIN" | "DOWNGRADE" | "DISMISS",
    "adjusted_severity": "critical" | "high" | "medium" | "low",
    "challenge_rationale": "Why this finding was challenged or maintained"
  }}
]
"""


class DevilsAdvocateAgent:
    """Challenges high-confidence findings to prevent false positives."""

    def __init__(self) -> None:
        self.router = get_model_router()

    async def challenge_findings(
        self,
        findings: List[Dict[str, Any]],
        content_text: str,
        channel: str = "general",
        content_type: str = "article",
    ) -> List[Dict[str, Any]]:
        if not findings:
            return []

        # Only challenge non-deterministic or high/medium findings
        findings_to_challenge = []
        for idx, f in enumerate(findings):
            findings_to_challenge.append({
                "index": idx,
                "type": f.get("finding_type"),
                "severity": f.get("severity"),
                "title": f.get("title"),
                "detected_text": f.get("detected_text"),
                "explanation": f.get("explanation"),
            })

        prompt = DEVILS_ADVOCATE_PROMPT.format(
            channel=channel,
            content_type=content_type,
            content_excerpt=content_text[:500],
            findings_json=json.dumps(findings_to_challenge, indent=2),
        )

        messages = [
            {"role": "system", "content": prompt},
            {"role": "user", "content": "Challenge the findings above and provide adjustments in JSON format."},
        ]

        try:
            response = await self.router.chat_completion(
                messages=messages,
                model=GROQ_MODEL_SMALL,
                temperature=0.1,
                max_tokens=2048,
            )

            content_str = response.strip()
            # Extract JSON array using regex if surrounded by text
            start_idx = content_str.find("[")
            end_idx = content_str.rfind("]")
            if start_idx != -1 and end_idx != -1:
                content_str = content_str[start_idx : end_idx + 1]
            elif content_str.startswith("```json"):
                content_str = content_str[7:]
            if content_str.startswith("```"):
                content_str = content_str[3:]
            if content_str.endswith("```"):
                content_str = content_str[:-3]

            adjustments = json.loads(content_str.strip())
            adj_map = {item.get("index"): item for item in adjustments if "index" in item}

            refined_findings = []
            for idx, finding in enumerate(findings):
                adj = adj_map.get(idx)
                if not adj:
                    refined_findings.append(finding)
                    continue

                title_lower = (finding.get("title") or "").lower()
                rule_ref = (finding.get("rule_ref") or "").lower()
                is_core_governance = (
                    "misalignment" in title_lower
                    or "domain" in title_lower
                    or "brand identity" in title_lower
                    or "unapproved" in title_lower
                    or "third-party" in title_lower
                    or "guarantee" in title_lower
                    or "placeholder" in title_lower
                    or "substance" in title_lower
                    or "missing required" in title_lower
                    or "missing mandatory" in title_lower
                    or "mandatory" in title_lower
                    or "guideline rule violation" in title_lower
                    or rule_ref.startswith("rule")
                    or rule_ref.startswith("brand-")
                    or finding.get("severity") == "critical"
                )

                action = adj.get("action", "MAINTAIN").upper()
                if action == "DISMISS":
                    if is_core_governance:
                        logger.info(f"Devil's Advocate attempted to dismiss core governance finding '{finding.get('title')}' — Overruled: Brand identity and critical governance findings are protected.")
                        refined_findings.append(finding)
                        continue
                    logger.info(f"Devil's Advocate dismissed finding: {finding.get('title')}")
                    continue  # Filter out false positive

                if action == "DOWNGRADE":
                    if is_core_governance:
                        logger.info(f"Devil's Advocate attempted to downgrade core governance finding '{finding.get('title')}' — Maintained as critical.")
                        refined_findings.append(finding)
                        continue
                    old_sev = finding.get("severity")
                    new_sev = adj.get("adjusted_severity", old_sev).lower()
                    finding["severity"] = new_sev
                    rationale = adj.get("challenge_rationale", "")
                    finding["explanation"] += f"\n[Devil's Advocate Note: Severity adjusted from {old_sev} to {new_sev}. Reason: {rationale}]"

                refined_findings.append(finding)

            return refined_findings

        except Exception as e:
            logger.warning(f"Devil's Advocate challenge skipped due to error: {e}")
            return findings
