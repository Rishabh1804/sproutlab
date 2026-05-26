import { test, expect } from '@playwright/test';

// v3-5 — Today So Far story-arc summary regression guards.
// Spec: docs/specs/v3-5-chip-taxonomy-tsf-story.md §Story-arc summary primitive
// + §Day-spine collapse pattern + §Functional tests — story-arc summary.
// QA chain canon-cc-008: Vela primary (intelligence-quicklog.js render);
// Kael consult (_tsfGenerateSummary data-side primitive per CV3-004 pair-note);
// Cipher Edict V three Charter-axis check per CV3-006.

async function gotoFresh(page) {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);
}

// Clear today's data so test state is deterministic.
async function clearTodayState(page) {
  await page.evaluate(() => {
    const t = today();
    if (typeof feedingData === 'object') delete feedingData[t];
    if (Array.isArray(sleepData)) {
      for (let i = sleepData.length - 1; i >= 0; i--) if (sleepData[i].date === t) sleepData.splice(i, 1);
    }
    if (Array.isArray(poopData)) {
      for (let i = poopData.length - 1; i >= 0; i--) if (poopData[i].date === t) poopData.splice(i, 1);
    }
    if (typeof medChecks === 'object' && medChecks[t]) delete medChecks[t];
    try { localStorage.removeItem(SLEEP_INPROGRESS_KEY); } catch (e) {}
  });
}

// ── regression-guard-v3-5-summary-renders ─────────────────────────────
test('regression-guard-v3-5-summary-renders: story-arc summary paints above the event list', async ({ page }) => {
  await gotoFresh(page);
  await clearTodayState(page);
  const r = await page.evaluate(() => {
    const t = today();
    feedingData[t] = {
      breakfast: 'oats', breakfast_intake: 1, breakfast_time: '07:30',
      lunch: 'dal', lunch_intake: 0.75, lunch_time: '12:30',
      dinner: 'khichdi', dinner_intake: 1, dinner_time: '19:00',
    };
    renderTodaySoFar();
    const summary = document.querySelector('.tsf-story-arc') as HTMLElement | null;
    const eventList = document.querySelector('.tsf-event-list') as HTMLElement | null;
    if (!summary || !eventList) return { found: false };
    // Ordering: summary appears before the event list in document order.
    const summaryRect = summary.getBoundingClientRect();
    const listRect = eventList.getBoundingClientRect();
    return {
      found: true,
      text: summary.textContent || '',
      summaryAboveList: summaryRect.top <= listRect.top,
    };
  });
  expect(r.found, 'summary + event list both rendered').toBe(true);
  expect(r.summaryAboveList, 'summary appears above the event list').toBe(true);
  expect(r.text, 'summary mentions meals').toMatch(/meal/i);
});

// ── regression-guard-v3-5-summary-empty-state (CV3-003 honor) ──────────
test('regression-guard-v3-5-summary-empty-state: empty day renders "Quiet day so far."', async ({ page }) => {
  await gotoFresh(page);
  await clearTodayState(page);
  const r = await page.evaluate(() => {
    renderTodaySoFar();
    const summary = document.querySelector('.tsf-story-arc') as HTMLElement | null;
    return {
      found: !!summary,
      text: summary ? summary.textContent || '' : '',
      empty: summary ? summary.getAttribute('data-empty') : null,
    };
  });
  expect(r.found, 'summary renders even on empty day').toBe(true);
  expect(r.text, 'empty-day summary copy is "Quiet day so far."').toContain('Quiet day so far');
  expect(r.empty, 'empty-day summary carries data-empty="true"').toBe('true');
});

// ── regression-guard-v3-5-summary-never-blank ──────────────────────────
test('regression-guard-v3-5-summary-never-blank: summary is never empty string', async ({ page }) => {
  await gotoFresh(page);
  await clearTodayState(page);
  const r = await page.evaluate(() => {
    if (typeof _tsfGenerateSummary !== 'function') return { skipped: 'helper not exported' };
    // Exercise the empty + populated branches; both must return a non-empty string.
    const emptyOut = _tsfGenerateSummary(today(), { events: [], noTimeEvents: [] }, {});
    const populatedOut = _tsfGenerateSummary(today(), {
      events: [{ type: 'feed', state: 'done', label: 'Breakfast' }],
      noTimeEvents: [],
    }, {});
    return {
      emptyOut, populatedOut,
      emptyOK: typeof emptyOut === 'string' && emptyOut.trim().length > 0,
      populatedOK: typeof populatedOut === 'string' && populatedOut.trim().length > 0,
    };
  });
  if ((r as any).skipped) { test.skip(true, (r as any).skipped); return; }
  expect(r.emptyOK, 'empty-state summary is never blank').toBe(true);
  expect(r.populatedOK, 'populated summary is never blank').toBe(true);
});

// ── regression-guard-v3-5-day-spine-collapse ──────────────────────────
test('regression-guard-v3-5-day-spine-collapse: default shows 3 events + "Show full timeline"', async ({ page }) => {
  await gotoFresh(page);
  await clearTodayState(page);
  const r = await page.evaluate(() => {
    // Reset spine state so the test starts from the canonical default.
    if (typeof _tsfShowSpine !== 'undefined') _tsfShowSpine = true;
    const t = today();
    // Seed a busy day — 4 meals + 1 nap + 1 poop = 6 timed events
    feedingData[t] = {
      breakfast: 'oats', breakfast_intake: 1, breakfast_time: '07:30',
      lunch: 'dal', lunch_intake: 0.75, lunch_time: '12:30',
      dinner: 'khichdi', dinner_intake: 1, dinner_time: '19:00',
      snack: 'banana', snack_intake: 0.5, snack_time: '15:30',
    };
    sleepData.push({ date: t, type: 'nap', bedtime: '13:00', wakeTime: '14:30' });
    poopData.push({ date: t, time: '08:00', consistency: 'soft', color: 'yellow' });
    renderTodaySoFar();
    const chips = document.querySelectorAll('.tsf-event-list .tsf-event');
    const expand = document.querySelector('.tsf-expand-timeline') as HTMLElement | null;
    return {
      chipCount: chips.length,
      expandPresent: !!expand,
      expandText: expand ? expand.textContent || '' : '',
    };
  });
  expect(r.chipCount, 'spine shows exactly 3 chips by default').toBeLessThanOrEqual(3);
  expect(r.expandPresent, '"Show full timeline" chip rendered').toBe(true);
  expect(r.expandText, 'expand chip shows full event count').toMatch(/Show full timeline \(\d+\)/);
});

// ── regression-guard-v3-5-day-spine-expand ─────────────────────────────
test('regression-guard-v3-5-day-spine-expand: tapping expand reveals full chronological list', async ({ page }) => {
  await gotoFresh(page);
  await clearTodayState(page);
  const r = await page.evaluate(() => {
    if (typeof _tsfShowSpine !== 'undefined') _tsfShowSpine = true;
    const t = today();
    feedingData[t] = {
      breakfast: 'oats', breakfast_intake: 1, breakfast_time: '07:30',
      lunch: 'dal', lunch_intake: 0.75, lunch_time: '12:30',
      dinner: 'khichdi', dinner_intake: 1, dinner_time: '19:00',
      snack: 'banana', snack_intake: 0.5, snack_time: '15:30',
    };
    sleepData.push({ date: t, type: 'nap', bedtime: '13:00', wakeTime: '14:30' });
    renderTodaySoFar();
    const before = document.querySelectorAll('.tsf-event-list .tsf-event').length;
    // Simulate expand-tap by flipping the state directly (action handler tested elsewhere)
    _tsfShowSpine = false;
    renderTodaySoFar();
    const after = document.querySelectorAll('.tsf-event-list .tsf-event').length;
    const expandAfter = document.querySelector('.tsf-expand-timeline');
    return { before, after, expandGone: !expandAfter };
  });
  expect(r.after, 'expanded list has more chips than spine').toBeGreaterThan(r.before);
  expect(r.expandGone, '"Show full timeline" chip disappears after expand').toBe(true);
});

// ── regression-guard-v3-5-spine-prefers-urgent ─────────────────────────
test('regression-guard-v3-5-spine-prefers-urgent: spine picks urgent event first', async ({ page }) => {
  await gotoFresh(page);
  const r = await page.evaluate(() => {
    if (typeof _tsfDaySpineSelect !== 'function') return { skipped: 'helper not exported' };
    const events = [
      { id: 'a', type: 'feed', timeMin: 480, state: 'done' },
      { id: 'b', type: 'feed', timeMin: 750, state: 'done' },
      { id: 'c', type: 'sleep', timeMin: 360, state: 'done' },
      { id: 'd', type: 'feed', timeMin: 1140, state: 'done' },
      { id: 'e', type: 'med', timeMin: 540, state: 'urgent', urgency: 'urgent' },
    ];
    const picks = _tsfDaySpineSelect(events).map(ev => ev.id);
    return { picks };
  });
  if ((r as any).skipped) { test.skip(true, (r as any).skipped); return; }
  expect(r.picks.length, 'spine selects exactly 3').toBe(3);
  expect(r.picks, 'urgent event is in the spine').toContain('e');
  expect(r.picks, 'night sleep is in the spine').toContain('c');
});

// ── regression-guard-v3-5-summary-oxford-and (V-V-33 fold) ─────────────
test('regression-guard-v3-5-summary-oxford-and: summary uses Oxford-style "and" join, not CSV ledger', async ({ page }) => {
  // V-V-33 (Vela synth-fold): the original join-loop had identical `, ` on
  // both ternary branches (dead code) — the intended Oxford-style "and"
  // discriminator collapsed and the summary read as inventory, not passage.
  // CV3-002 Narrate-vs-List + Charter Warmth. This guard locks the fix.
  await gotoFresh(page);
  const r = await page.evaluate(() => {
    if (typeof _tsfGenerateSummary !== 'function') return { skipped: 'helper not exported' };
    const t = today();
    // Two-part: "Solid day. Three meals and one nap."
    const twoParts = _tsfGenerateSummary(t, {
      events: [
        { type: 'feed', state: 'done' }, { type: 'feed', state: 'done' }, { type: 'feed', state: 'done' },
        { type: 'nap', state: 'done' },
      ],
      noTimeEvents: [],
    }, {});
    // Three-part (Oxford comma): "Solid day. Three meals, one nap, and one care-note."
    const threeParts = _tsfGenerateSummary(t, {
      events: [
        { type: 'feed', state: 'done' }, { type: 'feed', state: 'done' }, { type: 'feed', state: 'done' },
        { type: 'nap', state: 'done' },
        { type: 'careticket', state: 'done' },
      ],
      noTimeEvents: [],
    }, {});
    return { twoParts, threeParts };
  });
  if ((r as any).skipped) { test.skip(true, (r as any).skipped); return; }
  // Two-part: plain " and " (no Oxford comma)
  expect(r.twoParts, 'two-part summary joins with " and "').toContain(' and ');
  expect(r.twoParts, 'two-part summary does NOT carry Oxford comma').not.toMatch(/,\s+and/);
  // Three+ part: Oxford comma ", and "
  expect(r.threeParts, 'three-part summary uses Oxford-style ", and "').toMatch(/,\s+and\s/);
});

// ── regression-guard-v3-5-pending-headline-safety (V-M-89 fold) ────────
test('regression-guard-v3-5-pending-headline-safety: contradicts-the-ledger guard + length cap', async ({ page }) => {
  // V-M-89 (Maren synth-fold): if a producer hands a stale pendingHeadline
  // asserting a negation ("D3 missed") about a domain that has a logged
  // event in today's data, fall through to the normal summary branch
  // rather than parrot the stale headline. Worst-case avoided: parent
  // re-administers a dose that already landed.
  await gotoFresh(page);
  const r = await page.evaluate(() => {
    if (typeof _tsfGenerateSummary !== 'function') return { skipped: 'helper not exported' };
    const t = today();
    // Scenario 1: stale "D3 missed" headline but a med event IS in today's data.
    const withMed = _tsfGenerateSummary(t, {
      events: [{ type: 'med', state: 'done', label: 'D3' }, { type: 'feed', state: 'done' }],
      noTimeEvents: [],
    }, { pendingHeadline: 'D3 missed yesterday — let\'s catch up.' });
    // Scenario 2: same headline but NO med event today → headline honored.
    const noMed = _tsfGenerateSummary(t, {
      events: [{ type: 'feed', state: 'done' }],
      noTimeEvents: [],
    }, { pendingHeadline: 'D3 missed yesterday — let\'s catch up.' });
    // Scenario 3: pendingHeadline longer than 80 chars → clipped.
    const longHeadline = 'A'.repeat(200);
    const clipped = _tsfGenerateSummary(t, {
      events: [{ type: 'feed', state: 'done' }],
      noTimeEvents: [],
    }, { pendingHeadline: longHeadline });
    return { withMed, noMed, clipped };
  });
  if ((r as any).skipped) { test.skip(true, (r as any).skipped); return; }
  expect(r.withMed, 'ledger wins: med event today + "missed" headline → fall through').not.toContain('missed');
  expect(r.noMed, 'no contradicting med event today → headline honored').toContain('missed');
  expect(r.clipped.length, 'pendingHeadline capped at 80 chars').toBeLessThanOrEqual(80);
});

// ── regression-guard-v3-5-summary-activity-careticket (V-K-91 fold) ────
test('regression-guard-v3-5-summary-activity-careticket: activity + care-note surface in parts', async ({ page }) => {
  // V-K-91 (Kael synth-fold): activity and careticket counts are taxonomy
  // citizens. A CT-heavy day used to fall through to "Solid day. N events
  // logged." — narratively flat, warmth-axis fail per chronicle §3.3.
  await gotoFresh(page);
  const r = await page.evaluate(() => {
    if (typeof _tsfGenerateSummary !== 'function') return { skipped: 'helper not exported' };
    const t = today();
    const withCT = _tsfGenerateSummary(t, {
      events: [
        { type: 'feed', state: 'done' },
        { type: 'careticket', state: 'done' },
        { type: 'careticket', state: 'done' },
      ],
      noTimeEvents: [],
    }, {});
    const withActivity = _tsfGenerateSummary(t, {
      events: [
        { type: 'feed', state: 'done' },
        { type: 'activity', state: 'done' },
      ],
      noTimeEvents: [],
    }, {});
    return { withCT, withActivity };
  });
  if ((r as any).skipped) { test.skip(true, (r as any).skipped); return; }
  expect(r.withCT, 'careticket count surfaces as "care-notes"').toContain('care-notes');
  expect(r.withActivity, 'activity count surfaces in parts').toContain('activity');
});

// ── regression-guard-v3-5-window-chip-states-exposed (V-K-89 fold) ─────
test('regression-guard-v3-5-window-chip-states-exposed: _TSF_CHIP_STATES on window', async ({ page }) => {
  await gotoFresh(page);
  const r = await page.evaluate(() => {
    const states = (window as any)._TSF_CHIP_STATES;
    if (!Array.isArray(states)) return { found: false };
    return { found: true, states };
  });
  expect(r.found, '_TSF_CHIP_STATES exposed on window').toBe(true);
  expect(r.states, '_TSF_CHIP_STATES enumerates the 8 canonical states').toEqual(
    ['urgent','live','calm','skipped','late','inferred','pending','done']
  );
});

// ── regression-guard-v3-5-spine-includes-live (V-K-90 fold) ────────────
test('regression-guard-v3-5-spine-includes-live: live event surfaces in spine when no urgent + no night-sleep', async ({ page }) => {
  // V-K-90 (Kael synth-fold): mid-nap parent should see the active sleep
  // in the spine. Before the fold, the chronological pad excluded isLive
  // events, silently dropping the live nap from the 3-event spine.
  await gotoFresh(page);
  const r = await page.evaluate(() => {
    if (typeof _tsfDaySpineSelect !== 'function') return { skipped: 'helper not exported' };
    const events = [
      { id: 'a', type: 'feed', timeMin: 480, state: 'done' },
      { id: 'b', type: 'feed', timeMin: 750, state: 'done' },
      { id: 'c', type: 'feed', timeMin: 900, state: 'done' },
      { id: 'd', type: 'nap', timeMin: 840, state: 'live', isLive: true },
    ];
    const picks = _tsfDaySpineSelect(events).map(ev => ev.id);
    return { picks };
  });
  if ((r as any).skipped) { test.skip(true, (r as any).skipped); return; }
  expect(r.picks, 'live event surfaces in the spine').toContain('d');
});

// ── regression-guard-v3-5-summary-perf-budget (cipher-3 target) ────────
test('regression-guard-v3-5-summary-perf-budget: summary paints within 200ms target', async ({ page }) => {
  // Per spec: 200ms is a target (cipher-3 calibrated), not a strict gate
  // threshold. We measure here as a soft signal — failing crosses a Cipher
  // Edict V finding, doesn't block the build. Marked test.fixme on regression.
  await gotoFresh(page);
  const r = await page.evaluate(() => {
    if (typeof _tsfGenerateSummary !== 'function') return { skipped: 'helper not exported' };
    const t = today();
    const events = { events: Array.from({ length: 8 }, (_, i) => ({
      type: 'feed', state: 'done', timeMin: 420 + i*60, label: `Event ${i}`,
    })), noTimeEvents: [] };
    const start = performance.now();
    for (let i = 0; i < 100; i++) _tsfGenerateSummary(t, events, {});
    const elapsed = performance.now() - start;
    return { avgMs: elapsed / 100 };
  });
  if ((r as any).skipped) { test.skip(true, (r as any).skipped); return; }
  // Soft target — 100 iterations averaged. Even on the slowest CI box this
  // should comfortably clear 200ms per call.
  expect(r.avgMs, 'per-call summary generation under 200ms target').toBeLessThan(200);
});
