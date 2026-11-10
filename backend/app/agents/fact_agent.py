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
1. DYNAMIC GROUND TRUTH: The facts listed above represent the COMPLETE, active source of truth. Every time a new fact is added to the Brand Brain, it must be enforced immediately.
2. VERIFIED ALIGNMENT: If the content mentions a metric or claim that matches an approved fact (e.g., content claims 10% right swipe rate and an approved fact states 10% right swipe rate), it is FULLY COMPLIANT and should NOT be flagged as a violation.
3. FACTUAL CONFLICT & NUMERICAL MISMATCH: If content mentions a metric or claim relating to a subject covered in the approved facts, but with an unauthorized or conflicting value (e.g., content claims "20% right swipe rate" while approved fact is "10%", or claims "80% fraud reduction" while approved fact is "42%"), you MUST flag this as a HIGH/CRITICAL violation citing the exact fact_ref.
4. HALLUCINATION & UNSUPPORTED CLAIMS: If a factual claim (percentage, benchmark, clinical test, financial metric) has no approved basis in the knowledge base, flag it as "Unsupported Factual Claim".
5. SUPERLATIVES: Unbacked superlative claims ("#1 in the country", "fastest ever") without evidence must be flagged.

Return ONLY a valid JSON array of findings with this exact schema:
[
  {{
    "finding_type": "fact",
    "severity": "critical" | "high" | "medium" | "low",
    "title": "Short title (e.g. Unsupported Numerical Claim / Factual Metric Conflict)",
    "description": "What was claimed vs what is approved in the Brand Brain",
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

        # Format facts context with full statement and metric grounding
        facts_text_list = []
        for f in facts:
            status = f.get("status", "active")
            valid_until = str(f.get("valid_until", "N/A"))
            fact_ref = f.get("fact_id", f"FACT-{str(f.get('id', ''))[:6].upper()}")
            category = f.get("category") or f.get("name", "general")
            statement = f.get("statement") or f.get("value", "")
            val = str(f.get("value", ""))
            facts_text_list.append(
                f"- [{fact_ref}] Fact: \"{statement}\" | Approved Metric/Value: '{val}' (Category: {category}, Status: {status}, Valid until: {valid_until})"
            )

        # Deterministic check for numerical claims matching active facts
        text_lower = text.lower()
        for f in facts:
            stmt = (f.get("statement") or "").lower()
            num_val = f.get("numerical_value")
            unit = (f.get("numerical_unit") or "").strip().lower()
            if num_val is None or not stmt:
                continue

            # Extract subject keywords from statement (e.g. "right swipe", "reduction in transaction fraud")
            words = [w for w in re.findall(r"\b[a-z]{3,}\b", stmt) if w not in {"the", "and", "has", "for", "with", "from", "that", "this", "our", "are", "was", "been", "platform", "delivers", "achieves", "contains"}]
            if not words:
                continue

            # Check if key phrases or words match in text
            matched_words = [w for w in words if w in text_lower]
            if len(matched_words) >= 2 or (len(words) <= 2 and len(matched_words) >= 1):
                # Search for numbers in text
                num_matches = re.findall(r"\b(\d+(?:\.\d+)?)\s*(%|[a-zA-Z]+)?\b", text)
                for found_num_str, found_unit in num_matches:
                    try:
                        found_num = float(found_num_str)
                    except ValueError:
                        continue

                    # If unit is % or matches, and the number conflicts with approved value
                    unit_matches = not unit or (found_unit and found_unit.lower() == unit) or unit == "%"
                    if unit_matches and abs(found_num - float(num_val)) > 0.01:
                        fact_ref = f.get("fact_id", f"FACT-{str(f.get('id', ''))[:6].upper()}")
                        approved_str = f"{num_val}{unit}" if unit else str(num_val)
                        claimed_str = f"{found_num_str}{found_unit}" if found_unit else found_num_str
                        findings.append({
                            "finding_type": "fact",
                            "severity": "critical" if abs(found_num - float(num_val)) > 10 else "high",
                            "title": f"Factual Metric Conflict ({fact_ref})",
                            "description": f"Content claims {claimed_str}, but approved Brand Brain fact states: '{f.get('statement')}' (Approved value: {approved_str}).",
                            "detected_text": f"{found_num_str}{found_unit}".strip(),
                            "explanation": f"Approved organizational fact [{fact_ref}] establishes '{f.get('statement')}'. The claimed figure of {claimed_str} is unverified and contradicts active ground truth.",
                            "confidence": 1.0,
                            "fact_id": f.get("id"),
                            "evidence": [{
                                "evidence_type": "fact",
                                "source_ref": fact_ref,
                                "description": f"Approved value is '{approved_str}', whereas content claims '{claimed_str}'.",
                                "data": {
                                    "approved_value": approved_str,
                                    "claimed_value": claimed_str,
                                    "source_ref": fact_ref,
                                    "statement": f.get("statement"),
                                }
                            }],
                            "suggestion": {
                                "original_text": claimed_str,
                                "suggested_text": approved_str,
                                "reasoning": f"Aligns with active verified fact: '{f.get('statement')}'"
                            }
                        })

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

            raw_findings = []
            if content_str.strip():
                try:
                    parsed = json.loads(content_str.strip())
                    if isinstance(parsed, list):
                        raw_findings = parsed
                except Exception:
                    m = re.search(r"\[\s*\{.*\}\s*\]", content_str, re.DOTALL)
                    if m:
                        try:
                            parsed = json.loads(m.group(0))
                            if isinstance(parsed, list):
                                raw_findings = parsed
                        except Exception:
                            pass
            if isinstance(raw_findings, list):
                for item in raw_findings:
                    fact_ref = item.get("fact_ref", "FACT-APPROVED")
                    approved_val = item.get("approved_value", "")
                    claimed_val = item.get("claimed_value", "")

                    # Check if already covered by deterministic check
                    det_detected = {f["detected_text"] for f in findings if "detected_text" in f}
                    if item.get("detected_text") in det_detected:
                        continue

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
