"""Final assembly: silent film + narrators + presenter circle + music and effects -> out/FloodWay_SDP_final.mp4.

Needs, in order:  python prep_media.py <materials>   node render.mjs --info   node render.mjs --all   python make_audio.py
Run:  python assemble.py <materials-demo folder>
Beats come from narration.json, scene starts from out/cues.json. Music ducks under the voice; the mix peaks below -1 dBFS.
"""
import json
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import maximum_filter1d, uniform_filter1d

SRC = Path(sys.argv[1])
HERE = Path(__file__).parent
OUT = HERE / "out"
SR = 48000
info = json.loads((OUT / "cues.json").read_text(encoding="utf-8"))
DUR = info["seconds"]
N = int(DUR * SR)
START = {s["id"]: s["start"] for s in info["scenes"]}
plan = json.loads((HERE / "narration.json").read_text(encoding="utf-8"))
# presenter circle: 248 px at x 1612, y 792 (js/lib.js keeps this corner clear); ring and shadow drawn around it
D, CX, CY, PAD = 248, 1612, 792, 26
FADE = 0.3
STAR = SRC / "Kuala Lumpur hit by flash floods on Sept 20 - The Star (720p).mp4"
MONTAGE = [(11.0, 1.45, 0.0), (16.0, 2.15, 1.40), (12.9, 1.10, 3.50)]   # (source s, length, film s), as in s00


def ff(*args):
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *map(str, args)], check=True)


def read_wav(path):
    with wave.open(str(path)) as w:
        assert w.getframerate() == SR and w.getsampwidth() == 2, path
        x = np.frombuffer(w.readframes(w.getnframes()), "<i2").astype(np.float64) / 32768
        return x.reshape(-1, w.getnchannels())


def ramp(x, s=0.015):
    n = min(len(x) // 2, int(s * SR))
    e = np.ones(len(x))
    e[:n], e[len(x) - n:] = np.linspace(0, 1, n), np.linspace(1, 0, n)
    return x * (e[:, None] if x.ndim == 2 else e)


def place(track, sig, t):
    i = int(round(t * SR))
    sig = sig[: max(0, N - i)]
    track[i:i + len(sig)] += sig


# ── beats in film time ──
beats = []
for b in plan["beats"]:
    t0 = START[b["scene"]] + b["at"]
    end = t0 + b["b"] - b["a"]
    pip_end = min(end, START[b["pip_until"]]) if "pip_until" in b else end
    beats.append({**b, "t0": t0, "end": end, "pip_end": pip_end})
for x, y in zip(beats, beats[1:]):
    assert x["end"] <= y["t0"] + 1e-6, f"beats overlap: {x['file']} ends {x['end']:.2f}, next starts {y['t0']:.2f}"
assert beats[-1]["end"] <= DUR, "narration runs past the film"

# ── audio ──
voice = np.zeros(N)
for b in beats:
    v = read_wav(OUT / "narration" / (Path(b["file"]).stem + "_48k.wav"))[:, 0]
    place(voice, ramp(v[int(b["a"] * SR):int(b["b"] * SR)]), b["t0"])

montage = np.zeros((N, 2))
for ss, d, t in MONTAGE:
    tmp = OUT / "audio" / "montage_cut.wav"
    ff("-ss", ss, "-t", d, "-i", STAR, "-vn", "-ac", 2, "-ar", SR, "-c:a", "pcm_s16le", tmp)
    place(montage, ramp(read_wav(tmp), 0.02) * 0.55, t)
montage[int(4.5 * SR):int(5.0 * SR)] *= np.linspace(1, 0, int(0.5 * SR))[:, None]

# duck: 1 while the voice talks, smoothed so the bed breathes rather than pumps
talk = maximum_filter1d((np.abs(voice) > 0.02).astype(float), int(0.35 * SR))
talk = uniform_filter1d(talk, int(0.25 * SR))
music, sfx = read_wav(OUT / "audio" / "music_bed.wav")[:N], read_wav(OUT / "audio" / "sfx.wav")[:N]
montage_end = START["s01"]
# bed and effects sit well under the voice; the first scene (Nadi over rain and rumble) gets an extra cut
quiet = np.where(np.arange(N) / SR < START["s02"], 0.55, 1.0)
mix = voice[:, None] + music * (0.7 * (1 - 0.6 * talk) * quiet)[:, None] + sfx * (0.55 * (1 - 0.55 * talk) * np.where(np.arange(N) / SR < montage_end, 1.0, quiet))[:, None] + montage
peak = np.abs(mix).max()
mix *= min(1.0, 0.89 / peak)
with wave.open(str(OUT / "audio" / "final_mix.wav"), "wb") as w:
    w.setnchannels(2), w.setsampwidth(2), w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype("<i2").tobytes())
print(f"audio: {DUR:.1f} s, peak {20 * np.log10(peak):.1f} dBFS before trim")

# ── presenter circle: soft mask, white ring and shadow ──
S = 4
m = Image.new("L", (D * S, D * S), 0)
ImageDraw.Draw(m).ellipse((0, 0, D * S - 1, D * S - 1), fill=255)
m.resize((D, D), Image.LANCZOS).save(OUT / "audio" / "pip_mask.png")
W = D + 2 * PAD
shadow = Image.new("L", (W, W), 0)
ImageDraw.Draw(shadow).ellipse((PAD, PAD + 10, PAD + D, PAD + D + 10), fill=110)
ring = Image.new("RGBA", (W, W), (7, 20, 38, 0))
ring.putalpha(shadow.filter(ImageFilter.GaussianBlur(12)))
big = Image.new("RGBA", (W * S, W * S), (0, 0, 0, 0))
ImageDraw.Draw(big).ellipse(((PAD - 5) * S, (PAD - 5) * S, (PAD + D + 5) * S, (PAD + D + 5) * S), fill=(255, 255, 255, 255))
ring.alpha_composite(big.resize((W, W), Image.LANCZOS))
ring.save(OUT / "audio" / "pip_ring.png")

# ── video ──
args = ["-i", OUT / "FloodWay_SDP_motion_silent.mp4", "-i", OUT / "audio" / "final_mix.wav"]
graph, last = [], "0:v"
# a beat whose presenter circle is over before it starts (the demo, voice only) has no video to draw
for k, b in enumerate(x for x in beats if x["pip_end"] - x["t0"] > 0.1):
    d = b["pip_end"] - b["t0"]
    vi, mi, ri = 2 + 3 * k, 3 + 3 * k, 4 + 3 * k
    args += ["-ss", b["a"], "-t", d, "-i", SRC / b["file"], "-loop", 1, "-t", d, "-i", OUT / "audio" / "pip_mask.png",
             "-loop", 1, "-t", d, "-i", OUT / "audio" / "pip_ring.png"]
    x, y, w, h = plan["crop"][b["file"]]
    graph += [
        f"[{vi}:v]{plan.get('pre', {}).get(b['file'], '')}fps=30,crop={w}:{h}:{x}:{y},scale={D}:{D}:flags=lanczos,setsar=1,format=yuva420p[v{k}]",
        f"[{mi}:v]fps=30,format=gray[m{k}]",
        f"[v{k}][m{k}]alphamerge[c{k}]",
        f"[{ri}:v]fps=30,format=rgba[r{k}]",
        f"[r{k}][c{k}]overlay={PAD}:{PAD}:shortest=1,format=yuva420p,"
        f"fade=t=in:st=0:d={FADE}:alpha=1,fade=t=out:st={d - FADE:.3f}:d={FADE}:alpha=1,setpts=PTS-STARTPTS+{b['t0']:.3f}/TB[p{k}]",
        f"[{last}][p{k}]overlay={CX - PAD}:{CY - PAD}:eof_action=pass[o{k}]",
    ]
    last = f"o{k}"
graph[-1] = graph[-1].rsplit("[", 1)[0] + "[vout]"
final = OUT / "FloodWay_SDP_final.mp4"
ff(*args, "-filter_complex", ";".join(graph), "-map", "[vout]", "-map", "1:a", "-t", DUR,
   "-c:v", "libx264", "-preset", "medium", "-crf", 18, "-pix_fmt", "yuv420p", "-profile:v", "high",
   "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
   "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", final)
print(f"-> {final}")
