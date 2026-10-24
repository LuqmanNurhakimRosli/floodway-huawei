# FloodWay vs the reference repo and Tower Rangers

Date: 2026-10-24. Status: a working analysis. It is honest about what was and was not read.

**Evidence limits.** Read directly: the FloodWay repo (AGENTS.md, README, firmware, GINKGO MODEL_CARD, nb1 and nb2 scripts, the dataset header and counts, PROGRESS.md in part, GLOBAL_STACK_PLAN.md, MEETING_SUMMARY.md). Read directly on 2026-10-24: the keanteng repo (cloned over HTTPS; README, LICENSE, requirements, the incident CSV schema and counts). Not read: keanteng's Python app code beyond the file list, the Tower Rangers slide (not in the sandbox; only the user's summary), the JPS flow image (not found), and the legacy ANN notebook. Anything marked "unverified" must be checked before it goes on a slide.

---

## 1. Current FloodWay system (what it does)

- Four inputs (water-level sensor, photo check, CCTV or barrier, forecast) feed one four-level warning: Normal, Advisory, Warning, Danger.
- Any single input can raise the level; two Warning inputs raise it to Danger.
- The app shows a map (OpenStreetMap, Leaflet), routes to an open relief centre (OSRM), and supports Telegram alerts.
- Sensor posts are HMAC-SHA256 signed; the server rejects clocks more than 120 s apart.
- The barrier fails safe: closed and blinking after 15 s without a server response.
- The photo check uses Gemini (OpenRouter fallback) and names the engine that ran.

**Strength:** an end-to-end product with hardware, a signed data path and a routing output that a resident can act on.

**Weakness:** the machine-learning parts are not yet evidence. The forecaster is synthetic-only, and GINKGO Model 1 has no accuracy claim until its features and notebook are supplied.

---

## 2. Comparison table

| Dimension | FloodWay (now) | keanteng/streamlit_floodv2 (README only) | Tower Rangers (slide summary) |
|---|---|---|---|
| Problem | Township flood warning and evacuation routing | Visualises flood incidents in Malaysia 2015–2021 and estimates flood extent from Sentinel-1 SAR (Earth Engine). A mapping tool, not a predictor | Predict **tower failure** during floods (telecom infrastructure) |
| Data | Sensor (ESP32), photos, forecast; GRU trained on synthetic data; a 825-row district-year rainfall CSV of unknown provenance | 5,463 geocoded incident records, 2015–2021, presence-only; no no-flood rows; 105 duplicates; some bad coordinates | Not stated in detail in the summary; uses Pangu-Weather (forecast) and a database (RDS PostgreSQL) |
| Model | GRU (quantile), Model 1 classifiers (RF, HGB, DT, LR), Gemini for images | No predictive model in the README; mapping and statistics | Unverified; runs on ModelArts |
| Evaluation | Honest: "no accuracy" until reproducible | Unverified | "Accuracy on synthetic labels" (the claim is weak evidence) |
| Business case | Cost report, differentiation from government systems, venture-capital evaluation | Unverified | Claims RM50 per tower per month, 70% ROI |
| Huawei Cloud | **Removed 2026-10-20**; the semi-final requires it | Unverified | Uses ModelArts, OBS, RDS, DCS, CCE/ECS, SMN, MaaS, Pangu |
| Open source | Repo on GitHub; GPL-3.0 notes in the planning docs | Public on GitHub; LICENSE says GPL-3.0, README badge says MIT (conflict) | Unverified |
| Hardware | ESP32 node, barrier servo, river node | None known | None known |
| Live demo | Cloudflare Pages (to move to Firebase Hosting) | Unverified | Unverified |

---

## 3. Where FloodWay is weaker than the rivals (be honest about it)

1. **Evidence.** Tower Rangers quotes an accuracy number, even though it is on synthetic labels. FloodWay quotes none. The judges reproduce results, so the honest path is a reproducible small benchmark, not a larger claim.
2. **Huawei Cloud.** The competitor uses the full Huawei stack. FloodWay has none, so it fails the mandatory rule as things stand.
3. **Model 1.** Its inputs are unknown and it may leak through `x3`. It cannot be presented until step 0 of the work order is done.
4. **Business case.** Tower Rangers gives a clear RM figure and ROI. FloodWay's cost report exists but must be turned into one line a judge can check.

## 4. Where FloodWay is stronger

1. **Working hardware path.** A real signed sensor-to-server data path, with a fail-safe barrier. Tower Rangers has no hardware in the materials summarised.
2. **Resident-facing output.** A route to a relief centre, not only a prediction for an operator.
3. **Honest claims.** The repo bans unsupported numbers in code and in the text.
4. **Cost.** A low-cost node (ESP32-based) fits the "affordability for society" criterion from the preliminary round.

## 5. Hyper-localisation (Tisya's idea): offline device-to-device communication

Idea: when power and Wi-Fi are both out, nearby devices still pass a flood warning to each other.

**What works, with the honest limits:**

- **ESP32 to ESP32, no router: ESP-NOW.** Connectionless, low power, runs on the same chip as the node. Range is short: tens of metres indoors, a few hundred metres in clear line of sight. Good for a street-level chain of nodes, where each relays to the next. Not verified on this hardware.
- **Phone to phone: Bluetooth Low Energy (BLE) or Wi-Fi Direct.** Phones cannot speak ESP-NOW natively. BLE gives short range (tens of metres) and works on most phones; Wi-Fi Direct gives more range but drains battery faster. Both need the app to implement them; neither is in the repo.
- **Kilometres: LoRa or Meshtastic.** The ESP32 has no LoRa radio. You need a LoRa module (for example SX1262 or SX1276) on the node, or a LoRa board. This gives the range a township needs. Meshtastic is an open-source mesh built on LoRa and is a practical starting point.
- **Power is still a problem.** Nodes need battery, and a solar panel for a multi-day outage. The current node design does not mention a battery.

**Recommendation for the pitch:** say "planned" and name the path. Phase 1: ESP-NOW between nodes, to show offline relay in a demo. Phase 2: LoRa or Meshtastic for longer range. Do not claim a working offline network until it has been tested with the real radio.

**Question to ask the team:** does the semi-final need the offline network, or is it a future-work slide? It is a large build for the time left.

## 6. Recommended positioning for the semi-final

- Lead with the signed sensor path and the fail-safe barrier (real, testable).
- Show Model 1 as "evaluation in progress", with no number until the leakage test passes.
- Show the business case as a range with its assumptions named, not a single ROI claim.
- Name the Huawei Cloud decision openly. Do not claim a deployment that does not exist.

## 7. Actions

1. Team decision on Huawei Cloud for the semi-final (before 26 Oct).
2. Read the keanteng data folder and code (blocked now; try a clone through the allowed route, or ask the user to attach the files).
3. Read the Tower Rangers slide again and record its exact numbers and method.
4. Fix the echo-pin divider in the hardware (see the context file, section 7).
5. Decide whether the offline network is in the pitch.
