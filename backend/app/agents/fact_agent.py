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

CRITICAL RULES FOR TOPIC-ISOLATED FACT VERIFICATION (TruthMark Verification Layer):
1. TOPIC-SPECIFIC EVALUATION (STRICT TOPIC ISOLATION):
   - Each approved fact covers a distinct topic/subject (e.g. "fraud loss reduction", "right swipe rate", "electrolyte absorption", "sugar content").
   - You MUST ONLY evaluate a claim against an approved fact that shares the EXACT SAME TOPIC.
   - NEVER compare a claim from one topic against an unrelated fact just because both use the same symbol (like '%') or share brand names!
   - Example: If content says "right swipe rate of 10%", this is strictly about right swipe rate. It is 100% UNRELATED to "fraud loss reduction" (42%) or "electrolyte absorption". DO NOT compare right swipe rate to fraud loss reduction or water levels!
2. VERIFIED ALIGNMENT:
   - If content mentions a metric or claim that matches an approved fact for that topic (e.g., content claims 10% right swipe rate and an approved fact states 10% right swipe rate), it is FULLY COMPLIANT and should NOT be flagged as a violation.
3. FACTUAL CONFLICT ON MATCHING TOPIC:
   - Only flag a violation if the content mentions a topic covered by an approved fact, but claims an unauthorized or conflicting value (e.g. claims "20% right swipe rate" while approved fact is "10%", or claims "80% fraud reduction" while approved fact is "42%"). Cite the matching fact_ref.
4. CONTENT IS NOT REQUIRED TO MENTION EVERY FACT:
   - Content is NOT required to mention every fact in the knowledge base. If content only discusses "right swipe rate", do NOT flag it for omitting "fraud reduction" or claim that "fraud reduction is missing".
5. SUPERLATIVES:
   - Unbacked superlative claims ("#1 in the country", "fastest ever") without evidence must be flagged.

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

If all claims in the content are fully consistent with approved facts (or if no factual conflict exists), return `[]`.
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

        BRAND_STOP_WORDS = {
            "aureon", "shield", "solaria", "purehydrate", "technologies", "wellness",
            "the", "and", "has", "for", "with", "from", "that", "this", "our", "are", 
            "was", "been", "platform", "delivers", "achieves", "contains", "audited", 
            "verified", "company", "official", "average", "rate", "level", "levels", 
            "data", "benchmark", "report", "standard", "annual", "basis", "state",
            "pure", "hydrate", "brand", "brandos", "core", "product", "system"
        }

        # 1. Deterministic Clause-Level Topic Pre-scan (Strict Topic Isolation)
        findings: List[Dict[str, Any]] = []
        verified_claims: set[str] = set()
        evaluated_claim_numbers: set[str] = set()

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

        # Pre-extract topic keywords per fact
        fact_topics: List[Dict[str, Any]] = []
        for f in facts:
            stmt = f.get("statement") or ""
            num_val = f.get("numerical_value")
            unit = (f.get("numerical_unit") or "").strip().lower()
            if not stmt:
                continue
            topic_words = [w for w in re.findall(r"\b[a-z]{3,}\b", stmt.lower()) if w not in BRAND_STOP_WORDS]
            if not topic_words:
                topic_words = [w for w in re.findall(r"\b[a-z]{3,}\b", stmt.lower())]
            fact_topics.append({
                "fact": f,
                "statement": stmt,
                "num_val": num_val,
                "unit": unit,
                "topic_words": topic_words,
                "fact_ref": f.get("fact_id", f"FACT-{str(f.get('id', ''))[:6].upper()}"),
                "id": str(f.get("id")),
            })

        # Clause-by-clause evaluation to avoid cross-topic false conflicts
        # Split on sentence boundaries as well as compound connectors (', and', ';', ', while', ', but')
        clauses = [c.strip() for c in re.split(r"(?<=[.!?;])\s+|\s*,\s*(?:and|while|but|whereas|plus)\s*", text, flags=re.IGNORECASE) if c.strip()]
        for clause in clauses:
            c_lower = clause.lower()
            num_matches = re.findall(r"(\d+(?:\.\d+)?)\s*(%|[a-zA-Z]+)?", clause)
            if not num_matches:
                continue

            for found_num_str, found_unit in num_matches:
                if not found_num_str:
                    continue
                try:
                    found_num = float(found_num_str)
                except ValueError:
                    continue

                claimed_str = f"{found_num_str}{found_unit}" if found_unit else found_num_str

                # Score facts based on topic keyword overlap in this specific clause
                scored_facts = []
                for ft in fact_topics:
                    num_val = ft["num_val"]
                    if num_val is None:
                        continue
                    unit = ft["unit"]

                    # Check unit compatibility
                    unit_matches = not unit or (found_unit and found_unit.lower() == unit) or (unit == "%" and (found_unit == "%" or not found_unit))
                    if not unit_matches:
                        continue

                    # Check topic relevance in this exact clause
                    matched_topic_words = [w for w in ft["topic_words"] if w in c_lower]
                    score = len(matched_topic_words)
                    min_matches = 2 if len(ft["topic_words"]) >= 2 else 1
                    if score >= min_matches:
                        scored_facts.append((score, ft))

                if not scored_facts:
                    continue

                # Strictly isolate to facts sharing the HIGHEST topic overlap
                scored_facts.sort(key=lambda x: x[0], reverse=True)
                top_score = scored_facts[0][0]
                matching_facts = [ft for score, ft in scored_facts if score == top_score]

                # Check if this number matches ANY of the topic-relevant approved facts
                is_num_verified = False
                for ft in matching_facts:
                    diff = abs(found_num - float(ft["num_val"]))
                    if diff <= 0.01:
                        is_num_verified = True
                        verified_claims.add(claimed_str)
                        verified_claims.add(found_num_str)
                        verified_claims.add(str(int(found_num)) if found_num.is_integer() else str(found_num))
                        break

                evaluated_claim_numbers.add(found_num_str)

                if is_num_verified:
                    continue

                # If not verified by any matching fact for this topic, report conflict against the closest matching fact in this topic
                best_match = min(matching_facts, key=lambda ft: abs(found_num - float(ft["num_val"])))
                diff = abs(found_num - float(best_match["num_val"]))
                approved_str = f"{best_match['num_val']}{best_match['unit']}" if best_match['unit'] else str(best_match['num_val'])
                fact_ref = best_match["fact_ref"]
                f_orig = best_match["fact"]

                findings.append({
                    "finding_type": "fact",
                    "severity": "critical" if diff > 10 else "high",
                    "title": f"Factual Metric Conflict ({fact_ref})",
                    "description": f"Content claims {claimed_str}, but approved Brand Brain fact states: '{best_match['statement']}' (Approved value: {approved_str}).",
                    "detected_text": claimed_str,
                    "explanation": f"Approved organizational fact [{fact_ref}] establishes '{best_match['statement']}'. The claimed figure of {claimed_str} contradicts active ground truth.",
                    "confidence": 1.0,
                    "fact_id": f_orig.get("id"),
                    "evidence": [{
                        "evidence_type": "fact",
                        "source_ref": fact_ref,
                        "description": f"Approved value is '{approved_str}', whereas content claims '{claimed_str}'.",
                        "data": {
                            "approved_value": approved_str,
                            "claimed_value": claimed_str,
                            "source_ref": fact_ref,
                            "statement": best_match["statement"],
                        }
                    }],
                    "suggestion": {
                        "original_text": claimed_str,
                        "suggested_text": approved_str,
                        "reasoning": f"Aligns with active verified fact: '{best_match['statement']}'"
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
                det_detected = {f.get("detected_text", "") for f in findings if f.get("detected_text")}
                det_facts = {f.get("evidence", [{}])[0].get("source_ref") for f in findings if f.get("evidence")}

                for item in raw_findings:
                    fact_ref = (item.get("fact_ref") or "FACT-APPROVED").strip()
                    approved_val = item.get("approved_value", "")
                    claimed_val = item.get("claimed_value", "")
                    detected = (item.get("detected_text") or "").strip()

                    # Extract all numbers referenced in this finding
                    claimed_nums = re.findall(r"\d+(?:\.\d+)?", f"{detected} {claimed_val}")

                    # 1. If any claimed number matches a verified ground-truth claim in this content, DROP
                    if any(num in verified_claims for num in claimed_nums):
                        continue

                    # 2. Check if claimed number matches ANY active approved fact in the organization
                    matches_approved_fact = False
                    for ft in fact_topics:
                        if ft.get("num_val") is not None:
                            for cn in claimed_nums:
                                try:
                                    if abs(float(cn) - float(ft["num_val"])) <= 0.01:
                                        matches_approved_fact = True
                                        break
                                except ValueError:
                                    pass
                    if matches_approved_fact:
                        continue

                    # 3. If this exact number was already evaluated and reported under its legitimate topic,
                    # DO NOT evaluate this same number against another unrelated fact!
                    if any(num in evaluated_claim_numbers for num in claimed_nums):
                        continue

                    if detected and detected in det_detected:
                        continue

                    # 4. Strictly identify the approved fact object being referenced
                    matched_fact_obj = None
                    for ft in fact_topics:
                        if ft["fact_ref"] == fact_ref or ft["id"] == fact_ref or str(ft["fact"].get("id")) == fact_ref or ft["fact"].get("fact_id") == fact_ref:
                            matched_fact_obj = ft
                            break

                    # Fallback fuzzy match on statement or approved value
                    if not matched_fact_obj and approved_val:
                        for ft in fact_topics:
                            if str(ft.get("num_val")) in str(approved_val):
                                matched_fact_obj = ft
                                break

                    # If finding claims a conflict but cannot identify any approved fact in knowledge base, drop hallucination
                    if not matched_fact_obj:
                        continue

                    # 5. Cross-topic validation: Ensure the specific text window around detected actually mentions this fact's distinctive topic keywords
                    window_text = text.lower()
                    if detected.lower() in text.lower():
                        d_idx = text.lower().find(detected.lower())
                        start_w = max(0, d_idx - 100)
                        end_w = min(len(text), d_idx + len(detected) + 100)
                        window_text = text[start_w:end_w].lower()

                    matched_words = [w for w in matched_fact_obj["topic_words"] if w in window_text]
                    min_req = 2 if len(matched_fact_obj["topic_words"]) >= 2 else 1
                    if len(matched_words) < min_req:
                        # False cross-topic comparison! Drop this finding immediately.
                        continue

                    # Mark numbers as evaluated to prevent subsequent false conflicts
                    for cn in claimed_nums:
                        evaluated_claim_numbers.add(cn)
                    if detected:
                        det_detected.add(detected)

                    # Find corresponding fact object id
                    matched_fact_id = matched_fact_obj["fact"].get("id")

                    findings.append({
                        "finding_type": "fact",
                        "severity": item.get("severity", "high").lower(),
                        "title": item.get("title", f"Factual Metric Conflict ({matched_fact_obj['fact_ref']})"),
                        "description": item.get("description", ""),
                        "detected_text": detected,
                        "explanation": item.get("explanation", ""),
                        "confidence": float(item.get("confidence", 0.95)),
                        "fact_id": matched_fact_id,
                        "evidence": [{
                            "evidence_type": "fact",
                            "source_ref": matched_fact_obj["fact_ref"],
                            "description": f"Approved value is '{approved_val}', whereas content claims '{claimed_val}'.",
                            "data": {
                                "approved_value": approved_val,
                                "claimed_value": claimed_val,
                                "source_ref": matched_fact_obj["fact_ref"],
                            }
                        }],
                        "suggestion": item.get("suggestion", {
                            "original_text": detected,
                            "suggested_text": f"Verified metric: {approved_val}" if approved_val else "",
                            "reasoning": f"Aligns with active verified fact: '{matched_fact_obj['statement']}'"
                        })
                    })

        except Exception as e:
            logger.error(f"FactAgent evaluation error: {e}", exc_info=True)

        return findings
