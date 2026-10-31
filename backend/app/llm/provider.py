"""Provider-agnostic LLM, multimodal, embedding, and speech interfaces.

Agents and routes must depend on these abstractions rather than vendor SDKs. The
Google implementation lives in ``gemini.py`` and ``speech.py`` and can be replaced
without changing business code.
"""

from abc import ABC, abstractmethod
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field

from app.config import get_settings


class MessageRole(StrEnum):
    """Roles accepted by chat-style models."""

    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


class LLMMessage(BaseModel):
    """One text or multimodal message."""

    role: MessageRole
    content: str
    image_uris: list[str] = Field(default_factory=list)


class LLMRequest(BaseModel):
    """Provider-neutral generation request."""

    messages: list[LLMMessage] = Field(min_length=1)
    temperature: float = Field(default=0.2, ge=0.0, le=2.0)
    max_output_tokens: int = Field(default=2048, gt=0)
    response_schema: dict[str, Any] | None = Field(
        default=None,
        description="Optional JSON schema for structured output.",
    )


class LLMUsage(BaseModel):
    """Token accounting returned by a provider when available."""

    input_tokens: int | None = None
    output_tokens: int | None = None


class LLMResponse(BaseModel):
    """Provider-neutral generation result."""

    text: str
    model: str
    finish_reason: str | None = None
    usage: LLMUsage = Field(default_factory=LLMUsage)


class SpeechTranscription(BaseModel):
    """Speech-to-text result."""

    text: str
    language_code: str
    confidence: float | None = Field(default=None, ge=0.0, le=1.0)
    duration_seconds: float | None = Field(default=None, ge=0.0)


class SpeechSynthesisRequest(BaseModel):
    """Text-to-speech request."""

    text: str = Field(min_length=1)
    language_code: str = "hi-IN"
    voice: str | None = None
    audio_encoding: str = "MP3"


class SpeechAudio(BaseModel):
    """Synthesized audio payload."""

    content: bytes
    mime_type: str
    language_code: str


class LLMProvider(ABC):
    """Abstract text, multimodal, and embedding provider."""

    @abstractmethod
    async def generate(self, request: LLMRequest) -> LLMResponse:
        """Generate text from a provider-neutral request."""

        raise NotImplementedError

    @abstractmethod
    async def generate_multimodal(self, request: LLMRequest) -> LLMResponse:
        """Generate text using attached images or documents."""

        raise NotImplementedError

    @abstractmethod
    async def embed(self, texts: list[str], model: str | None = None) -> list[list[float]]:
        """Embed documents or queries into a shared vector space."""

        raise NotImplementedError


class SpeechProvider(ABC):
    """Abstract speech-to-text and text-to-speech provider."""

    @abstractmethod
    async def transcribe(self, audio: bytes, language_code: str = "hi-IN") -> SpeechTranscription:
        """Transcribe spoken Hindi or English audio."""

        raise NotImplementedError

    @abstractmethod
    async def synthesize(self, request: SpeechSynthesisRequest) -> SpeechAudio:
        """Synthesize natural speech from text."""

        raise NotImplementedError


def get_llm_provider() -> LLMProvider:
    """Return the configured LLM provider implementation."""

    from app.llm.gemini import GeminiProvider

    return GeminiProvider(get_settings())


def get_speech_provider() -> SpeechProvider:
    """Return the configured speech provider implementation."""

    from app.llm.speech import GoogleSpeechProvider

    return GoogleSpeechProvider(get_settings())
