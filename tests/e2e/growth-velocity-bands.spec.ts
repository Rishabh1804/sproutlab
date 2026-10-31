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
    // 0–12 m weight: one-month rows from WHO's 1-month increment tables (row m–(m+1) = interval
    // m–(m+1); row 0–1 = "0–4 wks", 28 d; row 1–2 = "4 wks–2 mo") — V-CA-282b-1. Length stays on the
    // 2-month tables.
    const G = {
      r0: ['0–1 months', 150, 295, 21.5, 41.9, 3.35, 4.55], r1: ['1–2 months', 155, 280, 22.3, 39.6, 3.35, 4.55],
      r2: ['2–3 months', 110, 220, 16.2, 31.3, 2.7, 3.7], r3: ['3–4 months', 85, 185, 12.3, 26.5, 2.1, 3.05],
      r4: ['4–5 months', 65, 165, 9.3, 23.1, 1.7, 2.6], r5: ['5–6 months', 45, 145, 6.6, 20.1, 1.35, 2.25],
      r6: ['6–7 months', 30, 130, 4.7, 18.3, 1.0, 2.0], r8: ['8–9 months', 15, 115, 2.2, 16.1, 1.0, 2.0],
      r9: ['9–10 months', 5, 110, 1.3, 15.3, 0.8, 1.8], r11: ['11–12 months', 0, 110, 0.4, 15.4, 0.8, 1.8],
      t1: ['12–18 months', 10, 90, 1.7, 12.3, 0.65, 1.6], t2: ['18–24 months', 0, 90, 0.6, 12.4, 0.45, 1.45],
    };
    const B = {
      r0: ['0–1 months', 170, 335, 24.3, 47.8, 3.65, 4.85], r1: ['1–2 months', 185, 325, 26.9, 46.4, 3.65, 4.85],
      r2: ['2–3 months', 130, 250, 18.9, 35.2, 3.0, 4.0], r3: ['3–4 months', 90, 195, 13.2, 27.8, 2.3, 3.3],
      r4: ['4–5 months', 70, 175, 10.2, 24.6, 1.75, 2.75], r5: ['5–6 months', 45, 150, 7.1, 21.1, 1.4, 2.35],
      r6: ['6–7 months', 35, 135, 5, 18.9, 1.0, 2.1], r8: ['8–9 months', 15, 120, 2.5, 16.7, 1.0, 2.1],
      r9: ['9–10 months', 10, 115, 1.5, 16, 0.8, 1.8], r11: ['11–12 months', 0, 115, 0.4, 16, 0.8, 1.8],
      t1: ['12–18 months', 5, 90, 1.3, 12.9, 0.55, 1.6], t2: ['18–24 months', 5, 85, 0.8, 12.1, 0.45, 1.4],
    };
    // Completed months bracket the age (1.6 → 1–2, never the gentler 2–3), except 11.5+ → the toddler row (V-M-282-9).
    const expectFor = (S: any) => [S.r0, S.r1, S.r1, S.r2, S.r3, S.r4, S.r5, S.r6, S.r8, S.r9, S.r11, S.t1, S.t1, S.t1, S.t2, S.t2];
    expect(r.girl).toEqual(expectFor(G));
    expect(r.boy).toEqual(expectFor(B));
    expect(r.rows).toEqual({ f: 14, m: 14 });   // twelve one-month rows to 12 m, then 12–18, 18–24
  });

  test('the cm/week text is rounded outward, so it never sits inside the band (V-CA-282b-5)', async ({ page }) => {
    const bad = await page.evaluate(() => ['f', 'm'].flatMap(s => GROWTH_VELOCITY_BANDS[s].filter((b: any) => {
      const [lo, hi] = b.hCmWk.split('–').map(Number);
      return lo > b.hCmMoMin / 4.348 + 1e-9 || hi < b.hCmMoMax / 4.348 - 1e-9;
    }).map((b: any) => s + ' ' + b.label)));
    expect(bad).toEqual([]);
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

  test('a row floor is P15 of the WHO 1-month interval, so a P25 gain is in range (bug #27, V-CA-282b-1)', async ({ page }) => {
    const r = await page.evaluate(() => {
      const w = window as any;
      return {
        girl4: w.growthVelocityBand(4.0).wGWkMin, girl3: w.growthVelocityBand(3.0).wGWkMin,
        // Carina's repros: ≈ the WHO 1-month P25 at the end of a row read "below" on the 2-month rows.
        g29: w.gvWeightVerdict(130, 2.9), g49: w.gvWeightVerdict(80, 4.9),
      };
    });
    expect(r.girl4).toBe(65);    // WHO girls 4–5 mo P15 = 286 g / 30.44 d ≈ 65.8 g/week
    expect(r.girl3).toBe(85);    // WHO girls 3–4 mo P15 = 376 g ≈ 86.5 g/week
    expect(r.g29).toBe('in');    // was "below (150–250)"
    expect(r.g49).toBe('in');    // was "below (85–165)"
  });

  test('a weight velocity is judged at its window midpoint (V-CA-282b-1)', async ({ page }) => {
    const r = await page.evaluate(() => {
      const w = window as any;
      const now = new Date();
      const day = (n: number) => w.toDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() + n));
      // A girl weighed at day 65 (2.1 m) and day 93 (3.06 m): the window's midpoint is 2.6 m.
      w._profSave(Object.assign({}, profile.child, { dob: day(-93), sex: 'f' }), profile.place);
      // 800 g over 28 days = 200 g/week: inside 2–3 m (110–220), above 3–4 m (85–185).
      growthData = [{ date: day(-93), wt: 3.30 }, { date: day(-28), wt: 5.00 }, { date: day(0), wt: 5.80 }];
      const gv = w.getGrowthVelocity();
      const cgv = w.computeGrowthVelocity().weight;
      return { g: gv.wtGPerWeek, verdict: w.gvVelocityVerdict(gv), label: cgv.expectedRange.label, status: cgv.status };
    });
    expect(r.g).toBe(200);
    expect(r.verdict).toBe('in');
    expect(r.label).toBe('2–3 months');
    expect(r.status).toBe('on-track');
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
      const boyLoss = w.getGrowthNarrative({ wtGPerWeek: -20, wtDays: 28 }).join(' | ');
      return { girlAge, girl, boyAge, boy, boySlow, boyLoss };
    });
    expect(r.girlAge).toBe(10);
    expect(r.girl).toContain('gaining 40g/week — healthy pace');   // old band 55–100 called this "below"
    expect(r.girl).toContain('growing 0.9 cm/month — on track');
    expect(r.boyAge).toBe(1);
    expect(r.boy).toContain('gaining 260g/week — healthy pace');   // old band 150–250 called this "above"
    expect(r.boySlow).toContain('below typical range (185–325g/week)');
    expect(r.boyLoss).toContain('down 20g/week — below typical range');   // never "gaining -20g/week"
    expect(r.boyLoss).not.toMatch(/gaining -/);
  });
});

// PC-1 "time & age semantics" (bugs #25, #27, #55, #56). The fixture child is the invented girl;
// tests that need a particular age move her birth date with _profSave and replace growthData.
declare let growthData: any; declare let _cachedBaselines: any; declare const KEYS: any;

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
          verdict: w.gvVelocityVerdict(gv),
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
    // From day 14 the same dip means not back to birth weight yet — judged against birth weight,
    // not as a rate (V-M-282b-2), and with no food advice under 6 months (V-M-282b-3, V-K-282b-4).
    expect(r.d20.verdict).toBe('not-regained');
    expect(r.d20.status).toBe('not-regained');
    expect(r.d20.narrative).toContain('Not back to birth weight yet at 20 days');
    expect(r.d20.narrative).not.toMatch(/slow|plateau|below|Early days/i);
    expect(r.d20.qa).not.toMatch(/meal|calorie|ghee|nut butter|Food tab/i);
  });

  test('Home and the Growth tab agree at a bracket edge: judged at the weigh-in age, not today (bug #25)', async ({ page }) => {
    const r = await page.evaluate(() => {
      const w = window as any;
      const now = new Date();
      const day = (n: number) => w.toDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() + n));
      // A girl about 4.1 months old (125 days) whose latest weigh-in was at about 3.9 months (day 119).
      w._profSave(Object.assign({}, profile.child, { dob: day(-125), sex: 'f' }), profile.place);
      // 720 g over 28 days = 180 g/week: inside the 3–4 m band (85–185; window midpoint 3.45 m),
      // above the 4–5 m one (65–165).
      growthData = [{ date: day(-125), wt: 3.30 }, { date: day(-34), wt: 5.50 }, { date: day(-6), wt: 6.22 }];
      const gv = w.getGrowthVelocity();
      const cgv = w.computeGrowthVelocity().weight;
      w.renderTrendChips();
      const el = document.getElementById('trendChipsContainer');
      return {
        todayMonths: w.ageAt().months, weighInMonths: Math.floor(w.gvAgeAt(gv.wtLatest)),
        gPerWeek: gv.wtGPerWeek,
        home: w.gvVelocityVerdict(gv),
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
    expect(r.m34).toBe(135);   // WHO girls 3–4 mo 1-month P50 585 g / 30.44 d
    expect(r.m45).toBe(110);   // WHO girls 4–5 mo 1-month P50 489 g / 30.44 d
    expect(r.goal).toBe(r.m34);
  });

  // ── Newborn window folds (Maren V-M-282b-1..4, Vela V-V-282b-1..3, Kael V-K-282b-3..5) ──
  // One setup (eval'd in the page): a girl `ageDays` old today, a birth-weight row, and later
  // weigh-ins [day, kg]. solidsStart cleared so the default (6 months after birth) applies.
  const NB_SETUP = `(ageDays, birthWt, rows, extra) => {
    const w = window;
    const now = new Date();
    const day = (n) => w.toDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() + n));
    w._profSave(Object.assign({}, profile.child, { dob: day(-ageDays), sex: 'f', solidsStart: null }, extra || {}), profile.place);
    growthData = [{ date: day(-ageDays), wt: birthWt }].concat(rows.map(([d, kg]) => ({ date: day(d - ageDays), wt: kg })));
    w._clearModifierCache();
    const gv = w.getGrowthVelocity();
    const cgv = w.computeGrowthVelocity().weight;
    const factor = w.computeMedicalModifier().factors.find(f => f.name === 'Growth velocity').value;
    w.renderInfoGrowthVelocity();
    const ins = document.getElementById('infoGrowthVelocityInsight');
    w.renderTrendChips();
    const chips = document.getElementById('trendChipsContainer');
    const qa = w.qaAnswerWeightGain('weight_gain');
    const qc = w.qaAnswerWeightConcern('weight_concern');
    const visit = w.computeVisitPrep().sections.growth.items.join(' | ');
    return {
      verdict: w.gvVelocityVerdict(gv), status: cgv.status, factor, totalGainG: cgv.totalGainG,
      narrative: w.getGrowthNarrative(gv).join(' | '),
      insight: ins ? ins.innerHTML : '', chip: chips ? chips.innerHTML : '',
      qa: qa.headline + ' | ' + JSON.stringify(qa.sections), qcHeadline: qc.headline,
      qc: JSON.stringify(qc.sections), visit,
    };
  }`;

  test('more than 10% lost before day 21 is flagged, never "early days" (V-M-282b-2)', async ({ page }) => {
    const r = await page.evaluate((src) => {
      const setup = eval(src);
      return { loss: setup(5, 3.40, [[5, 3.04]]), ok: setup(5, 3.40, [[5, 3.07]]) };
    }, NB_SETUP);
    // 3.40 → 3.04 kg = −10.6%.
    expect(r.loss.verdict).toBe('newborn-loss');
    expect(r.loss.status).toBe('newborn-loss');
    expect(r.loss.factor).toBe(25);
    expect(r.loss.narrative).toContain('Down 10.6% from birth weight (3.4 kg → 3.04 kg). A loss of more than 10% is when midwives and doctors check feeding — contact your midwife, health visitor or doctor today.');
    for (const t of [r.loss.narrative, r.loss.insight, r.loss.qa, r.loss.chip]) expect(t).not.toContain('Early days —');
    expect(r.loss.insight).toContain('si-insight-warn');
    expect(r.loss.chip).toContain('tc-warn');
    expect(r.loss.qcHeadline).toBe('3.04 kg — down more than 10% from birth weight');
    expect(r.loss.qa).toContain('Total change since birth: −360g');
    expect(r.loss.qa).not.toMatch(/meal|calorie|ghee|nut butter|Food tab/i);
    // 3.40 → 3.07 kg = −9.7%: still the after-birth dip, neutral.
    expect(r.ok.verdict).toBe('newborn');
    expect(r.ok.factor).toBe(70);
    expect(r.ok.narrative).toContain('Early days — most babies lose a little weight after birth');
    expect(r.ok.narrative).toContain('Your doctor or midwife checks this at the first weigh-ins.');
    expect(r.ok.chip).toContain('tc-neutral');
    expect(r.ok.qcHeadline).toBe('3.07 kg — early days');
  });

  test('until day 28 a window from birth is judged against birth weight, not as a rate (V-M-282b-2, V-CA-282b-2)', async ({ page }) => {
    const r = await page.evaluate((src) => {
      const setup = eval(src);
      return {
        d14: setup(14, 3.40, [[14, 3.40]]),
        d15: setup(15, 3.40, [[4, 3.15], [15, 3.40]]),   // Carina's case, with a dip weigh-in between
        d16: setup(16, 3.20, [[16, 3.15]]),
        d23: setup(23, 3.20, [[23, 3.15]]),
      };
    }, NB_SETUP);
    for (const c of [r.d14, r.d15]) {
      expect(c.verdict).toBe('in');
      expect(c.status).toBe('on-track');
      expect(c.narrative).toContain('Back to birth weight — right on schedule');
      expect(c.narrative + c.qa).not.toMatch(/slow|plateau|below/i);
    }
    expect(r.d16.verdict).toBe('not-regained');
    expect(r.d16.status).toBe('not-regained');
    expect(r.d16.narrative).toContain('Not back to birth weight yet at 16 days. Most babies are by about 2 weeks, almost all by 3 — tell your midwife, health visitor or doctor.');
    expect(r.d16.chip).toContain('tc-warn');
    expect(r.d16.insight).toContain('si-insight-warn');
    expect(r.d16.qcHeadline).toBe('3.15 kg — not back to birth weight yet');
    expect(r.d16.qa).not.toMatch(/meal|calorie|ghee|nut butter|Food tab/i);
    // From day 21: the NICE NG75 1.1.4 referral framing.
    expect(r.d23.status).toBe('not-regained');
    expect(r.d23.narrative).toContain('consider a referral');
    expect(r.d23.qa).toContain('Contact your midwife, health visitor or doctor today');
  });

  test('a newborn weigh-in older than day 14 asks for a recheck (V-M-282b-4)', async ({ page }) => {
    const r = await page.evaluate((src) => eval(src)(25, 3.40, [[10, 3.30]]), NB_SETUP);
    expect(r.status).toBe('newborn');
    expect(r.insight).toContain('Last weighed at 10 days, during the after-birth dip — weigh again to check Asha is back to birth weight');
    expect(r.insight).toContain('si-insight-warn');
    expect(r.insight).not.toContain('Early days —');
    expect(r.visit).toContain('Back to birth weight not yet confirmed (last weighed day 10)');
  });

  test('no birth-weight row: no loss flag and no rate verdict from a pre-day-5 window (V-M-282b-1)', async ({ page }) => {
    const r = await page.evaluate((src) => {
      const w = window as any;
      const out = eval(src)(18, 3.40, [[3, 3.00], [18, 3.10]]);
      // Drop the birth row: the first weigh-in (day 3) is not the birth weight.
      growthData = growthData.slice(1);
      w._clearModifierCache();
      const gv = w.getGrowthVelocity();
      const cgv = w.computeGrowthVelocity().weight;
      return { withBirth: out.status, verdict: w.gvVelocityVerdict(gv), status: cgv.status, total: cgv.totalGainG };
    }, NB_SETUP);
    expect(r.withBirth).toBe('not-regained');   // 3.10 < 3.40 at day 18
    expect(r.verdict).toBe('newborn');
    expect(r.status).toBe('newborn');
    expect(r.total).toBeNull();                  // never "gain since birth" from the day-3 weigh-in
  });

  test('under 6 months slow gain gets no food advice (V-M-282b-3, V-K-282b-4)', async ({ page }) => {
    // A girl of 100 days: 100 g in the last 28 days (25 g/week) — below the 3–4 m band.
    const r = await page.evaluate((src) => eval(src)(100, 3.30, [[72, 5.00], [100, 5.10]]), NB_SETUP);
    expect(['slow', 'plateau']).toContain(r.status);
    expect(r.qa).toContain('Under 6 months milk is the whole diet — talk to your doctor or health visitor about feeding.');
    expect(r.qa).not.toMatch(/meal|calorie|ghee|nut butter|Food tab/i);
    expect(r.insight).not.toMatch(/caloric/i);
  });

  test('a weight loss reads "down", never "gaining -" (V-M-282b-6, V-K-282b-5, V-V-282b-2)', async ({ page }) => {
    const r = await page.evaluate((src) => eval(src)(214, 3.30, [[186, 7.00], [214, 6.90]]), NB_SETUP);
    expect(r.qcHeadline).toBe('6.9 kg (down 3.6 g/day)');
    expect(r.qa + r.qcHeadline + r.qc + r.narrative).not.toMatch(/gaining -/);
  });

  test('the growth-on-track alert counts the judged window and needs a fresh weigh-in (#57, V-M-282b-5, V-V-282b-5/6)', async ({ page }) => {
    const r = await page.evaluate(() => {
      const w = window as any;
      const now = new Date();
      const day = (n: number) => w.toDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() + n));
      const run = (ageDays: number, rows: [number, number][]) => {
        w._profSave(Object.assign({}, profile.child, { dob: day(-ageDays), sex: 'f' }), profile.place);
        growthData = [{ date: day(-ageDays), wt: 3.30 }].concat(rows.map(([d, kg]) => ({ date: day(d - ageDays), wt: kg })));
        localStorage.removeItem(KEYS.alertsActive);
        _cachedBaselines = null;
        const a = w.computeAlerts().find((x: any) => x.id === 'growth-on-track');
        return a ? a.title : null;
      };
      // Weighed at days 100, 186 and 214 (today); the judged window is 186 → 214 (28 days, 100 g/week,
      // in the 6–7 m band). The whole record spans 214 days — the old count said "8+ weeks".
      const fresh = run(214, [[100, 6.00], [186, 7.00], [214, 7.40]]);
      // The same weigh-ins, but the last one was 36 days ago: stale under 12 m (> 21 days).
      const stale = run(250, [[100, 6.00], [186, 7.00], [214, 7.40]]);
      return { fresh, stale };
    });
    expect(r.fresh).toBe('Growth on track over the last 4 weeks');
    expect(r.stale).toBeNull();
  });
});
