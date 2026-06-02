import { test, expect } from '@playwright/test';

// food-effects-v2 P1c — the CHOKING SET (milk-spec §9, the first choking-by-form-PRIMARY render).
//
// `FOOD_EFFECTS['choking hazards']` — ONE combined record for the foods that are an airway
// hazard by FORM (round/hard/small/sticky), not by allergy or toxin. Rendered as a dedicated
// Diet → Library card (renderDietChokingIntro → #dietChokingIntro), sibling of the nut + milk
// cards (those untouched). Load-bearing contracts:
//   • POLARITY is CONDITIONAL (_effPolarity → 'conditional') — the model is MODIFY, DON'T BAN;
//     amber, a SPLIT lead (sage carve-out "safe in the right form" over an amber gate "whole
//     forms wait until ~5"), NEVER the rose 'avoid' siren and NEVER the sage encourage benefit.
//   • THE FLOOR IS CHOKING FIRST AID, NOT ANAPHYLAXIS (the floor follows the hazard): back
//     blows + chest thrusts, NEVER abdominal thrusts under 1, and NO adrenaline / auto-injector.
//   • ALIAS PRECISION (the carry-forward lesson, M-F-1 / K-M-1): the record is reached by MANY
//     aliases; the curated set fires on the unambiguous hazard forms (grape, popcorn, supari,
//     roasted gram…) but NEVER on a safe homograph (chana dal, cooked carrot, sevai), and never
//     shadows the peanut/tree-nut records. Traced through the LIVE resolver, asserted on the
//     ACTUAL logged forms — a green build hides alias-precedence leaks.

const SHOWN = (sel: string, cardId: string) => {
  let n: HTMLElement | null = document.querySelector(sel);
  if (!n) return false;
  while (n && n.id !== cardId) {
    if (getComputedStyle(n).display === 'none') return false;
    n = n.parentElement;
  }
  return !!n;
};

declare const renderDietLibrary: () => void;
declare const getFoodEffect: (n: string) => any;
declare const renderFoodDetailSheet: (n: string) => void;
declare const _fdAgeRule: (n: string) => any;
declare const _effPolarity: (e: any) => string;
declare const FOOD_EFFECTS: Record<string, any>;

test.describe('food-effects-v2 P1c — the choking set', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() =>
      typeof (window as any).renderDietLibrary === 'function'
      && typeof (window as any).getFoodEffect === 'function'
      && typeof (window as any)._effPolarity === 'function'
      && !!document.getElementById('dietChokingIntro'), null, { timeout: 10_000 });
    await page.evaluate(() => (window as any).renderDietLibrary());
  });

  // ── the record: choking-by-form PRIMARY, mechanical (not allergic) ──
  // NB: the app's FOOD_EFFECTS is the lean consequence-card shape — allergen / reactionType
  // live in the manifest, NOT here (fish/milk records omit them too). "PRIMARY" is proven by
  // foodClass being the BARE STRING 'choking-by-form' (not the array form that rides secondary
  // to an allergen, e.g. peanut's ['allergen-introduce-early','choking-by-form']); "mechanical,
  // not allergic" is proven by the floor (the CHOKING-FIRST-AID test below) + the absence of
  // any earlyIntroBenefit.
  test('the record is choking-by-form PRIMARY (bare string class), no benefit, chokingUntil 5', async ({ page }) => {
    const r = await page.evaluate(() => {
      const e = getFoodEffect('choking hazards');
      return e ? {
        fc: e.foodClass,
        fcIsArray: Array.isArray(e.foodClass),
        hasBenefit: !!e.earlyIntroBenefit,
        chokingUntil: e.chokingUntilYears,
      } : null;
    });
    expect(r).not.toBeNull();
    // PRIMARY = the bare string class (not an array riding secondary to an allergen).
    expect(r!.fc).toBe('choking-by-form');
    expect(r!.fcIsArray).toBe(false);
    expect(r!.hasBenefit).toBe(false);          // not an allergen to introduce early
    expect(r!.chokingUntil).toBe(5);
  });

  // ── polarity is CONDITIONAL (the shared resolver), never warn/encourage/inform ──
  test('_effPolarity(choking) === "conditional" — modify, don\'t ban (not warn/avoid)', async ({ page }) => {
    const pol = await page.evaluate(() => _effPolarity(getFoodEffect('choking hazards')));
    expect(pol).toBe('conditional');
  });

  // ── §9 the FLOOR IS CHOKING FIRST AID, not anaphylaxis ──
  test('the emergency floor is CHOKING FIRST AID — back blows / chest thrusts, NEVER adrenaline', async ({ page }) => {
    const e = await page.evaluate(() => {
      const x = getFoodEffect('choking hazards');
      return { severe: [].concat(x.severeSigns || []).join(' | ').toLowerCase(),
               seek: (x.seekCare || '').toLowerCase() };
    });
    // the mechanical-rescue protocol is present...
    expect(e.seek).toMatch(/back blow/);
    expect(e.seek).toMatch(/chest thrust/);
    expect(e.seek).toMatch(/never abdominal thrusts/);   // the load-bearing infant rule (<1)
    expect(e.seek).toMatch(/112|108/);
    // ...the floor explicitly DISCLAIMS the allergy response (it names "no adrenaline" / "not an
    // allergy" to steer a parent away from the wrong floor)...
    expect(e.seek).toMatch(/no adrenaline|not an allergy/);
    // ...and it never PRESCRIBES the anaphylaxis treatment (auto-injector / antihistamine), which
    // the allergen records (peanut/fish/cow-milk) do carry.
    expect(e.seek).not.toMatch(/auto-injector|epipen|antihistamine|use a prescribed/);
    // severeSigns are the QUIET-choking signs, not allergic ones.
    expect(e.severe).toMatch(/silent or weak cough|can't breathe|going limp/);
    expect(e.severe).not.toMatch(/hives|swelling of the lips|wheez/);
  });

  // ── the dedicated card: split conditional lead (carve-out FIRST, then the gate) ──
  test('the card renders a SPLIT lead — sage carve-out (sprout) above the amber gate (clock), never a siren', async ({ page }) => {
    const host = page.locator('#dietChokingIntro');
    await expect(host.locator('.enc-split')).toHaveCount(1);
    await expect(host.locator('.enc-split-good use[href="#zi-sprout"]')).toHaveCount(1);
    await expect(host.locator('.enc-split-gate use[href="#zi-clock"]')).toHaveCount(1);
    // conditional, NOT the rose 'avoid' siren and NOT the encourage benefit banner.
    await expect(host.locator('.enc-split use[href="#zi-siren"]')).toHaveCount(0);
    await expect(host.locator('.enc-benefit')).toHaveCount(0);
    // carve-out (modify, don't ban) leads the gate in reading order.
    const order = await page.evaluate(() => {
      const h = document.getElementById('dietChokingIntro')!;
      const good = h.querySelector('.enc-split-good'), gate = h.querySelector('.enc-split-gate');
      if (!good || !gate) return 'missing';
      return (good.compareDocumentPosition(gate) & 4) ? 'good-first' : 'gate-first';
    });
    expect(order).toBe('good-first');
  });

  // ── M-γ-1: the per-food cut rules render (the load-bearing "modify, don't ban" guidance) ──
  test('the cut-it-this-way rules render PINNED (quarter grapes lengthwise; hot dogs lengthwise)', async ({ page }) => {
    const host = page.locator('#dietChokingIntro');
    await expect(host.locator('.enc-form-list li')).toContainText([/quarter lengthwise/i]);
    await expect(host).toContainText(/hot dogs?.*lengthwise|lengthwise.*strips/i);
    // the cut rules are PINNED, never folded into the collapse body.
    await expect(page.locator('#dietChokingIntroMore .enc-form')).toHaveCount(0);
  });

  // ── the choking-first-aid strip is PINNED + scoped to choking (not "allergic reaction") ──
  test('the choking-first-aid strip is pinned, present-only, and choking-scoped', async ({ page }) => {
    await expect(page.locator('#dietChokingIntro .cons-severe')).toHaveCount(1);
    await expect(page.locator('#dietChokingIntroBody .cons-severe')).toHaveCount(0); // pinned, never folds
    await expect(page.locator('#dietChokingIntro .cons-severe-h')).toContainText(/if your baby is choking/i);
    await expect(page.locator('#dietChokingIntro .enc-emergency')).toContainText(/back blow|chest thrust/i);
  });

  // ── the gagging-vs-choking discriminator (highest-value education) is PINNED, by the floor (V-V-12) ──
  test('the gagging-vs-choking discriminator is PINNED above the fold (gagging LOUD/normal; choking QUIET = emergency)', async ({ page }) => {
    const pinned = page.locator('#dietChokingIntro');
    await expect(pinned.locator('.enc-myth')).toContainText(/gagging is loud/i);
    await expect(pinned.locator('.enc-myth')).toContainText(/choking is quiet/i);
    // V-V-12: it must NOT be stranded in the collapse body — the discriminator is load-bearing.
    await expect(page.locator('#dietChokingIntroMore .enc-myth')).toHaveCount(0);
    // and it sits immediately before the choking-first-aid floor (discriminator → emergency).
    const order = await page.evaluate(() => {
      const h = document.getElementById('dietChokingIntro')!;
      const myth = h.querySelector('.enc-myth'), floor = h.querySelector('.cons-severe');
      if (!myth || !floor) return 'missing';
      return (myth.compareDocumentPosition(floor) & 4) ? 'myth-first' : 'floor-first';
    });
    expect(order).toBe('myth-first');
  });

  // ── the detail-sheet second surface: conditional flag, never the rose siren ──
  test('the Library detail sheet renders a hazard food (grape) as CONDITIONAL, not the avoid siren', async ({ page }) => {
    const d = await page.evaluate(() => {
      renderFoodDetailSheet('grape');
      const el = document.getElementById('foodDetailBody')!;
      return {
        conditional: !!el.querySelector('.fd-flag-conditional'),
        siren: !!el.querySelector('.fd-flag-allergen'),
        encourage: !!el.querySelector('.fd-flag-encourage'),
        severe: el.querySelectorAll('.cons-severe').length,
        clock: !!el.querySelector('.fd-flag-conditional use[href="#zi-clock"]'),
      };
    });
    expect(d.conditional, 'grape reads conditional (amber/clock), not the rose avoid siren').toBe(true);
    expect(d.siren).toBe(false);
    expect(d.encourage).toBe(false);
    expect(d.severe, 'the choking-first-aid floor is present on the detail sheet too').toBeGreaterThan(0);
  });

  // ── ALIAS PRECISION — the carry-forward lesson, on the ACTUAL logged forms ──
  test('alias precision: hazard forms fire choking; safe homographs and the nut records do NOT', async ({ page }) => {
    const r = await page.evaluate(() => {
      const CHK = getFoodEffect('choking hazards');
      const FE = FOOD_EFFECTS;
      const is = (n: string) => getFoodEffect(n) === CHK;
      const key = (n: string) => { const e = getFoodEffect(n); if (!e) return null; for (const k in FE) if (FE[k] === e) return k; return '?'; };
      return {
        // SHOULD fire choking (unambiguous hazard forms, incl. Indian core):
        grape: is('grape'), grapes: is('grapes'), popcorn: is('popcorn'),
        hotdog: is('hot dog'), sausage: is('sausage'), marshmallow: is('marshmallow'),
        rawCarrot: is('raw carrot'), roastedGram: is('roasted gram'), bhunaChana: is('bhuna chana'),
        supari: is('supari'), arecaNut: is('areca nut'), makhana: is('makhana'),
        raisins: is('raisins'), ber: is('ber'),
        // SHOULD NOT fire choking (safe homographs — the M-F-1/K-M-1 trap):
        chanaDal: is('chana dal'), kalaChana: is('kala chana'), chole: is('chole'),
        carrot: is('carrot'), carrotPuree: is('carrot puree'), tomato: is('tomato'),
        sevai: is('sevai'), seviyan: is('seviyan'), cucumber: is('cucumber'),
        // the nut records keep their OWN identity (NOT re-aliased to choking):
        peanutKey: key('peanut'), groundnutKey: key('groundnut'),
        almondKey: key('almond'), cashewKey: key('cashew'),
      };
    });
    // fire:
    for (const k of ['grape','grapes','popcorn','hotdog','sausage','marshmallow','rawCarrot',
                     'roastedGram','bhunaChana','supari','arecaNut','makhana','raisins','ber'] as const) {
      expect(r[k], `${k} should fire the choking card`).toBe(true);
    }
    // do NOT fire (safe homographs):
    for (const k of ['chanaDal','kalaChana','chole','carrot','carrotPuree','tomato',
                     'sevai','seviyan','cucumber'] as const) {
      expect(r[k], `${k} must NOT fire the choking card (safe homograph)`).toBe(false);
    }
    // nut records intact:
    expect(r.peanutKey).toBe('peanut');
    expect(r.groundnutKey).toBe('peanut');
    expect(r.almondKey).toBe('tree nut');
    expect(r.cashewKey).toBe('tree nut');
  });

  // ── the age gate: the KEY resolves (sync-gate Check3); hazard foods get NO misleading badge ──
  test('AGE_RULES: the key resolves (Check3); a logged "grape" gets NO misleading minMonth badge', async ({ page }) => {
    const r = await page.evaluate(() => ({
      key: _fdAgeRule('choking hazards')?.minMonth ?? null,
      grape: _fdAgeRule('grape'),       // not aliased into AGE_RULES → no "not before N months" badge
      popcorn: _fdAgeRule('popcorn')?.minMonth ?? null,  // its OWN pre-existing gate (48), untouched
    }));
    expect(r.key, 'the choking-hazards key resolves in AGE_RULES (Check3)').toBe(6);
    expect(r.grape, 'grape is not given a misleading age-gate badge (form-gated, not minMonth)').toBeNull();
    expect(r.popcorn, 'popcorn keeps its own pre-existing 48mo gate, untouched').toBe(48);
  });
});
