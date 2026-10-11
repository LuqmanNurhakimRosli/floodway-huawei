import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routes import alerts
from app.services.notifier import notifier


@pytest.fixture()
def client(monkeypatch):
    monkeypatch.delenv("VISION_WRITE_TOKEN", raising=False)
    monkeypatch.setattr(alerts, "_hits", alerts.defaultdict(alerts.deque))
    app = FastAPI()
    app.include_router(alerts.router)
    return TestClient(app)


def _stub(monkeypatch, result: bool):
    sent = []

    async def fake(text, chat_id=None):
        sent.append((text, chat_id))
        return result

    monkeypatch.setattr(notifier, "send_telegram", fake)
    return sent


def test_delivers_through_the_server_side_bot(client, monkeypatch):
    sent = _stub(monkeypatch, True)
    r = client.post("/api/v1/alerts/telegram", json={"text": "hello", "chat_id": "@floodway_demo"})
    assert r.status_code == 200 and r.json()["sent"] is True and r.json()["simulated"] is False
    assert sent == [("hello", "@floodway_demo")]


def test_reports_simulated_when_telegram_is_not_configured(client, monkeypatch):
    _stub(monkeypatch, False)
    body = client.post("/api/v1/alerts/telegram", json={"text": "hello"}).json()
    assert body["sent"] is False and body["simulated"] is True
    assert "not configured" in body["detail"]


@pytest.mark.parametrize("payload", [
    {"text": ""},
    {"text": "x" * 1501},
    {"text": "ok", "chat_id": "not a chat id"},
    {"text": "ok", "chat_id": "@x"},
    {"text": "ok", "chat_id": "123; DROP"},
])
def test_rejects_bad_input(client, monkeypatch, payload):
    _stub(monkeypatch, True)
    assert client.post("/api/v1/alerts/telegram", json=payload).status_code == 422


def test_rate_limit(client, monkeypatch):
    _stub(monkeypatch, True)
    codes = [client.post("/api/v1/alerts/telegram", json={"text": "hi"}).status_code for _ in range(alerts.RATE_LIMIT + 2)]
    assert codes[: alerts.RATE_LIMIT] == [200] * alerts.RATE_LIMIT
    assert codes[alerts.RATE_LIMIT:] == [429, 429]


def test_requires_the_write_token_once_one_is_set(client, monkeypatch):
    _stub(monkeypatch, True)
    monkeypatch.setenv("VISION_WRITE_TOKEN", "s3cret-token")
    url = "/api/v1/alerts/telegram"
    body = {"text": "hi"}
    assert client.post(url, json=body).status_code == 401
    assert client.post(url, json=body, headers={"Authorization": "Bearer wrong"}).status_code == 401
    assert client.post(url, json=body, headers={"Authorization": "Basic s3cret-token"}).status_code == 401
    assert client.post(url, json=body, headers={"Authorization": "Bearer s3cret-token"}).status_code == 200
