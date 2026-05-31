import { test, expect } from '@playwright/test';

// food-effects-v2 P1a-β — peanut + tree nut wired into FOOD_EFFECTS + the
// shared word-boundary resolver. Drives the live globals (getFoodEffect,
// _lookupByFoodName, foodConsequenceCard) against the built app after init,
// the durable pattern used by the F-3 Library spec.
//
// What this guards:
//   1. Alias resolution — one 'tree nut' record reached by almond/badam/akhrot/
//      cashew/kaju/walnut/pista; one 'peanut' record by groundnut/moongphali.
//   2. The honeydew-class safety floor SURVIVES the alias layer — coconut,
//      coconut water, chestnut, butternut squash must NOT resolve to a nut.
//   3. The guided-introduction schema is present (foodClass multi-valued,
//      severity:'caution', severeSigns, safeForm, earlyIntroBenefit, whyGood).
//   4. The consequence card renders the non-collapsible severe strip (A-1/V-1)
//      and the never-whole form line is reachable in the record (A-2), with
//      amber chrome (severity:'caution'), not honey's rose.

test.describe('food-effects-v2 — peanut & tree nut', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() =>
      typeof (window as any).getFoodEffect === 'function'
      && typeof (window as any)._lookupByFoodName === 'function'
      && typeof (window as any).foodConsequenceCard === 'function');
  });

  test('peanut aliases all resolve to the one peanut record', async ({ page }) => {
    const titles = await page.evaluate(() =>
      ['peanut', 'peanuts', 'groundnut', 'moongphali', 'peanut butter']
        .map(n => (window as any).getFoodEffect(n)?.title || null));
    // every alias resolves, and to the SAME record
    expect(titles.every(t => typeof t === 'string')).toBe(true);
    expect(new Set(titles).size).toBe(1);
    expect(titles[0]).toContain('Peanut');
  });

  test('tree-nut aliases (English + Hindi) all resolve to the one tree-nut record', async ({ page }) => {
    const titles = await page.evaluate(() =>
      ['almond', 'badam', 'walnut', 'akhrot', 'cashew', 'kaju', 'pista', 'almond paste']
        .map(n => (window as any).getFoodEffect(n)?.title || null));
    expect(titles.every(t => typeof t === 'string')).toBe(true);
    expect(new Set(titles).size).toBe(1);
    expect(titles[0]).toContain('Tree nut');
  });

  test('the honeydew-class safety floor survives the alias layer', async ({ page }) => {
    // The alias arm must not turn the whole-word resolver into a substring one:
    // coconut / chestnut / butternut must never inherit a nut record.
    const results = await page.evaluate(() =>
      ['coconut', 'coconut water', 'chestnut', 'butternut squash', 'honeydew']
        .map(n => (window as any).getFoodEffect(n)));
    expect(results.every(r => r === null)).toBe(true);
  });

  test('peanut carries the guided-introduction schema', async ({ page }) => {
    const eff = await page.evaluate(() => (window as any).getFoodEffect('groundnut'));
    expect(Array.isArray(eff.foodClass)).toBe(true);
    expect(eff.foodClass).toContain('allergen-introduce-early');
    expect(eff.foodClass).toContain('choking-by-form');
    expect(eff.severity).toBe('caution'); // amber, not rose
    expect(eff.whyGood).toBeTruthy();
    expect(eff.earlyIntroBenefit?.evidence).toContain('LEAP');
    expect(eff.safeForm?.never).toEqual(expect.arrayContaining(['whole peanuts']));
    expect(eff.safeForm?.chokingUntilYears).toBe(5);
    expect(eff.severeSigns?.length).toBeGreaterThan(0);
  });

  test('age gate agrees with the card — same resolver, soft 6mo floor', async ({ page }) => {
    // _fdAgeRule routes through the same resolver; almond/groundnut must hit a
    // 6mo soft floor (introduce-early), NOT the 60mo whole-nut choking gate.
    const gates = await page.evaluate(() =>
      ['groundnut', 'almond', 'kaju'].map(n => (window as any)._fdAgeRule(n)?.minMonth));
    expect(gates).toEqual([6, 6, 6]);
  });

  test('consequence card renders the non-collapsible severe strip in amber (A-1/V-1/V-3)', async ({ page }) => {
    await page.evaluate(() => {
      const eff = (window as any).getFoodEffect('peanut');
      (window as any).foodConsequenceCard({
        severity: eff.severity, title: eff.title, why: eff.why,
        watchFor: eff.watchFor, severeSigns: eff.severeSigns, seekCare: eff.seekCare,
      }, () => {});
    });
    const card = page.locator('.consequence-card');
    await expect(card).toBeVisible();
    // amber caution chrome — NOT honey's rose cons-critical
    await expect(card).not.toHaveClass(/cons-critical/);
    // severe strip present, with all three red flags, not inside a <details>
    const strip = page.locator('.cons-severe');
    await expect(strip).toBeVisible();
    await expect(strip.locator('.cons-severe-list li')).toHaveCount(3);
    expect(await strip.locator('xpath=ancestor::details').count()).toBe(0);
    // mild watch-fors render in their own (separate) block
    await expect(page.locator('.cons-watch-list li').first()).toBeVisible();
  });
});
