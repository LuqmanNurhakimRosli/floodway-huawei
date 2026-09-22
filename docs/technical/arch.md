# 🌊 FloodWay — Full System Architecture

> **Version:** 3.0.0 | **Last Updated:** March 2026 | **Author:** Luqman Nurhakim
> AI-Powered Flood Preparedness & Evacuation PWA for Malaysia.

---

## Table of Contents

1. [High-Level System Overview](#1-high-level-system-overview)
2. [User–Server Architecture & Interaction Model](#2-userserver-architecture--interaction-model)
3. [Architecture Layers](#3-architecture-layers)
4. [Frontend Architecture & Routing](#4-frontend-architecture--routing)
5. [Authentication System](#5-authentication-system)
6. [Database Architecture — Firestore](#6-database-architecture--firestore)
7. [Backend — ANN Prediction Server](#7-backend--ann-prediction-server)
8. [AI & ML Subsystems](#8-ai--ml-subsystems)
9. [External API Integrations](#9-external-api-integrations)
10. [User Roles & Access Control](#10-user-roles--access-control)
11. [Application State Management](#11-application-state-management)
12. [Data Flow Diagrams — Detailed Walkthroughs](#12-data-flow-diagrams--detailed-walkthroughs)
13. [File & Folder Structure](#13-file--folder-structure)
14. [Deployment Architecture](#14-deployment-architecture)
15. [Security Model](#15-security-model)
16. [Future Architecture Evolution](#16-future-architecture-evolution)

---

## 1. High-Level System Overview

FloodWay is a **four-feature PWA** built as a React Single-Page Application (SPA). The entire application runs inside the user's browser — there is no traditional server rendering. The browser talks directly to three external systems: Firebase (auth + database), a locally-run Python AI backend, and public APIs (OSRM, Gemini, OpenStreetMap).

### 1.1 System Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER / MOBILE DEVICE                      │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    React SPA  (Vite + TypeScript)                    │  │
│  │                                                                     │  │
│  │  ┌───────────┐  ┌────────────┐  ┌───────────┐  ┌───────────────┐  │  │
│  │  │   Auth    │  │ Prediction │  │  Report   │  │  Simulation   │  │  │
│  │  │  Pages    │  │   (Home)   │  │  Pages    │  │  (3D WebGL)   │  │  │
│  │  └─────┬─────┘  └─────┬──────┘  └─────┬─────┘  └───────────────┘  │  │
│  │        │               │               │                             │  │
│  │  ┌─────▼───────────────▼───────────────▼──────────────────────────┐ │  │
│  │  │              App State  (AuthContext + AppContext)              │ │  │
│  │  └─────────────────────────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│           │                     │                      │                   │
└───────────┼─────────────────────┼──────────────────────┼───────────────────┘
            │                     │                      │
   ┌────────▼────────┐  ┌─────────▼──────────┐  ┌───────▼─────────────────┐
   │  Firebase Cloud │  │  Python FastAPI     │  │   External Public APIs  │
   │  ─────────────  │  │  (Local at :8000)   │  │  ─────────────────────  │
   │  • Auth service │  │  ─────────────────  │  │  • OSRM Routing        │
   │  • Firestore DB │  │  • POST /predict    │  │  • Google Gemini Flash  │
   │  • Storage (*)  │  │  • Keras ANN model  │  │  • OpenStreetMap tiles  │
   └─────────────────┘  │  • MetMalaysia API  │  │  • MetMalaysia API     │
                        │  • Google Forecast  │  └─────────────────────────┘
                        └────────────────────┘
```

> `(*)` Firebase Storage is planned but not yet wired — photos are currently stored as base64 inside Firestore documents.

### 1.2 How This Diagram Works

- **The browser is sovereign.** All routing, UI rendering, and most business logic runs client-side in the React SPA. There is no server that generates HTML.
- **Firebase is the always-on cloud.** Authentication and the Firestore database are available 24/7 via Firebase's global infrastructure, meaning reports and logins work even when the local Python backend is off.
- **The FastAPI backend is optional but powerful.** It serves the trained ANN (Artificial Neural Network) flood model. When it is unreachable, the frontend silently falls back to a realistic demo simulation so the app always works.
- **External APIs are fetched directly from the browser.** OSRM routing, Gemini AI verification, and map tiles are all called by the client using fetch/XHR requests with API keys injected via environment variables.

---

## 2. User–Server Architecture & Interaction Model

This section describes how different types of users interact with each server/service in the system, and what happens at every step of the communication.

### 2.1 Complete User–Server Interaction Diagram

```
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                         ACTORS / USER ROLES                                 │
 │   ┌──────────────┐        ┌──────────────┐        ┌──────────────────┐     │
 │   │  Regular     │        │  Moderator   │        │   Developer      │     │
 │   │  User        │        │  (Admin)     │        │   (Local)        │     │
 │   └──────┬───────┘        └──────┬───────┘        └────────┬─────────┘     │
 └──────────┼────────────────────── ┼────────────────────────┼────────────────┘
            │                       │                        │
            │ HTTPS                 │ HTTPS                  │ localhost
            ▼                       ▼                        ▼
 ┌──────────────────────┐  ┌────────────────────┐  ┌──────────────────────────┐
 │  NETLIFY CDN         │  │  NETLIFY CDN        │  │  LOCAL DEV SERVER        │
 │  (Static SPA)        │  │  (Static SPA)       │  │  Vite  :5173             │
 │  React bundle        │  │  React bundle       │  │  + FastAPI :8000         │
 └──────────┬───────────┘  └────────┬────────────┘  └──────────────────────────┘
            │                       │
            │ (Both load the same React SPA — role is determined at runtime)
            │
            ▼  ← Browser executes React SPA
 ┌──────────────────────────────────────────────────────────────────────────────┐
 │                     REACT SPA  (runs in browser)                             │
 │                                                                              │
 │  User Actions ──────────────────────────────────────────────────────────►   │
 │                                                                              │
 │  1. OPEN APP        →  App.tsx loads, AuthProvider checks Firebase token     │
 │  2. LOGIN / SIGNUP  →  Firebase Auth REST (email or Google OAuth)            │
 │  3. VIEW HOME       →  floodService.ts → POST :8000/predict (ANN)           │
 │  4. VIEW SHELTERS   →  Leaflet tiles from OpenStreetMap CDN                 │
 │  5. NAVIGATE        →  pathfinding.ts → GET OSRM API → route polyline       │
 │  6. REPORT FLOOD    →  Camera → Gemini API → Firestore addDoc               │
 │  7. MODERATE        →  Firestore getDocs → updateDoc (approve/reject)       │
 │  8. VIEW SIMULATION →  Three.js renders city.glb (WebGL, no network call)   │
 │                                                                              │
 └──────────────┬─────────────────┬────────────────────────────────────────────┘
                │                 │
     ┌──────────┘                 └──────────────┐
     ▼                                           ▼
 ┌───────────────────────────────┐    ┌──────────────────────────────────────┐
 │  FIREBASE CLOUD SERVICES      │    │  THIRD-PARTY APIS (no auth required)  │
 │  ─────────────────────────    │    │  ──────────────────────────────────── │
 │                               │    │                                        │
 │  Auth Service                 │    │  OSRM Routing Server                  │
 │  ├── signIn() / signUp()      │    │  router.project-osrm.org              │
 │  ├── Google OAuth popup       │    │  GET /route/v1/{profile}/             │
 │  ├── onAuthStateChanged()     │    │  → GeoJSON route + steps[]            │
 │  └── updateProfile()          │    │                                        │
 │                               │    │  OpenStreetMap Tile CDN               │
 │  Firestore Database           │    │  tile.openstreetmap.org               │
 │  ├── floodReports (read)      │    │  → Map tile images (256×256 px)       │
 │  ├── floodReports (create)    │    │                                        │
 │  ├── floodReports (update)    │    │  Google Gemini 1.5 Flash              │
 │  └── floodReports (delete)    │    │  generativelanguage.googleapis.com    │
 │                               │    │  POST /v1beta/models/gemini-1.5-flash │
 │  (Storage — planned)          │    │  :generateContent (multimodal vision) │
 └───────────────────────────────┘    │                                        │
                                      │  FastAPI ANN Backend (local)          │
                                      │  localhost:8000                        │
                                      │  POST /predict                         │
                                      │  → flood_probability float             │
                                      └──────────────────────────────────────┘
```

### 2.2 Workflow: Regular User — Full Session

This describes the complete journey of a normal user from opening the app to completing an evacuation.

```
Step 1 — APP OPEN
  User visits Netlify URL or opens PWA icon
  → Browser fetches index.html + JS bundle from Netlify CDN
  → React hydrates, BrowserRouter mounts
  → AuthProvider calls onAuthStateChanged()
    ├─ Token found in IndexedDB?  YES → user set, redirect /home
    └─ No token?                  → user = null, show / (login)

Step 2 — LOGIN
  User enters email + password → clicks Sign In
  → AuthContext.signIn() calls Firebase Auth REST API
  → Firebase validates credentials
    ├─ Success → JWT token stored in browser IndexedDB
    │            onAuthStateChanged fires → user object set
    │            RequireAuth guard passes → navigate to /loading
    └─ Failure → error toast shown, no redirect

Step 3 — ONBOARDING (/loading)
  LoadingPage requests device GPS via navigator.geolocation.getCurrentPosition()
  → User grants location permission
  → userPosition stored in AppContext
  → After brief animation, navigate to /home

Step 4 — HOME DASHBOARD (/home)
  floodService.ts sends POST :8000/predict with monthly rainfall data
    ├─ Backend ONLINE  → ANN model returns flood_probability
    └─ Backend OFFLINE → predictionGenerator.ts creates demo 24h timeline
  FloodTimeline renders 24 hourly risk bars
  AlertCard shows current risk level (SAFE / WARNING / DANGER)
  User can scrub through hours with FloodTimelineScrubber

Step 5 — SHELTER SEARCH (/shelters)
  ShelterPage fetches OpenStreetMap tiles → Leaflet renders map
  5 hardcoded PPS shelter pins rendered
  FloodZoneLayer draws flood hazard polygons on map
  reportsService.getVerifiedReports() → Firestore → community report pins
  User selects transport mode (🚗 / 🏍️ / 🚶)
  User taps shelter card → "Navigate"

Step 6 — ROUTE CALCULATION
  pathfinding.calculateRoute(userPos, shelter, mode)
  → OSRM API called: GET router.project-osrm.org/route/v1/driving/...
  → Response: GeoJSON polyline + NavigationStep[]
  → route stored in AppContext
  → Navigate to /navigation/:shelterId

Step 7 — NAVIGATION (/navigation)
  NavigationPage renders full-screen Leaflet map
  Animated blue polyline shows route
  Step-by-step instructions shown in bottom panel
  User follows route in real-world → taps "Arrived" to finish
```

### 2.3 Workflow: User — Submitting a Flood Report

```
Step 1 — REPORTS PAGE (/reports)
  ReportPage loads → sub-screen = MAP
  reportsService.getAllReports() called → Firestore getDocs(floodReports)
  Verified community reports shown as coloured pins on map

Step 2 — EMERGENCY MODE
  User taps emergency report button → sub-screen = EMERGENCY
  EmergencyMode activates:
    ├─ navigator.geolocation → GPS coordinates captured
    ├─ navigator.mediaDevices.getUserMedia → camera stream opened
    ├─ User taps capture → photo stored as base64 dataURL in memory
    └─ User types description text

Step 3 — AI VERIFICATION
  User taps "Verify with AI" → sub-screen = VERIFICATION
  callGeminiAPI(base64Image, description) called:
    → POST generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash
    → Gemini analyzes photo + text together (multimodal)
    → Returns structured JSON: { is_verified, severity, confidence, summary }
  AIVerification.tsx displays result live with confidence gauge

Step 4 — SUBMIT TO FIRESTORE
  User taps "Submit Report"
  reportsService.submitReport(report) called:
    → addDoc(collection(db, "floodReports"), {
        photoDataURLs, category, description,
        autoTags: { lat, lng, accuracy, timestamp },
        aiResult: { ...geminiResult },
        humanReview: { status: "PENDING" },
        createdAt
      })
  "Golden Record" audit log written to console
  sub-screen resets to MAP

Step 5 — MODERATOR REVIEW (different user / same user in FYP)
  Moderator opens Reports page → switches to Moderator Panel tab
  reportsService.getAllReports() → all Firestore reports loaded
  Moderator sees each report's: photo, description, AI verdict, confidence
  Moderator clicks APPROVE → updateDoc sets humanReview.status = "APPROVED"
  Moderator clicks REJECT  → updateDoc sets humanReview.status = "REJECTED"
  Moderator clicks OVERRIDE→ updateDoc sets humanReview.status = "OVERRIDDEN"

Step 6 — REPORT VISIBLE ON MAP
  isFullyVerified() evaluates new humanReview + aiResult combo
  Only APPROVED+VERIFIED or OVERRIDDEN reports pass
  FloodReportLayer on ShelterPage map updates with new pin
```

### 2.4 Workflow: Moderator — Admin Actions

```
Moderator logs in → same flow as regular user (no special URL)
Navigates to /reports → taps "Moderator Panel" tab
  │
  ├─ Sees list of ALL reports (PENDING, APPROVED, REJECTED)
  ├─ Each card shows:
  │     • Photo thumbnail
  │     • User GPS location
  │     • AI verdict (VERIFIED/UNVERIFIED)
  │     • Gemini confidence (0-100%)
  │     • Raw AI JSON (collapsed, expandable)
  │     • Current humanReview.status badge
  │
  ├─ APPROVE action:
  │     reportsService.updateReportHumanReview(id, { status: "APPROVED" })
  │     → Firestore updateDoc → report now visible on shelter map
  │
  ├─ REJECT action:
  │     reportsService.updateReportHumanReview(id, { status: "REJECTED" })
  │     → Report hidden from all public views permanently
  │
  ├─ OVERRIDE action (AI was wrong):
  │     reportsService.updateReportHumanReview(id, { status: "OVERRIDDEN" })
  │     → Report appears on map regardless of AI verdict
  │
  └─ DELETE action:
        reportsService.deleteReport(id)
        → Firestore deleteDoc → report permanently removed
```

---

## 3. Architecture Layers

Each layer has a single concern and communicates only with adjacent layers.

| Layer | Technology | Responsibility |
|-------|-----------|----------------|
| **Presentation** | React 19, TypeScript, Tailwind CSS 4, shadcn/ui | UI components, pages, user interactions |
| **3D Rendering** | React Three Fiber, Three.js, GLSL shaders | Flood simulation WebGL engine, water/rain/debris |
| **Mapping** | Leaflet 1.9, React-Leaflet 5, OpenStreetMap | Interactive evacuation maps, overlays, routing display |
| **State** | React Context API (`AppContext`, `AuthContext`) | Global app state + authentication state |
| **Services** | `floodService.ts`, `reportsService.ts` | Abstraction layer over backend calls + Firebase |
| **Auth** | Firebase Authentication | Email/password login, Google OAuth, session persistence |
| **Database** | Cloud Firestore | Real-time NoSQL storage for flood reports |
| **ML Backend** | Python FastAPI + Keras (TensorFlow) + MetMalaysia API + Google Forecast API | ANN flood probability inference, weather data ingestion |
| **AI Verification** | Google Gemini 1.5 Flash (Vision) | Multimodal report photo verification |
| **Routing** | OSRM (Open Source Routing Machine) | Real-road pathfinding on OpenStreetMap road network |
| **Build/Deploy** | Vite 7, Netlify | Asset bundling, CDN hosting, SPA redirect rules |

---

## 4. Frontend Architecture & Routing

### 4.1 Application Shell Tree

The React component tree has two providers wrapping everything — `AuthProvider` manages login state, `AppProvider` manages app data state. Both are readable by any component via their respective hooks.

```
main.tsx
  └── <BrowserRouter>
        └── <App>
              ├── <AuthProvider>          ← Firebase Auth state (user, loading)
              │     └── <AppProvider>     ← App-wide state (route, shelter, prediction)
              │           └── <AppLayout>
              │                 ├── <Routes>      ← All URL routes defined here
              │                 └── <BottomNav>   ← Shows on /home, /shelters, /reports, /simulation, /profile
```

**How it works:** When the app first loads, `AuthProvider` calls `onAuthStateChanged()`. This fires immediately with either a logged-in Firebase user (from IndexedDB token) or `null`. The `loading` flag is `true` until this first call completes, preventing any flicker between login and home screens.

### 4.2 Route Map

| Path | Component | Auth Required | Description |
|------|-----------|:---:|-------------|
| `/` | `WelcomePage` | ❌ | Email/Google login with glassmorphism design |
| `/signup` | `SignUpPage` | ❌ | New user registration |
| `/loading` | `LoadingPage` | ✅ | Onboarding animation + GPS location permission |
| `/home` | `HomePage` | ✅ | Dashboard: ANN prediction timeline, risk alerts, weather |
| `/shelters` | `ShelterPage` | ✅ | Shelter list + flood map with community report overlays |
| `/navigation/:shelterId` | `NavigationPage` | ✅ | Full-screen turn-by-turn OSRM map navigation |
| `/reports` | `ReportPage` | ✅ | Community Sentinel: report list, emergency submit, moderator |
| `/simulation` | `SimulationPage` | ✅ | 3D WebGL KL Digital Twin flood simulation |
| `/profile` | `ProfilePage` | ✅ | User profile, edit name/email/password, sign out |

### 4.3 Auth Guards — How They Work

```
RequireAuth (wraps all protected pages):
  ┌─ Firebase is still checking?  →  Show loading spinner (prevents flash)
  ├─ user === null?               →  <Navigate to="/" />  (redirect to login)
  └─ user exists?                 →  Render the child page normally

RedirectIfAuthed (wraps login + signup pages):
  ┌─ Firebase is still checking?  →  Return null (render nothing)
  ├─ user exists?                 →  <Navigate to="/home" />  (already logged in)
  └─ user === null?               →  Render login/signup page
```

### 4.4 Page Descriptions

| Page | Size | Key Behaviour |
|------|------|---------------|
| `WelcomePage` | ~23 KB | Glassmorphism login card, otter mascot SVG, email + Google OAuth |
| `SignUpPage` | ~20 KB | Registration form, creates Firebase user + sets displayName |
| `LoadingPage` | ~25 KB | Animated onboarding, captures GPS via `navigator.geolocation` |
| `HomePage` | ~34 KB | Fetches ANN prediction, renders 24h timeline chart + alert card |
| `ShelterPage` | ~26 KB | Leaflet map, 5 PPS shelter pins, OSRM route trigger, flood overlays |
| `NavigationPage` | ~20 KB | Full-screen map, animated route polyline, step instructions panel |
| `ReportPage` | ~22 KB | Four sub-screens: MAP → EMERGENCY → VERIFICATION → REPORT |
| `SimulationPage` | ~49 KB | Three.js Canvas, GLSL water shader, rain/debris system, controls |
| `ProfilePage` | ~17 KB | Edit profile fields, calls Firebase `updateProfile` / `updateEmail` |

### 4.5 Component Inventory

```
src/components/
├── AlertCard.tsx              Display the current risk level banner (SAFE/WARNING/DANGER)
├── BottomNav.tsx              Tab bar with icons for 5 main pages
├── FloodReportLayer.tsx       Renders community report map pins on Leaflet
├── FloodTimeline.tsx          24-hour risk bar chart (green/amber/red bars)
├── FloodTimelineScrubber.tsx  Interactive scrubber to inspect individual hours
├── FloodZoneLayer.tsx         Static flood hazard zone SVG polygons on map
├── ForecastOverlay.tsx        Weather conditions overlay card (rain, wind)
├── RiskIndicator.tsx          Animated pulsing coloured ring indicator
├── UserAvatar.tsx             Avatar initials fallback if no profile photo
├── WeatherCard.tsx            Current rainfall mm/h + wind speed widget
├── report/
│   ├── MapScreen.tsx          Community report map with category filter
│   ├── EmergencyMode.tsx      Camera capture + GPS auto-tagging UI
│   ├── AIVerification.tsx     Live Gemini verdict display with confidence bar
│   ├── ModeratorPanel.tsx     Admin review queue with APPROVE/REJECT/OVERRIDE
│   ├── ReportForm.tsx         Standard (non-emergency) report form
│   └── ReportCard.tsx         Single report card in the list view
└── ui/                        shadcn/ui primitives (Button, Card, Badge, Dialog…)
```

---

## 5. Authentication System

### 5.1 Auth Architecture Diagram

Firebase Authentication is the single source of truth for user identity. The `AuthContext` wraps it with React state so any component can read `user` without prop drilling.

```
Firebase Auth Cloud Service
        │
        │  WebSocket / long-poll (onAuthStateChanged)
        │  Fires on: login, logout, token refresh, page reload
        ▼
AuthContext  (src/contexts/AuthContext.tsx)
  │
  ├── state: user    (Firebase User object | null)
  ├── state: loading (true until first onAuthStateChanged fires)
  │
  ├── signIn(email, password)
  │     └── signInWithEmailAndPassword(auth, email, pass)
  │
  ├── signUp(email, password, displayName)
  │     ├── createUserWithEmailAndPassword(auth, email, pass)
  │     └── updateProfile(user, { displayName })
  │
  ├── signInWithGoogle()
  │     └── signInWithPopup(auth, googleProvider)
  │
  ├── logOut()
  │     └── signOut(auth)
  │
  ├── updateUserProfile(data)   → updateProfile(currentUser, data)
  ├── updateUserEmail(email)    → updateEmail(currentUser, email)
  └── updateUserPassword(pass)  → updatePassword(currentUser, pass)
        │
        ▼
  useAuth() hook  ← consumed by every page and guard component
```

### 5.2 Firebase Initialization

File: `src/lib/firebase.ts` — Four singleton exports used everywhere in the app:

```typescript
export const app            // FirebaseApp — root Firebase instance
export const auth           // Auth — handles all auth operations
export const db             // Firestore — database client
export const googleProvider // GoogleAuthProvider — for OAuth popup
```

Configuration comes from `VITE_FIREBASE_*` environment variables injected by Vite at build time. These are never committed to source control (`.env` is in `.gitignore`).

### 5.3 Auth Flow Diagrams

**Email/Password Login:**
```
User types email + password → clicks "Sign In"
  → AuthContext.signIn(email, password)
  → Firebase REST: POST accounts:signInWithPassword
    ├─ FAIL: returns AuthError code
    │     getFriendlyError(code) → human error message shown in toast
    └─ SUCCESS: Firebase issues JWT + refresh token
          → Stored in browser IndexedDB (by Firebase SDK automatically)
          → onAuthStateChanged fires → user state updated
          → RequireAuth re-evaluates → allows /home
          → React Router navigates to /home
```

**Google OAuth:**
```
User clicks "Continue with Google"
  → signInWithPopup(auth, googleProvider)
  → Browser opens Google OAuth popup
  → User sees "FloodWay wants to access your Google account"
    ├─ CANCEL: popup closes → auth/cancelled-popup-request error
    └─ CONSENT: Google returns OAuth token to Firebase
          → Firebase creates/links user account
          → onAuthStateChanged fires → navigate to /home
```

**Session Persistence (Page Reload):**
```
User reopens app / refreshes page
  → AuthProvider mounts → onAuthStateChanged listener registered
  → Firebase SDK checks IndexedDB for stored token
    ├─ Token found & valid: fires with User object immediately → /home
    ├─ Token expired: Firebase silently refreshes → fires with User → /home
    └─ No token / logged out: fires with null → stays on / (login)
```

### 5.4 Firebase User Fields Used by FloodWay

| Field | Set By | Used In |
|-------|--------|---------|
| `uid` | Firebase auto-generated | Report ownership tracking |
| `displayName` | Signup form / Google profile | `UserAvatar`, `ProfilePage` header |
| `email` | Email form / Google account | `ProfilePage` display |
| `photoURL` | Google profile picture | `UserAvatar` image |
| `emailVerified` | Firebase (email link) | Not enforced in current FYP version |

---

## 6. Database Architecture — Firestore

### 6.1 Collection Structure

Firestore is a NoSQL document database. FloodWay uses a single top-level collection.

```
Firestore (cloud.google.com)
│
└── floodReports/                  ← Top-level collection
      ├── abc123xyz/               ← Document (auto-ID, 1 per report)
      │     ├── id
      │     ├── photoDataURLs[]
      │     ├── category
      │     ├── description
      │     ├── autoTags { lat, lng, accuracy, timestamp, compassHeading }
      │     ├── aiResult  { confidence, status, waterDetected, ... }
      │     ├── humanReview { status, reviewedAt, moderatorNote }
      │     └── createdAt
      ├── def456uvw/
      └── ...
```

**Why a flat collection?** Reports have no hierarchical relationship. A flat collection is easiest to query and filter client-side. Firestore's real-time listeners could be added later to push new reports to connected clients without polling.

### 6.2 Full Document Schema

```typescript
interface FloodReport {
  id: string;                    // Firestore auto-generated document ID
  photoDataURLs: string[];       // Base64 JPEG — stored inline (planned: Firebase Storage URL)
  category: 'RISING_WATER' | 'BLOCKED_ROAD' | 'TRAPPED_VICTIM' | 'LANDSLIDE';
  description: string;           // User-written text description

  autoTags: {
    lat: number;                 // Device GPS latitude
    lng: number;                 // Device GPS longitude
    accuracy: number;            // GPS accuracy radius in metres
    timestamp: string;           // ISO-8601 — when photo was taken
    compassHeading: number|null; // Device compass 0°–360° (if available)
  };

  aiResult: {                    // null until Gemini call completes
    confidence: number;          // 0–100 Gemini confidence score
    status: 'PENDING' | 'VERIFIED' | 'UNVERIFIED' | 'REJECTED';
    waterDetected: boolean;
    depthEstimate: string|null;  // e.g. "~0.5m"
    anomalies: string[];         // e.g. ["image blurry", "no flood visible"]
    crossRefStatus: 'CONSISTENT' | 'MISMATCH' | 'UNKNOWN';
    summary: string;             // Gemini one-line verdict sentence
    rawAiResponse?: object;      // Full Gemini JSON for audit/demo
    apiDurationMs?: number;      // Time Gemini took to respond
  } | null;

  humanReview: {
    status: 'PENDING' | 'APPROVED' | 'OVERRIDDEN' | 'REJECTED';
    reviewedAt: string|null;     // ISO-8601 when moderator acted
    moderatorNote: string|null;  // Optional reason / comment
  };

  createdAt: string;             // ISO-8601 report submission time
}
```

### 6.3 Verification State Machine

Every report passes through a two-layer pipeline. The diagram below shows every possible state and transition.

```
                  ┌────────────────────────────────────────┐
  User submits    │  aiResult.status    = 'PENDING'        │
  photo + text    │  humanReview.status = 'PENDING'        │
        │         └──────────────────────┬─────────────────┘
        ▼                                │
  Gemini API call                        ▼  (async, may take 2-5 seconds)
  (openai.ts)     ┌────────────────────────────────────────┐
        │──────►  │  aiResult.status  = 'VERIFIED'         │
                  │    OR             = 'UNVERIFIED'        │
                  │  humanReview.status still 'PENDING'     │
                  └──────────────────────┬─────────────────┘
                                         │
                                         ▼  (Moderator reviews in panel)
                  ┌────────────────────────────────────────┐
                  │           ModeratorPanel               │
                  │   Shows: photo, AI verdict, raw JSON   │
                  │   Actions: APPROVE / REJECT / OVERRIDE │
                  └────────┬──────────┬──────────┬─────────┘
                           │          │          │
                       APPROVE    REJECT     OVERRIDE
                           │          │          │
               ┌────────────▼──┐  ┌───▼──────┐ ┌▼───────────────┐
               │ AI VERIFIED?  │  │ REJECTED │ │ OVERRIDDEN     │
               │  YES → 🗺 MAP │  │ Hidden   │ │ 🗺 MAP (bypass │
               │  NO  → Hidden │  │ forever  │ │ AI rejection)  │
               └───────────────┘  └──────────┘ └────────────────┘
```

**`isFullyVerified(report)` decision logic:**
| humanReview | aiResult | Visible on Map? |
|-------------|----------|:--------------:|
| `OVERRIDDEN` | any | ✅ Yes |
| `REJECTED` | any | ❌ No |
| `APPROVED` | `VERIFIED` | ✅ Yes |
| `APPROVED` | `UNVERIFIED` | ❌ No |
| `PENDING` | any | ⏳ No |

### 6.4 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /floodReports/{reportId} {
      allow read:   if request.auth != null;   // Login required to view reports
      allow create: if request.auth != null;   // Login required to submit
      allow update: if request.auth != null;   // FYP: any user; prod: admin claim
      allow delete: if request.auth != null;   // FYP: any user; prod: admin claim
    }
    match /{document=**} {
      allow read, write: if false;             // Deny all other collections
    }
  }
}
```

> ⚠️ **Production hardening:** `update` and `delete` should require `request.auth.token.admin == true` via Firebase Custom Claims to restrict the Moderator Panel to actual admins.

### 6.5 Service Layer Functions

File: `src/services/reportsService.ts`

| Function | Operation | Called By |
|----------|-----------|-----------|
| `submitReport(report)` | `addDoc` | EmergencyMode after AI verification |
| `getAllReports()` | `getDocs` full collection | ModeratorPanel, MapScreen |
| `getVerifiedReports()` | `getDocs` + `isFullyVerified` filter | FloodReportLayer (shelter map) |
| `updateReportHumanReview(id, review)` | `updateDoc` | ModeratorPanel approve/reject/override |
| `updateReportAI(id, aiResult)` | `updateDoc` | aiVerification after Gemini returns |
| `deleteReport(id)` | `deleteDoc` | ModeratorPanel delete button |

---

## 7. Backend — ANN Prediction Server

### 7.1 Architecture Diagram

The backend is a lightweight Python server. It does one thing: load the trained ANN model and expose it via HTTP. The frontend calls it and displays the result. If it's offline, the frontend has its own fallback.

```
Frontend (floodService.ts)
    │
    │  HTTP POST http://localhost:8000/predict
    │  Body: { JAN: 250, FEB: 180, ..., ANNUAL_RAINFALL: 2760 }
    │  Timeout: 8 seconds
    │
    ▼
FastAPI  (backend/main.py, Uvicorn ASGI server)
    │
    ├── on startup: load_model()
    │     Loads flood_detector.h5 from disk (Keras `.load_model()`)
    │     Hardcodes StandardScaler mean[] + std[] from training notebook
    │
    ├── POST /predict  (RainfallData pydantic model)
    │     1. If ANNUAL_RAINFALL not provided → sum of all 12 months
    │     2. Build input_array = [[JAN, FEB, ..., DEC, ANNUAL]]   shape (1, 13)
    │     3. Normalize: input_scaled = (input_array - mean) / std
    │     4. model.predict(input_scaled) → single float 0.0–1.0
    │     5. Classify: ≥0.7 → danger | 0.4–0.69 → warning | <0.4 → safe
    │     6. Return PredictionResponse JSON
    │
    └── GET /health
          Returns { status: "healthy", model_loaded: bool }
```

**How the fallback works:**
```
floodService.ts calls fetch("/predict", { signal: AbortController(8000ms) })
    ├─ Response received within 8s
    │     → Parse JSON → build HourlyPrediction[] → update AppContext
    │
    └─ AbortError (timeout) OR network error
          → import predictionGenerator.ts
          → generatePredictions(location, date)
              Uses seeded deterministic math + Malaysian monsoon patterns
              → Returns identical-looking HourlyPrediction[] array
          → update AppContext (user sees no difference)
```

### 7.2 API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/` | Welcome message + link to `/docs` |
| `GET` | `/health` | Model load status — use before calling /predict |
| `POST` | `/predict` | Main ANN inference (JSON body) |
| `POST` | `/predict-simple` | Query-param shorthand for quick testing |
| `GET` | `/docs` | FastAPI auto-generated Swagger UI |

### 7.3 ANN Model Details

| Property | Value |
|----------|-------|
| File | `flood_detector.h5` (Keras HDF5 format, 51 KB) |
| Architecture | `Dense(n) → ReLU → Dense(n) → ReLU → Dense(1) → Sigmoid` |
| Input | 13 features: JAN–DEC monthly rainfall + ANNUAL_RAINFALL (all in mm) |
| Output | Single float ∈ [0.0, 1.0] — flood probability |
| Training Data | Malaysia Flood Dataset 2000–2010 (historical rainfall CSV) |
| Preprocessing | StandardScaler (zero mean, unit variance normalization) |
| TFLite version | `flood_detector.tflite` (8 KB) — available for mobile/edge inference |

### 7.4 Request/Response Example

```json
// POST /predict
// Request:
{ "JAN":250,"FEB":180,"MAR":200,"APR":210,"MAY":190,
  "JUN":160,"JUL":180,"AUG":210,"SEP":230,"OCT":310,
  "NOV":330,"DEC":310 }

// Response:
{
  "flood_probability": 0.83,
  "flood_predicted": true,
  "risk_level": "danger",
  "confidence": 0.66,
  "input_data": { "monthly_rainfall": {...}, "annual_rainfall": 2760.0 }
}
```

---

## 8. AI & ML Subsystems

### 8.1 Gemini 1.5 Flash — Report Verification Pipeline

This is the most complex AI flow. A user photo and text description are sent to Google's multimodal vision model which returns a structured flood severity verdict.

```
EmergencyMode
  │  User has: photo (base64 JPEG) + description text + GPS coords
  │  User taps "Verify with AI"
  ▼
AIVerification.tsx
  │  calls: verifyFloodReport(photo, description)
  ▼
openai.ts :: callGeminiAPI(base64Image, mimeType, description)
  │
  │  Constructs request body:
  │  {
  │    "contents": [{
  │      "parts": [
  │        { "inlineData": { "mimeType": "image/jpeg", "data": "<base64>" } },
  │        { "text": "Analyze this flood report image. Description: '...'
  │                   Return JSON with: detected_type, severity, is_verified,
  │                   confidence, summary, ai_feedback, depth_estimate, anomalies" }
  │      ]
  │    }]
  │  }
  │
  │  POST generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
  │  Header: x-goog-api-key: $VITE_GEMINI_API_KEY
  │
  ▼
Gemini 1.5 Flash (Google's server)
  │  Analyzes: image pixels + text context together
  │  Returns: { "candidates": [{ "content": { "parts": [{ "text": "{ detected_type... }" }] } }] }
  ▼
aiVerification.ts :: parseGeminiResponse(rawResponse)
  │  Extracts JSON from response text
  │  Maps to typed AIVerificationResult object:
  │  {
  │    confidence: 91,
  │    status: 'VERIFIED',
  │    waterDetected: true,
  │    depthEstimate: '~0.8m',
  │    anomalies: [],
  │    crossRefStatus: 'CONSISTENT',
  │    summary: 'Significant rising water visible on road surface',
  │    rawAiResponse: { ...full Gemini JSON for audit... },
  │    apiDurationMs: 2340
  │  }
  ▼
AIVerification.tsx displays result:
  │  ✅ Confidence bar animated to 91%
  │  Badge: "VERIFIED" (green) or "UNVERIFIED" (red)
  │  Summary text shown
  │  Raw Gemini JSON expandable for demo
  ▼
reportsService.updateReportAI(reportId, aiResult)
  └── Firestore updateDoc → aiResult field written to report document
```

**Fallback when API key is missing:**
```
callGeminiAPI() → key absent → keyword mock:
  IF description.toLowerCase().includes('flood' OR 'water' OR 'banjir')
    AND photo attached
  THEN return mock VERIFIED result (confidence: 75)
  ELSE return UNVERIFIED result (confidence: 30)
```

### 8.2 Prediction Generator — Demo AI Simulation

File: `src/utils/predictionGenerator.ts`

When the FastAPI backend is offline, this module generates a realistic 24-hour flood prediction timeline so the demo always works. It does **not** use a real ML model — it uses deterministic math seeded on the date and Malaysian monsoon seasonality to produce plausible-looking values.

```
generatePredictions(location, currentDate)
  │
  ├── Determine monsoon season from month (northeast/southwest monsoon)
  ├── Base probability from season (Oct–Jan higher, Jun–Aug lower)
  ├── Add ±noise seeded on date.getDay() + location.id hash
  ├── Produce peak risk at a realistic hour (afternoon thunderstorm pattern)
  └── Return HourlyPrediction[] (24 items)
       Each: { hour, time, riskLevel, probability, rainfall }
```

---

## 9. External API Integrations

### 9.1 OSRM Routing — How It Works

OSRM (Open Source Routing Machine) is a high-performance routing engine that uses the OpenStreetMap road network. It returns real turn-by-turn routes along actual Malaysian roads.

```
pathfinding.ts :: calculateRoute(userPosition, shelter, transportMode)
  │
  ├─ Build URL:
  │   https://router.project-osrm.org/route/v1/{profile}/
  │   {userLng},{userLat};{shelterLng},{shelterLat}
  │   ?overview=full&geometries=geojson&steps=true
  │
  │   Profile mapping:
  │     Car        → 'driving'              (city roads, highways)
  │     Motorcycle → 'driving' (time ×0.85) (faster than car estimate)
  │     Walk       → 'foot'                 (pedestrian paths, bridges)
  │
  ├─ fetch() with 8-second AbortController signal
  │
  ├─ [SUCCESS] Parse response:
  │     routes[0].geometry.coordinates  → Coordinates[]  (map polyline)
  │     routes[0].legs[0].steps         → NavigationStep[] (turn-by-turn)
  │     routes[0].distance              → total metres → km
  │     routes[0].duration              → total seconds → minutes
  │
  └─ [TIMEOUT / FAILURE] Curved interpolation fallback:
        Generate smooth arc (8 midpoints via sinusoidal offset)
        between userPosition → shelter
        No step instructions in fallback mode
  │
  ▼
Route object stored in AppContext
NavigationPage reads it → draws Leaflet polyline + step panel
```

### 9.2 OpenStreetMap / Leaflet

| Property | Detail |
|----------|--------|
| Tile URL | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` |
| Library | Leaflet 1.9 + React-Leaflet 5 wrapper |
| Usage | ShelterPage map, NavigationPage map, ReportPage map |
| Overlays added | `FloodZoneLayer` (SVG polygons), `FloodReportLayer` (custom markers) |
| Attribution | OpenStreetMap contributors (shown in map corner) |

### 9.3 Google Gemini 1.5 Flash

| Property | Detail |
|----------|--------|
| Model ID | `gemini-1.5-flash` |
| Modality | Vision + Text (multimodal) |
| API Endpoint | `generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent` |
| Auth | `x-goog-api-key` header with `VITE_GEMINI_API_KEY` |
| Input | Base64 JPEG inline data + structured text prompt |
| Output | Text containing JSON flood analysis |
| Avg Latency | ~2–4 seconds for a typical flood photo |

---

## 10. User Roles & Access Control

### 10.1 Role Definitions

| Role | How Identified | Capabilities |
|------|---------------|-------------|
| **Anonymous** | `user === null` | View login/signup only |
| **Authenticated User** | Firebase `user !== null` | All features except moderator actions (FYP: can access) |
| **Moderator (Admin)** | Currently same as auth user (FYP) | Approve/reject/delete reports |

> ⚠️ **Production plan:** Use Firebase Custom Claims. Set `{ admin: true }` on moderator accounts via Firebase Admin SDK. Check in Firestore Rules and in `ModeratorPanel.tsx` with `user.getIdTokenResult().claims.admin`.

### 10.2 Feature Access Matrix

| Feature | Anonymous | Auth User | Moderator |
|---------|:---------:|:---------:|:---------:|
| View login/signup pages | ✅ | ↪️ /home | ↪️ /home |
| View Home / ANN Predictions | ❌ | ✅ | ✅ |
| View Shelter Map + Navigate | ❌ | ✅ | ✅ |
| Submit Flood Report | ❌ | ✅ | ✅ |
| View Community Report Pins | ❌ | ✅ | ✅ |
| View 3D Simulation | ❌ | ✅ | ✅ |
| Edit Own Profile | ❌ | ✅ | ✅ |
| Access Moderator Panel | ❌ | ✅ (FYP) | ✅ |
| Approve / Reject Reports | ❌ | ✅ (FYP) | ✅ |
| Override AI Decisions | ❌ | ✅ (FYP) | ✅ |
| Delete Reports | ❌ | ✅ (FYP) | ✅ |

---

## 11. Application State Management

### 11.1 Two-Context Architecture

FloodWay deliberately separates auth state from app data state. This avoids the `AuthContext` from becoming a "god context" with unrelated data, and makes re-renders more surgical.

```
AuthContext  (src/contexts/AuthContext.tsx)
  Purpose: Firebase auth state only
  ├── user: Firebase.User | null
  ├── loading: boolean
  └── methods: signIn, signUp, signInWithGoogle, logOut,
               updateUserProfile, updateUserEmail, updateUserPassword

AppContext   (src/store/AppContext.tsx)
  Purpose: in-flight app data (navigation, prediction, location)
  ├── currentScreen: AppScreen
  ├── selectedLocation: Location | null     ← user's chosen area
  ├── userPosition: Coordinates             ← device GPS
  ├── prediction: DailyPrediction | null    ← ANN result (24h)
  ├── selectedShelter: Shelter | null       ← chosen destination
  ├── route: Route | null                   ← OSRM calculated route
  ├── isLoading: boolean
  └── transportMode: 'car' | 'motorcycle' | 'walk'
```

### 11.2 What Lives Where

| State | Location | Why |
|-------|---------|-----|
| Firebase user token | Firebase IndexedDB | Managed by Firebase SDK |
| React user object | `AuthContext` | Needed by many components |
| OSRM route | `AppContext` | Passed from ShelterPage to NavigationPage |
| ANN prediction | `AppContext` | Set on home load, read by timeline components |
| Report sub-screen | `ReportPage` local state | Only used inside one page |
| 3D flood level | `SimulationPage` local state | Only used inside one page |
| Active map viewport | `ShelterPage` local state | Only used inside one page |

---

## 12. Data Flow Diagrams — Detailed Walkthroughs

Each diagram below shows the exact sequence of function calls, network requests, and state updates for a key user journey. Read them top-to-bottom.

---

### 12.1 Flood Prediction — Home Page Load

**What the user sees:** The home screen appears, fills in with a flood risk timeline, and an alert card says SAFE / WARNING / DANGER.

**What actually happens:**

```
1. User navigates to /home
      │
      ▼
2. HomePage.tsx mounts
   useEffect runs → calls floodService.getFloodPrediction(userPosition)
      │
      ▼
3. floodService.ts
   Sets AbortController timeout = 8000ms
   Sends: POST http://localhost:8000/predict
   Body: { JAN:250, FEB:180, ..., ANNUAL_RAINFALL:2760 }
      │
      ├──── NETWORK PATH A: Backend is running ──────────────────────────────┐
      │                                                                       │
      │  FastAPI receives request                                             │
      │  → pydantic validates RainfallData                                   │
      │  → if ANNUAL_RAINFALL not given: sums months                         │
      │  → builds numpy array shape (1, 13)                                  │
      │  → normalise: (input - scaler_mean) / scaler_std                     │
      │  → model.predict() → probability float e.g. 0.83                     │
      │  → if ≥0.7 → "danger" | 0.4–0.69 → "warning" | <0.4 → "safe"       │
      │  → returns PredictionResponse JSON                                    │
      │                                                                       │
      │  floodService parses JSON                                             │
      │  → creates 24× HourlyPrediction from single probability              │
      │     (distributes risk across hours using time-of-day weighting)      │
      │  → returns DailyPrediction                                           │
      │                                                          ◄───────────┘
      │
      └──── NETWORK PATH B: Backend offline / timeout ──────────────────────┐
                                                                             │
             AbortController fires after 8s → AbortError caught             │
             imports predictionGenerator.ts                                  │
             generatePredictions(location, today)                            │
             → calculates Malaysian monsoon base probability for this month  │
             → adds deterministic noise seeded on date                      │
             → returns identical DailyPrediction structure                  │
                                                          ◄──────────────────┘
      │
      ▼
4. AppContext.dispatch({ type: 'SET_PREDICTION', prediction })
      │
      ▼
5. React re-renders HomePage:
   FloodTimeline    → renders 24 coloured bars (green/amber/red by riskLevel)
   FloodTimelineScrubber → allows hour scrubbing, shows probability on hover
   AlertCard        → shows overallRisk string + alert message
   RiskIndicator    → pulsing ring colour matches risk level
   WeatherCard      → shows rainfall mm + wind speed from prediction data
```

---

### 12.2 Evacuation Routing — Shelter to Navigation

**What the user sees:** Picks a shelter, chooses transport, taps navigate → map appears with a blue route drawn on real roads.

```
1. User on /shelters
   ShelterPage loads 5 hardcoded Malaysian PPS shelters
   Leaflet map renders with OpenStreetMap tiles
      │
      ▼
2. User selects Transport Mode
   Local state: transportMode = 'car' | 'motorcycle' | 'walk'
   AppContext.dispatch({ type: 'SET_TRANSPORT_MODE', mode })
      │
      ▼
3. User taps shelter card → "Navigate to Shelter"
   ShelterPage calls pathfinding.calculateRoute(userPos, shelter, mode)
      │
      ▼
4. pathfinding.ts constructs OSRM URL:
   profile = mode === 'walk' ? 'foot' : 'driving'
   url = `https://router.project-osrm.org/route/v1/${profile}/
          ${userPos.lng},${userPos.lat};${shelter.lng},${shelter.lat}
          ?overview=full&geometries=geojson&steps=true`
      │
      ├──── OSRM ONLINE: ───────────────────────────────────────────────────┐
      │                                                                      │
      │  fetch(url, { signal: abortController(8000ms) })                    │
      │  OSRM server: runs Contraction Hierarchies on OSM road graph        │
      │  Returns: routes[0]:                                                │
      │    .distance   → total metres                                        │
      │    .duration   → total seconds                                       │
      │    .geometry.coordinates → [[lng,lat], [lng,lat], ...]  polyline   │
      │    .legs[0].steps → [{instruction, distance, maneuver}...]          │
      │                                                                      │
      │  pathfinding parses:                                                │
      │    Coordinates[] = geometry.coordinates.map([lng,lat] → {lat,lng}) │
      │    NavigationStep[] = steps.map(s → { instruction, distance, pos }) │
      │    if mode === 'motorcycle': estimatedTime × 0.85                   │
      │  Returns Route object                                                │
      │                                                         ◄───────────┘
      │
      └──── OSRM OFFLINE / TIMEOUT: ───────────────────────────────────────┐
                                                                            │
             Generate curved arc fallback:                                  │
             8 intermediate points along great-circle between user+shelter  │
             Offset by sinusoidal curve to look road-like                   │
             estimatedTime = distance / avgSpeed (by mode)                  │
             steps = [] (no turn-by-turn in fallback)                       │
             Returns Route with isSafe = false flagged                      │
                                                         ◄──────────────────┘
      │
      ▼
5. AppContext.dispatch({ type: 'SET_ROUTE', route })
   AppContext.dispatch({ type: 'SET_SHELTER', shelter })
      │
      ▼
6. ShelterPage triggers: navigate(`/navigation/${shelter.id}`)
      │
      ▼
7. NavigationPage mounts
   Reads route from AppContext
   Leaflet renders:
     <Polyline positions={route.path} color="blue" dashArray animated />
     <Marker position={userPos}   icon=userIcon />
     <Marker position={shelter}   icon=shelterIcon />
   StepPanel renders NavigationStep[] as numbered instruction list
   Header shows total distance + estimated time
```

---

### 12.3 Community Report — Full Lifecycle

**What the user sees:** Takes a photo, Gemini analyses it, submits, moderator approves, pin appears on shelter map.

```
1. User on /reports → taps "Emergency Report"
   ReportPage: appScreen → 'EMERGENCY'
      │
      ▼
2. EmergencyMode mounts:
   navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
   → Camera stream shown in <video> element
   navigator.geolocation.getCurrentPosition()
   → autoTags: { lat, lng, accuracy, timestamp, compassHeading }
      │
      ▼
3. User frames scene + taps capture button
   canvas.drawImage(video) → canvas.toBlob() → FileReader → base64 dataURL
   photo stored in local component state
   User types description: "Rising water blocking Jalan Ampang"
   User selects category: RISING_WATER
      │
      ▼
4. User taps "Verify with AI"
   ReportPage: appScreen → 'VERIFICATION'
   callGeminiAPI(base64, 'image/jpeg', description) called:
     POST https://generativelanguage.googleapis.com/...gemini-1.5-flash:generateContent
     Header: x-goog-api-key: VITE_GEMINI_API_KEY
     Body: { contents: [{ parts: [inlineData(base64), text(prompt)] }] }
     ~2-4 seconds ...
   Gemini returns: { candidates:[{ content:{ parts:[{ text: "{...json...}" }] } }] }
   parseGeminiResponse() extracts structured JSON
   AIVerificationResult typed object created:
     { status:'VERIFIED', confidence:91, waterDetected:true,
       depthEstimate:'~0.8m', summary:'Rising water visible...', ... }
   reportsService.updateReportAI(id, aiResult) → Firestore updateDoc
   Golden Record console.log written
      │
      ▼
5. User sees result: ✅ VERIFIED, 91% confidence, depth ~0.8m
   User taps "Submit Report"
   ReportPage: appScreen → 'REPORT'
      │
      ▼
6. reportsService.submitReport(report):
   addDoc(collection(db, 'floodReports'), {
     photoDataURLs: [base64],
     category: 'RISING_WATER',
     description: 'Rising water blocking Jalan Ampang',
     autoTags: { lat:3.157, lng:101.712, accuracy:10, timestamp, compassHeading },
     aiResult: { status:'VERIFIED', confidence:91, ... },
     humanReview: { status:'PENDING', reviewedAt:null, moderatorNote:null },
     createdAt: new Date().toISOString()
   })
   Firestore returns auto-generated documentId
   App navigates back to MAP sub-screen
      │
      ▼
7. Moderator opens /reports → Moderator Panel tab
   reportsService.getAllReports() → Firestore getDocs → all reports loaded
   Report card shows: photo thumb | AI: VERIFIED 91% | Human: ⏳ PENDING
   Moderator taps APPROVE:
     reportsService.updateReportHumanReview(id, {
       status: 'APPROVED', reviewedAt: now, moderatorNote: null
     })
     → Firestore updateDoc
      │
      ▼
8. isFullyVerified(report):
   humanReview.status === 'APPROVED' AND aiResult.status === 'VERIFIED'
   → returns true
   FloodReportLayer re-fetches getVerifiedReports()
   Report now appears as coloured pin on ShelterPage map
   Colour: yellow (RISING_WATER severity 2)
   Popup: category emoji + description + timestamp
```

---

### 12.4 3D Flood Simulation — Render Loop

**What the user sees:** A 3D isometric city that fills with animated water when they change flood level.

```
1. User navigates to /simulation
   SimulationPage mounts
      │
      ▼
2. React Three Fiber <Canvas> initialises WebGL context
   Scene setup:
     Environment preset='sunset' (drei) — HDRI lighting
     FogExp2(color, density) — atmospheric depth
     DirectionalLight + PointLight (position, intensity from flood level)
      │
      ▼
3. useGLTF('/city.glb') loads Blender-exported city model
   GLB is in public/ — served as static file from Netlify/Vite
   Three.js parses mesh geometry + materials
   <primitive object={scene} scale={1} position={[0,-1,0]} />
      │
      ▼
4. Water system (ShaderMaterial):
   vertexShader: 3-layer sine wave displacement
     wave frequency + amplitude controlled by floodLevel uniforms
   fragmentShader: deep blue → shallow teal gradient
     + foam white edges where depth < threshold
     + time uniform drives animation
   <mesh position={[0, waterHeight, 0]} visible={showWater}>
     <planeGeometry args={[40, 40, 80, 80]} />  ← high subdivision for waves
     <shaderMaterial uniforms={waterUniforms} />
   </mesh>
   waterHeight interpolated: Normal=0.0 | Medium=1.5 | High=4.2
      │
      ▼
5. Rain system (InstancedMesh):
   200 rain drop instances
   Each drop: thin cylinder, random x/z position in 20×20 area
   useFrame((state, delta) → {
     each drop: position.y -= speed * delta
     if y < groundLevel: reset to top with new random x,z
     instanceMatrix.needsUpdate = true
   })
   Visible only when showRain && floodLevel !== 'normal'
      │
      ▼
6. Debris system (InstancedMesh):
   10 debris pieces (boxes, different sizes)
   Float on water surface: position.y = waterHeight
   Slow drift: position.x += sin(time * freq) * 0.002
      │
      ▼
7. User taps flood level button: Normal / Medium / High
   React state: floodLevel = 'medium'
   useFrame smoothly lerps waterHeight toward target
   PointLight color changes (blue → red for critical)
   FogExp2 density increases for heavy flood atmosphere
      │
      ▼
8. OrbitControls (drei) always enabled:
   Mouse drag → rotate camera
   Scroll wheel → zoom in/out
   Two-finger pinch (mobile) → zoom
   Touch drag → orbit
   No programmatic camera lock applied
```

---

## 13. File & Folder Structure

Every file is annotated with its role in the system.

```
FloodWay/                              ← Project root
│
├── .env                               ← Secret keys (git-ignored)
│     VITE_FIREBASE_API_KEY=...        ← Firebase project API key
│     VITE_FIREBASE_AUTH_DOMAIN=...    ← Firebase auth domain
│     VITE_FIREBASE_PROJECT_ID=...     ← Firebase project ID
│     VITE_FIREBASE_STORAGE_BUCKET=...
│     VITE_FIREBASE_MESSAGING_SENDER_ID=...
│     VITE_FIREBASE_APP_ID=...
│     VITE_GEMINI_API_KEY=...          ← Google Gemini API key
│
├── index.html                         ← Vite SPA entry — single <div id="root">
├── vite.config.ts                     ← Build config (React plugin, path aliases)
├── tsconfig.app.json                  ← TypeScript strict mode config
├── package.json                       ← npm scripts + dependency list
├── components.json                    ← shadcn/ui component registry config
├── netlify.toml                       ← [[redirects]] /* → /index.html (SPA routing)
├── firestore.rules                    ← Firestore security rules (auth-gated CRUD)
│
├── public/
│   └── city.glb                       ← Blender GLTF city model for 3D simulation
│
├── backend/
│   ├── main.py                        ← FastAPI server + ANN inference endpoint
│   └── requirements.txt               ← fastapi uvicorn tensorflow numpy pydantic
│
├── flood_detector.h5                  ← Trained Keras ANN model (51 KB, HDF5)
├── flood_detector.tflite              ← Mobile-optimised TFLite version (8 KB)
├── _MalaysiaFloodDataset_...csv       ← Historical training data (2000-2010)
├── flood_detection_using_ann.ipynb    ← Training notebook (Jupyter/Colab)
│
└── src/
    ├── main.tsx                       ← React entry: ReactDOM.createRoot + BrowserRouter
    ├── App.tsx                        ← All routes + RequireAuth + RedirectIfAuthed guards
    ├── App.css                        ← Global animation keyframes + base styles
    ├── index.css                      ← Tailwind base import
    │
    ├── lib/
    │   ├── firebase.ts                ← initializeApp, getAuth, getFirestore, googleProvider
    │   └── utils.ts                   ← shadcn/ui cn() class merging utility
    │
    ├── contexts/
    │   └── AuthContext.tsx            ← AuthProvider + useAuth hook (wraps Firebase Auth)
    │
    ├── store/
    │   ├── AppContext.tsx             ← AppProvider + useApp hook (global app state)
    │   └── index.ts                   ← Re-exports AppProvider, useApp
    │
    ├── types/
    │   ├── app.ts                     ← TransportMode, Coordinates, Shelter, Route,
    │   │                                 HourlyPrediction, DailyPrediction, AppState
    │   ├── report.ts                  ← FloodReport, AIVerificationResult, HumanReview,
    │   │                                 ReportCategory, VerificationStatus, isFullyVerified()
    │   └── flood.ts                   ← Flood domain types (risk levels, zone types)
    │
    ├── services/
    │   ├── floodService.ts            ← getFloodPrediction() → POST /predict + 8s fallback
    │   └── reportsService.ts          ← submitReport, getAllReports, getVerifiedReports,
    │                                      updateReportHumanReview, updateReportAI, deleteReport
    │
    ├── utils/
    │   ├── openai.ts                  ← callGeminiAPI() (misnamed — calls Gemini, not OpenAI)
    │   ├── aiVerification.ts          ← verifyFloodReport(), parseGeminiResponse(), golden record
    │   ├── pathfinding.ts             ← calculateRoute() → OSRM fetch + curved fallback
    │   └── predictionGenerator.ts     ← generatePredictions() → demo 24h risk timeline
    │
    ├── pages/
    │   ├── WelcomePage.tsx            ← Login: glassmorphism card, otter SVG, email+Google auth
    │   ├── SignUpPage.tsx             ← Registration: email, password, displayName
    │   ├── LoadingPage.tsx            ← Onboarding animation + GPS location permission flow
    │   ├── HomePage.tsx               ← Dashboard: ANN prediction call, FloodTimeline, AlertCard
    │   ├── ShelterPage.tsx            ← Shelter list + Leaflet map + transport picker + OSRM
    │   ├── NavigationPage.tsx         ← Full-screen Leaflet + route polyline + step panel
    │   ├── ReportPage.tsx             ← 4-screen hub: MAP→EMERGENCY→VERIFICATION→REPORT
    │   ├── SimulationPage.tsx         ← Three.js Canvas: water shader, rain, debris, controls
    │   ├── ProfilePage.tsx            ← Edit name/email/password, sign out, avatar
    │   ├── FutureWorkPage.tsx         ← Planned features / roadmap display
    │   └── index.ts                   ← Re-exports all pages
    │
    ├── components/
    │   ├── AlertCard.tsx              ← Coloured banner: SAFE/WARNING/DANGER with icon
    │   ├── BottomNav.tsx              ← Tab bar for 5 main routes (conditional render)
    │   ├── FloodTimeline.tsx          ← 24 svg bar-chart columns, colour-coded by riskLevel
    │   ├── FloodTimelineScrubber.tsx  ← Drag scrubber → shows hour detail popover
    │   ├── FloodZoneLayer.tsx         ← SVG polygon flood hazard zones on Leaflet map
    │   ├── FloodReportLayer.tsx       ← Custom Leaflet markers from verified Firestore reports
    │   ├── ForecastOverlay.tsx        ← Weather conditions overlay card on home map
    │   ├── RiskIndicator.tsx          ← Animated concentric pulsing ring (green/amber/red)
    │   ├── UserAvatar.tsx             ← Profile photo or initials fallback circle
    │   ├── WeatherCard.tsx            ← Rain mm/h + wind speed mini widget
    │   ├── report/
    │   │   ├── MapScreen.tsx          ← Community report map with category filter chips
    │   │   ├── EmergencyMode.tsx      ← Camera stream + GPS capture + category selector
    │   │   ├── AIVerification.tsx     ← Gemini result card: badge, bar, summary, raw JSON
    │   │   ├── ModeratorPanel.tsx     ← Admin queue: all reports + APPROVE/REJECT/OVERRIDE/DELETE
    │   │   ├── ReportForm.tsx         ← Standard (non-emergency) text-only report form
    │   │   └── ReportCard.tsx         ← Report list item: thumbnail + AI badge + status
    │   └── ui/
    │       ├── button.tsx             ← shadcn Button variants
    │       ├── card.tsx               ← shadcn Card + Header + Content
    │       ├── badge.tsx              ← shadcn Badge (status chips)
    │       ├── dialog.tsx             ← shadcn Dialog (confirmation modals)
    │       └── ...                    ← Other shadcn primitives
    │
    ├── hooks/                         ← Custom React hooks (useGeolocation, etc.)
    ├── data/                          ← Static JSON: shelter coordinates, flood zone polygons
    ├── screens/                       ← Legacy screen components (pre-refactor)
    └── assets/                        ← SVG icons, otter mascot image
```

---

## 14. Deployment Architecture

### 14.1 Build & Deploy Pipeline

This diagram shows how code written on the developer's machine gets to the end user's browser.

```
Developer machine
  ├── git add . && git commit -m "..."
  └── git push origin main
        │
        ▼
GitHub Repository (remote)
        │
        │  Netlify listens via webhook (auto-deploy on push to main)
        ▼
Netlify Build Server
  ├── git clone repo
  ├── npm ci                          ← install exact versions from package-lock.json
  ├── npm run build                   ← Vite builds:
  │     • TypeScript compile + type-check
  │     • Tree-shake unused code
  │     • Bundle + minify JS/CSS
  │     • Replace VITE_* env vars    ← from Netlify Environment Variables settings
  │     • Output → /dist/ folder
  └── Deploy /dist/ to Netlify CDN
        │
        ▼
Netlify CDN (Global Edge Network — 100+ PoPs worldwide)
  ├── Serves: /dist/index.html
  ├── Serves: /dist/assets/index-[hash].js  (main bundle ~500 KB gzipped)
  ├── Serves: /dist/assets/index-[hash].css
  ├── Serves: /dist/city.glb            (3D model, served as static binary)
  └── netlify.toml redirect rule:
        [[redirects]]
        from = "/*"
        to   = "/index.html"
        status = 200
        → All unknown paths serve index.html → React Router handles routing
        │
        ▼
End User's Browser
  ├── Downloads index.html + JS bundle
  ├── React SPA boots, AuthProvider checks Firebase IndexedDB token
  ├── Firebase SDK connects to Firebase cloud (auth + Firestore)
  ├── fetch() calls to: OSRM API | Gemini API | FastAPI backend
  └── Three.js uses browser WebGL for 3D simulation (no server needed)
```

### 14.2 Service URLs Reference

| Service | Dev URL | Prod URL | Notes |
|---------|---------|---------|-------|
| Frontend | `localhost:5173` | Netlify deploy URL | Vite dev server |
| ANN Backend | `localhost:8000` | ❌ Not deployed | Local Python only |
| Backend Docs | `localhost:8000/docs` | ❌ N/A | Swagger UI |
| Firebase Console | — | console.firebase.google.com | Auth + Firestore admin |
| OSRM | — | `router.project-osrm.org` | Public demo server |
| Gemini API | — | `generativelanguage.googleapis.com` | Google Cloud |
| OSM Tiles | — | `tile.openstreetmap.org` | Map tile CDN |

> ⚠️ **The FastAPI backend is not cloud-deployed.** It runs locally on the developer's machine for demo. When unavailable, the frontend uses `predictionGenerator.ts` as a seamless fallback that users cannot distinguish from real predictions.

---

## 15. Security Model

### 15.1 Authentication Security

- Firebase Auth issues **JWT tokens** (short-lived, ~1 hour). Firebase SDK auto-refreshes via the long-lived refresh token stored in **browser IndexedDB** — never `localStorage` (XSS-safe).
- All Firestore reads/writes require a valid Firebase JWT (`request.auth != null` in rules). Unauthenticated requests are rejected by Firebase's backend, not just the frontend guard.
- Google OAuth popup uses Firebase's domain allowlist — only configured origins can trigger the OAuth flow.

### 15.2 Secrets & Environment Variables

| Variable | Embedded In | Risk Level | Mitigation |
|----------|------------|-----------|------------|
| `VITE_FIREBASE_API_KEY` | JS bundle | Low — scoped to Firebase project, Firestore rules enforce auth | Domain restriction in Firebase console |
| `VITE_FIREBASE_PROJECT_ID` | JS bundle | Very Low — public in many Firebase apps | None needed |
| `VITE_GEMINI_API_KEY` | JS bundle | **HIGH** — anyone who views bundle source can use it | Move to server-side proxy in production |

> ⚠️ **Critical gap:** `VITE_GEMINI_API_KEY` is visible to anyone who opens DevTools → Sources. In production this should be a **Netlify serverless function** that holds the key server-side and proxies the Gemini call. The browser calls `/api/verify-flood` on Netlify, which calls Gemini with the secret key.

### 15.3 Firestore Security

```
Current rules allow any authenticated user to update/delete reports.
Production hardening requires:

match /floodReports/{reportId} {
  allow read:   if request.auth != null;
  allow create: if request.auth != null;
  allow update: if request.auth.token.admin == true;   ← add this
  allow delete: if request.auth.token.admin == true;   ← add this
}
```

Set admin claim via Firebase Admin SDK (server-side only):
```python
auth.set_custom_user_claims(uid, {'admin': True})
```

### 15.4 Photo Security

- Photos are stored as **base64 strings inside Firestore documents**
- Firestore document max size = 1 MB → JPEG photos must be compressed < ~700 KB
- Only authenticated users can read photo data (Firestore rules)
- No public CDN exposure of photos (unlike Firebase Storage URLs which are publicly guessable)

### 15.5 CORS

- FastAPI backend uses `allow_origins=["*"]` — acceptable for local dev only
- Production: restrict to `["https://your-netlify-domain.netlify.app"]`

---

## 16. Future Architecture Evolution

### 16.1 Planned Technical Upgrades

| Feature | Why | Tech Approach |
|---------|-----|--------------|
| **LSTM Sensor Fusion Model** | ANN uses only historical rainfall; LSTM would use live sensor streams for real-time accuracy | Self-hosted Python LSTM endpoint + DID river sensor WebSocket feed |
| **Flood-Aware Dynamic Routing** | OSRM currently ignores which roads are flooded | Self-hosted OSRM + custom penalty weights injected from Firestore flood reports |
| **Firebase Storage for Photos** | Base64 in Firestore hits document size limits | Upload to Firebase Storage bucket, store download URL in Firestore document |
| **Admin Custom Claims** | Any user can currently access Moderator Panel | Firebase Admin SDK sets `{ admin: true }` claim; enforced in both Firestore rules and frontend |
| **Gemini API Server Proxy** | API key exposed in client bundle | Netlify Edge Function or Cloud Run function holds key server-side |
| **Community Geofenced Chat** | Hyperlocal flood info sharing | Firestore collection with Geohash proximity filter (within 2 km) |
| **DID IoT Sensor Feed** | Real-time river gauge data from Malaysia's DID | DID open data API → Cloud Function → Firestore trigger |
| **GPS-Anchored 3D Simulation** | City model is generic KL; user wants to see THEIR street | Mapbox 3D Tiles or CesiumJS + overlay LSTM water level prediction |
| **WebXR Flood AR** | Point camera at street → see water level overlaid | WebXR API + ARCore/ARKit depth estimation |

### 16.2 Target Production Architecture (v4.0)

```
User Device (Browser / PWA)
        │
        │  HTTPS
        ▼
Netlify CDN  (React SPA static bundle)
        │
        ├── /api/verify-flood  →  Netlify Edge Function
        │                            └── calls Gemini API (key server-side)
        │
        ├── Firebase Auth      →  Firebase Cloud (auth tokens, Google OAuth)
        │
        ├── Firestore          →  Firebase Cloud (reports, user data, sensor readings)
        │
        ├── Firebase Storage   →  Firebase Cloud (flood report photos as URL refs)
        │
        ├── OSRM (self-hosted) →  Cloud Run container
        │                            └── custom flood weight injector
        │                            └── reads Firestore flood report density
        │
        └── ML Backend         →  Cloud Run container (Python)
                                     ├── LSTM inference endpoint
                                     ├── DID sensor WebSocket client
                                     ├── GPM satellite nowcast client
                                     └── MetMalaysia + Google Forecast API integrations
                                               │
                                               ▼
                                     External Data Sources:
                                     ├── DID Malaysia river sensors (IoT)
                                     ├── GPM / JAXA satellite rainfall
                                     ├── MetMalaysia API (weather data)
                                     └── Google Forecast API (precipitation)
```

### 16.3 Intelligence Evolution Timeline

```
PAST                    NOW (v3.0)                 FUTURE
────────────────────────────────────────────────────────────►

Prediction:  Rule-Based ──► ANN (h5) ──────────────► LSTM Sensor Fusion ──► Foundation Model
Routing:     A* Grid ─────► OSRM Real-Road ────────► Flood-Aware Rerouting ──► Predictive Pre-Evac
Verification: None ────────► Gemini 1.5 Flash ──────► Dual AI+Human ────────► Cross-Sensor Truth
Visualization: 2D Map ─────► 3D WebGL City Sim ─────► GPS 3D Tiles ─────────► WebXR AR Overlay
```

---

*FloodWay System Architecture v3.0 — Because every minute matters during a flood. 🌊*
