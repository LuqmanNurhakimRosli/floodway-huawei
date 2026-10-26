"""
scripts/generate_terrain_matched_negatives_corrected.py

Phase 4C Leakage Correction:
Terrain-Matched Pseudo-Negative Background Sampling Pilot (Leak-Free)

Core Corrections:
1. Train Negative Information Firewall: Training pseudo-negatives (2015-2019) are screened
   STRICTLY against training-period flood records (<= 2019). Zero test-period (2020-2021)
   flood records are included in the spatial or temporal screening index.
2. Test Negative Information Policy: Test pseudo-negatives (2020-2021) are screened against the
   frozen historical training baseline (<= 2019) plus causal test-period floods known as of
   candidate date D (t <= D). No future test-period floods (t > D) are used.
3. Frozen Terrain Rules: Derived strictly from Train Positives (2015-2019) and frozen.
4. Preserves all previous outputs; writes to dedicated corrected files.
5. All non-positives labeled 'pseudo_negative' with 'uncertain_background_sample'.
"""

import os
import sys
import json
import math
import time
import random
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta
import numpy as np
import pandas as pd
from shapely.geometry import shape, Point
from shapely.prepared import prep
from scipy.spatial import cKDTree
from scipy.stats import ks_2samp

try:
    import rasterio
    from rasterio.windows import Window
except ImportError:
    print("[ERROR] rasterio is required. Install via pip install rasterio")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Configuration Parameters
# ---------------------------------------------------------------------------
RANDOM_SEED = 42
TARGET_TRAIN_COUNT = 13
TARGET_TEST_COUNT = 7
SPATIAL_BUFFER_M = 3000.0          # 3.0 km geodesic exclusion heuristic
TEMPORAL_BUFFER_DAYS = 7           # +/- 7 days local flood proximity heuristic
TEMPORAL_PROXIMITY_M = 10000.0     # 10 km vicinity for temporal check
MAX_ATTEMPTS_PER_STATE = 2000

INPUT_PILOT_PATH = "datasets/floodway_pilot_features_40.csv"
GEOJSON_PATH = "datasets/malaysia_state_boundaries.geojson"
OUTPUT_NEGATIVES_CORRECTED = "datasets/floodway_pilot_terrain_matched_negatives_20_corrected.csv"
OUTPUT_MATCHED_40_CORRECTED = "datasets/floodway_pilot_features_40_matched_corrected.csv"

CACHE_DIR = "datasets/cache"
CACHE_FILE = os.path.join(CACHE_DIR, "open_meteo_rainfall_cache.json")


def geodetic_to_ecef(lat_deg, lon_deg):
    phi = np.radians(lat_deg)
    lam = np.radians(lon_deg)
    r = 6371000.0
    x = r * np.cos(phi) * np.cos(lam)
    y = r * np.cos(phi) * np.sin(lam)
    z = r * np.sin(phi)
    return np.column_stack([x, y, z]) if hasattr(lat_deg, "__len__") else np.array([x, y, z])


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


def load_cache():
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def save_cache(cache):
    os.makedirs(CACHE_DIR, exist_ok=True)
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2)


def fetch_rainfall_features(lat, lon, target_date_str, cache):
    target_dt = datetime.strptime(target_date_str, "%Y-%m-%d")
    start_dt = target_dt - timedelta(days=7)
    start_date_str = start_dt.strftime("%Y-%m-%d")
    end_date_str = target_date_str

    cache_key = f"{lat:.4f}_{lon:.4f}_{start_date_str}_{end_date_str}_era5_Asia/Singapore"

    if cache_key in cache:
        payload = cache[cache_key]
    else:
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
            headers={"User-Agent": "FloodWay_Research_Benchmark/1.0 (Phase 4C Leakage Correction)"}
        )
        time.sleep(0.3)
        with urllib.request.urlopen(req, timeout=15) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
        cache[cache_key] = payload

    daily_times = payload["daily"]["time"]
    daily_vals = payload["daily"]["precipitation_sum"]

    expected_dates = [(target_dt - timedelta(days=d)).strftime("%Y-%m-%d") for d in range(7, -1, -1)]
    date_to_val = dict(zip(daily_times, daily_vals))
    window_vals = [date_to_val.get(d) for d in expected_dates]

    if any(v is None for v in window_vals):
        return np.nan, np.nan, np.nan, np.nan, True, "INCOMPLETE_SERIES_NONE"

    rain_1d_prior = round(float(window_vals[6]), 2)
    rain_3d_prior = round(float(sum(window_vals[4:7])), 2)
    rain_7d_prior = round(float(sum(window_vals[0:7])), 2)
    rain_event_day = round(float(window_vals[7]), 2)

    return rain_1d_prior, rain_3d_prior, rain_7d_prior, rain_event_day, False, "VALID_ERA5"


def main():
    print("=" * 75)
    print("FLOODWAY PHASE 4C: LEAK-FREE TERRAIN-MATCHED BACKGROUND PILOT")
    print("=" * 75)

    random.seed(RANDOM_SEED)
    np.random.seed(RANDOM_SEED)

    # 1. Load Original Pilot Positives & Derive Frozen Rules
    if not os.path.exists(INPUT_PILOT_PATH):
        raise FileNotFoundError(f"Missing {INPUT_PILOT_PATH}")

    pilot_40_df = pd.read_csv(INPUT_PILOT_PATH)
    pos_20_df = pilot_40_df[pilot_40_df["target"] == 1].copy()

    train_pos = pos_20_df[pos_20_df["split"] == "train"]
    test_pos = pos_20_df[pos_20_df["split"] == "test"]

    print(f"Loaded {len(pos_20_df)} Positives: {len(train_pos)} Train (<=2019), {len(test_pos)} Test (>=2020)")

    # FROZEN RULES DERIVED STRICTLY FROM TRAIN POSITIVES (2015-2019)
    elev_min_rule = float(train_pos["elevation_m"].min())
    elev_max_rule = float(train_pos["elevation_m"].max())
    slope_min_rule = float(train_pos["slope_deg"].min())
    slope_max_rule = float(train_pos["slope_deg"].max())

    print("\n[FROZEN EMPIRICAL MATCHING RULES (TRAIN POSITIVES N=13)]")
    print(f"  Elevation Rule: [{elev_min_rule:.2f} m, {elev_max_rule:.2f} m]")
    print(f"  Slope Rule:     [{slope_min_rule:.2f} deg, {slope_max_rule:.2f} deg]")

    # 2. State Quotas Matching Positives
    train_state_quotas = train_pos["state"].value_counts().to_dict()
    test_state_quotas = test_pos["state"].value_counts().to_dict()

    print(f"\nTrain State Quotas (Target={TARGET_TRAIN_COUNT}): {train_state_quotas}")
    print(f"Test State Quotas  (Target={TARGET_TEST_COUNT}):  {test_state_quotas}")

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

    # 4. Partition Positive Floods Temporally to Prevent Future Information Leakage
    cand_path = "datasets/jps_positives_peninsular_candidates.csv"
    cent_path = "datasets/jps_positives_peninsular_centroids.csv"
    cand_df = pd.read_csv(cand_path)
    cent_df = pd.read_csv(cent_path) if os.path.exists(cent_path) else pd.DataFrame()

    all_known_pos = pd.concat([
        cand_df[["date", "year", "state", "latitude", "longitude"]],
        cent_df[["date", "year", "state", "latitude", "longitude"]]
    ], ignore_index=True)
    all_known_pos["dt"] = pd.to_datetime(all_known_pos["date"])

    # Strict Partition Pools
    train_pool_pos = all_known_pos[all_known_pos["year"] <= 2019].copy().reset_index(drop=True)
    test_pool_pos = all_known_pos[all_known_pos["year"] >= 2020].copy().reset_index(drop=True)

    print(f"\nPositive Screening Pools:")
    print(f"  Training Screening Pool (<=2019): {len(train_pool_pos):,} points (TEST FLOODS STRICTLY EXCLUDED)")
    print(f"  Test Period Floods (>=2020):      {len(test_pool_pos):,} points (USED CAUSALLY ONLY)")

    # Spatial Trees
    train_ecef = geodetic_to_ecef(train_pool_pos["latitude"].values, train_pool_pos["longitude"].values)
    train_tree = cKDTree(train_ecef)

    spatial_chord_thresh = 2.0 * 6371000.0 * np.sin(SPATIAL_BUFFER_M / (2.0 * 6371000.0))
    temporal_chord_thresh = 2.0 * 6371000.0 * np.sin(TEMPORAL_PROXIMITY_M / (2.0 * 6371000.0))

    # Pre-parse test ECEF and datetimes for causal test filtering
    test_ecef = geodetic_to_ecef(test_pool_pos["latitude"].values, test_pool_pos["longitude"].values)
    test_dts = test_pool_pos["dt"].values

    # 5. Corrected Rejection Sampling Engine
    tile_cache = {}
    audit_counters = {
        "OFF_LAND_OR_OUTSIDE_STATE": 0,
        "VIOLATES_3KM_SPATIAL_HEURISTIC": 0,
        "VIOLATES_7DAY_TEMPORAL_HEURISTIC": 0,
        "TERRAIN_OUTSIDE_FROZEN_RULES": 0,
        "DEM_NODATA_OR_VOID": 0,
        "ACCEPTED": 0,
        "TOTAL_ATTEMPTS": 0
    }

    def sample_corrected_cohort(partition_name, quotas, start_year, end_year):
        samples = []
        cal_start = datetime(start_year, 1, 1)
        cal_end = datetime(end_year, 12, 31)
        total_days = (cal_end - cal_start).days

        # Pre-filter state positives for temporal checking
        if partition_name == "train":
            # For Train: ONLY train-period positives are accessible
            part_pos = train_pool_pos
        else:
            # For Test: both train baseline and test pool are available causally
            part_pos = all_known_pos

        for state_name, quota in quotas.items():
            if quota <= 0:
                continue
            if state_name not in state_polys:
                print(f"[ERROR] Missing boundary for state '{state_name}'. Cannot proceed safely.")
                sys.exit(1)

            pgeom = prep_states[state_name]
            poly = state_polys[state_name]
            minx, miny, maxx, maxy = poly.bounds

            state_part_pos = part_pos[part_pos["state"] == state_name].copy()
            state_pos_coords = state_part_pos[["latitude", "longitude"]].values
            state_pos_dts = state_part_pos["dt"].values

            accepted_state = 0
            attempts = 0

            while accepted_state < quota and attempts < MAX_ATTEMPTS_PER_STATE:
                attempts += 1
                audit_counters["TOTAL_ATTEMPTS"] += 1

                lon = random.uniform(minx, maxx)
                lat = random.uniform(miny, maxy)

                # Check 1: Land containment
                if not pgeom.contains(Point(lon, lat)):
                    audit_counters["OFF_LAND_OR_OUTSIDE_STATE"] += 1
                    continue

                # Check 2: Spatial 3 km Exclusion
                cand_ecef = geodetic_to_ecef(lat, lon)

                if partition_name == "train":
                    # TRAIN RULE: Check strictly against train_tree (<= 2019). Zero test-period floods!
                    chord_dist, _ = train_tree.query(cand_ecef, k=1)
                    if chord_dist < spatial_chord_thresh:
                        audit_counters["VIOLATES_3KM_SPATIAL_HEURISTIC"] += 1
                        continue
                else:
                    # TEST RULE: Check against historical train baseline (<=2019)
                    chord_dist, _ = train_tree.query(cand_ecef, k=1)
                    if chord_dist < spatial_chord_thresh:
                        audit_counters["VIOLATES_3KM_SPATIAL_HEURISTIC"] += 1
                        continue

                # Check 3: Terrain Extraction via COG Window
                northing = f"N{int(math.floor(lat)):02d}_00"
                easting = f"E{int(math.floor(lon)):03d}_00"
                tile_name = f"Copernicus_DSM_COG_10_{northing}_{easting}_DEM"
                cog_url = f"https://copernicus-dem-30m.s3.amazonaws.com/{tile_name}/{tile_name}.tif"

                try:
                    if cog_url not in tile_cache:
                        tile_cache[cog_url] = rasterio.open(cog_url)
                    src = tile_cache[cog_url]

                    py, px = src.index(lon, lat)
                    if px < 1 or px >= src.width - 1 or py < 1 or py >= src.height - 1:
                        continue

                    patch = src.read(1, window=Window(px - 1, py - 1, 3, 3))
                    if src.nodata is not None and np.any(patch == src.nodata):
                        audit_counters["DEM_NODATA_OR_VOID"] += 1
                        continue
                    if np.any(np.isnan(patch)) or np.any(patch < -500.0) or np.any(patch > 9000.0):
                        audit_counters["DEM_NODATA_OR_VOID"] += 1
                        continue

                    elev = float(patch[1, 1])
                    slope = calculate_horn_slope(patch, lat)
                except Exception:
                    audit_counters["DEM_NODATA_OR_VOID"] += 1
                    continue

                # Check 4: Frozen Empirical Matching Rules
                if not (elev_min_rule <= elev <= elev_max_rule and slope_min_rule <= slope <= slope_max_rule):
                    audit_counters["TERRAIN_OUTSIDE_FROZEN_RULES"] += 1
                    continue

                # Check 5: Date Sampling & Temporal Exclusion Check
                rand_day_offset = random.randint(0, total_days)
                cand_date = cal_start + timedelta(days=rand_day_offset)
                cand_date_str = cand_date.strftime("%Y-%m-%d")
                cand_np_dt = np.datetime64(cand_date)

                # For TEST partition: also check causal test-period floods known as of cand_date (t <= cand_date)
                if partition_name == "test":
                    causal_mask = test_dts <= cand_np_dt
                    if np.any(causal_mask):
                        causal_test_ecef = test_ecef[causal_mask]
                        test_dists = np.linalg.norm(causal_test_ecef - cand_ecef, axis=1)
                        if np.min(test_dists) < spatial_chord_thresh:
                            audit_counters["VIOLATES_3KM_SPATIAL_HEURISTIC"] += 1
                            continue

                # Temporal Proximity Check (+/- 7 days in vicinity)
                if len(state_part_pos) > 0:
                    if partition_name == "train":
                        # Train: only train-period floods in state
                        active_dts = state_pos_dts
                        active_coords = state_pos_coords
                    else:
                        # Test: causal floods in state up to cand_date
                        active_mask = state_pos_dts <= cand_np_dt
                        active_dts = state_pos_dts[active_mask]
                        active_coords = state_pos_coords[active_mask]

                    if len(active_dts) > 0:
                        time_diff = np.abs((active_dts - cand_np_dt).astype("timedelta64[D]").astype(int))
                        near_time = time_diff <= TEMPORAL_BUFFER_DAYS
                        if np.any(near_time):
                            near_coords = active_coords[near_time]
                            near_ecef = geodetic_to_ecef(near_coords[:, 0], near_coords[:, 1])
                            dists = np.linalg.norm(near_ecef - cand_ecef, axis=1)
                            if np.min(dists) < temporal_chord_thresh:
                                audit_counters["VIOLATES_7DAY_TEMPORAL_HEURISTIC"] += 1
                                continue

                # Accepted Sample
                accepted_state += 1
                audit_counters["ACCEPTED"] += 1
                sample_num = len(samples) + 1 if partition_name == "train" else len(samples) + 14
                sample_id = f"PILOT_NEG_MATCHED_CORR_{sample_num:02d}"

                samples.append({
                    "sample_id": sample_id,
                    "source_type": "pseudo_negative_matched_corrected",
                    "split": partition_name,
                    "target": 0,
                    "label_class": "pseudo_negative",
                    "label_certainty": "uncertain_background_sample",
                    "date": cand_date_str,
                    "year": cand_date.year,
                    "state": state_name,
                    "place": "Background Matched Terrain (Corrected)",
                    "latitude": round(lat, 7),
                    "longitude": round(lon, 7),
                    "excel_row_num": -1,
                    "elevation_m": round(elev, 2),
                    "slope_deg": round(slope, 2),
                    "dem_source": "AWS_COPERNICUS_GLO30_COG",
                    "dem_product_type": "DSM_SURFACE_MODEL",
                    "dem_spatial_res_m": 30.0,
                    "dem_crs": "EPSG:4326",
                    "missing_terrain_flag": False,
                    "terrain_qc_status": "VALID_COPERNICUS_30M_MATCHED_CORRECTED",
                    "sampling_attempts": attempts
                })

                print(f"[{partition_name.upper()} {accepted_state}/{quota}] {sample_id} ({state_name}) -> Elev: {elev:5.2f} m | Slope: {slope:4.2f} deg | Date: {cand_date_str} (attempt {attempts})")

            if accepted_state < quota:
                print(f"\n[ERROR] Infeasible allocation: State '{state_name}' in partition '{partition_name}' only sampled {accepted_state}/{quota} within {MAX_ATTEMPTS_PER_STATE} attempts.")
                print("Stopping safely without silent reassignment or relaxing constraints.")
                sys.exit(1)

        return samples

    print("\n--- Generating Corrected Train Matched Negatives (N=13, 2015-2019) ---")
    train_matched_samples = sample_corrected_cohort("train", train_state_quotas, 2015, 2019)

    print("\n--- Generating Corrected Test Matched Negatives (N=7, 2020-2021) ---")
    test_matched_samples = sample_corrected_cohort("test", test_state_quotas, 2020, 2021)

    for s in tile_cache.values():
        s.close()

    all_matched_neg_df = pd.DataFrame(train_matched_samples + test_matched_samples)

    # 6. Fetch Retrospective Rainfall Features
    print("\n--- Fetching Historical ERA5 Rainfall Features via Open-Meteo ---")
    cache = load_cache()
    start_exec_time = datetime.now(timezone.utc).isoformat()

    rain_1d_list = []
    rain_3d_list = []
    rain_7d_list = []
    rain_event_list = []
    missing_rain_list = []
    rain_qc_list = []

    for idx, row in all_matched_neg_df.iterrows():
        r1, r3, r7, rev, is_miss, qc = fetch_rainfall_features(
            row["latitude"], row["longitude"], row["date"], cache
        )
        rain_1d_list.append(r1)
        rain_3d_list.append(r3)
        rain_7d_list.append(r7)
        rain_event_list.append(rev)
        missing_rain_list.append(is_miss)
        rain_qc_list.append(qc)

    save_cache(cache)

    all_matched_neg_df["weather_model"] = "ECMWF_ERA5_REANALYSIS"
    all_matched_neg_df["weather_api_provider"] = "Open-Meteo_Archive_v1"
    all_matched_neg_df["rain_spatial_res_deg"] = 0.25
    all_matched_neg_df["rain_spatial_res_km"] = 25.0
    all_matched_neg_df["rain_units"] = "mm"
    all_matched_neg_df["rain_accumulation_timezone"] = "Asia/Singapore"
    all_matched_neg_df["extraction_timestamp_utc"] = start_exec_time
    all_matched_neg_df["rain_1d_prior_mm"] = rain_1d_list
    all_matched_neg_df["rain_3d_prior_mm"] = rain_3d_list
    all_matched_neg_df["rain_7d_prior_mm"] = rain_7d_list
    all_matched_neg_df["rain_event_day_retrospective_mm"] = rain_event_list
    all_matched_neg_df["missing_rainfall_flag"] = missing_rain_list
    all_matched_neg_df["rainfall_qc_status"] = rain_qc_list

    feature_cols = [
        "sample_id", "source_type", "split", "target", "label_class", "label_certainty",
        "date", "year", "state", "place", "latitude", "longitude", "excel_row_num",
        "weather_model", "weather_api_provider", "rain_spatial_res_deg", "rain_spatial_res_km",
        "rain_units", "rain_accumulation_timezone", "extraction_timestamp_utc",
        "rain_1d_prior_mm", "rain_3d_prior_mm", "rain_7d_prior_mm", "rain_event_day_retrospective_mm",
        "missing_rainfall_flag", "rainfall_qc_status",
        "elevation_m", "slope_deg", "dem_source", "dem_product_type", "dem_spatial_res_m",
        "dem_crs", "missing_terrain_flag", "terrain_qc_status"
    ]

    all_matched_neg_clean = all_matched_neg_df[feature_cols].copy()
    all_matched_neg_clean.to_csv(OUTPUT_NEGATIVES_CORRECTED, index=False)
    print(f"\n[OK] Exported 20 corrected terrain-matched pseudo-negatives to: {OUTPUT_NEGATIVES_CORRECTED}")

    # 7. Create Combined 40-record Cohort (20 Positives + 20 Corrected Matched Negatives)
    pos_20_clean = pos_20_df[feature_cols].copy()
    matched_40_df = pd.concat([pos_20_clean, all_matched_neg_clean], ignore_index=True)
    matched_40_df.to_csv(OUTPUT_MATCHED_40_CORRECTED, index=False)
    print(f"[OK] Exported combined 40-record corrected dataset to: {OUTPUT_MATCHED_40_CORRECTED}")

    # 8. Run Before/After QA Verification
    run_comparative_qa(pos_20_clean, all_matched_neg_clean, train_pool_pos, test_pool_pos, audit_counters)


def run_comparative_qa(pos_df, corrected_neg_df, train_pos_pool, test_pos_pool, audit):
    print("\n" + "=" * 75)
    print("PHASE 4C LEAKAGE CORRECTION: BEFORE/AFTER COMPARATIVE QA")
    print("=" * 75)

    print("\n[1] REJECTION AUDIT")
    print(f"  Total Attempts:                        {audit['TOTAL_ATTEMPTS']}")
    print(f"  Accepted:                              {audit['ACCEPTED']} ({audit['ACCEPTED']/audit['TOTAL_ATTEMPTS']*100:.2f}%)")
    print(f"  Rejected - Off-Land / Outside State:   {audit['OFF_LAND_OR_OUTSIDE_STATE']}")
    print(f"  Rejected - Violates 3 km Spatial:      {audit['VIOLATES_3KM_SPATIAL_HEURISTIC']}")
    print(f"  Rejected - Outside Frozen Terrain:     {audit['TERRAIN_OUTSIDE_FROZEN_RULES']}")
    print(f"  Rejected - Violates 7-day Temporal:    {audit['VIOLATES_7DAY_TEMPORAL_HEURISTIC']}")
    print(f"  Rejected - DEM NoData / Void:          {audit['DEM_NODATA_OR_VOID']}")

    # 2. Strict Information Firewall Audit (Zero Test Information Leakage)
    print("\n[2] VERIFYING ZERO FUTURE-TEST-PERIOD LEAKAGE IN TRAINING NEGATIVES")
    corr_train_negs = corrected_neg_df[corrected_neg_df["split"] == "train"]

    # Measure distance of Train Negatives to Train Positives vs Test Positives
    train_ecef = geodetic_to_ecef(train_pos_pool["latitude"].values, train_pos_pool["longitude"].values)
    test_ecef = geodetic_to_ecef(test_pos_pool["latitude"].values, test_pos_pool["longitude"].values)
    corr_tr_ecef = geodetic_to_ecef(corr_train_negs["latitude"].values, corr_train_negs["longitude"].values)

    tree_tr = cKDTree(train_ecef)
    tree_te = cKDTree(test_ecef)

    d_tr_chord, _ = tree_tr.query(corr_tr_ecef, k=1)
    d_te_chord, _ = tree_te.query(corr_tr_ecef, k=1)

    d_tr_km = 2.0 * 6371.0 * np.arcsin(d_tr_chord / (2.0 * 6371000.0))
    d_te_km = 2.0 * 6371.0 * np.arcsin(d_te_chord / (2.0 * 6371000.0))

    print(f"  Train Negatives distance to Train Positives (<=2019): Min = {d_tr_km.min():.2f} km (All >= 3.0 km: {(d_tr_km >= 3.0).all()})")
    print(f"  Train Negatives distance to Test Positives (>=2020):  Min = {d_te_km.min():.2f} km")
    print("  -> Confirmation: Screening index for Train negatives contained ZERO test-period points.")
    print("     Training negatives were evaluated strictly against pre-2020 historical floods.")

    # 3. Terrain & Rainfall Summary Comparison
    print("\n[3] RECALCULATED DISTRIBUTIONS (CORRECTED COHORT N=40)")
    for name, df in [("POSITIVES (N=20)", pos_df), ("CORRECTED MATCHED NEGATIVES (N=20)", corrected_neg_df)]:
        print(f"\n--- {name} ---")
        for col in ["elevation_m", "slope_deg", "rain_1d_prior_mm", "rain_3d_prior_mm", "rain_7d_prior_mm", "rain_event_day_retrospective_mm"]:
            s = df[col]
            print(f"  {col:<32}: Mean={s.mean():6.2f} | Median={s.median():6.2f} | IQR=[{s.quantile(0.25):5.2f}, {s.quantile(0.75):5.2f}] | Min={s.min():5.2f} | Max={s.max():5.2f}")

    # 4. Cross-Partition Distance Check Across ALL 40 Records
    corr_40_all = pd.concat([pos_df, corrected_neg_df], ignore_index=True)
    all_train = corr_40_all[corr_40_all["split"] == "train"]
    all_test = corr_40_all[corr_40_all["split"] == "test"]

    all_tr_ecef = geodetic_to_ecef(all_train["latitude"].values, all_train["longitude"].values)
    all_te_ecef = geodetic_to_ecef(all_test["latitude"].values, all_test["longitude"].values)

    all_tr_tree = cKDTree(all_tr_ecef)
    min_chord, min_idx = all_tr_tree.query(all_te_ecef, k=1)
    min_dist_km = (2.0 * 6371.0 * np.arcsin(min_chord / (2.0 * 6371000.0))).min()
    argmin_te = np.argmin(min_chord)
    argmin_tr = min_idx[argmin_te]

    tr_rec = all_train.iloc[argmin_tr]
    te_rec = all_test.iloc[argmin_te]

    print("\n[4] OVERALL MINIMUM TRAIN-TO-TEST DISTANCE (ALL 40 RECORDS)")
    print(f"  Minimum Distance: {min_dist_km:.2f} km")
    print(f"  Closest Pair: {tr_rec['sample_id']} ({tr_rec['state']}, {tr_rec['split']}) <--> {te_rec['sample_id']} ({te_rec['state']}, {te_rec['split']})")
    print("=" * 75)


if __name__ == "__main__":
    main()
