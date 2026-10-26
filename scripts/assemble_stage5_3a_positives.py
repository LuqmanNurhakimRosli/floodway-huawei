"""
scripts/assemble_stage5_3a_positives.py

FloodWay Stage 5.3A: Positive Cohort Assembly and Feature Extraction.
1. Selects exactly 250 reported flood positives (165 Train <= 2019, 85 Test >= 2020)
   using seed 42 and programmatic state quotas.
2. Training selection strictly uses training-period data (<= 2019).
3. Verifies Copernicus DEM cache coverage for selected training and test coordinates,
   extracting any missing coordinates via AWS S3 COG queries.
4. Extracts authentic historical ECMWF ERA5 rainfall via Open-Meteo.
5. Populates antecedent rainfall (D-1, D-3..D-1, D-7..D-1) and isolates event-day rainfall (D-0).
6. Audits repeated coordinates, train/test coordinate overlap, and spatial proximity.
7. Assembles modeling-ready datasets:
   - Benchmark A: 250 Positives + 250 Uniform Background (N=500)
   - Benchmark B: 250 Positives + 250 Terrain-Restricted Background (N=500)
   - Shared Fixed Test Set: 85 Test Positives + 85 Uniform Test Background (N=170)
   - Standalone Enriched Positives: N=250
"""

import os
import sys
import json
import math
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta
import numpy as np
import pandas as pd
from scipy.spatial import cKDTree
import rasterio
from rasterio.windows import Window

RANDOM_SEED = 42
TARGET_TRAIN_COUNT = 165
TARGET_TEST_COUNT = 85
TOTAL_POSITIVE_COUNT = 250

CACHE_DIR = "datasets/cache"
CHECKPOINT_DIR = "datasets/checkpoints"
RAINFALL_CACHE_FILE = os.path.join(CACHE_DIR, "open_meteo_rainfall_cache.json")
DEM_CACHE_FILE = os.path.join(CACHE_DIR, "copernicus_dem_coords_cache.json")

CAND_PATH = "datasets/jps_positives_peninsular_candidates.csv"
INPUT_UNIFORM_250_CSV = "datasets/floodway_stage5_2b_uniform_features_250.csv"
INPUT_MATCHED_250_CSV = "datasets/floodway_stage5_2b_matched_features_250.csv"

OUTPUT_POSITIVES_250_CSV = "datasets/floodway_stage5_3a_positives_features_250.csv"
OUTPUT_BENCHMARK_A_500_CSV = "datasets/floodway_stage5_3a_benchmark_a_modeling_500.csv"
OUTPUT_BENCHMARK_B_500_CSV = "datasets/floodway_stage5_3a_benchmark_b_modeling_500.csv"
OUTPUT_SHARED_TEST_170_CSV = "datasets/floodway_stage5_3a_shared_fixed_test_170.csv"

os.makedirs(CACHE_DIR, exist_ok=True)
os.makedirs(CHECKPOINT_DIR, exist_ok=True)

# Programmatic State Quotas
TRAIN_QUOTAS = {
    'Pulau Pinang': 41, 'Selangor': 37, 'Kedah': 24, 'Johor': 10, 'Pahang': 10,
    'Perak': 10, 'Kelantan': 10, 'Melaka': 9, 'Negeri Sembilan': 5,
    'Kuala Lumpur': 4, 'Terengganu': 4, 'Perlis': 1
}

TEST_QUOTAS = {
    'Selangor': 14, 'Pahang': 12, 'Perak': 12, 'Johor': 11, 'Kedah': 10,
    'Pulau Pinang': 9, 'Melaka': 5, 'Kuala Lumpur': 4, 'Terengganu': 3,
    'Negeri Sembilan': 3, 'Kelantan': 2, 'Perlis': 0
}

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

def calculate_horn_slope(patch, lat_deg):
    z_tl, z_t, z_tr = patch[0, 0], patch[0, 1], patch[0, 2]
    z_l,  z_c, z_r  = patch[1, 0], patch[1, 1], patch[1, 2]
    z_bl, z_b, z_br = patch[2, 0], patch[2, 1], patch[2, 2]

    dy = 30.867
    dx = 30.867 * math.cos(math.radians(lat_deg))

    dz_dx = ((z_tr + 2.0 * z_r + z_br) - (z_tl + 2.0 * z_l + z_bl)) / (8.0 * dx)
    dz_dy = ((z_tl + 2.0 * z_t + z_tr) - (z_bl + 2.0 * z_b + z_br)) / (8.0 * dy)

    slope_rad = math.atan(math.sqrt(dz_dx**2 + dz_dy**2))
    return math.degrees(slope_rad)

def load_json_cache(path):
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def save_json_cache(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def main():
    print("=" * 80)
    print("STAGE 5.3A: POSITIVE COHORT ASSEMBLY & FEATURE EXTRACTION")
    print("=" * 80)

    # 1. Load Candidate Positives
    cand_df = pd.read_csv(CAND_PATH)
    print(f"Total Candidate Positives Loaded: {len(cand_df):,}")

    train_cand = cand_df[cand_df["year"] <= 2019].copy()
    test_cand = cand_df[cand_df["year"] >= 2020].copy()
    print(f"  Training Pool (<= 2019): {len(train_cand):,} records")
    print(f"  Testing Pool  (>= 2020): {len(test_cand):,} records")

    # 2. Select 165 Training Positives (Strictly within Train Pool)
    # Using deterministic sampling per state
    train_selected = []
    for state, quota in TRAIN_QUOTAS.items():
        state_pool = train_cand[train_cand["state"] == state].sort_values(by="excel_row_num").reset_index(drop=True)
        if len(state_pool) < quota:
            raise ValueError(f"Insufficient train candidates in {state}: need {quota}, found {len(state_pool)}")
        sampled = state_pool.sample(n=quota, random_state=RANDOM_SEED)
        train_selected.append(sampled)
    df_train_pos = pd.concat(train_selected).sort_values(by="excel_row_num").reset_index(drop=True)
    df_train_pos["split"] = "train"
    print(f"\nSelected Train Positives: {len(df_train_pos)} records")
    assert len(df_train_pos) == TARGET_TRAIN_COUNT
    assert df_train_pos["year"].max() <= 2019

    # 3. Select 85 Testing Positives (Strictly within Test Pool)
    test_selected = []
    for state, quota in TEST_QUOTAS.items():
        if quota == 0:
            continue
        state_pool = test_cand[test_cand["state"] == state].sort_values(by="excel_row_num").reset_index(drop=True)
        if len(state_pool) < quota:
            raise ValueError(f"Insufficient test candidates in {state}: need {quota}, found {len(state_pool)}")
        sampled = state_pool.sample(n=quota, random_state=RANDOM_SEED)
        test_selected.append(sampled)
    df_test_pos = pd.concat(test_selected).sort_values(by="excel_row_num").reset_index(drop=True)
    df_test_pos["split"] = "test"
    print(f"Selected Test Positives:  {len(df_test_pos)} records")
    assert len(df_test_pos) == TARGET_TEST_COUNT
    assert df_test_pos["year"].min() >= 2020

    df_positives = pd.concat([df_train_pos, df_test_pos], ignore_index=True)
    assert len(df_positives) == TOTAL_POSITIVE_COUNT

    # 4. Terrain Feature Coverage & Extraction
    print("\n--- 4. Terrain Feature Verification & Extraction ---")
    dem_cache = load_json_cache(DEM_CACHE_FILE)
    print(f"Loaded DEM coordinate cache with {len(dem_cache)} entries.")

    tile_cache = {}
    elev_list = []
    slope_list = []
    terrain_cache_hits = 0
    terrain_new_queries = 0

    for idx, row in df_positives.iterrows():
        lat = row["latitude"]
        lon = row["longitude"]
        key = f"{lat:.4f}_{lon:.4f}"

        if key in dem_cache and dem_cache[key].get("status") == "VALID":
            terrain_cache_hits += 1
            elev_list.append(dem_cache[key]["elevation_m"])
            slope_list.append(dem_cache[key]["slope_deg"])
        else:
            terrain_new_queries += 1
            lat_floor = int(math.floor(lat))
            lon_floor = int(math.floor(lon))
            northing = f"N{lat_floor:02d}_00"
            easting = f"E{lon_floor:03d}_00"
            tile_name = f"Copernicus_DSM_COG_10_{northing}_{easting}_DEM"
            cog_url = f"https://copernicus-dem-30m.s3.amazonaws.com/{tile_name}/{tile_name}.tif"

            try:
                if cog_url not in tile_cache:
                    tile_cache[cog_url] = rasterio.open(cog_url)
                src = tile_cache[cog_url]

                py, px = src.index(lon, lat)
                patch = src.read(1, window=Window(px - 1, py - 1, 3, 3))
                elev = round(float(patch[1, 1]), 2)
                slope = round(float(calculate_horn_slope(patch, lat)), 2)
                dem_cache[key] = {"elevation_m": elev, "slope_deg": slope, "status": "VALID"}
                elev_list.append(elev)
                slope_list.append(slope)
            except Exception as e:
                raise RuntimeError(f"Failed to extract DEM for coordinate ({lat}, {lon}): {e}")

    for src in tile_cache.values():
        src.close()
    save_json_cache(DEM_CACHE_FILE, dem_cache)

    print(f"Terrain Processing for Positives (N=250):")
    print(f"  Cache Hits:    {terrain_cache_hits} / 250 ({terrain_cache_hits/250*100:.1f}%)")
    print(f"  New Queries:   {terrain_new_queries} / 250")
    print(f"  Elevation:     Min={min(elev_list):.2f} m, Median={np.median(elev_list):.2f} m, Max={max(elev_list):.2f} m")
    print(f"  Slope:         Min={min(slope_list):.2f} deg, Median={np.median(slope_list):.2f} deg, Max={max(slope_list):.2f} deg")

    df_positives["elevation_m"] = elev_list
    df_positives["slope_deg"] = slope_list

    # 5. Extract Antecedent ERA5 Rainfall via Open-Meteo
    print("\n--- 5. Antecedent Rainfall Feature Extraction via Open-Meteo ---")
    rainfall_cache = load_json_cache(RAINFALL_CACHE_FILE)
    initial_rain_keys = len(rainfall_cache)
    print(f"Loaded rainfall cache with {initial_rain_keys} keys.")

    rain_1d_list = []
    rain_3d_list = []
    rain_7d_list = []
    rain_0d_list = []
    provenance_list = []

    rain_cache_hits = 0
    rain_network_requests = 0
    rain_failed_requests = 0
    t0 = time.time()

    for idx, row in df_positives.iterrows():
        lat = row["latitude"]
        lon = row["longitude"]
        target_date_str = row["date"]
        target_dt = datetime.strptime(target_date_str, "%Y-%m-%d")

        start_dt = target_dt - timedelta(days=7)
        start_date_str = start_dt.strftime("%Y-%m-%d")
        end_date_str = target_date_str

        cache_key = f"{lat:.4f}_{lon:.4f}_{start_date_str}_{end_date_str}_era5_Asia/Singapore"

        payload = None
        if cache_key in rainfall_cache:
            payload = rainfall_cache[cache_key]
            rain_cache_hits += 1
        else:
            rain_network_requests += 1
            url = (
                f"https://archive-api.open-meteo.com/v1/archive?"
                f"latitude={lat:.4f}&longitude={lon:.4f}&"
                f"start_date={start_date_str}&end_date={end_date_str}&"
                f"daily=precipitation_sum&"
                f"timezone=Asia%2FSingapore&"
                f"models=era5"
            )
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "FloodWay_Stage5_3A_Positives/1.0 (ECMWF_ERA5_Extraction)"}
            )

            time.sleep(0.15)
            max_retries = 4
            for attempt in range(max_retries):
                try:
                    with urllib.request.urlopen(req, timeout=15) as resp:
                        payload = json.loads(resp.read().decode("utf-8"))
                    rainfall_cache[cache_key] = payload
                    break
                except urllib.error.HTTPError as e:
                    if e.code == 429:
                        backoff = (2 ** attempt) * 2.5
                        print(f"  [Rate Limit 429] Backing off {backoff:.1f}s at row {idx}...")
                        time.sleep(backoff)
                    else:
                        if attempt == max_retries - 1:
                            rain_failed_requests += 1
                            print(f"  [HTTP Error {e.code}] on row {idx} ({lat}, {lon})")
                except Exception as e:
                    if attempt == max_retries - 1:
                        rain_failed_requests += 1
                        print(f"  [Network Error {e}] on row {idx} ({lat}, {lon})")
                    time.sleep(1.0)

            if (idx + 1) % 50 == 0:
                elapsed = time.time() - t0
                print(f"  Progress: {idx + 1}/250 ({rain_network_requests} API calls, {rain_cache_hits} cache hits) in {elapsed:.1f}s...")
                save_json_cache(RAINFALL_CACHE_FILE, rainfall_cache)

        if payload is None or "daily" not in payload or "precipitation_sum" not in payload["daily"]:
            raise RuntimeError(f"Missing payload for positive row {idx} ({row['excel_row_num']})")

        daily_times = payload["daily"]["time"]
        daily_vals = payload["daily"]["precipitation_sum"]

        expected_dates = [(target_dt - timedelta(days=d)).strftime("%Y-%m-%d") for d in range(7, -1, -1)]
        date_to_val = dict(zip(daily_times, daily_vals))
        window_vals = [date_to_val.get(d) for d in expected_dates]

        if any(v is None for v in window_vals):
            raise ValueError(f"Incomplete rainfall series for positive row {idx}: {window_vals}")

        rain_1d = round(float(window_vals[6]), 2)                       # D-1
        rain_3d = round(float(sum(window_vals[4:7])), 2)                 # D-3 to D-1
        rain_7d = round(float(sum(window_vals[0:7])), 2)                 # D-7 to D-1
        rain_0d = round(float(window_vals[7]), 2)                       # D-0 (diagnostic only)

        rain_1d_list.append(rain_1d)
        rain_3d_list.append(rain_3d)
        rain_7d_list.append(rain_7d)
        rain_0d_list.append(rain_0d)
        provenance_list.append("ECMWF_ERA5_OPEN_METEO_V1_ARCHIVE")

    total_rain_time = time.time() - t0
    save_json_cache(RAINFALL_CACHE_FILE, rainfall_cache)
    print(f"Rainfall extraction completed in {total_rain_time:.1f}s.")
    print(f"  API Calls:   {rain_network_requests}")
    print(f"  Cache Hits:  {rain_cache_hits}")
    print(f"  Failures:    {rain_failed_requests}")

    df_positives["rain_1d_prior_mm"] = rain_1d_list
    df_positives["rain_3d_prior_mm"] = rain_3d_list
    df_positives["rain_7d_prior_mm"] = rain_7d_list
    df_positives["rain_event_day_mm"] = rain_0d_list
    df_positives["rainfall_provenance"] = provenance_list
    df_positives["rainfall_unit"] = "mm"
    df_positives["rainfall_timezone"] = "Asia/Singapore"
    df_positives["rainfall_model"] = "ECMWF_ERA5_0.25deg"

    # 6. Format Metadata & Spatial Distance Attributes
    print("\n--- 6. Metadata Formatting & Spatial Relationship Auditing ---")
    df_positives["sample_id"] = [f"POS_{r['excel_row_num']}" for _, r in df_positives.iterrows()]
    df_positives["benchmark_type"] = "Reported Flood Positives"
    df_positives["target"] = 1
    df_positives["label_class"] = "reported_flood_incident"
    df_positives["label_certainty"] = "unverified_precision"
    df_positives["exclusion_basis"] = "none_reported_flood_incident"

    # Compute distances to training and testing positive pools
    tr_ecef = geodetic_to_ecef(df_train_pos["latitude"].values, df_train_pos["longitude"].values)
    te_ecef = geodetic_to_ecef(df_test_pos["latitude"].values, df_test_pos["longitude"].values)
    tr_tree = cKDTree(tr_ecef)
    te_tree = cKDTree(te_ecef)

    all_ecef = geodetic_to_ecef(df_positives["latitude"].values, df_positives["longitude"].values)

    # For each positive, compute distance to nearest other train positive
    dist_to_train_km = []
    dist_to_test_km = []
    dist_to_permitted_km = []

    for i, r in df_positives.iterrows():
        p_ecef = all_ecef[i]
        # Distance to train: query 2 if this is a train point (first is self)
        if r["split"] == "train":
            dists, idxs = tr_tree.query(p_ecef, k=2)
            d_tr = chord_distance_to_km(dists[1])
            d_perm = d_tr
        else:
            d_tr = chord_distance_to_km(tr_tree.query(p_ecef, k=1)[0])
            # For test positive, permitted is train plus causal test floods before target date
            causal_test = df_test_pos[pd.to_datetime(df_test_pos["date"]) <= pd.to_datetime(r["date"])]
            if len(causal_test) > 1:
                c_ecef = geodetic_to_ecef(causal_test["latitude"].values, causal_test["longitude"].values)
                c_tree = cKDTree(c_ecef)
                d_c = chord_distance_to_km(c_tree.query(p_ecef, k=2)[0][1])
                d_perm = min(d_tr, d_c)
            else:
                d_perm = d_tr

        # Distance to test: query 2 if test point
        if r["split"] == "test":
            d_te = chord_distance_to_km(te_tree.query(p_ecef, k=2)[0][1])
        else:
            d_te = chord_distance_to_km(te_tree.query(p_ecef, k=1)[0])

        dist_to_train_km.append(round(d_tr, 2))
        dist_to_test_km.append(round(d_te, 2))
        dist_to_permitted_km.append(round(d_perm, 2))

    df_positives["min_dist_to_permitted_pos_km"] = dist_to_permitted_km
    df_positives["min_dist_to_train_pos_km"] = dist_to_train_km
    df_positives["min_dist_to_test_pos_km"] = dist_to_test_km

    # Reorder columns to match Stage 5.2B schema exactly
    schema_cols = [
        "sample_id", "benchmark_type", "split", "target", "label_class", "label_certainty",
        "date", "year", "state", "place", "latitude", "longitude",
        "elevation_m", "slope_deg", "min_dist_to_permitted_pos_km", "min_dist_to_train_pos_km",
        "min_dist_to_test_pos_km", "exclusion_basis", "rain_1d_prior_mm", "rain_3d_prior_mm",
        "rain_7d_prior_mm", "rain_event_day_mm", "rainfall_provenance", "rainfall_unit",
        "rainfall_timezone", "rainfall_model"
    ]
    df_positives = df_positives[schema_cols].copy()

    # Save Standalone Enriched Positives
    df_positives.to_csv(OUTPUT_POSITIVES_250_CSV, index=False)
    print(f"Exported Standalone Positives Dataset: {OUTPUT_POSITIVES_250_CSV} ({len(df_positives)} rows)")

    # 7. Assemble Modeling Datasets
    print("\n--- 7. Assembling Modeling Datasets ---")
    df_unif_bg = pd.read_csv(INPUT_UNIFORM_250_CSV)
    df_match_bg = pd.read_csv(INPUT_MATCHED_250_CSV)

    assert len(df_unif_bg) == 250, f"Uniform background count {len(df_unif_bg)} != 250"
    assert len(df_match_bg) == 250, f"Matched background count {len(df_match_bg)} != 250"

    # Assemble Benchmark A Modeling Dataset
    df_benchmark_a = pd.concat([df_positives, df_unif_bg], ignore_index=True)
    df_benchmark_a.to_csv(OUTPUT_BENCHMARK_A_500_CSV, index=False)
    print(f"Exported Benchmark A Modeling Dataset: {OUTPUT_BENCHMARK_A_500_CSV} ({len(df_benchmark_a)} rows)")

    # Assemble Benchmark B Modeling Dataset
    df_benchmark_b = pd.concat([df_positives, df_match_bg], ignore_index=True)
    df_benchmark_b.to_csv(OUTPUT_BENCHMARK_B_500_CSV, index=False)
    print(f"Exported Benchmark B Modeling Dataset: {OUTPUT_BENCHMARK_B_500_CSV} ({len(df_benchmark_b)} rows)")

    # Assemble Shared Fixed Test Set (85 Test Positives + 85 Uniform Test Negatives)
    test_pos_85 = df_positives[df_positives["split"] == "test"].copy()
    test_unif_neg_85 = df_unif_bg[df_unif_bg["split"] == "test"].copy()
    df_shared_test = pd.concat([test_pos_85, test_unif_neg_85], ignore_index=True)
    df_shared_test.to_csv(OUTPUT_SHARED_TEST_170_CSV, index=False)
    print(f"Exported Shared Fixed Test Dataset:    {OUTPUT_SHARED_TEST_170_CSV} ({len(df_shared_test)} rows)")

    # 8. Post-Assembly QA & Spatial Audit
    print("\n" + "=" * 80)
    print("STAGE 5.3A COMPREHENSIVE QA AUDIT REPORT")
    print("=" * 80)

    print(f"Positive Cohort Summary (N=250):")
    print(f"  Train Positives: {(df_positives['split'] == 'train').sum()} (Target: 165)")
    print(f"  Test Positives:  {(df_positives['split'] == 'test').sum()} (Target: 85)")
    assert (df_positives['split'] == 'train').sum() == 165
    assert (df_positives['split'] == 'test').sum() == 85
    print("  [PASS] Positive sample counts and temporal split match targets exactly.")

    # Missing values check across all 5 predictive features + diagnostic
    pred_features = ["rain_1d_prior_mm", "rain_3d_prior_mm", "rain_7d_prior_mm", "elevation_m", "slope_deg"]
    missing_pred = df_positives[pred_features].isnull().sum().to_dict()
    print(f"Predictive Feature Missingness (Positives):\n  {missing_pred}")
    assert df_positives[pred_features].isnull().sum().sum() == 0
    print("  [PASS] Zero missing values across all 5 predictive features.")

    # Coordinate repetition audit within positive cohort
    n_unique_coords = df_positives.drop_duplicates(subset=["latitude", "longitude"]).shape[0]
    print(f"\nCoordinate Uniqueness (Positives N=250):")
    print(f"  Unique Coordinates: {n_unique_coords} / 250 ({n_unique_coords/250*100:.1f}%)")
    coord_counts = df_positives.groupby(["latitude", "longitude"]).size()
    multi_events = coord_counts[coord_counts > 1]
    print(f"  Coordinates with multiple flood events in cohort: {len(multi_events)} (accounting for {multi_events.sum()} events)")
    print(f"  Max events at single coordinate: {coord_counts.max()}")

    # Train / Test coordinate overlap audit
    train_c = set(zip(df_train_pos["latitude"], df_train_pos["longitude"]))
    test_c = set(zip(df_test_pos["latitude"], df_test_pos["longitude"]))
    overlap_c = train_c.intersection(test_c)
    test_at_train_coords = df_test_pos.apply(lambda r: (r["latitude"], r["longitude"]) in overlap_c, axis=1).sum()
    print(f"\nTrain/Test Positive Coordinate Overlap:")
    print(f"  Unique Train Coordinates: {len(train_c)}")
    print(f"  Unique Test Coordinates:  {len(test_c)}")
    print(f"  Shared Coordinates:       {len(overlap_c)} ({len(overlap_c)/len(test_c)*100:.1f}% of test coords)")
    print(f"  Test Positive Events at Coordinates Seen in Train: {test_at_train_coords} / 85 ({test_at_train_coords/85*100:.1f}%)")
    print(f"  Test Positive Events at Novel (Unseen) Coordinates: {85 - test_at_train_coords} / 85 ({(85 - test_at_train_coords)/85*100:.1f}%)")

    # Nearest-neighbor spatial proximity of test positives to training positives
    te_pos_dists_km = df_positives[df_positives["split"] == "test"]["min_dist_to_train_pos_km"].values
    n_te_under_1 = (te_pos_dists_km < 1.0).sum()
    n_te_under_3 = (te_pos_dists_km < 3.0).sum()
    n_te_under_10 = (te_pos_dists_km < 10.0).sum()
    print(f"\nTest Positive Observations Proximity to Nearest Training Positive (N_test = 85):")
    print(f"  Distance (km): Min={np.min(te_pos_dists_km):.2f}, Median={np.median(te_pos_dists_km):.2f}, Max={np.max(te_pos_dists_km):.2f}")
    print(f"  Test positive observations within < 1.0 km:  {n_te_under_1:2d} / 85 ({n_te_under_1/85*100:4.1f}%)")
    print(f"  Test positive observations within < 3.0 km:  {n_te_under_3:2d} / 85 ({n_te_under_3/85*100:4.1f}%)")
    print(f"  Test positive observations within < 10.0 km: {n_te_under_10:2d} / 85 ({n_te_under_10/85*100:4.1f}%)")
    print(f"  Test positive observations >= 10.0 km:       {(te_pos_dists_km >= 10.0).sum():2d} / 85 ({(te_pos_dists_km >= 10.0).sum()/85*100:4.1f}%)")

    # Benchmark dataset assertions
    print(f"\nBenchmark Dataset Integrity Checks:")
    print(f"  Benchmark A Total Rows: {len(df_benchmark_a)} (Pos: {(df_benchmark_a['target']==1).sum()}, Neg: {(df_benchmark_a['target']==0).sum()})")
    assert len(df_benchmark_a) == 500
    assert (df_benchmark_a['target'] == 1).sum() == 250
    assert (df_benchmark_a['target'] == 0).sum() == 250
    assert (df_benchmark_a['split'] == 'train').sum() == 330
    assert (df_benchmark_a['split'] == 'test').sum() == 170
    print("  [PASS] Benchmark A verified: 500 rows, 1:1 balance, 330 train, 170 test.")

    print(f"  Benchmark B Total Rows: {len(df_benchmark_b)} (Pos: {(df_benchmark_b['target']==1).sum()}, Neg: {(df_benchmark_b['target']==0).sum()})")
    assert len(df_benchmark_b) == 500
    assert (df_benchmark_b['target'] == 1).sum() == 250
    assert (df_benchmark_b['target'] == 0).sum() == 250
    assert (df_benchmark_b['split'] == 'train').sum() == 330
    assert (df_benchmark_b['split'] == 'test').sum() == 170
    print("  [PASS] Benchmark B verified: 500 rows, 1:1 balance, 330 train, 170 test.")

    print(f"  Shared Fixed Test Set:  {len(df_shared_test)} rows (Pos: {(df_shared_test['target']==1).sum()}, Neg: {(df_shared_test['target']==0).sum()})")
    assert len(df_shared_test) == 170
    assert (df_shared_test['target'] == 1).sum() == 85
    assert (df_shared_test['target'] == 0).sum() == 85
    print("  [PASS] Shared Fixed Test Set verified: 170 rows, exactly 85 positives and 85 uniform background.")

    print("\n--- Summary Statistics: Reported Flood Positives (N=250) ---")
    print("  Elevation (m):", df_positives["elevation_m"].describe().round(2).to_dict())
    print("  Slope (deg):  ", df_positives["slope_deg"].describe().round(2).to_dict())
    print("  Rain 1d (mm): ", df_positives["rain_1d_prior_mm"].describe().round(2).to_dict())
    print("  Rain 3d (mm): ", df_positives["rain_3d_prior_mm"].describe().round(2).to_dict())
    print("  Rain 7d (mm): ", df_positives["rain_7d_prior_mm"].describe().round(2).to_dict())
    print("  Rain 0d (mm): ", df_positives["rain_event_day_mm"].describe().round(2).to_dict())

if __name__ == "__main__":
    main()
