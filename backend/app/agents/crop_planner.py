"""Crop-planner agent.

Future behavior: combine climate history, season, soil context, and mandi
price/demand signals into a ranked crop plan.
"""

from app.agents.state import AgentState


async def run(state: AgentState) -> AgentState:
    """Recommend crops and a season plan for the farmer's context."""

    # TODO: retrieve climate/mandi evidence, call the provider abstraction, persist plan.
    _ = state
    raise NotImplementedError("Crop planner agent is not implemented yet.")
