# Guide: training and benchmarking flood models on the Malaysia flood dataset

Purpose: give a reproducible benchmark that a judge can rerun. The rule is the reproducibility rule from the competition: if the numbers cannot be reproduced from the submitted materials, the entry loses eligibility. So every step below writes down what was done.

---

## 0. Scope and limits (read first)

- **Dataset:** `datasets/_MalaysiaFloodDataset_MalaysiaFloodDataset.csv`. 825 rows. 75 districts. Years 2000 to 2010. Columns: `STATE, DISTRICT, YEAR, JAN … DEC, 0V, ANNUAL RAINFALL, FLOOD` (note the trailing space in the header of `FLOOD`; strip it). `FLOOD` is 1 for 347 rows and 0 for the rest (about 42% positive).
- **Granularity:** one row per district per year. It can predict whether a district-year is flood-affected. It **cannot** predict an hourly level, a 15-minute onset, or tower failure. Do not use it for the GRU forecaster or for the river node.
- **Provenance is unknown.** Find the source before any claim. If it cannot be found, say so on the slide and in the report.
- **Label check first.** If `FLOOD` was made from `ANNUAL RAINFALL` or from a month's rainfall with a fixed threshold, a model that uses those columns is learning the label rule, not flood physics. Test this (step 2).
- **The legacy ANN notebook** (`models/legacy_ann/flood_detection_using_ann.ipynb`) was staged but not read. Read it before repeating its method.
- **The keanteng/streamlit_floodv2 dataset** has not been read (blocked). If it is the same file, say so; if not, benchmark it separately.
- **GRU forecaster:** synthetic only. Its numbers prove the pipeline, not performance. Never quote them.

---

## 1. Environment and reproducibility

- Python 3.11, scikit-learn 1.7.2 (the version the GINKGO models were saved with), pandas, numpy, matplotlib, and optionally xgboost or lightgbm.
- Set `SEED = 42` everywhere, including NumPy, Python's `random`, and each model's `random_state`.
- Pin versions in `requirements.txt`. Record `pip freeze` in the results folder.
- One script, one command. Example: `python models/benchmark/run_benchmark.py --data datasets/... --out results/`.
- Write a `results/RUN.json` with: data file SHA-256, seed, library versions, split definition, and the git commit.

---

## 2. Clean and check the data

1. Strip column names (`FLOOD ` has a trailing space).
2. Check for duplicates on `(STATE, DISTRICT, YEAR)`. Remove or report them.
3. Check missing values per column; document the handling. Do not fill the label.
4. Check the value ranges (rainfall must be ≥ 0).
5. Check the label balance by year and by state. Report it.
6. **Leakage check on the label.** Fit a one-rule tree on `ANNUAL RAINFALL` alone. If it reproduces `FLOOD` almost perfectly, the label was made from rainfall, and the benchmark is measuring the rule. Report this in the first slide of the results.
7. Check that `ANNUAL RAINFALL` equals the sum of the twelve months (or note how it differs). Keep it only if it is not derived from the label.

---

## 3. Features

Start with the raw features and document each one:

- Monthly rainfall: `JAN` to `DEC`
- `0V` (check its meaning with the data source; do not guess)
- Derived, if useful: wet-season total (for example Oct to Jan), max month, number of months above a monthly threshold (state the threshold; do not tune it on the test years)
- `STATE` as one-hot encoding (fit on the training fold only)

Do not use `DISTRICT` as a numeric feature. Use it only as a group key.

---

## 4. Splits (the most important part)

The same district appears every year, so a random split leaks: the model learns the district, not the weather. Use two splits and report both.

- **A. Time split:** train on 2000 to 2007, test on 2008 to 2010. This mimics predicting the future.
- **B. Grouped split:** `GroupKFold` (or `StratifiedGroupKFold`) on `DISTRICT`, so no district appears in both train and test. Use 5 folds.
- **C. Repeated grouped CV** (optional, for error bars): 5 folds, repeated with 5 seeds.

Report a random split only as a warning that shows the leakage size (the gap between random and grouped scores). Never report it as the main result.

---

## 5. Algorithms to benchmark

Minimum set (all with `random_state=42` where applicable):

| Model | Notes |
|---|---|
| Majority class | Baseline. Must be beaten. |
| Rule: `ANNUAL RAINFALL` > threshold | Simple baseline; threshold fit on training folds only |
| Logistic regression (L2, standardised inputs) | Interpretable; coefficients reported |
| Decision tree (max depth 3 to 6) | Interpretable; check the first split |
| Random forest (200 trees, `max_features="sqrt"`) | Strong on tabular data |
| Gradient boosting (`HistGradientBoostingClassifier`) | Strong; the GINKGO HGB is this family |
| Small MLP (one hidden layer, 16 to 32 units, early stopping) | Matches the legacy ANN idea; keep it small |

Optional: XGBoost or LightGBM, if installed. Do not add a model you cannot explain.

**Tuning:** only on the training folds, with an inner grouped CV. Never tune on the test years or test folds. Record the grid.

---

## 6. Metrics

Report, for every model, on each split:

- **ROC-AUC** and **PR-AUC** (PR-AUC matters because the classes are not very unbalanced, but both should be shown)
- **F1 for the flood class**, with precision and recall
- **Balanced accuracy**
- **Brier score** and a **calibration curve** (the warning level is a probability, so calibration matters)
- **Confusion matrix** at a threshold chosen on training data (not the test data)
- **Cohen's kappa**, if the output is used as a level

Report mean and standard deviation across folds, or a bootstrap 95% CI on the test set.

**Threshold:** pick it on the training data (for example the value that maximises F1 in the inner CV). Report the threshold you used.

---

## 7. Results table to produce

| Model | Split | ROC-AUC | PR-AUC | F1 (flood) | Precision | Recall | Brier |
|---|---|---|---|---|---|---|---|
| Majority | … | | | | | | |
| Rule (annual) | … | | | | | | |
| Logistic | … | | | | | | |
| Tree | … | | | | | | |
| Random forest | … | | | | | | |
| HGB | … | | | | | | |
| MLP | … | | | | | | |

Fill in only from a run you can reproduce. Keep the raw CSV of per-fold scores in `results/`.

---

## 8. Interpretation checks

1. Feature importance: permutation importance on the test fold, not the impurity importance of the forest.
2. Does the model beat the rule baseline by a margin larger than the fold standard deviation? If not, say so.
3. Does performance drop between the random split and the grouped split? That gap is the leakage size.
4. Do the errors cluster in one state? Report per-state recall.

---

## 9. What may be claimed

- "On the 2000–2010 district dataset, grouped by district, model X reached ROC-AUC Y (95% CI Z)."
- "The label appears to depend on annual rainfall: a one-rule baseline reaches W."
- "This dataset is district-year; it does not predict hourly levels."

What may **not** be claimed:

- Any accuracy for GINKGO Model 1 until its feature list and notebook are supplied and the leakage tests pass.
- Any performance for the GRU forecaster (synthetic only).
- Any real-time prediction, lead time, or tower-failure accuracy.

---

## 10. Output checklist before submission

- [ ] `RUN.json` written with the data hash, seed and versions
- [ ] Label-leakage check reported
- [ ] Time split and grouped split both reported; random split only as a warning
- [ ] All seven models run, including the baselines
- [ ] Thresholds chosen on training data only
- [ ] Results table and per-fold CSV saved
- [ ] One command reproduces the table from a clean checkout
- [ ] Licence and provenance of the dataset written in the README
- [ ] Every number on a slide traced to a line in `results/`
