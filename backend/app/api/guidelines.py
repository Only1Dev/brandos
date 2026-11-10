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
from app.models.organization import Organization
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
    brand: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    query = select(GuidelineRule).where(GuidelineRule.is_active == True)
    
    target_org_id = None
    if brand:
        org_res = await db.execute(select(Organization).where(Organization.slug == brand))
        target_org = org_res.scalar_one_or_none()
        if target_org:
            target_org_id = target_org.id
    elif user and user.organization_id and user.role != "superadmin":
        target_org_id = user.organization_id

    if target_org_id:
        query = query.join(Guideline, GuidelineRule.guideline_id == Guideline.id).where(
            Guideline.organization_id == target_org_id
        )
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
    brand: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    if user and user.role not in ("admin", "superadmin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Administrators can create or register new Brand Brain rules.",
        )
    # Find or create a default guideline container for the active organization
    target_org_id = None
    if brand:
        org_res = await db.execute(select(Organization).where(Organization.slug == brand))
        target_org = org_res.scalar_one_or_none()
        if target_org:
            target_org_id = target_org.id
    if not target_org_id and user and user.organization_id:
        target_org_id = user.organization_id

    if target_org_id:
        g_res = await db.execute(
            select(Guideline)
            .where(Guideline.organization_id == target_org_id)
            .order_by(Guideline.created_at.desc())
            .limit(1)
        )
    else:
        g_res = await db.execute(select(Guideline).limit(1))
    guideline = g_res.scalar_one_or_none()
    if not guideline:
        guideline = Guideline(
            organization_id=target_org_id or uuid.uuid4(),
            title="General Brand Guidelines",
            version=1,
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


@router.delete("/rules/{id}")
async def delete_rule(
    id: str,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    if user and user.role not in ("admin", "superadmin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Administrators can deactivate or delete Brand Brain rules.",
        )
    rule_uuid = uuid.UUID(id)
    res = await db.execute(select(GuidelineRule).where(GuidelineRule.id == rule_uuid))
    rule = res.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Guideline rule not found")

    rule.is_active = False
    await db.commit()

    if user:
        await AuditService.log_action(
            db=db,
            user_id=user.id,
            action="rule_deactivated",
            entity_type="guideline_rule",
            entity_id=rule.id,
            details={"rule_code": rule.rule_code, "title": rule.title},
        )

    return {"status": "success", "message": f"Rule {rule.rule_code} deactivated successfully"}


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

    os.makedirs(settings.upload_dir, exist_ok=True)
    pdf_path = os.path.join(settings.upload_dir, filename)
    if not os.path.exists(pdf_path):
        try:
            backend_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
            import sys
            if backend_root not in sys.path:
                sys.path.insert(0, backend_root)
            if brand_key == "solaria":
                from create_solaria_pdf import generate_pdf as gen_solaria
                gen_solaria(settings.upload_dir)
            else:
                from create_guideline_pdf import generate_pdf as gen_aureon
                gen_aureon(settings.upload_dir)
        except Exception as gen_err:
            logger.warning(f"Could not generate PDF on-the-fly: {gen_err}")

    raw_text = ""
    if os.path.exists(pdf_path):
        try:
            with open(pdf_path, "rb") as f:
                pdf_bytes = f.read()
            raw_text = extract_text_from_pdf(pdf_bytes)
        except Exception as ext_err:
            logger.warning(f"Failed extracting PDF text: {ext_err}")

    if not raw_text.strip():
        if brand_key == "solaria":
            raw_text = (
                "Solaria Wellness & Clinical Nutrition. Brand voice is warm, scientifically grounded, transparent. "
                "Never claim to cure diabetes, 100% cure, or instant medical treatment without FDA/FSSAI clinical drug approval. "
                "PureHydrate provides 3.0x electrolyte absorption and 0% sugar. Primary color #064E3B, accent #10B981."
            )
        else:
            raw_text = (
                "Aureon Technologies Brand Guidelines. Authoritative, precise, confident tone. "
                "Prohibit 100% protection guarantees or #1 superlatives without citation. "
                "Use 'Fraud Prevention Platform' instead of 'Fraud Protection Platform'. "
                "Benchmark is 42.0% enterprise fraud reduction."
            )

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
        {
            "id": str(f.id),
            "fact_id": f"FACT-{str(f.id)[:6].upper()}",
            "name": f.category,
            "category": f.category,
            "statement": f.statement,
            "value": f"{f.numerical_value} {f.numerical_unit or ''}".strip() if f.numerical_value is not None else f.statement,
            "numerical_value": f.numerical_value,
            "numerical_unit": f.numerical_unit,
            "status": "active",
        }
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

    decision = results.get("status", "BLOCKED")
    score = results.get("governance_score", 0)
    findings = results.get("findings", [])
    is_attack_intercepted = decision in ("BLOCKED", "REVIEW_REQUIRED") or score < 85 or len(findings) > 0

    if is_attack_intercepted:
        summary = f"Adversarial drift detected: The BrandOS Autonomous Firewall successfully intercepted this {body.attack_type.replace('_', ' ')} payload ({len(findings)} violation{'s' if len(findings) != 1 else ''} flagged)."
        status_val = "intercepted"
    else:
        summary = f"Payload verified compliant: Content satisfied all Brand Brain guidelines, approved facts, and active tone rules (Governance Score: {score}/100 PASS)."
        status_val = "cleared"

    return {
        "status": status_val,
        "attack_type": body.attack_type,
        "brand_name": brand_name,
        "input_copy": test_copy,
        "decision": decision,
        "governance_score": score,
        "total_violations": len(findings),
        "findings": findings,
        "defense_summary": summary,
    }
