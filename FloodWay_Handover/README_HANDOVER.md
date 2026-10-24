# FloodWay: handover pack

**Date:** 20 October 2026 · **Updated:** 20 October 2026, late: stack moved to Google (section 8a), GINKGO Model 1 files added to the repo and inspected (section 4), poster and deck stack lines updated
**For:** Rakuman (team lead), and Claude Code on the laptop
**Project:** FloodWay flood early warning, entered in the Huawei ICT Competition 2026–2027

This one file explains everything in the zip: what FloodWay is, how the four prediction inputs work together (with a worked story), the river sensor device, the trained models and their status, the architecture poster, and what still needs checking. Read it first. The folders below hold the files it refers to.

---

## 0. Read this first (rules for anyone using this pack)

1. **Do not show any GINKGO benchmark number on a slide.** The two published benchmark tables are identical, and the top-model numbers (99.62% accuracy, 99.33% F1) almost certainly come from a random pixel split. Re-test before using them. See section 4.
2. **Do not claim accuracy for anything that has not been measured.** That includes the IoT sensor, the CCTV check, the Gemini photo check and the MetMalaysia link. Show them as targets or as "to be measured".
3. **Use the honest status words:** built and running, simulated or sample, designed but not built, planned. The repo's own rule (AGENTS.md) is the same.
4. **Do not name government agencies or use their acronyms on public material** (for example the water department, the met service, the city council or the fire service). The architecture poster follows this rule and the repo's honesty test enforces it.
5. **Do not put any Huawei name or logo on public material.** The Huawei code paths were removed from the repo on 20 October; the stack is now Google (section 8a).
6. **Paint 3D caveat.** The 3D device file is a GLB with plain materials, made to open in Paint 3D. Paint 3D was removed from the Microsoft Store in November 2024, and it was **not tested** in this work. Test on a Windows laptop before promising it to judges. A GLB viewer such as the Windows 3D Viewer replacement, Blender or an online glTF viewer also opens the same file.

---

## 1. Folder map

| Folder | What is in it | Use it for |
|---|---|---|
| `01_3D_device/` | `FloodWay_RiverNode_v1.glb` (device only, 47 parts, validated with 0 errors and 0 warnings), `FloodWay_RiverNode_v1_obj.zip` (OBJ, MTL and two textures), `FloodWay_RiverNode_v1.blend` (device only, textures packed), `FloodWay_RiverNode_v1_preview.jpg` | Paint 3D test, Blender video work, slides |
| `02_blueprints/` | `FloodWay_RiverNode_v1_Blueprints.pdf` (8 pages) and `FloodWay_RiverNode_S1.png` to `S8.png` (3840 x 2160, 16:9) | Build reference, slides |
| `03_architecture/` | `FloodWay_System_Architecture_1920x1080.png` (hackathon poster, 1920 x 1080) and its HTML source | Poster, slides |
| `04_docs_and_research/` | `Trained_model_evaluation.md` (the model evaluation doc, with the file inspection added at the end), `GINKGO_Model1_card.md` (what the four model files show), `Google_stack_plan.md` (the stack plan and Model 1 work order), `FloodWay_repo_overview.md` (what the code does and does not do), `FloodWay SDP hackathon competitive analysis.md` (research report), `FloodWay_SDP_Pitch_Deck.pptx` and `.pdf` (10 slides plus appendix) | Reference, supporting document |
| `05_source/iot/` | Python scripts that build the 3D scene, the line drawings, the blueprint sheets and the exports (section 10) | Regenerating the device and sheets |
| `05_source/architecture/` | The poster HTML and `render.py` (Playwright renders the PNG) | Changing the poster |
| `05_source/deck/` | `build_deck.py` (builds the pitch deck) | Changing the deck |
| `05_source/gv/` | `v.js` (glTF validator wrapper) | Checking the GLB |

The supporting Docs document (the research and FloodWay documentation for SDP, including the ChatGPT chart prompts) lives as an online document in Claude's document workspace and is not in this zip. The FloodWay repo itself (frontend, backend, Android app, models) is outside this zip; `FloodWay_repo_overview.md` describes it.

---

## 2. FloodWay in one paragraph

FloodWay warns residents of flood-prone places in Malaysia before the water reaches them. It combines four prediction inputs and turns them into one four-level warning: **Normal, Advisory, Warning, Danger**. Residents then see a colour on a map, a route that avoids flooded roads, and an alert by push notification or Telegram. The four inputs are:

1. **Trained models** (GINKGO Model 1 and Model 2, and the rainfall Random Forest). They work out *where* water collects and *how likely* a district is to flood after heavy rain.
2. **IoT river node** (the RiverNode device in this pack). It measures *how high the river is right now*.
3. **MetMalaysia forecast and warnings** (through the open data API at data.gov.my). They say *when* heavy rain is coming.
4. **CCTV cameras** (street cameras, with sample frames today). They show *what is happening on the road right now*, and a vision model gives an opinion on citizen photos.

Each input answers a different question, at a different speed. The rules that combine them are a small set of readable rules, not one more trained model. Section 3 tells the story of how they work together.

---

## 3. The story: how the IoT node and the four factors predict a flood

*This is an illustrative story. The times, levels and depths are examples, not a recorded event. Each step below says whether the piece is built, designed or a prototype.*

### Before the storm: the map already knows the place

Months before any storm, the trained models have done their work on the township. Model 1 (flood susceptibility) looked at satellite bands, water indices, terrain and distance to the river, and scored every pixel from 0 to 100. The underpass beside the river scored in the High band (65 and above). Model 1 cannot say *when* water will come. It says *where* water is likely to collect, so the team knows where to put the sensors and which roads to watch. Its output is a map layer for the front end. **Status: trained for the hackathon; the score is not yet validated on held-out areas.**

Model 2 (impervious surface) runs alongside it and measures how much land is sealed by concrete and roofs. Sealed land sends water into drains faster, so the township planner can see which blocks will flood sooner after the same rain. **Status: evaluation in progress; the real results are unknown.**

### 13:00: the forecast says the rain is coming

The MetMalaysia forecast and warnings reach FloodWay through the open data API. A heavy-rain warning is issued for the district. This is the **third input**, and it buys hours of notice, but it is not specific to one street.

Next, the rainfall trigger (a Random Forest) takes the forecast rain and the flood history for the district and works out a probability that the district will flood. It is a **prototype**: it reports a figure on an initial split, and the evaluation is still to be redone (section 4). When the district probability crosses its threshold, and the Model 1 score for the area is High, the system raises the district to **Advisory**. Residents see a yellow colour on the map and a notice to check their route and the nearest open shelter.

Nothing has reached the river yet. Advisory is a head start, not a confirmation.

### 14:10: the river node measures the water

The **IoT river node** sits on a bridge railing over the river. Its ultrasonic sensor points down at the water. It measures the distance from the sensor to the water surface, and the node turns that into a river height:

- Sound travels at a speed that depends on air temperature: c = 331.3 + 0.606 × T metres per second, where T is the air temperature in degrees Celsius. At 30 °C, c is about 349.5 m/s.
- The echo time t gives the distance: d = c × t / 2 (divided by two because the sound travels down and back).
- The river height above the bed is h = H − d, where H is the sensor's height above the bed.

Every five minutes the node wakes, takes a reading, and goes back to sleep. That keeps the battery and solar panel alive for days of cloud. The sensor's blind zone is 3 cm and its range is 3 to 450 cm; the 60-degree beam is wide enough to see the water across the channel.

At 14:10 the reading shows the water 5 cm higher than ten minutes earlier. At 14:25 the level crosses the surveyed **Warning** mark on the staff gauge painted on the node's post. The node sends a packet over its LoRa link within seconds. The beacon on the node turns amber. The sensor data alone can raise the district to **Warning** (under the rule "river level above the surveyed warning mark, or rising faster than the set rate while heavy rain is forecast").

The node is the piece that sees the river directly. It is also the piece that most needs real calibration. Its 3D model and blueprints are finished; the physical node is designed, not built.

A sensor can be fooled. A splash, a leaf on the sensor or a passing truck can give one wrong reading. The **sensor fault filter** holds a sudden jump bigger than water can rise until the next reading confirms it. The filter is built and tested in the repo (the storm lab checks timing only, not field accuracy).

### 14:25: the camera confirms it on the road

A street camera watches the same reach of road. It does not measure the river. It looks for the **water line**: the edge between dry and wet road, judged against a shore line that is drawn on the camera image once at installation. The **camera analysis** step works out the water line and the **ratio** between the water and the danger line, then applies the same kind of hysteresis as the sensor, so the level only steps up after two readings agree.

On the same frames, the camera can also see the staff gauge. When it does, every frame carries a measured river level from the node, which means the camera can be trained and checked without someone labelling each frame by hand. **Status: camera analysis is built and tested with sample cameras and AI-generated sample frames. It has not been measured on real road cameras.**

At 14:27 a resident sends a photo of the road to the app with a description, GPS location and timestamp. The **vision check** (a Gemini multimodal model) gives an opinion: it looks like flooding, with a depth estimate, and a question about whether the photo is AI-generated or edited. It is an opinion, not a verdict. A person reviews it. **Status: built; the live call is not yet proven end to end in this environment.**

### 14:30: the fusion rules decide

Each input now has its own level. The fusion rules combine them:

- **Any single input can raise a level.** A district with an Advisory forecast and a Warning camera reading goes to at least Warning.
- **Danger needs either two inputs at Warning together, or the river above its surveyed danger mark.**

At 14:30 the river node is at Warning and the camera on the same reach also sees water at the Warning line. Two inputs are at Warning together, so the reach goes to **Danger**. The app shows the Danger colour (red) on the map, sends an evacuation prompt, pre-loads the route to the nearest open shelter, sends the push notification and the Telegram alert, and turns the beacon red.

The rule set is written out in plain words so that a judge and a township manager can read it. It works before there is enough local data to train a combined model. The threshold values in the rules are examples; they must be set at each site with the surveyed marks and tuned in the pilot.

### After the peak: the level steps back down

When the rain eases, the river falls. The level tracker steps down one level only after three lower readings in a row, so the app does not flicker between Danger and Warning as the water moves. The barrier logic (simulated in the repo, not connected to a real barrier) reopens when the level drops back to Advisory or below. The lead-time log records how long the district had between the first warning and the water crossing the line, which is the number that matters most to the pilot.

### Why this order matters

- The **trained models** say *where* to watch. They are slow to build and fast to use.
- The **forecast** says *when* the rain is coming. It buys hours, but it is not specific.
- The **river node and CCTV** confirm *what is happening now*. They are minutes-fast and local.
- The **fusion rules** decide what the resident sees and does.

The trained models alone cannot do the last part, which is why the river node is the piece to build first after the hackathon.

---

## 4. The trained models (status)

The full evaluation is in `04_docs_and_research/Trained_model_evaluation.md`. The short version:

| Model | Job | What can be shown now | What is wrong or missing |
|---|---|---|---|
| **GINKGO Model 1** (HistGradientBoosting plus Random Forest; files in the repo at `models/ginkgo/`) | Where floods are likely (score 0 to 100) | The model's name and job, and the band thresholds (Low 0 to 35, Moderate 35 to 65, High 65 to 100). Not the input list: the files take 8 unnamed inputs, not the 14 on the infographic | The reported 99.62% accuracy and 99.33% F1 are on a random pixel split. The decision tree's first rule ("input 3 <= 1.5" always means no flood) suggests the label copies an input. Get the feature list and notebook from Nadi, then re-test with spatial blocks, a leakage check (drop input 3 and the water indices) and a hotspot check. Details: `GINKGO_Model1_card.md` |
| **GINKGO Model 2** (Siamese U-Net plus Random Forest) | How much land is sealed | The name and job | Its benchmark table is copied from Model 1, with only the top-row label changed; its file sizes match the four Model 1 scikit-learn files exactly. Its real results are unknown. Do not reuse the table. Dynamic World (Google) is the free baseline to beat |
| **FloodWay Random Forest** (rainfall trigger) | When a district is likely to flood | 74.55% accuracy on an initial split, labelled as a prototype | Rainfall data (2000 to 2010) and flood incidents (2015 to 2021) do not overlap in time, so the split cannot test the same period. Re-test needed |
| **Gemini vision check** | Is there water in a photo, and how much | Described as an opinion, reviewed by a person | Not measured. The live call has not run end to end here |
| **GRU level forecaster** (repo) | Level forecast | Nothing (synthetic data only) | Not connected to the app. The app uses a formula instead |

Two cautions for the pitch:

- **74.55% and 99.62% will sit side by side.** Say in one line that they measure different things: one is an event forecast, the other a map of where water collects. Otherwise a judge will ask why the team kept the weaker model.
- **GINKGO won Silver at PLAN-AI 2026.** Check the PLAN-AI intellectual property terms before reusing its models, because the SDP terms license background IP to SDP. The SDP rules also say misleading information can be grounds for disqualification (clause 25.1 in the evaluation doc), which is why the GINKGO benchmark numbers are held back.

---

## 5. The four inputs: how each is checked

| Input | Check to run | Pass looks like |
|---|---|---|
| IoT river node | Bench test against a tape measure at 0.5, 1, 2, 3 and 4 m, 20 readings each; repeat at 8 am and 3 pm for temperature drift; compare with the staff gauge hourly for a week; run with the solar panel covered; walk the gateway away until packets drop | Mean error and spread stated per distance; error stays inside the bench figure after temperature correction; agreement within a few centimetres of the gauge. The seller's page states no accuracy, so the team must measure it |
| MetMalaysia API | Log each heavy-rain warning for the pilot district; record whether the node's rain gauge saw heavy rain in the same window | A local hit rate and false-alarm rate that set how much weight the warning gets in the fusion rules |
| CCTV | Label frames (water above the line, yes or no), including night, rain on the lens, glare and people walking past; report precision, recall and the delay from crossing to alert | Stated precision, recall and delay on real pilot cameras |
| Trained models | See section 4 | Spatially tested scores on held-out areas |

---

## 6. The RiverNode device (3D model and blueprints)

### What it is

A simple, student-buildable river-level sensor for a bridge railing, designed to be built and run for a pilot. It is designed to be cheap, solar-powered, waterproof and sustainable. The 3D model is the device only: no bridge, no river.

### Parts (design, from the blueprints)

| Part | Spec from the design | Notes |
|---|---|---|
| Controller | Heltec WiFi LoRa 32 V3 (ESP32-S3 with SX1262 LoRa radio) | Pins on blueprint S6 are suggestions. Check the board's pinout before wiring |
| Level sensor | DFRobot A02YYUW waterproof ultrasonic | 3 to 450 cm range, 3 cm blind zone, 60-degree beam, IP67, UART 9600 baud, under 8 mA average, −15 to 60 °C (seller's listing, Core Electronics, AUD 29.08 at the time of checking) |
| Air temperature | DS18B20 probe | Used for the speed-of-sound correction |
| Rain gauge | Tipping bucket, 0.2 mm per tip, Ø120 mm funnel, reed switch | Calibration: pour 113 mL, expect 50 tips (0.2 mm over the funnel area is about 2.26 mL per tip) |
| Solar | 6 V 6 W panel with CN3791 MPPT charger | |
| Battery | LiFePO4 32700, 3.2 V, 6 Ah | |
| Power | 3.3 V buck-boost for the logic; 5 V MT3608 boost for the beacon | |
| Beacon | WS2812 12-LED ring | Green normal, amber Warning, red Danger |
| Enclosure | IP65 ABS box | |
| Antenna | 923 MHz LoRa antenna (AS923 band) | Radio band to be confirmed with the chosen module's region settings |
| Optional | ESP32-CAM | For a local camera view of the staff gauge |

The cost range on the parts list is an estimate of RM 558 to RM 945 per node. Malaysian retail prices were **not verified** for every line. Only the sensor's AUD price was found. Verify before any budget is quoted.

### Mounting

- Mounted on a bridge railing with a 1.25 m arm. The 60-degree beam clears the bridge deck soffit by about 270 mm, so the beam does not hit the deck.
- A riverbank post option is shown on blueprint S3. It needs a post about 2.6 m tall to keep the beam clear.
- A painted staff gauge sits in the water near the node. It carries the four level marks (normal, alert, warning, danger). **The mark positions in the 3D model are examples.** They must be surveyed at each site.
- The sensor faces straight down. Mount it square to the water surface, not tilted.

### Geometry used for the drawings

- Mast at the origin of the device file.
- Sensor face at about 1.245 m above the mast foot.
- Enclosure centre about 1.94 m from the mast, at a height of 1.75 m.
- Staff gauge levels in the model (relative to the channel bed): normal −1.5, alert −1.0, warning −0.7, danger −0.45. These are **examples** for the drawing set, not site data.

### Firmware loop (blueprint S7)

Wake, measure distance and air temperature, compute the corrected height, count rain tips since the last wake, decide the level with the same rules as the app, send a LoRa packet, sleep. A danger state keeps the beacon red and wakes more often.

### Power budget (design estimates, not measured)

- Normal: wake every 5 minutes, about 1 mA on average.
- Event: 30 seconds of active use per wake.
- Danger beacon: about 36 mA while the beacon runs.

Measure the real draw on the bench before quoting autonomy. Test autonomy with the panel covered (section 5).

### Blueprint sheets (in `02_blueprints/`)

| Sheet | What it shows |
|---|---|
| S1 | Isometric view with every part labelled, and the spec panel |
| S2 | Side and front views, the 60-degree beam check, the formula h = H − d, and the level marks on the staff gauge |
| S3 | Top-down plan showing the beam footprint on the water, the staff gauge position and the camera view, a river-side isometric, the riverbank-post option, and seven installation rules |
| S4 | Exploded view with numbered callouts, a 22-item parts list and the estimated cost range |
| S5 | Close-ups of the sensor head, the inside of the enclosure, and the rain gauge with its calibration step |
| S6 | Wiring diagram: power chain, sensors, beacon and suggested pins |
| S7 | Firmware loop, an example data message, the power budget and the design reasons |
| S8 | How the node joins FloodWay: the four inputs feeding one alert level |

### 3D files

- The GLB has 47 parts, 15 materials and 2 textures (sign plate and solar cells). Validated with the glTF validator: 0 errors, 0 warnings.
- The OBJ zip has the same geometry with the MTL and textures.
- The `.blend` file is device only, textures packed. It is the file for Blender video work on the device alone.
- Paint 3D: not tested (section 0).

---

## 7. The architecture poster

`03_architecture/FloodWay_System_Architecture_1920x1080.png` is the 16:9 poster for the hackathon, built to the written spec (the request also mentioned a reference image, but no image came through with it, so the written spec was followed).

- **Zone 1, DATA SOURCES:** user app (photo, text description, GPS, timestamp), weather forecast API, IoT river node (tagged "Design, build next"), street cameras (tagged "Sample frames only").
- **Zone 2, AI PROCESSING LAYER:** a dashed box for the FloodWay backend (Python FastAPI), holding Model 1 (tag "Re-test pending", inputs from Earth Engine layers), the rainfall trigger (tag "Prototype"), the vision check (Gemini API, tag "An opinion, reviewed by a person"), camera analysis, fusion rules, and the Google stack row: Firebase Auth and Cloud Firestore (in use); Cloud Run, Firebase Hosting, Cloud Storage and Earth Engine (planned).
- **Zone 3, OUTPUTS:** interactive map (OpenStreetMap, Leaflet), route that avoids flooded roads, the four-level warning ladder with swatches and hex codes, and alerts (push by Firebase Cloud Messaging, planned, and Telegram).
- **Changed on 20 October (late):** the Model 1 tag was "Spatial test in progress", which was not true (no re-test can start without the feature list), and the storage row showed four services. Re-rendered with `05_source/architecture/render.py` checks: no overflow, no clipped text.
- **Arrows 1 to 6:** 1 camera reading, 2 citizen report, 3 forecast, 4 map, 5 route, 6 alert.
- **Colours:** Normal #16A34A, Advisory #EAB308, Warning #F97316, Danger #DC2626. Background #F4F7FB, accent #1677FF, dark blue #003EB3, navy text #071426.
- **Rules followed:** no logos, no agency names or acronyms, no Huawei name, no accuracy percentages, no photos of people, no satellite or terrain data-source box.
- **Font size:** the minimum label size is 18 px, which is how Canva and similar tools count "18 pt" on a 1920 x 1080 canvas. If the poster must follow the print-point definition strictly, the layout needs to be redone.
- **Footer:** "Sample cameras and frames are AI-generated sample imagery. Model 1 accuracy is not shown until it is tested on held-out areas. No live government feed is connected."

---

## 8. What the FloodWay repo does today

Full detail is in `04_docs_and_research/FloodWay_repo_overview.md`. The summary:

| Built and running | Simulated or sample | Designed, not built or not called |
|---|---|---|
| Camera pipeline, photo upload, alert logic, fault filter, OpenStreetMap road routes, offline cache in the Android app, local notifications | Five sample cameras and their AI-generated frames, relief centres, flood-prone areas, citizen reports, family members, underpass barriers, the forecast input | Government camera feeds, agency verification, any cloud model call, a real road barrier, a family location server, the physical RiverNode, the rainfall Random Forest in the app, GINKGO Model 1 in the app |

Tests at the last recording: frontend 166 passed (20 Oct 2026); backend 155 passed (20 Oct 2026, three new Gemini API tests); mobile type check clean with 16 Jest tests; route audit 117 loads, 0 failing. The live photo check has not run end to end. The Android app has not been built as an APK or run on a device.

The photo check now calls the Gemini API directly when `GEMINI_API_KEY` is set (`GEMINI_MODEL`, default `gemini-2.5-flash`), with OpenRouter as the fallback. Check the current Flash model ID in Google's docs before the pilot. The older TECH_STACK document still names Gemini 1.5 Flash and Netlify, which is out of date.

## 8a. The stack: Google ecosystem (decided 20 October)

The Huawei design (ModelArts, OBS, ECS, SMN) is dropped and its code removed from the repo. Full plan and order: `04_docs_and_research/Google_stack_plan.md` (in the repo: `docs/plans/GLOBAL_STACK_PLAN.md`).

| Layer | Google service | Status |
|---|---|---|
| Sign-in, database | Firebase Authentication, Cloud Firestore | In use |
| Photo check | Gemini API (OpenRouter fallback) | Built; live call not yet run |
| Backend API | Cloud Run (the existing Dockerfile) | Planned |
| Web hosting | Firebase Hosting | Planned |
| Photos, map tiles | Cloud Storage for Firebase | Planned |
| Push alerts | Firebase Cloud Messaging (Telegram stays) | Planned |
| Model 1 inputs | Google Earth Engine (Sentinel-2, Copernicus DEM) | Planned |
| Model 2 baseline | Dynamic World | Planned |
| CCTV clips | Gemini video understanding | Planned |
| Maps and routing | OpenStreetMap, Leaflet, OSRM (not Google; unchanged) | In use |

The deck's stack line (slide 6), AI use (slide 10), resources (slide 9) and AI services (appendix A1) now say this. The deck still links to `floodways.netlify.app`, because that is where the live prototype is today; change the link only after the Firebase Hosting deploy.

---

## 9. Open items and what is not verified

1. **Naming mismatch.** The repo and the poster use **Advisory** for the second level. The IoT blueprints (S2 and S8) use **Alert** (the JPS-aligned word "waspada"). Pick one name for the whole pitch and change the other. Recommendation: keep Advisory in the app and the poster, and change S2 and S8 to Advisory with a note that it matches the second level of the public river-level scale.
2. **Paint 3D.** Not tested. Needs a Windows laptop.
3. **Prices.** Malaysian retail prices for each line are estimates. The sensor's AUD price is the only one found.
4. **Power budget.** Design estimate only. Measure.
5. **Sensor accuracy.** Not stated by the seller. Bench test before any number goes on a slide.
6. **GINKGO Model 1 and 2.** First get Model 1's feature list (in training order, with units) and its training notebook from Nadi: the files alone cannot be scored or tested. Then re-test with spatial validation. Get Model 2's real results, or describe it as "evaluation in progress" with no numbers.
7. **Rainfall Random Forest.** Re-test on periods that overlap. Its 74.55% is labelled a prototype.
8. **Staff gauge marks.** Replace the example levels with surveyed marks at the pilot site.
9. **Pins on S6.** Check the Heltec V3 pinout before wiring.
10. **PLAN-AI IP terms.** Check before reusing any GINKGO model in the SDP entry.
11. **SDP briefing rules.** Confirm the 10-slide limit, PDF size limit, 5-minute demo video and the rule about stating data sources and synthetic data.
12. **Blender video prototype.** Not started. The request was to show how the device works near a river, combined with the trained models, the MetMalaysia API and CCTV. The device-only `.blend` is ready for it. The earlier bridge and river scene is in `05_source/iot/out/` and was stopped on request, so it may need rebuilding.
13. **Teammates' items.** Luqman's demo video script, the GitHub repo deploy, and the supporting document's yellow fields (team names, survey counts, flood share, URLs, metric placeholders).
14. **GINKGO slide 6** still has the placeholder "[insert model / platform name]". Remove it if any GINKGO slide is reused.

---

## 10. Rebuilding everything (for Claude Code on the laptop)

The scripts are in `05_source/iot/`. Several paths inside them point at the sandbox where they were written. Check the `HERE` and `out/` path lines before running.

**Requirements:** Blender's Python module (`bpy`) version 5.2.2, with a Python version that the wheel supports. Playwright with Chromium for the sheet and poster exports. Pillow for textures. The glTF validator (`05_source/gv`, `npm install` first).

**Order of steps:**

1. `make_textures.py` writes the staff gauge, sign plate and solar cell textures to `tex/`.
2. `build_scene.py` builds the river scene and writes `out/floodway_rivernode_scene.blend`, the GLB and `scene_parts.json`. (The scene includes the bridge context. Skip this step if you only need the device.)
3. `render_lines.py` renders the line-art views in `lines/`, and writes `lines/views.json` for the sheets.
4. `export_device.py` keeps only the device parts (`Node_*`), flattens the materials to plain Principled BSDF, and writes the device GLB, OBJ zip, `.blend` and preview renders to `dist/`.
5. `compose_sheets.py` builds sheets S1 to S8 as SVG (1920 x 1080 each).
6. `export_sheets.py` renders each sheet as a 3840 x 2160 PNG and writes the 8-page PDF.
7. `05_source/architecture/render.py` renders the poster PNG from the HTML.
8. `05_source/deck/build_deck.py` rebuilds the pitch deck. It needs the SDP template, whose path (`TPL`) points at the sandbox where it was written; that file is not in this zip. The 20 October stack edits were made directly in the `.pptx` (four text runs) and the PDF was exported from PowerPoint, so `build_deck.py` does not contain them yet.

**Next task for Claude Code:** the Blender MCP video prototype. Start from the device-only `.blend` in `01_3D_device/`. Keep the claims honest: show the device as designed, label the river level as an example, and show the four inputs as design, not as measured results.

**Do not change without asking:** the honesty rules in section 0, the status words, and the removal of agency names and Huawei references from public material.

---

## 11. Sources used in the research

- Team material: GINKGO slide deck (PLAN-AI Hackathon 2026, Track B, Aug 2026), the two AI model infographics, FloodWay project report v2.2 (Feb 2026), team chat of 20 Oct 2026.
- Kattenborn et al. 2022, ISPRS Open Journal of Photogrammetry and Remote Sensing: random validation overestimated CNN accuracy by up to 28% compared with spatial validation.
- Ploton et al. 2020, Nature Communications: the title and abstract were read, the full text was not.
- A comparison of Dynamic World, ESA WorldCover and Esri land cover, Remote Sensing 2022.
- A02YYUW waterproof ultrasonic sensor specifications, Core Electronics.
- data.gov.my weather API.
- RTM, 18 July 2026: JPS river levels above waspada, amaran and bahaya.
- Cetecom: Malaysia short-range device update, LoRa 916 to 924 MHz (2020).
- FloodWay supporting documentation (SDP hackathon), for the Random Forest evaluation.
