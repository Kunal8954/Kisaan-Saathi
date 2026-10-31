"""Tests for the crop disease diagnosis route and safety contract."""

import io

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

DUMMY_JPEG = (
    b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00"
    b"\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t"
    b"\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00"
    b"\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00"
    b"\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9"
)


def test_diagnose_crop_success() -> None:
    """A valid image returns 200 and a full DiagnosisResult conforming to safety rules."""
    response = client.post(
        "/api/diagnose",
        files={"file": ("wheat_rust.jpg", io.BytesIO(DUMMY_JPEG), "image/jpeg")},
        data={
            "farmer_id": "8f3c9d2a-2a0d-4f03-9e4d-8f2ef6f7f2a1",
            "crop": "wheat",
            "language": "hi",
            "experience_mode": "new_farmer",
        },
    )

    assert response.status_code == 200
    data = response.json()

    assert data["crop"] == "wheat"
    assert "likely_cause" in data
    assert 0.0 <= data["confidence"] <= 1.0
    assert "KVK" in data["disclaimer"] or "कृषि विज्ञान केंद्र" in data["disclaimer"]
    assert len(data["sources"]) >= 1

    # Safety contract: exactly two remedies, one chemical, one organic
    remedies = data["remedies"]
    assert len(remedies) == 2
    types = {r["remedy_type"] for r in remedies}
    assert types == {"chemical_fertilizer", "organic_cow_dung"}
    for remedy in remedies:
        assert len(remedy["title"]) > 0
        assert len(remedy["instructions"]) > 0
        assert len(remedy["source_ids"]) >= 1


def test_diagnose_rejects_non_image() -> None:
    """Non-image files must be rejected with 400 Bad Request."""
    response = client.post(
        "/api/diagnose",
        files={"file": ("notes.txt", io.BytesIO(b"just text"), "text/plain")},
        data={"farmer_id": "test"},
    )

    assert response.status_code == 400
    assert "image" in response.json()["detail"].lower()


def test_diagnose_supports_english_language() -> None:
    """English language returns English disclaimer and remedy text."""
    response = client.post(
        "/api/diagnose",
        files={"file": ("rice_leaf.png", io.BytesIO(DUMMY_JPEG), "image/png")},
        data={"crop": "rice", "language": "en"},
    )

    assert response.status_code == 200
    data = response.json()
    assert "Krishi Vigyan Kendra" in data["disclaimer"]
