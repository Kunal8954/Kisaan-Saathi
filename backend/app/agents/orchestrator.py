"""LangGraph orchestrator for Kisan Saathi.

The graph starts with a placeholder intent router, dispatches to one specialist
agent, and ends. Intent classification will eventually use Gemini structured
output; for now the router trusts ``state.intent`` and falls back to an explicit
unsupported node.
"""

from collections.abc import Awaitable, Callable
from typing import Any

from app.agents import (
    crop_planner,
    disease_doctor,
    local_finder,
    scheme_advisor,
    soil_analyst,
    stress_monitor,
)
from app.agents.state import AgentState, Intent
from app.models.chat import ChatRequest, ChatResponse

NodeHandler = Callable[[AgentState], Awaitable[AgentState]]

AGENT_NODES: dict[str, NodeHandler] = {
    "crop_planner": crop_planner.run,
    "disease_doctor": disease_doctor.run,
    "soil_analyst": soil_analyst.run,
    "stress_monitor": stress_monitor.run,
    "scheme_advisor": scheme_advisor.run,
    "local_finder": local_finder.run,
}

INTENT_TO_NODE: dict[Intent, str] = {
    Intent.CROP_PLANNER: "crop_planner",
    Intent.DISEASE_DOCTOR: "disease_doctor",
    Intent.SOIL_ANALYST: "soil_analyst",
    Intent.STRESS_MONITOR: "stress_monitor",
    Intent.SCHEME_ADVISOR: "scheme_advisor",
    Intent.LOCAL_FINDER: "local_finder",
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


async def run_chat(request: ChatRequest) -> ChatResponse:
    """Execute the graph for a chat request and format the response."""

    # TODO: classify intent, build AgentState, invoke the graph, synthesize speech.
    _ = request
    raise NotImplementedError("Chat orchestration is not implemented yet.")
