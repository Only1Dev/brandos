"""
BrandOS configuration — loads all settings from .env via Pydantic Settings.
"""

from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Supabase ---
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    database_url: str

    # --- Groq (3 rotating keys) ---
    groq_api_key_1: str
    groq_api_key_2: str
    groq_api_key_3: str

    # --- Gemini ---
    gemini_api_key: str

    # --- HuggingFace ---
    hf_api_token: str

    # --- App ---
    secret_key: str = "change-me-in-production"
    environment: str = "development"
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"
    allowed_origins: str = "http://localhost:3000,http://localhost:3001"

    # --- File Storage ---
    upload_dir: str = "uploads"
    max_file_size_mb: int = 50

    # --- Derived ---
    @property
    def groq_api_keys(self) -> List[str]:
        return [self.groq_api_key_1, self.groq_api_key_2, self.groq_api_key_3]

    @property
    def async_database_url(self) -> str:
        url = self.database_url
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def jwt_secret(self) -> str:
        return self.supabase_anon_key


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
