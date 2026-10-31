"""FastAPI application entry point.

The module intentionally imports only lightweight route definitions so that
``uvicorn app.main:app`` and ``GET /health`` work before external services or
heavy optional SDKs are configured.
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    chat,
    diagnose,
    geocode,
    places,
    reports,
    schemes,
    soil,
    stress,
    weather,
)
from app.config import get_settings
from app.models.system import HealthResponse
from heatmap_server import router as heatmap_router

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Manage application startup and shutdown resources."""

    # TODO: initialize MongoDB, Earth Engine, and provider clients here.
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Hindi-first AI farming advisor for Indian farmers.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for route_module in (
    chat,
    diagnose,
    soil,
    stress,
    schemes,
    places,
    reports,
    weather,
    geocode,
):
    app.include_router(route_module.router, prefix=settings.api_prefix)

app.include_router(heatmap_router, prefix=settings.api_prefix)


@app.get("/health", response_model=HealthResponse, tags=["system"])
async def health() -> HealthResponse:
    """Return a lightweight liveness response for Cloud Run and local checks."""

    return HealthResponse(
        status="ok",
        service=settings.app_name,
        version=settings.app_version,
        environment=settings.app_env,
    )
