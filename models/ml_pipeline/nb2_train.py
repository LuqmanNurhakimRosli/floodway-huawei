# %% [markdown]
# # NB2 - Train the FloodWay level forecaster (GRU, quantile) + baselines
# Input : a DataFrame with a 15-min DatetimeIndex and columns `rain_mm`, `level_m`.
# Output: ./model_out/{model.pt, meta.json}
# NOTE  : the synthetic generator only proves the PIPELINE. Never quote its metrics.

# %% Cell 1 - imports and config
import json, os, sys
import numpy as np, pandas as pd
import torch, torch.nn as nn
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else ".")
from flood_core import (WINDOW, HORIZON_STEPS, HORIZONS_MIN, QUANTILES, STEP_MIN,
                        FloodGRU, build_window_features)

SEED = 42
DANGER_M = 0.30           # your "commit" threshold
WARN_M = 0.10             # earliest pedestrian threshold from your routing table
OUT_DIR = "model_out"
rng = np.random.default_rng(SEED); torch.manual_seed(SEED)

# %% Cell 2 - data loader (swap the synthetic branch for real data)
def load_real_csv(path: str) -> pd.DataFrame:
    """Expected columns: timestamp, rain_mm (per step), level_m. Any station, any cadence."""
    df = pd.read_csv(path, parse_dates=["timestamp"]).set_index("timestamp").sort_index()
    df = df[["rain_mm", "level_m"]].resample(f"{STEP_MIN}min").agg({"rain_mm": "sum", "level_m": "mean"})
    n_missing = int(df["level_m"].isna().sum())
    df["level_m"] = df["level_m"].interpolate(limit=4)      # bridge <=1 h gaps only
    df["rain_mm"] = df["rain_mm"].fillna(0.0)
    df = df.dropna()
    print(f"loaded {len(df):,} rows, {n_missing:,} missing level steps (long gaps dropped)")
    return df

def make_synthetic(n_days: int = 900) -> pd.DataFrame:
    """Storm-driven linear reservoir. PIPELINE TEST ONLY."""
    n = n_days * 24 * 60 // STEP_MIN
    rain = np.zeros(n)
    t = 0
    while t < n - 60:
        t += int(rng.exponential(24 * 60 / STEP_MIN / 0.35))          # a storm every ~3 days
        dur = int(rng.integers(3, 30)); peak = rng.gamma(2.0, 5.0)
        shape = np.sin(np.linspace(0, np.pi, dur)) ** 2
        rain[t:t + dur] += (peak * shape * rng.uniform(0.6, 1.4, dur))[: n - t]
    kernel = np.exp(-np.arange(24) / 6.0); kernel /= kernel.sum()
    inflow = np.convolve(rain, kernel)[:n]
    level = np.zeros(n)
    for i in range(n - 1):
        level[i + 1] = max(0.0, level[i] + 0.010 * inflow[i] - 0.012 * level[i] + rng.normal(0, 0.002))
    idx = pd.date_range("2022-01-01", periods=n, freq=f"{STEP_MIN}min")
    return pd.DataFrame({"rain_mm": rain, "level_m": level}, index=idx)

df = make_synthetic()                    # <- replace with load_real_csv("your_station.csv")
print(df.describe().round(3)); print("share of steps >= 0.30 m:", round((df.level_m >= DANGER_M).mean(), 4))

# %% Cell 3 - supervised windows + CHRONOLOGICAL split with a purge gap
max_h = max(HORIZON_STEPS)
def make_xy(df: pd.DataFrame):
    rain, level = df.rain_mm.to_numpy(np.float32), df.level_m.to_numpy(np.float32)
    ends = np.arange(WINDOW - 1, len(df) - max_h)
    X = np.stack([build_window_features(rain[e - WINDOW + 1: e + 1], level[e - WINDOW + 1: e + 1]) for e in ends])
    now = level[ends]
    Y = np.stack([level[ends + h] for h in HORIZON_STEPS], axis=1)      # absolute future level
    return X, Y, now, ends

X, Y, NOW, ENDS = make_xy(df)
n = len(X); gap = WINDOW + max_h
i_tr, i_va = int(n * 0.70), int(n * 0.85)
tr = np.arange(0, i_tr - gap); va = np.arange(i_tr, i_va - gap); te = np.arange(i_va, n)
print({"train": len(tr), "val": len(va), "test": len(te)})

mean, std = X[tr].reshape(-1, X.shape[-1]).mean(0), X[tr].reshape(-1, X.shape[-1]).std(0) + 1e-6
norm = lambda a: (a - mean) / std

# %% Cell 4 - baselines: persistence + gradient boosting (median)
from sklearn.ensemble import HistGradientBoostingRegressor
def tab(X_):                                        # tabular view of a window
    rain, lvl = X_[:, :, 0], X_[:, :, 1]
    return np.column_stack([lvl[:, -1], lvl[:, -1] - lvl[:, -2], lvl[:, -1] - lvl[:, -5],
                            rain[:, -4:].sum(1), rain[:, -12:].sum(1), rain.sum(1)])
gbm_pred = np.zeros((len(te), len(HORIZON_STEPS)))
for j in range(len(HORIZON_STEPS)):
    m = HistGradientBoostingRegressor(loss="absolute_error", max_iter=300, learning_rate=0.06, random_state=SEED)
    m.fit(tab(X[tr]), Y[tr, j] - NOW[tr]); gbm_pred[:, j] = NOW[te] + m.predict(tab(X[te]))
persist_pred = np.repeat(NOW[te][:, None], len(HORIZON_STEPS), axis=1)

# %% Cell 5 - GRU with pinball loss (predicts delta vs current level)
dev = "cuda" if torch.cuda.is_available() else "cpu"
Xt = lambda idx: torch.tensor(norm(X[idx]), dtype=torch.float32)
Dt = lambda idx: torch.tensor(Y[idx] - NOW[idx][:, None], dtype=torch.float32)
q_t = torch.tensor(QUANTILES, dtype=torch.float32, device=dev).view(1, 1, -1)

def pinball(pred, target):                          # pred (B,H,Q) target (B,H)
    e = target.unsqueeze(-1) - pred
    return torch.maximum(q_t * e, (q_t - 1) * e).mean()

model = FloodGRU(hidden=64).to(dev)
opt = torch.optim.AdamW(model.parameters(), lr=2e-3, weight_decay=1e-4)
sched = torch.optim.lr_scheduler.ReduceLROnPlateau(opt, factor=0.5, patience=3)
xtr, ytr, xva, yva = Xt(tr).to(dev), Dt(tr).to(dev), Xt(va).to(dev), Dt(va).to(dev)
best, best_state, bad, EPOCHS, BS = 1e9, None, 0, 40, 256
for ep in range(EPOCHS):
    model.train(); perm = torch.randperm(len(xtr), device=dev)
    for k in range(0, len(perm), BS):
        b = perm[k:k + BS]; opt.zero_grad()
        loss = pinball(model(xtr[b]), ytr[b]); loss.backward()
        nn.utils.clip_grad_norm_(model.parameters(), 1.0); opt.step()
    model.eval()
    with torch.no_grad(): vloss = pinball(model(xva), yva).item()
    sched.step(vloss)
    if vloss < best - 1e-6: best, bad, best_state = vloss, 0, {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}
    else: bad += 1
    if ep % 5 == 0 or bad == 0: print(f"ep {ep:02d} val pinball {vloss:.5f}")
    if bad >= 8: print("early stop"); break
model.load_state_dict(best_state); model.eval()
with torch.no_grad(): gru_q = model(Xt(te).to(dev)).cpu().numpy()          # (N,H,Q) deltas
gru_q = np.sort(gru_q, axis=2); gru_lvl = np.clip(NOW[te][:, None, None] + gru_q, 0, None)
gru_pred = gru_lvl[:, :, 1]

# %% Cell 6 - evaluation that matches the product (not just RMSE)
def rmse(a, b): return float(np.sqrt(np.mean((a - b) ** 2)))
def mae(a, b): return float(np.mean(np.abs(a - b)))
truth = Y[te]; rows = []
for name, p in [("persistence", persist_pred), ("gbm", gbm_pred), ("gru_p50", gru_pred)]:
    for j, h in enumerate(HORIZONS_MIN):
        rows.append({"model": name, "horizon_min": h, "MAE_m": mae(p[:, j], truth[:, j]), "RMSE_m": rmse(p[:, j], truth[:, j])})
print(pd.DataFrame(rows).pivot(index="model", columns="horizon_min", values="MAE_m").round(4))

def onset_metrics(pred, thr, use_now_below=True):
    """Onset = level NOW is below thr but will be >= thr at the horizon. The case that saves lives."""
    out = []
    for j, h in enumerate(HORIZONS_MIN):
        mask = NOW[te] < thr if use_now_below else np.ones(len(te), bool)
        y_true, y_hat = truth[mask, j] >= thr, pred[mask, j] >= thr
        tp, fp, fn = int((y_true & y_hat).sum()), int((~y_true & y_hat).sum()), int((y_true & ~y_hat).sum())
        out.append({"horizon_min": h, "events": int(y_true.sum()), "recall": tp / max(tp + fn, 1), "precision": tp / max(tp + fp, 1), "false_alarms": fp})
    return pd.DataFrame(out).round(3)
for name, p in [("persistence", persist_pred), ("gbm", gbm_pred), ("gru p50", gru_pred), ("gru p90 (cautious)", gru_lvl[:, :, 2])]:
    print(f"\n== onset of >= {DANGER_M} m : {name}"); print(onset_metrics(p, DANGER_M).to_string(index=False))

cov = ((truth >= gru_lvl[:, :, 0]) & (truth <= gru_lvl[:, :, 2])).mean(0)
print("\nP10-P90 interval coverage per horizon (target ~0.80):", cov.round(3))

# %% Cell 7 - the leakage check for YOUR old 74.55% number
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score
Xtab, ytab = tab(X), Y[:, 1]
a_tr, a_te, b_tr, b_te = train_test_split(Xtab, ytab, test_size=0.2, random_state=SEED)          # WRONG for time series
g = HistGradientBoostingRegressor(random_state=SEED).fit(a_tr, b_tr); r2_random = r2_score(b_te, g.predict(a_te))
cut = int(len(Xtab) * 0.8); g2 = HistGradientBoostingRegressor(random_state=SEED).fit(Xtab[:cut - gap], ytab[:cut - gap])
r2_time = r2_score(ytab[cut:], g2.predict(Xtab[cut:]))
print(f"R2 random split: {r2_random:.3f} | R2 chronological split: {r2_time:.3f}")
print("On SYNTHETIC data both are ~equal (smooth, stationary). On REAL data, a big gap means your old score was leakage.")

# %% Cell 8 - export
os.makedirs(OUT_DIR, exist_ok=True)
torch.save(model.state_dict(), os.path.join(OUT_DIR, "model.pt"))
json.dump({"mean": mean.tolist(), "std": std.tolist(), "hidden": 64, "window": WINDOW,
           "horizons_min": list(HORIZONS_MIN), "quantiles": list(QUANTILES),
           "version": "gru-q-0.1.0-SYNTHETIC"}, open(os.path.join(OUT_DIR, "meta.json"), "w"), indent=2)
print("exported ->", os.listdir(OUT_DIR))
