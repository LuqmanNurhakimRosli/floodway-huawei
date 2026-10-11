"""Common interface for anything that can give us frames. All methods are blocking;
the engine runs them in a worker thread."""
from __future__ import annotations

from abc import ABC, abstractmethod

import numpy as np


class SourceError(RuntimeError):
    """Raised when a frame cannot be fetched (offline, timeout, bad image, blocked URL)."""


class FrameSource(ABC):
    is_playback: bool = False

    @abstractmethod
    def grab_frames(self, n: int, gap_s: float) -> list[np.ndarray]:
        """Return up to n BGR frames spaced roughly gap_s apart. Raise SourceError on failure."""
