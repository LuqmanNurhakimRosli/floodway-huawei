# FloodWay: overview of stack, features, architecture, workflow and model evaluation

**Written for:** the FloodWay team and judges who want to know what is built, what is designed, and how each model is tested.
**Date:** 2026-10-20. **Source:** the code in this repo, checked by reading it. Where a fact comes from team notes and is not in this repo, the text says so.

## 1. What FloodWay does

FloodWay warns residents of flood-prone places in Malaysia before water reaches them. It combines:

- **Live Vision**: camera and depth readings turned into a four-level warning (Normal, Advisory, Warning, Danger).
- **Citizen reports**: a photo and a description, with an optional AI opinion on the photo.
- **Map and routing**: flood-prone areas, verified-report areas, relief centres and road routes that avoid flooded roads.
- **Alerts**: Telegram messages from the backend, and local notifications in the Android app.

**Honesty status (per `AGENTS.md`):**

| Real and running | Simulated or sample | Designed, not built or not called |
|---|---|---|
| Camera pipeline, photo upload, alert logic, fault filter, OpenStreetMap road routes, offline cache in the app, local notifications | Five sample cameras and their AI-generated frames, relief centres, flood-prone areas, citizen reports, family members, underpass barriers, the forecast input | Government camera feeds, agency verification, any cloud model call (Cloud Run, Cloud Storage, FCM and Earth Engine are planned), a real road barrier, a family location server |

No accuracy number appears in this document unless the repo can reproduce it.

## 2. Tech stack

### 2.1 Frontend (`frontend/`)

| Technology | Version (from `package.json`) | Used for |
|---|---|---|
| React | 19.x | UI |
| TypeScript | 5.9 (strict) | Types |
| Vite | 7.x | Build and dev server |
| Tailwind CSS | 4.x | Styling |
| React Router | 7.x | Routes, lazy-loaded pages |
| Leaflet + React-Leaflet | 1.9 / 5.x | Maps, camera pins, zones |
| Firebase | 12.x | Auth and Firestore (named in the guard rails) |
| Vitest | - | 166 frontend tests |

Map tiles: OpenStreetMap, then OpenStreetMap France HOT, then an offline street map drawn from stored routes. CARTO was removed because it returns a "key required" image with HTTP 200, which the failover cannot detect.

### 2.2 Android app (`mobile/`)

Expo SDK 58, React Native 0.88, expo-router, TypeScript strict, Jest (16 tests). It reuses the web app's pure logic through `src/shared.ts`. A WebView Leaflet page works offline with embedded roads. No APK has been built or run on a device yet.

### 2.3 Backend (`backend/`)

| Technology | Used for |
|---|---|
| Python 3 | Language |
| FastAPI, Uvicorn, Pydantic v2 | API, validation |
| httpx | Outgoing calls (Gemini API, OpenRouter, Telegram) |
| OpenCV (`cv2`) and NumPy | Camera image analysis |
| pytest | 155 backend tests |
| Optional: `ultralytics` (YOLO segmentation) | Learned water segmenter, not trained for this repo |

Security: every route that writes state or takes a file depends on `require_write_token`. Depth-node telemetry (`/ingest`) is signed with a device HMAC and checked for clock skew (`MAX_SKEW_SECONDS` = 120).

### 2.4 Machine learning (`models/`)

| Technology | Where | Status |
|---|---|---|
| scikit-learn 1.7.2 | `models/ginkgo/` | GINKGO Model 1: four flood-susceptibility classifiers (Random Forest, HistGradientBoosting, Decision Tree, Logistic Regression) and their loader; not served yet |
| PyTorch | `models/ml_pipeline/flood_core.py`, `nb2_train.py` | GRU level forecaster, trained on synthetic data only |
| scikit-learn | `nb2_train.py` | Gradient-boosting baseline |
| SciPy, rasterio | `nb4_terrain.py` | Terrain flood-fill prototype |
| TensorFlow / Keras, TFLite | `models/legacy_ann/` | Earlier ANN on a Malaysian rainfall CSV |
| Google Gemini | `backend/app/routes/ai_check.py` | Photo opinion. Gemini API first (`GEMINI_API_KEY`, `GEMINI_MODEL`, default `gemini-2.5-flash`), OpenRouter as fallback (`OPENROUTER_MODEL`, default `google/gemini-2.5-flash`) |

### 2.5 Hardware and external services

| Item | Status |
|---|---|
| ESP32 depth node (`firmware/`), ultrasonic sensor, LoRa link | Sketch exists; not field-tested |
| ESP32 barrier bench prototype (`firmware/floodway_barrier.ino`) | Bench only; no real barrier |
| Telegram Bot API | Working when configured |
| OSRM public routing | Road routing in the web app |
| Cloudflare Pages | Frontend host (public demo) |
| Google Cloud and Firebase: Cloud Run (API), Firebase Hosting (web), Cloud Storage (photos, map tiles), Firebase Cloud Messaging (push), Earth Engine (Model 1 features), Secret Manager | Planned (`docs/plans/GLOBAL_STACK_PLAN.md`). Firebase Auth and Firestore are already in use |

The Huawei design (ModelArts, OBS, ECS, SMN) was dropped on 2026-10-20 and its code removed. `docs/architecture/TECH_STACK.md` is partly out of date (it names Gemini 1.5 Flash and Netlify). This overview is the current reference.

## 3. Features

| Feature | What it does | Where |
|---|---|---|
| Live Vision | Five sample cameras show a level, a trend and a warning; user cameras can be added by URL or photo upload | `backend/app/vision/`, `frontend/src/pages/LiveVisionPage.tsx` |
| Four-level warning | Normal, Advisory, Warning, Danger, from a drawn line on the camera image | `vision/levels.py`, `lib/vision/levelRules.ts` |
| Sensor fault filter | Holds a jump bigger than water can rise until the next reading agrees | `vision/fault_filter.py` |
| Lead-time log | Records how long between water crossing a line and an alert | `GET /lead-times` |
| Underpass barriers (simulated) | Closes a barrier on Danger, reopens at Advisory or below, logs each change | `vision/barriers.py` |
| Citizen reports | Photo, description, location; optional AI opinion; depth from a landmark or tap-to-measure | `routes/reports.py`, `routes/ai_check.py`, `lib/depthFromPhoto.ts` |
| Verified-report areas | Circles sized by reporter count and depth, fading after one hour; routing avoids them | `lib/verifiedReports.ts` |
| Routing | Road routes from stored OpenStreetMap data; routes through blocked zones are listed last | `lib/routing.ts`, `build_kl_routes.mjs` |
| Relief centres | Nearest open centre and distance | `routes/shelters.py` |
| Family circle (simulated) | Check-in, SOS (Telegram when set up), places with arrival alerts | `components/family/`, `lib/family.ts` |
| Telegram alerts | Alerts sent from the backend; reports honestly when not configured | `routes/alerts.py`, `services/notifier.py` |
| Android app | Home, map, family, alerts, guide; cached data marked with its age | `mobile/` |
| Storm lab | Replays scripted storms through the live rules, with the filter on and off (timing only) | `vision/storm_lab.py` |

## 4. Architecture

```
 sample cameras ─┐                       ┌──────────── backend (FastAPI) ─────────────┐
 user cameras ───┼──► vision/engine.py ──►│ analyser ─► JumpFilter ─► LevelTracker     │──► alerts (Telegram)
 depth nodes ────┘   (frame, calibration)│   │             │              │            │──► barriers (simulated)
   /ingest (HMAC)                        │   ▼             ▼              ▼            │
                                         │ waterline   hold >step      levels.py      │
 citizen photo ──► /api/v1/ai ──► Gemini │ + ratio     (fault)         (thresholds)   │
 citizen report ─► /reports ──► Firestore│                                            │
 forecast ───────► /predict (formula)    └──────────────────────────────▲─────────────┘
                                                                        │ JSON + WebSocket
                                 ┌─────────────────────────────┐   ┌────┴────────────────┐
                                 │ web (React, Leaflet)        │   │ Android (Expo)      │
                                 │ lib/ = pure rules, shared ──┼───┤ src/shared.ts reuses│
                                 └─────────────────────────────┘   └─────────────────────┘
```

Design rules that hold in code:

- `levels.py` is pure logic: no I/O, unit tested. Its thresholds are a guard rail and are not tuned to make a test pass.
- The UI and the Android app use the same level rules, so the two always agree.
- A photo AI check returns "not run" when no key is set. It never invents a result.

## 5. Workflow

### 5.1 Camera reading (every capture cycle)

1. **Source**: a frame from a sample ladder, a snapshot URL, a stream, or an upload. URLs pass `url_guard.py` (no private addresses).
2. **Analyse**: one of the analysers in section 6.1 gives a bank-height ratio and a waterline.
3. **Aggregate**: the frames of one burst give one median ratio and a confidence.
4. **Filter**: the jump filter holds a sudden change until a second reading confirms it.
5. **Level**: the ratio is compared with the drawn lines; the level tracker applies hysteresis.
6. **Act**: an alert is raised on a level change; a Danger closes the linked barrier; the map updates.
7. **Store**: the reading, its time and the detection delay go to the lead-time log.

### 5.2 Citizen report

1. The user takes a photo, adds a description and location, and optionally a landmark or two taps for depth.
2. The backend sends the photo to the Gemini model (write-token protected, six calls per minute per client).
3. The result shows as an opinion: looks like flooding, appears authentic, estimated depth, confidence, notes. A person still reviews it.
4. A report with enough independent reporters becomes a verified-report area on the map.

### 5.3 Forecast (rule-based)

`/predict` evaluates the formula in section 6.3 for a current level and rain rate. It returns P10, P50 and P90 curves, the time to peak and the time to 1.50 m. It is labelled "not a trained model".

### 5.4 Mobile sync

Four feeds (cameras, alerts, shelters, reports) refresh every 60 seconds while the app is open. A failed refresh shows the saved copy marked "Saved … ago, not live".

## 6. Algorithms used

### 6.1 Camera vision (`backend/app/vision/analysis/`)

| Algorithm | Parameters | What it does | Limits (from the code's own notes) |
|---|---|---|---|
| **Classical water analyser** (`classical.py`, name `classical-v1`) | 7×7 local standard deviation < 4.5 counts as smooth; HSV saturation ≥ 0.08 (skipped in grey or IR scenes); 5×5 morphological open then close | Water is smooth and usually coloured; concrete is textured | Daylight, fixed camera. Fails at night, in glare, on smooth concrete |
| **Reference-difference analyser** (`reference_diff.py`, `reference-diff-v1`) | Gaussian blur σ = 2; colour distance > 20 (on a 0 to 441 scale) against a dry reference frame; row fraction 25%; gap of up to 60 rows | Water is what changed from a dry frame of the same fixed camera | Shadows, lighting changes or a moved camera read as water. Used for sample cameras only |
| **Waterline and ratio** (`waterline.py`) | Wet row needs 50% of the zone width (25% in reference-diff); tolerate 10 bottom rows; edge correction 3 rows | Walks up from the bed to the first dry row; ratio = (bed − water line) ÷ (bed − danger line), clipped to 0 to 1.3 | Depends on the drawn zone |
| **Waterline confidence** | 0.55 × contrast + 0.45 × purity, clipped 0 to 1 | Sharpness of the edge and how wet the rows are below it | A heuristic, not calibrated |
| **Window aggregation** (`temporal.py`) | Median of ratios; agreement = 1 − MAD ÷ 0.08; confidence = quality × (0.5 + 0.5 × agreement) × coverage | Robust answer from a burst of frames | Median-absolute-deviation rule is a judgment |
| **YOLO segmentation** (optional, `yolo_seg.py`) | Ultralytics YOLOv8/11 instance masks, class "water" | Learned water masks | Needs weights trained on your own cameras; none in the repo |

### 6.2 Level decisions (`backend/app/vision/levels.py`, `fault_filter.py`)

| Algorithm | Parameters | What it does |
|---|---|---|
| **Thresholds from calibration** | Danger line fixed at ratio 0.97 (`DANGER_AT`); normal and warning from the drawn lines | Maps the three drawn lines onto a 0 to 1 scale |
| **Level tracker with hysteresis** | Escalate after 2 consecutive higher readings, or at once for Danger with confidence ≥ 0.85; step down one level after 3 lower readings | Stops the level flickering |
| **Trend** | Mean of last 3 readings minus mean of the 3 before; ±0.03 | Rising, falling or steady |
| **Jump filter** (fault filter) | Allowed step = 0.25 + 0.01 × seconds since last reading; a second reading within 0.12 confirms a held jump | Rejects a splash or a passing truck for one cycle |
| **Barrier state rule** | Close on Danger from a linked source; reopen at Advisory or below; manual override | Simulated barrier control |

### 6.3 Forecasting

**Rule-based hydrologic formula** (`services/forecaster.py`, live path):

- Rain factor = (rain rate ÷ 100) × 0.45 m per hour.
- Saturating rise: delta(t) = rain factor × t ÷ (1 + 0.3 t), with t in hours.
- Runoff lag: 0.15 × sin(min(π/2, 0.8 t)).
- Median = current level + delta + runoff. Spread = 0.04 + 0.12 t; P10 = median − spread; P90 = median + 1.3 × spread.
- Horizons 0, 15, 30, 45, 60, 90, 120 minutes. Time to danger uses a 1.50 m threshold.
- The constants were chosen by hand. Confidence is a fixed 0.88 placeholder and is not a measured confidence.

**GRU quantile forecaster** (`models/ml_pipeline/flood_core.py`, `nb2_train.py`, not called by the running app):

- Input: 24 steps of 15 minutes (6 hours). Features: rainfall, level, change in level.
- Model: 2-layer GRU, hidden size 64, dropout 0.1, then a 64-unit ReLU head that outputs 3 horizons × 3 quantiles (P10, P50, P90).
- Training loss: pinball (quantile) loss, predicting the change from the current level.
- Baselines: persistence (level stays the same) and HistGradientBoostingRegressor with absolute-error loss.
- Split: chronological, with a purge gap. The notebook shows that a random split gives a higher R² than a time split, which is why a random split is not used.
- Data: synthetic only (`-SYNTHETIC` in the metadata). No result from it is claimed.

**Terrain flood-fill** (`models/ml_pipeline/nb4_terrain.py`, prototype): a "bathtub" fill. Cells below a water-surface level are labelled with 4-connected components from a seed cell; each cell's depth is the level minus its elevation. A depth at a point is then checked against a passability profile. Uses a synthetic DEM by default.

**Legacy ANN** (`models/legacy_ann/`, TensorFlow/Keras, TFLite export): a dense network trained on a Malaysian rainfall dataset. The architecture and its results are in the notebook; they were not re-checked for this document.

### 6.4 Risk and routing

- **Verified-report areas**: radius from 500 m to 5 km, set by reporter count and depth; fades after one hour and drops out after six.
- **Routing**: road networks from OpenStreetMap; routes through blocked zones are sorted last. Public OSRM routing is used in the web app.
- **Fusion rules** (design, set per site): any single input can raise a level; two inputs at Warning together raise Danger. The rule set is explainable and works before there is enough local data for a fusion model.

### 6.5 AI image assessment

- **Gemini multimodal model**: the Gemini API when `GEMINI_API_KEY` is set (photo sent inline, JSON response requested), otherwise OpenRouter. The result names the engine that ran.
- Input: the photo as a data URL (PNG, JPEG or WebP, up to about 6 MB), the user's description and any reported depth.
- Output: strict JSON, normalised by the server. Bad or missing fields become `null`, never a default.
- It answers an opinion question, not verification. The app says so in its text.

### 6.6 Model 1: flood susceptibility (`models/ginkgo/`)

The four GINKGO classifiers are in the repo since 2026-10-20 (`trained/*.pkl`, loader `registry.py`). Facts from the files are checked by `inspect_models.py`; the rest comes from the team's material. Full card: `models/ginkgo/MODEL_CARD.md`.

| Item | Detail |
|---|---|
| Question answered | Where water is likely to collect. The slide shows a 0 to 100 score in bands Low 0 to 35, Moderate 35 to 65, High 65 to 100; the files output class 0 or 1, so the score must be the class-1 probability × 100 (to confirm with the owner) |
| Algorithms (from the files) | RandomForestClassifier (30 trees, depth 12), HistGradientBoostingClassifier (50 iterations, depth 8), DecisionTreeClassifier (depth 10, 210 leaves), LogisticRegression (L2). scikit-learn 1.7.2 |
| Inputs | **8 unnamed numbers** in every model; the names and order were not saved. The infographic lists at least 14 (Sentinel-2 bands, NDWI, MNDWI, NDVI, NDBI, DEM, slope, wetness index, river distance, flow accumulation), which does not match |
| What the tree shows | First split `x3 <= 1.5` is a leaf that always predicts "no flood". `x3` looks like a category or scenario number; if it encodes the rainfall scenario or the label, it explains the near-perfect accuracy |
| Speed on this laptop | 13 to 305 ms for 100,000 random rows, depending on the model (timing only) |
| Reported result | 99.62% accuracy, F1 99.33% for the top model, on a pixel-level split. **Not reproduced. Do not show.** |
| Why the number is held | Random pixel splits leak; the Decision Tree scoring 99.38% and the root rule above suggest the label copies an input; precision, recall and F1 all equal 99.33% |
| Model 2 (impervious surface) | Its table repeats Model 1's table, including the exact file sizes of these four scikit-learn files, so it does not describe a U-Net. Real results unknown |

### 6.7 Rainfall trigger (team model, outside this repo)

A Random Forest turns forecast rain and flood history into a district probability. The team's notes report 74.55% accuracy on an initial split and call it a prototype. The repo does not contain it, so this number is **not reproduced and not shown**. The rainfall history (2000 to 2010) and the flood incidents (2015 to 2021) do not overlap in time, so the split cannot test the same period.

## 7. Model evaluation

### 7.1 Metrics

| Metric | Used for | Meaning |
|---|---|---|
| Accuracy | Overall correctness | Share of correct labels; misleading when the High class is rare |
| Precision, recall, F1 | Each class, especially High | How many flagged pixels are right; how many real floods are found; the harmonic mean |
| Cohen's kappa | Agreement beyond chance | Use with the confusion matrix |
| Confusion matrix | Error type | Shows false alarms and misses |
| IoU | Segmentation (Model 2, YOLO) | Overlap of predicted and true masks |
| MAE, RMSE, quantile coverage | Forecaster | Error in metres; share of truths inside P10 to P90 |
| Hit rate and lift | Hotspot check | Share of known flood locations inside the High band, against random points |
| Detection delay | Live Vision | Seconds from water crossing a line to the alert |

### 7.2 Tests required before any Model 1 result is shown

| Test | What it shows | Pass |
|---|---|---|
| Leakage check: drop NDWI and MNDWI, retrain | Whether the label copies a water index | Small drop; a collapse means leakage |
| Spatial block cross-validation (1 km or 5 km blocks, or whole scenes) | Real accuracy on unseen places | Score falls but stays well above a baseline |
| Leave-one-flood-event-out | Generalising to a new storm | Similar score across events |
| External hotspot check | Whether High covers real flood locations | Most known hotspots in High; few random points |
| Per-class F1, kappa, confusion matrix | Whether the rare High class is found | High-class F1 reported, not only overall accuracy |
| Speed and size | Honest latency and model size | Machine, image size and file size stated |

Random-split accuracy is never shown alone. Literature in the team notes reports that random validation can overstate remote-sensing accuracy by up to 28% (Kattenborn et al. 2022); this is cited from the notes and was not re-checked.

### 7.3 Evaluation status

| Model | Evaluated in this repo? | Result to show | Status |
|---|---|---|---|
| Model 1 flood susceptibility | Files inspected only (inputs, classes, tree rules, speed); no accuracy, because the training data and feature order are not in the repo | None | Re-test pending: needs the feature list and notebook from the owner first |
| Model 2 impervious surface | No | None | Real results unknown |
| Rainfall trigger (Random Forest) | No | None | Prototype; re-test needed |
| GRU level forecaster | Synthetic data only | None | Not used by the app |
| Rule-based forecaster | Not a model | None | Labelled as a formula |
| Classical and reference-difference analysers | Unit tests check the geometry and the rules, not field accuracy | None | Baseline; measure on labelled frames from real cameras |
| Gemini photo check | Tests check error handling only; the live call is blocked in the sandbox | None | Opinion; a person reviews |
| Jump filter, level tracker | Yes, unit tests and storm lab (timing only) | Timing behaviour only | Not a field accuracy claim |

### 7.4 What to measure next, in order

1. Label frames from the real pilot cameras (water above the line, yes or no), including night, rain on the lens, glare and people walking past. Report precision, recall and delay.
2. Bench-test the depth node against a tape measure at 0.5, 1, 2, 3 and 4 m, 20 readings each. Report mean error and spread per distance.
3. Run the Model 1 spatial tests in section 7.2.
4. Compare the GRU forecaster with persistence on real river data. If it does not beat persistence, say so.

## 8. Testing and checks

| Check | Command | Last recorded result |
|---|---|---|
| Frontend | `npm run check` (tsc, vitest, build) | 166 tests passed (2026-10-20) |
| Backend | `.venv\Scripts\python.exe -m pytest -q` | 155 passed (2026-10-20) |
| Mobile | `npm run check` | Type check clean, 16 Jest tests (2026-10-19) |
| Route audit | `node scripts/route-audit.mjs` | 117 loads, 0 failing (2026-10-19) |
| All | `powershell -File scripts/check.ps1` | Run before each commit |

An honesty test (`backend/tests/test_honest_claims.py`) fails the build if public text names an agency, a Huawei product or an unverified certification.

## 9. Open items

- The live AI photo check has not run end to end here (the sandbox blocks the OpenRouter host).
- The Android APK has not been built or run on a device.
- Model 1 has not been re-tested, and no GINKGO number may be shown until it is. The feature list and training notebook must come from the owner first.
- The forecaster is a formula; the GRU is not connected.
- Cloud Run, Firebase Hosting, Cloud Storage, FCM and Earth Engine are planned, not running.
- Team notes flag the competition IP terms for the GINKGO models; check before reuse.
