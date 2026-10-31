"""Place search for map navigation using OpenStreetMap Nominatim."""

from typing import Annotated, Any

import httpx
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

router = APIRouter(prefix="/geocode", tags=["geocode"])

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "KisanSaathi/1.0 (field map search)"


class PlaceResult(BaseModel):
    """One matching place returned to the map search box."""

    name: str
    display_name: str
    latitude: float
    longitude: float
    type: str | None = None


class GeocodeResponse(BaseModel):
    """Place-search payload for the map UI."""

    results: list[PlaceResult]
    source: str = "OpenStreetMap Nominatim"


def _results(payload: Any) -> list[PlaceResult]:
    if not isinstance(payload, list):
        return []
    results: list[PlaceResult] = []
    for item in payload:
        if not isinstance(item, dict):
            continue
        try:
            latitude = float(item["lat"])
            longitude = float(item["lon"])
        except (KeyError, TypeError, ValueError):
            continue
        display_name = str(item.get("display_name") or "").strip()
        name = str(item.get("name") or "").strip()
        if not name:
            name = display_name.split(",")[0].strip() or display_name
        if not name:
            continue
        place_type = item.get("type")
        results.append(
            PlaceResult(
                name=name,
                display_name=display_name,
                latitude=latitude,
                longitude=longitude,
                type=str(place_type) if place_type else None,
            )
        )
    return results


@router.get("", response_model=GeocodeResponse)
async def search_places(
    q: Annotated[str, Query(min_length=2, max_length=200)],
    limit: Annotated[int, Query(ge=1, le=10)] = 5,
) -> GeocodeResponse:
    """Search Indian villages, towns and districts by name."""

    params = {
        "q": q,
        "format": "jsonv2",
        "limit": limit,
        "countrycodes": "in",
        "addressdetails": 0,
        "accept-language": "hi,en",
    }
    try:
        async with httpx.AsyncClient(
            timeout=15, headers={"User-Agent": USER_AGENT}
        ) as client:
            response = await client.get(NOMINATIM_URL, params=params)
    except httpx.HTTPError as exc:
        raise HTTPException(502, "Place search is unavailable.") from exc

    if response.status_code != 200:
        raise HTTPException(502, "Place search is unavailable.")

    try:
        payload = response.json()
    except ValueError as exc:
        raise HTTPException(502, "Place search returned an invalid response.") from exc

    return GeocodeResponse(results=_results(payload))
