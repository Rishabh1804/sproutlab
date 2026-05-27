import { test, expect } from '@playwright/test';

// milestone-engine-prep-v1 PR-A regression guards.
// Spec: docs/specs/milestone-engine-prep-v1.md §Test plan.
// QA chain canon-cc-008: Kael primary (engine substrate in core.js / data.js / sync.js);
// Maren consult (Care floor on safetyTier curation + clinical-band source attribution);
// Vela consult (contract-floor on output shapes for milestones-tab-v1 consumer).
// Charter alignment (CV3-006):
//   - Honesty (PRIMARY): every primitive asserts clinical-band-only output;
//     audit gate enforces no-personalised-prediction prose; source defaults to 'unverified'.
//   - Extensibility (CO-PRIMARY): explicit-state-injection signature (v3-3 _correlate precedent).
//   - Warmth: neutral axis for this engine spec; downstream milestones-tab-v1 carries.

declare const _predictMilestoneWindow: any;
declare const _getInWindowMilestones: any;
declare const _getActivityLevelToday: any;
declare const _setActivityLevelToday: any;
declare const _postReceiveMilestoneSuppress: any;
declare const _postReceiveActivityMeta: any;
declare const MILESTONE_STANDARDS: any;
declare const MILESTONE_SOURCE: any;
declare const DEFAULT_MILESTONES: any;
declare const KEYS: any;
declare const slugify: any;
declare let activityMeta: any;
declare let milestoneSuppress: any;

// ─────────────────────────────────────────────────────────────────────────
// _predictMilestoneWindow — Primitive 1
// ─────────────────────────────────────────────────────────────────────────

test('regression-guard-milestone-engine-prep-v1-predict-window-shape: output shape matches contract', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    // Pick a known WHO milestone — "Sits without support for extended periods" at bracket 6.
    const id = slugify('Sits without support for extended periods');
    return _predictMilestoneWindow(id, { standardKey: 'who' });
  });
  expect(r).not.toBeNull();
  expect(typeof r.expectedStart).toBe('number');
  expect(typeof r.expectedEnd).toBe('number');
  expect(typeof r.expectedStartMonths).toBe('number');
  expect(typeof r.expectedEndMonths).toBe('number');
  expect(typeof r.expectedStartMonthsFloat).toBe('number');
  expect(typeof r.expectedEndMonthsFloat).toBe('number');
  expect(typeof r.ageDays).toBe('number');
  expect(typeof r.ageWeeks).toBe('number');
  expect(typeof r.ageMonths).toBe('number');
  expect(typeof r.ageDaysRemainder).toBe('number');
  expect(['pre-window', 'in-window', 'post-window']).toContain(r.windowStatus);
  expect(typeof r.source).toBe('string');
  expect(r.standardKey).toBe('who');
  // V-V-58: precision contract — integer fields are rounded
  expect(r.expectedStartMonths).toBe(Math.round(r.expectedStartMonths));
  expect(r.expectedEndMonths).toBe(Math.round(r.expectedEndMonths));
});

test('regression-guard-milestone-engine-prep-v1-predict-window-source-from-data: source read from row.source never hardcoded', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    const id = slugify('Sits without support for extended periods');
    const w = _predictMilestoneWindow(id, { standardKey: 'who' });
    return { source: w?.source };
  });
  // V-M-114 floor: every row ships source:'unverified' by default; the primitive
  // returns whatever row.source carries — never hardcoded by wrapping key.
  expect(r.source).toBe('unverified');
});

test('regression-guard-milestone-engine-prep-v1-predict-window-status-classification: windowStatus correctly bracketed', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    const id = slugify('Sits without support for extended periods'); // WHO bracket 6
    const w = _predictMilestoneWindow(id, { standardKey: 'who' });
    return {
      ageDays: w.ageDays,
      expectedStart: w.expectedStart,
      expectedEnd: w.expectedEnd,
      windowStatus: w.windowStatus,
    };
  });
  // Verify the classification matches the bands.
  if (r.ageDays < r.expectedStart) expect(r.windowStatus).toBe('pre-window');
  else if (r.ageDays > r.expectedEnd) expect(r.windowStatus).toBe('post-window');
  else expect(r.windowStatus).toBe('in-window');
});

test('regression-guard-milestone-engine-prep-v1-predict-window-null-on-missing: returns null on unknown id, never throws', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    return {
      missing: _predictMilestoneWindow('this-milestone-does-not-exist', { standardKey: 'who' }),
      empty:   _predictMilestoneWindow('', { standardKey: 'who' }),
      notString: _predictMilestoneWindow(123 as any, { standardKey: 'who' }),
    };
  });
  expect(r.missing).toBeNull();
  expect(r.empty).toBeNull();
  expect(r.notString).toBeNull();
});

test('regression-guard-milestone-engine-prep-v1-predict-window-pure: same inputs → same outputs', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    const id = slugify('Starts raking grasp');
    const a = _predictMilestoneWindow(id, { standardKey: 'who' });
    const b = _predictMilestoneWindow(id, { standardKey: 'who' });
    return { a: JSON.stringify(a), b: JSON.stringify(b) };
  });
  expect(r.a).toBe(r.b);
});

test('regression-guard-milestone-engine-prep-v1-predict-window-advanced-shift: advanced:true rows offset by +1 bracket (V-K-116)', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    // "Pulls to stand from sitting" — WHO bracket 6, advanced:true → effective start at bracket 7.
    const id = slugify('Pulls to stand from sitting');
    const w = _predictMilestoneWindow(id, { standardKey: 'who' });
    if (!w) return { found: false };
    return {
      found: true,
      expectedStart: w.expectedStart,
      expectedEnd: w.expectedEnd,
      // bracket 7 * 30.44 = 213.08 days
      offsetCorrect: Math.abs(w.expectedStart - (7 * 30.44)) < 0.01,
    };
  });
  expect(r.found).toBe(true);
  expect(r.offsetCorrect).toBe(true);
});

// ─────────────────────────────────────────────────────────────────────────
// _getInWindowMilestones — Primitive 2
// ─────────────────────────────────────────────────────────────────────────

test('regression-guard-milestone-engine-prep-v1-in-window-cap-at-n: returns at most n non-safety entries', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    // Pick a wide ageDays (200) so multiple WHO brackets are in-window.
    // Filter to non-safety rows in the cap.
    const inWindow = _getInWindowMilestones(200, 3, { standardKey: 'who' });
    const nonSafety = inWindow.filter((c: any) => !c.safetyTier);
    return {
      total: inWindow.length,
      nonSafetyCount: nonSafety.length,
    };
  });
  expect(r.nonSafetyCount).toBeLessThanOrEqual(3);
});

test('regression-guard-milestone-engine-prep-v1-in-window-safety-tier-bypasses-cap: safetyTier:true rows always surface (V-M-102)', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    // Pick ageDays in the bracket-7 WHO range (~7 months) where "Finger feeding
    // begins" (safetyTier:true) is in-window. Cap n=1 so safety would otherwise be excluded.
    const inWindow = _getInWindowMilestones(220, 1, { standardKey: 'who' });
    const safetyHit = inWindow.find((c: any) => c.safetyTier === true);
    return {
      safetyPresent: !!safetyHit,
      safetyIds: inWindow.filter((c: any) => c.safetyTier).map((c: any) => c.milestoneId),
    };
  });
  // Bracket 7 (210-238 days) includes "Finger feeding begins" — must surface above n=1 cap.
  expect(r.safetyPresent).toBe(true);
});

test('regression-guard-milestone-engine-prep-v1-in-window-engagement-priority-ordering: results sorted by priority desc', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    // Non-safety subset (safety bypass scrambles order at the top).
    const inWindow = _getInWindowMilestones(220, 10, { standardKey: 'who' });
    const nonSafety = inWindow.filter((c: any) => !c.safetyTier);
    let monotonic = true;
    for (let i = 1; i < nonSafety.length; i++) {
      if (nonSafety[i].priority > nonSafety[i - 1].priority) { monotonic = false; break; }
    }
    return { count: nonSafety.length, monotonic };
  });
  expect(r.monotonic).toBe(true);
});

test('regression-guard-milestone-engine-prep-v1-in-window-suppression-filter: suppressed milestones excluded', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    // Suppress a known in-window milestone for the next 7 days.
    const targetId = slugify('Sits without support for extended periods');
    const future = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const sup: any = {};
    sup[targetId] = future;
    const inWindow = _getInWindowMilestones(200, 10, { standardKey: 'who', suppressMap: sup });
    const found = inWindow.find((c: any) => c.milestoneId === targetId);
    return { foundSuppressed: !!found };
  });
  expect(r.foundSuppressed).toBe(false);
});

test('regression-guard-milestone-engine-prep-v1-in-window-per-item-shape: per-item return mirrors contract (V-V-71 fold)', async ({ page }) => {
  // V-V-71 fold (Vela engine-prep PR-A audit): assert the per-item return
  // carries the full set of contract fields including the V-V-68-expanded
  // `window` sub-object (mirrors _predictMilestoneWindow ReturnType).
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    const inWindow = _getInWindowMilestones(220, 10, { standardKey: 'who' });
    const item = inWindow[0];
    if (!item) return null;
    return {
      hasMilestoneId: typeof item.milestoneId === 'string',
      hasText: typeof item.text === 'string',
      hasIcon: typeof item.icon === 'string',
      hasDomain: typeof item.domain === 'string',
      hasEvidenceStatus: ['confirmed', 'practicing', 'not-yet'].includes(item.evidenceStatus),
      hasEvidenceCount: typeof item.evidenceCount === 'number',
      hasLastEvidenceAt: item.lastEvidenceAt === null || typeof item.lastEvidenceAt === 'number',
      hasPriority: typeof item.priority === 'number',
      hasSafetyTier: typeof item.safetyTier === 'boolean',
      // V-V-68: window sub-object carries the full _predictMilestoneWindow shape
      windowKeys: item.window ? Object.keys(item.window).sort().join(',') : null,
    };
  });
  expect(r).not.toBeNull();
  expect(r.hasMilestoneId).toBe(true);
  expect(r.hasText).toBe(true);
  expect(r.hasIcon).toBe(true);
  expect(r.hasDomain).toBe(true);
  expect(r.hasEvidenceStatus).toBe(true);
  expect(r.hasEvidenceCount).toBe(true);
  expect(r.hasLastEvidenceAt).toBe(true);
  expect(r.hasPriority).toBe(true);
  expect(r.hasSafetyTier).toBe(true);
  // V-V-68 expanded window shape — full _predictMilestoneWindow contract mirrored
  expect(r.windowKeys).toContain('ageDays');
  expect(r.windowKeys).toContain('ageMonths');
  expect(r.windowKeys).toContain('ageDaysRemainder');
  expect(r.windowKeys).toContain('windowStatus');
  expect(r.windowKeys).toContain('expectedStart');
  expect(r.windowKeys).toContain('expectedEnd');
  expect(r.windowKeys).toContain('source');
  expect(r.windowKeys).toContain('standardKey');
});

test('regression-guard-milestone-engine-prep-v1-predict-window-dob-override: opts.dobOverride routes through dateForAge (V-V-69 fold)', async ({ page }) => {
  // V-V-69 fold (Vela engine-prep PR-A audit): opts.dobOverride must actually
  // affect the ageDays calculation. Spec V-K-115 ratified the param "for unit-
  // test injection only" — confirm it's not silently ignored.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    const id = slugify('Sits without support for extended periods');
    const today = _predictMilestoneWindow(id, { standardKey: 'who' });
    // Inject a dobOverride of today — ageDays should land at 0.
    const todayStr = (function() {
      const d = new Date();
      return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    })();
    const overridden = _predictMilestoneWindow(id, { standardKey: 'who', dobOverride: todayStr });
    return {
      todayAgeDays: today.ageDays,
      overriddenAgeDays: overridden.ageDays,
    };
  });
  expect(r.overriddenAgeDays).toBe(0);
  expect(r.todayAgeDays).toBeGreaterThan(0); // Ziva is born 4 Sep 2025; today is later
});

test('regression-guard-milestone-engine-prep-v1-in-window-explicit-state-injection: opts.standards/milestones inject cleanly (V-K-108)', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    // Inject a fake standards object with a single row in bracket 6.
    const fakeStandards = {
      who: {
        6: [
          { text: 'Sample motor milestone', advanced: false, cat: 'motor', source: 'unverified' },
        ],
      },
    };
    const inWindow = _getInWindowMilestones(200, 3, {
      standardKey: 'who',
      standards: fakeStandards,
      milestones: [],
      suppressMap: {},
      nowAgeDays: 200,
    });
    return {
      count: inWindow.length,
      milestoneId: inWindow[0]?.milestoneId,
      hasText: inWindow[0]?.text === 'Sample motor milestone',
    };
  });
  expect(r.count).toBe(1);
  expect(r.milestoneId).toBe(slugifyEqual('Sample motor milestone'));
  expect(r.hasText).toBe(true);
});

// Helper for the explicit-state-injection test — match the slug deterministically.
function slugifyEqual(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// ─────────────────────────────────────────────────────────────────────────
// _getActivityLevelToday + _setActivityLevelToday — Primitive 3
// ─────────────────────────────────────────────────────────────────────────

test('regression-guard-milestone-engine-prep-v1-activitylevel-getter-null-default: unset day returns null', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    // Clear any prior state.
    activityMeta = {};
    return {
      neverSet: _getActivityLevelToday('2026-05-27'),
      missingArg: _getActivityLevelToday(''),
      wrongType: _getActivityLevelToday(null as any),
    };
  });
  expect(r.neverSet).toBeNull();
  expect(r.missingArg).toBeNull();
  expect(r.wrongType).toBeNull();
});

test('regression-guard-milestone-engine-prep-v1-activitylevel-setter-creates-day-record: setter lazily creates entry (V-K-109)', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    activityMeta = {};
    _setActivityLevelToday('2026-05-28', 3);
    return {
      level: _getActivityLevelToday('2026-05-28'),
      stored: activityMeta['2026-05-28'],
    };
  });
  expect(r.level).toBe(3);
  expect(r.stored.activityLevel).toBe(3);
});

test('regression-guard-milestone-engine-prep-v1-activitylevel-setter-idempotent: same level → no-op', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    activityMeta = { '2026-05-29': { activityLevel: 2 } };
    // Spy on localStorage.setItem — same level should not trigger write.
    let writeCount = 0;
    const orig = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function(k: string, v: string) {
      if (k === KEYS.activityMeta) writeCount++;
      return orig(k, v);
    };
    _setActivityLevelToday('2026-05-29', 2);
    const sameLevel = writeCount;
    _setActivityLevelToday('2026-05-29', 4);
    const diffLevel = writeCount;
    localStorage.setItem = orig;
    return { sameLevelWrites: sameLevel, diffLevelWrites: diffLevel };
  });
  expect(r.sameLevelWrites).toBe(0);
  expect(r.diffLevelWrites).toBe(1);
});

test('regression-guard-milestone-engine-prep-v1-activitylevel-setter-null-clears: null clears + removes empty day', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    activityMeta = { '2026-05-30': { activityLevel: 3 } };
    _setActivityLevelToday('2026-05-30', null);
    return {
      level: _getActivityLevelToday('2026-05-30'),
      dayEntryStillThere: '2026-05-30' in activityMeta,
    };
  });
  expect(r.level).toBeNull();
  expect(r.dayEntryStillThere).toBe(false);
});

test('regression-guard-milestone-engine-prep-v1-activitylevel-rejects-invalid-level: setter ignores non-1-4 values', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    activityMeta = {};
    _setActivityLevelToday('2026-05-31', 0 as any);
    _setActivityLevelToday('2026-05-31', 5 as any);
    _setActivityLevelToday('2026-05-31', 'high' as any);
    return {
      after: activityMeta['2026-05-31'],
    };
  });
  expect(r.after).toBeUndefined();
});

// ─────────────────────────────────────────────────────────────────────────
// Sync registration — Primitive 4 + cross-device merge hooks
// ─────────────────────────────────────────────────────────────────────────

test('regression-guard-milestone-engine-prep-v1-sync-keys-registered: KEYS.milestoneSuppress + KEYS.activityMeta in SYNC_KEYS (V-K-104)', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    return {
      suppressInKeys: !!KEYS.milestoneSuppress,
      activityMetaInKeys: !!KEYS.activityMeta,
      suppressLsKey: KEYS.milestoneSuppress,
      activityMetaLsKey: KEYS.activityMeta,
      // @ts-ignore — SYNC_KEYS is a module-global
      suppressInSyncKeys: !!(typeof SYNC_KEYS !== 'undefined' && SYNC_KEYS[KEYS.milestoneSuppress]),
      // @ts-ignore
      activityMetaInSyncKeys: !!(typeof SYNC_KEYS !== 'undefined' && SYNC_KEYS[KEYS.activityMeta]),
    };
  });
  expect(r.suppressInKeys).toBe(true);
  expect(r.activityMetaInKeys).toBe(true);
  expect(r.suppressLsKey).toBe('ziva_milestone_suppress');
  expect(r.activityMetaLsKey).toBe('ziva_activity_meta');
  expect(r.suppressInSyncKeys).toBe(true);
  expect(r.activityMetaInSyncKeys).toBe(true);
});

test('regression-guard-milestone-engine-prep-v1-suppress-merge-timestamp-max: remote later wins; expired entries purged (V-M-116)', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    const past = Date.now() - 1000; // already expired
    const futureLow = Date.now() + 10000;
    const futureHigh = Date.now() + 20000;
    const remote = { 'sitting': futureHigh, 'rolling': past, 'expired-only': past };
    const local  = { 'sitting': futureLow,  'pointing': futureLow };
    const merged = _postReceiveMilestoneSuppress(remote, local);
    return {
      // remote later wins
      sittingWinner: merged.sitting === futureHigh,
      // pointing — only local, preserved
      pointingPreserved: merged.pointing === futureLow,
      // rolling — both expired-or-past — purged
      rollingPurged: !('rolling' in merged),
      // expired-only — purged
      expiredPurged: !('expired-only' in merged),
    };
  });
  expect(r.sittingWinner).toBe(true);
  expect(r.pointingPreserved).toBe(true);
  expect(r.rollingPurged).toBe(true);
  expect(r.expiredPurged).toBe(true);
});

test('regression-guard-milestone-engine-prep-v1-activity-meta-merge-field-fold: per-dateKey fields fold remote-wins (V-K-111)', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    const remote = { '2026-05-27': { activityLevel: 4 }, '2026-05-28': { activityLevel: 2 } };
    const local  = { '2026-05-27': { activityLevel: 1 }, '2026-05-29': { activityLevel: 3 } };
    const merged = _postReceiveActivityMeta(remote, local);
    return {
      // Remote wins on scalar conflict for 2026-05-27
      day27: merged['2026-05-27'].activityLevel,
      // Local-only preserved for 2026-05-29
      day29: merged['2026-05-29'].activityLevel,
      // Remote-only preserved for 2026-05-28
      day28: merged['2026-05-28'].activityLevel,
    };
  });
  expect(r.day27).toBe(4);
  expect(r.day29).toBe(3);
  expect(r.day28).toBe(2);
});

// ─────────────────────────────────────────────────────────────────────────
// Data shape — MILESTONE_SOURCE constant + safetyTier curation
// ─────────────────────────────────────────────────────────────────────────

test('regression-guard-milestone-engine-prep-v1-source-vocabulary: MILESTONE_SOURCE controlled vocabulary present (V-M-113)', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    return {
      isArray: Array.isArray(MILESTONE_SOURCE),
      vocab: MILESTONE_SOURCE,
    };
  });
  expect(r.isArray).toBe(true);
  expect(r.vocab).toEqual(['WHO', 'CDC', 'AAP', 'IAP', 'EU', 'CN', 'unverified']);
});

test('regression-guard-milestone-engine-prep-v1-safety-tier-curation: 5 Maren-signed rows tagged safetyTier:true (V-M-112)', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    const expected = [
      'Finger feeding begins',
      'Pincer grasp developing',
      'Pincer grasp refined',
      'Drinks from a cup (with help)',
      'Explores objects by mouthing, shaking, banging',
    ];
    const found: Record<string, boolean> = {};
    // Walk WHO brackets to find the 4 motor rows.
    Object.keys(MILESTONE_STANDARDS.who).forEach((br: any) => {
      const rows = MILESTONE_STANDARDS.who[br];
      if (!Array.isArray(rows)) return;
      rows.forEach((row: any) => {
        if (expected.includes(row.text) && row.safetyTier === true) found[row.text] = true;
      });
    });
    // The "Explores objects by mouthing..." row lives under IAP.
    Object.keys(MILESTONE_STANDARDS.iap).forEach((br: any) => {
      const rows = MILESTONE_STANDARDS.iap[br];
      if (!Array.isArray(rows)) return;
      rows.forEach((row: any) => {
        if (expected.includes(row.text) && row.safetyTier === true) found[row.text] = true;
      });
    });
    return {
      foundCount: Object.keys(found).length,
      missing: expected.filter(t => !found[t]),
    };
  });
  expect(r.foundCount).toBe(5);
  expect(r.missing).toEqual([]);
});

test('regression-guard-milestone-engine-prep-v1-source-default-unverified: every MILESTONE_STANDARDS row ships source field (V-M-114)', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    let missing = 0;
    let unverified = 0;
    let total = 0;
    Object.values(MILESTONE_STANDARDS).forEach((std: any) => {
      Object.values(std).forEach((rows: any) => {
        if (!Array.isArray(rows)) return;
        rows.forEach((row: any) => {
          total++;
          if (typeof row.source !== 'string') missing++;
          else if (row.source === 'unverified') unverified++;
        });
      });
    });
    return { missing, unverified, total };
  });
  expect(r.missing).toBe(0);
  // V-M-114 floor: every row defaults to 'unverified'. Future curation arc upgrades.
  expect(r.unverified).toBe(r.total);
});

test('regression-guard-milestone-engine-prep-v1-seed-rows: 2 new sensory + cognitive seed milestones (V-K-103 + V-M-118)', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    // PR-B cat→domain rename: read via domain (canonical) with legacy fallback.
    const sensory = DEFAULT_MILESTONES.find((m: any) => (m.domain || m.cat) === 'sensory');
    const cognitive = DEFAULT_MILESTONES.find((m: any) => (m.domain || m.cat) === 'cognitive');
    return {
      sensoryText: sensory?.text,
      sensorySafety: sensory?.safetyTier === true,
      sensorySource: sensory?.source,
      cognitiveText: cognitive?.text,
      cognitiveSafety: cognitive?.safetyTier === true,
      cognitiveSource: cognitive?.source,
    };
  });
  expect(r.sensoryText).toBe('Mouths and explores objects with hands');
  expect(r.sensorySafety).toBe(true);
  expect(r.sensorySource).toBe('unverified');
  expect(r.cognitiveText).toBe('Searches for hidden objects (object permanence emerging)');
  expect(r.cognitiveSafety).toBe(false);
  expect(r.cognitiveSource).toBe('unverified');
});

// ─────────────────────────────────────────────────────────────────────────
// Audit gate self-test
// ─────────────────────────────────────────────────────────────────────────

test('regression-guard-milestone-engine-prep-v1-audit-gate-wired: 8th audit gate present in build pipeline', async ({ page }) => {
  // Read build.sh and confirm the new gate is wired between v3-6 + bump-version.
  const fs = require('fs');
  const buildScript = fs.readFileSync('split/build.sh', 'utf8');
  expect(buildScript).toContain('audit-no-personalised-prediction-v1.sh');
  // And the script file itself exists.
  expect(fs.existsSync('split/audit-no-personalised-prediction-v1.sh')).toBe(true);
});
