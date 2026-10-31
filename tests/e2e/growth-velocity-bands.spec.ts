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
      r9: ['9–10 months', 5, 110, 1.3, 15.3, 0.85, 1.8], r11: ['11–12 months', 0, 110, 0.4, 15.4, 0.85, 1.8],
      t1: ['12–18 months', 10, 90, 1.7, 12.3, 0.65, 1.6], t2: ['18–24 months', 0, 90, 0.6, 12.4, 0.45, 1.45],
    };
    const B = {
      r0: ['0–1 months', 170, 335, 24.3, 47.8, 3.65, 4.85], r1: ['1–2 months', 185, 325, 26.9, 46.4, 3.65, 4.85],
      r2: ['2–3 months', 130, 250, 18.9, 35.2, 3.0, 4.0], r3: ['3–4 months', 90, 195, 13.2, 27.8, 2.3, 3.3],
      r4: ['4–5 months', 70, 175, 10.2, 24.6, 1.75, 2.75], r5: ['5–6 months', 45, 150, 7.1, 21.1, 1.4, 2.35],
      r6: ['6–7 months', 35, 135, 5, 18.9, 1.0, 2.05], r8: ['8–9 months', 15, 120, 2.5, 16.7, 1.0, 2.05],
      r9: ['9–10 months', 10, 115, 1.5, 16, 0.85, 1.75], r11: ['11–12 months', 0, 115, 0.4, 16, 0.85, 1.75],
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
      // A window whose midpoint (≈ 3.8 m) and latest weigh-in (≈ 4.3 m) sit in different rows: the goal
      // reads the verdict's row, the midpoint (gv.wtBandAge — V-K-282c-7, V-CA-282c-5).
      w._profSave(Object.assign({}, profile.child, { dob: day(-133), sex: 'f' }), profile.place);
      growthData = [{ date: day(-133), wt: 3.30 }, { date: day(-33), wt: 5.70 }, { date: day(-3), wt: 6.30 }];
      const gv2 = w.getGrowthVelocity();
      const goal2 = w.CT_TEMPLATES.weight_gain.resolutionCriteria.value();
      return { goal, m34: median('3–4 months'), m45: median('4–5 months'), today: w.ageAt().months,
        goal2, bandAge2: gv2.wtBandAge, latestAge2: w.gvAgeAt(gv2.wtLatest), verdictRow2: w.growthVelocityBand(gv2.wtBandAge).label };
    });
    expect(r.today).toBe(4);
    expect(r.m34).toBe(135);   // WHO girls 3–4 mo 1-month P50 585 g / 30.44 d
    expect(r.m45).toBe(110);   // WHO girls 4–5 mo 1-month P50 489 g / 30.44 d
    expect(r.goal).toBe(r.m34);
    expect(Math.floor(r.bandAge2)).toBe(3);
    expect(Math.floor(r.latestAge2)).toBe(4);
    expect(r.verdictRow2).toBe('3–4 months');
    expect(r.goal2).toBe(r.m34);   // the latest weigh-in's age alone would give the 4–5 m median (110)
  });

  // ── Newborn window folds (Maren V-M-282b-1..4, Vela V-V-282b-1..3, Kael V-K-282b-3..5) ──
  // One setup (eval'd in the page): a girl `ageDays` old today, a birth-weight row, and later
  // weigh-ins [day, kg]. solidsStart cleared so the default (6 months after birth) applies.
  const NB_SETUP = `(ageDays, birthWt, rows, extra) => {
    const w = window;
    const now = new Date();
    const day = (n) => w.toDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() + n));
    const ex = Object.assign({}, extra || {});
    const noBirth = !!ex.noBirth; delete ex.noBirth;
    if (ex.solidsStartDay != null) { ex.solidsStart = day(ex.solidsStartDay - ageDays); delete ex.solidsStartDay; }
    w._profSave(Object.assign({}, profile.child, { dob: day(-ageDays), sex: 'f', solidsStart: null }, ex), profile.place);
    growthData = (noBirth ? [] : [{ date: day(-ageDays), wt: birthWt }]).concat(rows.map(([d, kg]) => ({ date: day(d - ageDays), wt: kg })));
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
    const vp = w.computeVisitPrep();
    const visit = vp.sections.growth.items.join(' | ');
    const qg = w.qaAnswerGrowth('growth');
    w.renderGrowthFacts(); w.renderGrowthInsightsPreview(); w.renderVelocity();
    const html = (id) => { const el = document.getElementById(id); return el ? el.innerHTML : ''; };
    const actions = (a) => { const s = a.sections.find(x => x.label === 'WHAT TO TRY'); return s ? s.items.map(i => i.text) : []; };
    return {
      verdict: w.gvVelocityVerdict(gv), status: cgv.status, factor, totalGainG: cgv.totalGainG,
      nb: cgv.nb ? { status: cgv.nb.status, tone: cgv.nb.tone, referral: cgv.nb.referral, recheck: cgv.nb.recheck, text: cgv.nb.text, short: cgv.nb.short } : null,
      narrative: w.getGrowthNarrative(gv).join(' | '),
      insight: ins ? ins.innerHTML : '', chip: chips ? chips.innerHTML : '',
      qa: qa.headline + ' | ' + JSON.stringify(qa.sections), qcHeadline: qc.headline,
      qc: JSON.stringify(qc.sections), visit,
      qaActions: actions(qa), qcActions: actions(qc), qgActions: actions(qg), qg: qg.headline + ' | ' + JSON.stringify(qg.sections),
      concerns: vp.concerns.map(c => c.text).join(' | '),
      facts: html('growthFacts'), preview: html('growthInsightsPreview'), gauges: html('velocityContent'),
      bar: html('infoGrowthVelocityBar'), pct: html('infoGrowthVelocityPercentile'),
      crossings: w.computeGrowthVelocity().crossings.length, slide: w.computeGrowthVelocity().centileSlide,
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
    expect(r.loss.narrative).toContain('Down 10.6% from birth weight (3.4 kg → 3.04 kg). A loss of more than 10% is when doctors and midwives check feeding — contact your doctor or midwife today.');
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
    expect(r.d16.narrative).toContain('Not back to birth weight yet at 16 days. Most babies are by about 2 weeks, almost all by 3 — tell your doctor or midwife.');
    expect(r.d16.chip).toContain('tc-warn');
    expect(r.d16.insight).toContain('si-insight-warn');
    expect(r.d16.qcHeadline).toBe('3.15 kg — not back to birth weight yet');
    expect(r.d16.qa).not.toMatch(/meal|calorie|ghee|nut butter|Food tab/i);
    // From day 21: the NICE NG75 1.1.4 referral framing.
    expect(r.d23.status).toBe('not-regained');
    expect(r.d23.narrative).toContain('consider a referral');
    expect(r.d23.qa).toContain('Contact your doctor or midwife today');
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
    expect(r.qa).toContain('Under 6 months, milk is the whole diet — talk to your doctor about feeding.');
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

  // ── Round 3 (Maren V-M-282c-*, Kael V-K-282c-*, Vela V-V-282c-*, Ceres V-C-282c-*, Carina V-CA-282c-*) ──

  test('no birth row from day 14: lower than the first weigh-in is "not back", higher is "not confirmed" — never "early days" (V-M-282c-2, V-K-282c-1)', async ({ page }) => {
    const r = await page.evaluate((src) => {
      const setup = eval(src);
      return {
        lower: setup(18, 3.40, [[3, 3.00], [18, 2.95]], { noBirth: true }),
        lowerRef: setup(23, 3.40, [[3, 3.00], [23, 2.98]], { noBirth: true }),
        higher: setup(18, 3.40, [[3, 3.00], [18, 3.10]], { noBirth: true }),
      };
    }, NB_SETUP);
    expect(r.lower.status).toBe('not-regained');
    expect(r.lower.nb.referral).toBe(false);
    expect(r.lower.narrative).toContain('Lower than at day 3 — not back to birth weight yet. Most babies are by about 2 weeks, almost all by 3 — tell your doctor or midwife.');
    expect(r.lower.chip).toContain('Not back yet');
    expect(r.lowerRef.nb.referral).toBe(true);
    expect(r.lowerRef.narrative).toContain('Lower than at day 3 — not back to birth weight yet at 23 days.');
    expect(r.lowerRef.narrative).toContain('contact your doctor or midwife today');
    expect(r.lowerRef.factor).toBe(25);
    expect(r.higher.status).toBe('newborn');
    expect(r.higher.nb.tone).toBe('caution');
    expect(r.higher.insight).toContain('Back to birth weight not confirmed — add the birth weight, or ask your doctor or midwife.');
    expect(r.higher.insight).toContain('si-insight-warn');
    expect(r.higher.totalGainG).toBeNull();
    for (const c of [r.lower, r.lowerRef, r.higher]) {
      expect(c.narrative + c.insight + c.qa).not.toContain('Early days —');
      expect(c.narrative + c.insight).not.toMatch(/%/);      // no %-loss without a birth row
    }
  });

  test('back to birth weight but down since the last weigh-in is a caution, never green (V-M-282c-3, V-K-282c-2)', async ({ page }) => {
    const r = await page.evaluate((src) => {
      const setup = eval(src);
      return { drop: setup(20, 3.40, [[10, 3.55], [20, 3.45]]), clean: setup(20, 3.40, [[10, 3.35], [20, 3.45]]) };
    }, NB_SETUP);
    expect(r.drop.verdict).toBe('newborn');
    expect(r.drop.nb.tone).toBe('caution');
    expect(r.drop.narrative).toContain('Back to birth weight, but down 100 g since day 10 — weigh again, and tell your doctor or midwife if it keeps dropping.');
    expect(r.drop.chip).toContain('tc-warn');
    expect(r.drop.chip).toContain('Weigh again');
    expect(r.drop.insight).toContain('si-insight-warn');
    expect(r.drop.qaActions[0]).toMatch(/^Weigh .+ again in a day or two/);
    expect(r.clean.verdict).toBe('in');
    expect(r.clean.status).toBe('on-track');
  });

  test('more than 10% is strict, in whole grams: exactly 10% is not flagged (V-M-282c-4)', async ({ page }) => {
    const r = await page.evaluate((src) => {
      const setup = eval(src);
      return { exact: setup(5, 3.40, [[5, 3.06]]), over: setup(5, 3.40, [[5, 3.059]]) };
    }, NB_SETUP);
    expect(r.exact.verdict).toBe('newborn');            // 340 g of 3400 g = 10.0%
    expect(r.exact.narrative).not.toContain('just over 10%');
    expect(r.over.verdict).toBe('newborn-loss');        // 341 g = 10.03%, shown to a tenth as 10.0
    expect(r.over.narrative).toContain('Down just over 10% from birth weight');
  });

  test('below birth weight past day 28 is "not back" with the referral; at 3 weeks the short line says so (V-M-282c-5, -6, -10)', async ({ page }) => {
    const r = await page.evaluate((src) => {
      const setup = eval(src);
      return {
        d40: setup(40, 3.40, [[20, 3.30], [40, 3.35]]),
        d23: setup(23, 3.20, [[23, 3.15]]),
        d16: setup(16, 3.20, [[16, 3.15]]),
        d100: setup(100, 3.40, [[72, 3.30], [100, 3.38]]),
        loss: setup(5, 3.40, [[5, 3.04]]),
      };
    }, NB_SETUP);
    expect(r.d40.status).toBe('not-regained');
    expect(r.d40.nb.referral).toBe(true);
    expect(r.d40.nb.short).toBe('Still below birth weight at 5 weeks — contact your doctor or midwife today');
    expect(r.d40.factor).toBe(25);
    expect(r.d23.nb.short).toBe('Not back to birth weight at 3 weeks — contact your doctor or midwife today');
    expect(r.d23.factor).toBe(25);
    expect(r.d16.factor).toBe(50);
    expect(r.d16.nb.short).toBe('Not back to birth weight yet — tell your doctor or midwife');
    expect(r.d100.nb).toBeNull();                         // past ~3 months the rate verdict stands
    expect(r.loss.chip).toContain('Down &gt;10%');
    expect(r.d16.chip).toContain('Not back yet');
    for (const c of [r.loss, r.d16, r.d23]) expect(c.chip).not.toContain('Early days');
  });

  test('a caution newborn line leads every weight answer with the urgent action — no "on track", "next visit" or reassurance (V-M-282c-1, V-K-282c-3, V-V-282c-3)', async ({ page }) => {
    const r = await page.evaluate((src) => {
      const setup = eval(src);
      return { loss: setup(5, 3.40, [[5, 3.04]]), recheck: setup(25, 3.40, [[10, 3.30]]), dip: setup(5, 3.40, [[5, 3.07]]) };
    }, NB_SETUP);
    for (const acts of [r.loss.qaActions, r.loss.qcActions, r.loss.qgActions]) {
      expect(acts[0]).toBe('Contact your doctor or midwife today');
      expect(acts.join(' | ')).not.toMatch(/on track|next visit|active play|higher percentile/i);
    }
    expect(r.loss.qc).not.toContain('within normal range');
    expect(r.loss.qg).not.toContain('Growth is on track');
    expect(r.loss.concerns).toContain('Lost 10.6% of birth weight by day 5');
    expect(r.recheck.qaActions[0]).toMatch(/^Weigh .+ again to confirm the return to birth weight/);
    expect(r.recheck.qcActions[0]).toMatch(/^Weigh .+ again/);
    expect(r.recheck.qgActions[0]).toMatch(/^Weigh .+ again/);
    expect(r.recheck.qgActions.join(' | ')).not.toMatch(/on track/i);
    // The plain dip: no percentile or active-play lines either, and no "on track".
    expect(r.dip.qcActions.join(' | ')).not.toMatch(/active play|higher percentile/i);
    expect(r.dip.qc).not.toMatch(/percentile — /);
    expect(r.dip.qgActions.join(' | ')).not.toMatch(/on track/i);
    expect(r.dip.qg).toContain('(recent)');               // the bracket is closed (V-V-282c-7)
  });

  test('no weight row: food advice is judged by today\'s age, not assumed (V-K-282c-5, V-C-282c-2)', async ({ page }) => {
    const r = await page.evaluate(() => {
      const w = window as any;
      const now = new Date();
      const day = (n: number) => w.toDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() + n));
      w._profSave(Object.assign({}, profile.child, { dob: day(-100), sex: 'f', solidsStart: null }), profile.place);
      growthData = [{ date: day(-60), ht: 55 }, { date: day(-5), ht: 60 }];
      const qa = w.qaAnswerWeightGain('weight_gain');
      return { ok: w.gvFoodAdviceOk(null), qa: JSON.stringify(qa.sections) };
    });
    expect(r.ok).toBe(false);
    expect(r.qa).not.toMatch(/Food tab|calorie|nut butter/i);
  });

  test('tooShort is never "gaining well", "within normal range" or "on track" (V-V-282c-6), and Growth facts never celebrate a 7-day toddler pair (V-M-282c-8)', async ({ page }) => {
    const r = await page.evaluate((src) => {
      const w = window as any;
      const setup = eval(src);
      const short = setup(400, 3.30, [[380, 9.50], [392, 9.45]], { noBirth: true });
      // The growth-diet card needs 3+ feeding days in the window.
      const now = new Date();
      for (let i = 0; i < 14; i++) feedingData[w.toDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 20 + i))] = { breakfast: 'rice', lunch: 'dal', dinner: 'roti' };
      w.renderInfoGrowthDiet();
      const card = (document.getElementById('infoGrowthDietInsights') || {} as any).innerHTML || '';
      const pair = setup(400, 3.30, [[340, 9.50], [393, 9.45], [400, 9.50]]);
      return { short, card, pair };
    }, NB_SETUP);
    expect(r.short.qa).toContain('too soon to judge');
    expect(r.short.qa).not.toMatch(/gaining well/);
    expect(r.short.qc).not.toContain('Weight gain is within normal range');   // the percentile line may still say it
    expect(r.short.qg).not.toContain('(on track)');
    expect(r.short.qgActions.join(' | ')).not.toContain('Growth is on track');
    expect(r.short.insight).toContain('too soon to judge');
    expect(r.short.facts).toContain('Too soon to judge — weigh again in a few weeks');
    expect(r.short.facts).not.toContain('right on track');
    expect(r.card).toContain('too soon to judge');
    expect(r.card).not.toMatch(/velocity is normal/);
    // 7-day pair +50 g (in band), but nothing gained over the 60-day window: below, not "on track".
    expect(r.pair.facts).toContain('below the usual');
    expect(r.pair.facts).not.toContain('right on track');
  });

  test('food advice needs 6 months AND solids: an early start at 4 months still gets the milk note (V-C-282c-1, -3, -5, -6)', async ({ page }) => {
    const r = await page.evaluate((src) => {
      const w = window as any;
      const setup = eval(src);
      const early = setup(150, 3.30, [[122, 6.00], [150, 6.10]], { solidsStartDay: 120 });
      const now = new Date();
      for (let i = 0; i < 28; i++) feedingData[w.toDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 28 + i))] = { breakfast: 'rice cereal' };
      w.renderInfoGrowthDiet();
      const card = (document.getElementById('infoGrowthDietInsights') || {} as any).innerHTML || '';
      return { early, card, solids: w.solidsStarted(), ok: w.gvFoodAdviceOk(growthData[growthData.length - 1]), lib: w._libSuggestions().length };
    }, NB_SETUP);
    const MILK = 'Under 6 months, milk is the whole diet — talk to your doctor about feeding.';
    expect(r.solids).toBe(true);
    expect(r.ok).toBe(false);
    expect(r.lib).toBe(0);                                // _libSuggestions unchanged: never under 6 months
    expect(r.early.qa).toContain(MILK);
    expect(r.early.qa).not.toMatch(/ghee|calorie|nut butter|Food tab/i);
    expect(r.early.insight).toContain(MILK);
    expect(r.early.insight).toContain('after illness or a feeding change');
    expect(r.early.insight).not.toMatch(/dietary gap|caloric/);
    expect(r.card).toContain(MILK);
    expect(r.card).not.toMatch(/consider adding rich sources|Nutrient gaps/);
  });

  test('the insights preview leads with a "Check" tile and the caution title (V-V-282c-1)', async ({ page }) => {
    const r = await page.evaluate((src) => eval(src)(5, 3.40, [[5, 3.04]]), NB_SETUP);
    expect(r.preview).toContain('ds-amber');
    expect(r.preview).toContain('Check');
    expect(r.preview).toContain('Down 10.6% from birth weight — contact your doctor or midwife today');
    expect(r.preview.indexOf('ds-amber')).toBeLessThan(r.preview.indexOf('Total insights'));
  });

  test('percentile crossings are not reported in the newborn window or before day 28 (V-V-282c-2)', async ({ page }) => {
    const r = await page.evaluate((src) => {
      const setup = eval(src);
      return { dip: setup(10, 3.40, [[10, 3.05]]), early: setup(22, 3.40, [[6, 2.70], [20, 3.60]], { noBirth: true }) };
    }, NB_SETUP);
    for (const c of [r.dip, r.early]) {
      expect(c.crossings).toBe(0);
      expect(c.pct).not.toContain('Crossed from');
      expect(c.concerns).not.toContain('Percentile dropped');
      expect(c.qa + c.qg).not.toMatch(/Percentile (dropped|climbed|shift)/);
    }
  });

  test('the birth-ratio gauge reads against birth weight in the newborn window, and the dip is neutral (V-V-282c-4, -5)', async ({ page }) => {
    const r = await page.evaluate((src) => {
      const setup = eval(src);
      return { loss: setup(5, 3.40, [[5, 3.04]]), back: setup(20, 3.40, [[10, 3.35], [20, 3.45]]), dip: setup(5, 3.40, [[5, 3.20]]) };
    }, NB_SETUP);
    expect(r.loss.gauges).toContain('Below birth weight');
    expect(r.back.gauges).toContain('Back to birth weight');
    for (const c of [r.loss, r.back, r.dip]) {
      expect(c.gauges).not.toContain('Approaching 2×');
      expect(c.bar).not.toContain('mi-velocity-range');   // no bar in the newborn window (V-V-282c-5)
      expect(c.bar).toContain('g/day');
    }
    expect(r.dip.gauges).toContain('vg-value tc-mid');    // a negative change in the plain dip is neutral
    expect(r.loss.gauges).toContain('vg-value tc-rose');
  });

  test('a slow fall across two major centile lines is flagged; one line is not (V-M-282c-11)', async ({ page }) => {
    const r = await page.evaluate(() => {
      const w = window as any;
      const now = new Date();
      const day = (n: number) => w.toDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() + n));
      const ageDays = Math.round(11 * 30.44) + 2;
      // The weight at a target percentile for an age in days (bisection on calcPercentile).
      const wtAt = (dayOfLife: number, target: number) => {
        const ref = w.getGrowthRef(w.ageMonthsAt(day(dayOfLife - ageDays)));
        let lo = ref.w3, hi = ref.w97;
        for (let i = 0; i < 40; i++) {
          const mid = (lo + hi) / 2;
          if (w.calcPercentile(mid, ref.w3, ref.w50, ref.w97, ref.w15, ref.w85).pct < target) lo = mid; else hi = mid;
        }
        return Math.round(hi * 1000) / 1000;
      };
      const run = (targets: number[]) => {
        w._profSave(Object.assign({}, profile.child, { dob: day(-ageDays), sex: 'f' }), profile.place);
        growthData = targets.map((t, i) => { const d = Math.round((6 + i) * 30.44); return { date: day(d - ageDays), wt: wtAt(d, t) }; });
        const g = w.computeGrowthVelocity();
        w.renderInfoGrowthVelocity();
        const pct = (document.getElementById('infoGrowthVelocityPercentile') || {} as any).innerHTML || '';
        const qa = JSON.stringify(w.qaAnswerWeightGain('weight_gain').sections);
        const concerns = w.computeVisitPrep().concerns.map((c: any) => c.text).join(' | ');
        return { pcts: g.percentiles.map((p: any) => p.percentile), crossings: g.crossings.length, slide: g.centileSlide, pct, qa, concerns };
      };
      return { two: run([55, 45, 35, 25, 18, 12]), one: run([55, 48, 40, 33, 27, 22]) };
    });
    expect(r.two.crossings).toBe(0);                      // no single pair moves more than 15 points
    expect(r.two.slide).not.toBeNull();
    expect(r.two.slide.lines).toBe(2);
    expect(r.two.slide.text).toMatch(/^Weight has moved down two centile lines since .+ — mention it to your doctor$/);
    expect(r.two.pct).toContain('Weight has moved down two centile lines');
    expect(r.two.qa).toContain('Weight has moved down two centile lines');
    expect(r.two.concerns).toContain('Weight has moved down two centile lines');
    expect(r.one.slide).toBeNull();
  });

  test('Home (g/week) and the Growth tab give one verdict for the same gain: girls 7–8 m at 24.7 g/week (V-CA-282c-3)', async ({ page }) => {
    const r = await page.evaluate((src) => {
      const w = window as any;
      const setup = eval(src);
      // Weigh-ins at day 214 and 242: a 28-day window, midpoint ≈ 7.5 m (the 7–8 m row, 25–125 g/week).
      const below = setup(245, 3.30, [[214, 7.000], [242, 7.099]]);    // 99 g / 4 weeks = 24.75 g/week
      const gvB = w.getGrowthVelocity();
      const at = setup(245, 3.30, [[214, 7.000], [242, 7.101]]);       // 101 g = 25.25 g/week
      const gvA = w.getGrowthVelocity();
      return { below, at, wkB: gvB.wtGPerWeek, wkA: gvA.wtGPerWeek, row: w.growthVelocityBand(gvB.wtBandAge).label };
    }, NB_SETUP);
    expect(r.row).toBe('7–8 months');
    expect(r.wkB).toBe(24);
    expect(r.below.verdict).toBe('below');
    expect(r.below.status).toBe('slow');                  // judged on g/day 3.5 this read "on track"
    expect(r.wkA).toBe(25);
    expect(r.at.verdict).toBe('in');
    expect(r.at.status).toBe('on-track');
  });

  test('"since birth" uses the birth-date row for each measure; no height at birth → no height line (V-M-282c-7, V-CA-282c-6)', async ({ page }) => {
    const r = await page.evaluate(() => {
      const w = window as any;
      const now = new Date();
      const day = (n: number) => w.toDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() + n));
      const summary = () => {
        let buf = '';
        const orig = window.open;
        (window as any).open = () => ({ document: { write: (s: string) => { buf += s; }, close: () => {} } });
        try { w.showFullDoctorSummary(); } finally { (window as any).open = orig; }
        return buf;
      };
      const size = () => {
        const orig = Math.random;
        Math.random = () => 0.99;
        try { w.renderSizeComparison(); } finally { Math.random = orig; }
        return (document.getElementById('sizeComparison') || {} as any).innerHTML || '';
      };
      w._profSave(Object.assign({}, profile.child, { dob: day(-200), sex: 'f' }), profile.place);
      growthData = [{ date: day(-200), wt: 3.30 }, { date: day(-40), wt: 7.00, ht: 64 }, { date: day(-5), wt: 7.50, ht: 66 }];
      const noBirthHt = { doc: summary(), size: size() };
      growthData[0].ht = 50;
      const withHt = { doc: summary(), size: size() };
      growthData = growthData.slice(1);
      const noBirth = { doc: summary() };
      return { noBirthHt, withHt, noBirth };
    });
    expect(r.noBirthHt.doc).toContain('Weight gain since birth: 4.20 kg');
    expect(r.noBirthHt.doc).not.toContain('Height gain since birth');
    expect(r.noBirthHt.size).not.toContain('since birth');
    expect(r.noBirthHt.size + r.noBirthHt.doc).not.toContain('NaN');
    expect(r.withHt.doc).toContain('Height gain since birth: 16 cm');
    expect(r.withHt.size).toContain('Grown 16 cm since birth!');
    expect(r.noBirth.doc).not.toContain('since birth');
  });
});

test.describe('HR-12: getSleepScore24h reads yesterday as a local calendar day (V-CA-282c-4)', () => {
  test.use({ timezoneId: 'America/New_York' });
  test('west of Greenwich "yesterday" is the day before today, not two days back', async ({ page }) => {
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as any).getSleepScore24h === 'function', null, { timeout: 15_000 });
    const r = await page.evaluate(() => {
      const w = window as any;
      const asked: string[] = [];
      const orig = w.getDailySleepScore;
      w.getDailySleepScore = (d: string) => { asked.push(d); return null; };
      try { w.getSleepScore24h(); } finally { w.getDailySleepScore = orig; }
      const now = new Date();
      return { first: asked[0], expected: w.toDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)) };
    });
    expect(r.first).toBe(r.expected);
  });
});
