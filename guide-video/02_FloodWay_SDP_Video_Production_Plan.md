# FloodWay: SDP video production plan (director brief)

**Purpose:** a 5-minute demo video for the Sime Darby Property "Township of Tomorrow" submission.
**Companion files:** `01_FloodWay_SDP_Demo_Script.md` (narration and scene timings), `03_shot_list.csv` (one row per shot for the editor), `04_footage_folders/` (the folder skeleton for your local footage).

---

## 1. Creative brief

**One-line idea:** "Water arrives before the warning does. FloodWay makes the warning arrive first, street by street."

**Tone:** calm, factual and honest. This is an infrastructure pitch, not a launch trailer. Judges score impact, pilot readiness and township fit, so the video must make a township manager feel that the pilot is simple to start. Excitement comes from clarity, not from big claims.

**Audience:** SDP judges (no ML specialists are named in the rules, so write for an executive and sustainability reader), plus any township operator who watches the public link.

**What the video must make a viewer believe, in order:**
1. Floods are costly and the gap is the last hour, not the data.
2. FloodWay is one system with one readable warning ladder.
3. Each factor does one job and is honest about its limits.
4. The river node is real hardware on paper, buildable and cheap.
5. The demo is a working prototype with sample data, clearly labelled.
6. It complements JPS and existing apps, and names the gap it fills.
7. A named pilot township is the next step.

**What the video must never do:** claim a validated accuracy figure, show an unsourced impact statistic, use a government or company logo, or let a sample camera look like a live feed.

---

## 2. Format and delivery

| Item | Setting |
|---|---|
| Aspect ratio | 16:9 landscape |
| Resolution and frame rate | 1920 x 1080, 30 fps |
| Length | 4:50 narration, end card to 5:00 max |
| Container and codec | MP4, H.264, AAC audio |
| Audio loudness | Narration around −16 LUFS integrated, music ducked 12 dB under narration, true peak at or below −1 dBTP |
| Captions | English SRT file included with the upload, plus burned-in captions for key numbers only |
| Upload | YouTube, unlisted, with the link added to the submission. Confirm the file size and length rules on the official page |
| Export names | `FloodWay_SDP_Demo_v01_draft.mp4`, then `FloodWay_SDP_Demo_v02_final.mp4` |

**Check before upload:** length under 5:00 with the end card, the data card visible for at least 6 seconds, all sample labels visible on the demo, no logos except the FloodWay mark.

---

## 3. Cast and roles

| Speaker | Role in the video | Also responsible for |
|---|---|---|
| RAKUMAN (P1) | Lead presenter; opening, problem, solution, workflow, demo, close | Screen recording of the app, final edit approval |
| NADI (P2) | Trained model base layer and the model section | Confirms the slide numbers match the training report; leads the spatial re-test |
| TISYA (P3) | Forecast factor and the model section; comparison with JPS and others | Checks every comparison statement against the research report |
| LUQMAN (P4) | River node and street camera; feasibility and scalability | 3D renders and blueprint exports; cost slide |

Roles are assumed from the team notes. Swap them if the team agrees differently. Keep each speaker on one role so the viewer hears a consistent voice per topic.

**Wardrobe and set:** plain background in team colours (`#F4F7FB` or a plain wall), no team logo on clothing, no visible faces of anyone who has not agreed to appear.

---

## 4. Visual system

**Palette (matches the architecture poster):**
- Background: `#F4F7FB`
- Accent blue: `#1677FF`
- Dark blue: `#003EB3`
- Navy text: `#071426`
- Ladder: Normal `#16A34A` (green), Advisory `#EAB308` (yellow), Warning `#F97316` (orange), Danger `#DC2626` (red)

**Type:** Inter (the poster font). Headlines 56 pt, lower thirds 32 pt, captions 28 pt on a 1080p frame. Keep all text inside a 90% safe area.

**Motion language:** short, clean moves (200 to 400 ms), ease-out for entrances, no spinning logos, no bouncing text. Water is shown as simple shapes, never as photoreal flood footage unless it is licensed and credited.

**Icons:** simple line icons in accent blue, the same style as the poster (photo, text, GPS, clock, cloud, river, camera, chip, eye, merge, map, route, bell, solar, signal).

---

## 5. Scene-by-scene production notes

| Scene | Time | Visual approach | Motion graphics | Sound design | Footage needed |
|---|---|---|---|---|---|
| 1. Cold open | 0:00 to 0:15 | Rainy road, drain filling, phone alert | Title card reveal, a single wave line drawn in accent blue | Rain ambience, low rumble, splash at 0:08 | Own rain B-roll or licensed stock; a phone screen capture |
| 2. Problem | 0:15 to 0:40 | Counter, then a simple map with a flooded road | Counter RM0 to RM933.4 million, tag "DOSM, 2024"; road sinks in animation | Soft tick on the final number | Simple map graphic (no real map needed) |
| 3. Solution | 0:40 to 1:00 | Ladder reveal, phone with map and route | Four rows animate in with swatches and hex codes | Soft chime per row | App screen capture for the phone mock-up |
| 4. Workflow | 1:00 to 1:30 | Poster animates left to right | Arrows 1 to 6 light up in order; numbers pop | Swoosh per arrow, low tone on arrow 6 | The poster PNG, split into layers in After Effects or Blender |
| 5. Forecast and base layer | 1:30 to 1:55 | Two factor cards fly in | Forecast card (cloud, "when"); model card with the Low, Moderate, High band bar | Whoosh per card | Icon set; heat map graphic (illustrative, labelled) |
| 6. River node and camera | 1:55 to 2:40 | 3D turntable, exploded view, beam cone, sample camera frame | Beam cone from sensor to water; `h = H − d` formula; water line drawn on the camera frame; hold icon | Water rush under the node shot; click on the exploded view | 3D renders (from the GLB), blueprint S1 for the exploded view, one sample camera frame |
| 7. Trained model | 2:40 to 3:27 | Full-screen slide with caption banner; then a text card | Highlight boxes on the top row and the F1 cell for 3 seconds; "random pixel split" card | None under the voice, music drops out | The team's AI Model 1 slide (after the fix in Appendix A, item 5) |
| 8. Working demo | 3:27 to 3:59 | Screen recording of the real prototype | Cursor highlight, zoom-ins on the level card, the map and the route | UI clicks; phone ping at the alert | Clean screen captures of Live Vision, citizen report, map and route, alert |
| 9. Comparison | 3:59 to 4:29 | Text-only comparison table | Cells fill in one by one | Music steady | None; no logos of Waze, Google, JPS or NADMA |
| 10. Feasibility | 4:29 to 4:48 | Cost bar, parts icons, growth diagram | Cost bar marked "Estimate, before testing"; nodes added one by one | Light tick per part | Parts list (from blueprint S4) |
| 11. Close and data card | 4:48 to 4:54 | Title card, then data card held 6 seconds | Logo reveal; data card fades in | Music resolves | None |

---

## 6. Motion graphics list

1. **Title card** (0:00 to 0:06): FloodWay wordmark, a single wave line in `#1677FF`.
2. **Lower thirds** on each speaker's first appearance: name and role, 4 seconds, white on a dark blue bar.
3. **Loss counter** (Scene 2): animated number from RM0 to RM933.4 million, source tag below.
4. **Ladder reveal** (Scene 3): four rows, staggered 250 ms each, swatch and hex code in each row.
5. **Workflow animation** (Scene 4): arrows 1 to 6 light up in poster order.
6. **Factor cards** (Scene 5): two cards fly in with their icons.
7. **3D turntable and exploded view** (Scene 6): rendered from the GLB in Blender with a neutral background, then the exploded view from blueprint S1.
8. **Beam cone** (Scene 6): a translucent cone from the sensor face down to the water, with the formula appearing beside it.
9. **Camera frame** (Scene 6): one sample frame, a water line drawn in, a hold icon for the jump filter.
10. **Model slide overlay** (Scene 7): caption banner and highlight boxes.
11. **Screen-capture polish** (Scene 8): cursor highlight, zoom-ins, caption tags "Sample cameras. AI-generated frames. Sample relief centres."
12. **Comparison table** (Scene 9): text table, cells fill in sequence.
13. **Cost bar** (Scene 10): bar labelled "Estimate, before testing".
14. **End card and data card** (Scene 11): data card held 6 seconds, readable at phone size.

**Tools:** After Effects or the free equivalent for the 2D graphics; Blender with the existing GLB for the 3D shots (the Blender MCP connection can drive the render work). Keep the source files in `04_footage_folders/04_graphics/`.

---

## 7. Sound design and music

**Music:** one royalty-free bed, about 96 BPM, light and steady, with a slight tension in the middle. Two cue points: a lift at 1:30 and a resolve at 4:48. Keep the licence file in `05_audio/music/`. Do not use music from a news or social clip.

**Sound effects:**

| Cue | Time | Sound |
|---|---|---|
| Rain ambience | 0:00 | Continuous, low under narration |
| Drain splash | 0:08 | Single splash |
| Counter tick | 0:25 | Soft tick on the final figure |
| Ladder chime | 0:40 to 0:55 | Soft chime per row |
| Arrow swoosh | 1:00 to 1:30 | Short swoosh per arrow; low tone on arrow 6 |
| Factor whoosh | 1:30 | Soft whoosh per card |
| Water rush | 2:00 | Under the node shot |
| Click | 2:20 | Mechanical click on the exploded view |
| Notification ping | 3:40, 3:55 | Phone ping on the alert |

Use only sound effects with a licence you can keep on file.

---

## 8. Footage and sourcing rules

Your local folders will hold footage from news, social media and other sources. These rules apply to all of it.

1. **Licence first.** Every clip needs one of: your own recording, a licence you can show (stock with a receipt), or written permission from the owner. Record the source and the licence in `08_compliance/footage_log.csv`.
2. **News and social clips** are for research and reference unless you have permission. Do not use a news broadcast or a social post in the cut without written permission. Recreate the idea with your own footage or licensed stock instead.
3. **People in flood photos.** Blur or avoid the faces of anyone who has not agreed to appear. Do not show a named person in distress. Do not use a photo that could identify a family.
4. **Credit** any licensed or public-domain photo in the end credits.
5. **AI-generated frames** (the sample cameras and their frames) must be labelled on screen whenever they appear. The footer text from the poster is the reference wording.
6. **No logos.** No Waze, Google, JPS, NADMA, MetMalaysia or Huawei logos in the video. Name agencies as text only, and only where the script does.
7. **Screen recordings** must show the sample label in the corner. Do not record anything that looks like a live government feed.

---

## 9. Data and compliance checklist

- [ ] End card data card lists the sources in section 5 of the script (MetMalaysia open data, OpenStreetMap, GINKGO report, AI-generated samples, design-only river node, sample relief centres).
- [ ] Synthetic and sample data are stated in the video, not just in the documents.
- [ ] No accuracy percentage appears without the words "reported" or "prototype" next to it.
- [ ] The trained-model numbers match the training report exactly (99.62% accuracy, 99.33% F1 for the top model).
- [ ] Impact statistics are limited to the verified DOSM loss figure (RM933.4 million, 2024). The unsourced figures from earlier drafts are gone.
- [ ] Clause 25.1 of the terms (misleading information) reviewed by the team before submission.
- [ ] PLAN-AI intellectual property terms checked before any GINKGO model is shown as part of FloodWay.
- [ ] Every speaker has agreed to appear, and to the wording.

---

## 10. Schedule

Confirm the video's due date on the official SDP page first. The research report lists registration closing 21 October and the proposal on 23 October, with final submission on 11 November. Work backwards from whichever date applies to the video.

| Day | Work | Owner |
|---|---|---|
| 1 | Script read-through with timer; confirm speakers; fix the slide strip (99.62% accuracy, not F1) | RAKUMAN, NADI |
| 2 | Record voice-over, one session per speaker, in a quiet room, with one take per line plus two alternates | All four |
| 3 | Screen recordings of the prototype with sample labels; 3D renders from the GLB; exports of blueprint S1 and S4 | RAKUMAN, LUQMAN |
| 4 | Rough cut against the timeline; check the 4:40 target | RAKUMAN |
| 5 | Motion graphics, lower thirds, data card | RAKUMAN, with LUQMAN on 3D |
| 6 | Sound design, music, loudness pass | RAKUMAN |
| 7 | Captions (SRT), export draft, team review, fixes | All four |
| 8 | Export final, unlisted upload, check the link, submit | RAKUMAN |

If the team finds the trained-model re-test results before day 7, update Scene 7 first. Those are the most important lines in the video.

---

## 11. Quality checks before the final export

1. Length 4:50 to 5:00 including the end card.
2. Each speaker's audio is level and clean.
3. Every sample camera and frame has its label on screen.
4. No logo except FloodWay's.
5. The model numbers match Appendix A exactly.
6. Captions match the narration word for word.
7. The data card holds for 6 seconds.
8. The unlisted link opens in a private browser window.

---

## 12. Next steps for the team

1. Confirm the trained-model slide fix (Appendix A, item 5) and the "for planning review" wording (item 8).
2. Re-test Model 1 on held-out areas and update Scene 7 if the results change.
3. Confirm the pilot township (Bukit Raja is the proposed candidate) and the relief centre points used in the demo.
4. Build the 3D renders for Scene 6 from the GLB in Blender.
5. Start the local footage folders from `04_footage_folders/` and log every clip in `footage_log.csv`.
