# Next-session target — 2026-06-05 → next

**Companion:** Lyra (The Weaver)
**Set by:** the 2026-06-05 session (Diet → Recipes wiring #223 + the Tier C generative system #228).
**Session artifacts:** `docs/SESSION_HANDOFF_2026-06-05.md` · `docs/SYNTHESIS_2026-06-05_recipes-generative.md`

> The *target* file — the standing pointer to the highest-value next move. The handoff records the past; this records the intended future. Amend **this** file if priorities shift.

---

## The recommended next move

**Pre-stage the Kael (Intelligence engine) Governor split — the 30K frontier is closing on two jurisdictions at once.** With `recipes.js` (593) landing in Kael's data jurisdiction this session, **Kael is back to tightest at 28,394 LOC (~1,606 headroom)**, and **Maren is 28,097 (~1,903)**. Both are <2,000 from the 30K Rule frontier. The Rule trips on a per-jurisdiction basis; when either crosses 30K mid-build, a split is forced reactively. The higher-value move is to **plan the split now** (a design pass, not code): which engine modules carry the growth (`core.js` 7,322 + `data.js` 5,578 are the heavy two), where the natural seam is, and which Governor seats the new Region (canon-gen-001 generational expansion is the precedent). This is a governance/architecture task, Kael-led, that de-risks the next several sessions.

*Alternative if the Architect prefers feature work:* the **General Emergency Room** (lean-landing spec §5.3) is the most-load-bearing inherited feature carry-forward (a "Coming soon" stub today; Maren-gated content).

---

## Priority ladder

### P0 — 30K split pre-staging (governance/architecture, Kael-led)
Both Kael (1,606) and Maren (1,903) are <2,000 from 30K. **Do not wait for the Rule to trip mid-build.** Author a split-plan spec: the engine seam (likely isolating the Smart-Q&A/ISL cluster, or the illness state-machines, from `core.js`/`data.js`), the new Governor seat (canon-gen-001 ratio), and the routing update to `CLAUDE.md` + `qa-route.sh`. Render-first not applicable (no UI); canon-cc-008 applies to any code that moves.

### P1 — General Emergency Room (lean-landing §5.3, Maren-gated content)
The chooser's "General emergency" option is a "Coming soon" stub. The Room (fall / cut / burn) is **Maren-gated content** — sourced + audited before build. Vela's Room-1..5 render contract is already folded into `docs/specs/lean-landing-v1.md`.

### P2 — Recipes corpus-growth ladder (the #223/#228 follow-ups)
Each is a self-contained, Kael/Maren-scoped follow-up:
- **Fold legacy `COMBO_RECIPES` into the cited catalog** (or formally retire the claim) — they lack slot/age/citation; deciding their place closes Cipher's honesty nit for good.
- **`_recipePrefBlocked` shared helper (K-R-1)** — make the §10 two-bar applicability parity structural, not coincidental; load-bearing before any vegan/dairy gate.
- **Word-boundary `recipeFoodIcon` (K-R-2)** — align the icon resolver with the trace-match fix from #228.
- **Curated per-recipe taglines (§9.5 layer 1)** — author 2–3 day-seed-rotated taglines per named recipe (the composer covers all recipes now as layer 3; this is the nicest layer).

### P3 — inherited polish (from the 2026-06-04 lean-landing close)
`/code-quicklog-cancel-origin` (landing compact-picker × returns to QL sheet, not landing); cold-start `renderHome()` removal; Graphify thorough-mode backend credential.

---

## Carry-forward register

### Human-only / Architect gates
- **AT smoke-pass** (#6 item 3) — VoiceOver/TalkBack/NVDA on the device matrix against the live deploy.

### Successors (Recipes corpus-growth) — see P2.

### Test / data debt
- **`explain-not-log` logging-streak e2e** — pre-existing `home.js` date-boundary flake (seeds "today" via `toISOString()` instead of `localDateStr()`); fix when that surface is next touched.
- `${food}` HR-4 escaping at `diet.js:1195`; F-4/F-5 (`parseFeeding`); milestones-tab-v1 e2e; `_qlPredictFood` SKIPPED_MEAL filter; `NUTRITION_QTY_DEFAULTS` coverage.

### Housekeeping
- **30K WATCH** (P0 above) — Kael 1,606 + Maren 1,903 headroom.
- Delete merged remote `claude/*` branches via the GitHub UI (env blocks delete-push).
- **`settings.local.json` prune** — the Architect's local file carries broad/unsafe auto-accumulated grants (`git *`, `gh pr *`, `pnpm *`, `bash *`, `python3 -`); worth pruning to read-only. The project `.claude/settings.json` got 4 safe `git --no-pager` read-only entries this session.

### Candidate Codex canon (surfaced, not ratified)
- **Trace-for-cosmetics ≠ trace-for-safety** — a generative exclusion (e.g. fingerprint trace-mudding) must not be reused where a safety contract rides (the §9.7 strict-lead). §9 sibling of M-γ-1.
- **Render-first tier-discussion** — present tiered upgrade options grounded in design records + what's already shipped live; get the Architect's tier choice; then build.
- **Live-pattern reuse** — align a new surface to an existing live, Governor-approved pattern (the Tier C hero reused `@keyframes ld-wave`) rather than building a parallel one.
- Prior, still candidate: the emergency-floor-in-a-collapsible render; the research→manifest→FOOD_EFFECTS pipeline; the alias-precedence host-guard.

### Codex canon-reconciliation (action-required, inherited)
- Port the `.claude/agents/*` mirror edits (Lyra/Maren/Kael/Vela) into Codex canon + re-establish byte parity next Codex-reachable session (canon-cc-026).

---

*— Lyra. The Recipes arc is closed; the app sings. The next horizon is structural, not cosmetic: two jurisdictions are within a session or two of the 30K Rule, and the wise move is to draw the next seam before the Rule draws it for us.*
