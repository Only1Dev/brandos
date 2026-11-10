"""
Seed Script — Pre-populates the database with the PRD Demo Acceptance Scenario (Section 53).
"""

from __future__ import annotations

import asyncio
import datetime
import uuid
from sqlalchemy import select

from app.database import async_session_factory, engine, Base
from app.models.organization import Organization
from app.models.user import User
from app.models.guideline import Guideline, GuidelineRule
from app.models.fact import Fact
from app.models.claim import Claim
from app.models.terminology import TerminologyRule
from app.models.asset import Asset
from app.models.content import Content, ContentVersion
from app.models.review import Review


async def seed():
    print("Connecting to database and creating tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as session:
        # Check if already seeded
        res = await session.execute(select(Organization).where(Organization.slug == "aureon-tech"))
        existing = res.scalar_one_or_none()
        if existing:
            print("Database already contains demo organization 'Aureon Technologies'.")
            return

        print("Seeding Aureon Technologies organization...")
        org = Organization(
            name="Aureon Technologies",
            slug="aureon-tech",
            description="Enterprise security and fraud detection intelligence.",
        )
        session.add(org)
        await session.flush()

        # Seed User
        demo_user = User(
            auth_id="demo-user-aureon",
            email="brand.admin@aureon.ai",
            full_name="Priya Sharma",
            role="admin",
            organization_id=org.id,
        )
        session.add(demo_user)
        await session.flush()

        # Seed Guideline & Rules
        guideline = Guideline(
            organization_id=org.id,
            title="Aureon Brand & Messaging Governance Book 2026",
            category="brand_voice",
            version=1,
        )
        session.add(guideline)
        await session.flush()

        rule1 = GuidelineRule(
            guideline_id=guideline.id,
            rule_code="RULE-044",
            category="tone",
            title="Prohibited Unsupported Superlatives",
            description="Do not use unverified superlative claims such as '#1 in the country' or 'industry leader' without explicit external third-party audit citations.",
            severity="error",
            check_type="llm",
        )
        rule2 = GuidelineRule(
            guideline_id=guideline.id,
            rule_code="RULE-031",
            category="legal",
            title="Prohibited Absolute Guarantees",
            description="Absolute guarantees of safety, security, or zero fraud (e.g. '100% protection', 'guarantees zero breach') are strictly prohibited due to regulatory and legal liability.",
            severity="error",
            check_type="llm",
        )
        rule3 = GuidelineRule(
            guideline_id=guideline.id,
            rule_code="RULE-017",
            category="tone",
            title="Confident Empirical Language",
            description="Use confident, empirical, non-aggressive language. Focus on measurable risk reduction rather than hyperbole.",
            severity="warning",
            check_type="llm",
        )
        session.add_all([rule1, rule2, rule3])

        # Seed Fact FACT-042
        fact42 = Fact(
            organization_id=org.id,
            category="performance",
            statement="Aureon Shield platform achieves an audited 42% average reduction in transaction fraud.",
            source="Aureon Annual Fraud Benchmark Audit (Q4 2025)",
            numerical_value=42.0,
            numerical_unit="%",
            valid_from=datetime.date(2025, 1, 1),
            valid_until=datetime.date(2026, 12, 31),
        )
        session.add(fact42)

        # Seed Terminology Rule
        term_rule = TerminologyRule(
            organization_id=org.id,
            term="fraud protection platform",
            term_type="forbidden",
            preferred_alternative="fraud prevention platform",
            severity="error",
            context="Use 'prevention' instead of 'protection' to reflect preventative intelligence.",
        )
        session.add(term_rule)

        # Seed Asset
        asset_logo = Asset(
            organization_id=org.id,
            name="LOGO-PRIMARY-V3",
            asset_type="logo",
            file_url="/uploads/aureon_logo_v3.png",
            version=3,
            is_approved=True,
            is_active=True,
        )
        session.add(asset_logo)

        # Seed Claim CLM-027
        claim27 = Claim(
            organization_id=org.id,
            claim_text="Aureon Shield delivers proven 42% fraud reduction across digital banking channels.",
            category="product_feature",
            confidence=1.0,
            status="verified",
        )
        session.add(claim27)

        # Seed PRD Section 53 Acceptance Demo Content
        demo_content = Content(
            organization_id=org.id,
            title="Q1 National Awareness Campaign — Launch Copy",
            content_type="text",
            channel="social",
            created_by=demo_user.id,
        )
        session.add(demo_content)
        await session.flush()

        demo_version = ContentVersion(
            content_id=demo_content.id,
            version_number=1,
            body_text="Aureon is India's #1 fraud prevention platform, reducing fraud by 73% and guaranteeing 100% protection.",
        )
        session.add(demo_version)
        await session.flush()

        # Create Review
        review = Review(
            content_id=demo_content.id,
            content_version_id=demo_version.id,
            status="pending",
            created_by=demo_user.id,
        )
        session.add(review)

        await session.commit()
        print("Successfully seeded Aureon Technologies demo dataset!")
        print(f"Demo Review ID: {review.id}")


if __name__ == "__main__":
    asyncio.run(seed())
