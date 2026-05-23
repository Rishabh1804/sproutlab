# Spec: Diet Tab Rework v1

**Version:** v1.0 draft (Mode-1 + Wave 1.5 main-session synthesis)
**Date:** 2026-05-23
**Authors:**
- Lyra (Mode-1 subagent) — primary spec body (Wave 1)
- Lyra (main-session synthesis) — Wave 1.5 amendments folding `scribe-scout` #1 (food DB) + #2 (ISL capability map) findings

**Authority chain:** `CLAUDE.md` §QA Chain · canon-cc-008 · canon-cc-022 · cc-018 `pending_review`
**Against commit:** `b2670f7`
**Cross-references:** `docs/specs/isl-upgrade-v1.md` (Arc B — Phase 3 of this spec depends on Arc B's keystone trio)

## Status

`pending_review` (cc-018). Prerequisites for `ratified`:

- Architect ratification of IA pattern A, the Wave-1.5 fold-in, and the two-spec arc-pair strategy.
- Maren Mode-1 audit (Care jurisdiction — `home.js` / `diet.js` / `medical.js` touch surface; shared `template.html` / `styles.css`).
- Kael Mode-1 audit (Intelligence jurisdiction — `core.js` segment-routing touch; `intelligence-isl.js` / `intelligence-qa.js` / `intelligence-qa-handlers.js` / `intelligence-cards.js` Phase-3 touch surfaces specified in Arc B).
- Cipher Mode-1 Edict V pre-pass on the spec itself.
- Aurelius chronicling on ratification (Codex Memory.md cross-cluster note: ISL drift + arc-pair strategy).

## Why

The Diet sub-tab under TRACK does four jobs in one vertical scroll, and the IA pattern is monolithic-single-scroll where it should be sub-tabbed.

- **Job 1 — analytics.** Hero score `renderDomainHero('diet')` defined at `diet.js:2702–2764`, invoked from `home.js:2650`; 5 stat tiles via `renderDietStats` at `home.js:2595–2649`; 2×2 sub-score grid emitted as `.dsh-comp-pill` row inside `renderDomainHero` at `diet.js:2746–2760`.
- **Job 2 — logging.** Today's Meals card, `template.html:795–846`, four meal sub-cards with autocomplete inputs and `dqp-zone` history-chip walls.
- **Job 3 — decision-support.** Can I Give This? `template.html:850–862`; Recent Checks `renderComboHistory` `diet.js:890–903`; Insights & Tips `renderTips` `diet.js:905–1014` rendering 15 active Avoid / Good-to-Know / Add-to-Diet items behind three collapsed accordions.
- **Job 4 — reference.** Foods Introduced grid + quick-add form, `template.html:868–890`.

Three pathologies follow from the monolith: (a) triple analytics stack at top competes for primacy before the parent can act — the logging-first user lands on a 73 score when they came to log breakfast; (b) each meal card carries a `dqp-zone` stacking up to ~13 chips in 2–4 rows under each meal × 4 meals = a wall of food names; (c) the highest-value analytical surface — Insights & Tips, 15 active items — is buried at the bottom behind three collapsed accordions. The failure mode is **job-mixing in a single scroll** — fix it by routing by job.

**Wave 1.5 substrate finding.** The food DB (`NUTRITION` at `data.js:2228–2402`) has new fields — the `chem` sub-object (`fibre`, `antiNutrients`, `bioactives`) — and a full `COMBO_RULES` table (`data.js:2463–2476`) that have **zero outside-`data.js` references**. They are specced but unsurfaced. The intelligence layer is the only place they can be surfaced — and ISL's diet accessor (`_islDietData` at `intelligence-isl.js:446–499`) does not yet expose them. **Phase 3 of this spec depends on Arc B (ISL Upgrade) landing the substrate first.**

## Scope

**In scope.** Sub-segment IA inside the Diet sub-tab of TRACK; per-segment content specs; meal-card history-chip compression; segment router contract; sticky-state contract; Phase 0–6 PR sequence; HR pre-check; Governor-readiness asks. Phase 3 consumes Arc B outputs (specified by cross-reference).

**Out of scope.** No new data sources beyond the food-DB fields already present. No Care-Region semantic changes — meal-data schema, food DB, reaction tracking, CareTicket linkage all untouched. No new sync surfaces. No changes to the TRACK top-level sub-bar (`renderTrackSubBar` at `core.js:3161–3186`) — the Diet pill there continues to behave as today; new segments live one level below.

**Hard boundary.** This spec changes presentation and information architecture, not safety logic. Allergen / reaction / Can I Give This? semantics remain identical; only their placement and surfacing change. The new `meal_combo_check` ISL intent (specced in Arc B, consumed by `[Today]` in Phase 3 here) introduces NEW decision-support — it does not modify existing safety logic.

## IA pattern declaration

Pattern A: a sub-segment pill row directly under the Diet header inside `#tab-diet` (`template.html:782`), rendering one of four segments below it.

```
[Today]   [Score]   [Insights]   [Library]
```

**Segment content boundaries (locked):**

- **[Today]** — logging-only. Date picker (`#feedingDate`), Diet Intel Banner (`#dietIntelBanner`), four meal cards (`.meal-card.{breakfast|lunch|dinner|snack}`), per-meal compressed `dqp-zone` (see §Meal-card compression), Save. **Phase 3 fold-in:** post-log `meal_combo_check` chip stack consuming Arc B's new ISL intent + `COMBO_RULES` + `chem.antiNutrients` (e.g., logging ragi + paneer fires "spacing tip: serve calcium 2h apart"). Plus a proactive "introduce with care" chip next to the meal input when the typed/selected food crosses `AGE_RULES.minMonth` or `ALLERGENS` (Group D from scout #1 — data already read, but not yet proactively surfaced).
- **[Score]** — analytics. Hero score card (`renderDomainHero('diet')`), 2×2 sub-score grid, 5 stat tiles (`#dietStats` via `renderDietStats`), trend strip. **Phase 3 fold-in:** "Fibre Variety" tile + "Bioactive Diversity" tile derived from `chemRollup` (the new field on `_islDietData` specced in Arc B). New tiles render via NEW `renderInfoChemVariety` in `intelligence-cards.js` — `chem.*` analytics' natural home, alongside existing `computeNutrientHeatmap` / `computeFoodCombos` / `computeMealBreakdown`.
- **[Insights]** — decision-support. Can I Give This? + Recent Checks (`renderComboHistory`) + Insights & Tips (`renderTips`) with the three category accordions **rendered inline, expanded by default**. The 15-active-item surface lands on segment open, not behind chevrons.
- **[Library]** — reference. Foods Introduced grid (`#foodsGrid` via `renderFoods` at `home.js:2947+`), group-drill view, per-food detail overlay. **Phase 3 fold-in:** per-food detail overlay gains a "Chemistry" sub-tab exposing `chem.fibre` / `chem.antiNutrients` / `chem.bioactives` (Group A from scout #1) — direct surfacing on a discrete tap, not pushed into every food-row tile. Quick-add form integrated.

**Segment router contract:**

- Data-action-driven per HR-3. Pill click fires `data-action="switchDietSegment"` with `data-arg` ∈ `{today, score, insights, library}`. Dispatcher branch in `core.js`'s existing action delegator (sister to `switchTrackSub` at `core.js:3136`).
- Segment state stored in `localStorage` under key **`ziva_diet_segment`** — matching the house convention `ziva_*` (sister to `ziva_track_sub` at `core.js:3139`, `ziva_active_tab` at `core.js:1053/3077`). **No `sl.*` keys exist anywhere in the codebase**; the spec follows the established prefix.
- Segment change re-renders the **segment body only**, not the whole Diet tab.

**Critical structural finding (scout #2).** **There is no `renderDiet()` orchestrator today.** `switchTrackSub('diet')` at `core.js:3153` calls only `renderDietStats()`. Per-segment lazy rendering requires inventing a `renderDietSegment(segmentKey)` dispatcher in Phase 1. This is structural, not veneer — and is the load-bearing change in Phase 1.

**Sticky-state contract:**

- Write `ziva_diet_segment` on every segment change.
- Read on Diet sub-tab mount (inside `switchTrackSub(sub)` when `sub === 'diet'`).
- Fallback to `today` if absent, malformed, or not in the enum. Logging-first cold-start is non-negotiable.
- **Safety override (Maren-flagged).** If `renderDietIntelBanner` (`home.js:3831`) produces non-empty content (active fever/diarrhoea episode with diet implications), force-route to `[Today]` regardless of sticky-state. The banner is the highest-signal surface; if it has something to say, the parent must see it.

**Segment-pill component contract:**

- Reuse the existing `.track-sub-btn` styling pattern (`styles.css:4930–4947`) at a derived class `.diet-seg-btn` — visual continuity with the parent TRACK sub-bar, marked as sub-level (no `tsb-score` numeric slot, denser).
- **Sticky positioning decision (open question, Lyra recommends inline-only).** The parent `.track-sub-bar` is `position: sticky; top: 0` (`styles.css:4932`). Three options: (a) **inline-only** — scrolls with content, no double-sticky overhead; (b) also-sticky stacked under the TRACK bar — heavier but always visible; (c) both-sticky with z-index management. **Recommendation: inline-only** to keep phone viewport breathing room.
- Token-driven; no new color domain. Spacing from `--sp-*`; radii from `--r-full`; type from `--fs-sm` / `--fs-xs`.

## Per-segment specs

### `[Today]` — logging segment

**Purpose.** Log today's meals fast, one-handed, with minimum chrome.

**Content.** Date nav (`‹` / date input / `›` / Save), Diet Intel Banner (`renderDietIntelBanner` at `home.js:3831`), four meal cards (breakfast / lunch / dinner / snack), each with compressed `dqp-zone` (see §Meal-card compression), `meal-input` autocomplete dropdown, per-meal insight strip (`#insight-{meal}`).

**Phase 3 fold-in.**
- **`meal_combo_check` chip stack** — appears under the meal-card group when the newly-saved food triggers a combo from `COMBO_RULES` against today's already-logged foods. Shape: dismissable chip with `data-action="dismissComboTip"` / `data-arg="{ruleId}"`. The ISL intent + handler are specced in Arc B (`isl-upgrade-v1.md` §Sequencing keystone). NOTE: `COMBO_RULES` is keyed by *nutrient* (`foods:['iron','calcium']`), not food name; the handler must tag-resolve via `NUTRITION[food].nutrients`.
- **Proactive "introduce with care" chip** — appears next to the meal-input dropdown when the typed/selected food crosses `AGE_RULES.minMonth` against Ziva's current age, or appears in `ALLERGENS`. Group D from scout #1. The data is already *read* at log-time (`diet.js:465`, `diet.js:475`); this fold-in just promotes it to a *proactive* surface.

**Major changes (Phases 1+2).** (1) Analytics removed from this segment's view — hero / sub-score grid / stat tiles all live in `[Score]`. (2) `dqp-zone` compressed from up-to-four-stacked rows to one expandable "Recent" row. (3) `meal-skip-btn` text-link replaced with icon-toggle.

**Data sources / state reads.** `feedingData` (current entry by date), `foods` array (autocomplete), ISL `dqp` pulls already plumbed in `renderDietQuickPicker`, Diet Intel Banner reads fever-episode state from `intelligence-illness.js`. Phase-3 additions: ISL `meal_combo_check` intent (Arc B); `AGE_RULES` / `ALLERGENS` already in scope.

**Open questions.** Should the date nav promote into the Diet segment header (next to the segment pills) or stay at the top of `[Today]`? Should Tomorrow Prep (`renderTomorrowPrep` at `diet.js:2157`) surface here or in `[Insights]`?

### `[Score]` — analytics segment

**Purpose.** Show how Ziva's diet is tracking — score, sub-scores, tiles, trend, chemistry-variety.

**Content.** `renderDomainHero('diet')` → 2×2 sub-score grid → `#dietStats` 5-tile grid → trend strip.

**Phase 3 fold-in.**
- **"Fibre Variety" tile.** Counts distinct `chem.fibre` categories Ziva consumed in the last 7 days. Direct answer to "is the fibre mix varied?" (parent question scout #1 surfaced). Source: `chemRollup.fibreDaysHigh` from Arc B.
- **"Bioactive Diversity" tile.** Distinct `chem.bioactives` count over 7 days — variety matters more than mg-totals at this developmental stage. Source: `chemRollup.bioactiveCount` from Arc B.
- **Optional "Anti-Nutrient Watch" inline note.** If `chemRollup.antiNutrientFlags` flags multi-day oxalate/phytate load, surface a calm advisory (not alarm) chip. Maren consult required on phrasing.

**Renderer routing.** New tiles render via NEW functions in `intelligence-cards.js` (the natural home for `chem.*` analytics per scout #2 — `renderInfo*` master + sibling compute fns already there). Proposed: `renderInfoChemVariety` + `renderInfoBioactiveDiversity`, both consuming `chemRollup` via `getDomainData('diet', ...)`.

**Major changes.** (1) Score is no longer the first thing seen on a logging visit. (2) Trend strip is new; sized by the Phase-3 chem-variety tiles. (3) Existing stat-tiles (`ds-sage` classes) and the new chem-variety tiles must NOT duplicate — Phase 3 resolves whether the new tiles ADD to the stat-tile row or REPLACE one of the existing tiles. Recommend ADD with explicit re-flow.

**Data sources / state reads.** Existing: `calcZivaScore()` cache, `getZivaScoreTrend7d()`, food/iron/variety derivations in `renderDietStats`. New (Arc B): `chemRollup` via `_islDietData`.

**Open questions.** Sparkline density. Whether the 2×2 sub-score grid here matches the popup's `_spRenderOverview` layout exactly or a denser inline variant. Stat-tile duplication resolution (ADD vs REPLACE).

### `[Insights]` — decision-support segment

**Purpose.** Answer "Can I give this?" and surface what the data is saying.

**Content.** Can I Give This? input + result + chips + Recent Checks (`renderComboHistory`) + Insights & Tips (`renderTips`) with three sections **rendered inline, expanded by default** — Avoid / Good to Know / Add to Diet. The accordion-collapsed pattern is removed for this segment.

**Major changes.** (1) The 15-active-item Insights & Tips surface lands on segment open. (2) Three category accordions → inline sections with section headers, no default chevron-collapse. (3) Recent Checks promoted next to Can I Give This?, not buried under it.

**Data sources / state reads.** `comboHistory` (localStorage key `ziva_combo_history`, `COMBO_HISTORY_KEY` per `diet.js:378,380,614`), tip-generation pipeline from `renderTips` / `generateDos` / `generateDonts`.

**Open questions.** Does Tomorrow Prep belong here as a fourth inline section? Should the Insights & Tips count badge (`#tipsCount`) move into the segment-pill itself as a numeric badge on `[Insights]`?

### `[Library]` — reference segment

**Purpose.** What has Ziva tried, by group; per-food chemistry; quick-add a new food.

**Content.** Foods Introduced 6-card grid (`#foodsGrid`, by food group), drill-into-group expanded view, **per-food detail overlay** (new — Phase 3 fold-in), quick-add form (`#foodInput` + `#foodDate` + `#foodSlot` + reaction toggle + Add button).

**Phase 3 fold-in — per-food "Chemistry" sub-tab on detail overlay.**
- Tap any food tile → detail overlay opens.
- Two sub-tabs: "Overview" (existing nutrients/tags display) + "Chemistry" (NEW).
- "Chemistry" sub-tab shows `chem.fibre` (with brief explanation of what each category means), `chem.antiNutrients` as info chips (with soak/cook hints from a small inline lookup or a future `chem.advisories` derivation), `chem.bioactives` with one-line lay descriptions.
- HR-4 hard: every `chem.*` value passed through `escHtml` at the render boundary.

**Major changes.** (1) Quick-add form remains here (final placement TBD per Open Questions). (2) Group-drill view defaults to compact summary; tap-group expands. (3) Per-food detail overlay is NEW (current tap doesn't open one).

**Data sources / state reads.** `foods` array, `feedingData` (for "X of Y" group counts and frequency), `NUTRITION[name]` for chemistry sub-tab.

**Open questions.** Delete the quick-add form entirely in favour of per-meal autocomplete + reaction-marking inline, or keep both? Should the food-group card layout shift from 6 fixed cards to a denser pill-grid?

## Meal-card compression sub-spec

The `dqp-zone` currently emits, per meal: up to three "same-as previous day" pills (Yd / 2d ago / 3d ago — `DAY_LABELS` at `home.js:3767`), plus up to three "other-meal-today" pills, plus up to four "top frequent for this slot" pills, plus up to three general top-foods fallbacks. **Maximum density: ≈13 pills in 2–4 stacked rows under every meal input. Wall-of-food-names against four meal cards.**

**Compression target.** One **"Recent"** row of up to 6 chips, with an expand-to-see-all affordance. Priority order (top of row first): (1) same-meal same-day-last-week if exists; (2) Yd / 2d / 3d same-meal-as pills (most recent first); (3) top-frequent for this meal slot. Expand → reveals the full pill set under the row.

**Markup shape.** `<div class="dqp-zone"><div class="dqp-recent">{6 chips}<button class="dqp-expand" data-action="dqpExpand" data-arg="{meal}">More</button></div><div class="dqp-all" hidden>{full set}</div></div>`. Expand toggles `[hidden]` on `.dqp-all` and updates the button label. Note: `dqp-same` chip uses JS-level substring truncation (`home.js:3790, 3802`), NOT CSS `text-overflow: ellipsis` — preserved for HR-10.

**Skip toggle.** The `meal-skip-btn` text-link (`template.html:811,820,829,838`, styled at `styles.css:489–491`) — currently the literal text "skip" — becomes an icon toggle. Symbol name: **`zi-skip`** (simpler than `zi-bowl-skip`; matches existing sprite convention). Avoids semantic collision with `zi-skip-forward` (`template.html:107`, which means "advance to next" in media context). New symbol added to template — count goes 109 → 110.

## Region boundary declarations

| File | Governor jurisdiction | Phase(s) | Expected change size | Notes |
|------|----------------------|----------|----------------------|-------|
| `split/diet.js` | Maren | 1, 2, 4 (Insights expand), 5 | medium | `renderDietSegment(key)` dispatcher (NEW, Phase 1), per-segment render fns, compressed `dqp` branch, `renderTips` expand-by-default mode, per-food detail overlay (Phase 5 — Phase 3 chem sub-tab consumed here). |
| `split/template.html` | Maren + Kael (shared) | 1, 2, 5 | small–medium | `#tab-diet` restructure: segment pill row + four segment containers wrapping existing content nodes. Per-food detail overlay scaffold. New `zi-skip` symbol (#110). |
| `split/styles.css` | Maren + Kael (shared) | 1, 2 | small | `.diet-seg-bar` / `.diet-seg-btn` rules (token-driven, derived from `.track-sub-bar`), `.dqp-recent` / `.dqp-all` density rules, `meal-skip-btn` icon-state. |
| `split/core.js` | Kael | 1 | small | Dispatcher branch for `switchDietSegment`; `ziva_diet_segment` read in `switchTrackSub` mount path. Inline; no `slStickyState` helper introduced. |
| `split/home.js` | Maren | 2 | small | `renderDietQuickPicker` (`:3752–3829`) compression to single Recent + expand. Stat-tile re-flow for new Score-segment tiles (Phase 3). |
| `split/intelligence-isl.js` | Kael | 3 (Arc-B-led) | **see Arc B** | `_islDietData` `chemRollup` extension. Specified in Arc B; consumed here. |
| `split/intelligence-qa.js` | Kael | 3 (Arc-B-led) | **see Arc B** | `meal_combo_check` intent registration + dispatch. Specified in Arc B; consumed here. |
| `split/intelligence-qa-handlers.js` | Kael | 3 (Arc-B-led) | **see Arc B** | `qaAnswerMealCombo` handler. Specified in Arc B; consumed here. |
| `split/intelligence-cards.js` | Kael | 3 | medium | `renderInfoChemVariety` + `renderInfoBioactiveDiversity` cards (NEW). Consumes Arc B's `chemRollup`. |
| `split/data.js` | shared | none (consumers only) | — | Out of scope this spec; `NUTRITION` and `COMBO_RULES` already specced. |

**Out of scope this spec.** `split/sync.js`, `split/intelligence-illness.js`, `split/intelligence-quicklog.js`, `split/intelligence-caretickets.js`, `split/medical.js`. Phase 3's intelligence-layer dependency is fully spelled out in `docs/specs/isl-upgrade-v1.md`.

## HR pre-check

| HR | Predicted risk | Why | Mitigation in this spec |
|----|----------------|-----|-------------------------|
| HR-1 (no emojis) | low (this spec) / **pre-existing flag** | The spec adds `zi-skip` and uses only `zi(*)` for all icons. **However, scout #2 noted a pre-existing latent issue:** `renderDomainHero` at `diet.js:2742` pushes `lbl.emoji` directly into HTML. If `getScoreLabel().emoji` returns Unicode emoji rather than a `zi()` SVG, that's an HR-1 violation that pre-dates this rework. **Flag for Maren** as a separate follow-up issue, NOT folded into this spec. |
| HR-2 (no inline styles) | elevated | Existing diet-tab markup carries inline `style="display:none;"` (e.g., `#dietDomainHero`). New segment containers must default-hide via class, not inline style. | `.diet-seg-panel.active` toggle parallels existing `.track-sub-panel.active`. Phase 1 audit watches for any new inline-style introductions. |
| HR-3 (no inline handlers) | elevated | New actions: `switchDietSegment`, `dqpExpand`, `dismissComboTip`, per-food detail overlay open/close, chemistry sub-tab switch. | All declared with `data-action` / `data-arg`; dispatcher branches added at `core.js:340–520`. Per the V-M-45 precedent in `diet.js` from the prior session. |
| HR-4 (escHtml at render boundaries) | medium | Meal-card compression renders food-name chips; food names are user input. Existing `dqp-zone` already uses `escHtml(val)` (`home.js:3792`). Phase 3 chemistry-sub-tab renders `chem.*` values — also need `escHtml`. | Every new render boundary calls `escHtml` — food strings, chip text, chem values, tip text. Phase 1/5 audit. |
| HR-5 (tokens-only spacing) | low–medium | `.diet-seg-bar` derives from `--sp-*` like `.track-sub-bar`. | Token list referenced (`--sp-4/6/8/10/12`, `--r-full`). No raw px. |
| HR-6 (data-action delegation universal) | elevated | Same surface as HR-3. | Confirmed in segment-router contract. |
| HR-7 (zi via innerHTML) | low | `zi-skip` rendered via `zi('skip')` → SVG via innerHTML. | Standard pattern. |
| HR-8 (Coming-soon stubs) | n/a | No stub features in this spec. | — |
| HR-9 (post-build multi-round QA) | structural | Every phase runs canon-cc-008 chain. | PR sequence table names Governors per phase. |
| HR-10 (no text-overflow ellipsis) | medium | Compressed "Recent" row must preserve JS substring truncation, not introduce CSS ellipsis. | Phase 2 pre-check note. |
| HR-11 (Math.floor currency) | n/a | No currency. | — |
| HR-12 (timezone-safe dates) | low | Existing `toDateStr` / `setDate(getDate()-i)` in `renderDietQuickPicker`. Preserved. | No new date construction. |

## Governor-readiness note

**For Maren (Care).**
1. Does compressing `dqp-zone` from up-to-four stacked rows to a single "Recent" row (6 chips + expand) lose care-context a parent depends on at moment-of-logging? Specifically: if yesterday's lunch caused a reaction note, does the parent need to see that lunch's contents in the breakfast-log glance, or is "yesterday's lunch" the wrong place to surface a reaction signal regardless?
2. Sticky-state landing the parent on `[Library]` (last-used) could hide a critical safety surface they'd otherwise see — confirm the proposed safety-override (force-route to `[Today]` when `renderDietIntelBanner` non-empty).
3. Phase 3 fold-in: proactive "introduce with care" chip in `[Today]` based on `AGE_RULES.minMonth` and `ALLERGENS` — phrasing, dismissibility, and whether dismissing should persist across sessions (probably no).
4. Phase 3 fold-in: "Anti-Nutrient Watch" tile in `[Score]` — phrasing must be calm-advisory not alarm. Maren to draft / approve copy.
5. **Pre-existing HR-1 latent** at `diet.js:2742` (`lbl.emoji` push) — confirm whether `getScoreLabel().emoji` ever returns a Unicode codepoint. If so, follow-up issue.

**For Kael (Intelligence).**
1. Does the segment router add any score-derivation recompute cost? `calcZivaScore()` is cached; segment-change should not re-trigger it.
2. Does `ziva_diet_segment` read on Diet-tab mount interact with ISL day-summary generation? The day-summary path runs through `intelligence-quicklog.js` and `intelligence-isl.js`; the segment-state read is presentational, but flag if any ISL pull is segment-gated.
3. Confirm `ziva_diet_segment` namespace does not collide with any existing localStorage key.
4. Phase 1 invents `renderDietSegment(segmentKey)` dispatcher in `diet.js`. Where exactly does it sit relative to `_dietActiveSegment` state, and should this state mirror the `_activeTrackSub` pattern at `core.js`?
5. Phase 3 dependency on Arc B's keystone trio — review the cross-spec contract in `isl-upgrade-v1.md` and flag any plumbing risks.

## PR sequence (Phases 0–6)

| Phase | Name | Scope | Branch | Jurisdiction | Diff size | QA chain |
|-------|------|-------|--------|--------------|-----------|----------|
| **0** | **Spec (this PR)** | This document + `docs/specs/isl-upgrade-v1.md` + journal updates. | `claude/sproutlab-diet-rework-p0` | docs-only | small (~3 files) | Governor audit waived per docs-only carve-out; Architect ratification + Cipher Mode-1 pre-pass on shape + Aurelius chronicling. |
| 1 | Segment shell | `renderDietSegment(key)` dispatcher (NEW); segment-pill row + 4 segment containers; `ziva_diet_segment` sticky-state with safety override; zero-loss visual refactor (everything still visible, just behind right pill). | `claude/sproutlab-diet-rework-p1` | shared (template + styles + diet.js + core.js segment branch) | medium | Maren + Kael parallel → Lyra synth → Cipher Edict V. |
| 2 | Meal-card compression | Compress `dqp-zone` to single "Recent" row + expand. Skip text-link → `zi-skip` icon toggle. Symbol #110 added. | `claude/sproutlab-diet-rework-p2` | Maren primary (home.js `dqp`); shared-module touch on template/styles | medium | Maren primary + Kael shared-module → synth → Cipher. |
| **3** | **[Score] + dead-data surface** | NEW `renderInfoChemVariety` + `renderInfoBioactiveDiversity` cards in `intelligence-cards.js`; trend-strip in `[Score]`; proactive "introduce with care" chip in `[Today]`; `meal_combo_check` chip consumption (handler specced in Arc B); per-food chemistry sub-tab in `[Library]`. **Depends on Arc B Phase B1 (keystone trio) being merged.** | `claude/sproutlab-diet-rework-p3` | Maren (diet.js, template) + Kael (intelligence-cards.js, ISL consumption) | medium–large | Maren + Kael (full parallel) → synth → Cipher. |
| 4 | `[Insights]` expand-by-default | `renderTips` inline-by-default; `renderComboHistory` promoted; accordion chevrons defaulted-open or removed. **Dormant-code disposition** for `renderInsightsD3 / renderVarietyCard / renderNutrientRadar` at `diet.js:3450/3499/3595` — Lyra recommends DELETE (prior iteration superseded). | `claude/sproutlab-diet-rework-p4` | Maren (diet.js) | small–medium | Maren → synth → Cipher. |
| 5 | `[Library]` integration | Group-drill view; per-food detail overlay with Overview + Chemistry sub-tabs; quick-add form audit (delete-or-keep per Open Question 4). | `claude/sproutlab-diet-rework-p5` | shared (template + diet.js + styles) | small–medium | Maren + Kael shared-module → synth → Cipher. |
| 6 | Polish | Sticky-state localStorage final; a11y on segment pills (aria-selected, keyboard nav, focus ring); motion review on segment-swap; regression-guard tests for segment-router behaviour; smoke tests for sticky-state + safety override. | `claude/sproutlab-diet-rework-p6` | shared | small | Maren + Kael → synth → Cipher. |

## Open questions

1. **Food DB count discrepancy.** Architect said 146 foods; scout #1 found 148 raw entries / 130 unique keys in `NUTRITION` (18 duplicate keys across `// ── EXPANDED:` blocks silently overwriting earlier declarations). Confirm: is the spec count 130 (deduped), 148 (raw), or in-flight to 146?
2. **Sticky positioning of `.diet-seg-bar`.** Inline-only (Lyra recommends) vs also-sticky stacked under `.track-sub-bar`. Phone-viewport call.
3. **Dormant code at `diet.js:3450, 3499, 3595`** (`renderInsightsD3 / renderVarietyCard / renderNutrientRadar`). Delete (Lyra recommends — prior iteration superseded by current `renderTips`) vs revive vs leave. Resolved in Phase 4.
4. **Quick-add form vs per-meal autocomplete redundancy.** Delete the form, integrate reaction-marking inline in per-meal flow, or keep both?
5. **Stat-tile duplication in Phase 3.** New "Fibre Variety" / "Bioactive Diversity" tiles — ADD to the existing 5-tile row (re-flow to 7?) or REPLACE one of the existing tiles?
6. **Tomorrow Prep placement.** `renderTomorrowPrep` (`diet.js:2157`) currently renders into `#tomorrowPrepCard` outside the Diet sub-tab body. Move into `[Today]`, `[Insights]`, or leave outside the segment system?
7. **`zi-skip` symbol design.** Lyra proposes a simple slash-through bowl or a "no-entry" glyph. Architect call on visual.

## Synthesis amendments (Wave 1.5 fold-in)

This v1.0 draft folds the following amendments to the Lyra Mode-1 (Wave 1) spec body, all surfaced by Wave 1.5 scouts:

**Mechanical corrections (scout-validated):**
- Sticky-state key: `sl.diet.segment` → `ziva_diet_segment` (house convention).
- Combo history key: `sl.combo.history.v1` → `ziva_combo_history` (`COMBO_HISTORY_KEY`).
- Skip-toggle symbol: `zi-bowl-skip` → `zi-skip` (matches sprite convention).
- The 73/59/95/79/75 pill row was misidentified in Wave 1 as a precedent inside Diet; it is the parent `.track-sub-bar` with `tsb-score` chips. The visual idiom we clone lives one level *up*; `.diet-seg-bar` is a *sub-level* derivation.

**Structural additions (scout-surfaced):**
- No `renderDiet()` orchestrator exists today — Phase 1 invents `renderDietSegment(key)`. Load-bearing change.
- Sticky positioning of `.diet-seg-bar` flagged as an open question (Lyra recommends inline-only).
- Phase 3 dead-data identity: `chem.*` sub-object + `COMBO_RULES` from `data.js`. Surface routing decided: `chem.*` analytics' natural home is `intelligence-cards.js`; combo intelligence is a new ISL intent (`meal_combo_check`) specced in Arc B.

**Risk flags (scout-flagged for Governor attention):**
- Pre-existing HR-1 latent at `diet.js:2742` (`lbl.emoji` direct HTML push). Flag for Maren as follow-up issue.
- Stat-tile duplication risk in Phase 3 — explicit ADD vs REPLACE decision needed.
- COMBO_RULES is keyed by *nutrient* not food name — handler must tag-resolve.

**Arc-pair strategy.** This spec (Arc A — Diet IA) and `docs/specs/isl-upgrade-v1.md` (Arc B — ISL Upgrade) are ratified together because Phase 3 of Arc A depends on Arc B's keystone trio. Phases 1, 2, 4, 5, 6 of Arc A are independent and can ship without Arc B landing first.

---

— Lyra (Mode-1 subagent + main-session Wave 1.5 synthesis), 2026-05-23, against `b2670f7`. cc-018 status: `pending_review`.
