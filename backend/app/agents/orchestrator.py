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

        # Check if this is a media file upload with auto-generated placeholder text
        is_media_file_upload = bool(
            text.strip().startswith("[Video creative uploaded:")
            or text.strip().startswith("[Image creative uploaded:")
            or text.strip().startswith("[File uploaded:")
        )

        visual_task = self.visual_agent.evaluate(
            image_bytes=image_bytes,
            mime_type=image_mime,
            approved_assets=approved_assets,
            brand_name=brand_name,
            brand_domain=brand_domain,
        ) if image_bytes else None

        if is_media_file_upload:
            # For pure media uploads, the video/image itself is the governed asset.
            # Avoid false-positive text-placeholder checks on the filename wrapper.
            brand_findings = []
            fact_findings = []
            term_findings = []
            a11y_findings = []
            guideline_rule_findings = []
            substance_findings = []
            confidentiality_findings = []
            visual_findings = (await visual_task) if visual_task else []
        else:
            # 1. Parallel Agent Execution for text or multimodal copy
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
                brand_name=brand_name,
                brand_domain=brand_domain,
            )

            # Enforce Data Loss Prevention (DLP) & Confidential Material Shield
            confidentiality_findings = self.policy_engine.check_confidentiality_dlp(
                text=text,
            )

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
        # When content is identified as placeholder/gibberish, consolidate substance findings to avoid duplicates
        is_substance_violation = any(
            f.get("rule_ref") == "BRAND-SUBSTANCE-001" or "placeholder" in (f.get("title") or "").lower()
            for f in substance_findings
        )
        if is_substance_violation:
            # Drop redundant LLM brand findings for placeholder/substance or domain misalignment
            brand_findings = [
                f for f in brand_findings
                if f.get("rule_ref") not in ("BRAND-IDENTITY-001", "BRAND-SUBSTANCE-001")
                and "domain misalignment" not in (f.get("title") or "").lower()
                and "placeholder" not in (f.get("title") or "").lower()
                and "meaningless" not in (f.get("title") or "").lower()
                and "substance" not in (f.get("title") or "").lower()
            ]

        raw_combined = [
            *confidentiality_findings,
            *substance_findings,
            *guideline_rule_findings,
            *fact_findings,
            *brand_findings,
            *term_findings,
            *visual_findings,
            *a11y_findings,
        ]

        # General deduplication: prevent duplicate findings targeting the exact same rule and text excerpt
        combined_findings = []
        seen_keys = set()
        for f in raw_combined:
            ref = f.get("rule_ref") or f.get("title", "")
            det = (f.get("detected_text") or "").strip().lower()
            key = (ref, det)
            if key not in seen_keys:
                seen_keys.add(key)
                combined_findings.append(f)
            else:
                # If seen before but current one has a better/non-empty suggestion, upgrade it
                curr_sugg = (f.get("suggestion") or {}).get("suggested_text", "")
                for idx, uf in enumerate(combined_findings):
                    uf_key = (
                        uf.get("rule_ref") or uf.get("title", ""),
                        (uf.get("detected_text") or "").strip().lower()
                    )
                    if uf_key == key:
                        prev_sugg = (uf.get("suggestion") or {}).get("suggested_text", "")
                        if not prev_sugg and curr_sugg:
                            combined_findings[idx] = f
                        break

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
