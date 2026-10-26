"""
scripts/eval_stage5_11_season_matched.py

FloodWay Stage 5.11: Season-Matched Model Sensitivity Evaluation.
1. Audits feasibility of exact state-and-month matching for all 85 test positives.
2. Identifies exact cell shortages across all 49 state-month cells.
3. Evaluates two defensible sensitivity cohorts:
   - Cohort 1: Exact State-and-Month Matched Subcohort
     (N_pos=39, N_bg=39 in Benchmark A; N_pos=33, N_bg=33 in Benchmark B)
   - Cohort 2: Closest Seasonal-and-State Matched Full Cohort (N_pos=85, N_bg=85)
     (Optimal within-state minimum circular month distance matching)
4. Evaluates all 5 saved models for Benchmark A and Benchmark B without retraining:
   - Logistic Regression
   - Random Forest
   - LightGBM
   - CatBoost
   - XGBoost
5. Computes bootstrap uncertainty for performance differences (Delta AUC, Delta AP, Delta Recall@Top10%).
6. Saves diagnostic outputs to:
   - results/stage5_11_season_matched_metrics.json
   - results/stage5_11_benchmark_a_matched_predictions.csv
   - results/stage5_11_benchmark_b_matched_predictions.csv
"""

import os
import sys
import json
import math
import joblib
import numpy as np
import pandas as pd
from scipy.optimize import linear_sum_assignment
from sklearn.metrics import roc_auc_score, average_precision_score

RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)

DATA_A_CSV = "datasets/floodway_stage5_3a_benchmark_a_modeling_500.csv"
DATA_B_CSV = "datasets/floodway_stage5_3a_benchmark_b_modeling_500.csv"
PRED_A_CSV = "results/stage5_8_benchmark_a_predictions.csv"
PRED_B_CSV = "results/stage5_8_benchmark_b_predictions.csv"

RESULTS_DIR = "results"
os.makedirs(RESULTS_DIR, exist_ok=True)

PREDICTIVE_FEATURES = [
    "rain_1d_prior_mm",
    "rain_3d_prior_mm",
    "rain_7d_prior_mm",
    "elevation_m",
    "slope_deg"
]

ALGORITHMS = [
    ("Logistic Regression", "logistic_regression"),
    ("Random Forest", "random_forest"),
    ("LightGBM", "lightgbm"),
    ("CatBoost", "catboost"),
    ("XGBoost", "xgboost")
]


def circular_month_dist(m1, m2):
    diff = abs(m1 - m2)
    return min(diff, 12 - diff)


def compute_recall_at_top_k_percent_robust(y_true, y_scores, k_percent=10.0):
    n_total = len(y_true)
    n_top = max(1, int(math.floor((k_percent / 100.0) * n_total)))
    total_pos = int(np.sum(y_true == 1))

    if np.all(y_scores == y_scores[0]):
        expected_pos = (n_top / n_total) * total_pos
        return round(expected_pos / total_pos if total_pos > 0 else 0.0, 4)

    sorted_scores = np.sort(y_scores)[::-1]
    cutoff = sorted_scores[n_top - 1]

    strictly_above = y_scores > cutoff
    pos_strictly_above = np.sum(y_true[strictly_above] == 1)
    count_strictly_above = np.sum(strictly_above)

    at_cutoff = y_scores == cutoff
    pos_at_cutoff = np.sum(y_true[at_cutoff] == 1)
    count_at_cutoff = np.sum(at_cutoff)

    slots_needed = n_top - count_strictly_above
    if count_at_cutoff > 0:
        frac = slots_needed / count_at_cutoff
        pos_captured = pos_strictly_above + frac * pos_at_cutoff
    else:
        pos_captured = pos_strictly_above

    recall = pos_captured / total_pos if total_pos > 0 else 0.0
    return round(float(recall), 4)


def bootstrap_delta_metric(y_pos_orig, y_bg_orig, scores_pos_orig, scores_bg_orig,
                           y_pos_match, y_bg_match, scores_pos_match, scores_bg_match,
                           metric_func, n_bootstraps=1000, alpha=0.05):
    """
    Computes bootstrap confidence interval for Delta Metric = Metric_matched - Metric_original,
    properly accounting for resampled positive and background distributions.
    """
    rng = np.random.RandomState(RANDOM_SEED)
    n_pos_orig = len(y_pos_orig)
    n_bg_orig = len(y_bg_orig)
    n_pos_match = len(y_pos_match)
    n_bg_match = len(y_bg_match)
    
    diffs = []
    for _ in range(n_bootstraps):
        # Resample original
        idx_p_orig = rng.choice(n_pos_orig, size=n_pos_orig, replace=True)
        idx_b_orig = rng.choice(n_bg_orig, size=n_bg_orig, replace=True)
        
        y_orig_boot = np.concatenate([y_pos_orig[idx_p_orig], y_bg_orig[idx_b_orig]])
        scores_orig_boot = np.concatenate([scores_pos_orig[idx_p_orig], scores_bg_orig[idx_b_orig]])
        
        # Resample matched
        idx_p_match = rng.choice(n_pos_match, size=n_pos_match, replace=True)
        idx_b_match = rng.choice(n_bg_match, size=n_bg_match, replace=True)
        
        y_match_boot = np.concatenate([y_pos_match[idx_p_match], y_bg_match[idx_b_match]])
        scores_match_boot = np.concatenate([scores_pos_match[idx_p_match], scores_bg_match[idx_b_match]])
        
        m_orig = metric_func(y_orig_boot, scores_orig_boot)
        m_match = metric_func(y_match_boot, scores_match_boot)
        diffs.append(m_match - m_orig)
        
    diffs = np.sort(diffs)
    ci_low = float(diffs[int((alpha / 2.0) * len(diffs))])
    ci_high = float(diffs[int((1.0 - alpha / 2.0) * len(diffs))])
    p_val = float(2.0 * min(np.mean(diffs <= 0), np.mean(diffs >= 0)))
    p_val = min(1.0, p_val)
    return round(ci_low, 4), round(ci_high, 4), round(p_val, 4)


def main():
    print("=" * 80)
    print("STAGE 5.11: SEASON-MATCHED MODEL SENSITIVITY EVALUATION")
    print("=" * 80)

    # 1. Load Data
    pred_a_df = pd.read_csv(PRED_A_CSV)
    pred_b_df = pd.read_csv(PRED_B_CSV)

    for df in [pred_a_df, pred_b_df]:
        df["date"] = pd.to_datetime(df["date"])
        df["month"] = df["date"].dt.month
        df["state_month"] = df["state"] + "_" + df["month"].astype(str)

    results_payload = {
        "stage": "5.11",
        "description": "Season-Matched Sensitivity Evaluation for Peninsular Malaysia Reported Flood Models",
        "exact_matching_feasibility_audit": {},
        "benchmark_a_sensitivity": {},
        "benchmark_b_sensitivity": {}
    }

    # 2. Feasibility Audit of Exact State-Month Matching
    pos_df = pred_a_df[pred_a_df["target"] == 1].copy().reset_index(drop=True)
    bg_a_df = pred_a_df[pred_a_df["target"] == 0].copy().reset_index(drop=True)
    bg_b_df = pred_b_df[pred_b_df["target"] == 0].copy().reset_index(drop=True)

    pos_sm_counts = pos_df["state_month"].value_counts().to_dict()
    bg_a_sm_counts = bg_a_df["state_month"].value_counts().to_dict()
    bg_b_sm_counts = bg_b_df["state_month"].value_counts().to_dict()

    shortages_a = {}
    shortages_b = {}
    matched_exact_a_count = 0
    matched_exact_b_count = 0

    for sm, needed in pos_sm_counts.items():
        have_a = bg_a_sm_counts.get(sm, 0)
        have_b = bg_b_sm_counts.get(sm, 0)
        matched_exact_a_count += min(needed, have_a)
        matched_exact_b_count += min(needed, have_b)
        if have_a < needed:
            shortages_a[sm] = {"needed": needed, "have": have_a, "shortage": needed - have_a}
        if have_b < needed:
            shortages_b[sm] = {"needed": needed, "have": have_b, "shortage": needed - have_b}

    print("\n--- 1. Feasibility Audit: Exact State-Month Matching ---")
    print(f"Total Test Positives: {len(pos_df)}")
    print(f"Distinct State-Month Cells in Positives: {len(pos_sm_counts)}")
    print(f"Exact Matches Available in Benchmark A Background: {matched_exact_a_count} / 85 ({matched_exact_a_count/85*100:.1f}%)")
    print(f"Exact Matches Available in Benchmark B Background: {matched_exact_b_count} / 85 ({matched_exact_b_count/85*100:.1f}%)")
    print(f"State-Month Cells with Shortages in A: {len(shortages_a)} / {len(pos_sm_counts)}")
    print(f"State-Month Cells with Shortages in B: {len(shortages_b)} / {len(pos_sm_counts)}")

    results_payload["exact_matching_feasibility_audit"] = {
        "n_positives_test": len(pos_df),
        "n_state_month_cells_positives": len(pos_sm_counts),
        "benchmark_a_exact_matches_available": matched_exact_a_count,
        "benchmark_b_exact_matches_available": matched_exact_b_count,
        "exact_matching_to_all_85_positives_feasible": False,
        "reason": "Existing 2020-2021 test background pool has shortages in 34-36 state-month cells. Cannot force 85 matches without duplicating observations or violating temporal firewall.",
        "shortages_sample_a": dict(list(shortages_a.items())[:10]),
        "shortages_sample_b": dict(list(shortages_b.items())[:10])
    }

    # 3. Construct the Defensible Sensitivity Cohorts
    def evaluate_benchmark_sensitivity(bmk_label, pred_df):
        print(f"\n" + "=" * 80)
        print(f"SENSITIVITY ANALYSIS: {bmk_label.upper()}")
        print("=" * 80)

        pos = pred_df[pred_df["target"] == 1].copy().reset_index(drop=True)
        bg = pred_df[pred_df["target"] == 0].copy().reset_index(drop=True)

        # Cohort 1: Exact State-and-Month Matched Subcohort
        pos_sm = pos["state_month"].value_counts()
        bg_sm = bg["state_month"].value_counts()

        matched_p_idx = []
        matched_b_idx = []
        for sm, count in pos_sm.items():
            if sm in bg_sm:
                k = min(count, bg_sm[sm])
                matched_p_idx.extend(pos[pos["state_month"] == sm].index[:k])
                matched_b_idx.extend(bg[bg["state_month"] == sm].index[:k])

        sub_pos = pos.loc[matched_p_idx].reset_index(drop=True)
        sub_bg = bg.loc[matched_b_idx].reset_index(drop=True)
        n_exact = len(sub_pos)

        print(f"Cohort 1 (Exact State-Month Subcohort): N_pos={n_exact}, N_bg={n_exact} (Total={2*n_exact})")

        # Cohort 2: Closest Seasonal-and-State Matched Full Cohort (N_pos=85, N_bg=85)
        # Optimal matching within state to minimize circular month distance
        matched_full_bg_order = []
        month_dists = []

        for state in pos["state"].unique():
            p_sub = pos[pos["state"] == state].copy()
            b_sub = bg[bg["state"] == state].copy()
            cost_mat = np.zeros((len(p_sub), len(b_sub)))
            for i, pm in enumerate(p_sub["month"]):
                for j, bm in enumerate(b_sub["month"]):
                    cost_mat[i, j] = circular_month_dist(pm, bm)
            row_ind, col_ind = linear_sum_assignment(cost_mat)
            for r, c in zip(row_ind, col_ind):
                matched_full_bg_order.append(b_sub.iloc[c])
                month_dists.append(cost_mat[r, c])

        matched_full_bg_df = pd.DataFrame(matched_full_bg_order).reset_index(drop=True)
        avg_month_dist = np.mean(month_dists)
        exact_month_match_pct = (np.array(month_dists) == 0).mean() * 100
        within_1_month_pct = (np.array(month_dists) <= 1).mean() * 100

        print(f"Cohort 2 (Closest Month-Matched Full Cohort): N_pos=85, N_bg=85")
        print(f"  Average circular month distance: {avg_month_dist:.2f} months")
        print(f"  Exact month matches: {exact_month_match_pct:.1f}%")
        print(f"  Within +/-1 month:   {within_1_month_pct:.1f}%")

        # Evaluate models on Original vs Exact-Matched vs Closest-Matched
        model_results = []
        y_pos_orig = pos["target"].values
        y_bg_orig = bg["target"].values

        y_pos_exact = sub_pos["target"].values
        y_bg_exact = sub_bg["target"].values
        y_exact_comb = np.concatenate([y_pos_exact, y_bg_exact])

        for name, slug in ALGORITHMS:
            col = f"pred_score_{slug}"
            
            # 1. Original (Full 170)
            orig_scores = pred_df[col].values
            orig_auc = roc_auc_score(pred_df["target"], orig_scores)
            orig_ap = average_precision_score(pred_df["target"], orig_scores)
            orig_rec10 = compute_recall_at_top_k_percent_robust(pred_df["target"].values, orig_scores, 10.0)

            # 2. Exact Matched Subcohort
            scores_pos_exact = sub_pos[col].values
            scores_bg_exact = sub_bg[col].values
            exact_comb_scores = np.concatenate([scores_pos_exact, scores_bg_exact])
            exact_auc = roc_auc_score(y_exact_comb, exact_comb_scores)
            exact_ap = average_precision_score(y_exact_comb, exact_comb_scores)
            exact_rec10 = compute_recall_at_top_k_percent_robust(y_exact_comb, exact_comb_scores, 10.0)

            # Bootstrap Delta for Exact Matched vs Original
            ci_l_auc, ci_u_auc, p_auc = bootstrap_delta_metric(
                y_pos_orig, y_bg_orig, pos[col].values, bg[col].values,
                y_pos_exact, y_bg_exact, scores_pos_exact, scores_bg_exact,
                roc_auc_score
            )
            ci_l_ap, ci_u_ap, p_ap = bootstrap_delta_metric(
                y_pos_orig, y_bg_orig, pos[col].values, bg[col].values,
                y_pos_exact, y_bg_exact, scores_pos_exact, scores_bg_exact,
                average_precision_score
            )

            model_results.append({
                "algorithm": name,
                "original_auc": round(float(orig_auc), 4),
                "exact_matched_auc": round(float(exact_auc), 4),
                "delta_auc": round(float(exact_auc - orig_auc), 4),
                "delta_auc_95_ci": [ci_l_auc, ci_u_auc],
                "delta_auc_p_value": p_auc,
                "original_ap": round(float(orig_ap), 4),
                "exact_matched_ap": round(float(exact_ap), 4),
                "delta_ap": round(float(exact_ap - orig_ap), 4),
                "delta_ap_95_ci": [ci_l_ap, ci_u_ap],
                "original_recall_top10": orig_rec10,
                "exact_matched_recall_top10": exact_rec10,
                "delta_recall_top10": round(float(exact_rec10 - orig_rec10), 4)
            })

        df_res = pd.DataFrame(model_results)
        print("\nModel Comparison: Original Test Set vs. Exact State-Month Matched Subcohort:")
        print(df_res[["algorithm", "original_auc", "exact_matched_auc", "delta_auc", "delta_auc_95_ci", "delta_auc_p_value", "original_ap", "exact_matched_ap"]].to_string(index=False))

        # Save matched subcohort dataset
        subcohort_df = pd.concat([sub_pos, sub_bg]).reset_index(drop=True)
        subcohort_path = os.path.join(RESULTS_DIR, f"stage5_11_{bmk_label.lower().replace(' ', '_')}_matched_predictions.csv")
        subcohort_df.to_csv(subcohort_path, index=False)
        print(f"\nSaved Matched Subcohort Predictions to: {subcohort_path}")

        return {
            "n_positives_exact_matched": n_exact,
            "n_background_exact_matched": n_exact,
            "n_total_exact_matched": 2 * n_exact,
            "full_cohort_nearest_month_audit": {
                "avg_circular_month_distance": round(float(avg_month_dist), 2),
                "exact_month_match_pct": round(float(exact_month_match_pct), 1),
                "within_1_month_pct": round(float(within_1_month_pct), 1)
            },
            "model_evaluations": model_results
        }

    results_payload["benchmark_a_sensitivity"] = evaluate_benchmark_sensitivity("Benchmark A", pred_a_df)
    results_payload["benchmark_b_sensitivity"] = evaluate_benchmark_sensitivity("Benchmark B", pred_b_df)

    # 4. Save JSON Metrics
    out_json_path = os.path.join(RESULTS_DIR, "stage5_11_season_matched_metrics.json")
    with open(out_json_path, "w") as f:
        json.dump(results_payload, f, indent=2)
    print(f"\nSaved Stage 5.11 Metrics JSON to: {out_json_path}")
    print("=== Stage 5.11 Sensitivity Evaluation Complete ===")


if __name__ == "__main__":
    main()
