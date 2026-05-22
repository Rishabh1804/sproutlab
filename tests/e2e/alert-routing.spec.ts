import { test, expect } from '@playwright/test';

// PR-O — accurate interactivity: every alert "View" button lands on the card
// where its data lives; the "+N more in Insights" links are no longer dead.

test('every ALERT_CARD route points at a card that exists in the DOM', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const bad = await page.evaluate(() => {
    const missing: string[] = [];
    for (const id of Object.keys(ALERT_CARD)) {
      const { card } = ALERT_CARD[id];
      if (!document.getElementById(card)) missing.push(id + ' -> ' + card);
    }
    return missing;
  });
  expect(bad, 'all alert routes resolve to a real card').toEqual([]);
});

test('alert "View details" buttons carry a gotoCard route, not a bare tab switch', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.locator('#homeUnifiedAlertsCard, #homeZenState').first().waitFor({ state: 'attached' });
  await page.waitForTimeout(800);

  const secondaries = page.locator('#unifiedAlertsContent .cab-secondary');
  const n = await secondaries.count();
  for (let i = 0; i < n; i++) {
    const btn = secondaries.nth(i);
    // Routed alerts use gotoCard with a card target; un-routed fall back to switchTab.
    const act = await btn.getAttribute('data-action');
    expect(['gotoCard', 'switchTab']).toContain(act);
    if (act === 'gotoCard') {
      expect(await btn.getAttribute('data-arg2'), 'gotoCard carries a card id').toBeTruthy();
    }
  }
});

test('the "+N more in Insights" link is no longer a dead click', async ({ page }) => {
  // Skip the first-run guide; use full (non-essential) mode — Essential Mode
  // hides .ca-view-all via CSS, so the overflow link only exists in full mode.
  await page.addInitScript(() => {
    localStorage.setItem('ziva_guide_seen', 'true');
    localStorage.setItem('ziva_essential_mode', 'false');
  });
  await page.goto('/index.html?nosync');
  await page.locator('#homeUnifiedAlertsCard, #homeZenState').first().waitFor({ state: 'attached' });
  await page.waitForTimeout(800);

  const viewAll = page.locator('.ca-view-all');
  const n = await viewAll.count();
  test.skip(n === 0, 'seed produced no alert/win overflow');

  // It must carry a delegated data-action (the old data-tab-scroll binding
  // is wired at init and never reaches this dynamically rendered element).
  await expect(viewAll.first()).toHaveAttribute('data-action', 'gotoCard');
  await viewAll.first().click();
  await page.waitForTimeout(500);
  await expect(page.locator('#tab-insights')).toHaveClass(/active/);
});

test('gotoCard expands the target card and back returns to the origin', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ziva_guide_seen', 'true'));
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  // Jump to a collapsed card from the home tab.
  await page.evaluate(() => gotoCard('insights', 'insightsCorrelationCard'));
  await page.waitForTimeout(600);
  await expect(page.locator('#tab-insights')).toHaveClass(/active/);
  // The card's collapse body is expanded on arrival, not left collapsed.
  await expect(page.locator('#insightsCorrBody')).toHaveClass(/open/);

  // Back unwinds the breadcrumb to the origin tab.
  await page.goBack();
  await page.waitForTimeout(500);
  await expect(page.locator('#tab-home')).toHaveClass(/active/);
});
