"""
Brand Assets Management API.
PRD FR-07: Asset Management & Versioning.
"""

from __future__ import annotations

import os
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models.asset import Asset
from app.models.organization import Organization
from app.models.user import User
from app.middleware.auth import get_optional_user

router = APIRouter(prefix="/assets", tags=["assets"])
settings = get_settings()


class AssetResponse(BaseModel):
    id: str
    name: str
    asset_type: str
    file_url: str
    mime_type: Optional[str] = None
    version: int
    is_active: bool


@router.get("", response_model=List[AssetResponse])
async def list_assets(
    asset_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    query = select(Asset).where(Asset.is_active == True)
    if asset_type:
        query = query.where(Asset.asset_type == asset_type)
    result = await db.execute(query)
    assets = result.scalars().all()

    return [
        AssetResponse(
            id=str(a.id),
            name=a.name,
            asset_type=a.asset_type,
            file_url=a.file_url,
            mime_type=a.mime_type,
            version=a.version,
            is_active=a.is_active,
        )
        for a in assets
    ]


@router.post("", response_model=AssetResponse)
async def upload_asset(
    name: str = Form(...),
    asset_type: str = Form("logo"),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    # Ensure upload directory exists
    os.makedirs(settings.upload_dir, exist_ok=True)
    filename = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(settings.upload_dir, filename)

    content_bytes = await file.read()
    with open(file_path, "wb") as f:
        f.write(content_bytes)

    org_res = await db.execute(select(Organization).limit(1))
    org = org_res.scalar_one_or_none()
    if not org:
        org = Organization(name="Default Workspace", slug="default-workspace")
        db.add(org)
        await db.flush()

    asset = Asset(
        organization_id=user.organization_id if user and user.organization_id else org.id,
        name=name,
        asset_type=asset_type,
        file_url=f"/uploads/{filename}",
        mime_type=file.content_type,
        version=1,
    )
    db.add(asset)
    await db.commit()
    await db.refresh(asset)

    return AssetResponse(
        id=str(asset.id),
        name=asset.name,
        asset_type=asset.asset_type,
        file_url=asset.file_url,
        mime_type=asset.mime_type,
        version=asset.version,
        is_active=asset.is_active,
    )
