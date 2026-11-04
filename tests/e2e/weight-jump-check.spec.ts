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
    return { verdict: r.verdict, variant: r.variant, method: r.method, methods: r.pairs.map((p: any) => p.method) };
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

test('continuity across 24 months: centile-tracking weights pass, a one-digit typo is caught, no pair is uncheckable', async ({ page }) => {
  test.setTimeout(180_000);   // ~400 page calls: both sexes × end ages 23–25 m × 3 gaps × 3 centiles × real/typo
  await boot(page);
  const seen: string[] = [];
  for (const sex of ['f', 'm']) {
    for (let end = Math.round(23 * 30.4375); end <= Math.round(25 * 30.4375); end += 6) {
      for (const gap of [61, 91, 183]) {
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
