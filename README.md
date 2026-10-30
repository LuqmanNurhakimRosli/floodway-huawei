# FloodWay: flood early warning for Malaysian cities
### Huawei ICT Competition 2026–2027 · Innovation Track (Cloud & AI)

> **"One glance to know if you are safe. One tap to find shelter."**

FloodWay warns residents of flood-prone places before the water reaches them. It turns four inputs into one four-level warning (Normal, Advisory, Warning, Danger), shows it on a map, routes people around flooded roads to an open relief centre, and sends alerts.

**What is real today:** the camera water-level pipeline, photo upload, alert logic, the sensor fault filter, OpenStreetMap road routes, the Android app's offline cache and local notifications. **Simulated or sample:** the five cameras and their AI-generated frames, relief centres, flood-prone areas, reports, family members, underpass barriers and the forecast input. **Not built:** government camera feeds, agency verification, a real road barrier. Full table: `docs/ops/DEMO_RUNBOOK.md`.

---

## Architecture

![System architecture](docs/architecture/FloodWay_System_Architecture_1920x1080.png)

| Input | What it answers | Status |
|---|---|---|
| **1. Flood-prone model** (`models/stage5_*`, `RESULTS_5_MODEL_COMPARISON.md`) | *Where* water collects (trained on 2015–2019 floods, tested on held-out 2020–2021 floods: **ROC-AUC 0.836**, 17/17 top-ranked sites were real flood sites) | Trained & served (`/api/v1/retrospective`); reproducible via `README-ML-BENCHMARK.md` |
| **2. Rain warning** | *When* heavy rain is coming | Rule-based forecast formula (`backend/app/services/forecaster.py`) + storm scenario |
| **3. IoT river depth node** (ESP32 + HC-SR04 ultrasonic, LCD, LEDs, buzzer) | *How high* the water is now at one point | Bench prototype (`firmware/floodway_bench_node.ino`) connected live via Web Serial / `scripts/bench_bridge.py` |
| **4. CCTV Live Vision & citizen photos** | *What* is happening across the street / drain | Built & tested on sample ladder frames; AI photo check via `/api/v1/ai/flood-image-check` |

A transparent four-factor fusion rule (`backend/app/services/fusion.py` and `frontend/src/lib/fusion.ts`) combines them: live readings (IoT or CCTV) set the floor, a second agreeing factor at Warning escalates one step, and context factors alone (rain + flood history) cap at Advisory so the system never cries wolf.

## Huawei Cloud Architecture & Stack

- **Interactive Prototype Demo:** [https://floodway.pages.dev/](https://floodway.pages.dev/) (and [https://floodway-huawei.pages.dev/](https://floodway-huawei.pages.dev/))
- **Huawei Cloud ECS Deployment Kit:** [`deploy/ecs/README.md`](deploy/ecs/README.md) (`docker-compose.yml`, `Caddyfile`, `setup.sh`)

| Huawei Cloud Service / Layer | Role in FloodWay | Repository Path / Details |
|---|---|---|
| **Huawei Cloud ModelArts** | Model training benchmark (5 algorithms: LR, RF, LightGBM, CatBoost, XGBoost across 5 ERA5 + Copernicus DEM features) and real-time flood-prone inference | `models/stage5_*`, `README-ML-BENCHMARK.md`, `RESULTS_5_MODEL_COMPARISON.md` |
| **Huawei Cloud OBS (Object Storage)** | Stores historical flood datasets, serialized `.joblib` model artifacts, and camera snapshot frames | `datasets/`, `models/`, `backend/app/vision/sample_media/` |
| **Huawei Cloud ECS (Elastic Cloud Server)** | Hosts the Dockerized FastAPI backend, Live Vision analyser, routing engine, and Caddy automatic-HTTPS web server on Ubuntu 22.04 | `deploy/ecs/` (`docker-compose.yml`, `setup.sh`, `web.Dockerfile`, `Caddyfile`) |
| **Huawei Cloud SMN (Simple Message Notification)** | Multi-channel emergency broadcast (SMS, email, push) alongside Telegram when four-factor fusion reaches `DANGER` | `backend/app/services/`, `backend/app/routes/` |
| **Huawei Cloud CodeArts** | Requirement management, code repository sync, automated test verification (`pytest` + `vitest`), bug tracking, and container deployment | `scripts/check.ps1`, `deploy/ecs/` |
| **Web & Mobile Apps** | React 19, TypeScript, Vite, Tailwind CSS 4, Leaflet + OpenStreetMap; Android app in Expo / React Native | `frontend/`, `mobile/` |

Full system specification: `docs/product/preliminary-round/architecture/SYSTEM_SPECIFICATION.md`. Every algorithm, with its parameters and limits: `docs/architecture/FLOODWAY_OVERVIEW.md`.

## Repository

```
frontend/   React web app (pages, components, lib/ = pure rules shared with mobile)
backend/    FastAPI: vision/ (camera pipeline), routes/, services/ (rule-based forecast, Telegram)
mobile/     Android app (Expo)
models/     ginkgo/ (Model 1 classifiers), ml_pipeline/ (GRU forecaster, synthetic weights), legacy_ann/
firmware/   ESP32 depth node and bench barrier sketches
docs/       architecture/, plans/, ops/, ai/PROGRESS.md (status board)
```

## Quick start

```bash
# web app
cd frontend && npm install && npm run dev        # http://localhost:5173

# backend
cd backend
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements.txt
python run.py                                    # http://localhost:8080, API docs at /docs
```

All checks: `powershell -File scripts/check.ps1`. Copy `backend/.env.example` to `backend/.env` to set the Gemini key, Telegram token and write token. Never put a secret in a `VITE_` variable.

## Honesty rules

The sample cameras are AI-generated sample imagery. The demo forecast is a formula, not a trained model. No accuracy number is shown unless this repo can reproduce it. FloodWay is decision support; official warnings stay with the authorities.
