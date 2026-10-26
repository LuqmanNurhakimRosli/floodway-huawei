"""
scripts/train_stage5_8_five_models.py

FloodWay Stage 5.8: Five-Algorithm Machine Learning Benchmark
Compares five supervised classification algorithms for distinguishing reported flood incidents
from uncertain landscape background samples:
  1. Logistic Regression (L2 regularized, StandardScaler fitted on train)
  2. Random Forest (100 trees, max_depth=5, min_samples_leaf=10)
  3. LightGBM (100 trees, max_depth=4, num_leaves=15, min_child_samples=10, lr=0.05)
  4. CatBoost (100 trees, depth=4, lr=0.05)
  5. XGBoost (100 trees, max_depth=4, subsample=0.8, colsample_bytree=0.8, lr=0.05)

Constraints & Integrity Rules:
- Reuses existing Stage 5.3A datasets (Benchmark A, Benchmark B, Shared Fixed Test).
- Exactly five predictors in exact order:
    ['rain_1d_prior_mm', 'rain_3d_prior_mm', 'rain_7d_prior_mm', 'elevation_m', 'slope_deg']
- Strict temporal split: Train <= 2019 (165 positives + 165 background), Test >= 2020 (85 positives + 85 background).
- Preprocessing fitted exclusively on training data.
- Reproducible random_state=42 everywhere.
- Evaluated on:
    1) Benchmark A own test set (85 test positives + 85 uniform background)
    2) Benchmark B own test set (85 test positives + 85 terrain-restricted background)
    3) Shared Fixed Test Set (85 test positives + 85 uniform background)
- Robust tie-corrected Recall@Top10% and 95% bootstrap confidence intervals for ROC-AUC.
- Saves all artifacts under new filenames (stage5_8_*), preserving previous stage models.
"""

import os
import sys
import json
import math
import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import roc_auc_score, average_precision_score, brier_score_loss, log_loss

# Boosting libraries
import lightgbm as lgb
from catboost import CatBoostClassifier
import xgboost as xgb

RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)

INPUT_BENCHMARK_A_CSV = "datasets/floodway_stage5_3a_benchmark_a_modeling_500.csv"
INPUT_BENCHMARK_B_CSV = "datasets/floodway_stage5_3a_benchmark_b_modeling_500.csv"
INPUT_SHARED_TEST_CSV = "datasets/floodway_stage5_3a_shared_fixed_test_170.csv"

MODELS_DIR = "models"
RESULTS_DIR = "results"
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

PREDICTIVE_FEATURES = [
    "rain_1d_prior_mm",
    "rain_3d_prior_mm",
    "rain_7d_prior_mm",
    "elevation_m",
    "slope_deg"
]

ALGORITHMS = [
    "Logistic Regression",
    "Random Forest",
    "LightGBM",
    "CatBoost",
    "XGBoost"
]


def compute_recall_at_top_k_percent_robust(y_true, y_scores, k_percent=10.0):
    """
    Computes Recall@Top K% with exact tie handling.
    If scores are completely tied, expected recall is k_percent%.
    Otherwise, handles boundary ties by fractional allocation.
    """
    n_total = len(y_true)
    n_top = max(1, int(math.floor((k_percent / 100.0) * n_total)))
    total_pos = int(np.sum(y_true == 1))

    if np.all(y_scores == y_scores[0]):
        expected_pos_captured = (n_top / n_total) * total_pos
        expected_recall = expected_pos_captured / total_pos if total_pos > 0 else 0.0
        return {
            "recall": round(expected_recall, 4),
            "pos_captured": f"{expected_pos_captured:.1f} / {total_pos} (expected under ties)",
            "n_top": n_top,
            "tie_condition": "ALL_SCORES_TIED"
        }

    sorted_scores = np.sort(y_scores)[::-1]
    cutoff_score = sorted_scores[n_top - 1]

    strictly_above = y_scores > cutoff_score
    pos_strictly_above = np.sum(y_true[strictly_above] == 1)
    count_strictly_above = np.sum(strictly_above)

    at_cutoff = y_scores == cutoff_score
    pos_at_cutoff = np.sum(y_true[at_cutoff] == 1)
    count_at_cutoff = np.sum(at_cutoff)

    slots_needed = n_top - count_strictly_above
    if count_at_cutoff > 0:
        frac_at_cutoff = slots_needed / count_at_cutoff
        pos_captured = pos_strictly_above + frac_at_cutoff * pos_at_cutoff
    else:
        pos_captured = pos_strictly_above

    recall = pos_captured / total_pos if total_pos > 0 else 0.0
    return {
        "recall": round(float(recall), 4),
        "pos_captured": f"{pos_captured:.2f} / {total_pos}",
        "n_top": n_top,
        "tie_condition": "TIE_AT_BOUNDARY" if count_at_cutoff > slots_needed else "NO_TIE"
    }


def bootstrap_roc_auc_ci(y_true, y_scores, n_bootstraps=1000, alpha=0.05):
    """Computes empirical bootstrap 95% confidence interval for ROC-AUC."""
    rng = np.random.RandomState(RANDOM_SEED)
    bootstrapped_scores = []
    n = len(y_true)

    for _ in range(n_bootstraps):
        indices = rng.randint(0, n, n)
        if len(np.unique(y_true[indices])) < 2:
            continue
        score = roc_auc_score(y_true[indices], y_scores[indices])
        bootstrapped_scores.append(score)

    bootstrapped_scores = np.sort(bootstrapped_scores)
    lower_idx = int((alpha / 2.0) * len(bootstrapped_scores))
    upper_idx = int((1.0 - alpha / 2.0) * len(bootstrapped_scores))

    ci_lower = float(bootstrapped_scores[lower_idx])
    ci_upper = float(bootstrapped_scores[upper_idx])
    return round(ci_lower, 4), round(ci_upper, 4)


def evaluate_model(model_name, y_true, y_scores):
    """Calculates comprehensive evaluation metrics on test partition."""
    roc = float(roc_auc_score(y_true, y_scores))
    pr_auc = float(average_precision_score(y_true, y_scores))
    brier = float(brier_score_loss(y_true, y_scores))
    
    # Clip scores to [1e-7, 1-1e-7] for numerical stability in log loss
    eps = 1e-7
    clipped_scores = np.clip(y_scores, eps, 1.0 - eps)
    ll = float(log_loss(y_true, clipped_scores))
    
    ci_low, ci_high = bootstrap_roc_auc_ci(y_true, y_scores)
    rec_data = compute_recall_at_top_k_percent_robust(y_true, y_scores, 10.0)

    return {
        "model_name": model_name,
        "n_test_total": int(len(y_true)),
        "n_positives": int(np.sum(y_true == 1)),
        "n_background": int(np.sum(y_true == 0)),
        "roc_auc": round(roc, 4),
        "roc_auc_95_ci": [ci_low, ci_high],
        "average_precision_pr_auc": round(pr_auc, 4),
        "recall_at_top_10_percent": rec_data["recall"],
        "top_10_positives_captured": rec_data["pos_captured"],
        "brier_score": round(brier, 4),
        "log_loss": round(ll, 4),
        "tie_condition": rec_data["tie_condition"]
    }


def build_models():
    """
    Instantiates the five algorithms with simple, reproducible hyperparameters.
    Regularization is appropriately chosen to avoid overfitting on N_train=330.
    """
    models = {
        "Logistic Regression": Pipeline([
            ("scaler", StandardScaler()),
            ("classifier", LogisticRegression(C=1.0, random_state=RANDOM_SEED, max_iter=1000))
        ]),
        "Random Forest": RandomForestClassifier(
            n_estimators=100,
            max_depth=5,
            min_samples_leaf=10,
            random_state=RANDOM_SEED
        ),
        "LightGBM": lgb.LGBMClassifier(
            n_estimators=100,
            max_depth=4,
            num_leaves=15,
            min_child_samples=10,
            learning_rate=0.05,
            random_state=RANDOM_SEED,
            verbose=-1
        ),
        "CatBoost": CatBoostClassifier(
            iterations=100,
            depth=4,
            learning_rate=0.05,
            random_seed=RANDOM_SEED,
            verbose=False
        ),
        "XGBoost": xgb.XGBClassifier(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=RANDOM_SEED,
            eval_metric="logloss"
        )
    }
    return models


def extract_descriptive_importance(model, model_name):
    """Extracts standardized weights or tree feature importances."""
    if model_name == "Logistic Regression":
        weights = model.named_steps["classifier"].coef_[0]
        return {k: round(float(v), 4) for k, v in zip(PREDICTIVE_FEATURES, weights)}
    elif model_name == "Random Forest":
        weights = model.feature_importances_
        return {k: round(float(v), 4) for k, v in zip(PREDICTIVE_FEATURES, weights)}
    elif model_name == "LightGBM":
        # Normalized feature importances (gain)
        raw_imp = model.booster_.feature_importance(importance_type="gain")
        norm_imp = raw_imp / np.sum(raw_imp) if np.sum(raw_imp) > 0 else raw_imp
        return {k: round(float(v), 4) for k, v in zip(PREDICTIVE_FEATURES, norm_imp)}
    elif model_name == "CatBoost":
        raw_imp = model.get_feature_importance()
        norm_imp = raw_imp / np.sum(raw_imp) if np.sum(raw_imp) > 0 else raw_imp
        return {k: round(float(v), 4) for k, v in zip(PREDICTIVE_FEATURES, norm_imp)}
    elif model_name == "XGBoost":
        raw_imp = model.feature_importances_
        return {k: round(float(v), 4) for k, v in zip(PREDICTIVE_FEATURES, raw_imp)}
    return {}


def main():
    print("=" * 80)
    print("STAGE 5.8: FIVE-ALGORITHM MACHINE LEARNING BENCHMARK")
    print("=" * 80)

    # 1. Load Modeling Datasets
    print("\n--- 1. Loading Datasets ---")
    df_a = pd.read_csv(INPUT_BENCHMARK_A_CSV)
    df_b = pd.read_csv(INPUT_BENCHMARK_B_CSV)
    df_shared_test = pd.read_csv(INPUT_SHARED_TEST_CSV)

    print(f"Loaded Benchmark A: {len(df_a)} rows (Train: {(df_a['split']=='train').sum()}, Test: {(df_a['split']=='test').sum()})")
    print(f"Loaded Benchmark B: {len(df_b)} rows (Train: {(df_b['split']=='train').sum()}, Test: {(df_b['split']=='test').sum()})")
    print(f"Loaded Shared Fixed Test: {len(df_shared_test)} rows")

    # 2. Rigorous Data Leakage & Integrity Audits
    print("\n--- 2. Data Leakage & Record Integrity Audit ---")
    pos_a = df_a[df_a["target"] == 1]["sample_id"].values
    pos_b = df_b[df_b["target"] == 1]["sample_id"].values
    assert (pos_a == pos_b).all(), "Positive sample IDs mismatch between Benchmark A and B"
    print("  [PASS] Identical 250 positive flood records across Benchmark A and B.")

    train_a = df_a[df_a["split"] == "train"].copy()
    test_a = df_a[df_a["split"] == "test"].copy()
    train_b = df_b[df_b["split"] == "train"].copy()
    test_b = df_b[df_b["split"] == "test"].copy()

    # Temporal partition check
    assert train_a["year"].max() <= 2019 and test_a["year"].min() >= 2020, "Temporal leakage in Benchmark A"
    assert train_b["year"].max() <= 2019 and test_b["year"].min() >= 2020, "Temporal leakage in Benchmark B"
    print("  [PASS] Strict temporal split: Train <= 2019, Test >= 2020.")

    # Sample ID disjointness check
    assert len(set(train_a["sample_id"]).intersection(set(test_a["sample_id"]))) == 0, "Train/Test overlap in A"
    assert len(set(train_b["sample_id"]).intersection(set(test_b["sample_id"]))) == 0, "Train/Test overlap in B"
    assert len(set(train_a["sample_id"]).intersection(set(df_shared_test["sample_id"]))) == 0, "Shared test overlap with Train A"
    assert len(set(train_b["sample_id"]).intersection(set(df_shared_test["sample_id"]))) == 0, "Shared test overlap with Train B"
    print("  [PASS] Zero ID overlap across train, test, and shared test sets.")

    # Feature verification
    for col in PREDICTIVE_FEATURES:
        assert col in df_a.columns and col in df_b.columns and col in df_shared_test.columns, f"Missing feature {col}"
        assert not df_a[col].isna().any(), f"NaN in {col} of Benchmark A"
        assert not df_b[col].isna().any(), f"NaN in {col} of Benchmark B"
        assert not df_shared_test[col].isna().any(), f"NaN in {col} of Shared Test"
    print(f"  [PASS] Exactly 5 features present with zero missing values: {PREDICTIVE_FEATURES}")

    # 3. Prepare Feature Matrices
    X_train_a = train_a[PREDICTIVE_FEATURES].values
    y_train_a = train_a["target"].values
    X_test_a = test_a[PREDICTIVE_FEATURES].values
    y_test_a = test_a["target"].values

    X_train_b = train_b[PREDICTIVE_FEATURES].values
    y_train_b = train_b["target"].values
    X_test_b = test_b[PREDICTIVE_FEATURES].values
    y_test_b = test_b["target"].values

    X_shared = df_shared_test[PREDICTIVE_FEATURES].values
    y_shared = df_shared_test["target"].values

    # Storage for all outputs
    trained_models_a = {}
    trained_models_b = {}
    
    pred_test_a = {}
    pred_test_b = {}
    pred_shared_from_a = {}
    pred_shared_from_b = {}

    feature_importances_a = {}
    feature_importances_b = {}

    eval_a_own = []
    eval_b_own = []
    eval_shared = []

    # 4. Train and Evaluate on Benchmark A
    print("\n--- 3. Training & Evaluating 5 Algorithms on Benchmark A (Uniform Background) ---")
    models_a = build_models()
    for name in ALGORITHMS:
        model = models_a[name]
        print(f"  Training {name} on Benchmark A (N_train={len(X_train_a)})...")
        model.fit(X_train_a, y_train_a)
        trained_models_a[name] = model

        # Predict probabilities
        scores_test_a = model.predict_proba(X_test_a)[:, 1]
        scores_shared_a = model.predict_proba(X_shared)[:, 1]
        
        pred_test_a[name] = scores_test_a
        pred_shared_from_a[name] = scores_shared_a

        # Evaluate on own test
        res_own = evaluate_model(name, y_test_a, scores_test_a)
        eval_a_own.append(res_own)

        # Evaluate on shared test
        res_shared = evaluate_model(f"Benchmark A - {name}", y_shared, scores_shared_a)
        eval_shared.append(res_shared)

        # Feature importances
        feature_importances_a[name] = extract_descriptive_importance(model, name)

        # Save model
        filename = f"stage5_8_benchmark_a_{name.lower().replace(' ', '_')}.joblib"
        joblib.dump(model, os.path.join(MODELS_DIR, filename))

    # 5. Train and Evaluate on Benchmark B
    print("\n--- 4. Training & Evaluating 5 Algorithms on Benchmark B (Terrain-Restricted Background) ---")
    models_b = build_models()
    for name in ALGORITHMS:
        model = models_b[name]
        print(f"  Training {name} on Benchmark B (N_train={len(X_train_b)})...")
        model.fit(X_train_b, y_train_b)
        trained_models_b[name] = model

        # Predict probabilities
        scores_test_b = model.predict_proba(X_test_b)[:, 1]
        scores_shared_b = model.predict_proba(X_shared)[:, 1]

        pred_test_b[name] = scores_test_b
        pred_shared_from_b[name] = scores_shared_b

        # Evaluate on own test
        res_own = evaluate_model(name, y_test_b, scores_test_b)
        eval_b_own.append(res_own)

        # Evaluate on shared test
        res_shared = evaluate_model(f"Benchmark B - {name}", y_shared, scores_shared_b)
        eval_shared.append(res_shared)

        # Feature importances
        feature_importances_b[name] = extract_descriptive_importance(model, name)

        # Save model
        filename = f"stage5_8_benchmark_b_{name.lower().replace(' ', '_')}.joblib"
        joblib.dump(model, os.path.join(MODELS_DIR, filename))

    # 6. Save Predictions to CSV
    print("\n--- 5. Saving Predictions ---")
    out_pred_a_df = test_a.copy()
    for name in ALGORITHMS:
        slug = name.lower().replace(' ', '_')
        out_pred_a_df[f"pred_score_{slug}"] = pred_test_a[name]
    pred_a_path = os.path.join(RESULTS_DIR, "stage5_8_benchmark_a_predictions.csv")
    out_pred_a_df.to_csv(pred_a_path, index=False)
    print(f"  Saved Benchmark A predictions: {pred_a_path}")

    out_pred_b_df = test_b.copy()
    for name in ALGORITHMS:
        slug = name.lower().replace(' ', '_')
        out_pred_b_df[f"pred_score_{slug}"] = pred_test_b[name]
    pred_b_path = os.path.join(RESULTS_DIR, "stage5_8_benchmark_b_predictions.csv")
    out_pred_b_df.to_csv(pred_b_path, index=False)
    print(f"  Saved Benchmark B predictions: {pred_b_path}")

    out_pred_shared_df = df_shared_test.copy()
    for name in ALGORITHMS:
        slug = name.lower().replace(' ', '_')
        out_pred_shared_df[f"pred_score_bmk_a_{slug}"] = pred_shared_from_a[name]
        out_pred_shared_df[f"pred_score_bmk_b_{slug}"] = pred_shared_from_b[name]
    pred_shared_path = os.path.join(RESULTS_DIR, "stage5_8_shared_test_predictions.csv")
    out_pred_shared_df.to_csv(pred_shared_path, index=False)
    print(f"  Saved Shared Fixed Test predictions: {pred_shared_path}")

    # 7. Print Formatted Comparison Tables
    print("\n" + "=" * 90)
    print("BENCHMARK A OWN TEST SET RESULTS (85 Positives + 85 Uniform Background)")
    print("=" * 90)
    df_eval_a = pd.DataFrame(eval_a_own)
    print(df_eval_a[["model_name", "roc_auc", "roc_auc_95_ci", "average_precision_pr_auc", "recall_at_top_10_percent", "top_10_positives_captured", "brier_score", "log_loss"]].to_string(index=False))

    print("\n" + "=" * 90)
    print("BENCHMARK B OWN TEST SET RESULTS (85 Positives + 85 Terrain-Restricted Background)")
    print("=" * 90)
    df_eval_b = pd.DataFrame(eval_b_own)
    print(df_eval_b[["model_name", "roc_auc", "roc_auc_95_ci", "average_precision_pr_auc", "recall_at_top_10_percent", "top_10_positives_captured", "brier_score", "log_loss"]].to_string(index=False))

    print("\n" + "=" * 90)
    print("SHARED FIXED TEST SET RESULTS (85 Positives + 85 Uniform Background)")
    print("=" * 90)
    df_eval_shared = pd.DataFrame(eval_shared)
    print(df_eval_shared[["model_name", "roc_auc", "roc_auc_95_ci", "average_precision_pr_auc", "recall_at_top_10_percent", "top_10_positives_captured", "brier_score", "log_loss"]].to_string(index=False))

    # 8. Save Metadata & Metrics JSON
    metadata = {
        "stage": "5.8",
        "description": "Five-Algorithm Machine Learning Benchmark for Flood Discrimination",
        "algorithms": ALGORITHMS,
        "predictive_features": PREDICTIVE_FEATURES,
        "excluded_features": ["latitude", "longitude", "rain_event_day_mm", "date", "year", "state", "place"],
        "hyperparameters": {
            "Logistic Regression": "StandardScaler(fit on train) + LogisticRegression(C=1.0, random_state=42, max_iter=1000)",
            "Random Forest": "RandomForestClassifier(n_estimators=100, max_depth=5, min_samples_leaf=10, random_state=42)",
            "LightGBM": "LGBMClassifier(n_estimators=100, max_depth=4, num_leaves=15, min_child_samples=10, lr=0.05, random_state=42)",
            "CatBoost": "CatBoostClassifier(iterations=100, depth=4, lr=0.05, random_seed=42, verbose=False)",
            "XGBoost": "XGBClassifier(n_estimators=100, max_depth=4, lr=0.05, subsample=0.8, colsample_bytree=0.8, random_state=42, eval_metric='logloss')"
        },
        "records": {
            "n_train": 330,
            "n_test_own": 170,
            "n_test_shared": 170,
            "temporal_split": "Train <= 2019 (165 pos, 165 bg), Test >= 2020 (85 pos, 85 bg)"
        },
        "target_definition": "Reported flood event (1) vs. landscape background (0). NOT verified flood-free negative."
    }
    with open(os.path.join(MODELS_DIR, "stage5_8_feature_metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    metrics_payload = {
        "stage": "5.8",
        "metadata": metadata,
        "benchmark_a_own_test": eval_a_own,
        "benchmark_b_own_test": eval_b_own,
        "shared_fixed_test": eval_shared,
        "feature_importances": {
            "benchmark_a": feature_importances_a,
            "benchmark_b": feature_importances_b
        }
    }
    metrics_json_path = os.path.join(RESULTS_DIR, "stage5_8_five_models_metrics.json")
    with open(metrics_json_path, "w") as f:
        json.dump(metrics_payload, f, indent=2)
    print(f"\nSaved Metrics JSON: {metrics_json_path}")
    print("=== Stage 5.8 Benchmark Execution Completed Successfully ===")


if __name__ == "__main__":
    main()
