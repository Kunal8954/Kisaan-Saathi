"""Nearby agricultural places and mandi schemas."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

PlaceType = Literal["mandi", "shop", "kvk", "cooperative"]


class MandiPriceRecord(BaseModel):
    """Current modal prices and arrival volume for an agricultural commodity."""

    commodity: str = Field(description="Commodity English name")
    commodity_hi: str = Field(description="Commodity Hindi name")
    variety: str = Field(default="Standard / FAQ", description="Crop variety grade")
    modal_price_quintal: float = Field(ge=0.0, description="Modal transaction price in INR / Qtl")
    min_price_quintal: float = Field(ge=0.0, description="Minimum price in INR / Qtl")
    max_price_quintal: float = Field(ge=0.0, description="Maximum price in INR / Qtl")
    msp_quintal: float | None = Field(
        default=None, description="Government Minimum Support Price (MSP)"
    )
    arrival_tons: float = Field(default=0.0, ge=0.0, description="Daily arrival quantity in tons")
    updated_date: str = Field(description="Date of price reporting")


class LocalPlace(BaseModel):
    """An agricultural input center, APMC mandi, or extension office."""

    id: str = Field(description="Unique place identifier")
    name_hi: str = Field(description="Hindi name")
    name_en: str = Field(description="English name")
    place_type: PlaceType = Field(description="Type: mandi, shop, kvk, cooperative")
    address_hi: str = Field(description="Hindi address")
    address_en: str = Field(description="English address")
    district: str = Field(description="District name")
    state: str = Field(description="State name")
    latitude: float = Field(ge=-90.0, le=90.0)
    longitude: float = Field(ge=-180.0, le=180.0)
    distance_km: float | None = Field(default=None, description="Calculated road/geodesic distance")
    phone: str | None = Field(default=None, description="Helpline or contact telephone")
    timing: str | None = Field(default=None, description="Operating hours")
    verified: bool = Field(default=True, description="Government or ICAR verified entity")
    services_hi: list[str] = Field(default_factory=list, description="Available services in Hindi")
    services_en: list[str] = Field(
        default_factory=list, description="Available services in English"
    )
    mandi_prices: list[MandiPriceRecord] = Field(
        default_factory=list, description="Live commodity price board if mandi"
    )


class PlacesResponse(BaseModel):
    """Response model for nearby agricultural search."""

    total: int = Field(ge=0)
    places: list[LocalPlace]
    query_latitude: float
    query_longitude: float
    radius_km: float
    filter_type: str = "all"
