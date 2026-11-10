"""
DOCX Parser — Extracts text from Microsoft Word documents.
"""

from __future__ import annotations

import io
import logging

logger = logging.getLogger(__name__)


def extract_text_from_docx(docx_bytes: bytes) -> str:
    """Extract paragraphs and table text from DOCX file bytes."""
    try:
        from docx import Document
        doc = Document(io.BytesIO(docx_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text]
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                if row_text:
                    paragraphs.append(row_text)
        return "\n\n".join(paragraphs)
    except Exception as e:
        logger.error(f"DOCX extraction error: {e}")
        return ""
