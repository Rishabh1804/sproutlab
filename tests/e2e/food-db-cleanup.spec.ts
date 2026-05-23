import { test, expect } from '@playwright/test';

// Arc C Phase C-1 — food-DB cleanup regression guards.
// Spec: docs/specs/food-db-cleanup-v1.md §C-1.
// QA chain canon-cc-008: Maren + Kael Mode-1 parallel → Lyra synth → Cipher Edict V.

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
