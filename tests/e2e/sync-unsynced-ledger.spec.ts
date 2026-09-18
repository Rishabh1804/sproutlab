import { test, expect, type Page } from '@playwright/test';
declare const KEYS: any; declare const SYNC_KEYS: any;
declare let _syncUser: any; declare let _syncHouseholdId: any; declare let _syncHousehold: any;
declare let _syncSessionAttachedAt: number; declare let _syncWriteCount: number;

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
    w._syncMarkDirtyKeys([KEYS.growth]);
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
