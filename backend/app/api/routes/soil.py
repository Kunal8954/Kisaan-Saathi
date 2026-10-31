"""Soil test report analysis endpoint."""

from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

router = APIRouter(prefix="/soil", tags=["soil-analyst"])


@router.post("", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def analyze_soil_report(
    file: Annotated[UploadFile, File(description="Soil test report PDF or image.")],
    farmer_id: Annotated[str, Form(description="Farmer identifier.")],
    farm_id: Annotated[str | None, Form(description="Farm identifier.")] = None,
    language: Annotated[str, Form()] = "hi",
) -> None:
    """Parse a soil-test report and return mineral recommendations."""

    # TODO: store the document, run OCR/PDF extraction, interpret minerals, persist.
    _ = (file, farmer_id, farm_id, language)
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Soil report analysis is not implemented yet.",
    )
