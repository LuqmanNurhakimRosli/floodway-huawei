# FloodWay Phase 5 Complete Handoff Document
**Retrospective Reported Flood Incident Discrimination & Baseline Integration**

- **Project:** FloodWay 2.0
- **Scope:** Stage 5.0 through Stage 5.6 (Data Preflight, Background Sampling, Terrain & Rainfall Extraction, Baseline Training, Robustness Audit, Full-Stack Integration, and End-to-End QA)
- **Status:** **PASS** (Approved for Clearly Labeled Retrospective Historical Demonstration)
- **Date:** 26 October 2026
- **Primary Authors/Engineers:** Antigravity AI & FloodWay Engineering Team

---

## 1. Executive Summary & Core Objective

FloodWay Phase 5 systematically developed, audited, and integrated an authentic machine learning baseline for discriminating historical reported flood incident locations across Peninsular Malaysia against landscape background locations.

### Key Deliverables:
1. **Clean Data Curation:** Filtered and geocoded 3,101 authentic historical flood incident reports from the Department of Irrigation and Drainage (JPS Malaysia) between 2015 and 2021.
2. **Two Complementary Background Benchmarks:**
   - **Benchmark A (Uniform Landscape Background):** Evaluates whether the model can discriminate flood incident locations from general Peninsular Malaysia landscape topography.
   - **Benchmark B (Terrain-Restricted Background):** Evaluates whether the model can discriminate flood incidents from low-lying, flat terrain where elevation and slope match flood-prone bounds.
3. **Strict 5-Predictor Feature Matrix:** Derived exclusively from Copernicus DEM 30m terrain (`elevation_m`, `slope_deg`) and historical ECMWF ERA5 reanalysis precipitation (`rain_1d_prior_mm`, `rain_3d_prior_mm`, `rain_7d_prior_mm`). Live forecasts, event-day rainfall, and geographic coordinate proxies are strictly excluded.
4. **Leakage-Free Baselines:** Strict temporal cutoff (Train $\le 2019$, Test $\ge 2020$) with `StandardScaler` fitted strictly on training data.
5. **Audited Performance:**
   - **Benchmark A (Own Test Set, $N=170$):** Logistic Regression ROC-AUC **0.8357** [95% CI: 0.7766, 0.8920], PR-AUC **0.8233**, Recall@Top10% **0.2000** (17/85 positives).
   - **Benchmark B (Own Test Set, $N=170$):** Random Forest ROC-AUC **0.7727** [95% CI: 0.6971, 0.8425], PR-AUC **0.7129**, Recall@Top10% **0.1529** (13/85 positives).
   - **Shared Fixed Test Set ($N=170$):** Model A LR **0.8357**, Model A RF **0.8058**, Model B LR **0.8008**, Model B RF **0.7632**.
6. **Production Integration:** FastAPI backend service mounted at `/api/v1/retrospective` and interactive React dashboard card on the Home screen with 100% test pass rate (166 backend tests, 169 frontend tests).

---

## 2. Chronological Phase 5 Roadmap & Milestones

```
  [Stage 5.0] Data & Pipeline Preflight Audit
       │      (Audited 3,101 Peninsular candidates; resolved quotas; firewall rules)
       ▼
  [Stage 5.1] Background Sampling Implementation Pilot
       │      (50 Uniform + 50 Terrain-matched pilot; national terrain extraction)
       ▼
  [Stage 5.1A] Controlled Negative Scaling (500 Records)
       │      (250 Benchmark A + 250 Benchmark B: 165 Train / 85 Test each)
       ▼
  [Stage 5.2A] Rainfall Feature Extraction Pilot
       │      (100-sample Open-Meteo ERA5 pilot; D-1, D-3, D-7 prior rainfall windows)
       ▼
  [Stage 5.2B] Complete Background Rainfall Extraction
       │      (All 500 background samples completed: 397 API calls, 103 cache hits, 0 fails)
       ▼
  [Stage 5.3A] Positive Cohort Assembly & Feature Extraction
       │      (250 JPS reported flood positives assembled; Copernicus DEM & ERA5 extracted)
       ▼
  [Stage 5.3B] Baseline Model Training & Evaluation
       │      (Trained Dummy, Logistic Regression, Random Forest on Benchmarks A and B)
       ▼
  [Stage 5.4] Evaluation Validation & Robustness Audit
       │      (Tied score correction; 95% bootstrap CIs; spatial subgroup base-rate audit)
       ▼
  [Stage 5.5] Minimal Retrospective Model Integration
       │      (FastAPI service /api/v1/retrospective; Home dashboard RetrospectiveScreenerCard)
       ▼
  [Stage 5.6] Final End-to-End QA & Demo Readiness
              (Inference score parity confirmed; offline fallbacks hardened; PASS report)
```

---

## 3. Methodological Foundations & Target Definition

### Target Definition:
- **Positive Class ($y = 1$):** Geocoded candidate locations of reported flood incidents from official JPS flood records (2015–2021).
- **Background Class ($y = 0$):** Pseudo-negative landscape locations labeled `uncertain_background_sample`. These locations are **not** confirmed flood-free ground truth; they represent presence-background contrast points.
- **Metric Interpretation:** Metrics measure relative presence-background discrimination and spatial/temporal ranking ability, **never** calibrated operational flood probabilities or false alarm rates.

### Temporal Information Firewall:
- **Training Period:** 2015–2019 (max year $\le 2019$).
- **Test Period:** 2020–2021 (min year $\ge 2020$).
- **Rule:** Negative sampling spatial exclusions, terrain quantile matching, and feature preprocessing were strictly derived from the $\le 2019$ training positive records. Future test records were isolated behind an information firewall.

---

## 4. Feature Engineering Architecture

The models use strictly five approved predictors in exact order:

| Index | Feature Column | Source / Platform | Physical Unit | Description | Range Bounds |
| :---: | :--- | :--- | :---: | :--- | :---: |
| **0** | `rain_1d_prior_mm` | ECMWF ERA5 Reanalysis | `mm` | Total precipitation on $D-1$ prior to event | $[0.0, 1500.0]$ |
| **1** | `rain_3d_prior_mm` | ECMWF ERA5 Reanalysis | `mm` | Cumulative precipitation across $D-3 \dots D-1$ | $[0.0, 3000.0]$ |
| **2** | `rain_7d_prior_mm` | ECMWF ERA5 Reanalysis | `mm` | Cumulative precipitation across $D-7 \dots D-1$ | $[0.0, 5000.0]$ |
| **3** | `elevation_m` | Copernicus GLO-30 DEM | `m` | Terrain elevation above sea level | $[-50.0, 4500.0]$ |
| **4** | `slope_deg` | Copernicus GLO-30 DEM | `degrees` | Geodesic surface gradient | $[0.0, 90.0]$ |

### Strict Exclusions:
- `rain_event_day_mm`: Preserved only as a retrospective diagnostic field; never fed to models.
- Coordinates (`latitude`, `longitude`), `state`, `place`, and date strings: Excluded to prevent geographic memorization.

---

## 5. Dataset Cohorts & Benchmark Definitions

### Dataset Files in `datasets/`:
- [`datasets/floodway_stage5_3a_benchmark_a_modeling_500.csv`](file:///c:/Users/btryiafrn/.gemini/antigravity-ide/scratch/floodway-huawei/floodway-huawei/datasets/floodway_stage5_3a_benchmark_a_modeling_500.csv): 250 Positives + 250 Uniform Background samples (165 Train / 85 Test each).
- [`datasets/floodway_stage5_3a_benchmark_b_modeling_500.csv`](file:///c:/Users/btryiafrn/.gemini/antigravity-ide/scratch/floodway-huawei/floodway-huawei/datasets/floodway_stage5_3a_benchmark_b_modeling_500.csv): 250 Positives + 250 Terrain-Restricted Background samples (165 Train / 85 Test each).
- [`datasets/floodway_stage5_3a_shared_fixed_test_170.csv`](file:///c:/Users/btryiafrn/.gemini/antigravity-ide/scratch/floodway-huawei/floodway-huawei/datasets/floodway_stage5_3a_shared_fixed_test_170.csv): Fixed evaluation set (85 Test Positives + 85 Benchmark A Uniform Test Background).
- [`datasets/floodway_stage5_3a_positives_features_250.csv`](file:///c:/Users/btryiafrn/.gemini/antigravity-ide/scratch/floodway-huawei/floodway-huawei/datasets/floodway_stage5_3a_positives_features_250.csv): 250 positive candidates with Copernicus terrain and ERA5 rainfall.

### Benchmark Comparison (Neutral Formulation):
- **Benchmark A (Uniform Landscape Background):** Tests whether the model can discriminate flood incident locations from general Peninsular Malaysia terrain. Both terrain (low elevation, low slope) and rainfall contribute strongly to discrimination.
- **Benchmark B (Terrain-Restricted Background):** Background points are constrained to low elevations ($\le 125.0\text{ m}$) and gentle slopes ($\le 14.0^\circ$) (bounds in `scripts/generate_stage5_1a_scaling_250.py`; an earlier draft of this note said 236.4 m and 11.8°), derived from training positive distributions. Terrain is partially controlled for, compelling models to discriminate based on antecedent rainfall dynamics within flood-prone topography.

---

## 6. Model Training & Saved Pipeline Artifacts

Trained baseline models are preserved in [`models/`](file:///c:/Users/btryiafrn/.gemini/antigravity-ide/scratch/floodway-huawei/floodway-huawei/models):

1. **Benchmark A Logistic Regression (Default Model):**
   - File: [`models/stage5_3b_benchmark_a_logistic_regression.joblib`](file:///c:/Users/btryiafrn/.gemini/antigravity-ide/scratch/floodway-huawei/floodway-huawei/models/stage5_3b_benchmark_a_logistic_regression.joblib)
   - Architecture: `Pipeline([('scaler', StandardScaler()), ('classifier', LogisticRegression(C=1.0, random_state=42))])`
   - Test ROC-AUC: **`0.8357`** [95% CI: 0.7766, 0.8920]
2. **Benchmark B Random Forest (Comparison Model):**
   - File: [`models/stage5_3b_benchmark_b_random_forest.joblib`](file:///c:/Users/btryiafrn/.gemini/antigravity-ide/scratch/floodway-huawei/floodway-huawei/models/stage5_3b_benchmark_b_random_forest.joblib)
   - Architecture: `RandomForestClassifier(n_estimators=100, max_depth=5, min_samples_leaf=10, random_state=42)`
   - Test ROC-AUC: **`0.7727`** [95% CI: 0.6971, 0.8425]
3. **Benchmark A Random Forest:**
   - File: [`models/stage5_3b_benchmark_a_random_forest.joblib`](file:///c:/Users/btryiafrn/.gemini/antigravity-ide/scratch/floodway-huawei/floodway-huawei/models/stage5_3b_benchmark_a_random_forest.joblib)
   - Test ROC-AUC: **`0.8058`** [95% CI: 0.7418, 0.8664]
4. **Benchmark B Logistic Regression:**
   - File: [`models/stage5_3b_benchmark_b_logistic_regression.joblib`](file:///c:/Users/btryiafrn/.gemini/antigravity-ide/scratch/floodway-huawei/floodway-huawei/models/stage5_3b_benchmark_b_logistic_regression.joblib)
   - Test ROC-AUC: **`0.7186`** [95% CI: 0.6431, 0.7943]
5. **Feature Metadata Specification:**
   - File: [`models/stage5_3b_feature_metadata.json`](file:///c:/Users/btryiafrn/.gemini/antigravity-ide/scratch/floodway-huawei/floodway-huawei/models/stage5_3b_feature_metadata.json)

---

## 7. Stage 5.4 Robustness Audit & Recomputed Metrics

Saved in [`results/stage5_4_robustness_metrics.json`](file:///c:/Users/btryiafrn/.gemini/antigravity-ide/scratch/floodway-huawei/floodway-huawei/results/stage5_4_robustness_metrics.json).

### A. Tied-Score Ranking Correction (DummyClassifier)
- **Original Stage 5.3B Result:** `Recall@Top10% = 0.0000` because stable sorting (`np.argsort`) arbitrarily placed background rows before positives when all probabilities were tied at $0.5000$.
- **Corrected Interpretation:** When all scores are tied, any top 10% slice captures positives at the random base rate ($0.10 \times 85 = 8.5$ positives). Corrected expected Recall@Top10% is **`0.1000` (10.0%)**.

### B. Benchmark A Own Test Set ($N=170$: 85 Positives, 85 Uniform Background)

| Model Pipeline | ROC-AUC (95% CI) | PR-AUC (Average Precision) | Recall@Top10% | Positives in Top 10% |
| :--- | :---: | :---: | :---: | :---: |
| **Dummy Classifier (Prior)** | 0.5000 $[0.5000, 0.5000]$ | 0.5000 | **0.1000** | 8.5 / 85 (expected) |
| **Logistic Regression (Standardized)** | **0.8357** $[0.7766, 0.8920]$ | **0.8233** | **0.2000** | 17.0 / 85 (100% budget) |
| **Random Forest (depth=5)** | **0.8058** $[0.7418, 0.8664]$ | **0.7809** | **0.1765** | 15.0 / 85 (88.2% budget) |

### C. Benchmark B Own Test Set ($N=170$: 85 Positives, 85 Terrain-Restricted Background)

| Model Pipeline | ROC-AUC (95% CI) | PR-AUC (Average Precision) | Recall@Top10% | Positives in Top 10% |
| :--- | :---: | :---: | :---: | :---: |
| **Dummy Classifier (Prior)** | 0.5000 $[0.5000, 0.5000]$ | 0.5000 | **0.1000** | 8.5 / 85 (expected) |
| **Logistic Regression (Standardized)** | **0.7186** $[0.6431, 0.7943]$ | **0.7073** | **0.1529** | 13.0 / 85 |
| **Random Forest (depth=5)** | **0.7727** $[0.6971, 0.8425]$ | **0.7129** | **0.1529** | 13.0 / 85 |

### D. Shared Fixed Test Set Comparison ($N=170$)

| Model Evaluated | Training Regime | ROC-AUC (95% CI) | PR-AUC | Recall@Top10% | Positives in Top 10% |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Model A (Logistic Regression)** | Uniform Background | **0.8357** $[0.7766, 0.8920]$ | 0.8233 | **0.2000** | 17.0 / 85 |
| **Model A (Random Forest)** | Uniform Background | **0.8058** $[0.7418, 0.8664]$ | 0.7809 | **0.1765** | 15.0 / 85 |
| **Model B (Logistic Regression)** | Terrain-Restricted | **0.8008** $[0.7375, 0.8642]$ | 0.7896 | **0.1647** | 14.0 / 85 |
| **Model B (Random Forest)** | Terrain-Restricted | **0.7632** $[0.6865, 0.8392]$ | 0.7189 | **0.1294** | 11.0 / 85 |

---

## 8. Spatial Generalization & Base-Rate Shift Analysis

### The Three Spatial Generalization Tiers:
1. **Exact-Coordinate Novelty:** 78 of 85 test positives (91.8%) occurred at coordinates never seen during training; 7 occurred at seen coordinates.
2. **Geographic Distance Separation:** Distances to nearest training positive candidate ($<3\text{ km}$, $\ge 3\text{ km}$, $\ge 10\text{ km}$).
3. **True Catchment / Hydrological Independence:** Drainage basin and river basin boundaries. Points separated by 10 km along the same river (e.g., Klang River) remain hydrologically coupled; distance alone does not prove catchment independence.

### Spatial Subgroup Performance on Benchmark A (Random Forest):

| Subgroup Definition | $N_{\text{pos}}$ | $N_{\text{bg}}$ | Base Rate ($P$) | ROC-AUC (95% CI) | PR-AUC | Ratio to Base Rate | Recall@Top10% |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **All Test Positives** | 85 | 85 | 0.5000 | 0.8058 $[0.7418, 0.8664]$ | 0.7809 | **1.56x** | 0.1765 (15/85) |
| **Exact Seen ($0.0\text{ km}$)** | 7 | 85 | 0.0761 | 0.8622 $[0.7412, 0.9612]$ | 0.3860 | **5.07x** | 0.2857 (2/7) |
| **Exact Novel ($>0.0\text{ km}$)** | 78 | 85 | 0.4785 | 0.8008 $[0.7407, 0.8708]$ | 0.7621 | **1.59x** | 0.1795 (14/78) |
| **Proximal ($<3.0\text{ km}$)** | 26 | 85 | 0.2342 | 0.8104 $[0.7238, 0.8918]$ | 0.5476 | **2.34x** | 0.2308 (6/26) |
| **Distal ($\ge 3.0\text{ km}$)** | 59 | 85 | 0.4097 | 0.8038 $[0.7310, 0.8695]$ | 0.7198 | **1.76x** | 0.2034 (12/59) |
| **Meso-Proximal ($<10.0\text{ km}$)** | 51 | 85 | 0.3750 | 0.8390 $[0.7700, 0.8973]$ | 0.7359 | **1.96x** | 0.1961 (10/51) |
| **Meso-Distal ($\ge 10.0\text{ km}$)** | 34 | 85 | 0.2857 | 0.7561 $[0.6620, 0.8433]$ | 0.5361 | **1.88x** | 0.1765 (6/34) |

### Documented Base-Rate Artifact:
When positive subsets are evaluated against all 85 background points, class prevalence drops (e.g., $N=7 \rightarrow 7.6\%$). This naturally depresses raw Average Precision from 0.78 to 0.386. However, relative to random baseline, the model operates at **5.07x above chance** on seen coordinates and **1.59x above chance** on novel coordinates. ROC-AUC remains stable across distance bands (0.75–0.86).

---

## 9. Stage 5.5 Full-Stack Implementation Details

### A. Backend Inference Architecture:
- [`backend/app/services/retrospective_screener.py`](file:///c:/Users/btryiafrn/.gemini/antigravity-ide/scratch/floodway-huawei/floodway-huawei/backend/app/services/retrospective_screener.py):
  - Validates feature existence, types, physical ranges, and strict ordering.
  - Loads and caches `.joblib` model pipelines from `models/`.
  - Calculates relative classification score $p \in [0.0, 1.0]$.
  - Assigns illustrative demonstration tier with explicit basis documentation.
- [`backend/app/routes/retrospective.py`](file:///c:/Users/btryiafrn/.gemini/antigravity-ide/scratch/floodway-huawei/floodway-huawei/backend/app/routes/retrospective.py):
  - `GET /api/v1/retrospective/catalog`: Returns models, metadata, disclaimers.
  - `GET /api/v1/retrospective/examples`: Returns authentic 2020 historical test records.
  - `POST /api/v1/retrospective/screen`: Evaluates selected model on 5 features.
  - `POST /api/v1/retrospective/compare`: Evaluates Benchmark A and Benchmark B side-by-side.
- [`backend/app/main.py`](file:///c:/Users/btryiafrn/.gemini/antigravity-ide/scratch/floodway-huawei/floodway-huawei/backend/app/main.py):
  - Mounted `app.include_router(retrospective.router)`.

### B. Frontend Architecture:
- [`frontend/src/services/retrospectiveApi.ts`](file:///c:/Users/btryiafrn/.gemini/antigravity-ide/scratch/floodway-huawei/floodway-huawei/frontend/src/services/retrospectiveApi.ts):
  - TypeScript client interfacing with backend endpoints.
  - Hardened connection error handling: explicit error shown if backend is down; never generates synthetic fake scores.
- [`frontend/src/components/home/RetrospectiveScreenerCard.tsx`](file:///c:/Users/btryiafrn/.gemini/antigravity-ide/scratch/floodway-huawei/floodway-huawei/frontend/src/components/home/RetrospectiveScreenerCard.tsx):
  - Integrated into the main dashboard ([`frontend/src/pages/HomePage.tsx`](file:///c:/Users/btryiafrn/.gemini/antigravity-ide/scratch/floodway-huawei/floodway-huawei/frontend/src/pages/HomePage.tsx)).
  - Features 1-click authentic historical record loader, 5-feature parameter adjustments, model selection toggle, screening trigger, and side-by-side comparison mode.

---

## 10. Stage 5.6 End-to-End QA & Verification Results

### 1. Parity Check (API vs. Direct Saved Model Pipeline):
Tested with authentic 2020 flood incident record `POS_9564` (`[7.5, 41.4, 98.5, 19.11, 4.23]`):
- **Model A (Logistic Regression):** Direct = `0.7220`, Live API = `0.7220` (**Exact Match**)
- **Model B (Random Forest):** Direct = `0.7510`, Live API = `0.7510` (**Exact Match**)
- **Background Point (`NEG_166`):** Direct Model A = `0.4467`, Direct Model B = `0.1778` (**Exact Match**)

### 2. Automated Test Results:
- **Backend Test Suite (Pytest):** **166 passed, 0 failed** in 46.24s ([`backend/tests/test_retrospective.py`](file:///c:/Users/btryiafrn/.gemini/antigravity-ide/scratch/floodway-huawei/floodway-huawei/backend/tests/test_retrospective.py) 11/11 passed).
- **Frontend Test Suite (Vitest):** **169 passed, 0 failed** in 1.26s ([`frontend/src/__tests__/retrospective.test.ts`](file:///c:/Users/btryiafrn/.gemini/antigravity-ide/scratch/floodway-huawei/floodway-huawei/frontend/src/__tests__/retrospective.test.ts) 3/3 passed).
- **Frontend Production Build:** `tsc && vite build` completed in 6.47s with 0 errors.

---

## 11. Mandatory Disclaimers & Operational Boundaries

The application, APIs, and documentation strictly adhere to the following statements:
1. **Historical Screening Demonstration Only:**
   > *"Historical flood incident screening demonstration only. Not a real-time flood forecast or safety warning."*
2. **Reanalysis vs. Live Forecast Distinction:**
   > *"Inputs: Historical ECMWF ERA5 reanalysis (D-7..D-1) & Copernicus DEM 30m. Not live weather forecasts or sensor readings."*
3. **Score Semantics:**
   > *"Relative presence-background discrimination score (0.0 to 1.0). Indicates relative similarity to historical reported flood incidents compared to landscape background; not a calibrated real-world flood probability or alert."*
4. **Illustrative Demonstration Tiers:**
   > *"Illustrative demonstration tier based on score range (>=0.70 Elevated, 0.40–0.70 Moderate, <0.40 Baseline). Not an official meteorological risk category or civil protection threshold."*

---

## 12. Reproduction & Demonstration Instructions

### Prerequisites
- Python 3.10+ (tested with Python 3.14) with virtual environment in `.venv/`
- Node.js v18+ & npm v9+

### Startup Commands

**Terminal 1 — FastAPI Backend:**
```powershell
cd backend
..\.venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8080
```
*Verify:* Open `http://127.0.0.1:8080/healthz` (returns `{"status": "HEALTHY"}`).

**Terminal 2 — React Frontend:**
```powershell
cd frontend
npm run dev
```
*Verify:* Open `http://localhost:5173/home`.

### Running Verification Tests

```powershell
# Run backend test suite
cd backend
..\.venv\Scripts\pytest tests/test_retrospective.py

# Run frontend test suite
cd frontend
npm test

# Build frontend production bundle
cd frontend
npm run build
```

---

## 13. Preserved Artifacts Inventory

All Stage 5 artifacts have been strictly preserved without overwriting:

### Scripts in `scripts/`:
- `scripts/audit_preflight_candidates.py`: Stage 5.0 preflight candidate audit
- `scripts/benchmark_preflight_pipeline.py`: Stage 5.0 live preflight pipeline benchmark
- `scripts/extract_training_positives_terrain.py`: Stage 5.1 national empirical terrain extraction
- `scripts/generate_stage5_pilot_negatives.py`: Stage 5.1 100-sample pilot negative generator
- `scripts/generate_stage5_1a_scaling_250.py`: Stage 5.1A 500-sample negative generator
- `scripts/extract_stage5_2a_rainfall.py`: Stage 5.2A 100-sample rainfall pilot extractor
- `scripts/extract_stage5_2b_rainfall.py`: Stage 5.2B 500-sample background rainfall extractor
- `scripts/assemble_stage5_3a_positives.py`: Stage 5.3A positive cohort assembly & feature extractor
- `scripts/train_stage5_3b_baselines.py`: Stage 5.3B baseline model training script
- `scripts/audit_stage5_4_robustness.py`: Stage 5.4 evaluation validation & robustness audit script

### Models in `models/`:
- `models/stage5_3b_benchmark_a_logistic_regression.joblib`
- `models/stage5_3b_benchmark_a_random_forest.joblib`
- `models/stage5_3b_benchmark_b_logistic_regression.joblib`
- `models/stage5_3b_benchmark_b_random_forest.joblib`
- `models/stage5_3b_feature_metadata.json`

### Results in `results/`:
- `results/stage5_3b_benchmark_a_predictions.csv`
- `results/stage5_3b_benchmark_b_predictions.csv`
- `results/stage5_3b_evaluation_metrics.json`
- `results/stage5_4_robustness_metrics.json`

---

## 14. Git Status Summary

```
Modified Files:
  - backend/app/main.py
  - frontend/src/pages/HomePage.tsx

New Integration Files:
  - backend/app/services/retrospective_screener.py
  - backend/app/routes/retrospective.py
  - backend/tests/test_retrospective.py
  - frontend/src/services/retrospectiveApi.ts
  - frontend/src/components/home/RetrospectiveScreenerCard.tsx
  - frontend/src/__tests__/retrospective.test.ts
  - STAGE_5_HANDOFF.md

Preserved Historical Datasets & Models:
  - datasets/floodway_stage5_3a_*
  - models/stage5_3b_*
  - results/stage5_3b_* & results/stage5_4_*
  - scripts/*
```

*Stage 5 is complete, fully tested, documented, and ready for review.*
