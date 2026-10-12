// Captures the three phone screenshots the poster uses (390x844 at 3x) from the running app.
// Needs the dev servers: frontend on :5173 and backend on :8080.
// Usage: node scripts/capture-poster-shots.mjs
// Writes docs/product/preliminary-round/poster/assets/{home,live,map}-phone.jpg. On /live the Klang camera is selected and the Zone and
// Water overlays are switched off, so the photo shows clean (reference lines and waterline only).
// Each shot uses a fresh browser context: after /home the app kept state that sent the next /live visit to /map.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = createRequire(path.join(root, 'frontend', 'package.json'))('playwright-core');
const out = path.join(root, 'docs', 'product', 'preliminary-round', 'poster', 'assets');
const BASE = process.env.BASE ?? 'http://localhost:5173';

const browser = await chromium.launch({ channel: 'chrome', headless: true });

for (const [name, route, wait] of [['home', '/home', 4000], ['live', '/live', 7000], ['map', '/map', 6000]]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() =>
    localStorage.setItem('floodway_user', JSON.stringify({ id: 'usr-01', name: 'Luqman Nurhakim', email: 'demo@floodway.my', phone: '', isDemo: true })),
  );
  const page = await ctx.newPage();
  await page.goto(BASE + route, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(wait);
  if (name === 'live') {
    await page.getByRole('option', { name: /Sg\. Klang/ }).first().click(); // the Klang scene is the strongest sample
    await page.waitForTimeout(2500);
    for (const label of ['Zone', 'Water']) {
      const btn = page.getByRole('button', { name: label, exact: true });
      if ((await btn.count()) && (await btn.first().getAttribute('aria-pressed')) === 'true') await btn.first().click();
    }
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: path.join(out, `${name}-phone.jpg`), type: 'jpeg', quality: 88 });
  console.log('wrote', `${name}-phone.jpg`);
  await ctx.close();
}
await browser.close();
