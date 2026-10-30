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
> "FloodWay is architected around five core Huawei Cloud services across our data, AI, compute, alerting, and DevOps pipeline:
> - **ModelArts:** Used for training and serving our Stage 5 flood-prone models (comparing 5 algorithms across 5 hydrological and terrain inputs, achieving ROC-AUC 0.836 on held-out 2020–2021 floods) as well as real-time floodwater segmentation endpoints.
> - **OBS (Object Storage Service):** Stores our historical flood datasets (`datasets/`), serialized `.joblib` model artifacts, and high-frequency CCTV camera snapshots and citizen flood photos.
> - **ECS (Elastic Cloud Server):** Runs our Dockerized FastAPI backend, Live Vision waterline analyser, 4-factor fusion engine, and Caddy reverse-proxy web server (`deploy/ecs/docker-compose.yml`).
> - **SMN (Simple Message Notification):** Multi-channel emergency broadcast engine publishing critical SMS, email, and push alerts to residents when our 4-factor fusion crosses into DANGER.
> - **CodeArts:** Supports requirement management, repository synchronization, automated test verification (`pytest` + `vitest`), bug tracking, and containerized deployment to ECS."

### Q2.2: Walk us through the technical details of how each Huawei Cloud service integrates into your code.
> **Answer (if a Huawei engineer asks for deep technical specifics):**
> - **ModelArts:** "Our Stage 5 training pipeline takes 5 features—1-day, 3-day, and 7-day antecedent rainfall from ERA5 plus elevation and slope from Copernicus DEM—and benchmarks Logistic Regression, Random Forest, LightGBM, CatBoost, and XGBoost on a strict temporal split (train 2015–2019, test 2020–2021). The trained `.joblib` artifacts are packaged with a custom inference handler for ModelArts real-time serving (`/api/v1/retrospective`)."
> - **ECS:** "We packaged the entire stack in `deploy/ecs/` using a multi-container `docker-compose.yml` on Ubuntu 22.04 (2 vCPU, 4 GiB RAM, Auto-EIP). Container 1 runs our FastAPI backend (`python:3.12-slim` + Uvicorn) with `/models` mounted read-only; Container 2 runs `caddy:2-alpine` serving the compiled React 19 SPA and reverse-proxying `/api` and WebSocket streams with automated TLS."
> - **OBS:** "Camera ladder frames, citizen-uploaded flood photos, and our 500-site benchmark cohorts are organized into structured buckets (`s3/obs://floodway-assets/{models,datasets,cameras}`) so ECS instances remain stateless."
> - **SMN:** "When `services/fusion.py` escalates a site to `DANGER` (live sensor or camera reading confirmed by rain warning or flood history), the alert publisher triggers an SMN Topic URN alongside our Telegram bot to push immediate evacuation notices and shelter routes."

### Q2.3: How is the live demo hosted today, and what is your deployment plan for the National Finals?
> **Answer:**
> "For today's Semi-Final presentation, our interactive frontend prototype is accessible instantly via our QR link (`https://floodway.pages.dev/`) paired with our physical ESP32 river node on stage so judges can test the full interaction flow with zero latency.
> 
> Our complete Huawei Cloud ECS Docker Compose deployment kit (`deploy/ecs/setup.sh`) and ModelArts model packages are already built and committed in our GitHub repository. As soon as finalist Huawei Cloud accounts and credits are provisioned for the National Finals, we run `setup.sh` to bring the live production stack onto Huawei Cloud ECS, OBS, ModelArts, and SMN."

### Q2.4: Why choose Ascend AI processors over generic GPUs for this workload?
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

### Q4.3: What is your team's roadmap if you advance to the National Finals (18 Nov)?
> **Answer:**
> "Our three core milestones for the National Finals are:
> 1. **Full Huawei Cloud Production Launch:** Execute our `deploy/ecs/setup.sh` deployment kit on our provisioned Huawei Cloud account, bringing ECS, OBS buckets, ModelArts inference endpoints, and SMN alert topics live.
> 2. **Shah Alam Field Pilot:** Deploy our solar ESP32 river node enclosure (`FloodWay_RiverNode_v1`) and connect test camera feeds at Taman Sri Muda and Kampung Padang Jawa.
> 3. **Expanded Hydrological Dataset:** Incorporate high-resolution hourly telemetry from additional Klang Valley monsoon events into our Stage 5 benchmark."

---

## 💡 Quick Tips for the Presentation

- **Stay Calm & Direct:** When a judge asks a tough question, pause, acknowledge the question directly, and lead with the concrete principle before explaining the technical detail.
- **Support Your Team Member:** If Nadi is answering and needs a technical detail, Luqman or Tisya can step in smoothly with: *"To add to what Nadi mentioned..."*
- **Keep Answers Under 45 Seconds:** Judges often have 2 to 3 questions. Concise answers leave room for more engagement and a higher score.
