import { test, expect } from '@playwright/test';

// PR-P — three accuracy fixes: feeding-intake classifier, food-repetition
// staple exemption, sync indicator surfaced only when not syncing.

test('feeding-intake counts the 0.25 / 0.75 intake levels (not just 0.5 / 1)', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const summary = await page.evaluate(() => {
    const snap = JSON.stringify(feedingData);
    const fd: Record<string, any> = {};
    const today = new Date();
    for (let i = 0; i < 10; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      // breakfast tagged "Most" (0.75) — the level the old classifier missed.
      fd[ds] = { breakfast: 'ragi', breakfast_intake: 0.75, lunch: 'dal', lunch_intake: 1 };
    }
    Object.keys(feedingData).forEach((k) => delete feedingData[k]);
    Object.assign(feedingData, fd);
    renderInfoFeedingIntake();
    const txt = document.getElementById('infoFeedingIntakeSummary')!.textContent || '';
    Object.keys(feedingData).forEach((k) => delete feedingData[k]);
    Object.assign(feedingData, JSON.parse(snap));
    return txt;
  });

  // 10 days × 2 tagged meals = 20. The old code missed the ten 0.75 breakfasts.
  expect(summary).toContain('20 tagged meals');
});

test('food-repetition exempts staple foods from over-repetition flagging', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    const snap = JSON.stringify(feedingData);
    const fd: Record<string, any> = {};
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      // ghee = staple (dairy/fats); spinach = non-staple vegetable. Both daily.
      // Foods within a meal are '+'-separated, matching how meals are logged.
      fd[ds] = { breakfast: 'ragi + ghee', lunch: 'spinach + dal', dinner: 'spinach + khichdi' };
    }
    Object.keys(feedingData).forEach((k) => delete feedingData[k]);
    Object.assign(feedingData, fd);
    const res = computeFoodRepetition();
    Object.keys(feedingData).forEach((k) => delete feedingData[k]);
    Object.assign(feedingData, JSON.parse(snap));
    return {
      fatiguedFoods: (res?.fatigued || []).map((f: any) => f.food),
      stapleFoods: (res?.staples || []).map((f: any) => f.food),
    };
  });

  // ghee given every day must NOT be flagged as a concern — it is a staple.
  expect(r.stapleFoods).toContain('ghee');
  expect(r.fatiguedFoods).not.toContain('ghee');
  // a non-staple vegetable given every day still surfaces as over-repeated.
  expect(r.fatiguedFoods).toContain('spinach');
});

test('sync indicator is hidden on routine states, shown only when not syncing', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);

  const r = await page.evaluate(() => {
    const btn = document.getElementById('syncStatus')!;
    _syncUpdateStatusIndicator({ state: 'syncing', pending: 2 });
    const syncing = btn.hasAttribute('hidden');
    _syncUpdateStatusIndicator({ state: 'online', pending: 0 });
    const online = btn.hasAttribute('hidden');
    _syncUpdateStatusIndicator({ state: 'halted', pending: 1 });
    const halted = btn.hasAttribute('hidden');
    return { syncing, online, halted };
  });

  expect(r.syncing, 'syncing state is silent').toBe(true);
  expect(r.online, 'synced state is silent').toBe(true);
  expect(r.halted, 'halted (failure) state surfaces the pill').toBe(false);
});
