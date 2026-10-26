"""
FloodWay - Pilot Cohort Selection (Phase 4 Preparation)
Selects 20 Positives and 20 Pseudo-Negatives for the Environmental Feature Extraction Pilot.
Preserves temporal splits (13 Train <=2019, 7 Test >=2020) and balances across Peninsular states.
"""

import pandas as pd
import numpy as np
import os

RANDOM_SEED = 42

def select_pilot_cohort():
    pos_path = "datasets/jps_positives_peninsular_candidates.csv"
    neg_path = "datasets/floodway_pilot_pseudo_negatives.csv"

    if not os.path.exists(pos_path):
        raise FileNotFoundError(f"Missing {pos_path}")
    if not os.path.exists(neg_path):
        raise FileNotFoundError(f"Missing {neg_path}")

    pos_df = pd.read_csv(pos_path)
    neg_df = pd.read_csv(neg_path)

    # 1. Stratified Positive Sample (13 Train <=2019, 7 Test >=2020)
    pos_train = pos_df[pos_df["year"] <= 2019].sample(13, random_state=RANDOM_SEED).copy()
    pos_test = pos_df[pos_df["year"] >= 2020].sample(7, random_state=RANDOM_SEED).copy()
    
    pos_sample = pd.concat([pos_train, pos_test], ignore_index=True)
    pos_sample["sample_id"] = [f"PILOT_POS_{i+1:02d}" for i in range(len(pos_sample))]
    pos_sample["source_type"] = "jps_positive"
    pos_sample["target"] = 1
    pos_sample["split"] = np.where(pos_sample["year"] <= 2019, "train", "test")
    pos_sample["label_class"] = "positive"
    pos_sample["label_certainty"] = "unverified_precision_candidate"

    # Standardize column structure
    pos_cols = [
        "sample_id", "source_type", "split", "target", "label_class", "label_certainty",
        "date", "year", "state", "place", "latitude", "longitude", "excel_row_num"
    ]
    pos_clean = pos_sample[pos_cols].copy()

    # 2. Stratified Pseudo-Negative Sample (13 Train, 7 Test)
    neg_train = neg_df[neg_df["split"] == "train"].sample(13, random_state=RANDOM_SEED).copy()
    neg_test = neg_df[neg_df["split"] == "test"].sample(7, random_state=RANDOM_SEED).copy()
    
    neg_sample = pd.concat([neg_train, neg_test], ignore_index=True)
    neg_sample["sample_id"] = [f"PILOT_NEG_{i+1:02d}" for i in range(len(neg_sample))]
    neg_sample["source_type"] = "pseudo_negative"
    neg_sample["place"] = "Background Land Location"
    neg_sample["excel_row_num"] = -1

    neg_cols = [
        "sample_id", "source_type", "split", "target", "label_class", "label_certainty",
        "date", "year", "state", "place", "latitude", "longitude", "excel_row_num"
    ]
    neg_clean = neg_sample[neg_cols].copy()

    # Combine into 40-record cohort
    cohort_df = pd.concat([pos_clean, neg_clean], ignore_index=True)
    
    out_path = "datasets/floodway_pilot_cohort_40.csv"
    cohort_df.to_csv(out_path, index=False)
    print(f"Exported {len(cohort_df)} records to {out_path}")
    print(cohort_df["source_type"].value_counts())
    print("\nState distribution across cohort:")
    print(cohort_df["state"].value_counts())

if __name__ == "__main__":
    select_pilot_cohort()
