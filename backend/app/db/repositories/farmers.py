"""Farmer profile repository."""

from typing import Any
from uuid import UUID

from app.models.farmer import FarmerProfile


class FarmerRepository:
    """Persistence operations for farmer profiles."""

    def __init__(self, collection: Any | None = None) -> None:
        """Optionally inject a collection for tests."""

        self._collection = collection

    async def get_by_id(self, farmer_id: UUID) -> FarmerProfile | None:
        """Fetch a farmer profile by identifier."""

        # TODO: query the farmers collection and validate the document.
        _ = (self._collection, farmer_id)
        raise NotImplementedError("Farmer lookup is not implemented yet.")

    async def upsert(self, farmer: FarmerProfile) -> FarmerProfile:
        """Create or update a farmer profile."""

        # TODO: upsert by UUID with timestamps and schema validation.
        _ = (self._collection, farmer)
        raise NotImplementedError("Farmer upsert is not implemented yet.")
