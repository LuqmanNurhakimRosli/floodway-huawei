"""
scripts/extract_stage5_2b_rainfall.py

FloodWay Stage 5.2B: Complete Rainfall Feature Extraction for 500-Record Background Cohort.
- Benchmark A: 250 records (165 Train, 85 Test)
- Benchmark B: 250 records (165 Train, 85 Test)
- Reuses existing open_meteo_rainfall_cache.json (instant hits for Stage 5.2A records)
- Extracts remaining ~400 records using Open-Meteo ECMWF ERA5 (models=era5, timezone=Asia/Singapore)
- Antecedent features: rain_1d_prior_mm, rain_3d_prior_mm, rain_7d_prior_mm
- Diagnostic only: rain_event_day_mm (D-0) strictly separate
- Persistent disk caching, atomic checkpoints every 25 records, retry with exponential backoff
- Outputs:
    datasets/floodway_stage5_2b_uniform_features_250.csv
    datasets/floodway_stage5_2b_matched_features_250.csv
    datasets/floodway_stage5_2b_background_features_500.csv
"""

import os
import sys
import json
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta
import numpy as np
import pandas as pd

CACHE_DIR = "datasets/cache"
CHECKPOINT_DIR = "datasets/checkpoints"
RAINFALL_CACHE_FILE = os.path.join(CACHE_DIR, "open_meteo_rainfall_cache.json")

INPUT_UNIFORM_CSV = "datasets/floodway_stage5_1a_uniform_negatives_250.csv"
INPUT_MATCHED_CSV = "datasets/floodway_stage5_1a_matched_negatives_250.csv"

OUTPUT_UNIFORM_CSV = "datasets/floodway_stage5_2b_uniform_features_250.csv"
OUTPUT_MATCHED_CSV = "datasets/floodway_stage5_2b_matched_features_250.csv"
OUTPUT_COMBINED_CSV = "datasets/floodway_stage5_2b_background_features_500.csv"

os.makedirs(CACHE_DIR, exist_ok=True)
os.makedirs(CHECKPOINT_DIR, exist_ok=True)

def load_rainfall_cache():
    if os.path.exists(RAINFALL_CACHE_FILE):
        try:
            with open(RAINFALL_CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def save_rainfall_cache(cache):
    with open(RAINFALL_CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2)

def extract_features_for_dataframe(df_input, bmk_name, checkpoint_path, rainfall_cache, stats):
    print(f"\n>>> Extracting Rainfall for {bmk_name} (Total: {len(df_input)}) <<<")
    df = df_input.copy()
    
    rain_1d_list = []
    rain_3d_list = []
    rain_7d_list = []
    rain_0d_list = []
    provenance_list = []

    t0 = time.time()
    
    for idx, row in df.iterrows():
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
            stats["cache_hits"] += 1
        else:
            stats["network_requests"] += 1
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
                headers={"User-Agent": "FloodWay_Stage5_2B_Scaling/1.0 (ECMWF_ERA5_Extraction)"}
            )

            # Polite rate-limiting: 0.15s delay between network calls
            time.sleep(0.15)

            # Retry with exponential backoff on HTTP 429 / timeouts
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
                        print(f"  [Rate Limit 429] Backing off {backoff:.1f}s at {row['sample_id']}...")
                        time.sleep(backoff)
                    else:
                        if attempt == max_retries - 1:
                            stats["failed_requests"] += 1
                            print(f"  [HTTP Error {e.code}] on {row['sample_id']} ({lat}, {lon})")
                except Exception as e:
                    if attempt == max_retries - 1:
                        stats["failed_requests"] += 1
                        print(f"  [Network Error {e}] on {row['sample_id']} ({lat}, {lon})")
                    time.sleep(1.0)

        # Checkpoint every 25 rows
        if (idx + 1) % 25 == 0:
            elapsed = time.time() - t0
            print(f"  [{bmk_name}] Progress: {idx + 1}/{len(df)} rows ({stats['network_requests']} network calls, {stats['cache_hits']} cache hits) in {elapsed:.1f}s...")
            save_rainfall_cache(rainfall_cache)

        # Parse rainfall time series
        if payload is None or "daily" not in payload or "precipitation_sum" not in payload["daily"]:
            print(f"[ERROR] Missing payload for row {idx} ({row['sample_id']})")
            rain_1d_list.append(np.nan)
            rain_3d_list.append(np.nan)
            rain_7d_list.append(np.nan)
            rain_0d_list.append(np.nan)
            provenance_list.append("FAILED_PAYLOAD")
            continue

        daily_times = payload["daily"]["time"]
        daily_vals = payload["daily"]["precipitation_sum"]

        expected_dates = [(target_dt - timedelta(days=d)).strftime("%Y-%m-%d") for d in range(7, -1, -1)]
        date_to_val = dict(zip(daily_times, daily_vals))
        window_vals = [date_to_val.get(d) for d in expected_dates]

        if any(v is None for v in window_vals):
            print(f"[ERROR] Incomplete rainfall series for {row['sample_id']}: {window_vals}")
            rain_1d_list.append(np.nan)
            rain_3d_list.append(np.nan)
            rain_7d_list.append(np.nan)
            rain_0d_list.append(np.nan)
            provenance_list.append("INCOMPLETE_SERIES_NONE")
            continue

        # Compute antecedent windows
        rain_1d = round(float(window_vals[6]), 2)                       # D-1
        rain_3d = round(float(sum(window_vals[4:7])), 2)                 # D-3 to D-1
        rain_7d = round(float(sum(window_vals[0:7])), 2)                 # D-7 to D-1
        rain_0d = round(float(window_vals[7]), 2)                       # D-0 (diagnostic only)

        rain_1d_list.append(rain_1d)
        rain_3d_list.append(rain_3d)
        rain_7d_list.append(rain_7d)
        rain_0d_list.append(rain_0d)
        provenance_list.append("ECMWF_ERA5_OPEN_METEO_V1_ARCHIVE")

    df["rain_1d_prior_mm"] = rain_1d_list
    df["rain_3d_prior_mm"] = rain_3d_list
    df["rain_7d_prior_mm"] = rain_7d_list
    df["rain_event_day_mm"] = rain_0d_list
    df["rainfall_provenance"] = provenance_list
    df["rainfall_unit"] = "mm"
    df["rainfall_timezone"] = "Asia/Singapore"
    df["rainfall_model"] = "ECMWF_ERA5_0.25deg"

    # Save checkpoint
    df.to_csv(checkpoint_path, index=False)
    save_rainfall_cache(rainfall_cache)
    
    elapsed_total = time.time() - t0
    print(f"Completed {bmk_name} in {elapsed_total:.1f}s.")
    return df

def main():
    print("=" * 80)
    print("FLOODWAY STAGE 5.2B: RAINFALL EXTRACTION FOR FULL 500-RECORD BACKGROUND COHORT")
    print("=" * 80)

    # Load 5.1A inputs
    if not os.path.exists(INPUT_UNIFORM_CSV) or not os.path.exists(INPUT_MATCHED_CSV):
        raise FileNotFoundError("Missing Stage 5.1A input CSVs.")

    df_unif_250 = pd.read_csv(INPUT_UNIFORM_CSV)
    df_match_250 = pd.read_csv(INPUT_MATCHED_CSV)

    assert len(df_unif_250) == 250, f"Benchmark A count {len(df_unif_250)} != 250"
    assert len(df_match_250) == 250, f"Benchmark B count {len(df_match_250)} != 250"

    print(f"Loaded Stage 5.1A Datasets:")
    print(f"  Benchmark A (Uniform):            {len(df_unif_250)} records (165 Train, 85 Test)")
    print(f"  Benchmark B (Terrain-Restricted): {len(df_match_250)} records (165 Train, 85 Test)")

    rainfall_cache = load_rainfall_cache()
    initial_cache_size = len(rainfall_cache)
    print(f"Initial rainfall cache keys: {initial_cache_size}")

    stats = {
        "cache_hits": 0,
        "network_requests": 0,
        "failed_requests": 0
    }
    t_start = time.time()

    # Process Benchmark A
    cp_unif = os.path.join(CHECKPOINT_DIR, "stage5_2b_checkpoint_uniform_250.csv")
    df_unif_enriched = extract_features_for_dataframe(
        df_unif_250, "Benchmark A (Uniform Background)", cp_unif, rainfall_cache, stats
    )

    # Process Benchmark B
    cp_match = os.path.join(CHECKPOINT_DIR, "stage5_2b_checkpoint_matched_250.csv")
    df_match_enriched = extract_features_for_dataframe(
        df_match_250, "Benchmark B (Terrain-Restricted Background)", cp_match, rainfall_cache, stats
    )

    # Save final enriched datasets
    df_unif_enriched.to_csv(OUTPUT_UNIFORM_CSV, index=False)
    df_match_enriched.to_csv(OUTPUT_MATCHED_CSV, index=False)

    df_combined = pd.concat([df_unif_enriched, df_match_enriched], ignore_index=True)
    df_combined.to_csv(OUTPUT_COMBINED_CSV, index=False)

    total_time = time.time() - t_start
    save_rainfall_cache(rainfall_cache)

    print("\n" + "=" * 80)
    print("STAGE 5.2B POST-EXTRACTION QA AUDIT REPORT")
    print("=" * 80)
    print(f"Total Execution Time:        {total_time:.1f} seconds ({total_time/60:.2f} minutes)")
    print(f"Total Network API Calls:     {stats['network_requests']}")
    print(f"Total Cache Hits:            {stats['cache_hits']}")
    print(f"Failed API Requests:         {stats['failed_requests']}")
    print(f"Final Cache Keys:            {len(rainfall_cache)} (+{len(rainfall_cache) - initial_cache_size} new)")

    # Assertions on Benchmark A
    print("\n--- QA Audit: Benchmark A (Uniform) ---")
    print(f"  Row Count: {len(df_unif_enriched)}")
    assert len(df_unif_enriched) == 250, "Benchmark A row count != 250"
    missing_unif = df_unif_enriched[["rain_1d_prior_mm", "rain_3d_prior_mm", "rain_7d_prior_mm", "rain_event_day_mm"]].isnull().sum().sum()
    print(f"  Missing Rainfall Values: {missing_unif}")
    assert missing_unif == 0, f"Benchmark A has {missing_unif} missing rainfall values"
    dup_ids_unif = len(df_unif_enriched) - df_unif_enriched.drop_duplicates(subset=["sample_id"]).shape[0]
    print(f"  Duplicate Sample IDs: {dup_ids_unif}")
    assert dup_ids_unif == 0, "Benchmark A has duplicate sample IDs"
    print(f"  Splits: {df_unif_enriched['split'].value_counts().to_dict()}")
    assert (df_unif_enriched['split'] == 'train').sum() == 165
    assert (df_unif_enriched['split'] == 'test').sum() == 85
    print("  [PASS] Benchmark A verified 250 rows, 165 train, 85 test, 0 missing, 0 duplicates.")

    # Assertions on Benchmark B
    print("\n--- QA Audit: Benchmark B (Terrain-Restricted) ---")
    print(f"  Row Count: {len(df_match_enriched)}")
    assert len(df_match_enriched) == 250, "Benchmark B row count != 250"
    missing_match = df_match_enriched[["rain_1d_prior_mm", "rain_3d_prior_mm", "rain_7d_prior_mm", "rain_event_day_mm"]].isnull().sum().sum()
    print(f"  Missing Rainfall Values: {missing_match}")
    assert missing_match == 0, f"Benchmark B has {missing_match} missing rainfall values"
    dup_ids_match = len(df_match_enriched) - df_match_enriched.drop_duplicates(subset=["sample_id"]).shape[0]
    print(f"  Duplicate Sample IDs: {dup_ids_match}")
    assert dup_ids_match == 0, "Benchmark B has duplicate sample IDs"
    print(f"  Splits: {df_match_enriched['split'].value_counts().to_dict()}")
    assert (df_match_enriched['split'] == 'train').sum() == 165
    assert (df_match_enriched['split'] == 'test').sum() == 85
    print("  [PASS] Benchmark B verified 250 rows, 165 train, 85 test, 0 missing, 0 duplicates.")

    # Combined dataset audit
    print("\n--- QA Audit: Combined Background Dataset (N=500) ---")
    print(f"  Total Rows: {len(df_combined)}")
    assert len(df_combined) == 500, "Combined dataset != 500 rows"
    print(f"  Unique Coordinates across all 500: {df_combined.drop_duplicates(subset=['latitude', 'longitude']).shape[0]} / 500")
    print(f"  Label Certainty: {df_combined['label_certainty'].unique().tolist()}")
    print("  [PASS] All 500 background samples enriched and verified.")

    # Summary Statistics
    print("\n--- Antecedent Rainfall Summary Statistics (mm) ---")
    for bmk, grp in df_combined.groupby("benchmark_type"):
        print(f"\n{bmk} (N={len(grp)}):")
        print("  rain_1d_prior_mm:", grp["rain_1d_prior_mm"].describe().round(2).to_dict())
        print("  rain_3d_prior_mm:", grp["rain_3d_prior_mm"].describe().round(2).to_dict())
        print("  rain_7d_prior_mm:", grp["rain_7d_prior_mm"].describe().round(2).to_dict())
        print("  rain_event_day_mm (diagnostic):", grp["rain_event_day_mm"].describe().round(2).to_dict())

if __name__ == "__main__":
    main()
