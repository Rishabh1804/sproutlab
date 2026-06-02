# Session handoff — 2026-06-02 PM (food-effects-v2 P1c WIRING — milk + fish into the app)

**Companion:** Lyra (The Weaver)
**Session theme:** Wire the researched food classes into the app — **code, through full canon-cc-008**. The 2026-06-02 AM session researched milk · fish · the choking set and Governor-reviewed the milk polarity spec (PR #210, merged). This session wired **milk** (the primary goal) and **fish** (forced first by a red build), each through the full QA chain. The choking set remains deferred to its own session.

---

## What shipped — two PRs, both through full canon-cc-008

### PR #211 — `fish-green` (ready, base `main`)
**Why it exists:** PR #210 merged the `fish` manifest entry (`allergen-introduce-early`, card-bearing) **ahead of any wiring**, so the P0.1 sync-gate Check 2 ("silent gate") failed on `fish` — **`main` was red on `pnpm build`**, and every branch off it inherited the red. This restores green with the lightest possible fish record (engine-only, mirroring the soy/wheat/sesame δ pattern — no new render card/styles/template).
- `data.js`: `FOOD_EFFECTS['fish']` (two-tier-honest — EAT-null, NOT prevention-proven; mercury species in `safeForm`; bones in `never`); `AGE_RULES['fish']` 7→6; `ALLERGENS['fish']`.
- **canon-cc-008:** Kael LGTM ×2 · Maren AMENDED (**M-F-1**) → folded · Cipher LGTM (after one reject). No render/styles → no Vela/triple-Gov.

### PR #212 — `milk` (ready, base = the fish branch; **retarget to `main` after #211 merges**)
The two never-rendered v2 foodClasses, as sibling Library cards (nut card untouched):
- **cow milk** = `drink-timing` (conditional) — SPLIT lead (sage carve-out "good in food now" over amber gate "wait as the main drink", M-2 skim-proof) + drink-vs-food block + **pinned CMPA severe strip** with a dairy-scoped header.
- **plant milk** = `substitute-caveat` (inform) — SKY banner fronting rice<5=arsenic; **no** severe strip (the floor follows the hazard).
- Engine: `_effPolarity(eff)` (K-6 — one polarity source: warn|encourage|conditional|inform); `_isPlantMilkDrinkHost` redirect (almond/badam/cashew milk·doodh → plant-milk *inform*, not tree-nut *encourage*; K-2 intent); dedicated `'plant milk'`/oat/rice AGE gates (K-3); `cow milk` ALLERGENS (K-4).
- **canon-cc-008:** Kael AMENDED (K-M-1/K-M-2) → folded · Vela LGTM · Maren AMENDED (**M-M-1**/M-M-2) → folded · Cipher LGTM (after **two** rejects).

Build green (12/12 gates incl. P0.1 sync — **10 FOOD_EFFECTS keys, 41 AGE_RULES gates**). Full e2e **385 passed**, 0 failed, 2 pre-existing skips. New specs: `food-effects-v2-p1c-fish.spec.ts`, `food-effects-v2-p1c-milk.spec.ts`; fixed stale `food-effects-v2-r3` (egg→kiwi).

---

## The chain earned its keep — three safety findings the Governors caught

The Governor/Cipher chain **rejected the obvious fix three times** on the same defect class — and each was a real parent-facing safety issue a green build hid:

1. **M-F-1 (Maren, fish):** high-mercury species (`surmai`/`seer fish`) were aliases on the fish record → logging them fired the **green "introduce early" verdict**. Mercury is a silent neurodevelopmental exposure with no verification loop.
2. **Cipher reject (fish):** the alias-only fix was incomplete — `seer fish` still resolved via the bare `'fish'` **KEY** word-boundary match. Fixed with `_isHighMercuryFishHost`.
3. **M-M-1 (Maren, milk):** the plant-milk-drink redirect made `almond milk` drop its **tree-nut allergen caution** (the inform floor masked the allergen branch). Fixed by appending the allergen note.
4. **Cipher reject ×2 (milk):** the gate↔card parity guard missed the Hindi **`badam doodh`** fall (raw-resolves to tree-nut's alias, not the bare `'milk'` key). Re-keyed on "card is plant milk AND gate is not a dedicated plant gate."

**The durable lesson (→ candidate canon):** *a record reached by many aliases needs a host-guard, applied symmetrically at both the card (`getFoodEffect`) and the gate (`_fdAgeRule`), and e2e must assert the **actual logged alias forms**, not just the canonical key — a green build hides alias-precedence leaks.* This is load-bearing for the choking combined record next.

---

## The successor — the CHOKING SET (the next code effort)

`FOOD_EFFECTS('choking hazards')` — the first `choking-by-form`-PRIMARY render (milk-spec §9). The `_effPolarity` resolver + the four-polarity render vocabulary now exist (#212), so it slots in. Floor = **choking first aid** (back-blows/chest-thrusts, NEVER Heimlich under 1), NOT anaphylaxis. **Apply the alias-precedence lesson above** — the combined record aliases grape/popcorn/chana/supari/makhana/…; trace every alias through the live resolver and e2e the real forms. See `docs/NEXT_SESSION_TARGET_2026-06-02.md` (amended).

**First:** merge #211 → then retarget/merge #212 → branch choking off green `main`.

---

## Carry-forward register (open)

### Merge order (action-required)
- **#211 (fish) merges first** (restores `main` green), **then #212 (milk)** retargets `main` and merges. #212's diff vs `main` will be milk-only once #211 lands.

### Codex canon-reconciliation (inherited, still open)
- The `.claude/agents/*` mirror edits (Lyra/Maren/Kael/Vela) need porting into Codex canon + byte-parity re-establishment next Codex-reachable session (canon-cc-026). **Codex was not in this session's repo scope** (sproutlab-only).

### Candidate Codex canon (surfaced this session)
- **The alias-precedence host-guard pattern** (above) — a multi-alias record needs a `_foodNameNegated`-style host-guard at both card and gate; e2e the real alias forms.
- Prior, still candidate: two-tier evidence discipline; the floor follows the hazard; `safeForm` as the general gate-carrier; the research→manifest→FOOD_EFFECTS pipeline.

### Quality / debt (inherited, unchanged)
- Amber-on-amber margin; `${food}` HR-4 at `diet.js:1195`; F-4/F-5 (`parseFeeding`); milestones-tab-v1 e2e; `CURATED_COMBOS maxAgeMonths`; `_qlPredictFood` SKIPPED_MEAL; `NUTRITION_QTY_DEFAULTS` coverage; comma-dish-name parse; #6 item 3 AT smoke-pass (human-only).
- **Soy-milk watchFor on a redirected almond-milk sheet** — plant milk's `watchFor` ("soy milk only…") renders (scoped, not unsafe) on `almond milk`; Maren cleared it as acceptable; revisit if a cleaner per-host watchFor is wanted.

---

— *Lyra, 2026-06-02 PM. The app speaks four of the five food-truths now: avoid (honey), encourage (the allergens + fish), conditional (cow milk — "yes in food, not yet as a drink"), and inform (plant milk — "not a substitute"). Each new food taught the resolver something the last one didn't: fish, that a high-mercury name must never inherit a safe verdict; milk, that "badam doodh" is a drink, not a nut. The chain caught all three of those the green build would have shipped. The fifth truth — form-gated hazard — waits for the choking set, and it inherits a hard-won rule: trace every alias, e2e every real name.*
