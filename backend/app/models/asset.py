from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Asset(Base):
    """Brand asset (logo, colour palette, font, image) with versioning."""

    __tablename__ = "assets"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    asset_type: Mapped[str] = mapped_column(
        String(50), nullable=False,
        comment="logo | colour_palette | font | image | icon | template",
    )
    file_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    file_hash: Mapped[str | None] = mapped_column(
        String(128), nullable=True, comment="SHA-256 of uploaded file"
    )
    metadata_json: Mapped[str | None] = mapped_column(
        Text, nullable=True,
        comment="JSON with type-specific metadata (e.g. hex colours, font names)",
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    is_approved: Mapped[bool] = mapped_column(default=True)
    is_active: Mapped[bool] = mapped_column(default=True)
    uploaded_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    organization: Mapped["Organization"] = relationship(back_populates="assets")  # noqa: F821

    @property
    def mime_type(self) -> str | None:
        if self.file_url:
            if self.file_url.endswith(".png"):
                return "image/png"
            if self.file_url.endswith((".jpg", ".jpeg")):
                return "image/jpeg"
            if self.file_url.endswith(".svg"):
                return "image/svg+xml"
        return None

    def __repr__(self) -> str:
        return f"<Asset {self.name} v{self.version}>"
