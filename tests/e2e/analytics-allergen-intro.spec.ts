import { test, expect } from '@playwright/test';

// Analytics prototype — Allergen Introduction card (Info tab).
// The analysis layer on top of the food-effects-v2 resolver: it tracks the
// high-priority introduce-early allergens and resolves the parent's tried foods
// through the SAME getFoodEffect spine the consequence surfaces use — so a
// logged "almond" counts as Tree nuts introduced, and the 3-day watch /
// tolerated / reaction states are derived, never hardcoded.
declare const foods: any[];
declare const feedingData: Record<string, any>;
declare const today: () => string;
declare const _offsetDateStr: (base: string, off: number) => string;
declare const _aiComputeAllergenIntro: () => any;
declare const renderInfoAllergenIntro: () => void;

async function seedAndCompute(page: any, seed: Array<{ name: string; reaction: string; offset: number }>) {
  return page.evaluate((rows: Array<{ name: string; reaction: string; offset: number }>) => {
    foods.length = 0;
    rows.forEach((r) => foods.push({ name: r.name, reaction: r.reaction, date: _offsetDateStr(today(), r.offset) }));
    return _aiComputeAllergenIntro();
  }, seed);
}
const byKey = (d: any, key: string) => d.items.find((i: any) => i.key === key);

test.describe('analytics prototype — Allergen Introduction card', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() =>
      typeof _aiComputeAllergenIntro === 'function'
      && typeof renderInfoAllergenIntro === 'function'
      && typeof foods !== 'undefined'
      && !!document.getElementById('infoAllergenIntroCard'), null, { timeout: 10_000 });
  });

  test('empty log, age ≥ 6mo → every allergen reads "ready to try"', async ({ page }) => {
    const d = await seedAndCompute(page, []);
    expect(d.total).toBe(6);
    expect(d.introduced).toBe(0);
    expect(d.ready).toBe(6);
    expect(d.items.every((i: any) => i.state === 'ready')).toBe(true);
  });

  test('alias resolution: logging "almond" marks Tree nuts introduced (not raw-name match)', async ({ page }) => {
    const d = await seedAndCompute(page, [{ name: 'almond', reaction: 'ok', offset: -10 }]);
    const tn = byKey(d, 'tree nut');
    expect(tn.tried, 'almond resolved to the tree-nut record').toBe(true);
    expect(tn.state, '10 days clear of the 3-day watch → tolerated').toBe('tolerated');
    expect(d.introduced).toBe(1);
  });

  test('the 3-day watch window: just-introduced → watching, not yet tolerated', async ({ page }) => {
    const d = await seedAndCompute(page, [{ name: 'peanut butter', reaction: 'ok', offset: -1 }]);
    const pn = byKey(d, 'peanut');
    expect(pn.tried, 'peanut butter → peanut record').toBe(true);
    expect(pn.state, '1 day in → still watching').toBe('watching');
    expect(d.watching).toBe(1);
  });

  test('a flagged reaction surfaces as "reaction", never silently tolerated', async ({ page }) => {
    const d = await seedAndCompute(page, [{ name: 'egg', reaction: 'watch', offset: -9 }]);
    const egg = byKey(d, 'egg');
    expect(egg.state, "reaction:'watch' → reaction state even though 9 days passed").toBe('reaction');
  });

  test('mixed log renders 6 rows with the right pills + an actionable (notable) tier', async ({ page }) => {
    const dom = await page.evaluate(() => {
      foods.length = 0;
      foods.push({ name: 'cashew', reaction: 'ok', date: _offsetDateStr(today(), -20) }); // tree nut tolerated
      foods.push({ name: 'peanut', reaction: 'ok', date: _offsetDateStr(today(), -1) });  // watching
      renderInfoAllergenIntro();
      const card = document.getElementById('infoAllergenIntroCard')!;
      return {
        rows: card.querySelectorAll('.cd-food-item').length,
        summary: document.getElementById('infoAllergenIntroSummary')!.textContent || '',
        pos: card.querySelectorAll('.cd-pill-pos').length,
        neutral: card.querySelectorAll('.cd-pill-neutral').length,
        tier: card.getAttribute('data-card-priority') || '',
        bar: card.querySelectorAll('#infoAllergenIntroSummary .cd-bar-fill').length,
      };
    });
    expect(dom.rows, 'one row per allergen in the set').toBe(6);
    expect(dom.summary).toMatch(/2 of 6 introduced|introduced/);
    expect(dom.pos, 'tolerated + ready items carry the positive pill').toBeGreaterThan(0);
    expect(dom.bar, 'summary carries the glanceable progress bar').toBe(1);
    // ready (4 untried) + watching (1) are actionable → notable, not ambient
    expect(dom.tier).toBe('notable');
  });

  test('exposure count: meal-log days roll up to the allergen (alias-correct)', async ({ page }) => {
    const d = await page.evaluate(() => {
      foods.length = 0;
      Object.keys(feedingData).forEach((k) => delete feedingData[k]); // clear seeded defaults
      foods.push({ name: 'cashew', reaction: 'ok', date: _offsetDateStr(today(), -10) });
      // tree-nut foods logged at meals on 3 distinct days (cashew, almond ×2)
      feedingData[_offsetDateStr(today(), -10)] = { breakfast: 'cashew' };
      feedingData[_offsetDateStr(today(), -7)] = { lunch: 'almond' };
      feedingData[_offsetDateStr(today(), -3)] = { snack: 'almond + banana' };
      return _aiComputeAllergenIntro();
    });
    const tn = byKey(d, 'tree nut');
    expect(tn.exposureDays, '3 distinct meal-log days with a tree nut, via the resolver').toBe(3);
    expect(byKey(d, 'peanut').exposureDays, 'no peanut at any meal').toBe(0);
  });

  test('rows ordered by actionability — ready/watching float above tolerated', async ({ page }) => {
    const order = await page.evaluate(() => {
      foods.length = 0;
      foods.push({ name: 'cashew', reaction: 'ok', date: _offsetDateStr(today(), -20) }); // tree nut tolerated
      foods.push({ name: 'peanut', reaction: 'ok', date: _offsetDateStr(today(), -1) });  // peanut watching
      renderInfoAllergenIntro();
      return Array.from(document.querySelectorAll('#infoAllergenIntroList .cd-food-item'))
        .map((el) => el.getAttribute('data-arg'));
    });
    expect(order.indexOf('peanut'), 'watching above tolerated').toBeLessThan(order.indexOf('tree nut'));
    expect(order.indexOf('egg'), 'ready above tolerated').toBeLessThan(order.indexOf('tree nut'));
  });

  test('a row taps through to the food detail sheet (the R3 floor for peanut)', async ({ page }) => {
    await page.evaluate(() => { foods.length = 0; renderInfoAllergenIntro(); });
    const row = page.locator('#infoAllergenIntroList .cd-food-item[data-arg="peanut"]');
    await expect(row, 'each allergen row is wired to foodLibDetail').toHaveAttribute('data-action', 'foodLibDetail');
    // tapping opens the detail sheet for the resolved food, carrying the floor
    await row.evaluate((el: HTMLElement) => el.click());
    const detail = await page.evaluate(() => {
      const sheet = document.getElementById('foodDetailSheet');
      const body = document.getElementById('foodDetailBody');
      const open = !!sheet && getComputedStyle(sheet).display !== 'none';
      return { open, severe: body ? body.querySelectorAll('.cons-severe').length : 0 };
    });
    expect(detail.open, 'foodDetailSheet modal opened').toBe(true);
    expect(detail.severe, 'peanut detail carries the anaphylaxis floor (R3 continuity)').toBeGreaterThan(0);
  });
});
