# FloodWay 2.0 — AI-Powered Flood Preparedness & Evacuation System
### Huawei ICT Competition 2026 · Innovation Track

> **"One glance to know if you are safe. One tap to find shelter."**

FloodWay 2.0 transforms community flood resilience by uniting **Huawei Cloud ModelArts**, **Ascend 910 NPU AI acceleration**, **Huawei IoTDA**, and **Telegram Bot API** into a life-safety intelligence platform.

---

## 📁 Repository Structure

```
/Huawei
  ├── /frontend         # Clean React 19 + Vite 7 + Tailwind CSS v4 + Three.js UI
  ├── /backend          # Clean Python 3.13 FastAPI services & Huawei ModelArts endpoints
  ├── /models           # Pre-trained models (PyTorch GRU, ModelArts package, ANN legacy)
  ├── /datasets         # Malaysia flood river gauging datasets (CSV)
  ├── /docs             # Specs, reports, architecture diagrams & submission docs
  ├── /assets           # Shared media, 3D assets (city.glb), river terrain & CCTV photos
  ├── /firmware         # ESP32 + JSN-SR04T waterproof ultrasonic sensor node code
  └── MIGRATION_NOTES.md # Detailed migration record & architectural log
```

---

## 🚀 Quick Start Guide

### 1. Run Rebuilt Frontend
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 2. Run Rebuilt Backend
```bash
cd backend
pip install -r requirements.txt
python run.py
```
API endpoints will listen on **`http://localhost:8080`** (Swagger docs at `/docs`).

---

## 🛡 Key Features
1. **Emergency Command Bar:** Clear 4-metric hazard assessment and 62-minute evacuation countdown.
2. **Geospatial Flood Risk Radar Mini-Map:** Real-time satellite radar with active flood hazard zones and safe evacuation corridors.
3. **Nearest Shelter Navigator:** Occupancy tracking and 1-tap route initiation to `SK Seksyen 24`.
4. **3D Digital Twin Simulation:** Interactive Three.js Malaysian terrace house model with dynamic water accretion, flood staff gauge, and ultra-slim horizontal control cockpit.
5. **Closed-Loop Family SOS & Telegram Check-In:**
   - Broadcasts emergency SOS alert with live GPS and water depth to Telegram.
   - Automatically detects geofence arrival at shelter (<50m) and fires a verified check-in to family contacts.
6. **Community Sentinel:** Citizen flood incident reporting powered by **Huawei ModelArts PanGu-CV** multi-modal verification.
