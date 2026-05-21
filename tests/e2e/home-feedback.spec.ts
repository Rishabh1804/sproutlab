import { test, expect } from '@playwright/test';

// PR-M — Home feedback fixes: dark-mode hero, alert re-routing.

test('gotoCard switches tab and scrolls the target card into view', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  await page.evaluate(() => gotoCard('info', 'infoSupplementCard'));
  await page.waitForTimeout(500);
  await expect(page.locator('#tab-info')).toHaveClass(/active/);
  await expect(page.locator('#infoSupplementCard')).toBeInViewport({ ratio: 0.1 });
});

test('D3 + food-correlation alerts route to where their data actually lives', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const routes = await page.evaluate(() => {
    const alerts = computeAlerts();
    const d3 = alerts.find((a) => a.id === 'supp-streak-broken');
    const corr = alerts.find((a) => a.id === 'food-correlation');
    return {
      d3: d3 ? { fn: d3.action && d3.action.fn, tab: d3.tab } : null,
      corr: corr ? { fn: corr.action && corr.action.fn, tab: corr.tab } : null,
    };
  });

  // The D3 streak alert's 30-day data lives in the Info-tab supplement card,
  // not the Medical tab — the old "View Medical" route was a stub.
  if (routes.d3) {
    expect(routes.d3.fn).toBe('gotoCard("info","infoSupplementCard")');
    expect(routes.d3.tab).toBe('info');
  }
  // The food-correlation evidence trail lives in the Insights correlation card.
  if (routes.corr) {
    expect(routes.corr.fn).toBe('gotoCard("insights","insightsCorrelationCard")');
  }
});

test('the today-hero focus row is not a glaring light block in dark mode', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.locator('#todayHeroCard').waitFor({ state: 'visible' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.waitForTimeout(300);

  const bg = await page.locator('#thFocus .th-focus-row').evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  // The bug: var(--mid) dark = #b0a0b8 — an OPAQUE light mauve, computed as
  // rgb(176,160,184) (no alpha). The fix is rgba(255,255,255,0.05): a faint
  // overlay that composites to a near-dark tone on the dark hero card.
  const m = bg.match(/rgba?\(([^)]+)\)/);
  expect(m, 'background is an rgb/rgba colour').toBeTruthy();
  const parts = m![1].split(',').map((n) => parseFloat(n));
  const alpha = parts.length === 4 ? parts[3] : 1;
  expect(alpha, 'focus-row background is a faint overlay, not an opaque light block').toBeLessThan(0.2);
});
