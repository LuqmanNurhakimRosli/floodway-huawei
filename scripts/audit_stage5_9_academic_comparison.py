"""
scripts/audit_stage5_9_academic_comparison.py

Stage 5.9: Final Academic Five-Model Comparison Audit.
1. Verifies identical record evaluation across all 5 models.
2. Conducts paired bootstrap ROC-AUC difference analysis (1,000 resamples) between all algorithm pairs.
3. Computes 95% empirical CIs of delta_AUC to test statistical distinguishability.
4. Audits temporal, monthly, monsoon, and state distributions between positives and background.
5. Saves audit results to results/stage5_9_academic_audit.json.
"""

import os
import sys
import json
import math
import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score, average_precision_score, brier_score_loss, log_loss

RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)

PRED_A_CSV = "results/stage5_8_benchmark_a_predictions.csv"
PRED_B_CSV = "results/stage5_8_benchmark_b_predictions.csv"
PRED_SHARED_CSV = "results/stage5_8_shared_test_predictions.csv"

DATA_A_CSV = "datasets/floodway_stage5_3a_benchmark_a_modeling_500.csv"
DATA_B_CSV = "datasets/floodway_stage5_3a_benchmark_b_modeling_500.csv"
DATA_SHARED_CSV = "datasets/floodway_stage5_3a_shared_fixed_test_170.csv"

RESULTS_DIR = "results"
OUTPUT_JSON = os.path.join(RESULTS_DIR, "stage5_9_academic_audit.json")

ALGORITHMS = [
    ("Logistic Regression", "logistic_regression"),
    ("Random Forest", "random_forest"),
    ("LightGBM", "lightgbm"),
    ("CatBoost", "catboost"),
    ("XGBoost", "xgboost")
]


def paired_bootstrap_auc_diff(y_true, scores_1, scores_2, n_bootstraps=1000, alpha=0.05):
    """
    Computes paired bootstrap distribution of (AUC_1 - AUC_2) on identical resampled test sets.
    """
    rng = np.random.RandomState(RANDOM_SEED)
    n = len(y_true)
    diffs = []
    
    auc_1_orig = roc_auc_score(y_true, scores_1)
    auc_2_orig = roc_auc_score(y_true, scores_2)
    obs_diff = auc_1_orig - auc_2_orig

    for _ in range(n_bootstraps):
        idx = rng.randint(0, n, n)
        if len(np.unique(y_true[idx])) < 2:
            continue
        auc_1 = roc_auc_score(y_true[idx], scores_1[idx])
        auc_2 = roc_auc_score(y_true[idx], scores_2[idx])
        diffs.append(auc_1 - auc_2)

    diffs = np.sort(diffs)
    lower_idx = int((alpha / 2.0) * len(diffs))
    upper_idx = int((1.0 - alpha / 2.0) * len(diffs))
    
    ci_lower = float(diffs[lower_idx])
    ci_upper = float(diffs[upper_idx])
    
    # Empirical two-sided p-value against null hypothesis of zero difference
    p_le_zero = np.mean(diffs <= 0)
    p_ge_zero = np.mean(diffs >= 0)
    p_value = float(2.0 * min(p_le_zero, p_ge_zero))
    p_value = min(1.0, p_value)

    # Significant if 0 is outside 95% CI
    is_significant = not (ci_lower <= 0.0 <= ci_upper)

    return {
        "observed_diff": round(float(obs_diff), 4),
        "ci_95": [round(ci_lower, 4), round(ci_upper, 4)],
        "p_value_empirical": round(p_value, 4),
        "zero_in_ci": bool(ci_lower <= 0.0 <= ci_upper),
        "statistically_distinguishable": bool(is_significant)
    }


def get_monsoon_season(month):
    """
    Peninsular Malaysia Monsoon Seasons:
    - Northeast Monsoon (NEM): November - February (Peak rainfall on East Coast)
    - Inter-Monsoon 1: March - April
    - Southwest Monsoon (SWM): May - August (Relatively drier, convective squalls)
    - Inter-Monsoon 2: September - October (Convective afternoon storms)
    """
    if month in [11, 12, 1, 2]:
        return "Northeast Monsoon (Nov-Feb)"
    elif month in [3, 4]:
        return "Inter-Monsoon 1 (Mar-Apr)"
    elif month in [5, 6, 7, 8]:
        return "Southwest Monsoon (May-Aug)"
    else:
        return "Inter-Monsoon 2 (Sep-Oct)"


def main():
    print("=" * 80)
    print("STAGE 5.9: FINAL ACADEMIC FIVE-MODEL COMPARISON AUDIT")
    print("=" * 80)

    # 1. Load Datasets and Predictions
    pred_a = pd.read_csv(PRED_A_CSV)
    pred_b = pd.read_csv(PRED_B_CSV)
    pred_shared = pd.read_csv(PRED_SHARED_CSV)

    df_a = pd.read_csv(DATA_A_CSV)
    df_b = pd.read_csv(DATA_B_CSV)
    df_shared = pd.read_csv(DATA_SHARED_CSV)

    # Verify identical record alignments
    print("\n--- 1. Record Alignment Verification ---")
    assert len(pred_a) == 170 and len(pred_b) == 170 and len(pred_shared) == 170
    assert (pred_a["sample_id"] == df_a[df_a["split"]=="test"]["sample_id"].values).all()
    assert (pred_b["sample_id"] == df_b[df_b["split"]=="test"]["sample_id"].values).all()
    assert (pred_shared["sample_id"] == df_shared["sample_id"].values).all()

    # Verify positive sample IDs match exactly
    pos_ids_a = pred_a[pred_a["target"]==1]["sample_id"].values
    pos_ids_b = pred_b[pred_b["target"]==1]["sample_id"].values
    pos_ids_shared = pred_shared[pred_shared["target"]==1]["sample_id"].values
    assert (pos_ids_a == pos_ids_b).all() and (pos_ids_a == pos_ids_shared).all()
    print("  [PASS] All 85 test positives are identical and identically ordered across Benchmark A, B, and Shared Test.")

    # 2. Paired Bootstrap Comparisons of ROC-AUC Differences
    print("\n--- 2. Paired Bootstrap Analysis of ROC-AUC Differences ---")
    y_test_a = pred_a["target"].values
    y_test_b = pred_b["target"].values
    y_test_shared = pred_shared["target"].values

    paired_results_a = {}
    paired_results_b = {}
    paired_results_shared = {}

    def run_all_pairs(y_true, pred_df, prefix="pred_score_"):
        pair_dict = {}
        for i in range(len(ALGORITHMS)):
            name_1, slug_1 = ALGORITHMS[i]
            col_1 = f"{prefix}{slug_1}"
            scores_1 = pred_df[col_1].values
            for j in range(i + 1, len(ALGORITHMS)):
                name_2, slug_2 = ALGORITHMS[j]
                col_2 = f"{prefix}{slug_2}"
                scores_2 = pred_df[col_2].values
                res = paired_bootstrap_auc_diff(y_true, scores_1, scores_2)
                pair_key = f"{name_1} vs {name_2}"
                pair_dict[pair_key] = res
        return pair_dict

    paired_results_a = run_all_pairs(y_test_a, pred_a, prefix="pred_score_")
    paired_results_b = run_all_pairs(y_test_b, pred_b, prefix="pred_score_")
    paired_results_shared_a = run_all_pairs(y_test_shared, pred_shared, prefix="pred_score_bmk_a_")
    paired_results_shared_b = run_all_pairs(y_test_shared, pred_shared, prefix="pred_score_bmk_b_")

    print("\nBenchmark A (Own Test Set) Paired Differences:")
    df_pairs_a = pd.DataFrame.from_dict(paired_results_a, orient="index")
    print(df_pairs_a[["observed_diff", "ci_95", "p_value_empirical", "statistically_distinguishable"]])

    print("\nBenchmark B (Own Test Set) Paired Differences:")
    df_pairs_b = pd.DataFrame.from_dict(paired_results_b, orient="index")
    print(df_pairs_b[["observed_diff", "ci_95", "p_value_empirical", "statistically_distinguishable"]])

    # 3. Temporal, Seasonal, and Geographic Distribution Audit
    print("\n--- 3. Temporal & Seasonal Sampling Distribution Audit ---")
    for df, name in [(df_a, "Benchmark A"), (df_b, "Benchmark B")]:
        print(f"\nAnalyzing {name} (N=500):")
        df["date"] = pd.to_datetime(df["date"])
        df["month"] = df["date"].dt.month
        df["season"] = df["month"].apply(get_monsoon_season)
        
        pos_df = df[df["target"] == 1]
        bg_df = df[df["target"] == 0]

        # Year distribution
        print("  Year Distribution (Positives vs Background):")
        year_comp = pd.crosstab(df["year"], df["target"], normalize="columns") * 100
        year_comp.columns = ["Background (%)", "Positives (%)"]
        print(year_comp.round(1))

        # Monsoon Season distribution
        print("  Monsoon Season Distribution:")
        season_comp = pd.crosstab(df["season"], df["target"], normalize="columns") * 100
        season_comp.columns = ["Background (%)", "Positives (%)"]
        print(season_comp.round(1))

        # Month distribution summary
        print("  Month Distribution (Top Months):")
        top_months_pos = pos_df["month"].value_counts(normalize=True).head(3) * 100
        top_months_bg = bg_df["month"].value_counts(normalize=True).head(3) * 100
        print(f"    Positives Top Months: {dict(top_months_pos.round(1))}")
        print(f"    Background Top Months: {dict(top_months_bg.round(1))}")

        # State distribution
        print("  State Distribution (Top 5):")
        state_comp = pd.crosstab(df["state"], df["target"], normalize="columns") * 100
        state_comp.columns = ["Background (%)", "Positives (%)"]
        print(state_comp.sort_values(by="Positives (%)", ascending=False).head(5).round(1))

    # 4. Save Comprehensive Audit JSON
    audit_data = {
        "stage": "5.9",
        "description": "Final Academic Five-Model Comparison Audit",
        "integrity_checks": {
            "test_positives_identical": True,
            "test_records_identical_within_benchmarks": True,
            "sample_counts": {
                "benchmark_a_test": 170,
                "benchmark_b_test": 170,
                "shared_fixed_test": 170
            }
        },
        "paired_bootstrap_auc_differences": {
            "benchmark_a_own_test": paired_results_a,
            "benchmark_b_own_test": paired_results_b,
            "shared_fixed_test_model_a": paired_results_shared_a,
            "shared_fixed_test_model_b": paired_results_shared_b
        },
        "seasonal_monsoon_distribution": {
            "positives": {
                "northeast_monsoon_pct": round(float((df_a[df_a['target']==1]['season'] == "Northeast Monsoon (Nov-Feb)").mean() * 100), 2),
                "inter_monsoon_1_pct": round(float((df_a[df_a['target']==1]['season'] == "Inter-Monsoon 1 (Mar-Apr)").mean() * 100), 2),
                "southwest_monsoon_pct": round(float((df_a[df_a['target']==1]['season'] == "Southwest Monsoon (May-Aug)").mean() * 100), 2),
                "inter_monsoon_2_pct": round(float((df_a[df_a['target']==1]['season'] == "Inter-Monsoon 2 (Sep-Oct)").mean() * 100), 2),
            },
            "background": {
                "northeast_monsoon_pct": round(float((df_a[df_a['target']==0]['season'] == "Northeast Monsoon (Nov-Feb)").mean() * 100), 2),
                "inter_monsoon_1_pct": round(float((df_a[df_a['target']==0]['season'] == "Inter-Monsoon 1 (Mar-Apr)").mean() * 100), 2),
                "southwest_monsoon_pct": round(float((df_a[df_a['target']==0]['season'] == "Southwest Monsoon (May-Aug)").mean() * 100), 2),
                "inter_monsoon_2_pct": round(float((df_a[df_a['target']==0]['season'] == "Inter-Monsoon 2 (Sep-Oct)").mean() * 100), 2),
            }
        },
        "methodological_caveats": {
            "benchmark_b_terminology": "Terrain-restricted (empirical elevation/slope filtering), not distribution-matched.",
            "brier_and_log_loss_scope": "Evaluated against 50:50 presence-background contrast, not real-world calibrated occurrence probabilities.",
            "coordinate_provenance": "Unofficial third-party transcription (Tisya Kaggle dataset from public JPS flood bulletins) with village-level geocoding centroid precision."
        }
    }

    with open(OUTPUT_JSON, "w") as f:
        json.dump(audit_data, f, indent=2)

    print(f"\nSaved Stage 5.9 Audit Metrics to: {OUTPUT_JSON}")
    print("=== Stage 5.9 Audit Complete ===")


if __name__ == "__main__":
    main()
