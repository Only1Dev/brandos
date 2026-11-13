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
    slug: Optional[str] = None
    description: Optional[str] = None
    domain: Optional[str] = None
    primary_color: Optional[str] = "#4F46E5"
    source: Optional[str] = "superadmin"  # "superadmin" | "homepage"


class OrgResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    status: str = "active"
    created_at: str

    class Config:
        from_attributes = True


@router.get("", response_model=List[OrgResponse])
async def list_organizations(
    status: Optional[str] = "active",
    include_pending: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    query = select(Organization).order_by(Organization.name.asc())
    if not include_pending and status:
        query = query.where(Organization.status == status)
    result = await db.execute(query)
    orgs = result.scalars().all()
    return [
        OrgResponse(
            id=str(o.id),
            name=o.name,
            slug=o.slug,
            description=o.description,
            status=o.status or "active",
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
            "status": o.status or "active",
            "primary_color": primary_color,
            "pdf_file": pdf_file,
            "created_at": o.created_at.isoformat() if o.created_at else "",
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

    pending_count = sum(1 for o in orgs if (o.status or "active") == "pending")

    return {
        "organizations": overview,
        "global_summary": {
            "total_brands": len(orgs),
            "total_active_brands": len(orgs) - pending_count,
            "pending_approvals_count": pending_count,
            "total_reviews": total_reviews_all,
            "total_governance_rules": total_rules_all,
            "total_verified_facts": total_facts_all,
            "platform_status": f"{pending_count} Pending Approval" if pending_count > 0 else "All Brand Brains Operational",
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
        "status": org.status or "active",
        "primary_color": primary_color,
        "pdf_file": pdf_file,
        "created_at": org.created_at.isoformat() if org.created_at else "",
    }


@router.post("", response_model=OrgResponse)
async def create_organization(
    body: OrgCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    import re
    base_slug = body.slug.strip().lower() if body.slug else body.name.lower()
    clean_slug = re.sub(r"[^a-z0-9]+", "-", base_slug).strip("-")
    if not clean_slug:
        clean_slug = "org-" + uuid.uuid4().hex[:6]

    # Check for existing slug
    existing = await db.execute(select(Organization).where(Organization.slug == clean_slug))
    if existing.scalar_one_or_none():
        clean_slug = f"{clean_slug}-{uuid.uuid4().hex[:4]}"

    # If added through superadmin, status is 'active' immediately.
    # If added through homepage, status is 'pending' awaiting SuperAdmin approval.
    is_superadmin = (body.source == "superadmin") or (current_user and current_user.role == "superadmin")
    initial_status = "active" if is_superadmin else "pending"

    org = Organization(
        name=body.name.strip(),
        slug=clean_slug,
        description=body.description or body.domain or f"Enterprise brand workspace for {body.name.strip()}",
        status=initial_status,
    )
    db.add(org)
    await db.flush()

    # Seed default Brand Brain core guidelines
    guideline = Guideline(
        organization_id=org.id,
        title=f"{org.name} Official Brand Governance Guidelines",
        version=1,
        is_active=True,
    )
    db.add(guideline)
    await db.flush()

    # Seed initial rules for this organization
    domain_desc = body.domain or body.description or org.name
    rule1 = GuidelineRule(
        guideline_id=guideline.id,
        rule_code="BRAND-DOMAIN-001",
        category="brand_voice",
        title="Domain Boundary Control",
        description=f"All marketing collateral must strictly pertain to {org.name}'s authorized domain: {domain_desc}.",
        severity="error",
        is_active=True,
    )
    rule2 = GuidelineRule(
        guideline_id=guideline.id,
        rule_code="BRAND-PROMISE-001",
        category="factual",
        title="Prohibition on Absolute Guarantees",
        description="Do not make unbacked 100% absolute guarantees or superlatives without certified experimental ground truth.",
        severity="error",
        is_active=True,
    )
    rule3 = GuidelineRule(
        guideline_id=guideline.id,
        rule_code="BRAND-DLP-001",
        category="legal",
        title="Data Loss Prevention (DLP)",
        description="Do not leak internal NDA classification markers, private staging credentials, or unredacted keys.",
        severity="error",
        is_active=True,
    )
    db.add_all([rule1, rule2, rule3])

    # Seed initial ground-truth fact for this brand
    fact = Fact(
        organization_id=org.id,
        category="general",
        statement=f"{org.name} operates in the verified enterprise domain: {domain_desc}.",
        source=f"Official {org.name} Corporate Charter (2026)",
        is_active=True,
    )
    db.add(fact)

    # Seed an administrator user for the organization
    admin_user = User(
        organization_id=org.id,
        auth_id=f"auth-{clean_slug}-{uuid.uuid4().hex[:8]}",
        email=f"admin@{clean_slug}.internal",
        full_name=f"{body.name.strip()} Administrator",
        role="admin",
    )
    db.add(admin_user)

    await db.commit()
    await db.refresh(org)

    return OrgResponse(
        id=str(org.id),
        name=org.name,
        slug=org.slug,
        description=org.description,
        status=org.status or "active",
        created_at=org.created_at.isoformat() if org.created_at else "",
    )


@router.post("/{slug_or_id}/approve")
async def approve_organization(
    slug_or_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """
    Approve and activate a pending brand workspace application from the SuperAdmin Master Console.
    Once approved, the brand workspace becomes active and appears on the public portal selector.
    """
    clean_target = slug_or_id.strip().lower()
    org = None
    try:
        org_uuid = uuid.UUID(slug_or_id)
        res = await db.execute(select(Organization).where(Organization.id == org_uuid))
        org = res.scalar_one_or_none()
    except ValueError:
        pass

    if not org:
        res = await db.execute(select(Organization).where(Organization.slug == clean_target))
        org = res.scalar_one_or_none()

    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    org.status = "active"
    await db.commit()
    await db.refresh(org)

    return {
        "status": "success",
        "id": str(org.id),
        "name": org.name,
        "slug": org.slug,
        "org_status": org.status,
        "message": f"Brand workspace '{org.name}' ({org.slug}) approved and activated successfully.",
    }


@router.delete("/{slug_or_id}")
async def delete_organization(
    slug_or_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """
    Deletes an enterprise organization and cascades its Brand Brain rules, facts, and content.
    Protected default brands ('aureon', 'solaria') cannot be deleted.
    """
    clean_target = slug_or_id.strip().lower()
    if clean_target in ("aureon", "solaria"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="System core brand workspaces ('aureon', 'solaria') are protected and cannot be deleted.",
        )

    from sqlalchemy import delete
    from app.models.content import ContentVersion
    from app.models.review import Review
    from app.models.terminology import TerminologyRule
    from app.models.audit import AuditEvent

    org = None
    try:
        org_uuid = uuid.UUID(slug_or_id)
        res = await db.execute(select(Organization).where(Organization.id == org_uuid))
        org = res.scalar_one_or_none()
    except ValueError:
        pass

    if not org:
        res = await db.execute(select(Organization).where(Organization.slug == clean_target))
        org = res.scalar_one_or_none()

    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    if org.slug in ("aureon", "solaria"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="System core brand workspaces are protected.",
        )

    # 1. Guidelines & Rules
    g_res = await db.execute(select(Guideline).where(Guideline.organization_id == org.id))
    g_ids = [g.id for g in g_res.scalars().all()]
    if g_ids:
        await db.execute(delete(GuidelineRule).where(GuidelineRule.guideline_id.in_(g_ids)))
        await db.execute(delete(Guideline).where(Guideline.id.in_(g_ids)))

    # 2. Facts
    await db.execute(delete(Fact).where(Fact.organization_id == org.id))

    # 3. Terminology
    await db.execute(delete(TerminologyRule).where(TerminologyRule.organization_id == org.id))

    # 4. Content & Reviews
    c_res = await db.execute(select(Content).where(Content.organization_id == org.id))
    c_ids = [c.id for c in c_res.scalars().all()]
    if c_ids:
        r_res = await db.execute(select(Review).where(Review.content_id.in_(c_ids)))
        r_ids = [r.id for r in r_res.scalars().all()]
        if r_ids:
            await db.execute(delete(Review).where(Review.id.in_(r_ids)))
        await db.execute(delete(ContentVersion).where(ContentVersion.content_id.in_(c_ids)))
        await db.execute(delete(Content).where(Content.id.in_(c_ids)))

    # 5. Audit Events
    await db.execute(delete(AuditEvent).where(AuditEvent.organization_id == org.id))

    # 6. Users
    await db.execute(delete(User).where(User.organization_id == org.id))

    # 7. Organization
    await db.execute(delete(Organization).where(Organization.id == org.id))
    await db.commit()

    return {"status": "success", "message": f"Brand workspace '{org.name}' ({org.slug}) deleted successfully"}
