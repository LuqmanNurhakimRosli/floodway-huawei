"""Turn the 1280x720 master PNGs into the files the app reads.

Run from backend/:  python -m app.vision.sample_media.export_ladder [webp_out_dir]

Reads   sample_media/master/{cam}-r{NNN}.png            (12 rungs per camera, NNN = ratio x 100, r000 .. r110)
Writes  sample_media/{cam}-r{NNN}.jpg                    640x360, quality 88   (the analyser and the backend read these)
        sample_media/{cam}-{normal,watch,warning,danger}.jpg   byte-identical copies of r010, r040, r080, r100
        <webp_out_dir>/{cam}-r{NNN}.webp and the four legacy names   960x540, quality 78
Default webp_out_dir is frontend/public/media/live."""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

import cv2

HERE = Path(__file__).parent
CAMERAS = ("klang", "gombak", "smart", "batu", "drain")
RUNGS = tuple(range(0, 120, 10))                      # 0, 10, ... 110  (ratio x 100)
LEGACY = {"normal": 10, "watch": 40, "warning": 80, "danger": 100}
DEFAULT_WEBP = HERE.parents[3] / "frontend" / "public" / "media" / "live"


def name(cam: str, rung: int, ext: str) -> str:
    return f"{cam}-r{rung:03d}.{ext}"


def main(webp_dir: Path) -> int:
    webp_dir.mkdir(parents=True, exist_ok=True)
    missing = []
    for cam in CAMERAS:
        for rung in RUNGS:
            src = HERE / "master" / name(cam, rung, "png")
            img = cv2.imread(str(src))
            if img is None:
                missing.append(src.name)
                continue
            small = cv2.resize(img, (640, 360), interpolation=cv2.INTER_AREA)
            cv2.imwrite(str(HERE / name(cam, rung, "jpg")), small, [cv2.IMWRITE_JPEG_QUALITY, 88])
            big = cv2.resize(img, (960, 540), interpolation=cv2.INTER_AREA)
            cv2.imwrite(str(webp_dir / name(cam, rung, "webp")), big, [cv2.IMWRITE_WEBP_QUALITY, 78])
        for level, rung in LEGACY.items():
            for ext, folder in (("jpg", HERE), ("webp", webp_dir)):
                src = folder / name(cam, rung, ext)
                if src.exists():
                    shutil.copyfile(src, folder / f"{cam}-{level}.{ext}")
    if missing:
        print(f"MISSING {len(missing)} master files, e.g. {missing[:4]}")
        return 1
    print(f"exported {len(CAMERAS) * len(RUNGS)} rungs (+ legacy copies) to {HERE} and {webp_dir}")
    return 0


if __name__ == "__main__":
    sys.exit(main(Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_WEBP))
