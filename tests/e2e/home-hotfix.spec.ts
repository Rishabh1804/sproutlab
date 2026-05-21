import { test, expect } from '@playwright/test';

// PR-J hotfix — verifies two shipped Home-tab defects are fixed:
//  1. Regression: getTrend().text carries an SVG icon; updateStatPillTrends
//     assigned it via .textContent, so raw <svg> markup rendered as text on
//     the Weight / Sleep-Score pills (HR-7 violation).
//  2. Stuck alerts: positive/win alerts shipped dismissable:false, so good
//     news was permanently un-clearable in "What's Happening".

test('trend pills render the SVG icon as an element, not literal text', async ({ page }) => {
  await page.goto('/index.html?nosync');
  // Home is the default tab; trend pills populate from seed growth/sleep data.
  const wt = page.locator('#homeTrendWeight');
  await wt.waitFor({ state: 'attached' });
  // Allow the stat-pill trend updater to run.
  await page.waitForTimeout(800);

  for (const id of ['#homeTrendWeight', '#homeTrendSleep']) {
    const el = page.locator(id);
    const txt = (await el.textContent()) || '';
    // The regression symptom: literal markup in the text layer.
    expect(txt, `${id} must not contain literal SVG markup`).not.toContain('<svg');
    expect(txt, `${id} must not contain a literal <use href`).not.toContain('href="#zi-');
    const innerHTML = (await el.innerHTML()) || '';
    if (innerHTML.trim().length > 0) {
      // When populated, the icon must be a real <svg> element.
      expect(await el.locator('svg').count(), `${id} renders an <svg> element`).toBeGreaterThan(0);
    }
  }
});

test('positive/win alerts in What\'s Happening carry a clear control', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.locator('#homeUnifiedAlertsCard, #homeZenState').first().waitFor({ state: 'attached' });
  await page.waitForTimeout(800);

  // Win cards render with the 'hmw-' scope prefix → id="ca-hmw-...".
  // PR-K replaced the cold corner × with the warm "Got it" (acknowledge)
  // control — either counts as a clear affordance, so the win is not stuck.
  const winCards = page.locator('[id^="ca-hmw-"]');
  const n = await winCards.count();
  for (let i = 0; i < n; i++) {
    await expect(
      winCards.nth(i).locator('.ctx-alert-dismiss, .cab-ack'),
      'each win alert has a clear control',
    ).toHaveCount(1);
  }
});
