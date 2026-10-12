// Renders a poster from docs/product/preliminary-round/poster/ to PNG. Needs network once for Google Fonts.
// Re-capture the phone screenshots first if the app changed:  node scripts/capture-poster-shots.mjs
// Usage: node scripts/render-poster.mjs [phone|landscape] [out.png]
//   phone     poster.html            1080 px wide, height follows the content   -> FloodWay_Poster_Phone.png
//   landscape poster-landscape.html  1920 x 1080                                -> FloodWay_Poster_1920x1080.png
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'docs', 'product', 'preliminary-round', 'poster');
const { chromium } = createRequire(path.join(root, 'frontend', 'package.json'))('playwright-core');
const VARIANTS = {
  phone: { html: 'poster.html', png: 'FloodWay_Poster_Phone.png', w: 1080, h: 1600, full: true, minText: 22 },
  landscape: { html: 'poster-landscape.html', png: 'FloodWay_Poster_1920x1080.png', w: 1920, h: 1080, full: false, minText: 18 },
};
const v = VARIANTS[process.argv[2]] ?? VARIANTS.phone;
const out = process.argv[3] ?? path.join(dir, v.png);

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(dir, v.html)).href, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
// Report anything wider than the poster, any box whose content is taller than it, and small text, so nothing is silently clipped.
const problems = await page.evaluate(({ w, minText }) => {
  const found = [];
  if (document.documentElement.scrollWidth > w) found.push(`page is ${document.documentElement.scrollWidth}px wide`);
  for (const e of document.querySelectorAll('.card, .pillar, .step, .stat, .big, .phone, .hero, .quote, header, footer, main')) {
    if (e.scrollHeight > e.clientHeight + 1) found.push(`${e.className || e.tagName}: content taller than box (${e.scrollHeight}>${e.clientHeight})`);
    const r = e.getBoundingClientRect();
    if (r.right > w + 1 || r.left < -1) found.push(`${e.className || e.tagName}: outside the poster (${Math.round(r.left)}..${Math.round(r.right)})`);
  }
  const small = [...document.querySelectorAll('p, span, div, li, b')].filter((e) => e.childElementCount === 0 && e.textContent.trim() && parseFloat(getComputedStyle(e).fontSize) < minText);
  if (small.length) found.push(`${small.length} text nodes under ${minText}px, e.g. "${small[0].textContent.trim().slice(0, 30)}"`);
  return found;
}, { w: v.w, minText: v.minText });
await page.screenshot({ path: out, fullPage: v.full });
const height = await page.evaluate(() => document.documentElement.scrollHeight);
console.log(problems.length ? `PROBLEMS:\n${problems.join('\n')}` : `no overflow, nothing outside the poster, no text under ${v.minText}px`, `\n${v.w} x ${height} ->`, out);
await browser.close();
