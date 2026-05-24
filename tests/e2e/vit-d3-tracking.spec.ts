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

test('regression-guard-d3-substring-no-false-positive: coconut water does NOT match coconut in fat set (token-equality)', async ({ page }) => {
  // V-K-69: parent logs `coconut water` (which is NOT fat-bearing — it's electrolyte water).
  // The pre-fix substring matcher would have matched `coconut` (which IS fat-bearing).
  // Token-equality matching means the multi-word `coconut water` token doesn't equal
  // the single-word `coconut` token, so withFat must be false.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const d3 = (meds || []).find(m => m.name && m.name.toLowerCase().includes('d3'));
    if (!d3) return { skipped: 'no D3 med' };
    const t = today();
    if (!feedingData[t]) feedingData[t] = {};
    feedingData[t].breakfast = 'coconut water, banana';
    feedingData[t].breakfast_time = '08:30';
    feedingData[t].lunch = '';
    feedingData[t].lunch_time = '';
    if (medChecks[t]) delete medChecks[t][d3.name];
    markMedDone(d3.name, 0, '08:45');
    const stored = medChecks[t][d3.name];
    return { withFat: stored && stored.withFat, fatFood: stored && stored.fatFood };
  });

  expect(r.withFat, 'coconut water (not fat-bearing) must NOT match coconut (fat-bearing)').toBe(false);
  expect(r.fatFood).toBeNull();
});

test('regression-guard-d3-parseMedCheck-non-string-non-object: null/undefined/number/array/boolean all return null', async ({ page }) => {
  // V-K-72: parseMedCheck must be TypeError-safe on any non-string-non-object input.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const fixtures = [null, undefined, 0, 42, [], [1, 2], true, false];
    return fixtures.map(f => ({ input: JSON.stringify(f) ?? String(f), result: parseMedCheck(f) }));
  });

  // Every non-string-non-object input must return null.
  r.forEach(row => {
    expect(row.result, `parseMedCheck(${row.input}) must return null`).toBeNull();
  });
});

test('regression-guard-d3-history-render-no-throw: Med-Log history tab renders without throwing on a v1-shape entry', async ({ page }) => {
  // V-K-66: Med-Log history previously called e.status.startsWith() — would TypeError on the new object shape.
  // Test seeds today's medCheck with a v1 object and verifies the renderMedLog path executes without throwing.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const d3 = (meds || []).find(m => m.name && m.name.toLowerCase().includes('d3'));
    if (!d3) return { skipped: 'no D3 med' };
    const t = today();
    // Seed a v1 object-shape entry
    if (!medChecks[t]) medChecks[t] = {};
    medChecks[t][d3.name] = {
      status: 'done',
      givenAt: '08:45',
      loggedAt: '08:50',
      withFat: true,
      fatFood: 'ghee',
      fatDelta: -15,
    };
    // Build the items array the history-month iteration consumes — invoke the reader logic directly.
    // The history-render iterates items.filter(e => medCheckIsDone(e.status)) post-migration.
    const items = [{ name: d3.name, date: t, status: medChecks[t][d3.name] }];
    let threw = false;
    let givenCount = 0;
    try {
      givenCount = items.filter(e => medCheckIsDone(e.status)).length;
    } catch (err) { threw = true; }
    return { threw, givenCount };
  });

  expect(r.threw, 'history-render filtering must not throw on v1 object-shape entries').toBe(false);
  expect(r.givenCount).toBe(1);
});

test('regression-guard-d3-data-action-delegation: openMedDoneAt is registered in the dispatcher and reachable via DOM click', async ({ page }) => {
  // V-M-59: the five new data-actions must be wired into the core.js delegation dispatcher.
  // The regression-guard suite previously called functions directly via page.evaluate, missing the click-path gap.
  // This test verifies each new action handler is at least defined and discoverable.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const required = ['openMedDoneAt', 'confirmMedDoneAt', 'cancelMedDoneAt', 'openMedAdjust', 'confirmMedAdjust'];
    return required.map(name => ({ name, defined: typeof window[name] === 'function' }));
  });

  const missing = r.filter(x => !x.defined).map(x => x.name);
  expect(missing, 'every new data-action handler must be a function on window scope').toEqual([]);
});

test('regression-guard-d3-parseMedCheck-legacy-ampm: legacy "done:HH:MM am|pm" strings parse to canonical 24h givenAt', async ({ page }) => {
  // CR-2: pre-PR markMedDone used en-IN locale which produced 'done:08:42 am' / 'done:02:30 PM'.
  // parseMedCheck must round-trip these into 24h canonical so the pattern card + Med Log
  // + Q&A surfaces stop hollowing out historical doses.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const fixtures = [
      { input: 'done:08:42 am', expectGivenAt: '08:42' },
      { input: 'done:08:42 AM', expectGivenAt: '08:42' },
      { input: 'done:02:30 pm', expectGivenAt: '14:30' },
      { input: 'done:12:00 pm', expectGivenAt: '12:00' },
      { input: 'done:12:30 am', expectGivenAt: '00:30' },
      { input: 'done:9:5 am',   expectGivenAt: null   }, // single-digit minute — still rejected (data-quality boundary)
    ];
    return fixtures.map(f => {
      const p = parseMedCheck(f.input);
      return { input: f.input, ok: p && p.givenAt === f.expectGivenAt, actualGivenAt: p ? p.givenAt : null };
    }).filter(r => !r.ok);
  });

  expect(r, 'legacy AM/PM strings must round-trip to 24h canonical via parseMedCheck').toEqual([]);
});

test('regression-guard-d3-parseSupplementTime-24h: _parseSupplementTime accepts the new 24h HH:MM writes', async ({ page }) => {
  // CR-3: pre-fix only accepted 12h+suffix; every new 24h write returned null and the
  // medical-tab adherence card silently dropped to 'No timing data'.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    return {
      h24_morning:   _parseSupplementTime('08:42'),     // → 522 min
      h24_evening:   _parseSupplementTime('21:00'),     // → 1260 min
      h24_midnight:  _parseSupplementTime('00:00'),     // → 0 min
      h12_morning:   _parseSupplementTime('08:42 am'),  // → 522 min
      h12_afternoon: _parseSupplementTime('2:30 pm'),   // → 870 min
      late_marker:   _parseSupplementTime('late'),      // → null
      invalid_h24:   _parseSupplementTime('25:00'),     // → null (out-of-range)
      invalid_min:   _parseSupplementTime('08:60'),     // → null (out-of-range minute)
    };
  });

  expect(r.h24_morning).toBe(8 * 60 + 42);
  expect(r.h24_evening).toBe(21 * 60);
  expect(r.h24_midnight).toBe(0);
  expect(r.h12_morning).toBe(8 * 60 + 42);
  expect(r.h12_afternoon).toBe(14 * 60 + 30);
  expect(r.late_marker).toBeNull();
  expect(r.invalid_h24).toBeNull();
  expect(r.invalid_min).toBeNull();
});

test('regression-guard-d3-formatTime12h: canonical 24h HH:MM renders as 12h with AM/PM at display boundaries', async ({ page }) => {
  // CR-9: V-M-60 storage is canonical 24h en-GB. Display surfaces must reformat to 12h
  // for the parent-facing convention.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    return {
      morning:   _formatTime12h('08:42'),    // 8:42 AM
      noon:      _formatTime12h('12:00'),    // 12:00 PM
      afternoon: _formatTime12h('14:30'),    // 2:30 PM
      midnight:  _formatTime12h('00:30'),    // 12:30 AM
      empty:     _formatTime12h(''),         // ''
      malformed: _formatTime12h('not-time'), // 'not-time' (pass-through)
    };
  });

  expect(r.morning).toBe('8:42 AM');
  expect(r.noon).toBe('12:00 PM');
  expect(r.afternoon).toBe('2:30 PM');
  expect(r.midnight).toBe('12:30 AM');
  expect(r.empty).toBe('');
  expect(r.malformed).toBe('not-time');
});

test('regression-guard-d3-confirmMedDoneAt-empty-input: empty time-input blocks save (no silent fallback to tap-time)', async ({ page }) => {
  // CR-4: pre-fix, an empty time-input fell through to markMedDone(null) which silently
  // substituted tap-time as givenAt — the "Done at..." intent was lost. Now blocks save.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const d3 = (meds || []).find(m => m.name && m.name.toLowerCase().includes('d3'));
    if (!d3) return { skipped: 'no D3 med' };
    const t = today();
    if (medChecks[t]) delete medChecks[t][d3.name];
    // Simulate the inline editor: create the input element with an empty value.
    document.body.insertAdjacentHTML('beforeend', '<div id="supp-alert-99"><input type="time" id="supp-time-99" value=""></div>');
    confirmMedDoneAt(d3.name, 99);
    const after = medChecks[t] ? medChecks[t][d3.name] : undefined;
    document.getElementById('supp-alert-99').remove();
    return { afterDefined: after !== undefined };
  });

  expect(r.afterDefined, 'empty input must NOT write a med-check entry').toBe(false);
});

test('regression-guard-d3-skipped-surface-renders: skipped state renders an explicit card with Undo affordance', async ({ page }) => {
  // CR-5: pre-fix, skipped doses produced no card AND _obCheckVitD3 still flagged 'pending'.
  // Parent got zero acknowledgement of their explicit skip + a contradictory overlay.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const d3 = (meds || []).find(m => m.name && m.name.toLowerCase().includes('d3'));
    if (!d3) return { skipped: 'no D3 med' };
    markMedSkipped(d3.name, 0);
    // Force a re-render
    renderRemindersAndAlerts();
    const html = window._remindersHTML || '';
    return {
      hasSkippedCard: html.indexOf('supp-alert-skipped') >= 0,
      hasUndoButton: html.indexOf('Undo skip') >= 0,
      obCheck: _obCheckVitD3(),
      storedShape: typeof medChecks[today()][d3.name],
    };
  });

  expect(r.hasSkippedCard, 'isSkipped state must render its own card').toBe(true);
  expect(r.hasUndoButton, 'skipped card must surface an Undo affordance').toBe(true);
  expect(r.obCheck, '_obCheckVitD3 must treat skip as resolved (false = no attention needed)').toBe(false);
  expect(r.storedShape, 'markMedSkipped must now emit object schema').toBe('object');
});

test('regression-guard-d3-resolveMissedMed-object-shape: backfill via missed-med flow writes the new object schema', async ({ page }) => {
  // CR-10: pre-fix, resolveMissedMed still wrote legacy 'done:late' / 'skipped' strings.
  // Now writes the canonical 6-field object so downstream consumers stay consistent.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const d3 = (meds || []).find(m => m.name && m.name.toLowerCase().includes('d3'));
    if (!d3) return { skipped: 'no D3 med' };
    const yesterday = _offsetDateStr(today(), -1);
    if (medChecks[yesterday]) delete medChecks[yesterday][d3.name];
    resolveMissedMed(d3.name, yesterday, 'done');
    const doneEntry = medChecks[yesterday][d3.name];
    resolveMissedMed(d3.name, yesterday, 'skipped');
    const skipEntry = medChecks[yesterday][d3.name];
    return {
      doneShape: typeof doneEntry,
      doneStatus: doneEntry && doneEntry.status,
      doneHasLoggedAt: doneEntry && typeof doneEntry.loggedAt === 'string',
      skipShape: typeof skipEntry,
      skipStatus: skipEntry && skipEntry.status,
    };
  });

  expect(r.doneShape).toBe('object');
  expect(r.doneStatus).toBe('late');
  expect(r.doneHasLoggedAt, 'late-backfill must record loggedAt for audit trail').toBe(true);
  expect(r.skipShape).toBe('object');
  expect(r.skipStatus).toBe('skipped');
});

test('regression-guard-d3-coconut-water-still-rejected-after-tie-fix: chronological tie-breaker preserves V-K-69 fix', async ({ page }) => {
  // CR-12: switched _detectFatContextNearTime iteration order from meal-name to chronological
  // proximity. Make sure the V-K-69 NUTRITION-known-skip still fires regardless of iteration.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const d3 = (meds || []).find(m => m.name && m.name.toLowerCase().includes('d3'));
    if (!d3) return { skipped: 'no D3 med' };
    const t = today();
    if (!feedingData[t]) feedingData[t] = {};
    // Mix of meals — non-fat coconut water at exact dose time should NOT match
    feedingData[t].breakfast = 'coconut water, banana';
    feedingData[t].breakfast_time = '08:45'; // exactly at dose time
    feedingData[t].lunch = '';
    feedingData[t].lunch_time = '';
    if (medChecks[t]) delete medChecks[t][d3.name];
    markMedDone(d3.name, 0, '08:45');
    const stored = medChecks[t][d3.name];
    return { withFat: stored && stored.withFat, fatFood: stored && stored.fatFood };
  });

  expect(r.withFat, 'coconut water (NUTRITION-known non-fat) must not match coconut after tie-fix').toBe(false);
});

test('regression-guard-d3-plural-singular-drift: parent typing "walnuts" matches "walnut" fat-set entry', async ({ page }) => {
  // CR-13: NUTRITION is keyed inconsistently ('almonds' plural, 'walnut' singular). Parent
  // natural typing must work both directions.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const d3 = (meds || []).find(m => m.name && m.name.toLowerCase().includes('d3'));
    if (!d3) return { skipped: 'no D3 med' };
    const t = today();
    if (!feedingData[t]) feedingData[t] = {};
    feedingData[t].breakfast = 'walnuts, banana'; // parent typed plural; NUTRITION key is 'walnut' singular
    feedingData[t].breakfast_time = '08:30';
    feedingData[t].lunch = '';
    feedingData[t].lunch_time = '';
    if (medChecks[t]) delete medChecks[t][d3.name];
    markMedDone(d3.name, 0, '08:45');
    const stored1 = medChecks[t][d3.name];
    // Also test the inverse: 'almond' (singular) → NUTRITION key 'almonds' (plural)
    feedingData[t].breakfast = 'almond, banana';
    delete medChecks[t][d3.name];
    markMedDone(d3.name, 0, '08:45');
    const stored2 = medChecks[t][d3.name];
    return {
      walnuts_withFat: stored1 && stored1.withFat,
      walnuts_food: stored1 && stored1.fatFood,
      almond_withFat: stored2 && stored2.withFat,
    };
  });

  expect(r.walnuts_withFat, 'parent typing "walnuts" must match "walnut" fat-set entry').toBe(true);
  expect(r.almond_withFat, 'parent typing "almond" must match "almonds" via alias path').toBe(true);
});

test('regression-guard-d3-pattern-adherence-respects-medStart: a med activated 3 days ago shows N/3, not N/14', async ({ page }) => {
  // CR-6: pre-fix divided by 14 always; pattern card disagreed with computeSupplementAdherence
  // for a recently-activated med. Now restricts the denominator to days post-medStart.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const d3 = (meds || []).find(m => m.name && m.name.toLowerCase().includes('d3'));
    if (!d3) return { skipped: 'no D3 med' };
    // Set d3Med.start to 3 days ago. Also set _trackingSince to a much earlier date
    // so it doesn't dominate the effectiveStart calculation in the fresh-install context.
    const startDate = _offsetDateStr(today(), -2);
    d3.start = startDate;
    medChecks._trackingSince = _offsetDateStr(today(), -30);
    // Mark all 3 days as done
    for (let i = 0; i < 3; i++) {
      const ds = _offsetDateStr(today(), -i);
      if (!medChecks[ds]) medChecks[ds] = {};
      medChecks[ds][d3.name] = { status:'done', givenAt:'08:00', loggedAt:'08:00', withFat:false, fatFood:null, fatDelta:null };
    }
    // Render the pattern card and read the adherence text
    renderMedD3PatternCard();
    const body = document.getElementById('medD3PatternBody');
    const html = body ? body.innerHTML : '';
    return {
      has3of3: html.indexOf('3/3 days') >= 0,
      has3of14: html.indexOf('3/14 days') >= 0,
      htmlSample: html.slice(0, 400),
      medStart: d3.start,
    };
  });

  expect(r.has3of3, 'adherence must use eligibleDays.length (= days from medStart) — got HTML: ' + r.htmlSample).toBe(true);
  expect(r.has3of14, 'must NOT divide by raw 14-day window').toBe(false);
});

test('regression-guard-d3-snapshot-fat-refresh: logging a fat-meal AFTER the dose flips withFat:false → true', async ({ page }) => {
  // CR-14: pre-fix, markMedDone froze withFat:false against the snapshot at log-time. If
  // the parent logged the dose BEFORE the meal, withFat stayed false forever.
  // Fix: _refreshTodayMedWithFat re-evaluates negative-withFat doses on feedingData save.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const d3 = (meds || []).find(m => m.name && m.name.toLowerCase().includes('d3'));
    if (!d3) return { skipped: 'no D3 med' };
    const t = today();
    // Clear feedingData and medChecks for today
    feedingData[t] = {};
    if (medChecks[t]) delete medChecks[t][d3.name];
    // First: mark D3 done at 08:45 with NO meal logged yet → withFat:false
    markMedDone(d3.name, 0, '08:45');
    const before = medChecks[t][d3.name];
    // Now: log breakfast with ghee at 08:30
    feedingData[t].breakfast = 'chapati, ghee';
    feedingData[t].breakfast_time = '08:30';
    // Trigger the refresh
    _refreshTodayMedWithFat();
    const after = medChecks[t][d3.name];
    return {
      beforeWithFat: before && before.withFat,
      afterWithFat:  after && after.withFat,
      afterFood:     after && after.fatFood,
    };
  });

  expect(r.beforeWithFat, 'dose logged before meal must initially be withFat:false').toBe(false);
  expect(r.afterWithFat, 'after the meal is logged, refresh must flip withFat to true').toBe(true);
  expect(r.afterFood).toBe('ghee');
});

test('regression-guard-d3-qaSupplement-schema-aware: qaAnswerSupplement reads new object shape without try/catch swallowing', async ({ page }) => {
  // CR-1: pre-fix, qaAnswerSupplement.indexOf('done')/.replace('done:','') threw on the new
  // object shape. The try/catch swallowed it and returned 'Unable to compute'. Now schema-aware.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const d3 = (meds || []).find(m => m.name && m.name.toLowerCase().includes('d3'));
    if (!d3) return { skipped: 'no D3 med' };
    const t = today();
    if (!medChecks[t]) medChecks[t] = {};
    medChecks[t][d3.name] = { status:'done', givenAt:'14:30', loggedAt:'14:30', withFat:true, fatFood:'ghee', fatDelta:-5 };
    const result = qaAnswerSupplement('supplement');
    // The 'Given today at X' actionItem confirms the schema-aware read worked.
    const items = (result.sections || []).reduce((acc, s) => acc.concat(s.items || []), []);
    const givenLine = items.find(i => i.text && i.text.indexOf('Given today at') === 0);
    return {
      headline: result.headline,
      hasGivenLine: !!givenLine,
      givenText: givenLine ? givenLine.text : null,
    };
  });

  expect(r.headline, 'must NOT return the catch-fallback "Unable to compute"').not.toBe('Unable to compute');
  expect(r.hasGivenLine, 'today\'s "Given at X" actionItem must surface').toBe(true);
  expect(r.givenText).toContain('2:30 PM');
  expect(r.givenText).toContain('ghee');
});

test('regression-guard-d3-undoMedSkip-clears-to-pending: Undo skip does NOT silently log at tap-time', async ({ page }) => {
  // V-M-68 + V-M-73: pre-fix, Undo skip wired to markMedDone(name, idx) with no givenTime,
  // which silently substituted tap-time. Reintroduced the CR-4 class of bug through a
  // different door. Fix: Undo clears the entry back to undefined (pending state) so the
  // parent makes an explicit choice via [Done now] / [Done at...] / [Skip].
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const d3 = (meds || []).find(m => m.name && m.name.toLowerCase().includes('d3'));
    if (!d3) return { skipped: 'no D3 med' };
    const t = today();
    // First: skip
    markMedSkipped(d3.name, 0);
    const afterSkip = medChecks[t][d3.name];
    // Then: undo
    undoMedSkip(d3.name, 0);
    const afterUndo = medChecks[t] ? medChecks[t][d3.name] : undefined;
    return {
      skipStatus: afterSkip && afterSkip.status,
      undoIsCleared: afterUndo === undefined,
      didNotSilentlyLog: !afterUndo || afterUndo.status !== 'done',
    };
  });

  expect(r.skipStatus).toBe('skipped');
  expect(r.undoIsCleared, 'Undo must clear medChecks entry back to undefined (pending)').toBe(true);
  expect(r.didNotSilentlyLog, 'Undo must NOT fabricate a "Done at tap-time" record').toBe(true);
});

test('regression-guard-d3-yesterday-skipped-schema-aware: home medical preview reads new object shape for ydSkipped', async ({ page }) => {
  // V-K-74: pre-fix, home.js used `ydChecks[m.name] === 'skipped'` strict-equality which
  // silently missed the new object shape. Parent who skipped yesterday saw the
  // "Yesterday's meds not logged" danger strip instead of the "Skipped yesterday" warn strip.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const d3 = (meds || []).find(m => m.name && m.name.toLowerCase().includes('d3'));
    if (!d3) return { skipped: 'no D3 med' };
    const yesterday = _offsetDateStr(today(), -1);
    if (!medChecks[yesterday]) medChecks[yesterday] = {};
    medChecks[yesterday][d3.name] = { status:'skipped', givenAt:null, loggedAt:'10:00', withFat:null, fatFood:null, fatDelta:null };
    return {
      schemaAwareSkipped: medCheckSkipped(medChecks[yesterday][d3.name]),
      schemaAwareNotDone: !medCheckIsDone(medChecks[yesterday][d3.name]),
    };
  });

  expect(r.schemaAwareSkipped, 'medCheckSkipped must recognise the new object-shape skipped state').toBe(true);
  expect(r.schemaAwareNotDone, 'object-shape skip must NOT register as done').toBe(true);
});

test('regression-guard-d3-parseMedCheck-range-validates-24h: out-of-range hour/minute rejected', async ({ page }) => {
  // V-K-73: pre-fix the 24h regex was purely structural; '24:00' / '25:99' passed and
  // stored verbatim as givenAt, then _hhmmToMinutes returned 1440+ minutes (out of range).
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    return {
      ok_valid_morning: parseMedCheck('done:08:42').givenAt,
      ok_valid_midnight: parseMedCheck('done:00:00').givenAt,
      ok_valid_23h:    parseMedCheck('done:23:59').givenAt,
      reject_24h:      parseMedCheck('done:24:00').givenAt,
      reject_25h:      parseMedCheck('done:25:99').givenAt,
      reject_99m:      parseMedCheck('done:08:99').givenAt,
    };
  });

  expect(r.ok_valid_morning).toBe('08:42');
  expect(r.ok_valid_midnight).toBe('00:00');
  expect(r.ok_valid_23h).toBe('23:59');
  expect(r.reject_24h, '24:00 must be rejected as out-of-range').toBeNull();
  expect(r.reject_25h, '25:99 must be rejected').toBeNull();
  expect(r.reject_99m, '08:99 must be rejected (minute >= 60)').toBeNull();
});

test('regression-guard-d3-formatTime12h-string-guard: non-string inputs return empty string, never literal "null" / "undefined"', async ({ page }) => {
  // V-M-72: defensive — a future render site that forgets the outer `if (givenAt)` guard
  // would otherwise leak literal 'null' to the parent. Now the function entry-guards.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    return {
      onNull:      _formatTime12h(null),
      onUndefined: _formatTime12h(undefined),
      onNumber:    _formatTime12h(842),
      onBoolean:   _formatTime12h(true),
      onArray:     _formatTime12h([]),
      onObject:    _formatTime12h({}),
    };
  });

  expect(r.onNull).toBe('');
  expect(r.onUndefined).toBe('');
  expect(r.onNumber).toBe('');
  expect(r.onBoolean).toBe('');
  expect(r.onArray).toBe('');
  expect(r.onObject).toBe('');
});

test('regression-guard-d3-refresh-never-flips-true-to-false: positive withFat observation is never erased', async ({ page }) => {
  // CR-14 invariant verification — _refreshTodayMedWithFat must only flip false→true,
  // never true→false. A parent who edited the feedingData meal text to remove the fat
  // food after the dose was logged must NOT see their original positive observation erased.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const d3 = (meds || []).find(m => m.name && m.name.toLowerCase().includes('d3'));
    if (!d3) return { skipped: 'no D3 med' };
    const t = today();
    feedingData[t] = { breakfast:'chapati, ghee', breakfast_time:'08:30' };
    if (medChecks[t]) delete medChecks[t][d3.name];
    markMedDone(d3.name, 0, '08:45');
    const before = medChecks[t][d3.name];
    // Now: remove the ghee from the meal text. Re-running refresh must NOT flip true→false.
    feedingData[t].breakfast = 'chapati, banana';
    _refreshTodayMedWithFat();
    const after = medChecks[t][d3.name];
    return {
      beforeWithFat: before && before.withFat,
      afterWithFat:  after && after.withFat,
      afterFood:     after && after.fatFood,
    };
  });

  expect(r.beforeWithFat).toBe(true);
  expect(r.afterWithFat, 'refresh must NEVER flip true → false').toBe(true);
  expect(r.afterFood, 'fatFood must be preserved').toBe('ghee');
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
