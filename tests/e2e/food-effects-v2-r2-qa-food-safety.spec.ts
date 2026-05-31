import { test, expect } from '@playwright/test';

// food-effects v2 — R2: the Smart Q&A food-safety answer (qaHandleFoodSafety)
// reconciled onto FOOD_EFFECTS (spec §3.2). Both polarities + the floor SECTION
// ordered before nutrition (K-S-4), via the resolver (K-S-2 alias-miss fix) and
// the verdict state-machine (K-S-5).
//
// Driven by calling qaHandleFoodSafety({mode:'food_safety', raw}) and inspecting
// the returned answer object (qaRenderAnswer escHtml's every field + renders
// sections flat/non-collapsibly, so HR-4 + floor non-collapsibility are the
// renderer's contract — confirmed in code).
declare const qaHandleFoodSafety: (classified: any) => any;
declare const getFoodEffect: (name: string) => any;
declare const getAgeInMonths: () => number;

async function ask(page: any, raw: string) {
  return page.evaluate((q: string) => {
    const a = qaHandleFoodSafety({ mode: 'food_safety', raw: q });
    if (!a) return null;
    const sections = (a.sections || []).map((s: any) => ({
      label: s.label, texts: (s.items || []).map((i: any) => i.text),
    }));
    const labelIdx = (re: RegExp) => sections.findIndex((s: any) => re.test(s.label));
    return {
      headline: a.headline || '',
      labels: sections.map((s: any) => s.label),
      allText: JSON.stringify(sections).toLowerCase(),
      floorIdx: labelIdx(/emergency|watch for|^why$/i),
      nutritionIdx: labelIdx(/nutrition/i),
      safeFormIdx: labelIdx(/safe form/i),
      hasEmergency: sections.some((s: any) => /emergency/i.test(s.label)),
      hasWatch: sections.some((s: any) => /watch for|^why$/i.test(s.label)),
      // V-R2-N1: floor sections must carry the emergency tone (rendered loud).
      floorToned: (a.sections || []).filter((s: any) => /emergency|watch for|^why$/i.test(s.label)).every((s: any) => s.tone === 'floor'),
      anyFloorToned: (a.sections || []).some((s: any) => s.tone === 'floor'),
    };
  }, raw);
}

test.describe('food-effects v2 — R2 Q&A food-safety (both poles + floor)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() =>
      typeof qaHandleFoodSafety === 'function'
      && typeof getFoodEffect === 'function'
      && typeof getAgeInMonths === 'function', null, { timeout: 10_000 });
    const mo = await page.evaluate(() => getAgeInMonths());
    expect(mo).toBeGreaterThan(6); expect(mo).toBeLessThan(12);
  });

  test('"can i give honey?" → AVOID + botulism floor + hazard, floor before nutrition', async ({ page }) => {
    const a = await ask(page, 'can i give honey');
    expect(a.headline, 'hazard headline from the record').toContain('Honey before 12 months');
    expect(a.allText, 'botulism named (toxin.why)').toContain('botulism');
    expect(a.hasWatch, 'botulism watch-fors / why floor section present').toBe(true);
    expect(a.allText).toMatch(/constipation|weak cry|floppiness/);
    // floor ordered before nutrition (K-S-4); nutrition may be absent (-1).
    if (a.nutritionIdx !== -1) expect(a.floorIdx).toBeLessThan(a.nutritionIdx);
    // V-R2-N1: the floor carries the loud emergency tone, not muted section chrome.
    expect(a.floorToned, 'floor sections carry tone:floor (emergency chrome)').toBe(true);
  });

  test('"can i give peanut?" → SAFE encourage (caution suppressed) + severe floor + safe-form', async ({ page }) => {
    const a = await ask(page, 'can i give peanut');
    expect(a.headline, 'encourage title, never bare "safe"').toContain('good to introduce early');
    expect(a.hasEmergency, 'anaphylaxis emergency floor section present').toBe(true);
    expect(a.anyFloorToned, 'the anaphylaxis floor carries emergency chrome (V-R2-N1)').toBe(true);
    expect(a.safeFormIdx, 'safe-form gate section present').toBeGreaterThan(-1);
    expect(a.allText, 'compact whyGood benefit').toContain('plant protein');
    // the SAFETY section must NOT read "Caution" (legacy allergen flip suppressed, K-S-5)
    const safety = JSON.stringify(a.labels) + a.allText;
    expect(a.allText, 'verdict is Safe, not Caution').toContain('safe for');
    expect(a.allText).not.toContain('caution for');
    // floor before nutrition (K-S-4)
    if (a.nutritionIdx !== -1) expect(a.floorIdx).toBeLessThan(a.nutritionIdx);
  });

  test('K-S-2: alias "badam" now resolves (was a silent bare-key MISS)', async ({ page }) => {
    // Before R2, AGE_RULES["badam"]/ALLERGENS["badam"] were undefined (bare key) →
    // the tree-nut record was never reached → no floor, no warning. The resolver
    // (alias-aware) now surfaces it.
    const a = await ask(page, 'can i give badam');
    expect(a.hasEmergency, 'badam → tree-nut anaphylaxis floor now surfaced').toBe(true);
    expect(a.headline.toLowerCase(), 'resolves to the tree-nut record').toContain('tree nut');
    // and the peanut alias path too
    const g = await ask(page, 'can i give groundnut');
    expect(g.hasEmergency, 'groundnut → peanut record floor').toBe(true);
  });

  test('"honeydew" ≠ honey (resolver word-boundary precision)', async ({ page }) => {
    const a = await ask(page, 'can i give honeydew');
    expect(a.headline, 'honeydew is not honey').not.toContain('Honey before 12 months');
    expect(a.allText, 'no botulism hazard for a melon').not.toContain('botulism');
  });

  test('multi-food "peanut with honey" → AVOID dominates, BOTH per-food floors render', async ({ page }) => {
    const a = await ask(page, 'can i give peanut with honey');
    expect(a.headline, 'honey hazard headline dominates').toContain('Honey before 12 months');
    expect(a.hasEmergency, "peanut's anaphylaxis floor renders").toBe(true);
    expect(a.allText, "honey's botulism floor renders too").toMatch(/constipation|weak cry|floppiness/);
  });

  test('"peanut-free" → R0 guard holds in the Q&A path (no floor, no encourage)', async ({ page }) => {
    const a = await ask(page, 'can i give peanut-free bread');
    expect(a.hasEmergency, 'a negated query surfaces no anaphylaxis floor').toBe(false);
    expect(a.headline, 'no encourage framing on an excluded food').not.toContain('good to introduce early');
  });
});
