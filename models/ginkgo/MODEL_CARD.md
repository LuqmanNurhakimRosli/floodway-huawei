# GINKGO Model 1: flood susceptibility classifiers

**Status:** trained by the GINKGO team for PLAN-AI 2026 (owner: Nadi); copied into this repo on 2026-10-20 from the team's `models copy` folder. **Not served by the app.** No accuracy is claimed here.
**Checked by:** `models/ginkgo/inspect_models.py` (every fact below that comes from the files is asserted there).

## Files

| ID (registry) | File | Type | Size | Settings |
|---|---|---|---|---|
| `flood_rf` | `trained/flood_rf_model.pkl` | RandomForestClassifier | 2361.4 KB | 30 trees, max depth 12, `max_features="sqrt"` |
| `flood_hgb` | `trained/flood_hgb_model.pkl` | HistGradientBoostingClassifier | 190.7 KB | 50 iterations, max depth 8, learning rate 0.1, 31 leaves |
| `flood_dt` | `trained/flood_dt_model.pkl` | DecisionTreeClassifier | 34.0 KB | Max depth 10, 210 leaves |
| `flood_lr` | `trained/flood_lr_model.pkl` | LogisticRegression | 0.9 KB | L2, C = 1.0, lbfgs |

All four use `random_state=42`. They were saved with **scikit-learn 1.7.2**; load them with that version (`requirements.txt`). Version 1.6.1 loads them with "might lead to invalid results" warnings.

`registry.py` is the team's loader: `ModelRegistry(models_dir).load_flood_model("flood_rf")` returns the model or `None`, never raises. It names the Random Forest as primary; the GINKGO infographic names HistGradientBoosting. Pick one before the pitch.

## What the files show

1. **Eight inputs, no names.** Every model takes exactly 8 numbers (`n_features_in_ = 8`). The models were trained on a bare array, so the feature names and their order were not saved. The GINKGO infographic lists at least 14 inputs (Sentinel-2 B02, B03, B04, B08, B11; NDWI, MNDWI, NDVI, NDBI; DEM elevation, slope, wetness index; distance to watercourse; flow accumulation). **The files do not match that list.**
2. **Two classes, not three bands.** The output is class 0 or 1. The 0 to 100 score with Low, Moderate and High bands can only be the class-1 probability × 100; that mapping is an assumption until the owner confirms it.
3. **A hard rule at the top of the tree.** The decision tree's first split is `x3 <= 1.5`, and that branch is a leaf that always predicts class 0. The threshold sits between whole numbers, so `x3` is probably a category or a scenario number (the GINKGO rainfall scenarios were 50, 120 and 200 mm/hr). If `x3` encodes the scenario or anything derived from the label, the near-perfect accuracy comes from it, not from the terrain. This is the first thing to check.
4. **One input dominates the linear baseline.** Logistic regression weights `x6` at +2.196; every other weight is under 0.1 in size. The tree splits `x6` at 0.68, so `x6` is a 0 to 1 value (an index or a share).
5. **The published sizes are these files.** The sizes in the GINKGO Model 1 benchmark table (190.7 KB, 2361.4 KB, 34.0 KB, 0.9 KB) match these four files exactly. The "Model 2: Siamese U-Net + RF" table repeats the same sizes, so it describes these scikit-learn files, not a U-Net. Do not reuse it.

## Speed (timing only)

One run on this laptop, `predict_proba` on 100,000 rows of random numbers (scikit-learn 1.7.2, Python 3.11, Intel64 Family 6 Model 142, the Windows report of the CPU):

| Model | Time |
|---|---|
| Random Forest | 98.7 ms |
| HistGradientBoosting | 305.4 ms |
| Decision Tree | 15.7 ms |
| Logistic Regression | 12.8 ms |

These are not the published latencies (125.34 ms for HistGradientBoosting and so on), which came from another machine. All four score 100,000 rows in under a second here, so "sub-second scoring" holds on this laptop for this many rows, and only that.

## What is needed before any accuracy is shown

From the model owner:

1. **The feature list in training order, with units**, and the exact dataset URL, licence, location and dates.
2. **The training notebook**, including how the label was made and how the test split was drawn.

Then run the tests in `docs/architecture/FLOODWAY_OVERVIEW.md` section 7.2: drop the water indices and retrain (leakage), spatial block cross-validation, leave-one-event-out, the hotspot check, and per-class F1 with the confusion matrix. Report the High-class F1 from the spatial test, not the random-split accuracy.

## Use in FloodWay (plan)

Model 1 answers *where* water is likely to collect, not *when*. In the Google-stack plan (`docs/plans/GLOBAL_STACK_PLAN.md`), its inputs are extracted with Google Earth Engine (Sentinel-2, Copernicus DEM), the score is precomputed offline for the pilot district, and the map tiles are served from Cloud Storage. It is not served per request, and it is not wired into the backend until the feature order is known: scoring 8 unnamed numbers would give wrong answers that look right.
