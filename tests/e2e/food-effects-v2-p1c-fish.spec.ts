import { test, expect } from '@playwright/test';

// food-effects-v2 P1c — fish (finfish) wiring.
//
// Fish uses the ESTABLISHED allergen-introduce-early polarity (the δ encourage
// surfaces — no new render card) PLUS choking-by-form (bones, folded into the
// safe-form gate). It restores a green sync-gate build (the manifest entry merged
// in #210 ahead of wiring → silent-gate Check 2). The load-bearing disciplines:
//   • TWO-TIER honesty — fish is introduce-early-and-SAFE, NOT prevention-proven
//     (EAT was null for fish); earlyIntroBenefit must NOT claim early fish prevents
//     fish allergy.
//   • MERCURY species-selection rides in safeForm (low- vs high-mercury), no new field.
//   • Word-boundary resolver safety — 'shellfish' must NOT resolve to the fish record.

declare const getFoodEffect: (name: string) => any;
declare const renderFoodDetailSheet: (name: string) => void;
declare const _fdAgeRule: (name: string) => any;

test.describe('food-effects-v2 P1c — fish', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() =>
      typeof getFoodEffect === 'function'
      && typeof renderFoodDetailSheet === 'function'
      && !!document.getElementById('foodDetailBody'), null, { timeout: 10_000 });
  });

  test('fish resolves to a record carrying both allergen-introduce-early and choking-by-form', async ({ page }) => {
    const fc = await page.evaluate(() => {
      const e = getFoodEffect('fish');
      return e ? [].concat(e.foodClass) : null;
    });
    expect(fc).not.toBeNull();
    expect(fc).toContain('allergen-introduce-early');
    expect(fc).toContain('choking-by-form');
  });

  test('two-tier honesty: introduce-early-and-SAFE, never a prevention claim', async ({ page }) => {
    const b = await page.evaluate(() => getFoodEffect('fish')?.earlyIntroBenefit || {});
    const ev = (b.evidence || '').toLowerCase();
    const para = (b.paradigm || '').toLowerCase();
    // EAT null for fish — the evidence line must say early intro did NOT prevent the allergy.
    expect(ev).toMatch(/did not show|not.*prevent/);
    // The paradigm carries the soy/wheat/sesame "safe to introduce, not proven prevention" frame.
    expect(para).toMatch(/safe to introduce|not a proven prevention/);
    // It must NOT launder a peanut/egg-style POSITIVE prevention claim onto fish.
    expect(ev).not.toMatch(/helps prevent fish|lowers.*fish allergy|markedly lowers/);
    expect((b.claim || '').toLowerCase()).not.toMatch(/prevent/);
  });

  test('mercury species-selection rides in safeForm (low-mercury ok, high-mercury never)', async ({ page }) => {
    const sf = await page.evaluate(() => getFoodEffect('fish')?.safeForm || {});
    const ok = (sf.ok || []).join(' | ').toLowerCase();
    const never = (sf.never || []).join(' | ').toLowerCase();
    expect(ok).toMatch(/low-mercury|salmon|sardine|bangda/);
    expect(never).toMatch(/high-mercury|shark|swordfish|king mackerel/);
    // bones (the choking-by-form axis) are flagged in the never list too.
    expect(never).toMatch(/bone/);
  });

  test('the detail sheet surfaces the encourage framing + the anaphylaxis floor (not mild-only)', async ({ page }) => {
    const d = await page.evaluate(() => {
      renderFoodDetailSheet('fish');
      const el = document.getElementById('foodDetailBody')!;
      return {
        encourage: !!el.querySelector('.fd-flag-encourage'),
        siren: !!el.querySelector('.fd-flag-allergen'),
        severe: el.querySelectorAll('.cons-severe').length,
        html: el.innerHTML.toLowerCase(),
      };
    });
    expect(d.encourage, 'introduce-early reads encourage (sage), not the rose siren').toBe(true);
    expect(d.siren).toBe(false);
    expect(d.severe, 'anaphylaxis floor present').toBeGreaterThan(0);
    expect(d.html).toMatch(/trouble breathing|tongue or throat|hoarse|floppy/);
  });

  test('AGE_RULES reconciled to ~6 months (was 7); a low-mercury species resolves to it', async ({ page }) => {
    const r = await page.evaluate(() => ({
      fish: _fdAgeRule('fish')?.minMonth,
      bangda: _fdAgeRule('bangda')?.minMonth,
      salmon: _fdAgeRule('salmon')?.minMonth,
    }));
    expect(r.fish).toBe(6);
    expect(r.bangda).toBe(6);   // alias resolves to the same gate (one-resolver doctrine)
    expect(r.salmon).toBe(6);
  });

  test('M-F-1: high-mercury / ambiguous names do NOT fire the green encourage verdict', async ({ page }) => {
    // Maren's blocking finding (folded): logging a high-mercury species name must not resolve
    // to the fish encourage card (a green "good to introduce early" verdict). surmai/seer (king
    // mackerel) + bare mackerel/tuna are documented in safeForm.never but NOT aliased, so they
    // fire no card at all — never a false-safe one. Low-mercury names still resolve.
    const r = await page.evaluate(() => ({
      surmai:  !!getFoodEffect('surmai'),
      seer:    !!getFoodEffect('seer fish'),
      kingmac: !!getFoodEffect('king mackerel'),
      mackerel:!!getFoodEffect('mackerel'),
      tuna:    !!getFoodEffect('tuna'),
      // low-mercury names still fire the encourage card:
      bangda:  !!getFoodEffect('bangda'),
      indMac:  !!getFoodEffect('indian mackerel'),
      salmon:  !!getFoodEffect('salmon'),
    }));
    expect(r.surmai, 'surmai (king mackerel, high-mercury) must not fire the encourage card').toBe(false);
    expect(r.seer).toBe(false);
    expect(r.kingmac).toBe(false);
    expect(r.mackerel, 'bare mackerel is ambiguous (king vs indian) — no green verdict').toBe(false);
    expect(r.tuna, 'bare tuna is ambiguous (light vs bigeye/albacore) — no green verdict').toBe(false);
    expect(r.bangda, 'indian mackerel / bangda (low-mercury) still resolves').toBe(true);
    expect(r.indMac).toBe(true);
    expect(r.salmon).toBe(true);
  });

  test('word-boundary safety: shellfish does NOT resolve to the finfish record', async ({ page }) => {
    const r = await page.evaluate(() => ({
      shellfish: !!getFoodEffect('shellfish'),
      jellyfish: !!getFoodEffect('jellyfish'),
      fish: !!getFoodEffect('fish'),
    }));
    expect(r.shellfish, 'shellfish is a separate allergen — must not fire the finfish card').toBe(false);
    expect(r.jellyfish).toBe(false);
    expect(r.fish).toBe(true);
  });
});
