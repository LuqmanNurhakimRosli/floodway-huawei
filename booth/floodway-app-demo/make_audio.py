"""Procedural score for the FloodWay app demo film (no samples, no copyrighted audio).

Run:  ../../backend/.venv/bin/python make_audio.py      -> out/score.wav (48 kHz stereo, 116.000 s)
Cue times mirror film.html (CHAPTERS, TAPS, the SOS hold and the outro)."""
from pathlib import Path

import numpy as np

SR, DUR = 48000, 116.0
N = int(SR * DUR)
rng = np.random.default_rng(20261019)
L = np.zeros(N)
R = np.zeros(N)
OUT = Path(__file__).parent / "out"

CHAPTERS = [4.4, 14.6, 29.2, 44.0, 57.2, 70.6, 82.2, 94.2, 103.2, 109.2]
TAPS = [13.9, 33.3, 40.4, 43.8, 52.2, 70.4, 73.2]


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def place(sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N or i + len(sig) <= 0:
        return
    if i < 0:  # starts before the film: keep only the part after 0 s
        sig, i = sig[-i:], 0
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 - pan))
    R[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 + pan))


def env(n, a, r):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    if na:
        e[:na] = np.linspace(0, 1, na)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):  # one pole is enough for gentle smoothing
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


# pad: four chords, eight seconds each, looping; soft sines with slow swells
CHORDS = [[50, 57, 62, 66, 69], [47, 54, 59, 62, 66], [43, 50, 55, 59, 62], [45, 52, 57, 61, 64]]
t8 = np.arange(int(8 * SR)) / SR
for k, start in enumerate(np.arange(0, DUR, 8.0)):
    chord = CHORDS[k % 4]
    sig = np.zeros_like(t8)
    for j, m in enumerate(chord):
        f = hz(m)
        sig += np.sin(2 * np.pi * f * t8 + j) * (0.5 if j == 0 else 0.28) + 0.08 * np.sin(2 * np.pi * 2 * f * t8)
    sig *= env(len(t8), 2.5, 3.0) * (0.75 + 0.25 * np.sin(2 * np.pi * 0.11 * t8))
    place(sig, start - 1.5, 0.055, pan=(-0.25 if k % 2 else 0.25))

# pulse: a soft plucked arpeggio, quieter under the intro and outro
BPM = 92
beat = 60 / BPM
ARP = [0, 7, 12, 16, 12, 7]
pl = int(0.5 * SR)
tp = np.arange(pl) / SR
for i, t0 in enumerate(np.arange(4.4, 109.2, beat / 2)):
    chord = CHORDS[int(t0 // 8) % 4]
    m = chord[0] + 12 + ARP[i % len(ARP)]
    s = np.sin(2 * np.pi * hz(m) * tp) * np.exp(-tp * 9)
    place(s, t0, 0.05 if i % 2 else 0.075, pan=0.35 * np.sin(i * 0.7))

# rain: filtered noise under the intro and the outro
rain = lowpass(rng.standard_normal(int(12 * SR)), 2400)
place(rain * env(len(rain), 0.3, 5.5), 0.0, 0.05)
place(rain[: int(7 * SR)] * env(int(7 * SR), 1.5, 3.0), 109.4, 0.035)

# whoosh into each chapter: a short noise swell
wl = int(0.9 * SR)
for t0 in CHAPTERS:
    w = lowpass(rng.standard_normal(wl), 1800) * np.sin(np.linspace(0, np.pi, wl)) ** 2
    place(w, t0 - 0.55, 0.22, pan=0.4)

# taps: a short click and a tiny tone
cl = int(0.08 * SR)
tc = np.arange(cl) / SR
click = (np.sin(2 * np.pi * 1800 * tc) * np.exp(-tc * 80)) + 0.3 * rng.standard_normal(cl) * np.exp(-tc * 160)
for t0 in TAPS:
    place(click, t0, 0.18)

# SOS: a rising tone while the ring fills, then a two-note chime when it sends
hl = int(2.0 * SR)
th = np.arange(hl) / SR
f = np.linspace(hz(69), hz(81), hl)
rise = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.linspace(0.2, 1, hl) * env(hl, 0.1, 0.05)
place(rise, 45.4, 0.06)


def chime(notes, t0, gain):
    cl2 = int(1.6 * SR)
    tt = np.arange(cl2) / SR
    for j, m in enumerate(notes):
        s = (np.sin(2 * np.pi * hz(m) * tt) + 0.3 * np.sin(2 * np.pi * 2 * hz(m) * tt)) * np.exp(-tt * 3.2)
        place(s, t0 + j * 0.12, gain)


chime([81, 88], 47.6, 0.09)
chime([76, 83], 54.4, 0.08)
chime([74, 81, 86], 113.0, 0.1)

# master: fade in and out, normalise
mix = np.stack([L, R], axis=1)
fade = np.ones(N)
fade[: int(0.6 * SR)] = np.linspace(0, 1, int(0.6 * SR))
fade[-int(2.2 * SR):] = np.linspace(1, 0, int(2.2 * SR))
mix *= fade[:, None]
mix *= 0.8 / max(1e-9, np.abs(mix).max())

OUT.mkdir(exist_ok=True)
pcm = (mix * 32767).astype("<i2")
import wave  # noqa: E402

with wave.open(str(OUT / "score.wav"), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print(f"-> {OUT / 'score.wav'} ({DUR:.3f} s)")
