"""Government scheme advisory endpoint."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from app.models.scheme import (
    GovernmentScheme,
    SchemeAdviceRequest,
    SchemeAdviceResponse,
    SchemeEligibilityInput,
    SchemeEligibilityResult,
)
from app.services.schemes_service import (
    answer_scheme_query,
    evaluate_farmer_eligibility,
    get_all_schemes,
    get_scheme_by_id,
)

router = APIRouter(prefix="/schemes", tags=["scheme-advisor"])


@router.get("", response_model=list[GovernmentScheme], status_code=status.HTTP_200_OK)
async def list_schemes(
    category: Annotated[str | None, Query(description="Filter by category")] = None,
) -> list[GovernmentScheme]:
    """Return all verified government agricultural schemes."""
    return get_all_schemes(category)


@router.get("/{scheme_id}", response_model=GovernmentScheme, status_code=status.HTTP_200_OK)
async def get_scheme(scheme_id: str) -> GovernmentScheme:
    """Return details of a specific agricultural scheme."""
    scheme = get_scheme_by_id(scheme_id)
    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scheme '{scheme_id}' was not found.",
        )
    return scheme


@router.post(
    "/evaluate",
    response_model=list[SchemeEligibilityResult],
    status_code=status.HTTP_200_OK,
)
async def evaluate_eligibility(
    farmer_data: SchemeEligibilityInput,
) -> list[SchemeEligibilityResult]:
    """Calculate personalized farmer eligibility and estimated benefits."""
    return evaluate_farmer_eligibility(farmer_data)


@router.post("/advice", response_model=SchemeAdviceResponse, status_code=status.HTTP_200_OK)
async def get_scheme_advice(request: SchemeAdviceRequest) -> SchemeAdviceResponse:
    """Retrieve grounded scheme passages, insurance claim help, and eligibility guidance."""
    return answer_scheme_query(request)
