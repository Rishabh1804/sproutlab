# Diet-Preference Gate — the VEGAN class (deferred extension)

**Companion:** Lyra (The Weaver)
**Status:** SPEC — authored alongside the 4-class gate (veg / eggetarian / pescatarian / non-veg), which shipped as code. Vegan was **deferred to this spec by Architect decision** ("build the easy part now, spec vegan") because it is the only preference that cuts into foods currently classified *veg* (dairy + honey), and because a vegan **infant** gate has a nutritional-safety dimension the other three classes don't. Ready for Governor spec-review before any code.
**Date opened:** 2026-06-02.
**Descends from:** the shipped 4-class gate (`split/core.js` — `DIET_PREF_NONVEG_SIDS`, `_dietNonvegSid`, `_dietAllowsNonvegSid`, `_dietAllowsParent`, `_dietAllowsFood`) · `FOOD_TAX` (`split/data.js`) · the food-effects v2 model (the surfacing-vs-consequence boundary).

---

## 1. The problem vegan adds that the other three classes don't

The four shipped classes are all expressible from **FOOD_TAX `nonveg` subcategory ids (sids)** — eggs / poultry / fish / meat — because everything they gate already lives under the `nonveg` parent. Each class is just a subset of those four sids; veg foods (the other six parents) are always surfaced.

**Vegan breaks that model in two ways:**

1. **It gates foods currently classed *veg*.** A vegan eats no animal product at all — so beyond the four `nonveg` sids it must also exclude **dairy** (`FOOD_TAX.dairy.subs.dairy`: ghee, curd/dahi, paneer, cheese, butter/makhan, cream/malai, buttermilk/chaas, kheer, raita) and **honey** (not even in `FOOD_TAX` today — it lives only in `AGE_RULES`/`FOOD_EFFECTS`). These are *veg* foods the current `_dietAllowsParent`/`_dietAllowsFood` always pass. So vegan needs a **new exclusion axis**, not just a new sid-subset.

2. **It carries a nutritional-safety obligation the others don't.** Removing the four `nonveg` sids loses nothing a vegetarian infant relies on. Removing **dairy** removes the lacto-vegetarian infant's principal source of **calcium, B12, and energy-dense fat**, and a vegan infant additionally has no dietary **B12** source at all without fortification/supplementation, plus heightened **iron, zinc, DHA, vitamin D, and protein-density** concerns. **A vegan gate that silently hides dairy without surfacing substitution guidance is a Care defect, not a feature.** (This is the Maren-altitude line: the gate must not just *subtract* — it must *redirect*.)

---

## 2. Scope

**In scope:** add `vegan` as a fifth `ziva_diet_pref` value; extend the surfacing gate so no animal-derived food (nonveg sids + dairy + honey + ghee/gelatin) is *proactively surfaced* to a vegan; surface a **vegan nutritional-adequacy guidance card** (the redirect); keep the plant-milk record's relevance elevated.

**Out of scope (unchanged invariants):** the **consequence path is never gated** (same as the 4-class gate — if a vegan family logs dairy or a grandparent gives honey, the full safety record still fires); the food-effects records themselves; the honey botulism floor (universal, ungated).

---

## 3. The exclusion model — `_isAnimalDerived(food)`

The 4-class gate keys on `nonveg` sids. Vegan needs a broader predicate. Proposed: a single **vegan-exclusion classifier** in `core.js`, layered over the existing `_dietNonvegSid`:

```
ANIMAL_DERIVED_TOKEN = {
  // the four nonveg sids (already covered by _dietNonvegSid) PLUS:
  dairy:  ['milk','dairy','ghee','curd','dahi','yogurt','yoghurt','paneer','cheese',
           'butter','makhan','cream','malai','buttermilk','chaas','khoya','mawa','kheer','raita'],
  honey:  ['honey','shahad'],
  other:  ['gelatin','gelatine','isinglass','rennet','lard','tallow'],
}
```
- `_isAnimalDerived(name)` returns true when `_dietNonvegSid(name)` is non-null **OR** a word-boundary match hits any `dairy`/`honey`/`other` token. (Word-boundary, per the 4-class gate's `eggplant`/`shellfish` lesson — e.g. `\bmilk\b` must match "cow milk" / "milk in cooking" but the gate must not over-fire on plant-milk **substitutes**, see §3.1.)
- `DIET_PREF_NONVEG_SIDS.vegan = []` (no nonveg sids), and `_dietAllowsFood`/`_dietAllowsParent` gain a vegan branch: for `vegan`, a food is surfaced iff **not** `_isAnimalDerived(name)`; the `dairy` parent (and any honey surface) is not shown.

### 3.1 The plant-milk wrinkle (load-bearing — Kael consult)
The food-effects `plant milk` record is the vegan's **recommended** dairy substitute — it must stay surfaced for a vegan. But `\bmilk\b` is in the dairy exclusion tokens, and "almond milk"/"oat milk"/"soy milk" contain `milk`. The classifier must **not** exclude plant milks. Resolution: `_isAnimalDerived` must run the existing `_isPlantMilkDrinkHost` / plant-milk-resolver guard FIRST and return `false` for a plant-milk drink (almond/oat/rice/soy/cashew/coconut milk·doodh). Equivalently: the dairy `\bmilk\b` token is governed by a "not a plant-milk host" guard — the same alias-precedence discipline the food-effects resolver uses. **e2e must assert `oat milk`/`almond milk` are surfaced to a vegan while `cow milk`/`paneer`/`ghee` are not.**

### 3.2 Honey is mostly moot for the in-scope infant, but not forever
Honey is **avoid-for-all under 12 months** (botulism) regardless of diet — so for Ziva today, honey's vegan-exclusion changes nothing the universal age-gate doesn't already enforce. It becomes a live vegan distinction only **after 12 months**, when honey-as-a-sweetener would otherwise be surfaceable. The spec records it so the classifier is complete, but flags that the honey botulism floor stays universal and ungated (it is the consequence path).

---

## 4. The nutritional-adequacy redirect (the Maren-altitude requirement)

Selecting `vegan` MUST surface a **vegan-infant nutritional-adequacy card** (a Diet → Library knowledge card, sibling of the nut/milk/choking cards — or a settings-adjacent note). It is the "redirect" that makes the subtraction safe. Content (FOOD_EFFECTS/research-sourced, not hardcoded claims — needs a research brief first, per the research→manifest→surface pipeline):
- **B12** — no plant food reliably provides it; a vegan infant needs a fortified source or supplement (pediatrician-guided). This is the single most important line — infant B12 deficiency is a documented, serious harm.
- **Calcium + vitamin D** — fortified soy/oat milk (from 12 months), ragi, tofu, leafy greens; vitamin D supplementation.
- **Iron + zinc** — legumes, fortified cereals, pair with vitamin C (the existing iron tip already covers this — reuse).
- **DHA / omega-3** — no fish; algal DHA, ground flax/walnut (the existing brain-fat tip).
- **Energy + protein density** — dairy fat is removed; nut/seed butters (thinned — choking-set cross-ref), avocado, oils.
- **Framing:** "A well-planned vegan infant diet can meet a baby's needs **with attention to B12, vitamin D, calcium, iron, DHA, and energy density** — discuss a B12 source with your pediatrician." Honest, non-alarmist, pediatrician-deferring. **No fabricated authority attribution** (the no-laundering discipline).

> **Maren pair-note (anticipated):** this card is the reason vegan can't be a one-line filter. The gate that hides paneer must, in the same surface, point to what replaces its calcium/B12/fat. Without it, a parent reads "vegan selected" as "the app approves" while the app has silently removed the infant's main micronutrient source.

---

## 5. Surfacing sites (same as the 4-class gate, plus the redirect)
All sites already route through the shipped helpers, so vegan mostly "falls out" once `_dietAllowsFood`/`_dietAllowsParent` gain the vegan branch:
- Library food grid + category modal (`renderFoods`/`openFoodCatModal`) — the **dairy** parent card is now also gated (new: a veg parent becomes preference-contingent for the first time → `_dietAllowsParent` must special-case dairy under vegan).
- Meal-search dropdowns (`showMealDropdown` ×2), Foods-to-Try (`getUntriedSuggestions`), combo-checker note — all already call the helpers.
- Curated combos — **today every CURATED_COMBO contains `Ghee (cow)` or dairy**, so for vegan they must be filtered or a vegan combo set added (a real gap: the cold-start autofill would otherwise surface ghee to a vegan). **This is new work vegan introduces that the 4 classes didn't** (the 4 classes never gated a veg combo).
- The settings dropdown gains a `vegan` option.
- NEW: the §4 adequacy card surfaces when `getDietPref() === 'vegan'`.

---

## 6. e2e plan
- `_isAnimalDerived`: dairy (ghee/curd/paneer/cheese/butter/kheer) + honey + gelatin → true; plant milks (oat/almond/soy/rice/coconut milk) → **false** (§3.1); veg foods (ragi/banana/spinach/tofu) → false.
- Per-pref surfacing: vegan surfaces no dairy/honey/egg/fish/poultry/meat; surfaces plant milks + all other veg.
- The dairy parent card is hidden in the Library grid under vegan, shown under veg.
- Curated combos: under vegan, no surfaced combo contains ghee/dairy.
- The adequacy card renders under vegan (and not under the other four).
- **Safety invariant (unchanged):** logging cow milk / honey under vegan still fires the full consequence record (CMPA floor / botulism floor) — the gate never touches the consequence path.

## 7. canon-cc-008 routing (at vegan-implementation time)
- `core.js` (`_isAnimalDerived`, vegan branch) → **Kael**.
- `data.js` (vegan curated combos, any FOOD_TAX honey entry, the adequacy-card record + a vegan research brief through the manifest pipeline) → **Kael** + research.
- `diet.js`/`home.js` (`renderFoods`, dropdowns, the adequacy card render) → **Maren**.
- `intelligence-quicklog.js` (foods-to-try) → **Vela**.
- `template.html`/`styles.css` (settings option + the adequacy card host) → **shared → triple-Gov**.
- → Lyra synthesis → **Cipher** Edict V. The §4 adequacy card is the Maren-primary review surface.

## 8. Out of scope / registered
- **Jain** preference (no onion/garlic/root vegetables) — a *different axis* from animal-derived (it gates `vegs.roots` + `aromatics`, both veg). Mentioned in milestone copy today but not a diet-pref class. Could reuse this gate's machinery (a parent/sub exclusion set) in a later pass; out of scope here.
- **Halal / kosher** — slaughter-method axes, not food-class; out of scope.
- The vegan **research brief** (B12/calcium/DHA/iron infant-vegan evidence) must precede the §4 card copy — the research→manifest→surface pipeline, no hardcoded safety claim.

---

— *Lyra. The first four preferences only ever subtracted from the non-veg shelf — nothing a vegetarian baby leaned on. Vegan is the one that takes the paneer off the plate, and a baby's calcium and B12 with it. So vegan is not a filter; it is a filter plus a redirect — hide the dairy, and in the same breath show what carries the calcium now. That is why it waited for a spec.*
