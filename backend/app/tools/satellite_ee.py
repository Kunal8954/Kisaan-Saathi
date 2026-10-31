"""Google Earth Engine adapter (primary satellite source).

The adapter will expose polygon-level NDVI anomaly, NDMI, land-surface temperature,
and soil-moisture observations. Earth Engine is initialized lazily.
"""

from datetime import date
from typing import Any

from app.models.farm import GeoPoint


def initialize_earth_engine() -> None:
    """Authenticate and initialize the Earth Engine Python client."""

    # TODO: use settings.gee_* credentials without logging the private key.
    raise NotImplementedError("Earth Engine initialization is not implemented yet.")


async def compute_stress_metrics(
    boundary: list[GeoPoint],
    start_date: date,
    end_date: date,
) -> dict[str, Any]:
    """Compute satellite stress indicators for a farm polygon and date window."""

    # TODO: build an ee.Geometry, mask clouds, reduce imagery, and calculate anomalies.
    _ = (boundary, start_date, end_date)
    raise NotImplementedError("Earth Engine stress metrics are not implemented yet.")


async def get_ndvi_timeseries(
    boundary: list[GeoPoint],
    start_date: date,
    end_date: date,
) -> list[dict[str, Any]]:
    """Return a dated NDVI time series for the farm polygon."""

    # TODO: sample the configured Sentinel-2/Landsat collection at a stable interval.
    _ = (boundary, start_date, end_date)
    raise NotImplementedError("Earth Engine NDVI time series is not implemented yet.")
