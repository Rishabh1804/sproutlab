# Spec: ISL Upgrade v1

**Version:** v1.0 draft (main-session Wave 1.5 + Wave 2 synthesis from scribe + Mode-1 audits)
**Date:** 2026-05-23
**Authors:**
- Lyra (main-session synthesis) — primary spec body, ingest from scribe-scout #2 capability map (Wave 1.5)
- Lyra (main-session synthesis) — Wave 2 amendments folding Maren / Kael / Cipher / Aurelius Mode-1 audits

**Authority chain:** `CLAUDE.md` §QA Chain · canon-cc-008 · canon-cc-022 · cc-018 `pending_review`
**Against commit:** `b2670f7`
**Cross-references:** `docs/specs/diet-rework-v1.md` (Arc A — Phase 3 depends on Arc B's keystone trio)

## Status

`pending_review` (cc-018). Prerequisites for `ratified`:

- Architect ratification of the upgrade roadmap, the Wave-2 amendments, and the Arc-A/Arc-B sequencing.
- Kael Mode-1 audit — **complete** (V-K-49 through V-K-57 issued; verdict: yes-with-fixes; fixes folded below).
- Maren Mode-1 cross-consult — **complete** (V-M-47 through V-M-54 issued; copy + schema + safety-override findings folded below).
- Cipher Mode-1 Edict V pre-pass — **complete** (verdict: pass-with-fixes; fixes folded below).
- Aurelius cross-cluster chronicling — **complete** (verdict: chronicling-ready; Codex Memory.md candidates per Chronicler's discretion post-ratify).

**Companion-set deploy delta — paired ratification.** This spec and `diet-rework-v1.md` form a single arc-pair artifact under cc-018. Ratifying one without the other constitutes a canon-cc-008 short-circuit unless the Architect explicitly defers one — in which case Arc A Phase 3 must be deferred until Arc B Phase B-1 ratifies separately.

## Why

The SproutLab intelligence layer is 7 files, ~18,400 LOC distributed (post-PR-G split): `intelligence-isl.js` (1,029) + `intelligence-qa.js` (2,234) + `intelligence-qa-handlers.js` (3,614) + `intelligence-illness.js` (2,541) + `intelligence-quicklog.js` (4,355) + `intelligence-cards.js` (**2,643** per V-K-56 re-baseline — was 2,403 at spec-write) + `intelligence-caretickets.js` (2,224). The Architect framed it as "still pre-alpha." The Wave 1.5 capability map found this framing **partially accurate** — but Wave 2 corrected a load-bearing scout error:

- **Leaner than the framing suggests.** Across the seven `intelligence-*.js` files (V-M-54 scope correction — claim is to the file set under audit, not the whole codebase) there are zero `if(true)return;` early-exit stubs, zero `if(false)` gates, zero `TODO` / `FIXME` / `XXX` comments. The dormant surface is concentrated in a handful of findings.
- **No silent ReferenceErrors — scout #2 missed `intelligence-quicklog.js` (V-K-49).** Wave 1.5 claimed two registered QA intents (`prediction_accuracy`, `favorite_foods`) dispatched to undefined handlers. **Kael Mode-1 verified the opposite:** both handlers exist and ship:
  - `qaAnswerPredictionAccuracy` at `intelligence-quicklog.js:1290–1320` — reads `KEYS.qlPredictions`, computes Top-1/Top-N accuracy over the last 30 days, gracefully degrades to "Need more data" when n < 5.
  - `qaAnswerFavoriteFoods` at `intelligence-quicklog.js:1322–1341` — reads `foods.filter(f => f.favorite === true)`, computes per-food frequency.
  - The total `qaAnswer*` count across both `qa-handlers.js` AND `quicklog.js` is 29 (= 30 intents − the `ct_create` special-case picker branch).
  - The scout swept `qa-handlers.js` only. **Wave 1.5 methodology lesson:** capability-map scouts must grep across the full file-set under audit, not the file where a symbol is "expected" to live.
- **One CLAUDE.md drift.** CLAUDE.md says "ISL: 22 intents with dedicated handlers." The canonical intent registry `QA_INTENTS` is in `intelligence-qa.js:1–175`, not in ISL, and the count is now **30** (independently verified by Kael). The doc misattributes BOTH location AND count.
- **Data-layer surfaces waiting for ISL consumers.** `NUTRITION[*].chem` (3 sub-fields) and `COMBO_RULES` (6 rules) are present in `data.js` with zero outside-`data.js` consumers — the data is specced but the intelligence layer doesn't yet pipe it. **`COMBO_RULES` is not uniformly nutrient-keyed (V-K-53):** rule #6 is `{foods:['banana','constipation']}` — food-name + symptom. The handler must tri-resolve, not single-resolve.
- **Region LOC over the 30K trigger (V-K-56).** Live count: 30,725 LOC for the full Kael jurisdiction (`intelligence-*.js` + `core.js` + `data.js` + `sync.js` + `config.js` + `start.js`). Threshold is 30,000. **The Region is currently over budget, pre-arcs**, and `intelligence-cards.js` is +240 LOC since the Wave-1.5 capability map. Arcs B-1 (+~150 LOC) and B-2 (+~80 LOC) will push further. Surfaced as architectural watch-item — not a B-0 blocker, but Lyra/Cipher should plan for an `intelligence-cards.js` sub-split or similar before Region pressure becomes acute.

Arc A Phase 3 is blocked on this layer. Hence this Arc B — surgically targeted upgrades, sized to unblock Arc A Phase 3 and resolve the boundary smells the capability map (corrected) surfaced.

## Scope

**In scope.**
- The Phase-3 keystone trio (see §Sequencing).
- Temporal parser extension (`last Tuesday`, `N weeks ago`).
- Filing-cabinet boundary cleanups (`_qaUpdateSuggestions` + `QA_SUGGEST_POOL` + `_qaDetectDomain`, `renderInfoAdoption` relocations).
- Silent-catch `console.error` addition (per Wave 2 cross-companion convergence).
- CLAUDE.md drift fix flagged here, executed as a separate tiny PR (Open Q 6 — Lyra recommends separate).

**Out of scope.**
- No new domains added to ISL (sleep/poop/medical/milestones accessors stay as specced).
- No CareTicket state-machine changes (`intelligence-caretickets.js` two "Coming soon" stubs at `:1868–1873` are HR-8-compliant placeholders).
- No `sync.js` / Firebase boundary changes.
- No `intelligence-quicklog.js` Activity Log / Today So Far refactors (mixed-concerns sleep+activity split is a known smell; deferred to a dedicated future arc).
- **No "wire pre-alpha handlers" work (V-K-49 retirement).** Both `prediction_accuracy` and `favorite_foods` are already wired and shipping; nothing to wire or de-register.
- **Diet-side surfaces (`diet.js`, `home.js`, `core.js` segment routing) — see Arc A (C-REQ-3 boundary).**

**Hard boundary.** Arc B does not modify ISL semantics — it extends ISL surface. Existing intents, handlers, and accessors keep their contracts. New surfaces are additive.

## State of the union (scout #2 + Wave 2 corrections)

| File | LOC | Main entry | Top symbols | Notes |
|------|-----|------------|-------------|-------|
| `intelligence-isl.js` | 1,029 | `getDomainData(domain, start, end)` (`:380`) | `resolveTimeQuery`, `generateDaySummary`, `generateRangeSummary`, `_islGetCached`, `_islMarkDirty`, `ISL_THRESHOLDS` | Pure data provider. Six domain accessors. **Scope leaks:** `_qaUpdateSuggestions` (`:115–198`) + `QA_SUGGEST_POOL` (`:36–113`, 78 LOC sole-consumer-of `_qaUpdateSuggestions` per V-K-51) + `_qaDetectDomain` (`:890–899`) belong to QA. |
| `intelligence-qa.js` | 2,234 | `qaExecuteQuery` (`:1579`); dispatch ladder `:1631–1668` | `QA_INTENTS` (`:1–175`, **30 entries**), `qaClassifyInput` (`:220`), `qaMatchIntent` (`:1272`), `_qaHandleTemporal` (`:1899`), UIB plumbing `_iqRenderPicker` (`:351`) / `_iqMineMealCombos` (`:493`) / `_iqBuildNewCombos` (`:686`) / `_iqGetWarnings` (`:822`) | File for new intent registration. |
| `intelligence-qa-handlers.js` | 3,614 | `qaAnswer*` family (27 functions HERE; 2 more in `quicklog.js` per V-K-49) | Diet-relevant: `qaAnswerNutrientGap` (`:1892`), `qaAnswerFoodVariety` (`:2154`), `qaAnswerFoodSafety` (`:2225`), `qaAnswerTexture` (`:2300–:2395`). **Scope leak:** `renderInfoAdoption` (`:3409`). |
| `intelligence-illness.js` | 2,541 | `startFeverEpisode` / `logFeverReading` / `resolveFeverEpisode` (`:37/61/96`); `renderHomeFeverBanner` (`:563`) | Four illness state machines. Self-contained. |
| `intelligence-quicklog.js` | 4,355 | `saveActivity` (`:239`); `openActivityLogPrefilled` (`:232`); `renderActivityChips` (`:195`); **`qaAnswerPredictionAccuracy` (`:1290`) + `qaAnswerFavoriteFoods` (`:1322`) — both shipping, V-K-49** | Activity Log + sleep-analytics cluster (`renderInfoSleepBedtimeDrift` `:3110`–). Mixed concerns; deferred refactor. |
| `intelligence-cards.js` | **2,643** (re-baseline V-K-56; +240 from spec-write) | `renderInfo()` master (`:1025`) | Cross-domain analytics. Diet-relevant: `computeNutrientHeatmap` (`:1283`), `computeFoodCombos` (`:1446`), `computeMealBreakdown` (`:1755`), `renderInfoFoodIntro` (`:1075`), `renderInfoComboFreq` (`:1610`), `renderInfoMealBreakdown` (`:1885`–~2020). **Natural home for chem.* cards AND the new `computeMealCombos(date)` data fn per V-M-49 separation.** |
| `intelligence-caretickets.js` | 2,224 | `CT_TEMPLATES` (`:27`); `ctCreate`; `ctNextDueTime` (`:210`) | CareTicket lifecycle. Two "Coming soon" placeholders at `:1868–1873` — HR-8-compliant, out of scope. |

**Dormant inventory — Wave 2 corrected:**

| File | Symbol | Line | Status | LOC | Action |
|------|--------|------|-------|-----|--------|
| ~~`intelligence-qa.js`~~ | ~~`QA_INTENTS[id='prediction_accuracy']`~~ | ~~158–161~~ | **WIRED — handler at quicklog.js:1290 (V-K-49)** | — | No action. |
| ~~`intelligence-qa.js`~~ | ~~`QA_INTENTS[id='favorite_foods']`~~ | ~~163–166~~ | **WIRED — handler at quicklog.js:1322 (V-K-49)** | — | No action. |
| `intelligence-caretickets.js` | `ctViewAll` action | 1868–1870 | "Coming soon" placeholder | 3 | Out of scope — HR-8 compliant. |
| `intelligence-caretickets.js` | `ctViewOverdue` action | 1871–1873 | "Coming soon" placeholder | 3 | Out of scope — HR-8 compliant. |
| `intelligence-isl.js` | `_qaUpdateSuggestions` + `QA_SUGGEST_POOL` (V-K-51) | 115–198, 36–113 | misplaced (belongs in QA) | 84 + 78 = **162** | Phase B-4 — relocate as unit. |
| `intelligence-isl.js` | `_qaDetectDomain` | 890–899 | misplaced (belongs in QA) | 10 | Phase B-4 — relocate. |
| `intelligence-qa-handlers.js` | `renderInfoAdoption` | 3409 | misplaced (belongs in cards) | ~30 | Phase B-4 — relocate. |

**Behavioral concerns flagged separately:**
- **Silent catch at `intelligence-qa.js:1670–1672`** swallows all `qaAnswer*` throws into `null`/`qaRenderNoMatch`. With V-K-49 retired, this is no longer hiding undefined-handler ReferenceErrors — but it still defeats observability for genuine handler bugs. **Decision (Cipher + Kael + Maren convergence):** add `console.error('qaExecuteQuery dispatch failed:', e)` in B-3. No external observability hook (over-engineering for a no-backend PWA).
- **Pre-existing HR-6 latent in `_qaUpdateSuggestions` event handler at `:180–192`** uses `addEventListener` (V-K relocation finding). NOT in B-4 scope; **file as follow-up issue** sibling to #109/#111 from prior session.

## Coupling — load-bearing vs stranded

**Load-bearing** (heavy outside-Region usage):
1. **`intelligence-isl.js`** — every QA path + medical analytics traverse it. ~20 outside-file call sites. Pure provider.
2. **`intelligence-qa.js`** — `QA_INTENTS` + `renderQABar` is the UIB entry; home.js mounts it.
3. **`intelligence-illness.js`** — wired into medical.js, home.js, core.js, sync.js. Fever banner on the Home hero.
4. **`intelligence-cards.js`** — `renderInfo()` is the entire Info tab; heatmap consumed by home + diet.
5. **`intelligence-quicklog.js`** — Activity Log save path universal; also hosts `qaAnswerPredictionAccuracy` + `qaAnswerFavoriteFoods` (V-K-49).

**Stranded / experimental** (0–1 outside callers):
- `_qaHandlePlanning` + `_qaTomorrowPlan` + `_qaDoctorPrep` + `_qaShareToday` in `intelligence-qa-handlers.js` — lightly used planning surface.
- `intelligence-caretickets.js`'s ISL-side surface is thin (one intent, `ct_create`).

## Sequencing — the keystone trio (Phase B-1)

**Minimum spec-bearing change to unblock Arc A Phase 3.** Three surgical edits:

### B-1.1 — Extend `_islDietData` with `chemRollup` (`intelligence-isl.js:446–499`)

Add a `chemRollup` field to the object returned by `_islDietData`, computed by joining `allFoods` against `NUTRITION[base].chem`. **Ship 3 fields in B-1 per V-K reduction**; defer 2 fields to B-2:

```js
// B-1 ship:
chemRollup: {
  fibreDaysHigh: <int>,       // distinct chem.fibre categories consumed in window
  antiNutrientFlags: [ ... ], // ordered list of {nutrient, daysSeen, foodCount}
  bioactiveCount: <int>       // distinct chem.bioactives across window
}

// Defer to B-2 (YAGNI — chem cards may not need these maps):
//   fibreDistribution: { ... }
//   bioactiveTopFive: [ ... ]
```

- Joins `allFoods` (already computed in `_islDietData`) to `NUTRITION` via **`_baseFoodName(food)` at `core.js:2729–2748`** (V-K-54) — handles alias / parenthetical / form-word / plural normalization (4-layer lookup, not the prior single-layer "_FOOD_ALIASES-aware" framing).
- Skips foods absent from `NUTRITION` silently; logs a one-time `console.warn` on first-encounter unaliased synonym (V-K-54 + V-K position on Open Q 4).
- HR-12: window math via existing `resolveTimeQuery` — no new date construction in B-1.
- Cache: covered by existing `_islGetCached` keyed on `domain+start+end`. `_islMarkDirty('diet')` (`:218–227`) already clears any `diet:*`-keyed cache; **roadmap row 11 dropped per V-K-55 — `NUTRITION` is const-bound; no separate hook needed today**.
- **Naming locked: `chemRollup`** (rationale: "Rollup" matches aggregation-over-window semantic; "Summary" would collide with `generateDaySummary`/`generateRangeSummary` lexicon; "nutritionDeep" reads vague).

### B-1.2 — Register `meal_combo_check` intent (`intelligence-qa.js`)

Add at `:69` (between `food_texture` and POOP block):

```js
{
  id: 'meal_combo_check',
  triggers: ['combo', 'pairing', 'pair with', 'eat together', 'with this', 'spacing'],
  boosts: ['food', 'iron', 'calcium', 'absorb'],
  exclude: [/* domain disambiguators if needed */],
  handler: 'answerMealCombo'
}
```

Add dispatch at **`:1643`** (V-K spec-line correction — `:1642` is the `answerTexture` row; insert AFTER it):

```js
else if (handler === 'answerMealCombo') answer = qaAnswerMealCombo(intent.id);
```

### B-1.3 — Implement `qaAnswerMealCombo` (`intelligence-qa-handlers.js`)

Insert between `:2395` (end of `qaAnswerTexture`) and `:2396` (start of `qaAnswerPoopFood`).

**Architecture (V-M-49 separation):** the handler does NOT compute combo data — it consumes a NEW pure-data function `computeMealCombos(date)` in `intelligence-cards.js` (lives alongside `computeFoodCombos`/`computeNutrientHeatmap`/`computeMealBreakdown` sibling set). Both `qaAnswerMealCombo` (UIB answer-card surface) AND the `[Today]` chip-stack render in Arc A consume `computeMealCombos(date)`. Single source of truth.

**`computeMealCombos(date)` shape:**

```js
function computeMealCombos(date) {
  // 1. Pull recent feeding window via getDomainData('diet', start, end) — last 1 day (meal-window scope).
  // 2. For each food in the window, resolve to base name via _baseFoodName().
  // 3. For each pair of foods, evaluate against COMBO_RULES (data.js:2463–2476):
  //    - Tri-resolution per V-K-53 (COMBO_RULES is NOT uniformly nutrient-keyed):
  //      a. Tag-match: rule.foods[i] matches a nutrient in NUTRITION[food].nutrients
  //      b. Name-match: rule.foods[i] === _baseFoodName(food) (catches rule #6: banana)
  //      c. State-match: rule.foods[i] in {constipation, fever, diarrhoea, ...} -> consult
  //         intelligence-illness.js active episodes + recent poop consistency
  //         (catches rule #6: constipation). Cross-Region read.
  // 4. For each matched rule, emit { ruleId, foods:[a,b], signal, copy }
  //    where signal ∈ {good, warn, action, info, neutral} per Maren-approved per-rule
  //    assignment (see §Maren-approved per-rule copy below).
  // 5. Also consult chem.antiNutrients for foods in the window; emit "Variety nudge"-class
  //    entries when ≥5/7-day same-flag concentration appears (gates align with V-M-48 tile).
  // 6. Return { combos: [{ruleId, foods, signal, copy}, ...] }.
}
```

**`qaAnswerMealCombo` shape (V-M-49 — corrected to match `qaRenderAnswer` contract at `intelligence-qa.js:1684–1742`):**

```js
function qaAnswerMealCombo(intentId) {
  const data = computeMealCombos(today());
  if (!data.combos.length) return { /* no-match shape */ dataGap: true };
  return {
    icon: 'food', domain: 'sage',
    title: "Today's combos",
    headline: `${data.combos.length} pairing tip${data.combos.length>1?'s':''} for today`,
    sections: [{
      label: 'Pairings', icon: 'food',
      items: data.combos.map(c => ({
        signal: c.signal,        // 'good' | 'warn' | 'action' | 'info' | 'neutral'
        icon: signalIcon(c.signal),
        text: escHtml(c.copy)    // HR-4
      }))
    }],
    actions: [],
    confidence: 'high'
  };
}
```

**HR-4 hard:** every food string + every rule body + every `chem.*` value through `escHtml` at the render boundary. Model on `qaAnswerFoodSafety` (`:2225–~2295`) for shape parity.

**Maren-approved per-rule copy (V-M-49 — locked in this spec):**

| Rule ID | Foods (rule.foods) | Signal | Copy |
|---------|-------------------|--------|------|
| 1 | iron + calcium | `info` | "Space these by 2 hours when you can — calcium can reduce iron absorption." |
| 2 | iron + vitamin c | `good` | "Great pairing — Vit C boosts iron absorption up to 3×." |
| 3 | iron + tea | `action` | "Tea blocks iron — never serve tea to babies." |
| 4 | fat + vitamin a | `good` | "Ghee or coconut oil helps absorb Vit A from carrot/sweet potato/pumpkin." |
| 5 | probiotic + prebiotic | `good` | "Curd with banana or oats feeds healthy gut bacteria." |
| 6 | banana + constipation | `info` | "If Ziva is constipated, swap banana for pear, papaya, or prune today." |

**No rule may carry `warn` signal** — too-broad escalation. Use `info` for spacing-tips, `good` for boosts, `action` only for the never-serve-tea case.

**That trio is the minimum.** Three files touched (isl + qa + qa-handlers) + the `computeMealCombos` data fn in cards = ~150–200 LOC added (re-baseline; V-K-56 watch-item applies). Retires Group A/B/C from scout #1's dead-data inventory.

## Upgrade roadmap — full ranked list (Wave 2 corrected)

| # | Name | Scope | Why | Effort | Preconditions | Phase-3 relation | Spec phase |
|---|------|-------|-----|--------|---------------|------------------|------------|
| 1 | Extend `_islDietData` with `chemRollup` (3 fields) | `intelligence-isl.js:446–499` | Keystone — one accessor surfaces `chem.*` to every downstream | M | none | **yes** | **B-1** |
| 2 | Add `meal_combo_check` intent | `intelligence-qa.js:69, :1643` | Combo intelligence surface | M | #1 | **yes** | **B-1** |
| 3 | Implement `qaAnswerMealCombo` + `computeMealCombos` data fn | `intelligence-qa-handlers.js` between `:2395`/`:2396`; `intelligence-cards.js` (data fn after `:2020`) | Required for #2; data-fn separation enables Arc A chip-stack reuse | M | #1, #2 | **yes** | **B-1** |
| 4 | Add `renderInfoChemVariety` + `renderInfoVarietyNudge` cards | `intelligence-cards.js` after `:2020` (V-K — corrects "after `:1885`" to "after the function ends") | Surfaces `chem.fibre`+`chem.bioactives` rollup + the Variety nudge tile (V-M-48 — Maren-drafted copy locked) | M | #1; `fibreDistribution` field ship in B-2 | **yes** | **B-2** |
| 5 | Promote `chem.antiNutrients` to UIB warnings | `intelligence-qa.js:822` `_iqGetWarnings` | UIB already builds warnings; antiNutrients is a free signal | S | #1 | **yes** | **B-2** |
| ~~6~~ | ~~Wire `qaAnswerFavoriteFoods` handler~~ | — | **RETIRED V-K-49 — already wired at `intelligence-quicklog.js:1322`** | — | — | — | — |
| ~~7~~ | ~~Wire `qaAnswerPredictionAccuracy` handler — or de-register intent~~ | — | **RETIRED V-K-49 — already wired at `intelligence-quicklog.js:1290`** | — | — | — | — |
| 8 | Extend `resolveTimeQuery` with `last/this Tuesday` + `N weeks ago` | `intelligence-isl.js:242–376` | Closes most-asked temporal gap | M | none | partial | **B-3** |
| 9 | Relocate `_qaUpdateSuggestions` + `QA_SUGGEST_POOL` + `_qaDetectDomain` → `intelligence-qa.js` (~172 LOC, V-K-51) | `intelligence-isl.js:36–113, 115–198, 890–899` | Hygiene: QA plumbing out of pure-data layer | S | none | no | **B-4** |
| 10 | Relocate `renderInfoAdoption` → `intelligence-cards.js` (~30 LOC) | `intelligence-qa-handlers.js:3409` | Joins `renderInfo*` siblings | S | none | no | **B-4** |
| ~~11~~ | ~~Cache invalidation hook on chem-data mutation~~ | — | **DROPPED V-K-55 — `_islMarkDirty('diet')` already covers `chemRollup`; `NUTRITION` is const-bound** | — | — | — | — |
| 12 | Cross-link `qaAnswerMealCombo` from `food_safe` + `food_nutrient` | `intelligence-qa-handlers.js` | Richer answers via cross-referenced `COMBO_RULES` | L | #1, #2, #3 | **yes** | Later (post-B-4) |
| 13 | **NEW: Silent-catch `console.error` (Wave 2 convergence)** | `intelligence-qa.js:1670–1672` | Future-regression visibility for genuine handler bugs | XS | none | no | **B-3** |

## Region boundary declarations

| File | Governor jurisdiction | Phase(s) | Expected change size |
|------|----------------------|----------|----------------------|
| `split/intelligence-isl.js` | Kael | B-1 (chemRollup), B-3 (temporal parser ext), B-4 (relocations out) | medium total |
| `split/intelligence-qa.js` | Kael | B-1 (intent reg + dispatch), B-2 (UIB warnings), B-3 (console.error), B-4 (recv relocations) | medium total |
| `split/intelligence-qa-handlers.js` | Kael | B-1 (handler impl), B-4 (send `renderInfoAdoption`) | medium |
| `split/intelligence-cards.js` | Kael | B-1 (`computeMealCombos` data fn), B-2 (chem cards), B-4 (recv `renderInfoAdoption`) | medium |
| `split/intelligence-illness.js` + `split/medical.js` | shared (Maren+Kael) | B-1 cross-Region read | small (read-only consumption via tri-resolution state-match path) |
| `split/data.js` | shared | none (consumer only) | — |
| `split/core.js` | Kael | none expected | — |

**Cross-Region consult.** Phase B-1's `qaAnswerMealCombo` / `computeMealCombos` produces output consumed in Care-jurisdiction surfaces (Diet `[Today]` chips). Maren cross-consult complete in Wave 2 — answer-card schema corrected (V-M-49), per-rule copy locked, tri-resolution state-match path specced for rule #6.

## HR pre-check (Wave 2 corrected)

| HR | Predicted risk | Mitigation |
|----|----------------|-----------|
| HR-1 (no emojis) | low | Handler uses `zi(*)` only. Variety nudge tile icon-banned `zi('warn')`/`zi('siren')` per V-M-48. |
| HR-2 (no inline styles) | low | Cards use existing token system. |
| HR-3 (no inline handlers) | low | Chip dismissal via `data-action`. |
| HR-4 (escHtml at render boundaries) | medium | Handler renders `chem.*` strings + food strings + COMBO_RULES bodies. **Variety nudge tile renders `chemRollup.antiNutrientFlags` strings + advisory copy — all through escHtml (C-REC-1).** |
| HR-5 (tokens-only) | low | — |
| HR-6 (data-action) | low | — but pre-existing HR-6 latent flagged at `_qaUpdateSuggestions:180–192` (uses `addEventListener`); file as follow-up issue. |
| HR-7 (zi via innerHTML) | low | — |
| HR-8 (Coming-soon stubs) | n/a | CareTickets stubs at `:1868–1873` pre-existing HR-8 compliant. |
| HR-9 (post-build QA) | structural | Per-phase canon-cc-008 chain. |
| HR-10 (no text-overflow ellipsis) | low | — |
| HR-11 (Math.floor currency) | n/a | — |
| **HR-12 (timezone-safe dates) — split per C-REQ-2** | **B-1: low / B-3: medium** | **B-1:** window math via existing `resolveTimeQuery`; no new date construction. **B-3:** `last Tuesday` + `N weeks ago` parser is **net-new date construction** in `intelligence-isl.js`. Every `new Date()` and date-arithmetic boundary must go through `toDateStr` / equivalent timezone-safe pattern; regression-guard `regression-guard-b3-temporal-tuesday-timezone-safe`. |

## Governor-readiness — Wave 2 audit results

**Kael (Intelligence) — primary audit, V-K-49 through V-K-57 issued, verdict: yes-with-fixes.**
- V-K-49 (BLOCKER): pre-alpha intents are wired — **retired roadmap rows 6–7 above**.
- V-K-50: `calcZivaScore` cache claim corrected in Arc A.
- V-K-51: B-4 scope includes `QA_SUGGEST_POOL` — **~172 LOC moved as unit**.
- V-K-52: console.error addition — **NEW roadmap row 13 in B-3**.
- V-K-53: `COMBO_RULES` tri-resolution **specced in B-1.3 architecture above**.
- V-K-54: `_baseFoodName` named explicitly in B-1.1.
- V-K-55: roadmap row 11 dropped.
- V-K-56: 30K Region breach surfaced — watch-item; `intelligence-cards.js` is the natural sub-split target if pressure escalates.
- V-K-57: CLAUDE.md drift fix endorsed for separate tiny PR.

**Maren (Care) — cross-consult, V-M-47 through V-M-54 relevant findings folded:**
- V-M-48: Variety nudge label + copy + condition + icon-ban locked in §B-1.1 ship + Arc A `[Score]` per-segment.
- V-M-49: `qaAnswerMealCombo` schema corrected (sections[] + signal); `computeMealCombos(date)` data-fn separation introduced; per-rule copy locked (6 rows above).
- V-M-54: "zero `if(true)return;`" claim scoped to the 7 intelligence-* files (Maren swept and found 9 across codebase total: 1 in core.js, 3 in diet.js Phase 4 deletes, 5 in home.js).

**Cipher (Censor) — pass-with-fixes; arc-pair shape certified.** 3 required fixes folded; 6 recommended fixes folded. 11 regression-guard names provided.

**Aurelius (Chronicler) — chronicling-ready; 4 marginal amendments folded.** Codex Memory.md candidates noted post-ratify per Chronicler discretion: (1) Province briefings carry implicit as-of timestamps (CLAUDE.md drift canon); (2) cross-arc dependency triggers arc-pair ratification (procedural canon); (3) presentation-data-infra cascade work-shape (lore).

## PR sequence (Phases B-0 → B-4)

| Phase | Name | Scope | Branch | Jurisdiction | Diff size | QA chain |
|-------|------|-------|--------|--------------|-----------|----------|
| **B-0** | **Spec (this PR)** | This document + Arc A spec + journal. | `claude/sproutlab-diet-rework-p0` (shared with Arc A) | docs-only | small | Wave 2 complete. Architect ratification pending. |
| B-1 | Keystone trio | `chemRollup` (3 fields) + `meal_combo_check` intent + `qaAnswerMealCombo` handler + `computeMealCombos` data fn | `claude/sproutlab-isl-upgrade-p1` | Kael (4 files); Maren cross-consult on copy/schema (locked above) | medium (~150–200 LOC) | Kael Mode-1 → Lyra synth → Cipher. |
| B-2 | Chem-variety cards + UIB antiNutrient warnings | `renderInfoChemVariety` + `renderInfoVarietyNudge` cards (after `intelligence-cards.js:~2020`); `_iqGetWarnings` antiNutrients; defer-fields `fibreDistribution` + `bioactiveTopFive` added to `chemRollup` if needed | `claude/sproutlab-isl-upgrade-p2` | Kael; Maren cross-consult on phrasing | small–medium | Kael Mode-1 + Maren cross-consult → synth → Cipher. |
| B-3 | Temporal parser ext + silent-catch console.error | `resolveTimeQuery` += `last Tuesday` + `N weeks ago` (HR-12 medium); `console.error` in `intelligence-qa.js:1670–1672` | `claude/sproutlab-isl-upgrade-p3` | Kael | small | Kael Mode-1 → synth → Cipher. **(Scope-collapsed from original B-3 per V-K-49 — pre-alpha intent rows retired.)** |
| B-4 | Boundary cleanup (hygiene) | Relocate `_qaUpdateSuggestions` + `QA_SUGGEST_POOL` + `_qaDetectDomain` → qa (~172 LOC); `renderInfoAdoption` → cards (~30 LOC). | `claude/sproutlab-isl-upgrade-p4` | Kael | small (~200 LOC moved, concat-order safe) | Kael Mode-1 → synth → Cipher. |

**Dependency on Arc A.** Arc A Phase 3 depends on Arc B Phase B-1. Arc A Phases 1, 2, 4, 5, 6 are independent.

**Regression-guard names (from Cipher Edict V + Wave 2 additions, locked):**
- B-1: `regression-guard-chemrollup-contract`, `regression-guard-meal-combo-intent-registered`, `regression-guard-combo-tri-resolution` (V-K-53 — confirms tri-resolution catches rule #6).
- B-2: `regression-guard-chem-card-tokens`, `regression-guard-variety-nudge-icon-ban` (V-M-48 — confirms no warn/siren icons).
- B-3: `regression-guard-temporal-tuesday-timezone-safe` (HR-12), `regression-guard-qa-dispatch-console-error` (V-K-52 — confirms catch logs to console).
- B-4: `regression-guard-concat-order-stable` (all relocated symbols resolve under post-move concat order).

**CLAUDE.md drift fix** — separate tiny docs-only PR. Single-line correction: "ISL: 22 intents with dedicated handlers" → "Smart Q&A: 30 intents (registry in `intelligence-qa.js`); ISL: temporal query parser + 6 domain-data accessors + day/range summary generators."

## Open questions — Wave 2 resolutions

1. **`chemRollup` naming and shape.** Resolved — **`chemRollup`** name; ship 3 fields in B-1 (`fibreDaysHigh`, `bioactiveCount`, `antiNutrientFlags`); defer 2 (`fibreDistribution`, `bioactiveTopFive`) to B-2 per YAGNI.
2. **`prediction_accuracy` intent.** **RETIRED — V-K-49.** Already wired and shipping.
3. **Silent catch behavior.** Resolved — **add `console.error`** in B-3 (Cipher + Kael + Maren convergence). No external observability hook.
4. **`_FOOD_ALIASES` discipline in `chemRollup`.** Resolved — silent dedupe + first-encounter `console.warn` for unaliased synonym pairs. The almond/almonds, fig/anjeer etc. flags from scout #1 are `data.js` hygiene findings, fixed there separately.
5. **Filing-cabinet relocations PR shape.** Resolved — **single B-4 PR** (Kael endorse). Three mechanical moves; `renderInfoAdoption` at ~30 LOC could split if needed.
6. **CLAUDE.md drift fix scope.** Resolved — **separate tiny PR** post-ratify (Cipher endorse).

## Synthesis amendments

### Wave 1.5 sources
- scribe-scout #2 — capability map, ranked candidates, sequencing recommendation (with the methodology error V-K-49 corrected).
- scribe-scout #1 — food-DB schema survey (`NUTRITION.chem`, `COMBO_RULES` dead-data, food-DB count discrepancy, latent oddities).
- scribe-record — journal infrastructure + the pattern observation that Arc B is the substrate Arc A's Phase 3 stands on.

### Wave 2 amendments
**Blocker fixes folded (V-K-49):** roadmap rows 6 & 7 retired; dormant-inventory rows 1 & 2 corrected; B-3 scope collapsed.
**Schema corrections folded (V-M-49):** `qaAnswerMealCombo` shape aligned to `qaRenderAnswer` contract; `computeMealCombos(date)` data-fn separation introduced; 6-rule Maren-approved copy table locked.
**Tri-resolution folded (V-K-53):** `COMBO_RULES` handler dispatches on nutrient-tag OR `_baseFoodName` OR active-episode state. Rule #6 (`banana` + `constipation`) covered.
**Scope corrections folded (C-REQ-3, V-K-51):** Out-of-scope explicit on Diet-side surfaces; B-4 LOC re-stated to include `QA_SUGGEST_POOL`.
**HR-12 row split (C-REQ-2):** B-1 low / B-3 medium.
**Roadmap pruned (V-K-55):** row 11 dropped; row 13 added (console.error).
**LOC re-baseline (V-K-56):** `intelligence-cards.js` 2,403 → 2,643; Region at 30,725 surfaced as watch-item.
**`_baseFoodName` named explicitly (V-K-54).**
**B-1 dispatch line corrected (`:1642` → `:1643`).**
**B-2 insert point clarified ("after `:1885`" → "after the function ends ~`:2020`").**
**"Zero `if(true)return;`" claim scoped to intelligence-* (V-M-54).**

## Wave 2.5 refinement — V-M-49 cross-Region read line-level lock

**Trigger:** Architect-directed refinement (2026-05-23 session). V-M-49 was specced at the *schema + per-rule copy + tri-resolution architecture* level in Wave 2 but the **cross-Region read** for rule #6's state-match (`banana` + `constipation`) was left at "consult intelligence-illness.js active episodes + recent poop consistency. Cross-Region read." That sentence has two corrections to make and one architectural clarification to lock.

### Correction 1 — `constipation` lives in medical.js, NOT intelligence-illness.js

Pre-refinement spec text (B-1.3 architecture, line 165): *"State-match: rule.foods[i] in {constipation, fever, diarrhoea, ...} -> consult intelligence-illness.js active episodes + recent poop consistency (catches rule #6: constipation). Cross-Region read."*

**Correction:** `intelligence-illness.js` carries fever, diarrhoea, vomiting, and cold episode state machines (`getActiveFeverEpisode()` at `:9`, `getActiveDiarrhoeaEpisode()` at `:830`, `getActiveVomitingEpisode()` at `:1437`, `getActiveColdEpisode()` at `:1737`). It does NOT carry a constipation episode — there is no `getActiveConstipationEpisode()`.

**Constipation is detected via stool-shape signals in `medical.js`** at `computePoopAmountTrend(windowDays)` (`medical.js:6852`). The function returns `.constipationSignal: boolean` computed as: any poop entry in the window with `amount === 'small' && (consistency === 'hard' || consistency === 'pellets')` (`medical.js:6903`).

**Jurisdictional correction:** `intelligence-illness.js` is Kael's jurisdiction; `medical.js` is **Maren's jurisdiction**. The state-match read for `constipation` is a cross-Region read into **Maren's** territory, not Kael's. This is a stronger jurisdictional crossing than the original spec implied.

### Lock — Exact API surface for state-match per rule

`computeMealCombos(date)` state-match dispatch by token:

| State token | Active-state accessor | File:line | Jurisdiction | Active-state predicate |
|-------------|----------------------|-----------|--------------|------------------------|
| `'fever'` | `getActiveFeverEpisode()` | `intelligence-illness.js:9` | Kael | `!== null` |
| `'diarrhoea'` | `getActiveDiarrhoeaEpisode()` | `intelligence-illness.js:830` | Kael | `!== null` |
| `'vomiting'` | `getActiveVomitingEpisode()` | `intelligence-illness.js:1437` | Kael | `!== null` |
| `'cold'` | `getActiveColdEpisode()` | `intelligence-illness.js:1737` | Kael | `!== null` |
| `'constipation'` | `computePoopAmountTrend(3).constipationSignal` | `medical.js:6852` | **Maren** | `=== true` |

**Window argument for constipation:** `windowDays=3`. Rationale: matches Phase 4 §`intelligence-illness.js` improvement-detection window (which uses last-3-stools heuristics — line 969). Three days is the standard SproutLab constipation-evaluation window; longer windows risk surfacing stale signal, shorter risk under-coverage.

**Default for tokens not in the table:** the state-match dispatcher returns `false` (no match) and logs a `console.warn` naming the unrecognized state token. New tokens added to `COMBO_RULES` rule definitions must be added to this table as part of the same PR (regression-guarded — see below).

### Lock — Cross-Region read jurisdictional discipline

Because `computeMealCombos(date)` lives in `intelligence-cards.js` (post-canon-gen-001: **Vela's jurisdiction**) but reads from:
- `intelligence-illness.js` (Kael's jurisdiction) for fever/diarrhoea/vomiting/cold tokens
- `medical.js` (Maren's jurisdiction) for the constipation token
- `data.js` (Kael's jurisdiction) for `NUTRITION`, `COMBO_RULES`, `_FOOD_ALIASES`
- `intelligence-isl.js` (Kael's jurisdiction) for `getDomainData('diet', ...)` and `_baseFoodName()`

…Phase B-1's PR triggers **all three Governors** in the canon-cc-008 audit chain:
- **Maren** for the `medical.js` constipation read (a Care-Region accessor consumed by a Surfacing-Region data fn)
- **Kael** for the `intelligence-illness.js` / `data.js` / `intelligence-isl.js` reads and the data-fn correctness
- **Vela** for the `intelligence-cards.js` data-fn placement and the chip-stack render contract

This is the **first Phase since canon-gen-001 to summon all three Governors in parallel for a non-shared-module diff**. Setting the precedent: cross-Region reads from a Vela-jurisdiction file route to all relevant Governors based on the target Regions of the reads.

### Lock — Render contract for state-match findings in chip-stack

The `computeMealCombos(date)` return shape for state-match findings (already specced at line 167–172) is `{ ruleId, foods:[a,b], signal, copy }`. The shape is **identical to tag-match and name-match findings** — the chip-stack consumer does not know or care which resolution path produced the entry. The state-match path is invisible at render time.

This is intentional. The parent sees "If Ziva is constipated, swap banana for pear, papaya, or prune today." (rule #6 copy) regardless of whether constipation was detected via state-match or — in some future enhancement — via direct parent log entry of "constipation" as a symptom.

**Chip-stack render layer (Vela's jurisdiction):** the per-chip render in `intelligence-cards.js` chip-stack and in the `qaAnswerMealCombo` UIB renderer is shape-uniform. Vela audits whether the rendered chip communicates the rule's tone correctly — `info` signal (rule #6 is info-signal per Maren-approved table) renders with `zi('bulb')` or `zi('info')`, NOT `zi('warn')`. This parallels the V-M-48 Variety nudge icon-ban (no `zi('warn')`/`zi('siren')` on info-signal tiles).

### Lock — Caching / staleness

`computeMealCombos(date)` is called fresh on:
- Each chip-stack render trigger (post-meal-save in `[Today]` segment).
- Each `qaAnswerMealCombo` invocation (UIB answer-card for `meal_combo_check` intent).

No cache is held. Constipation signal staleness is bounded by the freshness of the underlying `_piGetPoops(3)` window (which is recomputed on each call). No `_islMarkDirty('diet')` / `_islMarkDirty('medical')` coordination is needed because there is no cache to invalidate.

**Performance note:** `computePoopAmountTrend(3)` walks the last 3 days of poop entries. For Ziva's current data shape (~2–4 poops/day = 6–12 entries), the walk is O(n) trivial. For future-Ziva at 12+ months with more entries, the window is still bounded. No optimization needed.

### Lock — Rule #6 copy disambiguation (cross-check with Maren-approved table)

The Maren-approved per-rule copy table at line 202–211 lists rule #6 as: *"If Ziva is constipated, swap banana for pear, papaya, or prune today."*

**Refinement:** the copy fires only when `state-match: constipation === true`. If the parent logs banana when constipation is NOT detected (i.e., recent poops are normal or soft), rule #6 does NOT fire and no chip surfaces. This is the correct Maren-tier behavior: don't surface constipation guidance when there is no constipation signal — that would be over-warning.

**Wave 2.5 amendment to the copy:** verify that the rendered copy is conditional on the active state, not a static "if constipated" framing. The current copy ("If Ziva is constipated…") reads as static and could surface confusingly when constipation IS active (parent reads "if" and thinks "this is just a generic note, not a current signal"). 

**Alternative copy (Maren-deferred decision):** *"Ziva's recent poops show a constipation signal. Swap banana for pear, papaya, or prune today."* — names the active signal directly. More accurate.

OR retain the conditional copy as Maren originally approved, accepting the small ambiguity.

**Resolution:** retain the Maren-approved copy from Wave 2 as the v1 ship. Open a Maren-tier follow-up for v2 to consider the active-signal-naming alternative. This is a phrasing call, not a load-bearing semantic.

### Regression guards (additions to B-1 set)

- `regression-guard-combo-tri-resolution` (already on the list — locked).
- `regression-guard-state-match-token-table-complete` (NEW V-M-49 refinement): every state token used in `COMBO_RULES` definitions has an entry in the state-match dispatch table.
- `regression-guard-constipation-state-match-medical-read` (NEW V-M-49 refinement): the constipation state-match correctly reads `computePoopAmountTrend(3).constipationSignal` from `medical.js`, NOT from `intelligence-illness.js` (which has no constipation episode).
- `regression-guard-state-match-render-shape-uniform` (NEW V-M-49 refinement): state-match return entries share `{ ruleId, foods, signal, copy }` shape with tag-match and name-match — chip-stack consumer is resolution-agnostic.
- `regression-guard-rule-6-suppression-when-no-constipation` (NEW V-M-49 refinement): rule #6 does NOT fire when constipationSignal is false (suppression discipline).

### Cross-spec coordination

**Arc D dependency:** Phase B-1 summons all three Governors per the cross-Region read discipline above. Arc D must ratify first so Vela is seated and CLAUDE.md routing rules are live.

**Arc C dependency:** Phase B-1's `chemRollup` reads `NUTRITION[base].chem.*` directly. Arc C Phase C-4 renames `chem.fibre` → `chem.fibreCharacter`. If B-1 ships AFTER C-4, the chemRollup field reads `NUTRITION[base].chem.fibreCharacter`. If B-1 ships BEFORE C-4 (not recommended per Arc C sequencing — "spec now, ship before B-1"), B-1's chemRollup uses the old `chem.fibre` name and gets renamed in C-4's sweep. Recommended sequence: Arc D → Arc C Phase C-1 + C-2 + C-4 → Arc B Phase B-1.

**No conflict with V-M-50.** V-M-50's chip operates pre-meal-save (during meal-input typing in `home.js`). V-M-49's chip-stack operates post-meal-save (in `[Today]` segment via `computeMealCombos(date)`). Distinct temporal windows; distinct files; no overlap.

## Wave 2.5 amendments — verdict

- V-M-49: LOCKED. State-match cross-Region read corrected from intelligence-illness.js → medical.js for the constipation token. Cross-Region read jurisdictional discipline (three-Governor parallel summoning for B-1's PR) ratified. Render-shape uniformity locked. Caching/staleness locked (no cache needed). Rule #6 suppression discipline named.
- Phase B-1 implementation may proceed against V-M-49 with no further open questions.
- Phase B-1 audit chain summons Maren + Kael + Vela in parallel — the first non-shared-module diff to do so since canon-gen-001.

---

— Lyra (main-session Wave 1.5 + Wave 2 synthesis from scribe-scout #2 + Maren/Kael/Cipher/Aurelius Mode-1 audits + Wave 2.5 V-M-49 refinement), 2026-05-23, against `616071c`. cc-018 status: `ratified` (Architect signature 2026-05-23 — Wave 2 + Wave 2.5 spec enters implementation phase; per-phase Kael Mode-1 audits + Maren/Vela cross-consult run at each ship PR per the PR sequence table above).
