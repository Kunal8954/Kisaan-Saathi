"""API contract smoke tests for scaffolded feature routes."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_chat_route_orchestration() -> None:
    """The chat contract is mounted and returns 200 with orchestrated agent reply."""

    response = client.post(
        "/api/chat",
        json={
            "message": "मेरी गेहूं की फसल के लिए क्या करें?",
            "language": "hi",
            "experience_mode": "new_farmer",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert len(data["reply"]) > 0
    assert "agent" in data
