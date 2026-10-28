"""Narration for the FloodWay demo video: one wav per script line (Kokoro-82M).

Usage (from the repo root, with the video venv):
  video/.venv/Scripts/python.exe video/tts.py                 # every line
  video/.venv/Scripts/python.exe video/tts.py --only s07      # one line
  video/.venv/Scripts/python.exe video/tts.py --test s02      # same line in 3 voices, to pick one

Output: video/audio/voice/<id>.wav, 24 kHz mono, silence trimmed, -16 LUFS.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from kokoro import KPipeline

ROOT = Path(__file__).resolve().parent
SCRIPT = ROOT / "script.json"
OUT = ROOT / "audio" / "voice"
SR = 24_000
TARGET_LUFS = -16.0
TEST_VOICES = ("am_michael", "am_fenrir", "am_onyx")


def trim(audio: np.ndarray, threshold_db: float = -45.0, pad_ms: int = 40) -> np.ndarray:
    """Cut leading and trailing silence, keeping a short pad so words are not clipped."""
    level = 10 ** (threshold_db / 20)
    loud = np.flatnonzero(np.abs(audio) > level)
    if loud.size == 0:
        return audio
    pad = int(SR * pad_ms / 1000)
    return audio[max(0, loud[0] - pad): min(len(audio), loud[-1] + pad)]


def normalise(audio: np.ndarray) -> np.ndarray:
    meter = pyln.Meter(SR)
    out = pyln.normalize.loudness(audio, meter.integrated_loudness(audio), TARGET_LUFS)
    peak = np.max(np.abs(out))
    return out / peak * 0.98 if peak > 0.98 else out


def speak(pipe: KPipeline, text: str, voice: str, speed: float) -> np.ndarray:
    parts = [np.asarray(r.audio, dtype=np.float32) for r in pipe(text, voice=voice, speed=speed)]
    return normalise(trim(np.concatenate(parts)))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="render one line id, e.g. s07")
    ap.add_argument("--test", help="render this line id in the three test voices")
    ap.add_argument("--voice", default="am_michael")
    ap.add_argument("--speed", type=float, default=0.95)
    a = ap.parse_args()

    lines = {x["id"]: x for x in json.loads(SCRIPT.read_text(encoding="utf-8"))}
    pipe = KPipeline(lang_code="a")
    OUT.mkdir(parents=True, exist_ok=True)

    if a.test:
        for v in TEST_VOICES:
            path = OUT.parent / f"voice_test_{v}.wav"
            sf.write(path, speak(pipe, lines[a.test]["text"], v, a.speed), SR, subtype="PCM_16")
            print("wrote", path.name)
        return

    for lid, line in lines.items():
        if a.only and lid != a.only:
            continue
        audio = speak(pipe, line["text"], a.voice, a.speed)
        sf.write(OUT / f"{lid}.wav", audio, SR, subtype="PCM_16")
        print(f"{lid}  {len(audio) / SR:5.2f}s  {line['text']}")


if __name__ == "__main__":
    main()
