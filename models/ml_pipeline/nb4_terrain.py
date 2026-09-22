# %% [markdown]
# # NB4 - From ONE sensor reading to a neighbourhood flood surface (bathtub model) + Three.js terrain
# Sensor gives water level at one point. The 3D twin needs depth everywhere -> DEM + hydrologic connectivity.
# LIMITS: bathtub assumes a FLAT water surface (fine over ~1-2 km, wrong along a sloping river) and ignores drainage/pumps.
# Copernicus GLO-30 is a DSM (includes buildings/canopy): treat depths as INDICATIVE, and say so in the UI.

# %% Cell 1 - read a DEM window (COG on the public Copernicus bucket; verify the URL pattern for your tile)
def read_dem_window(lat, lon, half_deg=0.01, url=None):
    import rasterio
    from rasterio.windows import from_bounds
    url = url or "https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N03_00_E101_00_DEM/Copernicus_DSM_COG_10_N03_00_E101_00_DEM.tif"
    with rasterio.open(url) as ds:
        w = from_bounds(lon - half_deg, lat - half_deg, lon + half_deg, lat + half_deg, ds.transform)
        dem = ds.read(1, window=w).astype("float32")
    return dem                                  # rows = north->south

# %% Cell 2 - bathtub depth with connectivity to the sensor/river cell
import numpy as np, json
from scipy import ndimage as ndi

def bathtub_depth(dem: np.ndarray, wse_m: float, seed_rc: tuple[int, int]) -> np.ndarray:
    """Cells below the water-surface elevation AND connected to the seed. depth = wse - dem."""
    below = dem < wse_m
    lab, _ = ndi.label(below)                    # 4-connectivity by default
    seed_lab = lab[seed_rc]
    if seed_lab == 0:
        return np.zeros_like(dem)
    return np.where(lab == seed_lab, wse_m - dem, 0.0).astype("float32")

MAX_DEPTH_M = {"walking": 0.10, "motorcycle": 0.15, "car": 0.30, "4x4": 0.70}     # from your routing table

def passable(depth_at_point_m: float, profile: str) -> bool:
    return depth_at_point_m < MAX_DEPTH_M[profile]

# %% Cell 3 - synthetic DEM for testing the whole chain offline
def synthetic_dem(n=120, seed=1):
    rng = np.random.default_rng(seed)
    y, x = np.mgrid[0:n, 0:n].astype("float32")
    valley = 8 + 0.06 * np.abs(x - n * 0.35) ** 1.15 + 0.004 * y             # river on the west side, rising east/south
    return valley + ndi.gaussian_filter(rng.normal(0, 1.2, (n, n)), 3).astype("float32")

dem = synthetic_dem()
win = dem[50:70, 35:50]; seed_rc = (50 + int(np.argmin(win) // win.shape[1]), 35 + int(np.argmin(win) % win.shape[1]))   # sensor at the channel floor
ground_at_sensor = float(dem[seed_rc])
for lvl in (0.1, 0.3, 1.0, 2.5):
    d = bathtub_depth(dem, ground_at_sensor + lvl, seed_rc)
    print(f"sensor level {lvl:>4} m -> flooded cells {(d > 0).mean():.1%}, max depth {d.max():.2f} m")

# %% Cell 4 - export a compact grid for the browser (<= 96x96, elevations relative to sensor ground)
def export_terrain(dem, seed_rc, out="terrain.json", max_side=96, cell_m=30.0):
    f = max(1, int(np.ceil(max(dem.shape) / max_side)))
    small = dem[::f, ::f]
    payload = {"rows": int(small.shape[0]), "cols": int(small.shape[1]), "cell_m": cell_m * f,
               "sensor_rc": [seed_rc[0] // f, seed_rc[1] // f],
               "ground_at_sensor_m": float(dem[seed_rc]),
               "elev_rel_m": np.round(small - dem[seed_rc], 2).ravel().tolist()}
    json.dump(payload, open(out, "w")); print(f"{out}: {len(payload['elev_rel_m'])} cells")
export_terrain(dem, seed_rc)
