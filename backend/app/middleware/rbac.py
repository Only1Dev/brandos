"""
Role-based access control dependencies.
"""

from __future__ import annotations

from functools import wraps
from typing import List

from fastapi import Depends, HTTPException, status

from app.middleware.auth import get_current_user
from app.models.user import User


ROLE_HIERARCHY = {
    "admin": 4,
    "editor": 3,
    "reviewer": 2,
    "viewer": 1,
}


def require_role(minimum_role: str):
    """
    FastAPI dependency factory: ensures the current user has at least
    the given role level.

    Usage:
        @router.post("/", dependencies=[Depends(require_role("editor"))])
    """
    min_level = ROLE_HIERARCHY.get(minimum_role, 0)

    async def _check(user: User = Depends(get_current_user)) -> User:
        user_level = ROLE_HIERARCHY.get(user.role, 0)
        if user_level < min_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires at least '{minimum_role}' role. You have '{user.role}'.",
            )
        return user

    return _check


def require_same_org(user: User, org_id) -> None:
    """Raises 403 if the user doesn't belong to the given org (admins can bypass)."""
    if user.role == "admin":
        return
    if user.organization_id is None or str(user.organization_id) != str(org_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not belong to this organization.",
        )
