"""Build the Klang demo loop from the Klang ladder photos (needs ffmpeg on PATH).

Run from backend/:  python -m app.vision.sample_media.make_loop [out_dir]

The water rises from rung r010 to r110 over 10 s, then falls back to r010 over 5 s, so the loop has no jump. Neighbouring
rungs are only a tenth of the bank apart, so dissolving between them reads as a steady rise, not a crossfade.
Writes  klang-rise.mp4 (H.264, 640x360, 25 fps, no audio) and klang-rise-poster.webp (rung r010)
Default out_dir is frontend/public/media/live."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np

HERE = Path(__file__).parent
DEFAULT_OUT = HERE.parents[3] / "frontend" / "public" / "media" / "live"
FPS = 25
UP_RUNGS = list(range(10, 120, 10))           # r010 .. r110
UP_S, DOWN_S = 10.0, 5.0


def segment(a: np.ndarray, b: np.ndarray, n: int):
    for i in range(n):
        t = i / n
        t = t * t * (3 - 2 * t)                # smoothstep: ease in and out of each rung
        yield cv2.addWeighted(a, 1 - t, b, t, 0)


def frames(ladder: dict[int, np.ndarray]):
    up = list(zip(UP_RUNGS, UP_RUNGS[1:]))
    n_up = round(UP_S * FPS / len(up))
    n_down = round(DOWN_S * FPS / len(up))
    for lo, hi in up:
        yield from segment(ladder[lo], ladder[hi], n_up)
    for lo, hi in reversed(up):
        yield from segment(ladder[hi], ladder[lo], n_down)


def main(out_dir: Path) -> int:
    ladder = {r: cv2.imread(str(HERE / f"klang-r{r:03d}.jpg")) for r in UP_RUNGS}
    gone = [f"r{r:03d}" for r, img in ladder.items() if img is None]
    if gone:
        print(f"MISSING klang rungs {gone}")
        return 1
    out_dir.mkdir(parents=True, exist_ok=True)
    mp4 = out_dir / "klang-rise.mp4"
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", "640x360", "-r", str(FPS),
           "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "26", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
           "-an", str(mp4)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    count = 0
    for frame in frames(ladder):
        proc.stdin.write(frame.tobytes())
        count += 1
    proc.stdin.close()
    if proc.wait() != 0:
        print("ffmpeg failed")
        return 1
    cv2.imwrite(str(out_dir / "klang-rise-poster.webp"), ladder[10], [cv2.IMWRITE_WEBP_QUALITY, 80])
    print(f"{count} frames, {count / FPS:.1f} s, {mp4.stat().st_size / 1024:.0f} KB -> {mp4}")
    return 0


if __name__ == "__main__":
    sys.exit(main(Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_OUT))
