import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routes import sos
from app.security import RateLimiter
from app.services.notifier import notifier


@pytest.fixture()
def client(monkeypatch):
    monkeypatch.delenv("VISION_WRITE_TOKEN", raising=False)
    monkeypatch.setattr(sos, "_limiter", RateLimiter(limit=10, window_s=60))
    sent = []

    async def fake_send(text, chat_id=None):
        sent.append(text)
        return True

    monkeypatch.setattr(notifier, "send_telegram", fake_send)
    app = FastAPI()
    app.include_router(sos.router)
    c = TestClient(app)
    c.sent = sent
    return c


def test_user_fields_are_html_escaped_in_the_telegram_message(client):
    r = client.post("/api/v1/sos/broadcast", json={"userName": '<a href="http://evil.example">click</a>', "shelterName": "<b>x</b>"})
    assert r.status_code == 200
    msg = client.sent[0]
    # The template has its own map link; what must not appear is the injected one, except in escaped form.
    assert '<a href="http://evil.example">' not in msg
    assert '&lt;a href="http://evil.example"&gt;click&lt;/a&gt;' in msg
    assert "<b>x</b>" not in msg and "&lt;b&gt;x&lt;/b&gt;" in msg


@pytest.mark.parametrize("body", [{"userName": "x" * 61}, {"lat": 91}, {"waterDepthCm": -1}, {"note": "n" * 201}])
def test_oversized_or_out_of_range_input_is_rejected(client, body):
    assert client.post("/api/v1/sos/broadcast", json=body).status_code == 422
    assert client.sent == []


def test_reports_not_sent_when_telegram_is_not_configured(client, monkeypatch):
    async def nope(text, chat_id=None):
        return False

    monkeypatch.setattr(notifier, "send_telegram", nope)
    body = client.post("/api/v1/sos/checkin", json={}).json()
    assert body["status"] == "NOT_SENT"  # it used to answer SUCCESS even when nothing was delivered


def test_rate_limited_and_token_guarded(client, monkeypatch):
    codes = [client.post("/api/v1/sos/checkin", json={}).status_code for _ in range(12)]
    assert codes[:10] == [200] * 10 and codes[10:] == [429, 429]
    monkeypatch.setattr(sos, "_limiter", RateLimiter(limit=10, window_s=60))
    monkeypatch.setenv("VISION_WRITE_TOKEN", "tok")
    assert client.post("/api/v1/sos/checkin", json={}).status_code == 401
    assert client.post("/api/v1/sos/checkin", json={}, headers={"Authorization": "Bearer tok"}).status_code == 200
