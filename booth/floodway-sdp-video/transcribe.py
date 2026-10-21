"""Transcribe the narrator recordings with word timings, so scenes can be cut to the real speech.

Run:  python transcribe.py <materials-demo folder>     (needs faster-whisper; the model downloads once)
Writes out/narration/<name>.wav (16 kHz mono, for timing) and out/narration/transcripts.json:
  {"<file>": {"duration": s, "words": [[start, end, "word"], ...], "text": "..."}}
"""
import json
import subprocess
import sys
from pathlib import Path

from faster_whisper import WhisperModel

SRC = Path(sys.argv[1])
OUT = Path(__file__).parent / "out" / "narration"
OUT.mkdir(parents=True, exist_ok=True)
FILES = ["1.Nadi.MOV", "2-Luqman.mp4", "3.aniq.mp4"]

model = WhisperModel("small.en", device="cpu", compute_type="int8")
result = {}
for name in FILES:
    wav = OUT / (Path(name).stem + ".wav")
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(SRC / name), "-map", "0:a:0", "-ac", "1", "-ar", "16000", str(wav)], check=True)
    segs, info = model.transcribe(str(wav), word_timestamps=True, vad_filter=True, language="en")
    words = [[round(w.start, 2), round(w.end, 2), w.word.strip()] for s in segs for w in s.words]
    result[name] = {"duration": round(info.duration, 2), "words": words, "text": " ".join(w[2] for w in words)}
    print(f"{name}: {len(words)} words, {info.duration:.1f} s")
(OUT / "transcripts.json").write_text(json.dumps(result, indent=1), encoding="utf-8")
