from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import String, Text, Float, Integer, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Review(Base):
    """A governance review of a content version — state machine."""

    __tablename__ = "reviews"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    content_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("contents.id", ondelete="CASCADE"),
        nullable=False,
    )
    content_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("content_versions.id", ondelete="CASCADE"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="pending",
        comment="pending | analyzing | completed | approved | rejected",
    )
    governance_score: Mapped[float | None] = mapped_column(
        Float, nullable=True,
        comment="0.0-100.0 overall governance score",
    )
    decision: Mapped[str | None] = mapped_column(
        String(50), nullable=True,
        comment="PASS | WARNINGS | REVIEW_REQUIRED | BLOCKED",
    )
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    total_findings: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    error_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    warning_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    info_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    reviewer_comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    findings: Mapped[list["Finding"]] = relationship(  # noqa: F821
        back_populates="review", lazy="selectin", cascade="all, delete-orphan"
    )

    VALID_TRANSITIONS: dict[str, list[str]] = {
        "pending": ["analyzing"],
        "analyzing": ["completed"],
        "completed": ["approved", "rejected"],
        "approved": [],
        "rejected": ["pending"],
    }

    @property
    def overall_score(self) -> float | None:
        return self.governance_score

    @overall_score.setter
    def overall_score(self, value: float | None) -> None:
        self.governance_score = value

    def can_transition_to(self, new_status: str) -> bool:
        return new_status in self.VALID_TRANSITIONS.get(self.status, [])

    def __repr__(self) -> str:
        return f"<Review {self.id} status={self.status}>"
