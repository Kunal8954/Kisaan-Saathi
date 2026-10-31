"""Insurance evidence report repository."""

from typing import Any
from uuid import UUID

from app.models.report import InsuranceEvidenceReport


class ReportRepository:
    """Persistence operations for generated evidence reports."""

    def __init__(self, collection: Any | None = None) -> None:
        """Optionally inject a collection for tests."""

        self._collection = collection

    async def save(self, report: InsuranceEvidenceReport) -> UUID:
        """Persist a report and return its identifier."""

        # TODO: store report metadata and the GCS PDF URI.
        _ = (self._collection, report)
        raise NotImplementedError("Report persistence is not implemented yet.")

    async def get_by_id(self, report_id: UUID) -> InsuranceEvidenceReport | None:
        """Fetch a report by identifier."""

        # TODO: query the reports collection and validate the document.
        _ = (self._collection, report_id)
        raise NotImplementedError("Report lookup is not implemented yet.")
