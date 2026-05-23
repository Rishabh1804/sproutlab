# Arc C — Food-DB Cleanup v1

**Spec version:** v1
**Date:** 2026-05-23
**Branch:** `claude/session-handoff-docs-gxYiL` (spec); ship branches per phase
**Author:** Lyra (main-session)
**Jurisdiction:** primarily Maren + Kael cross-consult (data.js is shared — Maren cares about food-safety implications, Kael cares about data-shape integrity); Vela has no jurisdiction on data.js (render-layer only).
**Authority:** scout #1 food-DB schema survey (cited in `docs/specs/isl-upgrade-v1.md` §Open Q 4 + V-K-49 dead-data inventory); Maren cross-consult on care implications; Architect ratification this arc.

---

## What Arc C is

Arc C cleans the food database — `NUTRITION`, `_FOOD_ALIASES`, `COMBO_RULES`, and adjacent constants in `split/data.js` — so that downstream consumers (`chemRollup`, `qaAnswerMealCombo`, `analyzeFoodSafety`, the meal-input flow, the per-food chemistry sub-tab in Arc A Phase 5) read from a clean, deduplicated, type-clarified surface.

This is a **data-hygiene arc, not a feature arc.** No new UI surfaces. No new ISL intents. The deliverables are dedupes, alias consolidations, type disambiguations, and documentation-of-intent.

## Why now (and why before Arc B Phase B-1)

**The chemRollup keystone joins `allFoods` → `NUTRITION[base]` via `_baseFoodName()`.** If the food-DB carries 18 duplicate NUTRITION keys (independent `date` + `date (fruit)`, `yogurt` + `curd` + `dahi`, `lauki` + `bottle gourd`, `sesame` + `til`, `litchi` + `lychee`, `raisins` + `kishmish`, `halim` + `aliv`, etc.) with their own `chem.*` payloads, the moment one entry's `chem` drifts from its synonym's, `chemRollup` silently produces wrong counts.

Concrete failure shape: `_FOOD_ALIASES` already maps `dahi` → `curd` and `yogurt` → `curd`, but `NUTRITION` carries independent `curd`, `yogurt`, and `dahi` entries (lines 2295–2297). If a future PR adjusts `curd.chem.bioactives` and forgets to update `yogurt` + `dahi`, then `chemRollup.bioactiveCount` is sensitive to which key the meal log resolves to via `_baseFoodName()`. The same shape applies to all 18 duplicate-key pairs.

The keystone trio specced for Arc B Phase B-1 already specifies "silent dedupe + first-encounter `console.warn` for unaliased synonym pairs" (V-M-49 / isl-upgrade-v1.md §Open Q 4 resolution). But that's a runtime mitigation. Arc C ships the structural fix: cleanup the data so the runtime mitigation has nothing to mitigate.

**Sequencing:** Arc C ships **before Arc B Phase B-1**. This is the user's chosen sequencing. The keystone trio then joins clean data.

## Arc C scope — five phases (small, mechanical)

### C-1 — Dedupe duplicate NUTRITION keys

**Surface:** `split/data.js:2228–~2410` (`const NUTRITION = {...}`).

**Inventory of duplicate-key pairs (scout #1 baseline; live verification required before merge):**

| Canonical | Synonym key(s) to remove | Verification |
|-----------|--------------------------|--------------|
| `curd` | `yogurt`, `dahi` | `_FOOD_ALIASES` already maps both → `curd` |
| `date` | `date (fruit)` | `_FOOD_ALIASES` already maps `date (fruit)` → `date` |
| `bottle gourd` | `lauki` | `_FOOD_ALIASES` already maps `lauki` → `bottle gourd` |
| `sesame` | `til` | `_FOOD_ALIASES` already maps `til` → `sesame` |
| `litchi` | `lychee` | Both independent in NUTRITION; pick `litchi` as canonical (matches `_FOOD_ALIASES` discipline of preferring the more-common Indian spelling); add `lychee` → `litchi` to `_FOOD_ALIASES` |
| `raisins` | `kishmish` | Both independent; pick `raisins` as canonical (English-default; matches the existing pattern of `paneer`, `ghee`); add `kishmish` → `raisins` to `_FOOD_ALIASES` |
| `anjeer` | `dried fig`, `fig` (if present) | Both `anjeer` and `dried fig` reference dried form; verify whether a fresh `fig` entry exists separately — if yes, keep `fig` distinct from `anjeer` (anjeer = dried) and document. Verify `_FOOD_ALIASES` |
| `halim` | `aliv` | Both independent in NUTRITION; pick `halim` as canonical (more common); add `aliv` → `halim` to `_FOOD_ALIASES` |
| `almond` / `almonds` | resolve which is NUTRITION-canonical | NUTRITION has `almonds` (plural); ALLERGENS has both `almond` and `almonds`; resolve singular vs plural across the food-DB consistently (recommend: NUTRITION uses singular `almond` to match `walnut`, `cashew`, `peanut` — already singular) |
| ... | (verify against full scout #1 inventory at merge time) | |

**Mechanical action per pair:**
1. Identify the canonical key.
2. Verify the synonym's `chem.*` payload matches the canonical's exactly (or merge into canonical if newer signals exist on the synonym).
3. Remove the synonym key from `NUTRITION`.
4. Add the synonym → canonical mapping to `_FOOD_ALIASES` if not already present.
5. Verify no `COMBO_RULES` row, no `FOOD_SYNERGIES` row, no `SEASONAL_INDIA_INDEX` row, no `_PREP_PATTERNS` row, no AGE_RULES row, no ALLERGENS row keys against the removed synonym directly (all should key against the canonical post-cleanup, OR the alias-resolution should happen at the consumer).

**Risk:** removing a NUTRITION key that is referenced by some consumer NOT going through `_baseFoodName()` produces silent `undefined`. Mitigation: scribe-scout sweep before merge for every removed key.

**Maren consult:** does the `chem.*` payload merge introduce any drift that affects allergen flags or safety-relevant tags? Specifically the dairy synonyms (`curd`/`yogurt`/`dahi`) and dried fruit synonyms (`raisins`/`kishmish`, `anjeer`/`dried fig`) — those are allergen-adjacent.

**LOC impact:** ~10–20 lines removed from NUTRITION; ~5–10 lines added to `_FOOD_ALIASES`. Net negative.

### C-2 — Consolidate `_FOOD_ALIASES` synonym discipline

**Surface:** `split/data.js:2115–2125` (`const _FOOD_ALIASES`).

After C-1, `_FOOD_ALIASES` should carry every synonym → canonical mapping needed by downstream consumers. The discipline:

- **One canonical per concept.** Every meal-log resolvable to a single NUTRITION key via `_FOOD_ALIASES` + `_baseFoodName()`.
- **English-default canonicals where both forms exist.** Exceptions: well-established Hindi/regional names where the Hindi form is the more-common usage in the parent's logging (e.g., `paneer`, `ghee`, `halim`, `anjeer` — but these are arguably English loanwords now).
- **Singular over plural for nuts.** `almond` not `almonds`. Matches existing pattern.
- **No spelling-variant entries in NUTRITION** — every spelling variant maps via `_FOOD_ALIASES`.

**Mechanical action:** after C-1's removals, add a docstring comment to `_FOOD_ALIASES` documenting this discipline so future contributions follow it.

**LOC impact:** ~10 lines of inline comment block. No structural change beyond C-1.

### C-3 — Resolve the `date (fruit)` keying nuance + `COMBO_RULES` and `FOOD_SYNERGIES` references

**Surface:** `split/data.js` — `FOOD_SYNERGIES` table (lines 2142–2202), `COMBO_RULES` table, `SEASONAL_INDIA_INDEX` (line 2632–onward).

After C-1 removes `date (fruit)` from NUTRITION (canonical = `date`), every reference to `'date (fruit)'` in adjacent tables needs to either:
- Resolve via `_FOOD_ALIASES` at the consumer (preferred — single source of truth), OR
- Be re-keyed to `'date'` directly at the table (faster, but loses the disambiguation that `date (fruit)` was added to provide originally — "date" the verb / "date" the calendar date).

**Resolution:** prefer the consumer-side alias resolution (Option A). Every consumer reading `FOOD_SYNERGIES`, `COMBO_RULES`, `SEASONAL_INDIA_INDEX`, `_PREP_PATTERNS` must already resolve via `_baseFoodName()` for the canonical NUTRITION key lookup — extending that discipline to the synergy/combo tables is consistent.

**Mechanical action:**
1. Audit every table for `'date (fruit)'` (and any other synonym key removed in C-1) string literal.
2. Replace with `'date'` (canonical) where the reference is to the food.
3. Add a comment block at the top of `FOOD_SYNERGIES` and `COMBO_RULES` documenting: "Food-name keys in this table are canonical NUTRITION keys (post-Arc-C). Consumers must resolve via `_baseFoodName()` before joining against NUTRITION."

**Maren consult:** does any safety-relevant rule key against a synonym that gets renamed? Specifically `AGE_RULES` and `ALLERGENS` — if `AGE_RULES['honey']` is the only honey-keying, no issue; but if `AGE_RULES['cow milk']` and `AGE_RULES['dairy']` both exist with overlapping coverage, that's a Maren-tier resolution.

**LOC impact:** ~5–15 lines changed (substitutions); ~10 lines added (comment blocks). Net minimal.

### C-4 — Type-resolve `chem.fibre` (categorical) vs `nutrients[]` (boolean-presence) dual-meaning

**Surface:** `split/data.js:2207–2227` (the `chem` field docstring at NUTRITION top).

The current model:
- `chem.fibre` carries a **categorical** value: `'soluble (pectin)'`, `'soluble (beta-glucan)'`, `'mixed'`, `'insoluble'`, `'mucilaginous'`, `'resistant starch'`, `'minimal'`, `'none'`. It describes the *character* of the fibre in the food.
- `nutrients[]` carries a **boolean-presence flag** — if `'fibre'` appears in the array, the food has notable fibre. Bare `'fibre'` token, no character.

These two fields use the SAME word ("fibre") for two different semantics. The current docstring at lines 2207–2227 explains `chem.fibre` but does not name the collision.

**Risk:** a downstream consumer querying "does this food have fibre?" might check `chem.fibre !== 'none'` (correct), OR `nutrients.includes('fibre')` (also correct, but a different "yes" criterion — `chem.fibre = 'minimal'` foods like rice DON'T carry `'fibre'` in `nutrients[]`, while `chem.fibre = 'mixed'` foods generally DO). The two checks disagree for `'minimal'`-fibre foods.

**Resolution options:**

**Option A — Rename `chem.fibre` to `chem.fibreCharacter`.** Explicit. Makes the categorical vs presence-flag distinction visible at every read site. Highest clarity; touches more sites (every place that reads `chem.fibre`).

**Option B — Document the dual-meaning in the docstring without renaming.** Cheapest. Lowest clarity; documentation drift risk.

**Option C — Add a derived helper `getFibreCharacter(food)` that hides the dual-meaning.** Middle ground; touches consumers progressively as they migrate to the helper.

**Recommended:** **Option A — rename `chem.fibre` to `chem.fibreCharacter`.** Costs ~50–80 LOC across NUTRITION (every entry) + ~5–10 LOC at consumers (chemRollup, renderInfoChemVariety, the per-food chemistry sub-tab in Arc A Phase 5). Net: an explicit field name; no ambiguity; one-time migration.

**Maren consult:** any care-tier consumer of `chem.fibre`? Specifically the constipation-relief tags (`'constipation-relief'`) — those live in `tags[]`, not in `chem.fibre`. Confirmed independent.

**Kael consult:** does `chemRollup` read `chem.fibre` directly or via a helper? Phase B-1's `chemRollup` is being authored fresh — re-spec the field name as `chem.fibreCharacter` from the start. No migration cost for chemRollup itself.

**LOC impact:** ~50–80 LOC across NUTRITION (rename per entry); ~5–10 LOC at downstream consumers. Net additive; mechanical.

### C-5 — Document `COMBO_RULES` keying convention (rule #6 outlier)

**Surface:** `split/data.js:2463–2476` (`const COMBO_RULES = [...]`).

`COMBO_RULES` is NOT uniformly nutrient-keyed. Rule #6 (`banana` + `constipation`) is the outlier — it keys against:
- A food-name (`banana`) — name-match resolution
- An illness-state (`constipation`) — state-match resolution (cross-Region read into `intelligence-illness.js` active episodes per V-K-53 tri-resolution)

Other rules key against:
- Nutrient tags (rules 1–5 — iron + calcium, iron + vitamin c, iron + tea, fat + vitamin a, probiotic + prebiotic)

**Resolution:** the tri-resolution already specced for Arc B Phase B-1.3 (`computeMealCombos(date)` — tag-match OR name-match OR state-match) handles the keying difference at the consumer. Arc C's job is just to document the convention IN `COMBO_RULES` itself so a future PR adding a rule #7 knows the tri-resolution applies.

**Mechanical action:**
1. Add a docstring comment to `COMBO_RULES` documenting: "Each rule's `foods` array is keyed via tri-resolution per V-K-53: (1) nutrient-tag match against `NUTRITION[food].nutrients[]`, OR (2) name-match against `_baseFoodName(food)` (catches rule #6 `banana`), OR (3) state-match against active illness episodes via `intelligence-illness.js` (catches rule #6 `constipation` — cross-Region read)."
2. Document the rule #6 specifically as the canonical example of name-match + state-match.

**No structural change.** Documentation-only.

**LOC impact:** ~15 lines of comment block.

## PR sequence

| PR | Name | Scope | Branch | Jurisdiction | QA chain |
|----|------|-------|--------|--------------|----------|
| **C-0** | **Arc C spec (this PR)** | This document | `claude/session-handoff-docs-gxYiL` | docs-only | Maren + Kael Mode-1 cross-consult on the cleanup approach → Lyra synth → Cipher Edict V (docs-only sub-pass) → Architect ratification |
| C-1 | Dedupe duplicate NUTRITION keys | `split/data.js` NUTRITION block | `claude/sproutlab-food-db-cleanup-p1` | Maren + Kael (shared module — data.js is Kael's jurisdiction but care-adjacent due to allergen/safety implications); Vela waived (no render touch) | Maren + Kael Mode-1 in parallel → Lyra synth → Cipher Edict V. Estimated LOC: net negative (~10–20 removed, ~5–10 added). |
| C-2 | _FOOD_ALIASES discipline + docstring | `split/data.js:2115–2125` | `claude/sproutlab-food-db-cleanup-p2` | Maren + Kael | Maren + Kael Mode-1 → Lyra synth → Cipher Edict V. ~10 LOC inline comment. |
| C-3 | Synonym-key references in FOOD_SYNERGIES + COMBO_RULES + SEASONAL_INDIA_INDEX | `split/data.js` adjacent tables | `claude/sproutlab-food-db-cleanup-p3` | Maren + Kael | Maren + Kael Mode-1 → Lyra synth → Cipher Edict V. ~15–25 LOC changed. |
| C-4 | Rename `chem.fibre` → `chem.fibreCharacter` across NUTRITION + consumers | `split/data.js` NUTRITION + downstream consumer call sites | `claude/sproutlab-food-db-cleanup-p4` | Maren + Kael + **Vela** (Vela's first audit-mode invocation — `intelligence-cards.js` consumers may exist for `renderInfo*` cards that read `chem.fibre`); shared-module review depends on whether template/CSS touch occurs (likely not) | Maren + Kael + Vela Mode-1 in parallel → Lyra synth → Cipher Edict V. ~50–80 LOC NUTRITION + ~5–10 LOC consumers. |
| C-5 | Document COMBO_RULES tri-resolution convention | `split/data.js:2463` comment block | `claude/sproutlab-food-db-cleanup-p5` | Kael primary (architectural docs); Maren cross-consult (touches a rule that has a care-tier interaction surface — rule #6 banana+constipation) | Kael Mode-1 + Maren cross-consult → Lyra synth → Cipher Edict V. ~15 LOC comment. |

**Total Arc C:** 5 ship PRs after the spec ratification. Estimated total LOC: ~60–120 LOC net (some net-negative phases, some net-additive).

**Dependency on Arc B Phase B-1:** Arc B Phase B-1 should land AFTER Arc C Phase C-1 (or after the full Arc C) so the keystone trio joins clean food-DB data. The user's chosen sequencing — "spec now, ship before B-1" — is the recommended path.

**Dependency on Arc A:** Arc A is independent of Arc C; Arc A Phase 5 (per-food detail overlay with Chemistry sub-tab) consumes `chem.*` and benefits from C-4's rename, but the dependency is one-way (Arc A Phase 5 should consume the post-C-4 schema). If Arc A Phase 5 lands before C-4, the consumer code in Arc A Phase 5 will need a follow-up rename.

## Regression guards

- `regression-guard-no-duplicate-nutrition-keys` (C-1): every entry in `NUTRITION` has a unique canonical key (sweep test).
- `regression-guard-all-synonyms-aliased` (C-1 + C-2): every removed synonym appears in `_FOOD_ALIASES` mapping to its canonical.
- `regression-guard-food-synergies-canonical-keys` (C-3): every food-name reference in `FOOD_SYNERGIES` resolves to a canonical NUTRITION key (sweep).
- `regression-guard-combo-rules-canonical-keys` (C-3): every food-name reference in `COMBO_RULES.foods` resolves to a canonical NUTRITION key (with the explicit exception of state-match references — `constipation` — which are illness-state, not food).
- `regression-guard-chem-fibre-character-rename` (C-4): no reference to `chem.fibre` remains in `split/*.js` post-rename (sweep test); all reads use `chem.fibreCharacter`.
- `regression-guard-combo-rules-tri-resolution-docstring` (C-5): the documented convention matches the Arc B Phase B-1.3 implementation (cross-doc consistency check; mechanical at merge time).

## HR pre-check

| HR | Predicted risk | Mitigation |
|----|----------------|------------|
| HR-1 (no emojis) | n/a | data-only |
| HR-2 (no inline styles) | n/a | data-only |
| HR-3 (no inline handlers) | n/a | data-only |
| HR-4 (escHtml at render boundaries) | low | data-only; render-boundary escHtml is at consumer surfaces (Vela's render layer post-canon-gen-001), not in data.js |
| HR-5 (tokens-only) | n/a | data-only |
| HR-6 (data-action delegation) | n/a | data-only |
| HR-7 (zi via innerHTML) | n/a | data-only |
| HR-8 (Coming-soon stubs) | n/a | no stubs |
| HR-9 (post-build multi-round QA) | structural | Every phase runs canon-cc-008 chain |
| HR-10 (no text-overflow ellipsis) | n/a | data-only |
| HR-11 (Math.floor currency) | n/a | no currency |
| HR-12 (timezone-safe dates) | n/a | no date construction |

## Open questions

1. **Should C-4 (rename `chem.fibre` → `chem.fibreCharacter`) ship before or after Arc B Phase B-1?** B-1 authors `chemRollup` fresh and can use the new field name from the start IF C-4 lands first. Otherwise B-1 ships using `chem.fibre`, then a post-B-1 sweep renames at consumers. Recommended: **C-4 lands before B-1.** Phase sequence becomes C-1 → C-2 → C-4 → (Arc B Phase B-1 begins) → C-3 → C-5. The C-3 reference-substitution can lag because chemRollup doesn't read FOOD_SYNERGIES / COMBO_RULES directly; computeMealCombos reads COMBO_RULES, but only post-tri-resolution, which is tolerant of synonym keys via `_baseFoodName()` (the runtime mitigation is the safety net).

2. **What does Arc D's Vela addition mean for Arc C?** Phase C-4 (the `chem.fibre` rename) touches `intelligence-cards.js` consumers (the per-food chemistry sub-tab in Arc A Phase 5 + the `renderInfoChemVariety` card in Arc B Phase B-2). Both are Vela's jurisdiction post-canon-gen-001. C-4's audit chain therefore summons Vela alongside Maren + Kael. **First Vela audit-mode invocation in the queue is C-4** — fitting, since C-4 is the smallest-radius Vela touch (renaming a field, not authoring a surface). C-1, C-2, C-3, C-5 are pure data.js and waive Vela.

3. **What if scout #1's "18 duplicate keys" count is wrong at merge time?** scribe-scout sweep at C-1 merge time verifies the inventory against the live NUTRITION block. If the count drifts, the inventory table above is amended in the C-1 PR (per canon-cc-027 spec amendment); if the structural approach changes, Arc C spec amendment per canon-cc-027 signing chain.

## Doctrinal references

- `docs/specs/isl-upgrade-v1.md` §Open Q 4 resolution (silent dedupe + console.warn — the runtime mitigation Arc C makes structurally unnecessary)
- `docs/specs/isl-upgrade-v1.md` §V-K-53 (COMBO_RULES tri-resolution — Arc C documents this in-table)
- `docs/specs/arc-d-third-governor-v1.md` (canon-gen-001 — Vela's jurisdiction over intelligence-cards.js consumers in C-4)
- canon-cc-027 (spec amendment signing chain)
- canon-cc-026 §Per-Province-Layout (no Province deploy needed — data spec)
- `PERSONA_REGISTRY.md` §Governors (Maren + Kael cross-jurisdiction on data.js)

---

— Lyra (main-session), 2026-05-23, against `616071c`. cc-018 status: `ratified` (Architect signature 2026-05-23 — Arc C spec enters cycle; per-phase Maren + Kael Mode-1 audits run at each ship PR per the table above).
