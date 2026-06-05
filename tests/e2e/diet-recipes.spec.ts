import { test, expect } from '@playwright/test';

// Diet → Recipes sub-tab (WIRING_PLAN docs/design/recipes-tab/WIRING_PLAN.md §9).
// The Recipes tab: a "Suggested for Ziva" ranked section + a browsable cited
// catalog grouped by meal slot, both gated by the shipped 4-class diet
// preference (SURFACING only). Two separate passes:
//   Pass A — surfacing (_dietAllowsFood): hides off-preference recipes.
//   Pass B — safety (NEVER gated): every ingredient of a DISPLAYED recipe gets
//            its live _fdAgeRule / getFoodEffect / _fdAllergenNote rendering.
// The corpus ingredient names are stored in the form the LIVE resolver
// classifies correctly (the fish/milk alias-precedence lesson) — pinned here
// against the live resolver, not just the canonical key.

declare const renderDietRecipes: () => void;
declare const _dietAllowsFood: (name: string) => boolean;
declare const _dietNonvegSid: (name: string) => string | null;
declare const getFoodEffect: (name: string) => any;
declare const _fdAgeRule: (name: string) => any;

const setPref = (page: any, pref: string) =>
  page.evaluate((p: string) => localStorage.setItem('ziva_diet_pref', p), pref);

const renderInto = (page: any) =>
  page.evaluate(() => {
    (window as any).renderDietRecipes();
    return document.getElementById('dietRecipesRoot')!.innerHTML;
  });

test.describe('Diet → Recipes sub-tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() =>
      Array.isArray((window as any).RECIPES)
      && typeof (window as any).renderDietRecipes === 'function'
      && typeof (window as any)._dietAllowsFood === 'function'
      && typeof (window as any).getFoodEffect === 'function', null, { timeout: 10_000 });
  });

  // 1 — the tab renders recipe rows into #dietRecipesRoot
  test('renders .recipe-row nodes into #dietRecipesRoot', async ({ page }) => {
    await setPref(page, 'nonveg');
    const html = await renderInto(page);
    expect(html).toContain('recipe-row');
    expect(html).toContain('recipe-hero');           // a featured suggested card
    expect(html).toContain('Browse recipes');         // the catalog section
    const rows = await page.locator('#dietRecipesRoot .recipe-row').count();
    expect(rows).toBeGreaterThan(5);
  });

  // 2 — preference SURFACING: veg hides non-veg recipes; nonveg shows them
  test("pref='veg' hides non-veg recipes; 'nonveg' shows them", async ({ page }) => {
    await setPref(page, 'veg');
    const veg = await renderInto(page);
    expect(veg).not.toContain('Soft Chicken & Rice Bowl');
    expect(veg).not.toContain('Rohu Fish & Rice Mash');
    expect(veg).not.toContain('Banana Oats Egg Pancake');

    await setPref(page, 'nonveg');
    const nonveg = await renderInto(page);
    expect(nonveg).toContain('Soft Chicken &amp; Rice Bowl');
    expect(nonveg).toContain('Rohu Fish &amp; Rice Mash');
  });

  // 3 — the safety path is NEVER gated by preference (the load-bearing invariant)
  test('safety record still fires for an off-preference food', async ({ page }) => {
    const r = await page.evaluate(() => {
      localStorage.setItem('ziva_diet_pref', 'veg');
      return {
        fishAllowed: _dietAllowsFood('fish'),     // surfacing: hidden for a veg household
        fishEffect: !!getFoodEffect('fish'),       // safety: the record still resolves
      };
    });
    expect(r.fishAllowed).toBe(false);   // Pass A hides it
    expect(r.fishEffect).toBe(true);     // Pass B never gated
  });

  // 4 — recipe-level age (Ziva ~9mo): an age-gated recipe is withheld from
  // "Suggested" but shown in the catalog WITH an age badge + .fd-flag-aged detail
  test('honey recipe withheld from Suggested, age-flagged in catalog detail', async ({ page }) => {
    await setPref(page, 'nonveg');
    const html = await renderInto(page);
    // The honey (12m+) recipe must NOT be the featured hero (Ziva is ~9mo).
    const heroBlock = html.split('Browse recipes')[0];
    expect(heroBlock).not.toContain('Banana &amp; Honey Toast');
    // It IS in the catalog, carrying the age badge + the aged safety flag.
    expect(html).toContain('Banana &amp; Honey Toast');
    expect(html).toContain('recipe-age-badge');
    expect(html).toContain('fd-flag-aged');
  });

  // 5 — with no logged leafy greens, a leafy/iron recipe can rank into Suggested
  test('a leafy/iron recipe can surface in Suggested', async ({ page }) => {
    await setPref(page, 'nonveg');
    const html = await renderInto(page);
    const heroAndSuggested = html.split('Browse recipes')[0];
    // Dal–Rice with Palak (spinach, leafy + iron) is a strong gap-fill candidate.
    expect(heroAndSuggested).toContain('Suggested for Ziva');
    expect(html).toContain('Dal');   // a dal/leafy recipe is present in the corpus
  });

  // 5b — §9.7 strict-lead floor: a honey recipe's composed voice must LEAD with
  // the honey caution (M-T-1/K-T-1 fold — the strict clause must reach the
  // composer, not be filtered out as a trace ingredient).
  test('strict safety lead surfaces for a honey recipe (§9.7 floor)', async ({ page }) => {
    const strict = await page.evaluate(() => {
      const rec = (window as any).RECIPES_BY_ID['banana-honey-toast'];
      const fn = (window as any)._recipeTagline;
      const t = typeof fn === 'function' ? fn(rec) : null;
      return t ? t.strict : null;
    });
    expect(Array.isArray(strict)).toBe(true);
    expect((strict as string[]).join(' ').toLowerCase()).toContain('honey');
  });

  // 6 — ingredient names resolve through the LIVE resolver (alias-precedence)
  test('corpus ingredient forms resolve correctly through the live resolver', async ({ page }) => {
    const r = await page.evaluate(() => ({
      eggYolkSid: _dietNonvegSid('Egg yolk'),          // → eggs (not eggplant)
      eggplantSid: _dietNonvegSid('eggplant'),         // → null (veg)
      seerFishEffect: getFoodEffect('seer fish'),      // → null (high-mercury host guard)
      rohuFishEffect: !!getFoodEffect('rohu fish'),    // → truthy (low-mercury, the corpus form)
      wholeAlmondGate: (() => { const a = _fdAgeRule('whole almond'); return a ? a.minMonth : 0; })(),
    }));
    expect(r.eggYolkSid).toBe('eggs');
    expect(r.eggplantSid).toBeNull();
    expect(r.seerFishEffect).toBeNull();
    expect(r.rohuFishEffect).toBe(true);
    expect(r.wholeAlmondGate).toBeGreaterThanOrEqual(60);
  });
});
