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

    if not query.strip():
        raise ValueError("query must not be empty.")
    if top_k < 1:
        raise ValueError("top_k must be greater than zero.")
    from app.rag.meko import MekoClient

    documents = await MekoClient().search(query, top_k=top_k)
    if not filters:
        return documents
    return [
        document
        for document in documents
        if all(document.metadata.get(key) == value for key, value in filters.items())
    ]


async def retrieve_for_scheme(
    question: str,
    state: str | None = None,
    crop: str | None = None,
    top_k: int = 6,
) -> list[RetrievedDocument]:
    """Retrieve scheme passages with optional state and crop filters."""

    filters = {key: value for key, value in {"state": state, "crop": crop}.items() if value}
    return await retrieve(question, top_k=top_k, filters=filters or None)
