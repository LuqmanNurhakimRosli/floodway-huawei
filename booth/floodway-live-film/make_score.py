"""Procedural score and sound effects for the FloodWay Live Vision film (no samples, no copyrighted audio).

Run:  ..\\..\\backend\\.venv\\Scripts\\python.exe make_score.py     -> out/score.wav (48 kHz stereo, 45.000 s)
Then: ffmpeg muxes it with the silent master (see README). Cue times mirror src/film-scenes.js."""
from pathlib import Path

import numpy as np

SR, DUR = 48000, 45.0
N = int(SR * DUR)
rng = np.random.default_rng(20261012)
L = np.zeros(N)
R = np.zeros(N)
OUT = Path(__file__).parent / "out"


def note(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def place(sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 - pan))
    R[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 + pan))


def env(n, a, r):
    """Attack / release envelope over n samples (seconds)."""
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4))
    return e * np.minimum(1, (n / SR - t) / max(r, 1e-4))


def bandpass(x, lo, hi):
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X = np.fft.rfft(x)
    X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, len(x))


def pad(midis, t0, t1, gain, detune=0.004):
    n = int((t1 - t0) * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for m in midis:
        for d in (-detune, detune):
            f = note(m) * (1 + d)
            for h in range(1, 6):                       # soft saw: 5 harmonics, 1/h^1.5
                s += np.sin(2 * np.pi * f * h * t + h) / h ** 1.5
    return s / (len(midis) * 6) * env(n, 1.2, 1.4) * gain


def kick(gain=1.0):
    n = int(0.42 * SR)
    t = np.arange(n) / SR
    f = 45 + 85 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * gain


def tick(gain=1.0, dur=0.05):
    n = int(dur * SR)
    return bandpass(rng.standard_normal(n), 6000, 15000) * np.exp(-np.arange(n) / SR * 70) * gain


def bell(freq, dur=1.2, gain=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 2.76 * t) * np.exp(-t * 6)
    return s * np.exp(-t * 3.2) * env(n, 0.004, 0.05) * gain


def swell(dur, lo, hi, gain):
    n = int(dur * SR)
    return bandpass(rng.standard_normal(n), lo, hi) * (np.arange(n) / n) ** 2.2 * gain


# 1. Rain bed and drone (0 to 10.6 s), heartbeat pulse that quickens toward the turn.
rain = bandpass(rng.standard_normal(int(10.8 * SR)), 900, 9000) * env(int(10.8 * SR), 0.8, 1.2)
place(rain, 0, 0.05, -0.3); place(np.roll(rain, 9000), 0, 0.05, 0.3)
place(pad([45, 52], 0, 11.0, 1.0), 0, 0.55)
t, gap = 1.2, 1.0
while t < 10.0:
    place(kick(0.5), t); place(kick(0.32), t + 0.22)
    t += gap; gap = max(0.66, gap * 0.94)
place(swell(1.6, 300, 4000, 0.22), 8.6)

# 2. Live Vision (10.2 to 21.2 s): 96 BPM pulse, A minor to F, a cue at each level change, alarm at DANGER.
beat = 60 / 96
for i, (ch, a) in enumerate([([57, 60, 64], 10.2), ([53, 57, 60], 15.2)]):
    place(pad(ch, a, a + 5.6, 1.0), a, 0.5, -0.15 + 0.3 * i)
b = 10.2
while b < 21.0:
    place(kick(0.55), b); place(tick(0.10), b + beat / 2, 0.1, 0.4)
    b += beat
ratio = lambda t: 0.10 + 0.94 * (-(np.cos(np.pi * np.clip((t - 11.4) / 8.2, 0, 1)) - 1) / 2)
ts = np.arange(11.4, 19.6, 1 / 480)
for th, f in ((0.26, 880), (0.63, 988)):
    c = ts[np.argmax(ratio(ts) >= th)]
    place(bell(f, 0.9, 0.35), c); place(bell(f * 1.5, 0.9, 0.2), c + 0.09)
c = ts[np.argmax(ratio(ts) >= 0.97)]
place(swell(1.3, 400, 6000, 0.25), c - 1.3)
for k in range(3):                                      # two-tone alarm, three times
    place(bell(740, 0.35, 0.32), c + k * 0.36); place(bell(587, 0.35, 0.32), c + k * 0.36 + 0.18)
place(bell(523, 1.2, 0.35), 19.9)                        # toast

# 3. Map (21.0 to 28.8 s): pin ping, a low thud on the blocked route, rising arpeggio as the safe route locks.
place(pad([53, 57, 60], 21.0, 25.2, 1.0), 21.0, 0.45)
place(pad([48, 52, 55], 25.2, 29.2, 1.0), 25.2, 0.5)
place(bell(1175, 0.8, 0.25), 21.7, 0, 0.2)
place(kick(0.7), 24.6); place(bell(220, 0.6, 0.25), 24.6)
for k, m in enumerate((72, 76, 79, 84)):
    place(bell(note(m), 0.9, 0.28), 26.6 + k * 0.09, 0, -0.2 + 0.13 * k)

# 4. Alert in hand (28.6 to 34.8 s): notification chime, taps and soft confirmations.
place(pad([55, 59, 62], 28.6, 35.0, 1.0), 28.6, 0.45)
place(bell(587, 0.5, 0.4), 30.3); place(bell(880, 0.9, 0.4), 30.45)
for k in range(3):
    place(tick(0.25, 0.03), 31.4 + k * 0.28, 0.3)
    place(bell(1320, 0.4, 0.16), 32.1 + k * 0.28, 0, 0.3)

# 5. Impact (34.6 to 40.2 s): timeline ticks, then a deep hit on the 100%.
place(pad([57, 60, 64], 34.6, 37.6, 1.0), 34.6, 0.45)
for k in range(3):
    place(bell(note(69 + 3 * k), 0.6, 0.22), 35.2 + k * 0.7)
place(swell(0.9, 200, 5000, 0.35), 36.6)
hit = kick(1.0) + bandpass(rng.standard_normal(int(0.42 * SR)), 60, 400) * np.exp(-np.arange(int(0.42 * SR)) / SR * 8) * 0.5
place(hit, 37.5, 1.0)
place(pad([53, 57, 60, 64], 37.5, 40.4, 1.0), 37.5, 0.55)

# 6. Brand (40.0 to 45.0 s): resolve to C major, a bright chime on the logo, fade to silence.
place(pad([48, 55, 60, 64, 67], 40.0, 45.0, 1.0), 40.0, 0.6)
for k, m in enumerate((72, 79, 84)):
    place(bell(note(m), 2.0, 0.3), 40.25 + k * 0.12)

# Master: soft-clip, normalise to -1.5 dBFS peak, fade the last 0.7 s.
mix = np.stack([L, R], axis=1)
mix = np.tanh(mix * 1.6) / np.tanh(1.6)
mix *= 10 ** (-1.5 / 20) / np.max(np.abs(mix))
mix[-int(0.7 * SR):] *= np.linspace(1, 0, int(0.7 * SR))[:, None]
OUT.mkdir(exist_ok=True)
pcm = (mix * 32767).astype("<i2")
with open(OUT / "score.wav", "wb") as fh:
    import struct
    data = pcm.tobytes()
    fh.write(b"RIFF" + struct.pack("<I", 36 + len(data)) + b"WAVEfmt " + struct.pack("<IHHIIHH", 16, 1, 2, SR, SR * 4, 4, 16) + b"data" + struct.pack("<I", len(data)) + data)
print(f"out/score.wav  {DUR:.3f} s  peak -1.5 dBFS  rms {20 * np.log10(np.sqrt(np.mean(mix ** 2))):.1f} dBFS")
