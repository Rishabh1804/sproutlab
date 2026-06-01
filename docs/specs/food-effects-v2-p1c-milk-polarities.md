# Food-Effects v2 — P1c Milk Polarities (`drink-timing` + `substitute-caveat`)

**Companion:** Lyra (The Weaver)
**Status:** DRAFT — for Kael (engine) + Vela (render) spec-review under `SPEC_ITERATION_PROCESS` before any FOOD_EFFECTS/render code. Maren consult on the CMPA emergency-floor decision (§6).
**Date opened:** 2026-06-01.
**Descends from:** `docs/specs/food-effects-v2-guided-introduction.md` (the ratified v2 spec — this is a **§4-extension**, not a new model) · `docs/research/cow-milk-plant-milks-infant-safety.md` (the cited brief, PR #210) · the two manifest records `cow milk` / `plant milk` (PR #210).
**Scope of this spec:** how the two **never-rendered** foodClasses render. The taxonomy (`drink-timing`, `substitute-caveat`) is already defined in the parent spec §2; what is undefined is their **card composition** — banner polarity, gate-direction rendering, and where the emergency floor sits. This spec defines that, and registers `choking-by-form`-as-**primary** (the choking set) as deferred.

---

## 1. The problem this spec exists to solve

The v2 model holds **five** foodClasses (parent spec §2). Three have card composition (§4): `acute-toxin` (warn/rose, honey), `allergen-introduce-early` (encourage/sage, the δ foods), and `choking-by-form` (folded *into* the introduce-safely block, never standalone — V-2). **Two have never rendered:**

- **`drink-timing`** (cow's milk) — *conditional*. The story is **"fine in food from ~6mo; not as the main drink before 12mo."** This is **neither** honey's "avoid" **nor** the allergens' "encourage." A benefit banner ("introduce early to prevent allergy") is the **wrong lead** — milk has no such RCT claim (EAT: no prevention effect). A warn banner ("avoid") is **also wrong** — dairy *in food* is actively good now.
- **`substitute-caveat`** (plant/"artificial" milks) — *inform*. The story is **"what it is and isn't"**: not a breastmilk/formula substitute under 1; rice drinks none under 5 (arsenic); almond too low in protein. No "introduce" framing at all.

The persistent encourage card — `renderDietNutIntro()` (`diet.js:770`) — currently **filters to `allergen-introduce-early`** (`_effHasClass(fdEff, 'allergen-introduce-early')`, diet.js:638). Milk's records exist in the manifest but **no surface renders them.** This is the exact gap Phase γ closed for nuts (data present, nothing rendered for the in-scope baby), now re-opened for the two new classes.

**The core decision (for Vela):** does the **one card generalize its lead-block by polarity** (extend the δ "polarity-aware banner"), or do the new classes get **separate cards**? This spec proposes **generalize** (§3) — one card, four sections, polarity-switched lead — consistent with V-2 ("the card stays four sections regardless of class count") and V-5 ("no parallel render vocabulary").

## 2. Render-surface inventory (what a wiring PR would touch)

| Surface | File | Today | Under this spec |
|---|---|---|---|
| Persistent intro card | `renderDietNutIntro()` `diet.js:770` (`.enc-*` family, `styles.css`) | `allergen-introduce-early`-only; lead = benefit banner | **Generalize**: polarity-switched lead per foodClass (§3). Add `drink-timing` + `substitute-caveat` to the class filter. |
| Class filter / membership | `_effHasClass()` `core.js:4063` | tests one class | unchanged (already multi-class-safe) |
| Log-time consequence modal | `foodConsequenceCard()` `core.js` | A-4 decoupled — renders `watchFor`/`seekCare` on field **presence** | unchanged (presence-driven; milk's CMPA `severeSigns`/`watchFor` render automatically — verify no class-string gating regressed) |
| Diet-tab age-gate detail | `diet.js:~501,626–648` | `fdEncourage` keys on `allergen-introduce-early` | extend framing for the two classes (or leave to the intro card — Vela's call) |
| Resolver | `_lookupByFoodName()` (core.js) | word-boundary, alias-aware | **alias precision is load-bearing here** — §7 |

**No new render vocabulary** (V-5): the two classes map onto the existing `.enc-*` family + v3-6 card-priority + v3-5 chip-taxonomy. This spec adds *polarity branches*, not a parallel card.

## 3. The polarity → render mapping (the core deliverable)

Extends parent §4 + V-3 (polarity binds to domain color). One card, four sections (§4 fixed order), **lead block switched by foodClass polarity:**

| foodClass | Polarity | Banner fill | Banner icon | Lead block reads | Gate rendering | Emergency floor | card-priority |
|---|---|---|---|---|---|---|---|
| `acute-toxin` | Warn | rose (`--surface-rose`) | `zi('warn')` | the hazard + hard floor | hard ceiling: "blocked below `minMonth`" | present-only (honey watch-fors) | `urgent` |
| `allergen-introduce-early` | Encourage | sage (`--surface-sage`) | `zi('sprout')` | benefit + how-to + keep-offering | soft floor: "good from ~`minMonth`; not before 4mo" | **severe strip, non-collapsible** (A-1/V-1) | `notable` |
| **`drink-timing`** | **Conditional** | **amber (`--surface-amber`)** | **`zi('clock')`** (timing, not warn) | **the carve-out FIRST** ("dahi/paneer good now") **then the gate** ("not the main drink before 12mo") | **context split**: a two-state "fine in food / wait as a drink" render (§4) | **present-only** when `severeSigns` present (CMPA) — §6 | `notable` |
| **`substitute-caveat`** | **Inform** | **neutral (`--surface-neutral`)** | **`zi('info')`** | **what it is and isn't** ("not a substitute under 1"); the **hard line fronted** (rice <5 = arsenic) | **no hard gate**; the `safeForm.never` hard lines render as a "never" list | **none** (no `severeSigns`; harm is nutritional/chronic) | `ambient`–`notable` |

> **Vela calls (V-3 lineage):** (a) Is **amber** right for `drink-timing`, or does the conditional read better as a **split banner** (sage carve-out band + amber gate band) given the card leads reassuring? (b) Is **neutral** right for `substitute-caveat`, or **sky** (the existing hydration/drink domain color)? (c) Icon set — `zi('clock')` and `zi('info')` must exist in the 109-sprite set or be added at build (HR-1); confirm or name substitutes. *(I lean: amber for drink-timing keeps it in the caution register without alarm; neutral for substitute-caveat keeps "inform" from reading as caution — but this is render-jurisdiction.)*

## 4. `drink-timing` card composition (cow's milk) — section by section

Four sections, parent §4 fixed order, lead switched:

1. **Conditional banner (replaces the benefit banner).** Amber fill, `zi('clock')` (NOT `zi('warn')`, NOT `zi('sprout')`). Reads, in order: **the carve-out first** — `whyGood` ("Dairy in food is excellent from ~6 months — dahi, paneer, cheese…") — **then the gate** — the `headline` ("…but not as the main drink before 12 months"). The reassurance leads; the gate qualifies. *This is the §1 "neither avoid nor encourage" resolution: the parent comes away thinking "dahi is good now; milk-as-a-drink waits."*
2. **The drink-vs-food block (replaces introduce-safely).** Renders `safeForm.ok` as **"Fine now — in food"** (dahi/paneer/cheese/milk-in-cooking) and `safeForm.never` as **"Not yet — as a drink"** (cow/buffalo milk as the main drink before 12mo; diluted top-milk as a substitute; skimmed before 2; unpasteurised/mould cheeses). The `safeForm.note` ("the drink is gated; the dairy is not") is a **non-suppressible invariant** (the model's spine). `howToIntroduce.amount/when` render the after-12mo guidance (~500ml cap). The three mechanisms (the calm "why") render in the **collapse body** (calm-secondary — they explain, they don't alarm).
3. **Severe-reaction strip — the emergency floor (CMPA).** **Present-only** (§6): because cow milk carries `severeSigns` (CMPA is the most common infant allergen), the strip renders — `severeSigns[]` + the call-112/108 action — **non-collapsible, co-located, amber**, exactly as for `allergen-introduce-early`. The **antihistamine-doesn't-treat-anaphylaxis** line is part of `seekCare` and renders here. If a future `drink-timing` food has **no** `severeSigns` (e.g. salt/sugar), the strip is **absent** (present-only, never an empty shell).
4. **Myth + mild watch-fors.** The `myth` ("milk makes a baby strong — give it early" → reversed) is the highest-value relative-facing line. Mild CMPA `watchFor[]` may be calm-collapsible.

## 5. `substitute-caveat` card composition (plant milks) — section by section

1. **Inform banner (replaces the benefit banner).** Neutral fill, `zi('info')`. Reads the `headline` ("Not a milk substitute under 1. Rice drinks: none under 5 — arsenic. From age 1, fortified soy/oat only as part of a varied diet") with `whyGood` (the age-1 nuance). **The single hardest fact — rice <5 = arsenic — is fronted**, not buried.
2. **The "is / isn't" block.** `safeForm.ok` as **"From age 1, as part of a varied diet"** (fortified soy/oat); `safeForm.never` as a **"Never"** list (any plant milk as a substitute <1; rice drinks <5; almond as a main drink; carton soy as formula). The `safeForm.note` (the ranking: soy ≈ oat > almond > rice) renders calm-secondary.
3. **No severe strip.** `substitute-caveat` has no `severeSigns` (harm is nutritional inadequacy + chronic arsenic, not an acute reaction). The card has **no emergency floor** — and that is correct, not a gap. *(Cross-ref: a soy-milk **allergic** reaction routes to the existing `soy` record, which carries its own floor.)*
4. **Myth.** "Plant milk is a healthy substitute for my baby" → reversed.

## 6. The emergency floor for `drink-timing` (Maren consult)

**Decision required:** does a `drink-timing` card carry the non-collapsible severe strip? **Proposed: YES, present-only** — i.e. the strip renders **whenever the record carries `severeSigns`**, regardless of foodClass (the A-4 presence-discipline, generalized). Rationale: cow milk *is* the most common infant allergen; a parent introducing dahi must reach the CMPA red-flags + emergency action, never have them gated behind "this is a timing card, not an allergy card." This **reuses** the shipped `.cons-severe` strip and the §4.3 invariant unchanged — the floor lives in the always-visible summary slot (the γ realisation), never the collapse body.

**The symmetric guard (parent §8):** the floor's *presence* must key on `severeSigns` being non-empty, **never** on `foodClass === 'allergen-introduce-early'`. If the render currently gates the severe strip on the allergen class string, that is the bug this spec exists to prevent — milk would silently lose its CMPA floor. **Maren: confirm present-only is the right rule, and that no class-string gates the strip.**

## 7. Resolver alias precision — the load-bearing safety concern (Kael)

`renderDietNutIntro` and `foodConsequenceCard` resolve a logged food via `_lookupByFoodName`. **`"milk"` is the most dangerous token in the food DB** — it appears in *breast milk*, *formula/formula milk*, *soy milk* (→ the soy allergen), and as a bare generic. **Firing the cow-milk `drink-timing` card on a "breast milk" or "formula" log would be a Care-defect** (telling a parent their breastmilk "is not the main drink before 12 months").

Design rules (Kael to ratify):
- The `cow milk` record **deliberately does NOT alias bare `"milk"`** — only `cow's milk`, `buffalo milk`, `animal milk`, `whole milk`, `dairy milk`, `top milk`, `full cream milk`, and the Hindi forms. Word-boundary matching then **cannot** fire on `breast milk` / `formula` / `soy milk`. **Verify** the resolver's word-boundary semantics hold this (e.g. `"whole milk"` must not substring-leak into `"wholemilk powder"` etc.).
- **Negation/exclusion interaction:** the `\b(no|free|without|-free)\b` negation guard (the P1b prerequisite) and any "breast"/"formula" prefix must **suppress** a cow-milk match. *Open: should the resolver carry an explicit deny-list prefix set (`breast`, `formula`, `mother's`) for the milk token, or does alias precision alone suffice?* (I lean: alias precision suffices because bare `milk` is unaliased — but Kael owns this.)
- **AGE_RULES reconciliation:** `data.js` already holds `'cow milk'`/`'cow\'s milk'`/`'milk'` at `minMonth:12` (AGE_RULES). Wiring `cow milk` into `FOOD_EFFECTS` must **reconcile** with these (the egg-yolk:7 precedent) — and note AGE_RULES *does* key bare `'milk'`; the P0.1 sync gate (`audit-food-effects-sync-v1.sh`) must stay green across the FOOD_EFFECTS↔AGE_RULES↔manifest triple. The ALLERGENS gate extension (parent §6) applies: `cow milk` is `allergen:true` (CMPA) and needs an `ALLERGENS` link.

## 8. Schema questions surfaced by these two classes (for spec-review)

1. **`safeForm` repurposed as the drink-vs-food / is-isn't gate.** The records use `safeForm.ok`/`.never`/`.note` to carry the gate (not a choking gate). **Ratify** this reuse, or introduce a dedicated field (`gateForm`?). *(I lean reuse — same render shape, no new plumbing; V-2 "one block, not parallel sections.")*
2. **`reactionType: []` for `substitute-caveat`.** The harm (nutritional inadequacy + chronic arsenic) has no enum value (`acute-toxin|allergy|choking|digestive|dental|renal`). `plant milk` carries `[]` — honest, and the hub's `arr()` tolerates it (absent from the Reactions cross-cut, correctly). **Open:** add a `'nutritional'` (or `'chronic-toxin'`) value, or leave `[]`? *(I lean leave `[]` for now; revisit if a third substitute-caveat food wants the cross-cut.)*
3. **`severity` for both = `'caution'` (amber chrome), decoupled from foodClass (A-4).** Confirm amber is right for both (vs neutral for substitute-caveat — ties to §3 Vela call b).
4. **`thresholdBasis`** new values `'physiological'` (cow milk) + `'nutritional-adequacy'` (plant milk) — confirm these are acceptable additions to the open vocabulary.

## 9. `choking-by-form` as **primary** — the choking set (REGISTERED, DEFERRED)

The third never-standalone class. Today `choking-by-form` only rides **secondary** to an allergen (peanut/tree-nut), folded into the introduce-safely block (V-2). The **choking set** (whole grapes, nuts, popcorn, hot-dog coins, hard raw carrot) would be the **first `choking-by-form`-primary** record(s) — a *mechanical* hazard, not allergic, with **no benefit banner and no allergic floor**, leading with the **safe-form / cut-it-this-way** rule and `chokingUntilYears: 5` (parent §9.1). **Deferred to its own session** (the session chose milk-first; choking-set data-shape is "decide after the brief"). Registered here so the polarity mapping (§3) is extended with a fourth row when it lands: *Conditional · amber · `zi('cut')`? · lead = safe form by age · gate = form-gated until 5 · floor = choking-first-aid (back blows/chest thrusts), NOT anaphylaxis.* **Out of scope for this spec's review.**

## 10. e2e plan (for the wiring PR, not this spec)

- **(a)** a `drink-timing` food (cow milk) renders the **carve-out banner FIRST** (dahi/paneer affirmed) then the gate — not a "warn/avoid" banner, not a "benefit/encourage" banner.
- **(b)** the cow-milk card renders the **CMPA severe strip non-collapsibly** (present-only via `severeSigns`), with the call-112/108 + antihistamine line.
- **(c)** a `substitute-caveat` food (plant milk) fronts the **rice-<5-arsenic** hard line and renders **no severe strip**.
- **(d) the resolver guard:** `"breast milk"`, `"formula"`, `"formula milk"`, `"soy milk"` do **NOT** fire the cow-milk drink-timing card; `"cow's milk"`/`"buffalo milk"`/`"top milk"` **do**.
- **(e)** the P0.1 sync gate stays green across FOOD_EFFECTS↔AGE_RULES↔manifest with the milk records wired; ALLERGENS↔manifest link present for `cow milk`.
- **(f)** card-priority: cow milk → `notable`; honey still `urgent`; no regression to the δ encourage foods.

## 11. canon-cc-008 routing (at the wiring-PR time, NOT this spec)

- `FOOD_EFFECTS`/`ALLERGENS`/`AGE_RULES` wiring, resolver alias precision + negation guard, the sync-gate → **Kael** (engine).
- `renderDietNutIntro` polarity branches, banner color/icon, the drink-vs-food block, severe-strip placement → **Vela** (render).
- `foodConsequenceCard` log-time modal + any `diet.js` age-gate surfacing copy → **Maren** (Care).
- `styles.css` `.enc-*` additions (new banner fills/icons) → **shared module → triple-Gov** (Maren→Kael→Vela, first-Gov by heaviest-touched Region — here render, so Vela-first).
- This **spec**: Kael + Vela spec-review (Maren consult on §6); Cipher Edict V is N/A for a docs-only spec.

## 12. Open questions for spec-review (the decision list)

1. **Vela:** generalize the one card (proposed) vs separate cards? Banner colors (amber vs split for drink-timing; neutral vs sky for substitute-caveat)? Icons (`zi('clock')`/`zi('info')` exist or substitute)?
2. **Maren:** §6 — present-only severe floor for `drink-timing` (keyed on `severeSigns`, never on class string)? Is the carve-out-leads-then-gate order safe (does it ever under-warn the 12-month drink line)?
3. **Kael:** §7 — is alias precision (no bare `"milk"`) sufficient, or add a `breast`/`formula` deny-list? §8 — ratify `safeForm`-as-drink-gate reuse + `reactionType: []`. AGE_RULES (`'milk'` keyed) reconciliation + sync-gate.
4. **All:** §9 — agree `choking-by-form`-primary is registered-and-deferred, not in this review.

## 13. Out of scope (registered)

- The **wiring build** (FOOD_EFFECTS/render/e2e) — follows this spec's ratification, through full canon-cc-008.
- **Fish** (the next allergen-introduce-early-with-a-new-axis food) and **the choking set** (§9) — later sessions.
- The P1b **sustained-exposure engine** — milk is not an `allergen-introduce-early` food, so the "keep offering" nudge does not apply to it (a clean scoping boundary).
- The pre-existing `${food}` HR-4 escaping at `diet.js:1195` — close when that surface is next touched (still inherited).
