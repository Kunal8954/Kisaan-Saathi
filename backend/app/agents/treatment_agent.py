"""Treatment and crop protection specialist agent.

Formulates comprehensive 5-tier Integrated Pest Management (IPM) strategies:
1. Immediate field sanitation actions
2. Organic & natural bio-extract methods (Neem oil, bio-slurry)
3. Biological controls (Trichoderma, Pseudomonas, Bt)
4. Verified CIBRC chemical fungicides/insecticides with exact dosages
5. Critical safety precautions & Pre-Harvest Intervals (PHI) in days
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from app.agents.state import AgentState
from app.models.farmer import Language


class TreatmentPlan(BaseModel):
    """5-tier Integrated Pest Management (IPM) crop treatment model."""

    target_condition: str
    crop: str
    immediate_actions: list[str] = Field(default_factory=list)
    organic_methods: list[str] = Field(default_factory=list)
    biological_methods: list[str] = Field(default_factory=list)
    chemical_methods: list[str] = Field(default_factory=list)
    precautions: list[str] = Field(default_factory=list)
    pre_harvest_interval_days: int = 14
    disclaimer: str
    sources: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Standard IPM Benchmark Protocols
# ---------------------------------------------------------------------------
_TREATMENT_PROTOCOLS: dict[str, dict[str, Any]] = {
    "rust": {
        "title_hi": "गेहूं का पीला / भूरा रतुआ (Rust Disease)",
        "title_en": "Yellow / Brown Stripe Rust (Puccinia striiformis)",
        "immediate_hi": [
            "खेत से संक्रमित पत्तियों या शुरुआती रोगी पौधों को उखाड़कर नष्ट करें (Roguing)।",
            "यूरिया का अत्यधिक प्रयोग तुरंत रोकें, क्योंकि अधिक नाइट्रोजन फंगस को बढ़ाता है।",
            "खेत में पानी का भराव न होने दें; जल निकासी दुरुस्त रखें।",
        ],
        "immediate_en": [
            "Rogue out and safely bury initial infected plants away from the field.",
            "Cease excessive nitrogen top-dressing; excess N accelerates rust pustule spread.",
            "Ensure proper field drainage to reduce canopy humidity.",
        ],
        "organic_hi": [
            "नीम का तेल (Neem Oil 1500 ppm) @ 4-5 मिली प्रति लीटर पानी में थोड़ा सर्फ मिलाकर छिड़काव करें।",
            "खट्टी छाछ (5-7 दिन पुरानी लस्सी) @ 50 मिली प्रति लीटर पानी का छिड़काव फंगस रोकता है।",
        ],
        "organic_en": [
            "Foliar spray of cold-pressed Neem Oil (1500 ppm) @ 4-5 ml/L with mild surfactant.",
            "Fermented sour buttermilk (5-7 days old) @ 50 ml/L as a protective antifungal wash.",
        ],
        "biological_hi": [
            "ट्राइकोडर्मा हार्जिएनम (Trichoderma harzianum 2% WP) @ 5 ग्राम प्रति लीटर पानी का स्प्रे करें।",
            "स्यूडोमोनास फ्लोरोसेंस (Pseudomonas fluorescens) @ 5 ग्राम प्रति लीटर पत्तों पर छिड़कें।",
        ],
        "biological_en": [
            "Foliar spray of Trichoderma harzianum (2% WP) @ 5g/L water during overcast morning.",
            "Apply Pseudomonas fluorescens (1% WP) @ 5g/L as a biological antagonist.",
        ],
        "chemical_hi": [
            (
                "प्रोपिकोनाजोल 25% EC (Propiconazole - उदा. टिल्ट) @ 1 मिली प्रति लीटर पानी "
                "(200 मिली प्रति एकड़) छिड़कें।"
            ),
            "अथवा टेबुकोनाजोल 25.9% EC @ 1 मिली प्रति लीटर पानी का छिड़काव करें।",
        ],
        "chemical_en": [
            "Propiconazole 25% EC @ 1.0 ml/L water (200 ml in 200L water per acre).",
            (
                "Alternatively, Tebuconazole 25.9% EC @ 1.0 ml/L water at first "
                "appearance of pustules."
            ),
        ],
        "phi_days": 21,
        "precautions_hi": [
            "दवा छिड़कते समय मास्क और दस्ताने पहनें। हवा की विपरीत दिशा में कभी स्प्रे न करें।",
            "फसल कटाई से कम से कम 21 दिन पहले रासायनिक छिड़काव बंद करें (Pre-Harvest Interval: 21 दिन)।",
        ],
        "precautions_en": [
            "Wear protective mask and gloves; never spray against wind direction.",
            "Strictly observe a 21-day Pre-Harvest Interval (PHI) before harvesting grain.",
        ],
        "sources": ["ICAR-IIWBR Rust Protection Advisory", "CIBRC Approved Fungicides List 2024"],
    },
    "blight": {
        "title_hi": "पत्ती झुलसा / ब्लाइट (Blight Disease)",
        "title_en": "Leaf Blight / Spot (Alternaria / Helminthosporium)",
        "immediate_hi": [
            "खेत में खरपतवार तुरंत निकालें ताकि पौधों को पर्याप्त धूप और हवा मिले।",
            "फसल अवशेषों को जलाएं नहीं बल्कि ट्राइकोडर्मा डालकर जमीन में मिलाएं।",
        ],
        "immediate_en": [
            "Remove weeds to ensure adequate sunlight penetration and airflow.",
            "Incorporate crop residues using bio-decomposers rather than burning.",
        ],
        "organic_hi": [
            "दशपर्णी अर्क @ 20 मिली प्रति लीटर अथवा नीम अर्क का छिड़काव करें।",
        ],
        "organic_en": [
            "Apply Dashparni Ark @ 20 ml/L or botanical neem kernel extract.",
        ],
        "biological_hi": [
            "ट्राइकोडर्मा विरिडी @ 5 ग्राम प्रति लीटर पानी का छिड़काव करें।",
        ],
        "biological_en": [
            "Bio-spray of Trichoderma viride @ 5g/L water.",
        ],
        "chemical_hi": [
            "मैंकोजेब 75% WP (Mancozeb - M-45) @ 2.5 ग्राम प्रति लीटर पानी में मिलाकर छिड़कें।",
            "गंभीर स्थिति में एजोक्सीस्ट्रोबिन + डाइफेनोकोनाजोल @ 1 मिली प्रति लीटर पानी डालें।",
        ],
        "chemical_en": [
            "Mancozeb 75% WP @ 2.5 g/L water (500g in 200L water per acre).",
            "In severe blight, Azoxystrobin 18.2% + Difenoconazole 11.4% SC @ 1.0 ml/L.",
        ],
        "phi_days": 14,
        "precautions_hi": [
            "PHI 14 दिन: कटाई से 14 दिन पूर्व रसायन बंद करें। धूप में छिड़काव से बचें।",
        ],
        "precautions_en": [
            "PHI 14 Days: Cease chemical application 14 days prior to harvest.",
        ],
        "sources": ["ICAR All India Coordinated Research Project", "KVK Plant Clinic Protocols"],
    },
}


async def run(state: AgentState) -> AgentState:
    """Specialist agent entry point for Treatment & Crop Protection."""
    query = state.message or ""
    diag_data = state.result.get("diagnosis", {})
    likely_cause = str(diag_data.get("likely_cause") or query).lower()
    crop = str(state.context.get("crop") or "Crop")
    lang = state.language
    is_en = lang == Language.ENGLISH

    # Select protocol
    if "rust" in likely_cause or "रतुआ" in likely_cause or "पीला" in likely_cause:
        proto = _TREATMENT_PROTOCOLS["rust"]
    else:
        proto = _TREATMENT_PROTOCOLS["blight"]

    disclaimer = (
        "Consult your local Krishi Vigyan Kendra (KVK) or agricultural officer "
        "before chemical spraying."
        if is_en
        else "रासायनिक छिड़काव से पहले अपने नजदीकी कृषि विज्ञान केंद्र (KVK) से परामर्श अवश्य लें।"
    )

    plan = TreatmentPlan(
        target_condition=proto["title_en"] if is_en else proto["title_hi"],
        crop=crop,
        immediate_actions=proto["immediate_en"] if is_en else proto["immediate_hi"],
        organic_methods=proto["organic_en"] if is_en else proto["organic_hi"],
        biological_methods=proto["biological_en"] if is_en else proto["biological_hi"],
        chemical_methods=proto["chemical_en"] if is_en else proto["chemical_hi"],
        precautions=proto["precautions_en"] if is_en else proto["precautions_hi"],
        pre_harvest_interval_days=proto["phi_days"],
        disclaimer=disclaimer,
        sources=proto["sources"],
    )

    state.result["treatment_plan"] = plan.model_dump(mode="json")
    state.sources.extend(plan.sources)
    return state
