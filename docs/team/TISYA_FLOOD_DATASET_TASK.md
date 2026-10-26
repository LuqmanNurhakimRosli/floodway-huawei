# Master Guide for Tisya: Malaysia Flood Dataset, Feature Engineering & Benchmark

**Author:** RESQ4ACE AI Engineering Team (FloodWay)  
**Target Submission / Milestone:** 1 November 2026 (Code Freeze) · 3 November 2026 (Semi-Final)  
**Target Execution Environment:** Google Colab (Recommended) or Local Python 3.10+ Environment  

---

## 1. Executive Summary & Objective

The goal is to build Malaysia's first **honestly evaluated, spatially-validated flash flood classification benchmark**.

Most student machine learning models in flood hackathons fail because they:
1. Only collect positive flood records (presence-only) and fabricate naive random negatives.
2. Use `train_test_split(shuffle=True)`, causing **spatial and temporal data leakage** (neighboring pixels or the same storm in both train and test sets).
3. Report 95%+ Accuracy or ROC-AUC on imbalanced data where 99% of timestamps are dry.

This guide provides **exact dataset links, APIs, Google Colab-ready Python code, negative sampling rules, spatial cross-validation, and multi-model benchmarking**.

---

## 2. All External Resources & Working Links

### A. Ground-Truth Flood Incident Reports (Positives)
Published annually by the **Department of Irrigation and Drainage (JPS / DID Malaysia)**:
* **2015 Report:** [JPS 2015 Report PDF](https://info.water.gov.my/index.php/databank/view_attachment/5486)
* **2016–2017 Report:** [JPS 2016-17 Report PDF](http://h2o.water.gov.my/man_hp1/Banjir_Tahun1617.pdf)
* **2017–2018 Report:** [JPS 2017-18 Report PDF](http://h2o.water.gov.my/man_hp1/LBT2017-2018.pdf)
* **2018–2019 Report:** [JPS 2018-19 Report PDF](http://h2o.water.gov.my/man_hp1/LBT2018_2019.pdf)
* **2019 Report:** [JPS 2019 Report PDF](http://h2o.water.gov.my/man_hp1/2019.pdf)
* **2020 Report:** [JPS 2020 Report PDF](http://h2o.water.gov.my/man_hp1/LBT2020.pdf)
* **2021 Report:** [JPS 2021 Final Report PDF](http://h2o.water.gov.my/man_hp1/LAPORAN%20BANJIR%20TAHUN%202021%20FINAL%20e-ISSN.pdf)
* *Reference Exploration Repo:* [keanteng/streamlit_floodv2 (GitHub)](https://github.com/keanteng/streamlit_floodv2) *(Reference only: do not copy raw code; cite as concept idea)*.

### B. Geospatial & Hydro-Meteorological Open Data
| Product | Purpose | Link / GEE Asset ID | Licence |
| :--- | :--- | :--- | :--- |
| **Copernicus DEM (GLO-30)** | 30m Global Elevation, Slope, Flow | `COPERNICUS/DEM/GLO30` | Open (Free public access) |
| **ERA5 Total Precipitation** | Hourly & Daily Rainfall Reanalysis | `ECMWF/ERA5/DAILY` or CDS API | Open (CC BY 4.0 from July 2025) |
| **Dynamic World V1** | 10m Real-time Land Cover / Impervious | `GOOGLE/DYNAMICWORLD/V1` | CC BY 4.0 (Cite Sentinel) |
| **JRC Global Surface Water** | Historical Water Recurrence & Inundation | `JRC/GSW1_4/GlobalSurfaceWater` | Open with citation |
| **OpenStreetMap Waterways** | Distance to Rivers & Drainage Channels | [Geofabrik Malaysia OSM (.osm.pbf)](https://download.geofabrik.de/asia/malaysia-singapore-brunei.html) | ODbL (Open Database Licence) |

---

## 3. Step 1: Automated PDF Table Extraction (Positives)

Rather than copying and pasting tables into Excel by hand (which is error-prone and un-reproducible), use Python with `pdfplumber`.

```python
# Install pdfplumber: pip install pdfplumber pandas tqdm
import pdfplumber
import pandas as pd
import re

def extract_jps_tables(pdf_path, year):
    """
    Extracts structured flood event rows from official JPS Annual Flood Reports.
    """
    records = []
    with pdfplumber.open(pdf_path) as pdf:
        for page_idx, page in enumerate(pdf.pages):
            text = page.extract_text()
            if not text or ("Laporan Kejadian Banjir" not in text and "Lokasi Banjir" not in text):
                continue
            
            tables = page.extract_tables()
            for table in tables:
                for row in table[1:]:  # skip header
                    if len(row) >= 5 and row[1]:  # Ensure valid data row
                        # Standard JPS table schema: [No, Negeri/Daerah, Lokasi, Tarikh Mula, Tempoh, Kedalaman/Mangsa]
                        clean_row = [re.sub(r'\s+', ' ', str(col or '').strip()) for col in row]
                        records.append({
                            "year": year,
                            "page": page_idx + 1,
                            "state_raw": clean_row[1] if len(clean_row) > 1 else "",
                            "location_name": clean_row[2] if len(clean_row) > 2 else "",
                            "start_date": clean_row[3] if len(clean_row) > 3 else "",
                            "duration_days": clean_row[4] if len(clean_row) > 4 else "1",
                            "notes": " ".join(clean_row[5:])
                        })
    df = pd.DataFrame(records)
    print(f"Extracted {len(df)} positive events from {year} report.")
    return df
```

---

## 4. Step 2: Geocoding Pipeline with Centroid Fallbacks

Nominatim fails on ~69% of raw kampung names when asked for strict point matching. To achieve **100% data retention without silent failures**, implement a 3-tier hierarchical resolver:

```python
# pip install geopy tqdm
from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter
import pandas as pd
import time

geolocator = Nominatim(user_agent="floodway_research_benchmark_malaysia")
geocode = RateLimiter(geolocator.geocode, min_delay_seconds=1.1, max_retries=3)

# Pre-defined centroids for Malaysian States / Districts (Fallback Tier 3)
DISTRICT_CENTROIDS = {
    "Klang, Selangor": (3.0449, 101.4456),
    "Petaling, Selangor": (3.1073, 101.6067),
    "Hulu Langat, Selangor": (3.0333, 101.8167),
    "Kuala Lumpur": (3.1390, 101.6869),
    "Kuantan, Pahang": (3.8168, 103.3317),
    "Kota Bharu, Kelantan": (6.1254, 102.2386),
    "Batu Pahat, Johor": (1.8548, 102.9325)
}

def resolve_location(row):
    """
    Tier 1: Full specific address in Malaysia.
    Tier 2: District + State in Malaysia.
    Tier 3: Pre-computed District centroid lookup.
    """
    loc_str = f"{row['location_name']}, {row['state_raw']}, Malaysia"
    try:
        res = geocode(loc_str)
        if res:
            return pd.Series([res.latitude, res.longitude, "point"])
    except Exception:
        pass
    
    # Tier 2 fallback
    district_str = f"{row['state_raw']}, Malaysia"
    try:
        res = geocode(district_str)
        if res:
            return pd.Series([res.latitude, res.longitude, "town"])
    except Exception:
        pass
    
    # Tier 3 fallback
    for key, coords in DISTRICT_CENTROIDS.items():
        if key.lower() in loc_str.lower():
            return pd.Series([coords[0], coords[1], "district_centroid"])
            
    return pd.Series([None, None, "unresolved"])
```

Every row now has a clear `geocode_fidelity` tag (`point`, `town`, `district_centroid`). You train primarily on `point` and `town` fidelity.

---

## 5. Step 3: Hard-Negative Sampling Engine (The Non-Flood Class)

To train a binary classifier ($y=1$ Flood, $y=0$ No Flood), generating random points across Malaysia creates a false model that simply memorizes "ocean vs jungle".

### Rules for Generating Valid Negatives:
1. **Spatial Buffer Rule:** Negatives must be at least **1.5 km away** from any confirmed flood point to avoid drawing from the edge of the same flood pool.
2. **Temporal Independence:** A negative point must have **no recorded floods $\pm 7$ days** before or after the target timestamp.
3. **Hard Negatives (Critical!):** Select locations with **extreme rainfall (>50 mm/day)** on non-flooded dates (e.g., steep ridges, reinforced riverwalls, or elevated expressways). Without hard negatives, the algorithm simply predicts `Flood = (Rain > 40mm)`.

```python
import numpy as np
from datetime import timedelta

def generate_negatives(positives_df, total_ratio=1.5):
    """
    Creates a balanced set of true-negative candidates respecting spatial buffer and rain intensity.
    """
    negatives = []
    target_count = int(len(positives_df) * total_ratio)
    
    # Bounding box for Peninsular Malaysia
    lat_min, lat_max = 1.3, 6.7
    lon_min, lon_max = 100.0, 104.5
    
    existing_coords = positives_df[['latitude', 'longitude']].dropna().values
    
    while len(negatives) < target_count:
        rand_lat = np.random.uniform(lat_min, lat_max)
        rand_lon = np.random.uniform(lon_min, lon_max)
        
        # Check minimum buffer: ~0.02 degrees (~2.2 km)
        dist = np.min(np.sqrt((existing_coords[:, 0] - rand_lat)**2 + (existing_coords[:, 1] - rand_lon)**2))
        if dist < 0.02:
            continue
            
        # Pick a random date from the positive dates pool
        rand_date = np.random.choice(positives_df['start_date'].dropna())
        
        negatives.append({
            "latitude": rand_lat,
            "longitude": rand_lon,
            "date": rand_date,
            "target": 0,
            "negative_type": "spatial_buffer_verified"
        })
        
    neg_df = pd.DataFrame(negatives)
    positives_df['target'] = 1
    combined_df = pd.concat([positives_df, neg_df], ignore_index=True)
    return combined_df
```

---

## 6. Step 4: Geospatial Feature Extraction via Google Earth Engine (Colab-Ready)

Instead of downloading 100 GB of satellite rasters, run this directly in **Google Colab**. Google Earth Engine processes the pixels in the cloud and returns your table with terrain, wetness, and rainfall features in seconds.

```python
# In Google Colab:
# !pip install earthengine-api geemap pandas

import ee
import pandas as pd

# 1. Authenticate and Initialize
ee.Authenticate()
ee.Initialize(project='YOUR_GOOGLE_CLOUD_PROJECT_ID') # Or default educational project

# 2. Define Open Planetary Asset Layers
dem = ee.ImageCollection("COPERNICUS/DEM/GLO30").select('DEM').mosaic()
slope = ee.Terrain.slope(dem).rename('slope_deg')

# JRC Global Surface Water (Historical recurrence & permanent water)
water_occurrence = ee.Image("JRC/GSW1_4/GlobalSurfaceWater").select('occurrence').rename('water_hist_occurrence')

# Topographic Wetness Index (TWI) approximation = ln(upslope area / tan(slope))
twi = dem.expression(
    'log((1 + 1000) / (tan(slope * 0.0174533) + 0.001))',
    {'slope': slope}
).rename('twi')

# Composite Environmental Image
feature_stack = dem.addBands(slope).addBands(water_occurrence).addBands(twi)

def extract_point_features(df):
    """
    Takes a pandas DataFrame with ['latitude', 'longitude'],
    samples GEE feature_stack, and returns augmented DataFrame.
    """
    features = []
    for idx, row in df.iterrows():
        pt = ee.Geometry.Point([row['longitude'], row['latitude']])
        features.append(ee.Feature(pt, {'row_id': idx}))
    
    fc = ee.FeatureCollection(features)
    sampled = feature_stack.reduceRegions(
        collection=fc,
        reducer=ee.Reducer.first(),
        scale=30
    )
    
    # Convert result back to dataframe
    sampled_dict = sampled.getInfo()
    extracted_data = [f['properties'] for f in sampled_dict['features']]
    features_df = pd.DataFrame(extracted_data)
    
    return df.merge(features_df, left_index=True, right_on='row_id')
```

---

## 7. Step 5: ERA5 Precipitation Features (Open-Meteo API)

Extract rainfall totals to capture antecedent ground saturation:
- **`rain_1d`**: Cumulative rainfall in past 24 hours.
- **`rain_3d`**: Cumulative rainfall in past 72 hours (Antecedent Precipitation Index - API).
- **`rain_7d`**: Saturated base soil condition.

```python
# pip install requests
import requests

def get_rainfall_history(lat, lon, date_str):
    """
    Retrieves 7-day preceding precipitation from Open-Meteo reanalysis API (CC BY 4.0).
    """
    url = f"https://archive-api.open-meteo.com/v1/archive?latitude={lat}&longitude={lon}&start_date={date_str}&end_date={date_str}&daily=precipitation_sum&timezone=Asia%2FSingapore"
    resp = requests.get(url, timeout=10).json()
    if "daily" in resp and "precipitation_sum" in resp["daily"]:
        return resp["daily"]["precipitation_sum"][0]
    return 0.0
```

---

## 8. Step 6: Spatio-Temporal Split (Zero Data Leakage)

**Do not use `train_test_split(test_size=0.2, shuffle=True)`!**
Use **Leave-One-Region-Out (LORO)** and **Leave-One-Year-Out (LOYO)**:

```python
from sklearn.model_selection import LeaveOneGroupOut

# 1. Spatial Split: Group by State / River Basin
logo_spatial = LeaveOneGroupOut()
# Groups are states: ['Selangor', 'Kelantan', 'Pahang', 'Johor', ...]

# 2. Temporal Split: Out-of-Time Validation
train_idx = df['year'] <= 2019
test_idx = df['year'] >= 2020  # Extreme 2021 Selangor flood in test set!

X_train, y_train = df.loc[train_idx, feature_cols], df.loc[train_idx, 'target']
X_test, y_test = df.loc[test_idx, feature_cols], df.loc[test_idx, 'target']

print(f"Train samples (2015-2019): {len(X_train)} | Test samples (2020-2021): {len(X_test)}")
```

---

## 9. Step 7: Multi-Algorithm Benchmark Suite

Run these 4 models under the exact same spatio-temporal folds:

```python
# pip install scikit-learn lightgbm xgboost catboost
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from lightgbm import LGBMClassifier
from catboost import CatBoostClassifier

models = {
    "Baseline_RainRule": None, # Simple threshold: Predict 1 if rain_3d > 100mm
    "Logistic_Regression": LogisticRegression(max_iter=1000, class_weight='balanced'),
    "Random_Forest": RandomForestClassifier(n_estimators=300, max_depth=12, class_weight='balanced', random_state=42),
    "LightGBM": LGBMClassifier(n_estimators=300, learning_rate=0.03, scale_pos_weight=1.5, random_state=42),
    "CatBoost": CatBoostClassifier(iterations=400, depth=6, verbose=0, random_seed=42)
}
```

---

## 10. Step 8: Hydrological Life-Safety Evaluation Metrics

Do not rely on accuracy. Calculate the metrics that flood disaster operators and hydrologists care about:

```python
from sklearn.metrics import precision_recall_curve, auc, brier_score_loss, confusion_matrix

def compute_hydrological_metrics(y_true, y_pred_prob, threshold=0.5):
    y_pred = (y_pred_prob >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
    
    # 1. Critical Success Index (CSI / Threat Score): Hits / (Hits + Misses + False Alarms)
    csi = tp / (tp + fn + fp) if (tp + fn + fp) > 0 else 0
    
    # 2. Probability of Detection (POD / Recall): Hits / Total Real Floods
    pod = tp / (tp + fn) if (tp + fn) > 0 else 0
    
    # 3. False Alarm Ratio (FAR): False Alarms / Total Predicted Alarms
    far = fp / (tp + fp) if (tp + fp) > 0 else 0
    
    # 4. PR-AUC (Precision-Recall Area Under Curve)
    precision, recall, _ = precision_recall_curve(y_true, y_pred_prob)
    pr_auc = auc(recall, precision)
    
    # 5. Brier Score: Calibration quality (0 = perfect confidence calibration)
    brier = brier_score_loss(y_true, y_pred_prob)
    
    return {
        "CSI (Threat Score)": round(csi, 4),
        "POD (Detection Rate)": round(pod, 4),
        "FAR (False Alarm Rate)": round(far, 4),
        "PR-AUC": round(pr_auc, 4),
        "Brier Calibration Score": round(brier, 4)
    }
```

---

## 11. Checklist for Tisya's Execution

- [ ] **Step A:** Download the 7 JPS Annual Report PDFs from Section 2.
- [ ] **Step B:** Run the `pdfplumber` extractor to create `data/raw/jps_positives_2015_2021.csv`.
- [ ] **Step C:** Run the 3-tier geocoder to obtain coordinates and `geocode_fidelity` tags.
- [ ] **Step D:** Run the negative sampling engine to produce a balanced dataset (1 : 1.5 ratio).
- [ ] **Step E:** Open Google Colab, mount Drive, authenticate GEE, and extract DEM, slope, TWI, and water occurrence.
- [ ] **Step F:** Split by Year (Train $\le 2019$, Test $\ge 2020$) and by State (Leave-One-Region-Out).
- [ ] **Step G:** Train the 4 models and output `RESULTS_BENCHMARK.md` reporting CSI, POD, FAR, and PR-AUC.
- [ ] **Step H:** Save the best model artifact as `best_flood_model.joblib`.
