"""
scripts/generate_negative_samples.py

Phase 3: Controlled Pseudo-Negative Sampling Pilot for FloodWay.
Generates an initial pilot of 300 pseudo-negative (presence-background) samples
across Peninsular Malaysia, respecting:
  1. Real administrative state land boundaries (datasets/malaysia_state_boundaries.geojson).
  2. Geodesic spatial exclusion buffer (>= 3.0 km) against all known flood points.
  3. Temporal exclusion buffer (+/- 7 days within 10 km of local floods).
  4. Strict partition separation (Train <= 2019, Test >= 2020) without temporal leakage.
  5. State-stratified distribution matching positive candidate proportions.

Honest Methodology:
  - Labeled explicitly as 'pseudo_negative' with 'uncertain_background_sample' certainty.
  - Absence of a recorded flood is NOT treated as ground-truth absence.
  - Background samples reflect the natural landscape without cherry-picking steep terrain.
"""

import os
import json
import math
import random
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from shapely.geometry import shape, Point
from shapely.prepared import prep
from scipy.spatial import cKDTree


# ---------------------------------------------------------------------------
# Configuration Parameters
# ---------------------------------------------------------------------------
RANDOM_SEED = 42
PILOT_SAMPLE_SIZE = 300
SPATIAL_BUFFER_M = 3000.0          # 3.0 km geodesic exclusion buffer
TEMPORAL_BUFFER_DAYS = 7           # +/- 7 days local flood avoidance
TEMPORAL_PROXIMITY_M = 10000.0     # 10 km vicinity for temporal storm avoidance

EARTH_RADIUS_M = 6371000.0         # WGS-84 mean radius in meters

CANON_STATE_MAP = {
    "Kedah": "Kedah",
    "Kelantan": "Kelantan",
    "Perak": "Perak",
    "Pulau Pinang": "Pulau Pinang",
    "Kuala Lumpur": "WP K Lumpur",
    "Negeri Sembilan": "Negeri Sembilan",
    "Melaka": "Melaka",
    "Perlis": "Perlis",
    "Pahang": "Pahang",
    "Terengganu": "Terengganu",
    "Selangor": "Selangor",
    "Johor": "Johor"
}


def geodetic_to_ecef(lat_deg, lon_deg):
    """Converts (lat, lon) degrees to 3D Cartesian ECEF coordinates on spherical Earth."""
    phi = np.radians(lat_deg)
    lam = np.radians(lon_deg)
    x = EARTH_RADIUS_M * np.cos(phi) * np.cos(lam)
    y = EARTH_RADIUS_M * np.cos(phi) * np.sin(lam)
    z = EARTH_RADIUS_M * np.sin(phi)
    return np.column_stack([x, y, z]) if isinstance(lat_deg, np.ndarray) else np.array([x, y, z])


def chord_to_geodesic(chord_dist):
    """Converts 3D Euclidean chord distance back to surface arc distance in meters."""
    theta = 2.0 * np.arcsin(np.clip(chord_dist / (2.0 * EARTH_RADIUS_M), -1.0, 1.0))
    return EARTH_RADIUS_M * theta


def geodesic_to_chord(arc_dist):
    """Converts surface arc distance in meters to 3D Euclidean chord distance."""
    theta = arc_dist / EARTH_RADIUS_M
    return 2.0 * EARTH_RADIUS_M * np.sin(theta / 2.0)


def load_state_boundaries(geojson_path="datasets/malaysia_state_boundaries.geojson"):
    if not os.path.exists(geojson_path):
        raise FileNotFoundError(f"Missing state boundaries GeoJSON: {geojson_path}")
    with open(geojson_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    state_geoms = {}
    for feat in data.get("features", []):
        name = feat.get("properties", {}).get("name")
        if name and "geometry" in feat:
            state_geoms[name] = shape(feat["geometry"])

    state_polys = {}
    prepared_polys = {}
    for clean_name, geo_name in CANON_STATE_MAP.items():
        if geo_name in state_geoms:
            geom = state_geoms[geo_name]
            state_polys[clean_name] = geom
            prepared_polys[clean_name] = prep(geom)
        else:
            print(f"Warning: Boundary for {clean_name} ({geo_name}) not found in GeoJSON.")

    return state_polys, prepared_polys


def run_pilot():
    # Set deterministic random seeds
    random.seed(RANDOM_SEED)
    np.random.seed(RANDOM_SEED)

    # 1. Load Peninsular Candidates and Centroids
    cand_path = "datasets/jps_positives_peninsular_candidates.csv"
    cent_path = "datasets/jps_positives_peninsular_centroids.csv"

    if not os.path.exists(cand_path):
        raise FileNotFoundError(f"Candidates file not found: {cand_path}")

    cand_df = pd.read_csv(cand_path)
    total_cand = len(cand_df)

    cent_df = pd.read_csv(cent_path) if os.path.exists(cent_path) else pd.DataFrame()

    # Combine all known positive coordinates for complete spatial exclusion
    all_known_positives = pd.concat([
        cand_df[["excel_row_num", "year", "date", "state", "place", "latitude", "longitude"]],
        cent_df[["excel_row_num", "year", "date", "state", "place", "latitude", "longitude"]]
    ], ignore_index=True)

    print(f"Loaded {total_cand:,} Peninsular candidate records.")
    print(f"Total known flood points for spatial exclusion buffer: {len(all_known_positives):,}")

    # Calculate actual train and test counts directly from the candidate CSV
    train_pos_df = cand_df[cand_df["year"] <= 2019].copy()
    test_pos_df = cand_df[cand_df["year"] >= 2020].copy()

    actual_train_count = len(train_pos_df)
    actual_test_count = len(test_pos_df)

    print(f"Actual Train Positives (<=2019): {actual_train_count:,} ({actual_train_count/total_cand*100:.2f}%)")
    print(f"Actual Test Positives  (>=2020): {actual_test_count:,} ({actual_test_count/total_cand*100:.2f}%)")

    # Target allocation for pilot (300 total)
    train_target = int(round(PILOT_SAMPLE_SIZE * (actual_train_count / total_cand)))
    test_target = PILOT_SAMPLE_SIZE - train_target
    print(f"Pilot Sampling Target: {PILOT_SAMPLE_SIZE} total -> Train: {train_target}, Test: {test_target}")

    # Build 3D ECEF Spatial Index (cKDTree) for all positive coordinates
    pos_ecef = geodetic_to_ecef(all_known_positives["latitude"].values, all_known_positives["longitude"].values)
    pos_tree = cKDTree(pos_ecef)
    spatial_threshold_chord = geodesic_to_chord(SPATIAL_BUFFER_M)

    # Load State Polygons
    state_polys, prep_states = load_state_boundaries()

    # Pre-parse positive dates for temporal proximity checks
    all_known_positives["dt"] = pd.to_datetime(all_known_positives["date"])

    # 2. Compute State Targets Proportional to Positives within each Partition
    def get_state_quotas(partition_df, target_total):
        st_counts = partition_df["state"].value_counts()
        quotas = {}
        allocated = 0
        for st, count in st_counts.items():
            q = int(round(target_total * (count / len(partition_df))))
            quotas[st] = q
            allocated += q
        # Adjust remainder to exact target
        diff = target_total - allocated
        top_state = st_counts.index[0]
        quotas[top_state] += diff
        return quotas

    train_quotas = get_state_quotas(train_pos_df, train_target)
    test_quotas = get_state_quotas(test_pos_df, test_target)

    # 3. Sampling Engine
    rejection_audit = {
        "OFF_LAND_OR_OUTSIDE_STATE": 0,
        "VIOLATES_SPATIAL_BUFFER": 0,
        "VIOLATES_TEMPORAL_BUFFER": 0
    }

    generated_samples = []

    def sample_partition(partition_name, quotas, start_year, end_year):
        calendar_start = datetime(start_year, 1, 1)
        calendar_end = datetime(end_year, 12, 31)
        total_days = (calendar_end - calendar_start).days

        for state_name, quota in quotas.items():
            if quota <= 0:
                continue
            if state_name not in state_polys:
                print(f"Warning: Skipping state {state_name}; no polygon geometry.")
                continue

            geom = state_polys[state_name]
            pgeom = prep_states[state_name]
            minx, miny, maxx, maxy = geom.bounds

            # Positives in this state for temporal checking
            state_positives = all_known_positives[all_known_positives["state"] == state_name].copy()
            state_pos_coords = state_positives[["latitude", "longitude"]].values
            state_pos_dts = state_positives["dt"].values

            accepted_for_state = 0
            attempts = 0
            max_attempts = quota * 500

            while accepted_for_state < quota and attempts < max_attempts:
                attempts += 1
                # Sample coordinate uniformly in bounding box
                cand_lon = random.uniform(minx, maxx)
                cand_lat = random.uniform(miny, maxy)

                # Land / State Boundary Check
                cand_pt = Point(cand_lon, cand_lat)
                if not pgeom.contains(cand_pt):
                    rejection_audit["OFF_LAND_OR_OUTSIDE_STATE"] += 1
                    continue

                # Geodesic Spatial Exclusion Buffer Check (against ALL 3,301 flood points)
                cand_ecef = geodetic_to_ecef(cand_lat, cand_lon)
                nearest_chord_dist, nearest_idx = pos_tree.query(cand_ecef, k=1)

                if nearest_chord_dist < spatial_threshold_chord:
                    rejection_audit["VIOLATES_SPATIAL_BUFFER"] += 1
                    continue

                nearest_geodesic_m = chord_to_geodesic(nearest_chord_dist)

                # Sample Date within Partition Range
                rand_day_offset = random.randint(0, total_days)
                cand_date = calendar_start + timedelta(days=rand_day_offset)
                cand_date_str = cand_date.strftime("%Y-%m-%d")
                cand_np_dt = np.datetime64(cand_date)

                # Temporal Exclusion Check: Avoid flood dates within +/- 7 days in the vicinity
                if len(state_positives) > 0:
                    time_diff_days = np.abs((state_pos_dts - cand_np_dt).astype("timedelta64[D]").astype(int))
                    near_time_mask = time_diff_days <= TEMPORAL_BUFFER_DAYS

                    if np.any(near_time_mask):
                        # For floods occurring within +/- 7 days, check if any were within 10 km
                        near_time_coords = state_pos_coords[near_time_mask]
                        near_time_ecef = geodetic_to_ecef(near_time_coords[:, 0], near_time_coords[:, 1])
                        dist_to_near_time = np.linalg.norm(near_time_ecef - cand_ecef, axis=1)
                        min_near_chord = np.min(dist_to_near_time)

                        if min_near_chord < geodesic_to_chord(TEMPORAL_PROXIMITY_M):
                            rejection_audit["VIOLATES_TEMPORAL_BUFFER"] += 1
                            continue

                # Sample accepted
                nearest_record = all_known_positives.iloc[nearest_idx]
                sample_id = f"PILOT_NEG_{len(generated_samples) + 1:03d}"

                generated_samples.append({
                    "sample_id": sample_id,
                    "split": partition_name,
                    "target": 0,
                    "label_class": "pseudo_negative",
                    "label_certainty": "uncertain_background_sample",
                    "year": cand_date.year,
                    "date": cand_date_str,
                    "state": state_name,
                    "latitude": round(cand_lat, 7),
                    "longitude": round(cand_lon, 7),
                    "min_dist_to_positive_m": round(nearest_geodesic_m, 2),
                    "nearest_positive_excel_row": int(nearest_record["excel_row_num"]),
                    "nearest_positive_place": str(nearest_record["place"]),
                    "nearest_positive_state": str(nearest_record["state"]),
                    "nearest_positive_date": str(nearest_record["date"]),
                    "spatial_buffer_threshold_m": SPATIAL_BUFFER_M,
                    "temporal_buffer_days": TEMPORAL_BUFFER_DAYS,
                    "sampling_seed": RANDOM_SEED,
                    "polygon_source": "atifmustaffa/malaysia-geojson (DOSM derivative)"
                })

                accepted_for_state += 1

            if accepted_for_state < quota:
                print(f"Warning: Reached max attempts for {state_name} ({partition_name}); sampled {accepted_for_state}/{quota}")

    # Generate Train (2015-2019) and Test (2020-2021)
    print("Sampling Train Partition (2015-2019) ...")
    sample_partition("train", train_quotas, 2015, 2019)

    print("Sampling Test Partition (2020-2021) ...")
    sample_partition("test", test_quotas, 2020, 2021)

    pilot_df = pd.DataFrame(generated_samples)

    # 4. Rigorous Sanity Checks
    print("\nExecuting Pre-Finalization Sanity Checks ...")
    assert len(pilot_df) == PILOT_SAMPLE_SIZE, f"Sample size mismatch: {len(pilot_df)} vs {PILOT_SAMPLE_SIZE}"
    assert pilot_df["target"].sum() == 0, "Non-zero target detected in negative samples!"
    assert (pilot_df["min_dist_to_positive_m"] >= SPATIAL_BUFFER_M).all(), "Buffer violation detected!"

    # Temporal partition sanity check (zero leakage)
    train_years = pilot_df[pilot_df["split"] == "train"]["year"]
    test_years = pilot_df[pilot_df["split"] == "test"]["year"]
    assert (train_years <= 2019).all(), "Future year leaked into train partition!"
    assert (test_years >= 2020).all(), "Past year placed into test partition!"

    # Duplicate coordinate check
    coord_dups = pilot_df.duplicated(subset=["latitude", "longitude"]).sum()
    assert coord_dups == 0, f"Duplicate coordinates detected in pilot: {coord_dups}"

    print("All sanity checks passed successfully.")

    # 5. Export Pilot Dataset
    output_path = "datasets/floodway_pilot_pseudo_negatives.csv"
    pilot_df.to_csv(output_path, index=False, encoding="utf-8")
    print(f"Saved pilot samples to {output_path}")

    # 6. Audit & Distribution Report
    print("\n" + "=" * 65)
    print("PHASE 3 PSEUDO-NEGATIVE PILOT SAMPLING AUDIT REPORT")
    print("=" * 65)
    print(f"Total Pilot Samples Generated:       {len(pilot_df):>6,}")
    print(f"  - Training Split (2015-2019):       {len(train_years):>6,} ({(len(train_years)/len(pilot_df))*100:.1f}%)")
    print(f"  - Testing Split  (2020-2021):       {len(test_years):>6,} ({(len(test_years)/len(pilot_df))*100:.1f}%)")
    print("-" * 65)
    print("Geodesic Spatial Buffer Metrics:")
    print(f"  - Prescribed Minimum Threshold:     {SPATIAL_BUFFER_M:>6.1f} meters")
    print(f"  - Observed Minimum Distance:        {pilot_df['min_dist_to_positive_m'].min():>6.1f} meters")
    print(f"  - Observed Mean Distance:           {pilot_df['min_dist_to_positive_m'].mean():>6.1f} meters")
    print(f"  - Observed Maximum Distance:        {pilot_df['min_dist_to_positive_m'].max():>6.1f} meters")
    print("-" * 65)
    print("Candidate Rejection Statistics during Sampling:")
    for reason, count in rejection_audit.items():
        print(f"  * {reason:<30}: {count:>6,} points rejected")
    print("-" * 65)
    print("State Distribution (Train / Test / Total):")
    st_table = pd.crosstab(pilot_df["state"], pilot_df["split"], margins=True)
    print(st_table)
    print("-" * 65)
    print("Year Distribution:")
    print(pilot_df["year"].value_counts().sort_index())
    print("=" * 65 + "\n")

    return pilot_df


if __name__ == "__main__":
    run_pilot()
