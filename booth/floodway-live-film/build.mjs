// Builds index.html: one self-contained file (fonts and images embedded as data URIs, no network).
// Usage: node build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const src = (f) => fs.readFileSync(path.join(HERE, 'src', f), 'utf8');
const uri = (file, mime) => `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`;

const fontDir = path.join(HERE, '..', 'floodway-loop', 'node_modules', '@fontsource', 'outfit', 'files');
const fonts = [400, 600, 700, 800].map((w) =>
  `@font-face{font-family:Outfit;font-weight:${w};font-style:normal;font-display:block;src:url(${uri(path.join(fontDir, `outfit-latin-${w}-normal.woff2`), 'font/woff2')}) format('woff2')}`).join('\n');

const live = path.join(ROOT, 'frontend', 'public', 'media', 'live');
const poster = path.join(ROOT, 'docs', 'product', 'preliminary-round', 'poster', 'assets');
const assets = { 'live-phone': uri(path.join(poster, 'live-phone.jpg'), 'image/jpeg'), logo: uri(path.join(poster, 'logo.svg'), 'image/svg+xml'), qr: uri(path.join(poster, 'qr-floodway.svg'), 'image/svg+xml') };
for (let r = 0; r <= 110; r += 10) assets[`klang-r${String(r).padStart(3, '0')}`] = uri(path.join(live, `klang-r${String(r).padStart(3, '0')}.webp`), 'image/webp');

let scenes = src('scenes.html');
scenes = scenes.replace(/\{\{([a-z0-9-]+)\}\}/g, (m, k) => { if (!assets[k]) throw new Error('missing asset ' + k); return assets[k]; });
const html = src('shell.html')
  .replace('/*FONTS*/', () => fonts)
  .replace('<!--SCENES-->', () => scenes)
  .replace('/*FILM_JS*/', () => src('film.js') + '\n' + src('film-scenes.js'));
fs.writeFileSync(path.join(HERE, 'index.html'), html);
console.log(`index.html written (${(html.length / 1024 / 1024).toFixed(2)} MB, ${Object.keys(assets).length} images, 4 font weights)`);
