from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Content(Base):
    """A piece of content submitted for governance review."""

    __tablename__ = "contents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    content_type: Mapped[str] = mapped_column(
        String(50), nullable=False,
        comment="text | pdf | docx | image | html",
    )
    channel: Mapped[str] = mapped_column(
        String(100), nullable=False, default="general",
        comment="website | social | email | print | press_release | internal",
    )
    original_file_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    organization: Mapped["Organization"] = relationship(back_populates="contents")  # noqa: F821
    versions: Mapped[list["ContentVersion"]] = relationship(
        back_populates="content", lazy="selectin", cascade="all, delete-orphan"
    )

    @property
    def latest_version(self) -> "ContentVersion | None":
        if not self.versions:
            return None
        return max(self.versions, key=lambda v: v.version_number)

    @property
    def current_version(self) -> int:
        if not self.versions:
            return 1
        return max(v.version_number for v in self.versions)

    @current_version.setter
    def current_version(self, value: int) -> None:
        pass

    def __repr__(self) -> str:
        return f"<Content {self.title}>"


class ContentVersion(Base):
    __tablename__ = "content_versions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    content_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("contents.id", ondelete="CASCADE"),
        nullable=False,
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    body_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    extracted_claims: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="JSON array of extracted claims"
    )
    extracted_entities: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="JSON array of extracted entities"
    )
    extracted_numbers: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="JSON array of extracted numbers"
    )
    tone_analysis: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="JSON with tone analysis results"
    )
    image_urls: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="JSON array of image URLs"
    )
    file_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    content: Mapped["Content"] = relationship(back_populates="versions")

    @property
    def raw_text(self) -> str | None:
        return self.body_text

    @raw_text.setter
    def raw_text(self, value: str | None) -> None:
        self.body_text = value

    @property
    def mime_type(self) -> str | None:
        if self.file_url:
            lower = self.file_url.lower()
            if lower.endswith(".png"):
                return "image/png"
            if lower.endswith((".jpg", ".jpeg")):
                return "image/jpeg"
            if lower.endswith(".pdf"):
                return "application/pdf"
            if lower.endswith((".docx", ".doc")):
                return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        return "text/plain"

    def __repr__(self) -> str:
        return f"<ContentVersion {self.content_id} v{self.version_number}>"
