// Builds the FloodWay investor-style semi-final pitch deck as an editable PowerPoint (Canva can import it).
// Uses the Huawei competition background (docs/team/slide-assets/huawei-bg.png) and draws every mini illustration
// and diagram from native shapes, so everything stays editable. Phone screenshots: frontend/scripts/capture-pitch-shots.mjs.
// Run from the repo root:  node scripts/investor-deck-to-pptx.mjs  (needs: cd scripts/pptx-tool && npm install)
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PptxGenJS = createRequire(path.join(root, 'scripts/pptx-tool/'))('pptxgenjs');
const asset = (f) => path.join(root, 'docs/team/slide-assets', f);

const C = {
  navy: '0F172A', ink: '1E293B', slate: '475569', mute: '64748B', line: 'CBD5E1', white: 'FFFFFF', card: 'FFFFFF',
  red: 'C7000B', teal: '0D9488', cyan: '06B6D4', blue: '0958D9', sky: 'DCEBFF', mist: 'EEF4FF',
  green: '16A34A', amber: 'F59E0B', orange: 'F97316', danger: 'DC2626', water: '38BDF8', deep: '1D4ED8', storm: '475569',
};
const LEVEL = { NORMAL: C.green, ADVISORY: C.amber, WARNING: C.orange, DANGER: C.danger };
const HEAD = 'Segoe UI Semibold';
const BODY = 'Segoe UI';

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 in
pptx.title = 'FloodWay investor pitch';

const noLine = { color: C.white, width: 0, transparency: 100 };
const fill = (color, transparency = 0) => ({ color, transparency });
const shadow = () => ({ type: 'outer', color: '1E3A8A', opacity: 0.12, blur: 10, offset: 3, angle: 90 });

let n = 0;
function base(kicker, title, notes) {
  n += 1;
  const s = pptx.addSlide();
  s.background = { path: asset('huawei-bg.png') };
  s.addShape('rect', { x: 0.6, y: 0.4, w: 0.5, h: 0.06, fill: fill(C.red), line: noLine });
  s.addText(kicker.toUpperCase(), { x: 0.6, y: 0.5, w: 8, h: 0.32, fontFace: BODY, fontSize: 12, bold: true, color: C.red, charSpacing: 2, margin: 0 });
  s.addText(title, { x: 0.6, y: 0.85, w: 9.6, h: 0.95, fontFace: HEAD, fontSize: 32, bold: true, color: C.navy, valign: 'top', margin: 0, fit: 'shrink' });
  s.addText('FloodWay', { x: 11.0, y: 0.42, w: 1.4, h: 0.4, fontFace: HEAD, fontSize: 18, bold: true, color: '445C61', margin: 0 });
  s.addText(`FloodWay  |  Semi-final, 3 Nov 2026  |  ${n}`, { x: 0.6, y: 7.05, w: 6, h: 0.25, fontFace: BODY, fontSize: 10, color: C.mute, margin: 0 });
  if (notes) s.addNotes(notes);
  return s;
}

// ---------- mini illustrations (all native shapes) ----------
function cloud(s, x, y, w, color = C.storm) {
  s.addShape('cloud', { x, y, w, h: w * 0.62, fill: fill(color), line: noLine });
}
function rain(s, x, y, w, h, color = C.water, n = 9) {
  for (let i = 0; i < n; i++) {
    const dx = (w / n) * i + ((i % 2) * w) / (n * 3);
    const dy = (i % 3) * (h * 0.18);
    s.addShape('line', { x: x + dx, y: y + dy, w: 0.09, h: h * 0.55, line: { color, width: 2 } });
  }
}
function bolt(s, x, y, h, color = C.amber) {
  s.addShape('lightningBolt', { x, y, w: h * 0.55, h, fill: fill(color), line: noLine });
}
function house(s, x, y, w, color = '94A3B8', roof = C.red) {
  s.addShape('triangle', { x: x - w * 0.08, y, w: w * 1.16, h: w * 0.42, fill: fill(roof), line: noLine });
  s.addShape('rect', { x, y: y + w * 0.42, w, h: w * 0.55, fill: fill(color), line: noLine });
  s.addShape('rect', { x: x + w * 0.38, y: y + w * 0.62, w: w * 0.24, h: w * 0.35, fill: fill('FDE68A'), line: noLine });
}
function waterLine(s, x, y, w, h, color = C.water, transparency = 25) {
  s.addShape('rect', { x, y, w, h, fill: fill(color, transparency), line: noLine });
  s.addShape('wave', { x, y: y - h * 0.18, w, h: h * 0.4, fill: fill(color, transparency), line: noLine });
}
function sensor(s, x, y, sc = 1) {
  s.addShape('rect', { x: x + 0.28 * sc, y, w: 0.1 * sc, h: 1.0 * sc, fill: fill('94A3B8'), line: noLine });
  s.addShape('roundRect', { x, y: y - 0.12 * sc, w: 0.66 * sc, h: 0.34 * sc, rectRadius: 0.06, fill: fill(C.navy), line: noLine });
  s.addShape('ellipse', { x: x + 0.46 * sc, y: y - 0.04 * sc, w: 0.12 * sc, h: 0.12 * sc, fill: fill(C.green), line: noLine });
  s.addShape('rect', { x: x - 0.05 * sc, y: y + 0.62 * sc, w: 0.8 * sc, h: 0.38 * sc, fill: fill(C.water, 30), line: noLine });
}
function camera(s, x, y, sc = 1) {
  s.addShape('rect', { x: x + 0.1 * sc, y: y + 0.38 * sc, w: 0.09 * sc, h: 0.75 * sc, fill: fill('94A3B8'), line: noLine });
  s.addShape('roundRect', { x, y, w: 0.8 * sc, h: 0.4 * sc, rectRadius: 0.08, fill: fill(C.navy), line: noLine });
  s.addShape('ellipse', { x: x + 0.52 * sc, y: y + 0.07 * sc, w: 0.26 * sc, h: 0.26 * sc, fill: fill(C.cyan), line: { color: C.white, width: 1 } });
}
function phone(s, x, y, w, h, screen = C.mist) {
  s.addShape('roundRect', { x, y, w, h, rectRadius: 0.12, fill: fill(C.navy), line: noLine, shadow: shadow() });
  s.addShape('roundRect', { x: x + w * 0.06, y: y + h * 0.04, w: w * 0.88, h: h * 0.92, rectRadius: 0.08, fill: fill(screen), line: noLine });
}
function pin(s, x, y, sc = 1, color = C.red) {
  s.addShape('ellipse', { x, y, w: 0.42 * sc, h: 0.42 * sc, fill: fill(color), line: noLine });
  s.addShape('triangle', { x: x + 0.07 * sc, y: y + 0.28 * sc, w: 0.28 * sc, h: 0.3 * sc, flipV: true, fill: fill(color), line: noLine });
  s.addShape('ellipse', { x: x + 0.14 * sc, y: y + 0.14 * sc, w: 0.14 * sc, h: 0.14 * sc, fill: fill(C.white), line: noLine });
}
// A mini storm over a village, scaled to a box.
function stormScene(s, x, y, w, h, withPhone = true) {
  s.addShape('roundRect', { x, y, w, h, rectRadius: 0.2, fill: fill('E6EEFB'), line: { color: C.line, width: 1 }, shadow: shadow() });
  cloud(s, x + w * 0.1, y + h * 0.06, w * 0.55, '3B4A63');
  cloud(s, x + w * 0.42, y + h * 0.02, w * 0.42, '566684');
  bolt(s, x + w * 0.46, y + h * 0.3, h * 0.2);
  rain(s, x + w * 0.12, y + h * 0.32, w * 0.7, h * 0.28, C.deep, 11);
  house(s, x + w * 0.08, y + h * 0.62, w * 0.17, '94A3B8', C.red);
  house(s, x + w * 0.3, y + h * 0.65, w * 0.15, 'A8B5C9', '9F1239');
  house(s, x + w * 0.5, y + h * 0.63, w * 0.16, '94A3B8', C.red);
  waterLine(s, x + 0.02, y + h * 0.8, w - 0.04, h * 0.18, C.water, 20);
  if (withPhone) {
    phone(s, x + w * 0.74, y + h * 0.42, w * 0.2, h * 0.48, C.white);
    s.addShape('ellipse', { x: x + w * 0.79, y: y + h * 0.5, w: w * 0.1, h: w * 0.1, fill: fill(C.danger), line: noLine });
    s.addText('!', { x: x + w * 0.79, y: y + h * 0.5, w: w * 0.1, h: w * 0.1, fontFace: HEAD, fontSize: 18, bold: true, color: C.white, align: 'center', valign: 'middle', margin: 0 });
    s.addShape('roundRect', { x: x + w * 0.77, y: y + h * 0.7, w: w * 0.14, h: 0.08, rectRadius: 0.04, fill: fill(C.line), line: noLine });
    s.addShape('roundRect', { x: x + w * 0.77, y: y + h * 0.76, w: w * 0.1, h: 0.08, rectRadius: 0.04, fill: fill(C.line), line: noLine });
  }
}

// ---------- layout helpers ----------
function card(s, x, y, w, h, o = {}) {
  s.addShape('roundRect', { x, y, w, h, rectRadius: 0.14, fill: fill(o.fill ?? C.card), line: { color: o.line ?? C.line, width: 1 }, shadow: shadow() });
  if (o.accent) s.addShape('rect', { x: x + 0.22, y: y + 0.2, w: 0.5, h: 0.06, fill: fill(o.accent), line: noLine });
}
function chip(s, text, x, y, w, color, textColor = C.white) {
  s.addShape('roundRect', { x, y, w, h: 0.3, rectRadius: 0.15, fill: fill(color), line: noLine });
  s.addText(text, { x, y, w, h: 0.3, fontFace: BODY, fontSize: 10, bold: true, color: textColor, align: 'center', valign: 'middle', margin: 0 });
}
const t = (s, text, x, y, w, h, o = {}) =>
  s.addText(text, { x, y, w, h, fontFace: o.head ? HEAD : BODY, fontSize: o.size ?? 14, bold: o.bold ?? false, color: o.color ?? C.slate, align: o.align ?? 'left', valign: o.valign ?? 'top', margin: 0, fit: o.fit, italic: o.italic });
const arrow = (s, x1, y1, x2, y2, color = C.mute) =>
  s.addShape('line', { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1), flipH: x2 < x1, flipV: y2 < y1, line: { color, width: 2, endArrowType: 'triangle' } });
const source = (s, text) => t(s, text, 0.6, 6.7, 10, 0.28, { size: 11, color: C.mute, italic: true });

// ===== 1. Title =====
{
  n += 1;
  const s = pptx.addSlide();
  s.background = { path: asset('huawei-bg.png') };
  s.addNotes('Open with the picture, not the product. Ten seconds: "It is 1 AM, the rain started hours ago, and nothing on your phone says your street is about to flood." Then the name.');
  s.addShape('rect', { x: 0.6, y: 0.9, w: 0.5, h: 0.06, fill: fill(C.red), line: noLine });
  t(s, 'HUAWEI ICT COMPETITION 2026-27  |  INNOVATION TRACK  |  SEMI-FINAL', 0.6, 1.0, 8, 0.3, { size: 12, bold: true, color: C.red });
  t(s, 'FloodWay', 0.6, 1.5, 6.5, 1.3, { head: true, size: 72, bold: true, color: C.navy });
  t(s, 'Four sources. One warning.\nBefore the road floods.', 0.6, 2.85, 6.4, 1.3, { head: true, size: 28, bold: true, color: C.deep });
  t(s, 'AI flood early warning for Malaysia: it reads the drain, the rain and the map, then tells you where to go.', 0.6, 4.25, 6.0, 0.9, { size: 16, color: C.slate });
  card(s, 0.6, 5.35, 6.4, 1.35);
  t(s, 'Universiti Teknologi MARA  +  RESQ4ACE', 0.85, 5.45, 6, 0.3, { size: 13, bold: true, color: C.navy });
  t(s, 'Muhammad Luqman Nurhakim Bin Rosli\nNadyie Azil Bin Nazeri\nBatrisyia Afrina Binti Risamuddin', 0.85, 5.78, 6, 0.75, { size: 12, color: C.slate });
  t(s, 'FloodWay', 11.0, 0.42, 1.4, 0.4, { head: true, size: 18, bold: true, color: '445C61' });
  stormScene(s, 7.4, 1.35, 5.3, 4.9);
  chip(s, 'RAIN', 7.7, 1.55, 0.9, C.deep);
  chip(s, 'ALERT', 11.5, 5.6, 0.95, C.danger);
  s.addText('FloodWay | Semi-final, 3 Nov 2026', { x: 0.6, y: 7.05, w: 6, h: 0.25, fontFace: BODY, fontSize: 10, color: C.mute, margin: 0 });
}

// ===== 2. Problem =====
{
  const s = base('The problem', '380 mm in 24 hours. Nobody was warned.',
    '30 seconds. Selangor and Kuala Lumpur, 17 to 18 December 2021. 380 mm of rain in a day. Drains built for less rain, and drivers who followed GPS straight into water. Say the human numbers slowly: 125,000 displaced, more than 50 lives, RM 6.1 billion.');
  stormScene(s, 0.6, 1.95, 5.6, 4.55);
  t(s, 'Selangor and Kuala Lumpur, 17-18 December 2021', 0.6, 6.55, 5.6, 0.25, { size: 11, color: C.mute, italic: true });
  const stats = [['380 mm', 'rain in 24 hours', C.deep], ['125,000', 'people displaced', C.navy], ['50+', 'lives lost', C.danger], ['RM 6.1B', 'economic loss', C.navy]];
  stats.forEach(([big, small, col], i) => {
    const x = 6.6 + (i % 2) * 3.1, y = 1.95 + Math.floor(i / 2) * 1.75;
    card(s, x, y, 2.9, 1.55, { accent: col });
    t(s, big, x + 0.2, y + 0.38, 2.5, 0.65, { head: true, size: 34, bold: true, color: col });
    t(s, small, x + 0.2, y + 1.03, 2.5, 0.35, { size: 14 });
  });
  card(s, 6.6, 5.5, 6.0, 1.0, { fill: C.sky });
  t(s, 'Drains built for less rain. Drivers followed GPS into water.', 6.85, 5.6, 5.6, 0.8, { head: true, size: 16, bold: true, color: C.navy, valign: 'middle' });
  source(s, 'Sources: The Guardian, DOSM.');
}

// ===== 3. Gap =====
{
  const s = base('The gap', 'Fast floods. Slow warnings. Blind streets.',
    '30 seconds. Three failures, one picture each. Fast: water rises in minutes. Slow: official warnings are regional and arrive late. Blind: nobody watches the drain at your street, and routing apps do not know a road is under water.');
  const cards = [
    ['FAST', 'Water rises in minutes', 'A storm cell parks over one district and the drain is full before anyone checks it.', C.deep, 'fast'],
    ['SLOW', 'Warnings come late', 'Alerts cover a whole region. They do not say which street, or which way is safe.', C.orange, 'slow'],
    ['BLIND', 'Nobody watches the drain', 'Cameras exist, but nobody reads them all. Routing apps send cars into flooded roads.', C.danger, 'blind'],
  ];
  cards.forEach(([tag, head, body, col, icon], i) => {
    const x = 0.6 + i * 4.1;
    card(s, x, 2.0, 3.85, 4.5, { accent: col });
    s.addShape('roundRect', { x: x + 0.25, y: 2.4, w: 3.35, h: 1.75, rectRadius: 0.14, fill: fill(C.mist), line: noLine });
    if (icon === 'fast') {
      cloud(s, x + 0.9, 2.5, 1.6, C.storm);
      rain(s, x + 1.0, 3.35, 1.4, 0.7, C.deep, 6);
      s.addShape('ellipse', { x: x + 2.55, y: 2.55, w: 0.8, h: 0.8, fill: fill(C.white), line: { color: C.deep, width: 3 } });
      s.addShape('line', { x: x + 2.95, y: 2.7, w: 0, h: 0.28, line: { color: C.deep, width: 3 } });
      s.addShape('line', { x: x + 2.95, y: 2.95, w: 0.2, h: 0.1, line: { color: C.deep, width: 3 } });
    } else if (icon === 'slow') {
      s.addShape('ellipse', { x: x + 1.3, y: 2.55, w: 1.2, h: 1.2, fill: fill(C.orange), line: noLine });
      s.addText('!', { x: x + 1.3, y: 2.55, w: 1.2, h: 1.2, fontFace: HEAD, fontSize: 48, bold: true, color: C.white, align: 'center', valign: 'middle', margin: 0 });
      s.addShape('roundRect', { x: x + 0.5, y: 3.8, w: 2.8, h: 0.14, rectRadius: 0.07, fill: fill(C.line), line: noLine });
      s.addShape('roundRect', { x: x + 0.5, y: 3.8, w: 0.7, h: 0.14, rectRadius: 0.07, fill: fill(C.orange), line: noLine });
      t(s, 'hours later', x + 2.1, 3.55, 1.3, 0.22, { size: 10, color: C.mute, align: 'right' });
    } else {
      house(s, x + 0.6, 2.8, 0.9, '94A3B8', C.red);
      waterLine(s, x + 0.3, 3.65, 3.0, 0.35, C.water, 20);
      s.addShape('roundRect', { x: x + 2.2, y: 3.0, w: 0.9, h: 0.38, rectRadius: 0.1, fill: fill(C.danger), line: noLine });
      s.addShape('ellipse', { x: x + 2.3, y: 3.32, w: 0.2, h: 0.2, fill: fill(C.navy), line: noLine });
      s.addShape('ellipse', { x: x + 2.75, y: 3.32, w: 0.2, h: 0.2, fill: fill(C.navy), line: noLine });
    }
    t(s, tag, x + 0.25, 4.3, 3.3, 0.3, { size: 12, bold: true, color: col });
    t(s, head, x + 0.25, 4.6, 3.35, 0.6, { head: true, size: 20, bold: true, color: C.navy });
    t(s, body, x + 0.25, 5.25, 3.35, 1.1, { size: 14 });
  });
}

// ===== 4. Four sources =====
{
  const s = base('Our idea', 'Four sources. One decision.',
    '45 seconds. This is the whole idea. Two sources tell us where and when: the flood-prone model and MET Malaysia rain. Two sources tell us what is happening now: a water sensor at one point, and a camera reading water over an area. No single source is trusted alone. They go into one fusion rule and out comes one warning, one route and one citizen report loop.');
  const nodes = [
    ['Flood-prone model', 'WHERE: 7 years of flood records', C.deep, 'model'],
    ['MET Malaysia rain', 'WHEN: rain warnings', C.teal, 'met'],
    ['IoT water sensor', 'NOW: depth at one point', C.orange, 'iot'],
    ['CCTV vision', 'NOW: water over an area', C.red, 'cctv'],
  ];
  nodes.forEach(([name, role, col, icon], i) => {
    const y = 1.95 + i * 1.15;
    card(s, 0.6, y, 4.1, 1.0, { fill: C.card });
    s.addShape('rect', { x: 0.6, y: y + 0.1, w: 0.08, h: 0.8, fill: fill(col), line: noLine });
    s.addShape('roundRect', { x: 0.85, y: y + 0.12, w: 0.76, h: 0.76, rectRadius: 0.12, fill: fill(C.mist), line: noLine });
    if (icon === 'model') { s.addShape('ellipse', { x: 0.95, y: y + 0.25, w: 0.5, h: 0.5, fill: fill('F87171', 20), line: noLine }); s.addShape('ellipse', { x: 1.1, y: y + 0.35, w: 0.25, h: 0.25, fill: fill(C.danger, 10), line: noLine }); }
    if (icon === 'met') { cloud(s, 0.9, y + 0.2, 0.62, C.storm); rain(s, 0.95, y + 0.55, 0.5, 0.25, C.deep, 4); }
    if (icon === 'iot') sensor(s, 1.0, y + 0.3, 0.55);
    if (icon === 'cctv') camera(s, 0.97, y + 0.2, 0.55);
    t(s, name, 1.8, y + 0.15, 2.8, 0.4, { head: true, size: 17, bold: true, color: C.navy });
    t(s, role, 1.8, y + 0.58, 2.85, 0.3, { size: 12 });
    arrow(s, 4.7, y + 0.5, 5.55, 3.55, col);
  });
  // hub
  s.addShape('ellipse', { x: 5.55, y: 2.75, w: 1.9, h: 1.9, fill: fill(C.navy), line: { color: C.cyan, width: 4 }, shadow: shadow() });
  t(s, 'FUSION\nRULE', 5.55, 3.2, 1.9, 0.9, { head: true, size: 20, bold: true, color: C.white, align: 'center', valign: 'middle' });
  chip(s, 'rule-based, tested', 5.65, 4.75, 1.7, C.deep);
  arrow(s, 7.45, 3.7, 8.2, 3.7, C.navy);
  // outputs
  phone(s, 8.3, 1.95, 1.9, 3.8);
  s.addShape('roundRect', { x: 8.5, y: 2.3, w: 1.5, h: 0.75, rectRadius: 0.1, fill: fill(C.danger), line: noLine });
  t(s, 'LEAVE NOW\nKampung Baru', 8.5, 2.3, 1.5, 0.75, { size: 11, bold: true, color: C.white, align: 'center', valign: 'middle' });
  s.addShape('roundRect', { x: 8.5, y: 3.25, w: 1.5, h: 1.35, rectRadius: 0.1, fill: fill('DCFCE7'), line: noLine });
  s.addShape('line', { x: 8.7, y: 3.8, w: 0.8, h: 0.6, flipV: true, line: { color: C.green, width: 3 } });
  pin(s, 9.45, 3.45, 0.7, C.green);
  t(s, 'Nearest open\nrelief centre', 8.5, 4.7, 1.5, 0.5, { size: 10, color: C.slate, align: 'center' });
  const outs = [['Warn', 'a clear level per place'], ['Route', 'around flooded roads'], ['Report', 'citizens confirm, a person approves']];
  outs.forEach(([a, b], i) => {
    const y = 2.1 + i * 1.3;
    card(s, 10.6, y, 2.15, 1.1);
    t(s, a, 10.8, y + 0.15, 1.9, 0.35, { head: true, size: 18, bold: true, color: C.deep });
    t(s, b, 10.8, y + 0.55, 1.85, 0.5, { size: 11 });
  });
  t(s, 'Context: where and when', 0.6, 6.6, 4, 0.25, { size: 11, bold: true, color: C.mute });
  t(s, 'Live: what is happening now', 2.8, 6.6, 3, 0.25, { size: 11, bold: true, color: C.mute });
}

// ===== 5. How it decides =====
{
  const s = base('How it decides', 'Live readings lead. Context agrees.',
    '45 seconds. Three rules. One: a live reading, the sensor or the camera, sets the floor. Two: context alone, the model and the rain forecast, can never go above Advisory, so we do not cry wolf. Three: when a second source reaches Warning, the level goes up one step. Example: sensor at Warning plus MET at Warning gives Danger. The same cases are tested in the backend and the app.');
  const lv = [['NORMAL', 'Quiet'], ['ADVISORY', 'Watch'], ['WARNING', 'Get ready'], ['DANGER', 'Leave now']];
  lv.forEach(([k, label], i) => {
    const x = 0.6 + i * 1.55, h = 1.0 + i * 0.7, y = 6.25 - h;
    s.addShape('roundRect', { x, y, w: 1.4, h, rectRadius: 0.12, fill: fill(LEVEL[k]), line: noLine, shadow: shadow() });
    t(s, k, x, y + 0.12, 1.4, 0.3, { size: 11, bold: true, color: C.white, align: 'center' });
    t(s, label, x, y + 0.42, 1.4, 0.3, { size: 12, color: C.white, align: 'center' });
  });
  s.addShape('line', { x: 0.6, y: 6.3, w: 6.0, h: 0, line: { color: C.line, width: 2 } });
  const rules = [
    ['1', 'Live readings set the floor', 'A sensor or camera at Warning is enough to alert.', C.red],
    ['2', 'Context alone stays at Advisory', 'Model and rain cannot raise Danger by themselves.', C.deep],
    ['3', 'A second source raises one step', 'Another factor at Warning moves the level up.', C.teal],
  ];
  rules.forEach(([num, head, body, col], i) => {
    const y = 1.95 + i * 1.3;
    card(s, 7.0, y, 5.75, 1.15);
    s.addShape('ellipse', { x: 7.2, y: y + 0.25, w: 0.65, h: 0.65, fill: fill(col), line: noLine });
    t(s, num, 7.2, y + 0.25, 0.65, 0.65, { head: true, size: 22, bold: true, color: C.white, align: 'center', valign: 'middle' });
    t(s, head, 8.05, y + 0.15, 4.5, 0.4, { head: true, size: 17, bold: true, color: C.navy });
    t(s, body, 8.05, y + 0.58, 4.55, 0.5, { size: 12 });
  });
  card(s, 7.0, 5.85, 5.75, 0.8, { fill: C.sky });
  chip(s, 'SENSOR WARNING', 7.2, 6.1, 1.55, C.orange);
  t(s, '+', 8.8, 6.05, 0.3, 0.4, { head: true, size: 20, bold: true, color: C.navy, align: 'center' });
  chip(s, 'MET WARNING', 9.15, 6.1, 1.4, C.orange);
  t(s, '=', 10.6, 6.05, 0.3, 0.4, { head: true, size: 20, bold: true, color: C.navy, align: 'center' });
  chip(s, 'DANGER', 11.0, 6.1, 1.5, C.danger);
}

// ===== 6. Storm chart =====
{
  const s = base('15 seconds of storm', 'Watch the warning build, step by step',
    '40 seconds. This is what you will see in the demo. Rain warning first, then the model marks the place, then the sensor climbs. At the sensor warning line, with rain and flood history agreeing, the system says leave now, before the camera reaches its own warning. By second fifteen all four agree. The rain and sensor numbers are demo values until those feeds connect.');
  const D = 15;
  const labels = Array.from({ length: D + 1 }, (_, i) => `${i}s`);
  const iotAt = (t0) => (t0 >= 12 ? 81 : t0 >= 7.95 ? 58 : t0 >= 5.7 ? 35 : 18);
  const camAt = (t0) => { const u = Math.min(1, Math.max(0, (t0 / D - 0.35) / 0.55)); return Math.round((0.17 + (1.02 - 0.17) * Math.pow(u, 1.4)) * 100); };
  const iot = labels.map((_, i) => iotAt(i)), cam = labels.map((_, i) => camAt(i));
  card(s, 0.6, 1.95, 8.3, 4.5);
  s.addChart(pptx.charts.LINE, [
    { name: 'IoT water sensor (% of bank)', labels, values: iot },
    { name: 'CCTV water level (% of bank)', labels, values: cam },
  ], {
    x: 0.7, y: 2.05, w: 8.1, h: 3.6, chartColors: [C.orange, C.red], lineSize: 3, lineDataSymbolSize: 6,
    catAxisLabelFontSize: 10, valAxisLabelFontSize: 10, catAxisLabelColor: C.mute, valAxisLabelColor: C.mute,
    valAxisMaxVal: 100, valAxisMinVal: 0, valGridLine: { color: 'E2E8F0', size: 1 }, catGridLine: { style: 'none' },
    showLegend: true, legendPos: 'b', legendFontSize: 11, legendColor: C.slate, showTitle: false,
  });
  const ev = [['0s', 'MET orange rain warning', C.teal], ['4s', 'Place in top flood-prone band', C.deep], ['8s', 'LEAVE NOW (sensor warning + rain)', C.danger], ['14s', 'All four factors agree', C.navy]];
  ev.forEach(([sec, text, col], i) => {
    const x = 0.8 + i * 2.0;
    s.addShape('ellipse', { x, y: 5.75, w: 0.16, h: 0.16, fill: fill(col), line: noLine });
    t(s, sec, x + 0.22, 5.68, 0.6, 0.3, { size: 12, bold: true, color: col });
    t(s, text, x, 5.97, 1.9, 0.45, { size: 10, color: C.slate });
  });
  s.addShape('line', { x: 0.88, y: 5.83, w: 6.1, h: 0, line: { color: C.line, width: 1, dashType: 'dash' } });
  s.addImage({ path: asset('live-storm.png'), x: 10.0, y: 1.75, w: 2.0, h: 2.0 * (1688 / 780), shadow: shadow() });
  t(s, 'The /live page at second 14', 9.4, 6.4, 3.2, 0.25, { size: 10, color: C.mute, italic: true, align: 'center' });
}

// ===== 7. Flood-prone model =====
{
  const s = base('The flood-prone model', 'Tested on floods it never saw',
    '45 seconds. Tisya trained on flood records up to 2019 and tested on 2020 and 2021, floods the model never saw. The logistic regression scored AUC 0.836, with a 95 percent interval of 0.777 to 0.892; CatBoost scored 0.782. All 17 top-ranked sites were real flood sites. It is a relative score, not a probability, so it only adds context in the fusion rule. Do not quote any other accuracy figure.');
  card(s, 0.6, 1.95, 12.15, 1.35);
  t(s, 'How we tested', 0.85, 2.05, 3, 0.3, { size: 12, bold: true, color: C.mute });
  s.addShape('roundRect', { x: 0.85, y: 2.5, w: 7.2, h: 0.55, rectRadius: 0.12, fill: fill(C.deep), line: noLine });
  t(s, 'TRAIN: flood records up to 2019', 0.85, 2.5, 7.2, 0.55, { size: 14, bold: true, color: C.white, align: 'center', valign: 'middle' });
  s.addShape('roundRect', { x: 8.15, y: 2.5, w: 4.35, h: 0.55, rectRadius: 0.12, fill: fill(C.red), line: noLine });
  t(s, 'TEST: floods of 2020-2021 (never seen)', 8.15, 2.5, 4.35, 0.55, { size: 14, bold: true, color: C.white, align: 'center', valign: 'middle' });
  card(s, 0.6, 3.5, 6.6, 3.1);
  s.addChart(pptx.charts.BAR, [{ name: 'AUC', labels: ['Logistic regression', 'CatBoost'], values: [0.836, 0.782] }], {
    x: 0.7, y: 3.55, w: 6.4, h: 3.0, barDir: 'col', chartColors: [C.deep, C.cyan], catAxisLabelFontSize: 12, valAxisLabelFontSize: 10,
    valAxisMinVal: 0.5, valAxisMaxVal: 1, showValue: true, dataLabelFontSize: 14, dataLabelColor: C.navy, dataLabelFormatCode: '0.000',
    valGridLine: { color: 'E2E8F0', size: 1 }, showLegend: false, showTitle: true, title: 'AUC on held-out 2020-2021 floods', titleFontSize: 13, titleColor: C.navy, barGapWidthPct: 80,
  });
  card(s, 7.4, 3.5, 2.5, 3.1, { accent: C.deep });
  t(s, '0.836', 7.4, 4.05, 2.5, 0.8, { head: true, size: 40, bold: true, color: C.deep, align: 'center' });
  t(s, 'AUC, 95% interval\n0.777 to 0.892', 7.5, 4.9, 2.3, 0.7, { size: 12, align: 'center' });
  card(s, 10.1, 3.5, 2.65, 3.1, { accent: C.red });
  t(s, '17 of 17', 10.1, 4.05, 2.65, 0.8, { head: true, size: 38, bold: true, color: C.red, align: 'center' });
  t(s, 'top-ranked sites were\nreal flood sites', 10.2, 4.9, 2.45, 0.7, { size: 12, align: 'center' });
  source(s, 'A relative score, not a probability. It adds context and never raises Danger alone.');
}

// ===== 8. Product tour =====
{
  const s = base('The product', 'One phone. Three moments.',
    '30 seconds. Three screens. Live: the four tiles and the storm timeline. Map: the route to the nearest open relief centre that avoids flooded roads. Reports: a citizen posts a photo, AI checks it, a person approves it, and a 2 km area is drawn for everyone nearby. The five camera frames are AI-generated sample imagery and are labelled that way.');
  const shots = [['live-idle.png', 'LIVE', 'Four factors, one level', C.deep], ['live-storm.png', 'STORM', 'All four agree: Danger', C.danger], ['map.png', 'MAP', 'Route around the water', C.green]];
  shots.forEach(([f, tag, cap, col], i) => {
    const x = 0.9 + i * 2.95, w = 2.05, h = w * (1688 / 780);
    s.addImage({ path: asset(f), x, y: 1.7, w, h, shadow: shadow() });
    chip(s, tag, x, 1.7 + h + 0.12, 0.9, col);
    t(s, cap, x, 1.7 + h + 0.5, 2.6, 0.3, { size: 12, color: C.slate });
  });
  card(s, 9.9, 1.95, 2.85, 4.4, { fill: C.card });
  t(s, 'Also built', 10.1, 2.1, 2.5, 0.3, { head: true, size: 16, bold: true, color: C.navy });
  const feats = ['Citizen photo report', 'AI check, then a person', '2 km crowd area on the map', 'One-tap family SOS', 'Operator dashboard', 'Phone-first, installable'];
  feats.forEach((f, i) => {
    s.addShape('ellipse', { x: 10.1, y: 2.62 + i * 0.6, w: 0.2, h: 0.2, fill: fill(C.teal), line: noLine });
    t(s, f, 10.45, 2.55 + i * 0.6, 2.2, 0.4, { size: 12, color: C.ink });
  });
  t(s, 'Cameras: AI-generated sample imagery', 10.1, 5.85, 2.5, 0.4, { size: 10, color: C.mute, italic: true });
}

// ===== 9. Architecture =====
{
  const s = base('Built for Huawei Cloud', 'From sensor to phone in one pipeline',
    '45 seconds. Left to right. Sources: water sensor, cameras, MET rain, citizen reports. In the middle is Huawei Cloud: an ECS instance runs the API and the fusion rule, OBS stores camera frames and model files, and SMN sends SMS and email alerts. Be honest on stage: the ECS deployment is our target before the semi-final, OBS and SMN are planned. Also in use today: Firebase sign-in, the Gemini photo check, and OpenStreetMap maps.');
  const srcs = [['IoT water sensor', 'iot'], ['CCTV frames', 'cctv'], ['MET rain', 'met'], ['Citizen reports', 'phone']];
  srcs.forEach(([name, ic], i) => {
    const y = 2.0 + i * 1.1;
    card(s, 0.6, y, 2.5, 0.92);
    s.addShape('roundRect', { x: 0.78, y: y + 0.14, w: 0.64, h: 0.64, rectRadius: 0.1, fill: fill(C.mist), line: noLine });
    if (ic === 'iot') sensor(s, 0.9, y + 0.3, 0.42);
    if (ic === 'cctv') camera(s, 0.87, y + 0.22, 0.42);
    if (ic === 'met') { cloud(s, 0.82, y + 0.22, 0.55, C.storm); rain(s, 0.88, y + 0.5, 0.42, 0.22, C.deep, 3); }
    if (ic === 'phone') phone(s, 0.95, y + 0.15, 0.34, 0.62, C.white);
    t(s, name, 1.55, y + 0.25, 1.5, 0.45, { size: 13, bold: true, color: C.navy, valign: 'middle' });
    arrow(s, 3.1, y + 0.46, 3.65, 3.85, C.mute);
  });
  s.addShape('roundRect', { x: 3.65, y: 1.9, w: 5.5, h: 4.55, rectRadius: 0.2, fill: fill('FFF1F2'), line: { color: C.red, width: 2, dashType: 'dash' } });
  t(s, 'HUAWEI CLOUD', 3.9, 2.0, 3, 0.35, { head: true, size: 15, bold: true, color: C.red });
  const svc = [
    ['ECS', 'API + fusion rule + vision', 'TARGET: running before 3 Nov', C.amber],
    ['OBS', 'Camera frames, model files', 'PLANNED', C.mute],
    ['SMN', 'SMS and email alerts', 'PLANNED', C.mute],
  ];
  svc.forEach(([name, what, status, col], i) => {
    const y = 2.5 + i * 1.3;
    card(s, 3.9, y, 5.0, 1.15);
    s.addShape('roundRect', { x: 4.05, y: y + 0.2, w: 0.95, h: 0.75, rectRadius: 0.1, fill: fill(C.red), line: noLine });
    t(s, name, 4.05, y + 0.2, 0.95, 0.75, { head: true, size: 20, bold: true, color: C.white, align: 'center', valign: 'middle' });
    t(s, what, 5.2, y + 0.18, 3.6, 0.4, { size: 14, bold: true, color: C.navy });
    chip(s, status, 5.2, y + 0.68, status.length > 9 ? 2.4 : 1.1, col);
  });
  arrow(s, 9.15, 4.1, 9.75, 4.1, C.navy);
  const outs = [['Phone app', 'Warn, route, report'], ['Operator dashboard', 'Approve reports'], ['Telegram / SMS / email', 'Family and area alerts']];
  outs.forEach(([a, b], i) => {
    const y = 2.0 + i * 1.5;
    card(s, 9.8, y, 2.95, 1.3, { accent: C.deep });
    t(s, a, 10.0, y + 0.35, 2.6, 0.35, { head: true, size: 15, bold: true, color: C.navy });
    t(s, b, 10.0, y + 0.75, 2.6, 0.3, { size: 12 });
  });
  t(s, 'Also in use today: Firebase sign-in, Gemini photo check, OpenStreetMap maps.', 0.6, 6.65, 9, 0.28, { size: 11, color: C.mute, italic: true });
}

// ===== 10. Pilot and business =====
{
  const s = base('Pilot and business model', 'Pilot in Shah Alam. Then scale.',
    '45 seconds. Start where it hurt: Taman Sri Muda in Shah Alam flooded in December 2021. Phase one is ten nodes plus the council cameras that already exist, then Kampung Baru in KL, then the Klang Valley, then ASEAN. Three customers: councils license the dashboard, fleets and insurers pay per routing query, and citizens use it free. Node cost is a target under RM 500, the bill of materials is not final. This is our business hypothesis, not revenue.');
  const steps = [['PHASE 1', 'Shah Alam', 'Taman Sri Muda\n10 nodes + existing cameras', C.red], ['PHASE 2', 'Kuala Lumpur', 'Kampung Baru\nDBKL cameras', C.deep], ['PHASE 3', 'Klang Valley', 'Council by council', C.teal], ['PHASE 4', 'ASEAN', 'Same four-source rule', C.navy]];
  steps.forEach(([ph, place, body, col], i) => {
    const x = 0.6 + i * 3.1;
    if (i < 3) arrow(s, x + 2.85, 2.9, x + 3.15, 2.9, C.mute);
    card(s, x, 2.0, 2.85, 1.95, { accent: col });
    pin(s, x + 0.2, 2.35, 0.8, col);
    t(s, ph, x + 0.95, 2.35, 1.8, 0.25, { size: 10, bold: true, color: col });
    t(s, place, x + 0.95, 2.6, 1.85, 0.4, { head: true, size: 17, bold: true, color: C.navy });
    t(s, body, x + 0.2, 3.2, 2.5, 0.65, { size: 11 });
  });
  const rev = [['Councils', 'License the dashboard. Annual fee.', 'B2G', C.red], ['Fleets and insurers', 'Pay per routing query via API.', 'B2B', C.deep], ['Citizens', 'Free. Telco CSR pays for it.', 'B2C', C.teal]];
  rev.forEach(([a, b, tag, col], i) => {
    const x = 0.6 + i * 4.1;
    card(s, x, 4.25, 3.85, 1.55, { accent: col });
    chip(s, tag, x + 2.85, 4.4, 0.8, col);
    t(s, a, x + 0.25, 4.6, 2.5, 0.4, { head: true, size: 18, bold: true, color: C.navy });
    t(s, b, x + 0.25, 5.1, 3.4, 0.6, { size: 13 });
  });
  card(s, 0.6, 6.0, 12.15, 0.6, { fill: C.sky });
  t(s, 'Node cost target: under RM 500 (bill of materials still to confirm). Business model is a hypothesis to test in the pilot.', 0.85, 6.0, 11.7, 0.6, { size: 12, bold: true, color: C.navy, valign: 'middle' });
}

// ===== 11. Why we win =====
{
  const s = base('Why we win', 'We connect what others keep apart',
    '30 seconds. Existing tools each do one job: agency telemetry measures at fixed points, weather apps give rain, navigation apps do not know about floods. We fuse them and add the camera and the citizen. Do not claim others cannot do this; say we are the only one in this competition showing all of it working on one phone.');
  const head = ['', 'Agency telemetry', 'Weather apps', 'Navigation apps', 'FloodWay'];
  const rows = [
    ['Reads rain and forecast', 'No', 'Yes', 'No', 'Yes'],
    ['Reads water at a point', 'Yes', 'No', 'No', 'Yes (IoT node)'],
    ['Reads water over an area', 'No', 'No', 'No', 'Yes (cameras)'],
    ['Learns where floods happen', 'No', 'No', 'No', 'Yes (model)'],
    ['Routes around flooded roads', 'No', 'No', 'No', 'Yes'],
    ['Citizens report, a person approves', 'No', 'No', 'No', 'Yes'],
  ];
  const th = (x) => ({ text: x, options: { bold: true, color: C.white, fill: { color: x === 'FloodWay' ? C.red : C.navy }, fontFace: HEAD, fontSize: 14, align: 'center' } });
  const cell = (v, last) => ({ text: v, options: { fontFace: BODY, fontSize: 14, align: last ? 'center' : 'center', bold: last, color: last ? C.teal : v === 'Yes' ? C.green : C.mute, fill: { color: last ? 'ECFDF5' : C.white } } });
  const tbl = [head.map((h, i) => (i === 0 ? { text: '', options: { fill: { color: C.navy } } } : th(h))), ...rows.map((r) => [{ text: r[0], options: { fontFace: BODY, fontSize: 14, bold: true, color: C.navy, fill: { color: C.white } } }, ...r.slice(1).map((v, i) => cell(v, i === 3))])];
  s.addTable(tbl, { x: 0.6, y: 1.95, w: 12.15, colW: [3.5, 2.0, 2.0, 2.2, 2.45], rowH: 0.55, border: { type: 'solid', color: C.line, pt: 1 }, valign: 'middle' });
  card(s, 0.6, 6.2, 12.15, 0.5, { fill: C.sky });
  t(s, 'A qualitative comparison of what each category of tool does today, not a benchmark.', 0.85, 6.2, 11.7, 0.5, { size: 12, color: C.navy, bold: true, valign: 'middle' });
}

// ===== 12. Scorecard =====
{
  const s = base('Scorecard', 'How we meet the judging criteria',
    '30 seconds. Walk the table left to right. Weights are the regional-round weights; confirm with the organiser which rubric applies on 3 November. Every number on our slides is reproducible from the repo.');
  const th = (x) => ({ text: x, options: { bold: true, color: C.white, fill: { color: C.navy }, fontFace: HEAD, fontSize: 14, align: 'center' } });
  const td = (x, o = {}) => ({ text: x, options: { fontFace: BODY, fontSize: 14, color: C.ink, align: 'center', ...o } });
  const rows = [
    ['Innovation', '40%', 'Four sources, one warning', 'Fusion rule with tests', 'Storm scenario'],
    ['Application value', '35%', 'RM 6.1B loss, Shah Alam pilot', 'Low-cost node design', 'Map and routes'],
    ['Completeness', '15%', 'Cloud deployment (ECS target)', 'README, code, data', 'Open source'],
    ['Presentation', '10%', '10 min talk, 5 min demo', 'Prepared Q and A', 'One phone, one story'],
  ];
  s.addTable([[th('Criterion'), th('Weight'), th('Judges see'), th('In the repo'), th('In the demo')],
    ...rows.map((r) => [td(r[0], { bold: true, align: 'left', color: C.navy }), td(r[1], { bold: true, color: C.red }), td(r[2]), td(r[3]), td(r[4], { bold: true, color: C.teal })])],
  { x: 0.6, y: 1.95, w: 12.15, colW: [2.6, 1.3, 3.2, 2.7, 2.35], rowH: 0.75, border: { type: 'solid', color: C.line, pt: 1 }, valign: 'middle', fill: { color: C.white } });
  card(s, 0.6, 5.95, 12.15, 0.8, { fill: C.sky });
  t(s, 'Regional-round weights. We will confirm the semi-final rubric with the organiser. Cameras are AI-generated samples; rain and sensor values are demo numbers.', 0.85, 5.95, 11.7, 0.8, { size: 12, bold: true, color: C.navy, valign: 'middle' });
}

// ===== 13. The ask =====
{
  const s = base('The ask', 'One pilot. A safer Shah Alam.',
    '30 seconds. We are asking for three things. A council that will pilot with us in Shah Alam. Access to its existing cameras so we do not need new hardware for the vision part. And cloud credits plus expert review so the Huawei Cloud deployment is solid. The timeline is our plan, not a commitment from anyone.');
  const asks = [['1', 'One council pilot', 'Shah Alam first, Taman Sri Muda as the test site.', C.red], ['2', 'Camera access', 'Existing council cameras feed Live Vision. No new hardware for that part.', C.deep], ['3', 'Cloud and review', 'Huawei Cloud credits and expert review of the deployment.', C.teal]];
  asks.forEach(([num, head, body, col], i) => {
    const x = 0.6 + i * 4.1;
    card(s, x, 1.95, 3.85, 2.3, { accent: col });
    s.addShape('ellipse', { x: x + 0.25, y: 2.35, w: 0.7, h: 0.7, fill: fill(col), line: noLine });
    t(s, num, x + 0.25, 2.35, 0.7, 0.7, { head: true, size: 24, bold: true, color: C.white, align: 'center', valign: 'middle' });
    t(s, head, x + 1.1, 2.4, 2.6, 0.6, { head: true, size: 18, bold: true, color: C.navy, valign: 'middle' });
    t(s, body, x + 0.25, 3.25, 3.4, 0.9, { size: 13 });
  });
  t(s, 'Our plan', 0.6, 4.7, 3, 0.3, { head: true, size: 16, bold: true, color: C.navy });
  const road = [['NOW', 'Semi-final demo', C.red], ['NEXT', 'ECS live, IoT node on the bench', C.deep], ['THEN', 'Shah Alam pilot, 10 nodes', C.teal], ['AFTER', 'Klang Valley councils', C.navy]];
  s.addShape('line', { x: 1.0, y: 5.55, w: 11.4, h: 0, line: { color: C.line, width: 3 } });
  road.forEach(([a, b, col], i) => {
    const x = 0.8 + i * 3.1;
    s.addShape('ellipse', { x, y: 5.4, w: 0.3, h: 0.3, fill: fill(col), line: { color: C.white, width: 2 } });
    t(s, a, x + 0.4, 5.32, 1.2, 0.3, { size: 13, bold: true, color: col });
    t(s, b, x, 5.9, 2.8, 0.7, { size: 15, color: C.ink });
  });
}

// ===== 14. Demo =====
{
  const s = base('Live demo', 'Five minutes, one phone',
    'Switch to the phone. 0:00 open /live and press Play storm scenario; narrate the four tiles going amber then red over 15 seconds. 2:00 open Map and start the route; the drive takes 8 seconds. 3:30 open Reports and post a photo report; show the AI check, then the operator approval and the 2 km area. Say plainly: the cameras are AI-generated samples, rain and sensor numbers are demo values until those feeds connect. Return to the slides for the close.');
  const steps = [['0:00 - 2:00', 'Storm', 'Play the 15 s scenario. Four factors agree and Kampung Baru turns Danger.', C.red, 'storm'], ['2:00 - 3:30', 'Route', 'The map drives to the nearest open relief centre, avoiding flooded roads.', C.deep, 'route'], ['3:30 - 5:00', 'Report', 'A photo report passes AI, then a person. A 2 km area appears on the map.', C.teal, 'report']];
  steps.forEach(([time, head, body, col, ic], i) => {
    const x = 0.6 + i * 4.1;
    card(s, x, 1.95, 3.85, 4.3, { accent: col });
    s.addShape('roundRect', { x: x + 0.25, y: 2.35, w: 3.35, h: 1.7, rectRadius: 0.14, fill: fill(C.mist), line: noLine });
    if (ic === 'storm') { cloud(s, x + 1.0, 2.4, 1.5, C.storm); rain(s, x + 1.1, 3.2, 1.3, 0.7, C.deep, 6); bolt(s, x + 1.75, 3.0, 0.55); }
    if (ic === 'route') { waterLine(s, x + 1.2, 3.1, 1.0, 0.6, C.water, 15); s.addShape('line', { x: x + 0.6, y: 2.95, w: 2.1, h: 0.8, flipV: true, line: { color: C.green, width: 4, dashType: 'dash' } }); pin(s, x + 2.6, 2.45, 0.8, C.green); }
    if (ic === 'report') { phone(s, x + 1.3, 2.35, 0.95, 1.7, C.white); s.addShape('ellipse', { x: x + 1.55, y: 2.75, w: 0.45, h: 0.45, fill: fill(C.teal), line: noLine }); s.addShape('ellipse', { x: x + 2.25, y: 2.5, w: 0.8, h: 0.8, fill: fill(C.teal, 70), line: { color: C.teal, width: 2, dashType: 'dash' } }); }
    chip(s, time, x + 0.25, 4.3, 1.5, col);
    t(s, head, x + 0.25, 4.7, 3.3, 0.45, { head: true, size: 22, bold: true, color: C.navy });
    t(s, body, x + 0.25, 5.2, 3.35, 0.95, { size: 13 });
  });
  t(s, 'Cameras are AI-generated samples. Rain and sensor values are demo numbers.', 0.6, 6.5, 12, 0.3, { size: 12, bold: true, color: C.slate });
}

// ===== 15. Close =====
{
  n += 1;
  const s = pptx.addSlide();
  s.background = { path: asset('huawei-bg.png') };
  s.addNotes('Close slowly. One sentence, then thank you, then Q and A. Have the answers ready: model limits (relative score), sample cameras versus real feeds, node cost target, camera access, why Shah Alam, built versus planned.');
  t(s, 'FloodWay', 11.0, 0.42, 1.4, 0.4, { head: true, size: 18, bold: true, color: '445C61' });
  stormScene(s, 7.6, 1.5, 5.1, 4.6);
  s.addShape('rect', { x: 0.6, y: 1.5, w: 0.5, h: 0.06, fill: fill(C.red), line: noLine });
  t(s, 'Before the road floods,\nyour phone already knows.', 0.6, 1.7, 6.8, 2.2, { head: true, size: 40, bold: true, color: C.navy });
  t(s, 'FloodWay: four sources, one warning, one safe route.', 0.6, 4.0, 6.5, 0.6, { size: 20, color: C.deep, bold: true });
  card(s, 0.6, 4.9, 6.6, 1.5);
  t(s, 'Thank you. Questions?', 0.85, 5.0, 6, 0.45, { head: true, size: 20, bold: true, color: C.navy });
  t(s, 'Universiti Teknologi MARA + RESQ4ACE\nInstructor: Dr. Azliza Binti Mohd Ali', 0.85, 5.5, 6.2, 0.8, { size: 13 });
  s.addText('FloodWay | Semi-final, 3 Nov 2026', { x: 0.6, y: 7.05, w: 6, h: 0.25, fontFace: BODY, fontSize: 10, color: C.mute, margin: 0 });
}

const out = path.join(root, 'docs/team/FloodWay_Investor_Pitch.local.pptx');
await pptx.writeFile({ fileName: out });
console.log('wrote', out, n, 'slides');
