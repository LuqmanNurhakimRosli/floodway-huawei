"""RTSP / HLS / MJPEG source using OpenCV. We open, read a short burst, and close each cycle
so a dropped connection heals itself on the next tick."""
from __future__ import annotations

import time
from typing import Optional
from urllib.parse import quote, urlparse, urlunparse

import cv2
import numpy as np

from ..url_guard import UnsafeURL, validate_source_url
from .base import FrameSource, SourceError


class StreamSource(FrameSource):
    def __init__(self, url: str, username: Optional[str], password: Optional[str], allow_private: bool = False):
        self.url = url
        self.username = username
        self.password = password
        self.allow_private = allow_private

    def _authed_url(self) -> str:
        if not (self.username and self.password):
            return self.url
        p = urlparse(self.url)
        user = quote(self.username, safe="")
        pwd = quote(self.password, safe="")
        netloc = f"{user}:{pwd}@{p.hostname}"
        if p.port:
            netloc += f":{p.port}"
        return urlunparse(p._replace(netloc=netloc))

    def grab_frames(self, n: int, gap_s: float) -> list[np.ndarray]:
        try:
            validate_source_url(self.url, self.allow_private)
        except UnsafeURL as exc:
            raise SourceError(str(exc)) from exc
        cap = cv2.VideoCapture()
        for prop, value in (("CAP_PROP_OPEN_TIMEOUT_MSEC", 5000), ("CAP_PROP_READ_TIMEOUT_MSEC", 5000)):
            if hasattr(cv2, prop):
                cap.set(getattr(cv2, prop), value)
        try:
            if not cap.open(self._authed_url()):
                raise SourceError("could not open stream")
            frames: list[np.ndarray] = []
            for i in range(n):
                ok, frame = cap.read()
                if not ok or frame is None:
                    break
                frames.append(frame)
                if i < n - 1:
                    time.sleep(gap_s)
            if not frames:
                raise SourceError("stream opened but returned no frames")
            return frames
        finally:
            cap.release()
