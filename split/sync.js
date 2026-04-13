// ─────────────────────────────────────────
// SYNC — Phase 1: Auth + Household CRUD
// Phase 2 adds: syncWrite, listeners, diffing
// ─────────────────────────────────────────

// ─── State ───
let _syncUser = null;           // current firebase.auth().currentUser snapshot
let _syncHouseholdId = null;    // active household doc ID
let _syncHousehold = null;      // cached household doc data
let _syncListenerUnsubs = [];   // future: onSnapshot unsubscribe fns
let _remoteWriteDepth = 0;      // counter for remote write detection (used by save())
let _syncUIRendered = false;    // guard for Settings section injection

// ─── Sync Key Map (Phase 2 uses this for routing) ───
const SYNC_KEYS = {
  [KEYS.feeding]:            { collection: 'feeds',       model: 'per-entry' },
  [KEYS.sleep]:              { collection: 'sleep',       model: 'per-entry' },
  [KEYS.poop]:               { collection: 'poop',        model: 'per-entry' },
  [KEYS.careTickets]:        { collection: 'caretickets',  model: 'per-entry' },
  [KEYS.notes]:              { collection: 'notes',       model: 'per-entry' },
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
    // Clear synced data from localStorage (§4.5 #33)
    Object.keys(SYNC_KEYS).forEach(function(key) {
      localStorage.removeItem(key);
    });
    _syncUser = null;
    _syncHouseholdId = null;
    _syncHousehold = null;
    _syncRenderSettingsUI();
    showQLToast('Signed out — local data cleared');
    setTimeout(function() { window.location.reload(); }, 800);
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
        // Phase 2: attachListeners here
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
    // Phase 2: seedFirestore + attachListeners here
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
        // Phase 2: attachListeners — initial snapshot populates localStorage
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

// ─── Listener Stubs (Phase 2) ───
function _syncDetachListeners() {
  _syncListenerUnsubs.forEach(function(unsub) { unsub(); });
  _syncListenerUnsubs = [];
}

// ─── syncWrite Stub (Phase 2) ───
// save() in core.js calls this if it exists. Phase 1: no-op.
function syncWrite(key, val, old) {
  // Phase 2 will implement: SYNC_KEYS check → circuit breaker → per-entry/single-doc routing
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
  var modal = document.getElementById('syncHouseholdModal');
  showQLToast('DEBUG: modal=' + !!modal + ' nameEl=' + !!nameEl + ' dobEl=' + !!dobEl + ' nameVal=[' + (nameEl ? nameEl.value : 'NULL') + '] dobVal=[' + (dobEl ? dobEl.value : 'NULL') + ']');
  var name = nameEl ? nameEl.value : '';
  var dob = dobEl ? dobEl.value : '';
  if (!name.trim()) return;
  if (!dob) return;
  if (!_syncUser) { showQLToast('Not signed in'); return; }
  showQLToast('Creating household...');
  syncCreateHousehold(name.trim(), dob);
}

function _syncConfirmJoin() {
  var code = (document.getElementById('syncJoinCode') || {}).value || '';
  if (!code.trim()) { showQLToast('Enter invite code'); return; }
  syncJoinByCode(code.trim());
}
