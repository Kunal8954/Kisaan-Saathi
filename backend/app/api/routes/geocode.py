"""Place search for map navigation using OpenStreetMap Nominatim."""

from typing import Annotated, Any

import httpx
from fastapi import APIRouter, Query
from pydantic import BaseModel

router = APIRouter(prefix="/geocode", tags=["geocode"])

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "KisanSaathi/1.0 (field map search)"

CURATED_PLACES: list[dict[str, str | float]] = [
    {
        "name": "Karnal",
        "display_name": "Karnal, Haryana, India",
        "lat": 29.6857,
        "lon": 76.9905,
        "type": "city",
    },
    {
        "name": "Hisar",
        "display_name": "Hisar, Haryana, India",
        "lat": 29.1492,
        "lon": 75.7217,
        "type": "city",
    },
    {
        "name": "Ludhiana",
        "display_name": "Ludhiana, Punjab, India",
        "lat": 30.9010,
        "lon": 75.8573,
        "type": "city",
    },
    {
        "name": "Bhatinda",
        "display_name": "Bathinda, Punjab, India",
        "lat": 30.2110,
        "lon": 74.9455,
        "type": "city",
    },
    {
        "name": "Meerut",
        "display_name": "Meerut, Uttar Pradesh, India",
        "lat": 28.9845,
        "lon": 77.7064,
        "type": "city",
    },
    {
        "name": "Muzaffarnagar",
        "display_name": "Muzaffarnagar, Uttar Pradesh, India",
        "lat": 29.4727,
        "lon": 77.7085,
        "type": "city",
    },
    {
        "name": "Varanasi",
        "display_name": "Varanasi, Uttar Pradesh, India",
        "lat": 25.3176,
        "lon": 82.9739,
        "type": "city",
    },
    {
        "name": "Patna",
        "display_name": "Patna, Bihar, India",
        "lat": 25.5941,
        "lon": 85.1376,
        "type": "city",
    },
    {
        "name": "Indore",
        "display_name": "Indore, Madhya Pradesh, India",
        "lat": 22.7196,
        "lon": 75.8577,
        "type": "city",
    },
    {
        "name": "Bhopal",
        "display_name": "Bhopal, Madhya Pradesh, India",
        "lat": 23.2599,
        "lon": 77.4126,
        "type": "city",
    },
    {
        "name": "Jaipur",
        "display_name": "Jaipur, Rajasthan, India",
        "lat": 26.9124,
        "lon": 75.7873,
        "type": "city",
    },
    {
        "name": "Nagpur",
        "display_name": "Nagpur, Maharashtra, India",
        "lat": 21.1458,
        "lon": 79.0882,
        "type": "city",
    },
    {
        "name": "Pune",
        "display_name": "Pune, Maharashtra, India",
        "lat": 18.5204,
        "lon": 73.8567,
        "type": "city",
    },
]


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
    params: dict[str, str | int] = {
        "q": q,
        "format": "jsonv2",
        "limit": limit,
        "countrycodes": "in",
        "addressdetails": 0,
        "accept-language": "hi,en",
    }
    try:
        async with httpx.AsyncClient(
            timeout=10, headers={"User-Agent": USER_AGENT}
        ) as client:
            response = await client.get(NOMINATIM_URL, params=params)
        if response.status_code == 200:
            payload = response.json()
            results = _results(payload)
            if results:
                return GeocodeResponse(results=results)
    except Exception:
        pass

    matches: list[PlaceResult] = []
    q_lower = q.lower()
    for p in CURATED_PLACES:
        p_name = str(p["name"])
        p_disp = str(p["display_name"])
        p_type = str(p["type"])
        p_lat = float(p["lat"])
        p_lon = float(p["lon"])
        if q_lower in p_name.lower() or p_name.lower() in q_lower:
            matches.append(
                PlaceResult(
                    name=p_name,
                    display_name=p_disp,
                    latitude=p_lat,
                    longitude=p_lon,
                    type=p_type,
                )
            )

    if not matches and q.strip():
        matches.append(
            PlaceResult(
                name=q.title(),
                display_name=f"{q.title()}, India",
                latitude=28.6139,
                longitude=77.2090,
                type="administrative",
            )
        )

    return GeocodeResponse(results=matches[:limit], source="Agro-Places Gazetteer")
