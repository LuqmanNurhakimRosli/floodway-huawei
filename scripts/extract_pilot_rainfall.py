"""
FloodWay - Phase 4A: Historical Rainfall Feature Extraction Pilot
Extracts antecedent and event-day rainfall using Open-Meteo's Historical Weather API.
Processes the 40-record pilot cohort (20 Positives, 20 Pseudo-Negatives).

Key Requirements:
1. Explicit model selection: ECMWF ERA5 Reanalysis (models=era5).
   Note: Open-Meteo's archive daily precipitation endpoint does not serve precipitation under
   'era5_land' (returns None), making explicit 'era5' specification necessary.
2. Antecedent window calculation:
   - rain_1d_prior_mm: D-1
   - rain_3d_prior_mm: sum(D-3, D-2, D-1)
   - rain_7d_prior_mm: sum(D-7 through D-1)
   - rain_event_day_retrospective_mm: D-0 (retained purely for retrospective diagnostics)
3. Zero-imputation policy: Missing/null API values are preserved as NaN, with missing_rainfall_flag=True.
4. Persistent file-based caching and graceful retry/backoff.
"""

import os
import sys
import json
import time
import urllib.request
import urllib.error
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

# Configuration
INPUT_COHORT_PATH = "datasets/floodway_pilot_cohort_40.csv"
OUTPUT_RAINFALL_PATH = "datasets/floodway_pilot_rainfall_40.csv"
CACHE_DIR = "datasets/cache"
CACHE_FILE = os.path.join(CACHE_DIR, "open_meteo_rainfall_cache.json")
MODEL_NAME = "era5"  # Explicitly ECMWF ERA5 Reanalysis (~25 km resolution)
TIMEZONE = "Asia/Singapore"  # UTC+8, identical to Malaysian Standard Time (MYT)
REQUEST_TIMEOUT_SEC = 15
MAX_RETRIES = 3
INTER_REQUEST_DELAY_SEC = 0.3


def load_cache():
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Warning: Failed to load cache from {CACHE_FILE}: {e}. Starting fresh.")
    return {}


def save_cache(cache):
    os.makedirs(CACHE_DIR, exist_ok=True)
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2)


def fetch_rainfall_series(lat, lon, target_date_str, cache):
    """
    Fetches daily precipitation from D-7 to D (8 days total).
    Returns (daily_dict, error_msg, from_cache_bool).
    """
    target_dt = datetime.strptime(target_date_str, "%Y-%m-%d")
    start_dt = target_dt - timedelta(days=7)
    start_date_str = start_dt.strftime("%Y-%m-%d")
    end_date_str = target_date_str

    cache_key = f"{lat:.4f}_{lon:.4f}_{start_date_str}_{end_date_str}_{MODEL_NAME}_{TIMEZONE}"

    if cache_key in cache:
        return cache[cache_key], None, True

    url = (
        f"https://archive-api.open-meteo.com/v1/archive?"
        f"latitude={lat:.4f}&longitude={lon:.4f}&"
        f"start_date={start_date_str}&end_date={end_date_str}&"
        f"daily=precipitation_sum&"
        f"timezone={urllib.parse.quote(TIMEZONE)}&"
        f"models={MODEL_NAME}"
    )

    req = urllib.request.Request(
        url,
        headers={"User-Agent": "FloodWay_Research_Benchmark/1.0 (Academic flood classification)"}
    )

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            time.sleep(INTER_REQUEST_DELAY_SEC)
            with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT_SEC) as response:
                if response.status == 200:
                    payload = json.loads(response.read().decode("utf-8"))
                    
                    # Validate API payload structure and units
                    daily = payload.get("daily", {})
                    daily_units = payload.get("daily_units", {})
                    
                    if "precipitation_sum" not in daily or "time" not in daily:
                        return None, "Malformed API response: missing 'daily' arrays", False
                    
                    unit = daily_units.get("precipitation_sum")
                    if unit != "mm":
                        return None, f"Unexpected unit '{unit}' (expected 'mm')", False
                    
                    utc_offset = payload.get("utc_offset_seconds", 0)
                    if utc_offset != 28800:
                        return None, f"Unexpected UTC offset {utc_offset} (expected 28800 for UTC+8)", False

                    cache[cache_key] = payload
                    return payload, None, False
                else:
                    err_msg = f"HTTP {response.status}"
        except urllib.error.HTTPError as e:
            err_msg = f"HTTPError {e.code}: {e.reason}"
        except urllib.error.URLError as e:
            err_msg = f"URLError: {e.reason}"
        except Exception as e:
            err_msg = f"Exception: {str(e)}"

        if attempt < MAX_RETRIES:
            backoff_sec = 1.5 * attempt
            time.sleep(backoff_sec)

    return None, f"Failed after {MAX_RETRIES} attempts ({err_msg})", False


def run_pilot_extraction():
    print("=" * 70)
    print("FloodWay Phase 4A: Historical Rainfall Feature Extraction Pilot")
    print("=" * 70)

    if not os.path.exists(INPUT_COHORT_PATH):
        raise FileNotFoundError(f"Pilot cohort file not found: {INPUT_COHORT_PATH}")

    cohort_df = pd.read_csv(INPUT_COHORT_PATH)
    total_records = len(cohort_df)
    print(f"Loaded cohort: {total_records} records from {INPUT_COHORT_PATH}")
    print(f"Weather Model: ECMWF ERA5 Reanalysis (explicitly 'models={MODEL_NAME}')")
    print(f"Timezone: {TIMEZONE} (UTC+8 / Malaysian Standard Time)")

    cache = load_cache()
    print(f"Existing cached queries: {len(cache)}")

    enriched_records = []
    audit_stats = {
        "total": total_records,
        "cache_hits": 0,
        "api_calls": 0,
        "success": 0,
        "api_failures": 0,
        "missing_data_points": 0
    }

    start_exec_time = datetime.utcnow().isoformat() + "Z"

    for idx, row in cohort_df.iterrows():
        sample_id = row["sample_id"]
        lat = float(row["latitude"])
        lon = float(row["longitude"])
        target_date = str(row["date"])

        payload, err, from_cache = fetch_rainfall_series(lat, lon, target_date, cache)

        if from_cache:
            audit_stats["cache_hits"] += 1
        else:
            audit_stats["api_calls"] += 1

        rec = row.to_dict()
        rec["weather_model"] = "ECMWF_ERA5_REANALYSIS"
        rec["weather_api_provider"] = "Open-Meteo_Archive_v1"
        rec["rain_spatial_res_deg"] = 0.25
        rec["rain_spatial_res_km"] = 25.0
        rec["rain_units"] = "mm"
        rec["rain_accumulation_timezone"] = TIMEZONE
        rec["extraction_timestamp_utc"] = start_exec_time

        if err or payload is None:
            audit_stats["api_failures"] += 1
            print(f"[{idx+1:02d}/{total_records}] {sample_id} ({target_date}) ERROR: {err}")
            rec["rain_1d_prior_mm"] = np.nan
            rec["rain_3d_prior_mm"] = np.nan
            rec["rain_7d_prior_mm"] = np.nan
            rec["rain_event_day_retrospective_mm"] = np.nan
            rec["missing_rainfall_flag"] = True
            rec["rainfall_qc_status"] = f"FAILED: {err}"
            enriched_records.append(rec)
            continue

        # Extract daily precipitation time series
        daily_times = payload["daily"]["time"]
        daily_vals = payload["daily"]["precipitation_sum"]

        # Expected dates from D-7 to D
        target_dt = datetime.strptime(target_date, "%Y-%m-%d")
        expected_dates = [(target_dt - timedelta(days=d)).strftime("%Y-%m-%d") for d in range(7, -1, -1)]

        # Map dates to values
        date_to_val = dict(zip(daily_times, daily_vals))

        # Check for completeness and None values
        window_vals = [date_to_val.get(d) for d in expected_dates]
        has_none = any(v is None for v in window_vals)

        if has_none:
            audit_stats["missing_data_points"] += 1
            print(f"[{idx+1:02d}/{total_records}] {sample_id} ({target_date}) INCOMPLETE: contains None in series")
            rec["rain_1d_prior_mm"] = np.nan
            rec["rain_3d_prior_mm"] = np.nan
            rec["rain_7d_prior_mm"] = np.nan
            rec["rain_event_day_retrospective_mm"] = np.nan
            rec["missing_rainfall_flag"] = True
            rec["rainfall_qc_status"] = "INCOMPLETE_SERIES_NONE_VALUES"
        else:
            # All 8 values are valid floats
            # expected_dates: [D-7, D-6, D-5, D-4, D-3, D-2, D-1, D]
            # indices:         0    1    2    3    4    5    6    7
            rain_d1_prior = float(window_vals[6])  # D-1
            rain_d3_prior = float(sum(window_vals[4:7]))  # D-3, D-2, D-1
            rain_d7_prior = float(sum(window_vals[0:7]))  # D-7 through D-1
            rain_event_day = float(window_vals[7])  # D (retrospective)

            rec["rain_1d_prior_mm"] = round(rain_d1_prior, 2)
            rec["rain_3d_prior_mm"] = round(rain_d3_prior, 2)
            rec["rain_7d_prior_mm"] = round(rain_d7_prior, 2)
            rec["rain_event_day_retrospective_mm"] = round(rain_event_day, 2)
            rec["missing_rainfall_flag"] = False
            rec["rainfall_qc_status"] = "VALID_ERA5"

            audit_stats["success"] += 1

            source_tag = "CACHE" if from_cache else "API"
            print(
                f"[{idx+1:02d}/{total_records}] {sample_id} ({rec['source_type']}) {target_date} "
                f"[{source_tag}] -> 1d_prior: {rain_d1_prior:5.1f} mm | "
                f"3d_prior: {rain_d3_prior:5.1f} mm | "
                f"7d_prior: {rain_d7_prior:5.1f} mm | "
                f"Event-D: {rain_event_day:5.1f} mm"
            )

        enriched_records.append(rec)

    # Save cache
    save_cache(cache)

    # Export enriched dataset
    out_df = pd.DataFrame(enriched_records)
    out_df.to_csv(OUTPUT_RAINFALL_PATH, index=False)
    print(f"\nSaved enriched dataset to: {OUTPUT_RAINFALL_PATH}")

    # Generate QA Report
    generate_qa_report(out_df, audit_stats)


def generate_qa_report(df, stats):
    print("\n" + "=" * 70)
    print("PHASE 4A RAINFALL FEATURE EXTRACTION QA REPORT")
    print("=" * 70)
    print(f"Total Cohort Records:      {stats['total']}")
    print(f"Cache Hits:                {stats['cache_hits']}")
    print(f"Live API Requests:         {stats['api_calls']}")
    print(f"Successful Extractions:    {stats['success']} ({stats['success']/stats['total']*100:.1f}%)")
    print(f"API Network Failures:      {stats['api_failures']}")
    print(f"Missing/None Data Series:  {stats['missing_data_points']}")
    print("-" * 70)

    # Summary Statistics by Target Group (Positives vs Pseudo-Negatives)
    pos_df = df[df["target"] == 1]
    neg_df = df[df["target"] == 0]

    def print_group_stats(group_name, gdf):
        print(f"\n--- {group_name} (N = {len(gdf)}) ---")
        for col in ["rain_1d_prior_mm", "rain_3d_prior_mm", "rain_7d_prior_mm", "rain_event_day_retrospective_mm"]:
            vals = gdf[col].dropna()
            print(
                f"  {col:<32}: Mean = {vals.mean():5.2f} mm | "
                f"Median = {vals.median():5.2f} mm | "
                f"IQR = [{vals.quantile(0.25):5.1f}, {vals.quantile(0.75):5.1f}] | "
                f"Max = {vals.max():5.1f} mm | "
                f"Zeros = {(vals == 0).sum()}/{len(vals)}"
            )

    print_group_stats("JPS POSITIVES (Flood Events)", pos_df)
    print_group_stats("PSEUDO-NEGATIVES (Background Land Samples)", neg_df)

    print("\n" + "=" * 70)


if __name__ == "__main__":
    run_pilot_extraction()
