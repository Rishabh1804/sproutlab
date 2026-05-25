# Food Sub-Tab v1 — diet-tab sub-navigation + structured food-entry shape

**Spec version:** v1 — **RATIFIED 2026-05-25** (Architect: *"1-10 all defaults"*)
**Date:** 2026-05-25 (ratified same session as scoping draft)
**Branch:** `claude/food-sub-tab-v1-spec`
**Author:** Lyra (main-session — Mode-1 spec authoring)
**Status:** v1 RATIFIED — all 10 v0 scope-questions answered with Lyra's proposed defaults. F-1 implementation arc can open against this spec.
**Promoted from:**
- Chronicle §4.2 v3-8 row — names Food Sub-Tab as pre-required (parseFeeding normalizer must know the food-sub-tab incoming shape at v1 design time)
- Architect direction this session: sequencing — "we'll implement this sleep upgrade after food sub-tab arc is completed. keeps the features and upgrades sequential and easy to track."
- Existing precedent: `diet.js` (4,099 LOC) currently carries food logging + nutrition; `home.js:3266 renderFoods()` and `home.js:3358 renderFoodCatSubContent()` already implement *some* sub-tabbed food categorization on the home surface.
**Charter alignment (CV3-006 required section):**
- **Honesty** — every food-object field must round-trip without lossy assumption; allergen/choking/age-gate flags carry their source attribution
- **Extensibility** — structured food-object shape is row-addition friendly (food library extends without code change); pre-requires v3-8 parseFeeding normalizer for shape tolerance
- **Warmth** — primary UX axis. Sub-tab navigation must reduce information density (current `diet.js` is dense); structured food entry should not increase parent input burden (the "data collection easier" doctrine Architect named earlier this session)

---

## Ratification record (2026-05-25)

Architect ratified all 10 scope questions with Lyra's proposed defaults via: **"1-10 all defaults."** Locked answers:

| # | Question | Ratified answer |
|---|---|---|
| 1 | Sub-tab count + naming | **3 sub-tabs: Log / Library / Patterns** |
| 2 | Structured item shape | **Minimum `{name, qty, unit, source, nutritionRef}`** (richer fields are v2 candidates) |
| 3 | `derivedAllergens` compute site | **Write-time** (cached on the record) |
| 4 | Legacy string parsing strategy | **Best-effort tokenize against NUTRITION**; legacy `text` preserved as source-of-truth fallback |
| 5 | Quick-add chip vocabulary | **Last-7-days most-recent + last-30-days most-frequent, per meal-time slot** |
| 6 | Relationship to `home.js:3266 renderFoods` | **Relocate to Library sub-tab** |
| 7 | Cross-Region scope | **Maren primary + Vela consult + Kael consult + triple-jurisdiction on styles.css for F-1** |
| 8 | `diet.js` region split candidate | **DEFER** — keep intact; revisit if/when crosses ~5,500 LOC after F-1+F-2 |
| 9 | Smart Quick Log integration | **COEXIST** — structured entry is canonical; SQL adopts the new shape in a future arc |
| 10 | v3-8 dependency direction | **CONFIRMED** — Food Sub-Tab F-2 first, v3-8 (`parseFeeding`) after |

The rest of this spec body — proposed v0 scope, primitives, phasing, Charter alignment, HR pre-check, out-of-scope register, doctrinal references — now reads as **ratified v1 scope**. The section formerly titled "What needs ratification" is superseded by this table.

---

## What we know (the inferable signals)

1. **Pre-required by v3-8 Feeding Normalizer** — `parseFeeding(val)` must tolerate "legacy string + current object + **food-sub-tab incoming shape**." So Food Sub-Tab introduces a NEW food-object shape that's distinct from the current `feedingData[date][meal] = 'breakfast text string'`.

2. **diet.js is approaching size strain** — 4,099 LOC contains food logging + nutrition + combo intelligence + tomorrow-prep + correlation cards. Could benefit from sub-tabbed organization that breaks the surface into discrete views.

3. **home.js already has sub-tabbed food categorization** at `renderFoods()` and `renderFoodCatSubContent()`. The Food Sub-Tab arc may consolidate this into a unified diet-tab surface.

4. **NUTRITION constant** (in `data.js`) carries allergen / nutrient / fat-bearing data. Currently consumed by combo intelligence + `_detectFatContextNearTime`. A structured food-entry surface can lean on NUTRITION as the lookup source.

5. **Sequencing** — Architect direction: food sub-tab → sleep redesign arcs. So Food Sub-Tab lands as the predecessor to the sleep classifier arcs, and v3-8 (parseFeeding) lands AFTER food sub-tab introduces the new shape but BEFORE legacy consumers break.

## What I propose for v0 scope (subject to Architect ratification)

### 1. Sub-tab navigation on the diet tab

Three sub-tabs on the existing diet tab:

| Sub-tab | Purpose | Currently lives |
|---|---|---|
| **Log** | Daily meal entry (breakfast / lunch / dinner / snack) with structured items | Today scattered across `diet.js` + `home.js:3266` |
| **Library** | Food database browser — search NUTRITION, view allergens / nutrients / age-gates | `home.js:3358 renderFoodCatSubContent` (sub-tabbed food categorization) |
| **Patterns** | Combo intelligence, nutrient heatmap, allergen-trend over time | `diet.js:403 renderComboQuickChips` + `diet.js:3397 renderCorrelationCard` |

**Sub-tab nav is the surface change.** Each sub-tab consolidates what's currently scattered across diet.js + home.js.

### 2. Structured food-entry shape (the NEW shape v3-8 must tolerate)

**Current shape** (`feedingData[date][meal]`):
```js
feedingData['2026-05-25'] = {
  breakfast: 'paratha with ghee, banana',
  breakfast_time: '08:30',
  lunch: '...',
  lunch_time: '...',
  // ...
}
```

**Proposed new shape** (structured object, additive — old shape still readable via parseFeeding):
```js
feedingData['2026-05-25'] = {
  breakfast: {
    items: [
      { name: 'paratha', qty: 1, unit: 'piece', source: 'library', nutritionRef: 'paratha' },
      { name: 'ghee', qty: 1, unit: 'tsp', source: 'library', nutritionRef: 'ghee' },
      { name: 'banana', qty: 0.5, unit: 'piece', source: 'library', nutritionRef: 'banana' },
    ],
    time: '08:30',
    note: 'optional free-text',
    derivedAllergens: ['gluten', 'dairy'],  // computed from items via NUTRITION lookup
    derivedFatBearing: true,                  // computed from items via _detectFatContextNearTime extension
    // legacy compat:
    text: 'paratha with ghee, banana',        // generated string form for legacy readers
    breakfast_time: '08:30',                  // legacy field name preserved
  },
  // ...same pattern per meal
}
```

`parseFeeding(val)` (v3-8) tolerates **both** the legacy string form AND the structured form, returning a canonical object with `items[]` + `derivedAllergens[]` + `derivedFatBearing` regardless of input shape.

### 3. Migration policy

**Lazy** (mirror of `parseMedCheck` / `normalizeSleep` doctrine):
- No mass rewrite of existing `feedingData` records
- Legacy string records read through `parseFeeding` → canonical object with `items: []` derived from string-parse + best-effort NUTRITION matching
- New writes (from the structured entry form) emit the new shape
- Both shapes coexist on disk indefinitely

### 4. UX surfaces

**Log sub-tab** entry form:
- Per-meal: time picker + item list builder
- Item builder: typeahead-search from NUTRITION (existing library)
- Quick-add: most-recent + most-frequent items as one-tap chips
- Quantity / unit picker for each item (defaults from NUTRITION)
- Note field (optional)
- Save → emits structured shape; legacy string compat field generated for downstream readers

**Library sub-tab** browser:
- Search + filter by allergen / nutrient / age-gate / cuisine
- View food card: nutrition facts, allergen flags, age-appropriateness, fat-bearing marker
- Currently lives at `home.js:3358 renderFoodCatSubContent` — relocate to diet-tab Library sub-tab

**Patterns sub-tab**:
- Combo intelligence (currently `diet.js:403 renderComboQuickChips`)
- Nutrient heatmap (existing)
- Allergen-trend over time (NEW — derives from `derivedAllergens` on the structured shape)
- Cross-domain correlation cards (existing `diet.js:3397`)

## What needs ratification (Architect, please answer)

These are the open questions that block writing the implementation spec:

1. **Sub-tab count + naming** — three sub-tabs (Log / Library / Patterns) as proposed, or different cut? (e.g., do Library + Patterns merge? Is there a separate Meals or Recipes sub-tab?)
2. **Structured item shape** — `{name, qty, unit, source, nutritionRef}` minimum or richer (e.g., calories, allergen overrides, parent-noted reaction)?
3. **`derivedAllergens` computation site** — at write-time (entry form computes + persists) or at read-time (parseFeeding derives on read)? Mirrors the lazy-migration question.
4. **Legacy string parsing strategy** — best-effort tokenize against NUTRITION (matches what `_detectFatContextNearTime` already does), OR leave legacy records as `items: []` (empty) with the original string preserved for display?
5. **Quick-add chip vocabulary** — most-recent? most-frequent? per-meal-time? combinations? — UX detail but affects Log sub-tab data flow
6. **Relationship to existing `home.js:3266 renderFoods`** — relocate to Library sub-tab, or leave on home tab as the parent-facing surface? (My read: relocate; home stays for cross-tab; diet tab owns the food domain.)
7. **Cross-Region scope** — diet.js (Maren) + intelligence-quicklog.js (Vela — TSF chip semantics if structured shape surfaces there) + data.js (Kael — NUTRITION extension) + styles.css (Vela — chip vocabulary for items). Could trigger triple-jurisdiction on styles.css.
8. **Region split candidate** — diet.js at 4,099 LOC + adding three sub-tabs + structured entry pushes it toward 5,000+. Consider split into `diet-log.js` + `diet-library.js` + `diet-patterns.js` AS PART OF this arc? Or defer the split.
9. **Smart Quick Log integration** — `intelligence-quicklog.js` has its own meal-prediction flow (`_qlPredict` / `qaAnswerFavoriteFoods`). Does Food Sub-Tab's structured entry replace the SQL meal flow, supersede it, or coexist?
10. **v3-8 dependency direction** — does v3-8 (parseFeeding) land BEFORE or AFTER Food Sub-Tab v1 implementation? Chronicle implies Food Sub-Tab first (new shape) then v3-8 (normalizer tolerates the new shape) — confirm.

---

## Proposed implementation phasing (subject to scope ratification)

| Phase | Items | Region routing | Approx PR scope |
|---|---|---|---|
| **F-1** | Sub-tab navigation scaffold (Log / Library / Patterns) + structured shape schema (additive; legacy unchanged) | Maren primary (diet.js) + Vela consult (styles.css for tab nav tokens) + triple-jurisdiction on styles.css | Medium |
| **F-2** | Log sub-tab structured entry form (item builder + typeahead + quick-add) | Maren primary (diet.js); pre-requires F-1 | Large |
| **F-3** | Library sub-tab consolidation (relocate `home.js:3266 renderFoods` + add filter/search) | Maren primary; pre-requires F-1 | Medium |
| **F-4** | Patterns sub-tab consolidation (existing combo intelligence + allergen-trend NEW) | Maren primary; pre-requires F-1 | Medium |
| **F-5** | v3-8 Feeding Normalizer (`parseFeeding`) per chronicle row v3-8 | Maren + Kael (core.js) | Small-to-medium |

F-1 lands first (scaffold). F-2 / F-3 / F-4 can land in any order after F-1. F-5 lands LAST (normalizer tolerates the new shape that's already in production via F-2). This sequencing means the chronicle v3-8 row implementation kicks off after Food Sub-Tab v1 ships its core surfaces.

---

## canon-cc-008 routing (at impl-PR time, per phase)

Each phase runs its own chain:
- **F-1** — Maren primary + Vela consult (styles.css for sub-tab nav tokens) + triple-jurisdiction on styles.css (Maren first if heaviest-touched; otherwise Vela)
- **F-2 / F-3 / F-4** — Maren primary; Vela consult on UX surfaces if styles.css touched
- **F-5** — Maren primary (diet.js + core.js) + Kael secondary (core.js Feeding object schema)

Lyra synth → Cipher Edict V (with three Charter-axis checks per CV3-006) at each phase.

---

## HR pre-check (Food Sub-Tab v1 as a whole)

| HR | Risk | Mitigation |
|----|------|------------|
| HR-1 (no emojis) | low | All glyphs via `zi()` |
| HR-2 (no inline styles) | low | All sub-tab nav + entry form in `styles.css` |
| HR-3 (no inline handlers) | low | data-action delegation universal |
| HR-4 (escHtml at boundaries) | **medium** | Item name + note fields are parent input; escHtml at every render site |
| HR-5 (tokens-only) | low | Sub-tab nav binds to existing domain tokens; no ad-hoc hex |
| HR-9 (post-build multi-round QA) | structural | canon-cc-008 chain runs per phase |
| HR-12 (timezone-safe dates) | low | Entry form uses `today()` + `_currentHHMM` (existing helpers) |

---

## Charter compliance per CV3-006 (Food Sub-Tab v1 as a whole)

### Axis 1 — Intellectual honesty

- ✓ Allergen / age-gate flags carry source attribution (`source: 'library' | 'parent-noted' | 'inferred'`)
- ✓ Legacy parse → structured shape discloses confidence ("best-effort tokenize" — items array may be empty for un-parseable strings; original `text` field preserved)
- ✓ `derivedAllergens` carries provenance from NUTRITION; parent-overrides are explicit

### Axis 2 — Architectural extensibility

- ✓ New food shape designed for `parseFeeding` (v3-8) consumption — schema-aware reads via centralized normalizer
- ✓ NUTRITION-driven; adding a new food = adding a NUTRITION row (existing pattern)
- ✓ Sub-tab architecture allows adding a future fourth sub-tab without restructuring the navigation primitive

### Axis 3 — Linguistic + visual warmth

- ✓ Sub-tab navigation reduces information density on the diet tab (current 4,099-LOC density is a Care concern)
- ✓ Quick-add chips honor "data collection easier" — most-recent + most-frequent reduce parent input burden
- ✓ Empty-state honor — Log sub-tab on a fresh day says "Tap to add what Ziva had at breakfast" (CV3-003 cross-cut)
- ⚠️ Risk: structured entry has the potential to INCREASE input burden vs the current free-text. Mitigation: typeahead from NUTRITION + quick-add chips MUST be the primary flow; manual item-build is the fallback

---

## Out-of-scope (registered, not in Food Sub-Tab v1)

- **NUTRITION DB expansion** — net-new food entries are a separate concern (existing `food-db-cleanup-v1.md` lineage)
- **Multi-baby support** — Ziva-first per existing doctrine
- **External recipe import** — out per design brief constraints
- **Voice-driven food entry** — v3.x catchment C-5; not here
- **Photo-based food recognition** — v3.x+ candidate
- **Allergen alert push notifications** — depends on v3-1 recommendation pipeline + C-3 notification engine
- **Diet-side scoring integration** — depends on R-1 adaptive layer + R-6 outcome anchor

---

## Doctrinal references

- `docs/specs/sproutlab-v3-roundtable-2026-05-25.md` §4.2 v3-8 row + §3.1 Maren contribution (parseFeeding normalizer doctrine)
- `docs/specs/sproutlab-v3-charter.md` (CV3-006 — three-axis alignment required for every Mode-1 spec)
- `docs/specs/food-db-cleanup-v1.md` (lineage — NUTRITION factuality work this builds on)
- CV3-003 Honest-Empty-State (empty Log sub-tab voice)
- CV3-004 Cross-Region Pair-Note (this spec body's open question #7 surfaces the cross-Region scope)
- HR-4 (escHtml on parent-input item names + notes)
- canon-cc-008 + canon-cc-022 + canon-cc-027 (process floor)

---

## What happens after Architect ratifies scope

1. Architect responds with: scope ratification (as-is OR amended), answers to the 10 open questions, any additions/deletions.
2. Lyra amends this spec body in place — `v0 SCOPING DRAFT` → `v1 ratified`.
3. F-1 implementation PR opens against the ratified spec.
4. canon-cc-008 chain runs on F-1 (Maren + Vela + triple-jurisdiction on styles.css → Lyra synth → Cipher Edict V).
5. F-1 merges; F-2/F-3/F-4 phases open per the sequencing above.
6. v3-8 (Feeding Normalizer) opens AFTER F-2 ships the structured shape into production — chronicle row v3-8 references this dependency.

---

— *Lyra (main-session), 2026-05-25, Food Sub-Tab v0 scoping draft. Architect-direct: "let's also start food sub tab arc that's in flight." This spec is the start — scope-locking is the next move. Holding at draft pending ratification.*
