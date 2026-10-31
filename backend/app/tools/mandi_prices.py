"""Mandi price and demand adapter."""

from datetime import date
from typing import Any


async def get_mandi_prices(
    commodity: str,
    state: str | None = None,
    district: str | None = None,
    on_date: date | None = None,
    limit: int = 50,
) -> list[dict[str, Any]]:
    """Fetch recent mandi prices for a commodity and optional location filters."""

    # TODO: query the data.gov.in mandi resource and normalize price units.
    _ = (commodity, state, district, on_date, limit)
    raise NotImplementedError("Mandi prices are not implemented yet.")


async def get_price_trend(
    commodity: str,
    state: str,
    district: str,
    days: int = 90,
) -> list[dict[str, Any]]:
    """Return a daily price trend used by the crop planner."""

    # TODO: aggregate mandi records into a comparable daily series.
    _ = (commodity, state, district, days)
    raise NotImplementedError("Mandi price trends are not implemented yet.")
