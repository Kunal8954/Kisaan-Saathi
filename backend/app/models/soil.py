"""Soil test report and mineral recommendation models."""

from __future__ import annotations

from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class SoilParameter(BaseModel):
    """One soil test metric (e.g. pH, Organic Carbon, Nitrogen, Zinc)."""

    name: str = Field(description="Parameter display name")
    symbol: str = Field(description="Chemical symbol or shorthand, e.g. pH, N, P, K")
    value: float | None = Field(default=None, description="Measured numeric value")
    unit: str = Field(default="", description="Unit of measurement, e.g. %, kg/ha, ppm")
    rating: str = Field(
        description="Rating category: Low, Medium, High, Sufficient, Deficient, Optimal"
    )
    rating_hi: str = Field(description="Hindi rating label, e.g. कम, मध्यम, पर्याप्त, संतुलित")
    ideal_range: str = Field(description="Target agricultural benchmark range")
    interpretation_hi: str = Field(
        description="Hindi guidance on what this reading means for crops"
    )
    interpretation_en: str = Field(
        description="English guidance on what this reading means for crops"
    )


class SoilRecommendation(BaseModel):
    """Specific fertilizer or organic amendment recommendation."""

    category: str = Field(description="chemical, organic, or amendment")
    title_hi: str = Field(description="Hindi title")
    title_en: str = Field(description="English title")
    dosage_hi: str = Field(description="Prescribed dosage in Hindi (per acre)")
    dosage_en: str = Field(description="Prescribed dosage in English (per acre)")
    instructions_hi: str = Field(description="Detailed method of application in Hindi")
    instructions_en: str = Field(description="Detailed method of application in English")


class SoilAnalysisResponse(BaseModel):
    """Comprehensive parsed soil health card result."""

    id: UUID = Field(default_factory=uuid4)
    filename: str = Field(default="soil_test_report.pdf")
    health_score: int = Field(ge=0, le=100, description="Overall soil health index 0-100")
    health_status: str = Field(description="Good, Moderate, or Degraded")
    health_status_hi: str = Field(description="अच्छा, मध्यम, या सुधार आवश्यक")
    parameters: list[SoilParameter] = Field(default_factory=list)
    recommendations: list[SoilRecommendation] = Field(default_factory=list)
    disclaimer: str = Field(
        default=(
            "यह रिपोर्ट केवल सलाहकार उद्देश्य के लिए है। "
            "अंतिम उर्वरक मात्रा के लिए अपने नजदीकी कृषि विज्ञान केंद्र (KVK) से संपर्क करें।"
        )
    )
    sources: list[str] = Field(
        default_factory=lambda: [
            "ICAR Soil Health Card Scheme Guidelines",
            "Department of Agriculture & Farmers Welfare (DA&FW)",
            "National Project on Management of Soil Health & Fertility",
        ]
    )
