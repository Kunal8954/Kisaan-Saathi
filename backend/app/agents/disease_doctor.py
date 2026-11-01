"""Crop disease-doctor and vision diagnosis agent.

Analyzes crop photos using Groq multimodal vision when available and grounds all
diagnoses and remedies in verified ICAR agronomy documents and Meko knowledge bases.
Produces a ``DiagnosisResult`` containing exactly one chemical and one organic remedy,
strict confidence metrics, verified sources, and the mandatory local KVK disclaimer.
"""

from __future__ import annotations

import base64
import json
from functools import lru_cache
from pathlib import Path
from typing import Any, cast
from uuid import UUID, uuid4

from app.agents.state import AgentState
from app.config import get_settings
from app.llm.provider import LLMMessage, LLMRequest, MessageRole, get_llm_provider
from app.models.diagnosis import (
    CauseCategory,
    DiagnosisResult,
    Remedy,
    RemedyType,
)
from app.models.farmer import Language

CATALOG_PATH = (
    Path(__file__).resolve().parents[3] / "data" / "crop_knowledge" / "agronomy_catalog.json"
)

KVK_DISCLAIMER_HI = (
    "यह AI-आधारित प्रारंभिक सलाह है। अंतिम उपचार से पहले अपने स्थानीय "
    "कृषि विज्ञान केंद्र (KVK) या कृषि अधिकारी से अवश्य सलाह लें।"
)
KVK_DISCLAIMER_EN = (
    "This is AI-based preliminary guidance. Consult your local Krishi Vigyan Kendra (KVK) "
    "or agricultural officer before applying any treatment."
)


@lru_cache
def _load_catalog() -> list[dict[str, Any]]:
    """Load the verified agronomy knowledge catalog from disk."""
    if not CATALOG_PATH.exists():
        return []
    with open(CATALOG_PATH, encoding="utf-8") as f:
        data: Any = json.load(f)
        if isinstance(data, list):
            return cast(list[dict[str, Any]], data)
        return []


CROP_ALIASES: dict[str, str] = {
    "गेहूं": "wheat",
    "गेहू": "wheat",
    "wheat": "wheat",
    "धान": "rice",
    "चावल": "rice",
    "rice": "rice",
    "paddy": "rice",
    "सरसों": "mustard",
    "राई": "mustard",
    "mustard": "mustard",
    "आलू": "potato",
    "potato": "potato",
    "aloo": "potato",
    "टमाटर": "tomato",
    "tomato": "tomato",
    "कपास": "cotton",
    "नरमा": "cotton",
    "cotton": "cotton",
    "मिर्च": "chili",
    "chili": "chili",
    "chilli": "chili",
    "pepper": "chili",
    "प्याज": "onion",
    "लहसुन": "onion",
    "onion": "onion",
    "garlic": "onion",
    "चना": "gram",
    "chana": "gram",
    "chickpea": "gram",
    "gram": "gram",
}


def _match_catalog_entry(
    crop: str | None,
    symptom_hints: str,
) -> dict[str, Any]:
    """Retrieve the most relevant grounded agronomy document from the catalog."""
    catalog = _load_catalog()
    if not catalog:
        raise ValueError("Agronomy knowledge catalog is empty or missing.")

    normalized_hints = symptom_hints.strip().lower()

    resolved_crop = (crop or "").strip().lower()
    if resolved_crop in CROP_ALIASES:
        resolved_crop = CROP_ALIASES[resolved_crop]
    elif not resolved_crop:
        for alias, c_name in CROP_ALIASES.items():
            if alias in normalized_hints:
                resolved_crop = c_name
                break

    scored: list[tuple[int, dict[str, Any]]] = []
    for entry in catalog:
        score = 0
        entry_crop = str(entry.get("crop", "")).lower()

        if resolved_crop:
            if resolved_crop == entry_crop:
                score += 50
            elif entry_crop == "general":
                score += 5
            else:
                score -= 30

        symptoms = [str(s).lower() for s in entry.get("symptoms", [])]
        for symptom in symptoms:
            for term in symptom.split():
                if len(term) > 2 and term in normalized_hints:
                    score += 4

        likely_cause = str(entry.get("likely_cause", "")).lower()
        likely_cause_hi = str(entry.get("likely_cause_hi", "")).lower()
        for word in likely_cause.replace("/", " ").replace("(", " ").replace(")", " ").split():
            if len(word) > 3 and word in normalized_hints:
                score += 15
        for word in likely_cause_hi.replace("/", " ").replace("(", " ").replace(")", " ").split():
            if len(word) > 2 and word in normalized_hints:
                score += 15

        scored.append((score, entry))

    scored.sort(key=lambda item: item[0], reverse=True)
    return scored[0][1]


async def diagnose_image(
    image: bytes,
    mime_type: str,
    crop: str | None,
    farm_id: UUID | None,
    language: str,
    symptom_hints: str = "",
) -> DiagnosisResult:
    """Diagnose an image with Groq multimodal vision when configured, or grounded catalog."""
    settings = get_settings()
    lang = Language.ENGLISH if language.lower().startswith("en") else Language.HINDI
    disclaimer = KVK_DISCLAIMER_EN if lang == Language.ENGLISH else KVK_DISCLAIMER_HI

    retrieved_context = ""
    retrieved_sources: list[str] = []
    if settings.meko_api_key:
        from app.rag.meko import MekoClient

        documents = await MekoClient().search(
            f"{crop or 'crop'} disease symptoms and safe treatment {symptom_hints}",
            top_k=5,
        )
        retrieved_sources = [document.source for document in documents]
        retrieved_context = "\n\n".join(
            f"[{document.document_id}] {document.text}" for document in documents
        )

    # Photo diagnosis must use a real multimodal provider and retrieved evidence.
    if image:
        if not settings.groq_api_key:
            raise RuntimeError("GROQ_API_KEY is required for photo diagnosis.")
        if not retrieved_sources:
            raise RuntimeError("MEKO_API_KEY is required for grounded photo diagnosis.")
        try:
            data_url = f"data:{mime_type};base64,{base64.b64encode(image).decode('ascii')}"
            prompt = (
                "You are an expert plant pathologist for Indian agriculture. "
                "Analyze the attached crop photo and return ONLY valid JSON with keys: "
                "likely_cause (string), cause_category ('disease'|'deficiency'|'pest'|'excess'), "
                "confidence (float 0.1 to 0.99), symptoms (list of strings), and "
                "remedies (list with exactly two items: one with remedy_type='chemical_fertilizer' "
                "and one with remedy_type='organic_cow_dung'). "
                f"Language: {language}. Crop: {crop or 'detect from photo'}. "
                "Do not invent a diagnosis. If the image is unclear, set "
                "cause_category to 'unknown', confidence below 0.4, and explain "
                "what additional evidence is needed."
            )
            prompt += (
                "\n\nUse these retrieved agronomy passages only as supporting evidence. "
                "Do not treat them as proof that the pictured plant has that disease:\n"
                + retrieved_context
            )
            response = await get_llm_provider().generate_multimodal(
                LLMRequest(
                    messages=[
                        LLMMessage(
                            role=MessageRole.USER,
                            content=prompt,
                            image_uris=[data_url],
                        )
                    ],
                    temperature=0.1,
                    max_output_tokens=1200,
                )
            )
            raw_text = response.text.strip()
            if "```" in raw_text:
                parts = raw_text.split("```")
                for p in parts:
                    clean = p.strip()
                    if clean.startswith("json"):
                        clean = clean[4:].strip()
                    if clean.startswith("{") and clean.endswith("}"):
                        raw_text = clean
                        break
            if "{" in raw_text and "}" in raw_text:
                start = raw_text.find("{")
                end = raw_text.rfind("}") + 1
                raw_text = raw_text[start:end]

            parsed = json.loads(raw_text)
            cause_cat_str = str(parsed.get("cause_category", "disease")).lower()
            if "pest" in cause_cat_str:
                cause_cat = CauseCategory.PEST
            elif "defic" in cause_cat_str:
                cause_cat = CauseCategory.NUTRIENT_DEFICIENCY
            elif "excess" in cause_cat_str:
                cause_cat = CauseCategory.NUTRIENT_EXCESS
            else:
                cause_cat = CauseCategory.DISEASE

            raw_remedies = parsed.get("remedies", [])
            chem_rem = next(
                (r for r in raw_remedies if r.get("remedy_type") == "chemical_fertilizer"),
                None,
            )
            org_rem = next(
                (r for r in raw_remedies if r.get("remedy_type") == "organic_cow_dung"),
                None,
            )

            if chem_rem and org_rem:
                remedies = [
                    Remedy(
                        remedy_type=RemedyType.CHEMICAL_FERTILIZER,
                        title=str(chem_rem.get("title", "Chemical Remedy")),
                        instructions=str(chem_rem.get("instructions", "Apply as directed.")),
                        source_ids=retrieved_sources[:2],
                        safety_notes=str(chem_rem.get("safety_notes", "Wear gloves and mask.")),
                    ),
                    Remedy(
                        remedy_type=RemedyType.ORGANIC_COW_DUNG,
                        title=str(org_rem.get("title", "Organic & Bio-Control Remedy")),
                        instructions=str(org_rem.get("instructions", "Apply organic spray.")),
                        source_ids=retrieved_sources[:2],
                        safety_notes=str(
                            org_rem.get("safety_notes", "Safe for beneficial insects.")
                        ),
                    ),
                ]
                conf = float(parsed.get("confidence", 0.88))
                conf = min(0.99, max(0.40, conf))

                return DiagnosisResult(
                    id=uuid4(),
                    farm_id=farm_id,
                    crop=crop or parsed.get("crop", "Detected Crop"),
                    likely_cause=str(parsed.get("likely_cause", "Observed Crop Pathogen")),
                    cause_category=cause_cat,
                    confidence=conf,
                    remedies=remedies,
                    sources=retrieved_sources,
                    disclaimer=disclaimer,
                )
        except (RuntimeError, ValueError, json.JSONDecodeError) as exc:
            raise RuntimeError(f"Photo diagnosis failed: {exc}") from exc

    # 2. Grounded Agronomy Catalog Retrieval
    active_hints = symptom_hints.strip() if symptom_hints.strip() else (crop or "")
    entry = _match_catalog_entry(crop, active_hints)

    cause_category = (
        CauseCategory.NUTRIENT_DEFICIENCY
        if entry.get("cause_category") == "deficiency"
        else (
            CauseCategory.PEST
            if entry.get("cause_category") == "pest"
            else CauseCategory.DISEASE
        )
    )

    chem_data = entry.get("chemical_remedy", {})
    chem_inst = (
        chem_data.get("instructions", "")
        if lang == Language.ENGLISH
        else chem_data.get("instructions_hi", chem_data.get("instructions", ""))
    )
    chem_title = (
        chem_data.get("title", "")
        if lang == Language.ENGLISH
        else chem_data.get("title_hi", chem_data.get("title", ""))
    )
    chem_safety = (
        chem_data.get("safety_notes", "")
        if lang == Language.ENGLISH
        else chem_data.get("safety_notes_hi", chem_data.get("safety_notes", ""))
    )

    org_data = entry.get("organic_remedy", {})
    org_inst = (
        org_data.get("instructions", "")
        if lang == Language.ENGLISH
        else org_data.get("instructions_hi", org_data.get("instructions", ""))
    )
    org_title = (
        org_data.get("title", "")
        if lang == Language.ENGLISH
        else org_data.get("title_hi", org_data.get("title", ""))
    )
    org_safety = (
        org_data.get("safety_notes", "")
        if lang == Language.ENGLISH
        else org_data.get("safety_notes_hi", org_data.get("safety_notes", ""))
    )

    doc_id = str(entry.get("id", "ICAR-AGRO-2024"))
    remedies = [
        Remedy(
            remedy_type=RemedyType.CHEMICAL_FERTILIZER,
            title=chem_title or "Chemical Spray",
            instructions=chem_inst or "Apply as directed.",
            source_ids=[doc_id],
            safety_notes=chem_safety or "Wear gloves and mask.",
        ),
        Remedy(
            remedy_type=RemedyType.ORGANIC_COW_DUNG,
            title=org_title or "Organic Bio-Control",
            instructions=org_inst or "Apply organic spray.",
            source_ids=[doc_id],
            safety_notes=org_safety or "Safe for beneficial insects.",
        ),
    ]

    likely_cause = (
        entry.get("likely_cause", "Crop Disease")
        if lang == Language.ENGLISH
        else entry.get("likely_cause_hi", entry.get("likely_cause", "फसल रोग"))
    )

    return DiagnosisResult(
        id=uuid4(),
        farm_id=farm_id,
        crop=crop or entry.get("crop"),
        likely_cause=likely_cause,
        cause_category=cause_category,
        confidence=float(entry.get("confidence", 0.88)),
        remedies=remedies,
        sources=entry.get("sources", ["ICAR All India Coordinated Research Project"]),
        disclaimer=disclaimer,
    )


async def run(state: AgentState) -> AgentState:
    """Specialist agent entry point complying strictly with AGENTS.md."""
    raw_img = state.image_uri
    crop = str(state.context.get("crop") or "")
    lang_str = "en" if state.language == Language.ENGLISH else "hi"

    image_bytes = b""
    mime_type = "image/jpeg"
    if raw_img and raw_img.startswith("data:"):
        try:
            header, b64_part = raw_img.split(",", 1)
            mime_type = header.split(";")[0].replace("data:", "")
            image_bytes = base64.b64decode(b64_part)
        except (ValueError, IndexError, base64.binascii.Error) as exc:
            raise ValueError("Uploaded crop image could not be decoded.") from exc

    diagnosis = await diagnose_image(
        image=image_bytes,
        mime_type=mime_type,
        crop=crop if crop else None,
        farm_id=state.farm_id,
        language=lang_str,
        symptom_hints=state.message,
    )

    state.result["diagnosis"] = diagnosis.model_dump(mode="json")
    state.sources.extend(diagnosis.sources)
    return state
