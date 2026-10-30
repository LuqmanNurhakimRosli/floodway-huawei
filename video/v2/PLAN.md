# FloodWay demo video v2: plan, script, storyboard

Target: **80–88 s**, 1920x1080, 30 fps. You read the narration yourself; there is no face and no Kokoro.
Look: same as `booth/floodway-demo-40s/out/final/floodway-pitch-share.mp4`. That means a dark teal background, the phone on the left, and on the right a chapter tag, a headline, one body line and Huawei service chips. The words light up as they are spoken.
Changes from that reference:
- No logos in the top-right corner.
- No presenter camera box.
- The end card is the only place with logos.

It improves on `video/out/floodway_demo.mp4` (1:51) in four ways. It is shorter. It adds the three things the judges asked for. It puts Huawei Cloud on screen. It still carries Nadi's real node footage.

## Judges' asks → where the video answers them

| Judge comment | Answer in the video | Scene |
|---|---|---|
| 1. Explain how the 90-minute warning works | A timeline that runs from the rain warning (hours ahead) to the flood-history flag, the sensor's warning line, the 2-hour water projection and the time left. | 5 |
| 2. How accurate, the data, how many attributes, other algorithms | Trained on 2015–19, tested on 2020–21 floods the model never saw. 500 records, 5 inputs, 5 algorithms compared. Best result: "84 times in 100". | 6 |
| 3. Who is affected most, a specific area, Shah Alam first | A Shah Alam map with 26 reported floods. It names Taman Sri Muda, Kampung Padang Jawa and the Federal Highway motorcycle lane at Batu 3. | 1–2 |

## Facts the script uses (all checked in the repo)

| Claim on screen | Source |
|---|---|
| Shah Alam appears **26 times** in the reported floods for 2015–2021 (2016: 8, 2021: 7). Federal Highway motorcycle lane: 5. Kg Padang Jawa: 3, including **18 Dec 2021**. Taman Sri Muda: 1 (Nov 2019) | `datasets/jps_positives_clean.csv` |
| The model was trained on 2015–2019 and tested on 2020–2021. There were 500 records (330 train, 170 test) and **5 inputs**: rain over the 1, 3 and 7 days before, plus elevation and slope. **5 algorithms** were compared: LR, RF, LightGBM, CatBoost and XGBoost. | `RESULTS_5_MODEL_COMPARISON.md` |
| The best score was ROC-AUC 0.836, which in plain words means it "ranks a real flood site above a random place 84 times in 100". The 17 places it ranked highest were all real flood sites. In the harder test, CatBoost scored 0.78. | same |
| Time to danger: the water level is projected at +15, 30, 45, 60, 90 and 120 min from the current level and the rain rate, and the first point that crosses danger is the time left. **It is a rule-based formula today.** | `backend/app/services/forecaster.py` |
| The 90 minutes comes from **our storm scenario**, not a measured field lead time. | `frontend/src/lib/stormScenario.ts`, deck slide |

Honesty lines that must stay on screen:
- **Flood records source:** "Source: public flood bulletins 2015–2021 (third-party compilation)". This is AGENTS.md's no-agency-names rule, so it doesn't name the agency.
- **Model:** "Retrospective test on past floods, not a live forecast."
- **90-minute timeline:** "Storm scenario. Rule-based projection."
- **Node footage:** "REAL FOOTAGE · BENCH TEST".
- **Camera frames:** SAMPLE.

## Decisions needed from you before I build

1. **Huawei Cloud wording: APPROVED FOR SEMI-FINAL (Dr. Azliza, 2026-10-30).** Scene 8 names ModelArts, OBS, ECS, and SMN directly so the judges clearly see which Huawei Cloud services FloodWay uses. Per advisor Dr. Azliza, official Huawei Cloud accounts/credits are provided upon advancing to the National Finals (student registration is blocked by mainland China phone verification), so for the Semi-Final (3 Nov) we present the Huawei Cloud services in the slides/video and explain each service's role in Q&A, then execute the live deployment (`deploy/ecs/setup.sh`, OBS, ModelArts, SMN) in the Finals.
2. **Shah Alam in the app.** The app's map, relief centres and storm are all in Kuala Lumpur (Kampung Baru). Two options:
   - **A (recommended, 5 days left):** Shah Alam is the case study in scenes 1–2, drawn as a data map from the real records. The app demo then says plainly "Demo on our Kuala Lumpur data".
   - **B:** add Shah Alam relief centres, routes and a storm site to the app. That is app-code work plus `check.ps1`, and about a day.

## Script (about 205 words, about 82 s at a calm 150 words a minute)

Read it in eight short takes, one per scene, with a 1-second pause before and after each.

| # | Time | Words to read |
|---|---|---|
| 1 | 0:00–0:07 | "December 2021. Shah Alam went under water. In seven years of public flood reports, Shah Alam appears twenty-six times." |
| 2 | 0:07–0:15 | "The same places, again and again. Riverside homes in Taman Sri Muda and Kampung Padang Jawa. Riders on the Federal Highway motorcycle lane." |
| 3 | 0:15–0:20 | "FloodWay warns them before the water comes, and only when four signals agree." |
| 4 | 0:20–0:31 | "Our river node measures the water. Green. Yellow. Red. At the same moment, FloodWay checks the rain warning, the flood history, and the drain camera." |
| 5 | 0:31–0:50 | "So how do we warn ninety minutes early? The rain warning comes hours ahead. Our model flags streets that flooded under the same rain before. When the sensor crosses its warning line, FloodWay projects the water two hours ahead. The point where it crosses danger is your time left. In our storm scenario, that is about ninety minutes." |
| 6 | 0:50–1:04 | "How accurate is it? We trained on floods from 2015 to 2019, then tested on 2020 and 2021 floods it had never seen. Five inputs, five algorithms. The best one ranks a real flood site above a random place eighty-four times in a hundred." |
| 7 | 1:04–1:16 | "Then it acts. One tap routes you around flooded roads to an open relief centre. And when neighbours send a photo, AI checks it before it warns anyone." |
| 8 | 1:16–1:26 | "It runs on Huawei Cloud. ModelArts trains the model, OBS stores the data and camera frames, ECS hosts the app online, and SMN sends the alerts." (Approved for Semi-Final per Dr. Azliza, 30 Oct; live Huawei Cloud console deployment runs in the National Finals when official access is granted.) |
| 9 | 1:24–1:28 | "FloodWay. Predict. Verify. Guide." |

If you need to cut to about 70 s, shorten scene 2 to "Riverside homes and highway riders, again and again." and drop "And when neighbours send a photo…" from scene 7.

## Storyboard

| # | Visual (left: phone or graphic) | Right panel: chapter tag / headline / chips | On-screen labels | Sound |
|---|---|---|---|---|
| 1 | Night map of Shah Alam (drawn, no tiles). Dots appear year by year, 2015 to 2021, and the counter climbs to **26**. The 18 Dec 2021 dot pulses red. | THE PROBLEM / "Shah Alam floods again and again" | Source line; ILLUSTRATED MAP | Rain bed, a low hit on "26" |
| 2 | Zoom to three labelled places: Taman Sri Muda (river edge), Kg Padang Jawa (×3), Federal Highway motorcycle lane, Batu 3 (×5). Icons show a family, a rider and an elderly person. | WHO IS HIT / "Riverside families and highway riders" | Counts from the records | Soft ticks per place |
| 3 | The four signal tiles fly into the risk ring (rain, history, sensor, camera). | MEET FLOODWAY / "Warns only when four signals agree" | — | Whoosh, then the ring fills |
| 4 | **Nadi's node clip** (`nadi-iot.mp4`): the LCD climbs 35 → 58 → 81% and the LED goes green, yellow, red, with its **real buzzer** at red. Cut to the `/live` phone where the tiles turn red (existing take). | 01 · SENSE / "The river node and three more signals" / chips: ECS | REAL FOOTAGE · BENCH TEST; 2× SPEED on the slow part; SAMPLE on the camera | Real buzzer |
| 5 | An animated timeline, drawn: "−hours: rain warning", then "flood history flags street", then "sensor hits warning line", then a projection line rising over +15…+120 min that crosses DANGER at **90 min**, then the phone's "Leave now" toast. | 02 · PREDICT / "How 90 minutes early works" / chips: ModelArts | "Storm scenario · rule-based projection" | Tick per step, an alert tone on "Leave now" |
| 6 | A chart card: a train-2015–19 / test-2020–21 bar, "500 records · 5 inputs", 5 algorithm bars (LR 0.84, CatBoost 0.83, XGBoost 0.82, RF 0.81, LightGBM 0.80) and the big line "84 in 100". | 03 · PROOF / "Tested on floods it never saw" / chips: ModelArts, OBS | "Retrospective test on past floods, not a live forecast" | Soft riser |
| 7 | Phone: the map route around the flood to the open centre (existing take, with the 8 s drive sped up to 3 s). Then the report photo, the AI check result and the 2 km circle. | 04 · GUIDE / "Routes around the flood" / chips: ECS, SMN | "Demo on our Kuala Lumpur data"; in-app sample photo | Taps, the arrival chime |
| 8 | Architecture cards build in one by one, as in the reference: ModelArts "Trains the flood model", OBS "Stores data, models and camera frames", ECS "Hosts the FloodWay app online", SMN "Sends flood alerts". Lines connect them to the phone. If the team has console screenshots by render time, each card shows its own. | ON HUAWEI CLOUD / "Runs on Huawei Cloud" | — | Music lifts |
| 9 | End card: FloodWay wordmark, "Predict. Verify. Guide.", URL, UiTM and Huawei logos (the only logos in the video). | — | — | Music resolves |

## Implementation plan

1. **Your narration.** Record the 9 takes on your phone in a quiet room, about 20 cm from the mouth, as WAV or M4A, and drop them in `video/v2/voice/`. I will clean them up (high-pass filter, light noise reduction, −16 LUFS). Then I'll get word timings with Whisper, the same way the reference was timed (`booth/floodway-demo-40s/out/narr/video-narrator.json`). The edit follows your pacing, so you don't have to hit exact times.
2. **Reuse:**
   - The Remotion project in `video/remotion/`, as a new `FloodWayDemoV2` composition next to the old one.
   - The existing app takes (`video/footage/live|map|report.mp4`).
   - The Nadi clip, and `mix.py`'s SFX and music.
3. **New pieces in Remotion:**
   - The reference-style layout (`PanelLayout`: phone on the left, then tag, headline, body and chips).
   - Word-by-word captions driven by the Whisper timings.
   - The Shah Alam data map. Places would be placed approximately from their names: the records have no coordinates, so the map is labelled illustrative.
   - The 90-minute timeline. It plots the formula's own output (`forecaster.py`) for a storm-scenario input, so the curve is real code output and not hand-drawn.
   - The accuracy chart, using the numbers from `RESULTS_5_MODEL_COMPARISON.md` (Benchmark A).
   - The architecture cards.
4. **Huawei footage**, only with decision 1A: screen captures of the ECS instance, the OBS bucket, the ModelArts job and the live URL.
5. **Render and check** with `verify.py`. It checks duration, loudness (−14 LUFS), black frames and caption sync, and that every honesty label is visible. I'll send you the MP4 and a contact sheet.
6. **PROGRESS.md:** add a status row and a change-log line.

Time: about half a day after your voice files arrive. Decision 1A adds the deployment itself; I can do it from this machine if you give me console access steps, and you would enter the credentials yourself.
