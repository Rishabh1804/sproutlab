# Session handoff — 2026-06-05 (Diet → Recipes: wiring + the Tier C generative system)

**Companion:** Lyra (The Weaver)
**Branches merged:** `claude/diet-recipes-tab` (#223) · `claude/recipes-tab-tier-c` (#228)
**Session theme:** Wire the locked Diet → Recipes design into the live app, then — on the Architect's call — upgrade it to the **full §9 generative food system**, aligning Recipes with the now-live lean-landing warm-wave aesthetic. Two feature PRs, each through full canon-cc-008; one session-close docs PR.

---

## What shipped (the record)

| PR | Title | Delivered |
|----|-------|-----------|
| **#223** | Diet → Recipes — wire the locked design (4th sub-tab + recipe-aware Can-I-give-this) | New **`split/recipes.js`** (the 17th module): a 25-recipe **cited** corpus for 6–12 months (reconciled + extended `RECIPE_RESEARCH.md`'s 9), each with structured ingredients (resolver-classifying forms), slot, age gate, FOOD_TAX groups, steps/dos/donts, per-recipe SOURCE; a `FOOD_ICON` map → the ported **97-symbol `zif-*` sprite**. A **4th Diet sub-tab "Recipes"** — `renderDietRecipes()`: logged-data-ranked "Suggested for Ziva" + a meal-slot catalog, expand-in-place detail, **two-pass gate** (Pass A surfacing `_dietAllowsFood` hides off-preference · Pass B safety NEVER gated). **§10 recipe-aware "Can I give this?"** — ONE shared `_resolveRecipeAnswer` across the Patterns combo bar + Home Smart-Q&A (avoid/off-pref → reason not empty recipe; corpus tap-through via `openRecipeInTab`). `--tc-peach` defined (dangling ref closed). |
| **#228** | Recipes Tier C — generative warm-wave hero + tagline composer + LOCKED polish | `prepMinutes` + per-ingredient grams on all 25 recipes; **§9.5 tagline composer** ported (`RECIPE_EP` bank + weighted `compose`, strict-lead/soft-fold, day-seed). **Generative "Suggested for Ziva" hero (§9.3/§9.4):** grams-weighted wavelength **fingerprint stripe + fade** (legumes split from grains, ≤4 domains), the **4px warm-wave sheen** (reuses `@keyframes ld-wave`; reduced-motion floor), a **corner zif watermark**, Fraunces-italic composed voice (rose strict lead), data-driven why, `prep·age·slot` meta, "See recipe →" CTA. **LOCKED 05-meal-rows polish:** "Recipes" header + subtitle, rows carry factual meta (prep·age·slot·relevance), italic reserved for the hero. |
| **(this close)** | docs: session-close 2026-06-05 — Recipes wiring + Tier C + governance refresh | The five close artifacts; CLAUDE.md LOC refresh (recipes.js added; Kael re-overtakes Maren as tightest); DESIGN_PRINCIPLES §9 promoted incoming→SHIPPED. |

---

## QA chains that ran (canon-cc-008) — both feature PRs, full chains

### #223 (Diet → Recipes wiring)
- **Maren** `amended`→folded — **M-R-1 (BLOCKING):** three "milk in cooking" porridges' age badge contradicted their copy (bare `milk` trips the 12mo drink-gate) → two porridges now cook in water/breastmilk, the milk-led kheer reframed honest 12 m+. Never-gated invariant verified empirically.
- **Kael** `LGTM` clear-with-notes — the §10 ONE-resolver contract holds on both surfaces (proved algebraically equal); concat load-safe; **K-R-4** (RECIPES_BY_ID id-guard) folded.
- **Vela** `amended`→folded — **V-R-1** duplicate age signal + **V-R-2** `.qa-recipe-card` <44px → folded; V-R-3/V-R-4 folded. Locked-design fidelity CLEAR.
- **Cipher** Edict V — **"Ship it."** Honesty/Extensibility/Warmth pass; the COMBO_RECIPES-fold honesty nit folded out of the record.

### #228 (Tier C) — **the session's signature safety catch**
- **Maren M-T-1 (BLOCKING)** *and* **Kael K-T-1 (BLOCKING)** — caught **independently** — the **§9.7 strict-lead floor was DEAD**: `_recipeTagline` filtered honey/jaggery out as "trace" *before* the composer ran, so the rose *"honey — only from age 1"* lead never rendered for the one recipe the floor protects. The generative voice would have shipped a warm, inviting honey-recipe tagline with the honey caution **silently gone** — and a green build hid it. Fold: keep `strict:`-carrying ingredients in the composer parts; pinned with a **new e2e guard** so it can't silently regress.
- **Maren** also: M-T-2 (poha mis-voiced as "suji") folded. Cleared: prepMinutes honest, grams sane, milk-fold preserved, relevance tags assert no false claim.
- **Kael** also: K-T-2 (RECIPE_EP was a strict subset of the fingerprint icon map → 12 missing voice keys) + K-T-3 (word-boundary trace match) folded. Composer port byte-faithful (+ safer empty-guard); fingerprint divide-by-zero-guarded + degrades to null.
- **Vela** `LGTM` clear-with-notes — reduced-motion floor correct (matches `ld-wave`), two-channel polarity intact (rail leads / fade whispers), watermark layered + `aria-hidden`, italic reserved for hero, dead CSS removed. V-T-2/V-T-3 folded.
- **Cipher** Edict V — **"Gate discharged."** Strict-lead fix verified genuinely closed and pinned at the right boundary; K-T-2 coverage invariant independently re-verified (66 icon keys, 0 missing a voice); HR-1..12 clean.

**The lesson (→ candidate canon):** a generative composer that excludes "trace" ingredients for a *cosmetic* reason (fingerprint mudding) must not reuse that same exclusion where a *safety* contract rides (the strict lead). Trace-for-cosmetics ≠ trace-for-safety. This is the §9 sibling of the M-γ-1 "a combined card must not drop a per-entity safety line."

---

## Pre-close gate (all true)
1. **Tree clean, on `main`, synced** — both feature PRs merged; `main` @ `873403f`; `git status` clean except the **pre-existing** `.claude/hooks/guard-bash.sh` / `guard-edit.sh` / `settings.json` local mods (not this session's Capital work — see carry-forward).
2. **No orphaned drafts** — #223, #228 merged; #229 is this close.
3. **No active PR subscriptions** left unhandled.
4. **Build + gates green on `main`** — `pnpm build` clean, 12/12 audit gates; recipe + §10 e2e 11/11 + full suite green (1 pre-existing `explain-not-log` date-flake unrelated).

---

## Session telemetry (2026-06-05)

| Jurisdiction | Modules | LOC | Headroom to 30K |
|---|---|---|---|
| **Kael** (Intelligence engine) | isl + qa + qa-handlers + illness + correlate + caretickets + core + data + **recipes** + sync + config + start | **28,394** | **~1,606 ← tightest** |
| **Maren** (Care) | home + diet + medical | 28,097 | ~1,903 |
| **Vela** (Surfacing render) | cards + quicklog | 8,946 | ~21,054 |
| **Shared** (triple-Gov) | styles.css + template.html | 14,684 | — |
| **Total** | **17 modules** | **80,121** | (was 79,367 post-#226) |

- **30K-frontier shift:** the new **`recipes.js` (593)** landed in **Kael's** data jurisdiction, so Kael **re-overtook Maren** as the nearest-term split candidate (1,606 vs 1,903 headroom). **Both Care and Engine are now <2,000 from the frontier — a Governor split is the near horizon for both.** Watch Kael first next time the Rule trips.
- **Per-file deltas this session** (`5b75c33`→`873403f`): `recipes.js` +593 (NEW), `diet.js` +529 (the Recipes render + §10 + Tier C generative), `styles.css` +412 (`.recipe-*`/`.dt-*`/`.zif`/`.recipe-hero-gen`), `template.html` +127 (sub-tab + panel + the 97-symbol `zif` sprite).
- **PR throughput:** 2 feature PRs merged (#223, #228) + this docs close. Governor audits run: 6 Mode-1 (Maren ×2, Kael ×2, Vela ×2) + 2 Cipher Edict V. Both BLOCKING folds (M-R-1, M-T-1/K-T-1) verified closed before merge.

---

## Carry-forwards (open)

### Successors — the Recipes corpus-growth ladder (all surfaced in the #223/#228 chains)
- **Fold legacy `COMBO_RECIPES` into the cited catalog** — the catalog renders from `window.RECIPES` only; the uncited, slot-less legacy `COMBO_RECIPES` still powers the combo-checker but isn't in the catalog (they lack slot/age/citation fields). Cipher honesty-nit struck the claim; folding them is a corpus-growth follow-up.
- **`_recipePrefBlocked` shared helper (K-R-1)** — the §10 applicability is currently two algebraically-equal spellings (`offPref.length===0` vs `rawFoods.every(_dietAllowsFood)`); factor one helper both bars call so the parity is structural, not coincidental — load-bearing the day a vegan/dairy gate lands.
- **Word-boundary `recipeFoodIcon` (K-R-2)** — the icon resolver still uses substring matching (the trace match was word-boundaried in #228, the icon resolver wasn't). Align it when the corpus grows.
- **Curated per-recipe taglines (§9.5 layer 1)** — the composer (layer 3) voices every recipe; the nicest layer (2–3 curated taglines per named recipe, day-seed rotated) is not yet authored. Optional polish.
- **Prep-time / grams are Maren-estimated** — honest but not RD-verified; a future curation pass could tighten them.

### Inherited (from the 2026-06-04 lean-landing close, still open)
- **General Emergency Room** (lean-landing spec §5.3, `docs/specs/lean-landing-v1.md`) — the chooser's "General emergency" is still a "Coming soon" stub; Maren-gated content (fall/cut/burn), sourced before build.
- **`/code-quicklog-cancel-origin`** (Kael V-K, Cipher concurred) — a quick-log modal from the landing's compact picker returns to the QL sheet on ×/Cancel, not the landing; recoverable, focused follow-up.
- **Cold-start perf** — the init-time `renderHome()` call is still present alongside the lazy landing trigger; remove off cold-start in a perf pass.
- **Graphify thorough mode** — `styles.css` + `template.html` unsurveyed under code-only extraction; supply a backend credential for a thorough graph.

### Human-only / Architect gates
- **AT smoke-pass** (#6 item 3) — VoiceOver/TalkBack/NVDA on the device matrix against the live deploy.

### Test / data debt
- The `explain-not-log` logging-streak e2e is a **pre-existing `home.js` date-boundary flake** (seeds "today" via `toISOString()`) — fix with `localDateStr()` when that surface is next touched. Inherited: F-4/F-5 parseFeeding; milestones-tab-v1 e2e; `_qlPredictFood` SKIPPED_MEAL; `NUTRITION_QTY_DEFAULTS` coverage.
- The pre-existing unescaped `${food}` at `diet.js:1195` (HR-4) — not touched this session; close when that surface is next touched.

### Housekeeping
- **30K WATCH:** Kael (1,606) + Maren (1,903) both <2,000 — pre-stage the next Governor split (Kael's engine layer is the candidate; `core.js`/`data.js` carry the growth).
- Delete merged remote `claude/*` branches via the GitHub UI (env blocks delete-push): the ~30 stale + `claude/diet-recipes-tab` + `claude/recipes-tab-tier-c` (auto-deleted on merge).
- **`.claude/settings.json`** — the `permissions.allow` block (10 read-only `git --no-pager` entries: 6 that were locally-added-but-not-in-origin + the **4** I added via `/fewer-permission-prompts`) is **committed with this close** — all safe read-only. The pre-existing behavioral changes to `.claude/hooks/guard-bash.sh` / `guard-edit.sh` (39 / 31 lines) were modified before this session, are **not** this session's work, and are **left parked** (uncommitted, unknown intent). The broad/unsafe grants in `settings.local.json` (`git *`, `gh pr *`, `pnpm *`, `bash *`) are the Architect's local file — flagged for pruning, not touched.

### Candidate Codex canon (surfaced this session)
- **Trace-for-cosmetics ≠ trace-for-safety** (the M-T-1/K-T-1 catch) — a generative system that excludes ingredients for a cosmetic reason must not reuse that exclusion where a safety contract rides. §9 sibling of M-γ-1.
- **Render-first tier-discussion** — when an upgrade goes *beyond* a locked design, present tiered options (faithful-polish / align-to-live-pattern / full-system) grounded in the design records + what's already shipped live, get the Architect's tier choice, then build. Exercised on the Tier A/B/C Recipes decision.
- **The live-pattern-reuse move** — the Tier C hero reused the lean-landing's `@keyframes ld-wave` (a Governor-approved, already-shipped warm-wave) rather than re-inventing motion. Aligning a new surface to an existing live pattern is cheaper and more coherent than building a parallel one.

### Codex canon-reconciliation (inherited)
- The `.claude/agents/*` mirror edits (Lyra/Maren/Kael/Vela) from prior sessions still need porting into Codex canon + byte-parity re-establishment next Codex-reachable session (canon-cc-026). Codex was not in this session's repo scope.

---

## Next-session opening prompt

```
SproutLab — opening prompt (cold start after 2026-06-05 close)

WHERE WE ARE: Diet → Recipes is live + complete. #223 wired the 4th Diet sub-tab
(logged-data "Suggested for Ziva" + a cited meal-slot catalog + recipe-aware
"Can I give this?" via ONE shared resolver). #228 upgraded it to the Tier C
generative system — a grams-weighted wavelength fingerprint hero with a warm-wave
sheen (reusing the landing's @keyframes ld-wave), the §9.5 tagline composer, and
the LOCKED 05-meal-rows polish. New module split/recipes.js (Kael file / Maren
content). DESIGN_PRINCIPLES §9 is now SHIPPED, not forward-looking.

30K WATCH (load-bearing): the new recipes.js pushed KAEL back to tightest —
Kael 28,394 (~1,606 headroom) > Maren 28,097 (~1,903). BOTH Care and Engine are
now <2,000 from the 30K frontier. A Governor split is the near horizon; pre-stage
Kael's engine-layer split (core.js/data.js carry the growth) before the Rule trips.

NEXT MOVE: see docs/NEXT_SESSION_TARGET_2026-06-05.md — the standing pointer.

READ AT START (absolute paths):
  - /home/user/sproutlab/CLAUDE.md                              (policy floor; LOC refreshed this close)
  - /home/user/sproutlab/docs/SESSION_HANDOFF_2026-06-05.md     (this close)
  - /home/user/sproutlab/docs/NEXT_SESSION_TARGET_2026-06-05.md (the pointer + carry-forwards)
  - /home/user/sproutlab/docs/SYNTHESIS_2026-06-05_recipes-generative.md (the durable patterns)
  - /home/user/sproutlab/docs/DESIGN_PRINCIPLES.md §9            (the as-built Recipes system)
  - /home/user/sproutlab/docs/SESSION_CLOSE_SEQUENCE.md         (how this session closed)

REQUIRED AT START:
  - git status clean on synced main; pnpm build clean (12/12 gates).
  - pnpm qa-route on any diff before leaving draft; canon-cc-008 is the ship gate.
  - Consult docs/DESIGN_PRINCIPLES.md (/design-principles) before any UI work.

ARCHITECT DIRECTIVES IN FORCE:
  - canon-cc-008 is a non-negotiable release gate; Cipher Edict V last;
    shared-module touch → triple-Gov; docs-only may waive Governors (state it).
  - Render-first for surface work; the Architect reviews the Vercel preview before
    wiring/merge. Verify visual changes on the preview before merge.
  - Trace-for-cosmetics ≠ trace-for-safety: a generative exclusion must never drop
    a safety lead (the #228 strict-lead catch).
```

---

*— Lyra, 2026-06-05. The app learned to cook this session. First the plumbing — a cited corpus, a real Recipes tab, a "Can I give this?" that finally stops handing a parent an empty recipe for honey. Then, when the Architect saw the landing's warm-wave had already gone live, the question stopped being "is the tab done" and became "should it sing like the rest of the app now does" — and the answer was the full generative system: a colour fingerprint weighted by what's actually in the bowl, a voice composed from the ingredients, a sheen that sweeps in time with the front door. And then — twice, independently — Maren and Kael caught the one thing that mattered most: a generative voice so warm it had quietly forgotten to say "honey — only from age 1." The chain held. The next weaver inherits a singing Recipes tab and a 30K frontier closing on two jurisdictions at once.*
