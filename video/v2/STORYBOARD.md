# FloodWay demo v2: storyboard timed to your narration

**Voice:** `voice/narration.m4a` (your recording, 2:04.9). Whisper word timings are in `voice/narration.json`.

**One edit to the voice, nothing else:**
- the 8.2 s silence before "FloodWay. Predict, verify, guide." comes down to 1.0 s;
- 0.5 s of lead-in is kept at the start.

The rest is your read, at your pace, untouched.

**Final length: about 1:53.** That's 20 s over the 90 s target (see "Length" at the end).

All times below are in the **final video**. Captions show the **script text** word by word, timed to your words. The tag, headline and body sit in the right panel, as in the reference video. There are no corner logos.

| # | Time | You say (beats) | Left: picture | Right panel | Labels on screen | Sound |
|---|---|---|---|---|---|---|
| 1 | 0:00–0:09.7 | "December 2021…" 0:00.5 · "…twenty-six times" 0:07.8 | A drawn night map of Shah Alam: river, Federal Highway, section grid. Flood dots drop in year by year, 2015 to 2021, with a counter beside them. The counter **lands on 26 exactly at 0:07.8**. The 18 Dec 2021 dot pulses red. | THE PROBLEM / "Shah Alam floods again and again" | "Source: public flood bulletins 2015–2021 (third-party compilation)" · ILLUSTRATED MAP | Rain bed. A low hit at 0:07.8 |
| 2 | 0:09.7–0:19.6 | "The same places…" 0:09.9 · "Riverside homes…" 0:12.6 · "Riders on the Federal Highway…" 0:17.6 | The camera pushes in on three places. At 0:12.6 **Taman Sri Muda** (river edge, a family icon) and **Kg Padang Jawa ×3** light up. At 0:17.6 the **Federal Highway motorcycle lane, Batu 3 ×5** lights up with a rider icon. | WHO IS HIT / "Riverside families and highway riders" | Counts from the records | A soft tick on each place |
| 3 | 0:19.6–0:25.6 | "FloodWay warns them…" 0:20.0 · "…four signals agree" 0:24.5 | The FloodWay mark appears. Four tiles (Rain, History, Sensor, Camera) fly into the risk ring, and the ring closes on "agree". | MEET FLOODWAY / "Warns only when four signals agree" | — | A whoosh, then the ring fills |
| 4 | 0:25.6–0:37.7 | "Our river node…" 0:26.0 · "Green, yellow, red" 0:27.9 · "At the same moment…" 0:32.2 | **Nadi's node clip**, full frame. The LCD climbs while the LED goes green, yellow and red, cut so each colour lands on your word. The **real buzzer** sounds after "red". At 0:32.2 it shrinks left, and the `/live` phone slides in: rain warning, history, then the camera tile turns red as you name each one. | 01 · SENSE / "One river node, three more signals" | REAL FOOTAGE · BENCH TEST · 2× SPEED on the slow part · SAMPLE on the camera tile | Buzzer, then room tone |
| 5 | 0:37.7–1:04.2 | "So how do we warn ninety minutes early?" 0:38.1 · "rain warning comes hours ahead" 0:41.8 · "Our model flags streets…" 0:44.4 · "When the sensor crosses…" 0:48.8 · "projects the water two hours ahead" 0:52.3 · "crosses danger… your time left" 0:56.0 · "storm scenario… about ninety minutes" 1:00.3 | A drawn timeline that builds with your sentences. (1) A rain cloud at "hours ahead". (2) A street flagged by the flood-history model. (3) The sensor bar crosses its warning line. (4) A projection curve over +15…+120 min, drawn from `forecaster.py`'s real output for a storm input. (5) The curve crosses the red DANGER line, and a bracket "time left" opens. (6) It reads **90 min** at 1:02.8, and the phone's "Leave now" toast pops. | 02 · PREDICT / "How we warn 90 minutes early" | "Storm scenario · rule-based projection" | A tick per step, then an alert tone with the toast |
| 6 | 1:04.2–1:24.1 | "How accurate is it?" 1:04.7 · "trained… 2015 to 2019" 1:07.7 · "tested on 2020 and 2021…" 1:10.2 · "Five inputs, five algorithms" 1:16.0 · "…eighty-four times in a hundred" 1:21.7 | A chart card. (1) A year bar: 2015–19 TRAIN (blue), then 2020–21 TEST (orange, "never seen"). (2) At 1:16.0, five input chips appear: rain 1 d, 3 d and 7 d, elevation, slope. Five algorithm bars grow: LR 0.84, CatBoost 0.83, XGBoost 0.82, RF 0.81, LightGBM 0.80. (3) At 1:21.7 a big "**84 in 100**", with the sub-line "17 of its top 17 were real flood sites". | 03 · PROOF / "Tested on floods it never saw" | "500 records · retrospective test on past floods, not a live forecast" | A soft riser, then a hit on 84 |
| 7 | 1:24.1–1:35.6 | "Then it acts. One tap…" 1:24.4 · "…open relief centre" 1:29.0 · "send a photo… AI checks it" 1:31.6 | Phone, using the existing takes. Leave now, then Open routes, then the route avoids the flood, with the 8 s drive sped up to about 3 s and the arrival heading on "relief centre". At 1:31.6, the report photo, the AI check result ("flooding, about 35 cm") and the 2 km circle. | 04 · GUIDE / "Routes around the flood" | "Demo on our Kuala Lumpur data" · in-app sample photo | Taps, the arrival chime |
| 8 | 1:35.6–1:48.0 | "It runs on Huawei Cloud" 1:35.9 · "ModelArts…" 1:37.9 · "OBS…" 1:40.0 · "ECS…" 1:43.1 · "SMN…" 1:45.8 | Four architecture cards drop in, each on its own word, with lines into the phone. ModelArts "Trains the flood model". OBS "Stores data, models and camera frames". ECS "Hosts the FloodWay app online". SMN "Sends flood alerts". Console screenshots go in the cards if the team has them by render time. | ON HUAWEI CLOUD / "Runs on Huawei Cloud" | — | The music lifts |
| 9 | 1:48.0–1:53.5 | "FloodWay. Predict, verify, guide." 1:48.4 | End card: FloodWay wordmark, then the three words appear one by one with your voice. Then the URL, and the UiTM and Huawei logos (the only logos in the film). | — | — | The music resolves |

## Check these against your recording

The captions use the script text, so a misheard word won't show on screen. But please confirm these six places where Whisper heard something different. If a word really was misread, re-record just that sentence:

1. 0:12.6: "Taman Sri Muda" was heard as "Taman Street Motor".
2. 0:14.9: "Kampung Padang Jawa" was heard as "Kampong Pandang River".
3. 0:26.0: "Our river node measures the water" was heard as "Our river not measured water".
4. 1:29.0: "relief centre" was heard as "relief sensor".
5. 1:31.6: "when neighbours send a photo, AI checks it" was heard as "whenever send a photo, the eye checks it".
6. 1:45.8: you said "send the **alarm**". The card says "Sends flood alerts", which is fine either way.

## Length

The read is 1:53, and the target was 60–90 s. Three ways to handle it:

- **A. Keep 1:53 (recommended if the slot allows).** Each judge's point gets its full time, and scenes 5 and 6 are the ones they asked for.
- **B. Tighten pauses:** every pause over 0.4 s comes down to 0.3 s. That's about 1:44, still your natural voice.
- **C. B plus 1.15× speed with pitch kept:** about 1:31. It will sound a little rushed.
