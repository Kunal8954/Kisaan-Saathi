"""Unit tests for the three specialist agents and the LangGraph orchestrator."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.agents import disease_doctor, fertilizer_agent, orchestrator, treatment_agent
from app.agents.state import AgentState, Intent
from app.main import app
from app.models.chat import ChatRequest
from app.models.diagnosis import RemedyType
from app.models.farmer import ExperienceMode, Language


@pytest.mark.asyncio
async def test_disease_doctor_agent() -> None:
    state = AgentState(
        intent=Intent.DISEASE_DOCTOR,
        language=Language.HINDI,
        experience_mode=ExperienceMode.NEW_FARMER,
        message="मेरी गेहूं की फसल में पत्तियों पर पीले धब्बे और रतुआ दिख रहा है।",
        context={"crop": "Wheat"},
    )
    result_state = await disease_doctor.run(state)
    assert "diagnosis" in result_state.result
    diag = result_state.result["diagnosis"]

    assert diag["confidence"] > 0.0
    assert "disclaimer" in diag
    assert "KVK" in diag["disclaimer"] or "कृषि विज्ञान केंद्र" in diag["disclaimer"]
    assert len(diag["remedies"]) == 2

    remedy_types = {r["remedy_type"] for r in diag["remedies"]}
    assert RemedyType.CHEMICAL_FERTILIZER.value in remedy_types
    assert RemedyType.ORGANIC_COW_DUNG.value in remedy_types


@pytest.mark.asyncio
async def test_fertilizer_agent() -> None:
    state = AgentState(
        intent=Intent.FERTILIZER_NUTRIENT,
        language=Language.HINDI,
        experience_mode=ExperienceMode.NEW_FARMER,
        message="गेहूं की बुवाई के समय कितनी खाद और यूरिया डालनी चाहिए?",
        context={"crop": "wheat"},
    )
    result_state = await fertilizer_agent.run(state)
    assert "fertilizer_plan" in result_state.result
    plan = result_state.result["fertilizer_plan"]

    assert "npk" in plan["recommended_npk_ratio"].lower() or ":" in plan["recommended_npk_ratio"]
    assert len(plan["basal_dose"]) >= 1
    assert len(plan["top_dressing_stages"]) >= 1
    assert "soil_testing_advisory" in plan
    assert len(result_state.sources) >= 1


@pytest.mark.asyncio
async def test_treatment_agent() -> None:
    state = AgentState(
        intent=Intent.TREATMENT,
        language=Language.ENGLISH,
        experience_mode=ExperienceMode.NEW_FARMER,
        message="How to cure rust disease on wheat crop?",
        context={"crop": "wheat"},
    )
    result_state = await treatment_agent.run(state)
    assert "treatment_plan" in result_state.result
    plan = result_state.result["treatment_plan"]

    assert len(plan["immediate_actions"]) >= 1
    assert len(plan["organic_methods"]) >= 1
    assert len(plan["biological_methods"]) >= 1
    assert len(plan["chemical_methods"]) >= 1
    assert plan["pre_harvest_interval_days"] > 0
    assert "KVK" in plan["disclaimer"]


@pytest.mark.asyncio
async def test_orchestrator_run_chat() -> None:
    # 1. Test fertilizer query routing
    req_fert = ChatRequest(
        message="सरसों की फसल में यूरिया और डीएपी की सही मात्रा बताएं",
        language="hi",
    )
    resp_fert = await orchestrator.run_chat(req_fert)
    assert resp_fert.agent == "fertilizer_agent"
    assert resp_fert.intent == "fertilizer_nutrient"
    assert "उर्वरक" in resp_fert.reply or "पोषण" in resp_fert.reply or "डीएपी" in resp_fert.reply

    # 2. Test treatment query routing
    req_treat = ChatRequest(
        message="What is the chemical spray and cure for leaf blight?",
        language="en",
    )
    resp_treat = await orchestrator.run_chat(req_treat)
    assert resp_treat.agent == "treatment_agent"
    assert resp_treat.intent == "treatment"
    assert "treatment" in resp_treat.reply.lower() or "spray" in resp_treat.reply.lower()


def test_api_chat_endpoint() -> None:
    client = TestClient(app)
    payload = {
        "message": "मेरी गेहूं की पत्तियों पर पीला पाउडर और धब्बे हैं, क्या रोग है?",
        "language": "hi",
    }
    resp = client.post("/api/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "reply" in data
    assert len(data["reply"]) > 10
    assert "agent" in data
    assert "sources" in data


@pytest.mark.asyncio
async def test_general_greeting_does_not_hallucinate_disease() -> None:
    req_hi = ChatRequest(message="नमस्ते", language="hi")
    resp_hi = await orchestrator.run_chat(req_hi)
    assert resp_hi.agent == "general_assistant"
    assert resp_hi.intent == "general"
    assert "नमस्ते" in resp_hi.reply
    assert "पीला रतुआ" not in resp_hi.reply

    req_en = ChatRequest(message="Hello how are you", language="en")
    resp_en = await orchestrator.run_chat(req_en)
    assert resp_en.agent == "general_assistant"
    assert resp_en.intent == "general"
    assert "yellow rust" not in resp_en.reply.lower()


@pytest.mark.asyncio
async def test_crop_specific_disease_matching() -> None:
    # Rice disease must match bacterial blight, not wheat rust
    req_rice = ChatRequest(message="धान के पत्तों पर जीवाणु झुलसा रोग है", language="hi")
    resp_rice = await orchestrator.run_chat(req_rice)
    assert resp_rice.agent == "disease_doctor"
    assert "जीवाणु झुलसा" in resp_rice.reply or "ब्लाइट" in resp_rice.reply
    assert "पीला रतुआ" not in resp_rice.reply

    # Cotton pest must match pink bollworm
    req_cotton = ChatRequest(message="कपास में गुलाबी सुंडी का प्रकोप है", language="hi")
    resp_cotton = await orchestrator.run_chat(req_cotton)
    assert resp_cotton.agent == "disease_doctor"
    assert "गुलाबी सुंडी" in resp_cotton.reply or "बॉलवॉर्म" in resp_cotton.reply
