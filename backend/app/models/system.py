"""System-level API schemas."""

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Liveness payload returned by ``GET /health``."""

    status: str = Field(description="Service health state.")
    service: str = Field(description="Human-readable service name.")
    version: str = Field(description="Deployed application version.")
    environment: str = Field(description="Runtime environment name.")
