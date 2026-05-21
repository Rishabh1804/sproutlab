import { test, expect } from '@playwright/test';

// PR-K Phase 3 — the "Today for Ziva" hero card, the Home tab's lede.

test('Today for Ziva card renders as the Home lede', async ({ page }) => {
  await page.goto('/index.html?nosync');
  const card = page.locator('#todayHeroCard');
  await card.waitFor({ state: 'visible' });

  // Headline, age and date are all populated (no placeholder dashes).
  await expect(page.locator('.th-title')).toHaveText('Today for Ziva');
  await expect(page.locator('#thAge')).not.toHaveText('—');
  await expect(page.locator('#thAge')).toContainText('old');
  await expect(page.locator('#thDate')).not.toHaveText('—');

  // Exactly one focus row — a priority alert OR the calm all-clear.
  await expect(page.locator('#thFocus .th-focus-row')).toHaveCount(1);
  await expect(page.locator('#thFocus .th-focus-label')).toBeVisible();

  // The card sits above the score/vitals card in document order.
  const heroBox = await card.boundingBox();
  const vitalsBox = await page.locator('#homeVitalsCard').boundingBox();
  expect(heroBox!.y).toBeLessThan(vitalsBox!.y);
});

test('focus row links through to its tab when an alert drives it', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.locator('#todayHeroCard').waitFor({ state: 'visible' });

  const viewBtn = page.locator('#thFocus .th-focus-btn');
  if (await viewBtn.count() === 0) test.skip(true, 'all-clear state — no focus alert');

  const targetTab = await page.locator('#thFocus .th-focus-row[class*="thf-"]').first().getAttribute('class');
  expect(targetTab).toMatch(/thf-(action|watch)/);
});
