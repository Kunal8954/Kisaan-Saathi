"""Unit tests for nearby agricultural places, KVKs, and mandi prices."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.places_service import (
    find_nearby_agricultural_places,
    get_place_by_id,
    haversine_km,
)
from app.tools.mandi_prices import get_mandi_prices, get_price_trend


def test_haversine_distance() -> None:
    # Distance between Karnal (29.6857, 76.9905) and Delhi (28.7118, 77.1764) is ~110 km
    dist = haversine_km(29.6857, 76.9905, 28.7118, 77.1764)
    assert 100.0 < dist < 125.0

    # Same point distance should be 0.0
    zero_dist = haversine_km(28.0, 77.0, 28.0, 77.0)
    assert zero_dist == 0.0


def test_find_nearby_places_karnal() -> None:
    resp = find_nearby_agricultural_places(
        latitude=29.6857,
        longitude=76.9905,
        radius_km=25.0,
        place_type="all",
    )
    assert resp.total >= 3
    names = [p.name_en for p in resp.places]
    assert any("Karnal New Grain Market" in n for n in names)
    assert any("Karnal" in n and "KVK" in n or "Krishi Vigyan Kendra" in n for n in names)

    # Check sorting: first place should have minimal distance
    assert resp.places[0].distance_km is not None
    assert resp.places[0].distance_km < 5.0


def test_filter_places_by_type() -> None:
    # Only mandis
    mandi_resp = find_nearby_agricultural_places(
        latitude=29.6857,
        longitude=76.9905,
        radius_km=50.0,
        place_type="mandi",
    )
    assert mandi_resp.total >= 1
    for p in mandi_resp.places:
        assert p.place_type == "mandi"

    # Only KVKs
    kvk_resp = find_nearby_agricultural_places(
        latitude=29.6857,
        longitude=76.9905,
        radius_km=50.0,
        place_type="kvk",
    )
    assert kvk_resp.total >= 1
    for p in kvk_resp.places:
        assert p.place_type == "kvk"


def test_places_dynamic_fallback_for_remote_coords() -> None:
    # Query in remote coordinates (e.g. 24.12, 82.55)
    resp = find_nearby_agricultural_places(
        latitude=24.12,
        longitude=82.55,
        radius_km=25.0,
        place_type="all",
    )
    assert resp.total >= 2
    types = [p.place_type for p in resp.places]
    assert "mandi" in types or "kvk" in types


def test_get_place_by_id() -> None:
    place = get_place_by_id("mandi-karnal-01")
    assert place is not None
    assert place.district == "Karnal"
    assert len(place.mandi_prices) >= 2

    # Check commodity details
    wheat_record = next(m for m in place.mandi_prices if m.commodity == "Wheat")
    assert wheat_record.modal_price_quintal >= 2400.0
    assert wheat_record.msp_quintal == 2425.0

    # Non-existent
    assert get_place_by_id("non-existent-xyz") is None


@pytest.mark.asyncio
async def test_mandi_prices_tool() -> None:
    prices = await get_mandi_prices(commodity="Wheat")
    assert len(prices) >= 2
    assert any("Karnal" in p["mandi_name"] or "Indore" in p["mandi_name"] for p in prices)

    trends = await get_price_trend(commodity="Wheat", days=60)
    assert len(trends) >= 4


def test_api_nearby_places_route() -> None:
    client = TestClient(app)
    resp = client.get("/api/places/nearby?latitude=29.6857&longitude=76.9905&radius_km=30")
    assert resp.status_code == 200
    data = resp.json()
    assert "places" in data
    assert data["total"] >= 2


def test_api_mandi_prices_route() -> None:
    client = TestClient(app)
    resp = client.get("/api/places/mandis/prices?commodity=Mustard")
    assert resp.status_code == 200
    prices = resp.json()
    assert len(prices) >= 1
    assert prices[0]["commodity"] == "Mustard"


def test_api_single_place_route() -> None:
    client = TestClient(app)
    resp = client.get("/api/places/mandi-karnal-01")
    assert resp.status_code == 200
    assert resp.json()["id"] == "mandi-karnal-01"

    # 404
    resp_404 = client.get("/api/places/non-existent-id")
    assert resp_404.status_code == 404
