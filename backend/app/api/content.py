"""
Content Submission & Versioning API.
PRD FR-08, FR-21, FR-22: Content Submission, Versioning, and Diff Tracking.
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
from app.models.content import Content, ContentVersion
from app.models.organization import Organization
from app.models.review import Review
from app.models.user import User
from app.middleware.auth import get_optional_user
from app.ingestion.pdf_parser import extract_text_from_pdf
from app.ingestion.docx_parser import extract_text_from_docx
from app.services.audit_service import AuditService

router = APIRouter(prefix="/content", tags=["content"])
settings = get_settings()


class ContentCreateText(BaseModel):
    title: str
    content_type: str = "social_post"
    channel: str = "general"
    raw_text: str
    organization_slug: Optional[str] = None
    organization_id: Optional[str] = None


class ContentResponse(BaseModel):
    id: str
    title: str
    content_type: str
    channel: str
    current_version: int
    created_at: str
    review_id: Optional[str] = None
    review_status: Optional[str] = None
    review_decision: Optional[str] = None
    review_score: Optional[float] = None
    raw_snippet: Optional[str] = None


class ContentVersionResponse(BaseModel):
    id: str
    content_id: str
    version_number: int
    raw_text: Optional[str] = None
    file_url: Optional[str] = None
    created_at: str


@router.get("", response_model=List[ContentResponse])
async def list_content(
    brand: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    query = select(Content).order_by(Content.created_at.desc())
    target_org_id = None
    if brand:
        org_res = await db.execute(select(Organization).where(Organization.slug == brand))
        target_org = org_res.scalar_one_or_none()
        if target_org:
            target_org_id = target_org.id
    elif user and user.organization_id and user.role != "superadmin":
        target_org_id = user.organization_id

    if target_org_id:
        query = query.where(Content.organization_id == target_org_id)
        if user and user.role == "creator":
            query = query.where(Content.created_by == user.id)

    result = await db.execute(query)
    items = result.scalars().all()
    if not items:
        return []

    content_ids = [c.id for c in items]

    # Batch query reviews and versions for these content items
    rev_res = await db.execute(
        select(Review)
        .where(Review.content_id.in_(content_ids))
        .order_by(Review.created_at.desc())
    )
    reviews_by_content: dict[str, Review] = {}
    for r in rev_res.scalars().all():
        cid = str(r.content_id)
        if cid not in reviews_by_content:
            reviews_by_content[cid] = r

    ver_res = await db.execute(
        select(ContentVersion)
        .where(ContentVersion.content_id.in_(content_ids))
        .order_by(ContentVersion.version_number.desc())
    )
    versions_by_content: dict[str, ContentVersion] = {}
    for v in ver_res.scalars().all():
        cid = str(v.content_id)
        if cid not in versions_by_content:
            versions_by_content[cid] = v

    res = []
    for c in items:
        cid = str(c.id)
        r = reviews_by_content.get(cid)
        v = versions_by_content.get(cid)

        # Inferred channel if set to default instagram
        inferred_channel = c.channel or "Instagram"
        t_lower = (c.title or "").lower()
        if "internal memo" in t_lower or "memo" in t_lower:
            inferred_channel = "Internal Memo"
        elif "linkedin" in t_lower:
            inferred_channel = "LinkedIn"
        elif "press release" in t_lower or "release" in t_lower:
            inferred_channel = "Press Release"
        elif "bank" in t_lower or "financial" in t_lower or "audit" in t_lower:
            inferred_channel = "Financial Audit"
        elif "image" in c.content_type.lower():
            inferred_channel = "Brand Assets"
        elif inferred_channel:
            inferred_channel = inferred_channel.title()

        snippet = None
        if v and v.raw_text:
            snippet = v.raw_text[:140] + ("..." if len(v.raw_text) > 140 else "")

        res.append(
            ContentResponse(
                id=cid,
                title=c.title,
                content_type=c.content_type,
                channel=inferred_channel,
                current_version=c.current_version,
                created_at=c.created_at.isoformat() if c.created_at else "",
                review_id=str(r.id) if r else None,
                review_status=r.status if r else "pending",
                review_decision=r.decision if r else None,
                review_score=float(r.overall_score) if (r and r.overall_score is not None) else None,
                raw_snippet=snippet,
            )
        )
    return res


@router.get("/{id}")
async def get_content(
    id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Content).where(Content.id == uuid.UUID(id)))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Content not found")

    # Get versions
    v_res = await db.execute(
        select(ContentVersion).where(ContentVersion.content_id == c.id).order_by(ContentVersion.version_number.desc())
    )
    versions = v_res.scalars().all()

    return {
        "id": str(c.id),
        "title": c.title,
        "content_type": c.content_type,
        "channel": c.channel,
        "current_version": c.current_version,
        "versions": [
            {
                "id": str(v.id),
                "version_number": v.version_number,
                "raw_text": v.raw_text,
                "file_url": v.file_url,
                "created_at": v.created_at.isoformat() if v.created_at else "",
            }
            for v in versions
        ],
    }


@router.post("/text", response_model=ContentResponse)
async def create_text_content(
    body: ContentCreateText,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    target_org = None
    if body.organization_slug:
        res = await db.execute(select(Organization).where(Organization.slug == body.organization_slug))
        target_org = res.scalar_one_or_none()
    elif body.organization_id:
        try:
            res = await db.execute(select(Organization).where(Organization.id == uuid.UUID(body.organization_id)))
            target_org = res.scalar_one_or_none()
        except ValueError:
            pass

    if not target_org:
        org_res = await db.execute(select(Organization).limit(1))
        target_org = org_res.scalar_one_or_none()

    if not target_org:
        target_org = Organization(name="Default Workspace", slug="default-workspace")
        db.add(target_org)
        await db.flush()

    org_id = target_org.id if target_org else (user.organization_id if user else None)

    content = Content(
        organization_id=org_id,
        title=body.title,
        content_type=body.content_type,
        channel=body.channel,
        created_by=user.id if user else None,
    )
    db.add(content)
    await db.flush()

    version = ContentVersion(
        content_id=content.id,
        version_number=1,
        body_text=body.raw_text,
    )
    db.add(version)
    await db.commit()
    await db.refresh(content)

    return ContentResponse(
        id=str(content.id),
        title=content.title,
        content_type=content.content_type,
        channel=content.channel,
        current_version=content.current_version,
        created_at=content.created_at.isoformat() if content.created_at else "",
    )


@router.post("/upload")
async def upload_content_file(
    file: UploadFile = File(...),
    title: str = Form(...),
    content_type: str = Form("document"),
    channel: str = Form("general"),
    organization_slug: Optional[str] = Form(None),
    organization_id: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    """
    Upload and parse multiple file formats:
    - PDF (.pdf)
    - Microsoft Word (.docx, .doc)
    - Images (.png, .jpg, .jpeg, .webp) -> Visual checks + OCR text extraction
    - Plain text & Markdown (.txt, .md, .csv)
    """
    os.makedirs(settings.upload_dir, exist_ok=True)
    clean_filename = file.filename.replace(" ", "_") if file.filename else "file"
    filename = f"{uuid.uuid4().hex}_{clean_filename}"
    file_path = os.path.join(settings.upload_dir, filename)

    content_bytes = await file.read()
    with open(file_path, "wb") as f:
        f.write(content_bytes)

    extracted_text = ""
    lower_fn = file.filename.lower() if file.filename else ""
    detected_content_type = content_type

    # 1. PDF Documents
    if lower_fn.endswith(".pdf"):
        extracted_text = extract_text_from_pdf(content_bytes)
        detected_content_type = "document"

    # 2. Microsoft Word Documents
    elif lower_fn.endswith((".docx", ".doc")):
        extracted_text = extract_text_from_docx(content_bytes)
        detected_content_type = "document"

    # 3. Plain Text / Markdown
    elif lower_fn.endswith((".txt", ".md", ".csv", ".json")):
        try:
            extracted_text = content_bytes.decode("utf-8")
        except Exception:
            extracted_text = content_bytes.decode("latin-1", errors="ignore")
        detected_content_type = "article"

    # 4. Images (Posters, Ad Creatives, Logos, Screenshots)
    elif lower_fn.endswith((".png", ".jpg", ".jpeg", ".webp", ".bmp")):
        detected_content_type = "image"
        # OCR / Transcribe visible text on the image using Gemini Vision so copy is also governed
        try:
            from app.services.model_router import get_model_router
            router = get_model_router()
            mime = "image/jpeg" if lower_fn.endswith((".jpg", ".jpeg")) else "image/png"
            ocr_prompt = "Transcribe all visible written text, slogans, headlines, metrics, and disclaimer copy from this image verbatim. If no text exists, return NONE."
            ocr_result = await router.gemini_vision(prompt=ocr_prompt, image_bytes=content_bytes, mime_type=mime)
            if ocr_result and "NONE" not in ocr_result.upper():
                extracted_text = ocr_result.strip()
        except Exception as e:
            # Fallback gracefully if OCR vision call fails
            extracted_text = f"[Image creative uploaded: {file.filename}]"

    target_org = None
    if organization_slug:
        res = await db.execute(select(Organization).where(Organization.slug == organization_slug))
        target_org = res.scalar_one_or_none()
    elif organization_id:
        try:
            res = await db.execute(select(Organization).where(Organization.id == uuid.UUID(organization_id)))
            target_org = res.scalar_one_or_none()
        except ValueError:
            pass

    if not target_org:
        org_res = await db.execute(select(Organization).limit(1))
        target_org = org_res.scalar_one_or_none()

    if not target_org:
        target_org = Organization(name="Default Workspace", slug="default-workspace")
        db.add(target_org)
        await db.flush()

    org_id = target_org.id if target_org else (user.organization_id if user else None)

    content = Content(
        organization_id=org_id,
        title=title,
        content_type=detected_content_type,
        channel=channel,
        original_file_url=f"/uploads/{filename}",
        created_by=user.id if user else None,
    )
    db.add(content)
    await db.flush()

    version = ContentVersion(
        content_id=content.id,
        version_number=1,
        body_text=extracted_text or None,
        file_url=f"/uploads/{filename}",
    )
    db.add(version)
    await db.commit()
    await db.refresh(content)

    return {
        "id": str(content.id),
        "title": content.title,
        "content_type": detected_content_type,
        "version_id": str(version.id),
        "file_url": f"/uploads/{filename}",
        "extracted_text_preview": extracted_text[:300] if extracted_text else "",
    }


@router.delete("/{id}")
async def delete_content(
    id: str,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    if user and user.role not in ("admin", "superadmin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator authority required to delete organizational content.",
        )
    content_uuid = uuid.UUID(id)
    res = await db.execute(select(Content).where(Content.id == content_uuid))
    c = res.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Content not found")

    if user:
        await AuditService.log_action(
            db=db,
            user_id=user.id,
            action="content_deleted",
            entity_type="content",
            entity_id=c.id,
            details={"title": c.title, "channel": c.channel},
        )

    await db.delete(c)
    await db.commit()
    return {"status": "success", "message": f"Content '{c.title}' and associated reviews deleted successfully"}
