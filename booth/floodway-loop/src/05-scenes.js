/* =====================================================================
   SCENES: world layer (behind the phone) and type/overlay layer (above it).
   ===================================================================== */
const HALF_L = { x: 0, y: 0, w: 955, h: H }, HALF_R = { x: 965, y: 0, w: 955, h: H };
const SHOTS = [                                       // [fn, start, end (incl. 0.3 s dissolve), options]
  [shotSky, 0, 1.1, {}],
  [shotRoad, 0.8, 1.8, {}],
  [shotAisyah, 1.5, 3.3, {}],
  [shotKumar, 3.0, 4.8, {}],
  [shotMeiLing, 4.5, 6.3, {}],
  [shotNenek, 6.0, 7.3, {}],
  [shotTraffic, 7.0, 9.3, {}],
  [shotWater, 9.0, 11.3, {}],
  [null, 11.0, 13.4, {}]                              // split: Mei Ling | Nenek
];
function drawShots(c, t) {
  for (let i = 0; i < SHOTS.length; i++) {
    const [fn, s, e, o] = SHOTS[i];
    if (t < s || t >= e) continue;
    const a = i === 0 ? 1 : outCubic(prog(t, s, 0.3));
    if (fn) fn(c, t, FULL, Object.assign({ t0: s, a }, o));
    else {
      base(c, a); c.fillStyle = C.DEEP; ga(c, 1); c.fillRect(0, 0, W, H); base(c, 1);
      shotMeiLing(c, t, HALF_L, { t0: s, a, variant: 'phone', fx: 800, fy: 640, z: 1.12 });
      shotNenek(c, t, HALF_R, { t0: s, a, fx: 760, fy: 600, z: 1.08 });
    }
  }
}

/* ---------- product-world backgrounds ---------- */
function stage(c, t, top, bot, glowCol, gx, gy, a) {
  base(c, a);
  c.fillStyle = lin(c, 0, 0, 0, H, [[0, top], [1, bot]]); ga(c, 1); c.fillRect(0, 0, W, H);
  glow(c, glowCol, gx, gy, 760, 620, 0.5);
  base(c, 1);
}
function floorReflect(c, t, y, a, x0 = 0, x1 = W) {
  c.fillStyle = lin(c, 0, y, 0, H, [[0, 'rgba(56,189,248,0.10)'], [1, 'rgba(0,0,0,0)']]); ga(c, a); c.fillRect(x0, y, x1 - x0, H - y);
  c.strokeStyle = '#38BDF8'; c.lineWidth = 1.5; ga(c, 0.18 * a); c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
  splashes(c, t, 301, 40, x0, x1, y + 12, H - 20, 0.35 * a, 30, '#7DD3FC');
}
function phoneShadow(c, P) {
  if (!P.on) return;
  glow(c, '#000000', P.x, P.y + 470 * P.s, 300 * P.s, 46 * P.s, 0.55 * P.op);
  glow(c, C.CYAN, P.x, P.y, 380 * P.s, 520 * P.s, 0.16 * P.op);
}
function bgS4(c, t, a) {                              // deep water blue; the whole world's waterline rises with the twin
  stage(c, t, '#06284A', '#03101F', '#0E4C86', 1300, 420, a);
  base(c, a);
  const L = waterLevel(t), y = H - 40 - L / CU.waterMax * 210;
  c.beginPath(); c.moveTo(0, H);
  for (let x = 0; x <= W; x += 20) c.lineTo(x, y + Math.sin(x * 0.006 + t * 1.4) * 7);
  c.lineTo(W, H); c.closePath();
  c.fillStyle = lin(c, 0, y, 0, H, [[0, 'rgba(56,189,248,0.22)'], [1, 'rgba(22,119,255,0.05)']]); ga(c, 1); c.fill();
  c.strokeStyle = '#7DD3FC'; c.lineWidth = 2; ga(c, 0.35); c.beginPath();
  for (let x = 0; x <= W; x += 20) { const yy = y + Math.sin(x * 0.006 + t * 1.4) * 7; x ? c.lineTo(x, yy) : c.moveTo(x, yy); } c.stroke();
  rain(c, t, FULL, { n: 120, alpha: 0.12, scale: 0.8 });
  base(c, 1);
}
function bgS5(c, t, a) {                              // emerald-navy with an abstract street grid
  stage(c, t, '#05302B', '#03110F', '#0B6B55', 1350, 460, a);
  base(c, a);
  c.strokeStyle = '#10B981'; c.lineWidth = 2; ga(c, 0.07);
  for (let x = -((t * 12) % 160); x < W; x += 160) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 240, H); c.stroke(); }
  for (let y = 60; y < H; y += 140) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y - 120); c.stroke(); }
  base(c, 1);
}
function bgS7(c, t, a) {
  stage(c, t, '#081B35', '#030A15', '#123A6B', CX, 560, a);
  base(c, a);
  const f = field(701, 70, r => ({ y: 330 + r() * 420, sp: 90 + r() * 160, ph: r() * 2000, s: 1 + r() * 2.5 }));
  for (const d of f) { const x = ((d.ph + d.sp * t) % 700) - 100; circle(c, x, d.y, d.s, C.WATER, 0.35 * (1 - x / 600)); }
  base(c, 1);
}
function bgS9(c, t, a) {
  stage(c, t, '#06111F', '#02060C', '#0F2E57', 700, 520, a);
  base(c, a); floorReflect(c, t, 1000, 1); base(c, 1);
}

/* ---------- S7 pipeline icons ---------- */
function iconRain(c, x, y, a) {
  c.fillStyle = C.PLAT; ga(c, a);
  c.beginPath(); c.arc(x - 26, y, 22, Math.PI * 0.5, Math.PI * 1.5); c.arc(x, y - 16, 30, Math.PI, 0); c.arc(x + 30, y, 22, Math.PI * 1.5, Math.PI * 0.5); c.closePath(); c.fill();
  c.strokeStyle = C.WATER; c.lineWidth = 5; c.lineCap = 'round';
  for (const dx of [-26, 0, 26]) { c.beginPath(); c.moveTo(x + dx, y + 34); c.lineTo(x + dx - 7, y + 52); c.stroke(); }
}
function iconForecast(c, x, y, a) {
  c.strokeStyle = C.WATER; c.lineWidth = 6; c.lineCap = 'round'; c.lineJoin = 'round'; ga(c, a);
  c.beginPath(); c.moveTo(x - 60, y + 36); c.lineTo(x - 22, y + 10); c.lineTo(x + 8, y + 22); c.lineTo(x + 58, y - 30); c.stroke();
  for (const [px, py] of [[-60, 36], [-22, 10], [8, 22], [58, -30]]) circle(c, x + px, y + py, 8, C.PLAT, a);
  c.strokeStyle = C.SLATE; c.lineWidth = 3; ga(c, a * 0.6); c.beginPath(); c.moveTo(x - 70, y + 52); c.lineTo(x + 70, y + 52); c.stroke();
}
function iconRoute(c, x, y, a) {
  c.strokeStyle = C.EMERALD; c.lineWidth = 7; c.lineCap = 'round'; c.lineJoin = 'round'; ga(c, a);
  c.beginPath(); c.moveTo(x - 58, y + 44); c.lineTo(x - 58, y - 6); c.lineTo(x + 6, y - 6); c.stroke();
  circle(c, x - 58, y + 44, 9, C.CYAN, a);
  shield(c, x + 34, y - 8, 26, C.EMERALD, a);
  c.fillStyle = C.AMBER; ga(c, a);
  c.beginPath(); c.arc(x + 58, y + 32, 16, Math.PI, 0); c.lineTo(x + 76, y + 46); c.lineTo(x + 40, y + 46); c.closePath(); c.fill();
}

/* ---------- S8 journey cards ---------- */
const JOURNEYS = [
  { name: 'Aisyah', shot: shotAisyah, fx: 520, fy: 560, z: 1.0, before: 'Heavy rain ahead', after: 'Route understood' },
  { name: 'Kumar', shot: shotKumar, fx: 1100, fy: 560, z: 1.0, before: 'Water on the road', after: 'Safer direction' },
  { name: 'Mei Ling', shot: shotMeiLing, fx: 760, fy: 640, z: 1.0, before: 'Kids in the car', after: 'Family informed' },
  { name: 'Nenek', shot: shotNenek, fx: 640, fy: 640, z: 1.0, before: 'Home alone', after: 'Safe shelter found' }
];
const CARD = { x0: 100, gap: 30, w: 407, y: 290, h: 660 };
function journeyCards(c, t, a) {
  JOURNEYS.forEach((j, i) => {
    const x = CARD.x0 + i * (CARD.w + CARD.gap);
    const pin = spring(prog(t, CU.cards[i], 0.9), 0.78, 9), pout = inCubic(prog(t, 54.3 + i * 0.05, 0.5));
    const al = a * clamp01(pin * 1.4) * (1 - pout);
    if (al <= 0.002) return;
    const dy = (1 - pin) * 160 + pout * -40, flip = t >= CU.flips[i];
    const bump = flip ? 1 + 0.025 * Math.sin(Math.PI * prog(t, CU.flips[i], 0.35)) : 1;
    c.save();
    c.translate(x + CARD.w / 2, CARD.y + CARD.h / 2 + dy); c.scale(bump, bump); c.translate(-(x + CARD.w / 2), -(CARD.y + CARD.h / 2));
    base(c, al);
    rr(c, x, CARD.y, CARD.w, CARD.h, 30); c.save(); c.clip();
    j.shot(c, t, { x, y: CARD.y, w: CARD.w, h: CARD.h }, { t0: 49, a: al, calm: true, fx: j.fx, fy: j.fy, z: j.z });
    base(c, al);
    c.fillStyle = lin(c, 0, CARD.y + CARD.h * 0.45, 0, CARD.y + CARD.h, [[0, 'rgba(4,11,22,0)'], [1, 'rgba(4,11,22,0.94)']]); ga(c, 1);
    c.fillRect(x, CARD.y, CARD.w, CARD.h);
    c.restore();
    const fp = outCubic(prog(t, CU.flips[i], 0.4));
    strokeRR(c, x, CARD.y, CARD.w, CARD.h, 30, flip ? C.EMERALD : '#1E3A5F', flip ? 3 : 2, flip ? 0.4 + 0.6 * fp : 0.9);
    text(c, j.name, x + 32, CARD.y + CARD.h - 104, { size: 50, weight: 800, color: C.PLAT });
    const cy = CARD.y + CARD.h - 78;
    if (!flip || fp < 1) {
      fillRR(c, x + 28, cy, CARD.w - 56, 54, 27, '#3B2A0B', 1 - fp); strokeRR(c, x + 28, cy, CARD.w - 56, 54, 27, C.AMBER, 2, 1 - fp);
      text(c, j.before, x + CARD.w / 2, cy + 37, { size: 27, weight: 700, color: '#FCD34D', align: 'center', alpha: 1 - fp });
    }
    if (flip) {
      fillRR(c, x + 28, cy, CARD.w - 56, 54, 27, '#064E3B', fp); strokeRR(c, x + 28, cy, CARD.w - 56, 54, 27, C.EMERALD, 2, fp);
      const tw_ = tw(c, j.after, 28, 800);
      const sx = x + CARD.w / 2 - (tw_ + 40) / 2;
      circle(c, sx + 14, cy + 27, 14, C.EMERALD, fp); check(c, sx + 14, cy + 27, 14, '#022C22', 3.5, fp);
      text(c, j.after, sx + 40, cy + 37, { size: 28, weight: 800, color: '#A7F3D0', alpha: fp });
    }
    c.restore(); base(c, 1);
  });
}

/* ---------- WORLD LAYER ---------- */
function renderWorld(t, P) {
  const c = WX;
  base(c, 1); c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = C.DEEP; c.fillRect(0, 0, W, H);
  if (t < 13.4) drawShots(c, t);
  if (t >= 12.4 && t < 13.4) { c.fillStyle = C.NAVY; ga(c, outCubic(prog(t, 12.4, 0.9))); c.fillRect(0, 0, W, H); base(c, 1); }
  if (t >= 13.0 && t < 19.6) {                        // S3 clean product stage
    stage(c, t, '#0B2140', '#040B16', '#1B4B85', 720, 500, t < 13.4 ? 1 : 1);
    floorReflect(c, t, 1010, 1);
    rain(c, t, FULL, { n: 160, alpha: 0.14 * (1 - prog(t, 13.2, 1.8)) + 0.04, scale: 0.8 });
  }
  if (t >= 19.0 && t < 27.6) bgS4(c, t, outCubic(prog(t, 19.0, 0.6)));
  if (t >= 27.0 && t < 35.6) bgS5(c, t, outCubic(prog(t, 27.0, 0.6)));
  if (t >= 35.0 && t < 42.6) {
    shotCarInside(c, t, FULL, { t0: 35, a: outCubic(prog(t, 35.0, 0.6)) });
    base(c, outCubic(prog(t, 35.0, 0.6)));
    c.fillStyle = lin(c, 0, 0, W, 0, [[0, 'rgba(4,11,22,0.78)'], [0.45, 'rgba(4,11,22,0.25)'], [0.62, 'rgba(4,11,22,0.35)'], [1, 'rgba(4,11,22,0.85)']]); ga(c, 1); c.fillRect(0, 0, W, H);
    base(c, 1);
  }
  if (t >= 42.0 && t < 49.6) bgS7(c, t, outCubic(prog(t, 42.0, 0.6)));
  if (t >= 49.0 && t < 55.6) { stage(c, t, '#071A30', '#030A14', '#0B4535', CX, 620, outCubic(prog(t, 49.0, 0.6))); journeyCards(c, t, 1); }
  if (t >= 55.0) bgS9(c, t, outCubic(prog(t, 55.0, 0.6)));
  phoneShadow(c, P);
}

/* ---------- OVERLAY: type, tags, letterbox, grade ---------- */
let VIGNETTE = null, GRAIN = null;
function makeGrade() {
  VIGNETTE = document.createElement('canvas'); VIGNETTE.width = W; VIGNETTE.height = H;
  const v = VIGNETTE.getContext('2d');
  v.fillStyle = rad(v, CX, CY, 380, 1150, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,4,10,0.62)']]); v.fillRect(0, 0, W, H);
  GRAIN = document.createElement('canvas'); GRAIN.width = GRAIN.height = 256;
  const g = GRAIN.getContext('2d'), id = g.createImageData(256, 256), r = mulberry32(90210);
  for (let i = 0; i < id.data.length; i += 4) { const n = Math.floor(r() * 255); id.data[i] = id.data[i + 1] = id.data[i + 2] = n; id.data[i + 3] = 255; }
  g.putImageData(id, 0, 0);
}
const TAG = { size: 28, weight: 600, color: '#CBD5E1' };
function renderOver(t) {
  const c = OX;
  base(c, 1); c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, W, H);
  const T = { weight: 800, color: C.PLAT };
  // S1
  if (t < 7.2) {
    glow(c, '#000000', 420, 860, 900, 260, 0.55 * env(t, 1.4, 0.6, 6.5, 0.5));
    kline(c, 'In Malaysia, rain can change', 120, 800, { size: 84, ...T }, t, { tin: 1.7, tout: 6.55 });
    kline(c, 'your journey in minutes.', 120, 896, { size: 84, ...T, color: '#BAE6FD' }, t, { tin: 1.9, tout: 6.6 });
    const caps = [['Aisyah, heading out', 1.8, 3.0], ['Kumar, on delivery', 3.3, 4.5], ['Mei Ling and the kids', 4.8, 6.0], ['Nenek, at home', 6.2, 7.0]];
    for (const [s, a, b] of caps) kline(c, s, 1824, 190, { size: 36, weight: 700, color: '#E2E8F0', align: 'right' }, t, { tin: a, tout: b - 0.25, dur: 0.6 });
  }
  // S2
  if (t >= 7.0 && t < 13.2) {
    glow(c, '#000000', CX, 560, 1100, 220, 0.6 * env(t, 7.1, 0.4, 12.6, 0.5));
    const qs = [['Which way is safer?', 7.3, 8.75], ['Where is the water rising?', 9.2, 10.75], ['Where should I go?', 11.2, 12.55]];
    for (const [s, a, b] of qs) kline(c, s, CX, 600, { size: 104, ...T, align: 'center', maxW: 1680 }, t, { tin: a, tout: b, stag: 0.07 });
    const caps = [['Aisyah', 7.4, 9.0], ['Kumar', 9.3, 11.0], ['Mei Ling', 11.3, 12.9]];
    for (const [s, a, b] of caps) kline(c, s, 120, 190, { size: 36, weight: 700, color: '#E2E8F0' }, t, { tin: a, tout: b - 0.3, dur: 0.6 });
    kline(c, 'Nenek', 1085, 190, { size: 36, weight: 700, color: '#E2E8F0' }, t, { tin: 11.4, tout: 12.6, dur: 0.6 });
  }
  // S3
  if (t >= 14.2 && t < 19.4) {
    const la = 1 - inCubic(prog(t, 18.6, 0.45));
    glow(c, C.CYAN, 1300, 480, 520, 300, 0.12 * la);
    logoMark(c, 1064, 300, 104, lin(c, 1064, 300, 1210, 404, [[0, '#1677FF'], [1, '#38BDF8']]), la, outCubic(prog(t, CU.logo, 0.9)));
    kline(c, 'FloodWay', 1056, 560, { size: 150, weight: 800, color: C.PLAT, chars: true, ls: -2 }, t, { tin: CU.wordmark, tout: 18.6, stag: 0.045, dur: 0.9 });
    kline(c, 'Know before you go.', 1062, 660, { size: 64, weight: 700, color: C.WATER }, t, { tin: CU.tagline, tout: 18.65 });
  }
  // S4
  if (t >= 19.4 && t < 27.0) {
    kline(c, 'SEE THE', 1030, 470, { size: 120, ...T }, t, { tin: 19.8, tout: 22.9 });
    kline(c, 'WATER.', 1030, 596, { size: 120, ...T, color: C.WATER }, t, { tin: 19.95, tout: 22.95 });
    kline(c, 'Digital twin · live water level', 1034, 690, { size: 40, weight: 600, color: '#CBD5E1' }, t, { tin: 20.5, tout: 22.9 });
    kline(c, 'UNDERSTAND', 1030, 470, { size: 112, ...T, maxW: 790 }, t, { tin: 23.25, tout: 26.2 });
    kline(c, 'THE RISK.', 1030, 596, { size: 112, ...T, color: '#FBBF24' }, t, { tin: 23.4, tout: 26.25 });
    kline(c, 'At 0.3 m: go to a safe shelter', 1034, 690, { size: 40, weight: 600, color: '#CBD5E1', maxW: 790 }, t, { tin: 24.0, tout: 26.2 });
  }
  // S5
  if (t >= 27.2 && t < 35.0) {
    kline(c, 'FIND A', 1030, 400, { size: 112, ...T }, t, { tin: 27.6, tout: 34.2 });
    kline(c, 'SAFER ROUTE.', 1030, 522, { size: 112, ...T, color: '#6EE7B7', maxW: 790 }, t, { tin: 27.75, tout: 34.25 });
    kline(c, 'Avoid flooded roads.', 1034, 650, { size: 54, weight: 700, color: C.PLAT, maxW: 790 }, t, { tin: 29.0, tout: 34.2 });
    kline(c, 'Navigate to a Safe Shelter.', 1034, 730, { size: 54, weight: 700, color: '#6EE7B7', maxW: 790 }, t, { tin: 31.2, tout: 34.25 });
  }
  // S6
  if (t >= 35.2 && t < 42.2) {
    kline(c, 'KEEP YOUR', 120, 300, { size: 108, ...T }, t, { tin: 35.5, tout: 41.4 });
    kline(c, 'PEOPLE CLOSE.', 120, 420, { size: 108, ...T, color: '#FCD34D', maxW: 900 }, t, { tin: 35.65, tout: 41.45 });
    kline(c, 'One tap. Let your family know.', 124, 520, { size: 52, weight: 700, color: C.PLAT, maxW: 900 }, t, { tin: 37.0, tout: 41.4 });
  }
  // S7
  if (t >= 42.2 && t < 49.2) renderPipeline(c, t);
  // S8
  if (t >= 49.2 && t < 55.0) kline(c, 'ONE APP. DIFFERENT JOURNEYS.', CX, 200, { size: 92, ...T, align: 'center', maxW: 1720 }, t, { tin: 49.3, tout: 54.35 });
  // S9
  if (t >= 55.4 && t < 58.8) {
    kline(c, 'FloodWay', 1026, 470, { size: 150, weight: 800, color: C.PLAT, chars: true, ls: -2 }, t, { tin: CU.finalWord, tout: 58.1, stag: 0.04 });
    kline(c, 'Know before you go.', 1032, 570, { size: 72, weight: 700, color: C.WATER }, t, { tin: CU.finalTag, tout: 58.15 });
    ['See the risk.', 'Find shelter.', 'Stay connected.'].forEach((s, i) =>
      kline(c, s, 1034, 670 + i * 62, { size: 48, weight: 700, color: '#E2E8F0' }, t, { tin: CU.finalLine + i * 0.2, tout: 58.2 }));
  }
  if (t >= CU.endCard) {
    const ea = outCubic(prog(t, CU.endCard + 0.2, 0.7));
    logoMark(c, CX - 84, 330, 120, lin(c, CX - 84, 330, CX + 84, 450, [[0, '#1677FF'], [1, '#38BDF8']]), ea, outCubic(prog(t, CU.endCard + 0.1, 0.8)));
    kline(c, 'FloodWay', CX, 620, { size: 140, weight: 800, color: C.PLAT, align: 'center', chars: true, ls: -2 }, t, { tin: CU.endCard + 0.3, stag: 0.035 });
    text(c, CONFIG.SITE_URL, CX, 712, { size: 36, weight: 600, color: C.SLATE, align: 'center', alpha: outCubic(prog(t, CU.endCard + 0.8, 0.6)) });
  }
  // letterbox (film framing for the real-world opening) + honesty tags
  const lb = 138 * (1 - inOutCubic(prog(t, CU.letterboxOpen, 0.8)));
  if (lb > 0.5) { c.fillStyle = '#02050A'; ga(c, 1); c.fillRect(0, 0, W, lb); c.fillRect(0, H - lb, W, lb); }
  const dram = env(t, 0.4, 0.6, 12.6, 0.4) + env(t, 35.3, 0.5, 41.4, 0.4) + env(t, 49.3, 0.5, 54.4, 0.4);
  if (dram > 0) text(c, 'Illustrative dramatization', 96, 84, { ...TAG, alpha: dram * 0.9 });
  const per = env(t, 49.3, 0.5, 54.4, 0.4);
  if (per > 0) text(c, 'Illustrative personas', 1824, 84, { ...TAG, align: 'right', alpha: per * 0.9 });
  const offR = env(t, 0.4, 0.6, 34.3, 0.4), offL = env(t, 35.2, 0.5, 41.5, 0.4);
  if (offR > 0) text(c, 'Always follow official warnings (MetMalaysia / JPS)', 1824, 1022, { ...TAG, align: 'right', alpha: offR * 0.9 });
  if (offL > 0) text(c, 'Always follow official warnings (MetMalaysia / JPS)', 96, 1022, { ...TAG, alpha: offL * 0.9 });
  // grade: vignette + fine grain (grain offset is seeded per frame)
  const cine = t < 13 || (t >= 35 && t < 42) ? 1 : 0.6;
  ga(c, cine); c.drawImage(VIGNETTE, 0, 0);
  const fr = Math.floor(t * FPS), gx = (fr * 97) % 256, gy = (fr * 57) % 256;
  c.save(); c.globalCompositeOperation = 'overlay'; ga(c, t < 13 || (t >= 35 && t < 42) ? 0.07 : 0.035);
  c.translate(-gx, -gy); c.fillStyle = c.createPattern(GRAIN, 'repeat'); c.fillRect(gx, gy, W, H); c.restore();
  // fade in from black, fade out to navy
  const fade = Math.max(1 - prog(t, 0, 0.6), prog(t, CU.fadeOut, 0.42));
  if (fade > 0) { c.fillStyle = '#03080F'; ga(c, fade); c.fillRect(0, 0, W, H); }
  base(c, 1);
}

function renderPipeline(c, t) {
  const out = 1 - inCubic(prog(t, 48.4, 0.6));
  kline(c, 'FROM DATA TO DECISION.', CX, 210, { size: 100, weight: 800, color: C.PLAT, align: 'center', maxW: 1720 }, t, { tin: 42.4, tout: 48.4 });
  const nodes = [[390, CONFIG.CHAIN[0], iconRain], [960, CONFIG.CHAIN[1], iconForecast], [1530, CONFIG.CHAIN[2], iconRoute]];
  nodes.forEach(([x, label, icon], i) => {
    const p = spring(prog(t, CU.nodes[i], 0.8), 0.76, 10), a = clamp01(p * 1.3) * out;
    if (a <= 0.002) return;
    const y = 540 + (1 - p) * 70, act = prog(t, CU.pulses[i], 0.4);
    glow(c, C.CYAN, x, y, 300, 200, 0.18 * act * a);
    fillRR(c, x - 220, y - 140, 440, 280, 36, '#0C2140', a);
    strokeRR(c, x - 220, y - 140, 440, 280, 36, act > 0 ? C.WATER : '#1E3A5F', 2.5, a * (0.6 + 0.4 * act));
    icon(c, x, y - 60, a);
    const [l1, l2] = label.split(/ (?=[^ ]+$)/);
    text(c, l1, x, y + 56, { size: 40, weight: 800, color: C.PLAT, align: 'center', alpha: a, maxW: 400 });
    text(c, l2, x, y + 104, { size: 40, weight: 800, color: i === 2 ? '#6EE7B7' : C.WATER, align: 'center', alpha: a });
    if (i < 2) {                                       // connector + travelling pulses
      const x0 = x + 232, x1 = x + 338, ca = a * outCubic(prog(t, CU.nodes[i + 1] - 0.2, 0.5));
      c.strokeStyle = '#38BDF8'; c.lineWidth = 4; ga(c, ca * 0.7); c.beginPath(); c.moveTo(x0, 540); c.lineTo(x1, 540); c.stroke();
      poly(c, [[x1 + 12, 540], [x1 - 6, 528], [x1 - 6, 552]]); c.fillStyle = '#38BDF8'; ga(c, ca * 0.9); c.fill();
      if (t >= CU.pulses[i]) for (let k = 0; k < 3; k++) {
        const u = (((t - CU.pulses[i]) * 0.9 + k / 3) % 1);
        circle(c, lerp(x0, x1, u), 540, 7, '#E0F2FE', ca * Math.sin(Math.PI * u));
      }
    }
  });
  const cp = outExpo(prog(t, CU.community, 0.7)) * out;
  if (cp > 0) {
    const s = 'Community reports, AI-checked', w = tw(c, s, 32, 700) + 64, y = 800 + (1 - cp) * 30;
    c.strokeStyle = C.WATER; c.lineWidth = 3; ga(c, cp * 0.7); c.setLineDash([8, 8]); c.beginPath(); c.moveTo(390, y - 34); c.lineTo(390, 690); c.stroke(); c.setLineDash([]);
    const px = Math.max(96 + w / 2, 390);
    fillRR(c, px - w / 2, y - 34, w, 64, 32, '#0F2A4D', cp); strokeRR(c, px - w / 2, y - 34, w, 64, 32, C.WATER, 2, cp);
    text(c, s, px, y + 10, { size: 32, weight: 700, color: '#E0F2FE', align: 'center', alpha: cp });
  }
  const op = outExpo(prog(t, CU.outputs, 0.7)) * out;
  if (op > 0) {
    const labs = ['Digital twin', 'Safer route', 'Alerts'], ws = labs.map(s => tw(c, s, 30, 800) + 44);
    let x = 1530 - (ws.reduce((a, b) => a + b, 0) + 32) / 2;
    labs.forEach((s, i) => {
      const a = op * outCubic(prog(t, CU.outputs + i * 0.15, 0.5)), y = 800;
      c.strokeStyle = '#6EE7B7'; c.lineWidth = 2.5; ga(c, a * 0.5); c.beginPath(); c.moveTo(1530, 690); c.lineTo(x + ws[i] / 2, y - 32); c.stroke();
      fillRR(c, x, y - 32, ws[i], 60, 30, '#064E3B', a); strokeRR(c, x, y - 32, ws[i], 60, 30, C.EMERALD, 2, a);
      text(c, s, x + ws[i] / 2, y + 9, { size: 30, weight: 800, color: '#A7F3D0', align: 'center', alpha: a });
      x += ws[i] + 16;
    });
  }
}
