# Arc C — Food-DB Cleanup v1

**Spec version:** v1.1 (in-arc amendment 2026-05-23 — added §C-1.5 factuality audit per Architect direction after C-1 PR review surfaced pre-existing thin claims; see Amendment trail at the bottom)
**Date:** 2026-05-23
**Branch:** `claude/session-handoff-docs-gxYiL` (spec); ship branches per phase (C-1 and C-1.5 merge together — see §PR sequence)
**Author:** Lyra (main-session)
**Jurisdiction:** primarily Maren + Kael cross-consult (data.js is shared — Maren cares about food-safety implications, Kael cares about data-shape integrity); Vela has no jurisdiction on data.js (render-layer only). **C-1.5 elevates Maren to PRIMARY** (factuality audit of health-claim tags is squarely a parent-misdirection / care-tier surface; Kael's data-shape jurisdiction is secondary because no schema change — only value-level claim pruning).
**Authority:** scout #1 food-DB schema survey (cited in `docs/specs/isl-upgrade-v1.md` §Open Q 4 + V-K-49 dead-data inventory); Maren cross-consult on care implications; Architect ratification this arc. **C-1.5 added** under canon-cc-027 in-arc spec amendment authority, triggered by Architect post-C-1 review surfacing factually-thin claims in C-1-merged signal AND in pre-existing C-1-untouched entries.

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

### C-1.5 — NUTRITION factuality audit (in-arc amendment)

**Surface:** `split/data.js:2231–2377` (NUTRITION block — all 122 entries' `nutrients[]` and `tags[]` arrays). `chem.*` payloads are NOT in scope for C-1.5 — they carry mechanism-level descriptors against a different (already-tighter) factuality bar at `data.js:2210–2230`, and a future audit can revisit them if needed.

**Why this phase exists:** the C-1 PR review surfaced that the signal-merge had pulled in tags/nutrients failing the docstring's "high-confidence qualitative facts only" bar (see `data.js:2228–2230` — `it carries no mg/IU figures on purpose: only high-confidence qualitative facts are recorded, and uncertain fields are left absent rather than guessed`). The Architect's C-1 amendment (commit `4d3683e`) cleaned four C-1-touched entries (butter, rajma, cheese, amla) as a strict-subset prune, but Lyra's post-merge survey identified ~13 high-confidence TIER A strips and ~12 TIER B/C reviews in entries that C-1 didn't touch — i.e., **the factually-thin claims pre-date C-1 and would survive into Arc B Phase B-1's chemRollup join even after a clean dedupe**. Fixing them inside the same merge as C-1 keeps the food-DB cleanup arc structurally honest before the chemRollup keystone consumes it.

**The factuality bar (re-stated from the in-block docstring):**

1. **High-confidence qualitative facts only.** No claim that requires guessed mg/IU values to defend.
2. **Uncertain fields LEFT ABSENT, not guessed.** The docstring is explicit — absence is the safe default.
3. **Babyfood-relevant servings as the implicit denominator.** Claims must hold at typical introduction-age portions (5g ghee, 10g paneer, 20g sabudana, 1g turmeric in tadka, 50g cooked spinach, etc.). Per-100g claims that collapse at babyfood servings are misleading in a baby-tracker context.
4. **Care-tier parent-misdirection is the failure mode.** A wrong `iron-rich` tag on pomegranate is not a database hygiene issue — it's a parent looking up "iron sources" for a baby flagged at risk of anemia and being directed at a non-source. The bar tilts toward strip when in doubt.

**Methodology — per-entry audit framework:**

For each entry's `nutrients[]` and `tags[]`, every token is classified into one of five tiers:

| Tier | Definition | Action |
|------|------------|--------|
| **A — strip** | Claim factually wrong, or trace concentration with care-tier parent-misdirection risk, or requires unusual prep not assumed by parent (UV-mushroom for vit D). Decision can be made on USDA/IFCT primary data alone. | Remove without Maren consult — file the prune. |
| **B — review** | Claim partially holds (e.g., "iron-rich" applied where IFCT/USDA shows 1.5–2.5 mg/100g — present, but not in the same tier as cashew at 6.7 or halim at ~100). Needs Maren judgment on whether downgrade or strip. | Maren cross-consult before action. |
| **C — borderline** | Claim defensible at typical babyfood serving but the entry has a near-neighbour with the same claim at higher concentration that makes the cross-food ordering misleading. | Maren consult on cross-food consistency; may keep with note. |
| **D — spice-tier** | Claim valid per-100g but spice serving (≤1g) makes per-serving negligible. Different factuality framework — keep bioactives (e.g., curcumin has established low-dose mechanism), strip per-100g nutrient claims that don't survive serving-size scaling. | Document the spice-tier convention in the in-block docstring; apply uniformly to all spice entries. |
| **E — pass** | Claim holds at babyfood servings with USDA/IFCT backing and no care-tier misdirection risk. | No action. |

**Evidence sources (citation tier for the Maren consult, in order of precedence):**

1. **IFCT 2017** (Indian Food Composition Tables, NIN Hyderabad) — primary source for Indian foods and Indian-context preparation. Authoritative for ragi, jowar, bajra, sabudana, sattu, drumstick (pods + leaves), moringa, halim/garden cress, chiku, jamun, sitaphal, anjeer, all dals.
2. **USDA FoodData Central** — primary source for non-Indian or globally-standard foods (almonds, walnuts, blueberry, broccoli, mushroom, cheese, butter, ghee where USDA "clarified butter" entry applies, oats, etc.).
3. **Peer-reviewed mechanism reviews** — for category claims (`brain-health`, `immune-boost`, `anti-inflammatory`, `antioxidant`) — require an established mechanism AT babyfood doses, not just an in-vitro signal or per-100g extrapolation.
4. **NOT acceptable**: folk attribution (pomegranate iron-rich = colour-symbolism heritage), brand marketing (coconut-oil-is-superfood), single-RCT extrapolation, in-vitro to whole-baby extrapolation.

**Pre-audit suspect catalog (live verification at execution time; entries below are Lyra's post-C-1 read against IFCT/USDA, not the final action list — Maren cross-consult ratifies):**

#### TIER A — high-confidence strips (no Maren consult required for the action; consult on the FRAMING):

| Entry | Line | Suspect claim | Concentration check | Action |
|-------|------|---------------|---------------------|--------|
| `sabudana` | 2239 | `calcium` + `potassium` in nutrients | Tapioca pearls are ~99% carb starch; calcium ~20mg/100g, potassium ~11mg/100g — trace at any serving | Strip both from nutrients |
| `beetroot` | 2257 | `iron-rich` tag + `iron` in nutrients | IFCT: 0.8mg/100g — classic folk-misattribution (blood-colour association). Real claims: folate, betalains, vit C, manganese | Strip `iron-rich` tag + `iron` from nutrients |
| `beans` (green beans) | 2258 | `iron-rich` tag, `protein-rich` tag, `iron` in nutrients | USDA: 1mg/100g iron, 1.8g/100g protein. Both well below `iron-rich`/`protein-rich` thresholds met by dals/nuts | Strip `iron-rich` + `protein-rich` tags + `iron` + `protein` from nutrients |
| `pumpkin` | 2263 | `iron-rich` tag + `iron` in nutrients | USDA: 0.8mg/100g — same tier as beetroot. Real claims: vit A, beta-carotene, eye-health | Strip `iron-rich` tag + `iron` from nutrients |
| `broccoli` | 2264 | `iron-rich` tag + `iron` in nutrients | USDA: 0.7mg/100g. Real claims: vit C, vit K, calcium ~47mg, sulforaphane, glucosinolates | Strip `iron-rich` tag + `iron` from nutrients |
| `cucumber` | 2266 | `silica` in nutrients | Folk-claim category; cucumber silica content (~1–7 mg/100g) is not a recognised nutrient surface in IFCT/USDA. `silica` is not a downstream consumer key | Strip `silica` from nutrients |
| `ridge gourd` | 2270 | `iron-rich` tag + `iron` in nutrients | IFCT: 0.5mg/100g — care-tier parent misdirection on iron source | Strip `iron-rich` tag + `iron` from nutrients |
| `pomegranate` | 2284 | `iron-rich` tag + `iron` in nutrients | USDA: 0.3mg/100g — among the lowest. Care-tier critical. Real claims: vit C, antioxidants, polyphenols | Strip `iron-rich` tag + `iron` from nutrients |
| `chiku` (sapodilla) | 2281 | `iron-rich` tag + `bone-health` tag + `iron` + `calcium` in nutrients | IFCT: 0.8mg iron, 21mg calcium per 100g — both trace. Real claims: fibre, natural sugars, energy | Strip `iron-rich` + `bone-health` tags; strip `iron` + `calcium` from nutrients |
| `ghee` | 2295 | `vitamin D` + `omega-3` in nutrients | Ghee vit D: ~1–3 IU/tsp (trace, sun-feed dependent on the cow); omega-3: ~0.5% of total fat at most (predominantly saturated + omega-6). Real claims: butyrate, fat-soluble vitamins, vit A, healthy fats | Strip `vitamin D` + `omega-3` from nutrients; keep `vitamin A` + butyrate bioactive + CLA bioactive. Tags `bone-health` + `brain-health` to be Maren-consulted (TIER B) |
| `bitter gourd` | 2339 | `iron-rich` tag + `iron` in nutrients | IFCT: 0.4mg/100g. Real claims: vit C, momordicin, immune-boost | Strip `iron-rich` tag + `iron` from nutrients |
| `colocasia` / `arbi` | 2355, 2356 | `iron-rich` tag + `iron` in nutrients (both entries) | IFCT: ~0.6mg/100g taro. Real claims: carbs, fibre, potassium, magnesium | Strip `iron-rich` tag + `iron` from nutrients on both |
| `mushroom` | 2350 | `vitamin D` in nutrients + `bone-health` tag | Standard cultivated mushrooms (button, oyster, shiitake — un-UV-treated as sold in Indian markets) carry ~7 IU/100g vit D. UV-exposed mushrooms reach 400–1000+ IU but the parent has no way to know which they bought | Strip `vitamin D` from nutrients + `bone-health` from tags. Real claims: protein, selenium, B vitamins, zinc, immune-boost (beta-glucan), protein-rich |

**TIER A action total:** 13 entries; ~22 token strips across `nutrients[]` and `tags[]`. Net-negative LOC.

#### TIER B — Maren cross-consult required:

| Entry | Line | Question for Maren |
|-------|------|---------------------|
| `idli` | 2244 | `vitamin B12` from fermentation — is the bacterial-B12 trace defensible for a baby's protein log? Recommend strip (fermentation adds traces; not a meaningful B12 source). `iron` similar question (urad+rice base). |
| `dosa` | 2245 | Same as idli — `iron` + `vitamin B12`. |
| `drumstick` (pods, not leaves) | 2268 | Pods are ~30mg calcium/100g vs drumstick LEAVES at ~440mg/100g. Is `bone-health` tag defensible on pods alone? Recommend Maren read — possibly downgrade or strip. |
| `date` | 2280 | Dates: ~0.9mg iron, ~64mg calcium per 100g. `bone-health` is marginal; iron-rich is borderline at baby serving (1–2 dates = 5–8g). Recommend Maren read. |
| `prune` | 2289 | ~0.9mg iron — primary claim is constipation-relief (sorbitol), iron is secondary. Possibly downgrade `iron-rich` → keep `iron` in nutrients, drop the tag. |
| `coconut` (fresh) | 2290 | ~2.4mg iron (decent), but `brain-health` tag from MCT→brain-ketone pathway is contested for infants. Recommend Maren read on `brain-health` specifically. |
| `paneer` | 2297 | `brain-health` tag — same critique as cheese (which was stripped in C-1 amendment). Strip for consistency? |
| `coconut oil` | 2300 | `brain-health` + `immune-boost` — MCT→ketones for infant brain is heavily contested; lauric-acid antimicrobial is mostly in-vitro. Maren read. |
| `suji` / `rava` / `vermicelli` / `bread` | 2235, 2324, 2325, 2326 | `iron` claim depends on fortification (true for Indian-market fortified atta and most Indian fortified suji; not guaranteed for vermicelli/bread). Recommend keep `iron-rich` ON fortified-conventional Indian-context entries (suji, rava), strip from vermicelli + bread until fortification is verified. |
| `green peas` | 2343 | ~1.5mg/100g — present but below the `iron-rich` tier (chana 6.2mg, halim ~100mg). Recommend downgrade — keep `iron` in nutrients, strip `iron-rich` tag. |
| `fig` / `anjeer` | 2361, 2362 | Fresh fig ~0.4mg, dried fig ~2mg iron, ~162mg calcium per 100g. `iron-rich` defensible for dried (anjeer); marginal for fresh (`fig`). Resolve the fresh-vs-dried distinction. Possibly: dried-anjeer keeps iron-rich, fresh-fig downgrades. |
| `jamun` | 2365 | ~1.4mg iron — similar to green peas. Recommend downgrade. |

**TIER B action total:** 12 entries; expected ~8–15 token amends/strips pending Maren rulings.

#### TIER C — borderline / cross-food consistency:

| Entry | Note |
|-------|------|
| `oats` `iron-rich` | Oats ~4.7mg/100g — real, but consumed at ~25g serving = ~1.2mg. Within the `iron-rich` band other entries occupy. Keep. |
| `poha` `iron-rich` | Iron added during parboiling/fortification of poha is real — ~20mg/100g for fortified, lower for unfortified. Indian-market default tends fortified. Keep. |
| `sweet potato` claims | All solid. Keep. Listed for completeness — no action. |
| `cashew` `iron-rich` | 6.7mg/100g — solid. Keep. Listed for completeness. |
| `peanut` `iron-rich` | 4.6mg/100g — solid. Keep. |
| `raisins` `iron-rich` | 1.9mg/100g — borderline; cross-consistency with grape (~0.4mg, no iron-rich tag) makes the dried-form distinction matter. Keep iron-rich on raisins as the dried-concentrated form. |

#### TIER D — spice-tier convention:

| Entry | Line | Notes |
|-------|------|-------|
| `turmeric` | 2312 | curcumin bioactive has established low-dose mechanism (anti-inflammatory in turmeric paste applications, immune-boost via NF-κB pathway). Iron/manganese per 100g are valid but per-serving (0.5g in tadka) negligible. Keep bioactives, document spice-tier convention in docstring. |
| `jeera` / `cumin` | 2313, 2314 | Same shape — iron per 100g valid, per-serving negligible. Essential-oils bioactive real. |
| `ajwain` | 2315 | thymol real bioactive. |
| `hing` | 2316 | volatile oils — anti-inflammatory traditional use. |
| `garlic` | 2348 | allicin real bioactive; per-100g claims valid; baby use is in tadka (≤1 clove). |
| `ginger` | 2349 | gingerol real bioactive; similar. |

**TIER D action:** add a short docstring paragraph to the in-block factuality docstring (at `data.js:2210–2230`) noting that spice-tier entries — turmeric, jeera, cumin, ajwain, hing, garlic, ginger — carry per-100g nutrient claims that don't survive babyfood-serving scaling, but their `bioactives` are retained on established low-dose mechanism. Downstream consumers (chemRollup, future per-food chemistry sub-tab) should weight spice-tier `nutrients[]` per serving, not per 100g.

#### TIER E — pass (representative; full sweep at execution time):

ragi, rice, khichdi, oats (iron-rich), all dals, carrot, bottle gourd, spinach, sweet potato, tomato, zucchini, potato, ash gourd, banana, apple, pear, avocado, blueberry, mango, papaya, watermelon, muskmelon, orange, kiwi, strawberry, plum, lemon, curd, almonds, walnut, cashew, peanut, sesame, flaxseed, pumpkin seeds, amaranth, rajgira, barley, wheat, maida, roti, chapati, paratha, chickpeas, chole, soybean, moringa, drumstick leaves, snake gourd, capsicum, bell pepper, corn, cauliflower, cabbage, onion, lettuce, radish, turnip, yam, litchi, grapes, jackfruit, guava, sitaphal, custard apple, coconut water, raisins, peach, chia seeds, sunflower seeds, garden cress, halim — plus C-1's already-amended butter, rajma, cheese, amla.

**Mechanical action sequence (single execution pass):**

1. Re-read NUTRITION block top-to-bottom against the suspect catalog (live verification — IFCT/USDA values may have edge cases the catalog missed).
2. Apply TIER A strips (13 entries) — no Maren consult needed for the actions, but the audit *findings* are reported to Maren for framing review.
3. Summon Maren Mode-1 with the TIER B + TIER C catalog as the audit brief; Maren returns rulings.
4. Apply TIER B amends per Maren's rulings.
5. Apply TIER D spice-tier docstring note at the top of the NUTRITION block.
6. Add regression guards (see below).
7. Rebuild + run focused test suite + full test suite.
8. Cipher Edict V re-pass on the amendment commit.

**Regression guards (added to `tests/e2e/food-db-cleanup.spec.ts`):**

- `regression-guard-c15-no-iron-rich-without-iron`: every entry carrying the `'iron-rich'` tag must also carry `'iron'` in `nutrients[]`. Sweep test against the live NUTRITION block. Catches future TIER A regressions where someone re-adds an `iron-rich` tag without the underlying nutrient or strips the nutrient and forgets the tag.
- `regression-guard-c15-no-bone-health-without-calcium`: every entry carrying `'bone-health'` tag must carry either `'calcium'` OR `'vitamin K'` (calcium-MK7 axis acceptable) in `nutrients[]`. Catches `bone-health` overreach on entries without backing nutrient.
- `regression-guard-c15-no-vitamin-X-rich-without-vitamin-X`: shape-test for `vitamin-A`, `vitamin-C`, `vitamin-D` tags — each requires the matching nutrient token.
- `regression-guard-c15-tag-vocabulary-closed`: every tag in NUTRITION must appear in a known tag-vocabulary constant (sweep that no new tag has been silently introduced). Optional — depends on whether a centralised `TAG_VOCABULARY` constant exists; if not, defer to C-2 or future.
- `regression-guard-c15-distinct-key-floor`: maintains the C-1 floor (`>= 120` distinct NUTRITION keys post-cleanup) — C-1.5 must not delete keys, only prune within-entry tokens.

**Definition of done:**

1. Every TIER A entry's `nutrients[]` and `tags[]` arrays have been pruned per the catalog.
2. Every TIER B entry has a Maren-ratified action applied (strip / amend / keep-with-note).
3. The TIER D spice-tier convention paragraph is added to the in-block docstring.
4. All 4 new regression guards pass.
5. Full test suite green (≥129/129, post-C-1 baseline; C-1.5 may add 4 new tests → 133/133).
6. Maren Mode-1 returns `clear` or `clear-with-notes` on the audit.
7. Cipher Edict V `LGTM` on the C-1.5 commit.

**Out-of-scope (explicit non-goals for C-1.5):**

- **Allergen factuality** — `ALLERGENS` table (`data.js:2419+`) is a separate care-tier surface, Maren-primary, different audit (deferred — possibly a Phase C-1.6 if Maren surfaces issues during C-1.5).
- **AGE_RULES correctness** — minMonth thresholds (`data.js:2383+`) are Maren-primary care-tier; separate audit.
- **`FOOD_SYNERGIES` factuality** — the rationale string in each tuple (`data.js:2142+`) carries health claims (`'Omega-3 + DHA — top brain development combo'` on walnut+ghee, etc.) that may not all clear the bar. Deferred to C-3 (synergy-table audit is part of the synonym-key reference pass).
- **`COMBO_RULES` factuality** — same deferral to C-3/C-5.
- **`chem.*` factuality** — already on a different bar; if Maren surfaces a chem-factuality concern during C-1.5, escalate as a separate C-1.6 spec amendment.
- **Adding new tags/nutrients** — C-1.5 is strictly pruning. New positive claims require source citation and a separate addition phase.

**Maren cross-consult brief (the questions Maren will be asked at audit time):**

1. **Cross-food consistency on `iron-rich` framing.** After TIER A strips remove iron-rich from beetroot/broccoli/pumpkin/ridge gourd/bitter gourd/pomegranate/colocasia, the remaining `iron-rich`-tagged entries should form a defensible tier (cashew, peanut, sesame, ragi, jowar, bajra, all dals, halim, chia seeds, dates, raisins, drumstick leaves, moringa, anjeer-dried, pumpkin seeds, dalia, jamun?). Does this list pass the half-awake-parent test as a coherent "iron-rich foods" set?
2. **`brain-health` cross-food consistency.** Post-C-1 amendment, the entries claiming `brain-health` are: avocado, blueberry, coconut, almonds, walnut, cashew, sesame, flaxseed, pumpkin seeds, chia seeds, sunflower seeds, paneer (TIER B), coconut oil (TIER B). After TIER B rulings, does this list represent a defensible "brain development support" cohort?
3. **Spice-tier framing.** Is the TIER D documented convention (per-100g claims valid but per-serving negligible; bioactives retained on mechanism) clear enough that a future contributor won't re-add spice-as-iron-source claims?
4. **Mushroom UV-context.** Strip vitamin D (→ TIER A) OR keep with a context note? Recommended strip — parent has no way to know if their bought mushrooms were UV-exposed.
5. **Fortification dependence for cereals.** suji/rava (Indian fortified default) vs vermicelli/bread (less reliable). Maren's policy call.

**Kael cross-consult (secondary):**

1. Confirm no schema change — only value-level token prunes within existing `nutrients[]` and `tags[]` arrays. C-1.5 must not change the `chem` enum vocabulary, must not introduce new field names, must not remove keys (only the within-array tokens).
2. Confirm chemRollup is not yet authored (Arc B Phase B-1) — C-1.5's prunes flow into B-1 cleanly because B-1 hasn't joined yet.

**Vela:** waived (no render touch). Render-layer consumers of `nutrients[]` / `tags[]` are in Maren's home.js/diet.js territory (`renderNutrientsList`, `renderInfoChemVariety` is borderline — but is read-only of the array, not styling).

**Jurisdiction summary:**

| Governor | Role | Audit kind |
|----------|------|------------|
| Maren | Primary | Mode-1 full audit — care-tier parent-misdirection focus + cross-food consistency rulings on TIER B/C |
| Kael | Secondary | Mode-1 brief audit — schema-shape integrity + chemRollup-readiness (no schema change confirmation) |
| Vela | Waived | No render surface engaged |
| Cipher | Edict V | Final cross-cutting re-pass on the C-1.5 commit before merge |

**QA chain (canon-cc-008):**

1. Build & self-check (`bash build.sh` clean, all audit gates)
2. **Maren Mode-1 (primary)** + **Kael Mode-1 (secondary)** in parallel
3. Lyra synth — apply Maren rulings to TIER B/C, fold any Kael findings
4. Cipher Edict V on the combined C-1 + C-1.5 commit range
5. Architect ratification of the merged-together sequence
6. Merge

**PR shape:** C-1.5 ships on the **same branch as C-1** (`claude/sproutlab-food-db-cleanup-p1`) — the two phases merge together into PR #115 as a combined "C-1 + C-1.5: NUTRITION dedupe + factuality audit" shipment per Architect direction. This keeps the food-DB cleanup arc's first ship structurally and factually complete before Arc B Phase B-1's chemRollup joins it.

**LOC impact:** ~22 token strips (TIER A) + ~8–15 token amends (TIER B post-Maren) + ~5 lines spice-tier docstring + ~30–50 lines regression-guard tests. Net negative on data.js, net positive on tests/. Overall arc remains net-negative.

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
| C-1 | Dedupe duplicate NUTRITION keys | `split/data.js` NUTRITION block | `claude/sproutlab-food-db-cleanup-p1` | Maren + Kael (shared module — data.js is Kael's jurisdiction but care-adjacent due to allergen/safety implications); Vela waived (no render touch) | Maren + Kael Mode-1 in parallel → Lyra synth → Cipher Edict V. Estimated LOC: net negative (~10–20 removed, ~5–10 added). **Status:** shipped commits `9411ddc` + `60348ed` + `4d3683e` (Architect factuality amendment fold-in). |
| **C-1.5** | **NUTRITION factuality audit** | `split/data.js:2231–2377` nutrients[]/tags[] arrays across all 122 entries | `claude/sproutlab-food-db-cleanup-p1` (**same branch as C-1 — merges together into PR #115 per Architect direction**) | **Maren primary** (care-tier parent-misdirection focus) + Kael secondary (no schema change confirmation); Vela waived | Maren Mode-1 + Kael Mode-1 in parallel → Lyra synth (apply Maren TIER B rulings) → Cipher Edict V re-pass on the combined C-1 + C-1.5 range. ~22 TIER A strips + ~8–15 TIER B amends + spice-tier docstring + 4 new regression guards. Net-negative on data.js. |
| C-2 | _FOOD_ALIASES discipline + docstring | `split/data.js:2115–2125` | `claude/sproutlab-food-db-cleanup-p2` | Maren + Kael | Maren + Kael Mode-1 → Lyra synth → Cipher Edict V. ~10 LOC inline comment. |
| C-3 | Synonym-key references in FOOD_SYNERGIES + COMBO_RULES + SEASONAL_INDIA_INDEX | `split/data.js` adjacent tables | `claude/sproutlab-food-db-cleanup-p3` | Maren + Kael | Maren + Kael Mode-1 → Lyra synth → Cipher Edict V. ~15–25 LOC changed. |
| C-4 | Rename `chem.fibre` → `chem.fibreCharacter` across NUTRITION + consumers | `split/data.js` NUTRITION + downstream consumer call sites | `claude/sproutlab-food-db-cleanup-p4` | Maren + Kael + **Vela** (Vela's first audit-mode invocation — `intelligence-cards.js` consumers may exist for `renderInfo*` cards that read `chem.fibre`); shared-module review depends on whether template/CSS touch occurs (likely not) | Maren + Kael + Vela Mode-1 in parallel → Lyra synth → Cipher Edict V. ~50–80 LOC NUTRITION + ~5–10 LOC consumers. |
| C-5 | Document COMBO_RULES tri-resolution convention | `split/data.js:2463` comment block | `claude/sproutlab-food-db-cleanup-p5` | Kael primary (architectural docs); Maren cross-consult (touches a rule that has a care-tier interaction surface — rule #6 banana+constipation) | Kael Mode-1 + Maren cross-consult → Lyra synth → Cipher Edict V. ~15 LOC comment. |

**Total Arc C:** 6 ship PRs after the spec ratification (C-1, **C-1.5**, C-2, C-3, C-4, C-5) — though C-1 and C-1.5 merge together as a combined PR #115. Estimated total LOC: ~80–150 LOC net (some net-negative phases, some net-additive; C-1.5 adds ~30–50 LOC of regression-guard tests offsetting some of C-1's negative).

**Dependency on Arc B Phase B-1:** Arc B Phase B-1 should land AFTER Arc C Phase C-1 (or after the full Arc C) so the keystone trio joins clean food-DB data. The user's chosen sequencing — "spec now, ship before B-1" — is the recommended path.

**Dependency on Arc A:** Arc A is independent of Arc C; Arc A Phase 5 (per-food detail overlay with Chemistry sub-tab) consumes `chem.*` and benefits from C-4's rename, but the dependency is one-way (Arc A Phase 5 should consume the post-C-4 schema). If Arc A Phase 5 lands before C-4, the consumer code in Arc A Phase 5 will need a follow-up rename.

## Regression guards

- `regression-guard-no-duplicate-nutrition-keys` (C-1): every entry in `NUTRITION` has a unique canonical key (sweep test).
- `regression-guard-all-synonyms-aliased` (C-1 + C-2): every removed synonym appears in `_FOOD_ALIASES` mapping to its canonical.
- `regression-guard-c15-no-iron-rich-without-iron` (C-1.5): every entry with `'iron-rich'` tag must carry `'iron'` in `nutrients[]`.
- `regression-guard-c15-no-bone-health-without-calcium` (C-1.5): every entry with `'bone-health'` tag must carry `'calcium'` OR `'vitamin K'` in `nutrients[]`.
- `regression-guard-c15-no-vitamin-X-rich-without-vitamin-X` (C-1.5): tag-vs-nutrient shape test for `vitamin-A`, `vitamin-C`, `vitamin-D` (and any future single-vitamin tag).
- `regression-guard-c15-distinct-key-floor` (C-1.5): C-1.5 must not delete keys — distinct-key floor stays at ≥120.
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

## Amendment trail

| # | Date | Amendment | Authority | Status |
|---|------|-----------|-----------|--------|
| 1 | 2026-05-23 (initial) | Spec v1 — phases C-1 through C-5 | Architect ratification 2026-05-23 | `ratified` |
| 2 | 2026-05-23 (post-C-1) | Spec v1.1 — added **§C-1.5 NUTRITION factuality audit** between C-1 and C-2. Trigger: C-1 PR review surfaced that the signal-merge had pulled in tags/nutrients failing the in-block docstring's "high-confidence qualitative facts only" bar; live survey identified ~13 TIER A and ~12 TIER B suspects in entries C-1 did not touch. Architect direction: C-1.5 ships on the same branch as C-1 and merges together into PR #115. Maren elevated to PRIMARY for this phase (care-tier parent-misdirection focus). | canon-cc-027 in-arc spec amendment authority + Architect direction 2026-05-23 | `executed — Maren Mode-1 clear-with-notes (V-M-56/57/58 + TIER B rulings), Kael Mode-1 clear-with-notes (V-K-60..65, schema-shape preserved), Lyra synth applied all rulings + spice-tier docstring + 5 regression guards, 134/134 e2e green, Cipher Edict V LGTM (commit 6f8a8ce, final-pass on combined commit range)` |

---

— Lyra (main-session), 2026-05-23, against `616071c`. cc-018 status: `ratified` for v1 phases (Architect signature 2026-05-23 — Arc C spec enters cycle; per-phase Maren + Kael Mode-1 audits run at each ship PR per the table above). C-1.5 amendment status: `ratified` — Maren Mode-1 primary (clear-with-notes), Kael Mode-1 secondary (clear-with-notes), Lyra synth, and Cipher Edict V re-pass (`LGTM` on combined commit range `9411ddc..6f8a8ce`) all discharged. PR #115 ready for merge.
