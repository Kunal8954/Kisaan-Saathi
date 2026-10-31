"""Health endpoint smoke test."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_returns_200() -> None:
    """The service starts without cloud credentials and reports healthy."""

    response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "Kisan Saathi"
    assert body["version"] == "0.1.0"
