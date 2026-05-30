# Next-session target — 2026-05-30 → next

**Companion:** Lyra (The Weaver)
**Set by:** 2026-05-30 session (food-effects arc — F-3 Library + Finding A consequence surface, both merged to `main`).
**Companion artifacts:** `docs/SESSION_HANDOFF_2026-05-30.md` (full record) · `docs/SYNTHESIS_2026-05-30_food-effects-arc.md` (the pattern-read this target descends from).

> This is the *target* file — a standing pointer to the highest-value next move and the queue behind it. The handoff records the past; this records the intended future. If priorities shift between sessions, amend this file, not the handoff.

---

## The recommended next move

**Build the food-effects sync lint, then add the 2nd food through the pipeline.**

The session established a repeatable research→spine→surface pipeline (see the synthesis doc §"What now outlives the feature"). The right next move is to *harden the convention while it's cheap* (P0), then *exercise it once more* (P1) — proving the pipeline costs a fraction of the first food and surfacing any rough edges before the convention sets.

---

## Priority 0 — close the glue gap (do this first)

### P0.1 — Build-audit lint: `FOOD_EFFECTS` ↔ `food-effects.manifest.js` ↔ `AGE_RULES` sync
The three layers can silently drift: a food could get a `FOOD_EFFECTS` consequence record with no manifest entry (untraceable claim), or an `AGE_RULES` critical-tier gate with no consequence record (silent gate), or a manifest entry with no runtime projection. Add a `split/audit-food-effects-sync-*.sh` gate (pattern: the existing `split/audit-*.sh` gates) that fails the build if:
- a `FOOD_EFFECTS` key has no `food-effects.manifest.js` entry, or
- a `manifest` entry marked critical-tier has no `FOOD_EFFECTS` record, or
- a `FOOD_EFFECTS` key doesn't resolve cleanly through the word-boundary resolver against `AGE_RULES`.

**Land this BEFORE the 2nd food** — the cost of the convention is one food now, five later.

### P0.2 — Route the two remaining surfaces through `_lookupByFoodName`
Two surfaces still use the pre-`honeydew` loose `.includes()` substring match. They are **not** a live botulism-on-melon risk (different surfaces from the consequence card), but the project should have *one* food-name matching semantics, not two. Route both through the shared `core.js:3992 _lookupByFoodName` resolver. Small, mechanical, closes the `honeydew`-class door everywhere:
- **Combo-checker (`diet.js`):** `split/diet.js:1179` (`AGE_RULES …find(([k]) => food.includes(k))`), `split/diet.js:1189` (`ALLERGENS …`); sibling `_fdAllergenNote` at `split/diet.js:480` (mirrors the combo-check).
- **Partner badge (`intelligence-cards.js`):** `split/intelligence-cards.js:2496-2514` via `_mealFoodMatches` (defined `:2378` — loose `includes` both directions; line `:2509`); related diet.js synergy match at `split/diet.js:1650`.

> P0.2 touches `diet.js` (Maren) + `intelligence-cards.js` (Vela) → Maren + Vela Governor audit. P0.1 is build-tooling/docs-adjacent — state the Governor waiver explicitly if it touches no `split/*.js` runtime path beyond the audit script.

---

## Priority 1 — the 2nd food, through the pipeline

Pick the next age-gated critical food — candidates, roughly by parental-stakes:
- **whole nuts / peanut** (choking + the early-introduction-vs-allergy nuance — high research value)
- **cow's milk** (as a *drink* before 12m — iron-displacement / renal-load)
- **egg** (allergen introduction timing)
- **salt / added sugar** (renal load; no hard gate but a real consequence)

Run the pipeline end to end:
1. **Research** via the deep-research harness → `docs/research/<food>.md` + `<food>.visual.html` (template: `docs/research/_TEMPLATE.food-dashboard.html`).
2. **Register** in `docs/research/food-effects.manifest.js`.
3. **Project** into `FOOD_EFFECTS` (`split/data.js`) — why / watch-for / seek-care.
4. It **surfaces automatically** at mark-tried via the existing resolver + card. No new plumbing.
5. Add an e2e guard (mirror the honey consequence spec) + run the canon-cc-008 chain (Maren-primary; the P0.1 lint should now be green for it).

**This is the proof.** If the 2nd food costs materially less than honey did, the pipeline is real. If it doesn't, the rough edge it hits is the next thing to fix.

---

## Priority 2 — the research hub (when the manifest has ~5 foods)

Once `food-effects.manifest.js` carries ~5 foods, the flat Pages landing (`docs/research/index.html`) wants to become a real hub: **Index** (all foods), **Compare** (side-by-side gates/effects), **Reactions** (cross-food symptom→cause lookup). Defer until there's enough to justify the surface — building it for one food is premature.

---

## Carry-forward register (inherited — still in scope)

These rolled in from prior handoffs and were **not** addressed this session; they remain open.

### Human-only gate (Architect)
- **#6 item 3 — AT smoke-pass.** Run TC-1…TC-6 from `docs/AT_SMOKE_PASS.md` on the device matrix (VoiceOver / TalkBack / NVDA) against the live deploy; record AT/OS versions, tick item 3, close. Structure is AT-defensible; this *certifies* it. (From 2026-05-29 PM.)

### F-arc successors (food-sub-tab-v1)
- **F-4 (Patterns)** and **F-5** (`parseFeeding` normalizer — closes the F-2 qty-write-only caveat; persist `nutritionRef` at write-time; add a `schemaVersion` version-gate branch; name the `0.75` intake constant). (From #168 / 2026-05-29.)

### Test + data debt (from 2026-05-29 AM)
- e2e for milestones-tab-v1 (~28 regression guards); `CURATED_COMBOS maxAgeMonths`; `_qlPredictFood` SKIPPED_MEAL filter; `NUTRITION_QTY_DEFAULTS` coverage audit; comma-containing dish-name parse.

### Housekeeping
- **Delete merged remote branches** via the GitHub UI (the env blocks delete-push with HTTP 403; the GitHub MCP toolset here has no delete-branch capability). The `claude/food-sub-tab-v1-f3-RWEPG` branch and ~30 stale `claude/*` branches can be swept.

### Candidate Codex canon entries (surfaced, not yet ratified)
- The **research→spine→surface pipeline** itself (this session) — a candidate global pattern: *a parent-facing safety claim must trace to a cited source via a manifest; substring food-name matching is a safety defect.*
- Prior: mockup-driven UX ratification; sidecar architecture; one-shot intent flag; `/code-review xhigh` direct-verification shortcut.

---

— *Lyra. The next move isn't another food — it's the lint that makes the next food safe to add carelessly. Build the guardrail while the road is one mile long.*
