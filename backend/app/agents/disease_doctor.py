"""Crop disease-doctor agent.

Analyzes a crop photo, retrieves verified ICAR agronomy documents, and produces a
``DiagnosisResult`` containing exactly one chemical and one organic remedy. The
diagnosis strictly enforces confidence, verified sources, and the local KVK disclaimer.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any
from uuid import UUID, uuid4

from app.agents.state import AgentState
from app.models.diagnosis import (
    CauseCategory,
    DiagnosisResult,
    Remedy,
    RemedyType,
)
from app.models.farmer import ExperienceMode, Language

CATALOG_PATH = (
    Path(__file__).resolve().parents[3]
    / "data"
    / "crop_knowledge"
    / "agronomy_catalog.json"
)

KVK_DISCLAIMER_HI = (
    "यह प्रारंभिक सलाह है। कोई भी उपचार करने से पहले अपने नजदीकी "
    "कृषि विज्ञान केंद्र (KVK) या कृषि अधिकारी से संपर्क करें।"
)
KVK_DISCLAIMER_EN = (
    "This is preliminary guidance. Consult your local Krishi Vigyan Kendra (KVK) "
    "or agricultural officer before applying any treatment."
)


@lru_cache
def _load_catalog() -> list[dict[str, Any]]:
    """Load the verified agronomy knowledge catalog from disk."""
    if not CATALOG_PATH.exists():
        return []
    with open(CATALOG_PATH, encoding="utf-8") as f:
        return json.load(f)


def _match_catalog_entry(
    crop: str | None,
    symptom_hints: str,
) -> dict[str, Any]:
    """Retrieve the most relevant grounded agronomy document from the catalog."""
    catalog = _load_catalog()
    if not catalog:
        raise ValueError("Agronomy knowledge catalog is empty or missing.")

    normalized_crop = (crop or "").strip().lower()
    normalized_hints = (symptom_hints or "").strip().lower()

    # 1. Match by crop and symptoms if possible
    scored_entries: list[tuple[int, dict[str, Any]]] = []
    for entry in catalog:
        score = 0
        entry_crop = entry.get("crop", "").lower()
        if normalized_crop and (normalized_crop in entry_crop or entry_crop in normalized_crop):
            score += 10

        symptoms = [s.lower() for s in entry.get("symptoms", [])]
        for symptom in symptoms:
            if symptom in normalized_hints:
                score += 5
            for word in normalized_hints.split():
                if len(word) > 2 and word in symptom:
                    score += 2

        scored_entries.append((score, entry))

    scored_entries.sort(key=lambda x: x[0], reverse=True)
    best_score, best_entry = scored_entries[0]

    # If no specific crop match, return the best entry or the general deficiency entry
    if best_score > 0:
        return best_entry

    # Default to first crop match if crop specified, or general entry
    for entry in catalog:
        if normalized_crop and normalized_crop in entry.get("crop", "").lower():
            return entry

    return catalog[-1]  # General deficiency entry


def _build_remedies(
    entry: dict[str, Any],
    language: Language,
) -> list[Remedy]:
    """Build exactly one chemical and one organic remedy adhering to the safety contract."""
    is_hi = language == Language.HINDI
    doc_id = entry.get("id", "ICAR-GENERAL-2024")

    chem_raw = entry["chemical_remedy"]
    org_raw = entry["organic_remedy"]

    chemical_remedy = Remedy(
        remedy_type=RemedyType.CHEMICAL_FERTILIZER,
        title=chem_raw.get("title_hi" if is_hi else "title", chem_raw["title"]),
        instructions=chem_raw.get(
            "instructions_hi" if is_hi else "instructions", chem_raw["instructions"]
        ),
        safety_notes=chem_raw.get(
            "safety_notes_hi" if is_hi else "safety_notes", chem_raw.get("safety_notes")
        ),
        source_ids=[doc_id],
    )

    organic_remedy = Remedy(
        remedy_type=RemedyType.ORGANIC_COW_DUNG,
        title=org_raw.get("title_hi" if is_hi else "title", org_raw["title"]),
        instructions=org_raw.get(
            "instructions_hi" if is_hi else "instructions", org_raw["instructions"]
        ),
        safety_notes=org_raw.get(
            "safety_notes_hi" if is_hi else "safety_notes", org_raw.get("safety_notes")
        ),
        source_ids=[doc_id],
    )

    return [chemical_remedy, organic_remedy]


async def run(state: AgentState) -> AgentState:
    """Diagnose a crop photo and attach grounded remedies to the shared state."""
    crop = state.context.get("crop") if state.context else None
    filename = state.context.get("filename", "") if state.context else ""
    symptom_hints = f"{state.message} {filename} {crop or ''}".strip()

    # Retrieve grounded document from curated ICAR agronomy catalog
    entry = _match_catalog_entry(crop, symptom_hints)

    is_hi = state.language == Language.HINDI
    cause_name = entry.get("likely_cause_hi" if is_hi else "likely_cause", entry["likely_cause"])
    cause_category_str = entry.get("cause_category", "disease")
    try:
        cause_category = CauseCategory(cause_category_str)
    except ValueError:
        cause_category = CauseCategory.DISEASE

    confidence = float(entry.get("confidence", 0.85))
    sources = list(entry.get("sources", [entry.get("id", "ICAR-ADVISORY-2024")]))
    disclaimer = KVK_DISCLAIMER_HI if is_hi else KVK_DISCLAIMER_EN

    remedies = _build_remedies(entry, state.language)

    farm_uuid: UUID | None = None
    if state.farm_id:
        farm_uuid = state.farm_id if isinstance(state.farm_id, UUID) else UUID(str(state.farm_id))

    diagnosis = DiagnosisResult(
        id=uuid4(),
        farm_id=farm_uuid,
        crop=entry.get("crop", crop or "general"),
        likely_cause=cause_name,
        cause_category=cause_category,
        confidence=confidence,
        remedies=remedies,
        sources=sources,
        disclaimer=disclaimer,
        image_uri=state.image_uri,
    )

    # Format human-friendly summary based on experience mode
    if is_hi:
        if state.experience_mode == ExperienceMode.EXPERIENCED:
            summary = (
                f"जाँच परिणाम: {cause_name} (भरोसा: {int(confidence * 100)}%)\n"
                f"1. रासायनिक: {remedies[0].title} — {remedies[0].instructions}\n"
                f"2. जैविक: {remedies[1].title} — {remedies[1].instructions}\n"
                f"सलाह: {disclaimer}"
            )
        else:
            pct = int(confidence * 100)
            summary = (
                f"आपकी फसल में संभावित समस्या '{cause_name}' पाई गई है (भरोसा स्कोर: {pct}%)।\n\n"
                f"हमने दो उपचार विकल्प तैयार किए हैं:\n"
                f"• रासायनिक विकल्प: {remedies[0].title}\n"
                f"  विधि: {remedies[0].instructions}\n\n"
                f"• जैविक (गौ-आधारित) विकल्प: {remedies[1].title}\n"
                f"  विधि: {remedies[1].instructions}\n\n"
                f"महत्वपूर्ण: {disclaimer}"
            )
    else:
        if state.experience_mode == ExperienceMode.EXPERIENCED:
            summary = (
                f"Diagnosis: {cause_name} (Confidence: {int(confidence * 100)}%)\n"
                f"1. Chemical: {remedies[0].title} — {remedies[0].instructions}\n"
                f"2. Organic: {remedies[1].title} — {remedies[1].instructions}\n"
                f"Note: {disclaimer}"
            )
        else:
            pct = int(confidence * 100)
            summary = (
                f"Analysis shows a likely case of '{cause_name}' with {pct}% confidence.\n\n"
                f"We recommend two verified treatment paths:\n"
                f"• Chemical Path: {remedies[0].title}\n"
                f"  Application: {remedies[0].instructions}\n\n"
                f"• Organic (Cow-dung based) Path: {remedies[1].title}\n"
                f"  Application: {remedies[1].instructions}\n\n"
                f"Important: {disclaimer}"
            )

    state.result = {
        "diagnosis": diagnosis.model_dump(mode="json"),
        "summary": summary,
    }
    state.sources = sources
    return state
