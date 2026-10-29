"""Check the rendered v2 demo (length, loudness, black frames), write its .srt and a contact sheet.

  video/.venv/Scripts/python.exe video/v2/verify_v2.py
"""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

from PIL import Image

V2 = Path(__file__).resolve().parent
OUT = V2 / "out"
VIDEO = OUT / "floodway_demo_v2.mp4"


def stderr(args: list[str]) -> str:
    return subprocess.run(args, capture_output=True, text=True, encoding="utf-8", errors="replace").stderr


def srt() -> str:
    """One subtitle per sentence of the script, timed to your words."""
    words = json.loads((V2 / "words.json").read_text(encoding="utf-8"))["words"]
    rows, cur = [], []
    for w in words:
        if cur and (re.search(r"[.?]$", cur[-1]["w"]) or cur[0]["scene"] != w["scene"]):
            rows.append(cur)
            cur = []
        cur.append(w)
    rows.append(cur)
    stamp = lambda s: f"{int(s // 3600):02d}:{int(s % 3600 // 60):02d}:{int(s % 60):02d},{int(round(s % 1 * 1000)) % 1000:03d}"
    out = []
    for i, r in enumerate(rows):
        end = min(r[-1]["b"] + 0.4, rows[i + 1][0]["a"] - 0.05) if i + 1 < len(rows) else r[-1]["b"] + 0.4
        out.append(f"{i + 1}\n{stamp(r[0]['a'])} --> {stamp(end)}\n{' '.join(w['w'] for w in r)}\n")
    return "\n".join(out)


def main() -> None:
    print(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_name,width,height,r_frame_rate", "-of", "compact", str(VIDEO)], capture_output=True, text=True).stdout.strip())
    loud = stderr(["ffmpeg", "-hide_banner", "-nostats", "-i", str(VIDEO), "-af", "ebur128=peak=true", "-f", "null", "-"])
    lufs, peak = re.findall(r"I:\s+(-?[\d.]+) LUFS", loud)[-1], re.findall(r"Peak:\s+(-?[\d.]+) dBFS", loud)[-1]
    print(f"loudness {lufs} LUFS, true peak {peak} dBFS")
    black = re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", stderr(["ffmpeg", "-hide_banner", "-nostats", "-i", str(VIDEO), "-vf", "blackdetect=d=0.1:pix_th=0.06", "-an", "-f", "null", "-"]))
    print(f"black stretches >= 0.1 s: {black or 'none'}")
    (OUT / "floodway_demo_v2.srt").write_text(srt(), encoding="utf-8")

    scenes = json.loads((V2 / "edit.json").read_text(encoding="utf-8"))["scenes"]
    picks = [a + (b - a) * 0.75 for a, b in scenes.values()] + [30.0, 58.0, 82.6]
    sheet = Image.new("RGB", (4 * 480, 3 * 270))
    for i, t in enumerate(sorted(picks)[:12]):
        raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.3f}", "-i", str(VIDEO), "-frames:v", "1", "-vf", "scale=480:270", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
        sheet.paste(Image.frombytes("RGB", (480, 270), raw), ((i % 4) * 480, (i // 4) * 270))
    sheet.save(OUT / "contact_sheet_v2.jpg", quality=88)
    print("srt + contact sheet written")


if __name__ == "__main__":
    main()
