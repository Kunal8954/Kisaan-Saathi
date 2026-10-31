"""Current weather and short forecast for a field location."""

from datetime import date
from typing import Annotated, Any

import httpx
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

router = APIRouter(prefix="/weather", tags=["weather"])

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


class CurrentWeather(BaseModel):
    """Current conditions at the field centroid."""

    temperature_c: float | None = None
    humidity_pct: float | None = None
    precipitation_mm: float | None = None
    wind_speed_kmh: float | None = None
    wind_gust_kmh: float | None = None
    wind_direction_deg: float | None = None


class DailyWeather(BaseModel):
    """One day of the short forecast."""

    date: date
    rain_mm: float | None = None
    temp_max_c: float | None = None
    temp_min_c: float | None = None
    wind_max_kmh: float | None = None


class WeatherResponse(BaseModel):
    """Weather payload used by the field advisory UI."""

    current: CurrentWeather
    daily: list[DailyWeather]
    source: str = "Open-Meteo"


def _number(value: Any) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number


def _daily_rows(payload: dict[str, Any]) -> list[DailyWeather]:
    daily = payload.get("daily")
    if not isinstance(daily, dict):
        return []
    days = daily.get("time")
    if not isinstance(days, list):
        return []
    rain = daily.get("precipitation_sum") or []
    temp_max = daily.get("temperature_2m_max") or []
    temp_min = daily.get("temperature_2m_min") or []
    wind_max = daily.get("wind_speed_10m_max") or []
    rows: list[DailyWeather] = []
    for index, raw_day in enumerate(days):
        try:
            day = date.fromisoformat(str(raw_day))
        except ValueError:
            continue
        rows.append(
            DailyWeather(
                date=day,
                rain_mm=_number(rain[index]) if index < len(rain) else None,
                temp_max_c=_number(temp_max[index]) if index < len(temp_max) else None,
                temp_min_c=_number(temp_min[index]) if index < len(temp_min) else None,
                wind_max_kmh=_number(wind_max[index]) if index < len(wind_max) else None,
            )
        )
    return rows


@router.get("", response_model=WeatherResponse)
async def get_field_weather(
    lat: Annotated[float, Query(ge=-90, le=90, description="Field latitude.")],
    lon: Annotated[float, Query(ge=-180, le=180, description="Field longitude.")],
) -> WeatherResponse:
    """Return current conditions and a three-day forecast from Open-Meteo."""

    params = {
        "latitude": lat,
        "longitude": lon,
        "current": (
            "temperature_2m,relative_humidity_2m,precipitation,"
            "wind_speed_10m,wind_gusts_10m,wind_direction_10m"
        ),
        "daily": (
            "precipitation_sum,temperature_2m_max,temperature_2m_min,"
            "wind_speed_10m_max"
        ),
        "timezone": "auto",
        "forecast_days": 3,
        "temperature_unit": "celsius",
        "wind_speed_unit": "kmh",
        "precipitation_unit": "mm",
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(OPEN_METEO_URL, params=params)
    except httpx.HTTPError as exc:
        raise HTTPException(502, "Weather service is unavailable.") from exc

    if response.status_code != 200:
        raise HTTPException(502, "Weather service is unavailable.")

    try:
        payload = response.json()
    except ValueError as exc:
        raise HTTPException(502, "Weather service returned an invalid response.") from exc
    current = payload.get("current") if isinstance(payload, dict) else None
    if not isinstance(current, dict):
        raise HTTPException(502, "Weather service returned an invalid response.")

    return WeatherResponse(
        current=CurrentWeather(
            temperature_c=_number(current.get("temperature_2m")),
            humidity_pct=_number(current.get("relative_humidity_2m")),
            precipitation_mm=_number(current.get("precipitation")),
            wind_speed_kmh=_number(current.get("wind_speed_10m")),
            wind_gust_kmh=_number(current.get("wind_gusts_10m")),
            wind_direction_deg=_number(current.get("wind_direction_10m")),
        ),
        daily=_daily_rows(payload),
    )
