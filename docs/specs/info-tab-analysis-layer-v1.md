# Info-Tab Analysis Layer — v1 (Allergen Introduction card as exhibit A)

**Companion:** Lyra (The Weaver)
**Status:** DRAFT — authored from the locked reference prototype (PR #203, commit `2ce5584`). Awaiting Governor spec-review folding (Vela render + Maren care-read) and Architect ratification.
**Date opened:** 2026-06-01.
**Descends from:** `docs/specs/food-effects-v2-guided-introduction.md` (the `FOOD_EFFECTS` resolver spine this card reads) · the prototype-then-spec loop the Architect ran across two iteration rounds on PR #203.
**Spec type:** Feature Spec (new user-facing card) + a thin Architecture note (§7), because this card seeds a *layer pattern* future cards inherit.

---

## 1. The problem this spec exists to solve

The Info tab renders ~20 `renderInfo*` cards (dispatched by `renderInfo()` at `intelligence-cards.js:1414`, itself called from `switchTab()`). They answer *"what happened"* (variety, pace, intake, correlations). **None answers a journey question:** *"where am I in the high-allergen-introduction sequence, and what should I offer next?"*

That question matters because the allergen-introduction window is **time-boxed and protective** (LEAP/EAT: early, sustained exposure reduces allergy risk ~81% for peanut). A parent who can't see *where they are* in the sequence can't act on a window that closes. The food-effects-v2 layer made each food's introduce-early guidance correct **at log time**; this card makes the **whole journey legible** at a glance, on the Info tab, between meals.

This is **card #1 of an Info-tab *analysis* layer** — cards that synthesize a derived state across many logged events, as opposed to the existing *report* cards that summarize raw activity. §7 names the pattern so card #2 inherits it.

---

## 2. Data flow (no new storage; all derived)

The card writes **nothing**. It derives its entire state at render time from three existing sources, all resolved through the **same `FOOD_EFFECTS` spine** the food-effects-v2 spec established, so aliases are correct (logging *almond* counts as *Tree nuts*):

| Source | Used for | Resolver |
|---|---|---|
| `foods` (the deduped tried-list) | intro **date** + **reaction flag** + tried/untried | `_aiFoodRecordFor` → `getFoodEffect` / `_baseFoodName` |
| `feedingData` + `extractDayFoods(date)` (the per-meal log) | **exposure count** — days the allergen appeared at a meal | `_aiExposureDays` → `getFoodEffect` / `_baseFoodName` |
| `AGE_RULES` (`_lookupByFoodName`) | the **intro-month** floor per allergen | `_lookupByFoodName(AGE_RULES, key)` |

**Why two food sources, not one.** `foods` is deduped to one entry per food — it carries the *first* intro date and any reaction flag, which drives the watch window. `feedingData` is the per-meal event log — it carries *repetition*, which is the keep-offering signal. They are complementary and must not be conflated: the date/watch comes from `foods`; the "offered N days" comes from `feedingData`. **Honesty constraint:** `extractDayFoods` dedups within a day, so the count is *days offered*, never *number of tastes*. The copy says "offered N **days**" — it must never imply a per-taste count the data can't support.

The allergen set (frozen): **peanut, tree nuts, egg, sesame, soy, wheat** (`AI_ALLERGEN_SET`). Each row resolves independently; no cross-allergen inference.

---

## 3. State machine (derived per allergen, never hardcoded)

Each allergen resolves to exactly one state, in this precedence:

```
has a foods record?
├── reaction === 'watch'        → REACTION   (surfaced, never silently tolerated)
├── has date, < 3 days ago      → WATCHING   (the 3-day watch window)
├── has date, ≥ 3 days ago      → TOLERATED
└── tried but no date           → INTRODUCED
no record?
├── age ≥ intro-month           → READY      (actionable nudge)
└── age < intro-month           → NOT YET
```

| State | Pill | Polarity | Meta line |
|---|---|---|---|
| Ready to try | `cd-pill-pos` (sage) | encourage | safe-form note, or "Good to introduce now, in a safe form" |
| Not yet | `cd-pill-neutral` | calm | "From {introMonth} months" |
| Watching | `cd-pill-neutral` | calm-attentive | "Day {n} of 3 — watch for reactions" |
| Tolerated | `cd-pill-pos` (sage) | affirming | "offered {N} days · keep it in rotation" (drops the count if 0) |
| Introduced | `cd-pill-pos` (sage) | affirming | "Keep offering to hold tolerance" |
| Reaction noted | `cd-pill-neg` (rose) | attention | "Reaction flagged {date} — tap to review" |

**Reaction is never suppressed** (inherits Maren A-3 from food-effects-v2): a `reaction:'watch'` flag always surfaces as its own state, above tolerated, never folded into "introduced."

---

## 4. Wireframe (the locked reference)

```
┌─ Allergen Introduction ───────────────────────────── ⌄ ─┐
│ 3 of 6 introduced · 3 ready to try · 1 watching          │  ← summary (always visible)
│ Progress  ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░  3 / 6                      │  ← sage _cdBarHtml proportional bar
├──────────────────────────────────────────────────────────┤
│ HIGH-PRIORITY ALLERGENS                                   │
│ Sesame      [Ready to try]  Good to introduce now…        │  ← ordered by actionability:
│ Soy         [Ready to try]  Good to introduce now…        │     ready → watching → reaction
│ Wheat       [Ready to try]  Good to introduce now…        │     → introduced/tolerated → not-yet
│ Peanut      [Watching]      Day 2 of 3 — watch for…       │     (stable within tier)
│ Egg         [Reaction noted] Reaction flagged … — tap…    │
│ Tree nuts   [Tolerated]     offered 5 days · keep it in…  │
├──────────────────────────────────────────────────────────┤
│ WHAT THIS MEANS                                           │
│ Early introduction in a safe form is protective. Good to  │  ← insight, derived from the
│ start now: Sesame, Soy, Wheat. One at a time, watch 3 days.│     dominant actionable state
└──────────────────────────────────────────────────────────┘
```

**Three composition rules** (the iteration-2 refinements, now invariants):
1. **Order by actionability.** Rows sort `ready(0) → watching(1) → reaction(2) → introduced/tolerated(3) → not-yet(4)`, stable within a tier (so set order — peanut, tree nut, egg… — is preserved among ties). What to act on floats up; settled states sink.
2. **Glanceable progress.** The summary carries a sage `_cdBarHtml('Progress', introduced, total, ' / '+total)` proportional bar — comprehension before a single row is read. Reuses the existing `cd-bar-*` vocabulary; **no `styles.css`.**
3. **Keep-offering is the affirming close.** Tolerated/introduced rows don't dead-end at "done" — they carry the exposure count and "keep it in rotation," because tolerance is sustained, not one-and-done (EAT per-protocol lesson).

**Tap-through.** Each row is `data-action="foodLibDetail" data-arg="{key}"` → the food's detail sheet (the R3 floor + safe-form for the resolved food). The card is the *glance*; the sheet is the *depth*. This layering is deliberate: the keep-offering `thenWhat` guidance and severe-reaction floor live in the sheet, not crammed into the row.

---

## 5. Card priority (inherits v3-6)

Composite card → **never urgent**. `_setCardPriority('infoAllergenIntroCard', …)`:
- **notable** when `ready > 0 || watching > 0` (there is something to act on);
- **ambient** otherwise (all tolerated / all not-yet — nothing to do, stays calm).

A reaction-only state is *not* urgent here — the acute floor is the food detail sheet's job (Maren A-1/V-1 from food-effects-v2: the "call 112" strip lives at log time and in the sheet, not in an Info-tab journey card). This card points at the reaction ("tap to review"); it does not try to be the emergency surface.

---

## 6. Edge cases (decided, so the builder doesn't)

| Case | Decision |
|---|---|
| No `foods`, no `feedingData` (fresh install) | All 6 → ready or not-yet by age alone; bar at 0/6; insight = the from-6-months line. |
| Food logged but never at a meal (`foods` has it, `feedingData` doesn't) | State/date from `foods`; exposure count = 0 → tolerated row reads "keep it in rotation" with no count. Both sources honored independently. |
| Allergen with no `FOOD_EFFECTS` record (egg/soy/wheat) | Resolver falls back to `_baseFoodName` match; intro-month falls back to 6 where `AGE_RULES` has no per-food rule (a general window, **not** an invented per-food claim). |
| `feedingData` carries the app's seeded defaults | Counted as real exposure — it *is* the meal log. (Tests clear it to assert in isolation; production does not.) |
| Age unavailable (`getAgeInMonths` absent) | Defaults to 0 → everything not-yet. Fails safe (never nudges to introduce below a floor it can't confirm). |
| Singular/plural | "offered 1 day" vs "offered N days" — handled. |

---

## 7. The analysis-layer pattern (what card #2 inherits)

This card establishes a reusable shape for Info-tab **analysis** cards (distinct from report cards):

1. **A pure `_aiCompute*()`** that returns `{ items, total, …rollups }` — no DOM, no writes, fully testable in isolation (this is what the e2e asserts against directly).
2. **A `renderInfo*()`** that consumes the compute output: summary + progress + actionability-ordered rows + a derived "what this means" line.
3. **Resolve every food through the shared spine** (`getFoodEffect`/`_baseFoodName`) so aliases are correct — never raw-name matching.
4. **Two-source honesty:** when state and repetition come from different stores, keep them separate and label each for exactly what it measures.
5. **Glance → tap → depth:** the card never crams the detail sheet's content; it points at it.

Card #2 candidates (future, not this spec): an iron/nutrient-window journey card; a milestone-window card. Each would reuse 1–5 above.

---

## 8. What this does NOT include (scope fence)

- **No new storage, no writes, no migration.** Pure derive-at-render.
- **No `styles.css` or `template.html` change.** Reuses `cd-*` / `cd-pill-*` / `cd-bar-*` and the existing Info-tab container. *(If a future iteration needs a per-state segmented bar — considered and rejected for v1 — that becomes a triple-Gov styles change in its own spec.)*
- **No engine/data edit.** `data.js` `AGE_RULES`/`FOOD_EFFECTS` and `core.js` resolvers are read, not modified.
- **No per-taste exposure count.** The meal log dedups within a day; v1 reports days, not tastes. A true taste-count would require a new event store — out of scope.
- **Not an emergency surface.** Reaction states point to the food detail sheet; the acute floor stays where food-effects-v2 put it.
- **No CareTicket creation.** This is an ambient/notable journey card, never a ticket (inherits V-4).

---

## 9. Verification contract

- `pnpm build` clean (HR-1/HR-12/icon-text audits pass).
- `tests/e2e/analytics-allergen-intro.spec.ts` — 8 cases: empty→all-ready, almond→tree-nut tolerated, peanut→watching, reaction surfacing, mixed render + notable tier + progress bar, exposure-count roll-up (alias-correct), actionability ordering, tap-through to the R3 floor.
- **Routing for the canon-cc-008 chain:** `intelligence-cards.js` edited → **Vela** (render). The compute *reads* `feedingData` + `extractDayFoods` (Maren's diet region) without editing them → `pnpm qa-route` ripple widens the summon-set to **Maren** (cross-Province read). No `styles.css`/`template.html` → not triple-Gov. Lyra synthesizes; **Cipher** runs the Edict V final-pass.

---

## 10. Open for the Architect

- **§7 pattern naming** — is "Info-tab analysis layer" the right frame, and do we want card #2 queued now or is this a one-off that happens to be reusable?
- **Exposure window** — "offered N days" counts *all* logged history. Should it window (e.g. last 30 days) so "keep it in rotation" reflects *recent* offering, not lifetime? (Deferred to a §10 decision; v1 ships lifetime.)
