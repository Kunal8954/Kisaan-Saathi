"""Shared state passed between LangGraph nodes."""

from enum import StrEnum
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

from app.models.farm import GeoPoint
from app.models.farmer import ExperienceMode, Language


class Intent(StrEnum):
    """Intents the placeholder orchestrator can route."""

    CROP_PLANNER = "crop_planner"
    DISEASE_DOCTOR = "disease_doctor"
    SOIL_ANALYST = "soil_analyst"
    STRESS_MONITOR = "stress_monitor"
    SCHEME_ADVISOR = "scheme_advisor"
    LOCAL_FINDER = "local_finder"
    GENERAL = "general"


class AgentState(BaseModel):
    """Conversation, farmer context, and intermediate results shared by agents."""

    request_id: UUID = Field(default_factory=uuid4)
    session_id: UUID | None = None
    farmer_id: UUID | None = None
    farm_id: UUID | None = None
    intent: Intent = Intent.GENERAL
    language: Language = Language.HINDI
    experience_mode: ExperienceMode = ExperienceMode.NEW_FARMER
    message: str = ""
    image_uri: str | None = None
    document_uri: str | None = None
    location: GeoPoint | None = None
    context: dict[str, Any] = Field(default_factory=dict)
    result: dict[str, Any] = Field(default_factory=dict)
    sources: list[str] = Field(default_factory=list)
    error: str | None = None
