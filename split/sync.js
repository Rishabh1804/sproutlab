// ─────────────────────────────────────────
// SYNC — Phase 1 + Phase 2: Auth, Household, Sync Engine
// ─────────────────────────────────────────

// ─── State ───
let _syncUser = null;           // current firebase.auth().currentUser snapshot
let _syncHouseholdId = null;    // active household doc ID
let _syncHousehold = null;      // cached household doc data
let _syncListenerUnsubs = [];   // onSnapshot unsubscribe fns
// Issue #53 — listener generation. Bumped on every _syncDetachListeners().
// Each onSnapshot callback captures the generation it was attached under and
// bails if it no longer matches the live one — so a Firestore snapshot
// callback already queued on the microtask loop at detach time cannot apply
// stale state (e.g. clobber local via save(lsKey, entries)) after the listener
// has been torn down. This guards the snapshot-APPLY path; the pre-existing
// _reconcileDone reset (§6.2(d)) only guarded reconcile RE-FIRE.
let _syncListenerGen = 0;
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
// PR-ε.0 §6.2(a) — per-entry reconcile gate. Keyed by collection name;
// entry exists once the first successful snapshot apply has happened
// for that collection in this session. Cleared on reconnect /
// household-rejoin (§6.2(d)). `var` matches the surrounding idiom;
// `const` would not work since §6.2(d) reassigns to a fresh Set.
var _reconcileDone = new Set();
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
  // PR-ε.0 §3 — scrapbook per-entry sync. Atomic with the SYNC_RENDER_DEPS
  // arm below: SYNC_KEYS alone arms a listener that dispatches against an
  // undefined dep (silent render miss); SYNC_RENDER_DEPS alone is dead config.
  [KEYS.scrapbook]:          { collection: 'scrapbook',   model: 'per-entry' },
  // milestone-engine-prep-v1 PR-A — engine substrate keys explicitly
  // registered per V-K-104 floor (no falling through ziva_* pattern picker).
  // Both single-doc; cross-device merge via dedicated _postReceive hooks
  // (V-M-116 — last-write-wins on whole-doc is unsafe for per-key state).
  [KEYS.milestoneSuppress]:  { collection: 'milestones',  model: 'single-doc' },
  [KEYS.activityMeta]:       { collection: 'activities',  model: 'single-doc' },
  // Tooth chart — per-tooth newest-ts merge via _postReceiveTeeth (a tombstone
  // with a newer ts beats an older eruption date, so removals don't resurrect).
  [KEYS.teeth]:              { collection: 'milestones',  model: 'single-doc' },
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

// ─── Unsynced-write ledger (PR #265, 2026-09-18) ───
// Root cause of the September data loss: writes made while the cloud was not
// acknowledging (breaker tripped, listeners never firing, writes rejected) were
// never pushed again, and the next listener attach applied the stale cloud copy
// over the newer local copy. Every local write to a synced key is recorded here
// until the SERVER acknowledges a push. Dirty keys are pushed in full before
// listeners attach (_syncFlushDirty) and are never overwritten by a snapshot
// while dirty. Lives in localStorage — not synced, and it survives sign-out and
// clearPersistence(), unlike the SDK's own write queue.
//   sl_sync_dirty      → { [lsKey]: { f: firstUnackedWriteMs, l: lastWriteMs, nf: needsFullPush } }
//   sl_sync_lastPushOk → ms of the last server-acknowledged push
const SYNC_DIRTY_KEY   = 'sl_sync_dirty';
const SYNC_LAST_OK_KEY = 'sl_sync_lastPushOk';
const SYNC_STALE_MS    = 6 * 60 * 60 * 1000;   // unacknowledged for 6h → 'stale' state
var _syncSessionAttachedAt = 0;               // ms when this session's listeners attached
var _syncSkippedSnapshots = {};               // docName | 'pe:'+collection → { gen, doc | snapshot } skipped by the [L] guard
function _syncReplaySkipped() {
  var keys = Object.keys(_syncSkippedSnapshots);
  keys.forEach(function(k) {
    var c = _syncSkippedSnapshots[k];
    delete _syncSkippedSnapshots[k];
    if (!c || _syncDisabled || (typeof _syncListenerGen !== 'undefined' && c.gen !== _syncListenerGen)) return;
    try {
      if (c.doc) _syncHandleSingleDocSnapshot(k, c.doc);
      else if (c.snapshot) _syncHandlePerEntrySnapshot(k.slice(3), c.snapshot);
    } catch(e) { console.warn('[sync] replay of skipped snapshot ' + k + ' failed:', e); }
  });
}

function _syncLoadDirty() {
  try {
    var m = JSON.parse(localStorage.getItem(SYNC_DIRTY_KEY) || '{}');
    return (m && typeof m === 'object' && !Array.isArray(m)) ? m : {};
  } catch(e) { return {}; }
}
function _syncSaveDirty(m) {
  try {
    if (Object.keys(m).length === 0) localStorage.removeItem(SYNC_DIRTY_KEY);
    else localStorage.setItem(SYNC_DIRTY_KEY, JSON.stringify(m));
  } catch(e) { /* storage full — the write itself already landed locally */ }
}
function _syncIsDirty(key) { return _syncLoadDirty()[key] !== undefined; }
// Ledger entry shape: { f: firstUnackedWriteMs, l: lastWriteMs, nf: needsFullPush }.
// Legacy plain-number entries (first ship) read as f = l = n.
function _syncLedgerEntry(v) {
  if (typeof v === 'number') return { f: v, l: v, nf: false };
  if (v && typeof v === 'object') {
    var f = typeof v.f === 'number' ? v.f : (typeof v.l === 'number' ? v.l : 0);
    var l = typeof v.l === 'number' ? v.l : f;
    return { f: f, l: l, nf: !!v.nf };
  }
  return null;
}
// A push that failed (rejected set/update/batch) leaves the key needing a FULL
// push: a later partial (diff-vs-shadow) flush cannot carry the failed content,
// so only _syncFlushDirty may clear it (Kael V-K F2).
function _syncMarkNeedsFull(key) {
  if (!SYNC_KEYS[key] || !_syncLedgerActive()) return;   // same activation boundary as _syncMarkDirty
  var m = _syncLoadDirty();
  var now = Date.now();
  var e = _syncLedgerEntry(m[key]) || { f: now, l: now, nf: false };   // positive knowledge of a failed push (Kael F19)
  e.nf = true;
  m[key] = e;
  _syncSaveDirty(m);
}
// "Unsynced" is only meaningful for a device that is already attached to the
// household (sl_sync_seeded === '4'). Before that, local writes are app defaults
// or pre-join entries, and the existing rules apply: an admin's first sign-in
// seeds, a joiner takes the household's data. Gating here keeps a fresh install
// from ever pushing its defaults over the household's arrays.
// `sl_sync_attached_once` is set at every listener attach and is NOT cleared by
// sign-out, so a member device that signs out, logs entries, and signs back in
// still ledgers those writes and pushes them instead of taking the cloud copy
// (Kael F18).
const SYNC_ATTACHED_KEY = 'sl_sync_attached_once';
function _syncLedgerActive() {
  try { return localStorage.getItem('sl_sync_seeded') === '4' || localStorage.getItem(SYNC_ATTACHED_KEY) === '1'; }
  catch(e) { return false; }
}
function _syncAttachedOnce() {
  try { return localStorage.getItem(SYNC_ATTACHED_KEY) === '1'; } catch(e) { return false; }
}
function _syncMarkDirty(key) {
  if (!SYNC_KEYS[key] || !_syncLedgerActive()) return;
  var m = _syncLoadDirty();
  var now = Date.now();
  var e = _syncLedgerEntry(m[key]) || { f: now, l: now, nf: false };
  if (!e.f) e.f = now;
  e.l = now;                      // first write time is kept — a later write never launders earlier dirt (Kael F1)
  m[key] = e;
  _syncSaveDirty(m);
  if (typeof _syncNotifyVisibility === 'function') _syncNotifyVisibility();
}
// Import / autosave-restore entry point (core.js; public sync* name per the
// module boundary): the restored keys are the parent's chosen truth and must
// reach the cloud before any snapshot applies.
function syncMarkUnsynced(keys) {
  if (!_syncLedgerActive()) return;
  var m = _syncLoadDirty();
  var now = Date.now();
  var any = false;
  (keys || []).forEach(function(k) {
    if (!SYNC_KEYS[k]) return;
    var e = _syncLedgerEntry(m[k]) || { f: now, l: now, nf: false };
    if (!e.f) e.f = now;
    e.l = now;
    e.nf = true;                  // a restored snapshot must go up in full
    m[k] = e;
    any = true;
  });
  if (any) _syncSaveDirty(m);
}
// Clear ledger entries whose local write is inside [notBefore, notAfter]. A
// partial (diff-vs-shadow) flush may only clear writes made in THIS session
// (notBefore = _syncSessionAttachedAt): earlier writes were already folded into
// the shadow at attach and are only ever pushed in full by _syncFlushDirty.
// `noStamp`: the keys are being dropped without any server contact (nothing to
// push), so "last synced" must not move.
function _syncClearDirty(keys, notAfter, notBefore, noStamp) {
  var m = _syncLoadDirty();
  var changed = false;
  (keys || []).forEach(function(k) {
    var e = _syncLedgerEntry(m[k]);
    if (!e) return;
    if (e.l > notAfter) return;                       // a write landed after this push started
    if (notBefore) {                                  // partial (session-scoped) clear:
      if (e.nf) return;                               //   a failed push needs a full push first
      if (e.f < notBefore) return;                    //   pre-attach dirt is not carried by a diff
    }
    delete m[k];
    changed = true;
  });
  if (changed) {
    _syncSaveDirty(m);
    // A snapshot skipped by the [L] guard while the key was dirty is replayed now
    // that the key is clean, so this device picks up the merged cloud copy (Kael F6).
    setTimeout(_syncReplaySkipped, 0);
  }
  if (!noStamp) { try { localStorage.setItem(SYNC_LAST_OK_KEY, String(Date.now())); } catch(e) {} }
  if (typeof _syncNotifyVisibility === 'function') _syncNotifyVisibility();
}
function syncUnsyncedInfo() {
  var m = _syncLoadDirty();
  var keys = Object.keys(m).filter(function(k) { return !!SYNC_KEYS[k]; });   // a key retired from SYNC_KEYS must not pin 'stale' forever
  var oldest = null;
  keys.forEach(function(k) { var e = _syncLedgerEntry(m[k]); if (e && (oldest === null || e.f < oldest)) oldest = e.f; });
  var last = parseInt(localStorage.getItem(SYNC_LAST_OK_KEY) || '', 10);
  return { count: keys.length, since: oldest, lastSyncedAt: isNaN(last) ? null : last };
}

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
  // PR-α (Stability sub-phase 2 first feature): renderMilestones split into
  // 8 per-surface renderers so cross-device sync re-renders every milestones-
  // tab surface (previously only renderMilestoneStats fired — list / wheels /
  // regression / timeline / recentEvidence / active / highlights stayed
  // stale on sync receive).
  [KEYS.activityLog]:       { global: 'activityLog', renderers: { home: ['renderHome'], 'track:milestones': ['renderMilestoneStats', 'renderMilestoneHighlights', 'renderMilestoneList', 'renderCategoryWheels', 'renderRegressionAlerts', 'renderRecentEvidence', 'renderMilestoneTimeline', 'renderActiveMilestones'] } },
  [KEYS.milestones]:        { global: 'milestones',  postReceive: '_postReceiveMilestones', renderers: { home: ['renderHome'], 'track:milestones': ['renderMilestoneStats', 'renderMilestoneHighlights', 'renderMilestoneList', 'renderCategoryWheels', 'renderRegressionAlerts', 'renderRecentEvidence', 'renderMilestoneTimeline', 'renderActiveMilestones'] } },
  [KEYS.growth]:            { global: 'growthData',  renderers: { home: ['renderHome'], 'track:medical': ['renderGrowth'], growth: ['renderGrowthStats'] } },
  [KEYS.vacc]:              { global: 'vaccData',    renderers: { home: ['renderHome'], 'track:medical': ['renderVaccPastList'] } },
  [KEYS.vaccBooked]:        { global: null,          renderers: { home: ['renderHome'], 'track:medical': ['renderVaccPastList'] } },
  [KEYS.meds]:              { global: 'meds',        renderers: { home: ['renderHome'], 'track:medical': ['renderMedicalStats'] } },
  [KEYS.visits]:            { global: 'visits',      renderers: { 'track:medical': ['renderMedicalStats'] } },
  [KEYS.doctors]:           { global: 'doctors',     renderers: { 'track:medical': ['renderDoctorPrep'] } },
  [KEYS.medChecks]:         { global: 'medChecks',   renderers: { 'track:medical': ['renderMedicalStats', 'renderMedD3PatternCard'] } }, // T1-2: pattern card joins the sync push render list so it live-updates when device A's Done propagates to device B
  [KEYS.feverEpisodes]:     { global: null, renderers: { home: ['renderHomeFeverBanner'],     'track:medical': ['renderFeverEpisodeCard'] } },
  [KEYS.diarrhoeaEpisodes]: { global: null, renderers: { home: ['renderHomeDiarrhoeaBanner'], 'track:medical': ['renderDiarrhoeaEpisodeCard'] } },
  [KEYS.vomitingEpisodes]:  { global: null, renderers: { home: ['renderHomeVomitingBanner'],  'track:medical': ['renderVomitingEpisodeCard'] } },
  [KEYS.coldEpisodes]:      { global: null, renderers: { home: ['renderHomeColdBanner'],      'track:medical': ['renderColdEpisodeCard'] } },
  [KEYS.foods]:             { global: 'foods',        renderers: { home: ['renderHome'], 'track:diet': ['renderDietStats'] } },
  [KEYS.careTickets]:       { global: '_careTickets', renderers: { home: ['ctRenderEntryPoint', 'ctRenderZone', 'ctRenderFollowUpBanner'] } },
  // PR-ε.0 §3 — scrapbook lives in the history tab (Cipher v2 BLOCKER #9
  // — confirmed: scrapbook UI surface is in the history tab post-v2.3
  // relocation, not home). Two renderers fire on receive: renderScrapbook
  // (the home-tab scrapbook card body) + renderScrapbookHistory (the
  // history-tab section). Both are safe-no-op if their tab isn't active.
  [KEYS.scrapbook]:         { global: 'scrapbook',    renderers: { 'history': ['renderScrapbook', 'renderScrapbookHistory'] } },
  // milestone-engine-prep-v1 PR-A — engine substrate render deps.
  // postReceive hooks fold remote+local per-key state on cross-device receive
  // (V-M-116 + V-K-111 floors). Renderers are placeholder-empty in PR-A —
  // milestones-tab-v1 IMPL wires `renderMilestonesTab` and friends as
  // consumers; renderHome rehydrates today's activityLevel chip when present.
  // mergeOnReceive (V-M-116 floor): pure merge function (remoteVal, localPrior) → merged
  // applied BEFORE the listener-handler save, so cross-device per-key state on both sides
  // survives last-write-wins. Distinct from `postReceive` (no-args; operates on global
  // in-place — used by _postReceiveMilestones for migration + dedupe).
  [KEYS.milestoneSuppress]: { global: 'milestoneSuppress', mergeOnReceive: '_postReceiveMilestoneSuppress', renderers: { home: ['renderHome'], 'track:milestones': ['renderActiveMilestones'] } },
  [KEYS.activityMeta]:      { global: 'activityMeta',     mergeOnReceive: '_postReceiveActivityMeta',     renderers: { home: ['renderHome'] } },
  [KEYS.teeth]:             { global: 'teethLog',         mergeOnReceive: '_postReceiveTeeth',            renderers: { 'track:milestones': ['renderMsTeeth'] } },
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
    // PR-ε.0 §6.1 — scrapbook reassignment is acceptable here ONLY because
    // no in-place mutator (no dedupeScrapbookByText analog) and no
    // closure-pinning reader exists today (Maren+Kael v5 audit). §6.3
    // mandates in-place mutation for `milestones` for the symmetric
    // closure-pin hazard. Re-verify if either constraint changes
    // (closure-pinning reader added, OR in-place scrapbook mutator like
    // a future dedupeScrapbookByText).
    case 'scrapbook':    scrapbook    = value; return true;
    case 'teethLog':     teethLog     = value; return true;
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
    case 'scrapbook':    return scrapbook;
    case 'teethLog':     return teethLog;
    default: return undefined;
  }
}

// _syncReadActiveTab — single point of truth for the active-tab key shape
// consumed by SYNC_RENDER_DEPS.renderers. Returns 'home' | 'growth' |
// 'track:<sub>' | 'history' | 'insights' | 'info' | null. Mirrors the
// idiom at intelligence.js:10773 + core.js:2620 (track sub-tab dispatch).
function _syncReadActiveTab() {
  if (typeof PANEL_IDS === 'undefined' || typeof document === 'undefined') return null;
  var top = null;
  for (var i = 0; i < PANEL_IDS.length; i++) {
    var el = document.getElementById('tab-' + PANEL_IDS[i]);
    if (el && el.classList.contains('active')) { top = PANEL_IDS[i]; break; }
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
//
// PR-19 (Phase 3 R2 amendment) — toast pipeline repurposed as status-strip
// activity-mode driver per Surface C ratification. The transient-toast
// surface was insufficient (cross-device collaborators miss fires they
// don't witness); the permanent surfaces are (1) lastWriters sidecar
// persisted via _syncRecordLastWriter, and (2) status-strip activity-mode
// pill via _syncSetActivity. Toast pipeline (_syncQueueToast → 1500ms
// debounce → _syncComposeToastText) drives the activity-mode update.
// _syncShowSyncToast is dormant — see its function header for full framing.
//
// Hotfix (post-PR-9) — Issue 1 root cause: dispatch crashes formerly used
// _syncRecordCrash, which increments _syncCrashCount toward SYNC_CRASH_LIMIT
// and trips _syncDisabled = true at 3 crashes. That conflates UI render
// jurisdiction with sync (Firestore I/O) jurisdiction — a renderer bug is
// not a reason to halt sync and lose all listener fires (which manifested
// in production as "no toast on cross-device update"). Now: dispatch
// failures log via console.warn only, leaving the production circuit
// breaker reserved for actual sync I/O failures.
function _syncDispatchRender(lsKey, value, attribution) {
  var dep = SYNC_RENDER_DEPS[lsKey];
  if (!dep) return attribution || null; // no UI dependency mapped — silent OK
  // (1) Rehydrate module global (Finding B + E fix)
  if (dep.global) {
    try { _syncSetGlobal(dep.global, value); }
    catch(e) { console.warn('[sync-dispatch] set-global ' + lsKey + ':', e); }
  }
  // (1.5) Post-receive hook (PR-β r2). Optional name-string in dep.postReceive
  //       resolved via window[name] (same pattern as renderers — spy/stub
  //       friendly, graceful runtime fallback). Use case: data migrations
  //       (legacy enum repair) + integrity passes (dedupe by text) that need
  //       to run AFTER the listener saved the raw remote value but BEFORE
  //       renderers see it. The hook may save() the cleaned value, which
  //       triggers autosave back to Firestore so cross-device sync converges
  //       on the cleaned state.
  if (dep.postReceive) {
    try {
      var hook = (typeof window !== 'undefined') ? window[dep.postReceive] : undefined;
      if (typeof hook === 'function') hook();
    } catch(e) { console.warn('[sync-dispatch] post-receive ' + lsKey + '/' + dep.postReceive + ':', e); }
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
      } catch(e) { console.warn('[sync-dispatch] render ' + lsKey + '/' + names[i] + ':', e); }
    }
  }
  return attribution || null;
}

// ─────────────────────────────────────────────────────────────────────────
// milestone-engine-prep-v1 PR-A — cross-device merge-on-receive hooks
// (V-M-116 + V-K-111 floors). Pure functions: (remoteMap, localMap) → merged.
// Invoked by the listener handler BEFORE save (sync.js:1568+) so cross-device
// per-key state on both sides survives last-write-wins on single-doc shapes.
//
// Pattern: timestamp-max-per-key merge + auto-purge of expired entries (for
// the suppress map). The same shape applies to activityMeta — there, per-day
// objects merge field-by-field with last-write-wins on each scalar field.
// ─────────────────────────────────────────────────────────────────────────

// _postReceiveMilestoneSuppress — V-K-104 + V-M-116 hard contract.
// Merges remoteMap and localMap by max-timestamp per milestoneKey. Auto-
// purges entries whose suppress-until is in the past (the "Not yet" 7-day
// silence honor). Idempotent + associative.
function _postReceiveMilestoneSuppress(remoteMap, localMap) {
  var rm = (remoteMap && typeof remoteMap === 'object' && !Array.isArray(remoteMap)) ? remoteMap : {};
  var lm = (localMap  && typeof localMap  === 'object' && !Array.isArray(localMap))  ? localMap  : {};
  var merged = {};
  // Seed with local entries.
  Object.keys(lm).forEach(function(k) {
    if (typeof lm[k] === 'number') merged[k] = lm[k];
  });
  // Fold remote — keep whichever side suppressed LATER (max ts wins).
  Object.keys(rm).forEach(function(k) {
    var rTs = (typeof rm[k] === 'number') ? rm[k] : 0;
    var lTs = (typeof merged[k] === 'number') ? merged[k] : 0;
    if (rTs > lTs) merged[k] = rTs;
  });
  // Purge expired entries — auto-cleanup pass on every receive.
  var now = Date.now();
  Object.keys(merged).forEach(function(k) {
    if (merged[k] <= now) delete merged[k];
  });
  return merged;
}

// _postReceiveTeeth — tooth-chart merge. Shape { [toothId]: { date, ts } };
// per tooth the entry with the newer ts wins, so a removal (date:null) made
// after a remote eruption date survives, and vice versa. Malformed entries drop.
function _postReceiveTeeth(remoteMap, localMap) {
  var rm = (remoteMap && typeof remoteMap === 'object' && !Array.isArray(remoteMap)) ? remoteMap : {};
  var lm = (localMap  && typeof localMap  === 'object' && !Array.isArray(localMap))  ? localMap  : {};
  var ok = function(k, v) {
    return /^[A-T]$/.test(k) && v && typeof v === 'object' && typeof v.ts === 'number' && isFinite(v.ts) &&
      (v.date === null || (typeof v.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.date)));
  };
  var merged = {};
  Object.keys(lm).forEach(function(k) { if (ok(k, lm[k])) merged[k] = lm[k]; });
  Object.keys(rm).forEach(function(k) {
    if (!ok(k, rm[k])) return;
    if (!merged[k] || rm[k].ts > merged[k].ts) merged[k] = rm[k];
  });
  return merged;
}

// _postReceiveActivityMeta — V-K-111 + V-M-116 hard contract.
// Single-doc shape: { [dateKey]: { activityLevel: 1-4 } }. Merges per-dateKey
// per-field with last-write-wins on the scalar level. Because the doc shape
// has no inline timestamps, the merge uses "remote-wins on conflict, both-
// sides-preserved on no-conflict" semantics — this matches what the parent
// expects: a tag set on one device shows up on the other; clearing on one
// device doesn't resurrect from the other.
function _postReceiveActivityMeta(remoteMap, localMap) {
  var rm = (remoteMap && typeof remoteMap === 'object' && !Array.isArray(remoteMap)) ? remoteMap : {};
  var lm = (localMap  && typeof localMap  === 'object' && !Array.isArray(localMap))  ? localMap  : {};
  var merged = {};
  // Seed with local per-dateKey objects (deep-copy field set).
  Object.keys(lm).forEach(function(dk) {
    var d = lm[dk];
    if (d && typeof d === 'object' && !Array.isArray(d)) {
      merged[dk] = {};
      Object.keys(d).forEach(function(f) { merged[dk][f] = d[f]; });
    }
  });
  // Fold remote — remote-wins on scalar conflict; both sides preserved otherwise.
  Object.keys(rm).forEach(function(dk) {
    var rDay = rm[dk];
    if (!rDay || typeof rDay !== 'object' || Array.isArray(rDay)) return;
    if (!merged[dk]) merged[dk] = {};
    Object.keys(rDay).forEach(function(f) { merged[dk][f] = rDay[f]; });
  });
  return merged;
}

// _syncRecordLastWriter — PR-19 (Phase 3 R2 amendment) — persistent
// attribution sidecar. Called from listener handlers AFTER a successful
// per-key save. Writes to KEYS.lastWriters localStorage map; key is the
// affected lsKey, value carries { uid, name, at } where `at` is local
// receive-time (Date.now() ms). Sidecar is local-only metadata — never
// roundtripped to Firestore (KEYS.lastWriters is NOT in SYNC_KEYS, so
// syncWrite returns early in its `if (!SYNC_KEYS[key]) return` guard).
// Wrapped in _remoteWriteDepth++ so triggerAutosave is suppressed (the
// sidecar update should not itself drive autosave noise).
function _syncRecordLastWriter(lsKey, attribution) {
  if (!attribution) return;
  if (typeof KEYS === 'undefined' || !KEYS.lastWriters) return;
  _remoteWriteDepth++;
  try {
    var lw = load(KEYS.lastWriters, {}) || {};
    if (typeof lw !== 'object' || Array.isArray(lw)) lw = {};
    lw[lsKey] = {
      uid:  attribution.uid || null,
      name: attribution.name || null,
      at:   Date.now(),  // local receive-time; Firestore Timestamp doesn't roundtrip cleanly
    };
    save(KEYS.lastWriters, lw);
  } catch(e) { console.warn('[sync-attribution] record ' + lsKey + ':', e); }
  finally { _remoteWriteDepth--; }
}

// _syncSetActivity — PR-19 (Phase 3 R2 amendment) — Surface C activity-mode
// driver. Called from the toast-pipeline debounce body after a remote fire
// burst. Writes the message text into the #syncActivity pill, removes its
// [hidden] attribute (transitioning the strip from state-mode to
// activity-mode), and starts a 45s timer that re-hides the pill on expiry.
// The strip's #syncStatus indicator is unaffected — both can be visible
// simultaneously during activity mode (mode contract: BOTH-visible during
// activity; ONLY #syncStatus during state).
//
// Self-replacing timer: if a new fire burst arrives during the 45s window,
// the previous timer is cleared and the new text + 45s window replaces it.
// This keeps the activity readable during sustained cross-device co-editing.
var _syncActivityHideTimer = null;
var _syncActivityWindowMs = 45000; // 45s — between Aurelius's 30s/60s suggested band
function _syncSetActivity(text, attribution) {
  if (typeof document === 'undefined') return;
  var el = document.getElementById('syncActivity');
  if (!el) return; // graceful no-op if template hasn't loaded the strip
  el.textContent = text || '';
  if (attribution && attribution.uid) {
    el.setAttribute('data-attribution-uid', attribution.uid);
  } else {
    el.removeAttribute('data-attribution-uid');
  }
  el.removeAttribute('hidden');
  // V-V-2 / V-M-1: announce via the persistent #a11yLive region (the pill is
  // visual-only now — it toggles via [hidden], so its own aria-live was unreliable).
  if (text && typeof _a11yAnnounce === 'function') _a11yAnnounce(text);
  if (_syncActivityHideTimer) clearTimeout(_syncActivityHideTimer);
  _syncActivityHideTimer = setTimeout(function() {
    if (el.parentNode) el.setAttribute('hidden', '');
    _syncActivityHideTimer = null;
  }, _syncActivityWindowMs);
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
    // Data stays local; next sign-in re-seeds (admin) or takes the household copy (member).
    // Writes made while signed out are not ledgered (the ledger needs the seeded flag).
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
// Role of `uid` in the household currently loaded into _syncHousehold.
function _syncRoleFor(uid) {
  return (_syncHousehold && _syncHousehold.members && _syncHousehold.members[uid])
    ? (_syncHousehold.members[uid].role || 'member') : 'member';
}

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
            var _myRole = _syncRoleFor(uid);   // was `user.uid` — a ReferenceError that killed attach on every launch (Kael F3)
            if (_myRole === 'admin') {
              _syncSeedFirestore(_syncHouseholdId).then(function() {
                localStorage.setItem('sl_sync_seeded', '4');
                _syncSaveDirty({});   // ledger: the seed just pushed every non-empty key
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
              // Member: skip seed, just bump version and attach listeners. On a
              // device that has attached before (signed out and back in), the ledger
              // holds real household writes → push them first (Kael F18). On a true
              // first attach, whatever it wrote before is not household data (same
              // rule as syncJoinByCode): drop the ledger.
              localStorage.setItem('sl_sync_seeded', '4');
              if (_syncAttachedOnce()) {
                _syncPushDirtyThenAttach(_syncHouseholdId);
              } else {
                _syncSaveDirty({});
                _syncAttachListeners(_syncHouseholdId);
              }
            }
          } else {
            // Already-attached device (PR #265): push anything the cloud never
            // acknowledged BEFORE listeners can apply a stale cloud copy over it.
            _syncPushDirtyThenAttach(_syncHouseholdId);
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
      _syncSaveDirty({});   // ledger: the seed just pushed every non-empty key
      _syncAttachListeners(_syncHouseholdId);
    }).catch(function(e) {
      // Seed failed: the flag stays unset so the next launch re-seeds; attach so
      // the household is at least readable meanwhile.
      _syncRecordCrash('seed', e);
      if (!_syncDisabled) { try { _syncAttachListeners(_syncHouseholdId); } catch(e2) { _syncRecordCrash('attachListeners-after-seed-fail', e2); } }
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
        // Joining device does NOT seed — data comes from admin's seed via listeners.
        // Same rule for the ledger: whatever was written on this device before it
        // joined must not clobber the household, so drop it before attaching.
        localStorage.setItem('sl_sync_seeded', '4');
        _syncSaveDirty({});
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
  // V-K-23 disposition (PR-C sync-discipline cycle) — V-K-8's defensive-parse
  // regex catches `\bdelete\b` in the last-member message and flips the
  // confirm button from sky Confirm → rose Delete, which correctly matches
  // the destructive verb on disk (_syncDeleteHouseholdDoc below). The
  // closing "Continue?" question was sky-Confirm-era softener; under rose
  // Delete the button itself is the answer prompt, so the close-line is
  // dropped for tonal consistency. Multi-member message stays Confirm-toned
  // and unchanged.
  var msg = memberCount <= 1
    ? 'You are the last member. Leaving will delete all synced data permanently.'
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
// Issue #53 — inspection getter (top-level `let` is not a window property, so
// expose the live generation for guards/tests via a hoisted function).
function _syncListenerGenNow() { return _syncListenerGen; }

function _syncDetachListeners() {
  // Issue #53 — invalidate any snapshot callbacks already queued from the
  // generation being torn down. Bump BEFORE unsub() so a straggler that fires
  // synchronously during teardown is already stale.
  _syncListenerGen++;
  _syncListenerUnsubs.forEach(function(unsub) { unsub(); });
  _syncListenerUnsubs = [];
  // C0 Fix 5 (Kael): reset listener-ready state so next attach re-earns
  // confirmation. Without this, a re-attach cycle would flush immediately
  // with the previous session's stale shadow.
  _syncReady = {};
  // #53 (Kael audit): clearing the ready-fallback timers here is what protects
  // the _syncArmReadyFallback path — its setTimeout callback is NOT generation-
  // guarded (it touches flush-readiness state, not the snapshot-apply path), so
  // this clear-on-detach is load-bearing. Do not remove assuming _gen covers it.
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
    if (_remoteWriteDepth > 0) return;          // don't echo back remote writes
    if (!SYNC_KEYS[key]) return;                // local-only key
    if (_syncSameValue(old, val)) return;       // no-op re-save (render paths re-save on boot) — nothing to sync (Ceres F1)
    _syncMarkDirty(key);                        // ledger: unsynced until the server acks (PR #265)
    // A bail-out below IS a failed push: a per-entry delta dropped here is never
    // carried by the next call's old→new diff, so the key must wait for a full
    // push (Cipher A2). Single-doc keys are covered either way (cumulative shadow).
    if (_syncDisabled)     { _syncMarkNeedsFull(key); return; }   // Layer 4: auto-disabled after crashes
    if (!_syncHouseholdId) { _syncMarkNeedsFull(key); return; }   // no household
    if (!_syncUser)        { _syncMarkNeedsFull(key); return; }   // not signed in

    // Circuit breaker (§4.7 #48)
    if (_syncWriteCount >= CIRCUIT_BREAKER_LIMIT) {
      console.warn('[sync] Circuit breaker tripped — ' + _syncWriteCount + ' writes this hour');
      _syncMarkNeedsFull(key);
      if (typeof _syncNotifyVisibility === 'function') _syncNotifyVisibility();   // the ledger keeps the write; surface it
      return;
    }
    _syncCountWrites(1);

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
function _syncSameValue(a, b) {
  try { return JSON.stringify(a) === JSON.stringify(b); } catch(e) { return false; }
}
// Hourly write counter shared by the debounce path and the ledger's full push;
// arms the reset once and surfaces the breaker trip to the visibility store (Kael F7).
function _syncCountWrites(n) {
  _syncWriteCount += (n || 1);
  if (!_syncWriteCountReset) {
    _syncWriteCountReset = setTimeout(function() {
      _syncWriteCount = 0;
      _syncWriteCountReset = null;
      if (typeof _syncNotifyVisibility === 'function') _syncNotifyVisibility();
    }, 3600000); // 1 hour
  }
  if (_syncWriteCount >= CIRCUIT_BREAKER_LIMIT && typeof _syncNotifyVisibility === 'function') _syncNotifyVisibility();
}
function _syncServerTs() {
  return (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue)
    ? firebase.firestore.FieldValue.serverTimestamp() : Date.now();
}

function _syncWritePerEntry(hRef, collection, key, oldVal, newVal) {
  var diff = _syncDiffArray(oldVal, newVal);
  var colRef = hRef.collection(collection);
  var syncMeta = {
    __sync_updatedBy: { uid: _syncUser.uid, name: _syncUser.displayName || 'Parent' },
    __sync_syncedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  var startedAt = Date.now();
  var ops = [];   // raw promises (before .catch) so Promise.all sees real failures

  // Added entries
  diff.added.forEach(function(entry) {
    var data = Object.assign({}, entry, syncMeta, {
      __sync_createdBy: { uid: _syncUser.uid, name: _syncUser.displayName || 'Parent' }
    });
    var p = colRef.doc(entry.id).set(data);
    ops.push(p);
    p.catch(function(e) {
      console.error('[sync] Add ' + collection + '/' + entry.id + ' failed:', e);
    });
  });

  // Edited entries — field-level updates
  diff.edited.forEach(function(change) {
    var payload = Object.assign({}, change.updates, change.deletes, syncMeta);
    var p = colRef.doc(change.id).update(payload);
    ops.push(p);
    p.catch(function(e) {
      console.error('[sync] Update ' + collection + '/' + change.id + ' failed:', e);
    });
  });

  // Deleted entries
  diff.deleted.forEach(function(id) {
    var p = colRef.doc(id).delete();
    ops.push(p);
    p.catch(function(e) {
      console.error('[sync] Delete ' + collection + '/' + id + ' failed:', e);
    });
  });

  // Ledger (PR #265): this session's writes to `key` are acknowledged once every op lands.
  Promise.all(ops).then(function() {
    _syncClearDirty([key], startedAt, _syncSessionAttachedAt);
  }).catch(function() {
    _syncMarkNeedsFull(key);   // logged per-op above; only a full push may clear it now (Kael F2)
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

// _syncStampUnattributed — PR-19.5 (per-entry attribution). At flush time,
// walk each array-shape value and stamp entries lacking __sync_updatedBy
// with the current writer's attribution. The stamp travels to Firestore
// and echoes back via the listener to all devices (including the writer's
// own device, where it lands in localStorage on echo and is picked up by
// _syncDispatchRender's rehydrate). Per-entry attribution is the data-shape
// change (vs. PR-19's per-key sidecar) the Sovereign-side production
// verification surfaced as missing on the history-tab surface.
//
// Scope (PR-19.5 baseline): array-shape values (growth, sleep, poop, vacc,
// meds, visits, milestones, notes, doctors, episodes, careTickets).
//
// PR-α r1 hotfix (Stability sub-phase 2 post-merge Sovereign-floor catch):
// extended to also walk object-keyed shapes whose VALUES are entry-arrays —
// activityLog (`{ dateStr: [entry, entry, ...] }`). This closes the gap
// where PR-α wired _renderAttribution(e) into renderRecentEvidence but
// entries never carried the __sync_updatedBy stamp. feeding (`{ dateStr:
// { meal: '...' } }`) and medChecks (`{ dateStr: { medname: 'status' } }`)
// have non-array values and remain Phase 4 carry-forward — the wrapper-
// shape decision for those affects every renderer reading those fields.
function _syncStampUnattributed(value, writer) {
  if (!writer || (!writer.uid && !writer.name)) return value;

  // Array-shape: stamp each entry directly (PR-19.5 baseline)
  if (Array.isArray(value)) {
    var changed = false;
    var stamped = value.map(function(entry) {
      if (entry && typeof entry === 'object' && !Array.isArray(entry) && !entry.__sync_updatedBy) {
        changed = true;
        return Object.assign({}, entry, {
          __sync_updatedBy: { uid: writer.uid || null, name: writer.name || null },
        });
      }
      return entry;
    });
    return changed ? stamped : value;
  }

  // Object-keyed shape with entry-array values (PR-α r1 hotfix; activityLog).
  // Walks each top-level key whose value is an array; stamps each entry
  // lacking __sync_updatedBy. Non-array values (feeding/medChecks shape)
  // are passed through untouched — those shapes need a wrapper-level
  // attribution decision and remain deferred.
  if (value && typeof value === 'object') {
    var anyChanged = false;
    var out = {};
    Object.keys(value).forEach(function(k) {
      var v = value[k];
      if (Array.isArray(v)) {
        var subChanged = false;
        var subStamped = v.map(function(entry) {
          if (entry && typeof entry === 'object' && !Array.isArray(entry) && !entry.__sync_updatedBy) {
            subChanged = true;
            return Object.assign({}, entry, {
              __sync_updatedBy: { uid: writer.uid || null, name: writer.name || null },
            });
          }
          return entry;
        });
        if (subChanged) anyChanged = true;
        out[k] = subChanged ? subStamped : v;
      } else {
        out[k] = v;
      }
    });
    return anyChanged ? out : value;
  }

  return value;
}

function _syncFlushSingleDoc(hRef, collection) {
  // Gather all localStorage KEYS that map to this collection
  var keysForCol = _syncCollectionToKeys[collection];
  if (!keysForCol || keysForCol.length === 0) return;
  var startedAt = Date.now();

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

  // PR-19.5 (per-entry attribution) — stamp un-attributed array entries
  // with the current writer's identity before computing the diff. New
  // local entries (lacking the stamp) thereby travel to Firestore with
  // attribution; existing stamped entries (from prior remote writes or
  // prior local stamps) are preserved. The stamp echoes back via the
  // listener and lands in localStorage during the standard receive path,
  // closing the loop without writing-back into localStorage from this
  // function (which would be a layer-violation; flush operates on the
  // outbound side, the listener handles the inbound side).
  var writer = _syncUser ? {
    uid:  _syncUser.uid || null,
    name: _syncUser.displayName || 'Parent',
  } : null;
  if (writer) {
    for (var si = 0; si < keysForCol.length; si++) {
      var sk = keysForCol[si];
      current[sk] = _syncStampUnattributed(current[sk], writer);
    }
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
  if (!hasUpdates && !hasDeletes) {
    // Net-empty (e.g. add then Undo inside the debounce): content equals the shadow,
    // which is the last pushed/observed state — release this session's entries so
    // the [L] guard does not hide the other phone's data for a no-op (Kael F15).
    _syncClearDirty(keysForCol, startedAt, _syncSessionAttachedAt);
    return;
  }

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

  Promise.all(promises).then(function() {
    // Ledger (PR #265): only writes made in THIS session are proven pushed by a
    // diff-vs-shadow flush; pre-attach writes are cleared solely by _syncFlushDirty.
    _syncClearDirty(keysForCol, startedAt, _syncSessionAttachedAt);
  }).catch(function(e) {
    console.error('[sync] Single-doc write ' + collection + ' failed:', e);
    // The shadow below already absorbed this content, so no later diff will carry
    // it: flag every key of the collection for a full push (Kael F2).
    keysForCol.forEach(_syncMarkNeedsFull);
  });

  // Update shadow to current
  for (var k = 0; k < keysForCol.length; k++) {
    _syncShadow[keysForCol[k]] = _syncCloneDeep(current[keysForCol[k]]);
  }
}

// ─── Full push of unsynced keys (PR #265) ───
// Pushes every dirty key's CURRENT local value, merged against the SERVER copy so
// a recovering phone never erases what the other parent logged meanwhile
// (Kael F5 / Ceres F1 / Maren F4): the singles doc is read with source:'server'
// (a cache-served read would be the stale copy this exists to defeat — Kael F14)
// and every array is unioned by a per-key entry identity (local wins on the same
// entry; cloud-only entries are kept — Kael F13), nested maps union server-side
// via set(merge:true). A null single is pushed as null (parity with the partial
// path — Kael F16). Per-entry keys go up as batched full-record sets. Resolves
// with the number of keys pushed once the server acknowledges; rejects with the
// ledger untouched if the read or any write fails. A write that lands mid-push
// triggers one bounded re-pass (Kael F17). `db` is derived from hRef so the
// hermetic spec can drive this with a stub.
const SYNC_ENTRY_IDENTITY = {
  [KEYS.sleep]:   ['date', 'type', 'bedtime'],
  [KEYS.poop]:    ['date', 'time'],
  [KEYS.vacc]:    ['name', 'date'],
  [KEYS.foods]:   ['name'],
  [KEYS.visits]:  ['date', 'doctor', 'reason'],
  [KEYS.notes]:   ['ts'],
  [KEYS.growth]:  ['date'],
  [KEYS.meds]:    ['name', 'start'],
  [KEYS.doctors]: ['name']
};
function _syncStableJson(v) {
  if (Array.isArray(v)) return '[' + v.map(_syncStableJson).join(',') + ']';
  if (v && typeof v === 'object') {
    return '{' + Object.keys(v).filter(function(k) { return k.indexOf('__sync_') !== 0; }).sort().map(function(k) {
      return JSON.stringify(k) + ':' + _syncStableJson(v[k]);
    }).join(',') + '}';
  }
  return JSON.stringify(v);
}
function _syncEntryIdentity(entry, key) {
  if (!entry || typeof entry !== 'object') return 'v:' + _syncStableJson(entry);
  var fields = SYNC_ENTRY_IDENTITY[key];
  if (fields) {
    var parts = [];
    fields.forEach(function(f) { if (entry[f] !== undefined && entry[f] !== null && entry[f] !== '') parts.push(f + '=' + String(entry[f]).toLowerCase().trim()); });
    if (parts.length > 0) return 'k:' + parts.join('|');
  }
  if (entry.id !== undefined && entry.id !== null) return 'id:' + entry.id;
  return 'v:' + _syncStableJson(entry);
}
function _syncUnionArrays(local, cloud, key) {
  var seen = {};
  var out = [];
  (local || []).forEach(function(e) { seen[_syncEntryIdentity(e, key)] = true; out.push(e); });
  (cloud || []).forEach(function(e) { var id = _syncEntryIdentity(e, key); if (!seen[id]) { seen[id] = true; out.push(e); } });
  return out;
}
function _syncMergeForPush(local, cloud, key) {
  // Tooth chart: the push honours the same per-tooth newest-ts contract as the
  // receive, so an offline or imported copy can't overwrite a newer cloud edit.
  if (key === KEYS.teeth && typeof _postReceiveTeeth === 'function') return _postReceiveTeeth(cloud, local);
  if (Array.isArray(local)) return Array.isArray(cloud) ? _syncUnionArrays(local, cloud, key) : local;
  if (local && typeof local === 'object' && cloud && typeof cloud === 'object' && !Array.isArray(cloud)) {
    var out = {};
    Object.keys(local).forEach(function(k) {
      out[k] = (Array.isArray(local[k]) && Array.isArray(cloud[k])) ? _syncUnionArrays(local[k], cloud[k], key) : local[k];
    });
    return out;   // cloud-only keys survive server-side under merge:true
  }
  return local;
}
function _syncFlushDirty(hRef, _pass) {
  var m = _syncLoadDirty();
  var dirtyKeys = Object.keys(m).filter(function(k) { return !!SYNC_KEYS[k]; });
  if (dirtyKeys.length === 0) return Promise.resolve(0);
  if (!_syncUser || !hRef) return Promise.reject(new Error('not signed in'));
  var startedAt = Date.now();
  var db = hRef.firestore || ((typeof firebase !== 'undefined') ? firebase.firestore() : null);
  var writer = { uid: _syncUser.uid || null, name: _syncUser.displayName || 'Parent' };
  var settled = [];        // per-entry keys with an empty local array — nothing to push
  var perEntry = [];
  var singlesByCol = {};

  dirtyKeys.forEach(function(key) {
    var cfg = SYNC_KEYS[key];
    var val = load(key, null);
    if (cfg.model === 'per-entry') {
      if (!Array.isArray(val) || val.length === 0) settled.push(key);
      else perEntry.push({ key: key, cfg: cfg, val: val });
      return;
    }
    if (!singlesByCol[cfg.collection]) singlesByCol[cfg.collection] = {};
    singlesByCol[cfg.collection][key] = (val === undefined) ? null : val;   // null is a value (un-booking) — push it
  });
  if (settled.length > 0) _syncClearDirty(settled, startedAt, 0, true);

  var cols = Object.keys(singlesByCol);
  return Promise.all(cols.map(function(col) { return hRef.collection('singles').doc(col).get({ source: 'server' }); }))
    .then(function(docs) {
      var promises = [];
      cols.forEach(function(col, i) {
        var cloud = (docs[i] && docs[i].exists) ? (docs[i].data() || {}) : {};
        var payload = {};
        Object.keys(singlesByCol[col]).forEach(function(key) {
          var merged = _syncMergeForPush(singlesByCol[col][key], cloud[key], key);
          payload[key] = (merged === null) ? null : _syncStampUnattributed(merged, writer);
        });
        payload.__sync_updatedBy = writer;
        payload.__sync_syncedAt = _syncServerTs();
        promises.push(hRef.collection('singles').doc(col).set(payload, { merge: true }));
      });
      perEntry.forEach(function(pe) {
        for (var i = 0; i < pe.val.length; i += 450) {
          var chunk = pe.val.slice(i, i + 450);
          var batch = db.batch();
          chunk.forEach(function(entry) {
            if (!entry || !entry.id) return;
            batch.set(hRef.collection(pe.cfg.collection).doc(entry.id), Object.assign({}, entry, {
              __sync_updatedBy: writer,
              __sync_syncedAt: _syncServerTs()
            }), { merge: false });
          });
          promises.push(batch.commit());
        }
      });
      _syncCountWrites(promises.length);   // bypasses the breaker on purpose: this is the recovery path
      return Promise.all(promises);
    })
    .then(function() {
      _syncClearDirty(dirtyKeys, startedAt);
      // A write that landed mid-push kept its entry (l > startedAt) with a first
      // stamp no diff can ever clear — push once more, bounded (Kael F17).
      var after = _syncLoadDirty();
      var late = dirtyKeys.some(function(k) { var e = _syncLedgerEntry(after[k]); return !!(e && e.f <= startedAt); });
      if (late && (_pass || 0) < 2) {
        return _syncFlushDirty(hRef, (_pass || 0) + 1).then(function(n2) { return dirtyKeys.length + n2; });
      }
      return dirtyKeys.length;
    });
}

// Push unsynced local writes, THEN attach listeners — so a stale cloud copy can
// never be applied over newer local data. On push failure the ledger is kept and
// listeners still attach: dirty keys stay protected by the snapshot-apply guard.
function _syncPushDirtyThenAttach(hId) {
  var p;
  try {
    var hRef = firebase.firestore().collection('households').doc(hId);
    p = _syncFlushDirty(hRef);
  } catch(e) { p = Promise.reject(e); }
  // Bound the wait: offline-with-cache would queue the set() indefinitely and
  // listeners would never attach. Past the timeout we attach anyway — dirty keys
  // stay guarded, and the push clears the ledger (and replays) whenever it lands.
  var waitMs = (typeof _syncReconcileFallbackMs === 'function') ? _syncReconcileFallbackMs() : 15000;
  var bounded = Promise.race([p, new Promise(function(res) { setTimeout(function() { res('timeout'); }, waitMs); })]);
  p.catch(function(e) { console.error('[sync] Unsynced push before attach failed — ledger kept, dirty keys protected:', e); });
  return bounded.then(function(n) {
    if (n === 'timeout') console.warn('[sync] Unsynced push still in flight after ' + waitMs + 'ms — attaching; dirty keys stay guarded');
    else if (n > 0) console.log('[sync] Pushed ' + n + ' unsynced key(s) before attaching listeners');
  }).catch(function() {}).then(function() {
    try { _syncAttachListeners(hId); }
    catch(e) { _syncRecordCrash('attachListeners', e); return; }
    // Residual pass (Kael F8): a write that landed between the ledger read above
    // and the attach stamp was folded into the shadow and would never be diffed —
    // push the ledger once more, post-attach, under the same merge semantics.
    var m = _syncLoadDirty();
    var residual = Object.keys(m).some(function(k) {
      var e = _syncLedgerEntry(m[k]); return !!(e && SYNC_KEYS[k] && e.f < _syncSessionAttachedAt);   // un-clearable by any diff
    });
    if (residual) {
      try {
        var hRef2 = firebase.firestore().collection('households').doc(hId);
        _syncFlushDirty(hRef2).catch(function(e) { console.warn('[sync] Residual unsynced push failed — ledger kept:', e); });
      } catch(e) { console.warn('[sync] Residual unsynced push threw:', e); }
    }
  });
}

// Header / settings "Retry" action for the stale state (data-action="syncRetryPush").
var _syncRetryInFlight = false;
function syncRetryPush() {
  if (!_syncUser || !_syncHouseholdId || typeof firebase === 'undefined') {
    showQLToast('Sign in to sync');
    return;
  }
  if (_syncRetryInFlight) return;   // repeat taps would only add reads/writes to the hourly count (Kael F21)
  _syncRetryInFlight = true;
  var hRef = firebase.firestore().collection('households').doc(_syncHouseholdId);
  showQLToast('Syncing…');
  _syncFlushDirty(hRef).then(function(n) {
    showQLToast(n > 0 ? '' + zi('check') + ' Synced — everything on this phone is now in the cloud' : 'Already synced');
    _syncRenderSettingsUI();
  }).catch(function(e) {
    console.error('[sync] Retry push failed:', e);
    showQLToast('Still could not reach the cloud — your entries are safe on this phone', 4000);
  }).then(function() { _syncRetryInFlight = false; });
}

// ─── Attach Listeners (§7.3) ───
function _syncAttachListeners(hId) {
  _syncDetachListeners();
  // PR-ε.0 §6.2(d) — reset reconcile gate AFTER detach (Kael v4 MAJOR).
  // Pre-detach reset would let in-flight microtask-queued snapshot
  // callbacks re-attempt reconcile against stale state. Issue #53
  // tracks the broader straggler limitation; this reset only protects
  // reconcile re-fire, not snapshot-apply.
  _reconcileDone = new Set();
  _syncSessionAttachedAt = Date.now();   // ledger: partial flushes may clear writes from here on
  try { localStorage.setItem(SYNC_ATTACHED_KEY, '1'); } catch(e) {}
  // Issue #53 — capture the generation these listeners belong to. _syncDetachListeners()
  // (called just above, and on any future re-attach) bumps _syncListenerGen; each
  // callback below bails if its captured _gen no longer matches the live one, so a
  // straggler snapshot queued before detach cannot apply stale state.
  var _gen = _syncListenerGen;
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
      if (_gen !== _syncListenerGen) return;   // #53: straggler from a detached generation — do not apply
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
      if (_gen !== _syncListenerGen) return;   // #53: straggler from a detached generation — do not apply
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
    if (_gen !== _syncListenerGen) return;   // #53: straggler from a detached generation — do not apply
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

    // Ledger guard (PR #265): see [L] in _syncHandleSingleDocSnapshot.
    if (_syncIsDirty(lsKey)) {
      console.warn('[sync] Skipping overwrite of ' + lsKey + ' — local changes not yet acknowledged by the cloud');
      _syncSkippedSnapshots['pe:' + collection] = { gen: _syncListenerGen, snapshot: snapshot };
      return;
    }

    // Build full array from Firestore snapshot
    var entries = [];
    snapshot.forEach(function(doc) {
      var data = doc.data();
      // PR-19.5 (per-entry attribution) — preserve __sync_updatedBy and
      // __sync_syncedAt on each entry so the history-tab renderer can show
      // "by Bhavna" per row. Strip the rest of __sync_* (e.g. __sync_createdBy
      // is duplicative for our needs at this scope; can be added later).
      // Parallel to single-doc handler at the snapshot strip below; Cipher #4
      // cross-reference. The non-stripped attribution survives roundtrips
      // (next flush's set+merge writes a fresh __sync_updatedBy at doc/entry
      // level; Firestore overwrites cleanly).
      var clean = {};
      var keys = Object.keys(data);
      for (var j = 0; j < keys.length; j++) {
        var k = keys[j];
        if (k.indexOf('__sync_') !== 0 || k === '__sync_updatedBy' || k === '__sync_syncedAt') {
          clean[k] = data[k];
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
    // PR-ε.0 §6.2(c) Kael synthesis MINOR: byte-identical-snapshot
    // short-circuit deliberately precedes the reconcile gate below.
    // When current === entries by string equality, the orphan diff would
    // be empty by definition (same id-set); skipping reconcile loses
    // nothing. Side effect: _reconcileDone.add fires only on a non-
    // identical snapshot — the gate stays open until then. Acceptable
    // because the next non-identical snapshot redoes a no-cost diff scan.
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

    // ── PR-ε.0 §6.2(c) reconcile gate (fires once per collection per session) ──
    // Folds Cipher BLOCKER #4 (per-entry listener wiped local entries that
    // pre-existed before the household joined) + Kael v5 MAJORs (concat-
    // before-branching, gate-add-on-success-only, stamp-trio parity).
    //
    // Placement (Kael synthesis MINOR): this block sits AFTER the empty-
    // snapshot guard above. Spec §6.2(c) accepts the trade-off — an
    // empty-remote / non-empty-local first fire does NOT push orphans via
    // reconcile; the next local-mutation diff push handles them. Reordering
    // to put reconcile BEFORE the empty-snapshot guard would push orphans
    // on every empty-remote snapshot, which is the wrong default for the
    // SAFETY (c13a7de) skip the guard implements.
    if (!_reconcileDone.has(collection)) {
      var remoteIds = new Set();
      entries.forEach(function(re) { if (re && re.id) remoteIds.add(re.id); });
      var orphanLocals = (current || []).filter(function(le) {
        return le && le.id && !remoteIds.has(le.id);
      });

      if (orphanLocals.length > 0) {
        // INVARIANT 1 (Kael v5 §6.2 MAJOR): orphans concat into `entries`
        // IMMEDIATELY, BEFORE any breaker/push branching. Survives the
        // wholesale save(lsKey, entries) below regardless of push outcome.
        entries = entries.concat(orphanLocals);

        if ((_syncWriteCount + orphanLocals.length) > CIRCUIT_BREAKER_LIMIT) {
          // INVARIANT 2 (Kael v5 §6.2(c) MAJOR): bail path.
          //   - Skip remote set() calls.
          //   - Local entries already concat'd above (survive).
          //   - Do NOT add to _reconcileDone — gate stays OPEN for retry
          //     on next sync re-attach (§6.2(d) clears the gate).
          console.warn('[sync] reconcile would exceed circuit breaker; deferring push',
                       collection, orphanLocals.length);
          // fall through to existing save(lsKey, entries) below
        } else {
          // Push path — write each orphan to Firestore with full stamp trio.
          var _hRef = firebase.firestore().collection('households').doc(_syncHouseholdId);
          var colRef = _hRef.collection(collection);
          var writerIdent = {
            uid: _syncUser && _syncUser.uid,
            name: (_syncUser && _syncUser.displayName) || 'Parent'
          };
          // Stamp trio matches _syncWritePerEntry at sync.js (resolve by
          // function name on line drift): __sync_createdBy + updatedBy +
          // syncedAt. Without __sync_createdBy, the per-entry attribution
          // composition above silently loses creation provenance for
          // reconciled entries.
          var stampBase = {
            __sync_createdBy: writerIdent,
            __sync_updatedBy: writerIdent,
            __sync_syncedAt: firebase.firestore.FieldValue.serverTimestamp()
          };

          // INVARIANT 3 (v6.1 Aurelius polish):
          //   - Suppress "X added N memories" toasts during reconcile.
          //   - try/finally restores _syncIsReconciling on any throw.
          var wasReconciling = _syncIsReconciling;
          _syncIsReconciling = true;
          try {
            orphanLocals.forEach(function(e) {
              // INVARIANT 4 (v6.1 Aurelius polish):
              //   - INNER try/catch wraps EACH forEach body (not the
              //     forEach itself). Sync throw on .set() (e.g. firebase
              //     uninit) doesn't skip subsequent orphans this fire.
              try {
                // INVARIANT 5 (v6.1 Aurelius polish counter comment):
                //   - Increment BEFORE .set() — overcount is fail-safe
                //     (breaker bails earlier); do NOT move post-resolve,
                //     async settlement would let bursts under-count and
                //     overshoot the limit. Matches existing pattern in
                //     _syncWritePerEntry (sync.js, resolve by function
                //     name on drift).
                _syncWriteCount++;
                colRef.doc(e.id).set(Object.assign({}, e, stampBase), { merge: false })
                  .catch(function(err) {
                    console.error('[sync] reconcile push failed',
                                  collection, e.id, err);
                    // Local entry already in `entries`; survives this
                    // session. Retry on next sync re-attach.
                  });
              } catch (syncErr) {
                console.error('[sync] reconcile push threw synchronously',
                              collection, e.id, syncErr);
                // Local entry already in `entries` above; survives.
                // Continue forEach to subsequent orphans.
              }
            });
          } finally {
            _syncIsReconciling = wasReconciling;
          }
          // INVARIANT 6 (Kael v5 §6.2 MAJOR):
          //   - _reconcileDone.add ONLY on success path. Bail (above)
          //     leaves it open for retry.
          _reconcileDone.add(collection);
        }
      } else {
        // No orphans this fire — close gate immediately. Future fires
        // this session skip the diff.
        _reconcileDone.add(collection);
      }
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
    // Hotfix: dispatch failures log via console.warn (not _syncRecordCrash);
    // see _syncDispatchRender comment for jurisdictional rationale.
    try { _syncDispatchRender(lsKey, entries, attribution); }
    catch(e) { console.warn('[sync-dispatch] outer/' + lsKey + ':', e); }

    // PR-19 (Phase 3 R2 amendment): persistent attribution sidecar. Records
    // the last-remote-writer for this lsKey to KEYS.lastWriters. Read-side
    // consumers (status-strip activity-mode + future in-card surfaces) get
    // a persistent record rather than a transient toast moment.
    _syncRecordLastWriter(lsKey, attribution);

    // Activity pipeline (skip during migration/reconcile, skip self-echo).
    // Repurposed from the prior toast pipeline per Surface C ratification:
    // _syncQueueToast still debounces and composes attribution-aware text,
    // but the publish step now drives the status-strip activity-mode pill
    // (#syncActivity) instead of creating a transient toast div.
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

      // [L] Ledger guard (PR #265) — FIRST, before [E]: every snapshot seen while
      // the key is dirty must refresh the replay cache, or an echo equal to local
      // would leave a stale earlier snapshot cached and the replay after the ack
      // would resurrect it (Cipher A1). Never apply a cloud copy over local
      // writes the server has not acknowledged.
      if (_syncIsDirty(key)) {
        _syncSkippedSnapshots[docName] = { gen: _syncListenerGen, doc: doc };
        if (JSON.stringify(current) !== JSON.stringify(remoteVal)) {
          console.warn('[sync] Skipping overwrite of ' + key + ' — local changes not yet acknowledged by the cloud');
        }
        continue;
      }

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

      // milestone-engine-prep-v1 PR-A — mergeOnReceive hook (V-M-116 + V-K-111
      // floors). Pure (remoteVal, localPrior) → merged function applied before
      // save so cross-device per-key state survives last-write-wins on single-doc
      // shapes. No-op when SYNC_RENDER_DEPS[key] lacks a mergeOnReceive field,
      // or when the named hook isn't a function — falls through to remoteVal.
      var _saveVal = remoteVal;
      var _depCfg = SYNC_RENDER_DEPS[key];
      if (_depCfg && _depCfg.mergeOnReceive) {
        try {
          var _mergeFn = (typeof window !== 'undefined') ? window[_depCfg.mergeOnReceive] : undefined;
          if (typeof _mergeFn === 'function') _saveVal = _mergeFn(remoteVal, current);
        } catch(e) {
          console.warn('[sync] merge-on-receive ' + key + '/' + _depCfg.mergeOnReceive + ':', e);
          _saveVal = remoteVal;
        }
      }

      anyChanged = true;
      _remoteWriteDepth++;
      try { save(key, _saveVal); }
      finally { _remoteWriteDepth--; }
      _syncShadow[key] = _syncCloneDeep(_saveVal);

      // Phase 3 PR-9: dispatch active-tab re-render + module-global rehydrate
      // (Findings B, E). Crash-isolated; failure falls through to the
      // toast-with-reload fallback in _syncQueueToast (graceful degradation).
      // Hotfix: dispatch failures log via console.warn (not _syncRecordCrash);
      // see _syncDispatchRender comment for jurisdictional rationale.
      try { _syncDispatchRender(key, _saveVal, attribution); }
      catch(e) { console.warn('[sync-dispatch] outer/' + key + ':', e); }

      // PR-19 (Phase 3 R2 amendment): persistent attribution sidecar.
      // Records the last-remote-writer for this lsKey to KEYS.lastWriters.
      _syncRecordLastWriter(key, attribution);

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
    // PR-19 (Phase 3 R2 amendment) — Surface C ratification: drive the
    // status-strip activity-mode pill instead of creating a transient
    // toast div. (_syncShowSyncToast is dormant — see its function header.)
    _syncSetActivity(msg, attr);
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
//
// Self-echo discrimination — current state + scope (PR-20 Obs B refresh):
//
// Today's guard is _remoteWriteDepth at the listener layer — a per-device
// counter incremented around the sync handler so a fire that arrives during
// a local-write-in-flight is treated as the local write echoing back. This
// closes the same-device case cleanly: device A writes, A's listener fires
// with A's own write, the depth check suppresses the rebroadcast.
//
// What _remoteWriteDepth does NOT cover is the cross-device same-uid case:
// the same user signed in on phone + tablet. UID is identical on both, so
// suppressing on uid-match alone would silence a genuinely useful "your
// other device just synced X" surface. Suppressing only on same-deviceId
// would correctly cover this — but device-id is not currently in the
// __sync_updatedBy payload (UID + name only). Adding device-id is feature-
// grade reshaping and lives in Phase 4+ R-8 territory, not hygiene-sweep.
//
// Until then: when the toast names the local user it's still a truthful
// surface — the data did sync (cross-device, same uid, the "other-device"
// fire produces a valid attribution-named pill). Surfaced for any future
// reader so the "in most cases" hedge previously here is unpacked.
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

// _syncShowSyncToast — DORMANT (PR-19 R2 amendment, retained per PR-20 hygiene
// sweep item 4 disposition).
//
// Lineage: introduced at PR-9 (Phase 3 Finding D) as the data-fire success-path
// toast surface, with opts.tapToReload=true reserved as the renderer-crash
// fallback. Repurposed at PR-19 (Surface C ratification) — the success-path
// publish target moved off the transient toast div and onto the permanent
// status-strip activity-mode pill (#syncActivity), driven by _syncSetActivity
// inside the _syncQueueToast debounce. Post-PR-19, this function has zero
// callers anywhere in split/*.js.
//
// Why preserved (not removed):
//   PR-19 Ruling 4 named the action shape as comment-class (Aurelius used
//   "comment" and "framing" as adjacent words, then kicked the preserve-vs-
//   delete decision to PR-20 hygiene-sweep; "framing comment" as a compound
//   noun is Lyra's synthesis of that signal, not Aurelius's verbatim phrase).
//   Cipher (PR-20 pre-cut advisory) endorsed preserve as the correct
//   sustainment of that prior signal — flipping to deletion would be
//   doctrine-adjacent (would need an "explicit-prior-ratification-defers-
//   grandfathering" pattern through its own 3/3 cycle). The reserved hook
//   (opts.tapToReload=true → reload on tap) is the documented re-engagement
//   surface if a future dispatch-failure path needs a tap-to-reload fallback.
//
// Re-engagement contract for a future caller:
//   _syncShowSyncToast(msg, { tapToReload: true })
//     → renders a distinct #syncToast div (separate DOM from #updateToast and
//       from #syncActivity), tap reloads the page, otherwise auto-dismisses
//       after 8s. CSS hooks: .sync-toast (always) + .is-tappable (when
//       tapToReload set, gates the cursor per HR-2).
function _syncShowSyncToast(msg, opts) {
  // Create a distinct sync toast (different from QLToast per §4.6 #38)
  var existing = document.getElementById('syncToast');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.id = 'syncToast';
  toast.className = 'sync-toast';
  toast.textContent = msg;
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
    throw e;   // callers decide (retry next launch); a swallowed seed used to look like success (Kael F4)
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

  // Ledger status (PR #265): last acknowledged push + anything still waiting.
  // Same threshold as the header: fresh dirt is "on its way", not "Not synced".
  var un = syncUnsyncedInfo();
  var unStale = un.count > 0 && un.since && ((Date.now() - un.since) > SYNC_STALE_MS || _syncWriteCount >= CIRCUIT_BREAKER_LIMIT);
  var lastRow = un.lastSyncedAt && typeof formatSavedTime === 'function'
    ? '<div class="t-sub">Last synced: ' + escHtml(formatSavedTime(new Date(un.lastSyncedAt).toISOString())) + '</div>'
    : (un.count > 0 ? '<div class="t-sub">Last synced: not recorded yet on this phone</div>' : '');
  var statusRow =
    '<div class="sync-card-body">' +
      lastRow +
      (unStale
        ? '<div class="t-sub t-amber">' + escHtml(_syncUnsyncedCopy({ unsynced: un.count, unsyncedSince: un.since })) +
          ' Until they do, this phone also won\u2019t show the other phone\u2019s newer entries in those areas.</div>' +
          '<button class="btn btn-sage btn-full-sm" data-action="syncRetryPush">' + zi('bolt') + ' Push to cloud now</button>'
        : un.count > 0
          ? '<div class="t-sub">Recent entries are on their way to the cloud.</div>'
          : '<div class="t-sub">All entries on this phone are in the cloud.</div>') +
    '</div>';

  container.innerHTML =
    '<div class="sync-card sync-card-active">' +
      '<div class="sync-card-hdr">' +
        '<span class="icon icon-sage">' + zi('link') + '</span>' +
        '<span class="sync-card-title">' + escHtml((_syncHousehold ? _syncHousehold.name : '') || 'Household') + '</span>' +
        '<span class="sync-status-badge ' + (unStale ? 'sync-status-unsynced' : 'sync-status-connected') + '">' + (unStale ? 'Not synced' : (un.count > 0 ? 'Syncing\u2026' : 'Connected')) + '</span>' +
      '</div>' +
      statusRow +
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
// Six logical states, three visual colors (color mapping lives in CSS; 'stale' = amber, PR #265):
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
  // PR #265: stale = signed in, in a household, and local writes have gone
  // unacknowledged by the server for longer than SYNC_STALE_MS.
  var un = syncUnsyncedInfo();
  var stale = !!(_syncUser && _syncHouseholdId && un.count > 0 && un.since &&
                 ((Date.now() - un.since) > SYNC_STALE_MS || _syncWriteCount >= CIRCUIT_BREAKER_LIMIT));

  // Evaluation order matters: halted is a local fault independent of network,
  // so it wins over offline. stale sits below both (they explain it) and above
  // connecting/syncing/online, which would otherwise hide it. connecting is only
  // valid before any proof of Firestore activity; it collapses to syncing the
  // moment pending > 0.
  if (_syncDisabled) {
    state = 'halted';     reason = 'sync-disabled';
  } else if (!online) {
    state = 'offline';    reason = 'no-network';
  } else if (stale) {
    state = 'stale';      reason = 'unsynced-writes';
  } else if (!_syncHasEverFired && pending === 0) {
    state = 'connecting'; reason = 'no-listener-yet';
  } else if (pending > 0) {
    state = 'syncing';    reason = 'writes-pending';
  } else {
    state = 'online';     reason = 'synced';
  }
  return { state: state, pending: pending, reason: reason,
           unsynced: un.count, unsyncedSince: un.since, lastSyncedAt: un.lastSyncedAt };
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
    if (prev && prev.state === snap.state && prev.pending === snap.pending && prev.reason === snap.reason && prev.unsynced === snap.unsynced && prev.unsyncedSince === snap.unsyncedSince) return;
    _syncLastVisibility = snap;
    for (var i = 0; i < _syncVisibilityListeners.length; i++) {
      try { _syncVisibilityListeners[i](snap); } catch(e) { console.error('[sync-vis] listener threw', e); }
    }
  }, 120);
}

function _syncUpdateStatusIndicator(snap) {
  var btn = document.getElementById('syncStatus');
  if (!btn) return;
  // PR-P: the indicator is silent on success. Routine states (connecting /
  // synced / syncing) no longer consume top-of-screen real estate — only the
  // not-syncing states (offline / halted) surface the pill, so a parent still
  // learns when their data is genuinely not backing up.
  if (snap.state !== 'offline' && snap.state !== 'halted' && snap.state !== 'stale') {
    btn.setAttribute('hidden', '');
    btn.removeAttribute('data-action');
    return;
  }
  btn.removeAttribute('hidden');
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
    case 'stale':
      label = 'Not synced';
      title = _syncUnsyncedCopy(snap) + ' Tap to retry.';
      break;
    default:
      label = ''; title = '';
  }

  var labEl = btn.querySelector('.sync-indicator__label');
  if (labEl) labEl.textContent = label;
  btn.setAttribute('title', title);
  btn.setAttribute('aria-label', title);
  // V-V-2 / V-M-1: announce through the persistent #a11yLive region (the button
  // is visual-only now). Same-frame coalescing means the offline-badge copy —
  // which subscribes after this and carries the fuller message — wins, so the
  // parent hears one message, not the indicator + badge double-announce.
  if (typeof _a11yAnnounce === 'function') _a11yAnnounce(title);

  // HR-3 / HR-6 (r3): tap-to-reload is routed through the core.js data-action
  // dispatcher. halted (reload) and stale (retry push) are tappable; other states are read-only pills.
  // Toggle the attribute's presence — the dispatcher gates on its presence,
  // so other states are non-interactive without any extra guard here.
  if (snap.state === 'halted') btn.setAttribute('data-action', 'syncReload');
  else if (snap.state === 'stale') btn.setAttribute('data-action', 'syncRetryPush');
  else btn.removeAttribute('data-action');
}

// Dispatcher target for data-action="syncReload". Called from the indicator
// pill when halted (sl-1-2 r3) and the offline badge's reload button
// (sl-1-3). Reloading re-bootstraps sync and clears the circuit breaker's
// in-memory crash count.
function syncReload() {
  if (typeof window !== 'undefined' && window.location) {
    // Cache-bust: append timestamp so browser HTTP cache can't serve stale HTML.
    window.location.replace(window.location.pathname + '?_cb=' + Date.now());
  }
}

// ─── Offline Badge Renderer (Phase 1 — sl-1-3) ───
// Subscribed to the sync-visibility store; shows the persistent badge
// below the header in offline or halted state only. Copy and pending-count
// come from the same snapshot the indicator consumes — no separate counter.
function _syncUpdateOfflineBadge(snap) {
  var badge = document.getElementById('offlineBadge');
  if (!badge) return;
  var visible = snap.state === 'offline' || snap.state === 'halted' || snap.state === 'stale';
  if (!visible) {
    if (!badge.hasAttribute('hidden')) badge.setAttribute('hidden', '');
    return;
  }
  if (badge.hasAttribute('hidden')) badge.removeAttribute('hidden');
  badge.setAttribute('data-state', snap.state);

  var nPending = snap.pending > 0 ? ' (' + snap.pending + ' pending)' : '';
  var unsyncedNote = (snap.unsynced > 0) ? ' ' + _syncUnsyncedCopy(snap) : '';
  var copy = snap.state === 'halted'
    ? 'Sync paused after errors — reload to retry.' + nPending + unsyncedNote
    : snap.state === 'stale'
      ? _syncUnsyncedCopy(snap) + ' Tap Retry.'
      : 'Offline — changes will sync when back online.' + nPending + unsyncedNote;

  var copyEl = badge.querySelector('.offline-badge__copy');
  if (copyEl) copyEl.textContent = copy;
  // V-V-2 / V-M-1: announce via the persistent #a11yLive region rather than an
  // aria-live on this (initially [hidden]) badge — reliable on older AT, and the
  // Reload button stays outside the announced text.
  if (typeof _a11yAnnounce === 'function') _a11yAnnounce(copy);

  // The action button is Reload in halted (local fault) and Retry in stale
  // (unacknowledged writes); offline auto-resumes on network restore.
  var reloadBtn = badge.querySelector('.offline-badge__action');
  if (reloadBtn) {
    if (snap.state === 'halted') {
      reloadBtn.textContent = 'Reload';
      reloadBtn.setAttribute('data-action', 'syncReload');
      reloadBtn.removeAttribute('hidden');
    } else if (snap.state === 'stale') {
      reloadBtn.textContent = 'Retry';
      reloadBtn.setAttribute('data-action', 'syncRetryPush');
      reloadBtn.removeAttribute('hidden');
    } else {
      reloadBtn.setAttribute('hidden', '');
    }
  }
}

// "Entries on this phone haven't reached the cloud since 12 Mar — they're safe here." (PR #265)
// The ledger counts KEYS (areas), not entries, so no number is shown: "3 changes"
// would understate six months of feeds (Maren F2 / Vela F3). The reassurance is
// part of the sentence, not only of the failure toast (Maren F5).
function _syncUnsyncedCopy(snap) {
  var since = snap.unsyncedSince || null;
  var sinceStr = null;
  if (since) {
    var longTail = (Date.now() - since) > 300 * 24 * 3600 * 1000;
    sinceStr = new Date(since).toLocaleDateString('en-IN', longTail
      ? { day: 'numeric', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' });
  }
  return (sinceStr
    ? 'Entries on this phone haven\u2019t reached the cloud since ' + sinceStr
    : 'Some entries on this phone haven\u2019t reached the cloud yet') + ' \u2014 they\u2019re safe here.';
}

// Keep the Settings sync card live: it renders the ledger state, so re-render on
// every visibility change while signed in (Vela F2).
onSyncVisibilityChange(function() {
  if (_syncUser && _syncHouseholdId) { try { _syncRenderSettingsUI(); } catch(e) {} }
});

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
  // ORDER-DEPENDENT (Cipher Edict V finding #3): both subscribers fire synchronously
  // per visibility change and each calls _a11yAnnounce(); same-frame calls coalesce to
  // the LAST one. The offline badge must stay registered AFTER the indicator so the
  // parent hears the badge's fuller copy, not the terser indicator title. Do not reorder.
  onSyncVisibilityChange(_syncUpdateStatusIndicator);
  onSyncVisibilityChange(_syncUpdateOfflineBadge);
}


// ─────────────────────────────────────────────────────────────────────────
// v3-3 — getSyncPosture()
// Spec: docs/specs/v3-3-engine-spine.md §Primitive 5
// Synchronous in-memory read of sync-layer health. NO network round-trip
// (Kael v3.0 risk register: "Sync deadlocks via observability over-reach").
// Consumers in home.js / medical.js / intelligence layer can read sync state
// without try/catch dances.
//
// Output: { circuitOpen, lastSyncMs, pendingWrites, healthTier }
//   circuitOpen: boolean — crash-circuit-breaker state (_syncDisabled)
//   lastSyncMs:  number | null — wall-clock ms of last successful sync
//   pendingWrites: number — best-effort queued-writes count (0 in v1; placeholder)
//   healthTier: 'healthy' | 'degraded' | 'broken'
//
// HR-12 safe: reads in-memory state only; no Date construction except for the
// lastSyncMs accessor which returns existing _lastSyncTs (already wall-clock ms).
// ─────────────────────────────────────────────────────────────────────────
function getSyncPosture() {
  var circuitOpen = !!_syncDisabled;
  var lastMs = (typeof _lastSyncTs !== 'undefined' && _lastSyncTs) ? _lastSyncTs : null;
  // pendingWrites: v1 best-effort — sync.js does not currently expose a queue counter.
  // Placeholder 0; future arc may surface real queue depth once a write-queue primitive lands.
  var pending = 0;
  var tier = 'healthy';
  if (circuitOpen) {
    tier = 'broken';
  } else if (lastMs && (Date.now() - lastMs) > 60 * 60 * 1000) {
    // No successful sync in the last hour → degraded.
    tier = 'degraded';
  }
  return {
    circuitOpen: circuitOpen,
    lastSyncMs: lastMs,
    pendingWrites: pending,
    healthTier: tier,
  };
}
