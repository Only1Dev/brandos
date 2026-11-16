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
            from sqlalchemy import text
            await conn.execute(text("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'active';"))
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

# Robust multi-origin CORS configuration for Vercel, localhost, and custom webhooks
ALLOWED_ORIGINS = [
    "https://brandos-jet.vercel.app",
    "https://brandos-jet.vercel.app/",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=86400,
)


@app.middleware("http")
async def cors_guarantee_middleware(request, call_next):
    origin = request.headers.get("origin")
    if request.method == "OPTIONS":
        from fastapi.responses import Response
        res = Response(status_code=200)
        if origin:
            res.headers["Access-Control-Allow-Origin"] = origin
            res.headers["Access-Control-Allow-Credentials"] = "true"
            res.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD"
            res.headers["Access-Control-Allow-Headers"] = request.headers.get("access-control-request-headers", "*")
            res.headers["Access-Control-Max-Age"] = "86400"
        return res

    try:
        response = await call_next(request)
    except Exception as e:
        from fastapi.responses import JSONResponse
        logger.error(f"Unhandled server error: {e}")
        response = JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "error": str(e)}
        )

    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD"
        response.headers["Access-Control-Allow-Headers"] = "*"
    return response

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
