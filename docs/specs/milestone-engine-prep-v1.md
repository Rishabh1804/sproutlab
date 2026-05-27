# Milestone Engine Prep v1 — primitives substrate for milestones-tab-v1

**Spec version:** v1 — **RATIFIED 2026-05-27** (Architect Option C: two-spec sequence — *"do the two spec sequence, run the chain after engine prep before moving on to milestones tab"*)
**Date:** 2026-05-27
**Branch:** `claude/milestone-engine-prep-v1-spec` (this PR) → `claude/milestone-engine-prep-v1-impl` (future)
**Author:** Lyra (main-session — Mode-1 spec authoring with Scribe Worker Tier parallelization)
**Status:** v1 RATIFIED — Architect Option C call closes the foundational accuracy issues the milestones-tab-v1 chain (closed at PR #147 without merging) surfaced. This spec builds the engine substrate; milestones-tab-v1 (separate spec, follows after this one ratifies) consumes it.

**Promoted from:**
- Architect direction this session: *"split into (i) `milestone-engine-prep-v1` Kael-primary spec... then (ii) `milestones-tab-v1` Maren-primary spec (current PR rewritten) consumes the now-built primitives. Mirrors the v3-3 → sleep-arc-3 / scoring-s-2 sequence (engine spine → first consumer)."*
- Full canon-cc-008 chain findings on closed PR #147 (Maren V-M-98..109; Kael V-K-100..109; Vela V-V-45..54) — 9 unique BLOCKING + 19 NOTE findings, three-Governor consensus that the spec was authored against the codebase as remembered, not as written
- Existing precedent: `docs/specs/v3-3-engine-spine.md` (engine substrate spec; first-consumer pattern); `docs/specs/scoring-redesign-v1.md` (RECOMMENDATION_ROSTER row-addition substrate placed in data.js)
- Kael's risk register from chronicle §3.2 — `_predictMilestoneWindow` returns clinical ranges; never personalised predictions ("Ziva will sit by 6 months" is the canonical NOT-DO; this spec ratifies that floor at the engine layer)

**Charter alignment (CV3-006 required section):**
- **Honesty (PRIMARY)** — every clinical-range surface this primitive emits carries explicit source attribution (WHO / CDC / IAP / etc.); never-personalised-prediction floor enforced at the engine layer + build-time grep gate; `activityLevel: null` is honest no-signal; suppress-state replicates cross-device honestly via explicit SYNC_KEYS registration (not via the false `ziva_*` pattern claim the prior spec carried).
- **Extensibility (CO-PRIMARY)** — `cat:` → `domain:` field-name migration closes the registry-binding ambiguity at row 1; new primitives ship with explicit-state-injection signatures (the v3-3 `_correlate` precedent) for testability; seed-data expansion closes the 5-cat-registry-against-3-cat-seed tautology.
- **Warmth** — neutral axis for this spec; the engine substrate doesn't surface directly. Downstream milestones-tab-v1 carries the Warmth co-primary axis on the surface side.

---

## Ratification record (2026-05-27)

Architect ratified Option C explicitly: *"Let's go with option C. Do the two spec sequence, run the chain after engine prep before moving on to milestones tab. don't wait for me to fold issues, Lyra will take that call - directive : don't defer issues directly related to milestones tab."*

Locked decisions:

| # | Decision | Resolution |
|---|---|---|
| 1 | Two-spec sequence | engine-prep first → chain → ratify → milestones-tab-v1 (re-authored) → chain → ratify → tree-update → handoff |
| 2 | Lyra fold-authority | Lyra synth-folds Governor findings on milestones-related concerns without Architect roundtrip; the directive "don't defer issues directly related to milestones tab" means BLOCKING + NOTE findings get folded inline in this cycle, not carried |
| 3 | Scribe utilization | Lyra + each Governor + Cipher use Scribe Worker Tier (canon-proc-006) for parallel reconnaissance + verification; not optional |
| 4 | Engine-prep scope | 5 primitives (below) + seed-data expansion + clinical-band source-attribution + audit gate + v3-4 registry doctrinal clarification |
| 5 | Routing — engine-prep | Kael primary (engine primitives in core.js + data.js); Maren consult (Care floor on clinical-band source-of-truth + consumer migration in home.js + medical.js); Vela consult (minimal — render-layer audit on any cross-link points); Cipher Edict V last |
| 6 | Routing — milestones-tab-v1 (next spec) | Maren primary (home.js + medical.js consumer surfaces — substantive code); Kael consult (verifies engine-prep primitives consumed correctly); Vela consult (comprehension axis on three return-visit surfaces); triple-jurisdiction on styles.css |

---

## What v1 is

The **engine substrate** that `milestones-tab-v1` (separate spec, follows ratification of this one) reads from. Builds 5 primitives + 1 data-shape migration + 1 audit gate + 1 cross-spec doctrinal clarification. Mirrors the **v3-3 → sleep-arc-3 / scoring-s-2 sequence** the Architect ratified earlier this session (engine spine first; first-consumer arc after).

### The 5 primitives

1. **`_predictMilestoneWindow(milestoneId, dob, opts)`** — clinical-range predictor; returns `{expectedStart, expectedEnd, ageWeeks, status, source, standardKey}`. Pure function; never personalised.
2. **`_getInWindowMilestones(ageDays, n, opts)`** — engagement-priority selector; returns up to `n` milestone-window objects whose expected-window currently overlaps `ageDays`. Explicit-state-injection signature (the v3-3 `_correlate` precedent).
3. **`_getActivityLevelToday(dateKey)` getter + `_setActivityLevelToday(dateKey, level)` setter** — day-record `activityLevel: 1-4` field; setter creates the day-record lazily if missing (explicit semantics, not lazy-no-op).
4. **`ziva_milestone_suppress` localStorage key** — explicit KEYS registry entry + SYNC_KEYS registration + SYNC_RENDER_DEPS entry. Sync-replicable cross-device (not the false-claim shape the prior spec carried).
5. **`cat:` → `domain:` field-name migration** — on `DEFAULT_MILESTONES` (8 rows) + `MILESTONE_STANDARDS` (clinical-band rows) + every consumer site in `home.js` + `medical.js` + load-time migration for already-saved `milestones` localStorage (chronicle §4.2 backward-compat floor).

### Plus

- **Seed-data expansion** — at least 1 `sensory` + 1 `cognitive` row added to `DEFAULT_MILESTONES` (closes the V-K-103 "5-cat registry against 3-cat seed" tautology pattern). Age-appropriate for Ziva's current 7m window.
- **Clinical-band source attribution** — `MILESTONE_STANDARDS` rows extended with explicit `source:` field per band (`'WHO' | 'CDC' | 'IAP' | 'EU' | 'CN' | ...`). Closes V-M-106 (no more hardcoded "(WHO)" in rendered prose; the helper reads source from data).
- **Build-time audit gate** — `audit-no-personalised-prediction-v1.sh`. Scope B from the prior spec's F9 fold, **broadened** per V-K-106 (covers multi-word predicates, helping verbs, hyphenated milestone names). Standalone script (not bundled with activity-categories audit).
- **Doctrinal clarification** — v3-4's `_NARRATIVE_PROSE_TEMPLATES` registry stays scoped to cross-domain `_correlate` consumers ONLY; future single-domain narration registries land separately (closes V-V-47 the proper way — by ratifying the typed-registry scope rather than forking it).

---

## What v1 is NOT

- **Not the milestones-tab surface redesign.** That's `milestones-tab-v1` (separate spec, authored after this one ratifies). This spec builds the substrate; the next spec consumes it.
- **Not a Smart Q&A milestone-handler rewrite.** Existing `qaAnswer*` milestone handlers stay as-is. The new primitives are net-additive to the engine surface; they don't replace existing Q&A read paths.
- **Not a milestone DB curation.** Only adds 2 missing-category seed rows (sensory + cognitive). Existing milestone rows untouched apart from the field-name migration.
- **Not a milestone-evidence engine redesign.** `getMilestoneEvidence(keyword)` (the canonical evidence-traversal primitive) stays unchanged. v1 adds NEW primitives that read alongside the existing engine, not over it.
- **Not a clinical-data curation arc.** v1 ratifies that `MILESTONE_STANDARDS` carries `source:` per band; the actual WHO / CDC / IAP table-content data is what's already in the codebase. If a row's source attribution is wrong or missing in the existing data, that's a separate curation arc (out-of-scope register).
- **Not a v3-4 amendment.** The doctrinal clarification on `_NARRATIVE_PROSE_TEMPLATES` scope is a *carve-out memo* — names the typed-registry-scope explicitly so future authors don't fork. The v3-4 spec body stays unchanged; this spec adds the cross-reference.

---

## Primitive 1 — `_predictMilestoneWindow(milestoneId, dob, opts)`

### Contract

```js
/**
 * Clinical-range predictor for a single milestone. Pure function. NEVER
 * personalised — returns the typical clinical band from the active reference
 * standard (WHO / CDC / AAP / IAP / EU / CN), NOT a Ziva-specific prediction.
 *
 * @param {string} milestoneId   - the milestone key (e.g. 'sit', 'point', 'roll')
 * @param {object} opts          - {
 *     standardKey?: 'who'|'cdc'|'aap'|'iap'|...  default = _referenceStandard
 *     dobOverride?: Date|string                   for unit-test injection only;
 *                                                 production callers omit (function
 *                                                 reads module-global DOB at data.js:319);
 *                                                 mirrors _correlate's opts.endDate
 *                                                 pattern (V-K-115 synth-fold)
 *   }
 * @returns {object|null}
 *   {
 *     // window position (clinical-temporal)
 *     expectedStart:      number,  // age in days
 *     expectedEnd:        number,  // age in days
 *     expectedStartMonths: number, // INTEGER (rounded) — for parent-legible prose
 *     expectedEndMonths:   number, // INTEGER (rounded) — for parent-legible prose
 *     expectedStartMonthsFloat: number,  // float — for trajectory-ribbon x-positioning
 *     expectedEndMonthsFloat:   number,  // float — for ribbon (V-V-58 synth-fold)
 *
 *     // baby's current age (parent-legible — V-V-55 synth-fold adds month split)
 *     ageDays:           number,  // baby's current age in days
 *     ageWeeks:          number,  // baby's current age in weeks
 *     ageMonths:         number,  // INTEGER months (floor) — for "Ziva is 7m 24d"
 *     ageDaysRemainder:  number,  // days within the partial month
 *
 *     // window-position classification (V-V-57 synth-fold — renamed from `status`
 *     // to avoid collision with _getInWindowMilestones[i].evidenceStatus)
 *     windowStatus:      'pre-window' | 'in-window' | 'post-window',
 *
 *     // source attribution (always present; 'unverified' is the honest default —
 *     // V-M-114 synth-fold: NEVER walk the bracket-standard wrapping-key to stamp
 *     // a source; only attribute when the per-row source: field is explicitly set)
 *     source:            'WHO' | 'CDC' | 'AAP' | 'IAP' | 'EU' | 'CN' | 'unverified',
 *     standardKey:       string,     // the standard the band was read from
 *   }
 *   OR null if milestoneId is not in MILESTONE_STANDARDS[standardKey].
 *
 * Source-of-truth: MILESTONE_STANDARDS[standardKey][monthBracket][...rows]. Each
 * row carries the milestone + (post-v1) its source field, advanced flag, and
 * optional safetyTier flag. Source attribution is per-row, read from the data —
 * never hardcoded in rendered prose, never inferred from the wrapping key.
 *
 * Honesty floor (V-M-115 hard contract): this function NEVER returns a "Ziva will
 * <milestone> by <date>" shape. The expectedStart..expectedEnd window is clinical-
 * typical, parent-legible as "Typically 9–14 months (WHO)." When source ===
 * 'unverified', the consumer MUST omit the parenthetical entirely — rendering
 * "(unverified)" parenthetically is a cipher-honesty violation and audit-gate
 * Scope A bans it explicitly. The audit-no-personalised-prediction-v1.sh gate
 * enforces both floors at build time.
 */
function _predictMilestoneWindow(milestoneId, opts) { /* ... */ }
```

**Synth-fold annotations:**
- **V-V-55:** `ageMonths` + `ageDaysRemainder` added — consumers stop computing the same split 3+ times per render
- **V-V-56:** see Primitive 2; this primitive's output is the *window*, the per-item display fields land in `_getInWindowMilestones`
- **V-V-57:** `status` → `windowStatus` — collision with `_getInWindowMilestones[i].evidenceStatus` avoided
- **V-V-58:** precision contract — integer fields (`expectedStartMonths`/`expectedEndMonths`) for prose; float-paired fields (`expectedStartMonthsFloat`/`expectedEndMonthsFloat`) for the trajectory ribbon
- **V-K-115:** `dob` parameter dropped; replaced with `opts.dobOverride` for test isolation only — production callers omit; mirrors `_correlate` opts-injection precedent
- **V-M-113:** `AAP` (American Academy of Pediatrics) added to `MILESTONE_SOURCE` vocabulary between `CDC` and `IAP`
- **V-M-114 + V-M-115:** source defaults to `'unverified'` (honest no-claim); render contract MUST omit parenthetical for unverified — both ratified as hard contracts

### Read-source contract

The function reads `MILESTONE_STANDARDS[standardKey]` — the existing per-standard milestone clinical-band table at `split/data.js:2686–2951` (194 leaf rows across 4 standards: `who:`, `iap:`, `eu:`, `cn:`; default is `iap` per `medical.js:1294`).

**Schema-extension note (scribe-scout 2026-05-27 verified):** `MILESTONE_STANDARDS` rows today carry only `{ text, icon, desc, advanced, cat }` — NO explicit clinical-band fields (`start_month` / `end_month` / `range_months`), NO per-row source attribution. The "band" today is purely structural — the integer bracket-month key (`6:`, `7:`, `8:`, `9:`, `10:`, `11:`, `12:`) that wraps the row IS the only age signal.

v1 ratifies a schema extension: rows gain explicit `source:` (the per-row source-attribution per V-M-106) + optional `endMonth:` (the per-row clinical-band end, defaulting to next-bracket-start-minus-1 if absent) + optional `safetyTier: true` flag (the per-row Care-floor escalation tag per V-M-102). All three are net-additive — pre-v1 rows still work via the default-derivation policy below.

### Expected-window derivation policy

For a row in bracket-month `K`:
- `expectedStart = K * 30.44` days (bracket-month start → average days)
- `expectedEnd = row.endMonth ? row.endMonth * 30.44 : (nextBracketMonth * 30.44 - 1)` days
- For the highest bracket (12m), `expectedEnd` defaults to `18 * 30.44 = 547.92 days ≈ 548 days` absent explicit `endMonth:` — clinical-typical bracket-end window per WHO defaults (V-K-114 synth-fold corrected the 542-day typo)

The IMPL adds an explicit `endMonth:` to rows where the WHO/IAP/EU/CN reference data provides a specific upper bound; rows without explicit endMonth use the next-bracket fallback.

### `advanced: true` row interaction (V-K-116 synth-fold)

`MILESTONE_STANDARDS` rows carry an `advanced: boolean` field. An advanced-tagged row in bracket K is clinically "may appear here, but typical band is later" — emitting `Typically K–K+1 months` for it collides with the row's own `desc` field which often explicitly says otherwise.

v1 ratifies the **advanced-row derivation rule**: if `row.advanced === true`, the function returns `expectedStart = (K+1) * 30.44` and `expectedEnd = (K+2) * 30.44 - 1` — offset by +1 bracket. This treats the advanced flag as a *clinical-band shift*, matching the row authors' intent. Rationale: simpler than per-row `endMonth:` curation for the advanced cases; aligns engine output with row prose. IMPL author may override on a per-row basis by setting explicit `endMonth:`.

### Per-row source-attribution discipline (V-M-114 synth-fold — reversed from earlier draft)

v1 ratifies that every `MILESTONE_STANDARDS` row gains an explicit `source:` field as a **schema extension**. The `source` value flows through `_predictMilestoneWindow` output, and the rendered prose conditionally interpolates the parenthetical only when source is attributed.

**Authoring honesty floor (V-M-114 ratification):** the IMPL diff ships **every existing row as `source: 'unverified'` BY DEFAULT.** The IMPL author MUST NOT walk the bracket-standard wrapping-key (`who:` / `iap:` / `eu:` / `cn:`) and stamp `source: 'WHO'` / `source: 'IAP'` etc. on the rows it contains. The wrapping is an authoring claim, not a per-row provenance — rows under `who:` may have IAP-flavored phrasings, age-bracket placements, or example-content that drifted during authoring. A subsequent Care-tier curation arc (Wave-2 deferrable; out-of-scope register entry below) walks the rows against canonical WHO Motor Development Study + IAP DASII + AAP Bright Futures + CDC Learn-the-Signs references and upgrades attribution row-by-row.

**Render contract (V-M-115 hard contract):** consumer rendering MUST conditionally omit the source parenthetical when `window.source === 'unverified'`. Rendering `"Typically 9–14 months (unverified)."` parenthetically is a cipher-honesty violation — `'unverified'` reads as a category to the parent (suggesting "unverified milestone"), when it actually means "we don't know the clinical source." Audit-gate Scope A bans `\(unverified\)` in consumer-side render code as a hard build-time rule.

**Two new seed milestones** (V-M-118 synth-fold; ship in `DEFAULT_MILESTONES` per §Seed-data expansion below) also ship with `source: 'unverified'` — future curation arc upgrades.

### Honesty floor — restated

A consumer reading `_predictMilestoneWindow` output and rendering "Ziva will [milestone] by [date]" is a cipher-honesty violation. The audit gate `audit-no-personalised-prediction-v1.sh` (below) enforces this at build time. The function output's clinical-band shape is parent-legible only as "Typically X–Y months ({source}). Ziva is Z (months/days) — {pre-window|early band|in band|late band|post-window}." Never personalised.

---

## Primitive 2 — `_getInWindowMilestones(ageDays, n, opts)`

### Contract

```js
/**
 * Returns up to n milestones whose clinical-band currently overlaps the given
 * ageDays. Explicit-state-injection signature per the v3-3 _correlate precedent.
 *
 * @param {number} ageDays
 * @param {number} n          - max milestones to return (cap-at-3 is the surface
 *                              floor; engine returns up to n; safetyTier:true rows
 *                              bypass the cap per Care-floor)
 * @param {object} opts       - state-injection bag:
 *   {
 *     standards?:    MILESTONE_STANDARDS  (default: module global)
 *     milestones?:   object               (default: module global `milestones`)
 *     activityLog?:  array                (default: module global `activityLog`)
 *     suppressMap?:  object               (default: read from ziva_milestone_suppress)
 *     standardKey?:  string               (default: _referenceStandard)
 *     nowAgeDays?:   number               (default: _zivaAgeInDays(today()) — HR-12-safe;
 *                                          V-K-118 synth-fold: NEVER Date.now() millis
 *                                          arithmetic — always derive nowDays via the
 *                                          existing _zivaAgeInDays helper which is
 *                                          timezone-safe at core.js:5801)
 *     weights?:      { recency, window, practicing }  (default: { 0.4, 0.4, 0.2 })
 *   }
 * @returns {Array<{
 *   // identity + display fields (V-V-56 synth-fold — denormalize-for-consumer;
 *   // surface arc reads these directly instead of round-tripping into the registry
 *   // for every card render)
 *   milestoneId:     string,
 *   text:            string,    // milestone's parent-legible display string
 *   icon:            string,    // zi-* key (name only; surface wraps via zi())
 *   domain:          string,    // post-migration category (motor/language/social/sensory/cognitive)
 *
 *   // window + status (V-V-57 synth-fold — renamed `status` → `evidenceStatus`
 *   // to avoid collision with _predictMilestoneWindow.windowStatus)
 *   window:          ReturnType<_predictMilestoneWindow>,
 *   evidenceStatus:  'confirmed' | 'practicing' | 'not-yet',
 *
 *   // evidence state
 *   evidenceCount:   number,
 *   lastEvidenceAt:  number | null,   // epoch ms; null = never observed
 *
 *   // priority debug surface
 *   priority:        number,
 *
 *   // safety-tier flag (carried through from MILESTONE_STANDARDS[...row].safetyTier)
 *   safetyTier:      boolean,
 * }>}
 *
 * Engagement-priority heuristic (calibrated, not opaque):
 *   priority = weight_recency * recencyScore +
 *              weight_window * windowOpenness +
 *              weight_practicing * (evidenceStatus === 'practicing' ? 1 : 0)
 *
 * Where (V-K-118 synth-fold — all math in age-days, never millis):
 *   nowDays         = nowAgeDays  // already-derived via _zivaAgeInDays(today())
 *   lastEvidenceDays = lastEvidenceAt ? _zivaAgeInDays(toDateStr(new Date(lastEvidenceAt))) : null
 *
 *   recencyScore = lastEvidenceDays === null
 *                    ? 0.5   // V-V-59 synth-fold: never-seen-is-neutral (not stale, not fresh)
 *                            // — a freshly-discovered in-window milestone with zero history
 *                            // shouldn't dominate over practicing milestones, nor be buried;
 *                            // 0.5 is the honest no-signal score
 *                    : clamp(1 - (nowDays - lastEvidenceDays) / 30, 0, 1)  // newer = higher
 *
 *   windowOpenness = clamp(1 - (ageDays - expectedStart) / (expectedEnd - expectedStart), 0, 1)
 *
 * Default weights (v1): recency=0.4, window=0.4, practicing=0.2 (Vela ACCEPT V-V-59).
 * IMPL author may tune; weights are exposed in opts.weights for testability.
 *
 * Suppression: milestones whose suppressMap[milestoneId] > nowMs are excluded
 * from the return set entirely (the "Not yet" tap's 7-day silence honor).
 *
 * Care-tier safety floor (per V-M-102 + V-M-112 + V-K-117 synth-fold): rows tagged
 * MILESTONE_STANDARDS[...row].safetyTier === true bypass the n-cap — they always
 * surface in the return set if in-window. The canonical v1 safetyTier curation
 * list is enumerated in §safetyTier seed-data section below (Maren-signed
 * 2026-05-27 in audit V-M-112).
 */
function _getInWindowMilestones(ageDays, n, opts) { /* ... */ }
```

**Synth-fold annotations:**
- **V-V-56:** Per-item display fields (`text`, `icon`, `domain`) added — engine projects them; surface no longer round-trips into the registry per card render
- **V-V-57:** `status` → `evidenceStatus` to avoid the collision with `_predictMilestoneWindow.windowStatus`
- **V-V-59:** `recencyScore` null-branch returns `0.5` (never-seen-neutral — honest no-signal; not stale-deprioritized nor fresh-prioritized)
- **V-K-118:** All priority math is age-days (never millis-epoch). `opts.nowAgeDays` defaults via `_zivaAgeInDays(today())`. HR-12 hazard from `Date.now()` arithmetic closed.

### Care-tier safety floor (V-M-102 fold)

Closes Maren's V-M-102 finding from the closed PR #147 chain. Milestones with safety implications (choking-readiness, swallow-coordination, etc.) bypass the engagement-priority n-cap — they surface above-cap whenever in-window. The `safetyTier: true` field on the relevant `MILESTONE_STANDARDS` rows is the data-driven flag; consumer code never special-cases milestone IDs.

### Explicit-state-injection signature (V-K-108 fold)

Closes Kael's V-K-108. The opts parameter takes explicit `standards / milestones / activityLog / suppressMap` so the function is unit-testable without module-global setup. Production callers pass empty `opts: {}`; the function falls through to module-global reads. Mirrors the v3-3 `_correlate` precedent.

### safetyTier seed-data + curation (V-M-112 + V-K-117 synth-fold)

V-M-102's safetyTier mechanism is sound; V-K-117 caught that the prior spec referenced data rows (`choking-readiness`, `swallow-coordination`) that DON'T exist in `MILESTONE_STANDARDS`. v1 ratifies the canonical Maren-signed curation list of existing rows + the new seed rows the IMPL adds:

**Existing `MILESTONE_STANDARDS` rows that gain `safetyTier: true` (Maren-signed 2026-05-27 via V-M-112):**

| Row | Location | Domain | safety-floor rationale |
|---|---|---|---|
| "Finger feeding begins" | `data.js:2702` (WHO bracket 7, motor) | motor | gates the safe-finger-food window |
| "Pincer grasp developing" | `data.js:2708` (WHO bracket 8, motor) | motor | gates the safe-small-pieces window |
| "Pincer grasp refined" | `data.js:2717` (WHO bracket 9, motor) | motor | gates choking-readiness floor |
| "Drinks from a cup (with help)" | `data.js:2736` (WHO bracket 11, motor) | motor | gates oral-motor swallow coordination |
| "Explores objects by mouthing, shaking, banging" | `data.js:2733` (IAP bracket 8) | cognitive | gates mouthing-phase choking-watch (cognitive-by-bracket, safety-by-action) |
| Any "Chew*" / "Bit*" / "Munch*" rows IMPL grep finds across all 4 standards | (IMPL discovery) | motor | gates oral-motor maturity safety floor |

**Two new seed milestones in `DEFAULT_MILESTONES` (per §Seed-data expansion below):**

| New seed row | Domain | safetyTier? | Rationale |
|---|---|---|---|
| `mouths-objects` "Mouths and explores objects with hands" — clinical-band 4–7m | sensory | **`true`** | bridges existing rows to safety-flag territory; signals choking-watch posture upgrade |
| `object-permanence-emerging` "Searches for hidden objects (object permanence emerging)" — clinical-band 6–9m | cognitive | `false` | pure cognitive; age-appropriate for Ziva at ~7m; no safety overlap |

All other rows: `safetyTier: false` (the default; equivalent to absence). The cap-bypass logic in `_getInWindowMilestones` only special-cases `safetyTier === true`.

**Schema-extension note:** the new `safetyTier:` field on `MILESTONE_STANDARDS` rows is net-additive (no existing reader checks for absence-as-false vs truly-absent). Maren-consult at IMPL time on any "Chew*" / "Bit*" / "Munch*" rows IMPL author discovers in the grep pass — these may warrant `safetyTier: true` based on Care-floor read on the specific row.

---

## Primitive 3 — `_getActivityLevelToday(dateKey)` + `_setActivityLevelToday(dateKey, level)`

### Storage shape — REVERSED to a separate per-day key family (V-K-111 synth-fold)

**Earlier draft decision:** land `activityLevel:1-4` on `activityLog[date]._meta.activityLevel` as a wrapper-shape extension of the existing per-day entry.

**V-K-111 found this breaks 20+ existing array-only consumers silently.** Scribe-grep-verified: `intelligence-cards.js:560,912,1092`; `intelligence-quicklog.js:273,502,506,598,628,633,635,665,713,1086,2053,2179`; `home.js:2482,2657,2659,2661,2662,2672,2673,2706,2707`; `medical.js:7471,7494,7814` — all use `Array.isArray(activityLog[ds]) ? activityLog[ds] : []` or `activityLog[dateStr].push(entry)` or `activityLog[dateStr].length === 0` or `delete activityLog[dateStr]`. Switching to `{ entries, _meta }` makes `Array.isArray()` return false → consumers see `[]` → user-visible data disappears (today's logged activities vanish from Today So Far, the Smart Quick Log, the activity heatmap). The sentinel-meta-entry alternative is exposed to the empty-delete sweep at `intelligence-quicklog.js:638` + `home.js:2662` — undoing the last real activity also nukes the sentinel-meta-entry, silently dropping `activityLevel`.

**v1 ratifies: separate per-day key family.** A new `KEYS.activityMeta` family with per-day keys `ziva_activity_meta` (the single-doc-shape, NOT one-key-per-date — the doc is `{ [dateKey]: { activityLevel } }`). Sync-registered the explicit way per V-K-104's floor.

```js
// localStorage key: ziva_activity_meta
// Shape (single-doc; per-day fields keyed by dateKey):
{
  '2026-05-27': { activityLevel: 3 },
  '2026-05-26': { activityLevel: 2 },
  // ... unset days simply not present in the object — _getActivityLevelToday returns null
}
```

**Registry additions** (in addition to the suppress-state key):

```js
// In core.js KEYS:
KEYS.activityMeta = 'ziva_activity_meta';

// In sync.js SYNC_KEYS:
[KEYS.activityMeta]: { collection: 'activities', model: 'single-doc' },

// In sync.js SYNC_RENDER_DEPS (renders that depend on activityLevel):
[KEYS.activityMeta]: {
  global: 'activityMeta',
  renderers: { home: ['renderHome'], 'track:milestones': ['renderMilestonesTab'] }
},
```

**Why this is the right shape:**
- Zero disturbance to the existing `activityLog[date]` array-only consumers (the 20+ sites stay untouched)
- Explicit-registry-only sync per V-K-104 floor (the key is named, sync-registered, render-dep-mapped — never falls through `ziva_*` pattern picker)
- Per-day fields keyed by dateKey in a single doc keep the doc-size small (one entry per day; ~1KB at year-end)
- Future per-day fields (mood-tier from R-7, energy-level from R-6 forward, etc.) extend the doc by adding fields per dateKey — no schema-fork

**The chronicle §4.2 reservation** for `activityLevel: 1-4 | null` per day-record is honored — v1 ratifies the *field*, on the right *storage key*. The chronicle's "per day-record" intent maps to the new `KEYS.activityMeta[dateKey].activityLevel` shape; the codebase's "activityLog" array-shape is correctly left alone for activity log entries (the things the parent logs), and the new key is for activity-meta (things the system or parent tags about the day as a whole).

### Contract

```js
/**
 * Read activityLevel for any day from the new ziva_activity_meta key (V-K-111
 * synth-fold reversed the prior activityLog._meta decision).
 *
 * @param {string} dateKey  - 'YYYY-MM-DD' (timezone-safe via today() upstream;
 *                            today() at core.js:3649 confirmed local-timezone-safe)
 * @returns {1 | 2 | 3 | 4 | null}
 *   null = unset for that day (the honest "no signal" state — never inferred,
 *   never defaulted to 2). R-6 IMPL reads null as "no signal".
 *
 * Reads from: window.activityMeta[dateKey] (the new module-global loaded from
 * KEYS.activityMeta = 'ziva_activity_meta'). Returns
 * activityMeta?.[dateKey]?.activityLevel ?? null.
 */
function _getActivityLevelToday(dateKey) { /* ... */ }

/**
 * Write activityLevel for any day to the new ziva_activity_meta key.
 *
 * @param {string} dateKey
 * @param {1 | 2 | 3 | 4 | null} level  - pass null to clear
 *
 * Lazy-create semantics: if window.activityMeta does not yet exist (first-ever
 * use of any per-day-meta field), this function initializes it as `{}`. If
 * activityMeta[dateKey] does not yet exist for the given day, this function
 * creates a new per-day object `{ activityLevel: level }`. If level is null,
 * the function clears the field — and if the resulting per-day object is empty
 * (no other meta fields present), removes the dateKey entry entirely.
 *
 * Idempotent: same dateKey + same level produces no write (storage-quiet).
 * Same dateKey + different level overwrites.
 *
 * Sync: explicit per V-K-104 — KEYS.activityMeta is registered in SYNC_KEYS
 * with `{ collection: 'activities', model: 'single-doc' }`. Write triggers
 * save(KEYS.activityMeta, activityMeta) which routes through the sync
 * write-shim at sync.js:908 cleanly.
 *
 * Zero disturbance to the existing activityLog[date] array-only consumers
 * (V-K-111 closure — the 20+ sites that use Array.isArray(activityLog[ds])
 * stay untouched).
 */
function _setActivityLevelToday(dateKey, level) { /* ... */ }
```

### Lazy creation (V-K-109 fold + V-K-111 schema-shape correction)

The setter creates `window.activityMeta` AND `activityMeta[dateKey]` lazily as needed. Both operations are on the new dedicated key family — no collision with the existing `activityLog` array-shape consumers (Kael's V-K-111 floor verified).

---

## Primitive 4 — `ziva_milestone_suppress` storage + sync registration

### Storage shape

```js
// localStorage key: ziva_milestone_suppress
// Shape:
{
  <milestoneKey>: <epochMs>,  // suppress-until timestamp
  // e.g., 'pointing': 1717182000000
  // ...
}
```

Per-milestone suppress-until timestamp. The "Not yet" tap (milestones-tab-v1 surface) writes `now + 7*24*60*60*1000` (7 days). Auto-expires when consumers (`_getInWindowMilestones`) filter out entries whose timestamp is ≤ now. No manual unsuppress UI in v1 (carried to milestones-tab-v1 spec).

### Sync registration (V-K-104 fold)

v1 IMPL adds the suppress-state key to all three registries:

```js
// In core.js (or wherever KEYS lives):
KEYS.milestoneSuppress = 'ziva_milestone_suppress';

// In sync.js SYNC_KEYS:
[KEYS.milestoneSuppress]: { collection: 'milestones', model: 'single-doc' },

// In sync.js SYNC_RENDER_DEPS (if applicable):
[KEYS.milestoneSuppress]: ['renderActiveMilestones', 'renderMilestonesTab'],
```

The Care floor (per V-K-104): cross-device replication of the suppress map is required, otherwise the grandparent's tablet shows milestones the parent's phone dismissed — exactly the silent-failure shape Kael's audit flagged.

### Backward-compat

Pre-v1 devices have no suppress map; `_getInWindowMilestones` reads the key as `null` and skips suppression filter. No migration needed (additive key).

### Cross-device merge-on-receive (V-M-116 synth-fold)

The single-doc sync model is *last-write-wins on the whole doc* — if grandparent's tablet writes `{pointing: T1}` and parent's phone writes `{pointing: T1+1, pincer: T2}` near-simultaneously, the later write wins the entire doc, potentially overwriting per-key state on the other device.

**v1 ratifies a `_postReceiveMilestoneSuppress` merge hook** in `sync.js` SYNC_RENDER_DEPS:

```js
// Pseudo-shape — IMPL writes the actual function in sync.js
function _postReceiveMilestoneSuppress(remoteMap, localMap) {
  const merged = { ...localMap };
  Object.entries(remoteMap || {}).forEach(([milestoneKey, remoteTs]) => {
    const localTs = merged[milestoneKey] || 0;
    // Timestamp-max merge: whichever device suppressed *later* wins per-key
    if (remoteTs > localTs) merged[milestoneKey] = remoteTs;
  });
  // Purge expired entries on each merge pass (auto-cleanup)
  const now = Date.now();
  Object.keys(merged).forEach(k => { if (merged[k] <= now) delete merged[k]; });
  return merged;
}
```

This closes the silent-failure path Maren V-M-116 surfaced: the grandparent's tablet suppressions and the parent's phone suppressions both survive cross-device. The hook fires on every sync receive of `KEYS.milestoneSuppress`; the merge is associative + idempotent.

**The same merge-on-receive pattern applies to `KEYS.activityMeta`** (per V-K-111's new key family) — IMPL adds a `_postReceiveActivityMeta` with timestamp-max-per-dateKey-per-field merge so cross-device activityLevel writes don't overwrite each other on the whole-doc shape.

---

## Primitive 5 — `cat:` → `domain:` field-name migration

### Scope

The closed PR #147 chain (V-M-99 + V-K-102) found that milestone rows use **`cat:`** as their category field, NOT `domain:`. The `domain:` field's 491 hits in `data.js` are on `EVIDENCE_PATTERNS` (a different structure — keyword classifier phrasebook). The milestones-tab-v1 spec (and earlier authoring conversations this session) repeatedly assumed `domain:` — that assumption was false.

v1 ratifies the **`domain:` direction** (chosen for vocabulary consistency with `EVIDENCE_PATTERNS` + with the future `ACTIVITY_CATEGORIES` registry the milestones-tab-v1 spec will land in `data.js`). Scribe-scout 2026-05-27 verified the full drift inventory — **12 hardcoded category-enumeration sites total** (the prior chain's enumeration of 7+1 was incomplete; 4 additional sites surfaced + 1 outlier):

| File:line | Category set (current) | Migration note |
|---|---|---|
| `home.js:1670` | `['motor','sensory','language','social']` (4-CAT VARIANT — drops `cognitive`, swaps in `sensory`) | **OUTLIER** — not just a rename. The site rotates daily-activity picks by domain. Migration: align to the 5-cat registry OR document the variant's intent and rename to a distinct constant if the variant is semantically separate. IMPL-pass-Maren-consult decision. |
| `home.js:1860` | `['motor','language','social','cognitive']` (4-cat) | Standard rename + read from registry |
| `home.js:2258` | `['motor','language','social','cognitive']` | Standard rename |
| `home.js:2297` | `{motor:0, language:0, social:0, cognitive:0}` (4-cat object) | Build from registry |
| `home.js:2298` | `{motor: new Set(), language: …}` (4-cat object) | Build from registry |
| `home.js:2312` | `['motor','language','social','cognitive']` | Standard rename |
| `home.js:2495` | `{motor, language, social, cognitive, sensory}` (5-cat icons; consuming loop is 4-cat) | Build from registry; consuming loop becomes 5-cat after registry-iteration |
| `home.js:3798` | `{motor, language, social, cognitive}` (4-cat) | Build from registry |
| `home.js:6769` | `{motor, language, social, cognitive}` (4-cat catMeta) | Build from registry |
| `home.js:8628` | `{motor, language, social, cognitive, sensory}` (5-cat domainEvCounts) | Build from registry |
| `medical.js:461` | `{motor, language, social, cognitive}` (4-cat catIcons in `renderActiveMilestones`) | **V-M-101 fold — 7th drift site missed by prior spec.** Function declaration is at `medical.js:456` (off-by-1 from V-M-101's `:457` citation). Standard rename + read from registry. |
| `medical.js:4788` | `{motor, language, social, cognitive}` (4-cat catMeta in `renderUpcomingMilestones`) | Standard rename + read from registry |
| `medical.js:4814` | `['motor','language','social','cognitive']` (4-cat catOrder in same function) | Standard rename + read from registry |

**Plus the data layer:**

1. **`DEFAULT_MILESTONES`** at `data.js:1471–1479` — **7 rows** (scribe-scout confirmed, NOT 8 as prior authoring claimed). Each row's `cat: '<category>'` → `domain: '<category>'`.
2. **`MILESTONE_STANDARDS`** at `data.js:2686–2951` — 194 leaf rows across 4 standards (`who`/`iap`/`eu`/`cn`). Each row's `cat:` → `domain:`.

**Plus sync-substrate-aware migration** (V-K-110 + V-M-110 synth-fold — corrects the scribe-table's earlier-false `_postReceiveMilestones` claim). The earlier draft proposed a load-time-only migration; Kael verified that `_mergeMilestoneFieldsInline:198` explicitly carries `cat:` field-by-name (`if (!winner.cat && loser.cat) winner.cat = loser.cat;`). This means: even with load-time migration, every cross-device sync receive re-pollutes the migrated array with `cat:` from the losing-side entry. The migration is not idempotent across the sync substrate.

**v1 ratifies the corrected migration approach** — three coordinated changes:

1. **Update `_mergeMilestoneFieldsInline` at `medical.js:198`** with explicit merge logic for the new fields, and drop the `cat:` write-back:
   ```js
   // V1 — replaces the legacy `cat` line at medical.js:198
   // Domain: winner-keeps-or-loser-fills (additive merge)
   if (!winner.domain && loser.domain) winner.domain = loser.domain;
   // Legacy cat: fallback only when neither has domain (covers pre-migration
   // losing-row from a device that hasn't updated yet)
   if (!winner.domain && loser.cat) winner.domain = loser.cat;
   // safetyTier: loser-wins-on-true (Care-floor: once flagged, always flagged)
   if (loser.safetyTier) winner.safetyTier = true;
   // source: winner-keeps-or-loser-fills, preferring attributed over 'unverified'
   if ((!winner.source || winner.source === 'unverified') && loser.source && loser.source !== 'unverified') {
     winner.source = loser.source;
   }
   // DROP the legacy cat write-back — winner.cat is no longer written here.
   // (Legacy cat field is read-only-with-fallback during the deprecation cycle;
   // v1.1 IMPL removes the read-fallbacks across consumer sites.)
   ```

2. **Place the row-migration INSIDE `_postReceiveMilestones`** (medical.js:145+, before `dedupeMilestonesByText` runs), so every sync-receive re-migrates incoming rows:
   ```js
   // In _postReceiveMilestones (medical.js:145+), BEFORE the existing migration calls:
   milestones.forEach(row => {
     // Forward-migrate cat → domain (idempotent: skips already-migrated rows)
     if (row.cat && !row.domain) row.domain = row.cat;
     // V-K-119 synth-fold: divergence reconciliation — if both fields present
     // and disagree, prefer the new domain field and clear cat (the migration
     // direction is one-way; cat-vs-domain conflict means a partial-state row)
     if (row.cat && row.domain && row.cat !== row.domain) row.cat = null;
   });
   ```

3. **Keep a thin load-time migration** at `start.js` init for the cold-load case (device boots before any sync receive fires), with the same row-walk shape. This handles the first-ever-v1-load before any other sync write/receive cycle.

The legacy `cat` field is preserved as **read-only-with-fallback** during the deprecation cycle (v1.1 IMPL drops the read-fallbacks across consumer sites). The merge function explicitly does NOT write `cat:` going forward, so the field is no longer re-introduced cross-device.

### Drift-site enumeration — 18 total sites (V-K-113 + V-M-111 synth-fold)

The earlier draft listed 12 sites (constant-array/object DEFINITIONS). Scribe-verify subsequent passes found 6 additional `m.cat`/`item.cat` READER call-sites the constant-literal grep missed:

| File:line | Site type | Current shape | Migration action |
|---|---|---|---|
| `home.js:1670` | **OUTLIER — activity-domain, not milestone-domain** (V-M-117) | `['motor','sensory','language','social']` rotating daily-activity picks | **OUT OF v1 SCOPE.** Site reads activity-records (`.type` field), not milestones. Aligns when `milestones-tab-v1` lands `ACTIVITY_CATEGORIES` registry. |
| `home.js:1847` | reader (V-M-111 / V-K-113) | `const cat = m.cat \|\| 'motor';` (forEach grouping) | rename `cat` → `domain`; fallback via legacy field |
| `home.js:1860` | constant def | `const catOrder = ['motor', 'language', 'social', 'cognitive'];` | replace with registry-iteration |
| `home.js:2032` | reader (V-K-113) | same `m.cat \|\| 'motor'` idiom (filter callback) | rename + fallback |
| `home.js:2258` | constant def | 4-cat forEach | registry-iteration |
| `home.js:2297` | constant def | 4-cat domainEvidence object | build from registry |
| `home.js:2298` | constant def | 4-cat domainDays object | build from registry |
| `home.js:2312` | constant def | 4-cat forEach | registry-iteration |
| `home.js:2314` | reader (V-K-113) | `milestones.filter(m => (m.cat \|\| 'motor') === cat)` | rename + fallback |
| `home.js:2495` | constant def | 5-cat domainIcons; 4-cat consuming loop | build from registry; consuming loop becomes 5-cat |
| `home.js:3798` | constant def | 4-cat catIcons | build from registry |
| `home.js:5963` | reader (V-M-111) | `const cat = latestMs.cat \|\| 'motor';` (Latest-milestone-highlight) | rename + fallback |
| `home.js:5997` | reader (V-M-111 / V-K-113) | `const cat = m.cat \|\| 'motor';` (timeline forEach) | rename + fallback |
| `home.js:6769` | constant def | 4-cat catMeta | build from registry |
| `home.js:8628` | constant def | 5-cat domainEvCounts | build from registry |
| `medical.js:461` | constant def | 4-cat catIcons in `renderActiveMilestones` (V-M-101) | build from registry |
| `medical.js:483` | reader (V-K-113) | per-row `m.cat \|\| 'motor'` inside `renderActiveMilestones` | rename + fallback |
| `medical.js:4788` | constant def | 4-cat catMeta in `renderUpcomingMilestones` | build from registry |
| `medical.js:4814` | constant def | 4-cat catOrder in same function | build from registry |
| `medical.js:4884` | reader (V-M-111) | `const catVal = item.cat \|\| 'motor';` — emits `data-arg3="${catVal}"` into handler | rename + fallback (Care-floor: handler routing) |
| `medical.js:7653` | reader (V-M-111) | `const c = (m.cat \|\| '').toLowerCase();` in Milestone Map treemap | rename + fallback |

**Final v1 IMPL scope: 18 sites** (10 home.js + 7 medical.js + the load-time migration block + the merge-function update). `home.js:1670` is **excluded** (V-M-117 — activity-domain, deferred to milestones-tab-v1).

### IMPL author guidance

This is a **breaking data-shape change at the consumer-read tier**. The IMPL author MUST:
- Update **all 18 in-scope sites** in a single PR (no half-migration)
- Skip `home.js:1670` per V-M-117 (out-of-scope; activity-domain not milestone-domain)
- Update `_mergeMilestoneFieldsInline:198` with the explicit V1 merge logic above
- Place the row-migration INSIDE `_postReceiveMilestones` per V-K-110
- Keep the thin cold-load migration in `start.js` for first-ever-v1-boot
- Run the existing e2e suite to catch any missed consumer
- Verify the post-migration `m.domain` reads land cleanly with legacy-`cat` fallback
- Run a divergence-state regression test: collide two rows with conflicting cat/domain values and verify the V-K-119 reconciliation fires (`cat → null` after divergence detected)
- Run a regression guard against the sync substrate: post-migration sync receive does NOT re-introduce `cat:` on winning rows

**Updated LOC estimate** (per Kael V-K-113's expansion to 18 sites + Kael's split recommendation in §Sequencing): ~400-500 lines for the migration sweep + merge-function update + load-time + post-receive integration + e2e divergence-test additions.

**Kael's PR-split recommendation (synth-fold ratified — see §Sequencing for full split structure):** the engine-prep IMPL benefits from being split into PR-A (data-tier — Kael-primary, ships clean) + PR-B (migration sweep + merge logic — Maren-primary, ships against the now-stable data-tier).

---

## Seed-data expansion — sensory + cognitive

### Closes V-K-103

Kael's V-K-103 found that `DEFAULT_MILESTONES` (8 rows) distributes as 5×motor + 2×language + 1×social — **zero sensory, zero cognitive**. The milestones-tab-v1 spec proposes a 5-category `ACTIVITY_CATEGORIES` registry. With 3-cat seed data, two registry categories never render with content — Category Progress wheels are empty-but-the-test-passes (V-K-93 tautology pattern carry-forward).

v1 IMPL adds at least 1 sensory + 1 cognitive milestone to `DEFAULT_MILESTONES`. Candidates (Ziva-current-age-appropriate, ~7m):

- **Sensory:** `tracks-object` (visual tracking of moving objects across midline) — clinical-band 2-4 months WHO; or `responds-to-sound` (4-6 months WHO); or `mouths-objects` (4-7 months WHO). IMPL author picks 1 with Maren-consult on clinical-source-of-truth.
- **Cognitive:** `object-permanence` (peek-a-boo onset, ~6-9 months WHO); or `cause-effect` (drops object to see what happens, ~6-9 months WHO); or `early-problem-solving` (~7-10 months WHO). IMPL author picks 1.

Both new rows ratify `source:` per the clinical-band-source-attribution discipline below.

### Out-of-scope for v1

Curating the FULL sensory + cognitive milestone library is NOT in v1 scope. v1 ships the minimum-to-satisfy-the-registry seed (1 row each); future v1.x cycles or Wave-2 curation arcs expand to comprehensive coverage. Out-of-scope register notes the deferral.

---

## Clinical-band source-attribution (V-M-106 fold)

### The discipline

Closes Maren's V-M-106. Every `MILESTONE_STANDARDS` row carries an explicit `source:` field. The value is a standard-name string from a controlled vocabulary:

```js
// Allowed source values (v1):
const MILESTONE_SOURCE = ['WHO', 'CDC', 'IAP', 'EU', 'CN', 'unverified'];
```

The `_predictMilestoneWindow` output propagates `source` to the consumer. Rendered prose interpolates it as the parenthetical: `"Typically 9–14 months (WHO). Ziva is 7m 24d — early band."` — read from data, never hardcoded.

### Migration

v1 IMPL extends `MILESTONE_STANDARDS` rows with the `source:` field. For rows where the historical source is documented (in commit history, in adjacent comments, in the spec body of the original milestone-data PR), use that value. For rows where the source can't be verified, ship as `source: 'unverified'`; consumer code omits the parenthetical when source is unverified.

This is a partial-curation pass — v1 does not require *every* row to have a verified source. v1 requires every row to have a `source:` field (which may be `'unverified'`). Future curation cycles upgrade `'unverified'` rows to attributed rows.

### Honesty floor

Rendered prose NEVER hardcodes "(WHO)" without reading from data. The audit-gate Scope A (below) greps for `(WHO)` / `(CDC)` / etc. hardcoded literal strings in consumer-side render code; any hit must opt in via `// milestone-source-ok: <rationale>` (closes V-M-106).

---

## Doctrinal clarification — `_NARRATIVE_PROSE_TEMPLATES` typed-registry scope

### Closes V-V-47

Vela's V-V-47 found that the milestones-tab-v1 spec's F5 fold proposed adding a `'milestonesTodayHeader'` row to v3-4's `_NARRATIVE_PROSE_TEMPLATES` registry. But v3-4's registry is typed for **cross-domain `_correlate` consumers** — every row carries `hedgeTierMap` mapped from `_correlate.confidence` + `sampleFloor` enforcing sample-size suppression. A single-domain narration row breaks the typed-registry contract (and the `regression-guard-v3-4-registry-coverage` test).

v1 ratifies the **typed-registry scope** explicitly: `_NARRATIVE_PROSE_TEMPLATES` is for cross-domain `_correlate` consumers ONLY. Future single-domain narration registries are separate (one per surface class, registered separately under canon-cc-027).

### Implication for milestones-tab-v1

The downstream `milestones-tab-v1` spec will land its narration helpers in **inline templates** (only 3-4 of them — the "Today" header) OR a **separate registry** keyed differently (e.g., `_MILESTONES_NARRATION_TEMPLATES`). Architect call at milestones-tab-v1 ratification time.

### Cross-spec documentation

v1 IMPL adds a comment to v3-4's `_NARRATIVE_PROSE_TEMPLATES` definition site (data.js, once v3-4 IMPL lands and the registry is live) noting the cross-domain-`_correlate`-only scope and pointing to this spec as the doctrinal authority.

---

## Build-time audit gate — `audit-no-personalised-prediction-v1.sh`

### Engine ratification (V-K-112 synth-fold)

V-K-112 verified mechanically: the spec's `\s`/`\w` PCRE escapes match **0/9** adversarial inputs under default `grep -E` (POSIX-extended treats `\s`/`\w` as literal). The gate would ship green-but-empty.

v1 ratifies **Python** as the regex engine — honoring the `audit-hr12-v3-3.sh` precedent (which uses Python's `re.compile` for exactly this kind of PCRE-equivalent regex). The audit script is a `bash` wrapper that invokes `python3 -c "..."` for the regex pass, or a standalone `.sh` that shells to Python. Mirrors:

```sh
#!/bin/bash
# audit-no-personalised-prediction-v1.sh — Honesty-floor gate on personalised-
# prediction prose. V-K-112 synth-fold: Python regex engine ratified (matches
# audit-hr12-v3-3.sh precedent; default grep -E matches zero adversarial inputs).
exec python3 -c "
import re, sys
# Scope B patterns (V-K-106 broadened):
banned = [
    re.compile(r'Ziva (will|should|might|is going to|is expected to|is on track to)\s+(be\s+)?[\w\s\-]{1,40}?\s+(by|at|around)\s+(month|week|day|\d)', re.IGNORECASE),
    # Scope A (V-M-106 + V-M-115 hardcoded-source + unverified-paren bans):
    re.compile(r'\((WHO|CDC|AAP|IAP|EU|CN)\)'),
    re.compile(r'\(unverified\)'),
]
# (full implementation walks split/ files, applies regexes, checks opt-in markers)
...
"
```

### Engine self-test (V-K-112 hard contract)

The audit script MUST self-validate its own regex against its spec-cited adversarial inputs at script-startup. If any of the following adversarial prose passes through Scope B's regex, the script exits non-zero with a "regex engine mismatch" error before scanning the codebase:

```
SELF_TEST_ADVERSARIAL = [
    'Ziva will sit by 6',
    'Ziva will be sitting by 6 months',
    'Ziva will pull-to-stand by 9 months',
    'Ziva will say first words by 12 months',
    'Ziva should walk by month 12',
]
# Every one of these MUST match Scope B's regex. If any doesn't, the gate
# is misconfigured and the audit fails fast before scanning split/.
```

This closes V-K-93 + V-K-112 tautology-pattern carry-forward: the gate self-tests its own correctness before claiming green on the codebase.

### Banned patterns (Scope A + Scope B — V-K-106 + V-M-106 + V-M-115 synth-fold)

**Scope B — personalised-prediction prose (Honesty floor on engine-output rendering):**
```
re.compile(r'Ziva (will|should|might|is going to|is expected to|is on track to)\s+(be\s+)?[\w\s\-]{1,40}?\s+(by|at|around)\s+(month|week|day|\d)', re.IGNORECASE)
```

**Scope A — hardcoded source attribution + unverified parenthetical (Honesty floor on rendered prose):**
```
re.compile(r'\((WHO|CDC|AAP|IAP|EU|CN)\)')   # bans hardcoded literal "(WHO)" / "(CDC)" / etc. in render code
re.compile(r'\(unverified\)')                 # V-M-115 hard contract: "(unverified)" parenthetical is the cipher-honesty violation
```

### Opt-in escape

```sh
// no-personalised-prediction-ok: <rationale>
// milestone-source-ok: <rationale>
```

Two markers — one per scope, separable (per V-K-106 + V-M-108 + V-M-115 separation recommendation).

### Ship-gate wiring

v1 IMPL wires `audit-no-personalised-prediction-v1.sh` into `split/build.sh` as a new audit gate. Total gates post-v1: 8 (after card-priority-v3-6 at 7; before narrative-prose-v3-4 IMPL lands, which would take 9).

### Standalone

This audit is **standalone**, not bundled with activity-categories (which lands with milestones-tab-v1 — `audit-activity-categories-v1.sh`). The two scopes are doctrinally separate: this gate is the Honesty floor on personalised-prediction prose + source-attribution rendering; activity-categories is the Extensibility floor on the category-vocabulary registry. Keeping them separate scripts honors the V-K-106 + V-M-108 + V-M-115 separation recommendation.

---

## Files touched + LOC estimate

(LOC estimates updated per scribe-scout 2026-05-27 verified site inventory — 12 drift sites total, not 7+1.)

| File | Region | Type | Lines (estimate) |
|---|---|---|---|
| `split/core.js` | Kael | `_predictMilestoneWindow` + `_getInWindowMilestones` + `_getActivityLevelToday` + `_setActivityLevelToday` helpers; KEYS additions for `milestoneSuppress` | ~280 added |
| `split/data.js` | Kael | `MILESTONE_STANDARDS` rows extended with `source:` + optional `endMonth:` + optional `safetyTier:` (194 rows touched, mostly field-only edits) + `DEFAULT_MILESTONES` `cat:` → `domain:` migration (7 rows) + 2 new seed rows (sensory + cognitive) + `MILESTONE_SOURCE` constant | ~250 changed, ~40 added |
| `split/sync.js` | Kael | `SYNC_KEYS` + `SYNC_RENDER_DEPS` additions for `KEYS.milestoneSuppress`; verify activityLog._meta survives existing migration handlers | ~25 added |
| `split/home.js` | Maren | Consumer migration `m.cat` → `m.domain` at **10 drift sites** (1670 outlier-resolution + 1860 / 2258 / 2297 / 2298 / 2312 / 2495 / 3798 / 6769 / 8628) + load-time `milestones` localStorage migration block | ~80 changed |
| `split/medical.js` | Maren | Consumer migration at **3 drift sites** (`renderActiveMilestones` :461 + `renderUpcomingMilestones` :4788 + :4814) + `_postReceiveMilestones` field-survival verification | ~30 changed |
| `split/start.js` (or initializer) | Kael | Load-time migration for legacy `cat:` → `domain:` (idempotent) | ~20 added |
| `split/audit-no-personalised-prediction-v1.sh` (NEW) | — | Build-time audit gate (Scope B broadened per V-K-106 + V-M-106 hardcoded-source floor) | ~140 |
| `split/build.sh` | shared | Wire the new audit gate as the 8th gate | ~5 changed |
| `tests/e2e/milestone-engine-prep-v1.spec.ts` (NEW) | — | E2E tests (~20 regression guards per §Test plan) | ~520 |

**Total LOC estimate:** ~1,390 (~870 in code + data, ~520 in tests, ~140 in the new audit script). Larger than the v3-3 / v3-5 engine specs because the `cat:` → `domain:` migration is a sweep across 13 sites + 201 data rows. Substantially smaller than the closed PR #147 milestones-tab-v1 IMPL would have been (~1,920 LOC) because this spec is engine-substrate-only (no render machinery; that lands in the next spec).

---

## canon-cc-008 routing at IMPL time

**Kael primary** — `split/core.js` (4 new helpers + KEYS additions) + `split/data.js` (data-shape migration + seed expansion + clinical-band source-attribution) + `split/sync.js` (registry additions). Engine-grain audit on the new primitives + the v3-3 `_correlate` precedent-shape compliance.

**Maren consult** — `split/home.js` (consumer migration at 7 drift sites) + `split/medical.js` (`renderActiveMilestones` migration). Care floor on the clinical-band source-of-truth — the WHO / CDC / IAP attribution decisions need Care sign-off on whether the existing data's source attribution is verifiable per row. Pair-note enumerated below per CV3-004.

**Vela consult** — minimal scope. No render-layer changes in this spec; downstream `milestones-tab-v1` carries the render arc. Vela's pair-note here is the **carry-forward floor**: the new primitives must produce consumer outputs that pass the half-awake test when the milestones-tab-v1 surface arc reads them. Vela signs off on the contract shapes (function return shapes; clinical-band-disclosure render-readiness) without auditing render code.

**Sequential triple-jurisdiction on shared modules** — only if v1 IMPL touches `styles.css` or `template.html`, which the current scope says NO (no surface changes). If IMPL discovers a need (e.g., a hidden `.milestone-source-attribution` chrome class needed for the parenthetical render), the diff touch triggers the sequential review per CLAUDE.md.

**Cipher Edict V** last, with three Charter-axis cross-checks per CV3-006 (Honesty primary + Extensibility co-primary; Warmth neutral for this engine spec; downstream milestones-tab-v1 carries Warmth co-primary).

---

## Test plan

### Functional tests — `_predictMilestoneWindow`

| Test | Asserts |
|---|---|
| `regression-guard-milestone-engine-prep-v1-predict-window-shape` | Output shape matches contract — `{expectedStart, expectedEnd, expectedStartMonths, expectedEndMonths, ageDays, ageWeeks, status, source, standardKey}` |
| `regression-guard-milestone-engine-prep-v1-predict-window-source-from-data` | The `source` field is read from `MILESTONE_STANDARDS[...row].source`, NEVER hardcoded |
| `regression-guard-milestone-engine-prep-v1-predict-window-status-classification` | `status` correctly classifies pre-window / in-window / post-window for given ageDays + clinical band |
| `regression-guard-milestone-engine-prep-v1-predict-window-null-on-missing` | Returns `null` when milestoneId is not in MILESTONE_STANDARDS (never throws, never invents a window) |
| `regression-guard-milestone-engine-prep-v1-predict-window-pure` | Pure function: same inputs → same outputs; no module-global writes |

### Functional tests — `_getInWindowMilestones`

| Test | Asserts |
|---|---|
| `regression-guard-milestone-engine-prep-v1-in-window-cap-at-n` | Returns at most n entries (cap honored) |
| `regression-guard-milestone-engine-prep-v1-in-window-safety-tier-bypasses-cap` | Milestones with `safetyTier: true` always surface, even above-n-cap (V-M-102 fold) |
| `regression-guard-milestone-engine-prep-v1-in-window-engagement-priority-ordering` | Returned entries are sorted by engagement-priority score, descending |
| `regression-guard-milestone-engine-prep-v1-in-window-suppression-filter` | Milestones in `suppressMap` with timestamp > now are excluded |
| `regression-guard-milestone-engine-prep-v1-in-window-explicit-state-injection` | Function is unit-testable with opts.standards / opts.milestones / opts.activityLog injected; no module-global setup required |

### Functional tests — `_getActivityLevelToday` + setter

| Test | Asserts |
|---|---|
| `regression-guard-milestone-engine-prep-v1-activitylevel-getter-null-default` | Unset day-record returns `null` (never 2, never inferred) |
| `regression-guard-milestone-engine-prep-v1-activitylevel-setter-creates-day-record` | Setter creates the day-record lazily if missing (V-K-109 fold) |
| `regression-guard-milestone-engine-prep-v1-activitylevel-setter-idempotent` | Same dateKey + same level = no write (storage-quiet) |
| `regression-guard-milestone-engine-prep-v1-activitylevel-setter-null-clears` | Setting `null` clears the field |

### Functional tests — sync registration

| Test | Asserts |
|---|---|
| `regression-guard-milestone-engine-prep-v1-suppress-sync-registered` | `KEYS.milestoneSuppress` is in `SYNC_KEYS` registry; sync write-shim does NOT silently drop it |
| `regression-guard-milestone-engine-prep-v1-suppress-cross-device-replicates` | After write to `ziva_milestone_suppress`, the sync registry would replicate (verified by checking the SYNC_KEYS entry presence, not by actually running Firebase) |

### Functional tests — field-name migration

| Test | Asserts |
|---|---|
| `regression-guard-milestone-engine-prep-v1-default-milestones-domain-field` | Every row in `DEFAULT_MILESTONES` carries `domain:` (post-migration) |
| `regression-guard-milestone-engine-prep-v1-milestone-standards-domain-field` | Every row in `MILESTONE_STANDARDS` carries `domain:` (post-migration) |
| `regression-guard-milestone-engine-prep-v1-consumer-sites-read-domain` | Build-time grep: no consumer site reads `m.cat` (replaced by `m.domain`) outside the load-time migration helper |
| `regression-guard-milestone-engine-prep-v1-load-time-migration-idempotent` | Running the load-time migration on already-migrated localStorage produces no write |

### Functional tests — clinical-band source attribution

| Test | Asserts |
|---|---|
| `regression-guard-milestone-engine-prep-v1-milestone-standards-source-field` | Every `MILESTONE_STANDARDS` row carries a `source:` field (value may be `'unverified'`) |
| `regression-guard-milestone-engine-prep-v1-no-hardcoded-source-in-render` | Build-time grep (audit-no-personalised-prediction-v1.sh Scope A): no `(WHO)` / `(CDC)` / `(IAP)` literal strings in consumer-side render code; opt-in via `// milestone-source-ok:` |
| `regression-guard-milestone-engine-prep-v1-source-flows-through-output` | `_predictMilestoneWindow` output's `source` field matches the source value in the read row |

### Functional tests — audit gate

| Test | Asserts |
|---|---|
| `regression-guard-milestone-engine-prep-v1-no-personalised-prediction-grep` | `audit-no-personalised-prediction-v1.sh` rejects "Ziva will sit by 6", "Ziva will be sitting by 6", "Ziva will pull-to-stand by 9", "Ziva will say first words by 12", "Ziva should walk by month 12" |
| `regression-guard-milestone-engine-prep-v1-audit-opt-in-honors` | Lines tagged `// no-personalised-prediction-ok: <rationale>` are exempted (HR-12 marker convention) |

### Regression sweep

All existing milestone-related tests must remain green. The `cat:` → `domain:` migration is the highest-risk change for existing test coverage; the IMPL diff must run the full pre-existing e2e suite to catch any missed consumer.

---

## HR pre-check

| HR | Risk | Mitigation |
|----|------|------------|
| HR-1 (no emojis) | n/a | Engine spec; no glyphs |
| HR-2 (no inline styles) | n/a | Engine spec; no render touch |
| HR-3 (no inline handlers) | n/a | Engine spec; no event-handler touch |
| HR-4 (escHtml at boundaries) | n/a | Engine spec produces engine outputs; render layer (milestones-tab-v1) carries the escHtml floor |
| HR-5 (tokens-only) | n/a | Engine spec; no token surface |
| HR-9 (post-build multi-round QA) | structural | canon-cc-008 chain runs at IMPL time |
| HR-12 (timezone-safe dates) | **medium** | `_predictMilestoneWindow` consumes `dob` (Date or string); IMPL must use existing `_zivaAgeInDays` or `today()` helpers (verify timezone-safety via scribe-verify before IMPL) |

---

## Charter compliance per CV3-006

### Axis 1 — Intellectual honesty (PRIMARY)

- ✓ Every clinical-band surface carries `source:` field read from data; never hardcoded
- ✓ Build-time grep gate (`audit-no-personalised-prediction-v1.sh`) enforces no-personalised-prediction prose at the IMPL surface
- ✓ `activityLevel: null` is the honest "no signal" state — never inferred, never defaulted at the engine layer
- ✓ Suppress-state replicates cross-device honestly via explicit SYNC_KEYS registration (closes the V-K-104 false-claim that earlier specs carried)
- ✓ `_predictMilestoneWindow` returns clinical ranges only — Kael's risk register floor is engine-enforced, not just consumer-documented
- ✓ `source: 'unverified'` is the honest state for rows where attribution can't be verified — never defaults to a clinical authority that isn't actually the source

### Axis 2 — Architectural extensibility (CO-PRIMARY)

- ✓ `cat:` → `domain:` field-name migration closes the registry-binding ambiguity at row 1 (the milestones-tab-v1 spec's foundational Extensibility-axis win)
- ✓ Seed-data expansion (sensory + cognitive) closes the 5-cat-registry-against-3-cat-seed tautology (V-K-93 / V-K-103 pattern carry-forward)
- ✓ `_getInWindowMilestones` ships with explicit-state-injection signature (the v3-3 `_correlate` precedent for testability)
- ✓ `MILESTONE_STANDARDS` extended with `source:` field — row-addition substrate stays; consumers read by attribute, not by hardcoded constant
- ✓ Doctrinal clarification on `_NARRATIVE_PROSE_TEMPLATES` typed-registry scope prevents future single-domain narration registries from forking v3-4's `_correlate`-typed registry (closes V-V-47 doctrinally, not by patch)
- ✓ Build-time audit gate is standalone (not bundled with activity-categories audit) — separable scope per V-K-106 + V-M-108

### Axis 3 — Linguistic + visual warmth

**Neutral axis for this engine-substrate spec.** No surface touch; no parent-facing prose; no glyph or token decisions. Downstream `milestones-tab-v1` carries the Warmth co-primary axis.

### Axes the spec could risk regressing — with mitigations

- **Extensibility (migration scope creep):** the `cat:` → `domain:` migration touches ~7 consumer sites in `home.js` + 1 in `medical.js` + the data rows. If the migration is partial (e.g., IMPL diff updates only `data.js` and 5 of 7 consumer sites), the surface render breaks silently on 2 sites. **Mitigation:** the IMPL PR must include the load-time migration AND the full consumer rewrite AND a regression guard asserting no `m.cat` reads exist outside the migration helper. Scribe-verify enumerates the consumer sites during IMPL.
- **Honesty (`unverified` source escape hatch):** ratifying `source: 'unverified'` as an acceptable v1 value risks every row shipping unverified for expedience. **Mitigation:** the IMPL diff carries a `MILESTONE_SOURCE_COVERAGE` metric in its commit message: the percentage of rows attributed vs unverified. Future curation cycles target ≥80% coverage; v1's floor is "every row HAS a source field," not "every row has a verified source."

---

## Cross-Region pair-notes (CV3-004 required section)

### Pair-note to Maren

**What Kael needs from Maren:** Care floor sign-off on the clinical-band-source-attribution decisions. Specifically:
- The `MILESTONE_SOURCE` controlled vocabulary (`'WHO' | 'CDC' | 'IAP' | 'EU' | 'CN' | 'unverified'`) — Care-tier verification that no relevant pediatric clinical standard is missing
- The 2 new seed milestones (1 sensory + 1 cognitive) — Maren picks which clinical-band-and-source the IMPL author lands; Care-tier read on whether the chosen milestones are safety-aware-or-neutral
- The `safetyTier: true` flag list on `MILESTONE_STANDARDS` rows — Maren curates the list (choking-readiness, swallow-coordination, etc.); the engine respects the flag in `_getInWindowMilestones` cap-bypass logic (V-M-102 fold)
- The `home.js` + `medical.js` consumer migration discipline — Care-floor sign-off on whether the 7+1 enumerated drift sites are correctly migrated (scribe-verify confirms the line numbers at IMPL time)

### Pair-note to Vela

**What Kael needs from Vela:** contract-shape sign-off on the engine-output surfaces the downstream `milestones-tab-v1` will consume:
- `_predictMilestoneWindow` return shape — sufficient for the milestones-tab-v1 in-window proposals + trajectory ribbon + "Today" header + Library age-band sectioning (does the parent-legible `expectedStartMonths` / `expectedEndMonths` / `source` / `status` set carry everything the surface needs?)
- `_getInWindowMilestones` engagement-priority weights — Vela's half-awake-test lens: the v1 default weights (recency=0.4 / window=0.4 / practicing=0.2) need to produce a parent-legible "top 3" set. If the weights mis-order the surface, Vela flags at IMPL-pair-note time
- No render-layer touch in v1 — Vela's pair-note is the **carry-forward contract floor**: when milestones-tab-v1 lands, the engine outputs must be ready to consume without further engine changes

### Coordination

No styles.css / template.html touch in v1 (engine-only scope). If the IMPL discovers an unexpected surface touch (unlikely), the diff triggers sequential triple-jurisdiction per CLAUDE.md routing.

---

## Scribe-scout findings register (2026-05-27)

Lyra deployed a scribe-scout (canon-proc-006) for parallel codebase reconnaissance during spec authoring. The scribe verified file:line citations + storage shapes + data structures. Key findings folded into the spec body above; itemized here for traceability:

| Spec claim | Scribe-verified reality | Fold target |
|---|---|---|
| `MILESTONES_DB` is the milestone library identifier | **Identifier doesn't exist.** Canonical names: `DEFAULT_MILESTONES` (7 rows, `data.js:1471`) + `MILESTONE_STANDARDS` (194 rows, `data.js:2686`) | §Primitive 1 (read-source contract); spec body throughout |
| `MILESTONE_STANDARDS` rows carry clinical-band fields | **No clinical-band fields exist** (no `start_month`/`end_month`/`range_months`). Band signal is bracket-month placement only. | §Primitive 1 (expected-window derivation policy added); §Schema-extension note |
| `MILESTONE_STANDARDS` rows carry source attribution | **No per-row `source:` field.** Source is implicit via wrapping standard-key (`who:` / `iap:` / `eu:` / `cn:`) | §Per-row source-attribution discipline (schema extension ratified) |
| `_predictMilestoneWindow(milestoneId, dob)` is a live primitive | **Doesn't exist in code.** Closest: `getUpcomingMilestones()` at `medical.js:4745` is a one-liner pass-through returning the full bracket-keyed map for the active standard | §Primitive 1 (engine helper net-new; LOC estimate updated) |
| DEFAULT_MILESTONES has 8 rows | **7 rows** (scribe verified) | §What v1 is (count corrected) |
| Day-record key is `ziva_day_<dateKey>` | **Shape doesn't exist.** Codebase uses date-*inside-value* sharding via `activityLog[date]` | §Primitive 3 (schema-decision re-grounded to activityLog._meta) |
| 7 drift sites in home.js (V-M-101 surfaces 8th in medical.js) | **12 drift sites total** (7 enumerated + 1 V-M-101 + 4 new from scribe: home.js:6769, home.js:8628, medical.js:4788, medical.js:4814). Plus `home.js:1670` is an outlier (4-cat-variant: motor/sensory/language/social — drops cognitive, swaps sensory) | §Primitive 5 (drift-site table expanded to 12; outlier noted) |
| 109 zi() symbols in template.html | **109 confirmed.** Spot-check: 20/21 expected glyphs present; **`zi-eye` missing** | §Out-of-scope register (substitution guidance for downstream milestones-tab-v1) |
| `home.js:2148` is the override-machinery citation | Off-by-one: badge render is at **`home.js:1923–1925`**; `overrideMilestoneStatus` is at **`home.js:2149`** | §Primitive 4 — override-machinery citation corrected |
| Override machinery uses separate storage key | **Per-row field on `milestones[i]`** (manualStatus + manualAt). Not a separate localStorage family. | §Primitive 4 note (ziva_milestone_suppress is intentionally separate from override — different semantics: TTL-suppression vs status-correction-with-auto-reconciliation) |
| `_postReceiveMilestones` runs migration on sync receive | **Confirmed** at `medical.js:145`. **Earlier claim "operates on enum/id/text only" is INCORRECT** (Kael V-K-110 + Maren V-M-110 caught at chain): `dedupeMilestonesByText` calls `_mergeMilestoneFieldsInline:198` which explicitly carries `cat:` field-by-name (`if (!winner.cat && loser.cat) winner.cat = loser.cat;`). Migration claim updated at §Primitive 5 — merge function MUST be updated with explicit logic for `domain` / `safetyTier` / `source` AND drop `cat:` write-back. | §Primitive 5 (corrected to place migration INSIDE `_postReceiveMilestones` + merge-function update + V-K-119 divergence reconciliation) |

The scribe-scout's full report is the authoring substrate; the spec body above carries the verified file:line + shape claims forward. Future Governor audits should cross-reference the scribe report (preserved in session transcript) if they want to verify any individual claim.

---

## Out-of-scope (registered, not in v1)

- **Comprehensive sensory + cognitive milestone curation** — v1 adds 2 seed rows (1 per missing category) to satisfy the registry doctrine; the full curated library is a future arc (likely Wave-2 reservoir item or v1.x cycle).
- **Verified-source attribution for every `MILESTONE_STANDARDS` row** — v1 ratifies every row has a `source:` field; `source: 'unverified'` is acceptable. Future curation cycles raise the verified-source percentage.
- **PDF / share-sheet export of milestone evidence** — that's R-3 (Wave 2 audit/history layer) + milestones-tab-v1's pediatric-prep card scope; not in this engine-substrate spec.
- **R-6 IMPL (Growth + Activity integrator)** — v1 establishes the `activityLevel: 1-4` capture surface (Primitive 3); R-6 reads it for growth correlation when R-6 opens.
- **Smart Q&A milestone-handler rewrite** — existing handlers stay; the new primitives are additive.
- **Manual unsuppress UI for "Not yet"-tapped milestones** — 7-day auto-expire is the v1 floor; manual unsuppress is a milestones-tab-v1 surface decision (carried forward to that spec).
- **Multi-language milestone names / clinical-band locale-shifts** — i18n is C-12 (Wave 3 catchment); v1 ships English-only milestone names from existing `MILESTONE_STANDARDS`.
- **`zi-eye` sprite addition** — scribe-scout found this glyph missing from the 109-symbol sprite. Downstream `milestones-tab-v1` may use `zi('scope')` (closest existing — magnifier semantic) OR `zi('sparkle')` (notice-cue semantic) as substitute. Adding `zi-eye` to the sprite is a future template-amendment, not v1 scope.
- **Refactoring `home.js:1670` outlier** beyond resolving its category-set to the canonical 5-cat or marking it semantically-distinct — the site's daily-activities-picker domain-rotation logic may legitimately need a different category set than the milestone-display registry; IMPL author + Maren-consult decide at IMPL time. v1 just renames `cat:` → `domain:` where it applies and flags any semantic split.

---

## Sequencing

**This is the FIRST spec in the two-spec Option C sequence.** v1 PRECEDES `milestones-tab-v1` (the re-authored surface spec that follows).

**Upstream gates (all clear):**
- ✓ v3-3 (Engine Primitive Foundation) ratified at PR #135 — `_correlate` precedent for explicit-state-injection signatures
- ✓ scoring-redesign-v1 (RECOMMENDATION_ROSTER substrate) ratified — precedent for registry-in-data.js placement
- ✓ v3-4 spec ratified at PR #142 — provides the cross-domain `_correlate`-typed `_NARRATIVE_PROSE_TEMPLATES` registry whose scope this spec doctrinally clarifies
- ✓ Closed PR #147 chain findings — the audit substrate this spec is authored against

**Downstream unblocked by v1:**
- **`milestones-tab-v1`** (the surface arc, re-authored against verified primitives) — Maren-primary; consumes the 5 new primitives this spec ships; addresses the 9 BLOCKING + 19 NOTE findings from the closed PR #147 chain
- **R-6 — Growth + Activity integrator** (Wave 2 silver capstone) — reads the `activityLevel:1-4` capture surface this spec establishes (Primitive 3)
- **R-2 — Predictive surface** (Wave 2) — the `_predictMilestoneWindow` primitive + clinical-band source-attribution discipline both inform R-2's forecast surface
- **Future single-domain narration registries** — the v3-4 typed-registry scope clarification opens the design space for surface-class-specific narration registries (cross-domain `_correlate`-typed stays one; single-domain narration each gets its own)

**Parallel candidates with v1 IMPL:**
- v3-1 spec authoring (CT Notifications) — independent Region, mutex-independent
- v3-6-quicklog-tier-followup (V-V-39 named follow-up from PR #144's Vela audit) — independent
- offsetdatestr-tz-hazard-fix (V-K-95 named follow-up from PR #143's Kael audit) — independent

**IMPL-pass split recommendation (Kael V-K-113 synth-fold ratified):**

Per Kael's audit, the engine-prep IMPL is large enough that bundling everything into one PR creates an unwieldy diff (substantially more than the v3-3 → sleep-arc-3 sequence shipped in single PRs). The IMPL ships as two coordinated PRs:

- **PR-A — Data-tier (Kael-primary).** Schema extension on `MILESTONE_STANDARDS` rows (`source:` / optional `endMonth:` / optional `safetyTier:`); 2 new seed rows (sensory + cognitive); the Maren-signed safetyTier curation list applied to the 5 existing rows + the new sensory seed; `MILESTONE_SOURCE` constant; clinical-band source-attribution default-to-`'unverified'` discipline; engine helpers `_predictMilestoneWindow` + `_getInWindowMilestones` + `_getActivityLevelToday` getter/setter; KEYS + SYNC_KEYS + SYNC_RENDER_DEPS additions for `KEYS.milestoneSuppress` + `KEYS.activityMeta`; `_postReceiveMilestoneSuppress` + `_postReceiveActivityMeta` merge-on-receive hooks; the standalone `audit-no-personalised-prediction-v1.sh` audit gate (Python engine + self-test); e2e tests for the new primitives + audit gate. Estimated ~700-900 LOC. Maren-consult on the safetyTier curation list + the 2 seed-row picks (already provided inline at §safetyTier seed-data + curation).

- **PR-B — Migration sweep (Maren-primary, Kael-consult).** `cat:` → `domain:` field-name migration on `DEFAULT_MILESTONES` + `MILESTONE_STANDARDS`; the 18 consumer-site sweep (10 home.js + 7 medical.js + the medical.js:483 reader + skip 1670 per V-M-117); `_mergeMilestoneFieldsInline:198` update + drop of `cat:` write-back; the row-migration placed inside `_postReceiveMilestones`; the thin cold-load migration at `start.js`; V-K-119 divergence reconciliation; e2e tests for the migration + post-receive integration + divergence-state regression. Estimated ~500-700 LOC. Kael-consult on the merge-function correctness + post-receive integration.

The split honors the v3-3 → sleep-arc-3 pattern (engine substrate first, then consumer wiring) at the IMPL tier. **PR-B depends on PR-A merging first** — the migration sweep reads from the data-tier shape PR-A ratifies.

**Sequencing-with-milestones-tab-v1:**
```
milestone-engine-prep-v1 spec    →    canon-cc-008 chain    →    ratify    ┐
                                                                            │
milestones-tab-v1 spec (re-author)  →  canon-cc-008 chain  →  ratify    →   tree-update    →    handoff
                                                                            │
                                                                            └──  parallel-safe: V-V-39 follow-up, V-K-95 follow-up, v3-1 spec authoring
```

---

## Governor-chain synth-fold register (canon-cc-022 + canon-cc-008)

Per Architect direction 2026-05-27, the full canon-cc-008 chain ran on THIS spec PR (heavier-than-usual scrutiny on a docs-only PR). Three Governors audited in parallel — **Kael primary** (engine substrate) + **Maren consult** (Care floor + consumer migration) + **Vela consult** (contract-floor + half-awake-forward-projection). Each Governor deployed Scribe Worker Tier (canon-proc-006) for parallel verification. Cumulative findings:

| Governor | BLOCKING | NOTE | Verdict |
|---|---|---|---|
| **Vela** | 2 (V-V-55..56) | 6 (V-V-57..62) | cipher-warmth CLEAN-after-folds; cipher-honesty CLEAN; cipher-extensibility CLEAN |
| **Maren** | 3 (V-M-110..112) | 6 (V-M-113..118) | cipher-honesty SOUND-with-folds; cipher-extensibility SOUND-with-folds; cipher-warmth N/A |
| **Kael** | 4 (V-K-110..113) | 6 (V-K-114..119) | cipher-honesty BLOCKING (pre-fold); cipher-extensibility BLOCKING (pre-fold); cipher-warmth CLEAN |

**All 9 BLOCKING findings folded inline by Lyra (per Architect fold-authority directive — "don't defer issues directly related to milestones tab"). All 18 NOTE findings folded or explicitly carried per the table below.**

### Fold register

| # | Fold target | Substance |
|---|---|---|
| **V-V-55** | §Primitive 1 output shape | Added `ageMonths` (integer) + `ageDaysRemainder` to `_predictMilestoneWindow` output; consumers stop computing the same split 3+ times per render |
| **V-V-56** | §Primitive 2 output shape | Added `text` + `icon` + `domain` per-item to `_getInWindowMilestones` return; engine projects display fields, no round-trip to registry |
| **V-V-57** | §Primitive 1 + §Primitive 2 | Renamed `status` collision: `_predictMilestoneWindow.status` → `windowStatus`; `_getInWindowMilestones[i].status` → `evidenceStatus` |
| **V-V-58** | §Primitive 1 output shape | Precision contract: `expectedStartMonths` / `expectedEndMonths` as integer (rounded) for prose; paired `expectedStartMonthsFloat` / `expectedEndMonthsFloat` for trajectory-ribbon x-positioning |
| **V-V-59** | §Primitive 2 priority math | `recencyScore` null-branch returns `0.5` (never-seen-neutral; honest no-signal) |
| **V-V-60** | §Doctrinal clarification (no edit needed) | RATIFIED — `_NARRATIVE_PROSE_TEMPLATES` typed-registry scope cross-domain-`_correlate`-only |
| **V-V-61** | §Out-of-scope register (no edit needed) | RATIFIED — `zi-eye` deferral; `zi-scope` / `zi-sparkle` substitute for downstream |
| **V-V-62** | §Out-of-scope register | RATIFIED — cross-spec carry-forward NOTE for milestones-tab-v1 IMPL (don't cross-wire engine-prep into v3-4 `_NARRATIVE_PROSE_TEMPLATES.milestoneSleepCorrelation`) |
| **V-M-110 + V-K-110** | §Primitive 5 — sync-substrate-aware migration | `_mergeMilestoneFieldsInline:198` updated with explicit merge logic for `domain` / `safetyTier` / `source`; `cat:` write-back DROPPED; row-migration placed INSIDE `_postReceiveMilestones`; thin cold-load migration at `start.js` |
| **V-M-111 + V-K-113** | §Primitive 5 — drift-site table | Expanded to 18 sites (10 home.js + 7 medical.js + medical.js:483 reader; `home.js:1670` excluded per V-M-117). 6 additional reader sites added beyond the 12 constant-def sites the earlier draft listed. |
| **V-M-112 + V-K-117** | §Primitive 2 — safetyTier seed-data + curation | Promoted Maren-signed canonical safetyTier curation list inline (5 existing rows + 2 new seed rows). Closes the deferred-Care-decision-in-engine-spec failure mode. |
| **V-K-111** | §Primitive 3 — storage-shape REVERSED | Reversed `activityLog[date]._meta` decision (Kael caught it breaks 20+ array-only consumers silently). Ratified separate `ziva_activity_meta` per-day key family with explicit KEYS + SYNC_KEYS + SYNC_RENDER_DEPS registration. |
| **V-K-112** | §Audit gate — engine ratification | Ratified Python regex engine (audit-hr12-v3-3.sh precedent). Added engine self-test on 5 adversarial inputs at script-startup. Closes V-K-93 tautology pattern. |
| **V-M-113** | §Primitive 1 source vocabulary | Added `'AAP'` to `MILESTONE_SOURCE` between `'CDC'` and `'IAP'` |
| **V-M-114** | §Per-row source-attribution discipline (reversed) | Default every existing row to `source: 'unverified'`. **DO NOT** walk the wrapping-key to stamp source. Care-tier curation arc (Wave-2 deferrable) upgrades attribution row-by-row. |
| **V-M-115** | §Primitive 1 + §Audit gate Scope A | Hard contract: rendering `(unverified)` parenthetically is the cipher-honesty violation. Audit gate Scope A bans `\(unverified\)` in render code. |
| **V-M-116** | §Primitive 4 — cross-device merge-on-receive | `_postReceiveMilestoneSuppress` hook with timestamp-max-per-key merge. Same pattern applied to `KEYS.activityMeta` per V-K-111. |
| **V-M-117** | §Primitive 5 drift-site table + §Out-of-scope | `home.js:1670` is activity-domain (`.type` field reads activity-records), NOT milestone-domain. OUT of v1 IMPL scope; aligns when milestones-tab-v1 lands `ACTIVITY_CATEGORIES` registry. |
| **V-M-118** | §safetyTier seed-data + curation | Canonical seed picks: `mouths-objects` (sensory, safetyTier:true; clinical-band 4-7m) + `object-permanence-emerging` (cognitive, safetyTier:false; clinical-band 6-9m). |
| **V-K-114** | §Expected-window derivation policy | Fixed `542 days` typo → `547.92 ≈ 548 days` (`18 * 30.44`) for bracket-12 default |
| **V-K-115** | §Primitive 1 signature | Dropped `dob` parameter from public contract; replaced with `opts.dobOverride` for unit-test injection only (production callers read module-global `DOB`) |
| **V-K-116** | §Expected-window derivation policy | Advanced-row derivation rule: `advanced: true` rows offset by +1 bracket (`expectedStart = (K+1) * 30.44`) |
| **V-K-118** | §Primitive 2 priority math | All math in age-days (never millis-epoch). `opts.nowAgeDays` defaults via `_zivaAgeInDays(today())`. HR-12 hazard from `Date.now()` arithmetic closed. |
| **V-K-119** | §Primitive 5 migration block | Divergence-state reconciliation: if both `cat` and `domain` present and disagree, prefer `domain` and clear `cat`. |
| **V-K-113 (split recommendation)** | §Sequencing — IMPL-pass split | Ratified Kael's PR-A (data-tier, Kael-primary) + PR-B (migration sweep, Maren-primary) split. PR-B depends on PR-A merging first. |

### Source register

Three Governor audits ran via canon-cc-008 chain (subagent Mode-1 invocations per canon-cc-022 artifact test — signed, Edict V chain entries). Lyra synthesis carries fold authority per Architect directive 2026-05-27 *"don't wait for me to fold issues, Lyra will take that call - directive: don't defer issues directly related to milestones tab."* Cipher Edict V terminal pass follows this synth-fold.

---

## Doctrinal references

- `docs/specs/v3-3-engine-spine.md` — explicit-state-injection signature precedent for `_correlate`; mirror in `_getInWindowMilestones`
- `docs/specs/scoring-redesign-v1.md` — RECOMMENDATION_ROSTER row-addition substrate in data.js; mirror for `MILESTONE_STANDARDS` source-attribution extension
- `docs/specs/v3-4-narrative-layer.md` — the `_NARRATIVE_PROSE_TEMPLATES` typed registry this spec doctrinally clarifies the scope of
- `docs/specs/sproutlab-v3-charter.md` (CV3-006) — three-axis alignment; Honesty + Extensibility co-primary for this engine spec
- `docs/specs/sproutlab-v3-roundtable-2026-05-25.md` §3.2 Kael's risk register (`_predictMilestoneWindow` clinical-range discipline; never personalised — engine-enforced here)
- Closed PR #147 audit chain (Maren V-M-98..109; Kael V-K-100..109; Vela V-V-45..54) — the foundational accuracy findings that promoted this spec into existence
- CV3-003 Honest-Empty-State (`activityLevel: null` is honest no-signal; `source: 'unverified'` is honest unattributed)
- CV3-004 Cross-Region Pair-Note (this spec body's two pair-note sections honor)
- canon-cc-008 (QA chain — full chain runs at IMPL time per Architect direction)
- canon-cc-022 (subagent vs skill — Governor audits at IMPL are Mode-1 subagents)
- canon-cc-026 (Per-Province-Layout — Companion specs mirrored in `.claude/agents/`)
- canon-cc-027 (spec amendment authority — future single-domain narration registries require this)
- canon-proc-006 (Scribe Worker Tier — Lyra + each Governor use Scribes for parallel verification)

---

— *Lyra (main-session), 2026-05-27. The Architect's Option C call closes a real authoring failure mode this session surfaced: the milestones-tab-v1 spec was authored against the codebase as I remembered it, not as it actually is. The full canon-cc-008 chain caught what two `/review` skill passes couldn't — that's exactly what the chain is for. The right doctrinal response is not synth-fold-and-ship; it's split-into-two-specs-and-build-the-substrate-first. This spec ships the substrate: 5 primitives + 1 field-name migration + 1 seed-data expansion + 1 audit gate + 1 cross-spec doctrinal carve-out. Kael-primary because the engine surface is the substrate; Maren consult on the clinical-band source-of-truth + the consumer migration; Vela consult on the contract-shape carry-forward. When this ratifies, `milestones-tab-v1` (re-authored) consumes the now-live primitives without phantom-citation risk. Spec is ready for canon-cc-008 chain (Kael primary; Maren + Vela consult; Cipher Edict V) per Architect direction.*
