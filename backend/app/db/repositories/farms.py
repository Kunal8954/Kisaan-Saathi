"""Farm repository with geospatial query support."""

from typing import Any
from uuid import UUID

from app.models.farm import Farm


class FarmRepository:
    """Persistence operations for farm polygons."""

    def __init__(self, collection: Any | None = None) -> None:
        """Optionally inject a collection for tests."""

        self._collection = collection

    async def get_by_id(self, farm_id: UUID) -> Farm | None:
        """Fetch a farm by identifier."""

        # TODO: query the farms collection and validate the polygon.
        _ = (self._collection, farm_id)
        raise NotImplementedError("Farm lookup is not implemented yet.")

    async def upsert(self, farm: Farm) -> Farm:
        """Create or update a farm and its GeoJSON boundary."""

        # TODO: convert the WGS84 polygon to GeoJSON and upsert.
        _ = (self._collection, farm)
        raise NotImplementedError("Farm upsert is not implemented yet.")

    async def find_nearby(
        self,
        latitude: float,
        longitude: float,
        radius_m: float,
        limit: int = 20,
    ) -> list[Farm]:
        """Find farms whose centroid lies within a radius."""

        # TODO: use a 2dsphere index and $geoNear aggregation.
        _ = (self._collection, latitude, longitude, radius_m, limit)
        raise NotImplementedError("Nearby farm search is not implemented yet.")
