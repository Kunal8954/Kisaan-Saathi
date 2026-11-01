"""LangGraph orchestrator for Kisan Saathi.

The graph starts with a placeholder intent router, dispatches to one specialist
agent, and ends. Intent classification will eventually use Gemini structured
output; for now the router trusts ``state.intent`` and falls back to an explicit
unsupported node.
"""

from collections.abc import Awaitable, Callable
from typing import Any

from app.agents import (
    disease_doctor,
    fertilizer_agent,
    general_assistant,
    local_finder,
    scheme_advisor,
    soil_analyst,
    stress_monitor,
    treatment_agent,
)
from app.agents.state import AgentState, Intent
from app.models.chat import ChatRequest, ChatResponse

NodeHandler = Callable[[AgentState], Awaitable[AgentState]]

AGENT_NODES: dict[str, NodeHandler] = {
    "crop_planner": general_assistant.run,
    "disease_doctor": disease_doctor.run,
    "soil_analyst": soil_analyst.run,
    "stress_monitor": stress_monitor.run,
    "scheme_advisor": scheme_advisor.run,
    "local_finder": local_finder.run,
    "fertilizer_agent": fertilizer_agent.run,
    "treatment_agent": treatment_agent.run,
    "general_assistant": general_assistant.run,
}

INTENT_TO_NODE: dict[Intent, str] = {
    Intent.GENERAL: "general_assistant",
    Intent.CROP_PLANNER: "crop_planner",
    Intent.DISEASE_DOCTOR: "disease_doctor",
    Intent.SOIL_ANALYST: "soil_analyst",
    Intent.STRESS_MONITOR: "stress_monitor",
    Intent.SCHEME_ADVISOR: "scheme_advisor",
    Intent.LOCAL_FINDER: "local_finder",
    Intent.FERTILIZER_NUTRIENT: "fertilizer_agent",
    Intent.TREATMENT: "treatment_agent",
}


async def unsupported(state: AgentState) -> AgentState:
    """Terminal node for intents that do not yet have a specialist agent."""

    # TODO: replace with a clarification/general-assistant node.
    _ = state
    raise NotImplementedError("No specialist agent is registered for this intent.")


def route_intent(state: AgentState) -> str:
    """Placeholder router: map an already-classified intent to a graph node name."""

    return INTENT_TO_NODE.get(state.intent, "unsupported")


def build_graph() -> Any:
    """Compile the LangGraph state machine.

    LangGraph is imported lazily so importing this module (and therefore FastAPI)
    does not require optional agent dependencies during health checks.
    """

    from langgraph.graph import END, START, StateGraph

    builder = StateGraph(AgentState)
    for node_name, handler in AGENT_NODES.items():
        builder.add_node(node_name, handler)
    builder.add_node("unsupported", unsupported)

    builder.add_conditional_edges(
        START,
        route_intent,
        {**{node: node for node in AGENT_NODES}, "unsupported": "unsupported"},
    )
    for node_name in (*AGENT_NODES, "unsupported"):
        builder.add_edge(node_name, END)

    return builder.compile()


def classify_intent(message: str, context: dict[str, Any]) -> Intent:
    """Classify the incoming farmer query into one of the specialized intents."""
    if "intent" in context:
        try:
            return Intent(str(context["intent"]))
        except ValueError:
            pass

    m_low = message.strip().lower()

    # Greetings & basic conversational prompts
    greetings = [
        "नमस्ते", "नमस्कार", "हेलो", "हैलो", "प्रणाम", "राम राम", "जय किसान",
        "hello", "hi", "hey", "good morning", "good evening", "how are you",
        "who are you", "आप कौन हो", "तुम कौन हो", "help", "मदद",
    ]
    words = m_low.split()
    if len(words) <= 3 and any(g in m_low for g in greetings):
        return Intent.GENERAL

    # 1. Action-oriented Treatment & IPM (sprays, cures, dosages, remedies)
    if any(
        k in m_low
        for k in [
            "दवा", "उपचार", "छिड़काव", "स्प्रे", "रोकथाम", "कीटनाशक", "इलाज",
            "cure", "treatment", "spray", "fungicide", "pesticide", "control",
        ]
    ):
        return Intent.TREATMENT

    # 2. Fertilizer & Nutrients (NPK, urea, DAP, manure, compost, dosage)
    if any(
        k in m_low
        for k in [
            "खाद", "यूरिया", "डीएपी", "उर्वरक", "जिंक", "पोटाश", "पोषक", "गोबर",
            "dap", "urea", "fertilizer", "npk", "nutrient", "potash", "zinc",
        ]
    ):
        return Intent.FERTILIZER_NUTRIENT

    # 3. Disease & Symptoms (spots, blight, rust, wilting, leaf yellowing, pest attack)
    if any(
        k in m_low
        for k in [
            "रोग", "बीमारी", "धब्बे", "झुलसा", "कीड़ा", "फंगस", "पत्तियां", "पीली",
            "सड़न", "सुंडी", "माहू", "रतुआ",
            "disease", "rust", "blight", "spots", "fungus", "lesion", "rot", "wilt",
            "pest", "bollworm", "hopper", "symptom",
        ]
    ):
        return Intent.DISEASE_DOCTOR

    # 4. Crop Planning / Selection / Sowing
    if any(
        k in m_low
        for k in [
            "फसल", "बोएं", "बुवाई", "पैदावार", "किस्म", "सीजन",
            "crop", "plant", "sow", "sowing", "yield", "variety", "season",
        ]
    ):
        return Intent.CROP_PLANNER

    # 5. Government Schemes
    if any(k in m_low for k in ["योजना", "सब्सिडी", "pm-kisan", "pmkisan", "scheme", "kcc"]):
        return Intent.SCHEME_ADVISOR

    # 6. Mandi & Market
    if any(k in m_low for k in ["मंडी", "भाव", "रेट", "दुकान", "mandi", "price", "market"]):
        return Intent.LOCAL_FINDER

    # Fallback to general conversational assistant (never force disease diagnosis!)
    return Intent.GENERAL


async def run_chat(request: ChatRequest) -> ChatResponse:
    """Execute the multi-agent LangGraph workflow for a conversational turn."""
    from app.models.farmer import ExperienceMode, Language

    intent = classify_intent(request.message, request.context)
    node_name = INTENT_TO_NODE.get(intent, "general_assistant")

    lang = Language.ENGLISH if request.language == "en" else Language.HINDI
    exp = (
        ExperienceMode.EXPERIENCED
        if request.experience_mode == "experienced"
        else ExperienceMode.NEW_FARMER
    )

    context = dict(request.context)
    if "crop" not in context:
        for alias, c_name in [
            ("गेहूं", "wheat"),
            ("wheat", "wheat"),
            ("धान", "rice"),
            ("चावल", "rice"),
            ("rice", "rice"),
            ("सरसों", "mustard"),
            ("mustard", "mustard"),
            ("आलू", "potato"),
            ("potato", "potato"),
            ("टमाटर", "tomato"),
            ("tomato", "tomato"),
            ("कपास", "cotton"),
            ("cotton", "cotton"),
        ]:
            if alias in request.message.lower():
                context["crop"] = c_name
                break

    state = AgentState(
        farmer_id=request.farmer_id,
        farm_id=request.farm_id,
        session_id=request.session_id,
        intent=intent,
        language=lang,
        experience_mode=exp,
        message=request.message,
        context=context,
    )

    handler = AGENT_NODES.get(node_name, general_assistant.run)
    is_en = request.language == "en"
    try:
        result_state = await handler(state)
    except (RuntimeError, ValueError) as exc:
        return ChatResponse(
            reply=(
                "I could not produce a verified answer because a required service "
                "is unavailable. Please check the server configuration and try again."
                if is_en
                else "आवश्यक सेवा उपलब्ध नहीं होने के कारण सत्यापित उत्तर नहीं मिल सका। "
                "सर्वर कॉन्फ़िगरेशन जाँचकर फिर प्रयास करें।"
            ),
            intent=str(intent),
            agent=node_name,
            sources=["No verified answer available"],
            metadata={"error": str(exc)},
        )

    # Format reply based on agent result
    reply = ""
    sources = list(result_state.sources)
    if "general_reply" in result_state.result:
        reply = str(result_state.result["general_reply"])
    elif "fertilizer_plan" in result_state.result:
        plan = result_state.result["fertilizer_plan"]
        crop_title = plan.get("crop", "Crop" if is_en else "फसल")
        basal_str = " ".join(plan.get("basal_dose", []))
        top_str = " ".join(plan.get("top_dressing_stages", []))
        adv_text = result_state.result.get("fertilizer_advisory_text")
        if adv_text:
            reply = adv_text
        elif is_en:
            npk = plan.get("recommended_npk_ratio")
            reply = (
                f"{crop_title} Nutrition Advisory (NPK Ratio: {npk}):\n\n"
                f"• Basal Application: {basal_str}\n"
                f"• Top-Dressing Schedule: {top_str}\n\n"
                f"Advisory Note: {plan.get('soil_testing_advisory')}"
            )
        else:
            reply = (
                f"{crop_title} पोषण परामर्श (NPK: {plan.get('recommended_npk_ratio')}):\n\n"
                f"• बेसल खुराक: {basal_str}\n"
                f"• टॉप-ड्रेसिंग: {top_str}\n\n"
                f"सूचना: {plan.get('soil_testing_advisory')}"
            )
    elif "treatment_plan" in result_state.result:
        t_plan = result_state.result["treatment_plan"]
        imm_str = " ".join(t_plan.get("immediate_actions", []))
        org_str = " ".join(t_plan.get("organic_methods", []))
        chem_str = " ".join(t_plan.get("chemical_methods", []))
        adv_text = result_state.result.get("treatment_advisory_text")
        if adv_text:
            reply = adv_text
        elif is_en:
            reply = (
                f"{t_plan.get('target_condition')} IPM Treatment Strategy:\n\n"
                f"1. Immediate Actions: {imm_str}\n"
                f"2. Organic / Biological Control: {org_str}\n"
                f"3. Chemical Protection: {chem_str}\n\n"
                f"Safety Precautions (PHI: {t_plan.get('pre_harvest_interval_days')} days): "
                f"{t_plan.get('disclaimer')}"
            )
        else:
            reply = (
                f"{t_plan.get('target_condition')} उपचार योजना:\n\n"
                f"1. तत्काल कदम: {imm_str}\n"
                f"2. जैविक नियंत्रण: {org_str}\n"
                f"3. रासायनिक रोकथाम: {chem_str}\n\n"
                f"सुरक्षा निर्देश (PHI: {t_plan.get('pre_harvest_interval_days')} दिन): "
                f"{t_plan.get('disclaimer')}"
            )
    elif "diagnosis" in result_state.result:
        diag = result_state.result["diagnosis"]
        likely = diag.get("likely_cause", "Crop Issue" if is_en else "रोग")
        conf_pct = int(float(diag.get("confidence", 0.85)) * 100)
        remedies = diag.get("remedies", [])
        rem_lines = [f"• {r.get('title')}: {r.get('instructions')}" for r in remedies]
        if is_en:
            reply = (
                f"Identified Issue: {likely} (Confidence: {conf_pct}%)\n\n"
                f"Recommended Remedies:\n" + "\n".join(rem_lines) + "\n\n"
                f"Disclaimer: {diag.get('disclaimer', '')}"
            )
        else:
            reply = (
                f"संभावित समस्या: {likely} (सटीकता: {conf_pct}%)\n\n"
                f"उपचार के उपाय:\n" + "\n".join(rem_lines) + "\n\n"
                f"अस्वीकरण: {diag.get('disclaimer', '')}"
            )
    else:
        reply = (
            "Hello! Ask about your crops, pest symptoms, fertilizer schedules, "
            "or government schemes."
            if is_en
            else (
                "नमस्ते किसान साथी! अपनी फसल, कीट, रोग, खाद की मात्रा अथवा सरकारी "
                "योजनाओं के बारे में पूछें।"
            )
        )

    return ChatResponse(
        reply=reply,
        intent=str(intent),
        agent=node_name,
        sources=sources,
        metadata=result_state.result,
    )
