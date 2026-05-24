# Vit D3 Tracking v2 — Tier 1 promotion

**Spec version:** v2 (Tier 1 only — v2.x will pick up Tier 2/3 separately)
**Date:** 2026-05-24
**Branch:** `claude/vit-d3-v2-tier1`
**Author:** Lyra (main-session)
**Promoted from:** `docs/specs/vit-d3-tracking-v2-backlog.md` §Tier 1 — real bugs with concrete user impact
**Jurisdiction (canon-cc-008 routing):**
- **Maren (Care):** T1-1 (home.js adjustMedTime), T1-2 (medical.js renderMedD3PatternCard wire), T1-6 (home.js undoMedSkip + T3-14 dependency at home.js / medical.js pending filters)
- **Kael (Intelligence engine):** T1-2 (sync.js renderer list + core.js tab-switch dispatcher), T1-4 (core.js _refreshTodayMedWithFat re-render contract), T1-5 (intelligence-isl.js _islRangeSummary _formatTime12h sweep), T1-6 (core.js parseMedCheck handles 'cleared' status)
- **Vela (Surfacing render):** T1-3 (intelligence-quicklog.js _tsfCollectEvents skipped-event surfacing)
- **Triple-jurisdiction:** no styles.css / template.html touch in v2 (existing tokens reused)

**Authority:** Architect-directed v2 closeout: "v1 done per council recommendation" (2026-05-24). v1 shipped at `ff514f1` / merged via PR #116; v2 backlog drafted at the same session. Tier 1 promotion authorized in this session, single PR, full canon-cc-008 chain.

---

## Scope statement

Six verified bugs from PR #116 v1, each with a reproducible failure trace, fixed in a single atomic ship. Plus T3-14 (pending-filter raw truthy-check) pulled in as a prerequisite for T1-6's `cleared`-sentinel correctness — eight one-line/few-line fixes across four Regions.

**What v2 Tier 1 is NOT:**
- Tier 2 (care-tier surface-quality) — six items deferred to v2.x. Don't touch pattern card adherence math, streak fallback, false-negative badge timing, midnight rollover, future-time validation, outing-planner skip semantics. Each requires its own design pass.
- Tier 3 (defensive / latent) — two items remain Tier 3 backlog. T3-14 is the exception (T1-6 prerequisite, narrated below).
- v2 spec-amendment work for the v1 record — v1 ships as ratified; v2 is additive, not retroactive.

## Fix manifest

### T1-1 — adjustMedTime preserves positive withFat observation

**File:** `split/home.js:1011-1033` (function `adjustMedTime`)
**Severity:** HIGH (silently destroys parent's accurate observation)
**Doctrine:** Extends CR-14 ("never erase a real positive observation") from the refresh path to the user-initiated adjust path.

**Trigger trace:**
1. Parent logs D3 at 08:42 alongside paratha → `{withFat:true, fatFood:'paratha'}` stored
2. Parent deletes paratha from `feedingData[today].breakfast`
3. Parent taps Adjust on D3 for any reason (e.g. correcting givenAt from 08:42 to 08:45)
4. `_detectFatContextNearTime(newTime, todayStr)` returns `{withFat:false, fatFood:null}` because no fat-food is visible in feedingData now
5. `adjustMedTime` overwrites `withFat:true → withFat:false` silently

**Fix shape:** Preserve `existing.withFat===true` when the new detection returns `withFat:false`. Only flip true→false when explicitly cleared (a future "remove fat-pairing" affordance — not in scope for v2).

```js
// T1-1 (CR-14 extension): never erase a positive withFat observation. If existing
// had withFat:true and re-detection returns false, the parent's earlier observation
// is the source of truth — they may have edited the meal text after the fact.
const preserveWithFat = (existing.withFat === true && fat.withFat === false);
medChecks[todayStr][name] = {
  status:   existing.status,
  givenAt:  newTime,
  loggedAt: existing.loggedAt || now.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' }),
  withFat:  preserveWithFat ? true : fat.withFat,
  fatFood:  preserveWithFat ? existing.fatFood : fat.fatFood,
  fatDelta: preserveWithFat ? existing.fatDelta : fat.fatDelta,
};
```

**Test:** `tests/e2e/vit-d3-tracking-v2.spec.ts` — `regression-guard-d3-adjust-preserves-positive-withfat`. Mirror structure to `regression-guard-d3-refresh-never-flips-true-to-false`.

---

### T1-2 — Pattern card live-updates on tab return AND sync push

**Files:**
- `split/core.js:3392` — tab-switch dispatcher
- `split/sync.js:229` — `KEYS.medChecks` renderer list
**Severity:** HIGH (headline new surface of v1 has zero live-update paths)

**Trigger trace (tab-switch):**
1. Parent on medical tab; pattern card body shows pre-action state
2. Parent switches to home; taps Done on D3 reminder
3. Parent switches back to medical
4. Tab-switch dispatcher fires `renderMedicalStats` + others but NOT `renderMeds` (the only invocation site of `renderMedD3PatternCard`)
5. Pattern card body still shows pre-Done state until the parent navigates away and back, or a sync push arrives

**Trigger trace (sync push):**
1. Parent on device A taps Done on D3
2. Device B is on medical tab with pattern card visible
3. Firestore push arrives at device B → `KEYS.medChecks` renderer list fires `renderMedicalStats`
4. Pattern card never re-renders on device B

**Fix shape:**

```js
// split/core.js:3392 (tab-switch dispatcher)
if (sub === 'medical') {
  renderMedicalStats();
  orderMedicalCards();
  renderVaccPastList();
  renderDoctorPrep();
  initSymptomChips();
  renderFeverEpisodeCard(); renderFeverHistory();
  renderDiarrhoeaEpisodeCard(); renderDiarrhoeaHistory();
  renderVomitingEpisodeCard(); renderVomitingHistory();
  renderColdEpisodeCard(); renderColdHistory();
  if (typeof renderMedD3PatternCard === 'function') renderMedD3PatternCard(); // T1-2
}
```

```js
// split/sync.js:229
[KEYS.medChecks]: { global: 'medChecks', renderers: { 'track:medical': ['renderMedicalStats', 'renderMedD3PatternCard'] } }, // T1-2
```

**Test:** in-process unit-style asserts that the function references are wired (the e2e environment doesn't easily reproduce a Firestore push).

---

### T1-3 — Skipped med events surface in TSF timeline

**File:** `split/intelligence-quicklog.js:1909-1913` (`_tsfCollectEvents` med branch)
**Severity:** HIGH (CR-10's `loggedAt` audit trail is invisible)
**Region:** Vela (intelligence-quicklog.js)

**Trigger trace:**
1. Parent taps Skip on D3 at 09:00
2. `markMedSkipped` writes `{status:'skipped', givenAt:null, loggedAt:'09:00', ...}` per CR-10
3. `_tsfCollectEvents` med branch: `timeMin` is `null` (no givenAt) AND `parsed.status === 'skipped'` → event hits NEITHER `events.push` (gated on timeMin) NOR `noTimeEvents.push` (gated on `status !== 'skipped'`)
4. Skip is invisible on Today So Far timeline; audit trail is data-only

**Fix shape:** Remove the skipped gate on `noTimeEvents.push` AND derive `timeMin` from `loggedAt` so the skip lands in the chronological timeline at its audit-trail time.

```js
if (timeMin !== null) {
  events.push(ev);
} else if (parsed.status === 'skipped' && parsed.loggedAt) {
  // T1-3: skipped doses are CR-10 audit-bearing events. Surface them in the
  // chronological timeline at their loggedAt time so the day's record is honest.
  ev.timeMin = _tsfTimeToMinutes(parsed.loggedAt);
  ev.time = parsed.loggedAt;
  ev.displayTime = _tsfFormatTime(parsed.loggedAt);
  events.push(ev);
} else {
  noTimeEvents.push(ev);
}
```

**Comprehension-surface check (Vela lens):** TSF chip will render in chronological position, icon = pill (sky), label = med name, detail = "Skipped" (existing `detail` mapping at :1894). Half-awake parent at 2 AM scanning the day's timeline sees the skip in temporal context — distinct from "Done" by the detail string, distinct from "Time not logged" by being in the main events list.

**Test:** `regression-guard-d3-skipped-event-surfaces-in-tsf`.

---

### T1-4 — _refreshTodayMedWithFat triggers re-render on mutation

**File:** `split/core.js:173-203` (function `_refreshTodayMedWithFat`)
**Severity:** HIGH (predicted by V-V-13 advisory)

**Trigger trace:**
1. Parent logs D3 at 09:00; no breakfast yet → `withFat:false` stored
2. Parent navigates to diet tab; saves breakfast 'paratha' at 09:30
3. Diet save path calls `_refreshTodayMedWithFat()` (per V-M-70 at `intelligence-quicklog.js:2761`); helper flips storage to `withFat:true`, marks caches dirty, returns `true`
4. Caller discards return value
5. Parent navigates back to home; reminder card STILL shows "no fat-meal logged nearby" because no render fired

**Fix shape:** Choose backlog option (a) — append render calls inside the helper's existing `if (mutated)` block. Centralizes the contract (one place to know about render-on-flip) and avoids fanning out across six caller sites. The helper already crosses the cache-invalidation boundary (`_tsfMarkDirty`, `_islMarkDirty`), so crossing the render boundary in the same block is consistent with the existing pattern.

```js
if (mutated) {
  save(KEYS.medChecks, medChecks);
  if (typeof _tsfMarkDirty === 'function') _tsfMarkDirty();
  if (typeof _islMarkDirty === 'function') _islMarkDirty('medical');
  // T1-4: re-render the surfaces that depend on withFat so a parent currently
  // viewing the home or medical tab sees the flipped badge without re-navigating.
  if (typeof renderRemindersAndAlerts === 'function') renderRemindersAndAlerts();
  if (typeof renderHomeContextAlerts === 'function') renderHomeContextAlerts();
  if (typeof renderMedD3PatternCard === 'function') renderMedD3PatternCard();
}
```

**Test:** `regression-guard-d3-refresh-triggers-rerender-on-flip`. Asserts that after the flip, the home reminder card's "no fat-meal" badge is gone without an explicit navigate.

---

### T1-5 — ISL day-summary renders D3 time in 12h

**File:** `split/intelligence-isl.js:873`
**Severity:** MEDIUM (cross-surface inconsistency; not data corruption)
**Region:** Kael

**Trigger trace:**
1. Parent gives D3 at 14:30
2. ISL `_islRangeSummary` interpolates `md.d3Times[0]` verbatim → "Vit D3 given at 14:30"
3. Every other surface in the codebase formats via `_formatTime12h` post-CR-9 → "2:30 PM"
4. Daily / range summary card looks like it was written by a different author

**Fix shape:** Wrap with `_formatTime12h` at the interpolation site. Single-line surgical change.

```js
highlights.push({ domain: 'medical', text: 'Vit D3 given' + (md.d3Times.length > 0 ? ' at ' + _formatTime12h(md.d3Times[0]) : ''), signal: 'good' }); // T1-5
```

**Test:** `regression-guard-d3-isl-range-summary-formats-12h`.

---

### T1-6 — undoMedSkip preserves audit trail via cleared sentinel

**File:** `split/home.js:996-1006` (function `undoMedSkip`)
**Severity:** MEDIUM (contradicts CR-10's stated invariant)

**Trigger trace:**
1. Parent skips D3 at 09:00 → `{status:'skipped', loggedAt:'09:00', ...}` stored
2. Parent realizes misclick; taps Undo at 09:05
3. `undoMedSkip` calls `delete medChecks[todayStr][name]` → entire record (including CR-10 `loggedAt`) gone
4. Parent gives the dose at 09:30; new `{status:'done', loggedAt:'09:30', givenAt:'09:30', ...}` written
5. No record of the skip → undo → done sequence exists in storage. CR-10's audit invariant is broken.

**Fix shape:** Adopt backlog option (a) — `cleared` sentinel on the record. Keeps the audit surface in the per-day per-med slot, no parallel structure. The active state semantics ("show me as pending") are achieved by `parseMedCheck` returning `null` for `cleared`.

```js
// split/home.js:996 — undoMedSkip
function undoMedSkip(name, idx) {
  const todayStr = today();
  const existing = medChecks[todayStr] && medChecks[todayStr][name];
  if (existing !== undefined) {
    const parsedExisting = parseMedCheck(existing);
    if (parsedExisting && parsedExisting.status === 'skipped') {
      // T1-6: preserve CR-10 audit trail. The cleared sentinel keeps the
      // prior skip's loggedAt and adds clearedAt so a future Q&A or audit
      // surface can reconstruct the skip → undo → done sequence.
      const now = new Date();
      const clearedAt = now.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
      medChecks[todayStr][name] = {
        status:        'cleared',
        givenAt:       null,
        loggedAt:      null,
        withFat:       null,
        fatFood:       null,
        fatDelta:      null,
        priorStatus:   'skipped',
        priorLoggedAt: parsedExisting.loggedAt || null,
        clearedAt:     clearedAt,
      };
    } else {
      // Existing wasn't a skip (defensive — Undo should only fire from skipped UI)
      delete medChecks[todayStr][name];
    }
    save(KEYS.medChecks, medChecks);
    _tsfMarkDirty();
    _islMarkDirty('medical');
  }
  renderRemindersAndAlerts();
  renderHomeContextAlerts();
}
```

```js
// split/core.js — parseMedCheck addendum: 'cleared' reads as pending.
// Inside parseMedCheck, before the existing object-shape branch return:
if (val && typeof val === 'object' && val.status === 'cleared') {
  return null; // T1-6: cleared sentinel reads as pending to every existing reader
}
```

**Prerequisite — T3-14 promotion:** the cleared sentinel is a truthy object on the raw `medChecks[date][name]` slot. Two pending-filter sites use raw truthy-check:
- `split/home.js:6631` — `!todayChecks[m.name]`
- `split/medical.js:2306` — `!todayChecks[m.name]`

After T1-6, an undone skip would be a truthy object → these filters would silently exclude the med from "pending today" surfaces. T3-14 fix is therefore a strict T1-6 prerequisite — replace raw truthy with `!medCheckIsDone() && !medCheckSkipped()`. Both helpers already return false for `parseMedCheck → null` (the cleared sentinel's read-through), so the corrected filter naturally treats cleared as pending.

```js
// At both sites:
const isPending = !medCheckIsDone(todayChecks[m.name]) && !medCheckSkipped(todayChecks[m.name]); // T1-6 / T3-14
```

**Test:** `regression-guard-d3-undo-skip-preserves-audit-and-reads-as-pending`. Asserts (a) raw record has `status:'cleared'` + `priorLoggedAt` preserved; (b) `medCheckIsDone === false`; (c) `medCheckSkipped === false`; (d) `parseMedCheck === null` (reads as pending).

**Note on existing regression test:** `regression-guard-d3-undoMedSkip-clears-to-pending` at `tests/e2e/vit-d3-tracking.spec.ts:541-569` currently asserts `undoIsCleared: afterUndo === undefined`. The new behavior produces a `cleared` sentinel, so this assertion changes to `afterUndo && afterUndo.status === 'cleared'` plus the existing "didn't silently log Done" assertion stands. The test name remains semantically accurate ("clears to pending" — the read-through is still pending) and gets updated in this PR.

---

## Build & verification plan

1. `pnpm build` — canonical, self-validates DOCTYPE + 100KB floor
2. `pnpm exec playwright test tests/e2e/vit-d3-tracking.spec.ts tests/e2e/vit-d3-tracking-v2.spec.ts --reporter=line` — all v1 regressions remain green, all six new v2 tests pass
3. `pnpm exec playwright test --reporter=line` — full suite, no regressions beyond the one pre-existing skip

## Out-of-scope reminders

- No new design tokens; reuse existing `tc-sage` / `tc-warn` / `tc-rose` / `ds-sky` / `med-d3-summary*` classes
- No styles.css or template.html edits → no triple-jurisdiction sequential review
- No new Smart Q&A intent
- No CareTicket integration
- Cipher Edict V runs after Lyra synth completes

— Lyra, 2026-05-24, v0 draft for canon-cc-008 round 1.
