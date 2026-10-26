"""
scripts/clean_positives.py

Phase 1 Data Cleaning Pipeline for FloodWay JPS Flood Incidents.
Reads raw multi-year extracted reports (datasets/all_states_all_years.xlsx)
and produces:
  1. datasets/jps_positives_clean.csv (verified, unambiguous positive events)
  2. datasets/jps_positives_review.csv (unresolved, duplicate, or flagged records)

Non-destructive: The original XLSX is never modified.
Fully reproducible and deterministic.
"""

import os
import re
from datetime import datetime
import pandas as pd


def normalize_state(val):
    if pd.isna(val):
        return ""
    s = str(val).strip()
    # Canonical state dictionary
    canon = {
        "johor": "Johor",
        "kedah": "Kedah",
        "kelantan": "Kelantan",
        "melaka": "Melaka",
        "negeri sembilan": "Negeri Sembilan",
        "pahang": "Pahang",
        "perak": "Perak",
        "perlis": "Perlis",
        "penang": "Pulau Pinang",
        "pulau pinang": "Pulau Pinang",
        "sabah": "Sabah",
        "sarawak": "Sarawak",
        "selangor": "Selangor",
        "terengganu": "Terengganu",
        "kuala lumpur": "Kuala Lumpur",
        "wp kuala lumpur": "Kuala Lumpur",
        "labuan": "Labuan",
        "wp labuan": "Labuan",
        "putrajaya": "Putrajaya",
        "wp putrajaya": "Putrajaya"
    }
    return canon.get(s.lower(), s.title())


def normalize_district(val):
    if pd.isna(val):
        return ""
    d = str(val).strip().rstrip(",")
    # Remove excessive internal spaces
    d = re.sub(r"\s+", " ", d)
    # Title-case district name
    return d.title()


def normalize_place(val):
    if pd.isna(val):
        return ""
    p = str(val).strip().rstrip(",")
    p = re.sub(r"\s+", " ", p)
    # Standardize common abbreviations while preserving kampung names
    p = re.sub(r"^kg\b\.?", "Kg.", p, flags=re.IGNORECASE)
    p = re.sub(r"^sg\b\.?", "Sg.", p, flags=re.IGNORECASE)
    return p


def parse_and_validate_date(date_val, year_val):
    """
    Parses date string into ISO YYYY-MM-DD.
    Only automatically corrects unambiguous D/M/YYYY or DD/MM/YYYY dates
    with internal whitespace cleaned.
    Returns (iso_date_str, error_category, error_detail).
    """
    if pd.isna(date_val):
        return None, "MISSING_DATE", "Date field is NaN or empty"

    d_str = str(date_val).strip()
    if not d_str:
        return None, "MISSING_DATE", "Date string is blank"

    # Normalize whitespace around slashes: e.g. '15 /1/2019' -> '15/1/2019'
    d_clean = re.sub(r"\s*/\s*", "/", d_str)

    # Check for Excel serial dates like 43477//2019
    if re.search(r"\b4\d{4}\b", d_clean):
        return None, "EXCEL_SERIAL_DATE", f"Date '{d_str}' contains an unformatted Excel serial number"

    # Check for date ranges like 15-16/04/2018 or 3-7/01/
    if re.search(r"\d+\s*-\s*\d+", d_clean):
        return None, "DATE_RANGE", f"Date '{d_str}' specifies a multi-day range rather than a single event date"

    # Check for dot notation e.g. 18.1/2017
    if re.search(r"^\d+\.\d+", d_clean):
        return None, "DOT_DATE_SYNTAX", f"Date '{d_str}' uses dot separator syntax"

    # Standard slash match D/M/YYYY or DD/MM/YYYY
    m = re.match(r"^(\d{1,2})/(\d{1,2})/(\d{4})$", d_clean)
    if not m:
        return None, "NON_STANDARD_DATE_FORMAT", f"Date '{d_str}' does not conform to D/M/YYYY or DD/MM/YYYY syntax"

    day, month, yr = int(m.group(1)), int(m.group(2)), int(m.group(3))

    # Verify year match with Year column if Year is known
    if not pd.isna(year_val) and int(year_val) != yr:
        return None, "YEAR_MISMATCH", f"Year in date string ({yr}) contradicts Year column ({int(year_val)})"

    # Check month range (detect swapped MM/DD like 4/13 or impossible 20/19)
    if month < 1 or month > 12:
        return None, "INVALID_MONTH", f"Month {month} in date '{d_str}' is out of range (1-12); possibly swapped MM/DD or typo"

    # Validate calendar date with datetime
    try:
        dt = datetime(yr, month, day)
        return dt.strftime("%Y-%m-%d"), None, None
    except ValueError as e:
        return None, "INVALID_CALENDAR_DATE", f"Date '{d_str}' failed calendar validation: {e}"


def run_cleaning_pipeline(
    input_path="datasets/all_states_all_years.xlsx",
    output_clean_path="datasets/jps_positives_clean.csv",
    output_review_path="datasets/jps_positives_review.csv"
):
    print(f"Reading raw workbook: {input_path} ...")
    df = pd.read_excel(input_path, sheet_name=0)
    total_raw = len(df)
    print(f"Total raw records loaded: {total_raw}")

    clean_rows = []
    review_rows = []

    # Track exact duplicate occurrences
    seen_exact = set()
    exact_duplicate_count = 0

    for idx, row in df.iterrows():
        excel_row_num = idx + 2  # 1-indexed Excel row (header is row 1)
        raw_year = row["Year"]
        raw_date_temp = row["Date_Temp"]
        raw_date = row["Date"]
        raw_state = row["State"]
        raw_region = row["Region"]
        raw_place = row["Place"]
        raw_name = row["Name"]

        # Base record info for review log
        review_base = {
            "excel_row_num": excel_row_num,
            "original_index": idx,
            "raw_year": raw_year,
            "raw_date_temp": raw_date_temp,
            "raw_date": raw_date,
            "raw_state": raw_state,
            "raw_region": raw_region,
            "raw_place": raw_place,
            "raw_name": raw_name,
        }

        # 1. Exact Duplicate Audit Check
        raw_signature = (
            str(raw_year),
            str(raw_date_temp).strip(),
            str(raw_date).strip(),
            str(raw_state).strip(),
            str(raw_region).strip(),
            str(raw_place).strip(),
            str(raw_name).strip()
        )
        if raw_signature in seen_exact:
            exact_duplicate_count += 1
            review_rows.append({
                **review_base,
                "issue_category": "EXACT_DUPLICATE",
                "issue_detail": "Exact duplicate of an earlier record in the dataset"
            })
            continue
        seen_exact.add(raw_signature)

        # 2. Flagged Year Checks (Manual Verification Required)
        if pd.isna(raw_year):
            review_rows.append({
                **review_base,
                "issue_category": "MISSING_YEAR",
                "issue_detail": "Year is NaN; requires verification from JPS report"
            })
            continue

        if int(raw_year) == 2022:
            review_rows.append({
                **review_base,
                "issue_category": "FLAGGED_YEAR_2022",
                "issue_detail": "Tagged as 2022 in source table; suspected Dec 2021 Selangor flood requiring verification"
            })
            continue

        # 3. Missing Essential Location Fields
        if pd.isna(raw_state) or str(raw_state).strip() == "":
            review_rows.append({
                **review_base,
                "issue_category": "MISSING_STATE",
                "issue_detail": "State is missing or empty"
            })
            continue

        if pd.isna(raw_region) or str(raw_region).strip() == "":
            review_rows.append({
                **review_base,
                "issue_category": "MISSING_REGION",
                "issue_detail": "District/Region is missing or empty"
            })
            continue

        if pd.isna(raw_place) or str(raw_place).strip() == "":
            review_rows.append({
                **review_base,
                "issue_category": "MISSING_PLACE",
                "issue_detail": "Place/Locality name is missing or empty"
            })
            continue

        # 4. Date Standardization & Validation
        iso_date, date_err_cat, date_err_msg = parse_and_validate_date(raw_date, raw_year)
        if date_err_cat:
            review_rows.append({
                **review_base,
                "issue_category": date_err_cat,
                "issue_detail": date_err_msg
            })
            continue

        # 5. Text Normalization
        clean_state = normalize_state(raw_state)
        clean_district = normalize_district(raw_region)
        clean_place = normalize_place(raw_place)
        clean_location_name = f"{clean_place}, {clean_district}, {clean_state}, Malaysia"

        clean_rows.append({
            "excel_row_num": excel_row_num,
            "original_index": idx,
            "year": int(raw_year),
            "date": iso_date,
            "state": clean_state,
            "district": clean_district,
            "place": clean_place,
            "location_name": clean_location_name
        })

    # Convert to DataFrames
    df_clean = pd.DataFrame(clean_rows)
    df_review = pd.DataFrame(review_rows)

    # Secondary deduplication check on normalized records (date + location_name)
    norm_dups_count = 0
    if not df_clean.empty:
        norm_dup_mask = df_clean.duplicated(subset=["date", "location_name"], keep="first")
        norm_dups_count = int(norm_dup_mask.sum())
        if norm_dups_count > 0:
            print(f"Found {norm_dups_count} normalized duplicate location-date pairs. Moving to review log...")
            norm_dup_rows = df_clean[norm_dup_mask].copy()
            for _, nd_row in norm_dup_rows.iterrows():
                review_rows.append({
                    "excel_row_num": nd_row["excel_row_num"],
                    "original_index": nd_row["original_index"],
                    "raw_year": nd_row["year"],
                    "raw_date_temp": "",
                    "raw_date": nd_row["date"],
                    "raw_state": nd_row["state"],
                    "raw_region": nd_row["district"],
                    "raw_place": nd_row["place"],
                    "raw_name": nd_row["location_name"],
                    "issue_category": "NORMALIZED_DUPLICATE",
                    "issue_detail": "Duplicate location_name on identical date after whitespace/casing normalization"
                })
            df_clean = df_clean[~norm_dup_mask].copy()
            df_review = pd.DataFrame(review_rows)

    # Save to disk
    os.makedirs(os.path.dirname(output_clean_path), exist_ok=True)
    df_clean.to_csv(output_clean_path, index=False, encoding="utf-8")
    df_review.to_csv(output_review_path, index=False, encoding="utf-8")

    # Summary Statistics
    total_clean = len(df_clean)
    total_review = len(df_review)

    print("\n" + "=" * 60)
    print("PHASE 1 DATA CLEANING SUMMARY REPORT")
    print("=" * 60)
    print(f"Total Original Records in XLSX:       {total_raw:,}")
    print(f"Clean & Valid Positive Records:       {total_clean:,} ({(total_clean/total_raw)*100:.2f}%)")
    print(f"Total Unresolved / Flagged Records:   {total_review:,} ({(total_review/total_raw)*100:.2f}%)")
    print("-" * 60)
    print(f"  - Exact Duplicate Records:          {exact_duplicate_count:,}")
    print(f"  - Normalized Duplicate Records:     {norm_dups_count:,}")
    print("  - Flagged Issues Breakdown:")
    issue_counts = df_review["issue_category"].value_counts()
    for cat, cnt in issue_counts.items():
        print(f"      * {cat:<28} : {cnt:>4} rows")
    print("-" * 60)
    print(f"Saved Valid Dataset : {output_clean_path}")
    print(f"Saved Review Audit  : {output_review_path}")
    print("=" * 60 + "\n")

    return df_clean, df_review


if __name__ == "__main__":
    run_cleaning_pipeline()
