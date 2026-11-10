"""
PDF Parser — Extracts text, metadata, and tables from PDF documents.
"""

from __future__ import annotations

import io
import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract all text content from raw PDF bytes."""
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            pages_text = []
            for i, page in enumerate(pdf.pages):
                text = page.extract_text()
                if text:
                    pages_text.append(text)
            return "\n\n".join(pages_text)
    except Exception as e:
        logger.warning(f"pdfplumber extraction failed: {e}. Trying pypdf/fallback.")
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
            return "\n\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as e2:
            logger.error(f"PDF extraction error: {e2}")
            return ""
