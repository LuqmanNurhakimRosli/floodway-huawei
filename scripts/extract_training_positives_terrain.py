"""
scripts/extract_training_positives_terrain.py

Recomputes authentic empirical elevation and slope distributions for ALL 2,033 training positive candidates (2015-2019)
from Copernicus DEM GLO-30 on AWS S3, using coordinate-level disk caching and in-memory tile caching.
"""

import os
import math
import time
import json
import numpy as np
import pandas as pd
import rasterio
from rasterio.windows import Window

CACHE_PATH = "datasets/cache/copernicus_dem_coords_cache.json"
os.makedirs("datasets/cache", exist_ok=True)

# Load candidate positives
df_cand = pd.read_csv("datasets/jps_positives_peninsular_candidates.csv")
train_pos = df_cand[df_cand["year"] <= 2019].copy()
print(f"Total training positives: {len(train_pos)}")

unique_coords = train_pos[["latitude", "longitude"]].drop_duplicates().values
print(f"Unique training coordinates to process: {len(unique_coords)}")

# Load existing cache if any
cache = {}
if os.path.exists(CACHE_PATH):
    try:
        with open(CACHE_PATH, "r") as f:
            cache = json.load(f)
        print(f"Loaded existing cache with {len(cache)} coordinates.")
    except Exception as e:
        print(f"Cache load warning: {e}")

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

tile_cache = {}
t0 = time.time()
processed = 0
new_queries = 0

# Group unique coordinates by tile to minimize tile reopening
coord_list = []
for lat, lon in unique_coords:
    key = f"{lat:.4f}_{lon:.4f}"
    lat_floor = int(math.floor(lat))
    lon_floor = int(math.floor(lon))
    northing = f"N{lat_floor:02d}_00"
    easting = f"E{lon_floor:03d}_00"
    tile_name = f"Copernicus_DSM_COG_10_{northing}_{easting}_DEM"
    cog_url = f"https://copernicus-dem-30m.s3.amazonaws.com/{tile_name}/{tile_name}.tif"
    coord_list.append((cog_url, lat, lon, key))

# Sort by cog_url so we hit the same tile continuously
coord_list.sort(key=lambda x: x[0])

print(f"Beginning terrain extraction across unique coordinates...")
for cog_url, lat, lon, key in coord_list:
    processed += 1
    if key in cache:
        continue

    new_queries += 1
    try:
        if cog_url not in tile_cache:
            tile_cache[cog_url] = rasterio.open(cog_url)
        src = tile_cache[cog_url]

        py, px = src.index(lon, lat)
        if px < 1 or px >= src.width - 1 or py < 1 or py >= src.height - 1:
            cache[key] = {"elevation_m": None, "slope_deg": None, "status": "OUT_OF_BOUNDS"}
            continue

        patch = src.read(1, window=Window(px - 1, py - 1, 3, 3))
        if src.nodata is not None and np.any(patch == src.nodata):
            cache[key] = {"elevation_m": None, "slope_deg": None, "status": "NODATA"}
            continue
        if np.any(np.isnan(patch)) or np.any(patch < -500.0) or np.any(patch > 9000.0):
            cache[key] = {"elevation_m": None, "slope_deg": None, "status": "INVALID_PIXEL"}
            continue

        elev = round(float(patch[1, 1]), 2)
        slope = round(float(calculate_horn_slope(patch, lat)), 2)
        cache[key] = {"elevation_m": elev, "slope_deg": slope, "status": "VALID"}
    except Exception as e:
        cache[key] = {"elevation_m": None, "slope_deg": None, "status": f"ERROR_{str(e)}"}

    if new_queries % 100 == 0:
        elapsed = time.time() - t0
        print(f"  Processed {processed}/{len(coord_list)} ({new_queries} new queries) in {elapsed:.1f}s...")
        # Save cache periodically
        with open(CACHE_PATH, "w") as f:
            json.dump(cache, f)

# Final save
with open(CACHE_PATH, "w") as f:
    json.dump(cache, f)

total_elapsed = time.time() - t0
print(f"Extraction complete in {total_elapsed:.1f}s. Total cached: {len(cache)}")

# Close opened tile datasets
for src in tile_cache.values():
    src.close()

# Now map back to all 2,033 train positives
train_elevs = []
train_slopes = []
valid_count = 0
for _, row in train_pos.iterrows():
    key = f"{row['latitude']:.4f}_{row['longitude']:.4f}"
    res = cache.get(key, {})
    if res.get("status") == "VALID":
        train_elevs.append(res["elevation_m"])
        train_slopes.append(res["slope_deg"])
        valid_count += 1

train_elevs = np.array(train_elevs)
train_slopes = np.array(train_slopes)

print(f"\n--- EMPIRICAL TERRAIN DISTRIBUTIONS ACROSS ALL {len(train_pos)} TRAIN POSITIVES ---")
print(f"Valid terrain records: {valid_count} / {len(train_pos)} ({valid_count/len(train_pos):.2%})")
print(f"ELEVATION (m):")
print(f"  Min:    {np.min(train_elevs):.2f}")
print(f"  P05:    {np.percentile(train_elevs, 5):.2f}")
print(f"  P25:    {np.percentile(train_elevs, 25):.2f}")
print(f"  Median: {np.median(train_elevs):.2f}")
print(f"  Mean:   {np.mean(train_elevs):.2f}")
print(f"  P75:    {np.percentile(train_elevs, 75):.2f}")
print(f"  P95:    {np.percentile(train_elevs, 95):.2f}")
print(f"  Max:    {np.max(train_elevs):.2f}")

print(f"\nSLOPE (deg):")
print(f"  Min:    {np.min(train_slopes):.2f}")
print(f"  P05:    {np.percentile(train_slopes, 5):.2f}")
print(f"  P25:    {np.percentile(train_slopes, 25):.2f}")
print(f"  Median: {np.median(train_slopes):.2f}")
print(f"  Mean:   {np.mean(train_slopes):.2f}")
print(f"  P75:    {np.percentile(train_slopes, 75):.2f}")
print(f"  P95:    {np.percentile(train_slopes, 95):.2f}")
print(f"  Max:    {np.max(train_slopes):.2f}")
