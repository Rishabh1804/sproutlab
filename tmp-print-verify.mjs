import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const OUT = 'C:/Users/risha/sproutlab/sproutlab/tmp-shots2';
mkdirSync(OUT, { recursive: true });

let browser;
try { browser = await chromium.launch(); }
catch { browser = await chromium.launch({ channel: 'msedge' }); }
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await ctx.addInitScript(() => { try { localStorage.setItem('ziva_theme', 'dark'); } catch {} });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
await page.evaluate(() => { if (typeof openGeneralEmergencyRoom === 'function') openGeneralEmergencyRoom(); });
await page.waitForTimeout(500);
await page.locator('.ge-row[data-arg="allergic-reaction"]').first().click();
await page.waitForTimeout(400);
await page.locator('.ec-docprep').first().click();   // flip to doctor face
await page.waitForTimeout(600);
// Stamp the first two time fields so [data-stamped] (the rose time value) is exercised.
const stamps = page.locator('.docface .doc-stamp');
const n = await stamps.count();
console.log('stamp fields:', n);
for (let i = 0; i < Math.min(2, n); i++) { await stamps.nth(i).click(); await page.waitForTimeout(150); }
// Now simulate the print path: emulate print media + the doc-printing/doc-print flags emSaveDoc sets.
await page.emulateMedia({ media: 'print' });
await page.evaluate(() => {
  document.body.classList.add('doc-printing');
  const host = document.querySelector('.food-pop') || document.querySelector('.ge-pinned-card');
  if (host) host.classList.add('doc-print');
});
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/05-doctor-PRINT-from-dark.png` });
console.log('shot 05 PRINT view (stamped, from dark mode)');
await browser.close();
console.log('DONE');
