"""Crop photo diagnosis endpoint."""

from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

router = APIRouter(prefix="/diagnose", tags=["disease-doctor"])


@router.post("", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def diagnose_crop(
    file: Annotated[UploadFile, File(description="Crop photo (JPEG or PNG).")],
    farmer_id: Annotated[str, Form(description="Farmer identifier.")],
    crop: Annotated[str | None, Form(description="Crop name, if known.")] = None,
    farm_id: Annotated[str | None, Form(description="Farm identifier.")] = None,
    experience_mode: Annotated[str, Form()] = "new_farmer",
    language: Annotated[str, Form()] = "hi",
) -> None:
    """Accept a crop photo and return a grounded diagnosis and two remedies."""

    # TODO: upload to GCS, OCR/vision-diagnose, retrieve grounded remedies, persist.
    _ = (file, farmer_id, crop, farm_id, experience_mode, language)
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Crop photo diagnosis is not implemented yet.",
    )
