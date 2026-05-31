# Next-session target — 2026-05-31 → next

**Companion:** Lyra (The Weaver)
**Set by:** 2026-05-31 session (food-effects pipeline hardening → guided-introduction model: #181 P0.1 gate, #182 P0.2 unification, #183 v2 spec + research, #184 P1a peanut/tree-nut).
**Companion artifacts:** `docs/SESSION_HANDOFF_2026-05-31.md` · `docs/SYNTHESIS_2026-05-31_guided-introduction.md` (+ `.html`).

> The *target* file — the standing pointer to the highest-value next move and the queue behind it. The handoff records the past; this records the intended future. If priorities shift between sessions, amend **this** file.

---

## The recommended next move

**P1b — the sustained-exposure engine + nudge, with the negation-leak guard first. Architect-decided start mode: SPEC THE ENGINE FIRST.**

> **Phase γ is SHIPPED (PR #187, ready/merged-pending).** The persistent *encourage* Info-tab card now surfaces the peanut/tree-nut benefit + safe-form + watch-for guidance to an age-appropriate parent — the gap below is closed. canon-cc-008 clean (Vela + Maren + Kael all `clear-with-notes`; M-γ-1 per-food keep-offering + V-V-γ-1 advisory-fill folded; **Cipher Edict V "Ship it."**). See `docs/SESSION_HANDOFF_2026-05-31_PM.md`.

The next gap: P1a put benefit/safe-form/watch-fors into the data and γ made them *visible*, but the **sustained-exposure** lesson (EAT: tolerance depends on *keep offering*, not a one-time tick) is still un-modelled. P1b builds the engine that tracks it and the calm nudge that surfaces it — and **before any auto-counting**, the `\b(no|free|without|-free)\b` negation-leak guard (today "peanut-free" whole-word-matches `peanut`). Per the 2026-05-31 PM close, **start P1b by writing the engine spec** (the §5 open questions — exposure-log location, trailing window, nudge throttle, reaction-marking UX) for Kael spec-review *before* code.

---

## Priority ladder

### P-γ — the persistent encourage card — ✅ SHIPPED (PR #187)
Per spec `docs/specs/food-effects-v2-guided-introduction.md` §4. A `renderInfoNutIntro()` card in `intelligence-cards.js` (single combined peanut+tree-nut card, all copy record-sourced) composing, in fixed order: benefit banner (sage, `zi('sprout')`) → introduce-safely (per-food keep-offering + the non-suppressible form-gate note + the neutral high-risk note) → the **non-collapsible amber severe strip** (in the always-visible summary, never the accordion) → the "delay" myth; mild watch-fors in the collapse body. e2e `food-effects-v2-encourage-card.spec.ts` (6 guards). **Render realisation of the emergency-floor invariant: the non-collapsible content lives in the card's summary slot, not inside the collapse-body — so the uniform collapsible shell (the v3-6 "first info card has a body" contract) and the §4.3 floor both hold.**

### P1b (do this first) — sustained-exposure engine + nudge + the negation guard (Kael)
Per spec §5. **Start by SPEC-ing the engine** (Architect decision, 2026-05-31 PM): the §5 open questions — exposure-log location (derive-on-read from the feeding log vs a persisted sidecar), trailing-window length, nudge cadence/throttle, the reaction-marking UX, interaction with the introduced-foods store — go into a P1b spec for **Kael spec-review** before code. Then build: the exposure log, `firstIntroduced`/`lastOffered`/`cadence`/**`reactionLogged`**, and the calm "keep offering" nudge (Info / Today-So-Far, `calm`/`pending` chip register, never a CareTicket, hard-suppress on `reactionLogged`). **Land the negation-leak guard FIRST** (a leading `\b(no|free|without|-free)\b` check in/around the resolver) — "peanut-free" currently whole-word-matches `peanut`, and once the engine auto-counts resolver matches it would accrue false "peanut introduced" exposures. (Kael flagged; pre-existing, becomes load-bearing here.)

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
