# FloodWay: Google-stack plan and Model 1 work order

**Written for:** the FloodWay team (engineers and the Model 1 owner).
**Date:** 2026-10-20. **Competition:** Sime Darby Property University Hackathon 2026, "Township of Tomorrow" (the competitive analysis names a 23 October deadline; confirm it).

## 1. Decision

FloodWay drops the Huawei design (ModelArts, OBS, ECS, SMN) and uses Google's ecosystem, which the app already half uses (Firebase, Gemini). OpenStreetMap stays for maps and routing: it is free and the offline map depends on it. The product does not change: four inputs, one four-level warning (Normal, Advisory, Warning, Danger), routes to an open relief centre.

The honesty rules in `AGENTS.md` still hold: say "planned" until a piece runs, and show no accuracy the repo cannot reproduce.

## 2. Stack, layer by layer

| Layer | Huawei design (dropped) | Google stack | Status 2026-10-20 |
|---|---|---|---|
| Sign-in and database | - | Firebase Authentication, Cloud Firestore | In place (guard rails in `AGENTS.md`) |
| Web hosting | Cloudflare Pages / Netlify today | Firebase Hosting | Planned |
| Backend API | ECS | Cloud Run (the existing `backend/Dockerfile`) | Planned |
| Model serving | ModelArts real-time service | Models run inside the FastAPI container on Cloud Run; Model 1 as precomputed map tiles | ModelArts code removed; serving planned |
| Training and notebooks | ModelArts notebooks | Colab or Vertex AI Workbench | Planned |
| Satellite and terrain features (Model 1) | - | Google Earth Engine: Sentinel-2, Copernicus DEM GLO-30, JRC surface water history | Planned |
| Land-cover baseline (Model 2) | - | Dynamic World (Google, 10 m) as the free baseline to beat | Planned |
| Files (report photos, map tiles) | OBS | Cloud Storage for Firebase | Planned |
| Photo check | - | Gemini API (`GEMINI_API_KEY`), OpenRouter as fallback | **Done in code** (`routes/ai_check.py`, 3 new tests); live call not run |
| CCTV clip check | - | Gemini video understanding on short clips; a self-hosted vLLM model only if cost forces it | Planned |
| Push alerts | SMN | Firebase Cloud Messaging; Telegram stays | Telegram in place; FCM planned |
| Secrets | - | Secret Manager for the Gemini key, write token, Telegram token | Planned |
| Logs | - | Cloud Logging (comes with Cloud Run) | Planned |
| Weather | - | Open data forecast API (data.gov.my) and Open-Meteo | Planned |
| Maps and routing | - | OpenStreetMap, Leaflet, OSRM (unchanged) | In place |

Model IDs: `GEMINI_MODEL` defaults to `gemini-2.5-flash`. Check the current Flash model ID in Google's documentation before the pilot; do not hardcode a name from memory.

## 3. Done on 2026-10-20

- Removed every Huawei code path: `HUAWEI_*` settings (`config.py`), the ModelArts fields (`forecaster.py`), the SMN field (`notifier.py`), the API title and health text (`main.py`), the ModelArts package (`models/ml_pipeline/modelarts_pkg/`, a byte copy of `model_out/`, still in git history). `nb3_package.py` now smoke-tests the forecaster for in-process serving.
- Gemini API path added to the photo check, with OpenRouter as fallback; the result names the engine that ran.
- Public text: Welcome page, Android About, link-preview image and package name no longer say Huawei.
- GINKGO Model 1 files added in `models/ginkgo/` with `MODEL_CARD.md` and `inspect_models.py`.

Kept on purpose: the honest-claims tests still ban the word Huawei in API text; the preliminary-round pack (`docs/product/preliminary-round/`), the competition reference and the booth films stay as records of the earlier Huawei ICT round. The Cloudflare Pages project is still named `floodway-huawei` (`scripts/public-demo.ps1`), because renaming it creates a new site and breaks the old QR link.

## 4. Build order from here

1. **Cloud Run deploy** of the backend: `gcloud run deploy floodway-api --source backend --region asia-southeast1`, with `VISION_WRITE_TOKEN`, `CORS_ORIGINS` and the Gemini key from Secret Manager. Move the device HMAC secrets out of `config.py` first (PROGRESS open item 6).
2. **Firebase Hosting** for `frontend/dist` with `VITE_API_BASE` set to the Cloud Run URL; check the QR target before printing anything.
3. **Gemini live check**: run one real photo through `/api/v1/ai/flood-image-check` with `GEMINI_API_KEY` set and record the result.
4. **Model 1** (section 5).
5. **FCM** push for Warning and Danger, beside Telegram.
6. **CCTV clip check** with Gemini, only after steps 1 to 5.
7. **River node** bench test (the one number a judge can check with a tape measure).

## 5. Model 1 work order

The files are in `models/ginkgo/`. What they show (details in `models/ginkgo/MODEL_CARD.md`):

- 8 unnamed inputs, not the 14 or more on the GINKGO infographic; output is class 0 or 1.
- The decision tree's first rule, `x3 <= 1.5`, always predicts "no flood". If `x3` is a scenario number or derived from the label, it explains the 99% accuracy.
- The published file sizes match these files exactly, so the "Model 2 U-Net" table was copied from Model 1.

Steps:

0. **Get the feature list and the training notebook from the owner.** Nothing else can start without them.
1. Freeze the data: dataset URL, licence, location, dates; are the pixels Malaysian?
2. Leakage test: drop `x3` and the water indices, retrain, compare.
3. Spatial block cross-validation (1 km or 5 km blocks, or whole scenes). Report High-class F1, Cohen's kappa and the confusion matrix.
4. Leave-one-event-out, if the data has more than one event.
5. Hotspot check: share of known flood locations inside the High band, against random points.
6. Rebuild the features in Earth Engine for the pilot township, precompute the score, publish tiles to Cloud Storage, show them on the map as "Model estimate, not a flood warning".

Until step 3 is done, every slide says "evaluation in progress" for Model 1, with no number.

## 6. Risks

- Model 1 may score much lower when tested by place. Show the lower number with the test named.
- Earth Engine needs a registered Cloud project (non-commercial use is free; check the terms for a hackathon entry).
- The PLAN-AI terms may limit reuse of the GINKGO models in the SDP entry; check before submission.
- Cloud Run and Gemini have free tiers, but a public demo can exceed them; set a budget alert.
