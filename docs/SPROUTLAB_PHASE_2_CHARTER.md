# SproutLab Phase 2 Charter — Cache Busting + Service Worker Version

**Branch:** `claude/sl-2-cache-busting-Jg3B0` (charter PR; subsequent PRs cut derivative branches per R-2)
**Builder:** Lyra · **QA:** Cipher · **Merge gate:** Aurelius + Sovereign (R-14)
**Repo state:** `main` @ `afbc7a58`
**Campaign:** WAR_TIME 2026-04-24, Hour ~32 of 72 (Phase 2 budget = Hours 24–48; ~16h remaining in window)
**Scope discipline:** Edict VIII — charter ships before code. R-3 atomic-canon. R-9 split-threshold. R-10 hygiene queue.

---

## 1. Briefing as written (`docs/WAR_TIME_DASHBOARD.md`, Phase 2)

> Phase 2: Cache Busting + Service Worker Version (Hours 24–48)
> 1. Add a version field to `manifest.json`
> 2. SW version-based cache invalidation
> 3. Cache-busting query param

---

## 2. Scout findings — three compounding premise issues

### Finding A — A Service Worker exists, but it is inline, scope-broken, and has no caches

`split/core.js:4357–4374`:

```text
4358: if ('serviceWorker' in navigator) {
4360:   const swCode = `
4361:     self.addEventListener('install', e => self.skipWaiting());
4362:     self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
4363:     self.addEventListener('fetch', e => {
4365:       e.respondWith(fetch(e.request).catch(() => new Response('Offline', { status:503 })));
4366:     });
4367:   `;
4368:   const swBlob = new Blob([swCode], { type: 'application/javascript' });
4369:   const swURL = URL.createObjectURL(swBlob);
4370:   navigator.serviceWorker.register(swURL, { scope: '/sproutlab/beta/' }).catch(() => {
4371:     // Blob SW may fail due to scope restrictions — that's fine
4372:   });
4373: }
```

Three properties of this SW:

1. **Blob URL registration.** SW source is a string, blobbed at runtime, registered from a `blob:` URL. Some user-agents reject `scope` for `blob:`-origin SWs entirely.
2. **Scope `/sproutlab/beta/`.** Live deploy is `https://rishabh1804.github.io/SproutLab/` (capital S, no `/beta/`). Lowercase `/sproutlab/beta/` matches `beta/beta-manifest.json`. On production the registration's `.catch()` swallows the scope-mismatch failure — **the SW never activates.** Production has no live SW.
3. **Caches: empty.** `caches.open` repo-wide: 0 hits. No precache, no `addAll`, no runtime cache. Fetch handler is pure passthrough with a 503 fallback. There is no cache to invalidate.

### Finding B — Build emits a single ~3 MB monolithic HTML; no separate assets to cache-bust

`split/build.sh` concatenates 11 JS modules + CSS + template into one `index.html` (~2.95 MB). The runtime fetches:

- `/index.html`, `/manifest.json`, `/icon-192.png`, `/icon-512.png`, `/apple-touch-icon.png`
- `https://cdn.jsdelivr.net/npm/chart.js` (third-party CDN)
- Firebase CDN compat files (loaded by Firebase init)

There are **no first-party JS or CSS files served separately.** "Cache-bust query param strategy" only has surface against the index, manifest, and icons.

### Finding C — Manifest `version` is non-standard

W3C web app manifest spec does not define a `version` member. Adding `"version"` is legitimate as custom metadata (browsers ignore unknown keys per spec) but does not by itself drive any browser behavior. Useful when consumed by app code (display in settings; compare against SW version for "update available" affordance) — not magical on its own.

---

## 3. Charter divergence (R-8 option framing)

Per R-8 / Edict V, surface in-flight when the briefing's literal description rests on premises the scout disproves.

### Option A — Execute literally

- Add `"version"` to `manifest.json` (pure metadata, inert).
- "Version-based cache invalidation" against the existing inline SW. **Useless on production** — SW never activates due to scope mismatch (Finding A.2).
- Cache-bust query param on `/index.html?v=…` from manifest version.

**Verdict:** delivers literal bullets but not user-facing intent ("deployed updates land for users without manual reload"). Not recommended.

### Option B — Refit briefing intent to province reality

Intent: *"shipped updates reach users cleanly."*

1. **Externalize the SW.** Promote inline Blob-URL SW to a real `/sw.js` at scope-root. Fix scope to match production. Keep `/sproutlab/beta/` SW alive on the `beta/` subpath if beta deploy is still desired.
2. **Add `version` to `manifest.json`.** Build-time injected (date-stamp + counter, e.g. `2026.04.26-1`).
3. **Real SW cache + version invalidation.** Versioned `CACHE_NAME` derived from manifest version. Precache static set. `activate` deletes non-matching caches. `fetch` strategy: stale-while-revalidate for the index (offline story preserved); cache-first for icons.
4. **Update detection + reload affordance.** SW `updatefound` → toast → reuses `data-action="syncReload"` from sl-1-2 r3.
5. **Cache-bust the index.** `?v=<manifest.version>` on document fetch in manifest's `start_url`. Defends against intermediate HTTP caches.

**Verdict:** delivers user-facing intent. ~3–4 PRs vs 1–2. Recommended.

### Option C — Minimum-honest

- Add `version` to `manifest.json` (data-only, surfaced in settings).
- Document SW situation as known constraint.
- Defer (1)–(5) of Option B to a Phase 4 charter.

**Verdict:** ships the one truthful sub-deliverable; declines the others as currently undeliverable. Acceptable if campaign clock dictates.

### Recommendation

**Option B**, sequenced atomically across 4 PRs (charter + arming + 3 features), with Option C as fallback if any single PR overshoots Hour 48.

→ **Aurelius / Sovereign:** ratify A / B / C before any feature PR cuts.

---

## 4. Locked scope (Option B; PR-3..PR-5 reshape if A or C)

### PR-1 (this) — Charter

`docs/SPROUTLAB_PHASE_2_CHARTER.md` only. Pure docs (Edict VIII).

### PR-2 — Arming (R-4 + R-12)

Province has zero test infra. R-4 says every non-doc PR ships with Playwright. Atomic per R-3.

**Files (target):**
- `package.json` + `pnpm-lock.yaml` (tracked)
- `playwright.config.ts` with `retries: 0` (R-6)
- `tests/e2e/server.mjs` — zero-dep Node static server (CT-10 mitigation)
- `tests/e2e/smoke.spec.ts` — province-specific golden flows (R-15)
- `.gitignore` allowlist for dev artifacts
- `docs/PWA_BUILD_RULE_AMENDMENT.md` if needed (R-12)

**Province-specific smoke criteria (R-15 — surveyed against SproutLab's actual surface):**
1. `/index.html` loads with no `console.error` / `pageerror`.
2. Five primary tabs (Home, Diet, Medical, Intelligence, Settings) transition without throwing.
3. `manifest.json` parses; required keys present.
4. Phase 1 surfaces intact: `#syncStatus` renders; offline badge appears under simulated `offline`, disappears on `online`.

**SW assertion deliberately omitted from PR-2** because (per Finding A) it would fail on the existing codebase. SW assertions land in PR-4.

### PR-3 — Manifest version field

~15–30 LOC.

- `"version"` in `manifest.json`.
- Build-time injection in `split/build.sh` (date-stamp + same-day counter).
- Runtime read in `start.js`/`core.js` exposes version on a settings line.
- Triad tests (R-7).

### PR-4 — Externalize SW + versioned caches + scope fix

**Likely > 200 LOC — split warning per R-9.**

- **PR-4a:** Externalize SW to `/sw.js`. Fix scope. No cache logic. Tests assert `navigator.serviceWorker.ready` resolves on production scope (D1).
- **PR-4b:** Versioned cache + lifecycle. `CACHE_NAME` from manifest `version`. Precache via `Promise.allSettled` (CT-7 lesson). `activate` deletes non-matching caches. Triad tests + sibling-sweep guard (D2).

### PR-5 — Update-detection + reload affordance

`updatefound` → toast (`role="status"`, `aria-live="polite"`, no inline styles per HR-2) → `data-action="syncReload"`. Triad tests.

### PR-6 (optional) — Cache-bust query param

Only if PR-4 leaves an HTTP-intermediate cache risk the SW does not cover.

### PR-N — Hygiene sweep at threshold (R-10)

---

## 5. Acceptance — Phase 2 closes when

1. `manifest.json` carries a `version` field that advances on each build. Visible in app settings.
2. A real `/sw.js` exists on production scope; `navigator.serviceWorker.ready` resolves; `caches.keys()` includes a versioned cache name.
3. Bumping SW version → old caches deleted on activation; users see "update available" affordance and reach new bundle on next reload — no manual cache clear.
4. Phase 1's `#syncStatus` and offline badge intact (regression-guarded by PR-2 smoke spec test #4).
5. Playwright at `retries: 0` passes 100/100 across the three stress configs (`02-habits.md`). Cipher independent re-run matches.

---

## 6. Hygiene queue (R-10; flush at 3–5)

1. **`.gitignore` is bare (`.claude/` only).** Folds into PR-2.
2. **PR #2 (pre-war cleanup, draft) still open.** No CI, no reviews, no comments. **→ Sovereign:** rule on whether to merge first or fold into hygiene sweep.
3. **SW scope `/sproutlab/beta/` (Finding A.2) — live production-bug.** Fix in PR-4a.
4. **`beta/` subdirectory.** Either a live beta-channel deploy (then in scope) or stale (then prune). **→ Sovereign:** is `beta/` live?
5. **D1 reuse in tests.** PR-4a should reuse atomic `page.evaluate(... await navigator.serviceWorker.ready ...)` from sep-dashboard PR #6.

---

## 7. Sequencing risk + Phase 3 handoff

- **Hour clock:** ~16h in Phase 2 budget. Charter <2h, arming ~3h, manifest version ~2h, PR-4 ~5h (split: +3h), PR-5 ~2h. Total ~15h with no review-cycle latency. Tight but tractable; Option C is the fallback.
- **Phase 3 handoff:** Phase 3 (Auto-Refresh on Listener Fire) wants UI auto-update on remote data. PR-5's `updatefound` toast + reload is **distinct** from Phase 3's listener-fire auto-render — PR-5 reloads on SW update; Phase 3 re-renders subtrees on Firestore listener fire. Phase 3 charter should call out the distinction.

---

## 8. Review path

- **Cipher:** advisory review. Verify Finding A against `core.js:4357–4374`. Probe Finding B by reading `build.sh`. Comment on Option recommendation.
- **Aurelius + Sovereign:** ratify A / B / C and merge (R-14: charter is comm-log → Aurelius solo, but option choice is structural enough that Sovereign should nod).

→ **Cipher:** advisory review requested.
→ **Aurelius / Sovereign:** ratify Option A / B / C; without ruling, no code lands.
→ **Sovereign:** rule on PR #2 and on `beta/`.
