"""Soil test report analysis endpoint."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.models.soil import SoilAnalysisResponse
from app.services.soil_parser import parse_soil_document

router = APIRouter(prefix="/soil", tags=["soil-analyst"])

MAX_REPORT_BYTES = 20 * 1024 * 1024  # 20 MB max file upload
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".webp", ".txt"}


@router.post("", response_model=SoilAnalysisResponse, status_code=status.HTTP_200_OK)
async def analyze_soil_report(
    file: Annotated[UploadFile, File(description="Soil test report PDF, image, or text.")],
    farmer_id: Annotated[str, Form(description="Farmer identifier.")] = "anonymous",
    farm_id: Annotated[str | None, Form(description="Farm identifier.")] = None,
    language: Annotated[str, Form()] = "hi",
) -> SoilAnalysisResponse:
    """Parse a soil-test report and return mineral recommendations."""
    filename = (file.filename or "soil_test.pdf").lower()
    is_valid_ext = any(filename.endswith(ext) for ext in ALLOWED_EXTENSIONS)
    content_type = file.content_type or "application/pdf"

    if not is_valid_ext and not (
        content_type == "application/pdf"
        or content_type.startswith("image/")
        or content_type.startswith("text/")
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a PDF document, image (JPEG, PNG, WebP), or text report.",
        )

    try:
        content = await file.read()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not read uploaded report file.",
        ) from exc

    if len(content) > MAX_REPORT_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file exceeds 20 MB limit.",
        )

    _ = (farmer_id, farm_id, language)
    return await parse_soil_document(content, file.filename or "soil_test.pdf")
