import { test, expect, type Page } from '@playwright/test';
declare const KEYS: any; declare const SYNC_KEYS: any;
declare let _syncUser: any; declare let _syncHouseholdId: any; declare let _syncHousehold: any;
declare let _syncSessionAttachedAt: number; declare let _syncWriteCount: number; declare let _syncShadow: any; declare let _syncReady: any;

// PR #265 — unsynced-write ledger (2026-09-18).
// Incident: a device whose writes stopped reaching the cloud in March kept six
// months of entries only in localStorage; a reinstall re-attached listeners and
// the March cloud copy overwrote them. The ledger records every local write to a
// synced key until the server acks a push, blocks snapshot-apply on dirty keys,
// pushes dirty keys in full (unioned against the cloud) before listeners attach,
// and surfaces a 'stale' state when writes go unacknowledged for 6h.
// Hermetic harness (?nosync): no Firestore backend, so apply/flush paths are
// driven with fakes and stubs, as the #53 straggler spec drives its helpers.
// Globals below are lexical (let/const in a classic script), hence bare access.
// QA chain canon-cc-008: Kael (sync.js + core.js) + quad-Gov (styles.css).

async function gotoApp(page: Page): Promise<void> {
  await page.goto('/index.html?nosync');
  await page.waitForFunction(
    () => typeof (window as any)._syncHandleSingleDocSnapshot === 'function'
       && typeof (window as any).syncUnsyncedInfo === 'function',
    null, { timeout: 15_000 },
  );
}
// The ledger is active only on a device already attached to the household.
async function armLedger(page: Page): Promise<void> {
  await page.evaluate(() => { localStorage.setItem('sl_sync_seeded', '4'); localStorage.removeItem('sl_sync_dirty'); });
}

test('ledger: a device not yet attached to a household records nothing (fresh-install defaults never push)', async ({ page }) => {
  await gotoApp(page);
  const r = await page.evaluate(() => {
    const w = window as any;
    localStorage.removeItem('sl_sync_seeded'); localStorage.removeItem('sl_sync_dirty');
    w.save(KEYS.notes, [{ id: 'n-unattached', text: 'pre-join', date: '2026-09-18' }]);
    w.syncMarkUnsynced([KEYS.growth]);
    return w.syncUnsyncedInfo().count;
  });
  expect(r).toBe(0);
});

test('ledger: save() marks a synced key unsynced; local-only keys and no-op re-saves do not', async ({ page }) => {
  await gotoApp(page);
  await armLedger(page);
  const r = await page.evaluate(() => {
    const w = window as any;
    const val = [{ id: 'n-ledger-1', text: 'ledger test', date: '2026-09-18' }];
    w.save(KEYS.notes, val);
    const afterWrite = w.syncUnsyncedInfo().count;
    w.save('ziva_theme', 'light');                       // local-only key
    const afterLocalOnly = w.syncUnsyncedInfo().count;
    localStorage.removeItem('sl_sync_dirty');
    w.save(KEYS.notes, JSON.parse(JSON.stringify(val))); // identical re-save (boot render paths do this)
    const afterNoop = w.syncUnsyncedInfo().count;
    return { afterWrite, afterLocalOnly, afterNoop };
  });
  expect(r).toEqual({ afterWrite: 1, afterLocalOnly: 1, afterNoop: 0 });
});

test('ledger: a cloud snapshot never overwrites a dirty single-doc key, applies once clean, and replays the skipped snapshot', async ({ page }) => {
  await gotoApp(page);
  await armLedger(page);
  const r = await page.evaluate(async () => {
    const w = window as any;
    const key = KEYS.notes;
    const localVal = [{ id: 'n-local', text: 'newer local', date: '2026-09-18' }];
    const cloudVal = [{ id: 'n-cloud', text: 'stale cloud', date: '2026-03-01' }];
    w.save(key, localVal);
    const fakeDoc = { exists: true, metadata: { hasPendingWrites: false },
      data: () => ({ [key]: cloudVal, __sync_updatedBy: { uid: 'x', name: 'Other' } }) };
    w._syncHandleSingleDocSnapshot('tracking', fakeDoc);
    const whileDirty = JSON.parse(localStorage.getItem(key) || 'null');
    // server ack → clear; the skipped snapshot replays on its own (no second fire)
    w._syncClearDirty([key], Date.now() + 1);
    await new Promise(res => setTimeout(res, 50));
    const afterClear = JSON.parse(localStorage.getItem(key) || 'null');
    return { whileDirty, afterClear, lastOk: localStorage.getItem('sl_sync_lastPushOk') };
  });
  expect(r.whileDirty[0].id).toBe('n-local');
  expect(r.afterClear[0].id).toBe('n-cloud');
  expect(r.lastOk).not.toBeNull();
});

test('ledger: a cloud snapshot never overwrites a dirty per-entry key', async ({ page }) => {
  await gotoApp(page);
  await armLedger(page);
  const r = await page.evaluate(() => {
    const w = window as any;
    const key = KEYS.careTickets;
    const col = SYNC_KEYS[key].collection;
    const remote = [{ id: 'ct-cloud', title: 'stale cloud', status: 'open' }];
    const fakeSnap = {
      metadata: { hasPendingWrites: false },
      forEach: (cb: any) => remote.forEach(d => cb({ id: d.id, data: () => d })),
      docChanges: () => [],
    };
    w.save(key, [{ id: 'ct-local', title: 'newer local', status: 'open' }]);   // dirty
    w._syncHandlePerEntrySnapshot(col, fakeSnap);
    const whileDirty = JSON.parse(localStorage.getItem(key) || '[]').map((e: any) => e.id);
    localStorage.setItem(key, '[]');                    // clean slate, no orphan reconcile
    localStorage.removeItem('sl_sync_dirty');
    w._syncHandlePerEntrySnapshot(col, fakeSnap);
    const whenClean = JSON.parse(localStorage.getItem(key) || '[]').map((e: any) => e.id);
    return { col, whileDirty, whenClean };
  });
  expect(r.col).toBe('caretickets');
  expect(r.whileDirty).toEqual(['ct-local']);
  expect(r.whenClean).toEqual(['ct-cloud']);
});

test('ledger: a later write never launders earlier unpushed dirt (first/last timestamps)', async ({ page }) => {
  await gotoApp(page);
  await armLedger(page);
  const r = await page.evaluate(() => {
    const w = window as any;
    const k = KEYS.notes;
    const attachedAt = Date.now() - 60_000;
    localStorage.setItem('sl_sync_dirty', JSON.stringify({ [k]: { f: attachedAt - 5000, l: attachedAt - 5000 } })); // pre-attach dirt
    w.save(k, [{ id: 'n-later', date: '2026-09-18' }]);                                     // post-attach write on the same key
    w._syncClearDirty([k], Date.now() + 1, attachedAt);                                     // session-scoped clear (partial flush ack)
    const stillDirty = w._syncIsDirty(k);
    const since = w.syncUnsyncedInfo().since;
    w._syncClearDirty([k], Date.now() + 1);                                                 // full push ack
    return { stillDirty, sinceIsFirst: since === attachedAt - 5000, cleared: !w._syncIsDirty(k) };
  });
  expect(r.stillDirty).toBe(true);
  expect(r.sinceIsFirst).toBe(true);
  expect(r.cleared).toBe(true);
});

test('ledger: a failed push flags the key needs-full; only a full push may clear it', async ({ page }) => {
  await gotoApp(page);
  await armLedger(page);
  const r = await page.evaluate(() => {
    const w = window as any;
    const k = KEYS.notes;
    const attachedAt = Date.now() - 60_000;
    w.save(k, [{ id: 'n-a', date: '2026-09-18' }]);       // in-session write
    w._syncMarkNeedsFull(k);                               // its push rejected
    w._syncClearDirty([k], Date.now() + 1, attachedAt);    // a later partial flush acks
    const stillDirty = w._syncIsDirty(k);
    w._syncClearDirty([k], Date.now() + 1);                // full push acks
    return { stillDirty, cleared: !w._syncIsDirty(k) };
  });
  expect(r).toEqual({ stillDirty: true, cleared: true });
});

test('ledger: legacy numeric entries still parse (partial clear respects the pre-attach bound)', async ({ page }) => {
  await gotoApp(page);
  await armLedger(page);
  const r = await page.evaluate(() => {
    const w = window as any;
    const k = KEYS.notes;
    const attachedAt = 1_000_000;
    localStorage.setItem('sl_sync_dirty', JSON.stringify({ [k]: attachedAt - 5000 }));
    w._syncClearDirty([k], attachedAt + 5000, attachedAt);
    const stillDirty = w._syncIsDirty(k);
    w._syncClearDirty([k], attachedAt + 5000);
    return { stillDirty, cleared: !w._syncIsDirty(k) };
  });
  expect(r).toEqual({ stillDirty: true, cleared: true });
});

test('ledger: full push unions arrays by entry identity, clears on ack, keeps the ledger on rejection', async ({ page }) => {
  await gotoApp(page);
  await armLedger(page);
  const r = await page.evaluate(async () => {
    const w = window as any;
    const key = KEYS.notes;                       // single-doc array in 'tracking'
    w.save(key, [{ id: 'n-local', text: 'local' }, { id: 'shared', text: 'local wins' }]);
    const cloud = { [key]: [{ id: 'n-cloud', text: 'cloud only' }, { id: 'shared', text: 'cloud loses' }] };
    let failSet = false;
    const sets: any[] = [];
    const hRef = {
      firestore: { batch: () => ({ set() {}, commit: async () => {} }) },
      collection: (c: string) => ({ doc: (id: string) => ({
        get: async () => ({ exists: true, data: () => cloud }),
        set: async (payload: any, opts: any) => { sets.push({ c, id, payload, opts }); if (failSet) throw new Error('rejected'); },
      }) }),
    };
    _syncUser = { uid: 't', displayName: 'T' };
    const n = await w._syncFlushDirty(hRef);
    const pushed = sets[0].payload[key].map((e: any) => e.id + ':' + e.text);
    const clearedAfterAck = !w._syncIsDirty(key);
    // rejection path
    w.save(key, [{ id: 'n-local-2', text: 'again' }]);
    failSet = true;
    let rejected = false;
    try { await w._syncFlushDirty(hRef); } catch { rejected = true; }
    const keptAfterReject = w._syncIsDirty(key);
    _syncUser = null;
    return { n, pushed, opts: sets[0].opts, clearedAfterAck, rejected, keptAfterReject, target: sets[0].c + '/' + sets[0].id };
  });
  expect(r.n).toBe(1);
  expect(r.target).toBe('singles/tracking');
  expect(r.opts).toEqual({ merge: true });
  expect(r.pushed).toEqual(['n-local:local', 'shared:local wins', 'n-cloud:cloud only']);
  expect(r.clearedAfterAck).toBe(true);
  expect(r.rejected).toBe(true);
  expect(r.keptAfterReject).toBe(true);
});

test('sign-in: household role resolves for the signed-in uid (regression for the user.uid ReferenceError)', async ({ page }) => {
  await gotoApp(page);
  const r = await page.evaluate(() => {
    const w = window as any;
    _syncHousehold = { members: { 'uid-admin': { role: 'admin', name: 'A' }, 'uid-m': { role: 'member', name: 'M' } } };
    const out = { admin: w._syncRoleFor('uid-admin'), member: w._syncRoleFor('uid-m'), unknown: w._syncRoleFor('nope') };
    _syncHousehold = null;
    return { ...out, noHousehold: w._syncRoleFor('uid-admin') };
  });
  expect(r).toEqual({ admin: 'admin', member: 'member', unknown: 'member', noHousehold: 'member' });
});

test('ledger: unacknowledged writes older than 6h surface as stale with a Retry action and calm copy', async ({ page }) => {
  await gotoApp(page);
  await armLedger(page);
  const r = await page.evaluate(() => {
    const w = window as any;
    const k = KEYS.notes;
    const sevenHoursAgo = Date.now() - 7 * 3600 * 1000;
    localStorage.setItem('sl_sync_dirty', JSON.stringify({ [k]: { f: sevenHoursAgo, l: sevenHoursAgo } }));
    _syncUser = { uid: 'test', displayName: 'Test' };
    _syncHouseholdId = 'h-test';
    const snap = w.syncVisibilityState();
    w._syncUpdateStatusIndicator(snap);
    w._syncUpdateOfflineBadge(snap);
    const pill = document.getElementById('syncStatus')!;
    const badge = document.getElementById('offlineBadge')!;
    const btn = badge.querySelector('.offline-badge__action') as HTMLElement;
    const out = {
      state: snap.state, unsynced: snap.unsynced,
      pillHidden: pill.hasAttribute('hidden'), pillAction: pill.getAttribute('data-action'),
      pillLabel: pill.querySelector('.sync-indicator__label')!.textContent,
      badgeHidden: badge.hasAttribute('hidden'), badgeState: badge.getAttribute('data-state'),
      badgeCopy: badge.querySelector('.offline-badge__copy')!.textContent,
      btnHidden: btn.hasAttribute('hidden'), btnAction: btn.getAttribute('data-action'), btnText: btn.textContent,
    };
    localStorage.setItem('sl_sync_dirty', JSON.stringify({ [k]: { f: Date.now(), l: Date.now() } }));   // fresh → not stale
    const fresh = w.syncVisibilityState().state;
    // long tail carries the year
    const longAgo = Date.now() - 400 * 24 * 3600 * 1000;
    const longCopy = w._syncUnsyncedCopy({ unsynced: 1, unsyncedSince: longAgo });
    _syncUser = null; _syncHouseholdId = null; localStorage.removeItem('sl_sync_dirty');
    return { ...out, fresh, longCopy };
  });
  expect(r.state).toBe('stale');
  expect(r.unsynced).toBe(1);
  expect(r.pillHidden).toBe(false);
  expect(r.pillLabel).toBe('Not synced');
  expect(r.pillAction).toBe('syncRetryPush');
  expect(r.badgeHidden).toBe(false);
  expect(r.badgeState).toBe('stale');
  expect(r.badgeCopy).toMatch(/^Entries on this phone haven.t reached the cloud since .+ — they.re safe here\. Tap Retry\.$/);
  expect(r.badgeCopy).not.toMatch(/\d+ change/);
  expect(r.btnHidden).toBe(false);
  expect(r.btnAction).toBe('syncRetryPush');
  expect(r.btnText).toBe('Retry');
  expect(r.fresh).not.toBe('stale');
  expect(r.longCopy).toMatch(/20\d\d/);
});

test('ledger: existing halted/online indicator contract is unchanged; badge button restores Reload for halted', async ({ page }) => {
  await gotoApp(page);
  const r = await page.evaluate(() => {
    const w = window as any;
    w._syncUpdateStatusIndicator({ state: 'halted', pending: 1 });
    w._syncUpdateOfflineBadge({ state: 'halted', pending: 1 });
    const pill = document.getElementById('syncStatus')!;
    const btn = document.getElementById('offlineBadge')!.querySelector('.offline-badge__action') as HTMLElement;
    const halted = { hidden: pill.hasAttribute('hidden'), action: pill.getAttribute('data-action'), btn: btn.textContent, btnAction: btn.getAttribute('data-action') };
    w._syncUpdateStatusIndicator({ state: 'online', pending: 0 });
    const online = { hidden: pill.hasAttribute('hidden'), action: pill.getAttribute('data-action') };
    return { halted, online };
  });
  expect(r.halted).toEqual({ hidden: false, action: 'syncReload', btn: 'Reload', btnAction: 'syncReload' });
  expect(r.online).toEqual({ hidden: true, action: null });
});

// ── Kael delta re-audit (F13–F17) ─────────────────────────────────────────

test('union: per-key identity keeps same-day entries that differ in the fields that matter (F13)', async ({ page }) => {
  await gotoApp(page);
  const r = await page.evaluate(() => {
    const w = window as any;
    const ids = (arr: any[], f: (e: any) => string) => arr.map(f);
    // sleep: a night and two naps on one date, both phones
    const sleepL = [{ date: '2026-09-17', type: 'night', bedtime: '20:00' }, { date: '2026-09-17', type: 'nap', bedtime: '13:00' }];
    const sleepC = [{ date: '2026-09-17', type: 'nap', bedtime: '10:00' }, { date: '2026-09-17', type: 'nap', bedtime: '13:00', __sync_updatedBy: { uid: 'o' } }];
    const sleep = ids(w._syncUnionArrays(sleepL, sleepC, KEYS.sleep), e => e.type + '@' + e.bedtime);
    // vacc: six vaccines share a date
    const vaccL = [{ name: 'DTP-1', date: '2025-10-16' }, { name: 'IPV-1', date: '2025-10-16' }];
    const vaccC = [{ name: 'Hib-1', date: '2025-10-16' }, { name: 'DTP-1', date: '2025-10-16', upcoming: false }];
    const vacc = ids(w._syncUnionArrays(vaccL, vaccC, KEYS.vacc), e => e.name);
    // notes: identity is ts; a toggled `done` must not duplicate, and local wins
    const notesL = [{ ts: 1700, text: 'buy wipes', done: true }];
    const notesC = [{ ts: 1700, text: 'buy wipes', done: false, __sync_updatedBy: { uid: 'o' } }, { ts: 1800, text: 'call doc', done: false }];
    const notes = w._syncUnionArrays(notesL, notesC, KEYS.notes);
    // JSON fallback: key order and __sync_* stamps must not split identity
    const a = { x: 1, y: 'z' }, b = { y: 'z', x: 1, __sync_updatedBy: { uid: 'o' } };
    const fallback = w._syncUnionArrays([a], [b], 'ziva_unknown_key').length;
    // foods: first foods cluster by date — identity is the name
    const foods = ids(w._syncUnionArrays([{ name: 'Egg', date: '2026-09-10' }], [{ name: 'Banana', date: '2026-09-10' }, { name: 'egg', date: '2026-09-10' }], KEYS.foods), e => e.name);
    return { sleep, vacc, notes: notes.map((e: any) => e.ts + ':' + e.done), fallback, foods };
  });
  expect(r.sleep).toEqual(['night@20:00', 'nap@13:00', 'nap@10:00']);
  expect(r.vacc).toEqual(['DTP-1', 'IPV-1', 'Hib-1']);
  expect(r.notes).toEqual(['1700:true', '1800:false']);
  expect(r.fallback).toBe(1);
  expect(r.foods).toEqual(['Egg', 'Banana']);
});

test('full push: merge base is read from the server; a failed read issues no write and keeps the ledger (F14)', async ({ page }) => {
  await gotoApp(page);
  await armLedger(page);
  const r = await page.evaluate(async () => {
    const w = window as any;
    const key = KEYS.notes;
    w.save(key, [{ ts: 1, text: 'local' }]);
    const getOpts: any[] = []; const sets: any[] = [];
    const hRef = {
      firestore: { batch: () => ({ set() {}, commit: async () => {} }) },
      collection: () => ({ doc: () => ({
        get: async (o: any) => { getOpts.push(o); throw new Error('unavailable'); },
        set: async (p: any) => { sets.push(p); },
      }) }),
    };
    _syncUser = { uid: 't', displayName: 'T' };
    let rejected = false;
    try { await w._syncFlushDirty(hRef); } catch { rejected = true; }
    _syncUser = null;
    return { rejected, sets: sets.length, getOpts, stillDirty: w._syncIsDirty(key) };
  });
  expect(r.rejected).toBe(true);
  expect(r.sets).toBe(0);
  expect(r.getOpts).toEqual([{ source: 'server' }]);
  expect(r.stillDirty).toBe(true);
});

test('partial flush: a net-empty diff (add then Undo inside the debounce) releases this session\'s entries (F15)', async ({ page }) => {
  await gotoApp(page);
  await armLedger(page);
  const r = await page.evaluate(() => {
    const w = window as any;
    const col = 'tracking';
    _syncSessionAttachedAt = Date.now() - 60_000;
    _syncReady[col] = true;
    // shadow == current for every key of the collection (the add was undone)
    const keys = Object.keys(SYNC_KEYS).filter(k => SYNC_KEYS[k].collection === col);
    keys.forEach(k => { _syncShadow[k] = JSON.parse(JSON.stringify(w.load(k, null))); });
    const key = KEYS.notes;
    localStorage.setItem('sl_sync_dirty', JSON.stringify({ [key]: { f: Date.now() - 1000, l: Date.now() - 500 } }));   // in-session dirt
    const hRef = { collection: () => ({ doc: () => ({ set: async () => {}, update: async () => {} }) }) };
    w._syncFlushSingleDoc(hRef, col);
    return { dirty: w._syncIsDirty(key) };
  });
  expect(r.dirty).toBe(false);
});

test('full push: a null single (un-booking) is pushed as null, not settled away (F16)', async ({ page }) => {
  await gotoApp(page);
  await armLedger(page);
  const r = await page.evaluate(async () => {
    const w = window as any;
    const key = KEYS.vaccBooked;
    localStorage.setItem(key, 'null');
    w.syncMarkUnsynced([key]);
    const sets: any[] = [];
    const hRef = {
      firestore: { batch: () => ({ set() {}, commit: async () => {} }) },
      collection: () => ({ doc: (id: string) => ({
        get: async () => ({ exists: false, data: () => ({}) }),
        set: async (p: any) => { sets.push({ id, p }); },
      }) }),
    };
    _syncUser = { uid: 't', displayName: 'T' };
    const n = await w._syncFlushDirty(hRef);
    _syncUser = null;
    return { n, doc: sets[0]?.id, pushedNull: sets[0] && key in sets[0].p && sets[0].p[key] === null, cleared: !w._syncIsDirty(key) };
  });
  expect(r.n).toBe(1);
  expect(r.doc).toBe('vaccinations');
  expect(r.pushedNull).toBe(true);
  expect(r.cleared).toBe(true);
});

test('full push: a write landing mid-push triggers one bounded re-pass and the ledger still clears (F17)', async ({ page }) => {
  await gotoApp(page);
  await armLedger(page);
  const r = await page.evaluate(async () => {
    const w = window as any;
    const key = KEYS.notes;
    w.save(key, [{ ts: 1, text: 'first' }]);
    const sets: any[] = [];
    const hRef = {
      firestore: { batch: () => ({ set() {}, commit: async () => {} }) },
      collection: () => ({ doc: () => ({
        get: async () => ({ exists: false, data: () => ({}) }),
        set: async (p: any) => {
          sets.push(p[key].map((e: any) => e.text));
          if (sets.length === 1) w.save(key, [{ ts: 1, text: 'first' }, { ts: 2, text: 'landed mid-push' }]);   // late write
        },
      }) }),
    };
    _syncUser = { uid: 't', displayName: 'T' };
    const n = await w._syncFlushDirty(hRef);
    _syncUser = null;
    return { n, sets, cleared: !w._syncIsDirty(key) };
  });
  expect(r.sets).toEqual([['first'], ['first', 'landed mid-push']]);
  expect(r.n).toBe(2);
  expect(r.cleared).toBe(true);
});


// ── Cipher Edict V amendments (A1, A2) + named test gaps ──────────────────

test('single-doc guard runs before the equality skip: an echo equal to local refreshes the replay cache (A1)', async ({ page }) => {
  await gotoApp(page);
  await armLedger(page);
  const r = await page.evaluate(async () => {
    const w = window as any;
    const key = KEYS.notes;
    const local = [{ ts: 1, text: 'six months of local' }];
    const stale = [{ ts: 0, text: 'march cloud' }];
    w.save(key, local);                                                            // dirty
    const doc = (v: any) => ({ exists: true, metadata: { hasPendingWrites: false }, data: () => ({ [key]: v }) });
    w._syncHandleSingleDocSnapshot('tracking', doc(stale));                         // S0: stale, skipped + cached
    w._syncHandleSingleDocSnapshot('tracking', doc(local));                         // S1: echo of our own push, equal to local
    w._syncClearDirty([key], Date.now() + 1);                                       // ack → replay must use S1, not S0
    await new Promise(res => setTimeout(res, 50));
    return JSON.parse(localStorage.getItem(key) || '[]').map((e: any) => e.text);
  });
  expect(r).toEqual(['six months of local']);
});

test('a write that bails out before pushing is flagged needs-full; a later session-scoped ack cannot clear it (A2)', async ({ page }) => {
  await gotoApp(page);
  await armLedger(page);
  const r = await page.evaluate(() => {
    const w = window as any;
    const key = KEYS.careTickets;                                                   // per-entry: deltas are per call
    _syncUser = null; _syncHouseholdId = null;                                      // bail-out path (not signed in)
    w.save(key, [{ id: 'ct-1', title: 'dropped by bail-out' }]);
    const e = JSON.parse(localStorage.getItem('sl_sync_dirty') || '{}')[key];
    w._syncClearDirty([key], Date.now() + 1, Date.now() - 60_000);                 // a later partial ack on the same key
    return { nf: !!(e && e.nf), stillDirty: w._syncIsDirty(key) };
  });
  expect(r).toEqual({ nf: true, stillDirty: true });
});

test('partial single-doc flush: ack clears this session\'s entry; a rejected set flags needs-full', async ({ page }) => {
  await gotoApp(page);
  await armLedger(page);
  const r = await page.evaluate(async () => {
    const w = window as any;
    const col = 'tracking'; const key = KEYS.notes;
    _syncSessionAttachedAt = Date.now() - 60_000;
    _syncReady[col] = true;
    Object.keys(SYNC_KEYS).filter(k => SYNC_KEYS[k].collection === col).forEach(k => { _syncShadow[k] = JSON.parse(JSON.stringify(w.load(k, null))); });
    _syncUser = { uid: 't', displayName: 'T' };
    let fail = false;
    const hRef = { collection: () => ({ doc: () => ({ set: async () => { if (fail) throw new Error('rejected'); }, update: async () => {} }) }) };
    // an in-session write with a clean ledger entry (save() would bail out here — no household — and flag nf)
    localStorage.setItem(key, JSON.stringify([{ ts: 5, text: 'in-session write' }]));
    localStorage.setItem('sl_sync_dirty', JSON.stringify({ [key]: { f: Date.now() - 1000, l: Date.now() - 500, nf: false } }));
    w._syncFlushSingleDoc(hRef, col);
    await new Promise(res => setTimeout(res, 30));
    const clearedOnAck = !w._syncIsDirty(key);
    localStorage.setItem(key, JSON.stringify([{ ts: 5, text: 'in-session write' }, { ts: 6, text: 'second' }]));
    localStorage.setItem('sl_sync_dirty', JSON.stringify({ [key]: { f: Date.now() - 100, l: Date.now() - 50, nf: false } }));
    fail = true;
    w._syncFlushSingleDoc(hRef, col);
    await new Promise(res => setTimeout(res, 30));
    const entry = JSON.parse(localStorage.getItem('sl_sync_dirty') || '{}')[key];
    _syncUser = null;
    return { clearedOnAck, nfAfterReject: !!(entry && entry.nf) };
  });
  expect(r).toEqual({ clearedOnAck: true, nfAfterReject: true });
});

test('merge-for-push unions arrays nested in a date-keyed map and keeps local scalars', async ({ page }) => {
  await gotoApp(page);
  const r = await page.evaluate(() => {
    const w = window as any;
    const local = { '2026-09-17': [{ id: 'a1' }], '2026-09-18': [{ id: 'b1' }], note: 'local' };
    const cloud = { '2026-09-17': [{ id: 'a0' }, { id: 'a1' }], '2026-09-16': [{ id: 'z' }], note: 'cloud' };
    const m = w._syncMergeForPush(local, cloud, KEYS.activityLog);
    return { d17: m['2026-09-17'].map((e: any) => e.id), d18: m['2026-09-18'].map((e: any) => e.id), note: m.note, has16: '2026-09-16' in m };
  });
  expect(r).toEqual({ d17: ['a1', 'a0'], d18: ['b1'], note: 'local', has16: false });   // cloud-only keys survive server-side via merge:true
});

test('import / restore marking: restored synced keys are flagged needs-full on an attached device', async ({ page }) => {
  await gotoApp(page);
  await armLedger(page);
  const r = await page.evaluate(() => {
    const w = window as any;
    w.syncMarkUnsynced([KEYS.growth, 'ziva_theme', KEYS.meds]);
    const m = JSON.parse(localStorage.getItem('sl_sync_dirty') || '{}');
    return { growth: !!(m[KEYS.growth] && m[KEYS.growth].nf), meds: !!(m[KEYS.meds] && m[KEYS.meds].nf), themeIgnored: !(('ziva_theme') in m) };
  });
  expect(r).toEqual({ growth: true, meds: true, themeIgnored: true });
});
