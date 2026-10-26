// Captures the phone screenshots used on the semi-final slides: Live at rest, Live at the end of the storm, Map.
// Needs the dev server on :5173 and Chrome. Output: docs/team/slide-assets/
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const BASE = process.env.BASE ?? 'http://localhost:5173';
const out = path.join(fileURLToPath(new URL('../../docs/team/slide-assets/', import.meta.url)), '/');
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, headless: true } : { channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
// Alerts queue up one after another, so dismiss until none are left.
const clear = async () => { for (let i = 0; i < 8; i++) { await page.evaluate(() => document.querySelectorAll('[aria-label^="Dismiss"]').forEach((b) => b.click())); await page.waitForTimeout(250); } };
const top = () => page.evaluate(() => document.getElementById('fusion-title')?.scrollIntoView({ block: 'start' }));
await page.goto(`${BASE}/live`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500); await top(); await page.waitForTimeout(400);
await page.screenshot({ path: `${out}live-idle.png` });
await page.goto(`${BASE}/live?demo=storm`, { waitUntil: 'networkidle' });
await page.waitForTimeout(17000); await clear(); await page.waitForTimeout(500); await top(); await page.waitForTimeout(600);
await page.screenshot({ path: `${out}live-storm.png` });
await page.goto(`${BASE}/map`, { waitUntil: 'networkidle' });
await page.waitForTimeout(3500);
await page.screenshot({ path: `${out}map.png` });
await browser.close();
console.log('saved to', out);
