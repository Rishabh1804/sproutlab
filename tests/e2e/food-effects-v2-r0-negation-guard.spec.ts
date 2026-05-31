import { test, expect } from '@playwright/test';

// food-effects v2 — R0: the negation-leak guard in _lookupByFoodName (spec §6).
//
// The resolver's word-boundary tier treats '-' as a boundary, so a bare
// \bpeanut\b matched inside "peanut-free" and \bgroundnut\b inside "no
// groundnut" — a logged or queried AVOIDANCE resolved to the food. Post-reframe
// (R1/R2) that would render a green "introduce peanut" + an anaphylaxis floor on
// a food the parent EXPLICITLY excluded — the one outcome worse than the legacy
// caution (spec §10 convergence). R0 lands the guard ONCE in the shared resolver,
// before R1, so every surface inherits it.
//
// The guard is TARGETED (keyed on the specific matched token), so a non-negated
// food in the same string still resolves.
//
// NOTE: FOOD_EFFECTS / ALLERGENS / AGE_RULES are top-level `const`s — global
// lexical bindings, NOT window properties — so they're referenced as barewords
// inside page.evaluate (function decls like getFoodEffect resolve the same way).
declare const FOOD_EFFECTS: any;
declare const ALLERGENS: any;
declare const AGE_RULES: any;
declare const getFoodEffect: (name: string) => any;
declare const _lookupByFoodName: (table: any, name: string) => any;
declare const _foodNameNegated: (hay: string, token: string) => boolean;

test.describe('food-effects v2 — R0 negation-leak guard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() =>
      typeof getFoodEffect === 'function'
      && typeof _lookupByFoodName === 'function'
      && typeof _foodNameNegated === 'function'
      && typeof ALLERGENS === 'object'
      && typeof AGE_RULES === 'object'
      && typeof FOOD_EFFECTS === 'object', null, { timeout: 10_000 });
  });

  test('negated allergen / toxin queries resolve to NOTHING (the leak is closed)', async ({ page }) => {
    const negated = await page.evaluate(() => {
      // each of these would have word-boundary-matched the food token before R0
      const cases = [
        'peanut-free', 'groundnut-free', 'tree nut-free',
        'no peanut', 'without peanut', 'no groundnut',
        'honey-free', 'no honey', 'without honey',
        'no added nuts', 'free of peanut', 'free from tree nut',
      ];
      return cases.map(q => [q, getFoodEffect(q) === null] as const);
    });
    for (const [q, isNull] of negated) {
      expect(isNull, `"${q}" must resolve to null (negated → not an exposure)`).toBe(true);
    }
  });

  test('positive queries are UNAFFECTED (no over-suppression)', async ({ page }) => {
    const r = await page.evaluate(() => {
      const cls = (x: any) => {
        const fc = x && x.foodClass;
        return Array.isArray(fc) ? fc : (fc ? [fc] : []);
      };
      return {
        peanut: cls(getFoodEffect('peanut')),
        groundnut: cls(getFoodEffect('groundnut')),        // alias → peanut
        peanutButter: cls(getFoodEffect('peanut butter')), // alias → peanut
        almond: cls(getFoodEffect('almond')),              // alias → tree nut
        honey: cls(getFoodEffect('honey')),
        peanutPaste: cls(getFoodEffect('peanut paste')),   // word-boundary positive in context
      };
    });
    expect(r.peanut, 'peanut still resolves (allergen-introduce-early)').toContain('allergen-introduce-early');
    expect(r.groundnut.length, 'groundnut alias still resolves').toBeGreaterThan(0);
    expect(r.peanutButter.length, 'peanut butter alias still resolves').toBeGreaterThan(0);
    expect(r.almond.length, 'almond alias still resolves to tree nut').toBeGreaterThan(0);
    expect(r.honey, 'honey still resolves (acute-toxin, hard ceiling)').toContain('acute-toxin');
    expect(r.peanutPaste, 'positive "peanut paste" unaffected').toContain('allergen-introduce-early');
  });

  test('the guard is TARGETED — a negated modifier does not suppress a co-present food', async ({ page }) => {
    const r = await page.evaluate(() => ({
      // "apple (no nuts)" — nuts is negated, but a co-present non-negated food is not
      nutsNegated: _foodNameNegated('apple (no nuts)', 'nuts'),
      appleNotNegated: _foodNameNegated('apple (no nuts)', 'apple'),
      // "sugar-free peanut" — sugar is negated; peanut is present and must resolve
      sugarNegated: _foodNameNegated('sugar-free peanut', 'sugar'),
      peanutNotNegated: _foodNameNegated('sugar-free peanut', 'peanut'),
      peanutStillResolves: getFoodEffect('sugar-free peanut') !== null,
    }));
    expect(r.nutsNegated, '"no nuts" → nuts negated').toBe(true);
    expect(r.appleNotNegated, 'apple in the same string is NOT negated').toBe(false);
    expect(r.sugarNegated, '"sugar-free" → sugar negated').toBe(true);
    expect(r.peanutNotNegated, 'peanut is present, not negated, in "sugar-free peanut"').toBe(false);
    expect(r.peanutStillResolves, 'the present peanut still resolves despite "sugar-free"').toBe(true);
  });

  test('the guard lives in the SHARED resolver — ALLERGENS + AGE_RULES inherit it', async ({ page }) => {
    const r = await page.evaluate(() => ({
      allergenNegated: _lookupByFoodName(ALLERGENS, 'peanut-free') === null,
      allergenPositive: _lookupByFoodName(ALLERGENS, 'peanut') !== null,
      ageRuleNegated: _lookupByFoodName(AGE_RULES, 'no peanut') === null,
      ageRulePositive: _lookupByFoodName(AGE_RULES, 'peanut') !== null,
    }));
    expect(r.allergenNegated, 'ALLERGENS["peanut-free"] suppressed').toBe(true);
    expect(r.allergenPositive, 'ALLERGENS["peanut"] still resolves').toBe(true);
    expect(r.ageRuleNegated, 'AGE_RULES "no peanut" suppressed').toBe(true);
    expect(r.ageRulePositive, 'AGE_RULES "peanut" still resolves').toBe(true);
  });

  test('regression anchor: the seed diary "(no nuts)" segment surfaces no nut record', async ({ page }) => {
    // The committed seed log 'Ragi porridge + apple (no nuts)' (core.js) splits on
    // '+' to "apple (no nuts)"; before R0 the "(no nuts)" tail could resolve a nut
    // record (a logged AVOIDANCE read as a nut exposure). It must resolve to nothing.
    const r = await page.evaluate(() => ({
      effSegment: getFoodEffect('apple (no nuts)'),
      feSegment: _lookupByFoodName(FOOD_EFFECTS, 'apple (no nuts)'),
      allergenSegment: _lookupByFoodName(ALLERGENS, 'apple (no nuts)'),
    }));
    expect(r.effSegment, 'getFoodEffect("apple (no nuts)") → null').toBeNull();
    expect(r.feSegment, 'no FOOD_EFFECTS nut record from a (no nuts) avoidance').toBeNull();
    expect(r.allergenSegment, 'no ALLERGENS nut record from a (no nuts) avoidance').toBeNull();
  });
});
