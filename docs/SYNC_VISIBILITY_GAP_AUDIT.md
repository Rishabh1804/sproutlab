# Sync Visibility Gap Audit — `sl-1-1`

**Branch:** `claude/sync-visibility-phase-1-1bwX0`
**Builder:** Lyra · **QA:** Cipher · **Phase:** `sproutlab-phase-1`
**Repo state:** `main` @ `82901743`
**Revision:** r2 (Cipher review — blockers 1–5 resolved)

## Premise
The briefing claims "the existing offline badge is reportedly hardcoded." A full sweep of `split/*` shows the stronger reality: **there is no offline badge at all.** The UI is not lying via a stuck pixel — it is lying by omission. Sync state is invisible.

## Current state — what exists, what doesn't

| Question | Answer | Evidence |
|---|---|---|
| `navigator.onLine` used in app code? | **No.** Zero references in `split/*.js` (excluding `split/lib/` vendored Firebase SDK, where it appears in the minified bundle but is not referenced from our code). | `grep -rn navigator\.onLine split/ --exclude-dir=lib` → 0 hits |
| Firestore connection/network API wired to UI? | **No.** No `enableNetwork`, `disableNetwork`, `onSnapshotsInSync`, `waitForPendingWrites`, or `.info/connected` readers in app code. | `grep -niE "enableNetwork\|disableNetwork\|onSnapshotsInSync\|waitForPendingWrites" split/ --exclude-dir=lib` → 0 hits |
| Firestore persistence / offline queue enabled? | **Yes.** `db.enablePersistence({ synchronizeTabs: true })` runs at init. Writes issued while offline live in Firestore's IndexedDB queue — **not in `_syncDebounceTimers`.** Any pending-count that ignores IDB is a lie. | `split/sync.js:179` |
| Header badge for sync/offline? | **No.** Header (`#headerFull`) holds avatar, greeting, date/time, weather only. | `split/template.html:96–110` |
| Persistent "Offline" string in UI? | **No.** Only a service-worker `503 Offline` fallback response. | `split/core.js:4363–4364` |
| WAL queue by name? | **No WAL literal.** Three overlapping primitives: (a) Firestore's IDB persistence queue (the real WAL), (b) `_syncDebounceTimers` — pre-submit coalescing, (c) `_syncPendingFlush` — listener-not-ready deferrals. | `split/sync.js:15, 38, 691` |
| Feedback today when syncing? | **Transient toasts only.** `#syncToast` on remote change; `'Sync paused — too many errors.'` on crash. Dismissible, no a11y role, no persistence. | `split/sync.js:104, 977–1014`; `styles.css:8610` |
| Cold-boot "have we heard from Firestore yet?" signal? | **Yes, per collection.** `_syncReady[collection]` flips true when a listener first fires (or when an adaptive fallback timer expires). Nothing in the UI consumes it. | `split/sync.js:36, 65–89` |
| Adaptive-connection primitive (`navigator.connection.effectiveType`)? | **Yes, but scoped to reconcile timing only.** Used to size the listener-ready fallback timeout. Not relevant to the three/four-way indicator; explicitly **out of scope** for Phase 1. | `split/sync.js:41–51` |

## Signals we already have (reusable by the derived store)

- `_syncReady[collection]` — per-collection listener-first-fired flag.  (`sync.js:36`)
- `_syncPendingFlush[collection]` — boolean "flush deferred waiting for listener".  (`sync.js:38, 691`)
- `_syncDebounceTimers` — per-collection **pre-submit** debounce-timer map.  (`sync.js:15`)
- `snapshot.metadata.hasPendingWrites` — Firestore's own per-doc "write issued but not yet ACK'd by server" flag. **This is the post-submit signal.** Already read at `sync.js:867` for toast gating; not yet surfaced to the UI store.  (`sync.js:867`)
- `_syncDisabled` / `_syncCrashCount` / `CIRCUIT_BREAKER_LIMIT` — circuit-breaker state; after `SYNC_CRASH_LIMIT` (3) crashes, sync halts until reload.  (`sync.js:21–29`)
- `_remoteWriteDepth` — remote-write suppression counter for echo detection.  (`sync.js:10`)
- CSS tokens `--tc-sage` (ok), `--tc-amber` (warn), `--tc-danger` (bad) plus `.status-good/warn/action`, `.badge-amber`, `.dot-10/16`. No new palette needed.  (`styles.css:3934–3985, 4182–4183`)

## Signals we must add (minimal surface)

1. **Browser online/offline** — listen on `window` `online`/`offline` events; read `navigator.onLine` for initial state.
2. **Firestore drain** — subscribe via `firebase.firestore().onSnapshotsInSync(cb)`. This is the **single source of truth** for "has everything ACK'd". Fires once the local cache and IDB queue are both in sync with the server. When the SDK does not expose `onSnapshotsInSync`, degrade to the shadow-scan below (no fabricated counts).
3. **Per-doc pending map** — record `snapshot.metadata.hasPendingWrites` from every listener snapshot keyed by collection (or doc). Scan it for the **post-submit** count. Do not hand-roll a counter racing the SDK.
4. **Initial-boot gate** — the indicator must reflect "we have not heard from Firestore yet" distinctly from "we heard and everything's clear." Expose a `connecting` state while no `_syncReady[c]` has flipped true and no `onSnapshotsInSync` event has fired.

## Architecture for `sl-1-2` and `sl-1-3`

### State machine — five logical states, three visual colors

Cipher's blocker #2 is resolved by not collapsing a local fault (`halted`) into a network fault (`offline`). The indicator pill still ships the three colors the briefing mandates; copy and affordance disambiguate the two red states.

| Logical state | Color | When | Copy (indicator) | Copy (offline badge) |
|---|---|---|---|---|
| `connecting` | amber | Cold boot: no listener has first-fired and no `onSnapshotsInSync` event has landed yet | "Connecting…" | *(hidden — not offline)* |
| `online` | green | Network up, Firestore drained (`hasPendingWrites === false` across shadows, no active debounces, no deferred flushes) | "Synced" | *(hidden)* |
| `syncing` | amber | Network up, `pending > 0` | "Syncing (N)" | *(hidden)* |
| `offline` | red | `navigator.onLine === false` | "Offline" | "Offline — changes will sync when back online. (N pending)" |
| `halted` | red | `_syncDisabled === true` (circuit breaker tripped) | "Sync paused" | "Sync paused after errors — reload to retry. (N pending)" + reload button |

The visible pill uses `[data-state=connecting|online|syncing|offline|halted]`. CSS maps them to three color tokens (`--tc-amber / --tc-sage / --tc-amber / --tc-danger / --tc-danger`). Screen readers get five distinct `aria-label`s so the two red states are distinguishable by assistive tech, not just by visual cue.

### Derived store — disjointness contract for the pending count

Cipher's blocker #3 is resolved by defining the two contributing sets as **phases of a write's life**, not independent counters, and sourcing the post-submit phase from the SDK.

```
pre-submit  = number of active entries in _syncDebounceTimers (debounced locally, .set() not yet called)
              + number of entries in _syncPendingFlush with value === true
              (listener-not-ready, .set() definitely not yet called)

post-submit = number of (collection|doc) keys whose last-seen
              snapshot.metadata.hasPendingWrites === true
              (.set() has been called; Firestore's IDB queue still awaiting server ACK)

pending = pre-submit + post-submit   // disjoint by construction
```

**Transition boundary:** when a debounce timer fires, its entry is nulled in `_syncDebounceTimers` **before** `.set()` is invoked. When the post-submit snapshot metadata fires back, it is recorded in the per-doc pending map. The two phases are mutually exclusive at any instant; no race, no flicker.

### Equation

```
state = connecting  if  no listener has first-fired
                        && no onSnapshotsInSync event has landed
                        && pending === 0
      = halted      if  _syncDisabled === true
      = offline     if  !navigator.onLine
      = syncing     if  online && pending > 0
      = online      otherwise
```

`halted` is evaluated **before** `offline` because a crash-killed sync is a local fault independent of network state. `connecting` collapses to `syncing` as soon as any pending write exists — we have proof of activity, no need to guess.

Exposed as `syncVisibilityState(): { state, pending, reason }` plus `onSyncVisibilityChange(listener)`. Notifier is debounced (~120 ms) and change-detected — identical snapshots don't re-emit.

### Header indicator (`sl-1-2`) — markup

```html
<button id="syncStatus" type="button" class="sync-indicator" hidden
        aria-live="polite" aria-atomic="true">
  <span class="sync-indicator__dot" aria-hidden="true"></span>
  <span class="sync-indicator__label"></span>
</button>
```

JS flips `data-state="connecting|online|syncing|offline|halted"`. CSS maps `data-state` to `--tc-sage / --tc-amber / --tc-danger`. No inline colors, no hardcoded labels. Button remains `hidden` until the first notify lands — no lying initial pixel.

### Offline badge (`sl-1-3`) — markup (informational; lands in next PR)

Persistent row beneath the header, reusing the banner pattern (`#homeFeverBanner` etc.), visible when `state === 'offline' || state === 'halted'`. Copy differs per state per the table above. `role="status"`, `aria-live="polite"`, `aria-atomic="true"`. Disappears when `state === 'online' && pending === 0`.

### Legacy `#syncToast` — decision (Cipher blocker #5)

Today: `sync.js:104` fires a one-shot `'Sync paused — too many errors. Reload to retry.'` toast on circuit-breaker trip. `sync.js:977–1014` fires a transient toast when remote changes arrive (different device wrote → pulls to local).

- **The `'Sync paused'` toast is retired in `sl-1-2`.** That state is now surfaced persistently as `halted` in the header indicator and in the offline badge, with a reload affordance. A transient toast on top is the three-surfaces-for-one-state redundancy Cipher rejects.
- **The "remote change arrived" toast stays.** It communicates a different event class — "another device wrote; refresh for the freshest view" — which the indicator does not carry. Keeping it is not a lie: it is a strictly additional signal for an orthogonal concern. Noted explicitly so the next reader doesn't try to "clean it up" under the Phase 1 flag.

## Out-of-scope but flagged for the record

- **`.gitignore` gap (Cautionary Tale #1 re-lurks).** Current `.gitignore` contains only `.claude/`. Tracked artifacts that should be ignored: `split/sproutlab.html`, root `index.html`, `sproutlab.html` (duplicate), and `split/.trashed-1778272350-intelligence.js` (642 KB still in tree). Recommend a follow-up PR to harden `.gitignore` and purge `.trashed-*`. Not blocking Phase 1.
- **`navigator.connection.effectiveType`** (`sync.js:41–51`) drives reconcile-fallback timing only. Exposing it in the indicator would conflate transport quality with sync state. Deferred; not a Phase 1 concern.

## Acceptance re-confirmed

- `sl-1-2` ships a header indicator with **five logical states** collapsed into the briefing-mandated **three colors**, driven entirely by the derived store, with a11y distinctions intact.
- `sl-1-3` ships a persistent offline badge with the specified copy, `aria-live="polite"`, and the `halted`-variant reload affordance.
- Pending count is defined by disjoint contract — pre-submit (our maps) + post-submit (`hasPendingWrites` scan), never both for the same write.
- The `'Sync paused'` toast is removed; header + badge carry that state.
- No hardcoded classes, no hardcoded text. Every pixel of state mirrors reality.

*Pillar II — Map ≠ Territory. This audit is the map correction.*
