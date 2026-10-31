"""Crop-insurance evidence report endpoint."""

from fastapi import APIRouter, HTTPException, status

from app.models.report import InsuranceReportRequest

router = APIRouter(prefix="/reports", tags=["insurance-report"])


@router.post("/insurance", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def create_insurance_report(request: InsuranceReportRequest) -> None:
    """Combine satellite, weather, and photo evidence into a PDF report."""

    # TODO: gather evidence, render a PDF, store it in GCS, and return a signed URL.
    _ = request
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Insurance evidence reports are not implemented yet.",
    )
