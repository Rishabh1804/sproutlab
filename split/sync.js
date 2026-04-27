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
  // Visibility store r2: first listener-ready is proof of Firestore activity
  // — collapses the 'connecting' state even if onSnapshotsInSync is not yet
  // available or has not yet landed.
  if (typeof _syncHasEverFired !== 'undefined' && !_syncHasEverFired) {
    _syncHasEverFired = true;
    if (typeof _syncNotifyVisibility === 'function') _syncNotifyVisibility();
  }
  if (_syncReadyTimers[collection]) {
    clearTimeout(_syncReadyTimers[collection]);
    _syncReadyTimers[collection] = null;
  }
  // Fire any pending flush that was deferred waiting for this listener.
  if (_syncPendingFlush[collection]) {
    _syncPendingFlush[collection] = false;
    if (typeof _syncNotifyVisibility === 'function') _syncNotifyVisibility();
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
    // Cipher blocker #5 (r2): the 'Sync paused' toast is retired. The halted
    // state is now surfaced persistently in the header indicator + offline
    // badge, with a reload affordance. Transient toast on top would be the
    // three-surfaces-for-one-state redundancy the derived store is meant
    // to eliminate.
    if (typeof _syncNotifyVisibility === 'function') _syncNotifyVisibility();
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

// ─── SYNC_RENDER_DEPS (Phase 3 PR-9) ───
// Per-key declaration of (a) the module-global name to rehydrate on listener
// fire and (b) the active-tab-keyed renderer functions to call after
// rehydration. Sibling to SYNC_KEYS; consumed by _syncDispatchRender.
//
// Two shapes per Cipher's surfacing #2:
//   { global: '<name>', renderers: { … } }  — globaled keys; writer-shim mutates
//                                              the named module global before
//                                              renderers run.
//   { global: null,     renderers: { … } }  — non-globaled keys (vaccBooked,
//                                              episode keys); renderers read
//                                              from localStorage directly so
//                                              no rehydration step needed.
//
// Renderer keys are 'tab' or 'tab:sub' strings matching _syncReadActiveTab's
// return shape; renderers are name-string arrays (rationale below).
//
// Renderer scope discipline: each entry lists the SMALLEST renderer set that
// reflects the changed key on the active tab. renderHome is a composite
// renderer (calls many sub-renderers internally) and is the right call when
// home is active; for sub-tab surfaces, we call only the subtree-owning
// renderer (e.g. renderDietStats for diet, renderGrowth for medical-growth)
// to keep blast radius small.
//
// Renderers are NAME STRINGS (resolved via window[name] at dispatch time)
// rather than direct function references so that:
//   1. Spy/stub-based testing works (tests can monkey-patch window.renderX
//      and observe dispatch calls).
//   2. Renderer renames surface as runtime no-ops in dispatch logs rather
//      than parse-time errors — the dispatch path is best-effort by design
//      (Phase 3 §3 Option B (3): graceful fallback on renderer crash).
//   3. The map remains readable as a declarative list without requiring
//      forward references to functions defined in later concat'd modules.
const SYNC_RENDER_DEPS = {
  [KEYS.feeding]:           { global: 'feedingData', renderers: { home: ['renderHome'], 'track:diet': ['renderDietStats'] } },
  [KEYS.sleep]:             { global: 'sleepData',   renderers: { home: ['renderHome'], 'track:sleep': ['renderSleep'] } },
  [KEYS.poop]:              { global: 'poopData',    renderers: { home: ['renderHome'], 'track:poop':  ['renderPoop'] } },
  [KEYS.notes]:             { global: 'notes',       renderers: { history: ['renderNotes'] } },
  [KEYS.activityLog]:       { global: 'activityLog', renderers: { home: ['renderHome'], 'track:milestones': ['renderMilestoneStats'] } },
  [KEYS.milestones]:        { global: 'milestones',  renderers: { home: ['renderHome'], 'track:milestones': ['renderMilestoneStats'] } },
  [KEYS.growth]:            { global: 'growthData',  renderers: { home: ['renderHome'], 'track:medical': ['renderGrowth'], growth: ['renderGrowthStats'] } },
  [KEYS.vacc]:              { global: 'vaccData',    renderers: { home: ['renderHome'], 'track:medical': ['renderVaccPastList'] } },
  [KEYS.vaccBooked]:        { global: null,          renderers: { home: ['renderHome'], 'track:medical': ['renderVaccPastList'] } },
  [KEYS.meds]:              { global: 'meds',        renderers: { home: ['renderHome'], 'track:medical': ['renderMedicalStats'] } },
  [KEYS.visits]:            { global: 'visits',      renderers: { 'track:medical': ['renderMedicalStats'] } },
  [KEYS.doctors]:           { global: 'doctors',     renderers: { 'track:medical': ['renderDoctorPrep'] } },
  [KEYS.medChecks]:         { global: 'medChecks',   renderers: { 'track:medical': ['renderMedicalStats'] } },
  [KEYS.feverEpisodes]:     { global: null, renderers: { home: ['renderHomeFeverBanner'],     'track:medical': ['renderFeverEpisodeCard'] } },
  [KEYS.diarrhoeaEpisodes]: { global: null, renderers: { home: ['renderHomeDiarrhoeaBanner'], 'track:medical': ['renderDiarrhoeaEpisodeCard'] } },
  [KEYS.vomitingEpisodes]:  { global: null, renderers: { home: ['renderHomeVomitingBanner'],  'track:medical': ['renderVomitingEpisodeCard'] } },
  [KEYS.coldEpisodes]:      { global: null, renderers: { home: ['renderHomeColdBanner'],      'track:medical': ['renderColdEpisodeCard'] } },
  [KEYS.foods]:             { global: 'foods',        renderers: { home: ['renderHome'], 'track:diet': ['renderDietStats'] } },
  [KEYS.careTickets]:       { global: '_careTickets', renderers: { home: ['ctRenderEntryPoint', 'ctRenderZone', 'ctRenderFollowUpBanner'] } },
};

// _syncSetGlobal / _syncGetGlobal — paired controlled accessors for module
// globals from the _syncDispatchRender path. Keeps the per-key map
// declarative without `window[name] = …` indirection (HR-3 spirit; `let`
// bindings don't attach to window so the indirection wouldn't work anyway).
// Returns true on hit, false for unknown names — callers treat false as a
// defensive guard. Per Cipher surfacing #2, dep.global may be null for
// non-globaled keys (vaccBooked, episodes); _syncDispatchRender skips this
// call entirely in that case, so this function only ever sees declared
// globals. _syncGetGlobal is the symmetric reader used by Phase 3 tests
// (and any future production caller that needs read-introspection).
function _syncSetGlobal(name, value) {
  switch (name) {
    case 'growthData':   growthData   = value; return true;
    case 'feedingData':  feedingData  = value; return true;
    case 'milestones':   milestones   = value; return true;
    case 'foods':        foods        = value; return true;
    case 'vaccData':     vaccData     = value; return true;
    case 'notes':        notes        = value; return true;
    case 'meds':         meds         = value; return true;
    case 'visits':       visits       = value; return true;
    case 'medChecks':    medChecks    = value; return true;
    case 'doctors':      doctors      = value; return true;
    case 'sleepData':    sleepData    = value; return true;
    case 'poopData':     poopData     = value; return true;
    case '_careTickets': _careTickets = value; return true;
    case 'activityLog':  activityLog  = value; return true;
    default: return false;
  }
}
function _syncGetGlobal(name) {
  switch (name) {
    case 'growthData':   return growthData;
    case 'feedingData':  return feedingData;
    case 'milestones':   return milestones;
    case 'foods':        return foods;
    case 'vaccData':     return vaccData;
    case 'notes':        return notes;
    case 'meds':         return meds;
    case 'visits':       return visits;
    case 'medChecks':    return medChecks;
    case 'doctors':      return doctors;
    case 'sleepData':    return sleepData;
    case 'poopData':     return poopData;
    case '_careTickets': return _careTickets;
    case 'activityLog':  return activityLog;
    default: return undefined;
  }
}

// _syncReadActiveTab — single point of truth for the active-tab key shape
// consumed by SYNC_RENDER_DEPS.renderers. Returns 'home' | 'growth' |
// 'track:<sub>' | 'history' | 'insights' | 'info' | null. Mirrors the
// idiom at intelligence.js:10773 + core.js:2620 (track sub-tab dispatch).
function _syncReadActiveTab() {
  if (typeof TAB_ORDER === 'undefined' || typeof document === 'undefined') return null;
  var top = null;
  for (var i = 0; i < TAB_ORDER.length; i++) {
    var el = document.getElementById('tab-' + TAB_ORDER[i]);
    if (el && el.classList.contains('active')) { top = TAB_ORDER[i]; break; }
  }
  if (!top) return null;
  if (top !== 'track') return top;
  var sub = (typeof _activeTrackSub !== 'undefined') ? _activeTrackSub : null;
  return sub ? ('track:' + sub) : 'track';
}

// _syncDispatchRender — Phase 3 core dispatch. Called from listener handlers
// after the localStorage write (save(lsKey, value) with _remoteWriteDepth
// guard). Steps:
//   1. Look up SYNC_RENDER_DEPS[lsKey]. No-op if missing (legitimate for
//      keys that don't need any UI surface; reserved for future additions).
//   2. Rehydrate module global via _syncSetGlobal (skipped when dep.global
//      is null per Cipher #2). Closes the cross-device clobber loop
//      (Finding E) — subsequent local writes read from rehydrated state
//      instead of stale init state.
//   3. Read active tab via _syncReadActiveTab (Finding C idiom).
//   4. Call the active-tab's declared renderers, each crash-isolated via
//      try/catch. Renderer crash falls through to the toast-with-reload
//      fallback in the listener handler (graceful degradation).
//
// Returns a non-null attribution payload when one was provided, so the
// caller (listener handler) can compose the toast text. Captured before
// the existing __sync_* strip in both handlers (Cipher #4 cross-reference).
function _syncDispatchRender(lsKey, value, attribution) {
  var dep = SYNC_RENDER_DEPS[lsKey];
  if (!dep) return attribution || null; // no UI dependency mapped — silent OK
  // (1) Rehydrate module global (Finding B + E fix)
  if (dep.global) {
    try { _syncSetGlobal(dep.global, value); }
    catch(e) { _syncRecordCrash('dispatch-set-global/' + lsKey, e); }
  }
  // (2) Active-tab renderer dispatch (Finding C idiom). Renderers are name
  //     strings resolved via window[name] so spy-based tests work and a
  //     renamed renderer surfaces as a runtime no-op (graceful) rather than
  //     a parse-time error.
  var activeTab = _syncReadActiveTab();
  var names = (activeTab && dep.renderers) ? dep.renderers[activeTab] : null;
  if (names && names.length) {
    for (var i = 0; i < names.length; i++) {
      try {
        var fn = (typeof window !== 'undefined') ? window[names[i]] : undefined;
        if (typeof fn === 'function') fn();
      } catch(e) { _syncRecordCrash('dispatch-render/' + lsKey + '/' + names[i], e); }
    }
  }
  return attribution || null;
}

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
  // Visibility store r2: re-attach is a fresh session — wipe per-key pending
  // state and the has-ever-fired gate so the indicator honestly returns to
  // 'connecting' until the new listeners confirm activity.
  if (typeof _syncPendingByKey !== 'undefined') _syncPendingByKey = {};
  if (typeof _syncHasEverFired !== 'undefined') _syncHasEverFired = false;
  if (typeof _syncNotifyVisibility === 'function') _syncNotifyVisibility();
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

// ─── C0 v3.1 Fix B4: nest dotted paths before set+merge ───
// _syncDeepDiff produces dotted keys like 'ziva_feeding.2026-04-17' for
// nested object updates. Those are correct for Firestore's update() method
// (dotted paths → nested field updates). But _syncFlushSingleDoc uses
// set(payload, {merge:true}), which interprets keys LITERALLY — dotted keys
// become top-level fields with dots in their names, not nested paths.
// This helper converts `{'a.b.c': v}` to `{a: {b: {c: v}}}` so set+merge
// correctly nests. Called on diff.updates only; diff.deletes goes through
// update() and can keep dotted paths.
function _syncNestDottedPaths(flatObj) {
  var result = {};
  Object.keys(flatObj).forEach(function(key) {
    var parts = key.split('.');
    var cursor = result;
    for (var i = 0; i < parts.length - 1; i++) {
      if (!cursor[parts[i]] || typeof cursor[parts[i]] !== 'object') {
        cursor[parts[i]] = {};
      }
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length - 1]] = flatObj[key];
  });
  return result;
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
  var wasQueued = !!_syncDebounceTimers[timerKey];
  if (wasQueued) clearTimeout(_syncDebounceTimers[timerKey]);

  _syncDebounceTimers[timerKey] = setTimeout(function() {
    _syncDebounceTimers[timerKey] = null;
    if (typeof _syncNotifyVisibility === 'function') _syncNotifyVisibility();
    // Re-check state at flush time (guards against stale hRef from debounce delay)
    if (_syncDisabled || !_syncHouseholdId || !_syncUser) return;
    try {
      var freshDb = firebase.firestore();
      var freshRef = freshDb.collection('households').doc(_syncHouseholdId);
      _syncFlushSingleDoc(freshRef, collection);
    } catch(e) { _syncRecordCrash('debounce-flush/' + collection, e); }
  }, DEBOUNCE_MS);
  if (!wasQueued && typeof _syncNotifyVisibility === 'function') _syncNotifyVisibility();
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
    if (typeof _syncNotifyVisibility === 'function') _syncNotifyVisibility();
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

  // Apply updates via setDoc(merge) and deletes via updateDoc.
  // C0 v3.1 Fix B4: diff.updates may contain dotted keys (from nested-object
  // recursion in _syncDeepDiff). set+merge interprets dotted keys LITERALLY,
  // creating top-level fields with dots in their names rather than nested
  // field updates. Nest dotted paths back to an object tree before set+merge
  // so Firestore merges them into the right nested positions.
  var promises = [];
  if (hasUpdates) {
    var nested = _syncNestDottedPaths(diff.updates);
    var updatePayload = Object.assign({}, nested, syncMeta);
    promises.push(docRef.set(updatePayload, { merge: true }));
  }
  if (hasDeletes) {
    // Deletes go through update() which DOES support dotted paths correctly,
    // so leave diff.deletes flat.
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

  // Per-entry collections — each handler wrapped in try/catch for isolation.
  // {includeMetadataChanges:true} so pending→ACK transitions fire the handler
  // and the visibility store can read snapshot.metadata.hasPendingWrites.
  // Data-equality checks inside the handler short-circuit metadata-only fires.
  perEntryCollections.forEach(function(col) {
    var unsub = hRef.collection(col).onSnapshot({ includeMetadataChanges: true }, function(snapshot) {
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
    var unsub = hRef.collection('singles').doc(docName).onSnapshot({ includeMetadataChanges: true }, function(doc) {
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
  // Cipher r2: record post-submit pending-write state for this collection
  // before any early return. Listener fires with {includeMetadataChanges:true}
  // so this catches pending→ACK transitions even when no data changed.
  _syncRecordPending(collection, !!(snapshot.metadata && snapshot.metadata.hasPendingWrites));

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
      // Strip __sync_* metadata before storing locally (parallel to single-doc
      // strip at the snapshot handler below; Cipher #4 cross-reference)
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

    // Phase 3 PR-9 + Cipher #3 — attribution composition for per-entry snapshots.
    // Per-entry collections (caretickets only today) carry __sync_updatedBy on
    // each doc; aggregate across the change-set this snapshot covers:
    //   - one writer across all changes → name them
    //   - multiple writers → 'multiple parents'
    //   - missing metadata on any change → fall back to count-only (null)
    var attribution = null;
    try {
      var changes = snapshot.docChanges();
      if (changes && changes.length > 0) {
        var seenUid = null;
        var seenName = null;
        var allHaveMeta = true;
        var multipleWriters = false;
        for (var ci = 0; ci < changes.length; ci++) {
          var cdata = changes[ci].doc && changes[ci].doc.data && changes[ci].doc.data();
          var ub = cdata && cdata.__sync_updatedBy;
          if (!ub || !ub.uid) { allHaveMeta = false; break; }
          if (seenUid === null) { seenUid = ub.uid; seenName = ub.name || null; }
          else if (seenUid !== ub.uid) { multipleWriters = true; }
        }
        if (allHaveMeta) {
          attribution = multipleWriters
            ? { uid: null, name: null, group: 'multiple', at: null }
            : { uid: seenUid, name: seenName, at: null };
        }
      }
    } catch(e) { /* attribution is best-effort; toast falls back to count-only */ }

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

    // Phase 3 PR-9: dispatch active-tab re-render + module-global rehydrate
    // (Findings B, E). Per-entry collection — single rehydration of the
    // module global to the full entries array (same shape as single-doc
    // path; the entries array IS the canonical local representation).
    try { _syncDispatchRender(lsKey, entries, attribution); }
    catch(e) { _syncRecordCrash('dispatch/' + lsKey, e); }

    // Toast (skip during migration/reconcile, skip self-echo at toast layer)
    if (!_syncIsMigrating && !_syncIsReconciling && changeCount > 0) {
      _syncQueueToast(collection, changeCount, attribution);
    }
  } finally {
    _syncMarkReady(collection);
  }
}

// ─── Handle Single-Doc Snapshot ───
function _syncHandleSingleDocSnapshot(docName, doc) {
  // Cipher r2: record post-submit pending-write state for this doc before
  // any early return. Listener fires with {includeMetadataChanges:true}.
  _syncRecordPending(docName, !!(doc && doc.metadata && doc.metadata.hasPendingWrites));

  // C0 Cipher C2: _syncMarkReady MUST run on every exit path, including
  // early returns and defer paths, so the collection's ready-state is
  // confirmed even when no save happens. Wrap in try/finally.
  try {
    // !doc.exists is still a confirmed "nothing here yet" state from Firestore.
    if (!doc.exists) return;
    var data = doc.data();

    // Phase 3 Finding F: capture attribution BEFORE the __sync_* strip.
    // Threaded through _syncDispatchRender to the toast for "X updated Y"
    // text composition. Self-echo suppression still happens at toast time.
    var attribution = data && data.__sync_updatedBy ? {
      uid:  data.__sync_updatedBy.uid || null,
      name: data.__sync_updatedBy.name || null,
      at:   data.__sync_syncedAt || null,
    } : null;

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
    var lastChangedAttribution = null; // last successful change's attribution
    var changedKeys = [];               // for dispatch / toast composition

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

      // Phase 3 PR-9: dispatch active-tab re-render + module-global rehydrate
      // (Findings B, E). Crash-isolated; failure falls through to the
      // toast-with-reload fallback in _syncQueueToast (graceful degradation).
      try { _syncDispatchRender(key, remoteVal, attribution); }
      catch(e) { _syncRecordCrash('dispatch/' + key, e); }
      changedKeys.push(key);
      lastChangedAttribution = attribution;
    }

    if (anyChanged && !_syncIsMigrating && !_syncIsReconciling) {
      _syncQueueToast(docName, 1, lastChangedAttribution);
    }
  } finally {
    _syncMarkReady(docName);
  }
}

// ─── Sync Toast ───
// Phase 3 PR-9 — toast becomes a non-blocking ack of "data refreshed in
// place" (auto-dismiss only) rather than a tap-to-reload trigger. Reload
// affordance moves to (a) the offline badge and halted-state indicator
// (sl-1-2/sl-1-3, untouched) for state the auto-render path cannot recover
// from, and (b) the explicit fallback when _syncDispatchRender throws and
// the listener handler queues a fallback toast with the prior reload click
// behavior.
function _syncQueueToast(source, count, attribution) {
  if (_syncToastDebounce) clearTimeout(_syncToastDebounce);
  _syncToastPending = (_syncToastPending || 0) + count;
  // Carry attribution to the latest fire (most recent listener delivery wins
  // for the burst). When attribution differs across the burst, the Cipher #3
  // multiple-writers shape collapses to a generic group label below.
  if (attribution) {
    if (!_syncToastAttribution) {
      _syncToastAttribution = attribution;
    } else if (_syncToastAttribution.uid && attribution.uid && _syncToastAttribution.uid !== attribution.uid) {
      _syncToastAttribution = { uid: null, name: null, group: 'multiple', at: null };
    } else if (!_syncToastAttribution.uid && !_syncToastAttribution.group) {
      _syncToastAttribution = attribution;
    }
  }
  _syncToastSourceLast = source;

  _syncToastDebounce = setTimeout(function() {
    var n = _syncToastPending;
    var attr = _syncToastAttribution;
    _syncToastPending = 0;
    _syncToastAttribution = null;
    if (n <= 0) return;
    var msg = _syncComposeToastText(n, attr);
    _syncShowSyncToast(msg);
  }, 1500);
}
var _syncToastDebounce = null;
var _syncToastPending = 0;
var _syncToastAttribution = null;
var _syncToastSourceLast = null;

// Compose toast text — attribution-aware (Finding F).
//   attr.name set         → "{name} synced N updates" / "{name} synced an update"
//   attr.group=='multiple'→ "Multiple parents synced N updates"
//   attr null/empty       → "N updates synced" / "An update synced"
// Self-echo (local user is the writer) is suppressed at the listener layer
// in a future iteration; today's _remoteWriteDepth check upstream prevents
// the local write from re-firing the toast in most cases. When the toast
// names the local user it's still a truthful surface — the data did sync.
function _syncComposeToastText(n, attr) {
  var noun = (n === 1) ? 'an update' : (n + ' updates');
  if (attr && attr.group === 'multiple') {
    return 'Multiple parents synced ' + noun;
  }
  if (attr && attr.name) {
    return attr.name + ' synced ' + noun;
  }
  return (n === 1 ? 'An update synced' : (n + ' updates synced'));
}

function _syncShowSyncToast(msg, opts) {
  // Create a distinct sync toast (different from QLToast per §4.6 #38)
  var existing = document.getElementById('syncToast');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.id = 'syncToast';
  toast.className = 'sync-toast';
  toast.textContent = msg;
  // Phase 3 PR-9: success-path toast is auto-dismiss only (the auto-render
  // already updated the active tab in place; nothing for the user to tap).
  // The fallback path passes opts.tapToReload=true to restore the prior
  // click-to-reload behavior when _syncDispatchRender's success cannot be
  // assumed — e.g. when a future caller threads through dispatch failure.
  if (opts && opts.tapToReload) {
    toast.classList.add('is-tappable'); // CSS gates the cursor (HR-2)
    toast.addEventListener('click', function() {
      toast.remove();
      window.location.reload(); // §4.6 #40 fallback path
    });
  }
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

// ─── Sync Visibility (Phase 1 — sl-1-2, r2) ───
// Derived store fusing four signals:
//   (a) navigator.onLine + window online/offline events
//   (b) Firestore drain via db.onSnapshotsInSync — definitive ACK that local
//       cache + IDB persistence queue + server are all in sync
//   (c) Post-submit pending-writes from snapshot.metadata.hasPendingWrites
//       (recorded per collection/doc by the existing listener handlers, which
//       now subscribe with {includeMetadataChanges:true})
//   (d) Pre-submit queue: _syncDebounceTimers (active count) + _syncPendingFlush
//
// Five logical states, three visual colors (color mapping lives in CSS):
//   connecting — cold boot: no listener has fired, no drain event yet, pending===0
//   online     — network up, fully drained
//   syncing    — network up, pending > 0
//   offline    — !navigator.onLine
//   halted     — _syncDisabled === true (circuit breaker tripped; reload-required)
//
// Disjointness contract:
//   pre-submit (our maps) and post-submit (hasPendingWrites map) are phases
//   of a write's life. A write is in _syncDebounceTimers until the timer
//   fires; the fire callback nulls the entry and calls .set(), whose
//   snapshot.metadata.hasPendingWrites then reflects the submission.
//   Mutually exclusive at any instant — counts are additive by construction.

// _syncPendingByKey — key = collection name for per-entry listeners (caretickets,
//   etc.), key = docName for single-doc listeners (tracking, medical, etc.).
// Value is the last-seen QuerySnapshot/DocumentSnapshot metadata.hasPendingWrites.
//
// SEMANTIC NOTE (Cipher PR #4 nit 2, r3 option b): Firestore's
// QuerySnapshot.metadata.hasPendingWrites is a SINGLE boolean per collection
// — true iff ANY doc in the collection has a pending write. Counting entries
// in this map therefore yields the number of COLLECTIONS with one or more
// pending writes, not the number of individual writes. Five queued meals in
// `tracking` → badge reads "(1 pending)", not "(5 pending)". The direction
// is honest (`pending > 0` correctly reports "something is queued") and the
// copy "(N pending)" reads naturally at the user level. True per-write
// precision would require iterating snapshot.docChanges() and keying by
// `${collection}/${doc.id}` in _syncRecordPending — deferred to a phase-2
// refinement if the count's user-visible granularity becomes a concern.
var _syncPendingByKey = {};
var _syncVisibilityListeners = [];       // subscriber callbacks
var _syncLastVisibility = null;          // last emitted snapshot (for change-detect)
var _syncVisibilityNotifyTimer = null;   // coalesces burst notifies
var _syncSnapshotsInSyncUnsub = null;    // Firestore drain listener unsub
var _syncVisibilityInitDone = false;
var _syncHasEverFired = false;           // any listener (per-entry/single-doc) first-fired OR onSnapshotsInSync landed
// (r3) Indicator click is routed through the data-action dispatcher (HR-3);
// no bespoke document click handler is bound here.

function _syncRecordPending(key, isPending) {
  var prev = !!_syncPendingByKey[key];
  if (prev === !!isPending) return;
  if (isPending) _syncPendingByKey[key] = true;
  else delete _syncPendingByKey[key];
  _syncNotifyVisibility();
}

function _syncCountPreSubmit() {
  var n = 0;
  for (var k in _syncDebounceTimers) {
    if (Object.prototype.hasOwnProperty.call(_syncDebounceTimers, k) && _syncDebounceTimers[k]) n++;
  }
  for (var c in _syncPendingFlush) {
    if (Object.prototype.hasOwnProperty.call(_syncPendingFlush, c) && _syncPendingFlush[c]) n++;
  }
  return n;
}

function _syncCountPostSubmit() {
  var n = 0;
  for (var k in _syncPendingByKey) {
    if (Object.prototype.hasOwnProperty.call(_syncPendingByKey, k) && _syncPendingByKey[k]) n++;
  }
  return n;
}

function syncVisibilityState() {
  var online = (typeof navigator !== 'undefined' && 'onLine' in navigator) ? navigator.onLine !== false : true;
  var preSubmit  = _syncCountPreSubmit();
  var postSubmit = _syncCountPostSubmit();
  var pending = preSubmit + postSubmit;  // disjoint by construction (see header comment)
  var state, reason;

  // Evaluation order matters: halted is a local fault independent of network,
  // so it wins over offline. connecting is only valid before any proof of
  // Firestore activity; it collapses to syncing the moment pending > 0.
  if (_syncDisabled) {
    state = 'halted';     reason = 'sync-disabled';
  } else if (!online) {
    state = 'offline';    reason = 'no-network';
  } else if (!_syncHasEverFired && pending === 0) {
    state = 'connecting'; reason = 'no-listener-yet';
  } else if (pending > 0) {
    state = 'syncing';    reason = 'writes-pending';
  } else {
    state = 'online';     reason = 'synced';
  }
  return { state: state, pending: pending, reason: reason };
}

function onSyncVisibilityChange(listener) {
  if (typeof listener !== 'function') return function(){};
  _syncVisibilityListeners.push(listener);
  try { listener(syncVisibilityState()); } catch(e) { console.error('[sync-vis] listener threw on subscribe', e); }
  return function unsubscribe() {
    var i = _syncVisibilityListeners.indexOf(listener);
    if (i >= 0) _syncVisibilityListeners.splice(i, 1);
  };
}

function _syncNotifyVisibility() {
  if (_syncVisibilityNotifyTimer) return;
  _syncVisibilityNotifyTimer = setTimeout(function() {
    _syncVisibilityNotifyTimer = null;
    var snap = syncVisibilityState();
    var prev = _syncLastVisibility;
    if (prev && prev.state === snap.state && prev.pending === snap.pending && prev.reason === snap.reason) return;
    _syncLastVisibility = snap;
    for (var i = 0; i < _syncVisibilityListeners.length; i++) {
      try { _syncVisibilityListeners[i](snap); } catch(e) { console.error('[sync-vis] listener threw', e); }
    }
  }, 120);
}

function _syncUpdateStatusIndicator(snap) {
  var btn = document.getElementById('syncStatus');
  if (!btn) return;
  if (btn.hasAttribute('hidden')) btn.removeAttribute('hidden');
  btn.setAttribute('data-state', snap.state);

  // Copy table — one source of truth per logical state; CSS handles color.
  // aria-label is the long form so screen readers distinguish the two red
  // states (offline vs halted) that share --tc-danger.
  var label, title;
  switch (snap.state) {
    case 'connecting':
      label = 'Connecting…';
      title = 'Connecting to sync…';
      break;
    case 'online':
      label = 'Synced';
      title = 'All changes synced.';
      break;
    case 'syncing':
      label = 'Syncing' + (snap.pending > 0 ? ' (' + snap.pending + ')' : '…');
      title = snap.pending + ' change' + (snap.pending === 1 ? '' : 's') + ' pending sync.';
      break;
    case 'offline':
      label = 'Offline';
      title = 'Offline — changes will sync when back online.' + (snap.pending > 0 ? ' (' + snap.pending + ' pending)' : '');
      break;
    case 'halted':
      label = 'Sync paused';
      title = 'Sync paused after errors — tap to reload.' + (snap.pending > 0 ? ' (' + snap.pending + ' pending)' : '');
      break;
    default:
      label = ''; title = '';
  }

  var labEl = btn.querySelector('.sync-indicator__label');
  if (labEl) labEl.textContent = label;
  btn.setAttribute('title', title);
  btn.setAttribute('aria-label', title);

  // HR-3 / HR-6 (r3): tap-to-reload is routed through the core.js data-action
  // dispatcher. Only halted is tappable; other states are read-only pills.
  // Toggle the attribute's presence — the dispatcher gates on its presence,
  // so other states are non-interactive without any extra guard here.
  if (snap.state === 'halted') btn.setAttribute('data-action', 'syncReload');
  else btn.removeAttribute('data-action');
}

// Dispatcher target for data-action="syncReload". Called from the indicator
// pill when halted (sl-1-2 r3) and the offline badge's reload button
// (sl-1-3). Reloading re-bootstraps sync and clears the circuit breaker's
// in-memory crash count.
function syncReload() {
  if (typeof window !== 'undefined' && window.location && window.location.reload) {
    window.location.reload();
  }
}

// ─── Offline Badge Renderer (Phase 1 — sl-1-3) ───
// Subscribed to the sync-visibility store; shows the persistent badge
// below the header in offline or halted state only. Copy and pending-count
// come from the same snapshot the indicator consumes — no separate counter.
function _syncUpdateOfflineBadge(snap) {
  var badge = document.getElementById('offlineBadge');
  if (!badge) return;
  var visible = snap.state === 'offline' || snap.state === 'halted';
  if (!visible) {
    if (!badge.hasAttribute('hidden')) badge.setAttribute('hidden', '');
    return;
  }
  if (badge.hasAttribute('hidden')) badge.removeAttribute('hidden');
  badge.setAttribute('data-state', snap.state);

  var nPending = snap.pending > 0 ? ' (' + snap.pending + ' pending)' : '';
  var copy = snap.state === 'halted'
    ? 'Sync paused after errors — reload to retry.' + nPending
    : 'Offline — changes will sync when back online.' + nPending;

  var copyEl = badge.querySelector('.offline-badge__copy');
  if (copyEl) copyEl.textContent = copy;

  // Reload surfaces only in halted (local fault); offline auto-resumes
  // on network restore, no user action needed.
  var reloadBtn = badge.querySelector('.offline-badge__action');
  if (reloadBtn) {
    if (snap.state === 'halted') reloadBtn.removeAttribute('hidden');
    else reloadBtn.setAttribute('hidden', '');
  }
}

function initSyncVisibility() {
  if (_syncVisibilityInitDone) return;
  _syncVisibilityInitDone = true;
  if (typeof window !== 'undefined') {
    var bump = function() { _syncNotifyVisibility(); };
    window.addEventListener('online',  bump);
    window.addEventListener('offline', bump);
    try {
      if (typeof firebase !== 'undefined' && firebase.firestore) {
        var db = firebase.firestore();
        if (typeof db.onSnapshotsInSync === 'function') {
          _syncSnapshotsInSyncUnsub = db.onSnapshotsInSync(function() {
            // First drain event = definitive proof of Firestore activity.
            // Collapses 'connecting' to 'online' (or 'syncing' if writes are
            // queued — ordering in syncVisibilityState handles that).
            _syncHasEverFired = true;
            _syncNotifyVisibility();
          });
        }
      }
    } catch(e) { /* non-fatal — derived store still works from counters */ }
  }
  onSyncVisibilityChange(_syncUpdateStatusIndicator);
  onSyncVisibilityChange(_syncUpdateOfflineBadge);
}

