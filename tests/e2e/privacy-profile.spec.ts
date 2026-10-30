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

  test('a new device with no records sees Welcome; setup reads the age back, saves the child, and starts fresh', async ({ page }) => {
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
    await expect(page.locator('#prfCheck')).toContainText('That makes Asha');   // the read-back (V-M-280-2)
    await expect(gate).toHaveCount(1);
    await Promise.all([page.waitForEvent('load'), gate.locator('[data-action="prfSave"]').click()]);
    await page.waitForFunction(() => typeof (window as any).childName === 'function');
    await expect(page.locator('#prfGate')).toHaveCount(0);
    const r = await page.evaluate(() => ({ name: (window as any).childName(), stored: JSON.parse(localStorage.getItem('ziva_profile')!), overflow: document.body.style.overflow }));
    expect(r.name).toBe('Asha');
    expect(r.stored.child.dob).toBe('2025-02-10');
    expect(r.stored.pre).toBe(true);   // typed before joining a household: provisional (V-CA-280-12)
    expect(r.overflow).toBe('');
  });

  test('a fresh device stays on Welcome after a reload: empty defaults are not records (V-CA-280-11)', async ({ page }) => {
    await page.goto('/index.html?nosync');
    await expect(page.locator('#prfGate')).toContainText('Welcome to SproutLab');
    await page.reload();
    await expect(page.locator('#prfGate')).toContainText('Welcome to SproutLab');
  });

  test('a device that already holds records is asked to confirm, can sign in instead, and a date newer than her records is refused', async ({ page }) => {
    await page.addInitScript(() => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('ziva_feeding', JSON.stringify({ '2026-01-05': { breakfast: 'Ragi' } })); sessionStorage.setItem('seeded', '1'); } });
    await page.goto('/index.html?nosync');
    const gate = page.locator('#prfGate');
    await expect(gate).toContainText("Confirm your child's details");
    await expect(gate.locator('[data-action="prfBack"]')).toHaveCount(0);
    await expect(gate.locator('[data-action="prfSignIn"]')).toHaveCount(1);
    await page.fill('#prfName', 'Asha');
    await page.fill('#prfDob', '2030-01-01');
    await gate.locator('[data-action="prfSave"]').click();
    await expect(page.locator('#prfErr')).toContainText('future');
    await page.fill('#prfDob', '2026-02-01');
    await gate.locator('[data-action="prfSave"]').click();
    await expect(page.locator('#prfErr')).toContainText('before this birth date');
  });

  test('Sign in closes the gate and opens Settings, where sign-in lives', async ({ page }) => {
    await page.goto('/index.html?nosync');
    await page.locator('#prfGate [data-action="prfSignIn"]').click();
    await expect(page.locator('#prfGate')).toHaveCount(0);
    await expect(page.locator('#settingsSidebar')).toHaveClass(/open/);
  });
});

test.describe('privacy P2: profile merge and edit', () => {
  test('a provisional local profile yields to the household\'s (V-CA-280-12)', async ({ page }) => {
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as any)._postReceiveProfile === 'function');
    const r = await page.evaluate(() => {
      const w = window as any;
      const remote = { v: 1, child: { name: 'Asha', dob: '2025-02-10' }, ts: 5 };
      const typed = { v: 1, child: { name: 'Asha', dob: '2025-02-11' }, ts: 99, pre: true };
      return { recv: w._postReceiveProfile(remote, typed).child.dob, push: w._syncMergeForPush(typed, remote, w.KEYS ? w.KEYS.profile : 'ziva_profile').child.dob };
    });
    expect(r).toEqual({ recv: '2025-02-10', push: '2025-02-10' });
  });

  test('Settings opens the child\'s details prefilled', async ({ page }) => {
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as any).prfDispatch === 'function');
    await page.evaluate(() => (window as any).prfDispatch('prfEdit'));
    await expect(page.locator('#prfGate')).toContainText("Your child's details");
    await expect(page.locator('#prfName')).toHaveValue('Asha');
    await page.locator('#prfGate [data-action="prfCancel"]').click();
    await expect(page.locator('#prfGate')).toHaveCount(0);
  });
});
