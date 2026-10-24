# FloodWay: full context for Claude Code

**Read this first.** It explains what this project is, what the competition requires, what is built and what is only planned, what the team has already decided, and what is still open. Read `AGENTS.md`, `docs/ai/PROGRESS.md` and `scripts/check.ps1` before you change any code. The rules in `AGENTS.md` still apply and win over anything written here.

Last updated: 2026-10-24.

---

## 1. What this project is

**FloodWay** is a flood-warning and routing app for Malaysian townships. It has four inputs and one four-level warning:

| Level | Meaning |
|---|---|
| Normal | No action |
| Advisory | Be aware |
| Warning | Prepare to move |
| Danger | Move now, to the open relief centre the app routes you to |

The rule in `README.md`: any single input can raise a level, and two inputs at Warning raise the level to Danger.

The four inputs:
1. **Water-level sensor** (ESP32 node with a JSN-SR04T ultrasonic sensor, HMAC-signed posts to the backend)
2. **Photo check** (a resident's flood photo, checked by a Gemini model, OpenRouter as fallback)
3. **CCTV / barrier** (planned: clip check; `firmware/floodway_barrier.ino` drives a barrier servo that polls the backend)
4. **Forecast** (GRU level forecaster, trained only on synthetic data so far; GINKGO Model 1 is a separate susceptibility map)

Stack today (Google, per `docs/plans/GLOBAL_STACK_PLAN.md`):
- Frontend: React 19, TypeScript, Vite, Tailwind 4, Leaflet with OpenStreetMap
- Mobile: Expo / React Native (Android)
- Backend: FastAPI, OpenCV
- Sign-in and data: Firebase Authentication, Cloud Firestore
- AI: Gemini API (`GEMINI_API_KEY`), OpenRouter fallback (`routes/ai_check.py`)
- Planned: Cloud Run (backend), Firebase Hosting, Cloud Storage for Firebase, Firebase Cloud Messaging, Google Earth Engine, Secret Manager, Cloud Logging. Telegram alerts stay.

---

## 2. Competition context (two tracks, do not mix them up)

### 2a. Huawei ICT Competition 2026–27, Innovation Track (the active one)

- **Team:** RESQ4ACE (Universiti Teknologi MARA). Members named in the materials: Luqman, Nadi, Tisya. Treat names as given in the docs; do not guess roles beyond what the docs say.
- **Preliminary round:** done. One landscape slide or poster only. Presentation is about 5 minutes. Judges valued presentation quality, uniqueness, feasibility and affordability. Source: `docs/product/preliminary-round/MEETING_SUMMARY.md` (transcribed with Whisper `base`; check names and numbers against the recording before quoting them).
- **Semi-final:** Tuesday 3 November 2026, TRX. 15-minute presentation plus 5 minutes of Q&A.
- **Deadlines:**
  - Confirm participation: **Monday 26 October**
  - Slides due: **Wednesday 28 October, 3 PM**
  - Semi-final: **Tuesday 3 November**
- **Topic:** "Creating Innovative AI Applications Powered by Huawei Cloud".

**Mandatory rules from the topic brief (screenshots from the user):**
- The application **must be deployed on Huawei Cloud**. At least one Huawei Cloud service must be used (the rules name ECS, RDS and DCS as examples).
- **Regional and Global shortlisted entries must be open-sourced on Gitee or GitHub.**
- **Reproducibility rule:** the committee reproduces results from the submitted materials. If the numbers cannot be reproduced, the entry loses eligibility.

**Review weights** (the user's screenshots; confirm which table applies to the semi-final):

| Stage | Innovation | Application value | Completeness and demonstrability | Presentation and Q&A | Application and implementation progress | Presentation |
|---|---|---|---|---|---|---|
| Preliminary and National | 60% | 40% | | | | |
| Regional | 40% | 35% | 15% | 10% | | |
| Global | 40% | 30% | 15% | | 10% | 5% |

**Conflict to resolve first:** the code and the Google-stack plan removed Huawei on 2026-10-20. The semi-final rules require Huawei Cloud deployment and open source. The team has to decide: (a) bring back a Huawei Cloud deployment for the semi-final, at least one service, or (b) withdraw. Do not change the stack until the team decides. See section 7.

### 2b. Sime Darby Property University Hackathon 2026, "Township of Tomorrow"

- The Google-stack plan was written for this event. It references a **23 October** deadline, which has now passed. Confirm the status with the organiser before doing more work for it.

---

## 3. Judging material and reference links

- **Dossier (venture case for Dr Azliza):** https://claude.ai/artifact/QJR6spNtuMGBAhyoJdfH95 (version 2). It includes the judging-criteria table, the Huawei Cloud mandate, the open-source requirement and the reproducibility rule. Sharing was changed to "Anyone with the link" when it was republished. Check the Share menu and set it back to private if needed.
- **Source document (local):** `/home/claude/scratchpad/dossier.html` (may not exist on the device; the artifact is the master copy).
- **Cost and differentiation report:** `/home/claude/reports/FloodWay IoT node cost and differentiation.md` (and research notes folder). Covers the IoT node cost, feasibility, the existing government systems, and the venture-capital evaluation.
- **Renders:** `FloodWay_RiverNode_3D.png` and `FloodWay_RiverNode_Blueprint_4views.png` (in `/mnt/user-data/outputs/`).
- **IoT and Crowd Plan document:** Claude Docs doc `71c4622c-5ca7`, all sections filled.
- **Competitor (Tower Rangers):** Universiti Malaya, Team EEyerrr, Huawei ICT 11th Topic 1. Predicts tower failure in floods. Uses ModelArts, OBS, RDS PostgreSQL, Pangu-Weather, MaaS, DCS Redis, CCE/ECS and SMN. Claims RM50 per tower per month and 70% ROI. Their accuracy is stated "on synthetic labels". See `docs/team/ANALYSIS_CURRENT_VS_BENCHMARKS.md`.
- **Reference repo:** https://github.com/keanteng/streamlit_floodv2 (Streamlit app, flood incidents in Malaysia 2015–2021, plus Sentinel-1 flood-extent mapping through Google Earth Engine). Cloned to the scratchpad on 2026-10-24. **Licence: the LICENSE file is GPL-3.0, but the README badge says MIT.** Treat it as GPL-3.0 until the author confirms. Its incident data is in `analytics/data2/`; profile in `docs/team/KEANTENG_DATASET_PROFILE.md`. The data is presence-only (incident locations, no "no flood" rows).
- **JPS flow image:** `1792853129574_image.png` (the user's upload, describing the JPS flood-alert flow). **It was not found in the sandbox or uploads on 2026-10-24.** Ask the user to re-attach it. This document does not describe its contents.
- **Pitch script:** `docs/product/preliminary-round/PITCH_SCRIPT.md` (about 4 minutes 30 seconds; three speakers).
- **Poster:** `docs/product/preliminary-round/poster/FloodWay_Poster_1920x1080.png` (landscape, one page).

---

## 4. Honesty rules (from `AGENTS.md`, plus the judging rules)

1. Say "planned" until it runs. Do not describe a feature as working because it is coded.
2. Show no accuracy the repo cannot reproduce.
3. Synthetic data only proves a pipeline. Never quote its metrics as performance.
4. Model 1 (GINKGO) has **no accuracy claim** until the owner supplies the feature list and notebook, and the leakage tests pass.
5. The river node's distance-to-level conversion is a bench measurement. Do not claim field accuracy.
6. The honesty tests in the repo ban the word "Huawei" in API text. Keep that as it is, unless the team decides to change it.

Guard rails (do not change without an explicit decision): `isFullyVerified`, `RequireAuth`, `firestore.rules`, `require_write_token`, `levels.py` and `DANGER_AT`.

---

## 5. What is built, partly built, and planned

| Area | Status | Where |
|---|---|---|
| Four-level warning engine | Built | `backend/`, `levels.py` (guarded) |
| Frontend map and routing | Built (OpenStreetMap, Leaflet, OSRM) | `frontend/` |
| Android app | Built, APK pending | `mobile/` (Expo) |
| Firebase sign-in and Firestore | Built | guard rails apply |
| Photo check (Gemini, OpenRouter fallback) | Coded, 3 tests added; **live call not run** | `routes/ai_check.py` |
| ESP32 water-level node | Firmware written; **5 V echo not divided** (see section 7) | `firmware/floodway_node.ino` |
| HMAC-signed posts, 120 s clock skew limit | Coded | node and backend |
| Barrier controller (fail-safe: closed and blinking after 15 s without server) | Coded | `firmware/floodway_barrier.ino` |
| GRU level forecaster | Pipeline only; **synthetic data only** | `models/ml_pipeline/flood_core.py`, `nb2_train.py` |
| Data acquisition notebook | Endpoints **not tested** | `models/ml_pipeline/nb1_data.py` |
| GINKGO Model 1 (RF, HGB, DT, LR) | Files present; **no accuracy claim**; feature list missing | `models/ginkgo/` |
| Legacy ANN notebook | Staged, **not read** | `models/legacy_ann/flood_detection_using_ann.ipynb` |
| Huawei ModelArts, OBS, ECS, SMN, RDS code | **Removed** 2026-10-20 (kept in git history) | — |
| Cloud Run deploy | Planned | `backend/Dockerfile` |
| Firebase Hosting | Planned | `frontend/dist` |
| Firebase Cloud Messaging | Planned (Telegram in place) | — |
| Earth Engine features for Model 1 | Planned | — |
| CCTV clip check (Gemini video) | Planned, after the steps above | — |

---

## 6. Open items (owner in brackets)

1. **Feature list and training notebook for GINKGO Model 1** (Nadi). Nothing can be shown for Model 1 without them.
2. **Huawei Cloud vs Google stack for the semi-final** (team decision, urgent, before 26 Oct).
3. **Echo-pin voltage divider** on the ESP32 node (hardware).
4. **Cloud Run deploy** of the backend (`gcloud run deploy floodway-api --source backend --region asia-southeast1`).
5. **Rotate the OpenRouter key and the Telegram token** (they were exposed).
6. **Move device HMAC secrets out of `config.py`** (PROGRESS open item 6).
7. **Android APK build.**
8. **Live Gemini photo check** (one real photo, record the result).
9. **Check the data licence** for the flood dataset and the GINKGO models. The PLAN-AI terms may limit reuse.
10. **Small-tunnel case study** (Seksyen 7 Shah Alam) and the Aeon Bukit Raja flood: not confirmed with the lecturers.
11. **The user-stated claims** to verify before they go on a slide: the IMU first-prize claim and the GeoAI ASEAN win.
12. **Preliminary-round organiser questions:** whether a single landscape page is accepted in writing, whether all three members must be on screen, and who the point of contact is.

---

## 7. Known problems to fix or flag

- **Echo pin voltage:** the JSN-SR04T outputs 5 V on ECHO, but `firmware/floodway_node.ino` wires ECHO straight to GPIO 26 (the ESP32 is 3.3 V). Use a resistor divider (for example 1 kΩ and 2 kΩ) or a level shifter. Earlier guidance applied the divider only to the HC-SR04; that was incomplete.
- **Dataset provenance:** `datasets/_MalaysiaFloodDataset_MalaysiaFloodDataset.csv` has 825 rows, 347 flood-positive, 75 districts, 2000–2010. Its source is not documented. Document it before using it in any claim.
- **keanteng dataset is incident-only.** 5,463 geocoded records (2015–2021, from DID annual reports per the README), 105 duplicate rows on (Date, Place, State), latitudes outside Malaysia (range −6.2 to 35.7; some geocodes are wrong), and no negative examples. Do not train a flood/no-flood classifier on it without building negatives first (see the training guide).
- **Licence conflict:** keanteng LICENSE is GPL-3.0; README badge says MIT. Our repo must respect whichever applies to any code or data we reuse.
- **Leakage risk in GINKGO Model 1:** the decision tree's first split is `x3 <= 1.5`, and that branch always predicts "no flood". If `x3` is a scenario number or derived from the label, the 99% accuracy comes from it, not from the terrain.
- **GRU forecaster:** trained only on synthetic data. Its metrics are not evidence of performance.
- **Model 2 table in the GINKGO benchmark:** its file sizes match Model 1's files exactly. It describes scikit-learn files, not a U-Net. Do not reuse it.
- **Public text still names Huawei** in some legacy pack files (kept on purpose as records). Do not rewrite the earlier round's records.

---

## 8. How to work in this repo

1. Read `AGENTS.md`, then `docs/ai/PROGRESS.md`.
2. Make the smallest change that answers the request.
3. Run `scripts/check.ps1` (Windows) before stopping.
4. Update `docs/ai/PROGRESS.md` before stopping, as `AGENTS.md` requires.
5. Do not touch guarded areas (section 4) without asking.
6. Do not claim a Huawei Cloud deployment, an accuracy number, or a working feature unless it has been run and recorded.

---

## 9. Chat history that shaped this (summary)

- The team's venture dossier for Dr Azliza was drafted, then corrected to include the judging criteria, the Huawei Cloud mandate, the open-source rule and the reproducibility rule. The earlier advice to "drop the cloud claims" was wrong for this topic.
- A cost and differentiation report on the IoT node was written, with 3D and blueprint renders.
- Lecturers asked the team to: confirm participation by 26 Oct, consider cost feasibility, act as a venture capitalist, differentiate from current government systems, and check flood case studies (the small tunnel in Seksyen 7 Shah Alam and Aeon Bukit Raja).
- Tisya raised a hyper-localisation idea: devices talking to each other offline when power and Wi-Fi are out. See `docs/team/ANALYSIS_CURRENT_VS_BENCHMARKS.md` section 5.
- The user asked for an analysis of the current system against the reference repo and Tower Rangers, a checklist, a model-training guide, and this context file.

---

## 10. Files written for this request

- `docs/team/CLAUDE_CODE_CONTEXT.md` (this file)
- `docs/team/ANALYSIS_CURRENT_VS_BENCHMARKS.md`
- `docs/team/CHECKLIST.md`
- `docs/team/MODEL_TRAINING_GUIDE.md`

These are documentation only. No code, no guard rails and no `PROGRESS.md` entry were changed by writing them.
