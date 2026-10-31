import { test, expect } from '@playwright/test';
declare let profile: any;

// child-sex S2 (docs/specs/child-sex-v1.md §3): Smart Q&A reads a boy's he/him/his as the child
// (V-K-281-1) and a girl's text stays as typed; the food-safety title echoes the parent's own
// pronoun and never a stray "her" (V-K-282-1). Kael V-K-282-8. Invented child (HR-13). Hermetic.

test.describe('Smart Q&A for a boy', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as any).qaClassifyInput === 'function' && typeof (window as any)._profSave === 'function', null, { timeout: 15_000 });
  });

  const asBoy = () => { const w = window as any; w._profSave(Object.assign({}, profile.child, { sex: 'm' }), profile.place); };

  test('a boy\'s questions reach the same answers a girl\'s do', async ({ page }) => {
    const r = await page.evaluate((fn) => {
      const w = window as any;
      new Function(fn)();
      const safety = w.qaClassifyInput('Can he eat egg?');
      const look = w.qaClassifyInput('when did he last eat ragi');
      const ans = w.qaHandleFoodSafety({ mode: 'food_safety', raw: 'Can he eat his egg?' });
      return { safety: safety.mode, look: [look.mode, look.foodQuery], title: ans && ans.title };
    }, `(${asBoy.toString()})()`);
    expect(r.safety).toBe('food_safety');
    expect(r.look).toEqual(['lookback', 'ragi']);
    expect(r.title || '').not.toMatch(/\bher\b/i);   // "his egg" folds to "her egg"; the echo drops it
  });

  test('a girl\'s "he" stays as typed (it means someone else)', async ({ page }) => {
    const mode = await page.evaluate(() => (window as any).qaClassifyInput('Can he eat egg?').mode);
    expect(mode).not.toBe('food_safety');
  });

  test('the lookback stripper keeps food names whole', async ({ page }) => {
    const r = await page.evaluate(() => {
      const w = window as any;
      return ['when did she last eat dates', 'when did she last eat thepla', 'last time she had sheera'].map(t => w.qaClassifyInput(t).foodQuery);
    });
    expect(r).toEqual(['dates', 'thepla', 'sheera']);
  });
});
