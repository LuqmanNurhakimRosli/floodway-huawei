# GEO-RESQ: Autonomous Post-Disaster Intelligence Platform

> Transforming fragmented Earth observation and geospatial data into actionable post-disaster intelligence for rapid damage assessment, infrastructure triage, and emergency rescue routing.

---

## 🛰️ Project Overview

**GEO-RESQ** is a local-first, emergency-operations-centre (EOC) style geospatial decision-support platform designed to answer four critical questions in the immediate aftermath of a catastrophe:

1. **What changed?** Bi-temporal satellite Earth observation (Sentinel-1 SAR / Sentinel-2 Multispectral).
2. **What was affected?** Automated damage classification across buildings, bridges, and flood inundation zones.
3. **Can responders get there?** Spatial intersection with OpenStreetMap road graphs to identify blocked corridors and calculate candidate rescue routes.
4. **What should command see first?** A unified tactical operations dashboard providing prioritized, uncertainty-aware intelligence.

---

## 📁 Repository Structure

```text
geo-resq/
├── GEO-RESQ_IMPLEMENTATION_PLAN.md   # Master Technical Specification
├── README.md                          # Project documentation
│
├── frontend/                          # React + Vite + TypeScript + Tailwind CSS dashboard
│   ├── src/
│   │   ├── components/                # Layout, map, tactical panels, and controls
│   │   ├── data/                      # Local scenario data & GeoJSON layers (demo-tagged)
│   │   ├── types/                     # TypeScript data contracts & GIS types
│   │   ├── App.tsx                    # Main EOC interface
│   │   └── main.tsx
│   └── package.json
│
├── backend/                           # Python FastAPI service (Phase 2+)
├── data/                              # Local geospatial data pipeline (raw / interim / processed)
├── models/                            # PyTorch Siamese U-Net & AI checkpoints (Phase 4+)
├── notebooks/                         # Exploratory data analysis & model benchmarking
├── scripts/                           # Utility scripts & automated GIS tools
├── docs/                              # Architecture and design documentation
└── docker/                            # Containerization configs (Huawei Cloud portable)
```

---

## 🚀 Quick Start (Phase 1: Local Dashboard Shell)

### Prerequisites
- Node.js (v18+ or v22+)
- npm (v10+)

### Running the Dashboard
```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Open your browser at `http://localhost:5173` to access the command dashboard.

---

## 🎯 Implementation Roadmap

- [x] **Phase 1: Local Dashboard Shell** (Interactive map, layer manager, incident triage, route assessment, EOC styling)
- [x] **Phase 2: Real Geospatial Data** (OSM road networks, building footprints, Kajang & Valencia flood shapefiles)
- [x] **Phase 3: Sentinel-1 / Sentinel-2 Preprocessing Pipeline** (Synthetic Aperture Radar + Multi-Spectral optical)
- [x] **Phase 4: AI Bi-Temporal Change Detection** (Siamese U-Net on Huawei ModelArts & Ascend 910 NPUs)
- [x] **Phase 5: Structured Damage Intelligence & Infrastructure Intersection** (Damage severity triage & critical facilities)
- [x] **Phase 6: Multi-Criteria Rescue Route Optimization** (Amphibious Unimog vs Ambulance vs Evacuee wading clearances)
- [x] **Phase 7: Huawei Cloud Integration & Resilient EOC Cockpit** (ModelArts, SMN CAP v1.2 alerts, Executive & Analytics views)

---

## ⚡ Cloudflare Pages Deployment

The frontend is fully standalone-resilient with graceful edge fallbacks:

1. **Framework Preset**: `Vite`
2. **Build Command**: `npm run build`
3. **Build Output Directory**: `dist`
4. **Root Directory**: `frontend` (if deploying from monorepo) or repository root
5. **SPA Routing**: `frontend/public/_redirects` is pre-configured to ensure seamless client-side navigation.

---

## 📊 Academic Defense & Competitive Analysis
For a comprehensive scientific comparison between **GEO-RESQ** and consumer flood solutions (such as FloodWay), see:
👉 [**GEO-RESQ vs. FloodWay Comparative Analysis**](docs/FLOODWAY_VS_GEO_RESQ.md)

---

## 🛡️ Responsible AI & Decision Support Notice

GEO-RESQ is designed strictly as a **decision-support tool**. It empowers national emergency agencies (NADMA, APM, SMART) with satellite intelligence and tactical logistics triage. All synthetic disaster scenarios are calibrated to real historical events for rigorous evaluation.

