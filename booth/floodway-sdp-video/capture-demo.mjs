// Captures the demo-section flow of the SDP video from the real app, in ONE browser session so the app state carries
// over (the report sent in step 4 is the one the operator verifies in step 5 and the map then shows).
// Sample cameras move on a clock, so the live step waits for the readings the script names.
// Needs: frontend dev server on :5173 and the backend on :8080 with an AI key set (backend/.env), otherwise the
// AI step captures the app's own "not configured" wording and nothing is invented.
// Usage: CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe" node capture-demo.mjs
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const { chromium } = createRequire(path.join(ROOT, 'frontend', 'package.json'))('playwright-core');
const BASE = process.env.BASE ?? 'http://localhost:5173';
const OUT = path.join(HERE, 'assets', 'app', 'demo');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'nav'), { recursive: true });
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'msedge' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => localStorage.setItem('floodway_user', JSON.stringify({ id: 'usr-01', name: 'Aisyah', email: 'aisyah@floodway.my', phone: '', isDemo: true })));
const page = await ctx.newPage();
// The drive is caught with Chrome's screencast: a screenshot at 2x takes ~0.7 s, too slow for a five-second drive.
const cdp = await ctx.newCDPSession(page);
const cast = [];
cdp.on('Page.screencastFrame', (f) => { cast.push({ t: f.metadata.timestamp, data: f.data }); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
const problems = [];
page.on('pageerror', (e) => problems.push(e.message));
const shot = (name, opts = {}) => page.screenshot({ path: path.join(OUT, `${name}.png`), ...opts });
const wait = (ms) => page.waitForTimeout(ms);
const step = async (label, fn) => { try { await fn(); console.log('  ok', label); } catch (e) { problems.push(`${label}: ${e.message.split('\n')[0]}`); console.log('  FAIL', label); } };
const nav = (name) => page.getByRole('navigation').getByRole('link', { name }).or(page.getByRole('navigation').getByRole('button', { name })).first().click();

await page.goto(BASE + '/live', { waitUntil: 'domcontentloaded' });
await wait(7000);
const meta = { crops: {} };
const box = async (name, loc, pad = 6) => { const b = await loc.boundingBox(); if (b) meta.crops[name] = { x: Math.max(0, Math.round(b.x - pad)), y: Math.max(0, Math.round(b.y - pad)), w: Math.min(390, Math.round(b.width + pad * 2)), h: Math.round(b.height + pad * 2) }; };
const flush = () => fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta, null, 1));
await step('live', async () => {
  // The camera reads a 12-step photo ladder, so a value like 78% only shows on some cameras. The script opens on the alert for
  // Sg. Klang @ Masjid Jamek (any WARNING reading), then the camera that "detects water at 78 per cent" is Kampung Baru Drain.
  const focus = async (name) => { const c = page.getByText(name).locator('visible=true').first(); if (await c.count()) { await c.click(); await wait(1200); } };
  const read = async () => {
    const t = (await page.locator('main').innerText()).split(String.fromCharCode(10)).map((x) => x.trim()).filter(Boolean);
    const i = t.indexOf('Grid');
    return { camera: t[i + 1], level: t.find((x, j) => j > i && /^(NORMAL|ADVISORY|WARNING|DANGER)$/.test(x)), pct: t.find((x, j) => j > i && /^\d+%$/.test(x)) };
  };
  const until = async (name, ok) => { await focus(name); let r = await read(); for (let k = 0; k < 1100 && !ok(r); k++) { await wait(700); r = await read(); } return r; };
  meta.alert = await until('Sg. Klang @ Masjid Jamek', (r) => r.level === 'WARNING');
  Object.assign(meta, await until('Kampung Baru Drain', (r) => Number.parseInt(r.pct, 10) === 78));
  await shot('live');
  meta.crops.live = { x: 16, y: 400, w: 358, h: 128 };
});
await step('to map', async () => {
  await page.getByRole('button', { name: /Show evacuation routes/ }).first().click();
  await wait(3500);
  await shot('map-after-live');
});
await step('route tab', async () => {
  const t = page.getByRole('tab', { name: 'Route' });
  if (await t.count()) await t.click();
  await wait(2500);
  await shot('route-tab');
});
await step('shelters', async () => {
  const lis = page.locator('section[aria-labelledby="centres-label"] li');
  await lis.first().evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await page.evaluate(() => window.scrollBy(0, 0));
  await wait(700);
  await shot('shelters');
  await box('full', lis.filter({ hasText: 'Dewan Serbaguna Kampung Baru' }).first());
});
await step('choose + start', async () => {
  await page.getByRole('button', { name: /Sentul Perdana/ }).first().click();
  await wait(1200);
  await shot('shelter-chosen');
  await box('chosen', page.locator('section[aria-labelledby="centres-label"] li').filter({ hasText: 'Sentul Perdana' }).first());
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, everyNthFrame: 1 });
  await page.getByRole('button', { name: /Start turn-by-turn/ }).click();
  await wait(9000);
  await cdp.send('Page.stopScreencast');
  await shot('arrived');
});
await step('report: photo', async () => {
  await page.getByRole('button', { name: /Flood reports/ }).click();
  await wait(1500);
  await page.getByRole('button', { name: /Report a flood/ }).first().click();
  await wait(900);
  await page.getByRole('button', { name: /^Sample photo:/ }).first().click();
  await wait(1200);
  await page.getByPlaceholder(/Drain overflowing/).fill('Water over the road near Kampung Baru');
  await page.getByLabel('Place').fill('Jalan Raja Muda Musa, Kampung Baru');
  await shot('report-photo');
});
await step('report: AI check', async () => {
  const ask = page.getByRole('button', { name: /Ask the AI/ });
  await ask.scrollIntoViewIfNeeded();
  await shot('report-ai-before');
  // the model call can time out upstream; a person would press the button again, so does the capture
  for (let k = 0; k < 4; k++) {
    await ask.click();
    await page.getByText('Asking the model').waitFor({ state: 'hidden', timeout: 90000 });
    if (await page.getByText(/The model thinks/).count()) break;
    await wait(2500);
  }
  if (!(await page.getByText(/The model thinks/).count())) throw new Error('the AI check never returned a result');
  await wait(800);
  await page.getByRole('status').filter({ hasText: /Gemini|model|AI/ }).first().scrollIntoViewIfNeeded();
  await shot('report-ai-result');
  await box('ai', page.getByRole('status').filter({ hasText: /Gemini|model|AI/ }).first());
  const ev = page.locator('section[aria-labelledby="step-5"]');
  await ev.evaluate((el) => el.scrollIntoView({ block: 'start' })); await wait(500);
  await shot('report-evidence');
});
await step('report: send', async () => {
  await page.getByRole('button', { name: /Send report/ }).click();
  await wait(1500);
  await shot('feed-ai-checked');
  await box('aipill', page.getByText('AI CHECKED').first(), 16);
});
await step('operator: verify', async () => {
  await page.getByRole('button', { name: /Operator desk/ }).click();
  await wait(1200);
  await shot('operator-desk');
  const card = page.locator('article', { hasText: 'Water over the road near Kampung Baru' }).first();
  await card.scrollIntoViewIfNeeded();
  await card.getByRole('button', { name: /Raise depth/ }).click();
  await wait(500);
  await card.getByRole('button', { name: /^Verify$/ }).evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await wait(600);
  await shot('operator-adjust');
  await box('adjust', card.getByRole('button', { name: /^Verify$/ }).locator('xpath=../..'), 4);
  await card.getByRole('button', { name: /^Verify$/ }).click();
  await wait(900);
  await page.getByRole('button', { name: /Back to reports/ }).click();
  await wait(1200);
  await shot('feed-human-verified');
  await box('humanpill', page.getByText('HUMAN VERIFIED').first(), 16);
});
await step('map updates', async () => {
  await page.getByRole('navigation').getByText('Map', { exact: true }).click();
  await wait(4000);
  await shot('map-verified');
  meta.crops.maplabel = { x: 0, y: 60, w: 390, h: 320 }; // the map above the sheet, with the verified area drawn
});
await browser.close();
// resample the screencast to 10 fps (the last frame at or before each tick)
fs.mkdirSync(path.join(OUT, 'nav'), { recursive: true });
const t0 = cast[0]?.t ?? 0;
for (let i = 0, k = 0; cast.length && i * 0.1 <= cast.at(-1).t - t0; i++) {
  while (k + 1 < cast.length && cast[k + 1].t - t0 <= i * 0.1) k++;
  fs.writeFileSync(path.join(OUT, 'nav', `f${String(i).padStart(2, '0')}.jpg`), Buffer.from(cast[k].data, 'base64'));
}
// the arrival card dims the screen (mean luma falls from ~190 to ~80): drop that frame and the ones after it
const stats = spawnSync(process.env.FFMPEG_PATH || 'ffmpeg', ['-v', 'info', '-i', path.join(OUT, 'nav', 'f%02d.jpg'), '-vf', 'signalstats,metadata=print:key=lavfi.signalstats.YAVG', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
const luma = [...stats.matchAll(/YAVG=([\d.]+)/g)].map((m) => Number(m[1]));
const dim = luma.findIndex((v) => v < 120);
const files = fs.readdirSync(path.join(OUT, 'nav')).sort();
files.slice(dim < 0 ? files.length : dim).forEach((f) => fs.unlinkSync(path.join(OUT, 'nav', f)));
meta.navFrames = dim < 0 ? files.length : dim;
flush();
console.log(problems.length ? 'PROBLEMS:\n  ' + problems.join('\n  ') : 'all ok');
