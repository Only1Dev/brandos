"""
BrandOS FastAPI Application Entrypoint.
"""

from __future__ import annotations

import logging
import os
import sys
from contextlib import asynccontextmanager

# Ensure UTF-8 output encoding on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import api_router
from app.config import get_settings
from app.database import engine, Base

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("brandos")
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing BrandOS backend services...")
    os.makedirs(settings.upload_dir, exist_ok=True)
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schema verified.")
    except Exception as e:
        logger.warning(f"Database initialization note (may already exist via Supabase): {e}")
    yield
    logger.info("Shutting down BrandOS...")


app = FastAPI(
    title="BrandOS API",
    description="The pre-publication governance layer for human + AI content.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration - allow all origins for web, Vercel, and local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads static directory
if not os.path.exists(settings.upload_dir):
    os.makedirs(settings.upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

# Include master API router
app.include_router(api_router)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "BrandOS Governance Engine",
        "version": "1.0.0",
        "environment": settings.environment,
    }


@app.get("/")
async def root():
    return {
        "message": "BrandOS API is online",
        "docs_url": "/docs",
        "governance_layer": "active",
    }
