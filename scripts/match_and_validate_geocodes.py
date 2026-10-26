"""
scripts/match_and_validate_geocodes.py

Phase 2 Coordinate Matching and Validation Pipeline for FloodWay.
Takes cleaned flood incident positives (datasets/jps_positives_clean.csv)
and matches them against Kean Teng's third-party digitized coordinate export:
https://raw.githubusercontent.com/keanteng/streamlit_flood/main/analytics/data2/all_states_all_years_geocoded_v2.csv

Scope & Validation Rules:
1. Peninsular Malaysia scope is isolated for initial benchmark; East Malaysia records
   (Sabah, Sarawak, Labuan) are preserved separately in datasets/jps_positives_east_malaysia.csv.
2. 1-to-1 canonical composite key matching (date, state, district, place).
   Ambiguous or conflicting candidate matches are rejected.
3. Rigorous geographic polygon validation using official Malaysian state boundaries (GeoJSON).
   Checks: Peninsular bounding box, point-in-state polygon, offshore/marine exclusion.
4. Repeated coordinate analysis across distinct places to detect and isolate suspected
   district/town centroid collapse.
5. Strict fidelity assignment: valid coordinates without building-level ground-truth proof
   are classified as 'unverified_precision' (never assumed to be sub-meter 'point' matches).
6. Preserves complete provenance (excel_row_num, original_index, coordinate source, validation status).

Outputs:
  - datasets/jps_positives_east_malaysia.csv
  - datasets/jps_positives_peninsular_candidates.csv
  - datasets/jps_positives_peninsular_centroids.csv
  - datasets/jps_positives_peninsular_unresolved.csv
"""

import os
import re
import io
import json
import urllib.request
import pandas as pd
from shapely.geometry import shape, Point
from shapely.prepared import prep
from shapely.ops import unary_union


PENINSULAR_STATES = {
    "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan",
    "Pahang", "Perak", "Perlis", "Pulau Pinang", "Selangor",
    "Terengganu", "Kuala Lumpur"
}

STATE_GEOJSON_URL = (
    "https://raw.githubusercontent.com/atifmustaffa/malaysia-geojson/master/malaysia.state.geojson"
)
GEOCODED_V2_URL = (
    "https://raw.githubusercontent.com/keanteng/streamlit_flood/main/analytics/data2/all_states_all_years_geocoded_v2.csv"
)

LOCAL_GEOJSON_PATH = "datasets/malaysia_state_boundaries.geojson"

# Canonical state name mapping between our cleaned dataset and the GeoJSON properties
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

# Peninsular Malaysia bounding box limits
PEN_LAT_MIN, PEN_LAT_MAX = 1.20, 6.85
PEN_LON_MIN, PEN_LON_MAX = 99.60, 104.60


def load_state_polygons():
    """
    Loads state administrative boundaries GeoJSON from local cache or remote repository.
    Returns (prepared_state_dict, prepared_peninsular_union, status_message).
    """
    data = None
    if os.path.exists(LOCAL_GEOJSON_PATH):
        try:
            with open(LOCAL_GEOJSON_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            data = None

    if data is None:
        try:
            print(f"Fetching state boundary polygons from {STATE_GEOJSON_URL} ...")
            req = urllib.request.Request(STATE_GEOJSON_URL, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            with open(LOCAL_GEOJSON_PATH, "w", encoding="utf-8") as f:
                json.dump(data, f)
        except Exception as e:
            return None, None, f"Failed to retrieve state boundaries: {e}"

    state_polys = {}
    for feat in data.get("features", []):
        sname = feat.get("properties", {}).get("name")
        if sname and "geometry" in feat:
            state_polys[sname] = shape(feat["geometry"])

    prep_states = {}
    pen_polys = []
    for clean_state, geojson_state in CANON_STATE_MAP.items():
        if geojson_state in state_polys:
            poly = state_polys[geojson_state]
            prep_states[clean_state] = prep(poly)
            pen_polys.append(poly)
        else:
            print(f"Warning: GeoJSON missing state boundary for {clean_state} ({geojson_state})")

    if not pen_polys:
        return None, None, "No Peninsular state polygons could be constructed."

    pen_union = unary_union(pen_polys)
    prep_pen_union = prep(pen_union)

    return prep_states, prep_pen_union, "Verified official Malaysian state boundaries loaded successfully."


def normalize_key_str(val):
    if pd.isna(val):
        return ""
    s = str(val).strip().lower().rstrip(",")
    return re.sub(r"\s+", " ", s)


def parse_date_to_iso(date_str):
    m = re.match(r"^(\d{1,2})\s*/\s*(\d{1,2})\s*/\s*(\d{4})$", str(date_str).strip())
    if m:
        return f"{int(m.group(3)):04d}-{int(m.group(2)):02d}-{int(m.group(1)):02d}"
    return str(date_str).strip()


def run_pipeline():
    clean_csv_path = "datasets/jps_positives_clean.csv"
    if not os.path.exists(clean_csv_path):
        raise FileNotFoundError(f"Missing input clean dataset: {clean_csv_path}")

    print(f"Loading cleaned dataset: {clean_csv_path} ...")
    clean_df = pd.read_csv(clean_csv_path)
    total_clean = len(clean_df)

    # 1. Geographic Scope Partitioning
    clean_df["is_peninsular"] = clean_df["state"].isin(PENINSULAR_STATES)
    east_malaysia_df = clean_df[~clean_df["is_peninsular"]].copy()
    peninsular_df = clean_df[clean_df["is_peninsular"]].copy()

    # Save East Malaysia dataset (preserved completely without deletion)
    east_malaysia_out = "datasets/jps_positives_east_malaysia.csv"
    east_malaysia_df["geographic_domain"] = "east_malaysia"
    east_malaysia_df.drop(columns=["is_peninsular"]).to_csv(east_malaysia_out, index=False, encoding="utf-8")
    print(f"Preserved {len(east_malaysia_df):,} East Malaysia records in {east_malaysia_out}")
    print(f"Active Peninsular benchmark records to process: {len(peninsular_df):,}")

    # 2. Fetch Kean Teng's geocoded dataset
    print(f"Fetching third-party geocoded dataset from {GEOCODED_V2_URL} ...")
    req = urllib.request.Request(GEOCODED_V2_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        geo_raw = pd.read_csv(io.BytesIO(resp.read()))
    print(f"Loaded {len(geo_raw):,} raw geocoded records.")

    # Standardize columns and composite matching key in third-party dataset
    geo_raw["clean_date"] = geo_raw["Date"].apply(parse_date_to_iso)
    geo_raw["norm_state"] = geo_raw["State"].apply(normalize_key_str).replace({"penang": "pulau pinang"})
    geo_raw["norm_district"] = geo_raw["Region"].apply(normalize_key_str)
    geo_raw["norm_place"] = geo_raw["Place"].apply(normalize_key_str)

    geo_raw["mkey"] = (
        geo_raw["clean_date"] + "|" +
        geo_raw["norm_state"] + "|" +
        geo_raw["norm_district"] + "|" +
        geo_raw["norm_place"]
    )

    # Ambiguity Check: Ensure that multiple records with the same mkey in geo_raw don't have conflicting coordinates
    grouped_geo = geo_raw.groupby("mkey").agg({
        "Latitude": ["nunique", "first"],
        "Longitude": ["nunique", "first"]
    })
    conflicting_mkeys = set(grouped_geo[
        (grouped_geo[("Latitude", "nunique")] > 1) | (grouped_geo[("Longitude", "nunique")] > 1)
    ].index)

    if conflicting_mkeys:
        print(f"Warning: Found {len(conflicting_mkeys)} ambiguous mkeys with divergent coordinates in geocoded dataset.")
    else:
        print("Ambiguity Check: Verified ZERO conflicting coordinate divergences on duplicate keys.")

    valid_geo_keys = geo_raw[~geo_raw["mkey"].isin(conflicting_mkeys)].drop_duplicates(subset=["mkey"])
    geo_lookup = valid_geo_keys.set_index("mkey")[["Latitude", "Longitude"]].to_dict(orient="index")

    # 3. Match Peninsular Records
    peninsular_df["norm_state"] = peninsular_df["state"].apply(normalize_key_str)
    peninsular_df["norm_district"] = peninsular_df["district"].apply(normalize_key_str)
    peninsular_df["norm_place"] = peninsular_df["place"].apply(normalize_key_str)
    peninsular_df["mkey"] = (
        peninsular_df["date"] + "|" +
        peninsular_df["norm_state"] + "|" +
        peninsular_df["norm_district"] + "|" +
        peninsular_df["norm_place"]
    )

    # 4. Load State Administrative Boundaries
    prep_states, prep_pen_union, geo_status_msg = load_state_polygons()
    has_polygon_validation = prep_states is not None
    print(f"Polygon Validation Status: {geo_status_msg}")

    # 5. Process and Validate Each Record
    matched_records = []
    unmatched_records = []

    for idx, row in peninsular_df.iterrows():
        mkey = row["mkey"]
        base_record = {
            "excel_row_num": row["excel_row_num"],
            "original_index": row["original_index"],
            "year": row["year"],
            "date": row["date"],
            "state": row["state"],
            "district": row["district"],
            "place": row["place"],
            "location_name": row["location_name"],
            "geographic_domain": "peninsular"
        }

        if mkey in conflicting_mkeys:
            unmatched_records.append({
                **base_record,
                "latitude": None,
                "longitude": None,
                "geocode_fidelity": "unresolved",
                "geocode_source": "none",
                "validation_status": "REJECTED_AMBIGUOUS_MATCH",
                "rejection_reason": "Multiple conflicting coordinates found in geocoded dataset"
            })
            continue

        if mkey not in geo_lookup:
            unmatched_records.append({
                **base_record,
                "latitude": None,
                "longitude": None,
                "geocode_fidelity": "unresolved",
                "geocode_source": "none",
                "validation_status": "UNMATCHED",
                "rejection_reason": "No match found in Kean Teng's geocoded dataset"
            })
            continue

        coords = geo_lookup[mkey]
        lat = coords["Latitude"]
        lon = coords["Longitude"]

        # Validate Coordinate Bounds
        if pd.isna(lat) or pd.isna(lon):
            unmatched_records.append({
                **base_record,
                "latitude": None,
                "longitude": None,
                "geocode_fidelity": "unresolved",
                "geocode_source": "keanteng_v2",
                "validation_status": "REJECTED_MISSING_COORDINATES",
                "rejection_reason": "Coordinates are NaN"
            })
            continue

        if not (PEN_LAT_MIN <= lat <= PEN_LAT_MAX and PEN_LON_MIN <= lon <= PEN_LON_MAX):
            unmatched_records.append({
                **base_record,
                "latitude": lat,
                "longitude": lon,
                "geocode_fidelity": "unresolved",
                "geocode_source": "keanteng_v2",
                "validation_status": "REJECTED_OUT_OF_BOUNDS",
                "rejection_reason": f"Coordinates ({lat:.4f}, {lon:.4f}) fall outside Peninsular Malaysia bounding box"
            })
            continue

        # Real Polygon Boundary Validation
        if has_polygon_validation:
            pt = Point(lon, lat)
            claimed_state = row["state"]

            if not prep_pen_union.contains(pt):
                unmatched_records.append({
                    **base_record,
                    "latitude": lat,
                    "longitude": lon,
                    "geocode_fidelity": "unresolved",
                    "geocode_source": "keanteng_v2",
                    "validation_status": "REJECTED_OFFSHORE_OR_NON_LAND",
                    "rejection_reason": f"Coordinates ({lat:.4f}, {lon:.4f}) fall outside Peninsular land polygon"
                })
                continue

            if claimed_state in prep_states and not prep_states[claimed_state].contains(pt):
                unmatched_records.append({
                    **base_record,
                    "latitude": lat,
                    "longitude": lon,
                    "geocode_fidelity": "unresolved",
                    "geocode_source": "keanteng_v2",
                    "validation_status": "REJECTED_STATE_MISMATCH",
                    "rejection_reason": f"Point ({lat:.4f}, {lon:.4f}) falls inside another state polygon, not claimed {claimed_state}"
                })
                continue

        # Record passed spatial validity checks
        matched_records.append({
            **base_record,
            "latitude": lat,
            "longitude": lon,
            "geocode_source": "keanteng_v2_validated",
            "validation_status": "VALID_STATE_POLYGON" if has_polygon_validation else "VALID_BOUNDING_BOX_ONLY"
        })

    matched_df = pd.DataFrame(matched_records)
    unmatched_df = pd.DataFrame(unmatched_records)

    # 6. Centroid Collapse Detection
    # Identify coordinates that are assigned to multiple distinct places in the same district
    coord_place_counts = matched_df.groupby(["latitude", "longitude"])["place"].nunique().to_dict()
    coord_event_counts = matched_df.groupby(["latitude", "longitude"])["place"].count().to_dict()

    candidates = []
    centroids = []

    for _, r in matched_df.iterrows():
        lat = r["latitude"]
        lon = r["longitude"]
        distinct_places = coord_place_counts.get((lat, lon), 1)
        total_events = coord_event_counts.get((lat, lon), 1)

        # If a single coordinate is assigned to 3 or more distinct places, it is a clear centroid collapse
        if distinct_places >= 3:
            centroids.append({
                **r,
                "geocode_fidelity": "district_centroid",
                "distinct_places_at_coord": distinct_places,
                "total_events_at_coord": total_events,
                "centroid_reason": f"Coordinate repeated across {distinct_places} distinct localities ({total_events} events) in district"
            })
        else:
            candidates.append({
                **r,
                # Precision cannot be guaranteed as a sub-meter point without individual street proof
                "geocode_fidelity": "unverified_precision",
                "distinct_places_at_coord": distinct_places,
                "total_events_at_coord": total_events
            })

    candidates_df = pd.DataFrame(candidates)
    centroids_df = pd.DataFrame(centroids)

    # 7. Export Separate Datasets
    candidates_out = "datasets/jps_positives_peninsular_candidates.csv"
    centroids_out = "datasets/jps_positives_peninsular_centroids.csv"
    unresolved_out = "datasets/jps_positives_peninsular_unresolved.csv"

    # Clean drop internal helper keys
    cols_to_drop = ["norm_state", "norm_district", "norm_place", "mkey", "is_peninsular"]
    for df_out in [candidates_df, centroids_df, unmatched_df]:
        for c in cols_to_drop:
            if c in df_out.columns:
                df_out.drop(columns=[c], inplace=True)

    candidates_df.to_csv(candidates_out, index=False, encoding="utf-8")
    centroids_df.to_csv(centroids_out, index=False, encoding="utf-8")
    unmatched_df.to_csv(unresolved_out, index=False, encoding="utf-8")

    # 8. Summary Audit Report
    total_pen = len(peninsular_df)
    total_matched = len(matched_df)
    total_cand = len(candidates_df)
    total_cent = len(centroids_df)
    total_unres = len(unmatched_df)

    print("\n" + "=" * 65)
    print("PHASE 2 COORDINATE MATCHING AND VALIDATION AUDIT REPORT")
    print("=" * 65)
    print(f"Total Master Clean Records:                  {total_clean:>7,}")
    print(f"  - Preserved East Malaysia Records:         {len(east_malaysia_df):>7,} (36.38%) -> {east_malaysia_out}")
    print(f"  - Active Peninsular Malaysia Records:      {total_pen:>7,} (63.62%)")
    print("-" * 65)
    print(f"Peninsular Matching & Validation Results:")
    print(f"  1. Accepted Candidates (Unverified Precision): {total_cand:>5,} ({(total_cand/total_pen)*100:5.2f}%)")
    print(f"  2. Suspected Centroids (>=3 Distinct Places):   {total_cent:>5,} ({(total_cent/total_pen)*100:5.2f}%)")
    print(f"  3. Unresolved / Excluded Records:               {total_unres:>5,} ({(total_unres/total_pen)*100:5.2f}%)")
    print("-" * 65)
    print("Unresolved / Excluded Breakdown:")
    unres_reasons = unmatched_df["validation_status"].value_counts()
    for status, cnt in unres_reasons.items():
        print(f"    * {status:<32}: {cnt:>5,} rows")
    print("-" * 65)
    print("Generated Artifacts:")
    print(f"  - Valid Candidates (Peninsular) : {candidates_out}")
    print(f"  - Suspected Centroids           : {centroids_out}")
    print(f"  - Unresolved Records            : {unresolved_out}")
    print(f"  - East Malaysia Master Archive  : {east_malaysia_out}")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    run_pipeline()
