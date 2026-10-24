# Checklist: Huawei ICT semi-final (Tue 3 Nov 2026, TRX)

Status key: [ ] not started, [~] in progress, [x] done. Owners are placeholders; fill them in.

## Deadlines

- [ ] **Mon 26 Oct:** confirm participation with the organisers
- [ ] **Wed 28 Oct, 3 PM:** slides submitted
- [ ] **Tue 3 Nov:** semi-final, 15 min presentation + 5 min Q&A

## 1. Decisions (team, before 26 Oct)

- [ ] **Huawei Cloud or not.** The rules require deployment on Huawei Cloud (at least one service, such as ECS, RDS or DCS). The repo is on Google since 2026-10-20. Pick one:
  - [ ] (a) Add a Huawei Cloud deployment (even a minimal ECS or RDS instance that runs the backend or database)
  - [ ] (b) Withdraw from the semi-final
- [ ] **Open source:** the semi-final needs a public Gitee or GitHub repo. Confirm the repo is public and the licence is stated.
- [ ] **Which review table applies** (the screenshots list Regional and Global weights; confirm).
- [ ] **Presenters:** three speakers, one laptop, one screen (confirm in writing).
- [ ] **Model 1 in the pitch:** show as "evaluation in progress" or drop it.

## 2. Compliance

- [ ] Application runs on the chosen cloud, with a URL the judges can open.
- [ ] Repo is public (GitHub or Gitee), with README, licence, and steps to reproduce.
- [ ] Every number on a slide can be reproduced from the repo (reproducibility rule).
- [ ] No claim of Huawei Cloud use unless it is deployed.
- [ ] Remove or label any statement that cannot be reproduced.

## 3. Hardware (echo pin)

- [ ] Add a resistor divider (for example 1 kΩ and 2 kΩ) on the JSN-SR04T ECHO line, or a level shifter, before the ESP32 GPIO 26 input.
- [ ] Bench test the node on a tape measure; record the reading and the error.
- [ ] Check the HMAC posts reach the backend, and the clock-skew rule holds.
- [ ] Keep the barrier fail-safe test (closed and blinking after 15 s without server).

## 4. Backend and deployment

- [ ] Cloud Run deploy of the backend (`gcloud run deploy floodway-api --source backend --region asia-southeast1`), or the Huawei Cloud equivalent if decision (a).
- [ ] Move device HMAC secrets out of `config.py` (PROGRESS open item 6).
- [ ] Rotate the OpenRouter key and the Telegram token.
- [ ] Run `scripts/check.ps1`; record the output.
- [ ] Live Gemini photo check: one real photo, result recorded.
- [ ] Frontend: Firebase Hosting (or Huawei equivalent) with `VITE_API_BASE` set; check the QR target before printing.

## 5. Model work

- [ ] Get the GINKGO Model 1 feature list and training notebook from Nadi.
- [ ] Run the leakage test (drop `x3` and the water indices; retrain; compare).
- [ ] Spatial block cross-validation; report High-class F1, kappa, confusion matrix.
- [ ] Hotspot check against random points.
- [ ] Follow `docs/team/MODEL_TRAINING_GUIDE.md` for the 825-row district dataset (grouped and time splits, baselines, five algorithms).
- [ ] Record every result with the seed, split and code version.
- [ ] Note that the GRU forecaster is synthetic-only; do not quote its metrics.

## 6. Slides and pitch (one slide, one landscape page, if the rule still applies)

- [ ] Problem, solution, impact sections (as the organisers advised).
- [ ] Show what is built vs planned. Judges value honesty about feasibility.
- [ ] Business case: a range, with assumptions named (not a single ROI claim).
- [ ] Differentiation from current government systems (one line each).
- [ ] Flood case studies: confirm the small-tunnel case (Seksyen 7 Shah Alam) and Aeon Bukit Raja with the lecturers before naming them.
- [ ] Check the IMU first-prize claim and the GeoAI ASEAN win before they go on a slide.
- [ ] Rehearse with three speakers and a timer (about 4 min 30 s; 15 min is the semi-final slot, so plan the Q&A too).
- [ ] Prepare Q&A answers: the Huawei Cloud decision, the dataset provenance, the leakage check, the offline network (Tisya's idea), and the business case.

## 7. Hyper-localisation (optional, decide first)

- [ ] Decide: in the pitch as "planned", or future work only.
- [ ] If planned: ESP-NOW between nodes (phase 1); LoRa or Meshtastic for range (phase 2). Battery and solar for outages.

## 8. Documents

- [ ] Dossier artifact: check sharing is what the team wants (it was changed to "Anyone with the link").
- [ ] Cost and differentiation report: link it from the slides, not paste it.
- [ ] `docs/ai/PROGRESS.md`: update before stopping any coding session (AGENTS.md rule).

## 9. Open questions for the organisers (in writing)

- [ ] Is a single landscape page still the rule for the semi-final?
- [ ] Must all three members be on screen?
- [ ] Who is the point of contact?
- [ ] Is an "EP" (or MVP or prototype) required? (Transcript unclear.)
