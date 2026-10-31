"""Google Vertex AI Gemini implementation of the LLM provider."""

from app.config import Settings
from app.llm.provider import LLMProvider, LLMRequest, LLMResponse


class GeminiProvider(LLMProvider):
    """Vertex AI Gemini adapter.

    Google SDK imports are intentionally deferred to method bodies so that the
    application can start and serve health checks without cloud credentials.
    """

    def __init__(self, settings: Settings) -> None:
        """Store validated settings for lazy client construction."""

        self._settings = settings

    async def generate(self, request: LLMRequest) -> LLMResponse:
        """Generate text with Gemini using the configured project and location."""

        # TODO: initialize vertexai lazily and call GenerativeModel.generate_content.
        _ = request
        raise NotImplementedError("Gemini text generation is not implemented yet.")

    async def generate_multimodal(self, request: LLMRequest) -> LLMResponse:
        """Generate text from text plus image/document URIs."""

        # TODO: download GCS media, attach parts, and request structured output.
        _ = request
        raise NotImplementedError("Gemini multimodal generation is not implemented yet.")

    async def embed(self, texts: list[str], model: str | None = None) -> list[list[float]]:
        """Create embeddings with the configured Vertex embedding model."""

        # TODO: call TextEmbeddingModel and batch requests within provider limits.
        _ = (texts, model)
        raise NotImplementedError("Gemini embeddings are not implemented yet.")
