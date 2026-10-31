"""Crop-diagnosis schemas with mandatory safety fields.

The disease doctor may only populate remedies from retrieved agronomy documents.
``confidence``, ``disclaimer``, and ``sources`` are required on every result.
"""

from datetime import UTC, datetime
from enum import StrEnum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, model_validator


class CauseCategory(StrEnum):
    """High-level diagnosis categories."""

    NUTRIENT_DEFICIENCY = "deficiency"
    NUTRIENT_EXCESS = "excess"
    PEST = "pest"
    DISEASE = "disease"
    UNKNOWN = "unknown"


class RemedyType(StrEnum):
    """The two remedy tracks required for every diagnosis."""

    CHEMICAL_FERTILIZER = "chemical_fertilizer"
    ORGANIC_COW_DUNG = "organic_cow_dung"


class Remedy(BaseModel):
    """A grounded remedy whose instructions must cite retrieved documents."""

    remedy_type: RemedyType
    title: str = Field(min_length=1)
    instructions: str = Field(min_length=1)
    source_ids: list[str] = Field(
        min_length=1,
        description="Identifiers of retrieved documents supporting this remedy.",
    )
    safety_notes: str | None = None


class DiagnosisResult(BaseModel):
    """Photo-based diagnosis returned by the disease-doctor agent."""

    id: UUID = Field(default_factory=uuid4)
    farm_id: UUID | None = None
    crop: str | None = None
    likely_cause: str = Field(min_length=1)
    cause_category: CauseCategory = CauseCategory.UNKNOWN
    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Model confidence in the likely cause, not a guarantee.",
    )
    remedies: list[Remedy] = Field(
        min_length=2,
        max_length=2,
        description="Exactly one chemical-fertilizer and one organic remedy.",
    )
    sources: list[str] = Field(
        min_length=1,
        description="Retrieved documents used to ground the diagnosis and remedies.",
    )
    disclaimer: str = Field(
        min_length=1,
        description="Must direct the farmer to consult their local KVK.",
    )
    image_uri: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    @model_validator(mode="after")
    def validate_remedy_tracks(self) -> "DiagnosisResult":
        """Require exactly one chemical and one organic remedy track."""

        tracks = {remedy.remedy_type for remedy in self.remedies}
        required = {RemedyType.CHEMICAL_FERTILIZER, RemedyType.ORGANIC_COW_DUNG}
        if tracks != required:
            raise ValueError("Diagnosis must include one chemical and one organic remedy.")
        return self
