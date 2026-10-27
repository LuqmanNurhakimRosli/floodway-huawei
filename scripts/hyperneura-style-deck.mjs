// Builds the FloodWay semi-final pitch deck in the same structure and visual language as the HyperNeura reference deck
// (white slides, slate + teal two-tone wordmark, teal bands, photo halves, persona before/after, teal-vs-pink table).
// Assets live in docs/team/slide-assets/deck/ (git-ignored: third-party logos, news photos, team photos).
// Run from the repo root:  node scripts/hyperneura-style-deck.mjs  (needs: cd scripts/pptx-tool && npm install)
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PptxGenJS = createRequire(path.join(root, 'scripts/pptx-tool/'))('pptxgenjs');
const A = (f) => path.join(root, 'docs/team/slide-assets/deck', f);
const SHOT = (f) => path.join(root, 'docs/team/slide-assets', f);

const C = {
  dark: '37474F', teal: '1B95AE', band: 'A9D4DE', pale: 'E7F4F7', pink: 'FCE4E6', pinkText: 'C62828',
  thank: '7DC7D5', red: 'E53935', huawei: 'C7000B', ink: '263238', grey: '546E7A', light: 'ECEFF1', white: 'FFFFFF',
  green: '2E7D32', amber: 'F9A825', orange: 'EF6C00', danger: 'C62828', water: '4FC3F7',
};
const F = 'Segoe UI';
const FB = 'Segoe UI Semibold';
const noLine = { color: C.white, width: 0, transparency: 100 };

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 in, same 16:9 as the reference
pptx.title = 'FloodWay pitch deck';

const t = (s, text, x, y, w, h, o = {}) => s.addText(text, {
  x, y, w, h, fontFace: o.bold ? FB : F, fontSize: o.size ?? 16, bold: o.bold ?? false, italic: o.italic ?? false,
  color: o.color ?? C.ink, align: o.align ?? 'left', valign: o.valign ?? 'top', margin: 0, lineSpacingMultiple: o.ls ?? 1.0, fit: o.fit,
});
// Two-tone wordmark: "Flood" slate, "Way" teal, like "Hyper" + "Neura".
const mark = (s, x, y, size, w = 8, align = 'left') => s.addText([
  { text: 'Flood', options: { color: C.dark } }, { text: 'Way', options: { color: C.teal } },
], { x, y, w, h: size / 52, fontFace: FB, fontSize: size, bold: true, margin: 0, align });
// Title with the last word in teal, like "Experimental Result", "Market Opportunity".
const title2 = (s, a, b, y = 0.55, size = 34, x = 0.6, w = 12.1, align = 'center') => s.addText([
  { text: a + ' ', options: { color: C.dark } }, { text: b, options: { color: C.teal } },
], { x, y, w, h: 0.8, fontFace: FB, fontSize: size, bold: true, margin: 0, align });
// Top-right brand lock-up on every inner slide: wordmark + Huawei ICT Academy laurel.
function brand(s) {
  mark(s, 9.9, 0.27, 20, 2.3, 'right');
  s.addImage({ path: A('huawei-ict.png'), x: 12.3, y: 0.12, w: 0.72, h: 0.72 });
}
const img = (s, f, x, y, w, h, type = 'cover', o = {}) => s.addImage({ path: f, x, y, w, h, sizing: { type, w, h }, ...o });
const box = (s, x, y, w, h, color, o = {}) => s.addShape(o.round ? 'roundRect' : 'rect', { x, y, w, h, rectRadius: o.round, fill: { color, transparency: o.tr ?? 0 }, line: o.line ? { color: o.line, width: o.lw ?? 1.5 } : noLine });
const pill = (s, text, x, y, w, color, h = 0.42, size = 13) => { box(s, x, y, w, h, color, { round: h / 2 }); t(s, text, x, y, w, h, { size, bold: true, color: C.white, align: 'center', valign: 'middle' }); };
const arrow = (s, x, y, w, h, o = {}) => s.addShape('line', { x, y, w, h, flipH: o.flipH, flipV: o.flipV, line: { color: o.color ?? C.dark, width: 1.75, endArrowType: 'triangle' } });
// Arrow from (x1,y1) to (x2,y2): PowerPoint lines need a positive box, so flip it instead.
const arrowTo = (s, x1, y1, x2, y2, color = C.dark) => s.addShape('line', { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1), flipH: x2 < x1, flipV: y2 < y1, line: { color, width: 1.75, endArrowType: 'triangle' } });
const notes = (s, n) => s.addNotes(n);
const slide = () => { const s = pptx.addSlide(); s.background = { color: C.white }; return s; };

// Small drawn icons (teal line style, like the reference's icon row).
function icon(s, kind, x, y, sz = 1.0) {
  const L = { color: C.teal, width: 2.5 };
  const sh = (type, o) => s.addShape(type, { line: L, fill: { color: C.white, transparency: 100 }, ...o });
  if (kind === 'fusion') { // four dots into one
    [[0, 0], [0.7, 0], [0, 0.7], [0.7, 0.7]].forEach(([dx, dy]) => sh('ellipse', { x: x + dx * sz, y: y + dy * sz, w: 0.28 * sz, h: 0.28 * sz }));
    sh('ellipse', { x: x + 0.27 * sz, y: y + 0.27 * sz, w: 0.44 * sz, h: 0.44 * sz });
  }
  if (kind === 'camera') { sh('roundRect', { x, y: y + 0.2 * sz, w: 0.75 * sz, h: 0.5 * sz, rectRadius: 0.08 }); sh('ellipse', { x: x + 0.22 * sz, y: y + 0.29 * sz, w: 0.32 * sz, h: 0.32 * sz }); sh('triangle', { x: x + 0.75 * sz, y: y + 0.27 * sz, w: 0.25 * sz, h: 0.36 * sz, rotate: 90 }); }
  if (kind === 'route') { sh('ellipse', { x, y: y + 0.6 * sz, w: 0.25 * sz, h: 0.25 * sz }); sh('ellipse', { x: x + 0.72 * sz, y, w: 0.25 * sz, h: 0.25 * sz }); s.addShape('line', { x: x + 0.2 * sz, y: y + 0.2 * sz, w: 0.55 * sz, h: 0.45 * sz, flipV: true, line: { ...L, dashType: 'dash' } }); }
  if (kind === 'people') { sh('ellipse', { x: x + 0.12 * sz, y, w: 0.32 * sz, h: 0.32 * sz }); sh('ellipse', { x: x + 0.52 * sz, y, w: 0.32 * sz, h: 0.32 * sz }); sh('roundRect', { x, y: y + 0.4 * sz, w: 0.95 * sz, h: 0.45 * sz, rectRadius: 0.2 }); }
}

// ===== 1. Title (photo left, logos pill, wordmark, tagline, team, teal band) =====
{
  const s = slide();
  notes(s, 'Open with the picture: "This was Shah Alam in December 2021. People woke up at 1 AM with water inside the house. Nobody had warned their street." Then introduce FloodWay and the team in 20 seconds.');
  img(s, A('flood-cars.jpg'), 0, 0, 5.3, 7.5);
  box(s, 0.25, 0.25, 3.7, 0.95, C.white, { round: 0.47 });
  img(s, A('uitm.png'), 0.45, 0.33, 1.4, 0.79, 'contain');
  img(s, A('huawei-ict.png'), 1.95, 0.3, 0.85, 0.85, 'contain');
  box(s, 2.95, 0.37, 0.7, 0.7, 'FD9D24'); t(s, '11', 2.95, 0.37, 0.7, 0.4, { size: 16, bold: true, color: C.white, align: 'center', valign: 'middle' }); t(s, 'CITIES', 2.95, 0.75, 0.7, 0.25, { size: 7, bold: true, color: C.white, align: 'center' });
  box(s, 3.72, 0.37, 0.0001, 0.0001, C.white);
  mark(s, 5.75, 0.95, 66, 7.3);
  s.addText([{ text: 'Powered by ', options: { color: C.dark } }, { text: 'Huawei Technology', options: { color: C.huawei } }],
    { x: 6.95, y: 2.2, w: 6, h: 0.45, fontFace: FB, fontSize: 22, bold: true, margin: 0 });
  t(s, 'Know Before It Floods\nMove Before It Rises', 5.8, 3.0, 7.2, 1.3, { size: 32, color: C.ink, ls: 1.05 });
  t(s, 'Warning the street, not the region\nShowing the way out, not just the alert', 5.8, 4.35, 7, 0.75, { size: 15, italic: true, color: C.grey });
  const team = [['azliza.png', 'Dr Azliza'], ['luqman.png', 'Luqman'], ['nadyie.png', 'Nadyie'], ['batrisyia.png', 'Batrisyia']];
  team.forEach(([f, name], i) => {
    const x = 5.9 + i * 1.65 + (i > 0 ? 0.35 : 0);
    img(s, A(f), x, 5.15, 1.25, 1.25, 'contain');
    t(s, name, x - 0.2, 6.43, 1.65, 0.3, { size: 12, align: 'center', color: C.ink });
  });
  box(s, 7.45, 5.3, 0.06, 1.0, C.dark);
  box(s, 5.3, 6.85, 8.03, 0.65, C.teal);
  t(s, 'FloodWay Team  |  AI Flood Early Warning', 5.3, 6.85, 8.03, 0.65, { size: 16, bold: true, color: C.white, align: 'center', valign: 'middle' });
}

// ===== 2. Problem (big statement, stats, photo right, red band) =====
{
  const s = slide();
  notes(s, '45 seconds. Read the question, pause, then the three facts. Selangor and Kuala Lumpur, 17 to 18 December 2021. The band at the bottom is the problem in one sentence: warnings exist, but they are for a region, not your street, and they do not tell you which road is safe.');
  img(s, A('flood-rescue.jpg'), 8.0, 0, 5.33, 7.5);
  box(s, 0, 0, 8.0, 7.5, C.white);
  mark(s, 0.6, 0.27, 20, 3);
  s.addImage({ path: A('huawei-ict.png'), x: 2.7, y: 0.12, w: 0.72, h: 0.72 });
  box(s, 0.55, 0.95, 12.2, 1.25, C.white, { tr: 15 });
  t(s, 'Imagine waking at 1 AM to water at your door.', 0.6, 1.0, 12.1, 1.2, { size: 38, bold: true, color: C.dark, align: 'center', valign: 'middle' });
  const facts = [['380 mm', ' of rain fell in 24 hours on 17-18 December 2021.'], ['125,000', ' people were displaced across Selangor and Kuala Lumpur.'], ['RM 6.1 billion', ' in losses from one flood event.']];
  facts.forEach(([b, rest], i) => s.addText([{ text: b, options: { bold: true, fontFace: FB, color: C.ink } }, { text: rest, options: { color: C.ink } }],
    { x: 0.8, y: 2.55 + i * 1.25, w: 6.8, h: 1.0, fontFace: F, fontSize: 26, margin: 0, valign: 'top' }));
  t(s, 'Sources: The Guardian; DOSM. Photo: Malaysia Gazette.', 0.8, 6.3, 7, 0.3, { size: 11, italic: true, color: C.grey });
  box(s, 0, 6.7, 13.33, 0.8, 'F26B6B', { tr: 8 });
  t(s, 'Warnings cover a whole region. They never say which street floods, or which road is safe.', 0.4, 6.7, 12.5, 0.8, { size: 22, bold: true, color: C.white, valign: 'middle' });
}

// ===== 3. Statement slide (big text left, news-photo card right) =====
{
  const s = slide();
  notes(s, '20 seconds. One sentence, one picture. This is why it matters now: the drains were built for less rain than we get today, and the cost of one night was RM 6.1 billion.');
  mark(s, 0.4, 0.27, 20, 3); s.addImage({ path: A('huawei-ict.png'), x: 2.5, y: 0.12, w: 0.72, h: 0.72 });
  t(s, 'Our drains were built for less rain than we get today.', 0.7, 1.15, 6.4, 4.8, { size: 46, bold: true, color: C.dark, ls: 1.0, valign: 'top' });
  t(s, 'One night in December 2021 cost Malaysia RM 6.1 billion.', 0.7, 5.6, 6.2, 0.8, { size: 18, color: C.teal, bold: true });
  t(s, 'Source: DOSM 2022', 0.7, 6.45, 4, 0.3, { size: 12, italic: true, color: C.grey });
  box(s, 7.5, 0.45, 5.4, 6.6, C.white, { line: 'CFD8DC', lw: 1 });
  box(s, 7.75, 0.62, 0.32, 0.32, C.teal, { round: 0.16 });
  t(s, 'Floods in Malaysia', 8.18, 0.62, 3.5, 0.32, { size: 12, bold: true, color: C.ink, valign: 'middle' });
  img(s, A('flood-houses.jpg'), 7.5, 1.1, 5.4, 4.05);
  box(s, 7.5, 5.15, 5.4, 1.9, '0B2530');
  t(s, 'Streets turned into rivers in hours.\nResidents were rescued by boat.', 7.75, 5.3, 5.0, 1.2, { size: 20, bold: true, color: C.white, ls: 1.05 });
  t(s, 'Photo: news media', 7.75, 6.6, 3, 0.3, { size: 10, italic: true, color: 'B0BEC5' });
}

// ===== 4. Our Innovation (teal band with four features + icons, IW2035 + SDG) =====
{
  const s = slide();
  notes(s, '45 seconds. One line, then four features left to right. Four-source fusion is the innovation: no single source is trusted alone. Live Vision reads river and drain cameras. Safe routing avoids flooded roads. Citizen reports are checked by AI, then approved by a person.');
  brand(s);
  title2(s, 'Our Innovation:', 'FloodWay', 0.95, 40);
  t(s, 'An AI flood early-warning system that fuses four sources into one street-level warning, then routes you to safety.', 0.6, 1.85, 12.1, 0.45, { size: 15, color: C.grey, align: 'center' });
  box(s, 0, 2.55, 10.6, 0.65, C.band);
  const feats = [
    ['Four-Source Fusion', 'fusion', [['Combines ', 0], ['flood history, MET rain, IoT water sensor and CCTV', 1], [' into one warning.', 0]]],
    ['Live Vision', 'camera', [['Reads the ', 0], ['water level', 1], [' from existing river and drain cameras every few seconds.', 0]]],
    ['Safe Routing', 'route', [['Drives you to the ', 0], ['nearest open relief centre', 1], [', around flooded roads.', 0]]],
    ['Citizen Reports', 'people', [['Photo checked by ', 0], ['AI, then a person', 1], ['. A 2 km area appears for everyone nearby.', 0]]],
  ];
  feats.forEach(([name, ic, body], i) => {
    const x = 0.25 + i * 2.6;
    t(s, name, x, 2.55, 2.5, 0.65, { size: 15, bold: true, color: C.ink, align: 'center', valign: 'middle' });
    icon(s, ic, x + 0.8, 3.55, 1.0);
    s.addText(body.map(([txt, b]) => ({ text: txt, options: { bold: !!b, fontFace: b ? FB : F } })),
      { x: x + 0.1, y: 4.75, w: 2.3, h: 1.6, fontFace: F, fontSize: 14, color: C.ink, align: 'center', valign: 'top', margin: 0 });
  });
  img(s, A('iw2035.png'), 10.7, 2.4, 2.5, 2.04, 'contain');
  box(s, 10.75, 5.0, 2.35, 1.45, C.white, { line: 'CFD8DC', lw: 1 });
  t(s, 'SUSTAINABLE\nDEVELOPMENT GOALS', 10.85, 5.07, 2.2, 0.55, { size: 10, bold: true, color: C.teal });
  box(s, 10.85, 5.65, 1.0, 0.72, 'FD9D24'); t(s, '11 Sustainable cities', 10.88, 5.68, 0.95, 0.66, { size: 9, bold: true, color: C.white });
  box(s, 11.95, 5.65, 1.05, 0.72, '3F7E44'); t(s, '13 Climate action', 11.98, 5.68, 1.0, 0.66, { size: 9, bold: true, color: C.white });
}

// ===== 5. Product hero (render left, wordmark, gradient) =====
{
  const s = pptx.addSlide();
  s.background = { color: 'EEF6FA' };
  notes(s, '10 seconds. Let the picture breathe. "This is the FloodWay river node. It watches one drain, and it talks to Huawei Cloud." The enclosure is a concept render; the bench prototype is on the next slide.');
  box(s, 6.6, 0, 6.73, 7.5, 'E3EEFA');
  brand(s);
  img(s, A('node-front.jpg'), 0.5, 0.6, 4.4, 6.35, 'contain');
  mark(s, 5.4, 2.85, 72, 7.6);
  s.addText([{ text: 'Powered by ', options: { color: C.dark } }, { text: 'Huawei Technology', options: { color: C.huawei } }],
    { x: 6.75, y: 4.2, w: 6, h: 0.5, fontFace: FB, fontSize: 24, bold: true, margin: 0 });
  t(s, 'RiverNode N-01, concept design', 6.75, 4.85, 6, 0.4, { size: 14, italic: true, color: C.grey });
}

// ===== 6. Prototype hardware components =====
{
  const s = slide();
  notes(s, '30 seconds. Nadyie built the bench prototype: an ESP32, an HC-SR04 ultrasonic sensor that measures the distance to the water, a 20x4 LCD, three LEDs and a buzzer that sounds at Danger. It sends readings over Wi-Fi to the FloodWay API. The solar enclosure on the left is a concept render for the field version, not built yet.');
  img(s, A('node-insitu.jpg'), 0, 0, 5.4, 7.5);
  t(s, 'Field version: concept render', 0.25, 7.08, 5, 0.3, { size: 11, italic: true, color: C.white });
  brand(s);
  t(s, 'Prototype', 5.9, 1.05, 6, 0.75, { size: 36, bold: true, color: C.teal });
  t(s, 'Hardware Component', 5.9, 1.8, 6, 0.5, { size: 22, bold: true, color: C.dark });
  box(s, 5.9, 2.5, 7.0, 4.2, C.white, { line: C.teal, lw: 2 });
  const parts = [
    [A('esp32.png'), 'ESP32', 225 / 160], [A('part-ultrasonic.jpg'), 'HC-SR04 Ultrasonic', 150 / 75], [A('lcd.png'), '20x4 LCD (I2C)', 289 / 126], [null, '3 LEDs', 1],
    [A('buzzer.png'), 'Buzzer', 234 / 180], [null, 'Wi-Fi to API', 1], [null, 'CCTV (existing)', 1], [SHOT('live-idle.png'), 'Phone app', 780 / 1688],
  ];
  parts.forEach(([f, name, ar], i) => {
    const cx = 6.0 + (i % 4) * 1.72, cy = 2.7 + Math.floor(i / 4) * 2.0, W = 1.5, H = 1.15;
    if (f) img(s, f, cx + 0.05, cy, W - 0.1, H, 'contain');
    else if (name === '3 LEDs') ['43A047', 'FBC02D', 'E53935'].forEach((c, k) => s.addShape('ellipse', { x: cx + 0.2 + k * 0.4, y: cy + 0.35, w: 0.32, h: 0.32, fill: { color: c }, line: noLine }));
    else if (name === 'Wi-Fi to API') [0.9, 0.62, 0.34].forEach((d) => s.addShape('arc', { x: cx + 0.75 - d / 2, y: cy + 0.2 + (0.9 - d) / 2, w: d, h: d, angleRange: [225, 315], line: { color: C.teal, width: 3 }, fill: { color: C.white, transparency: 100 } }));
    else icon(s, 'camera', cx + 0.3, cy + 0.15, 0.9);
    t(s, name, cx - 0.05, cy + 1.25, 1.6, 0.45, { size: 12, bold: true, color: C.ink, align: 'center' });
  });
  t(s, 'Bench prototype built and tested by Nadyie. Danger when water passes 66% of the bank.', 5.9, 6.85, 7.1, 0.3, { size: 11, italic: true, color: C.grey });
}

// ===== 7. How we build the flood-prone model (pipeline diagram) =====
{
  const s = slide();
  notes(s, '40 seconds. Batrisyia built the flood-prone model. Inputs: past flood reports with their location and date, rainfall over the 1, 3 and 7 days before (ERA5), and terrain: elevation and slope (Copernicus DEM). She compared five model families. Today it runs in Python; storing the dataset in Huawei OBS and serving the model on ModelArts are planned.');
  brand(s);
  title2(s, 'How we build', 'FloodWay?', 0.85, 34, 0.6, 12.1);
  t(s, 'Flood-Prone Place Model Development', 0.6, 1.65, 8, 0.4, { size: 17, italic: true, bold: true, color: C.dark });
  box(s, 0.6, 2.2, 12.1, 4.75, C.white, { line: C.dark, lw: 1.5 });
  const steps = [['Past flood reports\n2015-2021', A('dataset.png')], ['Rainfall\n1, 3, 7-day (ERA5)', null], ['Terrain\nelevation, slope (DEM)', null]];
  steps.forEach(([label, f], i) => {
    const x = 0.95 + i * 2.25;
    if (f) img(s, f, x + 0.45, 3.4, 0.9, 0.9, 'contain');
    else if (i === 1) { s.addShape('cloud', { x: x + 0.3, y: 3.45, w: 1.2, h: 0.75, fill: { color: '90A4AE' }, line: noLine }); [0, 1, 2, 3].forEach((k) => s.addShape('line', { x: x + 0.5 + k * 0.22, y: 4.25, w: 0.06, h: 0.25, line: { color: '1E88E5', width: 2 } })); }
    else { s.addShape('triangle', { x: x + 0.3, y: 3.5, w: 1.2, h: 0.85, fill: { color: '81C784' }, line: noLine }); s.addShape('triangle', { x: x + 0.85, y: 3.75, w: 0.8, h: 0.6, fill: { color: '4CAF50' }, line: noLine }); }
    t(s, label, x, 4.55, 1.8, 0.8, { size: 13, bold: true, color: C.ink, align: 'center' });
    if (i < 2) arrow(s, x + 1.8, 3.9, 0.4, 0);
  });
  s.addShape('line', { x: 7.6, y: 3.9, w: 0.45, h: 0, line: { color: C.dark, width: 1.75 } });
  s.addShape('line', { x: 8.05, y: 2.75, w: 0, h: 3.1, line: { color: C.dark, width: 1.75 } });
  const outs = [[A('obs.png'), 400 / 235, 'Store Dataset', 'Huawei OBS', 'PLANNED'], [null, 1, 'Model Development', '5 model families compared', 'DONE'], [A('modelarts.png'), 1, 'Model Deployment', 'Huawei ModelArts', 'PLANNED']];
  outs.forEach(([f, ar, a, b, st], i) => {
    const y = 2.4 + i * 1.5;
    arrow(s, 8.05, y + 0.35, 0.5, 0);
    if (f) img(s, f, 8.7, y, 0.95, 0.7, 'contain');
    else { box(s, 8.75, y + 0.02, 0.85, 0.66, C.teal, { round: 0.1 }); t(s, 'ML', 8.75, y + 0.02, 0.85, 0.66, { size: 18, bold: true, color: C.white, align: 'center', valign: 'middle' }); }
    t(s, a, 9.85, y, 2.6, 0.35, { size: 15, bold: true, color: C.ink });
    t(s, b, 9.85, y + 0.36, 2.7, 0.3, { size: 13, color: C.grey });
    pill(s, st, 9.85, y + 0.75, st === 'DONE' ? 0.9 : 1.15, st === 'DONE' ? C.green : 'F9A825', 0.3, 10);
  });
}

// ===== 8. System architecture =====
{
  const s = slide();
  notes(s, '45 seconds. Two flows. Sense to warn: the ultrasonic sensor and the ESP32 send water depth, the cameras send frames, MET sends rain. On Huawei Cloud an ECS server runs the API, the vision reader and the fusion rule. Warn to act: the node lights its LED and buzzer, the phone shows the level and the route, and alerts go out. Be honest: ECS is the target before 3 November, OBS and SMN are planned. Also in use today: Firebase sign-in, Gemini photo check, OpenStreetMap.');
  brand(s);
  t(s, 'System Architecture', 0.6, 0.75, 12.1, 0.75, { size: 34, bold: true, color: C.dark, align: 'center' });
  box(s, 0.5, 1.65, 12.3, 5.4, C.white, { line: C.dark, lw: 1.5 });
  // inputs
  img(s, A('part-ultrasonic.jpg'), 0.75, 1.95, 1.2, 0.6, 'contain'); t(s, 'HC-SR04 water depth', 0.6, 2.6, 1.6, 0.3, { size: 11, align: 'center' });
  img(s, A('esp32.png'), 0.85, 3.05, 1.0, 0.71, 'contain'); t(s, 'ESP32 node', 0.6, 3.8, 1.5, 0.3, { size: 12, bold: true, align: 'center' });
  img(s, A('cctv-road.jpg'), 0.7, 4.4, 1.35, 0.85, 'cover'); t(s, 'CCTV frames', 0.6, 5.3, 1.5, 0.3, { size: 12, bold: true, align: 'center' });
  s.addShape('cloud', { x: 0.85, y: 5.75, w: 1.05, h: 0.6, fill: { color: '90A4AE' }, line: noLine }); t(s, 'MET rain', 0.6, 6.4, 1.5, 0.3, { size: 12, bold: true, align: 'center' });
  [3.4, 4.85, 6.05].forEach((y) => arrowTo(s, 2.15, y, 3.35, 4.1));
  pill(s, 'Sense to Warn', 3.1, 1.95, 2.2, '29B6F6', 0.42, 14);
  // cloud core
  box(s, 3.4, 2.55, 4.6, 3.85, 'FFF5F5', { round: 0.2, line: C.huawei, lw: 1.5 });
  img(s, A('huawei.png'), 4.85, 2.65, 1.7, 0.68, 'contain');
  box(s, 3.7, 3.45, 4.0, 0.95, C.white, { round: 0.47, line: '90A4AE', lw: 1.25 });
  img(s, A('ecs.png'), 3.85, 3.56, 0.72, 0.72, 'contain');
  t(s, 'Hosted on Huawei ECS', 4.7, 3.5, 2.9, 0.42, { size: 15, bold: true, color: C.ink, valign: 'middle' });
  pill(s, 'TARGET: running before 3 Nov', 4.7, 3.93, 2.8, 'F9A825', 0.36, 10);
  t(s, 'FastAPI  +  Live Vision water reader\n+  four-factor fusion rule', 3.7, 4.55, 4.0, 0.7, { size: 13, color: C.ink, align: 'center' });
  img(s, A('obs.png'), 3.8, 5.35, 0.75, 0.44, 'contain'); t(s, 'OBS: frames, models (planned)', 4.6, 5.38, 3.3, 0.4, { size: 11, color: C.grey, valign: 'middle' });
  t(s, 'SMN: SMS and email alerts (planned)', 3.8, 5.85, 4.1, 0.4, { size: 11, color: C.grey, valign: 'middle' });
  // outputs
  [3.1, 4.55, 6.0].forEach((y) => arrowTo(s, 8.05, 4.45, 9.15, y));
  pill(s, 'Warn to Act', 9.2, 1.95, 1.9, '29B6F6', 0.42, 14);
  const outs = [['Node: LCD, LEDs, buzzer', 'Local siren at Danger'], ['Phone: level + safe route', 'Nearest open relief centre'], ['Family and area alerts', 'Telegram today, SMS planned']];
  outs.forEach(([a, b], i) => {
    const y = 2.55 + i * 1.45;
    box(s, 9.2, y, 3.4, 1.1, C.pale, { round: 0.15 });
    t(s, a, 9.35, y + 0.15, 3.15, 0.4, { size: 14, bold: true, color: C.ink });
    t(s, b, 9.35, y + 0.58, 3.15, 0.35, { size: 12, color: C.grey });
  });
  t(s, 'Also in use today: Firebase sign-in, Gemini photo check, OpenStreetMap maps.', 0.6, 7.1, 9, 0.3, { size: 11, italic: true, color: C.grey });
}

// ===== 9. Experimental result =====
{
  const s = slide();
  notes(s, '40 seconds. Trained on flood reports up to 2019, tested on 170 places from 2020 and 2021 it never saw. The logistic regression scored ROC-AUC 0.836, 95 percent interval 0.777 to 0.892. All 17 places it ranked highest were real flood sites. It is a relative score, not a probability, so in the fusion rule it can only raise Advisory on its own.');
  brand(s);
  title2(s, 'Experimental', 'Result', 0.9, 36);
  t(s, '0.836', 1.3, 2.2, 3.6, 1.2, { size: 72, bold: true, color: C.teal, align: 'center' });
  t(s, 'ROC-AUC', 1.3, 3.4, 3.6, 0.45, { size: 20, bold: true, color: C.ink, align: 'center' });
  t(s, '95% interval 0.777 to 0.892', 1.3, 3.85, 3.6, 0.35, { size: 13, color: C.grey, align: 'center' });
  box(s, 5.1, 2.25, 0.06, 1.9, C.ink);
  [['170', 'held-out test places'], ['17 / 17', 'top-ranked were real floods'], ['5', 'model families compared']].forEach(([a, b], i) => {
    t(s, a, 5.4 + i * 2.55, 2.35, 2.4, 0.9, { size: 46, bold: true, color: C.ink, align: 'center' });
    t(s, b, 5.4 + i * 2.55, 3.3, 2.4, 0.6, { size: 15, color: C.ink, align: 'center' });
  });
  t(s, 'Dataset contains :', 0.6, 4.75, 12.1, 0.4, { size: 17, color: C.ink, align: 'center' });
  [['Flood Reports 2015-2021', '0D47A1'], ['ERA5 Rainfall', '1565C0'], ['Copernicus DEM Terrain', '1E88E5']].forEach(([a, c], i) => pill(s, a, 2.35 + i * 2.95, 5.3, 2.75, c, 0.7, 15));
  t(s, 'Train up to 2019, test on 2020-2021. A relative score, not a probability: it never raises Danger alone.', 0.6, 6.5, 12.1, 0.35, { size: 12, italic: true, color: C.grey, align: 'center' });
}

// ===== 10. Demonstration (dark) =====
{
  const s = slide();
  notes(s, 'Switch to the phone for 5 minutes. 0:00 /live, press Play storm scenario: in 15 seconds the four tiles go amber then red and Kampung Baru turns Danger. 2:00 Map: the route drives to the nearest open relief centre in 8 seconds. 3:30 Reports: post a photo, AI check, operator approval, 2 km area. Say: cameras are AI-generated samples; rain and sensor numbers are demo values until those feeds connect.');
  s.addText([{ text: 'FloodWay ', options: { color: C.dark } }, { text: 'Demonstration', options: { color: C.teal } }], { x: 0.6, y: 0.2, w: 9, h: 0.7, fontFace: FB, fontSize: 34, bold: true, margin: 0 });
  brand(s);
  img(s, A('demo-bg.jpg'), 0.75, 1.05, 11.83, 6.15, 'cover', { rounding: false });
  s.addText([{ text: 'Flood', options: { color: C.white } }, { text: 'Way', options: { color: '4DD0E1' } }], { x: 0.75, y: 3.3, w: 11.83, h: 1.0, fontFace: FB, fontSize: 60, bold: true, align: 'center', margin: 0 });
  t(s, 'Know Before It Floods, Move Before It Rises.', 0.75, 4.35, 11.83, 0.45, { size: 18, bold: true, color: C.white, align: 'center' });
  t(s, 'Storm (2 min)   |   Safe route (1.5 min)   |   Citizen report (1.5 min)', 0.75, 5.3, 11.83, 0.4, { size: 14, color: 'CFD8DC', align: 'center' });
}

// ===== 11-12. Personas: before / with =====
function persona(name, role, beforeImg, beforeText, withImg, withText, notesText, withIsPhone) {
  const s = slide();
  notes(s, notesText);
  brand(s);
  t(s, 'Making Every Rainy Night', 0.6, 0.85, 7.95, 0.75, { size: 34, bold: true, color: C.dark, align: 'right', valign: 'middle' });
  s.addText('Safe', { x: 8.7, y: 0.85, w: 1.35, h: 0.75, fontFace: FB, fontSize: 34, bold: true, color: C.teal, align: 'center', valign: 'middle', margin: 0, line: { color: C.teal, width: 2.5 } });
  img(s, beforeImg, 0.45, 2.0, 2.9, 4.95);
  box(s, 3.6, 2.0, 3.0, 4.95, 'DFE3E6');
  box(s, 6.6, 2.0, 3.0, 4.95, C.teal);
  s.addShape('ellipse', { x: 3.7, y: 1.55, w: 1.15, h: 1.15, fill: { color: C.dark }, line: { color: C.white, width: 3 } });
  t(s, name[0], 3.7, 1.55, 1.15, 1.15, { size: 38, bold: true, color: C.white, align: 'center', valign: 'middle' });
  t(s, name + ',', 4.95, 2.15, 1.6, 0.45, { size: 17, color: C.ink, valign: 'middle' });
  t(s, role, 6.75, 2.15, 2.8, 0.45, { size: 17, color: C.white, valign: 'middle' });
  t(s, 'Before\nFloodWay', 3.85, 2.95, 2.6, 0.85, { size: 17, bold: true, color: C.ink });
  t(s, beforeText, 3.85, 4.0, 2.6, 2.8, { size: 15, color: C.ink });
  t(s, 'With\nFloodWay', 6.85, 2.95, 2.6, 0.85, { size: 17, bold: true, color: C.white });
  t(s, withText, 6.85, 4.0, 2.6, 2.8, { size: 15, color: C.white });
  if (withIsPhone) { box(s, 9.85, 2.0, 3.0, 4.95, C.pale); img(s, withImg, 10.2, 2.1, 2.3, 4.75, 'contain'); }
  else img(s, withImg, 9.85, 2.0, 3.0, 4.95);
  t(s, 'Illustrative persona. Photos: news media; app screen from the FloodWay demo.', 0.45, 7.05, 10, 0.3, { size: 10, italic: true, color: C.grey });
}
persona('Aiman', 'Delivery Rider', A('cctv-road.jpg'),
  'GPS sends him through an underpass. The road is already under water. He turns back in the dark.',
  SHOT('map.png'), 'The map routes him around the flooded road, to the nearest open relief centre.',
  '30 seconds. Aiman rides for a living. Before: the navigation app does not know the underpass is flooded. With FloodWay: the route already avoids it. This is the Map screen you will see in the demo.', true);
persona('Mak Ton', 'Shah Alam Resident', A('flood-cars.jpg'),
  'Wakes at 1 AM. Water is at the door, the car is gone. The warning was for the whole state.',
  SHOT('live-storm.png'), 'Her street turns Danger hours earlier. She moves the car and leaves with the family.',
  '30 seconds. Mak Ton lives in Taman Sri Muda. Before: a state-wide warning that did not say her street. With FloodWay: the drain camera, the water sensor and the rain agree, her street turns Danger, and she has time to leave. This is the Live screen at the end of the storm scenario.', true);

// ===== 13. Why we win (teal vs pink table) =====
{
  const s = slide();
  notes(s, '30 seconds. Read the FloodWay column, then point at the right column. Existing tools each do one thing: telemetry measures fixed points, weather apps give rain, navigation does not know about floods. The node cost is a target, the bill of materials is not final.');
  brand(s);
  s.addText([{ text: 'Why We ', options: { color: C.dark } }, { text: 'Win?', options: { color: C.teal } }], { x: 0.6, y: 0.55, w: 8, h: 0.75, fontFace: FB, fontSize: 34, margin: 0, align: 'center' });
  const head = (x, fill, color) => ({ text: x, options: { bold: true, fontFace: FB, fontSize: 18, color, fill: { color: fill }, align: 'center' } });
  const feat = (x) => ({ text: x, options: { fontFace: F, fontSize: 13, color: C.ink, align: 'center', fill: { color: C.white } } });
  const yes = (x = 'Yes') => ({ text: '✓ ' + x, options: { fontFace: F, fontSize: 15, color: C.white, fill: { color: '1592A8' }, align: 'center' } });
  const them = (x, ok = false) => ({ text: (ok ? '✓ ' : '') + x, options: { fontFace: F, fontSize: 15, color: ok ? C.ink : C.pinkText, fill: { color: C.pink }, align: 'center' } });
  s.addTable([
    [head('Feature', C.white, C.ink), head('FloodWay', '1592A8', C.white), head('Existing Tools', C.pink, '9E9E9E')],
    [feat('Warning for your street'), yes(), them('Region-wide alerts')],
    [feat('Fuses model, rain, sensor and camera'), yes(), them('One source each')],
    [feat('Reads water from existing CCTV'), yes(), them('✗ No')],
    [feat('Routes around flooded roads'), yes(), them('Navigation is not flood-aware')],
    [feat('Citizen reports checked by AI and a person'), yes(), them('Unverified social posts')],
    [{ text: 'Sensor node (target)', options: { fontFace: FB, bold: true, fontSize: 13, color: C.ink, align: 'center' } }, { text: 'Under RM 500', options: { fontFace: FB, bold: true, fontSize: 15, color: C.white, fill: { color: '1592A8' }, align: 'center' } }, { text: 'Fixed telemetry stations', options: { fontFace: FB, bold: true, fontSize: 15, color: C.pinkText, fill: { color: C.pink }, align: 'center' } }],
  ], { x: 0.6, y: 1.5, w: 9.0, colW: [3.0, 3.0, 3.0], rowH: 0.75, border: { type: 'solid', color: C.ink, pt: 1 }, valign: 'middle' });
  img(s, SHOT('live-idle.png'), 10.3, 1.5, 2.4, 5.2, 'contain');
  t(s, 'Qualitative comparison by tool category, not a benchmark.', 0.6, 6.95, 9, 0.3, { size: 11, italic: true, color: C.grey });
}

// ===== 14. Market opportunity (four columns) =====
{
  const s = slide();
  notes(s, '45 seconds. Malaysia: one flood event cost RM 6.1 billion and displaced 125,000 people. Pilot: Taman Sri Muda in Shah Alam, which flooded in December 2021, then Kampung Baru in KL. Our advantage: it reuses cameras councils already own, and the node targets under RM 500. Go-to-market: councils license the dashboard, fleets and insurers pay per routing query, citizens use it free. The business model is a hypothesis to test in the pilot.');
  brand(s);
  title2(s, 'Market', 'Opportunity', 0.75, 36);
  box(s, 0, 1.75, 13.33, 0.6, C.band);
  const cols = [
    ['Malaysia', [['One flood, RM 6.1 billion', 'December 2021 losses (DOSM)'], ['125,000 displaced', 'Selangor and Kuala Lumpur (The Guardian)']]],
    ['First Pilot', [['Taman Sri Muda, Shah Alam', 'Flooded in December 2021'], ['Kampung Baru, KL', 'Second site, council cameras']]],
    ['Our Advantage', [['Existing cameras', 'No new hardware for vision'], ['Node target', 'Under RM 500 (BOM to confirm)'], ['Open source', 'Code, data and model on GitHub']]],
    ['Go-To-Market', [['Councils (B2G)', 'Dashboard licence, annual fee'], ['Fleets and insurers (B2B)', 'Pay-per-query routing API'], ['Citizens (B2C)', 'Free, funded by telco CSR']]],
  ];
  cols.forEach(([h, items], i) => {
    const x = 0.45 + i * 3.25;
    t(s, h, x, 1.75, 3.1, 0.6, { size: 19, bold: true, color: C.ink, align: 'center', valign: 'middle' });
    items.forEach(([a, b], k) => {
      t(s, a, x + 0.1, 2.65 + k * 1.35, 3.0, 0.4, { size: 16, bold: true, color: C.teal });
      t(s, b, x + 0.1, 3.08 + k * 1.35, 3.0, 0.6, { size: 13, color: C.ink });
    });
  });
  t(s, 'Business model is a hypothesis to test in the Shah Alam pilot.', 0.6, 6.95, 12, 0.3, { size: 11, italic: true, color: C.grey });
}

// ===== 15. Quote + team =====
{
  const s = slide();
  notes(s, '20 seconds. Say the line, then name each person and what they built. Dr Azliza supervises; Luqman built the app and the cloud side; Nadyie built the IoT node; Batrisyia trained the flood-prone model.');
  brand(s);
  box(s, 0.6, 1.0, 12.1, 6.0, C.white, { line: C.ink, lw: 1.5 });
  mark(s, 0.6, 1.35, 40, 12.1, 'center');
  t(s, '“We don’t just send an alert, we show the way out.”', 0.9, 2.3, 11.5, 0.7, { size: 28, bold: true, italic: true, color: C.ink, align: 'center' });
  box(s, 1.1, 3.35, 11.1, 3.25, C.white, { round: 0.25, line: 'CFD8DC', lw: 1 });
  [['azliza.png', 'Dr Azliza Binti Mohd Ali', 'Supervisor'], ['luqman.png', 'Muhammad Luqman Nurhakim', 'App, cloud and vision'], ['nadyie.png', 'Nadyie Azil Bin Nazeri', 'IoT river node'], ['batrisyia.png', 'Batrisyia Afrina Binti Risamuddin', 'Flood-prone model']].forEach(([f, n, r], i) => {
    const x = 1.45 + i * 2.7;
    img(s, A(f), x + 0.5, 3.6, 1.45, 1.45, 'contain');
    t(s, n, x, 5.15, 2.45, 0.65, { size: 13, bold: true, color: C.ink, align: 'center' });
    t(s, r, x, 5.8, 2.45, 0.35, { size: 12, italic: true, color: C.teal, align: 'center' });
  });
}

// ===== 16. Thank you =====
{
  const s = slide();
  notes(s, 'Thank you. Then Q and A. Have these ready: the model is a relative score; the five cameras are AI-generated samples; rain and sensor values are demo numbers; ECS is the deployment target, OBS and SMN planned; node cost is a target.');
  brand(s);
  box(s, 0, 0, 6.67, 7.5, C.thank);
  t(s, 'Thank', 2.0, 2.75, 4.6, 1.5, { size: 88, bold: true, color: C.white, align: 'right' });
  t(s, 'Malaysia', 2.6, 2.1, 4.0, 0.6, { size: 26, bold: true, color: C.white, align: 'right' });
  t(s, 'You', 6.85, 2.75, 4.6, 1.5, { size: 88, bold: true, color: C.teal });
  t(s, 'Know Before It Floods,', 1.5, 6.1, 5.0, 0.5, { size: 20, italic: true, color: C.white, align: 'right' });
  t(s, 'Move Before It Rises', 6.85, 6.1, 5.0, 0.5, { size: 20, italic: true, color: C.teal });
}

const out = path.join(root, 'docs/team/FloodWay_HyperNeura_Style.local.pptx');
await pptx.writeFile({ fileName: out });
console.log('wrote', out);
