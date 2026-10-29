import { test, expect, type Page } from '@playwright/test';
declare const KEYS: any; declare const SYNC_KEYS: any; declare const SYNC_RENDER_DEPS: any;
declare let mealPlan: any; declare let _syncShadow: any; declare const MP_SLOTS: string[]; declare const ALWAYS_POPULATED_KEYS: Set<string>;

// Meal planner P0 — the stored record and its sync (spec docs/specs/meal-planner-v1.md §3,
// §10.4 V-CA-275-1…10, §10.3 P0 e2e list). Hermetic (?nosync): two phones are simulated by
// handing the planner's single-doc snapshot handler a fake remote copy, as the ledger spec does.
// QA chain canon-cc-008: Carina (core.js + sync.js).

async function gotoApp(page: Page): Promise<void> {
  await page.goto('/index.html?nosync');
  await page.waitForFunction(
    () => typeof (window as any)._mpSetSlot === 'function' && typeof (window as any)._syncHandleSingleDocSnapshot === 'function',
    null, { timeout: 15_000 },
  );
  await page.evaluate(() => { localStorage.removeItem(KEYS.mealPlan); localStorage.setItem('sl_sync_seeded', '4'); localStorage.removeItem('sl_sync_dirty'); });
}
// Fake Firestore snapshot of /singles/plan carrying `plan` from the other phone.
const snapshotScript = `
  window.__mpSnap = function (plan) {
    const doc = { exists: true, metadata: { hasPendingWrites: false },
      data: () => ({ [KEYS.mealPlan]: plan, __sync_updatedBy: { uid: 'other', name: 'Other' } }) };
    localStorage.removeItem('sl_sync_dirty');
    window._syncHandleSingleDocSnapshot('plan', doc);
  };`;
const D = (offset: number) => `(window._mpAddDays(window.today(), ${offset}))`;

test.describe('meal plan record', () => {
  test.beforeEach(async ({ page }) => { await gotoApp(page); await page.addScriptTag({ content: snapshotScript }); });

  test('registration: own doc /singles/plan, renderer and merge hook wired, not always-populated', async ({ page }) => {
    const r = await page.evaluate(() => {
      const w = window as any;
      const shared = Object.keys(SYNC_KEYS).filter(k => SYNC_KEYS[k].collection === 'plan');
      return { cfg: SYNC_KEYS[KEYS.mealPlan], dep: SYNC_RENDER_DEPS[KEYS.mealPlan], shared,
        hook: typeof w._postReceiveMealPlan, alwaysPop: ALWAYS_POPULATED_KEYS.has(KEYS.mealPlan) };
    });
    expect(r.cfg).toEqual({ collection: 'plan', model: 'single-doc' });
    expect(r.shared).toEqual(['ziva_meal_plan']);   // an older app version never listens to or writes this doc
    expect(r.dep.global).toBe('mealPlan');
    expect(r.dep.mergeOnReceive).toBe('_postReceiveMealPlan');
    expect(r.dep.renderers['track:diet']).toEqual(['renderMealPlanSection']);
    expect(r.hook).toBe('function');
    expect(r.alwaysPop).toBe(false);
  });

  test('the in-memory default is never persisted; the first real write saves it and marks it unsynced', async ({ page }) => {
    const r = await page.evaluate((d) => {
      const w = window as any;
      const before = localStorage.getItem(KEYS.mealPlan);
      w._mpSetSlot(eval(d), 'lunch', [{ kind: 'recipe', id: 'toddler-veg-khichdi' }]);
      return { before, after: JSON.parse(localStorage.getItem(KEYS.mealPlan) || 'null'), dirty: w.syncUnsyncedInfo().count, global: mealPlan };
    }, D(1));
    expect(r.before).toBeNull();
    expect(r.after.v).toBe(1);
    expect(r.dirty).toBe(1);
    expect(r.global).toEqual(r.after);
  });

  test('two phones editing different slots of the same day both survive', async ({ page }) => {
    const r = await page.evaluate((d) => {
      const w = window as any; const day = eval(d);
      w._mpSetSlot(day, 'breakfast', [{ kind: 'recipe', id: 'ragi-banana-porridge' }]);
      w.__mpSnap({ v: 1, days: { [day]: { slots: { dinner: { items: [{ kind: 'food', name: 'banana' }], ts: Date.now() + 5 } } } } });
      const p = JSON.parse(localStorage.getItem(KEYS.mealPlan)!);
      return { b: !!w._mpLiveSlot(p.days[day], 'breakfast'), d: !!w._mpLiveSlot(p.days[day], 'dinner') };
    }, D(1));
    expect(r).toEqual({ b: true, d: true });
  });

  test('the same slot resolves to the later edit, whichever phone it came from', async ({ page }) => {
    const r = await page.evaluate((d) => {
      const w = window as any; const day = eval(d);
      w._mpSetSlot(day, 'lunch', [{ kind: 'recipe', id: 'local-older' }]);
      const localTs = JSON.parse(localStorage.getItem(KEYS.mealPlan)!).days[day].slots.lunch.ts;
      w.__mpSnap({ v: 1, days: { [day]: { slots: { lunch: { items: [{ kind: 'recipe', id: 'remote-newer' }], ts: localTs + 10 } } } } });
      return JSON.parse(localStorage.getItem(KEYS.mealPlan)!).days[day].slots.lunch.items[0].id;
    }, D(1));
    expect(r).toBe('remote-newer');
  });

  test('a Clear-day tombstone holds against the other phone; a slot written after the clear survives', async ({ page }) => {
    const r = await page.evaluate((d) => {
      const w = window as any; const day = eval(d);
      const old = Date.now() - 60_000;
      w._mpSetSlot(day, 'snack', [{ kind: 'food', name: 'pear' }]);
      w._mpClearDay(day);
      const cleared = JSON.parse(localStorage.getItem(KEYS.mealPlan)!).days[day].cleared;
      // the other phone still holds an older lunch, and wrote dinner after the clear
      w.__mpSnap({ v: 1, days: { [day]: { slots: {
        lunch: { items: [{ kind: 'recipe', id: 'old-lunch' }], ts: old },
        dinner: { items: [{ kind: 'recipe', id: 'new-dinner' }], ts: cleared + 5 } } } } });
      const p = JSON.parse(localStorage.getItem(KEYS.mealPlan)!);
      return { lunch: !!w._mpLiveSlot(p.days[day], 'lunch'), snack: !!w._mpLiveSlot(p.days[day], 'snack'), dinner: !!w._mpLiveSlot(p.days[day], 'dinner') };
    }, D(2));
    expect(r).toEqual({ lunch: false, snack: false, dinner: true });
  });

  test('undo of Clear day beats its own tombstone and converges on both phones', async ({ page }) => {
    const r = await page.evaluate((d) => {
      const w = window as any; const day = eval(d);
      const items = [{ kind: 'recipe', id: 'toddler-veg-khichdi' }];
      w._mpSetSlot(day, 'lunch', items);
      const otherPhone = JSON.parse(localStorage.getItem(KEYS.mealPlan)!);
      w._mpClearDay(day);
      w._mpSetSlot(day, 'lunch', items);                 // Undo restores the slot
      const mine = JSON.parse(localStorage.getItem(KEYS.mealPlan)!);
      const a = w._mpMerge(mine, otherPhone, w.today()), b = w._mpMerge(otherPhone, mine, w.today());
      return { live: !!w._mpLiveSlot(a.days[day], 'lunch'), same: w._mpStable(a) === w._mpStable(b) };
    }, D(1));
    expect(r).toEqual({ live: true, same: true });
  });

  test('Copy day overwrites the other phone\'s slots on the target, with tombstones for slots the source lacks', async ({ page }) => {
    const r = await page.evaluate((d) => {
      const w = window as any; const src = eval(d), dst = w._mpAddDays(src, 1);
      w._mpSetSlot(src, 'breakfast', [{ kind: 'recipe', id: 'src-breakfast' }]);
      w.__mpSnap({ v: 1, days: { [dst]: { slots: {
        breakfast: { items: [{ kind: 'recipe', id: 'other-breakfast' }], ts: Date.now() },
        dinner: { items: [{ kind: 'recipe', id: 'other-dinner' }], ts: Date.now() } } } } });
      w._mpCopyDay(src, dst);
      const p = JSON.parse(localStorage.getItem(KEYS.mealPlan)!);
      return { b: w._mpLiveSlot(p.days[dst], 'breakfast')?.items[0].id, dinner: w._mpLiveSlot(p.days[dst], 'dinner') };
    }, D(1));
    expect(r).toEqual({ b: 'src-breakfast', dinner: null });
  });

  test('a phone whose clock is a day fast cannot block the other parent\'s later edit', async ({ page }) => {
    const r = await page.evaluate((d) => {
      const w = window as any; const day = eval(d);
      const fast = Date.now() + 86_400_000;
      w.__mpSnap({ v: 1, days: { [day]: { slots: { lunch: { items: [{ kind: 'recipe', id: 'fast-clock' }], ts: fast } } } } });
      w._mpSetSlot(day, 'lunch', [{ kind: 'recipe', id: 'my-later-edit' }]);
      const mine = JSON.parse(localStorage.getItem(KEYS.mealPlan)!);
      const s = mine.days[day].slots.lunch;
      return { id: s.items[0].id, ahead: s.ts > fast };
    }, D(1));
    expect(r).toEqual({ id: 'my-later-edit', ahead: true });
  });

  test('malformed remote data is dropped; an unknown v2 entry kind and field survive a v1 round trip', async ({ page }) => {
    const r = await page.evaluate((d) => {
      const w = window as any; const day = eval(d);
      w.__mpSnap({ v: 2, days: {
        'not-a-date': { slots: {} }, '2026-02-31': { slots: {} },
        [day]: { mood: 'v2-field', slots: {
          lunch: { items: [{ kind: 'v2-kind', ref: 'x' }], ts: Date.now() },
          dinner: { items: [{ kind: 'recipe', id: 'r' }], ts: 'not-a-number' } } } } });
      w._mpSetSlot(day, 'breakfast', [{ kind: 'food', name: 'banana' }]);   // a v1 write on top
      const p = JSON.parse(localStorage.getItem(KEYS.mealPlan)!);
      return { keys: Object.keys(p.days), v: p.v, mood: p.days[day].mood, lunch: p.days[day].slots.lunch?.items[0].kind, dinner: p.days[day].slots.dinner };
    }, D(1));
    expect(r.keys).toEqual([expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)]);
    expect(r.v).toBe(2);
    expect(r.mood).toBe('v2-field');
    expect(r.lunch).toBe('v2-kind');
    expect(r.dinner).toBeUndefined();
  });

  test('a full push after offline edits respects ts, and a pruned day does not come back', async ({ page }) => {
    const r = await page.evaluate((d) => {
      const w = window as any; const day = eval(d);
      const longAgo = w._mpAddDays(w.today(), -60);
      w._mpSetSlot(day, 'lunch', [{ kind: 'recipe', id: 'offline-local' }]);
      const local = JSON.parse(localStorage.getItem(KEYS.mealPlan)!);
      const cloud = { v: 1, days: {
        [day]: { slots: { lunch: { items: [{ kind: 'recipe', id: 'cloud-newer' }], ts: local.days[day].slots.lunch.ts + 1 },
                          snack: { items: [{ kind: 'food', name: 'pear' }], ts: 1 } } },
        [longAgo]: { slots: { lunch: { items: [{ kind: 'recipe', id: 'pruned' }], ts: Date.now() } } } } };
      const pushed = w._syncMergeForPush(local, cloud, KEYS.mealPlan);
      return { lunch: pushed.days[day].slots.lunch.items[0].id, snack: !!pushed.days[day].slots.snack, pruned: !!pushed.days[longAgo] };
    }, D(1));
    expect(r).toEqual({ lunch: 'cloud-newer', snack: true, pruned: false });
  });

  test('receive: when the merge keeps newer local fields, the shadow is the remote copy and the key is queued to push back', async ({ page }) => {
    const r = await page.evaluate((d) => {
      const w = window as any; const day = eval(d);
      w._mpSetSlot(day, 'breakfast', [{ kind: 'recipe', id: 'local-only' }]);
      const remote = { v: 1, days: { [day]: { slots: { dinner: { items: [{ kind: 'food', name: 'kiwi' }], ts: Date.now() } } } } };
      w.__mpSnap(remote);
      return { shadowIsRemote: JSON.stringify(_syncShadow[KEYS.mealPlan]) === JSON.stringify(remote), dirty: w.syncUnsyncedInfo().count };
    }, D(1));
    expect(r).toEqual({ shadowIsRemote: true, dirty: 1 });
  });

  test('writes outside the window are refused; names are capped and only known shapes are stored', async ({ page }) => {
    const r = await page.evaluate(() => {
      const w = window as any;
      const far = w._mpAddDays(w.today(), 120), past = w._mpAddDays(w.today(), -60), ok = w._mpAddDays(w.today(), 1);
      const refused = [w._mpSetSlot(far, 'lunch', [{ kind: 'food', name: 'x' }]), w._mpSetSlot(past, 'lunch', [{ kind: 'food', name: 'x' }]), w._mpSetSlot(ok, 'brunch', [])];
      w._mpSetSlot(ok, 'lunch', [{ kind: 'food', name: 'a'.repeat(90) }, { kind: 'recipe', id: 'r', title: 'not stored' }, { bogus: 1 }, { kind: 'food', name: 'b' }, { kind: 'food', name: 'c' }]);
      const items = JSON.parse(localStorage.getItem(KEYS.mealPlan)!).days[ok].slots.lunch.items;
      return { refused, n: items.length, nameLen: items[0].name.length, recipe: items[1] };
    });
    expect(r.refused).toEqual([null, null, null]);
    expect(r.n).toBe(3);
    expect(r.nameLen).toBe(60);
    expect(r.recipe).toEqual({ kind: 'recipe', id: 'r' });
  });

  test('the merge is order-independent and idempotent (randomised)', async ({ page }) => {
    const r = await page.evaluate(() => {
      const w = window as any; const t = w.today();
      let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      const rndPlan = () => {
        const days: any = {};
        for (let i = 0; i < 4; i++) {
          const key = w._mpAddDays(t, Math.floor(rnd() * 10) - 3); const slots: any = {};
          for (const n of MP_SLOTS) if (rnd() < 0.6) slots[n] = { items: rnd() < 0.2 ? [] : [{ kind: 'recipe', id: 'r' + Math.floor(rnd() * 5) }], ts: Math.floor(rnd() * 8) };
          days[key] = { slots, ...(rnd() < 0.3 ? { cleared: Math.floor(rnd() * 8) } : {}), ...(rnd() < 0.4 ? { travel: { on: rnd() < 0.5, ts: Math.floor(rnd() * 8) } } : {}) };
        }
        return { v: 1, days };
      };
      let bad = 0;
      for (let i = 0; i < 200; i++) {
        const a = rndPlan(), b = rndPlan(), c = rndPlan();
        const s = (p: any) => w._mpStable(p);
        if (s(w._mpMerge(a, b, t)) !== s(w._mpMerge(b, a, t))) bad++;
        if (s(w._mpMerge(w._mpMerge(a, b, t), b, t)) !== s(w._mpMerge(a, b, t))) bad++;
        if (s(w._mpMerge(w._mpMerge(a, b, t), c, t)) !== s(w._mpMerge(a, w._mpMerge(b, c, t), t))) bad++;
      }
      return bad;
    });
    expect(r).toBe(0);
  });
});

test.describe('local dates west of Greenwich (HR-12, V-CA-275-10)', () => {
  test.use({ timezoneId: 'America/New_York' });
  test('_parseLocalDate and the planner day arithmetic stay on the local day, across the DST change', async ({ page }) => {
    await gotoApp(page);
    const r = await page.evaluate(() => {
      const w = window as any;
      return { next: w._mpAddDays('2026-11-02', 1), dst: w._mpAddDays('2026-10-31', 1), back: w._mpAddDays('2026-11-01', -1),
        monday: w._mpWeekStart('2026-11-08'), parsed: w.toDateStr(w._parseLocalDate('2026-11-02')) };
    });
    expect(r).toEqual({ next: '2026-11-03', dst: '2026-11-01', back: '2026-10-31', monday: '2026-11-02', parsed: '2026-11-02' });
  });
});
