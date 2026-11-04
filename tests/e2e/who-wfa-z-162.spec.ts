import { test, expect } from '@playwright/test';

// #161 PR 1 / BUGS #162: WHO weight-for-age z to 60 months (spec docs/specs/paracetamol-weight-check-v1.md §4.1).
// whoWfaZ reads WHO_WFA_LMS (monthly L/M/S) with WHO's restricted z beyond ±3; the references below are
// WHO's own daily expanded z tables (wfa-{girls,boys}-zscore-expanded-tables.xlsx, fetched 2026-11-04),
// an independent source from the monthly file the registry is copied from. paraWeightPlausible moves onto
// it, so past age 2 a weight is no longer read against a 2-year-old's chart.
// QA chain canon-cc-008: Carina (data.js, core.js), Kael (intelligence-illness.js), Maren (consequence).

// [sex, day, [SD4neg, SD3neg, SD2neg, SD0, SD2, SD3, SD4]] from the WHO daily tables.
const REF: [string, number, number[]][] = [
  ['f', 365, [5.505, 6.273, 7.041, 8.946, 11.506, 13.114, 14.721]],
  ['f', 730, [7.094, 8.064, 9.033, 11.474, 14.841, 17.008, 19.175]],
  ['f', 1095, [8.415, 9.608, 10.802, 13.846, 18.131, 20.942, 23.752]],
  ['f', 1461, [9.441, 10.882, 12.323, 16.07, 21.508, 25.17, 28.832]],
  ['f', 1826, [10.364, 12.053, 13.742, 18.218, 24.914, 29.545, 34.176]],
  ['m', 365, [6.111, 6.926, 7.741, 9.646, 11.983, 13.341, 14.7]],
  ['m', 730, [7.59, 8.63, 9.67, 12.148, 15.272, 17.128, 18.984]],
  ['m', 1095, [8.752, 10.014, 11.276, 14.339, 18.307, 20.719, 23.13]],
  ['m', 1461, [9.767, 11.24, 12.713, 16.349, 21.181, 24.178, 27.176]],
  ['m', 1826, [10.671, 12.369, 14.067, 18.335, 24.163, 27.861, 31.56]],
];
const ZS = [-4, -3, -2, 0, 2, 3, 4];

async function boot(page: any) {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
}
// Born `days` ago, with the given sex (null = not yet given).
async function child(page: any, days: number, sex: string | null) {
  await page.evaluate(({ days, sex }: any) => {
    const w = window as any;
    const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - days);
    w._profSave(Object.assign({}, profile.child, { dob: w.toDateStr(d), sex }), profile.place);
  }, { days, sex });
}

test('whoWfaZ matches the WHO daily SD lines, incl. restricted z at ±4, at 1–5 years, both sexes', async ({ page }) => {
  await boot(page);
  const got = await page.evaluate((REF: any) => {
    const w = window as any;
    return REF.map(([sex, day, sds]: any) => {
      const mo = day / 30.4375;
      return sds.map((wt: number) => w.whoWfaZ(wt, mo, sex));
    });
  }, REF);
  got.forEach((zs: number[], r: number) => zs.forEach((z, k) => {
    expect(Math.abs(z - ZS[k]), `${REF[r][0]} day ${REF[r][1]} SD${ZS[k]}`).toBeLessThan(0.01);
  }));
});

test('whoWfaZ fails closed: unknown sex, bad weight, age outside 0–60 m all give NaN', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    const w = window as any;
    return [w.whoWfaZ(10, 24, null), w.whoWfaZ(10, 24, 'x'), w.whoWfaZ(0, 24, 'f'), w.whoWfaZ(-3, 24, 'f'),
      w.whoWfaZ('10', 24, 'f'), w.whoWfaZ(NaN, 24, 'f'), w.whoWfaZ(10, -0.1, 'f'), w.whoWfaZ(10, 60.01, 'f'), w.whoWfaZ(10, NaN, 'f')]
      .map((z: number) => Number.isNaN(z));
  });
  expect(r.every(Boolean)).toBe(true);
});

test('whoAgeMoAt: WHO days/30.4375 clock; NaN before birth or past day 1826', async ({ page }) => {
  await boot(page);
  await child(page, 1826, 'f');
  const r = await page.evaluate(() => {
    const w = window as any;
    const iso = (off: number) => { const d = new Date(); d.setDate(d.getDate() + off); return w.toDateStr(d); };
    return { today: w.whoAgeMoAt(iso(0)), tomorrow: w.whoAgeMoAt(iso(1)), atBirthMinus1: w.whoAgeMoAt(iso(-1827)), bad: w.whoAgeMoAt('2026-02-31') };
  });
  expect(r.today).toBeCloseTo(1826 / 30.4375, 6);
  expect(Number.isNaN(r.tomorrow)).toBe(true);
  expect(Number.isNaN(r.atBirthMinus1)).toBe(true);
  expect(Number.isNaN(r.bad)).toBe(true);
});

test('#162: a real P97 weight at 3, 4 and 5 years is plausible; a decimal-slip typo is not', async ({ page }) => {
  await boot(page);
  for (const [days, p97] of [[1095, 17.8], [1461, 21.5], [1826, 24.4]] as [number, number][]) {
    await child(page, days, 'f');
    const r = await page.evaluate((p97: number) => {
      const w = window as any;
      const t = w.toDateStr(new Date());
      return { real: w.paraWeightPlausible(p97, t), slip: w.paraWeightPlausible(p97 * 10, t), tiny: w.paraWeightPlausible(p97 / 10, t) };
    }, p97);
    expect(r, `day ${days}`).toEqual({ real: true, slip: false, tiny: false });
  }
});

test('#162: the plausibility gate fails closed past 60 months and needs both tables with no sex', async ({ page }) => {
  await boot(page);
  await child(page, 1830, 'f');
  const past = await page.evaluate(() => (window as any).paraWeightPlausible(18, (window as any).toDateStr(new Date())));
  expect(past).toBe(false);
  // 14 months, no sex given: 9.5 kg passes on both tables; 95 kg on neither.
  await child(page, 425, null);
  const r = await page.evaluate(() => {
    const w = window as any; const t = w.toDateStr(new Date());
    return [w.paraWeightPlausible(9.5, t), w.paraWeightPlausible(95, t)];
  });
  expect(r).toEqual([true, false]);
});

test('#162: the fever chip doses a 4-year-old normally (no "looks off for her age")', async ({ page }) => {
  await boot(page);
  await child(page, 1461, 'f');
  const state = await page.evaluate(() => {
    const w = window as any;
    const d = new Date(); d.setDate(d.getDate() - 3);
    growthData = [{ date: w.toDateStr(d), wt: 17.5 }];
    _feverEpisodes = [{ id: 'fe-4y', status: 'active', startedAt: new Date(Date.now() - 6 * 3600000).toISOString(), resolvedAt: null,
      readings: [{ temp: 101.4, time: new Date().toISOString(), notes: '' }], doses: [], actions: [], peakTemp: 101.4,
      triggerSource: 'test', notes: '', resolvedNotes: '' }];
    _feParaForm = 'syrup120'; _feParaFormEp = 'fe-4y';
    const chip = w.getParacetamolChip(w.getLatestWeight());
    return chip && chip.state;
  });
  expect(state).toBe('ok');
});
