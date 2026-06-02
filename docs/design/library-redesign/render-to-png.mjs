// Rasterise a design-rendering HTML file to PNG (plan §0 — the design record is
// stored in both HTML and PNG). Reusable across S1 / S5 / S8.
//   node render-to-png.mjs <input.html> <output.png> [viewportWidth]
import { chromium } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const [, , inFile, outFile, widthArg] = process.argv;
if (!inFile || !outFile) {
  console.error('usage: node render-to-png.mjs <input.html> <output.png> [width]');
  process.exit(1);
}
const width = parseInt(widthArg || '460', 10);

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width, height: 900 },
  deviceScaleFactor: 2,
});
await page.goto(pathToFileURL(resolve(inFile)).href, { waitUntil: 'networkidle', timeout: 15000 })
  .catch(() => page.goto(pathToFileURL(resolve(inFile)).href, { waitUntil: 'load' }));
// give web fonts a moment if they loaded; harmless if they didn't
await page.waitForTimeout(400);
await page.screenshot({ path: resolve(outFile), fullPage: true });
await browser.close();
console.log('wrote', outFile);
