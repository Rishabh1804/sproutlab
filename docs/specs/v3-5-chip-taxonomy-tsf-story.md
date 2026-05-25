# v3-5 — Unified Chip-State Taxonomy + Today So Far Story-Arc

**Spec version:** v3-5
**Date:** 2026-05-25
**Branch:** `claude/v3-5-chip-taxonomy-tsf-story`
**Author:** Lyra (main-session — Mode-1 spec authoring)
**Status:** v0 — Wave 1 implementation spec; v3.0 gold capstone (surface vocabulary establisher).
**Promoted from:**
- `docs/specs/sproutlab-v3-roundtable-2026-05-25.md` §4.2 v3-5 row (chronicle-ratified)
- §3.3 Vela's contribution: vela-arc-1 (Unified chip-state taxonomy) + vela-arc-2 (Today So Far as story-arc) — merged into v3-5
- Existing precedent: T2-A.3 / V-V-25 `tsf-event[data-state="skipped"]` discriminator (PR #125) — first chip-state attribute
**Charter alignment (CV3-006 required section):**
- **Honesty** — every chip state corresponds to a real data condition; no decorative states. The `inferred` state explicitly discloses uncertainty (italic time, opacity). The story-arc summary line discloses absence honestly ("Quiet day so far") via CV3-003.
- **Extensibility** — chip-state registry is a row-addition substrate. Adding a new state = one CSS variant + one constant in the registry; consumers read by attribute, not by class enumeration.
- **Warmth** — the *primary axis this arc honors*. Chip family unification is what makes the half-awake test pass at the gestalt level (not just per-chip). Story-arc summary is the warmth lift on Today So Far — turns a ledger into a passage.

---

## What v3-5 is

The **surface vocabulary establisher** of v3.0. One ratified chip-state taxonomy + the story-arc summary primitive on Today So Far. The token vocabulary v3-6 (Card Priority) + v3-1 (Recommendation Pipeline) inherit and extend.

**v3.0 capstone (gold halo per chronicle):** v3-5 anchors the surface track in the same way v3-3 anchors the engine track. Without v3-5, every downstream Vela arc has to re-invent chip-state discipline.

**styles.css mutex 1st** (Cipher cipher-9): v3-5 must complete its triple-jurisdiction round before v3-6 opens, which must complete before v3-1 opens.

### Two merged sub-arcs

| Sub-arc | What | Files |
|---|---|---|
| **vela-arc-1** | Unified `chip.state` registry — 8 named states with token-driven visual contracts | `styles.css` + `intelligence-quicklog.js` + `intelligence-cards.js` |
| **vela-arc-2** | `story-arc-summary` primitive — single-sentence-above-the-list pattern on Today So Far | `intelligence-quicklog.js` + Kael pair-note for the data-side summary generator |

Both ship as one PR because they share the same chip-render touchpoints. Reviewing one without the other risks drift.

## What v3-5 is NOT

- A render-engine rewrite. Existing `renderTodaySoFar` orchestration unchanged in shape; the story-arc summary lands *above* the existing event list, not as a replacement.
- A new chip-feature. The 8 states cover existing semantics that have been ad-hoc across `tsf-event-inferred`, `tsf-event-live`, `data-state="skipped"`, and forthcoming Done/Late/Calm — this spec ratifies the taxonomy, doesn't invent new behaviors.
- An Activity Log redesign. Activity Log inherits chip-state attributes after v3-5 ratifies, but the AL surface itself is out-of-scope here.
- A theme switch. Dark-default for night hours is vela-arc-6 — deferred (chronicle §7 out-of-scope register).

---

## The 8-state chip-state registry

### State enumeration

```css
/* The single source of truth for chip semantics */
.tsf-event[data-state="done"]      { /* solid, full opacity, sage check */ }
.tsf-event[data-state="skipped"]   { /* strikethrough label + warn-color time + faded icon */ }
.tsf-event[data-state="late"]      { /* solid, but time slot amber-tinted */ }
.tsf-event[data-state="inferred"]  { /* italic time slot, 0.7 opacity (existing tsf-event-inferred precedent) */ }
.tsf-event[data-state="live"]      { /* tsfPulse animation on detail slot (existing tsf-event-live precedent) */ }
.tsf-event[data-state="calm"]      { /* opt-out of pulse — explicit "live but quiet" — existing data-calm="true" precedent */ }
.tsf-event[data-state="urgent"]    { /* rose-accent border, slight elevation; for safety-tier escalations */ }
.tsf-event[data-state="pending"]   { /* outline-only, light text — "expected today, not yet logged" */ }
```

### Registry doctrine

Eight states. **No more without a canon-cc-027 amendment.** Decorative variants (e.g. "happy" / "sad" chip flair) are categorically out of scope per Charter axis 3 ("no chart-junk").

### Each state's data condition

| State | Data condition | Triggered by |
|---|---|---|
| `done` | `parsed.status === 'done'` AND `parsed.givenAt` present | markMedDone / markFeedDone / etc. |
| `skipped` | `parsed.status === 'skipped'` | markMedSkipped (T1-3 surfaces at `loggedAt`) |
| `late` | `parsed.status === 'late'` (existing CR-15 marker) | resolveMissedMed / retroactive Done logs |
| `inferred` | `ev.inferred === true` AND `ev.timeMin` from pattern fallback, not a logged event | `_tsfInferMealTime` and the like |
| `live` | `ev.isLive === true` (recently completed; under TSF refresh window) | Recent log within last N minutes |
| `calm` | `ev.isCalm === true` — opt-out of pulse for a specific live event | Parent-tap to mute pulse |
| `urgent` | `ev.urgency === 'urgent'` (NEW — fed by `_scoreDay.severityLevel === 'urgent'` from v3-3) | v3-1 recommendation pipeline at firm/urgent severity |
| `pending` | Domain-specific "expected but not yet logged" predicate | Reminder pipeline / D3 not-yet-given today / scheduled feed window |

### Why an attribute, not a class

`data-state="..."` is single-value (one state per chip) — enforces mutual exclusion. Class names (`tsf-event-skipped`, `tsf-event-inferred`) historically allowed accidental multi-state stacking. The attribute is the **Charter Extensibility honor** — selectors are `[data-state="X"]`; renderers read `ev.state` once, set the attribute once, no class-bag drift.

### Visual contract per state — token-driven (Charter Warmth + HR-5)

Every visual treatment binds to existing domain tokens. No ad-hoc hex.

| State | Color tokens | Decoration | Motion |
|---|---|---|---|
| `done` | `--tc-sage` accent (icon background) | clean | none |
| `skipped` | `--tc-warn` (strike + time), `--light` (label) | line-through label | none |
| `late` | `--tc-amber` time slot | clean | none |
| `inferred` | base + opacity 0.7 | italic time | none |
| `live` | base | clean | `tsfPulse` 2s ease-in-out on detail |
| `calm` | base | clean | explicit none (opts out of pulse) |
| `urgent` | `--tc-rose` border | bold time slot | subtle elevation shadow (1px breath, vela-arc-5 pulse token — but motion tokens are vela-arc-5's job; v3-5 declares the *attribute*, vela-arc-5 wires the *motion*) |
| `pending` | `--light` text + outline | dashed outline | none |

### Cross-surface adoption

Every chip-rendering site routes through the attribute:

| File | Site | Change |
|---|---|---|
| `intelligence-quicklog.js` | `renderTodaySoFar` event chip render (both timed + no-time branches) | Set `data-state` on the wrapper per `ev.state` |
| `intelligence-quicklog.js` | Activity Log chip render | Same |
| `intelligence-cards.js` | Info-tab cross-domain card chips | Same |

**Build-time audit gate (Charter Extensibility honor):** grep for `tsf-event-skipped` / `tsf-event-late` / etc. class strings outside the registry CSS file. Any ad-hoc class string fails the build unless comment-justified. The attribute is the single source of truth.

---

## Story-arc summary primitive (vela-arc-2)

### Concept

Today So Far opens with a **single-sentence narrative summary** above the chronological event list. Generated from the same event array the list consumes, but rendered as a *passage*, not a ledger.

**Example outputs:**
- *"Solid day. Three meals, one nap, D3 with breakfast, no flags."*
- *"Mixed day so far. Breakfast at 7:30, no D3 yet, fussy log at 9."*
- *"Quiet day so far."* (empty-state — CV3-003 Honest-Empty-State honor)
- *"D3 missed yesterday — let's catch up."* (when a pending-tier action is the headline)

### Primitive contract

```js
/**
 * Generate the story-arc summary line for Today So Far.
 *
 * @param {Date} dateKey - the day being summarised (YYYY-MM-DD string)
 * @param {object} events - { events, noTimeEvents } from _tsfCollectEvents
 * @param {object} ctx - { illnessPosture, reminderRegistry, severityLevel }
 *
 * @returns {string} - parent-legible single sentence; never blank
 */
function _tsfGenerateSummary(dateKey, events, ctx) { /* ... */ }
```

**Data side (Kael pair-note):** `_tsfGenerateSummary` is a Kael-region helper in `intelligence-quicklog.js`. Vela owns the *render* of the result; Kael owns the *generation*. Cross-Region Pair-Note (CV3-004) honor: this section is the pair-note enumeration.

### Hedge-tier discipline (CV3-002 + Charter Honesty)

When the summary references cross-domain patterns from `_correlate` (v3-3), the prose carries the hedge tier:
- `confidence === 'high'` → assertive phrasing ("Three meals")
- `confidence === 'medium'` → "tends to" / "usually" phrasing
- `confidence === 'low'` → not surfaced in the summary line (no hedge surface = no claim)

The summary line never claims certainty above the underlying data's confidence.

### Day-spine collapse pattern

Below the summary, the event list collapses to a default **3 most-significant events** + a "Show full timeline (N)" expand chip. The 3 events surfaced are domain-prioritized:
1. Highest-severity unmet recommendation (if any from `_scoreDay`)
2. The day's `night`-class sleep entry (if any)
3. The most-recent timed event

Parent-tap on "Show full timeline" expands to the existing flat event list — no behavior change from today's `renderTodaySoFar` below that expansion.

### Performance gate (chronicle §4.5 benchmark 12)

Story-arc summary line paints within **200ms** of TSF data being available — measured via Perf API timing. The 200ms threshold is calibrated at impl-time against the actual measurement rig (Cipher cipher-3 — target, not gate-threshold).

---

## styles.css mutex (Cipher cipher-9 from chronicle Edict V)

**Sequential lock ratified:** v3-5 → v3-6 → v3-1.

v3-5 establishes the chip-state token vocabulary. v3-6 consumes it (adds priority-tier chrome to cards). v3-1 reads both (composes the recommendation-surface-tier render). Each arc must complete its triple-jurisdiction round before the next can open a styles.css branch.

**Practical implication for this PR:** the canon-cc-008 chain on v3-5 must close (all three Governor audits + Lyra synth + Cipher Edict V) before v3-6's branch opens. Coordination point: Lyra's session-end handoff doc records the mutex state.

## Triple-jurisdiction routing — canon-cc-008 chain

**Vela primary** (heaviest-touched Region; intelligence-quicklog.js + intelligence-cards.js are Vela's).

**Maren consult** — Maren reviews the chip-state semantics with Care safety floor in mind (e.g., `urgent` state must never be visually outranked by `done`). Pair-note enumerated in this spec body per CV3-004.

**Kael consult** — Kael reviews `_tsfGenerateSummary` (data-side primitive) + signal sourcing from `_correlate` outputs. Pair-note enumerated.

**Sequential triple-jurisdiction on styles.css** — rotation per canon-gen-001 + chronicle §4.2:
- **First-Governor by heaviest-touched Region:** Vela (the chip-state CSS variants land primarily as Vela's render concern)
- **Rotation order:** Vela → Maren → Kael (rotating from Vela's position in the canonical M → K → V order)

Each Governor's findings inform the next round. Lyra synthesizes all three. Cipher Edict V last, with the three Charter-axis cross-checks (honesty / extensibility / warmth) plus HR-1..HR-12.

---

## Files touched

| File | Region | Type | Lines (estimate) |
|---|---|---|---|
| `split/styles.css` | Shared — triple-jurisdiction | 8 chip-state variants + story-arc summary styles | ~150 added |
| `split/intelligence-quicklog.js` | Vela | `data-state` attribute on event render + `_tsfGenerateSummary` helper + collapse pattern | ~200 added, ~50 changed |
| `split/intelligence-cards.js` | Vela | `data-state` adoption in Info-tab chip usages | ~30 changed |
| `tests/e2e/v3-5-chip-taxonomy.spec.ts` (NEW) | — | E2E tests | ~300 |
| `tests/e2e/v3-5-tsf-story-arc.spec.ts` (NEW) | — | E2E tests | ~200 |

**Total LOC estimate:** ~930 (mostly CSS variants + tests).

---

## Test plan

### Functional tests — chip-state taxonomy

| Test | Asserts |
|---|---|
| `regression-guard-v3-5-chip-state-attr-mutex` | Only one `data-state` per chip; never multi-attribute |
| `regression-guard-v3-5-done-state` | `data-state="done"` chip renders sage-check decoration |
| `regression-guard-v3-5-skipped-state` | `data-state="skipped"` chip renders strikethrough + warn-color time (regression of T2-A.3 / V-V-25 contract) |
| `regression-guard-v3-5-late-state` | `data-state="late"` chip renders amber-tinted time slot |
| `regression-guard-v3-5-inferred-state` | `data-state="inferred"` renders italic time + 0.7 opacity (regression of existing tsf-event-inferred) |
| `regression-guard-v3-5-live-state` | `data-state="live"` triggers `tsfPulse` animation; `data-state="calm"` opts out |
| `regression-guard-v3-5-urgent-state` | `data-state="urgent"` renders rose-accent border |
| `regression-guard-v3-5-pending-state` | `data-state="pending"` renders dashed outline + light text |
| `regression-guard-v3-5-no-adhoc-class-strings` | Build-time grep: no `tsf-event-skipped`/`tsf-event-late`/etc. class strings outside the registry CSS file |
| `regression-guard-v3-5-attribute-coverage` | 100% of chip-render sites consume `data-state` — audit assertion |

### Functional tests — story-arc summary

| Test | Asserts |
|---|---|
| `regression-guard-v3-5-summary-renders` | Summary line paints above the event list on Today So Far |
| `regression-guard-v3-5-summary-empty-state` | Empty-state day → "Quiet day so far" (CV3-003 honor) |
| `regression-guard-v3-5-summary-headline-pending` | Pending-tier action becomes the headline ("D3 missed — let's catch up") |
| `regression-guard-v3-5-summary-hedge-tier-discipline` | Cross-domain phrasing carries hedge tier per `_correlate` confidence |
| `regression-guard-v3-5-day-spine-collapse` | Default 3 most-significant events + "Show full timeline (N)" chip |
| `regression-guard-v3-5-day-spine-expand` | Tapping expand reveals the full event list (no behavior change below) |
| `regression-guard-v3-5-summary-perf-budget` | Summary line paints within 200ms (target per cipher-3) |

### Cross-surface coverage tests

- `regression-guard-v3-5-activity-log-attribute` — Activity Log chip render uses `data-state`
- `regression-guard-v3-5-info-tab-attribute` — Info-tab cross-domain card chips use `data-state`
- `regression-guard-v3-5-half-awake-test` — manual test fixture (per cipher-2 protocol from chronicle §4.5 #11) — n=5 partial-attention sessions, ≥4/5 identify the urgent action

### Regression sweep

All existing 173 e2e tests must remain green. Pre-existing build-script-contract failure stays out-of-scope.

---

## HR pre-check

| HR | Risk | Mitigation |
|----|------|------------|
| HR-1 (no emojis) | low | All glyphs via `zi()` (existing) |
| HR-2 (no inline styles) | low | All chip styles in `styles.css` |
| HR-3 (no inline handlers) | n/a | Existing data-action delegation |
| HR-4 (escHtml at boundaries) | **medium** | Story-arc summary is a NEW render-boundary class; summary text is engine-derived from event data + standards-table constants — no raw parent input — but verify `_tsfGenerateSummary` output goes through `escHtml` at the render site |
| HR-5 (tokens-only) | low | All chip variants bind to domain tokens; no ad-hoc hex |
| HR-9 (post-build multi-round QA) | structural | canon-cc-008 triple-jurisdiction chain runs |
| HR-12 (timezone-safe dates) | low | `_tsfGenerateSummary` reads existing TSF event data; no new Date construction |

---

## Charter compliance per CV3-006

### Axis 1 — Intellectual honesty

- ✓ Hedge-tier discipline in story-arc prose (`certain` / `likely` / not-surfaced)
- ✓ Empty-state honesty — "Quiet day so far" rather than blank (CV3-003 cross-cut)
- ✓ `pending` state explicitly discloses "expected, not yet logged" rather than hiding the absence
- ✓ `inferred` state visually discloses uncertainty (italic + opacity)
- ✓ `urgent` state never invented decoratively — only fires when `_scoreDay` produces urgent severity

### Axis 2 — Architectural extensibility

- ✓ `data-state` attribute pattern: single source of truth; no class-bag drift
- ✓ Registry doctrine: adding a future state = one CSS variant + one constant; no engine code change
- ✓ Build-time grep gate against ad-hoc class strings outside the registry
- ✓ `_tsfGenerateSummary` is a single helper consumed by render; adding a new headline rule = one branch in the helper, no render-site change

### Axis 3 — Linguistic + visual warmth

- ✓ **This arc's primary axis.** Chip family unification is what makes the half-awake test pass at the gestalt level.
- ✓ Story-arc summary = the warmth lift on Today So Far — turns a ledger into a passage.
- ✓ All visual contracts bind to domain tokens (warm, sturdy, calm — cozy nursery journal)
- ✓ No emoji, no decorative icons (HR-1 + Charter Warmth)
- ✓ Day-spine collapse reduces information density at 2 AM — addresses the gestalt failure Vela named (chronicle §3.3)

---

## Cross-Region pair-notes (CV3-004 required section)

### Pair-note to Kael

**What Vela needs from Kael:** `_tsfGenerateSummary(dateKey, events, ctx)` — a Kael-region data-side helper that produces the summary sentence. Vela renders the result, Kael owns the generation logic + the hedge-tier mapping from `_correlate` confidence.

**Coordination:** Kael's helper lands in `intelligence-quicklog.js` (already in Vela's region but the function is engine-grain). Vela's chip-render diff consumes it. Both Region audits should pass for the same PR — Kael covers `_tsfGenerateSummary`, Vela covers chip-state attribute + render.

### Pair-note to Maren

**What Vela needs from Maren:** Severity floor sign-off on the `urgent` state visual treatment. A `urgent`-state chip must never be visually outranked by a `done`-state chip in the chronological list (i.e., the rose-accent border + elevation are categorically more attention-grabbing than the sage check). Maren's care-tier review verifies this floor holds across all 8 states.

**Coordination:** Maren's Mode-1 audit on `styles.css` (the triple-jurisdiction second round) — Maren explicitly reviews the visual hierarchy + flags any state combination where care-tier semantics could be inverted by visual weight.

---

## Out-of-scope (registered, not in v3-5)

- **vela-arc-3 Card Priority** (= v3-6) — separate arc; consumes chip vocabulary from v3-5
- **vela-arc-4 Cross-Domain Narrative-Prose Layer** (= v3-4) — consumes story-arc-summary helper but the cross-domain prose templates are v3-4's work
- **vela-arc-5 Pulse Hero + Motion Tokens** — separate arc; v3-5 declares the `urgent` attribute, vela-arc-5 wires the pulse motion
- **vela-arc-6 Dark-Default for Night Hours + A11y v2** — chronicle §7 out-of-scope; deferred to v3.1
- **Activity Log redesign** — only the chip-attribute adoption lands here; broader AL surface is future work
- **Smart Quick Log redesign** — same; only chip-attribute adoption

---

## Sequencing

**Upstream gates (all clear):**
- ✓ PR #129 (Chronicle) merged — v3-5 is canonical Wave 1 arc
- ✓ PR #130 (Charter CV3-006) merged — Charter alignment section required for spec

**Parallel with v3-5:**
- v3-3 (Engine Spine — PR #131) — independent; Kael primary; engine-only. **Both Wave 1 capstones land in parallel by Architect direction this session.**

**styles.css mutex sequencing (Cipher cipher-9):**
- v3-5 → v3-6 → v3-1. v3-6 cannot open its styles.css branch until v3-5's canon-cc-008 chain closes.

**Downstream unblocked by v3-5:**
- v3-6 (Card Priority) — consumes chip vocabulary directly
- v3-1 (Recommendation Pipeline) — consumes both v3-5 (chip vocabulary) and v3-6 (priority chrome) for surface-tier rendering
- v3-4 (Narrative Layer) — consumes the `_tsfGenerateSummary` shape as the template host
- C-5 (Voice Input — Wave 3) — depends on v3-5 chip vocabulary for confirmation chips
- C-12 (Localization — Wave 3) — depends on v3-5 token-driven chip vocabulary

---

## Doctrinal references

- `docs/specs/sproutlab-v3-roundtable-2026-05-25.md` §4.2 v3-5 row (chronicle authority); §3.3 Vela's contribution (vela-arc-1 + vela-arc-2 source)
- `docs/specs/sproutlab-v3-charter.md` (CV3-006 — three-axis alignment required)
- `docs/specs/vit-d3-tracking-v2-tier-2.md` §T2-A.3 / V-V-25 (existing `data-state="skipped"` precedent — this spec generalizes the pattern)
- CV3-002 Narrate-vs-List (story-arc summary is the canonical render of this doctrine)
- CV3-003 Honest-Empty-State ("Quiet day so far" empty-state honor)
- CV3-004 Cross-Region Pair-Note (this spec body's two pair-note sections honor)
- HR-1, HR-2, HR-4, HR-5, HR-7 (icon discipline, no inline styles, escHtml at story-arc-summary render boundary, tokens-only, zi() via innerHTML)
- canon-cc-008 + canon-cc-022 + canon-cc-026 + canon-cc-027 + canon-gen-001 (process floor)

---

— *Lyra (main-session), 2026-05-25, v3-5 spec drafted post-Charter-ratification (CV3-006). The surface vocabulary establisher; v3.0 gold capstone alongside v3-3. Architect-direct: "in parallel start chip v3-5." Spec is ready for canon-cc-008 triple-jurisdiction chain (Vela primary; Maren + Kael consult; sequential review on styles.css per the mutex) once the PR opens.*
