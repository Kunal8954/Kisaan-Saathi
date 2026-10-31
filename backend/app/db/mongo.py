"""Lazy MongoDB Atlas client and database accessors.

No connection is opened at import time. The motor dependency is imported only when
a repository actually needs the database.
"""

from __future__ import annotations

from functools import lru_cache
from typing import TYPE_CHECKING, Any

from app.config import get_settings

if TYPE_CHECKING:
    from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase


@lru_cache
def get_client() -> AsyncIOMotorClient[Any]:
    """Create and cache the process-wide MongoDB client."""

    from motor.motor_asyncio import AsyncIOMotorClient

    settings = get_settings()
    if not settings.mongodb_uri:
        raise RuntimeError("MONGODB_URI is not configured.")
    return AsyncIOMotorClient(
        settings.mongodb_uri,
        appname=settings.app_name,
        serverSelectionTimeoutMS=5_000,
    )


def get_database() -> AsyncIOMotorDatabase[Any]:
    """Return the configured application database."""

    return get_client()[get_settings().mongodb_db]


async def ping() -> bool:
    """Verify database connectivity for readiness checks."""

    await get_database().command("ping")
    return True
