# %% [markdown]
# # NB3 - Smoke-test the forecaster for serving inside the backend (Cloud Run)
# Plan: the model runs in-process in the FastAPI container, so there is no separate model service to deploy.
# The backend image copies model_out/ and flood_core.py next to the app; Cloud Run then serves both.

# %% Cell 1 - load the trained weights exactly as the backend would
from flood_core import FloodPredictor

predictor = FloodPredictor("model_out")

# %% Cell 2 - local smoke test: quantiles must not cross
payload = {"rain_mm": [0.0] * 20 + [4.0, 6.0, 8.0, 5.0], "level_m": [0.05 + 0.01 * i for i in range(24)]}
out = predictor.predict(payload["rain_mm"], payload["level_m"])
print(out)
assert all(lo <= mid <= hi for lo, mid, hi in zip(out["p10"], out["p50"], out["p90"])), "quantiles crossed"

# %% Cell 3 - deploy with the backend (planned; needs a Google Cloud project and the gcloud CLI)
print("""
1. Copy model_out/ and flood_core.py into the backend image (one COPY line in backend/Dockerfile) and add torch to
   backend/requirements.txt. Keep the rule-based formula as the fallback when the weights fail to load.
2. gcloud run deploy floodway-api --source backend --region asia-southeast1 --allow-unauthenticated \\
       --set-env-vars VISION_WRITE_TOKEN=...,CORS_ORIGINS=https://<your-site>
3. Call POST /api/v1/predict and confirm p10 <= p50 <= p90.
The weights are SYNTHETIC (meta.json version gru-q-0.1.0-SYNTHETIC): never quote their metrics.
""")
