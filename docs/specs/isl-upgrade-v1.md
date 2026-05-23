# Spec: ISL Upgrade v1

**Version:** v1.0 draft (main-session synthesis from scribe-scout #2 capability map)
**Date:** 2026-05-23
**Author:** Lyra (main-session synthesis) — ingest from `scribe-scout` Wave 1.5 ISL capability map
**Authority chain:** `CLAUDE.md` §QA Chain · canon-cc-008 · canon-cc-022 · cc-018 `pending_review`
**Against commit:** `b2670f7`
**Cross-references:** `docs/specs/diet-rework-v1.md` (Arc A — Phase 3 depends on Arc B's keystone trio)

## Status

`pending_review` (cc-018). Prerequisites for `ratified`:

- Architect ratification of the upgrade roadmap and the Arc-A/Arc-B sequencing.
- **Kael Mode-1 audit** (primary — this is his jurisdiction: `intelligence-*.js`, `core.js`, `data.js`, `sync.js`, `config.js`).
- Maren Mode-1 cross-consult (Phase B-3 fold-in for the `qaAnswerMealCombo` handler — Care-side semantic check on the answer-card shape and copy).
- Cipher Mode-1 Edict V pre-pass on the upgrade roadmap.
- Aurelius chronicling on ratification (Codex Memory.md cross-cluster: ISL drift findings + the unwired-intents behavioral bug).

## Why

The SproutLab intelligence layer is 7 files, ~18,400 LOC distributed (post-PR-G split): `intelligence-isl.js` (1,029) + `intelligence-qa.js` (2,234) + `intelligence-qa-handlers.js` (3,614) + `intelligence-illness.js` (2,541) + `intelligence-quicklog.js` (4,355) + `intelligence-cards.js` (2,403) + `intelligence-caretickets.js` (2,224). The Architect framed it as "still pre-alpha." The Wave 1.5 capability map found this framing **partially accurate**:

- **Leaner than the framing suggests.** Across all 18,400 LOC there are zero `if(true)return;` early-exit stubs, zero `if(false)` gates, zero `TODO` / `FIXME` / `XXX` comments. The dormant surface is concentrated in **7 material findings**, not pervasive drift.
- **But two behavioral bugs are lurking.** Two registered QA intents — `prediction_accuracy` and `favorite_foods` — dispatch to **undefined handlers**. The dispatch is wrapped in `try { … } catch(e) { answer = null }` (`intelligence-qa.js:1670–1672`), so the user sees "no match" instead of the answer they expected. Two silent `ReferenceError`s lying in wait.
- **Plus one CLAUDE.md drift.** CLAUDE.md says "ISL: 22 intents with dedicated handlers." The canonical intent registry is `QA_INTENTS` in `intelligence-qa.js:1–175`, not in ISL, and the count is now **30**. The doc misattributes the location AND the count.
- **And data-layer surfaces are waiting for ISL consumers.** `NUTRITION[*].chem` (3 sub-fields) and `COMBO_RULES` (6 rules) are present in `data.js` with zero outside-`data.js` consumers — the data is specced but the intelligence layer doesn't yet pipe it.

The Arc A (Diet Tab Rework v1) Phase 3 is blocked on this layer. Hence this Arc B — surgically targeted upgrades, sized to unblock Arc A Phase 3, retire the two silent ReferenceErrors, and resolve the boundary smells the capability map surfaced.

## Scope

**In scope.**
- The Phase-3 keystone trio (see §Sequencing).
- The two unwired intents — wire-or-de-register decision and implementation.
- Filing-cabinet boundary cleanups (`_qaUpdateSuggestions`, `_qaDetectDomain`, `renderInfoAdoption` relocations).
- CLAUDE.md drift fix (split into a tiny follow-up PR to keep this scope tight; flagged here, fix elsewhere).
- 2–3 user-visible upgrade candidates from the ranked list (selection at Architect's discretion after ratification).

**Out of scope.**
- No new domains added to ISL (sleep/poop/medical/milestones accessors stay as specced).
- No CareTicket state-machine changes (`intelligence-caretickets.js` two "Coming soon" stubs at `:1868–1873` are HR-8-compliant placeholders, not in this scope).
- No Smart Q&A intent additions beyond `meal_combo_check` + the two ReferenceError fixes.
- No `sync.js` / Firebase boundary changes.
- No `intelligence-quicklog.js` Activity Log / Today So Far refactors (mixed-concerns sleep+activity split is a known smell; deferred to a dedicated future arc).

**Hard boundary.** Arc B does not modify ISL semantics — it extends ISL surface. Existing intents, handlers, and accessors keep their contracts. New surfaces are additive.

## State of the union (scout #2 capability sketch)

| File | LOC | Main entry | Top symbols | Notes |
|------|-----|------------|-------------|-------|
| `intelligence-isl.js` | 1,029 | `getDomainData(domain, start, end)` (`:380`) | `resolveTimeQuery`, `generateDaySummary`, `generateRangeSummary`, `_islGetCached`, `_islMarkDirty`, `ISL_THRESHOLDS` | Pure data provider. Six domain accessors. **Scope leaks:** `_qaUpdateSuggestions` (`:115–198`) + `_qaDetectDomain` (`:890–899`) belong to QA. |
| `intelligence-qa.js` | 2,234 | `qaExecuteQuery` (`:1579`); dispatch ladder `:1631–1668` | `QA_INTENTS` (`:1–175`, **30 entries**), `qaClassifyInput` (`:220`), `qaMatchIntent` (`:1272`), `_qaHandleTemporal` (`:1899`), UIB plumbing `_iqRenderPicker` (`:351`) / `_iqMineMealCombos` (`:493`) / `_iqBuildNewCombos` (`:686`) / `_iqGetWarnings` (`:822`) | The file Lyra edits to register new intents. |
| `intelligence-qa-handlers.js` | 3,614 | `qaAnswer*` family (27 functions) | Diet-relevant: `qaAnswerNutrientGap` (`:1892`), `qaAnswerFoodVariety` (`:2154`), `qaAnswerFoodSafety` (`:2225`), `qaAnswerTexture` (`:2300`); plus `_qaHandleLookback`/`Pattern`/`Planning`. **Scope leak:** `renderInfoAdoption` (`:3409`). |
| `intelligence-illness.js` | 2,541 | `startFeverEpisode` / `logFeverReading` / `resolveFeverEpisode` (`:37/61/96`); `renderHomeFeverBanner` (`:563`) | Four illness state machines (fever, diarrhoea, vomiting, cold). Self-contained; tight. |
| `intelligence-quicklog.js` | 4,355 | `saveActivity` (`:239`); `openActivityLogPrefilled` (`:232`); `renderActivityChips` (`:195`) | Activity Log + Sleep Info-tab analytics cluster (`renderInfoSleepBedtimeDrift` `:3110` → `renderInfoSleepRegression` `:4355`). Mixed concerns — deferred refactor. |
| `intelligence-cards.js` | 2,403 | `renderInfo()` master (`:1025`) | Cross-domain analytics. Diet-relevant: `computeNutrientHeatmap` (`:1283`), `computeFoodCombos` (`:1446`), `computeMealBreakdown` (`:1755`), `renderInfoFoodIntro` (`:1075`), `renderInfoComboFreq` (`:1610`). **Natural home for chem.* analytics.** |
| `intelligence-caretickets.js` | 2,224 | `CT_TEMPLATES` (`:27`); `ctCreate`; `ctNextDueTime` (`:210`) | CareTicket lifecycle. Two "Coming soon" placeholders at `:1868–1873` — out of scope. |

**Dormant inventory (top 7):**

| File | Symbol | Line | Status | LOC | Action |
|------|--------|------|-------|-----|--------|
| `intelligence-qa.js` | `QA_INTENTS[id='prediction_accuracy']` | 158–161 | **stub — handler undefined** | 4 | Decide: wire or de-register |
| `intelligence-qa.js` | `QA_INTENTS[id='favorite_foods']` | 163–166 | **stub — handler undefined** | 4 | Decide: wire or de-register |
| `intelligence-caretickets.js` | `ctViewAll` action | 1868–1870 | "Coming soon" placeholder | 3 | Out of scope — HR-8 compliant |
| `intelligence-caretickets.js` | `ctViewOverdue` action | 1871–1873 | "Coming soon" placeholder | 3 | Out of scope — HR-8 compliant |
| `intelligence-isl.js` | `_qaUpdateSuggestions` | 115–198 | misplaced (belongs in QA) | 84 | Phase B-4 — relocate |
| `intelligence-isl.js` | `_qaDetectDomain` | 890–899 | misplaced (belongs in QA) | 10 | Phase B-4 — relocate |
| `intelligence-qa-handlers.js` | `renderInfoAdoption` | 3409 | misplaced (belongs in cards) | ~30 | Phase B-4 — relocate |

## Coupling — load-bearing vs stranded

**Load-bearing** (heavy outside-Region usage):
1. **`intelligence-isl.js`** — every QA path + medical analytics traverse it. ~20 outside-file call sites. Pure provider.
2. **`intelligence-qa.js`** — `QA_INTENTS` + `renderQABar` is the UIB entry; home.js mounts it.
3. **`intelligence-illness.js`** — wired into medical.js, home.js, core.js, sync.js. Fever banner on the Home hero.
4. **`intelligence-cards.js`** — `renderInfo()` is the entire Info tab; heatmap consumed by home + diet.
5. **`intelligence-quicklog.js`** — Activity Log save path universal.

**Stranded / experimental** (0–1 outside callers):
1. Two unwired intents (`prediction_accuracy`, `favorite_foods`) — pre-alpha promises.
2. `_qaHandlePlanning` + `_qaTomorrowPlan` + `_qaDoctorPrep` + `_qaShareToday` in `intelligence-qa-handlers.js` — lightly used planning surface.
3. `intelligence-caretickets.js`'s ISL-side surface is thin (one intent, `ct_create`).

## Sequencing — the keystone trio (Phase B-1)

**Minimum spec-bearing change to unblock Arc A Phase 3.** Three surgical edits:

### B-1.1 — Extend `_islDietData` with `chemRollup` (`intelligence-isl.js:446–499`)

Add a `chemRollup` field to the object returned by `_islDietData`, computed by joining `allFoods` against `NUTRITION[base].chem`. Shape:

```js
chemRollup: {
  fibreDaysHigh: <int>,       // distinct chem.fibre categories consumed in window
  fibreDistribution: { ... }, // category → days-count map
  antiNutrientFlags: [ ... ], // ordered list of {nutrient, daysSeen, foodCount}
  bioactiveCount: <int>,      // distinct chem.bioactives across window
  bioactiveTopFive: [ ... ]   // most-frequent bioactives
}
```

- Joins `allFoods` (already computed in `_islDietData`) to `NUTRITION` via the canonical food-base lookup (`_FOOD_ALIASES`-aware).
- Skips foods absent from `NUTRITION` silently (does not throw).
- HR-12: respects the existing window's `start`/`end` date construction; no new date logic.
- Cache: covered by existing `_islGetCached` keyed on `domain+start+end`. No new cache invalidation path needed (read-only join over already-cached data).

### B-1.2 — Register `meal_combo_check` intent (`intelligence-qa.js`)

Add at `:69` (between `food_texture` and the POOP block):

```js
{
  id: 'meal_combo_check',
  triggers: ['combo', 'pairing', 'pair with', 'eat together', 'with this', 'spacing'],
  boosts: ['food', 'iron', 'calcium', 'absorb'],
  exclude: [/* domain disambiguators if needed */],
  handler: 'answerMealCombo'
}
```

Add dispatch at `:1642` (between `answerTexture` and `answerPoopGeneral`):

```js
else if (handler === 'answerMealCombo') answer = qaAnswerMealCombo(intent.id);
```

### B-1.3 — Implement `qaAnswerMealCombo` (`intelligence-qa-handlers.js`)

Insert between `qaAnswerTexture` (`:2300–~2395`) and `qaAnswerPoopFood` (`:2396`). Model on `qaAnswerFoodSafety` (`:2225`) for shape.

```js
function qaAnswerMealCombo(intentId) {
  // 1. Pull recent feeding window via getDomainData('diet', start, end) — last 1 day for meal-window scope.
  // 2. For each pair of foods in the window, tag-resolve via NUTRITION[food].nutrients.
  // 3. Match the resolved nutrient pair against COMBO_RULES entries (data.js:2463–2476).
  // 4. For each matched rule, build an answer-card item: { title, body, severity, advice }.
  // 5. Also consult chem.antiNutrients for foods in the window; flag multi-flag oxalate/phytate loads.
  // 6. Return: { title: 'Today's combos', headline, domain: 'sage', icon: 'food', items, actions: [] }.
  // HR-4: escHtml every food string, every rule body. HR-1: zi() for any icon.
}
```

**Critical handler detail.** `COMBO_RULES` keys are nutrient names (`foods:['iron','calcium']`), NOT food names. The handler must tag-resolve via `NUTRITION[food].nutrients` arrays, not name-match the food strings.

**That trio is the minimum.** Three files touched, ~150 LOC added, retires Group A/B/C from scout #1's dead-data inventory.

## Upgrade roadmap — full ranked list

| # | Name | Scope | Why | Effort | Preconditions | Phase-3 relation | Spec phase |
|---|------|-------|-----|--------|---------------|------------------|------------|
| 1 | Extend `_islDietData` with `chemRollup` | `intelligence-isl.js:446–499` | Keystone — one accessor surfaces `chem.*` to every downstream | M | none | **yes** | **B-1** |
| 2 | Add `meal_combo_check` intent | `intelligence-qa.js:69, :1642` | Combo intelligence surface for `[Today]` | M | #1 | **yes** | **B-1** |
| 3 | Implement `qaAnswerMealCombo` handler | `intelligence-qa-handlers.js` between `:2395`/`:2396` | Required for #2 | M | #1, #2 | **yes** | **B-1** |
| 4 | Add `renderInfoChemVariety` + `renderInfoBioactiveDiversity` cards | `intelligence-cards.js` after `:1885` | Surfaces `chem.fibre` + `chem.bioactives` rollup to Diet `[Score]` segment + Info tab | M | #1 | **yes** | **B-2** |
| 5 | Promote `chem.antiNutrients` to UIB warnings | `intelligence-qa.js:822` `_iqGetWarnings` | UIB already builds warnings; antiNutrients is a free signal | S | #1 | **yes** | **B-2** |
| 6 | Wire `qaAnswerFavoriteFoods` handler | `intelligence-qa-handlers.js` (new) + register call at `:1659` | Pre-alpha intent silently no-matches — user-visible gap | S | none | no | **B-3** |
| 7 | Wire `qaAnswerPredictionAccuracy` handler — or de-register intent | `intelligence-qa-handlers.js` (new) or `intelligence-qa.js:158–161` removal | Second pre-alpha intent. Depends on whether prediction infrastructure exists | S–M | none (de-register) / depends (wire) | no | **B-3** |
| 8 | Extend `resolveTimeQuery` with `last/this Tuesday` + `N weeks ago` | `intelligence-isl.js:242–376` | Closes most-asked temporal gap; useful for richer chem time-slicing | M | none | partial | **B-3** |
| 9 | Relocate `_qaUpdateSuggestions` + `_qaDetectDomain` → `intelligence-qa.js` | `intelligence-isl.js:115–198, :890–899` | Hygiene: 100+ LOC of QA plumbing out of the pure-data layer | S | none | no | **B-4** |
| 10 | Relocate `renderInfoAdoption` → `intelligence-cards.js` | `intelligence-qa-handlers.js:3409` | Joins `renderInfo*` siblings | S | none | no | **B-4** |
| 11 | Cache invalidation hook on chem-data mutation | `intelligence-isl.js:218` `_islMarkDirty` | Pre-emptive: if chem becomes mutable in a future UI, ISL cache needs a `diet`-domain dirty hook | M | #1 | partial | **B-3 or later** |
| 12 | Cross-link `qaAnswerMealCombo` from `food_safe` + `food_nutrient` | `intelligence-qa-handlers.js` | Richer answers from existing intents by cross-referencing `COMBO_RULES` | L | #1, #2, #3 | **yes** | **B-3 or later** |

## Region boundary declarations

| File | Governor jurisdiction | Phase(s) | Expected change size |
|------|----------------------|----------|----------------------|
| `split/intelligence-isl.js` | Kael | B-1 (chemRollup), B-3 (temporal parser ext), B-4 (relocations) | medium total |
| `split/intelligence-qa.js` | Kael | B-1 (intent reg), B-2 (UIB warnings), B-3 (handlers wire), B-4 (recv relocations) | medium total |
| `split/intelligence-qa-handlers.js` | Kael | B-1 (handler impl), B-3 (favorite_foods / prediction_accuracy handlers), B-4 (send `renderInfoAdoption`) | medium |
| `split/intelligence-cards.js` | Kael | B-2 (chem cards), B-4 (recv `renderInfoAdoption`) | small–medium |
| `split/data.js` | shared | none (consumer only) | — |
| `split/core.js` | Kael | none expected | — |
| `split/template.html` | Maren + Kael (shared) | none expected | — |
| `split/styles.css` | Maren + Kael (shared) | possibly B-2 (new chem-card tokens if needed) | small |

**Cross-Region consult.** Phase B-1's `qaAnswerMealCombo` handler produces an answer card consumed in Care-jurisdiction surfaces (Diet `[Today]` chips). Maren cross-consult on answer-card schema and copy.

## HR pre-check

| HR | Predicted risk | Mitigation |
|----|----------------|-----------|
| HR-1 (no emojis) | low | Handler uses `zi(*)` only. |
| HR-2 (no inline styles) | low | Cards use existing token system. |
| HR-3 (no inline handlers) | low | Chip dismissal via `data-action`. |
| HR-4 (escHtml at render boundaries) | medium | Handler renders `chem.*` values (data.js strings) and combo-rule bodies (data.js strings). HR-4 audit on every `${...}` in handler render output. |
| HR-5 (tokens-only) | low | — |
| HR-6 (data-action) | low | — |
| HR-7 (zi via innerHTML) | low | — |
| HR-8 (Coming-soon stubs) | n/a | Two CareTicket stubs at `:1868–1873` are pre-existing and HR-8 compliant. |
| HR-9 (post-build QA) | structural | Per-phase canon-cc-008 chain. |
| HR-10 (no text-overflow ellipsis) | low | — |
| HR-11 (Math.floor currency) | n/a | — |
| HR-12 (timezone-safe dates) | medium | `chemRollup` aggregates over a window. The window's `start`/`end` come from `resolveTimeQuery` — already HR-12 compliant. No new date construction inside chemRollup. |

## Governor-readiness note

**For Kael (primary).**
1. `chemRollup` shape — does the proposed object layout (`fibreDaysHigh`, `fibreDistribution`, `antiNutrientFlags`, `bioactiveCount`, `bioactiveTopFive`) capture the right derivations, or are we surfacing too much / too little? Naming: `chemRollup` vs `chemSummary` vs nest into `nutritionDeep`? Kael call.
2. Should the `_FOOD_ALIASES` join in `chemRollup` raise warnings for unaliased synonym pairs (scout #1: almond/almonds, fig/anjeer, etc.) or silently dedupe? Affects variety analytics correctness.
3. Two pre-alpha intents — wire `favorite_foods` (Lyra recommends — high user value, data already present) and **de-register** `prediction_accuracy` (no prediction infrastructure exists yet, the intent promises something we cannot deliver). Confirm.
4. Filing-cabinet relocations — `_qaUpdateSuggestions` (84 LOC) + `_qaDetectDomain` (10 LOC) from ISL → QA; `renderInfoAdoption` (~30 LOC) from qa-handlers → cards. Single PR or split? Lyra leans single PR for hygiene; each move is small.
5. The two undefined-handler ReferenceErrors are swallowed by `try/catch` at `intelligence-qa.js:1670–1672`. Should the catch ALSO log to console / sentry for observability, or stay silent (current behavior)? Behavioral change implications.
6. Phase B-1 keystone trio — review the contract for `qaAnswerMealCombo`'s answer-card shape and how `COMBO_RULES` (nutrient-keyed) gets tag-resolved via `NUTRITION[food].nutrients`. Any edge cases (e.g., food with no entry in NUTRITION)?

**For Maren (cross-Region consult).**
1. The `qaAnswerMealCombo` answer-card copy and severity scoring — Maren-approved phrasing for combo guidance ("spacing tip", "absorption boost", "double oxalate load"). Drafting needed.
2. Phase B-2 `renderInfoChemVariety` card — copy and visualization choices. The "Anti-Nutrient Watch" element in particular needs calm-advisory phrasing not alarm.

## PR sequence (Phases B-0 → B-4)

| Phase | Name | Scope | Branch | Jurisdiction | Diff size | QA chain |
|-------|------|-------|--------|--------------|-----------|----------|
| **B-0** | **Spec (this PR)** | This document + Arc-A spec + journal updates. | `claude/sproutlab-diet-rework-p0` (shared with Arc A) | docs-only | small | Governor audit waived (docs-only); Architect ratification + Kael Mode-1 pre-pass + Cipher Mode-1 + Aurelius chronicling. |
| B-1 | Keystone trio | `chemRollup` field + `meal_combo_check` intent + `qaAnswerMealCombo` handler | `claude/sproutlab-isl-upgrade-p1` | Kael (all 3 files) | medium | Kael Mode-1 → Lyra synth → Cipher. Maren cross-consult on card copy/schema. |
| B-2 | Chem-variety cards + UIB antiNutrient warnings | `renderInfoChemVariety` + `renderInfoBioactiveDiversity` cards; `_iqGetWarnings` antiNutrients integration | `claude/sproutlab-isl-upgrade-p2` | Kael; Maren cross-consult on phrasing | small–medium | Kael Mode-1 + Maren cross-consult → synth → Cipher. |
| B-3 | Pre-alpha intent resolution + temporal parser ext | Wire `qaAnswerFavoriteFoods`; de-register or wire `qaAnswerPredictionAccuracy`; `resolveTimeQuery` += `last Tuesday` + `N weeks ago` | `claude/sproutlab-isl-upgrade-p3` | Kael | small | Kael Mode-1 → synth → Cipher. |
| B-4 | Boundary cleanup (hygiene) | Relocate `_qaUpdateSuggestions` + `_qaDetectDomain` → qa; `renderInfoAdoption` → cards | `claude/sproutlab-isl-upgrade-p4` | Kael | small (~125 LOC moved) | Kael Mode-1 → synth → Cipher. |

**Dependency on Arc A.** Arc A Phase 3 depends on Arc B Phase B-1 (keystone trio) being merged. Arc A Phases 1, 2, 4, 5, 6 are independent of Arc B.

**CLAUDE.md drift fix** is a separate tiny docs-only follow-up PR (not in any of B-1 through B-4). Single-line correction: "ISL: 22 intents with dedicated handlers" → "Smart Q&A: 30 intents (registry in `intelligence-qa.js`); ISL: temporal query parser + 6 domain-data accessors + day/range summary generators."

## Open questions

1. **`chemRollup` naming and shape.** `chemRollup` vs `chemSummary` vs `nutritionDeep`. Field set granularity. (Kael call after B-1 review.)
2. **`prediction_accuracy` intent.** Wire (and to what — current prediction infrastructure?) or de-register? Lyra recommends **de-register** (the intent promises something the codebase cannot deliver today).
3. **Silent catch behavior** at `intelligence-qa.js:1670–1672` — keep silent (current), add console.error, or add observability hook? Affects bug-detection for future undefined-handler regressions.
4. **`_FOOD_ALIASES` discipline in `chemRollup`** — warn on unaliased synonyms (almond/almonds etc., scout #1 flag) or silent dedupe?
5. **Filing-cabinet relocations** — single PR (B-4) or three micro-PRs? Lyra recommends single.
6. **CLAUDE.md drift fix scope** — fold into B-0 (this PR) or separate tiny PR? Doctrine allows docs-only waiver either way. Lyra recommends **separate** to keep this PR tight.

## Synthesis amendments — Wave 1.5 source attribution

This spec is authored in main-session synthesis, ingesting findings from:
- **scribe-scout #2** (Wave 1.5 re-fire) — capability map, dormant inventory, coupling graph, ranked upgrade candidates, sequencing recommendation.
- **scribe-scout #1** (Wave 1.5 first wave) — food-DB schema survey (`NUTRITION.chem`, `COMBO_RULES` dead-data identification, food-DB count discrepancy, latent data-quality oddities).
- **scribe-record** (Wave 1.5) — journal infrastructure; the pattern observation that "Arc B isn't tangential — it's the substrate Arc A's Phase 3 will stand on."

The Lyra Mode-1 Wave 1 spec (Diet rework v1) did not yet exist as a separate Arc B; this spec was authored fresh in main-session after Wave 1.5 surfaced the substrate gap.

---

— Lyra (main-session synthesis from scribe-scout #2 capability map), 2026-05-23, against `b2670f7`. cc-018 status: `pending_review`.
