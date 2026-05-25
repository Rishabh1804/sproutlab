# v3-3 — Engine Primitive Foundation

**Spec version:** v3-3
**Date:** 2026-05-25
**Branch:** `claude/v3-3-engine-spine`
**Author:** Lyra (main-session — Mode-1 spec authoring)
**Status:** v0 — first Wave 1 implementation spec post-roundtable; v3-3 is the engine spine.
**Promoted from:**
- `docs/specs/sproutlab-v3-roundtable-2026-05-25.md` §4.2 v3-3 row (chronicle-ratified)
- `docs/specs/sleep-redesign-v1.md` (sibling — sleep is first consumer of `_scoreDay`)
- `docs/specs/scoring-redesign-v1.md` (sibling — engine primitive foundation; this spec is its implementation surface)
**Charter alignment (CV3-006 required section):**
- **Honesty** — every primitive surfaces sample-size + confidence floor on output; no claim ships without provenance. Active honor: `_correlate` returns `{sampleSize, confidence}`; `_predictMilestoneWindow` returns clinical ranges, never personalised predictions.
- **Extensibility** — every primitive is data-driven where possible. Active honor: `_correlate` is domain-pair-agnostic; new domain pairs add no engine code. `RECOMMENDATION_ROSTER` (from scoring-redesign-v1) is the row-addition substrate this spec sits on.
- **Warmth** — engine-only arc; no parent-facing surface. Warmth is neutral at this layer — but the primitives must NOT introduce shapes that downstream surface arcs (v3-4 narrative, v3-1 recommendation) can't render warmly. Confidence-floor and hedge-tier outputs are pre-shaped for parent-legible prose.

---

## What v3-3 is

The **engine spine** of v3.0. Five new primitives + one new module, landing as a single PR. Once v3-3 ships, every Wave 1 arc (v3-1 / v3-2 / v3-4 / v3-6) and every Wave 2 reservoir (R-1 / R-3 / R-6 / R-7 — and R-2 / R-4 indirectly via R-1) has the substrate they need.

The five primitives:

1. **`_correlate(domainA, domainB, windowDays, opts)`** — cross-domain correlation accessor in a new file `split/intelligence-correlate.js`.
2. **`_resolveEventAnchor(token, ctx)`** — event-anchored temporal-window resolver added to `split/intelligence-isl.js`.
3. **`_scoreDay(domain, date)` + `_scoreWindow(domain, start, end)` + `_scoreDayHero(date)`** — implemented in `split/core.js` per `scoring-redesign-v1.md` Arc S-1 + S-2 (merged with this spec at impl time per chronicle §4.2 v3-3 + v3-9 merging).
4. **`getActiveIllnessPosture()`** — added to `split/intelligence-illness.js` (compound illness state accessor).
5. **`getSyncPosture()`** — added to `split/sync.js` (synchronous in-memory sync-health read).

Plus the foundation for scoring per `scoring-redesign-v1.md`:
- `RECOMMENDATION_ROSTER` constant in `split/data.js`
- `_getActiveStandard()` reading `localStorage.getItem('ziva_reference_standard')` (existing infra)
- `_evaluateRecommendation(key, ageInDays, recentData)` in `split/core.js`

## What v3-3 is NOT

- A render surface. No HTML, no CSS, no DOM. All render is downstream (v3-1 / v3-4 / v3-6).
- A migration. New primitives are additive; existing readers untouched until they opt in.
- A scoring-aware feature. The primitives ship cold; first consumer is sleep redesign Arc 3 (merged with Scoring Arc S-2) at impl time.
- Multi-device-aware. `getSyncPosture()` reads local state only; Firestore-level posture is deferred (per scoring-redesign-v1.md §c — deferred to v2).

## The Cipher gate (cipher-4 from chronicle Edict V Round 1)

**MANDATORY:** v3-3 spec body MUST include an HR-12 `tz-construction` test plan section.

Rationale (Cipher's Round 1 finding): `_resolveEventAnchor("since the fever")` reads illness state machine timestamps; `"the week of [vaccine]"` reads vaccine ledger timestamps. Both are date-arithmetic surfaces. Tuesday-in-IST vs Tuesday-in-UTC at the day boundary swap entire windows.

→ §HR-12 tz-construction test plan is below in §Test Plan.

---

## Primitive 1 — `_correlate(domainA, domainB, windowDays, opts)`

**New file:** `split/intelligence-correlate.js` (Kael's Region; ~600 LOC).

### Contract

```js
/**
 * Cross-domain correlation accessor.
 *
 * @param {string} domainA - 'sleep' | 'feeding' | 'med' | 'illness' | 'milestone' | 'growth' | 'poop'
 * @param {string} domainB - same shape as domainA, distinct from domainA
 * @param {number} windowDays - rolling window in days (e.g. 14, 30)
 * @param {object} opts - { signalA, signalB, lagDays?, confidenceFloor? }
 *
 * @returns {object | null}
 *   {
 *     lag: number,             // signed lag in days (negative = domainA precedes)
 *     strength: number,        // [-1, 1] Pearson coefficient
 *     confidence: 'high'|'medium'|'low',
 *     sampleSize: number,      // n days of matched data
 *     points: Array<{date, valA, valB}>, // raw paired points (for R-2 forecast layer)
 *     domainA, domainB, signalA, signalB, windowDays,
 *   }
 *   OR null if sampleSize < hard floor (default 7) or confidence floor not met
 */
function _correlate(domainA, domainB, windowDays, opts) { /* ... */ }
```

### Confidence floor (Cipher cipher-2 + Charter Honesty axis)

`_correlate` returns `null` if either:
1. `sampleSize < 7` (hard floor — no correlation surface with too few days)
2. `Math.abs(strength) < (opts.confidenceFloor || 0.4)`

The Charter Honesty axis requires every claim to disclose sample size. The `null` return propagates to consumers (v3-4 narrative layer; v3-2 CT triggers): no correlation card without `n=` disclosure. Per cipher-2 (Round 1, chronicle §5): **no correlation card without an "n=" disclosure in the copy.**

### Signal extractors (extensible per Charter)

`_correlate` consumes domain-specific signal extractors keyed by `{domain, signal}`:

```js
const SIGNAL_EXTRACTORS = {
  'sleep:total':       (date) => /* total sleep hours that night */,
  'sleep:onset':       (date) => /* sleep onset time in min-of-day */,
  'sleep:wakeUps':     (date) => /* wakeUp count */,
  'feeding:fatRatio':  (date) => /* ratio of fat-bearing meals */,
  'feeding:mealCount': (date) => /* total meals */,
  'med:givenCount':    (date) => /* med doses given */,
  'med:withFatRatio':  (date) => /* fraction with fat */,
  'illness:active':    (date) => /* boolean → 0/1 */,
  'milestone:active':  (date) => /* count of milestones in active state */,
  'growth:weightKg':   (date) => /* interpolated weight from ziva_growth */,
  'poop:count':        (date) => /* count of poops */,
  // ... extensible: add signal → add row, no engine change
};
```

The extractor table is the **Charter Extensibility honor**: adding a new correlation pair = adding a row, not touching `_correlate` itself.

### Implementation note

`_correlate` walks daily dates from `endDate − windowDays + 1` to `endDate`, calls signal extractors, drops days where either extractor returns null/undefined, then computes Pearson on the matched pair series. Lag analysis: also computes correlations at lags `-3..+3` days; reports the strongest.

---

## Primitive 2 — `_resolveEventAnchor(token, ctx)` (ISL temporal parser v2)

**File:** `split/intelligence-isl.js` (Kael's Region — extends `resolveTimeQuery`).

### Contract

```js
/**
 * Resolve an event-anchored temporal phrase to a date window.
 *
 * @param {string} token - e.g. "since the fever", "the week of MMR", "before solids", "since rolling"
 * @param {object} ctx  - { now: Date, baby: { dob, milestones, ... } }
 *
 * @returns {object | null}
 *   { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD', label: 'since the fever (Mar 12)' }
 *   OR null if the anchor cannot be resolved
 */
function _resolveEventAnchor(token, ctx) { /* ... */ }
```

### Anchor types

| Pattern | Resolves to |
|---|---|
| `since the fever` / `since the cold` / `since the diarrhoea` | start = first day of the **most recent active or recently-resolved** illness episode of that type; end = today |
| `the week of [vaccine name]` / `the week of MMR` | start = (vaccine date − 3d); end = (vaccine date + 3d) |
| `before solids` / `after solids` | resolves against the milestone DB entry for "started solids"; before = dob → milestone date; after = milestone date → today |
| `since [milestone]` (e.g. `since rolling`, `since babbling`) | start = milestone "active" or "achieved" date; end = today |
| `that week` / `that day` (referent-anchored) | requires `ctx.referent` (a prior event) — looks up week/day around it |

### Why this is HR-12-sensitive (Cipher cipher-4)

Every anchor resolution constructs Date objects from ISO date strings to do arithmetic. The construction must be timezone-safe per HR-12. See §HR-12 Test Plan below.

### Backward compatibility

Existing `resolveTimeQuery` token table unchanged. `_resolveEventAnchor` is called as a fallback when the existing token table returns null. Additive — no behavior change for any existing query.

---

## Primitive 3 — `_scoreDay` / `_scoreWindow` / `_scoreDayHero`

**File:** `split/core.js` (Kael's Region).

This is the implementation of `scoring-redesign-v1.md` Arcs S-1 + S-2. v3-3 lands the engine primitives; **sleep is the first consumer** (the merged Sleep Arc 3 / Scoring Arc S-2 work).

### Contracts (per scoring-redesign-v1.md §Architecture)

```js
function _scoreDay(domain, date, dataset) {
  // Returns: { raw, rewards, penalties, dayBonuses, total, contributions, severityLevel, unmetRecommendations, generatedMessages }
}
function _scoreWindow(domain, days, endDate) {
  // 7-day rolling aggregate of _scoreDay outputs
}
function _scoreDayHero(date, dataset) {
  // Cross-domain weighted hero: { total, perDomain, severityLevel, generatedMessages }
}
```

Full schemas + reward:penalty 2:1 doctrine + severity-threshold model live in `docs/specs/scoring-redesign-v1.md`. v3-3 implements; no schema deviation.

### Domain plug-in pattern (Charter Extensibility)

Each domain registers two handlers:
- `_domainPerRecordScore(domain, record)` — per-record contribution
- `_domainDayBonuses(domain, records)` — day-level bonus (e.g. sleep's contact-combination bonus)

Sleep's handlers land alongside v3-3 (the merged arc work). Other domains register at their respective arc spec times.

### v3-3 ships the *primitive*; not the *first consumer*

To clarify the merge: this spec ships `_scoreDay` + `_scoreWindow` + `_scoreDayHero` as engine primitives. The sleep-domain handlers + sleep-recommendation rows in `RECOMMENDATION_ROSTER` land as the **Sleep Redesign Arc 3 + Scoring Arc S-2 merged PR** which is the canonical first-consumer PR. The chronicle's §4.2 v3-3 row covers the primitive landing only.

---

## Primitive 4 — `getActiveIllnessPosture()`

**File:** `split/intelligence-illness.js` (Kael's Region).

### Contract

```js
function getActiveIllnessPosture() {
  // Reads getActiveFeverEpisode + getActiveDiarrhoeaEpisode + getActiveVomitingEpisode + getActiveColdEpisode as a SET
  // Returns: { compoundSymptomDays, escalationTier, primarySymptom, activeIllnesses }
}
```

### Output schema

```js
{
  compoundSymptomDays: number,  // days where 2+ illness types overlap, max 30-day window
  escalationTier: 0 | 1 | 2 | 3, // 0 = nothing active; 3 = critical compound (3+ illnesses, multi-day)
  primarySymptom: 'fever' | 'diarrhoea' | 'vomiting' | 'cold' | null,
  activeIllnesses: Array<{type, startDate, severity}>,
}
```

### Why this is a primitive, not a feature

CareTicket trigger doctrine (v3-2) consumes posture; cross-domain CT triggers (C-7) consume posture; severity-message generator (Scoring Arc S-2) consumes posture. Without the accessor, each consumer re-implements illness-set semantics.

---

## Primitive 5 — `getSyncPosture()`

**File:** `split/sync.js` (Kael's Region).

### Contract

```js
function getSyncPosture() {
  // Synchronous in-memory read; NO network round-trip (Cipher concern from Kael v3.0 risk register).
  // Returns: { circuitOpen, lastSyncMs, pendingWrites, healthTier }
}
```

### Output schema

```js
{
  circuitOpen: boolean,         // crash-circuit-breaker state
  lastSyncMs: number | null,    // wall-clock ms timestamp of last successful sync
  pendingWrites: number,        // count of queued writes
  healthTier: 'healthy' | 'degraded' | 'broken',
}
```

### Why synchronous (Charter Honesty + design constraint)

Kael's v3.0 risk register (chronicle §3.2): "Sync deadlocks via observability over-reach. `getSyncPosture()` must be a synchronous read of in-memory state. Do NOT make it await a network round-trip — that's a deadlock waiting for the circuit-breaker to fire on the wrong thread."

`getSyncPosture()` reads existing in-memory state (`_syncErrorCount`, `_syncDisabled`, `_lastSyncTs`, etc.). No new state introduced; no async fetch. Honesty axis: every consumer can read sync state without trust violation.

---

## HR-12 `tz-construction` test plan (Cipher cipher-4 MUST)

Every Date construction in v3-3 must be timezone-safe. The test plan:

### 1. `_correlate` date iteration

The signal-extractor loop walks dates day-by-day. Construction pattern:
```js
// CORRECT (uses _offsetDateStr, existing timezone-safe helper)
const dateStr = _offsetDateStr(endDate, -i);
// WRONG — drops into UTC midnight at day boundary
const d = new Date(endDate); d.setDate(d.getDate() - i);
```

**Test:** `regression-guard-v3-3-correlate-tz-safe` — seed signal-extractors with known data at IST midnight (00:00 IST = 18:30 UTC previous day); assert the loop iterates the IST calendar day, not the UTC calendar day.

### 2. `_resolveEventAnchor` anchor resolution

Each anchor type involves a date subtraction or comparison. The test plan covers each anchor type:

- **"since the fever"** — illness start date is read from `feverEpisodes[i].startDate`. Stored as 'YYYY-MM-DD' (already timezone-safe). End = `today()` (existing helper). Window: pass.
- **"the week of MMR"** — vaccine date from `vaccData[i].date` is 'YYYY-MM-DD'. Use `_offsetDateStr` for ±3d. No raw `new Date()` arithmetic.
- **"before solids"** — milestone date from milestone DB; same shape.

**Test:** `regression-guard-v3-3-event-anchor-tz-safe` — seed milestone DB with a milestone date `'2026-05-25'`; verify `_resolveEventAnchor("the week of solids")` returns `{start:'2026-05-22', end:'2026-05-28'}` regardless of local timezone (CI runs in UTC; manual test runs in IST should produce identical output).

### 3. `_scoreDay` date-key arithmetic

`_scoreDay(domain, date, dataset)` uses `date` as a 'YYYY-MM-DD' string lookup key — no Date construction needed. **Test:** asserts the function never reads `Date.now()` or constructs `new Date()` directly; uses `today()`, `_offsetDateStr` exclusively.

### 4. `getActiveIllnessPosture` date math

Computes `compoundSymptomDays` across a 30-day window. Uses `_offsetDateStr` iteration. **Test:** seed overlapping illness episodes across a fixed date range; assert posture count matches expected on IST and UTC reproducibly.

### 5. Build-time grep gate

Add to `split/build.sh` audit-emoji.sh family: grep for `new Date\(` and `Date.now\(` inside `split/intelligence-correlate.js` + `split/intelligence-isl.js` + the v3-3 additions to `split/core.js`. **Any direct Date construction fails the build** unless explicitly comment-justified with `// HR-12-safe: <rationale>`.

---

## Files touched

| File | Region | Type | Lines (estimate) |
|---|---|---|---|
| `split/intelligence-correlate.js` (NEW) | Kael | New module | ~600 |
| `split/intelligence-isl.js` | Kael | Extension (`_resolveEventAnchor` + anchor type registry) | ~200 added |
| `split/core.js` | Kael | `_scoreDay` + `_scoreWindow` + `_scoreDayHero` + `_evaluateRecommendation` + `_getActiveStandard` | ~400 added |
| `split/intelligence-illness.js` | Kael | `getActiveIllnessPosture` | ~80 added |
| `split/sync.js` | Kael | `getSyncPosture` | ~30 added |
| `split/data.js` | Kael | `RECOMMENDATION_ROSTER` + `SEVERITY_THRESHOLDS` + `DOMAIN_WEIGHTS_HERO` + `STANDARDS_FALLBACK_CHAIN` | ~300 added |
| `tests/e2e/v3-3-engine-spine.spec.ts` (NEW) | — | E2E tests | ~400 |

**Total new LOC estimate:** ~2,000 (mostly the new correlate module + data constants + tests).

## Region routing — canon-cc-008 chain

**Kael primary** — every file touched is in Kael's jurisdiction (intelligence-isl + intelligence-illness + core + data + sync + new intelligence-correlate).

**Maren NOT summoned** — no home/diet/medical touched. (Maren's pair-note involvement comes at Sleep Arc 3 / Scoring Arc S-2 when sleep handlers register; not at v3-3 itself.)

**Vela NOT summoned** — no render surface touched.

**No styles.css / template.html** — no triple-jurisdiction.

**Chain at PR-ready time:**
1. `pnpm build` clean
2. Kael Mode-1 audit (entire diff, primitives + tests)
3. Lyra synth
4. Cipher Edict V (now with three Charter-axis checks: cipher-honesty / cipher-extensibility / cipher-warmth per CV3-006)

---

## Test plan

### Functional tests

| Test | Primitive | Asserts |
|---|---|---|
| `regression-guard-v3-3-correlate-pearson` | `_correlate` | Pearson math correct on known-good fixtures |
| `regression-guard-v3-3-correlate-confidence-floor` | `_correlate` | Returns null when `sampleSize < 7` or `\|strength\| < 0.4` |
| `regression-guard-v3-3-correlate-tz-safe` | `_correlate` | HR-12: walks IST calendar days, not UTC |
| `regression-guard-v3-3-correlate-lag-analysis` | `_correlate` | Reports strongest lag across [-3, +3] day shifts |
| `regression-guard-v3-3-event-anchor-fever` | `_resolveEventAnchor` | "since the fever" resolves to most recent fever episode start → today |
| `regression-guard-v3-3-event-anchor-vaccine` | `_resolveEventAnchor` | "the week of MMR" → ±3d window |
| `regression-guard-v3-3-event-anchor-milestone` | `_resolveEventAnchor` | "since rolling" → milestone date → today |
| `regression-guard-v3-3-event-anchor-tz-safe` | `_resolveEventAnchor` | HR-12: windows reproducible across timezones |
| `regression-guard-v3-3-illness-posture-compound` | `getActiveIllnessPosture` | 2+ overlapping illnesses → tier 2; 3+ → tier 3 |
| `regression-guard-v3-3-sync-posture-sync` | `getSyncPosture` | Synchronous return; no `await` in implementation |
| `regression-guard-v3-3-score-day-shape` | `_scoreDay` | Output schema matches scoring-redesign-v1 contract |
| `regression-guard-v3-3-score-window-rolling` | `_scoreWindow` | 7-day window aggregates correctly |
| `regression-guard-v3-3-score-hero-weighted` | `_scoreDayHero` | Per-domain weights applied; severity merging correct |
| `regression-guard-v3-3-evaluate-rec-active-standard` | `_evaluateRecommendation` | Reads `ziva_reference_standard`; falls back to WHO |
| `regression-guard-v3-3-no-direct-date-construction` | Build-time gate | grep for `new Date\(` / `Date.now\(` outside justified sites |

### Performance gates

- `_correlate` over 30-day window with 7 signal extractors: p95 < 50ms on Ziva-scale data
- `_scoreDay`: p95 < 5ms per day
- `getActiveIllnessPosture`: p95 < 3ms (in-memory read)
- `getSyncPosture`: p95 < 1ms (synchronous in-memory read)

### Regression sweep

All existing 173 e2e tests must remain green. Pre-existing build-script-contract failure (smoke.spec.ts:723) stays out-of-scope.

---

## HR pre-check

| HR | Risk | Mitigation |
|----|------|------------|
| HR-1 (no emojis) | n/a | Engine-only |
| HR-3 (no inline handlers) | n/a | No DOM |
| HR-4 (escHtml at boundaries) | n/a | No render |
| HR-5 (tokens-only) | n/a | No CSS |
| HR-9 (post-build multi-round QA) | structural | canon-cc-008 chain runs |
| **HR-12 (timezone-safe dates)** | **HIGH** | **Full test plan above; build-time grep gate; Cipher cipher-4 cross-check** |

---

## Charter compliance per CV3-006

### Axis 1 — Intellectual honesty

- ✓ `_correlate` returns `{sampleSize, confidence}` — every claim self-discloses
- ✓ Hard floors: `sampleSize ≥ 7` AND `|strength| ≥ 0.4` before any surface fires
- ✓ `_predictMilestoneWindow` returns clinical ranges from milestone DB; never personalised predictions
- ✓ `getActiveIllnessPosture` doesn't claim certainty — it reports state, not prediction
- ✓ `getSyncPosture` reads ground-truth state; no inference

### Axis 2 — Architectural extensibility

- ✓ `_correlate` is domain-pair-agnostic; new pairs = new rows in `SIGNAL_EXTRACTORS`
- ✓ `RECOMMENDATION_ROSTER` is the row-addition substrate
- ✓ `_resolveEventAnchor` registry is data-driven (anchor patterns table)
- ✓ Domain plug-ins (`_domainPerRecordScore`, `_domainDayBonuses`) extend without engine change
- ✓ Every primitive lands as a function in an existing file or a single new module — no engine refactor required for future arcs

### Axis 3 — Linguistic + visual warmth

- ✓ Engine-only arc; warmth is downstream concern
- ✓ Output shapes pre-shaped for v3-4 narrative layer (`{sampleSize, strength, confidence}` maps directly to hedge tier per CV3-002)
- ✓ Cipher cipher-warmth check: no primitive output prevents warm rendering by downstream consumer

---

## Out-of-scope

- **Render surface** — every consumer arc (v3-1, v3-2, v3-4, v3-6) handles its own
- **Sleep-domain handlers** — register at Sleep Arc 3 / Scoring Arc S-2 merged PR
- **R-1 adaptive overrides** — reserved field on `RECOMMENDATION_ROSTER` rows (null in v1); activated at R-1 arc
- **Firestore `recommendationEvents` collection** — deferred per `scoring-redesign-v1.md` §(c); v3-1's blocking open question on chronicle §4.8 #2 resolves before v3-1 opens

---

## Sequencing

**Upstream gates (all clear post-PR #126/#127/#128/#129/#130 merge):**
- ✓ PR #126 (D3 Phase 2-B impl) merged
- ✓ PR #127 (Sleep redesign v1 spec) merged — defines sleep-side consumer shape
- ✓ PR #128 (Scoring redesign v1 spec) merged — defines `_scoreDay` contract this implements
- ✓ PR #129 (Chronicle) merged — Wave 1 plan canonical
- ✓ PR #130 (Charter v3-CV3-006) merged — Charter alignment section required

**Open in parallel with v3-3:**
- v3-5 (Chip Taxonomy + TSF Story-Arc) — independent; styles.css mutex 1st; Vela primary

**Downstream unblocked by v3-3:**
- v3-1 (Recommendation Pipeline) — needs `_scoreDay` + posture accessors
- v3-2 (CareTicket Triggers) — needs `getActiveIllnessPosture` + `_evaluateRecommendation`
- v3-4 (Narrative Layer) — needs `_correlate` for data source
- v3-6 (Card Priority) — needs `_scoreDay.severityLevel` for priority signal
- R-1 (Adaptive Layer) — needs `_correlate` + `_scoreDay` to calibrate against
- R-3 (Audit/History) — needs `_scoreWindow` for longitudinal aggregation

---

## Doctrinal references

- `docs/specs/sproutlab-v3-roundtable-2026-05-25.md` §4.2 v3-3 row (chronicle authority)
- `docs/specs/sproutlab-v3-charter.md` (CV3-006 — three-axis alignment required for every Mode-1 spec)
- `docs/specs/scoring-redesign-v1.md` (sibling — engine primitive contracts this implements)
- `docs/specs/sleep-redesign-v1.md` (sibling — first consumer at merged Arc 3 / Arc S-2)
- CV3-001 Observe-vs-Answer (this spec's posture accessors honor)
- CV3-004 Cross-Region Pair-Note (this spec is Kael-primary, no pair needed)
- canon-cc-008 + canon-cc-022 + canon-cc-026 + canon-cc-027 (process floor)
- HR-12 (the named risk register — full test plan above)

---

— *Lyra (main-session), 2026-05-25, v3-3 spec drafted post-Charter-ratification (CV3-006). The engine spine; what every other arc consumes. Architect-direct: "open engine spine." Spec is ready for canon-cc-008 chain (Kael primary, no pair) once the PR opens.*
