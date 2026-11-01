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
    english_chars = sum(1 for c in state.message if "a" <= c.lower() <= "z")
    is_en = state.language == Language.ENGLISH or (
        english_chars > 6 and english_chars > len(state.message) * 0.4
    )
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
    is_weather_query = any(
        w in msg_lower
        for w in [
            "मौसम", "तापमान", "बारिश", "हवा", "गर्मी", "सर्दी", "कोहरा", "धूप", "बादल",
            "weather", "temperature", "temp", "rain", "wind", "humidity", "climate", "forecast",
        ]
    )

    weather_context = ""
    if is_weather_query:
        try:
            from app.tools.weather import get_weather_rag_context
            latitude = state.context.get("latitude") or state.context.get("lat")
            longitude = state.context.get("longitude") or state.context.get("lon")
            if latitude is None or longitude is None:
                raise ValueError("Location is required for a weather question.")
            lat = float(latitude)
            lon = float(longitude)
            loc_name = str(state.context.get("location_name") or "")
            weather_context = await get_weather_rag_context(
                lat=lat,
                lon=lon,
                location_name=loc_name,
                language="en" if is_en else "hi",
            )
        except (ValueError, RuntimeError):
            weather_context = ""

    rag_context = ""
    rag_sources: list[str] = []
    if settings.meko_api_key and not is_greeting:
        from app.rag.meko import MekoClient

        documents = await MekoClient().search(state.message, top_k=5)
        rag_sources = [document.source for document in documents]
        rag_context = "\n\n".join(
            f"[{document.document_id}] {document.text}" for document in documents
        )

    # 1. If LLM provider (Groq or Gemini) is available, use generative answer
    if settings.groq_api_key or settings.google_cloud_project:
        try:
            llm = get_llm_provider()
            if is_weather_query and weather_context:
                system_prompt = (
                    "You are Kisan Saathi (किसान साथी), an expert AI agricultural advisor. "
                    "Use the following real-time OpenWeatherMap telemetry to answer "
                    "the farmer's question:\n\n"
                    f"{weather_context}\n\n"
                    "Clearly state the exact current temperature, air/wind speed, "
                    "and rain probability. "
                    "Provide practical farming guidance (e.g. spray safety, irrigation advice, "
                    "crop precautions). "
                    f"Respond in {'English' if is_en else 'Hindi'}."
                )
            else:
                system_prompt = (
                    "You are Kisan Saathi (किसान साथी), an expert, empathetic AI agricultural "
                    "advisor for Indian farmers. "
                    "Answer the farmer's question practical, step-by-step, and respectfully. "
                    "Do NOT hallucinate a crop disease diagnosis unless the user specifically asks "
                    "about a plant disease with symptoms. "
                    f"Respond in {'English' if is_en else 'Hindi'}. "
                    "Keep your response clear, structured, and farmer-friendly."
                )
            if rag_context:
                system_prompt += (
                    "\nUse only the following retrieved agronomy evidence for factual claims. "
                    "If it does not answer the question, say that verified evidence is "
                    "unavailable rather than guessing. Cite the evidence IDs.\n\n"
                    + rag_context
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
                if is_weather_query:
                    state.sources.append("OpenWeatherMap Live Telemetry")
                state.sources.extend(rag_sources)
                state.sources.append("ICAR Package of Practices & Agricultural Extension")
                return state
        except (RuntimeError, ValueError):
            state.result["general_reply"] = (
                "I could not get a verified answer from the configured AI provider. "
                "Please check the server configuration and try again."
                if is_en
                else "कॉन्फ़िगर किए गए AI प्रदाता से सत्यापित उत्तर नहीं मिल सका। "
                "सर्वर कॉन्फ़िगरेशन जाँचकर फिर प्रयास करें।"
            )
            state.sources.append("No verified source available")
            return state

    # 2. Grounded deterministic offline fallbacks
    if is_greeting:
        state.result["general_reply"] = DEFAULT_GREETING_EN if is_en else DEFAULT_GREETING_HI
    elif is_weather_query:
        state.result["general_reply"] = (
            "Please share your farm location so I can retrieve live weather data."
            if is_en
            else "लाइव मौसम की जानकारी के लिए अपने खेत का स्थान साझा करें।"
        )
        state.sources.append("No weather telemetry requested")
        return state
    else:
        state.result["general_reply"] = (
            "No verified answer is available for this question because the AI/RAG "
            "provider is not configured."
            if is_en
            else "इस प्रश्न के लिए सत्यापित उत्तर उपलब्ध नहीं है क्योंकि AI/RAG "
            "प्रदाता कॉन्फ़िगर नहीं है।"
        )

    state.sources.append("ICAR Farmer Advisory Guidelines")
    return state
