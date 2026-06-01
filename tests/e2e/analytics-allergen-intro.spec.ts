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

  test('a flagged reaction is NOT counted as introduced — open work, not a win (V-V-1)', async ({ page }) => {
    const d = await seedAndCompute(page, [
      { name: 'almond', reaction: 'ok', offset: -20 }, // tree nut tolerated → a real introduction
      { name: 'egg', reaction: 'watch', offset: -9 },  // reaction → must NOT inflate the count
    ]);
    expect(byKey(d, 'egg').state).toBe('reaction');
    expect(d.introduced, 'reaction excluded from the introduced rollup (bar + summary stay honest)').toBe(1);
    expect(d.reactions, 'surfaced as its own flagged count instead').toBe(1);
  });

  test('a future-dated entry does not render a watch window that has not started (V-V-2)', async ({ page }) => {
    const d = await seedAndCompute(page, [{ name: 'peanut', reaction: 'ok', offset: 2 }]);
    const pn = byKey(d, 'peanut');
    expect(pn.state, 'future date clamps to day 0 → watching, not abs()-counted tolerated').toBe('watching');
    expect(pn.daysSince, 'clamped to 0 (renders "Day 1 of 3"), not abs(2)').toBe(0);
  });

  test('egg carries its cook-well floor from its FOOD_EFFECTS record (Phase δ)', async ({ page }) => {
    const egg = byKey(await seedAndCompute(page, []), 'egg');
    // Phase δ gave egg a real FOOD_EFFECTS record, so safeForm now comes from
    // eff.safeForm.note (the full cook-well floor), superseding the M-1 AGE_RULES
    // first-sentence stopgap. The floor is still surfaced — never null/generic;
    // the one-line glance budget is enforced separately by the length-gate below.
    if (egg.state === 'ready') {
      expect(egg.safeForm, 'egg carries its own cook-well floor (FOOD_EFFECTS)').toMatch(/cook/i);
    }
  });

  test('ready-row meta stays one line: long safe-forms point to tap-through, short ones show (Fix A)', async ({ page }) => {
    const metas = await page.evaluate(() => {
      foods.length = 0; // all untried → ready
      renderInfoAllergenIntro();
      const out: Record<string, string> = {};
      document.querySelectorAll('#infoAllergenIntroList .cd-food-item').forEach((el) => {
        out[el.getAttribute('data-arg') || ''] = el.querySelector('.cd-food-meta')?.textContent || '';
      });
      return out;
    });
    // Phase δ: each introduce-early allergen now carries a crisp authored
    // safeForm.glance (≤44) — a specific row cue, not the generic pointer
    // (Vela V-V-208-3). The full note still rides the tap-through.
    expect(metas['peanut'], 'peanut shows its specific glance cue').toMatch(/ground or smooth/i);
    expect(metas['tree nut']).toMatch(/ground or smooth/i);
    expect(metas['egg'], 'egg specific floor restored to the glance').toMatch(/yolk/i);
    expect(metas['soy']).toMatch(/tofu/i);
    // no ready meta should exceed the one-line budget (the wrap guarantee holds)
    Object.values(metas).forEach((m) => expect(m.length).toBeLessThanOrEqual(44));
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
