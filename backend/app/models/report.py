"""Insurance evidence report schemas."""

from __future__ import annotations

from datetime import UTC, date, datetime
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class StressSnapshot(BaseModel):
    """Satellite-derived crop stress indicators for one observation date."""

    observed_on: date
    source: str = "Copernicus Sentinel-2"
    ndvi: float | None = Field(default=None, ge=-1.0, le=1.0)
    ndvi_anomaly: float | None = None
    ndmi: float | None = Field(default=None, ge=-1.0, le=1.0)
    land_surface_temperature_c: float | None = None
    soil_moisture: float | None = Field(default=None, ge=0.0, le=100.0)
    stress_score: float = Field(default=50.0, ge=0.0, le=100.0)


class WeatherSnapshot(BaseModel):
    """Weather evidence for the claim window."""

    observed_on: date
    rainfall_mm: float | None = Field(default=None, ge=0.0)
    max_temperature_c: float | None = None
    min_temperature_c: float | None = None
    wind_speed_kmh: float | None = None
    source: str = "Open-Meteo"


class EvidencePhoto(BaseModel):
    """A farmer-supplied photo referenced by URI or base64 data."""

    uri: str
    captured_at: datetime | None = None
    caption: str | None = None


class InsuranceReportRequest(BaseModel):
    """Input required to assemble an insurance evidence package."""

    farmer_id: str = "farmer-default"
    farm_id: str = "farm-default"
    farm_name: str | None = "North Field (उत्तर खेत)"
    crop: str = "Wheat (गेहूं)"
    area_acres: float = 2.5
    calamity_type: str = "Heavy Unseasonal Rainfall & Inundation"
    claim_reason: str = Field(
        default="अत्यधिक बारिश व खेत में जलभराव के कारण फसल डूबने से भारी क्षति।",
        min_length=1,
        max_length=2_000,
    )
    period_start: date
    period_end: date
    photo_uris: list[str] = Field(default_factory=list)
    satellite_ndvi: float | None = None
    satellite_ndvi_anomaly: float | None = None
    satellite_ndmi: float | None = None
    satellite_lst_c: float | None = None
    soil_moisture_pct: float | None = None


class InsuranceEvidenceReport(BaseModel):
    """Combined evidence package generated for a crop-insurance claim."""

    id: UUID = Field(default_factory=uuid4)
    farmer_id: str = "farmer-default"
    farm_id: str = "farm-default"
    farm_name: str | None = "North Field"
    crop: str = "Wheat"
    area_acres: float = 2.5
    calamity_type: str = "Heavy Unseasonal Rainfall & Inundation"
    claim_reason: str = Field(min_length=1)
    period_start: date
    period_end: date
    stress_snapshots: list[StressSnapshot] = Field(default_factory=list)
    weather_snapshots: list[WeatherSnapshot] = Field(default_factory=list)
    photos: list[EvidencePhoto] = Field(default_factory=list)
    narrative: str = ""
    generated_pdf_uri: str | None = None
    disclaimer: str = Field(
        default=(
            "Satellite and weather telemetry outputs are supplementary advisory evidence, "
            "not statutory proof of loss. This report is compiled under PMFBY guidelines "
            "and does not replace physical loss assessment by the notified State Insurance "
            "Committee."
        ),
        min_length=1,
    )
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
