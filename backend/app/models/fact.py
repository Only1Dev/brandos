from __future__ import annotations

import uuid
from datetime import datetime, date

from sqlalchemy import String, Text, Float, Date, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Fact(Base):
    """An approved, verifiable fact that content claims must align with."""

    __tablename__ = "facts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    category: Mapped[str] = mapped_column(
        String(100), nullable=False, default="general",
        comment="statistic | product | legal | scientific | financial | general",
    )
    statement: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="Where this fact comes from"
    )
    numerical_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    numerical_unit: Mapped[str | None] = mapped_column(String(64), nullable=True)
    numerical_tolerance: Mapped[float | None] = mapped_column(
        Float, nullable=True,
        comment="Acceptable ± tolerance for numerical comparisons",
    )
    valid_from: Mapped[date | None] = mapped_column(Date, nullable=True)
    valid_until: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    organization: Mapped["Organization"] = relationship(back_populates="facts")  # noqa: F821

    @property
    def is_expired(self) -> bool:
        if self.valid_until is None:
            return False
        return date.today() > self.valid_until

    def __repr__(self) -> str:
        return f"<Fact {self.statement[:60]}>"
