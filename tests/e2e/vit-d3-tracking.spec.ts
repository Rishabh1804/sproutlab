import { test, expect } from '@playwright/test';

// Vit D3 Tracking v1 — regression guards.
// Spec: docs/specs/vit-d3-tracking-v1.md.
// QA chain canon-cc-008: Maren Mode-1 (primary) + Kael Mode-1 (secondary) parallel
//                       → Lyra synth → Cipher Edict V.

test('regression-guard-d3-schema-backwards-compat: parseMedCheck normalises legacy strings to canonical object', async ({ page }) => {
  // Legacy storage shape is a string starting with 'done:' followed by HH:MM tap-time.
  // parseMedCheck must return the canonical object with givenAt = HH:MM and withFat = null.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const fixtures = [
      { input: 'done:08:42', expectStatus: 'done', expectGivenAt: '08:42', expectWithFat: null },
      { input: 'done:late', expectStatus: 'late', expectGivenAt: null, expectWithFat: null },
      { input: 'skipped', expectStatus: 'skipped', expectGivenAt: null, expectWithFat: null },
      { input: 'done', expectStatus: 'late', expectGivenAt: null, expectWithFat: null }, // bare 'done' falls into late bucket
    ];
    return fixtures.map(f => {
      const p = parseMedCheck(f.input);
      return {
        input: f.input,
        ok: p && p.status === f.expectStatus && p.givenAt === f.expectGivenAt && p.withFat === f.expectWithFat,
        actual: p,
      };
    }).filter(r => !r.ok);
  });

  expect(r, 'parseMedCheck must canonicalise legacy string shapes').toEqual([]);
});

test('regression-guard-d3-write-object-shape: markMedDone emits the new object schema with all six fields', async ({ page }) => {
  // The "Done now" button path — no givenTime arg, defaults to now. Verify the
  // persisted value is an object (not a string) with all six schema fields present.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    // Seed: ensure DEFAULT_MEDS has Vit D3
    const d3 = (meds || []).find(m => m.name && m.name.toLowerCase().includes('d3'));
    if (!d3) return { skipped: 'no D3 med in DEFAULT_MEDS' };
    // Clear any existing today entry
    const t = today();
    if (medChecks[t]) delete medChecks[t][d3.name];
    // Call the write path
    markMedDone(d3.name, 0);
    const stored = medChecks[t][d3.name];
    return {
      isObject: typeof stored === 'object' && stored !== null,
      hasStatus: stored && 'status' in stored,
      hasGivenAt: stored && 'givenAt' in stored,
      hasLoggedAt: stored && 'loggedAt' in stored,
      hasWithFat: stored && 'withFat' in stored,
      hasFatFood: stored && 'fatFood' in stored,
      hasFatDelta: stored && 'fatDelta' in stored,
      statusVal: stored && stored.status,
    };
  });

  expect(r.isObject, 'write must emit object shape, not legacy string').toBe(true);
  expect(r.hasStatus && r.hasGivenAt && r.hasLoggedAt && r.hasWithFat && r.hasFatFood && r.hasFatDelta, 'object must carry all six schema fields').toBe(true);
  expect(r.statusVal).toBe('done');
});

test('regression-guard-d3-with-fat-auto-detect: a fat-bearing meal logged near the dose time triggers withFat:true', async ({ page }) => {
  // Seed feedingData with a ghee-containing breakfast at 08:30, then mark D3 done at 08:45.
  // Verify the auto-detector flagged withFat:true with fatFood matching ghee and fatDelta within window.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const d3 = (meds || []).find(m => m.name && m.name.toLowerCase().includes('d3'));
    if (!d3) return { skipped: 'no D3 med' };
    const t = today();
    // Seed meal log: breakfast at 08:30 with ghee chapati
    if (!feedingData[t]) feedingData[t] = {};
    feedingData[t].breakfast = 'chapati, ghee, banana';
    feedingData[t].breakfast_time = '08:30';
    // Clear today's D3
    if (medChecks[t]) delete medChecks[t][d3.name];
    // Mark done at 08:45 (15min after the fat-meal)
    markMedDone(d3.name, 0, '08:45');
    const stored = medChecks[t][d3.name];
    return {
      withFat: stored && stored.withFat,
      fatFood: stored && stored.fatFood,
      fatDelta: stored && stored.fatDelta,
      givenAt: stored && stored.givenAt,
    };
  });

  expect(r.withFat, 'fat-bearing meal within ±60min should trigger withFat:true').toBe(true);
  expect(r.fatFood, 'fatFood should be the matched food name').toBe('ghee');
  expect(r.givenAt).toBe('08:45');
  expect(typeof r.fatDelta).toBe('number');
  expect(Math.abs(r.fatDelta)).toBeLessThanOrEqual(60);
});

test('regression-guard-d3-with-fat-no-match: dose with no nearby fat-meal records withFat:false', async ({ page }) => {
  // Seed feedingData with only a non-fat meal (rice + cucumber, no ghee/curd/etc).
  // Verify the auto-detector returns withFat:false.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const d3 = (meds || []).find(m => m.name && m.name.toLowerCase().includes('d3'));
    if (!d3) return { skipped: 'no D3 med' };
    const t = today();
    if (!feedingData[t]) feedingData[t] = {};
    feedingData[t].breakfast = 'rice, cucumber, apple';
    feedingData[t].breakfast_time = '08:30';
    feedingData[t].lunch = 'plain dal, rice';
    feedingData[t].lunch_time = '12:30';
    if (medChecks[t]) delete medChecks[t][d3.name];
    markMedDone(d3.name, 0, '08:45');
    const stored = medChecks[t][d3.name];
    return {
      withFat: stored && stored.withFat,
      fatFood: stored && stored.fatFood,
    };
  });

  expect(r.withFat, 'no fat-bearing meal nearby → withFat must be false').toBe(false);
  expect(r.fatFood).toBeNull();
});

test('regression-guard-d3-adjust-flow: adjustMedTime updates givenAt AND re-runs with-fat detection on the new time', async ({ page }) => {
  // Mark done at 14:00 with no nearby fat-meal (no breakfast logged) — should be withFat:false.
  // Then adjust to 08:45 which IS near a 08:30 fat-meal — should flip to withFat:true.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const d3 = (meds || []).find(m => m.name && m.name.toLowerCase().includes('d3'));
    if (!d3) return { skipped: 'no D3 med' };
    const t = today();
    if (!feedingData[t]) feedingData[t] = {};
    // Only a morning fat-meal — afternoon has no meal
    feedingData[t].breakfast = 'chapati, ghee';
    feedingData[t].breakfast_time = '08:30';
    feedingData[t].lunch = '';
    feedingData[t].lunch_time = '';
    if (medChecks[t]) delete medChecks[t][d3.name];
    // First log: 14:00 — no fat-meal in window
    markMedDone(d3.name, 0, '14:00');
    const first = medChecks[t][d3.name];
    // Adjust to 08:45 — should match the breakfast ghee
    adjustMedTime(d3.name, 0, '08:45');
    const second = medChecks[t][d3.name];
    return {
      firstGivenAt: first && first.givenAt,
      firstWithFat: first && first.withFat,
      secondGivenAt: second && second.givenAt,
      secondWithFat: second && second.withFat,
      secondFatFood: second && second.fatFood,
    };
  });

  expect(r.firstGivenAt).toBe('14:00');
  expect(r.firstWithFat, 'first log at 14:00 has no fat-meal in window').toBe(false);
  expect(r.secondGivenAt, 'adjust must update givenAt').toBe('08:45');
  expect(r.secondWithFat, 'adjust must re-run with-fat detection on the new time').toBe(true);
  expect(r.secondFatFood).toBe('ghee');
});
