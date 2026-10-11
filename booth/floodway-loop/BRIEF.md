# FloodWay 60-second product film: brief

## Purpose and audience
A 60-second premium consumer product film for ordinary Malaysians: commuters, delivery riders, parents and elders. After one viewing they should remember: **FloodWay helps me understand flood risk, find a safer route or shelter, and keep my family informed.** Judges should notice the technology; the people are the story.

Tone: calm → concerned → informed → confident → safe. No disaster imagery, panic, rescue scenes or casualties.

## Format (non-negotiable)
- 1920×1080, 30 fps, exactly 60.000 s (1,800 frames). `window.renderFrame(t)`, t ∈ [0, 60), pure function of t. Seeded PRNG, no clock in drawing code.
- Self-contained `index.html` that runs from `file://`. CSP `default-src 'none'`. Outfit (SIL OFL) 400/600/700/800 embedded as base64.
- Opens from black and ends on the brand card with a fade to navy, so repeat playback cuts cleanly.

## Storyboard (times from `src/timeline.json`)
| Scene | Window | Content |
|---|---|---|
| S1 | 0–7 | Letterboxed rain footage: monsoon sky, rain on asphalt, Aisyah (condo lobby), Kumar (scooter), Mei Ling + kids (car park), Nenek (window grille). "In Malaysia, rain can change your journey in minutes." |
| S2 | 7–13 | Same people: brake lights, standing water with an amber sign, split screen. "Which way is safer?" / "Where is the water rising?" / "Where should I go?" |
| S3 | 13–19 | Letterbox opens, the phone rises in 3D. Alert "Flood risk rising near you. Tap for your safest route." Wave mark, "FloodWay", "Know before you go." |
| S4 | 19–27 | Push into the 3D Twin. Water 0.00 → 0.30 m, SAFE → CAUTION at 0.15 m. At 0.30 m "Navigate to Safe Shelter (PPS)" rises and is tapped. "SEE THE WATER." / "UNDERSTAND THE RISK." |
| S5 | 27–35 | Map: flooded roads in red, the direct line crossed out, the route drawn around the flood to the PPS, ETA card "~7 min · 1.2 km · Route Safe". "FIND A SAFER ROUTE." |
| S6 | 35–42 | Warm car interior. SOS / Family Ping tap, ripple, three contacts go Sending → Delivered → Seen, "Family alerted". "KEEP YOUR PEOPLE CLOSE." |
| S7 | 42–49 | "FROM DATA TO DECISION." RAIN + WATER DATA → FORECAST SERVICE → YOUR ROUTE + ALERTS, community reports AI-checked, outputs Digital twin / Safer route / Alerts. |
| S8 | 49–55 | Four journey cards flip to green: Route understood, Safer direction, Family informed, Safe shelter found. "ONE APP. DIFFERENT JOURNEYS." |
| S9 | 55–60 | Hero phone on the home screen. "FloodWay", "Know before you go.", "See the risk. Find shelter. Stay connected." End card: mark, wordmark, project URL. |

## Visual identity
Navy #071426 · cyan #1677FF · water #38BDF8 · amber #F59E0B (caution) · emerald #10B981 (safe) · red #DC2626 (flooded roads only) · platinum #F8FAFC · slate #94A3B8. Hero type 120–150 px, statements 100–120 px, supporting 40–56 px, tags 28 px, in-phone key text 26–36 px at 1.0–1.35× phone scale.

## Claims policy (hard)
- No performance metrics on screen (no accuracy, mIoU, latency, forecast horizon, user counts). None has evaluation evidence in the repo.
- The only numbers shown: the twin gauge 0.00–0.30 m with its 0.15 m / 0.30 m marks (mirrors `SimulationPage.tsx`, `TerraceHouseScene.tsx`), and "~7 min · 1.2 km" (mirrors `NearestShelterCard.tsx`).
- No real road, mall, district or school shown near flooding; the shelter is shown generically as "Safe Shelter (PPS)". No third-party brands (phone makers, messaging apps, cloud providers).
- Never: "guaranteed", "save lives", endorsement or certification by JPS, MetMalaysia, NADMA or any agency. "Always follow official warnings (MetMalaysia / JPS)" stays on screen S1–S6; "Illustrative dramatization" on the real-world scenes; "Illustrative personas" on S8.
- `node audit-claims.mjs` enforces the forbidden list and a numbers allow-list over the source.

## Features not found verbatim in the app (built in the app's style)
- The button label "Navigate to Safe Shelter (PPS)" (the app says "EVACUATE TO SAFE SHELTER").
- Per-contact Sending / Delivered / Seen states for Family Ping (the app broadcasts one SOS to a family group).
- The lock-screen push notification.
- The home screen summarising twin + shelter + family on one card stack.

## Narration (Kokoro `bm_george`, en-GB, offline)
| Beat (s) | Line |
|---|---|
| 0.6 | In Malaysia, a journey can change when the rain comes. |
| 7.4 | When the water rises, knowing where to go matters. |
| 13.6 | Meet FloodWay, helping you understand flood risk before you move. |
| 19.6 | See the water level through FloodWay's digital twin, so you can understand what is happening around you. |
| 27.4 | When conditions change, FloodWay helps you find a route that avoids flooded roads and guides you toward a safe shelter. |
| 35.5 | And when you need them to know you're okay, one tap can let your family know. |
| 42.5 | FloodWay turns rain and water data, plus forecasting, into a decision you can act on. |
| 49.4 | Because every journey is different, but everyone deserves a clearer way to respond. |
| 55.8 | FloodWay. See the risk. Find shelter. |
