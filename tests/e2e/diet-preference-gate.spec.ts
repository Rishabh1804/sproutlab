import { test, expect } from '@playwright/test';

// Dietary-preference SURFACING GATE — the 4-class gate (veg / eggetarian / pescatarian / nonveg).
// vegan is deferred to its own spec (it would additionally gate dairy + honey).
//
// The gate filters which foods are PROACTIVELY SURFACED (the Library food grid + category modal,
// the meal-search dropdowns, the "Foods to Try Next" list, the combo-checker preference note).
//   veg          → no non-veg surfaced
//   eggetarian   → egg only
//   pescatarian  → egg + fish/seafood
//   nonveg       → all (egg + poultry + fish + meat)
//
// LOAD-BEARING SAFETY INVARIANT: the gate is SURFACING-ONLY. It must NEVER sit on the
// consequence path — a food given despite the preference (a grandparent's spoonful) must still
// surface its full safety record when logged. The last test pins this.

declare const getDietPref: () => string;
declare const _dietAllowsFood: (name: string) => boolean;
declare const _dietAllowsNonvegSid: (sid: string) => boolean;
declare const _dietNonvegSid: (name: string) => string | null;
declare const getUntriedSuggestions: (n: number) => any[];
declare const renderFoods: () => void;
declare const getFoodEffect: (name: string) => any;
declare const renderFoodDetailSheet: (name: string) => void;
declare const checkFoodCombo: () => void;

const setPref = (page: any, pref: string) =>
  page.evaluate((p: string) => localStorage.setItem('ziva_diet_pref', p), pref);

test.describe('dietary-preference surfacing gate (4-class)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() =>
      typeof (window as any)._dietAllowsFood === 'function'
      && typeof (window as any).getUntriedSuggestions === 'function'
      && typeof (window as any).getFoodEffect === 'function', null, { timeout: 10_000 });
  });

  // ── the gate's single source of truth: the helper contract per preference ──
  test('the gate helper surfaces exactly the right non-veg groups per preference', async ({ page }) => {
    const r = await page.evaluate(() => {
      const out: Record<string, string[]> = {};
      const probes = ['egg', 'chicken', 'fish', 'prawn', 'crab', 'mutton', 'beef'];
      for (const pref of ['veg', 'eggetarian', 'pescatarian', 'nonveg']) {
        localStorage.setItem('ziva_diet_pref', pref);
        out[pref] = probes.filter(n => _dietAllowsFood(n));
      }
      return out;
    });
    expect(r.veg).toEqual([]);                                   // no non-veg
    expect(r.eggetarian).toEqual(['egg']);                       // egg only
    expect(r.pescatarian.sort()).toEqual(['crab', 'egg', 'fish', 'prawn']); // egg + seafood
    expect(r.nonveg.sort()).toEqual(['beef', 'chicken', 'crab', 'egg', 'fish', 'mutton', 'prawn']); // all
  });

  // ── classification safety: word-boundary, not substring ──
  test('classification is word-boundary safe (eggplant is veg; shellfish is not gated as fish)', async ({ page }) => {
    const r = await page.evaluate(() => ({
      eggYolk: _dietNonvegSid('Egg yolk'),
      eggplant: _dietNonvegSid('eggplant'),       // must NOT be classed as egg
      shellfish: _dietNonvegSid('shellfish'),     // \bfish\b must not match shellfish
      chicken: _dietNonvegSid('Chicken (puree)'),
      paneer: _dietNonvegSid('paneer'),
    }));
    expect(r.eggYolk).toBe('eggs');
    expect(r.eggplant).toBeNull();
    expect(r.shellfish).toBeNull();
    expect(r.chicken).toBe('poultry');
    expect(r.paneer).toBeNull();
  });

  // ── veg foods are ALWAYS surfaced, every preference (the gate only touches non-veg) ──
  test('veg foods are surfaced under every preference', async ({ page }) => {
    const r = await page.evaluate(() => {
      const vegFoods = ['paneer', 'banana', 'spinach', 'eggplant', 'ragi', 'curd'];
      const ok: Record<string, boolean> = {};
      for (const pref of ['veg', 'eggetarian', 'pescatarian', 'nonveg']) {
        localStorage.setItem('ziva_diet_pref', pref);
        ok[pref] = vegFoods.every(f => _dietAllowsFood(f));
      }
      return ok;
    });
    for (const pref of ['veg', 'eggetarian', 'pescatarian', 'nonveg']) {
      expect(r[pref], `veg foods surfaced under ${pref}`).toBe(true);
    }
  });

  // ── Foods to Try Next honours the preference (the proactive recommendation surface) ──
  test('"Foods to Try Next" never recommends an off-preference food', async ({ page }) => {
    const r = await page.evaluate(() => {
      const out: Record<string, string[]> = {};
      for (const pref of ['veg', 'eggetarian', 'pescatarian', 'nonveg']) {
        localStorage.setItem('ziva_diet_pref', pref);
        const sugg = getUntriedSuggestions(60) || [];
        // any suggested food whose non-veg sid is NOT allowed under this pref = a leak
        out[pref] = sugg.map((s: any) => (s && (s.key || s.name || s)))
          .filter((n: any) => typeof n === 'string')
          .filter((n: string) => { const sid = _dietNonvegSid(n); return sid && !_dietAllowsNonvegSid(sid); });
      }
      return out;
    });
    expect(r.veg, 'veg sees no non-veg suggestion').toEqual([]);
    expect(r.eggetarian, 'eggetarian sees no fish/poultry/meat suggestion').toEqual([]);
    expect(r.pescatarian, 'pescatarian sees no poultry/meat suggestion').toEqual([]);
    expect(r.nonveg, 'non-veg has no off-preference foods').toEqual([]);
  });

  // ── the Library food grid: the Non-Veg category card appears only when surfaced ──
  test('the Library Non-Veg category card is hidden for veg, shown for non-veg', async ({ page }) => {
    const veg = await page.evaluate(() => {
      localStorage.setItem('ziva_diet_pref', 'veg');
      renderFoods();
      return !!document.querySelector('#foodsGrid [data-action="openFoodCatModal"][data-arg="nonveg"]');
    });
    const nonveg = await page.evaluate(() => {
      localStorage.setItem('ziva_diet_pref', 'nonveg');
      renderFoods();
      return !!document.querySelector('#foodsGrid [data-action="openFoodCatModal"][data-arg="nonveg"]');
    });
    expect(veg, 'veg: no Non-Veg category card').toBe(false);
    expect(nonveg, 'non-veg: Non-Veg category card present').toBe(true);
  });

  // ── THE SAFETY INVARIANT: the gate is surfacing-only; the consequence path is NEVER gated ──
  test('a food OUTSIDE the preference still fires its full safety record when logged (veg + fish)', async ({ page }) => {
    const r = await page.evaluate(() => {
      localStorage.setItem('ziva_diet_pref', 'veg');  // fish is NOT surfaced to a vegetarian...
      // ...but if it is logged anyway, the consequence path must be untouched:
      const eff = getFoodEffect('fish');
      renderFoodDetailSheet('fish');
      const el = document.getElementById('foodDetailBody')!;
      return {
        surfaced: _dietAllowsFood('fish'),           // gate says: do not proactively surface
        effResolves: !!eff,                          // consequence resolver: still resolves
        severeFloor: el.querySelectorAll('.cons-severe').length,  // safety floor: still renders
        seekCare: el.querySelectorAll('.cons-seek').length,
      };
    });
    expect(r.surfaced, 'fish is NOT proactively surfaced to a vegetarian').toBe(false);
    expect(r.effResolves, 'but getFoodEffect still resolves fish (consequence path ungated)').toBe(true);
    expect(r.severeFloor, 'and the anaphylaxis/safety floor still renders on the detail sheet').toBeGreaterThan(0);
    expect(r.seekCare).toBeGreaterThan(0);
  });

  // ── M-214-1 (Maren, blocking → fixed): the preference note must NEVER replace an 'avoid'
  // headline. An off-preference food that is ALSO below its age floor must keep the hard
  // age-safety reason as the lead line; the soft preference note drops to the body. ──
  test('M-214-1: an off-preference + below-age-floor combo keeps the AGE reason as the headline', async ({ page }) => {
    const r = await page.evaluate(() => {
      localStorage.setItem('ziva_diet_pref', 'veg');   // chicken is off-preference...
      const input = document.getElementById('comboInput') as HTMLInputElement;
      input.value = 'salt + chicken';                  // ...and salt is a below-floor (12mo) NON-toxin avoid
      checkFoodCombo();
      const el = document.getElementById('comboResult')!;
      return {
        verdictAvoid: !!el.querySelector('.combo-result.avoid'),
        headline: (el.querySelector('.combo-verdict')?.textContent || '').toLowerCase(),
        bodyText: (el.textContent || '').toLowerCase(),
      };
    });
    expect(r.verdictAvoid, 'the verdict is still avoid (salt below its age floor)').toBe(true);
    // the LEAD line must NOT be hijacked by the soft preference note...
    expect(r.headline).not.toMatch(/outside.*preference|preference/);
    // ...yet the preference note still surfaces in the body (never silently dropped).
    expect(r.bodyText, 'the off-preference note still appears in the body').toMatch(/outside it|preference/);
  });
});
