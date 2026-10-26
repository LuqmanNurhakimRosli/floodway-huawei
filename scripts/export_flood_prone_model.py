"""Export Tisya's Benchmark A logistic regression to JSON so the browser can score it with no backend.

Writes frontend/src/data/floodProneModel.json: the scaler and classifier weights, the Jalan Dang Wangi site
(a held-out 2021 JPS-reported flood record) and reference scores from scikit-learn that the frontend test checks
against. Nothing is retrained. Run from the repo root:
    backend\\.venv\\Scripts\\python.exe scripts/export_flood_prone_model.py
"""

import csv
import json
from pathlib import Path

import joblib
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
MODEL = "stage5_3b_benchmark_a_logistic_regression.joblib"
SITE_ID = "POS_13440"  # Jalan Dang Wangi, 18 Dec 2021, test split
# Rain before the site's real flood day, from calm to the recorded values: the storm scenario steps through these.
RAIN_STEPS = [(0.0, 2.0, 10.0), (5.0, 20.0, 45.0), (16.1, 31.9, 79.8), (71.1, 91.8, 97.7)]


def main() -> None:
    pipe = joblib.load(ROOT / "models" / MODEL)  # the team's own committed model file (joblib unpickles: trusted input only)
    scaler, clf = pipe.named_steps["scaler"], pipe.named_steps["classifier"]
    with open(ROOT / "datasets" / "floodway_stage5_3a_positives_features_250.csv", newline="") as f:
        site = next(r for r in csv.DictReader(f) if r["sample_id"] == SITE_ID)
    elev, slope = float(site["elevation_m"]), float(site["slope_deg"])

    reference = []
    for r1, r3, r7 in RAIN_STEPS:
        x = np.array([[r1, r3, r7, elev, slope]])
        reference.append({"rain": [r1, r3, r7], "score": round(float(pipe.predict_proba(x)[0, 1]), 6)})

    out = {
        "source": f"models/{MODEL} (Tisya, Stage 5.3B). Exported by scripts/export_flood_prone_model.py; not retrained.",
        "features": ["rain_1d_prior_mm", "rain_3d_prior_mm", "rain_7d_prior_mm", "elevation_m", "slope_deg"],
        "mean": scaler.mean_.tolist(),
        "scale": scaler.scale_.tolist(),
        "coef": clf.coef_[0].tolist(),
        "intercept": float(clf.intercept_[0]),
        "result": "ROC-AUC 0.836 [0.777, 0.892] on held-out 2020-21 JPS-reported floods (Benchmark A, N=170)",
        "site": {
            "id": SITE_ID,
            "place": site["place"],
            "state": site["state"],
            "flood_date": site["date"],
            "lat": float(site["latitude"]),
            "lon": float(site["longitude"]),
            "elevation_m": elev,
            "slope_deg": slope,
        },
        "reference": reference,
    }
    dest = ROOT / "frontend" / "src" / "data" / "floodProneModel.json"
    dest.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {dest}: {[r['score'] for r in reference]}")


if __name__ == "__main__":
    main()
