import { test, expect } from '@playwright/test';

// "Can I give this?" — the recipe-aware search bar (WIRING_PLAN §10). ONE shared
// resolver (_resolveRecipeAnswer) powers BOTH surfaces — the Patterns combo bar
// (checkFoodCombo → renderComboResult) and the Home Smart-Q&A (qaHandleFoodSafety)
// — so they never diverge. Applicability = the verdict is NOT 'avoid' AND not
// preference-blocked. The recipe is applicability-gated + corpus-sourced; the
// SAFETY path is never gated.

declare const checkFoodCombo: () => void;
declare const qaHandleFoodSafety: (c: any) => any;
declare const openRecipeInTab: (id: string) => void;

const setPref = (page: any, pref: string) =>
  page.evaluate((p: string) => localStorage.setItem('ziva_diet_pref', p), pref);

// drive the Patterns combo bar and return #comboResult innerHTML
const runCombo = (page: any, query: string) =>
  page.evaluate((q: string) => {
    const inp = document.getElementById('comboInput') as HTMLInputElement;
    inp.value = q;
    (window as any).checkFoodCombo();
    return document.getElementById('comboResult')!.innerHTML;
  }, query);

test.describe('"Can I give this?" — recipe-aware (§10)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() =>
      typeof (window as any).checkFoodCombo === 'function'
      && typeof (window as any).qaHandleFoodSafety === 'function'
      && typeof (window as any)._resolveRecipeAnswer === 'function'
      && Array.isArray((window as any).RECIPES), null, { timeout: 10_000 });
    await setPref(page, 'nonveg');
  });

  // 7 — not applicable (avoid) → reason, NO recipe block (fixes empty-recipe-for-honey)
  test('avoid food → reason, no recipe block (Patterns + Home)', async ({ page }) => {
    const html = await runCombo(page, 'honey');
    expect(html).not.toContain('combo-recipe');          // no recipe rendered
    expect(html.toLowerCase()).toContain('avoid');         // the verdict/reason leads

    const homeCard = await page.evaluate(() =>
      (window as any).qaHandleFoodSafety({ raw: 'can i give honey' }).recipeCard);
    expect(homeCard).toBeNull();                            // no Home recipe affordance
  });

  // 8 — applicable + curated corpus hit → recipe + a tap-through to the Recipes tab
  test('applicable + curated → recipe with an Open-in-Recipes tap-through', async ({ page }) => {
    const html = await runCombo(page, 'moong dal + rice');
    expect(html).toContain('combo-recipe');                // a recipe renders
    expect(html).toContain('openRecipeInTab');             // corpus tap-through wired
    // The Home bar resolves the same corpus recipe (shared resolver, no divergence).
    const homeCard = await page.evaluate(() =>
      (window as any).qaHandleFoodSafety({ raw: 'can i give moong dal and rice' }).recipeCard);
    expect(homeCard).not.toBeNull();
    expect(typeof homeCard.id).toBe('string');
  });

  // 9 — preference-blocked → reason, recipe SUPPRESSED, but SAFETY still fires
  test('off-preference food → recipe suppressed, preference reason, safety still renders', async ({ page }) => {
    await setPref(page, 'veg');
    const html = await runCombo(page, 'fish');
    expect(html).not.toContain('combo-recipe');            // recipe withheld for a veg household
    expect(html.toLowerCase()).toContain('preference');    // the preference reason surfaces
    // the fish safety record is NEVER gated — its floor/allergen content still renders
    expect(html).toMatch(/cons-severe|cons-seek|allergen|Allergen/);
  });

  // 10 — Home tap-through lands on Track → Diet → Recipes and expands the recipe
  test('openRecipeInTab activates Track→Diet→Recipes and expands the recipe', async ({ page }) => {
    await page.evaluate(() => (window as any).openRecipeInTab('moong-dal-khichdi'));
    await page.waitForTimeout(250);
    const state = await page.evaluate(() => ({
      dietActive: document.getElementById('tab-diet')!.classList.contains('active'),
      recipesActive: document.getElementById('diet-sub-recipes')!.classList.contains('active'),
      rowExpanded: (() => {
        const d = document.getElementById('rdet-c-moong-dal-khichdi');
        return !!d && d.style.display === 'block';
      })(),
    }));
    expect(state.dietActive).toBe(true);
    expect(state.recipesActive).toBe(true);
    expect(state.rowExpanded).toBe(true);
  });
});
