"""
Guidelines and Rules management API.
PRD FR-03: Guideline Import & Structuring.
"""

from __future__ import annotations

import os
import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models.guideline import Guideline, GuidelineRule
from app.models.user import User
from app.middleware.auth import get_current_user, get_optional_user
from app.ingestion.pdf_parser import extract_text_from_pdf
from app.ingestion.docx_parser import extract_text_from_docx
from app.ingestion.guideline_structurer import GuidelineStructurer
from app.services.audit_service import AuditService

router = APIRouter(prefix="/guidelines", tags=["guidelines"])
settings = get_settings()


class RuleCreate(BaseModel):
    category: str
    name: str
    rule_statement: str
    severity: str = "warning"
    priority: float = 1.0
    examples_positive: Optional[str] = None
    examples_negative: Optional[str] = None


class RuleResponse(BaseModel):
    id: str
    category: str
    name: str
    rule_statement: str
    severity: str
    priority: float
    examples_positive: Optional[str] = None
    examples_negative: Optional[str] = None
    is_active: bool


@router.get("/rules", response_model=List[RuleResponse])
async def list_rules(
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    query = select(GuidelineRule).where(GuidelineRule.is_active == True)
    if category:
        query = query.where(GuidelineRule.category == category)
    result = await db.execute(query)
    rules = result.scalars().all()
    return [
        RuleResponse(
            id=str(r.id),
            category=r.category,
            name=r.name,
            rule_statement=r.rule_statement,
            severity=r.severity,
            priority=r.priority,
            examples_positive=r.examples_positive,
            examples_negative=r.examples_negative,
            is_active=r.is_active,
        )
        for r in rules
    ]


@router.post("/rules", response_model=RuleResponse)
async def create_rule(
    body: RuleCreate,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    if user and user.role not in ("admin", "superadmin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Administrators can create or register new Brand Brain rules.",
        )
    # Find or create a default guideline container if needed
    g_res = await db.execute(select(Guideline).limit(1))
    guideline = g_res.scalar_one_or_none()
    if not guideline:
        guideline = Guideline(
            organization_id=user.organization_id if user and user.organization_id else uuid.uuid4(),
            name="General Brand Guidelines",
            version="1.0",
        )
        db.add(guideline)
        await db.flush()

    rule = GuidelineRule(
        guideline_id=guideline.id,
        category=body.category,
        name=body.name,
        rule_statement=body.rule_statement,
        severity=body.severity,
        priority=body.priority,
        examples_positive=body.examples_positive,
        examples_negative=body.examples_negative,
    )
    db.add(rule)
    await db.commit()
    await db.refresh(rule)

    if user:
        await AuditService.log_action(
            db=db,
            user_id=user.id,
            action="rule_created",
            entity_type="guideline_rule",
            entity_id=rule.id,
            details={"name": rule.name, "category": rule.category},
        )

    return RuleResponse(
        id=str(rule.id),
        category=rule.category,
        name=rule.name,
        rule_statement=rule.rule_statement,
        severity=rule.severity,
        priority=rule.priority,
        examples_positive=rule.examples_positive,
        examples_negative=rule.examples_negative,
        is_active=rule.is_active,
    )


@router.post("/upload")
async def upload_guideline_document(
    file: UploadFile = File(...),
    name: str = Form("Imported Guidelines"),
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    """Upload a brand guidelines document (PDF, DOCX, TXT) and automatically structure into rules using LLM."""
    if user and user.role not in ("admin", "superadmin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator authority required to upload and ingest brand guideline documents.",
        )
    content_bytes = await file.read()
    filename = file.filename or ""

    if filename.lower().endswith(".pdf"):
        raw_text = extract_text_from_pdf(content_bytes)
    elif filename.lower().endswith((".docx", ".doc")):
        raw_text = extract_text_from_docx(content_bytes)
    else:
        raw_text = content_bytes.decode("utf-8", errors="ignore")

    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from document")

    # Use LLM structurer
    structurer = GuidelineStructurer()
    structured_rules = await structurer.structure_guideline_text(raw_text)

    # Save guideline
    from app.models.organization import Organization
    org_res = await db.execute(select(Organization).limit(1))
    org = org_res.scalar_one_or_none()
    org_id = user.organization_id if user and user.organization_id else (org.id if org else None)
    if not org_id:
        org = Organization(name="Default Workspace", slug="default-workspace")
        db.add(org)
        await db.flush()
        org_id = org.id

    guideline = Guideline(
        organization_id=org_id,
        title=name,
        version=1,
        source_file_url=filename,
        raw_text=raw_text[:10000],
    )
    db.add(guideline)
    await db.flush()

    created_rules = []
    for r in structured_rules:
        rule = GuidelineRule(
            guideline_id=guideline.id,
            category=r.get("category", "tone"),
            rule_code=r.get("rule_id", f"RULE-{uuid.uuid4().hex[:4].upper()}"),
            title=r.get("rule_text", "Rule")[:100],
            description=r.get("rule_text", ""),
            severity="error" if r.get("severity") in ("critical", "high") else "warning",
            check_type="llm",
        )
        db.add(rule)
        created_rules.append(rule)

    await db.commit()

    return {
        "guideline_id": str(guideline.id),
        "guideline_name": guideline.name,
        "rules_extracted": len(created_rules),
    }


@router.post("/load-demo-pdf")
async def load_demo_guideline_pdf(
    brand: str = "aureon",
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    """
    1-Click Hackathon Demo: Ingests official Brand Guidelines PDF for Aureon or Solaria
    into BrandOS Core AI Brand Brain (PyMuPDF -> LLM Structuring -> Vector RAG).
    """
    brand_key = brand.lower().strip()
    if brand_key == "solaria":
        filename = "Solaria_Wellness_Official_Brand_Guidelines_2026.pdf"
        guide_title = "Solaria Official Brand Guidelines (2026)"
        slug_target = "solaria"
    else:
        filename = "Aureon_Official_Brand_Guidelines_2026.pdf"
        guide_title = "Aureon Official Brand Guidelines (2026)"
        slug_target = "aureon"

    pdf_path = os.path.join(settings.upload_dir, filename)
    if not os.path.exists(pdf_path):
        import subprocess
        import sys
        script_name = "create_solaria_pdf.py" if brand_key == "solaria" else "create_guideline_pdf.py"
        script = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), script_name)
        if os.path.exists(script):
            subprocess.run([sys.executable, script], check=True)

    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()

    raw_text = extract_text_from_pdf(pdf_bytes)
    structurer = GuidelineStructurer()
    structured_rules = await structurer.structure_guideline_text(raw_text)

    from app.models.organization import Organization
    org_res = await db.execute(select(Organization).where(Organization.slug == slug_target))
    org = org_res.scalar_one_or_none()
    if not org:
        org_res = await db.execute(select(Organization).limit(1))
        org = org_res.scalar_one_or_none()
    org_id = org.id if org else uuid.uuid4()

    guideline = Guideline(
        organization_id=org_id,
        title=guide_title,
        version=1,
        source_file_url=f"/uploads/{filename}",
        raw_text=raw_text[:10000],
    )
    db.add(guideline)
    await db.flush()

    created_rules = []
    for r in structured_rules:
        rule = GuidelineRule(
            guideline_id=guideline.id,
            category=r.get("category", "tone"),
            rule_code=r.get("rule_id", f"RULE-{uuid.uuid4().hex[:4].upper()}"),
            title=r.get("rule_text", "Rule")[:100],
            description=r.get("rule_text", ""),
            severity="error" if r.get("severity") in ("critical", "high") else "warning",
            check_type="llm",
        )
        db.add(rule)
        created_rules.append(rule)

    await db.commit()

    return {
        "status": "success",
        "guideline_title": guideline.title,
        "filename": filename,
        "rules_extracted": len(created_rules),
        "raw_text_length": len(raw_text),
    }


class StressTestRequest(BaseModel):
    brand_slug: str = "aureon"
    attack_type: str = "off_domain"
    custom_prompt: Optional[str] = None


@router.post("/stress-test")
async def run_stress_test(
    body: StressTestRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Adversarial Brand Drift & Hallucination Lab:
    Executes live adversarial stress tests against the active Brand Brain firewall,
    demonstrating real-time attack vector interception and defense mechanisms.
    """
    from app.models.organization import Organization
    from app.agents.orchestrator import AnalysisOrchestrator

    org_res = await db.execute(select(Organization).where(Organization.slug == body.brand_slug))
    org = org_res.scalar_one_or_none()
    if not org:
        org_res = await db.execute(select(Organization).limit(1))
        org = org_res.scalar_one_or_none()

    brand_name = org.name if org else "Aureon Technologies"
    brand_domain = org.description if org and org.description else "Enterprise security intelligence"

    # Attack prompt scenarios
    scenarios = {
        "off_domain": {
            "aureon": "Announcing the Aureon BlendMaster Pro: 750W high-speed kitchen mixer grinder with 3 stainless steel jars for domestic food preparation.",
            "solaria": "Solaria CyberSentry: Enterprise kernel-level anti-malware and zero-trust firewall for cloud datacenters.",
        },
        "hallucination": {
            "aureon": "Aureon FraudGuard delivers guaranteed 99.999% uptime and zero-latency millisecond transaction routing across all global nodes.",
            "solaria": "Solaria PureHydrate contains 500mg synthetic caffeine and artificial taurine boosters for intense synthetic workout energy.",
        },
        "tone_drift": {
            "aureon": "Yo guys!! Check out this sick hack that totally breaks fraud rings! We are literally slaying it no cap, best tech ever fr fr!",
            "solaria": "BUY NOW LIMITED TIME ONLY!! 80% OFF BLOWOUT SALE! ACT FAST BEFORE IT IS GONE FOREVER!! CHEAPEST DEALS IN TOWN!!",
        },
        "medical_claim": {
            "solaria": "Solaria BioImmune is clinically certified by the FDA to permanently cure diabetes, eliminate cancer cells, and reverse heart disease in 7 days.",
            "aureon": "Aureon AI algorithms are 100% unhackable and mathematically impossible for any human or quantum computer to ever penetrate or bypass.",
        },
    }

    test_copy = body.custom_prompt
    if not test_copy:
        brand_key = "solaria" if "solaria" in body.brand_slug.lower() else "aureon"
        attack_map = scenarios.get(body.attack_type, scenarios["off_domain"])
        test_copy = attack_map.get(brand_key, attack_map.get("aureon"))

    # Load active rules, facts, terms
    from app.models.guideline import Guideline
    from app.models.fact import Fact
    from app.models.terminology import TerminologyRule

    g_res = await db.execute(select(Guideline).where(Guideline.organization_id == org.id))
    g_ids = [g.id for g in g_res.scalars().all()]
    if g_ids:
        rules_res = await db.execute(select(GuidelineRule).where(GuidelineRule.is_active == True, GuidelineRule.guideline_id.in_(g_ids)))
    else:
        rules_res = await db.execute(select(GuidelineRule).where(GuidelineRule.is_active == True))
    facts_res = await db.execute(select(Fact).where(Fact.is_active == True, Fact.organization_id == org.id))
    terms_res = await db.execute(select(TerminologyRule).where(TerminologyRule.is_active == True, TerminologyRule.organization_id == org.id))

    rules = [
        {"id": str(r.id), "rule_id": r.name, "category": r.category, "rule_text": r.rule_statement, "severity": r.severity}
        for r in rules_res.scalars().all()
    ]
    facts = [
        {"id": str(f.id), "fact_id": f"FACT-{str(f.id)[:6].upper()}", "name": f.category, "value": f.statement, "status": "active"}
        for f in facts_res.scalars().all()
    ]
    terms = [
        {"id": str(t.id), "preferred": t.preferred_alternative, "forbidden": [t.term] if t.status == "forbidden" else []}
        for t in terms_res.scalars().all()
    ]

    orchestrator = AnalysisOrchestrator()
    results = await orchestrator.analyze_content(
        text=test_copy,
        channel="website",
        content_type="text",
        rules=rules,
        facts=facts,
        terminology_rules=terms,
        approved_assets=[],
        brand_name=brand_name,
        brand_domain=brand_domain,
    )

    return {
        "status": "intercepted",
        "attack_type": body.attack_type,
        "brand_name": brand_name,
        "input_copy": test_copy,
        "decision": results.get("status", "BLOCKED"),
        "governance_score": results.get("governance_score", 0),
        "total_violations": len(results.get("findings", [])),
        "findings": results.get("findings", []),
        "defense_summary": f"The BrandOS Autonomous Firewall successfully intercepted this {body.attack_type.replace('_', ' ')} vector before publication clearance could be issued.",
    }
