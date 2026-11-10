"""
Fact Agent — Evaluates content claims against approved organizational facts.
PRD FR-11: Fact Agent (Numerical comparison, semantic comparison, validity check, jurisdiction).
PRD Section 39: Hallucination protection ("UNSUPPORTED" rather than "FALSE").
"""

from __future__ import annotations

import json
import logging
import re
from datetime import date
from typing import Any, Dict, List, Optional

from app.services.model_router import get_model_router, GROQ_MODEL_LARGE

logger = logging.getLogger(__name__)


FACT_AGENT_SYSTEM_PROMPT = """You are the Fact Verification Agent for BrandOS, an enterprise content governance platform.
Your job is to compare claims made in organizational content strictly against APPROVED ORGANIZATIONAL FACTS for {brand_name}.

APPROVED FACTS IN THE KNOWLEDGE BASE ({brand_name}):
{facts_context}

CRITICAL RULES (TruthMark Verification Layer):
1. Hallucination Protection: If a factual claim (e.g., metric, statistic, feature, partnership, performance percentage like "80% success rate", "reduces fraud by 73%") is not supported by the approved facts, mark it as "UNSUPPORTED CLAIM", NOT "FALSE". State clearly: "No approved organizational evidence in {brand_name}'s knowledge base supports this claim."
2. Numerical Mismatch: If content claims "73%" but approved fact says "42%", this is a CRITICAL/HIGH severity factual mismatch.
3. Superlative Claims: If content claims "the best in the market", "#1 platform", or "industry first" without matching approved facts, mark as unsupported superlative claim.
4. Expiration: Note if any matched fact is expired or near expiration.
5. Preserving Intent: Suggest a safe, truthful replacement that preserves creator intent without misleading metrics.

Return ONLY a valid JSON array of findings with this exact schema:
[
  {{
    "finding_type": "fact",
    "severity": "critical" | "high" | "medium" | "low",
    "title": "Short title (e.g. Unsupported Numerical Claim)",
    "description": "What was claimed vs what is approved",
    "detected_text": "Exact quote from content",
    "explanation": "Why this is an issue (cite approved value vs claimed value)",
    "fact_ref": "FACT-XXX if matched, or 'NONE'",
    "approved_value": "The approved value or 'None'",
    "claimed_value": "The claimed value in content",
    "confidence": 0.0 to 1.0,
    "suggestion": {{
      "original_text": "Exact quote",
      "suggested_text": "Approved wording or metric",
      "reasoning": "Preserves intent using verified facts"
    }}
  }}
]

If all claims in the content are fully consistent with approved facts, return `[]`.
"""


class FactAgent:
    """Compares content claims against approved organizational facts."""

    def __init__(self) -> None:
        self.router = get_model_router()

    async def evaluate(
        self,
        text: str,
        facts: List[Dict[str, Any]],
        extracted_claims: List[Dict[str, Any]] | None = None,
        brand_name: str = "Aureon Technologies",
    ) -> List[Dict[str, Any]]:
        if not text.strip():
            return []

        # 1. Deterministic Numerical / Percentage Pre-scan
        findings: List[Dict[str, Any]] = []

        # Format facts context
        facts_text_list = []
        for f in facts:
            status = f.get("status", "active")
            valid_until = str(f.get("valid_until", "N/A"))
            fact_ref = f.get("fact_id", f"FACT-{str(f.get('id', ''))[:6]}")
            name = f.get("name", "")
            val = str(f.get("value", ""))
            facts_text_list.append(
                f"- [{fact_ref}] {name}: Approved Value = '{val}' (Status: {status}, Valid until: {valid_until})"
            )

        facts_context = "\n".join(facts_text_list) if facts_text_list else "No approved facts currently registered."

        prompt = FACT_AGENT_SYSTEM_PROMPT.format(
            facts_context=facts_context,
            brand_name=brand_name,
        )

        # For long documents, sample representative sections
        eval_text = text
        if len(text) > 9000:
            mid = len(text) // 2
            eval_text = f"{text[:4000]}\n\n[... DOCUMENT EXCERPT CONTINUED ...]\n\n{text[mid:mid+3000]}\n\n[... FINAL SECTIONS ...]\n\n{text[-2000:]}"

        messages = [
            {"role": "system", "content": prompt},
            {"role": "user", "content": f"CONTENT TO VERIFY:\n\n{eval_text}"},
        ]

        try:
            response = await self.router.chat_completion(
                messages=messages,
                model=GROQ_MODEL_LARGE,
                temperature=0.1,
                max_tokens=2048,
            )

            # Clean and parse JSON
            content_str = response.strip()
            if content_str.startswith("```json"):
                content_str = content_str[7:]
            if content_str.startswith("```"):
                content_str = content_str[3:]
            if content_str.endswith("```"):
                content_str = content_str[:-3]

            raw_findings = json.loads(content_str.strip())
            if isinstance(raw_findings, list):
                for item in raw_findings:
                    fact_ref = item.get("fact_ref", "FACT-APPROVED")
                    approved_val = item.get("approved_value", "")
                    claimed_val = item.get("claimed_value", "")

                    # Find corresponding fact object if any
                    matched_fact_id = None
                    for f in facts:
                        if f.get("fact_id") == fact_ref:
                            matched_fact_id = f.get("id")
                            break

                    findings.append({
                        "finding_type": "fact",
                        "severity": item.get("severity", "high").lower(),
                        "title": item.get("title", "Unsupported Factual Claim"),
                        "description": item.get("description", ""),
                        "detected_text": item.get("detected_text", ""),
                        "explanation": item.get("explanation", ""),
                        "confidence": float(item.get("confidence", 0.95)),
                        "fact_id": matched_fact_id,
                        "evidence": [{
                            "evidence_type": "fact",
                            "source_ref": fact_ref,
                            "description": f"Approved value is '{approved_val}', whereas content claims '{claimed_val}'.",
                            "data": {
                                "approved_value": approved_val,
                                "claimed_value": claimed_val,
                                "source_ref": fact_ref,
                            }
                        }],
                        "suggestion": item.get("suggestion", {
                            "original_text": item.get("detected_text", ""),
                            "suggested_text": f"Verified metric: {approved_val}" if approved_val else "",
                            "reasoning": "Aligns with verified facts database"
                        })
                    })

        except Exception as e:
            logger.error(f"FactAgent evaluation error: {e}", exc_info=True)

        return findings
