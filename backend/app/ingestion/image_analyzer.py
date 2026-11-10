"""
Image Analyzer — Extracts visual metadata, dominant colors, and image properties using Pillow.
"""

from __future__ import annotations

import io
import logging
from typing import Any, Dict, List, Tuple
from PIL import Image

logger = logging.getLogger(__name__)


def analyze_image_bytes(image_bytes: bytes) -> Dict[str, Any]:
    """Extract resolution, aspect ratio, dominant colors, and preliminary accessibility metrics."""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        width, height = img.size
        format_name = img.format or "UNKNOWN"

        # Convert to RGB for color extraction
        rgb_img = img.convert("RGB")
        # Resize thumbnail for fast palette calculation
        small = rgb_img.resize((50, 50))
        colors = small.getcolors(maxcolors=2500)
        dominant_colors = []
        if colors:
            sorted_colors = sorted(colors, key=lambda x: x[0], reverse=True)
            for count, (r, g, b) in sorted_colors[:5]:
                hex_code = f"#{r:02x}{g:02x}{b:02x}"
                dominant_colors.append({"hex": hex_code, "rgb": [r, g, b], "count": count})

        # Preliminary contrast between top 2 colors
        contrast_ratio = None
        if len(dominant_colors) >= 2:
            from app.agents.accessibility_agent import AccessibilityAgent
            c1 = tuple(dominant_colors[0]["rgb"])
            c2 = tuple(dominant_colors[1]["rgb"])
            contrast_ratio = AccessibilityAgent.calculate_contrast_ratio(c1, c2)

        return {
            "width": width,
            "height": height,
            "aspect_ratio": round(width / max(height, 1), 2),
            "format": format_name,
            "dominant_colors": dominant_colors,
            "contrast_ratio": round(contrast_ratio, 2) if contrast_ratio else None,
            "has_image": True,
        }
    except Exception as e:
        logger.error(f"Image analysis error: {e}")
        return {"has_image": False, "error": str(e)}
