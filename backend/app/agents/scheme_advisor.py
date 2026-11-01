"""Government-scheme advisor agent grounded in Meko retrieval."""

from app.agents.state import AgentState
from app.config import get_settings
from app.llm.provider import LLMMessage, LLMRequest, MessageRole, get_llm_provider
from app.models.farmer import Language


async def run(state: AgentState) -> AgentState:
    """Answer a scheme question using grounded retrieval and citations."""

    if not get_settings().meko_api_key:
        raise RuntimeError("MEKO_API_KEY is required for scheme advice.")

    from app.rag.retriever import retrieve_for_scheme

    documents = await retrieve_for_scheme(
        state.message,
        state.context.get("state"),
        state.context.get("crop"),
    )
    if not documents:
        raise RuntimeError("No verified scheme evidence matched this question.")

    evidence = "\n\n".join(
        f"[{document.document_id}] {document.text}" for document in documents
    )
    is_en = state.language == Language.ENGLISH
    response = await get_llm_provider().generate(
        LLMRequest(
            messages=[
                LLMMessage(
                    role=MessageRole.SYSTEM,
                    content=(
                        "Answer only from the supplied government-scheme evidence. "
                        "If it does not answer the question, say so and ask for details. "
                        f"Respond in {'English' if is_en else 'Hindi'} and cite source IDs."
                    ),
                ),
                LLMMessage(
                    role=MessageRole.USER,
                    content=f"Question:\n{state.message}\n\nEvidence:\n{evidence}",
                ),
            ],
            temperature=0.1,
            max_output_tokens=700,
        )
    )
    state.result["general_reply"] = response.text.strip()
    state.sources.extend(document.source for document in documents)
    return state
