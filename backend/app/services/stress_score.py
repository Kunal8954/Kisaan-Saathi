"""Deterministic crop-stress scoring helpers."""

from __future__ import annotations

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

    Weights:
    - Moisture deficit (NDMI): 35%
    - Vegetative vigor anomaly (NDVI Anomaly): 30%
    - Land Surface Temperature (Thermal stress): 20%
    - Soil Moisture: 15%
    """
    total_weight = 0.0
    accumulated_score = 0.0

    # 1. Moisture deficit from NDMI (target >= 0.35 is 0 stress, <= -0.1 is 100 stress)
    if inputs.ndmi is not None:
        ndmi_weight = 35.0
        # Map NDMI from [-0.1, 0.35] to [100, 0]
        clamped = max(-0.1, min(0.35, inputs.ndmi))
        score_component = (0.35 - clamped) / 0.45 * 100.0
        accumulated_score += score_component * ndmi_weight
        total_weight += ndmi_weight

    # 2. Vegetative vigor anomaly (NDVI anomaly: >= +0.05 is 0, <= -0.25 is 100)
    if inputs.ndvi_anomaly is not None:
        anom_weight = 30.0
        clamped = max(-0.25, min(0.05, inputs.ndvi_anomaly))
        score_component = (0.05 - clamped) / 0.30 * 100.0
        accumulated_score += score_component * anom_weight
        total_weight += anom_weight

    # 3. Thermal stress (LST: <= 28C is 0, >= 42C is 100)
    if inputs.land_surface_temperature_c is not None:
        temp_weight = 20.0
        clamped = max(28.0, min(42.0, inputs.land_surface_temperature_c))
        score_component = (clamped - 28.0) / 14.0 * 100.0
        accumulated_score += score_component * temp_weight
        total_weight += temp_weight

    # 4. Soil moisture deficit (Soil moisture: >= 35% is 0, <= 10% is 100)
    if inputs.soil_moisture is not None:
        soil_weight = 15.0
        clamped = max(10.0, min(35.0, inputs.soil_moisture))
        score_component = (35.0 - clamped) / 25.0 * 100.0
        accumulated_score += score_component * soil_weight
        total_weight += soil_weight

    if total_weight == 0.0:
        return 20.0  # Default nominal low stress

    final_score = accumulated_score / total_weight
    return round(max(0.0, min(100.0, final_score)), 1)


def classify_stress(score: float) -> str:
    """Map a 0-100 stress score to a severity category."""
    if score <= 25.0:
        return "low"
    if score <= 50.0:
        return "moderate"
    if score <= 75.0:
        return "high"
    return "severe"
