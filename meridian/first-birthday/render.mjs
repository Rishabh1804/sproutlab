// Frame renderer for the frozen first-birthday invite.
// Steps invite.html through time deterministically (window.seek) and
// screenshots every frame; encode the result with ffmpeg (see build-video.sh).
//
// Needs playwright-core on the module path and a Chromium binary:
//   CHROMIUM=/path/to/chrome node render.mjs <invite.html> <framesDir> [fps] [duration]
import { mkdirSync, readdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const [, , htmlPath, outDir, fpsArg, durArg] = process.argv;
if (!htmlPath || !outDir) {
  console.error('usage: node render.mjs <invite.html> <framesDir> [fps] [duration]');
  process.exit(1);
}
const FPS = Number(fpsArg) || 30;
const DUR = Number(durArg) || 10;
const FRAMES = Math.round(FPS * DUR);
mkdirSync(outDir, { recursive: true });

const executablePath = process.env.CHROMIUM
  || '/opt/pw-browsers/' + readdirSync('/opt/pw-browsers').find(d => /^chromium-\d+$/.test(d)) + '/chrome-linux/chrome';

const browser = await chromium.launch({
  executablePath,
  args: ['--force-color-profile=srgb', '--font-render-hinting=none', '--hide-scrollbars'],
});
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto('file://' + htmlPath + '?render=1');
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(250);

const t0 = Date.now();
for (let i = 0; i < FRAMES; i++) {
  const t = i / FPS;
  await page.evaluate(tt => window.seek(tt), t);
  await page.screenshot({
    path: `${outDir}/f${String(i).padStart(4, '0')}.jpg`,
    type: 'jpeg',
    quality: 94,
    clip: { x: 0, y: 0, width: 1080, height: 1920 },
  });
  if (i % 30 === 0) console.log(`frame ${i}/${FRAMES} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}
await browser.close();
console.log(`done: ${FRAMES} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
