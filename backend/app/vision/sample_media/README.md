# FloodWay Live Vision — Sample Media Repository

> **AI-generated sample imagery. Not real camera footage.**

This directory contains simulated visual media assets for FloodWay 2.0 urban flood intelligence demonstrations across Kuala Lumpur and Selangor drainage corridors.

---

## ⚠️ Honesty & Authenticity Disclosure
1. **Simulation Status:** Every image and video contained herein consists strictly of **AI-generated sample imagery**. None of these files represent real government CCTV streams, agency feeds, or live surveillance infrastructure.
2. **Branding & Logos:** No government agency crests, logos, vehicle liveries, or trademarks (such as JPS, DID, DBKL, BOMBA, or METMalaysia) appear within this imagery.
3. **Privacy & Anonymity:** No identifiable persons, readable license plates, commercial signage, or precise street addresses are depicted.
4. **Purpose:** Designed solely to benchmark and validate the computer vision water level segmentation pipelines (`ClassicalWaterAnalyzer`) and frontend responsive layout components across different simulated flood levels (`NORMAL`, `WATCH / ADVISORY`, `WARNING`, `DANGER`).

---

## 📁 Asset Inventory

### 1. Water-Level Calibration Frames (640×360 JPEG, ≤300 KB each)
* **`klang-*.jpg`** (`sample-klang-jamek`): Elevated CCTV perspective from a footbridge deck looking down-river along a tiered concrete monsoon canal.
  * `klang-normal.jpg`: Baseline low water sitting well inside canal bed.
  * `klang-watch.jpg`: Raised water line submerging the lowest ledge.
  * `klang-warning.jpg`: Surging brown water reaching mid-height of canal walls.
  * `klang-danger.jpg`: Severe floodwater rising near the bank top under the footbridge.
* **`gombak-*.jpg`** (`sample-gombak-tun-razak`): Eye-level side-on channel retaining wall featuring a staff gauge measuring rod.
  * `gombak-normal.jpg`: Clear stream below the first gauge mark.
  * `gombak-watch.jpg`: Water line rising to the lower section of the gauge rod.
  * `gombak-warning.jpg`: Flooding reaching the middle markings of the staff gauge.
  * `gombak-danger.jpg`: Water level reaching the top red danger mark near the embankment lip.
* **`smart-*.jpg`** (`sample-smart-tunnel`): Low-angle roadside view facing a massive concrete stormwater culvert tunnel inlet.
  * `smart-normal.jpg`: Shallow runoff across concrete apron bed.
  * `smart-watch.jpg`: Water spreading across lower basin apron.
  * `smart-warning.jpg`: Water filling the apron and entering the lower tunnel mouth.
  * `smart-danger.jpg`: Deep turbulent flow rising halfway up the arch tunnel inlet.
* **`batu-*.jpg`** (`sample-batu-sentul`): Riverside walkway edge with stone parapet railing in foreground.
  * `batu-normal.jpg`: Low river water with exposed grassy lower bank.
  * `batu-watch.jpg`: River channel filling to bank base.
  * `batu-warning.jpg`: Floodwater rising up the riverbank.
  * `batu-danger.jpg`: High flood stage approaching the walkway parapet line.
* **`drain-*.jpg`** (`sample-kampung-baru-drain`): Urban box drain with protective metal drainage grate looking down from pole mount.
  * `drain-normal.jpg`: Dry concrete channel with grate.
  * `drain-watch.jpg`: Inflow rising along channel floor.
  * `drain-warning.jpg`: Churning stormwater filling box drain.
  * `drain-danger.jpg`: Water level overtopping to upper lip.

### 2. Video Demonstration Loop (The Only Video)
* **`frontend/public/media/live/klang-rise.mp4`** (H.264, 640×360, 25 fps, 186 KB):
  * Continuous 15-second loop showing the Klang River bridge view progressing from NORMAL → WATCH → WARNING → DANGER → WARNING → NORMAL with smooth crossfades and seamless looping.
  * Accompanied by poster image: **`klang-rise-poster.webp`**.

### 3. OpenGraph Social Card
* **`frontend/public/media/og/floodway-og.jpg`** (1200×630 JPEG, 93 KB): High-resolution OpenGraph card highlighting FloodWay Live Vision.

---

## 🧪 Validation & Accuracy
To verify that all 20 frames classify at their intended alert level using the project's classical computer vision analyzer:

```bash
cd backend
python -m app.vision.sample_media.check_frames
```

**Result:** `TOTAL 20/20 frames classified at the expected level (100%)`.
