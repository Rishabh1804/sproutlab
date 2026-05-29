import { test, expect } from '@playwright/test';

// food-sub-tab-v1 F-3 — diet-tab Library surface (search + filter + per-food
// detail sheet with Chemistry). Drives the global F-3 functions against the
// real template DOM after app init, so the test is durable against bottom-nav
// markup changes while still exercising the live render path end-to-end.
//
// The Library lives inside #tab-diet, which sits under display:none until the
// diet tab is navigated to — never in this harness. So surface-toggle checks
// assert the state the code sets (host.hidden / grid.style.display) via a
// single evaluate rather than Playwright visibility, which is unreliable under
// a hidden ancestor. Content/structure assertions (allInnerTexts, toHaveClass,
// toContainText) do not require visibility and are used directly.

test.describe('F-3 Library — search, filter, detail sheet', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html?nosync');
    // Wait for app init (function decls land on window) + the static Library
    // scaffold to be present.
    await page.waitForFunction(() => typeof (window as any).renderDietLibrary === 'function'
      && !!document.getElementById('foodLibFilterRail'));
    // Open the Library sub-tab via the real lazy-render hook.
    await page.evaluate(() => (window as any).renderDietLibrary());
  });

  test('filter rail renders all 5 ratified filters', async ({ page }) => {
    const chips = await page.locator('#foodLibFilterRail .food-lib-chip').allInnerTexts();
    expect(chips).toEqual(['Allergen', 'Age-gated', 'High iron', 'High protein', 'High calcium']);
  });

  test('search flattens accordion into filtered NUTRITION results', async ({ page }) => {
    const state = await page.evaluate(() => {
      const w = window as any;
      w.renderDietLibrary();
      const grid = document.getElementById('foodsGrid') as HTMLElement;
      const host = document.getElementById('foodLibResults') as HTMLElement;
      const idle = { gridDisplay: grid.style.display, hostHidden: host.hidden };
      const el = document.getElementById('foodLibSearch') as HTMLInputElement;
      el.value = 'oat';
      w.foodLibOnSearch(el);
      const names = Array.from(host.querySelectorAll('.flc-name'))
        .map(n => (n.textContent || '').toLowerCase());
      return { idle, active: { gridDisplay: grid.style.display, hostHidden: host.hidden }, names };
    });
    // No query → accordion spine shown, results hidden.
    expect(state.idle).toEqual({ gridDisplay: '', hostHidden: true });
    // Search active → accordion hidden, results shown.
    expect(state.active).toEqual({ gridDisplay: 'none', hostHidden: false });
    // 'oats' matches; an unrelated food does not.
    expect(state.names.some(n => n.includes('oat'))).toBe(true);
    expect(state.names.some(n => n === 'banana')).toBe(false);
  });

  test('high-iron filter excludes spice-tier foods (per-serving safety)', async ({ page }) => {
    const names = await page.evaluate(() => {
      (window as any).foodLibFilter('iron');
      const host = document.getElementById('foodLibResults') as HTMLElement;
      return Array.from(host.querySelectorAll('.flc-name'))
        .map(n => (n.textContent || '').toLowerCase());
    });
    // ragi is a genuine iron source → present.
    expect(names).toContain('ragi');
    // jeera / turmeric carry per-100g iron tokens but are spice-tier → excluded.
    expect(names).not.toContain('jeera');
    expect(names).not.toContain('turmeric');
  });

  test('detail sheet shows nutrition + Chemistry (Arc B fold)', async ({ page }) => {
    await page.evaluate(() => (window as any).foodLibDetail('oats'));
    await expect(page.locator('#foodDetailSheet')).toHaveClass(/open/);
    await expect(page.locator('#foodDetailTitle')).toHaveText('oats');
    const body = page.locator('#foodDetailBody');
    await expect(body).toContainText('Key nutrients');
    await expect(body).toContainText('Chemistry');
    await expect(body).toContainText('Fibre');
    // oats carries bioactives (beta-glucan / avenanthramides).
    await expect(body).toContainText('Bioactives');
  });

  test('mark-tried round-trips through the introduced-foods store', async ({ page }) => {
    const novel = 'dragon fruit'; // in NUTRITION, unlikely pre-seeded as tried
    const before = await page.evaluate((n) => (window as any)._fdIsFoodTried(n), novel);
    await page.evaluate((n) => {
      (window as any).renderFoodDetailSheet(n);
      (window as any).foodLibToggleTried(n); // add path is one-tap (no confirm)
    }, novel);
    const after = await page.evaluate((n) => (window as any)._fdIsFoodTried(n), novel);
    expect(before).toBe(false);
    expect(after).toBe(true);
  });
});
