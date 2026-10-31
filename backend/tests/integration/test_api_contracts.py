"""API contract smoke tests for scaffolded feature routes."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_chat_route_is_explicitly_not_implemented() -> None:
    """The chat contract is mounted and returns 501 until the orchestrator exists."""

    response = client.post(
        "/api/chat",
        json={
            "message": "मेरी गेहूं की फसल के लिए क्या करें?",
            "language": "hi",
            "experience_mode": "new_farmer",
        },
    )

    assert response.status_code == 501
    assert "not implemented" in response.json()["detail"].lower()
