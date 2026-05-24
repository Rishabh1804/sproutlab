import { test, expect } from '@playwright/test';

// PR-N — "explain, not just log": food-chemistry DB, educational tip rewrites,
// mealSlot on food entries, and a rewarding logging-streak card.

test('every NUTRITION food carries a conservative chem model (no fabricated numeric precision)', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const entries = Object.entries(NUTRITION as Record<string, any>);
    const missing: string[] = [];
    const badFibre: string[] = [];
    const numeric: string[] = [];
    const ALLOWED_FIBRE = new Set([
      'soluble (pectin)', 'soluble (beta-glucan)', 'mixed', 'insoluble',
      'mucilaginous', 'resistant starch', 'minimal', 'none',
    ]);
    entries.forEach(([k, v]) => {
      const c = v.chem;
      if (!c) { missing.push(k); return; }
      // chem must carry at least one descriptor
      if (!c.fibre && !c.antiNutrients && !c.bioactives) missing.push(k);
      if (c.fibre && !ALLOWED_FIBRE.has(c.fibre)) badFibre.push(k + ':' + c.fibre);
      // Conservative model: no invented mg/IU figures anywhere in chem.
      const blob = JSON.stringify(c);
      if (/\d/.test(blob)) numeric.push(k);
    });
    return { total: entries.length, missing, badFibre, numeric };
  });

  // Post-Arc-C C-1 dedupe: synonym keys (yogurt, dahi, lauki, til, lychee, kishmish, aliv, date (fruit))
  // moved out of NUTRITION into _FOOD_ALIASES; floor drops from 130 distinct to 120.
  expect(r.total).toBeGreaterThanOrEqual(120);
  expect(r.missing).toEqual([]);
  expect(r.badFibre).toEqual([]);
  expect(r.numeric).toEqual([]); // high-confidence qualitative facts only
});

test('chem model captures known anti-nutrients and bioactives correctly', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const N = NUTRITION as Record<string, any>;
    return {
      spinachOxalates: (N['spinach'].chem.antiNutrients || []).includes('oxalates'),
      rajmaLectins: (N['rajma'].chem.antiNutrients || []).includes('lectins'),
      oatsBetaGlucan: (N['oats'].chem.bioactives || []).includes('beta-glucan'),
      pruneSorbitol: (N['prune'].chem.bioactives || []).includes('sorbitol'),
      gheeNoFibre: N['ghee'].chem.fibre === 'none',
      turmericCurcumin: (N['turmeric'].chem.bioactives || []).includes('curcumin'),
    };
  });

  expect(r.spinachOxalates).toBe(true);
  expect(r.rajmaLectins).toBe(true);
  expect(r.oatsBetaGlucan).toBe(true);
  expect(r.pruneSorbitol).toBe(true);
  expect(r.gheeNoFibre).toBe(true);
  expect(r.turmericCurcumin).toBe(true);
});

test('supp-streak-broken tip explains D3 and frames a missed dose calmly', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const tips = await page.evaluate(() => ESCALATING_TIPS['supp-streak-broken']);

  expect(tips).toHaveLength(3);
  const all = tips.join(' ').toLowerCase();
  // Explains the role of D3
  expect(all).toContain('calcium');
  expect(all).toContain('bone');
  // Calm, accurate missed-dose framing — tier 1
  expect(tips[0].toLowerCase()).toContain('not harmful');
  expect(tips[0].toLowerCase()).toMatch(/no need to double|don't double|do not double/);
  expect(tips[0].toLowerCase()).toMatch(/store|stores/);
  // Deficiency framed as a weeks-to-months concern, not a one-day risk
  expect(all).toMatch(/weeks to months|weeks-to-months/);
  // Non-alarmist: tier 3 still reassures before nudging
  expect(tips[2].toLowerCase()).toContain('not an emergency');
  expect(tips[2].toLowerCase()).toContain('paediatrician');
});

test('food-correlation tip frames a statistical pattern with mechanism and a paediatrician hedge', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const tips = await page.evaluate(() => ESCALATING_TIPS['food-correlation']);

  expect(tips).toHaveLength(3);
  // Tier 1 — explicitly a detected pattern, not a diagnosis
  expect(tips[0].toLowerCase()).toContain('pattern');
  expect(tips[0].toLowerCase()).toMatch(/not a diagnosis|coincidence/);
  // Tier 2 — plain-language compound mechanism
  expect(tips[1].toLowerCase()).toContain('sorbitol');
  expect(tips[1].toLowerCase()).toContain('fibre');
  // Tier 3 — paediatrician hedge, no DIY broad elimination
  expect(tips[2].toLowerCase()).toContain('paediatrician');
  expect(tips[2].toLowerCase()).toContain('coincidence');
});

test('addFood stores the chosen meal slot on the food entry', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const snap = JSON.stringify(foods);
    (document.getElementById('foodInput') as HTMLInputElement).value = 'papaya';
    (document.getElementById('foodDate') as HTMLInputElement).value = today();
    (document.getElementById('foodSlot') as HTMLSelectElement).value = 'lunch';
    addFood();
    const added = foods.find((f: any) => f.name.toLowerCase() === 'papaya');
    const slotAfter = (document.getElementById('foodSlot') as HTMLSelectElement).value;
    const result = { mealSlot: added ? added.mealSlot : null, slotReset: slotAfter };
    foods.length = 0;
    JSON.parse(snap).forEach((f: any) => foods.push(f));
    return result;
  });

  expect(r.mealSlot).toBe('lunch');
  expect(r.slotReset).toBe(''); // selector resets after add
});

test('food-variety win names the new foods, their day and meal slot', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const snap = JSON.stringify(foods);
    const fresh: any[] = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      fresh.push({ name: ['papaya', 'kiwi', 'oats'][i - 1], reaction: 'ok', date: ds, mealSlot: ['lunch', 'snack', 'breakfast'][i - 1] });
    }
    foods.length = 0;
    fresh.forEach((f) => foods.push(f));
    _baselinesComputedAt = 0; // bust the 60s baseline cache so seeded foods count
    const alerts = computeAlerts();
    const win = alerts.find((a: any) => a.id === 'food-variety-win');
    const body = win ? win.body : '';
    foods.length = 0;
    JSON.parse(snap).forEach((f: any) => foods.push(f));
    return body;
  });

  expect(r).toContain('papaya');
  expect(r).toContain('(');
  // Meal slot is surfaced inside the win body
  expect(r.toLowerCase()).toMatch(/lunch|snack|breakfast/);
});

test('logging-streak card renders a rewarding view of consecutive full days', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  // The win routes here — confirm the routing target exists.
  await expect(page.locator('#infoStreakCard')).toHaveCount(1);

  const r = await page.evaluate(() => {
    const snap = JSON.stringify(feedingData);
    const fd: Record<string, any> = {};
    const todayD = new Date();
    // 5 consecutive full days (breakfast + lunch + dinner all logged).
    for (let i = 0; i < 5; i++) {
      const d = new Date(todayD);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      fd[ds] = { breakfast: 'ragi', lunch: 'dal rice', dinner: 'khichdi' };
    }
    Object.keys(feedingData).forEach((k) => delete feedingData[k]);
    Object.assign(feedingData, fd);
    renderInfoStreak();
    const result = {
      hero: document.getElementById('infoStreakHero')!.textContent || '',
      summary: document.getElementById('infoStreakSummary')!.textContent || '',
      milestones: document.getElementById('infoStreakMilestones')!.innerHTML || '',
      grid: document.getElementById('infoStreakGrid')!.querySelectorAll('.streak-dot.on').length,
    };
    Object.keys(feedingData).forEach((k) => delete feedingData[k]);
    Object.assign(feedingData, JSON.parse(snap));
    return result;
  });

  expect(r.hero).toContain('5');
  expect(r.summary).toContain('5-day');
  // The 3-day milestone badge is lit at a 5-day streak.
  expect(r.milestones).toContain('reached');
  // Five full days show as five lit dots in the 14-day grid.
  expect(r.grid).toBe(5);
});
