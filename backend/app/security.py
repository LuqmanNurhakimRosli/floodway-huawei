"""Shared write-access guard (Plan B P5-03).

Set VISION_WRITE_TOKEN in the backend environment to require `Authorization: Bearer <token>` on write endpoints.
With no token set (local development), writes stay open and the server logs one warning, so the demo is not broken.
This is not user accounts: it stops anonymous writes on a deployed demo, nothing more. The token is a server secret
and must never be placed in a VITE_ variable or compiled into the frontend.
"""
from __future__ import annotations

import hmac
import logging
import os

from fastapi import Header, HTTPException

logger = logging.getLogger("FloodWaySecurity")
_warned = False


def write_token() -> str:
    return os.getenv("VISION_WRITE_TOKEN", "")


async def require_write_token(authorization: str | None = Header(default=None)) -> None:
    global _warned
    expected = write_token()
    if not expected:
        if not _warned:
            logger.warning("VISION_WRITE_TOKEN is not set: write endpoints are OPEN. Set it before any public deployment.")
            _warned = True
        return
    scheme, _, supplied = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not hmac.compare_digest(supplied.encode(), expected.encode()):
        raise HTTPException(401, "a valid bearer token is required", headers={"WWW-Authenticate": "Bearer"})


class RateLimiter:
    """Sliding-window limiter keyed by client. In-memory, per process: enough to stop an open relay on a demo."""

    def __init__(self, limit: int, window_s: float):
        from collections import defaultdict, deque

        self.limit, self.window_s = limit, window_s
        self._hits: dict[str, "deque[float]"] = defaultdict(deque)

    def check(self, client: str, now: float | None = None) -> None:
        import time

        now = time.monotonic() if now is None else now
        q = self._hits[client]
        while q and now - q[0] > self.window_s:
            q.popleft()
        if len(q) >= self.limit:
            raise HTTPException(429, "too many requests, slow down")
        q.append(now)
