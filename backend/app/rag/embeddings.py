"""Embedding service used by document ingestion and retrieval."""

from app.llm.provider import LLMProvider, get_llm_provider


class EmbeddingService:
    """Thin provider-neutral wrapper for document and query embeddings."""

    def __init__(self, provider: LLMProvider | None = None) -> None:
        """Accept an injected provider to keep tests and agents vendor-independent."""

        self._provider = provider or get_llm_provider()

    async def embed_documents(self, texts: list[str]) -> list[list[float]]:
        """Embed document chunks in batches."""

        # TODO: batch, retry with backoff, and validate vector dimensions.
        _ = texts
        raise NotImplementedError("Document embeddings are not implemented yet.")

    async def embed_query(self, text: str) -> list[float]:
        """Embed a single search query."""

        # TODO: reuse provider embedding model and validate dimensions.
        _ = text
        raise NotImplementedError("Query embeddings are not implemented yet.")
