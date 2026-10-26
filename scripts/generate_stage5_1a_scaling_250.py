"""
scripts/generate_stage5_1a_scaling_250.py

FloodWay Stage 5.1A: Controlled Scaling to 250 Pseudo-Negatives per Benchmark.
Total: 500 pseudo-negatives (250 Benchmark A: Uniform, 250 Benchmark B: Terrain-Restricted).

Specifications & Safeguards:
1. Target: Exactly 165 Train (<= 2019) and 85 Test (>= 2020) per benchmark.
2. Programmatic state quotas via largest-remainder method from candidate positive frequencies.
3. Temporal information policy:
   - Train negatives strictly screened against pre-2020 floods. Test records inaccessible.
   - Test negatives screened causally against permitted inventory (train floods + test floods with t <= D_cand).
4. Code-level unit tests verify isolation before sampling begins.
5. Benchmark A: Uniform random sampling over state land polygons.
6. Benchmark B: Terrain-restricted sampling using training-derived empirical bounds
   ([-4.0m, 125.0m] elevation, [0.0 deg, 14.0 deg] slope).
7. Coordinate-level caching and atomic checkpointing every 50 records.
8. Post-generation QA auditing quotas, missing values, duplicates, and proximity.
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
TARGET_TRAIN_COUNT = 165
TARGET_TEST_COUNT = 85
TOTAL_BENCHMARK_COUNT = 250

SPATIAL_BUFFER_M = 3000.0          # 3.0 km geodesic exclusion heuristic
TEMPORAL_BUFFER_DAYS = 7           # +/- 7 days local flood proximity heuristic
TEMPORAL_PROXIMITY_M = 10000.0     # 10 km vicinity for temporal check
MAX_ATTEMPTS_PER_STATE = 10000

GEOJSON_PATH = "datasets/malaysia_state_boundaries.geojson"
CAND_PATH = "datasets/jps_positives_peninsular_candidates.csv"
CENT_PATH = "datasets/jps_positives_peninsular_centroids.csv"
CACHE_PATH = "datasets/cache/copernicus_dem_coords_cache.json"

CHECKPOINT_DIR = "datasets/checkpoints"
os.makedirs(CHECKPOINT_DIR, exist_ok=True)

OUTPUT_UNIFORM_CSV = "datasets/floodway_stage5_1a_uniform_negatives_250.csv"
OUTPUT_MATCHED_CSV = "datasets/floodway_stage5_1a_matched_negatives_250.csv"

# Empirical terrain bounds derived from ALL 2,033 train positives (2015-2019)
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

def allocate_quotas(subset, total):
    freqs = subset["state"].value_counts()
    exact_shares = freqs / len(subset) * total
    base = exact_shares.astype(int)
    remainders = exact_shares - base
    deficit = total - base.sum()
    for s in remainders.sort_values(ascending=False).index[:deficit]:
        base[s] += 1
    return base.to_dict()

# ---------------------------------------------------------------------------
# Unit Tests for Temporal Isolation & Code-Level Firewall
# ---------------------------------------------------------------------------
def run_isolation_unit_tests(train_pos, test_pos, train_tree):
    print("\n--- RUNNING EXECUTABLE TEMPORAL ISOLATION TESTS ---")
    
    max_train_year = train_pos["year"].max()
    assert max_train_year <= 2019, f"LEAKAGE TEST FAILED: train pool has max year {max_train_year} > 2019"
    print(f"  [PASS] Test 1: Training screening pool strictly <= 2019 (max year: {max_train_year})")

    min_test_year = test_pos["year"].min()
    assert min_test_year >= 2020, f"LEAKAGE TEST FAILED: test pool has min year {min_test_year} < 2020"
    print(f"  [PASS] Test 2: Test pool strictly >= 2020 (min year: {min_test_year})")

    assert train_tree.n == len(train_pos), f"LEAKAGE TEST FAILED: KD-tree size {train_tree.n} != train pool {len(train_pos)}"
    print(f"  [PASS] Test 3: Training KD-tree points ({train_tree.n}) match training pool exactly ({len(train_pos)})")

    train_keys = set(zip(train_pos["date"], train_pos["latitude"], train_pos["longitude"]))
    test_keys = set(zip(test_pos["date"], test_pos["latitude"], test_pos["longitude"]))
    overlap = train_keys.intersection(test_keys)
    assert len(overlap) == 0, f"LEAKAGE TEST FAILED: Event overlap detected: {overlap}"
    print(f"  [PASS] Test 4: Zero test flood event records in training screening pool")
    print("--- ALL TEMPORAL ISOLATION UNIT TESTS PASSED ---\n")


def main():
    print("=" * 80)
    print("STAGE 5.1A: CONTROLLED SCALING (250 UNIFORM + 250 TERRAIN-RESTRICTED)")
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

    # Run isolation test
    run_isolation_unit_tests(train_pool_pos, test_pool_pos, train_tree)

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

    # 4. Programmatic State Quotas
    train_cand = cand_df[cand_df["year"] <= 2019]
    test_cand = cand_df[cand_df["year"] >= 2020]

    train_quotas = allocate_quotas(train_cand, TARGET_TRAIN_COUNT)
    test_quotas = allocate_quotas(test_cand, TARGET_TEST_COUNT)

    print("Programmatically Allocated State Quotas:")
    print(f"  Train (N={sum(train_quotas.values())}):", train_quotas)
    print(f"  Test  (N={sum(test_quotas.values())}):", test_quotas)
    assert sum(train_quotas.values()) == TARGET_TRAIN_COUNT, f"Train sum {sum(train_quotas.values())} != {TARGET_TRAIN_COUNT}"
    assert sum(test_quotas.values()) == TARGET_TEST_COUNT, f"Test sum {sum(test_quotas.values())} != {TARGET_TEST_COUNT}"

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

    # 6. SAMPLING FUNCTION FOR STAGE 5.1A
    def generate_benchmark_cohort(benchmark_type, is_terrain_restricted, checkpoint_file):
        print(f"\n>>> Sampling {benchmark_type} (Target: {TOTAL_BENCHMARK_COUNT}) <<<")
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

            # Strict Information Firewall
            if partition_name == "train":
                part_permitted_pos = train_pool_pos
            else:
                part_permitted_pos = all_known_pos

            for state_name, quota in quotas.items():
                if quota <= 0:
                    continue
                if state_name not in state_polys:
                    raise KeyError(f"Missing polygon geometry for state: {state_name}")

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

                    # 2. Spatial 3 km Exclusion against Permitted Historical Training Pool
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

                    # 4. Terrain Restriction (Benchmark B only)
                    if is_terrain_restricted:
                        if not (EMPIRICAL_ELEV_BOUNDS[0] <= elev <= EMPIRICAL_ELEV_BOUNDS[1] and
                                EMPIRICAL_SLOPE_BOUNDS[0] <= slope <= EMPIRICAL_SLOPE_BOUNDS[1]):
                            audit_counters["OUTSIDE_TERRAIN_BOUNDS"] += 1
                            continue

                    # 5. Date Sampling & Temporal Exclusion Check
                    rand_day_offset = random.randint(0, total_days)
                    cand_date = cal_start + timedelta(days=rand_day_offset)
                    cand_date_str = cand_date.strftime("%Y-%m-%d")
                    cand_np_dt = np.datetime64(cand_date)

                    cand_ecef_arr = cand_ecef.reshape(1, 3)

                    # For test negatives, check 3km spatial exclusion against causal test floods (t <= cand_date)
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

                    # Distance to overall test pool (AUDIT ONLY - NEVER USED FOR REJECTION)
                    chord_dist_test, _ = test_tree.query(cand_ecef, k=1)
                    dist_to_any_test_km = chord_distance_to_km(chord_dist_test)

                    # Assign unique sample ID
                    sample_num = len(all_samples) + 1
                    prefix = "STAGE5_1A_UNIFORM_NEG" if not is_terrain_restricted else "STAGE5_1A_MATCHED_NEG"
                    sample_id = f"{prefix}_{sample_num:03d}"

                    sample_record = {
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
                    }
                    all_samples.append(sample_record)
                    accepted_state += 1

                    # Checkpoint every 50 samples
                    if len(all_samples) % 50 == 0:
                        pd.DataFrame(all_samples).to_csv(checkpoint_file, index=False)
                        save_dem_cache(dem_cache)

                if accepted_state < quota:
                    raise RuntimeError(f"FAILED TO FULFILL QUOTA for state {state_name} ({partition_name}): accepted {accepted_state}/{quota} after {attempts} attempts. Constraints NOT silently relaxed.")

        elapsed = time.time() - t0
        print(f"Sampling complete in {elapsed:.2f}s across {len(all_samples)} samples.")
        print("Audit Counters:", audit_counters)
        return pd.DataFrame(all_samples), audit_counters, elapsed

    # Execute Benchmark A
    cp_uniform = os.path.join(CHECKPOINT_DIR, "stage5_1a_checkpoint_uniform_250.csv")
    df_uniform, uniform_counters, uniform_time = generate_benchmark_cohort(
        "Benchmark A (Uniform Background)", is_terrain_restricted=False, checkpoint_file=cp_uniform
    )

    # Execute Benchmark B
    cp_matched = os.path.join(CHECKPOINT_DIR, "stage5_1a_checkpoint_matched_250.csv")
    df_matched, matched_counters, matched_time = generate_benchmark_cohort(
        "Benchmark B (Terrain-Restricted Background)", is_terrain_restricted=True, checkpoint_file=cp_matched
    )

    # Save final datasets
    df_uniform.to_csv(OUTPUT_UNIFORM_CSV, index=False)
    df_matched.to_csv(OUTPUT_MATCHED_CSV, index=False)
    save_dem_cache(dem_cache)

    print(f"\nFinal export successful:")
    print(f"  Benchmark A saved to: {OUTPUT_UNIFORM_CSV} ({len(df_uniform)} rows)")
    print(f"  Benchmark B saved to: {OUTPUT_MATCHED_CSV} ({len(df_matched)} rows)")

    # Close DEM raster connections
    for src in tile_cache.values():
        src.close()

    # 7. POST-GENERATION QA REPORT
    print("\n" + "=" * 80)
    print("STAGE 5.1A COMPREHENSIVE QA AUDIT REPORT")
    print("=" * 80)

    for name, df in [("Benchmark A (Uniform)", df_uniform), ("Benchmark B (Terrain-Restricted)", df_matched)]:
        print(f"\n--- QA Check: {name} ---")
        n_train = (df["split"] == "train").sum()
        n_test = (df["split"] == "test").sum()
        print(f"  Sample Counts: Total={len(df)} | Train={n_train} (Target: 165) | Test={n_test} (Target: 85)")
        assert len(df) == 250, f"Total count {len(df)} != 250"
        assert n_train == 165, f"Train count {n_train} != 165"
        assert n_test == 85, f"Test count {n_test} != 85"
        print("  [PASS] Sample count and train/test partition verified.")

        # Check missing values
        missing_count = df.isnull().sum().sum()
        print(f"  Missing Values: {missing_count}")
        assert missing_count == 0, f"Found {missing_count} missing values"
        print("  [PASS] Zero missing values.")

        # Check duplicate coordinates
        dup_count = len(df) - df.drop_duplicates(subset=["latitude", "longitude"]).shape[0]
        print(f"  Duplicate Coordinates: {dup_count}")
        assert dup_count == 0, f"Found {dup_count} duplicate coordinates"
        print("  [PASS] Zero duplicate coordinates.")

        # Check spatial buffer against permitted inventory
        min_permitted_dist = df["min_dist_to_permitted_pos_km"].min()
        print(f"  Min Distance to Permitted Positives: {min_permitted_dist:.2f} km")
        assert min_permitted_dist >= 3.0, f"Buffer violation: {min_permitted_dist:.2f} km < 3.0 km"
        print("  [PASS] All points strictly >= 3.0 km from permitted positive inventory.")

        # Check state quotas
        train_actual = df[df["split"] == "train"]["state"].value_counts().to_dict()
        test_actual = df[df["split"] == "test"]["state"].value_counts().to_dict()
        for s, q in train_quotas.items():
            act = train_actual.get(s, 0)
            assert act == q, f"Train quota mismatch for {s}: expected {q}, got {act}"
        for s, q in test_quotas.items():
            act = test_actual.get(s, 0)
            assert act == q, f"Test quota mismatch for {s}: expected {q}, got {act}"
        print("  [PASS] All 12 state quotas perfectly matched.")

        # Proximity of test observations to training negatives
        tr_df = df[df["split"] == "train"]
        te_df = df[df["split"] == "test"]
        tr_ecef = geodetic_to_ecef(tr_df["latitude"].values, tr_df["longitude"].values)
        te_ecef = geodetic_to_ecef(te_df["latitude"].values, te_df["longitude"].values)
        tr_tree = cKDTree(tr_ecef)
        chord_dists, _ = tr_tree.query(te_ecef, k=1)
        te_dists_km = chord_distance_to_km(chord_dists)

        n_under_1 = (te_dists_km < 1.0).sum()
        n_under_3 = (te_dists_km < 3.0).sum()
        n_under_10 = (te_dists_km < 10.0).sum()
        print(f"  Test Observation Spatial Proximity to Nearest Training Negative (N_test = 85):")
        print(f"    Nearest Train Distance: Min={np.min(te_dists_km):.2f} km, Median={np.median(te_dists_km):.2f} km, Max={np.max(te_dists_km):.2f} km")
        print(f"    Test observations within < 1.0 km:  {n_under_1:2d} / 85 ({n_under_1/85*100:4.1f}%)")
        print(f"    Test observations within < 3.0 km:  {n_under_3:2d} / 85 ({n_under_3/85*100:4.1f}%)")
        print(f"    Test observations within < 10.0 km: {n_under_10:2d} / 85 ({n_under_10/85*100:4.1f}%)")
        print(f"    Test observations >= 10.0 km:       {(te_dists_km >= 10.0).sum():2d} / 85 ({(te_dists_km >= 10.0).sum()/85*100:4.1f}%)")

        print("  Elevation Summary (m):", df["elevation_m"].describe().round(2).to_dict())
        print("  Slope Summary (deg):", df["slope_deg"].describe().round(2).to_dict())


if __name__ == "__main__":
    main()
