// Precomputes road routes (with alternatives and turn steps) between each KL demo origin and each KL demo shelter,
// using the public OSRM demo server (OpenStreetMap data), and writes src/data/klRoutes.json.
// The app ships the result, so the demo works offline. Re-run: node scripts/build_kl_routes.mjs
// Be polite to the public server: ~1 request per second. Car profile only; walking/bike times are scaled in the app.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const shelters = JSON.parse(readFileSync(path.join(here, '../src/data/kl_shelters.json'), 'utf8'));
const src = readFileSync(path.join(here, '../src/data/klDemo.ts'), 'utf8');
const origins = [...src.matchAll(/\{ id: '([a-z-]+)', label: '[^']+', location: '[^']+', lat: ([\d.]+), lon: ([\d.]+) \}/g)].map(
  (m) => ({ id: m[1], lat: +m[2], lon: +m[3] }),
);
if (origins.length < 7) throw new Error(`parsed ${origins.length} origins`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function simplify(pts, tolM) {
  const k = 111320;
  const toXY = ([lat, lon]) => [lon * k * Math.cos((3.15 * Math.PI) / 180), lat * k];
  const xy = pts.map(toXY);
  const keep = new Array(pts.length).fill(false);
  keep[0] = keep[pts.length - 1] = true;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let maxD = 0, idx = -1;
    const [ax, ay] = xy[a], [bx, by] = xy[b];
    const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy || 1e-9;
    for (let i = a + 1; i < b; i++) {
      const t = Math.max(0, Math.min(1, ((xy[i][0] - ax) * dx + (xy[i][1] - ay) * dy) / len2));
      const d = Math.hypot(xy[i][0] - (ax + t * dx), xy[i][1] - (ay + t * dy));
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > tolM && idx > 0) { keep[idx] = true; stack.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

function haversine(a, b) {
  const R = 6371000, r = Math.PI / 180;
  const dLat = (b[0] - a[0]) * r, dLon = (b[1] - a[1]) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function instruction(step, isFirst) {
  const m = step.maneuver;
  const road = step.name ? ` onto ${step.name}` : '';
  const mod = m.modifier ? m.modifier.replace('slight ', 'slight ') : '';
  if (m.type === 'depart') return step.name ? `Head out on ${step.name}` : 'Start';
  if (m.type === 'arrive') return 'Arrive at the relief centre';
  if (m.type === 'roundabout' || m.type === 'rotary') return `At the roundabout, take exit ${m.exit ?? ''}${road}`.replace('exit ', 'exit ').trim();
  if (m.type === 'continue' || (m.type === 'new name' && !mod)) return step.name ? `Continue on ${step.name}` : 'Continue';
  if (mod === 'straight') return step.name ? `Continue straight on ${step.name}` : 'Continue straight';
  if (mod === 'uturn') return 'Make a U-turn';
  if (m.type === 'merge') return `Merge ${mod}${road}`.trim();
  if (m.type === 'fork') return `Keep ${mod || 'ahead'} at the fork${road}`;
  if (m.type === 'end of road') return `At the end of the road, turn ${mod}${road}`;
  return `Turn ${mod}${road}`.trim();
}

async function osrm(o, s) {
  const url = `https://router.project-osrm.org/route/v1/driving/${o.lon},${o.lat};${s.lon},${s.lat}` +
    `?alternatives=3&overview=full&geometries=geojson&steps=true`;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'FloodWay-demo-route-builder (hackathon prototype)' } });
      if (res.status === 429) { await sleep(3000 * (attempt + 1)); continue; }
      const body = await res.json();
      if (body.code === 'Ok') return body.routes;
      return [];
    } catch {
      await sleep(2000);
    }
  }
  return [];
}

const out = {};
let n = 0;
for (const o of origins) {
  for (const s of shelters) {
    n++;
    const routes = await osrm(o, { lat: s.lat, lon: s.lon });
    out[`${o.id}|${s.id}`] = routes.slice(0, 3).map((r) => {
      const full = r.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
      const cum = [0];
      for (let i = 1; i < full.length; i++) cum.push(cum[i - 1] + haversine(full[i - 1], full[i]));
      const line = simplify(full, 4).map((p) => [+p[0].toFixed(5), +p[1].toFixed(5)]);
      let along = 0;
      const steps = [];
      r.legs.forEach((leg) =>
        leg.steps.forEach((st, i) => {
          const [lon, lat] = st.maneuver.location;
          steps.push([Math.round(along), instruction(st, i === 0), +lat.toFixed(5), +lon.toFixed(5), Math.round(st.distance)]);
          along += st.distance;
        }),
      );
      return { d: Math.round(r.distance), t: Math.round(r.duration), line, steps };
    });
    process.stdout.write(`\r${n}/${origins.length * shelters.length} ${o.id} -> ${s.id}: ${out[`${o.id}|${s.id}`].length} route(s)   `);
    await sleep(1100);
  }
}
process.stdout.write('\n');
const empty = Object.entries(out).filter(([, v]) => !v.length).map(([k]) => k);
if (empty.length) console.warn('NO ROUTE for', empty.join(', '));
const file = path.join(here, '../src/data/klRoutes.json');
writeFileSync(file, JSON.stringify({ source: 'OpenStreetMap data via the public OSRM demo server (car profile)', generated: new Date().toISOString().slice(0, 10), routes: out }));
console.log('wrote', file);
