import { test, expect } from '@playwright/test';

// Vit D3 Tracking v2 — Tier 2 Phase 2-A regression guards.
// Spec: docs/specs/vit-d3-tracking-v2-tier-2.md §Phase 2-A.
// QA chain canon-cc-008: Maren (medical.js) + Vela (intelligence-quicklog.js render
// + comprehension-surface lens on the CSS) Mode-1 parallel; triple-jurisdiction
// sequential review on styles.css (Maren → Kael → Vela, first by heaviest-touched
// Region = Vela); Lyra synth; Cipher Edict V.

// ── T2-A.1 ───────────────────────────────────────────────────────────────────
test('regression-guard-d3-v2-t2-a-1: pattern card excludes today from adherence + unloggedDays on unlogged morning', async ({ page }) => {
  // Trigger: Day 14 of a perfect streak at 8 AM (today not yet logged). Pre-fix card read
  //   "Adherence: 13/14 days (93%)"  +  "1 day not logged in this window"  +  "Streak through yesterday: 13 days".
  // Three contradictory lines. V-M-64 fixed the streak label; T2-A.1 makes adherence +
  // unloggedDays exclude today on the same boundary so all three lines agree.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const d3 = (meds || []).find(m => m.active && m.name && m.name.toLowerCase().includes('d3'));
    if (!d3) return { skipped: 'no D3 med' };
    const t = today();
    // Seed 13 perfect prior days; ensure today is empty (unlogged morning).
    if (!medChecks[t]) medChecks[t] = {};
    delete medChecks[t][d3.name];
    // Seed days t-1 .. t-13 as done. Use a tiny helper to step a yyyy-mm-dd date back.
    function back(n) {
      const d = new Date(t + 'T12:00:00');
      d.setDate(d.getDate() - n);
      const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0');
      return y + '-' + m + '-' + dd;
    }
    for (let i = 1; i <= 13; i++) {
      const ds = back(i);
      if (!medChecks[ds]) medChecks[ds] = {};
      medChecks[ds][d3.name] = { status:'done', givenAt:'08:30', loggedAt:'08:32', withFat:true, fatFood:'paratha', fatDelta:5 };
    }
    // Pin trackingSince so the 14-day window is fully eligible.
    medChecks._trackingSince = back(13);
    // Render the card and read the summary text.
    if (typeof renderMedD3PatternCard === 'function') renderMedD3PatternCard();
    const body = document.getElementById('medD3PatternBody');
    const text = body ? body.textContent || '' : '';
    return { text };
  });

  if ((r as any).skipped) {
    test.skip(true, (r as any).skipped);
    return;
  }
  // After T2-A.1: today is excluded from the denominator → 13/13 (100%), no "not logged" stripe.
  // Pre-fix would have read "Adherence: 13/14 days (93%)" + "1 day not logged".
  expect(r.text, 'T2-A.1: denominator must exclude today (13/13, not 13/14)').toContain('Adherence: 13/13 days (100%)');
  expect(r.text, 'T2-A.1: warn stripe "N days not logged" must NOT fire for an unlogged morning').not.toContain('not logged in this window');
});

// ── T2-A.2 ───────────────────────────────────────────────────────────────────
test('regression-guard-d3-v2-t2-a-2: pattern card preserves through-yesterday streak on legitimate skip today', async ({ page }) => {
  // Trigger: parent legitimately skips today (sick, dose-form change, doctor advice).
  // Pre-fix the streak walk treats skipped as a resolved status → startIdx = len-1 → first
  // iteration breaks (status not in done/late) → streak=0. Card reads "Current streak: 0 days"
  // and historical context is erased. T2-A.2 extends V-M-64's exclude-today fallback to skip.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const d3 = (meds || []).find(m => m.active && m.name && m.name.toLowerCase().includes('d3'));
    if (!d3) return { skipped: 'no D3 med' };
    const t = today();
    if (!medChecks[t]) medChecks[t] = {};
    // Skip today (loggedAt-only — schema per CR-10).
    medChecks[t][d3.name] = { status:'skipped', givenAt:null, loggedAt:'09:00', withFat:null, fatFood:null, fatDelta:null };
    // 13 perfect prior days.
    function back(n) {
      const d = new Date(t + 'T12:00:00');
      d.setDate(d.getDate() - n);
      const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0');
      return y + '-' + m + '-' + dd;
    }
    for (let i = 1; i <= 13; i++) {
      const ds = back(i);
      if (!medChecks[ds]) medChecks[ds] = {};
      medChecks[ds][d3.name] = { status:'done', givenAt:'08:30', loggedAt:'08:32', withFat:true, fatFood:'paratha', fatDelta:5 };
    }
    medChecks._trackingSince = back(13);
    if (typeof renderMedD3PatternCard === 'function') renderMedD3PatternCard();
    const body = document.getElementById('medD3PatternBody');
    const text = body ? body.textContent || '' : '';
    return { text };
  });

  if ((r as any).skipped) {
    test.skip(true, (r as any).skipped);
    return;
  }
  // After T2-A.2: skipped today walks from yesterday → 13-day through-yesterday streak preserved.
  expect(r.text, 'T2-A.2: streak label must read "through yesterday" on legitimate skip').toContain('Streak through yesterday');
  expect(r.text, 'T2-A.2: 13-day prior streak must be preserved (not zeroed)').toContain('13 days');
  expect(r.text, 'T2-A.2: must NOT show the "Current streak: 0" regression').not.toContain('Current streak');
  // V-M-85 (Maren synth-fold): T2-A.1 boundary mirrored at the skipped-today case via V-M-83.
  // Skipped today must be excluded from adherence denominator on the same boundary that
  // excludes it from the streak walk — otherwise the card renders "13/14 (93%)" beside
  // "Streak through yesterday: 13" (the three-line incoherence T2-A.1 was authored to fix).
  expect(r.text, 'V-M-83: skipped today must be excluded from adherence (13/13 not 13/14)').toContain('Adherence: 13/13 days (100%)');
});

// ── T2-A.3 ───────────────────────────────────────────────────────────────────
test('regression-guard-d3-v2-t2-a-3: skipped TSF chip has data-state attr and strikethrough CSS', async ({ page }) => {
  // Trigger: post-T1-3 the skipped chip surfaces in TSF at loggedAt time, but the chip is
  // pixel-identical to a Done chip (icon = pill, label = med name; only the detail string
  // differs by one word). T2-A.3 (V-V-25) adds a data-state="skipped" attr on the chip
  // wrapper + a CSS variant in styles.css: strikethrough label + warn-color time slot +
  // faded icon. Half-awake-readable distinction.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const d3 = (meds || []).find(m => m.active && m.name && m.name.toLowerCase().includes('d3'));
    if (!d3) return { skipped: 'no D3 med' };
    const t = today();
    if (!medChecks[t]) medChecks[t] = {};
    medChecks[t][d3.name] = { status:'skipped', givenAt:null, loggedAt:'09:15', withFat:null, fatFood:null, fatDelta:null };
    if (typeof _tsfMarkDirty === 'function') _tsfMarkDirty();
    // Switch to home (TSF lives there) and render.
    if (typeof switchTab === 'function') switchTab('home');
    if (typeof renderTodaySoFar === 'function') renderTodaySoFar();
    // Query the chip wrapper. Med chip id is 'med-<name>'.
    const chip = document.querySelector('.tsf-event[data-state="skipped"]') as HTMLElement | null;
    if (!chip) return { found: false };
    const label = chip.querySelector('.tsf-event-label') as HTMLElement | null;
    const time  = chip.querySelector('.tsf-event-time')  as HTMLElement | null;
    const icon  = chip.querySelector('.tsf-event-icon .icon') as HTMLElement | null;
    const labelStyle = label ? getComputedStyle(label) : null;
    const timeStyle  = time  ? getComputedStyle(time)  : null;
    const iconStyle  = icon  ? getComputedStyle(icon)  : null;
    return {
      found: true,
      labelText: label ? label.textContent : '',
      labelDecoration: labelStyle ? labelStyle.textDecorationLine : '',
      timeOpacity: timeStyle ? parseFloat(timeStyle.opacity) : null,
      iconOpacity: iconStyle ? parseFloat(iconStyle.opacity) : null,
    };
  });

  if ((r as any).skipped) {
    test.skip(true, (r as any).skipped);
    return;
  }
  expect(r.found, 'T2-A.3: chip wrapper must carry data-state="skipped"').toBe(true);
  expect(r.labelDecoration, 'T2-A.3: skipped label must render strikethrough').toContain('line-through');
  expect(r.timeOpacity, 'T2-A.3: time slot must be faded (warn-color + opacity 0.7)').toBeLessThanOrEqual(0.8);
  expect(r.iconOpacity, 'T2-A.3: icon must be faded (opacity 0.6)').toBeLessThanOrEqual(0.7);
});
