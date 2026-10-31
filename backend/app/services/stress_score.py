"""Deterministic crop-stress scoring helpers."""

from dataclasses import dataclass


@dataclass(frozen=True)
class StressInputs:
    """Normalized satellite and weather indicators for one observation."""

    ndvi_anomaly: float | None
    ndmi: float | None
    land_surface_temperature_c: float | None
    soil_moisture: float | None


def compute_stress_score(inputs: StressInputs) -> float:
    """Return a 0-100 stress score from satellite indicators.

    The weighting and thresholds must be documented and validated against local
    agronomy guidance before production use.
    """

    # TODO: define transparent weights, missing-data handling, and confidence bands.
    _ = inputs
    raise NotImplementedError("Stress scoring is not implemented yet.")


def classify_stress(score: float) -> str:
    """Map a stress score to a farmer-facing severity label."""

    # TODO: align thresholds with KVK/ICAR guidance and localize labels.
    _ = score
    raise NotImplementedError("Stress classification is not implemented yet.")
