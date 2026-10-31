"""Government scheme advisory endpoint."""

from fastapi import APIRouter, HTTPException, status

from app.models.scheme import SchemeAdviceRequest

router = APIRouter(prefix="/schemes", tags=["scheme-advisor"])


@router.post("/advice", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def get_scheme_advice(request: SchemeAdviceRequest) -> None:
    """Retrieve scheme passages and return eligibility or claim guidance."""

    # TODO: run Atlas Vector Search, rerank, and ground the answer in cited documents.
    _ = request
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Scheme advisory is not implemented yet.",
    )
