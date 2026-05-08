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
