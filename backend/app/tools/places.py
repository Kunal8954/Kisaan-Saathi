"""Nearby places adapter for agri-input shops, KVKs, and mandis."""

from __future__ import annotations

from typing import Any, Literal

from app.services.places_service import find_nearby_agricultural_places


async def find_nearby_places(
    latitude: float,
    longitude: float,
    radius_km: float = 25.0,
    place_type: Literal["shop", "mandi", "both", "all", "kvk"] = "both",
) -> list[dict[str, Any]]:
    """Find nearby agri-input shops, KVKs, and mandis ranked by distance."""
    norm_filter = "both" if place_type == "both" else place_type
    response = find_nearby_agricultural_places(
        latitude=latitude,
        longitude=longitude,
        radius_km=radius_km,
        place_type=norm_filter,
    )
    return [p.model_dump() for p in response.places]
