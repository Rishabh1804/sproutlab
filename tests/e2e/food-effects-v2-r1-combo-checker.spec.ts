import { test, expect } from '@playwright/test';

// food-effects v2 — R1: the "Can I give this?" combo checker reconciled onto
// FOOD_EFFECTS (spec §3.1). BOTH polarities + the co-located emergency floor.
//
//   • acute-toxin (honey)        → verdict avoid (hard, never softened) + the
//                                  botulism watch-fors/seek-care floor + hazard.
//   • allergen-introduce-early   → verdict SAFE (encourage, the legacy allergen→
//     (age-appropriate peanut/nut)  caution flip SUPPRESSED) + safe-form gate +
//                                  compact whyGood + the severe anaphylaxis floor,
//                                  co-located ABOVE nutrition/recipe (M-S-3).
//   • below the soft floor       → age avoid AND the floor still renders (M-S-4).
//   • multi-food                 → avoid dominates the verdict; EACH food's floor
//                                  renders (Invariant 1 is per-food).
//   • "peanut-free"              → R0 guard: no match, no floor, no encourage.
//   • HR-4 (M-S-9)               → user food tokens are escaped at render.
//
// Driven via checkFoodCombo() and inspected on #comboResult structurally (counts /
// DOM order / class), not through tab chrome (avoids the active-panel race).
declare const checkFoodCombo: () => void;
declare const getFoodEffect: (name: string) => any;
declare const getAgeInMonths: () => number;

async function runCombo(page: any, query: string) {
  return page.evaluate((q: string) => {
    const inp = document.getElementById('comboInput') as HTMLInputElement;
    inp.value = q;
    checkFoodCombo();
    const el = document.getElementById('comboResult')!;
    const firstFloor = el.querySelector('.cons-severe, .cons-watch, .cons-seek');
    const nutTitle = Array.from(el.querySelectorAll('.combo-section-title'))
      .find(t => /Nutrition/i.test(t.textContent || ''));
    return {
      html: el.innerHTML,
      resultClass: (el.querySelector('.combo-result') as HTMLElement)?.className || '',
      verdictClass: (el.querySelector('.combo-verdict') as HTMLElement)?.className || '',
      verdictText: (el.querySelector('.combo-verdict') as HTMLElement)?.textContent || '',
      severeCount: el.querySelectorAll('.cons-severe').length,
      watchCount: el.querySelectorAll('.cons-watch').length,
      seekCount: el.querySelectorAll('.cons-seek').length,
      imgCount: el.querySelectorAll('img').length,
      // floor co-located above nutrition (M-S-3): the first floor block precedes
      // the Nutrition section in DOM order (or nutrition is absent → trivially OK).
      floorAboveNutrition: !firstFloor ? null
        : (!nutTitle ? true : !!(firstFloor.compareDocumentPosition(nutTitle) & 4)),
    };
  }, query);
}

test.describe('food-effects v2 — R1 combo checker (both poles + floor)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() =>
      typeof checkFoodCombo === 'function'
      && typeof getFoodEffect === 'function'
      && typeof getAgeInMonths === 'function'
      && !!document.getElementById('comboInput'), null, { timeout: 10_000 });
    // Sanity: Ziva is between the nut floor (6mo) and the honey ceiling (12mo),
    // so "peanut" is age-appropriate and "honey" is below its floor.
    const mo = await page.evaluate(() => getAgeInMonths());
    expect(mo, 'test relies on 6 < age < 12 months').toBeGreaterThan(6);
    expect(mo).toBeLessThan(12);
  });

  test('honey → hard AVOID + the botulism floor + hazard (acute-toxin, never softened)', async ({ page }) => {
    const r = await runCombo(page, 'honey');
    expect(r.resultClass, 'avoid chrome').toContain('avoid');
    expect(r.verdictText, 'headline is the record hazard title, never bare "safe"').toContain('Honey before 12 months');
    expect(r.html.toLowerCase(), 'botulism hazard surfaced (toxin.why)').toContain('botulism');
    expect(r.watchCount, 'botulism watch-fors render').toBeGreaterThan(0);
    expect(r.seekCount, 'seek-care renders').toBeGreaterThan(0);
    expect(r.severeCount, 'honey has no anaphylaxis severeSigns').toBe(0);
    expect(r.html, 'no encourage/introduce-early framing for an acute-toxin').not.toContain('introduce early');
  });

  test('age-appropriate peanut → SAFE + encourage, floor co-located above the fold', async ({ page }) => {
    const r = await runCombo(page, 'peanut');
    // legacy allergen→caution flip SUPPRESSED (K-S-5): verdict is safe, not caution.
    expect(r.verdictClass, 'safe verdict (caution flip suppressed)').toContain('safe');
    expect(r.verdictClass).not.toContain('caution');
    // headline from eff.title — never a synthesized bare "safe" (M-S-2).
    expect(r.verdictText).toContain('good to introduce early');
    // the severe anaphylaxis floor renders…
    expect(r.severeCount, 'anaphylaxis severe strip present').toBeGreaterThan(0);
    expect(r.seekCount).toBeGreaterThan(0);
    // …above the nutrition section (M-S-3).
    expect(r.floorAboveNutrition, 'floor co-located above nutrition (M-S-3)').toBe(true);
    // the safe-form gate (A-2) + a compact benefit are surfaced.
    expect(r.html, 'safe-form gate (never-whole / not the allergy risk)').toMatch(/does not remove the allergy risk|Safe form/i);
    expect(r.html.toLowerCase(), 'compact whyGood benefit').toContain('plant protein');
  });

  test('below the soft floor → age AVOID, and the floor still renders (M-S-4)', async ({ page }) => {
    // "whole almond" hits the 60-month choking gate (well above Ziva's age), so it
    // is a below-floor avoid — but the tree-nut record's floor must still surface.
    const r = await runCombo(page, 'whole almond');
    expect(r.resultClass, 'below-floor → avoid').toContain('avoid');
    expect(r.severeCount + r.watchCount + r.seekCount, 'the floor still renders below the floor').toBeGreaterThan(0);
  });

  test('multi-food "peanut with honey" → AVOID dominates, BOTH floors render (per-food)', async ({ page }) => {
    const r = await runCombo(page, 'peanut with honey');
    expect(r.resultClass, 'honey avoid dominates the top-level verdict').toContain('avoid');
    expect(r.verdictText, 'hazard headline (honey)').toContain('Honey before 12 months');
    expect(r.severeCount, "peanut's anaphylaxis floor is not suppressed by honey's avoid").toBeGreaterThan(0);
    expect(r.watchCount, "honey's botulism floor renders too").toBeGreaterThan(0);
  });

  test('"peanut-free" → R0 guard holds in the combo checker (no match, no floor, no encourage)', async ({ page }) => {
    const r = await runCombo(page, 'peanut-free');
    expect(r.severeCount + r.watchCount, 'a negated query surfaces no floor').toBe(0);
    expect(r.html, 'no encourage framing on an excluded food').not.toContain('good to introduce early');
    expect(r.resultClass, 'not an acute-toxin avoid').not.toContain('avoid');
  });

  test('HR-4 (M-S-9): a script-y food token is escaped, not injected', async ({ page }) => {
    const r = await runCombo(page, '<img src=x onerror=alert(1)> + apple');
    expect(r.imgCount, 'no live <img> injected from the query').toBe(0);
    expect(r.html, 'the token is HTML-escaped').toContain('&lt;img');
  });
});
