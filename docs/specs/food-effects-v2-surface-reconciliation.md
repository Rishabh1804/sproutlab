# Food-Effects v2 — Legacy Surface Reconciliation

**Companion:** Lyra (The Weaver)
**Status:** Governor spec-review folded — **Maren `amended` (M-S-1…9) + Kael `amended` (K-S-1…5), all blocking amendments integrated** (2026-05-31). Ready to build, phased R0→R3 (§7). Q-3 (Vela, allergen-note depth) deferred to R3.
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

> **Governor spec-review folded (2026-05-31): Maren `amended` (M-S-1…9) + Kael `amended` (K-S-1…5).** The blocking amendments are integrated below; the convergence is recorded in §9.

### 3.0 The branching contract + one shared floor renderer (folded: M-S-5, M-S-7, K-S-4)
Two contracts bind every surface, so the floor can't fall out of a branch:
- **`foodClass` is an INCLUSION test, never `===`** (M-S-5/K-S-4). It is multi-valued (`['allergen-introduce-early','choking-by-form']`); use the `Array.isArray(fc) ? fc.indexOf(x)!==-1 : fc===x` pattern already in `_fdAgeRule` (`diet.js:501-502`). `eff.foodClass === 'acute-toxin'` silently fails the array case and drops peanut to the legacy `caution`/`else` branch, losing **both** the reframe and the floor.
- **The emergency-floor render lives OUTSIDE the polarity if/else** (M-S-5), keyed only on field *presence* (A-4). The polarity branch governs headline + chrome + which benefit/safe-form sections show; it **never** governs whether the floor renders. A food matching no named branch still renders its floor if `severeSigns`/`watchFor`/`seekCare` are present.
- **One shared floor renderer (M-S-7).** `foodConsequenceCard` (`core.js:4042-4053`) already renders the severe strip + seek-care; the γ card reuses `.cons-severe`. Factor the floor into **one** shared helper (e.g. `_severeFloorHtml(eff)` → the `.cons-severe` signs + the seek-care/`call 112` action) reused by the log-time card, the combo result, and the allergen flag — **not** a third/fourth bespoke inline floor string to drift.

### 3.1 Surface 1 — the combo checker (`diet.js`) — *do first (after R0)*
- After the existing age/allergen pass, call `eff = getFoodEffect(food)` for each queried food and branch per §3.0.
- **`acute-toxin`** (honey) → verdict `avoid` (as today, hard ceiling, never softened); headline from `eff.title`/`why`; the botulism floor (`eff.watchFor` + `eff.seekCare`) renders via the shared renderer.
- **`allergen-introduce-early` + age-appropriate** → verdict **`safe`** (Maren Q-1 — *no new `encourage` token*; reuse the existing `safe`/`caution`/`avoid` vocabulary), but this reframe is **atomic with the floor** (M-S-1): the `caution`→`safe` downgrade and the floor render land in the **same** change; the verdict may never be softened ahead of the floor. The **legacy allergen→`caution` flip must be SUPPRESSED** for these foods (the flag becomes safe-form guidance, not a wariness verdict — §2 reframe, K-S-5). Headline sourced from `eff.title` (which already encodes the form qualifier, e.g. *"Peanut — good to introduce early, in safe form"*) — **never** synthesize a bare "X is safe" adjacent to the food name (M-S-2/A-2). Surface `eff.safeForm.note` (the never-whole gate) + a compact `whyGood`.
- **Below the soft floor** → keep the age `avoid`/warning AND still render the floor (M-S-4 — a parent recording an already-happened exposure needs the red-flags, not just "not before 4 months").
- **Emergency-floor placement (M-S-3 — the central blocker):** `renderComboResult` (`diet.js:1545`) has **NO severe/seekCare path today** (it renders only the terse `allergen_notes`). A **new render branch** is required, placed **immediately after the verdict line (`combo-verdict`), above all nutrition/recipe/pairing/history sections** — co-located with what the parent reads first. *Compact governs visual weight, never position or reachability.* Non-collapsible; wraps (HR-10); renders on presence (A-4). The floor must **not** be folded into the `allergen_notes` join (that section sorts below Nutrition). Signs and the seek-care action travel together.
- **HR-4 (M-S-9):** close the pre-existing unescaped `${food}` at `diet.js:~1195/1202/1210` (parent-spec §13 — "not deferred again") in this PR, since it touches exactly this code.

### 3.2 Surface 2 — the Q&A food-safety answer (`intelligence-qa.js`) — *second*
- **Live path RESOLVED (Kael K-S-1 / Q-2): reconcile `qaHandleFoodSafety` (`intelligence-qa.js:1011`) ONLY.** It is the live "can I give X?" path (classifier `food_safety` mode at `:233`→`:1623`). `qaAnswerFoodSafety` (`qa-handlers.js:2236`) is a recorded-reaction-history summary that parses no food name and is reached only by the terminal intent fallthrough that "can I give X" never hits — **out of scope.** (The dead-handler smell → ledger note, future round, K-S-1b.)
- **Resolver fix (#182 parity, K-S-2):** route the age + allergen lookups through `_lookupByFoodName(AGE_RULES,…)` / `_lookupByFoodName(ALLERGENS,…)` instead of bare `AGE_RULES[base]||AGE_RULES[food]` (`:1030`) / `ALLERGENS[...]` (`:1040`). The real defect is **misses** — `badam`/`groundnut`/`akhrot`/`kaju` have no key and silently return no warning (the #182 silent-fail under-warn); the alias arm fixes it. (*Not* a honeydew false-match — that's the hazard the resolver's word-boundary tier *prevents* on adoption.) **Feed the resolver the post-split RAW token, not `_baseFoodName(token)`** — the resolver runs its own normalization; pre-normalizing creates a Surface-2-only vocabulary that diverges from R1/R3 (Invariant 3).
- Then call `getFoodEffect(food)`; branch per §3.0 onto the UIB `{title, headline, sections}` shape. **Section push-order (K-S-4):** push the severe-signs + seek-care section **before** the NUTRITION/PAIRINGS/HISTORY sections (which push at `:1132-1156`) so the floor is never ordered below benefit content (Invariant 1; visual non-collapsibility co-confirm with Vela).
- **Verdict state-machine (K-S-5 — load-bearing):** the reframe is a verdict-state change, not just an added section. Pin precedence: `acute-toxin`→`avoid` (hard); else `allergen-introduce-early` + age-appropriate → `safe`/encourage with the **legacy allergen→`caution` flip (`:1043`) SUPPRESSED**; else legacy. Specify the below-soft-floor render (warning + floor, encourage framing retained), distinct from honey's hard avoid. **Multi-food** (e.g. "peanut with honey"): `avoid` dominates the top-level verdict, but **each food's floor renders in its own section** (honey's avoid must not suppress peanut's severe-signs — Invariant 1 is per-food).

### 3.3 Surface 3 — the allergen note (`_fdAllergenNote`, `diet.js`) — *third*
- Already resolver-correct. **The defect (M-S-6):** the passive food-detail flag (`fd-flag-allergen`, `diet.js:625`) renders the terse `ALLERGENS` string, which names **only mild signs** (rash/swelling/vomiting) and **omits anaphylaxis** — an under-warn on a browse surface. Where a `FOOD_EFFECTS` record carries `severeSigns`, the flag must surface the severe floor via the **shared `_severeFloorHtml` renderer** (§3.0 / M-S-7), preferring the record's framing over the terse legacy string; fall back to the legacy string only when no record exists.
- This detail surface already carries the full floor on its *action* path (`foodConsequenceCard` via mark-tried-below-gate, `diet.js:710`) — so reusing the shared renderer here gives **one** floor across the action path, the passive flag, and the combo result (M-S-7, closes Q-5 by construction).
- Render depth / inline-vs-link-to-γ-card is **Vela's** call (§9 Q-3, at R3 time); the Care floor (severe signs present, never mild-only) is non-negotiable (M-S-6).

## 4. Invariants (carry from the model — non-negotiable)
1. **The emergency floor is reachable on every surface** that can surface a severe-signs (or botulism) food — `severeSigns`/`watchFor` + `seekCare` render, non-collapsibly co-located with the verdict/answer. A quick-check context is not an excuse to drop the floor.
2. **Honey's hard ceiling is never softened.** `acute-toxin` stays a hard "avoid below 12 months"; the encourage reframing applies ONLY to `allergen-introduce-early`. A surface must branch on `foodClass`, never blanket-reframe.
3. **One food-name semantics.** Everything routes through `_lookupByFoodName` (alias- + word-boundary-aware). Fixing Surface 2's bare-key lookups is part of this spec.
4. **No hardcoded safety claim.** Every surfaced claim traces to a `FOOD_EFFECTS`/manifest field.
5. **A-4 render-decouple.** `watchFor`/`seekCare`/`severeSigns` render on *presence*, chrome from `severity` — a schema change can't silently drop a floor.
6. HRs: HR-4 escHtml every field; HR-1 zi() icons; HR-10 the severe line wraps.

## 5. Honey / acute-toxin — explicit behavior
Across all three surfaces, "can I give honey?" / a honey combo / a honey flag must: state the **hard 12-month avoid**, name **infant botulism** (`effect`/`why`), and surface the **botulism watch-fors + seek-care** (`watchFor`: constipation / weak cry / floppiness; `seekCare`). Honey carries empty `severeSigns[]` and no `safeForm`/benefit — so the encourage/benefit/safe-form branches are suppressed (the A-4 present-only render handles this naturally). Rose chrome where the surface has polarity color; never sage, never "introduce-early."

## 6. Negation-leak guard — a BLOCKING prerequisite (R0) — folded: M-S-8 + K-S-3
The combo checker and Q&A take free text, so the `\b(no|free|without|-free)\b` negation leak bites *here* on read surfaces. `_lookupByFoodName`'s word-boundary tier (`core.js:4009`) uses `\bX\b`; `-` is a non-word char, so `\bpeanut\b` **matches inside "peanut-free."** **This is live in committed data:** the seed log `'Ragi porridge + apple (no nuts)'` (`core.js:361`) splits on `+` and `(no nuts)` word-boundary-matches a `nut` alias — a logged *avoidance* reads as a nut exposure.

**Both Governors made this blocking and converged on the same call:**
- **Maren M-S-8 (Care-blocking):** post-reframe, a "peanut-free" query would render a green `safe` *"good to introduce peanut"* + an anaphylaxis floor for a food the parent **excluded** — strictly *worse* than today's spurious `caution`. R1 may not merge encouraging-an-allergen-on-a-negated-query.
- **Kael K-S-3 (engine sequencing):** land the guard in `_lookupByFoodName` (one core.js function both R1/R2 adopt and P1b edits) **once, before R1** — editing the resolver twice is the conflict; a per-surface guard is the parallel-vocabulary the model forbids.

**Resolution → this becomes R0:** the `\b(no|free|without|-free)\b` negation guard lands in `_lookupByFoodName` as a **standalone PR before R1** (it is P1b's first step, pulled forward — one resolver edit serves both). Regression anchor: the `(no nuts)` seed log must resolve to nothing.

## 7. Phasing + canon-cc-008 routing
- **R0 — negation-leak guard** in `_lookupByFoodName` (`core.js`) → **Kael**-primary. Standalone, **lands before R1** (§6). e2e: "peanut-free" / "nut-free" / the `(no nuts)` seed log → resolve to nothing; positive matches ("peanut", "groundnut") unaffected. (This is P1b's first PR, pulled forward — not duplicated in P1b.)
- **R1 — combo checker** (`diet.js`) → **Maren**-primary. Folds the §3.0 branching contract, the new severe-floor branch (M-S-3), the `safe`+atomic-floor reframe (M-S-1), the below-floor floor (M-S-4), the shared renderer (M-S-7), and the HR-4 `${food}` fix (M-S-9). e2e: honey → `avoid` + botulism floor; age-appropriate peanut → `safe`/encourage + safe-form + severe floor co-located above the fold; below-floor peanut → age `avoid` + floor; "peanut-free" → no match (R0 landed).
- **R2 — Q&A** (`intelligence-qa.js`, **`qaHandleFoodSafety` only**) → **Kael**-primary (engine). The resolver fix (K-S-2), the verdict state-machine change (K-S-5), the section push-order (K-S-4). e2e: "can I give honey?" → avoid + floor; "can I give peanut?" → encourage + floor; "honeydew" → not honey; **multi-food "peanut with honey"** → avoid dominates, both floors render.
- **R3 — allergen note** (`diet.js`) → **Maren**-primary; **Vela** on detail-render depth (§9 Q-3). Reuses the shared floor renderer.
- Cipher Edict V terminal on each. No shared-module (styles.css/template.html) touch expected — JS only, no triple-Gov pull (the shared renderer reuses existing `.cons-severe`).

## 8. e2e (per surface — both poles)
Each round guards that **both** an `acute-toxin` (honey) and an `allergen-introduce-early` (peanut/tree-nut) query render the correct polarity + the reachable, co-located floor, sourced from `FOOD_EFFECTS`. Specific anchors: R0 the `(no nuts)`/"peanut-free" negation; R1 the floor-above-the-fold placement + the below-floor case; R2 "honeydew"≠honey, the badam/groundnut alias hit, and the **multi-food honey+peanut** per-food floor.

## 9. Open questions — RESOLVED in spec-review (Maren + Kael, 2026-05-31)
- **Q-1 (Maren) — RESOLVED:** verdict **`safe`** for an age-appropriate `allergen-introduce-early` food (no new `encourage` token — fewer branches, fewer places the floor drops), **atomic with the floor** (M-S-1); the legacy allergen→`caution` flip is suppressed; honey stays **`avoid`**. Headline from `eff.title` (carries the form qualifier; never bare "safe", M-S-2).
- **Q-2 (Kael) — RESOLVED:** reconcile **`qaHandleFoodSafety` only**; `qaAnswerFoodSafety` is out of scope (K-S-1).
- **Q-3 (Vela) — OPEN, deferred to R3:** `_fdAllergenNote` render depth (inline-augment vs link to the γ card). Maren set the Care floor (severe signs present, never mild-only, M-S-6); Vela decides depth at R3 implementation.
- **Q-4 (Kael) — RESOLVED:** negation guard lands **once, in the resolver, as R0 before R1** (K-S-3); not edited twice.
- **Q-5 (Maren/Kael) — RESOLVED:** one shared floor renderer across the log-time card, the combo result, and the allergen flag (M-S-7) — no bespoke duplication. The floor *does* belong on these surfaces; it's surfaced through the shared render, not re-authored.

## 10. Convergence (the spine the two reviews drew)
Both Governors, independently: **the verdict/answer and the emergency floor may never phase apart, and the negation guard must precede the reframe.** A green `safe` "good to introduce" with the floor missing, buried, mild-only, or fired on a negated ("peanut-free") query is the one outcome *worse* than the legacy `caution` it replaces. R0-before-R1 and floor-outside-the-polarity-branch are the structural guarantees against it.

## 11. Out of scope
- The γ card + the log-time card (already on the model).
- P1b's exposure engine/nudge (separate; R0 the negation guard is pulled forward from it).
- New foods (P1c) — they inherit these surfaces automatically once reconciled.
