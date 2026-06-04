# Synthesis — 2026-06-05 — The Recipes generative arc

**Companion:** Lyra (The Weaver)
**Arc:** Wiring the Diet → Recipes tab (PR #223) and upgrading it to the Tier C generative food system (PR #228).
*What now outlives the feature — the patterns worth carrying to Codex canon.*

---

## The shape of the work

The app could track a baby's food but never help a parent *make* a meal. This arc gave it a Recipes tab: first the plumbing (a cited 25-recipe corpus, a logged-data "Suggested for Ziva" pick, a meal-slot catalog, and a "Can I give this?" that finally stops handing a parent an empty recipe for honey) — then, on the Architect's call, the full **generative food system**: a colour fingerprint weighted by what's actually in the bowl, a voice composed from the ingredients, a warm-wave sheen sweeping in time with the app's front door.

Four durable patterns surfaced — each a candidate for Codex canon.

---

## Pattern 1 — Trace-for-cosmetics ≠ trace-for-safety (the signature catch)

**Surfaced by:** Maren (M-T-1) **and** Kael (K-T-1), independently, on the #228 chain.

The Tier C hero draws a generative fingerprint from a recipe's ingredients, and the §9.3 rule is that **trace** ingredients (ghee, spices, a half-teaspoon of honey) are excluded so the colour bands never mud. The tagline composer reused that same `_RECIPE_TRACE` exclusion to decide which ingredients get a *voice*. The trap: the composer's **strict-lead** channel — the rose "honey — only from age 1" caution that §9.7 mandates lead the tagline — only fires for ingredients the composer *sees*. Honey, filtered out as trace, never reached the composer, so the strict lead was **dead code**. The generative voice would have shipped a warm, inviting honey-recipe tagline with the honey caution silently gone — and a green build hid it.

**The pattern:** when a system excludes elements for a **cosmetic** reason (de-mudding a gradient), that exclusion must **not** be reused where a **safety** contract rides (surfacing a hazard lead). The two exclusions look identical in code and are conceptually opposite. The fix split them: trace items stay out of the fingerprint, but a `strict:`-carrying ingredient is kept in the composer's parts so its lead clause surfaces — its tiny gram weight keeps it a "touch of" in the body while the caution leads. Pinned with an e2e guard at the `_recipeTagline` boundary so it can't silently regress.

**Lineage:** this is the §9 sibling of **M-γ-1** ("a combined card must not drop a per-entity safety line") — both are the same failure class: a *consolidation for presentation* that quietly drops a *safety obligation*. Two Governors, two arcs, one lesson.

---

## Pattern 2 — Render-first tier-discussion (when an upgrade exceeds the lock)

**Surfaced by:** the Architect asking, after #223 shipped, to "go through the updated recipes tab… there have been a lot of design upgrades in parallel."

The shipped tab was *correct* but *lean*; the parallel lean-landing work had since made the §9 warm-wave aesthetic **live** (on the landing hero). The upgrade therefore went **beyond** the LOCKED `05-meal-rows` design — a new combination not itself ratified. Rather than guess, the move was to **present tiered options** grounded in three concrete references: the design records, the design canon (§9), and *what is already shipped live*. Tier A (faithful-to-lock polish), Tier B (align to the live warm-wave), Tier C (full generative). The Architect chose Tier C.

**The pattern:** when an upgrade exceeds a locked design, don't silently extend the lock and don't silently re-lock. Lay out a small ladder of options — each tied to a real artifact (a record, a canon section, a live surface) — and let the Architect pick the altitude. Then build at that altitude, render-first, and let the preview be the sign-off before the gate.

---

## Pattern 3 — Live-pattern reuse over parallel invention

**Surfaced by:** the Tier C hero needing a warm-wave sheen — which the lean-landing had *already shipped* as `@keyframes ld-wave`, Governor-approved, with a reduced-motion floor.

The Tier C hero reused that exact keyframe rather than authoring a parallel animation. The result: the three warm-wave surfaces in the app (landing hero, footer heart, recipe hero) beat in unison at the same 4.4s cadence, share the same reduced-motion contract, and cost one CSS line instead of a new motion system. Vela verified the reuse byte-for-byte against the landing.

**The pattern:** before building a new motion/colour/layout system for a surface, check whether a *live, already-audited* pattern fits. Reusing it is cheaper, more coherent (surfaces beat in unison), and inherits the prior Governor sign-off (reduced-motion, dark parity). A parallel invention is a second thing to audit and a second thing to drift.

---

## Pattern 4 — One resolver, two surfaces (no two-path divergence)

**Surfaced by:** the #223 §10 "Can I give this?" revision touching both the Patterns combo bar and the Home Smart-Q&A.

The fish/milk arc had already taught that a food's safety verdict computed *two ways on two surfaces* is a defect class (the alias-precedence leaks). So the recipe-aware "Can I give this?" was built on **one** shared resolver (`_resolveRecipeAnswer`) that both bars call. Kael proved the two surfaces' applicability gates algebraically equal; Cipher flagged that the *parity* is currently coincidental (two spellings of the same predicate) and should be made structural (one shared helper) before a vegan/dairy gate lands — a carry-forward.

**The pattern:** when one judgement must appear on two surfaces, route both through a single function. If you can only make them *equal* (not *shared*), pin the equality with a test and schedule the refactor to *shared* — coincidental parity is a latent divergence.

---

## What goes to Codex (candidate canon)

| # | Pattern | One-line |
|---|---------|----------|
| 1 | Trace-for-cosmetics ≠ trace-for-safety | A cosmetic exclusion must never be reused where a safety contract rides. (§9 sibling of M-γ-1.) |
| 2 | Render-first tier-discussion | When an upgrade exceeds a lock, present tiered options tied to real artifacts; Architect picks the altitude. |
| 3 | Live-pattern reuse | Align a new surface to an existing live, audited pattern before inventing a parallel one. |
| 4 | One resolver, two surfaces | Route one judgement through one function; if only equal, pin it and schedule the refactor to shared. |

---

*— Lyra, 2026-06-05. The app learned to cook — and the lesson that outlives the recipes is the oldest one wearing a new coat: a thing made warmer, more consolidated, more beautiful, must never become a thing made less safe. The fingerprint was the beauty; the strict lead was the floor; and the chain held the floor up while the beauty went on.*
