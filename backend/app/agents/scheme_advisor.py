"""Government-scheme advisor agent.

Future behavior: run retrieval over PMFBY, PM-KISAN, Soil Health Card, KCC, and
related documents, then answer with eligibility hints and cited passages.
"""

from app.agents.state import AgentState


async def run(state: AgentState) -> AgentState:
    """Answer a scheme question using grounded retrieval and citations."""

    # TODO: retrieve from Atlas Vector Search, rerank, generate a cited answer.
    _ = state
    raise NotImplementedError("Scheme advisor agent is not implemented yet.")
