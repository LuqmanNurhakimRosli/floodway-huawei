# FloodWay — Features

## 1. Intelligence Dashboard (HomePage)

**File**: `src/pages/HomePage.tsx`

- **Traffic Light Status**: Green/Yellow/Red one-glance risk indicator
- **Safety Score**: Circular gauge (0-100) based on current risk
- **Impact Countdown**: Timer showing time until predicted flood impact
- **AI Action Script**: Personalized checklist (e.g., "Unplug electronics", "Move car")
- **WhatsApp Alert Banner**: Deep-link to share flood warnings via WhatsApp
- **Community Reports Summary**: Count of verified reports with navigation link
- **Progressive Disclosure**: Technical data (CCTV snapshot, rain gauge) hidden behind toggle
- **CCTV Feed**: Static image with AI water level line overlay
- **Demo mode**: `hasDanger` is hardcoded to `true` for FYP demo

## 2. Shelter Finder + Navigation (ShelterPage, NavigationPage)

**Files**: `src/pages/ShelterPage.tsx`, `src/pages/NavigationPage.tsx`

- **Shelter Listing**: 15 real shelters across KL/Selangor with distance calculation
- **Leaflet Map**: Interactive map with shelter markers, flood zones, user position
- **Flood Zone Overlay**: Red polygons showing danger areas
- **Transport Mode**: Car, motorcycle, walking
- **OSRM Routing**: Real road-following routes with turn-by-turn instructions
- **Cluster-Dodge**: Algorithm that reroutes around flood zone clusters
- **Route Safety Indicator**: Shows if route passes through flood zones
- **IoT Sensor Focus**: Map auto-centers on sensor location when navigating from IoT widget

## 3. Community Sentinel — Reports (ReportPage)

**Files**: `src/pages/ReportPage.tsx`, `src/components/report/*`

- **Report Submission**: Camera capture + category + description
- **AI Verification**: Gemini 1.5 Flash analyzes flood images in real-time
- **Dual Verification Pipeline**: AI verification → Human moderator review
- **Manual Location Pinning**: Users can manually select the incident location on an interactive map if GPS is inaccurate or if reporting from a remote location.
- **Moderator Panel**: Approve / reject / override AI decisions
- **Map View**: Verified reports displayed as markers on Leaflet map
- **Report Categories**: Rising Water, Blocked Road, Trapped Victim, Landslide
- **Seed Reports**: Two demo reports auto-created with fixed Firestore IDs

## 4. 3D Flood Simulation (SimulationPage)

**File**: `src/pages/SimulationPage.tsx`

- **WebGL City Model**: Blender-exported city (`city.glb`) rendered via React Three Fiber
- **Three Flood Levels**: Normal (☀️ 0m), Medium (🌧️ 1.5m), High (🌊 4.2m)
- **Custom GLSL Shaders**: Water plane with 3-layer sine waves, foam, color gradients
- **Rain Particle System**: 200 instanced cylinders with gravity
- **Floating Debris**: 10 box meshes orbiting on water surface
- **Pulse Ring**: Expanding/fading danger ring
- **Dynamic Atmosphere**: Fog density, sky color, lighting per flood level
- **Demo Cycle Mode**: Auto-sequences through flood levels for kiosk display
- **Responsive**: Desktop sidebar + mobile bottom-sheet drawer

## 5. IoT Water Level Monitoring (IoTWidget, EmergencyAlert)

**Files**: `src/components/IoTWidget.tsx`, `src/components/EmergencyAlert.tsx`, `src/hooks/useBluetooth.ts`

- **ESP32 Connection**: Web Serial API at 115200 baud
- **Water Tank Visualization**: Animated fill level with color-coded status
- **Distance Tracking**: Shows km distance from user to sensor
- **Automated Report Generation**: Creates FloodReport when DANGER + no report today
- **Emergency Alert**: Full-screen modal with vibration + siren audio (within 3km)
- **Minimizable Widget**: Compact pill view when minimized

## 6. Authentication (WelcomePage, SignUpPage, ProfilePage)

**Files**: `src/pages/WelcomePage.tsx`, `src/pages/SignUpPage.tsx`, `src/pages/ProfilePage.tsx`

- **Firebase Auth**: Email/password + Google sign-in
- **Auth Guards**: `RequireAuth` and `RedirectIfAuthed` route wrappers
- **Profile Management**: Update display name, email, password, photo URL
- **User Avatar**: Persistent across app with fallback initials

## 7. Onboarding (LoadingPage)

**File**: `src/pages/LoadingPage.tsx`

- Animated loading experience after login
- Location selection/detection
- Transitions user to main dashboard

## 8. ML Prediction Backend

**Files**: `backend/main.py`, `flood_detector.h5`

- **FastAPI** server with CORS enabled
- **ANN Model**: Trained on Malaysian flood dataset
- **Endpoints**: `/predict` (POST), `/predict-simple` (POST), `/health` (GET)
- **Input**: Monthly rainfall data (13 features)
- **Preprocessing**: StandardScaler with hardcoded mean/variance from training
- **Fallback**: Frontend generates simulated predictions if backend is offline

## Feature Status

| Feature | Status | Notes |
|---|---|---|
| Dashboard | ✅ Complete | Demo mode hardcoded |
| Shelter Navigation | ✅ Complete | OSRM + flood avoidance |
| Community Reports | ✅ Complete | AI + human verification |
| 3D Simulation | ✅ Complete | v3.0 (WebGL) |
| IoT Integration | ✅ Complete | Web Serial + auto-reports |
| ML Backend | ✅ Complete | ANN model serving |
| Auth System | ✅ Complete | Firebase Auth |
| AR Flood Overlay | 📋 Planned | v5.0 future vision |
| GPS-Anchored 3D | 📋 Planned | v4.0 with Mapbox/Cesium |
