"""Check the rendered demo: length, loudness, black frames, caption timing against the voice, contact sheet.

  video/.venv/Scripts/python.exe video/verify.py
Caption timing: for every narration line, the frame where its caption appears is compared
with the frame where its voice clip starts (both from timeline.json; the caption is read off the render).
"""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "out"
VIDEO = OUT / "floodway_demo.mp4"


def run(args: list[str]) -> str:
    """ffmpeg's filter reports go to stderr."""
    return subprocess.run(args, capture_output=True, text=True, encoding="utf-8", errors="replace").stderr


def frames(times: list[float], w: int = 480) -> list[np.ndarray]:
    """Decode the frames nearest to each time (seconds), scaled to width w."""
    out = []
    for t in times:
        raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.4f}", "-i", str(VIDEO), "-frames:v", "1", "-vf", f"scale={w}:-2", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
        h = len(raw) // (w * 3)
        out.append(np.frombuffer(raw, np.uint8).reshape(h, w, 3))
    return out


def caption_region(img: np.ndarray, left: bool) -> np.ndarray:
    """Where the caption box sits: bottom-left column on the app scenes, bottom-centre elsewhere."""
    h, w, _ = img.shape
    rows = slice(int(h * 0.80), int(h * 0.97))
    return (img[rows, : int(w * 0.5)] if left else img[rows, int(w * 0.2): int(w * 0.8)]).astype(np.float64)


def main() -> None:
    tl = json.loads((ROOT / "timeline.json").read_text(encoding="utf-8"))
    fps = tl["fps"]
    probe = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_name,width,height,r_frame_rate,bit_rate", "-of", "compact", str(VIDEO)], capture_output=True, text=True).stdout
    print(probe.strip())
    loud = run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(VIDEO), "-af", "ebur128=peak=true", "-f", "null", "-"])
    i_lufs = re.findall(r"I:\s+(-?[\d.]+) LUFS", loud)[-1]
    peak = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", loud)[-1]
    print(f"loudness {i_lufs} LUFS integrated, true peak {peak} dBFS")
    black = re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(VIDEO), "-vf", "blackdetect=d=0.1:pix_th=0.06", "-an", "-f", "null", "-"]))
    print(f"black stretches >= 0.1 s: {black or 'none'}")

    # caption timing: around each line's start, the first frame where the caption area looks more like the new
    # caption (10 frames later) than like what was there before (8 frames earlier, possibly the previous caption)
    worst = 0
    for c in tl["cues"]:
        if c["scene"] == 9:  # the end card shows this line as its tagline, not as a caption
            continue
        left = c["scene"] in (4, 6, 7) or (c["scene"] == 8 and c["id"] != "s13")
        ks = list(range(-8, 11))
        regs = [caption_region(im, left) for im in frames([(c["from"] + k) / fps for k in ks])]
        off = next(k for k, r in zip(ks, regs) if np.abs(r - regs[-1]).mean() < np.abs(r - regs[0]).mean())
        worst = max(worst, abs(off))
        print(f"  {c['id']:5s} voice frame {c['from']:5d}  caption appears {'+' if off >= 0 else ''}{off} frames")
    print(f"worst caption offset: {worst} frames")

    # contact sheet: 12 frames spread over the scenes
    picks = []
    for s in tl["scenes"]:
        n = 2 if s["scene"] in (3, 4, 6, 8) else 1
        picks += [s["start"] + (s["end"] - s["start"]) * (k + 1) / (n + 1) for k in range(n)]
    picks = picks[:12]
    ims = frames(picks, 640)
    sheet = Image.new("RGB", (4 * 644, 3 * 364), "white")
    for i, im in enumerate(ims):
        sheet.paste(Image.fromarray(im), ((i % 4) * 644, (i // 4) * 364))
    sheet.save(OUT / "contact_sheet.jpg", quality=88)
    print("contact sheet at", ", ".join(f"{t:.1f}s" for t in picks))


if __name__ == "__main__":
    main()
