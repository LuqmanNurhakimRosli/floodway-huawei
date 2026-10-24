"""Sound for the FloodWay SDP video, generated in code (no samples, nothing to license).

Reads out/cues.json (node render.mjs --info), which lists every sound cue the scenes declare, and writes out/audio/:
  music_bed.wav        96 BPM bed for the whole film: dark intro, lift at 1:30, drops out under scene 7, resolves at 4:48
  sfx.wav              every sound effect on the film timeline
  mix.wav              music + effects, for the animatic
  scenes/<id>_sfx.wav  the effects of one scene, cut to its length (muxed into out/scenes/<id>_sfx.mp4)
Run:  python make_audio.py      (needs numpy and scipy)
"""
import json
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
HERE = Path(__file__).parent
OUT = HERE / "out" / "audio"
info = json.loads((HERE / "out" / "cues.json").read_text(encoding="utf-8"))
DUR = info["seconds"]
N = int(SR * DUR)
rng = np.random.default_rng(20261021)


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def filt(x, kind, f):
    return sosfilt(butter(2, f, btype=kind, fs=SR, output="sos"), x)


def env(n, a, r):
    e = np.ones(n)
    na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    if na:
        e[:na] = np.linspace(0, 1, na)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


class Track:
    def __init__(self):
        self.L = np.zeros(N)
        self.R = np.zeros(N)

    def add(self, sig, t0, gain=1.0, pan=0.0):
        i = int(t0 * SR)
        if i >= N or i + len(sig) <= 0:
            return
        if i < 0:
            sig, i = sig[-i:], 0
        sig = sig[: N - i] * gain
        self.L[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 - pan))
        self.R[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 + pan))

    def stereo(self):
        return np.stack([self.L, self.R], axis=1)


def tt(d):
    return np.arange(int(d * SR)) / SR


def noise(d):
    return rng.standard_normal(int(d * SR))


# ── sound effects ──────────────────────────────────────────────────────────────────────────────────────
def fx_rain(d=10.0, **_):
    n = noise(d)
    body = filt(filt(n, "low", 5200), "high", 400)
    patter = filt(noise(d), "high", 3000) * (rng.random(len(n)) < 0.004) * 4  # sparse drops
    mod = 0.8 + 0.2 * np.sin(2 * np.pi * 0.17 * tt(d))
    return (body * 0.5 + patter * 0.25) * mod * env(len(n), 1.2, 1.5)


def fx_rumble(**_):
    d = 3.2
    x = filt(noise(d), "low", 110) * np.exp(-tt(d) * 1.4)
    return x * env(len(x), 0.08, 0.6) * 3.2


def fx_splash(**_):
    d = 1.1
    x = filt(filt(noise(d), "high", 900), "low", 6000) * np.exp(-tt(d) * 6)
    for k in range(9):  # droplets
        t0 = 0.05 + rng.random() * 0.7
        f = 1200 + rng.random() * 1800
        s = np.sin(2 * np.pi * f * tt(0.05)) * np.exp(-tt(0.05) * 90)
        i = int(t0 * SR)
        x[i:i + len(s)] += s * 0.35
    return x * 0.9


def fx_shimmer(**_):
    d = 1.8
    t = tt(d)
    x = sum(np.sin(2 * np.pi * hz(m) * t + k) * np.exp(-t * (2.2 + k * 0.4)) for k, m in enumerate([86, 90, 93, 98]))
    return x * env(len(t), 0.02, 0.4) * 0.22


def fx_ping(**_):
    out = np.zeros(int(0.9 * SR))
    for k, m in enumerate([88, 95]):
        t = tt(0.6)
        s = (np.sin(2 * np.pi * hz(m) * t) + 0.25 * np.sin(4 * np.pi * hz(m) * t)) * np.exp(-t * 7)
        i = int(k * 0.11 * SR)
        out[i:i + len(s)] += s
    return out * 0.32


def fx_whoosh(d=0.9, **_):
    n = noise(d)
    t = tt(d)
    lo = filt(n, "low", 900)
    hi = filt(n, "high", 2500)
    w = np.sin(np.pi * t / d) ** 2
    return (lo * (1 - t / d) + hi * (t / d) * 0.6) * w * 0.55


def fx_swoosh(**_):
    return fx_whoosh(0.55) * 1.1


def fx_tick(**_):
    t = tt(0.08)
    return (np.sin(2 * np.pi * 1900 * t) * np.exp(-t * 70) + 0.25 * noise(0.08) * np.exp(-t * 180)) * 0.3


def fx_count(dur=2.7, **_):
    out = np.zeros(int(dur * SR) + SR // 5)
    k, t0 = 0, 0.0
    while t0 < dur:
        s = fx_tick() * (0.35 + 0.4 * t0 / dur)
        i = int(t0 * SR)
        out[i:i + len(s)] += s
        t0 += 0.05 + 0.13 * (t0 / dur) ** 2  # ticks slow down as the counter settles
        k += 1
    return out


def fx_zoom(**_):
    d = 1.0
    t = tt(d)
    f = np.linspace(300, 1400, len(t))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.05
    return (filt(noise(d), "band", [400, 2400]) * 0.35 + tone) * np.sin(np.pi * t / d) ** 2


def fx_drop(**_):
    t = tt(0.35)
    f = np.linspace(hz(84), hz(76), len(t))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14) * 0.3


def fx_water(dur=4.0, gain=1.0, **_):
    x = filt(filt(noise(dur), "band", [250, 2200]), "low", 1800)
    mod = 0.7 + 0.3 * np.sin(2 * np.pi * 0.6 * tt(dur)) * np.sin(2 * np.pi * 0.23 * tt(dur))
    return x * mod * env(len(x), 0.8, 1.2) * 0.55 * gain


def fx_chime(notes=(76,), **_):
    out = np.zeros(int((1.8 + 0.12 * len(notes)) * SR))
    for k, m in enumerate(notes):
        t = tt(1.8)
        s = (np.sin(2 * np.pi * hz(m) * t) + 0.3 * np.sin(2 * np.pi * 2 * hz(m) * t) + 0.08 * np.sin(2 * np.pi * 3 * hz(m) * t)) * np.exp(-t * 3)
        i = int(k * 0.12 * SR)
        out[i:i + len(s)] += s * env(len(s), 0.004, 0.2)
    return out * 0.2


def fx_pop(**_):
    t = tt(0.12)
    f = np.linspace(900, 300, len(t))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30) * 0.35


def fx_low(**_):
    t = tt(1.8)
    return np.sin(2 * np.pi * 55 * t) * env(len(t), 0.05, 1.2) * 0.26 + np.sin(2 * np.pi * 110 * t) * env(len(t), 0.05, 1.0) * 0.08


def fx_sonar(**_):
    t = tt(0.3)
    f = np.linspace(2400, 1700, len(t))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 16) * 0.16


def fx_radio(**_):
    out = np.zeros(int(0.6 * SR))
    for k in range(3):
        s = np.sin(2 * np.pi * 1250 * tt(0.06)) * env(int(0.06 * SR), 0.003, 0.02)
        i = int(k * 0.15 * SR)
        out[i:i + len(s)] += s
    return out * 0.13


def fx_click(**_):
    t = tt(0.12)
    return (filt(noise(0.12), "band", [1500, 6000]) * np.exp(-t * 60) + np.sin(2 * np.pi * 420 * t) * np.exp(-t * 45) * 0.5) * 0.45


def fx_click2(**_):
    t = tt(0.12)
    return (filt(noise(0.12), "band", [700, 3000]) * np.exp(-t * 55) + np.sin(2 * np.pi * 260 * t) * np.exp(-t * 40) * 0.5) * 0.4


def fx_stamp(**_):
    t = tt(0.5)
    return (np.sin(2 * np.pi * 70 * t) * np.exp(-t * 9) + filt(noise(0.5), "low", 900) * np.exp(-t * 25) * 0.6) * 0.6


def fx_hold(**_):
    out = np.zeros(int(0.5 * SR))
    for k, m in enumerate([72, 72]):
        t = tt(0.16)
        s = np.sin(2 * np.pi * hz(m) * t) * np.exp(-t * 18)
        i = int(k * 0.2 * SR)
        out[i:i + len(s)] += s
    return out * 0.18


def fx_rise(dur=1.6, **_):
    t = tt(dur)
    f = np.linspace(hz(60), hz(72), len(t))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.1, 0.3) * (t / dur) * 0.12


FX = {k[3:]: v for k, v in globals().items() if k.startswith("fx_")}
GAIN = {"rain": 0.5, "water": 0.6, "rumble": 0.8}

sfx = Track()
missing = set()
for c in info["cues"]:
    fn = FX.get(c["kind"])
    if not fn:
        missing.add(c["kind"])
        continue
    opts = {k: v for k, v in c.items() if k not in ("t", "kind", "scene", "gain")}
    sig = fn(**opts)
    sfx.add(sig, c["t"], gain=c.get("gain", 1.0) * GAIN.get(c["kind"], 1.0), pan=float(rng.uniform(-0.25, 0.25)))
if missing:
    raise SystemExit(f"no sound for cue kinds: {sorted(missing)}")

# ── music bed ──────────────────────────────────────────────────────────────────────────────────────────
BPM = 96
BEAT = 60 / BPM
CHORDS = {"Bm": [47, 54, 59, 62, 66], "G": [43, 50, 55, 59, 62], "D": [50, 57, 62, 66, 69], "A": [45, 52, 57, 61, 64], "Dadd9": [50, 57, 62, 64, 66, 69]}
PROG = ["Bm", "G", "D", "A"]
SCENE = {s["id"]: (s["start"], s["start"] + s["dur"]) for s in info["scenes"]}
lift_at, drop_a, drop_b, resolve_at = SCENE["s06"][0], SCENE["s07"][0], SCENE["s07"][1], SCENE["s11"][0]
music = Track()
bar = 4 * BEAT
chord_len = 2 * bar


def pad(chord, d, gain):
    t = tt(d)
    s = sum((np.sin(2 * np.pi * hz(m) * t + j) + 0.15 * np.sin(2 * np.pi * 2 * hz(m) * t)) * (0.55 if j == 0 else 0.3) for j, m in enumerate(CHORDS[chord]))
    s *= env(len(t), min(1.5, d / 3), min(2.0, d / 2.5)) * (0.85 + 0.15 * np.sin(2 * np.pi * 0.12 * t))
    return filt(s, "low", 2400) * gain


# intro (scene 1): a long, low B minor drone that swells into the title
music.add(pad("Bm", SCENE["s01"][1] + 2.0, 0.05) * np.linspace(0.6, 1.0, int((SCENE["s01"][1] + 2.0) * SR)), 0.0)
music.add(pad("Dadd9", 6.0, 0.04), 8.0)
# main bed from scene 2 to the end of scene 10; quieter under scene 7
t0, k = SCENE["s02"][0] - 1.0, 0
while t0 < resolve_at:
    ch = PROG[k % 4]
    g = 0.045 if drop_a - 1 < t0 < drop_b - 1 else 0.06
    music.add(pad(ch, chord_len + 2.0, g), t0, pan=-0.2 if k % 2 else 0.2)
    t0 += chord_len
    k += 1
# plucked arpeggio (8ths), not under scene 7; brighter after the lift
ARP = [0, 2, 3, 4, 3, 2, 1, 2]
step, i = BEAT / 2, 0
t = SCENE["s02"][0] + 2.0
while t < resolve_at:
    if drop_a - 0.5 <= t < drop_b - 1.0:
        t += step
        continue
    ch = CHORDS[PROG[int((t - (SCENE["s02"][0] - 1.0)) // chord_len) % 4]]
    m = ch[ARP[i % 8]] + 12 + (12 if t >= lift_at and i % 8 == 3 else 0)
    p = tt(0.45)
    s = np.sin(2 * np.pi * hz(m) * p) * np.exp(-p * 8) + 0.2 * np.sin(4 * np.pi * hz(m) * p) * np.exp(-p * 14)
    music.add(s, t, gain=(0.03 if i % 2 else 0.042) * (1.15 if t >= lift_at else 1.0), pan=0.3 * np.sin(i * 0.7))
    t += step
    i += 1
# soft pulse on beats 1 and 3 after the lift, not under scene 7
t = lift_at
while t < resolve_at:
    if not (drop_a - 0.5 <= t < drop_b - 1.0):
        p = tt(0.3)
        f = np.linspace(68, 42, len(p))
        music.add(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-p * 12), t, gain=0.09)
    t += 2 * BEAT
# resolve: D major with the added ninth, swelling then fading out with the film
music.add(pad("Dadd9", DUR - resolve_at + 1.0, 0.07), resolve_at - 0.4)

# ── write ──────────────────────────────────────────────────────────────────────────────────────────────
def save(path, x):
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())


def norm(x, peak):
    return x * (peak / max(1e-9, np.abs(x).max()))


tail = np.ones(N)
tail[-int(1.5 * SR):] = np.linspace(1, 0, int(1.5 * SR))   # everything fades out over the last 1.5 s
m = norm(music.stereo(), 0.17) * tail[:, None]               # about -28 LUFS: 12 dB under narration at -16 LUFS
s = norm(sfx.stereo(), 0.6)
save(OUT / "music_bed.wav", m)
save(OUT / "sfx.wav", s)
save(OUT / "mix.wav", norm(m + s * tail[:, None], 0.85))
for sc in info["scenes"]:
    a, b = int(sc["start"] * SR), int((sc["start"] + sc["dur"]) * SR)
    save(OUT / "scenes" / f"{sc['id']}_sfx.wav", s[a:b])
print(f"-> {OUT} ({DUR:.1f} s, {len(info['cues'])} cues)")
