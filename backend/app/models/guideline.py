from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, Float, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Guideline(Base):
    __tablename__ = "guidelines"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(
        String(100), nullable=False, default="general",
        comment="brand_voice | visual | legal | factual | accessibility | general",
    )
    source_file_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    raw_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    is_active: Mapped[bool] = mapped_column(default=True)
    priority: Mapped[float] = mapped_column(
        Float, nullable=False, default=1.0,
        comment="Higher priority rules take precedence (0.0-10.0)",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    organization: Mapped["Organization"] = relationship(back_populates="guidelines")  # noqa: F821
    rules: Mapped[list["GuidelineRule"]] = relationship(
        back_populates="guideline", lazy="selectin", cascade="all, delete-orphan"
    )

    @property
    def name(self) -> str:
        return self.title

    @name.setter
    def name(self, val: str) -> None:
        self.title = val

    @property
    def raw_document_url(self) -> str | None:
        return self.source_file_url

    @raw_document_url.setter
    def raw_document_url(self, val: str | None) -> None:
        self.source_file_url = val

    def __repr__(self) -> str:
        return f"<Guideline {self.title}>"


class GuidelineRule(Base):
    __tablename__ = "guideline_rules"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    guideline_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("guidelines.id", ondelete="CASCADE"),
        nullable=False,
    )
    rule_code: Mapped[str] = mapped_column(
        String(64), nullable=False,
        comment="Machine-readable code e.g. BV-001",
    )
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(
        String(20), nullable=False, default="warning",
        comment="error | warning | info",
    )
    check_type: Mapped[str] = mapped_column(
        String(50), nullable=False, default="llm",
        comment="exact_match | regex | numerical | llm | visual",
    )
    check_value: Mapped[str | None] = mapped_column(
        Text, nullable=True,
        comment="Pattern/value for deterministic checks",
    )
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    guideline: Mapped["Guideline"] = relationship(back_populates="rules")

    @property
    def name(self) -> str:
        return self.rule_code

    @name.setter
    def name(self, val: str) -> None:
        self.rule_code = val

    @property
    def rule_statement(self) -> str:
        return self.description

    @rule_statement.setter
    def rule_statement(self, val: str) -> None:
        self.description = val
        self.title = val[:80] if val else "Rule"

    @property
    def priority(self) -> float:
        return 1.0

    @priority.setter
    def priority(self, val: float) -> None:
        pass

    @property
    def examples_positive(self) -> str:
        return ""

    @examples_positive.setter
    def examples_positive(self, val: str) -> None:
        pass

    @property
    def examples_negative(self) -> str:
        return ""

    @examples_negative.setter
    def examples_negative(self, val: str) -> None:
        pass

    def __repr__(self) -> str:
        return f"<GuidelineRule {self.rule_code}: {self.title}>"
