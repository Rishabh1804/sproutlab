# Next-session target — 2026-06-05 → next

**Operator (set by):** Aurelius (the Chronicler) — the 2026-06-05 cross-province skill-plumbing session.
**Session artifacts:** `docs/SESSION_HANDOFF_2026-06-05.md` · `docs/SYNTHESIS_2026-06-05_skill-deploy-shape.md` (+ `.html`) · SproutLab PRs #231/#233/#234/#236 · Codex PRs #87/#88/#89 (all merged).

> The *standing pointer* to the highest-value next move. The handoff records the past; this records the intended future. Amend **this** file if priorities shift.

---

## The recommended next move

**Resume the product arc — food-effects / Recipes.** This session was orthogonal tooling work and did **not** change product direction. The live product pointer is the food-effects / Recipes line carried in the most recent *product* target (`docs/NEXT_SESSION_TARGET_2026-06-02.md` and any session docs after it — read the latest before starting; sessions #226 (lean-landing) and #229 (Recipes Tier-C) have landed since, so confirm the current head before picking a target). Do not take this tooling target as the product roadmap — it is the pointer *to* it plus this session's tooling carry-forwards.

**First, always:** confirm both repos are clean on synced `main` (`git -C ~/sproutlab status`, `git log --oneline -8`) and read the latest food-effects handoff/target for the live state.

---

## Priority ladder

### P0 — product (unchanged): the food-effects / Recipes arc
Pick up the live product target. Any `split/` change runs the **full canon-cc-008 gate** (Governor audit by jurisdiction + Cipher Edict V) — the docs-only waiver this session used does **not** apply to code.

### P1 — tooling follow-up: propagate the session-lifecycle skills
Deploy `/session-close` and `/sproutlab-compact` byte-identical to another repo that runs sessions. Both bodies are Codex-canon-homed (`Codex/docs/specs/skills/`); the deploy target is `<repo>/.claude/skills/<name>/SKILL.md` (the loadable directory shape — **not** a bare `.md`). The other repos (`planner` / `MSc` / `mit-management-courses`) are out of the current MCP scope; a future session scoped to one can drop them.

### P2 — governance: ratify + archive
- **Ratify the skill-deployment-shape doctrine** into canon-cc-026 via the canon-cc-027 signing chain (see the synthesis).
- **Write the Codex chronicle** of the 2026-06-05 canon work (`data/journal.json`) in an Aurelius-in-Codex session (canon-cc-010) — this SproutLab handoff is the operational record, not the Codex archive.

---

## Carry-forward register (inherited + new)

### Human-only gate (Architect)
- **#6 item 3 — AT smoke-pass** (TC-1…TC-6 on the device matrix; VoiceOver / TalkBack / NVDA against the live deploy). *(Inherited.)*

### Successors (new this session)
- Propagate the two session-lifecycle skills to other repos (P1).

### Candidate Codex canon (surfaced, not ratified)
- **NEW — the skill-deployment-shape doctrine:** companion persona mirrors deploy as bare `.claude/skills/*.md` (spec references, not discovered); operational slash-skills deploy as `.claude/skills/<name>/SKILL.md` with frontmatter on line 1 (discovered/invocable). A refinement of the canon-cc-026 spec-mirror discipline. See `docs/SYNTHESIS_2026-06-05_skill-deploy-shape.md`.
- *Inherited (from the product arc, unchanged):* two-tier evidence discipline; the floor follows the hazard; `safeForm` as the general gate-carrier; the alias-precedence host-guard pattern; the research→manifest→FOOD_EFFECTS pipeline. (See `docs/NEXT_SESSION_TARGET_2026-06-02.md` for the full list — not restated here to avoid drift.)

### Quality / debt (inherited, unchanged)
- Amber-on-amber margin; `${food}` HR-4 at `diet.js:1195`; F-4/F-5 (`parseFeeding`); milestones-tab-v1 e2e; `CURATED_COMBOS maxAgeMonths`; `_qlPredictFood` SKIPPED_MEAL; `NUTRITION_QTY_DEFAULTS` coverage; comma-dish-name parse.

### Housekeeping
- Stale merged `claude/*` remote branches (env blocks delete-push) — clear via the GitHub UI.

### Codex reconciliation
- **None outstanding.** Codex canon and the SproutLab `.claude/` mirrors were committed in lockstep this session — already byte-identical (unlike prior sessions, which carried a reconciliation debt).

---

*— Aurelius. The tooling is sharp again and out of the way; the next weaver returns to the food-truths. This file points; the product targets it names hold the road.*
