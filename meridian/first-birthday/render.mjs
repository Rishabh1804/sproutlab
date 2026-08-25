// Frame renderer for the frozen first-birthday invite.
// Steps invite.html through time deterministically (window.seek) and
// screenshots every frame; encode the result with ffmpeg (see build-video.sh).
//
// Chromium comes from the repo's @playwright/test devDependency. Override the
// browser binary with CHROMIUM=/path/to/chrome; otherwise a Playwright-managed
// container install (/opt/pw-browsers) is used when present, else Playwright
// resolves its own browser cache.
//   node render.mjs <invite.html> <framesDir> [fps] [duration]
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const [, , htmlPath, outDir, fpsArg, durArg] = process.argv;
if (!htmlPath || !outDir) {
  console.error('usage: node render.mjs <invite.html> <framesDir> [fps] [duration]');
  process.exit(1);
}
const FPS = Number(fpsArg) || 30;
mkdirSync(outDir, { recursive: true });

let executablePath = process.env.CHROMIUM;
if (!executablePath && existsSync('/opt/pw-browsers')) {
  const dir = readdirSync('/opt/pw-browsers').find(d => /^chromium-\d+$/.test(d));
  if (dir) executablePath = `/opt/pw-browsers/${dir}/chrome-linux/chrome`;
}

const browser = await chromium.launch({
  executablePath, // undefined → Playwright resolves its own managed browser
  args: ['--force-color-profile=srgb', '--font-render-hinting=none', '--hide-scrollbars'],
});
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto('file://' + htmlPath + '?render=1');
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(250);

// duration defaults to the page's own timeline so the two can't drift
const DUR = Number(durArg) || await page.evaluate(() => window.DUR);
const FRAMES = Math.round(FPS * DUR);

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
