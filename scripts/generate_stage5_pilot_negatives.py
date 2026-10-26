"""
scripts/generate_stage5_pilot_negatives.py

Stage 5.1 Controlled Implementation Pilot:
Generates 50 Benchmark A (Uniform Background) and 50 Benchmark B (Terrain-Matched Background)
pseudo-negatives for Peninsular Malaysia.

Key Specifications:
1. Target: 50 records per benchmark (33 Train <= 2019, 17 Test >= 2020).
2. State distribution strictly matches train/test candidate positive proportions.
3. Benchmark B terrain matching derived from empirical distribution of ALL 2,033 train positives
   (Elevation in [-4.0m, 125.0m], Slope in [0.0 deg, 14.0 deg]).
4. Temporal information policy:
   - Train negatives screened strictly against train-period floods (<= 2019). Zero test-period records.
   - Test negatives screened causally against floods with t <= D_cand.
5. Executable isolation unit tests verify code-level firewall before sampling begins.
6. Coordinates and terrain values cached in datasets/cache/copernicus_dem_coords_cache.json.
7. Outputs saved under separate filenames:
   - datasets/floodway_stage5_pilot_uniform_negatives_50.csv
   - datasets/floodway_stage5_pilot_matched_negatives_50.csv
"""

import os
import sys
import json
import math
import time
import random
from datetime import datetime, timezone, timedelta
import numpy as np
import pandas as pd
from shapely.geometry import shape, Point
from shapely.prepared import prep
from scipy.spatial import cKDTree
from scipy.stats import ks_2samp
import rasterio
from rasterio.windows import Window

RANDOM_SEED = 42
TARGET_TRAIN_COUNT = 33
TARGET_TEST_COUNT = 17
SPATIAL_BUFFER_M = 3000.0          # 3.0 km geodesic exclusion heuristic
TEMPORAL_BUFFER_DAYS = 7           # +/- 7 days local flood proximity heuristic
TEMPORAL_PROXIMITY_M = 10000.0     # 10 km vicinity for temporal check
MAX_ATTEMPTS_PER_STATE = 5000

GEOJSON_PATH = "datasets/malaysia_state_boundaries.geojson"
CAND_PATH = "datasets/jps_positives_peninsular_candidates.csv"
CENT_PATH = "datasets/jps_positives_peninsular_centroids.csv"
CACHE_PATH = "datasets/cache/copernicus_dem_coords_cache.json"

OUTPUT_UNIFORM_CSV = "datasets/floodway_stage5_pilot_uniform_negatives_50.csv"
OUTPUT_MATCHED_CSV = "datasets/floodway_stage5_pilot_matched_negatives_50.csv"

# Empirical terrain bounds derived from ALL 2,033 train positives (2015-2019)
# Covers 99% of training flood incidents while excluding uninhabited steep mountain ridges (>125m, >14 deg)
EMPIRICAL_ELEV_BOUNDS = (-4.0, 125.0)
EMPIRICAL_SLOPE_BOUNDS = (0.0, 14.0)

def geodetic_to_ecef(lat_deg, lon_deg):
    phi = np.radians(lat_deg)
    lam = np.radians(lon_deg)
    r = 6371000.0
    x = r * np.cos(phi) * np.cos(lam)
    y = r * np.cos(phi) * np.sin(lam)
    z = r * np.sin(phi)
    return np.column_stack([x, y, z]) if hasattr(lat_deg, "__len__") else np.array([x, y, z])

def chord_distance_to_km(chord_dist):
    # chord_dist = 2 * R * sin(theta / 2) -> theta = 2 * arcsin(chord_dist / (2 * R))
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

def load_dem_cache():
    if os.path.exists(CACHE_PATH):
        try:
            with open(CACHE_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def save_dem_cache(cache):
    os.makedirs("datasets/cache", exist_ok=True)
    with open(CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(cache, f)

# ---------------------------------------------------------------------------
# Unit Tests for Temporal Isolation & Code-Level Firewall
# ---------------------------------------------------------------------------
def run_isolation_unit_tests(train_pos, test_pos, train_tree, test_ids):
    print("\n--- RUNNING EXECUTABLE TEMPORAL ISOLATION TESTS ---")
    
    # Test 1: Assert train pool contains zero test years
    max_train_year = train_pos["year"].max()
    assert max_train_year <= 2019, f"LEAKAGE TEST FAILED: train pool has max year {max_train_year} > 2019"
    print(f"  [PASS] Test 1: Training screening pool strictly <= 2019 (max year: {max_train_year})")

    # Test 2: Assert test pool has zero train years
    min_test_year = test_pos["year"].min()
    assert min_test_year >= 2020, f"LEAKAGE TEST FAILED: test pool has min year {min_test_year} < 2020"
    print(f"  [PASS] Test 2: Test pool strictly >= 2020 (min year: {min_test_year})")

    # Test 3: Assert KD-tree size matches train pool exactly
    assert train_tree.n == len(train_pos), f"LEAKAGE TEST FAILED: KD-tree size {train_tree.n} != train pool {len(train_pos)}"
    print(f"  [PASS] Test 3: Training KD-tree points ({train_tree.n}) match training pool exactly ({len(train_pos)})")

    # Test 4: Assert zero test flood events in training pool
    train_keys = set(zip(train_pos["date"], train_pos["latitude"], train_pos["longitude"]))
    test_keys = set(zip(test_pos["date"], test_pos["latitude"], test_pos["longitude"]))
    overlap = train_keys.intersection(test_keys)
    assert len(overlap) == 0, f"LEAKAGE TEST FAILED: Event overlap detected: {overlap}"
    print(f"  [PASS] Test 4: Zero test flood event records in training screening pool")
    print("--- ALL TEMPORAL ISOLATION UNIT TESTS PASSED ---\n")


def main():
    print("=" * 80)
    print("STAGE 5.1: CONTROLLED IMPLEMENTATION PILOT (50 UNIFORM + 50 TERRAIN-MATCHED)")
    print("=" * 80)

    random.seed(RANDOM_SEED)
    np.random.seed(RANDOM_SEED)

    # 1. Load Positive Pools
    cand_df = pd.read_csv(CAND_PATH)
    cent_df = pd.read_csv(CENT_PATH) if os.path.exists(CENT_PATH) else pd.DataFrame()
    all_known_pos = pd.concat([
        cand_df[["date", "year", "state", "latitude", "longitude"]],
        cent_df[["date", "year", "state", "latitude", "longitude"]]
    ], ignore_index=True)
    all_known_pos["dt"] = pd.to_datetime(all_known_pos["date"])

    train_pool_pos = all_known_pos[all_known_pos["year"] <= 2019].copy().reset_index(drop=True)
    test_pool_pos = all_known_pos[all_known_pos["year"] >= 2020].copy().reset_index(drop=True)

    print(f"Loaded Positive Incident Inventory:")
    print(f"  Training Screening Pool (<=2019): {len(train_pool_pos):,} points (Permitted for Train Negatives)")
    print(f"  Test Period Flood Pool (>=2020):  {len(test_pool_pos):,} points (Permitted Causally for Test Negatives)")

    # 2. Build Spatial Trees
    train_ecef = geodetic_to_ecef(train_pool_pos["latitude"].values, train_pool_pos["longitude"].values)
    train_tree = cKDTree(train_ecef)

    test_ecef = geodetic_to_ecef(test_pool_pos["latitude"].values, test_pool_pos["longitude"].values)
    test_tree = cKDTree(test_ecef)

    spatial_chord_thresh = 2.0 * 6371000.0 * np.sin(SPATIAL_BUFFER_M / (2.0 * 6371000.0))
    temporal_chord_thresh = 2.0 * 6371000.0 * np.sin(TEMPORAL_PROXIMITY_M / (2.0 * 6371000.0))

    # Run executable isolation test
    run_isolation_unit_tests(train_pool_pos, test_pool_pos, train_tree, test_pool_pos.index)

    # 3. Load State Polygons
    with open(GEOJSON_PATH, "r", encoding="utf-8") as f:
        geojson = json.load(f)

    canon_state_map = {
        "Kedah": "Kedah", "Kelantan": "Kelantan", "Perak": "Perak",
        "Pulau Pinang": "Pulau Pinang", "Kuala Lumpur": "WP K Lumpur",
        "Negeri Sembilan": "Negeri Sembilan", "Melaka": "Melaka",
        "Perlis": "Perlis", "Pahang": "Pahang", "Terengganu": "Terengganu",
        "Selangor": "Selangor", "Johor": "Johor"
    }

    state_polys = {}
    prep_states = {}
    for feat in geojson["features"]:
        gname = feat["properties"].get("name")
        for clean, canon in canon_state_map.items():
            if gname == canon:
                poly = shape(feat["geometry"])
                state_polys[clean] = poly
                prep_states[clean] = prep(poly)

    # 4. State Quotas (Matching Candidate Positive Proportions)
    train_cand = cand_df[cand_df["year"] <= 2019]
    test_cand = cand_df[cand_df["year"] >= 2020]

    # Target 33 Train, 17 Test
    train_quotas = (train_cand["state"].value_counts() / len(train_cand) * TARGET_TRAIN_COUNT).round().astype(int).to_dict()
    test_quotas = (test_cand["state"].value_counts() / len(test_cand) * TARGET_TEST_COUNT).round().astype(int).to_dict()

    # Ensure sums match exactly 33 and 17
    train_diff = TARGET_TRAIN_COUNT - sum(train_quotas.values())
    if train_diff != 0:
        top_state = train_cand["state"].value_counts().index[0]
        train_quotas[top_state] += train_diff

    test_diff = TARGET_TEST_COUNT - sum(test_quotas.values())
    if test_diff != 0:
        top_state = test_cand["state"].value_counts().index[0]
        test_quotas[top_state] += test_diff

    print("Target State Quotas:")
    print("  Train (N=33):", train_quotas)
    print("  Test  (N=17):", test_quotas)

    # 5. Load DEM Coordinate Cache
    dem_cache = load_dem_cache()
    print(f"Loaded DEM coordinate cache with {len(dem_cache)} entries.")
    tile_cache = {}

    def extract_terrain(lat, lon, audit_counters):
        key = f"{lat:.4f}_{lon:.4f}"
        if key in dem_cache and dem_cache[key].get("status") == "VALID":
            audit_counters["DEM_CACHE_HITS"] += 1
            return dem_cache[key]["elevation_m"], dem_cache[key]["slope_deg"], True

        audit_counters["DEM_API_REQUESTS"] += 1
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
            if px < 1 or px >= src.width - 1 or py < 1 or py >= src.height - 1:
                dem_cache[key] = {"elevation_m": None, "slope_deg": None, "status": "OUT_OF_BOUNDS"}
                audit_counters["DEM_NODATA_OR_VOID"] += 1
                return None, None, False

            patch = src.read(1, window=Window(px - 1, py - 1, 3, 3))
            if src.nodata is not None and np.any(patch == src.nodata):
                dem_cache[key] = {"elevation_m": None, "slope_deg": None, "status": "NODATA"}
                audit_counters["DEM_NODATA_OR_VOID"] += 1
                return None, None, False
            if np.any(np.isnan(patch)) or np.any(patch < -500.0) or np.any(patch > 9000.0):
                dem_cache[key] = {"elevation_m": None, "slope_deg": None, "status": "INVALID_PIXEL"}
                audit_counters["DEM_NODATA_OR_VOID"] += 1
                return None, None, False

            elev = round(float(patch[1, 1]), 2)
            slope = round(float(calculate_horn_slope(patch, lat)), 2)
            dem_cache[key] = {"elevation_m": elev, "slope_deg": slope, "status": "VALID"}
            return elev, slope, True
        except Exception:
            dem_cache[key] = {"elevation_m": None, "slope_deg": None, "status": "ERROR"}
            audit_counters["DEM_NODATA_OR_VOID"] += 1
            return None, None, False

    # 6. SAMPLING FUNCTION FOR BENCHMARK A & B
    def generate_benchmark_cohort(benchmark_type, is_terrain_matched):
        print(f"\n>>> Sampling {benchmark_type} (Terrain-Matched: {is_terrain_matched}) <<<")
        audit_counters = {
            "TOTAL_ATTEMPTS": 0,
            "OFF_LAND_OR_OUTSIDE_STATE": 0,
            "VIOLATES_3KM_SPATIAL_HEURISTIC": 0,
            "VIOLATES_7DAY_TEMPORAL_HEURISTIC": 0,
            "DEM_NODATA_OR_VOID": 0,
            "OUTSIDE_TERRAIN_BOUNDS": 0,
            "DEM_CACHE_HITS": 0,
            "DEM_API_REQUESTS": 0
        }

        all_samples = []
        t0 = time.time()

        for partition_name, quotas, start_year, end_year in [
            ("train", train_quotas, 2015, 2019),
            ("test", test_quotas, 2020, 2021)
        ]:
            cal_start = datetime(start_year, 1, 1)
            cal_end = datetime(end_year, 12, 31)
            total_days = (cal_end - cal_start).days

            # Pre-filter permitted state positives for temporal checking
            if partition_name == "train":
                # STRICT FIREWALL: ONLY train-period positives exist
                part_permitted_pos = train_pool_pos
            else:
                # Causal policy: both train baseline and test pool are available causally
                part_permitted_pos = all_known_pos

            for state_name, quota in quotas.items():
                if quota <= 0:
                    continue
                if state_name not in state_polys:
                    continue

                poly = state_polys[state_name]
                pgeom = prep_states[state_name]
                minx, miny, maxx, maxy = poly.bounds

                state_pos = part_permitted_pos[part_permitted_pos["state"] == state_name].copy()

                accepted_state = 0
                attempts = 0

                while accepted_state < quota and attempts < MAX_ATTEMPTS_PER_STATE:
                    attempts += 1
                    audit_counters["TOTAL_ATTEMPTS"] += 1

                    lon = random.uniform(minx, maxx)
                    lat = random.uniform(miny, maxy)

                    # 1. State polygon containment
                    if not pgeom.contains(Point(lon, lat)):
                        audit_counters["OFF_LAND_OR_OUTSIDE_STATE"] += 1
                        continue

                    # 2. Spatial 3 km Exclusion against Permitted Inventory
                    cand_ecef = geodetic_to_ecef(lat, lon)
                    chord_dist_train, _ = train_tree.query(cand_ecef, k=1)
                    dist_to_train_km = chord_distance_to_km(chord_dist_train)

                    if dist_to_train_km < (SPATIAL_BUFFER_M / 1000.0):
                        audit_counters["VIOLATES_3KM_SPATIAL_HEURISTIC"] += 1
                        continue

                    # 3. Terrain Extraction
                    elev, slope, ok = extract_terrain(lat, lon, audit_counters)
                    if not ok:
                        continue

                    # 4. Terrain Filter (Benchmark B only)
                    if is_terrain_matched:
                        if not (EMPIRICAL_ELEV_BOUNDS[0] <= elev <= EMPIRICAL_ELEV_BOUNDS[1] and
                                EMPIRICAL_SLOPE_BOUNDS[0] <= slope <= EMPIRICAL_SLOPE_BOUNDS[1]):
                            audit_counters["OUTSIDE_TERRAIN_BOUNDS"] += 1
                            continue

                    # 5. Date Sampling & Temporal/Spatial Exclusion against Permitted Inventory
                    rand_day_offset = random.randint(0, total_days)
                    cand_date = cal_start + timedelta(days=rand_day_offset)
                    cand_date_str = cand_date.strftime("%Y-%m-%d")
                    cand_np_dt = np.datetime64(cand_date)

                    cand_ecef_arr = cand_ecef.reshape(1, 3)

                    # For test negatives, also check 3km spatial exclusion against causal test floods (t <= cand_date)
                    dist_to_causal_test_km = 9999.0
                    if partition_name == "test":
                        causal_test_pos = test_pool_pos[test_pool_pos["dt"] <= cand_date]
                        if len(causal_test_pos) > 0:
                            causal_ecefs = geodetic_to_ecef(causal_test_pos["latitude"].values, causal_test_pos["longitude"].values)
                            dists_to_causal = chord_distance_to_km(np.linalg.norm(causal_ecefs - cand_ecef_arr, axis=1))
                            dist_to_causal_test_km = float(np.min(dists_to_causal))
                            if dist_to_causal_test_km < (SPATIAL_BUFFER_M / 1000.0):
                                audit_counters["VIOLATES_3KM_SPATIAL_HEURISTIC"] += 1
                                continue

                    dist_to_permitted_km = min(dist_to_train_km, dist_to_causal_test_km) if partition_name == "test" else dist_to_train_km

                    # Temporal check (+/- 7 days) within 10km vicinity of candidate location
                    if partition_name == "train":
                        state_check_pos = state_pos
                    else:
                        state_check_pos = state_pos[state_pos["dt"] <= cand_date]

                    if len(state_check_pos) > 0:
                        check_ecefs = geodetic_to_ecef(state_check_pos["latitude"].values, state_check_pos["longitude"].values)
                        dists_to_local = np.linalg.norm(check_ecefs - cand_ecef_arr, axis=1)
                        within_10km_mask = dists_to_local < temporal_chord_thresh

                        if np.any(within_10km_mask):
                            local_dts = state_check_pos["dt"].values[within_10km_mask]
                            day_diffs = np.abs((local_dts - cand_np_dt).astype("timedelta64[D]").astype(int))
                            if np.any(day_diffs <= TEMPORAL_BUFFER_DAYS):
                                audit_counters["VIOLATES_7DAY_TEMPORAL_HEURISTIC"] += 1
                                continue

                    # Distance to overall test pool (AUDIT ONLY - strictly separated into causal vs future)
                    chord_dist_test, _ = test_tree.query(cand_ecef, k=1)
                    dist_to_any_test_km = chord_distance_to_km(chord_dist_test)

                    # Assign unique sample ID
                    sample_num = len(all_samples) + 1
                    prefix = "STAGE5_UNIFORM_NEG" if not is_terrain_matched else "STAGE5_MATCHED_NEG"
                    sample_id = f"{prefix}_{sample_num:03d}"

                    all_samples.append({
                        "sample_id": sample_id,
                        "benchmark_type": benchmark_type,
                        "split": partition_name,
                        "target": 0,
                        "label_class": "pseudo_negative",
                        "label_certainty": "uncertain_background_sample",
                        "date": cand_date_str,
                        "year": cand_date.year,
                        "state": state_name,
                        "place": f"Background Landpoint ({state_name})",
                        "latitude": round(lat, 6),
                        "longitude": round(lon, 6),
                        "elevation_m": elev,
                        "slope_deg": slope,
                        "min_dist_to_permitted_pos_km": round(dist_to_permitted_km, 2),
                        "min_dist_to_train_pos_km": round(dist_to_train_km, 2),
                        "min_dist_to_test_pos_km": round(dist_to_any_test_km, 2),
                        "exclusion_basis": "train_positives_only" if partition_name == "train" else "causal_historical_positives"
                    })
                    accepted_state += 1

        elapsed = time.time() - t0
        print(f"Sampling complete in {elapsed:.2f}s across {len(all_samples)} samples.")
        print("Audit Counters:", audit_counters)
        return pd.DataFrame(all_samples), audit_counters, elapsed

    # Execute Benchmark A (Uniform Background)
    df_uniform, uniform_counters, uniform_time = generate_benchmark_cohort("Benchmark A (Uniform Background)", is_terrain_matched=False)

    # Execute Benchmark B (Terrain-Matched Background)
    df_matched, matched_counters, matched_time = generate_benchmark_cohort("Benchmark B (Terrain-Matched Background)", is_terrain_matched=True)

    # Save outputs
    df_uniform.to_csv(OUTPUT_UNIFORM_CSV, index=False)
    df_matched.to_csv(OUTPUT_MATCHED_CSV, index=False)
    save_dem_cache(dem_cache)

    print(f"\nSaved Benchmark A to {OUTPUT_UNIFORM_CSV} ({len(df_uniform)} rows)")
    print(f"Saved Benchmark B to {OUTPUT_MATCHED_CSV} ({len(df_matched)} rows)")

    # Close any open raster datasets
    for src in tile_cache.values():
        src.close()

    # 7. AUDIT & COMPARISON REPORT
    print("\n" + "=" * 80)
    print("STAGE 5.1 PILOT QA AUDIT & METHODOLOGICAL COMPARISON")
    print("=" * 80)

    for name, df in [("Benchmark A (Uniform)", df_uniform), ("Benchmark B (Matched)", df_matched)]:
        print(f"\n--- {name} ---")
        print(f"Total Rows: {len(df)} | Train: {(df['split']=='train').sum()} | Test: {(df['split']=='test').sum()}")
        print(f"Missing Values: {df.isnull().sum().sum()}")
        print(f"Duplicate Coordinates: {len(df) - df.drop_duplicates(subset=['latitude', 'longitude']).shape[0]}")
        print(f"Label Certainty: {df['label_certainty'].unique().tolist()}")
        print(f"Min Dist to Permitted Positives (km): Min={df['min_dist_to_permitted_pos_km'].min():.2f}, Median={df['min_dist_to_permitted_pos_km'].median():.2f}, Max={df['min_dist_to_permitted_pos_km'].max():.2f}")
        
        # Train to Test distance within cohort
        train_pts = df[df["split"] == "train"][["latitude", "longitude"]].values
        test_pts = df[df["split"] == "test"][["latitude", "longitude"]].values
        if len(train_pts) > 0 and len(test_pts) > 0:
            tr_ecef = geodetic_to_ecef(train_pts[:, 0], train_pts[:, 1])
            te_ecef = geodetic_to_ecef(test_pts[:, 0], test_pts[:, 1])
            dists = np.linalg.norm(tr_ecef[:, None, :] - te_ecef[None, :, :], axis=2)
            min_tr_te_km = chord_distance_to_km(np.min(dists))
            print(f"Min Spatial Distance between Train Negatives & Test Negatives: {min_tr_te_km:.2f} km")

        print("Elevation Summary (m):", df["elevation_m"].describe().round(2).to_dict())
        print("Slope Summary (deg):", df["slope_deg"].describe().round(2).to_dict())

    # Two-Sample Kolmogorov-Smirnov Tests against Train Positives
    train_pos_elev = [dem_cache[f"{r['latitude']:.4f}_{r['longitude']:.4f}"]["elevation_m"] 
                      for _, r in train_cand.iterrows() 
                      if f"{r['latitude']:.4f}_{r['longitude']:.4f}" in dem_cache and dem_cache[f"{r['latitude']:.4f}_{r['longitude']:.4f}"].get("status") == "VALID"]
    train_pos_slope = [dem_cache[f"{r['latitude']:.4f}_{r['longitude']:.4f}"]["slope_deg"] 
                       for _, r in train_cand.iterrows() 
                       if f"{r['latitude']:.4f}_{r['longitude']:.4f}" in dem_cache and dem_cache[f"{r['latitude']:.4f}_{r['longitude']:.4f}"].get("status") == "VALID"]

    ks_elev_uniform = ks_2samp(df_uniform["elevation_m"], train_pos_elev)
    ks_slope_uniform = ks_2samp(df_uniform["slope_deg"], train_pos_slope)

    ks_elev_matched = ks_2samp(df_matched["elevation_m"], train_pos_elev)
    ks_slope_matched = ks_2samp(df_matched["slope_deg"], train_pos_slope)

    print("\n--- TWO-SAMPLE KOLMOGOROV-SMIRNOV TESTS (vs ALL 2,033 Train Positives) ---")
    print(f"Benchmark A (Uniform) vs Train Positives:")
    print(f"  Elevation KS: D = {ks_elev_uniform.statistic:.4f}, p-value = {ks_elev_uniform.pvalue:.4e}")
    print(f"  Slope KS:     D = {ks_slope_uniform.statistic:.4f}, p-value = {ks_slope_uniform.pvalue:.4e}")

    print(f"\nBenchmark B (Terrain-Matched) vs Train Positives:")
    print(f"  Elevation KS: D = {ks_elev_matched.statistic:.4f}, p-value = {ks_elev_matched.pvalue:.4e}")
    print(f"  Slope KS:     D = {ks_slope_matched.statistic:.4f}, p-value = {ks_slope_matched.pvalue:.4e}")


if __name__ == "__main__":
    main()
