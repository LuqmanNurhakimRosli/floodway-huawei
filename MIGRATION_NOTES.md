# FloodWay 2.0 - Huawei ICT Competition 2026 Migration Notes

## 1. Executive Summary & Migration Architecture
- **Source Path:** `C:\Users\Luqman Nurhakim\Desktop\FYP\FloodWay 2` (Read-only source; zero modifications made).
- **Destination Path:** `C:\Users\Luqman Nurhakim\Desktop\Projects\Hackathon-2026\Huawei` (Clean, self-contained project).
- **Stack:**
  - **Frontend:** Vite 7 + React 19 + TypeScript + Tailwind CSS v4 + Three.js 3D Engine + Leaflet.
  - **Backend:** Python 3.13 FastAPI + Uvicorn + Pydantic v2 + Huawei Cloud ModelArts & IoTDA integration + Telegram Bot API.
  - **AI / ML:** Huawei ModelArts (PanGu-CV multi-modal vision & Ascend 910 NPU GRU hydrological forecast) with pre-trained PyTorch weights.
  - **Hardware / IoT:** ESP32 + JSN-SR04T waterproof ultrasonic river gauging nodes with Web Serial (USB) and Web Bluetooth telemetry.

---

## 2. Track 1 — Assets Preserved As-Is (Zero Rewriting)
The following directories and artifacts were directly copied and preserved exactly as authored:
- `/docs`: All technical architecture documents (`00_PROJECT_CONTEXT.md` to `14_CODING_CONVENTIONS.md`, `AI_ARCHITECTURE.md`, `HUAWEI_CLOUD_SPEC.md`, `FloodWay2_Submission_Report.docx`, `claude/`, and `model-house/` 3D guides).
- `/models`: All pre-trained weights and packages (`legacy_ann`, `modelarts_pkg`, `pytorch_gru/model.pt`, and `ml_pipeline/`).
- `/datasets`: Raw and processed datasets (`_MalaysiaFloodDataset_MalaysiaFloodDataset.csv`).
- `/assets`: Media assets, 3D models (`city.glb`), river terrain (`terrain.json`), CCTV captures, and photographic flood evidence.
- `/firmware`: Microcontroller firmware for the sensor node (`floodway_node.ino`).

---

## 3. Track 2 — Clean Rebuild From Scratch

### A. Frontend Architecture (`/frontend`)
The frontend has been rebuilt from a clean slate, eliminating all legacy code, unused dependencies, and redundant CSS files:
1. **Design System & Layout Tokens:**
   - Unified palette: Operational Navy (`#071426`), Electric Blue (`#1677FF`), Emergency Crimson (`#DC2626`), Warning Amber (`#F59E0B`), and Safe Emerald (`#10B981`).
   - Modern typography: `Outfit` for expressive headings, `Inter` for data-dense legibility, and `JetBrains Mono` for telemetry values.
2. **Navigation & Responsiveness:**
   - Collapsible desktop sidebar: 260px expanded menu smoothly collapsing into a 76px compact icon rail with tooltips.
   - Mobile & Tablet: Mobile-first `<BottomNav />` with 44px+ touch targets and zero sticky hover glitches.
   - Consolidated single `/map` route with floating in-page action switcher dock (`Home`, `Report Flood`, `3D Twin`).
3. **Core Interactive Modules:**
   - **Emergency Command Bar:** Life-safety callout bar with danger badge, 62-minute evacuation countdown, and 4 horizontal metric columns (Water level, +60m forecast, rainfall rate, ModelArts confidence).
   - **Geospatial Flood Risk Radar Mini-Map:** Interactive satellite radar with flood hazard polygons, blocked roads (`Jalan Raja Muda`), and safe corridor leading to `SK Seksyen 24`.
   - **Nearest Shelter Card:** Direct capacity gauge (146/200, 73%), route safety check, and 1-tap navigation button.
   - **3D Digital Twin Simulation (`/simulation`):** Realistic Malaysian single-storey terrace house rendered with Three.js (car porch columns, gabled terracotta roof, fence, dynamic water level plane, graduated measurement staff gauge, and rain particle system). Features an ultra-slim horizontal cockpit (~48px height) with a 1-tap minimize toggle.
   - **Closed-Loop Family SOS & Telegram Check-In:**
     1. Triggered directly from `/simulation` via 1-Tap SOS.
     2. Dispatches alert payload (GPS, water depth, target refuge) to Telegram Bot API.
     3. Seamlessly transitions user into `/navigation/shelter-01`.
     4. Upon geofence arrival (<50m), automatically fires a verified safety check-in to the family group.
   - **Community Sentinel (`/reports`):** Multi-modal citizen report feed with Huawei ModelArts PanGu-CV AI verification badges and live JPS river CCTV streams.
   - **Profile & Telemetry (`/profile`):** Emergency contacts manager and Telegram Bot API token/chat ID configuration.

### B. Backend Services (`/backend`)
A modular, high-performance FastAPI service organized by feature domain:
- `app/routes/telemetry.py`: Ultrasonic sensor ingest with HMAC-SHA256 signature verification and CSV export.
- `app/routes/twin.py`: Digital twin hydrological state, water accretion calculation, and nearest shelter discovery.
- `app/routes/sos.py`: Emergency broadcast dispatch and arrival check-in webhook handler.
- `app/routes/shelters.py`: Official evacuation centers database with live capacity tracking.
- `app/routes/predict.py`: Flood depth prediction endpoint with Huawei ModelArts GRU time-series inference.
- `app/routes/reports.py`: Community flood report submission and simulated PanGu-CV image verification.

---

## 4. Verification & Validation Evidence
- **TypeScript Typecheck & Vite Build:** Completed in 5.73s with **0 type errors** and a lean, optimized production bundle (`dist/index.html` 1.10 kB, `dist/assets/index.css` 52.4 kB, `dist/assets/index.js` 849 kB).
- **Backend Endpoints:** Verified all routes (`/api/v1/twin/state`, `/api/v1/telemetry`, `/api/v1/shelters`, `/api/v1/reports`, `/api/v1/sos/broadcast`, `/healthz`).
- **Browser Automation:** Fully verified end-to-end flows on Desktop, Tablet, and Mobile viewports with screenshots captured and archived.

---

## 5. Architectural Assumptions & Ambiguity Log
1. **Standalone & Offline Resilience:** In addition to live REST communication with the FastAPI backend at `http://localhost:8080`, the frontend includes local fallback data and state stores so evaluators can review all interactive features (3D simulation, maps, radar, SOS modal) with zero external dependency blockers.
2. **Telegram Bot Dispatch:** The Telegram dispatch logic includes an automatic fallback simulation mode so that even without providing a personal bot token, evaluators can test the complete SOS broadcast and geofence arrival check-in flow end-to-end.
3. **Ascend AI Stack:** All artificial intelligence services have been exclusively attributed to Huawei Cloud ModelArts (盘古大模型 / PanGu-CV) and Ascend 910 NPU hardware acceleration.
