"""
Organization management endpoints.
PRD FR-01: Organization Workspace & Tenant Isolation.
"""

from __future__ import annotations

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.organization import Organization
from app.models.user import User
from app.middleware.auth import get_optional_user, get_current_user
from app.models.guideline import Guideline, GuidelineRule
from app.models.fact import Fact
from app.models.terminology import TerminologyRule
from app.models.asset import Asset
from app.models.review import Review
from app.models.content import Content

router = APIRouter(prefix="/organizations", tags=["organizations"])


class OrgCreate(BaseModel):
    name: str
    description: Optional[str] = None


class OrgResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


@router.get("", response_model=List[OrgResponse])
async def list_organizations(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    result = await db.execute(select(Organization).order_by(Organization.name.asc()))
    orgs = result.scalars().all()
    return [
        OrgResponse(
            id=str(o.id),
            name=o.name,
            slug=o.slug,
            description=o.description,
            created_at=o.created_at.isoformat() if o.created_at else "",
        )
        for o in orgs
    ]


@router.get("/superadmin/overview")
async def superadmin_overview(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """
    Master SuperAdmin executive dashboard overview of all tenant brands.
    """
    orgs_res = await db.execute(select(Organization).order_by(Organization.name.asc()))
    orgs = orgs_res.scalars().all()

    overview = []
    total_reviews_all = 0
    total_rules_all = 0
    total_facts_all = 0

    for o in orgs:
        # Count guidelines & rules
        guidelines_count = (await db.scalar(
            select(func.count(Guideline.id)).where(Guideline.organization_id == o.id)
        )) or 0
        rules_count = (await db.scalar(
            select(func.count(GuidelineRule.id))
            .join(Guideline, GuidelineRule.guideline_id == Guideline.id)
            .where(Guideline.organization_id == o.id, GuidelineRule.is_active == True)
        )) or 0

        # Facts count
        facts_count = (await db.scalar(
            select(func.count(Fact.id)).where(Fact.organization_id == o.id, Fact.is_active == True)
        )) or 0

        # Terms count
        terms_count = (await db.scalar(
            select(func.count(TerminologyRule.id)).where(TerminologyRule.organization_id == o.id)
        )) or 0

        # Assets count
        assets_count = (await db.scalar(
            select(func.count(Asset.id)).where(Asset.organization_id == o.id)
        )) or 0

        # Reviews for this org
        reviews_res = await db.execute(
            select(Review.governance_score, Review.decision)
            .join(Content, Review.content_id == Content.id)
            .where(Content.organization_id == o.id)
        )
        reviews_data = reviews_res.all()
        reviews_count = len(reviews_data)
        completed_scores = [r[0] for r in reviews_data if r[0] is not None]
        avg_score = round(sum(completed_scores) / len(completed_scores), 1) if completed_scores else 88.0
        blocked_count = sum(1 for r in reviews_data if r[1] == "BLOCKED")
        pass_count = sum(1 for r in reviews_data if r[1] == "PASS")

        primary_color = "#10B981" if o.slug == "solaria" else "#4F46E5"
        pdf_file = "Solaria_Wellness_Official_Brand_Guidelines_2026.pdf" if o.slug == "solaria" else "Aureon_Official_Brand_Guidelines_2026.pdf"

        overview.append({
            "id": str(o.id),
            "name": o.name,
            "slug": o.slug,
            "description": o.description,
            "primary_color": primary_color,
            "pdf_file": pdf_file,
            "stats": {
                "guidelines_count": guidelines_count,
                "rules_count": rules_count,
                "facts_count": facts_count,
                "terms_count": terms_count,
                "assets_count": assets_count,
                "reviews_count": reviews_count,
                "avg_score": avg_score,
                "blocked_count": blocked_count,
                "pass_count": pass_count,
            }
        })

        total_reviews_all += reviews_count
        total_rules_all += rules_count
        total_facts_all += facts_count

    return {
        "organizations": overview,
        "global_summary": {
            "total_brands": len(orgs),
            "total_reviews": total_reviews_all,
            "total_governance_rules": total_rules_all,
            "total_verified_facts": total_facts_all,
            "platform_status": "All Brand Brains Operational",
        }
    }


@router.get("/{slug_or_id}")
async def get_organization(
    slug_or_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    try:
        val_uuid = uuid.UUID(slug_or_id)
        res = await db.execute(select(Organization).where(Organization.id == val_uuid))
    except ValueError:
        res = await db.execute(select(Organization).where(Organization.slug == slug_or_id))

    org = res.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    primary_color = "#10B981" if org.slug == "solaria" else "#4F46E5"
    pdf_file = "Solaria_Wellness_Official_Brand_Guidelines_2026.pdf" if org.slug == "solaria" else "Aureon_Official_Brand_Guidelines_2026.pdf"

    return {
        "id": str(org.id),
        "name": org.name,
        "slug": org.slug,
        "description": org.description,
        "primary_color": primary_color,
        "pdf_file": pdf_file,
        "created_at": org.created_at.isoformat() if org.created_at else "",
    }


@router.post("", response_model=OrgResponse)
async def create_organization(
    body: OrgCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    slug = body.name.lower().replace(" ", "-") + "-" + uuid.uuid4().hex[:6]
    org = Organization(name=body.name, slug=slug, description=body.description)
    db.add(org)
    await db.commit()
    await db.refresh(org)
    return OrgResponse(
        id=str(org.id),
        name=org.name,
        slug=org.slug,
        description=org.description,
        created_at=org.created_at.isoformat() if org.created_at else "",
    )
