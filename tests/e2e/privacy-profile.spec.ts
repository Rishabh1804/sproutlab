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

  test('push: an older local profile never overwrites a newer cloud one (V-CA-280-1)', async ({ page }) => {
    const r = await page.evaluate(() => {
      const w = window as any;
      const local = { v: 1, child: { name: 'Asha', dob: '2024-01-15' }, ts: 10 };
      const cloud = { v: 1, child: { name: 'Asha R', dob: '2024-01-16' }, ts: 20 };
      return w._syncMergeForPush(local, cloud, KEYS.profile).child.name;
    });
    expect(r).toBe('Asha R');
  });
});

// Privacy v1 P2a — the profile gate (§3.3). These start with no stored profile at all.
test.describe('privacy P2a: profile gate', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('a new device with no records sees Welcome; setup saves the child and closes the gate', async ({ page }) => {
    await page.goto('/index.html?nosync');
    const gate = page.locator('#prfGate');
    await expect(gate).toContainText('Welcome to SproutLab');
    await gate.locator('[data-action="prfStart"]').click();
    await gate.locator('[data-action="prfSave"]').click();
    await expect(page.locator('#prfErr')).toContainText('name');
    await page.fill('#prfName', 'Asha');
    await page.fill('#prfDob', '2025-02-10');
    await page.fill('#prfCity', 'Testville');
    await gate.locator('[data-action="prfSave"]').click();
    await expect(gate).toHaveCount(0);
    const r = await page.evaluate(() => ({ name: (window as any).childName(), stored: JSON.parse(localStorage.getItem('ziva_profile')!).child, overflow: document.body.style.overflow }));
    expect(r.name).toBe('Asha');
    expect(r.stored.dob).toBe('2025-02-10');
    expect(r.overflow).toBe('');
  });

  test('a device that already holds records is asked to confirm details, with no Back to Welcome', async ({ page }) => {
    await page.addInitScript(() => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('ziva_feeding', '{}'); sessionStorage.setItem('seeded', '1'); } });
    await page.goto('/index.html?nosync');
    const gate = page.locator('#prfGate');
    await expect(gate).toContainText("Confirm your child's details");
    await expect(gate.locator('[data-action="prfBack"]')).toHaveCount(0);
    await page.fill('#prfName', 'Asha');
    await page.fill('#prfDob', '2030-01-01');
    await gate.locator('[data-action="prfSave"]').click();
    await expect(page.locator('#prfErr')).toContainText('future');
  });

  test('Sign in closes the gate and opens Settings, where sign-in lives', async ({ page }) => {
    await page.goto('/index.html?nosync');
    await page.locator('#prfGate [data-action="prfSignIn"]').click();
    await expect(page.locator('#prfGate')).toHaveCount(0);
    await expect(page.locator('#settingsSidebar')).toHaveClass(/open/);
  });
});
