# SproutLab Phase 3 Charter — Auto-Refresh on Listener Fire

**Branch:** `claude/sl-3-charter-atjco` (charter PR; subsequent PRs cut derivative branches per R-2)
**Builder:** Lyra · **QA:** Cipher (advisory, relay-only) · **Merge gate:** Aurelius + Sovereign (R-14)
**Repo state:** `main` @ `4ee9672c` (Phase 2 close)
**Campaign:** WAR_TIME 2026-04-24, Hour ~37 of 72 (Phase 3 budget = Hours 48–72; opening early)
**Scope discipline:** Edict VIII — charter ships before code. R-3 atomic-canon. R-9 split-threshold. R-10 hygiene queue.

---

## 1. Briefing as written (`docs/sessions/WAR_BRIEF_LYRA_SPROUTLAB.md`, Phase 3)

> Phase 3: Auto-Refresh on Listener Fire (Hours 48-72)
> **Goal:** UI auto-updates when remote data arrives (no manual reload needed)
> **Current State:** Requires full page reload via `window.location.reload()` after sync toast click
>
> **Deliverable:**
> - Listener callbacks trigger targeted re-renders (not full page reload)
> - Connection + data arrival → auto-update specific UI sections
> - Remove "tap to refresh" requirement
> - Graceful handling: if auto-refresh fails, fallback to manual refresh button
>
> **Key Files:**
> - `/home/user/sproutlab/split/sync.js` — listener callbacks (line 874+)
> - `/home/user/sproutlab/split/home.js` — vitals card re-render
> - `/home/user/sproutlab/split/core.js` — render functions
>
> **Acceptance:** Remote changes visible on UI within 2-3 seconds of listener fire; no manual reload

### R1 scope expansion (Sovereign-issued post-charter-open)

> *"We also need to include who's updated what in the scope. Also, the growth tab is not updating in firebase no matter who's updating it, so we are stuck with old weight and height, look into it. These all should be the same scope fix and upgrade."*

Folded as Findings E and F below. R1 expands the scope from a single deliverable (auto-render) to three (auto-render + clobber-loop fix + attribution surfacing) — but, per the empirical trace, all three sit on the same architectural change (`_syncDispatchRender` rehydrates the module global, which closes the clobber loop and threads attribution through to the toast). Net LOC stays inside R-9's single-PR threshold; sequencing in §4 unchanged.

---

## 2. Scout findings — empirical probe of SproutLab's listener surface

Per D8 + the *running-beats-reading* doctrine, this charter probes the actual province surface rather than copy-paste the briefing's framing. Three findings emerge; the third is a charter-premise divergence the briefing did not anticipate.

### Finding A — Three listener paths exist; only one re-renders in place today

`split/sync.js` registers three classes of Firestore listener inside `_syncAttachListeners()`:

```text
802: hRef.collection(col).onSnapshot(…)            // per-entry (caretickets)
816: hRef.collection('singles').doc(docName).onSnapshot(…)  // single-doc (tracking, medical, …)
827: hRef.onSnapshot(…)                            // household doc (members, invite code)
```

The household-doc listener (line 827) calls **`_syncRenderSettingsUI()`** on every fire — a complete in-place re-render of `#syncSettingsSection`. This is the *only* listener path that re-renders DOM today, and it is the existing precedent Phase 3 generalizes.

The two data-bearing paths (`_syncHandlePerEntrySnapshot` line 839, `_syncHandleSingleDocSnapshot` line 921) write to `localStorage` via `save(lsKey, entries)`, update `_syncShadow`, then call `_syncQueueToast(...)`. **Neither path calls any data-tab renderer.** The toast (`_syncShowSyncToast` line 1024) is the only user-visible signal a remote update arrived; tapping it executes `window.location.reload()` (sync.js:1035).

So today's flow on a remote data fire while Diet tab is open:

```
Firestore listener fires
  └─ save(KEYS.feeding, …) writes localStorage and updates _syncShadow
  └─ _syncQueueToast('tracking', n) debounces a 'tap to refresh' toast
  └─ user taps toast → window.location.reload() → full bootstrap → renderDietStats() reads fresh
```

Auto-render lives nowhere on the data path. Phase 3 fills that gap.

### Finding B — Renderers read from module-level globals, not from localStorage (charter-premise divergence)

The briefing's framing — "listener callbacks trigger targeted re-renders" — assumes renderers are state-pure (read from the canonical store on each call). **They are not.**

Module-level globals (`feedingData`, `growthData`, `milestones`, `foods`, `vaccData`, `notes`, `meds`, `visits`, `customEvents`, `scrapbook`, `doctors`, `sleepData`, `poopData`, `_careTickets`, `activityLog`, `_tomorrowPlanned`) are seeded once in `init()` at `core.js:689–712` via `load(KEYS.x, default)` and held in memory thereafter.

Renderers consume those globals directly. `home.js:2334` (`renderDietStats`):

```js
const ironCount = countFoodsInDiary(feedingData, ironFoods);
…
const daysLogged = Object.keys(feedingData).filter(d => new Date(d) >= weekAgo).length;
```

`renderHome` (home.js:375) does not re-`load()` either; it composes from the same module globals through nested helpers.

The canonical local-write idiom always rehydrates the global by hand alongside the save — `intelligence.js:10805–10806`:

```js
save(KEYS.feeding, feeding);
feedingData = feeding;
```

The listener path (`_syncHandlePerEntrySnapshot` line 905, `_syncHandleSingleDocSnapshot` line 990-ish via the lsKey loop) calls `save(lsKey, entries)` but **does not update the module global**. Even if Phase 3 wires a render call from the listener handler, the renderer reads stale module state until the next reload.

This is the structural premise issue the briefing did not see. Phase 3 has *two* substeps the briefing conflated into one:

1. **Rehydrate the module global** for the affected key(s) on listener fire — the inverse of the canonical local-write idiom.
2. **Re-call dependent renderers**, gated on the active tab to avoid wasted work.

Without (1), (2) renders stale. Without (2), (1) updates state with no DOM signal. The briefing's "listener callbacks trigger re-renders" implicitly bundles both; the charter must surface both.

### Finding C — Active-tab-aware re-render dispatch idiom already exists

Phase 3 does not need to invent a reactive layer. `intelligence.js:10773–10777` and `:10859–10861` already use this pattern after local writes:

```js
const curTab = TAB_ORDER.find(t => document.getElementById('tab-' + t)?.classList.contains('active'));
if (curTab === 'diet') { initFeeding(); renderDietStats(); }
if (curTab === 'poop') { renderPoop(); }
if (curTab === 'sleep') { renderSleep(); }
if (curTab === 'home') renderHome();
```

`switchTab()` at `core.js:2585` similarly dispatches per-tab renderer calls. Phase 3 invokes the same idiom from `_syncHandlePerEntrySnapshot` and `_syncHandleSingleDocSnapshot` after rehydrating, scoped through a per-key dispatch table.

Existing structure that maps cleanly:
- `SYNC_KEYS` (sync.js:120–140) declares `lsKey → { collection, model }` for 19 keys across 9 collections.
- A sibling map `SYNC_RENDER_DEPS` declaring `lsKey → { rehydrate, renderers[] }` is the minimum-disruption extension.

Net Phase 3 source delta is small (~120–180 LOC across sync.js + a thin shim in core.js), well below the R-9 split threshold for a single PR.

### Finding D — `#updateToast` (PR-5) and `syncToast` (this phase) are structurally distinct surfaces

Per Phase 2 charter §7's explicit handoff distinction:

| Surface | Concern | Trigger | Action on tap | DOM |
|---|---|---|---|---|
| `#updateToast` (PR-5) | App-shell version swap | SW `updatefound` → `installed` → controller chain | `window.location.reload()` via `data-action="syncReload"` | template.html:88 |
| `#syncToast` (Phase 3 surface) | Firestore data freshness | `onSnapshot` fires with new data | currently `window.location.reload()` direct (sync.js:1035) | dynamically created at sync.js:1029 |

Two different DOM nodes, two different lifecycles, two different concerns. PR-5's reload is *correct* for its domain (a new SW must take control of the page). Phase 3's reload is *overkill* for its domain (a Firestore data delta does not require app-shell teardown — re-rendering the affected subtree preserves scroll position, expanded panels, modal state, and quick-log inputs).

Phase 3 inverts the data-toast surface: re-render runs eagerly on listener fire; the toast becomes either (a) silent on success, or (b) an opt-out fallback for "auto-render failed, tap to reload." It does not affect `#updateToast` at all.

### Finding E — The growth-tab "stuck on old weight/height" bug is Finding B realized as a live production conflict

Sovereign-reported (charter R1 expansion): "the growth tab is not updating in Firebase no matter who's updating it; we are stuck with old weight and height." Empirical trace closes the loop.

**Single growth writer surface.** `medical.js:1820–1841` (`addGrowthEntry`) and `:1729–1735` (`deleteGrowth`) both mutate the module global `growthData[]` directly, then call `renderGrowth()`. `renderGrowth` (medical.js:1005–1007) sorts in place and persists via `save(KEYS.growth, growthData)`. Save → `syncWrite` → `_syncDebounceSingleDoc('growth', …)` → `_syncFlushSingleDoc` → `docRef.set({ ziva_growth: […], __sync_*: … }, { merge: true })`. The write path is intact.

**The clobber loop.** Two-device household (admin + member, e.g., the Sovereign + Bhavna):

1. Device A's `growthData = [a, b]` → user adds `c` → `growthData = [a, b, c]` → save → flush writes `singles/growth.ziva_growth = [a, b, c]`.
2. Device B receives the listener fire. `_syncHandleSingleDocSnapshot('growth', doc)` writes `localStorage[KEYS.growth] = [a, b, c]` and updates `_syncShadow[KEYS.growth]`. **Module global `growthData` on Device B is unchanged from its init state at `core.js:689`.**
3. Device B's user adds `d`. `addGrowthEntry` pushes onto Device B's *stale* `growthData` (which still reflects pre-listener state, e.g. `DEFAULT_GROWTH`). New `growthData = [DEFAULT_GROWTH…, d]`. `renderGrowth` saves this to localStorage, overwriting the listener-applied `[a, b, c]`.
4. Save → flush → diff between `current = [DEFAULT_GROWTH…, d]` (what `load(KEYS.growth)` now returns) and `shadow = [a, b, c]` (remote-aligned from Device B's last listener fire) → updates field → `docRef.set({ ziva_growth: [DEFAULT_GROWTH…, d] })` clobbers Firestore back to a stale state plus `d`.
5. Device A receives this clobber via listener. Local `growthData` on Device A is `[a, b, c]` (stale module global from when Device A wrote it). Device A's localStorage now becomes `[DEFAULT_GROWTH…, d]`, but rendering still reads stale module global `[a, b, c]`.
6. From here both devices ping-pong stale-clobbers. The visible *latest weight / latest height* values stick on whichever module-global state was warmest at the moment each device clobbered — which, for a low-frequency surface like growth (weekly/monthly entries), accumulates visibly stale UI.

**Why growth specifically.** The same architectural defect (Finding B) applies to every key in `SYNC_KEYS`. Growth surfaces *visibly* because:

- **Low write frequency.** Growth is logged weekly to monthly. Days or weeks elapse between local writes, during which listener fires accumulate without rehydrating the module global. By the time the next user-write happens, the module-global / localStorage divergence is large.
- **Cross-device write distribution.** Both household members log growth — divergence accumulates on both devices, and each new write clobbers the other's progress.
- **No mid-day idempotent recompute.** Surfaces like feeding re-render on every meal-log within the same session, masking divergence (because the same device that's writing is also the one whose module global is fresh). Growth's renderer reads `getLatestWeight()` which is purely module-global-bound.

**Same fix.** The Phase 3 Option B `_syncDispatchRender(lsKey)` writer-shim — rehydrating the module global from listener-supplied `value` before the active-tab dispatch — closes the clobber loop. After Phase 3, Device B's `growthData` rehydrates on listener fire; the next local add pushes onto current state; the resulting save reflects true intent and converges. The auto-render dispatch and the stale-clobber fix are *the same architectural change* — separating them would mean either fixing auto-render and leaving the clobber loop active (regression risk), or fixing the clobber and not surfacing the data to the user (defeats the briefing intent).

### Finding F — Attribution metadata is already on the wire; surfacing it is a UI change, not a data layer change

Sovereign-reported (charter R1 expansion): "we need to include who's updated what in the scope."

Empirical trace: every Firestore write already carries attribution metadata.

- **Seed (`_syncSeedFirestore`):** `__sync_createdBy: { uid, name }` + `__sync_updatedBy: { uid, name }` + `__sync_syncedAt: serverTimestamp()` (sync.js:1067–1070 for per-entry; :1093–1095 for single-doc).
- **Per-entry write (`_syncWritePerEntry`):** `__sync_updatedBy` + `__sync_syncedAt` on each `set` payload.
- **Single-doc flush (`_syncFlushSingleDoc`, line 739–742):** same `__sync_updatedBy` + `__sync_syncedAt` attached to both update and delete payloads.

The listener handler currently strips all `__sync_*` fields before persisting locally (`_syncHandleSingleDocSnapshot` line 938: `if (dataKeys[i].indexOf('__sync_') !== 0) clean[…] = data[…]`). Phase 3 captures `data.__sync_updatedBy` (and `data.__sync_syncedAt`) before the strip and threads them through `_syncDispatchRender(lsKey, value, attribution)` so the active-tab render and the success-toast can name the updater. No schema change; no new write surface; pure UI plumbing on top of existing on-wire metadata.

**Two attribution surfaces, both small:**

1. **Toast text upgrade.** `_syncShowSyncToast` currently shows `"3 updates synced — tap to refresh"`. With attribution available, becomes `"Bhavna updated growth · 3 entries"` (singular collection) or `"3 updates from Bhavna"` (cross-collection batched). Falls back to the current count-only text when `__sync_updatedBy` is absent (legacy data) or when the local user is the writer (self-echo path).
2. **In-card "last updated by" line.** Optional, gated by feature scope: a single text line on the growth card and the household-settings card showing `"Last updated by {name} · {relative-time}"`. Re-renders on listener fire via the same `_syncDispatchRender` path. Gracefully omitted on cards where the design system doesn't have a slot for it (e.g., dense list cards).

---

## 3. Charter divergence (R-8 option framing)

Per R-8 / Edict V, surface in-flight when the briefing's literal description rests on premises the scout disproves. Finding B is a structural premise the briefing conflated; Finding D is a surface the briefing did not isolate.

### Option A — Execute literally

- Wire a render call from each listener handler, passing the active tab. Read renderers run from stale module globals (Finding B) and surface user-visible inconsistency between sync-toast count and rendered values.
- Keep "tap to refresh" as the fallback (per briefing) but mask the underlying staleness instead of fixing it.

**Verdict:** delivers the literal bullets without the user-facing intent ("remote changes visible within 2-3s"). Renders stale. Not recommended.

### Option B — Refit briefing intent to province reality (recommended)

Intent: *"remote data deltas reach the open tab without user action, without losing UI state, and without subsequent local writes clobbering them."*

The expanded intent (post-R1 from Sovereign) folds three deliverables under one architectural change. Findings E and F establish that the growth-stuck-stale bug and the attribution surface are the same underlying fix, not separate work.

1. **Rehydrate-on-fire dispatch.** Add a per-key dispatch table (`SYNC_RENDER_DEPS`) sibling to `SYNC_KEYS`, declaring rehydration target + renderer list. The two listener handlers, after `save(lsKey, entries)`, call a new `_syncDispatchRender(lsKey, value, attribution)` that (a) reseeds the module global from `value` via a writer-shim defined in `core.js`, (b) re-runs the active-tab subset of declared renderers, (c) closes the cross-device clobber loop (Finding E) by ensuring subsequent local pushes read from rehydrated state.
2. **Attribution surfacing.** Capture `data.__sync_updatedBy` (and `__sync_syncedAt`) in the listener handler before the `__sync_*` strip; thread it through `_syncDispatchRender` to the toast text + (optionally) a "last updated by {name}" line on the growth card and the household-settings card (Finding F).
3. **Eager re-render replaces tap-to-reload on `#syncToast`.** Toast becomes a non-blocking ack with attribution text (`"Bhavna updated growth · 3 entries"`) that auto-dismisses; the click handler is removed on the auto-render success path. Halted-state and offline-state toasts (sl-1-2 / sl-1-3) keep their existing `data-action="syncReload"` since those represent state the auto-render path cannot recover from. Self-echo (local user is the writer) suppresses the toast as it does today.
4. **Graceful fallback.** If `_syncDispatchRender` throws (renderer crash, missing writer-shim case, attribution-text formatter exception), catch via `_syncRecordCrash` and fall back to the current toast-with-reload shape (count-only text). Auto-render is a *progressive enhancement* over the current reload path; never a regression.
5. **Acceptance tests (R-4 + R-7).**
   - Auto-render hermetic spec: stub a remote snapshot delivery via `page.evaluate` invoking the listener callback with synthetic data; assert the affected DOM subtree updates in-place under 100ms without page navigation; assert scroll position + expanded card state survive.
   - **Cross-device clobber regression (Finding E):** synthetic listener fire delivers `[a, b, c]`; verify module global rehydrates; subsequent in-page local-add pushes onto rehydrated state, not onto stale init state; resulting flush diff sends `[a, b, c, d]` to Firestore (verified by inspecting the writer-shim's last-call payload).
   - **Attribution presence (Finding F):** synthetic listener fire with `__sync_updatedBy: { name: 'Bhavna' }`; assert the toast text contains `"Bhavna"`; assert the in-card line (where rendered) contains `"Last updated by Bhavna"`.

**Per-feature R-7 shape:** original triad (positive / regression-guard / positive-regression) is the default. Phase 3 features do not currently expose a UX *mode contract* (auto-render is universally beneficial; there is no opt-out surface). If a feature surfaces such a contract during build (e.g., a "preserve current view" preference), the binary-mode triad gets layered in per the Phase 2 PR-14 precedent.

**Verdict:** delivers the user-facing intent, closes a live production bug (Finding E), and surfaces existing on-wire attribution metadata (Finding F) — all under one architectural change. Smaller cumulative LOC than three separate fixes; smaller blast radius than Option A's stale-render workaround. Recommended.

### Option C — Minimum-honest

- Keep `#syncToast` at its current shape (tap-to-reload).
- Document the listener-fire / module-global mismatch as a known constraint.
- Defer auto-render to a Phase 4 charter when renderers can be migrated to read-from-localStorage or a reactive store layer is feasible.

**Verdict:** ships nothing new but truthful. Acceptable as Hour-64 fallback if Option B's first feature PR overshoots, with the understanding that the deferred work scales linearly with later refactor cost.

### Recommendation

**Option B**, sequenced atomically across 3 PRs (charter + arming-if-ratified + feature), with Hour 64 as the C-fallback trigger (8h before campaign close, leaving buffer for Hour 72 chronicle work).

→ **Aurelius / Sovereign:** ratify A / B / C before any feature PR cuts.

---

## 4. Locked scope (Option B; sequence reshapes if A or C)

### PR-7 (this) — Charter

`docs/SPROUTLAB_PHASE_3_CHARTER.md` only. Pure docs (Edict VIII). No build, no manifest bump (charter PR; bump-version.mjs is excluded from this commit).

### PR-8 (optional arming) — `pnpm build` automation

Folds Phase 2 hygiene-queue item 2 (carry-forward). Cipher's Phase 2 close note: *"Whatever automation closes hygiene-sweep item 2 should land before Phase 3 to prevent recurrence."*

**Files (target):**
- `package.json` — add `"build": "bash split/build.sh"` script entry. Likely a `prepush` or `prebuild` hook later, not in this PR.
- `docs/SPROUTLAB_QUICK_REFERENCE.md` — update the build-step block from raw `bash` to `pnpm build`.

**Tests (R-4):** Smoke spec gets a build-script existence regression-guard (one test); build-output byte-identity preserved by re-running the existing PR-3 manifest-version triad. ~10–20 LOC source + 1 test.

**Disposition:** *Optional* — fold in if the merge gate prefers belt-and-braces against ship-gap recurrence; drop if we'd rather keep Phase 3 strictly feature-scoped and tackle hygiene-sweep separately. Either ratification path leaves Phase 3 deliverable.

### PR-9 — Listener-fire dispatch + clobber-loop fix + attribution surfacing (the feature)

The single Phase 3 feature PR under Option B. Three deliverables, one architectural change. Likely 180–260 LOC source + 100–140 LOC tests; sits at the high end of the R-9 single-PR threshold but does not split because the deliverables are mechanically coupled (rehydration is the same write that closes the clobber loop and is the same call site that captures attribution).

**Files (target):**
- `split/sync.js`:
  - Add `SYNC_RENDER_DEPS` map sibling to `SYNC_KEYS` declaring per-key rehydration target + renderer list (e.g., `[KEYS.growth]: { global: 'growthData', renderers: { 'medical': ['renderGrowth', 'renderGrowthStats'], 'home': ['renderHome'] } }`; `[KEYS.feeding]: { global: 'feedingData', renderers: { 'diet': ['renderDietStats'], 'home': ['renderHome'] } }`; etc. for all 19 keys in `SYNC_KEYS`).
  - Add `_syncDispatchRender(lsKey, value, attribution)` that (a) writes `value` to the named module global via the writer-shim in core.js (HR boundary preserved); (b) reads active-tab via the existing `localStorage.getItem('ziva_active_tab')` / `TAB_ORDER` idiom; (c) calls the relevant renderers under try/catch; (d) returns the attribution payload for downstream toast-text composition.
  - Capture `data.__sync_updatedBy` (and `__sync_syncedAt`) in `_syncHandleSingleDocSnapshot` and `_syncHandlePerEntrySnapshot` *before* the existing `__sync_*` strip; pass it through to `_syncDispatchRender`.
  - Wire `_syncDispatchRender(lsKey, value, attribution)` into both `_syncHandlePerEntrySnapshot` (after the `save()` near line 905) and `_syncHandleSingleDocSnapshot` (after each per-key `save()` in the lsKeys loop near line 991).
  - Mute the data-toast tap-to-reload on the auto-render success path: replace `_syncShowSyncToast`'s click-to-reload with auto-dismiss-only and attribution-aware text composition (`"Bhavna updated growth · 3 entries"` shape; falls back to count-only on missing attribution). Halted-state and offline-state reload affordances are untouched.
- `split/core.js`:
  - Add `_syncSetGlobal(name, value)` writer shim — the controlled write surface to module globals from sync.js, gated through a single `case`/lookup table covering the 16 module globals declared in `SYNC_RENDER_DEPS`. Avoids `window[name] = …` indirection (HR-3 spirit) and keeps the per-key map declarative.
- `split/medical.js`:
  - Optional: thread an attribution string into the growth card's footer (one line, design-system token) showing `"Last updated by {name} · {relative-time}"` when attribution is available. Re-renders on listener fire via the `renderGrowth` already declared in `SYNC_RENDER_DEPS`. Skip if it overshoots the LOC ceiling and surface as a hygiene-queue carry-forward.
- `split/sync.js` (settings card):
  - Same one-line attribution surface in `_syncRenderSettingsUI` for member-change events on the household card.
- `tests/e2e/smoke.spec.ts`:
  - New `test.describe('Auto-refresh on listener fire (Phase 3)')` block with R-7 triad covering all three deliverables:
    - **Positive:** stub a synthetic snapshot delivery for `KEYS.growth` while the medical/growth tab is active; assert affected DOM subtree updates without `page.reload()` and within 100ms; assert module global is rehydrated by inspecting a probe that returns `growthData.length` post-fire.
    - **Regression-guard (active-tab dispatch):** synthetic fire for `KEYS.growth` while a *different* tab is active does not re-render the inactive medical-growth subtree; module global still rehydrates so the next switchTab reads fresh.
    - **Positive-regression (no spurious reload):** with auto-render enabled, no `window.location.reload()` is called on the data-toast success path (assert via navigation-event spy or `page.url()` stability across the fire).
  - **Cross-device clobber regression spec (Finding E — separate `test.describe`):** simulate the two-device scenario in a single hermetic page: (1) seed module global with `DEFAULT_GROWTH`; (2) inject a synthetic listener fire delivering `[a, b, c]`; (3) assert `growthData` rehydrated to `[a, b, c]`; (4) trigger `addGrowthEntry` for `d`; (5) assert the resulting `save(KEYS.growth, …)` payload is `[a, b, c, d]`, NOT `[…DEFAULT_GROWTH, d]`. Spies on `_syncSetGlobal` and on `localStorage.setItem` confirm the path.
  - **Attribution surfacing spec (Finding F — separate `test.describe`):** synthetic listener fire with `__sync_updatedBy: { name: 'Bhavna' }`; assert the data-toast text contains `"Bhavna"`; with attribution missing, falls back to count-only text; with self-echo (local UID matches `__sync_updatedBy.uid`), toast suppresses entirely (existing self-echo discipline preserved).
  - Cipher CT-8 floor: stress matrix `--repeat-each=5` parallel + `CI=1 --repeat-each=5` sequential, both expected to hold at `retries: 0`.

**Per-feature R-7 shape:** original triad covering each of the three deliverables. No UX mode contract currently surfaced; binary-mode unnecessary. If during build a mode contract emerges (e.g., a "freeze-on-listener-fire" preference), the triad upgrades to binary-mode per the PR-14 precedent.

**Files explicitly NOT touched in PR-9:**
- `#updateToast` and PR-5 logic — different surface (Finding D).
- Module globals' init seeding in `core.js:680–712` — left untouched; the writer-shim wraps assignment without changing the seed path.
- The household-listener `_syncRenderSettingsUI()` precedent — already in place; no rewiring needed beyond the optional attribution line.
- `__sync_*` write metadata — already shaped correctly (sync.js:739–742, :1067–1070, :1093–1095); Phase 3 only reads it.

### PR-10 (optional) — Hygiene sweep at threshold (R-10)

Folds at R-10 threshold (3–5 items). See §6 below for the carry-forward inventory and disposition.

### PR-11 / Phase 3 close

Aurelius post-merge close artifact + chronicle hand-off. No code in PR-11; it is the close-of-phase commit (parallels Phase 2 PR-14 close framing).

---

## 5. Acceptance — Phase 3 closes when

1. A remote Firestore listener fire (per-entry or single-doc) updates the corresponding module global *and* the active tab's affected DOM subtree without `window.location.reload()`.
2. The DOM update is visible under 100ms in hermetic tests (well inside the briefing's 2-3s SLO with margin for real-network round-trip).
3. UI state survives the auto-render: scroll position, expanded-card state, modal state, and quick-log inputs are not destroyed by the listener fire.
4. **Cross-device growth convergence (Finding E).** A synthetic listener fire that delivers `[a, b, c]` causes the local module global `growthData` to rehydrate; a subsequent local `addGrowthEntry(d)` produces a save payload of `[a, b, c, d]`, NOT `[…DEFAULT_GROWTH, d]`. The clobber loop is closed.
5. **Attribution surfacing (Finding F).** When `__sync_updatedBy.name` is present on the snapshot, the data-toast text names the updater (e.g., `"Bhavna updated growth · 3 entries"`). When absent, falls back to count-only. When the local user is the writer (self-echo), the toast suppresses as it does today.
6. PR-5's `#updateToast` (SW update path) is regression-guarded — it still routes through `data-action="syncReload"` and still reloads on tap, since SW-shell swap requires a reload.
7. The household-listener `_syncRenderSettingsUI()` precedent is regression-guarded — Settings tab in-place rendering on member changes still works (and gains the optional attribution line).
8. Auto-render failure path is regression-guarded — if `_syncDispatchRender` throws, the existing toast-with-reload fallback engages (graceful degradation per briefing).
9. Playwright at `retries: 0` passes 100/100 across the three stress configs (`02-habits.md`). Cipher independent re-run matches at the R-4 floor.

---

## 6. Hygiene queue (R-10; flush at 3–5)

### Carry-forwards from Phase 2 with disposition

| # | Item | Phase 2 disposition | Phase 3 disposition |
|---|---|---|---|
| 1 | Simple-mode tab realignment (hide History, unhide Insights) | Sovereign-deferred | **Defer further** — UX scope-bin, out of Phase 3 concern. |
| 2 | `pnpm build` automation script | Post-Phase-2 candidate; Cipher recommended landing before Phase 3 | **Fold into PR-8 (arming, optional)** — see §4. |
| 5 | `beta/` frozen | Locked, no Phase 2 work touched | **Keep frozen** — Phase 3 is province-only; no `beta/` involvement. |
| 8 | Telemetry-shaped AbortError-vs-CORS-vs-network discrimination | Deferred (structurally collapsed in current SW) | **Defer further** — telemetry surface not yet warranted by Phase 3 work. |

### New surfacings (track here through PR-9 build)

- *Reserved* — items added during build per the standard hygiene-queue discipline.

R-10 threshold remains 3–5 items. Below threshold, items wait for Phase 4 or a dedicated sweep PR; at threshold, PR-10 flushes.

---

## 7. Sequencing risk + Hour-64 fallback

- **Hour clock:** Charter at Hour ~37; Phase 3 budget is Hours 48–72 per the briefing. Opening early gives ~10h of slack before the budget window even starts. Charter <2h, optional arming PR-8 ~2h, feature PR-9 ~6–10h with iteration, close ~2h. Total ~12–16h within a ~24h+10h-slack window.
- **Hour-64 C-fallback trigger:** if PR-9 has not reached ack by Hour 64 of campaign clock (8h before Hour 72 close), revert to Option C — close Phase 3 with the charter + arming + Phase 4 carry-forward note. Reserves the ~8h tail for Hour 72 chronicle, Cabinet review prep, and session-close handoff artifacts.
- **PR-5 / Phase 3 distinction risk:** carried over from Phase 2 charter §7 — the SW-update reload (PR-5) and the data-fire auto-render (Phase 3) live on different DOM nodes (`#updateToast` vs dynamically-created `syncToast`) and address different concerns. Surfaced explicitly in Finding D so a future reader does not collapse them.

---

## 8. Operating mode (relay-only)

Per the Phase 3 opening directive, this campaign runs **relay-only** — distinct from Phase 2's polling cadence:

- **No `subscribe_pr_activity` calls from Lyra.** Charter, arming, and feature PRs are opened, pushed, and stood by.
- **Cipher reviews via Sovereign relay.** Verdicts arrive in-context when Sovereign pastes them; no Lyra-side polling.
- **Aurelius + Sovereign close the merge gate.** Aurelius posts final review per relay; Sovereign nods; Aurelius squash-merges. No Lyra-side fetch on wake.
- **Persistent PAT carry-over.** Sovereign holds the rishabh1804/sproutlab fine-grained PAT from Phase 2 (per the *persistent-PAT-for-active-province-campaigns* doctrine ratified PR-13). If revoked, Lyra requests rotation only when payload limits would block a push (e.g., rebuild commits, multi-file atomic features).

---

## 9. Review path

- **Cipher (advisory):** verify Findings A / B / C against the cited line numbers (sync.js:802–836 for the listener triad, intelligence.js:10773–10861 for the active-tab idiom precedent, core.js:680–712 for the module-global seed, sync.js:120–140 for `SYNC_KEYS`). Probe the Option B sequence for D8 framing slips. Comment on the optional PR-8 arming disposition. Sign-off shape: `— Cipher (advisory)`.
- **Aurelius + Sovereign:** ratify A / B / C and the optional PR-8 disposition. R-14: charter is comm-log → Aurelius solo by default, but option choice is structural enough that Sovereign's nod is requested. Squash-merge on ratification.

→ **Cipher:** advisory review requested (relay-only).
→ **Aurelius / Sovereign:** ratify Option A / B / C; rule on PR-8 (fold-in vs drop); ratify the R1 scope expansion (Findings E + F folded into PR-9 vs split off as PR-9.5). Without ruling, no feature code lands.
→ **Sovereign:** ratify Hour-64 as the C-fallback trigger; ratify relay-only operating mode for Phase 3 (note: PR #15 was subscribed to PR activity post-open via your webhook directive — relay-only stands as the human-loop posture; webhook events are passive).

— Lyra (The Weaver)
