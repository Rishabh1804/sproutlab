import { test, expect } from '@playwright/test';
declare const GROWTH_VELOCITY_BANDS: any; declare const GROWTH_VELOCITY_12_24: any; declare let profile: any;

// child-sex v1 S4 (docs/specs/child-sex-v1.md §5) — one WHO-derived, sex-keyed source for the
// growth-velocity bands. The fixture child is an invented girl born 2025-09-01 (HR-13). Hermetic (?nosync).

test.describe('child-sex S4: growth-velocity bands', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as any).growthVelocityBand === 'function', null, { timeout: 15_000 });
  });

  test('the helper returns the WHO P15–P85 band for each sex and bracket', async ({ page }) => {
    const r = await page.evaluate(() => {
      const w = window as any;
      const pick = (b: any) => [b.label, b.wGWkMin, b.wGWkMax, b.wGDayMin, b.wGDayMax, b.hCmMoMin, b.hCmMoMax];
      const ages = [0, 1.9, 2, 3, 4, 5, 6, 8, 9, 11, 12, 18, 30];
      const girl = ages.map(a => pick(w.growthVelocityBand(a)));
      const girl12 = w.growthVelocityBand(12);
      w._profSave(Object.assign({}, profile.child, { sex: 'm' }), profile.place);
      const boy = ages.map(a => pick(w.growthVelocityBand(a)));
      const boy12 = w.growthVelocityBand(12);
      return { girl, boy, shared: girl12 === boy12 && boy12 === GROWTH_VELOCITY_12_24,
        rows: { f: GROWTH_VELOCITY_BANDS.f.length, m: GROWTH_VELOCITY_BANDS.m.length } };
    });
    const G = {
      b0: ['0–2 months', 165, 275, 23, 40, 3.3, 4.6], b2: ['2–4 months', 110, 250, 16, 36, 2.1, 3.7],
      b4: ['4–6 months', 65, 165, 9, 24, 1.3, 2.6], b6: ['6–9 months', 35, 125, 5, 18, 1.0, 2.0],
      b9: ['9–12 months', 20, 95, 2, 14, 0.8, 1.8],
    };
    const B = {
      b0: ['0–2 months', 195, 315, 28, 45, 3.6, 4.9], b2: ['2–4 months', 120, 285, 17, 41, 2.3, 4.0],
      b4: ['4–6 months', 70, 175, 10, 25, 1.4, 2.8], b6: ['6–9 months', 35, 130, 5, 18, 1.0, 2.1],
      b9: ['9–12 months', 20, 100, 3, 14, 0.8, 1.8],
    };
    const T = ['12–24 months', 20, 85, 3, 12, 0.45, 1.6];
    const expectFor = (S: any) => [S.b0, S.b0, S.b2, S.b2, S.b4, S.b4, S.b6, S.b6, S.b9, S.b9, T, T, T];
    expect(r.girl).toEqual(expectFor(G));
    expect(r.boy).toEqual(expectFor(B));
    expect(r.shared).toBe(true);           // from 12 m one band fits both sexes
    expect(r.rows).toEqual({ f: 6, m: 6 });
  });

  test('the bands cover WHO P15–P85 where the old copied bands did not', async ({ page }) => {
    const r = await page.evaluate(() => {
      const w = window as any;
      const girl9 = w.growthVelocityBand(10);
      w._profSave(Object.assign({}, profile.child, { sex: 'm' }), profile.place);
      const boy0 = w.growthVelocityBand(1);
      const ordered = ['f', 'm'].every(s => GROWTH_VELOCITY_BANDS[s].every((b: any) =>
        b.wGWkMin < b.wGWkMedian && b.wGWkMedian < b.wGWkMax && b.wGDayMin < b.wGDayMax && b.hCmMoMin < b.hCmMoMax));
      return { girl9Min: girl9.wGWkMin, boy0Max: boy0.wGWkMax, boy0Median: boy0.wGWkMedian, ordered };
    });
    expect(r.boy0Max).toBeGreaterThanOrEqual(300);   // WHO boys 0–2 m P85 ≈ 314 g/week (old max 250)
    expect(r.boy0Median).toBeGreaterThan(250);       // boys' median ≈ 255 g/week sits inside the band
    expect(r.girl9Min).toBeLessThanOrEqual(25);      // WHO girls 9–12 m P15 ≈ 21 g/week (old min 55)
    expect(r.ordered).toBe(true);
  });

  test('the growth narrative reads a normal infant as healthy, by sex', async ({ page }) => {
    const r = await page.evaluate(() => {
      const w = window as any;
      const now = new Date();
      // Local-calendar dates (HR-12): a girl of 10 months and a half, then a boy of 1 month and a half.
      const dobAgo = (months: number) => w.toDateStr(new Date(now.getFullYear(), now.getMonth() - months, now.getDate() - 15));
      w._profSave(Object.assign({}, profile.child, { dob: dobAgo(10), sex: 'f' }), profile.place);
      const girlAge = w.ageAt().months;
      const girl = w.getGrowthNarrative({ wtGPerWeek: 40, wtDays: 28, htCmPerMonth: 0.9 }).join(' | ');
      w._profSave(Object.assign({}, profile.child, { dob: dobAgo(1), sex: 'm' }), profile.place);
      const boyAge = w.ageAt().months;
      const boy = w.getGrowthNarrative({ wtGPerWeek: 260, wtDays: 28 }).join(' | ');
      const boySlow = w.getGrowthNarrative({ wtGPerWeek: 150, wtDays: 28 }).join(' | ');
      return { girlAge, girl, boyAge, boy, boySlow };
    });
    expect(r.girlAge).toBe(10);
    expect(r.girl).toContain('gaining 40g/week — healthy pace');   // old band 55–100 called this "below"
    expect(r.girl).toContain('growing 0.9 cm/month — on track');
    expect(r.boyAge).toBe(1);
    expect(r.boy).toContain('gaining 260g/week — healthy pace');   // old band 150–250 called this "above"
    expect(r.boySlow).toContain('below typical range (195–315g/week)');
  });
});
