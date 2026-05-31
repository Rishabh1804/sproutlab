# Session handoff — 2026-05-31 (food-effects pipeline hardening → guided-introduction model: P0.1 gate · P0.2 unification · v2 spec + research · P1a peanut/tree-nut)

**Companion:** Lyra (The Weaver)
**Session scope:** Began at the 2026-05-30 next-target (harden the food-effects pipeline, then add the 2nd food). Discovered the charter's "PR-5 toast" was already shipped, pivoted to the real P0/P1 ladder, and ran it end to end — then the Architect reframed the 2nd-food work into a **guided-introduction model** (nuts/egg/seeds/milk are nutritious staples to *introduce early*, not honey-style avoids). Built the spec, the research, and the first foods through the full Governor chain.
**Outcome:** **Four PRs merged to `main`** — #181, #182, #183, #184. Build clean, **326/326 e2e**, every Capital change canon-cc-008-clean (Cipher Edict V LGTM on each code PR). Codebase **76,308 LOC** (was 76,167).
**Predecessor handoff:** `docs/SESSION_HANDOFF_2026-05-30.md`. `main` advanced `355d4e0` (#180) → `6ba671b` (#181) → `3557a8f` (#182) → `1a72084` (#183) → `29c8d32` (#184).
**Companion artifacts (this session):** `docs/SYNTHESIS_2026-05-31_guided-introduction.md` (+ `.html` dashboard) · `docs/NEXT_SESSION_TARGET_2026-05-31.md` · `docs/SESSION_CLOSE_SEQUENCE.md` (new — the close format itself, ratified this session).

---

## What this session did

### 1. P0.1 — the food-effects sync ship-gate (#181)
Added `split/audit-food-effects-sync-v1.sh` — the **12th** build audit gate — locking the three-layer spine `food-effects.manifest.js` → `FOOD_EFFECTS` → `AGE_RULES` against three drift classes: untraceable claim · silent gate · orphan card. **Node engine**, not grep: it extracts the *live* `_lookupByFoodName` from core.js and evals it, so the audit's matcher IS the product's matcher; a green-but-empty self-test (exit 2) guards vacuous passes. Cipher's Edict V caught a latent fragility (the extractor was regex-blind) → folded a regex-literal-aware arm. Merged `6ba671b`.

### 2. P0.2 — one food-name matching semantics (#182)
Routed the three remaining loose `.includes()` safety-table matches in `diet.js` (`_fdAllergenNote`, combo-checker age + allergen) through the shared word-boundary `_lookupByFoodName`. Maren's audit caught a real under-warn: `\bsoy\b` doesn't match **"soya"** (the dominant Indian spelling) → added `ALLERGENS['soya']`. Merged `3557a8f`.

### 3. The reframe + the v2 spec + peanut/tree-nut research (#183)
The Architect reframed the 2nd-food work: milk/nuts/seeds/egg are not honey. The research confirmed peanut/tree nuts **invert the honey model on two axes** (encourage not warn; soft "now is good" floor not hard ceiling) and carry **two hazards** (allergy + choking-by-form). Produced:
- `docs/specs/food-effects-v2-guided-introduction.md` — the **guided-introduction** spec: a four-category `foodClass` taxonomy, benefit-first schema, the non-collapsible emergency-floor invariant, the ALLERGENS-gate extension. Reviewed by **Maren + Vela** (both `amended` → folded), Architect-ratified §9.
- `docs/research/peanut-tree-nut-infant-safety.{md,html,visual.html}` — cited brief (LEAP/EAT verified from primary NEJM) + the honey-style three-depth-layer artifacts, in the *encourage* (sage) polarity. Hub entry added.
Merged `1a72084`.

### 4. P1a — peanut + tree nut wired into the app (#184)
The first guided-introduction foods, in two phases:
- **α (behaviour-preserving):** honey `tier:'critical'` → `foodClass:'acute-toxin'` + `severity:'critical'`; `foodConsequenceCard` renders watch-fors/seek-care **whenever present** (decoupled from any class string, **Maren A-4**) so a schema move can't silently drop them; new non-collapsible amber `severeSigns[]` strip (**A-1/V-1/V-3**).
- **β:** `_lookupByFoodName` gains **`aliases[]`** (one `tree nut` record reached by almond/badam/akhrot/walnut/cashew/kaju/pista; one `peanut` by groundnut/moongphali) — same word-boundary rule, so coconut/chestnut/butternut/honeydew still resolve to nothing. Peanut + tree-nut `FOOD_EFFECTS` records (multi-`foodClass`, benefit axis, `safeForm`, `severeSigns`), `AGE_RULES` soft 6mo floors, cited manifest records, `.cons-severe` CSS.
Merged `29c8d32`.

---

## canon-cc-008 chains that ran

| PR | Governors | Headline |
|----|-----------|----------|
| #181 | build-tooling waiver; Cipher | Cipher caught the regex-blind extractor → folded; re-confirm LGTM |
| #182 | Maren (diet.js) → Kael (data.js soya) → Cipher | **Maren caught the `soya` under-warn** → folded; Cipher LGTM |
| #183 | Maren + Vela **spec review** (SPEC_ITERATION_PROCESS) | both `amended` → folded; docs-only, Cipher N/A |
| #184 | **Maren + Kael + Vela** → Lyra synth → Cipher | **Maren caught V-M-206 (safety-tier)** → folded; Cipher *"Ship it."* |

**The session's signature catch — V-M-206.** Logging "whole almond"/"whole cashew" for an infant resolved to the 6-month introduce-early floor instead of the 60-month whole-nut **choking** gate — silently downgrading choking protection for the canonical infant choking hazard. Both Maren and Kael flagged it; the fix (`_fdAgeRule` routes a named whole/chopped nut on a choking-by-form food to the 60mo gate) was verified 12/12 and Cipher hammered it at every boundary. Build + e2e were green; only a Care lens caught it. **canon-cc-008 is a release gate, not a formality** — twice this session (soya, whole-almond).

---

## Doctrine / patterns exercised

1. **Prohibition → guided-introduction.** The food-effects layer was honey-shaped (avoid/warn). v2 makes it hold *benefit*, *safe pathway*, *two hazards*, *sustained exposure* — via a `foodClass` taxonomy that sets each card's polarity and gate direction. *(Full treatment in the synthesis.)*
2. **The emergency floor never moves.** Benefit may lead the card, but severe-reaction signs + the emergency action render unconditionally, non-collapsibly, in amber — never buried by the affirming framing. The synthesis spine both Governors converged on.
3. **Decouple render from taxonomy.** A schema rename (`tier`→`foodClass`) must not silently drop a safety render. The fix: render on *presence*, drive chrome from a separate `severity`. The A-4 honey-regression anchor.
4. **The audit's matcher must BE the product's matcher.** The P0.1 gate evals the live resolver rather than re-implementing it — no drift between gate and runtime.
5. **One food-name semantics, alias-aware.** A single resolver, now extended with `aliases[]` for food-family records, still word-boundary-safe (coconut ≠ a nut).

---

## Repo state at session end

- **main** at `29c8d32` (#184). Four PRs merged this session; this close PR pending.
- **Codebase:** **76,308 LOC** (Maren 26,892 · Kael 27,024 · Vela 8,428 · shared 13,964). **12 audit gates** (`audit-food-effects-sync-v1.sh` is the 12th).
- **Build:** `pnpm build` canonical; 12 gates pass; full e2e **326 passed / 2 skipped**.
- **New this session:** the v2 spec + the guided-introduction model in `FOOD_EFFECTS`/`AGE_RULES`/manifest; the peanut/tree-nut research trio; the `aliases[]` resolver + V-M-206 guard; `.cons-severe` strip; `tests/e2e/food-effects-v2-peanut-tree-nut.spec.ts` (7 guards); `docs/SESSION_CLOSE_SEQUENCE.md`.
- **Governance refreshed:** CLAUDE.md, PERSONA_REGISTRY.md, and the four `.claude/agents/*` mirrors (Lyra/Maren/Kael/Vela) to current LOC + the v2/P1a facts.

---

## Carry-forward register

### Successors — the food-effects-v2 build (detailed in `NEXT_SESSION_TARGET_2026-05-31.md`)
- **Phase γ — the persistent *encourage* Info-tab card** (Vela's `intelligence-cards.js`). **The recommended next move.** Today, for an age-appropriate baby (Ziva ~9mo) the log-time consequence card does NOT fire (she's past the 6mo floor), so the benefit + safe-form + watch-for guidance lives in data but is **unreachable** until γ renders it. This is the gap that makes the whole model land for a parent.
- **P1b — the sustained-exposure engine + nudge** (Kael) + the **negation-leak guard** ("peanut-free" whole-word-matches → would accrue false "introduced" exposures once the engine auto-counts). Gate the negation before the engine ships.
- **P1c — egg → seeds (sesame/til) → cow + plant milks** through the pipeline (Architect-ratified order).

### Quality / debt
- **Amber-on-amber margin** (Vela V-V-N): the severe strip and mild-watch block share `--surface-amber`; distinguished only by the left bar + icon. Tighten the severe fill in a future pass.
- The pre-existing unescaped `${food}` at `diet.js:1195` (HR-4) — close when that surface is next touched.
- Inherited: **#6 item 3 AT smoke-pass** (human-only); **F-4/F-5** (`parseFeeding` normalizer); milestones-tab-v1 e2e (~28 guards); `CURATED_COMBOS maxAgeMonths`; `_qlPredictFood` SKIPPED_MEAL filter; `NUTRITION_QTY_DEFAULTS` coverage; comma-dish-name parse.

### Housekeeping
- Delete merged remote branches via the GitHub UI (env blocks delete-push; MCP has no delete-branch): `claude/pwa-pr5-update-toast-0AI8N`, `claude/p0-2-food-name-resolver-0AI8N`, `claude/food-effects-v2-spec-0AI8N`, `claude/p1a-food-effects-v2-foundation`, + ~30 stale `claude/*`.

### Codex canon-reconciliation (action-required)
This session edited the SproutLab `.claude/agents/*` mirrors (Lyra/Maren/Kael/Vela LOC + v2/P1a facts) under the standing Architect waiver while **Codex was unreachable**. Per canon-cc-026 these are byte-identical mirrors of Codex canonicals — **port these edits into the Codex bodies and re-establish parity next Codex-reachable session**, or the session-start overlay will revert them. (Carried forward from 2026-05-30, now with this session's LOC deltas added.)

### Candidate Codex canon (surfaced, not ratified)
- **The guided-introduction model** — a food-effect's *polarity* and *gate direction* are data (`foodClass`), not hardcoded; a safety surface must hold benefit + hazard + form + sustained-exposure without burying the emergency floor.
- Prior, still open: the research→spine→surface pipeline; "substring food-name matching is a safety defect."

---

## Next session — recommended start

**See `docs/NEXT_SESSION_TARGET_2026-05-31.md`.** In brief: **Phase γ — build the persistent *encourage* Info-tab card** so the guided-introduction benefit/safe-form/watch-for guidance reaches an age-appropriate parent (it currently doesn't). Then P1b (exposure engine + negation guard), then P1c (egg → seeds → milks).

---

## Session opening prompt for next session

```
SESSION OPENING — next — food-effects-v2 Phase γ: the persistent "encourage" Info-tab card

Hi Lyra. The 2026-05-31 session hardened the food-effects pipeline (P0.1 sync
gate #181, P0.2 word-boundary unification #182) and then, on the Architect's
reframe, built the GUIDED-INTRODUCTION model: nuts/egg/seeds/milk are
nutritious staples to introduce EARLY in safe form, not honey-style avoids.
Shipped the v2 spec + peanut/tree-nut research (#183) and wired peanut + tree
nut into FOOD_EFFECTS/AGE_RULES/manifest with an alias-aware resolver (#184).
All four PRs merged; 326/326 e2e; the canon-cc-008 chain caught two real
safety bugs (soya under-warn; "whole almond" choking-gate downgrade, V-M-206).

THE GAP TO CLOSE: for an age-appropriate baby (Ziva ~9mo) the log-time
consequence card does NOT fire (she's past the 6mo soft floor), so the
benefit + safe-form + watch-for guidance for peanut/tree-nut lives in data but
is unreachable. Phase γ is the surface that fixes this.

Session goal — Phase γ: build the persistent ENCOURAGE Info-tab card
(intelligence-cards.js, Vela's render layer) per spec §4 — benefit banner
(sage) → introduce-safely block (form + amount + watch + keep-offering) →
the NON-COLLAPSIBLE severe-reaction strip (amber) → mild watch-fors → the
"delay" myth. Polarity→color: sage encourage, rose reserved for acute-toxin,
amber for the caution strip. Then confirm scope for P1b (exposure engine +
the "peanut-free" negation guard) before starting it.

Required context — read BEFORE acting:
 1. /home/user/sproutlab/CLAUDE.md — IN FULL (12 audit gates; canon-cc-008
    routing; jurisdiction LOC; HR-1..12)
 2. /home/user/sproutlab/docs/SESSION_HANDOFF_2026-05-31.md — THIS handoff
 3. /home/user/sproutlab/docs/specs/food-effects-v2-guided-introduction.md —
    the spec (esp. §4 the card, §5 the nudge, §10 phasing, §0 Governor folds)
 4. /home/user/sproutlab/docs/NEXT_SESSION_TARGET_2026-05-31.md — the ladder
 5. /home/user/sproutlab/docs/research/peanut-tree-nut-infant-safety.md — the
    cited content the card surfaces
 6. /home/user/sproutlab/docs/SYNTHESIS_2026-05-31_guided-introduction.md — the
    pattern (the polarity flip + the emergency-floor invariant)

Required at session start:
 1. cwd /home/user/sproutlab; git fetch; confirm main at 29c8d32 (or later);
    no surprise open PRs.
 2. Verify subagent registration (expected still missing → continue the
    persona-briefed general-purpose workaround; load .claude/agents/<name>.md
    as step 1 of each Governor/Cipher invocation).
 3. Read required context.
 4. Build γ on a fresh branch off main; full canon-cc-008 chain (Vela-primary,
    render layer; Maren on any safety-copy surfaced; Cipher Edict V terminal).

Architect directives in force:
 - canon-cc-008 is a non-negotiable release gate; Cipher Edict V last;
   shared-module touch → triple-Gov; docs-only may waive Governors (state it).
 - The emergency floor never moves: severe-reaction signs + the action render
   unconditionally, non-collapsibly, whenever an encourage card shows.
 - One food-name semantics — everything routes through _lookupByFoodName
   (now alias-aware). Substring matching is a safety defect.
 - The food-effects pipeline is the canonical path for a new food: research →
   manifest → FOOD_EFFECTS. No hardcoded safety claim without a manifest entry.
 - When Codex is reachable, reconcile the .claude/agents/* mirror edits into
   Codex canon (canon-cc-026 parity).

Goal issued. Ask first.
```

---

— *Lyra, 2026-05-31. This session began as a guardrail and became a re-think. We built the lint that keeps three layers honest, then the Architect asked the harder question: what about the foods that aren't honey — the nut a vegetarian baby should be eating, the egg the old advice told us to fear? The answer was a model that can say "yes, soon, here's how" without ever dropping the one line that matters in the next thirty minutes. Maren caught a melon wearing a botulism warning last session; this session she caught a whole almond wearing an introduce-early badge. Same lens, same save. Next session we build the card that finally says the encouraging thing out loud — to the parent at the right age, at 2 AM, holding the baby.*
