"""Conversational chat endpoint.

Hands the turn to the LangGraph multi-agent orchestrator.
"""

from __future__ import annotations

from fastapi import APIRouter, status

from app.agents.orchestrator import run_chat
from app.models.chat import ChatRequest, ChatResponse

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse, status_code=status.HTTP_200_OK)
async def chat(request: ChatRequest) -> ChatResponse:
    """Route a farmer message to the appropriate specialist agent."""
    return await run_chat(request)
