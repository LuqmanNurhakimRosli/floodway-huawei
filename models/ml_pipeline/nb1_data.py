# %% [markdown]
# # NB1 - Acquire and align data for the FloodWay forecaster
# Goal: produce `station.csv` with columns timestamp, rain_mm (per 15 min), level_m.
# Sources here: Open-Meteo (rain, GloFAS discharge), your own JPS/FYP export, your ESP32 log.
# Endpoints below were written from documentation/memory and could NOT be called from my sandbox - run and inspect the first response.

# %% Cell 1 - config
import requests, pandas as pd, numpy as np
LAT, LON = 3.045, 101.55            # example: Shah Alam / Klang basin. Put your sensor site here.
START, END = "2015-01-01", "2025-12-31"
STEP = "15min"

# %% Cell 2 - hourly rainfall (ERA5-based reanalysis via Open-Meteo archive)
def fetch_rain_hourly(lat, lon, start, end) -> pd.Series:
    r = requests.get("https://archive-api.open-meteo.com/v1/archive", timeout=60, params={
        "latitude": lat, "longitude": lon, "start_date": start, "end_date": end,
        "hourly": "precipitation", "timezone": "Asia/Kuala_Lumpur"})
    r.raise_for_status()
    h = r.json()["hourly"]
    return pd.Series(h["precipitation"], index=pd.to_datetime(h["time"]), name="rain_mm_hourly")

def hourly_to_15min(s: pd.Series) -> pd.Series:
    """Spread each hourly total evenly over 4 steps. This is an APPROXIMATION - flag it in the report."""
    out = s.resample(STEP).ffill() / 4.0
    return out.rename("rain_mm")

# rain15 = hourly_to_15min(fetch_rain_hourly(LAT, LON, START, END))

# %% Cell 3 - GloFAS river discharge (daily, ~5 km; nearest river cell, try +-0.1 deg if it looks wrong)
def fetch_glofas_daily(lat, lon, start, end) -> pd.Series:
    r = requests.get("https://flood-api.open-meteo.com/v1/flood", timeout=60, params={
        "latitude": lat, "longitude": lon, "start_date": start, "end_date": end,
        "daily": "river_discharge"})
    r.raise_for_status()
    d = r.json()["daily"]
    return pd.Series(d["river_discharge"], index=pd.to_datetime(d["time"]), name="discharge_m3s")

# discharge = fetch_glofas_daily(LAT, LON, START, END)

# %% Cell 4 - YOUR JPS / FYP export (rainfall + stage). Adapt column names to the real file.
def load_jps_export(path: str, ts_col="datetime", rain_col="rain_mm", level_col="water_level_m") -> pd.DataFrame:
    df = pd.read_csv(path, parse_dates=[ts_col]).rename(columns={ts_col: "timestamp", rain_col: "rain_mm", level_col: "level_m"})
    df = df.set_index("timestamp").sort_index()
    assert df.index.is_monotonic_increasing and not df.index.duplicated().any(), "duplicate/unsorted timestamps"
    return df[["rain_mm", "level_m"]]

# %% Cell 5 - ESP32 log (exported from backend GET /api/v1/export.csv)
def load_sensor_log(path: str) -> pd.DataFrame:
    df = pd.read_csv(path, parse_dates=["ts"]).set_index("ts").sort_index()
    return df[["level_m"]].resample(STEP).median()

# %% Cell 6 - proxy level from discharge (ONLY if you have no stage data; label it as a proxy everywhere)
def discharge_to_proxy_level(q: pd.Series, bankfull_pctile=0.95, bankfull_depth_m=0.5) -> pd.Series:
    """Rank-based proxy: q at the 95th percentile maps to bankfull_depth_m. Not physical - do NOT report as accuracy."""
    scale = q.quantile(bankfull_pctile)
    return (q / scale * bankfull_depth_m).clip(lower=0).rename("level_m")

# %% Cell 7 - final alignment + sanity checks
def finalize(rain15: pd.Series, level15: pd.Series, out="station.csv") -> pd.DataFrame:
    df = pd.concat([rain15, level15], axis=1, join="inner").dropna()
    assert (df.rain_mm >= 0).all() and (df.level_m >= -0.05).all(), "physically impossible values"
    print(df.describe().round(3)); print("span:", df.index.min(), "->", df.index.max(), "rows:", len(df))
    df.rename_axis("timestamp").reset_index().to_csv(out, index=False)
    return df
