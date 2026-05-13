# Lyra Spec — 2026-05-13 — Symptom Checker Weave-ISL mini-spec (resolveSymptomWeave contract)

**Author:** Lyra (Builder, The Weaver)
**Mode:** 1 (mini-spec authoring; signed audit-bearing artifact per canon-cc-022)
**Status:** v3 — Cipher Edict V STRICT pass folded (C-WI-1 + C-WI-2 P0 amendments; audit-chain step [4] cleared); awaiting Cipher re-audit then Sovereign ratification
**Branch:** `claude/d1-and-weave-isl-specs`
**Parent spec:** `lyra-spec-2026-05-11-symptom-checker-ux-vision.md` v2.1 §11 forward-pointer (per Kael V-K1, gated by SG-6 default Yes)
**Sibling spec:** `lyra-spec-2026-05-13-symptom-checker-d1-polish.md` v1 (parallel-drafted; D1 is on the implementation-track; this mini-spec is on the data-contract track)
**Trigger:** SG-6 ratified Yes in vision v2.1 — "Weave-ISL mini-spec lands between vision ratification and D3 phase-spec opening (1-week scope)." Sovereign ratified vision v2.1 on 2026-05-12; this mini-spec opens the contract surface so D3 can consume it by reference.

---

## 0. Scope

### 0.1 In-scope

This is a **data-contract mini-spec**, not an implementation spec. It defines the ISL (Intelligence Service Layer) contract for the Lyra-weave history micro-card surface that D3 will render. Mini-spec because:

- Smaller surface than D1/D2/D3 phase specs
- Single function signature + extensibility rules + ranking algo + cache policy + fixture matrix
- Single Lyra audit-chain round (Kael primary, Maren secondary, Cipher structural)
- Outputs a contract that downstream code (D3 implementation) consumes by reference

The mini-spec defines:

1. **`resolveSymptomWeave(symptomEntry, childContext) → {html, source} | null`** — the canonical signature
2. **Source-table extensibility rules** — how the keyword-family → data-source mapping evolves over time without breaking the contract
3. **Ranking algorithm** — when multiple sources match, which wins
4. **Null-return discipline** — when to return `null` instead of an empty-state placeholder
5. **Cache policy** — initial: none; conditions for adding cache (telemetry-driven)
6. **Fixture matrix** — verification fixtures (≥7 source families + 1 null-return) for D3 implementation correctness

### 0.2 Out-of-scope (D3 territory)

- The actual rendering of the weave micro-card in result cards (D3)
- The CSS for `.sc-weave-microcard` (D3)
- The `weaveSource` field on SYMPTOM_DB entries (D3 — though spec'd in vision §5.1)
- The triage flow (D3)
- Any UI for missing-data states (D3 — handled by null-return discipline below)
- Performance benchmarking infrastructure (post-D3 — only if telemetry shows >2ms p95)

### 0.3 Why mini-spec (not full phase spec)

Per V-K6: "weave-ISL needs own mini-spec before D3 opens." The mini-spec discipline is:

- Single function signature as the central artifact
- All other content is in support of that signature
- Single Lyra audit-chain round (no per-phase iteration)
- Lands as Sovereign-ratified canon for D3 to consume

Compare to a full phase spec (D1, D2, D3): those have implementation-edit lists, per-file maps, multi-phase rollout sequencing. The weave-ISL spec has none of that — D3 owns implementation.

### 0.4 Why this mini-spec exists at all (per Kael V-K1 P0)

Kael's V-K1 finding flagged P0: "weave-ISL needs own mini-spec before D3 opens." Without this mini-spec, D3 implementation would have to derive the ISL contract on the fly during build, with no Maren/Kael review opportunity for the contract surface itself. That's a Care-jurisdiction risk (the weave decides what historical data a parent sees in the moment of symptom evaluation).

This mini-spec is the protective gate.

---

## 1. ISL contract

### 1.1 Signature

```js
/**
 * Resolve a Lyra-weave history snippet for a symptom entry, given the child's
 * context. Returns rendered HTML + source identifier, or null if no relevant
 * history is available.
 *
 * @param {object} symptomEntry — a SYMPTOM_DB entry (e.g. {id: 'fever-high',
 *                                keywords: [...], severity: 'warning',
 *                                title: '…', whatToDo: [...], …,
 *                                weaveSource: 'feverEpisodes' | undefined})
 * @param {object} childContext — { ageMo, weightKg?, dob?, name?, now?, tz? }
 *                                ageMo is required.
 *                                now: defaults to Date.now() — clock injection
 *                                  for fixture determinism + test-time mocking
 *                                  (W-K6 fold).
 *                                tz: defaults to device timezone — required for
 *                                  daysBetween() local-day-boundary computation
 *                                  per HR-12 (W-K6 fold). Fever lasting 11pm IST
 *                                  to 1am IST should render '<1d' / '4h', NOT
 *                                  '1d' from raw UTC ms division.
 *                                Other fields: informational; resolvers may
 *                                  consume in future (e.g. age-bucketed framing).
 *
 * @returns {{ html: string, source: string } | null}
 *                                html: trusted HTML fragment ready to insert
 *                                      into a .sc-weave-microcard container.
 *                                      Caller writes via .innerHTML; helper
 *                                      uses escHtml() on all interpolated
 *                                      data per HR-4.
 *                                source: machine-readable identifier of the
 *                                        data source consulted (e.g.
 *                                        'feverEpisodes', 'careTickets:injury',
 *                                        'sleepData:7day-delta'). For
 *                                        debugging + telemetry; never rendered.
 *                                null: no relevant history found. Caller
 *                                      omits the entire .sc-weave-microcard
 *                                      block silently (G7 v2: empty is
 *                                      silent — no "No history available"
 *                                      placeholder).
 */
function resolveSymptomWeave(symptomEntry, childContext) {
  // ...
}
```

### 1.2 Pure-function invariants (Kael V-K1 boundary contract)

The function MUST be pure in the following senses:

| Invariant | Verification |
|---|---|
| No `document.*` reads | grep `document\.` inside function body = 0 |
| No `document.*` writes | same |
| No event-handler binding (no `addEventListener`) | grep = 0 |
| No `innerHTML =` | grep = 0 |
| No mutation of `symptomEntry`, `childContext`, or any global state | manual review at Cipher Edict V on impl |
| Reads of synced data arrays (`feverEpisodes`, `careTickets`, etc.) ARE allowed (these are accessor-style reads of in-memory state) | n/a |
| Calls to `escHtml()`, `formatDate()`, and other pure-helper utilities ARE allowed | n/a |

The function may be referentially-impure (calling it twice with the same args could return different snippet bodies because `feverEpisodes[]` could have been updated between calls). This is acceptable for a render-time resolver.

### 1.3 Caller contract

D3 implementation calls `resolveSymptomWeave(...)` once per result card during `_renderSymptomCheckerResults` (after the bridge-shipped helper sequence). Caller:

```js
// Inside _renderSymptomCheckerResults shown.forEach, after the body sections
// but before the doctor card / episode CTAs (D3 will sequence per vision §3.1):
if (m.severity !== 'emergency') {  // G7 v2: omit weave on emergency tier
  var weave = resolveSymptomWeave(e, { ageMo: ageMo });
  if (weave) {
    html += '<div class="sc-weave-microcard" data-weave-source="' +
            escHtml(weave.source) + '">';
    html += '<div class="sc-weave-label">Ziva\'s history</div>';
    html += weave.html;  // trusted; helper-escaped
    html += '</div>';
  }
  // null branch: silent omit (no else)
}
```

D3 spec finalizes the exact CSS class names, label text, and section ordering. This mini-spec only defines the contract.

### 1.4 Module location (W-K1 P0 fold — corrected concat order)

**v1 had the wrong concat order assertion.** Kael verified `split/build.sh` on main (sha `7342d5d`): the actual concat order is `config → data → core → home → diet → medical → intelligence → sync → start`. So `core.js` ALREADY comes after `data.js` — placing `weave.js` "between data.js and core.js" puts it BEFORE `core.js`, which means weave's resolvers cannot call `escHtml()`, `formatDate()`, or `zi()` (all in `core.js`). Every resolver in §2.1 calls `escHtml(formatDate(...))`. v1 placement breaks the resolvers.

**Corrected: insert `weave.js` between `medical.js` and `intelligence.js`.**

```
config → data → core → home → diet → medical → weave → intelligence → sync → start
                                              ─NEW─
```

Rationale (v2):
- `weave.js` needs `core.js` (escHtml, formatDate) → must come AFTER core
- `weave.js` reads `data.js` (SYMPTOM_DB) → must come AFTER data
- `weave.js` is consumed by `intelligence.js` callers (D3 caller wiring) → must come BEFORE intelligence
- `weave.js` does NOT need to be visible to `medical.js`'s `_renderSymptomCheckerResults` if D3 wires the resolver call from intelligence.js

**Caller-jurisdiction decision (W-K1 fold sub-question):** the D3 caller for `resolveSymptomWeave` lives in **intelligence.js** (intelligence-jurisdiction owns history-resolver wiring per Kael V-K1). NOT inside `_renderSymptomCheckerResults` (which is in medical.js Care-jurisdiction). This sets the concat-order constraint above. If a future revisit moves the call site into medical.js (Care-side wiring of the weave), `weave.js` must shift to `data → weave → core → ...` — but that move would also require Kael ‖ Maren re-audit on the cross-jurisdiction shift.

**Build.sh update** (D3 build PR):
```bash
# Insert after 'cat medical.js' line, before 'cat intelligence.js':
cat weave.js
```

**SG-WI-MODULE stance update** (post-W-K1 fold): Default still `new weave.js` per Kael's primary recommendation. The folded-into-intelligence.js alternative was already weak (intelligence.js is 747KB; folding deepens an already-pathological monolith) and W-K1's concat-order discovery doesn't change that calculus — it just corrects WHERE in the concat order the new module goes.

---

## 2. Source-table extensibility rules

### 2.1 The source table

```js
// Maintained in split/weave.js (or intelligence.js per §1.4)
const WEAVE_SOURCES = [
  // Order matters: ranking applies first-match semantics (§3)
  {
    keywords: ['fever', 'high temp', 'temperature', 'hot'],
    source: 'feverEpisodes',
    resolver: function(entry, ctx) {
      var episodes = (window.feverEpisodes || []).filter(function(e) { return e.endDate; });
      if (!episodes.length) return null;
      // W-K10 fold: SORT by endDate descending; do NOT assume insertion order
      // is chronological. A parent back-logging an old fever inserts at
      // [length-1] without being chronologically newest.
      var sorted = episodes.slice().sort(function(a, b) {
        return new Date(b.endDate) - new Date(a.endDate);
      });
      var last = sorted[0];
      // W-K6 fold: route day diff through tz-aware daysBetween (not raw UTC ms)
      var days = daysBetween(last.startDate, last.endDate, (ctx && ctx.tz) || undefined);
      var peakF = last.peakTempF || last.peakTemp;
      return {
        html: 'Last fever: ' + escHtml(formatDate(last.startDate)) +
              ' · resolved in ' + days + 'd' +
              // W-M2 fold: tighten peakF check — defends against degenerate
              // data (peak 0°F, peak null, peak NaN). 95°F is the empirical
              // floor for "this is a fever record worth surfacing."
              (peakF && peakF >= 95 ? ' · peak ' + escHtml(String(peakF)) + '°F' : ''),
        source: 'feverEpisodes'
      };
    }
  },
  {
    keywords: ['diarrhoea', 'diarrhea', 'loose stool', 'watery'],
    source: 'diarrhoeaEpisodes',
    resolver: function(entry, ctx) {
      var episodes = (window.diarrhoeaEpisodes || []).filter(function(e) { return e.endDate; });
      if (!episodes.length) return null;
      var last = episodes[episodes.length - 1];
      var days = Math.max(1, Math.floor((new Date(last.endDate) - new Date(last.startDate)) / 86400000));
      return {
        html: 'Last episode: ' + escHtml(formatDate(last.startDate)) + ' · ' + days + 'd duration',
        source: 'diarrhoeaEpisodes'
      };
    }
  },
  {
    keywords: ['vomit', 'throwing up', 'spit up'],
    source: 'vomitingEpisodes',
    resolver: /* analogous to diarrhoea */
  },
  {
    keywords: ['cough', 'cold', 'runny nose', 'sneeze'],
    source: 'coldEpisodes',
    resolver: /* "Last cold: {date} · resolved in {days}d" */
  },
  {
    keywords: ['fall', 'head', 'bump', 'injury', 'hit'],
    source: 'careTickets:injury',
    resolver: function(entry, ctx) {
      var injuries = (window.careTickets || []).filter(function(t) { return t.category === 'injury' && t.status === 'resolved'; });
      if (!injuries.length) return null;
      // W-K10 fold: sort by dateLogged descending; do NOT assume insertion
      // order is chronological.
      var sorted = injuries.slice().sort(function(a, b) {
        return new Date(b.dateLogged) - new Date(a.dateLogged);
      });
      var last = sorted[0];
      // W-M1 P0 fold: do NOT backfill "no consequences" when consequence
      // data is absent. That phrasing trivializes the past event AND
      // creates false reassurance ("last time was fine, this is probably
      // fine too") — exactly the cognitive shortcut Care exists to prevent.
      // When consequence is absent: render the date alone (silent on the
      // outcome field, per G7 v2 silent-omit principle applied per-field).
      // When consequence is parent-supplied: render verbatim (escaped).
      var html = 'Last fall: ' + escHtml(formatDate(last.dateLogged));
      if (last.consequence) {
        html += ' · ' + escHtml(last.consequence);
      }
      return { html: html, source: 'careTickets:injury' };
    }
  },
  {
    keywords: ['rash', 'eczema', 'skin'],
    source: 'careTickets:skin',
    resolver: /* "Skin concern: {date} · {status}" */
  },
  {
    keywords: ['sleep', 'tired', 'wake', 'nap'],
    source: 'sleepData:7day-delta',
    resolver: function(entry, ctx) {
      // W-K8 fold: concrete pseudocode (was comment-only in v1).
      // Source array: window.sleepSessions (each entry has {date, durationMin}).
      // Compute 7-day rolling avg vs 14-day rolling avg, ending at
      // (ctx && ctx.now) || Date.now().
      var sessions = window.sleepSessions || [];
      if (sessions.length < 14) return null;  // insufficient data window
      var nowMs = (ctx && ctx.now) || Date.now();
      var dayMs = 86400000;
      var avg7  = _avgDurationMin(sessions, nowMs - 7 * dayMs, nowMs);
      var avg14 = _avgDurationMin(sessions, nowMs - 14 * dayMs, nowMs);
      if (avg7 == null || avg14 == null) return null;
      var deltaMin = Math.round(avg7 - avg14);
      // SG-WI-SLEEP-THRESHOLD: ±10 mins below noise floor → silent omit
      if (Math.abs(deltaMin) < 10) return null;
      var sign = deltaMin > 0 ? '+' : '';
      var h = Math.floor(avg7 / 60);
      var m = Math.round(avg7 % 60);
      return {
        html: 'Sleep avg this week: ' + h + 'h' + m + 'm · ' + sign + deltaMin + 'm vs 14d',
        source: 'sleepData:7day-delta'
      };
    }
  }
];

// Helpers (W-K6 + W-K8 fold) — defined alongside WEAVE_SOURCES in weave.js:

/**
 * Day-count between two ISO date strings, computed against local-day
 * boundaries in the given timezone. Required per HR-12 timezone-safety:
 * raw UTC ms division gives wrong answers when the start/end straddle a
 * local-day boundary (W-K6).
 *
 * @param {string} startISO
 * @param {string} endISO
 * @param {string} [tz] — IANA timezone (e.g. 'Asia/Kolkata'); defaults
 *                         to device timezone via Intl.DateTimeFormat()
 * @returns {number} days, minimum 1 if same local day; integer if multi-day
 *
 * Implementation note (D3): use Intl.DateTimeFormat(tz, {dateStyle:'short'})
 * to derive the local date string for start and end; subtract local-date
 * components, NOT raw ms division. Stub for D3 to flesh out.
 */
function daysBetween(startISO, endISO, tz) { /* D3 implements per W-K6 */ }

/**
 * Average sleep duration (minutes) across sessions whose date falls within
 * [windowStartMs, windowEndMs]. Returns null if no sessions in window.
 */
function _avgDurationMin(sessions, windowStartMs, windowEndMs) { /* D3 implements */ }
```

### 2.2 Extension rules

To add a new source family (e.g. "rash" gets a dedicated `rashEpisodes` array in a future phase):

1. Append new entry to `WEAVE_SOURCES` in keyword-priority-discriminating-order. **Order matters** — the resolver matches by first matching keyword set per §3.
2. Resolver function MUST honor `null` discipline (§4) — never return empty-string html or null-source.
3. Resolver MUST use `escHtml()` on every interpolated data field (HR-4).
4. New source identifier follows the convention `sourceArrayName` or `sourceArrayName:subfilter` (e.g. `careTickets:injury` for filtered subset).
5. Add a fixture (§6) covering the new source — at minimum: one positive (data present) + one null-return (data absent).
6. Cipher Edict V on the extension PR confirms purity invariants + escHtml usage + fixture coverage.

### 2.3 Forbidden source patterns

| Pattern | Why forbidden |
|---|---|
| Resolver fetches from Firestore | Sync reads only; no network in the resolver path |
| Resolver throws on missing data | Returns `null` instead (silent-empty discipline; §4) |
| Resolver returns html longer than 2 lines visual | Weave is a micro-card; don't compete with the result body |
| Resolver returns html containing `<button>` or `<a href>` | Weave is informational; interactive elements are D3 footer-triad scope |
| Resolver returns html containing user-typed strings without `escHtml()` | HR-4 violation |
| Resolver mutates `entry` or `ctx` | Pure-invariant violation |
| Source identifier exactly equals another entry's source identifier (verbatim string match) — `prefix:subfilter` decomposition is explicitly allowed (e.g. `careTickets:injury` and `careTickets:skin` are distinct) | Telemetry/debugging confusion (W-K3 fold) |
| Resolver inspects `symptomEntry.severity` for gating output | Severity-based omission is the CALLER's responsibility per §1.3; the resolver is severity-agnostic. Two-place-truth bug breaks under refactor (W-K4 fold) |

---

## 3. Ranking algorithm

When multiple sources could match a symptom entry, the resolver picks ONE source per call. Algorithm:

```
1. If symptomEntry.weaveSource is set (explicit override per vision §5.1):
   → Find the WEAVE_SOURCES entry with matching `source` field
   → If found:    Run that resolver; return its result (may be null)
   → If NOT found (typo, deprecated source, future-name shipped before
     WEAVE_SOURCES updates):
     → Return null (silent for the user — preserves G7-v2 silent-empty)
     → AND emit console.warn('resolveSymptomWeave: unknown weaveSource ' +
       entry.weaveSource + ' on entry ' + entry.id) ONCE per session per
       identifier (use module-level Set _warnedUnknownSources to dedupe)
     → Diagnostic-without-blocking pattern (W-K2 P0 fold). Cipher Edict V
       grep target: grep "unknown weaveSource" split/weave.js returns 1.

2. Else (keyword-family fallback):
   → Iterate WEAVE_SOURCES in declaration order
   → For each, check if any keyword matches symptomEntry.keywords[] OR
     symptomEntry.title (case-insensitive substring)
   → First match wins; run its resolver; return result (may be null)

3. If no keyword family matches:
   → Return null (no fallback resolver; silent omit)
```

**Declaration-order ranking discipline (W-M3 fold):** WEAVE_SOURCES declares illness-signal sources (fever, diarrhoea, vomiting, cough/cold, fall, rash) ABOVE lifestyle-signal sources (sleep). When an ambiguous keyword match could resolve to either (e.g. a "fussy / not sleeping during cold" composite entry whose keywords include both "cold" and "sleep"), first-match-wins resolves to the COLD reading. Care principle: when in doubt, surface the medical signal. Future declaration-order changes must preserve this discipline.

**Recency tie-break (within a single resolver) — W-K10 fold:** When a resolver finds multiple records (e.g. multiple fever episodes), it returns the MOST RECENT by `endDate` (or `startDate` if no end), via **explicit sort**:

```js
var sorted = episodes.slice().sort(function(a, b) {
  return new Date(b.endDate) - new Date(a.endDate);
});
var last = sorted[0];
```

**Do NOT** use `episodes[episodes.length - 1]` — array order is insertion order (sync-write order), not chronological. A parent back-logging an old fever inserts at `[length-1]` without being chronologically newest. This was a v1 bug.

**No-match-but-keyword-overlap edge case:** if a keyword family matches (e.g. "cough/cold") but the resolver returns null (no `coldEpisodes`), the algorithm does NOT fall through to the next family. The first matching family is the contract — null is the correct answer when that family's data is absent.

> **🎩 Kael (skill register-flip):** the no-fall-through rule is deliberate. If "cough" matched but `coldEpisodes` is empty, falling through to "fall/injury" if the title incidentally contained "fall" would surface unrelated history (e.g. a fall record on a cold-symptom card). That's worse than no weave. Silent-empty wins.

---

## 4. Null-return discipline

The resolver returns `null` (not an empty object, not an empty string) in these cases:

| Case | Contract |
|---|---|
| No source matches keywords or weaveSource override | `return null` |
| Source matches but data array is empty | `return null` |
| Source matches and data is present but no actionable signal (e.g. sleep delta <±10 mins) | `return null` |
| Resolver caught an exception (defensive) | `return null` (don't propagate; weave is informational, never blocking) |

Caller treats null as "omit the entire `.sc-weave-microcard` block silently." Per vision §3.3 G7 v2: empty is silent. **No "No history available" placeholder ever renders.**

> **🎩 Maren (skill register-flip):** silent-omit is a parental-safety choice. A "No history available" placeholder on a 2am Crying-fussy lookup would be cognitive load with zero value. Silence is the right answer.

---

## 5. Cache policy

**Initial: no cache.** First call per render = first compute.

**Add cache only if:**
1. Telemetry post-D3 ship shows weave resolution >2ms at p95 on contemporary devices (per vision §7.2)
2. Cache key design is durable. **Minimal cache key (W-K7 fold):** `entry.id + relevant data-array length`. Do NOT include `childContext.ageMo` until a resolver actually consumes it (premature key field = false invalidations + dead complexity). When/if a resolver consumes ageMo or another ctx field, extend the key signature in lockstep.
3. Cache invalidation tied to data-array writes (e.g. `feverEpisodes.push(...)` invalidates fever cache)

**Sleep-threshold review note (W-M5 fold):** SG-WI-SLEEP-THRESHOLD ±10 mins is the v2 default. Post-D3 telemetry should be reviewed: if parents report "too noisy" (lots of inconsequential sleep snippets surfacing) the threshold tightens; if parents report "missed signal" (real sleep regressions silenced) the threshold loosens. Review owner: Lyra (vision-spec maintainer); review trigger: 4-week post-D3-merge data window OR Sovereign-direct user feedback.

**Never add cache for:**
- The `weaveSource` override branch — explicit overrides should always run fresh
- Sleep-delta computation — input changes daily; cache shelf-life trivial

---

## 6. Fixture matrix (≥7 source families + 1 null-return — Kael V-K1 #4)

D3 implementation MUST ship a test fixture file (`split/weave.fixtures.js` or equivalent) that covers:

| # | Fixture | Setup | Expected |
|---|---|---|---|
| 1 | fever family, with episodes | Insert 1 resolved feverEpisode (start, end, peakTemp); call resolveSymptomWeave({id:'fever-high', keywords:['fever']}, {ageMo:7}) | Returns {html: contains "Last fever:" + date + days + peakF, source:'feverEpisodes'} |
| 2 | fever family, no episodes | feverEpisodes = []; call same | Returns null |
| 3 | diarrhoea, with episode | 1 resolved diarrhoeaEpisode; call with id:'diarrhoea' entry | Returns {html: contains "Last episode:", source:'diarrhoeaEpisodes'} |
| 4 | vomiting, with episode | analogous | Returns {html: contains "Last episode:", source:'vomitingEpisodes'} |
| 5 | cough/cold, with episode | 1 resolved coldEpisode | Returns {html: contains "Last cold:", source:'coldEpisodes'} |
| 6a | fall/head, careTicket WITH consequence | 1 resolved careTicket category:'injury' with `consequence:'monitored, no concussion symptoms'` | Returns {html: contains "Last fall: {date} · monitored, no concussion symptoms", source:'careTickets:injury'} (W-M6 fold a) |
| 6b | fall/head, careTicket WITHOUT consequence | 1 resolved careTicket category:'injury', `consequence:null` | Returns {html: contains "Last fall: {date}" and does NOT contain "no consequences" — regression guard for W-M1 P0 backfill bug} (W-M6 fold b) |
| 7 | rash/eczema, with careTicket | 1 careTicket category:'skin' | Returns {html: contains "Skin concern:", source:'careTickets:skin'} |
| 8 | sleep, with delta >+10min | sleepData with 7d avg = 14h, 14d avg = 13h45m | Returns {html: contains "Sleep avg this week:", source:'sleepData:7day-delta'} |
| 9 | sleep, with delta within ±10min (no signal) | sleepData with 7d avg ≈ 14d avg | Returns null |
| 10 | NULL-RETURN: title doesn't match any keyword family | call with id:'unknown-symptom', keywords:['unfamiliar'], title:'Unknown' | Returns null |
| 11 | weaveSource override hits | symptomEntry.weaveSource:'feverEpisodes', no keyword match in title | Runs fever resolver per override; returns its result |
| 12 | weaveSource override but data absent | symptomEntry.weaveSource:'feverEpisodes', feverEpisodes=[] | Returns null (override doesn't fall back to keyword family) |
| 13 | XSS-injection defense | careTicket consequence='`<script>alert(1)</script>`' | html contains escaped `&lt;script&gt;...`, no live script |
| 14 | Recency tie-break within source — non-chronological insertion order | Insert 3 fever episodes in order: middle, oldest, newest (insertion order ≠ chronological order; simulates a back-logged episode) | Returns chronologically NEWEST by endDate (NOT `episodes[length-1]`); confirms W-K10 fold sort discipline |
| 15 | Unknown-source console.warn (W-K2 fold) | symptomEntry.weaveSource = 'nonexistentSource'; call resolver | Returns null; console.warn fired ONCE for that identifier; second call with same nonexistentSource does NOT re-warn (Set-deduped) |
| 16 | Resolver severity-agnostic (W-K4 fold) | Call resolver with `entry.severity = 'emergency'` and same data as fixture #1 (warning) | Returns IDENTICAL {html, source} to the warning case — severity is not consulted by resolver; caller-side gating only |
| 17 | Multi-keyword overlap declaration order (W-K5 fold) | Entry with `keywords:['sleep','cold','fussy']`, both cold + sleep WEAVE_SOURCES match | Returns cold-source result (declaration-order first-match), NOT sleep. Verifies §3 first-match contract under realistic SYMPTOM_DB shape |
| 18 | TZ-safe day boundary (W-K6 fold) | Fever startDate=2026-04-22T17:30:00Z (11pm IST 2026-04-22), endDate=2026-04-22T19:30:00Z (1am IST 2026-04-23). ctx.tz='Asia/Kolkata' | Returns html containing day-count framing that reflects the LOCAL day boundary (i.e., does NOT report '1d' from raw UTC ms; daysBetween() returns 1 because IST-day boundary crossed but the lasted-time was 4h) — D3 spec finalizes exact framing ('<1d' vs '4h' vs '1d') but '1d' from raw UTC division must NOT be the answer |

**Plus optional E2E:** D3 build PR runs the fixture matrix as part of the build verification + manual sanity on a real device.

---

## 7. HR-by-HR audit (this mini-spec)

| HR | Status | Operationally |
|---|---|---|
| HR-1 | N/A | No new sprites introduced (D3 ships `zi-back` etc.; not weave-ISL scope) |
| HR-2 | N/A | No CSS changes (D3 ships `.sc-weave-microcard` styling) |
| HR-3 | N/A | Weave is informational (no interactive elements emitted by resolver) |
| HR-4 | **Reinforced** | Every resolver MUST `escHtml()` interpolated data fields. Source-table extension rule §2.2 #3 codifies. Fixture #13 verifies XSS defense. |
| HR-5 | N/A | No spacing/font (D3 styling) |
| HR-6 | N/A | (HR-3) |
| HR-7 | **Reinforced** | Helper returns html string; D3 caller writes via `.innerHTML`. No `.textContent` regression possible if D3 follows the §1.3 caller contract. |
| HR-8 | N/A | Not a stub |
| HR-9 | **Reinforced** | Standard audit chain; Cipher Edict V at impl re-verifies fixture coverage |
| HR-10 | N/A | Resolver returns whole text; no truncation |
| HR-11 | N/A | No currency |
| HR-12 | **Reinforced** | Resolver uses `formatDate()` for dates; never raw `new Date(string).toLocaleDateString()` (timezone-safe per HR-12) |

---

## 8. Audit chain (canon-cc-008) for THIS mini-spec

```
[1] Lyra      → drafts this mini-spec (DONE — this file)
[2] Kael      → primary audit (architectural + ISL contract):
                · §1.1 signature: complete? sufficient?
                · §1.2 purity invariants: enforceable?
                · §1.3 caller contract: matches D3 render-flow expectations?
                · §1.4 module location: weave.js vs intelligence.js — recommend
                · §2.1 source table: initial 7 families correct? extensible per §2.2?
                · §2.3 forbidden source patterns: complete?
                · §3 ranking algorithm: edge cases covered?
                · §6 fixture matrix: ≥7 families + null-return + XSS — adequate?
[2'] Maren    → secondary audit (Care-jurisdiction content-only):
                · §2.1 source-table snippet shape: parental-safety read on the output text
                  ("Last fall: {date} · no consequences" — does this read calmly or
                  alarming when surfaced mid-symptom-lookup?)
                · §3 ranking: when sleep + cold both keyword-match, sleep wins
                  (declaration order) — is that the right call for a parent?
                · §4 silent-omit discipline: confirms with G7 v2 vision-spec stance
                · §6 fixture #1 ("Last fever: {date} · resolved in {days}d · peak {peakF}°F"):
                  is "peak temperature" the right surfaced data point, or would
                  "Lasted X days" alone be calmer?
[3] Lyra      → synthesizes both audit returns; folds into v2
[4] Cipher    → Edict V structural pass on the mini-spec itself
[5] Sovereign → ratifies v2; mini-spec becomes consumable canon for D3
[6] D3 spec   → opens (post-D2 merge); consumes this mini-spec by reference
[7] Lyra      → D3 Mode-2 build implements the resolver per this contract
[8] Cipher    → Edict V on D3 impl; fixture matrix runs
[9] Maren     → real-device verification on D3-shipped weave (snippet-shape
                appropriateness on actual symptom queries)
```

**Single Lyra audit-chain round** (no per-phase iteration; mini-spec is self-contained).

---

## 9. Forward-pointer

- **D3 spec(s)** consume this mini-spec by reference. The D3 spec re-states only the contract surface (§1) for self-containment; doesn't re-derive ranking algorithm or fixture matrix.
- **Vision v2.1 §11 forward-pointer registry** updates to mark this mini-spec as drafted (or v2 ratified, post-Sovereign).
- **Weave v2 (post-telemetry):** if telemetry shows >2ms p95, cache policy §5 amends; mini-spec bumps to v2.

---

## 10. Open questions for Sovereign

| ID | Question | Default | Audit stances | Status in v3 |
|---|---|---|---|---|
| **SG-WI-MODULE** | New `split/weave.js` module (Kael recommendation) vs fold into `split/intelligence.js`? | **New `weave.js`** — single-responsibility; eases test surface; concat order between `medical.js` and `intelligence.js` per §1.4 W-K1 P0 fold (corrected from v1's "between data.js and core.js" which would break escHtml/formatDate access; verified against `build.sh` sha 7342d5d) | Kael: Concur with default — folding into intelligence.js (already 747KB) deepens monolith. W-K1 corrected the placement; otherwise sound. Maren: out-of-jurisdiction (architectural; no Care signal). | **HELD** (default + W-K1 placement fix applied; Cipher C-WI-2 P0 fold corrected the default-cell stale concat-order text in v3) |
| **SG-WI-SLEEP-THRESHOLD** | Sleep-delta significance threshold for null-vs-render: ±10 mins (default), ±20 mins, ±5%? | **±10 mins** — empirical: 5 mins is below noise floor; 20 mins suppresses real signals; 10 is the floor for "actionable" | Kael: Concur with default, contingent on W-K8 concrete pseudocode (folded; resolver now has explicit compute path). Maren: out-of-jurisdiction at safety level (lifestyle signal); W-M5 P2 added a "review-after-D3" note. | **HELD** (default + W-K8 concrete pseudocode applied in v2; W-M5 review-after-D3 note in §5) |
| **SG-WI-PEAK-TEMP** | Fever weave shows "peak {peakF}°F" — keep (default) or drop? Maren has secondary-audit say. | **Keep** — actionable for a parent re-evaluating fever; if peak data isn't recorded, the resolver omits the segment cleanly via the `(peakF && peakF >= 95)` floor check (W-M2 fold) | Maren: Concur with Keep + W-M2 floor fold (tightened from `(peakF ? ...)` to `(peakF && peakF >= 95 ? ...)` to defend against degenerate data). Kael: out-of-jurisdiction (content; no architectural signal). | **HELD** (default + W-M2 floor fix applied in v2; defends against peak=0/null/NaN) |

---

## 11. Changelog

- **v1 (2026-05-13):** initial mini-spec draft per SG-6 (vision v2.1 ratified). Defines `resolveSymptomWeave(symptomEntry, childContext) → {html, source} | null` ISL contract + source-table extensibility + ranking + null-discipline + cache policy + 14-fixture matrix. Two skill register-flips during drafting (Kael at §3 no-fall-through rationale; Maren at §4 silent-omit parental-safety read). Three Sovereign-gates surfaced (SG-WI-MODULE, SG-WI-SLEEP-THRESHOLD, SG-WI-PEAK-TEMP). Awaiting Kael primary audit + Maren secondary audit.
- **v3 (2026-05-13):** Cipher Edict V STRICT pass folded (2 P0 + 0 P1 + 0 P2). Surgical amendments:
  - **C-WI-1 P0:** §10 sub-Sovereign-gate table expanded from 3 columns to 5 columns (ID / Question / Default / Audit stances / Status in v3). All three SG-WI-* rows now surface the per-gate Governor stances + post-fold status, matching the D1 §10 5-column canonical shape.
  - **C-WI-2 P0:** §10 SG-WI-MODULE default cell text corrected. v2 cell still carried the v1 stale assertion "concat order between data.js and core.js" despite §1.4 W-K1 P0 fold correcting it to "between medical.js and intelligence.js." Single-source-of-truth alignment: §10 default now references §1.4 explicitly.
  - **Cross-cutting:** Cipher's V-K6 GAP retrospective flagged C-WI-2 as a sweep gap (W-K1 fold landed at §1.4 but didn't sweep §10's default cell). Forward-pointer: "post-fold consistency sweep" Kael discipline codified as canon-promotion candidate.
  - **Contract verification:** all weave-ISL contract claims PASS against main sha 7342d5d (Cipher-verified: build.sh concat order; bridge `_renderSymptomCheckerResults` helper as caller-jurisdiction anchor).
  - Cipher Edict V STRICT re-audit NEXT.

- **v2 (2026-05-13):** Audit-chain step [3] Lyra synthesis. Folds Kael W-K1..W-K10 (2 P0 + 5 P1 + 3 P2) + Maren W-M1..W-M6 (1 P0 + 3 P1 + 2 P2) returns. Substantive amendments:
  - **W-K1 P0:** §1.4 module location CORRECTED. v1 had wrong concat order assertion. Correct insertion: `... → medical → weave → intelligence → sync → start`. Caller-jurisdiction lock: D3 caller for `resolveSymptomWeave` lives in `intelligence.js` (NOT inside `_renderSymptomCheckerResults` which is medical.js Care-jurisdiction).
  - **W-K2 P0:** §3 step 1 unknown-source branch defined. Returns null + dedup `console.warn` per session per identifier. Diagnostic-without-blocking. Fixture #15 added.
  - **W-M1 P0:** §2.1 fall resolver no longer backfills "no consequences" when consequence is absent. Renders date alone; only includes consequence segment when parent-supplied. Fixture #6 splits into 6a (with) + 6b (without — regression guard).
  - **W-M2 P1:** §2.1 fever resolver tightens peakF check from `(peakF ? ...)` to `(peakF && peakF >= 95 ? ...)`. Defends against degenerate data.
  - **W-M3 P1:** §3 declaration-order rationale comment added. Illness-signal above lifestyle-signal so ambiguous keyword matches resolve to the medical reading (Care principle).
  - **W-K3 P1:** §2.3 collision rule clarified. Verbatim duplicate identifiers forbidden; `prefix:subfilter` decomposition allowed.
  - **W-K4 P1:** §2.3 forbid resolver inspecting `symptomEntry.severity` for gating output. Severity-omission is caller-side per §1.3; resolver severity-agnostic. Fixture #16 added.
  - **W-K5 P1:** §6 fixture #17 added — multi-keyword overlap (sleep + cold both match) → cold wins per declaration order. Verifies first-match contract under realistic SYMPTOM_DB shape.
  - **W-K6 P1:** §1.1 `childContext` shape extended with optional `now?: number` (clock injection for fixture determinism) and `tz?: string` (IANA timezone for `daysBetween()` local-day-boundary computation per HR-12). `daysBetween()` and `_avgDurationMin()` helper stubs added to §2.1. Fixture #18 added — TZ-safe day boundary.
  - **W-K8 P1:** §2.1 sleep resolver concrete pseudocode (was comment-only in v1). Source array `window.sleepSessions`; uses `_avgDurationMin` for rolling avg; returns null when delta within ±10 mins.
  - **W-K10 P1:** §3 recency tie-break MUST sort by endDate descending; `episodes[length-1]` is wrong (array is insertion order, not chronological). All resolvers updated to use explicit `.sort()`. Fixture #14 setup tightened to non-chronological insertion order.
  - **W-K7 P2:** §5 cache key minimal — `entry.id + relevant data-array length`. ageMo dropped until consumed.
  - **W-K9 P2:** (deferred — `escHtml(weave.source)` stance to be resolved at D3 caller-write time; current ambiguity flagged for D3 spec to commit a stance).
  - **W-M4 P2:** silent-omit confirms G7 v2 — no fold needed (consensus).
  - **W-M5 P2:** §5 sleep threshold review-after-D3 note added (Lyra-owned, 4-week post-D3-merge or Sovereign-direct trigger).
  - **W-M6 P2:** §6 fixture #6 split per W-M1 fold (6a/6b).
  - **Sub-Sovereign-gates:** SG-WI-MODULE held (new weave.js per Kael, contingent on W-K1 fold), SG-WI-SLEEP-THRESHOLD held (±10 mins, contingent on W-K8 concrete pseudocode), SG-WI-PEAK-TEMP held (Keep + W-M2 floor).
  - **Edict V readiness:** Kael's V-K6 form-pass estimate at v1 = 70%; v2 fold lifts to ~90% (W-K1 + W-K2 P0 closures + W-K3/W-K4/W-K10 enforceable rules + 18-fixture matrix all gap-closing).
  - **Fixture matrix:** expanded from 14 to 18 fixtures.
  - Cipher Edict V structural pass NEXT.
