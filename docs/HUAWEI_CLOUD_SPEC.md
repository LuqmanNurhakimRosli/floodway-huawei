# GEO-RESQ — Huawei Cloud Architecture & Integration Specification

## 1. Overview
This document specifies the exact mapping of GEO-RESQ's components to Huawei Cloud services, satisfying the mandatory requirement for specified Huawei technology in the **Huawei ICT Competition 2026–2027 APAC Innovation Track**.

---

## 2. Infrastructure Architecture

```
                                  GEO-RESQ SYSTEM ARCHITECTURE
                                    (HUAWEI CLOUD POWERED)

  [ Sentinel-1 SAR / Sentinel-2 ]           [ SRTM 30m DEM Rasters ]
                │                                      │
                ▼                                      ▼
  ┌──────────────────────────────────────────────────────────────────────────┐
  │ 1. DATA LAKE STORAGE: Huawei OBS (Object Storage Service)                │
  │    Bucket: obs-geo-resq-ap-southeast-3                                   │
  │    Prefixes: /raw-imagery/ · /dem-rasters/ · /processed-vectors/        │
  └────────────────────────────────────┬─────────────────────────────────────┘
                                       │
                                       ▼
  ┌──────────────────────────────────────────────────────────────────────────┐
  │ 2. MODEL DEVELOPMENT & INFERENCE: Huawei ModelArts                       │
  │    - Training: Ascend 910 NPU Cluster + CANN 8.0 Toolkit                 │
  │    - Model Architecture: Bi-Temporal Siamese U-Net (Prithvi-100M base)   │
  │    - Real-Time Serving: Containerized ModelArts Online Service           │
  │      Endpoint: POST /v1/models/geo-resq-damage-detection/predict         │
  └────────────────────────────────────┬─────────────────────────────────────┘
                                       │ (GeoJSON polygons / masks)
                                       ▼
  ┌──────────────────────────────────────────────────────────────────────────┐
  │ 3. ENTERPRISE SPATIAL DATABASE: Huawei GaussDB                           │
  │    - Spatial Extension: PostGIS compatible engine                        │
  │    - Stored Tables: osm_highways, flood_polygons, critical_facilities    │
  │    - Queries: ST_Intersects(road.geom, flood.geom)                       │
  └────────────────────────────────────┬─────────────────────────────────────┘
                                       │
                                       ▼
  ┌──────────────────────────────────────────────────────────────────────────┐
  │ 4. COMPUTING & DECISION BACKEND: Huawei ECS (Elastic Cloud Server)       │
  │    - Framework: Python 3.13 + FastAPI + NetworkX Routing Engine          │
  │    - API Gateway: Routes, layers, situation reports, provenance metadata │
  └───────────────────┬───────────────────────────────────┬──────────────────┘
                      │                                   │
                      ▼                                   ▼
  ┌───────────────────────────────────┐   ┌───────────────────────────────────┐
  │ 5. COMMAND DASHBOARD (FRONTEND)   │   │ 6. EMERGENCY NOTIFICATION: SMN    │
  │    React 18 + Leaflet + Tailwind  │   │    Huawei Simple Message Service  │
  │    Real-time EOC Tactical Display │   │    SMS/Email alerts to responders │
  └───────────────────────────────────┘   └───────────────────────────────────┘
```

---

## 3. Detailed Service Specifications

### 3.1 Huawei OBS (Object Storage Service)
- **Region:** `ap-southeast-3` (Kuala Lumpur, Malaysia)
- **Bucket:** `obs-geo-resq-ap-southeast-3`
- **Use Case:** High-throughput storage for multi-spectral GeoTIFFs (up to 1 GB per scene) and trained model checkpoints (`siamese_unet_geo_resq.pth`).
- **Integration Script:** [`scripts/huawei_obs_sync.py`](file:///c:/Users/Luqman%20Nurhakim/Desktop/Projects/Hackathon-2026/Huawei/scripts/huawei_obs_sync.py).

### 3.2 Huawei ModelArts (AI Development & Serving)
- **Compute:** Ascend 910 AI Processors (High performance, energy efficient NPU)
- **CANN Toolkit:** CANN 8.0 with `torch_npu` acceleration
- **Inference Runtime:** Custom container implementing the ModelArts service contract:
  - Entry point: [`ml/huawei/customize_service.py`](file:///c:/Users/Luqman%20Nurhakim/Desktop/Projects/Hackathon-2026/Huawei/ml/huawei/customize_service.py)
  - Specification: [`ml/huawei/config.json`](file:///c:/Users/Luqman%20Nurhakim/Desktop/Projects/Hackathon-2026/Huawei/ml/huawei/config.json)

### 3.3 Huawei GaussDB (Spatial Engine)
- **Database Engine:** openGauss / PostgreSQL with Spatial extension
- **Role:** Executes millisecond spatial joins between high-resolution flood contours and OpenStreetMap highway graphs to flag impassable road corridors.

### 3.4 Huawei ECS (Elastic Cloud Server)
- **Instance Type:** General Computing-Plus (c7 series)
- **Role:** Hosts the FastAPI decision service and calculates multi-criteria rescue corridors using Dijkstra and A* graph traversal.

### 3.5 Huawei SMN (Simple Message Notification)
- **Use Case:** Pushes mission-critical evacuation routes and situational reports (SitRep) directly to rescue coordinators in the field via SMS and email.
