# Next-session target — 2026-05-31 → next

**Companion:** Lyra (The Weaver)
**Set by:** 2026-05-31 session (food-effects pipeline hardening → guided-introduction model: #181 P0.1 gate, #182 P0.2 unification, #183 v2 spec + research, #184 P1a peanut/tree-nut).
**Companion artifacts:** `docs/SESSION_HANDOFF_2026-05-31.md` · `docs/SYNTHESIS_2026-05-31_guided-introduction.md` (+ `.html`).

> The *target* file — the standing pointer to the highest-value next move and the queue behind it. The handoff records the past; this records the intended future. If priorities shift between sessions, amend **this** file.

---

## The recommended next move

**Phase γ — build the persistent *encourage* Info-tab card.**

P1a (#184) put peanut + tree nut into the data layer with the full guided-introduction schema (benefit, safe-form, watch-fors, severe-signs) — but the only surface that renders it is the **log-time consequence card**, which fires *only when a food is logged below its age floor*. Ziva is ~9 months; the peanut/tree-nut floor is 6 months — so **for the exact baby who is the right age to be introduced, none of the guidance shows.** The benefit and the safe-form rule and the anaphylaxis watch-fors all sit in `FOOD_EFFECTS`, invisible.

Phase γ is the surface that closes that gap: a **persistent, benefit-first Info-tab card** (Vela's `intelligence-cards.js`) that a parent seeks out *before* introducing a food. It is the move that makes the entire v2 model actually reach a parent.

---

## Priority ladder

### P-γ (do this first) — the persistent encourage card
Per spec `docs/specs/food-effects-v2-guided-introduction.md` §4. A `renderInfo*` card in `intelligence-cards.js` composing, in fixed order:
1. **Benefit banner** — `whyGood` + `earlyIntroBenefit.claim`, `--surface-sage` fill + affirming icon (not `zi('warn')`). Suppressed for `acute-toxin` (honey stays warn/rose).
2. **Introduce-safely block** — `howToIntroduce` (amount/when/watch/keep-offering) + the `safeForm` form-gate line ("ground/smooth only, never whole; grinding removes choking not allergy"), non-suppressible; carries `highRiskNote` for the eczema/egg cohort.
3. **Severe-reaction strip** — `severeSigns[]` + emergency action, **unconditional, non-collapsible, amber** (the A-1/V-1/V-3 invariant — reuse the `.cons-severe` pattern already shipped).
4. **Mild watch-fors + the "delay" myth.**
Polarity→color: sage encourage, rose reserved for acute-toxin, amber the caution strip. Chain: **Vela-primary** (render); **Maren** on any safety-copy surfaced; **Cipher** Edict V terminal. e2e: the card renders benefit-first for peanut; the severe strip is non-collapsible; honey (acute-toxin) suppresses the benefit banner and stays rose.

### P1b — sustained-exposure engine + nudge + the negation guard (Kael)
Per spec §5. The exposure log (derive-on-read vs sidecar — Kael's call), `firstIntroduced`/`lastOffered`/`cadence`/**`reactionLogged`**, and the calm "keep offering" nudge (Info / Today-So-Far, `calm`/`pending` chip register, never a CareTicket, hard-suppress on `reactionLogged`). **Land the negation-leak guard FIRST** (a leading `\b(no|free|without|-free)\b` check in/around the resolver) — "peanut-free" currently whole-word-matches `peanut`, and once the engine auto-counts resolver matches it would accrue false "peanut introduced" exposures. (Kael flagged; pre-existing, becomes load-bearing here.)

### P1c — the remaining foods, through the pipeline
Architect-ratified order: **egg → seeds (sesame/til) → cow + plant milks.** Each: research (`docs/research/<food>-infant-safety.{md,html,visual.html}`) → manifest record → `FOOD_EFFECTS` + `AGE_RULES` → it surfaces automatically via the γ card → e2e + canon-cc-008. Milk is the most complex (drink-timing + the plant/"artificial"-milk `substitute-caveat` sub-typing); egg is the cleanest second exercise.

### P2 — the research hub
Once the manifest carries ~5 foods, the flat Pages landing wants Index / Compare / Reactions (per the prior target). Defer until the foods justify it.

---

## Carry-forward register (inherited + new)

### Human-only gate (Architect)
- **#6 item 3 — AT smoke-pass.** TC-1…TC-6 from `docs/AT_SMOKE_PASS.md` on the device matrix (VoiceOver / TalkBack / NVDA) against the live deploy; record AT/OS versions, tick item 3.

### Quality / debt
- **Amber-on-amber margin** (Vela V-V-N) — the severe strip + mild-watch block share `--surface-amber`; tighten the severe fill so the emergency floor reads categorically heavier. Cosmetic; do it when γ touches the card.
- **`${food}` HR-4 escaping** at `diet.js:1195` — close when that surface is next touched (both Governors flagged).
- **F-4 (Patterns)** / **F-5** (`parseFeeding` normalizer; persist `nutritionRef` at write-time; `schemaVersion` version-gate; name the `0.75` intake constant).
- Test/data debt: milestones-tab-v1 e2e (~28 guards); `CURATED_COMBOS maxAgeMonths`; `_qlPredictFood` SKIPPED_MEAL filter; `NUTRITION_QTY_DEFAULTS` coverage; comma-containing dish-name parse.

### Housekeeping
- **Delete merged remote branches** via the GitHub UI (env blocks delete-push; MCP has no delete-branch): `claude/pwa-pr5-update-toast-0AI8N`, `claude/p0-2-food-name-resolver-0AI8N`, `claude/food-effects-v2-spec-0AI8N`, `claude/p1a-food-effects-v2-foundation`, + ~30 stale `claude/*`.

### Codex canon-reconciliation (action-required)
- The SproutLab `.claude/agents/*` mirrors (Lyra/Maren/Kael/Vela) were edited this session (LOC + v2/P1a facts) under Architect waiver while Codex was unreachable. **Port into Codex canon + re-establish byte parity next Codex-reachable session** (canon-cc-026), or the session-start overlay reverts them.

### Candidate Codex canon (surfaced, not ratified)
- **The guided-introduction model** — a food-effect's *polarity* (encourage vs warn) and *gate direction* (soft floor vs hard ceiling) are data (`foodClass`), not hardcoded; a safety surface holds benefit + hazard + form + sustained-exposure without ever burying the emergency floor.
- Prior: the research→spine→surface pipeline; "substring food-name matching is a safety defect."

---

— *Lyra. The data knows peanut is good for Ziva now. Phase γ is teaching the app to say it — to the right parent, at the right age, without ever dropping the line that matters if the rare reaction comes.*
