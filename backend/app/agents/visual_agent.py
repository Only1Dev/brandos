"""
Visual Agent — Evaluates visual assets, logos, and color palettes against approved brand assets.
PRD FR-12: Visual Agent
Uses Google Gemini Vision API via ModelRouter.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional

from app.services.model_router import get_model_router

logger = logging.getLogger(__name__)


VISUAL_AGENT_SYSTEM_PROMPT = """You are the Visual Governance Agent for BrandOS, an enterprise content governance platform.
Your job is to inspect images, documents, and creative designs against APPROVED BRAND ASSETS for {brand_name}.

ACTIVE WORKSPACE BRAND:
Brand Name: {brand_name}
Brand Domain: {brand_domain}

APPROVED BRAND ASSETS:
{assets_context}

Evaluate the visual submission thoroughly for:
1. Brand Identity & Third-Party Asset Check (CRITICAL):
   - Does this visual creative represent {brand_name}?
   - Does it display authorized {brand_name} branding (e.g. official logo, approved brand colors #4F46E5, #0F172A)?
   - If the uploaded image displays external third-party content (e.g. YouTube video player/UI, external social media screenshots, unrelated educational/lifestyle video thumbnails like 'Study 28 Hrs a Day', memes, unrelated products) and completely lacks official {brand_name} branding:
     You MUST flag a CRITICAL violation:
     - finding_type: "visual"
     - severity: "critical"
     - title: "Missing Brand Identity / Unapproved Third-Party Visual"
     - description: "The uploaded visual asset contains external third-party content (e.g. YouTube UI, study content) and lacks approved {brand_name} branding, official logos, or brand design elements."
     - detected_text: "[Third-party visual content detected]"
     - explanation: "All creative and social assets submitted under this brand must incorporate approved brand identity elements and adhere to visual design rules."
     - asset_ref: "LOGO-PRIMARY-V3"
     - confidence: 0.95
     - suggestion: {{
         "original_text": "Unapproved third-party creative",
         "suggested_text": "Use approved Aureon brand template with LOGO-PRIMARY-V3 and approved color palette (#4F46E5)",
         "reasoning": "Brand visual compliance requires authorized brand marks"
       }}
2. Logo Correctness: Is the logo current? Is an outdated version used (e.g. V1 instead of V3)?
3. Distortion & Aspect Ratio: Is the logo stretched, squashed, rotated, or altered?
4. Color Compliance: Does the visual adhere to approved brand colors, or use unauthorized shades?
5. Clearspace & Placement: Is the logo crowding other elements or placed in an unapproved zone?
6. Image Quality & Resolution: Is the asset pixelated, blurry, or low quality?

Return ONLY a valid JSON array of findings with this exact schema:
[
  {{
    "finding_type": "visual",
    "severity": "critical" | "high" | "medium" | "low",
    "title": "Short title describing visual violation",
    "description": "What was detected visually",
    "detected_text": "[Visual element description]",
    "explanation": "Why this violates brand visual guidelines",
    "asset_ref": "ASSET-XXX or LOGO-V3",
    "confidence": 0.0 to 1.0,
    "suggestion": {{
      "original_text": "Current visual element",
      "suggested_text": "Use approved asset LOGO-PRIMARY-V3 with required clearspace",
      "reasoning": "Brand visual compliance"
    }}
  }}
]

If NO visual violations are detected, return `[]`.
"""

VISUAL_VIDEO_AGENT_SYSTEM_PROMPT = """You are the Multimodal Video & Visual Governance Agent for BrandOS, an enterprise content governance platform.
Your job is to inspect video commercials, social motion graphics, and video presentations against APPROVED BRAND ASSETS for {brand_name}.

ACTIVE WORKSPACE BRAND:
Brand Name: {brand_name}
Brand Domain: {brand_domain}

APPROVED BRAND ASSETS:
{assets_context}

Evaluate the entire video (both visual scenes and spoken audio) thoroughly for:
1. Video Brand Identity & Logo Presence:
   - Does the video clearly feature official {brand_name} branding and approved logo marks (e.g. LOGO-PRIMARY-V3)?
   - If the video contains unrelated third-party content, external product demos, or memes with no brand identity, flag a critical violation.
2. Scene-Level Logo Integrity & Clearspace:
   - Is the logo distorted, squished, stretched, or placed without minimum required 24px clearspace?
   - Is an outdated logo version used (e.g. V1 instead of V3)?
3. Brand Color Palette in Motion:
   - Do title cards, lower-thirds, and backgrounds adhere to approved brand colors (#4F46E5, #0F172A)?
4. Spoken Dialogue & Audio Governance:
   - Does spoken dialogue in the audio track make unauthorized or extreme superlative claims (e.g. '100% unbreakable', 'miracle cure', '#1 guaranteed')?
   - Does the speaker mispronounce the brand name or violate confidential internal naming?

Return ONLY a valid JSON array of findings with this exact schema:
[
  {{
    "finding_type": "visual",
    "severity": "critical" | "high" | "medium" | "low",
    "title": "Short title describing video violation (e.g. 'Video Scene 00:02 - Missing Logo Clearspace' or 'Audio Track - Superlative Claim')",
    "description": "What was detected in the video frames or audio track",
    "detected_text": "[Timestamp / Scene / Spoken quote]",
    "explanation": "Why this violates brand guidelines",
    "asset_ref": "LOGO-PRIMARY-V3",
    "confidence": 0.0 to 1.0,
    "suggestion": {{
      "original_text": "Detected video element or spoken line",
      "suggested_text": "Compliant alternative or correction",
      "reasoning": "Brand governance compliance"
    }}
  }}
]

If NO violations are detected, return `[]`.
"""


class VisualAgent:
    """Evaluates images, documents, and logos against approved brand visual assets."""

    def __init__(self) -> None:
        self.router = get_model_router()

    async def evaluate(
        self,
        image_bytes: bytes | None,
        mime_type: str = "image/png",
        approved_assets: List[Dict[str, Any]] | None = None,
        brand_name: str = "Aureon Technologies",
        brand_domain: str = "Enterprise security and fraud detection intelligence",
    ) -> List[Dict[str, Any]]:
        if not image_bytes:
            return []

        approved_assets = approved_assets or []
        assets_text = "\n".join([
            f"- [{a.get('asset_id', 'ASSET')}] {a.get('name', '')} (Type: {a.get('type')}, Version: {a.get('version')}, Status: {a.get('status')})"
            for a in approved_assets
        ]) if approved_assets else "Primary Logo: LOGO-PRIMARY-V3 (Approved version 3.0). Brand Colors: Indigo (#4F46E5), Slate (#0F172A)."

        is_video = mime_type.startswith("video/")
        prompt_template = VISUAL_VIDEO_AGENT_SYSTEM_PROMPT if is_video else VISUAL_AGENT_SYSTEM_PROMPT
        prompt = prompt_template.format(
            assets_context=assets_text,
            brand_name=brand_name,
            brand_domain=brand_domain,
        )

        try:
            if is_video:
                response = await self.router.analyze_video(
                    video_bytes=image_bytes,
                    prompt=prompt,
                    mime_type=mime_type,
                )
            else:
                response = await self.router.gemini_vision(
                    prompt=prompt,
                    image_bytes=image_bytes,
                    mime_type=mime_type,
                )

            content_str = response.strip()
            if content_str.startswith("```json"):
                content_str = content_str[7:]
            if content_str.startswith("```"):
                content_str = content_str[3:]
            if content_str.endswith("```"):
                content_str = content_str[:-3]

            raw_findings = json.loads(content_str.strip())
            findings = []
            if isinstance(raw_findings, list):
                for item in raw_findings:
                    asset_ref = item.get("asset_ref", "ASSET-PRIMARY")
                    findings.append({
                        "finding_type": "visual",
                        "severity": item.get("severity", "medium").lower(),
                        "title": item.get("title", "Visual Brand Violation"),
                        "description": item.get("description", ""),
                        "detected_text": item.get("detected_text", "[Visual Element]"),
                        "explanation": item.get("explanation", ""),
                        "confidence": float(item.get("confidence", 0.9)),
                        "evidence": [{
                            "evidence_type": "asset",
                            "source_ref": asset_ref,
                            "description": item.get("explanation", "Violates approved visual guidelines."),
                            "data": {"asset_ref": asset_ref}
                        }],
                        "suggestion": item.get("suggestion", {
                            "original_text": "[Current visual]",
                            "suggested_text": f"Replace with approved {asset_ref}",
                            "reasoning": "Compliance with visual guidelines"
                        })
                    })
            return findings

        except Exception as e:
            logger.error(f"VisualAgent evaluation error: {e}", exc_info=True)
            return []
