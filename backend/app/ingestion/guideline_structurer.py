"""
Guideline Structurer — Converts unstructured guideline documents into structured rules.
PRD FR-03: Guideline Import & Structuring.
Transforms freeform brand books into structured RULE-XXX records.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, List

from app.services.model_router import get_model_router, GROQ_MODEL_LARGE

logger = logging.getLogger(__name__)


GUIDELINE_STRUCTURER_PROMPT = """You are the Guideline Structuring Engine for BrandOS.
Your job is to read raw brand guidelines/style manuals and extract discrete, enforceable governance rules.

Extract rules for:
- Tone and voice
- Terminology and naming conventions
- Prohibited statements / guarantees / superlatives
- Visual rules and logo usage
- Channel-specific restrictions

Return ONLY a valid JSON array of structured rules matching this schema:
[
  {{
    "rule_id": "RULE-001",
    "category": "tone" | "terminology" | "visual" | "accessibility" | "legal",
    "rule_text": "Precise, actionable rule statement",
    "severity": "critical" | "high" | "medium" | "low",
    "applies_to": ["social", "website", "advertising", "email"],
    "examples_positive": ["Build faster with verified security."],
    "examples_negative": ["Destroy your competition with zero risk."],
    "policy_level": "brand" | "legal" | "regulatory" | "corporate"
  }}
]
"""


class GuidelineStructurer:
    """Parses unstructured guideline text into machine-enforceable rules."""

    def __init__(self) -> None:
        self.router = get_model_router()

    async def structure_guideline_text(self, text: str) -> List[Dict[str, Any]]:
        if not text.strip():
            return []

        messages = [
            {"role": "system", "content": GUIDELINE_STRUCTURER_PROMPT},
            {"role": "user", "content": f"RAW BRAND GUIDELINE TEXT:\n\n{text[:8000]}"},
        ]

        try:
            response = await self.router.chat_completion(
                messages=messages,
                model=GROQ_MODEL_LARGE,
                temperature=0.1,
                max_tokens=3000,
            )

            content_str = response.strip()
            if content_str.startswith("```json"):
                content_str = content_str[7:]
            if content_str.startswith("```"):
                content_str = content_str[3:]
            if content_str.endswith("```"):
                content_str = content_str[:-3]

            rules = json.loads(content_str.strip())
            return rules if isinstance(rules, list) else []

        except Exception as e:
            logger.error(f"Guideline structuring error: {e}", exc_info=True)
            return []
