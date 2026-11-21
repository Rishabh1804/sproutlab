import { test, expect, type Page } from '@playwright/test';
import { pinAgeMonths } from './fixtures/clock';

// food-effects-v2 P1c — the MILK polarity cards (milk-spec §4/§5/§10).
//
// Two v2 foodClasses. They first rendered as sibling Library cards (renderDietMilkIntro →
// #dietMilkIntro / #dietPlantMilkIntro); Library #5b (#216) retired those cards, and each milk
// now reads on its own food pop-up (libOpenBook → #libPopOv), the 6-second card: a verdict
// band, then rows that start folded, the floor one tap from the Emergency Deck (design record:
// docs/design/library-redesign/11-food-card-6sec-template.html):
//   • cow milk   = drink-timing      — CONDITIONAL: the amber wait band leads with the
//     carve-out ("fine in food; wait as a drink"); the forms row lists ok before never. The
//     CMPA severe floor is a rose row, dairy-scoped, deep-linking to the anaphylaxis card.
//   • plant milk = substitute-caveat — INFORM, a sky band; the never list names rice<5=arsenic;
//     NO acute floor (the floor follows the hazard; harm is nutritional/chronic, not acute).
//
// Pop-up-relative assertions, so the deferred switchTab(savedTab) race on init doesn't matter.

declare const renderDietLibrary: () => void;
declare const getFoodEffect: (n: string) => any;
declare const renderFoodDetailSheet: (n: string) => void;
declare const _fdAgeRule: (n: string) => any;
declare const _effPolarity: (e: any) => string;

// Open a Library book's food pop-up the way a tap on the shelf does (libOpenBook reads the
// key from the tapped button) and return its front face. Asserted pop-up-relative — not
// through the tab chrome, which races the app's deferred switchTab(savedTab) on init.
async function openBook(page: Page, key: string) {
  await page.evaluate((k) => {
    const b = document.createElement('button');
    b.setAttribute('data-arg', k);
    (window as any).libOpenBook(b);
  }, key);
  return page.locator('#libPopOv .fp-front');
}

test.describe('food-effects-v2 P1c — milk polarity cards', () => {
  test.beforeEach(async ({ page }) => {
    // A 9-month-old: inside the introduction window these cards are written for. Pinned so the
    // spec does not expire as the fixture child grows (cow's milk and honey re-frame at 12 and 24 mo).
    await pinAgeMonths(page, 9);
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() =>
      typeof (window as any).renderDietLibrary === 'function'
      && typeof (window as any).getFoodEffect === 'function', null, { timeout: 10_000 });
    await page.evaluate(() => (window as any).renderDietLibrary());
  });

  // The dedicated milk cards were retired in Library #5b; S11 moved their guidance onto each
  // milk's own food pop-up (libOpenBook). (a)–(c) follow it there.
  // ── §10(a) — cow milk: a CONDITIONAL lead, the carve-out before the gate; never warn/avoid, never encourage ──
  test('(a) cow milk leads CONDITIONAL — the amber wait band (clock), carve-out before the gate', async ({ page }) => {
    const front = await openBook(page, 'cow milk');
    const verdict = front.locator('.fp-verdict');
    await expect(verdict).toHaveClass(/\bfp-verdict--wait\b/);
    await expect(verdict.locator('use[href="#zi-clock"]')).toHaveCount(1);
    // The lead is neither an "avoid" warn band nor an "introduce early" yes band, and no siren.
    await expect(verdict.locator('use[href="#zi-warn"], use[href="#zi-siren"]')).toHaveCount(0);
    await expect(front.locator('.fp-verdict--no, .fp-verdict--yes')).toHaveCount(0);
    // The reassurance reads first, inside the lead itself.
    await expect(verdict).toContainText(/fine in food; wait as a drink/i);
    // In the forms row the carve-out (ok) chips come before the gate (never) chips.
    const forms = front.locator('.lib-prow--forms');
    const order = await forms.evaluate((f) => {
      const good = f.querySelector('.fp-chip--ok'), gate = f.querySelector('.fp-chip--never');
      if (!good || !gate) return 'missing';
      return (good.compareDocumentPosition(gate) & 4) ? 'good-first' : 'gate-first';
    });
    expect(order).toBe('good-first');
    // The non-suppressible invariant ("the drink is gated; the dairy is not") is on the card.
    await expect(forms.locator('.lib-prow-p')).toContainText(/the drink is gated; the dairy is not/i);
  });

  // ── §10(b) — cow milk CMPA severe floor: on the card, rose, dairy-scoped, 112/108 + antihistamine ──
  test('(b) cow milk carries the CMPA severe floor: rose, dairy-scoped, with the emergency line', async ({ page }) => {
    const front = await openBook(page, 'cow milk');
    const floor = front.locator('.lib-prow--floor');
    await expect(floor).toHaveCount(1);
    // An ALLERGY floor (rose), kept apart from the amber TIMING gate in the lead (V-V-4).
    await expect(floor).not.toHaveClass(/\blib-prow--caution\b/);
    await expect(floor.locator('.lib-prow-signs li')).toHaveCount(4);
    // Scoped to the SEVERE path of a dairy reaction (M-M-2 — not "any reaction is an emergency").
    const act = floor.locator('.lib-prow-act');
    await expect(act).toContainText(/a mild reaction to dairy/i);
    // the emergency action: call 112/108 + the antihistamine-doesn't-treat-anaphylaxis line.
    await expect(act).toContainText(/112|108/);
    await expect(act).toContainText(/antihistamine does not treat anaphylaxis/i);
    // The floor follows the hazard: cow's milk deep-links to the anaphylaxis card (V-M-237).
    await expect(floor.locator('.lib-prow-deck')).toHaveAttribute('data-arg', 'anaphylaxis');
  });

  // ── §10(c) — plant milk: sky inform lead, rice<5=arsenic named; NO acute floor ──
  test('(c) plant milk leads INFORM (sky, info), names rice<5=arsenic, and has NO acute floor', async ({ page }) => {
    const front = await openBook(page, 'plant milk');
    const verdict = front.locator('.fp-verdict');
    await expect(verdict).toHaveClass(/\bfp-verdict--info\b/);
    await expect(verdict.locator('use[href="#zi-info"]')).toHaveCount(1);
    await expect(verdict.locator('use[href="#zi-warn"], use[href="#zi-siren"]')).toHaveCount(0);
    // the "Never" list names rice under 5 (arsenic) and the not-a-substitute line.
    const never = front.locator('.lib-prow--forms .fp-chip--never');
    await expect(never.filter({ hasText: /rice drinks/i })).toContainText(/under 5 years/i);
    await expect(never.filter({ hasText: /rice drinks/i })).toContainText(/arsenic/i);
    await expect(never.filter({ hasText: /substitute before 12 months/i })).toHaveCount(1);
    // substitute-caveat carries NO acute (rose) floor — the floor follows the hazard. What it
    // does carry is the amber, soy-scoped watch row.
    await expect(front.locator('.lib-prow--floor:not(.lib-prow--caution)')).toHaveCount(0);
    await expect(front.locator('.lib-prow--floor.lib-prow--caution')).toContainText(/soy milk only/i);
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

  // ── K-M-1 (Kael, gate↔card parity): coconut milk drink + the Hindi 'doodh' variants ──
  test('K-M-1: plant-milk hosts take the plant gate, not cow curd/paneer NOR a tree-nut 6mo gate', async ({ page }) => {
    const r = await page.evaluate(() => ({
      coconut: _fdAgeRule('coconut milk drink')?.reason || '',
      // the Cipher-caught leak: 'doodh' variants raw-resolve to tree-nut's alias, not the bare
      // 'milk' key — the card says "not a substitute under 1", the gate must NOT say tree-nut@6.
      badamDoodh: { reason: _fdAgeRule('badam doodh')?.reason || '', min: _fdAgeRule('badam doodh')?.minMonth },
      kajuDoodh:  { reason: _fdAgeRule('kaju doodh')?.reason || '', min: _fdAgeRule('kaju doodh')?.minMonth },
      // the bare nut still gates as an introduce-early tree nut (unchanged), and rice keeps arsenic:
      badam: _fdAgeRule('badam')?.minMonth,
      riceMilk: _fdAgeRule('rice milk')?.minMonth,
    }));
    expect(r.coconut.toLowerCase()).not.toMatch(/curd|paneer/);
    expect(r.coconut.toLowerCase()).toMatch(/substitute|fortified|arsenic/);
    expect(r.badamDoodh.min, 'badam doodh must NOT get the tree-nut 6mo gate').toBe(12);
    expect(r.badamDoodh.reason.toLowerCase()).toMatch(/substitute|fortified|arsenic/);
    expect(r.kajuDoodh.min).toBe(12);
    expect(r.badam, 'the bare nut is still an introduce-early tree nut at ~6mo').toBe(6);
    expect(r.riceMilk, 'rice keeps its under-5 arsenic gate (dedicated, untouched)').toBe(60);
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
