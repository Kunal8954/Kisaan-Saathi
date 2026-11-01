"""General conversational and agricultural assistant agent."""

from __future__ import annotations

from app.agents.state import AgentState
from app.config import get_settings
from app.llm.provider import LLMMessage, LLMRequest, MessageRole, get_llm_provider
from app.models.farmer import Language

GREETING_WORDS = {
    "नमस्ते", "नमस्कार", "हेलो", "हैलो", "प्रणाम", "राम राम", "जय किसान",
    "hello", "hi", "hey", "good morning", "good evening", "how are you",
    "who are you", "आप कौन हो", "तुम कौन हो", "help", "मदद",
}

DEFAULT_GREETING_HI = (
    "नमस्ते किसान साथी! मैं आपका डिजिटल कृषि सलाहकार हूँ।\n\n"
    "आप मुझसे अपनी फसल के बारे में कुछ भी पूछ सकते हैं:\n"
    "• रोग और कीट की रोकथाम (उपचार व दवा)\n"
    "• खाद और पोषण (यूरिया, डीएपी, जिंक की सही मात्रा)\n"
    "• फसल की फोटो भेजकर रोग की जाँच (Crop Health)\n"
    "• सरकारी योजनाएँ (PM-KISAN, PMFBY, KCC)\n\n"
    "बताइए, आज आपकी किस फसल या समस्या में सहायता करूँ?"
)

DEFAULT_GREETING_EN = (
    "Hello Farmer! I am Kisan Saathi, your digital agricultural advisor.\n\n"
    "You can ask me about:\n"
    "• Crop disease diagnosis & sprays (organic and chemical remedies)\n"
    "• Fertilizer doses (NPK, Urea, DAP, micronutrients)\n"
    "• Crop photo health check (/diagnose)\n"
    "• Government schemes (PM-KISAN, PMFBY, KCC)\n\n"
    "Which crop or farming topic can I help you with today?"
)

CROP_SEASON_GUIDANCE_HI = (
    "फसल योजना और बुवाई परामर्श:\n\n"
    "• रबी सीजन (सर्दियां): गेहूं (HD-2967, DBW-187), सरसों (पूसा बोल्ड, RH-749), "
    "चना, मटर, आलू और जौ की बुवाई के लिए उपयुक्त समय है।\n"
    "• खरीफ सीजन (मानसून): धान, कपास, मक्का, बाजरा, उड़द, मूंग और सोयाबीन।\n"
    "• जायद सीजन (गर्मी): मूंग, उड़द, ककड़ी, खीरा और तरबूज।\n\n"
    "अपनी जमीन, मिट्टी के प्रकार और सिंचाई साधन के अनुसार विशिष्ट सलाह के लिए अपनी फसल का नाम बताएं।"
)

CROP_SEASON_GUIDANCE_EN = (
    "Crop Planning & Sowing Advisory:\n\n"
    "• Rabi Season (Winter): Ideal for Wheat (HD-2967, DBW-187), Mustard (Pusa Bold), "
    "Gram, Pea, and Potato.\n"
    "• Kharif Season (Monsoon): Paddy/Rice, Cotton, Maize, Pearl Millet, and Soybean.\n"
    "• Zaid Season (Summer): Green Gram, Black Gram, Cucumber, and Watermelon.\n\n"
    "Please tell me your crop name, soil type, and irrigation source for a tailored schedule."
)


async def run(state: AgentState) -> AgentState:
    """Provide intelligent agricultural chat replies without hallucinating disease diagnosis."""
    settings = get_settings()
    is_en = state.language == Language.ENGLISH
    msg_lower = state.message.strip().lower()

    # Check if message is a simple greeting
    is_greeting = any(w in msg_lower for w in GREETING_WORDS) and len(msg_lower.split()) <= 4
    if is_greeting:
        state.result["general_reply"] = DEFAULT_GREETING_EN if is_en else DEFAULT_GREETING_HI
        return state

    is_crop_plan = any(
        w in msg_lower
        for w in ["फसल", "बोएं", "बुवाई", "पैदावार", "सीजन", "crop", "sow", "plant", "season"]
    )

    # 1. If LLM provider (Groq or Gemini) is available, use generative answer
    if settings.groq_api_key or settings.google_cloud_project:
        try:
            llm = get_llm_provider()
            system_prompt = (
                "You are Kisan Saathi (किसान साथी), an expert, empathetic AI agricultural "
                "advisor for Indian farmers. "
                "Answer the farmer's question practical, step-by-step, and respectfully. "
                "Do NOT hallucinate a crop disease diagnosis unless the user specifically asks "
                "about a plant disease with symptoms. "
                f"Respond in {'English' if is_en else 'Hindi'}. "
                "Keep your response clear, structured, and farmer-friendly."
            )
            response = await llm.generate(
                LLMRequest(
                    messages=[
                        LLMMessage(role=MessageRole.SYSTEM, content=system_prompt),
                        LLMMessage(role=MessageRole.USER, content=state.message),
                    ],
                    max_output_tokens=700,
                    temperature=0.2,
                )
            )
            if response.text and len(response.text.strip()) > 10:
                state.result["general_reply"] = response.text.strip()
                state.sources.append("ICAR Package of Practices & Agricultural Extension")
                return state
        except Exception:
            pass

    # 2. Grounded deterministic offline fallbacks
    if is_greeting:
        state.result["general_reply"] = DEFAULT_GREETING_EN if is_en else DEFAULT_GREETING_HI
    elif is_crop_plan:
        state.result["general_reply"] = (
            CROP_SEASON_GUIDANCE_EN if is_en else CROP_SEASON_GUIDANCE_HI
        )
    else:
        state.result["general_reply"] = (
            (
                f"Thank you for contacting Kisan Saathi. Regarding '{state.message}': "
                "Please specify your crop (e.g. Wheat, Rice, Mustard) and what you need "
                "assistance with (pest/disease treatment, fertilizer doses, or schemes)."
            )
            if is_en
            else (
                f"किसान साथी में आपका स्वागत है। आपके सवाल '{state.message}' के संदर्भ में: "
                "कृपया अपनी फसल का नाम (जैसे गेहूं, धान, सरसों, आलू) और आवश्यक विषय "
                "(कीट/रोग उपचार, खाद की मात्रा, या सरकारी योजनाएं) बताएं।"
            )
        )

    state.sources.append("ICAR Farmer Advisory Guidelines")
    return state
