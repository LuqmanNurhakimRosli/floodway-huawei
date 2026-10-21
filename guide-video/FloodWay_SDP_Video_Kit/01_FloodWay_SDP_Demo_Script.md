# FloodWay: SDP Township of Tomorrow demo video script

**Length:** 4:50 narration, hard cap 5:00 including the end card
**Speakers:** 4 (roles assumed, swap as needed)
- **RAKUMAN** (P1, lead): opening, problem, solution, workflow, demo, close
- **NADI** (P2, models): trained model base layer, trained-model section
- **TISYA** (P3, forecast and comparison): forecast factor, trained-model evaluation, comparison with JPS and other systems
- **LUQMAN** (P4, hardware): river node, street camera, feasibility and scalability

**Read-through rule:** read the whole script aloud at normal speed with a timer before recording. If it runs past 4:40, cut the sentence marked `(cut if long)`.

---

## Timeline at a glance

| Start | Scene | Speaker | Purpose |
|---|---|---|---|
| 0:00 | 1. Cold open | RAKUMAN | Hook with the loss figure |
| 0:15 | 2. Problem | RAKUMAN | The gap, stated plainly |
| 0:40 | 3. Our solution | RAKUMAN | One system, four-level warning |
| 1:00 | 4. How one warning moves | RAKUMAN | Workflow, arrows 1 to 6 |
| 1:30 | 5. Forecast and base layer | TISYA, NADI | Factors that say when and where |
| 1:55 | 6. River node and street camera | LUQMAN | IoT 3D visual and CCTV factor |
| 2:40 | 7. Trained model, honest reading | NADI, TISYA | The slide, with its limits |
| 3:27 | 8. Working demo | RAKUMAN | Screen recording of the prototype |
| 3:59 | 9. Compared with JPS and others | TISYA | Where FloodWay sits |
| 4:29 | 10. Feasibility and scalability | LUQMAN | Cost, parts, growth path |
| 4:48 | 11. Close and data card | RAKUMAN | End card and data sources |

---

## Scene 1: Cold open (0:00 to 0:15)

**Visual:** Rain on a township road. A drain fills. A phone shows a FloodWay alert. Title card fades in.
**Sound:** Rain ambience, a low rumble, a splash at about 0:08. Music bed starts quietly.

**RAKUMAN:**
> Every monsoon, the water arrives before the warning does. In 2024, floods cost Malaysia RM933 million. We are FloodWay. We tell a neighbourhood it is in danger before the water reaches the door.

---

## Scene 2: Problem statement (0:15 to 0:40)

**Visual:** Animated counter from RM0 to RM933.4 million, tagged "DOSM, 2024". Then a simple map with a road going under water, and a question mark.
**Sound:** Rain eases. Soft UI tick on the counter's final number.

**RAKUMAN:**
> The gap is the last hour. Official rainfall and river data are strong at district and basin level. A township needs to know which road or underpass floods next, and when. Waze and Google Maps already take flood reports. Our question is what happens street by street, before anyone drives into the water.

---

## Scene 3: Our solution (0:40 to 1:00)

**Visual:** The four-level ladder appears one row at a time: Normal (green), Advisory (yellow), Warning (orange), Danger (red). A phone shows the map colour, a route, and a push alert.
**Sound:** A soft chime on each row.

**RAKUMAN:**
> FloodWay combines three live factors and one trained model into one four-level warning: Normal, Advisory, Warning and Danger. Residents see it as a map colour, a route around flooded roads, and a push alert or Telegram message. Our proposed pilot township is Bukit Raja.

---

## Scene 4: How one warning moves (1:00 to 1:30)

**Visual:** The architecture poster animates left to right. Arrows light up in order, 1 to 6, matching the poster numbers: 1 camera reading, 2 citizen report, 3 forecast, 4 map, 5 route, 6 alert.
**Sound:** Short UI swoosh on each arrow. A low tone on arrow 6.

**RAKUMAN:**
> Here is one warning moving through the system. Arrow one: a camera sees water cross the painted line. Arrow two: a resident's photo arrives, and a vision model gives an opinion. Arrow three: the forecast says heavy rain is coming. Arrows four to six: the map updates, the route avoids the flood, and the alert goes out.
>
> One input can raise a level. Danger needs two inputs at Warning together, or the river above its surveyed danger mark.

---

## Scene 5: Forecast and base layer (1:30 to 1:55)

**Visual:** Two factor cards fly in. Forecast card: a cloud icon with "when". Model card: a township heat map with bands Low, Moderate, High.
**Sound:** Soft whoosh per card. Music lifts slightly.

**TISYA:**
> Factor three is the forecast: MetMalaysia's open weather data, through the national data API. It says when heavy rain is coming. It does not say which street.

**NADI:**
> Our trained model is the base layer. Model 1 scores every pixel of the township from zero to a hundred, using satellite bands, water indices and terrain. It says where water collects.

---

## Scene 6: River node and street camera (1:55 to 2:40)

**Visual:**
- Turntable of the 3D RiverNode (from the GLB), then the exploded view from blueprint S1.
- Beam cone animation from the sensor down to the water. The formula `h = H − d` appears on screen.
- Street camera frame: a water line drawn on the road, a "hold" icon for the jump filter.

**Sound:** Water rush under the node shot. Light mechanical click on the exploded view.

**LUQMAN:**
> The river node is our designed sensor. An ultrasonic sensor on a bridge railing points down at the water and measures the distance to the surface. The node turns that into river height, corrected for air temperature, and sends it over a long-range LoRa radio every five minutes. Solar power keeps it running.
>
> It is a design, not a built unit. If we reach the Top 10, we build pilot units.
>
> The street camera looks for the water line on the road, and it needs two readings before it changes a level. Today it runs on sample frames, so we make no field accuracy claim yet.

---

## Scene 7: Trained model, honest reading (2:40 to 3:27)

**Visual:** Full-screen view of the team's AI Model 1 slide. A lower-third banner reads "Reported figures from GINKGO training report. Re-test in progress." The top row and the F1 cell are highlighted for 3 seconds. Then a text card: "Random pixel split. Re-test on held-out areas."
**Sound:** Music drops under the voice. No sting. Keep this scene calm.

**NADI:**
> Every number on this slide comes from our GINKGO training report, and we show them as reported. Model 1's top classifier, Gradient Boosting, reports 99.62 percent accuracy and a 99.33 percent F1 score.

**TISYA:**
> We are also clear about how they were measured. The split was random by pixel, and neighbouring pixels look almost the same, so these scores are probably too high. We are re-testing on whole areas the model never saw, and we will replace these figures with those results.
>
> Our rainfall Random Forest reaches 74.55 percent on a first split. It is a prototype.

---

## Scene 8: Working demo (3:27 to 3:59)

**Visual:** Screen recording of the real prototype, with cursor highlight and zoom-ins. Captions in the corner: "Sample cameras. AI-generated frames. Sample relief centres."
**Sound:** Soft UI clicks. Phone notification ping at the alert.

**RAKUMAN (narration over the screen recording):**
> Here is the working prototype. Five sample cameras show level and trend, and this one has reached Warning. A citizen report arrives with a photo, a description and a location. The vision check gives an opinion, and a person still reviews it.
>
> The route avoids the flooded area and heads to a relief centre. Then the alert: a Telegram message from the backend.

---

## Scene 9: Compared with JPS and other systems (3:59 to 4:29)

**Visual:** Text-only comparison table (no logos). Columns: Waze and Google Maps, JPS, MyDIMS, FloodWay. Rows: flood reports, river forecast, shelter routing, street-level timing. Cells fill as narration goes.
**Sound:** Music bed steady, soft.

**TISYA:**
> Official systems matter, and we build on them. JPS publishes river levels and flood bulletins a day or two ahead, at district and basin level. NADMA's MyDIMS shows evacuation centres and takes verified reports. Google Maps and Waze already route around reported flooding.
>
> FloodWay fills a narrower gap: street-level timing from our own sensors and cameras, and routes that avoid the flood on the way to a shelter.

---

## Scene 10: Feasibility and scalability (4:29 to 4:48)

**Visual:** Cost bar labelled "Estimate, before testing: under RM1,000 per node". Parts icons: controller, sensor, solar panel, battery, enclosure. A growth diagram: one township, then many townships with nodes added.
**Sound:** Light tick per part icon.

**LUQMAN:**
> Feasible: the node uses off-the-shelf parts, estimated under RM1,000 per unit, and runs on solar. Scalable: the forecast and map data are open, and a new township adds nodes and cameras, not a new system.
>
> Our next step is one pilot township, with measured accuracy and measured lead time.

---

## Scene 11: Close and data card (4:48 to 4:54)

**Visual:** FloodWay title card. Then the data card (held for 6 seconds, see text below).
**Sound:** Music resolves. Rain fades out.

**RAKUMAN:**
> FloodWay: four levels, one clear message, before the water arrives. Thank you.

**On-screen data card (text):**
> **Data and sources.** Forecast and warnings: MetMalaysia, via the open data API (data.gov.my). Map: OpenStreetMap. Trained models: GINKGO report, PLAN-AI 2026; re-test in progress. Street-camera frames: AI-generated samples. River node: design, not yet deployed. Relief centres: sample data. Training dataset provenance: to be confirmed.

---

## Appendix A: Evaluation of the AI Model 1 slide

This is for the team, not for narration. Each point was checked against the slide and the earlier model evaluation.

**What the slide claims**
- Gradient Boosting (HistGradientBoosting) accuracy 99.62%, precision 99.33%, recall 99.33%, F1 99.33%
- Random Forest 99.40%, Decision Tree 99.38%, Logistic Regression 78.33%
- Latency 125.34 ms per 100k pixels for the top model; "Sub-second flood vulnerability scoring" in the footer strip
- Dataset: "Kaggle Satellite Flood & Earth Observation Dataset", 100,000+ instances across monsoon flood events
- Input strip: "METMalaysia Rain (50 / 120 / 200 mm/hr)"

**Points a judge will check, and how the script handles each**

| # | What the slide says | Problem | How the script handles it |
|---|---|---|---|
| 1 | Top three classifiers are 99.62%, 99.40%, 99.38% | Three near-identical scores, and a single decision tree at 99.38% suggests the label follows a simple rule of the inputs. The usual cause is a water index used both to build the label and as a feature | Scene 7 says the scores are reported and probably too high. The re-test drops the water indices (leakage check) |
| 2 | Precision, recall and F1 all 99.33% | Equal values mean false positives and false negatives are equal in count. Possible, but must match the confusion matrix | Not quoted in the script beyond F1. Check the confusion matrix before recording |
| 3 | "Pixel-level" split, with neighbouring pixels | Neighbouring pixels are almost identical, so random pixel splits leak | Scene 7 names this directly |
| 4 | "Sub-second" scoring, 125.34 ms per 100k pixels | 125 ms is under a second, but the hardware and image size are not stated | Not claimed in the script. State the hardware before using the phrase |
| 5 | Bottom strip: "Trained AI Model (99.62% F1)" | Error on the slide. 99.62% is accuracy. F1 is 99.33% | Script says 99.62% accuracy and 99.33% F1. Fix the slide strip before it appears in any cut |
| 6 | "METMalaysia Rain (50 / 120 / 200 mm/hr)" as an input | These are fixed scenario values inside the model, not a live MetMalaysia feed. The slide implies a live link | Scene 5 says the live forecast is a separate factor. Never say the model reads live rain |
| 7 | Dataset named, "100,000+ instances" | No link, licence, study location or dates on the slide. The study area is not stated, so Malaysian coverage is not shown | Data card says provenance is to be confirmed |
| 8 | "Suitable for Immediate Masterplanning (R1/R2)", "Excluded from Building Footprint" | Planning use claimed with no validation. A planning decision needs a tested model | Not in the script. Change to "for planning review" on the slide |
| 9 | "MSMA On-Site Detention" | An acronym for a government stormwater manual. Public material should avoid government acronyms | Not in the script. Remove from the slide for public use |
| 10 | Logistic Regression 78.33% | Fine as a baseline, and it helps show that the top models are much higher. It is also the only baseline on the slide | Not in the script. Keep it on the slide if the full table is shown |

**Advice on what to show:** if the table stays on screen, the caption "Reported, re-test in progress" must stay with it. A judge who checks the numbers will find the same points as above. Showing them first is the safer position.

---

## Appendix B: Wording choices in this script

- **"Three live factors and one trained model"** matches your brief. The architecture poster and the handover file say "four inputs". Pick one phrase for the whole pitch.
- **"Reported" and "re-test in progress"** describe the trained-model numbers. Once Nadi and Tisya finish the spatial re-test, replace these lines with the held-out results. That is the change that makes the model claim validated.
- **No accuracy claim** is made for the river node, the street camera or the Gemini vision check.
- **Agency names** (JPS, NADMA, MetMalaysia) appear only as factual references in the comparison and the data card, not as endorsements or logos.
- **Loss figure:** only the 2024 DOSM figure of RM933.4 million is used. The earlier impact figures without a source (mortality reduction, residents covered, faster evacuation) are not used anywhere in this script.
