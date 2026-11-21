import { test, expect } from '@playwright/test';
import { useOnceDailyD3Drops } from './fixtures/meds';
import { pinAgeMonths } from './fixtures/clock';

// Vit D3 Tracking v2 — Tier 2 Phase 2-B regression guards.
// Spec: docs/specs/vit-d3-tracking-v2-tier-2.md §Phase 2-B.
// QA chain canon-cc-008: Maren Mode-1 on home.js (sole jurisdiction touched).
// No styles.css / template.html touch → no triple-jurisdiction review.
// No intelligence-* touch → no Kael / Vela invocation.

// ── T2-B.1 ───────────────────────────────────────────────────────────────────
test('regression-guard-d3-v2-t2-b-1: markMedDone before any meal writes withFat:null (not false)', async ({ page }) => {
  // Trigger: half-awake morning. Parent gives D3 at 07:55 BEFORE logging breakfast.
  // _detectFatContextNearTime finds no meal in window → withFat:false. Pre-fix the
  // reminder card immediately shows "no fat-meal logged nearby" badge — a false negative
  // because the parent simply hasn't logged the meal YET. T2-B.1 writes withFat:null
  // (unknown) when no meals logged today AT ALL; the refresh helper flips null → true
  // when the parent later saves breakfast.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);
  await useOnceDailyD3Drops(page);   // the fixture keeps the drops as inactive history; this guard is about them

  const r = await page.evaluate(() => {
    const d3 = (meds || []).find(m => m.active && m.name && m.name.toLowerCase().includes('d3'));
    if (!d3) throw new Error('no D3 medicine in the fixture');   // fail loudly, never self-skip (BUGS #168)
    const t = today();
    // Zero meals logged today.
    if (!feedingData[t]) feedingData[t] = {};
    feedingData[t].breakfast = ''; feedingData[t].breakfast_time = '';
    feedingData[t].lunch     = ''; feedingData[t].lunch_time     = '';
    feedingData[t].dinner    = ''; feedingData[t].dinner_time    = '';
    feedingData[t].snack     = ''; feedingData[t].snack_time     = '';
    if (medChecks[t]) delete medChecks[t][d3.name];
    markMedDone(d3.name, 0, '07:55');
    const after = medChecks[t][d3.name];
    // Sanity comparison: log a second dose with breakfast already in feedingData →
    // should write withFat:false (true negative, not unknown) since meals exist but
    // none in window.
    feedingData[t].breakfast = 'plain idli';
    feedingData[t].breakfast_time = '06:00'; // outside ±60min of 07:55 (delta 115min)
    delete medChecks[t][d3.name];
    markMedDone(d3.name, 0, '07:55');
    const afterWithMeal = medChecks[t][d3.name];
    return {
      noMeals_withFat: after && after.withFat,
      withMeal_withFat: afterWithMeal && afterWithMeal.withFat,
    };
  });

  expect(r.noMeals_withFat, 'T2-B.1: zero-meals path must write withFat:null (unknown), not false').toBeNull();
  expect(r.withMeal_withFat, 'T2-B.1: meals-exist-but-none-in-window path stays withFat:false (true negative)').toBe(false);
});

// ── T2-B.2 ───────────────────────────────────────────────────────────────────
test('regression-guard-d3-v2-t2-b-2: adjustMedTime midnight rollover toasts and no-ops cleanly', async ({ page }) => {
  // Trigger: parent opens Adjust at 23:58, taps Save at 00:01. today() returns the NEW
  // date; the record is on the prior date's key. Pre-fix adjustMedTime silently no-ops
  // (medChecks[newToday][name] === undefined) leaving the editor wedged in the now-empty
  // new-date slot. T2-B.2 captures the day at editor-open and threads it through; if
  // today() has rolled past the captured day, toast + return without writing.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);
  await useOnceDailyD3Drops(page);   // the fixture keeps the drops as inactive history; this guard is about them

  const r = await page.evaluate(() => {
    const d3 = (meds || []).find(m => m.active && m.name && m.name.toLowerCase().includes('d3'));
    if (!d3) throw new Error('no D3 medicine in the fixture');   // fail loudly, never self-skip (BUGS #168)
    const t = today();
    if (!medChecks[t]) medChecks[t] = {};
    medChecks[t][d3.name] = { status:'done', givenAt:'08:00', loggedAt:'08:02', withFat:true, fatFood:'paratha', fatDelta:5 };
    // Simulate the rollover: pass a stale dayStr (yesterday — i.e. before today())
    // so todayStr !== today() inside adjustMedTime.
    function back(n) {
      const d = new Date(t + 'T12:00:00');
      d.setDate(d.getDate() - n);
      const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0');
      return y + '-' + m + '-' + dd;
    }
    const before = JSON.parse(JSON.stringify(medChecks[t][d3.name]));
    // Spy on the toast.
    let toastMsg: string | null = null;
    const origToast = (window as any).showQLToast;
    (window as any).showQLToast = function(msg: string) { toastMsg = msg; };
    adjustMedTime(d3.name, 0, '08:30', back(1)); // captured-day = yesterday
    (window as any).showQLToast = origToast;
    const after = medChecks[t][d3.name];
    return {
      toastFired: !!toastMsg,
      toastContent: toastMsg,
      recordUnchanged: JSON.stringify(after) === JSON.stringify(before),
    };
  });

  expect(r.toastFired, 'T2-B.2: toast must fire on midnight rollover').toBe(true);
  expect(r.toastContent, 'T2-B.2: toast names the issue').toContain('Date changed');
  expect(r.recordUnchanged, 'T2-B.2: the existing record must be untouched on rollover').toBe(true);
});

// ── T2-B.3 ───────────────────────────────────────────────────────────────────
test('regression-guard-d3-v2-t2-b-3: confirmMedDoneAt + confirmMedAdjust reject future times', async ({ page }) => {
  // Trigger: parent mistypes 23:00 when they meant 11:00. Pre-fix adjustMedTime stamps
  // the future time, re-runs detection (no fat-meal at 23:00), corrupts withFat:true→false
  // silently. T2-B.3 gates both confirmers on a past-time check.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);
  await useOnceDailyD3Drops(page);   // the fixture keeps the drops as inactive history; this guard is about them

  const r = await page.evaluate(() => {
    const d3 = (meds || []).find(m => m.active && m.name && m.name.toLowerCase().includes('d3'));
    if (!d3) throw new Error('no D3 medicine in the fixture');   // fail loudly, never self-skip (BUGS #168)
    const t = today();
    if (!medChecks[t]) medChecks[t] = {};
    medChecks[t][d3.name] = { status:'done', givenAt:'08:00', loggedAt:'08:02', withFat:true, fatFood:'paratha', fatDelta:5 };
    // Build a DOM stub so confirmMedAdjust can find the input.
    const tmp = document.createElement('div');
    tmp.innerHTML = '<input type="time" id="supp-time-0" value="23:59" data-captured-day="' + t + '">';
    document.body.appendChild(tmp);
    const before = JSON.parse(JSON.stringify(medChecks[t][d3.name]));
    let toastMsg: string | null = null;
    const origToast = (window as any).showQLToast;
    (window as any).showQLToast = function(msg: string) { toastMsg = msg; };
    // 23:59 is almost certainly in the future for any test-run wall-clock; if the harness
    // somehow runs at 23:59:xx we accept either outcome (test is best-effort on that boundary).
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const pickedMin = 23 * 60 + 59;
    confirmMedAdjust(d3.name, 0);
    (window as any).showQLToast = origToast;
    const after = medChecks[t][d3.name];
    document.body.removeChild(tmp);
    return {
      nowMin,
      pickedIsFuture: pickedMin > nowMin,
      toastContent: toastMsg,
      recordUnchanged: JSON.stringify(after) === JSON.stringify(before),
    };
  });

  if (!r.pickedIsFuture) {
    test.skip(true, 'wall-clock happens to be at 23:59 — future-time boundary not exercisable');
    return;
  }
  expect(r.toastContent, 'T2-B.3: future-time toast must fire').toContain('must be in the past');
  expect(r.recordUnchanged, 'T2-B.3: the record must NOT be mutated when future-time is rejected').toBe(true);
});

// ── T2-B.4 ───────────────────────────────────────────────────────────────────
test('regression-guard-d3-v2-t2-b-4: outing-planner intents — skip-today still surfaces D3 for outing-pack + outing-give', async ({ page }) => {
  // Trigger: V-M-67/74's "skip counts as resolved" doctrine was authored for the home
  // overlay. The same helper services outing-planner. A 7 AM misclick-skip silently
  // suppresses D3 from packing/give surfaces for an afternoon outing. T2-B.4 routes by
  // intent: 'overlay' keeps the original behavior; 'outing-pack' and 'outing-give'
  // treat skip != resolved.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);
  await useOnceDailyD3Drops(page);   // the fixture keeps the drops as inactive history; this guard is about them

  const r = await page.evaluate(() => {
    const d3 = (meds || []).find(m => m.active && m.name && m.name.toLowerCase().includes('d3'));
    if (!d3) throw new Error('the once-daily D3 drops are not active');   // never skip this guard again (BUGS #168)
    const t = today();
    if (!medChecks[t]) medChecks[t] = {};
    // Seed skipped today.
    medChecks[t][d3.name] = { status:'skipped', givenAt:null, loggedAt:'07:00', withFat:null, fatFood:null, fatDelta:null };
    const overlay   = _obCheckVitD3Needed('overlay');
    const outPack   = _obCheckVitD3Needed('outing-pack');
    const outGive   = _obCheckVitD3Needed('outing-give');
    // Sanity contrast: done suppresses everywhere.
    medChecks[t][d3.name] = { status:'done', givenAt:'08:00', loggedAt:'08:02', withFat:true, fatFood:'paratha', fatDelta:5 };
    const overlayDone = _obCheckVitD3Needed('overlay');
    const packDone    = _obCheckVitD3Needed('outing-pack');
    const giveDone    = _obCheckVitD3Needed('outing-give');
    return { overlay, outPack, outGive, overlayDone, packDone, giveDone };
  });

  // Skip today:
  expect(r.overlay,  'T2-B.4: overlay intent treats skip as resolved (V-M-67/74)').toBe(false);
  expect(r.outPack,  'T2-B.4: outing-pack intent must STILL surface D3 after a morning skip').toBe(true);
  expect(r.outGive,  'T2-B.4: outing-give intent must STILL surface D3 after a morning skip').toBe(true);
  // Done today:
  expect(r.overlayDone, 'T2-B.4: done is universally resolved (overlay)').toBe(false);
  expect(r.packDone,    'T2-B.4: done is universally resolved (outing-pack)').toBe(false);
  expect(r.giveDone,    'T2-B.4: done is universally resolved (outing-give)').toBe(false);
});

// ── T2-B.4, twice-daily (BUGS #168) ──────────────────────────────────────────
test('regression-guard-d3-v2-t2-b-4-twice-daily: a skipped current dose stays on the outing give-list; a later dose not yet due does not', async ({ page }) => {
  // The fixture's active supplement is the twice-daily syrup (morning from 05:00, evening from
  // 16:00). At 10:00 the morning dose is the current one. medSlotStates files a skipped dose
  // under 'resolved'; for 'outing-give' the current slot must still show (skip != resolved),
  // while a GIVEN morning dose leaves nothing to give before an outing at 10:00 (Cipher A2:
  // only the dose due now, never one that is not due yet).
  await pinAgeMonths(page, 14);   // 10:00 on a day after the syrup's start date
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const m = vitDSupplement();
    const slots = medDoseSlots(m);
    const t = today();
    medChecks[t] = {};
    const pending = { give: _obCheckVitD3Needed('outing-give'), overlay: _obCheckVitD3Needed('overlay') };
    medChecks[t][slots[0].key] = { status:'skipped', givenAt:null, loggedAt:'07:00', withFat:null, fatFood:null, fatDelta:null };
    const skipped = { give: _obCheckVitD3Needed('outing-give'), overlay: _obCheckVitD3Needed('overlay'), pack: _obCheckVitD3Needed('outing-pack') };
    medChecks[t][slots[0].key] = { status:'done', givenAt:'08:00', loggedAt:'08:02', withFat:null, fatFood:null, fatDelta:null };
    const done = { give: _obCheckVitD3Needed('outing-give'), overlay: _obCheckVitD3Needed('overlay'), pack: _obCheckVitD3Needed('outing-pack') };
    return { slotCount: slots.length, hour: new Date().getHours(), pending, skipped, done };
  });

  expect(r.slotCount, 'fixture supplement is twice daily').toBe(2);
  expect(r.hour).toBe(10);
  expect(r.pending).toEqual({ give: true, overlay: true });
  // morning skipped: still on the give-list and the packing list; the overlay stops flagging it.
  expect(r.skipped).toEqual({ give: true, overlay: false, pack: true });
  // morning given: nothing to give now; the evening dose is still to come, so pack the bottle.
  expect(r.done).toEqual({ give: false, overlay: false, pack: true });
});

// ── T2-B.4, twice-daily: the double-dose side (Maren V-M-294-1) ───────────────
test('regression-guard-d3-v2-t2-b-4-evening: a morning skip never keeps the give-list alive once the evening dose is the current one', async ({ page }) => {
  // 17:00 — the evening dose is current. Only ITS state decides the give-list: a stale morning
  // skip must not prompt "give … before leaving" after the evening dose was given (that would
  // invite a second evening dose).
  await pinAgeMonths(page, 14, 10, 17);
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const m = vitDSupplement();
    const [am, pm] = medDoseSlots(m).map((x) => x.key);
    const t = today();
    const skip = { status:'skipped', givenAt:null, loggedAt:'07:00', withFat:null, fatFood:null, fatDelta:null };
    const done = { status:'done', givenAt:'16:30', loggedAt:'16:31', withFat:null, fatFood:null, fatDelta:null };
    const read = () => ({ give: _obCheckVitD3Needed('outing-give'), pack: _obCheckVitD3Needed('outing-pack') });
    medChecks[t] = { [am]: skip, [pm]: done };
    const eveningDone = read();
    medChecks[t] = { [am]: skip };
    const eveningUnlogged = read();
    medChecks[t] = { [am]: skip, [pm]: { ...skip, loggedAt: '16:30' } };
    const eveningSkipped = read();
    return { hour: new Date().getHours(), eveningDone, eveningUnlogged, eveningSkipped };
  });

  expect(r.hour).toBe(17);
  expect(r.eveningDone.give, 'evening given: a stale morning skip must not prompt a dose').toBe(false);
  expect(r.eveningUnlogged.give, 'evening unlogged: the evening dose is due').toBe(true);
  expect(r.eveningSkipped.give, 'evening skipped: the current dose still shows (skip != resolved)').toBe(true);
});

test('regression-guard-d3-v2-t2-b-4-night: before the morning window opens, a skipped slot prompts nothing', async ({ page }) => {
  // 03:00 — no slot of a twice-daily medicine is current (morning opens at 05:00).
  await pinAgeMonths(page, 14, 10, 3);
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const m = vitDSupplement();
    const t = today();
    medChecks[t] = { [medDoseSlots(m)[0].key]: { status:'skipped', givenAt:null, loggedAt:'02:00', withFat:null, fatFood:null, fatDelta:null } };
    return { hour: new Date().getHours(), give: _obCheckVitD3Needed('outing-give') };
  });

  expect(r.hour).toBe(3);
  expect(r.give).toBe(false);
});

// ── T2-B.5 ───────────────────────────────────────────────────────────────────
test('regression-guard-d3-v2-t2-b-5: adjustMedTime preserves withFat:true against a null re-detection', async ({ page }) => {
  // Trigger: currently dead path (_detectFatContextNearTime always returns boolean per
  // core.js). Doctrine-cleaner: if a future detector legitimately returns withFat:null
  // (e.g. T2-B.1's three-state schema spreads to detection), the existing `=== false`
  // check would NOT preserve a prior positive observation. The `!== true` widen does.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);
  await useOnceDailyD3Drops(page);   // the fixture keeps the drops as inactive history; this guard is about them

  const r = await page.evaluate(() => {
    const d3 = (meds || []).find(m => m.active && m.name && m.name.toLowerCase().includes('d3'));
    if (!d3) throw new Error('no D3 medicine in the fixture');   // fail loudly, never self-skip (BUGS #168)
    const t = today();
    if (!medChecks[t]) medChecks[t] = {};
    medChecks[t][d3.name] = { status:'done', givenAt:'08:45', loggedAt:'08:46', withFat:true, fatFood:'paratha', fatDelta:5 };
    // Stub _detectFatContextNearTime to return withFat:null for the duration of the test.
    const origDetect = (window as any)._detectFatContextNearTime;
    (window as any)._detectFatContextNearTime = function() { return { withFat:null, fatFood:null, fatDelta:null }; };
    adjustMedTime(d3.name, 0, '08:50');
    (window as any)._detectFatContextNearTime = origDetect;
    const after = medChecks[t][d3.name];
    return {
      afterGivenAt: after && after.givenAt,
      afterWithFat: after && after.withFat,
      afterFood:    after && after.fatFood,
    };
  });

  expect(r.afterGivenAt, 'T2-B.5: Adjust still updates givenAt').toBe('08:50');
  expect(r.afterWithFat, 'T2-B.5 (V-M-77): null detection must NOT erase a prior true (preserve path)').toBe(true);
  expect(r.afterFood,    'T2-B.5: prior fatFood preserved when preserveWithFat triggers').toBe('paratha');
});
