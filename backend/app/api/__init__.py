"""
BrandOS API Router Registry.
"""

from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.organizations import router as orgs_router
from app.api.guidelines import router as guidelines_router
from app.api.facts import router as facts_router
from app.api.claims import router as claims_router
from app.api.terminology import router as terminology_router
from app.api.assets import router as assets_router
from app.api.content import router as content_router
from app.api.reviews import router as reviews_router
from app.api.findings import router as findings_router
from app.api.analytics import router as analytics_router
from app.api.audit import router as audit_router

api_router = APIRouter(prefix="/api")

api_router.include_router(auth_router)
api_router.include_router(orgs_router)
api_router.include_router(guidelines_router)
api_router.include_router(facts_router)
api_router.include_router(claims_router)
api_router.include_router(terminology_router)
api_router.include_router(assets_router)
api_router.include_router(content_router)
api_router.include_router(reviews_router)
api_router.include_router(findings_router)
api_router.include_router(analytics_router)
api_router.include_router(audit_router)
