"""
scripts/train_stage5_3b_baselines.py

FloodWay Stage 5.3B: Minimal Baseline Model Training and Evaluation.
1. Loads Benchmark A (500 rows) and Benchmark B (500 rows) datasets.
2. Uses strictly five predictors:
   ['rain_1d_prior_mm', 'rain_3d_prior_mm', 'rain_7d_prior_mm', 'elevation_m', 'slope_deg']
3. Excludes all coordinates, event-day rainfall, dates, and metadata from the feature matrix.
4. Respects temporal split (Train <= 2019, Test >= 2020); fits Scaler strictly on train.
5. Trains:
   - DummyClassifier (prior)
   - LogisticRegression (StandardScaler fit on train)
   - RandomForestClassifier (100 trees, max_depth=5, min_samples_leaf=10)
6. Trains separately on Benchmark A and Benchmark B.
7. Evaluates on:
   - Own temporal test set (170 rows each: 85 Positives + 85 Benchmark-specific Negatives)
   - Shared fixed test set (170 rows: 85 Positives + 85 Uniform Negatives)
8. Reports ROC-AUC, Average Precision (PR-AUC), and Recall@Top10% with class counts.
9. Sub-evaluates on seen vs. unseen coordinates and distance-stratified subsets.
10. Saves model artifacts, predictions, metrics, and metadata under dedicated paths.
"""

import os
import sys
import json
import math
import joblib
import numpy as np
import pandas as pd
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import roc_auc_score, average_precision_score

RANDOM_SEED = 42

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

def compute_recall_at_top_k_percent(y_true, y_scores, k_percent=10.0):
    """
    Computes Recall@Top K%:
    The fraction of actual positive events captured within the top K% highest predicted risk scores.
    """
    n_total = len(y_true)
    n_top = max(1, int(math.floor((k_percent / 100.0) * n_total)))
    
    # Sort indices by score descending
    sorted_indices = np.argsort(y_scores)[::-1]
    top_indices = sorted_indices[:n_top]
    
    positives_captured = np.sum(y_true[top_indices] == 1)
    total_positives = np.sum(y_true == 1)
    
    recall = positives_captured / total_positives if total_positives > 0 else 0.0
    return float(recall), int(positives_captured), int(total_positives), int(n_top)


def evaluate_model_performance(model_name, y_true, y_scores, pos_count, bg_count):
    roc_auc = float(roc_auc_score(y_true, y_scores))
    pr_auc = float(average_precision_score(y_true, y_scores))
    recall_top10, pos_in_top10, total_pos, n_top_evaluated = compute_recall_at_top_k_percent(y_true, y_scores, 10.0)

    return {
        "model_name": model_name,
        "n_test_total": int(len(y_true)),
        "n_positives": int(pos_count),
        "n_background": int(bg_count),
        "roc_auc": round(float(roc_auc), 4),
        "average_precision_pr_auc": round(float(pr_auc), 4),
        "recall_at_top_10_percent": round(float(recall_top10), 4),
        "top_10_positives_captured": f"{pos_in_top10} / {total_pos}",
        "top_10_cutoff_rank": int(n_top_evaluated)
    }


def main():
    print("=" * 80)
    print("STAGE 5.3B: MINIMAL BASELINE MODEL TRAINING AND EVALUATION")
    print("=" * 80)

    # 1. Load Datasets
    df_a = pd.read_csv(INPUT_BENCHMARK_A_CSV)
    df_b = pd.read_csv(INPUT_BENCHMARK_B_CSV)
    df_shared_test = pd.read_csv(INPUT_SHARED_TEST_CSV)

    print(f"Loaded Modeling Datasets:")
    print(f"  Benchmark A: {len(df_a)} rows (Train: {(df_a['split']=='train').sum()}, Test: {(df_a['split']=='test').sum()})")
    print(f"  Benchmark B: {len(df_b)} rows (Train: {(df_b['split']=='train').sum()}, Test: {(df_b['split']=='test').sum()})")
    print(f"  Shared Fixed Test: {len(df_shared_test)} rows")

    # 2. Integrity Checks (Requirement 11)
    print("\n--- Integrity Verification ---")
    pos_a = df_a[df_a["target"] == 1]["sample_id"].values
    pos_b = df_b[df_b["target"] == 1]["sample_id"].values
    assert (pos_a == pos_b).all(), "Positive sample IDs mismatch between Benchmark A and B"
    print("  [PASS] Exactly identical 250 positive flood records in Benchmark A and B.")

    train_ids_a = set(df_a[df_a["split"] == "train"]["sample_id"])
    train_ids_b = set(df_b[df_b["split"] == "train"]["sample_id"])
    shared_test_ids = set(df_shared_test["sample_id"])
    assert len(shared_test_ids.intersection(train_ids_a)) == 0, "Shared test set leaks training records from Benchmark A"
    assert len(shared_test_ids.intersection(train_ids_b)) == 0, "Shared test set leaks training records from Benchmark B"
    print("  [PASS] Zero record overlap between Shared Fixed Test Set and any training partition.")

    # 3. Partition Data
    # Benchmark A
    train_a = df_a[df_a["split"] == "train"].copy()
    test_a = df_a[df_a["split"] == "test"].copy()

    X_train_a = train_a[PREDICTIVE_FEATURES].values
    y_train_a = train_a["target"].values
    X_test_a = test_a[PREDICTIVE_FEATURES].values
    y_test_a = test_a["target"].values

    # Benchmark B
    train_b = df_b[df_b["split"] == "train"].copy()
    test_b = df_b[df_b["split"] == "test"].copy()

    X_train_b = train_b[PREDICTIVE_FEATURES].values
    y_train_b = train_b["target"].values
    X_test_b = test_b[PREDICTIVE_FEATURES].values
    y_test_b = test_b["target"].values

    # Shared Fixed Test
    X_test_shared = df_shared_test[PREDICTIVE_FEATURES].values
    y_test_shared = df_shared_test["target"].values

    print(f"\nFeature Matrix Structure:")
    print(f"  Predictive Features ({len(PREDICTIVE_FEATURES)}): {PREDICTIVE_FEATURES}")
    print(f"  Excluded Features: latitude, longitude, date, year, state, place, rain_event_day_mm, metadata")
    print(f"  Benchmark A Train Shape: {X_train_a.shape} (Pos: {(y_train_a==1).sum()}, Neg: {(y_train_a==0).sum()})")
    print(f"  Benchmark A Test Shape:  {X_test_a.shape} (Pos: {(y_test_a==1).sum()}, Neg: {(y_test_a==0).sum()})")
    print(f"  Benchmark B Train Shape: {X_train_b.shape} (Pos: {(y_train_b==1).sum()}, Neg: {(y_train_b==0).sum()})")
    print(f"  Benchmark B Test Shape:  {X_test_b.shape} (Pos: {(y_test_b==1).sum()}, Neg: {(y_test_b==0).sum()})")

    # 4. Model Training Definition
    def train_models_for_benchmark(X_tr, y_tr, bmk_label):
        print(f"\nTraining Models on {bmk_label}...")
        
        # 1. Dummy Baseline
        dummy = DummyClassifier(strategy="prior", random_state=RANDOM_SEED)
        dummy.fit(X_tr, y_tr)

        # 2. Logistic Regression (Scaler fit strictly on train!)
        lr_pipe = Pipeline([
            ("scaler", StandardScaler()),
            ("classifier", LogisticRegression(random_state=RANDOM_SEED, max_iter=1000))
        ])
        lr_pipe.fit(X_tr, y_tr)

        # 3. Shallow Random Forest
        rf = RandomForestClassifier(
            n_estimators=100,
            max_depth=5,
            min_samples_leaf=10,
            random_state=RANDOM_SEED
        )
        rf.fit(X_tr, y_tr)

        return dummy, lr_pipe, rf

    dummy_a, lr_pipe_a, rf_a = train_models_for_benchmark(X_train_a, y_train_a, "Benchmark A (Uniform Background)")
    dummy_b, lr_pipe_b, rf_b = train_models_for_benchmark(X_train_b, y_train_b, "Benchmark B (Terrain-Restricted Background)")

    # Save Model Artifacts
    joblib.dump(lr_pipe_a, os.path.join(MODELS_DIR, "stage5_3b_benchmark_a_logistic_regression.joblib"))
    joblib.dump(rf_a, os.path.join(MODELS_DIR, "stage5_3b_benchmark_a_random_forest.joblib"))
    joblib.dump(lr_pipe_b, os.path.join(MODELS_DIR, "stage5_3b_benchmark_b_logistic_regression.joblib"))
    joblib.dump(rf_b, os.path.join(MODELS_DIR, "stage5_3b_benchmark_b_random_forest.joblib"))

    # Save feature metadata
    metadata = {
        "stage": "5.3B",
        "description": "Minimal Baseline Models for Peninsular Malaysia Reported Flood Discrimination",
        "predictive_features": PREDICTIVE_FEATURES,
        "excluded_features": ["latitude", "longitude", "rain_event_day_mm", "date", "year", "state", "place"],
        "target_definition": "Retrospective reported flood incident (JPS reports) vs. uncertain background",
        "random_seed": RANDOM_SEED,
        "n_train": 330,
        "n_test_own": 170,
        "n_test_shared": 170,
        "temporal_firewall": "Train <= 2019, Test >= 2020. StandardScaler fit strictly on train."
    }
    with open(os.path.join(MODELS_DIR, "stage5_3b_feature_metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    # 5. Evaluate on Own Temporal Test Sets
    all_metrics = {}

    print("\n" + "=" * 80)
    print("EVALUATION 1: ON OWN TEMPORAL TEST SETS (170 rows each)")
    print("=" * 80)

    # Benchmark A Own Evaluation
    scores_dummy_a_own = dummy_a.predict_proba(X_test_a)[:, 1]
    scores_lr_a_own = lr_pipe_a.predict_proba(X_test_a)[:, 1]
    scores_rf_a_own = rf_a.predict_proba(X_test_a)[:, 1]

    metrics_a_own = [
        evaluate_model_performance("Dummy Baseline", y_test_a, scores_dummy_a_own, (y_test_a==1).sum(), (y_test_a==0).sum()),
        evaluate_model_performance("Logistic Regression", y_test_a, scores_lr_a_own, (y_test_a==1).sum(), (y_test_a==0).sum()),
        evaluate_model_performance("Random Forest (depth=5)", y_test_a, scores_rf_a_own, (y_test_a==1).sum(), (y_test_a==0).sum()),
    ]
    all_metrics["benchmark_a_own_test"] = metrics_a_own
    print("\n--- Benchmark A (Trained on Uniform Background, Tested on Uniform Test Set) ---")
    print(pd.DataFrame(metrics_a_own).to_string(index=False))

    # Benchmark B Own Evaluation
    scores_dummy_b_own = dummy_b.predict_proba(X_test_b)[:, 1]
    scores_lr_b_own = lr_pipe_b.predict_proba(X_test_b)[:, 1]
    scores_rf_b_own = rf_b.predict_proba(X_test_b)[:, 1]

    metrics_b_own = [
        evaluate_model_performance("Dummy Baseline", y_test_b, scores_dummy_b_own, (y_test_b==1).sum(), (y_test_b==0).sum()),
        evaluate_model_performance("Logistic Regression", y_test_b, scores_lr_b_own, (y_test_b==1).sum(), (y_test_b==0).sum()),
        evaluate_model_performance("Random Forest (depth=5)", y_test_b, scores_rf_b_own, (y_test_b==1).sum(), (y_test_b==0).sum()),
    ]
    all_metrics["benchmark_b_own_test"] = metrics_b_own
    print("\n--- Benchmark B (Trained on Terrain-Restricted Background, Tested on Terrain-Restricted Test Set) ---")
    print(pd.DataFrame(metrics_b_own).to_string(index=False))

    # 6. Evaluate on Shared Fixed Test Set (Requirement 7)
    print("\n" + "=" * 80)
    print("EVALUATION 2: ON SHARED FIXED TEST SET (170 rows: 85 Positives + 85 Uniform Background)")
    print("=" * 80)

    # Benchmark A on Shared Test
    scores_lr_a_shared = lr_pipe_a.predict_proba(X_test_shared)[:, 1]
    scores_rf_a_shared = rf_a.predict_proba(X_test_shared)[:, 1]

    # Benchmark B on Shared Test
    scores_lr_b_shared = lr_pipe_b.predict_proba(X_test_shared)[:, 1]
    scores_rf_b_shared = rf_b.predict_proba(X_test_shared)[:, 1]

    metrics_shared = [
        evaluate_model_performance("Model A - Logistic Regression", y_test_shared, scores_lr_a_shared, (y_test_shared==1).sum(), (y_test_shared==0).sum()),
        evaluate_model_performance("Model A - Random Forest", y_test_shared, scores_rf_a_shared, (y_test_shared==1).sum(), (y_test_shared==0).sum()),
        evaluate_model_performance("Model B - Logistic Regression", y_test_shared, scores_lr_b_shared, (y_test_shared==1).sum(), (y_test_shared==0).sum()),
        evaluate_model_performance("Model B - Random Forest", y_test_shared, scores_rf_b_shared, (y_test_shared==1).sum(), (y_test_shared==0).sum()),
    ]
    all_metrics["shared_fixed_test"] = metrics_shared
    print(pd.DataFrame(metrics_shared).to_string(index=False))

    # 7. Sub-evaluation: Seen vs. Unseen Coordinates and Distance-based Subsets (Requirement 10)
    print("\n" + "=" * 80)
    print("EVALUATION 3: SUB-EVALUATION ON TEST POSITIVE STRATIFICATIONS")
    print("=" * 80)

    test_pos_indices = np.where(y_test_a == 1)[0]
    test_neg_indices = np.where(y_test_a == 0)[0]
    
    test_pos_df = test_a.iloc[test_pos_indices].reset_index(drop=True)

    # Distance to training positives
    dists_to_tr = test_pos_df["min_dist_to_train_pos_km"].values
    exact_seen_mask = dists_to_tr == 0.0
    exact_unseen_mask = dists_to_tr > 0.0
    under_3km_mask = dists_to_tr < 3.0
    over_3km_mask = dists_to_tr >= 3.0
    under_10km_mask = dists_to_tr < 10.0
    over_10km_mask = dists_to_tr >= 10.0

    print(f"Test Positive Stratifications (N_test_pos = 85):")
    print(f"  Exact Coordinate Seen in Train (dist = 0 km): {exact_seen_mask.sum()} / 85")
    print(f"  Exact Coordinate Novel (dist > 0 km):         {exact_unseen_mask.sum()} / 85")
    print(f"  Within < 3.0 km of training floods:           {under_3km_mask.sum()} / 85")
    print(f"  Distance >= 3.0 km from training floods:      {over_3km_mask.sum()} / 85")
    print(f"  Within < 10.0 km of training floods:          {under_10km_mask.sum()} / 85")
    print(f"  Distance >= 10.0 km from training floods:     {over_10km_mask.sum()} / 85")

    # Evaluate RF Model A on each positive subset paired with all test background
    def evaluate_positive_subset(subset_name, pos_mask, y_pos_scores, y_bg_scores):
        sub_pos_scores = y_pos_scores[pos_mask]
        sub_y_true = np.concatenate([np.ones(len(sub_pos_scores)), np.zeros(len(y_bg_scores))])
        sub_scores = np.concatenate([sub_pos_scores, y_bg_scores])
        
        roc = roc_auc_score(sub_y_true, sub_scores)
        ap = average_precision_score(sub_y_true, sub_scores)
        rec10, pos_cap, tot_pos, _ = compute_recall_at_top_k_percent(sub_y_true, sub_scores, 10.0)

        return {
            "subset": subset_name,
            "n_pos": int(len(sub_pos_scores)),
            "n_bg": int(len(y_bg_scores)),
            "roc_auc": round(float(roc), 4),
            "average_precision": round(float(ap), 4),
            "recall_top10": round(float(rec10), 4),
            "pos_captured_top10": f"{pos_cap} / {tot_pos}"
        }

    rf_a_pos_scores = scores_rf_a_own[test_pos_indices]
    rf_a_bg_scores = scores_rf_a_own[test_neg_indices]

    sub_eval_results = [
        evaluate_positive_subset("All Test Positives", np.ones(85, dtype=bool), rf_a_pos_scores, rf_a_bg_scores),
        evaluate_positive_subset("Exact Seen Coordinates (dist = 0km)", exact_seen_mask, rf_a_pos_scores, rf_a_bg_scores),
        evaluate_positive_subset("Novel Coordinates (dist > 0km)", exact_unseen_mask, rf_a_pos_scores, rf_a_bg_scores),
        evaluate_positive_subset("Proximal Positives (< 3km)", under_3km_mask, rf_a_pos_scores, rf_a_bg_scores),
        evaluate_positive_subset("Distal Positives (>= 3km)", over_3km_mask, rf_a_pos_scores, rf_a_bg_scores),
        evaluate_positive_subset("Meso-Proximal Positives (< 10km)", under_10km_mask, rf_a_pos_scores, rf_a_bg_scores),
        evaluate_positive_subset("Meso-Distal Positives (>= 10km)", over_10km_mask, rf_a_pos_scores, rf_a_bg_scores),
    ]
    all_metrics["spatial_sub_evaluations_rf_a"] = sub_eval_results
    print("\n--- Sub-Evaluation of Model A (Random Forest) on Positive Subsets vs Background ---")
    print(pd.DataFrame(sub_eval_results).to_string(index=False))

    # 8. Feature Importances / Coefficients (Descriptive ONLY - NOT Causal!)
    print("\n" + "=" * 80)
    print("DESCRIPTIVE FEATURE COEFFICIENTS & IMPORTANCES (NON-CAUSAL)")
    print("=" * 80)

    lr_coefs_a = {str(k): float(v) for k, v in zip(PREDICTIVE_FEATURES, np.round(lr_pipe_a.named_steps["classifier"].coef_[0], 4))}
    rf_imps_a = {str(k): float(v) for k, v in zip(PREDICTIVE_FEATURES, np.round(rf_a.feature_importances_, 4))}

    lr_coefs_b = {str(k): float(v) for k, v in zip(PREDICTIVE_FEATURES, np.round(lr_pipe_b.named_steps["classifier"].coef_[0], 4))}
    rf_imps_b = {str(k): float(v) for k, v in zip(PREDICTIVE_FEATURES, np.round(rf_b.feature_importances_, 4))}

    print("Model A (Trained on Uniform Background):")
    print(f"  Logistic Regression Standardized Coefs: {lr_coefs_a}")
    print(f"  Random Forest Feature Importances:      {rf_imps_a}")

    print("\nModel B (Trained on Terrain-Restricted Background):")
    print(f"  Logistic Regression Standardized Coefs: {lr_coefs_b}")
    print(f"  Random Forest Feature Importances:      {rf_imps_b}")

    all_metrics["feature_weights"] = {
        "model_a_uniform": {"lr_standardized_coefficients": lr_coefs_a, "rf_feature_importances": rf_imps_a},
        "model_b_matched": {"lr_standardized_coefficients": lr_coefs_b, "rf_feature_importances": rf_imps_b}
    }

    # 9. Save Predictions
    test_a["pred_score_dummy"] = scores_dummy_a_own
    test_a["pred_score_lr"] = scores_lr_a_own
    test_a["pred_score_rf"] = scores_rf_a_own
    test_a.to_csv(os.path.join(RESULTS_DIR, "stage5_3b_benchmark_a_predictions.csv"), index=False)

    test_b["pred_score_dummy"] = scores_dummy_b_own
    test_b["pred_score_lr"] = scores_lr_b_own
    test_b["pred_score_rf"] = scores_rf_b_own
    test_b.to_csv(os.path.join(RESULTS_DIR, "stage5_3b_benchmark_b_predictions.csv"), index=False)

    # Save metrics JSON
    with open(os.path.join(RESULTS_DIR, "stage5_3b_evaluation_metrics.json"), "w") as f:
        json.dump(all_metrics, f, indent=2)

    print(f"\nSaved Predictions to:")
    print(f"  {os.path.join(RESULTS_DIR, 'stage5_3b_benchmark_a_predictions.csv')}")
    print(f"  {os.path.join(RESULTS_DIR, 'stage5_3b_benchmark_b_predictions.csv')}")
    print(f"Saved Metrics to {os.path.join(RESULTS_DIR, 'stage5_3b_evaluation_metrics.json')}")
    print("=== Stage 5.3B Baseline Training and Evaluation Complete ===")

if __name__ == "__main__":
    main()
