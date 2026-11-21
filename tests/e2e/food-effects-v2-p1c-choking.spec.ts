import { test, expect, type Page } from '@playwright/test';
import { pinAgeMonths } from './fixtures/clock';

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
//     blows + abdominal thrusts (child 1y+ technique since 2026-09 — the under-1 chest-thrust
//     protocol was retired when the child turned one), and NO adrenaline / auto-injector.
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

test.describe('food-effects-v2 P1c — the choking set', () => {
  test.beforeEach(async ({ page }) => {
    // A 9-month-old: inside the introduction window these cards are written for. Pinned so the
    // spec does not expire as the fixture child grows (cow's milk and honey re-frame at 12 and 24 mo).
    await pinAgeMonths(page, 9);
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() =>
      typeof (window as any).renderDietLibrary === 'function'
      && typeof (window as any).getFoodEffect === 'function'
      && typeof (window as any)._effPolarity === 'function', null, { timeout: 10_000 });
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
  test('the emergency floor is CHOKING FIRST AID — back blows / abdominal thrusts, NEVER adrenaline', async ({ page }) => {
    const e = await page.evaluate(() => {
      const x = getFoodEffect('choking hazards');
      return { severe: [].concat(x.severeSigns || []).join(' | ').toLowerCase(),
               seek: (x.seekCare || '').toLowerCase() };
    });
    // the mechanical-rescue protocol is present...
    expect(e.seek).toMatch(/back blow/);
    expect(e.seek).toMatch(/abdominal thrust/);          // the child (1y+) technique
    expect(e.seek).toMatch(/inwards and upwards/);
    expect(e.seek).not.toMatch(/chest thrust/);          // the retired infant technique must not linger
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

  // ── the choking book's pop-up (the dedicated card was retired in Library #5b; S11 moved its
  //    guidance here): a CONDITIONAL lead — modify, don't ban — never the siren, never "yes" ──
  test('the pop-up leads CONDITIONAL — the amber wait band (clock), never a siren, never the encourage tick', async ({ page }) => {
    const front = await openBook(page, 'choking hazards');
    const verdict = front.locator('.fp-verdict');
    await expect(verdict).toHaveCount(1);
    await expect(verdict).toHaveClass(/\bfp-verdict--wait\b/);
    await expect(verdict.locator('use[href="#zi-clock"]')).toHaveCount(1);
    // conditional, NOT the rose 'avoid' band, NOT the siren, and NOT the encourage "yes".
    await expect(verdict.locator('use[href="#zi-siren"], use[href="#zi-warn"]')).toHaveCount(0);
    await expect(front.locator('.fp-verdict--no, .fp-verdict--yes')).toHaveCount(0);
    // the lead is the carve-out (how to make it safe), not a ban.
    await expect(verdict).toContainText(/cut small, cook soft, grind/i);
    // modify-don't-ban is the first row a parent can open, above the forms and the floor.
    await expect(front.locator('.lib-prow').first()).toContainText(/the hazard is the SHAPE, not the food/);
  });

  // ── M-γ-1: the per-food cut rules render (the load-bearing "modify, don't ban" guidance) ──
  test('the cut-it-this-way rules are on the card (quarter grapes lengthwise; hot dogs lengthwise)', async ({ page }) => {
    const forms = (await openBook(page, 'choking hazards')).locator('.lib-prow--forms');
    await expect(forms).toHaveCount(1);
    await expect(forms.locator('.fp-chip--ok').first()).toContainText(/quarter lengthwise/i);
    await expect(forms).toContainText(/hot dogs?.*lengthwise.*strips/i);
    // the never list names the classic plugs.
    await expect(forms.locator('.fp-chip--never').first()).toContainText(/whole grapes/i);
  });

  // ── the choking-first-aid floor is on the card + scoped to choking (not "allergic reaction") ──
  test('the choking-first-aid floor is on the card, choking-scoped, and deep-links to the Deck choking card', async ({ page }) => {
    const front = await openBook(page, 'choking hazards');
    // One floor row, in the amber caution chrome (choking is mechanical — not the anaphylaxis rose).
    const floor = front.locator('.lib-prow--floor');
    await expect(floor).toHaveCount(1);
    await expect(floor).toHaveClass(/\blib-prow--caution\b/);
    await expect(floor.locator('.lib-prow-t')).toContainText(/if she is choking/i);
    const act = floor.locator('.lib-prow-act');
    await expect(act).toContainText(/back blows/i);
    await expect(act).toContainText(/abdominal thrusts/i);
    await expect(act).toContainText(/NO adrenaline/);
    // The deep-link lands on the Deck's choking card — mechanical first aid, no adrenaline step.
    await expect(floor.locator('.lib-prow-deck')).toHaveAttribute('data-arg', 'choking');
    await page.evaluate(() => (window as any).libPopToDeck(document.querySelector('#libPopOv .lib-prow-deck')));
    // Child combinators: the Deck's cards are nested in one another in the DOM today (an unclosed
    // div in _emDocFace — docs/BUGS.md), so a descendant selector would read the botulism card too.
    const card = page.locator('#libDeckOv #ec-choking > .fp-flip > .fp-front');
    await expect(card).toContainText(/back blows/i);
    await expect(card).toContainText(/abdominal thrusts/i);
    await expect(card).not.toContainText(/adrenaline|auto-injector/i);
  });

  // ── the gagging-vs-choking discriminator (V-V-12) was PINNED on the retired card. No live
  //    surface renders it now (the record still holds it: FOOD_EFFECTS['choking hazards'].myth),
  //    so its guard went with the card — logged in docs/BUGS.md, "Guidance dropped when the
  //    Library knowledge cards were retired", for the Architect to restore or let go. ──

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
