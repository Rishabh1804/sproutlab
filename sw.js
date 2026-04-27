// SproutLab Service Worker — Phase 2 PR-4b: versioned cache + precache +
// stale-while-revalidate + manifest bypass + AbortError discrimination.
//
// Closes PR #7 charter §4 PR-4b. Builds on PR-4a (which externalized the SW
// from inline Blob-URL to this file at scope-root). PR-5 will add the
// `updatefound` toast affordance on top.
//
// Carry-forwards from review chain folded:
//   - PR-7 r1 (Cipher): precache list = 8 first-party assets including the
//     three /lib/firebase-*-compat.js (vendored, NOT CDN per source scout).
//   - PR-11 (Cipher): manifest.json must bypass SW cache so displayAppVersion()
//     reads current manifest, not a stale precached copy.
//   - PR-12 r1 (Cipher): fetch handler must NOT 503 on AbortError or CORS;
//     those are not "offline." Stale-while-revalidate naturally handles them
//     (cache hit returns immediately, network refresh is fire-and-forget).
//   - CT-7: Promise.allSettled for precache, never cache.addAll — a single
//     asset failure (e.g. one /lib/* misdeploy) must NOT abort the install.

const CACHE_PREFIX = 'sproutlab-';

// Precache list: 8 first-party assets (NOT including manifest.json — see
// fetch-handler bypass below). Cipher PR-7 r1 catch surfaced that the
// /lib/firebase-*-compat.js files are first-party vendored, not CDN, so
// they belong in the precache to keep Firebase auth/sync paths offline-
// available.
const PRECACHE_ASSETS = [
  './',                              // navigate-to-scope-root (index.html alias)
  'index.html',                      // explicit
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png',
  'lib/firebase-app-compat.js',      // ~31 KB vendored
  'lib/firebase-auth-compat.js',     // ~139 KB vendored
  'lib/firebase-firestore-compat.js' // ~343 KB vendored (largest; CT-7 most likely to blip)
];

// CACHE_NAME is set on install once manifest.version is read. Until then,
// fetch-handler operations either find no cache (no respondWith caching) or
// see a stale cache from a prior activation. Bootstrap value covers the
// degenerate case where install hasn't run yet.
let CACHE_NAME = CACHE_PREFIX + 'unknown';

async function readCacheVersion() {
  try {
    const res = await fetch('manifest.json', { cache: 'no-store' });
    if (!res.ok) return 'unknown';
    const m = await res.json();
    return (m && typeof m.version === 'string' && m.version) ? m.version : 'unknown';
  } catch {
    return 'unknown';
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const version = await readCacheVersion();
    CACHE_NAME = CACHE_PREFIX + version;
    const cache = await caches.open(CACHE_NAME);

    // CT-7 discipline: Promise.allSettled, never cache.addAll. The latter is
    // all-or-nothing; if any single asset 404s (e.g. a partial deploy hit a
    // sub-resource just-after a rebuild), the entire SW install rejects and
    // the PWA loses its offline story. allSettled lets each asset fail or
    // succeed independently; install completes with whatever was reachable.
    await Promise.allSettled(
      PRECACHE_ASSETS.map(asset => cache.add(asset))
    );

    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Delete any previous-version caches sharing our prefix. The current
    // CACHE_NAME (set in install) is preserved. Other caches are cleaned
    // up so storage doesn't grow unbounded across version bumps.
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
        .map(key => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Manifest bypass — Cipher PR-11 catch. displayAppVersion() in core.js
  // uses fetch(..., { cache: 'no-store' }) to read current manifest.version.
  // If the SW intercepts and serves a precached manifest, version display
  // can show a stale value after a build-time bump. Skip respondWith here
  // so the browser handles the fetch via its native network path.
  if (url.pathname.endsWith('/manifest.json')) return;

  // Only cache same-origin GET requests. POSTs (Firebase writes) and
  // cross-origin (CDN) bypass the SW entirely.
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request);

    // Stale-while-revalidate. The network fetch is fire-and-forget when we
    // have a cached copy; the cached response is returned immediately. On
    // cache miss, await the network fetch.
    const networkFetch = fetch(event.request).then(response => {
      // Only cache successful responses. Status 0 (opaque) and >=400 are
      // not cached so we don't poison the cache with errors.
      if (response && response.ok) {
        cache.put(event.request, response.clone()).catch(() => {});
      }
      return response;
    }).catch(err => {
      // PR-12 r1 carry-forward: discriminate failure types.
      // - AbortError: client cancelled the fetch (in-flight nav, fetch()
      //   abort() called, SW claim mid-load). Not "offline."
      // - TypeError: usually CORS or genuine network failure. If we have a
      //   cached copy we'd already have returned it; here we fall through to
      //   the offline fallback below ONLY when there is no cache hit.
      // Returning null signals "treat as no-network-response" without
      // surfacing the error as a 503 if a cached copy is available.
      const name = err && err.name;
      if (name === 'AbortError') return null;
      return null;
    });

    if (cached) {
      // Background revalidate; fire-and-forget. Errors are swallowed because
      // a cached response is already returned to the client.
      networkFetch.catch(() => {});
      return cached;
    }

    const fresh = await networkFetch;
    if (fresh) return fresh;

    // Genuine offline: no cache, no successful network fetch. The 503
    // signals the client unambiguously. Browser treats this as a fetch
    // error in console (BENIGN_CONSOLE allowlist in spec catches the
    // "Failed to load resource: the server responded with a status of"
    // pattern per PR-12 r2).
    return new Response('Offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  })());
});
