import { test, expect } from '@playwright/test';

// milestone-engine-prep-v1 PR-B regression guards.
// Spec: docs/specs/milestone-engine-prep-v1.md §Primitive 5 + §Test plan.
// QA chain canon-cc-008: Maren primary (consumer migration sweep in home.js + medical.js);
// Kael consult (merge function + post-receive integration + cold-load migration).
// Charter alignment (CV3-006):
//   - Extensibility (CO-PRIMARY): cat→domain rename closes registry-binding ambiguity at row 1
//   - Honesty (PRIMARY): cross-device sync no longer re-pollutes migrated rows with cat:
//     from a losing-side entry on a device still on the old schema

declare const _mergeMilestoneFieldsInline: any;
declare const _postReceiveMilestones: any;
declare let milestones: any;
declare const DEFAULT_MILESTONES: any;
declare const MILESTONE_STANDARDS: any;
declare const slugify: any;

// ─────────────────────────────────────────────────────────────────────────
// Data-tier cat→domain rename — DEFAULT_MILESTONES + MILESTONE_STANDARDS
// ─────────────────────────────────────────────────────────────────────────

test('regression-guard-milestone-engine-prep-v1-pr-b-data-renamed: 0 cat:, all rows carry domain: in data.js', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    let catCount = 0;
    let domainCount = 0;
    let totalRows = 0;
    // DEFAULT_MILESTONES
    DEFAULT_MILESTONES.forEach((m: any) => {
      totalRows++;
      if (typeof m.cat === 'string') catCount++;
      if (typeof m.domain === 'string') domainCount++;
    });
    // MILESTONE_STANDARDS
    Object.values(MILESTONE_STANDARDS).forEach((std: any) => {
      Object.values(std).forEach((rows: any) => {
        if (!Array.isArray(rows)) return;
        rows.forEach((row: any) => {
          totalRows++;
          if (typeof row.cat === 'string') catCount++;
          if (typeof row.domain === 'string') domainCount++;
        });
      });
    });
    return { catCount, domainCount, totalRows };
  });
  expect(r.catCount).toBe(0);          // V-K-110 floor — zero cat: residue
  expect(r.domainCount).toBe(r.totalRows); // every row carries domain:
  expect(r.totalRows).toBeGreaterThanOrEqual(200); // ~9 + ~194 = ~203
});

// ─────────────────────────────────────────────────────────────────────────
// Cold-load migration (core.js init) — V-K-110 + V-K-119 floors
// ─────────────────────────────────────────────────────────────────────────

test('regression-guard-milestone-engine-prep-v1-pr-b-cold-load-migrates: legacy cat: rows gain domain: at init', async ({ page }) => {
  // Seed a legacy-shaped milestone in localStorage BEFORE the app loads.
  await page.addInitScript(() => {
    const legacy = [
      { id: 'legacy-cat-rolling', text: 'Rolling', status: 'mastered', advanced: false, cat: 'motor' },
      { id: 'legacy-cat-babbling', text: 'Babbling', status: 'mastered', advanced: false, cat: 'language' },
    ];
    localStorage.setItem('ziva_milestones', JSON.stringify(legacy));
    localStorage.setItem('ziva_kv_milestones', 'v4'); // bypass KEY_VERSIONS reset on first boot
  });
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(1000);
  const r = await page.evaluate(() => {
    const rolling = milestones.find((m: any) => m.id === 'legacy-cat-rolling');
    const babbling = milestones.find((m: any) => m.id === 'legacy-cat-babbling');
    return {
      rollingDomain: rolling?.domain,
      rollingCat: rolling?.cat,
      babblingDomain: babbling?.domain,
      babblingCat: babbling?.cat,
    };
  });
  // Cold-load migration: cat → domain when domain absent
  expect(r.rollingDomain).toBe('motor');
  expect(r.babblingDomain).toBe('language');
  // Legacy cat: preserved (read-only fallback during deprecation cycle)
  expect(r.rollingCat).toBe('motor');
  expect(r.babblingCat).toBe('language');
});

test('regression-guard-milestone-engine-prep-v1-pr-b-divergence-reconciliation: V-K-119 cat≠domain → cat cleared', async ({ page }) => {
  await page.addInitScript(() => {
    // Partial-state row: cat says one thing, domain says another. Spec §V-K-119:
    // domain wins; cat cleared (one-way migration direction).
    const partial = [
      { id: 'divergent-row', text: 'Test divergent milestone', status: 'mastered', advanced: false, cat: 'motor', domain: 'cognitive' },
    ];
    localStorage.setItem('ziva_milestones', JSON.stringify(partial));
    localStorage.setItem('ziva_kv_milestones', 'v4');
  });
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(1000);
  const r = await page.evaluate(() => {
    const row = milestones.find((m: any) => m.id === 'divergent-row');
    return { domain: row?.domain, cat: row?.cat };
  });
  expect(r.domain).toBe('cognitive'); // domain wins
  expect(r.cat).toBeNull();             // cat cleared
});

test('regression-guard-milestone-engine-prep-v1-pr-b-cold-load-idempotent: already-migrated rows untouched', async ({ page }) => {
  await page.addInitScript(() => {
    // Already-migrated row — only domain, no cat.
    const migrated = [
      { id: 'pre-migrated', text: 'Pre-migrated milestone', status: 'mastered', advanced: false, domain: 'motor' },
    ];
    localStorage.setItem('ziva_milestones', JSON.stringify(migrated));
    localStorage.setItem('ziva_kv_milestones', 'v4');
  });
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(1000);
  const r = await page.evaluate(() => {
    const row = milestones.find((m: any) => m.id === 'pre-migrated');
    return { domain: row?.domain, hasCat: 'cat' in row };
  });
  expect(r.domain).toBe('motor');
  expect(r.hasCat).toBe(false); // never created a cat field
});

// ─────────────────────────────────────────────────────────────────────────
// _mergeMilestoneFieldsInline — V-M-110 + V-K-110 floors
// ─────────────────────────────────────────────────────────────────────────

test('regression-guard-milestone-engine-prep-v1-pr-b-merge-drops-cat-writeback: cat: not re-introduced (V-K-110)', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    // Winner has only domain; loser has only cat (legacy). Merge should NOT
    // write loser.cat into winner.cat (drops the legacy write-back).
    const winner: any = { id: 'w', text: 'W', status: 'practicing', domain: 'motor' };
    const loser: any  = { id: 'l', text: 'L', status: 'practicing', cat: 'language' };
    _mergeMilestoneFieldsInline(winner, loser);
    return { winnerDomain: winner.domain, winnerHasCat: 'cat' in winner };
  });
  // Winner keeps its own domain (winner-keeps-or-loser-fills semantics; winner has it).
  expect(r.winnerDomain).toBe('motor');
  // Critical: cat: NOT written back even though loser has it.
  expect(r.winnerHasCat).toBe(false);
});

test('regression-guard-milestone-engine-prep-v1-pr-b-merge-fallback-cat-to-domain: legacy cat: fills domain when absent', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    // Winner has neither domain nor cat. Loser has only legacy cat.
    // Merge: legacy cat fills domain (one-way migration during deprecation).
    const winner: any = { id: 'w', text: 'W', status: 'practicing' };
    const loser: any  = { id: 'l', text: 'L', status: 'practicing', cat: 'cognitive' };
    _mergeMilestoneFieldsInline(winner, loser);
    return { winnerDomain: winner.domain, winnerHasCat: 'cat' in winner };
  });
  expect(r.winnerDomain).toBe('cognitive'); // legacy cat → domain
  expect(r.winnerHasCat).toBe(false);        // still no cat written
});

test('regression-guard-milestone-engine-prep-v1-pr-b-merge-safety-tier-once-flagged: loser-wins-on-true', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    // Care floor: safetyTier once flagged stays flagged across sync merges.
    const winner: any = { id: 'w', text: 'W', status: 'practicing', domain: 'motor' };
    const loser: any  = { id: 'l', text: 'L', status: 'practicing', domain: 'motor', safetyTier: true };
    _mergeMilestoneFieldsInline(winner, loser);
    return { winnerSafety: winner.safetyTier };
  });
  expect(r.winnerSafety).toBe(true);
});

test('regression-guard-milestone-engine-prep-v1-pr-b-merge-source-upgrade: attributed wins over unverified', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    // Winner has source:'unverified'; loser has source:'WHO'. Merge prefers
    // attributed over unverified (winner-keeps-or-loser-upgrades).
    const winner: any = { id: 'w', text: 'W', status: 'practicing', domain: 'motor', source: 'unverified' };
    const loser: any  = { id: 'l', text: 'L', status: 'practicing', domain: 'motor', source: 'WHO' };
    _mergeMilestoneFieldsInline(winner, loser);
    return { winnerSource: winner.source };
  });
  expect(r.winnerSource).toBe('WHO');
});

// ─────────────────────────────────────────────────────────────────────────
// _postReceiveMilestones — V-K-110 row-migration integration
// ─────────────────────────────────────────────────────────────────────────

test('regression-guard-milestone-engine-prep-v1-pr-b-post-receive-migrates: cat→domain runs on cross-device receive', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    // Inject a fresh remote-shaped (legacy-cat) milestone into the global array.
    milestones.push({ id: 'remote-legacy', text: 'Remote legacy milestone', status: 'mastered', cat: 'social' });
    _postReceiveMilestones();
    const row = milestones.find((m: any) => m.id === 'remote-legacy');
    return { domain: row?.domain, cat: row?.cat };
  });
  expect(r.domain).toBe('social');
  expect(r.cat).toBe('social'); // legacy preserved during deprecation cycle
});

test('regression-guard-milestone-engine-prep-v1-pr-b-post-receive-divergence: V-K-119 conflict reconciliation fires', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    milestones.push({ id: 'remote-divergent', text: 'Remote divergent', status: 'mastered', cat: 'motor', domain: 'cognitive' });
    _postReceiveMilestones();
    const row = milestones.find((m: any) => m.id === 'remote-divergent');
    return { domain: row?.domain, cat: row?.cat };
  });
  expect(r.domain).toBe('cognitive');
  expect(r.cat).toBeNull();
});
