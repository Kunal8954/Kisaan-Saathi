"""Government scheme advisory request and response schemas."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class GovernmentScheme(BaseModel):
    """Detailed verified government agricultural scheme."""

    id: str = Field(description="Unique scheme identifier (e.g. pmfby, pm-kisan)")
    name_hi: str = Field(description="Hindi scheme title")
    name_en: str = Field(description="English scheme title")
    category: Literal[
        "insurance", "income_support", "credit", "soil", "irrigation", "machinery"
    ] = Field(description="Scheme category")
    tagline_hi: str
    tagline_en: str
    description_hi: str
    description_en: str
    benefits_hi: list[str]
    benefits_en: list[str]
    eligibility_criteria_hi: list[str]
    eligibility_criteria_en: list[str]
    required_documents_hi: list[str]
    required_documents_en: list[str]
    official_portal: str
    helpline: str
    claim_steps_hi: list[str] | None = None
    claim_steps_en: list[str] | None = None


class SchemeAdviceRequest(BaseModel):
    """A farmer question to answer from the scheme document corpus."""

    question: str = Field(min_length=1, max_length=2_000)
    farmer_id: str | None = None
    state: str | None = None
    crop: str | None = None
    language: Literal["hi", "en"] = "hi"
    experience_mode: Literal["new_farmer", "experienced"] = "new_farmer"


class SchemeEligibilityInput(BaseModel):
    """Farmer details to evaluate scheme eligibility."""

    land_size_hectares: float = Field(ge=0.0, description="Farm size in hectares")
    state: str = Field(default="All", description="Indian State")
    crop_season: Literal["kharif", "rabi", "commercial", "all"] = "all"
    is_landowner: bool = True
    has_aadhaar: bool = True
    has_bank_account: bool = True


class SchemeEligibilityResult(BaseModel):
    """Evaluation output for one scheme."""

    scheme_id: str
    scheme_name_hi: str
    scheme_name_en: str
    is_eligible: bool
    status_label_hi: str
    status_label_en: str
    estimated_benefit_hi: str
    estimated_benefit_en: str
    reason_hi: str
    reason_en: str
    next_step_hi: str
    next_step_en: str


class SchemeAdviceResponse(BaseModel):
    """Structured grounded scheme guidance response."""

    query: str
    answer_hi: str
    answer_en: str
    relevant_schemes: list[GovernmentScheme] = Field(default_factory=list)
    claim_assistance: dict[str, str | list[str]] | None = None
    sources: list[str] = Field(default_factory=list)
    disclaimer: str = Field(
        default=(
            "यह जानकारी आधिकारिक सरकारी दिशा-निर्देशों पर आधारित है। "
            "योजना नियमों में राज्यवार अंतर हो सकता है।"
        )
    )
