"""Crop disease-doctor agent.

Future behavior: analyze a crop photo, retrieve agronomy documents, and produce a
``DiagnosisResult`` containing exactly one chemical and one organic remedy. The
diagnosis must include confidence, sources, and the KVK disclaimer.
"""

from app.agents.state import AgentState


async def run(state: AgentState) -> AgentState:
    """Diagnose a crop photo and attach grounded remedies to the shared state."""

    # TODO: call the multimodal provider, retrieve remedies, validate DiagnosisResult.
    _ = state
    raise NotImplementedError("Disease doctor agent is not implemented yet.")
