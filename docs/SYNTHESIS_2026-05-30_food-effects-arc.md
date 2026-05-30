# Synthesis — the food-effects arc (research → spine → surface)

**Companion:** Lyra (The Weaver)
**Date:** 2026-05-30
**Scope:** A pattern-read of the session that took infant food-safety research all the way to a live consequence surface — and the reusable pipeline that fell out of it.
**Companion artifacts:** `docs/SESSION_HANDOFF_2026-05-30.md` (the operational record) · `docs/NEXT_SESSION_TARGET_2026-05-30.md` (where the thread goes next).

> This is a synthesis document, not a handoff. The handoff says *what happened and what's open*. This says *what threaded together, and what now outlives the feature that occasioned it.*

---

## I see a thread here

Three things that arrived as separate asks turned out to be one arc:

1. **A research question** — "what actually happens if a baby eats honey before age 1?" — answered properly: sourced, adversarially checked, written up as a cited brief and a parent-legible visual, then published to GitHub Pages.
2. **A feature** — F-3, the diet-tab **Library**: finally giving the food DB a real browsable home with search, filter, and per-food Chemistry detail.
3. **A safety surface** — Finding A: when a parent marks an age-gated food *tried* below its gate, the app stops logging silently and **shows the consequence**.

Read separately, they're a research doc, a refactor, and a card. Read together, they're a single **data path from evidence to the moment of parental action**: a researched fact about honey → a structured record the engine can read → a card a tired parent sees at the exact instant they'd otherwise have logged honey for a 7-month-old without a second thought.

That path is the real deliverable. The honey card is just its first traversal.

---

## The spine: `food-effects.manifest.js`

The load-bearing decision of the session was **not** the card — it was inserting a manifest between the research and the code.

- `docs/research/food-effects.manifest.js` is the **single source of truth** that ties a researched food to (a) its cited brief, (b) its parent-facing dashboard, and (c) the `FOOD_EFFECTS` record the app renders.
- Research lands in `docs/research/` as a `.md` brief + a `.visual.html` dashboard (template: `_TEMPLATE.food-dashboard.html`), indexed by the Pages landing (`docs/research/index.html`).
- The app's `FOOD_EFFECTS` table (`split/data.js`) carries the *runtime* projection of that research — the why / watch-for / seek-care a parent needs in the moment — keyed to the same food name the `AGE_RULES` gate uses.

**Pattern named: evidence has a spine.** A safety claim a parent acts on must trace back to a source, not live as a hardcoded string a future editor can't audit. The manifest is that traceability. It's the difference between "the app says honey is dangerous" and "the app says honey is dangerous *because* of this brief, which cites these sources, and here's the dashboard that explains it."

---

## The lesson the session paid for: `honeydew`

The single most important thing learned this session is a **safety bug class**, caught by Maren in the canon-cc-008 chain before it ever reached a parent:

> A *substring* match on food names is a safety defect, not a convenience.

The first cut of the consequence resolver matched `honey` as a substring. **`honeydew`** — a perfectly safe melon that lives in the real food library — substring-matched `honey` and would have surfaced the *infant-botulism* card to a parent logging melon. `honeycomb` too.

The fix is small and the principle is large:
- A shared **word-boundary resolver** (`\bkey\b`) that *both* the `AGE_RULES` age-gate (`diet.js _fdAgeRule`) and the `FOOD_EFFECTS` card (`core.js getFoodEffect`) route through. One resolver, one matching semantics, no drift between "what gets gated" and "what gets a consequence."
- `honey` now resolves `raw honey` / `honey water` but **not** `honeydew` / `honeycomb`.

**Pattern named: a safety surface that fires on the wrong input is worse than one that doesn't fire.** A false-negative (missing a real honey warning) is a gap; a false-positive (botulism warning on melon) is a *trust* wound — it teaches a parent to dismiss the card, which then fails silently the day it's right. The half-awake test cuts both ways: the surface must be legible *and* it must be correct about what it's reacting to.

This is also the cleanest possible argument for **why the Governor chain is a release gate and not a formality**. The build was green. The e2e suite was green. `/code-review` would not have caught it — it's not a code smell, it's a domain-knowledge defect (you have to know `honeydew` is a food and that it contains the string `honey`). It took *Maren's lens specifically* — "what if this data is wrong and a parent acts on it?" — to see a melon wearing a botulism warning.

---

## The doctrine that held: warn-and-allow

A design decision worth preserving as a thread, because it will recur for every future food:

The consequence card **never blocks**. "Log it anyway" proceeds; Cancel / backdrop aborts. The card is warn-and-allow, not gate-and-deny.

**Why** — and this is the warmth being load-bearing again: a parent marking honey "tried" below the gate is very often **recording an exposure that already happened** ("the grandmother gave her a taste"). An app that *refuses* to log it forces the parent to either lie to the app or carry an untracked exposure. Both are worse than showing the consequence and letting them record the truth. The surface respects that the parent is the agent; it informs, it doesn't forbid.

**Pattern named: inform the agent, don't override them.** SproutLab is a journal a parent trusts, not a nanny that overrides them. Safety surfaces escalate *information*, not *permission*.

---

## What now outlives the feature

The session shipped one card. It established a **repeatable pipeline** that the next four foods cost a fraction of:

```
  research question
        │  (deep-research harness: fan-out, fetch, adversarial verify)
        ▼
  docs/research/<food>.md  +  <food>.visual.html        ← cited brief + parent dashboard
        │  (registered in)
        ▼
  docs/research/food-effects.manifest.js                ← the spine (source of truth)
        │  (runtime projection)
        ▼
  FOOD_EFFECTS[<food>]  in split/data.js                ← why / watch-for / seek-care
        │  (resolved by the shared word-boundary resolver)
        ▼
  getFoodEffect() ─ foodConsequenceCard()               ← surfaces automatically at mark-tried
```

The plumbing is built **once**. The 2nd food (whole nuts / egg / cow's milk / salt) is: research it → append to the manifest → add a `FOOD_EFFECTS` record. No new resolver, no new card, no new CSS. It surfaces on its own.

**The one piece of glue still missing** (carried to the next session): a build-audit lint that keeps the three layers — `FOOD_EFFECTS` ↔ `food-effects.manifest.js` ↔ `AGE_RULES` — from drifting out of sync. Build it *before* the 2nd food, while the cost of the convention is one food, not five.

---

## Threads left dangling (for the record, detailed in the target doc)

- **Two surfaces still use the old loose match.** The combo-checker (`diet.js`) and a partner badge (`intelligence-cards.js`) match food names the pre-`honeydew` way. They're separate surfaces from the consequence card — not a live botulism-on-melon risk — but they should route through the same `_lookupByFoodName` resolver so the project has *one* food-name matching semantics, not two.
- **The hub.** Once the manifest carries ~5 foods, the research dashboards want a unified home (Index / Compare / Reactions) rather than a flat Pages index.

---

— *Lyra, 2026-05-30. The thread I'd name if I could only name one: we didn't ship a honey warning, we shipped the road a honey warning travels — from a sourced fact, through a spine that remembers where the fact came from, to a card that meets a parent at the moment of action and tells them the truth without taking the decision away from them. And the road taught us something on its first mile: that `honeydew` contains `honey`, and that the only lens that catches it is the one that asks what a parent would do if the screen were wrong.*
