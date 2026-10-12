# FloodWay preliminary pitch: 4 minutes 30 seconds

Written to follow the poster, left to right. About 575 spoken words: 4 minutes 25 seconds at a calm 130 words per minute, 4 minutes 5 seconds at 140. The times are targets; practise once with a timer and trim the Huawei Cloud section first if you run over.

**Rules for the speaker**
- Point at the poster section as you name it. The numbers are on the poster so you do not have to memorise them.
- Say "designed for Huawei Cloud" and "planned". Never say the demo "runs on" or "is powered by" ModelArts, PanGu-CV or Ascend. The poster says the demo calls no Huawei Cloud service yet, and a judge may check.
- Never call the sample cameras real or government feeds.

---

## 0:00 to 0:30 · Hook (poster header)

> Good morning, judges. We are team RESQ4ACE from Universiti Teknologi MARA, and this is **FloodWay**.
>
> Picture a driver entering a basement carpark during heavy rain. Water at sixty centimetres can already move a car. There is no warning: the city's sensors are on the river, not on the ramp.
>
> FloodWay turns the cameras a city **already has** into a water-level sensor, and then tells people where to go.

## 0:30 to 1:10 · The problem (poster box 1)

> Flash floods arrive in minutes. They hit culverts, sunken roads, underpasses and carparks, which are exactly the places river gauges do not cover.
>
> Covering them needs thousands of sensors, and basements block radio signals. And in a crisis, recycled and synthetic flood photos spread online.
>
> So the question we asked was simple: **can we get a trustworthy water reading with no new hardware?**

## 1:10 to 1:40 · The answer (poster box 2)

> Our answer is vision first, in three steps: **See, Think, Act.**
>
> **See:** existing camera snapshots, citizen photos, and optionally a small ultrasonic node.
> **Think:** AI finds the waterline and turns it into a share of the bank height.
> **Act:** alerts, evacuation routes that avoid flooded areas, and a community hub.

## 1:40 to 2:30 · Live Vision, the working core (poster box 3 and the screenshots)

> This is the part that works today. Look at the Live Vision screen.
>
> Every eight seconds the system grabs a burst of five frames, finds the water zone, and converts the waterline into a percentage of bank height. Below about twenty-six percent is normal, above about sixty-three is a warning, and near ninety-seven is danger.
>
> The level only **drops** after three safe readings in a row, so it does not flicker. When it rises you get a toast, a browser notification and a Telegram message, and the map bends evacuation routes around that flood zone.
>
> Anyone can add a camera by link or photo upload, and private addresses are blocked.

## 2:30 to 3:25 · Huawei Cloud ecosystem (poster box 4, the red box)

> Now the Huawei Cloud part. I want to be precise about what is built and what is planned.
>
> **Today** the demo runs on our own FastAPI and React stack, with a classical vision analyser. It calls no Huawei Cloud service yet.
>
> **The design** puts each Huawei service where it fits. **ModelArts** trains and serves our flood-risk GRU forecaster, and we have already prepared the inference package for it. **Ascend 910** accelerates that training and inference. **PanGu-CV** replaces our classical analyser for depth and for checking whether a citizen photo is genuine. **OBS** hosts the web app and camera media, **ECS and CCE** run the services in containers, **IoTDA** takes in field sensors, and **SMN** sends SMS and email alerts.
>
> It is a clear path from prototype to cloud service, and every tile is marked prepared or planned.

## 3:25 to 3:50 · Honest by design (poster box 6)

> That honesty is deliberate. Our sample cameras use AI-generated base photos with simulated water, and they are labelled that way on screen. The river numbers and the forecast formula are simulated. We do **not** claim government feeds, agency verification, or measured field accuracy.
>
> What is real: the pipeline, user-added cameras, alerts and road routes. We would rather show you a smaller truth than a bigger claim.

## 3:50 to 4:15 · Evidence (poster box 7)

> To back that up: two hundred and thirty-nine automated tests pass, the interface is checked at eleven screen sizes, camera addresses are guarded against request forgery, and secrets stay out of the browser.

## 4:15 to 4:30 · Close (poster box 8)

> Next, we deploy on Huawei Cloud, call a ModelArts endpoint, move to PanGu-CV, and field-test with a real partner camera to publish measured accuracy.
>
> FloodWay: one camera network for a whole city, no new sensors, and a warning before the water arrives. Thank you. We welcome your questions.

---

## Likely judge questions, with straight answers

| Question | Answer |
|---|---|
| Is the water level accurate? | We have not measured field accuracy yet. The pipeline is real and tested on sample scenes; proving accuracy on a partner camera is our next step. |
| Are those real cameras? | No. They are labelled samples: AI-generated photos with simulated water. Real use needs permission from the camera owner. |
| Does it use Huawei Cloud now? | Not yet. The ModelArts package is prepared; the rest is a design. We separated the two on the poster so it is clear. |
| Is the forecast a trained model? | The demo shows a hand-written formula. A GRU prototype exists, trained on synthetic data, and is packaged for ModelArts. We will retrain it on real gauge and rainfall records. |
| Why vision and not sensors? | Cost and coverage: cameras already exist in carparks and on roads, and they work where radio sensors cannot. We still support an optional ultrasonic node. |
| What stops fake reports? | Reports show a visible trust status and nothing is marked verified unless it was. PanGu-CV forensic checks are planned. |
