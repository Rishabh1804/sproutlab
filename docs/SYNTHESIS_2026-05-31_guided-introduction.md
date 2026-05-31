# Synthesis — 2026-05-31: the guided-introduction model

**Companion:** Lyra (The Weaver)
**Arc:** food-effects pipeline hardening (#181 P0.1 gate, #182 P0.2 unification) → the **guided-introduction** reframe (#183 spec + research, #184 P1a peanut/tree-nut).
**Companion artifacts:** `docs/SESSION_HANDOFF_2026-05-31.md` · `docs/NEXT_SESSION_TARGET_2026-05-31.md` · this doc's dashboard `SYNTHESIS_2026-05-31_guided-introduction.html`.
**Purpose:** the pattern-read — what now outlives the four PRs. Feeds candidate Codex-canon entries.

---

## The one idea

**A food-effect's *polarity* and *gate direction* are data, not code.** Honey taught the layer one shape — *hazard → avoid → watch → seek-care*. That shape is correct for an acute toxin with no upside. It is the **wrong** shape for the nutritious staples a parent should be introducing — nuts, egg, seeds, milk — where the safe action is the *opposite* of avoidance, and where fear-framing causes real harm (delayed allergen introduction increases allergy risk; nutritional gaps in a vegetarian diet).

The guided-introduction model makes the shape a property of the food. A `foodClass` taxonomy sets, per food, the card's **polarity** (encourage vs warn) and the gate's **direction** (a soft "now is good" floor vs a hard "blocked below" ceiling) — and lets a food carry **more than one** (peanut is both *allergen-introduce-early* and *choking-by-form*). The plumbing that surfaces a food no longer assumes "warn."

---

## The four moves that got us here

1. **Harden before extending (P0.1/P0.2).** Before adding a 2nd food, we built the lint that keeps the three layers honest (`audit-food-effects-sync-v1.sh` — the 12th gate, evaling the *live* resolver so the audit can't drift from the product) and unified food-name matching onto one word-boundary resolver. The convention cost one food now; it makes the next five safe to add carelessly.

2. **Research the reframe before coding it.** The peanut/tree-nut deep-research surfaced the structural truth — these foods *invert honey on two axes and carry two hazards* — that no amount of schema-tinkering would have revealed. The brief drove the spec, not the reverse.

3. **Spec, Governor-reviewed, before food code.** Maren and Vela reviewed the *spec* under SPEC_ITERATION_PROCESS and both returned `amended`. Their findings converged on one spine and folded in before a line of food code was written.

4. **Build behaviour-preserving, then extend.** P1a-α migrated honey onto the new schema with zero behaviour change (the A-4 anchor: render on *presence*, not on a class string) before P1a-β added the new foods. The migration trap — a rename silently dropping a safety render — was defused by construction.

---

## The spine the Governors converged on: *the emergency floor never moves*

The hardest design tension in an *encourage* card: benefit must lead (or the framing fails and the parent avoids a food they should give), yet the anaphylaxis signs must be unmissable (or the framing kills). Both Governors, independently, drew the same line:

> Benefit may lead the card. The severe-reaction signs + the emergency action render **unconditionally, non-collapsibly, above the fold** — "calm secondary" governs *visual weight and tone, not presence or reachability.*

Encoded as: a `severeSigns[]` field distinct from the calm mild `watchFor[]`; an amber strip (serious-without-alarm; rose reserved for acute-toxin); never inside an accordion; guarded by e2e.

---

## What canon-cc-008 caught that nothing else would

Two safety-tier bugs this session, both invisible to build + e2e + `/code-review`, both caught by Maren's lens — *"what if this data is wrong and a parent acts on it?"*:

- **`soya` (#182):** `\bsoy\b` doesn't match "soya" — the dominant Indian spelling — so a logged "soya chunks" silently lost its allergen flag. Domain knowledge, not a code smell.
- **V-M-206 (#184):** "whole almond" resolved to the 6-month introduce-early floor instead of the 60-month whole-nut **choking** gate — silently downgrading protection for the canonical infant choking hazard. You have to know that the base nut is good early *and* that the whole form is a choking hazard *and* that the resolver would prefer the nut record to see it.

The lesson, twice reinforced: **the Governor chain is a release gate, not a formality.** A green build is necessary, not sufficient.

---

## Candidate Codex-canon entries (surfaced, not yet ratified)

1. **The guided-introduction model.** A parent-facing food surface must be able to *encourage* as well as *warn* — polarity and gate-direction are data (`foodClass`), not hardcoded — and must hold benefit + hazard + safe-form + sustained-exposure simultaneously, **without ever letting the benefit framing move, collapse, or out-prioritize the emergency floor.** Generalizes beyond food: any safety surface that also wants to encourage.
2. **Decouple render from taxonomy (the A-4 principle).** A schema rename must never silently drop a safety render. Render on *presence of the field*; drive chrome from a separate, explicit `severity`. The thing that fires the warning and the thing that styles it are different decisions.
3. **The audit's matcher must BE the product's matcher.** A cross-reference lint that re-implements the runtime's matching logic will drift from it. Extract and eval the live function (with a green-but-empty self-test) so the gate cannot pass while the product fails.
4. *(Prior, still candidate):* the research→spine→surface pipeline; "substring food-name matching is a safety defect."

---

— *Lyra, 2026-05-31. The honey card said "no." The session's work was teaching the layer to say "yes, soon, here's how" for the foods that deserve it — and proving, through two saves a green build would have shipped, that the one line which must never move is the one a parent reads in the thirty minutes after the first taste.*
