#!/usr/bin/env node
/**
 * FloodWay film build: src/*.js + src/shell.html + src/timeline.json -> index.html (one self-contained file).
 * Embeds Outfit (SIL OFL, @fontsource/outfit) as base64 WOFF2 at weights 400/600/700/800.
 *   node build.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, 'src');
const FONT_DIR = path.join(HERE, 'node_modules', '@fontsource', 'outfit', 'files');

const put = (s, token, value) => {
  if (!s.includes(token)) throw new Error('Missing token ' + token);
  return s.split(token).join(value);          // split/join: no "$" replacement surprises
};

const faces = [400, 600, 700, 800].map(w => {
  const file = path.join(FONT_DIR, 'outfit-latin-' + w + '-normal.woff2');
  if (!fs.existsSync(file)) throw new Error('Font not found: ' + file + ' (run npm install)');
  const b64 = fs.readFileSync(file).toString('base64');
  return "@font-face { font-family: 'Outfit'; src: url('data:font/woff2;base64," + b64
    + "') format('woff2'); font-weight: " + w + "; font-style: normal; font-display: block; }";
}).join('\n');

const timeline = JSON.parse(fs.readFileSync(path.join(SRC, 'timeline.json'), 'utf8'));
const parts = fs.readdirSync(SRC).filter(f => /^\d\d-.*\.js$/.test(f)).sort();
let script = parts.map(f => '/* ---- ' + f + ' ---- */\n' + fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n');
script = '(() => {\n\'use strict\';\n' + put(script, '/*__TIMELINE__*/null', JSON.stringify(timeline)) + '\n})();';
if (script.includes('</script')) throw new Error('Script contains a closing script tag');

let html = fs.readFileSync(path.join(SRC, 'shell.html'), 'utf8');
html = put(html, '/*__FONTFACES__*/', faces);
html = put(html, '/*__SCRIPT__*/', script);
fs.writeFileSync(path.join(HERE, 'index.html'), html, 'utf8');
fs.mkdirSync(path.join(HERE, 'out'), { recursive: true });
fs.writeFileSync(path.join(HERE, 'out', 'timeline.json'), JSON.stringify(timeline, null, 2));
console.log('index.html written: ' + (html.length / 1024).toFixed(1) + ' KB from ' + parts.join(', '));
