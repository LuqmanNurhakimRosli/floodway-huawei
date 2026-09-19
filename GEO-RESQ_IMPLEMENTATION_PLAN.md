# GEO-RESQ: Autonomous Post-Disaster Intelligence Platform

## Local-First Implementation Plan, Dataset Research, Reference Systems, UI/UX Direction, and Huawei Cloud Migration

**Version:** 1.0\
**Date:** 19 September 2026\
**Primary development target:** Local laptop MVP first\
**Cloud target:** Huawei Cloud / ModelArts\
**Current strategic focus:** Satellite + geospatial AI + damage
intelligence + routing + command dashboard\
**Deprioritized for MVP:** Physical IoT sensor deployment

------------------------------------------------------------------------

# 1. Executive Direction

GEO-RESQ should initially be built as a **post-disaster geospatial
intelligence and emergency decision-support platform**, not as an IoT
monitoring project.

The first working version should prove one strong end-to-end workflow:

> **Pre-disaster imagery + post-disaster imagery → AI change/damage
> detection → geospatial damage layer → road/infrastructure impact →
> rescue-route analysis → command dashboard.**

IoT should remain an architectural extension rather than the centre of
the first implementation. This reduces hardware, telemetry, connectivity
and field-deployment complexity while allowing the core GEO-RESQ value
proposition to be demonstrated using datasets that can be obtained and
processed locally.

The platform should therefore be developed in this order:

1.  **Geospatial data ingestion**
2.  **Satellite image preparation**
3.  **Building/road/infrastructure vector layers**
4.  **Bi-temporal change detection**
5.  **Damage classification / structured damage tags**
6.  **Flood or affected-area layer**
7.  **Road accessibility analysis**
8.  **Rescue-route decision support**
9.  **Unified command dashboard**
10. **Evaluation and reproducible demo**
11. **Only then: optional real-time sensor/IoT integration**
12. **Cloud migration to Huawei Cloud**

------------------------------------------------------------------------

# 2. What GEO-RESQ Is

## 2.1 Core proposition

> **GEO-RESQ transforms fragmented satellite and geospatial data into
> actionable disaster intelligence for faster damage assessment,
> affected-area understanding, route analysis and humanitarian
> coordination.**

The system is intended to answer four operational questions:

### Question A: What changed?

Compare pre-event and post-event Earth observation imagery.

### Question B: What was affected?

Identify affected buildings, roads, bridges, critical infrastructure and
flood/impact zones.

### Question C: Can responders still get there?

Combine affected infrastructure with a road network and determine
potential blocked or viable corridors.

### Question D: What should the command team see first?

Convert raw geospatial outputs into a prioritized operational dashboard.

------------------------------------------------------------------------

# 3. Strategic Scope Change: IoT Is Not the MVP

The earlier concept included upstream river sensors and telemetry. Keep
that concept in the long-term architecture, but do not make physical IoT
a dependency for the first prototype.

## 3.1 Why deprioritize IoT now

Physical IoT introduces:

-   hardware procurement
-   sensor calibration
-   waterproofing
-   power management
-   network coverage
-   MQTT/HTTP telemetry
-   field installation
-   sensor failure modes
-   maintenance
-   deployment permissions
-   real-world data collection

None of these are necessary to prove the central GEO-RESQ proposition.

## 3.2 Revised MVP

The MVP should simulate or omit live telemetry and focus on:

``` text
SATELLITE EO
    ↓
PRE/POST IMAGE PAIR
    ↓
IMAGE PREPROCESSING
    ↓
SIAMESE CHANGE DETECTION
    ↓
DAMAGE / CHANGE MAP
    ↓
GIS VECTORIZATION
    ↓
ROAD + BUILDING + CRITICAL INFRASTRUCTURE ANALYSIS
    ↓
ROUTE ACCESSIBILITY
    ↓
GEO-RESQ COMMAND DASHBOARD
```

## 3.3 Future IoT integration

Later:

``` text
IoT / Gauge / Rainfall / River Level
              ↓
        Surge Engine
              ↓
       Risk / ETA / Alert
              ↓
       GEO-RESQ Dashboard
```

This means the platform architecture remains multimodal without forcing
hardware into the current development phase.

------------------------------------------------------------------------

# 4. Reference Systems and What GEO-RESQ Should Learn From Them

The goal is not to copy another system. The goal is to identify proven
interaction patterns and operational concepts.

------------------------------------------------------------------------

## 4.1 United States: NOAA National Water Prediction Service (NWPS)

The U.S. National Weather Service introduced the National Water
Prediction Service as the replacement for the legacy Advanced Hydrologic
Prediction Service. NWPS provides waterway observations, forecasts,
geospatial mapping and APIs. Its API exposes streamflow forecasts,
stream observations, National Water Model output, flood impacts,
flood-category levels and location metadata.

### GEO-RESQ lessons

Use the following patterns:

-   map-first interface
-   location search
-   hydrographic layers
-   forecast/observation distinction
-   time-series hydrograph panels
-   clear warning categories
-   API-first data architecture
-   mobile-compatible information presentation

### UI pattern to borrow

``` text
┌─────────────────────────────────────────────────────────────┐
│ GEO-RESQ                          EVENT: FLOOD     ● LIVE    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   MAP                                                       │
│                                                             │
│   ● Sensor / observation                                    │
│   ■ Flood extent                                            │
│   ■ Damaged road                                            │
│   ■ Critical facility                                       │
│                                                             │
│                         ┌──────────────────────────────┐    │
│                         │ WATER / EVENT PANEL          │    │
│                         │ Current     4.82 m           │    │
│                         │ Trend       Rising           │    │
│                         │ Forecast    +2 h             │    │
│                         └──────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**Important:** A future GEO-RESQ surge ETA must be labelled as model
output and uncertainty-aware. A value such as "25 min" is only an
example/demo value until validated against appropriate hydraulic or
empirical data.

------------------------------------------------------------------------

## 4.2 Japan: MLIT River and Disaster Information

Japan's Ministry of Land, Infrastructure, Transport and Tourism has long
operated river and disaster-information systems. MLIT documentation
describes river disaster-prevention information including rainfall,
water levels, dam parameters and warning information.

Japan also provides the **Hazard Map Portal Site**, which lets users
overlay flood, landslide, storm-surge, tsunami, road-disaster and
land-characteristic information.

### GEO-RESQ lessons

The strongest UI idea is **layer composition**.

A responder should be able to toggle:

-   flood
-   terrain
-   roads
-   buildings
-   critical facilities
-   disaster-risk zones
-   satellite change
-   affected infrastructure
-   evacuation/rescue routes

### UI pattern

``` text
LAYERS
☑ Flood extent
☑ Damage detection
☑ Roads
☑ Bridges
☐ Buildings
☐ Hospitals
☐ Schools
☐ Evacuation centres
☐ Terrain
```

The Japanese hazard-map approach is particularly useful for GEO-RESQ
because it demonstrates how multiple hazard layers can be composed on
one map instead of forcing users through separate applications.

------------------------------------------------------------------------

## 4.3 Europe: Copernicus Emergency Management Service (CEMS)

CEMS is the most important conceptual reference for GEO-RESQ.

The service uses satellite imagery and other geospatial data to support
disaster preparedness, emergency response and recovery. Rapid Mapping
provides geospatial information after disaster events, including event
extent and infrastructure damage.

Current CEMS Rapid Mapping products include vector and geospatial
deliverables, and in June 2026 the service announced faster delivery of
vector products and GeoPackage support.

### GEO-RESQ lessons

GEO-RESQ should emulate the **product mindset**, not simply the map
mindset.

A disaster event should produce structured outputs:

``` text
EVENT
├── Event extent
├── Damage assessment
├── Transportation impact
├── Infrastructure impact
├── Population/exposure
├── Situation report
└── GIS package
```

### GEO-RESQ equivalent

``` text
EVENT: FLASH FLOOD / KAJANG DEMO

OUTPUTS
├── Flood / affected area
├── Building damage
├── Road accessibility
├── Bridge status
├── Critical infrastructure
├── Rescue corridors
├── Priority zones
└── Situation summary
```

This is a major design principle.

**Do not build only a beautiful map. Build an operational geospatial
product.**

------------------------------------------------------------------------

## 4.4 China: disaster-information and emergency-management reference

For the China reference track, use national water/disaster-management
systems primarily as architectural inspiration rather than attempting to
reproduce a specific national platform.

Research areas to monitor:

-   Ministry of Water Resources flood and drought monitoring
-   national water-information services
-   disaster risk monitoring
-   emergency-management geospatial platforms
-   satellite-based disaster assessment
-   integrated command systems

For the first GEO-RESQ implementation, the China reference should mainly
inform:

-   centralized command dashboards
-   multi-source data fusion
-   national-scale geospatial information
-   emergency decision support
-   cloud/AI infrastructure

Avoid claiming a specific Chinese platform feature unless verified from
an official source.

------------------------------------------------------------------------

# 5. Dataset Strategy

The first MVP should use a small, reproducible dataset stack.

## 5.1 Priority Dataset Matrix

  ----------------------------------------------------------------------------
  Dataset           Role                   Resolution / Type MVP Priority
  ----------------- ---------------------- ----------------- -----------------
  Sentinel-1        Flood/change detection C-band SAR        VERY HIGH

  Sentinel-2        Optical pre/post       Multispectral     HIGH
                    imagery                                  

  Copernicus EMS    Real disaster          Vector/raster     VERY HIGH
                    reference products                       

  OpenStreetMap     Roads/buildings/POIs   Vector            VERY HIGH

  DEM               Terrain / elevation    Raster            HIGH

  Historical flood  Validation/reference   Raster/vector     HIGH
  products                                                   

  Local open GIS    Malaysia-specific      Vector/raster     HIGH
  data              context                                  

  Physical IoT      Live water telemetry   Time series       LOW for MVP
  ----------------------------------------------------------------------------

------------------------------------------------------------------------

# 6. Sentinel-1

Sentinel-1 is particularly valuable for flood applications because
C-band SAR can acquire imagery day/night and under cloudy conditions.

Use Sentinel-1 for:

-   flood extent extraction
-   water/non-water classification
-   post-disaster change
-   cloud-resistant event analysis
-   SAR-based before/after comparison

Recommended first experiment:

``` text
T1 = pre-event Sentinel-1
T2 = post-event Sentinel-1
       ↓
Radiometric / geometric preparation
       ↓
Backscatter comparison
       ↓
Water / non-water change
       ↓
Flood extent polygon
```

Suggested local output:

``` text
data/processed/flood_extent.geojson
```

------------------------------------------------------------------------

# 7. Sentinel-2

Sentinel-2 provides multispectral optical imagery and is useful for:

-   visible damage context
-   vegetation/water discrimination
-   land-cover interpretation
-   visual before/after comparison
-   multimodal experiments

Sentinel-2 contains 13 spectral bands, including 10 m, 20 m and 60 m
spatial-resolution bands.

For a first laptop MVP, do not download massive scenes unnecessarily.

Instead:

1.  choose one disaster
2.  define a small AOI
3.  download only required imagery
4.  crop to AOI
5.  create aligned T1/T2 patches

------------------------------------------------------------------------

# 8. Copernicus EMS

Copernicus EMS is especially useful because its outputs represent actual
operational emergency-mapping products rather than generic
remote-sensing datasets.

CEMS provides access to:

-   flood data
-   EFAS data
-   GloFAS data
-   GFM data
-   emergency mapping activations
-   preparedness/recovery products
-   exposure datasets

Rapid Mapping datasets can include event extent and ancillary layers
such as transportation and hydrography.

Use CEMS in two ways:

### Training/reference

Use existing products to understand event geography and create reference
labels where licensing and product conditions permit.

### Evaluation

Compare GEO-RESQ's detected event extent against an
authoritative/reference disaster product.

------------------------------------------------------------------------

# 9. OpenStreetMap

OpenStreetMap should be the first road-network and infrastructure source
for the prototype.

Potential layers:

-   roads
-   highways
-   bridges
-   buildings
-   hospitals
-   schools
-   evacuation facilities
-   emergency services
-   waterways
-   points of interest

Use OSM data through:

-   Overpass
-   regional extracts
-   local downloads
-   OSMnx

Important licensing requirement:

OpenStreetMap data is licensed under the Open Database License (ODbL).
GEO-RESQ must provide appropriate attribution and follow applicable ODbL
obligations.

------------------------------------------------------------------------

# 10. Elevation / DEM

Terrain is important for flood analysis and routing.

For U.S.-based testing, USGS 3DEP is an excellent reference dataset. The
National Map provides free elevation and other GIS data, with DEM
products at multiple resolutions.

For global/local experiments, investigate:

-   SRTM
-   ASTER GDEM
-   Copernicus DEM where access conditions permit
-   national open elevation datasets

Recommended first laptop resolution:

**30 m DEM**

Do not start with very high-resolution terrain unless the experiment
requires it.

------------------------------------------------------------------------

# 11. Recommended First Dataset Package

Create this exact structure:

``` text
data/
├── raw/
│   ├── sentinel1/
│   ├── sentinel2/
│   ├── dem/
│   ├── osm/
│   └── cems/
│
├── interim/
│   ├── aligned/
│   ├── clipped/
│   └── normalized/
│
└── processed/
    ├── flood_extent/
    ├── change_detection/
    ├── damage/
    ├── roads/
    └── outputs/
```

------------------------------------------------------------------------

# 12. Recommended First Disaster Scenario

Do not begin with many countries.

Choose **one event and one AOI**.

Ideal selection criteria:

-   clear pre-event imagery
-   clear post-event imagery
-   available flood/damage reference
-   OSM coverage
-   manageable geographic extent
-   cloud/SAR availability
-   visually understandable event

Recommended workflow:

``` text
ONE DISASTER
     ↓
ONE AOI
     ↓
T1 + T2
     ↓
ONE CHANGE MODEL
     ↓
ONE DAMAGE MAP
     ↓
ONE ROAD NETWORK
     ↓
ONE ROUTING SCENARIO
     ↓
ONE COMMAND DASHBOARD
```

After the pipeline works, expand to additional events.

------------------------------------------------------------------------

# 13. Local Technology Stack

## Frontend

-   React
-   Vite
-   TypeScript
-   Tailwind CSS
-   Leaflet or MapLibre GL JS
-   Recharts for analytics
-   Lucide icons

## Backend

-   Python
-   FastAPI
-   Pydantic
-   GeoPandas
-   Rasterio
-   GDAL
-   Shapely
-   NetworkX / OSMnx

## AI

-   PyTorch
-   torchvision
-   segmentation models as appropriate
-   Siamese U-Net architecture
-   optional pretrained encoders

## Geospatial processing

-   Rasterio
-   GDAL
-   GeoPandas
-   Shapely
-   PyProj
-   OSMnx

## Local storage

Initial:

-   GeoPackage
-   SQLite
-   local GeoTIFF
-   GeoJSON

Later:

-   PostgreSQL
-   PostGIS
-   object storage

------------------------------------------------------------------------

# 14. Why FastAPI Instead of Node for the AI Core

The frontend should remain React/Vite.

The AI/geospatial backend should be Python because the core processing
stack is Python-native.

Recommended:

``` text
React/Vite
     ↓
FastAPI
     ↓
├── raster processing
├── geospatial analysis
├── AI inference
├── route analysis
└── result generation
```

A Node.js service can be introduced later for gateway/auth/event
orchestration if required, but it should not be added merely for
architectural complexity.

------------------------------------------------------------------------

# 15. GEO-RESQ Software Architecture

``` text
┌──────────────────────────────────────────────────────────────┐
│                     GEO-RESQ FRONTEND                        │
│                 React + Vite + Map UI                        │
└──────────────────────────────┬───────────────────────────────┘
                               │ REST / JSON
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                       FASTAPI API                             │
├──────────────────────────────────────────────────────────────┤
│ Event Service | Analysis Service | Damage Service | Routing │
└───────────────┬───────────────────┬──────────────────────────┘
                │                   │
                ▼                   ▼
      ┌─────────────────┐  ┌──────────────────────┐
      │ GEO PROCESSING  │  │ AI INFERENCE ENGINE  │
      │ GDAL/Rasterio   │  │ Siamese U-Net        │
      │ GeoPandas       │  │ Segmentation         │
      │ Shapely         │  │ Change Detection     │
      └────────┬────────┘  └──────────┬───────────┘
               │                      │
               └──────────┬───────────┘
                          ▼
                ┌──────────────────┐
                │ GEO DATA STORE   │
                │ GeoPackage       │
                │ GeoJSON          │
                │ GeoTIFF          │
                └──────────────────┘
```

------------------------------------------------------------------------

# 16. Core AI Pipeline

## 16.1 Bi-temporal change detection

Input:

``` text
T1 = Before disaster
T2 = After disaster
```

Architecture:

``` text
        T1 IMAGE                  T2 IMAGE
           │                         │
           ▼                         ▼
      ┌──────────┐             ┌──────────┐
      │ Encoder  │             │ Encoder  │
      └────┬─────┘             └────┬─────┘
           │                         │
           └──────────┬──────────────┘
                      ▼
                FEATURE FUSION
                      │
                      ▼
                 DECODER
                      │
                      ▼
                CHANGE MASK
```

A Siamese architecture is appropriate because both time points can be
processed through shared or equivalent feature-extraction pathways
before comparison.

------------------------------------------------------------------------

# 17. Damage Taxonomy

Do not begin with an excessively complicated classification system.

MVP:

``` text
NO_CHANGE
MINOR_CHANGE
MAJOR_CHANGE
DESTROYED / BLOCKED
UNKNOWN
```

Then convert to operational tags:

``` text
building:major_damage
building:destroyed
road:blocked
bridge:damaged
road:washed_out
area:flooded
facility:affected
```

This makes AI outputs easier to integrate with GIS and routing.

------------------------------------------------------------------------

# 18. Road Accessibility Engine

This is one of GEO-RESQ's strongest differentiating components.

Input:

``` text
OSM road graph
+
AI damage map
+
flood extent
+
critical infrastructure
```

Processing:

``` text
ROAD NETWORK
     ↓
SPATIAL INTERSECTION
     ↓
AFFECTED ROAD SEGMENTS
     ↓
BLOCK / PENALIZE EDGES
     ↓
GRAPH SEARCH
     ↓
AVAILABLE ROUTES
```

Potential routing states:

``` text
GREEN  = usable
YELLOW = uncertain / affected
RED    = blocked
GREY   = unavailable data
```

Do not state that a road is definitely safe simply because the AI did
not detect damage.

Use:

> **Potentially accessible**

rather than:

> **Safe**

unless safety has been independently validated.

------------------------------------------------------------------------

# 19. Rescue Route Logic

Example:

``` text
START
Responder Base
      │
      ▼
  Road Graph
      │
 ┌────┴─────┐
 ▼          ▼
Blocked    Open
Road       Road
 │          │
 ✕          ▼
       Candidate Route
             │
             ▼
       Affected Area
             │
             ▼
       Rescue Facility
```

Route scoring can include:

``` text
route_score =
    travel_time
  + damage_penalty
  + flood_penalty
  + uncertainty_penalty
```

Do not hide the scoring logic.

The dashboard should allow responders to understand why a route was
selected.

------------------------------------------------------------------------

# 20. Command Dashboard UI

Recommended layout:

``` text
┌────────────────────────────────────────────────────────────────────┐
│ GEO-RESQ       EVENT: FLASH FLOOD        STATUS ● ACTIVE            │
├───────────────┬──────────────────────────────────┬─────────────────┤
│ LAYERS        │                                  │ INCIDENT        │
│               │                                  │                 │
│ ☑ Flood       │                                  │ HIGH IMPACT     │
│ ☑ Damage      │          DISASTER MAP            │                 │
│ ☑ Roads       │                                  │ 127 structures  │
│ ☑ Bridges     │      RED = affected             │ 18 road links   │
│ ☑ Facilities  │      GREEN = candidate route    │ 3 critical sites│
│ ☐ Terrain     │                                  │                 │
│               │                                  │                 │
├───────────────┴──────────────────────────────────┴─────────────────┤
│ EVENT SUMMARY                                                       │
│ Affected Area │ Structures │ Roads │ Critical Facilities           │
│     4.8 km²   │    127     │  18   │       3                     │
├────────────────────────────────────────────────────────────────────┤
│ ROUTE ANALYSIS                                                      │
│ Base → Affected Zone       8.4 km       Candidate                  │
│ Base → Hospital             5.1 km       Candidate                  │
└────────────────────────────────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 21. Interface Design Principles

## Principle 1: Map first

The map is the primary workspace.

## Principle 2: Side panels explain the map

Do not put every metric on top of the map.

## Principle 3: Every layer must have a purpose

Avoid decorative layers.

## Principle 4: Colour must represent meaning

Suggested semantic convention:

``` text
RED    = affected / blocked / high priority
ORANGE = warning / uncertain
GREEN  = candidate route / available
BLUE   = water / hydrology
WHITE  = neutral base
GREY   = unavailable / unknown
```

## Principle 5: Uncertainty must be visible

Example:

``` text
Damage confidence: 0.87
Route confidence: 0.74
Data age: 3 hours
Source: Sentinel-1
```

------------------------------------------------------------------------

# 22. GEO-RESQ Information Hierarchy

The interface should answer information needs in this order:

### Level 1: What is happening?

Event status.

### Level 2: Where?

Map and affected area.

### Level 3: What is damaged?

Buildings, roads, bridges, facilities.

### Level 4: Can responders reach it?

Route analysis.

### Level 5: How reliable is this?

Confidence, source and timestamp.

This hierarchy should guide every dashboard component.

------------------------------------------------------------------------

# 23. API Design

## Event

``` http
GET /api/events
GET /api/events/{event_id}
POST /api/events
```

## Imagery

``` http
GET /api/events/{event_id}/imagery
POST /api/imagery/register
```

## Change detection

``` http
POST /api/analysis/change-detection
GET /api/analysis/{analysis_id}
```

## Damage

``` http
POST /api/analysis/damage
GET /api/events/{event_id}/damage
```

## Flood extent

``` http
POST /api/analysis/flood-extent
GET /api/events/{event_id}/flood
```

## Routing

``` http
POST /api/routes/analyze
GET /api/events/{event_id}/routes
```

## Dashboard

``` http
GET /api/events/{event_id}/summary
```

------------------------------------------------------------------------

# 24. Example Analysis Request

``` json
{
  "event_id": "demo-flood-001",
  "before_image": "sentinel1_t1",
  "after_image": "sentinel1_t2",
  "aoi": {
    "min_lon": 101.7,
    "min_lat": 2.9,
    "max_lon": 101.8,
    "max_lat": 3.0
  },
  "model": "siamese_unet_v1"
}
```

Example result:

``` json
{
  "event_id": "demo-flood-001",
  "status": "completed",
  "affected_area_km2": 4.82,
  "changed_structures": 127,
  "affected_roads": 18,
  "confidence": 0.87,
  "outputs": {
    "change_mask": "/outputs/change_mask.tif",
    "damage_vector": "/outputs/damage.geojson",
    "affected_roads": "/outputs/roads.geojson"
  }
}
```

------------------------------------------------------------------------

# 25. Database Model

Initial local database:

``` text
events
-----
id
name
event_type
start_time
end_time
aoi
status

imagery
--------
id
event_id
source
acquisition_time
product_type
path
cloud_percentage
metadata

analysis_runs
-------------
id
event_id
model
version
started_at
completed_at
status
metrics

damage_features
---------------
id
event_id
feature_type
geometry
damage_class
confidence
source

road_segments
-------------
id
event_id
osm_id
geometry
status
damage_score
confidence

routes
------
id
event_id
origin
destination
geometry
distance
estimated_time
risk_score
status
```

------------------------------------------------------------------------

# 26. Folder Structure

``` text
geo-resq/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── map/
│   │   ├── charts/
│   │   ├── services/
│   │   └── types/
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── services/
│   │   ├── geospatial/
│   │   ├── ai/
│   │   └── routing/
│   ├── tests/
│   └── requirements.txt
│
├── models/
│   ├── checkpoints/
│   ├── configs/
│   └── inference/
│
├── data/
│   ├── raw/
│   ├── interim/
│   └── processed/
│
├── notebooks/
│
├── scripts/
│
├── docs/
│
├── docker/
│
└── README.md
```

------------------------------------------------------------------------

# 27. Local Development Phases

## Phase 0: Environment

Install:

-   Node.js
-   Python 3.x
-   Git
-   VS Code
-   GDAL
-   QGIS

Create:

``` text
frontend/
backend/
data/
models/
```

------------------------------------------------------------------------

## Phase 1: Map Shell

Build:

-   full-screen map
-   sidebar
-   layer switcher
-   event selector
-   legend
-   incident panel

Use static GeoJSON initially.

**Goal:** dashboard visually works before AI.

------------------------------------------------------------------------

## Phase 2: Real Geospatial Data

Add:

-   OSM roads
-   buildings
-   facilities
-   flood reference layer
-   DEM

**Goal:** map uses real data.

------------------------------------------------------------------------

## Phase 3: Satellite Pipeline

Implement:

``` text
download
  ↓
clip
  ↓
align
  ↓
normalize
  ↓
save
```

Support Sentinel-1 first.

------------------------------------------------------------------------

## Phase 4: AI Change Detection

Start with a baseline before a sophisticated model.

Baseline options:

-   image differencing
-   thresholding
-   simple segmentation baseline

Then implement:

**Siamese U-Net**

This is important for scientific evaluation because GEO-RESQ needs a
baseline comparison.

------------------------------------------------------------------------

# 28. AI Evaluation

Do not evaluate only with screenshots.

Use measurable metrics.

## Segmentation

-   IoU
-   Dice/F1
-   Precision
-   Recall
-   pixel accuracy where meaningful

## Object damage

-   precision
-   recall
-   F1
-   confusion matrix

## Geospatial

-   affected-area error
-   intersection over union
-   road-block detection accuracy

## System

-   processing time
-   memory usage
-   model size
-   API latency

## Operational

-   time from imagery input to actionable GIS output
-   percentage of correctly identified blocked links
-   route success rate under simulated closures

------------------------------------------------------------------------

# 29. Benchmark Design

For every model version:

``` text
MODEL
↓
DATASET
↓
PREPROCESSING VERSION
↓
INFERENCE
↓
METRICS
↓
OUTPUT MAP
↓
ERROR ANALYSIS
```

Record:

``` text
model_version
dataset_version
image_pair
aoi
timestamp
IoU
F1
precision
recall
runtime
hardware
```

This will make the project much more defensible in a competition,
research presentation or future publication.

------------------------------------------------------------------------

# 30. Huawei Cloud Migration Strategy

The local implementation should remain portable.

The target migration architecture:

``` text
LOCAL
────────────────────────────
React/Vite
FastAPI
PyTorch
GDAL/Rasterio
GeoPackage
       │
       │ Docker
       ▼
HUAWEI CLOUD
────────────────────────────
Object Storage
       ↓
ModelArts
       ↓
AI Training / Inference
       ↓
API Service
       ↓
Database / Geospatial Store
       ↓
GEO-RESQ Web Dashboard
```

Huawei ModelArts is a full-lifecycle AI development platform supporting
algorithm development, model training, deployment and resource
management. Current documentation also describes support for PyTorch,
TensorFlow, MindSpore and Ascend-oriented frameworks.

------------------------------------------------------------------------

# 31. What Huawei Technologies GEO-RESQ Can Potentially Use

## ModelArts

Primary AI platform.

Use for:

-   training
-   experiments
-   model management
-   inference
-   deployment
-   resource management

## Ascend

Target acceleration layer for compatible workloads.

Potential future path:

``` text
PyTorch model
     ↓
ModelArts
     ↓
Ascend-compatible optimization
     ↓
NPU inference
```

Do not optimize for Ascend before the local model is proven.

------------------------------------------------------------------------

# 32. ModelArts Development Strategy

### Local

``` text
Develop
↓
Debug
↓
Train baseline
↓
Evaluate
```

### Cloud

``` text
Upload dataset
↓
Create training environment
↓
Run experiments
↓
Compare models
↓
Deploy inference endpoint
```

The current ModelArts documentation supports both real-time and batch
inference concepts and different resource-pool configurations.

------------------------------------------------------------------------

# 33. Cloud Data Architecture

Potential target:

``` text
              ┌───────────────┐
              │ Satellite EO  │
              └───────┬───────┘
                      ↓
              ┌───────────────┐
              │ Object Storage│
              └───────┬───────┘
                      ↓
              ┌───────────────┐
              │   ModelArts   │
              └───────┬───────┘
                      ↓
              ┌───────────────┐
              │ AI Inference  │
              └───────┬───────┘
                      ↓
              ┌───────────────┐
              │ GEO API       │
              └───────┬───────┘
                      ↓
              ┌───────────────┐
              │ Command UI    │
              └───────────────┘
```

------------------------------------------------------------------------

# 34. Keep Cloud Migration Portable

Do not hard-code Huawei APIs into the AI model.

Use an abstraction:

``` python
class InferenceProvider:
    def predict(self, input_data):
        raise NotImplementedError
```

Local:

``` python
class LocalInferenceProvider(InferenceProvider):
    ...
```

Cloud:

``` python
class HuaweiInferenceProvider(InferenceProvider):
    ...
```

This prevents vendor lock-in during development.

------------------------------------------------------------------------

# 35. Recommended Dockerization

Create:

``` text
docker/
├── frontend.Dockerfile
├── backend.Dockerfile
└── ai.Dockerfile
```

Use:

``` text
docker compose up
```

for local reproducibility.

Later:

``` text
Docker image
     ↓
Huawei Cloud
```

------------------------------------------------------------------------

# 36. Demo Scenario

The demo should tell a simple operational story.

## Step 1

Select disaster event.

## Step 2

Show pre-event satellite image.

## Step 3

Show post-event image.

## Step 4

Run AI analysis.

## Step 5

Show detected change.

## Step 6

Convert detected change to structured damage.

## Step 7

Overlay roads.

## Step 8

Automatically identify potentially affected road segments.

## Step 9

Select responder origin and destination.

## Step 10

Generate candidate routes.

## Step 11

Show affected route segments.

## Step 12

Open incident summary.

------------------------------------------------------------------------

# 37. Recommended Demo Script

``` text
"This is GEO-RESQ.

We start with the same area before and after a disaster.

Instead of asking an operator to manually inspect every road and structure,
GEO-RESQ uses bi-temporal satellite analysis to identify meaningful change.

The detected changes are converted into geospatial damage features.

We then intersect those features with the road network.

The system identifies potentially affected road segments and recalculates
candidate responder routes.

The final output is not just a satellite image.

It is an operational map showing what changed, what may be affected,
and where responders can investigate next."
```

Avoid claiming that AI autonomously makes life-or-death decisions.

------------------------------------------------------------------------

# 38. Responsible AI

GEO-RESQ should explicitly state:

> **GEO-RESQ is a decision-support system. It does not replace emergency
> commanders, field verification or official disaster-management
> procedures.**

Every major output should expose:

-   source
-   timestamp
-   model version
-   confidence
-   data age
-   processing status

Example:

``` text
ROAD STATUS
Potentially blocked

Evidence:
AI change score: 0.91
Flood overlap: 62%
Source image: Sentinel-1
Acquired: 2026-09-18
Model: Siamese-U-Net v0.3
```

------------------------------------------------------------------------

# 39. Known Limitations

## Satellite

-   cloud cover for optical imagery
-   revisit time
-   spatial resolution
-   acquisition availability
-   geometric differences
-   shadows and seasonal changes

## AI

-   false positives
-   false negatives
-   domain shift
-   limited disaster labels
-   sensor differences
-   geographic generalization

## Routing

-   OSM freshness
-   missing roads
-   missing temporary closures
-   uncertain damage
-   terrain limitations

## Operational

-   network connectivity
-   data latency
-   procurement
-   agency integration
-   cybersecurity
-   human trust
-   alert fatigue

------------------------------------------------------------------------

# 40. What NOT to Build Yet

Do not start with:

-   physical IoT hardware
-   complicated microservices
-   real-time streaming
-   Kubernetes
-   full government authentication
-   mobile application
-   nationwide deployment
-   multiple AI models
-   complex hydraulic simulation
-   autonomous dispatch

These can come later.

The first goal is:

> **one disaster → one AOI → one AI pipeline → one damage map → one
> routing workflow → one command dashboard.**

------------------------------------------------------------------------

# 41. Minimum Viable GEO-RESQ

The first acceptable MVP should contain exactly these components:

### A. Event selector

``` text
Event: Flood Demo 001
Status: Processed
```

### B. Before/after imagery

``` text
T1
T2
```

### C. Change detection

``` text
Change mask
```

### D. Damage map

``` text
Buildings
Roads
Affected areas
```

### E. Routing

``` text
Origin
Destination
Candidate route
Affected segments
```

### F. Command summary

``` text
Affected area
Affected structures
Affected roads
Candidate routes
Confidence
Source
Timestamp
```

------------------------------------------------------------------------

# 42. Recommended Build Order

## Week 1

### Day 1

-   create repository
-   create React/Vite frontend
-   create FastAPI backend
-   create folder structure
-   create map shell

### Day 2

-   add OSM data
-   add GeoJSON layers
-   add event selector
-   add layer control

### Day 3

-   acquire first Sentinel-1 event
-   preprocess imagery
-   produce flood/change baseline

### Day 4

-   build initial Siamese U-Net
-   create inference endpoint

### Day 5

-   output damage GeoJSON
-   overlay damage on map

### Day 6

-   connect road network
-   identify affected roads
-   implement routing

### Day 7

-   integrate dashboard
-   add confidence/source/timestamp
-   record demo

------------------------------------------------------------------------

# 43. Second Development Stage

After MVP:

``` text
MVP
 ↓
More events
 ↓
More geographic areas
 ↓
Better training dataset
 ↓
Model benchmarking
 ↓
Damage taxonomy
 ↓
Critical infrastructure
 ↓
Uncertainty
 ↓
Cloud training
 ↓
Cloud inference
```

Only after this:

``` text
Optional IoT
 ↓
River/water telemetry
 ↓
Surge engine
 ↓
Real-time alerting
```

------------------------------------------------------------------------

# 44. Future Surge Engine

When the platform is ready, the surge component can consume:

``` text
water_level(t)
rainfall(t)
dh/dt
d²h/dt²
terrain
river geometry
forecast information
```

Potential output:

``` text
CURRENT STATUS
RISING RAPIDLY

RISK
HIGH

FORECAST
Model-dependent

CONFIDENCE
0.72
```

Avoid deterministic wording such as:

> "Flood will arrive in exactly 25 minutes."

Use:

> "Estimated arrival window: 20--35 min"

only when the model has been validated and uncertainty is represented.

------------------------------------------------------------------------

# 45. Reference UI Comparison

  Reference                 Strong idea for GEO-RESQ
  ------------------------- -----------------------------------------
  NOAA NWPS                 Hydrograph + map + forecast/API pattern
  Japan MLIT                Layered hazard information
  Japan Hazard Map Portal   Multi-risk overlay
  Copernicus EMS            Operational geospatial products
  CEMS Rapid Mapping        Event → standardized outputs
  OSM                       Open global transport/geospatial base
  Huawei ModelArts          Cloud AI lifecycle

------------------------------------------------------------------------

# 46. UIUX Direction

The visual identity should be:

**Emergency Operations Centre + Geospatial Intelligence + AI**

Not:

-   consumer weather app
-   generic dashboard
-   gaming map
-   overly futuristic holographic interface

Recommended visual language:

``` text
Background:
White / very light neutral

Primary:
Deep navy / dark blue

Operational:
Red = affected
Orange = warning
Green = route
Blue = water

Map:
Clean basemap
Minimal labels
Strong thematic overlays

Panels:
Dense but readable
Rounded 8–12 px
Clear hierarchy
```

The dashboard should look credible enough for:

-   emergency operation centres
-   government agencies
-   humanitarian organisations
-   infrastructure operators
-   engineering teams

------------------------------------------------------------------------

# 47. Screenshot / Visual Reference Collection

For implementation, manually inspect the current official interfaces of:

1.  NOAA NWPS
2.  Japan MLIT river/disaster information
3.  Japan Hazard Map Portal
4.  Copernicus EMS Mapping
5.  Copernicus Browser
6.  CEMS Early Warning Data Store

Record for each:

``` text
REFERENCE
URL
WHAT TO COPY
WHAT NOT TO COPY
MAP BEHAVIOUR
LAYER CONTROL
PANEL DESIGN
LEGEND
ALERT DESIGN
TIME SERIES
MOBILE BEHAVIOUR
```

Do not copy branding or proprietary UI assets. Copy interaction patterns
and information architecture.

------------------------------------------------------------------------

# 48. Data Licensing Checklist

Before putting any dataset into a public demo:

``` text
[ ] Source identified
[ ] License identified
[ ] Attribution recorded
[ ] Commercial-use conditions checked
[ ] Redistribution conditions checked
[ ] Derived-data obligations checked
[ ] Dataset version/date recorded
```

Especially for OSM, follow ODbL attribution requirements.

For Copernicus products, record the applicable dataset/product terms.

------------------------------------------------------------------------

# 49. Research References

## Copernicus Data Space Ecosystem

Sentinel-1, Sentinel-2 and Copernicus data access:

https://dataspace.copernicus.eu/

Sentinel-1:

https://dataspace.copernicus.eu/data-collections/copernicus-sentinel-missions/sentinel-1

Sentinel-2:

https://dataspace.copernicus.eu/data-collections/copernicus-sentinel-missions/sentinel-2

## Copernicus EMS

CEMS data:

https://emergency.copernicus.eu/data/

CEMS Mapping:

https://mapping.emergency.copernicus.eu/about/

Rapid Mapping:

https://mapping.emergency.copernicus.eu/about/rapid-mapping-portfolio/

CEMS data documentation:

https://documentation.dataspace.copernicus.eu/Data/CopernicusServices/CEMS.html

CEMS Early Warning Data Store:

https://ewds.climate.copernicus.eu/

## NOAA

NWPS operations:

https://www.weather.gov/owp/operations

NWPS API:

https://water.noaa.gov/about/api

NWPS API documentation:

https://api.water.noaa.gov/about/api

## Japan MLIT / GSI

MLIT disaster prevention:

https://www.mlit.go.jp/river/bousai/

MLIT river guidance:

https://www.mlit.go.jp/river/shishin_guideline/

Japan Hazard Map Portal:

https://disaportal.gsi.go.jp/

## OpenStreetMap

Copyright and license:

https://www.openstreetmap.org/copyright

Data export:

https://www.openstreetmap.org/export

## USGS

National Map:

https://www.usgs.gov/the-national-map-data-delivery

Elevation datasets:

https://www.usgs.gov/faqs/what-types-elevation-datasets-are-available-what-formats-do-they-come-and-where-can-i-download

Global elevation data:

https://www.usgs.gov/faqs/where-can-i-get-global-elevation-data

## Huawei Cloud

ModelArts:

https://www.huaweicloud.com/intl/en-us/product/modelarts.html

ModelArts documentation:

https://support.huaweicloud.com/intl/en-us/productdesc-modelarts/modelarts_01_0001.html

ModelArts concepts:

https://support.huaweicloud.com/intl/en-us/productdesc-modelarts/modelarts_01_0007.html

------------------------------------------------------------------------

# 50. Final Technical Recommendation

The correct immediate direction for GEO-RESQ is:

``` text
                 GEO-RESQ MVP
                       │
       ┌───────────────┼────────────────┐
       │               │                │
       ▼               ▼                ▼
  SATELLITE EO       GIS DATA       AI CHANGE
       │               │                │
 Sentinel-1/2       OSM / DEM       Siamese U-Net
       │               │                │
       └───────────────┼────────────────┘
                       ▼
               DAMAGE INTELLIGENCE
                       │
                       ▼
              ROAD ACCESSIBILITY
                       │
                       ▼
                ROUTE ANALYSIS
                       │
                       ▼
              COMMAND DASHBOARD
```

Then:

``` text
MVP
 ↓
Validated AI
 ↓
More events
 ↓
Cloud ModelArts
 ↓
Scalable inference
 ↓
Operational integration
 ↓
Optional IoT / surge engine
```

This gives GEO-RESQ a much cleaner technical story:

> **Satellite intelligence first. Geospatial reasoning second. AI
> decision support third. Real-time sensing later.**

------------------------------------------------------------------------

# 51. Immediate Next Actions

## Build first

1.  React/Vite dashboard
2.  FastAPI backend
3.  Leaflet/MapLibre map
4.  OSM road layer
5.  Sentinel-1 event dataset
6.  Pre/post image viewer
7.  baseline change detection
8.  damage GeoJSON
9.  road impact analysis
10. route engine
11. command dashboard

## Research next

1.  Select one real flood event
2.  Download exact T1/T2 imagery
3.  Obtain a reference flood/damage product
4.  Create a reproducible dataset manifest
5.  Establish baseline metrics
6.  Implement Siamese U-Net
7.  Compare AI output against reference
8.  Document errors
9.  Build final demo scenario

## Cloud later

1.  Dockerize backend
2.  Containerize inference
3.  Move datasets to object storage
4.  Train in ModelArts
5.  deploy inference
6.  connect API
7.  benchmark cloud vs laptop
8.  investigate Ascend optimization

------------------------------------------------------------------------

# 52. One-Sentence Project Definition

> **GEO-RESQ is a geospatial AI decision-support platform that converts
> pre- and post-disaster Earth observation data into structured damage
> intelligence and actionable rescue-route analysis through a unified
> emergency command interface.**
