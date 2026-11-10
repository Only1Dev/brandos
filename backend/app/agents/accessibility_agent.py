"""
Accessibility Agent — Deterministic evaluation of text and assets for accessibility.
PRD FR-13: Contrast ratios, text readability, content complexity, alt-text presence.
Uses mathematical formulas and deterministic algorithms instead of LLMs.
"""

from __future__ import annotations

import math
import re
from typing import Any, Dict, List, Tuple


class AccessibilityAgent:
    """Evaluates content accessibility deterministically."""

    @staticmethod
    def calculate_relative_luminance(r: int, g: int, b: int) -> float:
        """Calculate relative luminance according to WCAG 2.1 specs."""
        def channel_lum(val: int) -> float:
            c = val / 255.0
            return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

        return 0.2126 * channel_lum(r) + 0.7152 * channel_lum(g) + 0.0722 * channel_lum(b)

    @classmethod
    def calculate_contrast_ratio(
        cls,
        rgb1: Tuple[int, int, int],
        rgb2: Tuple[int, int, int],
    ) -> float:
        """Calculate WCAG contrast ratio between two RGB colors (1.0 to 21.0)."""
        lum1 = cls.calculate_relative_luminance(*rgb1)
        lum2 = cls.calculate_relative_luminance(*rgb2)
        lighter = max(lum1, lum2)
        darker = min(lum1, lum2)
        return (lighter + 0.05) / (darker + 0.05)

    @staticmethod
    def calculate_readability(text: str) -> Dict[str, Any]:
        """
        Calculate Flesch Reading Ease and Flesch-Kincaid Grade Level.
        Formula:
        Flesch = 206.835 - 1.015*(words/sentences) - 84.6*(syllables/words)
        """
        sentences = [s.strip() for s in re.split(r"[.!?]+", text) if s.strip()]
        words = re.findall(r"\b[A-Za-z0-9'-]+\b", text)

        num_sentences = max(len(sentences), 1)
        num_words = max(len(words), 1)

        def count_syllables(word: str) -> int:
            word = word.lower()
            if len(word) <= 3:
                return 1
            word = re.sub(r"(?:[^laeiouy]|ed|es|e)$", "", word)
            word = re.sub(r"^y", "", word)
            syllables = len(re.findall(r"[aeiouy]{1,2}", word))
            return max(syllables, 1)

        total_syllables = sum(count_syllables(w) for w in words)

        words_per_sentence = num_words / num_sentences
        syllables_per_word = total_syllables / num_words

        flesch_reading_ease = 206.835 - (1.015 * words_per_sentence) - (84.6 * syllables_per_word)
        grade_level = (0.39 * words_per_sentence) + (11.8 * syllables_per_word) - 15.59

        return {
            "flesch_reading_ease": round(flesch_reading_ease, 2),
            "grade_level": round(max(0, grade_level), 1),
            "num_words": num_words,
            "num_sentences": num_sentences,
            "avg_words_per_sentence": round(words_per_sentence, 1),
        }

    def evaluate(
        self,
        text: str,
        channel: str = "general",
        visual_metadata: Dict[str, Any] | None = None,
    ) -> List[Dict[str, Any]]:
        """Run all accessibility checks."""
        findings = []

        # 1. Readability Check
        if text and len(text.split()) >= 10:
            metrics = self.calculate_readability(text)
            reading_ease = metrics["flesch_reading_ease"]

            # If text is extremely complex for general audience (< 40 is difficult/college level)
            if reading_ease < 35.0:
                findings.append({
                    "finding_type": "accessibility",
                    "severity": "medium",
                    "title": "High Content Complexity (Low Readability)",
                    "description": f"Content readability score is {reading_ease}/100 (Grade level: {metrics['grade_level']}).",
                    "detected_text": text[:120] + "...",
                    "explanation": f"Average sentence length is {metrics['avg_words_per_sentence']} words. Complex text reduces comprehension and accessibility across broader audiences.",
                    "confidence": 0.95,
                    "evidence": [{
                        "evidence_type": "rule",
                        "source_ref": "A11Y-READ-01",
                        "description": "WCAG Guideline 3.1: Make text content readable and understandable.",
                        "data": metrics,
                    }],
                    "suggestion": {
                        "original_text": text[:120] + "...",
                        "suggested_text": "Consider breaking long compound sentences into shorter, direct statements.",
                        "reasoning": "Simplifying sentence structure improves readability and cognitive accessibility."
                    }
                })

        # 2. Visual / Color Contrast Check (if visual metadata provided)
        if visual_metadata:
            contrast_ratio = visual_metadata.get("contrast_ratio")
            if contrast_ratio is not None and contrast_ratio < 4.5:
                findings.append({
                    "finding_type": "accessibility",
                    "severity": "high",
                    "title": f"Insufficient Color Contrast: {contrast_ratio:.2f}:1",
                    "description": f"Contrast ratio of {contrast_ratio:.2f}:1 falls below WCAG AA minimum requirement of 4.5:1 for normal text.",
                    "detected_text": f"Foreground/Background contrast ratio: {contrast_ratio:.2f}:1",
                    "explanation": "Low contrast makes text difficult or impossible to read for users with visual impairments or on low-brightness displays.",
                    "confidence": 1.0,
                    "evidence": [{
                        "evidence_type": "rule",
                        "source_ref": "WCAG-1.4.3",
                        "description": "WCAG 2.1 Success Criterion 1.4.3 Contrast (Minimum): 4.5:1 for normal text, 3:1 for large text.",
                        "data": {"contrast_ratio": contrast_ratio, "threshold": 4.5}
                    }],
                    "suggestion": {
                        "original_text": "Current color combination",
                        "suggested_text": "Increase luminance difference between text and background to achieve at least 4.5:1 contrast.",
                        "reasoning": "Ensures WCAG AA compliance."
                    }
                })

            # Missing Alt-Text
            if visual_metadata.get("has_image") and not visual_metadata.get("alt_text"):
                findings.append({
                    "finding_type": "accessibility",
                    "severity": "medium",
                    "title": "Missing Descriptive Alt Text for Visual Asset",
                    "description": "An image or visual element is present without accompanying alternative text.",
                    "detected_text": "[Visual Asset without alt text]",
                    "explanation": "Screen reader users cannot perceive images without descriptive alt text.",
                    "confidence": 1.0,
                    "evidence": [{
                        "evidence_type": "rule",
                        "source_ref": "WCAG-1.1.1",
                        "description": "WCAG 2.1 Success Criterion 1.1.1 Non-text Content: Provide text alternatives.",
                        "data": {}
                    }],
                    "suggestion": {
                        "original_text": "",
                        "suggested_text": "Add concise, descriptive alt text explaining the image content and purpose.",
                        "reasoning": "Required for screen-reader accessibility."
                    }
                })

        return findings
