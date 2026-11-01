"""Current weather, date-synced history, and live forecasts for field locations."""

from __future__ import annotations

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.tools.weather import fetch_live_weather

router = APIRouter(prefix="/weather", tags=["weather"])


class CurrentWeather(BaseModel):
    """Current variable conditions at the field centroid."""

    temperature_c: float | None = None
    humidity_pct: float | None = None
    precipitation_mm: float | None = None
    precipitation_probability_pct: float | None = None
    wind_speed_kmh: float | None = None
    wind_gust_kmh: float | None = None
    wind_direction_deg: float | None = None
    condition: str | None = None


class DailyWeather(BaseModel):
    """One day of the date-synced weather history or forecast."""

    date: date
    rain_mm: float | None = None
    temp_max_c: float | None = None
    temp_min_c: float | None = None
    wind_max_kmh: float | None = None
    pop_pct: float | None = None


class WeatherResponse(BaseModel):
    """Weather payload used by the field advisory and map UI."""

    current: CurrentWeather
    daily: list[DailyWeather]
    source: str = "OpenWeatherMap Live"


@router.get("", response_model=WeatherResponse)
async def get_field_weather(
    lat: Annotated[float, Query(ge=-90, le=90, description="Field latitude.")],
    lon: Annotated[float, Query(ge=-180, le=180, description="Field longitude.")],
    date_from: Annotated[date | None, Query(description="Start date for synchronization.")] = None,
    date_to: Annotated[date | None, Query(description="End date for synchronization.")] = None,
) -> WeatherResponse:
    """Return live variable weather from OpenWeatherMap, synced with the chosen dates."""
    data = await fetch_live_weather(lat, lon, date_from=date_from, date_to=date_to)

    daily_rows: list[DailyWeather] = []
    for item in data.get("daily", []):
        try:
            d_obj = date.fromisoformat(str(item.get("date")))
        except (ValueError, TypeError):
            continue
        daily_rows.append(
            DailyWeather(
                date=d_obj,
                rain_mm=item.get("rain_mm"),
                temp_max_c=item.get("temp_max_c"),
                temp_min_c=item.get("temp_min_c"),
                wind_max_kmh=item.get("wind_max_kmh"),
                pop_pct=item.get("pop_pct"),
            )
        )

    return WeatherResponse(
        current=CurrentWeather(
            temperature_c=data.get("temperature_c"),
            humidity_pct=data.get("humidity_pct"),
            precipitation_mm=data.get("precipitation_mm"),
            precipitation_probability_pct=data.get("precipitation_probability_pct"),
            wind_speed_kmh=data.get("wind_speed_kmh"),
            wind_gust_kmh=data.get("wind_gust_kmh"),
            wind_direction_deg=data.get("wind_direction_deg"),
            condition=data.get("condition"),
        ),
        daily=daily_rows,
        source=str(data.get("source", "OpenWeatherMap Live")),
    )
