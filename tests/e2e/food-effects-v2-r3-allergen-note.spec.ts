import { test, expect } from '@playwright/test';

// food-effects v2 — R3: the diet allergen note / food-detail flag
// (renderFoodDetailSheet → _fdAllergenNote) reconciled onto FOOD_EFFECTS (§3.3).
//
// M-S-6 (the defect): the terse ALLERGENS string names only MILD signs
// (rash/swelling/vomiting) and OMITS anaphylaxis — an under-warn on the browse
// surface. Where a FOOD_EFFECTS record exists, the flag now surfaces the record's
// framing (eff.title, encourage-aware) + the safe-form gate + the shared severe
// floor (_severeFloorHtml, M-S-7 — same floor as the action path + combo + Q&A).
// Falls back to the terse string only when no record exists; V-M-201 neutral note
// preserved when neither exists.
declare const renderFoodDetailSheet: (name: string) => void;
declare const getFoodEffect: (name: string) => any;

async function detail(page: any, name: string) {
  return page.evaluate((n: string) => {
    renderFoodDetailSheet(n);
    const el = document.getElementById('foodDetailBody')!;
    return {
      html: el.innerHTML,
      severe: el.querySelectorAll('.cons-severe').length,
      watch: el.querySelectorAll('.cons-watch').length,
      seek: el.querySelectorAll('.cons-seek').length,
      allergenFlag: !!el.querySelector('.fd-flag-allergen'),
      neutral: !!el.querySelector('.fd-flag-neutral'),
    };
  }, name);
}

test.describe('food-effects v2 — R3 allergen note / food-detail flag', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() =>
      typeof renderFoodDetailSheet === 'function'
      && typeof getFoodEffect === 'function'
      && !!document.getElementById('foodDetailBody'), null, { timeout: 10_000 });
  });

  test('M-S-6: peanut surfaces the ANAPHYLAXIS floor, not the mild-only legacy string', async ({ page }) => {
    const d = await detail(page, 'peanut');
    expect(d.severe, 'anaphylaxis severe strip present (not mild-only)').toBeGreaterThan(0);
    expect(d.seek, 'seek-care line present').toBeGreaterThan(0);
    // record-framed header (encourage-aware), never a bare scary "Allergen."
    expect(d.html, 'header from eff.title').toContain('good to introduce early');
    // the safe-form gate (A-2) is surfaced
    expect(d.html.toLowerCase()).toContain('does not remove the allergy risk');
    // the severe strip names a true anaphylaxis sign, not just rash/swelling/vomiting
    expect(d.html.toLowerCase()).toMatch(/trouble breathing|swelling of the face|floppy/);
  });

  test('honey surfaces the botulism floor in the detail sheet (acute-toxin)', async ({ page }) => {
    const d = await detail(page, 'honey');
    expect(d.html, 'record-framed header').toContain('Honey before 12 months');
    expect(d.watch, 'botulism watch-fors render').toBeGreaterThan(0);
    expect(d.seek, 'seek-care renders').toBeGreaterThan(0);
    expect(d.html.toLowerCase()).toMatch(/constipation|weak cry|floppiness/);
  });

  test('a tree-nut alias (badam) inherits the record floor', async ({ page }) => {
    const d = await detail(page, 'badam');
    expect(d.severe, 'badam → tree-nut anaphylaxis floor').toBeGreaterThan(0);
  });

  test('an ALLERGENS food with no record (egg) falls back to the terse string — no fabricated floor', async ({ page }) => {
    const d = await detail(page, 'egg');
    expect(d.allergenFlag, 'terse allergen flag still shown').toBe(true);
    expect(d.severe + d.watch + d.seek, 'no record → no severe/botulism floor fabricated').toBe(0);
  });

  test('V-M-201 preserved: a food with no record and no allergen shows the neutral 3-day note', async ({ page }) => {
    const d = await detail(page, 'apple');
    expect(d.neutral, 'neutral 3-day-rule note (not a green light)').toBe(true);
    expect(d.severe + d.watch + d.seek, 'no floor for a non-allergen').toBe(0);
  });
});
