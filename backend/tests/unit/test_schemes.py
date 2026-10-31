"""Unit tests for government schemes service and endpoints."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app
from app.models.scheme import SchemeAdviceRequest, SchemeEligibilityInput
from app.services.schemes_service import (
    answer_scheme_query,
    evaluate_farmer_eligibility,
    get_all_schemes,
    get_scheme_by_id,
)


def test_get_all_schemes() -> None:
    schemes = get_all_schemes()
    assert len(schemes) >= 5
    ids = [s.id for s in schemes]
    assert "pmfby" in ids
    assert "pm-kisan" in ids
    assert "kcc" in ids


def test_get_scheme_by_id() -> None:
    pmfby = get_scheme_by_id("pmfby")
    assert pmfby is not None
    assert pmfby.category == "insurance"
    assert "14447" in pmfby.helpline


def test_evaluate_farmer_eligibility_small_farmer() -> None:
    farmer = SchemeEligibilityInput(
        land_size_hectares=1.2,
        state="Haryana",
        crop_season="kharif",
        is_landowner=True,
        has_aadhaar=True,
        has_bank_account=True,
    )
    results = evaluate_farmer_eligibility(farmer)
    assert len(results) >= 5

    # Check PM-KISAN
    pm_kisan = next(r for r in results if r.scheme_id == "pm-kisan")
    assert pm_kisan.is_eligible is True
    assert "6,000" in pm_kisan.estimated_benefit_hi

    # Check PMKSY (55% subsidy for <= 2 ha)
    pmksy = next(r for r in results if r.scheme_id == "pmksy")
    assert "55%" in pmksy.status_label_hi


def test_answer_pmfby_claim_query() -> None:
    req = SchemeAdviceRequest(question="फसल नुकसान होने पर 72 घंटे में क्लेम कैसे करें?")
    res = answer_scheme_query(req)
    assert "72" in res.answer_hi
    assert "14447" in res.answer_hi
    assert res.claim_assistance is not None
    assert len(res.sources) >= 1


def test_schemes_api_endpoints() -> None:
    client = TestClient(app)

    # 1. GET /api/schemes
    res = client.get("/api/schemes")
    assert res.status_code == 200
    schemes = res.json()
    assert len(schemes) >= 5

    # 2. GET /api/schemes/pmfby
    res_pmfby = client.get("/api/schemes/pmfby")
    assert res_pmfby.status_code == 200
    assert res_pmfby.json()["id"] == "pmfby"

    # 3. POST /api/schemes/evaluate
    res_eval = client.post(
        "/api/schemes/evaluate",
        json={"land_size_hectares": 2.5, "is_landowner": True, "has_aadhaar": True},
    )
    assert res_eval.status_code == 200
    eval_list = res_eval.json()
    assert len(eval_list) >= 5

    # 4. POST /api/schemes/advice
    res_advice = client.post(
        "/api/schemes/advice",
        json={"question": "KCC ब्याज दर और लोन लिमिट क्या है?"},
    )
    assert res_advice.status_code == 200
    advice_data = res_advice.json()
    assert "4%" in advice_data["answer_hi"]
