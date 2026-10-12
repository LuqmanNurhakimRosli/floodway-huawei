# FloodWay: Preliminary Round Pitch Script & Q&A Guide

Written specifically for the single landscape poster (`poster/FloodWay_Poster_1920x1080.png`), following the briefing rules: **one slide/poster only, 5 minutes total (pitch + Q&A)**. 
Word count: ~560 spoken words (~4 minutes 15 seconds at a calm, natural 130 WPM), leaving ample time for judge Q&A.

**Presenter Setup:**
- All 3 members (Luqman, Nadi, Tisya) stand together in front of the laptop camera.
- Luqman, Nadi, and Tisya deliver the short 15-second opening together.
- **Nadi takes over as the sole presenter** for the entire pitch from start to finish, maintaining seamless narrative momentum while gesturing naturally to the poster sections.

**Core Rules for Presentation:**
- Point directly at the poster sections as you reference them: **1 · The problem**, **2 · Our solution**, **3 · Impact**, **Proof, not promises**, and **Why we win**.
- Say *"designed for Huawei Cloud"* and *"architecture prepared for deployment"*.
- State clearly that the benchmark figures (*95.34% pixel accuracy, 86.96% flood IoU*) come from the **Sen1Floods11 validation split**, and *100% flood avoidance* from our **100 simulated Klang Valley routing scenarios**.
- Point to the live QR code on the footer of the poster for judges to test `floodway-huawei.pages.dev`.

---

## 🎙️ The Pitch Script (Start to Finish)

### [0:00 – 0:15] Opening (All Three)

> **Luqman:** Good morning, honorable judges. My name is Luqman.
>
> **Nadi:** My name is Nadi.
>
> **Tisya:** My name is Tisya, and we are team **RESQ4ACE** from Universiti Teknologi MARA.
>
> **Nadi:** Today, we present **FloodWay**: Predict, verify, and guide—before the road disappears.

---

### [0:15 – 1:10] Act 1: The Problem (Nadi)
*(Nadi points to Section 1 on the left side of the poster)*

> Picture a driver heading home through Kuala Lumpur during a torrential downpour. Water at just sixty centimetres can already lift and sweep away an entire vehicle. Yet, nothing warns them before they enter an underpass or a basement carpark, because physical river telemetry stations simply don't sit on roadside ramps.
>
> As shown here in **Section 1**, in the Klang Valley, flash floods develop in **less than 45 minutes**, yet **78% of affected residents never receive any local warning**.
>
> In December 2021, over **380 millimetres of rain** submerged Kuala Lumpur in 24 hours, claiming over **50 lives**, displacing **125,000 citizens**, and inflicting **RM6.1 billion** in economic destruction. 
>
> Traditional river stations cost roughly **RM150,000 each** to install and maintain. We cannot put a RM150,000 sensor at every monsoon drain, culvert, and underpass. So our team asked a fundamental question: **How can we give an entire city hyper-local flood intelligence without buying a single piece of new hardware?**

---

### [1:10 – 2:30] Act 2: Our Solution (Nadi)
*(Nadi points to Section 2 in the centre of the poster: the mobile interfaces, Live Vision, and the 3 pillars)*

> In **Section 2**, you see our answer: **One glance. One tap.** 
>
> FloodWay transforms the existing visual infrastructure of the city—roadway CCTVs, river monitors, and community camera feeds—into real-time hydrologic sensors through three distinct pillars:
>
> 1. **Predict:** We forecast water stage progression at **+30, +60, and +120 minutes** using watershed precipitation algorithms.
> 2. **Verify (Live Vision):** Our computer vision engine reads water levels relative to bank height every few seconds. By calculating a rolling median across consecutive frames, it completely filters out headlight glare, surface ripples, and rain artifacts. Meanwhile, citizen-uploaded photos pass automated computer vision verification before dispatching to responders.
> 3. **Guide:** We don't just alert—we navigate. FloodWay provides depth-aware evacuation routing, dynamically weighting road segments against vehicle clearances between **0.10 to 0.70 metres**.
>
> At the base of Section 2 is our **Huawei Cloud Architecture**:
> - **ModelArts** trains and serves the flood stage forecasting models.
> - **OBS** ingests and hosts real-time camera snapshots and application media.
> - **ECS** drives our Live Vision inference pipeline and dynamic graph routing engine.
> - **SMN** broadcasts instant SMS and push emergency SOS notifications to endangered residents.

---

### [2:30 – 3:30] Act 3: Real Impact & The 1:00 AM Alert (Nadi)
*(Nadi gestures to Section 3: Impact in Kampung Baru and the comparison matrix)*

> Let's look at what this means in real human terms in **Section 3: The Kampung Baru Case**.
>
> At **1:00 AM**, a yellow alert sounds on a family's smartphone—a crucial **90-minute head start** before the drainage turns dangerous. 
>
> At that exact moment, FloodWay generates a verified dry route to an open relief shelter, taking a minor detour of just **4.2 minutes** around the submerged arterial junction.
>
> By **2:30 AM**, floodwaters have reached their street, but the family and their vehicle are already on safe, high ground.
>
> Looking at our **"Why We Win"** matrix on the right, traditional systems offer zero forward forecast, blind navigation, and static shelter lists. FloodWay delivers a 120-minute horizon, clearance-aware routing, live shelter capacities, and requires zero new hardware. Crucially, **we do not seek to replace JPS, JKM, or JKR—we connect them.**

---

### [3:30 – 4:15] Act 4: Proof, Not Promises & Close (Nadi)
*(Nadi points to "Proof, not promises" on the top right, and the QR code on the footer)*

> We pride ourselves on verifiable proof, not inflated claims.
>
> In our algorithmic testing across 100 simulated Klang Valley flood emergencies, FloodWay achieved **100% flood hazard avoidance**, compared to 0% for conventional commercial navigation apps that route blind drivers directly into submerged roads.
>
> On the standardized **Sen1Floods11 validation split**, our water segmentation achieves **95.34% pixel accuracy** and **86.96% flood IoU**. Our routing recalculates in **under 120 milliseconds** with an average detour of just **+4.2 minutes**.
>
> FloodWay has already been recognised as 2× First Runner-Up in national hackathons and validated by Senior Officer Rosli Bin Wahab of Jabatan Bomba dan Penyelamat Malaysia, who confirmed: *"Our biggest challenge is families evacuating too late. FloodWay will genuinely save lives."*
>
> Best of all, our entire end-to-end production application is live right now with automated checks verified across 11 screen viewports. 
>
> You can scan the QR code right here on the bottom right of the poster, or visit **`floodway-huawei.pages.dev`** on your device to test FloodWay right now.
>
> Thank you, and we look forward to your questions.

---

## 🎯 Master Q&A Preparation Guide

Tailored for technical judges, industry panelists, and business evaluators.

### 1. Technical & Computer Vision Architecture

| Question | Winning Answer |
|---|---|
| **Where do the 95.34% accuracy and 86.96% IoU figures come from?** | "Those benchmarks are measured on the ground-truth **Sen1Floods11 validation split** for floodwater segmentation. In our live web prototype, our Live Vision pipeline calculates bank-height percentages using contour thresholding and rolling frame medians to eliminate glare and wave flutter." |
| **How does Live Vision measure water depth if there is no physical gauge rod installed?** | "Rather than requiring calibrated metric rulers, we calibrate two fixed visual reference anchors per camera: the **crest of the bank** (100% capacity) and the **dry channel floor** (0%). The segmentation mask calculates the water line ratio. In production with Huawei Cloud, PanGu-CV and ModelArts will automate reference marker calibration." |
| **How does FloodWay handle night-time scenes, severe rain, and headlights?** | "We solve this in two layers. First, we apply localized CLAHE contrast equalization and take the **median across 5 consecutive camera frames**, which filters transient light sweeps and water ripples. Second, our state engine uses **hysteresis**: danger alerts fire immediately, but an alert is only cleared after **3 consecutive normal readings**, preventing alert flickering." |
| **How does your routing guarantee safety?** | "Standard navigation apps optimize purely for distance or road congestion. FloodWay uses a custom-weighted routing graph where flooded edges receive safety penalties based on water depth mapped against the user's vehicle clearance (e.g. 0.15m for a sedan, 0.50m for a 4WD, up to 0.70m for heavy rescue vehicles), computing an alternate safe path in under 120 milliseconds." |

---

### 2. Huawei Cloud Integration & Technology Stack

| Question | Winning Answer |
|---|---|
| **What role does Huawei Cloud play in FloodWay?** | "Huawei Cloud provides our enterprise backbone across four services: **ModelArts** handles distributed training and real-time model inference for flood stage prediction; **OBS** serves as high-throughput object storage for city-wide camera snapshots and citizen media; **ECS** runs our routing graph engines and API backend; and **SMN (Simple Message Notification)** disseminates rapid SMS and multi-channel emergency broadcast alerts." |
| **Is the current prototype running directly on Huawei Cloud?** | "Our repository is fully structured with ModelArts packaging, REST API contracts, and ECS deployment automation. For the preliminary evaluation demo, the client is deployed on an edge CDN connected to our local verified API runtime to ensure zero judging downtime. Staging on live Huawei Cloud instances is our semi-final roadmap deliverable." |

---

### 3. Business Model, Commercial Viability & Public Sector Fit

| Question | Winning Answer |
|---|---|
| **How do you monetize if the citizen app is free?** | "We adopt a **B2G and B2B model**: <br>1. **Municipal Councils (DBKL / MBIP):** City command center licenses for monitoring urban drainage choke points at a fraction of the RM150,000 cost of a hardware station.<br>2. **Logistics & Delivery Fleets (Grab, Shopee, Lalamove):** Enterprise Routing API licenses to prevent vehicle write-offs and safeguard delivery workers.<br>3. **Insurance Companies:** Flood hazard footprint telemetry to verify claims and assist proactive policyholder warnings." |
| **How do you connect with government agencies like JPS, JKM, and JKR without stepping on their toes?** | "FloodWay is explicitly designed as an **integrator, not a replacement**. We ingest river telemetry and flood warnings from JPS, road closure data from JKR, and relief shelter bed status from JKM, synthesising them into one accessible citizen app and command dashboard that fills the 'last-mile' warning gap." |

---

### 4. Data Ethics, Security & Credibility

| Question | Winning Answer |
|---|---|
| **Are the camera feeds in your live demo government CCTVs?** | "No. In accordance with strict ethical rules, our demo cameras use **AI-generated photorealistic sample environments** simulating actual Klang Valley locations, clearly watermarked as SAMPLE in the UI. In commercial deployment, camera feeds will be onboarded via municipal data sharing agreements and private facility partnerships (such as mall carparks and highway operators)." |
| **What stops users from submitting fake or outdated flood pictures?** | "Citizen reports follow a strict verification pipeline: uploaded images undergo metadata validation, geo-fencing against rainfall radar, and computer vision verification before being routed to response operators. Unverified reports display an orange 'Community' status and never trigger high-priority red alerts on their own." |

