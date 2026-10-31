"""Farmer profile schemas."""

from datetime import UTC, datetime
from enum import StrEnum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class Language(StrEnum):
    """Languages supported by the first release."""

    HINDI = "hi"
    ENGLISH = "en"


class ExperienceMode(StrEnum):
    """Controls guidance depth and response style."""

    NEW_FARMER = "new_farmer"
    EXPERIENCED = "experienced"


class FarmerProfile(BaseModel):
    """A farmer's persisted profile and preferences."""

    id: UUID = Field(default_factory=uuid4)
    display_name: str | None = None
    phone_number: str | None = Field(
        default=None,
        description="E.164 phone number used for voice interactions.",
    )
    language: Language = Language.HINDI
    experience_mode: ExperienceMode = ExperienceMode.NEW_FARMER
    state: str | None = None
    district: str | None = None
    village: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
