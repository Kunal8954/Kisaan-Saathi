"""Farm and geospatial schemas."""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class GeoPoint(BaseModel):
    """A WGS84 coordinate used in a farm boundary."""

    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class Farm(BaseModel):
    """A farmer's field, including the polygon used for satellite analysis."""

    id: UUID = Field(default_factory=uuid4)
    farmer_id: UUID
    name: str | None = None
    village: str | None = None
    district: str | None = None
    state: str | None = None
    area_hectares: float | None = Field(default=None, gt=0)
    boundary: list[GeoPoint] = Field(
        default_factory=list,
        description="Closed polygon vertices in WGS84; at least three points are required.",
    )
    soil_type: str | None = None
    irrigation_source: str | None = None
    current_crop: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
