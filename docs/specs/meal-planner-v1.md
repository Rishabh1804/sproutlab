# Meal Planner v1: plan Ziva's days from the Recipes corpus

**Spec version:** v0.2 (`pending_review` for Governor spec review). v0.1 recorded the Architect's answers; **v0.2 (2026-10-29) reshapes every surface to the cognitive-load floor** (§4.0), accepted by the Architect in full.
**Date:** 2026-10-29
**Author:** Lyra (Mode-1 Province spec authoring)
**Status:** Scoping draft with the Architect's answers recorded (§9). D4 is resolved: **Carina** (Foundation) is seated by #275, so P0 is Carina-primary. **Architect decisions (2026-10-29), the recommended answers:** Q1 plan section atop Recipes; Q2 Monday week start; Q3 warn with stronger allergen wording (not refuse); Q4 derived new foods count toward the 3-day rule; Q5 log a recipe as its ingredients, dish title in `note`; Q7 keep 28 days; Q8 the core.js date helpers fixed app-wide in a separate Carina-primary PR; Q9 Tomorrow's Prep and the Outing Planner fold into the plan in v1.1. **Q6 (the `zi-bag` travel icon) stays open** for the P1a Surface Catalog sign-off.
**Promoted from:** the Architect, 2026-10-29, verbatim:
> "On the recipes, from the list let's have an option to select and make meals for a day or a combo, or a new food. We can organise it as days and mark the days of travel in there as well. Then, we can build our own diet plan with the recipes on the app."

**Decided before drafting (binding, not open):**
1. The plan **syncs between both parents' phones from day one** (Firestore, via `sync.js` `SYNC_KEYS`).
2. P0 (the sync key) therefore **waits on D4**. A new foundation seat takes `core/data/sync/config/start`, and Kael keeps the `intelligence-*` engine.
3. Ziva today: 13.8 months, 6 teeth with no molars. She eats family food and is still breastfed.

**Charter alignment (CV3-006):**
- **Honesty.** A plan is an intention, not a record. Nothing planned ever reaches `feedingData` or `ziva_foods` unless a parent taps to say she ate it.
- **Extensibility.** Slot entries reference recipe ids or free food names. Adding a recipe needs no planner change.
- **Warmth.** The planner is a kitchen-table notebook, not a compliance schedule. There is no adherence scoring, no red "missed" states, and no streaks.

---

## Threads this weaves (pattern identifications)

Each thread names the Region and data path it rides.

- **Plan → log: the one-writer rule.** "She ate this" goes through the F-6 feeding composer's commit path (`_fcCommit` → `window._fdWriteStructuredMeal`, data.js). It gets the same side effects (`_tsfMarkDirty`, `_islMarkDirty('diet')`, `_refreshTodayMedWithFat`) and the same 8-second undo. There is no second writer. *(Ceres, diet.js; the writer stays in data.js.)*
- **Hidden new foods inside recipes.** A recipe can carry an ingredient Ziva has never had. The planner works out which ingredients are new to her from `foods` (`ziva_foods`) at render time, using `_baseFoodName` so a synonym doesn't count as new. The 3-day watch rule runs on these derived new foods as well as on ones the parent marks explicitly. *(Ceres, diet.js reading `foods`.)*
- **The 3-day watch window across days.** `_recipeSafetySummary` already says "introduce one at a time and watch for 3 days" for a single recipe. The planner applies the same rule across the week strip: two new foods within 3 days of each other trigger a warning. *(Ceres, new `_mpNewFoodConflicts`.)*
- **Age gate per planned day, not today.** Age is checked as of the planned date (local-safe; see §3.4). A recipe gated at 15 m stays locked for a day planned before 4 Dec 2026, and opens for days on or after it. The check uses the live `_recipeEffectiveMinAge` → `_fdAgeRule`; the recipe flags, never overrides. *(Ceres.)*
- **Travel day × the Outing Planner × Tomorrow's Prep.** Three surfaces already plan ahead:
  - The Home Outing Planner: `ziva_tomorrow_outing`, home.js, local-only. It picks a `portableMeal`.
  - Tomorrow's Prep: `ziva_tomorrow_planned`, diet.js render on the Home card, local-only.
  - The new planner's travel flag.

  v1 makes the planner the store everything else reads from and leaves the other two surfaces' behaviour unchanged. §6 has the convergence path. *(Maren for Home; Ceres for diet.js.)*
- **Packing note.** On a travel day, each slot shows its recipe's `travel.keeps` and `travel.pack`. The text and the WHO/FSIS citations come from the corpus unchanged, so the planner never re-voices a food-safety time limit. *(Ceres, recipes.js content read-only.)*
- **Combo checker.** A slot holding 2–3 items is a combo. The planner runs the existing "Can I give this?" resolver (`_recipeCorpusMatch`, then `COMBO_RECIPES`), so a planned "ragi + banana" shows the same guidance the Patterns combo bar would. It does not build a second combo engine. *(Ceres.)*

---

## 1. The parent's job and the flows

**The job:** *"On Sunday evening I want to sketch the week. On the day, I want to glance at what's next, and tap once when she's eaten it. When we travel I want to know what packs and how."*

### 1.1 Plan a day
1. Open Diet → Recipes. The **Plan** section sits at the top (§4.1). Today's card opens on **the next meal** (§4.3).
2. Tap a slot line (Breakfast / Lunch / Dinner / Snack). An empty one reads "+ Add lunch"; it opens the slot picker (§4.4).
3. Tap a suggestion. It joins the slot immediately; there is no Save button (HR-9 Act intent). The picker stays open so a second or third item can make a combo. Close it with ×.

### 1.2 Plan a week as a strip of days
- The week strip is 7 day chips, Monday to Sunday, with the current week shown by default. **All 7 fit the width at 360px; the strip never scrolls horizontally**, so it never competes with swipe-between-tabs (one gesture, one result). Week navigation is a pair of ‹ › buttons in the **section header**, not at the strip's ends.
- Each chip shows the weekday initial, the date number and **one fill cue**: a filled ring (every slot planned), a half ring (some planned) or an outline (none). It counts nothing and shows no percentages. A single marker sits under it when the day is a travel day or carries a new food.
- Tapping a chip opens that day's card below the strip.
- **Horizon:** 8 weeks ahead. Days further out are not selectable, which keeps the doc bounded.

### 1.3 Fill a slot from the list, or build a combo
- **From the Recipes list:** every recipe's expanded detail gets an **Add to plan** button (`data-action="mpAddRecipe"`). It opens a small Act sheet: a day row (the 7 days of the strip's week, today preselected), with the slot preselected from `r.slot` and changeable. **Add to plan → pick a day → done is 3 taps or fewer** (§4.0).
- **Combo:** a slot holds 1–3 entries (cap 3). An entry is either `{kind:'recipe', id}` or `{kind:'food', name}`. When a slot has 2 or more entries, the day card shows one combo guidance line from the resolver.
- **Free food:** the picker's typeahead reuses `window._fdSearchNutrition`. It searches NUTRITION, the foods Ziva has been introduced to, and her recent foods.

### 1.4 Plan a new-food introduction
- In the picker, **New food** narrows the typeahead to `getUntriedSuggestions(n)`. That list is already gated by age and diet preference. The chosen entry is stored with `isNew: true`.
- Recipes whose ingredients include foods new to her get a derived **new to Ziva: kiwi** marker. These markers are computed, not stored, so they disappear on their own once the food is introduced.
- **The 3-day rule (enforcement):**

| Situation | Behaviour |
|---|---|
| Recipe or food age-gated past the **planned date** (`_recipeEffectiveMinAge` / `_fdAgeRule`) | **Refuse.** The row shows the existing `recipe-age-badge` (`12m+`) and is not tappable. The picker explains why with the gate's `reason`. |
| Second new food within 3 days of another planned new food, or of a food whose `foods[].date` is in the last 3 days | **Warn, and require a choice.** An Act confirm reads: "Kiwi is a new food on Wed. Give each new food 3 days on its own so you can tell what caused a reaction." The buttons are **Move to Sat** (primary: the first clear day) and **Plan anyway**. Choosing Plan anyway keeps the warning visible on both days. |
| A planned new food that is a **top allergen** (`_fdAllergenNote` non-empty) clashing with any other new food | Same confirm, with stronger copy. Whether to refuse outright is **open question Q3**. |
| Choking-by-form food (`_effHasClass(eff,'choking-by-form')`) | **Never blocked.** The safety lead from `_recipeSafetySummary`, or the food's floor, goes with the entry on the day card. It is never hidden behind a tap (§9.7 safety-first). |

- "Within 3 days" means `|dayIndex(a) − dayIndex(b)| < 3`. Both day indices come from local dates (§3.4). Mon + Wed clash. Mon + Thu is clear.

### 1.5 Mark a day as travel
- The day card has a **Travel day** toggle (`data-action="mpToggleTravel"`). When on, the card takes the peach outing treatment (§4.5).
- **Suggestions narrow** to `r.travel` recipes for that slot, grouped by `RECIPE_TRAVEL_META` (spot → thermos → cool), the same grouping the Recipes "For travel" section uses.
- **Corpus gap:** 10 recipes are tagged for travel (lunch 4, snack 5, breakfast 1, dinner 0). Dinner on a travel day has no travel recipe. The picker shows this, with a calm line under the travel group: "No packed dinner recipes yet. Plan a home meal, or pick a travel lunch." It then lists the full slot list below. This is not a dead end. Ceres may also want to add travel dinners to the corpus (§8 R4).
- **One "Pack for today" list leads the travel day** (lead with the answer: on a trip the question is *what do I pack?*). It merges the `travel.pack` lines of every planned recipe into one checklist, removes duplicates (two flask meals → one "pre-heated flask" line), and states the 2 h / 1 h-above-32 °C rule **once**, with the WHO · USDA FSIS source line. That rule sentence is one shared constant with the Recipes travel section.
- Per-recipe `travel.keeps` detail sits in a **collapsed** `_recipeProw('travel', …)` row on each slot, with a one-line preview ("Hot in a flask" / "Kept cool"). The rule is not repeated inside it (§4.0: no text twice on one screen).

### 1.6 One tap: "she ate this"
- Every filled slot on a **today or past** day shows **She ate this** (`data-action="mpLogSlot"`). Future days don't show it. **One tap logs it**, with the 8-second undo (§4.0).
- The tap expands the slot's entries into feeding items:
  - **Recipe →** its ingredients, minus spices (`_RECIPE_TRACE_RE` spice terms). Ghee and oil are kept, because the fat-context detector (`_refreshTodayMedWithFat`) reads them. Whether a dish should log as a single named item is **open question Q5**.
  - **Free food →** one item.
  - Items carry `{name, qty, unit, nutritionRef}` from the existing qty resolver (`_fdResolveQtyDefaults`).
- **Write path:** a new `_fcCommitItems(dateStr, slot, items, sourceFlow)` is pulled out of `_fcCommit` (diet.js). `_fcCommit` itself calls it, so plan logging and composer logging share every byte of the write and side-effect path. The payload's `sourceFlow` is `'diet-plan'`, and `note` is set to the recipe title(s).
- **Slot already logged:** an Act sheet offers **Add to what's logged** (primary; dedup-by-base per F-6 B4), **Replace**, or **Cancel**.
- **Intake** defaults to "Most" (0.75) with `intakeExplicit:false`, as F-2 ratified. The undo toast reads "Lunch logged from plan" and lasts 8 seconds.
- **New foods are never auto-introduced.** If a logged item is new to Ziva, the toast is followed by a gentle inline offer on the day card: "First time with kiwi? Add it to her foods." That calls the existing `addFood` path with `date = dateStr`. This keeps the allergen-substrate rule from F-6 (F6-1/F6-5): nothing enters `ziva_foods` without the parent's intent.
- After logging, the slot shows a quiet sage check ("Logged 12:40"), read from `_fdReadDayMeal`. The plan entry is left untouched.

### 1.7 Copy a day; clear a day
- Copy and Clear are plain text buttons at the **foot** of the day card, still visible but out of the way of the meals (§4.3).
- **Copy day** (`data-action="mpCopyDay"`) opens an Act sheet with the 7 days of the current week plus "next week, same day". Copying overwrites the target's slots and keeps its travel flag. Each copied entry is re-checked for age gates and the 3-day rule against the target date, and any conflict shows in the confirm before the write.
- **Clear day** (`data-action="mpClearDay"`) asks for confirmation ("Clear Wed's plan?") and writes a tombstone (§3.3). The undo toast lasts 8 seconds.

---

## 2. What v1 is not (out-of-scope register)

- **Adherence scoring.** No "planned vs ate" percentage and no missed-meal states. That would cut against Warmth.
- **Auto-generated weekly plans.** v1 is parent-authored. `_recipeSuggestForZiva` ranks the picker, but it does not fill the week. A "fill my week" option is a v2 candidate.
- **Shopping list from the plan.** v2 candidate; the ingredient data supports it.
- **Home or Today So Far "today's plan" surfacing.** Deferred to v1.1 (§5.3).
- **Notifications or reminders.**
- **Breastfeeding in the plan.** Milk feeds are responsive, not planned. The planner covers the four solid-food slots only.

---

## 3. Data model

### 3.1 Storage key
`KEYS.mealPlan = 'ziva_meal_plan'` (core.js `KEYS`, foundation seat). There are no persisted defaults (an empty `{}` is valid), so the **joining-device seed rule is not triggered**. The key is **not** in `ALWAYS_POPULATED_KEYS`, because clearing every day is a real user action.

### 3.2 Shape
```
ziva_meal_plan = {
  v: 1,
  days: {
    "2026-11-02": {
      travel:   { on: true, ts: 1761890000000 } | undefined,
      slots: {
        breakfast: { items: [ {kind:'recipe', id:'travel-flask-oats-banana'} ], ts: … },
        lunch:     { items: [ {kind:'recipe', id:'toddler-veg-khichdi'},
                              {kind:'food',   name:'kiwi', isNew:true} ], ts: … },
        dinner:    { items: [], ts: … }        // empty + ts = cleared slot (tombstone)
      },
      cleared: 1761890000000 | undefined       // day-level tombstone (Clear day)
    }
  }
}
```
- `ts` is `Date.now()` at the write. It is stored per slot and per travel flag, so the merge is per field (§3.3).
- Recipe entries store **only the id**. Title, slot, travel and safety are resolved live from `window.RECIPES` at render. If an id is no longer in the corpus (a recipe was retired), it renders as "Recipe no longer in the list" with a remove action. It never crashes, and it never quietly vanishes.
- Free-food `name` is user-sourced. It goes through `escHtml` at every render (HR-4) and is capped at 60 characters on write.

### 3.3 Sync and conflicts (two parents, same day)
- `SYNC_KEYS[KEYS.mealPlan] = { collection: 'tracking', model: 'single-doc' }`.
- `SYNC_RENDER_DEPS[KEYS.mealPlan] = { global: 'mealPlan', mergeOnReceive: '_postReceiveMealPlan', renderers: { 'track:diet': ['renderDietRecipes'] } }`. The SYNC_KEYS line and the render-deps line land **in the same commit**, per the PR-ε.0 atomicity note in sync.js.
- **The merge is per field, newest timestamp wins.** It follows the `_postReceiveTeeth` precedent (V-M-116): a whole-document last-write-wins would drop one parent's edit.
  - For each date, for each of `slots.breakfast|lunch|dinner|snack` and `travel`, keep whichever side has the larger `ts`.
  - Parent A editing breakfast and parent B editing dinner on the same day therefore **both survive**. Two edits to the **same slot** resolve to the later one.
  - A day-level `cleared` tombstone wins over any slot whose `ts` is older than it, so a cleared day doesn't come back from the other phone. A slot written after the clear survives.
  - A validator in the `_postReceiveTeeth` style (date key regex `^\d{4}-\d{2}-\d{2}$`, finite `ts`, entry `kind` in the allowed set) drops malformed remote entries.
- **Clock skew:** device clocks can disagree. For a meal plan the cost is low: in the rare same-slot race, the "wrong" parent's edit wins, and both parents can see it. Recorded as R2, accepted.
- Writes go through `save(KEYS.mealPlan, …)`, which already marks the key dirty for sync. The planner never calls Firestore directly.

### 3.4 Dates (HR-12)
- Keys are local `YYYY-MM-DD` strings from `toDateStr(new Date(y, m-1, d))`.
- **Finding:** the existing `_offsetDateStr` / `addDays` / `ageAt(dateStr)` in core.js parse `new Date('YYYY-MM-DD')`, which is **UTC midnight**. In IST that happens to land on the same local day. In any negative-offset timezone, which a travelling family can be in, it lands on the previous day.
- The planner therefore uses its own local-safe helpers:
  - `_mpParse(key)` returns `new Date(y, m-1, d, 12)` (local noon guards against DST edges).
  - `_mpAddDays(key, n)` and `_mpAgeMonthsOn(key)`, the latter calling `ageAt(_mpParse(key))` with a Date, not a string.
- Fixing the core.js helpers themselves is a foundation-seat follow-up, raised as **Q8**.
- The week starts on Monday, computed from the local `getDay()`.

### 3.5 Retention and budget
- **Prune on load and on each write:** drop days older than **28 days** in the past (enough to copy "last week" and look back a month). Drop days more than **8 weeks** ahead (they can't be created anyway).
- **Estimate:** about 0.6 KB per fully planned day. A 12-week window (4 back + 8 ahead) is about 50 KB, well under 2.5% of the v7 "localStorage < 2 MB" assumption that comes due in Dec 2026. That assumption gets measured on a device export regardless (BUGS.md). The single Firestore document stays far below the 1 MiB doc limit.
- Pruning runs on both devices with the same rule, so it converges. Pruned days are deleted outright, with no tombstone, because the other device prunes them too.

---

## 4. Surfaces

All surfaces go through the design floor (`docs/DESIGN_PRINCIPLES.md`) before build. Every exemplar is rendered in the Surface Catalog and signed off first (§4.7).

### 4.0 Cognitive-load acceptance criteria (binding, v0.2)
The design floor's 6-second rule (§11), the half-awake test and the one-gesture rule, turned into pass/fail checks. The project scorecard (roadmap Phase 1a) does not exist yet, so these are the planner's own gate. Vela audits them at P1a on the exemplars and at P1b on the wired build. Cipher checks them at Edict V.

| # | Criterion | Limit |
|---|---|---|
| CL-1 | Plan a meal from a recipe (Add to plan → day → done; slot preset) | ≤ 3 taps |
| CL-2 | Log a planned meal ("She ate this") | 1 tap, plus an 8 s undo |
| CL-3 | Today's card on open | The **next meal** leads. Nothing sits above it except a safety lead. |
| CL-4 | Each slot until tapped | One line: food names, plus the safety lead when there is one, plus one action. |
| CL-5 | Slot picker before scroll or search | ≤ 5 choices |
| CL-6 | Repeated text on one screen | None (the 2 h rule appears once) |
| CL-7 | Controls and disclosure | Every control ≥ 44 px; every collapsed row carries a one-line preview and a chevron |
| CL-8 | Week strip at 360 px | No horizontal scroll; no gesture that competes with tab swiping |
| CL-9 | Decoding load | One fill cue per day (no counts, no percentages); safety in words, never colour alone |

### 4.1 Where it lives: a **Plan section at the top of Diet → Recipes** (recommended)
| Option | For | Against |
|---|---|---|
| **A. Plan section atop Recipes** (recommended) | Matches the ask ("on the recipes, from the list"). The list is one scroll below, and Add to plan sits on every recipe. No new nav level, and no `DIET_SUB_ORDER` + `DIET_INNER_ORDER` double edit (the active drift hazard, plus a core.js touch). | Recipes gets longer. Mitigated by keeping the section compact: strip + one day card. |
| B. Fifth Diet sub-tab "Plan" | Its own room. | Five sub-tabs on a phone bar is crowded. Touches both order literals (core.js = foundation seat), and widens the swipe cascade. |
| C. Browse / Plan toggle inside Recipes | Clean split. | A 4th nesting level of tabbed surface, outside the documented swipe cascade. Hides the list while planning, which breaks "from the list". |

The section header reads "This week's plan", with a `zi('list')` icon in Fraunces (`recipes-sec-label` pattern). It sits above "Suggested for Ziva". On first use it is a single invitation line: "Plan Ziva's meals for the week: tap a day to start." It has no empty grid.

### 4.2 Week strip
- `.mp-strip`: a 7-column grid of `.mp-day` chips (min 44×56, HR-8) that fills the width and **never scrolls** (CL-8). The week ‹ › buttons live in the section header (`zi('arrow-right')`, one rotated with a class).
- Chip contents, top to bottom:
  - weekday initial (Nunito `--fs-xs`)
  - date (Fraunces `--fs-md`)
  - **one fill ring** (`.mp-fill` + `--full` / `--part` / `--none`: sage ring, sage half ring, `--light` outline). No dots, no counts (CL-9).
  - one marker, only when needed: a travel icon (peach) or a new-food icon (`zi('sprout')`, lavender)
- Today gets a sage outline. The selected day gets a filled `--sage-light` background plus a border (tint law 2: never a bare fill). Past days are muted to `--mid` text but stay fully tappable.

### 4.3 Day card
- `.mp-daycard` is a cream card with a domain stripe: sage normally, peach on a travel day.
- **Header:** "Wednesday, 4 Nov" (via a named date formatter, HR-10) and the Travel day toggle. Nothing else.
- **Lead (CL-3):** on today's card, the **next meal** by time of day (the existing `detectMealType` slot, or the next unlogged one after it) opens first, styled as the card's lead: "Next: Lunch — Toddler Veg Khichdi", its safety lead if any, and **She ate this**. On a travel day the **Pack for today** list (§1.5) sits directly under the header, above the lead. On other days no slot leads; all four are one-liners.
- **Four `.mp-slot` rows, one line each until tapped (CL-4):** the `RECIPE_SLOT_META` icon, the label, and the planned food names in words ("Ragi pancakes + pear"), with a new-to-Ziva lavender tag where one applies. Two things stay visible even when the row is collapsed: the safety lead (`.rcp-safe--{level}`, flag or caution, §9.7 safety-first) and the one action (She ate this, the logged check, or "+ Add lunch" for an empty slot).
- **Tap a slot to open it:** the pills (removable), then two collapsed `rcp-prow` rows with previews: **Combo guidance** ("Good pair — iron with vitamin C") when there are 2+ entries, and **Packing** ("Hot in a flask") on travel days. Nothing else opens by default.
- **Foot:** Copy day · Clear day as plain text buttons (CL-7), below the slots.
- **The half-awake test:** at 2 AM, a parent sees the next meal and one obvious button first, what each other slot holds in one line, and whether anything needs care, in words. There are no percentages, no dense grids, and no text repeated on the screen (CL-6). Text wraps freely (HR-10, no ellipsis).

### 4.4 Slot picker
- A bottom sheet (`.ql-sheet` family, Flow/Act). Taps add immediately, there is no Save button, and the round trip stays under 30 seconds (HR-9).
- **Order (CL-5):** the current combo entries (removable, when any) → a **search box** (recipes and foods together, via `window._fdSearchNutrition` plus the corpus) → **the top 5 suggestions for this slot**, ranked by `_recipeSuggestForZiva` → one row **"All lunch recipes (18)"** that expands the full list → one row **"Plan a new food"** that switches the list to `getUntriedSuggestions(n)` (§1.4). There is no three-way segmented filter.
- Suggestion and list rows reuse the row markup in a compact variant `_recipeRowHtml(r, 'p', age, {compact:true, planDate})`: icon, title and age badge, with no expand-in-place inside the sheet. Rows age-locked for the planned date are rendered but disabled, with the gate's reason one tap away.
- On a travel day the top suggestions come from the travel recipes for the slot, then the gap note (§1.5) when there are none, then "All … recipes".
- The household gate `_recipeAllowedForHousehold` applies (Pass A). Recipes it withholds are not offered.

### 4.5 Travel-day treatment (peach = outing domain)
- The day card stripe is `--peach`, the header wash is `--peach-light` with a `--peach` left border, and header text is `--tc-peach` (#9a5f30, defined v1.4). The dark theme takes the deep-hue swap (tint law 1).
- A new travel icon is needed (**Q6**): `zi-bag` (packed bag) is proposed. The sprite currently has no bag, calendar or vehicle glyph. `zi('timer')` stays as the packing-row icon, matching the recipe detail.

### 4.6 CSS: reuse and new
**Reused:** `.recipe-chip`, `.fdom-chip--*`, `.rcp-safe--*`, `.rcp-prow--travel`, `.recipe-age-badge`, `.recipe-group-head`, `.recipes-sec-label`, `.recipes-sub-note`, `.rcp-serving-src`, `.ql-sheet` family, `.chip[data-chip="single"]`, `.icon-peach`.

**New (all tokens, light and dark):**
- `.mp-section`, `.mp-strip`, `.mp-day` (+ `--today`, `--sel`, `--past`, `--travel`), `.mp-fill` (+ `--full`, `--part`, `--none`)
- `.mp-daycard` (+ `--travel`), `.mp-dayhead`, `.mp-lead`, `.mp-slot` (+ `--open`), `.mp-slot-empty`, `.mp-entry-new`, `.mp-dayfoot`
- `.mp-pack` (the Pack for today list), `.mp-ate-btn`, `.mp-logged`, `.mp-gap-note`, `.mp-picker-row--locked`, `.mp-picker-more`

Estimate: about 90–120 CSS lines. **Template:** one `zi-bag` symbol, plus a `#dietPlanRoot` mount inside `#diet-sub-recipes` above `#dietRecipesRoot`. **Both files are shared, so the core trio (Maren → Ceres → Vela, Ceres first) reviews them; the new `zi-bag` symbol also brings in Carina, and the `#dietPlanRoot` id brings in each Governor whose files reference it.**

### 4.7 Surface Catalog exemplars (in `split/build-surface-catalog.mjs` before any feature wiring)
1. Week strip at 360 px: a mixed week (today, selected, past, travel, new-food; full, part and empty fill rings), with no horizontal scroll.
2. Today's card: the **next-meal lead** (with She ate this), one slot with a caution safety lead, one combo slot collapsed to one line, one empty slot.
3. Day card, travel: the **Pack for today** list (merged, the 2 h rule once), a thermos lunch and a cool snack collapsed to one line each, the dinner gap note, and the peach treatment.
3b. The same travel card with the lunch slot **opened**: pills, then the collapsed Combo and Packing rows with previews.
4. Day card, past day: one slot logged (sage check), one with She ate this.
5. Slot picker: search box, **top 5** suggestions (one locked 15m+ on a December date, one new-to-Ziva tag), "All lunch recipes (18)", "Plan a new food".
6. New-food conflict confirm (Move to Sat / Plan anyway).
7. Section first-use empty state.

Each is shown light and dark at all three zoom tiers, and each is checked against CL-1…CL-9 (§4.0). **Architect sign-off gates P1 wiring.**

---

## 5. Jurisdiction and QA routing

### 5.1 Region declaration
| Region | Files | Est. LOC | Notes |
|---|---|---|---|
| Foundation (Carina) | core.js (`KEYS.mealPlan`, load into the `mealPlan` global), sync.js (SYNC_KEYS + SYNC_RENDER_DEPS + `_postReceiveMealPlan`) | ~70 | Carina's Region has ≈12.9K headroom after D4. Edits to KEYS / SYNC_KEYS / SYNC_RENDER_DEPS bring in reference consults (qa-route); `save/load(KEYS.mealPlan)` lines in diet.js bring Carina in on write-path integrity. |
| Nutrition (Ceres) | diet.js (`_mp*` planner, picker, conflicts, `_fcCommitItems` extraction, Add to plan on the recipe detail) | ~650–800 | diet.js ≈7.9K. Nutrition has ≈20.5K headroom. |
| Shared (core trio) | styles.css (~110), template.html (~10) | ~120 | Option C: Maren → Ceres → Vela, with Ceres first (heaviest-touched). A new `zi-bag` sprite symbol means **Carina joins**; a new `#dietPlanRoot` id brings in each Governor whose files reference it (template DOM contract). |
| Care / Surfacing | none in v1 | 0 | §5.3 |
| recipes.js | none (read-only) | 0 | Travel-dinner additions would be a separate Ceres corpus PR (R4). |

**Shared-module touch: yes.**

### 5.2 HR pre-check
| HR | Status | Note |
|---|---|---|
| HR-1 | at-risk | No emojis. Travel needs a new `zi-bag` symbol. |
| HR-2 | action-required | No inline styles in new code. The existing recipe rows carry `style="--zif-c…"` / fingerprint vars. The compact picker row must not copy them in; use classes, or the established CSS-custom-property pivot pattern documented in DESIGN_PRINCIPLES. |
| HR-3 / HR-6 | compliant | Every control is `data-action` (`mpOpenPicker`, `mpAddRecipe`, `mpPick`, `mpRemoveEntry`, `mpToggleTravel`, `mpLogSlot`, `mpCopyDay`, `mpClearDay`, `mpWeekPrev/Next`, `mpSelectDay`). |
| HR-4 | at-risk | Free-food names and recipe titles are escaped at render. |
| HR-5 | compliant | Tokens only. |
| HR-7 | compliant | `zi()` via innerHTML. |
| HR-8 | n/a | No stubs. A future "Fill my week" must not ship as a dead button. |
| HR-9 | action-required | QA chain per §6. |
| HR-10 | compliant | Wrapping text everywhere, including the strip chip labels. |
| HR-11 | n/a | |
| HR-12 | action-required | §3.4 local-safe helpers. The core.js UTC-parse finding is raised to the foundation seat. |

### 5.3 Home and Today So Far ("today's plan"): **defer to v1.1** (recommended)
A "Today's plan" line on Home or in Today So Far is the natural next thread. It would also let Tomorrow's Prep read the plan instead of `ziva_tomorrow_planned`. But it would pull Maren (home.js) and Vela (quicklog) into P1–P2 and widen the summon-set before the core planner has proven itself. v1.1 scope: Maren + Vela, and the convergence in §6 step 3.

---

## 6. Phasing into PRs

| PR | Scope | Region | Governor summon-set (canon-cc-008) |
|---|---|---|---|
| **P0: data + sync key** *(after D4)* | `KEYS.mealPlan`, the global load in core.js, SYNC_KEYS + SYNC_RENDER_DEPS (one commit), `_postReceiveMealPlan` + validator, the prune rule, local-safe date helpers if they land as foundation primitives. e2e: two-device merge (different slots both survive, clear-day tombstone holds, malformed remote dropped). | Foundation | **Foundation-seat Governor** (post-D4 name), plus **Kael** if `qa-route` shows ripple into the engine. Then Cipher. |
| **P1a: Surface Catalog exemplars** | §4.7 exemplars + the new CSS + `zi-bag` + the `#dietPlanRoot` mount. No behaviour. | Shared | **Core trio, Ceres first: Ceres → Maren → Vela**, plus **Carina** (new `zi-bag` sprite symbol) and any Governor the template DOM contract names for `#dietPlanRoot`. Vela checks CL-1…CL-9 on the exemplars. Then Cipher. **Architect sign-off.** |
| **P1b: planner UI** | Plan section, strip, day card, picker, Add to plan, travel toggle + narrowing + packing rows, copy/clear, age-gate refusal, combo line. e2e: plan, combo, travel narrowing (incl. the dinner gap), copy/clear, locked row on a future date. | Nutrition (+ shared CSS fixes) | **Ceres**, plus **Vela** as a consult on CL-1…CL-9 in the wired build. The core trio again if styles/template change. Then Cipher. |
| **P2: new-food scheduling + log-from-plan** | `isNew` entries, derived new-to-Ziva markers, `_mpNewFoodConflicts` + the confirm, `_fcCommitItems` extraction (behaviour-neutral for the composer, proved by the existing F-6 e2e), She ate this + Replace/Add sheet + the introduce-offer. e2e: 3-day conflict, recipe ingredient → feedingData sidecar with `sourceFlow:'diet-plan'`, undo, no auto-write to `ziva_foods`. | Nutrition | **Ceres.** Add **Kael** for the data-flow consult (writer + `_islMarkDirty` consumer); qa-route will widen this through the `calls` edges. Then Cipher. |
| **v1.1: today's plan surfacing + convergence** | Home / Today So Far line. Tomorrow's Prep reads the plan, and `ziva_tomorrow_planned` retires via a migration. The Outing Planner offers "mark tomorrow as a travel day". | Care + Surfacing + Nutrition | **Maren + Vela + Ceres** (+ shared if CSS changes). Then Cipher. |

Every PR stays draft until its chain completes. `/code-review` does not discharge the gate.

---

## 7. Spec-iteration state (SPEC_ITERATION_PROCESS)
- **Done:** Pass 1 (scope from the verbatim ask), Pass 2 (code grounding across recipes/diet/sync/core/home), Pass 3 (cross-Region threads, which surfaced the Outing Planner + Tomorrow's Prep overlap, the UTC date-parse hazard, and the travel-dinner gap).
- **Done (v0.1–v0.2):** Architect answers (§9); the cognitive-load pass (§4.0, accepted 2026-10-29).
- **Remaining:** Ceres spec-round audit (food safety, the 3-day rule semantics, dish-vs-ingredients logging) → Vela consult on surfaces (CL-1…CL-9 and the half-awake test) → Carina review of §3 (the record and its sync merge) → v1 ratification.

## 8. Risks
- **R1. The plan reads as a schedule and nags.** Warmth drifts clinical under feature gravity. Mitigation: no adherence states, past days muted rather than red, invitation copy.
- **R2. Same-slot race on clock skew.** Accepted (§3.3). It's visible and easy to fix on either phone.
- **R3. A second write path creeps in.** Mitigation: the `_fcCommitItems` extraction, plus an audit-gate assertion (extend `audit-feed-sheet-wiring-v1.sh`) that `_fdWriteStructuredMeal(` is called only from the composer commit.
- **R4. The travel corpus is thin** (0 dinner, 1 breakfast). The narrowing falls back gracefully. A Ceres corpus PR adding travel dinners and breakfasts is recommended in parallel.
- **R5. Logging recipe ingredients changes how Today's Meals reads.** The legacy string becomes "rice, moong dal, carrot…" rather than "Toddler Veg Khichdi" (Q5).
- **R6. The D4 dependency stalls P0.** P1a (exemplars) can proceed before D4. P1b needs P0's global. A local-only interim is ruled out by Decided-1.
- **R7. Three surfaces plan ahead until v1.1 converges them** (Outing, Tomorrow's Prep, Planner). Until then a parent could plan tomorrow in two places. Mitigation: v1.1 is sequenced immediately after P2.

## 9. Open questions for the Architect (answered 2026-10-29 except Q6; see the header)
1. **Placement.** Plan section atop Recipes (recommended), a fifth sub-tab, or a toggle?
2. **Week start.** Monday (recommended) or Sunday?
3. **Allergen clash.** When two new foods fall within 3 days and one is a top allergen, should the planner **refuse** (stricter), or warn with "Plan anyway" as it does for other foods (recommended: warn, stronger copy)?
4. **Derived new foods.** Should a recipe whose ingredient is new to her count toward the 3-day rule automatically (recommended: yes), or only explicit "New food" entries?
5. **Logging a recipe.** Log as its ingredients (recommended for v1, because nutrition, the allergen ladder and fat context read ingredient names, with the dish title in `note`), or as one named dish item (needs reader changes across Care/Surfacing)?
6. **Travel icon.** Approve a new `zi-bag` sprite symbol, or reuse an existing glyph?
7. **Retention.** Keep 28 days of past plans (recommended), or longer for a future "planned vs ate" view?
8. **The core.js date helpers.** Ask the foundation seat to make `_offsetDateStr` / `addDays` / `ageAt(string)` local-safe app-wide (recommended, as a separate PR), or keep the fix planner-local?
9. **v1.1 convergence.** Should Tomorrow's Prep and the Outing Planner fold into the plan (recommended), or stay independent?
