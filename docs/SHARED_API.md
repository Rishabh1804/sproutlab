# SproutLab — Shared API Contract
**Version:** 1.0 · **Created:** 9 April 2026
**App:** SproutLab v2.38+ (split-file architecture)
**Scope:** Every function, variable, and constant that crosses module boundaries

---

## Purpose

This document is the contract between SproutLab's five code modules. A builder working on one module reads this instead of the other four modules. If a function or variable is not listed here, the builder must assume it doesn't exist in other modules.

**The rule:** When a function crosses a module boundary, both sides are documented here. When a function moves, both sides update.

---

## Module Map

```
data.js          ← Pure constants (EVIDENCE_PATTERNS, WHO tables, food taxonomy, etc.)
                   Never uploaded. Never changes during builds.

core.js          ← Foundation: KEYS, save/load, utilities, scoring, navigation, settings, bug capture
                   Always uploaded. All modules depend on this.

home.js          ← Home tab, alerts engine, history, poop tracking, diet tab rendering,
                   food management, milestones rendering, outing planner, insights tab
                   Upload for: home, alerts, diet UI, outing, history, poop tracking

diet.js          ← Food intelligence, tomorrow's prep, meal intake, variety/correlation,
                   score popup, combo checker, food tips, QL feed helpers
                   Upload for: food intelligence, tomorrow's prep, score popup, combo system

medical.js       ← Sleep tracking, growth charts, vaccination, illness trackers (fever,
                   diarrhoea, vomiting, cold), milestone engine, poop intelligence,
                   sleep intelligence, medical intelligence, doctor/visit management
                   Upload for: sleep, growth, vaccination, illness, milestone engine

intelligence.js  ← ISL cache, Smart Q&A, search bar, Today So Far, Quick Log system,
                   activity logger, cross-domain intelligence, food intelligence cards,
                   illness episode state, weather system, QL predictions
                   Upload for: QA, search, TSF, QL, activity log, illness episodes
```

### Concat Order (build.sh)

```
data → core → home → diet → medical → intelligence
```

All functions hoist (standard `function` declarations). The concat order matters for top-level variable initialization — `init()` in core.js runs last via `start.js`.

---

## 1. Core Exports

Every feature module depends on core.js. These are the functions and variables core.js provides.

### 1.1 Storage

| Export | Signature | Returns |
|--------|-----------|---------|
| `KEYS` | Object constant | `{ avatar, growth, feeding, milestones, foods, vacc, notes, meds, visits, medChecks, events, scrapbook, doctors, sleep, poop, alertsActive, alertsHistory, vaccBooked, suggestions, feverEpisodes, diarrhoeaEpisodes, vomitingEpisodes, coldEpisodes, activityLog, tomorrowPlanned, tomorrowOuting, powerOutage, bugReportPhone, bugTooltipSeen, qlPredictions }` |
| `load(key, def)` | string, any | Parsed JSON or `def` on error |
| `save(key, val)` | string, any | void (triggers autosave) |

### 1.2 Global Data (set in init, read everywhere)

| Variable | Type | Set by | Mutated by |
|----------|------|--------|------------|
| `feedingData` | `{ [dateStr]: { breakfast, lunch, dinner, ...meal } }` | core init | home (saveFeedingDay), intelligence (QL save) |
| `sleepData` | `[{ date, bedtime, wakeTime, type, wakeups?, score? }]` | core init | medical (sleep entry functions), intelligence (QL save) |
| `poopData` | `[{ date, time?, consistency, color, amount?, notes? }]` | core init | home (poop entry functions), intelligence (QL save) |
| `vaccData` | `[{ name, date, upcoming, reaction?, reactionLoggedAt?, ... }]` | core init | medical (vacc functions), core (delegation) |
| `growthData` | `[{ date, wt, ht }]` | core init | medical (growth functions) |
| `foods` | `[{ name, reaction, group?, introduced?, starred? }]` | core init | home (food functions), intelligence (auto-introduce) |
| `meds` | `[{ name, dose, time, schedule?, active? }]` | core init | medical (med functions) |
| `medChecks` | `{ _trackingSince, [dateStr]: { [medName]: 'done:HH:MM'\|'skipped' } }` | core init | home (markMedDone/Skipped), intelligence |
| `activityLog` | `{ [dateStr]: [{ text, duration?, slot?, domain?, ... }] }` | medical.js (line 75) | intelligence (saveActivity), medical (sync) |
| `milestones` | `[{ text, status, cat, manualStatus, autoStatus, evidenceCount, ... }]` | core init | home (milestone functions), medical (sync), intelligence (override) |
| `doctors` | `[{ name, phone, location?, address?, title?, primary? }]` | core init | medical (doctor functions) |
| `notes` | `[{ text, date, cat?, photo?, voice?, ... }]` | core init | core (note functions) |
| `visits` | `[{ date, weight?, height?, notes?, doctor? }]` | core init | medical (visit functions) |
| `customEvents` | `[{ title, date, ... }]` | core init | medical (event functions) |
| `scrapbook` | `[{ date, photo, caption?, ... }]` | core init | core (scrapbook functions) |
| `DOB` | `Date (2025-09-04)` | core constant | Never |
| `SOLIDS_START` | `Date (2026-03-06)` | core constant | Never |
| `MS_STAGES` | `['not_started','emerging','practicing','consistent','mastered']` | core constant | Never |
| `MS_STAGE_META` | `{ [stage]: { label, icon, pct, color } }` | core constant | Never |

### 1.3 Utility Functions

| Export | Signature | Returns | Used by |
|--------|-----------|---------|---------|
| `zi(name)` | string | SVG markup `<svg class="zi">...` | all |
| `escHtml(s)` | string | HTML-safe string | all |
| `today()` | — | `'YYYY-MM-DD'` string | all |
| `toDateStr(d)` | Date | `'YYYY-MM-DD'` string | all |
| `formatDate(s)` | dateStr | `'Mon DD'` or `'Mon DD, YYYY'` | all |
| `normVacc(n)` | string | lowercase alpha-numeric only | home, medical |
| `isSimpleMode()` | — | boolean | home, diet |
| `activateBtn(id, bool)` | string, boolean | void (toggles `.active` class) | home, diet, medical |

### 1.4 Scoring System

| Export | Signature | Returns | Used by |
|--------|-----------|---------|---------|
| `calcDietScore(dateStr?)` | optional dateStr | number 0–100 | home, diet, intelligence |
| `calcPoopScore(dateStr?)` | optional dateStr | number 0–100 | diet, medical, intelligence |
| `calcMedicalScore()` | — | number 0–100 | home, diet, intelligence |
| `calcMilestoneScore()` | — | number 0–100 | home, diet, intelligence |
| `calcZivaScore(dateStr?)` | optional dateStr | `{ total, diet, sleep, poop, medical, milestones }` | diet, intelligence |
| `getSleepScore24h()` | — | number 0–100 | intelligence |
| `getScoreLabel(score)` | number | `{ min, label, emoji, text }` | diet, medical, intelligence |
| `getZivaScoreTrend7d()` | — | `{ current, previous, trend }` | home, diet, intelligence |
| `applyIntelligenceModifier(base, mod)` | number, modifier | number 0–100 | medical |
| `computeSleepModifier()` | — | modifier object | medical |
| `getModifierWeight()` | — | number 0–1 | diet |
| `_clearModifierCache()` | — | void | home |

### 1.5 Trends

| Export | Signature | Returns | Used by |
|--------|-----------|---------|---------|
| `getGrowthVelocity()` | — | `{ wt, ht, period, ... }` | home |
| `getGrowthNarrative(v)` | velocity obj | string | home |
| `getPercentileNarrative()` | — | string | home |
| `getSleepTrend7d()` | — | trend object | home, diet |
| `getPoopTrend7d()` | — | trend object | home, diet |
| `getFeedingTrend7d()` | — | trend object | home, diet |
| `getSleepPatterns()` | — | pattern object | home |
| `getPulseNarrative()` | — | string | home |
| `formatBedtimeMin(min)` | number | `'HH:MM PM'` string | home |
| `getDateWindow(days, offset)` | number, number | `{ start, end }` datestrs | home, diet |
| `getChartTheme()` | — | `{ bg, text, grid, ... }` | home, medical |

### 1.6 Navigation

| Export | Signature | Returns | Used by |
|--------|-----------|---------|---------|
| `switchTab(name)` | string | void | diet, intelligence (+ core delegation) |
| `switchTrackSub(sub)` | string | void | intelligence |
| `openModal(id)` | string | void | home, medical |
| `closeModal(id)` | string | void | home, medical |
| `confirmAction(msg, cb, btnText?)` | string, function, string? | void | home, medical, intelligence |
| `getDietPref()` | — | `'veg'\|'nonveg'\|'egg'` | home, diet |
| `getAlertNavAction(key, title)` | string, string | HTML string | diet |
| `updateStatPillTrends()` | — | void | home |

---

## 2. Feature → Feature Cross-Module Calls

This is the critical section. Each entry documents a function that is **defined** in one module but **called** from another.

### 2.1 home.js Exports (called by other modules)

#### Called by diet.js (20 functions)

| Function | Signature | Returns |
|----------|-----------|---------|
| `_baseFoodName(name)` | string | normalized base food name |
| `normalizeFoodName(raw)` | string | same as `_baseFoodName` |
| `ageAt(date?)` | optional Date | `{ months, days, weeks }` |
| `preciseAge()` | — | same as `ageAt()` |
| `escAttr(s)` | string | attribute-safe string |
| `isRealMeal(val)` | string | boolean (truthy and not `SKIPPED_MEAL`) |
| `getNutrition(foodName)` | string | `{ calories, protein, iron, ... }` or null |
| `getSynergy(food1, food2)` | string, string | synergy object or null |
| `getSeasonalScore(foodBase)` | string | number 0–1 |
| `getSeasonalHighlights()` | — | array of seasonal food objects |
| `getAcceptanceLabel(rate)` | number | `'loves'\|'likes'\|'new'\|...` |
| `getFoodAcceptanceRate(foodBase)` | string | number 0–1 |
| `computeBaselines()` | — | baseline stats object (cached) |
| `sanitizeAlertKey(s)` | string | safe string for IDs |
| `loadAlertHistory()` | — | array of alert events |
| `highlightMatch(food, query)` | string, string | HTML with `<mark>` |
| `_getHydrationContext()` | — | hydration context object |
| `_getTomorrowTemp()` | — | number (temp forecast) or null |
| `_tpMineMealPatterns()` | — | meal pattern analysis |
| `toggleCatCard(cardId, itemsId)` | string, string | void (accordion toggle) |

#### Called by medical.js (21 functions)

| Function | Signature | Returns |
|----------|-----------|---------|
| `ageAt(date?)` | Date? | `{ months, days, weeks }` |
| `ageAtDate(dateStr)` | string | `{ months, days }` |
| `preciseAge()` | — | `{ months, days, weeks }` |
| `daysBetween(d1, d2)` | Date, Date | number |
| `_baseFoodName(name)` | string | normalized base food name |
| `normalizeFoodName(raw)` | string | normalized base food name |
| `escAttr(s)` | string | attribute-safe string |
| `guessMilestoneCat(text)` | string | `'motor'\|'cognitive'\|'social'\|...` |
| `logMilestoneEvent(text, stage, date)` | string, string, string | void |
| `getVaccApptLabel(bookedData)` | object | display string |
| `getLastPoop()` | — | poop entry or null |
| `renderMilestones()` | — | void (DOM render) |
| `renderMilestoneStats()` | — | void (DOM render) |
| `renderRemindersAndAlerts()` | — | void (DOM render) |
| `renderHomeContextAlerts()` | — | void (DOM render) |
| `renderHomeVacc()` | — | void (DOM render) |
| `renderHomeActivity()` | — | void (DOM render) |
| `renderTodayPlan()` | — | void (DOM render) |
| `updateHeader()` | — | void (DOM render) |
| `toggleCatCard(cardId, itemsId)` | string, string | void |
| `toggleHistoryCard(bodyId, chevronId)` | string, string | void |

#### Called by intelligence.js (34 functions)

| Function | Signature | Returns |
|----------|-----------|---------|
| `_baseFoodName(name)` | string | normalized base food name |
| `normalizeFoodName(raw)` | string | normalized base food name |
| `ageAt(date?)` | Date? | `{ months, days, weeks }` |
| `isRealMeal(val)` | string | boolean |
| `getNutrition(foodName)` | string | nutrient object or null |
| `getSynergy(food1, food2)` | string, string | synergy object or null |
| `getSeasonalScore(foodBase)` | string | number 0–1 |
| `getFoodAcceptanceRate(foodBase)` | string | number 0–1 |
| `computeFoodAcceptance(windowDays)` | number | acceptance stats object |
| `getFoodFrequency(foodName)` | string | number (count in diary) |
| `freqLabel(count)` | number | `'new'\|'occasional'\|'regular'\|'staple'` |
| `getPoopsForDate(dateStr)` | string | array of poop entries |
| `parseMealNutrition(mealStr)` | string | combined nutrient object |
| `computeBaselines()` | — | baseline stats object (cached) |
| `loadAlertState()` | — | `{ dismissed: {} }` |
| `_sgNextEmptyMeal()` | — | `'breakfast'\|'lunch'\|'dinner'` or null |
| `initFeeding()` | — | void (init feed day) |
| `loadFeedingDay()` | — | void (load + render) |
| `overrideMilestoneStatus(i, newStatus)` | number, string | void |
| `renderHome()` | — | void (full home re-render) |
| `renderFoods()` | — | void (DOM render) |
| `renderMilestones()` | — | void (DOM render) |
| `renderPoop()` | — | void (DOM render) |
| `renderHomeActivity()` | — | void (DOM render) |
| `renderHomeSuggestions()` | — | void (DOM render) |
| `renderTodayPlan()` | — | void (DOM render) |
| `renderDietStats()` | — | void (DOM render) |
| `renderDietQuickPicker()` | — | void (DOM render) |
| `renderDietIntelBanner()` | — | void (DOM render) |
| `renderFeedingHistory()` | — | void (DOM render) |
| `updateMealInsight(meal)` | string | void |
| `qaHandleOuting(classified)` | object | answer object |
| `_outingRenderForm()` | — | void |
| `_outingHideForm()` | — | void |

### 2.2 diet.js Exports (called by other modules)

#### Called by home.js (17 functions)

| Function | Signature | Returns |
|----------|-----------|---------|
| `classifyFoodToGroup(foodName)` | string | `{ group, sub }` |
| `extractDayFoods(dateStr)` | string | `[{ base, meal, ... }]` |
| `computeVarietyScore(windowDays)` | number | variety stats object |
| `computeFoodPoopCorrelations()` | — | correlation array (cached) |
| `countFoodsInDiary(diaryData, keywords)` | object, array | number |
| `getTopMeals(n)` | number | array of `{ meal, foods }` |
| `isFoodFavorite(foodName)` | string | boolean |
| `renderHeroScore()` | — | void (DOM render) |
| `renderDomainHero(domainKey)` | string | void (DOM render) |
| `renderAlertIntelligence()` | — | void (DOM render) |
| `renderCorrelationCard()` | — | void (DOM render) |
| `renderTips()` | — | void (DOM render) |
| `renderTomorrowPrep()` | — | void (DOM render) |
| `renderInsightsCross()` | — | void (DOM render) |
| `renderWeeklySummary()` | — | void (DOM render) |
| `_miGetIntake(dateStr, meal)` | string, string | `'full'\|'half'\|'few_bites'\|'refused'\|null` |
| `_miRenderChip(intake)` | string | HTML string |
| `_miRenderDietTabIntake()` | — | void (DOM render) |

#### Called by intelligence.js (23 functions)

| Function | Signature | Returns |
|----------|-----------|---------|
| `extractDayFoods(dateStr)` | string | `[{ base, meal, ... }]` |
| `classifyFoodToGroup(foodName)` | string | `{ group, sub }` |
| `computeVarietyScore(windowDays)` | number | variety stats object |
| `computeFoodPoopCorrelations()` | — | correlation array |
| `computeMealDiversity(dateStr)` | string | diversity stats |
| `isFoodFavorite(foodName)` | string | boolean |
| `getFoodTags(foodNames)` | array | tag set |
| `generateTomorrowPrep()` | — | prep plan object |
| `checkFoodCombo()` | — | void (renders combo result) |
| `renderTips()` | — | void (DOM render) |
| `renderQLFreqPills()` | — | void (DOM render) |
| `updateQLFeedDropdown()` | — | void (DOM render) |
| `resetQLSheet()` | — | void (reset QL state) |
| `getMdiColor(score)` | number | CSS color string |
| `getMdiTextColor(score)` | number | CSS color string |
| `_miGetIntake(dateStr, meal)` | string, string | intake level or null |
| `_miLevelFor(value)` | string | intake level string |
| `_miRenderBar(intake)` | string | HTML string |
| `_miRenderDietTabIntake()` | — | void (DOM render) |
| `_miShowPostSavePrompt(dateStr)` | string | void |
| `_miWireQLIntakePills()` | — | void (wires event listeners) |
| `_tpGetFoodSleepCorrelation(foodBase)` | string | correlation number |
| `_tpGetFoodPoopCorrelation(foodBase)` | string | correlation number |

#### Called by medical.js (3 functions)

| Function | Signature | Returns |
|----------|-----------|---------|
| `computeFoodPoopCorrelations()` | — | correlation array |
| `extractDayFoods(dateStr)` | string | `[{ base, meal, ... }]` |
| `renderDomainHero(domainKey)` | string | void (DOM render) |

### 2.3 medical.js Exports (called by other modules)

#### Called by home.js (40 functions)

| Function | Signature | Returns |
|----------|-----------|---------|
| **Age/Time** | | |
| `getAgeInMonths()` | — | number |
| `ageMonthsAt(dateStr)` | string | number |
| `_offsetDateStr(baseDate, offset)` | string, number | `'YYYY-MM-DD'` |
| `addDays(dateStr, days)` | string, number | `'YYYY-MM-DD'` |
| `formatTimeShort(t)` | `'HH:MM'` | `'H:MM am/pm'` |
| **Sleep** | | |
| `getDailySleepScore(dateStr)` | string | number 0–100 |
| `getAvgDailySleepScore7d()` | — | number |
| `calcSleepScore(entry)` | sleep entry | number 0–100 |
| `calcSleepDuration(bed, wake)` | string, string | minutes (number) |
| `getWakeCount(entry)` | sleep entry | number |
| `getLastNightSleep()` | — | sleep entry or null |
| `getSleepForDate(dateStr)` | string | array of sleep entries |
| `updateSleepDayLabel(inputId, labelId)` | string, string | void |
| `getSleepTargets(ageMonths)` | number | `{ total, night, naps }` |
| `renderHomeSleep()` | — | void (DOM render) |
| **Growth** | | |
| `getLatestWeight()` | — | number (kg) |
| `getLatestHeight()` | — | number (cm) |
| `calcPercentile(val, p3, p50, p97, p15, p85)` | numbers | percentile string |
| `getGrowthRef(moExact)` | number | reference data object |
| `formatHeight(cm)` | number | display string (ft/in or cm) |
| `drawChart()` | — | void (Chart.js render) |
| `drawHeightChart()` | — | void (Chart.js render) |
| **Vaccination** | | |
| `renderVacc()` | — | void (DOM render) |
| `renderVaccCoverage()` | — | void (DOM render) |
| `openVaccEditModal(idx)` | number | void |
| `getVaccGuidance(vaccName)` | string | guidance object |
| **Milestones** | | |
| `isMsDone(m)` | milestone | boolean |
| `isMsActive(m)` | milestone | boolean |
| `isMsStarted(m)` | milestone | boolean |
| `milestoneKeywordScore(text, kw)` | string, string | number 0–1 |
| `getMilestoneEvidence(keyword)` | string | evidence array |
| `checkEvidenceRegression(kw, status)` | string, string | boolean |
| `renderActiveMilestones()` | — | void (DOM render) |
| `getUpcomingMilestones()` | — | upcoming milestones array |
| `renderUpcomingMilestones()` | — | void (DOM render) |
| `renderActivities()` | — | void (DOM render) |
| `getFilteredActivities()` | — | filtered activities array |
| **Other** | | |
| `getUpcomingEvents()` | — | events array |
| `renderUpcomingEvents()` | — | void |
| `getZivaMonthDays()` | — | `{ months, days }` |
| `getPrimaryDoctor()` | — | doctor object or null |
| `_getAllEpisodes()` | — | combined illness episodes array |
| `computeHydrationIntelligence(days)` | number | hydration stats |
| `getEventActivities(ev)` | event | activities array |

#### Called by diet.js (8 functions)

| Function | Signature | Returns |
|----------|-----------|---------|
| `getAgeInMonths()` | — | number |
| `_offsetDateStr(base, offset)` | string, number | `'YYYY-MM-DD'` |
| `addDays(dateStr, days)` | string, number | `'YYYY-MM-DD'` |
| `getDailySleepScore(dateStr)` | string | number 0–100 |
| `getSleepTargets(ageMonths)` | number | `{ total, night, naps }` |
| `computeSupplementAdherence(days)` | number | adherence stats object |
| `computeTextureProgression()` | — | texture progression object |
| `_classifyMealTexture(mealText)` | string | `'puree'\|'mashed'\|'lumpy'\|'finger'\|'table'` |

#### Called by intelligence.js (55 functions)

*intelligence.js is the heaviest consumer of medical.js — it drives the Info tab, cross-domain cards, and QA handlers.*

| Function | Signature | Returns |
|----------|-----------|---------|
| **Age/Time** | | |
| `getAgeInMonths()` | — | number |
| `_offsetDateStr(base, offset)` | string, number | dateStr |
| `addDays(dateStr, days)` | string, number | dateStr |
| `formatTimeShort(t)` | `'HH:MM'` | `'H:MM am/pm'` |
| **Sleep** | | |
| `getDailySleepScore(dateStr)` | string | number 0–100 |
| `calcSleepDuration(bed, wake)` | string, string | minutes |
| `getWakeCount(entry)` | sleep entry | number |
| `getAvgSleep7d()` | — | `{ total, night, nap }` |
| `getSleepForDate(dateStr)` | string | sleep entry array |
| `getSleepTargets(ageMonths)` | number | `{ total, night, naps }` |
| `classifyNapType(startTime)` | string | `'morning'\|'afternoon'\|'evening'` |
| `renderSleep()` | — | void (DOM render) |
| `renderHomeSleep()` | — | void (DOM render) |
| **Growth** | | |
| `computeGrowthVelocity()` | — | growth velocity object |
| **Milestones** | | |
| `matchesMilestoneKeyword(text, kw)` | string, string | boolean |
| `getMilestoneEvidence(keyword)` | string | evidence array |
| `computeAutoStatus(keyword)` | string | status string |
| `syncMilestoneStatuses()` | — | void |
| `classifyActivity(inputText)` | string | `{ keyword, confidence, domain }` |
| `isMsStarted(m)` | milestone | boolean |
| **Vaccination** | | |
| `_vaccFamilyKey(vaccName)` | string | family key string |
| `_vaccReactionTrend(history)` | array | trend object |
| `_vaccPostCorrelation(vaccDate)` | string | correlation data |
| `_vaccSymptomLabels(symptoms)` | array | display labels array |
| `computeSupplementAdherence(days)` | number | adherence stats |
| `computeGrowthVelocity()` | — | growth velocity object |
| **Medical intelligence render functions** | | |
| `renderInfoPoopConsistencyTrend()` | — | void |
| `renderInfoPoopFrequency()` | — | void |
| `renderInfoPoopFoodDelay()` | — | void |
| `renderInfoPoopFoodWatch()` | — | void |
| `renderInfoPoopColorAnomaly()` | — | void |
| `renderInfoPoopAmountTrend()` | — | void |
| `renderInfoPoopSymptoms()` | — | void |
| `renderInfoPoopReport()` | — | void |
| `renderInfoActivityConsistency()` | — | void |
| `renderInfoActivityCorrelation()` | — | void |
| `renderInfoMilestoneVelocity()` | — | void |
| `renderInfoIllnessFreq()` | — | void |
| `renderInfoVaccFever()` | — | void |
| `renderInfoIllnessFood()` | — | void |
| `renderInfoRecovery()` | — | void |
| `renderInfoIllnessSleep()` | — | void |
| `renderInfoFoodReaction()` | — | void |
| `renderInfoRepetition()` | — | void |
| `renderInfoTexture()` | — | void |
| `renderInfoHydration()` | — | void |
| `renderInfoSupplementAdherence()` | — | void |
| `renderInfoVaccRecovery()` | — | void |
| `renderInfoGrowthVelocity()` | — | void |
| `renderInfoVisitPrep()` | — | void |
| **Illness helpers** | | |
| `_getAllEpisodes()` | — | combined illness episodes |
| `_episodeDurationDays(ep)` | episode | number |
| `computeConsistencyTrend(days)` | number | trend data |
| `computeTextureProgression()` | — | texture data |
| `computeFoodRepetition()` | — | repetition data |
| `_scDoctorCardHTML(isEmergency)` | boolean | HTML string |
| `computeSleepRegression()` | — | regression data |

### 2.4 intelligence.js Exports (called by other modules)

#### Called by home.js (34 functions)

| Function | Signature | Returns |
|----------|-----------|---------|
| **ISL / Cache** | | |
| `_islMarkDirty(domain)` | string | void (invalidates ISL cache) |
| `_tsfMarkDirty()` | — | void (invalidates TSF cache) |
| `getDomainData(domain, start, end)` | string, string?, string? | domain stats object |
| **Search / QA** | | |
| `renderQABar()` | — | void (DOM render) |
| `qaRenderAnswer(container, answer)` | element, object | void |
| **Today So Far** | | |
| `renderTodaySoFar()` | — | void (DOM render) |
| `renderHomeMealProgress()` | — | void (DOM render) |
| **Quick Log** | | |
| `openQuickModal(type)` | `'feed'\|'sleep'\|'nap'\|'poop'\|'activity'` | void |
| `showQLToast(msg, dur, undoFn?)` | string, number, function? | void |
| **Illness episodes** | | |
| `getActiveFeverEpisode()` | — | episode or null |
| `getActiveDiarrhoeaEpisode()` | — | episode or null |
| `getActiveVomitingEpisode()` | — | episode or null |
| `getActiveColdEpisode()` | — | episode or null |
| `computeFeverAlerts()` | — | alerts array |
| `computeDiarrhoeaAlerts()` | — | alerts array |
| `computeVomitingAlerts()` | — | alerts array |
| `computeColdAlerts()` | — | alerts array |
| `getFeverDietFoods()` | — | food recommendations array |
| `getDiarrhoeaDietFoods()` | — | food recommendations array |
| `renderHomeFeverBanner()` | — | void |
| `renderHomeDiarrhoeaBanner()` | — | void |
| `renderHomeVomitingBanner()` | — | void |
| `renderHomeColdBanner()` | — | void |
| `renderDietFeverBanner()` | — | void |
| `renderDietDiarrhoeaBanner()` | — | void |
| **Diet helpers** | | |
| `fillDietMeal(meal, value)` | string, string | void |
| `insertDietFood(meal, food)` | string, string | void |
| `getMealSlotTopFoods(mealKey, n)` | string, number | array of food strings |
| `updateMealSkipButtons()` | — | void |
| `capitalize(s)` | string | capitalized string |
| **Intelligence cards** | | |
| `computeNutrientHeatmap(days)` | number | heatmap data |
| `computeSmartPairings()` | — | pairing suggestions |
| **Weather** | | |
| `getWeatherForDate(dateStr)` | string | weather object or null |
| `saveWeatherCache()` | — | void |
| **Suggestions** | | |
| `sgToggleMore()` | — | void |
| `sgTapChip(food)` | number | void |
| `openActivityLogPrefilled(text, dur, src)` | string, number?, string? | void |

#### Called by diet.js (15 functions)

| Function | Signature | Returns |
|----------|-----------|---------|
| `_islMarkDirty(domain)` | string | void |
| `capitalize(s)` | string | capitalized string |
| `openQuickModal(type)` | string | void |
| `dismissPostSaveFlash()` | — | void |
| `renderHomeMealProgress()` | — | void |
| `getFoodHistory(foodName)` | string | history object |
| `getFoodSleepCorrelation(rawFoods)` | array | correlation data |
| `getSynergyPairings(rawFoods)` | array | synergy array |
| `computeNutrientHeatmap(days)` | number | heatmap data |
| `computeBedtimeDrift()` | — | drift stats |
| `computeNapTransition()` | — | transition data |
| `computeSleepRegression()` | — | regression data |
| `_cdGetBedtime(dateStr)` | string | bedtime string or null |
| `_cdGetLastMealTime(dateStr)` | string | time string or null |
| `_cdTimeToMin(timeStr)` | string | number (minutes) |

#### Called by medical.js (16 functions)

| Function | Signature | Returns |
|----------|-----------|---------|
| `_islMarkDirty(domain)` | string | void |
| `_tsfMarkDirty()` | — | void |
| `getDomainData(domain, start, end)` | string, string?, string? | domain stats |
| `showQLToast(msg, dur, undoFn?)` | string, number, function? | void |
| `getActiveFeverEpisode()` | — | episode or null |
| `getActiveDiarrhoeaEpisode()` | — | episode or null |
| `getActiveVomitingEpisode()` | — | episode or null |
| `getActiveColdEpisode()` | — | episode or null |
| `computeSleepRegression()` | — | regression data |
| `computeDayHydration(dateStr)` | string | hydration data |
| `fetchHistoricalWeather(start, end)` | string, string | void (async) |
| `getWeatherForDate(dateStr)` | string | weather object or null |
| `getPoopConsistencyForDate(dateStr)` | string | consistency string or null |
| `_siRingBg(label)` | string | CSS color |
| `_siRingBorder(label)` | string | CSS color |
| `_siRingText(label)` | string | CSS color |

---

## 3. Cross-Module Global Variables

Variables defined in one feature module but read by another. These are implicit dependencies — the riskiest kind.

### 3.1 home.js globals read elsewhere

| Variable | Type | Read by |
|----------|------|---------|
| `SKIPPED_MEAL` | `'__skipped__'` (const) | diet.js, intelligence.js |
| `KEY_NUTRIENTS` | array of nutrient keys (const) | diet.js, intelligence.js |
| `D3_KNOWLEDGE` | Vitamin D3 knowledge base (const) | diet.js |
| `_suggestionsData` | suggestions state object | intelligence.js |
| `_foodTaxFlat` | flattened food taxonomy cache | intelligence.js |
| `_tomorrowOuting` | outing plan object or null | diet.js |

### 3.2 diet.js globals read elsewhere

| Variable | Type | Read by |
|----------|------|---------|
| `_qlSelectedIntake` | intake level or null | intelligence.js |
| `_qlBackfillDate` | dateStr or null | intelligence.js |

### 3.3 medical.js globals read elsewhere

| Variable | Type | Read by |
|----------|------|---------|
| `activityLog` | `{ [dateStr]: activity[] }` | home.js, diet.js, intelligence.js |
| `SYMPTOM_DB` | symptom database (const) | intelligence.js |
| `SYMPTOM_QUICK_CHIPS` | symptom chip config (const) | intelligence.js |
| `SLEEP_INPROGRESS_KEY` | localStorage key string (const) | intelligence.js |
| `_postVaccCached` | cached post-vacc status | home.js |
| `_lastActivityUndo` | last activity for undo | intelligence.js |

### 3.4 intelligence.js globals read elsewhere

| Variable | Type | Read by |
|----------|------|---------|
| `_feverEpisodes` | fever episode array | medical.js |
| `_diarrhoeaEpisodes` | diarrhoea episode array | medical.js |
| `_vomitingEpisodes` | vomiting episode array | medical.js |
| `_coldEpisodes` | cold episode array | medical.js |
| `_weatherCache` | weather data cache | home.js, medical.js |
| `_qlMeal` | current QL meal selection | home.js |
| `_qlSuggestUsed` | QL suggestion used flag | diet.js |

---

## 4. Duplicate Definitions

Functions defined in more than one module. These must be consolidated.

| Function | Defined in | Issue |
|----------|-----------|-------|
| `undoLastActivity()` | medical.js (line 235), intelligence.js (line 9994) | Duplicate — the one that runs depends on concat order. intelligence.js version runs (loaded later). |

**Action required:** Remove the medical.js version, or consolidate into one module.

---

## 5. Constants That Should Move to data.js

These constants are defined in feature modules but are pure data with no function dependencies. Moving them to `data.js` would reduce feature module size without affecting the API contract.

| Constant | Current module | Lines | Dependencies |
|----------|---------------|:-----:|-------------|
| `SKIPPED_MEAL` | home.js | 1 | None — string literal |
| `KEY_NUTRIENTS` | home.js | ~20 | None — array literal |
| `D3_KNOWLEDGE` | home.js | ~80 | None — object literal |
| `ESCALATING_TIPS` | home.js | ~80 | None — object literal |
| `SYNTHESIS_RULES` | home.js | ~50 | None — array literal |
| `ALL_TIPS` | diet.js | ~360 | None — array literal |
| `SYMPTOM_DB` | medical.js | ~170 | None — array literal |
| `VACC_GUIDANCE` | medical.js | ~80 | None — object literal |
| `QA_INTENTS` | intelligence.js | ~200 | None — array literal |
| `QA_PLACEHOLDERS` | intelligence.js | ~15 | None — array literal |
| `QA_SUGGEST_POOL` | intelligence.js | ~80 | None — array literal |
| `HEATMAP_NUTRIENTS` | intelligence.js | ~70 | None — array literal |

**Estimated savings:** ~1,200 lines out of feature modules → data.js.

---

## 6. Architectural Observations

### 6.1 Dependency Density

| Module | Outgoing cross-module calls | Incoming cross-module calls |
|--------|:---------------------------:|:---------------------------:|
| home.js | 91 | 75 |
| diet.js | 43 | 40 |
| medical.js | 40 | 103 |
| intelligence.js | 112 | 65 |

**intelligence.js** is the most coupled module — it calls 112 functions from other modules. This is inherent to its role (ISL, QA, cross-domain intelligence all need data from every domain). Builders working on intelligence.js benefit most from this contract.

**medical.js** is the most depended-upon module — 103 incoming calls. Sleep, growth, vaccination, and milestone functions are consumed everywhere. Breaking changes here ripple widely.

### 6.2 Functions That May Belong in core.js

Several functions in feature modules serve as general utilities used by 3+ modules:

| Function | Currently in | Used by | Candidate for core? |
|----------|-------------|---------|:-------------------:|
| `_baseFoodName()` | home.js | diet, medical, intelligence | Yes |
| `normalizeFoodName()` | home.js | diet, medical, intelligence | Yes |
| `escAttr()` | home.js | medical (15x) | Yes |
| `ageAt()` | home.js | diet, medical, intelligence | Yes |
| `isRealMeal()` | home.js | diet, intelligence | Consider |
| `_offsetDateStr()` | medical.js | home, diet, intelligence | Yes |
| `formatTimeShort()` | medical.js | home, intelligence | Yes |
| `getAgeInMonths()` | medical.js | home, diet, intelligence | Yes |
| `capitalize()` | intelligence.js | home, diet | Yes |

Moving these to core.js would reduce cross-module coupling by ~50 references.

### 6.3 Illness Episode State Split

Illness episode **state** (`_feverEpisodes`, `_diarrhoeaEpisodes`, etc.) lives in intelligence.js, but the illness **trackers** (render, log, resolve functions) are spread between intelligence.js and medical.js, with medical.js reading the episode arrays directly. This creates a tight bidirectional coupling between these two modules.

---

## 7. Builder Quick Reference

### "I'm working on X, what do I upload?"

| Task | Upload | Why |
|------|--------|-----|
| Home tab feature | core + home | Self-contained for hero, vitals, notes |
| Alert engine | core + home | Alerts defined and rendered in home.js |
| Diet tab / food logging | core + home + diet | Diet UI in home, intelligence in diet |
| Tomorrow's Prep | core + home + diet | Prep engine in diet, hydration helpers in home |
| Score popup | core + diet | Score popup is in diet.js |
| Sleep feature | core + medical | Sleep tracking is in medical.js |
| Vaccination feature | core + medical + home | Vacc logic in medical, home rendering in home |
| Illness tracker | core + intelligence + medical | Episode state in intelligence, trackers split |
| QA / search bar | core + intelligence | QA engine self-contained in intelligence |
| Today So Far | core + intelligence | TSF engine in intelligence |
| Quick Log | core + intelligence | QL system in intelligence |
| Activity logger | core + intelligence + medical | Logger in intelligence, milestone sync in medical |
| Cross-domain intel | core + intelligence + medical | Cards in intelligence, data functions in medical |
| Info tab (poop/sleep intel) | core + intelligence + medical | Orchestration in intelligence, compute+render in medical |
| Food intelligence | core + intelligence + diet + home | Cards in intelligence, data in diet, nutrients in home |

### "What renders what?"

| Tab/View | Primary renderer | Module |
|----------|-----------------|--------|
| Home tab | `renderHome()` | home.js |
| Home hero + score | `renderHeroScore()` | diet.js |
| Home alerts | `renderRemindersAndAlerts()` | home.js |
| Home meal progress | `renderHomeMealProgress()` | intelligence.js |
| Home TSF card | `renderTodaySoFar()` | intelligence.js |
| Diet tab | `renderDietStats()`, `renderFeedingHistory()` | home.js |
| Diet intelligence banner | `renderDietIntelBanner()` | home.js |
| Growth tab | `renderGrowth()` | medical.js |
| Sleep tab | `renderSleep()` | medical.js |
| Poop tab | `renderPoop()` | home.js |
| Medical tab | `renderVacc()`, `renderMeds()` | medical.js |
| Milestones tab | `renderMilestones()` | home.js |
| Insights tab | `renderInsights()` | home.js |
| Info tab | `renderInfo()` | intelligence.js |
| History tab | `renderHistoryPreviews()` | home.js |
| Today's Plan | `renderTodayPlan()` | home.js |
| QA bar | `renderQABar()` | intelligence.js |
| Score popup | `openScorePopup()` | diet.js |
| Quick Log sheet | `openQuickLog()` / `openQuickModal()` | intelligence.js |

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 9 Apr 2026 | Initial version. Audited from split codebase (core 4,704 + home 9,151 + diet 4,090 + medical 9,578 + intelligence 15,876 lines). |

---

*This document is the contract between SproutLab's modules. When a function crosses a module boundary, it's documented here. When a function moves, both sides update. Builders read this instead of uploading all five modules.*
