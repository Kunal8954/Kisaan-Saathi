"""Unit tests for the dev heatmap server's validation and numeric helpers."""

from datetime import date

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

import heatmap_server as h

SQUARE = {
    "type": "Polygon",
    "coordinates": [[[74.5, 30.5], [74.51, 30.5], [74.51, 30.51], [74.5, 30.51]]],
}


def test_validate_polygon_closes_exterior_ring() -> None:
    geometry, ring, bbox = h._validate_polygon(SQUARE)

    assert ring[0] == ring[-1]
    assert geometry["coordinates"][0] == ring
    assert bbox == [74.5, 30.5, 74.51, 30.51]


def test_validate_polygon_rejects_too_few_points() -> None:
    bad = {"type": "Polygon", "coordinates": [[[0, 0], [1, 1]]]}

    with pytest.raises(HTTPException) as exc:
        h._validate_polygon(bad)

    assert exc.value.status_code == 400


def test_ring_stats_returns_metres_and_area() -> None:
    _, ring, _ = h._validate_polygon(SQUARE)
    _, area_m2, width_m, height_m = h.ring_stats(ring)

    assert 900_000 < area_m2 < 1_300_000
    assert 900 < width_m < 1_100
    assert 1_000 < height_m < 1_200


def test_shift_window_clamps_leap_day() -> None:
    start, end = h._shift_window(date(2024, 2, 29), date(2024, 3, 1), 1)

    assert start == date(2023, 2, 28)
    assert end == date(2023, 3, 1)


def test_extract_median_skips_nan_and_nodata() -> None:
    payload = {
        "data": [
            {"outputs": {"data": {"bands": {"B0": {"stats": {
                "sampleCount": 100,
                "noDataCount": 0,
                "percentiles": {"50.0": 0.6},
            }}}}}},
            {"outputs": {"data": {"bands": {"B0": {"stats": {
                "sampleCount": 100,
                "noDataCount": 100,
                "percentiles": {"50.0": "NaN"},
            }}}}}},
            {"outputs": {"data": {"bands": {"B0": {"stats": {
                "sampleCount": 100,
                "noDataCount": 50,
                "percentiles": {"50.0": 0.3},
            }}}}}},
        ]
    }

    assert h._extract_median(payload) == pytest.approx(0.5)


def test_health_endpoint() -> None:
    client = TestClient(h.app)

    assert client.get("/health").json() == {"ok": True}


def test_heatmap_rejects_bad_polygon() -> None:
    client = TestClient(h.app)
    response = client.post(
        "/heatmap",
        json={
            "polygon": {"type": "Polygon", "coordinates": [[[0, 0], [1, 1]]]},
            "date_from": "2026-01-01",
            "date_to": "2026-01-02",
            "layer": "ndvi",
        },
    )

    assert response.status_code == 400


def test_heatmap_rejects_oversized_date_range() -> None:
    client = TestClient(h.app)
    response = client.post(
        "/heatmap",
        json={
            "polygon": SQUARE,
            "date_from": "2026-01-01",
            "date_to": "2026-06-01",
            "layer": "ndvi",
        },
    )

    assert response.status_code == 400


def test_main_app_mounts_heatmap_route() -> None:
    from app.main import app

    assert "/api/heatmap" in app.openapi()["paths"]


def test_main_app_mounts_weather_route() -> None:
    from app.main import app

    assert "/api/weather" in app.openapi()["paths"]


def test_heatmap_returns_image_and_proper_metrics() -> None:
    client = TestClient(h.app)
    response = client.post(
        "/heatmap",
        json={
            "polygon": SQUARE,
            "date_from": "2026-02-01",
            "date_to": "2026-02-28",
            "layer": "ndvi",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "image_base64" in data and len(data["image_base64"]) > 50
    assert "bounds" in data

    metrics = data["metrics"]
    assert isinstance(metrics["ndvi"], float) and 0.0 <= metrics["ndvi"] <= 1.0
    assert isinstance(metrics["ndvi_anomaly"], float)
    assert isinstance(metrics["ndvi_baseline"], float)
    assert isinstance(metrics["ndmi"], float)
    assert isinstance(metrics["land_surface_temperature_c"], float)
    assert isinstance(metrics["soil_moisture"], float)
    assert len(metrics["baseline_years"]) == 3

