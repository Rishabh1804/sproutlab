# Lyra Spec — 2026-05-13 — Symptom Checker Weave-ISL mini-spec (resolveSymptomWeave contract)

**Author:** Lyra (Builder, The Weaver)
**Mode:** 1 (mini-spec authoring; signed audit-bearing artifact per canon-cc-022)
**Status:** v1 DRAFT — awaiting Kael primary audit + Maren secondary audit (Care-jurisdictional content-only check on snippet-shape semantics), then Lyra synthesis, then Cipher Edict V structural pass, then Sovereign ratification
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
 * @param {object} childContext — { ageMo, weightKg, /* optional /* dob, name }
 *                                ageMo is required; rest is informational.
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

### 1.4 Module location (Kael's call per V-K1 §7.3)

The function lives in **a new module `split/weave.js`** OR is folded into `split/intelligence.js`. Kael's choice at D3 phase-spec drafting time. Default recommendation: **new module `split/weave.js`** for these reasons:

- Single-responsibility: weave logic is its own concern (data-source map + ranking + null-discipline)
- Concat order: insert `weave.js` between `data.js` and `core.js` (so weave.js can read SYMPTOM_DB but is available to medical.js and intelligence.js as a dependency)
- Build.sh update: add `cat weave.js` after `data.js` line
- Test surface: isolated module = easier fixture matrix execution

If folded into intelligence.js, the function lives in the SYMPTOM_DB-handling region (around line 2286 alongside `qaHandleSymptom`). Same caller contract; just different physical location.

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
      var last = episodes[episodes.length - 1];
      var days = Math.floor((new Date(last.endDate) - new Date(last.startDate)) / 86400000);
      var peakF = last.peakTempF || last.peakTemp;
      return {
        html: 'Last fever: ' + escHtml(formatDate(last.startDate)) +
              ' · resolved in ' + days + 'd' +
              (peakF ? ' · peak ' + escHtml(String(peakF)) + '°F' : ''),
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
      var last = injuries[injuries.length - 1];
      var consequence = last.consequence || 'no consequences';
      return {
        html: 'Last fall: ' + escHtml(formatDate(last.dateLogged)) + ' · ' + escHtml(consequence),
        source: 'careTickets:injury'
      };
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
      // Compute 7-day vs 14-day average delta; if delta < ±10 mins, return null
      // (no actionable signal)
      // Return: "Sleep avg this week: {h}h{m}m · {±delta} vs 14d"
    }
  }
];
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
| Source identifier overlaps with another source's identifier | Telemetry/debugging confusion |

---

## 3. Ranking algorithm

When multiple sources could match a symptom entry, the resolver picks ONE source per call. Algorithm:

```
1. If symptomEntry.weaveSource is set (explicit override per vision §5.1):
   → Find the WEAVE_SOURCES entry with matching `source` field
   → Run that resolver
   → Return its result (may be null)

2. Else (keyword-family fallback):
   → Iterate WEAVE_SOURCES in declaration order
   → For each, check if any keyword matches symptomEntry.keywords[] OR
     symptomEntry.title (case-insensitive substring)
   → First match wins; run its resolver; return result (may be null)

3. If no keyword family matches:
   → Return null (no fallback resolver; silent omit)
```

**Recency tie-break (within a single resolver):** When a resolver finds multiple records (e.g. multiple fever episodes), it returns the MOST RECENT by `endDate` (or `startDate` if no end). Per the source-table examples — `episodes[episodes.length - 1]` after time-ordered filtering.

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
2. Cache key design is durable (entry.id + relevant data-array length + childContext.ageMo bucket)
3. Cache invalidation tied to data-array writes (e.g. `feverEpisodes.push(...)` invalidates fever cache)

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
| 6 | fall/head, with careTicket | 1 resolved careTicket category:'injury' | Returns {html: contains "Last fall:", source:'careTickets:injury'} |
| 7 | rash/eczema, with careTicket | 1 careTicket category:'skin' | Returns {html: contains "Skin concern:", source:'careTickets:skin'} |
| 8 | sleep, with delta >+10min | sleepData with 7d avg = 14h, 14d avg = 13h45m | Returns {html: contains "Sleep avg this week:", source:'sleepData:7day-delta'} |
| 9 | sleep, with delta within ±10min (no signal) | sleepData with 7d avg ≈ 14d avg | Returns null |
| 10 | NULL-RETURN: title doesn't match any keyword family | call with id:'unknown-symptom', keywords:['unfamiliar'], title:'Unknown' | Returns null |
| 11 | weaveSource override hits | symptomEntry.weaveSource:'feverEpisodes', no keyword match in title | Runs fever resolver per override; returns its result |
| 12 | weaveSource override but data absent | symptomEntry.weaveSource:'feverEpisodes', feverEpisodes=[] | Returns null (override doesn't fall back to keyword family) |
| 13 | XSS-injection defense | careTicket consequence='`<script>alert(1)</script>`' | html contains escaped `&lt;script&gt;...`, no live script |
| 14 | Recency tie-break within source | 3 fever episodes, oldest to newest | Returns the most recent (newest by endDate) |

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

| ID | Question | Default |
|---|---|---|
| **SG-WI-MODULE** | New `split/weave.js` module (Kael recommendation) vs fold into `split/intelligence.js`? | **New `weave.js`** — single-responsibility; eases test surface; concat order between data.js and core.js |
| **SG-WI-SLEEP-THRESHOLD** | Sleep-delta significance threshold for null-vs-render: ±10 mins (default), ±20 mins, ±5%? | **±10 mins** — empirical: 5 mins is below noise floor; 20 mins suppresses real signals; 10 is the floor for "actionable" |
| **SG-WI-PEAK-TEMP** | Fever weave shows "peak {peakF}°F" — keep (default) or drop? Maren has secondary-audit say. | **Keep** — actionable for a parent re-evaluating fever; if peak data isn't recorded, the resolver omits the segment cleanly via the existing `(peakF ? ... : '')` check |

---

## 11. Changelog

- **v1 (2026-05-13):** initial mini-spec draft per SG-6 (vision v2.1 ratified). Defines `resolveSymptomWeave(symptomEntry, childContext) → {html, source} | null` ISL contract + source-table extensibility + ranking + null-discipline + cache policy + 14-fixture matrix. Two skill register-flips during drafting (Kael at §3 no-fall-through rationale; Maren at §4 silent-omit parental-safety read). Three Sovereign-gates surfaced (SG-WI-MODULE, SG-WI-SLEEP-THRESHOLD, SG-WI-PEAK-TEMP). Awaiting Kael primary audit + Maren secondary audit.
