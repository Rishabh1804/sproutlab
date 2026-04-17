// ─────────────────────────────────────────
// SYNC — Phase 1 + Phase 2: Auth, Household, Sync Engine
// ─────────────────────────────────────────

// ─── State ───
let _syncUser = null;           // current firebase.auth().currentUser snapshot
let _syncHouseholdId = null;    // active household doc ID
let _syncHousehold = null;      // cached household doc data
let _syncListenerUnsubs = [];   // onSnapshot unsubscribe fns
let _remoteWriteDepth = 0;      // counter for remote write detection (used by save())
let _syncUIRendered = false;    // guard for Settings section injection

// ─── Phase 2 State ───
var _syncShadow = {};           // shadow copies for diff (keyed by KEYS.x)
var _syncDebounceTimers = {};   // debounce timers for single-doc writes
var _syncWriteCount = 0;        // circuit breaker counter
var _syncWriteCountReset = null;// hourly reset timer
var _syncToastQueue = [];       // queued sync toasts
var _syncIsMigrating = false;   // suppresses toasts during seedFirestore
var _syncIsReconciling = false; // suppresses toasts during reconcile
const CIRCUIT_BREAKER_LIMIT = 500;
const DEBOUNCE_MS = 2000;

// ─── Layer 4: Crash Circuit Breaker ───
// If sync errors hit SYNC_CRASH_LIMIT in one session, auto-disable sync entirely.
// App continues in local-only mode. User can re-enable via Settings or reload.
var _syncCrashCount = 0;
var _syncDisabled = false;
const SYNC_CRASH_LIMIT = 3;

// ─── C0 Fix 2/5: Listener-ready tracking (per-collection) ───
// A collection's flush is deferred until its listener has first-fired (so the
// shadow is populated with real remote state, not null). A fallback timer
// marks ready after an adaptive wait to prevent silent stranding if the
// listener never fires (network failure, Firestore permission issue, etc.).
var _syncReady = {};          // collection name → true when listener has first-fired
var _syncReadyTimers = {};    // collection name → fallback timer handle
var _syncPendingFlush = {};   // collection name → true if a flush was deferred

// Adaptive fallback (spec §4.6) — scales with connection quality.
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

function _syncArmReadyFallback(collection) {
  if (_syncReadyTimers[collection]) return;  // already armed
  var ms = _syncReconcileFallbackMs();
  _syncReadyTimers[collection] = setTimeout(function() {
    if (!_syncReady[collection]) {
      console.warn('[sync] Listener-ready fallback for ' + collection +
        ' after ' + ms + 'ms — marking ready; flush may proceed with stale shadow.');
      _syncMarkReady(collection);
    }
  }, ms);
}

function _syncMarkReady(collection) {
  if (_syncReady[collection]) return;
  _syncReady[collection] = true;
  if (_syncReadyTimers[collection]) {
    clearTimeout(_syncReadyTimers[collection]);
    _syncReadyTimers[collection] = null;
  }
  // Fire any pending flush that was deferred waiting for this listener.
  if (_syncPendingFlush[collection]) {
    _syncPendingFlush[collection] = false;
    // Cipher C3: breaker interaction
    if (_syncWriteCount >= CIRCUIT_BREAKER_LIMIT) {
      console.warn('[sync] Skipping ready-pending-flush for ' + collection +
        ' — circuit breaker tripped.');
      return;
    }
    try {
      if (!_syncHouseholdId || !_syncUser) return;
      var freshDb = firebase.firestore();
      var freshRef = freshDb.collection('households').doc(_syncHouseholdId);
      _syncFlushSingleDoc(freshRef, collection);
    } catch(e) { _syncRecordCrash('ready-pending-flush/' + collection, e); }
  }
}

function _syncRecordCrash(source, err) {
  _syncCrashCount++;
  console.error('[sync] Crash #' + _syncCrashCount + ' in ' + source + ':', err);
  if (_syncCrashCount >= SYNC_CRASH_LIMIT) {
    _syncDisabled = true;
    _syncDetachListeners();
    // Clear any pending debounce timers
    Object.keys(_syncDebounceTimers).forEach(function(k) {
      if (_syncDebounceTimers[k]) clearTimeout(_syncDebounceTimers[k]);
      _syncDebounceTimers[k] = null;
    });
    console.error('[sync] Auto-disabled after ' + _syncCrashCount + ' crashes. App is local-only.');
    showQLToast('Sync paused — too many errors. Reload to retry.');
  }
}

// ─── Sync Key Map ───
const SYNC_KEYS = {
  [KEYS.feeding]:            { collection: 'tracking',    model: 'single-doc' },
  [KEYS.sleep]:              { collection: 'tracking',    model: 'single-doc' },
  [KEYS.poop]:               { collection: 'tracking',    model: 'single-doc' },
  [KEYS.careTickets]:        { collection: 'caretickets',  model: 'per-entry' },
  [KEYS.notes]:              { collection: 'tracking',    model: 'single-doc' },
  [KEYS.activityLog]:        { collection: 'activities',  model: 'single-doc' },
  [KEYS.milestones]:         { collection: 'milestones',  model: 'single-doc' },
  [KEYS.growth]:             { collection: 'growth',      model: 'single-doc' },
  [KEYS.vacc]:               { collection: 'vaccinations', model: 'single-doc' },
  [KEYS.vaccBooked]:         { collection: 'vaccinations', model: 'single-doc' },
  [KEYS.meds]:               { collection: 'medical',     model: 'single-doc' },
  [KEYS.visits]:             { collection: 'medical',     model: 'single-doc' },
  [KEYS.doctors]:            { collection: 'medical',     model: 'single-doc' },
  [KEYS.medChecks]:          { collection: 'medical',     model: 'single-doc' },
  [KEYS.feverEpisodes]:      { collection: 'episodes',    model: 'single-doc' },
  [KEYS.diarrhoeaEpisodes]:  { collection: 'episodes',    model: 'single-doc' },
  [KEYS.vomitingEpisodes]:   { collection: 'episodes',    model: 'single-doc' },
  [KEYS.coldEpisodes]:       { collection: 'episodes',    model: 'single-doc' },
  [KEYS.foods]:              { collection: 'foods',       model: 'single-doc' },
};

// ─── ALWAYS_POPULATED_KEYS (C0 Fix 1 — Maren's allowlist) ───
// Keys where an empty state is never a valid user intent — only a bug signal.
// For these keys, a listener snapshot delivering [] or {} with local non-empty
// is skipped with a warning. For any key NOT in this set, legitimate user
// deletions (clear-all) propagate normally via listener overwrite.
//
// Per-key justification:
//   doctors — seeded with default pediatrician; "clear all doctors" is not a
//             user intent, it's a bug (would drop the default too)
//   foods   — persist-defaults populates; clearing foods breaks diet logging
//             and is never a deliberate user action
//   vacc    — the vaccination schedule; parent edits entries, never deletes
//             the whole schedule
//   meds    — Ziva's active medications (Vit D3 at minimum); clear-all is a
//             medical-safety concern, never a user intent
//
// vaccBooked is MEANINGFUL_NULL territory (spec §8), not ALWAYS_POPULATED.
// Episode keys, notes, activityLog, feeding/sleep/poop/visits: user may
// legitimately clear these — do NOT add to this set without Maren review.
const ALWAYS_POPULATED_KEYS = new Set([
  KEYS.doctors,
  KEYS.foods,
  KEYS.vacc,
  KEYS.meds
]);

// Map collection → array of localStorage KEYS that share it (for single-doc combined collections)
var _syncCollectionToKeys = {};
(function() {
  var keys = Object.keys(SYNC_KEYS);
  for (var i = 0; i < keys.length; i++) {
    var col = SYNC_KEYS[keys[i]].collection;
    if (!_syncCollectionToKeys[col]) _syncCollectionToKeys[col] = [];
    _syncCollectionToKeys[col].push(keys[i]);
  }
})();

// ─── Firebase Init ───
function initFirebase() {
  if (typeof firebase === 'undefined') return; // SDK not loaded — local-only mode (§4.7 #46)
  try {
    firebase.initializeApp(firebaseConfig);
  } catch (e) {
    // Already initialized (multi-tab)
    if (!/already exists/.test(e.message)) { console.warn('[sync] initFirebase error:', e); return; }
  }

  const db = firebase.firestore();
  db.enablePersistence({ synchronizeTabs: true }).catch(function(err) {
    if (err.code === 'failed-precondition') {
      console.warn('[sync] Persistence failed — multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('[sync] Persistence not supported in this browser');
    }
  });

  firebase.auth().onAuthStateChanged(function(user) {
    _syncUser = user;
    _syncRenderSettingsUI();
    if (!user) {
      _syncHouseholdId = null;
      _syncHousehold = null;
      return;
    }
    // Check for existing household membership
    _syncFindHousehold(user.uid);
  });
}

// ─── Auth ───
function syncSignIn() {
  if (typeof firebase === 'undefined') return;
  var provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider).catch(function(err) {
    if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
      // Fallback to redirect for PWA / mobile (§12.6)
      firebase.auth().signInWithRedirect(provider);
    } else {
      console.error('[sync] Sign-in error:', err);
      showQLToast('Sign-in failed — try again');
    }
  });
}

function syncSignOut() {
  if (typeof firebase === 'undefined' || !_syncUser) return;
  // Detach listeners (Phase 2)
  _syncDetachListeners();
  var db = firebase.firestore();
  db.clearPersistence().catch(function() {}).then(function() {
    return firebase.auth().signOut();
  }).then(function() {
    // Clear sync state but KEEP user data in localStorage (safe sign-out)
    // Data stays local; next sign-in will re-seed if needed
    localStorage.removeItem('sl_sync_seeded');
    _syncShadow = {};
    _syncUser = null;
    _syncHouseholdId = null;
    _syncHousehold = null;
    _syncRenderSettingsUI();
    showQLToast('Signed out — data kept locally');
  });
}

// ─── Household Lookup ───
function _syncFindHousehold(uid) {
  var db = firebase.firestore();
  db.collection('households')
    .where('members.' + uid + '.email', '>', '')
    .limit(1)
    .get()
    .then(function(snap) {
      if (!snap.empty) {
        var doc = snap.docs[0];
        _syncHouseholdId = doc.id;
        _syncHousehold = doc.data();
        _syncRenderSettingsUI();
        // Check if seed has run; if not, seed first, then attach listeners
        // v4: re-seed to push persist-defaults data (foods, etc.) to Firestore
        try {
          var _seedVer = localStorage.getItem('sl_sync_seeded');
          if (!_seedVer || _seedVer !== '4') {
            // Only admin seeds — members receive data via listeners
            var _myRole = (_syncHousehold.members && _syncHousehold.members[user.uid])
              ? _syncHousehold.members[user.uid].role : 'member';
            if (_myRole === 'admin') {
              _syncSeedFirestore(_syncHouseholdId).then(function() {
                localStorage.setItem('sl_sync_seeded', '4');
                try { _syncAttachListeners(_syncHouseholdId); }
                catch(e) { _syncRecordCrash('attachListeners-post-seed', e); }
              }).catch(function(e) {
                _syncRecordCrash('seed', e);
                if (!_syncDisabled) {
                  try { _syncAttachListeners(_syncHouseholdId); }
                  catch(e2) { _syncRecordCrash('attachListeners-after-seed-fail', e2); }
                }
              });
            } else {
              // Member: skip seed, just bump version and attach listeners
              localStorage.setItem('sl_sync_seeded', '4');
              _syncAttachListeners(_syncHouseholdId);
            }
          } else {
            _syncAttachListeners(_syncHouseholdId);
          }
        } catch(e) { _syncRecordCrash('attachListeners', e); }
      } else {
        // No household — prompt Create/Join
        _syncHouseholdId = null;
        _syncHousehold = null;
        _syncRenderSettingsUI();
      }
    })
    .catch(function(err) {
      console.error('[sync] Household lookup failed:', err);
      _syncRenderSettingsUI();
    });
}

// ─── Household CRUD ───
function syncCreateHousehold(babyName, dob) {
  if (!_syncUser) return;
  var db = firebase.firestore();
  var uid = _syncUser.uid;
  var memberData = {};
  memberData[uid] = {
    name: _syncUser.displayName || 'Parent',
    email: _syncUser.email || '',
    role: 'admin'
  };
  var code = _syncGenerateInviteCode();
  db.collection('households').add({
    name: babyName,
    dob: dob,
    createdBy: uid,
    members: memberData,
    inviteCode: code
  }).then(function(ref) {
    _syncHouseholdId = ref.id;
    return ref.get();
  }).then(function(doc) {
    _syncHousehold = doc.data();
    _syncRenderSettingsUI();
    _syncCloseHouseholdModal();
    showQLToast('Household created — share the invite code');
    _syncSeedFirestore(_syncHouseholdId).then(function() {
      localStorage.setItem('sl_sync_seeded', '4');
      _syncAttachListeners(_syncHouseholdId);
    });
  }).catch(function(err) {
    console.error('[sync] Create household error:', err);
    showQLToast('Failed to create household');
  });
}

function syncJoinByCode(code) {
  if (!_syncUser) return;
  if (!code || code.length < 8) { showQLToast('Code must be at least 8 characters'); return; }
  var db = firebase.firestore();
  var uid = _syncUser.uid;
  db.collection('households')
    .where('inviteCode', '==', code.trim())
    .limit(1)
    .get()
    .then(function(snap) {
      if (snap.empty) { showQLToast('Invalid invite code'); return; }
      var doc = snap.docs[0];
      var data = doc.data();
      // Block if already in a different household (§4.5 #29)
      if (_syncHouseholdId && _syncHouseholdId !== doc.id) {
        showQLToast('You are already in a household. Leave first to join another.');
        return;
      }
      var updates = {};
      updates['members.' + uid] = {
        name: _syncUser.displayName || 'Parent',
        email: _syncUser.email || '',
        role: 'member'
      };
      updates.inviteCode = null; // single-use (§4.5 #26)
      return doc.ref.update(updates).then(function() {
        _syncHouseholdId = doc.id;
        _syncHousehold = data;
        _syncHousehold.members[uid] = updates['members.' + uid];
        _syncHousehold.inviteCode = null;
        _syncRenderSettingsUI();
        _syncCloseHouseholdModal();
        showQLToast('Joined household!');
        // Joining device does NOT seed — data comes from admin's seed via listeners
        localStorage.setItem('sl_sync_seeded', '4');
        _syncAttachListeners(_syncHouseholdId);
      });
    })
    .catch(function(err) {
      console.error('[sync] Join by code error:', err);
      showQLToast('Join failed — try again');
    });
}

function syncLeaveHousehold() {
  if (!_syncUser || !_syncHouseholdId) return;
  var uid = _syncUser.uid;
  var db = firebase.firestore();
  var ref = db.collection('households').doc(_syncHouseholdId);

  // Check if last member (§4.5 #32)
  var memberCount = _syncHousehold ? Object.keys(_syncHousehold.members || {}).length : 0;
  var msg = memberCount <= 1
    ? 'You are the last member. Leaving will delete all synced data permanently. Continue?'
    : 'Leave this household? You can keep a local copy of your data.';

  confirmAction(msg, function() {
    _syncDetachListeners();
    var updates = {};
    updates['members.' + uid] = firebase.firestore.FieldValue.delete();
    ref.update(updates).then(function() {
      if (memberCount <= 1) {
        // Last member — delete household entirely
        return _syncDeleteHouseholdDoc(_syncHouseholdId);
      }
    }).then(function() {
      _syncHouseholdId = null;
      _syncHousehold = null;
      _syncRenderSettingsUI();
      showQLToast('Left household');
    }).catch(function(err) {
      console.error('[sync] Leave error:', err);
      showQLToast('Failed to leave — try again');
    });
  }, 'Leave');
}

function syncRegenerateCode() {
  if (!_syncHouseholdId) return;
  var db = firebase.firestore();
  var code = _syncGenerateInviteCode();
  db.collection('households').doc(_syncHouseholdId).update({ inviteCode: code })
    .then(function() {
      _syncHousehold.inviteCode = code;
      _syncRenderSettingsUI();
      showQLToast('New invite code generated');
    });
}

// ─── Household Deletion (internal) ───
function _syncDeleteHouseholdDoc(hId) {
  var db = firebase.firestore();
  // Delete subcollections in batches — Firestore does not cascade-delete
  var collections = ['feeds', 'sleep', 'poop', 'caretickets', 'notes', 'singles', 'invites', 'backups'];
  return Promise.all(collections.map(function(col) {
    return _syncDeleteCollection(db.collection('households').doc(hId).collection(col));
  })).then(function() {
    return db.collection('households').doc(hId).delete();
  });
}

function _syncDeleteCollection(ref) {
  return ref.limit(450).get().then(function(snap) {
    if (snap.empty) return;
    var batch = firebase.firestore().batch();
    snap.docs.forEach(function(doc) { batch.delete(doc.ref); });
    return batch.commit().then(function() {
      if (snap.size === 450) return _syncDeleteCollection(ref); // recurse for large collections
    });
  });
}

// ─── Detach Listeners ───
function _syncDetachListeners() {
  _syncListenerUnsubs.forEach(function(unsub) { unsub(); });
  _syncListenerUnsubs = [];
  // C0 Fix 5 (Kael): reset listener-ready state so next attach re-earns
  // confirmation. Without this, a re-attach cycle would flush immediately
  // with the previous session's stale shadow.
  _syncReady = {};
  Object.keys(_syncReadyTimers).forEach(function(c) {
    if (_syncReadyTimers[c]) clearTimeout(_syncReadyTimers[c]);
  });
  _syncReadyTimers = {};
  _syncPendingFlush = {};
}

// ═══════════════════════════════════════════
// PHASE 2: SYNC ENGINE
// ═══════════════════════════════════════════

// ─── cloneDeep ───
function _syncCloneDeep(val) {
  if (val === null || val === undefined) return val;
  try { return structuredClone(val); }
  catch(e) { return JSON.parse(JSON.stringify(val)); }
}

// ─── Deep Diff (§8.1) ───
// Returns { updates: { "dot.path": value }, deletes: { "dot.path": deleteField() } }
function _syncDeepDiff(oldObj, newObj, path) {
  if (!path) path = '';
  var updates = {};
  var deletes = {};

  if (!oldObj) oldObj = {};
  if (!newObj) newObj = {};

  // Keys in new
  var newKeys = Object.keys(newObj);
  for (var i = 0; i < newKeys.length; i++) {
    var key = newKeys[i];
    var fullPath = path ? path + '.' + key : key;
    if (!(key in oldObj)) {
      // New key — set entire subtree
      updates[fullPath] = newObj[key];
      continue;
    }
    var oldVal = oldObj[key];
    var newVal = newObj[key];
    if (Array.isArray(newVal)) {
      // Arrays are ATOMIC — overwrite if different
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        updates[fullPath] = newVal;
      }
    } else if (typeof newVal === 'object' && newVal !== null) {
      // Objects → RECURSE
      var sub = _syncDeepDiff(oldVal || {}, newVal, fullPath);
      var sk;
      for (sk in sub.updates) updates[sk] = sub.updates[sk];
      for (sk in sub.deletes) deletes[sk] = sub.deletes[sk];
    } else {
      // Leaf value
      if (oldVal !== newVal) {
        updates[fullPath] = newVal;
      }
    }
  }

  // Keys in old but not new → DELETE
  var oldKeys = Object.keys(oldObj);
  for (var j = 0; j < oldKeys.length; j++) {
    var okey = oldKeys[j];
    if (!(okey in newObj)) {
      var oFullPath = path ? path + '.' + okey : okey;
      deletes[oFullPath] = firebase.firestore.FieldValue.delete();
    }
  }

  return { updates: updates, deletes: deletes };
}

// ─── Per-Entry Array Diff (§8.2) ───
// Returns { added: [entry], edited: [{ id, updates }], deleted: [id] }
function _syncDiffArray(oldArr, newArr) {
  if (!Array.isArray(oldArr)) oldArr = [];
  if (!Array.isArray(newArr)) newArr = [];

  var oldMap = {};
  for (var i = 0; i < oldArr.length; i++) {
    if (oldArr[i] && oldArr[i].id) oldMap[oldArr[i].id] = oldArr[i];
  }
  var newMap = {};
  for (var j = 0; j < newArr.length; j++) {
    if (newArr[j] && newArr[j].id) newMap[newArr[j].id] = newArr[j];
  }

  var added = [];
  var edited = [];
  var deleted = [];

  // Check new entries
  var newIds = Object.keys(newMap);
  for (var k = 0; k < newIds.length; k++) {
    var id = newIds[k];
    if (!oldMap[id]) {
      added.push(newMap[id]);
    } else if (JSON.stringify(oldMap[id]) !== JSON.stringify(newMap[id])) {
      var diff = _syncDeepDiff(oldMap[id], newMap[id], '');
      if (Object.keys(diff.updates).length > 0 || Object.keys(diff.deletes).length > 0) {
        edited.push({ id: id, updates: diff.updates, deletes: diff.deletes });
      }
    }
  }

  // Deleted entries
  var oldIds = Object.keys(oldMap);
  for (var l = 0; l < oldIds.length; l++) {
    if (!newMap[oldIds[l]]) {
      deleted.push(oldIds[l]);
    }
  }

  return { added: added, edited: edited, deleted: deleted };
}

// ─── syncWrite Router (§7.1) ───
// SAFETY: entire function is try/catch — sync must never break save()
function syncWrite(key, val, old) {
  try {
    // NOTE (C0 Fix 3 — B3): shadow is NOT written here. Shadow represents
    // last-observed remote state (from listener) or last-confirmed-pushed
    // state (post-flush). Writing shadow from local-intent contaminated the
    // flush diff baseline and made single-doc edits silently no-op.
    // See docs/handoffs/session-2026-04-17-lyra-c0-deploy.md for the trace.

    // Guards
    if (_syncDisabled) return;                  // Layer 4: auto-disabled after crashes
    if (_remoteWriteDepth > 0) return;          // don't echo back remote writes
    if (!SYNC_KEYS[key]) return;                // local-only key
    if (!_syncHouseholdId) return;              // no household
    if (!_syncUser) return;                     // not signed in

    // Circuit breaker (§4.7 #48)
    if (_syncWriteCount >= CIRCUIT_BREAKER_LIMIT) {
      console.warn('[sync] Circuit breaker tripped — ' + _syncWriteCount + ' writes this hour');
      return;
    }
    _syncWriteCount++;
    if (!_syncWriteCountReset) {
      _syncWriteCountReset = setTimeout(function() {
        _syncWriteCount = 0;
        _syncWriteCountReset = null;
      }, 3600000); // 1 hour
    }

    var config = SYNC_KEYS[key];
    var db = firebase.firestore();
    var hRef = db.collection('households').doc(_syncHouseholdId);

    if (config.model === 'per-entry') {
      _syncWritePerEntry(hRef, config.collection, key, old, val);
    } else {
      _syncDebounceSingleDoc(hRef, config.collection, key, old, val);
    }
  } catch(e) {
    _syncRecordCrash('syncWrite/' + key, e);
  }
}

// ─── Per-Entry Write (immediate) ───
function _syncWritePerEntry(hRef, collection, key, oldVal, newVal) {
  var diff = _syncDiffArray(oldVal, newVal);
  var colRef = hRef.collection(collection);
  var syncMeta = {
    __sync_updatedBy: { uid: _syncUser.uid, name: _syncUser.displayName || 'Parent' },
    __sync_syncedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  // Added entries
  diff.added.forEach(function(entry) {
    var data = Object.assign({}, entry, syncMeta, {
      __sync_createdBy: { uid: _syncUser.uid, name: _syncUser.displayName || 'Parent' }
    });
    colRef.doc(entry.id).set(data).catch(function(e) {
      console.error('[sync] Add ' + collection + '/' + entry.id + ' failed:', e);
    });
  });

  // Edited entries — field-level updates
  diff.edited.forEach(function(change) {
    var payload = Object.assign({}, change.updates, change.deletes, syncMeta);
    colRef.doc(change.id).update(payload).catch(function(e) {
      console.error('[sync] Update ' + collection + '/' + change.id + ' failed:', e);
    });
  });

  // Deleted entries
  diff.deleted.forEach(function(id) {
    colRef.doc(id).delete().catch(function(e) {
      console.error('[sync] Delete ' + collection + '/' + id + ' failed:', e);
    });
  });
}

// ─── Single-Doc Write (debounced) ───
function _syncDebounceSingleDoc(hRef, collection, key, oldVal, newVal) {
  var timerKey = collection; // debounce per collection, not per key
  if (_syncDebounceTimers[timerKey]) clearTimeout(_syncDebounceTimers[timerKey]);

  _syncDebounceTimers[timerKey] = setTimeout(function() {
    _syncDebounceTimers[timerKey] = null;
    // Re-check state at flush time (guards against stale hRef from debounce delay)
    if (_syncDisabled || !_syncHouseholdId || !_syncUser) return;
    try {
      var freshDb = firebase.firestore();
      var freshRef = freshDb.collection('households').doc(_syncHouseholdId);
      _syncFlushSingleDoc(freshRef, collection);
    } catch(e) { _syncRecordCrash('debounce-flush/' + collection, e); }
  }, DEBOUNCE_MS);
}

function _syncFlushSingleDoc(hRef, collection) {
  // Gather all localStorage KEYS that map to this collection
  var keysForCol = _syncCollectionToKeys[collection];
  if (!keysForCol || keysForCol.length === 0) return;

  // C0 Fix 2: gate on listener-ready — don't push with a blind shadow.
  // If the listener hasn't first-fired for this collection, _syncShadow
  // may not reflect Firestore's real state. Defer and let _syncMarkReady
  // retry once the listener (or fallback timer) confirms remote state.
  if (!_syncReady[collection]) {
    _syncPendingFlush[collection] = true;
    console.warn('[sync] Flush deferred for ' + collection +
      ' — listener not ready. Will retry on listener-ready.');
    return;
  }

  // Build a combined object from current localStorage
  var current = {};
  for (var i = 0; i < keysForCol.length; i++) {
    current[keysForCol[i]] = load(keysForCol[i], null);
  }

  // Build combined shadow (what Firestore last knew)
  var shadow = {};
  for (var j = 0; j < keysForCol.length; j++) {
    shadow[keysForCol[j]] = _syncShadow[keysForCol[j]] !== undefined ? _syncShadow[keysForCol[j]] : null;
  }

  // Diff
  var diff = _syncDeepDiff(shadow, current, '');
  var hasUpdates = Object.keys(diff.updates).length > 0;
  var hasDeletes = Object.keys(diff.deletes).length > 0;
  if (!hasUpdates && !hasDeletes) return;

  var docRef = hRef.collection('singles').doc(collection);
  var syncMeta = {
    __sync_updatedBy: { uid: _syncUser.uid, name: _syncUser.displayName || 'Parent' },
    __sync_syncedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  // Apply updates via setDoc(merge) and deletes via updateDoc
  var promises = [];
  if (hasUpdates) {
    var updatePayload = Object.assign({}, diff.updates, syncMeta);
    promises.push(docRef.set(updatePayload, { merge: true }));
  }
  if (hasDeletes) {
    var deletePayload = Object.assign({}, diff.deletes, syncMeta);
    promises.push(docRef.update(deletePayload));
  }

  Promise.all(promises).catch(function(e) {
    console.error('[sync] Single-doc write ' + collection + ' failed:', e);
  });

  // Update shadow to current
  for (var k = 0; k < keysForCol.length; k++) {
    _syncShadow[keysForCol[k]] = _syncCloneDeep(current[keysForCol[k]]);
  }
}

// ─── Attach Listeners (§7.3) ───
function _syncAttachListeners(hId) {
  _syncDetachListeners();
  var db = firebase.firestore();
  var hRef = db.collection('households').doc(hId);

  // Init shadow from current localStorage
  var allKeys = Object.keys(SYNC_KEYS);
  for (var i = 0; i < allKeys.length; i++) {
    _syncShadow[allKeys[i]] = _syncCloneDeep(load(allKeys[i], null));
  }

  // Derive per-entry and single-doc collection lists from SYNC_KEYS (no hardcoding)
  var _peSet = {};
  var _sdSet = {};
  var _allSyncKeys = Object.keys(SYNC_KEYS);
  for (var ki = 0; ki < _allSyncKeys.length; ki++) {
    var _cfg = SYNC_KEYS[_allSyncKeys[ki]];
    if (_cfg.model === 'per-entry') _peSet[_cfg.collection] = true;
    else _sdSet[_cfg.collection] = true;
  }
  var perEntryCollections = Object.keys(_peSet);
  var singleDocNames = Object.keys(_sdSet);

  // Per-entry collections — each handler wrapped in try/catch for isolation
  perEntryCollections.forEach(function(col) {
    var unsub = hRef.collection(col).onSnapshot(function(snapshot) {
      try { if (!_syncDisabled) _syncHandlePerEntrySnapshot(col, snapshot); }
      catch(e) { _syncRecordCrash('per-entry/' + col, e); }
    }, function(err) {
      console.error('[sync] Listener error on ' + col + ':', err);
    });
    _syncListenerUnsubs.push(unsub);
    // C0 Fix 2/5: arm adaptive fallback so flush gate doesn't strand writes
    // if this listener never fires (permission issue, network, etc.).
    _syncArmReadyFallback(col);
  });

  // Single-doc collections (in /singles/{docName})
  singleDocNames.forEach(function(docName) {
    var unsub = hRef.collection('singles').doc(docName).onSnapshot(function(doc) {
      try { if (!_syncDisabled) _syncHandleSingleDocSnapshot(docName, doc); }
      catch(e) { _syncRecordCrash('single-doc/' + docName, e); }
    }, function(err) {
      console.error('[sync] Listener error on singles/' + docName + ':', err);
    });
    _syncListenerUnsubs.push(unsub);
    _syncArmReadyFallback(docName);
  });

  // Household doc listener (member changes, invite code)
  var hUnsub = hRef.onSnapshot(function(doc) {
    try {
      if (doc.exists) {
        _syncHousehold = doc.data();
        _syncRenderSettingsUI();
      }
    } catch(e) { _syncRecordCrash('household-listener', e); }
  });
  _syncListenerUnsubs.push(hUnsub);
}

// ─── Handle Per-Entry Snapshot ───
function _syncHandlePerEntrySnapshot(collection, snapshot) {
  // C0 Cipher C2: mark-ready in finally so defer paths don't suppress it.
  try {
    // Find which localStorage key maps to this collection
    var lsKey = null;
    var allKeys = Object.keys(SYNC_KEYS);
    for (var i = 0; i < allKeys.length; i++) {
      if (SYNC_KEYS[allKeys[i]].collection === collection && SYNC_KEYS[allKeys[i]].model === 'per-entry') {
        lsKey = allKeys[i];
        break;
      }
    }
    if (!lsKey) return;

    // Build full array from Firestore snapshot
    var entries = [];
    snapshot.forEach(function(doc) {
      var data = doc.data();
      // Strip __sync_* metadata before storing locally
      var clean = {};
      var keys = Object.keys(data);
      for (var j = 0; j < keys.length; j++) {
        if (keys[j].indexOf('__sync_') !== 0) {
          clean[keys[j]] = data[keys[j]];
        }
      }
      // Ensure id field matches doc ID
      clean.id = doc.id;
      entries.push(clean);
    });

    // Compare to current localStorage
    var current = load(lsKey, []);
    if (JSON.stringify(current) === JSON.stringify(entries)) return; // no change

    // C0 Fix 4 (Kael): defer if our local write is pending.
    // Per-entry writes fire immediately (not debounced), so the window is
    // narrow; check _syncDebounceTimers defensively in case the collection
    // is shared with a single-doc path in the future.
    if (_syncDebounceTimers[collection]) {
      console.warn('[sync] Per-entry listener deferring for ' + collection +
        ' — pending local debounce in same collection.');
      return;
    }

    // SAFETY (c13a7de): never overwrite non-empty local with empty Firestore
    if (entries.length === 0 && Array.isArray(current) && current.length > 0) {
      console.warn('[sync] Skipping empty snapshot for ' + collection + ' — local has ' + current.length + ' entries');
      return;
    }

    // Count changes for toast
    var changeCount = 0;
    snapshot.docChanges().forEach(function(change) {
      if (change.type !== 'added' || !snapshot.metadata.hasPendingWrites) {
        changeCount++;
      }
    });

    // Write to localStorage via save() with _remoteWriteDepth guard
    _remoteWriteDepth++;
    try { save(lsKey, entries); }
    finally { _remoteWriteDepth--; }

    // Update shadow
    _syncShadow[lsKey] = _syncCloneDeep(entries);

    // Toast (skip during migration/reconcile, skip self-echo)
    if (!_syncIsMigrating && !_syncIsReconciling && changeCount > 0) {
      _syncQueueToast(collection, changeCount);
    }
  } finally {
    _syncMarkReady(collection);
  }
}

// ─── Handle Single-Doc Snapshot ───
function _syncHandleSingleDocSnapshot(docName, doc) {
  // C0 Cipher C2: _syncMarkReady MUST run on every exit path, including
  // early returns and defer paths, so the collection's ready-state is
  // confirmed even when no save happens. Wrap in try/finally.
  try {
    // !doc.exists is still a confirmed "nothing here yet" state from Firestore.
    if (!doc.exists) return;
    var data = doc.data();

    // Strip __sync_* metadata
    var clean = {};
    var dataKeys = Object.keys(data);
    for (var i = 0; i < dataKeys.length; i++) {
      if (dataKeys[i].indexOf('__sync_') !== 0) {
        clean[dataKeys[i]] = data[dataKeys[i]];
      }
    }

    // Find which localStorage KEYS map to this collection
    var lsKeys = _syncCollectionToKeys[docName];
    if (!lsKeys || lsKeys.length === 0) return;

    var anyChanged = false;

    // C0 guard ordering at loop site (Cipher C1):
    //   [E]  existing JSON equality — cheapest no-op skip
    //   [K4] Kael's defer-on-pending-debounce — if our local write is about
    //        to flush, don't let this snapshot clobber it
    //   [N]  existing null-remote guard — absent field preserves local
    //   [M1] Maren's ALWAYS_POPULATED_KEYS empty-guard — only for the
    //        curated allowlist; user-clearable keys propagate normally
    for (var j = 0; j < lsKeys.length; j++) {
      var key = lsKeys[j];
      var remoteVal = clean[key] !== undefined ? clean[key] : null;
      var current = load(key, null);

      // [E] equality skip
      if (JSON.stringify(current) === JSON.stringify(remoteVal)) continue;

      // [K4] defer if our local write is pending flush in this collection
      var _cfg = SYNC_KEYS[key];
      if (_cfg && _cfg.collection && _syncDebounceTimers[_cfg.collection]) {
        console.warn('[sync] Listener deferring save for ' + key +
          ' — pending local write in debounce queue for ' + _cfg.collection);
        continue;
      }

      // [N] null-remote — preserve local
      if (remoteVal === null) continue;

      // [M1] ALWAYS_POPULATED_KEYS empty-remote guard
      if (ALWAYS_POPULATED_KEYS.has(key)) {
        var remoteEmptyArr = Array.isArray(remoteVal) && remoteVal.length === 0;
        var remoteEmptyObj = remoteVal && typeof remoteVal === 'object' &&
          !Array.isArray(remoteVal) && Object.keys(remoteVal).length === 0;
        var localHasArr = Array.isArray(current) && current.length > 0;
        var localHasObj = current && typeof current === 'object' &&
          !Array.isArray(current) && Object.keys(current).length > 0;
        if ((remoteEmptyArr && localHasArr) || (remoteEmptyObj && localHasObj)) {
          console.warn('[sync] ALWAYS_POPULATED guard fired for ' + key +
            '; remote=empty, local has data. Skipping overwrite.');
          continue;
        }
      }

      anyChanged = true;
      _remoteWriteDepth++;
      try { save(key, remoteVal); }
      finally { _remoteWriteDepth--; }
      _syncShadow[key] = _syncCloneDeep(remoteVal);
    }

    if (anyChanged && !_syncIsMigrating && !_syncIsReconciling) {
      _syncQueueToast(docName, 1);
    }
  } finally {
    _syncMarkReady(docName);
  }
}

// ─── Sync Toast ───
function _syncQueueToast(source, count) {
  // Self-echo suppression: if the write was ours, skip (§4.7 #45)
  // The _remoteWriteDepth check in syncWrite already handles outbound suppression;
  // here we batch rapid toasts into one.
  if (_syncToastDebounce) clearTimeout(_syncToastDebounce);
  _syncToastPending = (_syncToastPending || 0) + count;

  _syncToastDebounce = setTimeout(function() {
    var n = _syncToastPending;
    _syncToastPending = 0;
    if (n <= 0) return;
    var msg = n === 1 ? 'New data synced — tap to refresh' : n + ' updates synced — tap to refresh';
    _syncShowSyncToast(msg);
  }, 1500);
}
var _syncToastDebounce = null;
var _syncToastPending = 0;

function _syncShowSyncToast(msg) {
  // Create a distinct sync toast (different from QLToast per §4.6 #38)
  var existing = document.getElementById('syncToast');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.id = 'syncToast';
  toast.className = 'sync-toast';
  toast.textContent = msg;
  toast.addEventListener('click', function() {
    toast.remove();
    window.location.reload(); // §4.6 #40
  });
  document.body.appendChild(toast);

  // Auto-dismiss after 8s
  setTimeout(function() {
    if (toast.parentNode) toast.remove();
  }, 8000);
}

// ─── Seed Firestore (one-time migration §12.2) ───
function _syncSeedFirestore(hId) {
  _syncIsMigrating = true;
  var db = firebase.firestore();
  var hRef = db.collection('households').doc(hId);
  var allKeys = Object.keys(SYNC_KEYS);
  var promises = [];

  // Per-entry collections: batch write
  allKeys.forEach(function(key) {
    var config = SYNC_KEYS[key];
    if (config.model !== 'per-entry') return;
    var data = load(key, []);
    if (!Array.isArray(data) || data.length === 0) return;

    // Batch in chunks of 450 (Firestore limit is 500)
    for (var i = 0; i < data.length; i += 450) {
      var chunk = data.slice(i, i + 450);
      var batch = db.batch();
      chunk.forEach(function(entry) {
        if (!entry || !entry.id) return;
        var docData = Object.assign({}, entry, {
          __sync_createdBy: { uid: _syncUser.uid, name: _syncUser.displayName || 'Parent' },
          __sync_updatedBy: { uid: _syncUser.uid, name: _syncUser.displayName || 'Parent' },
          __sync_syncedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        batch.set(hRef.collection(config.collection).doc(entry.id), docData);
      });
      promises.push(batch.commit());
    }
  });

  // Single-doc collections: one set per collection (skip null/empty — never overwrite good data)
  var singleDocCollections = {};
  allKeys.forEach(function(key) {
    var config = SYNC_KEYS[key];
    if (config.model !== 'single-doc') return;
    var val = load(key, null);
    if (val === null || val === undefined) return; // skip empty
    if (Array.isArray(val) && val.length === 0) return; // skip empty arrays
    if (typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length === 0) return; // skip empty objects
    var col = config.collection;
    if (!singleDocCollections[col]) singleDocCollections[col] = {};
    singleDocCollections[col][key] = val;
  });

  Object.keys(singleDocCollections).forEach(function(col) {
    var payload = Object.assign({}, singleDocCollections[col], {
      __sync_updatedBy: { uid: _syncUser.uid, name: _syncUser.displayName || 'Parent' },
      __sync_syncedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    promises.push(hRef.collection('singles').doc(col).set(payload, { merge: true }));
  });

  return Promise.all(promises).then(function() {
    _syncIsMigrating = false;
    console.log('[sync] Seed complete');
  }).catch(function(e) {
    _syncIsMigrating = false;
    console.error('[sync] Seed error:', e);
  });
}

// ─── Utilities ───
function _syncGenerateInviteCode() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  var code = '';
  for (var i = 0; i < 10; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

function _syncNormalizeEmail(email) {
  if (!email) return '';
  var parts = email.toLowerCase().split('@');
  if (parts.length !== 2) return email.toLowerCase();
  return parts[0].replace(/\./g, '') + '@' + parts[1];
}

// ─── Settings UI Rendering ───
function _syncRenderSettingsUI() {
  var container = document.getElementById('syncSettingsSection');
  if (!container) return;

  // Not signed in
  if (!_syncUser) {
    container.innerHTML =
      '<div class="sync-card sync-card-signin">' +
        '<div class="sync-card-hdr">' +
          '<span class="icon icon-sky">' + zi('link') + '</span>' +
          '<span class="sync-card-title">Device Sync</span>' +
        '</div>' +
        '<div class="sync-card-body">' +
          'Sign in with Google to sync data across devices. ' +
          'Your data stays local until you sign in.' +
        '</div>' +
        '<button class="btn btn-sky btn-full-base" data-action="syncSignIn">' +
          zi('bolt') + ' Sign in with Google' +
        '</button>' +
      '</div>';
    return;
  }

  // Signed in, no household
  if (!_syncHouseholdId) {
    container.innerHTML =
      '<div class="sync-card sync-card-setup">' +
        '<div class="sync-card-hdr">' +
          '<span class="icon icon-sage">' + zi('check') + '</span>' +
          '<span class="sync-card-title">Signed in</span>' +
          '<span class="sync-user-email">' + escHtml(_syncUser.email || '') + '</span>' +
        '</div>' +
        '<div class="sync-card-body">' +
          'Create a household to start syncing, or join one with an invite code.' +
        '</div>' +
        '<div class="sync-card-actions">' +
          '<button class="btn btn-sky btn-full-base" data-action="syncOpenHouseholdModal" data-arg="create">' +
            zi('sprout') + ' Create Household' +
          '</button>' +
          '<button class="btn btn-lav btn-full-base" data-action="syncOpenHouseholdModal" data-arg="join">' +
            zi('link') + ' Join with Code' +
          '</button>' +
        '</div>' +
        '<button class="btn btn-ghost btn-full-sm" data-action="syncSignOut">' +
          'Sign Out' +
        '</button>' +
      '</div>';
    return;
  }

  // Signed in + household active
  var members = _syncHousehold ? _syncHousehold.members || {} : {};
  var memberList = Object.keys(members).map(function(uid) {
    var m = members[uid];
    var you = uid === _syncUser.uid ? ' (you)' : '';
    return '<div class="sync-member">' +
      '<span class="sync-member-name">' + escHtml(m.name || 'Unknown') + you + '</span>' +
      '<span class="sync-member-role">' + escHtml(m.role || 'member') + '</span>' +
    '</div>';
  }).join('');

  var code = _syncHousehold ? _syncHousehold.inviteCode : null;
  var codeSection = code
    ? '<div class="sync-code-row">' +
        '<span class="sync-code-label">Invite code</span>' +
        '<span class="sync-code-value">' + escHtml(code) + '</span>' +
        '<button class="btn btn-ghost btn-sm" data-action="syncRegenerateCode">New Code</button>' +
      '</div>'
    : '<div class="sync-code-row">' +
        '<span class="sync-code-label">Invite code</span>' +
        '<span class="sync-code-used">Used</span>' +
        '<button class="btn btn-ghost btn-sm" data-action="syncRegenerateCode">Generate</button>' +
      '</div>';

  container.innerHTML =
    '<div class="sync-card sync-card-active">' +
      '<div class="sync-card-hdr">' +
        '<span class="icon icon-sage">' + zi('link') + '</span>' +
        '<span class="sync-card-title">' + escHtml((_syncHousehold ? _syncHousehold.name : '') || 'Household') + '</span>' +
        '<span class="sync-status-badge sync-status-connected">Connected</span>' +
      '</div>' +
      '<div class="sync-members">' +
        '<div class="sync-section-label">Members</div>' +
        memberList +
      '</div>' +
      codeSection +
      '<div class="sync-card-body">' +
        '<span class="sync-user-email">' + escHtml(_syncUser.email || '') + '</span>' +
      '</div>' +
      '<div class="sync-card-actions">' +
        '<button class="btn btn-ghost btn-full-sm" data-action="syncLeaveHousehold">' +
          'Leave Household' +
        '</button>' +
        '<button class="btn btn-ghost btn-full-sm" data-action="syncSignOut">' +
          'Sign Out' +
        '</button>' +
      '</div>' +
    '</div>';
}

// ─── Household Modal ───
function syncOpenHouseholdModal(mode) {
  var existing = document.getElementById('syncHouseholdModal');
  if (existing) existing.remove();

  var isCreate = mode === 'create';
  var title = isCreate ? 'Create Household' : 'Join Household';
  var body = isCreate
    ? '<div class="fx-col g12">' +
        '<label class="sync-modal-label">Baby\'s name</label>' +
        '<input type="text" id="syncBabyName" class="sync-modal-input" placeholder="e.g. Ziva" autocomplete="off">' +
        '<label class="sync-modal-label">Date of birth</label>' +
        '<input type="date" id="syncBabyDob" class="sync-modal-input">' +
        '<button class="btn btn-sky btn-full-base" data-action="syncConfirmCreate">' +
          zi('check') + ' Create' +
        '</button>' +
      '</div>'
    : '<div class="fx-col g12">' +
        '<label class="sync-modal-label">Invite code</label>' +
        '<input type="text" id="syncJoinCode" class="sync-modal-input" placeholder="Enter 10-character code" autocomplete="off" maxlength="12">' +
        '<button class="btn btn-lav btn-full-base" data-action="syncConfirmJoin">' +
          zi('check') + ' Join' +
        '</button>' +
      '</div>';

  var modal = document.createElement('div');
  modal.id = 'syncHouseholdModal';
  modal.className = 'modal-overlay sync-modal-overlay';
  modal.innerHTML =
    '<div class="modal sync-modal">' +
      '<div class="modal-hdr">' +
        '<div class="modal-title">' + title + '</div>' +
        '<button class="modal-close" data-action="syncCloseHouseholdModal" aria-label="Close">&times;</button>' +
      '</div>' +
      '<div class="modal-body">' + body + '</div>' +
    '</div>';
  document.body.appendChild(modal);

  // Focus first input after paint
  requestAnimationFrame(function() {
    var input = modal.querySelector('input');
    if (input) input.focus();
  });
}

function _syncCloseHouseholdModal() {
  var modal = document.getElementById('syncHouseholdModal');
  if (modal) modal.remove();
}

function _syncConfirmCreate() {
  var nameEl = document.getElementById('syncBabyName');
  var dobEl = document.getElementById('syncBabyDob');
  var name = nameEl ? nameEl.value : '';
  var dob = dobEl ? dobEl.value : '';
  if (!name.trim()) { showQLToast('Enter baby\'s name'); return; }
  if (!dob) { showQLToast('Enter date of birth'); return; }
  if (!_syncUser) { showQLToast('Not signed in — please sign in first'); return; }
  syncCreateHousehold(name.trim(), dob);
}

function _syncConfirmJoin() {
  var code = (document.getElementById('syncJoinCode') || {}).value || '';
  if (!code.trim()) { showQLToast('Enter invite code'); return; }
  syncJoinByCode(code.trim());
}
