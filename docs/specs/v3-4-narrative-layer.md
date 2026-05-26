# v3-4 — Cross-Domain Narrative-Prose Layer

**Spec version:** v3-4
**Date:** 2026-05-27
**Branch:** `claude/v3-4-narrative-layer-spec` (spec) → `claude/v3-4-narrative-layer-impl` (IMPL, future)
**Author:** Lyra (main-session — Mode-1 spec authoring)
**Status:** v0 — Wave 1 implementation spec; v3.0 surface arc; the cross-domain prose tier that v3-5's `_tsfHedgePhrase` stub and v3-3's `_correlate` substrate were authored to host.
**Promoted from:**
- `docs/specs/sproutlab-v3-roundtable-2026-05-25.md` §3.3 vela-arc-4 + §4.2 v3-4 row (chronicle-ratified)
- `docs/specs/v3-5-chip-taxonomy-tsf-story.md` §Hedge-tier discipline + §Out-of-scope row "vela-arc-4 Cross-Domain Narrative-Prose Layer (= v3-4)" — substrate established, branches deferred for separate arc
- `docs/specs/v3-3-engine-spine.md` Primitive 1 (`_correlate` returns `{strength, confidence, sampleSize}`) — every output field on the v3-3 contract was pre-shaped for this consumer

**Charter alignment (CV3-006 required section — full enumeration in §Charter compliance below):**
- **Honesty** — *the primary axis this arc honors.* Every cross-domain claim ships with a hedge tier sourced from `_correlate.confidence`; below-floor confidences are not surfaced at all (no claim = no hedge surface); sample size travels with the prose (no claim without `n=` disclosure per cipher-2); the absence of a hedge tier on a cross-domain claim is a defect the build-time audit gate rejects.
- **Extensibility** — the `narrative-prose-template` registry is a row-addition substrate; adding a future cross-domain renderer = one template row + one consumer call, no engine code; the producer contract is one helper call per renderer; the v3-5 `_tsfHedgePhrase` stub becomes a typed producer with three named branches.
- **Warmth** — passages, not coefficients. "Ziva's longer naps follow earlier dinners by ~40 min (likely)" is parent-legible at 2 AM in a way that `r = 0.62, n = 12` is not. Charts are demoted to disclosure under the passage, not removed (CV3-002 Narrate-vs-List honor lifted from chip-tier to cross-domain card-tier).

---

## What v3-4 is

The **cross-domain narrative-prose layer**. v3-5 unified the *chip-tier* surface vocabulary inside Today So Far and pre-staged `_tsfHedgePhrase(confidence)` as a contract-shape stub with no producers. v3-3 shipped `_correlate` returning `{strength, confidence, sampleSize}` — every field on that return shape was authored toward this consumer.

v3-4 closes the loop: it fills the hedge-phrase producer with real branches, ships a `narrative-prose-template` library keyed by cross-domain renderer, and rewrites the six existing cross-domain `renderInfo*` cards in `intelligence-cards.js` to consume the library instead of emitting bare coefficient prose.

**v3.0 silver arc:** v3-4 is not a gold capstone (the gold tier — v3-3 engine spine + v3-5 surface vocabulary — fully ratified as of 2026-05-26). v3-4 is the *first producer* of cross-domain prose at the card tier; without it, every cross-domain renderer carries its own ad-hoc hedge phrasing (or, more commonly, none at all), and the CV3-002 Narrate-vs-List doctrine remains chip-tier-only.

**Mutex-independent.** v3-4 does NOT touch `styles.css` and therefore does not gate on the cipher-9 styles.css mutex. v3-4 ships in parallel with v3-6 IMPL (position 2 of the styles.css mutex, in flight) and with Sleep Arc 3 / Scoring Arc S-2 (in flight). See §styles.css mutex below.

### The doctrine v3-4 lifts

CV3-002 (Narrate-vs-List, Province-local, ratified 2026-05-25) declares that render composes passages; a coefficient is engine output, a passage is render output; cross-domain prose that omits hedge tier overpromises certainty the engine never claimed. v3-5 lifted CV3-002 to the chip tier (story-arc summary). v3-4 lifts it to the cross-domain card tier — the surface where Kael's `_correlate` actually fires.

---

## What v3-4 is NOT

- **Not new charts.** The existing chart / bar / heatmap renders inside the six cross-domain cards remain. They are *demoted to disclosure* under the passage (collapsed-by-default region), not removed. CV3-002 says the passage carries the insight; the chart is the audit trail.
- **Not new correlations.** v3-4 consumes `_correlate` as it shipped at v3-3. No new signal extractors, no new domain pairs, no new lag analysis. The six cross-domain renderers already compute their own derived insights; v3-4 routes those insights through a typed prose envelope.
- **Not a chip-state arc.** v3-5 owns chip-tier vocabulary. v3-4 emits *prose passages above charts*, not chips. The two arcs are scoped to different DOM tiers.
- **Not styles.css-touching.** No new tier chrome, no new selectors, no new tokens. The passage renders inside the existing card-body shell using existing `t-sm` / `si-insight` text classes. v3-4 is independent of the cipher-9 styles.css mutex.
- **Not Activity Log prose.** Activity Log narration is registered as a future arc; v3-4 is scoped to the six cross-domain Info-tab cards.
- **Not Smart Quick Log prose.** Same — out-of-scope register.
- **Not a `_tsfGenerateSummary` orchestration change.** v3-5 owns the story-arc summary primitive. v3-4 fills the `_tsfHedgePhrase` branches; the summary orchestration is untouched.
- **Not recommendation prose.** v3-1's recommendation-pipeline carries its own prose envelope (toast / TSF chip / home card / CareTicket). v3-4 is correlation-prose only.

---

## The `narrative-prose-template` library

### Concept

A registry keyed by cross-domain renderer (one row per renderer). Each row carries:

1. **`passage`** — the template string with named `{tokens}` for interpolation. Tokens are typed; every interpolation goes through `escHtml` at the helper boundary (Cipher cipher-5 honor — see §Build-time audit gate).
2. **`hedgeTierMap`** — the mapping from `_correlate.confidence` to the hedge phrase in this passage's voice. Three branches: `high` → assertive, `medium` → softened, `low` → not-surfaced.
3. **`sampleFloor`** — minimum `_correlate.sampleSize` below which the passage does not surface at all. Defaults to the `_correlate` hard floor of 7 days (per v3-3 §Confidence floor); per-renderer overrides allowed for safety-tier renderers (illness impact may carry a higher floor — Maren consult required).
4. **`emptyState`** — the parent-legible empty-state phrasing when the renderer's data condition is the `si-nodata` branch. CV3-003 Honest-Empty-State honor. Each card already has an empty-state today; v3-4 ratifies the prose voice.

### Registry shape

```js
/**
 * narrative-prose-template registry — one row per cross-domain renderer.
 * Single source of truth for passage shape, hedge-tier mapping, sample
 * floor, empty-state phrasing. Mirrors the v3-5 _TSF_CHIP_STATES doctrine:
 * single constant; call-sites read by key; audit-gate guards drift.
 * Placement: split/data.js OR new split/intelligence-narrative.js — IMPL
 * call; either landing is Charter-clean (§Files touched IMPL-note).
 */
window._NARRATIVE_PROSE_TEMPLATES = {
  'foodPoopPipeline': {
    passage:      '{topFood} {hedge} correlate{plural} with lower poop scores ({diff} pts) {timing} across {n} meals.',
    hedgeTierMap: { high: '', medium: 'tends to ', low: null },  // null = do not surface
    sampleFloor:  7,
    emptyState:   'Not enough food-poop pairs yet — log a few more days of meals and poops to surface a pattern.',
  },
  'sleepFeeding': {
    passage:      'A {gap}-min dinner-to-bedtime gap {hedge} pairs with {direction} sleep ({diff} pts) across {n} nights.',
    hedgeTierMap: { high: '', medium: 'tends to ', low: null },
    sampleFloor:  7,
    emptyState:   'Need a few more nights with both feeding times and sleep logs.',
  },
  'activitySleepDeep': {
    passage:      '{activityLevel} activity days {hedge} produce {direction} deep sleep ({diff} pts) across {n} nights.',
    hedgeTierMap: { high: '', medium: 'tends to ', low: null },
    sampleFloor:  7,
    emptyState:   'Need a few more days of both activity logs and sleep scores.',
  },
  'growthDiet': {
    passage:      'Weight-velocity {hedge} tracks alongside {nutrient} intake across the last {windowDays} days (n={n}).',
    hedgeTierMap: { high: '', medium: 'tends to ', low: null },
    sampleFloor:  14,  // growth signals need a longer window — Maren consult ratified
    emptyState:   'Growth-diet patterns surface after a few weeks of both growth entries and food logs.',
  },
  'illnessImpact': {
    passage:      '{illnessType} episodes {hedge} pair with {direction} {downstreamDomain} ({diff} pts) across {n} episodes.',
    hedgeTierMap: { high: '', medium: 'tends to ', low: null },
    sampleFloor:  3,   // episodic — Maren consult ratified higher-floor exemption
    emptyState:   'Not enough recent illness episodes to surface an impact pattern.',
  },
  'milestoneSleepCorrelation': {
    passage:      'Sleep {hedge} shifts during the {milestone} window ({direction} {diff} pts across {n} nights).',
    hedgeTierMap: { high: '', medium: 'tends to ', low: null },
    sampleFloor:  7,
    emptyState:   'Milestone-sleep patterns surface after a few logged sleep nights inside a milestone window.',
  },
};
```

### Registry doctrine

Six rows. **Adding a future row = adding a future cross-domain renderer**; the two grow in lockstep. The audit-gate (§Build-time audit gate) verifies every cross-domain renderer that consumes `_correlate` has a registry row keyed by its name. The CV3-002 hedge-tier discipline is *type-enforced by the registry shape* — every row has a `hedgeTierMap`; you cannot ship a cross-domain passage without one.

**Note on the `low` confidence branch:** `null` (not the empty string `''`) is the sentinel for "do not surface". The producer (`_narrativeProse` — see below) returns `null` when `confidence === 'low'`; the renderer falls through to the empty-state phrasing or to the chart-only disclosure render. This is the Honesty floor: no hedge surface = no claim, not an unhedged claim.

### Cross-tier interaction with v3-5

v3-5's `_tsfHedgePhrase(confidence)` lives in `intelligence-quicklog.js` and is consumed by the *story-arc summary* on Today So Far (chip-tier surface). v3-4's `_narrativeProse(rendererKey, vars, correlation)` lives in `intelligence-cards.js`-adjacent (or `intelligence-narrative.js` new module — IMPL call) and is consumed by the six *cross-domain card renderers* (card-tier surface). Both honor the same hedge-tier discipline. v3-4's producer is the typed registry consumer; v3-5's stub is the surface-level modifier.

**v3-4 fills the v3-5 stub.** The `_tsfHedgePhrase` body in `intelligence-quicklog.js` today returns `''` / `'tends to '` / `''` as a contract-shape placeholder. v3-4 promotes it to the canonical hedge phrase producer (see §The `_tsfHedgePhrase(confidence)` producer wiring below); the registry's `hedgeTierMap` values delegate to it.

---

## The `_tsfHedgePhrase(confidence)` producer wiring

The v3-5 stub at `intelligence-quicklog.js:1722` ships with three branches but no live producers reading them. v3-4 promotes the stub to a *canonical typed producer* read by both story-arc summary (v3-5 consumer; vacuous today) and by `_narrativeProse` (v3-4 consumer; live).

### Producer body (v3-4 IMPL)

```js
/**
 * Hedge-tier modifier for cross-domain prose. Canonical producer.
 *
 * @param {'high'|'medium'|'low'} confidence — from _correlate output
 * @returns {string|null}
 *   - 'high'   → '' (assertive — no softening)
 *   - 'medium' → 'tends to ' (softened — passage reads "X tends to correlate with Y")
 *   - 'low'    → null (NOT surfaced — caller suppresses entire passage)
 *
 * Honesty floor: a cross-domain claim without a hedge-tier disclosure is a
 * defect. The build-time audit gate (audit-narrative-prose-v3-4.sh) rejects
 * prose that interpolates a coefficient (or strength derivative) without
 * going through this producer.
 */
function _tsfHedgePhrase(confidence) {
  if (confidence === 'high')   return '';
  if (confidence === 'medium') return 'tends to ';
  if (confidence === 'low')    return null;
  // Unknown confidence shape — Honesty floor: treat as low. Producer
  // failure must not silently widen the surfaced claim.
  return null;
}
```

### Honesty floor — restated

**Absence of a hedge tier on a cross-domain claim is a defect.** This is the v3-4 IMPL's load-bearing audit gate. Two failure modes the gate rejects:

1. **Bare coefficient prose** — a renderer emitting `"r = 0.62"` or `"correlates with -15 pts"` *without* the passage being routed through `_narrativeProse` (which routes through `_tsfHedgePhrase`).
2. **Raw `_correlate` output without `_tsfHedgePhrase` between source and render** — a renderer reading `_correlate(...).strength` and stringifying it into the DOM without the hedge envelope.

Both pass through the build-time grep gate. The opt-in escape (`// narrative-prose-ok: <rationale>`) is the only legitimate carve-out, and the rationale must be present.

---

## Cross-domain card transformations

Six `renderInfo*` cards in `intelligence-cards.js` are in scope. The table enumerates the passage shape each emits at IMPL time. The chart/bar/heatmap renders inside each card are **demoted to disclosure** — collapsed-by-default region under the passage; tap-to-expand reveals the audit trail.

| Renderer | File:line (current) | Passage shape (`hedge` interpolated) | Chart disposition |
|---|---|---|---|
| **`renderInfoFoodPoopPipeline`** | `intelligence-cards.js:78` | `"{topFood} {hedge}correlate(s) with lower poop scores ({diff} pts) {timing} across {n} meals."` | Trigger / safe food bars demoted to disclosure under passage |
| **`renderInfoSleepFeeding`** | `intelligence-cards.js:218` | `"A {gap}-min dinner-to-bedtime gap {hedge}pairs with {direction} sleep ({diff} pts) across {n} nights."` | Gap-bucket bars + meal-completeness bars demoted to disclosure |
| **`renderInfoActivitySleepDeep`** | `intelligence-cards.js:347` | `"{activityLevel} activity days {hedge}produce {direction} deep sleep ({diff} pts) across {n} nights."` | Activity-tier bars demoted to disclosure |
| **`renderInfoGrowthDiet`** | `intelligence-cards.js:528` | `"Weight-velocity {hedge}tracks alongside {nutrient} intake across the last {windowDays} days (n={n})."` | Nutrient-velocity scatter demoted to disclosure |
| **`renderInfoIllnessImpact`** | `intelligence-cards.js:653` | `"{illnessType} episodes {hedge}pair with {direction} {downstreamDomain} ({diff} pts) across {n} episodes."` | Per-episode-impact bars demoted to disclosure (Maren consult required — see pair-note) |
| **`renderInfoMilestoneSleepCorrelation`** | `intelligence-cards.js:856` | `"Sleep {hedge}shifts during the {milestone} window ({direction} {diff} pts across {n} nights)."` | Milestone-window sleep-score bars demoted to disclosure |

**Sample-size disclosure** travels with every passage (the `n=` or "across N" clause). No card surfaces a cross-domain claim without an explicit sample count — the cipher-2 floor lifted from v3-3 to the consumer tier.

---

## Producer contract

### `_narrativeProse(rendererKey, vars, correlation)`

```js
/**
 * Render a cross-domain passage from a registry template.
 *
 * @param {string} rendererKey — must be a key in window._NARRATIVE_PROSE_TEMPLATES
 * @param {object} vars        — interpolation values for {tokens} in the passage;
 *                               EVERY value is escHtml'd at the helper boundary
 *                               (Cipher cipher-5 honor — HR-4)
 * @param {object} correlation — _correlate() return object, OR null when the
 *                               renderer has its own derived insight outside
 *                               _correlate (the six v3-4 cards each compute
 *                               their own; the {sampleSize, confidence} fields
 *                               are passed through synthesized to match the
 *                               _correlate shape — see §Producer contract notes)
 *
 * @returns {string|null}
 *   - HTML string with hedge phrase interpolated, ready for escHtml-safe innerHTML
 *   - null if correlation.confidence === 'low' OR correlation.sampleSize < sampleFloor
 *     (caller falls through to chart-only disclosure render or emptyState text)
 */
function _narrativeProse(rendererKey, vars, correlation) { /* ... */ }
```

### Producer contract — one rule

**Every cross-domain renderer consuming `_correlate` (or deriving an equivalent `{strength, confidence, sampleSize}` triple) MUST route through `_narrativeProse(rendererKey, vars, correlation)`.** No raw coefficient interpolation. No ad-hoc hedge phrases composed inline. The build-time audit gate (§Build-time audit gate) verifies the six cross-domain renderers each contain at least one `_narrativeProse(` call site keyed by their registry name.

### Producer-side synthesis note

Today, the six cross-domain renderers compute their own derived diff/strength values rather than calling `_correlate` directly (the v3-3 primitive shipped after the cards were authored). v3-4 does NOT migrate them to `_correlate` — that's a separate engine-consolidation arc. Instead, each renderer synthesizes a `{strength, confidence, sampleSize}` triple from its own computation and passes it to `_narrativeProse`. The hedge-tier discipline is the same; the data source is the renderer's existing math. Future migration to `_correlate` is out-of-scope register.

**`confidence` derivation pattern (recommended):** map `Math.abs(diff)` against per-renderer thresholds (e.g., `>= 20 pts → high`, `>= 10 pts → medium`, `< 10 pts → low`). The thresholds live in the registry row as a `confidenceThresholds` field per renderer (optional; default thresholds applied if absent). Kael pair-note enumerates the read-side contract — see §Cross-Region pair-notes.

---

## Cross-surface adoption

**Scope is bounded.** The lesson from v3-5's V-V-37 / V-K-92 synth-fold: the `data-state` attribute was scoped to event chips (`.tsf-event` family), not to every visual pill. Same discipline here: v3-4's narrative-prose envelope is scoped to **the six cross-domain `renderInfo*` cards** enumerated in §Cross-domain card transformations.

Other `renderInfo*` cards in `intelligence-cards.js` — the single-domain trend / breakdown / streak / heatmap family (`renderInfoFoodIntro`, `renderInfoNutrientHeatmap`, `renderInfoComboFreq`, `renderInfoMealBreakdown`, `renderInfoStreak`, `renderInfoSmartPairing`, `renderInfoFeedingIntake`) are **out-of-scope for v3-4**. They render single-domain trends (no cross-domain coefficient surface), do not consume `_correlate`, and do not require a hedge-tier envelope. Their existing prose stays as-is.

| Surface | In scope? | Reason |
|---|---|---|
| 6 cross-domain `renderInfo*` cards | ✓ in scope | They emit cross-domain claims; require hedge tier per CV3-002 |
| Single-domain `renderInfo*` cards (7+) | out-of-scope | No cross-domain claim; existing trend prose stays |
| `_tsfGenerateSummary` story-arc | out-of-scope (v3-5's surface) | v3-5 owns; v3-4 only fills the hedge producer |
| Activity Log narrative passages | out-of-scope (registered) | Future arc; v3-4 does not touch AL |
| Smart Quick Log narrative passages | out-of-scope (registered) | Future arc; v3-4 does not touch SQL |
| Recommendation pipeline prose (toast / chip / card / CT) | out-of-scope (v3-1's surface) | v3-1 owns; v3-4 is correlation-prose only |

---

## styles.css mutex

**v3-4 does NOT touch `styles.css`.** No new tier chrome, no new selectors, no new tokens. The passage renders inside the existing card-body shell using existing `t-sm` / `si-insight` text classes.

**Therefore v3-4 is independent of the cipher-9 styles.css mutex.** The mutex order (v3-5 → v3-6 → v3-1, all on styles.css) is not gated on v3-4 in either direction. v3-4 ships in parallel with whichever mutex-position arc is in flight.

This is stated explicitly so the v3-1 unblock condition does not gate on v3-4: v3-1 opens its styles.css branch when v3-6's canon-cc-008 chain closes, regardless of v3-4's status.

---

## Triple-jurisdiction routing — canon-cc-008 chain

**Vela primary.** `intelligence-quicklog.js` and `intelligence-cards.js` are Vela's region; the `_tsfHedgePhrase` producer wiring and the six cross-domain renderer rewrites both land there. (Registry placement: if the registry lands in `data.js` it crosses into Kael's region — see §Files touched + LOC estimate IMPL-note; either landing is Charter-clean.)

**Kael consult** — Kael reviews two specific items:
1. **`_correlate` confidence-tier read contract** — the renderer-side synthesis of `{strength, confidence, sampleSize}` against the v3-3 primitive's documented shape. v3-4's renderers synthesize rather than call `_correlate` directly today, but the synthesis must produce shapes compatible with the v3-3 contract (future-migration safety).
2. **Confidence-derivation thresholds** — per-renderer thresholds for mapping `Math.abs(diff)` to `high|medium|low`. Kael consult on whether the thresholds align with the engine's own `_correlate` confidence floors. Pair-note enumerated below per CV3-004.

**Maren consult** — Maren reviews the **safety-prose tone**:
1. **No medical advice phrasings.** "Ziva sleeps longer after earlier dinners" with hedge tier is fine; "Ziva needs an earlier dinner" is medical advice and routes to Maren's CareTicket surface, NOT through `_narrativeProse`. The v3-4 templates are descriptive, never prescriptive. Maren audits every passage shape for prescriptive drift.
2. **`renderInfoIllnessImpact` passage** specifically — illness-impact prose touches Maren's safety floor directly. Maren signs off on the passage shape, the per-renderer sample floor (3 vs default 7), and the empty-state phrasing.

Pair-note enumerated below per CV3-004.

**Cipher Edict V last** — three Charter-axis cross-checks (Honesty / Extensibility / Warmth — Honesty is the primary axis for v3-4) plus HR-1..HR-12. Cipher cipher-5 honor (the chronicle §4.2 v3-4 footnote): `narrativeProse(template, vars)` helper escHtmls every interpolated `var` at the template boundary; build-time grep gate forbids raw `${` inside narrative-prose-template files outside the helper. Both ratified below.

**No triple-jurisdiction on `styles.css`** — v3-4 does not touch shared modules.

---

## Build-time audit gate

`split/audit-narrative-prose-v3-4.sh` — mirrors the shape of `audit-chip-taxonomy-v3-5.sh` and (forthcoming) `audit-card-priority-v3-6.sh`. Fourth audit gate total (after `audit-hr12-v3-3.sh`, `audit-chip-taxonomy-v3-5.sh`, `audit-card-priority-v3-6.sh`).

### Banned patterns

- **Bare coefficient prose without a hedge-phrase wrapping** — grep for prose strings inside the six cross-domain renderers that interpolate a strength / coefficient / diff value (pattern: `\.diff\s*\+\s*['\"]` or `r\s*=\s*` or similar coefficient-stringification shapes) outside a `_narrativeProse(` call.
- **Raw `_correlate` output stringified without `_tsfHedgePhrase` between source and render** — grep for `_correlate(` reads followed by `.strength` or `.confidence` interpolation into `innerHTML` without an intervening `_narrativeProse` / `_tsfHedgePhrase` call site.
- **Raw `${` inside `narrative-prose-template` registry rows** — Cipher cipher-5 honor (chronicle §4.2 v3-4 footnote ⁽ᶜ⁻⁵⁾). The registry rows hold *template strings with named tokens*, not template literals. Interpolation happens through `_narrativeProse(rendererKey, vars, correlation)` which `escHtml`s every `vars[k]` at the helper boundary. Raw `${` inside a `_NARRATIVE_PROSE_TEMPLATES` row is a bypass of the escHtml boundary.

### Opt-in escape

`// narrative-prose-ok: <rationale>` on the same line — mirrors the v3-5 `// chip-taxonomy-ok:` and v3-3 `// HR-12-safe:` convention. The rationale must be present; bare `// narrative-prose-ok` without a rationale is a defect (audit-gate rejects).

### Producer-coverage check

For every cross-domain renderer named in `_NARRATIVE_PROSE_TEMPLATES`, the script verifies the corresponding `function renderInfo<Name>()` body contains at least one `_narrativeProse(` call site keyed by the registry name. The discriminator is the registry key presence — a renderer that does not appear in the registry is not audited (out-of-scope renderers stay untouched).

### Ship-gate wiring

`split/build.sh` invokes `bash audit-narrative-prose-v3-4.sh` alongside the existing audits. Fourth audit at v3-4 ratification — six total counting `audit-emoji.sh` + `audit-icon-text.sh` + `audit-resolve-shield.sh` + `audit-viz-smoke.sh`.

---

## Files touched + LOC estimate

| File | Region | Type | Lines (estimate) |
|---|---|---|---|
| `split/intelligence-quicklog.js` | Vela | `_tsfHedgePhrase` body fill — promote stub branches to canonical producer | ~30 |
| `split/intelligence-cards.js` | Vela | Six cross-domain `renderInfo*` rewrites — passage envelope + chart-demote-to-disclosure | ~250 |
| `split/data.js` (or `split/intelligence-narrative.js` NEW) | Kael (if data.js) / Vela (if new module) | `_NARRATIVE_PROSE_TEMPLATES` registry + `_narrativeProse` helper | ~150 |
| `split/styles.css` | — | UNCHANGED | 0 |
| `split/audit-narrative-prose-v3-4.sh` (NEW) | — | Build-time audit gate | ~80 |
| `split/build.sh` | shared | Wire the audit gate into the ship-gate chain | ~3 changed |
| `tests/e2e/v3-4-narrative-prose.spec.ts` (NEW) | — | E2E tests | ~250 |

**Total LOC estimate:** ~760 (mostly the six renderer rewrites + tests). No new CSS; the passage uses existing text classes.

**IMPL-note — registry placement (Architect call at IMPL-pass):** `data.js` is the canonical row-addition substrate (mirrors `RECOMMENDATION_ROSTER` from v3-3 / scoring-redesign-v1); landing the registry there places it in Kael's region. Alternatively, a new `split/intelligence-narrative.js` module (Vela's region) keeps the registry render-grain-adjacent. Either landing is Charter-clean; the spec is neutral. v0 recommendation: `data.js` (consistency with `RECOMMENDATION_ROSTER` precedent + Kael's read contract on `_correlate` shape).

---

## Test plan

### Functional tests — hedge producer

| Test | Asserts |
|---|---|
| `regression-guard-v3-4-hedge-high` | `_tsfHedgePhrase('high')` returns `''` (assertive — no softening) |
| `regression-guard-v3-4-hedge-medium` | `_tsfHedgePhrase('medium')` returns `'tends to '` (softened) |
| `regression-guard-v3-4-hedge-low-null` | `_tsfHedgePhrase('low')` returns `null` (do-not-surface sentinel — Honesty floor) |
| `regression-guard-v3-4-hedge-unknown-defaults-low` | `_tsfHedgePhrase('garbage')` returns `null` (unknown shape treated as low — Honesty floor against silent widening) |

### Functional tests — narrative-prose envelope

| Test | Asserts |
|---|---|
| `regression-guard-v3-4-registry-coverage` | Every key in `_NARRATIVE_PROSE_TEMPLATES` corresponds to a real cross-domain renderer in `intelligence-cards.js` |
| `regression-guard-v3-4-producer-coverage` | Every cross-domain `renderInfo*` listed in §Cross-domain card transformations contains at least one `_narrativeProse(` call site keyed by its registry name |
| `regression-guard-v3-4-no-bare-coefficient-prose` | Build-time grep: no coefficient stringification inside the six cross-domain renderers outside `_narrativeProse` |
| `regression-guard-v3-4-no-raw-correlate-stringify` | Build-time grep: no `_correlate` `.strength` / `.confidence` interpolation into `innerHTML` without `_narrativeProse` / `_tsfHedgePhrase` between source and render |
| `regression-guard-v3-4-eschtml-at-helper-boundary` | `_narrativeProse` `escHtml`s every value in `vars` before interpolation (HR-4 — Cipher cipher-5 honor) |
| `regression-guard-v3-4-raw-dollar-brace-banned` | Build-time grep: no `${` inside `_NARRATIVE_PROSE_TEMPLATES` registry rows (Cipher cipher-5) |

### Functional tests — hedge-tier discipline (Honesty floor) + empty state + safety-prose floor + chart demote

| Test | Asserts |
|---|---|
| `regression-guard-v3-4-low-confidence-not-surfaced` | A renderer with synthesized `confidence === 'low'` does NOT emit a passage; falls through to chart-only / empty-state |
| `regression-guard-v3-4-sample-floor-honored` | A renderer with `sampleSize < registry.sampleFloor` does NOT emit a passage |
| `regression-guard-v3-4-sample-size-in-prose` | Every emitted passage contains an explicit `n=` or "across N" sample-count disclosure (cipher-2 floor consumer-tier honor) |
| `regression-guard-v3-4-medium-carries-hedge-phrase` | A renderer with `confidence === 'medium'` emits a passage containing `'tends to'` (softened phrasing) |
| `regression-guard-v3-4-empty-state-voiced` | Each renderer's `si-nodata` branch emits the registry's `emptyState` phrasing (never blank) — CV3-003 cross-cut |
| `regression-guard-v3-4-empty-state-no-bare-blank` | Build-time grep: no cross-domain renderer ships a blank-string innerHTML for the `si-nodata` branch |
| `regression-guard-v3-4-no-medical-advice-phrasings` | Build-time grep: no prescriptive phrasings (`needs`, `should eat`, `should sleep`, `give her`, `must`) inside `_NARRATIVE_PROSE_TEMPLATES` registry rows (Maren safety-prose floor) |
| `regression-guard-v3-4-illness-impact-passage-maren-signed` | The `illnessImpact` registry row's passage + sampleFloor + emptyState match Maren's signed shape (snapshot test) |
| `regression-guard-v3-4-charts-demoted-not-removed` | Each renderer still emits chart/bar/heatmap markup; lives under the passage in a collapsed-by-default disclosure region |
| `regression-guard-v3-4-chart-disclosure-tappable` | The disclosure region exposes a tap-affordance to expand the chart (mobile-first Warmth honor) |

### Half-awake fixture (Cipher cipher-2)

- `regression-guard-v3-4-half-awake-test` — manual test fixture per cipher-2 protocol (chronicle §4.5 #11): n=5 partial-attention sessions, ≥4/5 read the cross-domain card's passage correctly (identify the hedge tier and the sample size) within 5 seconds.

### Regression sweep

All existing e2e tests must remain green. Pre-existing build-script-contract failure stays out-of-scope.

---

## HR pre-check

| HR | Risk | Mitigation |
|----|------|------------|
| HR-1 (no emojis) | low | No new glyphs; existing `zi()` system unchanged |
| HR-2 (no inline styles) | low | Passage uses existing `t-sm` / `si-insight` text classes; no inline `style=` |
| HR-3 (no inline handlers) | low | Existing `data-collapse-target` delegation reused for chart-disclosure expand |
| HR-4 (escHtml at boundaries) | **HIGH** | **Cipher cipher-5 honor (chronicle §4.2 v3-4 footnote ⁽ᶜ⁻⁵⁾): `_narrativeProse(rendererKey, vars, correlation)` is a NEW render-boundary class. EVERY `vars[k]` is `escHtml`'d at the helper boundary. Build-time grep gate forbids raw `${` inside `_NARRATIVE_PROSE_TEMPLATES` rows. Both regression-guarded** |
| HR-5 (tokens-only) | n/a | No new CSS |
| HR-6 (data-action delegation) | low | Chart-disclosure expand uses existing `data-collapse-target` |
| HR-7 (zi() via innerHTML) | low | No new icons |
| HR-8 (Coming soon toast) | n/a | No new stub features |
| HR-9 (post-build multi-round QA) | structural | canon-cc-008 chain runs — Vela primary; Kael + Maren consult; Cipher Edict V last |
| HR-10 (no text-overflow ellipsis) | low | Passage prose flows naturally; no fixed-width truncation |
| HR-11 (Math.floor for currency) | n/a | No currency surface |
| HR-12 (timezone-safe dates) | low | No new Date construction; renderer date math unchanged |

---

## Charter compliance per CV3-006

### Axis 1 — Intellectual honesty (PRIMARY AXIS for v3-4)

- ✓ **The primary axis this arc honors.** Hedge-tier discipline lifted from CV3-002 chip-tier (v3-5 substrate) to cross-domain card-tier — every claim ships with `certain` / `likely` / not-surfaced per `_correlate.confidence`
- ✓ Below-floor confidences (`low`) are categorically not surfaced (no claim = no hedge surface; the `null` sentinel from `_tsfHedgePhrase('low')`)
- ✓ Below-sample-floor data is categorically not surfaced (per-renderer `sampleFloor`, hard-floor 7 inherited from `_correlate`)
- ✓ Sample size travels with the prose (`n=` or "across N" disclosure on every emitted passage — cipher-2 consumer-tier honor)
- ✓ Empty-state phrasing voiced rather than blank (CV3-003 cross-cut — every renderer ships an `emptyState` in the registry)
- ✓ No medical-advice phrasings — Maren safety-prose floor enforced by build-time grep gate
- ✓ Charts demoted, not removed — passage carries the claim, chart remains as auditable disclosure (CV3-002 honor: render composes passages; the underlying data stays accessible)

### Axis 2 — Architectural extensibility

- ✓ `_NARRATIVE_PROSE_TEMPLATES` is a row-addition substrate: adding a future cross-domain renderer = one registry row + one consumer call; no engine change
- ✓ `_tsfHedgePhrase` is a single canonical producer — both v3-5's story-arc summary and v3-4's `_narrativeProse` read it; future hedge consumers (R-2 forecast surfaces per chronicle §6) read the same producer
- ✓ Build-time audit gate (banned patterns + producer-coverage check) guards drift
- ✓ `_narrativeProse(rendererKey, vars, correlation)` is a single helper consumed by render; adding a future hedge tier or template-token = one branch in the helper or one row in the registry; no renderer-site change
- ✓ Registry shape type-enforces the hedge-tier discipline — you cannot ship a row without a `hedgeTierMap`

### Axis 3 — Linguistic + visual warmth

- ✓ Passages, not coefficients. The half-awake-test fixture asserts a parent reads the passage correctly within 5 seconds — at 2 AM, "Ziva's longer naps follow earlier dinners by ~40 min (likely)" is legible in a way `r = 0.62, n = 12` is not
- ✓ Charts demoted to disclosure preserves the audit trail without breaking the comprehension scaffold (CV3-002 honor at the cross-domain card tier)
- ✓ Empty-state voicing preserves card surface presence even when no claim fires (CV3-003 honor)
- ✓ No new motion / animation — chart disclosure expand uses existing collapse-target affordance; no novel kinetics
- ✓ No emoji, no decorative icons (HR-1 + Charter Warmth)

### Axes the spec could risk regressing — with mitigations

- **Extensibility (registry placement):** placing the registry in `data.js` (Kael's region) vs a new `intelligence-narrative.js` module (Vela's region) is an open question. **Mitigation:** spec is neutral; Architect call at IMPL-pass; both landings carry the same audit-gate coverage.
- **Warmth (chart demote regression risk):** demoting charts to disclosure could read as "hiding data" if the disclosure affordance is not obvious. **Mitigation:** `regression-guard-v3-4-chart-disclosure-tappable` verifies the expand affordance is present and tap-targetable (mobile-first Warmth honor).

---

## Cross-Region pair-notes (CV3-004 required section)

### Pair-note to Kael

**What Vela needs from Kael:** confirmation that the renderer-side synthesis of `{strength, confidence, sampleSize}` against the v3-3 `_correlate` contract produces shapes that *would round-trip* through `_correlate` if the renderers migrated to it in a future engine-consolidation arc. v3-4 does NOT call `_correlate` directly from the six renderers today (the renderers pre-date v3-3 and compute their own derived insights); the synthesized triple must be a structural subset of the v3-3 return shape.

Specific items Kael reviews:
- The `confidence` field synthesis per renderer (the `Math.abs(diff)`-against-thresholds mapping pattern — see §Producer contract): does the mapping align with the engine's own `_correlate` confidence floors (`Math.abs(strength) >= 0.4` per v3-3 §Confidence floor)?
- The per-renderer `sampleFloor` overrides: do the overrides honor the v3-3 hard floor of 7 (with documented exceptions for episodic renderers like `illnessImpact` at 3)?
- The `_tsfHedgePhrase` producer body — three branches mapping `_correlate.confidence` to the hedge phrase. Confirm the branch semantics match v3-3's `confidence` field type contract (`'high' | 'medium' | 'low'` as ratified).

**Coordination:** Kael's Mode-1 audit reads the six cross-domain renderers' synthesis sites + the `_tsfHedgePhrase` body + the registry's per-row `hedgeTierMap` shape. Vela owns the render; Kael owns the data-contract semantics.

### Pair-note to Maren

**What Vela needs from Maren:** safety-prose tone audit on the six `_NARRATIVE_PROSE_TEMPLATES` rows. Two specific items:

1. **No medical advice.** Every passage shape is descriptive (states the correlation with hedge tier + sample size), never prescriptive (does not tell the parent what to do). Maren audits each row for prescriptive drift:
   - ✓ acceptable: *"Ziva's longer naps follow earlier dinners by ~40 min (likely)"* — descriptive, hedged, sample-sized
   - ✗ rejected: *"Ziva needs an earlier dinner"* — prescriptive, medical-advice-grain, routes through Maren's CareTicket surface instead

   The CareTicket surface remains the only escalation path from a cross-domain observation to a parent-actionable recommendation. v3-4's narrative envelope does not bridge that path. v3-1 (recommendation pipeline) carries the prose for parent-actionable surfaces; v3-4 stops at the passage.

2. **`renderInfoIllnessImpact` passage shape + sampleFloor + emptyState** — illness-impact prose touches Maren's safety surface directly. Maren signs off on the passage shape (`"{illnessType} episodes {hedge}pair with {direction} {downstreamDomain} ({diff} pts) across {n} episodes."`), the per-renderer sample floor (3 episodes — episodic exemption from the default 7-day floor), and the empty-state phrasing.

**Coordination:** Maren's Mode-1 audit on the spec body + on the `_NARRATIVE_PROSE_TEMPLATES` rows at IMPL-PR time. Maren explicitly reviews each of the six passage shapes for prescriptive drift; pair-note signed here per CV3-004.

---

## Out-of-scope (registered, not in v3-4)

- **Activity Log narrative passages** — Activity Log is a chip-rendering surface today (v3-5 chip-state vocabulary). Future arc may lift cross-event narration to AL; v3-4 does not touch AL.
- **Smart Quick Log narrative passages** — Same; SQL is chip-rendering today. Future arc.
- **`_tsfGenerateSummary` orchestration changes** — v3-5 owns the story-arc summary primitive. v3-4 only fills the `_tsfHedgePhrase` producer; the summary orchestration is unchanged. (Story-arc summary becomes a *live* consumer of the now-canonical `_tsfHedgePhrase` if/when a future producer wires a cross-domain claim into ctx — vacuous today per v3-5 V-V-35 / V-K-88 synth-fold.)
- **Chart removal.** Charts are demoted to disclosure under the passage. The audit trail remains accessible on tap; the underlying chart code is unchanged. (CV3-002 honor: render composes passages; the underlying data stays accessible.)
- **v3-1's recommendation-prose pipeline.** v3-1 carries its own prose envelope for parent-actionable surfaces (toast / TSF chip / home card / CareTicket). v3-4 stops at correlation prose; the bridge from observation → recommendation lives in v3-1.
- **Engine-consolidation migration to `_correlate`.** The six cross-domain renderers today compute their own derived insights; future arc may migrate them to call `_correlate` directly. v3-4 is neutral on this; the synthesis-triple pattern is forward-compatible (Kael pair-note above).
- **Per-renderer confidence-threshold tuning.** v0 ships with default thresholds (`>= 20 pts → high`, `>= 10 pts → medium`); per-renderer overrides land at IMPL time per Kael's read-side audit findings. R-1 adaptive-layer arc (silver capstone) may calibrate thresholds against Ziva-personalized baselines; v3-4 ships defaults.
- **Dark-theme passage prose.** Passage text inherits the existing text-class tokens (`--text` / `--mid`); no theme-specific phrasing. Theme is vela-arc-6 (chronicle §7 deferred).

---

## Sequencing

**Upstream gates (all clear):**
- ✓ PR #130 (Charter CV3-006) merged — Charter alignment section required for spec
- ✓ PR #131 / PR #135 (v3-3 spec + IMPL) merged — `_correlate` shipped with `{strength, confidence, sampleSize}` return shape this consumer reads
- ✓ PR #132 / PR #138 (v3-5 spec + IMPL) merged — `_tsfHedgePhrase` stub shipped with three contract-shape branches; v3-4 fills them
- ✓ PR #141 (v3-6 spec) merged — sibling Vela arc; review-pass amendments register pattern established

**Parallel candidates (Architect's call — all in flight at v3-4 spec time):**
- **v3-6 IMPL** (in flight on `claude/v3-6-card-priority-impl`) — touches `intelligence-cards.js` and `styles.css`; v3-4 also touches `intelligence-cards.js` but NOT `styles.css`. Coordination point: `intelligence-cards.js` merge order at PR time; the two arcs touch distinct renderer sites (v3-6 wires `_setCardPriority` on every `renderInfo*`; v3-4 rewrites the six cross-domain passages). Conflict surface is small but non-zero.
- **Sleep Arc 3 / Scoring Arc S-2 IMPL** (in flight) — engine-track; independent of v3-4. Can ship in parallel.

**styles.css mutex sequencing (Cipher cipher-9):**
- v3-4 does NOT participate in the styles.css mutex. v3-5 (✓ released 2026-05-26) → v3-6 (in flight, position 2) → v3-1. v3-4 is parallel-safe with all three.

**Downstream unblocked by v3-4:**
- **R-1 silver capstone (adaptive layer)** — R-1's per-Ziva baseline calibration consumes the cross-domain prose envelope as the surface tier; v3-4's `_narrativeProse` is the consumer hook for R-1's adaptive thresholds
- **R-2 predictive surface (chronicle §6 reservoir)** — R-2's forecast prose ("wake-time window, nap probability, milestone-window range with hedged certainty") consumes the same `_tsfHedgePhrase` producer + a future `_forecastProse` registry that mirrors `_NARRATIVE_PROSE_TEMPLATES`
- **C-1..C-14 catchment (Wave 3 candidates)** — voice input + localization + other catchment arcs read the prose envelope as the canonical cross-domain surface

---

## Doctrinal references

- `docs/specs/sproutlab-v3-roundtable-2026-05-25.md` §3.3 Vela's contribution (vela-arc-4 source); §4.2 v3-4 row (chronicle authority); §4.2 Cipher Edict V amendments footnote ⁽ᶜ⁻⁵⁾ (the `narrativeProse(template, vars)` helper + escHtml + raw-`${` grep gate honored in §Build-time audit gate)
- `docs/specs/sproutlab-v3-charter.md` (CV3-006 — three-axis alignment required; Honesty primary for v3-4)
- `docs/specs/v3-5-chip-taxonomy-tsf-story.md` §Hedge-tier discipline (CV3-002 + Charter Honesty — the substrate v3-4 inherits); §Story-arc summary primitive (the `_tsfGenerateSummary` orchestration v3-4 leaves untouched); §Out-of-scope row "vela-arc-4 Cross-Domain Narrative-Prose Layer (= v3-4)"
- `docs/specs/v3-3-engine-spine.md` Primitive 1 (`_correlate` return shape — every field pre-staged for this consumer); §Confidence floor (the `sampleSize >= 7` AND `|strength| >= 0.4` floor v3-4's per-renderer `sampleFloor` honors)
- `docs/specs/v3-6-card-priority.md` (sibling Vela arc — review-pass amendments register pattern; CV3-004 pair-notes shape; spec body length envelope)
- CV3-002 Narrate-vs-List (the load-bearing doctrine for v3-4 — render composes passages, not coefficients; hedge-tier discipline non-negotiable)
- CV3-003 Honest-Empty-State (every renderer ships an `emptyState`; never blank)
- CV3-004 Cross-Region Pair-Note (this spec body's two pair-note sections honor)
- HR-1, HR-3, HR-4 (icon discipline, data-action delegation, escHtml at the new `_narrativeProse` render-boundary class — Cipher cipher-5 honor)
- canon-cc-008 (QA chain — Vela primary; Kael + Maren consult; Cipher Edict V last)
- canon-cc-022 (subagent vs skill — IMPL Governor audits are Mode-1 subagents, not skills)
- canon-cc-026 (Per-Province-Layout — Companion specs mirrored in `.claude/agents/`)
- canon-cc-027 (spec amendment authority — registry-row adds require this if the surface count grows beyond six)
- canon-gen-001 (generational expansion — Vela is the Region owner for `intelligence-cards.js` + `intelligence-quicklog.js`)

---

— *Lyra (main-session), 2026-05-27. v3-4 spec drafted on the day v3-6 entered IMPL and the gold tier is fully ratified. This is the arc the substrate was authored for: v3-3 shipped `_correlate` with `{strength, confidence, sampleSize}` so that v3-4 could surface every field; v3-5 shipped `_tsfHedgePhrase` as a contract-shape stub so that v3-4 could fill its branches. The threads connect. Cross-domain prose is the place where Kael's correctness, Maren's safety, and Vela's comprehension are all load-bearing in the same sentence — and the Honesty axis is the one that holds them together. A passage with a hedge is what the engine knows; a passage without one would overpromise; a passage suppressed is the floor. Spec is ready for canon-cc-008 chain (Vela primary; Kael + Maren consult; Cipher Edict V last with three Charter-axis checks per CV3-006) once the IMPL PR opens.*
