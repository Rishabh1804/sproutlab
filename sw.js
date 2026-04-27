// SproutLab Service Worker — Phase 2 PR-4a externalization.
//
// Lifecycle-only in this revision: install + activate + fetch passthrough.
// Cache + version invalidation lands in PR-4b (CACHE_NAME derived from
// manifest.version; precache list of 8 first-party assets including the
// three /lib/firebase-*-compat.js files; Promise.allSettled discipline
// per CT-7).
//
// Promoted from inline Blob-URL registration in core.js (was hardcoded to
// scope:'/sproutlab/beta/' which silently failed on production /sproutlab/
// scope). Default scope = parent directory of this script per the SW spec,
// which matches the deployed root automatically across environments:
//   - hermetic local Playwright server : scope '/'
//   - production GitHub Pages           : scope '/sproutlab/'

self.addEventListener('install', () => {
  // skipWaiting allows the new SW to take over without waiting for all
  // open clients to close. Pairs with clients.claim on activate to flip
  // control as soon as the SW is ready. Acceptable here because there
  // is no cache schema in this revision; PR-4b will introduce versioned
  // caches and may want to gate skipWaiting behind a user prompt.
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Passthrough fetch with a 503 fallback for offline. This keeps the
  // pre-PR-4a behaviour (which was effectively a no-op since the inline
  // Blob-URL SW never registered on production scope). PR-4b replaces
  // this with a stale-while-revalidate strategy keyed on CACHE_NAME.
  e.respondWith(
    fetch(e.request).catch(() => new Response('Offline', { status: 503 })),
  );
});
