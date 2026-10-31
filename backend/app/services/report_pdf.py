"""Insurance evidence PDF renderer."""

from app.models.report import InsuranceEvidenceReport


async def build_insurance_report_pdf(report: InsuranceEvidenceReport) -> bytes:
    """Render an evidence report PDF with maps, photos, weather, and disclaimers."""

    # TODO: use ReportLab, embed a stress map and thumbnails, and support Devanagari.
    _ = report
    raise NotImplementedError("Insurance report PDF rendering is not implemented yet.")


async def store_report_pdf(pdf_bytes: bytes, farmer_id: str, report_id: str) -> str:
    """Store a generated PDF in GCS and return its object URI."""

    # TODO: upload with a non-guessable object path and return gs:// URI.
    _ = (pdf_bytes, farmer_id, report_id)
    raise NotImplementedError("Insurance report storage is not implemented yet.")
