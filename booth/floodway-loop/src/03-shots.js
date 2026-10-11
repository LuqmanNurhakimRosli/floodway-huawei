/* =====================================================================
   SHOTS: illustrative Malaysian rain scenes (generic places, no real locations).
   Each shot(c, t, R, o) renders "cover" into rect R with its own slow camera push.
   o.calm softens rain for the "after" states in S8.
   ===================================================================== */
const WARM = ['#F8C77E', '#FFE2B0', '#FF9E5E'], COOL = ['#9FD8F7', '#E6F4FF', '#7FB8E6'], BRAKE = ['#FF4D4D', '#FF6B5B', '#FFB37A'];

function shotSky(c, t, R, o = {}) {                  // monsoon clouds over a Malaysian city at dusk
  const lt = t - (o.t0 || 0);
  beginShot(c, R, 960, 500 + lt * 22, 1.0 + lt * 0.02, o.a);
  sky(c, '#081322', '#1A2B42', '#2E4460');
  clouds(c, t, 21, 60, 420, '#33475F', 0.95, 14);
  clouds(c, t, 22, 120, 360, '#56708D', 0.35, 20);
  skyline(c, 23, 770, '#0F1B2C', '#F8C77E', 0.55, 1.1);
  skyline(c, 24, 870, '#08111D', '#FFD9A0', 0.5, 1.6, -300, W + 300);
  for (const [x, hh] of [[120, 330], [260, 280], [1640, 340], [1790, 300]]) palm(c, x, 880, hh, '#050A12', 1, Math.sin(t * 1.1 + x) * 6);
  c.fillStyle = lin(c, 0, 860, 0, H, [[0, '#0D1726'], [1, '#04070D']]); ga(c, 1); c.fillRect(-200, 860, W + 400, 400);
  reflections(c, t, 25, 34, 0, W, 870, 230, WARM.concat(COOL), 0.22);
  lamp(c, 420, 880, 300); lamp(c, 1320, 880, 300);
  rain(c, t, { x: -200, y: -100, w: W + 400, h: H + 200 }, { n: lerp(160, 460, prog(lt, 0, 1.2)), alpha: 0.42 });
  splashes(c, t, 26, 60, 0, W, 900, 1070, 0.6, 22);
  endShot(c);
}

function shotRoad(c, t, R, o = {}) {                 // macro: rain hitting wet asphalt
  const lt = t - (o.t0 || 0);
  beginShot(c, R, 960, 560, 1.02 + lt * 0.03, o.a);
  sky(c, '#0B1524', '#16263B', '#1C2E44', 0, 560);
  bokeh(c, t, 11, 46, { x: -100, y: 170, w: W + 200, h: 360 }, WARM.concat(COOL, ['#FF6B5B']), 0.5, 22, 80, -8);
  c.fillStyle = lin(c, 0, 500, 0, H, [[0, '#142236'], [0.3, '#0B1422'], [1, '#04070C']]); ga(c, 1); c.fillRect(-100, 500, W + 200, 700);
  reflections(c, t, 12, 28, 0, W, 520, 520, WARM.concat(COOL), 0.3);
  c.fillStyle = '#DCE6EF';
  for (let k = 0; k < 7; k++) {                       // lane dashes in perspective
    const p = (k + (lt * 0.8) % 1) / 7, y = 530 + p * p * 600, s = 0.2 + p * 1.6;
    ga(c, 0.22 * p); poly(c, [[1080 + p * 420, y], [1080 + p * 420 + 14 * s, y], [1080 + p * 470 + 24 * s, y + 60 * s], [1080 + p * 470 + 8 * s, y + 60 * s]]); c.fill();
  }
  splashes(c, t, 13, 110, -50, W + 50, 560, 1070, 0.95, 42);
  rain(c, t, { x: -200, y: -100, w: W + 400, h: H + 200 }, { n: 520, alpha: 0.5, scale: 1.35, speed: 1700 });
  endShot(c);
}

function shotAisyah(c, t, R, o = {}) {              // condo lobby: Aisyah checks her phone before heading out
  const lt = t - (o.t0 || 0), calm = o.calm ? 0.4 : 1;
  beginShot(c, R, o.fx || 900, o.fy || 560, (o.z || 1.02) + lt * 0.025, o.a);
  c.fillStyle = '#060C16'; ga(c, 1); c.fillRect(-200, -200, W + 400, H + 400);
  const D = { x: 640, y: 150, w: 1140, h: 850 };
  c.save(); c.beginPath(); c.rect(D.x, D.y, D.w, D.h); c.clip();
  sky(c, '#15263B', '#23395A', '#2C4666', D.y, D.y + D.h);
  bokeh(c, t, 31, 26, { x: D.x, y: 560, w: D.w, h: 180 }, WARM.concat(COOL, ['#FF6B5B']), 0.55, 16, 46, 14);
  c.fillStyle = '#0D1828'; ga(c, 1); c.fillRect(D.x, D.y, D.w, 120);                // covered walkway roof
  for (let x = D.x + 80; x < D.x + D.w; x += 260) c.fillRect(x, D.y + 110, 34, 560);   // walkway pillars
  c.fillStyle = lin(c, 0, 800, 0, D.y + D.h, [[0, '#1B2C42'], [1, '#0A1422']]); c.fillRect(D.x, 800, D.w, 220);
  reflections(c, t, 32, 16, D.x, D.x + D.w, 805, 170, WARM.concat(COOL), 0.3);
  rain(c, t, D, { n: 380 * calm, alpha: 0.5 });
  splashes(c, t, 33, 30, D.x, D.x + D.w, 820, 990, 0.5 * calm, 18);
  c.restore();
  c.fillStyle = '#0A1320'; ga(c, 1);                                                   // door frame + mullion
  c.fillRect(D.x - 26, D.y - 26, 26, D.h + 26); c.fillRect(D.x + D.w, D.y - 26, 26, D.h + 26);
  c.fillRect(D.x - 26, D.y - 26, D.w + 52, 26); c.fillRect(D.x + D.w / 2 - 9, D.y, 18, D.h);
  glassDrops(c, t, 34, 80 * calm, D, 0.8);
  glow(c, '#9FC4E8', 1200, 1040, 700, 60, 0.18);                                       // polished floor reflection
  glow(c, '#FFD9A0', 200, 90, 380, 220, 0.16);
  person(c, 470, 1010, 760, { kind: 'woman', hijab: true, dress: true, pose: 'phone', side: 1, rimSide: 1, body: '#04080F', rim: '#A9D8F5', rimA: 0.85 });
  endShot(c);
}

function shotKumar(c, t, R, o = {}) {               // delivery rider on a scooter, side profile, wet street at night
  const lt = t - (o.t0 || 0), calm = o.calm ? 0.4 : 1;
  beginShot(c, R, (o.fx || 980) - lt * 14, o.fy || 560, (o.z || 1.0) + lt * 0.03, o.a);
  sky(c, '#0A1422', '#132236', '#101B2B');
  bokeh(c, t, 41, 60, { x: -100, y: 120, w: W + 200, h: 560 }, WARM.concat(COOL, BRAKE), 0.55, 24, 100, -34);
  c.fillStyle = lin(c, 0, 860, 0, H, [[0, '#101A28'], [1, '#04070C']]); ga(c, 1); c.fillRect(-200, 860, W + 400, 300);
  reflections(c, t, 42, 26, 0, W, 866, 210, WARM.concat(BRAKE), 0.3);
  const X = 960, G = 900, bob = Math.sin(t * 7) * 2;
  c.save(); c.translate(0, bob);
  glow(c, '#FFF3D6', X - 520, G - 150, 360, 90, 0.35);                                  // headlight beam
  glow(c, '#FFF3D6', X - 330, G - 160, 50, 40, 0.9, 0.3);
  glow(c, '#FF3B3B', X + 330, G - 190, 60, 40, 0.8);
  const body = '#070C15', rim = '#A9D8F5';
  for (let pass = 0; pass < 2; pass++) {
    c.save(); if (!pass) c.translate(-6, -4);
    c.fillStyle = pass ? body : rim; c.strokeStyle = pass ? body : rim; ga(c, pass ? 1 : 0.75);
    c.beginPath();                                                                         // scooter body
    c.moveTo(X - 340, G - 150); c.quadraticCurveTo(X - 360, G - 250, X - 280, G - 330); c.lineTo(X - 240, G - 330);
    c.quadraticCurveTo(X - 250, G - 220, X - 150, G - 140); c.lineTo(X + 150, G - 150);
    c.quadraticCurveTo(X + 200, G - 250, X + 340, G - 230); c.quadraticCurveTo(X + 380, G - 170, X + 320, G - 110);
    c.lineTo(X - 300, G - 100); c.closePath(); c.fill();
    c.fillRect(X + 90, G - 420, 200, 180);                                                 // delivery box (generic)
    c.lineWidth = 22; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(X - 270, G - 330); c.lineTo(X - 240, G - 440); c.lineTo(X - 300, G - 470); c.stroke();   // steering column + bar
    c.beginPath();                                                                         // rider: torso leaning to the bars
    c.moveTo(X + 80, G - 250); c.quadraticCurveTo(X + 60, G - 420, X - 20, G - 520);
    c.lineTo(X + 40, G - 570); c.quadraticCurveTo(X + 150, G - 450, X + 150, G - 250); c.closePath(); c.fill();
    c.lineWidth = 44;
    c.beginPath(); c.moveTo(X + 20, G - 520); c.lineTo(X - 140, G - 450); c.lineTo(X - 280, G - 460); c.stroke();    // arm
    c.beginPath(); c.moveTo(X + 110, G - 260); c.lineTo(X - 60, G - 240); c.lineTo(X - 90, G - 130); c.stroke();     // leg
    c.beginPath(); c.arc(X + 20, G - 630, 78, 0, Math.PI * 2); c.fill();                   // helmet
    c.restore();
  }
  for (const wx of [X - 250, X + 250]) { circle(c, wx, G - 60, 72, '#04070C'); ring(c, wx, G - 60, 72, '#5B6B80', 3, 0.5); circle(c, wx, G - 60, 26, '#1C2A3A'); }
  c.save(); c.beginPath(); c.arc(X + 20, G - 630, 78, Math.PI * 0.62, Math.PI * 1.35); c.lineTo(X - 10, G - 640); c.closePath(); c.clip();
  c.fillStyle = lin(c, X - 60, G - 700, X + 10, G - 570, [[0, '#23364F'], [1, '#05080E']]); ga(c, 1); c.fillRect(X - 70, G - 720, 120, 200);
  for (let k = 0; k < 5; k++) glow(c, k % 2 ? '#FFD39A' : '#E6F4FF', X - 50 + ((k * 23 + lt * 90) % 70), G - 680 + k * 22, 30, 5, 0.8);
  c.restore();
  glow(c, '#E6F4FF', X + 40, G - 690, 40, 18, 0.35);
  c.fillStyle = '#C9D6E2'; ga(c, 0.45); c.fillRect(X + 90, G - 350, 200, 12);              // reflective tape
  c.strokeStyle = '#C9D6E2'; c.lineWidth = 8; ga(c, 0.35); c.beginPath(); c.moveTo(X + 40, G - 540); c.lineTo(X + 130, G - 380); c.stroke();
  c.save(); c.translate(X - 270, G - 500); c.rotate(-0.3);                                 // handlebar phone mount
  fillRR(c, -26, -44, 52, 88, 8, '#05080E'); fillRR(c, -21, -39, 42, 78, 5, '#1D6FD8', 0.95);
  c.globalCompositeOperation = 'screen'; glow(c, '#6CC4FF', 0, 0, 150, 150, 0.45); c.globalCompositeOperation = 'source-over';
  c.restore();
  c.restore();
  splashes(c, t, 44, 60 * calm, 0, W, 880, 1060, 0.7, 26);
  for (let k = 0; k < 10; k++) {                                                            // spray off the rear wheel
    const u = ((lt * 2.2 + k / 10) % 1);
    circle(c, X + 250 + u * 220, G - 40 - Math.sin(u * Math.PI) * 60, 3 + u * 3, '#CFE8F7', 0.4 * (1 - u) * calm);
  }
  rain(c, t, { x: -200, y: -100, w: W + 400, h: H + 200 }, { n: 440 * calm, alpha: 0.45, scale: 1.2 });
  endShot(c);
}

function shotMeiLing(c, t, R, o = {}) {              // open-air car park: Mei Ling and two kids head to the car
  const lt = t - (o.t0 || 0), calm = o.calm ? 0.4 : 1, phone = o.variant === 'phone';
  beginShot(c, R, (o.fx || 980) + lt * 10, o.fy || 600, (o.z || 1.0) + lt * 0.03, o.a);
  sky(c, '#0B1524', '#18283D', '#22354D');
  clouds(c, t, 51, 40, 260, '#2C3F57', 0.7, 8);
  c.fillStyle = '#0E1A2A'; ga(c, 1); c.fillRect(-200, 430, W + 400, 300);             // mall block (generic)
  c.fillStyle = '#FFE2B0'; ga(c, 0.25); c.fillRect(-200, 520, W + 400, 10);
  for (const x of [300, 1100, 1750]) lamp(c, x, 740, 340);
  c.fillStyle = lin(c, 0, 720, 0, H, [[0, '#101B2A'], [1, '#05080E']]); ga(c, 1); c.fillRect(-200, 720, W + 400, 400);
  c.strokeStyle = '#DCE6EF'; c.lineWidth = 5; ga(c, 0.18);
  for (let k = -2; k < 9; k++) { c.beginPath(); c.moveTo(k * 260, 760); c.lineTo(k * 260 - 220, H); c.stroke(); }
  reflections(c, t, 52, 20, 0, W, 745, 300, WARM, 0.32);
  car(c, 1380, 930, 640, { facing: -1, body: '#0B1522', tail: 0.75 });
  person(c, 830, 965, 560, { kind: 'woman', bun: true, pose: phone ? 'phone' : 'umbrella', hold: true, side: 1, rimSide: -1, body: '#05090F', rim: '#FFD39A', rimA: 0.7, umb: '#23405F' });
  person(c, 700, 965, 330, { kind: 'child', pose: 'down', side: -1, body: '#070C14', rim: '#FFD39A', rimA: 0.6 });
  person(c, 590, 965, 290, { kind: 'child', bun: true, pose: 'down', side: -1, body: '#070C14', rim: '#FFD39A', rimA: 0.6 });
  rain(c, t, { x: -200, y: -100, w: W + 400, h: H + 200 }, { n: 520 * calm, alpha: 0.48 });
  splashes(c, t, 53, 70 * calm, -100, W + 100, 760, 1070, 0.7, 26);
  endShot(c);
}

function shotNenek(c, t, R, o = {}) {                // ground-floor home: Nenek watches the rain through the grille
  const lt = t - (o.t0 || 0), calm = o.calm ? 0.4 : 1;
  beginShot(c, R, o.fx || 1000, o.fy || 560, (o.z || 1.03) + lt * 0.03, o.a);
  c.fillStyle = lin(c, 0, 0, W, 0, [[0, '#23170E'], [1, '#120C08']]); ga(c, 1); c.fillRect(-200, -200, W + 400, H + 400);
  glow(c, '#FFB25E', 180, 260, 520, 460, 0.35);                                        // warm lamp
  const Wn = { x: 720, y: 170, w: 980, h: 690 };
  c.save(); c.beginPath(); c.rect(Wn.x, Wn.y, Wn.w, Wn.h); c.clip();
  sky(c, '#0D1A2C', '#17293F', '#1F3550', Wn.y, Wn.y + Wn.h);
  c.fillStyle = '#0A1320'; ga(c, 1);
  for (let k = 0; k < 5; k++) {                                                        // terrace houses across the road
    const x = Wn.x - 60 + k * 240;
    poly(c, [[x, 620], [x + 120, 520], [x + 240, 620], [x + 240, 760], [x, 760]]); c.fill();
    c.fillStyle = '#FFD39A'; ga(c, k % 2 ? 0.5 : 0.18); c.fillRect(x + 90, 650, 60, 40); c.fillStyle = '#0A1320'; ga(c, 1);
  }
  lamp(c, Wn.x + 780, 780, 260);
  c.fillStyle = lin(c, 0, 760, 0, Wn.y + Wn.h, [[0, '#13202F'], [1, '#08101A']]); ga(c, 1); c.fillRect(Wn.x, 760, Wn.w, 120);
  reflections(c, t, 61, 10, Wn.x, Wn.x + Wn.w, 765, 90, WARM, 0.35);
  rain(c, t, Wn, { n: 320 * calm, alpha: 0.5 });
  glassDrops(c, t, 62, 70 * calm, Wn, 0.8);
  c.restore();
  c.strokeStyle = '#080604'; ga(c, 1); c.lineWidth = 9;                              // window grille with diamond motif
  for (let x = Wn.x + 70; x < Wn.x + Wn.w; x += 70) { c.beginPath(); c.moveTo(x, Wn.y); c.lineTo(x, Wn.y + Wn.h); c.stroke(); }
  for (const y of [Wn.y + 230, Wn.y + 460]) {
    c.beginPath(); c.moveTo(Wn.x, y); c.lineTo(Wn.x + Wn.w, y); c.stroke();
    for (let x = Wn.x + 105; x < Wn.x + Wn.w; x += 140) { poly(c, [[x, y - 26], [x + 26, y], [x, y + 26], [x - 26, y]]); c.lineWidth = 6; c.stroke(); c.lineWidth = 9; }
  }
  c.fillStyle = '#3A2616'; c.fillRect(Wn.x - 40, Wn.y + Wn.h, Wn.w + 80, 36);          // timber sill
  c.fillStyle = '#1A110A'; c.fillRect(Wn.x - 40, Wn.y - 36, Wn.w + 80, 36);
  person(c, 560, 1070, 700, { kind: 'elder', hijab: true, dress: true, lean: 0.03, pose: 'down', side: 1, rimSide: -1, body: '#0B0705', rim: '#FFB870', rimA: 0.75 });
  endShot(c);
}

function shotTraffic(c, t, R, o = {}) {              // Aisyah's windshield: brake lights ahead, wipers working
  const lt = t - (o.t0 || 0);
  beginShot(c, R, 960, 540, 1.0 + lt * 0.02, o.a);
  sky(c, '#0B1524', '#17263A', '#1C2B3F');
  skyline(c, 71, 560, '#0C1726', '#F8C77E', 0.4, 0.9);
  c.fillStyle = lin(c, 0, 540, 0, 900, [[0, '#141F2E'], [1, '#070B12']]); ga(c, 1); c.fillRect(-200, 540, W + 400, 500);
  const cars = field(72, 26, r => ({ x: r(), d: r(), bl: r() }));
  for (const k of cars) {                             // brake-light pairs in perspective
    const d = 0.25 + k.d * 0.75, y = 560 + d * 190, x = 300 + k.x * 1320, s = d * 1.4;
    glow(c, '#FF3B3B', x - 34 * s, y, 26 * s, 16 * s, 0.75);
    glow(c, '#FF3B3B', x + 34 * s, y, 26 * s, 16 * s, 0.75);
    if (k.bl > 0.9 && Math.floor(t * 1.6) % 2 === 0) glow(c, '#FFB020', x + 60 * s, y, 18 * s, 12 * s, 0.9);
  }
  reflections(c, t, 73, 24, 300, 1620, 700, 200, BRAKE, 0.3);
  rain(c, t, { x: -200, y: -100, w: W + 400, h: H + 200 }, { n: 360, alpha: 0.38 });
  glassDrops(c, t, 74, 170, { x: 0, y: 0, w: W, h: 860 }, 0.9, 11);
  const ph = ((lt % 1.8) + 1.8) % 1.8 / 1.8, ang = lerp(-0.1, 1.25, smooth(ph < 0.5 ? ph * 2 : 2 - ph * 2));
  c.save(); c.translate(760, 930); c.rotate(-ang);                                       // wiper blade
  c.fillStyle = '#04070C'; ga(c, 1); c.fillRect(0, -7, 820, 14); c.restore();
  c.fillStyle = '#04070C';
  poly(c, [[-200, 840], [W + 200, 840], [W + 200, H + 50], [-200, H + 50]]); c.fill();   // dashboard
  poly(c, [[-200, -50], [260, -50], [60, 860], [-200, 860]]); c.fill();                  // A-pillars
  poly(c, [[W + 200, -50], [1660, -50], [1860, 860], [W + 200, 860]]); c.fill();
  c.fillRect(-200, -60, W + 400, 110);
  c.strokeStyle = '#8FB7D8'; c.lineWidth = 3; ga(c, 0.3); c.beginPath(); c.moveTo(0, 842); c.lineTo(W, 842); c.stroke();
  c.lineWidth = 40; c.strokeStyle = '#070B11'; ga(c, 1);
  c.beginPath(); c.arc(520, 1260, 330, Math.PI * 1.15, Math.PI * 1.85); c.stroke();    // steering wheel
  fillRR(c, 1260, 700, 110, 190, 16, '#05080E'); fillRR(c, 1268, 708, 94, 174, 10, '#1D6FD8', 0.85);
  c.globalCompositeOperation = 'screen'; glow(c, '#6CC4FF', 1315, 795, 220, 200, 0.4); c.globalCompositeOperation = 'source-over';
  endShot(c);
}

function shotWater(c, t, R, o = {}) {                // rider POV: standing water across the road ahead
  const lt = t - (o.t0 || 0);
  beginShot(c, R, 960, 540, 1.0 + lt * 0.03, o.a);
  sky(c, '#0A1422', '#16263A', '#203248', 0, 640);
  skyline(c, 81, 610, '#0C1624', '#F8C77E', 0.5, 1.0);
  for (const x of [240, 700, 1250, 1700]) lamp(c, x, 640, 250);
  c.fillStyle = lin(c, 0, 600, 0, H, [[0, '#121D2C'], [1, '#05080E']]); ga(c, 1);
  poly(c, [[-300, H], [760, 610], [1160, 610], [2200, H]]); c.fill();
  c.fillStyle = '#0B1320'; poly(c, [[-300, 610], [760, 610], [-300, H]]); c.fill(); poly(c, [[2200, 610], [1160, 610], [2200, H]]); c.fill();
  // the standing water: a mirror band across the road
  c.save(); poly(c, [[470, 700], [1450, 700], [1700, 800], [220, 800]]); c.clip();
  c.fillStyle = lin(c, 0, 700, 0, 800, [[0, '#2A4460'], [1, '#132338']]); ga(c, 1); c.fillRect(0, 690, W, 120);
  reflections(c, t, 82, 14, 300, 1600, 700, 100, WARM.concat(COOL), 0.55);
  splashes(c, t, 83, 60, 260, 1660, 705, 795, 0.8, 16);
  c.restore();
  // amber roadside warning sign (no text)
  c.fillStyle = '#1A1206'; ga(c, 1); c.fillRect(1506, 470, 10, 170);
  poly(c, [[1511, 380], [1575, 490], [1447, 490]]); c.fillStyle = '#F59E0B'; ga(c, 0.9); c.fill();
  c.fillStyle = '#1A1206'; c.fillRect(1507, 420, 8, 40); c.fillRect(1507, 468, 8, 9);
  glow(c, '#F59E0B', 1511, 450, 120, 100, 0.25);
  rain(c, t, { x: -200, y: -100, w: W + 400, h: H + 200 }, { n: 440, alpha: 0.45 });
  c.fillStyle = '#04070C'; ga(c, 1);                                                    // handlebars + phone mount
  c.beginPath(); c.moveTo(-100, 1000); c.quadraticCurveTo(960, 900, 2020, 1000); c.lineTo(2020, H + 20); c.lineTo(-100, H + 20); c.fill();
  fillRR(c, 890, 860, 140, 200, 18, '#05080E'); fillRR(c, 900, 870, 120, 180, 12, '#1D6FD8', 0.85);
  c.globalCompositeOperation = 'screen'; glow(c, '#6CC4FF', 960, 960, 240, 160, 0.4); c.globalCompositeOperation = 'source-over';
  endShot(c);
}

function shotCarInside(c, t, R, o = {}) {           // S6: parked, warm cabin, Mei Ling with the kids behind her
  const lt = t - (o.t0 || 0);
  beginShot(c, R, 900, 560, 1.02 + lt * 0.012, o.a);
  sky(c, '#0B1524', '#17263A', '#1B2A3E');
  bokeh(c, t, 91, 40, { x: -100, y: 120, w: W + 200, h: 500 }, WARM.concat(COOL), 0.5, 26, 90, 6);
  rain(c, t, { x: -200, y: -100, w: W + 400, h: 760 }, { n: 260, alpha: 0.35 });
  glassDrops(c, t, 92, 140, { x: 0, y: 0, w: W, h: 700 }, 0.8, 10);
  c.fillStyle = '#0A0806'; ga(c, 1);
  poly(c, [[-200, 700], [W + 200, 640], [W + 200, H + 50], [-200, H + 50]]); c.fill();     // cabin + dash
  glow(c, '#FFB25E', 700, 760, 900, 260, 0.28);
  // back seat: two kids (heads above the seat line), front: Mei Ling at the wheel
  fillRR(c, 820, 700, 420, 420, 60, '#140E09');
  person(c, 930, 1200, 640, { kind: 'child', pose: 'down', side: -1, body: '#0B0806', rim: '#FFC58A', rimA: 0.7 });
  person(c, 1110, 1200, 600, { kind: 'child', bun: true, pose: 'down', side: -1, body: '#0B0806', rim: '#FFC58A', rimA: 0.7 });
  fillRR(c, 360, 640, 420, 520, 70, '#120C07');
  person(c, 600, 1300, 1050, { kind: 'woman', bun: true, pose: 'down', side: 1, rimSide: 1, body: '#080604', rim: '#FFC58A', rimA: 0.9 });
  c.strokeStyle = '#050403'; c.lineWidth = 40; ga(c, 1);
  c.beginPath(); c.arc(640, 1240, 300, Math.PI * 1.12, Math.PI * 1.88); c.stroke();
  endShot(c);
}
