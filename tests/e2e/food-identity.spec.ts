import { test, expect } from '@playwright/test';

// Food identity (PR #276; V-C-275-14 and the #276 Governor round). One identity key,
// _foodIdentityKey (core.js): the base name minus a leading count, with a plural fold.
// Never a substring test: that folded a new allergen into an older food ("egg" into
// "eggplant", "peanut" into "pea"), so its introduction was never recorded.

// Top-level `let` globals in the page are not window properties; reach them by name.
declare const foods: any[];
declare const feedingData: Record<string, any>;
declare const comboHistory: any[];

test.describe('Food identity — exact, plural-tolerant, never substring', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() =>
      typeof (window as any)._foodIdentityKey === 'function'
      && typeof (window as any).addFood === 'function', null, { timeout: 10_000 });
  });

  test('identity key folds plurals and counts, keeps look-alikes apart', async ({ page }) => {
    const r = await page.evaluate(() => {
      const w = window as any;
      return {
        eggs: w._foodIdentityKey('Eggs'), oneEgg: w._foodIdentityKey('1 egg'),
        peanuts: w._foodIdentityKey('peanuts'), potatoes: w._foodIdentityKey('potatoes'),
        eggVsEggplant: w._sameFood('egg', 'eggplant'), peaVsPeanut: w._sameFood('pea', 'peanut'),
        bhurji: w._mealItemHasFood('egg bhurji', 'egg'), eggplantCurry: w._mealItemHasFood('eggplant curry', 'egg'),
      };
    });
    expect(r.eggs).toBe('egg');
    expect(r.oneEgg).toBe('egg');
    expect(r.peanuts).toBe('peanut');
    expect(r.potatoes).toBe('potato');
    expect(r.eggVsEggplant).toBe(false);
    expect(r.peaVsPeanut).toBe(false);
    expect(r.bhurji).toBe(true);
    expect(r.eggplantCurry).toBe(false);
  });

  test('addFood records egg separately from eggplant, and merges a plural', async ({ page }) => {
    const r = await page.evaluate(() => {
      const w = window as any;
      foods.length = 0;
      foods.push({ name: 'Eggplant', reaction: 'ok', date: '2026-05-01' });
      (document.getElementById('foodInput') as HTMLInputElement).value = 'egg';
      w.addFood();
      const afterEgg = foods.map((f: any) => f.name);
      (document.getElementById('foodInput') as HTMLInputElement).value = 'Eggs';
      w.addFood();
      return { afterEgg, afterEggs: foods.length };
    });
    expect(r.afterEgg).toEqual(['Eggplant', 'egg']);
    expect(r.afterEggs).toBe(2);
  });

  test('a watch reaction survives a later ok entry of the same food', async ({ page }) => {
    const r = await page.evaluate(() => {
      const w = window as any;
      foods.length = 0;
      foods.push({ name: 'Egg', reaction: 'watch', date: '2026-06-01' });
      (document.getElementById('foodInput') as HTMLInputElement).value = 'boiled egg';
      w.addFood();
      return foods.map((f: any) => f.name + ':' + f.reaction);
    });
    expect(r).toEqual(['Egg:watch']);
  });

  test('auto-introduce dates a food from its first logged meal', async ({ page }) => {
    const r = await page.evaluate(() => {
      const w = window as any;
      for (const d of Object.keys(feedingData)) delete feedingData[d];
      feedingData['2026-07-10'] = { lunch: 'rice, peanut' };
      feedingData['2026-10-28'] = { lunch: 'peanut' };
      foods.length = 0;
      foods.push({ name: 'Pea', reaction: 'ok', date: '2026-02-01' });
      w.autoIntroduceFoodsFromDay('2026-10-28');
      return foods.find((f: any) => f.name === 'peanut');
    });
    expect(r && r.date).toBe('2026-07-10');
  });

  test('combo checker treats egg as new when only eggplant is introduced', async ({ page }) => {
    const text = await page.evaluate(() => {
      const w = window as any;
      foods.length = 0;
      foods.push({ name: 'Eggplant', reaction: 'ok', date: '2026-05-01' });
      comboHistory.length = 0;
      (document.getElementById('comboInput') as HTMLInputElement).value = 'egg + kiwi';
      w.checkFoodCombo();
      return document.getElementById('comboResult')!.textContent || '';
    });
    expect(text).toMatch(/new foods/i);
  });
});
