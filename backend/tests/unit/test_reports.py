"""Unit tests for insurance evidence report generator and endpoints."""

from __future__ import annotations

from datetime import date
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.report import InsuranceEvidenceReport, StressSnapshot
from app.services.report_pdf import build_insurance_report_pdf, store_report_pdf


@pytest.mark.asyncio
async def test_build_insurance_report_pdf() -> None:
    report = InsuranceEvidenceReport(
        farmer_id="FRM-9981-TEST",
        farm_name="South Field / Khasra 88",
        crop="Wheat (गेहूं)",
        area_acres=2.5,
        calamity_type="Heavy Rainfall & Waterlogging",
        claim_reason="Unseasonal downpour submerged the crop.",
        period_start=date(2026, 10, 10),
        period_end=date(2026, 10, 14),
        stress_snapshots=[
            StressSnapshot(
                observed_on=date(2026, 10, 14),
                ndvi=0.28,
                ndvi_anomaly=-52.0,
                ndmi=0.51,
                land_surface_temperature_c=21.0,
                soil_moisture=92.0,
                stress_score=85.0,
            )
        ],
    )

    pdf_bytes = await build_insurance_report_pdf(report)
    assert len(pdf_bytes) > 2000
    assert pdf_bytes.startswith(b"%PDF")


@pytest.mark.asyncio
async def test_store_report_pdf() -> None:
    fake_pdf = b"%PDF-1.4 test document content"
    uri = await store_report_pdf(fake_pdf, "farmer-1", "test-report-id")
    assert uri.startswith("file://")
    assert "test-report-id.pdf" in uri


def test_post_insurance_report_metadata() -> None:
    client = TestClient(app)
    payload = {
        "farmer_id": "FRM-TEST-001",
        "farm_id": "farm-001",
        "farm_name": "East Field",
        "crop": "Mustard (सरसों)",
        "area_acres": 1.75,
        "calamity_type": "Hailstorm (ओलावृष्टि)",
        "claim_reason": "Severe hailstorm battered the standing pods.",
        "period_start": "2026-10-01",
        "period_end": "2026-10-04",
        "satellite_ndvi": 0.35,
        "satellite_ndvi_anomaly": -38.5,
    }

    response = client.post("/api/reports/insurance", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["crop"] == "Mustard (सरसों)"
    assert data["area_acres"] == 1.75
    assert "generated_pdf_uri" in data
    assert data["generated_pdf_uri"] is not None
    assert "disclaimer" in data
    assert "supplementary advisory evidence" in data["disclaimer"].lower()
    assert len(data["stress_snapshots"]) >= 1


def test_post_insurance_report_download() -> None:
    client = TestClient(app)
    payload = {
        "farmer_id": "FRM-TEST-002",
        "farm_name": "North Field",
        "crop": "Wheat",
        "area_acres": 3.0,
        "calamity_type": "Inundation",
        "claim_reason": "Submerged following 150mm rain in 48 hours.",
        "period_start": "2026-10-05",
        "period_end": "2026-10-08",
    }

    response = client.post("/api/reports/insurance/download", json=payload)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "attachment; filename=" in response.headers.get("content-disposition", "")
    assert response.content.startswith(b"%PDF")
    assert len(response.content) > 2000


def test_get_download_stored_report_not_found() -> None:
    client = TestClient(app)
    random_id = uuid4()
    response = client.get(f"/api/reports/insurance/{random_id}/download")
    assert response.status_code == 404
