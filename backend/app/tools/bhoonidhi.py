"""Bhoonidhi STAC adapter (optional ISRO satellite source)."""

from datetime import date
from typing import Any


async def search_stac(
    bbox: tuple[float, float, float, float],
    start_date: date,
    end_date: date,
    collections: list[str] | None = None,
) -> list[dict[str, Any]]:
    """Search Bhoonidhi STAC items intersecting a bounding box and date window."""

    # TODO: implement paginated STAC search with the configured API key.
    _ = (bbox, start_date, end_date, collections)
    raise NotImplementedError("Bhoonidhi STAC search is not implemented yet.")


async def get_asset_href(item_id: str) -> str:
    """Resolve a signed download URL for a Bhoonidhi STAC item."""

    # TODO: read item assets and request a short-lived signed URL.
    _ = item_id
    raise NotImplementedError("Bhoonidhi asset resolution is not implemented yet.")
