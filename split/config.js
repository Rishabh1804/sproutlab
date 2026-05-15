// ─────────────────────────────────────────
// FIREBASE CONFIG — loaded before core.js
// API key is client-side by design (§4.1 #6)
// Security enforced via Firestore rules (§10)
// ─────────────────────────────────────────
const firebaseConfig = {
  apiKey:            'AIzaSyCFzxOIvPNY8Va7aH3cLwE2D9rh95IidRo',
  authDomain:        'sproutlab-0409.firebaseapp.com',
  projectId:         'sproutlab-0409',
  storageBucket:     'sproutlab-0409.firebasestorage.app',
  messagingSenderId: '494337592066',
  appId:             '1:494337592066:web:82fcd794422c096915d01b'
};

// Stable-id slug for default milestones. Pure / deterministic.
// Lives in config.js (not core.js) because data.js calls it at parse
// time when baking DEFAULT_MILESTONES — and concat order puts data.js
// BEFORE core.js. (PR-ε.0 §0a — Kael v4 audit.)
function slugify(text) {
  const out = String(text || '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return out || ('ms-fallback-' + Math.random().toString(36).slice(2, 10));
}

// ─────────────────────────────────────────
// SYMPTOM CHECKER — RENDER-POLICY (D2 phase-spec §2.5/§2.11)
// Per SG-D2-CONFIG-MODULE (ratified) + Kael A-D2-K-5: render-policy
// constants co-locate here, NOT in medical.js. Eliminates the drift
// hazard where a content edit in data.js silently breaks renderer
// behaviour. Build-time order: config.js → data.js → medical.js.
// ─────────────────────────────────────────

const EMERGENCY_CONTACTS = {
  jamshedpur: {
    label: 'Jamshedpur',
    ambulancePrimary:  { number: '108', service: 'National Ambulance Service' },
    emergencyFallback: { number: '112', service: 'Comprehensive Emergency' },
    altAmbulanceServices: [
      { number: '9931114901',      service: 'Gouri Shankar Ambulance (Mango)' },
      { number: '+91 88829 78888', service: 'Medulance (24/7)' }
    ],
    hospitals: [
      { name: 'Tata Main Hospital (TMH)',       number: '0657 6644444' },
      { name: 'MGM Medical College & Hospital', number: '0657 2360859' },
      { name: 'Elite Hospital (Mango)',         number: '0657 6510307' }
    ]
  }
};
const DEFAULT_REGION = 'jamshedpur';

// Maren C-D2-M-6 fold: currentRegion returns a region-context object
// with a confidence flag. Until D3 ships the settings-panel region
// override, every user gets confidence:'default' — renderer suppresses
// the hospital list to avoid presenting Jamshedpur-specific phone
// numbers to a non-Jamshedpur parent. 108/112 CTAs remain (108 national).
function currentRegion() {
  return {
    region: EMERGENCY_CONTACTS[DEFAULT_REGION] ? DEFAULT_REGION : 'jamshedpur',
    confidence: 'default'
  };
}

// SEQUENCE_CRITICAL_IDS: entries whose whatToDo order carries safety
// meaning under stress. Renderer emits <ol> for these ids; <ul> for
// others. Initial 7-id set per Maren C-D2-M-1 P0 fold; content-veto
// candidates for D2-B inclusion: allergic-reaction, burn, dehydration
// (Maren confirms per entry whether whatToDo is actually a sequence).
const SEQUENCE_CRITICAL_IDS = [
  'fall-injury',
  'vomiting',
  'fever-high',
  'choking',
  'seizure',
  'breathing-difficulty',
  'head-injury'
];

// G-D2-9 boot-time assertion: every id in SEQUENCE_CRITICAL_IDS must
// resolve to a SYMPTOM_DB entry. Deferred via setTimeout(0) because
// config.js loads BEFORE data.js per build.sh; SYMPTOM_DB doesn't
// exist at module-eval time. Dev-mode only (no production noise).
function _scAssertSequenceIds() {
  if (typeof SYMPTOM_DB === 'undefined') return;
  var unresolved = SEQUENCE_CRITICAL_IDS.filter(function(id) {
    return !SYMPTOM_DB.some(function(e) { return e.id === id; });
  });
  if (unresolved.length && typeof window !== 'undefined' && window.SPROUTLAB_DEV_MODE) {
    console.warn('[sc-config] SEQUENCE_CRITICAL_IDS unresolved against SYMPTOM_DB:', unresolved);
  }
}
if (typeof window !== 'undefined') {
  setTimeout(_scAssertSequenceIds, 0);
}
