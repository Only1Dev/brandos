"""
Fact Agent — Evaluates content claims against approved organizational facts.
PRD FR-11: Fact Agent (Numerical comparison, semantic comparison, validity check, jurisdiction).
PRD Section 39: Hallucination protection ("UNSUPPORTED" rather than "FALSE").
"""

from __future__ import annotations

import difflib
import json
import logging
import re
from datetime import date
from typing import Any, Dict, List, Optional

from app.services.model_router import get_model_router, GROQ_MODEL_LARGE

logger = logging.getLogger(__name__)


def word_matches_topic(content_word: str, topic_word: str) -> bool:
    """
    Robust stemmed and fuzzy topic keyword matching.
    Handles singular/plural ('sweetener' vs 'sweeteners'), variations ('absorption' vs 'absorptive'),
    and common typos ('sweetner' vs 'sweetener') while maintaining strict topic isolation.
    """
    cw = content_word.lower().strip()
    tw = topic_word.lower().strip()
    if not cw or not tw:
        return False
    if cw == tw:
        return True
    if len(cw) >= 4 and len(tw) >= 4:
        if cw in tw or tw in cw:
            return True
        # Shared stem prefix
        if cw[:4] == tw[:4]:
            return True
        # Fuzzy match for typos / spelling variants
        if difflib.SequenceMatcher(None, cw, tw).ratio() >= 0.72:
            return True
    return False


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
            "the", "and", "has", "for", "with", "from", "that", "this", "our", "are", 
            "was", "been", "platform", "delivers", "achieves", "contains", "audited", 
            "verified", "company", "official", "average", "rate", "level", "levels", 
            "data", "benchmark", "report", "standard", "annual", "basis", "state",
            "brand", "brandos", "core", "product", "system", "technology", "technologies"
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

        # Context-aware evaluation per numeric claim
        # Uses local context windows (±60 characters around each number) to isolate specific metrics
        # and prevent compound sentence metrics (e.g. 99.8%, 42%, 99.99%) from clashing against each other.
        for m in re.finditer(r"(\d+(?:\.\d+)?)\s*(%|[a-zA-Z]+)?", text):
            found_num_str = m.group(1)
            found_unit = (m.group(2) or "").strip().lower()
            if not found_num_str:
                continue
            try:
                found_num = float(found_num_str)
            except ValueError:
                continue

            claimed_str = f"{found_num_str}{found_unit}" if found_unit else found_num_str

            # Extract local context window around this specific number
            start_pos = max(0, m.start() - 60)
            end_pos = min(len(text), m.end() + 60)
            local_window = text[start_pos:end_pos].lower()
            local_words = re.findall(r"\b[a-zA-Z]{3,}\b", local_window)

            # 1. First: Check if this number directly matches ANY approved fact in value and local topic
            is_num_verified = False
            for ft in fact_topics:
                num_val = ft["num_val"]
                if num_val is None:
                    continue
                unit = ft["unit"]
                unit_matches = not unit or (found_unit and found_unit == unit) or (unit == "%" and (found_unit == "%" or not found_unit))
                if not unit_matches:
                    continue

                diff = abs(found_num - float(num_val))
                if diff <= 0.01:
                    has_topic_match = any(
                        word_matches_topic(lw, tw)
                        for tw in ft["topic_words"]
                        for lw in local_words
                    )
                    if has_topic_match or len(fact_topics) == 1:
                        is_num_verified = True
                        verified_claims.add(claimed_str)
                        verified_claims.add(found_num_str)
                        verified_claims.add(str(int(found_num)) if found_num.is_integer() else str(found_num))
                        break

            evaluated_claim_numbers.add(found_num_str)

            if is_num_verified:
                continue

            # 2. If not verified, check if this number conflicts with an approved fact in this topic
            scored_facts = []
            for ft in fact_topics:
                num_val = ft["num_val"]
                if num_val is None:
                    continue
                unit = ft["unit"]
                unit_matches = not unit or (found_unit and found_unit == unit) or (unit == "%" and (found_unit == "%" or not found_unit))
                if not unit_matches:
                    continue

                matched_topic_words = []
                for tw in ft["topic_words"]:
                    for lw in local_words:
                        if word_matches_topic(lw, tw):
                            matched_topic_words.append((lw, tw))
                            break
                score = len(matched_topic_words)
                if score >= 1:
                    scored_facts.append((score, ft))

            if not scored_facts:
                continue

            scored_facts.sort(key=lambda x: x[0], reverse=True)
            best_match = scored_facts[0][1]
            diff = abs(found_num - float(best_match["num_val"]))
            if diff <= 0.01:
                verified_claims.add(claimed_str)
                continue

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

                    window_words = re.findall(r"\b[a-zA-Z]{3,}\b", window_text)
                    matched_words = []
                    for tw in matched_fact_obj["topic_words"]:
                        for cw in window_words:
                            if word_matches_topic(cw, tw):
                                matched_words.append((cw, tw))
                                break

                    if len(matched_words) < 1:
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
