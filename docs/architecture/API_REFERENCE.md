# FloodWay — API Reference

## Backend API (FastAPI @ localhost:8000)

### GET /
Root endpoint.

**Response:**
```json
{ "message": "Welcome to FloodWay API", "docs": "/docs", "health": "/health" }
```

### GET /health
Health check — reports whether the ML model is loaded.

**Response:**
```json
{ "status": "healthy", "model_loaded": true, "version": "1.0.0" }
```

### POST /predict
Main prediction endpoint. Accepts monthly rainfall data and returns flood probability.

**Request Body:**
```json
{
  "JAN": 170.3, "FEB": 165.4, "MAR": 240.8, "APR": 259.5,
  "MAY": 204.4, "JUN": 125.8, "JUL": 127.5, "AUG": 156.3,
  "SEP": 192.7, "OCT": 253.0, "NOV": 288.3, "DEC": 245.8,
  "ANNUAL_RAINFALL": 2429.8
}
```
`ANNUAL_RAINFALL` is optional — calculated from monthly values if omitted.

**Response:**
```json
{
  "flood_probability": 0.73,
  "flood_predicted": true,
  "risk_level": "danger",
  "confidence": 0.46,
  "input_data": { "monthly_rainfall": {...}, "annual_rainfall": 2429.8 }
}
```

**Risk Level Thresholds:**
- `≥ 0.7` → `danger`
- `≥ 0.4` → `warning`
- `< 0.4` → `safe`

### POST /predict-simple
Simplified endpoint with default values for quick testing. Uses query parameters.

## External APIs

### OSRM (Open Source Routing Machine)

**Base URL**: `https://router.project-osrm.org/route/v1`

**Usage** (in `pathfinding.ts`):
```
GET /{profile}/{lng1},{lat1};{lng2},{lat2}?overview=full&geometries=geojson&steps=true&alternatives=3
```

**Profiles**: `driving` (car/motorcycle), `foot` (walk)

**Timeout**: 8 seconds

**Note**: This is the public OSRM demo server. Rate-limited. No API key required.

### Gemini 1.5 Flash

**Library**: `@google/generative-ai`

**Usage** (in `openai.ts`):
- Model: `gemini-1.5-flash`
- Multimodal: Text + inline image data
- System prompt instructs flood-specific analysis
- Returns JSON: `{ detected_type, severity, is_verified, summary, ai_feedback }`

**Fallback**: `mockAnalysis()` returns simulated results when API key is missing or call fails.

## Frontend Service Functions

### floodService.ts

| Function | Description |
|---|---|
| `getFloodPrediction(locationName)` | Fetches prediction from backend, falls back to simulation |
| `getCurrentMonthRainfall()` | Returns current month's rainfall with variation |
| `checkBackendStatus()` | Checks `/health` endpoint (2s timeout) |
| `formatTime(date)` | Formats date for display (en-MY locale) |

### reportsService.ts

| Function | Description |
|---|---|
| `fetchReports()` | Loads from Firestore, deduplicates, auto-purges stale docs |
| `saveReport(report)` | Saves new report via `addDoc` |
| `updateReportHumanReview(id, review)` | Updates moderator review via `updateDoc` |
| `deleteReport(id)` | Permanently deletes from Firestore |
| `INITIAL_REPORTS` | Pre-loaded seed reports for instant rendering |

### pathfinding.ts

| Function | Description |
|---|---|
| `calculateRoute(from, to, mode, prediction)` | Main routing — tries OSRM, selects safest route, falls back to bezier |

### aiVerification.ts

| Function | Description |
|---|---|
| `simulateAIVerification(report)` | Calls Gemini, maps result to app types, logs golden record |

### openai.ts

| Function | Description |
|---|---|
| `analyzeFloodImage(imageDataUrl, description)` | Sends image+text to Gemini, parses JSON response |
