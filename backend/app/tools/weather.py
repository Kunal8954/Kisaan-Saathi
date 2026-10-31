"""Weather data adapter used by crop planning and insurance reports."""

from datetime import date

from app.models.farm import GeoPoint
from app.models.report import WeatherSnapshot


async def get_weather_history(
    location: GeoPoint,
    start_date: date,
    end_date: date,
) -> list[WeatherSnapshot]:
    """Return daily rainfall and temperature observations for a location."""

    # TODO: call the configured weather provider and normalize to WeatherSnapshot.
    _ = (location, start_date, end_date)
    raise NotImplementedError("Weather history is not implemented yet.")


async def get_weather_forecast(
    location: GeoPoint,
    days: int = 7,
) -> list[dict[str, object]]:
    """Return a short-range forecast for farmer alerts."""

    # TODO: call the configured forecast API and localize units and language.
    _ = (location, days)
    raise NotImplementedError("Weather forecast is not implemented yet.")
