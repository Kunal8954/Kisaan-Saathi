"""Safety-contract tests for the diagnosis schema."""

from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.models.diagnosis import CauseCategory, DiagnosisResult, Remedy, RemedyType


def _remedy(remedy_type: RemedyType, source_id: str) -> Remedy:
    return Remedy(
        remedy_type=remedy_type,
        title="Example remedy",
        instructions="Example instructions grounded in the cited document.",
        source_ids=[source_id],
    )


def test_diagnosis_requires_confidence_disclaimer_and_sources() -> None:
    """A valid diagnosis carries the mandatory safety fields and two remedies."""

    result = DiagnosisResult(
        farm_id=uuid4(),
        crop="wheat",
        likely_cause="nitrogen deficiency",
        cause_category=CauseCategory.NUTRIENT_DEFICIENCY,
        confidence=0.72,
        remedies=[
            _remedy(RemedyType.CHEMICAL_FERTILIZER, "doc-chemical"),
            _remedy(RemedyType.ORGANIC_COW_DUNG, "doc-organic"),
        ],
        sources=["doc-chemical", "doc-organic"],
        disclaimer="Consult your local KVK before applying any treatment.",
    )

    assert 0.0 <= result.confidence <= 1.0
    assert result.disclaimer
    assert result.sources
    assert len(result.remedies) == 2


def test_diagnosis_rejects_two_remedies_from_the_same_track() -> None:
    """The schema enforces one chemical and one organic remedy."""

    with pytest.raises(ValidationError):
        DiagnosisResult(
            likely_cause="nitrogen deficiency",
            cause_category=CauseCategory.NUTRIENT_DEFICIENCY,
            confidence=0.7,
            remedies=[
                _remedy(RemedyType.CHEMICAL_FERTILIZER, "doc-a"),
                _remedy(RemedyType.CHEMICAL_FERTILIZER, "doc-b"),
            ],
            sources=["doc-a", "doc-b"],
            disclaimer="Consult your local KVK before applying any treatment.",
        )
