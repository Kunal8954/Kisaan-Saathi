"""OCR and document-text extraction helpers for soil reports."""

from typing import Any


async def extract_text_from_document(uri: str, content_type: str) -> str:
    """Extract text from a PDF or image stored in GCS."""

    # TODO: route PDFs to pypdf and images to a vision/OCR provider; support Hindi.
    _ = (uri, content_type)
    raise NotImplementedError("Document OCR is not implemented yet.")


async def extract_soil_values(text: str) -> dict[str, Any]:
    """Extract lab names, units, and mineral values from soil-report text."""

    # TODO: use structured LLM output plus deterministic unit normalization.
    _ = text
    raise NotImplementedError("Soil value extraction is not implemented yet.")
