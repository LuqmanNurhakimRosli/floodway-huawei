"""Telegram alert relay. The bot token lives only in the backend environment; the browser sends the message text.

Abuse controls (the endpoint can message a Telegram chat, so it must not be an open relay):
  * message length and chat-id format are validated,
  * a per-client rate limit applies,
  * once VISION_WRITE_TOKEN is set (see app/security.py) the caller must present it.
"""
from __future__ import annotations

import time
from collections import defaultdict, deque

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from app.security import require_write_token
from app.services.notifier import notifier

router = APIRouter(prefix="/api/v1/alerts", tags=["Alerts"])

RATE_LIMIT = 10          # messages
RATE_WINDOW_S = 60.0     # per window, per client
_hits: dict[str, deque] = defaultdict(deque)


class TelegramMessage(BaseModel):
    text: str = Field(min_length=1, max_length=1500)
    chat_id: str | None = Field(default=None, max_length=64, pattern=r"^(@[A-Za-z0-9_]{4,64}|-?\d{3,20})$")


class TelegramResult(BaseModel):
    sent: bool
    simulated: bool
    detail: str


def _check_rate(client: str, now: float | None = None) -> None:
    now = time.monotonic() if now is None else now
    q = _hits[client]
    while q and now - q[0] > RATE_WINDOW_S:
        q.popleft()
    if len(q) >= RATE_LIMIT:
        raise HTTPException(429, "too many alert messages, slow down")
    q.append(now)


@router.post("/telegram", response_model=TelegramResult, dependencies=[Depends(require_write_token)])
async def send_telegram(msg: TelegramMessage, request: Request):
    _check_rate(request.client.host if request.client else "unknown")
    sent = await notifier.send_telegram(msg.text, msg.chat_id)
    if sent:
        return TelegramResult(sent=True, simulated=False, detail="delivered by the FloodWay bot")
    return TelegramResult(sent=False, simulated=True, detail="Telegram is not configured on the server, or the chat is unreachable. Nothing was delivered.")
