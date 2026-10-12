from __future__ import annotations

from typing import Optional

from ..config import VisionSettings
from .base import FrameSource
from .snapshot import SnapshotSource
from .still import StillSource, upload_id_from_url
from .stream import StreamSource


def build_source(
    source_type: str,
    source_url: Optional[str],
    username: Optional[str],
    password: Optional[str],
    settings: VisionSettings,
) -> FrameSource:
    if source_type == "snapshot":
        return SnapshotSource(source_url or "", username, password, settings.allow_private_urls)
    if source_type == "stream":
        return StreamSource(source_url or "", username, password, settings.allow_private_urls)
    if source_type == "upload":
        return StillSource(settings.uploads_dir / f"{upload_id_from_url(source_url)}.jpg")
    raise ValueError(f"unsupported source type for user cameras: {source_type}")
