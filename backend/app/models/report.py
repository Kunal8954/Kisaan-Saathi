"""Insurance evidence report schemas."""

from datetime import UTC, date, datetime
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class StressSnapshot(BaseModel):
    """Satellite-derived crop stress indicators for one observation date."""

    observed_on: date
    source: str
    ndvi: float | None = Field(default=None, ge=-1.0, le=1.0)
    ndvi_anomaly: float | None = None
    ndmi: float | None = Field(default=None, ge=-1.0, le=1.0)
    land_surface_temperature_c: float | None = None
    soil_moisture: float | None = Field(default=None, ge=0.0, le=1.0)
    stress_score: float = Field(ge=0.0, le=100.0)


class WeatherSnapshot(BaseModel):
    """Weather evidence for the claim window."""

    observed_on: date
    rainfall_mm: float | None = Field(default=None, ge=0.0)
    max_temperature_c: float | None = None
    min_temperature_c: float | None = None
    source: str


class EvidencePhoto(BaseModel):
    """A farmer-supplied photo referenced by URI, not embedded in the database."""

    uri: str
    captured_at: datetime | None = None
    caption: str | None = None


class InsuranceReportRequest(BaseModel):
    """Input required to assemble an insurance evidence package."""

    farmer_id: UUID
    farm_id: UUID
    claim_reason: str = Field(min_length=1, max_length=2_000)
    period_start: date
    period_end: date
    photo_uris: list[str] = Field(default_factory=list)


class InsuranceEvidenceReport(BaseModel):
    """Combined evidence package generated for a crop-insurance claim."""

    id: UUID = Field(default_factory=uuid4)
    farmer_id: UUID
    farm_id: UUID
    claim_reason: str = Field(min_length=1)
    period_start: date
    period_end: date
    stress_snapshots: list[StressSnapshot] = Field(default_factory=list)
    weather_snapshots: list[WeatherSnapshot] = Field(default_factory=list)
    photos: list[EvidencePhoto] = Field(default_factory=list)
    narrative: str = ""
    generated_pdf_uri: str | None = None
    disclaimer: str = Field(
        min_length=1,
        description="Explains that evidence is advisory and does not guarantee claim approval.",
    )
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
