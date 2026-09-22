# FloodWay — Folder Structure

## Root

```
FloodWay/
├── docs/                          # AI documentation system (you are here)
├── src/                           # Frontend source code
├── backend/                       # Python FastAPI ML server
├── public/                        # Static assets (served directly)
├── Borneo HackWKDN Submition/     # Hackathon submission files
├── Navigation app/                # Legacy navigation prototypes
├── report feature/                # Legacy standalone report prototype
├── nothing/                       # Alternative ML model experiments
│
├── .env                           # Environment variables (GITIGNORED)
├── .gitignore
├── index.html                     # Vite HTML entry point
├── package.json                   # Node dependencies + scripts
├── vite.config.ts                 # Vite configuration
├── tsconfig.json                  # TypeScript project config
├── tsconfig.app.json              # TypeScript app config
├── tsconfig.node.json             # TypeScript node config
├── eslint.config.js               # ESLint rules
├── components.json                # shadcn/ui configuration
├── firestore.rules                # Firestore security rules
├── netlify.toml                   # Netlify deployment config
│
├── flood_detector.h5              # Trained ANN model (Keras)
├── flood_detector.tflite          # TFLite variant
├── flood_detection_using_ann.ipynb # Training notebook
├── _MalaysiaFloodDataset*.csv     # Training data
├── city.glb                       # 3D city model (duplicate of public/)
│
├── README.md                      # Project readme
├── CONTRIBUTING.md                # Contribution guidelines
├── TEAM_GUIDE.md                  # Team collaboration guide
├── PROJECT_OVERVIEW.md            # Detailed project overview
├── PROJECT_REPORT.md              # Academic report
├── arch.md                        # Previous architecture doc
└── CLAUDE.md                      # AI instruction file
```

## src/ (Frontend)

```
src/
├── main.tsx                       # React entry point (BrowserRouter)
├── App.tsx                        # Route definitions + auth guards
├── App.css                        # Global styles + Tailwind layers
├── index.css                      # Tailwind import
├── docs.tsx                       # In-app documentation component
│
├── pages/                         # Route-level page components
│   ├── HomePage.tsx               # Intelligence dashboard
│   ├── ShelterPage.tsx            # Shelter finder + map
│   ├── NavigationPage.tsx         # Turn-by-turn navigation
│   ├── ReportPage.tsx             # Community Sentinel reports
│   ├── SimulationPage.tsx         # 3D flood simulation (856 lines)
│   ├── ProfilePage.tsx            # User profile management
│   ├── WelcomePage.tsx            # Login page
│   ├── SignUpPage.tsx             # Registration page
│   ├── LoadingPage.tsx            # Onboarding animation
│   ├── LocationPage.tsx           # Location selection
│   ├── FutureWorkPage.tsx         # Future features showcase
│   ├── ReportPage.css             # Report page styles
│   └── index.ts                   # Page exports barrel
│
├── components/                    # Reusable UI components
│   ├── BottomNav.tsx              # Mobile bottom tab bar
│   ├── IoTWidget.tsx              # IoT sensor widget (water tank)
│   ├── EmergencyAlert.tsx         # Full-screen danger alert
│   ├── FloodReportLayer.tsx       # Map overlay for reports
│   ├── FloodZoneLayer.tsx         # Map overlay for flood zones
│   ├── FloodTimeline.tsx          # v2 timeline (legacy)
│   ├── FloodTimelineScrubber.tsx  # v2 scrubber (legacy)
│   ├── ForecastOverlay.tsx        # Forecast display
│   ├── RiskIndicator.tsx          # Risk level indicator
│   ├── WeatherCard.tsx            # Weather info card
│   ├── AlertCard.tsx              # Alert display card
│   ├── UserAvatar.tsx             # User profile avatar
│   ├── WhatsAppAlertBanner.tsx    # WhatsApp share banner
│   │
│   ├── report/                    # Report sub-components
│   │   ├── ReportForm.tsx         # Report submission form
│   │   ├── ReportForm.css
│   │   ├── ReportCard.tsx         # Report display card
│   │   ├── ReportCard.css
│   │   ├── AIVerification.tsx     # AI result display
│   │   ├── AIVerification.css
│   │   ├── ModeratorPanel.tsx     # Admin review panel
│   │   ├── ModeratorPanel.css
│   │   ├── MapScreen.tsx          # Report map view
│   │   ├── MapScreen.css
│   │   ├── EmergencyMode.tsx      # Emergency mode UI
│   │   ├── EmergencyMode.css
│   │   └── report.css             # Shared report styles
│   │
│   └── ui/                        # shadcn/ui primitives
│       ├── alert.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       └── progress.tsx
│
├── store/                         # Global state management
│   ├── AppContext.tsx              # Main app context provider
│   └── index.ts                   # Re-export
│
├── contexts/                      # Auth context
│   └── AuthContext.tsx             # Firebase Auth wrapper
│
├── services/                      # API/data services
│   ├── floodService.ts            # ML backend + prediction logic
│   └── reportsService.ts          # Firestore CRUD for reports
│
├── hooks/                         # Custom React hooks
│   ├── useBluetooth.ts            # Web Serial API (IoT)
│   ├── useCamera.ts               # Camera capture
│   └── useGeolocation.ts          # GPS + compass
│
├── utils/                         # Utility functions
│   ├── aiVerification.ts          # AI verification engine
│   ├── openai.ts                  # Gemini API adapter
│   ├── pathfinding.ts             # OSRM routing + flood avoidance
│   └── predictionGenerator.ts     # Simulated predictions
│
├── types/                         # TypeScript type definitions
│   ├── app.ts                     # Core app types
│   ├── report.ts                  # Report + verification types
│   └── flood.ts                   # Flood prediction types
│
├── data/                          # Static data
│   ├── locations.ts               # Shelters + default positions
│   └── floodZones.ts              # Flood zone polygons
│
├── lib/                           # Library utilities
│   ├── firebase.ts                # Firebase initialization
│   └── utils.ts                   # cn() helper (clsx + twMerge)
│
├── screens/                       # Legacy screen components
│   ├── WelcomeScreen.tsx
│   ├── LocationScreen.tsx
│   ├── PredictionScreen.tsx
│   ├── ShelterScreen.tsx
│   ├── NavigationScreen.tsx
│   └── index.ts
│
└── assets/
    └── react.svg
```

## backend/

```
backend/
├── main.py                        # FastAPI server + ML inference
└── requirements.txt               # Python dependencies
```

## public/

```
public/
├── banjir2.jpg                    # Demo flood photo 1
├── banjir3.jfif                   # Demo flood photo 2
├── cctv image.jpg                 # Simulated CCTV feed
├── city.glb                       # 3D city model
├── favicon.svg                    # App favicon (otter mascot)
├── floodway logo.png              # App logo
├── otter-mascot.svg               # Mascot SVG
├── vite.svg                       # Vite default
├── water-level.png                # IoT water level image
└── _redirects                     # Netlify SPA redirect
```

## Key File Sizes (Context Estimation)

| File | Lines | Tokens (est.) |
|---|---|---|
| SimulationPage.tsx | 856 | ~6,000 |
| HomePage.tsx | 554 | ~4,000 |
| AppContext.tsx | 298 | ~2,100 |
| ShelterPage.tsx | ~700 | ~5,000 |
| NavigationPage.tsx | ~500 | ~3,500 |
| pathfinding.ts | 437 | ~3,000 |
| reportsService.ts | 229 | ~1,600 |

> **Note**: Legacy folders (`screens/`, `Navigation app/`, `report feature/`) contain earlier prototypes. The active codebase lives in `src/pages/` and `src/components/`.
