# Sync Visibility Gap Audit — `sl-1-1`

**Branch:** `claude/sync-visibility-phase-1-1bwX0`
**Builder:** Lyra · **QA:** Cipher · **Phase:** `sproutlab-phase-1`
**Repo state:** `main` @ `82901743`

## Premise
The briefing claims "the existing offline badge is reportedly hardcoded." A full sweep of `split/*` shows the stronger reality: **there is no offline badge at all.** The UI is not lying via a stuck pixel — it is lying by omission. Sync state is invisible.

## Current state — what exists, what doesn't

| Question | Answer | Evidence |
|---|---|---|
| `navigator.onLine` used anywhere? | **No.** Zero references in `split/*`. | `grep -rn navigator\.onLine split/` → 0 hits |
| Firestore connection/network API wired to UI? | **No.** No `enableNetwork`, `disableNetwork`, `onSnapshotsInSync`, or `.info/connected` readers. | `grep -niE "enableNetwork\|disableNetwork\|onSnapshotsInSync" split/` → 0 hits |
| Header badge for sync/offline? | **No.** Header (`#headerFull`) holds avatar, greeting, date/time, weather only. | `split/template.html:96–110` |
| Persistent "Offline" string in UI? | **No.** Only a service-worker `503 Offline` fallback response. | `split/core.js:4363–4364` |
| WAL queue by name? | **No WAL literal.** Closest primitives: per-collection debounce map + deferred-flush map. | `split/sync.js:38, 74, 691, 929` |
| Feedback today when syncing? | **Transient toast only.** `#syncToast` shown on remote change; `'Sync paused — too many errors.'` on crash. Dismissible, no a11y role, no persistence. | `split/sync.js:102, 970–999`; `styles.css:8610` |

## Signals we already have (reusable by the derived store)

- `_syncReady[collection]` — per-collection listener-first-fired flag.  (`sync.js:38`)
- `_syncPendingFlush[collection]` — boolean "flush deferred waiting for listener".  (`sync.js:38, 691`)
- `_syncDebounceTimers` — per-doc debounce-timer map (≈ in-flight write count).  (`sync.js:15`)
- `snapshot.metadata.hasPendingWrites` — Firestore's own per-doc pending flag.  (`sync.js:867`)
- `_syncDisabled` / `_syncCrashCount` / `CIRCUIT_BREAKER_LIMIT` — sync-hard-off states.  (`sync.js:28–32`)
- `_remoteWriteDepth` — remote-write suppression counter for echo detection.  (`sync.js:11`)
- CSS tokens `--tc-sage` (ok), `--tc-amber` (warn), `--tc-danger` (bad) plus `.status-good/warn/action`, `.badge-amber`, `.dot-10/16`. No new palette needed.  (`styles.css:3934–3985, 4182–4183`)

## Signals we must add (minimal surface)

1. **Browser online/offline** — listen on `window` `online`/`offline` events; read `navigator.onLine` for initial state.
2. **Pending-write counter** — a single monotonic integer: `pendingWrites++` when a write is queued via `save()` / debounce, `pendingWrites--` when the write's Firestore promise resolves. Exposed alongside the debounce-map size as the single source of truth for "N pending".
3. **Firestore sync drain** — subscribe via `firebase.firestore().onSnapshotsInSync(cb)` (SDK v8+) or, if unavailable, derive drain from `pendingWrites === 0 && debounceTimers empty`.

## Architecture (brief) for `sl-1-2` and `sl-1-3`

**Derived store** (new code in `split/sync.js`, single function `syncVisibilityState()`):

```
state = offline           if !navigator.onLine || _syncDisabled
      = pending           if online && (pendingWrites > 0 || any _syncPendingFlush || any debounceTimer)
      = online            otherwise
pending = pendingWrites + sizeof(debounceTimers)
```

Expose as a subscriber API (`onSyncVisibilityChange(listener)`) emitting `{ state, pending, reason }`. State is **derived**; nothing is hardcoded.

**Header indicator (`sl-1-2`)** — add to `#headerFull` in `split/template.html`:

```html
<button class="sync-status" id="syncStatus" type="button" aria-live="polite" aria-atomic="true" hidden>
  <span class="sync-dot" aria-hidden="true"></span>
  <span class="sync-label"></span>
</button>
```

JS toggles `data-state="online|pending|offline"`; CSS maps `data-state` → `--tc-sage / --tc-amber / --tc-danger` on `.sync-dot`. No inline colors. No hardcoded label text.

**Offline badge (`sl-1-3`)** — persistent row beneath the header, class-driven, reusing the banner pattern (`#homeFeverBanner` etc.):

```
Offline — changes will sync when back online. (N pending)
```

`role="status"`, `aria-live="polite"`. Shows when `state === 'offline'`; disappears when `state === 'online' && pending === 0`. Tapping reveals last-synced time.

## Out-of-scope but flagged for the record

- **`.gitignore` gap (Cautionary Tale #1 re-lurks).** Current `.gitignore` contains only `.claude/`. Tracked artifacts that should be ignored: `split/sproutlab.html`, root `index.html`, `sproutlab.html` (duplicate), and `split/.trashed-1778272350-intelligence.js` (642 KB still in tree). Recommend a follow-up PR to harden `.gitignore` and purge `.trashed-*`. Not blocking Phase 1, but tracking it here so it does not get re-forgotten.

## Acceptance re-confirmed

- `sl-1-2` ships a green/amber/red header indicator driven by the derived store.
- `sl-1-3` ships a persistent offline badge with the specified copy and `aria-live="polite"`.
- No hardcoded classes, no hardcoded text. Every pixel of state mirrors reality.

*Pillar II — Map ≠ Territory. This audit is the map correction.*
