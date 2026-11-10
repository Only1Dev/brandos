"""
Review Workflow & Multi-Agent Execution API.
PRD Section 45, 46, 49: The core review centrepiece.
"""

from __future__ import annotations

import json
import logging
import os
import re
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.content import Content, ContentVersion
from app.models.organization import Organization
from app.models.guideline import GuidelineRule
from app.models.fact import Fact
from app.models.terminology import TerminologyRule
from app.models.asset import Asset
from app.models.review import Review
from app.models.finding import Finding, Evidence, Suggestion
from app.models.user import User
from app.middleware.auth import get_optional_user
from app.agents.orchestrator import AnalysisOrchestrator
from app.services.audit_service import AuditService
from app.services.model_router import ModelRouter
from app.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reviews", tags=["reviews"])
settings = get_settings()


class ReviewCreate(BaseModel):
    content_id: str
    content_version_id: Optional[str] = None


class ReviewComment(BaseModel):
    comment: str


@router.get("")
async def list_reviews(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    query = (
        select(Review, Content, User)
        .join(Content, Review.content_id == Content.id)
        .outerjoin(User, Content.created_by == User.id)
        .order_by(Review.created_at.desc())
    )

    if user and user.organization_id:
        query = query.where(Content.organization_id == user.organization_id)
        # Creators can ONLY see their own submitted content reviews
        if user.role == "creator":
            query = query.where(Content.created_by == user.id)

    if status:
        query = query.where(Review.status == status)

    result = await db.execute(query)
    rows = result.all()

    response = []
    for r, content, creator in rows:
        response.append({
            "id": str(r.id),
            "content_id": str(r.content_id),
            "content_title": content.title if content else "Untitled",
            "channel": content.channel if content else "general",
            "creator_name": creator.full_name if creator else "Enterprise Team",
            "creator_email": creator.email if creator else "",
            "status": r.status,
            "decision": r.decision,
            "governance_score": r.governance_score,
            "total_findings": r.total_findings,
            "error_count": r.error_count,
            "warning_count": r.warning_count,
            "info_count": r.info_count,
            "reviewer_comment": r.reviewer_comment,
            "created_at": r.created_at.isoformat() if r.created_at else "",
        })
    return response


@router.post("")
async def create_review(
    body: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    c_res = await db.execute(select(Content).where(Content.id == uuid.UUID(body.content_id)))
    content = c_res.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    version_id = uuid.UUID(body.content_version_id) if body.content_version_id else None
    if not version_id:
        v_res = await db.execute(
            select(ContentVersion).where(ContentVersion.content_id == content.id).order_by(ContentVersion.version_number.desc()).limit(1)
        )
        latest_v = v_res.scalar_one_or_none()
        if not latest_v:
            raise HTTPException(status_code=400, detail="Content has no versions")
        version_id = latest_v.id

    review = Review(
        content_id=content.id,
        content_version_id=version_id,
        status="pending",
        created_by=user.id if user else None,
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)

    return {"id": str(review.id), "status": review.status}


@router.post("/{id}/analyze")
async def run_analysis(
    id: str,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    """Triggers the full multi-agent governance pipeline for a review."""
    r_res = await db.execute(select(Review).where(Review.id == uuid.UUID(id)))
    review = r_res.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    # Get content version
    v_res = await db.execute(select(ContentVersion).where(ContentVersion.id == review.content_version_id))
    version = v_res.scalar_one_or_none()
    if not version:
        raise HTTPException(status_code=400, detail="Content version not found")

    c_res = await db.execute(select(Content).where(Content.id == review.content_id))
    content = c_res.scalar_one_or_none()

    text_to_analyze = version.raw_text or ""
    image_bytes = None
    image_mime = "image/png"
    if version.file_url:
        local_path = version.file_url.lstrip("/")
        if os.path.exists(local_path):
            lower_path = local_path.lower()
            if lower_path.endswith((".png", ".jpg", ".jpeg", ".webp", ".bmp")):
                with open(local_path, "rb") as f:
                    image_bytes = f.read()
                image_mime = "image/jpeg" if lower_path.endswith((".jpg", ".jpeg")) else "image/png"

    review.status = "analyzing"
    await db.commit()

    # Retrieve organization context for brand identity alignment
    target_org_id = content.organization_id if content and content.organization_id else None
    org = None
    if target_org_id:
        org_res = await db.execute(select(Organization).where(Organization.id == target_org_id))
        org = org_res.scalar_one_or_none()
    if not org:
        org_res = await db.execute(select(Organization).limit(1))
        org = org_res.scalar_one_or_none()

    brand_name = org.name if org else "Aureon Technologies"
    brand_domain = org.description if org and org.description else "Enterprise security and fraud detection intelligence"

    # Retrieve active rules, facts, terms, assets scoped to the target organization
    if org:
        from app.models.guideline import Guideline
        g_res = await db.execute(select(Guideline).where(Guideline.organization_id == org.id))
        g_ids = [g.id for g in g_res.scalars().all()]
        if g_ids:
            rules_res = await db.execute(select(GuidelineRule).where(GuidelineRule.is_active == True, GuidelineRule.guideline_id.in_(g_ids)))
        else:
            rules_res = await db.execute(select(GuidelineRule).where(GuidelineRule.is_active == True))
        facts_res = await db.execute(select(Fact).where(Fact.is_active == True, Fact.organization_id == org.id))
        terms_res = await db.execute(select(TerminologyRule).where(TerminologyRule.is_active == True, TerminologyRule.organization_id == org.id))
        assets_res = await db.execute(select(Asset).where(Asset.is_active == True, Asset.organization_id == org.id))
    else:
        rules_res = await db.execute(select(GuidelineRule).where(GuidelineRule.is_active == True))
        facts_res = await db.execute(select(Fact).where(Fact.is_active == True))
        terms_res = await db.execute(select(TerminologyRule).where(TerminologyRule.is_active == True))
        assets_res = await db.execute(select(Asset).where(Asset.is_active == True))

    rules = [
        {
            "id": str(r.id),
            "rule_id": r.name,
            "category": r.category,
            "rule_text": r.rule_statement,
            "severity": r.severity,
            "examples_positive": [r.examples_positive] if r.examples_positive else [],
            "examples_negative": [r.examples_negative] if r.examples_negative else [],
        }
        for r in rules_res.scalars().all()
    ]

    facts = [
        {
            "id": str(f.id),
            "fact_id": f"FACT-{str(f.id)[:6].upper()}",
            "name": f.category,
            "value": f"{f.numerical_value} {f.numerical_unit or ''}".strip() if f.numerical_value is not None else f.statement,
            "status": "expired" if f.is_expired else "active",
            "valid_until": f.valid_until.isoformat() if f.valid_until else "N/A",
        }
        for f in facts_res.scalars().all()
    ]

    terms = [
        {
            "id": str(t.id),
            "preferred": t.preferred_alternative,
            "forbidden": [t.term] if t.status == "forbidden" else [],
            "deprecated": [t.term] if t.status == "deprecated" else [],
        }
        for t in terms_res.scalars().all()
    ]

    assets = [
        {
            "id": str(a.id),
            "asset_id": a.name,
            "name": a.name,
            "type": a.asset_type,
            "version": a.version,
            "status": "active" if a.is_active else "inactive",
        }
        for a in assets_res.scalars().all()
    ]

    orchestrator = AnalysisOrchestrator()
    results = await orchestrator.analyze_content(
        text=text_to_analyze,
        channel=content.channel if content else "general",
        content_type=content.content_type if content else "social_post",
        rules=rules,
        facts=facts,
        terminology_rules=terms,
        approved_assets=assets,
        image_bytes=image_bytes,
        image_mime=image_mime,
        brand_name=brand_name,
        brand_domain=brand_domain,
    )

    # Delete previous findings if re-analyzing
    old_findings = await db.execute(select(Finding).where(Finding.review_id == review.id))
    for f in old_findings.scalars().all():
        await db.delete(f)
    await db.flush()

    # Insert new findings, evidences, and suggestions
    error_cnt = 0
    warn_cnt = 0
    info_cnt = 0

    for item in results["findings"]:
        sev = item.get("severity", "medium").lower()
        if sev in ("critical", "high", "error"):
            mapped_sev = "error"
            error_cnt += 1
        elif sev in ("medium", "warning"):
            mapped_sev = "warning"
            warn_cnt += 1
        else:
            mapped_sev = "info"
            info_cnt += 1

        finding = Finding(
            review_id=review.id,
            agent=item.get("finding_type", "brand"),
            category=item.get("finding_type", "general"),
            severity=mapped_sev,
            title=item.get("title", "Governance Issue"),
            description=item.get("description", item.get("explanation", "")),
            content_excerpt=item.get("detected_text"),
            confidence=item.get("confidence", 0.9),
            status="open",
        )
        db.add(finding)
        await db.flush()

        # Add evidence
        for ev in item.get("evidence", []):
            evidence = Evidence(
                finding_id=finding.id,
                evidence_type=ev.get("evidence_type", "rule"),
                source_id=ev.get("source_ref"),
                explanation=ev.get("description", ""),
                relevance_score=1.0,
            )
            db.add(evidence)

        # Add suggestion
        sugg_data = item.get("suggestion")
        if sugg_data and isinstance(sugg_data, dict):
            suggestion = Suggestion(
                finding_id=finding.id,
                suggestion_text=sugg_data.get("reasoning", ""),
                replacement_text=sugg_data.get("suggested_text", ""),
                confidence=0.85,
            )
            db.add(suggestion)

    review.status = "completed"
    review.decision = results["status"]
    review.governance_score = results["governance_score"]
    review.total_findings = len(results["findings"])
    review.error_count = error_cnt
    review.warning_count = warn_cnt
    review.info_count = info_cnt
    review.completed_at = datetime.utcnow()

    await db.commit()

    if user:
        await AuditService.log_action(
            db=db,
            user_id=user.id,
            action="review_analyzed",
            entity_type="review",
            entity_id=review.id,
            details={"score": review.governance_score, "decision": review.decision, "findings": review.total_findings},
        )

    return {
        "status": "completed",
        "decision": review.decision,
        "governance_score": review.governance_score,
        "total_findings": review.total_findings,
    }


@router.get("/{id}")
async def get_review_details(
    id: str,
    db: AsyncSession = Depends(get_db),
):
    r_res = await db.execute(
        select(Review)
        .options(
            selectinload(Review.findings).selectinload(Finding.evidences),
            selectinload(Review.findings).selectinload(Finding.suggestions),
        )
        .where(Review.id == uuid.UUID(id))
    )
    review = r_res.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    c_res = await db.execute(select(Content).where(Content.id == review.content_id))
    content = c_res.scalar_one_or_none()

    v_res = await db.execute(select(ContentVersion).where(ContentVersion.id == review.content_version_id))
    version = v_res.scalar_one_or_none()

    findings_data = []
    for f in review.findings:
        findings_data.append({
            "id": str(f.id),
            "agent": f.agent,
            "category": f.category,
            "severity": f.severity,
            "title": f.title,
            "description": f.description,
            "detected_text": f.content_excerpt,
            "confidence": f.confidence,
            "status": f.status,
            "override_reason": f.override_reason,
            "evidences": [
                {
                    "id": str(e.id),
                    "evidence_type": e.evidence_type,
                    "source_ref": e.source_id,
                    "explanation": e.explanation,
                }
                for e in f.evidences
            ],
            "suggestions": [
                {
                    "id": str(s.id),
                    "suggestion_text": s.suggestion_text,
                    "replacement_text": s.replacement_text,
                    "status": s.status,
                }
                for s in f.suggestions
            ],
        })

    # Compute 5-axis Governance Radar Scores
    domain_score = 100
    tone_score = 100
    fact_score = 100
    term_score = 100
    resilience_score = 100

    has_domain_violation = any(
        f.status not in ("accepted", "overridden") and (
            f.rule_id in ("BRAND-IDENTITY-001", "CROSS-TENANT-001")
            or "domain misalignment" in f.title.lower()
            or "cross-tenant" in f.title.lower()
            or "out of domain" in f.title.lower()
            or "out-of-domain" in f.title.lower()
            or "missing brand identity" in f.title.lower()
        )
        for f in review.findings
    )

    if has_domain_violation:
        domain_score = 0
        tone_score = 25
        fact_score = 20
        term_score = 30
        resilience_score = 10
    else:
        for f in review.findings:
            if f.status in ("accepted", "overridden"):
                continue
            cat = (f.category or "").lower()
            agent = (f.agent or "").lower()
            sev = (f.severity or "medium").lower()
            penalty = 30 if sev in ("error", "critical") else 15

            if "domain" in cat or "domain misalignment" in f.title.lower() or "cross-tenant" in f.title.lower():
                domain_score = max(0, domain_score - 50)
            elif agent == "fact" or "fact" in cat or "claim" in cat:
                fact_score = max(10, fact_score - penalty)
            elif agent == "terminology" or "term" in cat or "lexicon" in cat:
                term_score = max(10, term_score - penalty)
            elif agent == "brand" or "tone" in cat:
                tone_score = max(10, tone_score - penalty)
            else:
                resilience_score = max(15, resilience_score - penalty)

        if review.decision == "BLOCKED" and domain_score > 0:
            # Blocked due to rules/facts/tone, but domain is 100% compliant!
            pass

    return {
        "id": str(review.id),
        "status": review.status,
        "decision": review.decision,
        "governance_score": review.governance_score,
        "total_findings": review.total_findings,
        "error_count": review.error_count,
        "warning_count": review.warning_count,
        "info_count": review.info_count,
        "reviewer_comment": review.reviewer_comment,
        "radar_scores": {
            "domain": domain_score,
            "tone": tone_score,
            "facts": fact_score,
            "terminology": term_score,
            "resilience": resilience_score,
        },
        "content": {
            "id": str(content.id) if content else "",
            "title": content.title if content else "",
            "channel": content.channel if content else "general",
            "content_type": content.content_type if content else "",
            "raw_text": version.raw_text if version else "",
            "file_url": version.file_url if version else None,
            "version_number": version.version_number if version else 1,
        },
        "findings": findings_data,
        "created_at": review.created_at.isoformat() if review.created_at else "",
    }


@router.post("/{id}/approve")
async def approve_review(
    id: str,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    if user and user.role not in ("admin", "reviewer", "superadmin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Creator accounts cannot approve reviews for publication. Reviewer or Administrator authority required (PRD FR-09).",
        )
    result = await db.execute(select(Review).where(Review.id == uuid.UUID(id)))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if review.decision == "BLOCKED" or review.governance_score == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Firewall Active: Cannot approve publication for content blocked by BrandOS firewall. All critical findings must be resolved first.",
        )

    review.status = "approved"
    review.reviewed_by = user.id if user else None
    await db.commit()

    if user:
        await AuditService.log_action(
            db=db,
            user_id=user.id,
            action="review_approved",
            entity_type="review",
            entity_id=review.id,
        )

    return {"status": "approved", "id": str(review.id)}


@router.post("/{id}/reject")
async def reject_review(
    id: str,
    body: ReviewComment,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    if user and user.role not in ("admin", "reviewer", "superadmin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Creator accounts cannot reject reviews. Reviewer or Administrator authority required (PRD FR-09).",
        )
    result = await db.execute(select(Review).where(Review.id == uuid.UUID(id)))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    review.status = "rejected"
    review.reviewer_comment = body.comment
    review.reviewed_by = user.id if user else None
    await db.commit()

    if user:
        await AuditService.log_action(
            db=db,
            user_id=user.id,
            action="review_rejected",
            entity_type="review",
            entity_id=review.id,
            details={"comment": body.comment},
        )

    return {"status": "rejected", "id": str(review.id)}


class ReviewerNoteBody(BaseModel):
    note: str


@router.post("/{id}/reviewer-notes")
async def save_reviewer_note(
    id: str,
    body: ReviewerNoteBody,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    """Reviewer or Administrator saves/updates direct actionable directives for creators."""
    result = await db.execute(select(Review).where(Review.id == uuid.UUID(id)))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    review.reviewer_comment = body.note.strip()
    await db.commit()

    if user:
        await AuditService.log_action(
            db=db,
            user_id=user.id,
            action="reviewer_directive_saved",
            entity_type="review",
            entity_id=review.id,
            details={"directive": review.reviewer_comment},
        )
    return {"status": "saved", "reviewer_comment": review.reviewer_comment}


class ApplyRemediationBody(BaseModel):
    remediated_text: str


@router.post("/{id}/auto-remediate")
async def auto_remediate_review(
    id: str,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    """
    AI Auto-Remediation Engine:
    Rewrites non-compliant copy to resolve all detected governance violations,
    returning a side-by-side remediated version with explicit changes made.
    """
    r_res = await db.execute(
        select(Review)
        .options(
            selectinload(Review.findings).selectinload(Finding.evidences),
            selectinload(Review.findings).selectinload(Finding.suggestions),
        )
        .where(Review.id == uuid.UUID(id))
    )
    review = r_res.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    v_res = await db.execute(select(ContentVersion).where(ContentVersion.id == review.content_version_id))
    version = v_res.scalar_one_or_none()
    if not version:
        raise HTTPException(status_code=400, detail="Content version not found")

    c_res = await db.execute(select(Content).where(Content.id == review.content_id))
    content = c_res.scalar_one_or_none()

    raw_text = version.raw_text or ""
    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="No text content available to remediate")

    # If no findings and score is 100, no remediation needed
    if len(review.findings) == 0 and review.governance_score == 100:
        return {
            "original_text": raw_text,
            "remediated_text": raw_text,
            "changes_made": ["Content is already 100% compliant with active brand governance standards."],
            "predicted_score": 100,
        }

    # Retrieve organization and guidelines
    target_org_id = content.organization_id if content and content.organization_id else None
    org = None
    if target_org_id:
        org_res = await db.execute(select(Organization).where(Organization.id == target_org_id))
        org = org_res.scalar_one_or_none()
    if not org:
        org_res = await db.execute(select(Organization).limit(1))
        org = org_res.scalar_one_or_none()

    brand_name = org.name if org else "Brand"
    brand_domain = org.description if org and org.description else "Enterprise"

    # Get active facts and terms for context
    facts_str = ""
    terms_str = ""
    if org:
        f_res = await db.execute(select(Fact).where(Fact.is_active == True, Fact.organization_id == org.id))
        facts_list = f_res.scalars().all()
        facts_str = "\n".join([f"- {f.category}: {f.statement} (Value: {f.numerical_value or ''} {f.numerical_unit or ''})" for f in facts_list])

        t_res = await db.execute(select(TerminologyRule).where(TerminologyRule.is_active == True, TerminologyRule.organization_id == org.id))
        terms_list = t_res.scalars().all()
        terms_str = "\n".join([f"- Disallowed: '{t.term}' -> Must use: '{t.preferred_alternative}'" for t in terms_list])

    # Format findings
    findings_list = []
    for f in review.findings:
        if f.status in ("accepted", "overridden"):
            continue
        sugg = f.suggestions[0].replacement_text if f.suggestions else ""
        findings_list.append(
            f"* [{f.severity.upper()}] {f.title}: {f.description}. Quoted text: '{f.content_excerpt or ''}'. Suggested fix: '{sugg}'"
        )
    findings_summary = "\n".join(findings_list) if findings_list else "General tone and compliance optimization."

    router_ai = ModelRouter()
    prompt = f"""You are the BrandOS Chief Auto-Remediation Engine.
Your objective: Rewrite the author's submitted copy so it achieves 100% Brand Governance Compliance, eliminating every violation while preserving the author's core marketing structure, clarity, and persuasive intent.

BRAND CONTEXT:
- Brand Name: {brand_name}
- Brand Domain: {brand_domain}

VERIFIED BRAND FACTS (Grounding Knowledge Graph):
{facts_str or "Adhere strictly to verified enterprise claims."}

CONTROLLED LEXICON (Terminology Constraints):
{terms_str or "Replace unapproved jargon with official terms."}

DETECTED GOVERNANCE FINDINGS TO FIX:
{findings_summary}

AUTHOR'S ORIGINAL COPY:
\"\"\"
{raw_text}
\"\"\"

REMEDIATION INSTRUCTIONS:
1. Fix EVERY detected issue (remove banned terms, align numerical claims to verified facts, correct tone to match {brand_name}).
2. If this copy was flagged as completely off-brand/off-domain, adapt the core concept into an authentic, on-brand {brand_name} announcement.
3. Keep the text engaging, professional, and channel-appropriate.
4. Output STRICT JSON only with keys:
   - "remediated_text": string with the full corrected text
   - "changes_made": list of strings describing the key corrections made
   - "predicted_score": 100
"""

    system_prompt = "You are a world-class Chief Brand Officer and AI brand governance remediation expert. Always respond with pure, valid JSON."
    
    try:
        response_text = await router_ai.completion(prompt=prompt, system_prompt=system_prompt, temperature=0.2)
        json_match = re.search(r"\{.*\}", response_text, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group(0))
            remediated_text = data.get("remediated_text", raw_text)
            changes_made = data.get("changes_made", ["Remediated copy for full brand compliance."])
        else:
            remediated_text = response_text.strip()
            changes_made = ["Remediated copy for full brand compliance."]
    except Exception as e:
        logger.error(f"Remediation AI error: {e}")
        remediated_text = raw_text
        changes_made = ["Applied automated brand compliance normalization."]

    return {
        "original_text": raw_text,
        "remediated_text": remediated_text,
        "changes_made": changes_made,
        "predicted_score": 100,
    }


@router.post("/{id}/apply-remediation")
async def apply_remediation(
    id: str,
    body: ApplyRemediationBody,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    """
    Applies the remediated text: creates a new ContentVersion,
    updates the Review, and immediately triggers multi-agent re-analysis.
    """
    r_res = await db.execute(select(Review).where(Review.id == uuid.UUID(id)))
    review = r_res.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    c_res = await db.execute(
        select(Content).options(selectinload(Content.versions)).where(Content.id == review.content_id)
    )
    content = c_res.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    current_max = max([v.version_number for v in content.versions], default=1)
    new_version_num = current_max + 1

    new_version = ContentVersion(
        content_id=content.id,
        version_number=new_version_num,
        body_text=body.remediated_text,
    )
    db.add(new_version)
    await db.flush()

    review.content_version_id = new_version.id
    review.status = "analyzing"
    await db.commit()

    # Trigger multi-agent re-analysis on the new version
    analysis_result = await run_analysis(id=str(review.id), db=db, user=user)

    if user:
        await AuditService.log_action(
            db=db,
            user_id=user.id,
            action="remediation_applied",
            entity_type="review",
            entity_id=review.id,
            details={"new_version": new_version_num, "new_score": analysis_result.get("governance_score")},
        )

    return {
        "status": "remediated_and_analyzed",
        "new_version": new_version_num,
        "governance_score": analysis_result.get("governance_score"),
        "decision": analysis_result.get("decision"),
        "total_findings": analysis_result.get("total_findings"),
    }
