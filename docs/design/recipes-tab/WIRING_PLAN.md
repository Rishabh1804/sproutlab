# Diet → Recipes — wiring plan (design → live app)

**Status:** design exploration complete & ratified (see `SESSION_HANDOFF.md`); this is the
**implementation blueprint** for moving the records under `docs/design/` into the live
`split/` app. Authored 2026-06-03 (Lyra). Line numbers are **as-of-authoring starting
points** — re-confirm against current source before editing.

> Read first: `SESSION_HANDOFF.md` (the 7 ratified decisions + open items),
> `DESIGN_PRINCIPLES.md` §9 (the incoming patterns), `RECIPE_RESEARCH.md` (cited corpus).
> This is design-record only — **wiring runs the canon-cc-008 Governor QA gate** (§8).

---

## Context
The Diet tab has three live sub-tabs (Log / Library / Patterns). Add a **fourth live
sub-tab "Recipes"** that (a) suggests recipes from Ziva's actually-logged food data, and
(b) offers a browsable catalog — built on a **deep-researched corpus, not assumed** recipes.
The app already has a rich recipe ecosystem (`COMBO_RECIPES`, `generateBasicRecipe/Dos/Donts`,
`CURATED_COMBOS`, `FOOD_SUBCATS`) plus suggestion engines (`computeVarietyScore`,
`getUntriedSuggestions`) and the shipped 4-class diet-preference gate — so this is mostly
**composition + a vetted corpus**, not new engines.

**Scope (locked):** new Diet sub-tab, 4th alongside Log/Library/Patterns · all diet
preferences, gated via the shipped diet-preference gate · corpus 6–12 month, Indian + global,
focused ~25–35 recipes.

## 0. Design protocol — render-first (binding)
The Recipes-tab UI (and the revised "Can I give this?" results) is **finalized through
renderings the Architect signs off BEFORE it is wired live** — not finalized in code first.
The design records under `docs/design/recipes-tab/` are that sign-off. `DESIGN_PRINCIPLES.md`
is the design authority: recipe-card colour follows §Tint System (#217) + §Food-Domain Colour
& the Polarity Collision (#218) — the **food-domain whisper** (`.dt-*`, keyed to the primary
ingredient's `FOOD_TAX` domain; safety/age on a separate structural channel), plus the house
rules (7 domains, design tokens, Fraunces/Nunito, HR-1…12, the 2 AM half-awake test). This
design gate sits **upstream** of the canon-cc-008 code gate.

## 1. Tab scaffolding (mirror the existing sub-tab pattern exactly)
- `split/template.html` (~833, inside `#dietSubBar`):
  `<button class="track-sub-btn diet-sub-btn" data-action="switchDietSub" data-diet-sub="recipes" role="tab" aria-selected="false">Recipes</button>`
- `split/template.html` (~1058, before the `#tab-diet` close): add
  `<div class="diet-sub-panel" id="diet-sub-recipes" role="tabpanel">` with
  `<div class="grid" id="dietRecipesRoot"></div>`, mirroring `#diet-sub-patterns` (~1028-1056).
- `split/diet.js` (~16): `DIET_SUB_ORDER` += `'recipes'`.
- **`split/core.js` (~3699): `DIET_INNER_ORDER` += `'recipes'`** — the swipe handler; MUST
  stay in sync with the tab bar (load-bearing; easy to miss).
- `split/diet.js` (~35): lazy hook —
  `if (subKey==='recipes' && typeof renderDietRecipes==='function') renderDietRecipes();`
- `switchDietSub` is already dispatched at `core.js` (~616) — no new delegation entry.
  **Never edit generated `index.html` / `sproutlab.html`.**

## 2. What the tab shows (one panel, three stacked sections — no nested tabs)
- **(a) "Suggested for Ziva"** — 3–5 logged-data-driven recipe cards (ranking §4).
  Cold-start (<7d signal) → fall back to `CURATED_COMBOS` via
  `window._fdGetCuratedCombosForMeal` (data.js ~3476), age-gated.
- **(b) Browsable catalog — grouped by meal slot** (Breakfast/Lunch/Dinner/Snack):
  `CURATED_COMBOS` carries `slot`, `generateMealOptions(meal,…)` is meal-keyed, matches the
  Log mental model. Source = new `RECIPES` corpus + legacy `COMBO_RECIPES` folded in at render.
- **(c) Detail = expand-in-place** under the card (no new overlay). Reuse the recipe/dos/donts
  render from `renderComboResult` (diet.js ~2105-2114) + the per-ingredient safety flag stack
  from `renderFoodDetailSheet` (diet.js ~648-711, `_severeFloorHtml`).
- New `renderDietRecipes()` + helpers in `diet.js` (Maren's file, beside the renders it reuses).
  Single `innerHTML` boundary; every substring `escHtml()`'d (HR-4).

## 3. Recipe data model — NEW module `split/recipes.js`
A flat `{recipe,dos,donts}` `COMBO_RECIPES` can't carry structured ingredients, slot, age,
citation, or diet class. Add a richer `RECIPES` constant; keep `COMBO_RECIPES` as-is
(combo-checker still uses it), fold its entries into the catalog at render.

```
{ id, title, slot, minAgeMonths,
  ingredients:[{name, qty}],        // name = the form the LIVE resolver classifies correctly
  foodGroups:[FOOD_TAX pids],       // gap-fill scoring + card colour
  steps:[…], dos:[…], donts:[…],
  cuisine, source:{org,doc,url,page} }   // citation per recipe — "no assumptions"
```

- **New file `split/recipes.js`** (Kael data-jurisdiction; **Maren-primary on content**) —
  a 25–35 recipe corpus is too large for data.js (near the 30K frontier). Define `RECIPES` +
  `window.RECIPES = RECIPES` (the `window.CURATED_COMBOS` pattern, data.js ~3433).
- **`split/build.sh`** — add `cat recipes.js` between `cat data.js` and `cat core.js` so
  `RECIPES` is defined before consumers load (verify concat order).

## 4. "Suggested for Ziva" ranking (compose existing scorers — no new engine)
Candidates = `RECIPES` where `minAgeMonths ≤ ageMonths` AND all ingredients pass the
surfacing gate (§5). Score per recipe:
- +3 per `foodGroups` member in `computeVarietyScore(7).gaps`; +2 if it covers a
  `subcategoryGaps` (leafy).
- +2 if any ingredient is in top-N `getUntriedSuggestions()` (reuses its nutrient-gap
  intelligence; already age + pref gated).
- +1 per ingredient matching `isFoodFavorite(_baseFoodName(name))` (diet.js ~3031).
- age-fit tiebreak; annotate header with `computeVarietyScore().rating`.

Sort desc, top 5; "why" string from `getGroupSuggestion` / the untried `reason`. Thin slots
→ `generateMealOptions` / `generateSnackOption` (diet.js ~3027/3048).

## 5. Veg-gate + safety — TWO separate passes (load-bearing invariant, core.js ~4492)
- **Pass A — surfacing (hides recipes):** every `ingredients[].name` → `_dietAllowsFood`
  (core.js ~4547); any fail → recipe withheld for that household. Fail-OPEN (matches V-V-31).
- **Pass B — safety (NEVER gated):** every ingredient of a *displayed* recipe → `_fdAgeRule`
  (diet.js ~492) + `getFoodEffect` (core.js ~4087) + `_fdAllergenNote` (diet.js ~487),
  rendered via the existing `.fd-flag-aged` / `.cons-severe` classes.
- **Recipe-level age (Ziva ~9mo):** `minAgeMonths>9` or any ingredient gate `>9` → withheld
  from "Suggested", shown in catalog **with a prominent age flag**. Honey/salt/sugar (12mo)
  catalog-flagged, never suggested.
- **Alias-precedence parity (the fish/milk lesson):** both passes use the SAME
  `_lookupByFoodName` resolver (core.js ~4034) — no new matcher. Store each ingredient name
  in the form the resolver classifies right ("egg yolk"→eggs not "egg"≠eggplant; "seer fish"→
  `getFoodEffect` null; "almond milk"/"badam doodh"→plant-milk + tree-nut note; "whole almond"→
  60mo choking gate). Verified per-recipe at authoring; pinned by e2e against the live resolver.

## 6. Deep-research methodology (execution step 1)
Via `firecrawl_search` / `WebFetch`. Indian-vocabulary-aware sources: **WHO** IYCF /
complementary feeding, **ICMR-NIN** Dietary Guidelines for Indians, **IAP**, **AAP /
HealthyChildren**, **NHS Start4Life**; AAP/WHO for allergen + choking-form cross-checks. Per
recipe: draft + cite `source`; map every ingredient through the existing resolver (§5 parity);
set `minAgeMonths ≥ max(ingredient _fdAgeRule.minMonth)` — **the app's existing AGE_RULES /
FOOD_EFFECTS table wins** on any disagreement (flag, don't override); verify texture/choking
form vs `generateBasicRecipe` age rule; author a gated non-veg subset. No recipe merges without
a source + a clean resolution trace + Maren audit. *(The records under `recipes-tab/` already
carry an initial cited corpus in `RECIPE_RESEARCH.md` + the curated set in `gen-hero.mjs` —
reconcile/extend rather than restart.)*

**Sugar stance (ratified):** adopt the **stricter WHO/NHS line** — no added sugar/jaggery for
under-2s; fruit sweetens. Overrides IAP's allowance. Strict no's (honey 1y+, jaggery, added
sugar/salt) **lead** the safety phrasing; soft prep-cautions **fold** into it.

## 7. File-by-file
| File | Jurisdiction | Change |
|---|---|---|
| `split/template.html` | shared (triple-Gov) | sub-tab button + `#diet-sub-recipes` panel + the `zif-*` food-icon sprite |
| `split/styles.css` | shared (triple-Gov) | `.recipe-card*` via tokens + `--dyn-*` for the food-domain whisper; `.dt-*` whisper-fade classes; reuse `.combo-*`/`.do`/`.dont`/`.fd-flag*` for detail. Define `--tc-peach` (referenced but undefined — see handoff). |
| `split/diet.js` | **Maren** | `DIET_SUB_ORDER`; lazy hook; `renderDietRecipes` + `_recipes*`/`_recipe*` helpers; §10 `_resolveRecipeAnswer` + revised `checkFoodCombo`/`renderComboResult` |
| `split/core.js` | Kael | `DIET_INNER_ORDER` swipe sync; `openRecipeInTab` dispatcher action (§10) |
| `split/intelligence-qa.js` | Kael | §10 `qaHandleFoodSafety` compact recipe card + tap-through |
| `split/recipes.js` (NEW) | Kael file / **Maren** content | `RECIPES` corpus + `window.RECIPES` |
| `split/build.sh` | Kael | `cat recipes.js` after data.js |
| `tests/e2e/diet-recipes.spec.ts` (NEW) | — | §9 |
| `tests/e2e/can-i-give-this.spec.ts` (NEW) | — | §9/§10 |

**Recipe-card colour (#217/#218):** colour each catalog card by the **primary ingredient's
FOOD_TAX domain** as a subtle whisper — `FOOD_TAX[pid].color` →
`_foodColorMap`/`_foodBorderMap`/`_foodTextMap` (data.js ~2114-2116) via a `--dyn-*` CSS var
(HR-2 clean). Primary ingredient = `ingredients[0]` via `classifyFoodToGroup` (diet.js ~2290).
Safety/age flags stay on the structural channel.

**Icon system:** `zif-*` is **full-colour** — a deliberate departure from the monochrome
`zi()` `currentColor` system, NOT a drop-in `zi()` call. Port the sprite from
`docs/design/gen-zi-food.mjs` into `template.html` as its own `<symbol>` set. `zif` alone does
NOT satisfy HR-1; keep it a sibling system.

## 8. QA chain (canon-cc-008 — mandatory; this is `split/` code)
`diet.js` → **Maren** · `recipes.js` + `core.js` + `intelligence-qa.js` + `build.sh` → **Kael**
· `template.html` + `styles.css` (shared) → **triple-Gov** (Maren→Kael→Vela).
`intelligence-quicklog`/`intelligence-cards` are reuse-only (no edit). **Maren-primary on the
corpus content** (sources, age gates, allergen/choking forms — tagline copy is design-quality,
NOT clinically reviewed, so Maren MUST audit it). **Maren + Kael co-own the §10 search-bar
revision** (it sits adjacent to the safety verdict on both bars). Then **Cipher** Edict-V
final-pass. PR stays **draft** until the chain clears. The `/code-review` skill does NOT
discharge the gate.

## 9. Verification
- `pnpm build` clean (recipes.js concatenated; audit-*.sh pass).
- `tests/e2e/diet-recipes.spec.ts` (model on `diet-preference-gate.spec.ts`, `?nosync`):
  1. Recipes tab renders `.recipe-card` nodes into `#dietRecipesRoot`.
  2. `pref='veg'` hides non-veg recipes; `'nonveg'` shows them.
  3. Safety path still fires for an off-pref logged food (`getFoodEffect('fish')` +
     `.cons-severe` render even when `_dietAllowsFood('fish')` is false).
  4. 9mo context: honey/whole-almond recipe withheld from "Suggested", `.fd-flag-aged` in
     catalog detail.
  5. Seeded 7-day leafy gap → a leafy/iron recipe surfaces in "Suggested" with a gap-fill "why".
  6. Alias forms through the LIVE resolver, using the actual stored `RECIPES` ingredient
     strings (`_dietNonvegSid('Egg yolk')==='eggs'`, `'eggplant'`→null,
     `getFoodEffect('seer fish')===null`, `_fdAgeRule('whole almond').minMonth ≥ 60`).
- `tests/e2e/can-i-give-this.spec.ts` (§10 search-bar revision, both bars):
  7. **Not applicable → reason, no recipe:** "honey" → `.combo-result` shows the reason/toxin
     floor and renders **no** `.combo-recipe` block (today it renders an empty one). Home
     `qaInput` "can I give honey" → reason, no recipe card.
  8. **Applicable + curated → recipe;** **applicable + none → nearest + auto** (nearest-curated
     card AND the `generateBasicRecipe` fallback).
  9. **Preference-blocked → reason, safety still fires:** `pref='veg'`, "chicken" → recipe
     SUPPRESSED with a preference reason, but the safety/age record still renders.
  10. **Home tap-through:** the Home compact recipe card's `openRecipeInTab` activates
      Track→Diet→Recipes and surfaces the recipe.

## 10. "Can I give this?" integration — recipe-aware search bar (revises current behavior)
The corpus also powers the existing **"Can I give this?"** bars, on **both** surfaces, via ONE
shared resolver (no divergence — that two-path divergence is the fish/milk defect class):
- **Patterns:** `comboInput` → `checkFoodCombo()` (diet.js ~1607) → `renderComboResult()`
  (diet.js ~2063). Today ALWAYS renders a recipe (curated or `generateBasicRecipe` synth), even
  an empty one for avoid foods (honey/salt/sugar). Verdict + reason already computed.
- **Home:** `qaInput` → Smart-Q&A `qaHandleFoodSafety()` (intelligence-qa.js ~1011) →
  `qaRenderAnswer()`. Today shows verdict + reason, **no recipe**.

**Shared resolver `_resolveRecipeAnswer(rawFoods, applicable, ctx)` in `diet.js`** (Maren —
recipe logic already lives there). Both bars call it. Applicability = verdict is NOT `avoid`
AND not preference-blocked (a non-veg food for a veg household is "not applicable for THIS
household" → reason, no recipe — but the SAFETY path still renders, never gated). Branches:
- **not applicable** → `null`; caller foregrounds the existing reason (age gate / toxin /
  preference), recipe block SUPPRESSED (fixes today's empty-recipe-for-honey).
- **applicable + curated recipe** → `{kind:'recipe', …}` — lookup order: new `RECIPES` corpus
  (by ingredient match) → legacy `COMBO_RECIPES` → render.
- **applicable + none** → `{kind:'suggest', nearest, auto}` — `nearest` = closest curated
  `RECIPES` entry by `foodGroups`/ingredient overlap + age-fit + diet-gate (reuse §4 scorers +
  `classifyFoodToGroup`); `auto` = today's `generateBasicRecipe` kept as the "or make it
  simply" fallback.

**Per-surface render:**
- **Patterns** — full recipe / nearest+auto inline, as today's `renderComboResult` recipe
  section (diet.js ~2105) but now applicability-gated and corpus-sourced.
- **Home Smart-Q&A** — a COMPACT recipe card (title + "Recipe →") added to
  `qaHandleFoodSafety`'s answer (intelligence-qa.js, **Kael**), with a tap-through
  `data-action="openRecipeInTab" data-arg="<recipeId>"` → new dispatcher action (core.js) that
  `switchTab('diet')` + `switchDietSub('recipes')` + expands that recipe. Full recipe lives
  only in the Recipes tab (one renderer).

This **changes what "Can I give this?" shows now**: avoid foods stop showing a recipe (reason
only); the recipe source becomes the curated corpus; Home Smart-Q&A gains a recipe affordance.

## Execution order
1. **Deep-research** → author + cite the ~25–35 recipe corpus (`recipes.js`), each ingredient
   resolution-verified. → **Maren content audit gate.**
2. **Render-first design pass (§0):** the records under `docs/design/recipes-tab/` are the
   sign-off; re-render only what the corpus/scaffolding changes. **Architect sign-off before
   any wiring.**
3. Wire the live tab: scaffolding + `renderDietRecipes` + helpers + styles + `zif` sprite;
   wire `build.sh`.
4. Wire the §10 shared resolver + revise `checkFoodCombo`/`renderComboResult` (Patterns) +
   `qaHandleFoodSafety` compact card + `openRecipeInTab` action (Home).
5. e2e + `pnpm build`; commit; open draft PR.
6. Run canon-cc-008 chain (Maren + Kael + triple-Gov + Cipher); mark ready only after it clears.
