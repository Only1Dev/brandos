from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import String, Text, Float, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Claim(Base):
    """A claim extracted from content, tracked through its lifecycle."""

    __tablename__ = "claims"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    content_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("contents.id", ondelete="SET NULL"),
        nullable=True,
    )
    claim_text: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(
        String(100), nullable=False, default="general",
        comment="statistical | product_feature | legal | scientific | testimonial",
    )
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="extracted",
        comment="extracted | under_review | verified | disputed | rejected",
    )
    numerical_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    numerical_unit: Mapped[str | None] = mapped_column(String(64), nullable=True)
    matched_fact_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("facts.id", ondelete="SET NULL"),
        nullable=True,
    )
    confidence: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0,
        comment="0.0-1.0 confidence in the claim's accuracy",
    )
    source_location: Mapped[str | None] = mapped_column(
        Text, nullable=True,
        comment="Where in the content the claim appears (page, paragraph, etc.)",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    VALID_TRANSITIONS: dict[str, list[str]] = {
        "extracted": ["under_review", "verified", "rejected"],
        "under_review": ["verified", "disputed", "rejected"],
        "verified": ["disputed"],
        "disputed": ["under_review", "verified", "rejected"],
        "rejected": ["under_review"],
    }

    @property
    def statement(self) -> str:
        return self.claim_text

    @statement.setter
    def statement(self, value: str) -> None:
        self.claim_text = value

    @property
    def valid_from(self) -> datetime | None:
        return self.created_at

    @valid_from.setter
    def valid_from(self, value: Any) -> None:
        pass

    @property
    def valid_until(self) -> datetime | None:
        return None

    @valid_until.setter
    def valid_until(self, value: Any) -> None:
        pass

    @property
    def is_expired(self) -> bool:
        return False

    def can_transition_to(self, new_status: str) -> bool:
        return new_status in self.VALID_TRANSITIONS.get(self.status, [])

    def __repr__(self) -> str:
        return f"<Claim {self.claim_text[:60]} status={self.status}>"
