"""
scripts/audit_pilot_spatial_proximity.py

Stage 5.1 QA Audit:
1. Verifies the 2,033 training positive terrain cache integrity.
2. Computes nearest train/test distances across all available positive candidates,
   Benchmark A pilot records, and Benchmark B pilot records.
3. Reports the exact count and percentage of test points with nearest train point within:
   - < 1.0 km
   - < 3.0 km
   - < 10.0 km
"""

import os
import json
import numpy as np
import pandas as pd
from scipy.spatial import cKDTree

def geodetic_to_ecef(lat_deg, lon_deg):
    phi = np.radians(lat_deg)
    lam = np.radians(lon_deg)
    r = 6371000.0
    x = r * np.cos(phi) * np.cos(lam)
    y = r * np.cos(phi) * np.sin(lam)
    z = r * np.sin(phi)
    return np.column_stack([x, y, z]) if hasattr(lat_deg, "__len__") else np.array([x, y, z])

def chord_distance_to_km(chord_dist):
    r = 6371000.0
    sin_half = np.clip(chord_dist / (2.0 * r), 0.0, 1.0)
    theta = 2.0 * np.arcsin(sin_half)
    return (theta * r) / 1000.0

print("=" * 80)
print("STAGE 5.1 SPATIAL PROXIMITY & TERRAIN CACHE AUDIT")
print("=" * 80)

# --- 1. AUDIT TERRAIN CACHE FOR 2,033 TRAIN POSITIVES ---
CACHE_PATH = "datasets/cache/copernicus_dem_coords_cache.json"
CAND_PATH = "datasets/jps_positives_peninsular_candidates.csv"

df_cand = pd.read_csv(CAND_PATH)
train_pos = df_cand[df_cand["year"] <= 2019].copy()
test_pos = df_cand[df_cand["year"] >= 2020].copy()

cache = {}
if os.path.exists(CACHE_PATH):
    with open(CACHE_PATH, "r", encoding="utf-8") as f:
        cache = json.load(f)

unique_train_coords = train_pos[["latitude", "longitude"]].drop_duplicates().values
print(f"\n--- 1. Training Positive Terrain Cache Audit ---")
print(f"Total training positive events: {len(train_pos)}")
print(f"Unique training coordinates:    {len(unique_train_coords)}")
print(f"Total entries in cache:          {len(cache)}")

cache_hits = 0
missing_in_cache = 0
nodata_count = 0
invalid_count = 0
valid_elevs = []
valid_slopes = []

for lat, lon in unique_train_coords:
    key = f"{lat:.4f}_{lon:.4f}"
    if key in cache:
        cache_hits += 1
        entry = cache[key]
        if entry.get("status") == "VALID":
            valid_elevs.append(entry["elevation_m"])
            valid_slopes.append(entry["slope_deg"])
        elif entry.get("status") == "NODATA":
            nodata_count += 1
        else:
            invalid_count += 1
    else:
        missing_in_cache += 1

print(f"Cache Coverage: {cache_hits} / {len(unique_train_coords)} ({cache_hits/len(unique_train_coords):.2%})")
print(f"Missing in cache: {missing_in_cache}")
print(f"NODATA / Void entries: {nodata_count}")
print(f"Invalid / Error entries: {invalid_count}")
print(f"Valid extracted coordinates: {len(valid_elevs)}")
print(f"Elevation Range: [{min(valid_elevs):.2f} m, {max(valid_elevs):.2f} m]")
print(f"Slope Range:     [{min(valid_slopes):.2f} deg, {max(valid_slopes):.2f} deg]")


# --- 2. TRAIN / TEST SPATIAL PROXIMITY AUDIT ---
def analyze_proximity(name, train_df, test_df):
    tr_ecef = geodetic_to_ecef(train_df["latitude"].values, train_df["longitude"].values)
    te_ecef = geodetic_to_ecef(test_df["latitude"].values, test_df["longitude"].values)
    
    tr_tree = cKDTree(tr_ecef)
    chord_dists, _ = tr_tree.query(te_ecef, k=1)
    dists_km = chord_distance_to_km(chord_dists)

    n_total = len(test_df)
    n_under_1km = (dists_km < 1.0).sum()
    n_under_3km = (dists_km < 3.0).sum()
    n_under_10km = (dists_km < 10.0).sum()

    print(f"\n--- Spatial Proximity: {name} (N_test = {n_total}) ---")
    print(f"  Nearest Train Distance (km): Min={np.min(dists_km):.2f}, 25%={np.percentile(dists_km, 25):.2f}, Median={np.median(dists_km):.2f}, 75%={np.percentile(dists_km, 75):.2f}, Max={np.max(dists_km):.2f}")
    print(f"  Pairs within < 1.0 km:  {n_under_1km:4d} / {n_total} ({n_under_1km/n_total*100:5.1f}%) [High micro-site / localized confounding]")
    print(f"  Pairs within < 3.0 km:  {n_under_3km:4d} / {n_total} ({n_under_3km/n_total*100:5.1f}%) [Same immediate sub-basin / neighborhood]")
    print(f"  Pairs within < 10.0 km: {n_under_10km:4d} / {n_total} ({n_under_10km/n_total*100:5.1f}%) [Same meso-scale watershed / weather zone]")
    print(f"  Pairs >= 10.0 km:       {(dists_km >= 10.0).sum():4d} / {n_total} ({(dists_km >= 10.0).sum()/n_total*100:5.1f}%)")
    return dists_km

# A. Positive Candidates (Train Pos vs Test Pos)
analyze_proximity("All Positive Candidates (Train Positives vs Test Positives)", train_pos, test_pos)

# B. Benchmark A (Uniform Background Pilot)
df_unif = pd.read_csv("datasets/floodway_stage5_pilot_uniform_negatives_50.csv")
unif_tr = df_unif[df_unif["split"] == "train"]
unif_te = df_unif[df_unif["split"] == "test"]
analyze_proximity("Benchmark A Pilot: Train Negatives vs Test Negatives", unif_tr, unif_te)
analyze_proximity("Benchmark A Pilot: Train Positives vs Test Negatives", train_pos, unif_te)

# C. Benchmark B (Terrain-Restricted Background Pilot)
df_match = pd.read_csv("datasets/floodway_stage5_pilot_matched_negatives_50.csv")
match_tr = df_match[df_match["split"] == "train"]
match_te = df_match[df_match["split"] == "test"]
analyze_proximity("Benchmark B Pilot: Train Negatives vs Test Negatives", match_tr, match_te)
analyze_proximity("Benchmark B Pilot: Train Positives vs Test Negatives", train_pos, match_te)

# D. Combined Cohorts (Train Pos+Neg vs Test Pos+Neg)
comb_unif_tr = pd.concat([train_pos[["latitude", "longitude"]], unif_tr[["latitude", "longitude"]]], ignore_index=True)
comb_unif_te = pd.concat([test_pos[["latitude", "longitude"]], unif_te[["latitude", "longitude"]]], ignore_index=True)
analyze_proximity("Combined Benchmark A Cohort: All Train vs All Test", comb_unif_tr, comb_unif_te)
