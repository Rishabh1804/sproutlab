# Food-Effects v2 — P1c Milk Polarities (`drink-timing` + `substitute-caveat`)

**Companion:** Lyra (The Weaver)
**Status:** Governor spec-review FOLDED (Kael `amended`, Vela `amended`, Maren `amended`/concur — 2026-06-01; all findings folded into §0 + the body below). Ready for the wiring PR through full canon-cc-008. The wiring is **code** (FOOD_EFFECTS/render/e2e) — Cipher Edict V re-enters there; it is N/A for this docs-only spec.
**Date opened:** 2026-06-01.
**Descends from:** `docs/specs/food-effects-v2-guided-introduction.md` (the ratified v2 spec — this is a **§4-extension**, not a new model) · `docs/research/cow-milk-plant-milks-infant-safety.md` (the cited brief, PR #210) · the two manifest records `cow milk` / `plant milk` (PR #210).
**Scope of this spec:** how the two **never-rendered** foodClasses render. The taxonomy (`drink-timing`, `substitute-caveat`) is already defined in the parent spec §2; what is undefined is their **card composition** — banner polarity, gate-direction rendering, and where the emergency floor sits. This spec defines that, and registers `choking-by-form`-as-**primary** (the choking set) as deferred.

---

## 0. Governor spec-review record (2026-06-01)

All three Governors reviewed under `SPEC_ITERATION_PROCESS` before any code. All returned `amended`; findings folded into the body below. **The §3 "generalize the one card" spine and the §6 present-only floor are AFFIRMED by all three** — the amendments sharpen them, none reject.

**Kael (Intelligence engine) — `amended`.** Ratified the §7 central thesis (alias precision suffices; **no `breast`/`formula` deny-list** — a deny-list would *widen* the negation-regression surface) *on trace* of `_lookupByFoodName` (core.js:4034–4047), and ratified the §8 schema (safeForm-reuse, `reactionType:[]`, the new `thresholdBasis` values). Six findings:
- **K-1 (blocking, FIXED in-PR)** → §7: `top feed` alias dropped from `cow milk` — in Indian logs it frequently means *formula*; firing the drink-timing card (with its CMPA strip + 12-month gate) on a formula log is the §7 Care-defect entering by a different door. `top milk` kept; `animal milk` kept (it *is* the gated category — Maren confirmed copy reads correctly).
- **K-2 (blocking, FIXED in-PR)** → §7: the "Hindi forms covered" over-claim — `badam milk` (almond-milk, the code-switch form parents type) resolved to *nothing*. Added `badam milk`/`badam doodh` to `plant milk`. Bare `doodh` left **unaliased** (co-occurs in `haldi doodh`, a spiced-milk *food* — the bare-`milk` precision rule).
- **K-3 (blocking → wiring requirement)** → §7: `plant milk` resolves through the bare `'milk'` AGE_RULES key, inheriting *cow-milk* reason-copy (curd/paneer carve-out, no rice-arsenic) → **sync-gate green-but-wrong**. The wiring PR MUST add a dedicated `'plant milk'` AGE_RULES entry (minMonth:12, plant-milk reason incl. rice-<5).
- **K-4 (blocking → wiring requirement)** → §7: `cow milk` is `allergen:true` but absent from `ALLERGENS` (data.js:2688); the parent §6 `ALLERGENS↔manifest` gate would **fail the build**. Promoted from a note to a **blocking wiring requirement**: add a `cow milk` ALLERGENS entry (CMPA, pointing at the record's own `severeSigns`). `plant milk` is `allergen:false` — correctly needs none.
- **K-5 (non-blocking)** → §8: `cow milk`'s `reactionType:['renal','digestive','allergy']` introduces two un-registered enum values; the wiring PR must cite that every consumer is `arr()`/membership-based (tolerant of unknown values), per the `_effHasClass` array-trap lesson (core.js:4068).
- **K-6 (blocking → §3/§6, the review's signature catch)** → `diet.js:638` `fdEncourage` is a **two-state** polarity switch (`allergen-introduce-early`→sprout, *else-with-a-floor*→**siren/avoid rose banner**). A `drink-timing`/`substitute-caveat` record on the **Food Library detail** surface renders as an *avoid* — the §1 wrong-lead, on a SECOND surface my spec didn't cover. The floor itself is presence-safe (verified: `_severeFloorHtml` core.js:4081 keys on `severeSigns.length`, never a class string; the floor renders independent of `fdEncourage`). Resolution folded: a shared **`_effPolarity(eff)`** helper (§3-bis).

**Vela (Surfacing render) — `amended`.** Affirmed generalize-one-card; both icons (`zi('clock')` template.html:8, `zi('info')` :38) **exist**. Four findings:
- **V-V-1** → §3/§4.1/§5.1: the lead block is a **single switched unit** `{fill, icon, heading-text}` co-varying by foodClass — today the heading is hardcoded `"Why introduce early"`/`zi('sprout')` (diet.js:794–795), which is *false* on a milk card. The heading string is not reusable copy.
- **V-V-2** → §3/§4: **amber-alone is wrong** for `drink-timing`; render a **two-band split** — sage carve-out band (`zi('sprout')`, `whyGood`) over amber gate band (`zi('clock')`, `headline`) — so the reassurance leads *visually*, matching the prose order. Both fills already exist (styles.css:3988/3963) — composition, not a new class. The `safeForm.note` invariant anchors the seam.
- **V-V-3** → §3/§5: **neutral is near-invisible** as a banner (near-white wash, styles.css:80) *and* register-less; use **sky** (`--surface-sky`/`--tc-sky` — the existing drink/hydration domain color, AA-legible) with a `border-left` for weight. New `.enc-inform`/sky-modifier → shared-module triple-Gov at wiring (Vela-first). Pair-note for Kael: the record's `headline` must **front the rice-arsenic line in field order** (render honors it — it does today).
- **V-V-4** → §6: the CMPA strip on a timing card needs a **scope header** ("If your baby reacts to dairy, it's an emergency") so a parent doesn't conflate the *timing* gate with the *allergy* floor (two different axes — research Axis 1 vs Axis 5). Strip stays pinned/non-collapsible (invariant intact); only its header text is class-aware. Pair-note for Maren on the exact wording.

**Maren (Care) — `amended` / concur on present-only.** Three findings:
- **M-1** → §6: key the floor on `Array.isArray(severeSigns) && severeSigns.length`, **never on `allergen:true`** as a proxy either (a future food could be `allergen:true` with no catalogued signs, or vice-versa). The §10 e2e asserts the positive-presence path explicitly.
- **M-2** → §4.1: keep carve-out-leads-then-gate, but the 12-month *drink* gate must be **skim-proof** — the prevalent diluted-top-milk population (brief Axis 6: 81% modified) is the exact reader most likely to under-read a reassurance-led banner. The gate clause must be visually weighted equal-or-greater (coordinate with Vela V-V-2); the `safeForm.note` ("the drink is gated; the dairy is not") is the non-suppressible safety net.
- **M-3** → §7/§8: the "diluting adds no iron" line is safe and correctly non-under-warning, but must carry **no false single-body/Indian-body attribution** at wiring (it's derived mechanism — brief Axis 7 Myth 2 — not an IAP quote). Block-condition: the dilution claim ships unattributed.

**Synthesis (Lyra):** the three converge on one spine — *milk is two foods (drink-timing) and an inform-only non-food (substitute-caveat), and the render must say so without ever reading as "avoid" (K-6) or under-warning the drink line (M-2) or dropping the CMPA floor (K-4/M-1).* The biggest structural fold is **K-6's `_effPolarity` resolver** (§3-bis): the spec originally fixed only Vela's intro card, but a second surface (the Food Library detail) mis-polarized milk to a siren — one polarity source now feeds both. K-1/K-2 are already fixed in the manifest; K-3/K-4 are recorded as **blocking wiring requirements** (§7); the render amendments (V-V-1..4, M-2) reshape §3–§6.

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
| Diet-tab Food Library detail | `renderFoodLibDetail` `diet.js:638` | **`fdEncourage` is a TWO-STATE switch** → milk falls to the rose `zi('siren')` "avoid" banner (K-6, the §1 wrong-lead on a 2nd surface) | **MUST consume `_effPolarity`** (§3-bis) — conditional/inform, never siren. Floor is presence-safe regardless. |
| Resolver | `_lookupByFoodName()` (core.js) | word-boundary, alias-aware | **alias precision is load-bearing here** — §7 |

**No new render vocabulary** (V-5): the two classes map onto the existing `.enc-*` family + v3-6 card-priority + v3-5 chip-taxonomy. This spec adds *polarity branches*, not a parallel card.

## 3. The polarity → render mapping (the core deliverable)

Extends parent §4 + V-3 (polarity binds to domain color). One card, four sections (§4 fixed order), **lead block switched by foodClass polarity:**

| foodClass | Polarity | Banner fill | Banner icon | Lead block reads | Gate rendering | Emergency floor | card-priority |
|---|---|---|---|---|---|---|---|
| `acute-toxin` | Warn | rose (`--surface-rose`) | `zi('warn')` | the hazard + hard floor | hard ceiling: "blocked below `minMonth`" | present-only (honey watch-fors) | `urgent` |
| `allergen-introduce-early` | Encourage | sage (`--surface-sage`) | `zi('sprout')` | benefit + how-to + keep-offering | soft floor: "good from ~`minMonth`; not before 4mo" | **severe strip, non-collapsible** (A-1/V-1) | `notable` |
| **`drink-timing`** | **Conditional** | **SPLIT — sage carve-out band over amber gate band** (V-V-2) | **`zi('sprout')`** over carve-out, **`zi('clock')`** over gate (both confirmed present) | **the carve-out FIRST** ("dahi/paneer good now") **then the gate** ("not the main drink before 12mo"), gate visually weighted skim-proof (M-2) | **context split**: a two-band "fine in food / wait as a drink" render (§4) | **present-only** when `severeSigns` present (CMPA), with a class-aware scope header (V-V-4) — §6 | `notable` |
| **`substitute-caveat`** | **Inform** | **sky (`--surface-sky` + `--tc-sky` + `border-left`)** (V-V-3) | **`zi('info')`** (confirmed present) | **what it is and isn't** ("not a substitute under 1"); the **hard line fronted in `headline` field order** (rice <5 = arsenic) | **no hard gate**; the `safeForm.never` hard lines render as a "never" list | **none** (no `severeSigns`; harm is nutritional/chronic) | `ambient`–`notable` |

> **Resolved at spec-review (V-V-1/2/3):** (a) **The lead block is a single switched unit** `{fill, icon, heading-text}` co-varying by foodClass — the heading string switches too (`allergen-introduce-early`→"Why introduce early"; `drink-timing`→"When milk is good — and when it waits"; `substitute-caveat`→"What it is — and what it isn't"); it is NOT reusable copy (today hardcoded at diet.js:794–795). (b) `drink-timing` renders a **two-band split** (sage carve-out + amber gate), not amber-alone — both fills already exist (styles.css:3988/3963), composition not a new class. (c) `substitute-caveat` renders **sky**, not neutral (neutral is a near-invisible near-white banner) — a new `.enc-inform`/sky-modifier in `styles.css` → shared-module triple-Gov at wiring (Vela-first). (d) Icons `zi('clock')`/`zi('info')`/`zi('sprout')` all exist in the 109-sprite set (HR-1 clear, no new sprite).

## 3-bis. The polarity resolver — `_effPolarity(eff)` (K-6, the load-bearing fold)

**The spec's original §3 fixed only Vela's intro card.** Kael (K-6) traced a **second** polarity surface — `renderFoodLibDetail`'s `fdEncourage` at `diet.js:638`, a **two-state** switch: `allergen-introduce-early`→encourage/`zi('sprout')`, **everything-else-with-a-floor→allergen/`zi('siren')` rose "avoid" banner.** A `drink-timing`/`substitute-caveat` record hitting that surface renders as an **avoid** — the §1 wrong-lead, undetected because it's a different surface. (The *floor* is safe there — `_severeFloorHtml(fdEff)` at diet.js:633 is presence-driven and independent of `fdEncourage` — but the banner polarity is wrong.)

**Resolution (Kael-proposed, folded):** introduce a single **`_effPolarity(eff)` helper in `core.js`** returning `'warn' | 'encourage' | 'conditional' | 'inform'` from `foodClass` (the §3 table's "Polarity" column, as code). **Both** `diet.js:638` and Vela's `renderDietNutIntro` consume it — one polarity source, no parallel two-state booleans drifting per surface. Mapping: `acute-toxin`→`warn`; `allergen-introduce-early`→`encourage`; `drink-timing`→`conditional`; `substitute-caveat`→`inform`; (future `choking-by-form`-primary→`conditional`, §9). This is the canonical home for §3; the render surfaces switch `{fill, icon, heading, gate-render}` off the returned polarity. **Wiring requirement:** no surface may re-derive polarity from a raw `_effHasClass('allergen-introduce-early')` two-state test after this lands. (`_effPolarity` is engine — **Kael**; the two consuming renders are **Vela** (intro card) + **Maren** (diet.js Library detail) — a cross-Region helper, coordinate at wiring.)

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

**The symmetric guard (parent §8):** the floor's *presence* must key on `severeSigns` being non-empty, **never** on `foodClass === 'allergen-introduce-early'`. If the render currently gates the severe strip on the allergen class string, that is the bug this spec exists to prevent — milk would silently lose its CMPA floor.

**RESOLVED at spec-review (Kael verified, Maren concurred — present-only AFFIRMED):**
- **The code already honors it.** `_severeFloorHtml` (`core.js:4081`) gates on `Array.isArray(eff.severeSigns) && eff.severeSigns.length` — pure field presence, no `foodClass` reference; `foodConsequenceCard` (core.js:4111) calls it and uses `severity` only for chrome. Cow milk's `severeSigns` (CMPA) renders the strip automatically; a future no-`severeSigns` `drink-timing` food (salt/sugar) renders **no shell**. (The `fdEncourage` two-state switch at diet.js:638 gates only the *banner cosmetic*, NOT the floor — K-6 fixes the banner via `_effPolarity` §3-bis; the floor was never at risk.)
- **M-1 (Maren) — key on the payload, never a proxy.** The floor renders iff `severeSigns.length`, **never** on `allergen:true` either (a future record could be `allergen:true` with no catalogued signs, or carry signs without the flag). The §10 e2e (b) asserts the positive-presence path explicitly.
- **V-V-4 (Vela) — the strip needs a class-aware scope header.** On a `drink-timing` card the severe strip must carry a scope line distinguishing the *allergy* floor from the *timing* gate — e.g. **"If your baby reacts to dairy, it's an emergency"** (not the generic header at diet.js:838) — so a parent does not conflate the iron/renal *timing* harm (Axis 1) with the *anaphylaxis* harm (Axis 5). Strip stays pinned/non-collapsible (invariant intact); only the header string is polarity-aware. (Maren owns the exact wording is care-safe; Vela owns that the header must *exist* and scope-separate.)
- **M-2 (Maren) — the timing gate must outrank the myth and survive a skim.** Vertical priority: the severe floor wins over the `myth` block (floor = emergency, myth = education); and the 12-month *drink* gate clause (§4.1) must be visually weighted equal-or-greater to the carve-out lead, not a trailing subordinate clause — the prevalent diluted-top-milk population is the exact reader most likely to under-read a reassurance-led banner. The `safeForm.note` ("the drink is gated; the dairy is not") is the non-suppressible safety net under the skim risk (§4.2).

## 7. Resolver alias precision — the load-bearing safety concern (Kael)

`renderDietNutIntro` and `foodConsequenceCard` resolve a logged food via `_lookupByFoodName`. **`"milk"` is the most dangerous token in the food DB** — it appears in *breast milk*, *formula/formula milk*, *soy milk* (→ the soy allergen), and as a bare generic. **Firing the cow-milk `drink-timing` card on a "breast milk" or "formula" log would be a Care-defect** (telling a parent their breastmilk "is not the main drink before 12 months").

Design rules (Kael to ratify):
- The `cow milk` record **deliberately does NOT alias bare `"milk"`** — only `cow's milk`, `buffalo milk`, `animal milk`, `whole milk`, `dairy milk`, `top milk`, `full cream milk`, and the Hindi forms. Word-boundary matching then **cannot** fire on `breast milk` / `formula` / `soy milk`. **Verify** the resolver's word-boundary semantics hold this (e.g. `"whole milk"` must not substring-leak into `"wholemilk powder"` etc.).
- **Negation/exclusion interaction:** the `\b(no|free|without|-free)\b` negation guard (the P1b prerequisite) and any "breast"/"formula" prefix must **suppress** a cow-milk match. *Open: should the resolver carry an explicit deny-list prefix set (`breast`, `formula`, `mother's`) for the milk token, or does alias precision alone suffice?* (I lean: alias precision suffices because bare `milk` is unaliased — but Kael owns this.)
- **AGE_RULES reconciliation:** `data.js` already holds `'cow milk'`/`'cow\'s milk'`/`'milk'` at `minMonth:12` (AGE_RULES). Wiring `cow milk` into `FOOD_EFFECTS` must **reconcile** with these (the egg-yolk:7 precedent); the P0.1 sync gate (`audit-food-effects-sync-v1.sh`) must stay green across the FOOD_EFFECTS↔AGE_RULES↔manifest triple.

**RESOLVED / wiring requirements (Kael — §7 thesis ratified ON TRACE):**
- **The no-deny-list thesis is RATIFIED.** `_lookupByFoodName` word-boundary semantics (core.js:4034–4047) were traced: `breast milk` / `breastmilk` / `formula` / `formula milk` / `first infant formula` / `soy milk` all resolve to `(none)` or to the *soy* record — **not** cow milk — because `cow milk` carries no `milk`-bare alias and no `breast`/`formula` token. A deny-list is **rejected**: it would widen the `_foodNameNegated` `{0,2}`-window regression surface for a hole that doesn't exist.
- **K-1 (FIXED in this PR):** `top feed` dropped from `cow milk` aliases (≈ formula in Indian logs). `top milk`/`animal milk` kept.
- **K-2 (FIXED in this PR):** `badam milk`/`badam doodh` added to `plant milk`; bare `doodh` left unaliased (the `haldi doodh` food-collision — same precision rule as bare `milk`). §7 no longer over-claims full Hindi-form coverage; `doodh`/spiced-milk-form expansion is **deferred**.
- **K-3 (BLOCKING wiring requirement):** `plant milk` currently resolves its age-gate through the bare `'milk'` AGE_RULES key, inheriting **cow-milk** reason-copy (curd/paneer carve-out, no rice-arsenic) → sync-gate **green-but-wrong**. The wiring PR MUST add a dedicated **`'plant milk'` AGE_RULES entry** (minMonth:12, plant-milk reason incl. the rice-<5 line) so it resolves to its own gate.
- **K-4 (BLOCKING wiring requirement):** `cow milk` is `allergen:true` but absent from `ALLERGENS` (data.js:2688); the parent §6 `ALLERGENS↔manifest` gate would **fail the build**. The wiring PR MUST add a **`cow milk` ALLERGENS entry** (CMPA mild+severe framing, consistent with the record's own `severeSigns`). `plant milk` is `allergen:false` — correctly needs none (soy is handled on the soy record).

## 8. Schema questions surfaced by these two classes (for spec-review)

1. **`safeForm` repurposed as the drink-vs-food / is-isn't gate.** The records use `safeForm.ok`/`.never`/`.note` to carry the gate (not a choking gate). **Ratify** this reuse, or introduce a dedicated field (`gateForm`?). *(I lean reuse — same render shape, no new plumbing; V-2 "one block, not parallel sections.")*
2. **`reactionType: []` for `substitute-caveat`.** The harm (nutritional inadequacy + chronic arsenic) has no enum value (`acute-toxin|allergy|choking|digestive|dental|renal`). `plant milk` carries `[]` — honest, and the hub's `arr()` tolerates it (absent from the Reactions cross-cut, correctly). **Open:** add a `'nutritional'` (or `'chronic-toxin'`) value, or leave `[]`? *(I lean leave `[]` for now; revisit if a third substitute-caveat food wants the cross-cut.)*
3. **`severity` for both = `'caution'` (amber chrome), decoupled from foodClass (A-4).** Confirm amber is right for both (vs neutral for substitute-caveat — ties to §3 Vela call b).
4. **`thresholdBasis`** new values `'physiological'` (cow milk) + `'nutritional-adequacy'` (plant milk) — confirm these are acceptable additions to the open vocabulary.

**RESOLVED (Kael ratified §8(a)/(b)/(c); Maren M-3):**
- **(a) `safeForm`-as-gate — RATIFIED.** No new field; `safeForm.ok/never/note` is a render-agnostic string-list the floor renderer already consumes structurally. A dedicated `gateForm` would fork plumbing for zero benefit (V-5). The `safeForm.note` non-suppressible invariant is the correct load-bearing use.
- **(b) `reactionType:[]` for `substitute-caveat` — RATIFIED, leave `[]`.** The enum genuinely has no "nutritional inadequacy + chronic arsenic" member; `[]` is honest and the hub's `arr()` tolerates it. Adding a `'nutritional'` value is premature taxonomy — it earns its place when a *second* substitute-caveat food wants the Reactions cross-cut.
- **(c) `thresholdBasis` new values — RATIFIED.** Open-vocabulary, descriptive, non-load-bearing (no engine branches on `thresholdBasis`).
- **K-5 (non-blocking wiring check):** `cow milk`'s `reactionType:['renal','digestive','allergy']` introduces un-registered `'renal'`/`'digestive'` values. The wiring PR must **cite that every reactionType consumer is `arr()`/membership-based** (tolerant of unknown values), per the `_effHasClass` array-trap (core.js:4068) — OR register the two values in the §8 open vocabulary. (Lean: tolerant — but name the consumers, don't assume.)
- **M-3 (Maren, blocking-condition at wiring):** the "diluting adds no iron" line (record `safeForm.note`, brief Axis 7 Myth 2) is safe and non-under-warning, but is **derived mechanism, not a verbatim regulator/Indian-body line**. It must ship carrying **no attribution** implying a body stated the iron-specific dilution mechanism (IAP says "avoid watery food" — adjacent, not identical). Same no-laundering discipline the `culturalNote` already applies to the 12-month threshold.

## 9. `choking-by-form` as **primary** — the choking set (REGISTERED, DEFERRED)

The third never-standalone class. Today `choking-by-form` only rides **secondary** to an allergen (peanut/tree-nut), folded into the introduce-safely block (V-2). The **choking set** (whole grapes, nuts, popcorn, hot-dog coins, hard raw carrot) would be the **first `choking-by-form`-primary** record(s) — a *mechanical* hazard, not allergic, with **no benefit banner and no allergic floor**, leading with the **safe-form / cut-it-this-way** rule and `chokingUntilYears: 5` (parent §9.1). **Deferred to its own session** (the session chose milk-first; choking-set data-shape is "decide after the brief"). Registered here so the polarity mapping (§3) is extended with a fourth row when it lands: *Conditional · amber · `zi('cut')`? · lead = safe form by age · gate = form-gated until 5 · floor = choking-first-aid (back blows/chest thrusts), NOT anaphylaxis.* **Out of scope for this spec's review.**

## 10. e2e plan (for the wiring PR, not this spec)

- **(a)** a `drink-timing` food (cow milk) renders the **carve-out banner FIRST** (dahi/paneer affirmed) then the gate — not a "warn/avoid" banner, not a "benefit/encourage" banner.
- **(b)** the cow-milk card renders the **CMPA severe strip non-collapsibly** (present-only via `severeSigns`), with the call-112/108 + antihistamine line.
- **(c)** a `substitute-caveat` food (plant milk) fronts the **rice-<5-arsenic** hard line and renders **no severe strip**.
- **(d) the resolver guard:** `"breast milk"`, `"formula"`, `"formula milk"`, `"soy milk"` do **NOT** fire the cow-milk drink-timing card; `"cow's milk"`/`"buffalo milk"`/`"top milk"` **do**.
- **(e)** the P0.1 sync gate stays green across FOOD_EFFECTS↔AGE_RULES↔manifest with the milk records wired; ALLERGENS↔manifest link present for `cow milk`.
- **(f)** card-priority: cow milk → `notable`; honey still `urgent`; no regression to the δ encourage foods.
- **(g) K-6 — the second surface:** the **Food Library detail** (`renderFoodLibDetail`, diet.js:638) renders cow milk / plant milk as **conditional/inform via `_effPolarity`**, NOT the rose `zi('siren')` "avoid" banner; a δ encourage food still renders encourage; honey still warn.
- **(h) K-3:** a `plant milk` log resolves its age-gate to the **dedicated `'plant milk'` AGE_RULES entry** (plant-milk reason + rice-<5), not the bare `'milk'` cow-semantics key.
- **(i) K-4:** the FOOD_EFFECTS↔manifest↔ALLERGENS gate stays green with the new **`cow milk` ALLERGENS entry** present (`allergen:true` link satisfied); `plant milk` (`allergen:false`) needs none.

## 11. canon-cc-008 routing (at the wiring-PR time, NOT this spec)

- `FOOD_EFFECTS`/`ALLERGENS`/`AGE_RULES` wiring, resolver alias precision + negation guard, the sync-gate → **Kael** (engine).
- `renderDietNutIntro` polarity branches, banner color/icon, the drink-vs-food block, severe-strip placement → **Vela** (render).
- `foodConsequenceCard` log-time modal + any `diet.js` age-gate surfacing copy → **Maren** (Care).
- `styles.css` `.enc-*` additions (new banner fills/icons) → **shared module → triple-Gov** (Maren→Kael→Vela, first-Gov by heaviest-touched Region — here render, so Vela-first).
- This **spec**: Kael + Vela spec-review (Maren consult on §6); Cipher Edict V is N/A for a docs-only spec.

## 12. Spec-review decision list — RESOLVED (see §0 for the full record)

1. **Vela:** generalize the one card → **YES** (affirmed); banner — **split** for drink-timing (not amber-alone, V-V-2), **sky** for substitute-caveat (not neutral, V-V-3); icons all exist; lead block is a switched unit incl. heading (V-V-1); strip needs a scope header (V-V-4). ✓
2. **Maren:** present-only floor keyed on `severeSigns.length` → **concur** (M-1); carve-out-leads-then-gate is safe **iff** the gate is skim-proof-weighted (M-2); dilution line ships unattributed (M-3). ✓
3. **Kael:** alias precision sufficient, **no deny-list** → ratified on trace; `safeForm`-reuse + `reactionType:[]` + new `thresholdBasis` → ratified (§8); plus the K-6 second-surface catch (→ `_effPolarity`, §3-bis) and K-3/K-4 blocking wiring requirements (§7). ✓
4. **All:** §9 `choking-by-form`-primary registered-and-deferred → agreed. ✓

## 13. Out of scope (registered)

- The **wiring build** (FOOD_EFFECTS/render/e2e) — follows this spec's ratification, through full canon-cc-008.
- **Fish** (the next allergen-introduce-early-with-a-new-axis food) and **the choking set** (§9) — later sessions.
- The P1b **sustained-exposure engine** — milk is not an `allergen-introduce-early` food, so the "keep offering" nudge does not apply to it (a clean scoping boundary).
- The pre-existing `${food}` HR-4 escaping at `diet.js:1195` — close when that surface is next touched (still inherited).
