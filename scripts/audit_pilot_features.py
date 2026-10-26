"""
FloodWay Phase 4B Final QA and Sampling-Bias Audit
Audits datasets/floodway_pilot_features_40.csv against datasets/floodway_pilot_rainfall_40.csv.
Analyzes sampling bias, terrain distributions, spatial leakage, and train/test balance.
"""

import os
import math
import pandas as pd
import numpy as np

def run_audit():
    rain_path = "datasets/floodway_pilot_rainfall_40.csv"
    feat_path = "datasets/floodway_pilot_features_40.csv"

    if not os.path.exists(rain_path):
        raise FileNotFoundError(f"Missing {rain_path}")
    if not os.path.exists(feat_path):
        raise FileNotFoundError(f"Missing {feat_path}")

    rain_df = pd.read_csv(rain_path)
    feat_df = pd.read_csv(feat_path)

    print("=" * 75)
    print("FLOODWAY PHASE 4B: FINAL QA & SAMPLING-BIAS AUDIT")
    print("=" * 75)

    # 1. Exact Column-by-Column & Row-by-Row Matching Check
    print("\n[1] VERIFYING EXACT MATCH WITH PHASE 4A INPUT")
    shared_cols = rain_df.columns.tolist()
    mismatches = []
    for col in shared_cols:
        s1 = rain_df[col]
        s2 = feat_df[col]
        if not s1.equals(s2):
            diff = ~(s1 == s2) & ~(s1.isna() & s2.isna())
            if diff.any():
                mismatches.append((col, diff.sum()))

    if not mismatches:
        print("  -> PASS: All 26 input columns (sample IDs, labels, dates, coordinates,")
        print("     rainfall metrics, and train/test splits) match Phase 4A input EXACTLY.")
    else:
        print(f"  -> FAIL: Column mismatches detected: {mismatches}")

    # 2. Check New Terrain Columns
    terrain_cols = [c for c in feat_df.columns if c not in shared_cols]
    print(f"\n[2] TERRAIN FEATURE SCHEMA: {terrain_cols}")
    print(f"  Missing terrain flags: {feat_df['missing_terrain_flag'].value_counts().to_dict()}")
    print(f"  Terrain QC statuses:   {feat_df['terrain_qc_status'].value_counts().to_dict()}")
    print(f"  DEM Source:            {feat_df['dem_source'].unique().tolist()}")
    print(f"  DEM Product Type:      {feat_df['dem_product_type'].unique().tolist()}")
    print(f"  Spatial Resolution:    {feat_df['dem_spatial_res_m'].unique().tolist()} meters")
    print(f"  CRS:                   {feat_df['dem_crs'].unique().tolist()}")

    # 3. Distribution Comparison: Positives vs Pseudo-Negatives
    print("\n[3] FEATURE DISTRIBUTIONS: POSITIVES (TARGET=1) VS PSEUDO-NEGATIVES (TARGET=0)")
    pos = feat_df[feat_df["target"] == 1]
    neg = feat_df[feat_df["target"] == 0]

    def print_dist(name, s):
        print(f"  {name:<24}: Mean={s.mean():6.2f} | Median={s.median():6.2f} | IQR=[{s.quantile(0.25):5.1f}, {s.quantile(0.75):5.1f}] | Min={s.min():5.1f} | Max={s.max():6.1f}")

    print("\n--- JPS POSITIVES (N=20) ---")
    print_dist("Elevation (m)", pos["elevation_m"])
    print_dist("Slope (deg)", pos["slope_deg"])
    print_dist("rain_1d_prior (mm)", pos["rain_1d_prior_mm"])
    print_dist("rain_3d_prior (mm)", pos["rain_3d_prior_mm"])
    print_dist("rain_7d_prior (mm)", pos["rain_7d_prior_mm"])
    print_dist("rain_event_day (mm)", pos["rain_event_day_retrospective_mm"])

    print("\n--- PSEUDO-NEGATIVES (N=20) ---")
    print_dist("Elevation (m)", neg["elevation_m"])
    print_dist("Slope (deg)", neg["slope_deg"])
    print_dist("rain_1d_prior (mm)", neg["rain_1d_prior_mm"])
    print_dist("rain_3d_prior (mm)", neg["rain_3d_prior_mm"])
    print_dist("rain_7d_prior (mm)", neg["rain_7d_prior_mm"])
    print_dist("rain_event_day (mm)", neg["rain_event_day_retrospective_mm"])

    # 4. Sampling Bias Investigation
    print("\n[4] SAMPLING BIAS INVESTIGATION (TERRAIN SEPARATION)")
    high_elev_neg = (neg["elevation_m"] > 300).sum()
    steep_slope_neg = (neg["slope_deg"] > 15.0).sum()
    high_elev_pos = (pos["elevation_m"] > 300).sum()
    steep_slope_pos = (pos["slope_deg"] > 15.0).sum()

    print(f"  Samples with Elevation > 300m:  Positives={high_elev_pos}/20 ({high_elev_pos/20*100:.1f}%) | Negatives={high_elev_neg}/20 ({high_elev_neg/20*100:.1f}%)")
    print(f"  Samples with Slope > 15 deg:    Positives={steep_slope_pos}/20 ({steep_slope_pos/20*100:.1f}%) | Negatives={steep_slope_neg}/20 ({steep_slope_neg/20*100:.1f}%)")
    
    print("\n  Top 5 Highest Elevation Samples:")
    top_elev = feat_df.sort_values(by="elevation_m", ascending=False)[["sample_id", "source_type", "state", "elevation_m", "slope_deg"]].head(5)
    for _, r in top_elev.iterrows():
        print(f"    {r['sample_id']} ({r['source_type']}) [{r['state']}]: Elev={r['elevation_m']:.1f}m, Slope={r['slope_deg']:.1f} deg")

    # 5. Spatial Proximity & Leakage Audit Between Train and Test
    print("\n[5] TRAIN / TEST SPATIAL LEAKAGE AUDIT")
    train_pts = feat_df[feat_df["split"] == "train"][["sample_id", "target", "state", "latitude", "longitude"]].copy()
    test_pts = feat_df[feat_df["split"] == "test"][["sample_id", "target", "state", "latitude", "longitude"]].copy()

    # Geodesic distance calculation via Haversine
    def haversine_km(lat1, lon1, lat2, lon2):
        R = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2.0)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0)**2
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return R * c

    min_train_test_dist = float("inf")
    closest_pair = None

    for _, tr in train_pts.iterrows():
        for _, te in test_pts.iterrows():
            d = haversine_km(tr["latitude"], tr["longitude"], te["latitude"], te["longitude"])
            if d < min_train_test_dist:
                min_train_test_dist = d
                closest_pair = (tr["sample_id"], tr["state"], te["sample_id"], te["state"])

    print(f"  Minimum distance between any Train point and Test point: {min_train_test_dist:.2f} km")
    print(f"  Closest Pair: {closest_pair[0]} ({closest_pair[1]}, Train) <--> {closest_pair[2]} ({closest_pair[3]}, Test)")

    # 6. Train/Test Breakdown by Label and State
    print("\n[6] SPLIT BREAKDOWN BY LABEL & STATE")
    ct = pd.crosstab(feat_df["state"], [feat_df["split"], feat_df["label_class"]])
    print(ct)

    print("\n" + "=" * 75)

if __name__ == "__main__":
    run_audit()
