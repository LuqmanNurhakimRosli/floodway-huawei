/* =====================================================================
   HERO PHONE: one generic device (no third-party branding) + FloodWay screens.
   Screens mirror the real app (frontend/src): light dashboard/map cards (#1677FF), dark 3D Twin page.
   Screen coordinates are the app's logical 390 x 844.
   ===================================================================== */
const SX = 35, SY = 48, SW = 390, SH = 844;          // screen origin inside the 460 x 940 phone canvas

function drawBezel(c) {
  c.fillStyle = '#1B2330'; ga(c, 1);
  c.fillRect(10, 230, 6, 70); c.fillRect(10, 320, 6, 110); c.fillRect(444, 290, 6, 140);   // side buttons
  rr(c, 16, 22, 428, 896, 62);
  c.fillStyle = lin(c, 16, 22, 444, 918, [[0, '#5B6778'], [0.25, '#1C2430'], [0.6, '#11161F'], [1, '#3A4556']]); c.fill();
  rr(c, 20, 26, 420, 888, 58); c.fillStyle = '#05070B'; c.fill();
  strokeRR(c, 17, 23, 426, 894, 61, '#8B98AA', 1.5, 0.35);
}
function drawGlass(c) {
  c.save(); rr(c, SX, SY, SW, SH, 46); c.clip();
  c.fillStyle = lin(c, SX, SY, SX + SW, SY + SH, [[0, 'rgba(255,255,255,0.13)'], [0.32, 'rgba(255,255,255,0.03)'], [0.55, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0.04)']]);
  ga(c, 1); c.fillRect(SX, SY, SW, SH);
  c.restore();
  circle(c, SX + SW / 2, SY + 22, 9, '#020305'); circle(c, SX + SW / 2 + 2, SY + 20, 3, '#1C3148', 0.9);   // punch-hole camera
}
function statusBar(c, dark) {
  const col = dark ? '#F8FAFC' : '#0F172A';
  for (let i = 0; i < 4; i++) fillRR(c, 292 + i * 8, 30 - i * 3, 5, 8 + i * 3, 1.5, col, 0.9);
  strokeRR(c, 328, 24, 32, 16, 5, col, 2, 0.8); fillRR(c, 331, 27, 22, 10, 3, col, 0.9);
}
function tapFx(c, x, y, t, t0) {                    // finger press + ring
  const pre = prog(t, t0 - 0.25, 0.25), post = prog(t, t0, 0.7);
  if (t < t0 - 0.25 || post >= 1) return;
  const pressA = t < t0 ? outCubic(pre) : 1 - post;
  circle(c, x, y, lerp(34, 26, outCubic(pre)), '#FFFFFF', 0.35 * pressA);
  if (t >= t0) ring(c, x, y, lerp(26, 90, outCubic(post)), '#FFFFFF', 3, 0.7 * (1 - post));
}
function card(c, x, y, w, h, r, fill, a = 1, shadow = 0.14) {
  glow(c, '#0F172A', x + w / 2, y + h / 2 + 12, w * 0.62, h * 0.7, shadow * a);
  fillRR(c, x, y, w, h, r, fill, a);
}
function shield(c, x, y, s, col, a = 1) {
  c.beginPath(); c.moveTo(x, y - s); c.lineTo(x + s * 0.8, y - s * 0.62); c.lineTo(x + s * 0.8, y);
  c.quadraticCurveTo(x + s * 0.72, y + s * 0.72, x, y + s); c.quadraticCurveTo(x - s * 0.72, y + s * 0.72, x - s * 0.8, y);
  c.lineTo(x - s * 0.8, y - s * 0.62); c.closePath(); c.fillStyle = col; ga(c, a); c.fill();
}
function chip(c, x, y, label, bg, fg, size = 22, alignRight = false) {
  const w = tw(c, label, size, 800, 1) + size * 1.2, h = size * 1.75, x0 = alignRight ? x - w : x;
  fillRR(c, x0, y, w, h, h / 2, bg);
  text(c, label, x0 + w / 2, y + h * 0.68, { size, weight: 800, color: fg, align: 'center', ls: 1 });
  return w;
}

/* ---------- lock screen with the FloodWay alert ---------- */
function screenLock(c, t) {
  c.fillStyle = lin(c, 0, 0, 0, SH, [[0, '#123763'], [0.55, '#0A1E3A'], [1, '#071426']]); ga(c, 1); c.fillRect(0, 0, SW, SH);
  c.strokeStyle = '#38BDF8'; c.lineWidth = 2;
  for (let k = 0; k < 4; k++) {
    ga(c, 0.07 + k * 0.02); c.beginPath();
    for (let x = 0; x <= SW; x += 10) { const y = 600 + k * 46 + Math.sin(x * 0.02 + t * 0.9 + k) * 10; x ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.stroke();
  }
  statusBar(c, true);
  c.strokeStyle = '#F8FAFC'; c.lineWidth = 4; ga(c, 0.85);
  c.beginPath(); c.arc(195, 112, 12, Math.PI, 0); c.stroke();
  fillRR(c, 179, 110, 32, 26, 6, '#F8FAFC', 0.85);
  const pc = spring(prog(t, CU.phoneRise + 1.0, 0.9), 0.78, 10);
  if (pc > 0) {
    c.save(); c.translate(0, (1 - pc) * 60);
    const y0 = 270;
    card(c, 16, y0, 358, 256, 30, 'rgba(248,250,252,0.97)', pc, 0.3);
    fillRR(c, 16, y0 + 24, 6, 206, 3, C.AMBER, pc);
    fillRR(c, 36, y0 + 24, 58, 58, 16, C.CYAN, pc);
    logoMark(c, 43, y0 + 40, 26, '#FFFFFF', pc);
    text(c, 'FLOODWAY', 108, y0 + 52, { size: 20, weight: 800, color: C.CYAN, ls: 2, alpha: pc });
    text(c, 'now', 354, y0 + 52, { size: 20, weight: 600, color: '#64748B', align: 'right', alpha: pc });
    text(c, 'Flood risk rising', 36, y0 + 128, { size: 36, weight: 800, color: C.INK, alpha: pc });
    text(c, 'near you.', 36, y0 + 170, { size: 36, weight: 800, color: C.INK, alpha: pc });
    text(c, 'Tap for your safest route.', 36, y0 + 218, { size: 26, weight: 700, color: C.CYAN, alpha: pc, maxW: 318 });
    c.restore();
  }
  fillRR(c, 130, 818, 130, 6, 3, '#F8FAFC', 0.6);
  tapFx(c, 195, 430, t, CU.tapAlert);
}

/* ---------- 3D Twin: water level at the house, 0.30 m -> Navigate to Safe Shelter (PPS) ---------- */
function screenTwin(c, t) {
  const L = waterLevel(t), caution = L >= CU.caution - 1e-9;
  c.fillStyle = lin(c, 0, 0, 0, SH, [[0, '#0B1A2D'], [1, '#071426']]); ga(c, 1); c.fillRect(0, 0, SW, SH);
  statusBar(c, true);
  text(c, '3D Twin', 24, 92, { size: 34, weight: 800, color: C.PLAT });
  text(c, 'Water level at your home', 24, 124, { size: 20, weight: 600, color: C.SLATE });
  chip(c, 366, 60, caution ? 'CAUTION' : 'SAFE', caution ? '#FBBF24' : C.EMERALD, '#0F172A', 20, true);
  // scene panel
  const P = { x: 16, y: 146, w: 358, h: 392 }, G = 468, M = 190;
  fillRR(c, P.x, P.y, P.w, P.h, 26, '#0A1729'); strokeRR(c, P.x, P.y, P.w, P.h, 26, '#1B2E47', 2);
  c.save(); rr(c, P.x, P.y, P.w, P.h, 26); c.clip();
  c.strokeStyle = '#38BDF8'; c.lineWidth = 1; ga(c, 0.06);
  for (let x = P.x; x < P.x + P.w; x += 24) { c.beginPath(); c.moveTo(x, P.y); c.lineTo(x, P.y + P.h); c.stroke(); }
  for (let y = P.y; y < P.y + P.h; y += 24) { c.beginPath(); c.moveTo(P.x, y); c.lineTo(P.x + P.w, y); c.stroke(); }
  rain(c, t, P, { n: 140, alpha: 0.28, scale: 0.45, speed: 900, color: '#9FD8F7' });
  const floor = G - 0.35 * M, wire = (fn) => { fn(); c.strokeStyle = '#38BDF8'; c.lineWidth = 1.6; ga(c, 0.6); c.stroke(); };
  // house: raised floor (+0.35 m), two storeys, pitched roof
  poly(c, [[166, 176], [262, 118], [360, 176]]); c.fillStyle = '#7C3A12'; ga(c, 0.9); c.fill(); wire(() => poly(c, [[166, 176], [262, 118], [360, 176]]));
  c.fillStyle = '#12233A'; ga(c, 1); c.fillRect(176, 176, 176, floor - 176); wire(() => { c.beginPath(); c.rect(176, 176, 176, floor - 176); });
  c.strokeStyle = '#38BDF8'; ga(c, 0.35); c.beginPath(); c.moveTo(176, 262); c.lineTo(352, 262); c.stroke();
  for (const [wx, wy] of [[196, 196], [290, 196], [290, 286]]) { fillRR(c, wx, wy, 44, 42, 4, '#FDE68A', 0.35); strokeRR(c, wx, wy, 44, 42, 4, '#38BDF8', 1.2, 0.6); }
  fillRR(c, 206, 312, 40, floor - 312, 3, '#2A3F5C'); strokeRR(c, 206, 312, 40, floor - 312, 3, '#38BDF8', 1.2, 0.6);
  c.fillStyle = '#1A2E48'; ga(c, 1); c.fillRect(176, floor, 176, G - floor); wire(() => { c.beginPath(); c.rect(176, floor, 176, G - floor); });
  c.fillStyle = '#20385A'; c.fillRect(150, G - 0.30 * M, 26, 0.30 * M); wire(() => { c.beginPath(); c.rect(150, G - 0.30 * M, 26, 0.30 * M); });
  car(c, 88, G, 120, { facing: 1, body: '#1E3A5F' });
  c.fillStyle = '#060E19'; ga(c, 1); c.fillRect(P.x, G, P.w, P.y + P.h - G);          // ground + open drain
  c.fillStyle = '#0F1D30'; c.fillRect(24, G, 44, 34);
  strokeRR(c, 24, G, 44, 34, 2, '#38BDF8', 1.2, 0.5);
  // water: drain fills first, then the surface rises across the yard
  const surf = G - L * M, drainFill = clamp01(L / 0.04);
  if (L > 0) {
    c.fillStyle = 'rgba(56,189,248,0.75)'; ga(c, 1); c.fillRect(24, G + 34 - 34 * drainFill, 44, 34 * drainFill);
    c.beginPath(); c.moveTo(P.x, G);
    for (let x = P.x; x <= P.x + P.w; x += 6) c.lineTo(x, surf + Math.sin(x * 0.08 + t * 3.2) * 1.6 * clamp01(L * 20));
    c.lineTo(P.x + P.w, G); c.closePath();
    c.fillStyle = lin(c, 0, surf, 0, G, [[0, 'rgba(56,189,248,0.62)'], [1, 'rgba(22,119,255,0.72)']]); c.fill();
    c.strokeStyle = '#BAE6FD'; c.lineWidth = 2.4; ga(c, 0.9);
    c.beginPath(); for (let x = P.x; x <= P.x + P.w; x += 6) { const y = surf + Math.sin(x * 0.08 + t * 3.2) * 1.6 * clamp01(L * 20); x === P.x ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke();
  }
  // datum: porch step 0.30 m
  const dy = G - 0.30 * M, dA = 0.55 + 0.45 * prog(L, 0.2, 0.1);
  c.setLineDash([8, 7]); c.strokeStyle = C.AMBER; c.lineWidth = 2; ga(c, dA);
  c.beginPath(); c.moveTo(P.x + 8, dy); c.lineTo(P.x + P.w - 8, dy); c.stroke(); c.setLineDash([]);
  text(c, 'Porch step 0.30 m', 26, dy - 12, { size: 20, weight: 800, color: '#FCD34D', alpha: dA });
  c.restore();
  // gauge card
  fillRR(c, 16, 552, 358, 156, 26, '#0D2136'); strokeRR(c, 16, 552, 358, 156, 26, '#1B2E47', 2);
  text(c, 'WATER LEVEL', 36, 590, { size: 20, weight: 800, color: C.SLATE, ls: 2 });
  text(c, L.toFixed(2) + ' m', 36, 662, { size: 64, weight: 800, color: C.PLAT });
  if (L > 0.01) {
    const ra = prog(L, 0.01, 0.03);
    text(c, 'Rising', 354, 626, { size: 22, weight: 800, color: '#FCD34D', align: 'right', alpha: ra });
    c.strokeStyle = '#FCD34D'; c.lineWidth = 3.5; c.lineCap = 'round'; ga(c, ra);
    c.beginPath(); c.moveTo(330, 660); c.lineTo(342, 646); c.lineTo(354, 660); c.moveTo(342, 646); c.lineTo(342, 672); c.stroke();
  }
  fillRR(c, 36, 682, 318, 10, 5, '#1B2E47');
  if (L > 0.003) fillRR(c, 36, 682, 318 * L / 0.45, 10, 5, caution ? '#FBBF24' : C.EMERALD);
  for (const m of [0.15, 0.30]) { c.fillStyle = '#F8FAFC'; ga(c, 0.6); c.fillRect(36 + 318 * m / 0.45 - 1, 678, 2, 18); }
  // hero button
  const pb = spring(prog(t, CU.button, 0.8), 0.74, 10);
  if (pb > 0) {
    const press = 1 - 0.03 * (1 - Math.abs(prog(t, CU.tapButton - 0.12, 0.24) * 2 - 1)) * (t > CU.tapButton - 0.12 && t < CU.tapButton + 0.12 ? 1 : 0);
    c.save(); c.translate(195, 772 + (1 - pb) * 150); c.scale(press, press); c.translate(-195, -772);
    const pulse = prog(t, CU.button + 0.6, 1.1);
    if (pulse > 0 && pulse < 1) strokeRR(c, 16 - 14 * outCubic(pulse), 722 - 14 * outCubic(pulse), 358 + 28 * outCubic(pulse), 100 + 28 * outCubic(pulse), 30, C.EMERALD, 3, (1 - pulse) * 0.8);
    glow(c, C.EMERALD, 195, 780, 230, 80, 0.25 * pb);
    rr(c, 16, 722, 358, 100, 26); c.fillStyle = lin(c, 16, 0, 374, 0, [[0, '#10B981'], [1, '#059669']]); ga(c, pb); c.fill();
    text(c, 'Navigate to Safe Shelter', 195, 766, { size: 28, weight: 800, color: '#FFFFFF', align: 'center', alpha: pb, maxW: 330 });
    text(c, '(PPS)', 195, 800, { size: 23, weight: 700, color: '#ECFDF5', align: 'center', alpha: pb * 0.92 });
    c.restore();
  }
  tapFx(c, 195, 772, t, CU.tapButton);
}

/* ---------- shelter map: red flooded roads, route drawn around them to the PPS ---------- */
const ROUTE = [[80, 560], [80, 200], [310, 200]];
function polyLen(p) { let L = 0; for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return L; }
function polyAt(p, d) {                              // point + partial path at distance d along a polyline
  const out = [p[0]]; let acc = 0;
  for (let i = 1; i < p.length; i++) {
    const seg = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    if (acc + seg >= d) { const u = (d - acc) / seg; const q = [lerp(p[i - 1][0], p[i][0], u), lerp(p[i - 1][1], p[i][1], u)]; out.push(q); return { pt: q, path: out }; }
    acc += seg; out.push(p[i]);
  }
  return { pt: p[p.length - 1], path: out };
}
function strokePath(c, pts, col, lw, a) {
  c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
  c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; ga(c, a); c.stroke();
}
function screenMap(c, t) {
  c.fillStyle = '#EEF2F6'; ga(c, 1); c.fillRect(0, 0, SW, SH);
  c.fillStyle = '#E2E8F0';
  for (const [x, y, w, h] of [[100, 60, 84, 120], [220, 60, 74, 120], [330, 60, 60, 120], [0, 220, 62, 140], [100, 220, 84, 140], [220, 220, 74, 140], [330, 220, 60, 140], [0, 400, 62, 140], [330, 400, 60, 140], [100, 580, 84, 120], [220, 580, 74, 120]]) fillRR(c, x, y, w, h, 8, '#E2E8F0');
  c.beginPath(); c.ellipse(260, 640, 110, 70, -0.3, 0, Math.PI * 2); c.fillStyle = '#D5EFD9'; ga(c, 1); c.fill();
  c.beginPath(); c.moveTo(-20, 470); c.bezierCurveTo(120, 500, 260, 440, 420, 520); c.strokeStyle = '#BFE3F5'; c.lineWidth = 26; c.stroke();
  const roads = [[[80, 0], [80, SH]], [[200, 0], [200, SH]], [[310, 0], [310, SH]], [[0, 200], [SW, 200]], [[0, 380], [SW, 380]], [[0, 560], [SW, 560]]];
  for (const r of roads) strokePath(c, r, '#D3DAE3', 30, 1);
  for (const r of roads) strokePath(c, r, '#FFFFFF', 24, 1);
  // flood zone (app danger tokens: stroke #DC2626, fill #EF4444)
  const fz = env(t, CU.mapIn + 0.4, 0.6);
  if (fz > 0) {
    c.beginPath(); c.ellipse(205, 402, 112, 102, 0.2, 0, Math.PI * 2);
    c.fillStyle = '#EF4444'; ga(c, 0.26 * fz); c.fill(); c.strokeStyle = C.RED; c.lineWidth = 2.5; ga(c, 0.8 * fz); c.stroke();
    strokePath(c, [[200, 300], [200, 505]], C.RED, 24, 0.92 * fz);
    strokePath(c, [[102, 380], [308, 380]], C.RED, 24, 0.92 * fz);
    chip(c, 205, 424, 'Flooded road', C.RED, '#FFFFFF', 20);
  }
  // the direct line would cross the water: shown, then crossed out
  const dl = prog(t, CU.directLine, 0.5), dOut = 1 - prog(t, CU.routeStart + 0.4, 0.5);
  if (dl > 0 && dOut > 0) {
    c.setLineDash([10, 10]);
    strokePath(c, [[80, 560], [lerp(80, 310, dl), lerp(560, 200, dl)]], '#64748B', 5, 0.9 * dOut);
    c.setLineDash([]);
    const xp = outCubic(prog(t, CU.blocked, 0.3));
    if (xp > 0) {
      c.strokeStyle = C.RED; c.lineWidth = 7; c.lineCap = 'round'; ga(c, dOut);
      const s = 18 * xp; c.beginPath(); c.moveTo(195 - s, 380 - s); c.lineTo(195 + s, 380 + s); c.moveTo(195 + s, 380 - s); c.lineTo(195 - s, 380 + s); c.stroke();
    }
  }
  // safe route draws itself around the flooded roads
  const RL = polyLen(ROUTE), rp = inOutCubic(prog(t, CU.routeStart, CU.routeEnd - CU.routeStart));
  if (rp > 0) {
    const part = polyAt(ROUTE, RL * rp).path;
    strokePath(c, part, '#FFFFFF', 22, 1);
    strokePath(c, part, C.CYAN, 13, 1);
  }
  // PPS pin
  const pp = spring(prog(t, CU.mapIn + 0.6, 0.7), 0.7, 10);
  if (pp > 0) {
    c.save(); c.translate(310, 200); c.scale(lerp(0.8, 1, pp), lerp(0.8, 1, pp));
    if (rp >= 1) ring(c, 0, 0, 30 + 16 * ((t - CU.routeEnd) % 1.4) / 1.4, C.EMERALD, 3, 0.6 * (1 - ((t - CU.routeEnd) % 1.4) / 1.4));
    fillRR(c, -26, -26, 52, 52, 14, '#FFFFFF', pp); fillRR(c, -22, -22, 44, 44, 11, C.EMERALD, pp);
    shield(c, 0, 0, 13, '#FFFFFF', pp);
    c.restore();
  }
  // user location puck travels along the route
  const up = inOutCubic(prog(t, CU.puckStart, CU.puckEnd - CU.puckStart));
  const u = polyAt(ROUTE, RL * 0.62 * up).pt;
  const pul = ((t % 1.6) + 1.6) % 1.6 / 1.6;
  circle(c, u[0], u[1], 16 + 16 * pul, C.CYAN, 0.35 * (1 - pul));
  circle(c, u[0], u[1], 14, '#FFFFFF'); circle(c, u[0], u[1], 10, C.CYAN);
  // header card
  card(c, 16, 50, 358, 100, 24, '#FFFFFF');
  circle(c, 54, 100, 22, '#D1FAE5'); shield(c, 54, 100, 12, '#059669');
  const found = t >= CU.routeEnd;
  text(c, found ? 'Safe Shelter (PPS)' : 'Finding a safer route', 88, 94, { size: 26, weight: 800, color: C.INK, maxW: 272 });
  text(c, found ? 'Avoiding flooded roads' : 'Checking flooded roads', 88, 126, { size: 20, weight: 700, color: found ? '#059669' : '#64748B' });
  // ETA card (values mirror the app's NearestShelterCard)
  const pe = spring(prog(t, CU.eta, 0.8), 0.76, 10);
  if (pe > 0) {
    c.save(); c.translate(0, (1 - pe) * 260);
    card(c, 16, 600, 358, 228, 28, '#FFFFFF', 1, 0.2);
    text(c, 'NEAREST SAFE REFUGE', 36, 638, { size: 18, weight: 800, color: '#64748B', ls: 1.6 });
    text(c, 'Safe Shelter (PPS)', 36, 678, { size: 30, weight: 800, color: C.INK });
    text(c, '~7 min · 1.2 km', 36, 718, { size: 26, weight: 700, color: '#334155' });
    const cw = chip(c, 354, 692, 'Route Safe', '#D1FAE5', '#065F46', 19, true);
    fillRR(c, 36, 744, 318, 64, 18, C.CYAN);
    text(c, 'Start Navigation', 195, 786, { size: 26, weight: 800, color: '#FFFFFF', align: 'center' });
    c.restore();
  }
}

/* ---------- Family Ping ---------- */
const FAMILY = [{ n: 'Wei Ming', i: 'W', col: '#1677FF' }, { n: 'Mum', i: 'M', col: '#10B981' }, { n: 'Ah Ma', i: 'A', col: '#F59E0B' }];
function ticks(c, x, y, n, col, a) {
  for (let k = 0; k < n; k++) check(c, x + k * 11, y, 16, col, 3.5, a);
}
function screenSOS(c, t) {
  c.fillStyle = '#F8FAFC'; ga(c, 1); c.fillRect(0, 0, SW, SH);
  statusBar(c, false);
  text(c, 'Family Ping', 24, 98, { size: 36, weight: 800, color: C.INK });
  text(c, 'Shares your live location', 24, 132, { size: 22, weight: 600, color: '#64748B' });
  const tp = t - CU.sosTap;
  for (let k = 0; k < 3; k++) {
    const p = prog(tp, k * 0.25, 1.2);
    if (tp > k * 0.25 && p < 1) ring(c, 195, 302, lerp(104, 250, outCubic(p)), C.RED, 4, 0.55 * (1 - p));
  }
  circle(c, 195, 302, 126, '#FECACA', 0.55);
  const press = t > CU.sosTap - 0.12 && t < CU.sosTap + 0.12 ? 0.96 : 1;
  c.save(); c.translate(195, 302); c.scale(press, press);
  c.beginPath(); c.arc(0, 0, 104, 0, Math.PI * 2);
  c.fillStyle = lin(c, 0, -104, 0, 104, [[0, '#EF4444'], [1, '#B91C1C']]); ga(c, 1); c.fill();
  text(c, 'SOS', 0, 14, { size: 66, weight: 800, color: '#FFFFFF', align: 'center' });
  text(c, tp >= 0 ? 'Sent' : 'Tap to ping', 0, 52, { size: 22, weight: 700, color: '#FEE2E2', align: 'center' });
  c.restore();
  tapFx(c, 195, 302, t, CU.sosTap);
  FAMILY.forEach((f, i) => {
    const p = outExpo(prog(t, CU.contacts[i], 0.6));
    if (p <= 0) return;
    const y = 452 + i * 102 + (1 - p) * 40;
    card(c, 16, y, 358, 90, 22, '#FFFFFF', p, 0.1);
    strokeRR(c, 16, y, 358, 90, 22, '#E2E8F0', 1.5, p);
    circle(c, 62, y + 45, 28, f.col, p);
    text(c, f.i, 62, y + 55, { size: 28, weight: 800, color: '#FFFFFF', align: 'center', alpha: p });
    text(c, f.n, 106, y + 42, { size: 27, weight: 800, color: C.INK, alpha: p });
    const st = t >= CU.seen[i] ? 2 : t >= CU.delivered[i] ? 1 : 0;
    const lab = ['Sending…', 'Delivered', 'Seen'][st], col = ['#94A3B8', C.CYAN, '#059669'][st];
    text(c, lab, 106, y + 72, { size: 21, weight: 700, color: col, alpha: p });
    if (st === 2) {
      const sp = spring(prog(t, CU.seen[i], 0.5), 0.6, 12);
      circle(c, 334, y + 45, 22 * lerp(0.6, 1, sp), '#D1FAE5', p);
      ticks(c, 328, y + 46, 2, '#059669', p);
    } else ticks(c, 326, y + 46, st + 1, col, p * 0.9);
  });
  const pb = spring(prog(t, CU.familyOk, 0.7), 0.75, 10);
  if (pb > 0) {
    c.save(); c.translate(0, (1 - pb) * 40);
    fillRR(c, 16, 766, 358, 64, 20, '#ECFDF5', pb); strokeRR(c, 16, 766, 358, 64, 20, '#6EE7B7', 2, pb);
    circle(c, 52, 798, 16, '#10B981', pb); check(c, 52, 798, 16, '#FFFFFF', 3.5, pb);
    text(c, 'Family alerted', 82, 807, { size: 26, weight: 800, color: '#065F46', alpha: pb });
    c.restore();
  }
}

/* ---------- home (final hero): the three promises on one screen ---------- */
function navIcons(c) {
  fillRR(c, 0, 770, SW, 74, 0, '#FFFFFF'); c.fillStyle = '#E2E8F0'; ga(c, 1); c.fillRect(0, 770, SW, 1.5);
  const xs = [39, 117, 195, 273, 351];
  xs.forEach((x, i) => {
    const col = i === 0 ? C.CYAN : '#94A3B8';
    c.strokeStyle = col; c.lineWidth = 3; c.lineJoin = 'round'; ga(c, 1); c.beginPath();
    if (i === 0) { c.rect(x - 11, y0(), 9, 9); c.rect(x + 2, y0(), 9, 9); c.rect(x - 11, y0() + 13, 9, 9); c.rect(x + 2, y0() + 13, 9, 9); }
    if (i === 1) { c.moveTo(x - 12, y0() + 3); c.lineTo(x - 4, y0()); c.lineTo(x + 4, y0() + 3); c.lineTo(x + 12, y0()); c.lineTo(x + 12, y0() + 20); c.lineTo(x + 4, y0() + 23); c.lineTo(x - 4, y0() + 20); c.lineTo(x - 12, y0() + 23); c.closePath(); }
    if (i === 2) { c.rect(x - 9, y0(), 18, 23); c.moveTo(x - 4, y0() + 8); c.lineTo(x + 4, y0() + 8); c.moveTo(x - 4, y0() + 14); c.lineTo(x + 4, y0() + 14); }
    if (i === 3) { c.moveTo(x, y0() - 1); c.lineTo(x + 11, y0() + 5); c.lineTo(x + 11, y0() + 18); c.lineTo(x, y0() + 24); c.lineTo(x - 11, y0() + 18); c.lineTo(x - 11, y0() + 5); c.closePath(); }
    if (i === 4) { c.arc(x, y0() + 6, 6, 0, Math.PI * 2); c.moveTo(x + 11, y0() + 24); c.arc(x, y0() + 24, 11, 0, Math.PI, true); }
    c.stroke();
  });
  function y0() { return 790; }
  fillRR(c, 27, 826, 24, 5, 2.5, C.CYAN);
}
function screenHome(c, t) {
  c.fillStyle = '#F8FAFC'; ga(c, 1); c.fillRect(0, 0, SW, SH);
  statusBar(c, false);
  logoMark(c, 24, 66, 30, C.CYAN);
  text(c, 'FloodWay', 72, 92, { size: 32, weight: 800, color: C.INK });
  // twin card
  card(c, 16, 126, 358, 200, 26, '#0B1A2D');
  text(c, '3D TWIN', 36, 164, { size: 18, weight: 800, color: C.SLATE, ls: 1.6 });
  chip(c, 354, 142, 'CAUTION', '#FBBF24', C.INK, 18, true);
  text(c, '0.30 m', 36, 230, { size: 56, weight: 800, color: C.PLAT });
  c.save(); rr(c, 16, 126, 358, 200, 26); c.clip();
  c.beginPath(); c.moveTo(16, 326);
  for (let x = 16; x <= 374; x += 6) c.lineTo(x, 286 + Math.sin(x * 0.05 + t * 2) * 4);
  c.lineTo(374, 326); c.closePath(); c.fillStyle = lin(c, 0, 280, 0, 326, [[0, 'rgba(56,189,248,0.7)'], [1, 'rgba(22,119,255,0.8)']]); ga(c, 1); c.fill();
  c.restore();
  // shelter card
  card(c, 16, 342, 358, 196, 26, '#FFFFFF');
  text(c, 'NEAREST SAFE REFUGE', 36, 380, { size: 18, weight: 800, color: '#64748B', ls: 1.6 });
  text(c, 'Safe Shelter (PPS)', 36, 418, { size: 28, weight: 800, color: C.INK });
  text(c, '~7 min · 1.2 km', 36, 454, { size: 24, weight: 700, color: '#334155' });
  chip(c, 36, 474, 'Route Safe', '#D1FAE5', '#065F46', 19);
  // family card
  card(c, 16, 554, 358, 134, 26, '#FFFFFF');
  FAMILY.forEach((f, i) => { circle(c, 58 + i * 34, 604, 24, '#FFFFFF'); circle(c, 58 + i * 34, 604, 21, f.col); text(c, f.i, 58 + i * 34, 613, { size: 22, weight: 800, color: '#FFFFFF', align: 'center' }); });
  text(c, 'Family alerted', 36, 664, { size: 26, weight: 800, color: '#065F46' });
  circle(c, 340, 604, 20, '#D1FAE5'); ticks(c, 334, 605, 2, '#059669', 1);
  navIcons(c);
}

/* ---------- phone choreography (pure function of t) ---------- */
function phonePose(t) {
  const P = { on: false, x: 700, y: 540, s: 1.08, rx: 0, ry: 0, op: 1 };
  if (t >= CU.phoneRise && t < 42.6) {
    P.on = true;
    const pr = spring(prog(t, CU.phoneRise, 1.4), 0.8, 9);
    P.y = lerp(1600, 540, pr); P.ry = lerp(28, -6, pr); P.rx = lerp(14, 2, pr); P.s = lerp(0.95, 1.08, pr);
    const idle = prog(t, 14.3, 0.8);
    P.y += Math.sin((t - 13) * 1.15) * 7 * idle; P.ry += Math.sin((t - 13) * 0.6) * 1.5 * idle;
    const pp = inOutCubic(prog(t, 18.85, 1.05));
    P.x = lerp(P.x, 640, pp); P.s = lerp(P.s, 1.32, pp); P.ry = lerp(P.ry, 0, pp); P.rx = lerp(P.rx, 0, pp); P.y = lerp(P.y, 548, pp);
    P.s += 0.006 * Math.max(0, t - 19.9) * (1 - prog(t, 26, 1));
    P.y -= 230 * inOutCubic(prog(t, 23.4, 0.9));
    const pb = inOutCubic(prog(t, 26.0, 1.1));
    P.s = lerp(P.s, 1.04, pb); P.y = lerp(P.y, 540, pb); P.x = lerp(P.x, 660, pb); P.ry = lerp(P.ry, -3, pb);
    const pm = inOutCubic(prog(t, 34.3, 1.2));
    P.x = lerp(P.x, 1400, pm); P.s = lerp(P.s, 1.04, pm); P.ry = lerp(P.ry, -10, pm); P.rx = lerp(P.rx, 2, pm);
    P.ry += Math.sin(t * 0.7) * 1.2 * pm;
    const pe = inCubic(prog(t, 41.6, 0.9));
    P.y += 760 * pe; P.op = 1 - prog(t, 41.9, 0.6);
  } else if (t >= CU.finalPhone && t < 59.0) {
    P.on = true;
    const pr = spring(prog(t, CU.finalPhone, 1.4), 0.8, 9);
    P.x = 640; P.y = lerp(1560, 540, pr); P.s = lerp(0.9, 0.98, pr); P.ry = lerp(24, -9, pr); P.rx = lerp(12, 2, pr);
    P.y += Math.sin((t - 55) * 1.1) * 6 * prog(t, 56.2, 0.8);
    const po = inOutCubic(prog(t, CU.endCard - 0.2, 0.7));
    P.op = 1 - po; P.y -= 30 * po; P.s *= 1 - 0.04 * po;
  }
  return P;
}
function screenMix(t) {                              // [screen, alpha, dx] layers, back to front
  const L = [];
  if (t < 19.8) L.push([screenLock, 1, 0]);
  if (t >= 19.2 && t < 26.9) L.push([screenTwin, t < 19.8 ? outCubic(prog(t, 19.2, 0.6)) : 1, -SW * inOutCubic(prog(t, CU.mapIn, 0.7))]);
  const sosP = inOutCubic(prog(t, CU.sosIn, 0.7));
  if (t >= CU.mapIn && t < CU.sosIn + 0.8) L.push([screenMap, 1, SW * (1 - inOutCubic(prog(t, CU.mapIn, 0.7))) - SW * sosP]);
  if (t >= CU.sosIn) L.push([screenSOS, 1, SW * (1 - sosP)]);
  if (t >= CU.finalPhone) { L.length = 0; L.push([screenHome, 1, 0]); }
  return L;
}
let lastPhoneKey = '';
function renderPhone(t) {
  const P = phonePose(t);
  if (!P.on || P.op <= 0.002) { phoneCv.style.display = 'none'; return P; }
  phoneCv.style.display = 'block';
  phoneCv.style.opacity = P.op >= 0.998 ? '1' : P.op.toFixed(3);
  phoneCv.style.transform = 'translate(' + (P.x - 230).toFixed(2) + 'px,' + (P.y - 470).toFixed(2) + 'px) perspective(2400px) rotateX('
    + P.rx.toFixed(3) + 'deg) rotateY(' + P.ry.toFixed(3) + 'deg) scale(' + P.s.toFixed(4) + ')';
  const c = PX;
  c.setTransform(PHONE_RES, 0, 0, PHONE_RES, 0, 0);
  c.clearRect(0, 0, 460, 940);
  base(c, 1);
  drawBezel(c);
  c.save(); rr(c, SX, SY, SW, SH, 46); c.clip(); c.translate(SX, SY);
  for (const [fn, a, dx] of screenMix(t)) {
    if (a <= 0.002 || Math.abs(dx) >= SW) continue;
    c.save(); c.translate(dx, 0); base(c, a); fn(c, t); c.restore(); base(c, 1);
  }
  c.restore();
  drawGlass(c);
  return P;
}
