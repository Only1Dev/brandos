"""
Seed both Aureon Technologies and Solaria Wellness in PostgreSQL.
"""
import asyncio
import uuid
from datetime import datetime, date
from sqlalchemy import select
from app.database import async_session_factory
from app.models.organization import Organization
from app.models.guideline import Guideline, GuidelineRule
from app.models.fact import Fact
from app.models.terminology import TerminologyRule
from app.models.asset import Asset
from app.models.user import User

async def seed():
    async with async_session_factory() as db:
        print("Seeding organizations...")

        # 1. Aureon Technologies
        aureon_res = await db.execute(select(Organization).where(Organization.slug == "aureon"))
        aureon = aureon_res.scalar_one_or_none()
        if not aureon:
            aureon_res = await db.execute(select(Organization).where(Organization.name == "Aureon Technologies"))
            aureon = aureon_res.scalar_one_or_none()
            if aureon:
                aureon.slug = "aureon"
            else:
                aureon = Organization(
                    id=uuid.UUID("a4d85330-0c0f-4c0f-8295-b6ceaefa2bb9"),
                    name="Aureon Technologies",
                    slug="aureon",
                    description="Enterprise banking security, autonomous fraud detection, and transaction risk defense intelligence (Aureon Shield).",
                )
                db.add(aureon)
                await db.flush()
        else:
            aureon.description = "Enterprise banking security, autonomous fraud detection, and transaction risk defense intelligence (Aureon Shield)."
            aureon.name = "Aureon Technologies"

        # 2. Solaria Wellness
        solaria_res = await db.execute(select(Organization).where(Organization.slug == "solaria"))
        solaria = solaria_res.scalar_one_or_none()
        if not solaria:
            solaria_id = uuid.uuid4()
            solaria = Organization(
                id=solaria_id,
                name="Solaria Wellness",
                slug="solaria",
                description="Clinical preventative wellness, organic adaptogenic hydration, and plant-based cellular nutrition (Solaria PureHydrate, Solaria BioImmune).",
            )
            db.add(solaria)
            await db.flush()
            print(f"Created Solaria Wellness org: {solaria.id}")
        else:
            solaria.description = "Clinical preventative wellness, organic adaptogenic hydration, and plant-based cellular nutrition (Solaria PureHydrate, Solaria BioImmune)."
            solaria.name = "Solaria Wellness"

        # Seed users for both brands
        users_to_ensure = [
            # Aureon
            ("admin@aureon.internal", "Priya Sharma", "admin", aureon.id),
            ("reviewer@aureon.internal", "David Chen", "reviewer", aureon.id),
            ("creator@aureon.internal", "Alex Rivera", "creator", aureon.id),
            # Solaria
            ("admin@solaria.internal", "Maya Lin", "admin", solaria.id),
            ("reviewer@solaria.internal", "Marcus Vance", "reviewer", solaria.id),
            ("creator@solaria.internal", "Chloe Bennett", "creator", solaria.id),
            # SuperAdmin
            ("superadmin@brandos.internal", "Chief Governance Officer", "superadmin", None),
        ]

        for email, full_name, role, org_id in users_to_ensure:
            u_res = await db.execute(select(User).where(User.email == email))
            u = u_res.scalar_one_or_none()
            if not u:
                u = User(
                    auth_id=f"demo-{email}",
                    email=email,
                    full_name=full_name,
                    role=role,
                    organization_id=org_id,
                )
                db.add(u)

        # Seed Solaria facts
        sf_res = await db.execute(select(Fact).where(Fact.organization_id == solaria.id))
        if not sf_res.scalars().all():
            db.add_all([
                Fact(
                    organization_id=solaria.id,
                    category="Hydration Efficacy",
                    statement="Solaria PureHydrate delivers an audited 3.0x cellular electrolyte absorption rate compared to standard mineral water.",
                    source="Eurofins Clinical Trial CT-2025-A",
                    numerical_value=3.0,
                    numerical_unit="x absorption",
                    numerical_tolerance=0.1,
                    valid_from=date(2025, 1, 1),
                    valid_until=date(2027, 12, 31),
                    is_active=True,
                ),
                Fact(
                    organization_id=solaria.id,
                    category="Purity Standard",
                    statement="Solaria PureHydrate contains 0% artificial sweeteners and 0g added sugar.",
                    source="Eurofins Purity Certification 2026",
                    numerical_value=0.0,
                    numerical_unit="g sugar",
                    numerical_tolerance=0.0,
                    valid_from=date(2025, 1, 1),
                    valid_until=date(2027, 12, 31),
                    is_active=True,
                ),
            ])

        # Seed Solaria guidelines & rules
        sg_res = await db.execute(select(Guideline).where(Guideline.organization_id == solaria.id))
        s_guide = sg_res.scalar_one_or_none()
        if not s_guide:
            s_guide = Guideline(
                organization_id=solaria.id,
                title="Solaria Official Brand Guidelines 2026",
                description="Clinical-grade wellness, adaptogenic hydration, and natural nutrition standards.",
                category="brand_voice",
                source_file_url="/uploads/Solaria_Wellness_Official_Brand_Guidelines_2026.pdf",
                version=3,
                is_active=True,
            )
            db.add(s_guide)
            await db.flush()

            db.add_all([
                GuidelineRule(
                    guideline_id=s_guide.id,
                    rule_code="RULE-SOL-01",
                    title="No Absolute Medical Claims",
                    category="claim_boundary",
                    description="Do not make absolute medical cure claims (e.g. 'cures diabetes', '100% cure', 'instant healing') without FDA/FSSAI clinical drug approval.",
                    severity="critical",
                    check_type="llm_semantic",
                    is_active=True,
                ),
                GuidelineRule(
                    guideline_id=s_guide.id,
                    rule_code="RULE-SOL-02",
                    title="No Unbacked Superlatives",
                    category="tone",
                    description="Do not use unbacked superlatives like '#1 supplement in the world' or 'miracle cure' without clinical trial citations.",
                    severity="warning",
                    check_type="llm_semantic",
                    is_active=True,
                ),
                GuidelineRule(
                    guideline_id=s_guide.id,
                    rule_code="RULE-SOL-03",
                    title="Warm Scientific Tone",
                    category="tone",
                    description="Maintain warm, scientifically grounded, transparent tone. Avoid fearmongering or hyperbolic promises.",
                    severity="medium",
                    check_type="llm_semantic",
                    is_active=True,
                ),
            ])

        # Seed Solaria terminology
        st_res = await db.execute(select(TerminologyRule).where(TerminologyRule.organization_id == solaria.id))
        if not st_res.scalars().all():
            db.add_all([
                TerminologyRule(
                    organization_id=solaria.id,
                    term="miracle cure",
                    term_type="forbidden",
                    preferred_alternative="clinical electrolyte hydration",
                    context="Prohibited by regulatory health policy",
                    severity="error",
                    is_active=True,
                ),
                TerminologyRule(
                    organization_id=solaria.id,
                    term="100% detox",
                    term_type="forbidden",
                    preferred_alternative="cellular hydration support",
                    context="Prohibited misleading health claim",
                    severity="error",
                    is_active=True,
                ),
                TerminologyRule(
                    organization_id=solaria.id,
                    term="energy booster",
                    term_type="deprecated",
                    preferred_alternative="sustained bio-adaptive vitality",
                    context="Preferred brand terminology",
                    severity="warning",
                    is_active=True,
                ),
            ])

        # Seed Solaria assets
        sa_res = await db.execute(select(Asset).where(Asset.organization_id == solaria.id))
        if not sa_res.scalars().all():
            db.add_all([
                Asset(
                    organization_id=solaria.id,
                    name="SOLARIA-LEAF-V2",
                    asset_type="logo",
                    version=2,
                    is_approved=True,
                    is_active=True,
                ),
                Asset(
                    organization_id=solaria.id,
                    name="SOLARIA-DROPLET-V1",
                    asset_type="logo",
                    version=1,
                    is_approved=False,
                    is_active=False,
                ),
            ])

        await db.commit()
        print("Both Aureon Technologies and Solaria Wellness seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed())
