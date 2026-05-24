# Vit D3 Tracking v2 — backlog

**Status:** drafted 2026-05-24. Carried forward from PR #116 v1 closeout.
**Authority:** Architect-directed closeout — "v1 done per council recommendation."
**Source:** second `/code-review` pass on commit range `b73ebcc..ff514f1` after the canon-cc-008 chain had already discharged twice (initial v1 + post-CR-fix re-discharge). The 15 findings below are what TWO Governor chains + Cipher + one prior `/code-review` did not catch.
**v1 disposition:** ship at `ff514f1` with Cipher Edict V `LGTM` standing. These findings become v2.

## Why v2 instead of a third synth

The PR has been through:
1. Initial Vit D3 v1 implementation (`ea9b7d5`)
2. First Lyra synth — Maren V-M-59..67 + Kael V-K-66..72 + Vela V-V-01..09 (`90161e8`)
3. Cipher Edict V #1 — LGTM with cosmetic cleanup (`4f6f945`)
4. `/code-review` #1 — 15 findings (CR-1..CR-15)
5. CR-fix synth (`e7c8945`)
6. Second Governor chain — Maren V-M-68..76 + Kael V-K-73..77 + Vela V-V-10..17 (audits)
7. Second Lyra synth (`ff514f1`)
8. Cipher Edict V #2 — `LGTM`
9. `/code-review` #2 — these 15 findings

Each pass surfaced what the prior pass introduced. The `/code-review` #2 closing-note: "diminishing returns — each pass surfaces what the prior pass introduced." Architect ratified: stop the synth-loop, ship v1, capture the rest in v2.

## v2 spec authority

This file is the source-of-truth for the v2 design. When v2 work starts, Lyra promotes the relevant tier to a real spec at `docs/specs/vit-d3-tracking-v2.md` and the canon-cc-008 chain runs against that spec.

---

## Tier 1 — real bugs with concrete user impact

These should land first in v2. Each has a verified failure scenario and a clear fix shape.

### T1-1 — adjustMedTime erases positive withFat observation
**File:** `split/home.js:1016`. **Severity:** HIGH.

Contradicts the CR-14 doctrine ("never erase a real positive observation") that `_refreshTodayMedWithFat` carefully respects. User-initiated Adjust takes the destructive interpretation.

**Trigger:** Parent logs D3 at 08:42 alongside paratha → `{withFat:true, fatFood:'paratha'}`. Parent later deletes paratha from feedingData. Parent taps Adjust for any reason. `_detectFatContextNearTime` returns `withFat:false` (no fat-bearing food visible now). adjustMedTime overwrites the positive observation silently.

**Fix shape:** Preserve withFat:true when the new detection returns withFat:false. Only flip true→false when the parent explicitly clears it (a future "remove fat-pairing" affordance). The doctrine boundary "Adjust = correct just the time" vs "Adjust = refresh everything" should resolve to the former.

### T1-2 — Pattern card stale on tab return + sync push
**File:** `split/medical.js:4329`. **Severity:** HIGH.

`renderMedD3PatternCard()` has exactly ONE invocation site (inside `renderMeds()`). Tab switches don't fire it; sync.js's medChecks renderer list lacks it. The headline new surface of this PR has zero live-update paths.

**Trigger:** Parent renders pattern card on medical tab → switches to home, taps Done → switches back. Tab-switch dispatcher fires renderMedicalStats + others but NOT renderMeds. Pattern card body retains pre-Done HTML.

**Fix shape:** Add `renderMedD3PatternCard` to (a) the tab-switch dispatcher for the medical tab, and (b) sync.js's `'track:medical'` renderer list. Cheap one-line wires at each site.

### T1-3 — Skipped med events dropped from TSF event-list
**File:** `split/intelligence-quicklog.js:1909-1913`. **Severity:** HIGH.

`_tsfCollectEvents` filters: events.push only when timeMin !== null; noTimeEvents.push only when status !== 'skipped'. Skipped doses (timeMin null AND status === 'skipped') hit neither — the audit-trail loggedAt CR-10 explicitly added is invisible.

**Trigger:** Parent taps Skip on D3 at 09:00. The skip is logged with loggedAt but does not appear on the Today So Far timeline.

**Fix shape:** Remove the `parsed.status !== 'skipped'` gate on the noTimeEvents.push branch. Render the skip event with `displayTime` derived from `loggedAt` (formatted via `_formatTime12h`) so the TSF chip shows "Skipped at 9:00 AM".

### T1-4 — `_refreshTodayMedWithFat` mutates without re-rendering
**File:** `split/core.js:197`. **Severity:** HIGH.

Vela's V-V-13 advisory predicted this. The helper mutates medChecks + dirties caches but never triggers `renderRemindersAndAlerts` / `renderHomeContextAlerts` / `renderMedD3PatternCard`. Visible badges stay stale until tab switch.

**Trigger:** Parent logs D3 at 09:00 (no breakfast yet) → withFat:false stored. Diet tab → save breakfast 'paratha' at 09:30. Refresh helper flips storage to withFat:true but home reminder card still shows "no fat-meal logged nearby" until parent navigates back to home.

**Fix shape:** Append render calls inside the helper's `if (mutated)` block. Or have the helper return `mutated:boolean` and let each caller decide which render to fire (cleaner — the helper stays render-agnostic).

### T1-5 — ISL day-summary leaks raw 24h time
**File:** `split/intelligence-isl.js:873`. **Severity:** MEDIUM.

`_islRangeSummary` interpolates `md.d3Times[0]` verbatim — the CR-9 sweep applied `_formatTime12h` to 9 surfaces but missed this one. Cross-surface inconsistency.

**Trigger:** Parent gives D3 at 14:30 → daily/range summary card renders "Vit D3 given at 14:30" while every other surface shows "2:30 PM".

**Fix shape:** Wrap `_formatTime12h(md.d3Times[0])` at the interpolation site.

### T1-6 — undoMedSkip destroys CR-10 audit trail
**File:** `split/home.js:988`. **Severity:** MEDIUM.

`delete medChecks[todayStr][name]` removes the entire record including the loggedAt audit timestamp CR-10 explicitly added. The diff's comment calls this "acceptable" but it contradicts CR-10's stated invariant.

**Trigger:** Parent skips at 09:00, undoes at 09:05, eventually logs Done at 09:30. No record remains of the skip → undo → done sequence.

**Fix shape:** Preserve audit via either (a) `{status:'cleared', priorStatus:'skipped', priorLoggedAt:'09:00', clearedAt:'09:05'}` sentinel or (b) a small `history[]` array on the record. Option (a) is the minimal change; option (b) is forward-compatible for future state transitions.

---

## Tier 2 — care-tier UX / surface-quality

These fail the half-awake test but don't crash or corrupt data.

### T2-7 — Pattern card adherence + unloggedDays count today as missed
**File:** `split/medical.js:4406, 4419`. V-M-64 fixed the streak label asymmetry; adherence math + the warn-tier "N days not logged in this window" still punish a perfect-streak parent for the pre-dose morning gap. At 8 AM on day 14 of a perfect streak, card reads "Adherence: 13/14 days (93%)" + "1 day not logged in this window" alongside "Streak through yesterday: 13 days" — three lines that disagree.

**Fix shape:** When `eligibleDays[length-1].parsed === null && eligibleDays[length-1].date === today`, exclude today from both the adherence denominator and the unloggedDays callout. The streak's V-M-64 logic already does this; the adherence/unlogged surfaces should follow suit.

### T2-8 — Pattern card streak 0 on skipped-today, no through-yesterday fallback
**File:** `split/medical.js:4399`. V-M-64 only handles the unlogged-today case. A parent who legitimately skips today loses all historical streak context — card shows "Current streak: 0 days" with no preserved through-yesterday framing.

**Fix shape:** Extend the V-M-64 logic to treat status:'skipped' the same as todayResolved=false for streak walking purposes — start at length-2 and label "Streak through yesterday: N days."

### T2-9 — markMedDone initial-write surfaces false-negative badge before meal logged
**File:** `split/home.js:906`. Half-awake morning case: parent gives D3 at 7:55 AM before logging breakfast. markMedDone writes withFat:false → reminder card immediately shows "no fat-meal logged nearby" badge. The window from dose-log to meal-log is exactly where half-awake mornings live; v1 surfaces a false-negative there.

**Fix shape:** When `_detectFatContextNearTime` finds no meal in the window AND `feedingData[today]` has no meals logged AT ALL, write `withFat:null` (unknown) instead of `withFat:false`. The refresh helper flips it on first meal save. Alternatively: defer the negative-badge render until at least one meal has been logged today.

### T2-10 — adjustMedTime midnight rollover wedge
**File:** `split/home.js:1005`. Parent opens Adjust at 23:58, taps Save at 00:01. today() returns the new date, the record is on the prior date's key, function silently no-ops without re-rendering. Editor wedged.

**Fix shape:** Capture todayStr at openMedAdjust time and pass it through confirmMedAdjust → adjustMedTime. Or detect the midnight rollover and surface a toast "Date changed — please re-open Adjust on yesterday's record."

### T2-11 — adjustMedTime + confirmMedDoneAt accept future times
**File:** `split/home.js:1014, 944`. Parent mistypes the time as 23:00 (intended 11:00). adjustMedTime stamps the future time, re-runs detection → withFat flips true→false. C-1.5 with-fat denominator silently corrupts.

**Fix shape:** Add `pickedMin <= _hhmmToMinutes(_currentHHMM())` check in both confirmMedDoneAt and confirmMedAdjust. On failure, toast "Time must be in the past" + keep editor open.

### T2-12 — Outing-planner D3 suppressed by skip-as-resolved
**File:** `split/home.js:5371` (callers at 5105, 5308). V-M-67/74's skip-as-resolved fix for the home overlay propagates into outing-planner packing list and medical block. A misclick skip at 7 AM silently suppresses D3 packing for an afternoon outing.

**Fix shape:** Add an `_obCheckVitD3Needed` separate helper that takes `(intent: 'overlay' | 'outing-pack' | 'outing-give')` and routes the skip semantic per-intent. The home overlay treats skip as resolved; the outing-pack treats skip as "still pack" (parent might undo later); the outing-give treats skip as "still surface as a checkable item."

---

## Tier 3 — defensive / latent

Fix opportunistically. None gate v2 readiness.

### T3-13 — V-K-73 AM/PM branch missing range validation
**File:** `split/core.js:105`. V-K-73 closed the 24h-branch range check; the AM/PM branch still passes 'done:13:42 PM' through as h=25, storing givenAt='25:42' unclamped. `_formatTime12h` falls back to returning the input verbatim → '25:42' rendered literally.

**Fix shape:** Add `if (h < 0 || h > 23) givenAt = null;` after the AM/PM conversion. Or pre-validate the parsed h before constructing givenAt.

### T3-14 — Pending filter raw truthy-check accepts corruption
**File:** `split/home.js:6631` and `split/medical.js:2306`. Both use `!todayChecks[m.name]` instead of `medCheckIsDone`/`medCheckSkipped`. Corrupted partial-write objects (`{}` or `{status:null,...}`) silently treated as "not pending" → divergent from the home reminder card which uses parseMedCheck.

**Fix shape:** Replace `!todayChecks[m.name]` with `!medCheckIsDone(todayChecks[m.name]) && !medCheckSkipped(todayChecks[m.name])` at both sites.

### T3-15 — Fresh-install warm-start fails on length=0 case
**File:** `split/medical.js:4409`. V-M-74's strict-equal `eligibleDays.length === 1` misses the future-medStart case where `eligibleDays.length === 0` → falls through to rose-tier "Adherence: 0/0 days (0%)".

**Fix shape:** Change condition to `eligibleDays.length <= 1 && doneDays.length === 0 && skippedDays.length === 0`. Or add a separate `eligibleDays.length === 0` branch that renders "Med starts <formatDate(effectiveStart)>" instead of the warm-start string.

---

## Noise tier — closed without action

Per `/code-review` #2's "diminishing returns" framing, these get filed as canon notes only — no v2 implementation work allocated:

- **WR-2 dispatcher dead-code duplicates** — second-arm entries are unreachable but harmless. Cleanup-on-next-touch.
- **B3 bare-'done' → status:'late'** — narrow legacy edge; no realistic data has bare 'done'.
- **D-1 single-digit hour padding** — narrow mobile WebView edge.
- **D-2 token-split missing `;` `/`** — Indian-parent typing edge; the existing `,` `and` `+` `&` cover most patterns.
- **D-3 percentile math at N<11** — already partially gated by N≥5 + relabeled "Time range so far" for small N; the indexing math is documented imprecision.
- **D-4 `_hhmmToMinutes` non-end-anchored regex** — defensive concern; no current writer produces non-canonical _time strings.
- **D-5 Object.assign partial-schema propagation** — latent forward-compatibility concern; no current writer produces partial schemas.
- **D-7 NaN windowMinutes** — defensive; no current caller passes a 3rd arg.
- **C2 `_refreshTodayMedWithFat` asymmetric (never flips true→false)** — by design per CR-14; the trade-off is documented.
- **C5 Q&A 'Skipped today' info vs warn signal** — minor signal-color inconsistency.
- **C6/WR-4 `_obCheckVitD3` no medStart gate** — pre-existing behavior; not introduced by this PR.
- **WR-6 `_getFatBearingFoodNames` cache never invalidated** — latent; NUTRITION is currently const.
- **WR-7 Q&A handler silent on null-status corruption** — defensive; null-status is itself a corruption signal.

---

## Closing note

The v1→v2 split honors the principle that "ship clean enough" beats "iterate to a fixed point." Each finding above is real; together they would justify a v2 effort of similar scope to v1. The Architect's call to declare v1 done unlocks the merge of #116 and shifts the remaining work to a properly-spec'd v2 with its own canon-cc-008 chain.

— Lyra (main-session), 2026-05-24, post-Edict V #2 LGTM on `ff514f1`. cc-018 status: `v1 ratified for merge; v2 backlog drafted`.
