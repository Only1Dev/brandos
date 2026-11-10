from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import String, Text, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    settings: Mapped[dict | None] = mapped_column(
        "settings", nullable=True, type_=Text  # stored as JSON string
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # relationships
    users: Mapped[list["User"]] = relationship(  # noqa: F821
        back_populates="organization", lazy="selectin"
    )
    guidelines: Mapped[list["Guideline"]] = relationship(  # noqa: F821
        back_populates="organization", lazy="selectin"
    )
    facts: Mapped[list["Fact"]] = relationship(  # noqa: F821
        back_populates="organization", lazy="selectin"
    )
    terminology_rules: Mapped[list["TerminologyRule"]] = relationship(  # noqa: F821
        back_populates="organization", lazy="selectin"
    )
    assets: Mapped[list["Asset"]] = relationship(  # noqa: F821
        back_populates="organization", lazy="selectin"
    )
    contents: Mapped[list["Content"]] = relationship(  # noqa: F821
        back_populates="organization", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Organization {self.name}>"
