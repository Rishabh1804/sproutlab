# Next-session target — 2026-06-07 → next

**Operator (set by):** Lyra (The Weaver) — the 2026-06-07 General-Emergency-Room-v2 session.
**Session artifacts:** `docs/SESSION_HANDOFF_2026-06-07.md` · SproutLab PR #235 (merged) · `Memory.md` flexible-name decision (`6431a1f`) · this governance/LOC refresh.

> The *standing pointer* to the highest-value next move. The handoff records the past; this records the intended future. Amend **this** file if priorities shift.

---

## The recommended next move

**Settle the Maren-jurisdiction / 30K-split question BEFORE the next Care-heavy build.** With `recipes.js` (615 LOC, Diet→Recipes corpus) counted under Care, **Maren is at ~29,774 LOC — ~226 from the 30K Governor-split trigger.** The next feature that adds anything to `home.js` / `diet.js` / `medical.js` will likely cross it. Per `canon-gen-001`, crossing 30K in a jurisdiction triggers a second-generation Governor split. This is a governance decision the Architect must make — it should not be discovered mid-build.

**If product work comes first instead:** resume the **food-effects / Recipes** arc (the standing product line, unchanged by this session). Read the latest food-effects target/handoff for the live state before picking a node.

**First, always:** confirm clean on synced `main` (`git status`, `git --no-pager log --oneline -8`) and read the latest food-effects handoff/target for the live product state.

---

## Priority ladder

### P0 — governance: resolve the Maren 30K cliff
- **Decide `recipes.js`'s jurisdiction.** Its domain is diet/food-safety → naturally Care (Maren); its concat position groups it with the data corpus (`data.js`, Kael's). This close filed it **provisionally under Care** as a factual build member and refreshed the LOC table — but the *jurisdiction ratification* is the Architect's call (it determines whether Maren is at 29,774 or 29,159, i.e. how close the split actually is).
- **Decide whether to trigger a `canon-gen-001` Care split now** (proactive, like Vela split from Kael) or hold until an actual 30K crossing. Maren explicitly named herself "nearest-term split candidate" at 27,975; she is now materially closer.

### P1 — product (unchanged): the food-effects / Recipes arc
Pick up the live product target. Any `split/` change runs the **full canon-cc-008 gate** (Governor audit by jurisdiction + Cipher Edict V).

### P2 — tooling / governance follow-ups (inherited)
- Propagate `/session-close` + `/sproutlab-compact` byte-identical to another repo (the loadable `SKILL.md` directory shape, not a bare `.md`).
- Ratify the **skill-deployment-shape doctrine** into `canon-cc-026` via the `canon-cc-027` chain.
- Write the Codex chronicle of the 2026-06-05 canon work (`data/journal.json`, `canon-cc-010`).

---

## Carry-forward register (inherited + new)

### Human-only gate (Architect)
- **AT smoke-pass** (TC-1…TC-6 on the device matrix; VoiceOver / TalkBack / NVDA against the live deploy). *(Inherited.)*
- **NEW — recipes.js jurisdiction + Maren 30K-split decision** (P0 above). Governance, Architect-only.

### Successors (new this session)
- **Legacy baby-name hardcode migration** — `core.js` avatar `alt`, `medical.js` growth-chart labels, `diet.js` `_emDocName` fallback still hardcode `'Ziva'`. Migrate to `_syncHousehold.name` **deliberately, in one pass**; do NOT fix opportunistically without the Architect re-opening it. (`[[flexible-name-debt]]`.)

### Candidate Codex canon (surfaced, not ratified)
- **NEW — the flip-card bleed-through CSS doctrine.** `backface-visibility:hidden` is unreliable across browsers/GPUs for 3D flip cards; the durable pattern is a **visibility-swap state machine** (toggle each face's `visibility` at the flip midpoint). Reuse for any future flip card; candidate for the design-principles floor if a second flip surface appears.
- *Inherited (from the 2026-06-05 close):* the skill-deployment-shape doctrine.
- *Inherited (from the product arc):* two-tier evidence discipline; the floor follows the hazard; `safeForm` as the general gate-carrier; the alias-precedence host-guard pattern; the research→manifest→FOOD_EFFECTS pipeline.

### Maren-tier finding — surfaced by the new contrast-audit tool (NEW)
- **`--doc-placeholder` on the printed doctor card = 3.29:1 (below AA 4.5).** Found by `tools/contrast_audit.py`. Two-part issue, both on the *printed* emergency handoff (`.fp-back`, which prints): **(a) contrast** — the `.doc-na` "N/A" markers and unstamped fields render at 3.29:1; **(b) semantics** — an unstamped field prints its literal screen instruction `<em>tap to stamp now</em>`, which is meaningless and faint on paper. Render: `_geDocFace` (`intelligence-cards.js`) + `_emDocFace` (`diet.js`); colour: `--doc-placeholder` in `styles.css` `.docface` + `@media print` block. **Recommended fix** (same pattern as the PR #235 `--tc-rose` re-force): in the print docface block, re-force `--doc-placeholder` to ≥4.5:1 on `#fff` (≈`#6e6060`), and ideally suppress the "tap to stamp now" instruction in print. **Touches `styles.css` (shared, triple-Gov) + the two render modules → full canon-cc-008 gate + Architect go-ahead required.** Route to **Maren** (Care; medical-printout legibility) with **Vela** consult (render). Not fixed this session — documented only.

### Quality / debt (inherited, unchanged)
- Amber-on-amber margin; `${food}` HR-4 at `diet.js:1195`; F-4/F-5 (`parseFeeding`); milestones-tab-v1 e2e; `CURATED_COMBOS maxAgeMonths`; `_qlPredictFood` SKIPPED_MEAL; `NUTRITION_QTY_DEFAULTS` coverage; comma-dish-name parse.
- *Inherited cosmetic:* residual empty space on the shorter doctor face (dark padding; not pursued — cosmetic).
- *Contrast-audit candidate (likely false positive):* `--tc-sage-light` measures 3.66:1 on bare card, but its real backgrounds are tinted badges / dark-theme severity chips, not bare card — the tool pairs by naming convention, so confirm the actual render context before treating as a bug.

### Housekeeping
- Stale merged `claude/*` remote branches (env blocks delete-push) — clear via the GitHub UI.

### Codex reconciliation
- **None outstanding.** This was a single-repo SproutLab session; no `.claude/` mirror edits, no Codex canon touched.

---

*— Lyra. The card is shipped and the thread is clean — but the map now shows Maren standing two hundred lines from her own frontier. Point the next weaver at that line before they build into Care, not after.*
