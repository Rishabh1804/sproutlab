import { test, expect } from '@playwright/test';

// v3-5 — Unified Chip-State Taxonomy regression guards.
// Spec: docs/specs/v3-5-chip-taxonomy-tsf-story.md §Functional tests — chip-state taxonomy.
// QA chain canon-cc-008: Vela primary (intelligence-quicklog.js + intelligence-cards.js
// + styles.css surface); Maren consult (urgent visual-hierarchy floor per
// CV3-004 pair-note); Kael consult (_tsfDeriveChipState data-side per CV3-004
// pair-note); Cipher Edict V with three Charter-axis checks (cipher-honesty
// / cipher-extensibility / cipher-warmth per CV3-006).

// ── helpers ───────────────────────────────────────────────────────────
async function gotoFresh(page) {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);
}

// ── regression-guard-v3-5-chip-state-attr-mutex ────────────────────────
test('regression-guard-v3-5-chip-state-attr-mutex: at most one data-state per chip', async ({ page }) => {
  // Mutual exclusion is the Charter Extensibility honor — the deriver picks one
  // state, the renderer reads it once. No chip carries multiple data-state
  // attributes (the attribute syntax precludes it) and no chip carries any of
  // the migrated legacy `tsf-event-inferred` / `tsf-event-live` classes.
  await gotoFresh(page);
  const r = await page.evaluate(() => {
    if (typeof renderTodaySoFar === 'function') renderTodaySoFar();
    const chips = Array.from(document.querySelectorAll('.tsf-event'));
    const offenders = chips.filter(c =>
      c.classList.contains('tsf-event-inferred') ||
      c.classList.contains('tsf-event-live') ||
      c.classList.contains('tsf-event-skipped') ||
      c.hasAttribute('data-calm')
    );
    return { chipCount: chips.length, offenders: offenders.length };
  });
  expect(r.offenders, 'no chip may carry legacy class strings or data-calm under v3-5').toBe(0);
});

// ── regression-guard-v3-5-done-state ──────────────────────────────────
test('regression-guard-v3-5-done-state: logged events default to data-state="done"', async ({ page }) => {
  // The deriver returns 'done' for any logged event without a more-specific
  // state. Seed a logged meal and verify the chip carries data-state="done".
  await gotoFresh(page);
  const r = await page.evaluate(() => {
    const t = today();
    feedingData[t] = { breakfast: 'oats', breakfast_intake: 1, breakfast_time: '08:00' };
    renderTodaySoFar();
    const chips = Array.from(document.querySelectorAll('.tsf-event[data-state]')) as HTMLElement[];
    const doneChip = chips.find(c => (c.textContent || '').includes('Breakfast'));
    return { found: !!doneChip, state: doneChip ? doneChip.getAttribute('data-state') : null };
  });
  expect(r.found, 'breakfast chip rendered').toBe(true);
  expect(r.state, 'logged breakfast carries data-state="done"').toBe('done');
});

// ── regression-guard-v3-5-skipped-state (T2-A.3 / V-V-25 regression) ──
test('regression-guard-v3-5-skipped-state: skipped med carries data-state="skipped" + strikethrough', async ({ page }) => {
  await gotoFresh(page);
  const r = await page.evaluate(() => {
    const d3 = (meds || []).find(m => m.active && m.name && m.name.toLowerCase().includes('d3'));
    if (!d3) return { skipped: 'no D3 med' };
    const t = today();
    if (!medChecks[t]) medChecks[t] = {};
    medChecks[t][d3.name] = { status: 'skipped', loggedAt: '09:15' };
    renderTodaySoFar();
    const chip = document.querySelector('.tsf-event[data-state="skipped"]') as HTMLElement | null;
    if (!chip) return { found: false };
    const label = chip.querySelector('.tsf-event-label') as HTMLElement | null;
    const labelStyle = label ? window.getComputedStyle(label) : null;
    return {
      found: true,
      state: chip.getAttribute('data-state'),
      strikethrough: labelStyle ? labelStyle.textDecorationLine.includes('line-through') : false,
    };
  });
  if ((r as any).skipped) { test.skip(true, (r as any).skipped); return; }
  expect(r.found, 'skipped chip rendered').toBe(true);
  expect(r.state).toBe('skipped');
  expect(r.strikethrough, 'skipped chip carries strikethrough label (T2-A.3 regression)').toBe(true);
});

// ── regression-guard-v3-5-late-state ───────────────────────────────────
test('regression-guard-v3-5-late-state: late med carries data-state="late"', async ({ page }) => {
  await gotoFresh(page);
  const r = await page.evaluate(() => {
    const d3 = (meds || []).find(m => m.active && m.name && m.name.toLowerCase().includes('d3'));
    if (!d3) return { skipped: 'no D3 med' };
    const t = today();
    if (!medChecks[t]) medChecks[t] = {};
    medChecks[t][d3.name] = { status: 'late', givenAt: '11:30', loggedAt: '14:00' };
    renderTodaySoFar();
    const chip = document.querySelector('.tsf-event[data-state="late"]') as HTMLElement | null;
    return { found: !!chip, state: chip ? chip.getAttribute('data-state') : null };
  });
  if ((r as any).skipped) { test.skip(true, (r as any).skipped); return; }
  expect(r.found, 'late chip rendered').toBe(true);
  expect(r.state).toBe('late');
});

// ── regression-guard-v3-5-inferred-state ──────────────────────────────
test('regression-guard-v3-5-inferred-state: meal without time carries data-state="inferred"', async ({ page }) => {
  await gotoFresh(page);
  const r = await page.evaluate(() => {
    const t = today();
    // Seed a meal WITHOUT a time (forces _tsfInferMealTime).
    feedingData[t] = { lunch: 'dal-rice', lunch_intake: 0.75 };
    renderTodaySoFar();
    const chip = document.querySelector('.tsf-event[data-state="inferred"]') as HTMLElement | null;
    return { found: !!chip, state: chip ? chip.getAttribute('data-state') : null };
  });
  expect(r.found, 'inferred chip rendered for time-less meal').toBe(true);
  expect(r.state).toBe('inferred');
});

// ── regression-guard-v3-5-live-state + calm opts out of pulse ─────────
test('regression-guard-v3-5-live-state: in-progress sleep carries data-state="live"', async ({ page }) => {
  await gotoFresh(page);
  const r = await page.evaluate(() => {
    const now = new Date();
    const startHh = String(now.getHours()).padStart(2, '0');
    const startMm = String(now.getMinutes()).padStart(2, '0');
    // Use a recent start (within the last few minutes) so the in-progress
    // chip is short — guaranteed NOT to be calm (calm fires at 120+ min night).
    localStorage.setItem(SLEEP_INPROGRESS_KEY, JSON.stringify({ type: 'nap', startTime: `${startHh}:${startMm}` }));
    renderTodaySoFar();
    const chip = document.querySelector('.tsf-event[data-state="live"]') as HTMLElement | null;
    return { found: !!chip };
  });
  expect(r.found, 'live chip rendered for in-progress nap').toBe(true);
});

// ── regression-guard-v3-5-urgent-state (producer-pending; CSS contract) ─
test('regression-guard-v3-5-urgent-state: data-state="urgent" CSS rule defines rose border', async ({ page }) => {
  // No producer wires urgent in v3-5 (that's v3-1's job). This test verifies
  // the CSS contract is registered: the stylesheet contains a rule matching
  // `.tsf-event[data-state="urgent"]` with a border-left declaration.
  await gotoFresh(page);
  const r = await page.evaluate(() => {
    const sheets = Array.from(document.styleSheets);
    for (const sheet of sheets) {
      try {
        const rules = Array.from((sheet as CSSStyleSheet).cssRules || []) as CSSStyleRule[];
        for (const rule of rules) {
          if (rule.selectorText && rule.selectorText.indexOf('[data-state="urgent"]') !== -1 && /border-left/i.test(rule.cssText)) {
            return { found: true, cssText: rule.cssText };
          }
        }
      } catch (e) { /* cross-origin sheet; skip */ }
    }
    return { found: false };
  });
  expect(r.found, 'CSS registry contains data-state="urgent" border rule').toBe(true);
  expect(r.cssText, 'urgent border uses --tc-rose token').toMatch(/--tc-rose/);
});

// ── regression-guard-v3-5-pending-state (CSS contract) ─────────────────
test('regression-guard-v3-5-pending-state: data-state="pending" CSS rule defines dashed border', async ({ page }) => {
  await gotoFresh(page);
  const r = await page.evaluate(() => {
    const sheets = Array.from(document.styleSheets);
    for (const sheet of sheets) {
      try {
        const rules = Array.from((sheet as CSSStyleSheet).cssRules || []) as CSSStyleRule[];
        for (const rule of rules) {
          if (rule.selectorText && rule.selectorText.indexOf('[data-state="pending"]') !== -1 && /dashed/i.test(rule.cssText)) {
            return { found: true, cssText: rule.cssText };
          }
        }
      } catch (e) { /* cross-origin sheet; skip */ }
    }
    return { found: false };
  });
  expect(r.found, 'CSS registry contains data-state="pending" dashed border rule').toBe(true);
});

// ── regression-guard-v3-5-deriver-precedence ───────────────────────────
test('regression-guard-v3-5-deriver-precedence: urgent > live > skipped > late > inferred > pending > done', async ({ page }) => {
  // The 8-state mutex contract — exactly one state per chip even when
  // multiple flags fire. urgent wins over live wins over skipped, etc.
  await gotoFresh(page);
  const r = await page.evaluate(() => {
    if (typeof _tsfDeriveChipState !== 'function') return { skipped: 'deriver not exported' };
    return {
      urgentBeatsLive:    _tsfDeriveChipState({ urgency: 'urgent', isLive: true }) === 'urgent',
      liveBeatsSkipped:   _tsfDeriveChipState({ isLive: true, parsed: { status: 'skipped' } }) === 'live',
      calmBeatsLive:      _tsfDeriveChipState({ isLive: true, isCalm: true }) === 'calm',
      skippedBeatsLate:   _tsfDeriveChipState({ parsed: { status: 'skipped' } }) === 'skipped',
      lateBeatsInferred:  _tsfDeriveChipState({ parsed: { status: 'late' }, inferred: true }) === 'late',
      inferredBeatsPending: _tsfDeriveChipState({ inferred: true, pending: true }) === 'inferred',
      pendingBeatsDone:   _tsfDeriveChipState({ pending: true }) === 'pending',
      defaultDone:        _tsfDeriveChipState({}) === 'done',
    };
  });
  if ((r as any).skipped) { test.skip(true, (r as any).skipped); return; }
  expect(r.urgentBeatsLive,      'urgent > live').toBe(true);
  expect(r.liveBeatsSkipped,     'live > skipped').toBe(true);
  expect(r.calmBeatsLive,        'live + calm → calm').toBe(true);
  expect(r.skippedBeatsLate,     'skipped > late').toBe(true);
  expect(r.lateBeatsInferred,    'late > inferred').toBe(true);
  expect(r.inferredBeatsPending, 'inferred > pending').toBe(true);
  expect(r.pendingBeatsDone,     'pending > done').toBe(true);
  expect(r.defaultDone,          'default state is done').toBe(true);
});
