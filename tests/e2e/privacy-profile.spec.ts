import { test, expect } from '@playwright/test';
declare const KEYS: any; declare let DOB: Date; declare let SOLIDS_START: Date; declare let profile: any; declare const SYNC_KEYS: any; declare const SYNC_RENDER_DEPS: any;

// Privacy v1 P1 — the profile record and the date anchors read from it (docs/specs/privacy-v1.md §3.1).
// Uses an invented child, never a real one (HR-13). Hermetic (?nosync).

test.describe('privacy P1: profile record', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as any)._profSave === 'function', null, { timeout: 15_000 });
  });

  test('the profile is a synced single doc with a newest-wins merge', async ({ page }) => {
    const r = await page.evaluate(() => ({ key: KEYS.profile, sync: SYNC_KEYS[KEYS.profile], dep: SYNC_RENDER_DEPS[KEYS.profile].mergeOnReceive }));
    expect(r).toEqual({ key: 'ziva_profile', sync: { collection: 'profile', model: 'single-doc' }, dep: '_postReceiveProfile' });
  });

  test('saving a profile moves every date anchor and the name', async ({ page }) => {
    const r = await page.evaluate(() => {
      const w = window as any;
      w._profSave({ name: 'Asha', dob: '2024-01-15T08:30', solidsStart: '2024-07-20' }, { city: 'Testville', tz: 'Asia/Kolkata' });
      return { name: w.childName(), dob: [DOB.getFullYear(), DOB.getMonth(), DOB.getDate(), DOB.getHours()], solids: w.toDateStr(SOLIDS_START),
        anchor: w._ZIVA_DOB_STR_FOR_TEST === undefined ? (window as any).eval('_ZIVA_DOB') : null, ageDays: w._zivaAgeInDays('2024-01-25'),
        stored: JSON.parse(localStorage.getItem(KEYS.profile)!).child.name, place: w.childPlace().city };
    });
    expect(r.name).toBe('Asha');
    expect(r.dob).toEqual([2024, 0, 15, 8]);
    expect(r.solids).toBe('2024-07-20');
    expect(r.anchor).toBe('2024-01-15');
    expect(r.ageDays).toBe(10);
    expect(r.stored).toBe('Asha');
    expect(r.place).toBe('Testville');
  });

  test('a malformed profile is refused; an impossible date never becomes an anchor', async ({ page }) => {
    const r = await page.evaluate(() => {
      const w = window as any;
      return { noName: w._profSave({ name: '  ', dob: '2024-01-15' }), badDate: w._profSave({ name: 'Asha', dob: '2024-02-31' }), norm: w._profNormalize({ child: { name: 'Asha', dob: 'soon' } }) };
    });
    expect(r).toEqual({ noName: null, badDate: null, norm: null });
  });

  test('receive: the newer profile wins whole, and a malformed remote never replaces a good local', async ({ page }) => {
    const r = await page.evaluate(() => {
      const w = window as any;
      const a = { v: 1, child: { name: 'Asha', dob: '2024-01-15' }, ts: 10 };
      const b = { v: 1, child: { name: 'Asha R', dob: '2024-01-15' }, ts: 20 };
      return { newer: w._postReceiveProfile(b, a).child.name, older: w._postReceiveProfile(a, b).child.name, junk: w._postReceiveProfile({ child: 7 }, a).child.name };
    });
    expect(r).toEqual({ newer: 'Asha R', older: 'Asha R', junk: 'Asha' });
  });
});
