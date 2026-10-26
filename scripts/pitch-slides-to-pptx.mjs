// Builds the semi-final pitch slides (agenda to live demo) as an editable PowerPoint that Canva can import.
// Content: docs/team/PITCH_SLIDES_5_17.local.md. Screenshots: node frontend/scripts/capture-pitch-shots.mjs.
// Run from the repo root:  node scripts/pitch-slides-to-pptx.mjs  (needs: cd scripts/pptx-tool && npm install)
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PptxGenJS = createRequire(path.join(root, 'scripts/pptx-tool/'))('pptxgenjs');
const shots = (f) => path.join(root, 'docs/team/slide-assets', f);

const C = { navy: '0B1B33', blue: '0958D9', sky: 'E8F1FF', red: 'C7000B', slate: '475569', mute: '64748B', line: 'E2E8F0', bg: 'F4F7FB', white: 'FFFFFF',
  green: '047857', greenBg: 'ECFDF5', amber: 'B45309', amberBg: 'FFFBEB', danger: 'B91C1C', dangerBg: 'FEF2F2' };
const HEAD = 'Outfit';
const BODY = 'Inter';

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 in
pptx.title = 'FloodWay semi-final slides';

let n = 0;
function base(kicker, title, notes) {
  n += 1;
  const s = pptx.addSlide();
  s.background = { color: C.white };
  s.addShape('rect', { x: 0.6, y: 0.32, w: 0.55, h: 0.07, fill: { color: C.red }, line: { color: C.red } });
  s.addText(kicker.toUpperCase(), { x: 0.6, y: 0.42, w: 9, h: 0.35, fontFace: BODY, fontSize: 14, bold: true, color: C.red, charSpacing: 2 });
  s.addText(title, { x: 0.6, y: 0.78, w: 12.1, h: 0.95, fontFace: HEAD, fontSize: 36, bold: true, color: C.navy, valign: 'top', fit: 'shrink' });
  s.addText('FloodWay  |  Huawei ICT Competition 2026-27', { x: 0.6, y: 7.05, w: 8, h: 0.3, fontFace: BODY, fontSize: 11, color: C.mute });
  if (notes) s.addNotes(notes);
  return s;
}
const source = (s, text) => s.addText(text, { x: 0.6, y: 6.65, w: 12.1, h: 0.35, fontFace: BODY, fontSize: 12, color: C.mute, italic: true });

function card(s, x, y, w, h, head, body, o = {}) {
  s.addShape('roundRect', { x, y, w, h, rectRadius: 0.12, fill: { color: o.fill ?? C.bg }, line: { color: o.line ?? C.line, width: 1 } });
  s.addShape('rect', { x: x + 0.22, y: y + 0.22, w: 0.5, h: 0.06, fill: { color: o.accent ?? C.blue }, line: { color: o.accent ?? C.blue } });
  s.addText(head, { x: x + 0.2, y: y + 0.32, w: w - 0.4, h: 0.5, fontFace: HEAD, fontSize: 20, bold: true, color: C.navy, valign: 'top' });
  s.addText(body, { x: x + 0.2, y: y + 0.85, w: w - 0.4, h: h - 1.0, fontFace: BODY, fontSize: o.size ?? 16, color: C.slate, valign: 'top' });
}
function stat(s, x, y, w, h, big, small, color = C.navy) {
  s.addShape('roundRect', { x, y, w, h, rectRadius: 0.12, fill: { color: C.bg }, line: { color: C.line, width: 1 } });
  s.addText(big, { x, y: y + 0.15, w, h: h * 0.55, fontFace: HEAD, fontSize: 40, bold: true, color, align: 'center', valign: 'middle' });
  s.addText(small, { x: x + 0.1, y: y + h * 0.62, w: w - 0.2, h: h * 0.32, fontFace: BODY, fontSize: 14, color: C.slate, align: 'center', valign: 'top' });
}
const th = (t) => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.navy }, fontFace: BODY, fontSize: 15 } });
const td = (t, o = {}) => ({ text: t, options: { fontFace: BODY, fontSize: 15, color: C.navy, ...o } });
const table = (s, rows, o) => s.addTable(rows, { x: 0.6, y: 1.9, w: 12.1, border: { type: 'solid', color: C.line, pt: 1 }, valign: 'middle', margin: [0.08, 0.12, 0.08, 0.12], ...o });

// 1. Agenda
{
  const s = base('Agenda', '15 minutes: 10 of talk, 5 of live demo',
    'Say the plan in one breath. The demo is protected: it has its own 5 minutes at the end.');
  table(s, [
    [th('Part'), th('What you will see'), th('Time')],
    [td('Problem', { bold: true }), td('KL, December 2021, and why warnings arrive too late'), td('1.5 min')],
    [td('Solution and proof', { bold: true }), td('Four sources, one decision. The flood-prone model, tested on floods it never saw'), td('4 min')],
    [td('Impact and market', { bold: true }), td('The 1:00 AM alert. Why we win. Shah Alam pilot'), td('2.5 min')],
    [td('Evidence', { bold: true }), td('How we meet the judging criteria. Open source, reproducible'), td('2 min')],
    [td('Live demo', { bold: true, color: C.red }), td('Storm scenario on a phone, with the sensor', { bold: true }), td('5 min', { bold: true, color: C.red })],
  ], { colW: [3, 7.4, 1.7], rowH: 0.75 });
}

// 2. Imagine
{
  const s = base('The problem', '380 mm in 24 hours. Nobody was warned.',
    'KL, December 2021. Drains built for less. Drivers followed GPS into water. Cite The Guardian and DOSM. Drop the 78 percent figure unless you can source it.');
  stat(s, 0.6, 2.0, 3.0, 1.9, '380 mm', 'rain in 24 hours');
  stat(s, 3.8, 2.0, 3.0, 1.9, '50+', 'lives lost', C.danger);
  stat(s, 0.6, 4.1, 3.0, 1.9, '125,000', 'people displaced');
  stat(s, 3.8, 4.1, 3.0, 1.9, 'RM 6.1B', 'losses (DOSM)', C.danger);
  s.addText('Drains built for less.\nDrivers followed GPS into water.', { x: 7.3, y: 2.3, w: 5.4, h: 2.2, fontFace: HEAD, fontSize: 32, bold: true, color: C.navy, valign: 'top' });
  s.addText('Selangor and Kuala Lumpur, 17-18 December 2021.', { x: 7.3, y: 4.6, w: 5.4, h: 0.8, fontFace: BODY, fontSize: 18, color: C.slate, valign: 'top' });
  source(s, 'Source: The Guardian (2021); DOSM flood impact report (15 Apr 2026).');
}

// 3. Too slow
{
  const s = base('The gap', 'Floods take minutes. Warnings take hours.',
    'Fast flood, slow notice, wrong map. The first hour is the gap we close.');
  card(s, 0.6, 2.0, 3.9, 3.4, 'Fast', 'Under 45 minutes for a Klang Valley flash flood to turn dangerous.', { accent: C.danger, size: 18 });
  card(s, 4.7, 2.0, 3.9, 3.4, 'Slow', 'Road closures reach official portals hours late, after site inspections.', { accent: C.amber, size: 18 });
  card(s, 8.8, 2.0, 3.9, 3.4, 'Blind', 'Google Maps and Waze route by traffic, not water.', { accent: C.green, size: 18 });
  s.addShape('roundRect', { x: 0.6, y: 5.75, w: 12.1, h: 0.75, rectRadius: 0.1, fill: { color: C.sky }, line: { color: C.sky } });
  s.addText('The gap is the first hour. That is where FloodWay works.', { x: 0.8, y: 5.75, w: 11.7, h: 0.75, fontFace: HEAD, fontSize: 22, bold: true, color: C.blue, valign: 'middle' });
}

// 4. Four factors
{
  const s = base('Our idea', 'Four sources. One warning.',
    'None of the four is trusted alone. This fusion is our innovation claim, not one model. SDGs 11.5, 13.1, 9.1.');
  const t = (x, y, head, role, body, accent) => card(s, x, y, 5.95, 2.1, head, `${role}\n${body}`, { accent, size: 16 });
  t(0.6, 1.95, 'Flood-prone model', 'WHERE', 'Seven years of JPS-reported floods, scored by terrain and rain.', C.blue);
  t(6.75, 1.95, 'MET Malaysia warning', 'WHEN', 'Rain warnings, hours ahead.', C.amber);
  t(0.6, 4.2, 'IoT water sensor', 'NOW, ONE POINT', 'Depth at the monitored spot, every second.', C.green);
  t(6.75, 4.2, 'CCTV vision', 'NOW, WIDE AREA', 'AI reads the water level from river cameras.', C.danger);
  s.addText('FloodWay alerts when independent sources agree.', { x: 0.6, y: 6.4, w: 9, h: 0.5, fontFace: HEAD, fontSize: 22, bold: true, color: C.blue });
  s.addText('SDG 11.5  |  SDG 13.1  |  SDG 9.1', { x: 9.0, y: 6.4, w: 3.7, h: 0.5, fontFace: BODY, fontSize: 14, color: C.mute, align: 'right' });
}

// 5. Fusion
{
  const s = base('How it decides', 'Warn early. Never cry wolf.',
    'Three rules. Walk the five steps on the timeline. The leave-now alert comes before the camera sees anything. Rule-based and tested in code, not a trained model.');
  const rule = (x, head, body) => card(s, x, 1.95, 3.95, 2.0, head, body, { size: 16 });
  rule(0.6, '1. Live sets the level', 'A sensor or camera reading is the base.');
  rule(4.7, '2. Agreement raises it', 'Another source at Warning raises it one step.');
  rule(8.8, '3. Context only watches', 'Rain and flood history alone say "watching".', {});
  const steps = [['MET warning', 'Watching'], ['Flood-prone place', 'Watching'], ['Sensor at 58%', 'Leave now'], ['Camera rising', 'Confirmed'], ['All four agree', 'Danger']];
  steps.forEach(([a, b], i) => {
    const x = 0.6 + i * 2.45;
    const hot = i >= 2;
    s.addShape('roundRect', { x, y: 4.35, w: 2.25, h: 1.7, rectRadius: 0.1, fill: { color: hot ? C.dangerBg : C.bg }, line: { color: hot ? C.danger : C.line, width: 1 } });
    s.addText(String(i + 1), { x: x + 0.15, y: 4.45, w: 0.5, h: 0.4, fontFace: HEAD, fontSize: 18, bold: true, color: hot ? C.danger : C.blue });
    s.addText(a, { x: x + 0.15, y: 4.85, w: 1.95, h: 0.55, fontFace: BODY, fontSize: 15, bold: true, color: C.navy, valign: 'top' });
    s.addText(b, { x: x + 0.15, y: 5.4, w: 1.95, h: 0.5, fontFace: HEAD, fontSize: 18, bold: true, color: hot ? C.danger : C.slate, valign: 'top' });
  });
  source(s, 'Rule-based fusion, covered by tests in the repo. Not a trained model.');
}

// 6. Model
{
  const s = base('Flood-prone model', 'Tested on floods it never saw.',
    'Trained on 2015-2019 JPS-reported floods, tested on 2020-2021. A relative score, not a probability. Is it just elevation? Benchmark B limits the background to lowland and still scores 0.72-0.78. Is it just the wet season? On a season-matched subset the tree models hold 0.75-0.76 and logistic regression falls to 0.58. Both are disclosed.');
  stat(s, 0.6, 2.0, 3.9, 2.1, '0.836', 'ROC-AUC on held-out 2020-21 floods (95% CI 0.777 to 0.892)', C.blue);
  stat(s, 4.7, 2.0, 3.9, 2.1, '17 of 17', 'top-ranked places were real flood sites', C.green);
  stat(s, 8.8, 2.0, 3.9, 2.1, '0.782', 'harder lowland-only test (CatBoost)', C.amber);
  s.addText([
    { text: 'Train 2015-19, test 2020-21. ', options: { bold: true } },
    { text: '250 reported floods against 250 background points.', options: { breakLine: true } },
    { text: '5 inputs: ', options: { bold: true } },
    { text: '1, 3 and 7-day prior rain (ERA5), elevation and slope (Copernicus DEM).', options: { breakLine: true } },
    { text: 'A relative score, not a flood probability.', options: { bold: true, color: C.danger } },
  ], { x: 0.6, y: 4.4, w: 12.1, h: 1.9, fontFace: BODY, fontSize: 18, color: C.slate, valign: 'top', paraSpaceAfter: 8 });
  source(s, 'Source: Stage 5 benchmark (RESULTS_5_MODEL_COMPARISON.md). Rerun with the README steps.');
}

// 7. Map and evacuation
{
  const s = base('Live map and evacuation', 'Routes that avoid the water.',
    'Built. Shelters and road depth are simulated demo data. Routes are re-weighted by flood depth against vehicle clearance, from 0.10 m on foot to 0.70 m for a 4x4.');
  card(s, 0.6, 2.0, 7.4, 1.35, 'Status that does not flicker', 'A traffic-light level that only escalates when the trend is real.', { size: 16 });
  card(s, 0.6, 3.5, 7.4, 1.35, 'Depth-aware routing', 'Each road is weighed by water depth against your vehicle.', { size: 16 });
  card(s, 0.6, 5.0, 7.4, 1.35, 'Relief centres with space', 'Open centres with live capacity, nearest first.', { size: 16 });
  s.addImage({ path: shots('map.png'), x: 9.1, y: 1.75, h: 4.9, w: 2.265 });
  source(s, 'Demo data: shelters and road depth are simulated.');
}

// 8. Live Vision + reports
{
  const s = base('Live Vision and citizen reports', 'Cameras and citizens as sensors.',
    'Sample cameras are AI-generated imagery. A posted report is checked by AI (Gemini 2.5 Flash), approved by an operator, then drawn as a 2 km crowd area on the map. In the demo the operator step is automatic and labelled.');
  card(s, 0.6, 2.0, 7.4, 2.0, 'Live Vision', 'AI reads the water level from river cameras every few seconds, with a calibrated warning and danger line.', { size: 16 });
  card(s, 0.6, 4.2, 7.4, 2.2, 'Citizen report, then a person', 'Photo, AI check, operator approval. A 2 km crowd area appears on the map for everyone nearby. One-tap family SOS.', { size: 16 });
  s.addImage({ path: shots('live-storm.png'), x: 9.1, y: 1.75, h: 4.9, w: 2.265 });
  source(s, 'Sample cameras are AI-generated imagery. The demo operator approval is automatic.');
}

// 9. Architecture
{
  const s = base('Architecture', 'Built to run on Huawei Cloud.',
    'Say "running" only for what runs on the day. Update the Status column the morning of 2 Nov. The app, the models and the datasets move to Huawei Cloud; sign-in and the AI photo check stay as they are.');
  const run = (t) => td(t, { bold: true, color: C.green });
  const plan = (t) => td(t, { bold: true, color: C.amber });
  table(s, [
    [th('Huawei Cloud service'), th('Job in FloodWay'), th('Status')],
    [td('ECS', { bold: true }), td('Runs the app, the API and Live Vision'), plan('Target: running before 3 Nov')],
    [td('OBS', { bold: true }), td('Stores the models, datasets and sample frames'), plan('Planned')],
    [td('SMN', { bold: true }), td('Alert email and SMS to family circles'), plan('Planned')],
    [td('ModelArts', { bold: true }), td('Hosts the flood-prone model as a service'), plan('Stretch')],
    [td('Also in use', { bold: true }), td('Firebase sign-in, Gemini photo check, OpenStreetMap, Telegram SOS'), run('Running')],
  ], { colW: [2.8, 6.2, 3.1], rowH: 0.75 });
  source(s, 'Update this table on 2 Nov so every "Running" is true on the day.');
}

// 10. Results
{
  const s = base('Results', 'What we measured, and how.',
    'Cut the old "100% vs 0% GPS" claim. The committee reruns our results, and a mismatch loses eligibility. Every row has a method and a source.');
  table(s, [
    [th('Claim'), th('Number'), th('How measured'), th('Source')],
    [td('Flood-prone ranking', { bold: true }), td('AUC 0.836', { bold: true }), td('Held-out 2020-21 floods'), td('Stage 5 repo')],
    [td('Flood avoidance in routing', { bold: true }), td('96%', { bold: true }), td('100 simulated Klang Valley scenarios (simulation, not field)'), td('Simulation')],
    [td('Water segmentation', { bold: true }), td('95.34% pixel accuracy', { bold: true }), td('Sen1Floods11 validation split (Prithvi-100M)'), td('Public benchmark')],
    [td('Routing time', { bold: true }), td('Under 120 ms', { bold: true }), td('Our routing engine'), td('Reproducible')],
  ], { colW: [3.2, 2.7, 4.2, 2.0], rowH: 0.8 });
  source(s, 'Simulated results are labelled as simulated.');
}

// 11. Impact
{
  const s = base('Impact', '90 minutes earlier. Everyone out.',
    'The Kampung Baru persona study. A scenario, not a field result.');
  card(s, 0.6, 2.0, 5.95, 3.6, 'Without FloodWay', 'No warning.\nThe roads out are already under water at 2:30 AM.', { fill: C.dangerBg, line: 'FCA5A5', accent: C.danger, size: 20 });
  card(s, 6.75, 2.0, 5.95, 3.6, 'With FloodWay', '1:00 AM: alert on the phone.\nA dry route to an open shelter, 4.2 minutes longer.\nEveryone is out before the water arrives.', { fill: C.greenBg, line: '86EFAC', accent: C.green, size: 20 });
  source(s, 'Scenario from the Kampung Baru persona study (simulated).');
}

// 12. Why we win
{
  const s = base('Why we win', 'We connect the agencies. We do not replace them.',
    'Prepared answer, notes only: against a tower-failure prediction entry, ours reaches residents, has hardware, and has a held-out-year result. Remove the RM 150k per station figure unless it is sourced.');
  const yes = (t) => td(t, { bold: true, color: C.green });
  const no = (t) => td(t, { color: C.mute });
  table(s, [
    [th('Capability'), th('MyPublicInfoBanjir'), th('Commercial GPS'), th('FloodWay')],
    [td('Rain and river context', { bold: true }), td('Yes'), no('No'), yes('Yes')],
    [td('Street-level water', { bold: true }), no('No'), no('No'), yes('Yes: sensor and camera')],
    [td('Flood-aware routing', { bold: true }), no('No'), no('Water-blind'), yes('Yes: depth-aware')],
    [td('Relief centre capacity', { bold: true }), no('No'), no('No'), yes('Yes: live beds')],
    [td('Hardware', { bold: true }), td('Government gauges'), no('None'), yes('Low-cost ESP32 node')],
  ], { colW: [3.6, 2.8, 2.4, 3.3], rowH: 0.75 });
  s.addText('JPS, JKM and JKR keep their roles. FloodWay joins them into one grid.', { x: 0.6, y: 6.5, w: 12.1, h: 0.5, fontFace: HEAD, fontSize: 20, bold: true, color: C.blue });
}

// 13. Market and Shah Alam
{
  const s = base('Market and first customer', 'Pilot in Shah Alam. Scale across the Klang Valley.',
    'Taman Sri Muda (Shah Alam) flooded in December 2021. Phase 1 is 10 nodes plus existing cameras. Node cost is a target (under RM 500), bill of materials to confirm. Source the USD 31.6B market figure or drop it.');
  card(s, 0.6, 1.95, 3.9, 2.25, 'Councils', 'MBSA, MBPJ, DBKL license the dashboard. Annual fee.', { size: 16, accent: C.blue });
  card(s, 4.7, 1.95, 3.9, 2.25, 'Logistics and insurers', 'Per-query routing API.', { size: 16, accent: C.amber });
  card(s, 8.8, 1.95, 3.9, 2.25, 'Citizens', 'Free app, funded by telco CSR.', { size: 16, accent: C.green });
  s.addShape('roundRect', { x: 0.6, y: 4.45, w: 12.1, h: 1.9, rectRadius: 0.12, fill: { color: C.sky }, line: { color: C.sky } });
  s.addText([
    { text: 'Pilot: ', options: { bold: true, color: C.blue } },
    { text: 'Taman Sri Muda, Shah Alam, and Kampung Baru, KL. Phase 1: 10 nodes plus existing cameras.', options: { breakLine: true } },
    { text: 'Cost: ', options: { bold: true, color: C.blue } },
    { text: 'target under RM 500 per node (bill of materials to confirm).', options: { breakLine: true } },
    { text: 'Ask: ', options: { bold: true, color: C.red } },
    { text: 'one council pilot and access to its cameras.', options: { bold: true } },
  ], { x: 0.85, y: 4.55, w: 11.6, h: 1.7, fontFace: BODY, fontSize: 18, color: C.navy, valign: 'middle', paraSpaceAfter: 6 });
}

// 14. Scorecard
{
  const s = base('Scorecard', 'How we meet the judging criteria.',
    'Weights are the Regional round: Innovation 40, Application value 35, Completeness 15, Presentation 10. Confirm with the organiser which rubric applies on 3 Nov.');
  table(s, [
    [th('Criterion'), th('Weight'), th('Our evidence')],
    [td('Innovation', { bold: true }), td('40%'), td('Four-factor fusion. Warns before the camera does. Citizens routed around water.')],
    [td('Application value', { bold: true }), td('35%'), td('RM 6.1B loss in Dec 2021. Low-cost node. Shah Alam pilot, then the Klang Valley.')],
    [td('Completeness and demo', { bold: true }), td('15%'), td('Live demo, README with reproduction steps, datasets and code, open source on GitHub.')],
    [td('Presentation and Q&A', { bold: true }), td('10%'), td('10-minute talk, 5-minute live demo, answers prepared for likely questions.')],
  ], { colW: [3.2, 1.3, 7.6], rowH: 0.85 });
  source(s, 'Weights: Regional Competition review criteria, Huawei ICT Competition 2026-27.');
}

// 15. Demo
{
  const s = base('Live demo', 'Five minutes, one phone.',
    'Fallbacks: the demo needs no internet (sample mode). Keep the Cloudflare link as backup. Press Play storm scenario, or open /live?demo=storm.');
  const steps = [
    ['Open Live', 'Four tiles, ring at Normal.'],
    ['Play storm scenario', 'MET warning, then the model rises. Fifteen seconds.'],
    ['Sensor rises', 'Pour water into the cup: the real sensor takes over (once connected).'],
    ['Leave now', 'The alert comes before the camera. Show the route on the map.'],
    ['Camera confirms', 'All four agree: Danger.'],
  ];
  steps.forEach(([a, b], i) => {
    const y = 1.95 + i * 0.95;
    s.addShape('ellipse', { x: 0.6, y, w: 0.7, h: 0.7, fill: { color: C.blue }, line: { color: C.blue } });
    s.addText(String(i + 1), { x: 0.6, y, w: 0.7, h: 0.7, fontFace: HEAD, fontSize: 22, bold: true, color: C.white, align: 'center', valign: 'middle' });
    s.addText(a, { x: 1.5, y: y - 0.02, w: 6.2, h: 0.4, fontFace: HEAD, fontSize: 21, bold: true, color: C.navy, valign: 'top' });
    s.addText(b, { x: 1.5, y: y + 0.36, w: 6.6, h: 0.45, fontFace: BODY, fontSize: 15, color: C.slate, valign: 'top' });
  });
  s.addImage({ path: shots('live-idle.png'), x: 8.5, y: 1.75, h: 4.9, w: 2.265 });
  s.addImage({ path: shots('live-storm.png'), x: 10.85, y: 1.75, h: 4.9, w: 2.265 });
}

const out = path.join(root, 'docs/team/FloodWay_Semifinal_Slides.local.pptx');
await pptx.writeFile({ fileName: out });
console.log(`wrote ${out} (${n} slides)`);
