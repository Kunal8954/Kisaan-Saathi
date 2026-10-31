"""Atlas Vector Search retriever for scheme and crop-knowledge documents."""

from typing import Any

from pydantic import BaseModel, Field


class RetrievedDocument(BaseModel):
    """A citation-ready retrieval result."""

    document_id: str
    chunk_id: str
    text: str
    source: str
    score: float
    metadata: dict[str, Any] = Field(default_factory=dict)


async def retrieve(
    query: str,
    top_k: int = 5,
    filters: dict[str, Any] | None = None,
) -> list[RetrievedDocument]:
    """Embed a query and run Atlas Vector Search over scheme/crop chunks."""

    # TODO: call EmbeddingService, build the $vectorSearch stage, and rerank results.
    _ = (query, top_k, filters)
    raise NotImplementedError("Vector retrieval is not implemented yet.")


async def retrieve_for_scheme(
    question: str,
    state: str | None = None,
    crop: str | None = None,
    top_k: int = 6,
) -> list[RetrievedDocument]:
    """Retrieve scheme passages with optional state and crop filters."""

    # TODO: construct metadata filters for state/crop and call retrieve().
    _ = (question, state, crop, top_k)
    raise NotImplementedError("Scheme retrieval is not implemented yet.")
