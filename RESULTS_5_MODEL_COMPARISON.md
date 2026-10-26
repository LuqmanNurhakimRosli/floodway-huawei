# FloodWay Stage 5.11: Academic Benchmark Report & Season-Matched Sensitivity Evaluation

**Author:** FloodWay Research Team  
**Evaluation Scope:** Peninsular Malaysia Historical Flood Discrimination (2015–2021)  
**Data Provenance:** Unofficial third-party compilation attributed to public Annual Flood Reports (2015–2021) from the Department of Irrigation and Drainage Malaysia (Jabatan Pengairan dan Saliran, JPS / DID Malaysia). The repository contains no evidence of direct primary database extraction or independent official verification.  
**Dataset Architecture:** Stage 5.3A Cohorts ($N_{\text{total}} = 500$ per benchmark; $N_{\text{train}} = 330$, $N_{\text{test}} = 170$)  
**Temporal Cutoff:** Training $\le 2019$ ($N=330$), Testing $\ge 2020$ ($N=170$)  
**Input Dimension:** Strictly 5 physical predictors (3 antecedent rainfall, 2 Copernicus DEM terrain)  
**Audit Stage:** Stage 5.11 Academic Corrections, Stratified Paired Bootstrap & Season-Matched Sensitivity Evaluation  
**Document Status:** Final Academic Working Document (Do Not Retrain Without Consent)  

---

## 1. Executive Summary & Core Academic Findings

This document presents the verified academic benchmark comparing five supervised machine learning algorithms:
1. **Logistic Regression** ($L_2$-penalized generalized linear model with train-fitted standard scaling)
2. **Random Forest** (Bootstrap aggregated decision trees; 100 trees, `max_depth=5`, `min_samples_leaf=10`)
3. **LightGBM** (Histogram-based leaf-wise gradient boosted trees; 100 trees, `max_depth=4`, `num_leaves=15`, $\eta=0.05$)
4. **CatBoost** (Symmetric oblivious decision trees; 100 iterations, `depth=4`, $\eta=0.05$)
5. **XGBoost** (Exact/histogram gradient boosted trees; 100 trees, `max_depth=4`, subsample $0.8$, $\eta=0.05$)

### Verified Scientific Conclusions
1. **No Statistically Detectable Difference Under Exploratory Testing:**  
   Across both Benchmark A (uniform landscape background) and Benchmark B (terrain-restricted background), **no statistically detectable difference** exists among the leading models under stratified paired bootstrap testing with multiple comparison corrections.
   - On Benchmark A: Logistic Regression ($0.8357$), CatBoost ($0.8256$), and XGBoost ($0.8220$) show paired AUC differences that do not differ significantly from zero ($p > 0.60$).
   - On Benchmark B: CatBoost ($0.7821$), XGBoost ($0.7740$), and Random Forest ($0.7727$) are statistically indistinguishable ($p > 0.30$).
2. **Qualification of CatBoost vs. Logistic Regression ($p=0.046$):**  
   While CatBoost achieved a nominal uncorrected $p = 0.046$ over Logistic Regression on Benchmark B, this difference **does not survive Bonferroni correction for 10 pairwise comparisons ($\alpha = 0.005$)** and is subject to small sample size ($N_{\text{test}}=170$) and spatial-temporal autocorrelation. It must be interpreted strictly as an exploratory signal, not a definitive proof of superiority.
3. **Topographic Shortcut vs. Nonlinear Interactions:**
   - On **Benchmark A**, linear models readily exploit the macro-topographic separation between low-elevation flood reports and steep upland background terrain (elevation standardized coefficient $-1.065$, slope $-0.930$).
   - On **Benchmark B**, where background terrain is restricted to lowland bounds (elevation $\le 125.0$ m, slope $\le 14.0^\circ$), the linear shortcut weakens (Logistic Regression drops to $0.7186$), while tree ensembles retain higher discriminative fidelity ($0.77 - 0.78$) via non-linear feature combinations.
4. **Seasonal Sampling Imbalance & Sensitivity Impact (Stage 5.11 Supplementary Analysis):**  
   - In the training partition, **$72.1\%$** of reported flood positives occurred during peak wet months (September–February), compared to only **$45.4\%$** of background samples.
   - In a supplementary diagnostic sensitivity test on a reduced subcohort with exact state-and-month matching ($N=78$ for Benchmark A, $N=66$ for Benchmark B), **Logistic Regression in Benchmark B dropped from $0.7186$ to $0.5849$** ($\Delta \text{AUC} = -0.1337$), indicating that linear ranking was sensitive to seasonal background contrast.
   - In contrast, **gradient-boosted tree ensembles exhibited stable ranking metrics** on this matched subcohort (LightGBM $\text{AUC} = 0.7594$, XGBoost $\text{AUC} = 0.7603$, CatBoost $\text{AUC} = 0.7475$). This suggests tree-based models rely on non-linear thresholding across antecedent rainfall metrics rather than monotonic seasonal averages. However, this diagnostic represents an opportunistic subcohort and does not prove that seasonal confounding has been eliminated across all operational conditions.
5. **Data Provenance & Geocoding Precision:**  
   The positive flood records originate from an **unofficial third-party compilation attributed to public JPS flood bulletins**. Coordinates represent **approximate text-based geocodes** (e.g., district or village centroids), **not field-verified settlement centroids or surveyed inundation boundaries**.

---

## 2. Experimental Methodology & Protocols

### 2.1 Data Cohorts & Record Allocation
All algorithms were trained and evaluated on identical records produced in Stage 5.3A:
- **Reported Flood Positives ($N=250$):** Sourced from the third-party compilation attributed to JPS reports across Peninsular Malaysia.
  - Train: 165 records (2015–2019)
  - Test: 85 records (2020–2021)
- **Benchmark A Negatives ($N=250$):** Spatially uniform background samples selected across Peninsular Malaysia with a 3 km spatial exclusion from known floods.
  - Train: 165 records (2015–2019)
  - Test: 85 records (2020–2021)
- **Benchmark B Negatives ($N=250$):** **Terrain-restricted** pseudo-negatives filtered to empirical training-positive elevation ($[-4.0\text{ m}, 125.0\text{ m}]$) and slope ($[0.0^\circ, 14.0^\circ]$) bounds. *(Note: This is an interval bounding filter, not a joint probability distribution match).*
  - Train: 165 records (2015–2019)
  - Test: 85 records (2020–2021)
- **Shared Fixed Test Set ($N=170$):** 85 test positives (2020–2021) paired with 85 Benchmark A uniform test negatives.

### 2.2 Five Predictive Features
The feature space is strictly restricted to five continuous physical variables in exact order:
1. `rain_1d_prior_mm`: ERA5 total antecedent rainfall on day $D-1$ (mm)
2. `rain_3d_prior_mm`: ERA5 cumulative antecedent rainfall over days $D-3$ to $D-1$ (mm)
3. `rain_7d_prior_mm`: ERA5 cumulative antecedent rainfall over days $D-7$ to $D-1$ (mm)
4. `elevation_m`: Copernicus GLO-30 Digital Elevation Model orthometric height (m)
5. `slope_deg`: Terrain slope computed from DEM raster transform (degrees)

*Explicitly Excluded:* Coordinates (`latitude`, `longitude`), event-day rainfall (`rain_event_day_mm`), calendar dates, state codes, and administrative identifiers.

### 2.3 Algorithm Hyperparameters
Standard regularized configurations were established prior to training without tuning on test performance:

| Algorithm | Model Architecture | Hyperparameter Specification | Random Seed |
| :--- | :--- | :--- | :---: |
| **Logistic Regression** | `Pipeline(StandardScaler, LogisticRegression)` | $L_2$ penalty ($C=1.0$), `solver='lbfgs'`, `max_iter=1000` | 42 |
| **Random Forest** | `RandomForestClassifier` | `n_estimators=100`, `max_depth=5`, `min_samples_leaf=10` | 42 |
| **LightGBM** | `LGBMClassifier` | `n_estimators=100`, `max_depth=4`, `num_leaves=15`, `min_child_samples=10`, $\eta=0.05$ | 42 |
| **CatBoost** | `CatBoostClassifier` | `iterations=100`, `depth=4`, $\eta=0.05$, `verbose=False` | 42 |
| **XGBoost** | `XGBClassifier` | `n_estimators=100`, `max_depth=4`, $\eta=0.05$, `subsample=0.8`, `colsample_bytree=0.8`, `eval_metric='logloss'` | 42 |

---

## 3. Original Benchmark Comparison Results

### 3.1 Benchmark A: Uniform Landscape Background (Own Test Set, $N=170$)
*Evaluates discrimination against random geographic points across Peninsular Malaysia.*

| Model | ROC-AUC | 95% Bootstrap CI | PR-AUC (AP) | Recall@Top10% | Top 10% Positives Captured | Brier Score* | Log Loss* |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression** | **0.8357** | [0.7766, 0.8920] | **0.8233** | **0.2000** | 17.00 / 85 | **0.1648** | **0.4869** |
| **CatBoost** | 0.8256 | [0.7664, 0.8825] | 0.7953 | 0.1882 | 16.00 / 85 | 0.1676 | 0.5038 |
| **XGBoost** | 0.8220 | [0.7603, 0.8768] | 0.7948 | 0.1765 | 15.00 / 85 | 0.1710 | 0.5078 |
| **Random Forest** | 0.8058 | [0.7418, 0.8664] | 0.7809 | 0.1765 | 15.00 / 85 | 0.1756 | 0.5185 |
| **LightGBM** | 0.7997 | [0.7338, 0.8604] | 0.7717 | 0.1765 | 15.00 / 85 | 0.1833 | 0.5396 |

*\*Note: Brier Score and Log Loss describe calibration against the constructed 50:50 presence-background cohort, NOT real-world flood probabilities.*

### 3.2 Benchmark B: Terrain-Restricted Background (Own Test Set, $N=170$)
*Evaluates discrimination when background samples are restricted to empirical lowland bounds.*

| Model | ROC-AUC | 95% Bootstrap CI | PR-AUC (AP) | Recall@Top10% | Top 10% Positives Captured | Brier Score* | Log Loss* |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **CatBoost** | **0.7821** | [0.7100, 0.8488] | 0.7115 | **0.1529** | 13.00 / 85 | **0.1887** | **0.5578** |
| **XGBoost** | 0.7740 | [0.7023, 0.8413] | 0.7056 | 0.1412 | 12.00 / 85 | 0.1966 | 0.5872 |
| **Random Forest** | 0.7727 | [0.6971, 0.8425] | **0.7129** | **0.1529** | 13.00 / 85 | 0.1940 | 0.5708 |
| **LightGBM** | 0.7565 | [0.6836, 0.8304] | 0.6892 | 0.1412 | 12.00 / 85 | 0.2070 | 0.6170 |
| **Logistic Regression** | 0.7186 | [0.6431, 0.7943] | 0.7073 | **0.1529** | 13.00 / 85 | 0.2174 | 0.6282 |

### 3.3 Shared Fixed Test Set Comparison ($N=170$)
*Evaluates all 10 trained models on the identical test anchor (85 Test Positives + 85 Uniform Test Negatives).*

| Model Origin & Algorithm | Test Set | ROC-AUC | 95% Bootstrap CI | PR-AUC (AP) | Recall@Top10% | Brier Score | Log Loss |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Benchmark A - Logistic Regression** | Shared Fixed | **0.8357** | [0.7766, 0.8920] | **0.8233** | **0.2000** | **0.1648** | **0.4869** |
| **Benchmark A - CatBoost** | Shared Fixed | 0.8256 | [0.7664, 0.8825] | 0.7953 | 0.1882 | 0.1676 | 0.5038 |
| **Benchmark A - XGBoost** | Shared Fixed | 0.8220 | [0.7603, 0.8768] | 0.7948 | 0.1765 | 0.1710 | 0.5078 |
| **Benchmark A - Random Forest** | Shared Fixed | 0.8058 | [0.7418, 0.8664] | 0.7809 | 0.1765 | 0.1756 | 0.5185 |
| **Benchmark A - LightGBM** | Shared Fixed | 0.7997 | [0.7338, 0.8604] | 0.7717 | 0.1765 | 0.1833 | 0.5396 |
| **Benchmark B - Logistic Regression** | Shared Fixed | 0.8008 | [0.7375, 0.8642] | 0.7896 | 0.1647 | 0.1816 | 0.5270 |
| **Benchmark B - CatBoost** | Shared Fixed | 0.7788 | [0.7056, 0.8477] | 0.7295 | 0.1412 | 0.1918 | 0.5690 |
| **Benchmark B - Random Forest** | Shared Fixed | 0.7632 | [0.6865, 0.8392] | 0.7189 | 0.1294 | 0.2001 | 0.5882 |
| **Benchmark B - XGBoost** | Shared Fixed | 0.7315 | [0.6522, 0.8031] | 0.7021 | 0.1412 | 0.2148 | 0.6268 |
| **Benchmark B - LightGBM** | Shared Fixed | 0.7158 | [0.6360, 0.7926] | 0.6798 | 0.1412 | 0.2246 | 0.6565 |

---

## 4. Stratified Paired Bootstrap Analysis & Multiple Testing

To properly account for class structure, we implemented **stratified paired bootstrap resampling** (1,000 resamples drawing 85 positives and 85 negatives independently with replacement) to evaluate pairwise differences:

$$\Delta \text{AUC} = \text{AUC}(\text{Model}_1) - \text{AUC}(\text{Model}_2)$$

### 4.1 Benchmark A (Own Test Set) Stratified Paired Differences

| Model Pair | Observed $\Delta \text{AUC}$ | 95% Stratified CI | Uncorrected $p$-value | Bonferroni Sig ($\alpha=0.005$)? | Statistically Detectable Difference? |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression vs CatBoost** | $+0.0101$ | $[-0.0325, 0.0537]$ | $0.632$ | No | **No detectable difference** |
| **Logistic Regression vs XGBoost** | $+0.0137$ | $[-0.0379, 0.0660]$ | $0.618$ | No | **No detectable difference** |
| **Logistic Regression vs Random Forest** | $+0.0299$ | $[-0.0090, 0.0722]$ | $0.140$ | No | **No detectable difference** |
| **Logistic Regression vs LightGBM** | $+0.0361$ | $[-0.0123, 0.0864]$ | $0.152$ | No | **No detectable difference** |
| **CatBoost vs XGBoost** | $+0.0036$ | $[-0.0238, 0.0289]$ | $0.808$ | No | **No detectable difference** |
| **CatBoost vs Random Forest** | $+0.0198$ | $[+0.0015, +0.0393]$ | $0.040$ | No | Exploratory only (non-sig after Bonferroni) |
| **XGBoost vs LightGBM** | $+0.0224$ | $[+0.0006, +0.0428]$ | $0.042$ | No | Exploratory only (non-sig after Bonferroni) |
| **Random Forest vs LightGBM** | $+0.0062$ | $[-0.0237, 0.0366]$ | $0.702$ | No | **No detectable difference** |

### 4.2 Benchmark B (Own Test Set) Stratified Paired Differences

| Model Pair | Observed $\Delta \text{AUC}$ | 95% Stratified CI | Uncorrected $p$-value | Bonferroni Sig ($\alpha=0.005$)? | Statistically Detectable Difference? |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **CatBoost vs XGBoost** | $+0.0082$ | $[-0.0147, 0.0313]$ | $0.536$ | No | **No detectable difference** |
| **CatBoost vs Random Forest** | $+0.0094$ | $[-0.0108, 0.0292]$ | $0.340$ | No | **No detectable difference** |
| **XGBoost vs Random Forest** | $+0.0012$ | $[-0.0271, 0.0296]$ | $0.930$ | No | **No detectable difference** |
| **CatBoost vs LightGBM** | $+0.0256$ | $[-0.0057, 0.0609]$ | $0.108$ | No | **No detectable difference** |
| **XGBoost vs LightGBM** | $+0.0174$ | $[-0.0025, 0.0388]$ | $0.090$ | No | **No detectable difference** |
| **Random Forest vs LightGBM** | $+0.0162$ | $[-0.0141, 0.0498]$ | $0.318$ | No | **No detectable difference** |
| **CatBoost vs Logistic Regression** | $+0.0635$ | $[+0.0022, +0.1297]$ | $0.046$ | No | Exploratory only (non-sig after Bonferroni) |
| **Random Forest vs Logistic Regression** | $+0.0541$ | $[-0.0021, +0.1128]$ | $0.074$ | No | **No detectable difference** |
| **XGBoost vs Logistic Regression** | $+0.0554$ | $[-0.0130, +0.1298]$ | $0.126$ | No | **No detectable difference** |

---

## 5. Temporal, Seasonal, and Geographic Distribution Audit

### 5.1 Partition-by-Partition Seasonal Discrepancy
A separate breakdown of training and testing partitions reveals substantial seasonal asymmetry:

```
TRAINING PARTITION (N_train = 330: 165 Positives, 165 Background)
- Northeast Monsoon (Nov–Feb): Positives 47.3% vs. Background 32.1% (+15.2% difference)
- Inter-Monsoon 2 (Sep–Oct):   Positives 24.8% vs. Background 13.3% (+11.5% difference)
- Peak Wet Months (Sep–Feb):   Positives 72.1% vs. Background 45.4% (+26.7% difference)
- Top Flood Months:            November (20.0%), January (15.8%), October (14.5%)
- Top Background Months:       March (13.3%), August (10.3%), January (9.7%)

TESTING PARTITION (N_test = 170: 85 Positives, 85 Background)
- Northeast Monsoon (Nov–Feb): Positives 38.8% vs. Background 36.5%
- Inter-Monsoon 2 (Sep–Oct):   Positives 25.9% vs. Background 12.9% (+13.0% difference)
- Peak Wet Months (Sep–Feb):   Positives 64.7% vs. Background 49.4% (+15.3% difference)
- Top Flood Months:            November (15.3%), October (14.1%), December (12.9%)
- Top Background Months:       December (14.1%), January (11.8%), May (10.6%)
```

### 5.2 Seasonal Classification Shortcut
Because over $72\%$ of positive training events cluster in the wet half of the year while background points are scattered evenly across dry and wet months, classifiers can achieve high discrimination simply by recognizing broad wet-season baseline rainfall.

### 5.3 State Quotas: Verified Perfectly Matched
State quotas are 100% matched across both partitions:
- **Training ($N=330$):** Pulau Pinang ($24.8\%$), Selangor ($22.4\%$), Kedah ($14.5\%$), Johor ($6.1\%$), Kelantan ($6.1\%$), Pahang ($6.1\%$), Perak ($6.1\%$), Melaka ($5.5\%$), Negeri Sembilan ($3.0\%$), Kuala Lumpur ($2.4\%$), Terengganu ($2.4\%$), Perlis ($0.6\%$).
- **Testing ($N=170$):** Selangor ($16.5\%$), Perak ($14.1\%$), Pahang ($14.1\%$), Johor ($12.9\%$), Kedah ($11.8\%$), Pulau Pinang ($10.6\%$), Melaka ($5.9\%$), Kuala Lumpur ($4.7\%$), Terengganu ($3.5\%$), Negeri Sembilan ($3.5\%$), Kelantan ($2.4\%$).
State proportions between positive events and pseudo-negatives match exactly to within $0.0\%$.

---

## 6. Stage 5.11: Season-Matched Sensitivity Evaluation

In Stage 5.11, we executed a controlled diagnostic evaluation to test model sensitivity to seasonal alignment without retraining any model.

### 6.1 Feasibility Audit of Exact State-and-Month Matching
We audited the existing 2020–2021 test background pool ($N=85$ per benchmark) to determine whether exact 1:1 state-and-month matching for all 85 test positives is possible:
- **Test Positives ($N=85$):** Distributed across **49 distinct (State, Month) cells**.
- **Available Exact Matches in Benchmark A Background:** **$39 / 85$ ($45.9\%$)**.
- **Available Exact Matches in Benchmark B Background:** **$33 / 85$ ($38.8\%$)**.
- **Cell Shortages:** **$30$ cells in A and $33$ cells in B suffer acute background shortages**. For instance, in Pahang in December, the positives require 5 observations, but Benchmark A has only 3 (shortage of 2); in Kedah in October, the positives require 3 observations, but Benchmark A has 0 (shortage of 3).
- **Conclusion:** **Exact state-and-month matching to all 85 test positives is mathematically impossible** within the existing repository test pool without duplicating observations (prohibited) or fabricating new points.

### 6.2 Closest Defensible Matching Strategy
To conduct a scientifically defensible diagnostic without data fabrication, we evaluated:
1. **The Exact State-and-Month Matched Subcohort:**  
   Strict 100% exact state and month matching without replacement ($N_{\text{pos}}=39, N_{\text{bg}}=39$ for Benchmark A; $N_{\text{pos}}=33, N_{\text{bg}}=33$ for Benchmark B).
2. **The Full 85-Positive Cohort with Within-State Nearest-Month Matching:**  
   Preserves all 85 test positives and all 11 exact state quotas, matching month via minimum circular distance ($41.2\%$ exact month in A, $62.4\%$ within $\le 1$ month; average circular distance $1.34$ months).

### 6.3 Diagnostic Results: Original vs. Exact State-Month Matched Subcohort

#### Benchmark A (Uniform Background: $N_{\text{pos}}=39, N_{\text{bg}}=39$, Total $N=78$)

| Algorithm | Original AUC ($N=170$) | Matched Subcohort AUC ($N=78$) | $\Delta \text{AUC}$ | 95% Bootstrap CI of $\Delta \text{AUC}$ | Original AP | Matched Subcohort AP | $\Delta \text{AP}$ | Original Recall@10% | Matched Recall@10% |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression** | 0.8357 | **0.8297** | $-0.0060$ | $[-0.1208, 0.0987]$ | 0.8233 | 0.7956 | $-0.0277$ | 0.2000 | 0.1282 |
| **Random Forest** | 0.8058 | **0.7962** | $-0.0096$ | $[-0.1293, 0.1135]$ | 0.7809 | 0.7704 | $-0.0105$ | 0.1765 | 0.1538 |
| **CatBoost** | 0.8256 | **0.8054** | $-0.0202$ | $[-0.1425, 0.0977]$ | 0.7953 | 0.7773 | $-0.0180$ | 0.1882 | 0.1538 |
| **XGBoost** | 0.8220 | **0.7883** | $-0.0337$ | $[-0.1579, 0.0898]$ | 0.7948 | 0.7511 | $-0.0436$ | 0.1765 | 0.1538 |
| **LightGBM** | 0.7997 | **0.7561** | $-0.0436$ | $[-0.1745, 0.0845]$ | 0.7717 | 0.7298 | $-0.0418$ | 0.1765 | 0.1538 |

#### Benchmark B (Terrain-Restricted Background: $N_{\text{pos}}=33, N_{\text{bg}}=33$, Total $N=66$)

| Algorithm | Original AUC ($N=170$) | Matched Subcohort AUC ($N=66$) | $\Delta \text{AUC}$ | 95% Bootstrap CI of $\Delta \text{AUC}$ | Original AP | Matched Subcohort AP | $\Delta \text{AP}$ | Original Recall@10% | Matched Recall@10% |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression** | 0.7186 | **0.5849** | **$-0.1337$** | $[-0.2880, 0.0151]$ | 0.7073 | 0.5730 | $-0.1343$ | 0.1529 | 0.0909 |
| **Random Forest** | 0.7727 | **0.7052** | $-0.0675$ | $[-0.2136, 0.0738]$ | 0.7129 | 0.7161 | $+0.0032$ | 0.1529 | 0.1515 |
| **LightGBM** | 0.7565 | **0.7594** | **$+0.0029$** | $[-0.1327, 0.1355]$ | 0.6892 | 0.7378 | $+0.0487$ | 0.1412 | 0.1515 |
| **CatBoost** | 0.7821 | **0.7475** | $-0.0347$ | $[-0.1764, 0.0975]$ | 0.7115 | 0.7208 | $+0.0093$ | 0.1529 | 0.1515 |
| **XGBoost** | 0.7740 | **0.7603** | **$-0.0136$** | $[-0.1551, 0.1161]$ | 0.7056 | 0.7428 | $+0.0372$ | 0.1412 | 0.1515 |

### 6.4 Critical Methodological Interpretation of Sensitivity Findings
1. **Behavior of Linear Discrimination on Benchmark B:**  
   When background terrain is restricted to lowland bounds AND test samples are restricted to state-and-month matched pairs, **Logistic Regression drops from $0.7186$ to $0.5849$** (with Average Precision falling from $0.7073$ to $0.5730$). This indicates that linear ranking on Benchmark B was substantially assisted by seasonal background contrast (wet-month versus dry-month rainfall differences), rather than purely local acute rainfall anomalies.
2. **Behavior of Boosted Tree Ensembles on the Matched Subcohort:**  
   In contrast, **gradient-boosted decision trees (XGBoost $0.7603$, LightGBM $0.7594$, CatBoost $0.7475$) maintained higher discriminative ranking scores** on this reduced matched subcohort. Because decision trees segment feature space via step functions rather than monotonic slopes, they can distinguish high short-term rainfall pulses against moderate background wetness without requiring seasonal separation.
3. **Reduced-Subcohort Sensitivity, Not Confounder Elimination:**  
   Restricting the evaluation to exact state-and-month matches reduces the evaluation set to $N=78$ (Benchmark A) and $N=66$ (Benchmark B). This subcohort necessarily overweights states and months where background points happen to be available, introducing selection bias. Therefore, **this analysis is a diagnostic sensitivity check on a reduced subcohort, not proof that seasonal confounding has been eliminated from the modeling framework**.
4. **Non-Operational Disclaimer:**  
   Performance metrics on this matched subcohort **must not be misconstrued as proof of operational flood forecasting capability or calibrated real-world risk prediction**. The models remain retrospective classifiers evaluated on an experimental presence-background cohort.

---

## 7. Explicit Academic Disclaimers

> [!CAUTION]
> **Scientific Limitations Notice:** The findings presented in this benchmark must be interpreted with the following strict scientific caveats:

1. **Third-Party Administrative Provenance:**
   - Positive flood data originate from an unofficial third-party compilation attributed to public JPS reports.
   - Locations represent approximate text-based geocodes (e.g., district or village centroids), **not surveyed flood extents or sensor-instrumented station coordinates**.
2. **Uncertain Background vs. Absence:**
   - Background samples are unmonitored landscape points, **not confirmed flood-free observations**. Minor localized flooding may have occurred without triggering official JPS reporting.
3. **Brier Score & Log Loss Context:**
   - Brier scores ($0.16 - 0.22$) and log loss ($0.48 - 0.65$) reflect discrimination against the artificial 50:50 experimental cohort, **not calibrated real-world flood probabilities**. In real-world operation, the daily flood incidence is $\ll 1\%$.
4. **Non-Operational Demonstration:**
   - These models demonstrate retrospective spatial-temporal discrimination under controlled research conditions. They **must not be used as operational flood early warning or emergency management systems**.

---

## 8. Artifact Inventory & Reproducibility

### 8.1 Diagnostic Artifacts Created in Stage 5.11
- **Evaluation Script:** [`scripts/eval_stage5_11_season_matched.py`](file:///c:/Users/btryiafrn/.gemini/antigravity-ide/scratch/floodway-huawei/floodway-huawei/scripts/eval_stage5_11_season_matched.py)
- **Diagnostic Metrics JSON:** [`results/stage5_11_season_matched_metrics.json`](file:///c:/Users/btryiafrn/.gemini/antigravity-ide/scratch/floodway-huawei/floodway-huawei/results/stage5_11_season_matched_metrics.json)
- **Matched Predictions (Benchmark A):** [`results/stage5_11_benchmark_a_matched_predictions.csv`](file:///c:/Users/btryiafrn/.gemini/antigravity-ide/scratch/floodway-huawei/floodway-huawei/results/stage5_11_benchmark_a_matched_predictions.csv)
- **Matched Predictions (Benchmark B):** [`results/stage5_11_benchmark_b_matched_predictions.csv`](file:///c:/Users/btryiafrn/.gemini/antigravity-ide/scratch/floodway-huawei/floodway-huawei/results/stage5_11_benchmark_b_matched_predictions.csv)
- **Preserved Existing Artifacts:** All 10 models in `models/stage5_8_*`, all Stage 5.3A datasets, all predictions in `results/stage5_8_*`, and all backend/frontend source files remain completely untouched.

### 8.2 Execution Command
```powershell
cd c:\Users\btryiafrn\.gemini\antigravity-ide\scratch\floodway-huawei\floodway-huawei
.venv\Scripts\python scripts/eval_stage5_11_season_matched.py
```
Deterministic execution with `random_seed=42`.
