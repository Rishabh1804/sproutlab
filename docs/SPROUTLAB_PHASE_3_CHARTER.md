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

---

## 3. Charter divergence (R-8 option framing)

Per R-8 / Edict V, surface in-flight when the briefing's literal description rests on premises the scout disproves. Finding B is a structural premise the briefing conflated; Finding D is a surface the briefing did not isolate.

### Option A — Execute literally

- Wire a render call from each listener handler, passing the active tab. Read renderers run from stale module globals (Finding B) and surface user-visible inconsistency between sync-toast count and rendered values.
- Keep "tap to refresh" as the fallback (per briefing) but mask the underlying staleness instead of fixing it.

**Verdict:** delivers the literal bullets without the user-facing intent ("remote changes visible within 2-3s"). Renders stale. Not recommended.

### Option B — Refit briefing intent to province reality (recommended)

Intent: *"remote data deltas reach the open tab without user action, without losing UI state."*

1. **Rehydrate-on-fire dispatch.** Add a per-key dispatch table (`SYNC_RENDER_DEPS`) sibling to `SYNC_KEYS`, declaring rehydration and renderer dependencies. The two listener handlers, after `save(lsKey, entries)`, call a new `_syncDispatchRender(lsKey)` that (a) reseeds the module global from `entries` and (b) re-runs the active-tab subset of declared renderers.
2. **Eager re-render replaces tap-to-reload on `#syncToast`.** The toast becomes a non-blocking acknowledgement ("synced n updates") that auto-dismisses; the click handler is removed entirely on the auto-render path. Halted-state and offline-state toasts (sl-1-2 / sl-1-3) keep their existing `data-action="syncReload"` since those represent state the auto-render path cannot recover from.
3. **Graceful fallback.** If `_syncDispatchRender` throws (renderer crash, missing global), catch + log via `_syncRecordCrash` and fall back to the current toast-with-reload shape. Auto-render is a *progressive enhancement* over the current reload path; never a regression.
4. **Acceptance test (R-4 + R-7).** Hermetic Playwright spec: stub a remote snapshot delivery via `page.evaluate` invoking the listener callback with synthetic data; assert the affected DOM subtree updates in-place under 100ms (well under the 2-3s SLO) without page navigation; assert scroll position and any expanded card state survive.

**Per-feature R-7 shape:** original triad (positive / regression-guard / positive-regression) is the default. Phase 3 features do not currently expose a UX *mode contract* (auto-render is universally beneficial; there is no opt-out surface). If a feature surfaces such a contract during build (e.g., a "preserve current view" preference), the binary-mode triad gets layered in per the Phase 2 PR-14 precedent.

**Verdict:** delivers the user-facing intent, scoped against the actual renderer architecture. Smaller LOC than Option A's stale-render workaround would require to mask correctly. Recommended.

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

### PR-9 — Listener-fire dispatch (the feature)

The single Phase 3 feature PR under Option B. Likely 120–180 LOC source + 60–90 LOC tests; sits within R-9 single-PR threshold.

**Files (target):**
- `split/sync.js`:
  - Add `SYNC_RENDER_DEPS` map sibling to `SYNC_KEYS` declaring per-key rehydration target + renderer list (e.g., `[KEYS.feeding]: { global: 'feedingData', renderers: { home: 'renderHome', diet: 'renderDietStats' } }`).
  - Add `_syncDispatchRender(lsKey, value)` that (a) writes the rehydrated value to the named module global via a small writer-shim defined in core.js (HR boundary preserved); (b) reads active-tab via the existing `localStorage.getItem('ziva_active_tab')` / `TAB_ORDER` idiom; (c) calls the relevant renderers under try/catch.
  - Wire `_syncDispatchRender(lsKey, entries|cleanData)` into both `_syncHandlePerEntrySnapshot` (after the `save()`) and `_syncHandleSingleDocSnapshot` (after each per-key `save()` in the lsKeys loop).
  - Mute the data-toast tap-to-reload: replace `_syncShowSyncToast`'s click-to-reload with auto-dismiss-only on the auto-render success path. Halted-state and offline-state reload affordances are untouched.
- `split/core.js`:
  - Add `_syncSetGlobal(name, value)` writer shim — the controlled write surface to module globals from sync.js, gated through a single `case` table. Avoids `window[name] = …` indirection (HR-3 spirit) and keeps the per-key map declarative.
- `tests/e2e/smoke.spec.ts`:
  - New `test.describe('Auto-refresh on listener fire (Phase 3)')` block with R-7 triad:
    - **Positive:** stub a synthetic snapshot delivery; assert affected DOM subtree updates without `page.reload()` and within 100ms; assert active-tab dispatch (e.g., diet-key fire while diet tab is active updates `#dietStats` value).
    - **Regression-guard:** synthetic fire while a *different* tab is active does not re-render the inactive tab's DOM (no wasted work / no spurious DOM mutation visible to the user).
    - **Positive-regression:** with auto-render enabled, no `window.location.reload()` is called on the data-toast path (assert via navigation-event spy or by inspecting that `page.url()` is stable across the fire).
  - Cipher CT-8 floor: stress matrix `--repeat-each=5` parallel + `CI=1 --repeat-each=5` sequential, both expected to hold at `retries: 0`.

**Per-feature R-7 shape:** original triad (no UX mode contract surfaced; binary-mode unnecessary). If during build a mode contract emerges (e.g., a "freeze-on-listener-fire" pref), the triad upgrades to binary-mode per the PR-14 precedent.

**Files explicitly NOT touched in PR-9:**
- `#updateToast` and PR-5 logic — different surface (Finding D).
- Module globals' init seeding in `core.js:680–712` — left untouched; the writer-shim wraps assignment without changing the seed path.
- The household-listener `_syncRenderSettingsUI()` precedent — already in place; no rewiring needed.

### PR-10 (optional) — Hygiene sweep at threshold (R-10)

Folds at R-10 threshold (3–5 items). See §6 below for the carry-forward inventory and disposition.

### PR-11 / Phase 3 close

Aurelius post-merge close artifact + chronicle hand-off. No code in PR-11; it is the close-of-phase commit (parallels Phase 2 PR-14 close framing).

---

## 5. Acceptance — Phase 3 closes when

1. A remote Firestore listener fire (per-entry or single-doc) updates the corresponding module global *and* the active tab's affected DOM subtree without `window.location.reload()`.
2. The DOM update is visible under 100ms in hermetic tests (well inside the briefing's 2-3s SLO with margin for real-network round-trip).
3. UI state survives the auto-render: scroll position, expanded-card state, modal state, and quick-log inputs are not destroyed by the listener fire.
4. PR-5's `#updateToast` (SW update path) is regression-guarded — it still routes through `data-action="syncReload"` and still reloads on tap, since SW-shell swap requires a reload.
5. The household-listener `_syncRenderSettingsUI()` precedent is regression-guarded — Settings tab in-place rendering on member changes still works.
6. Auto-render failure path is regression-guarded — if `_syncDispatchRender` throws, the existing toast-with-reload fallback engages (graceful degradation per briefing).
7. Playwright at `retries: 0` passes 100/100 across the three stress configs (`02-habits.md`). Cipher independent re-run matches at the R-4 floor.

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
→ **Aurelius / Sovereign:** ratify Option A / B / C; rule on PR-8 (fold-in vs drop). Without ruling, no feature code lands.
→ **Sovereign:** ratify Hour-64 as the C-fallback trigger; ratify relay-only operating mode for Phase 3.

— Lyra (The Weaver)
