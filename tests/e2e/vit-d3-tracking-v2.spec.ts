import { test, expect } from '@playwright/test';

// Vit D3 Tracking v2 — Tier 1 regression guards.
// Spec: docs/specs/vit-d3-tracking-v2.md.
// Backlog: docs/specs/vit-d3-tracking-v2-backlog.md §Tier 1.
// QA chain canon-cc-008: Maren + Kael + Vela Mode-1 parallel → Lyra synth → Cipher Edict V.

// ── T1-1 ─────────────────────────────────────────────────────────────────────
test('regression-guard-d3-v2-t1-1: adjustMedTime preserves positive withFat across time edits', async ({ page }) => {
  // Trigger: parent logs at 08:45 with paratha (withFat:true). Later deletes the paratha
  // from feedingData. Taps Adjust on the dose for any reason. The pre-T1-1 path overwrites
  // withFat:true → false because re-detection at the new time sees no fat-food.
  // T1-1 extends CR-14 ("never erase a positive observation") to the user-initiated path.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const d3 = (meds || []).find(m => m.name && m.name.toLowerCase().includes('d3'));
    if (!d3) return { skipped: 'no D3 med' };
    const t = today();
    if (!feedingData[t]) feedingData[t] = {};
    feedingData[t].breakfast = 'paratha';
    feedingData[t].breakfast_time = '08:30';
    feedingData[t].lunch = '';
    feedingData[t].lunch_time = '';
    if (medChecks[t]) delete medChecks[t][d3.name];
    // Log at 08:45 — should detect paratha as fat pairing.
    markMedDone(d3.name, 0, '08:45');
    const before = medChecks[t][d3.name];
    // Parent deletes the meal text. Then taps Adjust (changing time to 08:50, say).
    feedingData[t].breakfast = '';
    feedingData[t].breakfast_time = '';
    adjustMedTime(d3.name, 0, '08:50');
    const after = medChecks[t][d3.name];
    return {
      beforeWithFat: before && before.withFat,
      beforeFood:    before && before.fatFood,
      afterGivenAt:  after && after.givenAt,
      afterWithFat:  after && after.withFat,
      afterFood:     after && after.fatFood,
    };
  });

  expect(r.beforeWithFat).toBe(true);
  expect(r.beforeFood).toBe('paratha');
  expect(r.afterGivenAt, 'Adjust must update givenAt').toBe('08:50');
  expect(r.afterWithFat, 'T1-1: Adjust must NOT erase a positive withFat observation').toBe(true);
  expect(r.afterFood, 'T1-1: original fatFood must be preserved').toBe('paratha');
});

// ── T1-2 ─────────────────────────────────────────────────────────────────────
test('regression-guard-d3-v2-t1-2-sync: medChecks renderer list includes renderMedD3PatternCard', async ({ page }) => {
  // The sync push for medChecks pre-fix fired only renderMedicalStats; pattern card stayed
  // stale on device B when device A pushed an updated dose. T1-2 adds the pattern card to
  // the renderers list at sync.js:229.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const reg = (typeof SYNC_RENDER_DEPS === 'object') ? SYNC_RENDER_DEPS : null;
    if (!reg) return { skipped: 'SYNC_RENDER_DEPS not exposed' };
    const entry = reg[KEYS.medChecks];
    return {
      hasEntry: !!entry,
      renderersList: entry && entry.renderers && entry.renderers['track:medical'],
      hasStats:   entry && entry.renderers && entry.renderers['track:medical'] && entry.renderers['track:medical'].includes('renderMedicalStats'),
      hasPattern: entry && entry.renderers && entry.renderers['track:medical'] && entry.renderers['track:medical'].includes('renderMedD3PatternCard'),
    };
  });

  if ((r as any).skipped) {
    test.skip(true, (r as any).skipped);
    return;
  }
  expect(r.hasEntry).toBe(true);
  expect(r.hasStats, 'renderMedicalStats must remain in the renderers list').toBe(true);
  expect(r.hasPattern, 'T1-2: renderMedD3PatternCard must be added to the renderers list').toBe(true);
});

test('regression-guard-d3-v2-t1-2-tabswitch: medical tab dispatcher calls renderMedD3PatternCard', async ({ page }) => {
  // Pre-T1-2, the medical tab-switch dispatcher fired renderMedicalStats but NOT renderMeds,
  // and renderMedD3PatternCard's only invocation site was inside renderMeds. Tab-switching
  // back to medical after taking action elsewhere left the pattern card body stale.
  // T1-2 adds an explicit renderMedD3PatternCard() call to the medical sub-tab dispatcher.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    // Spy on renderMedD3PatternCard. switchTab('medical') redirects to track-tab then
    // invokes switchTrackSub('medical') which contains the T1-2 dispatcher call.
    let callCount = 0;
    const original = (window as any).renderMedD3PatternCard;
    (window as any).renderMedD3PatternCard = function() { callCount++; return original ? original.apply(this, arguments) : undefined; };
    if (typeof switchTab === 'function') switchTab('medical');
    const result = { callCount };
    (window as any).renderMedD3PatternCard = original;
    return result;
  });

  expect(r.callCount, 'T1-2: medical tab dispatcher must invoke renderMedD3PatternCard at least once').toBeGreaterThanOrEqual(1);
});

// ── T1-3 ─────────────────────────────────────────────────────────────────────
test('regression-guard-d3-v2-t1-3: skipped med events surface in TSF timeline at loggedAt', async ({ page }) => {
  // Pre-fix: _tsfCollectEvents pushed only when timeMin !== null (events branch) OR
  // status !== 'skipped' (noTimeEvents branch). Skipped doses (timeMin null AND status
  // skipped) hit neither — CR-10's loggedAt audit trail was invisible on TSF.
  // T1-3 routes skipped-with-loggedAt to the events branch at its loggedAt time.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const d3 = (meds || []).find(m => m.name && m.name.toLowerCase().includes('d3'));
    if (!d3) return { skipped: 'no D3 med' };
    const t = today();
    if (!medChecks[t]) medChecks[t] = {};
    // Directly seed a skipped record with a specific loggedAt so the assertion is deterministic.
    medChecks[t][d3.name] = { status:'skipped', givenAt:null, loggedAt:'09:15', withFat:null, fatFood:null, fatDelta:null };
    if (typeof _tsfMarkDirty === 'function') _tsfMarkDirty();
    const collected = _tsfCollectEvents();
    const medEv = collected.events.find(e => e.type === 'med' && e.label === d3.name);
    const medNoTime = collected.noTimeEvents.find(e => e.type === 'med' && e.label === d3.name);
    return {
      eventsHasMed: !!medEv,
      noTimeHasMed: !!medNoTime,
      medEvTimeMin: medEv && medEv.timeMin,
      medEvTime: medEv && medEv.time,
      medEvDetail: medEv && medEv.detail,
    };
  });

  expect(r.eventsHasMed, 'T1-3: skipped med must appear in the chronological events list').toBe(true);
  expect(r.noTimeHasMed, 'T1-3: skipped med must NOT appear in the noTimeEvents fallback').toBeFalsy();
  expect(r.medEvTimeMin, 'T1-3: timeMin derived from loggedAt 09:15').toBe(9 * 60 + 15);
  expect(r.medEvTime, 'T1-3: time derived from loggedAt').toBe('09:15');
  expect(r.medEvDetail, 'T1-3: detail string remains "Skipped" (the pre-existing chip label)').toBe('Skipped');
});

// ── T1-4 ─────────────────────────────────────────────────────────────────────
test('regression-guard-d3-v2-t1-4: _refreshTodayMedWithFat triggers re-renders on mutation', async ({ page }) => {
  // V-V-13 advisory: helper mutates medChecks AND dirties caches but used to skip render.
  // T1-4 appends render calls inside the `if (mutated)` block.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const d3 = (meds || []).find(m => m.name && m.name.toLowerCase().includes('d3'));
    if (!d3) return { skipped: 'no D3 med' };
    const t = today();
    // No fat-food yet → markMedDone records withFat:false.
    if (!feedingData[t]) feedingData[t] = {};
    feedingData[t].breakfast = '';
    feedingData[t].breakfast_time = '';
    if (medChecks[t]) delete medChecks[t][d3.name];
    markMedDone(d3.name, 0, '09:00');
    const before = medChecks[t][d3.name];
    // Add ghee breakfast retroactively. Spy on the render functions before the flip.
    feedingData[t].breakfast = 'chapati, ghee';
    feedingData[t].breakfast_time = '09:15';
    let reminderCalls = 0, contextCalls = 0, patternCalls = 0;
    const orig1 = (window as any).renderRemindersAndAlerts;
    const orig2 = (window as any).renderHomeContextAlerts;
    const orig3 = (window as any).renderMedD3PatternCard;
    (window as any).renderRemindersAndAlerts  = function() { reminderCalls++; };
    (window as any).renderHomeContextAlerts   = function() { contextCalls++; };
    (window as any).renderMedD3PatternCard    = function() { patternCalls++; };
    const mutated = _refreshTodayMedWithFat();
    (window as any).renderRemindersAndAlerts  = orig1;
    (window as any).renderHomeContextAlerts   = orig2;
    (window as any).renderMedD3PatternCard    = orig3;
    const after = medChecks[t][d3.name];
    return {
      beforeWithFat: before && before.withFat,
      mutated:       mutated,
      afterWithFat:  after && after.withFat,
      reminderCalls, contextCalls, patternCalls,
    };
  });

  expect(r.beforeWithFat).toBe(false);
  expect(r.mutated, 'helper must report mutation').toBe(true);
  expect(r.afterWithFat, 'flip false → true on retroactive fat-meal').toBe(true);
  expect(r.reminderCalls, 'T1-4: renderRemindersAndAlerts fires on flip').toBeGreaterThanOrEqual(1);
  expect(r.contextCalls,  'T1-4: renderHomeContextAlerts fires on flip').toBeGreaterThanOrEqual(1);
  expect(r.patternCalls,  'T1-4: renderMedD3PatternCard fires on flip').toBeGreaterThanOrEqual(1);
});

// ── T1-5 ─────────────────────────────────────────────────────────────────────
test('regression-guard-d3-v2-t1-5: ISL range summary formats D3 time in 12h', async ({ page }) => {
  // Pre-fix: _islRangeSummary interpolated md.d3Times[0] verbatim ("Vit D3 given at 14:30").
  // CR-9's _formatTime12h sweep missed this site. Every other surface renders "2:30 PM".
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const d3 = (meds || []).find(m => m.name && m.name.toLowerCase().includes('d3'));
    if (!d3) return { skipped: 'no D3 med' };
    const t = today();
    if (!medChecks[t]) medChecks[t] = {};
    medChecks[t][d3.name] = { status:'done', givenAt:'14:30', loggedAt:'14:32', withFat:false, fatFood:null, fatDelta:null };
    if (typeof _islMarkDirty === 'function') _islMarkDirty('medical');
    // _islGenerateHighlights is the patched site; _islBuildDaySummary is its caller.
    const summary = (typeof _islBuildDaySummary === 'function') ? _islBuildDaySummary(t) : null;
    let medText = null;
    if (summary && summary.highlights) {
      const h = summary.highlights.find(x => x.domain === 'medical');
      medText = h && h.text;
    }
    return { medText };
  });

  expect(r.medText, 'medical highlight must exist').toBeTruthy();
  expect(r.medText, 'T1-5: time must render in 12h, not 24h').toContain('PM');
  expect(r.medText, 'T1-5: 14:30 → 2:30 PM').toContain('2:30');
  expect(r.medText, 'T1-5: 24h leak guard').not.toContain('14:30');
});

// ── T1-6 ─────────────────────────────────────────────────────────────────────
// Note: the existing v1 test `regression-guard-d3-undoMedSkip-reads-as-pending` covers
// the round-trip skip → undo → cleared-sentinel + parseMedCheck-returns-null assertion.
// This v2 test covers the T3-14 prerequisite: pending-filter sites must read cleared as
// pending (the raw truthy-check would otherwise silently exclude undone-skips from the
// today-pending list and the medsPending count).
test('regression-guard-d3-v2-t1-6-t3-14: pending filters treat cleared sentinel as pending', async ({ page }) => {
  // After T1-6, an undone skip leaves a `cleared` sentinel (truthy object) in medChecks.
  // home.js:6664 (pending list display) and medical.js:2306 (medsPending count) used raw
  // truthy-check (`!todayChecks[m.name]`) which would have silently excluded the med. The
  // T3-14 fix replaces with `!medCheckIsDone() && !medCheckSkipped()` — both helpers
  // route through parseMedCheck which returns null for cleared, so the negation is true.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const d3 = (meds || []).find(m => m.name && m.name.toLowerCase().includes('d3'));
    if (!d3) return { skipped: 'no D3 med' };
    const t = today();
    if (!medChecks[t]) medChecks[t] = {};
    // Seed a cleared sentinel directly (as undoMedSkip would have left it).
    medChecks[t][d3.name] = {
      status:'cleared', givenAt:null, loggedAt:null, withFat:null, fatFood:null, fatDelta:null,
      priorStatus:'skipped', priorLoggedAt:'09:00', clearedAt:'09:05',
    };
    return {
      isDone:    medCheckIsDone(medChecks[t][d3.name]),
      isSkipped: medCheckSkipped(medChecks[t][d3.name]),
      parsedIsNull: parseMedCheck(medChecks[t][d3.name]) === null,
      // The helper combination used at home.js:6664 and medical.js:2306 post-T3-14
      readsAsPending: !medCheckIsDone(medChecks[t][d3.name]) && !medCheckSkipped(medChecks[t][d3.name]),
    };
  });

  expect(r.isDone, 'cleared is not done').toBe(false);
  expect(r.isSkipped, 'cleared is not skipped (parent undid it)').toBe(false);
  expect(r.parsedIsNull, 'parseMedCheck returns null for cleared').toBe(true);
  expect(r.readsAsPending, 'T3-14: combined helper check correctly classifies cleared as pending').toBe(true);
});
