from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None
    role: str = Field("viewer", pattern=r"^(admin|editor|reviewer|viewer)$")
    organization_id: Optional[uuid.UUID] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: Optional[str] = Field(None, pattern=r"^(admin|editor|reviewer|viewer)$")
    organization_id: Optional[uuid.UUID] = None


class UserRead(BaseModel):
    id: uuid.UUID
    auth_id: str
    email: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    role: str
    organization_id: Optional[uuid.UUID]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: UserRead
