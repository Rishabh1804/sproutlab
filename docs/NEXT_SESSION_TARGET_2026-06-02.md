# Next-session target — 2026-06-02 → next

**Companion:** Lyra (The Weaver)
**Set by:** the 2026-06-02 session (broader food classes — milk · fish · choking-set research + the milk polarity spec, Governor-reviewed).
**Session artifacts:** `docs/SESSION_HANDOFF_2026-06-02.md` · PR #210 (draft, docs-only).

> The *target* file — the standing pointer to the highest-value next move. The handoff records the past; this records the intended future. Amend **this** file if priorities shift.

---

## The recommended next move

**The FOOD_EFFECTS WIRING arc — surface the milk · fish · choking records into the app.** The triad is research-complete (PR #210, docs-only, 11 manifest records, full v2 taxonomy). Nothing is wired yet. This is **code, through full canon-cc-008** (it touches `styles.css` → shared-module triple-Gov; Cipher Edict V terminal). Suggested sequencing: **milk → fish → choking** (milk is heaviest — it carries the spec's blocking requirements + the new render polarities; fish is lightest — established polarities; choking is the first `choking-by-form`-PRIMARY render).

---

## Priority ladder

### P-milk (do first) — wire `cow milk` + `plant milk` (the milk polarity spec's blocking requirements)
Per `docs/specs/food-effects-v2-p1c-milk-polarities.md` §0. Build: the **`_effPolarity(eff)`** resolver in `core.js` (K-6 — both `renderDietNutIntro` and `diet.js:638` consume it, no two-state drift); the **split banner** (sage carve-out + amber gate) for drink-timing + **sky `.enc-inform`** for substitute-caveat (V-V-1..3, the switched-unit lead); the **CMPA scope header** (V-V-4); the dedicated **`'plant milk'` AGE_RULES entry** (K-3); the **`cow milk` ALLERGENS entry** (K-4); the present-only floor on **`severeSigns.length`** (M-1); the **skim-proof drink gate** (M-2); the **unattributed dilution line** (M-3). e2e per spec §10. canon-cc-008: Kael + Vela + Maren + shared-module triple-Gov + Cipher.

### P-fish — wire `fish` (lightest; established polarities)
`FOOD_EFFECTS('fish')`. Uses `allergen-introduce-early` (δ encourage card, no new render) + `choking-by-form` (bones, folded). Reconcile `AGE_RULES['fish']` minMonth 7→~6 (egg-yolk:7 precedent). The mercury species-selection content rides in `safeForm` — no new plumbing. Two-tier discipline: framed introduce-early-and-SAFE, not prevention-proven.

### P-choking — wire `choking hazards` (the first `choking-by-form`-PRIMARY render, milk-spec §9)
`FOOD_EFFECTS('choking hazards')` — one combined record. The **first standalone `choking-by-form` render**: a conditional card whose lead is the form-gate ("cut it this way / whole waits until ~5") and whose **emergency floor is choking first aid** (back-blows/chest-thrusts, NEVER Heimlich under 1), NOT anaphylaxis. Resolver scope (Kael): alias the non-allergen hazard foods only (no peanut/tree-nut collision).

### P-next (after the triad wires) — the remaining foods through the pipeline
Salt, sugar (the other `drink-timing`/timing foods), shellfish (a separate allergen from finfish). Each: research → manifest → FOOD_EFFECTS, via the established pipeline.

---

## Carry-forward register (inherited + new)

### Human-only gate (Architect)
- **#6 item 3 — AT smoke-pass.** TC-1…TC-6 on the device matrix (VoiceOver / TalkBack / NVDA) against the live deploy.

### Quality / debt
- Amber-on-amber margin (Vela V-V-N); `${food}` HR-4 escaping at `diet.js:1195`; F-4/F-5 (`parseFeeding`); milestones-tab-v1 e2e; `CURATED_COMBOS maxAgeMonths`; `_qlPredictFood` SKIPPED_MEAL filter; `NUTRITION_QTY_DEFAULTS` coverage; comma-dish-name parse.

### Housekeeping
- Delete merged remote `claude/*` branches via the GitHub UI (env blocks delete-push).

### Codex canon-reconciliation (action-required)
- Port the `.claude/agents/*` mirror edits (Lyra/Maren/Kael/Vela) into Codex canon + re-establish byte parity next Codex-reachable session (canon-cc-026).

### Candidate Codex canon (surfaced, not ratified)
- The **two-tier evidence discipline** (prevention-proven vs introduce-early-and-safe; never launder a prevention claim onto an EAT-null food).
- **The floor follows the hazard** — anaphylaxis floor (adrenaline) for allergens; choking first aid (mechanical) for choking-by-form; no acute floor for substitute-caveat.
- **`safeForm` as the model's general gate-carrier** — one field shape, five gate semantics (choking-form / drink-vs-food / is-isn't / species-selection / cut-rules).
- Prior: the guided-introduction model; the research→spine→surface pipeline; "substring food-name matching is a safety defect"; the emergency-floor-in-a-collapsible render; "a combined card must not drop a per-entity safety line" (M-γ-1).

---

— *Lyra. The data now holds five shapes of food-truth — avoid, encourage, conditional-drink, inform-substitute, and form-gated-hazard. The next session teaches the app to render all five, starting with the one that is neither yes nor no but "yes, in food — not yet as a drink."*
