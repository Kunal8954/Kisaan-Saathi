"""RAG quality eval harness.

The corpus and labeled questions are not populated yet, so these evals are
explicitly skipped rather than reporting a misleading pass.
"""

import pytest


@pytest.mark.skip(reason="Scheme corpus and labeled eval questions are not ingested yet.")
def test_scheme_retrieval_hit_rate() -> None:
    """Assert retrieval hit-rate exceeds the agreed threshold on labeled questions."""

    pass


@pytest.mark.skip(reason="Grounded-answer eval set is not populated yet.")
def test_scheme_answer_groundedness() -> None:
    """Assert answers cite retrieved passages and contain no unsupported claims."""

    pass
