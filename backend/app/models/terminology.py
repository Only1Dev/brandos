from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import String, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TerminologyRule(Base):
    """Controlled vocabulary: preferred, deprecated, or forbidden terms."""

    __tablename__ = "terminology_rules"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    term: Mapped[str] = mapped_column(
        String(255), nullable=False, comment="The term to check"
    )
    term_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default="preferred",
        comment="preferred | deprecated | forbidden",
    )
    preferred_alternative: Mapped[str | None] = mapped_column(
        String(255), nullable=True,
        comment="If deprecated/forbidden, what to use instead",
    )
    context: Mapped[str | None] = mapped_column(
        Text, nullable=True,
        comment="When this rule applies (e.g. 'in marketing materials')",
    )
    severity: Mapped[str] = mapped_column(
        String(20), nullable=False, default="warning",
        comment="error | warning | info",
    )
    case_sensitive: Mapped[bool] = mapped_column(default=False)
    is_regex: Mapped[bool] = mapped_column(
        default=False, comment="If True, 'term' is a regex pattern"
    )
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    organization: Mapped["Organization"] = relationship(  # noqa: F821
        back_populates="terminology_rules"
    )

    @property
    def status(self) -> str:
        return self.term_type

    @status.setter
    def status(self, value: str) -> None:
        self.term_type = value

    @property
    def category(self) -> str:
        return "general"

    @category.setter
    def category(self, value: str) -> None:
        pass

    def __repr__(self) -> str:
        return f"<TerminologyRule {self.term} ({self.term_type})>"
