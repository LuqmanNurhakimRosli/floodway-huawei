"""
FloodWay - Phase 4B: Terrain Feature Extraction (Google Colab / Rasterio COG Window Streaming)
Extracts elevation and slope using Copernicus DEM GLO-30 (30m resolution) from AWS Open Data.
Processes datasets/floodway_pilot_rainfall_40.csv to produce datasets/floodway_pilot_features_40.csv.

Data Source:
- AWS Open Data: 'copernicus-dem-30m' (Public S3 COG Bucket, eu-central-1)
- HTTP COG Base URL: https://copernicus-dem-30m.s3.amazonaws.com/
- Access requirements: 100% Free, NO API keys, NO AWS account, NO authentication.
- Spatial Resolution: 1 arc-second (~30 meters). CRS: WGS84 (EPSG:4326).
- Digital Surface Model (DSM): Reflects vegetation canopy and buildings, not bare earth.

Geospatial Method:
- Streams only a tiny 3x3 pixel window (~90m x 90m) per coordinate using HTTP byte-range requests.
- Calculates slope via Horn's finite-difference algorithm adjusted for local latitude geodesic distance.
- Zero-imputation policy: NoData or coastal masked pixels are flagged missing_terrain_flag=True (NaN).
- TWI approximation is strictly excluded.
"""

import os
import sys
import math
import time
import pandas as pd
import numpy as np

try:
    import rasterio
    from rasterio.windows import Window
except ImportError:
    print("[ERROR] 'rasterio' is required. In Google Colab or terminal, run: pip install rasterio")
    sys.exit(1)

INPUT_PATH = "datasets/floodway_pilot_rainfall_40.csv"
OUTPUT_PATH = "datasets/floodway_pilot_features_40.csv"


def calculate_horn_slope(patch, lat_deg):
    """
    Computes slope in degrees from a 3x3 elevation patch using Horn's algorithm.
    patch matrix layout:
      [ [z_tl, z_t, z_tr],
        [z_l,  z_c, z_r ],
        [z_bl, z_b, z_br] ]
    """
    z_tl, z_t, z_tr = patch[0, 0], patch[0, 1], patch[0, 2]
    z_l,  z_c, z_r  = patch[1, 0], patch[1, 1], patch[1, 2]
    z_bl, z_b, z_br = patch[2, 0], patch[2, 1], patch[2, 2]

    # Geodesic ground distances in meters for 1 arc-second (~1/3600 degree)
    # Latitude: 1 deg ~ 111,120 m -> 1 arcsec ~ 30.867 m
    # Longitude: 1 arcsec ~ 30.867 m * cos(lat)
    dy = 30.867
    lat_rad = math.radians(lat_deg)
    dx = 30.867 * math.cos(lat_rad)

    # Horn's weighted gradient
    dz_dx = ((z_tr + 2.0 * z_r + z_br) - (z_tl + 2.0 * z_l + z_bl)) / (8.0 * dx)
    dz_dy = ((z_tl + 2.0 * z_t + z_tr) - (z_bl + 2.0 * z_b + z_br)) / (8.0 * dy)

    rise_run = math.sqrt(dz_dx**2 + dz_dy**2)
    slope_deg = math.degrees(math.atan(rise_run))
    return slope_deg


def extract_point_terrain(lat, lon, tile_cache):
    """
    Retrieves a 3x3 patch via HTTP byte-range request from AWS Open Data COG.
    Returns (elevation_m, slope_deg, qc_status).
    """
    northing = f"N{int(math.floor(lat)):02d}_00"
    easting = f"E{int(math.floor(lon)):03d}_00"
    tile_name = f"Copernicus_DSM_COG_10_{northing}_{easting}_DEM"
    cog_url = f"https://copernicus-dem-30m.s3.amazonaws.com/{tile_name}/{tile_name}.tif"

    try:
        # Cache open dataset handle to avoid repeated SSL/header handshakes
        if cog_url not in tile_cache:
            tile_cache[cog_url] = rasterio.open(cog_url)
        src = tile_cache[cog_url]

        # Convert lat/lon (EPSG:4326) to pixel row/col
        py, px = src.index(lon, lat)

        # Ensure 3x3 window is inside raster bounds (1 to width-2, height-2)
        if px < 1 or px >= src.width - 1 or py < 1 or py >= src.height - 1:
            return np.nan, np.nan, "COORDINATE_ON_TILE_EDGE"

        # Read 3x3 window centered on pixel (px, py)
        # Window(col_off, row_off, width, height)
        win = Window(px - 1, py - 1, 3, 3)
        patch = src.read(1, window=win)

        # Check for NoData values or coastal voids
        nodata_val = src.nodata
        if nodata_val is not None:
            if np.any(patch == nodata_val):
                return np.nan, np.nan, "CONTAINS_NODATA_PIXEL"

        if np.any(np.isnan(patch)) or np.any(patch < -500.0) or np.any(patch > 9000.0):
            return np.nan, np.nan, "INVALID_ELEVATION_VALUE"

        center_elevation = float(patch[1, 1])
        slope_deg = calculate_horn_slope(patch, lat)

        return round(center_elevation, 2), round(slope_deg, 2), "VALID_COPERNICUS_30M"

    except Exception as e:
        return np.nan, np.nan, f"HTTP_RANGE_READ_ERROR: {str(e)}"


def run_terrain_extraction():
    print("=" * 70)
    print("FloodWay Phase 4B: Terrain Feature Extraction (AWS Copernicus GLO-30)")
    print("=" * 70)

    if not os.path.exists(INPUT_PATH):
        raise FileNotFoundError(f"Input file not found: {INPUT_PATH}")

    df = pd.read_csv(INPUT_PATH)
    total_records = len(df)
    print(f"Loaded cohort: {total_records} records from {INPUT_PATH}")
    print("DEM Source: AWS Open Data (Copernicus DEM GLO-30 COG, 30m resolution)")
    print("Access: Public HTTPS Range Requests (No auth / No API keys required)")

    elevations = []
    slopes = []
    qc_statuses = []
    missing_flags = []

    tile_cache = {}

    start_time = time.time()
    for idx, row in df.iterrows():
        sample_id = row["sample_id"]
        lat = float(row["latitude"])
        lon = float(row["longitude"])

        elev, slope, qc = extract_point_terrain(lat, lon, tile_cache)

        is_missing = np.isnan(elev) or np.isnan(slope)
        missing_flags.append(is_missing)
        elevations.append(elev)
        slopes.append(slope)
        qc_statuses.append(qc)

        status_tag = "VALID" if not is_missing else "MISSING"
        elev_str = f"{elev:6.2f} m" if not np.isnan(elev) else "   NaN  "
        slope_str = f"{slope:5.2f} deg" if not np.isnan(slope) else "  NaN  "
        print(f"[{idx+1:02d}/{total_records}] {sample_id} ({row['state']}) -> Elev: {elev_str} | Slope: {slope_str} | {qc}")

    # Close open raster handles
    for src in tile_cache.values():
        src.close()

    elapsed = time.time() - start_time
    print(f"\nExtraction completed in {elapsed:.2f} seconds.")

    # Enrich dataframe
    df["elevation_m"] = elevations
    df["slope_deg"] = slopes
    df["dem_source"] = "AWS_COPERNICUS_GLO30_COG"
    df["dem_product_type"] = "DSM_SURFACE_MODEL"
    df["dem_spatial_res_m"] = 30.0
    df["dem_crs"] = "EPSG:4326"
    df["missing_terrain_flag"] = missing_flags
    df["terrain_qc_status"] = qc_statuses

    # Export
    df.to_csv(OUTPUT_PATH, index=False)
    print(f"Exported enriched dataset to: {OUTPUT_PATH}")

    # QA Summary
    print("\n" + "=" * 70)
    print("PHASE 4B TERRAIN EXTRACTION QA REPORT")
    print("=" * 70)
    valid_count = sum(not m for m in missing_flags)
    missing_count = sum(missing_flags)
    print(f"Total Cohort Records:      {total_records}")
    print(f"Valid Extractions:         {valid_count} ({valid_count/total_records*100:.1f}%)")
    print(f"Missing / Masked Points:   {missing_count}")
    print("-" * 70)

    for group_name, target_val in [("POSITIVES (Flood Events)", 1), ("PSEUDO-NEGATIVES (Background)", 0)]:
        gdf = df[df["target"] == target_val]
        print(f"\n--- {group_name} (N = {len(gdf)}) ---")
        for col in ["elevation_m", "slope_deg"]:
            vals = gdf[col].dropna()
            if len(vals) > 0:
                print(
                    f"  {col:<16}: Mean = {vals.mean():6.2f} | "
                    f"Median = {vals.median():6.2f} | "
                    f"IQR = [{vals.quantile(0.25):5.1f}, {vals.quantile(0.75):5.1f}] | "
                    f"Min = {vals.min():5.1f} | Max = {vals.max():5.1f}"
                )
            else:
                print(f"  {col:<16}: All values missing")
    print("=" * 70)


if __name__ == "__main__":
    run_terrain_extraction()
