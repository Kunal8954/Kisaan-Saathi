"""Nearby agri-input shop, KVK, and mandi endpoints."""

from __future__ import annotations

from typing import Annotated, Any, Literal

from fastapi import APIRouter, HTTPException, Query, status

from app.models.places import LocalPlace, PlacesResponse
from app.services.places_service import (
    find_nearby_agricultural_places,
    get_place_by_id,
)
from app.tools.mandi_prices import get_mandi_prices

router = APIRouter(prefix="/places", tags=["local-finder"])


@router.get("/nearby", response_model=PlacesResponse, status_code=status.HTTP_200_OK)
async def find_nearby_places(
    latitude: Annotated[float, Query(ge=-90.0, le=90.0)],
    longitude: Annotated[float, Query(ge=-180.0, le=180.0)],
    radius_km: Annotated[float, Query(gt=0.0, le=250.0)] = 50.0,
    place_type: Annotated[
        Literal["all", "shop", "mandi", "kvk", "cooperative", "both"], Query()
    ] = "all",
    query: Annotated[str | None, Query(max_length=100)] = None,
) -> PlacesResponse:
    """Find nearby agri-input shops, KVKs, and APMC mandis ranked by distance."""
    return find_nearby_agricultural_places(
        latitude=latitude,
        longitude=longitude,
        radius_km=radius_km,
        place_type=place_type,
        query=query,
    )


@router.get("/mandis/prices", status_code=status.HTTP_200_OK)
async def get_all_mandi_prices(
    commodity: Annotated[str | None, Query()] = None,
    state: Annotated[str | None, Query()] = None,
    district: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> list[dict[str, Any]]:
    """Retrieve live commodity prices across APMC mandis."""
    return await get_mandi_prices(
        commodity=commodity or "",
        state=state,
        district=district,
        limit=limit,
    )


@router.get("/{place_id}", response_model=LocalPlace, status_code=status.HTTP_200_OK)
async def get_single_place(place_id: str) -> LocalPlace:
    """Fetch details and services of an agricultural center by ID."""
    place = get_place_by_id(place_id)
    if not place:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agricultural center '{place_id}' was not found.",
        )
    return place
