"""Groq OpenAI-compatible text and vision provider."""

from __future__ import annotations

from typing import Any

import httpx

from app.config import Settings
from app.llm.provider import LLMProvider, LLMRequest, LLMResponse, LLMUsage


class GroqProvider(LLMProvider):
    """Call Groq without local or fabricated response fallbacks."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def _headers(self) -> dict[str, str]:
        if not self._settings.groq_api_key:
            raise RuntimeError("GROQ_API_KEY is not configured.")
        return {
            "Authorization": f"Bearer {self._settings.groq_api_key}",
            "Content-Type": "application/json",
        }

    async def _complete(self, payload: dict[str, Any], vision: bool = False) -> LLMResponse:
        try:
            async with httpx.AsyncClient(
                base_url=self._settings.groq_base_url,
                timeout=self._settings.groq_timeout_seconds,
            ) as client:
                response = await client.post(
                    "/chat/completions", headers=self._headers(), json=payload
                )
        except httpx.TimeoutException as exc:
            raise RuntimeError("Groq request timed out; please retry.") from exc
        except httpx.RequestError as exc:
            raise RuntimeError(f"Groq request failed: {exc}") from exc

        if response.status_code == 401:
            raise RuntimeError("Groq authentication failed. Check GROQ_API_KEY.")
        if response.status_code == 429:
            raise RuntimeError("Groq rate limit reached; please retry later.")
        if response.status_code >= 400:
            label = "vision " if vision else ""
            raise RuntimeError(f"Groq {label}API error ({response.status_code}): {response.text}")

        body = response.json()
        choices = body.get("choices")
        msg = choices[0].get("message", {}) if choices else {}
        content = msg.get("content") or msg.get("reasoning")
        if not content:
            raise RuntimeError("Groq returned no generated content.")

        usage = body.get("usage", {})
        return LLMResponse(
            text=content,
            model=body.get("model", self._settings.groq_model),
            finish_reason=choices[0].get("finish_reason") if choices else None,
            usage=LLMUsage(
                input_tokens=usage.get("prompt_tokens"),
                output_tokens=usage.get("completion_tokens"),
            ),
        )

    async def generate(self, request: LLMRequest) -> LLMResponse:
        """Generate text from the configured Groq model."""
        payload: dict[str, Any] = {
            "model": self._settings.groq_model,
            "messages": [
                {"role": message.role.value, "content": message.content}
                for message in request.messages
            ],
            "temperature": request.temperature,
            "max_tokens": request.max_output_tokens,
        }
        if request.response_schema is not None:
            payload["response_format"] = {"type": "json_object"}
        return await self._complete(payload)

    async def generate_multimodal(self, request: LLMRequest) -> LLMResponse:
        """Generate a response with image data URLs through Groq vision."""
        if not any(message.image_uris for message in request.messages):
            raise ValueError("At least one image is required for multimodal generation.")

        messages_payload: list[dict[str, Any]] = []
        for message in request.messages:
            content_items: list[dict[str, Any]] = [{"type": "text", "text": message.content}]
            for image in message.image_uris:
                content_items.append({"type": "image_url", "image_url": {"url": image}})
            messages_payload.append({
                "role": message.role.value,
                "content": content_items,
            })

        payload: dict[str, Any] = {
            "model": self._settings.groq_vision_model,
            "messages": messages_payload,
            "temperature": request.temperature,
            "max_tokens": request.max_output_tokens,
        }
        return await self._complete(payload, vision=True)

    async def embed(self, texts: list[str], model: str | None = None) -> list[list[float]]:
        """Fail explicitly because Groq is a generation provider, not an embedder."""
        _ = (texts, model)
        raise RuntimeError("Groq does not provide embeddings.")
