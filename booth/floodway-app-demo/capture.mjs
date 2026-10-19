// Captures the real FloodWay app at phone size for the demo film: one PNG per state at 2x, the Welcome animation as a
// frame sequence (its CSS and SVG animations are paused and stepped, so every frame is exact), and the on-screen box of
// each element a callout points at (cap/boxes.json, in CSS pixels of the 390x844 phone).
//
// Needs the frontend dev server: cd frontend && npm run dev   (http://localhost:5173)
// Usage: node capture.mjs [--only name,name]   CHROME_PATH=<browser binary> when Chrome is not installed.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const { chromium } = createRequire(path.join(ROOT, 'frontend', 'package.json'))('playwright-core');
const BASE = process.env.BASE ?? 'http://localhost:5173';
const OUT = path.join(HERE, 'cap');
const W = 390, H = 844, LOOP_FPS = 30, LOOP_S = 8;
fs.mkdirSync(path.join(OUT, 'welcome'), { recursive: true });

const only = (() => { const i = process.argv.indexOf('--only'); return i > -1 ? process.argv[i + 1].split(',') : null; })();
const want = (n) => !only || only.includes(n);
const boxesFile = path.join(OUT, 'boxes.json');
const boxes = fs.existsSync(boxesFile) ? JSON.parse(fs.readFileSync(boxesFile, 'utf8')) : {};
const problems = [];

const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, headless: true } : { channel: 'chrome', headless: true },
);

async function open(route, { wait = 3500, height = H } = {}) {
  const ctx = await browser.newContext({ viewport: { width: W, height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'no-preference' });
  await ctx.addInitScript(() => {
    localStorage.setItem('floodway_user', JSON.stringify({ id: 'usr-01', name: 'Luqman Nurhakim', email: 'luqman@floodway.my', phone: '+60 12-345 6789', isDemo: true }));
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => problems.push(`${route}: ${e.message}`));
  await page.goto(BASE + route, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(wait);
  return { ctx, page };
}

const shot = (page, name, opts = {}) => page.screenshot({ path: path.join(OUT, `${name}.${opts.type === 'jpeg' ? 'jpg' : 'png'}`), ...opts });
async function box(page, scene, key, locator) {
  try {
    const b = await locator.first().boundingBox();
    if (b) (boxes[scene] ??= {})[key] = { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) };
    else problems.push(`${scene}.${key}: not visible`);
  } catch (e) {
    problems.push(`${scene}.${key}: ${e.message.split('\n')[0]}`);
  }
}
const hideNav = (page) => page.addStyleTag({ content: 'nav[aria-label="Main"]{display:none!important}' });
const step = async (label, fn) => {
  try { await fn(); console.log('  ok', label); } catch (e) { problems.push(`${label}: ${e.message.split('\n')[0]}`); console.log('  FAIL', label); }
};

// ── Welcome: the evacuation loop as frames ──
if (want('welcome')) await step('welcome', async () => {
  const { ctx, page } = await open('/', { wait: 2500 });
  await shot(page, 'welcome');
  await page.evaluate(() => {
    document.getAnimations().forEach((a) => a.pause());
    document.querySelectorAll('svg').forEach((s) => s.pauseAnimations?.());
  });
  for (let i = 0; i < LOOP_FPS * LOOP_S; i++) {
    const t = i / LOOP_FPS;
    await page.evaluate((tt) => {
      document.getAnimations().forEach((a) => { a.currentTime = tt * 1000; });
      document.querySelectorAll('svg').forEach((s) => s.setCurrentTime?.(tt));
    }, t);
    await shot(page, `welcome/f${String(i).padStart(3, '0')}`, { type: 'jpeg', quality: 90 });
  }
  await box(page, 'welcome', 'loop', page.locator('.fw-loop'));
  await box(page, 'welcome', 'cta', page.getByRole('button', { name: /Continue as demo user/ }));
  await ctx.close();
});

// ── Home: a tall page the film scrolls through, plus the tab bar on its own ──
if (want('home')) await step('home', async () => {
  const { ctx, page } = await open('/home', { wait: 4500 });
  await page.locator('nav[aria-label="Main"]').screenshot({ path: path.join(OUT, 'nav-home.png') });
  await hideNav(page);
  await box(page, 'home', 'hero', page.locator('section[aria-label="Overall flood risk"]'));
  await box(page, 'home', 'family', page.locator('section[aria-labelledby="family-title"]'));
  await box(page, 'home', 'near', page.locator('section[aria-labelledby="near-title"]'));
  await box(page, 'home', 'relief', page.locator('section[aria-labelledby="relief-title"]'));
  await shot(page, 'home', { fullPage: true });
  boxes.home.pageH = await page.evaluate(() => document.documentElement.scrollHeight);
  await ctx.close();
});

// ── Family map: people, a member, safety, places, layers ──
if (want('map')) await step('map', async () => {
  const { ctx, page } = await open('/map', { wait: 7000 });
  await page.locator('nav[aria-label="Main"]').screenshot({ path: path.join(OUT, 'nav-map.png') });
  await shot(page, 'map-people');
  await box(page, 'map-people', 'switcher', page.getByRole('button', { name: /^Family$/ }));
  await box(page, 'map-people', 'pills', page.getByRole('button', { name: /Check in/ }));
  await box(page, 'map-people', 'sos', page.getByRole('button', { name: 'SOS', exact: true }));
  await box(page, 'map-people', 'tabs', page.getByRole('tablist'));
  await box(page, 'map-people', 'firstCard', page.locator('section[aria-label$="circle"] li').first());

  await page.getByRole('tab', { name: 'Safety' }).click();
  await page.waitForTimeout(600);
  await shot(page, 'map-safety');
  await box(page, 'map-safety', 'summary', page.locator('section[aria-label$="circle"] p.rounded-2xl').first());

  const tw = page.locator('section[aria-label$="circle"] button', { hasText: 'Tok Wan' }).first();
  await tw.click();
  await page.waitForTimeout(1600);
  await tw.evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(400);
  await shot(page, 'map-tokwan');
  await box(page, 'map-tokwan', 'card', page.locator('section[aria-label$="circle"] li', { hasText: 'Tok Wan' }));
  await box(page, 'map-tokwan', 'actions', page.getByRole('button', { name: /Plan their route/ }));

  await page.getByRole('tab', { name: 'Places' }).click();
  await page.waitForTimeout(600);
  await shot(page, 'map-places');
  await box(page, 'map-places', 'list', page.locator('section[aria-label$="circle"] ul').first());

  await page.getByRole('button', { name: 'Map layers and flood scenario' }).click();
  await page.waitForTimeout(500);
  await shot(page, 'map-layers');
  await box(page, 'map-layers', 'scenario', page.getByRole('group', { name: 'Flood scenario' }));
  await ctx.close();
});

// ── SOS and check-in ──
if (want('sos')) await step('sos', async () => {
  const { ctx, page } = await open('/map', { wait: 6000 });
  await page.getByRole('button', { name: 'SOS', exact: true }).click();
  await page.waitForTimeout(500);
  await shot(page, 'sos-hold');
  await box(page, 'sos-hold', 'ring', page.getByRole('button', { name: 'Hold to send SOS' }));
  const b = await page.getByRole('button', { name: 'Hold to send SOS' }).boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(2500);
  await page.mouse.up();
  await page.waitForTimeout(1500);
  await shot(page, 'sos-sent');
  await page.getByRole('button', { name: 'Close' }).click();
  await page.waitForTimeout(800);
  await shot(page, 'sos-map');
  await box(page, 'sos-map', 'banner', page.getByRole('alert').first());

  await page.getByRole('button', { name: /Check in/ }).click();
  await page.waitForTimeout(500);
  await shot(page, 'checkin');
  await page.getByRole('button', { name: 'Check in as safe' }).click();
  await page.waitForTimeout(1800);
  await shot(page, 'checkin-done');
  await page.getByRole('button', { name: 'Done' }).click();
  await page.getByRole('button', { name: /^Activity/ }).click();
  await page.waitForTimeout(700);
  await shot(page, 'activity');
  await ctx.close();
});

// ── Verified reports and the safe route ──
if (want('route')) await step('route', async () => {
  const { ctx, page } = await open('/map', { wait: 6000 });
  await page.getByRole('button', { name: 'Centre on me' }).click();
  await page.waitForTimeout(1800);
  await shot(page, 'map-verified');
  await box(page, 'map-verified', 'label', page.locator('.fw-area-label'));

  await page.getByRole('tab', { name: 'Route' }).click();
  await page.waitForTimeout(2500);
  await shot(page, 'map-route');
  await box(page, 'map-route', 'from', page.getByRole('region', { name: 'Route from' }));
  await box(page, 'map-route', 'routes', page.locator('#routes-label'));

  const start = page.getByRole('button', { name: /Start turn-by-turn/ });
  await start.scrollIntoViewIfNeeded();
  await start.click();
  await page.waitForTimeout(9000);
  await shot(page, 'map-drive');
  await ctx.close();
});

// ── Citizen report: photo, depth from the photo, evidence ──
if (want('reports')) await step('reports', async () => {
  const { ctx, page } = await open('/reports', { wait: 3500 });
  await shot(page, 'reports');
  await page.getByRole('button', { name: /Report a flood/ }).first().click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: /^Sample photo:/ }).first().click();
  await page.waitForTimeout(1000);
  await shot(page, 'report-photo');
  const depth = page.getByRole('heading', { name: /How deep is it/ });
  await depth.evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(400);
  // pick the first reference object the depth step offers, if it shows choices
  const choice = page.locator('section[aria-labelledby="step-2"] button').first();
  if (await choice.count()) { await choice.click().catch(() => {}); await page.waitForTimeout(600); }
  await shot(page, 'report-depth');
  const ev = page.locator('section[aria-labelledby="step-5"], section[aria-labelledby="step-4"]').last();
  if (await ev.count()) { await ev.evaluate((el) => el.scrollIntoView({ block: 'start' })); await page.waitForTimeout(500); }
  await shot(page, 'report-evidence');
  await ctx.close();
});

// ── Live Vision, control room, profile ──
if (want('live')) await step('live', async () => {
  const { ctx, page } = await open('/live', { wait: 6000 });
  await shot(page, 'live');
  await hideNav(page);
  await shot(page, 'live-full', { fullPage: true });
  boxes.live = { ...(boxes.live ?? {}), pageH: await page.evaluate(() => document.documentElement.scrollHeight) };
  await ctx.close();
});
if (want('control')) await step('control', async () => {
  // the page scrolls inside its own container, so give it a tall window instead of a full-page shot
  const { ctx, page } = await open('/control', { wait: 5000, height: 2400 });
  await hideNav(page);
  const contentH = await page.evaluate(() => Math.max(...[...document.querySelectorAll('main, main *')].slice(0, 400).map((e) => e.scrollHeight)));
  await page.setViewportSize({ width: W, height: Math.min(4000, Math.max(H, contentH + 80)) });
  await page.waitForTimeout(800);
  await shot(page, 'control', { fullPage: true });
  boxes.control = { ...(boxes.control ?? {}), pageH: await page.evaluate(() => document.documentElement.scrollHeight) };
  await ctx.close();
});
if (want('profile')) await step('profile', async () => {
  const { ctx, page } = await open('/profile', { wait: 3000 });
  await shot(page, 'profile');
  await ctx.close();
});

fs.writeFileSync(boxesFile, JSON.stringify(boxes, null, 1));
await browser.close();
if (problems.length) { console.log('PROBLEMS:\n  ' + problems.join('\n  ')); process.exitCode = 1; }
else console.log('all captures ok');
