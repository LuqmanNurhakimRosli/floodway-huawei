# FloodWay: preliminary round script (about 5 minutes, three speakers)

Written for one slide (the landscape poster, `poster/FloodWay_Poster_1920x1080.png`), following the judging advice from the briefing: **problem, solution, impact**. About 590 spoken words: about 4 minutes 30 seconds at 130 words per minute, plus the questions.

**Speaker split (a suggestion; change it freely):** Luqman opens, covers the problem and closes. Nadi covers the solution and Live Vision. Tisya covers impact and the honesty section.

**Rules for speakers**
- Point at the section number on the slide as you name it: 1, 2 or 3.
- Say "designed for Huawei Cloud" and "planned". Never say the demo runs on ModelArts, PanGu-CV or Ascend.
- Never call the sample cameras real or government feeds.
- Stay on the one slide. Do not switch slides or play a video.

---

## Opening (all three, about 15 seconds)

> **Luqman:** Good morning judges, my name is Luqman.
>
> **Nadi:** My name is Nadi.
>
> **Tisya:** My name is Tisya, and we are from RESQ4ACE, Universiti Teknologi MARA.
>
> **Luqman:** Today we present **FloodWay**: an early warning for flash floods that turns the cameras a city already has into water-level sensors.

## 1 · The problem (Luqman, about 50 seconds)

> Picture a driver entering a basement carpark during heavy rain. Water at sixty centimetres can already move a car, and nothing warns them, because river gauges are not on the ramp.
>
> Flash floods arrive in minutes. In Kuala Lumpur in 2021, more than 380 millimetres of rain in 24 hours caused over fifty deaths and displaced 125,000 people. Most of those people never received a local warning.
>
> Covering every culvert, underpass and carpark with new sensors costs far too much. So our question was simple: **can we get a trustworthy water reading with no new hardware?**

## 2 · Our solution (Nadi, about 1 minute 30 seconds)

> Our answer has three steps: **see, think, act.**
>
> **See:** the snapshot from an existing camera, or a citizen's photo.
>
> **Think:** the AI finds the water zone and the waterline, and converts the waterline to a share of bank height. The reading is a median of five frames, so glare and ripples do not fool it.
>
> **Act:** the level is compared with three lines, normal, warning and danger. It drops only after three safe readings, so it does not flicker. Alerts go out, and the evacuation route avoids the flooded road.
>
> This is Live Vision. Every eight seconds, a camera's water level updates on screen with its percentage of bank height, and anyone can add a camera by link or by photo upload.
>
> For the wider system, we designed the deployment for Huawei Cloud. ModelArts would serve our flood forecast, Ascend would speed it up, OBS would host the media, and SMN would send the alerts. These are marked as planned on the slide, because the demo does not call them yet.

## 3 · Impact (Tisya, about 1 minute)

> Think about the Kampung Baru 1:00 AM case. The phone shows a yellow alert ninety minutes before the water turns dangerous. The route avoids the flooded road, with a detour of about four minutes. By 2:30 AM, the family and the car are already out.
>
> Without FloodWay, that same family gets no warning at all, and the roads out are already under water.
>
> FloodWay is affordable for society. According to our deck, a conventional river station costs about RM150,000. FloodWay adds no new hardware and is free for citizens. Councils, logistics firms and insurers could pay for the operations dashboard and the routing service, and the citizen app stays free.
>
> We also want to be honest. Our sample cameras use AI-generated photos with simulated water, and the screen labels them that way. The forecast is a formula for now, and we have not measured accuracy in the field. What is real is the pipeline, user-added cameras, the alerts and the road routes. We would rather show you a smaller truth than a bigger claim.

## Close (Luqman, about 20 seconds)

> Our proof is in the tests: 250 automated checks pass, and the interface is checked at eleven screen sizes.
>
> FloodWay: one camera network for a whole city, no new sensors, and a warning before the water arrives.
>
> You can try the live demo yourself. Scan the QR code on the slide, or go to floodway-huawei.pages.dev. Thank you, and we welcome your questions.

---

## Likely questions, with straight answers

| Question | Answer |
|---|---|
| Is the water level accurate? | Not measured in the field yet. The pipeline is tested on sample scenes. Proving accuracy on a partner camera is our next step. |
| Are those real cameras? | No. They are labelled samples: AI-generated photos with simulated water. Real use needs the owner's permission. |
| Does it use Huawei Cloud now? | Not yet. The ModelArts package is prepared, and the rest is a design. The slide marks each part as prepared or planned. |
| Is the forecast a trained model? | The demo shows a hand-written formula. A GRU prototype exists, trained on synthetic data. We will retrain it on real gauge and rainfall records. |
| Why vision and not sensors? | Cameras already exist in carparks and on roads, and they work where radio sensors cannot. |
| What stops fake reports? | A report shows a trust status, and nothing is marked verified unless it was. Forensic checks with PanGu-CV are planned. |
