"""Tests for the crop disease diagnosis route and safety contract."""

import io
from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.agents import disease_doctor
from app.main import app

client = TestClient(app)

DUMMY_JPEG = (
    b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00"
    b"\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t"
    b"\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00"
    b"\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00"
    b"\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9"
)


def test_diagnose_requires_grounding_configuration(monkeypatch) -> None:
    """An image must not receive a fabricated diagnosis without provider/RAG credentials."""
    monkeypatch.setattr(
        disease_doctor,
        "get_settings",
        lambda: SimpleNamespace(groq_api_key="", meko_api_key=""),
    )
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

    assert response.status_code == 503
    assert "required" in response.json()["detail"].lower()


def test_diagnose_rejects_non_image() -> None:
    """Non-image files must be rejected with 400 Bad Request."""
    response = client.post(
        "/api/diagnose",
        files={"file": ("notes.txt", io.BytesIO(b"just text"), "text/plain")},
        data={"farmer_id": "test"},
    )

    assert response.status_code == 400
    assert "image" in response.json()["detail"].lower()


def test_diagnose_does_not_fabricate_english_result(monkeypatch) -> None:
    """English image requests also fail explicitly when grounding is unavailable."""
    monkeypatch.setattr(
        disease_doctor,
        "get_settings",
        lambda: SimpleNamespace(groq_api_key="", meko_api_key=""),
    )
    response = client.post(
        "/api/diagnose",
        files={"file": ("rice_leaf.png", io.BytesIO(DUMMY_JPEG), "image/png")},
        data={"crop": "rice", "language": "en"},
    )

    assert response.status_code == 503
    assert "required" in response.json()["detail"].lower()
