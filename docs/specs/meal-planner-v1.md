# Meal Planner v1: plan Ziva's days from the Recipes corpus

**Spec version:** v0.4 (`pending_review`; all spec-round positions folded). v0.1 recorded the Architect's answers; v0.2 reshaped every surface to the cognitive-load floor (§4.0), accepted by the Architect in full; **v0.3 (2026-10-29) folds the spec-round positions of Vela (V-V-275-1…20) and Ceres (V-C-275-1…18)**; **v0.4 folds Carina's position on §3 (V-CA-275-1…12)**. §10 lists every amendment; where §10 and earlier text disagree, §10 wins.
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
- **One "Pack for today" list leads the travel day** (lead with the answer: on a trip the question is *what do I pack?*). It merges the `travel.pack` lines of every planned recipe into one plain list (no tick boxes; §3.2 stores no tick state), de-duplicated by **exact string only**. Each flask meal needs **its own** full flask, so two flask meals read "2 food flasks, one per meal" (V-C-275-7). An always-visible **How it keeps** block under the list shows each distinct `travel.keeps` string once, so the flask discard rule and the ice-pack rule are never hidden; the shared 2 h / 1 h-above-32 °C rule constant appears only when no planned keeps string already states it (V-C-275-8). That rule sentence is one shared constant with the Recipes travel section.
- The per-slot `_recipeProw('travel', …)` row is collapsed by default (its preview names the mode); the keeping rules themselves are already visible in How it keeps above. A non-travel recipe or free food on a travel day shows "Not a packing recipe — serve it fresh where you are" instead (V-C-275-17).
- **Lifecycle (V-V-275-10):** the pack list leads until the day's first slot is logged, then collapses to a row previewed "Packed: 4 things". How it keeps stays visible all day. On a selected future day the label is "Pack for Sat".

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
- `SYNC_KEYS[KEYS.mealPlan] = { collection: 'plan', model: 'single-doc' }`: **its own document** at `/singles/plan`, not inside `tracking` (V-CA-275-1, §10.4).
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
  - `_parseLocalDate(key)` (a new core.js primitive landed in P0, V-CA-275-10) returns local noon for a bare `YYYY-MM-DD` (noon guards against DST edges). The planner uses it rather than a planner-local `_mpParse`, so the two can never drift.
  - `_mpAddDays(key, n)` and `_mpAgeMonthsOn(key)`, the latter calling `ageAt(_mpParse(key))` with a Date, not a string.
- Fixing the core.js helpers themselves is a foundation-seat follow-up, raised as **Q8**.
- The week starts on Monday, computed from the local `getDay()`.

### 3.5 Retention and budget
- **Prune on load and on each write, aligned with navigation (V-CA-275-8):** keep from the Monday of the week 4 weeks back to the Sunday of week +8; writes outside that window are refused in words. The prune also runs inside the merge, so a union can't bring a pruned day back.
- **Estimate:** about 0.6 KB per fully planned day. A 12-week window (4 back + 8 ahead) is about 50 KB, well under 2.5% of the v7 "localStorage < 2 MB" assumption that comes due in Dec 2026. That assumption gets measured on a device export regardless (BUGS.md). The single Firestore document stays far below the 1 MiB doc limit.
- Pruning runs on both devices with the same rule, so it converges. Pruned days are deleted outright, with no tombstone, because the other device prunes them too.

---

## 4. Surfaces

All surfaces go through the design floor (`docs/DESIGN_PRINCIPLES.md`) before build. Every exemplar is rendered in the Surface Catalog and signed off first (§4.7).

### 4.0 Cognitive-load acceptance criteria (binding, v0.2)
The design floor's 6-second rule (§11), the half-awake test and the one-gesture rule, turned into pass/fail checks. The project scorecard (roadmap Phase 1a) does not exist yet, so these are the planner's own gate. Vela audits them at P1a on the exemplars and at P1b on the wired build. Cipher checks them at Edict V.

| # | Criterion | Limit |
|---|---|---|
| CL-1 | Plan a meal from a recipe (Add to plan → day → done; slot preset; the day row is the **next 7 days** from today, V-V-275-16) | ≤ 3 taps |
| CL-2 | Log a planned meal ("She ate this") on a clear entry | 1 tap, plus an 8 s undo. An entry whose lead is a flag opens the consequence card first (V-C-275-13). |
| CL-3 | Today's card on open | The **next meal** leads, by the §10 rule table (V-V-275-2). Nothing sits above it except a safety lead, or, on a travel day only, the Pack for today block (the travel day's answer). |
| CL-4 | Each slot until tapped | One **row of content** (wrapping is allowed at any zoom, HR-10): food names, the safety lead and chew cue when present, and one action. The lead slot is the promoted row, never repeated below (V-V-275-1). |
| CL-5 | Slot picker before scroll or search | ≤ 5 choices, all pickable on that date (locked rows never take a top-5 place, V-V-275-15), at every zoom tier |
| CL-6 | Repeated text on one **screen**, where a screen is the whole tab or sheet, not the viewport | None. The 2 h rule appears once per tab (V-V-275-9); an established allergen does not repeat a watch line on every slot (V-C-275-10). |
| CL-7 | Controls and disclosure | ≥ 44 × 44 px everywhere except the strip chips: ≥ 40 px wide × ≥ 56 px tall (above the HR-8 36 px floor, V-V-275-4). Every collapsed row carries a one-line preview and a chevron. |
| CL-8 | Week strip at 360 px and 320 px | No horizontal scroll; no gesture that competes with tab swiping; every planner overlay matches the `handleSwipe` overlay guard (V-V-275-19) |
| CL-9 | Decoding load | One neutral fill cue per day (no counts, no percentages, never the sage "good" hue, V-V-275-5); safety and state in words, never colour alone (V-V-275-12, -13) |
| CL-10 | Write chronology | "She ate this" never stamps the tap time onto a past date or far outside the slot window (V-V-275-3) |
| CL-11 | Section stack | At 360 × 740, default zoom, a non-travel today card with slots collapsed: the Plan section is ≤ one viewport, and the top of "Suggested for Ziva" stays reachable without hunting (V-V-275-8) |
| CL-12 | Themes, greyscale, zoom | Every state above holds in light and dark, in greyscale, and at all three zoom tiers |

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
  - **one fill disc** (`.mp-fill` + `--full` / `--part` / `--none`: solid disc, half disc, outline circle) in neutral ink (`--mid`), never sage. "Full" means breakfast + lunch + dinner planned; snack is optional. Past days render it muted, so a plan never reads as a record. Each chip has an `aria-label` ("Wed 4 Nov, all meals planned"). No dots, no counts (CL-9, V-V-275-5).
  - one marker, only when needed: a travel icon (peach) or a new-food icon (`zi('sprout')`, lavender)
- **Today:** the date numeral in bold `--tc-sage` with a short bar under it; no outline. **Selected:** `--sage-light` fill plus border (tint law 2). Each cue must survive alone in greyscale (V-V-275-6). Past days are muted to `--mid` text but stay fully tappable.
- **Markers (V-V-275-7):** at most one glyph. New food wins (safety-relevant, an icon other than `zi('sprout')`); a travel day is then carried by the chip's peach border.

### 4.3 Day card
- `.mp-daycard` is a cream card with a domain stripe: sage normally, peach on a travel day.
- **Header:** "Wednesday, 4 Nov" (via a named date formatter, HR-10) and the Travel day toggle. Nothing else.
- **Lead (CL-3):** on today's card, the **next meal** by the §10 rule table (`_mpNextSlot`, never raw `detectMealType`, V-V-275-2) opens first, as the promoted row (the remaining slots render below it, without repeating it), styled as the card's lead: "Next: Lunch — Toddler Veg Khichdi", its safety lead if any, and **She ate this**. On a travel day the **Pack for today** list (§1.5) sits directly under the header, above the lead. On other days no slot leads; all four are one-liners.
- **Four `.mp-slot` rows, one line each until tapped (CL-4):** the `RECIPE_SLOT_META` icon, the label, and the planned food names in words ("Ragi pancakes + pear"), with a new-to-Ziva lavender tag where one applies. Two things stay visible even when the row is collapsed: the safety lead (`.rcp-safe--{level}`, flag or caution, §9.7 safety-first) and the one action (She ate this, the logged check, or "+ Add lunch" for an empty slot).
- **Tap a slot to open it:** the pills (removable); the **Make it safe to chew** row **open by default** whenever `r.choking` is non-empty (V-C-275-9, matching V-C-270-3); then collapsed rows with previews: **Combo guidance** (positive or neutral pairing notes only; a combo caution or flag becomes the slot's visible safety lead, V-V-275-14) and **Packing** on travel days.
- **Foot:** Copy day · Clear day as plain text buttons (CL-7), below the slots.
- **The half-awake test:** at 2 AM, a parent sees the next meal and one obvious button first, what each other slot holds in one line, and whether anything needs care, in words. There are no percentages, no dense grids, and no text repeated on the screen (CL-6). Text wraps freely (HR-10, no ellipsis).

### 4.4 Slot picker
- A bottom sheet (`.ql-sheet` family, Flow/Act). Taps add immediately, there is no Save button, and the round trip stays under 30 seconds (HR-9).
- **Order (CL-5):** the current combo entries (removable, when any) → a **search box** (recipes and foods together, via `window._fdSearchNutrition` plus the corpus; no match offers "Add 'xyz' as a food") → **the top 5 pickable suggestions for this slot**, ranked by `_recipeSuggestForZiva` plus a day-aware boost for the group the day lacks (iron first, V-C-275-16) → one row **"All lunch recipes (18)"** that expands the full list → one row **"Plan a new food"** that switches the list to `getUntriedSuggestions(n)` (§1.4). There is no three-way segmented filter.
- Suggestion and list rows reuse the row markup in a compact variant `_recipeRowHtml(r, 'p', age, {compact:true, planDate})`: icon, title and age badge, with no expand-in-place inside the sheet. Rows age-locked for the planned date never appear in the top 5. In the "All" list they show their reason inline in words ("From 15 months · opens 4 Dec") with the age badge, and cannot be added (V-V-275-15, resolving the §1.4 / §4.4 contradiction).
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
1. **Week strip** at 360 px and 320 px, default and large zoom, light, dark and greyscale: today+selected+full; past+full (muted); a chip carrying the new-food marker on a travel day; a 3-meal day (no snack) rendering as full.
2. **Today's card at three clocks:** 02:00 → "Next: Breakfast"; 12:00 → "Next: Lunch"; 23:30 → no lead (or the quiet "Tomorrow:" line). The lead slot does not repeat below. Include one recipe at level `safe` carrying a chew cue ("Make it safe to chew: 2 steps"), one free food with a form lead (grapes: "quarter lengthways"), and one combo slot collapsed to one line.
2b. **Safety stacking:** a slot carrying a promoted combo caution and a new top-allergen food, shown in the amber safety channel in words (not lavender); an established allergen shows no repeated watch line.
2c. **The day hint:** 3 slots planned, none iron-rich: "No iron-rich food planned today. Ragi, dal, egg or greens would add some."
3. **Travel day:** Pack for today (two flask meals → "2 food flasks, one per meal"), the always-visible How it keeps block, a thermos lunch and a cool snack collapsed to one line each with chew cues, the dinner gap copy ("The travel lunches work for dinner too"), a vegetable pill and a breakfast row on the peach card (light and dark), and "Travel day" in words. The page context shows the "For travel" section's rule collapsed to a teaser (one 2 h statement per tab).
3b. **The same travel card, lunch opened:** pills, Make it safe to chew open, collapsed Combo and Packing rows.
3c. **After the first log:** the pack list collapsed to "Packed: 4 things"; How it keeps still visible.
4. **Past day:** one slot "Logged · around 1 pm" (slot-centre stamp, not the tap time), one with She ate this.
5. **Slot picker at large zoom:** search box, five pickable suggestions visible without scrolling inside the sheet, "All lunch recipes (18)" expanded to show a locked row with its inline reason, "Plan a new food", and a no-match search state.
6. **New-food conflict confirm** (Move to Sat / Plan anyway).
6b. **Top-allergen confirm** with the V-C-275-3 copy and its NHS source line.
7. **Empty states:** first use with the one-time fill legend; an empty non-first-use day; the horizon-clamped ›; a pruned week (plans older than 4 weeks are cleared); fewer than 5 suggestions for a new user.
8. **Header on next week:** "Week of 9 Nov" plus the "This week" button.
9. **Section stack:** the Plan section at 360 × 740 with the top of "Suggested for Ziva" in reach (CL-11).

Each is shown light and dark at all three zoom tiers, and each is checked against CL-1…CL-12 (§4.0). **Architect sign-off gates P1 wiring.**

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

---

## 10. Spec-round amendments (v0.3, 2026-10-29)

Positions: **Vela** (Mode 2, support-with-amendments, V-V-275-1…20) and **Ceres** (Mode 2, support-with-amendments, V-C-275-1…18). Lyra synthesis below; all are adopted. **Reconciliation:** Vela's pack-list lifecycle (-10) and Ceres's always-visible keeping rules (-8) are both kept. The pack list collapses after the first log; How it keeps never does.

### 10.1 Surfaces and cognitive load (Vela)
- **V-V-275-1** The lead is the next slot's row promoted, not a fifth element.
- **V-V-275-2** `_mpNextSlot(dateKey, now)` rule table, wrapping (never calling raw) `detectMealType` / `_qlComputeMealWindow`:

| Situation | Lead |
|---|---|
| Order | breakfast → lunch → dinner; snack only if planned; logged slots skipped |
| Before the breakfast window (incl. 00:00–07:00) | Breakfast (never "Snack" from the fall-through) |
| After the dinner window, or all planned slots logged | No lead. Optionally one quiet line "Tomorrow: Breakfast — X" if tomorrow is planned. Never a "done" or adherence phrase. |
| The next slot is unplanned | "Next: Lunch — + Add lunch" |
| Staleness | Recompute on render and on `visibilitychange` |

- **V-V-275-3** Write chronology (CL-10). Today: stamp now, unless now is past the slot window's end, in which case stamp the window centre and show "Logged" or "around 1 pm". Past days: always the slot-window centre. Pair-notes: Ceres (writer), Kael (adaptive-window consumer).
- **V-V-275-4** Strip geometry: `1fr` columns, `--sp-2` gap, strip outside any padded card, chips ≥ 40 × 56 px (CL-7).
- **V-V-275-5** Neutral fill disc; "full" = three meals; muted on past days; `aria-label`; one-time legend at first use.
- **V-V-275-6** Today vs selected de-stacked (bold numeral + bar vs fill + border); greyscale-safe.
- **V-V-275-7** One marker per chip; new food wins; travel then rides the chip border.
- **V-V-275-8** Section stack (CL-11). The Plan section sits under the "Recipes" h1; no lead on non-today days; Suggested → For travel → Browse keep their order; nothing new above Suggested without a CL review.
- **V-V-275-9** When the selected day is a travel day, the "For travel" `recipes-sub-note` (diet.js) collapses to a teaser row ("How long packed food keeps · WHO · USDA FSIS"). Both read one shared constant.
- **V-V-275-10** Pack list lifecycle (§1.5): plain list, collapses after the first log, "Pack for Sat" on future days. Ticks need a §3.2 field first (not in v1).
- **V-V-275-11** Slot colour quarantine: planner slots never inherit `.meal-card.{breakfast|lunch|dinner|snack}` tints. Icon plus word only (§4.6 non-reuse).
- **V-V-275-12** The new-food tag reads "New to Ziva: kiwi", `--tc-lav` text on an outlined tag (shape-distinct from `.fdom-chip`), not `zi('sprout')`. A new top allergen or a 3-day conflict rides the amber safety channel in words.
- **V-V-275-13** Travel in words: "Travel day" header text and "Travel day: on". Peach on stripe, wash and left border only.
- **V-V-275-14** A combo caution or flag is promoted to the slot's visible safety lead.
- **V-V-275-15** Locked rows out of the top 5; inline reason in the All list; no tap needed to explain.
- **V-V-275-16** The Add to plan day row is the next 7 days from today, with › within the 8-week horizon; past days are not offered.
- **V-V-275-17** Header reads "This week's plan" only on the current week, otherwise "Week of 9 Nov" plus a "This week" button; ‹ › clamp at 4 weeks back / 8 ahead with a one-line reason.
- **V-V-275-18** Empty-state copy: no-match search → "Add 'xyz' as a food"; fewer than 5 suggestions → reuse "Keep logging meals…"; a pruned week says plans older than 4 weeks are cleared; an all-locked slot and a slot at its cap of 3 say so in words.
- **V-V-275-19** Every planner overlay matches the `handleSwipe` overlay guard (`.ql-sheet.open` / `.confirm-overlay`). A swipe on the strip falls through to tab navigation by design; no week-swipe.
- **V-V-275-20** Register the `mp-*` prefix in DESIGN_PRINCIPLES §4 before code (distinct from home.js `tp-*`).

### 10.2 Food safety and adequacy (Ceres)
- **V-C-275-1** 3-day semantics. The formula stays. It compares introduction events of distinct base foods: a repeat of the same food is exposure, not a clash; two new foods in one recipe or one combo are a Δ = 0 clash. Anchors are introduction days measured from the planned date: `foods[].date`, the first appearance in `feedingData`, and planned entries new as of their date. "New" is computed live as "no introduction before date D", including for stored `isNew` entries. Past days never warn.
- **V-C-275-2** Use the existing `_fdIsFoodTried` / `_fdSameFood` predicate. Exclude only the pure spices and herbs (turmeric, cinnamon, cumin, coriander, cardamom, pepper, mint, ginger, garlic); never exclude a food with an allergen note, age rule or FOOD_EFFECTS record. Pair-note Carina: `_FOOD_ALIASES` coverage for corpus ingredient names.
- **V-C-275-3** Top-allergen confirm copy (exemplar 6b). Title: "Egg is a common allergen, and new for Ziva." Body: "Give egg on its own, with nothing else new for 3 days before or after, so if she reacts you'll know it was the egg. Best at home and early in the day, when you can watch her for a few hours." Buttons: **Move to Sat** (primary), Plan anyway (secondary). A one-tap link to the FOOD_EFFECTS `watchFor`. Cited via an existing `RECIPE_SOURCES` key; each sentence's source is verified at P1a, and any sentence without a source is dropped (canon-cc-013). Name both when both foods are allergens. After Plan anyway, the lead reads "Egg and kiwi are both new this week. It will be hard to tell which caused a reaction."
- **V-C-275-4** A new food on a travel day gets the confirm (allergen copy for a top allergen); the picker demotes "Plan a new food" on travel days. Move to Sat picks a day that clears every window (including the moved food's own), passes the age gate on that date, sits inside the horizon, and for an allergen is not a travel day.
- **V-C-275-5** A food with `reaction:'watch'` gets a worded caution lead ("You noted a reaction to egg on 12 Oct") and never counts as a clean introduction. Pair-note Maren: re-exposure after a reaction.
- **V-C-275-6** The date's age (`_mpAgeMonthsOn`) feeds the gate **and** the lead. Stored entries are re-checked live; one that became gated shows a flag lead and is kept, never silently dropped. Free-typed names go through `_fdAgeRule` and `_dietAllowsFood`. High-mercury fish free foods get a flag lead via `_isHighMercuryFishHost` (pair-note Carina). Recorded: `getUntriedSuggestions` / `_recipeSuggestForZiva` gate on today's age, which is conservative for future dates and accepted.
- **V-C-275-7** Pack lines de-duplicate by exact string only; one flask per flask meal, shown as a count.
- **V-C-275-8** The always-visible How it keeps block; the shared rule constant only when no planned keeps string states it.
- **V-C-275-9** The chew cue on the collapsed line whenever `r.choking` is non-empty; the chew row open by default when the slot opens (and the Packing row too on travel days); a free-food lead built from `_recipeIngredientSafety` signals including `safeForm.note`, carrying both the allergen and the form for peanut and tree nuts.
- **V-C-275-10** A planner variant of the summary drops established, clean allergens from the watch clause and says "new — watch for 3 days" only for foods new as of the date. The shared `_recipeSafetySummary` text is not edited (pair-note Maren).
- **V-C-275-11** `_MP_LOG_DROP` holds the pure spices and herbs only. Ghee, oil, lemon, sweeteners and salt are kept in the log. Same predicate as -2.
- **V-C-275-12** Logged quantities use the recipe's `ing.g` / `ing.qty`; `_fdResolveQtyDefaults` is only the fallback.
- **V-C-275-13** "She ate this" on an entry whose lead is a flag opens `foodConsequenceCard` first (warn-and-allow per V-M-205), then `_fcCommitItems`.
- **V-C-275-14** The introduce-offer never uses `addFood`. A headless intro helper is pulled out of `foodLibToggleTried`'s `_commitTried`: exact-base match via `_fdSameFood`, a date parameter, the age-gate consequence at that date's age, reactions only ever escalated, the parent picks ok / watch. The offer stays on the day card until acted on or dismissed. **Separate live bug:** `addFood`'s substring merge (egg → eggplant, peanut → peas) gets its own Ceres PR, tracked under this tag until filed.
- **V-C-275-15** Replace is fully restored by the 8 s undo; if the replaced items include a first exposure, the confirm says so. Add with de-dupe stays primary.
- **V-C-275-16** Day-aware picker ranking (iron, then protein, then fruit and vegetables), and one worded, dismissable day hint when 3+ slots are planned with no iron source. At most one gap shown. Optional: "No main meal planned yet" when lunch and dinner hold only snack items. No score (Warmth). Pair-notes: Vela (render), Maren (Caldikind–iron spacing, v1.1).
- **V-C-275-17** Travel gap copy leads with "The travel lunches work for dinner too", then the full list. A corpus PR with 2–3 travel dinners and 2 travel breakfasts runs in parallel, ideally before v1.1, and is not a prerequisite.
- **V-C-275-18** Copy day onto a travel day applies -17 to the copied entries, as well as the age and 3-day re-checks.

### 10.3 What each phase now needs
- **P1a (exemplars):** V-V-275-1, -2, -4…-8, -12, -13, -15, -17, -18; V-C-275-3, -7, -8, -9 (exemplars 1–9 in §4.7). Register `mp-*` (V-V-275-20).
- **P1b (planner UI):** V-V-275-9, -10, -11, -14, -16, -19; V-C-275-4, -5, -6, -10, -16, -17, -18.
- **P2 (new food + log-from-plan):** V-V-275-3; V-C-275-1, -2, -11, -12, -13, -14, -15.
- **Separate Ceres PRs:** the `addFood` substring-merge fix (V-C-275-14); travel dinners and breakfasts for the corpus (V-C-275-17).
- **P0 (data + sync key, Carina-primary) must carry:** V-CA-275-1…7, V-CA-275-8 (record half), V-CA-275-9, and the `_parseLocalDate` primitive from V-CA-275-10. P0 e2e adds: a full push after offline edits respects `ts`; undo of Clear day converges on both phones; Copy day overwrites the other phone's slots; a clock one day fast can't block the other parent; an unknown v2 `kind` survives a v1 round trip; a pruned day doesn't return after a full push; an old-version client leaves the field untouched.
- **Later:** V-CA-275-8 navigation alignment and V-CA-275-12 in P1b; V-CA-275-11 before P2; the app-wide date-helper migration (Q8, widened to `formatDate` and `daysBetween`) as its own Carina-primary PR.

### 10.4 The record and its sync (Carina, Mode 2, support-with-amendments, V-CA-275-1…12)
Carina's finding: receiving a snapshot is the only timestamp-aware path today. The full push, the partial diff push and the global rehydrate are not, so a cleared or edited slot could still come back or go missing.
- **V-CA-275-1** Own document `collection: 'plan'` (`/singles/plan`). `tracking` holds the unbounded feeding, sleep, poop and notes histories and is the one heading for the 1 MiB limit; a separate document also stops every plan tap resending tracking. Older app versions never listen to `plan`.
- **V-CA-275-2** `_syncMergeForPush` gets a mealPlan case like teeth, so reconnect, Retry, import and autosave restore all respect per-field newest-`ts`-wins.
- **V-CA-275-3** Full wiring: `case 'mealPlan'` in both `_syncSetGlobal` and `_syncGetGlobal`; `let mealPlan` and its init load with a type guard; planner writes go through one load-modify-save `_mpSave(mutator)`; a narrow renderer (`renderMealPlanSection`), never `renderDietRecipes`, and no re-render while a planner sheet is open (pair-note Vela). Not in `ALWAYS_POPULATED_KEYS` or `KEY_VERSIONS`.
- **V-CA-275-4** Merge rules, normative: order-independent and idempotent; equal `ts` broken deterministically; `day.cleared` is the larger of the two, and a slot or travel flag survives only if newer than it (masked at render, not deleted, in v1); `v` is the larger; removing the last item writes `{items:[], ts}` and travel off writes `{on:false, ts}`; only date keys and fixed slot names are ever map keys. A randomised test checks order-independence, run-twice and grouping.
- **V-CA-275-5** `_mpStamp`: every write stamps `ts = max(Date.now(), highest ts seen for that field or the day's cleared + 1)`. This stops a fast clock from blocking the other parent, lets Undo beat its own tombstone, and makes Copy day stamp every target slot (with empty tombstones for slots the source lacks).
- **V-CA-275-6** For mealPlan, after a merge the shadow is set to the remote value and, when merged differs from remote, the normal debounced flush re-pushes the newer local fields (opt-in flag `pushBackOnDiverge`). The merge must not throw; if it does, keep local and skip the save.
- **V-CA-275-7** The validator drops only structurally malformed data (non-object, a date key that fails the regex or a round trip, non-finite `ts`). Unknown `kind`s and fields are kept and render as "not shown in this version", so a v1 phone never deletes a v2 record.
- **V-CA-275-8** Retention aligned with navigation (§3.5); prune inside the merge; a 2-day grace band at each cutoff in the push-back check, so two phones' clocks can't loop.
- **V-CA-275-9** The default `{v:1, days:{}}` is never persisted; save on the first real write. Free-food names stay values only (≤ 60 chars, escaped at render).
- **V-CA-275-10** Confirmed in New York time: `addDays('2026-11-02', 1)` returns `'2026-11-02'` and `formatDate` shows the previous day; IST is unaffected, so no data damage today. P0 lands the additive `_parseLocalDate`; the Q8 migration covers `_offsetDateStr`, `addDays`, `ageAt(string)`, `formatDate` (182 sites) and `daysBetween`.
- **V-CA-275-11** Corpus names that don't share an identity with what parents log: almond/almonds/badam, peas/green peas/matar, chana/chickpea, wheat flour/wheat/atta, rohu fish/rohu/fish, milk/cow milk, oil. Three are top allergens. Alias the true synonyms (Ceres decides which), rename generic corpus names (`milk` → `cow milk`), check against a device export first. Before P2. (#276's `_foodIdentityKey` now folds plurals, which closes almond/almonds.)
- **V-CA-275-12** A foundation accessor returns the cited `never[0]` line for a high-mercury fish name, so the planner's flag lead comes from the record (canon-cc-013), plus a drift test against the manifest. P1b.
