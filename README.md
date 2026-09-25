# FloodWay 2.0 — AI-Powered Urban Flash Flood & Infrastructure Warning System
### Huawei ICT Competition 2026 · Innovation Track

> **"One glance to know if you are safe. One tap to find shelter."**

FloodWay 2.0 transforms metropolitan urban flood resilience by uniting **Huawei Cloud ModelArts**, **Ascend 910 NPU AI acceleration**, **Huawei PanGu-CV multimodal computer vision**, and **Telegram Bot API** into a zero-hardware, life-safety intelligence platform.

---

## 🏛️ System Architecture: Zero-IoT & Infrastructure-Centric

Unlike legacy rural river alert systems that require thousands of expensive, fragile physical IoT sensor nodes prone to fouling and subterranean signal loss, FloodWay 2.0 is **100% Cloud-Native and Vision-First**. It leverages existing urban infrastructure—municipal traffic surveillance and commercial mall basement CCTVs—processed in real time on Huawei Cloud.

![System Architecture](docs/system_architecture.png)

### 3-Column Processing Workflow

```
[COLUMN 1: DATA INPUTS]               [COLUMN 2: HUAWEI CLOUD AI LAYER]           [COLUMN 3: USER OUTPUTS & INTERFACES]
├── Urban CCTV & Visual Feeds    ──┐  ┌──────────────────────────────────────┐  ──► 3D Digital Twin (/simulation)
├── Citizen Sentinel (Web/Mobile)──┼─►│ 1. Huawei PanGu-CV (Multimodal)      │  ──► Multi-Modal Evacuation Map (/map)
└── Meteorological & Rain APIs   ──┘  │ 2. ModelArts Ascend 910 NPU Engine   │  ──► Citizen Sentinel Hub (/reports)
                                      │ 3. Inundation-Weighted A* Algorithm │  ──► Telegram Emergency Siren & Check-in
                                      └──────────────────────────────────────┘
```

1. **Column 1: Multi-Source Urban Ingestion (Zero-IoT)**
   * **Urban Traffic & Building CCTV:** IP surveillance cameras at mall parking ramps, highway dips, and major stormwater gates.
   * **Citizen Sentinel Mobile Reports:** Geotagged, timestamped flood incident photos submitted by community members.
   * **Meteorological APIs:** MetMalaysia Doppler radar & DID (JPS) urban stormwater runoff rates.
2. **Column 2: Huawei Cloud Enterprise AI Layer**
   * **Huawei PanGu-CV (Multimodal Vision):** Real-time waterline segmentation, physical object depth estimation (tires, curbs), and **image authenticity verification (anti-deepfake & anti-manipulation)**.
   * **ModelArts Ascend 910 NPU Engine:** PyTorch GRU hydrological time-series forecaster predicting forward water levels ($h_{t+60}$) and urban flash accumulation rates.
   * **Inundation-Weighted A\* Algorithm:** Real-time road impedance recalculation dynamically routing vehicles away from submerged corridors.
3. **Column 3: Actionable User Interfaces**
   * **3D Digital Twin (`/simulation`):** Three.js spatial simulation of building and underground parking ingress with critical **110 cm electrical DB breach shut-off**.
   * **Evacuation Map (`/map`):** Turn-by-turn navigation across Drive, Bike, and Walk with geofenced shelter check-in (<50m).
   * **Citizen Sentinel Hub (`/reports`):** Public alerting feed with two-tier validation (AI Vision + Human Authority Desk).
   * **Telegram Emergency Siren (`@floodway_bot`):** Automated urgent warnings and safe arrival check-ins to family groups.

*For complete architectural specifications, see [docs/URBAN_FLASH_FLOOD_ARCHITECTURE.md](docs/URBAN_FLASH_FLOOD_ARCHITECTURE.md).*

---

## 🏙️ High-Impact Urban Flash Flood Scenarios

* **Shopping Mall Underground Basement Carparks (e.g. Mid Valley, Suria KLCC):** Stormwater rushing down entrance ramps can submerge hundreds of cars within 15 minutes. PanGu-CV triggers an urgent *"Move Vehicles to Upper Floors"* Telegram countdown to mall patrons.
* **Sunken Highway Underpasses (e.g. Jalan Tun Razak, NPE):** Prevents vehicle hydrolock and traffic paralysis by dynamically cutting off flooded sunken lanes and routing cars onto elevated flyovers.
* **Critical Electrical Substations & Basements:** Automatically alerts facility teams at the 110 cm threshold to execute electrical shut-off before water causes fatal electrocution or explosion.

---

## 📁 Repository Structure

```
/Huawei
  ├── /frontend         # React 19 + Vite 7 + Tailwind CSS v4 + Three.js UI
  ├── /backend          # Python 3.13 FastAPI services & Huawei ModelArts endpoints
  ├── /models           # Pre-trained models (PyTorch GRU, ModelArts package, ANN legacy)
  ├── /datasets         # Malaysia flood river gauging datasets (CSV)
  ├── /docs             # Technical specs, architecture diagrams & URBAN_FLASH_FLOOD_ARCHITECTURE.md
  ├── /assets           # Shared media, 3D assets (city.glb), river terrain & CCTV photos
  └── MIGRATION_NOTES.md # Detailed migration record & architectural log
```

---

## 🚀 Quick Start Guide

### 1. Run Frontend
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** (or access from your mobile phone via `http://<your-local-ip>:5173`).

### 2. Run Backend
```bash
cd backend
pip install -r requirements.txt
python run.py
```
API endpoints listen on **`http://localhost:8080`** (Swagger docs at `/docs`).

---

## 🛡️ Key Features
1. **Emergency Command Bar:** 4-metric real-time hazard assessment and evacuation countdown.
2. **3D Digital Twin Simulation (`/simulation`):** Dynamic building water ingress simulation with 110 cm electrical DB shut-off alert.
3. **Turn-by-Turn Evacuation Map (`/map`):** Inundation-weighted A* routing avoiding low-lying hazards with automated geofenced arrival check-in.
4. **Community Sentinel Hub (`/reports`):** Crowd-sourced citizen flood alerting powered by **Huawei PanGu-CV & Gemini Flash** with deepfake verification.
5. **Closed-Loop Telegram Bot (`@floodway_bot`):** Automated SOS dispatch and family arrival safety confirmation.
