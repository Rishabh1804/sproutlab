// Zero-dep static server for Playwright (CT-10 mitigation: hermetic local serve).
// Serves the repo root so /index.html, /manifest.json, /icon-*.png, and /lib/firebase-*-compat.js
// resolve at the same paths the production GitHub Pages deploy uses.
//
// Usage: node tests/e2e/server.mjs [port]

import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const PORT = Number(process.argv[2] || process.env.PORT || 5173);
const ROOT = resolve(new URL('../..', import.meta.url).pathname);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.txt':  'text/plain; charset=utf-8',
};

const server = http.createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const safe = normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
    let filePath = join(ROOT, safe);
    if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('forbidden'); return; }
    let s;
    try { s = await stat(filePath); } catch { res.writeHead(404); res.end('not found'); return; }
    if (s.isDirectory()) filePath = join(filePath, 'index.html');
    const buf = await readFile(filePath);
    const type = MIME[extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    res.end(buf);
  } catch (err) {
    res.writeHead(500); res.end(String(err));
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[sl-arming] static server on http://127.0.0.1:${PORT} (root=${ROOT})`);
});
