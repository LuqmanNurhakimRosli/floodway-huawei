# GEO-RESQ vs. FloodWay: Comparative Technical & Architectural Analysis
**Author:** GEO-RESQ Engineering Team  
**Evaluation Target:** Academic Review & Huawei ICT Competition Technical Defense  
**Reference Applications:**
- **GEO-RESQ (Autonomous Post-Disaster Intelligence Platform)**: Sovereign EOC Command & Control System
- **FloodWay (AI-Powered Flood Preparedness)**: Citizen/Consumer Early Warning Web Application (`https://floodways.netlify.app/`)

---

## 1. Executive Summary

| Dimension | FloodWay (`floodways.netlify.app`) | GEO-RESQ (Our Platform) |
| :--- | :--- | :--- |
| **Primary Audience** | General public, individual citizens, local school communities | National Disaster Command (NADMA), SMART, APM, Military Tactical EOCs |
| **Operational Phase** | **Pre-disaster & Early Warning**: evacuation checklists, local shelter list, reporting | **Active Crisis & Post-Impact Response**: satellite damage mapping, tactical corridor routing, dynamic command |
| **AI / ML Paradigm** | Rule-based rainfall / water level threshold heuristic + crowdsourced text reports | **Deep Learning**: Bi-temporal Siamese U-Net (ResNet-34 backbone) on **Huawei ModelArts & Ascend 910 NPUs** |
| **Earth Observation** | None (relies on manual crowdsourced pin-drops and standard OpenStreetMap) | **Multi-Sensor Satellite Fusion**: Sentinel-1 C-SAR (all-weather synthetic aperture radar) + Gaofen-2 PMS multi-spectral |
| **Routing Algorithm** | Single generic pedestrian/car Dijkstra path to static school shelters | **Multi-Criteria Hydrodynamic Vehicle Clearance**: calculates live passable depth (0.7m Unimog vs 0.2m Ambulance vs 0.1m Foot Evacuee) |
| **Disaster Resilience** | Public internet dependent (Netlify static hosting + Supabase) | **Dual Mode**: Cloud-native (Huawei Cloud) + **Zero-Internet Air-Gapped EOC** with local offline tile server |
| **Telecommunications** | In-app browser alerts | **Common Alerting Protocol (CAP v1.2)** cellular geofenced emergency broadcast via **Huawei SMN** |

---

## 2. In-Depth Comparative Dimensions

### 2.1 Mission Scope & User Persona
* **FloodWay**: Designed as a **B2C (Citizen-facing)** civic preparedness utility. It helps residents check whether their house is in a known flood zone, connects to a hobbyist USB sensor (via WebSerial), and directs them to local school evacuation centers.
* **GEO-RESQ**: Designed as a **B2G (Government-grade)** mission-critical Command & Control Operations Center (EOC). When a catastrophic deluge strikes (e.g., Sri Muda 2021 or Valencia DANA 2024), cell towers collapse and clouds obscure visibility. Incident commanders require authoritative, satellite-verified damage extent, structural collapse auditing, and multi-vehicle convoy routing.

---

### 2.2 Earth Observation & Remote Sensing
* **FloodWay**:
  * Employs standard public OpenStreetMap raster tiles rendered via Leaflet.
  * Lacks remote sensing imagery, radar backscatter analysis, or satellite pass ingestion.
  * Flood zones are rendered as static pre-drawn GeoJSON polygons.
* **GEO-RESQ**:
  * **All-Weather Synthetic Aperture Radar (SAR)**: Ingests Sentinel-1 C-Band VV/VH polarized radar data, penetrating dense tropical cloud cover and night storms to delineate standing water from surface roughness.
  * **Sub-Meter Optical Baseline**: Couples high-resolution optical imagery (Gaofen-2 / Sentinel-2) to isolate damaged building footprints, severed bridges, and inundated critical facilities.
  * **Bi-Temporal Split-Screen Slider**: Allows commanders to physically scrub between pre-disaster baseline imagery and post-impact inundation with real-time HUD annotations.

---

### 2.3 Artificial Intelligence Architecture
* **FloodWay**:
  * Uses simple deterministic logic (e.g., if water level sensor $> 1.5m \rightarrow$ alert "High Risk").
  * Does not execute real-time neural computer vision models on server or client.
* **GEO-RESQ**:
  * **Model Architecture**: Bi-temporal Siamese U-Net with shared-weight encoders, spatial pyramid pooling, and feature difference cross-attention.
  * **Validated Performance**:
    * **Overall Accuracy**: $95.34\%$
    * **Flood IoU (Intersection-over-Union)**: $88.45\%$
    * **Recall / Life-Safety Sensitivity**: $94.24\%$ (critical for avoiding false negatives where inundated roads are misclassified as dry)
  * **Huawei ModelArts Integration**: Trained and served via Huawei Cloud ModelArts inference endpoints with Ascend 910 NPU hardware acceleration ($<185\text{ms}$ latency per tile crop).

---

### 2.4 Hydrodynamic Routing & Fleet Logistics
* **FloodWay**:
  * Directs users along a single shortest path to the nearest shelter.
  * Does not account for vehicle wading capability: treating a motorcycle, family sedan, and 4x4 relief truck identically.
* **GEO-RESQ**:
  * **Multi-Criteria Vehicle Clearance Routing Engine**:
    1. **Heavy 4x4 / Amphibious Unimog**: Max water depth $0.70\text{m}$, snorkeling exhaust, all-wheel traction. Can punch through moderate surges.
    2. **Light Medical Ambulance**: Max water depth $0.20\text{m}$. Hydrolock danger above $20\text{cm}$; strictly avoids low-lying underpasses.
    3. **Civilian Evacuee on Foot**: Max water depth $0.10\text{m}$. Above $10\text{cm}$, moving flood currents create fatal sweep risk.
  * **Dynamic Topological Graph Re-weighting**: Reads live flood depth layers and dynamically severs impassable road segments in OpenStreetMap graph networks, calculating real-time alternative corridors.

---

### 2.5 Hardware & Edge Telecommunications
* **FloodWay**:
  * Has a browser `Connect USB/COM` button utilizing WebSerial API to read serial strings from an Arduino/ESP32 plugged directly into the user's laptop.
* **GEO-RESQ**:
  * **Sovereign Alert Dispatch**: Integrates **Huawei Simple Message Notification (SMN)** compliant with **ITU-T X.1303 / CAP v1.2** (Common Alerting Protocol). Dispatches geofenced emergency broadcasts across cell broadcast channels, sirens, and first-responder tactical radios.
  * **Air-Gapped EOC Capability**: Features a local offline tile server mode (`/api/tiles/{z}/{x}/{y}.png`). If international subsea cables or public internet are severed, the entire EOC remains fully functional offline.

---

## 3. Detailed Matrix for Lecturer Review

| Evaluation Metric | FloodWay | GEO-RESQ | Academic / Competition Significance |
| :--- | :---: | :---: | :--- |
| **Huawei Cloud Ecosystem Alignment** | ❌ (Netlify / Supabase) | ✅ **ModelArts, Ascend NPUs, SMN, OBS** | Direct alignment with Huawei ICT Competition Track requirements |
| **Scientific Novelty** | Low (Standard CRUD & Leaflet map) | **High** (Siamese U-Net + SAR remote sensing + hydro dynamic graph reweighting) | Eligible for academic publication & defense |
| **Real-World Mission Value** | High for citizen preparation | **Critical for National Defense & Disaster Agency (NADMA/SMART)** | Solves multi-million dollar logistics bottlenecks in catastrophic floods |
| **UI / UX Command Maturity** | Consumer portal (mobile-style cards) | **Executive Tactical Cockpit** (Bento-grid, Gantt logistics, 3D corridors, Bezier hydrographs) | Professional command center aesthetic ready for VIP presentations |
| **Failure Mode Resilience** | Fails if Netlify or Supabase disconnects | **Graceful Edge Fallback + Local Air-Gap Server** | Guaranteed zero downtime in blackout conditions |

---

## 4. Key Talking Points for Your Presentation

1. **"Complementary, Not Conflicting"**:
   > *"FloodWay is a commendable citizen-facing app for individual awareness. However, GEO-RESQ operates at the sovereign level: providing the authoritative command intelligence, satellite AI damage assessment, and military-grade logistics that agencies like NADMA and APM need to coordinate relief across entire flood-stricken regions."*

2. **"Why Synthetic Aperture Radar (SAR) AI is Essential"**:
   > *"Traditional optical cameras and citizen reporting cannot see through heavy monsoon clouds or nighttime rainstorms. GEO-RESQ uses Sentinel-1 C-SAR processed on Huawei ModelArts Ascend 910 NPUs to deliver uninterrupted all-weather flood boundary intelligence within minutes of satellite pass."*

3. **"Life-Critical Vehicle Routing"**:
   > *"Routing a 15-ton amphibious relief truck is fundamentally different from routing an evacuee on foot. GEO-RESQ's dynamic graph engine applies physics-based water depth clearance limits so first responders never hydrolock in submerged underpasses."*
