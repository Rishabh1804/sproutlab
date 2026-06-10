# Food Sub-Tab v1 — F-6 "Feeding Composer" (phase-spec amendment)

**Spec version:** F-6 v1 — **scope RATIFIED 2026-06-10** (Architect: eight binding decisions, §Ratification record below)
**Date:** 2026-06-10
**Author:** Lyra (Mode-1 spec authoring)
**Amends:** `docs/specs/food-sub-tab-v1.md` — inserts phases **F-6a** (composer + refresh) and **F-6b** (voice V-1) into the arc; re-sequences F-4/F-5 behind them.
**Status:** Implementation-grade. Architect decisions are binding and are NOT open questions. Spec body enters the cc-018 lifecycle at `pending_review`; F-6a implementation PR may open against it.

> **The divergence being closed.** F-2 was scope-reframed mid-arc to the FAB Feed sheet
> only — ratified verbatim: *"F-2 = FOB Feed sheet only. Diet Log sub-tab scaffold from
> PR #165 stays as-is until F-3"* (`docs/SESSION_HANDOFF_2026-05-29.md:63`). The Log
> sub-tab never got the structured item builder. Eight months of accretion later, the two
> meal-entry surfaces have structurally diverged:
>
> | | FAB Feed sheet | Diet → Log sub-tab |
> |---|---|---|
> | Entry | structured item builder (L1–L4 rails) | free-text `.meal-input` + last-token typeahead |
> | Writer | `_fdWriteStructuredMeal` (dual-shape) | `saveFeedingDay` (legacy string; **drops the `_v1` sidecar when text changes**, illness.js:2061-2073) |
> | Save grain | per-meal, save-on-action, atomic undo | whole-day Save button, no undo |
> | Suggest | `_qlPredict` prediction card | none |
> | Visual floor | F-2 tokens-only block (styles.css:7277-7510) | pre-floor flat fills + hard-coded rgba borders (styles.css:474-477) |
>
> F-6 closes the divergence the only way that stays closed: **one shared structured
> feeding composer, two mounts.** Consistency must be structural — one component,
> rendered into both surfaces — not two implementations kept in sync by discipline.

**Threads this weaves (pattern identifications):**
- *One-writer doctrine* — every feeding mutation routes through `_fdWriteStructuredMeal` (data.js:3663), the F-2 sidecar doctrine's anticipated end-state (the sidecar comment at data.js:3646-3658 names the diet Log sub-tab as an anticipated reader).
- *Engine/render boundary* — the L1–L4 engines are already caller-agnostic and shape-stable (`window._fd*`, comment quicklog:1098-1105); F-6 generalizes only the **render/state** layer, crossing the Vela→Ceres boundary deliberately and declaratively.
- *Legacy-producer extinction* — F-6a retires the last large legacy-string producer (`saveFeedingDay`), which is the stated reason F-5 (`parseFeeding` completion) gets cleaner and lands last.
- *Suggest symmetry* — the FAB's prediction card (`_qlPredict`/`_qlPredictFood`) becomes the Log sub-tab's prefill offer; the same intelligence surfaces at both entry points.

---

## Ratification record (Architect, 2026-06-10 — binding)

1. **One shared structured feeding composer, two mounts.** Extract the FAB Feed sheet's item-builder render/state layer into a single diet.js-resident module (working prefix `_fc*`), consumed by (a) the FAB Feed sheet (shell stays in the quick-log layer) and (b) the Diet→Log sub-tab as four per-slot instances replacing the legacy free-text meal cards.
2. **Per-meal save-on-action everywhere** via `_fdWriteStructuredMeal` with the FAB's atomic full-prev-state undo pattern. The Log tab's whole-day Save button and `saveFeedingDay` retire.
3. **Unified suggest** — the FAB's prediction card also appears as the Log sub-tab's prefill offer for the current meal slot.
4. **L-2 visual refresh of BOTH surfaces** to the current design floor (registers cited in §Visual refresh).
5. **Retirement list** — dqp zone, last-token typeahead, dead pre-HR-3 pair (§Retirements).
6. **L-3 debt rides in F-6a** — `_qlPredictFood` skip-guard; raw legacy reads move onto `_fdReadDayMeal`.
7. **F-6b = voice-to-text V-1, separate fast-follow PR** — spike-first; voice never auto-saves; mic affordance reserved in F-6a.
8. **Sequencing:** F-6a PR → F-6b PR → F-4 (Patterns) → F-5 (parseFeeding) last.

---

## §Composer contract

**Home Region:** `diet.js` (Ceres). Working prefix `_fc*` (feeding composer). The composer is the **render + state** layer only; every engine it consumes stays where it lives today.

### Stays engine-side (Kael — UNCHANGED by F-6a)

All already caller-agnostic, shape-stable, `window.*`-exposed (contract comment quicklog:1098-1105):

| Engine | Anchor | Role |
|---|---|---|
| `_fdGetRepeatCandidates(meal, n, {fromDate})` | quicklog:1125 | L1 repeat rail (date-aware via `fromDate`) |
| `_fdGetCombosForMeal(meal, {maxResults})` | quicklog:1205 | L2 combos; cold-start `CURATED_COMBOS` (data.js:3507) |
| `_fdGetNextItemPredictions(items, meal, n)` | quicklog:1312 | L3 next-item, confidence floor ≥20% |
| `_fdSearchNutrition(query, {max})` | quicklog:1374 | L4 typeahead (NUTRITION + introduced + recent) |
| `_fdResolveQtyDefaults` / `NUTRITION_QTY_DEFAULTS` | data.js:3465 / :3357 | qty/unit/step defaults (30/122 explicit coverage) |
| `_fdNutritionRef` | data.js:3452 | canonical nutritionRef resolution (V-K-200) |
| `_fdWriteStructuredMeal` | data.js:3663 | THE writer — dual-shape (legacy string + `_v1` sidecar + `_time`/`_intake` mirrors; snack carries no day-level intake) |
| `_fdReadDayMeal` | data.js:3716 | THE reader — sidecar-first, legacy fallback |
| `_fdMarkMealSkipped` / `_fdIsMealSkipped` | data.js:3617 / :3633 | atomic skip (sentinel + sidecar/time/intake clear) |
| `parseFeedingV1` | data.js:3566 | read-side normalizer (V-K-202 sentinel guard) |
| `detectMealType` / `_qlComputeMealWindow` | quicklog:966 / :922 | adaptive slot detection (14d windows) |

### Moves into the composer (generalized from the FAB layer)

The F-2 renderers are ID-bound singletons (`getElementById('qlFeedItemsList')` etc.) with module-global state (`_qlFeedItems`, `_qlFeedSourceFlow`, quicklog:1774-1775). The composer re-homes them in diet.js, instance-scoped and container-scoped:

| FAB original | Anchor | Composer successor |
|---|---|---|
| `_qlFeedReset` (B1 hydrate-on-open) | quicklog:1777 | `instance.hydrate()` |
| `_qlRenderRepeatRail` | quicklog:1836 | `_fcRenderRepeatRail(inst)` |
| `_qlRenderCombosRail` | quicklog:1868 | `_fcRenderCombosRail(inst)` |
| `_qlRenderItemsList` (48px rows) | quicklog:1909 | `_fcRenderItemsList(inst)` |
| `_qlRenderNextItemRibbon` | quicklog:1960 | `_fcRenderNextItemRibbon(inst)` |
| `_qlFormatQty` (pure) | quicklog:1944 | `_fcFormatQty` |
| `_qlFeedRailSig` (dedup) | quicklog:1828 | `_fcRailSig` |
| `qlFeedApplyRepeat` / `ApplyCombo` / `AddItem` / `AdjustQty` / `RemoveItem` / `TypeaheadInput` | quicklog:1994-2094 | `fcApplyRepeat` / `fcApplyCombo` / `fcAddItem` / `fcAdjustQty` / `fcRemoveItem` / `fcTypeaheadInput` |
| `qlFeedSkipMeal` | quicklog:2096 | `fcSkipMeal` (delegates to `_fdMarkMealSkipped` + full-prev-state undo, unchanged semantics) |

**Carried contract clauses (do not lose in the move):**
- **V-V-202** — items list keeps stable alphabetical ordering; in-place sort keeps `data-arg` idx consistent with stepper/remove handlers (quicklog:1916-1922).
- **V-V-204** — L1-over-L2 dedup: repeat-rail signatures suppress identical combo chips (history beats template).
- **A6** — rails hide once items are present (accidental rail tap must not wipe in-progress items).
- **B1** — hydrate-on-open from `_fdReadDayMeal`; skipped slots do NOT hydrate; preserved `sourceFlow` is not downgraded on unchanged re-save (quicklog:1786-1804).
- **B4** — dedup-by-base on add; duplicate add toasts "already added — adjust qty" (quicklog:2012-2031).
- **Typed-fold fix (new):** `saveQLFeed`'s typed-text fold computes `nutritionRef` by raw paren-strip (quicklog:2156) instead of `_fdNutritionRef`. The composer's fold path uses `_fdNutritionRef` everywhere — one resolver, no second-best refs.

### State shape (per instance)

```js
{
  slot:   'breakfast' | 'lunch' | 'dinner' | 'snack',
  dateOf: function() -> 'YYYY-MM-DD',   // getter, never a cached string (HR-12: callers pass toDateStr-built keys)
  items:  [{ name, qty, unit, nutritionRef, source }],   // ratified F-2 item shape
  sourceFlow: 'fob-repeat'|'fob-combo'|'fob-novel'|'fob-feed'|'diet-tab',
  variant: 'sheet' | 'card',
  container: HTMLElement
}
```

`sourceFlow: 'diet-tab'` — the telemetry value RESERVED by F-2 for this exact surface (parent spec §F-2 Telemetry) now goes live: card-variant writes carry `diet-tab`.

### Mount API

```js
window._fcMount(container, opts) -> instance
//   opts: { slot, dateOf, variant, onCommit }   // onCommit: post-write hook for mount-specific refresh
// instance.hydrate()   — re-read _fdReadDayMeal(feedingData[dateOf()], slot); rebuild items
// instance.render()    — render rails + items + ribbon + typeahead + header into container
// instance.destroy()   — unbind, drop from the instance registry
```

### Events (HR-3 / HR-6)

All interaction via `data-action` delegation. The container carries `data-fc-slot="<slot>"`; the dispatcher resolves the instance via `closest('[data-fc-slot]')` so one handler set serves five mounts (1 FAB + 4 Log cards). New action names: `fcApplyRepeat`, `fcApplyCombo`, `fcAddItem`, `fcAdjustQty`, `fcRemoveItem`, `fcTypeaheadInput`, `fcSkipMeal`, `fcConfirmPrefill`, `fcEditPrefill`, `fcVoiceStart` (reserved, §F-6b). The FAB's `qlFeed*` dispatcher routes are renamed, not aliased — and the **audit gate is updated in the same PR** (§Retirements → audit gates).

Visibility toggles use a `.fc-hidden` class, NOT `el.style.display` (the F-2 renderers' `wrap.style.display` writes at quicklog:1842/:1874/:1966 do not carry over — HR-2 hygiene; see §Visual refresh purge list).

### Mic affordance reservation (decision 7)

The composer's input header reserves a mic slot in F-6a: a `data-action="fcVoiceStart"` button rendered `.fc-hidden` until F-6b lands AND `SpeechRecognition` support is detected. Because the slot ships in the shared component, **both mounts get voice simultaneously** the day F-6b merges. No visible stub ships in F-6a (nothing to tap → HR-8 not triggered; if a visible pre-F-6b stub is ever shown it MUST toast "Coming soon" via `showQLToast`).

---

## §Mount specs

### Mount A — FAB Feed sheet (shell: intelligence-quicklog.js, Vela)

- The **shell** stays in the quick-log layer: sheet open/close (`openQuickLog` illness.js:2398, `openQuickModal`), meal pills (`setQLMeal` quicklog:1709), backfill date (`_qlBackfillDate`), suggestion card (`_qlPredict` :1032, `_qlConfirmSuggest` :1513, `_qlEditSuggest` :1536), intake pills, keyboard reflow (visualViewport listener :3927-3934), `showQLToast` (:1737).
- On `openQuickModal('feed')` the shell mounts/refreshes the composer instance into the sheet body with `{ slot: _qlMeal, dateOf: () => _qlBackfillDate || today(), variant: 'sheet' }`. `setQLMeal` re-points `instance.slot` and re-hydrates (preserves the F-2 multi-save B→L→D flow).
- **`variant: 'sheet'` save grain:** the explicit Save button stays (ratified F-2 tap budget: 3-tap repeat / 6-tap novel — decision 1 keeps the shell, so the budget stands). `saveQLFeed` (quicklog:2142) thins to: fold typed text via the composer → read `instance.items` → write via `_fdWriteStructuredMeal` → undo/toast/side-effects exactly as today (:2170-2272). The suggest card's C2 semantics (`_qlConfirmSuggest` pushes predicted foods into the items list, not the input) re-target `fcAddItem`.

### Mount B — Diet → Log sub-tab (panel: template.html; glue: home.js/diet.js)

- template.html replaces the four legacy meal-cards (:979-1016) with four composer mount points, one per slot, inside the existing "Today's Meals" card. The card keeps: header + help-tip, **date-nav** (:968-971), `#dietIntelBanner` (:977). The whole-day **Save button** (`#saveFeedBtn`, :972) is REMOVED (decision 2).
- Each per-slot card region keeps (KEEP-LIST, unchanged writers/surfaces):
  - **skip pill** — `skipSingleMeal`/`unskipSingleMeal`/`updateMealSkipButtons` (quicklog:3842-3914) remain the canonical Log-tab skip writers (already sidecar-atomic per F-2 fix Alt1, :3854-3858); the pill markup moves into the composer card header, the functions stay.
  - **per-meal time input** (`mealtime-*`) — wired to the composer; a time change is a save-on-action commit.
  - **intake pills** — `MI_LEVELS` (diet.js:5259), `_miGetIntake`/`_miSetIntake` (:5266-5292, incl. the F-2 E_b sidecar sync), `_miRenderInlineEditor`/`_miWireInlineEditors`/`_miRenderDietTabIntake` (:5397+), `_miShowPostSavePrompt` (:5321) — all stay; inline editor renders in the composer card footer.
  - **per-meal insight line** — `updateMealInsight` (home.js:4947-4967) re-targets from `input.value` to the instance's `items[]` joined text; renders in the card footer (it loses its dying call sites at pickMealFood/insertDietFood/fillDietMeal, keeps `loadFeedingDay`'s).
- `loadFeedingDay` (home.js:5325-5351) re-targets: instead of filling four `.meal-input`s, it calls `instance.hydrate()` + `instance.render()` on all four instances for the selected date, then `updateMealSkipButtons()`, `renderDietIntelBanner()`, `_miRenderDietTabIntake()` as today. Its hard-coded `'—skipped—'` literal (:5332) is replaced by reading `_fdReadDayMeal(...).skipped` / the `SKIPPED_MEAL` constant (core.js:3215).
- **Suggest-prefill (decision 3):** when the selected date is **today** and the current adaptive slot (`detectMealType()`) is unlogged, that slot's composer renders a prefill offer row above its rails — same copy as the FAB card ("Breakfast time · Ragi + Banana?", from `_qlPredictFood(slot)` quicklog:983). `fcConfirmPrefill` pushes the predicted foods through `fcAddItem` (C2 semantics — items list, never raw input); `fcEditPrefill` focuses the typeahead. Only one slot ever shows the offer (the detected current slot), and only when `_qlPredictFood` returns non-null (it needs ≥3 days of slot signal, :1004).
- **Date-nav to past days:** instances re-hydrate from `_fdReadDayMeal` for the selected date; **no prefill offer** (the prediction is now-anchored — offering "Breakfast time?" on last Tuesday would be dishonest); L1 repeat rail passes `{fromDate: selectedDate}` (the engine already supports this — F-2 fix A2, quicklog:1129-1134); L2 combos stay today-anchored (`_fdGetCombosForMeal` takes no `fromDate`; combo templates are date-agnostic — accepted, noted); skip pills keep their existing today-only gating for empty slots (quicklog:3908).

---

## §Save/undo semantics

**One writer.** Both mounts write exclusively via `_fdWriteStructuredMeal(dateKey, slot, payload)` — legacy comma-string at `[meal]` + structured `[meal+'_v1']` sidecar (`{items[], time, overallIntake, note, sourceFlow, schemaVersion, writtenAt}`) + `_time` mirror (cleared when null) + `_intake` mirror for B/L/D only (snack carries no day-level intake — the pre-F-2 invariant, data.js:3693-3703).

**Sheet variant (FAB):** unchanged — explicit Save per meal; full-prev-state undo captured before mutation (quicklog:2170-2262): legacy `[meal]` + `_v1` + `_time` + `_intake`, each restored with prev-was-undefined → delete-the-key semantics so undo never re-introduces a phantom default.

**Card variant (Log sub-tab): save-on-action.** Every mutating action — `fcAddItem`, `fcRemoveItem`, `fcAdjustQty`, intake change, time change — writes through immediately. Undo is **burst-scoped**: the full prev state (all four fields, same capture as the FAB) is snapshotted at the **first** mutation after a quiet period; subsequent mutations within the burst share that snapshot; the undo toast (via `showQLToast`) restores the pre-burst state atomically. Burst quiet-period: **5s, builder default** (tunable; not an Architect question). `fcSkipMeal` is its own action with its own undo (matches `qlFeedSkipMeal` :2099-2125).

**Post-commit side-effects (KEEP-LIST — every commit path fires the full set):** `_tsfMarkDirty()`, `_islMarkDirty('diet')`, `_refreshTodayMedWithFat()` when date is today (CR-14/V-M-70 contract), `autoIntroduceFoodsFromDay(date)`, `matchSuggestionsAfterSave(date)`, tab refresh (`initFeeding`/`renderDietStats` on diet, `renderHome` on home). `showPostSaveFlash` (illness.js:2096) stays: card-variant fires it at **burst close** (not per keystroke-grade action — a flash per qty tap would be noise); sheet-variant keeps the toast flow it has today. `_miShowPostSavePrompt` stays wired to the flash.

**Retired by this section:** `saveFeedingDay` (illness.js:2040-2089 — the legacy-string writer whose text-changed branch intentionally drops the `_v1` sidecar, :2070-2072), the `#saveFeedBtn` whole-day button (template.html:972), and `updateFeedingSaveBtn` (home.js:5195-5200).

---

## §Visual refresh (L-2 — both mounts, design floor: `docs/DESIGN_PRINCIPLES.md`)

Registers cited per the floor's §Tint System (two laws: light/dark hue-swap; a tint is never a bare fill) and §Food-Domain Colour & the Polarity Collision (safety owns the structural channel):

1. **Per-slot composer cards** (Log mount) — retire the flat `--*-light` fills + hard-coded rgba borders (styles.css:468-530, borders :474-477; note snack's `rgba(240,200,120,…)` is not even the amber token). Replace with the **Receded register under Law 2**: `--*-light` wash + a `border-left` rail in the slot's domain **accent token** + the slot label in the matching `--tc-*`. Dark mode hue-swaps to the deep `--tc` hue per Law 1 (never the pale accent over dark). Slot→domain mapping unchanged: breakfast→peach (`--tc-peach` is defined as of v1.4), lunch→sage, dinner→lavender, snack→amber. The `:has()` z-index juggle (:511) dies with the dropdown it served.
2. **Food chips** — items, rail chips, and prefill chips adopt the established `.fdom-chip` / `.nutri-chip` food-chip language. Per the Polarity Collision rule, food-domain colour stays a whisper on chips; any safety-polarity signal (age-gate, allergen) keeps the **structural channel** (rail/border/icon) — the two systems never compete as fills.
3. **FAB sheet refresh** — the F-2 block (styles.css:7277-7510) is already markup-portable and tokens-only; classes rename `.ql-feed-*` → `.fc-*` with the composer. Fold in the feed-flow ad-hoc hexes found adjacent: `.ql-meal-pill.active` `#966525` (:7225), `.ql-save-feed` gradient `#966525/#906228` (:7272) → domain tokens (peach/amber family per the floor's no-ad-hoc-hex rule). (`.ql-con-pill.active` `#8a6520` :7261 is the poop flow — out of F-6 scope, registered.)
4. **Inline-residue purge list** (HR-2):
   - `highlightMatch` inline color span (home.js:5254) — resolves by deletion (§Retirements).
   - template.html `style="display:none"` seeds: `#dietDomainHero` (:957), skip pills (:981/:990/:999/:1008), meal-insight rows (:987/:996/:1005/:1014) → hidden-by-default classes; the meal-card markup is replaced anyway.
   - skip-button `style.display` toggles (quicklog:3899-3908) → class toggling in `updateMealSkipButtons`.
   - **Recon additions (same residue class, found during anchor verification):** `showQLToast` undo-span inline style (quicklog:1741); rail-renderer `wrap.style.display` writes (quicklog:1842/:1848/:1853, :1874/:1888/:1891, :1965/:1973/:1976) — the composer renderers use `.fc-hidden`.
5. **Literal `ⓘ` glyph** (template.html:967, help button) → `zi('info')` — the symbol exists in the sprite (`#zi-info`, template.html:39); live icon authority is the generated `docs/ICON_REFERENCE.html`, do not hard-code counts.

---

## §Retirements (call-site map)

| # | Retiree | Anchors | Call sites that die with it | Superseded by |
|---|---|---|---|---|
| R1 | dqp zone: `renderDietQuickPicker` | home.js:5355-5430 | `loadFeedingDay` :5348; `skipSingleMeal`/`unskipSingleMeal` (quicklog:3868/:3885); `insertDietFood`/`fillDietMeal` (illness.js:2015-2038, incl. their dispatcher routes); `dqp-zone` divs (template :982/:991/:1000/:1009); `.dqp-*` CSS | composer L1/L2 rails |
| R2 | `getTopMeals` | diet.js:6851 | sole live caller home.js:5357 (inside R1) | deletion (no migration needed) |
| R3 | `getMealSlotTopFoods` | illness.js:1996-2013 | sole live caller home.js:5410 (inside R1) | deletion |
| R4 | last-token typeahead: `showMealDropdown`, `closeMealDropdown`, `pickMealFood`, `addNewFoodFromMeal` | home.js:5202-5323 | `.meal-input`/`.meal-dropdown` markup (template :983-1013); the PR #165 `pointerdown` delegation + `data-meal-pick`/`data-meal-add` routes; `meal-input` oninput glue (~home.js:5159) | composer L4 typeahead (`fcTypeaheadInput` → `_fdSearchNutrition`) |
| R5 | `highlightMatch` | home.js:5248-5255 | both callers die (home.js:5225 in R4; diet.js:6700 in R6) | deletion (purges its inline style) |
| R6 | dead pre-HR-3 pair `updateQLFeedDropdown`/`pickQLFood` | diet.js:6669-6740 | **zero live callers** (only a retrospective comment, qa-handlers:3319-3320); inline `onmousedown` (:6700) dies with it | already superseded by F-2 |
| R7 | `saveFeedingDay` + `#saveFeedBtn` + `updateFeedingSaveBtn` | illness.js:2040-2089; template:972; home.js:5195-5200 | `data-action="saveFeedingDay"` route | §Save/undo |

**Behavior delta to disclose (Honesty axis):** `addNewFoodFromMeal` (R4) prompted `showNutrientTagModal` for unknown foods at pick time. The composer path introduces new foods at commit time via `autoIntroduceFoodsFromDay` (KEEP-LIST) without the tagging modal. **Builder default:** the composer's "add as new food" typeahead row keeps the prompt — on adding a food with no `getNutrition()` hit, fire `showNutrientTagModal` (parity, one call site). Flagged in §Open questions only as a strike-option.

**Audit gates touched:** `split/audit-feed-sheet-wiring-v1.sh` (the 10th gate) asserts required-presence on the 4 template wraps (`qlFeedRepeatWrap`/`qlFeedCombosWrap`/`qlFeedItemsWrap`/`qlFeedNextWrap`), the `saveQLFeed` → `_fdWriteStructuredMeal` writer call, and the 7 `qlFeed*` handlers + dispatcher routes. **The gate is UPDATED in the F-6a PR** to assert the `_fc*` successor shapes (wrap classes, handler names, writer call from both variants) — gates are part of the build Road: updated, never bypassed, never deleted. `qa-route.sh` needs no change (file-level routing).

---

## §L-3 debt items (ride in F-6a — decision 6)

1. **`_qlPredictFood` skip/shape guard** (quicklog:983-1026): reads `day[meal]` raw at :993 — the `SKIPPED_MEAL` sentinel (`'—skipped—'`, core.js:3215) is truthy and comma-splits into a phantom "food"; an object-shaped value would throw on `.trim()`. Fix: read via `_fdReadDayMeal(day, meal)` — skipped days drop out, items come back canonical, and the comma-dish-name parse surface shrinks (the F-5 dividend).
2. **`getTopMeals` + `getMealSlotTopFoods` raw reads** — discharged **by deletion** (R2/R3): their only callers die with the dqp zone. *(Brief discrepancy, recorded: the ratification text located `getTopMeals` at illness.js:~1990-2013; that anchor is `getMealSlotTopFoods` — `getTopMeals` lives at diet.js:6851. Both are the same raw-legacy-read class; both are covered.)*
3. **Noted-adjacent, same class (recommend folding; strike if unwanted):** `_qlComputeMealWindow` raw `day[meal].trim()` (quicklog:938) and `_qlFeedInsight` raw reads (quicklog:1555, :1570-1571) — same sentinel/shape exposure; small diffs.

---

## §F-6b — Voice-to-text V-1 (separate fast-follow PR — decision 7)

**Scope (V-1 = names only):** Web Speech API (`window.SpeechRecognition || window.webkitSpeechRecognition`), `lang: 'en-IN'`. Feature-detect; **hide the mic entirely when unsupported** (no stub — the reserved `fcVoiceStart` slot stays `.fc-hidden`).

**Pipeline:** speech → transcript → tokenize on connectors (`"and"`, `"with"`, `"aur"`, commas) → per-token `_fdSearchNutrition` match → matched tokens appear as **CHIPS FOR CONFIRMATION** in the composer — **voice never auto-saves** (allergen-log integrity: a misheard food must never silently enter the reaction-tracking record). Quantities via `_fdResolveQtyDefaults` only (no spoken-quantity parsing in V-1). Unmatched tokens surface as "add as new food?" chips. Confirming a chip routes through `fcAddItem` — from there the normal save semantics of whichever mount apply.

**First task — on-device verification spike.** Named risk: `SpeechRecognition` flakiness/unavailability in **iOS standalone-PWA** mode. The spike validates start/stop, interim results, `en-IN` accuracy on the household food vocabulary (ragi, suji, khichdi, dal names), and standalone-mode behavior on the actual device before any UI lands. If the spike fails on iOS standalone, V-1 ships Android/desktop-only behind the same feature-detect — honestly, not "broken on iPhone."

**Privacy line (ships in UI copy, one-time note):** speech recognition audio transits the platform vendor's service (Apple/Google) — it is not processed on-page. Stated plainly per the Honesty axis.

**Sprite:** the sheet has no `#zi-mic` symbol today — F-6b adds one (gallery regenerates via `build-icon-reference.mjs`).

---

## §Migration & compat

- **No mass migration** (lazy doctrine, parent spec §3). Both shapes coexist on disk indefinitely.
- **Sidecar continuity:** the composer writes dual-shape via `_fdWriteStructuredMeal`, so every reader keeps working:
  - *Legacy-string readers at `[meal]`* (home Today's Meals, diet stats + combos, intelligence-cards, ISL day-summary, medical fat-context detector — the load-bearing list in the writer doctrine comment, data.js:3648-3658) — keep reading the comma-string, unchanged.
  - *Sidecar readers* (`_fdReadDayMeal` consumers: L1-L4 engines, the composer itself, TSF) — read rich shape.
- **Edit-path regression closed:** today, editing a FAB-written meal in the Log tab via `saveFeedingDay` drops the sidecar (text-changed branch). Post-F-6a there is **no editor that writes legacy-only** — the composer re-writes the sidecar on every edit. This retires the last large legacy-string producer; remaining legacy-string writes are the skip sentinel (`_fdMarkMealSkipped`, `skipSingleMeal`) and `unskipSingleMeal`'s `''` reset — both intentional and reader-safe. That is why F-5 (`parseFeeding` completion) sequences after F-6 and gets cleaner (decision 8).
- **Lexicon hygiene (carry-along):** hard-coded `'—skipped—'` literals at illness.js:2000, home.js:5332 (and the dying R1/R4 sites), quicklog:3847-3853/:3898, diet.js:5328/:5399 — surviving sites switch to the `SKIPPED_MEAL` constant (core.js:3215) as they are touched.

---

## §HR pre-check

| HR | Status | Note |
|----|--------|------|
| HR-1 (no emojis) | action-required | Literal `ⓘ` (template:967) → `zi('info')`. No emoji in spec or code; all glyphs via `zi()`. |
| HR-2 (no inline styles) | action-required | Full purge list in §Visual refresh #4 (brief items + recon additions). Composer uses `.fc-hidden`, never `style.display`. |
| HR-3 (no inline handlers) | action-required | R6 deletes the last inline `onmousedown` in the feeding flow (diet.js:6700). All composer events via `data-action`. |
| HR-4 (escHtml at render boundaries) | at-risk → mitigated | Item names, typed text, and F-6b voice transcripts are parent input. Every composer render site escapes (`escHtml`/`escAttr`), mirroring the F-2 renderers (quicklog:1854-1938). Voice transcripts are untrusted input — chips escape before render. |
| HR-5 (tokens only) | action-required | rgba borders (:474-477) + feed-flow hexes (:7225/:7272) → domain tokens; registers per §Visual refresh. |
| HR-6 (data-action universal) | compliant | `fc*` action set + instance addressing via `data-fc-slot`. |
| HR-7 (zi via innerHTML) | compliant | Composer renderers emit `<svg class="zi"><use …>` strings as today. |
| HR-8 (stubs toast) | compliant | Mic slot is hidden, not stubbed; any visible pre-F-6b affordance must toast via `showQLToast`. |
| HR-9 (post-build QA) | structural | canon-cc-008 chain per PR (§routing). |
| HR-10 (no text-overflow ellipsis) | compliant | dqp's literal `…` truncations (home.js:5393/:5405) die with R1; the composer introduces none. |
| HR-11 (Math.floor currency) | n/a | No currency surface. |
| HR-12 (timezone-safe dates) | compliant | `dateOf` getters return `toDateStr`/`today()` keys; date walking uses explicit y/m/d construction (pattern at quicklog:1174-1175 carries over). |

**Charter alignment (CV3-006, three axes):** *Honesty* — prefill and rail chips keep visible provenance (freq ×N, confidence %, "Pediatrician-suggested"); voice never auto-saves; the nutrient-tag behavior delta is disclosed, not buried. *Extensibility* — one composer, N mounts; engines untouched; `sourceFlow: 'diet-tab'` activates the reserved telemetry value; the mic slot is a reserved seam. *Warmth* — one-handed, save-on-action with undo (no lost whole-day edits); the Log tab inherits the FAB's 3-tap repeat path; registers keep the nursery-journal tone.

---

## §canon-cc-008 routing

**F-6a** (single PR, large):

| File touched | Governor |
|---|---|
| diet.js (composer home, +~700; R6 deletion) | **Ceres — primary** |
| intelligence-quicklog.js (renderer/handler extraction, FAB shell rewiring, skip-toggle class purge) | **Vela — primary (render)** |
| data.js (no contract change expected; any writer touch) + intelligence-illness.js (R7, R3, `insertDietFood`/`fillDietMeal` removal) | **Kael — engine** |
| home.js (Mount B glue, R1/R4/R5, `loadFeedingDay` re-target) | **Maren — Care** |
| template.html + styles.css | **shared → quadruple-jurisdiction, sequential**, rotation Maren → Ceres → Kael → Vela, first-Governor by heaviest-touched Region (per CLAUDE.md; expected Ceres-first given the composer panel) |

All four Governors are therefore summoned (parallel Mode-1 audits where jurisdictions are disjoint; sequential on the shared files) → Lyra synthesizes → **Cipher Edict V final-pass** → PR ready. `pnpm qa-route` advisory confirms the summon-set; it widens, never narrows, never discharges.

**F-6b** (fast-follow PR): diet.js (Ceres primary) + quicklog/render surface if the sheet shell is touched (Vela) + Kael consult (`_fdSearchNutrition` consumption only — no engine change expected) + template.html for the `zi-mic` symbol (shared → quad if touched). Spike report precedes the PR.

**Region impact (Builder estimate; shared-module touch: YES):** Ceres diet.js 6,960 → ~7,600 (headroom ample post-split); Vela quicklog 5,536 → ~5,300 (net extraction); Maren home.js −~250; Kael illness.js −~90, data.js ±0 (**no relief for Kael's 1,847 headroom — the engine layer is deliberately untouched**); styles.css net +~60.

---

## §Phasing & PR cut (decision 8)

| Phase | Contents | PR |
|---|---|---|
| **F-6a** | Composer extraction + both mounts + suggest-prefill + save-on-action/undo + L-2 refresh + retirements R1-R7 + L-3 debt + audit-gate update | one PR, large; chain as above |
| **F-6b** | Voice V-1 (spike first, then UI) | separate fast-follow PR |
| **F-4** | Patterns sub-tab (parent spec; B-1 pre-req for chem tiles) | after F-6b |
| **F-5** | `parseFeeding` completion (v3-8) — LAST; F-6a's removal of the last big legacy-string producer is the stated reason this lands cleaner | after F-4 |

---

## §Open questions (genuinely open — Architect decisions above are NOT relitigated)

1. **Nutrient-tag prompt parity (R4 delta):** builder default is KEEP — composer's add-as-new-food fires `showNutrientTagModal` when `getNutrition()` misses. Strike if the modal should die with the legacy path.
2. **Adjacent L-3 folds:** `_qlComputeMealWindow` (:938) + `_qlFeedInsight` (:1555/:1570) raw reads — fold into F-6a (recommended, small) or register for F-5?
3. **Burst-undo quiet period:** 5s builder default — flag only if a different grain is wanted.

---

## Doctrinal references

- Parent: `docs/specs/food-sub-tab-v1.md` (F-1/F-2 ratifications; sidecar architecture; Arc B reconciliation §design note 1 — read via `_fdReadDayMeal`, never raw `entry[meal]`)
- `docs/SESSION_HANDOFF_2026-05-29.md:60-69` (the seven F-2 ratifications; F-2 = FAB-only at :63)
- `docs/DESIGN_PRINCIPLES.md` §Tint System (two laws; Receded register; food-domain whisper `.dt-*`) + §Food-Domain Colour & the Polarity Collision (safety owns the structural channel)
- `docs/specs/sproutlab-v3-charter.md` CV3-006 (three-axis alignment); CV3-003 (honest empty states — composer empty row keeps "Tap a combo above, or type an item below")
- `split/audit-feed-sheet-wiring-v1.sh` (gate updated in-PR, §Retirements)
- canon-cc-008 + canon-cc-022 + canon-cc-027 (process floor); HR-1..HR-12

---

— *Lyra, 2026-06-10, F-6 "Feeding Composer" phase-spec. Eight Architect decisions ratified and bound; anchors verified against `main` working tree same day. One thread worth naming before the build: after F-6a, every feeding edit in the app — sheet, card, skip, intake — flows through one writer and one reader. That is the tapestry the F-2 sidecar doctrine promised. Decision requested on §Open questions 1-3; otherwise F-6a may open.*
