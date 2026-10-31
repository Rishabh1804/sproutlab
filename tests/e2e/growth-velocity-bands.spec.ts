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
      const ages = [0, 1.6, 1.9, 2, 3, 4, 5, 6, 8, 9, 11, 11.6, 12, 17.9, 18, 30];
      const girl = ages.map(a => pick(w.growthVelocityBand(a)));
      w._profSave(Object.assign({}, profile.child, { sex: 'm' }), profile.place);
      const boy = ages.map(a => pick(w.growthVelocityBand(a)));
      return { girl, boy, rows: { f: GROWTH_VELOCITY_BANDS.f.length, m: GROWTH_VELOCITY_BANDS.m.length } };
    });
    // Under 6 m: one-month rows, each from the single WHO 2-month interval centred on its first month
    // (row m–(m+1) ← interval (m−1)–(m+1); row 0–1 ← 0–2) — PC-1, bug #27.
    const G = {
      r0: ['0–1 months', 165, 275, 23.8, 39.2, 3.35, 4.55], r1: ['1–2 months', 165, 275, 23.8, 39.2, 3.35, 4.55],
      r2: ['2–3 months', 150, 250, 21.5, 35.5, 2.7, 3.7], r3: ['3–4 months', 110, 195, 16, 27.6, 2.1, 3.05],
      r4: ['4–5 months', 85, 165, 12.6, 23.2, 1.7, 2.6], r5: ['5–6 months', 65, 140, 9.8, 19.7, 1.35, 2.25],
      b6: ['6–9 months', 35, 125, 5, 17.2, 1.0, 2.0],
      b9: ['9–12 months', 20, 95, 2.9, 13.4, 0.8, 1.8],
      t1: ['12–18 months', 10, 90, 1.7, 12.3, 0.65, 1.6], t2: ['18–24 months', 0, 90, 0.6, 12.4, 0.45, 1.45],
    };
    const B = {
      r0: ['0–1 months', 195, 315, 28.1, 44.9, 3.65, 4.85], r1: ['1–2 months', 195, 315, 28.1, 44.9, 3.65, 4.85],
      r2: ['2–3 months', 175, 285, 25.3, 40.4, 3.0, 4.0], r3: ['3–4 months', 120, 210, 17.7, 29.9, 2.3, 3.3],
      r4: ['4–5 months', 90, 175, 13.4, 24.6, 1.75, 2.75], r5: ['5–6 months', 70, 150, 10.3, 21, 1.4, 2.35],
      b6: ['6–9 months', 35, 130, 5.2, 18, 1.0, 2.1],
      b9: ['9–12 months', 20, 100, 3, 14, 0.8, 1.8],
      t1: ['12–18 months', 5, 90, 1.3, 12.9, 0.55, 1.6], t2: ['18–24 months', 5, 85, 0.8, 12.1, 0.45, 1.4],
    };
    // Completed months bracket the age (1.6 → 1–2, never the gentler 2–3), except 11.5+ → the toddler row (V-M-282-9).
    const expectFor = (S: any) => [S.r0, S.r1, S.r1, S.r2, S.r3, S.r4, S.r5, S.b6, S.b6, S.b9, S.b9, S.t1, S.t1, S.t1, S.t2, S.t2];
    expect(r.girl).toEqual(expectFor(G));
    expect(r.boy).toEqual(expectFor(B));
    expect(r.rows).toEqual({ f: 10, m: 10 });   // six one-month rows to 6 m, then 6–9, 9–12, 12–18, 18–24
  });

  test('the bands cover WHO P15–P85 where the old copied bands did not', async ({ page }) => {
    const r = await page.evaluate(() => {
      const w = window as any;
      const girl9 = w.growthVelocityBand(10);
      w._profSave(Object.assign({}, profile.child, { sex: 'm' }), profile.place);
      const boy0 = w.growthVelocityBand(1);
      const ordered = ['f', 'm'].every(s => GROWTH_VELOCITY_BANDS[s].every((b: any) =>
        b.wGWkMin <= b.wGWkMedian && b.wGWkMedian < b.wGWkMax && b.wGDayMin < b.wGDayMax && b.hCmMoMin < b.hCmMoMax));
      return { girl9Min: girl9.wGWkMin, boy0Max: boy0.wGWkMax, boy0Median: boy0.wGWkMedian, ordered };
    });
    expect(r.boy0Max).toBeGreaterThanOrEqual(300);   // WHO boys 0–2 m P85 ≈ 314 g/week (old max 250)
    expect(r.boy0Median).toBeGreaterThan(250);       // boys' median ≈ 255 g/week sits inside the band
    expect(r.girl9Min).toBeLessThanOrEqual(25);      // WHO girls 9–12 m P15 ≈ 21 g/week (old min 55)
    expect(r.ordered).toBe(true);
  });

  test('a bracket floor sits at P15 of the interval that applies, not P3–P5 (bug #27)', async ({ page }) => {
    const r = await page.evaluate(() => {
      const w = window as any;
      return { girl4: w.growthVelocityBand(4.0).wGWkMin, girl3: w.growthVelocityBand(3.0).wGWkMin };
    });
    // WHO girls 3–5 mo P15 = 773 g / 61 d ≈ 89 g/week → 85 (was 65, from the 4–6 interval's P15).
    expect(r.girl4).toBe(85);
    // WHO girls 2–4 mo P15 = 978 g ≈ 112 g/week → 110.
    expect(r.girl3).toBe(110);
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

// PC-1 "time & age semantics" (bugs #25, #27, #55, #56). The fixture child is the invented girl;
// tests that need a particular age move her birth date with _profSave and replace growthData.
declare let growthData: any;

for (const tz of ['Asia/Kolkata', 'America/Los_Angeles']) {
  test.describe(`PC-1: ageMonthsAt reads a date as a local calendar day (${tz})`, () => {
    test.use({ timezoneId: tz });
    test.beforeEach(async ({ page }) => {
      await page.goto('/index.html?nosync');
      await page.waitForFunction(() => typeof (window as any).ageMonthsAt === 'function', null, { timeout: 15_000 });
    });

    test('a YYYY-MM-DD age is whole calendar days from the birth date, in any timezone (bug #55)', async ({ page }) => {
      const r = await page.evaluate(() => {
        const w = window as any;
        // Fixture DOB: 2025-09-01T09:00 local. 1 Nov is 61 calendar days later (30 + 31).
        const mo = w.ageMonthsAt('2025-11-01');
        return {
          days: mo * 30.44, band: w.growthVelocityBand(mo).label,
          birthDay: w.ageMonthsAt('2025-09-01'),
          instant: w.ageMonthsAt('2025-09-02T09:00') * 30.44,   // a full date-time stays an instant
        };
      });
      // new Date('2025-11-01') was UTC midnight: 60.85 days in IST, 60.33 in Los Angeles — both read
      // the 1–2 m row for a weigh-in on the 2-month day.
      expect(r.days).toBeCloseTo(61, 9);
      expect(r.band).toBe('2–3 months');
      expect(r.birthDay).toBe(0);
      expect(r.instant).toBeCloseTo(1, 6);
    });
  });
}

test.describe('PC-1: velocity verdicts at the latest measurement, and the newborn window', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as any).growthVelocityBand === 'function', null, { timeout: 15_000 });
  });

  test('a 10-day-old who has lost weight is never called slow, a plateau or below range (bug #27)', async ({ page }) => {
    const r = await page.evaluate(() => {
      const w = window as any;
      const now = new Date();
      const day = (n: number) => w.toDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() + n));
      const setup = (ageDays: number) => {
        w._profSave(Object.assign({}, profile.child, { dob: day(-ageDays), sex: 'f' }), profile.place);
        // Birth weight 3.40 kg; 3.25 kg today: a 150 g dip.
        growthData = [{ date: day(-ageDays), wt: 3.40 }, { date: day(0), wt: 3.25 }];
        const gv = w.getGrowthVelocity();
        const cgv = w.computeGrowthVelocity().weight;
        const qa = w.qaAnswerWeightGain('weight_gain');
        return {
          verdict: w.gvWeightVerdict(gv.wtGPerWeek, w.gvAgeAt(gv.wtLatest)),
          status: cgv.status, newborn: cgv.newborn, isPlateau: cgv.isPlateau,
          narrative: w.getGrowthNarrative(gv).join(' | '),
          qa: qa.headline + ' | ' + JSON.stringify(qa.sections),
        };
      };
      return { d10: setup(10), d20: setup(20) };
    });
    expect(r.d10.verdict).toBe('newborn');
    expect(r.d10.status).toBe('newborn');
    expect(r.d10.newborn).toBe(true);
    expect(r.d10.isPlateau).toBe(false);
    expect(r.d10.narrative).toContain('Early days');
    expect(r.d10.narrative).not.toMatch(/slow|plateau|below/i);
    expect(r.d10.qa).not.toMatch(/slow|plateau|below/i);
    // The carve-out ends at day 14: the same dip at 20 days is flagged.
    expect(r.d20.verdict).toBe('below');
    expect(['slow', 'plateau']).toContain(r.d20.status);
    expect(r.d20.narrative).toContain('below typical range');
  });

  test('Home and the Growth tab agree at a bracket edge: judged at the weigh-in age, not today (bug #25)', async ({ page }) => {
    const r = await page.evaluate(() => {
      const w = window as any;
      const now = new Date();
      const day = (n: number) => w.toDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() + n));
      // A girl about 4.1 months old (125 days) whose latest weigh-in was at about 3.9 months (day 119).
      w._profSave(Object.assign({}, profile.child, { dob: day(-125), sex: 'f' }), profile.place);
      // 720 g over 28 days = 180 g/week: inside the 3–4 m band (110–195), above the 4–5 m one (85–165).
      growthData = [{ date: day(-125), wt: 3.30 }, { date: day(-34), wt: 5.50 }, { date: day(-6), wt: 6.22 }];
      const gv = w.getGrowthVelocity();
      const cgv = w.computeGrowthVelocity().weight;
      w.renderTrendChips();
      const el = document.getElementById('trendChipsContainer');
      return {
        todayMonths: w.ageAt().months, weighInMonths: Math.floor(w.gvAgeAt(gv.wtLatest)),
        gPerWeek: gv.wtGPerWeek,
        home: w.gvWeightVerdict(gv.wtGPerWeek, w.gvAgeAt(gv.wtLatest)),
        narrative: w.getGrowthNarrative(gv).join(' | '),
        growthTab: cgv.status, growthTabLabel: cgv.expectedRange.label,
        chip: el ? el.textContent : '',
      };
    });
    expect(r.todayMonths).toBe(4);
    expect(r.weighInMonths).toBe(3);
    expect(r.gPerWeek).toBe(180);
    expect(r.growthTabLabel).toBe('3–4 months');
    expect(r.growthTab).toBe('on-track');
    expect(r.home).toBe('in');                       // today's age (the 4–5 m row) called this "above"
    expect(r.narrative).toContain('healthy pace');
    expect(r.chip).toContain('healthy');
  });

  test('the CareTicket weight goal uses the median for the latest weigh-in age (bug #56)', async ({ page }) => {
    const r = await page.evaluate(() => {
      const w = window as any;
      const now = new Date();
      const day = (n: number) => w.toDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() + n));
      // Weigh-in at day 119 (≈ 3.9 months); today day 125 (≈ 4.1 months).
      w._profSave(Object.assign({}, profile.child, { dob: day(-125), sex: 'f' }), profile.place);
      growthData = [{ date: day(-125), wt: 3.30 }, { date: day(-34), wt: 5.50 }, { date: day(-6), wt: 6.22 }];
      const goal = w.CT_TEMPLATES.weight_gain.resolutionCriteria.value();
      const rows = GROWTH_VELOCITY_BANDS.f;
      const median = (label: string) => rows.find((b: any) => b.label === label).wGWkMedian;
      return { goal, m34: median('3–4 months'), m45: median('4–5 months'), today: w.ageAt().months };
    });
    expect(r.today).toBe(4);
    expect(r.m34).toBe(150);   // WHO girls 2–4 mo P50 1307 g / 61 d
    expect(r.m45).toBe(125);   // WHO girls 3–5 mo P50 1074 g / 61 d
    expect(r.goal).toBe(r.m34);
  });
});
