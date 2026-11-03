import { test, expect } from '@playwright/test';

// BUGS #159 edge items (the #282 follow-up):
//  - Carina V-CA-282g-2: readers take the latest measurement by date (gvLatestMeasure), not the last
//    array row, in whole calendar days.
//  - Maren V-M-282g-4 / Kael V-K-282g-5: the CareTicket weight goal measures its own 28-day look-back
//    at every age (gvWeightGoalWindow), so an infant weighed weekly can resolve it.
//  - Vela V-V-282g-7: a stale weigh-in's percentile carries its date.
//  - Vela V-V-282g-8: the percentile line is never green beside a dropping crossing.
// QA chain canon-cc-008: Carina (core.js), Kael (caretickets, qa-handlers, core.js scoring block),
// Maren (medical.js), Ceres (diet.js), Vela (percentile copy).

async function boot(page: any) {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
}

// Rows are { d: days from today (negative = past), wt?, ht? }; ageDays = the child's age today.
async function seedGrowth(page: any, ageDays: number, rows: { d: number; wt?: number; ht?: number }[]) {
  await page.evaluate(({ ageDays, rows }: any) => {
    const iso = (off: number) => { const x = new Date(); x.setDate(x.getDate() + off); return toDateStr(x); };
    const dob = new Date(); dob.setHours(12, 0, 0, 0); dob.setDate(dob.getDate() - ageDays);
    DOB = dob;
    growthData = rows.map((r: any) => { const o: any = { date: iso(r.d) }; if (r.wt != null) o.wt = r.wt; if (r.ht != null) o.ht = r.ht; return o; });
  }, { ageDays, rows });
}

test('g-2: the latest measurement is the latest by date, not the last array row', async ({ page }) => {
  await boot(page);
  // Saved out of order: the last array row is 40 days old, the newest is 3 days old with both measures.
  await seedGrowth(page, 420, [{ d: -3, wt: 9.6, ht: 76 }, { d: -40, wt: 9.2 }]);
  const r = await page.evaluate(() => {
    const m = gvLatestMeasure();
    const s = calcMedicalScore();
    return { date: m && m.date, both: m && m.both, days: s.detail.daysSinceGrowth, has: s.detail.hasBothMeasures, growth: s.components.growth };
  });
  expect(r.days).toBe(3);
  expect(r.both).toBe(true);
  expect(r.has).toBe(true);
  expect(r.growth).toBe(100);
});

test('g-2: a future-dated row never reads as "-2d ago"', async ({ page }) => {
  await boot(page);
  await seedGrowth(page, 420, [{ d: -30, wt: 9.2 }, { d: 2, wt: 9.4 }]);
  const days = await page.evaluate(() => calcMedicalScore().detail.daysSinceGrowth);
  expect(days).toBe(0);
});

test('g-4/g-5: an infant weighed weekly gets a 28-day weight-goal window', async ({ page }) => {
  await boot(page);
  // 6 months old, weighed every 7 days: the shared window is the last 7-day pair (under 12 m).
  await seedGrowth(page, 183, [{ d: -35, wt: 7.0 }, { d: -28, wt: 7.1 }, { d: -21, wt: 7.2 }, { d: -14, wt: 7.3 }, { d: -7, wt: 7.4 }, { d: 0, wt: 7.5 }]);
  const r = await page.evaluate(() => {
    const gw = gvWeightGoalWindow();
    return { days: gw && gw.days, gpw: gw && gw.gPerWeek, metric: ctGetMetricValue('wtGPerWeek'), sharedDays: gvWeightWindow(gvMeasureRows('wt')).days };
  });
  expect(r.sharedDays).toBe(7);
  expect(r.days).toBe(28);
  expect(r.gpw).toBe(100);   // 400 g over 28 days
  expect(r.metric).toBe(100);
});

test('g-4/g-5: no weigh-in 28+ days back → the goal metric stays null', async ({ page }) => {
  await boot(page);
  await seedGrowth(page, 183, [{ d: -14, wt: 7.3 }, { d: -7, wt: 7.4 }, { d: 0, wt: 7.5 }]);
  const metric = await page.evaluate(() => ctGetMetricValue('wtGPerWeek'));
  expect(metric).toBeNull();
});

test('g-4/g-5: the goal window never reaches past 61 days (a birth weight 4 months back is not the goal\'s gain)', async ({ page }) => {
  await boot(page);
  await seedGrowth(page, 120, [{ d: -120, wt: 3.3 }, { d: -7, wt: 6.0 }, { d: 0, wt: 6.2 }]);
  const metric = await page.evaluate(() => ctGetMetricValue('wtGPerWeek'));
  expect(metric).toBeNull();
});

test('g-7: a stale weigh-in dates its percentile; a current one does not', async ({ page }) => {
  await boot(page);
  // 14 months, last weighed 50 days ago (stale from 12 m is over 35 days).
  await seedGrowth(page, 425, [{ d: -90, wt: 8.9 }, { d: -50, wt: 9.3 }]);
  const stale = await page.evaluate(() => {
    const gv = computeGrowthVelocity();
    const a = qaAnswerGrowth('growth');
    const items = a.sections.flatMap((s: any) => s.items.map((i: any) => i.text));
    return { stale: gv.weight.stale, suffix: gvPctAsOf(gv), line: items.find((t: string) => /percentile|centile line/i.test(t)) || '' };
  });
  expect(stale.stale).toBe(true);
  expect(stale.suffix).toMatch(/^ \(weighed .+\)$/);
  expect(stale.line).toContain('(weighed ');

  await seedGrowth(page, 425, [{ d: -40, wt: 8.9 }, { d: -3, wt: 9.3 }]);
  const fresh = await page.evaluate(() => gvPctAsOf(computeGrowthVelocity()));
  expect(fresh).toBe('');
});

test('g-8: the percentile line is not green beside a dropping crossing', async ({ page }) => {
  await boot(page);
  // 14 months: ~50th percentile 60 days ago, then a fall of well over 15 points, still above the 3rd line.
  await seedGrowth(page, 425, [{ d: -60, wt: 9.0 }, { d: -2, wt: 8.6 }]);
  const r = await page.evaluate(() => {
    const gv = computeGrowthVelocity();
    const a = qaAnswerGrowth('growth');
    const items = a.sections.flatMap((s: any) => s.items);
    const pct = items.find((i: any) => /^Weight percentile/.test(i.text));
    const last = gv.crossings[gv.crossings.length - 1];
    return { dir: last && last.direction, low: gvPctLow(gv.latestPercentile), slide: !!gv.centileSlide, signal: pct && pct.signal };
  });
  expect(r.dir === 'dropping' || r.slide).toBe(true);
  expect(r.low).toBe(false);
  expect(r.signal).not.toBe('good');
});

// ── Governor round on #286 ──

test('V-M-286-1: the weight goal is never met on weigh-ins from before it was opened', async ({ page }) => {
  await boot(page);
  // Weekly infant, strong gain then a stall; the parent opens "Increase weight" today.
  await seedGrowth(page, 150, [{ d: -28, wt: 6.0 }, { d: -21, wt: 6.2 }, { d: -14, wt: 6.4 }, { d: -7, wt: 6.55 }, { d: 0, wt: 6.55 }]);
  const before = await page.evaluate(() => {
    const t: any = { category: 'weight_gain', createdAt: new Date().toISOString() };
    const r = ctCheckThresholdMet(t);
    return { display: ctGetMetricValue('wtGPerWeek'), judged: ctGetMetricValue('wtGPerWeek', null, t), firstMetAt: t.firstMetAt || null, met: r.met };
  });
  expect(before.display).toBe(137);   // shown as data …
  expect(before.judged).toBeNull();   // … but no weigh-in since opening → not judged
  expect(before.firstMetAt).toBeNull();
  expect(before.met).toBe(false);
  // A weigh-in after the goal was opened counts.
  const after = await page.evaluate(() => {
    const opened = new Date(); opened.setDate(opened.getDate() - 10);
    const iso = (off: number) => { const x = new Date(); x.setDate(x.getDate() + off); return toDateStr(x); };
    growthData = growthData.filter((r: any) => r.date !== iso(0)).concat([{ date: iso(0), wt: 6.7 }]);   // today's weigh-in, after opening
    return ctGetMetricValue('wtGPerWeek', null, { category: 'weight_gain', createdAt: opened.toISOString() });
  });
  expect(after).not.toBeNull();
});

test('V-K-286-1: a two-calendar-month pair (62 days) is a goal window; 63 is not', async ({ page }) => {
  await boot(page);
  await seedGrowth(page, 400, [{ d: -62, wt: 9.0 }, { d: 0, wt: 9.4 }]);
  expect(await page.evaluate(() => (gvWeightGoalWindow() || {}).days)).toBe(62);
  await seedGrowth(page, 400, [{ d: -63, wt: 9.0 }, { d: 0, wt: 9.4 }]);
  expect(await page.evaluate(() => gvWeightGoalWindow())).toBeNull();
});

test('V-K-286-2: a goal window never starts in the after-birth dip, only at the birth row', async ({ page }) => {
  await boot(page);
  // Born 30 days ago; birth row, a dip-day row on day 2, latest on day 30.
  await seedGrowth(page, 30, [{ d: -30, wt: 3.3 }, { d: -28, wt: 3.1 }, { d: 0, wt: 4.0 }]);
  const r = await page.evaluate(() => { const g = gvWeightGoalWindow(); return g && { days: g.days, prev: g.previous.wt }; });
  expect(r).toEqual({ days: 30, prev: 3.3 });
});

test('V-V-286-1: the Pulse card dates an old weigh-in in the same bracket', async ({ page }) => {
  await boot(page);
  await seedGrowth(page, 425, [{ d: -90, wt: 8.9 }, { d: -50, wt: 9.3 }]);
  const stale = await page.evaluate(() => getPulseNarrative());
  expect(stale).toMatch(/weight at 9\.3 kg \([^)]*percentile, weighed [^)]+\)/);
  await seedGrowth(page, 425, [{ d: -40, wt: 8.9 }, { d: -3, wt: 9.3 }]);
  const fresh = await page.evaluate(() => getPulseNarrative());
  expect(fresh).not.toContain('weighed');
});

test('V-K-286-4 / V-M-286-4: a stale percentile with no weight result is dated, and never green', async ({ page }) => {
  await boot(page);
  // One weigh-in 90 days ago plus a recent height-only row: no weight result, still a percentile.
  await seedGrowth(page, 425, [{ d: -90, wt: 8.9 }, { d: -3, ht: 77 }]);
  const r = await page.evaluate(() => {
    const gv = computeGrowthVelocity();
    const items = qaAnswerGrowth('growth').sections.flatMap((s: any) => s.items);
    const pct = items.find((i: any) => /^Weight percentile/.test(i.text));
    return { weight: gv.weight, text: pct && pct.text, signal: pct && pct.signal };
  });
  expect(r.weight).toBeNull();
  expect(r.text).toContain('(weighed ');
  expect(r.signal).toBe('info');
});

test('V-CA-286-6: latest-measure edge cases (height newer, same-day split rows, non-array)', async ({ page }) => {
  await boot(page);
  await seedGrowth(page, 420, [{ d: -10, wt: 9.4 }, { d: -3, ht: 77 }]);
  expect(await page.evaluate(() => { const m = gvLatestMeasure(); return [gvDaysSinceMeasure(), m.both]; })).toEqual([3, false]);
  await seedGrowth(page, 420, [{ d: -3, wt: 9.4 }, { d: -3, ht: 77 }]);
  expect(await page.evaluate(() => gvLatestMeasure().both)).toBe(true);
  const nonArray = await page.evaluate(() => { (window as any).growthData = null; growthData = null as any; const a = gvLatestMeasure(); growthData = {} as any; return [a, gvLatestMeasure(), calcMedicalScore().components.growth]; });
  expect(nonArray).toEqual([null, null, 0]);
});

test('V-C-286-2: the diet heads-up "time to weigh" nudge reads the latest measurement by date', async ({ page }) => {
  await boot(page);
  const nudge = () => page.evaluate(() => (_tpGatherHeadsUp() || []).map((i: any) => i.text).find((t: string) => /^Last measured/.test(t)) || null);
  await seedGrowth(page, 420, [{ d: -3, wt: 9.4 }, { d: -40, wt: 9.0 }]);   // saved out of order
  expect(await nudge()).toBeNull();
  await seedGrowth(page, 420, [{ d: -30, wt: 9.0 }, { d: 2, wt: 9.4 }]);    // future-dated row
  expect(await nudge()).toBeNull();
  await seedGrowth(page, 420, [{ d: -20, wt: 9.4 }]);
  expect(await nudge()).toBe('Last measured 20 days ago — time to weigh and measure');
});
