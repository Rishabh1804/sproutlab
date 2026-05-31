# Food-Effects v2 — Legacy Surface Reconciliation

**Companion:** Lyra (The Weaver)
**Status:** DRAFT — for Governor spec-review (Maren + Kael) before code.
**Date opened:** 2026-05-31 (PM).
**Tracking:** issue #189. **Descends from:** `docs/specs/food-effects-v2-guided-introduction.md` (the model) · #187/#188 (the γ card) · #184 (P1a) · #182 (the one-resolver unification).
**Scope decision (Architect, 2026-05-31):** cover **both** polarities — `allergen-introduce-early` (encourage) **and** `acute-toxin` (honey, avoid/warn). Honey is explicitly in scope.

---

## 1. The problem

`FOOD_EFFECTS` (`data.js`) is the canonical safety spine, but only the γ Info-tab card (#187/#188) and the log-time `foodConsequenceCard` (#184) read it. Three **legacy food-safety surfaces** still answer from the older `AGE_RULES`/`ALLERGENS`/`NUTRITION` tables and render pre-v2 framing — so a parent asking "can I give peanut?" or "can I give honey?" gets the old language, missing the benefit framing, the safe-form gate, and (critically) the **severe-reaction emergency floor**. Reported by the Architect after γ: *"the can-I-give card under patterns still shows old info."*

| # | Surface | Entry | Reads today | Routes through resolver? |
|---|---------|-------|-------------|--------------------------|
| 1 | Diet → Patterns **"Can I give this?"** combo checker | `checkFoodCombo` → `renderComboResult` (`diet.js:1163/1545`) | `_fdAgeRule` + `_lookupByFoodName(ALLERGENS)` + NUTRITION + COMBO_RECIPES | age + allergen ✓; **`FOOD_EFFECTS` ✗** |
| 2 | Smart Q&A **food-safety** answer | `qaHandleFoodSafety` (`intelligence-qa.js:1011`) | **bare `AGE_RULES[key]` / `ALLERGENS[key]`** | **✗ no word-boundary resolver; `FOOD_EFFECTS` ✗** |
| 3 | Diet **allergen note** | `_fdAllergenNote` (`diet.js:481`) | `_lookupByFoodName(ALLERGENS)` | ALLERGENS ✓; **`FOOD_EFFECTS` ✗** |

## 2. The model these surfaces must speak (recap)

Each surface must render the correct **polarity + gate-direction per `foodClass`**, sourced from `FOOD_EFFECTS` via `getFoodEffect(name)` — **no hardcoded safety claim** (the canonical-path discipline).

| `foodClass` | Polarity | Verdict lean | Must surface | Floor |
|-------------|----------|--------------|--------------|-------|
| `acute-toxin` (honey) | **Warn / avoid** (rose) | **avoid** below `minMonth` (hard 12-mo ceiling — never softened) | the hazard (`effect`/`why`) + the hard floor | `watchFor` (botulism: constipation / weak cry / floppiness) + `seekCare` — render **on presence** (A-4), never gated on a class string |
| `allergen-introduce-early` (peanut, tree nut; later egg/seeds/milks) | **Encourage** (sage) | **introduce, in safe form** at/after `minMonth` (soft floor) — NOT a scary "caution" | `whyGood`/`earlyIntroBenefit` + the `safeForm` gate (never-whole / grinding-removes-choking-not-allergy) | `severeSigns` (anaphylaxis) + `seekCare`; mild `watchFor` secondary |
| (no record) | legacy | unchanged | the existing age/allergen/nutrition answer | n/a |

**The load-bearing reframe (combo checker + Q&A):** today an age-appropriate peanut resolves to verdict **`caution`** purely because it carries an `ALLERGENS` flag. Under the model an age-appropriate `allergen-introduce-early` food is an **encourage**, not a caution — "yes, in safe form; here's how; here are the red-flags." The allergen flag becomes *the safe-form + watch guidance*, not a wariness verdict. **Honey stays `avoid`.** (Verdict-vocabulary decision → §9 Q-1, for Maren.)

## 3. Per-surface reconciliation

### 3.1 Surface 1 — the combo checker (`diet.js`) — *do first*
- After the existing age/allergen pass, call `eff = getFoodEffect(food)` for each queried food.
- **Branch on `eff.foodClass`:**
  - contains `acute-toxin` → verdict `avoid` (as today); ADD `eff.watchFor` + `eff.seekCare` to the result as the botulism floor (render on presence, A-4). Headline from `eff.title`/`why`.
  - contains `allergen-introduce-early` and age-appropriate → verdict `safe` (the encourage lean, §9 Q-1), headline reframed ("Good to introduce — in safe form"); surface `eff.safeForm.note` (the never-whole gate) + `eff.severeSigns` + `eff.seekCare` (the emergency floor) + a compact `whyGood`. Below the soft floor → keep the age warning AND surface the floor.
  - else → unchanged legacy verdict.
- **Emergency floor:** when a queried food has `severeSigns`/`seekCare`, the combo result must render them reachably (a compact severe line + the seek-care action — reuse `.cons-severe`/a compact variant; HR-10 wraps). Co-locate with the verdict the parent reads.
- All `FOOD_EFFECTS` fields `escHtml`-wrapped (HR-4); the existing render already escapes its slots.

### 3.2 Surface 2 — the Q&A food-safety answer (`intelligence-qa.js`) — *second*
- **First, fix the resolver defect (#182 parity):** route the age + allergen lookups through `_lookupByFoodName(AGE_RULES, …)` / `_lookupByFoodName(ALLERGENS, …)` instead of bare `AGE_RULES[key]`/`ALLERGENS[key]` (today "honeydew" mis-keys, aliases like badam/groundnut miss). **This is a safety fix in its own right** (Kael).
- Then call `getFoodEffect(food)` and branch polarity exactly as §3.1, mapped onto the UIB answer shape (`{title, headline, sections}`):
  - `acute-toxin` → headline avoid; a SAFETY section carrying `watchFor` + `seekCare` (botulism floor).
  - `allergen-introduce-early` → headline encourage ("good to introduce, in safe form"); sections for the benefit, the safe-form gate, and a non-buried **severe-signs + seek-care** block.
- **Clarify the live path (Kael, §9 Q-2):** the map found two handlers — `qaHandleFoodSafety` (query-rule based, the classifier routes here at `:1623`) and `qaAnswerFoodSafety` (`qa-handlers.js:2236`, recorded-reaction-history based). Confirm which renders "can I give honey/peanut?" and reconcile that one (or both).
- **Negation coordination (§6):** the Q&A parser takes free text and splits on `with/and/+`; "peanut-free" would whole-word-match `peanut`. See §6.

### 3.3 Surface 3 — the allergen note (`_fdAllergenNote`, `diet.js`) — *third*
- Already resolver-correct. The reconciliation: where a food has a `FOOD_EFFECTS` record, prefer/augment the terse legacy `ALLERGENS` string with the record's framing — for `allergen-introduce-early`, cross-reference `severeSigns`/`seekCare` so the food-detail flag carries the emergency floor, not just "watch for rash, swelling, vomiting"; for `acute-toxin`, the `why`/`seekCare`. Keep it compact (it's an inline flag). Decision on inline-vs-link depth → §9 Q-3 (Vela, since `_fdAllergenNote` renders in a detail surface).

## 4. Invariants (carry from the model — non-negotiable)
1. **The emergency floor is reachable on every surface** that can surface a severe-signs (or botulism) food — `severeSigns`/`watchFor` + `seekCare` render, non-collapsibly co-located with the verdict/answer. A quick-check context is not an excuse to drop the floor.
2. **Honey's hard ceiling is never softened.** `acute-toxin` stays a hard "avoid below 12 months"; the encourage reframing applies ONLY to `allergen-introduce-early`. A surface must branch on `foodClass`, never blanket-reframe.
3. **One food-name semantics.** Everything routes through `_lookupByFoodName` (alias- + word-boundary-aware). Fixing Surface 2's bare-key lookups is part of this spec.
4. **No hardcoded safety claim.** Every surfaced claim traces to a `FOOD_EFFECTS`/manifest field.
5. **A-4 render-decouple.** `watchFor`/`seekCare`/`severeSigns` render on *presence*, chrome from `severity` — a schema change can't silently drop a floor.
6. HRs: HR-4 escHtml every field; HR-1 zi() icons; HR-10 the severe line wraps.

## 5. Honey / acute-toxin — explicit behavior
Across all three surfaces, "can I give honey?" / a honey combo / a honey flag must: state the **hard 12-month avoid**, name **infant botulism** (`effect`/`why`), and surface the **botulism watch-fors + seek-care** (`watchFor`: constipation / weak cry / floppiness; `seekCare`). Honey carries empty `severeSigns[]` and no `safeForm`/benefit — so the encourage/benefit/safe-form branches are suppressed (the A-4 present-only render handles this naturally). Rose chrome where the surface has polarity color; never sage, never "introduce-early."

## 6. Negation-leak coordination (P1b dependency)
The combo checker and Q&A take free-text input, so the `\b(no|free|without|-free)\b` negation leak ("peanut-free bread" → matches `peanut`) bites *here* on a read surface, not only in P1b's auto-counting. **Recommendation:** land the negation guard (P1b's first PR, in/around `_lookupByFoodName`) **before or with** Surface 2, so the resolver these surfaces newly lean on doesn't false-positive a negated mention. Sequencing to confirm with Kael (§9 Q-4) — don't edit the resolver twice.

## 7. Phasing + canon-cc-008 routing
- **R1 — combo checker** (`diet.js`) → **Maren**-primary. e2e: honey combo → avoid + botulism floor; peanut combo (age-appropriate) → encourage + safe-form + severe floor; "peanut-free" → no false peanut match (if the guard has landed).
- **R2 — Q&A** (`intelligence-qa.js` [+ `qa-handlers.js`]) → **Kael**-primary (engine). Includes the bare-key→resolver fix. e2e: "can I give honey?" → avoid + floor; "can I give peanut?" → encourage + floor; "honeydew" → not honey.
- **R3 — allergen note** (`diet.js`, renders in a detail surface) → **Maren**-primary, **Vela** on the detail-render depth (§9 Q-3).
- Cipher Edict V terminal on each. Shared-module touch (none expected — JS only) would pull triple-Gov.

## 8. e2e (per surface — both poles)
Each round adds guards that **both** an `acute-toxin` (honey) and an `allergen-introduce-early` (peanut/tree-nut) query render the correct polarity + the reachable floor, sourced from `FOOD_EFFECTS`; plus the Surface-2 word-boundary guard ("honeydew"/"peanut-free").

## 9. Open questions for Governors (resolve in spec-review)
- **Q-1 (Maren):** the combo-checker/Q&A **verdict vocabulary** for an age-appropriate `allergen-introduce-early` food — reframe to `safe` ("good to introduce, in safe form") with the floor, or introduce an explicit `encourage` verdict? (Today it's `caution` purely from the allergen flag — that under-encourages.) Honey stays `avoid`.
- **Q-2 (Kael):** which Q&A handler is live for "can I give X?" — `qaHandleFoodSafety` vs `qaAnswerFoodSafety` — and do we reconcile one or both?
- **Q-3 (Vela):** `_fdAllergenNote` render depth in the food-detail surface — inline-augment the flag with the severe floor, or link to the γ card? How much floor belongs in an inline flag.
- **Q-4 (Kael):** negation-guard sequencing vs R2 (land it first / together?) so the resolver isn't touched twice.
- **Q-5 (Maren/Kael):** is `_fdAllergenNote` the right place to add a floor at all, or is the food-detail surface better served by surfacing the γ card's content? (Avoid duplicating the floor into yet another bespoke render.)

## 10. Out of scope
- The γ card + the log-time card (already on the model).
- P1b's exposure engine/nudge (separate; only the negation guard coordinates here).
- New foods (P1c) — they inherit these surfaces automatically once reconciled.
