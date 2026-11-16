"""
BrandOS Headless API v1 — CI/CD Pre-Commit & CMS Webhook Firewall Engine.
Exposes headless inspection for GitHub Actions, pre-commit hooks, Figma plugins, and CMS webhooks.
"""

from __future__ import annotations

import hashlib
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import httpx
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.orchestrator import AnalysisOrchestrator
from app.database import get_db
from app.models.organization import Organization
from app.models.guideline import Guideline, GuidelineRule
from app.models.fact import Fact
from app.models.terminology import TerminologyRule

router = APIRouter(prefix="/v1/firewall", tags=["Headless Firewall & CI/CD API"])


class FirewallInspectRequest(BaseModel):
    brand: str = Field(default="aureon", description="Brand slug: 'aureon', 'solaria', or registered tenant slug")
    content: str = Field(..., description="Raw text, markdown, advertisement copy, or press release to audit")
    channel: str = Field(default="press_release", description="Target distribution channel (e.g. press_release, website, instagram, linkedin)")
    content_type: str = Field(default="article", description="Collateral type (article, social_post, banner_ad)")
    strict_mode: bool = Field(default=True, description="When true, any zero-tolerance critical policy violation sets exit code to 1")
    webhook_url: Optional[str] = Field(default=None, description="Optional webhook URL to notify on inspection completion")


class FirewallInspectResponse(BaseModel):
    decision: str
    governance_score: int
    status: str
    cicd_status: str
    exit_code: int
    brand: str
    channel: str
    total_findings: int
    critical_findings: int
    findings: List[Dict[str, Any]]
    radar_telemetry: Dict[str, int]
    truthmark_signature: str
    inspected_at: str
    latency_ms: float
    summary: str


@router.post("/inspect", response_model=FirewallInspectResponse)
async def inspect_content_headless(
    payload: FirewallInspectRequest,
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Headless CI/CD & CMS Pre-Commit Inspection Endpoint.
    Used by GitHub Actions, pre-commit hooks, Figma plugins, and CMS webhooks.
    Returns machine-readable governance verdict with exit_code (0 = PASS, 1 = BLOCKED).
    """
    start_time = time.time()
    brand_slug = payload.brand.lower().strip()

    # Resolve organization context from database or fallback to well-known tenants
    org_res = await db.execute(select(Organization).where(Organization.slug == brand_slug))
    org = org_res.scalar_one_or_none()
    if not org:
        org_res = await db.execute(select(Organization).limit(1))
        org = org_res.scalar_one_or_none()

    brand_name = org.name if org else ("Aureon Technologies" if brand_slug == "aureon" else "Solaria Wellness")
    brand_domain = org.description if org and org.description else (
        "Enterprise security and fraud detection intelligence" if brand_slug == "aureon"
        else "Premium cellular hydration and preventative metabolic wellness"
    )

    # Fetch active guidelines, facts, and terminology
    rules: List[Dict[str, Any]] = []
    facts: List[Dict[str, Any]] = []
    terminology_rules: List[Dict[str, Any]] = []

    if org:
        g_res = await db.execute(
            select(GuidelineRule).join(Guideline).where(
                Guideline.organization_id == org.id,
                GuidelineRule.is_active == True,
            )
        )
        for r in g_res.scalars().all():
            rules.append({
                "id": str(r.id),
                "rule_code": r.rule_code,
                "title": r.title,
                "description": r.description,
                "severity": r.severity,
                "category": r.category,
                "check_type": r.check_type,
                "check_value": r.check_value,
            })

        f_res = await db.execute(
            select(Fact).where(Fact.organization_id == org.id, Fact.is_active == True)
        )
        for f in f_res.scalars().all():
            facts.append({
                "id": str(f.id),
                "category": f.category,
                "statement": f.statement,
                "numerical_value": f.numerical_value,
                "numerical_unit": f.numerical_unit,
                "numerical_tolerance": f.numerical_tolerance,
                "source": f.source,
            })

        t_res = await db.execute(
            select(TerminologyRule).where(
                TerminologyRule.organization_id == org.id,
                TerminologyRule.is_active == True,
            )
        )
        for t in t_res.scalars().all():
            terminology_rules.append({
                "id": str(t.id),
                "term": t.term,
                "term_type": t.term_type,
                "preferred_alternative": t.preferred_alternative,
                "context": t.context,
                "severity": t.severity,
            })

    # Execute multi-agent governance pipeline
    orchestrator = AnalysisOrchestrator()
    analysis_result = await orchestrator.analyze_content(
        text=payload.content,
        rules=rules,
        facts=facts,
        terminology_rules=terminology_rules,
        channel=payload.channel,
        content_type=payload.content_type,
        brand_name=brand_name,
        brand_domain=brand_domain,
    )

    decision = analysis_result.get("status", "BLOCKED")
    raw_score = int(analysis_result.get("governance_score", 0))
    findings = analysis_result.get("findings", [])

    crit_count = sum(1 for f in findings if f.get("severity") in ("critical", "error"))
    
    # Zero-tolerance clamping
    if decision == "BLOCKED" or crit_count > 0:
        governance_score = 0 if any(
            f.get("rule_ref") in ("SECURITY-INJECTION-001", "REG-FDA-001", "COMPETITOR-DEFAMATION-001", "BRAND-SUBSTANCE-001", "BRAND-IDENTITY-001")
            for f in findings
        ) else min(raw_score, 35)
        decision = "BLOCKED"
        exit_code = 1
        cicd_status = "FAILED"
    else:
        governance_score = raw_score
        exit_code = 0
        cicd_status = "SUCCESS"

    # Compute TruthMark SHA-256 seal
    canonical_str = f"{brand_slug}:{payload.channel}:{payload.content.strip()}:{governance_score}"
    truthmark_sig = f"sha256:{hashlib.sha256(canonical_str.encode('utf-8')).hexdigest()}"

    latency_ms = round((time.time() - start_time) * 1000, 2)

    # Optional asynchronous webhook trigger
    if payload.webhook_url:
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                await client.post(
                    payload.webhook_url,
                    json={
                        "event": "brandos.firewall.inspected",
                        "brand": brand_slug,
                        "decision": decision,
                        "score": governance_score,
                        "cicd_status": cicd_status,
                        "exit_code": exit_code,
                        "truthmark_signature": truthmark_sig,
                    },
                )
        except Exception:
            pass

    summary = (
        f"BrandOS Governance Firewall: {decision} ({governance_score}/100) — "
        f"{'Content passed all enterprise brand boundaries with zero critical findings.' if decision == 'PASS' else f'Publication blocked due to {crit_count} zero-tolerance violation(s).'}"
    )

    return FirewallInspectResponse(
        decision=decision,
        governance_score=governance_score,
        status="completed",
        cicd_status=cicd_status,
        exit_code=exit_code,
        brand=brand_slug,
        channel=payload.channel,
        total_findings=len(findings),
        critical_findings=crit_count,
        findings=findings,
        radar_telemetry=analysis_result.get("radar_scores", {
            "domain": 100 if crit_count == 0 else 0,
            "tone": 100 if crit_count == 0 else 30,
            "facts": 100 if crit_count == 0 else 25,
            "terminology": 100 if crit_count == 0 else 40,
            "resilience": 100 if crit_count == 0 else 20,
        }),
        truthmark_signature=truthmark_sig,
        inspected_at=datetime.now(timezone.utc).isoformat(),
        latency_ms=latency_ms,
        summary=summary,
    )
