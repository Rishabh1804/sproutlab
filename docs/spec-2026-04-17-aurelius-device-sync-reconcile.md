# Device Sync Reconcile Spec

**Author:** Aurelius
**Date:** 17 April 2026
**Status:** R3-locked, implementation-ready
**Supersedes:** `docs/DEVICE_SYNC_SPEC.md` §7.5 (Reconcile Path) — the v1.0 description was accurate-but-incomplete; this spec subsumes and extends it.
**Target files:** `split/sync.js`, `split/core.js`, `split/data.js`
**Session:** 1 of planned 1 — greenfield reconcile + 4-bug remediation
**Companion artifact:** `handoff-2026-04-17-aurelius-to-lyra-device-sync-session-1.md`

---

## §0 — Reader orientation

If you are Lyra opening this cold, read §1, §2, §3, §6 in that order. §4 and §5 are reference material. §7, §8, §9 are the trace and limitations. §11 is your commit plan.

If you are Aurelius or Cipher opening this cold, skim §1 and read §3 for the constitutional anchor.

If you are Maren, §7 and §9 are what you need.

---

## §1 — Problem

SproutLab's sync engine shipped Phases 1–2 (auth, household, write-and-listen loop) in April 2026. The v1.0 spec described a Reconcile Path in §7.5 — a mechanism to resolve offline-made local changes against remote state after listeners re-settle. That function was never built. Phase 2 shipped with `_syncIsReconciling` declared and wired for toast suppression, but never set `true` by any code path. Dead hook, pending implementation.

In parallel, four bugs surfaced during field use and spec review:

1. **P1R2-2** — Undefined fields in SYNC_KEYS values (e.g., `milestones` entries with `manualAt: undefined`) propagate through `JSON.parse(JSON.stringify(val))` inconsistently. Firestore rejects or silently omits them under `set(..., {merge: true})`.

2. **P3R4-2** — If reconcile (once built) calls `save()` during its merge loop, core.js's `triggerAutosave` fires mid-merge. A user-triggered `restoreAutosave` then observes an inconsistent snapshot.

3. **P3R4-4** — Reconcile pushing to Firestore via a direct `setDoc` bypasses any normalization applied at `save()`. The P1R2-2 bug class returns at reconcile time.

4. **P4R5-7** — The single-doc listener handler at `sync.js:730` treats remote-null as "nothing to write, skip." For keys where null carries semantic weight — `vaccBooked = null` means "a parent cancelled the booking" — peer cancellations are invisible to the receiving device.

This spec addresses all four and builds the reconcile path. It is the sole source of truth for Session 1.

---

## §2 — Solution architecture

Three architectural decisions reduce the surface:

**D1 — `_syncSetDocMerge` wrapper for all payload-bearing remote writes.** Every `set(..., {merge: true})` and `update(payload)` call that carries user data routes through a single wrapper. The wrapper applies egress normalization (`_syncNormalizeOut`) once. P1R2-2 and P3R4-4 collapse into one structural fix: the wrapper.

**D2 — Event-loop-is-the-lock for reconcile isolation.** JavaScript's single-threaded execution model already provides isolation between synchronous code and Firestore listener callbacks. Reconcile is declared a synchronous region (HR-14 candidate, §3). No `await`, no Promise awaits, no yielded callbacks inside the locked region. Listener callbacks that arrive during reconcile queue naturally at the task-queue layer and fire after reconcile clears its flag. No rebase loop, no explicit queue.

**D3 — Ingress discrimination via `in` operator + curated MEANINGFUL_NULL_KEYS set.** Egress destroys `undefined`; ingress must preserve the `absent-vs-present-null` distinction. These are different boundary functions, not one normalizer. P4R5-7 fixes the ingress site; MEANINGFUL_NULL_KEYS curates which keys honor the distinction.

These three decisions reduce the Session 1 diff from the handoff's estimated +900–1100 LOC to ~211 LOC net.

---

## §3 — HR-14 (candidate): Reconcile Sync Invariant

**Statement.** Between `_syncReconcileWriting = true` and its clearing, reconcile code executes in a single synchronous stack-frame sequence.

**Forbidden inside the locked region:**
- `await` keyword, regardless of target
- `.then()` chaining that sequences multi-step flows with intervening reads
- `setTimeout` / `setInterval` scheduling that reads state later
- Yielding constructs (`yield`, async iteration)
- Any operation that returns control to the event loop before the corresponding write-kickoff has been dispatched

**Permitted inside the locked region:**
- Synchronous reads (`load`, local variables)
- Synchronous computations (`_syncDeepDiff`, `_syncDiffArray`, object construction)
- Firestore write kickoffs (`_syncSetDocMerge`, `batch.set`, `batch.commit` — these return Promises, which are collected but not awaited inside the locked region)
- `save()` calls to localStorage (synchronous; autosave suppressed by `_syncSuppressesAutosave`)

After the flag clears (in the finally block), collected Promises may be `Promise.all`'d for ack tracking.

**Rationale.** Scenarios S3 and S6 in §9 show how listener interposition during reconcile can clobber meaningful state. The event loop is a free lock if we don't yield inside the region. Yielding re-admits the race.

**Enforcement.** Code review rejects any yield inside the locked region. Automated: a grep pattern scanning for `await|\.then\(|setTimeout|setInterval` between the flag's set and clear sites. Can live as a pre-commit hook.

**Promotion path.** Candidate at Session 1 write; promoted to committed HR by Lyra in the post-Session-1 conventions cleanup. Treat as binding for Session 1 implementation.

---

## §4 — Architectural primitives

### 4.1 `_syncNormalizeOut(v)` — egress normalization

Walks the value, deletes `undefined` properties (does not coerce to null), preserves FieldValue sentinels and Date objects, recurses into nested objects and arrays.

```js
function _syncNormalizeOut(v) {
  if (v === undefined) return undefined;   // caller's walker deletes
  if (v === null) return null;
  if (typeof v !== 'object') return v;
  if (v instanceof Date) return v;
  // FieldValue sentinels — compat SDK attaches _methodName
  if (v._methodName) return v;
  if (Array.isArray(v)) {
    var arr = [];
    for (var i = 0; i < v.length; i++) {
      var child = _syncNormalizeOut(v[i]);
      // Inside arrays, undefined → null (can't delete array slots cleanly)
      arr.push(child === undefined ? null : child);
    }
    return arr;
  }
  var out = {};
  var keys = Object.keys(v);
  for (var k = 0; k < keys.length; k++) {
    var name = keys[k];
    var child = _syncNormalizeOut(v[name]);
    if (child !== undefined) out[name] = child;
  }
  return out;
}
```

**Design note on array slots.** JS arrays cannot cleanly have missing indices mid-array. If an entry at index 3 is `undefined`, deleting it leaves a hole or requires splicing. Converting undefined → null inside arrays is the pragmatic choice. SYNC_KEYS values should not have undefined array slots in practice.

**FieldValue detection fragility.** The compat SDK version on disk uses `_methodName` internally. If the SDK is upgraded to modular or a new major version, the detection must be re-verified empirically (§11).

### 4.2 `_syncSetDocMerge(ref, payload)` — the wrapper

```js
function _syncSetDocMerge(ref, payload) {
  return ref.set(_syncNormalizeOut(payload), { merge: true });
}
```

Three lines. Used at five rewired call sites per §5.

### 4.3 `_syncSuppressesAutosave()` — the predicate

```js
function _syncSuppressesAutosave() {
  return _remoteWriteDepth > 0 || _syncReconcileWriting === true;
}
```

Edit at `core.js:52`:

```js
// OLD:
if (typeof _remoteWriteDepth === 'undefined' || _remoteWriteDepth === 0) triggerAutosave();

// NEW:
if (typeof _syncSuppressesAutosave !== 'function' || !_syncSuppressesAutosave()) {
  triggerAutosave();
}
```

Keeps gate logic in sync.js. Future flags extend the predicate without touching core.js.

### 4.4 `_syncIsEmpty(v)` — ingress-side emptiness

```js
function _syncIsEmpty(v) {
  if (v === null || v === undefined) return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object') return Object.keys(v).length === 0;
  if (typeof v === 'string') return v === '';
  return false;  // numbers, booleans (including false) are not empty
}
```

Semantic note: `false` is not empty. A boolean flag valued `false` carries meaning.

### 4.5 `_syncSafeKey(keyFn, e)` + `_syncStableStringify(v)` — union-merge bad-entry fallback

```js
function _syncStableStringify(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(_syncStableStringify).join(',') + ']';
  var keys = Object.keys(v).sort();
  return '{' + keys.map(function(k) {
    return JSON.stringify(k) + ':' + _syncStableStringify(v[k]);
  }).join(',') + '}';
}

function _syncSafeKey(keyFn, e) {
  try { return keyFn(e); }
  catch (err) {
    console.warn('[sync] safeKey fallback:', err && err.message);
    return '__bad_' + _syncStableStringify(e);
  }
}
```

Sorted-key stringify ensures byte-identity across devices even when entry keys were inserted in different orders. Log-on-fallback preserves the "something is wrong with this entry" signal.

### 4.6 `_syncReconcileFallbackMs()` — adaptive fallback

```js
function _syncReconcileFallbackMs() {
  var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!c || !c.effectiveType) return 15000;
  switch (c.effectiveType) {
    case 'slow-2g': return 30000;
    case '2g':     return 20000;
    case '3g':     return 12000;
    case '4g':     return 6000;
    default:       return 15000;
  }
}
```

First-reading policy: connection type sampled once at reconcile kickoff; not re-sampled during the wait.

---

## §5 — Call site rewiring map

Thirteen Firestore write sites in sync.js, classified by whether they route through `_syncSetDocMerge` or normalize inline:

| Line | Call | Category | Route via wrapper? |
|------|------|----------|-------------------|
| 215 | `households.add({...})` | Household metadata | No |
| 264 | `doc.ref.update(updates)` — join | Household metadata + intentional `inviteCode: null` | No |
| 299 | `ref.update(updates)` — leave | Pure FieldValue.delete | No |
| 320 | `.update({inviteCode: code})` | Household metadata | No |
| 336 | `households.doc(hId).delete()` | Deletion | N/A |
| 345 | `batch.delete(doc.ref)` | Collection cleanup | N/A |
| **521** | `colRef.doc(entry.id).set(data)` — per-entry add | User payload + sync meta | **YES** |
| **529** | `colRef.doc(change.id).update(payload)` — per-entry edit | User payload + FieldValue.delete sentinels + sync meta | **YES (sentinel-aware inline normalize)** |
| 536 | `colRef.doc(id).delete()` — per-entry delete | Deletion | N/A |
| **592** | `docRef.set(updatePayload, {merge: true})` — single-doc | User payload + sync meta | **YES** |
| 596 | `docRef.update(deletePayload)` — single-doc delete | Pure FieldValue.delete sentinels | No |
| **834** | `batch.set(ref, docData)` — seed per-entry | User payload (seed) + sync meta | **YES** |
| **859** | `singles.doc(col).set(payload, {merge: true})` — seed single-doc | User payload (seed) + sync meta | **YES** |

Plus two new sites created by the reconcile implementation (§6): reconcile single-doc push, reconcile per-entry batch push. Both YES.

**Rewiring policy for L529 (sentinel-aware case).** The `.update(payload)` call carries `change.deletes` built as `FieldValue.delete()` sentinels at line 415. `_syncNormalizeOut` preserves these per §4.1. The rewire:

```js
// OLD (L529):
colRef.doc(change.id).update(payload).catch(...);

// NEW:
colRef.doc(change.id).update(_syncNormalizeOut(payload)).catch(...);
```

Not via `_syncSetDocMerge` because `.update()` has different semantics than `.set({merge: true})`. Normalization is what matters for correctness.

**Rewiring policy for household metadata sites (L215, L264, L320).** These payloads are not SYNC_KEYS values; they are small, known-shape objects. Exempted from the wrapper to keep its scope narrow ("wrapper applies to SYNC_KEYS payload writes"). If a future bug requires household-metadata normalization, the wrapper can extend; for Session 1, scope is user data only.

**Two populations of meaningful-null in the codebase.** L263 sets `updates.inviteCode = null` — same pattern as MEANINGFUL_NULL_KEYS but on the household doc schema. Future: if the household doc grows more meaningful-null fields, consider a HOUSEHOLD_MEANINGFUL_NULL_KEYS sibling. Not Session 1 scope. Document at use site.

---

## §6 — Reconcile greenfield design

### 6.1 Outer structure

```js
var _localPending = null;        // captured at sessionStart, cleared at reconcile end
var _syncReconcileWriting = false;
var _listenersReady = 0;         // count of listeners that have fired at least once
var _listenersReadyTags = null;  // map of listener-tag → true
var _syncReconcileFallbackTimer = null;

function _reconcile() {
  if (!_localPending) return;            // nothing to reconcile
  if (_syncReconcileWriting) return;     // already running (defensive)

  _syncReconcileWriting = true;
  var pushPromises = [];

  try {
    var keys = Object.keys(SYNC_KEYS);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var cfg = SYNC_KEYS[key];
      try {
        if (cfg.model === 'single-doc') {
          var p = _reconcileSingleDocKey(key, cfg);
          if (p) pushPromises.push(p);
        } else if (cfg.model === 'per-entry') {
          var ps = _reconcilePerEntryKey(key, cfg);
          if (ps && ps.length) {
            Array.prototype.push.apply(pushPromises, ps);
          }
        }
      } catch (e) {
        _syncRecordCrash('reconcile/' + key, e);
        // Continue to next key; don't abort whole reconcile on single-key failure.
      }
    }
  } finally {
    _syncReconcileWriting = false;
    _localPending = null;
  }

  // HR-14: all work inside try/finally was sync.
  // Promises resolve asynchronously; listener callbacks may fire in this window.
  return Promise.all(pushPromises).catch(function(e) {
    console.error('[sync] reconcile push errors:', e);
  });
}
```

### 6.2 `_reconcileSingleDocKey`

```js
function _reconcileSingleDocKey(key, cfg) {
  var pendingVal = _localPending[key];
  if (pendingVal === undefined) return null;   // key had no offline changes

  var currentLocal = load(key, null);
  var diff = _syncDeepDiff(pendingVal, currentLocal, '');
  var hasUpdates = Object.keys(diff.updates).length > 0;
  var hasDeletes = Object.keys(diff.deletes).length > 0;
  if (!hasUpdates && !hasDeletes) return null;

  var hRef = firebase.firestore()
    .collection('households').doc(_syncHouseholdId);
  var docRef = hRef.collection('singles').doc(cfg.collection);

  var promises = [];
  if (hasUpdates) {
    var updatePayload = Object.assign({}, diff.updates, _syncMeta());
    promises.push(_syncSetDocMerge(docRef, updatePayload));
  }
  if (hasDeletes) {
    var deletePayload = Object.assign({}, diff.deletes, _syncMeta());
    promises.push(docRef.update(_syncNormalizeOut(deletePayload)));
  }

  // Note: reconcile does NOT write to local here.
  // Listener echo post-reconcile brings local in line with remote.
  return Promise.all(promises);
}

function _syncMeta() {
  return {
    __sync_updatedBy: { uid: _syncUser.uid, name: _syncUser.displayName || 'Parent' },
    __sync_syncedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
}
```

**Design note.** Reconcile pushes; local convergence is via listener echo. No dual-write (local + remote) that the handoff §5's Edict III question was about. Edict III reduces to "reconcile push debounced or immediate" — not a correctness question. Session 1 chooses **immediate** (no debounce) because conflict resolution latency matters more than write efficiency.

### 6.3 `_reconcilePerEntryKey`

```js
function _reconcilePerEntryKey(key, cfg) {
  var pendingEntries = _localPending[key];
  if (!Array.isArray(pendingEntries)) return null;

  var currentLocal = load(key, []);
  var currentById = {};
  var idKeyFn = function(e) { return e.id; };
  for (var i = 0; i < currentLocal.length; i++) {
    var k = _syncSafeKey(idKeyFn, currentLocal[i]);
    currentById[k] = currentLocal[i];
  }

  var hRef = firebase.firestore()
    .collection('households').doc(_syncHouseholdId);
  var colRef = hRef.collection(cfg.collection);
  var db = firebase.firestore();

  var promises = [];
  var batch = db.batch();
  var batchSize = 0;
  var BATCH_MAX = 450;

  for (var j = 0; j < pendingEntries.length; j++) {
    var pe = pendingEntries[j];
    if (!pe || !pe.id) continue;
    var peKey = _syncSafeKey(idKeyFn, pe);
    if (currentById[peKey]) continue;   // already delivered by listener or present already

    var docData = Object.assign({}, pe, _syncMeta(), {
      __sync_createdBy: { uid: _syncUser.uid, name: _syncUser.displayName || 'Parent' }
    });
    batch.set(colRef.doc(pe.id), _syncNormalizeOut(docData));
    batchSize++;
    if (batchSize >= BATCH_MAX) {
      promises.push(batch.commit());
      batch = db.batch();
      batchSize = 0;
    }
  }
  if (batchSize > 0) promises.push(batch.commit());
  return promises;
}
```

**Design note.** Union merge is "IDs in pending but not in current → push to remote." Entries added offline that listeners didn't deliver (because they weren't on remote) get pushed. Entries already in both (listener echoed pending back, or remote had them) don't get pushed.

For activityLog specifically, the v1.0 spec mentions "union merge by entry ID per date." Current implementation treats activityLog as a single per-entry collection keyed by ID globally, not per-date. If per-date semantics are needed, that's a v1.1 extension. Session 1 keeps global ID merge.

### 6.4 `_localPending` capture

```js
function _syncCaptureLocalPending() {
  _localPending = {};
  var keys = Object.keys(SYNC_KEYS);
  for (var i = 0; i < keys.length; i++) {
    _localPending[keys[i]] = _syncCloneDeep(load(keys[i], null));
  }
}
```

Called once at session start, before listeners attach. Captures the state of local before any remote-derived writes land.

### 6.5 Kickoff timing

```js
function _syncCollectionCount() {
  var peSet = {}, sdSet = {};
  var keys = Object.keys(SYNC_KEYS);
  for (var i = 0; i < keys.length; i++) {
    var cfg = SYNC_KEYS[keys[i]];
    if (cfg.model === 'per-entry') peSet[cfg.collection] = true;
    else sdSet[cfg.collection] = true;
  }
  return Object.keys(peSet).length + Object.keys(sdSet).length;
}

function _syncMarkListenerReady(tag) {
  if (!_listenersReadyTags) _listenersReadyTags = {};
  if (_listenersReadyTags[tag]) return;
  _listenersReadyTags[tag] = true;
  _listenersReady++;
  _syncMaybeReconcile();
}

function _syncMaybeReconcile() {
  if (_syncReconcileWriting) return;
  if (!_localPending) return;
  if (_listenersReady < _syncCollectionCount()) return;
  if (_syncReconcileFallbackTimer) {
    clearTimeout(_syncReconcileFallbackTimer);
    _syncReconcileFallbackTimer = null;
  }
  _reconcile();
}
```

Each listener's snapshot handler calls `_syncMarkListenerReady(tag)` on first fire. Tag = `'pe/' + collection` for per-entry, `'sd/' + docName` for single-doc.

In `_syncAttachListeners` (after all listeners attached):

```js
_syncReconcileFallbackTimer = setTimeout(function() {
  console.warn('[sync] reconcile fallback fired after ' +
               _syncReconcileFallbackMs() + 'ms — some listeners did not settle');
  _reconcile();
}, _syncReconcileFallbackMs());
```

**Settlement criterion.** All listeners must have fired at least once. Fallback timer ensures reconcile runs even if some listener never fires (partial Firestore outage on a specific collection).

---

## §7 — Ingress discrimination (P4R5-7)

**Replacement for sync.js:749–761** (per-key loop inside `_syncHandleSingleDocSnapshot`):

```js
for (var j = 0; j < lsKeys.length; j++) {
  var key = lsKeys[j];
  var hasField = key in clean;
  var remoteVal = hasField ? clean[key] : null;
  var current = load(key, null);
  if (JSON.stringify(current) === JSON.stringify(remoteVal)) continue;

  var isMeaningfulNull = hasField &&
                          remoteVal === null &&
                          MEANINGFUL_NULL_KEYS.has(key);
  if (_syncIsEmpty(remoteVal) && !isMeaningfulNull) continue;

  anyChanged = true;
  _remoteWriteDepth++;
  try { save(key, remoteVal); }
  finally { _remoteWriteDepth--; }
  _syncShadow[key] = _syncCloneDeep(remoteVal);
}
```

Three changes from current code:
1. Line 751 splits into `hasField` + `remoteVal` so the absent-vs-present distinction survives.
2. Line 754's short-circuit is replaced by `_syncIsEmpty` with the `isMeaningfulNull` exemption.
3. `MEANINGFUL_NULL_KEYS.has(key)` gates which keys honor the distinction.

**Scope.** Single-doc model only. Per-entry's listener at sync.js:668 uses full-array replacement semantics and doesn't have the per-key decision point that the bug targets. MEANINGFUL_NULL_KEYS structurally only contains single-doc SYNC_KEYS.

---

## §8 — MEANINGFUL_NULL_KEYS curation

```js
// In data.js, after KEYS is defined:
const MEANINGFUL_NULL_KEYS = new Set([
  KEYS.vaccBooked
]);
```

**Curation policy.**
- A key joins MEANINGFUL_NULL_KEYS if and only if null carries semantic weight distinct from "not set."
- Current member: `vaccBooked` (null = cancelled, absent = never booked).
- Candidates if promoted to SYNC_KEYS in future: `tomorrowPlanned`, `tomorrowOuting`. Semantic to confirm per-key if promoted.
- Schema rule: when adding a new SYNC_KEY whose null state is semantically meaningful, the author of the addition adds the key to MEANINGFUL_NULL_KEYS in the same commit.

Manual decision per key; cannot be automated without a semantic schema for every SYNC_KEY.

---

## §9 — Seven-scenario compose trace

| # | Scenario | Mechanism | Outcome |
|---|----------|-----------|---------|
| S1 | Write, no reconcile; listener echoes | JSON equality at 753 | Echo suppressed ✅ |
| S2 | Write during reconcile | `_syncSuppressesAutosave()` gate | Autosave skipped; remote write proceeds ✅ |
| S3 | Listener fires during reconcile | HR-14 sync invariant — listener callback queues until reconcile returns | No interposition ✅ |
| S4 | Reconcile's own push echoes | JSON equality at 753 | Echo suppressed ✅ |
| S5 | Per-entry echo during reconcile | JSON equality at 701 + HR-14 | Echo suppressed ✅ |
| S6 | MEANINGFUL_NULL echo during reconcile | HR-14 + P4R5-7 discrimination | Null preserved ✅ |
| S7 | Concurrent remote writes pre-ack | Firestore last-write-wins at server | **Known limitation** — accepted |

**S7 details.** Parent A's reconcile pushes with A's pending vaccBooked. Concurrently, Parent B cancels vaccBooked (sends null to remote). Server accepts both, keeps the latest by server timestamp. Both devices converge to whichever landed later. If A's push lands later, B's cancellation is lost. Inherent to Firestore's optimistic-write model without versioned writes. Out of Session 1 scope.

User-facing mitigation (belongs in SproutLab user docs, not this spec): "If you cancel a vaccination booking while another family member is offline, the cancellation may be overwritten when they reconnect. Confirm with the other member after they come back online."

---

## §10 — Known limitations (accepted, not bugs)

1. **S7: Concurrent-write last-writer-wins.** Solving requires versioned writes or CRDTs; deferred.
2. **Month partitioning: none.** Single docs accumulate unbounded. At ~1 MiB Firestore doc limit, this becomes a hard wall for high-frequency keys (feeding, notes). Deferred, but monitoring recommended.
3. **Per-entry meaningful-null.** MEANINGFUL_NULL_KEYS is single-doc only. If a per-entry collection ever needs tombstone semantics, a separate mechanism (e.g., `_deleted: true` flag on entries) is required. Not in scope.
4. **Reconcile-fallback adaptive scaling first-reading only.** If connection degrades mid-wait, the timer does not rescale. Low-stakes edge.
5. **Observability.** No metrics for reconcile duration, pending count, or fallback firing. Debug-level `console.warn` is the ceiling of Session 1 observability.
6. **KL-1 (C0 v3 residual — Cipher, 17 April 2026): Concurrent multi-device writes during debounce window can lose remote deltas.** If Device A is mid-debounce (2s) on collection C and Device B writes to the same collection in that window, Device A's flush uses `{merge:true}` to push its local state, which overwrites Firestore field values at field granularity — Device B's concurrent additions to the same field are lost. Mitigated by Option Y deploy procedure (wife's phone + incognito closed during canary). Full fix is spec §6 reconcile via `_localPending` + union merge (this session's work, now explicitly unblocked by C0 v3). Accept for C0; revisit when C5 ships.

---

## §11 — Pending empirical verification

One item must be verified at implementation time, not spec time:

**FieldValue sentinel detection.** `_syncNormalizeOut` checks `v._methodName` as the primary signal. This reflects the compat SDK's current internals. Before merging, verify:

1. Write a Firestore doc with `{vaccBooked: firebase.firestore.FieldValue.serverTimestamp()}` through `_syncSetDocMerge`. Read back. Confirm the field is a valid server timestamp, not a mangled object.
2. Write a doc with `{someField: firebase.firestore.FieldValue.delete()}` through `_syncSetDocMerge` (via the delete-payload path). Confirm the field is actually deleted.
3. If either fails, inspect the sentinel object shape in a debugger and update the detection clause.

Approximately 10 minutes with a local Firebase emulator or the dev Firestore project. Do before merging Session 1.

---

## §12 — Implementation sequence

Recommended commit order:

1. **C1 — Primitives.** Add `_syncNormalizeOut`, `_syncSetDocMerge`, `_syncSuppressesAutosave`, `_syncIsEmpty`, `_syncSafeKey`, `_syncStableStringify`, `_syncReconcileFallbackMs`, `_syncMeta`. No call-site changes yet. ~60 LOC in sync.js.

2. **C2 — core.js:52 edit.** Extend the autosave gate to call `_syncSuppressesAutosave`. Test: local save still triggers autosave; manually setting `_syncReconcileWriting = true` suppresses autosave.

3. **C3 — Wrapper rewire.** Rewire L521, L529, L592, L834, L859 through `_syncSetDocMerge` / normalization. Test: existing per-entry and single-doc sync flows unchanged; seed flow unchanged; `FieldValue.delete()` in L529's payload still deletes (per §11).

4. **C4 — Ingress discrimination.** MEANINGFUL_NULL_KEYS set in data.js; replace the 749–761 loop in sync.js per §7. Test: meaningful null on vaccBooked propagates; absent vaccBooked does not overwrite local on first listener fire.

5. **C5 — Reconcile greenfield.** `_localPending` capture, `_reconcile` + two per-model helpers, fallback timer, listener-ready tracking. ~120 LOC in sync.js. Test: offline-write then online-reconnect pushes pending to remote; reconcile doesn't fire twice; fallback timer fires if a listener stalls.

6. **C6 — HR-14 staging.** Add HR-14 entry to spec header. Optionally add a pre-commit grep script.

Do not ship C1–C6 in a single commit. Maren's review will be clearest on C3 and C4 isolated. Maren explicitly tagged P3R4-2 and P4R5-7 as her review jurisdiction per the handoff.

**Total surface:** ~211 LOC net across sync.js, ~2 LOC in core.js, ~3 LOC in data.js.

---

## §13 — Deferred (explicitly not Session 1)

- Month partitioning and month-rollover race guard (P7R2-2).
- Per-entry meaningful-null / tombstone semantics.
- Optimistic locking / versioned writes (would resolve S7).
- Reconcile observability metrics.
- Per-date bucketing for activityLog union merge.
- Migration of local-only SYNC_KEYS candidates (events, tomorrowPlanned, tomorrowOuting).
- `_syncUpdate(ref, payload)` wrapper symmetry — sentinel-aware inline normalization at L529 is sufficient.

---

## §14 — Constitutional cross-references

- **Book I Article 1 Pillar II** — The Map Is Not the Territory. This spec is scaffolding; Lyra's build is the building.
- **Book II Article 5** — Aurelius + Cipher synergy pair: spec then build.
- **Book IV Edict III** — Sync Pipeline is Authoritative. Resolved: `_syncSetDocMerge` is the single normalization boundary; Edict III reduces to a latency question (debounce vs immediate) which this spec answers "immediate."
- **Book IV Edict V** — Capital Protection. Session 1 is capital-affecting because sync touches user data; review chain applies.
- **PERSONA_REGISTRY.md v1.1** — Lyra (Builder, SproutLab), Kael (Intelligence Governor, sync.js owner), Maren (Care Governor, SYNC_KEYS payload owner).

---

## §15 — Changelog from handoff

The companion handoff (`handoff-2026-04-17-aurelius-to-lyra-device-sync-session-1.md`) describes Session 1 as "four bugs + three refinements." R3 restructured this framing:

- **§4 of handoff ("four real bugs")** is factually obsolete. Of the four, only P1R2-2 and P4R5-7 target existing code. P3R4-2 and P3R4-4 target code that hasn't been written yet (reconcile); they are now design constraints on §6 rather than patches.
- **§5 of handoff (Edict III open question)** is resolved by D1 in §2 of this spec. The choice reduces to "debounce vs immediate" — answered "immediate."
- **Appendix B of handoff** (three R2 refinements) is preserved but folded into §4 and §7 of this spec with tightened language. The `in` operator fix is §7; the try/finally pattern is §6.1; the safeKey content fallback is §4.5.

Lyra should treat this spec as authoritative where it differs from the handoff.

---

*Filed: 17 April 2026 by Aurelius.*
*R3-locked under Option B — event-loop-is-the-lock framing.*
