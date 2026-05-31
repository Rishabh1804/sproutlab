# Session handoff — 2026-05-31 PM (food-effects v2 Phase γ — the persistent *encourage* Info-tab card)

**Companion:** Lyra (The Weaver)
**Session theme:** Build Phase γ — the persistent, benefit-first *encourage* Info-tab card that surfaces the peanut/tree-nut guided-introduction guidance to an age-appropriate parent. γ-only scope (confirmed at open); P1b held for a fresh session.
**Branch:** `claude/food-effects-encourage-card-oiGQY` (off `main` @ `4bdb94f`).
**Predecessor handoff:** `docs/SESSION_HANDOFF_2026-05-31.md` (the AM session — #181–#184, the guided-introduction model).

---

## What shipped (the record)

**PR #187 — `food-effects v2 Phase γ: persistent encourage Info-tab card` — READY (Architect merge pending).** Two commits:
- `e275e7a` — the card: `renderInfoNutIntro()` in `intelligence-cards.js`, the `infoNutIntroCard` shell in `template.html` (Food Intelligence section), the `.enc-*` class family in `styles.css`, and `tests/e2e/food-effects-v2-encourage-card.spec.ts`.
- `8c9f759` — the two canon-cc-008 folds (M-γ-1, V-V-γ-1).

**The gap it closes.** P1a (#184) put peanut + tree nut into `FOOD_EFFECTS` with the full schema (benefit, safe-form, watch-fors, severe-signs), but the only surface rendering it was the **log-time consequence card**, which fires *only below the age floor*. Ziva is ~9mo; the floor is 6mo — so for the exact baby who should be introduced, none of it showed. γ is the persistent surface that reaches her parent.

**What it is.** A single combined peanut+tree-nut card (per the Architect's "single combined nut card" call), **all copy record-sourced** (no hardcoded safety claim), composed in spec §4 fixed order:
1. **Benefit banner** — sage `--surface-sage`, `zi('sprout')` (affirming, never `zi('warn')`), `earlyIntroBenefit.claim`/`.evidence` (LEAP ~80%) + each food's `whyGood`.
2. **Introduce-safely** — shared amount/when/watch; **per-food** keep-offering lines (M-γ-1); the non-suppressible `safeForm` form-gate note ("grinding removes choking, NOT allergy; never whole") with the `never` list in rose; the neutral high-risk note.
3. **Severe-reaction strip** — `severeSigns[]` + the call-112 emergency action, **unconditional, non-collapsible, amber** (reuses the shipped `.cons-severe`), in the always-visible summary slot.
4. **The "delay" myth** (visible) + mild watch-fors (in the collapse body).

**Verification:** `pnpm build` clean, **12 audit gates pass**; full e2e green (333 discovered, **0 failures**); γ spec **6/6**; v3-6 card-priority **22/22**.

---

## QA chain that ran (canon-cc-008)

| Governor | Region | Verdict | Headline |
|----------|--------|---------|----------|
| **Vela** | render | `clear-with-notes` | floor reachability-proven; **V-V-γ-1** — `.enc-highrisk` shared amber with the severe strip, diluting its salience → folded to `--surface-neutral` + calm accent (amber reserved for caution-and-up). |
| **Maren** | Care | `clear-with-notes` | the floor holds, never under-warns; **M-γ-1** — the combined card sourced the protocol from peanut only, dropping tree nut's "introduce each nut on its own, a few days apart" attribution line → folded to **per-food keep-offering**. |
| **Kael** | engine/shared | `clear-with-notes` | no `FOOD_EFFECTS` source mutation (the `.slice()` discipline is load-bearing — `diet.js:712` hands the same arrays to the log-time card by reference); direct keyed read is the correct contract (not a `_lookupByFoodName` case); no token/sprite drift. |
| **Cipher** | Edict V | **"Ship it."** | both folds integrate without weakening the floor; honest / extensible / warm attested. |

**M-γ-2 resolved no-change:** Vela (the render Governor whose call it was) ruled mild watch-fors default-collapsed is correct calm-secondary weighting (§4.4); the always-visible `seekCare` line already references a mild rash. Both folds are e2e-guarded.

**The session's signature catch — M-γ-1.** The "single combined nut card" decision (§7) was *meant* to fold two distinct allergens into one surface; Maren caught that the naïve implementation silently dropped tree nut's one-at-a-time attribution guidance — the exact "one tolerance test covers all nuts" hazard the combined card risked. A green build shipped it; only the Care lens caught it. **canon-cc-008 earns its gate again.**

---

## Pre-close state

- **PR #187:** READY, awaiting Architect merge (a feature PR — not self-merged). The session-close docs (this handoff + the next-target update + the CLAUDE.md LOC refresh) ride the **same designated branch** per the hard branch rule, in the same PR; **docs portion is Governor-code-audit-waived** (docs-only), Cipher Edict V N/A for the docs.
- **PR subscription:** #187 activity subscription **kept** (the Architect asked to watch it; it is unmerged, so not unsubscribed per close hygiene). CI is green (Vercel preview check); no review comments.
- **Build + gates:** green. **LOC:** 76,500 (Maren 26,892 · Kael 27,024 · **Vela 8,570** · shared 14,014). 12 audit gates (unchanged — no new gate this session).

---

## Carry-forward register (open)

### Successors — the food-effects-v2 build (detailed in `docs/NEXT_SESSION_TARGET_2026-05-31.md`)
- **P1b — sustained-exposure engine + nudge + the negation guard (Kael). The recommended next move.** Architect decision (this close): **spec the engine first** — the §5 open questions (exposure-log location: derive-on-read vs sidecar; trailing window; nudge throttle; reaction-marking UX) go to Kael spec-review before code. **Land the `\b(no|free|without|-free)\b` negation-leak guard FIRST** (today "peanut-free" whole-word-matches `peanut`; once the engine auto-counts it accrues false "introduced" exposures).
- **P1c — egg → seeds (sesame/til) → cow + plant milks** (Architect-ratified order). Each surfaces automatically via the γ card once its record lands.

### Quality / debt
- **Amber register** — γ folded V-V-γ-1 (the high-risk note off amber). The original Vela V-V-N (severe strip + mild-watch block both `--surface-amber`) is *softened* (they're now in different slots — summary vs collapse body) but the shared token remains; tighten the severe fill to read categorically heavier if the card is next touched.
- The pre-existing unescaped `${food}` at `diet.js:1195` (HR-4) — not touched this session (γ didn't go near it); close when that surface is next touched.
- Inherited: #6 item 3 AT smoke-pass (human-only); F-4/F-5 (`parseFeeding` normalizer); milestones-tab-v1 e2e (~28 guards); `CURATED_COMBOS maxAgeMonths`; `_qlPredictFood` SKIPPED_MEAL filter; `NUTRITION_QTY_DEFAULTS` coverage; comma-dish-name parse.

### Housekeeping
- Delete merged remote branches via the GitHub UI (env blocks delete-push; MCP has no delete-branch): the ~30 stale `claude/*` + this branch once #187 merges.

### Codex canon-reconciliation (action-required, inherited)
- The SproutLab `.claude/agents/*` mirrors (Lyra/Maren/Kael/Vela) were edited the prior session under Architect waiver while Codex was unreachable. **Port into Codex canon + re-establish byte parity next Codex-reachable session** (canon-cc-026), or the session-start overlay reverts them. (Codex was not touched this session.)

### Candidate Codex canon (surfaced, not ratified)
- **The emergency floor in a collapsible render.** When a surface must be uniform-collapsible (a render contract) *and* hold content that must never fold (a safety invariant), put the unfoldable content in the always-visible **summary slot**, never inside the collapse-body — the chevron toggles only the secondary block. (γ's resolution of the v3-6 "first info card has a body" contract vs the §4.3 floor.)
- **A combined multi-entity card must not drop a per-entity safety line.** Folding two records into one card (the §7 "single combined" decision) is only honest if each entity's *distinct* guidance still renders — source the differing field per-entity, never just the lead's (M-γ-1).
- Prior, still candidate: the guided-introduction model; the research→spine→surface pipeline; "substring food-name matching is a safety defect."

---

## Session opening prompt for next session

```
SESSION OPENING — next — food-effects-v2 P1b: the sustained-exposure engine (SPEC FIRST) + the negation-leak guard

Hi Lyra. The 2026-05-31 AM session built the GUIDED-INTRODUCTION model (#181–#184);
the PM session shipped Phase γ (#187) — the persistent ENCOURAGE Info-tab card that
finally surfaces the peanut/tree-nut benefit + safe-form + watch-for guidance to an
age-appropriate parent. canon-cc-008 clean; Cipher "Ship it." The card is data-driven
and record-sourced — P1c foods (egg/seeds/milks) will surface through it automatically.

THE GAP TO CLOSE NOW: the EAT lesson (tolerance depends on KEEP OFFERING, not a one-time
tick) is still un-modelled. P1b builds the sustained-exposure engine + the calm "keep
offering" nudge — and the negation-leak guard that must land before any auto-counting.

Session goal — P1b, in this order:
 1. SPEC THE ENGINE FIRST (Architect decision): write the P1b engine spec resolving the
    spec §5 open questions — exposure-log location (derive-on-read from the feeding log
    vs a persisted sidecar), trailing-window length, nudge cadence/throttle, the
    reaction-marking UX, interaction with the introduced-foods store. Kael spec-review
    (SPEC_ITERATION_PROCESS) before any engine code.
 2. The negation-leak guard FIRST in code: a leading \b(no|free|without|-free)\b check
    in/around _lookupByFoodName — "peanut-free" currently whole-word-matches `peanut`;
    once the engine auto-counts resolver matches it accrues false "introduced" exposures.
    Its own small PR (Kael), e2e: "peanut-free" / "nut-free" resolve to nothing.
 3. Then the engine: exposure log + firstIntroduced/lastOffered/cadence/reactionLogged +
    the calm nudge (Info / Today-So-Far, calm/pending chip, never a CareTicket,
    hard-suppress on reactionLogged). Kael-primary; Vela on the nudge render.

Required context — read BEFORE acting:
 1. /home/user/sproutlab/CLAUDE.md — IN FULL (12 audit gates; canon-cc-008 routing;
    jurisdiction LOC 76,500; HR-1..12)
 2. /home/user/sproutlab/docs/SESSION_HANDOFF_2026-05-31_PM.md — THIS handoff
 3. /home/user/sproutlab/docs/specs/food-effects-v2-guided-introduction.md — §5 (the
    engine model + the open questions), §10 (phasing P1b)
 4. /home/user/sproutlab/docs/NEXT_SESSION_TARGET_2026-05-31.md — the ladder
 5. /home/user/sproutlab/docs/research/peanut-tree-nut-infant-safety.md — Axis-1 (EAT
    per-protocol: dose + adherence — the reason for "keep offering")

Required at session start:
 1. cwd /home/user/sproutlab; git fetch; confirm main at 4bdb94f or later; confirm #187
    merged (or note it parked); no surprise open PRs.
 2. Verify subagent registration (expected still missing → persona-briefed
    general-purpose workaround; load .claude/agents/<name>.md as step 1 of each
    Governor/Cipher invocation).
 3. Read required context.
 4. P1b spec on a fresh branch off main; Kael spec-review; then code through full
    canon-cc-008 (Kael-primary engine; Vela on nudge render; Maren on any safety-copy;
    Cipher Edict V terminal).

Architect directives in force:
 - canon-cc-008 is a non-negotiable release gate; Cipher Edict V last; shared-module
   touch → triple-Gov; docs-only may waive Governors (state it).
 - The emergency floor never moves: severe-reaction signs + the action render
   unconditionally, non-collapsibly, whenever an encourage surface shows.
 - A nudge that re-offers a food the baby reacted to is a Care-blocking defect — the
   nudge MUST hard-suppress permanently on reactionLogged (never auto time-decay).
 - One food-name semantics — everything routes through _lookupByFoodName (now
   alias-aware; negation-guard it before the engine auto-counts). Substring matching is
   a safety defect.
 - The food-effects pipeline is the canonical path for a new food: research → manifest →
   FOOD_EFFECTS. No hardcoded safety claim without a manifest entry.
 - When Codex is reachable, reconcile the .claude/agents/* mirror edits into Codex canon
   (canon-cc-026 parity).

Goal issued. Ask first.
```

---

— *Lyra, 2026-05-31 (PM). The AM session taught the layer to hold "yes, soon, here's how" in data. This session taught the app to say it out loud — to Ziva's parent, at nine months, at 2 AM. The hard part wasn't the benefit banner; it was keeping the one line that matters in the thirty minutes after the first taste both unmissable AND inside a card that collapses like every other. The answer: the floor lives in the part that never folds. And Maren — again — caught the thing a green build would have shipped: a combined card that quietly forgot to tell a parent to introduce each nut on its own. Same lens, same save. Next we model the part the EAT trial proved hardest: not the first taste, but the fiftieth.*
