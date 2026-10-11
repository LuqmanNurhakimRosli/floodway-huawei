"""Does each rising-water frame contain real water, or a flat patch drawn over the NORMAL frame?

check_frames.py only asks whether the analyser classifies each frame at the intended level. A flat tan rectangle drawn
over the channel passes that test (the analyser looks for smooth coloured pixels), so a 20/20 there says almost nothing
about realism. This script looks at the pixels that changed between the NORMAL frame and each other frame of the same
camera. Real generated water changes the scene irregularly (it follows the channel, wets the walls, reflects, and has an
uneven edge). A pasted patch is a flat block that fills its own bounding box.

Run from backend/:  python -m app.vision.sample_media.check_realism
Exit code 1 if any frame looks like a pasted patch.

Thresholds come from measurements of the current set: every one of its 15 non-normal frames has a changed region that
fills 81-94% of its bounding box with colour standard deviation under 9. A frame is flagged when the changed region
fills at least 75% of its bounding box AND is flat (colour std under 10). This is a heuristic, not a proof of realism:
passing it does not make a frame real. Look at the frames.
"""
from __future__ import annotations

import sys
from pathlib import Path

import cv2
import numpy as np

HERE = Path(__file__).parent
CAMERAS = ("klang", "gombak", "smart", "batu", "drain")
LEVELS = ("watch", "warning", "danger")
CHANGE_THRESHOLD = 25   # per-channel difference that counts as a changed pixel
FILL_LIMIT = 0.75       # changed area / bounding box: above this the change is block-shaped
FLAT_LIMIT = 10.0       # colour std inside the changed region: below this it is a flat colour


def measure(camera: str, level: str, media_dir: Path = HERE) -> dict:
    base = cv2.imread(str(media_dir / f"{camera}-normal.jpg")).astype(int)
    frame = cv2.imread(str(media_dir / f"{camera}-{level}.jpg")).astype(int)
    changed = np.abs(frame - base).max(axis=2) > CHANGE_THRESHOLD
    ys, xs = np.where(changed)
    if not len(ys):
        return {"changed": 0.0, "fill": 0.0, "std": 0.0, "pasted": False, "empty": True}
    box = (ys.max() - ys.min() + 1) * (xs.max() - xs.min() + 1)
    fill = float(changed.sum() / box)
    std = float(frame[changed].std(axis=0).mean())
    return {"changed": float(changed.mean()), "fill": fill, "std": std, "pasted": fill >= FILL_LIMIT and std < FLAT_LIMIT, "empty": False}


def main() -> int:
    flagged = 0
    total = 0
    for cam in CAMERAS:
        for level in LEVELS:
            m = measure(cam, level)
            total += 1
            flagged += m["pasted"]
            verdict = "PASTED PATCH" if m["pasted"] else "ok"
            print(f"{cam:7s}{level:8s} changed {m['changed'] * 100:5.1f}%  fills box {m['fill'] * 100:5.1f}%  colour std {m['std']:5.1f}  {verdict}")
    print(f"\n{flagged}/{total} rising-water frames look like a flat patch drawn over the NORMAL frame")
    return 1 if flagged else 0


if __name__ == "__main__":
    sys.exit(main())
