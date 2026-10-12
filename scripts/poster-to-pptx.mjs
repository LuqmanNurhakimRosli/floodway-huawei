// Converts the landscape HTML poster into an editable one-slide PowerPoint (every box, text, image and icon is a native
// element, so PowerPoint and Canva can edit each one). Layout is read from the rendered poster, so the two stay in step.
// Setup once:  cd scripts/pptx-tool && npm install
// Usage:       node scripts/poster-to-pptx.mjs   -> docs/product/preliminary-round/poster/FloodWay_Poster_1920x1080.pptx
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'docs', 'product', 'preliminary-round', 'poster');
const { chromium } = createRequire(path.join(root, 'frontend', 'package.json'))('playwright-core');
const PptxGenJS = createRequire(path.join(root, 'scripts', 'pptx-tool', 'package.json'))('pptxgenjs');
const work = path.join(dir, '.pptx-build');
fs.mkdirSync(work, { recursive: true });
const IN = (px) => +(px / 96).toFixed(4);          // slide is 20 x 11.25 in = 1920 x 1080 px
const PT = (px) => +(px * 0.75).toFixed(2);

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(dir, 'poster-landscape.html')).href, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);

// ---------- 1. Read the poster: boxes, text blocks (with styled runs), images and icons, in paint order ----------
const items = await page.evaluate(() => {
  const out = [];
  const color = (c) => {
    const m = c && c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map((s) => parseFloat(s));
    const a = p.length > 3 ? p[3] : 1;
    if (a <= 0.01) return null;
    return { hex: p.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase(), a };
  };
  const firstStop = (bg) => color((bg.match(/rgba?\([^)]+\)/) || [])[0]);
  const angle = (el) => {
    let a = 0;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const m = getComputedStyle(n).transform.match(/matrix\(([^)]+)\)/);
      if (m) { const [x, y] = m[1].split(',').map(parseFloat); a += Math.atan2(y, x) * 180 / Math.PI; }
    }
    return Math.round(a * 100) / 100;
  };
  const geom = (el) => {
    const r = el.getBoundingClientRect(), rot = angle(el);
    if (!rot) return { x: r.x, y: r.y, w: r.width, h: r.height, rot: 0 };
    const w = el.offsetWidth || r.width, h = el.offsetHeight || r.height;
    return { x: r.x + r.width / 2 - w / 2, y: r.y + r.height / 2 - h / 2, w, h, rot };
  };
  const name = (el) => (el.className && typeof el.className === 'string' ? el.className.split(' ')[0] : el.tagName.toLowerCase());
  const runStyle = (el) => {
    const cs = getComputedStyle(el);
    return { color: color(cs.color), size: parseFloat(cs.fontSize), bold: parseInt(cs.fontWeight, 10) >= 600, italic: cs.fontStyle === 'italic',
      font: cs.fontFamily.split(',')[0].replace(/["']/g, '').trim(), spacing: parseFloat(cs.letterSpacing) || 0, upper: cs.textTransform === 'uppercase' };
  };
  const isTextBlock = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());

  function runs(el, acc = []) {
    for (const n of el.childNodes) {
      if (n.nodeType === 3) {
        const st = runStyle(el);
        let t = n.textContent.replace(/\s+/g, ' ');
        if (st.upper) t = t.toUpperCase();
        if (t) acc.push({ text: t, ...st });
      } else if (n.nodeType === 1) {
        if (n.tagName === 'BR') { acc.push({ br: true }); continue; }
        if (n.tagName === 'svg' || n.tagName === 'IMG') continue;
        const block = ['block', 'flex', 'grid'].includes(getComputedStyle(n).display);
        if (block && acc.length && !acc[acc.length - 1].br) acc.push({ br: true });
        runs(n, acc);
        if (block) acc.push({ br: true });
      }
    }
    return acc;
  }
  function textRect(el) {
    const rects = [];
    const walk = (n) => {
      if (n.nodeType === 3 && n.textContent.trim()) { const r = document.createRange(); r.selectNodeContents(n); rects.push(...r.getClientRects()); }
      else if (n.nodeType === 1 && n.tagName !== 'svg') n.childNodes.forEach(walk);
    };
    walk(el);
    const L = Math.min(...rects.map((r) => r.left)), T = Math.min(...rects.map((r) => r.top));
    const R = Math.max(...rects.map((r) => r.right)), B = Math.max(...rects.map((r) => r.bottom));
    return { L, T, R, B };
  }
  function svgIcon(svg) {
    const use = svg.querySelector('use');
    const sym = use && document.querySelector(use.getAttribute('href'));
    if (!sym) return null;
    const c = getComputedStyle(svg).color;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${sym.getAttribute('viewBox')}" width="256" height="256" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${sym.innerHTML}</svg>`;
  }

  function visit(el) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    const g = geom(el);
    if (g.w < 1 || g.h < 1) return;
    if (el.tagName === 'IMG') {
      // An image with its own background and padding (the QR tile) gets a box behind it, and sits in its content box.
      const bg = color(cs.backgroundColor);
      if (bg) out.push({ kind: 'box', ...g, fill: bg, r: parseFloat(cs.borderTopLeftRadius) || 0, name: (el.alt || 'image') + ' tile' });
      const pl = parseFloat(cs.paddingLeft), pt = parseFloat(cs.paddingTop), pr = parseFloat(cs.paddingRight), pb = parseFloat(cs.paddingBottom);
      out.push({ kind: 'img', src: el.src, ...g, x: g.x + pl, y: g.y + pt, w: g.w - pl - pr, h: g.h - pt - pb, fit: cs.objectFit, name: el.alt || name(el.parentElement) });
      return;
    }
    if (el.tagName === 'svg') { const s = svgIcon(el); if (s) out.push({ kind: 'icon', svg: s, ...g, name: 'icon' }); return; }
    // Box: background colour (first gradient stop), border, radius.
    const fill = color(cs.backgroundColor) || (cs.backgroundImage.includes('gradient') ? firstStop(cs.backgroundImage) : null);
    const bw = parseFloat(cs.borderTopWidth), bl = parseFloat(cs.borderLeftWidth);
    const line = bw > 0 ? color(cs.borderTopColor) : null;
    if (fill || line) out.push({ kind: 'box', ...g, fill, line, lw: bw, r: parseFloat(cs.borderTopLeftRadius) || 0, name: name(el) });
    if (bl > bw + 1 && color(cs.borderLeftColor)) out.push({ kind: 'box', x: g.x, y: g.y, w: bl, h: g.h, rot: 0, fill: color(cs.borderLeftColor), r: 0, name: name(el) + '-edge' });
    const url = cs.backgroundImage.match(/url\("?([^")]+)"?\)/);
    if (url) out.push({ kind: 'img', src: url[1], ...g, fit: 'cover', opacity: parseFloat(cs.opacity), name: name(el) });
    const after = getComputedStyle(el, '::after');
    if (after.content !== 'none' && after.position === 'absolute') {
      const f = firstStop(after.backgroundImage) || color(after.backgroundColor);
      if (f) out.push({ kind: 'box', ...g, fill: f, r: 0, name: name(el) + '-overlay' });
    }
    if (isTextBlock(el)) {
      const t = textRect(el);
      const padL = parseFloat(cs.paddingLeft) + bl, padR = parseFloat(cs.paddingRight) + parseFloat(cs.borderRightWidth);
      const hasIcon = !!el.querySelector(':scope > svg');
      const x = hasIcon ? t.L : g.x + padL, right = g.x + g.w - padR;
      const lh = cs.lineHeight === 'normal' ? parseFloat(cs.fontSize) * 1.2 : parseFloat(cs.lineHeight);
      out.push({ kind: 'text', x, y: t.T, w: Math.max(right - x, t.R - x), h: t.B - t.T, rot: g.rot, runs: runs(el), align: cs.textAlign === 'center' ? 'center' : cs.textAlign === 'right' || cs.textAlign === 'end' ? 'right' : 'left',
        lh, nowrap: cs.whiteSpace === 'nowrap', name: name(el) });
      el.querySelectorAll(':scope > svg').forEach(visit);
      el.querySelectorAll(':scope > img').forEach(visit);
      return;
    }
    for (const c of el.children) visit(c);
  }
  visit(document.querySelector('.poster'));
  return out;
});

// ---------- 2. Rasterise icons and SVG images to PNG (PowerPoint and Canva both import PNG reliably) ----------
const raster = await browser.newPage({ deviceScaleFactor: 1 });
let n = 0;
async function png(svgMarkup, w, h) {
  const file = path.join(work, `r${n++}.png`);
  await raster.setViewportSize({ width: Math.ceil(w), height: Math.ceil(h) });
  await raster.setContent(`<html><body style="margin:0;background:transparent">${svgMarkup}</body></html>`);
  await raster.screenshot({ path: file, omitBackground: true });
  return file;
}
for (const it of items) {
  if (it.kind === 'icon') {
    it.file = await png(it.svg.replace('width="256" height="256"', 'width="256" height="256" style="display:block"'), 256, 256);
  } else if (it.kind === 'img') {
    const p = decodeURIComponent(new URL(it.src).pathname).replace(/^\/([A-Za-z]:)/, '$1');
    if (p.toLowerCase().endsWith('.svg')) {
      const k = 4, W = it.w * k, H = it.h * k;
      const data = `data:image/svg+xml;base64,${fs.readFileSync(p).toString('base64')}`;   // file:// is blocked in a blank page
      it.file = await png(`<img src="${data}" style="display:block;width:${W}px;height:${H}px">`, W, H);
    } else it.file = p;
  }
}
await browser.close();

// ---------- 3. Write the slide ----------
const pres = new PptxGenJS();
pres.defineLayout({ name: 'POSTER_1920x1080', width: 20, height: 11.25 });
pres.layout = 'POSTER_1920x1080';
pres.title = 'FloodWay poster';
pres.theme = { headFontFace: 'Outfit', bodyFontFace: 'Inter' };   // new text added in PowerPoint or Canva matches the poster
pres.author = 'RESQ4ACE';
const slide = pres.addSlide();
slide.background = { color: 'F1F6F7' };
const shapeName = (it, i) => `${it.kind} ${i} ${it.name || ''}`.trim().slice(0, 60);
items.forEach((it, i) => {
  const pos = { x: IN(it.x), y: IN(it.y), w: IN(it.w), h: IN(it.h), rotate: it.rot || 0, objectName: shapeName(it, i) };
  if (it.kind === 'box') {
    const r = Math.min(it.r, it.w / 2, it.h / 2);
    slide.addShape(r > 0.5 ? pres.shapes.ROUNDED_RECTANGLE : pres.shapes.RECTANGLE, {
      ...pos, ...(r > 0.5 ? { rectRadius: IN(r) } : {}),
      fill: it.fill ? { color: it.fill.hex, transparency: Math.round((1 - it.fill.a) * 100) } : { type: 'none' },
      line: it.line ? { color: it.line.hex, width: PT(it.lw), transparency: Math.round((1 - it.line.a) * 100) } : { type: 'none' },
    });
  } else if (it.kind === 'img' || it.kind === 'icon') {
    const opt = { path: it.file, ...pos };
    if (it.fit === 'cover') opt.sizing = { type: 'cover', w: pos.w, h: pos.h };
    if (it.opacity !== undefined && it.opacity < 1) opt.transparency = Math.round((1 - it.opacity) * 100);
    slide.addImage(opt);
  } else if (it.kind === 'text') {
    const parts = [];
    it.runs.forEach((r, k) => {
      if (r.br) { if (parts.length) parts[parts.length - 1].options.breakLine = true; return; }
      let text = r.text;
      if (k === 0 || it.runs[k - 1].br) text = text.replace(/^\s+/, '');
      if (k === it.runs.length - 1 || it.runs[k + 1]?.br) text = text.replace(/\s+$/, '');
      if (!text) return;
      parts.push({ text, options: { color: r.color ? r.color.hex : '0A2530', fontSize: PT(r.size), bold: r.bold, italic: r.italic, fontFace: r.font, charSpacing: r.spacing ? PT(r.spacing) : undefined } });
    });
    if (!parts.length) return;
    // 1% slack: with the same fonts installed (Outfit, Inter), PowerPoint and Canva wrap like Chrome; more slack changes the wraps.
    // Exact line spacing only for running text; tight display type (line-height under 1.1) keeps the font's own leading.
    const big = Math.max(...it.runs.filter((r) => !r.br).map((r) => r.size));
    const spacing = it.lh / big >= 1.1 ? { lineSpacing: PT(it.lh) } : {};
    slide.addText(parts, { ...pos, w: IN(it.w * 1.01 + 1), h: IN(it.h + 4), margin: 0, valign: 'top', align: it.align, ...spacing, wrap: !(it.nowrap || it.h <= it.lh * 1.5), fit: 'none', isTextBox: true });   // one line in the poster stays one line
  }
});
const outFile = path.join(dir, 'FloodWay_Poster_1920x1080.pptx');
await pres.writeFile({ fileName: outFile });
const counts = items.reduce((m, it) => ((m[it.kind] = (m[it.kind] || 0) + 1), m), {});
console.log('->', outFile, JSON.stringify(counts));
