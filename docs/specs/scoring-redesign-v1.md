# Scoring Redesign v1 — RECOMMENDATION_ROSTER + per-day score primitive + cross-domain hero score

**Spec version:** v1
**Date:** 2026-05-25
**Branch:** `claude/scoring-redesign-v1-spec`
**Author:** Lyra (main-session — Mode-1 spec authoring)
**Promoted from:**
- Architect-ratified architectural shift (this session): "treat this as a database update for the intelligence layer. The app is starting to breathe." The redesign establishes the generic scoring + recommendation primitive that sleep, feeding, activity, and future domains all consume.
- Sibling-spec relationship with `docs/specs/sleep-redesign-v1.md` (this session) — sleep is the first consumer of the new primitive; this spec establishes the primitive itself.
**Status:** v0 — spec-only PR; canon-cc-008 explicitly waived (docs-only). Implementation runs as **four arcs** interleaved with the sleep redesign arcs per the cross-spec sequencing.

---

## What Scoring Redesign v1 is

A single generic primitive — `RECOMMENDATION_ROSTER` data + `_scoreDay()` / `_scoreWindow()` / `_scoreDayHero()` functions in the engine layer — that any domain (sleep, feeding, activity, D3, future) plugs into to produce per-day, per-week-rolling, and cross-domain hero scores. Standards-aware (binds to existing `ziva_reference_standard` localStorage key, options `{who, iap, eu, cn}`). Reward-tilted (encouragement-over-punishment, 2:1 ratio per Architect doctrine). No floor on negative scores — instead, low scores generate **severity messages** at three thresholds (gentle / firm / urgent).

**Three concurrent shifts:**

1. **From per-domain ad-hoc scoring to a unified primitive.** Currently each domain (D3 adherence %, sleep hours, etc.) computes its own score in isolation. The redesign routes every domain through one engine layer that handles reward + penalty + severity uniformly.
2. **Recommendations become first-class data.** `RECOMMENDATION_ROSTER` in `data.js` is a structured table — every recommendation in the system has the same shape (key, domain, per-standard age-ranges, reward weight, missed weight, severity messages, successor-on-expiry). Adding a new recommendation = adding a row.
3. **Reward integration.** Met-recommendations contribute strongly positive (2× the magnitude of the missed-penalty per Architect ratio). The system rewards good caregiving patterns explicitly, not just punishes absence.

## What Scoring Redesign v1 is NOT

- A breaking change to existing per-domain logic. Current scoring continues to work; arcs migrate domain-by-domain.
- A Firestore-collection-based event log. Architect direction (this session): "a + b but we will obviously get to c eventually, not now." v1 stores scores + recommendation-status in localStorage; future Firestore-collection move is a v2 arc.
- A retroactive backfill of historical day-scores. Scores are computed at read time over the live data; no on-disk write of derived scores in v1 except per-day caching.
- A redesign of the *display* surfaces. The hero score gauge, info-tab cards, and Today So Far chips still render — they just consume the new primitive. Visual restyling is out of scope.

---

## Why now — "the app is starting to breathe"

The trigger for this spec is the human-contact addition surfaced in the sleep redesign discussion (this session): a recommendation that's age-bound, standards-dependent, recommended at a cadence, contributes to scoring, and transitions to a successor (outdoor time) on expiry. That's not a sleep-specific concern — it's a *recommendation-system* concern. Multiple existing surfaces have the same shape latent in them:

- **D3 adherence** — once-daily, "always" (no age cutoff), strong-recommend cadence, scored as % currently. Needs the recommendation primitive.
- **Sleep amount per age** — standards-bound minimums (WHO/IAP/EU/CN diverge by < 1h), scored as deficit currently (ad-hoc), needs the primitive.
- **Tummy time** (not currently tracked but in the pipeline) — age-bound, cadence-bound, met-by-count.
- **Outdoor time** — successor for humanContact at age cutoff; same shape.
- **Vaccination adherence** — schedule-bound (different shape: per-vaccine schedule, not per-day cadence), but the *severity message generator* and the *reward when met* apply.

Building these as one-offs leads to drift; the primitive lets every recommendation behave the same way and surfaces consistent UI for parents.

---

## Architecture

### Standards-selector binding

```js
function _getActiveStandard() {
  return localStorage.getItem('ziva_reference_standard') || 'who';
}
```

Existing infrastructure at `medical.js:1294` (`_referenceStandard`) extends to drive all recommendation lookups. Parent picks once in the settings tab; every recommendation read passes through.

### `RECOMMENDATION_ROSTER` schema (Kael's region — `data.js`)

```js
const RECOMMENDATION_ROSTER = {
  humanContact: {
    // ── v1 fields (locked this spec) ─────────────────────────────────────
    key: 'humanContact',                   // unique
    domain: 'sleep',                       // routing key for _scoreDay
    standards: {
      who: { ageRanges: [
        // ageRange: { startMo, endMo, cadence, strength, minPerDay }
        { startMo: 0,  endMo: 6,  cadence: 'daily', strength: 'strong',      minPerDay: 1 },
        { startMo: 6,  endMo: 12, cadence: 'daily', strength: 'recommended', minPerDay: 1 },
        { startMo: 12, endMo: 24, cadence: 'optional', strength: 'beneficial', minPerDay: 0 },
      ]},
      iap: { ageRanges: [/* per IAP — calibrated at Arc S-1 implementation */] },
      eu:  { ageRanges: [/* per ESPGHAN */] },
      cn:  { ageRanges: [/* per CN guidance */] },
    },
    // Met-criterion in v1 is count (Architect: "count, for now"). v2 may add duration / quality gates.
    metCriterion: 'count',                 // 'count' | 'duration' | 'quality-gated-count' (v2+)
    rewardWeight: 0.3,                     // +ve contribution on met (per qualifying day)
    missedWeight: -0.15,                   // -ve contribution on unmet (within active age window)
    // ── streak penalty (Architect: 3-day soft escalation) ────────────────
    streakPenalty: { afterDays: 3, perDayBonus: -0.1, capDays: 7 },
    // ── severity messages (Architect ratified 3 levels: gentle / firm / urgent) ─
    severityMessages: {
      gentle: { strength: 'unmet-today',        text: 'Skin-to-skin time today — even 10 min counts.' },
      firm:   { strength: 'unmet-2days',        text: 'Two days without human contact — try a wrap or chest-to-chest now.' },
      urgent: { strength: 'unmet-3+days OR critical-window', text: 'Skin-to-skin is highly recommended at this age. Hold time, often.' },
    },
    successorOnExpiry: { key: 'outdoorTime', mode: 'placeholder-v1' },  // Architect: outdoor time as v1 placeholder
    // ── v2+ reserved (documented; not loaded by v1 engine; future-compat) ─
    durationMinMinutes:    null,           // v2: duration-based completion
    qualityGate:           null,           // v2: only count if quality === 'good'
    timeWindowOfDay:       null,           // v2: morning-only recommendations (e.g., outdoor for circadian)
    crossDomainSynergies:  null,           // v2: e.g., D3 + fat-meal pairing (already in D3 spec)
    perAgeRewardOverride:  null,           // v2: reward magnitude varies by age band
  },
  sleepAmount: {
    key: 'sleepAmount',
    domain: 'sleep',
    standards: {
      who: { ageRanges: [
        { startMo: 0,  endMo: 4,  minHoursPerDay: 14, idealHoursPerDay: 16 },
        { startMo: 4,  endMo: 12, minHoursPerDay: 12, idealHoursPerDay: 14 },
        { startMo: 12, endMo: 24, minHoursPerDay: 11, idealHoursPerDay: 13 },
      ]},
      iap: { /* aligns closely; calibrate at Arc S-1 */ },
      eu:  { /* aligns closely */ },
      cn:  { /* aligns closely */ },
    },
    metCriterion: 'duration',              // hours per day, not count
    rewardWeight: 0.4,                     // higher weight than humanContact (sleep amount is the headline)
    missedWeight: -0.2,                    // scaled by deficit at runtime (deficit × missedWeight per hour below min)
    streakPenalty: { afterDays: 3, perDayBonus: -0.1, capDays: 7 },
    severityMessages: { /* 3 levels — wording at Arc S-1 */ },
    successorOnExpiry: null,                // sleepAmount never ages out
  },
  outdoorTime: {
    key: 'outdoorTime',
    domain: 'activity',
    standards: {
      who: { ageRanges: [
        // Placeholder per Architect — successor for humanContact at 12mo. Detailed standards at Arc S-1+.
        { startMo: 12, endMo: 999, cadence: 'daily', strength: 'recommended', minPerDay: 1 },
      ]},
      iap: { /* placeholder */ },
      eu:  { /* placeholder */ },
      cn:  { /* placeholder */ },
    },
    metCriterion: 'count',
    rewardWeight: 0.3,
    missedWeight: -0.15,
    streakPenalty: { afterDays: 3, perDayBonus: -0.1, capDays: 7 },
    severityMessages: { /* TBD at Arc S-1+ */ },
    successorOnExpiry: null,
  },
  // Future: tummyTime, vitD3Adherence, vaccinationOnSchedule, screenTimeCeiling, etc.
};
```

**Schema extensibility** (Architect direction: "it should have space for later upgrades"):
- v1 fields are locked.
- v2+ reserved fields are documented but **null** in v1; engine code ignores non-null v2 fields safely. New recommendations can be added without engine changes as long as they use v1-only fields.
- Adding a new recommendation = adding a row. No engine code change.
- A future v2 arc may add: duration-based completion, quality gates, time-windowed recommendations, cross-domain synergies, per-age reward overrides, streak bonuses beyond linear, multi-met cadences.

### Engine primitives (Kael's region — `core.js`)

#### `_evaluateRecommendation(key, ageInDays, recentData)` → `{status, metToday, daysSinceMet, severityLevel}`

```js
// Pure function. No DOM. No localStorage write.
function _evaluateRecommendation(key, ageInDays, recentData) {
  const rec = RECOMMENDATION_ROSTER[key];
  if (!rec) return { status: 'unknown' };
  const std = _getActiveStandard();
  const standardSpec = rec.standards[std] || rec.standards.who;     // who is the fallback
  const ageMo = ageInDays / 30.44;
  const activeRange = standardSpec.ageRanges.find(r => ageMo >= r.startMo && ageMo < r.endMo);
  if (!activeRange) return { status: 'aged-out', successor: rec.successorOnExpiry };
  // Evaluate metCriterion against recentData (sleepData / feedingData / etc. passed by caller)
  const metToday = _evaluateMetCriterion(rec, activeRange, recentData.today);
  const daysSinceMet = _countDaysSinceLastMet(rec, recentData.history);
  const severityLevel = _deriveSeverity(activeRange, metToday, daysSinceMet, rec.streakPenalty);
  return { status: 'active', activeRange, metToday, daysSinceMet, severityLevel };
}
```

#### `_scoreDay(domain, date, dataset)` → `{raw, rewards, penalties, total, contributions, severityLevel, unmetRecommendations, generatedMessages}`

```js
function _scoreDay(domain, date, dataset) {
  // 1. Per-record contributions (domain-specific shape; sleep records use class × location × aux)
  const records = _getRecordsForDay(domain, date, dataset);
  const recordContribs = records.map(r => _domainPerRecordScore(domain, r));
  const raw = recordContribs.reduce((s, c) => s + c.value, 0);

  // 2. Recommendation rewards + penalties for this domain
  const ageInDays = _getZivaAgeInDays(date);
  const recommendations = _getRecommendationsForDomain(domain);
  let rewards = 0, penalties = 0, unmet = [], messages = [];
  for (const rec of recommendations) {
    const evald = _evaluateRecommendation(rec.key, ageInDays, dataset);
    if (evald.status !== 'active') continue;
    if (evald.metToday) {
      rewards += rec.rewardWeight;
    } else {
      penalties += rec.missedWeight;
      if (evald.daysSinceMet >= (rec.streakPenalty?.afterDays || 999)) {
        const streakDays = Math.min(evald.daysSinceMet - rec.streakPenalty.afterDays + 1, rec.streakPenalty.capDays);
        penalties += rec.streakPenalty.perDayBonus * streakDays;
      }
      unmet.push({ key: rec.key, severityLevel: evald.severityLevel });
      if (rec.severityMessages[evald.severityLevel]) messages.push(rec.severityMessages[evald.severityLevel]);
    }
  }

  // 3. Day-level domain bonuses (sleep spec defines contact-combination here)
  const dayBonuses = _domainDayBonuses(domain, records);

  // 4. Total + severity classification
  const total = raw + rewards + penalties + dayBonuses;
  const severityLevel = _classifyDaySeverity(total, unmet);

  return { raw, rewards, penalties, dayBonuses, total, contributions: recordContribs, severityLevel, unmetRecommendations: unmet, generatedMessages: messages };
}
```

#### `_scoreWindow(domain, days, endDate)` → 7-day rolling aggregate

Same shape as `_scoreDay` but summed across the window. Used for "this week's sleep average" type surfaces + the streak penalty calculation. Per Architect direction (point 2): cross-day deficits accrue small penalty + gentle reminder, never harder than the per-day severity escalation.

#### `_scoreDayHero(date, dataset)` → cross-domain hero score

```js
function _scoreDayHero(date, dataset) {
  const domains = ['sleep', 'feed', 'activity'];  // future: 'medical', 'milestones'
  const weights = { sleep: 0.4, feed: 0.3, activity: 0.3 };  // calibration TBD at Arc S-4
  const perDomain = domains.map(d => ({ domain: d, score: _scoreDay(d, date, dataset) }));
  const weighted = perDomain.reduce((s, p) => s + (p.score.total * weights[p.domain]), 0);
  // ... severity aggregation, message merging, etc.
  return { total: weighted, perDomain, severityLevel: ..., generatedMessages: [...] };
}
```

### Severity model (3 levels per Architect)

| Level | Trigger | Surface |
|---|---|---|
| **gentle** | Score below baseline but ≥ 0; OR unmet recommendation within first 24h of being due | Today So Far row mentions unmet item; no nag |
| **firm** | Score < 0; OR unmet recommendation 2 days running | Reminder card with actionable suggestion |
| **urgent** | Score deeply negative; OR unmet for ≥ 3 days on a strong-strength recommendation; OR critical-window breach (e.g., 0–2 mo skin-to-skin missed) | CareTicket auto-creation (Maren's region) + parent-facing card |

**Architect direction:** No score floor. When score drops, the system **generates severity messages** instead of clamping. The message intensity scales with the drop.

### Reward:penalty ratio doctrine (Architect: "encourage")

For every recommendation:
- `rewardWeight` is **2× the magnitude** of `missedWeight` (e.g. humanContact: reward +0.3, miss −0.15)
- Sleep deprivation severity scales with deficit (deficit × missedWeight per hour below min), but the 2:1 baseline holds for binary met/unmet
- The day-level contact-combination bonus (sleep spec) is additive on top — reward stacking encouraged

The 2:1 framing is the design-brief embodiment: warm, sturdy, calm — the system rewards good patterns more than it punishes lapses.

---

## Database update (Architect: a + b; c deferred)

### (a) New constants in `data.js`

- `RECOMMENDATION_ROSTER` (above)
- `SEVERITY_THRESHOLDS` — per-domain numeric thresholds for gentle/firm/urgent
- `DOMAIN_WEIGHTS_HERO` — per-domain weights used by `_scoreDayHero`
- `STANDARDS_FALLBACK_CHAIN` — `['who']` (if active standard's range is missing for a recommendation, fall back to WHO)

### (b) New localStorage keys

- `ziva_score_daily` — `{ 'YYYY-MM-DD': { sleep: {...}, feed: {...}, activity: {...}, hero: {...} } }`. Cache of `_scoreDay`/`_scoreDayHero` output keyed by date. Invalidated when source data changes (mirror `_islMarkDirty` pattern).
- `ziva_recommendation_status` — `{ 'YYYY-MM-DD': { humanContact: 'met'|'unmet', sleepAmount: '...', ... } }`. Per-day per-recommendation status. Source for streak counters + severity escalation.
- `ziva_recommendation_streaks` — `{ humanContact: { lastMetDate: 'YYYY-MM-DD', currentMissStreak: 0 }, ... }`. Lightweight streak cache; rebuilt from `ziva_recommendation_status` if missing.

### (c) Firestore-collection event log — **DEFERRED** (Architect: "we will obviously get to c eventually, not now")

A future v2 arc may introduce a dedicated Firestore collection for recommendation events (per-day per-recommendation rows synced across devices, enabling multi-device aggregation + historical analytics). Out of v1 scope. v1's localStorage keys are device-local; sync of *source data* (sleep, feed, med-checks) already happens via existing Firestore — the *derived scores* are recomputed per-device on demand.

---

## Phasing — four arcs

Implementation runs as four independent PRs, interleaved with the sleep redesign arcs per the cross-spec sequencing.

| Arc | Items | Files touched | Region routing | Approx PR scope |
|---|---|---|---|---|
| **Arc S-1 — RECOMMENDATION_ROSTER + `_evaluateRecommendation`** | Add ROSTER constant to data.js (with humanContact + sleepAmount + outdoorTime placeholder + 4-standard calibration); add `_getActiveStandard()` + `_evaluateRecommendation()` helpers in core.js; no score calculation yet | data.js + core.js | Kael primary | 1 PR |
| **Arc S-2 — `_scoreDay` + reward/penalty integration + severity messages** | Add `_scoreDay(domain, date, dataset)` in core.js; add `ziva_score_daily` + `ziva_recommendation_status` localStorage keys; severity-level classifier; message generation. **Sleep is the first consumer** (this arc coordinates with sleep-redesign-v1 Arc 3) | core.js + sync.js (new keys) | Kael + Maren (sleep wiring) | 1 PR |
| **Arc S-3 — `_scoreWindow` + escalation surfaces** | Rolling 7-day aggregates; Today So Far row for unmet recommendations (Vela); reminder card for firm severity (Maren); CareTicket auto-creation for urgent severity (Maren + Kael — caretickets.js) | core.js + intelligence-quicklog.js + home.js + intelligence-caretickets.js | Maren + Kael + Vela parallel | 1 PR |
| **Arc S-4 — `_scoreDayHero` + cross-domain unification** | The hero score on home.js routes through `_scoreDayHero`; migration from existing per-domain ad-hoc scoring; per-domain weight calibration against live data | core.js + home.js | Kael primary + Maren consult | 1 PR |

**Arc S-1 has no UX surface** — engine primitive only. Arc S-2 lights up the first consumer (sleep). Arc S-3 lights up the escalation surfaces (where parents see the recommendation messages). Arc S-4 is the highest blast radius (replaces the existing hero score) — last.

---

## Sibling relationship with `sleep-redesign-v1.md`

The two specs are siblings — neither depends on the other for *spec ratification*, but the implementation arcs interleave:

| Sleep arc | Scoring arc | Dependency |
|---|---|---|
| Sleep Arc 1 (classifier + lazy normalizer) | — | Independent. Fixes the live rollover bug at read time. |
| Sleep Arc 2 (write-side UX, 5-location selector) | — | Adds `human` location; standalone. |
| — | Scoring Arc S-1 (ROSTER + `_evaluateRecommendation`) | Establishes the primitive. Independent of sleep arcs. |
| Sleep Arc 3 (scoring wiring) | Scoring Arc S-2 (`_scoreDay` + severity) | **Coordinated:** Scoring Arc S-2 implements `_scoreDay` with sleep as the first consumer. Effectively a merged arc. |
| — | Scoring Arc S-3 (window + escalation) | Depends on S-2 |
| — | Scoring Arc S-4 (hero unification) | Depends on S-3 |

**Recommended landing order:** food sub-tab arc → Sleep Arc 1 → Scoring Arc S-1 → Sleep Arc 2 → Scoring Arc S-2 (incl Sleep Arc 3) → Scoring Arc S-3 → Scoring Arc S-4. D3 Phase 2-C interleaves wherever the chain has cycles to spare.

The sleep spec body references this spec at every point where the scoring contract is mentioned. The scoring spec body references the sleep spec wherever sleep-specific shape is needed (e.g., the contact-combination day-level bonus is sleep-domain, defined in the sleep spec, but plugs into this spec's `_domainDayBonuses` hook).

---

## Cross-domain consumers (post-Arc-S-2)

The primitive's existing or near-term consumers:

| Domain | Recommendations (v1 roster) | Notes |
|---|---|---|
| **sleep** | `humanContact`, `sleepAmount` | First consumer via Scoring Arc S-2 / Sleep Arc 3 |
| **feed** | (future — breast-feeding cadence, weaning-window markers) | Awaits feed-redesign / food-sub-tab arc |
| **activity** | `outdoorTime` (placeholder; successor for humanContact at 12mo) | Lights up during Scoring Arc S-3 once successor mechanic ratified |
| **medical** | `vitD3Adherence` (migration from existing % score), `vaccinationOnSchedule` | Migration handled at Scoring Arc S-4 (hero unification) |
| **milestones** | (future — milestone-window-on-schedule) | Out of v1 scope |

Adding a new domain or recommendation post-Arc-S-4: append a row to `RECOMMENDATION_ROSTER` + register a `_domainPerRecordScore(domain, record)` handler + register a `_domainDayBonuses(domain, records)` handler if day-level bonuses apply. No core engine change.

---

## Doctrinal cluster

This spec joins the cross-PR cluster:

- **Midnight-rollover doctrine** — established at PR #122 / #125 / #126 / sleep-redesign-v1 Arc 1.
- **Schema-aware reads via centralized normalizer** — `parseMedCheck` (D3), `normalizeSleep` (sleep), and now `_evaluateRecommendation` (any recommendation). Future Governors auditing engine paths check the normalizer / primitive call site at every read.
- **Standards-selector binding** — the existing `ziva_reference_standard` localStorage key extends from growth-charts to the full recommendation roster. Doctrine: any age-bound or developmentally-graded surface that has standard-divergent guidance routes through `_getActiveStandard()`. (NEW with this spec.)
- **Reward-tilted scoring** — 2:1 reward:penalty ratio is the calm-design embodiment. Future Governors must preserve this asymmetry when adding new recommendations. (NEW with this spec.)
- **No-floor + severity-message doctrine** — instead of clamping negative scores, the system generates increasingly explicit recommendation messages. Doctrine: severity escalation lives in the message generator, not the score arithmetic. (NEW with this spec.)
- **Recommendation extensibility doctrine** — every recommendation has the same v1 schema shape (per spec body); v2+ extensions are reserved fields in the same row. Engine code is recommendation-agnostic. (NEW with this spec.)

## QA chain (canon-cc-008)

- **This PR (spec, docs-only):** canon-cc-008 **explicitly waived** per the "docs-only" branch. Mirrors PR #123 + sibling sleep-redesign-v1 PR #127.
- **Arc S-1:** Kael primary (data.js constants + core.js helpers). Maren waived (no care-tier write paths touched). Lyra synth → Cipher Edict V.
- **Arc S-2:** Kael primary (score engine) + Maren consult (sleep wiring touches medical.js for the nap-stack chart score consumption + home.js for any hero impact). Lyra synth → Cipher Edict V.
- **Arc S-3:** Maren + Kael + Vela parallel (escalation surfaces span all three regions: CareTickets in Kael, reminder cards in Maren, TSF in Vela). Lyra synth → Cipher Edict V.
- **Arc S-4:** Kael primary + Maren consult (hero score render touches home.js). No triple-jurisdiction. Lyra synth → Cipher Edict V.

## HR pre-check (Arcs S-1 + S-2)

| HR | Risk | Mitigation |
|----|------|------------|
| HR-1 (no emojis) | n/a | Engine-only Arcs S-1 + S-2; no icon work |
| HR-3 (no inline handlers) | n/a | Arcs S-1 + S-2 are engine; Arc S-3 takes on the data-action surfaces for reminder cards |
| HR-4 (escHtml at boundaries) | medium | Severity message TEXT is `RECOMMENDATION_ROSTER` constant data, no parent input. Safe to interpolate. Arc S-3 takes on parent-facing display escaping |
| HR-9 (post-build multi-round QA) | structural | canon-cc-008 chain runs per Arc |
| HR-12 (timezone-safe dates) | medium | Day-key arithmetic uses existing `_offsetDateStr` / `today()` — already timezone-safe. `_getZivaAgeInDays(date)` uses `Date.parse(birthDate)` + UTC-safe day math (calibrated at Arc S-1 implementation) |

Arc S-3 + S-4 HR-checks ratified at their own implementation-time specs.

## Out-of-scope (deferred to v2 / v3 / future arcs)

- Firestore-collection event log (Architect: "we will obviously get to c eventually, not now")
- Per-record reward modifiers (e.g., a 30-min nap rewards more than a 5-min one) — v2 hook reserved
- Time-windowed recommendations (e.g., outdoor time before 4pm for circadian benefit) — v2 hook reserved
- Cross-domain synergies (e.g., D3 + fat-meal pairing reward stack) — v2; D3 already handles its synergy internally
- ML-based reward calibration — rule-based for v1; explainable, debuggable, audit-friendly
- Multi-tenant family-config (Ziva-first per Architect doctrine)
- Aggregate report surfaces (weekly review screens, monthly summaries) — depends on Arc S-4 being live first; future v2

## Doctrinal references

- `docs/specs/sleep-redesign-v1.md` (sibling — sleep is first consumer)
- `docs/specs/vit-d3-tracking-v1.md` (D3 adherence — future consumer migration at Arc S-4)
- `docs/specs/vit-d3-tracking-v2-tier-2.md` §T2-A.1+A.2 + T2-B.* (midnight-rollover doctrine establishment cluster)
- `CLAUDE.md` §Architecture (existing `_referenceStandard` infra in medical.js:1294 — extension point)
- `invocation.md` — Companion invocation procedure (Mode-1 spec authoring + audit cycles)
- canon-cc-008 (QA chain gate)
- canon-cc-027 (spec amendment authority — for future v2 amendments)

---

— Lyra (main-session), 2026-05-25, post-Architect-ratification of seven scope-lock questions this session. cc-018 status: `drafted — awaiting docs-only PR ratification (canon-cc-008 waived); implementation interleaved with sleep-redesign-v1 arcs per cross-spec sequencing.`
