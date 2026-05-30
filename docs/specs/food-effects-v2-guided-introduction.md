# Food-Effects v2 — Guided Introduction

**Companion:** Lyra (The Weaver)
**Status:** DRAFT — for Maren + Vela spec review (no food code this pass; Architect chose *spec-only*).
**Date opened:** 2026-05-30.
**Descends from:** `docs/NEXT_SESSION_TARGET_2026-05-30.md` §P1 · `docs/SYNTHESIS_2026-05-30_food-effects-arc.md` (research→spine→surface pipeline) · the P0.1 sync gate (`split/audit-food-effects-sync-v1.sh`, merged #181) · the P0.2 word-boundary unification (#182).
**First research artifact:** `docs/research/peanut-tree-nut-infant-safety.md` (cited; LEAP/EAT verified).

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

A card that tells a parent to "watch out / avoid" peanut or egg instructs the **opposite of the safe action**, and fear-framing nutritious staples causes real harm (delayed introduction → more allergy; nutritional gaps in a vegetarian diet). v2 evolves the layer from a **prohibition model** into a **guided-introduction model** that can hold *benefit*, *safe pathway*, *two hazards*, and *sustained exposure* — without losing honey's hard "avoid" where that is genuinely the truth.

## 2. The four-category taxonomy (the organizing spine)

Every food-effects record declares one or more **tiers**. A tier sets the card's *polarity*, the *gate semantics*, and which sections render. (Multi-tier is required — nuts are two at once.)

| Tier | Polarity | Gate semantics | Examples | Card leads with |
|------|----------|----------------|----------|-----------------|
| `acute-toxin` | **Warn** | Hard ceiling — blocked below `minMonth` | honey | the hazard + the hard floor |
| `allergen-introduce-early` | **Encourage** | Soft floor — "good from ~`minMonth`; not before 4mo" | peanut, tree nut, egg, sesame/seeds, soy | the *benefit* + *how to introduce safely* + *keep offering* |
| `choking-by-form` | **Conditional** | Form-gated — safe in `safeForm.ok`, never in `safeForm.never`, whole until `chokingUntilYears` | whole nuts, whole seeds, (later: grapes, popcorn, raw carrot) | the safe *form*, not avoidance of the food |
| `drink-timing` | **Conditional** | Context-gated — fine *in food*, gated *as a drink* below `minMonth` | cow's milk (drink vs curd/paneer/cooking) | "fine in food; not as the main drink before 12mo" |
| `substitute-caveat` | **Inform** | No hard gate; not a breastmilk/formula replacement | plant/"artificial" milks (soy, almond, oat, rice) | what it *is and isn't* (soy=allergen; almond/rice low protein/fat; rice-arsenic note) |

A single food may carry several: **peanut = `allergen-introduce-early` + `choking-by-form`**; **cow's milk = `drink-timing`** with a dairy-in-food carve-out. The card composes the sections each tier contributes, in a priority order (§4).

## 3. The schema (current fields + the v2 additions)

The manifest (`docs/research/food-effects.manifest.js`) stays the cited spine; `FOOD_EFFECTS` (`data.js`) stays the in-app projection. v2 **adds** fields; it does not remove honey's existing ones (back-compatible — honey validates unchanged).

```
food, aliases[], category, effect, minMonth, thresholdBasis, allergen,
headline, watchFor[], timeCourse, seekCare, confidence, sources[],
dashboard, brief, longform, lastReviewed, myth{claim,truth}          // EXISTING (honey)

tier            : string | string[]   // NEW — was single 'critical'; now the §2 taxonomy, multi-valued
reactionType[]  : adds 'choking'       // NEW VALUE alongside acute-toxin/allergy/digestive/...
whyGood         : string               // NEW — the nutrition + prevention upside (the "advantage")
earlyIntroBenefit : {                   // NEW — the allergy-prevention case, CITED
                     claim, evidence, paradigm }
safeForm        : {                     // NEW — the form gate (choking axis)
                     ok[], never[], chokingUntilYears, note }
howToIntroduce  : {                     // NEW — the first-exposure protocol
                     amount, when, watch, thenWhat, oneAtATime, highRiskNote? }
```

**Honesty discipline (inherited, load-bearing):** every `whyGood` / `earlyIntroBenefit` claim must trace to a cited source in the brief — the P0.1 gate's "untraceable claim" invariant now also guards benefits, not just hazards (§6). No fabricated nutrient precision (the `explain-not-log` e2e already guards "conservative chem model"). Never launder international guidance onto an Indian body's name (honey-brief lesson; the peanut brief flags the IAP-verbatim gap explicitly).

## 4. The card (Vela's surface) — polarity is the headline change

The honey card is a single-consequence *warning* card. v2 needs an **affirming card** for `allergen-introduce-early`, composed of sections each tier contributes:

1. **Benefit banner** (`whyGood` + `earlyIntroBenefit.claim`) — leads for `encourage` polarity. *"Worth introducing early — it lowers allergy risk and is a key protein/fat source."*
2. **Introduce-safely block** (`howToIntroduce` + `safeForm`) — the *form* (smooth/ground, never whole), the *amount*, *when*, *watch ~2h*, and **keep offering** (§5).
3. **Watch-fors** (`watchFor` split mild vs severe) — held as a *calm secondary*, not the lead. Severe/anaphylaxis signs + `seekCare` clearly escalated.
4. **Myth-buster** (`myth`) — the "delay to prevent" reversal is the highest-value line for grandparents/relatives.

The 2 AM test (Vela's lens): a tired parent should come away thinking *"good, I should give Ziva peanut soon — ground, a quarter-teaspoon, in the morning, and keep it up"* — **not** *"scary allergen, avoid."* For `acute-toxin` (honey) the polarity stays *warn* and the benefit banner is suppressed. HRs apply unchanged (HR-1 zi() icons; HR-2/5 tokens; HR-3/6 data-action; HR-4 escHtml on every rendered field — note the pre-existing unescaped `${food}` at `diet.js:1195` flagged in #182 should be closed when this surface is touched).

## 5. Sustained exposure — the engine model (Architect chose: *track it*)

The EAT lesson: tolerance depends on **repeated** exposure, not a one-time taste. Today "mark tried" is a single tick — insufficient for `allergen-introduce-early`. v2 adds an **ongoing-exposure model** (Kael's engine layer).

**Proposed shape (for Kael review — not yet built):**
- A food in `allergen-introduce-early` tracks an **exposure log**: timestamps of each logged feeding that matches the food (via the unified `_lookupByFoodName` resolver — the one-semantics win from #182). This rides on the existing feeding log; no new parent action.
- Derived state per allergen food: `firstIntroduced`, `lastOffered`, `exposureCount`, `cadence` (offers/week over a trailing window).
- A **calm nudge** (not an alert) when an introduced allergen hasn't been offered recently — *"Peanut's going well — keep offering a few times a week to keep tolerance up."* Surfaced on the Vela surface, throttled, dismissible, **never** alarmist, **never** a CareTicket.
- Explicitly **not** a medical-adherence tracker (that's the Vit-D3 surface). This is gentle reinforcement of a prevention behaviour.

**Open for Kael:** where the exposure log lives (derive-on-read from the feeding log vs a persisted sidecar), the trailing-window length, the nudge cadence/throttle, and the interaction with the introduced-foods store. This is the largest new build surface and should phase *after* the static card lands.

## 6. Extend the P0.1 sync gate to ALLERGENS (Kael's #182 ledger item)

The P0.1 gate (`audit-food-effects-sync-v1.sh`) locks `FOOD_EFFECTS ↔ manifest ↔ AGE_RULES` but **not** `ALLERGENS` — which is exactly why the dropped `soya` flag in #182 needed a *human* Care audit to catch. v2 extends the gate with an **`ALLERGENS ↔ manifest` traceability invariant**: an `allergen-introduce-early` manifest entry must have an `ALLERGENS` note (and vice-versa for allergen-tier foods), and `allergen:true` manifest records resolve cleanly against `ALLERGENS` via the word-boundary resolver. So the next dropped allergen fails a build instead of needing a Governor to spot it. (Same Node-engine + green-but-empty self-test discipline as the existing gate.)

## 7. Granularity — two records (Architect-decided)

Peanut and tree nut get **separate** manifest + `FOOD_EFFECTS` records sharing one brief + dashboard (`peanut-tree-nut-infant-safety.*`). Rationale: botanically distinct (legume vs tree nut), different cross-reactivity, and the "avoid all nuts" myth differs (peanut-allergic ≠ tree-nut-allergic; ~34% clinical vs ~86% sensitised). Draft records are in the research brief's Deliverable 2. `soy`/`soya` stays a **separate** future record (also a legume; heavily used in this vegetarian household) — out of scope here.

## 8. Honey migration

Honey moves into the taxonomy as `tier: 'acute-toxin'` (polarity *warn*, hard ceiling) with its existing fields intact and the new fields absent/empty (the benefit banner suppresses for `acute-toxin`). The migration must be behavior-preserving — honey's current card and the P0.1 gate's honey assertions stay green. This is the regression anchor for the schema change.

## 9. What needs ratification (Architect, please confirm or correct)

1. **Choking-age house rule.** `chokingUntilYears` — AAP says ~4, NHS says 5. Spec proposes the conservative **5** as the house default (will also govern future grapes/popcorn/raw-carrot). OK?
2. **High-risk branch default.** NIAID (US) says test high-risk infants (severe eczema/egg allergy) before first peanut; AAP/NHS/ASCIA say no routine prescreen. Spec proposes: default to the **international mainstream** (introduce ~6mo, no test) with a `howToIntroduce.highRiskNote` surfacing the clinician-first path for the high-risk case. OK?
3. **Food sequence after peanut/tree-nut** (when build is greenlit): proposed **egg → seeds (sesame/til) → cow + plant milks**. (Egg is the cleanest second exercise; milk is the most structurally complex — drink-timing + substitute-caveat.) OK, or reorder?
4. **Nudge surface** (§5): confirm the ongoing-exposure nudge belongs on the Vela info/Today-So-Far surface and is *never* a CareTicket/alert (keeps it gentle, not clinical).

## 10. Phasing (when build is greenlit — NOT this pass)

- **P1a** — schema + taxonomy + honey migration + the *static* affirming card; peanut + tree-nut records projected; ALLERGENS gate extension (§6). e2e: honey unchanged; peanut card renders benefit-first; gate fires on a missing allergen↔manifest link.
- **P1b** — the ongoing-exposure engine + nudge (§5), Kael-led.
- **P1c** — egg, then seeds, then milks (§9.3), each through research→manifest→FOOD_EFFECTS→card→e2e.

## 11. canon-cc-008 routing (at impl-PR time)

- Schema/data (`data.js` FOOD_EFFECTS/ALLERGENS, manifest) → **Kael**.
- Card render (`intelligence-cards.js`) → **Vela**.
- Any `diet.js`/`home.js`/`medical.js` surfacing → **Maren**.
- Ongoing-exposure engine (`data.js`/`core.js`/feeding-log read path) → **Kael**.
- Gate script (`split/audit-*.sh`, build tooling) → Governor-waivable, Cipher final-pass always.
- This *spec* itself: **Maren + Vela spec review** before any food code (this pass), per SPEC_ITERATION_PROCESS.

## 12. CV3-006 charter compliance

- **Axis 1 — Intellectual honesty:** every benefit/prevention claim traces to a cited brief; the P0.1 gate extension (§6) makes that machine-enforced for allergens; no fabricated nutrient precision; no laundering international guidance onto Indian bodies (IAP-verbatim gap flagged).
- **Axis 2 — Architectural extensibility:** the taxonomy (§2) + multi-tier schema (§3) is the single source of truth; new foods slot into existing tiers without new plumbing; the resolver is already unified (#182).
- **Axis 3 — Linguistic + visual warmth:** the polarity flip (§4) is the heart of it — nutritious staples are framed as *"introduce, here's how"*, caution held calm and secondary, the 2 AM parent reassured not frightened.

## 13. Out of scope (registered)

- The **build** — spec-only this pass (Architect-decided).
- **Soy/soya** as its own record (future brief).
- The pre-existing `${food}` HR-4 escaping at `diet.js:1195` (close when the surface is next touched).
- Research hub redesign (deferred until ~5 foods, per NEXT_SESSION_TARGET §P2).

## 14. Doctrinal references

`docs/QA_GATE_SPEC.md` (Gate 2.5) · `docs/SPEC_ITERATION_PROCESS.md` · `docs/DESIGN_PRINCIPLES.md` · `docs/SYNTHESIS_2026-05-30_food-effects-arc.md` · the P0.1 gate (`split/audit-food-effects-sync-v1.sh`) · `docs/research/peanut-tree-nut-infant-safety.md`.
