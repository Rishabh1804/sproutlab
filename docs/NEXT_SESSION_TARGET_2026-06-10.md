# Next-session target — 2026-06-10 → next

**Operator (set by):** Lyra (The Weaver) — the 2026-06-10 Ceres-seating close.
**Session artifacts:** `docs/SESSION_HANDOFF_2026-06-10.md` · `docs/SYNTHESIS_2026-06-10_self-review-blindness.md` · SproutLab PR #245 (merged, `a2084fb`).

> The *standing pointer* to the highest-value next move. The handoff records the past; this records the intended future. Amend **this** file if priorities shift.

---

## The recommended next move

**Resolve the Kael 30K cliff BEFORE the next engine-heavy build** — the same shape of decision the last close pointed at for Maren, now moved one Governor over. With the Care→Nutrition split shipped, Maren is comfortable (~7,801 headroom) but **Kael (Intelligence engine) is at 28,153 LOC — ~1,847 from the 30K `canon-gen-001` trigger.** `core.js` and `data.js` carry the steepest engine growth; the next feature that adds to any engine module will likely cross it. The standing plan (PERSONA_REGISTRY §future-scaling) is a third generational split: **CareTickets + Illness state machines → a new state-machine-layer Governor.** This is an Architect governance call — make it deliberately, not mid-build.

**If product work comes first instead:** resume the **food-effects / Recipes** arc (the standing product line, now squarely in **Ceres's** jurisdiction — `diet.js` + `recipes.js`). Read the latest food-effects target/handoff for the live state before picking a node.

**First, always:** confirm clean on synced `main` (`git status`, `git --no-pager log --oneline -8`) and read the latest food-effects handoff/target for the live product state.

---

## Priority ladder

### P0 — governance: the Kael 30K cliff
- **Decide whether to pre-split the Intelligence engine now** (proactive, like Vela split from Kael and Ceres from Maren) **or hold** until an actual 30K crossing. Kael is the nearest-term candidate at ~1,847 headroom and self-named it.
- **If splitting:** the standing plan is **CareTickets + Illness state machines → a new Governor** (state-machine layer) — `intelligence-caretickets.js` (2,230) + `intelligence-illness.js` (2,667) ≈ 4,897 LOC peeled off, dropping Kael to ~23,256. Follow the canon-gen-001 mechanics now proven twice (two parents: Lyra + Kael; distinct archetype; predecessor takes Rung-2; force-add the new `.claude/` pair; quad→quintuple shared review).

### P1 — Codex reconciliation (owed from this session)
- Land the **`ceres.md` agent+skill pair** + the **de-staled `maren.md` / `kael.md` / `vela.md` / `lyra.md` mirrors** at **Codex canonical source** (canon-cc-026 — the SproutLab `.claude/` copies are mirrors, not the source of truth).
- **Confirm `canon-cc-031 / -032 / -033` exist** in Codex (ceres.md:151–152 cites them — peer-review doctrine / two-reviewer convergence / Mode-2 deferral-closure). If any is a dangling forward-ref, ratify or correct.
- Land **#244's naming-lore** at Codex source too (the Lyra/Ziva meridian paragraph), so the mirrors carry it.

### P2 — product (unchanged): the food-effects / Recipes arc
Pick up the live product target. Any `split/` change runs the **full canon-cc-008 gate** — post-split routing: home/medical→Maren, **diet/recipes→Ceres**, engine→Kael, render→Vela, shared→all four. Run `pnpm qa-route` on the real diff.

### P3 — tooling / governance follow-ups (inherited)
- Propagate `/session-close` + `/sproutlab-compact` byte-identical to another repo (loadable `SKILL.md` directory shape).
- Ratify the **skill-deployment-shape doctrine** into `canon-cc-026` via the `canon-cc-027` chain.
- Write the Codex chronicle of the 2026-06-05 canon work (`data/journal.json`, canon-cc-010).
- **Kael/Vela spec-body LOC refresh** — `kael.md`/`vela.md` carry dated 2026-05-31 snapshots (27,024 / 8,428); refresh to current 28,153 / 9,210 in a future LOC pass.

---

## Carry-forward register (inherited + new)

### Human-only / Architect gates
- **AT smoke-pass** (TC-1…TC-6 on the device matrix; VoiceOver / TalkBack / NVDA against the live deploy). *(Inherited.)*
- **NEW — Kael 30K-split decision** (P0 above). Governance, Architect-only.
- **#244 (meridian / Ziva's First Sky)** — rebased DRAFT, the Architect's. Comes out of draft on the Architect's call; its own canon-cc-008 gate applies then.

### Successors
- **Codex reconciliation of this session's `.claude/` mirror edits** (P1 above) — `ceres.md` pair + de-staled Maren/Kael/Vela/Lyra; forward-ref check; #244 lore. *(NEW.)*
- **Legacy baby-name hardcode migration** — `core.js` avatar `alt`, `medical.js` growth-chart labels, `diet.js` `_emDocName` fallback still hardcode `'Ziva'`. Migrate to `_syncHousehold.name` **deliberately, in one pass**; do NOT fix opportunistically. (`[[flexible-name-debt]]`.) *(Inherited.)*

### Maren-tier finding (inherited, still open)
- **`--doc-placeholder` on the printed doctor card = 3.29:1 (below AA 4.5).** Two-part on the *printed* emergency handoff: (a) contrast — `.doc-na` "N/A" markers + unstamped fields at 3.29:1; (b) semantics — an unstamped field prints its literal screen instruction `<em>tap to stamp now</em>`. Render: `_geDocFace` (`intelligence-cards.js`) + `_emDocFace` (`diet.js`); colour: `--doc-placeholder` in `styles.css` `.docface` + `@media print`. Fix: re-force `--doc-placeholder` to ≥4.5:1 on `#fff` (≈`#6e6060`) in the print block + suppress the print instruction. **Touches `styles.css` (shared, quad-Gov) + two render modules → full canon-cc-008 gate + Architect go-ahead.** Route to **Maren** (Care; medical-printout legibility) + **Vela** consult (render). Recorded #242; not fixed.

### Candidate Codex canon (surfaced, not ratified)
- **NEW — self-review blindness doctrine** (`docs/SYNTHESIS_2026-06-10_self-review-blindness.md`): an author reviewing their own broad mechanical propagation is blind to the surfaces they didn't think to touch; the independent reviewer's value is re-deriving the coverage set. Argues the Cipher Edict-V pass is load-bearing even on docs-only changes. Candidate for a canon-cc note on why the final-pass isn't redundant with synthesis.
- *Inherited:* flip-card bleed-through CSS doctrine (visibility-swap state machine); the skill-deployment-shape doctrine; two-tier evidence discipline; the floor follows the hazard; `safeForm` as general gate-carrier; alias-precedence host-guard; research→manifest→FOOD_EFFECTS pipeline.

### Quality / debt (inherited, unchanged)
- Amber-on-amber margin; `${food}` HR-4 at `diet.js:1195`; F-4/F-5 (`parseFeeding`); milestones-tab-v1 e2e; `CURATED_COMBOS maxAgeMonths`; `_qlPredictFood` SKIPPED_MEAL; `NUTRITION_QTY_DEFAULTS` coverage; comma-dish-name parse.
- *Inherited cosmetic:* residual empty space on the shorter doctor face (dark padding; cosmetic).
- *Contrast-audit candidate (likely false positive):* `--tc-sage-light` measures 3.66:1 on bare card, but its real backgrounds are tinted badges / dark-theme severity chips — confirm render context before treating as a bug.

### Housekeeping
- Stale merged `claude/*` remote branches (env blocks delete-push) — clear via the GitHub UI. The `seat-ceres-governor-nutrition` branch was auto-deleted on merge.

### Codex reconciliation
- **OWED (new this session).** See P1. First session since the 2026-06-07 close to edit governed `.claude/` mirrors — the canonical bodies are now out of sync with Codex until reconciled.

---

*— Lyra. The split that pressed on Maren is shipped, and the pressure has simply walked one province over: Kael now stands where Maren stood, ~1,847 lines from his own frontier, the third generation already named in the plan. Point the next weaver there before they build into the engine — and remember the mirrors owe Codex a reconciliation.*
