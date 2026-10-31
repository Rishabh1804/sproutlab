import { test, expect } from '@playwright/test';
declare let profile: any;

// Child-sex S2–S4 patch class PC-2 (docs/BUGS.md #4, #33, #38): match vocabulary is sex-aware,
// not a copy of both forms. The fixture child is an invented girl (HR-13); a test that needs a
// boy or a different name re-saves the profile. Hermetic.

test.describe('Sex-aware match vocabulary', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as any).qaClassifyInput === 'function'
      && typeof (window as any)._profSave === 'function'
      && typeof (window as any).classifyActivity === 'function', null, { timeout: 15_000 });
  });

  test('a possessive name reads as "her", the bare name as "she" (#4)', async ({ page }) => {
    const r = await page.evaluate(() => {
      const w = window as any;
      const run = () => [
        w._qaNameAsShe("Arjun's nap"),
        w._qaNameAsShe('Arjun’s nap'),
        w._qaNameAsShe('How was ARJUN\'S sleep'),
        w._qaNameAsShe('Arjun napped'),
        w._qaNameAsShe('Arjunah napped'),
      ];
      w._profSave(Object.assign({}, profile.child, { name: 'Arjun' }), profile.place);
      const girl = run();
      w._profSave(Object.assign({}, profile.child, { name: 'Arjun', sex: 'm' }), profile.place);
      const boy = run();
      return { girl, boy };
    });
    const want = ['her nap', 'her nap', 'How was her sleep', 'she napped', 'Arjunah napped'];
    expect(r.girl).toEqual(want);
    expect(r.boy).toEqual(want);
  });

  test('Hinglish "ragi thik he" stays in ingredient mode for a girl (#33)', async ({ page }) => {
    const r = await page.evaluate(() => {
      const c = (window as any).qaClassifyInput('ragi thik he');
      return { mode: c.mode, foods: c.foods };
    });
    expect(r.mode).toBe('ingredient');
    expect(r.foods).toEqual(['ragi']);
  });

  test('a note\'s "when he does" is the child only for a boy (#38)', async ({ page }) => {
    const r = await page.evaluate(() => {
      const w = window as any;
      const hit = (t: string) => w.classifyActivity(t).evidence
        .some((e: any) => e.milestone === 'cause_effect' && e.context === 'intentional_action');
      const girl = { he: hit('when he does it she laughs'), she: hit('when she does it he laughs') };
      w._profSave(Object.assign({}, profile.child, { sex: 'm' }), profile.place);
      const boy = { he: hit('when he does it she laughs'), she: hit('when she does it he laughs') };
      return { girl, boy };
    });
    expect(r.girl).toEqual({ he: false, she: true });
    expect(r.boy).toEqual({ he: true, she: false });
  });
});
