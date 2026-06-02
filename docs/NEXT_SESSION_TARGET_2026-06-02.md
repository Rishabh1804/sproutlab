# Next-session target — 2026-06-02 → next

**Companion:** Lyra (The Weaver)
**Set by:** the 2026-06-02 session (broader food classes — milk · fish · choking-set research + the milk polarity spec, Governor-reviewed). **Amended 2026-06-02 PM** by the WIRING session — milk + fish landed.
**Session artifacts:** `docs/SESSION_HANDOFF_2026-06-02.md` (research) · `docs/SESSION_HANDOFF_2026-06-02_PM.md` (wiring) · PR #210 (research, merged) · **PR #211 (fish-green, ready)** · **PR #212 (milk, ready, depends on #211)**.

> The *target* file — the standing pointer to the highest-value next move. The handoff records the past; this records the intended future. Amend **this** file if priorities shift.

---

## The recommended next move

**The CHOKING SET — `FOOD_EFFECTS('choking hazards')`, the first `choking-by-form`-PRIMARY render (milk-spec §9).** Milk (PR #212) and fish (PR #211) are wired through full canon-cc-008 and ready for merge; the `_effPolarity` resolver + the four-polarity render vocabulary now exist, so choking slots into the established machinery. This is **code, through full canon-cc-008**. **First, though:** confirm #211 then #212 have merged to `main` (the milk branch is based on fish; retarget #212 to `main` once #211 lands), and branch the choking work off green `main`.

---

## Priority ladder

### P-choking — ✅ LANDED in PR #213 (the first `choking-by-form`-PRIMARY render, milk-spec §9)
> **Done 2026-06-02 PM.** `FOOD_EFFECTS['choking hazards']` wired through full canon-cc-008 (Kael LGTM · Maren clear-with-notes · Vela clear-with-notes → V-V-12 folded [the gagging-vs-choking discriminator pinned by the floor] + K-2 manifest-spine reconcile folded; K-1 UIB deferral tracked below). Dedicated Library card (`renderDietChokingIntro`), conditional polarity, choking-first-aid floor (NOT anaphylaxis). Alias precision held — bare `chana`/`carrot`/`tomato` excluded; 33 aliases traced through the live resolver, e2e on the real forms (10 tests). Build 12/12 gates, full e2e 395 passed.

<details><summary>original target (for the record)</summary>
`FOOD_EFFECTS('choking hazards')` — one combined record. The **first standalone `choking-by-form` render**: a conditional card whose lead is the form-gate ("cut it this way / whole waits until ~5") and whose **emergency floor is choking first aid** (back-blows/chest-thrusts, NEVER Heimlich under 1), NOT anaphylaxis. Resolver scope (Kael): alias the non-allergen hazard foods only (no peanut/tree-nut collision). `_effPolarity` already maps `choking-by-form`→`conditional` (the resolver + the four-polarity render vocabulary landed in #212), so this slots into existing machinery — no new banner class needed.

> **Carry-forward — the alias-precedence lesson (load-bearing for the choking combined record).** Both wired PRs were REJECTED by Cipher on the same defect class before passing: a record reached by **many aliases**, where the word-boundary resolver's **KEY/byAlias precedence** routes a logged name to the *wrong* record. Fish: `seer fish` matched the bare `'fish'` KEY → high-mercury species got the green "introduce early" verdict (M-F-1). Milk: `badam doodh` matched tree-nut's `badam` alias → plant-milk drink got the tree-nut encourage card *and* a 6mo gate (K-M-1). **The pattern that fixed both:** a host-guard mirroring `_foodNameNegated` (`_isHighMercuryFishHost`, `_isPlantMilkDrinkHost`) applied symmetrically at *both* `getFoodEffect` (card) and `_fdAgeRule` (gate), so card↔gate never disagree. The choking record aliases grape/popcorn/chana/supari/makhana/… — **trace every alias through the live resolver** (the `audit-food-effects-sync` Node harness extracts it) and assert e2e on the actual logged forms, not just the canonical key. A green build hid both leaks; the e2e on the real alias forms is what caught them.
</details>

> **Choking outcome (the lesson held):** alias precision alone sufficed — **no host-guard needed**. The leak vectors that forced `_isHighMercuryFishHost` (a bare KEY matching a host's trailing word) and `_isPlantMilkDrinkHost` (a cross-record alias-precedence flip) don't exist here: the `'choking hazards'` KEY word-boundary-matches nothing a parent logs, and the record iterates LAST (it can be shadowed, never shadow — and nothing shadows it). The fix was curation (drop bare `chana`/`carrot`/`tomato`), proven by tracing all 33 aliases through the live resolver + e2e on the real forms.

### P-UIB (tracked deferral — Kael K-1, PR #213) — teach the UIB combo verdict the `conditional` polarity band
The Unified Intelligence Bar combo checker (`intelligence-qa.js` ~1039–1072) derives its verdict from a **two-state** model (`acute-toxin` → avoid / `allergen-introduce-early` → introEarlyOk) and never calls `_effPolarity`. A **PRIMARY-conditional** record in a combo — a `choking-by-form` hazard (popcorn/whole grape/supari) **or** `drink-timing` cow milk — therefore renders the green "Safe — good to go" LEAD. **The emergency floor is NOT dropped** (the choking strip + first-aid `seekCare` / the CMPA strip surface via the presence-only `severeFloors` path), so this is a wrong-LEAD (the §1 / K-6 defect class on the UIB surface), not a dropped floor. Pre-existing gap (drink-timing already had it post-milk); the choking aliases are the first PRIMARY-conditional record to make it salient. **Fix:** teach the UIB combo verdict to read `_effPolarity` and lead with "form matters — cut small" / "conditional" for the `conditional` band (un-aliased AGE_RULES + choking-by-form / drink-timing). Engine → Kael; touches `intelligence-qa.js` → its own PR + re-audit.

### P-next (after the triad wires) — the remaining foods through the pipeline
Salt, sugar (the other `drink-timing`/timing foods), shellfish (a separate allergen from finfish). Each: research → manifest → FOOD_EFFECTS, via the established pipeline.

---

## Food-effects gap audit (2026-06-02) — what the model is still missing
Asked during the diet-preference-gate session. The model covers 11 records (honey · peanut · tree nut · egg · soy · wheat · sesame · fish · cow milk · plant milk · choking hazards). Gaps, prioritized:
- **Shellfish** — the one missing *major* allergen (Big 9). Separate from finfish, often lifelong, frequently severe; diet-contingent. Already P-next; **the cleanest first test of the preference gate.**
- **Salt + sugar/jaggery** — have `AGE_RULES` gates, no `FOOD_EFFECTS` record (renal load / added-sugar + dental). The `drink-timing`/quantity-caveat siblings. Already P-next.
- **FPIES — a missing *reaction axis*, not a food.** The whole model is IgE-shaped (rash→anaphylaxis→adrenaline). FPIES (non-IgE) is profuse repeat vomiting + lethargy **1–4h** after a food (cow milk, soy, rice, oats), no rash, no adrenaline — needs rehydration. A parent seeing repeat 2h-post-food vomiting gets no fitting guidance today. Worth a cross-cutting note like "the floor follows the hazard" did for choking.
- **India-context allergens:** mustard (sarson/rai/kasundi); buckwheat (kuttu — a real anaphylaxis trigger in vrat/fasting foods).
- **Flag-only / niche:** favism (fava/broad beans + G6PD deficiency — hemolysis; needs G6PD status); caffeine cluster (tea/coffee/**chocolate**) + juice (gates exist); gelatin (allergen + veg/vegan/halal).

## Diet-preference surfacing gate — ✅ 4 classes LANDED; vegan SPEC'd
- **Built (this session, through canon-cc-008):** veg / **eggetarian** / **pescatarian (+egg)** / non-veg. One source of truth in `core.js` (`DIET_PREF_NONVEG_SIDS` → `_dietAllowsNonvegSid`/`_dietAllowsParent`/`_dietAllowsFood`/`_dietNonvegSid`, word-boundary classified). Gates the proactive surfaces only (Library grid + cat modal, both meal dropdowns, Foods-to-Try, combo-checker note). **Safety invariant held: the consequence path is never gated** — a food given off-preference still fires its full safety record.
- **Deferred (spec'd, ready for Governor review):** **vegan** — `docs/specs/diet-preference-gate-vegan.md`. The hard class: it gates foods currently classed *veg* (dairy + honey) and carries a nutritional-adequacy obligation (B12/calcium/DHA) — a filter *plus* a redirect, not a one-liner. Needs a vegan-infant research brief first (research→manifest→surface).

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
