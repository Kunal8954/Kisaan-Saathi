"""Unit tests for soil test report parsing and recommendations."""

from __future__ import annotations

import io

import pytest
from fastapi.testclient import TestClient
from pypdf import PdfWriter

from app.main import app
from app.services.soil_parser import parse_soil_document


@pytest.mark.asyncio
async def test_parse_soil_document_from_text() -> None:
    text = (
        b"Kisan Soil Health Card: pH: 7.2, EC: 0.35 dS/m, Organic Carbon: 0.62%, "
        b"Available Nitrogen: 290 kg/ha, Phosphorus: 19.5 kg/ha, Potassium: 240 kg/ha, "
        b"Zinc: 0.75 ppm, Sulphur: 12.0 ppm"
    )
    res = await parse_soil_document(text, "shc_report.txt")
    assert res.health_score > 50
    assert len(res.parameters) == 8
    assert len(res.recommendations) >= 2

    # Check that pH was parsed as 7.2
    ph_param = next(p for p in res.parameters if p.symbol == "pH")
    assert ph_param.value == 7.2
    assert "Optimal" in ph_param.rating or "संतुलित" in ph_param.rating_hi


@pytest.mark.asyncio
async def test_parse_soil_document_empty_pdf() -> None:
    writer = PdfWriter()
    writer.add_blank_page(width=100, height=100)
    buf = io.BytesIO()
    writer.write(buf)
    pdf_bytes = buf.getvalue()

    res = await parse_soil_document(pdf_bytes, "test.pdf")
    assert res.health_score >= 35
    assert len(res.parameters) == 8
    assert res.disclaimer != ""
    assert len(res.sources) >= 1


def test_soil_api_endpoint() -> None:
    writer = PdfWriter()
    writer.add_blank_page(width=100, height=100)
    buf = io.BytesIO()
    writer.write(buf)
    pdf_bytes = buf.getvalue()

    client = TestClient(app)
    response = client.post(
        "/api/soil",
        files={"file": ("soil_report.pdf", pdf_bytes, "application/pdf")},
        data={"farmer_id": "test-farmer"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "health_score" in data
    assert "parameters" in data
    assert len(data["parameters"]) == 8
    assert "recommendations" in data
