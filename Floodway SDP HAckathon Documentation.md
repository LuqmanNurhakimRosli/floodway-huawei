FLOODWAY
AI-Powered Flood Early Warning System Architecture and Data Flow
Project Report: Technical Submission - Sime Darby Property "Township of Tomorrow" Hackathon
Document ID | FLOODWAY-TECH-SUBMISSION-2026-V2.0
Institution | Faculty of Computer & Mathematical Sciences (FSKM), Universiti Teknologi MARA (UiTM), Shah Alam
Target End-Users | Sime Darby Property Residents, NADMA, JPS (Department of Irrigation and Drainage), Local Authorities
Submission Date | 20 October 2026
Engineering Team & Official Roster
#

1. EXECUTIVE SUMMARY & OPERATIONAL SAFETY MANDATE
FloodWay is an explainable, cloud-native decision-support platform engineered to warn residents of flood-prone places in Malaysia before water reaches them. It integrates live vision analytics, verified citizen reports, dynamic risk-aware routing, and automated Telegram/local push alerts.
SAFETY MANDATE - Honesty Status & Verification
To ensure operational integrity, FloodWay maintains a strict separation between implemented production systems and simulated prototypes. Accuracy metrics are strictly gated to reproducible repository logic.

Real and Running
Simulated or Sample
Designed (Not Built/Called)
Camera pipeline, photo upload, alert logic, fault filter, OpenStreetMap routes, offline app cache
Five sample cameras, relief centres, flood-prone areas, citizen reports, underpass barriers
Government camera feeds, agency verification, Huawei Cloud calls, real road barriers

2. END-TO-END SYSTEM ARCHITECTURE
The FloodWay architecture is decoupled into three primary operational domains: Data Sources, the AI Processing Layer, and Outputs.
System Component Stack

Layer
Technology
Operational Role
Key Metric / Spec
Frontend Dashboard
React 19.x, TypeScript 5.9, Vite 7.x
High-stress web UI & Leaflet maps
166 Vitest passing tests
Mobile App
Expo SDK 58, React Native 0.88
Android offline caching & navigation
Shared pure logic via src/shared.ts
API Gateway
FastAPI, Python 3, Pydantic v2
Async IO backend & hardware telemetry
Telemetry HMAC signed (max skew 120s)
Prediction Layer
PyTorch, scikit-learn, SciPy
Flood susceptibility & level forecasting
GRU quantile forecaster
Vision Verification
Google Gemini (via OpenRouter)
Multimodal citizen photo assessment
6 calls/min/client limit
Database & Auth
Firebase 12.x & Cloud Firestore
Secure user sessions, NoSQL storage
Write-token protected

3. ALGORITHMS & ANALYTICAL PIPELINES
3.1 Camera Vision & Telemetry Analysis
FloodWay utilizes multiple computer vision paradigms to process live street cameras and IoT depth nodes:
Algorithm
Parameters
Operational Capability & Limits
Classical Water Analyser
7×7 local std dev < 4.5; HSV sat ≥ 0.08
Detects smooth/coloured water. Fails in glare/night.
Reference-Difference Analyser
Gaussian blur σ = 2; colour distance > 20
Identifies changes against dry reference frames.
Waterline & Ratio Tracker
Edge correction 3 rows, ratio 0 to 1.3
Computes structural ratio (bed − waterline) / (bed − danger).
Jump Filter (Fault Filter)
Allowed step = 0.25 + 0.01 × seconds
Rejects transient noise (e.g., splashes, trucks) for one cycle.

3.2 Four-Level Operational Warning Ladder
The backend deterministic logic (levels.py) applies hysteresis to prevent flickering, mapping ratios into four distinct escalating alert phases:
Level
Hex Colour
Resident Action
System Trigger
Normal
#16A34A (Green)
App shows green
Waterline below operational concern
Advisory
#EAB308 (Yellow)
Check the route
Gradual water rise detected
Warning
#F97316 (Orange)
Push alert, route ready
Escalate after 2 consecutive higher readings
Danger
#DC2626 (Red)
Evacuate to open shelter
Confidence ≥ 0.85; triggers automated barrier closure

3.3 Rule-Based Hydrologic Forecasting
To supplement the classical computer vision, a strict hydrologic formula calculates localized run-off horizons:
Median = current level + delta + runoff
(where delta is a saturating rise driven by a rain factor: delta(t) = rain factor × t / (1 + 0.3 t))
4. MULTIMODAL CITIZEN REPORTING & VERIFICATION
Optical Ingestion: Citizen captures a photo, adds text description, GPS location, and optional tap-to-measure depth.
Multimodal Inference (Gemini 2.5 Flash): Evaluates if the image exhibits flooding, estimates depth, and flags AI-generated forgery.
Structured Verification: Strict JSON is normalized by the server. Bad fields default to null.
Spatial Aggregation: Multiple proximate verified reports form decaying "verified-report areas" (radius 500m - 5km) which actively penalize the OSRM road routing engine.
5. MODEL EVALUATION, TESTING & LIMITATIONS
To maintain engineering honesty, evaluation standards are explicitly defined. The GINKGO flood-risk model (HistGradientBoosting) and the Rainfall Trigger (Random Forest) have documented constraints preventing unverified accuracy claims from entering production without spatial block cross-validation.
5.1 Verification Test Suite Results
Frontend Tests: 166 passing Vitest checks (npm run check).
Backend Tests: 152 passing Pytest checks (pytest -q).
Mobile Tests: 16 passing Jest tests.
Route Audit: 117 loads executed with 0 failures (route-audit.mjs).
5.2 Mandatory Future Evaluation Hurdles
Before any predictive model is elevated to unrestricted live deployment, it must pass the following:
Leakage Check: Drop NDWI/MNDWI indices to ensure models do not merely copy water index labels.
Spatial Block Cross-Validation: Evaluate on unseen geographical blocks (1km/5km) to verify generalizability.
Hardware Calibration: Bench-test the ESP32 depth nodes against physical tape measures at distances ranging from 0.5m to 4m to plot mean error distribution.
