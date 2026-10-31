import { test, expect } from '@playwright/test';

// Privacy v1 P2a: the build ships no records, so a new family's first day is an empty household.
// Every screen must render with nothing logged: only a profile (an invented child, HR-13).
// A boy, so every screen also renders against the boys' WHO tables and pronouns (child-sex-v1).
const PROFILE = { v: 1, child: { name: 'Asha', dob: '2025-12-01', solidsStart: null, sex: 'm' }, place: null, ts: 1 };

test.use({ storageState: { cookies: [], origins: [{ origin: `http://127.0.0.1:${process.env.PORT || 5173}`, localStorage: [{ name: 'ziva_profile', value: JSON.stringify(PROFILE) }] }] } });

test('an empty household renders every tab and sub-tab without a page error', async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  await page.goto('/index.html?nosync');
  await page.waitForFunction(() => typeof (window as any).switchTab === 'function', null, { timeout: 15_000 });
  await page.waitForTimeout(800);
  await expect(page.locator('#prfGate')).toHaveCount(0);
  const visited = await page.evaluate(async () => {
    const w = window as any; const seen: string[] = [];
    const pause = () => new Promise(r => setTimeout(r, 150));
    for (const t of ['landing', 'home', 'growth', 'insights', 'history', 'info']) { w.switchTab(t); seen.push(t); await pause(); }
    w.switchTab('track');
    for (const s of ['diet', 'sleep', 'poop', 'medical', 'milestones']) { w.switchTrackSub(s); seen.push('track:' + s); await pause(); }
    w.switchTrackSub('diet');
    for (const d of ['log', 'library', 'recipes', 'patterns']) { const b = document.querySelector('[data-diet-sub="' + d + '"]'); if (b) { w.switchDietSub(b); seen.push('diet:' + d); await pause(); } }
    return seen;
  });
  expect(visited.length).toBe(15);
  const r = await page.evaluate(() => ({ name: (window as any).childName(), header: document.getElementById('headerSub')!.textContent }));
  expect(r.name).toBe('Asha');
  expect(r.header).toMatch(/^Born 1 Dec 2025/);
  expect(errors).toEqual([]);
});
