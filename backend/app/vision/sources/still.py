"""A photo the user uploaded, stored on the server. It never changes, so it is playback, not a live feed."""
from __future__ import annotations

import re
from pathlib import Path

import cv2
import numpy as np

from ..url_guard import UnsafeURL
from .base import FrameSource, SourceError

UPLOAD_PREFIX = "upload:"
_ID = re.compile(r"[0-9a-f]{32}")


def upload_id_from_url(source_url: str | None) -> str:
    """'upload:<32 hex>' -> the id. Anything else is rejected, so a URL can never name an arbitrary path."""
    value = source_url or ""
    token = value[len(UPLOAD_PREFIX):] if value.startswith(UPLOAD_PREFIX) else ""
    if not _ID.fullmatch(token):
        raise UnsafeURL("invalid upload reference")
    return token


class StillSource(FrameSource):
    is_playback = True

    def __init__(self, path: Path):
        self.path = path

    def grab_frames(self, n: int, gap_s: float) -> list[np.ndarray]:
        frame = cv2.imread(str(self.path), cv2.IMREAD_COLOR) if self.path.exists() else None
        if frame is None:
            raise SourceError("the uploaded photo is missing")
        return [frame.copy() for _ in range(n)]
