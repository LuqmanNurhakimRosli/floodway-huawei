"""
FloodWay - Phase 4B: Terrain Feature Extraction Pipeline (Google Earth Engine)
Extracts elevation and slope using Copernicus DEM GLO-30 (30m resolution).
Processes datasets/floodway_pilot_rainfall_40.csv to produce datasets/floodway_pilot_features_40.csv.

IMPORTANT DSM CAVEAT:
Copernicus DEM GLO-30 is a Digital Surface Model (DSM), not a bare-earth Digital Terrain Model (DTM).
It measures elevations of reflective surfaces, including tree canopies (oil palm, rainforest)
and building heights, rather than bare ground.

Zero-Imputation Policy:
Missing or masked pixels are flagged with missing_terrain_flag=True and preserved as NaN.
No arbitrary TWI approximations are computed.
"""

import os
import sys
import pandas as pd
import numpy as np

# Input / Output Paths
INPUT_PATH = "datasets/floodway_pilot_rainfall_40.csv"
OUTPUT_PATH = "datasets/floodway_pilot_features_40.csv"


def extract_terrain_features(project_id=None):
    # 1. Verify ee import and initialization
    try:
        import ee
    except ImportError:
        print("\n[ERROR] The 'earthengine-api' Python package is not installed.")
        print("Please install it via: pip install earthengine-api")
        sys.exit(1)

    print("=" * 70)
    print("FloodWay Phase 4B: Terrain Feature Extraction (Copernicus DEM GLO-30)")
    print("=" * 70)

    try:
        if project_id:
            ee.Initialize(project=project_id)
        else:
            ee.Initialize()
        print("Google Earth Engine initialized successfully.")
    except Exception as e:
        print(f"\n[ERROR] Failed to initialize Google Earth Engine: {e}")
        print("\nPlease run authentication and specify your Google Cloud Project:")
        print("  1. In terminal: python -c \"import ee; ee.Authenticate()\"")
        print("  2. In script: set project_id='YOUR_GOOGLE_CLOUD_PROJECT_ID'")
        sys.exit(1)

    # 2. Load input cohort
    if not os.path.exists(INPUT_PATH):
        raise FileNotFoundError(f"Input file not found: {INPUT_PATH}")

    df = pd.read_csv(INPUT_PATH)
    print(f"Loaded {len(df)} records from {INPUT_PATH}")

    # 3. Define Copernicus DEM GLO-30 and Derived Slope
    # Copernicus DEM GLO-30: 30m resolution global surface model
    dem = ee.ImageCollection("COPERNICUS/DEM/GLO30").select("DEM").mosaic()
    slope = ee.Terrain.slope(dem).rename("slope_deg")
    
    # Combined terrain stack (band 0: DEM, band 1: slope_deg)
    terrain_stack = dem.addBands(slope)

    # 4. Build GEE FeatureCollection from point coordinates
    features = []
    for idx, row in df.iterrows():
        lat = float(row["latitude"])
        lon = float(row["longitude"])
        pt = ee.Geometry.Point([lon, lat])
        features.append(ee.Feature(pt, {"cohort_idx": idx, "sample_id": row["sample_id"]}))

    fc = ee.FeatureCollection(features)
    print(f"Sampling {len(features)} points against 30m Copernicus DEM...")

    # 5. Extract via reduceRegions
    sampled_fc = terrain_stack.reduceRegions(
        collection=fc,
        reducer=ee.Reducer.first(),
        scale=30
    )

    # 6. Retrieve extracted values from GEE
    sampled_dict = sampled_fc.getInfo()
    extracted_features = sampled_dict.get("features", [])

    # Map back by cohort_idx
    elev_map = {}
    slope_map = {}
    for feat in extracted_features:
        props = feat.get("properties", {})
        c_idx = props.get("cohort_idx")
        elev_val = props.get("DEM")
        slope_val = props.get("slope_deg")
        elev_map[c_idx] = elev_val
        slope_map[c_idx] = slope_val

    # 7. Merge and apply quality assurance rules
    df["elevation_m"] = [elev_map.get(i) for i in range(len(df))]
    df["slope_deg"] = [slope_map.get(i) for i in range(len(df))]
    df["dem_source"] = "COPERNICUS_GLO30"
    df["dem_product_type"] = "DSM_SURFACE_MODEL"
    df["dem_spatial_res_m"] = 30.0

    # Handle missing / masked values (do not replace with 0)
    missing_mask = df["elevation_m"].isna() | df["slope_deg"].isna()
    df["missing_terrain_flag"] = missing_mask
    df["terrain_qc_status"] = np.where(missing_mask, "MASKED_OR_NODATA", "VALID_COPERNICUS_30M")

    # Round valid numbers
    df["elevation_m"] = df["elevation_m"].round(2)
    df["slope_deg"] = df["slope_deg"].round(2)

    # 8. Export enriched dataset
    df.to_csv(OUTPUT_PATH, index=False)
    print(f"\nSuccessfully exported enriched dataset to: {OUTPUT_PATH}")

    # 9. Print QA Report
    print("\n" + "=" * 70)
    print("PHASE 4B TERRAIN FEATURE EXTRACTION QA REPORT")
    print("=" * 70)
    print(f"Total Cohort Records:      {len(df)}")
    print(f"Valid Extractions:         {(~missing_mask).sum()} ({(~missing_mask).sum()/len(df)*100:.1f}%)")
    print(f"Missing/Masked Values:     {missing_mask.sum()}")
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
    # If project ID is passed as argument: python extract_pilot_terrain_gee.py <project_id>
    proj_id = sys.argv[1] if len(sys.argv) > 1 else None
    extract_terrain_features(proj_id)
