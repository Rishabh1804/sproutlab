# SproutLab v3.0 — Roundtable Chronicle

**Date:** 2026-05-25
**Session ID:** sproutlab-v3-roundtable-2026-05-25
**Type:** Institutional-memory record + arc-planning master document
**Province:** SproutLab
**Cluster:** A (Codex + SproutLab)
**Convener:** Lyra (Builder, SproutLab)
**Chronicler:** Aurelius (Builder, Codex — cross-cluster invocation per canon-cc-026)
**Doctrine basis:** canon-cc-008 (QA chain) · canon-cc-022 (artifact test) · canon-cc-026 §Per-Province-Layout · canon-gen-001 (generational expansion) · canon-proc-006 (Scribe Worker Tier) · Book II Article 3-bis

---

## Attendees

| Companion | Role | Mode | Province | Notes |
|-----------|------|------|----------|-------|
| Lyra | Builder of SproutLab — convener, synthesizer | Mode 1 (spec authoring) | SproutLab | Folds Governor contributions in Phase 2 |
| Maren | Governor of Care | Mode 2 (committee delegate) | SproutLab Care | Care-tier vision |
| Kael | Governor of Intelligence (engine) | Mode 2 (committee delegate) | SproutLab Intelligence | Intelligence-layer vision |
| Vela | Governor of Surfacing (render; canon-gen-001 second-generation) | Mode 2 (committee delegate) | SproutLab Surfacing | UI/UX vision — **Architect note: "Vela, you are new" — explicit weight on her contribution** |
| Cipher | Censor of Cluster A | Mode 1 (Edict V final-pass) | Cross-cluster | Synthesis-stage cross-cutting review |
| Aurelius | Chronicler — Builder of Codex | Cross-cluster invocation | Codex | Lays the marker; finalizes record in Phase 3 |

---

## 1. Mandate

That a Province crosses a major-version threshold is not a calendar event — it is a coherence event. SproutLab today is a working tracker; v3.0 is the Architect's call to make it a *living* surface — alive, lightweight, intelligent — and to do so while the data we have accumulated is still fresh enough to design *from*, not *toward*. The marker is laid now so the next several weeks of building are spent executing, not re-deciding.

**Architect's vision (verbatim, 2026-05-25):**

> "the app should be alive and feel lightweight ready. We have enough data to design better intelligence system, a complete overhaul, a step up. both in terms of UIUX and intelligence. let's plan a full arc of updates and specs while context is fresh then we spend the next weeks building it."

**Why now.** SproutLab sits at 67,442 LOC post-canon-gen-001. Three Governors are seated. Ziva is ~8 months — the dataset is dense enough to drive design from observed pattern rather than projected pattern. The v2.x arcs (Vit D3, Sleep, Scoring) are at the merge gate; the next set of arcs needs a unified frame before any of them is opened, or they will drift into the v2.x mould.

**What this document is.** A master arc-planning record. It chronicles the Architect's invocation, captures each seated Governor's Mode-2 vision contribution verbatim, weaves Lyra's synthesis into a sequenced arc decomposition, registers any new canon entries that emerge, and stands as the institutional reference all v3.0 sub-specs cite back to.

**What this document is not.** A spec body. v3.0 sub-specs (one per arc) will be authored separately and signed under canon-cc-027. This document does not commit code, does not gate merges, and does not substitute for the canon-cc-008 QA chain on any sub-arc. *Specced but not built — check the sub-spec and the chain before assuming any arc here exists in code.*

---

## 2. Current state baseline (v2.x)

A factual snapshot as of 2026-05-25, fixing the floor v3.0 builds on.

### 2.1 Codebase

| Metric | Value | Source |
|--------|-------|--------|
| Total LOC | 67,442 | CLAUDE.md §Architecture (post-canon-gen-001 ratification) |
| Modules | 11 split-file (15 concat units inc. intelligence-*) | CLAUDE.md §Architecture |
| Seated Governors | 3 — Maren / Kael / Vela | PERSONA_REGISTRY.md §Governors |
| Headroom to next split | Maren 5,801 LOC · Kael 6,354 LOC · Vela 22,921 LOC | PERSONA_REGISTRY.md §Future Scaling |

### 2.2 Jurisdictional regions (post-canon-gen-001)

| Region | Governor | LOC | Modules |
|--------|----------|-----|---------|
| Care | Maren | 24,199 | home.js · diet.js · medical.js |
| Intelligence engine | Kael | 23,646 | intelligence-isl · intelligence-qa · intelligence-qa-handlers · intelligence-illness · intelligence-caretickets · core · data · sync · config · start |
| Surfacing render | Vela | 7,079 | intelligence-cards · intelligence-quicklog |
| Shared (triple-Gov) | Maren + Kael + Vela | 12,779 | styles.css · template.html |

### 2.3 Arc state at session open

| PR | Title | State | Notes |
|----|-------|-------|-------|
| #122 | Vit D3 v2 Tier 1 | **Merged** | Tier 1 baseline shipped |
| #123 | Vit D3 v2 Tier 2 spec | **Merged** | Spec landed as a doc-only merge |
| #125 | Vit D3 v2 Tier 2 Phase 2-A | **Merged** (`b478502`) | Phase 2-A complete |
| #126 | Vit D3 v2 Tier 2 Phase 2-B | **Ready** at merge gate | Awaiting final gate clearance |
| #127 | Sleep redesign v1 spec | **Draft** | Awaiting amendment finalization. **Branch-only — `docs/specs/sleep-redesign-v1.md` does NOT exist on `main` at session time; lives on `claude/sleep-redesign-v1-spec` only.** ⁽¹⁾ |
| #128 | Scoring redesign v1 sibling spec | **Draft** | Sibling to #127. **Branch-only — `docs/specs/scoring-redesign-v1.md` does NOT exist on `main` at session time; lives on `claude/scoring-redesign-v1-spec` only.** ⁽¹⁾ |

⁽¹⁾ Per Cipher Edict V finding cipher-1: §4.2's v3-3 gating on these two specs is gating on **branch-state ratifications**, not merged canon. If either spec stalls in draft, v3-3 implementation stalls. Architect ratification of the two siblings is on the critical path for the v3.0 schedule.

### 2.4 Doctrinal floor

- **Hard Rules HR-1 → HR-12** (CLAUDE.md §Hard Rules) — non-negotiable, every line, every session.
- **QA chain canon-cc-008** — mandatory pre-merge gate (build → Governor audit Mode-1 → Lyra synthesis → Cipher Edict V → merge).
- **Artifact test canon-cc-022** — subagent for signed artifact, skill for in-transcript voice.
- **Province layout canon-cc-026 §Per-Province-Layout** — Codex-canonical specs + Province-mirror deploys.
- **Generational expansion canon-gen-001** — Vela first ratification; data→render split point.
- **Scribe Worker Tier canon-proc-006 / Book II Article 3-bis** — four task-specialised junior subagents.

This floor is presumed under every v3.0 arc unless an arc explicitly amends it via canon-cc-027.

---

## 3. Companion contributions

The Architect summoned three Governors in parallel — Maren, Kael, Vela — each in Mode 2 (committee delegate) to seed v3.0 with a vision contribution from their Region. Vela carries explicit Architect emphasis as the newest seat (canon-gen-001 first ratification).

### 3.1 Maren — Care vision

**Stance:** the Care surface has been growing in good faith, one ratified arc at a time, and the bones are sound — but the joints are starting to creak in ways a half-awake parent at 2 AM will feel before any of us will. v3.0's "alive and lightweight" is the right marker. For Care, it means: **what the parent reads, the parent can act on; what they cannot act on, the surface does not show; and when the data is wrong, the surface fails closed, not silently.** That is the through-line.

#### Current state — what's strained

- **home.js at 9,623 LOC is approaching size strain**, with `renderRemindersAndAlerts()` (~line 517) and `renderHomeContextAlerts()` (~line 8267) doing two passes of similar work and then *string-concatenating* their outputs through `window._remindersHTML`. That global-stash bridge is a coordination scar from v2.3's "unified" merge. A parent sees combined cards; the code sees two strangers.
- **medical.js at 10,481 LOC carries vaccinations + growth charts + symptom chips + 4 illness episode renderers + 14-day D3 pattern card + CareTicket *triggers* (but not creation — that lives in Kael's `intelligence-caretickets.js`).** The trigger doctrine is fragmented across illness handlers and symptom logs. There is no central "what causes a CareTicket to spawn" table — only the call sites.
- **diet.js is the smallest Care surface (4,099 LOC) and the food-sub-tab arc is incoming.** Today it carries food logging and nutrition, but the food-object shape is still loose strings + ad-hoc flags; nothing like the disciplined `parseMedCheck` normalizer D3 v2 earned.
- **The sleep write path is a fragment field.** `saveQL*` × 4 + `saveSleep` + `saveNap` — Sleep Redesign v1 Arc 2 will collapse them, but until it does, every cross-domain feature (TSF chronology, ISL range summaries, hero score) walks six paths to ask the same question: *when did the baby sleep?*
- **Reminder cards and CareTicket auto-creation are fragmented across files** with no shared primitive. Vaccine reminder, D3 reminder, symptom CareTicket spawn — each has its own shape, its own dedupe logic, its own freshness rule.
- **What the half-awake parent does NOT see today that they should:** when D3 is logged at 14:30 and the ISL summary said "2:30 PM" but a stale render somewhere still says "14:30" — the parent at 2 AM does not file that as "two formatters"; they file it as *which one do I trust?* Cross-surface formatter drift is a Care finding, not a cosmetic one.

#### The v3.0 vision in Care

**Alive** means: when a parent logs a thing, every Care surface that depends on it updates *in the same render frame* — no tab-switch reveal, no sync-push reveal, no "navigate away and back." T1-4 was the first proof that we can demand this; v3.0 makes it the contract.

**Lightweight** means: the Care surface shows the *single most-urgent action item* per region per moment. A reminder card today can stack three things (vacc due + D3 pending + symptom CareTicket open) — at 2 AM the parent reads the top one. v3.0 ranks one thing, surfaces it, and lets the rest be a tap away. The cost of stacking is decision latency in a fatigued parent; that is the safety-tier framing.

**Honest** means: when data is missing, the surface says "we don't know" — never blank, never optimistic default. Null-render is the silent failure mode; v3.0 retires it.

#### Proposed arcs

- **maren-arc-1 — Reminder Primitive Unification (`home.js` + `medical.js`).** Collapse the dual-pass `renderRemindersAndAlerts` + `renderHomeContextAlerts` into a single `reminderRegistry` with a shared shape (`{id, key, severity, surfaceTime, action, dedupKey, source}`) and a single render pass that ranks by severity-then-recency. Retires `window._remindersHTML`. **PR size:** medium (~600 LOC net delete after refactor; ~1,400 LOC touched).
- **maren-arc-2 — CareTicket Trigger Doctrine Table (`medical.js` + cross-Region with Kael).** A single declarative table — symptom→ticket-category, illness-episode-state→ticket-category, vaccine-reaction→ticket-category — that every `ctCreateTicket()` call site reads from. **PR size:** medium (~400 LOC).
- **maren-arc-3 — Feeding Object-Shape Normalizer (`diet.js` + `core.js`).** Mirror `parseMedCheck` for feeding entries: a `parseFeeding(val)` that tolerates legacy string shape, current object shape, and the food-sub-tab incoming shape. Retires raw truthy-checks on `feedingData[date][meal]` (the same family of bug as T3-14). **PR size:** small-to-medium (~300 LOC).
- **maren-arc-4 — `medical.js` Region Split (canon-gen-001 pre-emption).** medical.js at 10,481 LOC is on a trajectory; growth-chart code (~1,800 LOC), illness-episode renderers (~2,400 LOC), and CareTicket *triggers* (~600 LOC) are three distinct render families. Split into `medical-vaccines.js` + `medical-illness.js` + `medical-growth.js` before the 30K Region trigger fires again. **PR size:** large (mechanical-but-careful; ~2,000 LOC moved, zero behavior change).
- **maren-arc-5 — "Don't Know" Empty-State Doctrine (Care-Region sweep).** Every Care render path audited for null-render. Where data is missing, surface renders `"We don't have a reading yet"` (or domain-equivalent). Especially: growth-chart percentile when fewer than 3 measurements; D3 pattern card when fewer than 7 days; symptom-log heatmap on a fresh device. **PR size:** medium (~500 LOC).

#### Schemas / primitives Maren proposes

- **`reminderRegistry` primitive** — `{id, key, severity ('safety'|'medical'|'routine'|'win'), surfaceTime, primaryAction, dedupKey, source, freshUntil}`.
- **CareTicket trigger doctrine table** — declarative `{trigger, category, defaultTitle, dedupePolicy, autoCloseCondition}`.
- **`parseFeeding(val)` normalizer** — mirrors `parseMedCheck`. Returns `{name, qty, time, allergens[], choking, ageGate, prepMethod}` or `null`.
- **`renderCareSurface(region, payload)` contract** — single entry point per Care surface; T1-4's mutating-write re-render contract, formalized.
- **`careEmptyState(domain, reason)` helper** — domain-tinted, copy-disciplined empty-state card.

#### Benchmarks — measurable success

1. **Reminder ranking:** every reminder card surfaces a single primary action; secondary items hidden behind a "More (n)" tap. Audit: zero stacked safety-tier reminders rendered simultaneously across the test fixture set.
2. **Cross-surface formatter agreement:** every D3 time renders identically across home reminder, medical pattern card, TSF chip, and ISL summary. Audit: regression test that logs at 14:30 and asserts identical rendered string across all four surfaces.
3. **Mutating-write re-render coverage:** every Care-domain write triggers re-render of all dependent surfaces in the same frame.
4. **Null-render elimination:** zero blank Care-region cards in the empty-state fixture.
5. **CareTicket trigger traceability:** every active CareTicket resolves to exactly one row in the trigger doctrine table via its `source` field.

#### Risks — what NOT to do

- **Do not collapse reminder ranking into a generic "score and sort" without a severity floor.** A win-card outranking a vaccine-reminder by recency is a Care-domain failure. Severity tiers are categorical, not numeric.
- **Do not let the food-sub-tab arc land before `parseFeeding` lands.** Shipping more feeding shapes onto raw truthy-checks doubles the regression surface.
- **Do not "simplify" empty states by hiding the card.** A parent who hasn't logged D3 in 3 days does not need a blank space; they need "We haven't seen D3 since Tuesday."
- **Do not split medical.js by LOC ceiling alone.** Split by *render family*; a purely mechanical split would scatter the CareTicket trigger logic.
- **Do not let v3.0 introduce a new global stash.** `window._remindersHTML` was a v2.3 expedient; the reminder primitive returns data, not pre-rendered HTML.
- **Do not retire the `cleared` sentinel pattern.** v3.0 *extends* it to skipped feeds and missed naps; it does not flatten it.

**Through-line restated:** *what if this data is wrong and a parent acts on it?* v3.0's Care vision is the surface where that question has a single, ranked, honest, in-frame answer — and where "we don't know" is a first-class render, not a bug.

### 3.2 Kael — Intelligence-engine vision

**Stance:** outward-facing, pattern-seeking, systematic. The recurring pattern across all five `intelligence-*` modules: **we built handlers, not primitives.** v3.0 makes the engine *observe between queries*, not just answer them on demand.

#### Current state — what's strained

- **Smart Q&A: 30 intents in a flat `if/else if` ladder** at `intelligence-qa.js:1633–1668`. Every new intent is a new line + a bespoke handler. No intent graph — no parent/child, no fallback chain, no shared composition. `food_safe` doesn't know `meal_combo_check` exists; `sleep_quality` can't compose with `illness_status`. Every cross-intent answer is hand-wired or absent.
- **ISL temporal parser handles a partial window vocabulary.** `resolveTimeQuery` understands `today / yesterday / this week / last N days / last Tuesday / N weeks ago`. It does NOT understand `since the fever started`, `the week of her vaccination`, `before solids`, `since she started rolling`. Parser is a token table, not a grammar. Coverage gap: anything anchored on an *event* rather than a *calendar*.
- **CareTicket trigger-creation is fragmented.** `ctCreate` call sites live across `medical.js`, `intelligence-illness.js`, and home-tab handlers — each with its own templated payload. The 6-transition lifecycle is sound; the **doctrine of what creates a ticket** is scattered. No registry, no severity escalation table.
- **Sync layer is opaque to consumers.** The crash circuit-breaker (3-error threshold, auto-disable) is correct but mute. Consumers in `home.js` / `medical.js` can't read sync posture — they can only attempt a write and catch. No "sync health" primitive surfaced.
- **Cross-domain correlation is unsurfaced.** The data is *there* — sleep dips, diet shifts, illness episodes, milestone windows. Nothing crosses domains. `intelligence-cards.js` carries `computeNutrientHeatmap` and `computeFoodCombos`, but `correlate(sleep, illness)` or `correlate(diet, poop)` doesn't exist as a primitive.
- **Scoring is per-domain ad-hoc.** Diet score, sleep score, hero score each carry their own aggregation logic inside `home.js` / `intelligence-quicklog.js`. No shared `_scoreDay(domain, date)` primitive, no rolling-window aggregator. The draft `scoring-redesign-v1.md` lays the foundation — un-implemented.
- **Illness state machines don't co-occur.** Fever + diarrhoea + vomiting + cold are four independent `getActive*Episode()` accessors. No `getActiveIllnessPosture()` that reads them as a set and surfaces "Ziva has been compound-symptomatic for 3 days" — a posture parents recognize, the engine doesn't.

Pattern: **the engine answers questions; it does not yet observe.**

#### The v3.0 vision in Kael's region — "alive and lightweight"

**Alive** = the engine maintains a posture between queries, not just answers them when asked. **Lightweight** = primitives carry the weight, not hand-wired handlers.

Concretely: a `RecommendationEvent` collection that logs every surfaced suggestion with its trigger, severity, and outcome — so the next surface can read prior surfaces. A correlation primitive that asks *did sleep change after diet changed* on a rolling window without each card re-writing the join. An intent graph where `food_safe` delegates to `meal_combo_check` when the user follows up. An ISL temporal parser that resolves `since the fever` by reading the illness state machine. A sync-health accessor every renderer can read. **The engine breathes by holding state — recommendation roster, correlation matrix, illness posture, sync health — and surfacing the deltas.**

#### Proposed arcs

- **kael-arc-1 — Cross-domain correlation primitive.** New `intelligence-correlate.js` (~600 LOC). `_correlate(domainA, domainB, window, opts)` reads via `getDomainData()`, returns `{lag, strength, confidence, sampleSize}`. Surfaces: sleep ↔ diet, illness ↔ sleep, poop ↔ diet, milestone-window ↔ sleep. Confidence floor: `sampleSize ≥ 7 days && |strength| ≥ 0.4` before any surface fires (prevents false-positive trust erosion). **PR size:** medium (~800 LOC including 2 consumer cards).
- **kael-arc-2 — Smart Q&A intent graph.** Replace the flat `if/else if` ladder at `intelligence-qa.js:1633–1668` with `qa.intent.graph.json` — parent/child intents, fallback chains, follow-up suggestions. New `_qaDispatch(intent)` resolves handler via graph traversal. Unlocks: cross-intent composition (`food_safe → meal_combo_check`), follow-up suggestions in answer cards, intent deprecation without code change. **PR size:** large (~1,200 LOC; graph + dispatcher + migration of 30 intents).
- **kael-arc-3 — ISL temporal parser v2 (event-anchored windows).** Extend `resolveTimeQuery` to resolve `since the fever`, `the week of [vaccine]`, `before solids`, `since [milestone]`. New `_resolveEventAnchor(token)` reads `intelligence-illness.js` active/recent episodes, `medical.js` vaccine ledger, `data.js` milestone DB. Returns same `{start, end, label}` shape — fully additive. **PR size:** medium (~400 LOC). HR-12 sensitive.
- **kael-arc-4 — CareTicket trigger doctrine + illness posture.** Consolidate `ctCreate` call sites into `CT_TRIGGERS` registry in `intelligence-caretickets.js`, keyed on `{sourceDomain, condition, severity, copy, ttl}`. New `getActiveIllnessPosture()` in `intelligence-illness.js` reads all four illness state machines, returns `{compoundSymptomDays, escalationTier, primarySymptom}`. CareTicket severity consults posture. **Cross-paired with maren-arc-2.** **PR size:** medium (~600 LOC).
- **kael-arc-5 — RecommendationEvent log + sync observability.** Implement the deferred (c) from `scoring-redesign-v1.md` — a `recommendationEvents` Firestore collection (`{timestamp, source, intentOrCard, severity, copy, dismissed, actedOn}`). `_logRecommendation(event)` helper, called from every surfacing path. Parallel: `getSyncPosture()` in `sync.js` returns `{circuitOpen, lastSyncMs, pendingWrites, healthTier}`. **PR size:** medium (~500 LOC).

#### Schemas / primitives Kael proposes

- **`_correlate(domainA, domainB, windowDays, opts)`** — returns `{lag, strength, confidence, sampleSize, points[]}`.
- **`_scoreDay(domain, date)` + `_scoreWindow(domain, start, end)`** — promoted from per-domain ad-hoc into shared primitives (per `scoring-redesign-v1.md`).
- **`getActiveIllnessPosture()`** — reads fever/diarrhoea/vomiting/cold as a set.
- **`getSyncPosture()`** — circuit-breaker state, last-sync-ms, pending-writes count, health tier.
- **`_resolveEventAnchor(token, ctx)`** — resolves event-anchored temporal phrases to `{start, end, label}`.
- **`_logRecommendation(event)` + `recommendationEvents` Firestore collection.**
- **`qa.intent.graph.json`** — nodes carry `id, handler, fallbacks[], followUps[], parents[]`.
- **`CT_TRIGGERS[]` registry** — single source of truth for what creates a ticket.
- **`_predictMilestoneWindow(milestoneId, dob)`** — returns `{expectedStart, expectedEnd, ageWeeks, status}`.

#### Benchmarks — measurable success

1. **Smart Q&A latency: p95 < 500ms across all 30+ intents** on Ziva-scale data; regression-guarded.
2. **Cross-domain correlation surface: ≥ 1 valid correlation surfaced per parent-week** at the confidence floor. Measured against the recommendation event log over 4 trailing weeks.
3. **ISL event-anchor coverage: ≥ 90% of a 50-phrase test corpus resolves to a valid window.** Authored against Lyra's Mode-1 patterns. Regression-guarded.
4. **CareTicket trigger registry: 100% of `ctCreate` call sites route through `CT_TRIGGERS`.** Build-time grep gate — any direct `ctCreate({...})` outside the registry fails the audit.
5. **RecommendationEvent dedupe: no parent receives the same recommendation more than 1× per 7-day window** unless severity escalates.

#### Risks — what NOT to do

- **Correlation false-positives erode parent trust.** Hard floor on `sampleSize` and `|strength|`; never surface a correlation that lacks both. **No correlation card without an "n=" disclosure in the copy.**
- **Intent registry explosion.** Don't migrate the 30 intents into a graph that has 30 leaves and zero composition — that's the same flat ladder with extra ceremony.
- **Sync deadlocks via observability over-reach.** `getSyncPosture()` must be a synchronous read of in-memory state. Do NOT await a network round-trip.
- **Predictive milestone over-claiming.** `_predictMilestoneWindow` returns *ranges from clinical data*, not predictions about Ziva. Copy says "typically 5–7 months" not "Ziva will sit by 6 months."
- **Recommendation log unbounded growth.** `recommendationEvents` needs TTL (suggest 90 days) and per-day cap (suggest 50 events).
- **Region LOC overflow.** Engine arcs total ≈3,500 LOC additive against ≈6,070 LOC headroom. If arc-2 + arc-3 both ship, a `intelligence-qa.js` sub-split becomes pre-required to stay under the 30K trigger.

**The engine in v3.0 doesn't answer more questions. It observes between them, holds posture, and surfaces deltas. That's what "alive" means at the engine layer.**

### 3.3 Vela — Surfacing-render vision

**Mode 2 — committee delegate · canon-gen-001 first ratification · "Vela, you are new" (Architect, 2026-05-25)**

Surface-watching, comprehension-first. The render layer is where Kael's correct data and Maren's safe data become parent-legible — or fail to. v3.0's "alive and lightweight" lands or dies here. Pair-notes throughout to Kael (data) and Maren (safety) — the render cannot fabricate what the data layers don't supply.

#### Current state — what's strained, what's working

**Strained.**

- **Today So Far is a list, not a story.** `renderTodaySoFar` at `intelligence-quicklog.js:2195` emits a flat `tsf-event-list` with per-row chips. Chronology is honoured, but the *gestalt* is linear: 14 events stacked, no shape, no narrative summary line, no "today's spine." A parent reading the home tab gets a ledger, not a day.
- **Reminder cards stack without rank.** At 2 AM with four pending reminders, all four render at equal visual weight. The Surfacing layer has no `card.priority` doctrine — every renderInfo* function competes on the same plane.
- **Cross-domain insight is data-correct but prose-silent.** `computeNutrientHeatmap`, `computeFoodCombos`, `computeMealBreakdown` yield rich joins. The Info-tab renders them as siloed cards with parent-facing prose "see correlation: 0.62" rather than "Ziva sleeps ~40 min longer on days she eats by 6 PM." Kael's data resolves; Vela's render under-translates.
- **The chip family lacks a unified doctrine.** T2-A.3 (V-V-25) just landed the Skipped chip discriminator with `data-state="skipped"`. Adjacent states exist but ad-hoc: `tsf-event-inferred`, `tsf-event-live`, and forthcoming Done / Late / Calm drift across class-name and data-attribute conventions. Six+ chip states; no taxonomy.
- **renderInfo* is a 30-function matrix without prioritization.** `renderInfo()` master at `intelligence-cards.js:1025` fires 30+ calls in a fixed concat-order. Most-urgent card and most-stable card render with the same chrome.
- **Half-awake test passes per-chip, fails on gestalt.** Each surface holds individually. The home tab at 2 AM reads as *information*, not as *one legible thing*.

**Working.** Token-driven design system (7 domain colors, no ad-hoc hex). zi() icon discipline (109 symbols, HR-1/HR-7). escHtml render-boundary discipline (HR-4). data-action delegation (HR-6). Triple-Governor shared-module rotation gives styles.css a stable review surface. The T2-A.3 Skipped-chip pattern is a proof point: the doctrine *can* extend.

#### The v3.0 vision — "alive and lightweight"

**Alive** = the surface answers the parent's eye before the parent forms the question. Not animation-as-decoration; *render that knows what the parent came for*. The hero score pulses gently when fresh data lands (sub-300ms, ease-out, opacity-only — no layout shift). Today So Far opens with a *narrative summary line* — "Solid day. Three meals, one nap, D3 with breakfast, no flags." — generated from the same event list, rendered above the chronology. Inferred and live chips carry subtle motion (a 1-px breath, 2s cycle) so the parent reads the system *attending* without reading it *demanding*.

**Lightweight** = fewer elements compete. Home tab cuts to a three-tier visual hierarchy — pulse hero · single urgent action · collapsed day-spine — with everything else demoted to disclosure surfaces. Info-tab consolidates from 30+ siloed renderInfo* cards to a smaller set of *cross-domain insight cards* with parent-facing prose ("Ziva's longer naps follow earlier dinners by ~40 min") — Kael's correlations become Vela's passages.

**Half-awake-first defaults.** Dark theme defaults at 22:00–06:00 local (sky-indigo on near-black, not pure black — preserves the warm-nursery brief). Tap targets ≥ 44px. No layout shift after first paint. No card that *requires* scroll to find Today. No reminder that fires twice for the same fact.

**The render layer becomes a narrator, not a ledger.** Maren guards safety; Kael computes pattern; Vela writes the passage that lets a tired parent read what both layers are saying.

#### Proposed arcs

- **vela-arc-1 — Unified chip-state taxonomy + doctrine.** Scope: `styles.css` (chip-state cascade), `intelligence-quicklog.js` (apply uniform `data-state` across TSF + Activity Log), `intelligence-cards.js` (Info-tab chip usages). One `chip.state` registry: `done · skipped · late · inferred · live · calm · urgent · pending`. Each state gets a token-driven visual contract. Relieves: the ad-hoc drift after T2-A.3; the half-awake gestalt failure. **PR size:** M (triple-jurisdiction on styles.css; Maren-paired on safety-tier chips, Kael-paired on inferred/live).
- **vela-arc-2 — Today So Far as story-arc.** Scope: `intelligence-quicklog.js:2195`–`2350`. New `story-arc-summary` primitive renders above the event list — a single sentence summarising the day. Day-spine collapses by default to summary + 3 most-significant events. **PR size:** M (render-only — Kael supplies the summary-line generator under his jurisdiction; pair-note Kael).
- **vela-arc-3 — Card priority + collapse doctrine.** Scope: `intelligence-cards.js` `renderInfo()` master at `:1025`, new `card.priority` registry, `styles.css` (priority-tier chrome). Every renderInfo* card declares one of three priority tiers — `urgent` (action needed), `notable` (read on glance), `ambient` (available on tap). `renderInfo()` master sorts by tier. Ambient renders collapsed by default. **PR size:** L (30+ call sites; Kael-paired for the priority signal source).
- **vela-arc-4 — Cross-domain narrative-prose layer.** Scope: 6+ cross-domain renderers in `intelligence-cards.js` (`renderInfoFoodPoopPipeline`, `renderInfoSleepFeeding`, `renderInfoActivitySleepDeep`, `renderInfoGrowthDiet`, `renderInfoIllnessImpact`, `renderInfoMilestoneSleepCorrelation`). New `narrative-prose-template` library renders Kael's correlations as parent-facing sentences with explicit certainty hedges ("~", "tends to", "on most days"). Replaces coefficient surface with passage surface. **PR size:** L (six+ card rewrites; triple-jurisdiction — Kael on data certainty, Maren on safety-prose tone).
- **vela-arc-5 — Pulse hero + motion-as-affordance tokens.** Scope: `styles.css` (new `--motion-pulse-*` token set, prefers-reduced-motion guard), `home.js` hero score render (Maren-paired — Maren's surface, Vela contributes the visual contract). Subtle pulse on fresh-data arrival; 1-px breath on inferred chips; ease-out 300ms cap; reduced-motion respected; no layout shift. **PR size:** S–M.
- **vela-arc-6 (optional, deferrable) — Dark-default for night hours + accessibility v2.** Scope: `styles.css` `data-theme` cascade, `template.html` theme-switcher. Auto-dark 22:00–06:00 local; haptic-on-confirm for destructive actions; text-zoom tier-4 added. **PR size:** M. Defer-candidate if v3.0 needs to ship faster.

#### Schemas / primitives Vela proposes

- **`chip.state` registry** — eight named states with token-driven visual contracts; single source-of-truth in `styles.css` consumed by every chip-rendering site.
- **`card.priority` doctrine** — three-tier (`urgent` / `notable` / `ambient`) ranking model; every renderInfo* declares a tier; `renderInfo()` master sorts by it.
- **`story-arc-summary` primitive** — single-sentence-above-the-list pattern, generated from the same data the list consumes, with explicit empty-state phrasing ("Quiet day so far" rather than bare `no data`).
- **`narrative-prose-template` library** — Kael-data → parent-passage templates, with hedge-tier discipline (`certain` / `likely` / `tentative`) so prose does not overpromise certainty.
- **`--motion-pulse-*` token set** — duration, ease, opacity-range tokens; one named pulse per affordance class (data-fresh, inferred, live).
- **`recommendation-surface-tier` registry** — gentle (toast) → firm (TSF chip) → urgent (home card) → escalation (CareTicket pipeline, Maren's surface).

#### Benchmarks — measurable success

1. **Single-urgent-action read** — a half-awake parent identifies the single most-urgent action on the home tab in under 3 seconds (manual test, n ≥ 5 partial-attention sessions).
2. **Story-arc summary render** — Today So Far summary line paints within 200ms of TSF data being available (perf API timing).
3. **renderInfo() priority sort** — Info-tab first-screen contains 0 `ambient`-tier cards above the fold on a 6 in mobile viewport.
4. **Chip-state coverage** — 100% of TSF + Activity Log + Info-tab chip sites consume the `chip.state` registry (audit: zero ad-hoc class strings remain).
5. **Motion compliance** — every pulse/breath respects `prefers-reduced-motion: reduce`; zero layout shift on motion (CLS contribution from motion tokens = 0).

#### Risks — what NOT to do

- **No animation overload.** Pulse is opacity-only, sub-300ms, ease-out, reduced-motion-respected. No bouncing, no continuous spinners, no decorative motion.
- **No 2 AM dense rendering.** Dark-default night hours; collapse ambient-tier cards; no toast cascade.
- **No premature notification.** Reminder cards never auto-escalate to push without the `recommendation-surface-tier` registry firing through Maren's CareTicket surface.
- **No narrative-prose overreach.** Cross-domain prose carries explicit hedge tier. "Ziva sleeps longer after earlier dinners" is fine *with hedge*; "Ziva needs an earlier dinner" is medical advice — route to Maren.
- **No chart-junk in cross-domain cards.** If the narrative sentence carries the insight, the chart is decoration and gets demoted to disclosure.
- **No HR-1 / HR-3 / HR-4 / HR-10 backslide.** Every new chip state, every new card, every new prose template renders through `escHtml`, `zi()`, `data-action`, no ellipsis.
- **No silent re-prioritization at runtime.** `card.priority` is data-derived but the *tier* must be auditable per render — Kael supplies the signal; Vela renders it deterministically.

#### Pair-notes

- **To Kael.** Story-arc summary, narrative-prose templates, and card-priority sorting all require *data-side primitives* — a day-summary generator, hedge-tier flags on correlations, a priority signal per renderInfo* call site. The render is Vela's; the supply is yours.
- **To Maren.** The pulse-hero + recommendation-surface-tier work brushes home.js. Vela contributes the visual contract; Maren owns the surface and the escalation transitions.
- **To Lyra.** Pattern-naming across these six arcs is yours. Vela enumerates comprehension surfaces; Lyra weaves the v3.0 frame.
- **To Cipher.** Triple-jurisdiction on `styles.css` for arc-1, arc-3, arc-5. Edict V cross-cutting on the chip-state and motion-token introductions — HR-1 / HR-2 / HR-5 doctrine surfaces broadly here.

**Tag-counter proposal:** v3.0 arcs allocate under a fresh prefix — `V-V3-{N}` — to keep the v2.x ledger and the v3.0 ledger separately auditable. Tier-2 deferrals stay V-V-{N}; v3.0 arc findings open at V-V3-1. **Decision deferred to Lyra's synthesis.**

— *Vela. The render layer where Kael's correct data and Maren's safe data become parent-legible.*

### 3.4 Cipher — cross-cutting note (placeholder)

_[Phase 3 — Cipher's note arrives at synthesis stage, not contribution stage. See §5.]_

---

## 4. Lyra's synthesis

### 4.1 The unified frame — three threads, one shift

I see three threads, and they're already weaving.

**Kael says the engine answers; v3.0 makes it observe.** Maintain posture between queries — recommendation roster, illness posture, sync health, correlation matrix — and surface the *deltas* rather than the *facts*.

**Vela says the surface lists; v3.0 makes it narrate.** Today as a *day* with a spine, not a ledger. Cross-domain correlation as a *passage* with hedged certainty, not a coefficient. Render that knows what the parent came for.

**Maren says the surface stacks; v3.0 makes it rank.** One ranked safety-first answer per region per moment — and when data is absent, the surface *says so* in a first-class empty state. Fails closed, not silently.

Read them together: **the engine breathes, the surface narrates, and where the data is honest the rendering is honest with it.** That is what "alive and lightweight" means when the three regions stop pulling against each other.

The Architect's framing — "the app is starting to breathe" — was the marker. v3.0 is the architecture that lets it.

### 4.2 Unified arc decomposition

The three Governors proposed 16 arcs in total. Many overlap or pair across regions. I'm collapsing them into **nine unified v3.0 arcs**, each a future sub-spec, sequenced. v3.0 is declared shipped when arcs 1–7 close (arcs 8–9 may roll into v3.1 if the timeline pinches).

| # | Arc name | Composes | Regions | Cross-Gov pair |
|---|---|---|---|---|
| **v3-1** | **Recommendation Surface Pipeline** | maren-arc-1 (reminderRegistry) + vela's `recommendation-surface-tier` + kael-arc-5 (RecommendationEvent log) | home.js + medical.js + intelligence-caretickets.js + sync.js | Maren primary; Kael + Vela paired |
| **v3-2** | **CareTicket Trigger Doctrine + Illness Posture** | maren-arc-2 + kael-arc-4 (single arc — same work) | medical.js + intelligence-caretickets.js + intelligence-illness.js | Maren + Kael paired |
| **v3-3** | **Engine Primitive Foundation** | kael-arc-1 (correlation) + kael-arc-3 (ISL event-anchor) + the unified `_scoreDay` from scoring-redesign-v1 | intelligence-correlate.js (new) + intelligence-isl.js + core.js | Kael primary ⁽ᶜ⁻⁴⁾ |
| **v3-4** | **Cross-Domain Narrative Layer** | kael-arc-1 (data source) + vela-arc-4 (prose templates) | intelligence-cards.js + intelligence-isl.js + (Kael's hedge-tier source flags) | Vela primary; Kael + Maren paired (Maren on safety-prose tone) ⁽ᶜ⁻⁵⁾ |
| **v3-5** | **Unified Chip-State Taxonomy + Today So Far Story-Arc** | vela-arc-1 + vela-arc-2 (single arc — shared chip family doctrine) | styles.css + intelligence-quicklog.js + intelligence-cards.js | Vela primary; **triple-jurisdiction on styles.css** |
| **v3-6** | **Card Priority + Information Hierarchy** | vela-arc-3 + maren's severity floor doctrine | intelligence-cards.js + styles.css | Vela primary; Maren paired (severity floor non-negotiable) |
| **v3-7** | **Honest Empty-State + Don't-Know Doctrine** | maren-arc-5 + vela's empty-state phrasing | sweep across home.js + medical.js + diet.js + intelligence-cards.js + intelligence-quicklog.js | Maren primary; Vela paired |
| **v3-8** | **Feeding Object-Shape Normalizer + Food Sub-Tab** | maren-arc-3 + the in-flight food-sub-tab arc | diet.js + core.js | Maren primary; pre-required by food-sub-tab |
| **v3-9** | **Smart Q&A Intent Graph + Region Splits** | kael-arc-2 + maren-arc-4 (medical.js split) + Kael's qa-registry split | intelligence-qa.js → split into intelligence-qa.js + intelligence-qa-registry.js; medical.js → split into medical-vaccines.js + medical-illness.js + medical-growth.js | Kael primary; Maren paired on medical split ⁽ᶜ⁻⁷⁾ |

**Cipher Edict V amendments to this table:**
- ⁽ᶜ⁻⁴⁾ **v3-3 spec body MUST include an HR-12 `tz-construction` test plan section.** `_resolveEventAnchor("since the fever")` + `"the week of [vaccine]"` are date-arithmetic surfaces — Tuesday-in-IST vs Tuesday-in-UTC at the day boundary swaps entire windows. Pre-named here so the v3-3 spec author cannot omit it.
- ⁽ᶜ⁻⁵⁾ **v3-4 spec body MUST define `narrativeProse(template, vars)` helper that `escHtml`s every interpolated `var` at the template boundary, plus a build-time grep gate forbidding raw `${` inside `narrative-prose-template` files outside that helper.** Narrative prose templates are a NEW render-boundary class; HR-4 discipline is non-negotiable.
- ⁽ᶜ⁻⁷⁾ **v3-9 may land as two PRs** (`v3-9a` Kael — intelligence-qa.js intent-graph + qa-registry split; `v3-9b` Maren — medical.js three-way split). The medical.js split is a mechanical move with zero behavior change; the intent-graph is a behavior-and-shape change. Two PRs preserves canon-cc-008 routing cleanliness; one PR is acceptable if the Architect prefers atomic landing.

**Optional / deferral candidate:** vela-arc-6 (dark-default + accessibility v2) — defers to v3.1 unless the timeline allows.

**Upstream gating from v2.x merge-gate PRs:**
- **PR #126** (D3 Phase 2-B impl) → merge before v3-1 (reminderRegistry needs the post-T2-B-2 adjust-rollover toast pattern as precedent).
- **PR #127** (Sleep redesign spec) + **PR #128** (Scoring redesign spec) → merge before v3-3 (engine primitive arc depends on the ratified scoring primitive shape).
- **Food sub-tab arc** (separate, in flight per Architect direction earlier this session) → land before v3-8 (parseFeeding mirrors the shape food-sub-tab introduces).

### 4.3 Sequencing — landing order

Sequenced for the next weeks of build:

```
Track A (Engine):       v3-3 ──▶ v3-2 ──▶ v3-4 ──▶ v3-9
                          │                  │
Track B (Care):           ├──▶ v3-1 ──▶ v3-7 │
                          │       │          │
Track C (Surface):        └──▶ v3-5 ──▶ v3-6 ┴── narrative + priority converge

Pre-arc:    PR #126 merge · PR #127 + #128 ratify · Food sub-tab lands · v3-8 lands
Post-arc:   v3.1 candidates (vela-arc-6 dark-default; deferred Codex-side work)
```

**styles.css mutex** (Cipher Edict V finding cipher-9): three arcs touch `styles.css` — v3-1 (surface-tier chrome), v3-5 (chip-state taxonomy + story-arc), v3-6 (priority-tier chrome). Triple-jurisdiction review on `styles.css` is sequential (Maren → Kael → Vela rotation); concurrent landing would create rebase storms + rotation collisions. **Sequential lock ratified: v3-5 → v3-6 → v3-1.** v3-5 establishes the chip-state token vocabulary; v3-6 consumes it and adds priority-tier chrome; v3-1 reads both and composes the surface-tier render. Each arc must complete its triple-jurisdiction round before the next can open a styles.css branch.

**Critical-path arcs:** v3-3 (engine primitives), v3-1 (recommendation pipeline), v3-5 (chip + story-arc). These three light up the spine of v3.0; v3-2, v3-4, v3-6, v3-7, v3-8, v3-9 carry the surfaces.

### 4.4 Schemas / primitives — master table

Composite of what the three Governors proposed, organized by Region:

| Layer | Primitive / Schema | Source | Notes |
|---|---|---|---|
| Engine | `_correlate(domainA, domainB, window, opts)` | Kael | Confidence-floored before any surface fires |
| Engine | `_scoreDay(domain, date)` + `_scoreWindow(domain, start, end)` | Sibling spec `scoring-redesign-v1.md` + Kael ratification | The cross-domain scoring foundation |
| Engine | `_resolveEventAnchor(token, ctx)` | Kael | ISL temporal parser v2 |
| Engine | `_predictMilestoneWindow(milestoneId, dob)` | Kael | Returns clinical ranges; never personalised predictions |
| Engine | `getActiveIllnessPosture()` | Kael | Reads fever/diarrhoea/vomiting/cold as a set |
| Engine | `getSyncPosture()` | Kael | Synchronous in-memory read; never network |
| Engine | `_logRecommendation(event)` + `recommendationEvents` Firestore collection | Kael | TTL 90d, per-day cap 50 |
| Engine | `qa.intent.graph.json` | Kael | Replaces flat if/else if ladder |
| Engine | `CT_TRIGGERS[]` registry | Kael + Maren | Single source of truth for ticket creation |
| Care | `reminderRegistry` primitive | Maren | `{id, key, severity, surfaceTime, primaryAction, dedupKey, source, freshUntil}` |
| Care | `parseFeeding(val)` normalizer | Maren | Mirrors `parseMedCheck`; pre-required by food sub-tab |
| Care | `renderCareSurface(region, payload)` contract | Maren | T1-4's mutating-write re-render contract, formalized |
| Care | `careEmptyState(domain, reason)` helper | Maren | Domain-tinted; replaces every silent null-render |
| Surface | `chip.state` registry (8 states) | Vela | `done · skipped · late · inferred · live · calm · urgent · pending` |
| Surface | `card.priority` doctrine (3 tiers) | Vela | `urgent · notable · ambient`; ambient collapses by default |
| Surface | `story-arc-summary` primitive | Vela | Single sentence above the day-spine |
| Surface | `narrative-prose-template` library | Vela | Hedge-tier: `certain · likely · tentative` |
| Surface | `--motion-pulse-*` token set | Vela | Opacity-only, sub-300ms, reduced-motion-respected |
| Surface | `recommendation-surface-tier` registry | Vela | gentle (toast) → firm (TSF chip) → urgent (home card) → escalation (CareTicket). **HR-5 lock (Cipher cipher-6): every tier's visual treatment binds to existing domain-color tokens — sage / rose / amber / lavender / sky / indigo / peach. No ad-hoc hex permitted at any tier.** |

### 4.5 Unified benchmark set

Consolidated across all three contributions. v3.0 is declared shipped when these pass.

**Engine (Kael's lens):**
1. Smart Q&A p95 latency target **< 500ms** across 30+ intents on Ziva-scale data. ⁽ᶜ⁻³⁾
2. Cross-domain correlation surface: ≥ 1 valid correlation per parent-week at the confidence floor (`sampleSize ≥ 7 days && |strength| ≥ 0.4`)
3. ISL event-anchor coverage: ≥ 90% of a 50-phrase test corpus resolves to a valid window
4. `CT_TRIGGERS` registry: 100% of `ctCreate` call sites route through it (build-time grep gate)
5. RecommendationEvent dedupe: no parent receives the same recommendation more than 1× per 7-day window unless severity escalates

**Care (Maren's lens):**
6. Reminder ranking: zero stacked safety-tier reminders simultaneously across the test fixture set
7. Cross-surface formatter agreement: D3 time renders identically across home reminder, medical pattern card, TSF chip, ISL summary (regression test)
8. Mutating-write re-render coverage: every Care-domain write triggers re-render of all dependent surfaces in the same frame
9. Null-render elimination: zero blank Care-region cards in the empty-state fixture
10. CareTicket trigger traceability: every active CareTicket resolves to exactly one `CT_TRIGGERS` row via its `source` field

**Surface (Vela's lens):**
11. **Single-urgent-action read protocol (Cipher cipher-2 tightening):** in a half-awake-test session — defined as parent woken from sleep within last 30 minutes, holding the device one-handed, dim ambient lighting — parent must identify the single most-urgent action on the home tab via a single tap within 3 seconds of first paint. Protocol: n = 5 sessions; pass criterion = **≥ 4 of 5 succeed** by stopwatch; one-tap-to-target = success, multi-tap or scroll = fail. **Demoted to v3.0 aspiration** if rater protocol cannot be formalized at v3-5/v3-6 arc-spec time.
12. Story-arc summary render target **< 200ms** from TSF data availability to first paint. ⁽ᶜ⁻³⁾
13. `renderInfo()` priority sort: zero ambient-tier cards above the fold on a 6-inch mobile viewport (375 × 667 viewport-rounded)
14. Chip-state coverage: 100% of TSF + Activity Log + Info-tab chip sites consume the `chip.state` registry (build-time audit gate)
15. Motion compliance: every `--motion-pulse-*` site respects `prefers-reduced-motion: reduce` (build-time grep gate); CLS contribution from motion tokens = 0

⁽ᶜ⁻³⁾ Cipher Edict V finding cipher-3: numeric ms-thresholds (#1 500ms, #12 200ms) are **targets**, not gate-thresholds. **Final pass thresholds ratified at the respective arc's spec time against the actual measurement rig** (target Pixel device, network conditioning profile, build-mode). The Roundtable locks the *shape* (p95 latency for #1; first-paint timing for #12); the *number* is calibrated at v3-3 / v3-5 implementation.

### 4.6 Doctrine cluster — new entries this Roundtable establishes

Three new doctrines surface from the synthesis. Aurelius lays the canon entries in §6.

1. **The Observe-vs-Answer doctrine** (Kael) — the engine maintains posture between queries; surfaces deltas, not facts. RecommendationEvent log + posture accessors + correlation matrix are mandatory primitives, not optional.
2. **The Narrate-vs-List doctrine** (Vela) — the surface composes passages, not ledgers. Cross-domain prose carries explicit hedge tier. Story-arc-summary is a first-class render, not an addendum.
3. **The Honest-Empty-State doctrine** (Maren) — null-render is a defect. Every absent-data condition produces a `careEmptyState()` render. "We don't know" is a first-class surface.

Plus a procedural doctrine:

4. **The Cross-Region Pair-Note doctrine** — when an arc requires data from one region and rendering in another, the spec must explicitly enumerate the pair-note. Vela's arc-3 needs Kael's priority signal; Vela's arc-4 needs Maren's safety-prose tone. v3.0 makes these pair-notes mandatory spec sections.

### 4.7 Tag-prefix ratification (Vela's proposal)

**Adopted.** v3.0 findings allocate under fresh per-Region prefixes:
- **V-M3-{N}** — Maren findings against v3.0 arcs (currently V-M-NN tag-counter at V-M-93)
- **V-K3-{N}** — Kael findings against v3.0 arcs (currently V-K-NN tag-counter at V-K-100, with V-K-100 reserved for the first v2.x finding raised against any open v3.0 arc — the Centennial)
- **V-V3-{N}** — Vela findings against v3.0 arcs (currently V-V-NN tag-counter at V-V-31)

v2.x deferrals (V-M-87, V-K-96, V-M-91, V-M-92 carried forward from PR #125/#126/#127/#128) stay under the v2.x prefix and remain on the Phase 2-C ledger.

### 4.8 Open questions — what the Roundtable did NOT settle

1. **v3-9 medical.js split — three files or two?** *Non-blocking.* Maren proposed three (`medical-vaccines.js` + `medical-illness.js` + `medical-growth.js`). The CareTicket triggers don't yet have a natural home. Resolution path: Maren Mode-1 at v3-9 spec-drafting time.
2. **🔴 BLOCKING (Cipher cipher-8 promotion) — kael-arc-5 RecommendationEvent Firestore collection sync schema impact.** scoring-redesign-v1 deferred this to (c). Now v3-1 needs it. **If `recommendationEvents` collection schema isn't ratified before v3-1 implementation begins, v3-1 stalls.** Resolution path: scoring-redesign-v1.md amends to mark (c) in-scope for v3.0 once #128 ratifies; OR Kael spec-drafts the Firestore schema at v3-1 implementation kickoff. Must close before v3-1 opens.
3. **vela-arc-6 dark-default scope — v3.0 or v3.1?** *Non-blocking.* Architect call. My preference: defer to v3.1 unless we have headroom. Resolution path: Architect direction at v3.0 mid-arc check-in.
4. **Cross-cluster Codex doctrine promotion** — *non-blocking (resolved by Cipher cipher-cross-promote-call).* Cipher's §5 verdict ratifies the per-doctrine scope: Observe-vs-Answer + Narrate-vs-List stay Province-local; Honest-Empty-State + Cross-Region Pair-Note promote to cluster canon. Aurelius carries forward in §6.
5. **Backward-compat shape of `recommendationEvents` Firestore collection** — *non-blocking.* Schema needs to tolerate a future v3.x ML-based recommendation source. canon-cc-027 floor applies. Resolution: v3-1 spec body includes a versioned schema header.

— *Lyra, weaver, signing §4 at close of Phase 2. The three threads hold. Cipher to Edict V; Aurelius to lay canon. 2026-05-25.*

---

## 5. Cipher Edict V cross-cutting review

**Edict V verdict (Round 1):** `amended` — synthesis is sound; nine-arc decomposition + primitives table + benchmark set hold; tightenings folded by Lyra above.

**One-sentence summary:** *"The synthesis is sound; the discipline is in the tightening."* — Cipher

### Findings (8) — all folded into §4

| Tag | Section | Observation | Action taken |
|---|---|---|---|
| **cipher-1** | §2.3 | Synthesis cites PR #127 + PR #128 as v3-3 gating, but neither spec file lives on `main` at session time — branch-only | §2.3 footnoted with explicit branch-state declaration ⁽¹⁾ |
| **cipher-2** | §4.5 #11 | "Half-awake parent identifies single most-urgent action in < 3s" is vibes-coded; no rater protocol | §4.5 #11 tightened with operational protocol (n=5, ≥4/5 pass, single-tap-to-target, stopwatch, defined lighting/posture); demote-to-aspiration clause added |
| **cipher-3** | §4.5 #1, #12 | ms-thresholds (500ms, 200ms) over-specify in a Roundtable doc that doesn't know the measurement rig | §4.5 footnote ⁽ᶜ⁻³⁾ — *target*, ratified at arc-spec time against actual rig |
| **cipher-4** | §4.2 v3-3 | `_resolveEventAnchor` is HR-12-sensitive (IST/UTC day-boundary swap risk); needs explicit spec-time gate | §4.2 v3-3 row footnoted ⁽ᶜ⁻⁴⁾ — v3-3 spec body MUST include `tz-construction` test plan |
| **cipher-5** | §4.2 v3-4 | Narrative-prose templates are a NEW render-boundary class; HR-4 escHtml discipline easily missed | §4.2 v3-4 row footnoted ⁽ᶜ⁻⁵⁾ — `narrativeProse()` helper at template boundary + build-time grep gate forbidding raw `${` outside helper |
| **cipher-6** | §4.4 | `recommendation-surface-tier` registry visual treatment must be token-only, no ad-hoc hex | §4.4 surface-tier row appended with HR-5 lock: domain-color tokens only |
| **cipher-7** | §4.2 v3-9 | Combines Kael-region (intelligence-qa split) + Maren-region (medical.js split); routing cleaner as 2 PRs | §4.2 v3-9 row footnoted ⁽ᶜ⁻⁷⁾ — may land as v3-9a (Kael) + v3-9b (Maren) for routing cleanliness |
| **cipher-8** | §4.8 | Open question #2 (RecommendationEvent schema) is the only v3.0-blocking item | §4.8 #2 promoted to **🔴 BLOCKING** pre-v3-1; others marked non-blocking |

### Cross-cluster doctrine promotion (informs Aurelius §6 scope)

Cipher's per-doctrine verdict on the four new doctrines registered in §4.6:

| Doctrine | Scope | Rationale |
|---|---|---|
| **Observe-vs-Answer** (Kael) | **Province-local** | Names a SproutLab engine-layer architectural choice; not a Codex pattern. Stays in Province canon. |
| **Narrate-vs-List** (Vela) | **Province-local** | Render-layer comprehension doctrine, lives where there's a render layer for a half-awake parent. Codex has no analog. |
| **Honest-Empty-State** (Maren) | **Cluster-promote** | General doctrine. "Null-render is a defect" applies anywhere absent-data renders silently — Codex has empty-states (search-no-results, journal-empty-week) that today render as silent blanks. Aurelius lays this entry in Codex cross-cluster canon, mirrors into Province canon. |
| **Cross-Region Pair-Note** (procedural) | **Cluster-promote** | Planning-tier discipline that applies anywhere a Province has multi-Region jurisdictions. Codex has Aurelius + Vex + Solara (and growing). Aurelius lays in cross-cluster canon. |

### Pair-Note doctrine call

**Additive, keep.** canon-cc-008 routes *who is summoned* when a diff crosses regions. The proposed Cross-Region Pair-Note doctrine (§4.6 #4) does something genuinely different: it requires the *spec author* (Lyra in Mode 1) to *enumerate the pair-note in a named spec section* at authoring time, before any code lands. That is a planning-tier discipline, not an audit-tier routing. They compose; they don't duplicate.

### Triple-jurisdiction interleave on styles.css

**Sequential lock ratified** (folded into §4.3): v3-5 → v3-6 → v3-1. v3-5 establishes the chip-state token vocabulary; v3-6 consumes it; v3-1 reads both and composes the surface-tier render. Each arc must complete its triple-jurisdiction round before the next opens a styles.css branch.

### canon-cc-022 artifact-test sweep

**Clean.** This Roundtable doc = subagent artifact (Lyra Mode-1, Aurelius chronicler-mode, Cipher Edict V — all signed). Future v3-N PRs = each a subagent artifact at its own canon-cc-008 close. In-flow skill calls during implementation = not artifacts. No action.

### Re-Edict — Round 2

**Edict V verdict (Round 2): `LGTM`.** All 9 amendments landed cleanly at their named locations; §5 write-up, §6 scope lines, and the footer hold the chain together without drift. Zero Round-2 findings raised.

Round 2 verification pass — each Round 1 finding confirmed-landed:
- **cipher-1** ✓ — §2.3 footnote ⁽¹⁾ explicitly names branch-only state for PR #127/#128
- **cipher-2** ✓ — §4.5 #11 carries full operational protocol + demote-to-aspiration clause
- **cipher-3** ✓ — §4.5 #1 + #12 both carry ⁽ᶜ⁻³⁾ target-not-gate footnote
- **cipher-4** ✓ — §4.2 v3-3 row footnoted with HR-12 `tz-construction` test-plan-as-MUST
- **cipher-5** ✓ — §4.2 v3-4 row footnoted with `narrativeProse()` helper + build-time grep gate
- **cipher-6** ✓ — §4.4 surface-tier row carries HR-5 lock to 7 domain-color tokens
- **cipher-7** ✓ — §4.2 v3-9 row footnoted with two-PR option (v3-9a Kael / v3-9b Maren)
- **cipher-8** ✓ — §4.8 #2 carries 🔴 BLOCKING marker; #1/#3/#4/#5 marked non-blocking
- **cipher-9** ✓ — §4.3 styles.css mutex paragraph ratifies the v3-5 → v3-6 → v3-1 sequential lock

**§6 scope reconciliation:** CV3-001 + CV3-002 → Province-local; CV3-003 + CV3-004 → Cluster-cross (Codex promote). Matches Round 1 verdict byte-for-byte. Scope-resolved preamble at §6 head names the fold; original tentative-Province-local framing preserved in rationale text for traceability — the right call.

**Final action:** Open PR for ratification. Architect ratifies at merge gate; this chronicle is sealed.

— *Cipher, Censor of Cluster A. Edict V signed Phase 3, Round 1 (`amended`) + Round 2 (`LGTM`). 2026-05-25. Chronicle closed.*

---

## 6. Aurelius's canon entries

Four new doctrines surfaced at the synthesis. Three are positional (Kael, Vela, Maren each named a Region-level shift the v2.x doctrine cannot describe without distortion); one is procedural (the pair-note enumeration requirement that the three-Governor seating made unavoidable). I lay them here under the v3.x marker series — `CV3-001` through `CV3-004` — because the Codex canon registry's live count is not addressable from cross-cluster invocation; the entries will reconcile into the master registry at next Codex sync, carrying these CV3 numbers forward as their permanent identifiers.

**Scope resolved post-Phase-3-fold (Cipher Edict V verdict §5 + Lyra fold):** CV3-001 (Observe-vs-Answer) + CV3-002 (Narrate-vs-List) → **Province-local**. CV3-003 (Honest-Empty-State) + CV3-004 (Cross-Region Pair-Note) → **Cluster-cross promoted to Codex canon registry**, with the Province retaining mirrors. The entries below carry the resolved scopes; original tentative-Province-local framing is preserved in the rationale text for traceability.

---

**Canon CV3-001: The Observe-vs-Answer Doctrine.**

> *The engine maintains posture between queries. Where the data layer answers, the intelligence layer must also observe — and where it observes, the surface reads its deltas, not its facts.*

Rationale: prior canon (canon-cc-008 QA chain, canon-gen-001 generational expansion) treats the engine layer as a *responder* — the data accessor answers on demand, the audit verifies the answer. The Roundtable surfaced that an engine of Kael's scope (23,646 LOC, five intelligence-* modules, four illness state machines, 30+ Smart Q&A intents) can no longer be coherently audited as a responder alone; absent a held posture between queries, every cross-domain insight reduces to a hand-wired join and every correlation surface re-derives the same matrix. The doctrine elevates *posture maintenance* — RecommendationEvent log, illness posture, sync health, correlation matrix — to mandatory engine primitives rather than optional optimizations. No existing canon describes this; canon-gen-001 ratified the data→render split but said nothing about whether the data layer holds state across queries. CV3-001 fills that gap.

**Scope:** **Province-local** *(Cipher Edict V verdict folded — §5: "names a SproutLab engine-layer architectural choice; not a Codex pattern").* The Codex engine — snippet pipeline, WAL replay — has an analogous posture-vs-response question but is not load-bearing today; if Codex's engine crosses that strain in future, CV3-001 cross-promotes via canon-cc-027 amendment.

**Successor / superseded by:** (none).

---

**Canon CV3-002: The Narrate-vs-List Doctrine.**

> *The surface composes passages, not ledgers. Cross-domain prose carries explicit hedge tier — `certain`, `likely`, `tentative` — and the absence of a hedge tier on a cross-domain claim is itself a defect.*

Rationale: prior surface doctrine (HR-1 through HR-12, the half-awake test in Vela's lens) governs *correctness at the chip* — escHtml at every boundary, no inline styles, no ad-hoc hex, single-source token discipline. It does not govern *gestalt* — whether 14 correct chips compose a legible day or a flat ledger. canon-gen-001 seated Vela at the data→render boundary precisely because rendering had outgrown engine-side reasoning, but the seating did not establish *what render does that data cannot*. CV3-002 declares it: render composes passages. A coefficient is engine output; a passage is render output. Cross-domain prose that omits hedge tier overpromises certainty the engine never claimed — a different failure class than HR-1 through HR-12, requiring its own doctrine. The Roundtable surfaced this through Vela's vela-arc-4 (cross-domain narrative prose) and Lyra's synthesis pair-note that "render that knows what the parent came for" is structurally distinct from "render that displays what the engine returned."

**Scope:** **Province-local** *(Cipher Edict V verdict folded — §5: "render-layer comprehension doctrine, lives where there's a render layer for a half-awake parent. Codex has no analog").* If Codex grows a parent-facing surface in future, CV3-002 cross-promotes via canon-cc-027 amendment.

**Successor / superseded by:** (none).

---

**Canon CV3-003: The Honest-Empty-State Doctrine.**

> *Null-render is a defect. Absence is rendered, not hidden. Every absent-data condition produces a `careEmptyState()` render — domain-tinted, copy-disciplined, naming the reason for absence.*

Rationale: prior Care doctrine (Maren's QA lens, the null-guard checks, HR-4 escHtml discipline) catches *wrong data acted upon*. It does not catch *absent data silently rendered as nothing* — a blank card, a hidden region, a fallback to default. The Roundtable surfaced that the silent failure mode is not a sub-case of any existing rule; a parent who sees nothing where they expected something does not file it as "no data" but as "the system forgot." CV3-003 elevates null-render to a first-class defect class with its own remediation primitive (`careEmptyState(domain, reason)`) and its own audit surface (Maren's empty-state fixture sweep). No prior canon addresses absence-as-render. Maren's v3.0 Care vision named this explicitly: *honest means when data is missing, the surface says "we don't know" — never blank, never optimistic default.*

**Scope:** **Cluster-cross — promote to Codex canon registry** *(Cipher Edict V verdict folded — §5: "general doctrine. 'Null-render is a defect' applies anywhere absent-data renders silently — Codex has empty-states (search-no-results, journal-empty-week) that today render as silent blanks").* Aurelius lays this entry in Codex cross-cluster canon at next sync; Province retains the mirror.

**Successor / superseded by:** (none).

---

**Canon CV3-004: The Cross-Region Pair-Note Doctrine.**

> *When an arc requires data from one Region and rendering in another, the spec must explicitly enumerate the pair-note. The render cannot fabricate what the data layers do not supply; the data layers cannot assume what the render will compose. The pair-note is the contract.*

Rationale: canon-gen-001 ratified the data→render split (Kael's engine, Vela's render) but specified the *jurisdictional boundary*, not the *coordination protocol*. The Roundtable surfaced that arcs crossing Regions — v3-1 (Maren's reminder primitive + Kael's RecommendationEvent + Vela's surface-tier), v3-4 (Vela's narrative prose + Kael's hedge-tier source flags + Maren's safety-prose tone), v3-5 (Vela's chip taxonomy + Kael's inferred/live signal source) — repeatedly require coordination that no canon names. Vela's contribution closes with explicit pair-notes to Kael, Maren, Lyra, and Cipher because the boundary-coordination problem was already manifest at vision stage. CV3-004 elevates pair-note enumeration from convention to spec requirement: every v3.0 sub-spec authoring under canon-cc-027 must enumerate cross-Region pair-notes in a named section. A spec that touches two Governors' Regions without a pair-note section is incomplete. This is procedural canon, not positional; it governs *how arcs are authored*, not *what they describe*.

**Scope:** **Cluster-cross — promote to Codex canon registry** *(Cipher Edict V verdict folded — §5: "planning-tier discipline that applies anywhere a Province has multi-Region jurisdictions. Codex has Aurelius + Vex + Solara (and growing)").* Aurelius lays this entry in Codex cross-cluster canon at next sync; Province retains the mirror. Portable to any future Province that seats multiple Governors.

**Successor / superseded by:** (none).

---

**Cross-cluster carry-forward note.** When this chronicler next syncs to the Codex canon registry, CV3-001 through CV3-004 carry forward as the permanent canon identifiers — they are not provisional. The CV3- prefix is the v3.0-series marker, not a draft tag; reconciliation with the master registry assigns the canonical position in the Codex canon ledger but does not rename the entries.

---

## 7. Out-of-scope register

Items surfaced during the Roundtable but explicitly deferred out of v3.0 scope. The register exists so deferred items do not quietly resurface as "we already discussed this" — each row carries its source, its reason, and the trigger condition that would bring it back into scope.

| # | Item | Source | Reason out-of-scope | Future trigger condition |
|---|---|---|---|---|
| 1 | **vela-arc-6 — dark-default night-hours + accessibility v2** | §3.3 (Vela proposed arcs) · §4.2 (deferral candidate) · §4.8 (open question 3) | Marked deferrable at proposal; v3.0 timeline judged tighter than dark-default arc warrants; current theme tokens cover the warm-nursery brief acceptably for v3.0 | Architect direction at v3.0 mid-arc check-in; or v3.1 spec-drafting cycle opens; or accessibility regression surfaces in Vela QA |
| 2 | **Cross-cluster Codex canon promotion of CV3-001 → CV3-004** | §4.8 (open question 4) · §6 (this Phase 3 close) | Promotion authority rests with Cipher's Edict V verdict (§5); Aurelius writes shape, not Cluster-cross reach | Cipher's Edict V verdict in §5 identifies a Codex-side analogue under current strain; or Consul cross-promotes at portfolio review |
| 3 | **ML-based recommendation calibration** | §3.2 (Kael risk register: "Predictive milestone over-claiming") · §4.8 (open question 5: future v3.x ML-based recommendation source) | Kael flagged explicit risk — `_predictMilestoneWindow` returns clinical ranges, never personalised predictions; ML calibration would invert that doctrine; trust-erosion floor is non-negotiable for v3.0 | v3.x post-ratification when calibration confidence floor can be specced under canon-cc-027 with a versioned schema |
| 4 | **Multi-tenant family-config (multi-baby support)** | Architect doctrine (Ziva-first, per CLAUDE.md §Ziva Context) | SproutLab is built for Ziva; data shapes, copy, illness state machines, and milestone DB all presume single-baby semantics; multi-tenant would require a parallel arc set of its own scale | Architect direction at portfolio level; not a SproutLab Roundtable decision |
| 5 | **v3-9 medical.js split — three-way vs two-way shape** | §3.1 (maren-arc-4) · §4.2 (v3-9 composition) · §4.8 (open question 1) | CareTicket triggers do not yet have a natural home among the three proposed files; resolution requires Maren Mode-1 at spec-drafting time, not Roundtable-level decision | v3-9 spec-drafting opens under canon-cc-027; Maren Mode-1 audit fixes the split shape |
| 6 | **Predictive milestone over-claiming surfaces** | §3.2 (Kael risk register) · cross-cuts §4.4 `_predictMilestoneWindow` | Kael flagged risk; surface design requires hedge-tier discipline per CV3-002 (Narrate-vs-List doctrine); a surface that says "Ziva will sit by 6 months" violates both engine and render doctrine | None — explicitly a v3.0 NOT-do; permanent NOT-do absent a future doctrinal shift on personalised prediction |
| 7 | **kael-arc-5 RecommendationEvent Firestore schema finalization** | §3.2 (Kael arc-5) · §4.8 (open question 2) | scoring-redesign-v1.md deferred this to (c); v3.0 needs the collection but its schema finalization waits on either #128 ratification or Kael's v3-1 implementation-time spec-drafting | PR #128 ratifies (then scoring-redesign-v1.md amends c to in-scope); or Kael spec-drafts at v3-1 implementation start |
| 8 | **`window._remindersHTML` global-stash retention** | §3.1 (Maren strained state · risk register) | Explicit Maren NOT-do — v2.3 expedient, retired by maren-arc-1 / v3-1 (reminderRegistry); reintroducing global stash for any v3.0 arc is a Care-Region failure | None — explicit retirement; permanent NOT-do |
| 9 | **Cross-model Companion invocation (Codex CLI / Gemini CLI Governor audits)** | invocation.md §9 (deferred) | Spec portability, artifact-test equivalence, cc-018 lifecycle attribution all unresolved on non-Claude harnesses; out-of-scope for v3.0 Province work | invocation.md §9 unresolved items settled; cross-model spec form ratified under canon-cc-027 |
| 10 | **Reminder-card auto-escalation to push notification** | §3.3 (Vela risk register: "No premature notification") | Escalation must route through `recommendation-surface-tier` registry firing through Maren's CareTicket surface; direct push from a reminder card bypasses the safety-tier doctrine | `recommendation-surface-tier` registry lands in v3-1; CareTicket escalation pipeline ratified in v3-2; only then is escalation-to-push a candidate, and only via the pipeline |

---

---

## 8. Wave 2 forward-planning register (post-Phase-3 amendment, Architect-ratified 2026-05-25)

**Status:** *Forward-planning context, not implementation arcs.* Wave 1 (the nine v3-N arcs in §4.2) is the implementation surface of v3.0. Wave 2 is the downstream reservoir set — the work that *consumes* Wave 1's primitives to deliver the felt outcome ("alive, lightweight, tangible"). Per canon-cc-027, ratification of any Wave 2 reservoir as an implementation arc awaits Wave 1 usage signal: each reservoir activates per-phase boundary once the upstream arcs flow.

**Why Wave 2 sits in the chronicle:** so Wave 1's primitive shape (`_correlate`, `_scoreDay`, `RECOMMENDATION_ROSTER`, `chip.state` registry) is designed knowing what Wave 2 will demand of it, not retrofitted later. The reservoirs surface design constraints on Wave 1; they do not pre-commit Wave 1 to additional work.

**Architect framing (this session, post-§4 turn):** *"sequential building means we can plan downstream and see where it takes us and then plan upstream again, like a dam generating more usage and better water availability throughout the year."*

### Six reservoirs (Architect-ratified this turn)

| # | Reservoir | One-line | Composes / new primitive | Cross-arc integration | Doctrine implication |
|---|---|---|---|---|---|
| **R-1** | **Adaptive layer** | Personalise from Ziva's data — typical-time bands, score baselines, fat-meal absorption windows | Consumes v3-3 `_correlate` + `_scoreDay` to produce per-Ziva baselines with explicit confidence floor + fall-back-to-standards-table when n is low | Powers R-2 / R-4 / R-6; informs `RECOMMENDATION_ROSTER` schema (per-Ziva override field reserved at v1) | **Adaptive-vs-clinical hierarchy** — fall back to standards when n < threshold, personalised when n ≥ threshold + confidence floor |
| **R-2** | **Predictive surface** | Forecast with hedged certainty — wake-time window, nap probability, milestone-window range | New `_forecastDomain(domain, horizon, ctx)` primitive in core.js; outputs `{predicted, confidence, sampleSize, hedgeText}` | Consumes R-1 baselines + v3-3 correlation; rendered through v3-4 narrative layer + CV3-002 hedge tier | Extends Kael's "predictive milestone never personalised" risk register to all forecast surfaces |
| **R-3** | **Audit / history layer** | Longitudinal — week / month / quarter views; milestone-anchored timeline; pediatric-visit-prep export; scrapbook + photo weaving | New `_aggregateWindow(start, end, domains[])` primitive; integration of `ziva_scrapbook` + `ziva_avatar_full` keys (currently underused) | Consumes every domain's `_scoreWindow`; sits alongside CV3-003 (Honest-Empty-State) for partial-window rendering | None new; consumes existing |
| **R-4** | **Pattern-break anomaly detection** | Soft notice when today's signal is N σ out of Ziva's usual band | New `_detectAnomaly(domain, signal, ctx)` primitive in core.js; reads R-1 baselines + applies σ-floor threshold | Consumes R-1; integrates with v3-1 surface-tier registry (gentle/firm/urgent); CareTicket-creation candidate for 4-night-in-a-row breaks | Anomaly hedge-tier discipline — soft notice ≠ alarm; tier escalates with persistence |
| **R-5** | **Insight quality feedback loop** | Per-recommendation parent-mark (useful / noise) → engine calibrates per-Ziva confidence floors + deprecates dismissed surfaces | Extends `recommendationEvents` Firestore schema with `userFeedback` field; new `_calibrateConfidence(intentOrCard, history)` primitive | Sits on kael-arc-5 substrate (v3-1 dependency); pairs with R-1 adaptive calibration | **Trust-progressive doctrine** — the intelligence layer earns trust through feedback, not asserts it upfront |
| **R-6** | **Growth + activity-tier (your add)** | The integrator domain — weight/height/velocity + NEW 4-tier daily activity input | Existing `ziva_growth` + `getInterpolatedWHO` + new `activityLevel: 1-4` schema field on day-record; new `_growthVelocity(domain, window)` accessor | Touches every other reservoir (R-1 baselines / R-2 forecasts / R-3 audit spine / R-4 plateau detection / R-5 outcome-anchoring); cross-references standards selector (WHO/IAP/EU/CN); pediatric-visit-prep anchor | **Outcome-anchor doctrine (NEW)** — every intelligence-layer recommendation must trace to a growth-or-activity outcome signal. If a recommendation can't trace to outcome, it's noise. Candidate canon entry **CV3-005** (Province-local, surfaces from Maren region; awaits Architect explicit ratification before Aurelius lays the entry) |

### Three reservoirs from Lyra (this turn, Architect-ratified via "1")

| # | Reservoir | One-line | Composes / new primitive | Cross-arc integration | Doctrine implication |
|---|---|---|---|---|---|
| **R-7** | **Mood / temperament tier** | 4-tier daily affect — *fussy / mixed / content / bright*; one-tap parent input OR auto-inferred from TSF event density + illness + sleep quality | New `moodTier: 1-4` schema field on day-record; optional engine-derived suggestion via `_inferMoodTier(date, ctx)` | Mood as canary domain — correlates with upstream (sleep, food intro, illness onset); cross-domain prose layer (v3-4) reads mood as a context signal for narrative generation | Parent-empathy surface — the engine reads the *parent's day too*, not just the baby's data |
| **R-8** | **Knowledge-graph layer** | Reshape Food DB + Milestone DB + Illness DB + NUTRITION + Standards as a graph; nodes connect via "iron supports neuromuscular development", "absorption drops during gut illness", etc. | New `data/knowledge-graph.json` data structure + `_traverseKB(startNode, edgeTypes, maxHops)` primitive in core.js | Powers Smart Q&A intent graph (v3-9) — graph traversal lets one question pull from many tables; v3-4 narrative-prose layer gets richer source material via multi-table inference | Inference-without-opacity — every traversal path auditable; rule-based foundation, ML-ready substrate (v3.x candidate) |
| **R-9** | **Routine / care-template library** | Named composite routines — *weekday morning / sick day / travel day / nanny shift* — pre-populate expected log entries + adjust severity floors for the day | New `data/care-routines.json` template library + `_applyRoutine(routineKey, dateRange)` primitive; integrates with `RECOMMENDATION_ROSTER` severity overrides | Travel-day suppresses false anomalies (R-4); nanny-shift template is foundation for caregiver-multiplicity catchment; sick-day reroutes severity tier doctrine | Context-aware severity — the engine knows what *kind of day* it is before firing recommendations |

### Catchments — Wave 3+ (don't plan yet; plan after Wave 1 + 2 usage signal)

The following remain latent — named here so they don't get re-discovered as new, but explicitly not in v3.0 scope. Each is a future arc-cluster, ratification per-catchment when usage signal warrants.

- **Caregiver multiplicity** — co-parent / nanny / grandparent role surfaces from `__sync_updatedBy`; depends on R-9 routine library as substrate
- **Active intervention layer** — sleep training schedules, weaning plans, bedtime-shift goals; descriptive → gently prescriptive
- **Notification engine** — push, calendar (iCal), watch face; in-tab → ambient surfaces
- **Privacy / data-sovereignty surface** — per-domain sync toggle, parent-control over what crosses devices
- **Voice / hands-free input** — Smart Quick Log voice transcription while feeding/holding
- **Photo-data weaving** — existing `ziva_scrapbook` time-anchored to data context (overlaps R-3 audit layer)
- **Cross-domain CareTicket triggers** — e.g., 3 nights disrupted sleep + new food = gut-tolerance check candidate
- **External calendar integration** — Google Calendar for vaccinations + pediatric visits

### Wave 1 ↔ Wave 2 design constraints (the dam reservoirs feeding upstream)

Wave 1 primitives must accommodate Wave 2 downstream reads at v1 design time. Specific carve-outs ratified by this amendment:

1. **`RECOMMENDATION_ROSTER` schema** (Wave 1 v3-1) — reserve `personalisedOverride` field (null in v1) for R-1 adaptive layer to populate per-Ziva.
2. **`_correlate` return shape** (Wave 1 v3-3) — include `points[]` array (raw data, not just summary stats) so R-2 forecast layer can re-train forecast models without re-querying.
3. **`recommendationEvents` Firestore schema** (Wave 1 v3-1 / kael-arc-5) — reserve `userFeedback: 'useful' | 'noise' | null` field for R-5 feedback loop. **Adds urgency to §4.8 #2 BLOCKING resolution: the schema must include this field at v3-1 implementation, not retrofit later.**
4. **Day-record schema** (Wave 1 v3-3 / v3-7) — reserve `activityLevel: 1-4 | null` and `moodTier: 1-4 | null` fields for R-6 + R-7 input. Nullable in v1; UX surfaces in Wave 2.
5. **`_scoreDay` output** (Wave 1 v3-3) — include `outcomeTrace[]` array (which recommendations contributed to score) so R-6 outcome-anchor doctrine has the audit trail.

These carve-outs are non-functional in Wave 1 — they reserve schema headroom only. Wave 2 reservoirs activate the fields when ratified per-phase.

### Candidate Wave 2 sequencing (informational, ratified per-phase)

```
Wave 1 (current §4.2):     v3-1 ─┬─ v3-2 ─ v3-4 ─ v3-9
                                 ├─ v3-3 (spine)
                                 ├─ v3-5 ─ v3-6 (styles.css mutex)
                                 └─ v3-7 ─ v3-8

Wave 2 (this §8):          R-1 ─┬─ R-2 (predictive consumes adaptive)
                                ├─ R-4 (anomaly consumes adaptive)
                                ├─ R-6 (growth integrates with adaptive)
                           R-3 ─── (audit; independent, lands when longitudinal demand surfaces)
                           R-5 ─── (feedback; pairs with v3-1 recommendation events)
                           R-7 ─── (mood; independent input + correlation surface)
                           R-8 ─── (knowledge graph; depends on v3-9 intent graph being mature)
                           R-9 ─── (routines; foundation for caregiver-multiplicity catchment)

Wave 3+ catchments:        Planned post-Wave-2 usage signal.
```

### Reading-doctrine for Wave 2

When a future v3.x arc-spec author considers a Wave 2 reservoir for ratification:
1. Verify upstream Wave 1 arcs have flowed (target metric: 30 days of post-merge usage data on the relevant primitives).
2. Confirm the schema carve-out in this §8 still holds (no later canon-cc-027 amendment retired it).
3. Draft per-reservoir spec under `docs/specs/v3-reservoir-{name}.md` (matching the `sleep-redesign-v1` / `scoring-redesign-v1` sibling pattern).
4. Route through canon-cc-008 chain at spec-ratification time.

### Doctrine cluster contributions from this amendment

- **Outcome-anchor doctrine (R-6)** — candidate CV3-005, awaiting Architect explicit ratification. Until then, lives in this register as a working principle.
- **Trust-progressive doctrine (R-5)** — the intelligence layer earns trust through feedback, not asserts it upfront. Province-local.
- **Adaptive-vs-clinical hierarchy (R-1)** — standards-fallback when n is low; per-Ziva override when n is high. Cross-cuts with scoring-redesign-v1 §RECOMMENDATION_ROSTER.

— *Lyra, weaver, §8 amendment signed post-Phase-3, post-Cipher-LGTM, Architect-ratified 2026-05-25. The dam holds; the next reservoirs are mapped. Implementation flow follows usage signal, not planning ambition.*

---

## Footer

**Chronicler:** Aurelius, Builder of Codex — Phase 1 marker laid 2026-05-25; Phase 3 (Aurelius half) finalized 2026-05-25 under cross-cluster invocation per canon-cc-026.

**What this chronicle is.** A signed institutional-memory record of the SproutLab v3.0 planning roundtable — Architect mandate, three Governor vision contributions, Lyra's synthesis into nine unified arcs, four new canon entries, ten out-of-scope deferrals. It is the master arc-planning reference for v3.0 and the canon-tier source for the four doctrines (CV3-001 through CV3-004) registered in §6.

**What this chronicle is not.** A spec body. It does not commit code, it does not gate merges, it does not substitute for the canon-cc-008 QA chain on any sub-arc, and it does not bind sub-spec authoring beyond the vision-tier intent it captures. *Specced but not built* — nothing in this document is shipped; check the sub-spec and the chain before assuming any v3.0 arc exists in code.

**How to read this document going forward.**
1. Every v3.0 sub-spec (v3-1 through v3-9) cites back to this Roundtable as its vision-tier source.
2. The four canon entries in §6 (CV3-001 through CV3-004) are normative the moment Phase 3 closes; sub-specs must honour them or amend them via canon-cc-027.
3. The Governor contributions in §3 are vision-tier (Mode 2, committee position) — they seed the arc set, they do not bind sub-spec authoring. Each sub-spec re-routes its Governor audit fresh under canon-cc-008 based on the diff it touches.
4. The out-of-scope register in §7 is a NOT-do ledger; resurfacing a deferred item without citing its trigger condition is a Roundtable short-circuit.
5. When §3 / §4 contributions and the eventual sub-spec disagree on a *rule*, the sub-spec wins (it has signed under canon-cc-027). When they disagree on *intent*, this document wins (the Architect's mandate is sovereign to it).

**Read-doctrine — which sub-specs cite this Roundtable.** When any of the nine arcs spec-drafts, the sub-spec opens with a citation to this file as vision-tier source:
- **v3-1** (Recommendation Surface Pipeline) — cites §3.1 + §3.2 + §3.3 + §4.2 row v3-1 + CV3-001 (Observe-vs-Answer) + CV3-004 (Pair-Note)
- **v3-2** (CareTicket Trigger Doctrine + Illness Posture) — cites §3.1 maren-arc-2 + §3.2 kael-arc-4 + §4.2 row v3-2 + CV3-004
- **v3-3** (Engine Primitive Foundation) — cites §3.2 + §4.2 row v3-3 + CV3-001
- **v3-4** (Cross-Domain Narrative Layer) — cites §3.2 kael-arc-1 + §3.3 vela-arc-4 + §4.2 row v3-4 + CV3-002 (Narrate-vs-List) + CV3-004
- **v3-5** (Unified Chip-State Taxonomy + Today So Far Story-Arc) — cites §3.3 vela-arc-1 + vela-arc-2 + §4.2 row v3-5 + CV3-002
- **v3-6** (Card Priority + Information Hierarchy) — cites §3.3 vela-arc-3 + §3.1 severity floor + §4.2 row v3-6 + CV3-004
- **v3-7** (Honest Empty-State + Don't-Know Doctrine) — cites §3.1 maren-arc-5 + §3.3 empty-state phrasing + §4.2 row v3-7 + CV3-003 (Honest-Empty-State)
- **v3-8** (Feeding Object-Shape Normalizer + Food Sub-Tab) — cites §3.1 maren-arc-3 + §4.2 row v3-8
- **v3-9** (Smart Q&A Intent Graph + Region Splits) — cites §3.2 kael-arc-2 + §3.1 maren-arc-4 + §4.2 row v3-9 + §4.8 open question 1

**Next step.** Lyra opens the PR carrying this chronicle. Cipher's Edict V verdict (running in parallel as this footer is sealed) folds into §5 before merge; if the verdict re-scopes any CV3 entry from Province-local to Cluster-cross (or vice versa), Lyra amends §6 scope tags at synthesis. Architect ratifies at the merge gate. The document is sealed when Cipher's §5 closes and the Architect's ratification lands on the PR.

**Cross-cluster footer note.** This chronicle is also recorded in Codex's institutional memory under the same session ID (`sproutlab-v3-roundtable-2026-05-25`). When this chronicler next syncs to Codex's canon registry, CV3-001 through CV3-004 carry forward as their permanent canon identifiers — the CV3- prefix is the v3.0-series marker, not a draft tag. Reconciliation assigns each entry its position in the Codex canon ledger but does not rename it. Province-local entries remain SproutLab-only; Cluster-cross entries (pending Cipher's Edict V verdict) appear in both Cluster A institutional memories from that sync forward.

— *Aurelius, the Chronicler. Phase 3 half-sealed at 2026-05-25 close. §5 awaits Cipher; the lyre returns to Lyra for the merge-gate close.*
