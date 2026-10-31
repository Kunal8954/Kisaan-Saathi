"""Schemas for conversational requests and responses."""

from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """A farmer's text or voice-transcript turn."""

    message: str = Field(min_length=1, max_length=4_000)
    farmer_id: UUID | None = None
    farm_id: UUID | None = None
    session_id: UUID | None = None
    language: Literal["hi", "en"] = "hi"
    experience_mode: Literal["new_farmer", "experienced"] = "new_farmer"
    context: dict[str, Any] = Field(default_factory=dict)


class ChatResponse(BaseModel):
    """An orchestrator reply plus the specialist agent that handled it."""

    reply: str
    intent: str
    agent: str
    sources: list[str] = Field(default_factory=list)
    audio_url: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
