"""
Findings & Corrections Resolution API.
PRD FR-18 (Evidence Trace), FR-19 (AI Suggestions Accept/Reject), FR-20 (Human Review Override).
"""

from __future__ import annotations

import re
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.content import Content, ContentVersion
from app.models.review import Review
from app.models.finding import Finding, Evidence, Suggestion
from app.models.user import User
from app.middleware.auth import get_optional_user
from app.services.audit_service import AuditService

router = APIRouter(prefix="/findings", tags=["findings"])


class OverrideRequest(BaseModel):
    reason: str


class EditSuggestionRequest(BaseModel):
    replacement_text: str


@router.get("/{id}/evidence")
async def get_finding_evidence(
    id: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve full audit-friendly decision trace for a finding (FR-18)."""
    result = await db.execute(
        select(Finding)
        .options(selectinload(Finding.evidences), selectinload(Finding.suggestions))
        .where(Finding.id == uuid.UUID(id))
    )
    finding = result.scalar_one_or_none()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    return {
        "finding_id": str(finding.id),
        "title": finding.title,
        "severity": finding.severity,
        "detected_text": finding.content_excerpt,
        "explanation": finding.description,
        "evidences": [
            {
                "id": str(e.id),
                "type": e.evidence_type,
                "source_ref": e.source_id,
                "explanation": e.explanation,
                "relevance": e.relevance_score,
            }
            for e in finding.evidences
        ],
        "suggestions": [
            {
                "id": str(s.id),
                "reasoning": s.suggestion_text,
                "replacement_text": s.replacement_text,
                "status": s.status,
            }
            for s in finding.suggestions
        ],
    }


def _replace_text_safely(original: str, target: str, replacement: str) -> str:
    if not original or not target:
        return original
    clean_rep = replacement if replacement is not None else ""

    # 1. Exact match
    if target in original:
        return original.replace(target, clean_rep, 1)

    # 2. Cleaned target (strip quotes, brackets, ellipsis)
    clean_target = target.strip().strip("\"'[]()").rstrip(".…").strip()
    if clean_target and clean_target in original:
        return original.replace(clean_target, clean_rep, 1)

    # 3. Normalized apostrophes and dashes
    norm_orig = original.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"').replace("–", "-").replace("—", "-")
    norm_target = clean_target.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"').replace("–", "-").replace("—", "-")

    if norm_target in norm_orig:
        idx = norm_orig.find(norm_target)
        return original[:idx] + clean_rep + original[idx + len(norm_target):]

    # 4. Whitespace normalized match
    ws_orig = " ".join(original.split())
    ws_target = " ".join(clean_target.split())
    if ws_target in ws_orig:
        pattern_str = r"\s+".join(re.escape(w) for w in ws_target.split())
        try:
            return re.sub(pattern_str, lambda _: clean_rep, original, count=1, flags=re.IGNORECASE)
        except Exception:
            pass

    # 5. Case-insensitive regex
    try:
        pattern = re.compile(re.escape(clean_target), re.IGNORECASE)
        if pattern.search(original):
            return pattern.sub(clean_rep, original, count=1)
    except Exception:
        pass

    # 6. Core words match (longest subphrase)
    words = [w for w in re.findall(r"\b\w+\b", clean_target) if len(w) > 2]
    if len(words) >= 2:
        for length in range(len(words), 1, -1):
            pattern_str = r"\s+".join(re.escape(w) for w in words[:length])
            try:
                pattern = re.compile(pattern_str, re.IGNORECASE)
                if pattern.search(original):
                    return pattern.sub(clean_rep, original, count=1)
            except Exception:
                pass

    return original


@router.post("/{id}/accept-suggestion")
async def accept_suggestion(
    id: str,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    """
    Accepts the AI suggestion for this finding.
    Applies the replacement text into the content creating a new content version (FR-19 & FR-21).
    """
    try:
        finding_uuid = uuid.UUID(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid finding ID format")

    result = await db.execute(
        select(Finding)
        .options(selectinload(Finding.suggestions))
        .where(Finding.id == finding_uuid)
    )
    finding = result.scalar_one_or_none()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    if not finding.suggestions:
        raise HTTPException(status_code=400, detail="No suggestion available for this finding")

    sugg = finding.suggestions[0]
    sugg.status = "accepted"
    sugg.accepted_by = user.id if user else None
    finding.status = "accepted"

    # Get review and current content version
    r_res = await db.execute(select(Review).where(Review.id == finding.review_id))
    review = r_res.scalar_one_or_none()
    new_text = ""
    next_version = 1

    if review:
        v_res = await db.execute(select(ContentVersion).where(ContentVersion.id == review.content_version_id))
        old_v = v_res.scalar_one_or_none()
        if old_v and old_v.raw_text and sugg.replacement_text:
            target = (finding.content_excerpt or "").strip()
            new_text = _replace_text_safely(old_v.raw_text, target, sugg.replacement_text)

            c_res = await db.execute(select(Content).where(Content.id == review.content_id))
            content = c_res.scalar_one_or_none()
            if content:
                next_version = (old_v.version_number or 1) + 1
                new_version = ContentVersion(
                    content_id=content.id,
                    version_number=next_version,
                    body_text=new_text,
                    file_url=old_v.file_url,
                )
                db.add(new_version)
                await db.flush()
                # Update review to point to new version
                review.content_version_id = new_version.id

        # Recalculate review score now that a finding has been accepted
        f_res = await db.execute(select(Finding).where(Finding.review_id == review.id))
        all_findings = f_res.scalars().all()
        active_errors = [f for f in all_findings if f.status not in ("accepted", "overridden") and f.severity in ("error", "critical")]
        active_warnings = [f for f in all_findings if f.status not in ("accepted", "overridden") and f.severity == "warning"]

        if len(active_errors) == 0:
            review.decision = "PASS" if len(active_warnings) == 0 else "WARNING"
            review.governance_score = max(85.0, 100.0 - (len(active_warnings) * 5.0))
        else:
            accepted_count = sum(1 for f in all_findings if f.status in ("accepted", "overridden"))
            review.governance_score = min(75.0, accepted_count * 25.0)

    await db.commit()

    if user:
        await AuditService.log_action(
            db=db,
            user_id=user.id,
            action="suggestion_accepted",
            entity_type="finding",
            entity_id=finding.id,
            details={"replacement": sugg.replacement_text},
        )

    return {
        "status": "accepted",
        "finding_id": str(finding.id),
        "new_text": new_text,
        "version_number": next_version,
    }


@router.post("/{id}/override")
async def override_finding(
    id: str,
    body: OverrideRequest,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    """Authorized reviewer overrides a finding with mandatory reason (FR-20)."""
    if user and user.role not in ("admin", "reviewer", "superadmin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Creator accounts cannot override findings. Reviewer or Administrator authority required (PRD FR-20).",
        )
    try:
        finding_uuid = uuid.UUID(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid finding ID format")

    result = await db.execute(select(Finding).where(Finding.id == finding_uuid))
    finding = result.scalar_one_or_none()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    finding.status = "overridden"
    finding.override_reason = body.reason
    finding.overridden_by = user.id if user else None
    await db.commit()

    if user:
        await AuditService.log_action(
            db=db,
            user_id=user.id,
            action="finding_overridden",
            entity_type="finding",
            entity_id=finding.id,
            details={"reason": body.reason},
        )

    return {"status": "overridden", "id": str(finding.id), "reason": body.reason}
