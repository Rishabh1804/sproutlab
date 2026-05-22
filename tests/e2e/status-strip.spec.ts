import { test, expect } from '@playwright/test';

// PR-P follow-up — the status strip must collapse entirely when its sync
// indicator (and the other strip children) are hidden, leaving no empty band.

test('status strip is collapsed when the sync indicator is silent', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const strip = page.locator('#statusStrip');
  // Routine sync state → indicator hidden → strip must take no layout space.
  await expect(strip).toBeHidden();

  // A not-syncing state surfaces the indicator → the strip reappears.
  await page.evaluate(() => _syncUpdateStatusIndicator({ state: 'halted', pending: 1 }));
  await page.waitForTimeout(150);
  await expect(strip).toBeVisible();
  expect((await strip.boundingBox())!.height).toBeGreaterThan(0);

  // Back to a routine state → strip collapses away again.
  await page.evaluate(() => _syncUpdateStatusIndicator({ state: 'online', pending: 0 }));
  await page.waitForTimeout(150);
  await expect(strip).toBeHidden();
});
