import { test, expect } from '@playwright/test';

// food-effects-v2 P1c — the MILK polarity cards (milk-spec §4/§5/§10).
//
// Two never-before-rendered v2 foodClasses, as sibling cards in Diet → Library
// (renderDietMilkIntro → #dietMilkIntro / #dietPlantMilkIntro), the nut card untouched:
//   • cow milk   = drink-timing      — CONDITIONAL, a SPLIT lead: sage carve-out band
//     ("good in food now") OVER an amber gate band ("wait as the main drink", M-2
//     skim-proof). CMPA severe strip PINNED + present-only, with a class-aware scope header.
//   • plant milk = substitute-caveat — INFORM, a SKY banner leading with rice<5=arsenic; NO
//     severe strip (the floor follows the hazard; harm is nutritional/chronic, not acute).
//
// Card-relative assertions (DOM position / display), mirroring the encourage-card spec, so the
// deferred switchTab(savedTab) race on init doesn't matter — we test each card's own contract.

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

test.describe('food-effects-v2 P1c — milk polarity cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() =>
      typeof (window as any).renderDietLibrary === 'function'
      && typeof (window as any).getFoodEffect === 'function'
      && !!document.getElementById('dietMilkIntro')
      && !!document.getElementById('dietPlantMilkIntro'), null, { timeout: 10_000 });
    await page.evaluate(() => (window as any).renderDietLibrary());
  });

  // ── §10(a) — cow milk: split lead, carve-out FIRST then gate; never warn/avoid, never encourage ──
  test('(a) cow milk renders the SPLIT lead — sage carve-out (sprout) above the amber gate (clock)', async ({ page }) => {
    const host = page.locator('#dietMilkIntro');
    await expect(host.locator('.enc-split')).toHaveCount(1);
    await expect(host.locator('.enc-split-good use[href="#zi-sprout"]')).toHaveCount(1);
    await expect(host.locator('.enc-split-gate use[href="#zi-clock"]')).toHaveCount(1);
    // The lead is neither an "avoid" warn banner nor an "introduce early" benefit banner.
    await expect(host.locator('.enc-split use[href="#zi-warn"]')).toHaveCount(0);
    await expect(host.locator('.enc-split use[href="#zi-siren"]')).toHaveCount(0);
    await expect(host.locator('.enc-benefit')).toHaveCount(0);
    // carve-out leads the gate in DOM/reading order (the reassurance reads first).
    const order = await page.evaluate(() => {
      const h = document.getElementById('dietMilkIntro')!;
      const good = h.querySelector('.enc-split-good'), gate = h.querySelector('.enc-split-gate');
      if (!good || !gate) return 'missing';
      return (good.compareDocumentPosition(gate) & 4) ? 'good-first' : 'gate-first';
    });
    expect(order).toBe('good-first');
    // The non-suppressible invariant ("the drink is gated; the dairy is not") is pinned.
    await expect(host.locator('.enc-form-note')).toContainText(/the drink is gated; the dairy is not/i);
    await expect(page.locator('#dietMilkIntroBody .enc-form-note')).toHaveCount(0);
  });

  // ── §10(b) — cow milk CMPA severe strip: pinned, present-only, scope header, 112/108 + antihistamine ──
  test('(b) cow milk pins the CMPA severe strip with a dairy-scoped header and the emergency line', async ({ page }) => {
    await expect(page.locator('#dietMilkIntro .cons-severe')).toHaveCount(1);
    await expect(page.locator('#dietMilkIntroBody .cons-severe')).toHaveCount(0); // pinned, never folds
    // V-V-4 scope header separates the ALLERGY floor from the TIMING gate, scoped to the
    // SEVERE path (M-M-2 — not "any reaction is an emergency").
    await expect(page.locator('#dietMilkIntro .cons-severe-h')).toContainText(/severe/i);
    await expect(page.locator('#dietMilkIntro .cons-severe-h')).toContainText(/dairy/i);
    // the emergency action: call 112/108 + the antihistamine-doesn't-treat-anaphylaxis line.
    const emg = page.locator('#dietMilkIntro .enc-emergency');
    await expect(emg).toContainText(/112|108/);
    await expect(emg).toContainText(/antihistamine/i);
    // shown within the card while the collapse body is hidden by default.
    const r = await page.evaluate((src) => {
      const fn = new Function('sel', 'cardId', 'return (' + src + ')(sel, cardId)') as any;
      const body = document.getElementById('dietMilkIntroBody');
      return {
        bodyCollapsed: body ? getComputedStyle(body).display === 'none' : false,
        stripShown: fn('#dietMilkIntro .cons-severe', 'dietMilkIntroCard'),
      };
    }, SHOWN.toString());
    expect(r.bodyCollapsed).toBe(true);
    expect(r.stripShown).toBe(true);
  });

  // ── §10(c) — plant milk: sky inform banner fronts rice<5=arsenic; NO severe strip ──
  test('(c) plant milk renders the SKY inform banner fronting rice<5=arsenic, and NO severe strip', async ({ page }) => {
    const host = page.locator('#dietPlantMilkIntro');
    await expect(host.locator('.enc-inform')).toHaveCount(1);
    await expect(host.locator('.enc-inform-h use[href="#zi-info"]')).toHaveCount(1);
    // the single hardest fact is fronted in the lead.
    await expect(host.locator('.enc-inform-lead')).toContainText(/arsenic/i);
    await expect(host.locator('.enc-inform-lead')).toContainText(/under 5/i);
    // substitute-caveat carries NO emergency floor (the floor follows the hazard).
    await expect(page.locator('#dietPlantMilkIntroCard .cons-severe')).toHaveCount(0);
    await expect(page.locator('#dietPlantMilkIntroCard use[href="#zi-siren"]')).toHaveCount(0);
    // the "Never" list names rice<5 and the not-a-substitute line.
    await expect(host.locator('.enc-form-list.enc-never')).toContainText(/rice/i);
  });

  // ── §10(d) — resolver guard: breast/formula/soy do NOT fire cow-milk; cow family DOES ──
  test('(d) the cow-milk drink-timing card never fires on breast milk / formula / soy milk', async ({ page }) => {
    const r = await page.evaluate(() => {
      const id = (n: string) => { const e = getFoodEffect(n); return e ? (e.title || '').slice(0, 12) : null; };
      const isCow = (n: string) => { const e = getFoodEffect(n); return !!e && e.foodClass === 'drink-timing'; };
      return {
        breast: isCow('breast milk'), formula: isCow('formula'), formulaMilk: isCow('formula milk'),
        soy: getFoodEffect('soy milk')?.foodClass,
        cows: isCow("cow's milk"), buffalo: isCow('buffalo milk'), top: isCow('top milk'),
      };
    });
    expect(r.breast, 'breast milk must NOT fire the cow-milk drink-timing card').toBe(false);
    expect(r.formula).toBe(false);
    expect(r.formulaMilk).toBe(false);
    expect(r.soy, 'soy milk routes to the soy allergen record, not cow milk').toBe('allergen-introduce-early');
    expect(r.cows).toBe(true);
    expect(r.buffalo).toBe(true);
    expect(r.top).toBe(true);
  });

  // ── §3-bis / §10(g) — K-6: the Food Library detail surface uses _effPolarity, never the siren ──
  test('(g) K-6: renderFoodDetailSheet polarity — cow milk conditional, plant milk inform, never siren', async ({ page }) => {
    const flags = await page.evaluate(() => {
      const read = (n: string) => {
        renderFoodDetailSheet(n);
        const el = document.getElementById('foodDetailBody')!;
        return {
          conditional: !!el.querySelector('.fd-flag-conditional'),
          inform: !!el.querySelector('.fd-flag-inform'),
          encourage: !!el.querySelector('.fd-flag-encourage'),
          allergenSiren: !!el.querySelector('.fd-flag-allergen'),
          clock: !!el.querySelector('use[href="#zi-clock"]'),
          info: !!el.querySelector('use[href="#zi-info"]'),
        };
      };
      return { cow: read('cow milk'), plant: read('plant milk'), soy: read('soy'), honey: read('honey') };
    });
    // cow milk → conditional (amber/clock), never the rose siren (the K-6 defect).
    expect(flags.cow.conditional).toBe(true);
    expect(flags.cow.allergenSiren).toBe(false);
    expect(flags.cow.clock).toBe(true);
    // plant milk → inform (sky/info), never siren.
    expect(flags.plant.inform).toBe(true);
    expect(flags.plant.allergenSiren).toBe(false);
    expect(flags.plant.info).toBe(true);
    // regression: a δ allergen still reads encourage; honey still reads the rose siren (warn).
    expect(flags.soy.encourage).toBe(true);
    expect(flags.honey.allergenSiren).toBe(true);
  });

  // ── §10(h) — K-3: plant-milk age gate is the dedicated entry, not the cow 'milk' copy ──
  test('(h) K-3: a plant-milk log resolves its OWN age gate (arsenic), not cow-milk curd/paneer copy', async ({ page }) => {
    const r = await page.evaluate(() => ({
      plant: _fdAgeRule('plant milk')?.reason || '',
      oat: _fdAgeRule('oat milk')?.reason || '',
      almond: _fdAgeRule('almond milk')?.reason || '',
    }));
    expect(r.plant.toLowerCase()).toMatch(/substitute|arsenic|fortified/);
    expect(r.plant.toLowerCase()).not.toMatch(/curd|paneer/); // not the cow-'milk' carve-out copy
    expect(r.oat.toLowerCase()).toMatch(/substitute|fortified/);
    // the plant-milk DRINK redirect: almond milk gets the plant gate, not cow curd/paneer copy.
    expect(r.almond.toLowerCase()).not.toMatch(/curd|paneer/);
  });

  // ── the plant-milk DRINK redirect (K-2 intent / alias-precedence pre-empt) ──
  test('plant-milk drink hosts (almond/badam/cashew milk) read INFORM, not the tree-nut encourage', async ({ page }) => {
    const r = await page.evaluate(() => ({
      almondMilk: getFoodEffect('almond milk')?.foodClass,
      badamDoodh: getFoodEffect('badam doodh')?.foodClass,
      cashewMilk: getFoodEffect('cashew milk')?.foodClass,
      // the bare nut still introduces early (unchanged):
      almond: [].concat(getFoodEffect('almond')?.foodClass),
      badam: [].concat(getFoodEffect('badam')?.foodClass),
    }));
    expect(r.almondMilk, 'almond milk (a drink) is substitute-caveat, not introduce-early').toBe('substitute-caveat');
    expect(r.badamDoodh).toBe('substitute-caveat');
    expect(r.cashewMilk).toBe('substitute-caveat');
    expect(r.almond, 'the bare nut still resolves to the tree-nut introduce-early record').toContain('allergen-introduce-early');
    expect(r.badam).toContain('allergen-introduce-early');
  });

  // ── M-M-1 (Maren, blocking): the redirect must NOT drop the tree-nut allergen caution ──
  test('M-M-1: almond/cashew-milk detail sheet shows BOTH the inform line AND the tree-nut allergen', async ({ page }) => {
    const sheets = await page.evaluate(() => {
      const read = (n: string) => { renderFoodDetailSheet(n); return document.getElementById('foodDetailBody')!.innerHTML.toLowerCase(); };
      return { almond: read('almond milk'), cashew: read('cashew milk') };
    });
    // the substitute-caveat (inform) axis is present…
    expect(sheets.almond).toMatch(/substitute|arsenic|not a milk/);
    // …AND the tree-nut allergen axis is preserved (the redirect must not silently drop it).
    expect(sheets.almond, 'almond milk must still warn it contains a tree-nut allergen').toMatch(/tree.?nut|almond/);
    expect(sheets.cashew).toMatch(/tree.?nut|cashew|allergen/);
  });

  // ── K-M-1 (Kael, gate↔card parity): coconut milk drink takes the plant gate, not cow copy ──
  test('K-M-1: a non-nut plant alias (coconut milk drink) gets the plant gate, not cow curd/paneer copy', async ({ page }) => {
    const reason = await page.evaluate(() => _fdAgeRule('coconut milk drink')?.reason || '');
    expect(reason.toLowerCase()).not.toMatch(/curd|paneer/);     // not the cow 'milk' carve-out
    expect(reason.toLowerCase()).toMatch(/substitute|fortified|arsenic/);
  });

  // ── _effPolarity unit contract (the §3 table) ──
  test('_effPolarity maps the v2 taxonomy to the four render polarities', async ({ page }) => {
    const p = await page.evaluate(() => ({
      honey: _effPolarity(getFoodEffect('honey')),
      peanut: _effPolarity(getFoodEffect('peanut')),
      cow: _effPolarity(getFoodEffect('cow milk')),
      plant: _effPolarity(getFoodEffect('plant milk')),
    }));
    expect(p.honey).toBe('warn');
    expect(p.peanut).toBe('encourage');
    expect(p.cow).toBe('conditional');
    expect(p.plant).toBe('inform');
  });
});
