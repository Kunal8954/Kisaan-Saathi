"""MOSDAC adapter (optional ISRO weather/ocean/land data source)."""

from datetime import date
from typing import Any

from app.models.farm import GeoPoint


async def fetch_land_surface_temperature(
    location: GeoPoint,
    start_date: date,
    end_date: date,
) -> list[dict[str, Any]]:
    """Fetch land-surface temperature observations near a point."""

    # TODO: implement MOSDAC authentication, dataset selection, and unit conversion.
    _ = (location, start_date, end_date)
    raise NotImplementedError("MOSDAC land-surface temperature is not implemented yet.")


async def fetch_soil_moisture(
    location: GeoPoint,
    start_date: date,
    end_date: date,
) -> list[dict[str, Any]]:
    """Fetch soil-moisture observations near a point."""

    # TODO: implement MOSDAC authentication and dataset selection.
    _ = (location, start_date, end_date)
    raise NotImplementedError("MOSDAC soil moisture is not implemented yet.")
