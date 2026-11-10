from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class AssetCreate(BaseModel):
    name: str = Field(..., max_length=255)
    asset_type: str = Field(
        ...,
        pattern=r"^(logo|colour_palette|font|image|icon|template)$",
    )
    metadata_json: Optional[str] = None


class AssetUpdate(BaseModel):
    name: Optional[str] = None
    asset_type: Optional[str] = None
    metadata_json: Optional[str] = None
    is_approved: Optional[bool] = None
    is_active: Optional[bool] = None


class AssetRead(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    name: str
    asset_type: str
    file_url: Optional[str]
    file_hash: Optional[str]
    metadata_json: Optional[str]
    version: int
    is_approved: bool
    is_active: bool
    uploaded_by: Optional[uuid.UUID]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
