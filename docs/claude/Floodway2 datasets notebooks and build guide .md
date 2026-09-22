# FloodWay 2.0 — Datasets, Notebooks & End-to-End Build Guide
### Direction: Evolved 3D Digital Twin (Option C) + 1-Tap Family SOS (Option A)

Written Sunday 20 Sep 2026 · competition deadline 27 Sep 2026 (7 days). Read Section 1 before writing any code — it changes what you build.

**Status legend** used throughout: ✅ = I executed it in a sandbox · 🟡 = compiled / type-checked only · ⚪ = written from documentation or memory, **not executed** (verify before relying on it).

---

## 0. TL;DR

1. **Your 0.3 m trigger contradicts your own routing table.** Walking is blocked at 0.10 m, motorcycles at 0.15 m, cars at 0.30 m. A "Navigate to shelter" button that first appears at 0.3 m offers a route only 4x4s can drive. Use three phases (Section 2.2): route button at **WARNING** (forecast/first water), pulsing red at **DANGER (0.30 m)**.
2. **The sensor measures one point; the 3D twin needs a surface.** Water level at the ESP32 + a DEM + hydraulic connectivity (NB4) gives depth across the neighbourhood. That replaces the generic KL building *and* the manual slider.
3. **There is no ready-made, public, sub-hourly Malaysian stage+rainfall dataset that I could find.** Section 3 lists what exists and what each is honestly good for. Your real ground truth will be (a) whatever JPS/DID data your supervisors can obtain, and (b) your own ESP32 logs. Start logging today.
4. **ModelArts is the eligibility gate, and it has setup lead time** (real-name verification, agency authorization, region resources). Do this today, not on day 4.
5. All code below is one coherent system: `flood_core.py` (shared) → NB2 trains → NB3 packages for ModelArts → FastAPI backend calls it → React/Three.js twin renders it → SOS goes out via SMN with an SMS-composer fallback that works without mobile data.

---

## 1. Critical review of the recommendation (what I would change)

| # | Problem | Why it matters | What this guide does |
|---|---|---|---|
| 1 | Trigger at 0.3 m vs routing limits (0.10 / 0.15 / 0.30 / 0.70 m) | By 0.3 m pedestrians and motorcycles have no legal-to-drive/walk route. The CTA arrives too late for most of your users. | 3-phase machine with hysteresis; route CTA from WARNING. `backend/trigger.py` |
| 2 | "Water level" is ambiguous | ESP32 depth at a river/drain ≠ depth at the user's house or road. Judges will ask. | DEM + connectivity depth surface (NB4), labelled **indicative**, vertical exaggeration shown in HUD. |
| 3 | A "forecast" needs labelled history | With no stage data you can only train on a proxy. Any accuracy number from proxy/synthetic data is not evidence. | NB2 runs end-to-end on synthetic data to prove the pipeline; real-data path and proxy path are explicit; claim rules in §15. |
| 4 | 74.55% vs HyperNeura's 94.7% | Different tasks, different labels. Comparing them in a deck invites a bad question. Also: if the 74.55% came from a random train/test split of time-ordered data, it is inflated. | NB2 Cell 7 measures random-split vs chronological-split inflation on your real data. Report event-onset recall/precision, not a single "accuracy". |
| 5 | Web Serial for the sensor | Web Serial is a Chromium-only browser API (not in Safari/iOS) that needs a USB cable to the device; it is not how a sensor at a riverbank reaches citizens' phones. | ESP32 → HTTPS ingest with HMAC + replay protection (firmware + `/api/v1/ingest`). |
| 6 | SOS "broadcasts to emergency services" | You cannot claim to dispatch rescue. Also SMN SMS subscribers must **confirm** before they receive anything, and one SMN topic reaches **every** subscriber. | SOS notifies *pre-registered, consented family contacts only*; UI says "call 999". Onboarding step for confirmation. Per-group topics or direct SMS in production. |
| 7 | Data connection dies in floods | Push/SMN over data fails exactly when needed. | Offline queue + idempotent retry + `sms:` composer fallback (needs cell signal only). |
| 8 | Live demo of a flood is impossible | A slider "demo" is what you're trying to kill. | `demoLevelM` replay of a **recorded/scripted event** with a permanent DEMO REPLAY badge. Never blend with live data. |
| 9 | Silent failure modes | A dead sensor (maybe submerged) shown as "NORMAL" is a safety bug. | Stale detection; phase never auto-downgrades because the sensor went quiet; degraded reasons returned to UI. |

Also note: Huawei's rules (per your own notes) make non-use of the required Huawei technologies disqualifying. Confirm with the organisers **in writing** what counts (e.g. is training on ModelArts + serving on ECS acceptable?) — do not assume.

---

## 2. Architecture

### 2.1 Data flow

```
 ESP32 + JSN-SR04T ──HTTPS+HMAC──►  FastAPI on Huawei ECS  ◄──── React PWA (Three.js twin, SOS, shelter nav)
   (distance_cm)                     │  /ingest  /twin/state  /sos
                                     │
       Open-Meteo rain (15-min) ─────┤── rain window (24 x 15 min)
       sensor buckets (15-min) ──────┤── level window (24 x 15 min)
                                     ▼
                         ModelArts real-time service  (GRU, P10/P50/P90 @ +30/+60/+120 min)
                                     │
                     PhaseMachine (NORMAL / WARNING / DANGER, hysteresis, rain safety net)
                                     │
        Huawei OBS (terrain.json, photos, exports) · GaussDB/RDS (shelters, contacts, sos_events)
                                     │
                    SOS ──► Huawei SMN (per-group topic) ──► family SMS
                     └──► offline: localStorage queue + sms: composer fallback
```

### 2.2 Phase table (source of truth: `backend/trigger.py`)

| Phase | Condition (any) | UI | Why |
|---|---|---|---|
| NORMAL | none of the below | green banner | — |
| WARNING | sensor ≥ 0.10 m **or** forecast P50 ≥ 0.10 m within 60 min **or** any forecast P50 ≥ 0.30 m **or** rain ≥ 60 mm in last 2 h | amber banner, **Navigate to Safe Shelter** button | Pedestrian/motorcycle routes close first — leave *before* DANGER |
| DANGER | sensor ≥ 0.30 m (stays until < 0.25 m for 3 consecutive readings) | pulsing red, primary evacuate CTA, SOS prominent | Cars stall, wading unsafe |

The 60 mm / 2 h rain rule is a deliberately dumb, model-independent safety net (JPS's Infobanjir notes that convective rain above roughly 60 mm in 2–4 hours can cause flash floods). If ModelArts or the model fails, this still fires.

### 2.3 API contracts

| Endpoint | Auth | Purpose |
|---|---|---|
| `POST /api/v1/ingest` | HMAC-SHA256 over `device_id.ts.distance_cm(.1f)`, ±120 s clock skew | ESP32 readings |
| `GET /api/v1/twin/state?device_id&lat&lon&profile` | public (read-only) | level, phase, forecast, nearest shelter, degraded flags |
| `POST /api/v1/sos` | Firebase ID token (`DEV_AUTH=1` for local) | idempotent SOS; 30 s per-user rate limit |
| `GET /api/v1/export.csv?device_id` | protect in production | sensor log → NB1/NB2 training data |
| ModelArts service | AppCode header (or IAM token) | `{"rain_mm":[24], "level_m":[24]}` → `{horizons_min, p10, p50, p90}` |

---

## 3. Dataset catalogue

Labels: ✅ found and read in search results on 20 Sep 2026 · ⚪ from my background knowledge — **check URL, licence and schema before use**.

### 3.1 Rainfall / water level — inputs and labels for the forecaster

| # | Dataset | What you get | Use in FloodWay | Access | Status |
|---|---|---|---|---|---|
| 1 | **Your FYP JPS 10-year rainfall set** | Rainfall (+ whatever labels you used for the RF) | Inspect first: does it contain **stage/level**? If only rain + flood flag, use it for occurrence classification / prior, not for level regression | You already have it | ✅ (yours) |
| 2 | **Your ESP32 sensor logs** | On-site level, 10–30 s cadence | The only true ground truth at *your* site; also the recorded event for DEMO REPLAY | `GET /api/v1/export.csv` | ✅ (you generate) |
| 3 | **JPS Public Infobanjir** | Real-time rainfall + river level from hydrological stations (the site cites nearly 200 stations on one page and almost 500 on another — treat the count as unverified) | Best *live* Malaysian source; also the place to identify the nearest gauge to your sensor. **Bulk historical export is not confirmed** — the DID Hydrology Division publishes data and a Hydrologic Information System was described as under development. Scraping: check the site's terms first. | publicinfobanjir.water.gov.my · formal request via DID | ✅ |
| 4 | **Omdena "Flood Dataset (Malaysia)"** | Rainfall by state/district, 2000–2010 | Coarse and old: sanity checks, seasonal prior, plots for the deck. Not for a headline metric. | datasets.omdena.com/dataset/flood-dataset-(malaysia) | ✅ |
| 5 | **Open-Meteo Flood API (GloFAS v4)** | River discharge, 1984 → 7-month forecast, ~5 km grid (nearest river may be wrong; jitter coordinates by 0.1°) | Proxy for stage when you have none; context feature; sanity comparison | open-meteo.com/en/docs/flood-api (check the current terms of use) | ✅ |
| 6 | **Open-Meteo Historical Weather (ERA5-based)** | Hourly precipitation, decades | Training rain input in NB1 (hourly → 15-min is an approximation — disclose) | archive-api.open-meteo.com | ⚪ |
| 7 | **Open-Meteo Forecast, `minutely_15`** | Recent 15-min precipitation | Live rain window in the backend. For Malaysia this may be interpolated from hourly data — check before claiming "15-min radar". | api.open-meteo.com | ⚪ |
| 8 | **Google Flood Forecasting API / Inundation History / GRRR** | Riverine forecasts (API is waitlist-only, CC BY 4.0); water occurrence 1999–2020; global runoff reanalysis 1980–2023 | Benchmark and further-research context; do not build the demo on a waitlisted API | developers.google.com/flood-forecasting | ✅ |
| 9 | **NASA GPM IMERG · CHIRPS** | Satellite rainfall (~10 km / ~5 km) | Longer rain history if ERA5 looks too smooth | NASA GES DISC · UCSB CHC | ⚪ |

**What I could not find:** a public, labelled, sub-hourly Malaysian dataset with both rainfall and river stage that you can download today. Practical route: ask Dr. Ezzatul / Dr. Azliza to request station data (stage + rain, 15-min, 2–5 years, 1–3 stations near your sensor) from DID/JPS **today** on UiTM letterhead. It probably will not arrive inside 7 days — plan for both branches below.

### 3.2 Terrain, buildings, shelters — for the 3D twin, depth, routing

| # | Dataset | Use | Caveat | Status |
|---|---|---|---|---|
| 10 | **Copernicus DEM GLO-30** (also SRTM 30 m) | Terrain grid for NB4 / Three.js | It is a **surface** model (buildings/canopy included) → indicative depths only | ⚪ |
| 11 | **OpenStreetMap** (Overpass / Geofabrik Malaysia): buildings, roads, `amenity=community_centre` / `shelter` | Building footprints for the neighbourhood view; candidate shelters beyond your 15 | PPS are only *activated* during floods — never claim a shelter is open without an authoritative source | ⚪ |
| 12 | **MERIT Hydro / HAND** | Height-Above-Nearest-Drainage: stage → depth mapping without a hydraulic model | Research-grade; good further-research slide | ⚪ |
| 13 | **Your 15 KL/Selangor shelters** | Ground truth for shelter navigation | Add elevation from the DEM; verify with JKM/NADMA | ✅ (yours) |

### 3.3 Satellite flood mapping — roadmap, **not** needed for Option C + A

| # | Dataset / model | Facts | Status |
|---|---|---|---|
| 14 | **Sen1Floods11** | 4,831 chips of 512×512 covering 120,406 km², 11 flood events, 6 continents; 446 hand-labelled chips; Sentinel-1 (+ Sentinel-2 in the benchmark). Repo: `cloudtostreet/Sen1Floods11`; follow the README for the current bucket path. | ✅ |
| 15 | **Prithvi-100M fine-tuned on Sen1Floods11** (IBM/NASA, Apache-2.0) | Sentinel-2 bands B,G,R,NIR,SWIR1,SWIR2 → water/no-water; code in `NASA-IMPACT/hls-foundation-os` | ✅ |
| 16 | S1S2-Water, CAU-Flood (named as multimodal flood benchmarks in the literature); WorldFloods, Kuro Siwo | Additional SAR/optical flood sets | 🟡 names only / ⚪ |

**Honest take on satellites for this project:** Sentinel-1 revisits are days apart, monsoon cloud kills optical, and SAR is weak in dense urban flooding. None of it can drive a minutes-scale evacuation trigger. Present it as *post-event validation and mapping* on the roadmap slide. A full-blown U-Net on ModelArts is a 7-day project of its own — don't let it eat the SOS + twin work.

### 3.4 Which data path to take

| Situation by Wed 23 Sep | Train on | What you may claim |
|---|---|---|
| **A. You get real stage + rain (≥ 1 station, ≥ 2 seasons)** | NB2 with `load_real_csv` | "Trained on N years of DID station data; evaluated on a held-out chronological period; onset recall X / precision Y at +60 min." (only the numbers you measured) |
| **B. No stage data** | ERA5 rain + GloFAS discharge → **proxy level** (NB1 Cell 6) | "Prototype forecaster trained on a discharge-derived proxy; on-site calibration with our sensor in progress." No accuracy claim. |
| **C. Neither works** | Synthetic (pipeline proof) + your live ESP32 stream | Show architecture + live sensor → phase machine → SOS. Say the model is a deployed prototype awaiting real training data. Rain-intensity safety net still works. |

---

## 4. Repository layout

```
floodway2/
├─ ml/
│  ├─ flood_core.py         # shared features/model/inference (copy into backend/)
│  ├─ nb1_data.py           # -> .ipynb via jupytext
│  ├─ nb2_train.py
│  ├─ nb3_package.py
│  └─ nb4_terrain.py
├─ backend/
│  ├─ app.py  clients.py  trigger.py  flood_core.py  schema.sql
│  ├─ shelters.json  .env  requirements.txt  test_backend.py
├─ frontend/
│  ├─ floodMask.ts  sosClient.ts  useTwinState.ts  FloodTwin.tsx  sw.js
│  └─ public/terrain.json   # output of NB4
└─ firmware/floodway_node.ino
```

Notebooks are written in jupytext "percent" format (`# %%` = cell). Convert: `pip install jupytext && jupytext --to ipynb ml/nb*.py`.

---

## 5. Shared model core — `ml/flood_core.py` (✅)

Design choices: 24 × 15-min window (6 h); inputs `[rain, level, Δlevel]`; a small 2-layer GRU predicting **delta vs current level** at +30/+60/+120 min for quantiles P10/P50/P90 (pinball loss). Predicting the delta means the model must beat persistence to be useful, and quantiles give the UI an honest uncertainty band. Quantile crossing is fixed by sorting.

```python
# ml/flood_core.py
"""flood_core.py - single source of truth for features, model and inference.

Used by: training notebook, ModelArts customize_service.py, FastAPI fallback.
Contract (oldest -> newest, 15-minute steps):
    rain_mm : 24 floats   rainfall per 15-min step
    level_m : 24 floats   water depth at the sensor / gauge datum, metres
"""
from __future__ import annotations

import json
import os

import numpy as np

STEP_MIN = 15
WINDOW = 24                                   # 24 x 15 min = 6 h of history
HORIZONS_MIN = (30, 60, 120)
HORIZON_STEPS = tuple(h // STEP_MIN for h in HORIZONS_MIN)
QUANTILES = (0.1, 0.5, 0.9)
N_FEATS = 3                                   # rain, level, d(level)

try:
    import torch
    import torch.nn as nn
except ImportError:                           # backend can import constants w/o torch
    torch = None
    nn = None


def build_window_features(rain_mm, level_m) -> np.ndarray:
    rain = np.asarray(rain_mm, dtype=np.float32)
    level = np.asarray(level_m, dtype=np.float32)
    if rain.shape != (WINDOW,) or level.shape != (WINDOW,):
        raise ValueError(f"need exactly {WINDOW} values each for rain_mm and level_m")
    if not (np.isfinite(rain).all() and np.isfinite(level).all()):
        raise ValueError("NaN/inf in input window")
    dlevel = np.diff(level, prepend=level[0])
    return np.stack([rain, level, dlevel], axis=1)          # (WINDOW, 3)


if nn is not None:
    class FloodGRU(nn.Module):
        """Predicts DELTA level (m) at each horizon and quantile."""

        def __init__(self, n_feats: int = N_FEATS, hidden: int = 64):
            super().__init__()
            self.gru = nn.GRU(n_feats, hidden, num_layers=2, batch_first=True, dropout=0.1)
            self.head = nn.Sequential(
                nn.Linear(hidden, 64), nn.ReLU(),
                nn.Linear(64, len(HORIZON_STEPS) * len(QUANTILES)),
            )

        def forward(self, x):                                # x: (B, W, F)
            out, _ = self.gru(x)
            return self.head(out[:, -1]).view(-1, len(HORIZON_STEPS), len(QUANTILES))


class FloodPredictor:
    def __init__(self, model_dir: str):
        if torch is None:
            raise RuntimeError("torch is required for FloodPredictor")
        with open(os.path.join(model_dir, "meta.json")) as f:
            meta = json.load(f)
        self.mean = np.asarray(meta["mean"], dtype=np.float32)
        self.std = np.asarray(meta["std"], dtype=np.float32)
        self.model = FloodGRU(hidden=meta["hidden"])
        state = torch.load(os.path.join(model_dir, "model.pt"), map_location="cpu")
        self.model.load_state_dict(state)
        self.model.eval()
        self.version = meta.get("version", "unversioned")

    def predict(self, rain_mm, level_m) -> dict:
        x = (build_window_features(rain_mm, level_m) - self.mean) / self.std
        with torch.no_grad():
            delta = self.model(torch.from_numpy(x)[None]).numpy()[0]   # (H, Q)
        delta = np.sort(delta, axis=1)                                 # no quantile crossing
        now = float(level_m[-1])
        lvl = np.clip(now + delta, 0.0, None)
        return {
            "model_version": self.version,
            "horizons_min": list(HORIZONS_MIN),
            "level_now_m": round(now, 3),
            "p10": [round(float(v), 3) for v in lvl[:, 0]],
            "p50": [round(float(v), 3) for v in lvl[:, 1]],
            "p90": [round(float(v), 3) for v in lvl[:, 2]],
        }
```

---

## 6. Notebook 1 — data acquisition (🟡 compiled; network calls not executed)

```python
# ml/nb1_data.py
# %% [markdown]
# # NB1 - Acquire and align data for the FloodWay forecaster
# Goal: produce `station.csv` with columns timestamp, rain_mm (per 15 min), level_m.
# Sources here: Open-Meteo (rain, GloFAS discharge), your own JPS/FYP export, your ESP32 log.
# Endpoints below were written from documentation/memory and could NOT be called from my sandbox - run and inspect the first response.

# %% Cell 1 - config
import requests, pandas as pd, numpy as np
LAT, LON = 3.045, 101.55            # example: Shah Alam / Klang basin. Put your sensor site here.
START, END = "2015-01-01", "2025-12-31"
STEP = "15min"

# %% Cell 2 - hourly rainfall (ERA5-based reanalysis via Open-Meteo archive)
def fetch_rain_hourly(lat, lon, start, end) -> pd.Series:
    r = requests.get("https://archive-api.open-meteo.com/v1/archive", timeout=60, params={
        "latitude": lat, "longitude": lon, "start_date": start, "end_date": end,
        "hourly": "precipitation", "timezone": "Asia/Kuala_Lumpur"})
    r.raise_for_status()
    h = r.json()["hourly"]
    return pd.Series(h["precipitation"], index=pd.to_datetime(h["time"]), name="rain_mm_hourly")

def hourly_to_15min(s: pd.Series) -> pd.Series:
    """Spread each hourly total evenly over 4 steps. This is an APPROXIMATION - flag it in the report."""
    out = s.resample(STEP).ffill() / 4.0
    return out.rename("rain_mm")

# rain15 = hourly_to_15min(fetch_rain_hourly(LAT, LON, START, END))

# %% Cell 3 - GloFAS river discharge (daily, ~5 km; nearest river cell, try +-0.1 deg if it looks wrong)
def fetch_glofas_daily(lat, lon, start, end) -> pd.Series:
    r = requests.get("https://flood-api.open-meteo.com/v1/flood", timeout=60, params={
        "latitude": lat, "longitude": lon, "start_date": start, "end_date": end,
        "daily": "river_discharge"})
    r.raise_for_status()
    d = r.json()["daily"]
    return pd.Series(d["river_discharge"], index=pd.to_datetime(d["time"]), name="discharge_m3s")

# discharge = fetch_glofas_daily(LAT, LON, START, END)

# %% Cell 4 - YOUR JPS / FYP export (rainfall + stage). Adapt column names to the real file.
def load_jps_export(path: str, ts_col="datetime", rain_col="rain_mm", level_col="water_level_m") -> pd.DataFrame:
    df = pd.read_csv(path, parse_dates=[ts_col]).rename(columns={ts_col: "timestamp", rain_col: "rain_mm", level_col: "level_m"})
    df = df.set_index("timestamp").sort_index()
    assert df.index.is_monotonic_increasing and not df.index.duplicated().any(), "duplicate/unsorted timestamps"
    return df[["rain_mm", "level_m"]]

# %% Cell 5 - ESP32 log (exported from backend GET /api/v1/export.csv)
def load_sensor_log(path: str) -> pd.DataFrame:
    df = pd.read_csv(path, parse_dates=["ts"]).set_index("ts").sort_index()
    return df[["level_m"]].resample(STEP).median()

# %% Cell 6 - proxy level from discharge (ONLY if you have no stage data; label it as a proxy everywhere)
def discharge_to_proxy_level(q: pd.Series, bankfull_pctile=0.95, bankfull_depth_m=0.5) -> pd.Series:
    """Rank-based proxy: q at the 95th percentile maps to bankfull_depth_m. Not physical - do NOT report as accuracy."""
    scale = q.quantile(bankfull_pctile)
    return (q / scale * bankfull_depth_m).clip(lower=0).rename("level_m")

# %% Cell 7 - final alignment + sanity checks
def finalize(rain15: pd.Series, level15: pd.Series, out="station.csv") -> pd.DataFrame:
    df = pd.concat([rain15, level15], axis=1, join="inner").dropna()
    assert (df.rain_mm >= 0).all() and (df.level_m >= -0.05).all(), "physically impossible values"
    print(df.describe().round(3)); print("span:", df.index.min(), "->", df.index.max(), "rows:", len(df))
    df.rename_axis("timestamp").reset_index().to_csv(out, index=False)
    return df
```

---

## 7. Notebook 2 — train, evaluate, export (✅ ran end-to-end on synthetic data)

Evaluation is built around what the product needs: **onset recall/precision** (level now below 0.30 m, will be ≥ 0.30 m at the horizon), P10–P90 **coverage**, and the **leakage check** for your old 74.55%. Persistence has zero onset recall by construction — that is exactly why plain RMSE flatters weak models.

The synthetic generator is smooth and deterministic, so its metrics are far better than anything you will see on real data. **Never quote them.**

```python
# ml/nb2_train.py
# %% [markdown]
# # NB2 - Train the FloodWay level forecaster (GRU, quantile) + baselines
# Input : a DataFrame with a 15-min DatetimeIndex and columns `rain_mm`, `level_m`.
# Output: ./model_out/{model.pt, meta.json}
# NOTE  : the synthetic generator only proves the PIPELINE. Never quote its metrics.

# %% Cell 1 - imports and config
import json, os, sys
import numpy as np, pandas as pd
import torch, torch.nn as nn
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else ".")
from flood_core import (WINDOW, HORIZON_STEPS, HORIZONS_MIN, QUANTILES, STEP_MIN,
                        FloodGRU, build_window_features)

SEED = 42
DANGER_M = 0.30           # your "commit" threshold
WARN_M = 0.10             # earliest pedestrian threshold from your routing table
OUT_DIR = "model_out"
rng = np.random.default_rng(SEED); torch.manual_seed(SEED)

# %% Cell 2 - data loader (swap the synthetic branch for real data)
def load_real_csv(path: str) -> pd.DataFrame:
    """Expected columns: timestamp, rain_mm (per step), level_m. Any station, any cadence."""
    df = pd.read_csv(path, parse_dates=["timestamp"]).set_index("timestamp").sort_index()
    df = df[["rain_mm", "level_m"]].resample(f"{STEP_MIN}min").agg({"rain_mm": "sum", "level_m": "mean"})
    n_missing = int(df["level_m"].isna().sum())
    df["level_m"] = df["level_m"].interpolate(limit=4)      # bridge <=1 h gaps only
    df["rain_mm"] = df["rain_mm"].fillna(0.0)
    df = df.dropna()
    print(f"loaded {len(df):,} rows, {n_missing:,} missing level steps (long gaps dropped)")
    return df

def make_synthetic(n_days: int = 900) -> pd.DataFrame:
    """Storm-driven linear reservoir. PIPELINE TEST ONLY."""
    n = n_days * 24 * 60 // STEP_MIN
    rain = np.zeros(n)
    t = 0
    while t < n - 60:
        t += int(rng.exponential(24 * 60 / STEP_MIN / 0.35))          # a storm every ~3 days
        dur = int(rng.integers(3, 30)); peak = rng.gamma(2.0, 5.0)
        shape = np.sin(np.linspace(0, np.pi, dur)) ** 2
        rain[t:t + dur] += (peak * shape * rng.uniform(0.6, 1.4, dur))[: n - t]
    kernel = np.exp(-np.arange(24) / 6.0); kernel /= kernel.sum()
    inflow = np.convolve(rain, kernel)[:n]
    level = np.zeros(n)
    for i in range(n - 1):
        level[i + 1] = max(0.0, level[i] + 0.010 * inflow[i] - 0.012 * level[i] + rng.normal(0, 0.002))
    idx = pd.date_range("2022-01-01", periods=n, freq=f"{STEP_MIN}min")
    return pd.DataFrame({"rain_mm": rain, "level_m": level}, index=idx)

df = make_synthetic()                    # <- replace with load_real_csv("your_station.csv")
print(df.describe().round(3)); print("share of steps >= 0.30 m:", round((df.level_m >= DANGER_M).mean(), 4))

# %% Cell 3 - supervised windows + CHRONOLOGICAL split with a purge gap
max_h = max(HORIZON_STEPS)
def make_xy(df: pd.DataFrame):
    rain, level = df.rain_mm.to_numpy(np.float32), df.level_m.to_numpy(np.float32)
    ends = np.arange(WINDOW - 1, len(df) - max_h)
    X = np.stack([build_window_features(rain[e - WINDOW + 1: e + 1], level[e - WINDOW + 1: e + 1]) for e in ends])
    now = level[ends]
    Y = np.stack([level[ends + h] for h in HORIZON_STEPS], axis=1)      # absolute future level
    return X, Y, now, ends

X, Y, NOW, ENDS = make_xy(df)
n = len(X); gap = WINDOW + max_h
i_tr, i_va = int(n * 0.70), int(n * 0.85)
tr = np.arange(0, i_tr - gap); va = np.arange(i_tr, i_va - gap); te = np.arange(i_va, n)
print({"train": len(tr), "val": len(va), "test": len(te)})

mean, std = X[tr].reshape(-1, X.shape[-1]).mean(0), X[tr].reshape(-1, X.shape[-1]).std(0) + 1e-6
norm = lambda a: (a - mean) / std

# %% Cell 4 - baselines: persistence + gradient boosting (median)
from sklearn.ensemble import HistGradientBoostingRegressor
def tab(X_):                                        # tabular view of a window
    rain, lvl = X_[:, :, 0], X_[:, :, 1]
    return np.column_stack([lvl[:, -1], lvl[:, -1] - lvl[:, -2], lvl[:, -1] - lvl[:, -5],
                            rain[:, -4:].sum(1), rain[:, -12:].sum(1), rain.sum(1)])
gbm_pred = np.zeros((len(te), len(HORIZON_STEPS)))
for j in range(len(HORIZON_STEPS)):
    m = HistGradientBoostingRegressor(loss="absolute_error", max_iter=300, learning_rate=0.06, random_state=SEED)
    m.fit(tab(X[tr]), Y[tr, j] - NOW[tr]); gbm_pred[:, j] = NOW[te] + m.predict(tab(X[te]))
persist_pred = np.repeat(NOW[te][:, None], len(HORIZON_STEPS), axis=1)

# %% Cell 5 - GRU with pinball loss (predicts delta vs current level)
dev = "cuda" if torch.cuda.is_available() else "cpu"
Xt = lambda idx: torch.tensor(norm(X[idx]), dtype=torch.float32)
Dt = lambda idx: torch.tensor(Y[idx] - NOW[idx][:, None], dtype=torch.float32)
q_t = torch.tensor(QUANTILES, dtype=torch.float32, device=dev).view(1, 1, -1)

def pinball(pred, target):                          # pred (B,H,Q) target (B,H)
    e = target.unsqueeze(-1) - pred
    return torch.maximum(q_t * e, (q_t - 1) * e).mean()

model = FloodGRU(hidden=64).to(dev)
opt = torch.optim.AdamW(model.parameters(), lr=2e-3, weight_decay=1e-4)
sched = torch.optim.lr_scheduler.ReduceLROnPlateau(opt, factor=0.5, patience=3)
xtr, ytr, xva, yva = Xt(tr).to(dev), Dt(tr).to(dev), Xt(va).to(dev), Dt(va).to(dev)
best, best_state, bad, EPOCHS, BS = 1e9, None, 0, 40, 256
for ep in range(EPOCHS):
    model.train(); perm = torch.randperm(len(xtr), device=dev)
    for k in range(0, len(perm), BS):
        b = perm[k:k + BS]; opt.zero_grad()
        loss = pinball(model(xtr[b]), ytr[b]); loss.backward()
        nn.utils.clip_grad_norm_(model.parameters(), 1.0); opt.step()
    model.eval()
    with torch.no_grad(): vloss = pinball(model(xva), yva).item()
    sched.step(vloss)
    if vloss < best - 1e-6: best, bad, best_state = vloss, 0, {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}
    else: bad += 1
    if ep % 5 == 0 or bad == 0: print(f"ep {ep:02d} val pinball {vloss:.5f}")
    if bad >= 8: print("early stop"); break
model.load_state_dict(best_state); model.eval()
with torch.no_grad(): gru_q = model(Xt(te).to(dev)).cpu().numpy()          # (N,H,Q) deltas
gru_q = np.sort(gru_q, axis=2); gru_lvl = np.clip(NOW[te][:, None, None] + gru_q, 0, None)
gru_pred = gru_lvl[:, :, 1]

# %% Cell 6 - evaluation that matches the product (not just RMSE)
def rmse(a, b): return float(np.sqrt(np.mean((a - b) ** 2)))
def mae(a, b): return float(np.mean(np.abs(a - b)))
truth = Y[te]; rows = []
for name, p in [("persistence", persist_pred), ("gbm", gbm_pred), ("gru_p50", gru_pred)]:
    for j, h in enumerate(HORIZONS_MIN):
        rows.append({"model": name, "horizon_min": h, "MAE_m": mae(p[:, j], truth[:, j]), "RMSE_m": rmse(p[:, j], truth[:, j])})
print(pd.DataFrame(rows).pivot(index="model", columns="horizon_min", values="MAE_m").round(4))

def onset_metrics(pred, thr, use_now_below=True):
    """Onset = level NOW is below thr but will be >= thr at the horizon. The case that saves lives."""
    out = []
    for j, h in enumerate(HORIZONS_MIN):
        mask = NOW[te] < thr if use_now_below else np.ones(len(te), bool)
        y_true, y_hat = truth[mask, j] >= thr, pred[mask, j] >= thr
        tp, fp, fn = int((y_true & y_hat).sum()), int((~y_true & y_hat).sum()), int((y_true & ~y_hat).sum())
        out.append({"horizon_min": h, "events": int(y_true.sum()), "recall": tp / max(tp + fn, 1), "precision": tp / max(tp + fp, 1), "false_alarms": fp})
    return pd.DataFrame(out).round(3)
for name, p in [("persistence", persist_pred), ("gbm", gbm_pred), ("gru p50", gru_pred), ("gru p90 (cautious)", gru_lvl[:, :, 2])]:
    print(f"\n== onset of >= {DANGER_M} m : {name}"); print(onset_metrics(p, DANGER_M).to_string(index=False))

cov = ((truth >= gru_lvl[:, :, 0]) & (truth <= gru_lvl[:, :, 2])).mean(0)
print("\nP10-P90 interval coverage per horizon (target ~0.80):", cov.round(3))

# %% Cell 7 - the leakage check for YOUR old 74.55% number
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score
Xtab, ytab = tab(X), Y[:, 1]
a_tr, a_te, b_tr, b_te = train_test_split(Xtab, ytab, test_size=0.2, random_state=SEED)          # WRONG for time series
g = HistGradientBoostingRegressor(random_state=SEED).fit(a_tr, b_tr); r2_random = r2_score(b_te, g.predict(a_te))
cut = int(len(Xtab) * 0.8); g2 = HistGradientBoostingRegressor(random_state=SEED).fit(Xtab[:cut - gap], ytab[:cut - gap])
r2_time = r2_score(ytab[cut:], g2.predict(Xtab[cut:]))
print(f"R2 random split: {r2_random:.3f} | R2 chronological split: {r2_time:.3f}")
print("On SYNTHETIC data both are ~equal (smooth, stationary). On REAL data, a big gap means your old score was leakage.")

# %% Cell 8 - export
os.makedirs(OUT_DIR, exist_ok=True)
torch.save(model.state_dict(), os.path.join(OUT_DIR, "model.pt"))
json.dump({"mean": mean.tolist(), "std": std.tolist(), "hidden": 64, "window": WINDOW,
           "horizons_min": list(HORIZONS_MIN), "quantiles": list(QUANTILES),
           "version": "gru-q-0.1.0-SYNTHETIC"}, open(os.path.join(OUT_DIR, "meta.json"), "w"), indent=2)
print("exported ->", os.listdir(OUT_DIR))
```

---

## 8. Notebook 3 — package for Huawei ModelArts (✅ locally with a stubbed base class; ⚪ ModelArts side)

Read this before uploading:
* Deployment path used: OBS → Model Management → real-time service. ModelArts documents a PyTorch custom-inference flow (`customize_service.py` subclassing `PTServingBaseService`, `state_dict` weights, `config.json`) and warns to use **relative imports** for custom modules. The doc page I found for that flow carries an "(To Be Offline)" label in its breadcrumb, so **check the console for the current import/deploy flow**; the `config.json` fields (`runtime`, `dependencies`) may differ from what I wrote.
* Getting-started docs list real-name authentication for your HUAWEI ID and agency authorization as prerequisites, and note startup fails if the account is in arrears or the region lacks resources. Do these on day 1.
* Fallback that keeps the same code: `FloodPredictor` is framework-agnostic, so the identical package can run behind FastAPI in a container on ECS. Whether that satisfies the rules is a question for the organisers.

```python
# ml/nb3_package.py
# %% [markdown]
# # NB3 - Package the model for Huawei ModelArts (real-time service)
# Produces ./modelarts_pkg/ ready to upload to OBS:
#   model/{model.pt, meta.json, flood_core.py, customize_service.py, config.json}

# %% Cell 1 - assemble the package
import json, os, shutil
PKG = "modelarts_pkg/model"
os.makedirs(PKG, exist_ok=True)
for f in ["model_out/model.pt", "model_out/meta.json", "flood_core.py"]:
    shutil.copy(f, PKG)

customize_service = '''
import os
try:                                   # ModelArts asks for relative imports of custom modules
    from .flood_core import FloodPredictor
except ImportError:
    from flood_core import FloodPredictor
from model_service.pytorch_model_service import PTServingBaseService


class FloodService(PTServingBaseService):
    def __init__(self, model_name, model_path):
        self.model_name = model_name
        self.model_path = model_path
        model_dir = model_path if os.path.isdir(model_path) else os.path.dirname(model_path)
        self.predictor = FloodPredictor(model_dir)

    def _preprocess(self, data):
        # JSON body: {"rain_mm": [24 floats], "level_m": [24 floats]}
        if not isinstance(data, dict) or "rain_mm" not in data or "level_m" not in data:
            raise ValueError("body must be JSON with rain_mm and level_m")
        return data

    def _inference(self, data):
        return self.predictor.predict(data["rain_mm"], data["level_m"])

    def _postprocess(self, data):
        return data
'''
open(f"{PKG}/customize_service.py", "w").write(customize_service.lstrip())

arr = {"type": "array", "items": {"type": "number"}}
config = {
    "model_algorithm": "flood_level_forecaster",
    "model_type": "PyTorch",
    "runtime": "python3.7",            # pick whatever runtime the console offers for PyTorch; check the current docs
    "apis": [{
        "protocol": "https", "url": "/", "method": "post",
        "request": {"Content-type": "application/json",
                    "data": {"type": "object", "properties": {"rain_mm": arr, "level_m": arr}}},
        "response": {"Content-type": "application/json",
                     "data": {"type": "object", "properties": {"horizons_min": arr, "p10": arr, "p50": arr, "p90": arr}}},
    }],
    "dependencies": [{"installer": "pip", "packages": [{"package_name": "numpy", "package_version": "1.21.0", "restraint": "ATLEAST"}]}],
}
json.dump(config, open(f"{PKG}/config.json", "w"), indent=2)
print(sorted(os.listdir(PKG)))

# %% Cell 2 - local smoke test WITHOUT ModelArts (stubs the base class)
import sys, types, importlib
stub = types.ModuleType("model_service.pytorch_model_service")
class PTServingBaseService:                            # minimal stand-in
    def __init__(self, model_name, model_path): pass
stub.PTServingBaseService = PTServingBaseService
sys.modules["model_service"] = types.ModuleType("model_service")
sys.modules["model_service.pytorch_model_service"] = stub
sys.path.insert(0, PKG)
cs = importlib.import_module("customize_service")
svc = cs.FloodService("flood", os.path.join(PKG, "model.pt"))
payload = {"rain_mm": [0.0] * 20 + [4.0, 6.0, 8.0, 5.0], "level_m": [0.05 + 0.01 * i for i in range(24)]}
print(svc._postprocess(svc._inference(svc._preprocess(payload))))

# %% Cell 3 - upload to OBS and deploy (console path; the SDK path changes between releases)
print("""
1. OBS console -> create bucket (same region as ModelArts) -> upload modelarts_pkg/model/ as obs://<bucket>/floodway/model/
2. ModelArts -> Model Management -> Create model -> Import from OBS -> pick the folder above
   (engine: PyTorch; make sure config.json + customize_service.py sit next to model.pt)
3. Deploy -> Real-Time Service -> smallest CPU flavor is enough for a 64-unit GRU
4. Open the service's Prediction tab, paste the JSON payload from Cell 2, confirm p10<=p50<=p90
5. Copy the service's invocation URL into backend env MODELARTS_URL (see backend/.env.example)
""")
```

---

## 9. Notebook 4 — from one sensor to a neighbourhood flood surface (✅ synthetic DEM)

Bathtub model: cells below the sensor's water-surface elevation **and connected** to the sensor cell are flooded; depth = surface − ground. It assumes a flat water surface (fine over 1–2 km, wrong along a sloping river) and ignores drainage. `MAX_DEPTH_M` reuses your routing profiles, so a road segment's depth decides whether a walking/motorcycle/car/4x4 route is allowed — that is the link between the 3D twin and the routing page.

```python
# ml/nb4_terrain.py
# %% [markdown]
# # NB4 - From ONE sensor reading to a neighbourhood flood surface (bathtub model) + Three.js terrain
# Sensor gives water level at one point. The 3D twin needs depth everywhere -> DEM + hydrologic connectivity.
# LIMITS: bathtub assumes a FLAT water surface (fine over ~1-2 km, wrong along a sloping river) and ignores drainage/pumps.
# Copernicus GLO-30 is a DSM (includes buildings/canopy): treat depths as INDICATIVE, and say so in the UI.

# %% Cell 1 - read a DEM window (COG on the public Copernicus bucket; verify the URL pattern for your tile)
def read_dem_window(lat, lon, half_deg=0.01, url=None):
    import rasterio
    from rasterio.windows import from_bounds
    url = url or "https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N03_00_E101_00_DEM/Copernicus_DSM_COG_10_N03_00_E101_00_DEM.tif"
    with rasterio.open(url) as ds:
        w = from_bounds(lon - half_deg, lat - half_deg, lon + half_deg, lat + half_deg, ds.transform)
        dem = ds.read(1, window=w).astype("float32")
    return dem                                  # rows = north->south

# %% Cell 2 - bathtub depth with connectivity to the sensor/river cell
import numpy as np, json
from scipy import ndimage as ndi

def bathtub_depth(dem: np.ndarray, wse_m: float, seed_rc: tuple[int, int]) -> np.ndarray:
    """Cells below the water-surface elevation AND connected to the seed. depth = wse - dem."""
    below = dem < wse_m
    lab, _ = ndi.label(below)                    # 4-connectivity by default
    seed_lab = lab[seed_rc]
    if seed_lab == 0:
        return np.zeros_like(dem)
    return np.where(lab == seed_lab, wse_m - dem, 0.0).astype("float32")

MAX_DEPTH_M = {"walking": 0.10, "motorcycle": 0.15, "car": 0.30, "4x4": 0.70}     # from your routing table

def passable(depth_at_point_m: float, profile: str) -> bool:
    return depth_at_point_m < MAX_DEPTH_M[profile]

# %% Cell 3 - synthetic DEM for testing the whole chain offline
def synthetic_dem(n=120, seed=1):
    rng = np.random.default_rng(seed)
    y, x = np.mgrid[0:n, 0:n].astype("float32")
    valley = 8 + 0.06 * np.abs(x - n * 0.35) ** 1.15 + 0.004 * y             # river on the west side, rising east/south
    return valley + ndi.gaussian_filter(rng.normal(0, 1.2, (n, n)), 3).astype("float32")

dem = synthetic_dem()
win = dem[50:70, 35:50]; seed_rc = (50 + int(np.argmin(win) // win.shape[1]), 35 + int(np.argmin(win) % win.shape[1]))   # sensor at the channel floor
ground_at_sensor = float(dem[seed_rc])
for lvl in (0.1, 0.3, 1.0, 2.5):
    d = bathtub_depth(dem, ground_at_sensor + lvl, seed_rc)
    print(f"sensor level {lvl:>4} m -> flooded cells {(d > 0).mean():.1%}, max depth {d.max():.2f} m")

# %% Cell 4 - export a compact grid for the browser (<= 96x96, elevations relative to sensor ground)
def export_terrain(dem, seed_rc, out="terrain.json", max_side=96, cell_m=30.0):
    f = max(1, int(np.ceil(max(dem.shape) / max_side)))
    small = dem[::f, ::f]
    payload = {"rows": int(small.shape[0]), "cols": int(small.shape[1]), "cell_m": cell_m * f,
               "sensor_rc": [seed_rc[0] // f, seed_rc[1] // f],
               "ground_at_sensor_m": float(dem[seed_rc]),
               "elev_rel_m": np.round(small - dem[seed_rc], 2).ravel().tolist()}
    json.dump(payload, open(out, "w")); print(f"{out}: {len(payload['elev_rel_m'])} cells")
export_terrain(dem, seed_rc)
```

Copy `terrain.json` to `frontend/public/`. To go beyond a demo, replace the synthetic DEM with `read_dem_window()` output around your real sensor and choose `seed_rc` as the sensor's grid cell.

---

## 10. Backend

### 10.1 Phase machine — `backend/trigger.py` (✅)
```python
# backend/trigger.py
"""trigger.py - evacuation phase machine (single source of truth; the frontend only renders it)."""
from __future__ import annotations

from dataclasses import dataclass

DANGER_M = 0.30     # commit threshold: cars stall, pedestrians cannot wade
WARN_M = 0.10       # earliest pedestrian limit in the routing table
CLEAR_M = 0.25      # hysteresis: must fall below this to leave DANGER
CLEAR_TICKS = 3     # consecutive lower readings before de-escalating
RAIN_2H_WARN_MM = 60.0   # rule-based safety net independent of the ML model (JPS notes convective rain >60 mm in 2-4 h can cause flash floods)
RANK = {"NORMAL": 0, "WARNING": 1, "DANGER": 2}


@dataclass
class PhaseMachine:
    phase: str = "NORMAL"
    clear_count: int = 0

    def target(self, level_now: float, p50: list[float] | None, rain_2h_mm: float = 0.0) -> str:
        danger = level_now >= DANGER_M or (self.phase == "DANGER" and level_now >= CLEAR_M)
        if danger:
            return "DANGER"
        near_term = max(p50[:2]) if p50 else 0.0               # <= 60 min ahead
        any_term = max(p50) if p50 else 0.0
        if level_now >= WARN_M or near_term >= WARN_M or any_term >= DANGER_M or rain_2h_mm >= RAIN_2H_WARN_MM:
            return "WARNING"
        return "NORMAL"

    def update(self, level_now: float, p50: list[float] | None = None, rain_2h_mm: float = 0.0) -> str:
        tgt = self.target(level_now, p50, rain_2h_mm)
        if RANK[tgt] >= RANK[self.phase]:
            self.phase, self.clear_count = tgt, 0                # escalate / hold immediately
        else:
            self.clear_count += 1                                # de-escalate slowly
            if self.clear_count >= CLEAR_TICKS:
                self.phase, self.clear_count = tgt, 0
        return self.phase
```

### 10.2 External clients — `backend/clients.py` (🟡 compiled; ⚪ Huawei SDK and Open-Meteo calls)
`SmnNotifier` calls: `SmnClient.publish_message(PublishMessageRequest(topic_urn=..., body=PublishMessageRequestBody(...)))`. Verify names/region against the current SDK docs. `ap-southeast-3` is my assumption for the nearest region — confirm that ModelArts and SMN are both offered there.
```python
# backend/clients.py
"""clients.py - ModelArts, rainfall feed, SMN notifier. Every external call has a timeout and a degraded fallback."""
from __future__ import annotations

import logging
import os
from typing import Protocol

import httpx

from flood_core import WINDOW

log = logging.getLogger("floodway")


# ---------- ModelArts ----------
class Forecaster:
    """Calls the ModelArts real-time service; falls back to a local model only in dev (MODELARTS_URL unset)."""

    def __init__(self):
        self.url = os.getenv("MODELARTS_URL", "")
        self.app_code = os.getenv("MODELARTS_APP_CODE", "")          # APP-auth (X-Apig-AppCode)
        self.token = os.getenv("MODELARTS_IAM_TOKEN", "")            # or a short-lived IAM token
        self._local = None

    @property
    def source(self) -> str:
        return "modelarts" if self.url else "local"

    async def predict(self, rain_mm: list[float], level_m: list[float]) -> dict:
        if not self.url:
            if self._local is None:
                from flood_core import FloodPredictor
                self._local = FloodPredictor(os.getenv("LOCAL_MODEL_DIR", "model_out"))
            return self._local.predict(rain_mm, level_m)
        headers = {"Content-Type": "application/json"}
        if self.app_code:
            headers["X-Apig-AppCode"] = self.app_code
        elif self.token:
            headers["X-Auth-Token"] = self.token
        async with httpx.AsyncClient(timeout=4.0) as c:
            for attempt in (1, 2):
                try:
                    r = await c.post(self.url, json={"rain_mm": rain_mm, "level_m": level_m}, headers=headers)
                    r.raise_for_status()
                    return r.json()
                except httpx.HTTPError as e:
                    log.warning("modelarts attempt %s failed: %s", attempt, e)
        raise RuntimeError("modelarts unavailable")


# ---------- Rainfall feed ----------
async def fetch_rain_window(lat: float, lon: float) -> list[float] | None:
    """Last 24 x 15 min of precipitation. Returns None if unavailable -> caller MUST mark forecast degraded."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as c:
            r = await c.get("https://api.open-meteo.com/v1/forecast", params={
                "latitude": lat, "longitude": lon, "minutely_15": "precipitation",
                "past_minutely_15": WINDOW, "forecast_minutely_15": 0, "timezone": "Asia/Kuala_Lumpur"})
            r.raise_for_status()
            vals = [v if v is not None else 0.0 for v in r.json()["minutely_15"]["precipitation"]]
        return vals[-WINDOW:] if len(vals) >= WINDOW else None
    except Exception as e:                                             # noqa: BLE001
        log.warning("rain feed failed: %s", e)
        return None


# ---------- Notifications ----------
class Notifier(Protocol):
    def send(self, recipients: list[str], subject: str, body: str) -> str: ...


class ConsoleNotifier:
    def send(self, recipients, subject, body):
        log.warning("[SOS-DEMO] to=%s | %s | %s", recipients, subject, body)
        return "console"


class SmnNotifier:
    """Huawei SMN publish. NOTE: publish goes to ALL subscribers of the topic -> one topic per family group in production.
    SMS subscribers must confirm their subscription BEFORE the flood (do this in family onboarding)."""

    def __init__(self):
        from huaweicloudsdkcore.auth.credentials import BasicCredentials
        from huaweicloudsdksmn.v2 import SmnClient
        from huaweicloudsdksmn.v2.region.smn_region import SmnRegion
        creds = BasicCredentials(os.environ["HW_AK"], os.environ["HW_SK"], os.environ["HW_PROJECT_ID"])
        self.client = SmnClient.new_builder().with_credentials(creds) \
            .with_region(SmnRegion.value_of(os.getenv("HW_REGION", "ap-southeast-3"))).build()
        self.topic_urn = os.environ["SMN_TOPIC_URN"]

    def send(self, recipients, subject, body):
        from huaweicloudsdksmn.v2 import PublishMessageRequest, PublishMessageRequestBody
        req = PublishMessageRequest(topic_urn=self.topic_urn,
                                    body=PublishMessageRequestBody(subject=subject[:64], message=body))
        self.client.publish_message(req)
        return "smn"


def make_notifier() -> Notifier:
    if os.getenv("NOTIFIER", "console") == "smn":
        return SmnNotifier()
    return ConsoleNotifier()
```

### 10.3 API — `backend/app.py` (✅ tested with FastAPI TestClient)
```python
# backend/app.py
"""FloodWay 2.0 backend - sensor ingest, twin state, SOS. Run: uvicorn app:app --host 0.0.0.0 --port 8080"""
from __future__ import annotations

import hashlib
import hmac
import json
import math
import os
import time
from collections import defaultdict, deque
from statistics import median

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Response
from pydantic import BaseModel, Field

from clients import Forecaster, fetch_rain_window, make_notifier
from flood_core import HORIZONS_MIN, STEP_MIN, WINDOW
from trigger import RAIN_2H_WARN_MM, PhaseMachine

app = FastAPI(title="FloodWay 2.0 API", version="0.1.0")
forecaster, notifier = Forecaster(), make_notifier()

DEVICES: dict = json.loads(os.getenv("DEVICES", "{}"))       # {"fw-node-01": {"secret","mount_height_cm","lat","lon"}}
SHELTERS: list[dict] = json.loads(open(os.getenv("SHELTERS_FILE", "shelters.json")).read()) if os.path.exists(os.getenv("SHELTERS_FILE", "shelters.json")) else []
FAMILY: dict[str, list[str]] = json.loads(os.getenv("FAMILY", "{}"))    # demo only; use GaussDB in production
STALE_AFTER_S, MAX_SKEW_S, SOS_MIN_GAP_S = 600, 120, 30

readings: dict[str, deque] = defaultdict(lambda: deque(maxlen=2000))     # (ts, level_m)
machines: dict[str, PhaseMachine] = defaultdict(PhaseMachine)
raw_buf: dict[str, deque] = defaultdict(lambda: deque(maxlen=5))
sos_seen: dict[str, dict] = {}
sos_last: dict[str, float] = {}
_fc_cache: dict[str, tuple[float, dict | None, bool]] = {}
_rain_2h: dict[str, float] = {}


# ---------- helpers ----------
def haversine_m(lat1, lon1, lat2, lon2) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    a = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(lon2 - lon1) / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(a))


def nearest_shelter(lat: float, lon: float) -> dict | None:
    if not SHELTERS:
        return None
    s = min(SHELTERS, key=lambda x: haversine_m(lat, lon, x["lat"], x["lon"]))
    return {**s, "distance_m": round(haversine_m(lat, lon, s["lat"], s["lon"]))}


def level_window(rs, now: float) -> list[float] | None:
    """24 x 15-min medians ending at `now`. Forward-fill <=2 empty buckets, back-fill the leading edge; else None."""
    step = STEP_MIN * 60
    buckets: list[list[float]] = [[] for _ in range(WINDOW)]
    for ts, lv in rs:
        idx = WINDOW - 1 - int((now - ts) // step)
        if 0 <= idx < WINDOW:
            buckets[idx].append(lv)
    vals = [median(b) if b else None for b in buckets]
    if sum(v is not None for v in vals) < WINDOW * 0.6:
        return None
    out, last, gap = [], None, 0
    for v in vals:
        if v is not None:
            last, gap = v, 0
            out.append(v)
        elif last is not None and gap < 2:
            gap += 1
            out.append(last)
        else:
            out.append(None)
    first = next((v for v in out if v is not None), None)
    i = 0
    while i < len(out) and out[i] is None:
        out[i] = first
        i += 1
    return None if any(v is None for v in out) else out


# ---------- auth ----------
async def current_user(authorization: str | None = Header(None), x_dev_user: str | None = Header(None)) -> str:
    if os.getenv("DEV_AUTH") == "1" and x_dev_user:
        return x_dev_user
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "missing bearer token")
    try:
        from firebase_admin import auth as fb_auth              # Firebase Auth kept as identity provider
        return fb_auth.verify_id_token(authorization[7:])["uid"]
    except Exception as e:                                        # noqa: BLE001
        raise HTTPException(401, f"invalid token: {e}") from e


# ---------- sensor ingest ----------
class Ingest(BaseModel):
    device_id: str
    ts: int
    distance_cm: float = Field(ge=20, le=600)                     # JSN-SR04T usable range
    sig: str


@app.post("/api/v1/ingest")
def ingest(p: Ingest):
    dev = DEVICES.get(p.device_id)
    if not dev:
        raise HTTPException(404, "unknown device")
    msg = f"{p.device_id}.{p.ts}.{p.distance_cm:.1f}".encode()
    good = hmac.new(dev["secret"].encode(), msg, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(good, p.sig):
        raise HTTPException(401, "bad signature")
    if abs(time.time() - p.ts) > MAX_SKEW_S:
        raise HTTPException(400, "timestamp skew (replay or unsynced clock)")
    raw_buf[p.device_id].append(p.distance_cm)
    dist = median(raw_buf[p.device_id])                            # kills single-sample spikes
    level_m = max(0.0, (dev["mount_height_cm"] - dist) / 100.0)
    readings[p.device_id].append((p.ts, level_m))
    m = machines[p.device_id]
    fc = _fc_cache.get(p.device_id)
    m.update(level_m, fc[1]["p50"] if fc and fc[1] else None, _rain_2h.get(p.device_id, 0.0))   # tick per reading
    return {"level_m": round(level_m, 3), "phase": m.phase}


@app.get("/api/v1/export.csv")
def export_csv(device_id: str):
    rows = "\n".join(f"{time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(t))},{l:.3f}" for t, l in readings[device_id])
    return Response("ts,level_m\n" + rows, media_type="text/csv")


# ---------- twin state ----------
@app.get("/api/v1/twin/state")
async def twin_state(device_id: str, lat: float = Query(...), lon: float = Query(...), profile: str = "walking"):
    dev = DEVICES.get(device_id)
    if not dev:
        raise HTTPException(404, "unknown device")
    now = time.time()
    rs = readings[device_id]
    last_ts, level = (rs[-1] if rs else (0, 0.0))
    stale = (now - last_ts) > STALE_AFTER_S
    forecast, degraded, reason = None, False, []
    cached = _fc_cache.get(device_id)
    if cached and now - cached[0] < 120:
        forecast, degraded = cached[1], cached[2]
    else:
        lw, rw = level_window(rs, now), await fetch_rain_window(dev["lat"], dev["lon"])
        if rw:
            _rain_2h[device_id] = sum(rw[-8:])                     # last 2 h, feeds the rule-based safety net
            if _rain_2h[device_id] >= RAIN_2H_WARN_MM and machines[device_id].phase == "NORMAL":
                machines[device_id].phase = "WARNING"                # escalate-only here; de-escalation stays tied to sensor ticks
        if stale or lw is None or rw is None:
            degraded = True
        else:
            try:
                forecast = await forecaster.predict(rw, lw)
            except Exception:                                      # noqa: BLE001
                degraded = True
        _fc_cache[device_id] = (now, forecast, degraded)
    if stale:
        reason.append("sensor_stale")
    if degraded and not stale:
        reason.append("forecast_unavailable")
    m = machines[device_id]
    phase = m.phase                                            # never auto-downgrade because the sensor went quiet (it may be underwater)
    return {
        "device_id": device_id, "level_m": round(level, 3), "sensor_age_s": int(now - last_ts) if last_ts else None,
        "stale": stale, "phase": phase, "forecast": forecast, "forecast_source": forecaster.source,
        "degraded": degraded or stale, "degraded_reasons": reason, "horizons_min": list(HORIZONS_MIN),
        "profile": profile, "shelter": nearest_shelter(lat, lon),
        "disclaimer": "Indicative only. Follow NADMA / JPS / police instructions. Call 999 in an emergency.",
    }


# ---------- SOS ----------
class Sos(BaseModel):
    family_group_id: str
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    accuracy_m: float | None = None
    battery_pct: int | None = Field(None, ge=0, le=100)
    level_m: float | None = None
    shelter_name: str | None = Field(None, max_length=80)
    note: str = Field("", max_length=140)
    idempotency_key: str = Field(min_length=8, max_length=64)


@app.post("/api/v1/sos")
def sos(p: Sos, uid: str = Depends(current_user)):
    if p.idempotency_key in sos_seen:                              # client retries after flaky network
        return {**sos_seen[p.idempotency_key], "duplicate": True}
    now = time.time()
    if now - sos_last.get(uid, 0) < SOS_MIN_GAP_S:
        raise HTTPException(429, "SOS already sent a moment ago")
    recipients = FAMILY.get(p.family_group_id)
    if not recipients:
        raise HTTPException(404, "no family contacts registered for this group")
    where = f"https://maps.google.com/?q={p.lat:.5f},{p.lon:.5f}"
    parts = ["BANJIR / FLOOD:"]
    if p.level_m is not None:
        parts.append(f"air {p.level_m:.2f} m di rumah saya / water {p.level_m:.2f} m at my home.")
    parts.append(f"Menuju / heading to {p.shelter_name}." if p.shelter_name else "Sedang berpindah / evacuating.")
    parts.append(f"Lokasi: {where}")
    if p.battery_pct is not None:
        parts.append(f"Bateri {p.battery_pct}%")
    if p.note:
        parts.append(p.note)
    body = " ".join(parts)
    channel = notifier.send(recipients, "FloodWay SOS", body)
    sos_last[uid] = now
    result = {"status": "sent", "channel": channel, "recipients": len(recipients), "duplicate": False}
    sos_seen[p.idempotency_key] = result
    return result


@app.get("/healthz")
def healthz():
    return {"ok": True, "forecast_source": forecaster.source}
```

### 10.4 Config, tests, schema
`backend/.env.example` and `requirements.txt`:
```
DEVICES={"fw-node-01":{"secret":"CHANGE_ME_32_BYTES","mount_height_cm":250,"lat":3.045,"lon":101.55}}
SHELTERS_FILE=shelters.json          # [{"name": "...", "lat": .., "lon": ..}, ...] your 15 verified shelters
FAMILY={"demo-family":["+60123456789"]}   # demo only
MODELARTS_URL=                       # empty in dev -> local model in LOCAL_MODEL_DIR
MODELARTS_APP_CODE=
LOCAL_MODEL_DIR=model_out
NOTIFIER=console                     # smn on the deployed demo
HW_AK= HW_SK= HW_PROJECT_ID= HW_REGION=ap-southeast-3 SMN_TOPIC_URN=
DEV_AUTH=1                           # 0 when deployed; Firebase ID tokens are then required
```
```
fastapi>=0.110  uvicorn[standard]  httpx  pydantic>=2  numpy  torch
firebase-admin  huaweicloudsdkcore  huaweicloudsdksmn
```
Run: `uvicorn app:app --host 0.0.0.0 --port 8080`.

Test file (`backend/test_backend.py`, ✅ passes): covers HMAC rejection, replay window, ingest → state, hysteresis, rain safety net, SOS idempotency, rate limit, auth, unknown group, stale sensor.
```python
# backend/test_backend.py
import os, json, time, hmac, hashlib, asyncio
os.environ["DEVICES"] = json.dumps({"fw-node-01": {"secret": "s3cret", "mount_height_cm": 250, "lat": 3.045, "lon": 101.55}})
os.environ["FAMILY"] = json.dumps({"fam1": ["+60100000000"]})
os.environ["LOCAL_MODEL_DIR"] = "../ml/model_out"; os.environ["DEV_AUTH"] = "1"
import app as A
from fastapi.testclient import TestClient
A.SHELTERS[:] = [{"name": "Dewan A", "lat": 3.07, "lon": 101.50}, {"name": "Dewan B", "lat": 3.10, "lon": 101.60}]
async def fake_rain(lat, lon): return [0.0]*16 + [3.0, 5.0, 6.0, 4.0, 2.0, 1.0, 0.5, 0.0]
A.fetch_rain_window = fake_rain
c = TestClient(A.app)

def send(dist, ts=None, secret="s3cret"):
    ts = ts or int(time.time()); d = f"{dist:.1f}"
    sig = hmac.new(secret.encode(), f"fw-node-01.{ts}.{d}".encode(), hashlib.sha256).hexdigest()
    return c.post("/api/v1/ingest", json={"device_id": "fw-node-01", "ts": ts, "distance_cm": dist, "sig": sig})

assert send(200, secret="wrong").status_code == 401
assert send(200, ts=int(time.time()) - 999).status_code == 400
now = time.time()
for k in range(24 * 3):                                    # 6h of 5-min readings, rising water
    ts = int(now - (24 * 3 - k) * 300); lvl_cm = 5 + k * 0.6
    d = 250 - lvl_cm; A.raw_buf["fw-node-01"].clear()
    A.readings["fw-node-01"].append((ts, lvl_cm / 100))
r = send(250 - 32); print("ingest ->", r.json())         # 32 cm
st = c.get("/api/v1/twin/state", params={"device_id": "fw-node-01", "lat": 3.071, "lon": 101.501}).json()
print(json.dumps({k: st[k] for k in ["level_m", "phase", "degraded", "forecast", "shelter"]}, indent=1))
assert st["phase"] == "DANGER" and st["shelter"]["name"] == "Dewan A"
# hysteresis: 2 low readings must NOT clear DANGER, 3 must
m = A.machines["fw-node-01"]; assert m.update(0.2, None) == "DANGER" and m.update(0.2, None) == "DANGER"; assert m.update(0.2, None) != "DANGER"
from trigger import PhaseMachine
assert PhaseMachine().update(0.0, None, rain_2h_mm=65) == "WARNING"     # rain safety net works without any model
# SOS
body = {"family_group_id": "fam1", "lat": 3.071, "lon": 101.501, "battery_pct": 41, "level_m": 0.32, "shelter_name": "Dewan Serbaguna Seksyen 7", "idempotency_key": "abcdef123456"}
h = {"X-Dev-User": "u1"}
r1 = c.post("/api/v1/sos", json=body, headers=h); r2 = c.post("/api/v1/sos", json=body, headers=h)
assert r1.json()["status"] == "sent" and r2.json()["duplicate"] is True
r3 = c.post("/api/v1/sos", json={**body, "idempotency_key": "zzzzzzzz9999"}, headers=h); assert r3.status_code == 429
assert c.post("/api/v1/sos", json=body).status_code == 401
assert c.post("/api/v1/sos", json={**body, "family_group_id": "nope", "idempotency_key": "qqqqqqqq1111"}, headers={"X-Dev-User": "u2"}).status_code == 404
# stale sensor stays flagged, phase not downgraded
A.readings["fw-node-01"].append((int(time.time()) - 5000, 0.4)); A._fc_cache.clear()
st2 = c.get("/api/v1/twin/state", params={"device_id": "fw-node-01", "lat": 3.07, "lon": 101.5}).json()
print("stale:", st2["stale"], st2["degraded_reasons"])
print("ALL BACKEND TESTS PASSED")
```

Database (⚪ verify PostGIS availability on your chosen Huawei engine; the app's haversine lookup is fine for ~100 shelters):
```sql
-- backend/schema.sql
-- PostgreSQL-flavoured (GaussDB for PostgreSQL / RDS PostgreSQL). Verify PostGIS availability on your chosen Huawei engine;
-- if absent, keep the haversine lookup in app.py (fine for ~100 shelters).
CREATE TABLE shelters (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  lat          DOUBLE PRECISION NOT NULL CHECK (lat BETWEEN -90 AND 90),
  lon          DOUBLE PRECISION NOT NULL CHECK (lon BETWEEN -180 AND 180),
  capacity     INT,
  elevation_m  REAL,                 -- from DEM; prefer shelters above the local flood surface
  source       TEXT NOT NULL,        -- 'fyp-15' | 'osm' | 'jkm'
  verified_at  DATE
);
CREATE TABLE devices (
  device_id TEXT PRIMARY KEY, mount_height_cm REAL NOT NULL, lat DOUBLE PRECISION, lon DOUBLE PRECISION,
  ground_elev_m REAL, secret_hash TEXT NOT NULL
);
CREATE TABLE sensor_readings (
  device_id TEXT REFERENCES devices, ts TIMESTAMPTZ NOT NULL, level_m REAL NOT NULL, PRIMARY KEY (device_id, ts)
);
CREATE TABLE family_groups (id TEXT PRIMARY KEY, owner_uid TEXT NOT NULL);
CREATE TABLE family_contacts (
  id SERIAL PRIMARY KEY, group_id TEXT REFERENCES family_groups, display_name TEXT, phone_e164 TEXT NOT NULL,
  consent_at TIMESTAMPTZ NOT NULL,           -- PDPA: record explicit consent
  sms_confirmed BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE TABLE sos_events (
  idempotency_key TEXT PRIMARY KEY, uid TEXT NOT NULL, group_id TEXT, lat DOUBLE PRECISION, lon DOUBLE PRECISION,
  level_m REAL, shelter_name TEXT, channel TEXT, created_at TIMESTAMPTZ DEFAULT now()
);
-- retention: purge sos_events location fields after 30 days; readings can stay.
```

---

## 11. Firmware — `firmware/floodway_node.ino` (⚪ not compiled, no hardware in my sandbox)

Mount the JSN-SR04T **above** the water pointing down, on a fixed bracket (bridge rail / pole), not in the water. Set `mount_height_cm` on the server to the distance from sensor to the reference ground/bed you want "0 m" to mean — write that reference down; it defines the meaning of every number in the system. Add a small solar panel + battery if it will live outdoors. Consider a tipping-bucket rain gauge later (reed switch on an interrupt pin) so serving rain matches your sensor site.
```cpp
// firmware/floodway_node.ino
// FloodWay sensor node - ESP32 + JSN-SR04T (waterproof ultrasonic, mounted ABOVE the water, pointing down).
// Sends raw distance; the server owns mount height / calibration so you can recalibrate without reflashing.
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <time.h>
#include "mbedtls/md.h"

const char* WIFI_SSID = "YOUR_WIFI";       const char* WIFI_PASS = "YOUR_PASS";
const char* API_URL   = "https://YOUR_HOST/api/v1/ingest";
const char* DEVICE_ID = "fw-node-01";      const char* SECRET = "CHANGE_ME_32_BYTES";   // same as backend DEVICES
const int TRIG = 27, ECHO = 26;
const uint32_t NORMAL_MS = 30000, FAST_MS = 10000;                                      // speed up while water is rising
// For production pin the server CA: client.setCACert(ROOT_CA_PEM). setInsecure() is for the bench only.

float readDistanceCm() {                                   // median of 9 pings; JSN-SR04T needs >= 60 ms between pings
  float s[9]; int n = 0;
  for (int i = 0; i < 9; i++) {
    digitalWrite(TRIG, LOW); delayMicroseconds(4);
    digitalWrite(TRIG, HIGH); delayMicroseconds(12); digitalWrite(TRIG, LOW);
    unsigned long d = pulseIn(ECHO, HIGH, 30000UL);        // 30 ms timeout ~ 5 m
    if (d > 0) s[n++] = d * 0.0343f / 2.0f;                // 343 m/s; add temperature compensation if you have a probe
    delay(70);
  }
  if (n < 5) return -1;                                     // too many misses -> report nothing rather than garbage
  for (int i = 1; i < n; i++) { float k = s[i]; int j = i - 1; while (j >= 0 && s[j] > k) { s[j + 1] = s[j]; j--; } s[j + 1] = k; }
  return s[n / 2];
}

String hmacHex(const String& key, const String& msg) {
  uint8_t out[32]; mbedtls_md_context_t c; mbedtls_md_init(&c);
  mbedtls_md_setup(&c, mbedtls_md_info_from_type(MBEDTLS_MD_SHA256), 1);
  mbedtls_md_hmac_starts(&c, (const unsigned char*)key.c_str(), key.length());
  mbedtls_md_hmac_update(&c, (const unsigned char*)msg.c_str(), msg.length());
  mbedtls_md_hmac_finish(&c, out); mbedtls_md_free(&c);
  String h; char b[3]; for (int i = 0; i < 32; i++) { snprintf(b, 3, "%02x", out[i]); h += b; } return h;
}

void wifiUp() { if (WiFi.status() == WL_CONNECTED) return; WiFi.begin(WIFI_SSID, WIFI_PASS);
  for (int i = 0; i < 40 && WiFi.status() != WL_CONNECTED; i++) delay(500); }

void setup() {
  Serial.begin(115200); pinMode(TRIG, OUTPUT); pinMode(ECHO, INPUT);
  wifiUp(); configTime(0, 0, "pool.ntp.org", "time.google.com");                       // server rejects unsynced clocks (replay guard)
  while (time(nullptr) < 1700000000) delay(500);
}

float lastDist = -1;
void loop() {
  wifiUp();
  float d = readDistanceCm();
  uint32_t wait = NORMAL_MS;
  if (d > 0 && WiFi.status() == WL_CONNECTED) {
    long ts = (long)time(nullptr); char ds[16]; snprintf(ds, sizeof ds, "%.1f", d);   // MUST match server's f"{distance:.1f}"
    String sig = hmacHex(SECRET, String(DEVICE_ID) + "." + ts + "." + ds);
    String body = String("{\"device_id\":\"") + DEVICE_ID + "\",\"ts\":" + ts + ",\"distance_cm\":" + ds + ",\"sig\":\"" + sig + "\"}";
    WiFiClientSecure cli; cli.setInsecure(); HTTPClient http; http.begin(cli, API_URL);
    http.addHeader("Content-Type", "application/json"); int code = http.POST(body); http.end();
    Serial.printf("dist=%.1f cm -> HTTP %d\n", d, code);
    if (lastDist > 0 && (lastDist - d) > 2.0f) wait = FAST_MS;                          // distance shrinking = water rising
    lastDist = d;
  }
  delay(wait);
}
```

---

## 12. Frontend

### 12.1 Terrain flood mask — `floodMask.ts` (✅ Node-tested)
Same connectivity rule as NB4, in the browser, so the water only appears where it can hydraulically reach.
```ts
// frontend/floodMask.ts
/** BFS flood-fill on the terrain grid: which cells are below the water surface AND hydraulically connected to the sensor cell. */
export interface Terrain {
  rows: number;
  cols: number;
  cell_m: number;
  sensor_rc: [number, number];
  ground_at_sensor_m: number;
  elev_rel_m: number[]; // elevation relative to sensor ground, row-major
}

export function floodMask(t: Terrain, levelM: number): Uint8Array {
  const { rows, cols, elev_rel_m: e } = t;
  const mask = new Uint8Array(rows * cols);
  const [sr, sc] = t.sensor_rc;
  const seed = sr * cols + sc;
  if (levelM <= 0 || e[seed] >= levelM) return mask;
  const stack = [seed];
  mask[seed] = 1;
  while (stack.length) {
    const i = stack.pop() as number;
    const r = (i / cols) | 0;
    const c = i - r * cols;
    if (r > 0 && !mask[i - cols] && e[i - cols] < levelM) { mask[i - cols] = 1; stack.push(i - cols); }
    if (r < rows - 1 && !mask[i + cols] && e[i + cols] < levelM) { mask[i + cols] = 1; stack.push(i + cols); }
    if (c > 0 && !mask[i - 1] && e[i - 1] < levelM) { mask[i - 1] = 1; stack.push(i - 1); }
    if (c < cols - 1 && !mask[i + 1] && e[i + 1] < levelM) { mask[i + 1] = 1; stack.push(i + 1); }
  }
  return mask;
}

export function depthAt(t: Terrain, levelM: number, mask: Uint8Array, r: number, c: number): number {
  const i = r * t.cols + c;
  return mask[i] ? Math.max(0, levelM - t.elev_rel_m[i]) : 0;
}
```

### 12.2 SOS client — `sosClient.ts` (✅ Node-tested)
Idempotent retries (same key → no duplicate SMS), a bounded queue, and the SMS-composer fallback (iOS uses `&body=`, Android `?body=` — test on both).
```ts
// frontend/sosClient.ts
/** SOS client: idempotent send, offline queue, SMS fallback. No framework imports so it is unit-testable in Node. */
export interface SosPayload {
  family_group_id: string;
  lat: number;
  lon: number;
  accuracy_m?: number;
  battery_pct?: number;
  level_m?: number;
  shelter_name?: string;
  note?: string;
  idempotency_key: string;
}
export type SosResult = { state: "sent" | "queued" | "rejected"; detail?: string };

const QUEUE_KEY = "fw.sos.queue.v1";
const readQueue = (): SosPayload[] => {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]"); } catch { return []; }
};
const writeQueue = (q: SosPayload[]) => localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-5)));

export const newKey = (): string =>
  (globalThis.crypto as Crypto & { randomUUID?: () => string })?.randomUUID?.() ?? `k${Date.now()}${Math.random().toString(16).slice(2)}`;

async function post(p: SosPayload, token: string, base: string, timeoutMs: number): Promise<Response> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    return await fetch(`${base}/api/v1/sos`, {
      method: "POST", signal: ctl.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(p),
    });
  } finally { clearTimeout(timer); }
}

export async function sendSos(p: SosPayload, getToken: () => Promise<string>, base = "", timeoutMs = 8000): Promise<SosResult> {
  try {
    const r = await post(p, await getToken(), base, timeoutMs);
    if (r.ok || r.status === 429) return { state: "sent" };            // 429 = already sent a moment ago
    if (r.status >= 400 && r.status < 500) return { state: "rejected", detail: `HTTP ${r.status}` };
    throw new Error(`HTTP ${r.status}`);
  } catch {
    const q = readQueue();
    if (!q.some((x) => x.idempotency_key === p.idempotency_key)) writeQueue([...q, p]);
    return { state: "queued" };
  }
}

/** Call on app start, on window 'online', and on a 15 s timer while a queue exists. Same idempotency_key => no double SMS. */
export async function flushQueue(getToken: () => Promise<string>, base = ""): Promise<number> {
  const q = readQueue();
  const remaining: SosPayload[] = [];
  let sent = 0;
  for (const p of q) {
    const r = await sendSos(p, getToken, base);                         // re-queues itself on failure
    if (r.state === "sent") sent++;
    else if (r.state === "queued") remaining.push(p);
  }
  // sendSos re-wrote the queue for failures; make the stored queue exactly the still-pending ones
  writeQueue(remaining);
  return sent;
}

export function sosText(p: Pick<SosPayload, "lat" | "lon" | "level_m" | "shelter_name" | "battery_pct">): string {
  const parts = ["BANJIR / FLOOD:"];
  if (p.level_m != null) parts.push(`air ${p.level_m.toFixed(2)} m / water ${p.level_m.toFixed(2)} m at home.`);
  parts.push(p.shelter_name ? `Menuju / heading to ${p.shelter_name}.` : "Sedang berpindah / evacuating.");
  parts.push(`Lokasi: https://maps.google.com/?q=${p.lat.toFixed(5)},${p.lon.toFixed(5)}`);
  if (p.battery_pct != null) parts.push(`Bateri ${p.battery_pct}%`);
  return parts.join(" ");
}

/** Works with NO data connection (only cell signal): opens the SMS composer pre-filled. iOS and Android differ on the separator. */
export function smsHref(numbers: string[], body: string, userAgent = ""): string {
  const sep = /iPhone|iPad|iPod/i.test(userAgent) ? "&" : "?";
  return `sms:${numbers.join(",")}${sep}body=${encodeURIComponent(body)}`;
}
```

### 12.3 Live state hook — `useTwinState.ts` (🟡 type-checked)
```ts
// frontend/useTwinState.ts
import { useEffect, useRef, useState } from "react";

export type Phase = "NORMAL" | "WARNING" | "DANGER";
export interface Forecast { horizons_min: number[]; p10: number[]; p50: number[]; p90: number[]; model_version: string }
export interface TwinState {
  level_m: number; phase: Phase; stale: boolean; sensor_age_s: number | null;
  forecast: Forecast | null; forecast_source: "modelarts" | "local"; degraded: boolean; degraded_reasons: string[];
  shelter: { name: string; lat: number; lon: number; distance_m: number } | null; disclaimer: string;
}
const CACHE_KEY = "fw.twin.last.v1";

/** Polls the backend; keeps the last good state so the screen still works in a dead zone (and says so). */
export function useTwinState(opts: { deviceId: string; lat: number; lon: number; profile: string; base?: string; everyMs?: number }) {
  const { deviceId, lat, lon, profile, base = "", everyMs = 10_000 } = opts;
  const [state, setState] = useState<TwinState | null>(() => {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) ?? "null"); } catch { return null; }
  });
  const [lastOkAt, setLastOkAt] = useState<number | null>(null);
  const [offline, setOffline] = useState(false);
  const timer = useRef<number>();

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      if (document.hidden) return schedule();
      const ctl = new AbortController();
      const to = setTimeout(() => ctl.abort(), 6000);
      try {
        const q = new URLSearchParams({ device_id: deviceId, lat: String(lat), lon: String(lon), profile });
        const r = await fetch(`${base}/api/v1/twin/state?${q}`, { signal: ctl.signal });
        if (!r.ok) throw new Error(String(r.status));
        const s: TwinState = await r.json();
        if (!alive) return;
        setState(s); setLastOkAt(Date.now()); setOffline(false);
        localStorage.setItem(CACHE_KEY, JSON.stringify(s));
      } catch { if (alive) setOffline(true); }
      finally { clearTimeout(to); schedule(); }
    };
    const schedule = () => { if (alive) timer.current = window.setTimeout(tick, everyMs); };
    tick();
    return () => { alive = false; clearTimeout(timer.current); };
  }, [deviceId, lat, lon, profile, base, everyMs]);

  return { state, offline, lastOkAt };
}
```

### 12.4 The twin, HUD, shelter CTA and SOS — `FloodTwin.tsx` (🟡 type-checked against react 18 / three 0.160 / R3F 8 / drei 9; **not rendered** — expect to tune camera and colours)
UX rules baked in: no manual slider (the old dead-end); stale/offline/degraded banners; vertical exaggeration disclosed; 5-second **undo** before SOS sends (so "1-tap" cannot mean accidental tap); demo replay is visibly labelled.
```tsx
// frontend/FloodTwin.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { floodMask, type Terrain } from "./floodMask";
import { flushQueue, newKey, sendSos, smsHref, sosText, type SosResult } from "./sosClient";
import { useTwinState, type Phase, type TwinState } from "./useTwinState";

const VEXAG = 3;                         // vertical exaggeration - the HUD says so; never hide it

/* ---------------- 3D scene ---------------- */
function Scene({ terrain, levelM }: { terrain: Terrain; levelM: number }) {
  const { rows, cols, cell_m: cell, elev_rel_m: elev } = terrain;
  const shown = useRef(levelM);
  const mask = useMemo(() => floodMask(terrain, levelM), [terrain, levelM]);

  const { ground, water } = useMemo(() => {
    const mk = () => {
      const g = new THREE.PlaneGeometry((cols - 1) * cell, (rows - 1) * cell, cols - 1, rows - 1);
      g.rotateX(-Math.PI / 2);
      return g;
    };
    const g = mk(), w = mk();
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) pos.setY(i, elev[i] * VEXAG);
    g.computeVertexNormals();
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3));
    return { ground: g, water: w };
  }, [terrain]);

  // tint terrain + place water only where flooded AND connected to the sensor
  useEffect(() => {
    const col = ground.attributes.color as THREE.BufferAttribute;
    for (let i = 0; i < col.count; i++) {
      const wet = mask[i] === 1;
      const d = wet ? Math.min(1, Math.max(0, (levelM - elev[i]) / 1.5)) : 0;
      col.setXYZ(i, wet ? 0.25 - 0.15 * d : 0.42, wet ? 0.45 - 0.2 * d : 0.55, wet ? 0.6 : 0.35);
    }
    col.needsUpdate = true;
  }, [mask, levelM]);

  useFrame((_, dt) => {                        // damped rise so the level never "teleports"
    shown.current = THREE.MathUtils.damp(shown.current, levelM, 1.8, dt);
    const pos = water.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) pos.setY(i, mask[i] ? shown.current * VEXAG : elev[i] * VEXAG - 0.5);
    pos.needsUpdate = true;
  });

  const span = Math.max(cols, rows) * cell;
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[span, span, span / 2]} intensity={0.9} />
      <mesh geometry={ground}><meshLambertMaterial vertexColors /></mesh>
      <mesh geometry={water}><meshPhongMaterial color="#2a7fbf" transparent opacity={0.72} shininess={80} /></mesh>
      <OrbitControls maxPolarAngle={Math.PI / 2.1} minDistance={span * 0.2} maxDistance={span * 1.4} target={[0, 0, 0]} />
    </>
  );
}

/* ---------------- HUD ---------------- */
const TONE: Record<Phase, { bg: string; title: string; sub: string }> = {
  NORMAL:  { bg: "#14532d", title: "No flood risk at this sensor", sub: "Keep the app open during heavy rain." },
  WARNING: { bg: "#92400e", title: "Water rising - prepare to leave", sub: "Pedestrian routes close first. Go before it reaches your street." },
  DANGER:  { bg: "#991b1b", title: "EVACUATE NOW", sub: "Water is at a level that stops cars and makes walking unsafe." },
};

function Forecast({ s }: { s: TwinState }) {
  if (!s.forecast) return <p style={{ opacity: 0.85 }}>Forecast unavailable - showing sensor reading only.</p>;
  const f = s.forecast;
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {f.horizons_min.map((h, i) => (
        <div key={h} style={{ flex: 1, background: "#0002", borderRadius: 8, padding: 6, textAlign: "center" }}>
          <div style={{ fontSize: 12 }}>+{h} min</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{f.p50[i].toFixed(2)} m</div>
          <div style={{ fontSize: 11, opacity: 0.8 }}>{f.p10[i].toFixed(2)}-{f.p90[i].toFixed(2)}</div>
        </div>
      ))}
    </div>
  );
}

export interface FloodTwinProps {
  deviceId: string; lat: number; lon: number; profile: string;
  terrainUrl: string; familyGroupId: string; familyNumbers: string[];   // numbers only for the SMS fallback
  getIdToken: () => Promise<string>;
  onNavigateToShelter: (dest: { name: string; lat: number; lon: number }, profile: string) => void;
  demoLevelM?: number;                                                  // demo mode ONLY: replays a recorded event, shows a DEMO badge
}

export default function FloodTwin(p: FloodTwinProps) {
  const { state, offline } = useTwinState({ deviceId: p.deviceId, lat: p.lat, lon: p.lon, profile: p.profile });
  const [terrain, setTerrain] = useState<Terrain | null>(null);
  const [sos, setSos] = useState<{ phase: "idle" | "countdown" | "done"; left: number; result?: SosResult }>({ phase: "idle", left: 5 });
  const sosKey = useRef<string>(newKey());

  useEffect(() => { fetch(p.terrainUrl).then((r) => r.json()).then(setTerrain).catch(() => setTerrain(null)); }, [p.terrainUrl]);
  useEffect(() => {                                             // flush queued SOS when the network returns
    const go = () => void flushQueue(p.getIdToken);
    window.addEventListener("online", go); go();
    return () => window.removeEventListener("online", go);
  }, []);

  useEffect(() => {                                             // 5 s undo window, then send
    if (sos.phase !== "countdown") return;
    if (sos.left <= 0) { void doSend(); return; }
    const t = setTimeout(() => setSos((s) => ({ ...s, left: s.left - 1 })), 1000);
    return () => clearTimeout(t);
  }, [sos]);

  async function doSend() {
    const pos = await new Promise<GeolocationPosition | null>((res) =>
      navigator.geolocation.getCurrentPosition(res, () => res(null), { timeout: 6000, maximumAge: 60_000, enableHighAccuracy: true }));
    const batt = await (navigator as any).getBattery?.().then((b: any) => Math.round(b.level * 100)).catch(() => undefined);
    const payload = {
      family_group_id: p.familyGroupId, lat: pos?.coords.latitude ?? p.lat, lon: pos?.coords.longitude ?? p.lon,
      accuracy_m: pos?.coords.accuracy, battery_pct: batt, level_m: state?.level_m, shelter_name: state?.shelter?.name,
      idempotency_key: sosKey.current,
    };
    const result = await sendSos(payload, p.getIdToken);
    setSos({ phase: "done", left: 0, result });
    if (result.state === "sent") sosKey.current = newKey();      // next SOS is a new event
  }

  if (!state) return <div style={{ padding: 24 }}>Connecting to sensor... {offline && "(no connection)"}</div>;

  const level = p.demoLevelM ?? state.level_m;
  const tone = TONE[state.phase];
  const showRoute = state.phase !== "NORMAL" && state.shelter;
  const smsBody = sosText({ lat: p.lat, lon: p.lon, level_m: level, shelter_name: state.shelter?.name });

  return (
    <div style={{ position: "relative", height: "100dvh", background: "#0b1220", color: "#fff" }}>
      {terrain && <Canvas camera={{ position: [0, 700, 900], fov: 45, far: 20000 }}><Scene terrain={terrain} levelM={level} /></Canvas>}

      <div style={{ position: "absolute", inset: "0 0 auto 0", padding: 12, background: tone.bg, animation: state.phase === "DANGER" ? "fwpulse 1s infinite" : undefined }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>{tone.title}</div>
        <div style={{ fontSize: 13 }}>{tone.sub}</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>
          {level.toFixed(2)} m now{state.stale && " - SENSOR OFFLINE, last reading " + Math.round((state.sensor_age_s ?? 0) / 60) + " min ago"}
          {offline && " - no connection, showing last known state"}{p.demoLevelM != null && " - DEMO REPLAY"} - heights x{VEXAG}
        </div>
      </div>

      <div style={{ position: "absolute", inset: "auto 0 0 0", padding: 12, display: "grid", gap: 8, background: "linear-gradient(transparent, #000c 30%)" }}>
        <Forecast s={state} />
        {showRoute && (
          <button onClick={() => p.onNavigateToShelter(state.shelter!, p.profile)}
            style={{ padding: 16, fontSize: 18, fontWeight: 800, borderRadius: 12, border: 0, color: "#fff",
                     background: state.phase === "DANGER" ? "#dc2626" : "#d97706", animation: state.phase === "DANGER" ? "fwpulse 1s infinite" : undefined }}>
            Navigate to Safe Shelter (PPS) - {state.shelter!.name} ({Math.round(state.shelter!.distance_m)} m)
          </button>
        )}
        {sos.phase === "idle" && (
          <button onClick={() => setSos({ phase: "countdown", left: 5 })} style={{ padding: 14, fontSize: 16, fontWeight: 700, borderRadius: 12, border: "2px solid #fff", background: "transparent", color: "#fff" }}>
            SOS - tell my family I'm evacuating
          </button>
        )}
        {sos.phase === "countdown" && (
          <button onClick={() => setSos({ phase: "idle", left: 5 })} style={{ padding: 14, fontSize: 16, fontWeight: 700, borderRadius: 12, border: 0, background: "#fff", color: "#111" }}>
            Sending in {sos.left}s - tap to CANCEL
          </button>
        )}
        {sos.phase === "done" && (
          <div style={{ padding: 12, borderRadius: 12, background: "#0008" }}>
            {sos.result?.state === "sent" && "Family notified."}
            {sos.result?.state === "queued" && (<>No data connection - SOS will send automatically when it returns. <a style={{ color: "#fff", fontWeight: 700 }} href={smsHref(p.familyNumbers, smsBody, navigator.userAgent)}>Send by SMS now</a></>)}
            {sos.result?.state === "rejected" && <>Could not send ({sos.result.detail}). <a style={{ color: "#fff", fontWeight: 700 }} href={smsHref(p.familyNumbers, smsBody, navigator.userAgent)}>Send by SMS</a></>}
            <button onClick={() => setSos({ phase: "idle", left: 5 })} style={{ marginLeft: 8 }}>OK</button>
          </div>
        )}
        <div style={{ fontSize: 11, opacity: 0.8 }}>{state.disclaimer}</div>
      </div>
      <style>{`@keyframes fwpulse{50%{filter:brightness(1.35)}}`}</style>
    </div>
  );
}
```

Wiring example:
```tsx
<FloodTwin
  deviceId="fw-node-01" lat={homeLat} lon={homeLon} profile={vehicleProfile}
  terrainUrl="/terrain.json" familyGroupId={group.id} familyNumbers={group.numbers}
  getIdToken={() => firebaseAuth.currentUser!.getIdToken()}
  onNavigateToShelter={(dest, profile) => navigate("/navigate", { state: { dest, profile, mode: "evac" } })}
/>
```
The navigation page should sample `depth` at route segments (NB4 `passable`) so the chosen profile's limit actually removes flooded roads.

### 12.5 Offline shell — `sw.js` (⚪)
Caches the app shell and static JSON only; **never** caches `/api/`. Register in your entry file. Add your bundler's hashed assets to `ASSETS`.
```js
// frontend/sw.js
/* Minimal offline shell. Register from index.tsx: navigator.serviceWorker.register('/sw.js') */
const SHELL = "fw-shell-v1";
const ASSETS = ["/", "/index.html", "/terrain.json", "/shelters.json"];   // add your built JS/CSS via your bundler's manifest
self.addEventListener("install", (e) => e.waitUntil(caches.open(SHELL).then((c) => c.addAll(ASSETS))));
self.addEventListener("activate", (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== SHELL).map((k) => caches.delete(k))))));
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.pathname.startsWith("/api/")) return;                            // never cache live flood data or SOS
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => {
    if (e.request.method === "GET" && r.ok) caches.open(SHELL).then((c) => c.put(e.request, r.clone()));
    return r;
  }).catch(() => caches.match("/index.html"))));
});
```

### 12.6 Logic tests — `test_frontend_logic.ts` (✅ `node --experimental-strip-types test_frontend_logic.ts`)
```ts
// frontend/test_frontend_logic.ts
import { floodMask, depthAt, type Terrain } from "./floodMask.ts";
import { sendSos, flushQueue, smsHref, sosText, type SosPayload } from "./sosClient.ts";
import assert from "node:assert/strict";

// ---- floodMask: a disconnected pit must NOT flood
const t: Terrain = { rows: 3, cols: 5, cell_m: 30, sensor_rc: [1, 0], ground_at_sensor_m: 8,
  elev_rel_m: [ 0.5, 0.5, 0.5, 0.5, 0.5,
                0.0, 0.2, 0.6, -0.5, 0.0,      // pit (-0.5) behind a 0.6 m ridge
                0.5, 0.5, 0.5, 0.5, 0.5 ] };
let m = floodMask(t, 0.3);
assert.equal(m[1 * 5 + 1], 1); assert.equal(m[1 * 5 + 3], 0, "isolated pit stays dry at 0.3 m");
m = floodMask(t, 0.7);
assert.equal(m[1 * 5 + 3], 1, "ridge overtopped at 0.7 m");
assert.ok(Math.abs(depthAt(t, 0.7, m, 1, 3) - 1.2) < 1e-9);

// ---- SOS client with fake browser globals
const store = new Map<string, string>();
(globalThis as any).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
let online = false; const seenKeys: string[] = [];
(globalThis as any).fetch = async (_u: string, init: any) => {
  if (!online) throw new TypeError("network down");
  seenKeys.push(JSON.parse(init.body).idempotency_key);
  return { ok: true, status: 200 } as Response;
};
const p: SosPayload = { family_group_id: "fam1", lat: 3.07, lon: 101.5, idempotency_key: "key-1234567" };
const tok = async () => "tkn";
const r1 = await sendSos(p, tok, "", 200); assert.equal(r1.state, "queued");
assert.equal(await flushQueue(tok), 0);                       // still offline: stays queued
assert.equal(JSON.parse(store.get("fw.sos.queue.v1")!).length, 1);
online = true;
assert.equal(await flushQueue(tok), 1);
assert.equal(JSON.parse(store.get("fw.sos.queue.v1")!).length, 0);
assert.deepEqual(seenKeys, ["key-1234567"]);
assert.ok(smsHref(["+601", "+602"], "a b", "iPhone").startsWith("sms:+601,+602&body=a%20b"));
assert.ok(smsHref(["+601"], "x", "Android").startsWith("sms:+601?body="));
console.log(sosText({ lat: 3.07, lon: 101.5, level_m: 0.32, shelter_name: "Dewan Serbaguna Seksyen 7", battery_pct: 41 }));
console.log("FRONTEND LOGIC TESTS PASSED");
```

---

## 13. Huawei Cloud mapping (what to actually stand up)

| Service | Role here | Notes |
|---|---|---|
| **ModelArts** | Real-time inference for the GRU (and notebook/training if allowed) | The eligibility gate. Deploy by Wed 23 Sep. |
| **OBS** | Model package, `terrain.json`, sensor exports, community photos | Same region as ModelArts. |
| **ECS** | FastAPI backend (+ static PWA) | Put behind HTTPS; ESP32 posts here. |
| **SMN** | SOS SMS/email | Test SMS to a **Malaysian number** early; confirmation of subscriptions; per-group topics. ⚪ |
| **GaussDB / RDS PostgreSQL** | Shelters, contacts, SOS events | Optional for the demo; in-memory dicts work for a 15-minute pitch. |
| **IoTDA** (optional) | Device registry/ingest instead of raw HTTPS | ⚪ From memory — evaluate only if you have spare days. |

---

## 14. Test plan & demo script

**Automated (all above):** `python test_backend.py` · `node --experimental-strip-types test_frontend_logic.ts` · `npx tsc -p .`

**Manual acceptance (do each on a real phone):**
1. Bucket of water under the sensor → level updates on the twin within ~30 s; phase turns WARNING at ~0.10 m, DANGER at ~0.30 m; stays DANGER until < 0.25 m for 3 readings.
2. Unplug the sensor → banner shows **SENSOR OFFLINE**, phase does not drop to NORMAL.
3. Kill the ModelArts URL → "Forecast unavailable"; phase still works from sensor + rain rule.
4. Airplane mode → tap SOS → cancel window → "queued" + **Send by SMS now** opens the composer with the message; re-enable data → queued SOS delivers once (check the server log for a single send).
5. Two rapid SOS taps → second is rate-limited/deduplicated.
6. Real SMN SMS reaches a confirmed team-member number.
7. Shelter CTA opens the navigation page with the chosen vehicle profile.

**Demo script (≈3 min of the 15):** live sensor reading → phase banner → forecast strip (with P10–P90) → WARNING → "Navigate to Safe Shelter" (route respects profile) → DEMO REPLAY of a recorded rising event to show DANGER → SOS with undo → family phone receives message → airplane-mode fallback. Say "DEMO REPLAY" out loud.

---

## 15. What you may and may not claim

* ✅ "Sensor-driven twin; no manual input." · ✅ "Three-phase trigger with hysteresis." · ✅ "Forecast with uncertainty band deployed on ModelArts." · ✅ "SOS works offline via SMS fallback."
* ⚠️ Any accuracy figure **only** from a chronological held-out test on real data, with the split described.
* ⚠️ Depths are **indicative** (DSM, flat-water assumption).
* ❌ "Alerts emergency services." · ❌ "Predicts floods at your house." · ❌ Comparing to HyperNeura's number.
* Location sharing is personal data: get explicit consent per contact (schema has `consent_at`), state retention, and keep a 999 reminder in the UI. Malaysia's PDPA 2010 applies — this is not legal advice; ask your supervisors/UiTM.

---

## 16. Seven-day schedule (Sun 20 → Sun 27 Sep) and cut list

| Day | Do | Done when |
|---|---|---|
| **Sun 20** | Huawei ID real-name verification, ModelArts agency auth, OBS bucket, check region resources; email organisers re: eligibility; ask supervisors for DID/JPS data; flash ESP32 and start logging; create repo skeleton from this doc | Can open a ModelArts notebook / service page without auth errors |
| **Mon 21** | NB1 → real or proxy data; NB2 baseline + GRU; run Cell 7 leakage check | Metrics table on a chronological test set |
| **Tue 22** | Finish NB2, export, NB3 package, upload to OBS | Model imported in ModelArts |
| **Wed 23** | Deploy real-time service; wire backend to it; backend on ECS | `/twin/state` returns a forecast from ModelArts (**gate: if not, escalate to organisers and prepare the ECS fallback**) |
| **Thu 24** | NB4 with real DEM around the sensor; frontend twin + shelter CTA + phase HUD | Water rises from live/replayed sensor data |
| **Fri 25** | SOS (SMN, queue, SMS fallback), offline shell, full manual test plan | All 7 acceptance tests pass on a phone |
| **Sat 26** | Deck, DEMO REPLAY recording, rehearsal ×2, submission package | Submit **by Saturday night** — the exact cut-off hour/time zone is not in what I have |
| **Sun 27** | Buffer only | — |

**Cut list, in order:** (1) OSM neighbourhood buildings (keep terrain mesh) → (2) GaussDB (use in-memory + file) → (3) service worker → (4) GRU → GBM baseline deployed instead → (5) SMN → keep SMS-composer fallback and *show* the queue. **Never cut:** ModelArts deployment, stale/degraded handling, DEMO REPLAY badge, the 999/disclaimer line.

---

## 17. Further research (after the deadline, and for the "future work" slide)

1. **Real data + evaluation rigor:** leave-one-monsoon-out cross-validation across seasons; report onset recall vs false alarms per week (operational cost), calibration of P10–P90 (conformal prediction for guaranteed coverage), and lead-time gain over a threshold rule.
2. **Multi-station / basin-aware model:** upstream gauge levels as inputs (graph or simple lagged upstream features) — river floods are routed, not local. Single-point GRUs plateau here.
3. **Physics + ML:** train a surrogate on a 2D hydraulic model (e.g. HEC-RAS 2D / LISFLOOD-FP-style) so the twin's depth surface is not a flat-water bathtub; HAND-based rating curves as a cheap middle step.
4. **Report-assimilated twin:** your Gemini-verified community photos are a differentiator — use verified depth reports to correct the depth surface locally (data assimilation), and to flag sensor faults.
5. **Satellite layer:** Sen1Floods11 + Prithvi fine-tune (Section 3.3) for post-event extent mapping and for validating the twin after each flood; evaluate transfer to tropical urban scenes before claiming anything.
6. **Sensing:** tipping-bucket rain gauge and second depth sensor (redundancy, cross-check); LoRaWAN/NB-IoT for sites without WiFi; temperature-compensated ultrasonic or radar level sensors.
7. **Family Safety at scale:** per-group SMN topics or direct SMS, contact confirmation flow, "I'm safe" check-ins, battery-aware location pings; privacy review and retention policy.
8. **Human factors:** test the WARNING wording with real residents (BM/EN/Mandarin/Tamil); measure how early people leave after the banner — that is the real KPI, not model RMSE.

---

## 18. What I actually verified vs. what I did not

| Item | Status |
|---|---|
| `flood_core.py`, NB2 pipeline, training, export | ✅ ran on synthetic data (CPU) |
| NB3 packaging + `customize_service.py` | ✅ ran against a **stubbed** `PTServingBaseService` — not on ModelArts |
| NB4 bathtub + terrain export | ✅ synthetic DEM |
| Backend logic | ✅ FastAPI TestClient tests pass (Open-Meteo call mocked; SMN not called) |
| Frontend pure logic | ✅ Node tests pass |
| Frontend React/Three components | 🟡 `tsc --noEmit` clean; never rendered in a browser |
| NB1 (Open-Meteo calls), DEM download URL | 🟡/⚪ compiled only; endpoints from docs/memory — inspect first responses |
| ModelArts `config.json` / runtime string, APP-code auth header, SMN SDK signatures, region availability | ⚪ from documentation snippets/memory — verify in the console / SDK docs |
| Firmware | ⚪ not compiled, no hardware |
| Dataset availability, licences, station counts | ✅ = seen in search results today; ⚪ = memory — verify |

Sources consulted today: Omdena Malaysia flood dataset page; JPS Public Infobanjir (about / FAQ / rainfall pages); Open-Meteo Flood API docs; Google Flood Forecasting API docs; Sen1Floods11 (IEEE CVPRW 2020 abstract, GitHub); Prithvi-100M Sen1Floods11 model card (Hugging Face); Huawei Cloud ModelArts documentation (inference overview, real-time service deployment, PyTorch custom-script examples, getting-started).