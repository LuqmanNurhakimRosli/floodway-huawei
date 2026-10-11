"""HTTP(S) snapshot source (a URL that returns a JPEG/PNG of the latest frame)."""
from __future__ import annotations

import time
from typing import Optional

import cv2
import httpx
import numpy as np

from ..url_guard import UnsafeURL, validate_source_url
from .base import FrameSource, SourceError

MAX_BYTES = 5 * 1024 * 1024


class SnapshotSource(FrameSource):
    def __init__(self, url: str, username: Optional[str], password: Optional[str], allow_private: bool = False):
        self.url = url
        self.auth = (username, password) if username and password else None
        self.allow_private = allow_private

    def _fetch_one(self) -> np.ndarray:
        try:
            validate_source_url(self.url, self.allow_private)  # re-validate on every fetch
        except UnsafeURL as exc:
            raise SourceError(str(exc)) from exc
        try:
            with httpx.Client(timeout=5.0, follow_redirects=False) as client:
                resp = client.get(self.url, auth=self.auth)
        except httpx.HTTPError as exc:
            raise SourceError(f"snapshot request failed: {exc.__class__.__name__}") from exc
        if resp.status_code != 200:
            raise SourceError(f"snapshot returned HTTP {resp.status_code}")
        if len(resp.content) > MAX_BYTES:
            raise SourceError("snapshot is too large")
        frame = cv2.imdecode(np.frombuffer(resp.content, np.uint8), cv2.IMREAD_COLOR)
        if frame is None:
            raise SourceError("snapshot is not a valid image")
        return frame

    def grab_frames(self, n: int, gap_s: float) -> list[np.ndarray]:
        frames: list[np.ndarray] = []
        for i in range(n):
            frames.append(self._fetch_one())
            if i < n - 1:
                time.sleep(gap_s)
        return frames
