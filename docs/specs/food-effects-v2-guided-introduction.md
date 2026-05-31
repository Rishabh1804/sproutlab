# Food-Effects v2 — Guided Introduction

**Companion:** Lyra (The Weaver)
**Status:** RATIFIED — Governor spec-review folded (Maren + Vela, both `amended`); Architect ratified §9 (2026-05-30). P1a build greenlit (phased α/β/γ; see §10).
**Date opened:** 2026-05-30.
**Descends from:** `docs/NEXT_SESSION_TARGET_2026-05-30.md` §P1 · `docs/SYNTHESIS_2026-05-30_food-effects-arc.md` (research→spine→surface pipeline) · the P0.1 sync gate (`split/audit-food-effects-sync-v1.sh`, merged #181) · the P0.2 word-boundary unification (#182).
**First research artifact:** `docs/research/peanut-tree-nut-infant-safety.md` (cited; LEAP/EAT verified).

---

## 0. Governor spec-review record (2026-05-30)

Both Governors reviewed this spec under SPEC_ITERATION_PROCESS before any food code. Both returned `amended`; all findings are folded into the text below.

**Maren (Care) — `amended`.** *"The polarity flip is correct; my job is to make sure it never under-warns."* Four blocking amendments + two sharpenings:
- **A-1** → §4: severe/anaphylaxis signs + emergency action render unconditionally, never collapsible.
- **A-2** → §4/§9.1: the "ground/smooth only, never whole; grinding removes *choking* not *allergy*" line is a non-suppressible card invariant; concur `chokingUntilYears: 5`.
- **A-3** → §5: the nudge hard-suppresses on any logged reaction (`reactionLogged`); requires a reaction-marking affordance.
- **A-4** → §3/§8: `foodConsequenceCard` (`core.js:4014`) renders watch-fors/seek-care *only* when `tier==='critical'`; honey's literal `'critical'` migrating to the new taxonomy would **silently stop honey's botulism watch-fors rendering**. Decouple the render branch from the taxonomy.
- Sharpenings: `highRiskNote` non-suppressible for the eczema/egg-allergy cohort (§9.2); §6 gate must also reject Indian-body attribution for the *early-intro-prevents-allergy* claim specifically.

**Vela (Surfacing) — `amended`.** *"Calm must not mean below-the-fold."* Five findings:
- **V-1** → §4: split watch-fors — *mild* may be calm/collapsible; **severe + "call 112" is a persistently-visible, non-collapsible strip co-located with the introduce-safely block** (where the parent reads when they act). (Converges with Maren A-1.)
- **V-2** → §2/§4: multi-`foodClass` foods don't render parallel competing sections — the choking-by-form gate **folds into the introduce-safely block**; the card stays four sections, not six.
- **V-3** → §4: bind polarity to domain color — **sage** banner + affirming `zi()` icon for *encourage*; **rose** + `zi('warn')` for honey-class *avoid*; the severe strip borrows **amber** (caution), rose reserved for acute-toxin. A pre-literate read: green-topped = "do this," pink-topped = "don't."
- **V-4** → §5: nudge renders in the `calm`/`pending` chip register (never `late`/`urgent`/`skipped`), dismissible, never a CareTicket. (Concurs §9.4.)
- **V-5** → §2/§3/§4: **the word "tier" collides three ways** at the render boundary (this taxonomy; the v3-6 card-priority `urgent`/`notable`/`ambient`; the `foodConsequenceCard` `detail.tier` `critical`/`light`). **Rename the taxonomy field → `foodClass`.** And the spec **conflates two surfaces** — the log-time modal `foodConsequenceCard` (core.js, Maren's, fires below the age gate) vs the always-present Info-tab `renderInfo*` card (cards.js, Vela's). Name which surface the encourage card is.

**Synthesis (Lyra):** the two reviews converge on one spine — *benefit may lead, but the emergency floor must never move, collapse, or be confused for safety.* Folded throughout; the `tier`→`foodClass` rename and the render-decoupling (A-4 + V-5) are applied; the surface question is resolved per V-5 (§4). Remaining for the Architect: §9.

---

## 1. The problem this spec exists to solve

The food-effects layer today (`FOOD_EFFECTS` in `data.js`, Finding A) has exactly **one shape**, built around honey:

> hazard → **avoid** until N months → watch-for → seek-care.

That shape is *correct for honey* — infant botulism is an acute toxin, the 12-month floor is a hard line, cooking does not make it safe, and there is **zero upside** to early honey. Honey is a true "avoid."

It is the **wrong shape** for milk, nuts, seeds, and egg. The peanut/tree-nut research (and the parallel egg/milk/seed evidence) shows these foods **invert honey on two axes at once**, and carry a *second* hazard honey doesn't:

| Axis | Honey | Nuts / egg / seeds |
|------|-------|--------------------|
| **Card polarity** | *Warn* — "don't, before 12mo" | *Encourage* — "introduce early; delaying may *increase* allergy" (LEAP: ~81% reduction) |
| **Gate direction** | Hard ceiling — "blocked below 12mo" | Soft floor — "~6mo is good; not before 4mo" |
| **Hazard count** | One (acute toxin) | **Two** — allergy *and* choking-by-form (a removable, form-dependent hazard) |
| **Form** | Cooking does NOT remove the hazard | Grinding/smoothing **does** remove the *choking* hazard (not the allergy one) |
| **Exposure** | Binary avoid | **Sustained** — tolerance depends on *keep offering* (EAT per-protocol lesson) |

A card that tells a parent to "watch out / avoid" peanut or egg instructs the **opposite of the safe action**, and fear-framing nutritious staples causes real harm (delayed introduction → more allergy; nutritional gaps in a vegetarian diet). v2 evolves the layer from a **prohibition model** into a **guided-introduction model** that can hold *benefit*, *safe pathway*, *two hazards*, and *sustained exposure* — without losing honey's hard "avoid" where that is genuinely the truth, and **without ever letting the benefit framing move, collapse, or out-prioritize the emergency floor** (Maren A-1 / Vela V-1).

## 2. The four-category taxonomy — `foodClass` (the organizing spine)

> **Naming (Vela V-5):** the taxonomy field is **`foodClass`**, NOT `tier`. "tier" is reserved at the render boundary for the v3-6 card-priority system (`urgent`/`notable`/`ambient`) and the existing `foodConsequenceCard` `detail.tier` (`critical`/`light`). Three meanings of one word at the same boundary is a defect; `foodClass` is the food-effects taxonomy and only that.

Every food-effects record declares one or more **`foodClass`** values. A class sets the card's *polarity*, the *gate semantics*, and which sections render. Multi-class is required — nuts are two at once.

| `foodClass` | Polarity | Gate semantics | Examples | Card leads with |
|-------------|----------|----------------|----------|-----------------|
| `acute-toxin` | **Warn** (rose) | Hard ceiling — blocked below `minMonth` | honey | the hazard + the hard floor |
| `allergen-introduce-early` | **Encourage** (sage) | Soft floor — "good from ~`minMonth`; not before 4mo" | peanut, tree nut, egg, sesame/seeds, soy | the *benefit* + *how to introduce safely* + *keep offering* |
| `choking-by-form` | **Conditional** | Form-gated — safe in `safeForm.ok`, never in `safeForm.never`, whole until `chokingUntilYears` | whole nuts, whole seeds, (later: grapes, popcorn, raw carrot) | the safe *form*, folded into the introduce-safely block (V-2) |
| `drink-timing` | **Conditional** | Context-gated — fine *in food*, gated *as a drink* below `minMonth` | cow's milk (drink vs curd/paneer/cooking) | "fine in food; not as the main drink before 12mo" |
| `substitute-caveat` | **Inform** | No hard gate; not a breastmilk/formula replacement | plant/"artificial" milks (soy, almond, oat, rice) | what it *is and isn't* (soy=allergen; almond/rice low protein/fat; rice-arsenic note) |

A single food may carry several: **peanut = `['allergen-introduce-early','choking-by-form']`**; **cow's milk = `['drink-timing']`** with a dairy-in-food carve-out. Per **V-2**, a second `foodClass` does **not** add a parallel competing card section — `choking-by-form` contributes its form-gate line *into* the introduce-safely block (§4.2). The card stays four sections regardless of class count.

## 3. The schema (current fields + the v2 additions)

The manifest (`docs/research/food-effects.manifest.js`) stays the cited spine; `FOOD_EFFECTS` (`data.js`) stays the in-app projection. v2 **adds** fields; honey validates unchanged except for the `tier`→`foodClass` migration (§8).

```
food, aliases[], category, effect, minMonth, thresholdBasis, allergen,
headline, watchFor[], timeCourse, seekCare, confidence, sources[],
dashboard, brief, longform, lastReviewed, myth{claim,truth}          // EXISTING (honey)

foodClass       : string | string[]   // NEW (renamed from honey's `tier:'critical'`) — the §2 taxonomy, multi-valued
severity        : 'critical' | 'caution'  // NEW — RENDER-driving, DECOUPLED from foodClass (Maren A-4).
                                       //   Drives chrome (rose vs amber) + the consequence-render branch that
                                       //   currently keys on tier==='critical'. honey: 'critical'.
reactionType[]  : adds 'choking'       // NEW VALUE alongside acute-toxin/allergy/digestive/...
whyGood         : string               // NEW — the nutrition + prevention upside (the "advantage")
earlyIntroBenefit : {                   // NEW — the allergy-prevention case, CITED
                     claim, evidence, paradigm }
safeForm        : {                     // NEW — the form gate (choking axis); folds into the introduce-safely block
                     ok[], never[], chokingUntilYears, note }
howToIntroduce  : {                     // NEW — the first-exposure protocol
                     amount, when, watch, thenWhat, oneAtATime,
                     highRiskNote }      // highRiskNote is NON-optional & non-suppressible for the
                                        //   eczema/egg-allergy cohort (Maren §9.2 sharpening)
severeSigns[]   : string               // NEW — the anaphylaxis red-flags rendered in the non-collapsible
                                        //   severe strip (A-1/V-1), SEPARATE from the calm `watchFor[]` (mild)
```

**Render decoupling (Maren A-4 — load-bearing):** the consequence surface must stop keying watch-fors/seek-care on `tier==='critical'`. v2 renders `watchFor`/`seekCare` **whenever those fields are non-empty** (never gated on a class/severity string), and uses `severity` only for *chrome*, not *presence*. This makes the honey migration behavior-preserving and prevents the silent-disappearance class of bug (missing data → nothing rendered).

**Honesty discipline (inherited, load-bearing):** every `whyGood` / `earlyIntroBenefit` claim traces to a cited source in the brief — the P0.1 gate's "untraceable claim" invariant now also guards benefits (§6). No fabricated nutrient precision (the `explain-not-log` e2e guards "conservative chem model"). Never launder international guidance onto an Indian body's name (honey-brief lesson; the peanut brief flags the IAP-verbatim gap; §6 makes it machine-enforced).

## 4. The card (Vela's surface) — polarity, placement, and the emergency floor

**Surface (Vela V-5 — resolved):** the encourage card is a **persistent Info-tab `renderInfo*` card** (`intelligence-cards.js`, Vela's) — the parent seeks it *before* introducing. The existing **log-time modal `foodConsequenceCard`** (`core.js`, Maren's, fires when a food is logged below its gate) **stays**, and the **severe-reaction strip (below) survives into that log-time touchpoint** for `allergen-introduce-early` foods — so a parent who logs peanut below the floor still gets the red-flags + emergency action, not just a passive badge.

**Composition — four sections, fixed order:**
1. **Benefit banner** (`whyGood` + `earlyIntroBenefit.claim`) — leads for `encourage` polarity, on a **`--surface-sage`** fill with an **affirming `zi()` icon** (V-3; *not* `zi('warn')` — verify a positive symbol exists in the 109-sprite set or add one at build, HR-1). Suppressed for `acute-toxin` (honey stays warn/rose).
2. **Introduce-safely block** (`howToIntroduce` + `safeForm`) — the *amount*, *when*, *watch ~2h*, **keep offering** (§5), and — folded in for `choking-by-form` (V-2) — the **form-gate line as a non-suppressible invariant** (Maren A-2): *"ground/smooth only — never whole; grinding removes the choking risk, NOT the allergy risk; whole nuts not until ~5."* The word "safe" never appears adjacent to the food name without the form qualifier (A-2). Carries `highRiskNote` where applicable (§9.2).
3. **Severe-reaction strip — the emergency floor (Maren A-1 / Vela V-1, the gate condition).** The `severeSigns[]` (breathing trouble / face-lip-tongue swelling / floppy-lethargic) + the emergency action ("call 112; use prescribed adrenaline auto-injector") render **unconditionally, co-located with the introduce-safely block the parent acts on, in a persistently-visible, non-collapsible strip — never inside an accordion, never below a 'see more,' never truncated (HR-10, must wrap).** Chrome is **amber** (caution — serious-without-alarm), *not* full rose (rose reserved for `acute-toxin`). "Calm secondary" governs *visual weight and tone, not presence or reachability.*
4. **Mild watch-fors + myth** — the mild `watchFor[]` (hives/rash/swelling/vomiting) *may* be calm-secondary/collapsible; the `myth` ("delay to prevent" reversal) is the highest-value relative-facing line.

**The 2 AM test (Vela's lens):** a tired parent comes away thinking *"good — give Ziva peanut soon: ground, a quarter-teaspoon, in the morning; keep it up; and here are the three red-flags + call 112 if they appear"* — never *"scary allergen, avoid,"* and never acting on the benefit while the emergency floor sits unread.

HRs unchanged (HR-1 zi() icons incl. the new affirming symbol; HR-2/5 tokens; HR-3/6 data-action; HR-4 escHtml on every rendered field — close the pre-existing unescaped `${food}` at `diet.js:1195` when this surface is touched; HR-10 the severe strip wraps, never ellipsises). Fits the existing v3-6 card-priority + v3-5 chip-taxonomy systems — no parallel vocabulary (V-5): encourage cards map to card-priority `notable`, honey to `urgent`.

## 5. Sustained exposure — the engine model (Architect chose: *track it*)

The EAT lesson: tolerance depends on **repeated** exposure. Today "mark tried" is a single tick — insufficient for `allergen-introduce-early`. v2 adds an **ongoing-exposure model** (Kael's engine layer).

**Proposed shape (for Kael review — not yet built):**
- A food in `allergen-introduce-early` tracks an **exposure log**: timestamps of each logged feeding that matches the food (via the unified `_lookupByFoodName` resolver — the #182 one-semantics win). Rides on the existing feeding log; no new parent action for the happy path.
- Derived state per allergen food: `firstIntroduced`, `lastOffered`, `exposureCount`, `cadence` (offers/week over a trailing window), **and `reactionLogged`** (Maren A-3 — load-bearing).
- A **reaction-marking affordance** (dependency, Maren A-3): the parent must be able to mark that a food caused a reaction. Without it the nudge can't be gated.
- A **calm nudge** when an introduced allergen's cadence falls below target — *"Peanut's going well — keep offering a few times a week to keep tolerance up."* Precondition (Maren A-3): **`introduced && !reactionLogged && cadence-below-target`.** It **MUST suppress permanently** for any food with a logged reaction, pending deliberate parent/clinician re-enable — never automatic time-decay. *A nudge that re-offers a food the baby reacted to is a Care-blocking defect.*
- **Render register (Vela V-4):** the nudge surfaces on the Info / Today-So-Far surface in the **`calm`/`pending`** chip state — **never** `late`/`urgent`/`skipped` (those read as failure/clinical), **never** a CareTicket/alert, always dismissible.

**Open for Kael:** exposure-log location (derive-on-read from the feeding log vs persisted sidecar), trailing-window length, nudge cadence/throttle, the reaction-marking UX, interaction with the introduced-foods store. Largest new build surface — phases *after* the static card (§10 P1b).

## 6. Extend the P0.1 sync gate to ALLERGENS (Kael's #182 ledger item)

The P0.1 gate locks `FOOD_EFFECTS ↔ manifest ↔ AGE_RULES` but **not** `ALLERGENS` — which is why the dropped `soya` flag in #182 needed a *human* Care audit. v2 extends the gate with an **`ALLERGENS ↔ manifest` traceability invariant**: an `allergen-introduce-early` manifest entry must have an `ALLERGENS` note (and vice-versa), and `allergen:true` records resolve cleanly against `ALLERGENS` via the word-boundary resolver. Same Node-engine + green-but-empty self-test discipline as the existing gate.

**Plus (Maren §6 sharpening):** the gate must **reject any source attribution that names an Indian body (IAP/MoHFW/FSSAI/NHM) for the *early-introduction-prevents-allergy* claim specifically** — traceability alone won't catch a mis-attributed-but-present citation, and that's the exact laundering the peanut brief warns about (the early-intro evidence is international; no Indian-government directive was located).

## 7. Granularity — two records (Architect-decided)

Peanut and tree nut get **separate** manifest + `FOOD_EFFECTS` records sharing one brief + dashboard (`peanut-tree-nut-infant-safety.*`). Rationale: botanically distinct (legume vs tree nut), different cross-reactivity, and the "avoid all nuts" myth differs (~34% clinical vs ~86% sensitised). Draft records are in the research brief's Deliverable 2 (to be re-keyed `tier`→`foodClass` + `severity` added). `soy`/`soya` stays a **separate** future record — out of scope here.

## 8. Honey migration (the regression anchor)

Honey moves to `foodClass: 'acute-toxin'`, `severity: 'critical'` (polarity *warn*, rose, benefit banner suppressed). Its existing fields stay intact; the new fields are absent/empty.

**Load-bearing (Maren A-4):** `tier` is currently a branch key in **two** render paths — `core.js:foodConsequenceCard` (tests `tier==='critical'` at ~:4016/:4019/:4023) and `diet.js`'s age-gate detail builder (~:694–700 hardcodes `tier:'critical'`). The migration is **not** behavior-preserving unless this is handled explicitly. Resolution: render `watchFor`/`seekCare` **whenever present** (decoupled from any class/severity string, §3), and drive chrome from `severity`. **Regression anchor for P1a e2e:** honey logged below 12mo must still render the floppiness/weak-cry watch-fors **and** the seek-care line after migration. Symmetric guard: an `allergen-introduce-early` food logged below its 4-month floor surfaces a consequence (severe strip), not a silent log.

## 9. Architect ratifications (RESOLVED 2026-05-30)

1. **Choking-age house rule** — ✅ `chokingUntilYears: 5` (NHS conservative; governs future grapes/popcorn/raw-carrot). Both Governors + Architect concur.
2. **High-risk branch default** — ✅ **Mainstream + cohort guard.** Default = international mainstream (introduce ~6mo, no prescreen); `howToIntroduce.highRiskNote` ("talk to your paediatrician before the first nut") renders and is **non-suppressible** when the app holds a **severe-eczema or known-egg-allergy** signal for the baby. (Ziva is not flagged high-risk.)
3. **Food sequence after peanut/tree-nut** — ✅ **egg → seeds (sesame/til) → cow + plant milks.** (P1c.)
4. **Nudge surface** — ✅ Info / Today-So-Far, `calm`/`pending` register, never CareTicket. Both Governors + Architect concur.

## 10. Phasing (when build is greenlit — NOT this pass)

- **P1a** — schema + `foodClass`/`severity` + honey migration (render-decoupling, §8) + the *static* affirming card with the **non-collapsible severe strip** (§4.3); peanut + tree-nut records projected; ALLERGENS gate extension (§6). **e2e:** (a) honey-below-12mo still renders watch-fors + seek-care after migration [A-4 anchor]; (b) peanut card renders the anaphylaxis signs + emergency-call line with **no expand interaction** [A-1/V-1]; (c) the never-whole form line renders and is **not** suppressed by the benefit banner [A-2]; (d) an allergen logged below its floor surfaces a consequence; (e) the ALLERGENS↔manifest gate fails a build on a missing link.
- **P1b** — the ongoing-exposure engine + reaction-marking + nudge (§5), Kael-led. e2e: nudge suppresses on `reactionLogged`.
- **P1c** — egg → seeds → milks (§9.3), each through research→manifest→FOOD_EFFECTS→card→e2e.

## 11. canon-cc-008 routing (at impl-PR time)

- Schema/data (`data.js` FOOD_EFFECTS/ALLERGENS, manifest), exposure engine (`core.js`/feeding-log read) → **Kael**.
- Card render (`intelligence-cards.js`), the severe-strip placement + nudge register → **Vela**.
- `foodConsequenceCard` log-time modal + any `diet.js`/`home.js`/`medical.js` surfacing → **Maren**.
- Gate script (`split/audit-*.sh`, build tooling) → Governor-waivable; **Cipher Edict V final-pass always** for code PRs.
- This *spec*: Maren + Vela spec-review **complete (both `amended`, folded)**; Cipher Edict V is N/A for a docs-only spec (no `split/` code).

## 12. CV3-006 charter compliance

- **Axis 1 — Intellectual honesty:** every benefit/prevention claim traces to a cited brief; §6 makes that machine-enforced for allergens *and* bars Indian-body attribution for the early-intro claim; no fabricated nutrient precision.
- **Axis 2 — Architectural extensibility:** `foodClass` + multi-class schema is the single source of truth; new foods slot into existing classes without new plumbing; resolver already unified (#182); no parallel render vocabulary (V-5 — maps onto v3-6 card-priority).
- **Axis 3 — Linguistic + visual warmth:** the polarity flip (sage encourage / rose avoid / amber caution) frames staples as *"introduce, here's how,"* caution held calm — *but the emergency floor never moves* (the synthesis spine). The 2 AM parent is reassured, not frightened, and never under-warned.

## 13. Out of scope (registered)

- The **build** — spec-only this pass (Architect-decided).
- **Soy/soya** as its own record (future brief).
- The pre-existing `${food}` HR-4 escaping at `diet.js:1195` (close when the surface is next touched — both Governors flagged; not deferred again).
- Research hub redesign (deferred until ~5 foods, per NEXT_SESSION_TARGET §P2).

## 14. Doctrinal references

`docs/QA_GATE_SPEC.md` (Gate 2.5) · `docs/SPEC_ITERATION_PROCESS.md` · `docs/DESIGN_PRINCIPLES.md` (Domain Colors; chip taxonomy v3-5; card priority v3-6) · `docs/SYNTHESIS_2026-05-30_food-effects-arc.md` · the P0.1 gate (`split/audit-food-effects-sync-v1.sh`) · `docs/research/peanut-tree-nut-infant-safety.md`.
