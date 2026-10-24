// Renders docs/product/iot/iot-node.html (three.js) to iot-node-3d.png. Needs frontend/node_modules (three, playwright-core).
// Usage: CHROME_PATH=<chrome.exe> node docs/product/iot/render-iot.mjs
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..', '..');
const { chromium } = createRequire(path.join(ROOT, 'frontend', 'package.json'))('playwright-core');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json' };

const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const { port } = server.address();

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`http://127.0.0.1:${port}/docs/product/iot/iot-node.html`);
await page.waitForFunction(() => window.READY === true, null, { timeout: 30000 });
await page.waitForTimeout(400);
await page.locator('#stage').screenshot({ path: path.join(HERE, 'iot-node-3d.png') });
await browser.close();
server.close();
console.log(errors.length ? 'errors:\n  ' + errors.join('\n  ') : 'rendered -> ' + path.join(HERE, 'iot-node-3d.png'));
