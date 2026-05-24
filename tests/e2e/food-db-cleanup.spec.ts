import { test, expect } from '@playwright/test';

// Arc C food-DB cleanup regression guards.
// Spec: docs/specs/food-db-cleanup-v1.md.
// C-1 tests (3): NUTRITION dedupe + alias-resolve + synonyms-not-in-NUTRITION.
// C-1.5 tests (5): factuality regression guards — tag-vs-nutrient shape consistency
//                  + iron-nutrient inverse allowlist + distinct-key floor.
// QA chain canon-cc-008: Maren + Kael Mode-1 parallel → Lyra synth → Cipher Edict V.

// V-K-61: iron-nutrient-without-iron-rich-tag allowlist. Entries that legitimately
// carry `iron` in nutrients[] but NOT `iron-rich` in tags[] (sub-cohort presence —
// real iron, but below the iron-rich tier defined by cashew/peanut/sesame/dals/halim).
// Lives in test file (not data.js) per V-K-61 — it's a test fixture, not runtime data.
const IRON_NUTRIENT_NO_TAG_ALLOWLIST = new Set([
  'amla',        // ~1.7mg/100g; iron-absorption framing (vit C enhances OTHER foods)
  'coconut',     // ~2.4mg/100g; primary claims are healthy-fats + energy
  'green peas',  // ~1.5mg/100g; below iron-rich cohort floor
  'prune',       // ~0.9mg/100g; primary claim is constipation-relief
  'jamun',       // ~1.4mg/100g; primary claims are vit C + antioxidant
  'turmeric',    // spice-tier — per-100g chemistry, not per-serving care guidance
  'jeera',       // spice-tier
  'cumin',       // spice-tier
]);

test('regression-guard-c1-no-duplicate-nutrition-keys: split/data.js NUTRITION block declares each key exactly once', async ({ request }) => {
  // Source-level sweep — JS object literal silently retains the LAST declaration when keys repeat,
  // dropping signal from the first. The runtime Object.keys(NUTRITION).length === sourceDecls is
  // the assertion that catches future authoring drift.
  const res = await request.get('/split/data.js');
  expect(res.ok()).toBe(true);
  const src = await res.text();

  const startIdx = src.indexOf('const NUTRITION = {');
  expect(startIdx).toBeGreaterThan(-1);
  let depth = 0, endIdx = -1;
  for (let i = startIdx; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { endIdx = i; break; } }
  }
  expect(endIdx).toBeGreaterThan(startIdx);

  const body = src.slice(startIdx, endIdx + 1);
  // Single-quoted keys only — matches the project's NUTRITION-block convention.
  // If a future PR introduces "double-quoted" keys, harden this regex.
  const keyRE = /^\s*'([^']+)'\s*:\s*\{/gm;
  const counts = new Map<string, number>();
  let m: RegExpExecArray | null;
  while ((m = keyRE.exec(body)) !== null) {
    counts.set(m[1], (counts.get(m[1]) || 0) + 1);
  }
  const dupes = [...counts.entries()].filter(([, n]) => n > 1).map(([k, n]) => `${k} (×${n})`);
  expect(dupes, 'NUTRITION block must not declare any key twice (JS silently keeps the LAST, dropping signal)').toEqual([]);

  const totalDecls = [...counts.values()].reduce((a, b) => a + b, 0);
  expect(counts.size).toBe(totalDecls);
});

test('regression-guard-c1-all-synonyms-aliased: every removed NUTRITION synonym resolves via _baseFoodName() to its canonical', async ({ page }) => {
  // The C-1 cleanup removed these synonym keys from NUTRITION. Each must still resolve to a
  // valid NUTRITION entry via _baseFoodName() (which consults _FOOD_ALIASES).
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const synonymToCanonical: Record<string, string> = {
      'yogurt': 'curd',
      'yoghurt': 'curd',
      'dahi': 'curd',
      'lauki': 'bottle gourd',
      'til': 'sesame',
      'date (fruit)': 'date',
      'lychee': 'litchi',
      'kishmish': 'raisins',
      'aliv': 'halim',
    };
    const failures: Array<{ synonym: string; expected: string; resolved: string; hasNutrition: boolean }> = [];
    Object.entries(synonymToCanonical).forEach(([syn, canon]) => {
      // _baseFoodName must map the synonym to its canonical (or to itself, if the alias resolves
      // through a multi-step normalize). Then NUTRITION[canonical] must exist.
      const resolved = _baseFoodName(syn);
      const hasNutrition = !!NUTRITION[canon];
      if (resolved !== canon || !hasNutrition) {
        failures.push({ synonym: syn, expected: canon, resolved, hasNutrition });
      }
    });
    return failures;
  });

  expect(r, 'every removed synonym must alias to a live NUTRITION key').toEqual([]);
});

test('regression-guard-c1-synonyms-not-in-nutrition: synonym keys are not declared as standalone NUTRITION entries', async ({ page }) => {
  // Inverse check: the removed synonym keys must be ABSENT from NUTRITION (only resolvable via alias).
  // Catches accidental re-introduction during future PRs.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    // Asymmetric with the synonymToCanonical map above by design: this list
    // is keys that previously LIVED in NUTRITION and were removed in C-1.
    // 'yoghurt' belongs in the alias-resolve check (it's in _FOOD_ALIASES)
    // but not here — it was never a NUTRITION key, only an alias.
    const removedSynonyms = ['yogurt', 'dahi', 'lauki', 'til', 'date (fruit)', 'lychee', 'kishmish', 'aliv'];
    return removedSynonyms.filter((k) => Object.prototype.hasOwnProperty.call(NUTRITION, k));
  });

  expect(r, 'synonyms must not be re-introduced as NUTRITION keys').toEqual([]);
});

test('regression-guard-c15-no-iron-rich-without-iron: every entry with iron-rich tag must carry iron nutrient', async ({ page }) => {
  // Forward guard. Catches a future PR that adds `iron-rich` to tags[] without
  // adding `iron` to nutrients[] — the half-claim that breaks the per-food
  // chemistry sub-tab (Arc A Phase 5) and misleads the parent.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const failures = await page.evaluate(() => {
    const out: Array<{ food: string; tags: string[]; nutrients: string[] }> = [];
    Object.entries(NUTRITION).forEach(([food, entry]: [string, any]) => {
      const tags = entry.tags || [];
      const nuts = entry.nutrients || [];
      if (tags.includes('iron-rich') && !nuts.includes('iron')) {
        out.push({ food, tags, nutrients: nuts });
      }
    });
    return out;
  });

  expect(failures, 'iron-rich tag requires iron in nutrients[]').toEqual([]);
});

test('regression-guard-c15-no-iron-without-iron-rich-floor: every entry with iron nutrient must carry iron-rich tag OR be on the sub-cohort allowlist', async ({ page }) => {
  // V-M-58a inverse guard. Catches a future PR that strips an `iron-rich` tag
  // in a factuality cleanup but forgets to strip the `iron` nutrient — leaving a
  // half-claim. Sub-cohort entries (amla, coconut, green peas, prune, jamun, and
  // the three spice-tier entries) are exempt via IRON_NUTRIENT_NO_TAG_ALLOWLIST.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const allowlist = Array.from(IRON_NUTRIENT_NO_TAG_ALLOWLIST);
  const failures = await page.evaluate((allowed: string[]) => {
    const allowSet = new Set(allowed);
    const out: Array<{ food: string; tags: string[] }> = [];
    Object.entries(NUTRITION).forEach(([food, entry]: [string, any]) => {
      const tags = entry.tags || [];
      const nuts = entry.nutrients || [];
      if (nuts.includes('iron') && !tags.includes('iron-rich') && !allowSet.has(food)) {
        out.push({ food, tags });
      }
    });
    return out;
  }, allowlist);

  expect(failures, 'iron in nutrients[] requires iron-rich tag OR allowlist membership').toEqual([]);
});

test('regression-guard-c15-no-bone-health-without-calcium-or-K-or-phosphorus: bone-health tag requires a bone-matrix nutrient', async ({ page }) => {
  // Bone matrix is calcium phosphate; vitamin K is required for osteocalcin
  // mineralization. Any of the three is acceptable backing for a bone-health
  // claim. Bajra's bone-health claim, for example, rests on phosphorus +
  // magnesium (whole-grain mineral profile), not direct calcium — phosphorus
  // is in the accepted set to keep that claim intact while still catching the
  // care-tier regression pattern (e.g. butter/chiku/date/fig falsely tagged).
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const failures = await page.evaluate(() => {
    const out: Array<{ food: string; nutrients: string[] }> = [];
    Object.entries(NUTRITION).forEach(([food, entry]: [string, any]) => {
      const tags = entry.tags || [];
      const nuts = entry.nutrients || [];
      if (
        tags.includes('bone-health') &&
        !nuts.includes('calcium') &&
        !nuts.includes('vitamin K') &&
        !nuts.includes('phosphorus')
      ) {
        out.push({ food, nutrients: nuts });
      }
    });
    return out;
  });

  expect(failures, 'bone-health tag requires calcium, vitamin K, or phosphorus in nutrients[]').toEqual([]);
});

test('regression-guard-c15-no-vitamin-X-rich-without-vitamin-X: vitamin-A/C/D-rich tags require the matching vitamin in nutrients', async ({ page }) => {
  // Tag-vs-nutrient shape consistency for single-vitamin tags. The closed set
  // is the three tags currently in use (vitamin-A, vitamin-C, vitamin-D).
  // V-K-60: vitamin-D has no current users; included for forward-coverage on
  // future fortified-food additions (catches a future contributor adding a
  // `vitamin-D` tag to a non-vit-D food). vitamin-B12 / vitamin-K / vitamin-E
  // are intentionally excluded — no `vitamin-X-rich` tag of that shape exists.
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const failures = await page.evaluate(() => {
    const tagToNutrient: Record<string, string> = {
      'vitamin-A': 'vitamin A',
      'vitamin-C': 'vitamin C',
      'vitamin-D': 'vitamin D',
    };
    const out: Array<{ food: string; tag: string; expectedNutrient: string; nutrients: string[] }> = [];
    Object.entries(NUTRITION).forEach(([food, entry]: [string, any]) => {
      const tags = entry.tags || [];
      const nuts = entry.nutrients || [];
      Object.entries(tagToNutrient).forEach(([tag, nutrient]) => {
        if (tags.includes(tag) && !nuts.includes(nutrient)) {
          out.push({ food, tag, expectedNutrient: nutrient, nutrients: nuts });
        }
      });
    });
    return out;
  });

  expect(failures, 'vitamin-X-rich tag requires matching vitamin X in nutrients[]').toEqual([]);
});

test('regression-guard-c15-distinct-key-floor: C-1.5 must not delete NUTRITION keys (floor stays >= 120 post-cleanup)', async ({ request }) => {
  // C-1.5 prunes within-array tokens only. Any future PR that deletes an
  // entire NUTRITION entry would drop the distinct count below floor. C-1
  // landed at 122 distinct keys; the floor is set at 120 to absorb any
  // C-2 alias-dedupe of colocasia/arbi (one removal expected) without
  // re-tuning this test.
  const res = await request.get('/split/data.js');
  expect(res.ok()).toBe(true);
  const src = await res.text();

  const startIdx = src.indexOf('const NUTRITION = {');
  expect(startIdx).toBeGreaterThan(-1);
  let depth = 0, endIdx = -1;
  for (let i = startIdx; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { endIdx = i; break; } }
  }
  const body = src.slice(startIdx, endIdx + 1);
  const keyRE = /^\s*'([^']+)'\s*:\s*\{/gm;
  const keys = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = keyRE.exec(body)) !== null) keys.add(m[1]);

  expect(keys.size, `distinct NUTRITION key count must be >= 120 (got ${keys.size})`).toBeGreaterThanOrEqual(120);
});
