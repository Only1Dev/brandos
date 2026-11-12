"""
Orchestrator — Coordinates all agents, handles parallel execution, policy precedence, and governance decision.
PRD Section 56: Multi-Agent Orchestration Layer.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, List, Optional

from app.agents.brand_agent import BrandAgent
from app.agents.fact_agent import FactAgent
from app.agents.terminology_agent import TerminologyAgent
from app.agents.visual_agent import VisualAgent
from app.agents.accessibility_agent import AccessibilityAgent
from app.agents.devils_advocate import DevilsAdvocateAgent
from app.services.governance_engine import GovernanceEngine
from app.services.policy_engine import PolicyEngine

logger = logging.getLogger(__name__)


class AnalysisOrchestrator:
    """Central orchestrator for the BrandOS multi-agent review pipeline."""

    def __init__(self) -> None:
        self.brand_agent = BrandAgent()
        self.fact_agent = FactAgent()
        self.terminology_agent = TerminologyAgent()
        self.visual_agent = VisualAgent()
        self.accessibility_agent = AccessibilityAgent()
        self.devils_advocate = DevilsAdvocateAgent()
        self.governance_engine = GovernanceEngine()
        self.policy_engine = PolicyEngine()

    async def analyze_content(
        self,
        text: str,
        channel: str = "general",
        content_type: str = "social_post",
        rules: List[Dict[str, Any]] | None = None,
        facts: List[Dict[str, Any]] | None = None,
        terminology_rules: List[Dict[str, Any]] | None = None,
        approved_assets: List[Dict[str, Any]] | None = None,
        image_bytes: bytes | None = None,
        image_mime: str = "image/png",
        visual_metadata: Dict[str, Any] | None = None,
        brand_name: str = "Aureon Technologies",
        brand_domain: str = "Enterprise security and fraud detection intelligence",
    ) -> Dict[str, Any]:
        """
        Runs the full governance firewall analysis across all agents in parallel.
        """
        rules = rules or []
        facts = facts or []
        terminology_rules = terminology_rules or []
        approved_assets = approved_assets or []

        logger.info(f"Starting governance analysis for brand={brand_name}, channel={channel}, type={content_type}")

        # 1. Parallel Agent Execution
        brand_task = self.brand_agent.evaluate(
            text=text,
            rules=rules,
            channel=channel,
            content_type=content_type,
            brand_name=brand_name,
            brand_domain=brand_domain,
        )

        fact_task = self.fact_agent.evaluate(
            text=text,
            facts=facts,
            brand_name=brand_name,
        )

        # Terminology and Accessibility are deterministic and synchronous/fast
        term_findings = self.terminology_agent.evaluate(
            text=text,
            rules=terminology_rules,
        )

        a11y_findings = self.accessibility_agent.evaluate(
            text=text,
            channel=channel,
            visual_metadata=visual_metadata,
        )

        # Enforce custom guideline rules deterministically (e.g. Rule 777 CAPS prohibition, mandatory keyword inclusion)
        guideline_rule_findings = self.policy_engine.check_deterministic_guidelines(
            text=text,
            rules=rules,
        )

        # Enforce content quality standard (blocks placeholder text, gibberish like 'abcd')
        substance_findings = self.policy_engine.check_substance_quality(
            text=text,
        )

        # Enforce Data Loss Prevention (DLP) & Confidential Material Shield
        confidentiality_findings = self.policy_engine.check_confidentiality_dlp(
            text=text,
        )

        visual_task = self.visual_agent.evaluate(
            image_bytes=image_bytes,
            mime_type=image_mime,
            approved_assets=approved_assets,
            brand_name=brand_name,
            brand_domain=brand_domain,
        ) if image_bytes else None

        # Await async agents concurrently
        if visual_task:
            brand_findings, fact_findings, visual_findings = await asyncio.gather(
                brand_task, fact_task, visual_task
            )
        else:
            brand_findings, fact_findings = await asyncio.gather(
                brand_task, fact_task
            )
            visual_findings = []

        # Combine raw findings
        combined_findings = [
            *confidentiality_findings,
            *substance_findings,
            *guideline_rule_findings,
            *fact_findings,
            *brand_findings,
            *term_findings,
            *visual_findings,
            *a11y_findings,
        ]

        logger.info(f"Agents returned {len(combined_findings)} raw findings. Running Devil's Advocate...")

        # 2. Devil's Advocate Agent (Challenges high-severity findings)
        if combined_findings:
            vetted_findings = await self.devils_advocate.challenge_findings(
                findings=combined_findings,
                content_text=text,
                channel=channel,
                content_type=content_type,
            )
        else:
            vetted_findings = []

        # 3. Governance Engine — computes risk score, breakdown, and publication verdict
        gov_result = self.governance_engine.calculate_decision(vetted_findings)

        return {
            "status": gov_result["decision"],
            "governance_score": gov_result["governance_score"],
            "risk_summary": gov_result["risk_summary"],
            "findings": vetted_findings,
            "total_findings": len(vetted_findings),
        }
