# Spec: Diet Tab Rework v1

**Version:** v1.0 draft (Mode-1 + Wave 1.5 + Wave 2 main-session synthesis)
**Date:** 2026-05-23
**Authors:**
- Lyra (Mode-1 subagent) — primary spec body (Wave 1)
- Lyra (main-session synthesis) — Wave 1.5 amendments folding scribe-scout #1 (food DB) + #2 (ISL capability map) findings
- Lyra (main-session synthesis) — Wave 2 amendments folding Maren / Kael / Cipher / Aurelius Mode-1 audits

**Authority chain:** `CLAUDE.md` §QA Chain · canon-cc-008 · canon-cc-022 · cc-018 `pending_review`
**Against commit:** `b2670f7`
**Cross-references:** `docs/specs/isl-upgrade-v1.md` (Arc B — Phase 3 of this spec depends on Arc B's keystone trio)

## Status

`pending_review` (cc-018). Prerequisites for `ratified`:

- Architect ratification of IA pattern A, the Wave-1.5 fold-in, the Wave-2 amendments, and the two-spec arc-pair strategy.
- Maren Mode-1 audit — **complete** (V-M-47 through V-M-54 issued; verdict: yes-with-fixes; fixes folded below).
- Kael Mode-1 audit — **complete** (V-K-49 through V-K-57 issued; verdict: yes-with-fixes; fixes folded below).
- Cipher Mode-1 Edict V pre-pass — **complete** (verdict: pass-with-fixes; fixes folded below).
- Aurelius cross-cluster chronicling — **complete** (verdict: chronicling-ready; amendments folded; Codex Memory.md candidates per Chronicler's discretion post-ratify).

**Companion-set deploy delta — paired ratification.** This spec and `isl-upgrade-v1.md` form a single arc-pair artifact under cc-018. Ratifying one without the other constitutes a canon-cc-008 short-circuit unless the Architect explicitly defers one — in which case Arc A Phase 3 must be deferred until Arc B Phase B-1 ratifies separately.

## Why

The Diet sub-tab under TRACK does four jobs in one vertical scroll, and the IA pattern is monolithic-single-scroll where it should be sub-tabbed.

- **Job 1 — analytics.** Hero score `renderDomainHero('diet')` defined at `diet.js:2702–2764`, invoked from `home.js:2650`; 5 stat tiles via `renderDietStats` at `home.js:2595–2649`; 2×2 sub-score grid emitted as `.dsh-comp-pill` row inside `renderDomainHero` at `diet.js:2746–2760`.
- **Job 2 — logging.** Today's Meals card, `template.html:795–846`, four meal sub-cards with autocomplete inputs and `dqp-zone` history-chip walls.
- **Job 3 — decision-support.** Can I Give This? `template.html:850–862`; Recent Checks `renderComboHistory` `diet.js:890–903`; Insights & Tips `renderTips` `diet.js:905–1014` rendering 15 active Avoid / Good-to-Know / Add-to-Diet items behind three collapsed accordions.
- **Job 4 — reference.** Foods Introduced grid + quick-add form, `template.html:868–890`.

Three pathologies follow from the monolith: (a) triple analytics stack at top competes for primacy before the parent can act — the logging-first user lands on a 73 score when they came to log breakfast; (b) each meal card carries a `dqp-zone` stacking up to **10 chips** in 2–4 rows under each meal × 4 meals = a wall of food names; (c) the highest-value analytical surface — Insights & Tips, 15 active items — is buried at the bottom behind three collapsed accordions. The failure mode is **job-mixing in a single scroll** — fix it by routing by job.

**Wave 1.5 substrate finding.** The food DB (`NUTRITION` at `data.js:2228–2402`) has new fields — the `chem` sub-object (`fibre`, `antiNutrients`, `bioactives`) — and a full `COMBO_RULES` table (`data.js:2463–2476`) that have **zero outside-`data.js` references**. They are present but unsurfaced. The intelligence layer is the only place they can be surfaced — and ISL's diet accessor (`_islDietData` at `intelligence-isl.js:446–499`) does not yet expose them. **Phase 3 of this spec depends on Arc B (ISL Upgrade) landing the substrate first.**

**Wave 2 Care-tier finding (V-M-50).** Tracing the current meal-input flow — `onMealInput` (`home.js:3568`) → `showMealDropdown` (`:3614`) → `updateMealInsight` (`:3387`) → `getMealInsight` (`:3282`) — **none of these paths consult `AGE_RULES` or `ALLERGENS`**. The dropdown surfaces raw `FOOD_SUGGESTIONS` with zero age/allergen filtering. The reads I originally cited in Phase 3 fold-in live inside `analyzeFoodSafety`, which fires ONLY for the explicit "Can I Give This?" query — NOT for the meal-input typing flow. This is a Care-tier gap that pre-dates this rework, and Phase 2 is the right place to close it (lifted from Phase 3 — see PR sequence).

## Scope

**In scope.** Sub-segment IA inside the Diet sub-tab of TRACK; per-segment content specs; meal-card history-chip compression; segment router contract; sticky-state contract with safety override; Phase 0–6 PR sequence; HR pre-check; Governor-readiness asks. Phase 3 consumes Arc B outputs (specified by cross-reference).

**Out of scope.** No new data sources beyond the food-DB fields already present. No Care-Region semantic changes — meal-data schema, food DB, reaction tracking, CareTicket linkage all untouched. No new sync surfaces. No changes to the TRACK top-level sub-bar (`renderTrackSubBar` at `core.js:3161–3186`) — the Diet pill there continues to behave as today; new segments live one level below.

**Hard boundary.** This spec changes presentation and information architecture, not safety logic. Allergen / reaction / Can I Give This? semantics remain identical; only their placement and surfacing change. The new `meal_combo_check` ISL intent (specced in Arc B, consumed by `[Today]` in Phase 3 here) introduces NEW decision-support — it does not modify existing safety logic.

## IA pattern declaration

Pattern A: a sub-segment pill row directly under the Diet header inside `#tab-diet` (`template.html:782`), rendering one of four segments below it.

```
[Today]   [Score]   [Insights]   [Library]
```

**Segment content boundaries (locked):**

- **[Today]** — logging-only. Date picker (`#feedingDate`), Diet Intel Banner (`#dietIntelBanner`), four meal cards (`.meal-card.{breakfast|lunch|dinner|snack}`), per-meal compressed `dqp-zone` (see §Meal-card compression), Save. **Phase 2 fold-in (lifted from Phase 3 per V-M-50):** proactive "introduce with care" chip next to the meal-input dropdown when the typed/selected food crosses `AGE_RULES.minMonth` against Ziva's current age, OR appears in `ALLERGENS`. **Phase 3 fold-in:** post-log combo-check chip stack consuming Arc B's `meal_combo_check` data (chip-stack data source: `computeMealCombos(date)` per V-M-49 separation).
- **[Score]** — analytics. Hero score card (`renderDomainHero('diet')`), 2×2 sub-score grid, 5 stat tiles (`#dietStats` via `renderDietStats`), trend strip. **Phase 3 fold-in:** "Fibre Variety" tile + "Bioactive Diversity" tile derived from `chemRollup` (the new field on `_islDietData` specced in Arc B). New tiles render via NEW `renderInfoChemVariety` in `intelligence-cards.js`. Plus the "Variety nudge" tile (V-M-48 — see [Score] sub-spec).
- **[Insights]** — decision-support. Can I Give This? + Recent Checks (`renderComboHistory`) + Insights & Tips (`renderTips`) with the three category accordions **rendered inline, expanded by default**. The 15-active-item surface lands on segment open, not behind chevrons. **Plus Tomorrow Prep (Open Q 6 resolved per Wave 2 — Cipher + Maren concur).** Decision-support belongs here.
- **[Library]** — reference. Foods Introduced 6-card grid, group-drill view, per-food detail overlay (Phase 3 fold-in: "Chemistry" sub-tab exposing `chem.fibre` / `chem.antiNutrients` / `chem.bioactives`), quick-add form retained (Open Q 4 resolved per V-M from Maren — KEEP both surfaces until per-meal save grows a reaction-marking step).

**Segment router contract:**

- Data-action-driven per HR-3. Pill click fires `data-action="switchDietSegment"` with `data-arg` ∈ `{today, score, insights, library}`. Dispatcher branch in `core.js`'s existing action delegator (sister to `switchTrackSub` at `core.js:3136`).
- Segment state stored in `localStorage` under key **`ziva_diet_segment`** — matching the house convention `ziva_*` (sister to `ziva_track_sub` at `core.js:3139`, `ziva_active_tab` at `core.js:1053/3077`).
- Segment change re-renders the **segment body only**. **Critical contract (V-K-50):** `renderDietSegment(key)` must NOT call `renderTrackSubBar` — `calcZivaScore()` is NOT cached (verified at `core.js:1926–1979`) and is recomputed on every `renderTrackSubBar` call; segment-switching is sub-Diet, not Track-level, and must not trigger the upstream re-compute. Phase 6 adds a regression-guard asserting this non-coupling.

**Critical structural finding (scout #2).** **There is no `renderDiet()` orchestrator today.** `switchTrackSub('diet')` at `core.js:3153` calls only `renderDietStats()`. Per-segment lazy rendering requires inventing a `renderDietSegment(segmentKey)` dispatcher in Phase 1. State field `_dietActiveSegment` mirrors the `_activeTrackSub` pattern (per Kael's Q4 confirmation).

**Sticky-state contract:**

- Write `ziva_diet_segment` on every segment change.
- Read on Diet sub-tab mount (inside `switchTrackSub(sub)` when `sub === 'diet'`).
- Fallback to `today` if absent, malformed, or not in the enum. Logging-first cold-start is non-negotiable.
- **Safety override — REVISED per V-M-47.** `renderDietIntelBanner` (`home.js:3831–3962`) populates **both safety signals (illness episodes + 3-day reaction window) AND positive synergy suggestions** (`:3907–3958` — "Breakfast ideas from Ziva's favorites"). A naive `banner-non-empty` override force-routes on positive nudges too, which is wrong. **Override fires only on the safety subset.** Phase 1 refactors `renderDietIntelBanner` to expose a `hasSafetySignal()` predicate that returns true iff an active illness episode OR the 3-day reaction window has content (NOT when only synergy suggestions exist). The segment-router consults `hasSafetySignal()` for the override. Alternative shape: split rendering into `renderDietSafetyBanner` + `renderDietSynergyBanner` and key the override off the safety renderer's output.

**Segment-pill component contract:**

- Reuse `.track-sub-btn` styling (`styles.css:4930–4947`) at a derived class `.diet-seg-btn`. Sub-level mark: no `tsb-score` numeric slot, denser.
- **Sticky positioning:** inline-only (per Open Q 2 — no Care concern surfaced; phone-viewport reasoning holds).
- Token-driven per HR-5. Spacing from `--sp-*`; radii from `--r-full`; type from `--fs-sm` / `--fs-xs`.

## Per-segment specs

### `[Today]` — logging segment

**Purpose.** Log today's meals fast, one-handed, with minimum chrome.

**Content.** Date nav, Diet Intel Banner (split per V-M-47), four meal cards with compressed `dqp-zone`, `meal-input` autocomplete dropdown with **proactive age/allergen chip (Phase 2 — V-M-50)**, per-meal insight strip, Save.

**Phase 2 fold-in — "introduce with care" chip (lifted from Phase 3 per V-M-50).**
- Trigger: typed/selected food in the meal-input crosses `AGE_RULES.minMonth` against Ziva's age OR appears in `ALLERGENS`.
- Phrasing: **specific to the rule that fired**, NOT a generic "introduce with care."
  - Example (age): `"Honey: wait until 12 months — risk of infant botulism."` Sourced from `AGE_RULES['honey']` message field if present, fallback constructed from `minMonth`.
  - Example (allergen): `"Peanut: introduce in small amounts, watch 3 days for reaction."` Sourced from `ALLERGENS['peanut']` advisory field.
- Dismissibility: per-food, per-session. **NOT persistent across sessions** — a dismissed honey warning that doesn't return tomorrow is the silent-failure shape Maren guards against (V-M-50).
- HR-4 hard on every rule-message string at render.
- HR-3: `data-action="dismissAgeAllergenChip"` with `data-arg="{food}"`.

**Phase 3 fold-in — `meal_combo_check` post-log chip stack.**
- Chip-stack data source: `computeMealCombos(date)` (NEW pure-data function in `intelligence-cards.js`, per V-M-49 separation of data-fetch from answer-render). Both the chip-stack render in `[Today]` AND `qaAnswerMealCombo` UIB renderer consume this same data function.
- Chip render: small-format pills under the meal-card group. Each chip carries a `data-action="dismissComboTip"` / `data-arg="{ruleId}"`.

**Major changes (Phases 1+2).** (1) Analytics removed from this segment's view. (2) `dqp-zone` compressed from up-to-four-stacked rows to one expandable "Recent" row. (3) `meal-skip-btn` text-link replaced with `zi-skip` icon-toggle. (4) Proactive age/allergen chip added (Phase 2).

**Data sources / state reads.** `feedingData`, `foods`, ISL `dqp` pulls, `renderDietIntelBanner` (split), `AGE_RULES` + `ALLERGENS` (Phase 2 chip — already in `data.js`), `computeMealCombos(date)` (Phase 3 — Arc B).

### `[Score]` — analytics segment

**Purpose.** Show how Ziva's diet is tracking — score, sub-scores, tiles, trend, chemistry-variety.

**Content.** `renderDomainHero('diet')` → 2×2 sub-score grid → `#dietStats` 5-tile grid (ADD — see Open Q 5 resolution) → trend strip.

**Phase 3 fold-in.**
- **"Fibre Variety" tile.** Counts distinct `chem.fibre` categories Ziva consumed in last 7 days. Source: `chemRollup.fibreDaysHigh` (Arc B B-1).
- **"Bioactive Diversity" tile.** Distinct `chem.bioactives` count over 7 days. Source: `chemRollup.bioactiveCount` (Arc B B-1).
- **"Variety nudge" tile (V-M-48 — Maren-drafted, NOT "Anti-Nutrient Watch").**
  - **Tile label:** `"Variety nudge"` (NOT alarm-shaped — "Anti-Nutrient Watch" was renamed at Maren's audit).
  - **Trigger condition:** same `chem.antiNutrients` flag (e.g., phytates) appears ≥5 days in a 7-day window **AND** fibre variety is low (one or two `chem.fibre` categories only). Both gates must fire; either alone is normal Indian-staple eating.
  - **Copy (Maren-approved):** *"This week's iron-rich meals lean heavily on phytate-rich grains and pulses. Soaking, sprouting, or fermenting overnight reduces phytates and improves iron absorption. A serving of vitamin-C fruit (orange, mango, tomato) alongside also helps."*
  - **Icon constraint (HARD):** `zi('bulb')` or `zi('sparkle')` ONLY. **Never** `zi('warn')` or `zi('siren')` on this tile. The signal is variety-tip, not warning.
  - Source: `chemRollup.antiNutrientFlags` + `chemRollup.fibreDistribution` (Arc B — `fibreDistribution` is one of the two fields deferred from B-1 to B-2 per V-K position; if not in B-2, fall back to `fibreDaysHigh` lookup).

**Renderer routing.** New tiles render via NEW functions in `intelligence-cards.js` — `renderInfoChemVariety` (for Fibre Variety + Bioactive Diversity) and `renderInfoVarietyNudge` (for the Variety nudge). Both consume `chemRollup` via `getDomainData('diet', ...)`.

**Open Q 5 resolution (Wave 2 — Kael + Maren concur):** stat-tile duplication → **ADD with re-flow** (5 → 7 tiles, plus the conditional Variety nudge). Don't displace tiles a parent has learned to read. The new tiles surface new data classes (`chem.*`), not duplicates.

**Data sources / state reads.** `calcZivaScore()` (NOT cached — recomputed per `renderTrackSubBar` per V-K-50), `getZivaScoreTrend7d()`, `renderDietStats` source data, `chemRollup` (Arc B).

### `[Insights]` — decision-support segment

**Purpose.** Answer "Can I give this?" and surface what the data is saying.

**Content.** Can I Give This? + Recent Checks (`renderComboHistory`, promoted next to Can I Give This?) + Insights & Tips (`renderTips` with three sections **rendered inline, expanded by default** — Avoid / Good to Know / Add to Diet) **+ Tomorrow Prep** (per Open Q 6 resolution — Cipher + Maren concur: Tomorrow Prep is decision-support, not logging; belongs here).

**Major changes.** (1) The 15-active-item Insights & Tips surface lands on segment open. (2) Three category accordions → inline sections. (3) Recent Checks promoted next to Can I Give This?. (4) Tomorrow Prep lifted into this segment.

**Data sources / state reads.** `comboHistory` (localStorage key `ziva_combo_history`, `COMBO_HISTORY_KEY` per `diet.js:378,380,614`), `renderTips` / `generateDos` / `generateDonts`, `renderTomorrowPrep` (`diet.js:2157`).

### `[Library]` — reference segment

**Purpose.** What has Ziva tried, by group; per-food chemistry; quick-add a new food.

**Content.** Foods Introduced 6-card grid (`#foodsGrid`, `renderFoods` at `home.js:2947+`), drill-into-group expanded view, **per-food detail overlay** (NEW — Phase 3 fold-in), **quick-add form retained** (Open Q 4 resolution — Maren ruling: KEEP both surfaces because the reaction `bad`/`mild`/`watch`/`ok` toggle is Care-Region data backbone; per-meal autocomplete doesn't yet expose this toggle).

**Phase 3 fold-in — per-food "Chemistry" sub-tab on detail overlay.**
- Tap any food tile → detail overlay opens.
- Two sub-tabs: "Overview" (existing nutrients/tags) + "Chemistry" (NEW).
- "Chemistry" sub-tab shows `chem.fibre` (with brief explanation), `chem.antiNutrients` as info chips, `chem.bioactives` with one-line lay descriptions.
- HR-4 hard: every `chem.*` value through `escHtml` at the render boundary.

**Open Q 4 resolution (Maren V-M):** Quick-add form KEEPS its place for the reaction-marking toggle. If a future PR migrates reaction-marking into the per-meal save path with equal prominence, re-evaluate then. Today's surface is the data-tier's only entry point for the toggle; deleting it would orphan the backbone read in `qaAnswerFoodSafety`.

## Meal-card compression sub-spec

The `dqp-zone` currently emits, per meal: up to three "same-as previous day" pills + up to three "other-meal-today" pills + up to four "top frequent for this slot" pills = **up to 10 chips max** (V-M-52 mechanical correction — prior framing said ≈13). 10 chips × 4 meals = a wall of food names.

**Compression target.** One **"Recent"** row of up to 6 chips, with an expand-to-see-all affordance. Priority order: same-meal same-day-last-week → Yd/2d/3d same-meal-as → top-frequent for this meal slot. Expand → reveals the full pill set.

**Markup shape.** `<div class="dqp-zone"><div class="dqp-recent">{6 chips}<button class="dqp-expand" data-action="dqpExpand" data-arg="{meal}">More</button></div><div class="dqp-all" hidden>{full set}</div></div>`. JS-substring truncation preserved per HR-10 (`home.js:3790, 3802`).

**Skip toggle.** `meal-skip-btn` text-link (`template.html:811,820,829,838`) → icon toggle using new `zi-skip` symbol (count 109 → 110). Avoids semantic collision with `zi-skip-forward` (media "advance").

**Care-safe (V-M-51).** Reaction signal lives in `dietIntelBanner` 3-day window, not in `dqp` chips. Compression loses recall, not safety signal.

## Region boundary declarations

| File | Governor jurisdiction | Phase(s) | Expected change size | Notes |
|------|----------------------|----------|----------------------|-------|
| `split/diet.js` | Maren | 1, 2, 4, 5 | medium | `renderDietSegment(key)` dispatcher (NEW, Phase 1) with explicit non-coupling rule to `renderTrackSubBar`; per-segment render fns; compressed `dqp` branch; `renderTips` expand-by-default; per-food detail overlay (Phase 5); Tomorrow Prep relocation. |
| `split/template.html` | shared-module dual review | 1, 2, 5 | small–medium | `#tab-diet` restructure; segment-pill row + 4 segment containers; per-food detail overlay scaffold; new `zi-skip` symbol (#110). |
| `split/styles.css` | shared-module dual review | 1, 2 | small | `.diet-seg-bar`/`.diet-seg-btn` rules; `.dqp-recent`/`.dqp-all` density; `meal-skip-btn` icon-state. |
| `split/core.js` | Kael | 1 | small | Dispatcher branch for `switchDietSegment`; `ziva_diet_segment` read in `switchTrackSub` mount path. |
| `split/home.js` | Maren | 2 | medium | `renderDietQuickPicker` compression (`:3752–3829`); `renderDietIntelBanner` split into `renderDietSafetyBanner` + `renderDietSynergyBanner` (V-M-47); **NEW: proactive age/allergen chip wiring in meal-input flow** (V-M-50 — `onMealInput`/`showMealDropdown`/`updateMealInsight` paths); stat-tile re-flow for new Score tiles (Phase 3). |
| `split/intelligence-isl.js` | Kael | 3 (Arc-B-led) | **see Arc B** | `_islDietData` `chemRollup` extension. |
| `split/intelligence-qa.js` | Kael | 3 (Arc-B-led) | **see Arc B** | `meal_combo_check` intent registration + dispatch. |
| `split/intelligence-qa-handlers.js` | Kael | 3 (Arc-B-led) | **see Arc B** | `qaAnswerMealCombo` handler. |
| `split/intelligence-cards.js` | Kael | 3 | medium | `renderInfoChemVariety` + `renderInfoVarietyNudge` cards (NEW); `computeMealCombos(date)` data function (V-M-49 separation). |
| `split/data.js` | shared | none (consumer only) | — | Out of scope. |

**Phasing terminology — unified per C-REC-2:** every shared-module touch uses the phrase "shared-module dual review" consistently. Maren + Kael Mode-1 audits in parallel; Lyra synthesizes.

## HR pre-check

| HR | Predicted risk | Why | Mitigation |
|----|----------------|-----|------------|
| HR-1 (no emojis) | low | Spec uses `zi(*)` only; `zi-skip` added (#110). **Pre-existing claim correction (V-M-53 + Cipher):** `getScoreLabel().emoji` at `core.js:1078–1083` returns `zi(*)` SVG strings, NOT Unicode codepoints. The field name is a naming-misnomer (legacy from when Unicode was used) but the substance is HR-1 compliant. **Resolved as no-op; voluntary rename `emoji` → `iconHtml` in a future hygiene PR, NOT a Maren follow-up issue.** |
| HR-2 (no inline styles) | elevated | Existing `style="display:none;"` on Diet-tab nodes (`#dietDomainHero`). New segment containers default-hide via class. | `.diet-seg-panel.active` toggle parallels `.track-sub-panel.active`. Phase 1 audit. |
| HR-3 (no inline handlers) | elevated | New actions: `switchDietSegment`, `dqpExpand`, `dismissComboTip`, `dismissAgeAllergenChip`, per-food detail open/close, chemistry sub-tab switch, Tomorrow Prep interactions. | All declared with `data-action` / `data-arg`; dispatcher branches at `core.js:340–520`. Per V-M-45 precedent. |
| HR-4 (escHtml at render boundaries) | medium | New render boundaries — food-name chips, `chem.*` values in chemistry sub-tab + chem-variety tiles, age/allergen chip text, **Variety nudge advisory copy + antiNutrient-flag strings**, combo-chip text. | Every new `${...}` calls `escHtml`. Phase 1/2/3/5 audit. Specifically (C-REC-1): the Variety nudge tile renders `chemRollup.antiNutrientFlags` array strings + advisory copy — every component through `escHtml`. |
| HR-5 (tokens-only spacing) | low–medium | `.diet-seg-bar` derives from `--sp-*`. | Tokens: `--sp-4/6/8/10/12`, `--r-full`. No raw px. |
| HR-6 (data-action delegation universal) | elevated | Same surface as HR-3. | Dispatcher branches. |
| HR-7 (zi via innerHTML) | low | `zi-skip` via `zi('skip')` → SVG via innerHTML. | Standard. |
| HR-8 (Coming-soon stubs) | n/a | No stub features. | — |
| HR-9 (post-build multi-round QA) | structural | Every phase runs canon-cc-008 chain. | PR sequence names Governors. |
| HR-10 (no text-overflow ellipsis) | medium | Recent row preserves JS substring truncation. | Phase 2 pre-check. |
| HR-11 (Math.floor currency) | n/a | No currency. | — |
| HR-12 (timezone-safe dates) | low | Existing `toDateStr` / `setDate(getDate()-i)` preserved. | No new date construction. |

## Governor-readiness — Wave 2 audit results

**Maren (Care) — V-M-47 through V-M-54 issued, verdict: yes-with-fixes.**
1. Safety-override `renderDietIntelBanner` non-empty: **OVER-BROAD (V-M-47)** — tighten to `hasSafetySignal()` predicate or split renderer.
2. `dqp-zone` compression Care-safety: **safe (V-M-51)** — reaction signal not in chips; explicit no-op finding.
3. Proactive "introduce with care" chip: **lift Phase 3 → Phase 2 (V-M-50)** — current meal-input flow has zero proactive safety signal; this is a pre-existing Care gap, not a Phase 3 fold-in. Specific per-rule phrasing; per-session dismissibility (NOT persistent).
4. Variety nudge tile copy (was "Anti-Nutrient Watch"): **drafted (V-M-48)** — label rename, ≥5/7-day gate + low-fibre-variety AND-gate, Maren-approved copy, icon-ban on `zi('warn')`/`zi('siren')`.
5. HR-1 latent at `diet.js:2742`: **false positive (V-M-53)** — concurs with Cipher. No follow-up issue.

**Kael (Intelligence) — V-K-49 through V-K-57 issued, verdict: yes-with-fixes.**
1. `calcZivaScore()` cache contract: **NOT cached (V-K-50)** — corrected; non-coupling rule added to dispatcher contract.
2. `ziva_diet_segment` ISL interaction: **none** (presentational read; no ISL pull is segment-gated).
3. `ziva_diet_segment` namespace collision: **none** (sweep complete; nearest neighbor is `ziva_diet_pref`, unrelated).
4. `_dietActiveSegment` state field placement: **top of `diet.js` segment-router section**; mirrors `_activeTrackSub` pattern.
5. Phase 3 → Arc B B-1 cross-spec contract: clean once V-K-49 / V-K-53 corrections land in Arc B.

**Cipher (Censor) — Edict V pass-with-fixes; 3 required, 6 recommended; 11 regression-guard names provided for Phase 6 / B-4 test planning. Arc-pair shape certified.**

**Aurelius (Chronicler) — chronicling-ready with 4 marginal amendments; Codex Memory.md candidates per Chronicler's discretion post-ratify.**

## PR sequence (Phases 0–6)

| Phase | Name | Scope | Branch | Jurisdiction | Diff size | QA chain |
|-------|------|-------|--------|--------------|-----------|----------|
| **0** | **Spec (this PR)** | Both arc-pair specs + journal. | `claude/sproutlab-diet-rework-p0` | docs-only | small | Wave 2 complete. Architect ratification pending. |
| 1 | Segment shell | `renderDietSegment(key)` dispatcher with non-coupling rule to `renderTrackSubBar`; segment pill row + 4 containers; `ziva_diet_segment` sticky-state with `hasSafetySignal()`-gated safety override; `renderDietIntelBanner` split into safety + synergy halves. | `claude/sproutlab-diet-rework-p1` | shared-module dual review (template + styles + diet.js + core.js + home.js banner-split) | medium | shared-module dual review → Lyra synth → Cipher Edict V. |
| 2 | Meal-card compression + age/allergen chip | Compress `dqp-zone` to single "Recent" row + expand. Skip text-link → `zi-skip` icon (#110). **NEW (lifted from Phase 3 per V-M-50): proactive age/allergen chip in meal-input flow** consuming `AGE_RULES.minMonth` + `ALLERGENS`. | `claude/sproutlab-diet-rework-p2` | Maren primary (home.js dqp + chip wiring); shared-module touch | medium | Maren primary + shared-module dual review → synth → Cipher. |
| **3** | **[Score] + chem cards + combo chips** | NEW `renderInfoChemVariety` + `renderInfoVarietyNudge` cards in `intelligence-cards.js`; trend strip in `[Score]`; `meal_combo_check` chip stack consumption in `[Today]` via `computeMealCombos(date)` (Arc B); per-food chemistry sub-tab in `[Library]`. **Depends on Arc B Phase B-1.** | `claude/sproutlab-diet-rework-p3` | Maren (diet.js, template) + Kael (intelligence-cards.js, ISL consumption) | medium–large | shared-module dual review → synth → Cipher. |
| 4 | `[Insights]` expand-by-default + dormant-code deletion | `renderTips` inline-by-default; `renderComboHistory` promoted; Tomorrow Prep relocated into `[Insights]`. **Delete** `renderInsightsD3 / renderVarietyCard / renderNutrientRadar` at `diet.js:3450/3499/3595` (Open Q 3 resolved — Lyra + Maren approve DELETE; supersession by current `renderTips` confirmed). | `claude/sproutlab-diet-rework-p4` | Maren | small–medium | Maren → synth → Cipher. |
| 5 | `[Library]` integration | Group-drill view; per-food detail overlay with Overview + Chemistry sub-tabs; quick-add form retained (Open Q 4 — KEEP both per Maren ruling). | `claude/sproutlab-diet-rework-p5` | shared-module dual review | small–medium | dual review → synth → Cipher. |
| 6 | Polish + regression-guards | Sticky-state localStorage final; a11y on segment pills (aria-selected, keyboard nav, focus ring — required, not optional per Maren); motion review; **regression-guard suite per C-REC-5 naming convention `regression-guard-{phase}-{concern}`**. | `claude/sproutlab-diet-rework-p6` | shared-module dual review | small | dual review → synth → Cipher. |

**Regression-guard names per phase (from Cipher Edict V, locked in Phase 6 / B-4 planning):**
- A-1: `regression-guard-segment-pill-data-action`, `regression-guard-sticky-state-contract`, `regression-guard-segment-no-tracksubbar-recompute` (V-K-50)
- A-2: `regression-guard-dqp-truncation-js-not-css`, `regression-guard-zi-skip-symbol-present`, `regression-guard-age-allergen-chip-fires` (V-M-50)
- A-3: `regression-guard-chem-escape-doctrine`, `regression-guard-combo-tag-resolution` (V-K-53 tri-resolution), `regression-guard-variety-nudge-icon-ban` (V-M-48)
- A-4: `regression-guard-tips-expanded-by-default`, `regression-guard-dormant-code-deleted`
- A-5: `regression-guard-food-detail-overlay-action`
- A-6: `regression-guard-seg-pill-a11y`

## Open questions — Wave 2 resolutions

1. **Food DB count (146/148/130).** Architect call; no Care/Intel concern bound on count itself. Recommendation: confirm before implementations that consume the count cite the deduped (130) figure.
2. **Sticky positioning of `.diet-seg-bar`.** Resolved — **inline-only**. No Care concern; phone-viewport reasoning.
3. **Dormant code at `diet.js:3450/3499/3595`.** Resolved — **DELETE** in Phase 4 (Lyra + Maren approve; superseded by current `renderTips`).
4. **Quick-add form vs per-meal autocomplete.** Resolved — **KEEP BOTH** (Maren ruling) until per-meal save grows a reaction-marking step.
5. **Stat-tile duplication ADD vs REPLACE.** Resolved — **ADD with re-flow** (5 → 7 tiles + conditional Variety nudge). Kael + Maren concur.
6. **Tomorrow Prep placement.** Resolved — **`[Insights]`**. Cipher + Maren concur; decision-support not logging.
7. **`zi-skip` symbol design.** Architect call on visual — slash-through bowl or no-entry glyph. Implementation in Phase 2.

## Synthesis amendments

### Wave 1.5 fold-in (scribe-scout #1 + #2 + scribe-record)
- Sticky-state key `sl.diet.segment` → `ziva_diet_segment` (house convention).
- Combo history key `sl.combo.history.v1` → `ziva_combo_history` (`COMBO_HISTORY_KEY`).
- Skip-toggle symbol `zi-bowl-skip` → `zi-skip`.
- Phase 1 invents `renderDietSegment(key)` dispatcher — load-bearing.
- Phase 3 dead-data identity: `chem.*` sub-object + `COMBO_RULES`. Routing: `chem.*` analytics' natural home is `intelligence-cards.js`; combo intelligence is new ISL intent in Arc B.

### Wave 2 fold-in (Maren / Kael / Cipher / Aurelius Mode-1)

**Mechanical corrections:**
- HR-1 latent at `diet.js:2742` reframed as naming-misnomer (V-M-53 + Cipher concur); strike "Maren follow-up issue" wording.
- `dqp-zone` chip count "≈13" → "up to 10" (V-M-52).
- `calcZivaScore()` "cached" claim struck (V-K-50).
- Anti-Nutrient Watch → Variety nudge rename (V-M-48).

**Phase re-scopes:**
- "Introduce with care" chip lifts Phase 3 → Phase 2 (V-M-50).
- Phase 1 `renderDietIntelBanner` splits into safety + synergy halves (V-M-47).
- Phase 6 adopts regression-guard naming convention `regression-guard-{phase}-{concern}` (C-REC-5).

**Schema corrections (Arc-B-led, consumed here):**
- `qaAnswerMealCombo` return shape fixed to `qaRenderAnswer` contract (V-M-49 — see Arc B for full schema).
- Chip-stack data source separated from UIB answer-render (`computeMealCombos(date)` in `intelligence-cards.js`).

**Open Question resolutions** — see §Open questions above for the 7-question table.

### Wave 2 amendments declined (with rationale)
None. All Wave 2 required and recommended fixes folded above.

---

— Lyra (Mode-1 subagent + Wave 1.5 + Wave 2 main-session synthesis), 2026-05-23, against `b2670f7`. cc-018 status: `pending_review` (Wave 2 complete; awaiting Architect ratification).
