# FloodWay — Architecture

## High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER (Mobile Browser)                     │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│  │  Home    │ │Simulation│ │ Reports  │ │ Shelter  │ │Profile ││
│  │Dashboard │ │  3D Twin │ │ Sentinel │ │ + Nav    │ │        ││
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └───┬────┘│
│       │             │            │             │           │      │
│  ┌────┴─────────────┴────────────┴─────────────┴───────────┴────┐│
│  │                     AppContext (Global State)                  ││
│  │  • Location, Prediction, Route, Reports, IoT state           ││
│  └──────┬────────────────────┬────────────────────┬─────────────┘│
│         │                    │                    │               │
│  ┌──────┴──────┐  ┌─────────┴────────┐  ┌───────┴──────┐       │
│  │ AuthContext  │  │ useBluetooth     │  │ useGeolocation│       │
│  │ (Firebase)   │  │ (Web Serial API) │  │ useCamera     │       │
│  └──────┬──────┘  └─────────┬────────┘  └───────────────┘       │
└─────────┼───────────────────┼────────────────────────────────────┘
          │                   │
          ▼                   ▼
┌─────────────────┐  ┌──────────────┐
│ Firebase         │  │ ESP32 Sensor │
│ • Auth           │  │ (USB Serial) │
│ • Firestore      │  │ Water Level  │
│ (floodReports)   │  │ + Status     │
└─────────────────┘  └──────────────┘
          │
          │  (optional)
          ▼
┌──────────────────────────────────────────┐
│          Backend (FastAPI @ :8000)         │
│  • ANN model (flood_detector.h5)          │
│  • /predict endpoint                      │
│  • /health endpoint                       │
│  • StandardScaler normalization           │
└──────────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────┐
│        External APIs                      │
│  • OSRM (routing / navigation)            │
│  • Gemini 1.5 Flash (image verification)  │
│  • OpenWeatherMap (future)                │
└──────────────────────────────────────────┘
```

## Architectural Layers

### Layer 1: Prediction Engine
- **Current**: ANN model trained on Malaysian flood dataset (`flood_detection_using_ann.ipynb`)
- **Model**: `flood_detector.h5` (Keras, ~51KB)
- **Input**: 13 features (JAN-DEC monthly rainfall + annual total)
- **Output**: Flood probability (0-1), risk level, confidence
- **Fallback**: Frontend generates simulated predictions if backend is offline

### Layer 2: Community Sentinel (Reports)
- Dual verification pipeline: **AI (Gemini) → Human (Moderator)**
- Reports stored in Firestore `floodReports` collection
- Seed reports auto-created with fixed IDs (idempotent)
- Categories: Rising Water, Blocked Road, Trapped Victim, Landslide

### Layer 3: Emergency Navigation
- Real road routing via **OSRM** public API
- **Cluster-Dodge** algorithm: routes avoid flood zones by injecting repulsion waypoints
- Flood zone polygons defined in `src/data/floodZones.ts`
- Ray Casting (PNPOLY) for point-in-polygon intersection tests
- Fallback: Haversine-based bezier route if OSRM is down

### Layer 4: 3D Flood Simulation
- **React Three Fiber** + **Three.js** + custom GLSL shaders
- City model: `public/city.glb` (Blender export)
- Three flood levels: Normal → Medium → High
- Components: WaterPlane, RainSystem, FloatingDebris, PulseRing, Atmosphere

### Layer 5: IoT Integration
- ESP32 via **Web Serial API** (Chrome/Edge only)
- Data format: `level,status\n` (e.g., `75,WARNING`)
- Automated report generation on DANGER status
- Emergency alerts within 3km radius (vibration + audio)

## State Management

- **AppContext** (`src/store/AppContext.tsx`): Global state — location, predictions, routes, reports, IoT
- **AuthContext** (`src/contexts/AuthContext.tsx`): Firebase Auth wrapper
- Pattern: React Context + `useState` + `useCallback` (no Redux/Zustand)

## Data Flow: Report Submission

```
User captures photo → useCamera hook
    → ReportForm collects description + category
    → Gemini 1.5 Flash verifies image (aiVerification.ts → openai.ts)
    → Report created with AI result + PENDING human review
    → addFloodReport() → optimistic local update + Firestore persist
    → Moderator panel: approve/reject/override
    → isFullyVerified() determines map visibility
```

## Data Flow: IoT Alert

```
ESP32 sends "level,status" via USB Serial
    → useBluetooth hook parses data
    → AppContext exposes iotLevel/iotStatus
    → IoTWidget renders water tank visualization
    → If DANGER + no report today → auto-generate FloodReport
    → If DANGER + user within 3km → EmergencyAlert (fullscreen modal)
```

## Routing Architecture

| Path | Page | Auth | Bottom Nav |
|---|---|---|---|
| `/` | WelcomePage (Login) | Public | No |
| `/signup` | SignUpPage | Public | No |
| `/loading` | LoadingPage | Required | No |
| `/home` | HomePage | Required | Yes |
| `/simulation` | SimulationPage | Required | Yes |
| `/reports` | ReportPage | Required | Yes |
| `/shelters` | ShelterPage | Required | Yes |
| `/profile` | ProfilePage | Required | Yes |
| `/navigation/:shelterId` | NavigationPage | Required | No |

## Related Docs

- Tech Stack: [02_TECH_STACK.md](./02_TECH_STACK.md)
- Database Schema: [05_DATABASE_SCHEMA.md](./05_DATABASE_SCHEMA.md)
- IoT System: [07_IOT_SYSTEM.md](./07_IOT_SYSTEM.md)
