/* =====================================================================
   ART KIT: shot framing, sky, city, bokeh, rain, splashes, glass drops, figures, cars, logo.
   All seeded; nothing depends on anything but t.
   ===================================================================== */

/* ---------- shot framing: a shot is designed in 1920x1080 and rendered "cover" into any rect ---------- */
const FULL = { x: 0, y: 0, w: W, h: H };
function beginShot(c, R, fx, fy, zoom, alpha) {
  c.save();
  c.beginPath(); c.rect(R.x, R.y, R.w, R.h); c.clip();
  const s = Math.max(R.w / W, R.h / H) * zoom;
  c.translate(R.x + R.w / 2, R.y + R.h / 2);
  c.scale(s, s);
  c.translate(-fx, -fy);
  base(c, alpha == null ? 1 : alpha);
  return s;
}
function endShot(c) { c.restore(); base(c, 1); }

/* ---------- seeded fields (built once per seed) ---------- */
const FIELDS = {};
function field(seed, n, make) {
  const k = seed + ':' + n;
  if (FIELDS[k]) return FIELDS[k];
  const r = mulberry32(seed), a = [];
  for (let i = 0; i < n; i++) a.push(make(r, i));
  return (FIELDS[k] = a);
}

/* ---------- sky + clouds ---------- */
function sky(c, top, mid, bot, y1 = 0, y2 = H) {
  c.fillStyle = lin(c, 0, y1, 0, y2, [[0, top], [0.55, mid], [1, bot]]);
  ga(c, 1);
  c.fillRect(-400, y1 - 400, W + 800, y2 - y1 + 800);
}
function clouds(c, t, seed, y0, y1, col, a, drift = 10) {
  const f = field(seed, 26, r => ({ u: r(), v: r(), rx: 180 + r() * 320, ry: 60 + r() * 90, s: 0.5 + r() }));
  for (const b of f) {
    const x = ((b.u * 2600 + drift * b.s * t) % 2600) - 340;
    glow(c, col, x, lerp(y0, y1, b.v), b.rx, b.ry, a * (0.55 + 0.45 * b.s) / 1.5);
  }
}

/* ---------- city silhouettes: condos, towers, shoplots, palms ---------- */
function skyline(c, seed, baseY, col, winCol, winA, scale = 1, x0 = -200, x1 = W + 200) {
  const f = field(seed, 34, r => ({ w: 70 + r() * 140, h: 160 + r() * 420, gap: 6 + r() * 30, kind: r(), lit: r() }));
  let x = x0, i = 0;
  while (x < x1) {
    const b = f[i % f.length]; i++;
    const bw = b.w * scale, bh = b.h * scale;
    c.fillStyle = col; ga(c, 1);
    c.fillRect(x, baseY - bh, bw, bh + 2);
    if (b.kind > 0.72) c.fillRect(x + bw * 0.3, baseY - bh - 30 * scale, bw * 0.4, 32 * scale);  // rooftop plant room
    // lit windows (seeded per building)
    const rr_ = mulberry32(seed * 131 + i);
    const cols = Math.max(2, Math.floor(bw / (18 * scale))), rows = Math.floor(bh / (22 * scale));
    c.fillStyle = winCol;
    for (let yy = 1; yy < rows; yy++) for (let xx = 0; xx < cols; xx++) {
      const p = rr_();
      if (p < 0.16 * b.lit + 0.03) { ga(c, winA * (0.4 + rr_() * 0.6)); c.fillRect(x + 6 * scale + xx * (bw - 12 * scale) / cols, baseY - bh + yy * 22 * scale, 7 * scale, 9 * scale); }
    }
    x += bw + b.gap * scale;
  }
}
function palm(c, x, y, h, col, a = 1, sway = 0) {
  c.strokeStyle = col; c.fillStyle = col; ga(c, a);
  c.lineWidth = h * 0.035; c.lineCap = 'round';
  const tx = x + h * 0.12 + sway, ty = y - h;
  c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + h * 0.02, y - h * 0.6, tx, ty); c.stroke();
  c.lineWidth = h * 0.028;
  for (let k = 0; k < 7; k++) {
    const ang = -Math.PI + k * (Math.PI / 6) + sway * 0.002;
    const ex = tx + Math.cos(ang) * h * 0.42, ey = ty + Math.sin(ang) * h * 0.18 + h * 0.16;
    c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo((tx + ex) / 2, ty - h * 0.12, ex, ey); c.stroke();
  }
}
function lamp(c, x, y, h, a = 1) {                   // street lamp with sodium glow
  c.strokeStyle = '#0A1220'; ga(c, a); c.lineWidth = 7; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h); c.lineTo(x + h * 0.18, y - h - 10); c.stroke();
  glow(c, '#FBBF77', x + h * 0.18, y - h - 4, 90, 90, 0.55 * a);
  glow(c, '#FDE7C4', x + h * 0.18, y - h - 4, 22, 22, 0.9 * a, 0.3);
}

/* ---------- bokeh (pre-softened, so it reads as shallow depth of field) ---------- */
function bokeh(c, t, seed, n, R, cols, a, rMin, rMax, drift = 0) {
  const f = field(seed, n, r => ({ u: r(), v: r(), r: r(), ci: r(), ph: r() * 6.283, sp: 0.4 + r() }));
  for (const b of f) {
    const x = R.x + ((b.u * R.w + drift * b.sp * t) % R.w + R.w) % R.w;
    const y = R.y + b.v * R.h, rad_ = lerp(rMin, rMax, b.r);
    const tw_ = 0.75 + 0.25 * Math.sin(t * 1.3 * b.sp + b.ph);
    glow(c, cols[Math.floor(b.ci * cols.length)], x, y, rad_, rad_, a * tw_, 0.45);
  }
}
function reflections(c, t, seed, n, x0, x1, y0, len, cols, a) {   // vertical light streaks on wet ground
  const f = field(seed, n, r => ({ u: r(), w: 10 + r() * 26, ci: r(), ph: r() * 6.283, l: 0.5 + r() * 0.5 }));
  for (const b of f) {
    const x = lerp(x0, x1, b.u), sh = 0.7 + 0.3 * Math.sin(t * 2.1 + b.ph);
    glow(c, cols[Math.floor(b.ci * cols.length)], x, y0 + len * b.l * 0.5, b.w, len * b.l * 0.5, a * sh);
  }
}

/* ---------- rain: three depth layers, each stroked as one batched path ---------- */
const RAIN = field(777, 900, r => ({ u: r(), v: r(), sp: 0.75 + r() * 0.5, l: r(), d: r() }));
function rain(c, t, R, o) {
  const n = Math.min(RAIN.length, Math.floor(o.n || 300)), slant = o.slant == null ? 0.18 : o.slant;
  const speed = o.speed || 1500, len = o.len || 70, col = o.color || '#BFE3F5', s = o.scale || 1;
  const layers = [[0.0, 0.35, 0.6, 0.35], [0.35, 0.8, 1.1, 0.55], [0.8, 1.0, 2.2, 0.85]];
  const span = R.h + len * 3 * s;
  c.save();
  c.beginPath(); c.rect(R.x, R.y, R.w, R.h); c.clip();
  c.strokeStyle = col; c.lineCap = 'round';
  for (const [d0, d1, lw, la] of layers) {
    c.beginPath();
    for (let i = 0; i < n; i++) {
      const d = RAIN[i];
      if (d.d < d0 || d.d >= d1) continue;
      const depth = 0.5 + d.d;                      // near drops fall faster and are longer
      const L = len * s * depth * (0.7 + d.l * 0.6);
      const y = R.y - L + ((d.v * span + speed * s * depth * d.sp * t) % span);
      const x = R.x + ((d.u * (R.w + 300) - y * slant) % (R.w + 300) + (R.w + 300)) % (R.w + 300) - 150;
      c.moveTo(x, y); c.lineTo(x - L * slant, y + L);
    }
    c.lineWidth = lw * s; ga(c, (o.alpha == null ? 0.5 : o.alpha) * la);
    c.stroke();
  }
  c.restore();
}
function splashes(c, t, seed, n, x0, x1, y0, y1, a, size = 26, col = '#CFE8F7') {
  const f = field(seed, n, r => ({ u: r(), v: r(), p: 0.5 + r() * 0.9, ph: r() * 3, s: 0.6 + r() * 0.8 }));
  c.strokeStyle = col; c.lineWidth = 1.6;
  for (const b of f) {
    const local = (((t + b.ph) % b.p) + b.p) % b.p / 0.42;
    if (local >= 1) continue;
    const persp = lerp(0.45, 1.25, b.v);
    const x = lerp(x0, x1, b.u), y = lerp(y0, y1, b.v), r_ = size * b.s * persp * (0.25 + 0.75 * outCubic(local));
    ga(c, a * (1 - local) * 0.9);
    c.beginPath(); c.ellipse(x, y, r_, r_ * 0.26, 0, 0, Math.PI * 2); c.stroke();
    if (local < 0.35) {                              // crown droplets
      const up = outCubic(local / 0.35) * 14 * persp;
      circle(c, x - r_ * 0.5, y - up, 1.6 * persp, col, a * (1 - local));
      circle(c, x + r_ * 0.4, y - up * 1.2, 1.4 * persp, col, a * (1 - local));
    }
  }
}
function glassDrops(c, t, seed, n, R, a, rMax = 9) {    // droplets on glass / visor, a few sliding down
  const f = field(seed, n, r => ({ u: r(), v: r(), r: 2 + r() * rMax, sl: r() < 0.22 ? 20 + r() * 60 : 0 }));
  for (const d of f) {
    const x = R.x + d.u * R.w, y = R.y + ((d.v * R.h + d.sl * t) % R.h);
    circle(c, x, y, d.r, '#DDEFFB', a * 0.16);
    circle(c, x - d.r * 0.3, y - d.r * 0.35, d.r * 0.32, '#FFFFFF', a * 0.55);
    if (d.sl) { c.strokeStyle = '#DDEFFB'; c.lineWidth = d.r * 0.5; ga(c, a * 0.08); c.beginPath(); c.moveTo(x, y - d.r * 6); c.lineTo(x, y); c.stroke(); }
  }
}

/* ---------- people: dignified rim-lit silhouettes ---------- */
function silhouette(c, x, y, h, o) {
  const k = o.kind || 'man', child = k === 'child';
  const hr = h * (child ? 0.095 : 0.066), lean = (o.lean || 0) * h;
  const ys = y - h * (child ? 0.74 : 0.8), sw = h * (child ? 0.11 : 0.125), yw = y - h * 0.47;
  const hx = x + lean, hy = y - h + hr + (k === 'elder' ? h * 0.02 : 0);
  c.moveTo(x - sw, ys + h * 0.03);
  c.quadraticCurveTo(x - sw, ys - h * 0.02, x - sw * 0.5 + lean * 0.5, ys - h * 0.03);
  c.lineTo(x + sw * 0.5 + lean * 0.5, ys - h * 0.03);
  c.quadraticCurveTo(x + sw, ys - h * 0.02, x + sw, ys + h * 0.03);
  if (o.dress) {                                     // baju kurung / long dress
    c.lineTo(x + h * 0.1, yw); c.quadraticCurveTo(x + h * 0.15, y - h * 0.1, x + h * 0.14, y);
    c.lineTo(x - h * 0.14, y); c.quadraticCurveTo(x - h * 0.15, y - h * 0.1, x - h * 0.1, yw);
  } else {
    c.lineTo(x + h * 0.1, yw); c.lineTo(x + h * 0.082, y); c.lineTo(x + h * 0.02, y);
    c.lineTo(x + h * 0.004, y - h * 0.4); c.lineTo(x - h * 0.004, y - h * 0.4);
    c.lineTo(x - h * 0.02, y); c.lineTo(x - h * 0.082, y); c.lineTo(x - h * 0.1, yw);
  }
  c.closePath();
  c.moveTo(hx + h * 0.03, ys - h * 0.06); c.rect(hx - h * 0.028, ys - h * 0.065, h * 0.056, h * 0.05);
  if (o.hijab) {
    c.moveTo(hx + hr * 1.2, hy);
    c.ellipse(hx, hy + hr * 0.1, hr * 1.2, hr * 1.3, 0, 0, Math.PI * 2);
    c.moveTo(hx - hr * 1.15, hy + hr * 0.3);
    c.quadraticCurveTo(x - sw * 1.1, ys + h * 0.02, x - sw * 0.95, ys + h * 0.12);
    c.lineTo(x + sw * 0.95, ys + h * 0.12);
    c.quadraticCurveTo(x + sw * 1.1, ys + h * 0.02, hx + hr * 1.15, hy + hr * 0.3);
    c.closePath();
  } else {
    c.moveTo(hx + hr, hy); c.arc(hx, hy, hr, 0, Math.PI * 2);
    if (o.bun) { c.moveTo(hx - hr * 0.2 + hr * 0.5, hy - hr); c.arc(hx - hr * 0.2, hy - hr * 0.95, hr * 0.5, 0, Math.PI * 2); }
  }
  return { hx, hy, hr, ys, sw };
}
function arms(c, x, y, h, o, g) {
  const side = o.side || 1, pose = o.pose || 'down';
  c.lineWidth = h * 0.048; c.lineCap = 'round'; c.lineJoin = 'round';
  const sx = x + side * g.sw * 0.85, sy = g.ys + h * 0.04, ox = x - side * g.sw * 0.85;
  c.beginPath();
  if (pose === 'phone') { c.moveTo(sx, sy); c.lineTo(x + side * h * 0.11, y - h * 0.58); c.lineTo(x + side * h * 0.045, y - h * 0.665); }
  else if (pose === 'umbrella') { c.moveTo(sx, sy); c.lineTo(x + side * h * 0.13, y - h * 0.66); c.lineTo(x + side * h * 0.07, y - h * 0.84); }
  else { c.moveTo(sx, sy); c.lineTo(x + side * h * 0.125, y - h * 0.5); }
  if (o.hold) { c.moveTo(ox, sy); c.lineTo(x - side * h * 0.17, y - h * 0.47); }
  else { c.moveTo(ox, sy); c.lineTo(x - side * h * 0.125, y - h * 0.5); }
  c.stroke();
}
/* person(c, x, y, h, o): kind, hijab, dress, bun, lean, side, pose ('phone'|'umbrella'|'down'), hold, body, rim, rimA, glowA */
function person(c, x, y, h, o = {}) {
  const side = o.side || 1, body = o.body || '#07101C', rim = o.rim || '#9FD8F7';
  for (let pass = 0; pass < 2; pass++) {
    c.save();
    if (pass === 0) c.translate((o.rimSide || -side) * h * 0.012, -h * 0.004);
    c.beginPath();
    const g = silhouette(c, x, y, h, o);
    c.fillStyle = pass ? body : rim; c.strokeStyle = pass ? body : rim;
    ga(c, pass ? 1 : (o.rimA == null ? 0.8 : o.rimA));
    c.fill();
    arms(c, x, y, h, o, g);
    c.restore();
    if (pass === 1 && o.pose === 'phone') {
      const px = x + side * h * 0.045, py = y - h * 0.665;
      fillRR(c, px - h * 0.018, py - h * 0.05, h * 0.036, h * 0.06, h * 0.006, '#0B1220');
      fillRR(c, px - h * 0.014, py - h * 0.046, h * 0.028, h * 0.052, h * 0.004, '#8FD3FF', 0.9);
      c.globalCompositeOperation = 'screen';
      glow(c, '#6CC4FF', px, py - h * 0.02, h * 0.16, h * 0.16, 0.5 * (o.glowA == null ? 1 : o.glowA));
      glow(c, '#6CC4FF', g.hx + side * g.hr * 0.4, g.hy + g.hr * 0.2, g.hr * 1.6, g.hr * 1.6, 0.42 * (o.glowA == null ? 1 : o.glowA));
      c.globalCompositeOperation = 'source-over';
    }
    if (pass === 1 && o.pose === 'umbrella') umbrella(c, x + side * h * 0.07, y - h * 0.84, h, o.umb || '#1E3A5F');
  }
}
function umbrella(c, x, y, h, col) {
  c.strokeStyle = '#0B1320'; c.lineWidth = h * 0.012; ga(c, 1);
  c.beginPath(); c.moveTo(x, y + h * 0.04); c.lineTo(x, y - h * 0.32); c.stroke();
  const cy = y - h * 0.3, rw = h * 0.36;
  c.beginPath(); c.moveTo(x - rw, cy);
  c.quadraticCurveTo(x - rw * 0.9, cy - h * 0.2, x, cy - h * 0.22);
  c.quadraticCurveTo(x + rw * 0.9, cy - h * 0.2, x + rw, cy);
  for (let k = 3; k >= 0; k--) c.quadraticCurveTo(x - rw + (k + 0.5) * rw / 2, cy - h * 0.035, x - rw + k * rw / 2, cy);
  c.closePath(); c.fillStyle = col; c.fill();
  c.strokeStyle = '#9FD8F7'; c.lineWidth = 2; ga(c, 0.5);
  c.beginPath(); c.moveTo(x - rw * 0.95, cy - h * 0.02); c.quadraticCurveTo(x - rw * 0.8, cy - h * 0.2, x, cy - h * 0.22); c.stroke();
}

/* ---------- vehicles ---------- */
function car(c, x, y, w, o = {}) {                   // side view, y = ground, facing +1 right / -1 left
  const f = o.facing || 1, h = w * 0.34, col = o.body || '#0C1624';
  c.save(); c.translate(x, y); c.scale(f, 1);
  c.beginPath();
  c.moveTo(-w * 0.5, -h * 0.25);
  c.quadraticCurveTo(-w * 0.5, -h * 0.62, -w * 0.4, -h * 0.64);
  c.lineTo(-w * 0.28, -h * 0.66);
  c.quadraticCurveTo(-w * 0.16, -h * 1.04, w * 0.08, -h * 1.02);
  c.quadraticCurveTo(w * 0.22, -h * 1.0, w * 0.3, -h * 0.66);
  c.quadraticCurveTo(w * 0.5, -h * 0.6, w * 0.5, -h * 0.34);
  c.lineTo(w * 0.5, -h * 0.12); c.lineTo(-w * 0.5, -h * 0.12); c.closePath();
  c.fillStyle = col; ga(c, 1); c.fill();
  c.beginPath();                                     // windows with sky reflection
  c.moveTo(-w * 0.22, -h * 0.68); c.quadraticCurveTo(-w * 0.13, -h * 0.94, w * 0.07, -h * 0.93);
  c.quadraticCurveTo(w * 0.18, -h * 0.9, w * 0.24, -h * 0.68); c.closePath();
  c.fillStyle = lin(c, 0, -h, 0, -h * 0.6, [[0, '#2B4A6B'], [1, '#0E1B2C']]); ga(c, 0.9); c.fill();
  c.strokeStyle = '#8FC9EE'; c.lineWidth = 2; ga(c, 0.35);
  c.beginPath(); c.moveTo(-w * 0.5, -h * 0.3); c.quadraticCurveTo(0, -h * 0.36, w * 0.5, -h * 0.3); c.stroke();
  for (const wx of [-w * 0.3, w * 0.3]) { circle(c, wx, -h * 0.12, h * 0.21, '#05090F'); circle(c, wx, -h * 0.12, h * 0.1, '#1C2A3A'); }
  if (o.tail) glow(c, '#FF3B3B', -w * 0.49, -h * 0.4, w * 0.12, h * 0.25, o.tail);
  if (o.head) { glow(c, '#FFF3D6', w * 0.49, -h * 0.35, w * 0.14, h * 0.25, o.head); glow(c, '#FFF3D6', w * 0.9, -h * 0.1, w * 0.45, h * 0.18, o.head * 0.25); }
  c.restore();
}

/* ---------- FloodWay wave mark (vector redraw of assets/floodway logo.png), in a 100 x 72 box ---------- */
function logoPath(c) {
  c.beginPath();
  c.moveTo(6, 49);
  c.bezierCurveTo(28, 44, 42, 30, 50, 15);
  c.bezierCurveTo(57, 3, 72, -1, 83, 6);
  c.bezierCurveTo(92, 12, 93, 25, 86, 30);
  c.bezierCurveTo(80, 34, 71, 31, 70.5, 24.5);
  c.bezierCurveTo(70.2, 19.5, 75, 16.5, 79.5, 19);
  c.bezierCurveTo(75, 11, 63, 12.5, 59.5, 22.5);
  c.bezierCurveTo(56, 33, 63, 43.5, 76, 44.5);
  c.bezierCurveTo(85, 45, 92, 42, 97, 37.5);
  c.bezierCurveTo(91, 48.5, 77, 53, 62, 53);
  c.bezierCurveTo(42, 53, 24, 51, 6, 49);
  c.closePath();
  c.moveTo(2, 59);
  c.bezierCurveTo(30, 50, 60, 66, 99, 50);
  c.bezierCurveTo(90, 62, 70, 67, 55, 65);
  c.bezierCurveTo(36, 63, 20, 58, 2, 59);
  c.closePath();
  c.moveTo(16, 67);
  c.bezierCurveTo(42, 62, 66, 73, 93, 61);
  c.bezierCurveTo(84, 71, 66, 74, 52, 72.5);
  c.bezierCurveTo(38, 71, 28, 68, 16, 67);
  c.closePath();
}
// draws the mark with its left edge at x, top at y, height hgt; p = draw-in progress (clip wipe left->right)
function logoMark(c, x, y, hgt, fill, a = 1, p = 1) {
  if (p <= 0 || a <= 0) return;
  const s = hgt / 72;
  c.save();
  c.beginPath(); c.rect(x - 4, y - 8, (100 * s + 8) * clamp01(p), hgt + 16); c.clip();
  c.translate(x, y); c.scale(s, s);
  logoPath(c);
  c.fillStyle = fill; ga(c, a); c.fill();
  c.restore();
}
