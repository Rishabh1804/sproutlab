# Food Sub-Tab v1 — F-6 "Feeding Composer" (phase-spec amendment)

**Spec version:** F-6 v1.1 — **scope RATIFIED 2026-06-10** (Architect: eight binding decisions, §Ratification record below); **Governor amendments folded 2026-06-10** (this revision)
**Date:** 2026-06-10 (authored + reviewed + synthesized same day)
**Author:** Lyra (Mode-1 spec authoring; v1.1 = Mode-1 synthesis of the Ceres + Vela spec-round audits)
**Amends:** `docs/specs/food-sub-tab-v1.md` — inserts phases **F-6a** (composer + refresh) and **F-6b** (voice V-1) into the arc; re-sequences F-4/F-5 behind them.
**Status:** Implementation-grade. Architect decisions are binding and are NOT open questions. **Reviews complete:** **Ceres** (Nutrition) — approve-with-amendments (blocker F6-1; majors F6-2..F6-6; minors/nits F6-7..F6-11); **Vela** (Surfacing) — approve-with-amendments (blocker V-V-210; majors V-V-211/212/216/217/219; minors/nits V-V-213/214/215/218/220/221/222/224; endorsement V-V-223). **All amendments folded into this body 2026-06-10.** Both Governors stated, and the fold verified clause-by-clause, that no amendment threatens the eight ratified decisions. **cc-018 state:** `pending_review` → reviews returned → **amendments folded (this revision)**; next gate is Architect ratification of §Resolved questions, after which the F-6a implementation PR may open. **Kael (Intelligence engine) and Maren (Care) receive their full Mode-1 pass at the F-6a implementation gate**; their spec-round pair-notes are recorded for them in §canon-cc-008 routing (Kael: F6-3 writer touch, F6-4 combo record, F6-10 deferral; Maren: F6-1 `initFeeding`, home.js).

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
- *Allergen-substrate integrity* (named at the fold) — the feeding record feeds the introduction ladder and the reaction watch-windows; F6-1/F6-2/F6-5 all guard the same thread: nothing enters or pollutes that substrate without the parent's actual intent.

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

### Stays engine-side (Kael — unchanged by F-6a, with ONE bound exception: clause C4 below)

All already caller-agnostic, shape-stable, `window.*`-exposed (contract comment quicklog:1098-1105):

| Engine | Anchor | Role |
|---|---|---|
| `_fdGetRepeatCandidates(meal, n, {fromDate})` | quicklog:1125 | L1 repeat rail (date-aware via `fromDate`) |
| `_fdGetCombosForMeal(meal, {maxResults})` | quicklog:1205 | L2 combos; cold-start `CURATED_COMBOS` (data.js:3507; nut-form correction per clause C7) |
| `_fdGetNextItemPredictions(items, meal, n)` | quicklog:1312 | L3 next-item, confidence floor ≥20% |
| `_fdSearchNutrition(query, {max})` | quicklog:1374 | L4 typeahead (NUTRITION + introduced + recent) |
| `_fdResolveQtyDefaults` / `NUTRITION_QTY_DEFAULTS` | data.js:3465 / :3357 | qty/unit/step defaults (30/122 explicit coverage) |
| `_fdNutritionRef` | data.js:3452 | canonical nutritionRef resolution (V-K-200) |
| `_fdWriteStructuredMeal` | data.js:3663 | THE writer — dual-shape (legacy string + `_v1` sidecar + `_time`/`_intake` mirrors; snack carries no day-level intake). **Gains `intakeExplicit` provenance per clause C4 — the one F-6a engine touch (F6-3).** |
| `_fdReadDayMeal` | data.js:3716 | THE reader — sidecar-first, legacy fallback |
| `_fdMarkMealSkipped` / `_fdIsMealSkipped` | data.js:3617 / :3633 | atomic skip (sentinel + sidecar/time/intake clear) |
| `parseFeedingV1` | data.js:3566 | read-side normalizer (V-K-202 sentinel guard) |
| `detectMealType` / `_qlComputeMealWindow` | quicklog:966 / :922 | adaptive slot detection (14d windows; `_qlComputeMealWindow` moves onto `_fdReadDayMeal` per §L-3 item 3, Q2-resolved) |

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
- **V-V-214** — vulgar-fraction qty display carries **by name**: `_fcFormatQty` keeps the ¼/½/¾ + mixed-number rendering (quicklog:1941-1956). A refactor that flattens "¼" to "0.25" is a contract break, not cosmetic drift.
- **A6** — rails hide once items are present (accidental rail tap must not wipe in-progress items).
- **B1** — hydrate-on-open from `_fdReadDayMeal`; skipped slots do NOT hydrate; preserved `sourceFlow` is not downgraded on unchanged re-save (quicklog:1786-1804; precedence completed by clause C5).
- **B4** — dedup-by-base on add; duplicate add toasts "already added — adjust qty" (quicklog:2012-2031).
- **Typed-fold fix (new):** `saveQLFeed`'s typed-text fold computes `nutritionRef` by raw paren-strip (quicklog:2156) instead of `_fdNutritionRef`. The composer's fold path uses `_fdNutritionRef` everywhere — one resolver, no second-best refs.

### Governor-bound contract clauses (folded from the Ceres + Vela Mode-1 audits, 2026-06-10)

- **C1 — No-match add-as-new-food row (V-V-210 — BLOCKER, now contract).** When `fcTypeaheadInput` yields no `_fdSearchNutrition` hit, the dropdown renders a **tappable add-row** — `data-action="fcAddItem"` carrying the typed text as its argument (the `.meal-dd-add` pattern from the dying R4 path, styles.css:522) — in **BOTH variants**. The FAB's "No match. Press Enter to add as new food" copy (quicklog:2080) is **retired as a false affordance** — no Enter/keydown handler exists anywhere (template.html:2696 carries only `data-action-on="input"`); without this row, Mount B's retired Save button would leave a parent typing "makhana porridge" with NO path into the record. The sheet's Save-time typed-text fold (quicklog:2148-2162) **stays as belt-and-braces** — the row is the primary path, the fold the net. The typed text echoed in the row is parent input: `escHtml` before render (HR-4). The **nutrient-tag prompt hangs off this row** (Q1 RESOLVED): committing an add whose name misses `getNutrition()` fires `showNutrientTagModal` — on commit of the unmatched add, never per keystroke.
- **C2 — Typeahead blur-dismiss (V-V-211).** Close-on-blur migrates as a contract row, not folklore: today it is a global `focusout` listener ID-bound to `qlFeedInput` with a **load-bearing 200ms grace** so a tap on a dropdown row wins the race against dismissal (quicklog:3917-3924). The composer binds it **per-instance, container-scoped, grace preserved** — four Log-card dropdowns must each dismiss on blur AND still lose the race to their own row taps.
- **C3 — Card-variant dropdown stacking (V-V-212).** §Visual refresh #1 retires the `:has()` z-index juggle (styles.css:511) with the dropdown it served — but the composer brings its **own** L4 dropdown into the same stacked-card context, ×4 (the `.meal-dropdown` grain: an overlay inside a stacked wrap must clear the next slot card below, styles.css:503-510). The treatment is **chosen, not inherited by accident**: `.fc-card:has(.fc-dropdown.open)` raises the open card above its lower siblings — the :511 fix reborn deliberately, owned by the composer's CSS block. Quad-rotation surface (shared styles.css).
- **C4 — Intake provenance (F6-3).** `_fdWriteStructuredMeal` unconditionally defaults `[meal]_intake` to 0.75 for B/L/D (data.js:3699-3700); with `saveFeedingDay` retired (it preserved unset intake, illness.js:2058-2060), `_miShowPostSavePrompt`'s fires-only-when-unset check (diet.js:5325-5334) would go permanently dead and the "is it enough" signal would be fabricated at "Most" without parent confirmation — the upward-bias failure F-2 ratification #3 guarded against. Bound fix: the sidecar carries **`intakeExplicit: true` only when a parent touched an intake pill**; the writer may still default the mirror, but **the prompt checks provenance, not presence**. This is a small bound contract touch on `_fdWriteStructuredMeal` — the former routing line "data.js: no contract change expected" is **amended accordingly** (pair-note Kael; the one engine-side touch F-6a carries).
- **C5 — `sourceFlow` precedence on cross-surface edits (V-V-221).** **Preserve-on-unchanged, stamp-on-changed:** a re-save with no item changes keeps the stored `sourceFlow` (the existing B1 no-downgrade rule); any commit that changes items stamps the editing surface's value (`diet-tab` for card edits, the `fob-*` family for sheet edits). A FAB-written `fob-combo` meal edited on the Log card becomes `diet-tab` — said, not assumed.
- **C6 — Saved-state asymmetry + persistent cue (V-V-217).** The two mounts carry opposite saved-state models: **sheet — nothing is saved until Save; card — everything is saved instantly.** The asymmetry is **named here so the F-6a QA round tests both failure directions** (phone locked before confirmation arrives; sheet closed without Save by a card-trained parent). The card variant carries a **persistent quiet saved cue in the slot footer — "Saved · 7:32 PM"** — state carried by the surface, not by a transient toast.
- **C7 — Nut-form on the combo surface (F6-4).** `CURATED_COMBOS` snack `{ items: ['Banana','Almonds'], minAgeMonths: 8 }` (data.js:3544-3546) names an un-formed nut — nuts are never whole under the choking gate (the V-M-206 whole/chopped-nut guard class) — and F-6 multiplies the chip surface from one behind-a-FAB sheet to four permanently mounted cards. F-6a carries **either** the one-line data correction ("Almond powder") **or** the composer combo-chip render binds form copy for nut-class items. The record is Kael's: **verify against AGE_RULES/FOOD_EFFECTS before changing** (pair-note Kael).

### State shape (per instance)

```js
{
  slot:   'breakfast' | 'lunch' | 'dinner' | 'snack',
  dateOf: function() -> 'YYYY-MM-DD',   // getter, never a cached string (HR-12: callers pass toDateStr-built keys)
  items:  [{ name, qty, unit, nutritionRef, source }],   // ratified F-2 item shape
  sourceFlow: 'fob-repeat'|'fob-combo'|'fob-novel'|'fob-feed'|'diet-tab',   // precedence per C5
  variant: 'sheet' | 'card',
  container: HTMLElement
}
```

`sourceFlow: 'diet-tab'` — the telemetry value RESERVED by F-2 for this exact surface (parent spec §F-2 Telemetry) now goes live: card-variant writes carry `diet-tab` (stamped per C5).

### Mount API

```js
window._fcMount(container, opts) -> instance
//   opts: { slot, dateOf, variant, onCommit }   // onCommit: post-write hook for mount-specific refresh
//   card-variant onCommit contract: SCOPED refresh for dateOf() — never initFeeding (clause S1, §Save/undo)
// instance.hydrate()   — re-read _fdReadDayMeal(feedingData[dateOf()], slot); rebuild items
// instance.render()    — render rails + items + ribbon + typeahead + header into container
// instance.destroy()   — unbind, drop from the instance registry
```

### Events (HR-3 / HR-6)

All interaction via `data-action` delegation. The container carries `data-fc-slot="<slot>"`; the dispatcher resolves the instance via `closest('[data-fc-slot]')` so one handler set serves five mounts (1 FAB + 4 Log cards). New action names: `fcApplyRepeat`, `fcApplyCombo`, `fcAddItem` (also the C1 no-match add-row's action, carrying typed text), `fcAdjustQty`, `fcRemoveItem`, `fcTypeaheadInput`, `fcSkipMeal`, `fcConfirmPrefill`, `fcEditPrefill`, `fcShowSuggestions` (condensed-slot rail disclosure, §Mount B), `fcVoiceStart` (reserved, §F-6b). The FAB's `qlFeed*` dispatcher routes are renamed, not aliased — and the **audit gate is updated in the same PR** (§Retirements → audit gates).

Visibility toggles use a `.fc-hidden` class, NOT `el.style.display` (the F-2 renderers' `wrap.style.display` writes at quicklog:1842/:1874/:1966 do not carry over — HR-2 hygiene; see §Visual refresh purge list). Per-instance blur-dismiss with 200ms grace per clause C2.

### Mic affordance reservation (decision 7)

The composer's input header reserves a mic slot in F-6a: a `data-action="fcVoiceStart"` button rendered `.fc-hidden` until F-6b lands AND `SpeechRecognition` support is detected. Because the slot ships in the shared component, **both mounts get voice simultaneously** the day F-6b merges. No visible stub ships in F-6a (nothing to tap → HR-8 not triggered; if a visible pre-F-6b stub is ever shown it MUST toast "Coming soon" via `showQLToast`).

---

## §Mount specs

### Mount A — FAB Feed sheet (shell: intelligence-quicklog.js, Vela)

- The **shell** stays in the quick-log layer: sheet open/close (`openQuickLog` illness.js:2398, `openQuickModal`), meal pills (`setQLMeal` quicklog:1709), backfill date (`_qlBackfillDate`), suggestion card (`_qlPredict` :1032, `_qlConfirmSuggest` :1513, `_qlEditSuggest` :1536), intake pills, keyboard reflow (visualViewport listener :3927-3934 — sheet-only, see Mount B keyboard note), `showQLToast` (:1737).
- On `openQuickModal('feed')` the shell mounts/refreshes the composer instance into the sheet body with `{ slot: _qlMeal, dateOf: () => _qlBackfillDate || today(), variant: 'sheet' }`. `setQLMeal` re-points `instance.slot` and re-hydrates (preserves the F-2 multi-save B→L→D flow).
- **`variant: 'sheet'` save grain:** the explicit Save button stays (ratified F-2 tap budget: 3-tap repeat / 6-tap novel — decision 1 keeps the shell, so the budget stands). `saveQLFeed` (quicklog:2142) thins to: fold typed text via the composer → read `instance.items` → write via `_fdWriteStructuredMeal` → undo/toast/side-effects exactly as today (:2170-2272). The suggest card's C2-suggest semantics (`_qlConfirmSuggest` pushes predicted foods into the items list, not the input) re-target `fcAddItem`.
- **No-match path (clause C1):** the sheet gets the same tappable add-row; the "Press Enter" copy retires; the Save-time fold stays as belt-and-braces behind it.

### Mount B — Diet → Log sub-tab (panel: template.html; glue: home.js/diet.js)

- template.html replaces the four legacy meal-cards (:979-1016) with four composer mount points, one per slot, inside the existing "Today's Meals" card. The card keeps: header + help-tip, **date-nav** (:968-971), `#dietIntelBanner` (:977). The whole-day **Save button** (`#saveFeedBtn`, :972) is REMOVED (decision 2).
- Each per-slot card region keeps (KEEP-LIST, unchanged writers/surfaces):
  - **skip pill** — `skipSingleMeal`/`unskipSingleMeal`/`updateMealSkipButtons` (quicklog:3842-3914) remain the canonical Log-tab skip writers (already sidecar-atomic per F-2 fix Alt1, :3854-3858); the pill markup moves into the composer card header, the functions stay.
  - **per-meal time input** (`mealtime-*`) — wired to the composer; a time change is a save-on-action commit.
  - **intake pills** — `MI_LEVELS` (diet.js:5259), `_miGetIntake`/`_miSetIntake` (:5266-5292, incl. the F-2 E_b sidecar sync), `_miRenderInlineEditor`/`_miWireInlineEditors`/`_miRenderDietTabIntake` (:5397+), `_miShowPostSavePrompt` (:5321) — all stay; inline editor renders in the composer card footer. A pill tap sets `intakeExplicit: true` (clause C4); the post-save prompt checks provenance, not presence.
  - **per-meal insight line** — `updateMealInsight` (home.js:4947-4967) re-targets from `input.value` to the instance's `items[]` joined text; renders in the card footer (it loses its dying call sites at pickMealFood/insertDietFood/fillDietMeal, keeps `loadFeedingDay`'s). Its `box.style.display='flex'/'none'` writes (home.js:4963/:4965) join the HR-2 purge list — the re-targeted renderer class-toggles (F6-9).
  - **slot footer saved cue** — persistent "Saved · 7:32 PM" per clause C6.
- **Condensed-slot default (F6-7 + V-V-224 — Ceres and Vela convergent, bound):** on render, **only one slot expands its rails by default** — on today, the `detectMealType()` current slot; on past dates, the **first unlogged slot**. Other empty slots render condensed: typeahead + a "Show suggestions" disclosure (`data-action="fcShowSuggestions"`). **Rail computation is lazy** — L1/L2/L3 run on expand/focus, not on mount (a date-nav tap must not trigger 8 `feedingData` scans). Slots with committed items render their 48px item rows (rails stay hidden per A6). This is the half-awake backfill case: never 8 rails + 4 inputs + a prefill row in one column.
- **Keyboard (V-V-213 — consciously addressed):** the visualViewport reflow toggles `.ql-keyboard-open` only on `.ql-modal-overlay.open` (quicklog:3927-3934) and stays **sheet-only**; the card variant **waives bespoke keyboard handling in F-6a** — native scroll-into-view plus the 200px-max dropdown carry it. If on-device QA shows dinner/snack fold collisions, the registered follow-up is a dropdown that flips open upward — a deliberate waiver, not an oversight.
- `loadFeedingDay` (home.js:5325-5351) re-targets: instead of filling four `.meal-input`s, it calls `instance.hydrate()` + `instance.render()` on all four instances for the selected date, then `updateMealSkipButtons()`, `renderDietIntelBanner()`, `_miRenderDietTabIntake()` as today. Its hard-coded `'—skipped—'` literal (:5332) is replaced by reading `_fdReadDayMeal(...).skipped` / the `SKIPPED_MEAL` constant (core.js:3215). **`undoLastQL`'s diet-tab refresh (quicklog:1759) joins the re-target list (V-V-222):** post-undo it re-hydrates the affected composer instance(s), not the dead `.meal-input`s.
- **Suggest-prefill (decision 3):** when the selected date is **today** and the current adaptive slot (`detectMealType()`) is unlogged, that slot's composer renders a prefill offer row above its rails — same copy as the FAB card ("Breakfast time · Ragi + Banana?", from `_qlPredictFood(slot)` quicklog:983). `fcConfirmPrefill` pushes the predicted foods through `fcAddItem` (items list, never raw input); `fcEditPrefill` focuses the typeahead. Only one slot ever shows the offer (the detected current slot), and only when `_qlPredictFood` returns non-null (it needs ≥3 days of slot signal, :1004).
  - **Offer-state vs committed-state (V-V-219, bound):** offer chips take a **distinct interrogative treatment — ghost/dashed fill + an explicit "Add" verb**; **committed items render ONLY in the 48px item-row form, never chip form** — state carried by shape, not punctuation. Identical chip grammar for "we suggest" and "you logged" in adjacent rows fails the half-awake test.
  - **Prefill-confirm is a mutating action under save-on-action (V-V-218, stated):** one tap on a question ("Ragi + Banana?") logs the meal on the card; on the sheet the same gesture leaves Save pending. Accordingly **`fcConfirmPrefill` is a burst OPENER** (§Save/undo) so the burst-close undo toast covers exactly that gesture.
  - **The no-prefill-on-past-days rule lands as a gate assertion** (§Retirements → audit gates).
- **Date-nav to past days:** instances re-hydrate from `_fdReadDayMeal` for the selected date; **no prefill offer** (the prediction is now-anchored — offering "Breakfast time?" on last Tuesday would be dishonest; now gate-asserted per V-V-219); L1 repeat rail passes `{fromDate: selectedDate}` (the engine already supports this — F-2 fix A2, quicklog:1129-1134); L2 combos stay today-anchored (`_fdGetCombosForMeal` takes no `fromDate`; combo templates are date-agnostic — accepted, noted); skip pills keep their existing today-only gating for empty slots (quicklog:3908); rail expansion follows the condensed-slot default above (first unlogged slot).

---

## §Save/undo semantics

**One writer.** Both mounts write exclusively via `_fdWriteStructuredMeal(dateKey, slot, payload)` — legacy comma-string at `[meal]` + structured `[meal+'_v1']` sidecar (`{items[], time, overallIntake, intakeExplicit (C4), note, sourceFlow, schemaVersion, writtenAt}`) + `_time` mirror (cleared when null) + `_intake` mirror for B/L/D only (snack carries no day-level intake — the pre-F-2 invariant, data.js:3693-3703).

**Sheet variant (FAB):** unchanged — explicit Save per meal; full-prev-state undo captured before mutation (quicklog:2170-2262): legacy `[meal]` + `_v1` + `_time` + `_intake`, each restored with prev-was-undefined → delete-the-key semantics so undo never re-introduces a phantom default. Save is simultaneously commit and burst close: the full side-effect set fires at Save as today. *(Registered, unchanged by F-6a: the sheet's Save-time introductions are not reverted by sheet undo — pre-existing F-2 behavior; the card burst below does better, and parity is a future candidate.)*

**Card variant (Log sub-tab): save-on-action with burst choreography (F6-1, F6-2, F6-6, F6-8, V-V-216, V-V-217, V-V-218 — all bound).**

- **S1 — Scoped refresh, never `initFeeding` (F6-1 — BLOCKER, now contract).** The card-variant `onCommit` performs a **scoped refresh for `dateOf()`**: re-render the committing instance + `renderDietStats()` + `renderDietIntelBanner()` + `_miRenderDietTabIntake()` for the instance's date. It must **never call `initFeeding` and never reset `feedingDate`** — `initFeeding()` hard-resets `feedingDate` to `today()` before `loadFeedingDay()` (home.js:4462-4466); fired post-commit it would snap a date-navved panel back to today mid-entry and land the parent's next item on the wrong day's record, corrupting reaction-day reconstruction at source. **`initFeeding` is reserved for tab entry.** (Pair-note Maren: the reset lives in her file.)
- **S2 — Burst scoping.** Every mutating action — `fcAddItem`, `fcRemoveItem`, `fcAdjustQty`, intake change, time change — writes through immediately. The full prev state (all four fields, same capture as the FAB) is snapshotted at the **first** mutation after a quiet period; subsequent mutations within the burst share that snapshot. Quiet period: **5s (Q3 RESOLVED — stands, bound by S3-S5)**. **`fcConfirmPrefill` opens a burst** (V-V-218). **An action on a DIFFERENT slot closes the current burst immediately** (no cross-slot snapshot bleed — V-V-216); slot blur and tab leave also close it.
- **S3 — Introductions defer to burst close; undo reverts them (F6-2).** `autoIntroduceFoodsFromDay(date)` + `matchSuggestionsAfterSave(date)` fire at **burst close, computed from the items present at close** — a fat-fingered "Egg" added and removed 4s later never writes a false "introduced, ok, no reaction" row into the allergen ladder, and the watch-window discipline is never skipped for a food never actually fed. The burst snapshot **records the `foods` delta** those burst-close introductions produce; **undo restores the feeding record AND the burst-scoped introductions** (disclosed: the FAB's four-field undo pattern, quicklog:2249-2262, never restored `foods` — the card burst does).
- **S4 — Undo toast choreography (V-V-216).** The undo toast fires **at burst close**, not per mutation; **duration 8s** — at or above the quiet period, so the affordance cannot expire before its own burst is closeable; **copy names the slot** ("Breakfast updated · Undo"). `showQLToast`'s 2000ms default and its null-on-hide of the single global `_lastQLUndo` (quicklog:1747) do not carry as-is: card-burst undo state lives on the instance until toast expiry.
  - *The one number (Ceres 10-12s vs Vela 6-8s, reconciled):* Ceres's 10-12s applied **only if one timer had to serve both the flash and the undo**; S5 decouples them, dissolving that contingency and meeting her stated conditions (a) flash off the burst timer, (b) intent-boundary closes, plus her floor that undo duration ≥ burst window. With the flash decoupled, the governing constraint is Vela's render-side range — **8s, the top of it**, is chosen.
- **S5 — Flash at intent boundaries (F6-6).** `showPostSaveFlash` (illness.js:2096) is **decoupled from the burst timer** — two different grains. Card-variant triggers are **intent boundaries only**: slot blur, slot switch, tab leave — **once per slot per session**; never a mid-pause timer (one-handed feeding cadence pauses >5s routinely; a full overlay mid-pause is hostile). Flash and undo toast coordinate as **one surface, not two competing ones**. `_miShowPostSavePrompt` stays wired to the flash and checks intake provenance (C4). Sheet-variant keeps the toast flow it has today.
- **S6 — Side-effect split (amends the former single keep-list).** *Per-commit:* the write, `_tsfMarkDirty()`, `_islMarkDirty('diet')`, `_refreshTodayMedWithFat()` when the date is today (CR-14/V-M-70 contract), the S1 scoped refresh. *Burst-close:* `autoIntroduceFoodsFromDay` + `matchSuggestionsAfterSave` (S3) **plus the three legacy post-save refreshes the original keep-list omitted (F6-8, named successors):** `renderFoods()` — the one that matters most: an auto-introduced food must appear on Foods Introduced — `renderFeedingHistory()`, `renderTips()` (illness.js:2081-2083). `renderHome` on the home tab as today.
- **S7 — Persistent saved cue (C6/V-V-217):** the slot footer carries "Saved · 7:32 PM" — the resting state the transient toast cannot carry.
- `fcSkipMeal` is its own action with its own undo (matches `qlFeedSkipMeal` :2099-2125).

**Retired by this section:** `saveFeedingDay` (illness.js:2040-2089 — the legacy-string writer whose text-changed branch intentionally drops the `_v1` sidecar, :2070-2072), the `#saveFeedBtn` whole-day button (template.html:972), and `updateFeedingSaveBtn` (home.js:5195-5200).

---

## §Visual refresh (L-2 — both mounts, design floor: `docs/DESIGN_PRINCIPLES.md`)

Registers cited per the floor's §Tint System (two laws: light/dark hue-swap; a tint is never a bare fill) and §Food-Domain Colour & the Polarity Collision (safety owns the structural channel):

1. **Per-slot composer cards** (Log mount) — retire the flat `--*-light` fills + hard-coded rgba borders (styles.css:468-530, borders :474-477; note snack's `rgba(240,200,120,…)` is not even the amber token). Replace with the **Receded register under Law 2**: `--*-light` wash + a `border-left` rail in the slot's domain **accent token** + the slot label in the matching `--tc-*`. Dark mode hue-swaps to the deep `--tc` hue per Law 1 (never the pale accent over dark). Slot→domain mapping unchanged: breakfast→peach (`--tc-peach` is defined as of v1.4), lunch→sage, dinner→lavender, snack→amber. The `:has()` z-index juggle (:511) dies with the dropdown it served — and is **deliberately reborn for the composer's own dropdown per clause C3** (chosen, not inherited).
2. **Food chips** — rail chips and prefill chips adopt the established `.fdom-chip` / `.nutri-chip` food-chip language, with the **V-V-219 grammar split**: offer chips ghost/dashed + "Add" verb; **committed items never render as chips** — 48px rows only. Per the Polarity Collision rule, food-domain colour stays a whisper on chips; any safety-polarity signal (age-gate, allergen) keeps the **structural channel** (rail/border/icon) — the two systems never compete as fills. **This chip law extends explicitly to F-6b voice chips (F6-5b):** never-introduced or allergen-bearing voice matches carry the new-food/allergen structural-channel marker.
3. **FAB sheet refresh** — the F-2 block (styles.css:7277-7510) is already markup-portable and tokens-only; classes rename `.ql-feed-*` → `.fc-*` with the composer. Fold in the feed-flow ad-hoc hexes found adjacent: `.ql-meal-pill.active` `#966525` (:7225), `.ql-save-feed` gradient `#966525/#906228` (:7272) → domain tokens (peach/amber family per the floor's no-ad-hoc-hex rule). (`.ql-con-pill.active` `#8a6520` :7261 is the poop flow — out of F-6 scope, registered.)
4. **Inline-residue purge list** (HR-2):
   - `highlightMatch` inline color span (home.js:5254) — resolves by deletion (§Retirements).
   - template.html `style="display:none"` seeds: `#dietDomainHero` (:957), skip pills (:981/:990/:999/:1008), meal-insight rows (:987/:996/:1005/:1014) → hidden-by-default classes; the meal-card markup is replaced anyway.
   - skip-button `style.display` toggles (quicklog:3899-3908) → class toggling in `updateMealSkipButtons`.
   - `updateMealInsight` `box.style.display='flex'/'none'` writes (home.js:4963/:4965) — the function survives and re-targets, so its display writes go on the purge list explicitly; the re-targeted renderer class-toggles (**F6-9**).
   - **Recon additions (same residue class, found during anchor verification; anchors corrected per V-V-215):** `showQLToast` undo-span inline style (quicklog:1741); rail-renderer `wrap.style.display` writes — repeat rail quicklog:1842/:1848/:1853, combos rail :1874/:1887/:1891, ribbon :1966/:1972/:1976 — the composer renderers use `.fc-hidden`.
5. **Literal `ⓘ` glyph** (template.html:967, help button) → `zi('info')` — the symbol exists in the sprite (`#zi-info`, template.html:39); live icon authority is the generated `docs/ICON_REFERENCE.html`, do not hard-code counts.

*Register verification (V-V-223, recorded):* Vela verified the register choices against the floor — the current per-slot cards confirmed as the Law 2 violation the Receded register fixes (snack's non-token rgba confirmed); the dark-mode deep-`--tc` swap satisfies Law 1; the polarity-collision split correctly keeps safety structural; the hexes and `#zi-info` anchors verify. Endorsement, standing for the quad rotation.

---

## §Retirements (call-site map)

| # | Retiree | Anchors | Call sites that die with it | Superseded by |
|---|---|---|---|---|
| R1 | dqp zone: `renderDietQuickPicker` | home.js:5355-5430 | `loadFeedingDay` :5348; `skipSingleMeal`/`unskipSingleMeal` (quicklog:3868/:3885); `insertDietFood`/`fillDietMeal` (illness.js:2015-2038, incl. their dispatcher routes); `dqp-zone` divs (template :982/:991/:1000/:1009); `.dqp-*` CSS | composer L1/L2 rails (generality delta disclosed below, F6-11) |
| R2 | `getTopMeals` | diet.js:6851 | sole live caller home.js:5357 (inside R1) | deletion (no migration needed) |
| R3 | `getMealSlotTopFoods` | illness.js:1996-2013 | sole live caller home.js:5410 (inside R1) | deletion |
| R4 | last-token typeahead: `showMealDropdown`, `closeMealDropdown`, `pickMealFood`, `addNewFoodFromMeal` | home.js:5202-5323 | `.meal-input`/`.meal-dropdown` markup (template :983-1013); the PR #165 `pointerdown` delegation + `data-meal-pick`/`data-meal-add` routes; `meal-input` oninput glue (~home.js:5159) | composer L4 typeahead (`fcTypeaheadInput` → `_fdSearchNutrition`) + the C1 no-match add-row |
| R5 | `highlightMatch` | home.js:5248-5255 | both callers die (home.js:5225 in R4; diet.js:6700 in R6) | deletion (purges its inline style) |
| R6 | dead pre-HR-3 pair `updateQLFeedDropdown`/`pickQLFood` | diet.js:6669-6740 | **zero live callers** (only a retrospective comment, qa-handlers:3319-3320); inline `onmousedown` (:6700) dies with it | already superseded by F-2 |
| R7 | `saveFeedingDay` + `#saveFeedBtn` + `updateFeedingSaveBtn` | illness.js:2040-2089; template:972; home.js:5195-5200 | `data-action="saveFeedingDay"` route | §Save/undo |
| R8 | "Press Enter to add as new food" no-match copy | quicklog:2080 | (copy only — no handler ever existed; template.html:2696 is `data-action-on="input"` only) | the C1 tappable add-row (V-V-210) |

**Behavior delta #1 (Honesty axis) — Q1 RESOLVED: KEEP.** `addNewFoodFromMeal` (R4) prompted `showNutrientTagModal` for unknown foods at pick time. The composer **keeps the prompt**, hung off the C1 no-match add-row: committing an unmatched add fires `showNutrientTagModal` — on commit, never per keystroke. Both Governors concur (Ceres firmly: untagged foods are nutritional dark matter to every adequacy surface — flash, insight pairing, heatmap, iron-gap; Vela: conditional on V-V-210, now bound). Parity extends to F-6b voice-confirmed adds.

**Behavior delta #2 (Honesty axis, disclosed — F6-11).** The dqp's cross-slot fill — "same as today's other meal" (home.js:5398-5407, e.g. snack offered breakfast's leftovers) — **loses generality**: the L1 successor covers same-as-yesterday (`fromDate`) and the lunch→dinner echo only. Disclosed here rather than silently dropped; L1 cross-slot generalization is registered as future work (F-4 candidate).

**Audit gates touched:** `split/audit-feed-sheet-wiring-v1.sh` (the 10th gate) asserts required-presence on the 4 template wraps (`qlFeedRepeatWrap`/`qlFeedCombosWrap`/`qlFeedItemsWrap`/`qlFeedNextWrap`), the `saveQLFeed` → `_fdWriteStructuredMeal` writer call, and the 7 `qlFeed*` handlers + dispatcher routes. **The gate is UPDATED in the F-6a PR** to assert the `_fc*` successor shapes (wrap classes, handler names, writer call from both variants) **plus three new assertions from this round:** (a) the C1 no-match add-row is present in both variants and the retired "Press Enter" copy is absent (V-V-210); (b) the card-variant prefill offer is structurally gated to today — **no-prefill-on-past-days** (V-V-219); (c) the card-variant commit path contains no `initFeeding` call (F6-1/S1). Gates are part of the build Road: updated, never bypassed, never deleted. `qa-route.sh` needs no change (file-level routing).

---

## §L-3 debt items (ride in F-6a — decision 6)

1. **`_qlPredictFood` skip/shape guard** (quicklog:983-1026): reads `day[meal]` raw at :993 — the `SKIPPED_MEAL` sentinel (`'—skipped—'`, core.js:3215) is truthy and comma-splits into a phantom "food"; an object-shaped value would throw on `.trim()`. Fix: read via `_fdReadDayMeal(day, meal)` — skipped days drop out, items come back canonical, and the comma-dish-name parse surface shrinks (the F-5 dividend).
2. **`getTopMeals` + `getMealSlotTopFoods` raw reads** — discharged **by deletion** (R2/R3): their only callers die with the dqp zone. *(Brief discrepancy, recorded: the ratification text located `getTopMeals` at illness.js:~1990-2013; that anchor is `getMealSlotTopFoods` — `getTopMeals` lives at diet.js:6851. Both are the same raw-legacy-read class; both are covered.)*
3. **Adjacent folds — Q2 RESOLVED: FOLD into F-6a.** `_qlComputeMealWindow` raw `day[meal].trim()` (quicklog:938) counts the `'—skipped—'` sentinel as slot signal, skewing the adaptive windows that now pick **which of four mounted composers shows the prefill** (Ceres); `_qlFeedInsight` raw reads (quicklog:1555, :1570-1571) feed the shared save toast. Both move onto `_fdReadDayMeal` in F-6a. **The TSF raw-reader class is REGISTERED for F-5, not folded** (Q2/V-V-220): `_tsfIsMealLogged` sentinel-as-logged + `_tsfInferMealTime` `_time` raw reads are load-bearing chronology — they get their own QA round and do not ride this refactor.

---

## §F-6b — Voice-to-text V-1 (separate fast-follow PR — decision 7)

**Scope (V-1 = names only):** Web Speech API (`window.SpeechRecognition || window.webkitSpeechRecognition`), `lang: 'en-IN'`. Feature-detect; **hide the mic entirely when unsupported** (no stub — the reserved `fcVoiceStart` slot stays `.fc-hidden`).

**Pipeline:** speech → transcript → tokenize on connectors (`"and"`, `"with"`, `"aur"`, commas) → per-token `_fdSearchNutrition` match → matched tokens appear as **CHIPS FOR CONFIRMATION** in the composer — **voice never auto-saves** (allergen-log integrity: a misheard food must never silently enter the reaction-tracking record). Quantities via `_fdResolveQtyDefaults` only (no spoken-quantity parsing in V-1). Unmatched tokens surface as "add as new food?" chips (nutrient-tag parity per Q1 applies on confirm). Confirming a chip routes through `fcAddItem` — from there the normal save semantics of whichever mount apply (card-variant: a confirm is a burst event under §Save/undo).

**Allergen-record bindings (F6-5 a-d — bound):**
- **(a) Provenance:** voice-origin items write `source: 'voice'` — the field exists in the ratified item shape; it is now bound, for reaction-record auditability.
- **(b) Risk-class structural marker:** never-introduced or allergen-bearing voice matches carry the new-food/allergen **structural-channel** marker (rail/border/icon per the Polarity Collision rule) — §Visual refresh #2's chip law extends explicitly to voice chips.
- **(c) Ambiguity rule:** `_fdSearchNutrition` is prefix-then-substring (quicklog:1398-1422) — spoken "egg" surfaces egg AND eggplant. An ambiguous token is **never silently collapsed to a single allergen-bearing chip**; when top matches straddle allergen classes, present both and let the parent choose.
- **(d) Watch-window parity:** the F-2 "New food! Watch for reactions over 3 days" insight (quicklog:1566) fires for voice-introduced foods too.

**First task — on-device verification spike.** Named risk: `SpeechRecognition` flakiness/unavailability in **iOS standalone-PWA** mode. The spike validates start/stop, interim results, `en-IN` accuracy on the household food vocabulary (ragi, suji, khichdi, dal names), and standalone-mode behavior on the actual device before any UI lands. If the spike fails on iOS standalone, V-1 ships Android/desktop-only behind the same feature-detect — honestly, not "broken on iPhone."

**Privacy line (ships in UI copy, one-time note):** speech recognition audio transits the platform vendor's service (Apple/Google) — it is not processed on-page. Stated plainly per the Honesty axis.

**Sprite:** the sheet has no `#zi-mic` symbol today — F-6b adds one (gallery regenerates via `build-icon-reference.mjs`).

---

## §Migration & compat

- **No mass migration** (lazy doctrine, parent spec §3). Both shapes coexist on disk indefinitely.
- **Sidecar continuity:** the composer writes dual-shape via `_fdWriteStructuredMeal`, so every reader keeps working:
  - *Legacy-string readers at `[meal]`* (home Today's Meals, diet stats + combos, intelligence-cards, ISL day-summary, medical fat-context detector — the load-bearing list in the writer doctrine comment, data.js:3648-3658 — **and TSF**, corrected per V-V-220: `_tsfIsMealLogged` reads raw legacy `[meal]`, quicklog:2462-2467; `_tsfInferMealTime` reads the `_time` mirrors, :2444/:2452; streak reads :2966-2968) — keep reading the comma-string/mirrors, unchanged. No behavioral break (the writer is dual-shape), but the classification feeds F-5's reader-retirement queue: **the TSF reader class is queued for F-5 with its own QA round** (Q2).
  - *Sidecar readers* (`_fdReadDayMeal` consumers — the corrected, verified list): the L1-L4 engines (quicklog:1146/:1221/:1337/:1436), `_qlFeedReset` (:1794), and the composer itself. *(The prior draft mis-filed TSF here — amended per V-V-220.)*
- **Edit-path regression closed:** today, editing a FAB-written meal in the Log tab via `saveFeedingDay` drops the sidecar (text-changed branch). Post-F-6a there is **no editor that writes legacy-only** — the composer re-writes the sidecar on every edit. This retires the last large legacy-string producer; remaining legacy-string writes are the skip sentinel (`_fdMarkMealSkipped`, `skipSingleMeal`) and `unskipSingleMeal`'s `''` reset — both intentional and reader-safe. That is why F-5 (`parseFeeding` completion) sequences after F-6 and gets cleaner (decision 8).
- **`derivedAllergens` deferral (F6-10 — registered explicitly):** the sidecar shape still omits `derivedAllergens`, against the parent spec's ratified answer #3 (write-time, cached). Not an F-6 regression — but F-6 is the writer-contract restatement of record, so the deferral is now on it in writing: **`derivedAllergens` is deferred to F-4/F-5** (pair-note Kael).
- **Lexicon hygiene (carry-along):** hard-coded `'—skipped—'` literals at illness.js:2000, home.js:5332 (and the dying R1/R4 sites), quicklog:3847-3853/:3898, diet.js:5328/:5399 — surviving sites switch to the `SKIPPED_MEAL` constant (core.js:3215) as they are touched.

---

## §HR pre-check

| HR | Status | Note |
|----|--------|------|
| HR-1 (no emojis) | action-required | Literal `ⓘ` (template:967) → `zi('info')`. No emoji in spec or code; all glyphs via `zi()`. |
| HR-2 (no inline styles) | action-required | Full purge list in §Visual refresh #4 (brief items + recon additions + **F6-9: `updateMealInsight` display writes, home.js:4963/:4965**). Composer uses `.fc-hidden`, never `style.display`. |
| HR-3 (no inline handlers) | action-required | R6 deletes the last inline `onmousedown` in the feeding flow (diet.js:6700). All composer events via `data-action` — incl. the C1 add-row (Vela HR concurrence: V-V-210 lands as `data-action`, HR-3/HR-6 clean). |
| HR-4 (escHtml at render boundaries) | at-risk → mitigated | Item names, typed text, and F-6b voice transcripts are parent input. Every composer render site escapes (`escHtml`/`escAttr`), mirroring the F-2 renderers (quicklog:1854-1938). **The C1 no-match row echoes typed text back — escaped (V-V-210).** Any reimplemented L4 match-highlighting escapes **per-segment** (the home.js:5250-5254 pattern — Ceres watch item, since `highlightMatch` dies in R5). Voice transcripts are untrusted input — chips escape before render. |
| HR-5 (tokens only) | action-required | rgba borders (:474-477) + feed-flow hexes (:7225/:7272) → domain tokens; registers per §Visual refresh (verified V-V-223). |
| HR-6 (data-action universal) | compliant | `fc*` action set + instance addressing via `data-fc-slot`; C1 add-row and `fcShowSuggestions` disclosure included. |
| HR-7 (zi via innerHTML) | compliant | Composer renderers emit `<svg class="zi"><use …>` strings as today. |
| HR-8 (stubs toast) | compliant | Mic slot is hidden, not stubbed; any visible pre-F-6b affordance must toast via `showQLToast`. |
| HR-9 (post-build QA) | structural | canon-cc-008 chain per PR (§routing). |
| HR-10 (no text-overflow ellipsis) | compliant | dqp's literal `…` truncations (home.js:5393/:5405) die with R1; the composer introduces none. |
| HR-11 (Math.floor currency) | n/a | No currency surface. |
| HR-12 (timezone-safe dates) | compliant | `dateOf` getters return `toDateStr`/`today()` keys; date walking uses explicit y/m/d construction (pattern at quicklog:1174-1175 carries over). Ceres confirmed the write path date-correct — F6-1 was a refresh betrayal, not a date-construction fault; S1 closes it. |

**Charter alignment (CV3-006, three axes):** *Honesty* — prefill and rail chips keep visible provenance (freq ×N, confidence %, "Pediatrician-suggested"); offer-state and committed-state are shape-distinct (V-V-219); voice never auto-saves; the nutrient-tag delta is resolved-KEEP and the dqp cross-slot generality loss is disclosed (F6-11); undo discloses that it reverts burst-scoped introductions (F6-2). *Extensibility* — one composer, N mounts; engines untouched save the bound C4 provenance field; `sourceFlow: 'diet-tab'` activates the reserved telemetry value; the mic slot is a reserved seam. *Warmth* — one-handed, save-on-action with burst undo and a persistent saved cue (no lost whole-day edits, no vanishing confirmation); the Log tab inherits the FAB's 3-tap repeat path; one expanded slot, not eight rails (F6-7/V-V-224); the flash respects feeding-pause cadence (F6-6); registers keep the nursery-journal tone.

---

## §canon-cc-008 routing

**F-6a** (single PR, large):

| File touched | Governor |
|---|---|
| diet.js (composer home, +~700; R6 deletion) | **Ceres — primary** |
| intelligence-quicklog.js (renderer/handler extraction, FAB shell rewiring, skip-toggle class purge, Q2 folds) | **Vela — primary (render)** |
| data.js (**one bound contract touch:** C4 `intakeExplicit` provenance on `_fdWriteStructuredMeal` — F6-3; C7 CURATED_COMBOS nut-form correction pending Kael's AGE_RULES/FOOD_EFFECTS verification — F6-4; `derivedAllergens` deferral registered — F6-10) + intelligence-illness.js (R7, R3, `insertDietFood`/`fillDietMeal` removal) | **Kael — engine** |
| home.js (Mount B glue, R1/R4/R5, `loadFeedingDay` re-target, **F6-1's `initFeeding` reset origin — home.js:4462-4466**) | **Maren — Care** |
| template.html + styles.css | **shared → quadruple-jurisdiction, sequential**, rotation Maren → Ceres → Kael → Vela, first-Governor by heaviest-touched Region (per CLAUDE.md; expected Ceres-first given the composer panel) |

All four Governors are therefore summoned (parallel Mode-1 audits where jurisdictions are disjoint; sequential on the shared files) → Lyra synthesizes → **Cipher Edict V final-pass** → PR ready. `pnpm qa-route` advisory confirms the summon-set; it widens, never narrows, never discharges.

**Spec-round record (2026-06-10):** Ceres and Vela delivered Mode-1 audits on this spec — both approve-with-amendments, all amendments folded into this revision. **Kael and Maren receive their full Mode-1 pass at the F-6a implementation gate**; their spec-round pair-notes are recorded for them here — **Kael:** F6-3 writer contract touch (C4), F6-4 CURATED_COMBOS form verification (C7), F6-10 `derivedAllergens` deferral registration; **Maren:** F6-1 originates in `initFeeding` (home.js, her file) — flagged for her implementation-gate round (S1). Vela's shared-module findings (V-V-212/219/223/224) stand for the quad rotation.

**Region impact (Builder estimate; shared-module touch: YES):** Ceres diet.js 6,960 → ~7,600 (headroom ample post-split); Vela quicklog 5,536 → ~5,300 (net extraction); Maren home.js −~250; Kael illness.js −~90, data.js +~15 (the C4 provenance field + the C7 record line — **no material relief for Kael's 1,847 headroom; the engine layer otherwise stays untouched**); styles.css net +~60.

---

## §Phasing & PR cut (decision 8)

| Phase | Contents | PR |
|---|---|---|
| **F-6a** | Composer extraction + both mounts + suggest-prefill + save-on-action/burst choreography (S1-S7) + Governor-bound clauses C1-C7 + condensed-slot default + L-2 refresh + retirements R1-R8 + L-3 debt incl. Q2 folds + audit-gate update | one PR, large; chain as above |
| **F-6b** | Voice V-1 (spike first, then UI; F6-5 a-d bound) | separate fast-follow PR |
| **F-4** | Patterns sub-tab (parent spec; B-1 pre-req for chem tiles; candidate home for L1 cross-slot generalization, F6-11) | after F-6b |
| **F-5** | `parseFeeding` completion (v3-8) — LAST; F-6a's removal of the last big legacy-string producer is the stated reason this lands cleaner; queue now carries the TSF raw-reader class (Q2/V-V-220) and the `derivedAllergens` fold window (F6-10) | after F-4 |

---

## §Resolved questions (Governor consensus, folded 2026-06-10 — **Architect-RATIFIED 2026-06-10**; Q1 KEEP / Q2 FOLD + REGISTER / Q3 bound as written)

The three §Open questions of v1 are resolved by Governor consensus and bound into the body above; they are restated here for the ratification pass. The eight Architect decisions were not, and are not, relitigated.

1. **Q1 — Nutrient-tag prompt parity: RESOLVED KEEP.** Both Governors concur (Ceres firmly — untagged foods are nutritional dark matter to every adequacy surface: post-save flash, insight pairing, heatmap, iron-gap; Vela conditional on V-V-210, which is now contract clause C1). The prompt hangs off the C1 no-match add-row: fires on commit of an unmatched add, never per keystroke; parity extends to F-6b voice-confirmed adds. *(Bound at: C1, §Retirements delta #1, §F-6b.)*
2. **Q2 — Adjacent L-3 folds: RESOLVED FOLD + REGISTER.** FOLD the two named into F-6a — `_qlComputeMealWindow` (quicklog:938; its sentinel-as-signal skew now picks which of four mounted composers shows the prefill) and `_qlFeedInsight` (:1555/:1570-1571). REGISTER the TSF raw-reader class for F-5 with its own QA round — load-bearing chronology does not ride a refactor. *(Bound at: §L-3 item 3, §Migration & compat, §Phasing F-5 row.)*
3. **Q3 — Burst grain: RESOLVED — 5s stands, bound by the choreography clauses.** Ceres accepted 5s for undo scoping only, conditional on decoupling the flash and adding intent-boundary closes; Vela accepted 5s conditional on undo-at-burst-close, duration ≥ quiet period, slot named, cross-slot close. All conditions are now spec text (S2-S5); Ceres's 10-12s single-timer contingency dissolved with the flash decoupling; the undo toast duration is **8s** (rationale at S4). Without those clauses no period passes (Vela) — they are no longer optional. *(Bound at: §Save/undo S2-S5.)*

---

## Doctrinal references

- Parent: `docs/specs/food-sub-tab-v1.md` (F-1/F-2 ratifications; sidecar architecture; Arc B reconciliation §design note 1 — read via `_fdReadDayMeal`, never raw `entry[meal]`)
- `docs/SESSION_HANDOFF_2026-05-29.md:60-69` (the seven F-2 ratifications; F-2 = FAB-only at :63)
- Spec-round audit record: Ceres (Nutrition) F6-1..F6-11 + Vela (Surfacing) V-V-210..V-V-224, both 2026-06-10, both approve-with-amendments — folded in full into this revision (cc-018)
- `docs/DESIGN_PRINCIPLES.md` §Tint System (two laws; Receded register; food-domain whisper `.dt-*`) + §Food-Domain Colour & the Polarity Collision (safety owns the structural channel)
- `docs/specs/sproutlab-v3-charter.md` CV3-006 (three-axis alignment); CV3-003 (honest empty states — composer empty row keeps "Tap a combo above, or type an item below")
- `split/audit-feed-sheet-wiring-v1.sh` (gate updated in-PR with the three new assertions, §Retirements)
- canon-cc-008 + canon-cc-022 + canon-cc-027 (process floor); HR-1..HR-12

---

— *Lyra, 2026-06-10, F-6 synthesis pass (v1.1). Both spec-round audits folded in full — Ceres F6-1..11, Vela V-V-210..224 — and every amendment lands inside the eight ratified decisions; verified clause-by-clause at the fold, no collision (the closest approach is C4/F6-3, which touches the writer's contract: it amends this body's "engine unchanged" claim and the old routing line, not any Architect decision — `_fdWriteStructuredMeal` remains THE one writer of decision 2; and S3/F6-2 extends decision 2's full-prev-state undo to cover the foods delta — a strengthening of the pattern's intent, not a departure). One thread worth naming after the weave: the two blockers were the same blocker seen from two kitchens — a record a parent can't get INTO (V-V-210) and a record that lands on the wrong DAY (F6-1); both are now contract, and the allergen substrate is guarded at entry, at burst, and at undo. Decision requested: Architect ratification of §Resolved questions 1-3; on ratification, F-6a may open.*
