"""Conversational chat endpoint.

The route will hand the turn to the LangGraph orchestrator once agent logic exists.
"""

from fastapi import APIRouter, HTTPException, status

from app.models.chat import ChatRequest, ChatResponse

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse, status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def chat(request: ChatRequest) -> ChatResponse:
    """Route a farmer message to the appropriate specialist agent."""

    # TODO: lazily import the orchestrator and call ``run_chat(request)``.
    _ = request
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Chat orchestration is not implemented yet.",
    )
