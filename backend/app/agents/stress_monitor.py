"""Satellite crop-stress agent.

Future behavior: compute NDVI anomaly, NDMI, land-surface temperature, and soil
moisture for a farm polygon, then summarize stress trends and alerts.
"""

from app.agents.state import AgentState


async def run(state: AgentState) -> AgentState:
    """Analyze satellite indicators for the farm and attach stress findings."""

    # TODO: fetch the farm polygon, query Earth Engine, score stress, cache the result.
    _ = state
    raise NotImplementedError("Stress monitor agent is not implemented yet.")
