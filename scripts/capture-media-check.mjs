import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = createRequire(path.join(root, 'frontend', 'package.json'))('playwright-core');
const out = path.join(root, 'docs', 'screenshots', 'media-check');
const BASE = process.env.BASE ?? 'http://localhost:5173';

const browser = await chromium.launch({ channel: 'chrome', headless: true });

async function setupContext(w, h, isMobile) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: 2,
    isMobile: isMobile,
    hasTouch: isMobile,
  });
  await ctx.addInitScript(() =>
    localStorage.setItem(
      'floodway_user',
      JSON.stringify({ id: 'usr-01', name: 'Luqman Nurhakim', email: 'demo@floodway.my', phone: '', isDemo: true })
    )
  );
  return ctx;
}

// 1. live-390-klang.png
{
  const ctx = await setupContext(390, 844, true);
  const page = await ctx.newPage();
  await page.goto(BASE + '/live', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  const klangOption = page.getByRole('option', { name: /Sg\. Klang/ }).first();
  if (await klangOption.count()) await klangOption.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(out, 'live-390-klang.png'), fullPage: false });
  console.log('wrote live-390-klang.png');
  await ctx.close();
}

// 2. live-1366-klang.png
{
  const ctx = await setupContext(1366, 768, false);
  const page = await ctx.newPage();
  await page.goto(BASE + '/live', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  const klangOption = page.getByRole('option', { name: /Sg\. Klang/ }).first();
  if (await klangOption.count()) await klangOption.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(out, 'live-1366-klang.png'), fullPage: false });
  console.log('wrote live-1366-klang.png');
  await ctx.close();
}

// 3. live-390-drain.png
{
  const ctx = await setupContext(390, 844, true);
  const page = await ctx.newPage();
  await page.goto(BASE + '/live', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  const drainOption = page.getByRole('option', { name: /Kampung Baru/ }).first();
  if (await drainOption.count()) await drainOption.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(out, 'live-390-drain.png'), fullPage: false });
  console.log('wrote live-390-drain.png');
  await ctx.close();
}

// 4. live-cameras-strip.png
{
  const ctx = await setupContext(1366, 768, false);
  const page = await ctx.newPage();
  await page.goto(BASE + '/live', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(out, 'live-cameras-strip.png'), fullPage: false });
  console.log('wrote live-cameras-strip.png');
  await ctx.close();
}

await browser.close();
console.log('All verification screenshots captured.');
