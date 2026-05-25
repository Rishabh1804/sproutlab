# Sleep Redesign v1 — engine-derived classification + location + surface-quality scoring

**Spec version:** v1
**Date:** 2026-05-25
**Branch:** `claude/sleep-redesign-v1-spec`
**Author:** Lyra (main-session — Mode-1 spec authoring)
**Promoted from:**
- Rollover-bug investigation against `zivabackup20260525.json` (this session) — one confirmed case at `2026-05-18` where a Sunday-night-overflow record (`bedtime:'00:40'`, 8h duration) was attributed to Monday, inflating Monday's sleep total by ~8h.
- Architect-ratified architectural shift (this session) — move sleep classification from parent-input (`type:'night'|'nap'` + `napType`) to engine-derived, and introduce a `location` dimension that drives both classification and surface-quality scoring.
**Status:** v0 — spec-only PR; canon-cc-008 explicitly waived (docs-only). Implementation runs as **three separate Arcs** sequenced **AFTER the food sub-tab arc** per Architect direction (this session): "we'll implement this sleep upgrade after food sub-tab arc is completed. keeps the features and upgrades sequential and easy to track."

---

## What Sleep Redesign v1 is

Replace the parent-decided sleep classification with an engine-derived three-class model (`night | nap | contact`) plus a `location` dimension that doubles as the input to surface-quality scoring. The classifier subsumes the midnight-rollover bug as a natural consequence of its day-attribution rule — no special-case rollover code path needed.

**Three concurrent shifts:**

1. **Fewer parent decisions at log-time.** Parent enters factual inputs only — `bedtime`, `wakeTime`, `location` (+ optional `wakeUps`, `quality`, `notes`). The engine derives `class` and `dayAttribution`.
2. **Location as a first-class dimension.** `bed | sofa | contact | others-with-comment`. Contact is its own developmental category; bed and sofa are independent-of-caregiver; sofa's quality concern routes through scoring, not classification.
3. **Surface-quality scoring layer.** Location feeds into the score primitive — bed and contact carry positive scoring weight; sofa, car, and "others" carry negative weight. Class-combinations involving a nap get a positive rating (more sleep is better for infants/toddlers per Architect doctrine).

## What Sleep Redesign v1 is NOT

- A breaking schema change. Lazy read-time migration; original parent inputs (`type` / `napType`) preserved as audit data on every legacy record.
- A retroactive backfill. Records are rewritten only when the parent edits them (or via an opt-in future migration arc).
- A scoring-system rewrite. Adds location-quality weighting; doesn't restructure the existing score primitives.
- A `wakeUps` / `quality` removal. Those stay as optional parent inputs (auxiliary metadata; not classification axes).
- A v2 of the sleep surface. v1 establishes the engine primitive + lazy normalizer + UX shift. v2 (if needed) handles aggregate reporting redesign once the new schema settles.

## The bug this subsumes (concrete)

From `zivabackup20260525.json` — `ziva_sleep` array, date `2026-05-18` (Monday) carries two `type:'night'` records:

| bedtime | wakeTime | duration | ts (logged) | parent-intent |
|---|---|---|---|---|
| 22:04 | 08:55 | ~11h | 2026-05-19 (Tuesday morning) | Monday-night sleep ✓ |
| 00:40 | 08:40 | ~8h | 2026-05-18 (Monday afternoon) | **Sunday-night spillover** — parent logged it after waking Monday morning, `today()` returned Monday, record attributed to Monday's date key |

Monday's sleep aggregator (`_islSleepData` + nap-stack chart) sums both → ~19h of "Monday sleep" → the steep rise the Architect observed.

Across the 60 night records in the live data, exactly one (`bedtime < 05:00`) exhibits this pattern. The discriminator is unambiguous: **a `type:'night'` record with `bedtime` in the early-morning band is always parent-attribution overflow from the prior day.**

Arc 1's classifier handles this case via its day-attribution rule (`bedtimeMin < 300 → dateKey − 1`) without any special-case "rollover" code path. Same rule applies to all three classes.

---

## Schema

**Legacy shape (preserved on disk; read through normalizer):**
```js
{
  date: 'YYYY-MM-DD',          // wall-clock date at write time (THE BUG SURFACE)
  bedtime: 'HH:MM',            // 24h en-GB (V-M-60 convention)
  wakeTime: 'HH:MM',
  type: 'night' | 'nap',       // parent decision at log-time
  napType: 'morning' | 'afternoon' | 'evening' | 'night',  // only when type==='nap'
  wakeUps: number,             // only when type==='night'
  quality: 'good' | 'fair' | null,
  notes: string,
  ts: ISOString,
  __sync_updatedBy: {...}
}
```

**New shape (Arc 2 writes emit this; Arc 1's normalizer derives this from legacy):**
```js
{
  date: 'YYYY-MM-DD',          // dayAttribution from the classifier (NOT wall-clock at write time)
  bedtime: 'HH:MM',
  wakeTime: 'HH:MM',
  location: 'bed' | 'sofa' | 'contact' | 'others',
  locationNote: string | null, // only when location === 'others'
  wakeUps: number | null,      // optional auxiliary metadata
  quality: 'good' | 'fair' | 'poor' | null,
  notes: string,
  ts: ISOString,
  // Legacy fields preserved when present (audit-safe):
  type?: 'night' | 'nap',      // legacy parent input — never written by Arc 2; preserved on legacy reads
  napType?: '...',
  __sync_updatedBy: {...}
}
```

**Derived fields (returned by `classifySleep()`, never persisted):**
```js
{
  class: 'night' | 'nap' | 'contact',
  dayAttribution: 'YYYY-MM-DD',   // may equal dateKey or dateKey−1
  durationMin: number,             // bedtime → wakeTime in minutes, cross-midnight aware
  qualityScore: number,            // surface-quality contribution (Arc 3)
  confidence: 'high' | 'medium' | 'low',
}
```

## Migration policy — **lazy**

No one-shot backfill. No mass rewrite. The classifier runs at read-time inside a `normalizeSleep(record)` helper in `core.js`. Every reader of `sleepData` migrates to read through the normalizer (Arc 1 work).

**Why lazy over one-shot** (decision rationale ratified this session):

| Concern | Lazy | One-shot |
|---|---|---|
| Write-back risk | Zero | Real (classifier bug could corrupt records) |
| Audit safety | Originals untouched, always | Originals optionally kept under `_orig` |
| Rollback | Trivial (drop the normalizer) | Hard (reverse migration needed) |
| Sync races | None — every device reads same | Real — device A migrates, device B doesn't; Firestore last-write-wins on the merged shape |
| Classifier-version churn | Re-runs every read — always current | Backfill must re-run when rules change; needs `_classifierVersion` field |
| Perf (217 records today, growing linearly) | ~5ms per pass — negligible | One-time; subsequent reads cheap |
| Storage shape | Heterogeneous (legacy + new coexist) | Homogeneous after migration |
| Discipline cost | Every read path must go through `normalizeSleep()` (Governor-enforced) | Storage is canonical; readers stay simple |
| Future Tier-3+ ML primitive | Slightly messier (heterogeneous shape) | Cleaner |

SproutLab is Ziva-first, audit-first, Firestore-synced. The cons of one-shot (sync race + write-back risk + rule-version churn) are architectural; the pros (perf, homogeneity) are negligible at this scale. **Lazy honors both "data collection easier" AND "never destroy what the parent recorded."** A future Tier-3+ arc may opt-in to a one-shot backfill once classifier rules settle.

---

## Three-class classifier (Arc 1, lives in `core.js`)

**Inputs:** `bedtime`, `wakeTime`, `location`, `dateKey` (the wall-clock date the parent saved on — i.e. the current `record.date` field).

**Helper:** `durationMin(bedtime, wakeTime)` — handles cross-midnight wrap. If `_hhmmToMinutes(wakeTime) < _hhmmToMinutes(bedtime)`, add 24×60 to wakeTime's minute count.

**Classification rules (in evaluation order):**

```
1. crossesMorning = _hhmmToMinutes(wakeTime) ∈ [300, 720]  // 05:00–12:00
2. durationMinutes = durationMin(bedtime, wakeTime)
3. bedtimeMin = _hhmmToMinutes(bedtime)

class:
  if location === 'contact'                       → 'contact'
  else if durationMinutes ≥ 240 AND crossesMorning → 'night'   // ≥4h ending in the morning
  else                                            → 'nap'

dayAttribution:
  if bedtimeMin < 300                              → dateKey − 1     // 00:00–04:59 wall-clock = prior day's overflow
  else                                            → dateKey

confidence:
  high   — class derived from durationMinutes >= 240 AND crossesMorning, OR location === 'contact'
  medium — class is 'nap' AND durationMinutes >= 180 (long daytime nap, unambiguous category)
  low    — class is 'nap' AND durationMinutes < 60 (short cap-nap; could be transitional)
```

**Confirmation on `contact`:** contact-location keeps the entry in `'contact'` class regardless of duration or time-of-day. A 6-hour contact-sleep at night is a "contact" record, not a "night" record. Developmentally distinct: contact sleep is parent-body-anchored, structurally different from independent night sleep. (Architect ratification this session: "night, nap and contact will count as 3 things.")

**Confirmation on `sofa`:** sofa goes through the duration/cross-morning gate — a long sofa sleep CAN be classified as `'night'`. The sofa-quality concern routes through the **scoring** layer, not classification. (Architect ratification this session: "sofa quality actually determines that but that's too much input from a parent, so we'll default sofa to sleep if it falls in that range, we'll use the scoring system to penalise sleep and nap on sofa/car/other areas than contact or bed.")

**Confirmation on `others`:** `location:'others'` (with comment) goes through standard rules — treated as bed-equivalent for classification. The free-text `locationNote` is not parsed by the engine; it's parent-readable metadata.

## Day-attribution edge cases (Arc 1)

| bedtime | parent-intent | dateKey | dayAttribution | rationale |
|---|---|---|---|---|
| 22:04 Sun | Sunday-night sleep | Sun | Sun | bedtimeMin ≥ 300; keeps dateKey |
| 23:55 Sun | Sunday-night sleep starting just before midnight | Sun | Sun | bedtimeMin ≥ 300; keeps dateKey |
| 00:40 Mon (parent logs Monday afternoon) | Sunday-night spillover | Mon | **Sun** (Mon − 1) | bedtimeMin = 40 < 300; → dateKey − 1 |
| 03:30 Mon (parent contact-naps the baby down) | Sunday-night tail | Mon | **Sun** (Mon − 1) | bedtimeMin = 210 < 300; → dateKey − 1; classified as 'contact' if location matches |
| 05:30 Mon (early morning wake → back-to-sleep) | Monday's early-morning nap | Mon | Mon | bedtimeMin = 330 ≥ 300; keeps dateKey |

Threshold rationale (300 minutes / 05:00): the live data shows the bug case at bedtime 00:40 with wide buffer; no legitimate night-sleep entry in 217 records starts between 00:00–05:00. 05:00 cleanly separates "previous-day overflow" from "early-morning resume."

---

## Surface-quality scoring (Arc 3)

Architect-ratified contract (this session):
- **Class combinations involving `nap` get a positive rating.** More sleep is better for infants/toddlers. The scoring engine sums sleep contributions; a `nap` record adds positively regardless of duration.
- **Location quality drives a multiplier.** Bed and contact carry positive scoring weight (structured / developmentally-valuable). Sofa and "others" (car, stroller, etc.) carry negative scoring weight (suboptimal surface).
- Sleep surface quality affects scoring directly — `quality` and `wakeUps` fields contribute as auxiliary signals.

**Concrete scoring contract (Arc 3 implements; values illustrative, ratified at Arc 3 implementation):**

| Class | Location | Score weight |
|---|---|---|
| night | bed | +1.0 (baseline) |
| night | contact | +0.9 (close-second; structured but not independent) |
| night | sofa | +0.4 (penalty; suboptimal surface) |
| night | others | +0.4 (assumed sofa-equivalent) |
| nap | bed | +0.7 |
| nap | contact | +0.8 (contact-nap is developmentally-valuable) |
| nap | sofa | +0.3 |
| nap | others | +0.3 |
| contact | (n/a — class IS location) | +0.8 |

**Class-combination-with-nap bonus:** if a day's sleepData contains at least one `nap` AND at least one `night` record, add a small day-level bonus to the day's sleep score (e.g. +0.1). Reflects the "more sleep is better" doctrine — a day with both structured night sleep AND daytime naps is better than night-only.

**Quality + wakeUps as auxiliary signals:**
- `quality === 'good'` → multiplier ×1.1; `'fair'` → ×1.0; `'poor'` → ×0.85
- `wakeUps >= 5` on a night-class record → multiplier ×0.85 (signals disrupted sleep)

Arc 3 spec ratifies the exact numbers; this spec body locks the *shape* of the scoring contract.

---

## Phasing — three Arcs

Implementation runs as three independent PRs, sequenced **AFTER the food sub-tab arc** completes. Architect direction: "create a PR but we'll implement this sleep upgrade after food sub-tab arc is completed. keeps the features and upgrades sequential and easy to track."

| Arc | Items | Files touched | Region routing | Approx PR scope |
|---|---|---|---|---|
| **Arc 1 — Classifier + lazy normalizer** | `classifySleep()` + `normalizeSleep()` in core.js + read-side adoption in `_islSleepData` (intelligence-isl.js) + nap-stack chart adoption in medical.js + TSF nap-pattern adoption in intelligence-quicklog.js | core.js + intelligence-isl.js + medical.js + intelligence-quicklog.js | Maren + Kael + Vela (engine-primary + multi-region read adoption); no styles.css → no triple-jurisdiction | 1 PR |
| **Arc 2 — Write-side UX shift** | Unified sleep form (bedtime + wakeTime + location chip selector); collapse `saveQLSleep` / `saveQLNap` / `saveSleep` / `saveNap` write paths into one shared write helper that emits the new schema | intelligence-quicklog.js + medical.js + styles.css (chip selector tokens) | Maren + Vela (write paths) + triple-jurisdiction on styles.css | 1 PR |
| **Arc 3 — Scoring integration** | Location-quality multipliers wired into the existing score engine; class-combination-with-nap day-level bonus; quality + wakeUps multipliers | core.js + home.js (score engine) | Kael primary (score engine) + Maren consult (home.js render of the score) | 1 PR |

**Arc 1 alone solves the live bug** (`2026-05-18` rollover) because the normalizer's day-attribution rule reassigns the 00:40 record to Sunday on every read pass. No write to disk needed for the live fix. Arc 2 then prevents future occurrences at write-time. Arc 3 lights up the scoring surface.

**Sequencing rationale:** Arc 1 first because it's the engine primitive Arcs 2 + 3 build on. Arc 1 is also the smallest blast radius (engine-side only, zero UX change). Arc 2 second because UX shifts benefit from the engine primitive being solid. Arc 3 last because scoring requires both the classifier output AND the location field to be live.

**Interleave point:** Architect direction permits interleaving with D3 Phase 2-C between Arcs. Likely cadence: D3 Phase 2-B (#126 merge) → food sub-tab arc → Arc 1 → D3 Phase 2-C → Arc 2 → Arc 3.

---

## Arc 1 — Classifier + lazy normalizer (detail)

### A1-1 — `classifySleep()` and `normalizeSleep()` in `core.js`

**File:** `split/core.js` (Kael's region; placed alongside `parseMedCheck` / `_detectFatContextNearTime` per the "engine-layer normalizer next to its peers" doctrine pattern).

**Fix shape:**

```js
// Sleep redesign v1 — engine-derived classification.
// Three-class output: 'night' | 'nap' | 'contact'. Day-attribution rule routes past-midnight
// bedtimes to the prior date, subsuming the parent-attribution rollover bug.
function classifySleep(bedtime, wakeTime, location, dateKey) {
  if (typeof bedtime !== 'string' || typeof wakeTime !== 'string') return null;
  const bMin = _hhmmToMinutes(bedtime);
  const wMin = _hhmmToMinutes(wakeTime);
  if (bMin < 0 || wMin < 0) return null;
  const durationMinutes = wMin >= bMin ? (wMin - bMin) : (wMin + 1440 - bMin);
  const crossesMorning = wMin >= 300 && wMin <= 720;
  let cls;
  if (location === 'contact')                                  cls = 'contact';
  else if (durationMinutes >= 240 && crossesMorning)           cls = 'night';
  else                                                         cls = 'nap';
  const dayAttribution = (bMin < 300) ? _offsetDateStr(dateKey, -1) : dateKey;
  let confidence;
  if (cls === 'contact' || (cls === 'night' && durationMinutes >= 240 && crossesMorning)) confidence = 'high';
  else if (cls === 'nap' && durationMinutes >= 180)            confidence = 'medium';
  else                                                         confidence = 'low';
  return { class: cls, dayAttribution, durationMin: durationMinutes, confidence };
}

// Lazy normalizer — every reader of sleepData routes through this. Legacy records
// (type:'night'|'nap' + napType) get classified using inferred location heuristics:
// legacy 'night' → location:'bed' (the dominant case in the live data)
// legacy 'nap' + napType:'morning'|'afternoon'|'evening' → location:'bed' (default)
// legacy 'nap' + napType:'night' (evening cap-nap) → location:'bed'
// Legacy records WITHOUT a location field never imply 'contact' — contact was unrecorded.
function normalizeSleep(record) {
  if (!record || typeof record !== 'object') return null;
  const location = (record.location || 'bed');  // legacy default
  const derived = classifySleep(record.bedtime, record.wakeTime, location, record.date);
  if (!derived) return null;
  return Object.assign({}, record, {
    _location: location,
    _class: derived.class,
    _dayAttribution: derived.dayAttribution,
    _durationMin: derived.durationMin,
    _confidence: derived.confidence,
    // Underscore-prefixed = derived/never-persisted. Originals untouched.
  });
}
```

**Test:** `sleep-redesign-v1-a1-1-classifier-matrix` — table-driven test of the rule matrix across (duration × crossesMorning × location) combinations + dayAttribution boundary at bedtime 04:59 / 05:00.

### A1-2 — Read-side adoption: `_islSleepData` (`intelligence-isl.js`)

**File:** `split/intelligence-isl.js` (Kael).

**Fix shape:** the day-bucket aggregator currently does `sleepData.filter(s => s.date === ds)`. New version groups by `normalizeSleep(s)._dayAttribution`:

```js
function _islSleepData(startDate, endDate) {
  // ... existing date iteration ...
  for (const ds of dateStrings) {
    const dayEntries = sleepData
      .map(normalizeSleep)
      .filter(s => s && s._dayAttribution === ds);
    // ... existing aggregation logic uses s._class instead of s.type, s._durationMin instead of recomputed ...
  }
}
```

**Test:** `sleep-redesign-v1-a1-2-rollover-2026-05-18` — replay the live bug scenario. Seed two `type:'night'` records on date 2026-05-18 (one with bedtime 22:04, one with bedtime 00:40). Assert that the 00:40 record attaches to 2026-05-17 (Sunday) after normalization, and Monday 2026-05-18 aggregates only the 22:04 record.

### A1-3 — Read-side adoption: nap-stack chart (`medical.js`)

**File:** `split/medical.js` around line 5787 (existing `napData[]` aggregation for the chart).

**Fix shape:** the chart iterator currently filters `sleepData.filter(s => s.date === ds && s.type === 'nap')`. New version uses normalized class:

```js
const dayEntries = sleepData
  .map(normalizeSleep)
  .filter(s => s && s._dayAttribution === ds && (s._class === 'nap' || s._class === 'contact'));
```

Note `'contact'` class also contributes to the nap-stack (it's daytime/contact sleep, visually grouped with naps in the chart). Decision deferred to Arc 1 implementation: whether to give contact-class a distinct stack color or merge with nap.

**Test:** `sleep-redesign-v1-a1-3-nap-stack-uses-class-not-type` — assert the nap-stack chart correctly buckets a legacy `type:'nap'` record under the new `_class:'nap'`, AND correctly attributes a past-midnight night-class record to the prior day's stack.

### A1-4 — Read-side adoption: TSF nap-pattern detection (`intelligence-quicklog.js`)

**File:** `split/intelligence-quicklog.js` — the `patternDefs` array at `_tsfDetectPatterns` already references nap patterns ('morning-nap', 'afternoon-nap'). Inspect whether the pattern detection consumes `sleepData` directly or via an accessor; if directly, route through `normalizeSleep`.

**Test:** `sleep-redesign-v1-a1-4-tsf-nap-pattern-uses-class` — covered if A1-3's nap-stack test asserts the same data path; otherwise add an explicit TSF test.

### A1-5 — Doctrine note + audit comment block in core.js

A one-line doctrine note added to `docs/specs/sleep-redesign-v1.md` (this file, Arc 1 cycle): "**midnight-rollover doctrine**: any HH:MM input where the meaning is *the day the activity belongs to, not the wall-clock day* must defer the date selection at write time, or be normalized at read time. PR #126 T2-B.2 (D3 Adjust UI) handled this case via toast-and-abort at write time; Arc 1 of Sleep Redesign v1 handles the analogous sleep case via classifier-driven dayAttribution at read time. Both paths are valid; the choice depends on whether the parent can correct the mistake (D3 Adjust: yes, re-open Adjust; Sleep: no, sleep already happened, the system makes the attribution choice)."

This doctrine line clusters with PR #122 T1-2 / PR #125 T2-A.1+A.2 / PR #126 T2-B.2 as the **midnight-rollover doctrine** canon.

---

## Arc 2 — Write-side UX shift (summary; detail spec at Arc 2 implementation time)

**Scope:** unify `saveQLSleep` + `saveQLNap` (intelligence-quicklog.js) and `saveSleep` + `saveNap` (medical.js) into a single `saveSleepEntry()` helper that emits the new schema with `location`. Form UX adds a four-option chip selector for location (bed/sofa/contact/others); legacy `type` + `napType` parent inputs are removed from the form.

**Region routing:** Maren (home/diet/medical.js write paths) + Vela (intelligence-quicklog.js Smart Quick Log form) + triple-jurisdiction on styles.css for the new chip selector tokens.

**Tests:** form smoke + new-record schema assertion + legacy-record compat (old records still readable through normalizer post-shift).

**Sequencing:** Arc 2 starts AFTER Arc 1 merges (so the classifier primitive is available for the form to call as preview/confirmation).

---

## Arc 3 — Scoring integration (summary; detail spec at Arc 3 implementation time)

**Scope:** wire location-quality multipliers into the existing sleep score primitive (likely in `core.js` and surfaced in `home.js`'s hero score). Add the class-combination-with-nap day-level bonus. Add quality + wakeUps multipliers.

**Region routing:** Kael primary (score engine in core.js) + Maren consult (home.js render of the score gauge / hero score impact).

**Tests:** scoring delta tests — assert that a sofa-night scores lower than a bed-night, a bed+contact-nap day scores higher than a bed-only day, etc.

**Sequencing:** Arc 3 starts AFTER Arc 2 — needs the `location` field to be live on new records before scoring can use it meaningfully.

---

## Doctrinal cluster

- **Midnight-rollover doctrine** — established cross-PR cluster: PR #122 T1-2 (D3 pattern card live-update on tab/sync), PR #125 T2-A.1 + T2-A.2 (D3 adherence + streak exclude-today on unlogged morning), PR #126 T2-B.2 (D3 adjust midnight-rollover toast), this spec Arc 1 (sleep classifier dayAttribution). Common theme: parent's mental-model day boundary does not always equal `today()`'s wall-clock day boundary.
- **"Data collection easier" doctrine** — Architect direction (this session): reduce parent decision points at log-time; let the intelligence engine derive what it can.
- **Lazy-migration audit-safety** — preserve parent-recorded data on disk; derive new shape at read. Mirror of T1-6's `parseMedCheck` returning null for the `cleared` sentinel (raw audit preserved, active-state derived).
- **Schema-aware reads via centralized normalizers** — `parseMedCheck` for med-checks, `normalizeSleep` for sleep records. Future Governors auditing this region check the normalizer call site at every read.

## QA chain (canon-cc-008)

- **This PR (spec, docs-only):** canon-cc-008 **explicitly waived** per the "docs-only" branch of the chain. Mirrors PR #123's pattern.
- **Arc 1:** Maren + Kael + Vela parallel (core.js + intelligence-isl.js + medical.js + intelligence-quicklog.js); no styles.css → no triple-jurisdiction. Lyra synth → Cipher Edict V.
- **Arc 2:** Maren + Vela parallel + triple-jurisdiction on styles.css (rotation Maren → Kael → Vela, first-Governor by heaviest-touched Region — likely Vela for the chip selector). Lyra synth → Cipher Edict V.
- **Arc 3:** Kael primary + Maren consult (score-engine touches); no triple-jurisdiction. Lyra synth → Cipher Edict V.

## HR pre-check (Arc 1)

| HR | Risk | Mitigation |
|----|------|------------|
| HR-1 (no emojis) | n/a | No icon work in Arc 1 (engine-only) |
| HR-2 (no inline styles) | n/a | No CSS in Arc 1 |
| HR-3 (no inline handlers) | n/a | No new DOM in Arc 1 |
| HR-4 (escHtml at boundaries) | low | Normalizer output is structured data; rendering boundaries unchanged. Arc 2 takes on the `locationNote` parent-input escape boundary |
| HR-5 (tokens-only) | n/a | No CSS in Arc 1 |
| HR-12 (timezone-safe dates) | medium | `_offsetDateStr(dateKey, -1)` already used elsewhere in the codebase — timezone-safe. `classifySleep` does no Date construction (HH:MM minute arithmetic only). |

Arc 2 + Arc 3 HR-checks ratified at their own implementation-time specs.

## Out-of-scope (deferred to v2 / v3 / future arcs)

- One-shot backfill of legacy records (optional future arc; not blocking Arc 1's bug fix)
- Free-text parsing of `locationNote` ("car seat" auto-detection, etc.) — engine ignores free text
- Multi-tenant family-config (Ziva-first per Architect doctrine)
- Sleep-deprivation CareTicket auto-creation (future cross-domain arc once Arc 3 scoring lands)
- ML-based sleep classification (rule-based classifier is intentional for v1 — explainable, debuggable, audit-friendly)
- Aggregate report redesign (sleep heatmaps, weekly summaries) — v2 candidate once Arc 1 + 2 + 3 settle

## Doctrinal references

- `docs/specs/vit-d3-tracking-v1.md` — Maren-primary care-tier write-path doctrine; CR-numbered conventions
- `docs/specs/vit-d3-tracking-v2-tier-2.md` §T2-B.2 — D3 Adjust midnight-rollover precedent (toast-and-abort variant)
- `CLAUDE.md` §Ziva Context (sleep tracking is a core developmental surface) + §Hard Rules + §canon-cc-008 chain
- `invocation.md` — Companion invocation procedure (Mode-1 spec authoring + audit cycles)
- canon-cc-008 (QA chain gate)
- canon-cc-022 (artifact test: subagent vs skill split)
- canon-cc-027 (spec amendment authority — for future v2 amendments)

---

— Lyra (main-session), 2026-05-25, post-Architect-ratification this session. cc-018 status: `drafted — awaiting docs-only PR ratification (canon-cc-008 waived); implementation deferred AFTER food sub-tab arc per Architect sequencing direction.`
