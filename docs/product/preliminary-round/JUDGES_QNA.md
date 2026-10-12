# FloodWay: Judges Q&A Master Preparation Guide

Prepared for team **RESQ4ACE** (Luqman, Nadi, Tisya) for the **Huawei ICT Competition 2026–2027 (Innovation Track - APAC Preliminary Round)**.

This guide arms the team with authoritative, clear, and technically grounded answers across four critical judging dimensions:
1. **Technical & Computer Vision Architecture**
2. **Huawei Cloud & AI Infrastructure**
3. **Business Model, Market Viability & Gov Integration**
4. **Data Credibility, Ethics, & Validation Metrics**

---

## 1. Technical & Computer Vision Architecture

### Q1.1: Where do the 95.34% accuracy and 86.96% IoU figures on your poster come from?
> **Answer:**
> "Those benchmarks are measured on the ground-truth **Sen1Floods11 validation split** for floodwater semantic segmentation. 
> 
> In our operational frontend and backend demo, our Live Vision pipeline calculates water stage as a percentage of bank height using contour edge detection and rolling frame medians to filter visual noise. We cite the Sen1Floods11 benchmark specifically for the neural segmentation capability that feeds into our ModelArts pipeline."

### Q1.2: How does Live Vision measure water level without a physical metric gauge installed in the water?
> **Answer:**
> "Rather than requiring expensive metric measuring staff rods in the riverbed, we calibrate two visual reference landmarks per camera when registered:
> 1. The **dry channel floor / invert level** (0% capacity).
> 2. The **crest of the bank / flood wall** (100% capacity / Danger line).
> 
> The computer vision pipeline calculates the waterline height as a ratio of the bank height. For city-wide scalability on Huawei Cloud, we plan to leverage PanGu-CV zero-shot keypoint estimation to automatically detect channel edges without manual landmark pinning."

### Q1.3: How does your system deal with torrential rain, water ripples, floating rubbish, and night headlights?
> **Answer:**
> "We tackle this with a two-tier resilience strategy:
> 1. **Frame-level temporal smoothing:** Instead of trusting a single frame, the vision engine calculates a **rolling median across 5 consecutive frames** captured at 8-second intervals. Transient headlight glare, surface ripples, or flying rain streaks are statistically rejected.
> 2. **State machine hysteresis:** An emergency alert triggers immediately when water breaches danger thresholds. However, to clear or demote an alert, the system requires **3 consecutive safe cycles**, preventing alert fluttering and user fatigue."

### Q1.4: How does your routing algorithm actually guarantee flood avoidance?
> **Answer:**
> "Mainstream navigation apps (like Google Maps or Waze) optimize primarily for travel time and traffic volume—they are completely blind to standing water depth.
> 
> FloodWay maintains a dynamic weighted graph of the road network. Each road edge receives a dynamic penalty based on reported water depth mapped against the driver's vehicle ground clearance (e.g. 0.15m for a sedan, 0.50m for an SUV, up to 0.70m for emergency response trucks). If water exceeds clearance, the road is treated as blocked. In 100 simulated Klang Valley scenarios, FloodWay achieved **100% hazard avoidance** with an average detour time of just **+4.2 minutes** and recalculation latency under **120ms**."

---

## 2. Huawei Cloud & AI Infrastructure

### Q2.1: Exactly how does FloodWay utilize Huawei Cloud technologies?
> **Answer:**
> "FloodWay was architected specifically around four key Huawei Cloud services:
> - **ModelArts:** Distributed model training and real-time inference endpoints for flood stage prediction and water segmentation.
> - **OBS (Object Storage Service):** Ingests and archives high-frequency CCTV camera snapshots, citizen photo reports, and map tiles.
> - **ECS (Elastic Cloud Server):** Hosts the high-performance routing graph engine and FastAPI backend.
> - **SMN (Simple Message Notification):** Multi-channel real-time alerting engine broadcasting critical SMS, mobile push, and email alerts to residents within active hazard geofences."

### Q2.2: Is the live prototype running on Huawei Cloud right now?
> **Answer:**
> "For this preliminary evaluation, our client is hosted on an edge CDN connected to our local verified API runtime to guarantee zero downtime during judging. 
> 
> However, our deployment architecture, ModelArts container packages, and cloud API contracts are already structured in our repository. Migrating our model endpoints and storage to Huawei Cloud ModelArts and OBS is our primary milestone for the Semi-Final round."

### Q2.3: Why choose Ascend AI processors over generic GPUs for this workload?
> **Answer:**
> "City-wide flood monitoring requires continuous inference across hundreds of concurrent CCTV video streams simultaneously. Huawei Ascend chips (such as the Ascend 310 for edge inference and Ascend 910 for ModelArts training) deliver superior DaVinci architecture efficiency with high INT8/FP16 throughput per watt, drastically reducing the cloud compute cost per camera feed."

---

## 3. Business Model, Commercial Viability & Public Sector Fit

### Q3.1: If the citizen application is free, who pays for FloodWay?
> **Answer:**
> "FloodWay operates a sustainable **B2G (Business-to-Government) and B2B SaaS model**:
> 1. **Municipal Councils (DBKL, MBPJ, MBIP):** Pay an annual subscription for the City Hazard Operations Command Dashboard, heatmaps, and drainage choke-point telemetry—saving millions compared to RM150,000 per physical river station.
> 2. **Logistics & Ride-Hailing Fleets (Grab, Shopee Express, Lalamove):** Enterprise Dynamic Routing API licenses that route delivery fleets around flooded roads, saving millions in engine write-offs and cargo loss.
> 3. **Motor & Property Insurers:** Subscribed access to verified flood depth footprints for automated claims verification and proactive policyholder risk warnings."

### Q3.2: Does FloodWay compete with government agencies like JPS, JKM, or JKR?
> **Answer:**
> "No, **we connect them—we do not replace them.**
> - **JPS (Jabatan Pengairan dan Saliran):** Provides macro-level river telemetry; FloodWay bridges the 'last mile' into roadside drains, culverts, and basement ramps.
> - **JKR (Jabatan Kerja Raya):** FloodWay provides depth-aware road closure data to their road management systems.
> - **JKM (Jabatan Kebajikan Masyarakat):** FloodWay integrates live evacuation shelter occupancy so citizens are routed to shelters with available beds rather than arriving at overcrowded centers."

### Q3.3: What is the cost comparison between FloodWay and traditional flood sensors?
> **Answer:**
> "A single telemetry river station equipped with ultrasonic or radar water-level sensors and solar telemetry typically costs around **RM150,000** upfront, plus recurrent calibration and maintenance. 
> 
> FloodWay leverages optical cameras that the city, private building owners, and highway concessionaires have already installed. Our incremental hardware cost is **RM0**, converting capital expenditure into an affordable software service."

---

## 4. Data Credibility, Ethics, & Validation Metrics

### Q4.1: Are the camera feeds shown in your live demo actual government CCTV streams?
> **Answer:**
> "No. To maintain complete integrity, our sample feeds are **AI-generated photorealistic sample environments** simulating key Klang Valley flash points (such as Sungai Klang, Sungai Gombak, and SMART Tunnel intake). 
> 
> They are transparently labeled as **SAMPLE / PLAYBACK** in the user interface. Real-world deployment will onboard municipal CCTV feeds through formal data-sharing memorandums."

### Q4.2: What prevents users from uploading fake, outdated, or prank flood photos to cause panic?
> **Answer:**
> "Citizen submissions undergo a multi-layered verification chain:
> 1. **Metadata & Geofence Checks:** The system checks EXIF timestamps and validates user coordinates against real-time rainfall radar data.
> 2. **Computer Vision Verification:** Citizen images pass through a water-presence detection model to verify genuine flooding.
> 3. **Trust Status Hierarchy:** Citizen submissions remain marked as 'Community' until verified by multiple corroborating nearby reports or confirmed by an authoritative camera feed or human operator. Unverified reports never trigger city-wide red alerts."

### Q4.3: What is your team's roadmap if you advance to the Semi-Finals?
> **Answer:**
> "Our three core milestones are:
> 1. **Live Cloud Migration:** Deploy the end-to-end inference and storage pipeline directly onto **Huawei Cloud ModelArts and OBS**.
> 2. **Partner Camera Pilot:** Connect 2 to 3 real-world test camera feeds along drainage choke points in Selangor/KL under official academic research collaboration.
> 3. **Model Refinement:** Retrain our hydrological runoff forecast models with historical rainfall and gauge telemetry from Malaysian monsoon events."

---

## 💡 Quick Tips for the Presentation

- **Stay Calm & Direct:** When a judge asks a tough question, pause, acknowledge the question directly, and lead with the concrete principle before explaining the technical detail.
- **Support Your Team Member:** If Nadi is answering and needs a technical detail, Luqman or Tisya can step in smoothly with: *"To add to what Nadi mentioned..."*
- **Keep Answers Under 45 Seconds:** Judges often have 2 to 3 questions. Concise answers leave room for more engagement and a higher score.
