from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field


class ContentCreate(BaseModel):
    title: str = Field(..., max_length=512)
    content_type: str = Field(
        ..., pattern=r"^(text|pdf|docx|image|html)$"
    )
    channel: str = Field(
        "general",
        pattern=r"^(website|social|email|print|press_release|internal|general)$",
    )
    body_text: Optional[str] = None


class ContentVersionRead(BaseModel):
    id: uuid.UUID
    content_id: uuid.UUID
    version_number: int
    body_text: Optional[str]
    extracted_claims: Optional[str]
    extracted_entities: Optional[str]
    extracted_numbers: Optional[str]
    tone_analysis: Optional[str]
    image_urls: Optional[str]
    file_url: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ContentRead(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    title: str
    content_type: str
    channel: str
    original_file_url: Optional[str]
    created_by: Optional[uuid.UUID]
    created_at: datetime
    updated_at: datetime
    versions: List[ContentVersionRead] = []

    model_config = {"from_attributes": True}
