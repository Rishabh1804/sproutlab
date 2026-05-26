import { test, expect } from '@playwright/test';

// Sleep Arc 3 / Scoring S-2 (merged) — regression guards.
// First consumer of the v3-3 engine spine. Sleep-domain handlers register
// against v3-3 primitives (_domainPerRecordScore / _domainDayBonuses /
// _domainMetCount / _domainMetDuration / _domainBuildRecentData) and three
// new RECOMMENDATION_ROSTER rows (nightSleepHours, napCount, contactMinutes)
// join the substrate.
//
// Spec: docs/specs/sleep-redesign-v1.md §sleep-domain scoring contributions
// Sibling: docs/specs/scoring-redesign-v1.md §RECOMMENDATION_ROSTER
//
// Architect correction (2026-05-25, NON-NEGOTIABLE): contact-combination
// bonus fires for night+contact OR nap+contact. NOT nap-combination only.
// The `night+contact` and `night-only` cases below are explicit regression
// guards for that rule.
//
// QA chain canon-cc-008: Kael primary (handlers + ROSTER) + Maren consult
// (home.js render of resulting score). No styles.css → no triple-jurisdiction.

// ─────────────────────────────────────────────────────────────────────────
// Sleep classification — 3-class engine (night | nap | contact)
// ─────────────────────────────────────────────────────────────────────────

test('regression-guard-sleep-arc-3-classify-night: ≥4h sleep ending in 05:00–12:00 with bed location → night', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    const out = classifySleep('22:00', '06:30', 'bed', '2026-05-25');
    return out;
  });

  expect(r).not.toBeNull();
  expect(r.class, 'night sleep with ≥4h ending in morning band must classify as night').toBe('night');
  expect(r.dayAttribution).toBe('2026-05-25');
  expect(r.durationMin, '22:00→06:30 should be 510 min (cross-midnight)').toBe(510);
  expect(r.confidence).toBe('high');
});

test('regression-guard-sleep-arc-3-classify-nap: short daytime sleep with bed location → nap', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => classifySleep('13:00', '14:30', 'bed', '2026-05-25'));

  expect(r).not.toBeNull();
  expect(r.class, '1.5h daytime sleep must classify as nap').toBe('nap');
  expect(r.durationMin).toBe(90);
});

test('regression-guard-sleep-arc-3-classify-contact-location: location:contact ALWAYS produces class:contact', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    // Even a 6-hour overnight contact session stays class:contact (developmentally distinct)
    const longContact = classifySleep('22:00', '04:30', 'contact', '2026-05-25');
    const shortContact = classifySleep('15:00', '15:45', 'contact', '2026-05-25');
    return { longContact, shortContact };
  });

  expect(r.longContact.class, 'long contact sleep must still classify as contact').toBe('contact');
  expect(r.shortContact.class).toBe('contact');
});

test('regression-guard-sleep-arc-3-classify-human-location: location:human → class:contact (developmental category)', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => classifySleep('14:00', '15:30', 'human', '2026-05-25'));

  expect(r.class, 'human location is the highest-quality contact variant; class === contact').toBe('contact');
});

test('regression-guard-sleep-arc-3-day-attribution-rollover: bedtime<05:00 attributes to prior day', async ({ page }) => {
  // The live bug case: Sunday-night spillover logged as Monday-00:40.
  // Day-attribution rule reassigns to Sunday (dateKey − 1).
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    const spillover = classifySleep('00:40', '08:40', 'bed', '2026-05-18');  // logged on Monday
    const normal = classifySleep('22:00', '06:30', 'bed', '2026-05-18');     // normal Sunday→Monday
    const earlyMorningResume = classifySleep('05:30', '07:00', 'bed', '2026-05-18');  // after morning wake
    return { spillover, normal, earlyMorningResume };
  });

  expect(r.spillover.dayAttribution, 'bedtime 00:40 must attribute to prior day (Sunday)').toBe('2026-05-17');
  expect(r.normal.dayAttribution, 'normal 22:00 bedtime keeps the dateKey').toBe('2026-05-18');
  expect(r.earlyMorningResume.dayAttribution, '05:30 (≥300min) keeps dateKey').toBe('2026-05-18');
});

// ─────────────────────────────────────────────────────────────────────────
// normalizeSleep — lazy read-time normalizer
// ─────────────────────────────────────────────────────────────────────────

test('regression-guard-sleep-arc-3-normalize-preserves-originals: derived fields are underscore-prefixed; originals untouched', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    // Legacy record (pre-Arc-2 shape) — no `location` field.
    const legacy = { date: '2026-05-25', bedtime: '22:00', wakeTime: '06:30', type: 'night', napType: null };
    const n = normalizeSleep(legacy);
    return {
      normalized: n,
      originalType: legacy.type,
      originalLocation: legacy.location,
    };
  });

  expect(r.normalized).not.toBeNull();
  expect(r.normalized._class, 'derived class on legacy night record').toBe('night');
  expect(r.normalized._location, 'legacy records default to location:bed').toBe('bed');
  expect(r.normalized.type, 'original `type` preserved on the normalized object').toBe('night');
  expect(r.originalType, 'source record untouched').toBe('night');
  expect(r.originalLocation, 'legacy record never gets a location field injected').toBeUndefined();
});

// ─────────────────────────────────────────────────────────────────────────
// _domainPerRecordScore — sleep dispatcher
// ─────────────────────────────────────────────────────────────────────────

test('regression-guard-sleep-arc-3-per-record-score-night-bed: night × bed → baseline 1.0', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    const rec = normalizeSleep({ date: '2026-05-25', bedtime: '22:00', wakeTime: '06:30', location: 'bed' });
    return _domainPerRecordScore('sleep', rec);
  });

  expect(r, 'night × bed × neutral aux must equal 1.0 (no quality / no high wakeUps)').toBeCloseTo(1.0, 2);
});

test('regression-guard-sleep-arc-3-per-record-score-contact-human: contact × human → 0.8 × 1.3 = 1.04', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    const rec = normalizeSleep({ date: '2026-05-25', bedtime: '14:00', wakeTime: '15:30', location: 'human' });
    return _domainPerRecordScore('sleep', rec);
  });

  expect(r, 'contact × human (kangaroo-care optimum) → 0.8 × 1.3').toBeCloseTo(1.04, 2);
});

test('regression-guard-sleep-arc-3-per-record-score-nap-sofa-poor: aux multipliers stack', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    // nap × sofa × poor quality = 0.7 × 0.7 × 0.85
    const rec = normalizeSleep({ date: '2026-05-25', bedtime: '13:00', wakeTime: '14:30', location: 'sofa', quality: 'poor' });
    return _domainPerRecordScore('sleep', rec);
  });

  expect(r).toBeCloseTo(0.7 * 0.7 * 0.85, 3);
});

test('regression-guard-sleep-arc-3-per-record-score-night-wakeups-disrupted: night + wakeUps≥5 → ×0.85', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    const calm = normalizeSleep({ date: '2026-05-25', bedtime: '22:00', wakeTime: '06:30', location: 'bed', wakeUps: 1 });
    const disrupted = normalizeSleep({ date: '2026-05-25', bedtime: '22:00', wakeTime: '06:30', location: 'bed', wakeUps: 6 });
    return { calm: _domainPerRecordScore('sleep', calm), disrupted: _domainPerRecordScore('sleep', disrupted) };
  });

  expect(r.calm, '1 wakeUp does not trigger the disrupted multiplier').toBeCloseTo(1.0, 2);
  expect(r.disrupted, '6 wakeUps triggers ×0.85 on a night record').toBeCloseTo(0.85, 2);
});

// ─────────────────────────────────────────────────────────────────────────
// _domainDayBonuses — Architect 2026-05-25 ratification
// contact-combination bonus = night+contact OR nap+contact
// EXPLICIT REGRESSION GUARD: NOT nap-combination only.
// ─────────────────────────────────────────────────────────────────────────

test('regression-guard-sleep-arc-3-bonus-night-plus-contact: night+contact day fires +0.2 bonus', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    const night = normalizeSleep({ date: '2026-05-25', bedtime: '22:00', wakeTime: '06:30', location: 'bed' });
    const contactSession = normalizeSleep({ date: '2026-05-25', bedtime: '15:00', wakeTime: '15:45', location: 'human' });
    return _domainDayBonuses('sleep', [night, contactSession]);
  });

  expect(r, 'night+contact MUST fire the contact-combination bonus (Architect 2026-05-25)').toBeCloseTo(0.2, 3);
});

test('regression-guard-sleep-arc-3-bonus-nap-plus-contact: nap+contact day fires +0.2 bonus', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    const nap = normalizeSleep({ date: '2026-05-25', bedtime: '13:00', wakeTime: '14:30', location: 'bed' });
    const contactSession = normalizeSleep({ date: '2026-05-25', bedtime: '16:00', wakeTime: '16:30', location: 'contact' });
    return _domainDayBonuses('sleep', [nap, contactSession]);
  });

  expect(r, 'nap+contact MUST fire the contact-combination bonus').toBeCloseTo(0.2, 3);
});

test('regression-guard-sleep-arc-3-bonus-NOT-nap-combination-only: explicit guard against the wrong rule', async ({ page }) => {
  // Architect correction 2026-05-25: the bonus is night+contact OR nap+contact.
  // A naive implementation might gate only on nap+contact ("nap-combination").
  // This test makes the night+contact path a HARD REQUIREMENT — a regression
  // that breaks it (e.g., gating on nap only) must fail this assertion.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    // Build a day that has ONLY night + contact — NO nap at all.
    const night = normalizeSleep({ date: '2026-05-25', bedtime: '21:30', wakeTime: '07:00', location: 'bed' });
    const contactSession = normalizeSleep({ date: '2026-05-25', bedtime: '14:30', wakeTime: '15:30', location: 'human' });
    const dayHasNap = [night, contactSession].some(r => r._class === 'nap');
    const bonus = _domainDayBonuses('sleep', [night, contactSession]);
    return { dayHasNap, bonus };
  });

  expect(r.dayHasNap, 'sanity: this fixture has no nap-class record').toBe(false);
  expect(r.bonus, 'bonus MUST fire even when day has no nap — night+contact qualifies (Architect 2026-05-25)').toBeCloseTo(0.2, 3);
});

test('regression-guard-sleep-arc-3-bonus-night-only-no-bonus: night without contact → 0', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    const night = normalizeSleep({ date: '2026-05-25', bedtime: '22:00', wakeTime: '06:30', location: 'bed' });
    return _domainDayBonuses('sleep', [night]);
  });

  expect(r, 'no contact-class record → no bonus').toBe(0);
});

test('regression-guard-sleep-arc-3-bonus-contact-only-no-bonus: contact without structured sleep → 0', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    const contactOnly = normalizeSleep({ date: '2026-05-25', bedtime: '15:00', wakeTime: '15:30', location: 'human' });
    return _domainDayBonuses('sleep', [contactOnly]);
  });

  expect(r, 'contact alone without night or nap → no bonus').toBe(0);
});

test('regression-guard-sleep-arc-3-bonus-fires-once: multiple contact records → bonus fires ONCE per day', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    const night = normalizeSleep({ date: '2026-05-25', bedtime: '22:00', wakeTime: '06:30', location: 'bed' });
    const c1 = normalizeSleep({ date: '2026-05-25', bedtime: '11:00', wakeTime: '11:30', location: 'contact' });
    const c2 = normalizeSleep({ date: '2026-05-25', bedtime: '14:00', wakeTime: '14:30', location: 'human' });
    return _domainDayBonuses('sleep', [night, c1, c2]);
  });

  expect(r, 'bonus is per-day, not per-record — caps at 0.2 regardless of contact count').toBeCloseTo(0.2, 3);
});

// ─────────────────────────────────────────────────────────────────────────
// RECOMMENDATION_ROSTER additions — nightSleepHours / napCount / contactMinutes
// ─────────────────────────────────────────────────────────────────────────

test('regression-guard-sleep-arc-3-roster-night-sleep-hours: nightSleepHours row registered with v1 schema', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    const row = RECOMMENDATION_ROSTER.nightSleepHours;
    if (!row) return null;
    const stdKeys = Object.keys(row.standards || {});
    return {
      key: row.key,
      domain: row.domain,
      metCriterion: row.metCriterion,
      hasReward: typeof row.rewardWeight === 'number',
      hasMissed: typeof row.missedWeight === 'number',
      hasStreak: typeof row.streakPenalty === 'object',
      standards: stdKeys,
      hasSev: !!row.severityMessages,
      sevKeys: row.severityMessages ? Object.keys(row.severityMessages) : [],
    };
  });

  expect(r).not.toBeNull();
  expect(r.key).toBe('nightSleepHours');
  expect(r.domain).toBe('sleep');
  expect(r.metCriterion).toBe('duration');
  expect(r.hasReward).toBe(true);
  expect(r.hasMissed).toBe(true);
  expect(r.hasStreak).toBe(true);
  expect(r.standards).toEqual(expect.arrayContaining(['who', 'iap', 'eu', 'cn']));
  expect(r.sevKeys).toEqual(expect.arrayContaining(['gentle', 'firm', 'urgent']));
});

test('regression-guard-sleep-arc-3-roster-nap-count: napCount row registered with v1 schema + age-banded standards', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    const row = RECOMMENDATION_ROSTER.napCount;
    if (!row) return null;
    const whoAges = row.standards && row.standards.who && row.standards.who.ageRanges;
    return {
      key: row.key,
      metCriterion: row.metCriterion,
      whoBands: whoAges ? whoAges.length : 0,
      firstBandMinPerDay: whoAges && whoAges[0] ? whoAges[0].minPerDay : null,
    };
  });

  expect(r).not.toBeNull();
  expect(r.key).toBe('napCount');
  expect(r.metCriterion).toBe('count');
  expect(r.whoBands).toBeGreaterThanOrEqual(3);
  expect(r.firstBandMinPerDay, '0-4mo band requires multiple naps per day').toBeGreaterThanOrEqual(3);
});

test('regression-guard-sleep-arc-3-roster-contact-minutes: contactMinutes row registered with v1 schema', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    const row = RECOMMENDATION_ROSTER.contactMinutes;
    if (!row) return null;
    return {
      key: row.key,
      domain: row.domain,
      metCriterion: row.metCriterion,
      stdCount: Object.keys(row.standards || {}).length,
    };
  });

  expect(r).not.toBeNull();
  expect(r.key).toBe('contactMinutes');
  expect(r.domain).toBe('sleep');
  expect(r.metCriterion).toBe('duration');
  expect(r.stdCount).toBeGreaterThanOrEqual(2);
});

// ─────────────────────────────────────────────────────────────────────────
// _domainMetCount / _domainMetDuration — sleep dispatchers
// ─────────────────────────────────────────────────────────────────────────

test('regression-guard-sleep-arc-3-met-count-human-contact: counts location:human records only', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    const r1 = normalizeSleep({ date: '2026-05-25', bedtime: '14:00', wakeTime: '14:30', location: 'human' });
    const r2 = normalizeSleep({ date: '2026-05-25', bedtime: '15:00', wakeTime: '15:30', location: 'contact' });
    const r3 = normalizeSleep({ date: '2026-05-25', bedtime: '22:00', wakeTime: '06:30', location: 'bed' });
    return {
      humanCount: _domainMetCount('sleep', 'humanContact', { records: [r1, r2, r3] }),
      napCount:   _domainMetCount('sleep', 'napCount',     { records: [r1, r2, r3] }),
    };
  });

  expect(r.humanCount, 'humanContact must count only location:human, not generic contact').toBe(1);
  expect(r.napCount, 'no nap-class records → 0').toBe(0);
});

test('regression-guard-sleep-arc-3-met-duration-sleep-amount: sleepAmount sums hours across all classes', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    const night = normalizeSleep({ date: '2026-05-25', bedtime: '22:00', wakeTime: '06:00', location: 'bed' });   // 8h
    const nap = normalizeSleep({ date: '2026-05-25', bedtime: '13:00', wakeTime: '14:30', location: 'bed' });    // 1.5h
    const contactSess = normalizeSleep({ date: '2026-05-25', bedtime: '16:00', wakeTime: '16:30', location: 'human' }); // 0.5h
    return {
      sleepAmount:     _domainMetDuration('sleep', 'sleepAmount',     { records: [night, nap, contactSess] }),
      nightSleepHours: _domainMetDuration('sleep', 'nightSleepHours', { records: [night, nap, contactSess] }),
      contactMinutes:  _domainMetDuration('sleep', 'contactMinutes',  { records: [night, nap, contactSess] }),
    };
  });

  expect(r.sleepAmount, 'sleepAmount = 8 + 1.5 + 0.5 = 10').toBeCloseTo(10, 1);
  expect(r.nightSleepHours, 'nightSleepHours = night only = 8').toBeCloseTo(8, 1);
  expect(r.contactMinutes, 'contactMinutes (as hours) = 0.5').toBeCloseTo(0.5, 1);
});

// ─────────────────────────────────────────────────────────────────────────
// _domainBuildRecentData — sleep envelope shape
// ─────────────────────────────────────────────────────────────────────────

test('regression-guard-sleep-arc-3-build-recent-data: envelope shape + day-attribution honoring', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    const ds = '2026-05-18';
    const origSleep = Array.isArray(sleepData) ? sleepData.slice() : [];
    sleepData = [
      { date: '2026-05-18', bedtime: '22:00', wakeTime: '06:30', type: 'night' },  // Sunday night → attributes to Sunday (no, dateKey is Mon... see below)
      { date: '2026-05-18', bedtime: '00:40', wakeTime: '08:40', type: 'night' },  // The spillover bug — attributes to 2026-05-17
      { date: '2026-05-18', bedtime: '13:00', wakeTime: '14:30', type: 'nap' },    // Monday nap
    ];
    const recent = _domainBuildRecentData('sleep', ds, null);
    sleepData = origSleep;
    return {
      todayRecords: recent.today.records.length,
      todayClasses: recent.today.records.map((r: any) => r._class),
      historyLen: recent.history.length,
    };
  });

  // 2026-05-18 attribution: records 1 (22:00) and 3 (nap at 13:00) attach to 2026-05-18.
  // Record 2 (bedtime 00:40) attributes to 2026-05-17 → drops out of today.
  expect(r.todayRecords, '00:40 spillover record attributes to prior day — drops out of 2026-05-18').toBe(2);
  expect(r.todayClasses).toEqual(expect.arrayContaining(['night', 'nap']));
  expect(r.historyLen, '14-day history envelope').toBe(14);
});

// ─────────────────────────────────────────────────────────────────────────
// _scoreDay('sleep', ...) — end-to-end consumer
// ─────────────────────────────────────────────────────────────────────────

test('regression-guard-sleep-arc-3-score-day-end-to-end: _scoreDay(sleep) produces full schema with sleep contributions', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    const ds = '2026-05-25';
    const origSleep = Array.isArray(sleepData) ? sleepData.slice() : [];
    sleepData = [
      { date: ds, bedtime: '22:00', wakeTime: '06:30', type: 'night', location: 'bed' },
      { date: ds, bedtime: '14:00', wakeTime: '15:30', type: 'nap', location: 'human' },
    ];
    const out = _scoreDay('sleep', ds);
    sleepData = origSleep;
    return out;
  });

  expect(r).not.toBeNull();
  expect(r).toHaveProperty('raw');
  expect(r).toHaveProperty('rewards');
  expect(r).toHaveProperty('penalties');
  expect(r).toHaveProperty('dayBonuses');
  expect(r).toHaveProperty('total');
  expect(r).toHaveProperty('contributions');
  expect(r).toHaveProperty('severityLevel');
  expect(r).toHaveProperty('unmetRecommendations');
  expect(r).toHaveProperty('generatedMessages');
  expect(r.contributions.length, 'two sleep records contribute').toBe(2);
  // Day has a contact record (human) + structured (night, nap) → bonus active.
  expect(r.dayBonuses, 'night/nap + human(=contact) day fires contact-combination bonus').toBeCloseTo(0.2, 3);
  expect(r.raw, 'positive raw — bed night + human nap both positive').toBeGreaterThan(0);
});

// ─────────────────────────────────────────────────────────────────────────
// Hero score cross-domain integration
// ─────────────────────────────────────────────────────────────────────────

test('regression-guard-sleep-arc-3-hero-cross-domain: _scoreDayHero exposes sleep contribution in perDomain', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    const ds = '2026-05-25';
    const origSleep = Array.isArray(sleepData) ? sleepData.slice() : [];
    sleepData = [
      { date: ds, bedtime: '22:00', wakeTime: '06:30', type: 'night', location: 'bed' },
    ];
    const hero = _scoreDayHero(ds);
    sleepData = origSleep;
    return hero;
  });

  expect(r).not.toBeNull();
  expect(r.perDomain, 'hero exposes per-domain breakdown').toHaveProperty('sleep');
  expect(r.perDomain.sleep).toHaveProperty('total');
  expect(r.perDomain.sleep).toHaveProperty('contributions');
});

// ─────────────────────────────────────────────────────────────────────────
// Surface-quality scoring — location multipliers ordered as spec'd
// ─────────────────────────────────────────────────────────────────────────

test('regression-guard-sleep-arc-3-surface-quality-order: human > contact > bed > sofa > others > car (per spec)', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    // Fix one class (nap) and vary the location to isolate the multiplier.
    const make = (loc: string) => normalizeSleep({ date: '2026-05-25', bedtime: '14:00', wakeTime: '14:30', location: loc });
    return {
      human:   _domainPerRecordScore('sleep', make('human')),
      bed:     _domainPerRecordScore('sleep', make('bed')),
      contact: _domainPerRecordScore('sleep', make('contact')),
      sofa:    _domainPerRecordScore('sleep', make('sofa')),
      others:  _domainPerRecordScore('sleep', make('others')),
      car:     _domainPerRecordScore('sleep', make('car')),
    };
  });

  // Important: human-location records classify as `contact`, others as `nap`.
  // class-baseline + location multiplier products:
  //   human (contact-class):   0.8 × 1.3 = 1.04
  //   contact (contact-class): 0.8 × 0.9 = 0.72
  //   bed (nap-class):         0.7 × 1.0 = 0.70
  //   sofa (nap-class):        0.7 × 0.7 = 0.49
  //   others (nap-class):      0.7 × 0.6 = 0.42
  //   car (nap-class):         0.7 × 0.5 = 0.35
  expect(r.human, 'human is the highest-quality variant').toBeGreaterThan(r.contact);
  expect(r.contact, 'generic contact still strongly positive').toBeGreaterThan(r.bed);
  expect(r.bed, 'bed nap > sofa nap (intended surface)').toBeGreaterThan(r.sofa);
  expect(r.sofa, 'sofa > others default').toBeGreaterThan(r.others);
  expect(r.others, 'others default > car (vibration / restraint)').toBeGreaterThan(r.car);
});

// ─────────────────────────────────────────────────────────────────────────
// Honesty floor — severityMessages.*.strength is engine-internal posture.
// MUST NEVER be `.text`-substituted into prose (Charter CV3-006).
// ─────────────────────────────────────────────────────────────────────────

test('regression-guard-sleep-arc-3-honesty-strength-not-substituted: severityMessages.strength NEVER appears as text in surfaces', async ({ page }) => {
  // The strength field is engine-internal posture metadata (e.g.,
  // 'unmet-today', 'short-by-1h', 'critical-window'). It MUST NEVER be
  // rendered as parent-facing prose — only severityMessages.*.text is.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    // Collect every distinct strength label across all sleep-domain rows.
    const strengths: string[] = [];
    Object.keys(RECOMMENDATION_ROSTER).forEach((k) => {
      const row = RECOMMENDATION_ROSTER[k];
      if (row.domain !== 'sleep' || !row.severityMessages) return;
      Object.keys(row.severityMessages).forEach((lvl) => {
        const s = row.severityMessages[lvl] && row.severityMessages[lvl].strength;
        if (typeof s === 'string') strengths.push(s);
      });
    });
    return strengths;
  });

  expect(r.length, 'sleep-domain rows must declare at least one severityMessages.*.strength').toBeGreaterThan(0);

  // Read the rendered home + sleep tab; assert no strength label leaked into prose.
  // Use a generous text-search across the rendered body — these strings
  // are posture identifiers, so any appearance in the rendered DOM is
  // a violation of the honesty floor.
  const renderedText = await page.evaluate(() => document.body.innerText);
  for (const strength of r) {
    // Exclude reasonable English fragments that might appear elsewhere
    // (e.g., "today" alone). Match the exact posture label only.
    if (strength === 'today') continue;
    expect(
      renderedText.indexOf(strength),
      `severityMessages.strength label '${strength}' MUST NOT appear in rendered prose — engine-internal only`
    ).toBe(-1);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// Render surface — renderSleepArc3Insights produces NO inline styles + handlers
// ─────────────────────────────────────────────────────────────────────────

test('regression-guard-sleep-arc-3-surface-hr-compliance: no inline styles, no inline handlers on rendered surface', async ({ page }) => {
  // HR-2 + HR-3 compliance: the renderSleepArc3Insights output must not
  // contain `style="` or `on*=` inline handlers.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  // Seed sleep data so the surface actually renders.
  await page.evaluate(() => {
    const t = today();
    sleepData = [
      { date: t, bedtime: '22:00', wakeTime: '06:30', type: 'night', location: 'bed' },
      { date: t, bedtime: '14:00', wakeTime: '14:45', type: 'nap', location: 'human' },
    ];
    renderSleepArc3Insights();
  });

  const r = await page.evaluate(() => {
    const ids = ['sleepArc3Breakdown', 'sleepArc3Severity', 'sleepArc3Hero'];
    let anyFound = false;
    let inlineStyle = false;
    let inlineHandler = false;
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      anyFound = true;
      if (el.outerHTML.indexOf('style="') !== -1) inlineStyle = true;
      // Inline handlers like onclick="...", onmouseover="..."
      const html = el.outerHTML;
      if (/\son[a-z]+\s*=/i.test(html)) inlineHandler = true;
    });
    return { anyFound, inlineStyle, inlineHandler };
  });

  expect(r.anyFound, 'at least one Sleep Arc 3 insight strip should render given seeded data').toBe(true);
  expect(r.inlineStyle, 'HR-2: no inline styles on Sleep Arc 3 surface').toBe(false);
  expect(r.inlineHandler, 'HR-3: no inline event handlers on Sleep Arc 3 surface').toBe(false);
});
