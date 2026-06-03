// Rasterise a design-rendering HTML file to PNG (shared design-record harness).
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
const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(resolve(inFile)).href, { waitUntil: 'networkidle', timeout: 15000 })
  .catch(() => page.goto(pathToFileURL(resolve(inFile)).href, { waitUntil: 'load' }));
await page.waitForTimeout(400);
await page.screenshot({ path: resolve(outFile), fullPage: true });
await browser.close();
console.log('wrote', outFile);
