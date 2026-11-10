"""
Content parser: extracts text, claims, numbers, entities, tone from content.
Uses pdfplumber for PDF, python-docx for DOCX, Pillow for images.
"""

from __future__ import annotations

import io
import json
import re
from dataclasses import dataclass, field
from typing import List, Optional

from app.services.model_router import ModelRouter


@dataclass
class ParsedContent:
    body_text: str = ""
    claims: List[str] = field(default_factory=list)
    numbers: List[dict] = field(default_factory=list)
    entities: List[str] = field(default_factory=list)
    tone: dict = field(default_factory=dict)
    image_urls: List[str] = field(default_factory=list)


# Regex patterns for number extraction
_NUMBER_PATTERN = re.compile(
    r"(?<!\w)"
    r"(\$?\d{1,3}(?:,\d{3})*(?:\.\d+)?)"
    r"\s*"
    r"(%|percent|million|billion|trillion|thousand|kg|lb|mg|ml|km|mi|mph|"
    r"kph|hours?|minutes?|seconds?|days?|weeks?|months?|years?|"
    r"users?|customers?|employees?|GB|MB|TB)?"
    r"(?!\w)",
    re.IGNORECASE,
)


def extract_text_from_pdf(file_bytes: bytes) -> str:
    text_parts: List[str] = []
    # Try pdfplumber first
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
                try:
                    tables = page.extract_tables()
                    for table in tables:
                        for row in table:
                            cells = [str(c) if c else "" for c in row]
                            text_parts.append(" | ".join(cells))
                except Exception:
                    pass
    except Exception:
        pass

    # If pdfplumber didn't find text or threw, fallback to pypdf
    if not text_parts:
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            for page in reader.pages:
                t = page.extract_text()
                if t:
                    text_parts.append(t)
        except Exception:
            pass

    return "\n\n".join(text_parts)


def extract_text_from_docx(file_bytes: bytes) -> str:
    from docx import Document

    doc = Document(io.BytesIO(file_bytes))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    # Also extract from tables
    for table in doc.tables:
        for row in table.rows:
            cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
            if cells:
                paragraphs.append(" | ".join(cells))
    return "\n\n".join(paragraphs)


def extract_text_from_image(file_bytes: bytes) -> str:
    """OCR text extraction from image. Falls back to empty if Tesseract isn't installed."""
    try:
        from PIL import Image
        import pytesseract

        img = Image.open(io.BytesIO(file_bytes))
        return pytesseract.image_to_string(img)
    except Exception:
        return ""


def extract_numbers(text: str) -> List[dict]:
    """Extract numerical values with units from text."""
    results = []
    for match in _NUMBER_PATTERN.finditer(text):
        raw_value = match.group(1).replace(",", "").replace("$", "")
        try:
            value = float(raw_value)
        except ValueError:
            continue
        unit = match.group(2) or ""
        results.append({
            "value": value,
            "unit": unit.strip(),
            "raw": match.group(0).strip(),
            "position": match.start(),
        })
    return results


async def extract_claims_with_llm(text: str, model_router: ModelRouter) -> List[str]:
    """Use LLM to extract factual claims from text."""
    if not text.strip():
        return []

    prompt = (
        "Extract all factual claims, statistics, and verifiable statements from the "
        "following text. Return a JSON array of strings, each being one claim. "
        "Only include claims that can be verified as true or false. "
        "Do not include opinions or subjective statements.\n\n"
        f"Text:\n{text[:4000]}\n\n"
        "Response (JSON array only):"
    )

    try:
        response = await model_router.completion(
            prompt=prompt,
            temperature=0.1,
            max_tokens=2000,
        )
        # Try parsing the response as JSON
        content = response.strip()
        # Strip markdown code blocks if present
        if content.startswith("```"):
            content = content.split("\n", 1)[1] if "\n" in content else content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
        claims = json.loads(content)
        if isinstance(claims, list):
            return [str(c) for c in claims]
    except (json.JSONDecodeError, Exception):
        pass
    return []


async def extract_entities_with_llm(text: str, model_router: ModelRouter) -> List[str]:
    """Use LLM to extract named entities."""
    if not text.strip():
        return []

    prompt = (
        "Extract all named entities (people, companies, products, places, dates, "
        "organizations) from the following text. Return a JSON array of strings.\n\n"
        f"Text:\n{text[:4000]}\n\n"
        "Response (JSON array only):"
    )
    try:
        response = await model_router.completion(
            prompt=prompt,
            temperature=0.1,
            max_tokens=1000,
        )
        content = response.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[1] if "\n" in content else content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
        entities = json.loads(content)
        if isinstance(entities, list):
            return [str(e) for e in entities]
    except (json.JSONDecodeError, Exception):
        pass
    return []


async def analyze_tone_with_llm(text: str, model_router: ModelRouter) -> dict:
    """Use LLM to analyze the tone of text."""
    if not text.strip():
        return {}

    prompt = (
        "Analyze the tone of the following text. Return a JSON object with these fields:\n"
        "- formality: float 0-1 (0=casual, 1=formal)\n"
        "- sentiment: float -1 to 1 (negative to positive)\n"
        "- confidence_level: float 0-1\n"
        "- primary_tone: string (e.g. 'professional', 'friendly', 'urgent', 'technical')\n"
        "- secondary_tones: array of strings\n\n"
        f"Text:\n{text[:3000]}\n\n"
        "Response (JSON object only):"
    )
    try:
        response = await model_router.completion(
            prompt=prompt,
            temperature=0.1,
            max_tokens=500,
        )
        content = response.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[1] if "\n" in content else content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
        return json.loads(content)
    except (json.JSONDecodeError, Exception):
        return {}


async def parse_content(
    body_text: str | None = None,
    file_bytes: bytes | None = None,
    file_type: str = "text",
    image_urls: list[str] | None = None,
    model_router: ModelRouter | None = None,
) -> ParsedContent:
    """
    Main entry: parses content from text, PDF, DOCX, or image
    and extracts claims, numbers, entities, tone.
    """
    result = ParsedContent()
    result.image_urls = image_urls or []

    # Step 1: extract raw text
    if file_bytes and file_type == "pdf":
        result.body_text = extract_text_from_pdf(file_bytes)
    elif file_bytes and file_type == "docx":
        result.body_text = extract_text_from_docx(file_bytes)
    elif file_bytes and file_type == "image":
        result.body_text = extract_text_from_image(file_bytes)
    elif body_text:
        result.body_text = body_text
    else:
        return result

    # Step 2: deterministic number extraction
    result.numbers = extract_numbers(result.body_text)

    # Step 3: LLM-powered extraction (if router available)
    if model_router and result.body_text.strip():
        result.claims = await extract_claims_with_llm(result.body_text, model_router)
        result.entities = await extract_entities_with_llm(result.body_text, model_router)
        result.tone = await analyze_tone_with_llm(result.body_text, model_router)

    return result
