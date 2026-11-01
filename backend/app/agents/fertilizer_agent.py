"""Fertilizer and crop nutrient specialist agent.

Analyzes crop growth stages, soil fertility indications, and deficiency symptoms.
Provides verified ICAR fertilizer schedules (NPK, Zinc, Sulphur, Bio-fertilizers),
application methods (basal, top-dressing, foliar spray), and soil testing guidelines.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from app.agents.state import AgentState
from app.models.farmer import Language


class FertilizerPlan(BaseModel):
    """Grounded fertilizer and nutrient recommendation model."""

    crop: str
    target_yield_qtl_ha: float = 45.0
    recommended_npk_ratio: str = "120:60:40 kg/ha"
    basal_dose: list[str] = Field(default_factory=list)
    top_dressing_stages: list[str] = Field(default_factory=list)
    micronutrient_guidance: list[str] = Field(default_factory=list)
    organic_supplements: list[str] = Field(default_factory=list)
    soil_testing_advisory: str
    precautions: list[str] = Field(default_factory=list)
    sources: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Authoritative ICAR Crop Nutrition Benchmarks
# ---------------------------------------------------------------------------
_NUTRITION_BENCHMARKS: dict[str, dict[str, Any]] = {
    "wheat": {
        "crop_hi": "गेहूं (Wheat)",
        "npk": "120:60:40 N:P:K kg/ha",
        "basal_hi": [
            "बुवाई के समय: 55 किग्रा डीएपी (DAP) + 27 किग्रा म्यूरेट ऑफ पोटाश (MOP) प्रति एकड़ डालें।",
            "जिंक की कमी होने पर 10 किग्रा जिंक सल्फेट (21%) प्रति एकड़ बेसल डोज में मिलाएं।",
        ],
        "basal_en": [
            "At sowing: Apply 55 kg DAP + 27 kg MOP per acre as basal fertilizer.",
            "If zinc deficiency exists, blend 10 kg Zinc Sulphate (21%) per acre.",
        ],
        "top_dressing_hi": [
            "पहला छिड़काव (CRI अवस्था, 21-25 दिन): 45 किग्रा नीम कोटेड यूरिया पहली सिंचाई के बाद डालें।",
            "दूसरा छिड़काव (कल्ले फूटने पर, 40-45 दिन): 45 किग्रा यूरिया दूसरी सिंचाई के साथ डालें।",
            (
                "फूल/बाली बनते समय (65 दिन): 19:19:19 घुलनशील NPK @ 1 किग्रा/100 लीटर पानी "
                "का फोलियर स्प्रे करें।"
            ),
        ],
        "top_dressing_en": [
            (
                "1st Top-Dressing (CRI stage, 21-25 days): Apply 45 kg Neem Coated Urea after "
                "first irrigation."
            ),
            "2nd Top-Dressing (Tillering, 40-45 days): Apply 45 kg Urea with second irrigation.",
            (
                "Pre-Flowering (65 days): Foliar spray of water-soluble 19:19:19 NPK @ "
                "1 kg/100L water."
            ),
        ],
        "organic_hi": [
            "बुवाई से 3 सप्ताह पूर्व 4-5 टन अच्छी सड़ी गोबर की खाद (FYM) प्रति एकड़ खेत में मिलाएं।",
            "अज़ोटोबैक्टर (Azotobacter) और PSB बायोफर्टिलाइजर से बीज उपचार अवश्य करें।",
        ],
        "organic_en": [
            "Incorporate 4-5 tons well-rotted FYM per acre 3 weeks prior to sowing.",
            "Treat seed with Azotobacter & PSB bio-fertilizers before drilling.",
        ],
        "sources": ["ICAR-IIWBR Wheat Package of Practices", "Soil Health Card Guidelines"],
    },
    "mustard": {
        "crop_hi": "सरसों / राई (Mustard)",
        "npk": "80:40:40 N:P:K + 30S kg/ha",
        "basal_hi": [
            (
                "बुवाई के समय: 35 किग्रा डीएपी + 20 किग्रा पोटाश + 10 किग्रा सल्फर बेंटोनाइट (90%) "
                "प्रति एकड़ डालें।"
            ),
            "सल्फर देने से तेल की मात्रा (Oil Content) 2-3% तक बढ़ जाती है।",
        ],
        "basal_en": [
            "At sowing: Apply 35 kg DAP + 20 kg Potash + 10 kg Sulphur bentonite (90%) per acre.",
            "Sulphur application increases seed oil content by 2-3%.",
        ],
        "top_dressing_hi": [
            "पहली सिंचाई (30-35 दिन, शाखाएं निकलते समय): 35 किग्रा नीम कोटेड यूरिया प्रति एकड़ दें।",
            "फूल आने की अवस्था में यूरिया न डालें, केवल 00:52:34 (0.5%) का स्प्रे करें।",
        ],
        "top_dressing_en": [
            "First irrigation (30-35 days, branching): Top-dress 35 kg Neem Coated Urea per acre.",
            "Avoid urea at flowering; spray 00:52:34 (MKP @ 0.5%) for healthy siliqua formation.",
        ],
        "organic_hi": [
            "3 टन वर्मीकम्पोस्ट (केंचुआ खाद) + 100 किग्रा नीम की खली प्रति एकड़ मिलाएं।",
        ],
        "organic_en": [
            "Apply 3 tons vermicompost + 100 kg neem cake per acre at land prep.",
        ],
        "sources": ["ICAR-DRMR Bharatpur Mustard Advisory", "Ministry of Agriculture Guidelines"],
    },
    "paddy": {
        "crop_hi": "धान / चावल (Paddy)",
        "npk": "120:60:40 N:P:K kg/ha",
        "basal_hi": [
            "रोपाई के समय: 50 किग्रा डीएपी + 30 किग्रा एमओपी + 10 किग्रा जिंक सल्फेट प्रति एकड़ डालें।",
        ],
        "basal_en": [
            "At transplanting: Apply 50 kg DAP + 30 kg MOP + 10 kg Zinc Sulphate per acre.",
        ],
        "top_dressing_hi": [
            "कल्ले फूटते समय (20-25 दिन): 35 किग्रा यूरिया प्रति एकड़।",
            "पैनिकिल इनिशिएशन (40-45 दिन): 35 किग्रा यूरिया प्रति एकड़।",
        ],
        "top_dressing_en": [
            "Active tillering (20-25 DAT): Top-dress 35 kg Urea per acre.",
            "Panicle initiation (40-45 DAT): Top-dress 35 kg Urea per acre.",
        ],
        "organic_hi": [
            "नीली-हरी शैवाल (Blue Green Algae) व एजोला (Azolla) का खेत में प्रयोग करें।",
        ],
        "organic_en": [
            "Incorporate Azolla dual cropping or Blue-Green Algae for biological nitrogen.",
        ],
        "sources": ["ICAR-NRRI Cuttack Rice Management", "ICAR Directorate of Rice Research"],
    },
}


async def run(state: AgentState) -> AgentState:
    """Specialist agent entry point for Fertilizer & Nutrient planning."""
    query = state.message or ""
    crop_input = str(state.context.get("crop") or "").lower()
    lang = state.language
    is_en = lang == Language.ENGLISH

    # Identify crop
    matched_key = "wheat"
    if "mustard" in crop_input or "सरसों" in query.lower() or "mustard" in query.lower():
        matched_key = "mustard"
    elif "paddy" in crop_input or "धान" in query.lower() or "rice" in query.lower():
        matched_key = "paddy"
    elif "wheat" in crop_input or "गेहूं" in query.lower() or "gehun" in query.lower():
        matched_key = "wheat"

    bench = _NUTRITION_BENCHMARKS[matched_key]
    basal = bench["basal_en"] if is_en else bench["basal_hi"]
    top_dressing = bench["top_dressing_en"] if is_en else bench["top_dressing_hi"]
    organic = bench["organic_en"] if is_en else bench["organic_hi"]

    soil_testing_note = (
        "Always conduct a Soil Health Card test before major fertilizer application. "
        "Avoid applying urea in dry soil or during peak afternoon heat."
        if is_en
        else "भारी उर्वरक प्रयोग से पहले मिट्टी की जांच (मृदा स्वास्थ्य कार्ड) अवश्य कराएं। "
        "सूखी मिट्टी या दोपहर की तेज धूप में यूरिया का छिड़काव न करें।"
    )

    plan = FertilizerPlan(
        crop=bench["crop_hi"] if not is_en else matched_key.title(),
        recommended_npk_ratio=bench["npk"],
        basal_dose=basal,
        top_dressing_stages=top_dressing,
        micronutrient_guidance=[
            "Zinc Sulphate (21%) @ 10 kg/acre if zinc deficiency symptoms appear."
            if is_en
            else "पत्तियों में पीलापन होने पर 10 किग्रा जिंक सल्फेट प्रति एकड़ डालें।"
        ],
        organic_supplements=organic,
        soil_testing_advisory=soil_testing_note,
        precautions=[
            "Maintain soil moisture before top-dressing urea."
            if is_en
            else "यूरिया डालने से पहले खेत में पर्याप्त नमी सुनिश्चित करें।"
        ],
        sources=bench["sources"],
    )

    state.result["fertilizer_plan"] = plan.model_dump(mode="json")
    state.sources.extend(plan.sources)
    return state
