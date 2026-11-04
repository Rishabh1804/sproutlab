import { test, expect } from '@playwright/test';

// #161 PR 2: gvWeightJumpCheck (spec docs/specs/paracetamol-weight-check-v1.md §4.2, §8 E self-tests).
// Velocity P1/P99 to 24 m; weight-for-age Δz from a 12 m start up to 184-day gaps and 60 m; fail-closed.
// The check is not wired to the chip yet (PR 4). Ages come from a fixed birth date, so no test depends on
// today's date. QA chain canon-cc-008: Carina (core.js, data.js), Kael (engine), Maren (consequence).

const DOB = '2024-01-15';

async function boot(page: any, sex: string | null = 'f') {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  await page.evaluate(({ dob, sex }: any) => {
    const w = window as any;
    w._profSave(Object.assign({}, profile.child, { dob, sex }), profile.place);
  }, { dob: DOB, sex });
}

// Run the check on rows given as [dayOfLife, kg]; returns a compact summary.
async function jump(page: any, rows: [number, number][], sex?: string | null) {
  return page.evaluate(({ rows, sex, dob }: any) => {
    const w = window as any;
    const base = w._parseLocalDate(dob);
    const R = rows.map(([d, wt]: any) => { const x = new Date(base); x.setDate(x.getDate() + d); return { date: w.toDateStr(x), wt }; });
    const r = sex === undefined ? w.gvWeightJumpCheck(R) : w.gvWeightJumpCheck(R, sex);
    return { verdict: r.verdict, variant: r.variant, reason: r.reason, method: r.method, methods: r.pairs.map((p: any) => p.method),
      pairA: r.pair ? r.pair.a.wt : null, pairB: r.pair ? r.pair.b.wt : null, badRow: r.pair ? r.pair.badRow : null,
      changeG: r.pair ? r.pair.changeG : null };
  }, { rows, sex, dob: DOB });
}

// The weight at weight-for-age z0 on a given day of life (WHO_WFA_LMS, WHO clock).
async function wAtZ(page: any, day: number, z0: number, sex = 'f') {
  return page.evaluate(({ day, z0, sex }: any) => {
    const T = WHO_WFA_LMS[sex];
    const mo = day / 30.4375, i = Math.min(Math.floor(mo), 59), f = mo - i;
    const L = T[i][0] + (T[i + 1][0] - T[i][0]) * f, M = T[i][1] + (T[i + 1][1] - T[i][1]) * f, S = T[i][2] + (T[i + 1][2] - T[i][2]) * f;
    return Math.round(M * Math.pow(1 + L * S * z0, 1 / L) * 100) / 100;
  }, { day, z0, sex });
}

test("Ziva's case: 9.5 kg then 15.9 kg at 14 months is a jump; 9.5 then 9.9 is fine", async ({ page }) => {
  await boot(page);
  expect(await jump(page, [[395, 9.5], [425, 15.9]])).toMatchObject({ verdict: 'confirm', variant: 'jump-up', method: 'velocity' });
  expect(await jump(page, [[395, 9.5], [425, 9.9]])).toMatchObject({ verdict: 'ok' });
  expect(await jump(page, [[395, 9.5], [425, 5.9]])).toMatchObject({ verdict: 'confirm', variant: 'jump-down' });
});

test('continuity across 24 months: centile-tracking weights pass, a 9.5→15.9-type typo (×1.674) is caught, no pair is uncheckable', async ({ page }) => {
  test.setTimeout(300_000);   // ~800 page calls: both sexes × end ages 23–25 m × 6 gaps × 3 centiles × real/typo
  await boot(page);
  const seen: string[] = [];
  for (const sex of ['f', 'm']) {
    for (let end = Math.round(23 * 30.4375); end <= Math.round(25 * 30.4375); end += 6) {
      for (const gap of [1, 7, 30, 61, 91, 183]) {   // short gaps pin the seam step too (V-M-288-4, V-K-288-4)
        for (const z0 of [-1.88, 0, 1.88]) {
          const w0 = await wAtZ(page, end - gap, z0, sex), w1 = await wAtZ(page, end, z0, sex);
          const real = await jump(page, [[end - gap, w0], [end, w1]], sex);
          expect(real.verdict, `${sex} end ${end} gap ${gap} z0 ${z0}`).toBe('ok');
          seen.push(real.method);
          const typo = await jump(page, [[end - gap, w0], [end, Math.round(w1 * 1.674 * 10) / 10]], sex);
          expect(typo.verdict, `typo ${sex} end ${end} gap ${gap} z0 ${z0}`).toBe('confirm');
          expect(typo.variant).not.toBe('nocompare');
        }
      }
    }
  }
  expect(seen).not.toContain('nocompare');
  expect(seen).toContain('velocity');
  expect(seen).toContain('dz');
});

test('the method predicate, as a table', async ({ page }) => {
  await boot(page);
  const m = (d0: number, d1: number) => jump(page, [[d0, 9], [d1, 9.2]]);
  // [start day, end day] → method of the (only) pair
  const cases: [number, number, string][] = [
    [395, 425, 'velocity'],      // 13→14 m, 30 d
    [640, 730, 'velocity'],      // end ≤ 24.0 m, 90 d (3-month table)
    [640, 735, 'dz'],            // end past 24 m → Δz
    [366, 550, 'dz'],            // start 12.0 m, 184 d, end < 24 m
    [330, 450, 'nocompare'],     // start < 12 m and gap > 92 d
    [400, 585, 'nocompare'],     // 185 d
    [1700, 1826, 'dz'],          // end at the table's last day
  ];
  for (const [d0, d1, want] of cases) {
    const r = await m(d0, d1);
    expect(r.methods[0], `${d0}→${d1}`).toBe(want);
  }
});

test('Δz gaps: 184 days is checked, 185 is not; a weight at or above the previous never trips the loss side', async ({ page }) => {
  await boot(page);
  const z0 = 0.1;
  const w0 = await wAtZ(page, 913, z0), w1 = await wAtZ(page, 1097, z0);
  expect(await jump(page, [[913, w0], [1097, w1]])).toMatchObject({ verdict: 'ok', method: 'dz' });
  expect(await jump(page, [[913, w0], [1098, w1]])).toMatchObject({ verdict: 'confirm', variant: 'nocompare' });
  // Flat weight over 6 months at 2.5 years falls in z but is never a "loss".
  expect(await jump(page, [[913, w0], [1097, w0]])).toMatchObject({ verdict: 'ok' });
});

test('fails closed: no sex, one weight, no weights, past 60 months, an implausible earlier row, two weights on one date', async ({ page }) => {
  await boot(page, null);
  expect(await jump(page, [[395, 9.5], [425, 9.9]])).toMatchObject({ verdict: 'confirm', variant: 'nocompare' });
  await boot(page);
  expect(await jump(page, [[425, 9.9]])).toMatchObject({ verdict: 'confirm', variant: 'nocompare' });
  expect(await jump(page, [])).toMatchObject({ verdict: 'confirm' });
  expect(await jump(page, [[1800, 18], [1830, 18.2]])).toMatchObject({ verdict: 'confirm', variant: 'outofrange' });
  expect(await jump(page, [[395, 95], [425, 9.9]])).toMatchObject({ verdict: 'confirm', variant: 'implausible' });
  expect(await jump(page, [[395, 9.5], [425, 9.9], [425, 15.9]])).toMatchObject({ verdict: 'confirm', variant: 'samedate' });
  expect(await jump(page, [[395, 9.5], [425, 9.9], [425, 9.9]])).toMatchObject({ verdict: 'ok' });   // a duplicate entry, same value
});

test('a re-saved weight is never a comparison (V-V-288-1 / V-M-288-1 / V-K-288-1)', async ({ page }) => {
  await boot(page);
  expect(await jump(page, [[330, 15.9], [330, 15.9]])).toMatchObject({ verdict: 'confirm', variant: 'nocompare', reason: 'noprev' });
  expect(await jump(page, [[410, 9.5], [425, 15.9], [425, 15.9]])).toMatchObject({ verdict: 'confirm', variant: 'jump-up' });
  expect(await jump(page, [[300, 8.0], [330, 12.5], [330, 12.5]])).toMatchObject({ verdict: 'confirm', variant: 'jump-up' });   // under 12 m
  // A conflict anywhere on the latest date, not only in the row before it.
  expect(await jump(page, [[395, 9.5], [425, 15.9], [425, 9.9], [425, 9.9]])).toMatchObject({ verdict: 'confirm', variant: 'samedate' });
  expect(await jump(page, [[395, 9.5], [425, 9.9], [425, 10.6], [425, 10.6]])).toMatchObject({ verdict: 'confirm', variant: 'samedate' });
});

test('the same typo on two dates is compared with the weight before it, at any age (D5, V-K-288-3)', async ({ page }) => {
  await boot(page);
  expect(await jump(page, [[400, 9.5], [418, 15.9], [425, 15.9]])).toMatchObject({ verdict: 'confirm', variant: 'jump-up' });
  expect(await jump(page, [[300, 8.0], [320, 12.5], [330, 12.5]])).toMatchObject({ verdict: 'confirm', variant: 'jump-up' });
});

test('the decisive pair is reported, with which weight is off and the change (V-V-288-2..5, V-K-288-2)', async ({ page }) => {
  await boot(page);
  // An earlier typo-high row: the "drop" is measured against it — the screen must be able to name it.
  expect(await jump(page, [[380, 9.5], [420, 15.9], [425, 9.7]])).toMatchObject({ verdict: 'confirm', variant: 'jump-down', pairA: 15.9, pairB: 9.7, changeG: -6200 });
  expect(await jump(page, [[380, 9.5], [420, 95], [425, 9.7]])).toMatchObject({ verdict: 'confirm', variant: 'implausible', pairA: 95, badRow: 'a' });
  expect(await jump(page, [[395, 9.5], [425, 15.9]])).toMatchObject({ pairA: 9.5, pairB: 15.9, changeG: 6400 });
});

test('reasons name why a comparison was not possible (V-V-288-4)', async ({ page }) => {
  await boot(page, null);
  expect(await jump(page, [[395, 9.5], [425, 9.9]])).toMatchObject({ reason: 'nosex' });
  await boot(page);
  expect(await jump(page, [[425, 9.9]])).toMatchObject({ reason: 'noprev' });
  expect(await jump(page, [[400, 9.2], [600, 10.2]])).toMatchObject({ verdict: 'confirm', variant: 'nocompare', reason: 'gap' });
  expect(await jump(page, [[200, 7.5], [330, 8.6]])).toMatchObject({ verdict: 'confirm', variant: 'nocompare', reason: 'age' });
  expect(await jump(page, [[1800, 18], [1830, 18.2]])).toMatchObject({ variant: 'outofrange', reason: 'age' });
});

test('a pair starting on day 365 of life (WHO 12.0 m = 365.25 d) takes the Δz method (V-M-288-2)', async ({ page }) => {
  await boot(page);
  const w0 = await wAtZ(page, 365, 0), w1 = await wAtZ(page, 459, 0);
  expect(await jump(page, [[365, w0], [459, w1]])).toMatchObject({ verdict: 'ok', method: 'dz' });
});

test('residual by design: a +1 kg slip in the whole-kg digit passes the jump check at 30 days (PR 4 R1 is its backstop)', async ({ page }) => {
  // Spec §6: the accepted residual. The leftover-risk flow (decision C) reads it at the R1 weight question.
  await boot(page);
  expect(await jump(page, [[395, 9.5], [425, 10.5]])).toMatchObject({ verdict: 'ok' });
});

test('a gain still trips the up test on the Δz method (the loss guard never skips it)', async ({ page }) => {
  await boot(page);
  const w0 = await wAtZ(page, 913, 0);
  expect(await jump(page, [[913, w0], [1097, Math.round(w0 * 1.3 * 10) / 10]])).toMatchObject({ verdict: 'confirm', variant: 'jump-up', method: 'dz' });
});

test('a missing velocity table or a non-number weight fails closed (V-K-288-5)', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    const w = window as any;
    const saved = WHO_WT_VELOCITY.f[2];
    WHO_WT_VELOCITY.f[2] = undefined;
    let v;
    try { v = w.gvWeightJumpCheck([{ date: '2025-02-13', wt: 9.5 }, { date: '2025-03-15', wt: 9.9 }], 'f'); }
    finally { WHO_WT_VELOCITY.f[2] = saved; }
    const s = w.gvWeightJumpCheck([{ date: '2025-02-13', wt: '9.5' }, { date: '2025-03-15', wt: 9.9 }], 'f');
    return [v.verdict, v.reason, s.verdict, s.reason];
  });
  expect(r).toEqual(['confirm', 'norow', 'confirm', 'noprev']);
});

test('a typo entered twice is still caught against the weight a month back (D5)', async ({ page }) => {
  await boot(page);
  expect(await jump(page, [[380, 9.4], [418, 15.9], [425, 15.9]])).toMatchObject({ verdict: 'confirm', variant: 'jump-up' });
});

test('mixed pair (Cipher A-5): the window pair cannot be compared while the immediate pair can → confirm', async ({ page }) => {
  await boot(page);
  // 9 m → 13.3 m is out of every method; the 9-day pair before it is fine. Either failing asks.
  const r = await jump(page, [[274, 8.6], [397, 9.4], [406, 9.45]]);
  expect(r.verdict).toBe('confirm');
  expect(r.methods).toEqual(['nocompare', 'velocity']);
});

test('the check never throws: bad input reads confirm/error', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    const w = window as any;
    return [w.gvWeightJumpCheck([{ date: 'x', wt: 9 }, { date: '2025-03-01', wt: 9.2 }], 'f').verdict,
      w.gvWeightJumpCheck([{ date: '2025-02-01', wt: 0 }, { date: '2025-03-01', wt: 9.2 }], 'f').verdict,
      w.gvWeightJumpCheck(null, 'f').verdict];
  });
  expect(r).toEqual(['confirm', 'confirm', 'confirm']);
});

test('an earlier date holding two different weights: both are compared (V-CA-288-2)', async ({ page }) => {
  await boot(page);
  // Both earlier weights are paired; 10.6 kg is believable against either, so it passes on both.
  const both = await page.evaluate(() => {
    const w = window as any;
    const r = w.gvWeightJumpCheck([{ date: '2025-01-30', wt: 9.5 }, { date: '2025-01-30', wt: 10.5 }, { date: '2025-03-16', wt: 10.6 }], 'f');
    return { verdict: r.verdict, prevs: r.pairs.map((p: any) => p.a.wt).sort() };
  });
  expect(both).toEqual({ verdict: 'ok', prevs: [10.5, 9.5].sort() });
  // One of the two earlier weights makes the latest look wrong → ask.
  expect(await jump(page, [[380, 9.5], [380, 15.9], [425, 9.7]])).toMatchObject({ verdict: 'confirm' });
});

test('boundaries: 2- → 3-month table at 61/62 days, the 24 m end at day 730/731, and the knot limits (V-CA-288-5)', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    const w = window as any;
    const lim = (g: number) => { const x = w._gvDzLimits('f', g); return x ? [Math.round(x.up * 1000) / 1000, Math.round(x.down * 1000) / 1000] : null; };
    return { l0: lim(0), l60: lim(60), l61: lim(61), l62: lim(62), l183: lim(183), l184: lim(184), l185: lim(185), lneg: lim(-1), lnan: lim(NaN) };
  });
  expect(r).toEqual({ l0: [0.53, 0.54], l60: [0.53, 0.54], l61: [0.53, 0.54], l62: [0.533, 0.542], l183: [0.84, 0.81], l184: [0.84, 0.81], l185: null, lneg: null, lnan: null });
  // 61 days → 2-month row (P99 1142 g at 12–14 m, girls); 62 → 3-month row (P99 1500 g at 12–15 m).
  const w0 = 9.0;
  expect(await jump(page, [[372, w0], [433, w0 + 1.3]])).toMatchObject({ verdict: 'confirm', method: 'velocity' });   // 61 d: +1.3 kg > 1142 g
  expect(await jump(page, [[372, w0], [434, w0 + 1.3]])).toMatchObject({ verdict: 'ok', method: 'velocity' });        // 62 d: +1.3 kg ≤ 1500 g
  // End day 730 is still velocity (≤ 24.0 m on the WHO clock); 731 is Δz.
  expect((await jump(page, [[700, 11], [730, 11.2]])).method).toBe('velocity');
  expect((await jump(page, [[701, 11], [731, 11.2]])).method).toBe('dz');
});

test('badRow names only a weight that is off; age and date problems carry a reason (Cipher #288 A1)', async ({ page }) => {
  await boot(page);
  expect(await jump(page, [[1800, 18], [1830, 18.2]])).toMatchObject({ variant: 'outofrange', reason: 'age', badRow: null });
  expect(await jump(page, [[-10, 3.3], [30, 4.2]])).toMatchObject({ verdict: 'confirm', variant: 'implausible', reason: 'dob', badRow: null });
  expect(await jump(page, [[380, 95], [425, 9.7]])).toMatchObject({ variant: 'implausible', reason: null, badRow: 'a' });
});
