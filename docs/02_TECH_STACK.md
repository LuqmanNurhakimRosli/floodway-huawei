# FloodWay — Tech Stack

## Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19.2.0 | UI framework |
| TypeScript | ~5.9.3 | Type safety |
| Vite | 7.2.4 | Build tool / dev server |
| Tailwind CSS | 4.1.18 | Utility-first styling |
| React Router DOM | 7.13.0 | Client-side routing |
| Leaflet + React-Leaflet | 1.9.4 / 5.0.0 | Map rendering (shelters, reports, zones) |
| Three.js + R3F | 0.183.1 / 9.5.0 | 3D flood simulation |
| @react-three/drei | 10.7.7 | Three.js helpers (GLTF, controls, environment) |
| Lucide React | 0.563.0 | Icon library |
| Firebase | 12.9.0 | Auth + Firestore |
| @google/generative-ai | 0.24.1 | Gemini API for image verification |
| shadcn/ui | 3.8.4 (dev) | UI component primitives |
| class-variance-authority | 0.7.1 | Variant-based component styling |
| clsx + tailwind-merge | 2.1.1 / 3.4.0 | Conditional class names |

## Backend (Python)

| Technology | Version | Purpose |
|---|---|---|
| FastAPI | ≥0.109.0 | REST API server |
| Uvicorn | ≥0.27.0 | ASGI server |
| TensorFlow | ≥2.15.0 | ANN model inference |
| NumPy | ≥1.24.0 | Array operations |
| Pydantic | ≥2.0.0 | Request/response validation |

## External Services

| Service | Usage |
|---|---|
| Firebase Auth | Email/password + Google sign-in |
| Cloud Firestore | Flood report persistence |
| OSRM Public API | Real road routing (project-osrm.org) |
| Gemini 1.5 Flash | Flood image verification |

## Build & Deploy

| Tool | Configuration |
|---|---|
| Vite | `vite.config.ts` — React plugin + Tailwind CSS plugin |
| Path alias | `@` → `./src` |
| Netlify | `netlify.toml` — SPA redirect, `dist/` publish |
| ESLint | `eslint.config.js` — React hooks + refresh plugins |

## ML Assets

| File | Format | Size | Description |
|---|---|---|---|
| `flood_detector.h5` | Keras HDF5 | 51KB | Trained ANN model |
| `flood_detector.tflite` | TFLite | 8KB | Mobile-optimized variant |
| `flood_detection_using_ann.ipynb` | Jupyter | 154KB | Training notebook |
| `_MalaysiaFloodDataset*.csv` | CSV | 89KB | Training dataset |
| `nothing/flood-prediction-model.ipynb` | Jupyter | 78KB | Alternative model notebook |

## Browser Requirements

- **Web Serial API**: Chrome 89+ or Edge 89+ (required for IoT)
- **WebGL 2.0**: Required for 3D simulation
- **Geolocation API**: Required for location features
- **Camera API**: Required for report photo capture

## Environment Variables

```
VITE_FIREBASE_API_KEY          # Firebase Web API key
VITE_FIREBASE_AUTH_DOMAIN      # e.g., project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID       # Firebase project ID
VITE_FIREBASE_STORAGE_BUCKET   # e.g., project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID   # Google Analytics (optional)
VITE_GEMINI_API_KEY            # Gemini 1.5 Flash API key (optional)
```

> **IMPORTANT**: Never commit actual key values. The `.env` file is gitignored. Only store variable names in documentation.
