"""Local agri-input shop and mandi finder agent.

Future behavior: resolve a farmer's location, query nearby shops/mandis, and
return directions and contact details in the farmer's language.
"""

from app.agents.state import AgentState


async def run(state: AgentState) -> AgentState:
    """Find nearby agri-input shops and mandis for the farmer's location."""

    # TODO: use geospatial lookup/Places API, rank by distance, format for voice.
    _ = state
    raise NotImplementedError("Local finder agent is not implemented yet.")
