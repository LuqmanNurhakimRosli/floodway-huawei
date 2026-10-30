# Semi-final plan: four-factor fusion UI, IoT node, Huawei Cloud deploy

Date: 2026-10-26. Semi-final: **Tue 3 Nov 2026**, Huawei Malaysia, TRX (report 7:45 AM; 15 min talk + 5 min Q&A). **Slides due Wed 28 Oct, 3:00 PM** by email (can still change before the day).

Inputs read: Tisya's pack `floodway-huawei-tisya.zip` (Stage 5 benchmark, 10 saved models, retrospective route and card), Nadi's `Floodway IoT.zip` (ESP32 bench node, photo, sketch), the topic and review-criteria screenshots, the organiser email, current `/live` code.

---

## 1. Findings and hypotheses

### Tisya's model (numbers used as reported, not retrained)

| Benchmark (test = 2020-21, train <= 2019, N=170) | Best model | ROC-AUC [95% CI] | Top 17 ranked places |
|---|---|---|---|
| A: random landscape background | Logistic Regression | **0.836** [0.777, 0.892] | **17 of 17 were real past flood sites** (Recall@10% = 17/85) |
| B: lowland-only background (harder) | CatBoost | **0.782** [0.710, 0.849] | 13 of 17 |

- **Strongest honest pitch line:** "Trained on 2015-2019 JPS-reported floods, tested on 2020-2021 floods it never saw: AUC 0.84, and the 17 places it ranked highest were all real flood sites." Source line under it: "5 inputs: 1/3/7-day prior rainfall (ERA5), elevation and slope (Copernicus DEM). Retrospective test, not a live forecast."
- The temporal split (train past, test future) is a real strength: `docs/team/RESEARCH_MALAYSIA_FLOOD_BENCHMARK.md` found no Malaysian flood paper in its notes reporting spatial or year-blocked validation. This is the innovation and rigour point for Q&A.
- **Hypothesis H1 (terrain shortcut):** on Benchmark A the model partly learns "low and flat = flood" (LR elevation coefficient -1.07, slope -0.93). Benchmark B removes that and AUC falls to 0.72-0.78. Use B as the "hard mode" answer when a judge asks "isn't it just elevation?".
- **Hypothesis H2 (season shortcut):** 72% of training floods are in Sep-Feb vs 45% of background. On a season-matched subset LR on B drops to 0.58 while boosted trees hold about 0.75-0.76. Conclusion to say aloud: trees read rainfall pulses, not just "it's monsoon season".
- **What the model is and is not:** it answers *where* floods have happened under given prior rain. It outputs a relative score, not a probability, and Tisya's own report says it must not be used as an operational warning. The UI must call it "flood-prone score", never "chance of flood".
- **Two things to fix before the slides go out:**
  1. `retrospective_screener.py` describes Benchmark B as "elevation <= 236 m, slope <= 11.8 deg"; the report says <= 125 m and <= 14 deg. One of them is stale; ask Tisya which, and fix the text.
  2. Data licence: the positives come from a third-party compilation of JPS reports (keanteng repo: LICENSE says GPL-3.0, badge says MIT). The rules require open source for the regional round, so the README must state this provenance and licence, and the repo needs its own `LICENSE` (there is none today).

### Nadi's IoT node (ESP32 + HC-SR04 + 3 LEDs + buzzer + 20x4 LCD)

- Works as a stand-alone bench gauge: 1-8 cm range (a cup or tank), SAFE <= 33%, WARNING <= 66%, DANGER above, siren on DANGER.
- **It does not talk to FloodWay yet.** It sends `percentage,STATUS` over **Bluetooth Classic** (`BluetoothSerial`). The server's `/api/v1/ingest` wants signed WiFi HTTPS with `distance_cm` 10-800 (`firmware/floodway_node.ino` already does this). Web Bluetooth cannot read Bluetooth Classic, so the browser cannot read it directly.
- **False-alarm bug:** `pulseIn` has no timeout and returns 0 when no echo comes back. 0 clamps to 1 cm, which reads 100% DANGER, so a loose wire or a bad angle sounds the siren. Fix: `pulseIn(echoPin, HIGH, 30000)` and skip a reading of 0.
- HC-SR04 echo is 5 V and the ESP32 pin takes 3.3 V. Add the voltage divider (already listed as open in `docs/team/ANALYSIS_CURRENT_VS_BENCHMARKS.md`).
- Pitch framing: "bench-scale prototype of the river node", alongside the 3D River Node model and blueprints in the handover pack. It must not be presented as a deployed river sensor.

### Hypothesis H3: the four factors cover four time scales (the core story)

| Factor | Answers | Time scale | Status for the demo |
|---|---|---|---|
| Flood-prone model (Tisya) | **Where** floods happen | Years of history | Real model, historical inputs |
| MET Malaysia rain warning | **When** rain is coming | Hours to days ahead | Real public API if `api.data.gov.my/weather/warning` answers (verify); else a labelled scripted warning |
| IoT water depth (Nadi) | **How high now**, at one point | Seconds | Real bench node |
| CCTV vision | **How high now**, over an area | About 1 min | Real analyser on SAMPLE frames |

No single source is trusted alone: FloodWay escalates when **independent factors agree**. That rule, not any one model, is the innovation claim (Innovation is 40% of the score). Single-source products do one row: MyPublicInfoBanjir shows gauges, MET shows warnings, and Tower Rangers predicts tower failure.

### Tower Rangers (Dr Azliza's ask), short version

They use the full Huawei stack (ModelArts, OBS, RDS, DCS, ECS, SMN, Pangu) and quote accuracy on synthetic labels. FloodWay should answer with: (a) a real Huawei deployment (section 3), (b) a held-out-year result on real reported floods, (c) physical hardware on the table. Full table: `docs/team/ANALYSIS_CURRENT_VS_BENCHMARKS.md`; refresh its rows with Tisya's numbers.

---

## 2. Implementation plan: four-factor fusion on `/live`

### 2.1 Fusion rule (plain code, says it is rule-based)

`backend/app/services/fusion.py` (new) and `frontend/src/lib/fusion.ts` (same rule, used offline when `VITE_VISION_MOCK=1`).

Each factor maps to `0 normal | 1 watch | 2 warning | 3 danger | null no data`:

- IoT: the node's own SAFE/WARNING/DANGER, or the depth phase from `/ingest`.
- CCTV: the existing vision `Level` (no threshold in `levels.py` changes).
- Flood-prone: model score banded into low/medium/high. Report the bands as "score band", not as a risk percentage.
- MET: none, yellow (advisory), orange (warning), red (danger) warning in that district.

Fused level: the **highest live reading (IoT or CCTV)** sets the floor. It goes **up one step** when at least one other factor is at warning or above. It is capped at "watch" when only the context factors (model, MET) are raised and no live reading agrees. Every result carries `why: string[]`, for example `["IoT node 72% DANGER", "Camera Klang WARNING", "MET orange warning Kuala Lumpur"]`. Unit tests cover each rule.

### 2.2 Screens and motion

1. **Fusion hero on `/live`** (above the camera feed, new `components/live/fusion/`):
   - Four factor tiles (Model, MET, IoT, CCTV), each with an icon, value, status chip, source label (REAL / SAMPLE / SCRIPTED) and a "last update" age.
   - SVG connector lines from each tile into a central **risk ring**. The ring fills to the fused level and its colour follows the level tokens.
   - Motion: a tile that changes pulses once (scale 1 to 1.04, 180 ms ease-out). A dash travels along its line into the ring (`stroke-dashoffset`, 600 ms). The ring then sweeps to the new value (400 ms ease-out). Only transform, opacity and dashoffset animate. `prefers-reduced-motion` shows the end state with no movement.
   - The "why" list sits under the ring, one line per agreeing factor.
2. **IoT tile detail:** a live depth bar that mirrors the node's LCD (`Level 72% DANGER`), a 2-minute sparkline (reuse `shared/Sparkline.tsx`), and a connection dot (green when a reading arrived under 10 s ago, grey with "node offline, last seen 2 min" otherwise). Show a small photo of the real node so judges link the screen to the hardware.
3. **Model tile detail:** a sheet with the 5 inputs for this place, the score band, and the line "AUC 0.84 on 2020-21 floods, held-out years". Reuse Tisya's `RetrospectiveScreenerCard` content inside the sheet, not on Home.
4. **Map:** camera pins and hotspots take the fused level (`VisionHazardLayer.tsx`). The IoT node gets its own pin.
5. **Home:** one fused-status card ("Kampung Baru: DANGER, 3 of 4 factors agree") that links to `/live`.

### 2.3 Scripted storm and dummy notifications (your idea)

A **"Play storm scenario"** button on `/live` (also `?demo=storm` for the presenter). It runs a 90 s timeline; the real node overrides the IoT steps when it is connected.

| t | Event | Notification shown |
|---|---|---|
| 0 s | MET orange warning, Kuala Lumpur | "MET Malaysia: heavy rain warning for KL, next 6 h" (tagged SCRIPTED unless the live API is used) |
| 15 s | Model score for Kampung Baru moves to high (prior 3-day rain rises) | "Flood-prone area: Kampung Baru is in the top band" |
| 35 s | IoT node goes to WARNING (presenter pours water into Nadi's cup) | "Sensor fw-bench-01: water at 55%" |
| 55 s | CCTV Klang sample camera goes to WARNING, then DANGER | "Camera confirms rising water" |
| 60 s | Fusion: 3 of 4 agree, DANGER | Full alert: "Leave now. Route to SK Kampung Baru shelter" plus Telegram (existing) and the Huawei SMN email/SMS (section 3, if done) |

Notifications use the existing `AlertToast` and `useAlertEffects`, plus the browser Notification API after a one-time permission tap. Each notification is labelled DEMO.

### 2.4 Connecting Nadi's node (pick one; A is better)

- **A. WiFi (recommended):** add WiFi + signed HTTPS POST from `firmware/floodway_node.ino` into Nadi's sketch. Keep the LCD, LEDs and buzzer, and use a phone hotspot at the venue. Register a `fw-bench-01` device in `DEVICES` with `mount_height_cm: 8` and a bench profile, so the 10 cm schema minimum applies to river devices only. This is a schema change, not a vision threshold change.
- **B. Laptop bridge (fallback):** pair the ESP32 over Bluetooth, which gives a COM port on Windows. `scripts/bench_bridge.py` reads `percentage,STATUS` lines and POSTs them with the write token.
- In both cases also fix the `pulseIn` timeout and the echo divider.

### 2.5 Work order and files

**Status 2026-10-26:** tasks 0, 1, 3 and 4 done (fusion rule `POST /api/v1/fusion`; panel in `components/live/fusion/`; storm via the button or `/live?demo=storm`). Benchmark B bounds settled as -4..125 m, 0..14 deg (the generating script). Still open: 2 (node hookup), 5 (live MET), 6 (map + Home), and the real node overriding the scripted IoT steps.

| # | Task | Files | Owner |
|---|---|---|---|
| 0 | Merge Tisya's pack (models, datasets, scripts, `routes/retrospective.py`, service, tests, card) and fix the Benchmark B bounds text | `models/stage5_*`, `datasets/`, `backend/app/...`, `frontend/src/...` | Luqman + Tisya |
| 1 | Fusion rule + tests (backend and frontend copies) | `services/fusion.py`, `routes/fusion.py` (`GET /api/v1/fusion?site=`), `lib/fusion.ts` | Claude |
| 2 | Bench device + bridge or WiFi firmware | `config.py`, `telemetry.py`, `firmware/floodway_bench_node.ino`, `scripts/bench_bridge.py` | Nadi + Claude |
| 3 | Fusion hero, tiles, ring, motion | `components/live/fusion/*`, `LiveVisionPage.tsx` | Claude |
| 4 | Storm scenario + notifications | `lib/fusion/stormScript.ts`, `hooks/useStormScenario.ts` | Claude |
| 5 | MET live warning (with offline fallback) | `services/met.py` (server-side fetch, cached 10 min) | Claude |
| 6 | Map + Home fused status | `VisionHazardLayer.tsx`, `HomePage.tsx` | Claude |
| 7 | Checks: `scripts/check.ps1`, layout check on `/live` at 4 sizes, a run with the real node | - | all |

Each factor tile is labelled with its source (REAL / SAMPLE / SCRIPTED). That keeps the AGENTS.md honesty rules: the sample cameras stay SAMPLE, and scripted MET data is never called live.

---

## 3. Huawei Cloud strategy (Semi-Final vs. National Final)

**Advisor decision (Dr. Azliza, 30 Oct 2026):**
- Direct student registration on Huawei Cloud is blocked by China phone number / enterprise verification requirements, and official Huawei Cloud accounts/credits are provisioned to teams **when they advance to the Finals**.
- **For the Semi-Final (Tue 3 Nov 2026):**
  1. **Highlight the Huawei Cloud services in the presentation and video:** Present the complete Huawei Cloud architecture (**ModelArts**, **OBS**, **ECS**, **SMN**, and **CodeArts** for build/deployment) and state clearly what each service does in FloodWay's workflow.
  2. **Demo & QR Code:** Use the live Cloudflare Pages prototype link (`https://floodway.pages.dev/` or `https://floodway-huawei.pages.dev/`) for the judge QR code and stage demo.
  3. **Know how to defend every service in Q&A:** Judges rarely audit live cloud consoles during the semi-final, but every team member must be able to explain *how* and *why* each Huawei Cloud service is used.
- **For the National Final (18 Nov 2026, once official Huawei Cloud access is granted):**
  - Execute the ready-made deployment kit in `deploy/ecs/` (`docker-compose.yml`, `Caddyfile`, `setup.sh`) on the provisioned Huawei Cloud ECS instance, upload datasets/models to OBS, and run the ModelArts job.

### Tier 1 (ready in `deploy/ecs/`, execute on official Finalist ECS): one ECS runs everything

1. Create an **ECS** in AP-Singapore (pick AP-Kuala Lumpur if your console lists it). Use Ubuntu 22.04, 2 vCPU / 4 GiB, with an **EIP** (public IP). Security group: allow 22 (your IP only), 80 and 443.
2. Install Docker. Run the existing `backend/Dockerfile`, plus **Caddy** serving `frontend/dist` and proxying `/api` and `/ws` to the backend. Caddy gets a free HTTPS certificate for `<EIP>.sslip.io`, so no domain purchase is needed and there is no mixed-content problem.
3. Build the frontend with `VITE_API_BASE=https://<EIP>.sslip.io` (not mock), so the deployed demo is the real backend: live analyser, alerts, `/ingest` from the node, and Tisya's `/api/v1/retrospective`.
4. Set `VISION_WRITE_TOKEN`, `CORS_ORIGINS`, the Gemini key and the Telegram token as container env vars on the ECS only (never in `VITE_*`). Move the device secrets out of `config.py` (open item 6).
5. Keep Cloudflare Pages as the backup URL.

### Tier 2 (should): two more services that do real work

- **OBS** bucket: store the 10 model files, the datasets and the sample frames. The backend downloads models from OBS at start-up. This is also the "relevant datasets" link the regional round asks for.
- **SMN (Simple Message Notification):** a second alert channel next to Telegram. On a fused DANGER the backend publishes to an SMN topic, and team members subscribe by email (SMS may need template approval; email first).

### Tier 3 (stretch, only if time remains)

- **DCS for Redis** to hold the latest fused state per site, so a restart keeps it and two backend containers agree.
- **ModelArts**: host Tisya's saved model as a real-time inference service, or run her training script once as a training job. Skip the job if it would mean retraining against Tisya's wishes; serving the saved `.joblib` is enough.
- **CodeArts Pipeline** to build and deploy to the ECS. The topic asks teams to show Huawei Cloud in "project building, bug fixing, and deployment", so one screenshot of a pipeline run is direct evidence for that line.

### What stays the same

Firebase Auth + Firestore, the Gemini 2.5 Flash photo check, Telegram, and OSM maps are unchanged. Say this plainly: "Hosted on Huawei Cloud ECS, models and data on OBS, alerts on SMN. Sign-in uses Firebase."

### Answers to earlier open questions (resolved 30 Oct 2026 with Dr. Azliza)

1. **Do teams get a Huawei Cloud account or credits?** Yes, official access is provided when advancing to the Finals (Dr. Azliza, 30 Oct). For the Semi-Final, explain the Huawei Cloud services in the slides/pitch and know how to answer technical questions on each.
2. **Prototype QR link for Semi-Final:** Confirmed with Dr. Azliza that sharing `https://floodway.pages.dev/` (or `https://floodway-huawei.pages.dev/`) on the slide QR code is approved.
3. **Which round's rubric applies on 3 Nov?** 15 + 5 minutes matches the Regional Competition row (Innovation 40, Application Value 35, Completeness 15, Presentation 10).

### Timeline (updated 30 Oct)

| Date | Done by end of day |
|---|---|
| Mon 26 – Thu 29 Oct | Tisya's Stage 5 pack merged; fusion rule + UI + storm scenario built; Nadi's bench node live link merged; `deploy/ecs/` kit committed & pushed to GitHub; Demo Video v2 rendered |
| **Fri 30 Oct** | **Advisor check-in completed (Dr. Azliza):** Semi-Final highlights Huawei Cloud services (`ModelArts`, `OBS`, `ECS`, `SMN`, `CodeArts`) and uses `floodway.pages.dev` QR link; live Huawei Cloud deployment runs in Finals once access is granted |
| Sat 31 Oct – Mon 2 Nov | Full rehearsal of 10 min talk + 2 min live stage demo (`docs/team/DEMO_PLAN_2MIN.local.md`) + Huawei Cloud Q&A defense (`JUDGES_QNA.md`) |
| **Tue 3 Nov (7:45 AM)** | **Semi-Final at Huawei Malaysia, TRX** |
| **Wed 18 Nov** | **National Finals at PICC Putrajaya** (deploy `deploy/ecs/` on official Huawei Cloud account) |
