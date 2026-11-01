"""Crop photo diagnosis endpoint."""

from __future__ import annotations

import base64
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.agents import disease_doctor
from app.agents.state import AgentState, Intent
from app.models.diagnosis import DiagnosisResult
from app.models.farmer import ExperienceMode, Language

router = APIRouter(prefix="/diagnose", tags=["disease-doctor"])

MAX_IMAGE_BYTES = 15 * 1024 * 1024  # 15 MB max image upload
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


@router.post("", response_model=DiagnosisResult, status_code=status.HTTP_200_OK)
async def diagnose_crop(
    file: Annotated[UploadFile, File(description="Crop photo (JPEG, PNG, or WebP).")],
    farmer_id: Annotated[str, Form(description="Farmer identifier.")] = "anonymous",
    crop: Annotated[str | None, Form(description="Crop name, if known.")] = None,
    farm_id: Annotated[str | None, Form(description="Farm identifier.")] = None,
    experience_mode: Annotated[str, Form()] = "new_farmer",
    language: Annotated[str, Form()] = "hi",
) -> DiagnosisResult:
    """Accept a crop photo and return a grounded diagnosis with exactly two remedies."""
    content_type = file.content_type or "image/jpeg"
    filename = (file.filename or "").lower()

    is_valid_ext = any(filename.endswith(ext) for ext in ALLOWED_EXTENSIONS)
    if not is_valid_ext and not content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image (JPEG, PNG, or WebP).",
        )

    try:
        content = await file.read()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not read uploaded file.",
        ) from exc

    if len(content) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded image exceeds 15 MB limit.",
        )

    # Encode as base64 data URI for state transport
    b64_data = base64.b64encode(content).decode("ascii")
    data_uri = f"data:{content_type};base64,{b64_data}"

    parsed_farm_id: UUID | None = None
    if farm_id:
        try:
            parsed_farm_id = UUID(farm_id)
        except ValueError:
            parsed_farm_id = None

    parsed_farmer_id: UUID | None = None
    if farmer_id and farmer_id != "anonymous":
        try:
            parsed_farmer_id = UUID(farmer_id)
        except ValueError:
            parsed_farmer_id = None

    parsed_mode = (
        ExperienceMode.EXPERIENCED
        if experience_mode == "experienced"
        else ExperienceMode.NEW_FARMER
    )
    parsed_lang = Language.ENGLISH if language == "en" else Language.HINDI

    state = AgentState(
        farmer_id=parsed_farmer_id,
        farm_id=parsed_farm_id,
        intent=Intent.DISEASE_DOCTOR,
        language=parsed_lang,
        experience_mode=parsed_mode,
        image_uri=data_uri,
        message=f"Please analyze crop disease for {crop or 'crop'}.",
        context={
            "crop": crop,
            "filename": file.filename,
        },
    )

    try:
        result_state = await disease_doctor.run(state)
    except (RuntimeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    diagnosis_data = result_state.result.get("diagnosis")

    if not diagnosis_data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate grounded diagnosis.",
        )

    return DiagnosisResult.model_validate(diagnosis_data)
