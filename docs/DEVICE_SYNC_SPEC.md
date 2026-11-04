# SproutLab — Device Sync Spec (Firebase)
**Version:** 1.0 · **Created:** 11 April 2026
**Spec Type:** Feature Spec
**Passes Completed:** 8 (122 bugs found across 16 rounds of Pass 4)
**Status:** Build-Ready

---

## §1 — Problem

SproutLab stores all data in localStorage on a single device. Rishabh's wife is the primary daily user (her phone). Rishabh is the builder (his phone/laptop). Neither can see the other's entries. If she logs a feed and Rishabh checks the app, it's not there. Multi-device access is essential for shared parenting.

---

## §2 — Solution

Add Firebase Firestore as a real-time cloud sync layer. Firestore is the source of truth. localStorage becomes a read cache. Writes go to both localStorage (instant) and Firestore (async). Real-time listeners push remote changes to all connected devices.

**Core design rule:** The app must work 100% without sign-in. Firebase is additive. If auth fails, network is down, or user never signs in — SproutLab works exactly as it does today. The sync layer is a transparent enhancement, not a dependency.

---

## §3 — Architecture Overview

```
┌─────────────────────────────────────────────────┐
│  SproutLab App (sproutlab.html)                 │
│                                                 │
│  save(key, val)                                 │
│    ├── localStorage.setItem()  ← always, sync   │
│    ├── triggerAutosave()       ← if local write  │
│    └── syncWrite(key, val, old)← if sync.js loaded│
│         ├── SYNC_KEYS check                     │
│         ├── _remoteWriteDepth check             │
│         ├── deep diff (old vs new)              │
│         └── Firestore write (setDoc/updateDoc)  │
│              ├── online → immediate             │
│              └── offline → IndexedDB queue      │
│                                                 │
│  load(key)                                      │
│    └── localStorage.getItem()  ← always, unchanged│
│                                                 │
│  onSnapshot listeners (per collection)          │
│    └── remote change → save() with              │
│        _remoteWriteDepth++ → update localStorage│
│        → queue sync toast → show on next render │
│                                                 │
│  Reconcile (once on app open)                   │
│    └── diff _localPending vs Firestore state    │
│        → push local-only data to Firestore      │
└─────────────────────────────────────────────────┘
```

---

## §4 — Decisions Register

Every decision made during the 8-pass process, with rationale.

### 4.1 — Core Architecture

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Sync model | Cloud-primary (Firestore = source of truth, localStorage = cache) | Simplest mental model; one source of truth eliminates ambiguity |
| 2 | Auth method | Google Sign-In (popup → redirect fallback) | Simplest for family use; both users have Google accounts |
| 3 | User scope | 2 devices (Rishabh + wife) | Current need; schema supports more |
| 4 | Firebase SDK loading | Self-host compat SDK v10.x in `/lib` folder | No CDN dependency; reliable offline loading |
| 5 | Firebase SDK integration | Separate files in repo (multi-file architecture) | Cleaner than inlining 150KB of SDK into HTML |
| 6 | Firebase config | config.js in `/split` folder, API key in public repo | Firebase API keys are client-side by design; security comes from Firestore rules |
| 7 | Firestore persistence | Enabled | Solves offline writes + read quota simultaneously |
| 8 | Sync module | New file: sync.js (clean separation) | Keeps Firebase concerns isolated from app logic |
| 9 | save() hook | core.js checks `typeof syncWrite === 'function'` | sync.js is optional; if it fails to load, app works as before |

### 4.2 — Data Model

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 10 | Per-entry collections | One Firestore doc per entry (feeds, sleep, poop, caretickets, notes) | Granular sync, easy conflict resolution, unique IDs exist |
| 11 | Single-doc collections | One doc per KEYS constant (activityLog, milestones, growth, vacc, medical, episodes, foods) | Data is small (<50KB each), well within 1MB doc limit |
| 12 | Doc IDs | Use entry's existing `id` field as Firestore doc ID | Deterministic mapping, easy update/delete |
| 13 | Sync metadata prefix | `__sync_` (double underscore) | Avoids collision with existing `_` prefixed fields like `_qlBackfillDate` |
| 14 | Caretaker attribution | `__sync_createdBy: { uid, name }`, `__sync_updatedBy: { uid, name }` on every entry | Tracks who logged what; Google first name synced, local nicknames override |
| 15 | Server timestamp | `__sync_syncedAt` via `serverTimestamp()` for conflict resolution only, not display | Local timestamps stay for display; server time resolves ordering disputes |

### 4.3 — Sync Behavior

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 16 | Sync mode | Real-time listeners (onSnapshot) | Instant sync between devices; wife logs a feed, Rishabh sees it in seconds |
| 17 | Write strategy (per-entry) | Immediate Firestore write | Each entry is a separate doc, no contention |
| 18 | Write strategy (single-doc) | 2-second debounce | Batches rapid edits to same doc, avoids contention |
| 19 | Merge strategy (single-doc) | Field-level merge with dot-notation via `setDoc(merge: true)` | Two devices can edit different fields simultaneously without conflict |
| 20 | Merge strategy (per-entry edits) | Field-level diff within entry | Maximum granularity; only changed fields sent to Firestore |
| 21 | Delete sync (per-entry) | Diff-based: compare old vs new array by ID Map, `deleteDoc()` for removed IDs | Automatic; save() doesn't need changes |
| 22 | Delete sync (single-doc fields) | `updateDoc()` with `deleteField()` sentinel | `setDoc(merge: true)` can't delete fields |
| 23 | activityLog arrays | Atomic overwrite at date-array level (v1) | Firestore can't merge individual array elements; v2 will add per-entry diff within arrays |
| 24 | activityLog reconcile | Union merge by entry ID per date | Catches offline concurrent edits to same date |

### 4.4 — Sync Scope

**SYNC (Firestore) — 17 localStorage keys across 12 collections:**

| Firestore Collection | localStorage KEYS | Model |
|---------------------|-------------------|-------|
| `feeds` | `feeding` | Per-entry |
| `sleep` | `sleep` | Per-entry |
| `poop` | `poop` | Per-entry |
| `caretickets` | `careTickets` | Per-entry |
| `notes` | `notes` | Per-entry |
| `activities` | `activityLog` | Single-doc |
| `milestones` | `milestones` | Single-doc |
| `growth` | `growth` | Single-doc |
| `growthConfirm` | `growth` | Single-doc (shares the growth doc; merged by date + weight, `gvConfirmMerge` — #161 PR 4a) |
| `vaccinations` | `vacc`, `vaccBooked` | Single-doc (combined) |
| `medical` | `meds`, `visits`, `doctors`, `medChecks` | Single-doc (combined) |
| `episodes` | `feverEpisodes`, `diarrhoeaEpisodes`, `vomitingEpisodes`, `coldEpisodes` | Single-doc (combined) |
| `foods` | `foods` | Single-doc |

**LOCAL-ONLY — no sync:**
`avatar`, `scrapbook`, `events`, `suggestions`, `tomorrowPlanned`, `tomorrowOuting`, `powerOutage`, `alertsActive`, `alertsHistory`, `bugReportPhone`, `bugTooltipSeen`, `qlPredictions`, `notifPermission`, `ctEverUsed`

### 4.5 — Household & Auth

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 25 | Household join methods | Both: invite code + share by email | Flexibility; code is simpler, email is smoother |
| 26 | Invite codes | 8+ chars, single-use (nulled after join), regeneratable in Settings | Secure against guessing; single-use prevents stale codes |
| 27 | Email invites storage | Collection group query on `invites` subcollection | Firestore-native; requires index |
| 28 | Email normalization | Strip dots before @, lowercase, resolve to uid on join | Handles Gmail dot-alias mismatches |
| 29 | Multiple households | Schema supports it; v1 UI is single-household with block guard | Forward-looking schema; v1 shows "Multiple households coming soon" if already in one |
| 30 | Member roles | Stored in schema (`admin`/`member`); not enforced in v1 | Ready for future permission differentiation |
| 31 | Household leave | Supported; optional "Keep a local copy" checkbox before leaving | Protects user's data access |
| 32 | Household delete | Supported; warn if last member: "Leaving will delete all data" | Prevents orphaned Firestore data |
| 33 | Sign-out behavior | Clear all SYNC_KEYS from localStorage + `clearPersistence()` + detach listeners | No stale data; clean re-sign-in |
| 34 | Duplicate household prevention | On sign-in, query existing membership before showing Create | Prevents two households with same data |
| 35 | Caretaker display name | Google first name synced to Firestore; local nicknames stored in `sl_nicknames` (per-device, never synced) | `nicknames[uid] \|\| firestoreName` — personalized display, consistent attribution |

### 4.6 — UI

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 36 | Sync UI location | Settings tab, new section at top | Accessible but not intrusive |
| 37 | Household creation UI | Modal overlay (Act intent) on first sign-in | Focused multi-step flow; matches design system |
| 38 | Remote change notification | New sync-specific toast (different style/position from QLToast) | Distinct from app toasts; queue with max 1 visible |
| 39 | Toast behavior | Queue until overlay closes; show on foreground if backgrounded; batch rapid changes ("5 new updates from Mom") | No toast spam; no form data loss |
| 40 | Tap-to-refresh behavior | Full page reload | Guarantees all modules re-read fresh localStorage |
| 41 | Sync status indicator | "Connected" / "Offline" status badge + last sync timestamp on tap | Always-accurate badge; timestamp for detail |
| 42 | Migration progress | Progress bar in modal: "Uploading feeds... 450/487" | Visual feedback for multi-second operation |
| 43 | Backup & Restore | New section in Settings showing last 7 daily backups; tap date to restore | Manual restore path for Firestore backup layer |

### 4.7 — Safety & Resilience

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 44 | Autosave on remote writes | Skip (use `_remoteWriteDepth` counter) | Remote data shouldn't trigger local backup cycles |
| 45 | Self-echo suppression | Belt & suspenders: uid check + 3s timestamp window | Two independent guards against false "New data" toasts |
| 46 | Firebase SDK failure | Guard: `if (typeof firebase === 'undefined') return` in `initFirebase()` | Graceful degradation to local-only |
| 47 | Auth token expiry | Catch auth errors in syncWrite; show "Sign-in expired — tap to re-authenticate" toast | User-actionable error |
| 48 | Write circuit breaker | 500 writes/hour; auto-reset after 1 hour; log event for debugging | Prevents runaway bugs from burning quota |
| 49 | Device reset | Local only — Firestore untouched; acts as backup | Reset is per-device, cloud data is safe |
| 50 | Duplicate CT notifications | Acceptable for v1 — both devices ring independently | Complexity of notification leader not justified yet |

---

## §5 — Firestore Schema

```
/households/{householdId}
  ├── name: string              // baby name ("Ziva")
  ├── dob: string               // "2025-09-04"
  ├── createdBy: string         // uid of creator
  ├── members: {                // uid-keyed member map
  │     "uid1": { name, email, role: "admin" },
  │     "uid2": { name, email, role: "member" }
  │   }
  ├── inviteCode: string|null   // 8+ chars, nulled after use
  │
  ├── /invites/{normalizedEmail}
  │     ├── status: "pending"
  │     ├── invitedBy: string   // uid
  │     └── invitedAt: timestamp
  │
  ├── /feeds/{entryId}          // per-entry
  │     ├── { ...feedData }
  │     ├── __sync_createdBy: { uid, name }
  │     ├── __sync_updatedBy: { uid, name }
  │     └── __sync_syncedAt: serverTimestamp
  │
  ├── /sleep/{entryId}          // per-entry
  ├── /poop/{entryId}           // per-entry
  ├── /caretickets/{entryId}    // per-entry
  ├── /notes/{entryId}          // per-entry
  │
  ├── /singles/activities       // single-doc: full activityLog object
  ├── /singles/milestones       // single-doc
  ├── /singles/growth           // single-doc
  ├── /singles/vaccinations     // single-doc: vacc + vaccBooked combined
  ├── /singles/medical          // single-doc: meds + visits + doctors + medChecks
  ├── /singles/episodes         // single-doc: all 4 episode types
  ├── /singles/foods            // single-doc
  │
  └── /backups/{date}           // daily backup
        ├── data: string        // compressed JSON of all collections
        └── createdAt: timestamp
```

**Collection group index required:** `invites` collection on `email` field (for join-by-email query).

---

## §6 — sync.js Module API

```javascript
// ─── Constants ───
const SYNC_KEYS = { /* maps KEYS.x → { collection, model: 'per-entry'|'single-doc' } */ };
const _syncShadow = {};        // shadow copies for diff
let _remoteWriteDepth = 0;     // counter (not boolean) for remote write detection
let _localPending = null;      // pre-listener localStorage snapshot for reconcile
let _listenersReady = 0;       // counter for initial snapshot completion
let _isMigrating = false;      // suppresses toasts during seedFirestore
let _isReconciling = false;    // suppresses toasts during reconcile
let _writeCount = 0;           // circuit breaker counter
let _writeCountReset = null;   // hourly reset timer
const CIRCUIT_BREAKER_LIMIT = 500;
const DEBOUNCE_MS = 2000;

// ─── Init ───
function initFirebase()          // configure app from firebaseConfig, set up auth listener
function signIn()                // Google popup, fallback to redirect
function signOut()               // detach listeners → clearPersistence() → clear SYNC_KEYS → clear _syncShadow

// ─── Household ───
function createHousehold(baby)   // create doc, generate inviteCode, call seedFirestore()
function joinByCode(code)        // find household by code, add member, null the code
function joinByEmail(email)      // store normalized email in invites subcollection
function autoJoinCheck(email)    // collection group query on invites; auto-join if found
function leaveHousehold()        // optional local backup, remove uid from members
function deleteHousehold()       // warn if last member, delete all subcollections + doc

// ─── Sync Engine ───
function attachListeners(hId)    // onSnapshot per collection; increment _listenersReady on first callback
function detachListeners()       // unsubscribe all
function syncWrite(key, val, old)// called by save(); routes to correct collection; respects circuit breaker
function handleRemoteChange(key, snapshot) // _remoteWriteDepth++ → save() → queue toast → _remoteWriteDepth--
function deepDiff(oldObj, newObj, path)     // recursive; produces dot-notation field paths
function diffArray(oldArr, newArr)          // by ID Map; returns { added, deleted, edited }

// ─── Reconcile ───
function snapshotLocalPending()  // clone all SYNC_KEYS from localStorage before listeners attach
function reconcile()             // triggered when _listenersReady === SYNC_COLLECTIONS.length
function reconcilePerEntry(key)  // IDs in _localPending not in Firestore → push
function reconcileSingleDoc(key) // deep diff _localPending vs Firestore → push changed fields
function reconcileActivityLog()  // union merge by entry ID per date

// ─── Migration ───
function seedFirestore(hId)      // one-time upload; writeBatch (chunks of 450); _isMigrating = true
function verifyMigration(hId)    // count docs per collection, compare against localStorage

// ─── Backup ───
function dailyBackup(hId)       // check sl_last_daily_backup; if >24h, snapshot + compress + write to backups/{date}; delete >7 days old
function weeklyAutoDownload()   // check sl_last_file_backup; if >7 days, trigger JSON download
function restoreFromBackup(date)// read backups/{date}, decompress, write to all collections, reload

// ─── Utilities ───
function cloneDeep(val)          // structuredClone with JSON.parse fallback
function normalizeEmail(email)   // strip dots before @, lowercase
function generateInviteCode()    // 8+ char alphanumeric
function isSyncLeader()          // check/claim sl_sync_leader in localStorage
function processWriteQueue()     // leader reads sl_sync_queue, processes, clears
```

---

## §7 — Data Flow

### 7.1 — Write Path (local user action)

```
User taps "Log Feed"
  → module calls save(KEYS.feeding, feedingData)
  → save():
      1. const old = load(key, null)                    // snapshot before overwrite
      2. localStorage.setItem(key, JSON.stringify(val)) // instant cache write
      3. if (_remoteWriteDepth === 0) triggerAutosave()  // skip for remote writes
      4. if (typeof syncWrite === 'function') syncWrite(key, val, old)
  → syncWrite():
      1. _syncShadow[key] = cloneDeep(val)              // update shadow (always)
      2. if (_remoteWriteDepth > 0) return               // don't echo back
      3. if (!SYNC_KEYS[key]) return                     // local-only key
      4. if (_writeCount >= CIRCUIT_BREAKER_LIMIT) return // breaker tripped
      5. _writeCount++
      6. if (SYNC_KEYS[key].model === 'per-entry'):
           diffArray(old, val) → addDoc / updateDoc / deleteDoc for each change
         if (SYNC_KEYS[key].model === 'single-doc'):
           debounce 2s → deepDiff(old, val) → setDoc(merge:true) + updateDoc(deleteField)
```

### 7.2 — Read Path (unchanged)

```
Tab renders → calls load(KEYS.feeding)
  → reads localStorage → returns data
  (Firestore is never read directly — listeners keep cache fresh)
```

### 7.3 — Listener Path (remote change arrives)

```
Other device saves a feed → Firestore updates → onSnapshot fires on this device
  → handleRemoteChange():
      1. _remoteWriteDepth++
      2. try { save(key, mergedData) }       // updates localStorage + shadow
         finally { _remoteWriteDepth-- }     // guaranteed decrement
      3. if (!_isMigrating && !_isReconciling):
           if (overlay active) → queue toast
           else → show sync toast: "New data from Mom — tap to refresh"
      4. On toast tap → window.location.reload()
```

### 7.4 — App Open / Init Path

```
App opens → template.html loads Firebase SDK → config.js → core.js → sync.js
  → initFirebase():
      1. firebase.initializeApp(firebaseConfig)
      2. firebase.firestore().enablePersistence()
      3. firebase.auth().onAuthStateChanged(user => {
           if (!user) return                     // local-only mode
           if (no household) → show Create/Join modal
           else:
             snapshotLocalPending()              // step 1: capture localStorage state
             attachListeners(householdId)         // step 2: listeners update localStorage
             // step 3: when _listenersReady === total → reconcile()
         })
```

### 7.5 — Reconcile Path

```
_listenersReady === SYNC_COLLECTIONS.length → reconcile():
  _isReconciling = true
  For each per-entry collection:
    IDs in _localPending but not in current localStorage → push to Firestore
  For each single-doc collection:
    deepDiff(_localPending[key], currentLocalStorage[key]) → push changed fields
  For activityLog specifically:
    Union merge by entry ID per date
  _localPending = null
  _isReconciling = false
```

### 7.6 — Multi-Tab Sync

```
Tab opens → check sl_sync_leader
  If empty or expired (>30s):
    Write own tabId + timestamp → wait 100ms → re-read
    If own tabId still there → LEADER
      → attach Firestore listeners
      → process sl_sync_queue every 2s
    Else → FOLLOWER
  If valid leader exists → FOLLOWER
    → save() still calls syncWrite()
    → syncWrite() pushes to sl_sync_queue instead of Firestore
    → listen for 'storage' events to detect localStorage changes from leader
  Leader heartbeat: refresh sl_sync_leader timestamp every 15s
  On beforeunload: release leadership
```

---

## §8 — Deep Diff Function

### 8.1 — Algorithm

```javascript
function deepDiff(oldObj, newObj, path = '') {
  const updates = {};    // { "dot.path": value } for setDoc(merge: true)
  const deletes = {};    // { "dot.path": deleteField() } for updateDoc

  // Keys in new but not old → ADD
  for (const key of Object.keys(newObj)) {
    const fullPath = path ? `${path}.${key}` : key;
    if (!(key in oldObj)) {
      updates[fullPath] = newObj[key];  // set entire subtree
      continue;
    }
    const oldVal = oldObj[key];
    const newVal = newObj[key];
    if (Array.isArray(newVal)) {
      // Arrays are ATOMIC — overwrite if different
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        updates[fullPath] = newVal;
      }
    } else if (typeof newVal === 'object' && newVal !== null) {
      // Objects → RECURSE
      const sub = deepDiff(oldVal || {}, newVal, fullPath);
      Object.assign(updates, sub.updates);
      Object.assign(deletes, sub.deletes);
    } else {
      // Leaf value → compare
      if (oldVal !== newVal) {
        updates[fullPath] = newVal;
      }
    }
  }

  // Keys in old but not new → DELETE
  for (const key of Object.keys(oldObj)) {
    if (!(key in newObj)) {
      const fullPath = path ? `${path}.${key}` : key;
      deletes[fullPath] = deleteField();
    }
  }

  return { updates, deletes };
}
```

### 8.2 — Per-Entry Array Diff

```javascript
function diffArray(oldArr, newArr) {
  const oldMap = new Map(oldArr.map(e => [e.id, e]));
  const newMap = new Map(newArr.map(e => [e.id, e]));

  const added = [];
  const edited = [];
  const deleted = [];

  // Check for duplicates (data corruption signal)
  if (newMap.size !== newArr.length) {
    console.warn('Duplicate IDs detected in array');
  }

  for (const [id, entry] of newMap) {
    if (!oldMap.has(id)) {
      added.push(entry);
    } else if (JSON.stringify(oldMap.get(id)) !== JSON.stringify(entry)) {
      // Field-level diff within entry
      const { updates } = deepDiff(oldMap.get(id), entry);
      if (Object.keys(updates).length > 0) {
        edited.push({ id, updates });
      }
    }
  }

  for (const [id] of oldMap) {
    if (!newMap.has(id)) {
      deleted.push(id);
    }
  }

  return { added, edited, deleted };
}
```

### 8.3 — Edge Case Rules

| Case | Behavior |
|------|----------|
| Array value → atomic overwrite (no per-element merge) | `Array.isArray()` check |
| Object value → recurse deeper | `typeof === 'object' && !== null` |
| `null` vs missing key → DIFFERENT | Missing = `deleteField()`, null = set null |
| `undefined` → impossible (JSON serialization strips it) | No handling needed |
| Array reorder (same entries, different order) → NO write | Map comparison ignores order |
| Duplicate IDs in array → log warning, use last occurrence | Map overwrites earlier entries |
| New key that is an object → set entire subtree (don't expand) | Simpler, no merge conflict |
| Deeply nested change → dot-notation path (max ~5 levels) | Firestore supports 20 levels |

---

## §9 — Safety Model (5 Layers)

| # | Layer | Storage | Protects Against | Frequency | Restore Path |
|---|-------|---------|-----------------|-----------|-------------|
| 1 | localStorage | Browser | App crashes, network failure | Every `save()` call | Automatic — `load()` reads it |
| 2 | `_syncShadow` | JS memory | localStorage corruption mid-session | Every `syncWrite()` | In-memory only; session-scoped |
| 3 | Firestore + IndexedDB | Google Cloud + local | Device loss, browser data cleared | Real-time (belt) | Automatic — listeners repopulate on sign-in |
| 4 | Firestore daily backup | Google Cloud (separate collection) | Data corruption, bad writes, bugs | Daily (first syncWrite of day) | Manual — Settings → Backup & Restore → pick date |
| 5 | Auto-download JSON | Device filesystem (Downloads) | All above layers fail simultaneously | Weekly | Manual — Settings → Import → select file |

**Backup details:**
- Layer 4: `households/{hId}/backups/{date}` — compressed JSON, last 7 days, auto-delete older
- Layer 5: `sproutlab-backup-YYYY-MM-DD.json` — ~50KB per file, accumulates in Downloads

---

## §10 — Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper: is the user a member of this household?
    function isMember(hId) {
      return request.auth != null &&
        request.auth.uid in get(/databases/$(database)/documents/households/$(hId)).data.members;
    }

    // Household document
    match /households/{hId} {
      allow read: if isMember(hId);
      allow create: if request.auth != null;
      allow update: if isMember(hId);
      allow delete: if isMember(hId);

      // Per-entry collections
      match /feeds/{docId} {
        allow read, write: if isMember(hId);
      }
      match /sleep/{docId} {
        allow read, write: if isMember(hId);
      }
      match /poop/{docId} {
        allow read, write: if isMember(hId);
      }
      match /caretickets/{docId} {
        allow read, write: if isMember(hId);
      }
      match /notes/{docId} {
        allow read, write: if isMember(hId);
      }

      // Single-doc collections
      match /singles/{docId} {
        allow read, write: if isMember(hId);
      }

      // Invites
      match /invites/{email} {
        allow write: if isMember(hId);
        allow read: if request.auth != null &&
          request.auth.token.email == email;
      }

      // Backups
      match /backups/{date} {
        allow read: if isMember(hId);
        allow create: if isMember(hId);
        allow delete: if isMember(hId);
      }
    }
  }
}
```

---

## §11 — Integration with Existing Codebase

### 11.1 — Files Modified

| File | Change |
|------|--------|
| `template.html` | Add 3 `<script src="/lib/...">` tags for Firebase SDK; add sync UI section in Settings tab |
| `core.js` | Modify `save()` to snapshot old value and call `syncWrite()` if available; add `_remoteWriteDepth` counter |
| `build.sh` | Add `config.js` and `sync.js` to build order |

### 11.2 — New Files

| File | Purpose |
|------|---------|
| `config.js` | Firebase config object (`apiKey`, `projectId`, etc.) |
| `sync.js` | Entire sync engine (~800-1200 lines estimated) |
| `/lib/firebase-app-compat.js` | Self-hosted Firebase SDK |
| `/lib/firebase-auth-compat.js` | Self-hosted Firebase SDK |
| `/lib/firebase-firestore-compat.js` | Self-hosted Firebase SDK |

### 11.3 — Build Order

```
config.js → data.js → core.js → sync.js → home.js → diet.js → medical.js → intelligence.js → start.js
```

### 11.4 — Integration Risks (Resolved)

| Risk | Resolution |
|------|-----------|
| Autosave triggered by remote writes | `_remoteWriteDepth` counter; `save()` skips autosave when > 0 |
| Listener echo-back loop | `syncWrite()` returns early when `_remoteWriteDepth > 0` |
| Active sleep session cross-device | Works — both devices find same entry via "last entry with no end" scan; entry IDs are synced |
| ISL computations | Run locally against localStorage cache; deterministic, same results on both devices |
| CareTickets `computeAutoStatus()` | Deterministic — redundant runs on both devices produce same result |
| Save file import while sync active | Set `_isMigrating = true` during import |
| `localStorage.removeItem()` reset | Local only — Firestore untouched |
| Export/import | Export strips `__sync_*` fields; import ignores them |

---

## §12 — Edge Cases

### 12.1 — Empty / First Use
New user signs in, creates household, no data. `seedFirestore()` uploads empty defaults. Listeners attach. App is empty but functional.

### 12.2 — Migration (One-Time)
Rishabh's save file seeds Firestore via `writeBatch()` in chunks of 450. All historical entries get `__sync_createdBy: { uid: Rishabh's uid, name: "Rishabh" }`. Documentation note: "Entries before migration date show Rishabh as creator regardless of who logged them." Migration modal shows progress bar. `_isMigrating` flag suppresses all toasts during upload. Post-migration verification counts docs per collection against localStorage.

### 12.3 — Wife's First Join
Wife enters invite code → joins household → listeners attach → initial snapshot populates her localStorage (overwrites any existing local data). Her phone now has all data. Rishabh's data is canonical.

### 12.4 — Midnight Boundary
Active sleep session crossing midnight: entry has `start` on day 1, `end` null. Both devices see it. Ending it on either device updates the entry with `end` time. Syncs cleanly.

### 12.5 — Backgrounded App
Mobile browser kills JS execution. Listeners die silently. On foreground (`visibilitychange`): if remote changes occurred while backgrounded, show sync toast. Firestore SDK reconnects automatically.

### 12.6 — Sign-In on PWA (Add to Home Screen)
Google popup may not work in standalone WebView. Redirect fallback handles it. **QA verification item:** Test sign-in flow in standalone PWA mode during build.

---

## §13 — What This Does NOT Include

| Excluded | Rationale |
|----------|-----------|
| Firestore transactions for single-doc writes | Field-level merge is more elegant and performant; transactions replaced |
| Custom offline queue | Firestore persistence handles offline writes; localStorage + reconcile is the suspenders layer |
| Notification leader (single device notifies) | Duplicate CT notifications acceptable for v1; complexity not justified |
| Per-entry diff within activityLog date arrays | Atomic date-array overwrite for v1; union merge in reconcile catches offline conflicts; v2 if conflicts arise |
| Multiple household UI (picker, switching) | Schema supports it; UI blocked with message for v1 |
| Role-based permissions enforcement | Roles stored in schema; not enforced in v1 |
| Cloud Functions (scheduled cleanup, push notifications) | Out of scope; free tier constraint |
| Image/file sync (scrapbook photos) | Binary sync is complex; keep scrapbook local-only for now |
| Real-time presence ("Mom is online") | Nice-to-have; not essential for v1 |

---

## §14 — Known Assumptions & Monitoring

| # | Assumption | Monitor Signal | Fix Path |
|---|-----------|---------------|----------|
| 1 | Per-entry collections stay under 5,000 docs each | Count docs on app open | Add date-range pagination to initial load |
| 2 | Total active listeners stay under 12 | Count in sync.js | Consolidate related single-doc collections |
| 3 | activityLog single-doc stays under 100KB | Check `JSON.stringify(activityLog).length` | Split into per-month docs |
| 4 | Same-field concurrent edits by 2 users are rare | User reports of lost data | Add field-level timestamps for merge-by-recency |
| 5 | activityLog same-date concurrent edits are rare | Compare activity counts between devices after 2 weeks | v2: per-entry diff within date arrays |
| 6 | `_syncShadow` memory stays under 5MB total | Check on app open | Switch to `Map<id, hash>` shadow |
| 7 | Firestore free tier (50K reads, 20K writes/day) sufficient | Monitor Firebase Console usage | Optimize listener count; add caching |
| 8 | Weekly auto-download files don't bother users | User feedback | Reduce frequency or make opt-in |

---

## §15 — Future Expansion

| Feature | Context for Future Spec |
|---------|----------------------|
| Multiple household UI | Schema ready; needs household picker overlay, switching logic (detach/reattach listeners), active household state in localStorage |
| Role-based permissions | Schema has roles; rules need `resource.data.members[uid].role == 'admin'` checks; UI needs admin-only actions (delete household, remove member) |
| Notification leader | Elect one device as notification source; suppress on others; use Firestore doc for election |
| activityLog v2 merge | Diff individual activities within date arrays using Firestore transactions (read-modify-write) |
| Real-time presence | `households/{hId}/presence/{uid}` doc with `lastSeen` timestamp; `onDisconnect()` handler |
| Image/scrapbook sync | Firebase Storage for binary files; Firestore doc stores reference URL |
| Push notifications (FCM) | Firebase Cloud Messaging for background notifications when app is closed |

---

## §16 — Implementation Plan

### Phase 1: Foundation (~400 lines)
1. **Firebase setup:** config.js, self-host SDK files in `/lib`, template.html script tags
2. **Auth flow:** `initFirebase()`, `signIn()`, `signOut()`, auth state listener
3. **core.js modification:** `save()` snapshots old value, checks `syncWrite`, `_remoteWriteDepth` counter
4. **Household CRUD:** create, join by code, join by email, leave, delete
5. **Settings UI:** Sync & Account section, sign-in button, household info card, invite code display

### Phase 2: Sync Engine (~500 lines)
1. **`syncWrite()` router:** SYNC_KEYS check, circuit breaker, per-entry vs single-doc routing
2. **Deep diff function:** recursive object diff, dot-notation paths, deleteField handling
3. **Per-entry array diff:** ID Map comparison, add/edit/delete classification, field-level edit diff
4. **Debounce system:** 2s debounce for single-doc writes
5. **Shadow copy management:** `_syncShadow` init, update on every cycle, `cloneDeep` utility
6. **Listener attachment:** `onSnapshot` per collection, `_remoteWriteDepth` wrapping, toast queuing

### Phase 3: Reconcile & Safety (~300 lines)
1. **Pre-listener snapshot:** `snapshotLocalPending()`
2. **`_listenersReady` counter** and reconcile trigger
3. **Reconcile logic:** per-entry push, single-doc diff push, activityLog union merge
4. **Migration:** `seedFirestore()` with batch writes (450/batch), progress bar, verification
5. **Sync toast:** new toast component, queue system, max 1 visible, overlay guard, foreground check
6. **Multi-tab:** leader election, write queue, leader heartbeat, queue processing

### Phase 4: Backup & Polish (~200 lines)
1. **Daily Firestore backup:** compress, write to backups collection, auto-delete >7 days
2. **Weekly auto-download:** JSON export to Downloads
3. **Restore from backup:** UI in Settings, decompress, write to collections, reload
4. **Circuit breaker:** counter, hourly auto-reset, logging
5. **Error handling:** auth expiry toast, missing index fallback, `typeof firebase` guard
6. **Caretaker nicknames:** `sl_nicknames` localStorage, Settings UI for editing

### Estimated Total: ~1,400 lines across sync.js + config.js + template.html changes + core.js changes

---

## §17 — Files Needed for Build Session

| Session | Files to Upload |
|---------|----------------|
| Phase 1 | `core.js`, `template.html`, `start.js`, `build.sh`, `DEVICE_SYNC_SPEC.md` |
| Phase 2 | `sync.js` (from Phase 1), `core.js`, `data.js` (for KEYS reference) |
| Phase 3 | `sync.js` (from Phase 2), `core.js`, `home.js` (for toast integration) |
| Phase 4 | `sync.js` (from Phase 3), `template.html` (for Settings UI) |

---

## §18 — Firebase Setup Checklist

Before first build session:

- [ ] Create Firebase project at console.firebase.google.com
- [ ] Enable Authentication → Google provider
- [ ] Add authorized domain: `rishabh1804.github.io`
- [ ] Create Firestore database (start in test mode, replace with §10 rules)
- [ ] Enable Firestore persistence (client-side, handled in code)
- [ ] Create collection group index: `invites` on `email` field
- [ ] Copy Firebase config to `config.js`
- [ ] Download Firebase compat SDK v10.x files to `/lib`

---

## §19 — Bug Registry Summary

**122 bugs across 16 rounds of Pass 4.**

| Category | Count | Key Examples |
|----------|:-----:|-------------|
| Architecture (critical) | 12 | Delete sync, offline persistence, field-level merge, reconcile timing, listener echo, pre-listener snapshot |
| Correctness | 18 | Self-echo suppression, toast during overlay, sign-out cache, Gmail dot-alias, deep diff edge cases |
| Safety/defensive | 10 | Circuit breaker, CDN failure guard, write quota, leader election race |
| Data integrity | 8 | activityLog union merge, duplicate IDs, shadow initialization, migration batch sizing |
| UX/timing | 6 | Background toast, migration spam, auth redirect in PWA, toast accumulation |
| Build/setup | 5 | SDK caching, collection group index, build order, config.js placement |

**Decisions that changed during Pass 4:**
1. ~~Firestore transactions~~ → Field-level merge with `setDoc(merge: true)`
2. ~~No Firestore persistence~~ → Re-enabled (solves offline + read quota)
3. ~~Reconcile on every snapshot~~ → Once on app open only
4. ~~`_isRemoteWrite` boolean~~ → `_remoteWriteDepth` counter (try/finally)
5. ~~`_` prefix for sync metadata~~ → `__sync_` prefix
6. activityLog reconcile → union merge by entry ID per date

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 11 Apr 2026 | Initial spec. 8 passes, 122 bugs, 50 decisions. Build-ready. |
