# FloodWay Machine Learning & Retrospective Modeling Benchmark

This directory and associated repository modules contain the reproducible pipelines, trained model artifacts, datasets, and diagnostic evaluation suites for the **FloodWay Stage 5 ML Benchmark** across Peninsular Malaysia.

---

## 1. Directory Structure

```
├── models/
│   ├── stage5_3b_benchmark_a_logistic_regression.joblib
│   ├── stage5_3b_benchmark_a_random_forest.joblib
│   ├── stage5_3b_benchmark_b_logistic_regression.joblib
│   ├── stage5_3b_benchmark_b_random_forest.joblib
│   ├── stage5_3b_feature_metadata.json
│   ├── stage5_8_benchmark_a_logistic_regression.joblib
│   ├── stage5_8_benchmark_a_random_forest.joblib
│   ├── stage5_8_benchmark_a_lightgbm.joblib
│   ├── stage5_8_benchmark_a_catboost.joblib
│   ├── stage5_8_benchmark_a_xgboost.joblib
│   ├── stage5_8_benchmark_b_logistic_regression.joblib
│   ├── stage5_8_benchmark_b_random_forest.joblib
│   ├── stage5_8_benchmark_b_lightgbm.joblib
│   ├── stage5_8_benchmark_b_catboost.joblib
│   ├── stage5_8_benchmark_b_xgboost.joblib
│   └── stage5_8_feature_metadata.json
│
├── datasets/
│   ├── floodway_stage5_3a_benchmark_a_modeling_500.csv  # 500 rows (250 Pos, 250 Uniform Neg)
│   ├── floodway_stage5_3a_benchmark_b_modeling_500.csv  # 500 rows (250 Pos, 250 Terrain-Restricted Neg)
│   ├── floodway_stage5_3a_shared_fixed_test_170.csv     # 170 rows (85 Pos, 85 Uniform Neg)
│   └── ...
│
├── results/
│   ├── stage5_8_five_models_metrics.json               # 5-algorithm primary test metrics
│   ├── stage5_8_benchmark_a_predictions.csv            # Probabilities on Benchmark A test (N=170)
│   ├── stage5_8_benchmark_b_predictions.csv            # Probabilities on Benchmark B test (N=170)
│   ├── stage5_9_academic_audit.json                    # Paired bootstrap AUC tests & comparisons
│   ├── stage5_10_seasonal_audit.json                   # Seasonal & temporal sampling distribution audit
│   ├── stage5_11_season_matched_metrics.json           # Matched subcohort sensitivity metrics
│   ├── stage5_11_benchmark_a_matched_predictions.csv   # Exact state/month matched test subset (N=78)
│   └── stage5_11_benchmark_b_matched_predictions.csv   # Exact state/month matched test subset (N=66)
│
├── scripts/
│   ├── train_stage5_3b_baselines.py                    # Trains Stage 5.3B baseline models
│   ├── train_stage5_8_five_models.py                   # Trains all 5 algorithms on A & B benchmarks
│   ├── audit_stage5_9_academic_comparison.py           # Paired bootstrap comparison & Bonferroni tests
│   ├── audit_stage5_10_seasonal_sensitivity.py         # Seasonal distribution analysis
│   └── eval_stage5_11_season_matched.py                # Exact state-and-month matched sensitivity test
│
├── backend/app/services/retrospective_screener.py      # FastAPI inference service for trained pipelines
├── backend/app/routes/retrospective.py                 # REST endpoints for live scoring & comparisons
└── frontend/src/components/home/RetrospectiveScreenerCard.tsx # Interactive UI card
```

---

## 2. Environment Setup

Python 3.10+ is recommended. Install the modeling dependencies using `requirements-ml.txt`:

```powershell
# Windows PowerShell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements-ml.txt
```

*(On Linux / macOS: `source .venv/bin/activate && pip install -r requirements-ml.txt`)*

---

## 3. Five Predictor Variables

Every model pipeline operates exclusively on five continuous physical variables in this exact order:
1. `rain_1d_prior_mm`: ERA5 total antecedent rainfall on day $D-1$ (mm)
2. `rain_3d_prior_mm`: ERA5 cumulative antecedent rainfall over days $D-3$ to $D-1$ (mm)
3. `rain_7d_prior_mm`: ERA5 cumulative antecedent rainfall over days $D-7$ to $D-1$ (mm)
4. `elevation_m`: Copernicus GLO-30 Digital Elevation Model orthometric height (m)
5. `slope_deg`: Local terrain slope derived from Copernicus GLO-30 DEM (degrees)

*No spatial coordinates (lat/lon), state IDs, or event-day rainfall values enter the feature matrix.*

---

## 4. Reproducing the Benchmark

### Step 1: Train the Five Machine Learning Algorithms
Trains Logistic Regression, Random Forest, LightGBM, CatBoost, and XGBoost on Benchmark A (uniform landscape background) and Benchmark B (terrain-restricted background: elevation $\le 125.0\text{ m}$, slope $\le 14.0^\circ$):
```bash
python scripts/train_stage5_8_five_models.py
```
*Outputs: 10 pipeline `.joblib` files in `models/` and evaluation metrics in `results/stage5_8_five_models_metrics.json`.*

### Step 2: Run Paired Bootstrap Uncertainty & Statistical Tests
Computes paired bootstrap differences ($\Delta \text{AUC}$) between models evaluated on identical test records:
```bash
python scripts/audit_stage5_9_academic_comparison.py
```
*Outputs: `results/stage5_9_academic_audit.json`.*

### Step 3: Run the Seasonal Sampling Audit
Audits temporal and seasonal distribution differences between positive events and pseudo-negatives:
```bash
python scripts/audit_stage5_10_seasonal_sensitivity.py
```
*Outputs: `results/stage5_10_seasonal_audit.json`.*

### Step 4: Run the Season-Matched Sensitivity Diagnostic
Performs sensitivity testing using state-and-month matched subcohorts without model retraining:
```bash
python scripts/eval_stage5_11_season_matched.py
```
*Outputs: `results/stage5_11_season_matched_metrics.json` and matched prediction CSVs.*

---

## 5. Summary of Primary Results

Evaluated on the held-out temporal test set (Train: 2015–2019, Test: 2020–2021; $N_{\text{pos}}=85, N_{\text{bg}}=85$, Total $N=170$):

| Algorithm | Benchmark A ROC-AUC | Benchmark A AP | Benchmark B ROC-AUC | Benchmark B AP |
| :--- | :---: | :---: | :---: | :---: |
| **Logistic Regression** | $0.8357$ | $0.8233$ | $0.7186$ | $0.7073$ |
| **Random Forest** | $0.8058$ | $0.7809$ | $0.7727$ | $0.7129$ |
| **LightGBM** | $0.7997$ | $0.7717$ | $0.7565$ | $0.6892$ |
| **CatBoost** | $0.8256$ | $0.7953$ | $0.7821$ | $0.7115$ |
| **XGBoost** | $0.8220$ | $0.7948$ | $0.7740$ | $0.7056$ |

*Full results, paired statistical comparisons, and supplementary sensitivity analyses are detailed in [RESULTS_5_MODEL_COMPARISON.md](RESULTS_5_MODEL_COMPARISON.md).*

---

## 6. Academic Disclaimers & Usage Scope

1. **Third-Party Administrative Provenance:** Flood records are sourced from an unofficial third-party compilation attributed to public JPS reports. Coordinates represent approximate text-based geocodes (district/village centroids), not surveyed flood extents or sensor stations.
2. **Uncertain Background Absence:** Background observations are unmonitored landscape coordinates with a 3 km spatial buffer; minor localized flooding may have occurred unrecorded.
3. **Relative Ranking Metrics:** The models produce relative classification scores against an artificial 50:50 experimental sample. They do not represent calibrated operational probabilities for emergency warning.
