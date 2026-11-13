"""
Policy engine: deterministic rule matching.
- Terminology violations (exact match / regex)
- Numerical comparison with tolerance
- Date expiry checks
- Policy precedence resolution
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date
from typing import List, Optional
from uuid import UUID


@dataclass
class PolicyViolation:
    rule_id: Optional[UUID] = None
    fact_id: Optional[UUID] = None
    terminology_rule_id: Optional[UUID] = None
    asset_id: Optional[UUID] = None
    category: str = ""
    severity: str = "warning"
    title: str = ""
    description: str = ""
    content_excerpt: str = ""
    source_location: str = ""
    evidence_type: str = ""
    evidence_source_text: str = ""
    policy_priority: float = 1.0
    confidence: float = 1.0


def check_terminology_violations(
    text: str,
    terminology_rules: list,
) -> List[PolicyViolation]:
    """
    Deterministic terminology check.
    Scans text for deprecated/forbidden terms.
    """
    violations: List[PolicyViolation] = []

    for rule in terminology_rules:
        if not rule.is_active:
            continue
        if rule.term_type == "preferred":
            continue  # preferred terms are not violations

        pattern_text = rule.term
        flags = 0 if rule.case_sensitive else re.IGNORECASE

        if rule.is_regex:
            try:
                pattern = re.compile(pattern_text, flags)
            except re.error:
                continue
        else:
            escaped = re.escape(pattern_text)
            pattern = re.compile(rf"\b{escaped}\b", flags)

        for match in pattern.finditer(text):
            start = max(0, match.start() - 30)
            end = min(len(text), match.end() + 30)
            excerpt = text[start:end]

            alt = rule.preferred_alternative or "(no alternative specified)"
            desc = (
                f"{'Forbidden' if rule.term_type == 'forbidden' else 'Deprecated'} "
                f"term '{match.group()}' found. "
                f"Use '{alt}' instead."
            )
            if rule.context:
                desc += f" Context: {rule.context}"

            violations.append(PolicyViolation(
                terminology_rule_id=rule.id,
                category="terminology",
                severity=rule.severity,
                title=f"Terminology violation: '{match.group()}'",
                description=desc,
                content_excerpt=excerpt,
                source_location=f"character {match.start()}",
                evidence_type="terminology_rule",
                evidence_source_text=f"Term '{rule.term}' is {rule.term_type}",
                policy_priority=2.0 if rule.term_type == "forbidden" else 1.0,
                confidence=1.0,
            ))

    return violations


def check_numerical_claims(
    extracted_numbers: list[dict],
    facts: list,
    text: str,
) -> List[PolicyViolation]:
    """
    Compare extracted numerical values against approved facts with strict topic relevance.
    Only compares a number to a fact if the distinctive topic keywords of that fact match.
    """
    violations: List[PolicyViolation] = []
    text_lower = text.lower()

    BRAND_STOP_WORDS = {
        "aureon", "shield", "solaria", "purehydrate", "technologies", "wellness",
        "the", "and", "has", "for", "with", "from", "that", "this", "our", "are", 
        "was", "been", "platform", "delivers", "achieves", "contains", "audited", 
        "verified", "company", "official", "average", "rate", "level", "levels", 
        "data", "benchmark", "report", "standard", "annual", "basis", "state"
    }

    for fact in facts:
        if not getattr(fact, "is_active", True) or getattr(fact, "numerical_value", None) is None:
            continue

        stmt = getattr(fact, "statement", "") or ""
        topic_words = [w for w in re.findall(r"\b[a-z]{3,}\b", stmt.lower()) if w not in BRAND_STOP_WORDS]
        if not topic_words:
            topic_words = [w for w in re.findall(r"\b[a-z]{3,}\b", stmt.lower())]

        # Only compare if the content text actually mentions this fact's distinctive topic words
        matched_topic_words = [w for w in topic_words if w in text_lower]
        min_matches = 2 if len(topic_words) >= 2 else 1
        if len(matched_topic_words) < min_matches:
            continue

        for num in extracted_numbers:
            num_value = num.get("value")
            num_unit = num.get("unit", "").lower()
            fact_unit = (getattr(fact, "numerical_unit", None) or "").lower()

            # Only compare if units match or one is empty
            if fact_unit and num_unit and fact_unit != num_unit and not (fact_unit == "%" and num_unit == "%"):
                continue

            if num_value is None:
                continue

            tolerance = getattr(fact, "numerical_tolerance", None) or 0.0
            diff = abs(num_value - fact.numerical_value)

            if diff > tolerance and diff / max(abs(fact.numerical_value), 1e-9) > 0.01:
                raw = num.get("raw", str(num_value))
                violations.append(PolicyViolation(
                    fact_id=fact.id,
                    category="numerical_accuracy",
                    severity="error",
                    title=f"Numerical mismatch: {raw} vs approved {fact.numerical_value}{fact.numerical_unit or ''}",
                    description=(
                        f"Content states '{raw}' but the approved fact is "
                        f"'{fact.numerical_value} {fact.numerical_unit or ''}'.  "
                        f"Difference: {diff:.2f}. "
                        f"Tolerance: ±{tolerance}. "
                        f"Approved fact: '{fact.statement}'"
                    ),
                    content_excerpt=raw,
                    source_location=f"character {num.get('position', '?')}",
                    evidence_type="fact",
                    evidence_source_text=fact.statement,
                    policy_priority=3.0,
                    confidence=0.8,
                ))

    return violations


def check_expired_facts(facts: list) -> List[PolicyViolation]:
    """Flag facts that have expired or are about to expire."""
    violations: List[PolicyViolation] = []
    today = date.today()

    for fact in facts:
        if not fact.is_active:
            continue
        if fact.valid_until and today > fact.valid_until:
            violations.append(PolicyViolation(
                fact_id=fact.id,
                category="fact_expiry",
                severity="error",
                title=f"Expired fact referenced: '{fact.statement[:80]}'",
                description=(
                    f"This fact expired on {fact.valid_until}. "
                    f"Content referencing it may contain outdated information."
                ),
                evidence_type="fact",
                evidence_source_text=fact.statement,
                policy_priority=3.0,
                confidence=1.0,
            ))
        elif fact.valid_until:
            days_left = (fact.valid_until - today).days
            if days_left <= 30:
                violations.append(PolicyViolation(
                    fact_id=fact.id,
                    category="fact_expiry_warning",
                    severity="warning",
                    title=f"Fact expiring soon: '{fact.statement[:80]}'",
                    description=(
                        f"This fact expires on {fact.valid_until} "
                        f"({days_left} days remaining)."
                    ),
                    evidence_type="fact",
                    evidence_source_text=fact.statement,
                    policy_priority=2.0,
                    confidence=1.0,
                ))

    return violations


def resolve_policy_precedence(violations: List[PolicyViolation]) -> List[PolicyViolation]:
    """
    When multiple violations target the same content excerpt,
    keep the one with the highest policy_priority.
    """
    if not violations:
        return violations

    # Group by excerpt
    by_excerpt: dict[str, List[PolicyViolation]] = {}
    for v in violations:
        key = v.content_excerpt.strip().lower() if v.content_excerpt else ""
        by_excerpt.setdefault(key, []).append(v)

    resolved: List[PolicyViolation] = []
    for key, group in by_excerpt.items():
        if not key:
            resolved.extend(group)
            continue
        # Keep the highest-priority violation for the same excerpt, plus any with different categories
        seen_cats: set = set()
        sorted_group = sorted(group, key=lambda v: -v.policy_priority)
        for v in sorted_group:
            cat_key = (v.category, v.title)
            if cat_key not in seen_cats:
                seen_cats.add(cat_key)
                resolved.append(v)

    return resolved



def check_confidentiality_dlp(text: str) -> List[dict]:
    """
    Zero-tolerance Data Loss Prevention (DLP) & Confidential Material Shield.
    Detects internal classification markers, secrets, credentials, staging URLs,
    and private employee PII to prevent accidental leakage of confidential company info.
    """
    violations = []
    if not text or not text.strip():
        return violations

    text_lower = text.lower()

    # 1. Internal Classification Banners & Watermarks
    CONFIDENTIAL_MARKERS = [
        r"\b(?:strictly\s+confidential|confidential\s+and\s+proprietary|internal\s+use\s+only|do\s+not\s+distribute|internal\s+only|company\s+confidential|nda\s+protected|under\s+nda|not\s+for\s+public\s+release|for\s+internal\s+eyes\s+only)\b",
        r"\b(?:confidential\s*[:-]\s*internal|confidential\s+document|proprietary\s+information)\b",
    ]

    for pattern_str in CONFIDENTIAL_MARKERS:
        m = re.search(pattern_str, text, re.IGNORECASE)
        if m:
            matched_text = m.group(0)
            violations.append({
                "finding_type": "brand",
                "severity": "critical",
                "title": "Confidential & Proprietary Information Leakage",
                "description": f"Content contains internal classification marker '{matched_text}'. BrandOS zero-tolerance firewall strictly blocks publishing confidential internal materials to public channels.",
                "detected_text": matched_text,
                "explanation": "Protecting confidential brand materials is mandatory. Outgoing public copy must never contain internal-only banners, confidential disclaimers, or NDA-protected markings.",
                "rule_ref": "BRAND-CONFIDENTIAL-001",
                "confidence": 1.0,
                "evidence": [{
                    "evidence_type": "policy",
                    "source_ref": "BRAND-CONFIDENTIAL-001",
                    "description": "Zero-tolerance DLP: Internal classification banners and confidential company markers are blocked from public release.",
                    "data": {"leak_detected": matched_text}
                }],
                "suggestion": {
                    "original_text": matched_text,
                    "suggested_text": "",
                    "reasoning": "Remove internal confidentiality banners before publishing to public channels."
                }
            })
            break

    # 2. Leaked Secrets, Staging Endpoints, & Private Credentials
    CREDENTIAL_PATTERNS = [
        (r"\b(?:sk_[a-zA-Z0-9_\-]{16,}|ghp_[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16})\b", "Exposed Secret / API Key Token"),
        (r"\b(?:password|passwd|api_key|secret_key|private_key)\s*[:=]\s*['\"]?([^\s'\"]{6,})['\"]?", "Exposed Internal Credential"),
        (r"\b(?:https?://)?(?:[a-zA-Z0-9_\-]+\.)*(?:staging\.[a-zA-Z0-9_\-]+\.(?:net|com|org)|[a-zA-Z0-9_\-]+\.internal|[a-zA-Z0-9_\-]+\.local|localhost(?::\d+)?)\b", "Exposed Internal Staging / Dev Endpoint"),
    ]

    for pattern_str, label in CREDENTIAL_PATTERNS:
        m = re.search(pattern_str, text, re.IGNORECASE)
        if m:
            matched_text = m.group(0)
            violations.append({
                "finding_type": "brand",
                "severity": "critical",
                "title": f"Security & Confidentiality Breach: {label}",
                "description": f"Content contains sensitive internal data: '{matched_text}'. Public content must never expose internal credentials, secrets, or staging environments.",
                "detected_text": matched_text,
                "explanation": f"Detected {label}. BrandOS security perimeter prevents accidental leak of private company infrastructure or authorization secrets.",
                "rule_ref": "BRAND-SECURITY-001",
                "confidence": 1.0,
                "evidence": [{
                    "evidence_type": "security_policy",
                    "source_ref": "BRAND-SECURITY-001",
                    "description": f"Data Loss Prevention (DLP): {label} intercepted before publication.",
                    "data": {"detected": matched_text}
                }],
                "suggestion": {
                    "original_text": matched_text,
                    "suggested_text": "[REDACTED]",
                    "reasoning": "Redact private company credentials and internal endpoints."
                }
            })
            break

    return violations


def check_substance_quality(text: str) -> List[dict]:
    """
    Zero-tolerance publication firewall against placeholder copy, keyboard mash,
    and meaningless text (e.g. 'abcd', 'asdf', 'test123').
    """
    violations = []
    cleaned = text.strip()
    if (
        not cleaned
        or cleaned.startswith("[Video creative uploaded:")
        or cleaned.startswith("[Image creative uploaded:")
        or cleaned.startswith("[File uploaded:")
    ):
        return violations

    cleaned_lower = cleaned.lower()
    words = re.findall(r"\b[a-zA-Z0-9']+\b", cleaned)

    PLACEHOLDER_WORDS = {
        "abcd", "abc", "asdf", "test", "testing", "aaa", "xyz", "qwerty", "1234",
        "sample", "placeholder", "lorem", "ipsum", "lorem ipsum", "temp", "draft",
        "test content", "sample text", "foobar", "foo bar", "asdfgh", "zxcv", "qwer"
    }

    is_placeholder = False
    reason = ""

    if cleaned_lower in PLACEHOLDER_WORDS:
        is_placeholder = True
        reason = f"Submitted copy '{cleaned}' is a recognized placeholder or test draft."
    elif len(words) == 1 and len(cleaned) <= 10 and cleaned_lower not in {"aureon", "solaria", "shield", "purehydrate"}:
        token = words[0].lower()
        if not any(v in token for v in "aeiou") or token in {"abcd", "bcde", "cdef", "wxyz", "qwer", "asdf", "zxcv"}:
            is_placeholder = True
            reason = f"Submitted copy '{cleaned}' is an arbitrary single token without linguistic substance."
    elif len(cleaned) < 15 and len(words) <= 2 and not any(b in cleaned_lower for b in ["aureon", "solaria", "shield", "purehydrate", "security", "defense", "fraud"]):
        is_placeholder = True
        reason = f"Submitted copy '{cleaned}' has insufficient length and substantive vocabulary for enterprise publication."

    if is_placeholder:
        violations.append({
            "finding_type": "brand",
            "severity": "critical",
            "title": "Content Quality Standard: Meaningless Placeholder Copy",
            "description": f"Content '{cleaned}' was blocked by BrandOS pre-publication firewall. {reason} Publishing raw drafts, keyboard mash, or placeholder copy is strictly prohibited.",
            "detected_text": cleaned,
            "explanation": "Enterprise content governance requires all submitted text to meet substantive communication standards prior to approval.",
            "rule_ref": "BRAND-SUBSTANCE-001",
            "confidence": 1.0,
            "evidence": [{
                "evidence_type": "policy",
                "source_ref": "BRAND-SUBSTANCE-001",
                "description": "Zero-tolerance firewall active: Placeholder drafts, keyboard mash, and meaningless text are blocked from publication.",
                "data": {"content": cleaned}
            }],
            "suggestion": {
                "original_text": cleaned,
                "suggested_text": "",
                "reasoning": "Replace placeholder draft with complete, brand-aligned publication copy."
            }
        })

    return violations


def check_deterministic_guidelines(text: str, rules: list) -> List[dict]:
    """
    Scans submitted text deterministically against registered GuidelineRules.
    Guarantees that custom rules (e.g. ALL-CAPS prohibition like Rule 777,
    banned quotes, and mandatory keyword/token inclusion rules) are enforced 100% reliably.
    """
    violations: List[dict] = []
    if not text or not rules:
        return violations

    for r in rules:
        rule_id = r.get("rule_id") or r.get("name") or "RULE"
        rule_text = (r.get("rule_text") or r.get("description") or "").strip()
        rule_lower = rule_text.lower()
        severity = (r.get("severity") or "warning").lower()

        # 1. Capitalization / All-Caps check (e.g. Rule 777)
        is_caps_rule = any(w in rule_lower for w in ["caps", "capital", "uppercase", "all-caps", "all caps"])
        is_prohibition = any(w in rule_lower for w in ["never", "do not", "don't", "prohibit", "avoid", "forbidden", "disallow", "no caps", "no uppercase"])

        if is_caps_rule and is_prohibition:
            EXEMPT_ACRONYMS = {"AI", "UI", "UX", "PDF", "API", "WCAG"}
            pattern = re.compile(r"\b([A-Z][A-Z']*(?:\s+[A-Z][A-Z']*)+|[A-Z]{2,})\b")
            matches = [m.group(0) for m in pattern.finditer(text) if any(w.strip("'") not in EXEMPT_ACRONYMS for w in m.group(0).split())]
            
            # If text is all uppercase, guarantee it is caught
            if text.strip().isupper() and len(text.strip()) >= 2 and not matches:
                matches = [text.strip()]

            for match in matches:
                violations.append({
                    "finding_type": "brand",
                    "severity": severity if severity in ("critical", "high", "error") else "error",
                    "title": f"Guideline Rule Violation: Prohibited Capitalization (Rule {rule_id})",
                    "description": f"Content contains prohibited uppercase/all-caps text '{match}'. This directly violates active Brand Brain guideline rule {rule_id}: '{rule_text}'.",
                    "detected_text": match,
                    "explanation": f"Rule {rule_id} strictly mandates: '{rule_text}'. Capitalized copy must be rewritten in standard sentence case.",
                    "rule_ref": str(rule_id),
                    "confidence": 1.0,
                    "evidence": [{
                        "evidence_type": "rule",
                        "source_ref": str(rule_id),
                        "description": f"Active Rule {rule_id}: {rule_text}",
                        "data": {"rule": str(rule_id), "detected": match}
                    }],
                    "suggestion": {
                        "original_text": match,
                        "suggested_text": match.lower().capitalize() if len(match.split()) > 1 else match.lower(),
                        "reasoning": f"Converts '{match}' to compliant casing in accordance with Rule {rule_id}."
                    }
                })

        # 2. Mandatory Keyword / Token Inclusion Rules
        # e.g. "every text should have key word kanishka" or 'the text should contain "A" in capital'
        inclusion_phrases = [
            "should have", "must have", "should contain", "must contain", "should include",
            "must include", "shall contain", "shall include", "always contain", "always include",
            "always have", "always use", "must use", "should use", "every text should have",
            "every text must have", "all text must have", "all text should have", "required keyword"
        ]
        is_inclusion_rule = any(p in rule_lower for p in inclusion_phrases)

        if is_inclusion_rule and not is_prohibition:
            target_token = None
            # Check for quoted target first
            quoted = re.findall(r"['\"]([^'\"]+)['\"]", rule_text)
            if quoted:
                target_token = quoted[0]
            else:
                # Check for "key word <word>" or "keyword <word>"
                kw_match = re.search(r"(?:key\s*word|phrase|term)\s+['\"]?([a-zA-Z0-9_\-]+)['\"]?", rule_text, re.IGNORECASE)
                if kw_match:
                    target_token = kw_match.group(1)
                else:
                    # Check for "contain <word>", "include <word>", "have <word>"
                    inc_match = re.search(r"(?:contain|include|have|use)\s+(?:the\s+)?['\"]?([a-zA-Z0-9_\-]+)['\"]?", rule_text, re.IGNORECASE)
                    if inc_match and inc_match.group(1).lower() not in {"key", "word", "keyword", "phrase", "term", "the", "a", "an", "all", "every", "text", "content", "copy"}:
                        target_token = inc_match.group(1)

            if target_token:
                # Check case sensitivity
                case_sensitive = any(w in rule_lower for w in ["in capital", "in uppercase", "capital", "uppercase", "case-sensitive", "case sensitive"])
                has_target = False
                if case_sensitive:
                    has_target = target_token in text
                else:
                    has_target = target_token.lower() in text.lower()

                if not has_target:
                    violations.append({
                        "finding_type": "brand",
                        "severity": severity if severity in ("critical", "high", "error") else "error",
                        "title": f"Guideline Rule Violation: Missing Required Keyword '{target_token}' (Rule {rule_id})",
                        "description": f"Content is missing the mandatory keyword/token '{target_token}', directly violating active Brand Brain rule {rule_id}: '{rule_text}'.",
                        "detected_text": text[:60] + ("..." if len(text) > 60 else ""),
                        "explanation": f"Rule {rule_id} mandates: '{rule_text}'. All published copy must include '{target_token}' before approval.",
                        "rule_ref": str(rule_id),
                        "confidence": 1.0,
                        "evidence": [{
                            "evidence_type": "rule",
                            "source_ref": str(rule_id),
                            "description": f"Active Rule {rule_id}: {rule_text}",
                            "data": {"rule": str(rule_id), "missing_target": target_token}
                        }],
                        "suggestion": {
                            "original_text": text[:60] + ("..." if len(text) > 60 else ""),
                            "suggested_text": f"{text} {target_token}",
                            "reasoning": f"Add the required keyword '{target_token}' as mandated by Rule {rule_id}."
                        }
                    })

        # 3. Banned quoted phrases (e.g., Never use "word")
        if is_prohibition:
            quoted_phrases = re.findall(r"['\"]([^'\"]{3,})['\"]", rule_text)
            for phrase in quoted_phrases:
                if phrase.lower() in text.lower():
                    pattern = re.compile(re.escape(phrase), re.IGNORECASE)
                    m = pattern.search(text)
                    detected = m.group(0) if m else phrase
                    violations.append({
                        "finding_type": "brand",
                        "severity": severity,
                        "title": f"Guideline Rule Violation: Prohibited Phrase (Rule {rule_id})",
                        "description": f"Detected prohibited phrase '{detected}', directly violating Rule {rule_id}: '{rule_text}'.",
                        "detected_text": detected,
                        "explanation": f"Rule {rule_id} mandates: '{rule_text}'.",
                        "rule_ref": str(rule_id),
                        "confidence": 1.0,
                        "evidence": [{
                            "evidence_type": "rule",
                            "source_ref": str(rule_id),
                            "description": f"Active Rule {rule_id}: {rule_text}",
                            "data": {"rule": str(rule_id), "detected": detected}
                        }],
                        "suggestion": {
                            "original_text": detected,
                            "suggested_text": "",
                            "reasoning": f"Remove prohibited phrase '{detected}' as mandated by Rule {rule_id}."
                        }
                    })

    return violations


class PolicyEngine:
    """Wrapper class providing policy precedence and evaluation methods."""

    def resolve_precedence(self, violations: List[PolicyViolation]) -> List[PolicyViolation]:
        return resolve_policy_precedence(violations)

    def check_deterministic_guidelines(self, text: str, rules: list) -> List[dict]:
        return check_deterministic_guidelines(text, rules)

    def check_substance_quality(self, text: str) -> List[dict]:
        return check_substance_quality(text)

    def check_confidentiality_dlp(self, text: str) -> List[dict]:
        return check_confidentiality_dlp(text)
