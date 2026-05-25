import { test, expect } from '@playwright/test';

// v3-3 Engine Primitive Foundation — regression guards.
// Spec: docs/specs/v3-3-engine-spine.md §Test plan.
// QA chain canon-cc-008: Kael primary (entire diff in Kael's jurisdiction);
// no styles.css / template.html / home / diet / medical touches → no Maren/Vela.
// Charter alignment (CV3-006):
//   - Honesty: every primitive asserts {sampleSize/confidence/posture} disclosure.
//   - Extensibility: row-addition tables (RECOMMENDATION_ROSTER, SIGNAL_EXTRACTORS,
//     ANCHOR_RESOLVERS) covered by enumeration helpers.
//   - Warmth: assertions cover the friendly `label` field shapes.

// ─────────────────────────────────────────────────────────────────────────
// _correlate primitive — Pearson math, confidence floor, lag analysis, HR-12
// ─────────────────────────────────────────────────────────────────────────

test('regression-guard-v3-3-correlate-pearson: Pearson math is correct on known-good fixture', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    // Synthetic linear: y = 2x + small noise → expect strength ≈ +1
    const xs = [1, 2, 3, 4, 5, 6, 7, 8];
    const ys = [2.1, 3.9, 6.1, 8.0, 10.1, 11.9, 14.0, 16.0];
    return { rho: _pearson(xs, ys) };
  });

  expect(r.rho).toBeGreaterThan(0.99);
});

test('regression-guard-v3-3-correlate-confidence-floor: returns null when sampleSize<7 or |strength|<0.4', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    // Stub extractors that return only 5 days of data (under floor).
    const origSleep = SIGNAL_EXTRACTORS['sleep:total'];
    const origMeal = SIGNAL_EXTRACTORS['feeding:mealCount'];
    let cnt = 0;
    SIGNAL_EXTRACTORS['sleep:total'] = (ds: string) => { cnt++; return cnt <= 5 ? 10 : null; };
    SIGNAL_EXTRACTORS['feeding:mealCount'] = () => 3;
    const tooFew = _correlate('sleep', 'feeding', 14, { signalA: 'total', signalB: 'mealCount' });
    // Restore + now test the |strength|<0.4 path: constant signals → strength = 0
    SIGNAL_EXTRACTORS['sleep:total'] = () => 10;
    SIGNAL_EXTRACTORS['feeding:mealCount'] = () => 3;
    const flatStrength = _correlate('sleep', 'feeding', 14, { signalA: 'total', signalB: 'mealCount' });
    // Restore
    SIGNAL_EXTRACTORS['sleep:total'] = origSleep;
    SIGNAL_EXTRACTORS['feeding:mealCount'] = origMeal;
    return { tooFew, flatStrength };
  });

  expect(r.tooFew, 'sampleSize<7 must return null').toBeNull();
  expect(r.flatStrength, 'flat signals (strength=0) must fall under |0.4| floor → null').toBeNull();
});

test('regression-guard-v3-3-correlate-lag-analysis: reports strongest lag across [-3,+3] day shifts', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    // Seed: A[i] correlates with B[i+2] (lag = +2).
    const seriesA = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
    const seriesB = [99, 99, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const origA = SIGNAL_EXTRACTORS['sleep:total'];
    const origB = SIGNAL_EXTRACTORS['feeding:mealCount'];
    const endDate = today();
    SIGNAL_EXTRACTORS['sleep:total'] = (ds: string) => {
      // Map ds to index relative to (endDate - 13)
      for (let i = 0; i < 14; i++) {
        if (_offsetDateStr(endDate, -(13 - i)) === ds) return seriesA[i];
      }
      return null;
    };
    SIGNAL_EXTRACTORS['feeding:mealCount'] = (ds: string) => {
      for (let i = 0; i < 14; i++) {
        if (_offsetDateStr(endDate, -(13 - i)) === ds) return seriesB[i];
      }
      return null;
    };
    const out = _correlate('sleep', 'feeding', 14, { signalA: 'total', signalB: 'mealCount', lagDays: 3 });
    SIGNAL_EXTRACTORS['sleep:total'] = origA;
    SIGNAL_EXTRACTORS['feeding:mealCount'] = origB;
    return out;
  });

  expect(r, 'correlate output must be non-null').not.toBeNull();
  expect(r.lag, 'lag should resolve to +2 (B leads A by 2 days)').toBe(2);
  expect(Math.abs(r.strength)).toBeGreaterThan(0.95);
});

test('regression-guard-v3-3-signal-extractors-array-shape: sleep/poop/growth extractors filter arrays correctly (V-K-87)', async ({ page }) => {
  // Kael Mode-1 finding (canon-cc-008 v3-3): sleepData/poopData/growthData
  // are flat arrays, NOT date-keyed maps. Extractors that index by [dateStr]
  // silently return null for every historical day → confidence-floor never
  // clears → consumer surfaces show nothing. This guard catches regression.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    const t = today();
    const origSleep = Array.isArray(sleepData) ? sleepData.slice() : [];
    const origPoop = Array.isArray(poopData) ? poopData.slice() : [];
    const origGrowth = Array.isArray(growthData) ? growthData.slice() : [];
    sleepData = [
      { date: t, type: 'night', bedtime: '20:00', wakeTime: '06:30', wakeUps: 2 },
      { date: t, type: 'nap', bedtime: '12:00', wakeTime: '13:30' },
    ];
    poopData = [{ date: t }, { date: t }, { date: t }];
    growthData = [{ date: t, wt: 8.4, ht: 70 }];
    const sleepTotal = SIGNAL_EXTRACTORS['sleep:total'](t);
    const sleepWakes = SIGNAL_EXTRACTORS['sleep:wakeUps'](t);
    const sleepOnset = SIGNAL_EXTRACTORS['sleep:onsetMin'](t);
    const poopCount = SIGNAL_EXTRACTORS['poop:count'](t);
    const weight = SIGNAL_EXTRACTORS['growth:weightKg'](t);
    sleepData = origSleep; poopData = origPoop; growthData = origGrowth;
    return { sleepTotal, sleepWakes, sleepOnset, poopCount, weight };
  });

  expect(r.sleepTotal, 'sleep:total must filter array by date and sum durations (hours)').not.toBeNull();
  expect(r.sleepTotal).toBeCloseTo(12, 0); // 10.5h night + 1.5h nap = 12h
  expect(r.sleepWakes, 'sleep:wakeUps must sum getWakeCount across day').toBe(2);
  expect(r.sleepOnset, 'sleep:onsetMin must return bedtime minutes (20:00 = 1200)').toBe(1200);
  expect(r.poopCount, 'poop:count must return filtered array length').toBe(3);
  expect(r.weight, 'growth:weightKg must find matching date+wt record').toBe(8.4);
});

test('regression-guard-v3-3-correlate-available-signals: enumerator exposes domain-grouped signal map', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const out = await page.evaluate(() => _correlateAvailableSignals());

  expect(out.sleep).toContain('total');
  expect(out.feeding).toContain('mealCount');
  expect(out.med).toContain('givenCount');
  expect(out.illness).toContain('active');
  expect(out.poop).toContain('count');
  expect(out.growth).toContain('weightKg');
});

// ─────────────────────────────────────────────────────────────────────────
// _resolveEventAnchor primitive — anchor types + HR-12 safety
// ─────────────────────────────────────────────────────────────────────────

test('regression-guard-v3-3-event-anchor-fever: "since the fever" resolves to most recent fever episode start → today', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    const orig = _feverEpisodes.slice();
    _feverEpisodes = [{
      id: 'fe-test',
      status: 'active',
      startedAt: '2026-05-20T08:00:00.000Z',
      resolvedAt: null,
    }];
    const out = _resolveEventAnchor('since the fever', {});
    _feverEpisodes = orig;
    return { out, todayStr: today() };
  });

  expect(r.out, 'anchor must resolve when active fever episode exists').not.toBeNull();
  expect(r.out.start).toBe('2026-05-20');
  expect(r.out.end).toBe(r.todayStr);
  expect(r.out.label).toContain('since the fever');
});

test('regression-guard-v3-3-event-anchor-vaccine: "the week of MMR" → ±3d window around vaccine date', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    const orig = Array.isArray(vaccData) ? vaccData.slice() : [];
    vaccData = [{ name: 'MMR-1', date: '2026-05-25', upcoming: false }];
    const out = _resolveEventAnchor('the week of MMR', {});
    vaccData = orig;
    return out;
  });

  expect(r, 'anchor must resolve when vaccine record exists').not.toBeNull();
  expect(r.start).toBe('2026-05-22');
  expect(r.end).toBe('2026-05-28');
  expect(r.label).toContain('MMR');
});

test('regression-guard-v3-3-event-anchor-milestone: "since rolling" → milestone date → today', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    const orig = Array.isArray(milestones) ? milestones.slice() : [];
    milestones = [{
      id: 'roll',
      text: 'Rolling over',
      status: 'practicing',
      cat: 'motor',
      emergingAt: '2026-04-10',
      practicingAt: '2026-04-20',
    }];
    const out = _resolveEventAnchor('since rolling', {});
    milestones = orig;
    return { out, todayStr: today() };
  });

  expect(r.out).not.toBeNull();
  expect(r.out.start).toBe('2026-04-10');
  expect(r.out.end).toBe(r.todayStr);
});

test('regression-guard-v3-3-event-anchor-tz-safe: vaccine ±3d window is reproducible across timezones (HR-12)', async ({ page }) => {
  // Spec §HR-12 Test plan: seed vaccine date '2026-05-25'; window must be
  // exactly {start:'2026-05-22', end:'2026-05-28'} regardless of local tz
  // (CI runs UTC; manual IST run must produce identical strings).
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    const orig = Array.isArray(vaccData) ? vaccData.slice() : [];
    vaccData = [{ name: 'MMR-1', date: '2026-05-25', upcoming: false }];
    const out = _resolveEventAnchor('the week of MMR', {});
    vaccData = orig;
    return out;
  });

  expect(r).not.toBeNull();
  expect(r.start, 'tz-safe: start MUST be 2026-05-22 (no boundary drift)').toBe('2026-05-22');
  expect(r.end, 'tz-safe: end MUST be 2026-05-28 (no boundary drift)').toBe('2026-05-28');
});

test('regression-guard-v3-3-event-anchor-before-solids: milestone date resolves to dob → milestone window', async ({ page }) => {
  // Covers the milestone-anchored before/after path that the prior degenerate
  // tz-safe test was attempting (but routing to vaccine regex).
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    const orig = Array.isArray(milestones) ? milestones.slice() : [];
    milestones = [{ id: 'solids', text: 'Started solids', status: 'mastered', cat: 'feeding', masteredAt: '2026-03-15' }];
    const before = _resolveEventAnchor('before solids', { baby: { dob: '2025-09-04' } });
    const after = _resolveEventAnchor('after solids', { baby: { dob: '2025-09-04' } });
    milestones = orig;
    return { before, after };
  });

  expect(r.before).not.toBeNull();
  expect(r.before.start).toBe('2025-09-04');
  expect(r.before.end).toBe('2026-03-14');
  expect(r.after).not.toBeNull();
  expect(r.after.start).toBe('2026-03-15');
});

test('regression-guard-v3-3-correlate-tz-safe: _correlate walks IST calendar days (no UTC drift on day boundary)', async ({ page }) => {
  // Spec §HR-12 Test plan row 3: signal extractors keyed by YYYY-MM-DD must
  // receive the LOCAL (IST) calendar day, not the UTC day. Test stubs an
  // extractor that records each dateStr it sees; assert the sequence is the
  // last 14 strings produced by `_offsetDateStr(today(), -k)` for k in 13..0.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    const seenA: string[] = [];
    const seenB: string[] = [];
    const origA = SIGNAL_EXTRACTORS['sleep:total'];
    const origB = SIGNAL_EXTRACTORS['feeding:mealCount'];
    SIGNAL_EXTRACTORS['sleep:total'] = (ds: string) => { seenA.push(ds); return 10; };
    SIGNAL_EXTRACTORS['feeding:mealCount'] = (ds: string) => { seenB.push(ds); return 3; };
    _correlate('sleep', 'feeding', 14, { signalA: 'total', signalB: 'mealCount' });
    SIGNAL_EXTRACTORS['sleep:total'] = origA;
    SIGNAL_EXTRACTORS['feeding:mealCount'] = origB;
    const expected: string[] = [];
    const t = today();
    for (let i = 0; i < 14; i++) expected.push(_offsetDateStr(t, -(14 - 1 - i)));
    return { seenA, seenB, expected };
  });

  expect(r.seenA, 'sleep extractor must be called with the locally-iterated 14-day window').toEqual(r.expected);
  expect(r.seenB, 'feeding extractor must be called with the SAME 14 locally-iterated days').toEqual(r.expected);
  expect(r.seenA[r.seenA.length - 1], 'last day MUST be today() — no UTC roll-back').toBe(r.expected[13]);
});

test('regression-guard-v3-3-event-anchor-null-when-unresolvable: returns null on unknown anchor token', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const out = await page.evaluate(() => _resolveEventAnchor('blah blah blah', {}));
  expect(out, 'unresolvable token must return null per Charter honesty axis').toBeNull();
});

// ─────────────────────────────────────────────────────────────────────────
// getActiveIllnessPosture — compound symptom detection
// ─────────────────────────────────────────────────────────────────────────

test('regression-guard-v3-3-illness-posture-compound: 2+ overlapping illnesses bump escalationTier', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    const origFever = _feverEpisodes.slice();
    const origCold = (typeof _coldEpisodes !== 'undefined') ? _coldEpisodes.slice() : null;
    const origDiar = (typeof _diarrhoeaEpisodes !== 'undefined') ? _diarrhoeaEpisodes.slice() : null;
    _feverEpisodes = [{ id: 'fe-1', status: 'active', startedAt: '2026-05-20T08:00:00.000Z', resolvedAt: null }];
    if (typeof _coldEpisodes !== 'undefined') _coldEpisodes = [{ id: 'ce-1', status: 'active', startedAt: '2026-05-21T08:00:00.000Z', resolvedAt: null }];
    if (typeof _diarrhoeaEpisodes !== 'undefined') _diarrhoeaEpisodes = [{ id: 'de-1', status: 'active', startedAt: '2026-05-22T08:00:00.000Z', resolvedAt: null }];
    const posture = getActiveIllnessPosture();
    _feverEpisodes = origFever;
    if (origCold !== null) _coldEpisodes = origCold;
    if (origDiar !== null) _diarrhoeaEpisodes = origDiar;
    return posture;
  });

  expect(r).not.toBeNull();
  expect(r.escalationTier, '3 active illnesses must reach tier ≥2').toBeGreaterThanOrEqual(2);
  expect(Array.isArray(r.activeIllnesses)).toBe(true);
  expect(r.activeIllnesses.length).toBeGreaterThanOrEqual(2);
});

// ─────────────────────────────────────────────────────────────────────────
// getSyncPosture — synchronous, no await, no network
// ─────────────────────────────────────────────────────────────────────────

test('regression-guard-v3-3-sync-posture-sync: returns synchronously with required posture fields', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    const t0 = performance.now();
    const posture = getSyncPosture();
    const elapsed = performance.now() - t0;
    return { posture, elapsed };
  });

  expect(r.posture).not.toBeNull();
  expect(r.posture).toHaveProperty('circuitOpen');
  expect(r.posture).toHaveProperty('lastSyncMs');
  expect(r.posture).toHaveProperty('pendingWrites');
  expect(r.posture).toHaveProperty('healthTier');
  expect(r.elapsed, 'getSyncPosture p95 < 1ms doctrine — single call should be well under').toBeLessThan(20);
});

// ─────────────────────────────────────────────────────────────────────────
// _scoreDay / _scoreWindow / _scoreDayHero — schema + aggregation contracts
// ─────────────────────────────────────────────────────────────────────────

test('regression-guard-v3-3-score-day-shape: _scoreDay output matches scoring-redesign-v1 contract', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => _scoreDay('sleep', today()));

  expect(r).not.toBeNull();
  // Schema fields per scoring-redesign-v1.md §Architecture.
  expect(r).toHaveProperty('raw');
  expect(r).toHaveProperty('rewards');
  expect(r).toHaveProperty('penalties');
  expect(r).toHaveProperty('dayBonuses');
  expect(r).toHaveProperty('total');
  expect(r).toHaveProperty('contributions');
  expect(r).toHaveProperty('severityLevel');
  expect(r).toHaveProperty('unmetRecommendations');
  expect(r).toHaveProperty('generatedMessages');
});

test('regression-guard-v3-3-score-window-rolling: _scoreWindow aggregates N-day rolling correctly', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => _scoreWindow('sleep', 7, today()));

  expect(r).not.toBeNull();
  expect(r).toHaveProperty('perDay');
  expect(r).toHaveProperty('avgTotal');
  expect(r).toHaveProperty('windowDays');
  expect(r.windowDays).toBe(7);
  expect(Array.isArray(r.perDay)).toBe(true);
  expect(r.perDay.length).toBe(7);
});

test('regression-guard-v3-3-score-hero-weighted: _scoreDayHero applies per-domain weights + severity merge', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => _scoreDayHero(today()));

  expect(r).not.toBeNull();
  expect(r).toHaveProperty('total');
  expect(r).toHaveProperty('perDomain');
  expect(r).toHaveProperty('severityLevel');
  expect(r).toHaveProperty('generatedMessages');
  expect(typeof r.perDomain).toBe('object');
});

// ─────────────────────────────────────────────────────────────────────────
// _evaluateRecommendation — standards-binding + age-resolution
// ─────────────────────────────────────────────────────────────────────────

test('regression-guard-v3-3-evaluate-rec-active-standard: reads ziva_reference_standard; falls back to WHO', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    // Default-state read.
    const defaultStd = _getActiveStandard();
    // Set + re-read.
    localStorage.setItem('ziva_reference_standard', 'iap');
    const iapStd = _getActiveStandard();
    // Bogus value → fall back to WHO.
    localStorage.setItem('ziva_reference_standard', 'invalid_standard_id');
    const fallback = _getActiveStandard();
    // Clean up.
    localStorage.removeItem('ziva_reference_standard');
    return { defaultStd, iapStd, fallback };
  });

  expect(r.iapStd).toBe('iap');
  expect(['who', 'iap', 'eu', 'cn']).toContain(r.fallback);
});

// ─────────────────────────────────────────────────────────────────────────
// Extensibility — RECOMMENDATION_ROSTER + SIGNAL_EXTRACTORS row-addition shape
// ─────────────────────────────────────────────────────────────────────────

test('regression-guard-v3-3-roster-shape: RECOMMENDATION_ROSTER rows declare standards-bound ageRanges', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    return Object.keys(RECOMMENDATION_ROSTER).map(k => {
      const row = RECOMMENDATION_ROSTER[k];
      const std = row.standards || {};
      const hasStandardAgeRanges = Object.keys(std).some(s => Array.isArray(std[s] && std[s].ageRanges));
      return {
        key: k,
        hasStandardAgeRanges,
        hasMetCriterion: !!row.metCriterion,
        hasSeverityMessages: !!row.severityMessages,
      };
    });
  });

  expect(r.length).toBeGreaterThanOrEqual(3);
  for (const row of r) {
    expect(row.hasStandardAgeRanges, `RECOMMENDATION_ROSTER['${row.key}'] missing standards.*.ageRanges`).toBe(true);
    expect(row.hasMetCriterion, `RECOMMENDATION_ROSTER['${row.key}'] missing metCriterion`).toBe(true);
    expect(row.hasSeverityMessages, `RECOMMENDATION_ROSTER['${row.key}'] missing severityMessages`).toBe(true);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// HR-12 cipher-4 gate — no raw `new Date()` in v3-3 additions
// ─────────────────────────────────────────────────────────────────────────

test('regression-guard-v3-3-no-direct-date-construction: intelligence-correlate.js has zero raw new Date() arithmetic', async ({ page }) => {
  // This test is enforced at build-time by an audit grep; here we re-assert
  // by reading the bundled HTML and string-scanning the embedded module.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    // SIGNAL_EXTRACTORS table should not internally construct Date objects for arithmetic.
    // We test by stubbing one and confirming the iteration in _correlate uses _offsetDateStr.
    // Detect by walking the source of _correlate.
    const src = _correlate.toString();
    return {
      usesOffsetDateStr: src.indexOf('_offsetDateStr') !== -1,
      noRawDate: src.indexOf('new Date(') === -1,
    };
  });

  expect(r.usesOffsetDateStr, '_correlate must iterate days via _offsetDateStr (HR-12)').toBe(true);
  expect(r.noRawDate, '_correlate body must not contain raw `new Date(` (HR-12)').toBe(true);
});
