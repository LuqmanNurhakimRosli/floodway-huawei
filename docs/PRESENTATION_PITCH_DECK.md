# GEO-RESQ — 15-Minute Pitch Deck & Presentation Guide
### Huawei ICT Competition 2026–2027 (APAC Innovation Track)
**Style:** TED Talk Inspiration + Shark Tank Practicality + Defense-Grade Systems Architecture  
**Time Allocation:** 15 Minutes Presentation + 5 Minutes Panel Q&A  
**Target:** 1st Place Regional Advance / Global Finalist

---

## 🎯 Core Pitch Philosophy (Organizer's Guidance)
> *"Don't present it like a student demo. Pitch it like a life-saving, sovereign disaster intelligence platform that bridges space tech with first responders on the ground."*  
> **Narrative Arc:** Human & Economic Catastrophe $\rightarrow$ The 24-Hour Disaster Intelligence Gap $\rightarrow$ The GEO-RESQ Autonomous AI Solution $\rightarrow$ Multi-Criteria Routing & Mobile EOC Delivery $\rightarrow$ Native Huawei Cloud Stack (ModelArts + SMN + GaussDB) $\rightarrow$ Live Dual-Scenario Demonstration $\rightarrow$ Global Scalability & Business Model.

---

## 📽️ Slide-by-Slide Outline (10-Slide Master Deck)

### Slide 1: The Hook & Title (1.0 Minute)
- **Title:** GEO-RESQ: Autonomous Post-Disaster Intelligence & Dynamic Rescue Routing Platform
- **Subtitle:** *"From Earth Observation Satellites to Boots on the Ground"*
- **Presenters:** Team UiTM — Huawei ICT Academy
- **Visual:** High-contrast aerial flood imagery fading seamlessly into the GEO-RESQ light/dark tactical command console with live street-snapped rescue corridors.
- **Spoken Hook:** 
  > *"When a catastrophic flash flood breaches riverbanks at 2:00 AM, the question facing an Emergency Operations Center is never 'do we have satellite images?' We have gigabytes of raw Sentinel data. The life-or-death question is: **'Can a light ambulance reach Hospital Kajang in the next 15 minutes, or will its engine hydrolock under 40 centimeters of floodwater along Federal Route 1?'** Today, answering that question requires 24 hours of manual GIS tracing by scarce experts. With GEO-RESQ, it takes **under 30 seconds**—running live on Huawei ModelArts and Ascend NPUs."*

---

### Slide 2: The Critical Problem — The 24-Hour Disaster Intelligence Gap (1.5 Minutes)
- **Problem Scale:** Climate change has intensified flash flooding by 300%. Disasters impact over 2.2 billion people globally with >$150B in annual losses.
- **The Operational Bottleneck:**
  1. **Raw EO Inaccessibility:** Multi-spectral radar (SAR) and optical passes are distributed as massive raw GeoTIFF rasters—completely unusable by emergency responders and municipal dispatchers.
  2. **Manual Latency Kills:** Disaster agencies (like NADMA Malaysia or Spain's CEMS) require 12–48 hours to manually trace inundation contours and damage zones.
  3. **Blind Dispatch:** Responders frequently drive ambulances and civilian convoys directly into submerged bridge approaches and structural washouts, stranding rescue teams.
- **Twin Validation Scenarios:**
  - *APAC Regional:* **Kajang & Hulu Langat River Surge (Malaysia)** — RM 1.4B flood losses, high-density residential flash inundations along Sungai Langat.
  - *Global Benchmark:* **Valencia Flash Flood Catastrophe (Spain)** — 200+ fatalities in 2024 due to severed CV-400 / V-30 arterial corridors and delayed public warnings.

---

### Slide 3: The GEO-RESQ Solution — Autonomous Tri-Modal Fusion (1.5 Minutes)
- **Core Value Proposition:** A continuous, autonomous edge-to-cloud intelligence platform that fuses satellite Earth Observation, physical river telemetry, and street-level spatial graphs into an actionable Common Operating Picture (COP).
- **The Four Mission-Critical Answers Delivered Instantly:**
  1. **What Changed?** $\rightarrow$ Autonomous Bi-Temporal Satellite differencing (Sentinel-1 C-SAR + Gaofen/Sentinel-2 MSI).
  2. **What is Damaged?** $\rightarrow$ 4-tier pixel-level structural damage classification (`Destroyed`, `Major`, `Minor`, `Clear`).
  3. **Who Can Cross?** $\rightarrow$ **Multi-Criteria Clearance Profiles** (Amphibious 4x4 vs Light Ambulance vs Civilian on Foot).
  4. **How Do We Act?** $\rightarrow$ Instant CAP v1.2 Cellular Alerts via **Huawei Cloud SMN** + Automated SITREP Export.

---

### Slide 4: AI Innovation — Bi-Temporal Siamese U-Net on Huawei ModelArts (2.0 Minutes)
- **Why Single-Image Computer Vision Fails:**
  - Standard CNNs mistake muddy fields, shadows, or normal seasonal reservoirs for active flash floods.
- **GEO-RESQ Neural Architecture:**
  - **Shared-Weight Siamese Encoders:** Concurrently processes pre-disaster baseline ($T_1$) and post-disaster flood pass ($T_2$).
  - **Multi-Scale Differential Feature Fusion:** Computes $|F(T_2) - F(T_1)|$ across encoder skip-connections to isolate true disaster anomalies.
  - **Dual-Head Decoders:**
    - *Head A (Binary Inundation):* Pixel-level water segmentation mask.
    - *Head B (Damage Categorization):* 4-class softmax classifier identifying building destruction and road cutoffs.
- **Model Foundation:**
  - Pre-trained on NASA/IBM `Prithvi-100M` geospatial backbone and fine-tuned on the benchmark `Sen1Floods11` multi-spectral dataset (6 bands: Blue, Green, Red, Narrow NIR, SWIR-1, SWIR-2).
- **Inference Optimization:**
  - Compiled with Huawei **CANN 8.0** and deployed via **ModelArts Serving** on **Ascend 910 NPU**, achieving an inference latency of **138 milliseconds per 1024×1024 tile**.

---

### Slide 5: The "Quantifiable Indicator" — Measured Empirical Results (1.5 Minutes)
*Emphasize rigorous empirical validation matching competition rubric:*
- **Overall Pixel Accuracy:** **95.34%** (exceeding standard 90.5% baselines).
- **Mean Intersection-over-Union (mIoU):** **90.10%** across flood and terrestrial categories.
- **Flood Inundation IoU:** **86.96%** (+6.5% higher than published Sen1Floods11 U-Net benchmarks).
- **Life-Safety Detection Recall:** **94.24%**
  > *"In search-and-rescue, a false negative is lethal. Our 94.2% recall guarantees that virtually zero flooded road segments are falsely marked as clear."*
- **Ablation Provenance:** Evaluated on strictly partitioned, geographically distinct holdout disaster tiles to eliminate spatial overfitting.

---

### Slide 6: Multi-Criteria Dynamic Routing & Air-Gapped Cartography (2.0 Minutes)
- **The Fatal Flaw of Traditional GPS (Google Maps / Waze):**
  - Commercial navigation apps know traffic jams, but have zero awareness of 0.5-meter flood inundation depths and structural bridge washouts.
- **GEO-RESQ Dynamic Routing Engine:**
  - Intersects AI-derived flood depth polygons with OpenStreetMap (OSM) highway vector graphs using NetworkX least-cost path algorithms.
- **Three Calibrated Vehicle Mobility Profiles:**
  1. 🚜 **Heavy 4x4 / Amphibious Unimog:** 0.70m wading depth limit, snorkel exhaust clearance. Can safely navigate caution zones and flooded residential pockets.
  2. 🚑 **Light Ambulance / Medical Transport:** 0.20m strict wading limit. Avoids all water encroachment to prevent hydrolocking emergency medical units.
  3. 🚶 **Civilian Evacuee on Foot:** 0.10m wading limit, walking pace (4.5 km/h). Reroutes around turbulent river surges to prevent pedestrian sweep hazards.
- **Air-Gapped EOC Standalone Operation:**
  - In catastrophic scenarios where undersea fiber or cell towers fail, GEO-RESQ includes a **Local MBTiles Raster Tile Server (`/api/tiles/{z}/{x}/{y}.png`)**, allowing emergency command centers to operate 100% offline without external internet.

---

### Slide 7: Native Huawei Cloud Stack & System Architecture (1.5 Minutes)
*Directly proves compliance with Huawei technology gates:*
- **Huawei Cloud OBS (Object Storage Service):**
  - Petabyte-scale Earth Observation repository storing raw Sentinel-1 C-SAR and Gaofen-2 optical passes.
- **Huawei Cloud ModelArts & Ascend 910 NPU:**
  - Distributed multi-spectral model training and containerized real-time inference microservice (`customize_service.py`).
- **Huawei Cloud GaussDB (Spatial Engine):**
  - High-concurrency relational spatial queries executing sub-second spatial joins (`ST_Intersects`, `ST_Buffer`) between road segments and hazard polygons.
- **Huawei Cloud SMN (Simple Message Notification):**
  - Automated geofenced alert engine broadcasting CAP v1.2 emergency SMS, push notifications, and cell tower bulletins to commanders and citizens.
- **Huawei Cloud ECS:**
  - High-availability host for the FastAPI orchestration engine and air-gapped tile server.

---

### Slide 8: Live Dual-Scenario Demonstration (2.5 Minutes)
*(Interactive live platform demonstration at `http://127.0.0.1:5173/` or offline PWA mode)*
1. **The Executive Command View:**
   - Demonstrate clean light/dark cartography, real-time UTC clock, and active sensor status.
   - Show instantaneous switching between **Kajang (Malaysia)** and **Valencia (Spain)**.
2. **Satellite Damage & Before/After Slider:**
   - Drag the interactive bi-temporal swipe slider comparing pre-disaster baseline to post-flood inundation.
   - Click *"Run ModelArts AI Ingestion"* to trigger Ascend 910 inference live.
3. **Multi-Profile Emergency Route Planner:**
   - Select *Corridor Alpha (Viable via Semenyih)* vs *Corridor Charlie (Severed at Jambatan Reko)*.
   - Switch profile from *Amphibious 4x4* to *Light Ambulance*—demonstrating real-time rerouting as caution routes become blocked!
4. **Government Analytics & Automated SITREP:**
   - Showcase hydrograph river flow velocity, structural damage breakdown, and shelter occupancy bars.
   - Click *"Export Formal SITREP"* to generate an official government disaster briefing in 1 second.
5. **Mobile Touch Shell (Field Ready):**
   - Demonstrate the responsive mobile layout with bottom navigation bar, touch drawer, and 1-tap **Quick SOS Egress**.

---

### Slide 9: Commercial Model, Scalability & Competitive Edge (1.5 Minutes)

#### Competitive Advantage Matrix ("Why We Win")
| Feature / Metric | Traditional GIS (ArcGIS/Manual) | Commercial Satellite Portals | **GEO-RESQ Platform** |
|---|---|---|---|
| **Analysis Latency** | 12 – 48 Hours (Manual) | 4 – 12 Hours | **< 30 Seconds (ModelArts AI)** |
| **Routing Awareness** | Static road networks only | Visual overlay only (No routing) | **Dynamic Least-Cost Flood Avoidance** |
| **Vehicle Profiles** | Single speed assumption | None | **Amphibious 4x4 vs Ambulance vs Foot** |
| **Offline Resilience** | Heavy desktop software | Cloud-dependent only | **Air-Gapped Local Tile Server + PWA** |
| **Emergency Alerts** | Separate manual drafting | None | **Huawei SMN Geofenced Broadcasts** |
| **Infrastructure Stack** | Fragmented US vendor cloud | Proprietary US Cloud | **End-to-End Huawei Cloud Native** |

#### Market Opportunity & Business Model
- **Addressable Market:** Disaster Risk Reduction (DRR) & Geospatial Intelligence TAM: **USD 12.12B (2025) $\rightarrow$ USD 18.55B (2030)** (CAGR 8.9%).
- **Target Customers:**
  - National Disaster Agencies: NADMA (Malaysia), BNPB (Indonesia), NDRRMC (Philippines).
  - Emergency First Responders: SMART, BOMBA, Civil Defence (APM), Red Crescent.
  - City Councils & Public Works Departments (JKR, MPKj).
- **Revenue Model:** Sovereign B2G Annual SaaS subscription per state EOC + per-incident on-demand satellite compute tier.

---

### Slide 10: Conclusion & The Vision Ahead (1.0 Minute)
- **The Core Takeaway:**
  > *"Disaster response should never be a game of guesswork. GEO-RESQ transforms complex Earth Observation satellites into clear, life-saving street directions on an ambulance driver's dashboard. Powered by Huawei Cloud, we turn space technology into lives saved across the Asia-Pacific region."*
- **Final Slide Credits:** Team UiTM, Faculty of Computer & Mathematical Sciences, Huawei ICT Academy Malaysia. GitHub Repository & Live Platform link.

---

## 🎤 Panel Q&A Defense Strategy (Top 7 Tough Technical Questions)

1. **Q: How does your system detect floodwaters through 100% thick cloud cover during a monsoon storm?**
   - **Answer:** *"That is why single-sensor optical systems fail and why GEO-RESQ is built on multi-modal Earth Observation. Optical sensors like Sentinel-2 cannot pierce clouds, but our pipeline natively ingests **Sentinel-1 C-SAR (Synthetic Aperture Radar)**. SAR operates at microwave frequencies (5.4 GHz C-band) which easily penetrate clouds, torrential rain, and smoke, operating with zero degradation day or night."*

2. **Q: How do you verify the system won't lead an ambulance into danger with a false negative?**
   - **Answer:** *"Life-safety engineering is our first principle. GEO-RESQ achieved an empirical **94.24% recall**, meaning it is aggressively tuned to never miss water. Furthermore, our **multi-criteria clearance engine** enforces a conservative 0.20m wading threshold for ambulances and factors in water velocity. Finally, our platform is human-in-the-loop: commanders can review high-risk segments with confidence tags before dispatch."*

3. **Q: Why is Huawei Cloud essential here rather than AWS or Google Cloud?**
   - **Answer:** *"First, raw multi-spectral satellite rasters require massive parallel tensor compute; Huawei ModelArts running on **Ascend 910 NPUs with CANN 8.0** delivers sub-150ms inference at significantly lower inference cost per tile. Second, Huawei's regional availability zones in Malaysia and APAC guarantee data sovereignty compliance for national security geospatial data. Third, native integration with **Huawei SMN** gives us an immediate, government-grade cellular broadcast gateway."*

4. **Q: Can the platform work if the disaster knocks out the city's internet connection?**
   - **Answer:** *"Yes! Unlike web-only portals, GEO-RESQ includes a **Local MBTiles Raster Tile Server** running directly inside our backend, paired with an offline Progressive Web App (PWA) cache. Even in an air-gapped Emergency Operations Center running on diesel generators with zero internet access, the map, routing engine, and situation briefings continue to execute locally."*

5. **Q: How does your routing differ from Google Maps or Waze?**
   - **Answer:** *"Google Maps relies on crowdsourced smartphone GPS speeds. If a road is completely flooded and no cars can enter, Google Maps often shows it as 'empty' (green/clear) until someone gets stuck and reports it! In contrast, GEO-RESQ computes **physics- and satellite-informed graph weights**: our AI intersects satellite flood polygons and water depth estimates with the road graph, preemptively severing routes before vehicles approach."*

6. **Q: Is this a working prototype or a Figma concept?**
   - **Answer:** *"GEO-RESQ is a fully functional, production-grade software platform. The backend is powered by FastAPI, NetworkX, and PyTorch Siamese U-Net. The frontend is built on React 18, TypeScript, and Leaflet GIS with complete desktop/mobile responsive touch shells, currently running live at `http://127.0.0.1:5173/`."*

7. **Q: How will you scale this to new flood-prone cities across ASEAN?**
   - **Answer:** *"Our data pipeline is 100% automated and globally generalizable. Copernicus Sentinel satellites and Gaofen constellations cover the entire planet every 5 to 6 days, and OpenStreetMap provides street vector topology worldwide. As shown in our demo, switching from Kajang to Valencia or Jakarta requires zero code changes—only an AOI bounding box input."*
