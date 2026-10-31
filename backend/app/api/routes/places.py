"""Nearby agri-input shop and mandi endpoint."""

from typing import Annotated, Literal

from fastapi import APIRouter, HTTPException, Query, status

router = APIRouter(prefix="/places", tags=["local-finder"])


@router.get("/nearby", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def find_nearby_places(
    latitude: Annotated[float, Query(ge=-90, le=90)],
    longitude: Annotated[float, Query(ge=-180, le=180)],
    radius_km: Annotated[float, Query(gt=0, le=100)] = 25,
    place_type: Annotated[Literal["shop", "mandi", "both"], Query()] = "both",
) -> None:
    """Find nearby agri-input shops and mandis using a geospatial query."""

    # TODO: query Google Places and/or cached MongoDB GeoJSON records.
    _ = (latitude, longitude, radius_km, place_type)
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Local place search is not implemented yet.",
    )
