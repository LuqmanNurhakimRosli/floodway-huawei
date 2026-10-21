// Captures the real FloodWay app at phone size (390x844 at 2x) for scenes 3 and 8 of the SDP video.
// Needs: cd frontend && npm run dev (http://localhost:5173), and backend/run.py on :8080 for live sample cameras.
// Usage: node capture.mjs [--only name,name]     CHROME_PATH=<browser binary> to use something other than Edge.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const { chromium } = createRequire(path.join(ROOT, 'frontend', 'package.json'))('playwright-core');
const BASE = process.env.BASE ?? 'http://localhost:5173';
const OUT = path.join(HERE, 'assets', 'app');
const W = 390, H = 844;
fs.mkdirSync(OUT, { recursive: true });

const only = (() => { const i = process.argv.indexOf('--only'); return i > -1 ? process.argv[i + 1].split(',') : null; })();
const want = (n) => !only || only.includes(n);
const problems = [];
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'msedge' });

async function open(route, wait = 4000) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => {
    localStorage.setItem('floodway_user', JSON.stringify({ id: 'usr-01', name: 'Demo User', email: 'demo@floodway.my', phone: '+60 12-000 0000', isDemo: true }));
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => problems.push(`${route}: ${e.message}`));
  await page.goto(BASE + route, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(wait);
  return { ctx, page };
}
const shot = (page, name, opts = {}) => page.screenshot({ path: path.join(OUT, `${name}.png`), ...opts });
const step = async (label, fn) => {
  try { await fn(); console.log('  ok', label); } catch (e) { problems.push(`${label}: ${e.message.split('\n')[0]}`); console.log('  FAIL', label); }
};

if (want('live')) await step('live', async () => {
  const { ctx, page } = await open('/live', 7000);
  await shot(page, 'live');
  await shot(page, 'live-full', { fullPage: true });
  await ctx.close();
});

if (want('map')) await step('map', async () => {
  const { ctx, page } = await open('/map', 7000);
  await shot(page, 'map');
  await page.getByRole('tab', { name: 'Route' }).click();
  await page.waitForTimeout(3000);
  await shot(page, 'map-route');
  await ctx.close();
});

if (want('report')) await step('report', async () => {
  const { ctx, page } = await open('/reports', 4000);
  await shot(page, 'reports');
  await page.getByRole('button', { name: /Report a flood/ }).first().click();
  await page.waitForTimeout(900);
  await page.getByRole('button', { name: /^Sample photo:/ }).first().click();
  await page.waitForTimeout(1200);
  await shot(page, 'report-photo');
  const ev = page.locator('section[aria-labelledby="step-5"], section[aria-labelledby="step-4"]').last();
  if (await ev.count()) { await ev.evaluate((el) => el.scrollIntoView({ block: 'start' })); await page.waitForTimeout(600); }
  await shot(page, 'report-evidence');
  await ctx.close();
});

if (want('home')) await step('home', async () => {
  const { ctx, page } = await open('/home', 5000);
  await shot(page, 'home');
  await ctx.close();
});

await browser.close();
if (problems.length) { console.log('PROBLEMS:\n  ' + problems.join('\n  ')); process.exitCode = 1; }
else console.log('all captures ok ->', OUT);
