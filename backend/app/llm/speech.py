"""Google Cloud Speech-to-Text and Text-to-Speech implementation."""

from app.config import Settings
from app.llm.provider import (
    SpeechAudio,
    SpeechProvider,
    SpeechSynthesisRequest,
    SpeechTranscription,
)


class GoogleSpeechProvider(SpeechProvider):
    """Google speech adapter with ``hi-IN`` defaults and lazy SDK imports."""

    def __init__(self, settings: Settings) -> None:
        """Store validated settings for lazy client construction."""

        self._settings = settings

    async def transcribe(self, audio: bytes, language_code: str = "hi-IN") -> SpeechTranscription:
        """Transcribe audio using Google Cloud Speech-to-Text."""

        # TODO: select encoding/sample rate, call recognize, and map confidence.
        _ = (audio, language_code)
        raise NotImplementedError("Google speech-to-text is not implemented yet.")

    async def synthesize(self, request: SpeechSynthesisRequest) -> SpeechAudio:
        """Synthesize Hindi speech using Google Cloud Text-to-Speech."""

        # TODO: call the TTS client, return audio bytes and MIME type.
        _ = request
        raise NotImplementedError("Google text-to-speech is not implemented yet.")
