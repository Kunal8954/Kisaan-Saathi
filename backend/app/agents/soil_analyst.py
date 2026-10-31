"""Soil-analyst agent.

Future behavior: OCR a soil-test PDF/image, normalize mineral values, and produce
site-specific fertilizer and organic-matter recommendations.
"""

from app.agents.state import AgentState


async def run(state: AgentState) -> AgentState:
    """Parse a soil report and attach mineral recommendations to the shared state."""

    # TODO: run OCR, extract lab values, retrieve interpretation guidance, validate output.
    _ = state
    raise NotImplementedError("Soil analyst agent is not implemented yet.")
