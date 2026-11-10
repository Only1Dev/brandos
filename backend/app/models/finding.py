from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import String, Text, Float, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Finding(Base):
    """A single issue discovered during a governance review."""

    __tablename__ = "findings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    review_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("reviews.id", ondelete="CASCADE"),
        nullable=False,
    )
    agent: Mapped[str] = mapped_column(
        String(50), nullable=False,
        comment="brand | fact | terminology | visual | accessibility | devils_advocate",
    )
    category: Mapped[str] = mapped_column(
        String(100), nullable=False,
        comment="Category within the agent domain",
    )
    severity: Mapped[str] = mapped_column(
        String(20), nullable=False,
        comment="error | warning | info",
    )
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    content_excerpt: Mapped[str | None] = mapped_column(
        Text, nullable=True,
        comment="The piece of content that triggered this finding",
    )
    source_location: Mapped[str | None] = mapped_column(
        Text, nullable=True,
        comment="Where in the content (page/paragraph/line)",
    )
    confidence: Mapped[float] = mapped_column(
        Float, nullable=False, default=1.0,
        comment="0.0-1.0 confidence in this finding",
    )
    evidence_strength: Mapped[float] = mapped_column(
        Float, nullable=False, default=1.0,
        comment="0.0-1.0 strength of supporting evidence",
    )
    policy_priority: Mapped[float] = mapped_column(
        Float, nullable=False, default=1.0,
        comment="Priority from the matching guideline (0.0-10.0)",
    )
    governance_impact: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0,
        comment="severity_weight × evidence_strength × policy_priority",
    )
    rule_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("guideline_rules.id"), nullable=True
    )
    fact_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("facts.id"), nullable=True
    )
    asset_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assets.id"), nullable=True
    )
    terminology_rule_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("terminology_rules.id"), nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="open",
        comment="open | accepted | rejected | overridden",
    )
    override_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    overridden_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    review: Mapped["Review"] = relationship(back_populates="findings")
    evidences: Mapped[list["Evidence"]] = relationship(
        back_populates="finding", lazy="selectin", cascade="all, delete-orphan"
    )
    suggestions: Mapped[list["Suggestion"]] = relationship(
        back_populates="finding", lazy="selectin", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Finding {self.title} severity={self.severity}>"


class Evidence(Base):
    """Evidence trace linking a finding to its source rule/fact/asset."""

    __tablename__ = "evidences"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    finding_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("findings.id", ondelete="CASCADE"),
        nullable=False,
    )
    evidence_type: Mapped[str] = mapped_column(
        String(50), nullable=False,
        comment="guideline_rule | fact | asset | terminology_rule | algorithm",
    )
    source_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True,
        comment="UUID of the source object",
    )
    source_text: Mapped[str | None] = mapped_column(
        Text, nullable=True,
        comment="Relevant text from the source",
    )
    explanation: Mapped[str] = mapped_column(
        Text, nullable=False,
        comment="How this evidence supports the finding",
    )
    relevance_score: Mapped[float] = mapped_column(
        Float, nullable=False, default=1.0
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    finding: Mapped["Finding"] = relationship(back_populates="evidences")

    def __repr__(self) -> str:
        return f"<Evidence {self.evidence_type} for finding={self.finding_id}>"


class Suggestion(Base):
    """A suggested fix for a finding."""

    __tablename__ = "suggestions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    finding_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("findings.id", ondelete="CASCADE"),
        nullable=False,
    )
    suggestion_text: Mapped[str] = mapped_column(Text, nullable=False)
    replacement_text: Mapped[str | None] = mapped_column(
        Text, nullable=True,
        comment="If applicable, direct replacement text",
    )
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.8)
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="pending",
        comment="pending | accepted | rejected",
    )
    accepted_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    finding: Mapped["Finding"] = relationship(back_populates="suggestions")

    def __repr__(self) -> str:
        return f"<Suggestion for finding={self.finding_id}>"
