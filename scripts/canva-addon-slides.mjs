// Builds the extra semi-final slides that get merged into the Canva pitch deck (DAHZRa-ybT4).
// Same Huawei background and header as the Canva template; all coordinates are in Canva pixels (1920 x 1080).
// Assets: docs/team/slide-assets/deck/ (git-ignored). Run from the repo root:  node scripts/canva-addon-slides.mjs
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PptxGenJS = createRequire(path.join(root, 'scripts/pptx-tool/'))('pptxgenjs');
const A = (f) => path.join(root, 'docs/team/slide-assets/deck', f);
const BG = path.join(root, 'docs/team/slide-assets/huawei-bg.png');

const P = (v) => v / 144; // Canva px to inches
const C = {
  navy: '0F172A', slate: '475569', mute: '64748B', red: 'EF4444', teal: '0D9488', cyan: '06B6D4', blue: '1565C0',
  brand: '4D96A9', brandDark: '445C61', card: 'F1F5F9', white: 'FFFFFF', line: 'CBD5E1', huawei: 'C7000B',
  green: '16A34A', amber: 'F59E0B', orange: 'F97316', danger: 'DC2626', pink: 'FCE4E6', pinkText: 'C62828',
};
const HEAD = 'Poppins';
const BODY = 'Inter';
const noLine = { color: C.white, width: 0, transparency: 100 };

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';

const t = (s, text, x, y, w, h, o = {}) => s.addText(text, {
  x: P(x), y: P(y), w: P(w), h: P(h), fontFace: o.head ? HEAD : BODY, fontSize: (o.size ?? 22) * 0.5, bold: o.bold ?? false,
  italic: o.italic ?? false, color: o.color ?? C.navy, align: o.align ?? 'left', valign: o.valign ?? 'top', margin: 0,
  lineSpacingMultiple: o.ls ?? 1.1,
});
const box = (s, x, y, w, h, color, o = {}) => s.addShape(o.radius ? 'roundRect' : 'rect', {
  x: P(x), y: P(y), w: P(w), h: P(h), rectRadius: o.radius ? P(o.radius) : undefined,
  fill: { color, transparency: o.tr ?? 0 }, line: o.line ? { color: o.line, width: o.lw ?? 1.5 } : noLine,
  shadow: o.shadow ? { type: 'outer', color: '0F172A', opacity: 0.12, blur: 12, offset: 4, angle: 90 } : undefined,
});
const dot = (s, x, y, d, color) => s.addShape('ellipse', { x: P(x), y: P(y), w: P(d), h: P(d), fill: { color }, line: noLine });
const img = (s, f, x, y, w, h, type = 'contain') => s.addImage({ path: f, x: P(x), y: P(y), w: P(w), h: P(h), sizing: { type, w: P(w), h: P(h) } });
const arrow = (s, x1, y1, x2, y2, color = C.slate, wt = 3) => s.addShape('line', {
  x: P(Math.min(x1, x2)), y: P(Math.min(y1, y2)), w: P(Math.abs(x2 - x1)), h: P(Math.abs(y2 - y1)),
  flipH: x2 < x1, flipV: y2 < y1, line: { color, width: wt, endArrowType: 'triangle' },
});

// Same chrome as the Canva template: background, kicker, wordmark, caption, footer.
function slide(kicker, title, caption, notes) {
  const s = pptx.addSlide();
  s.background = { path: BG };
  t(s, kicker, 96, 70, 900, 30, { size: 21, bold: true, color: C.red });
  s.addText([{ text: 'Flood', options: { color: C.brandDark } }, { text: 'Way', options: { color: C.brand } }],
    { x: P(1592), y: P(52), w: P(204), h: P(56), fontFace: HEAD, fontSize: 20, bold: true, margin: 0, fit: 'none', wrap: false });
  if (caption) t(s, caption, 1420, 112, 360, 28, { size: 18, color: C.mute, align: 'right' });
  if (title) t(s, title, 96, 150, 1500, 80, { head: true, size: 54, bold: true });
  t(s, 'FloodWay | Semi-final, 3 Nov 2026', 96, 995, 600, 26, { size: 18 });
  s.addShape('line', { x: P(96), y: P(968), w: P(1728), h: 0, line: { color: '000000', width: 1 } });
  if (notes) s.addNotes(notes);
  return s;
}

// ---------- 1. The gap: this is happening now ----------
{
  const s = slide('URGENCY', 'This is happening now', 'Klang Valley floods, 2021',
    'Three gaps. Floods come fast: water rises in under an hour. Warnings come slow: alerts cover a whole state, hours later. Roads are blind: GPS apps do not know a road is under water, so drivers drive into it.');
  const cards = [
    ['Floods come fast', 'Water rises in under an hour. Drains fill before anyone checks.', C.red, '⚡'],
    ['Warnings come slow', 'Alerts cover a whole state, hours late. They never name your street.', C.danger, '⏱'],
    ['Roads are blind', 'GPS apps cannot see water. Drivers follow them into floods.', C.cyan, '🛣'],
  ];
  cards.forEach(([h, b, col, ic], i) => {
    const x = 96 + i * 585;
    box(s, x, 290, 555, 470, C.white, { radius: 24, shadow: true });
    box(s, x, 290, 555, 10, col);
    box(s, x + 40, 340, 120, 120, col, { radius: 30, tr: 85 });
    t(s, ic, x + 40, 340, 120, 120, { size: 64, align: 'center', valign: 'middle' });
    t(s, h, x + 40, 500, 480, 60, { head: true, size: 38, bold: true });
    t(s, b, x + 40, 580, 480, 160, { size: 26, color: C.slate, ls: 1.25 });
  });
  box(s, 96, 800, 1728, 110, 'ECFEFF', { radius: 18 });
  box(s, 96, 800, 10, 110, C.cyan);
  t(s, 'The problem: floods strike in minutes, but warnings arrive in hours.', 140, 800, 1660, 110, { size: 30, bold: true, color: '0E7490', valign: 'middle' });
}

// ---------- 2. Our innovation (HyperNeura-style band) ----------
{
  const s = slide('OUR INNOVATION', null, 'AI flood early warning',
    'One sentence: FloodWay warns your street before it floods and shows you the safe way out. Then the four features left to right.');
  s.addText([{ text: 'Our Innovation: ', options: { color: C.navy } }, { text: 'Flood', options: { color: C.brandDark } }, { text: 'Way', options: { color: C.brand } }],
    { x: P(96), y: P(140), w: P(1728), h: P(90), fontFace: HEAD, fontSize: 30, bold: true, align: 'center', margin: 0 });
  t(s, 'Warns your street before it floods, then shows you the safe way out.', 96, 240, 1728, 40, { size: 26, color: C.slate, align: 'center' });
  box(s, 0, 310, 1500, 90, 'A9D4DE');
  const f = [
    ['Four Sources', 'Rain, sensors, cameras and flood history checked together.', 'm-storm.png'],
    ['Live Camera Vision', 'AI reads water level from river and drain cameras.', 'm-live.png'],
    ['Safe Routes', 'Leads you to the nearest open relief centre, around floods.', 'm-map.png'],
    ['Citizen Reports', 'People share photos. AI checks them. Everyone nearby sees it.', 'm-reports.png'],
  ];
  f.forEach(([h, b, m], i) => {
    const x = 20 + i * 370;
    t(s, h, x, 310, 350, 90, { size: 28, bold: true, align: 'center', valign: 'middle' });
    img(s, A(m), x + 105, 425, 160, 322);
    t(s, b, x + 15, 770, 330, 150, { size: 23, align: 'center', color: C.navy, ls: 1.2 });
  });
  img(s, A('iw2035.png'), 1530, 300, 330, 270);
  box(s, 1530, 620, 330, 300, C.white, { radius: 16, line: C.line, lw: 1 });
  t(s, 'SUSTAINABLE\nDEVELOPMENT GOALS', 1550, 635, 300, 70, { size: 20, bold: true, color: '0E7490' });
  box(s, 1550, 715, 140, 185, 'FD9D24', { radius: 8 }); t(s, '11\nSustainable cities', 1558, 725, 128, 165, { size: 20, bold: true, color: C.white });
  box(s, 1700, 715, 140, 185, '3F7E44', { radius: 8 }); t(s, '13\nClimate action', 1708, 725, 128, 165, { size: 20, bold: true, color: C.white });
}

// ---------- 3. How FloodWay decides ----------
{
  const s = slide('HOW IT WORKS', 'Four sources. One clear warning.', 'Smart fusion rule',
    'FloodWay never trusts one source alone. Flood history says where, MET rain says when, the water sensor and the camera say what is happening now. When they agree, your phone says leave now, and shows the way.');
  const src = [
    ['Flood history', 'Where floods happened before', '1565C0', '🗺'],
    ['Rain warning', 'When heavy rain is coming', '0D9488', '🌧'],
    ['Water sensor', 'How deep the water is now', 'F97316', '📟'],
    ['River camera', 'What the water looks like now', 'DC2626', '📹'],
  ];
  src.forEach(([h, b, col, ic], i) => {
    const y = 270 + i * 165;
    box(s, 96, y, 600, 140, C.white, { radius: 20, shadow: true });
    box(s, 96, y + 20, 10, 100, col);
    box(s, 130, y + 25, 90, 90, col, { radius: 22, tr: 85 });
    t(s, ic, 130, y + 25, 90, 90, { size: 44, align: 'center', valign: 'middle' });
    t(s, h, 245, y + 25, 440, 50, { head: true, size: 32, bold: true });
    t(s, b, 245, y + 78, 440, 40, { size: 22, color: C.slate });
    arrow(s, 700, y + 70, 850, 610, col, 3);
  });
  dot(s, 850, 470, 280, C.navy);
  s.addShape('ellipse', { x: P(838), y: P(458), w: P(304), h: P(304), fill: { color: C.white, transparency: 100 }, line: { color: C.cyan, width: 5 } });
  t(s, 'FloodWay\nAI', 850, 470, 280, 280, { head: true, size: 44, bold: true, color: C.white, align: 'center', valign: 'middle' });
  arrow(s, 1145, 610, 1290, 610, C.navy, 4);
  img(s, A('m-storm.png'), 1300, 250, 340, 684);
  const lv = [['SAFE', C.green], ['WATCH', C.amber], ['GET READY', C.orange], ['LEAVE NOW', C.danger]];
  lv.forEach(([n, col], i) => { box(s, 1665, 330 + i * 140, 200, 110, col, { radius: 18 }); t(s, n, 1665, 330 + i * 140, 200, 110, { size: 24, bold: true, color: C.white, align: 'center', valign: 'middle' }); });
}

// ---------- 4. The app ----------
{
  const s = slide('THE PRODUCT', 'FloodWay in your pocket', 'Mobile app',
    'Four screens. Home: your area and your family at a glance. Live: the storm turns your street to Danger. Map: the safe route to the nearest open relief centre. Reports: people share flood photos, AI checks them.');
  const ph = [['m-home.png', 'Home', 'Your area and your family'], ['m-storm.png', 'Live alert', 'Your street turns Danger'], ['m-map.png', 'Safe route', 'Drive around the water'], ['m-reports.png', 'Reports', 'Neighbours share photos']];
  ph.forEach(([m, h, b], i) => {
    const x = 150 + i * 420;
    img(s, A(m), x + 15, 240, 300, 604);
    t(s, h, x - 30, 858, 390, 46, { head: true, size: 32, bold: true, align: 'center' });
    t(s, b, x - 30, 906, 390, 40, { size: 22, color: C.slate, align: 'center' });
  });
}

// ---------- 5. Prototype hardware ----------
{
  const s = slide('PROTOTYPE', null, 'RiverNode N-01',
    'This is the river node Nadyie built. An ESP32 board reads an ultrasonic sensor that measures the distance to the water. A screen shows the level, three lights show safe, watch and danger, and a buzzer sounds when the water is too high. It sends every reading to the cloud over Wi-Fi.');
  img(s, A('node-insitu.jpg'), 0, 0, 760, 960, 'cover');
  t(s, 'Prototype', 840, 150, 900, 80, { head: true, size: 64, bold: true, color: C.brand });
  t(s, 'Hardware Component', 840, 235, 900, 50, { head: true, size: 36, bold: true, color: C.brandDark });
  box(s, 840, 315, 990, 610, C.white, { radius: 20, line: C.brand, lw: 2.5 });
  const parts = [['w-esp32.jpg', 'ESP32 board'], ['w-hcsr04.jpg', 'Ultrasonic sensor'], ['lcd.png', 'LCD screen'], ['leds.png', '3 warning lights'], ['buzzer.png', 'Buzzer siren'], [null, 'Wi-Fi to cloud'], [null, 'Solar power'], ['m-home.png', 'Phone app']];
  parts.forEach(([f, n], i) => {
    const x = 870 + (i % 4) * 240, y = 345 + Math.floor(i / 4) * 290;
    box(s, x, y, 220, 200, 'F8FAFC', { radius: 16 });
    if (f) img(s, A(f), x + 15, y + 15, 190, 170);
    else t(s, n === 'Wi-Fi to cloud' ? '📶' : '☀', x, y, 220, 200, { size: 80, align: 'center', valign: 'middle' });
    t(s, n, x - 10, y + 210, 240, 40, { size: 22, bold: true, align: 'center' });
  });
}

// ---------- 6. System architecture ----------
{
  const s = slide('SYSTEM ARCHITECTURE', null, 'Built on Huawei Cloud',
    'Left to right. Sense: the ultrasonic sensor on the ESP32 node, the river cameras and the rain warnings. Huawei Cloud: ECS runs the FloodWay brain, OBS stores camera frames and data, ModelArts runs the flood-prone model, SMN sends SMS alerts. Act: the node sounds its siren, the phone shows the level and the safe route, and families get alerts.');
  t(s, 'System Architecture', 96, 130, 1728, 80, { head: true, size: 54, bold: true, align: 'center' });
  box(s, 96, 230, 1728, 715, C.white, { radius: 24, line: '94A3B8', lw: 2 });
  // sense
  box(s, 150, 255, 290, 54, '29B6F6', { radius: 27 }); t(s, 'Sense', 150, 255, 290, 54, { size: 26, bold: true, color: C.white, align: 'center', valign: 'middle' });
  const ins = [['w-hcsr04.jpg', 'Water sensor', 330], ['w-esp32.jpg', 'ESP32 node', 480], [null, 'River cameras', 630], [null, 'Rain warnings', 780]];
  ins.forEach(([f, n, y], i) => {
    box(s, 140, y, 310, 130, 'F8FAFC', { radius: 18 });
    if (f) img(s, A(f), 155, y + 10, 140, 110);
    else t(s, i === 2 ? '📹' : '🌧', 155, y + 10, 140, 110, { size: 64, align: 'center', valign: 'middle' });
    t(s, n, 300, y, 150, 130, { size: 22, bold: true, valign: 'middle' });
    arrow(s, 455, y + 65, 560, 590, '64748B', 3);
  });
  // huawei cloud
  box(s, 565, 270, 790, 650, 'FFF5F5', { radius: 28, line: C.huawei, lw: 3 });
  img(s, A('huawei.png'), 820, 290, 280, 113);
  const svc = [['tile-ecs.png', 'ECS', 'Runs the FloodWay brain: API, camera reader, fusion rule'], ['tile-obs.png', 'OBS', 'Stores camera frames and flood data'], ['tile-modelarts.png', 'ModelArts', 'Runs the flood-prone AI model'], ['tile-smn.png', 'SMN', 'Sends SMS and email alerts']];
  svc.forEach(([f, n, b], i) => {
    const x = 600 + (i % 2) * 380, y = 430 + Math.floor(i / 2) * 240;
    box(s, x, y, 355, 215, C.white, { radius: 20, shadow: true });
    img(s, A(f), x + 20, y + 20, 110, 110);
    t(s, n, x + 145, y + 30, 200, 50, { head: true, size: 30, bold: true, color: C.huawei });
    t(s, b, x + 20, y + 140, 320, 70, { size: 19, color: C.slate, ls: 1.15 });
  });
  // act
  arrow(s, 1360, 590, 1450, 590, C.navy, 4);
  box(s, 1480, 255, 290, 54, '29B6F6', { radius: 27 }); t(s, 'Act', 1480, 255, 290, 54, { size: 26, bold: true, color: C.white, align: 'center', valign: 'middle' });
  img(s, A('m-storm.png'), 1475, 330, 150, 302);
  t(s, 'Phone: alert and safe route', 1630, 400, 180, 120, { size: 21, bold: true });
  img(s, A('leds.png'), 1480, 660, 140, 62);
  t(s, 'Node: lights and siren', 1630, 650, 180, 80, { size: 21, bold: true });
  box(s, 1480, 770, 140, 110, 'E0F2F1', { radius: 16 }); t(s, '✉', 1480, 770, 140, 110, { size: 56, align: 'center', valign: 'middle', color: C.teal });
  t(s, 'Family SMS alerts', 1630, 785, 180, 80, { size: 21, bold: true });
}

// ---------- 7. How we build the AI ----------
{
  const s = slide('HOW WE BUILD', null, 'Flood-prone place model',
    'Batrisyia built the flood-prone model. We collected seven years of past flood reports, the rain in the days before each flood and the height and slope of the land. We trained and compared five AI models and kept the best one. The data is stored in OBS and the model runs on ModelArts.');
  s.addText([{ text: 'How we build ', options: { color: C.navy } }, { text: 'Flood', options: { color: C.brandDark } }, { text: 'Way', options: { color: C.brand } }, { text: ' AI?', options: { color: C.navy } }],
    { x: P(96), y: P(140), w: P(1728), h: P(90), fontFace: HEAD, fontSize: 28, bold: true, align: 'center', margin: 0 });
  t(s, 'Teaching AI where floods happen', 140, 250, 1200, 50, { size: 28, italic: true, bold: true, color: C.slate });
  box(s, 96, 320, 1728, 610, C.white, { radius: 24, line: '94A3B8', lw: 2 });
  const st = [['🗂', 'Past flood\nreports', '2015 to 2021'], ['🌧', 'Rain before\neach flood', '1, 3 and 7 days'], ['⛰', 'Land height\nand slope', 'satellite map']];
  st.forEach(([ic, h, b], i) => {
    const x = 150 + i * 330;
    box(s, x, 430, 250, 250, 'F0F9FF', { radius: 125 });
    t(s, ic, x, 430, 250, 250, { size: 96, align: 'center', valign: 'middle' });
    t(s, h, x - 20, 700, 290, 90, { head: true, size: 27, bold: true, align: 'center' });
    t(s, b, x - 20, 795, 290, 40, { size: 21, color: C.slate, align: 'center' });
    if (i < 2) arrow(s, x + 260, 555, x + 320, 555, C.slate, 3);
  });
  s.addShape('line', { x: P(1130), y: P(555), w: P(80), h: 0, line: { color: C.slate, width: 3 } });
  s.addShape('line', { x: P(1210), y: P(400), w: 0, h: P(450), line: { color: C.slate, width: 3 } });
  const out = [['tile-obs.png', 'Store the data', 'Huawei OBS', 400], [null, 'Train 5 AI models', 'keep the best one', 610], ['tile-modelarts.png', 'Run the model', 'Huawei ModelArts', 820]];
  out.forEach(([f, h, b, y]) => {
    arrow(s, 1210, y, 1300, y, C.slate, 3);
    if (f) img(s, A(f), 1310, y - 70, 140, 140);
    else { box(s, 1310, y - 70, 140, 140, C.brand, { radius: 30 }); t(s, 'AI', 1310, y - 70, 140, 140, { head: true, size: 48, bold: true, color: C.white, align: 'center', valign: 'middle' }); }
    t(s, h, 1475, y - 55, 340, 50, { head: true, size: 30, bold: true });
    t(s, b, 1475, y, 340, 40, { size: 22, color: C.slate });
  });
}

// ---------- 8. Why we win ----------
{
  const s = slide('WHY WE WIN', null, 'FloodWay vs other tools',
    'Read the FloodWay column, then point at the right column. Other tools each do one job. FloodWay joins them up for your street, and the node costs under RM 500.');
  s.addText([{ text: 'Why We ', options: { color: C.navy } }, { text: 'Win?', options: { color: C.brand } }], { x: P(96), y: P(130), w: P(1728), h: P(90), fontFace: HEAD, fontSize: 30, bold: true, align: 'center', margin: 0 });
  const rows = [
    ['Warning for your street', 'Yes', 'Whole-state alerts'],
    ['Checks rain, sensor, camera and flood history together', 'Yes', 'One source each'],
    ['Reads water level from existing cameras', 'Yes', 'No'],
    ['Safe route around flooded roads', 'Yes', 'GPS drives into water'],
    ['Flood photos checked by AI and a person', 'Yes', 'Unchecked social media'],
    ['River sensor node', 'Under RM 500', 'Expensive fixed stations'],
  ];
  const head = (x, fill, color) => ({ text: x, options: { bold: true, fontFace: HEAD, fontSize: 15, color, fill: { color: fill }, align: 'center' } });
  s.addTable([
    [head('Feature', C.white, C.navy), head('FloodWay', '1592A8', C.white), head('Other tools', C.pink, '9E9E9E')],
    ...rows.map(([a, b, c], i) => [
      { text: a, options: { fontFace: BODY, fontSize: 13, color: C.navy, align: 'left', fill: { color: C.white }, bold: i === 5 } },
      { text: (b === 'Yes' ? '✓ ' : '') + b, options: { fontFace: BODY, fontSize: 15, bold: true, color: C.white, fill: { color: '1592A8' }, align: 'center' } },
      { text: (c === 'No' ? '✗ ' : '') + c, options: { fontFace: BODY, fontSize: 14, color: C.pinkText, fill: { color: C.pink }, align: 'center' } },
    ]),
  ], { x: P(96), y: P(240), w: P(1350), colW: [P(560), P(360), P(430)], rowH: P(95), border: { type: 'solid', color: '334155', pt: 1 }, valign: 'middle', margin: [0, 0.15, 0, 0.15] });
  img(s, A('m-map.png'), 1490, 240, 330, 664);
}

// ---------- 9. Demo ----------
{
  const s = pptx.addSlide();
  s.background = { color: '0B1220' };
  s.addNotes('Switch to the phone. Storm: press Play, in 15 seconds all four sources agree and Kampung Baru turns Leave Now. Safe route: the map drives to the nearest open relief centre. Report: post a flood photo, AI checks it, a 2 km area appears for everyone nearby.');
  img(s, A('demo-bg.jpg'), 0, 0, 1920, 1080, 'cover');
  s.addText([{ text: 'Flood', options: { color: C.white } }, { text: 'Way', options: { color: '4DD0E1' } }], { x: P(96), y: P(300), w: P(1000), h: P(150), fontFace: HEAD, fontSize: 60, bold: true, margin: 0 });
  t(s, 'Live Demonstration', 96, 460, 1000, 80, { head: true, size: 56, bold: true, color: C.white });
  const steps = [['1', 'Storm', 'Watch your street turn Leave Now'], ['2', 'Safe route', 'Drive to the nearest relief centre'], ['3', 'Report', 'Share a photo, warn your neighbours']];
  steps.forEach(([n, h, b], i) => {
    const y = 600 + i * 110;
    dot(s, 96, y, 80, '06B6D4'); t(s, n, 96, y, 80, 80, { size: 34, bold: true, color: C.white, align: 'center', valign: 'middle' });
    t(s, h, 200, y, 400, 45, { head: true, size: 32, bold: true, color: C.white });
    t(s, b, 200, y + 45, 700, 35, { size: 22, color: 'CBD5E1' });
  });
  img(s, A('m-storm.png'), 1150, 140, 330, 664);
  img(s, A('m-map.png'), 1500, 220, 330, 664);
}

const out = path.join(root, 'docs/team/FloodWay_Canva_Addon.local.pptx');
await pptx.writeFile({ fileName: out });
console.log('wrote', out);
