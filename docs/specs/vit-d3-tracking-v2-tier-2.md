# Vit D3 Tracking v2 — Tier 2 spec

**Spec version:** v2-tier-2 (drafted post-Tier-1 ratification at PR #122 merge `94c9ba5`)
**Date:** 2026-05-24
**Branch:** `claude/vit-d3-v2-tier-2-spec`
**Author:** Lyra (main-session — Mode-1 spec authoring)
**Promoted from:**
- `docs/specs/vit-d3-tracking-v2-backlog.md` §Tier 2 (T2-7..T2-12) — six care-tier UX / surface-quality items from the original PR #116 v2 backlog
- `docs/specs/vit-d3-tracking-v2.md` §Deferred to Tier 2 — eight Governor findings folded out of the Tier 1 chain (V-M-77/78/79/81, V-K-91/94/95, V-V-25/30)
**Status:** v0 — spec-only PR; implementation runs as separate Tier-2-impl PRs grouped by phase (see §Phasing)

---

## What Tier 2 is

The work that v1 + Tier 1 collectively left behind: care-tier UX polish, audit-trail integrity at the lifecycle edges (chained undo, sync races), comprehension-surface refinement (chip discriminators, Undo affordance), write-path defence-in-depth, and a small amount of doctrine note-taking that didn't fit elsewhere.

**Severity profile:** none of the Tier 2 items individually justifies a hotfix — Tier 1 captured every HIGH/MEDIUM-severity verified bug. Tier 2 is the half-awake-test quality bar plus the audit-doctrine completeness work.

**What Tier 2 is NOT:**
- Tier 3 (T3-13 AM/PM range validation, T3-15 fresh-install warm-start length=0) — remains in the backlog file as defensive / latent
- Noise tier (WR-2..WR-7 et al.) — canon-noted only; no Tier 2 work allocated
- New Vit D3 features. The spec scope is correctness + comprehension on the v1+T1 implementation only.

## Phasing

Fourteen items across four Regions. The spec recommends three implementation PRs to keep canon-cc-008 chains manageable:

| Phase | Items | Region focus | Approximate scope |
|---|---|---|---|
| **2-A** | T2-7, T2-8, V-V-25 | Vela primary (pattern card render + chip CSS); medical.js + styles.css; triple-jurisdiction on styles.css | 1 PR |
| **2-B** | T2-9, T2-10, T2-11, T2-12, V-M-77 | Maren primary (write-path defence + outing-planner); home.js | 1 PR |
| **2-C** | V-M-78, V-M-79, V-K-94, V-K-95, V-V-30 | Cross-cutting — audit/sync schema + Undo affordance; home.js + core.js + sync.js + intelligence-quicklog.js | 1 PR |

V-M-81 and V-K-91 are doctrine notes (no code) — they fold into 2-C's spec doc revisions.

Phases are independent. Order recommendation: 2-A first (smallest, validates the chip-discriminator approach), then 2-B (most items but contained to home.js + Maren), then 2-C (highest cross-cut, benefits from earlier patterns having landed).

---

## Phase 2-A — Pattern card + chip discriminator (Vela primary)

### T2-A.1 (was T2-7) — Adherence denominator + unloggedDays exclude today

**File:** `split/medical.js:4406, 4419`
**Trigger:** Day 14 of a perfect streak at 8 AM (today not yet logged). Card reads three contradictory lines:
- "Adherence: 13/14 days (93%)"
- "1 day not logged in this window"
- "Streak through yesterday: 13 days"

V-M-64 fixed the streak label; the adherence math + the warn-tier "N days not logged" still punish a perfect-streak parent for the pre-dose morning gap.

**Fix shape:**
```js
// At adherence + unloggedDays computation
const todayParsed = eligibleDays.length > 0 ? eligibleDays[eligibleDays.length - 1].parsed : null;
const excludeToday = !todayParsed && eligibleDays[eligibleDays.length - 1].date === todayStr;
const adherenceWindow = excludeToday ? eligibleDays.slice(0, -1) : eligibleDays;
const adherenceDone   = adherenceWindow.filter(d => d.parsed && (d.parsed.status === 'done' || d.parsed.status === 'late'));
const unloggedDays    = adherenceWindow.filter(d => !d.parsed);
```

The V-M-64 streak logic already excludes today via `startIdx = todayResolved ? len-1 : len-2`; the adherence + unloggedDays surfaces follow suit. All three lines now agree at the boundary.

**Test:** `tier-2-a-pattern-card-excludes-today-from-adherence-on-unlogged-morning`.

---

### T2-A.2 (was T2-8) — Streak preserves through-yesterday fallback on legitimate skip

**File:** `split/medical.js:4399`
**Trigger:** Parent legitimately skips today (sick, dose-form change, doctor advice). Streak walks the `startIdx = todayResolved ? len-1 : len-2` branch but `todayResolved` is true (skipped IS a resolved status per V-M-64), so it starts at `len-1`, finds `status !== done && !== late`, breaks immediately → `streak = 0`. Card shows "Current streak: 0 days" — historical context erased.

**Fix shape:** Extend V-M-64's exclude-today logic to treat status:'skipped' the same as todayResolved=false for streak-walking purposes:

```js
const todayParsed = eligibleDays.length > 0 ? eligibleDays[eligibleDays.length - 1].parsed : null;
const todayIsSkippedOrUnlogged = !todayParsed || todayParsed.status === 'skipped';
const startIdx = todayIsSkippedOrUnlogged ? eligibleDays.length - 2 : eligibleDays.length - 1;
if (todayIsSkippedOrUnlogged) streakLabel = 'Streak through yesterday';
```

Skipped today + 30-day perfect streak prior → "Streak through yesterday: 30 days" instead of "Current streak: 0 days."

**Test:** `tier-2-a-pattern-card-skip-today-preserves-through-yesterday-streak`.

---

### T2-A.3 (V-V-25, Vela) — Skipped chip CSS discriminator

**Files:** `split/styles.css` (new class), `split/intelligence-quicklog.js` (apply class on render)
**Trigger:** Post-T1-3 a Skipped chip and a Done chip in the TSF timeline at the same time are pixel-identical except for the one-word detail string ("Skipped" vs "Done"). Half-awake parent at 2 AM may miss the detail line.

**Fix shape:**

```css
/* styles.css — new variant */
.tsf-event[data-state="skipped"] .tsf-event-label {
  text-decoration: line-through;
  text-decoration-color: var(--tc-warn);
  color: var(--light);
}
.tsf-event[data-state="skipped"] .tsf-event-time {
  color: var(--tc-warn);
  opacity: 0.7;
}
.tsf-event[data-state="skipped"] .icon { opacity: 0.6; }
```

```js
// intelligence-quicklog.js TSF render — apply data-state on the chip wrapper
const stateAttr = (ev.parsed && ev.parsed.status === 'skipped') ? ' data-state="skipped"' : '';
html += '<div class="tsf-event' + inferredClass + liveClass + '"' + stateAttr + ' data-action="tsfToggleEvent" ...';
```

Visual outcome: skipped chip = struck-through label, warn-color time slot, faded icon. Distinguishable from a Done chip at a glance under partial attention.

**Triple-jurisdiction review:** styles.css touch triggers canon-gen-001 sequential review (rotation Maren → Kael → Vela, first-Governor by heaviest-touched Region — Vela here).

**Test:** `tier-2-a-skipped-chip-has-state-attr-and-strikethrough`.

---

## Phase 2-B — Write-path defence (Maren primary)

### T2-B.1 (was T2-9) — markMedDone defers withFat:false badge before any meal logged

**File:** `split/home.js:906` (markMedDone)
**Trigger:** Half-awake morning. Parent gives D3 at 7:55 AM before logging breakfast. `_detectFatContextNearTime` finds no meal in window → `withFat:false`. Reminder card immediately shows "no fat-meal logged nearby" badge — false negative because the parent simply hasn't logged the meal yet.

**Fix shape:** Three-state schema for early-morning ambiguity. When detection finds no meal AND `feedingData[today]` has zero meals logged AT ALL, write `withFat:null` (unknown) instead of `withFat:false`:

```js
const fat = _detectFatContextNearTime(givenAt, todayStr);
const dayFeed = feedingData[todayStr] || {};
const noMealsLoggedToday = !['breakfast','lunch','dinner','snack'].some(m => (dayFeed[m] && dayFeed[m].trim()));
const writeWithFat = (fat.withFat === false && noMealsLoggedToday) ? null : fat.withFat;
```

The refresh helper at `_refreshTodayMedWithFat` already flips null/false → true on first meal save (per CR-14 + T1-1 doctrine), so the unknown state self-resolves once the parent logs breakfast.

**Render side:** the reminder card render at the "no fat-meal logged nearby" badge currently shows for `withFat:false`. Extend to suppress for `withFat:null` (unknown):

```js
const showNoFatBadge = (parsed.withFat === false); // null doesn't trigger
```

**Test:** `tier-2-b-markdone-before-any-meal-writes-null-not-false`.

---

### T2-B.2 (was T2-10) — adjustMedTime midnight rollover wedge

**File:** `split/home.js:1005` (openMedAdjust → confirmMedAdjust → adjustMedTime)
**Trigger:** Parent opens Adjust at 23:58, taps Save at 00:01. `today()` returns the NEW date; the record is on the prior date's key. adjustMedTime silently no-ops because `medChecks[newTodayStr][name]` is undefined. Editor wedged in the now-empty new-date slot.

**Fix shape:** Capture todayStr at openMedAdjust time, thread it through:

```js
function openMedAdjust(name, idx) {
  // ...existing code...
  const capturedToday = today();
  actionRow.innerHTML =
    hint +
    '<input type="time" class="supp-time-input" id="supp-time-' + idx + '" value="' + escAttr(norm) + '" data-captured-day="' + escAttr(capturedToday) + '">' +
    '<button class="supp-check-btn" data-action="confirmMedAdjust" data-arg="' + escAttr(name) + '" data-arg2="' + idx + '">Save</button>' +
    // ...
}

function confirmMedAdjust(name, idx) {
  const input = document.getElementById('supp-time-' + idx);
  const picked = input && input.value ? input.value : null;
  const capturedToday = input && input.dataset.capturedDay;
  // ...validation...
  adjustMedTime(name, idx, picked, capturedToday);
}

function adjustMedTime(name, idx, newTime, dayStr) {
  const todayStr = dayStr || today();
  // ...existing logic operates on todayStr (which may be yesterday post-rollover)
  if (todayStr !== today()) {
    if (typeof showQLToast === 'function') showQLToast(zi('warn') + ' Date changed — please re-open Adjust on yesterday\'s record');
    renderRemindersAndAlerts();
    return;
  }
  // ...rest of the function unchanged
}
```

Toast on rollover so the parent knows why the editor closed without saving.

**Test:** `tier-2-b-adjust-midnight-rollover-toasts-and-no-ops-cleanly`.

---

### T2-B.3 (was T2-11) — Reject future times in confirmMedDoneAt + confirmMedAdjust

**File:** `split/home.js:944` (confirmMedDoneAt) + `:1014` (confirmMedAdjust precursor before adjustMedTime)
**Trigger:** Parent mistypes 23:00 when they meant 11:00. adjustMedTime stamps the future time, re-runs detection → withFat flips true→false (no fat-meal at 23:00). C-1.5 with-fat denominator corrupts silently.

(T1-1 now preserves withFat:true so the corruption surface is narrower than the backlog described, but the corruption is still real — the next day's pattern card uses the wrong-time record.)

**Fix shape:** Add a future-time check in both confirm-handlers:

```js
function confirmMedDoneAt(name, idx) {
  const input = document.getElementById('supp-time-' + idx);
  const picked = input && input.value ? input.value : null;
  if (!picked || !/^\d{1,2}:\d{2}$/.test(picked)) { /* existing CR-4 toast */ return; }
  if (_hhmmToMinutes(picked) > _hhmmToMinutes(_currentHHMM())) {
    if (typeof showQLToast === 'function') showQLToast(zi('warn') + ' Time must be in the past');
    if (input) { try { input.focus(); } catch(e) {} }
    return; // editor stays open
  }
  markMedDone(name, idx, picked);
}
// Mirror in confirmMedAdjust.
```

Helper `_currentHHMM()` may need a thin wrapper if it doesn't exist; pattern matches existing `_hhmmToMinutes` use.

**Test:** `tier-2-b-confirm-rejects-future-time-keeps-editor-open`.

---

### T2-B.4 (was T2-12) — Outing-planner D3 not suppressed by skip-as-resolved

**File:** `split/home.js:5371` (`_obCheckVitD3`); callers at `:5105, :5308` (outing pack-list + outing give-list)
**Trigger:** V-M-67/74's "skip counts as resolved" doctrine was for the home overlay (parent sees the dose as handled). The same helper services the outing-planner packing list and the outing give-list. A 7 AM misclick-skip silently suppresses D3 packing for an afternoon outing.

**Fix shape:** Intent-aware helper that routes the skip semantic per call site:

```js
function _obCheckVitD3Needed(intent) {
  // intent: 'overlay' | 'outing-pack' | 'outing-give'
  // overlay: skip = resolved (parent handled it; don't nag)
  // outing-pack: skip != resolved (still pack; parent might undo)
  // outing-give: skip != resolved (still surface as a checkable item on the outing)
  const t = today();
  const d3 = (meds || []).find(m => m.active && m.name && m.name.toLowerCase().indexOf('d3') >= 0);
  if (!d3) return false;
  const todayCheck = medChecks[t] && medChecks[t][d3.name];
  if (medCheckIsDone(todayCheck)) return false; // done is universally resolved
  if (intent === 'overlay' && medCheckSkipped(todayCheck)) return false;
  return true;
}
// Update the three callers to pass intent.
```

**Test:** `tier-2-b-outing-pack-still-surfaces-d3-after-morning-skip`.

---

### T2-B.5 (V-M-77, Maren) — preserveWithFat truth-table tightening

**File:** `split/home.js:1043` (adjustMedTime)
**Trigger:** Currently dead — `_detectFatContextNearTime` always returns a boolean per `core.js:179-214` — but doctrine-cleaner. `(existing.withFat === true && fat.withFat === false)` should be `(existing.withFat === true && fat.withFat !== true)` so a future detector that legitimately returns null doesn't accidentally erase a positive observation.

**Fix shape:** one-character delta:

```js
const preserveWithFat = (existing.withFat === true && fat.withFat !== true);
```

**Test:** `tier-2-b-adjust-preserve-withfat-against-null-detection`. Test by injecting a stub `_detectFatContextNearTime` that returns `withFat:null` for the duration of the test, verifying preservation.

---

## Phase 2-C — Audit/sync integrity + TSF Undo affordance (cross-cutting)

### T2-C.1 (V-M-78, Maren) — Chained-undo audit preservation

**File:** `split/home.js:996` (undoMedSkip)
**Trigger:** Skip → undo → skip → undo. Second cycle's `parsedExisting` is null (cleared parses to null per T1-6) → falls into the `else { delete }` branch → first cleared's `priorLoggedAt` is destroyed. Audit chain breaks at the second cycle.

**Fix shape:** Inspect the raw slot (not the parsed view) to detect cleared records and preserve their priorLoggedAt:

```js
function undoMedSkip(name, idx) {
  const todayStr = today();
  const rawExisting = medChecks[todayStr] && medChecks[todayStr][name];
  if (rawExisting !== undefined) {
    const isCleared    = (rawExisting && typeof rawExisting === 'object' && rawExisting.status === 'cleared');
    const parsedExisting = parseMedCheck(rawExisting);
    // Preserve the most-recent prior audit: from a skipped (loggedAt) OR from a previous cleared (priorLoggedAt)
    const priorLoggedAt = (parsedExisting && parsedExisting.status === 'skipped')
      ? (parsedExisting.loggedAt || null)
      : (isCleared ? rawExisting.priorLoggedAt : null);
    const priorStatus   = (parsedExisting && parsedExisting.status === 'skipped')
      ? 'skipped'
      : (isCleared ? rawExisting.priorStatus : null);
    if (priorStatus) {
      // Write a fresh cleared sentinel preserving the audit chain
      const now = new Date();
      const clearedAt = now.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
      medChecks[todayStr][name] = {
        status: 'cleared', givenAt: null, loggedAt: null,
        withFat: null, fatFood: null, fatDelta: null,
        priorStatus, priorLoggedAt, clearedAt,
      };
    } else {
      delete medChecks[todayStr][name];
    }
    save(KEYS.medChecks, medChecks);
    _tsfMarkDirty();
    _islMarkDirty('medical');
  }
  renderRemindersAndAlerts();
  renderHomeContextAlerts();
  if (typeof renderMedD3PatternCard === 'function') renderMedD3PatternCard();
}
```

Implication for V-K-94 (below): the audit consumer must tolerate a single `priorLoggedAt` even after multiple skip/undo cycles. If full multi-history is desired, see V-K-95 below.

**Test:** `tier-2-c-chained-undo-preserves-most-recent-priorLoggedAt`.

---

### T2-C.2 (V-M-79, Maren) — Fallback delete telemetry

**File:** `split/home.js` undoMedSkip `else { delete }` branch
**Trigger:** Sync race or future undocumented call path could reach the fallback branch with a non-skipped record (done, late). Silent delete loses audit trail without surfacing.

**Fix shape:**

```js
} else {
  // V-M-79: undoMedSkip is wired to the skipped-card Undo button per V-M-68. Reaching
  // here means a non-skipped, non-cleared record exists — likely a sync-race overwrite or
  // a future dispatch that didn't gate. One-shot warn so the deletion is visible.
  if (typeof console !== 'undefined') console.warn('[undoMedSkip] unexpected non-skipped record; deleting', { name, status: parsedExisting && parsedExisting.status });
  delete medChecks[todayStr][name];
}
```

**Test:** none (telemetry-only; not a behavioral surface).

---

### T2-C.3 (V-K-94, Kael) — Schema-drift consumer obligation (doctrine)

**File:** `docs/specs/vit-d3-tracking-v2.md` — addendum + new section in core.js comment block at `parseMedCheck`
**Doctrine note:** Any future audit consumer of `priorStatus` / `priorLoggedAt` / `clearedAt` must:
1. Tolerate the fields being **absent** on legacy records written pre-PR-122
2. Tolerate the fields being **null** (T2-C.1 preserves `priorStatus = null` when no prior audit exists — the fallback delete branch was supposed to clear it but a future path might not)
3. NOT assume a singular history — V-K-95 below may introduce a `priorHistory[]` array of `{status, loggedAt, clearedAt}` triples replacing the singular fields. Any consumer that ships before V-K-95 must accept either shape.

**Fix shape:** Doctrine prose only. Append to the spec; add an inline comment near the cleared-status guard at `core.js:78-84`:

```js
// T1-6 (v2): cleared sentinel. Future audit consumers — TOLERANCE CONTRACT:
//   1) Legacy records (pre-PR-122) lack priorStatus / priorLoggedAt / clearedAt entirely.
//   2) priorStatus may be null when V-M-79's fallback-delete path was bypassed.
//   3) V-K-95 (Tier 2-C) may replace the singular fields with priorHistory[].
//   Consumers must accept all three shapes.
if (val.status === 'cleared') return null;
```

---

### T2-C.4 (V-K-95, Kael + Maren) — Sync-race multi-history (optional schema upgrade)

**File:** `split/home.js` undoMedSkip + `split/sync.js` (no actual sync change; Firestore single-doc merge accepts the new field shape natively)
**Trigger:** Two-device simultaneous undo. Both write a cleared sentinel; `clearedAt` carries each device's local wall-clock. Firestore last-write-wins → one device's `clearedAt` is lost. Acceptable for v2-Tier-1; v2-Tier-2 has the option to upgrade.

**Decision point:** ship multi-history schema OR document the loss and move on?

**Option A — multi-history schema** (`priorHistory[]` array):
```js
medChecks[todayStr][name] = {
  status: 'cleared', givenAt: null, loggedAt: null,
  withFat: null, fatFood: null, fatDelta: null,
  priorHistory: [{
    status: priorStatus,
    loggedAt: priorLoggedAt,
    clearedAt: clearedAt,
    device: _getDeviceId ? _getDeviceId() : 'local',  // V-K-95: per-device disambiguation
  }],
  // Singular fields retained for back-compat:
  priorStatus, priorLoggedAt, clearedAt,
};
```

Firestore single-doc merge on `priorHistory[]` last-write-wins on the array (Firestore doesn't merge array contents) — so two devices still clobber. Real multi-device audit needs a server-side merge function OR a separate `medChecks_audit` collection with append-only writes. **Substantially higher scope.**

**Option B — document the loss, no schema change**: append doctrine note to T2-C.3 doctrine block.

**Recommendation:** Option B for Tier 2. The sync race is rare (both devices undoing the SAME skip near-simultaneously requires unusual coordination) and the loss is one timestamp on what's already a low-value audit corner. Defer real multi-device audit to a Tier 3 / dedicated sync-architecture arc if ever needed.

**Test:** none (Option B); none currently runnable for Option A absent a multi-device test harness.

---

### T2-C.5 (V-V-30, Vela) — TSF Undo affordance on skipped chips

**Files:** `split/intelligence-quicklog.js` `_tsfRenderEventExpanded` (skipped med branch) + `split/styles.css` (Undo button styling reuses existing supp-skip-btn if possible)
**Trigger:** Post-T1-3 a Skipped chip appears in TSF at the audit-trail time. Parent realizes misclick. Has to navigate to home tab → reminder card → Undo. Cross-Region surface gap.

**Fix shape:** Add Undo button to the expanded-detail view of skipped med chips:

```js
// inside _tsfRenderEventExpanded for med events:
if (parsedStatus && parsedStatus.status === 'skipped') {
  html += '<div class="tsf-event-action-row">';
  html += '<button class="tsf-event-action-btn" data-action="undoMedSkip" data-arg="' + escHtml(ev.label) + '" data-arg2="0">' + zi('undo') + ' Undo skip</button>';
  html += '</div>';
}
```

The `data-arg2="0"` is a TSF-context dummy idx — undoMedSkip uses it only to find a DOM element by id (`supp-alert-' + idx`). The TSF expansion does not render a `supp-alert-` element, so the element lookup at undoMedSkip will fail silently — falling through to the slot-clear + re-render path, which is what we want. Re-renders will refresh both TSF AND the home reminder card automatically.

**Triple-Region pair-note:** Maren validates the undoMedSkip wiring still operates correctly when called from a non-home context. Kael validates `undoMedSkip` doesn't assume DOM ordering. Vela owns the chip rendering.

**Test:** `tier-2-c-tsf-skipped-chip-undo-button-clears-slot`.

---

## Doctrine notes (no code)

### V-M-81 — Midnight-rollover cleared crosses to ydMissed

Already documented in `docs/specs/vit-d3-tracking-v2.md` §Deferred to Tier 2 row V-M-81. This spec re-affirms: parent who undoes a 23:55 skip and never logs anything before midnight will see "Yesterday's meds not logged" danger strip the next morning. This is **care-tier correct** (the dose was, in fact, not given) — the framing language stays. No code change.

### V-K-91 — _refreshTodayMedWithFat performance

Three render passes per `mutated===true` flip. Fires only when a parent logs a fat-bearing meal that retroactively triggers a withFat:false → true flip — a per-day-once event at most. Performance acceptable; no change required. Recorded so future profiling work doesn't flag this as a hot spot.

---

## Phasing summary

| Phase | Items | Files touched | Region routing |
|---|---|---|---|
| 2-A | T2-A.1, T2-A.2, T2-A.3 | medical.js, styles.css, intelligence-quicklog.js | Vela primary (chip + pattern card); triple-jurisdiction on styles.css |
| 2-B | T2-B.1, T2-B.2, T2-B.3, T2-B.4, T2-B.5 | home.js | Maren primary |
| 2-C | T2-C.1, T2-C.2, T2-C.3, T2-C.4 (Option B), T2-C.5 | home.js, core.js (comment), intelligence-quicklog.js | Maren + Kael + Vela (cross-cutting); no styles.css → no triple-jurisdiction |

## Test plan (across all three phases)

Each phase ships its own regression suite:
- `tests/e2e/vit-d3-tracking-v2-tier-2-a.spec.ts`
- `tests/e2e/vit-d3-tracking-v2-tier-2-b.spec.ts`
- `tests/e2e/vit-d3-tracking-v2-tier-2-c.spec.ts`

Existing v1 + v2 regression suites stay green throughout (one of the implicit constraints — Tier 2 does not break Tier 1 + v1 surface contracts).

## Out-of-scope (Tier 2 closes when 2-C merges)

What remains in the broader backlog after Tier 2:
- **Tier 3** (defensive / latent) — T3-13 (AM/PM range), T3-15 (warm-start length=0) — `docs/specs/vit-d3-tracking-v2-backlog.md` §Tier 3
- **Noise tier** — canon-noted only; no work allocated
- **Beyond v2** — any net-new Vit D3 feature work would be a v3 spec

— Lyra, 2026-05-24, Tier 2 spec v0 draft. Phases ratified at Architect-level; canon-cc-008 chain runs per-phase at implementation time.
