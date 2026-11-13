"""
Brand Agent — Evaluates tone, personality, language, brand voice, and channel appropriateness.
PRD FR-10: Brand Agent
Uses Groq LLM (Llama 3.3 70B) with structured JSON output via ModelRouter.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any, Dict, List, Optional

from app.services.model_router import get_model_router, GROQ_MODEL_LARGE

logger = logging.getLogger(__name__)


BRAND_AGENT_SYSTEM_PROMPT = """You are the Brand Agent for BrandOS, an enterprise content governance platform.
Your job is to evaluate organizational content against approved Brand Guidelines, Rules, and Entity Identity.

ACTIVE WORKSPACE BRAND:
Brand Name: {brand_name}
Core Domain & Mission: {brand_domain}
Approved Offerings: Enterprise fraud prevention, banking transaction security, autonomous cyber defense (Aureon Shield).

Guidelines and rules to verify against:
{rules_context}

Content channel: {channel}
Content type: {content_type}

Evaluate the following content thoroughly for:
1. Brand Identity & Domain Alignment (CRITICAL):
   Does this content pertain to the active brand ({brand_name}) and its business domain ({brand_domain})?
   - IMPORTANT: If the content mentions {brand_name} or relates to enterprise fraud prevention, banking security, risk intelligence, cyber defense, or financial technology, it IS ALIGNED WITH THE BRAND DOMAIN.
   - DO NOT flag "Brand Identity & Domain Misalignment" for copy discussing {brand_name} offerings!
   - Factual discrepancies (e.g. 73% vs 42%), superlatives ("India's #1"), or absolute guarantees ("100% protection") are tone/claim/fact violations, NEVER domain misalignment.
   - If and ONLY if the content pertains to an external entity, unrelated product (e.g., kitchen appliances like 'Sujata mixer grinder', external software proposals or PRDs like 'BrandOS', study tips, fitness/recipes), or has zero relevance to {brand_name}'s mission:
     You MUST flag a CRITICAL violation:
     - severity: "critical"
     - title: "Brand Identity & Domain Misalignment"
     - description: "Content pertains to an external entity or unrelated domain rather than {brand_name}'s enterprise solutions."
     - rule_ref: "BRAND-IDENTITY-001"
     - confidence: 0.95
2. Registered Guidelines & Custom Rules (MANDATORY ENFORCEMENT):
   You MUST evaluate against EVERY single rule listed under "Guidelines and rules to verify against" above.
   - If a rule mandates including a specific keyword or phrase (e.g. "kanishka", 'A' in capital, "must contain XYZ"), check whether it is present. If missing, return a violation citing that rule_id in rule_ref (e.g. 'RULE-1', 'rule 01').
   - If a rule prohibits writing in caps (e.g. Rule 777: "Never ever write anything in caps"), check for ALL CAPS text, uppercase shouting, or capitalized words, and return a violation citing that rule_id (e.g. '777').
   - If a rule specifies banned terms, tone constraints, or requirements, cite the exact rule_id in rule_ref.
3. Content Substance & Anti-Gibberish Standards (CRITICAL):
   If the content consists of meaningless placeholder text, keyboard mash, or random characters (e.g. 'abcd', 'asdf', 'test123'), you MUST flag a CRITICAL violation citing rule_ref 'BRAND-SUBSTANCE-001' with title "Content Quality Standard: Meaningless Placeholder Copy".
4. Confidential & Proprietary Information Leakage (CRITICAL DLP):
   If the content contains internal classification banners (e.g. "CONFIDENTIAL", "STRICTLY CONFIDENTIAL", "INTERNAL USE ONLY", "DO NOT DISTRIBUTE", "NDA PROTECTED"), private staging URLs, or exposed credentials, you MUST flag a CRITICAL violation citing rule_ref 'BRAND-CONFIDENTIAL-001' with title "Confidential & Proprietary Information Leakage".
5. Tone, Voice & Personality Taxonomy (15-Field Voice Fingerprint):
   - Sentence Rhythm & Pacing: Ensure balanced cadence. Flag breathless run-on hype, excessive exclamation points, or disjointed choppy fragments.
   - Humor & Personality Register: Enforce brand personality register ({brand_name} is authoritative, evidence-backed, and composed). Flag flippancy, sarcasm, cynicism, or unearned levity.
   - Vocabulary Do's & Don'ts: Prohibit empty hype buzzwords ('game-changer', 'magic bullet', 'insane results', 'next-gen miracle', 'revolutionary'). Mandate precise industry terminology.
   - Formality & Channel Fit: Ensure formality matches channel '{channel}'. Press releases, investor memos, and whitepapers require formal executive tone. Social copy must maintain professional dignity without informal slang or internet colloquialisms.
   - Signature Stylistic Patterns: Assertions must lead with concrete quantified data rather than vague emotional appeals.
6. Absolute guarantees or prohibited promises (e.g. "guarantees 100% protection", "zero risk", "flawless security")
7. Unsupported superlatives (e.g. "India's #1", "the best in the market", "industry leader" without verifiable citation)
8. Channel appropriateness (e.g., inappropriate length, structural mismatch for {channel})

For every violation detected:
- Cite the relevant rule_id (if matched from guidelines or 'BRAND-IDENTITY-001')
- Assign severity: 'critical', 'high', 'medium', or 'low'
- Extract the exact offending detected_text
- Explain why it is a violation
- Provide an evidence-backed rationale
- Propose an approved replacement suggestion that preserves the creator's intent, audience, and message

Return ONLY a valid JSON array of objects with the following schema:
[
  {{
    "finding_type": "brand",
    "severity": "critical" | "high" | "medium" | "low",
    "title": "Short title describing issue",
    "description": "Clear description of what violates brand policy",
    "detected_text": "Exact quote from content",
    "explanation": "Detailed explanation of why this matters",
    "rule_ref": "RULE-XXX or Brand Policy",
    "confidence": 0.0 to 1.0,
    "suggestion": {{
      "original_text": "Exact quote",
      "suggested_text": "Corrected text preserving intent",
      "reasoning": "Why this correction works"
    }}
  }}
]

If NO brand violations exist, return an empty array `[]`.
"""


class BrandAgent:
    """Evaluates content against brand voice, domain identity, and tone guidelines."""

    def __init__(self) -> None:
        self.router = get_model_router()

    async def evaluate(
        self,
        text: str,
        rules: List[Dict[str, Any]],
        channel: str = "general",
        content_type: str = "article",
        brand_name: str = "Aureon Technologies",
        brand_domain: str = "Enterprise security and fraud detection intelligence",
    ) -> List[Dict[str, Any]]:
        if not text.strip():
            return []

        # Format rules for prompt
        rules_text = "\n".join([
            f"- [{r.get('rule_id', 'RULE')}] ({r.get('category', 'tone')} / Severity: {r.get('severity', 'medium')}) "
            f"Rule: {r.get('rule_text', '')} | Positive: {r.get('examples_positive', [])} | Negative: {r.get('examples_negative', [])}"
            for r in rules
        ]) if rules else "General Brand Guidelines: Maintain confident, honest, non-aggressive, non-superlative tone. Avoid unbacked 100% guarantees or #1 claims."

        prompt = BRAND_AGENT_SYSTEM_PROMPT.format(
            rules_context=rules_text,
            channel=channel,
            content_type=content_type,
            brand_name=brand_name,
            brand_domain=brand_domain,
        )

        # For long multi-page documents (e.g. 27-page proposal PDFs), build a representative sample
        eval_text = text
        if len(text) > 9000:
            mid = len(text) // 2
            eval_text = f"{text[:4000]}\n\n[... DOCUMENT EXCERPT CONTINUED ...]\n\n{text[mid:mid+3000]}\n\n[... FINAL SECTIONS ...]\n\n{text[-2000:]}"

        messages = [
            {"role": "system", "content": prompt},
            {"role": "user", "content": f"CONTENT TO EVALUATE:\n\n{eval_text}"},
        ]

        try:
            response = await self.router.chat_completion(
                messages=messages,
                model=GROQ_MODEL_LARGE,
                temperature=0.1,
                max_tokens=2048,
            )

            # Extract json array
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

            # Format to BrandOS finding schema
            formatted_findings = []
            for item in raw_findings:
                rule_ref = item.get("rule_ref", "RULE-BRAND")
                formatted_findings.append({
                    "finding_type": "brand",
                    "severity": item.get("severity", "medium").lower(),
                    "title": item.get("title", "Brand Voice Violation"),
                    "description": item.get("description", ""),
                    "detected_text": item.get("detected_text", ""),
                    "explanation": item.get("explanation", ""),
                    "confidence": float(item.get("confidence", 0.9)),
                    "evidence": [{
                        "evidence_type": "rule",
                        "source_ref": rule_ref,
                        "description": item.get("explanation", "Violates brand guidelines."),
                        "data": {"rule": rule_ref, "detected": item.get("detected_text", "")}
                    }],
                    "suggestion": item.get("suggestion", {
                        "original_text": item.get("detected_text", ""),
                        "suggested_text": "",
                        "reasoning": "Brand guideline alignment"
                    })
                })
            return formatted_findings

        except Exception as e:
            logger.error(f"BrandAgent evaluation error: {e}", exc_info=True)
            return []
