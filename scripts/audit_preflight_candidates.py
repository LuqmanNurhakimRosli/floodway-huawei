"""
scripts/audit_preflight_candidates.py

Audit of all 3,101 Peninsular Malaysia positive flood candidates for Stage 5.0 Preflight.
Examines:
1. Coordinate repetition, unique coordinates, frequency distribution.
2. Locality repetition (place, district, state).
3. Temporal overlap (multiple dates at same location, multi-day flood events).
4. State distribution and imbalance (train <= 2019 vs test >= 2020).
5. Train/Test coordinate overlap (seen vs unseen locations).
6. Inspection of raw Excel text for flood incident type terminology.
"""

import pandas as pd
import numpy as np

# Load candidate positives
df_cand = pd.read_csv("datasets/jps_positives_peninsular_candidates.csv")
print(f"Total candidates loaded: {len(df_cand)}")

# 1. Coordinate repetition
coord_pairs = df_cand.groupby(["latitude", "longitude"]).size().reset_index(name="event_count")
n_unique_coords = len(coord_pairs)
print(f"\n--- 1. Coordinate Repetition ---")
print(f"Unique coordinate pairs: {n_unique_coords} across {len(df_cand)} records (ratio: {n_unique_coords/len(df_cand):.2%})")
print(f"Event counts per coordinate:")
print(coord_pairs["event_count"].value_counts().sort_index().to_string())

# Coordinates with highest count
top_coords = coord_pairs.sort_values(by="event_count", ascending=False).head(10)
print("\nTop 10 most frequent coordinates:")
for _, row in top_coords.iterrows():
    matches = df_cand[(df_cand["latitude"] == row["latitude"]) & (df_cand["longitude"] == row["longitude"])]
    places = matches["place"].unique()
    states = matches["state"].unique()
    print(f"  ({row['latitude']:.4f}, {row['longitude']:.4f}) - {row['event_count']} events | States: {list(states)} | Places: {list(places)[:3]}")

# 2. Locality repetition
print(f"\n--- 2. Locality Repetition ---")
print(f"Unique places: {df_cand['place'].nunique()}")
print(f"Unique districts: {df_cand['district'].nunique()}")
print(f"Unique states: {df_cand['state'].nunique()}")

# 3. State & Split distribution
print(f"\n--- 3. State Imbalance & Temporal Split ---")
df_cand["split"] = np.where(df_cand["year"] <= 2019, "train", "test")
state_split = pd.crosstab(df_cand["state"], df_cand["split"], margins=True)
state_split["pct_total"] = (state_split["All"] / len(df_cand) * 100).round(1)
print(state_split.to_string())

print(f"\nYear distribution:")
print(df_cand["year"].value_counts().sort_index().to_string())

# 4. Train vs Test Location Overlap
train_coords = set(zip(df_cand[df_cand["split"] == "train"]["latitude"], df_cand[df_cand["split"] == "train"]["longitude"]))
test_coords = set(zip(df_cand[df_cand["split"] == "test"]["latitude"], df_cand[df_cand["split"] == "test"]["longitude"]))

overlap_coords = train_coords.intersection(test_coords)
test_in_train_events = df_cand[(df_cand["split"] == "test") & (df_cand.apply(lambda r: (r["latitude"], r["longitude"]) in overlap_coords, axis=1))]

print(f"\n--- 4. Train/Test Coordinate Overlap ---")
print(f"Train unique coordinates: {len(train_coords)}")
print(f"Test unique coordinates: {len(test_coords)}")
print(f"Shared coordinates between train & test: {len(overlap_coords)} ({len(overlap_coords)/len(test_coords):.2%} of test coords)")
print(f"Test events occurring at coordinates previously seen in train: {len(test_in_train_events)} / {len(df_cand[df_cand['split'] == 'test'])} ({len(test_in_train_events)/len(df_cand[df_cand['split'] == 'test']):.2%})")
print(f"Test events at completely novel (unseen) coordinates: {len(df_cand[df_cand['split'] == 'test']) - len(test_in_train_events)} / {len(df_cand[df_cand['split'] == 'test'])}")

# 5. Temporal overlap / Multi-event dates
print(f"\n--- 5. Temporal Clustering ---")
date_counts = df_cand["date"].value_counts()
print(f"Unique event dates: {len(date_counts)}")
print(f"Top 5 dates with most flood reports:")
print(date_counts.head(5).to_string())

# Check same coordinate on different dates vs same date
same_coord_multi_dates = df_cand.groupby(["latitude", "longitude"])["date"].nunique()
print(f"Coordinates with events across multiple distinct dates: {(same_coord_multi_dates > 1).sum()}")

# 6. Raw Excel Inspection for Target Definition
print(f"\n--- 6. Raw Excel Inspection (Flood Target Definition) ---")
try:
    xl = pd.ExcelFile("datasets/all_states_all_years.xlsx")
    print(f"Excel Sheet Names: {xl.sheet_names[:10]}")
    # Inspect a sheet
    sheet1 = xl.parse(xl.sheet_names[0], nrows=5)
    print(f"First sheet columns: {sheet1.columns.tolist()}")
    print("Sample content:\n", sheet1.head(2))
except Exception as e:
    print(f"Excel inspection note: {e}")
