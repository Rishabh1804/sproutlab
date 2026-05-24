# Vit D3 Tracking v1 — half-hearted to meaningful

**Spec version:** v1
**Date:** 2026-05-23
**Branch:** `claude/sproutlab-vit-d3-tracking-v1`
**Author:** Lyra (main-session)
**Jurisdiction:** **Maren PRIMARY** (write-path + reminder + Today So Far + medical-tab detail card all live in home.js / medical.js / diet.js — care surface; "what if this data is wrong and a parent acts on it?" applies). Kael SECONDARY (core.js schema helpers + intelligence-isl.js read accessor + intelligence-qa-handlers.js intent improvement). Vela WAIVED first-pass (no `intelligence-cards.js` or `intelligence-quicklog.js` touch); if styles.css gets new tokens beyond reuse-of-existing, Vela folds in as shared-module reviewer.
**Authority:** Architect-directed during the food-DB cleanup arc closeout. Trigger: Architect flagged the current Vit D3 implementation as "half-hearted" — `medChecks[date][medName] = 'done:HH:MM'` where HH:MM is the moment the parent tapped "Done", not the moment the dose was actually administered. Only intelligence is a simple % adherence number with no time-of-day, with-fat, or pattern analysis.

---

## What the upgrade ships

A real Vit D3 tracking + analysis surface. Three concurrent shifts:

1. **Truth at write time** — capture the actual administration time, not the tap-time.
2. **Context at write time** — auto-detect whether the dose was given with a fat-containing food (Vit D3 is fat-soluble; absorption is meaningfully better with co-ingested fat like ghee, curd, paneer, almonds, etc.). No parent input required — observed from the feeding log.
3. **Meaning at read time** — surface the truth and context so the parent can see patterns, not just a Done/Pending boolean.

## What the current implementation does (and doesn't)

**Reconnaissance baseline (verified at `b73ebcc`):**

- **Storage:** `localStorage['ziva_med_checks']` → `medChecks[date][medName] = 'done:HH:MM' | 'done:late' | 'skipped'`. The HH:MM is tap-time (line `home.js:875`).
- **Write paths:** `markMedDone(name, idx)` at `home.js:872`, `markMedSkipped` at `:891`, `resolveMissedMed` at `:907` (retroactive late-mark).
- **Reads:** unified reminders card at `home.js:706-717` (pending vs done); Today So Far chip at `:8672-8676` (`'Done today'` / `'Pending'`); Medical tab list at `medical.js:4293-4327` (registered med metadata only — no adherence); ISL accessor `_islMedicalData()` at `intelligence-isl.js:542-604` (extracts `d3Times[]` for the date range); Smart Q&A handler at `intelligence-qa-handlers.js:320, 549` (% adherence + raw counts).
- **Intelligence:** one threshold (`D3_ADHERENCE_GOOD_PCT = 90` at `intelligence-isl.js:690`). That's the entire analysis.
- **Uncoupled:** `diet.js:765` knows ghee + fat-soluble vitamins absorb together but has zero link to D3 logging.

**What's missing:** actual administration time, meal context, time-of-day pattern detection, with-fat rate, gap detection, optimal-time-of-day guidance, illness-malabsorption flag, dose-form metadata, brand-swap tracking. Every claim in the spec below addresses one of these.

## Schema migration (non-destructive, backwards-compatible)

`medChecks[date][medName]` accepts **either shape** going forward:

```js
// Legacy (existing data — never rewritten):
'done:08:42'           // string starting with 'done:'
'done:late'            // late retroactive mark
'skipped'              // skip

// New (all writes from this PR forward):
{
  status:    'done' | 'late' | 'skipped',
  givenAt:   'HH:MM',          // ACTUAL administration time (parent-stated or now-default)
  loggedAt:  'HH:MM',          // tap-time (audit trail)
  withFat:   true | false,     // auto-detected — was a fat-bearing food logged near givenAt?
  fatFood:   'ghee chapati' | null,  // the matched food string, if any
  fatDelta:  -25 | 42 | null,  // minutes between givenAt and the matched meal (signed; negative = food first)
}
```

**Migration policy:** no destructive rewrite. Old strings stay as strings; the read helpers normalise both shapes to a canonical object at read time. A new write always emits the object shape. Over time, the storage transitions naturally as parents log fresh doses; legacy strings remain readable and analyzable (tap-time becomes `givenAt`, `withFat` is `null` / unknown).

**Helper functions** (added to `core.js`):

- `parseMedCheck(val)` → `{ status, givenAt, loggedAt, withFat, fatFood, fatDelta }` (normalises both shapes; returns `null` if not done/skipped)
- `medCheckIsDone(val)` → boolean (replaces the `.startsWith('done:')` calls scattered across home.js / isl)
- `medCheckGivenAt(val)` → time string or null
- `medCheckSkipped(val)` → boolean

Every existing reader of `medChecks[date][name]` migrates to these helpers (4 sites: `home.js:875` write, `home.js:5163` _obCheckVitD3, `home.js:8675` Today So Far chip, `intelligence-isl.js:555-561` extraction).

## With-fat detection

Vit D3 is fat-soluble — co-ingestion with dietary fat materially improves absorption. The diet log already knows what Ziva ate at each meal-time. Cross-reference at log time.

**Fat-bearing food set:** derived programmatically from `NUTRITION` (post-C-1.5):

```js
function _getFatBearingFoodNames() {
  // Memoised. Derived from NUTRITION entries with 'healthy-fats' tag OR
  // 'healthy fats' / 'omega-3' / 'MCTs' in nutrients[].
  // Hand-augmented with 'paratha' (carries ghee in Indian-prep default).
}
```

Computed-not-hardcoded so the food-DB factuality work flows through automatically — no second source of truth to maintain.

**Detection algorithm** (`_detectFatContextNearTime(timeStr, dateStr)` in `core.js`):

1. Read `feedingData[dateStr]` (day's meal log: `{breakfast, breakfast_time, lunch, lunch_time, ...}`).
2. For each meal, if `meal_time` and `meal` content present, compute delta in minutes vs `timeStr`.
3. Window: ±60 minutes default (Vit D3 absorption window for fat co-ingestion is broad).
4. Token-match the meal content against the fat-bearing set. If any matches AND meal is in window, capture `{withFat: true, fatFood: '<matched name>', fatDelta: <signed minutes>}`.
5. Pick closest-in-time match if multiple meals qualify.
6. If no qualifying match, return `{withFat: false, fatFood: null, fatDelta: null}`.

**Care-tier note:** auto-detection is **observed truth, not asked truth**. The parent never sees a question. If the system mis-detects (e.g., parent gave D3 separately from a feed but a fat-meal coincided in time), the data is wrong in a low-stakes direction (the analysis surface shows `with ghee chapati` when really it was separate). This is acceptable for v1 — the analysis surfaces the observation honestly ("logged near …") rather than claiming the parent affirmed the pairing. Maren consult on the framing language for the surfaces.

## Write-path UX (per Architect choice — "two explicit buttons + reachable adjust")

**Reminder card — pending state:**

```
[icon] Reminder — Vitamin D3 Drops
       0.5 ml · 800 IU · Once daily
       [Done now]   [Done at...]   [Skip]
```

- **Done now** → one tap → `markMedDone(name, idx)` with `givenAt = now`, `loggedAt = now`, with-fat auto-detection runs.
- **Done at...** → expands card inline (no modal) to:

```
[icon] Reminder — Vitamin D3 Drops
       0.5 ml · 800 IU · Once daily
       Given at: [07:30]   [Save]   [Cancel]
```

Inline `<input type="time">` defaulting to current time. Matches the existing pattern at `intelligence-illness.js:212` (fever-log inline time-edit). Save → `markMedDone(name, idx, pickedTime)` with `givenAt = pickedTime`, `loggedAt = now`.

- **Skip** → unchanged.

**Reminder card — done state (NEW resolved surface):**

```
[check] Done at 8:42 AM · with ghee chapati                      [Adjust]
```

- The done state renders the captured truth: `givenAt` + with-fat context if detected.
- **Adjust** → expands to the same inline time-edit, pre-populated with current `givenAt`. Save → `adjustMedTime(name, dateStr, newTime)` with full schema-aware update + re-run with-fat detection on the new time.

**Half-awake test:** "Done now" is one tap, same as today. The new affordances are opt-in; the 2-AM-panic floor is preserved.

## Read-path / surface upgrades

**1. Today So Far chip (`home.js:8672-8676`):**

```
Before: "Done today"      / "Pending"
After:  "Done at 8:42 AM" / "Pending · 22h since last"
        [with ghee chapati badge if withFat detected]
```

Compact, parsable in 0.5s, still room for the next-meal-fat-pairing hint when pending.

**2. Medical tab — Vit D3 detail card (NEW):**

A new card inserted in the medical-tab medication section. 14-day rolling window:

- **Title row:** "Vitamin D3 · 14-day pattern"
- **Adherence:** % + streak ("Current streak: 9 days")
- **Time-of-day micro-plot:** 14 dots on a 24-hour axis, one per dose, coloured by `withFat` (sage if with-fat, amber if without, indigo if unknown/legacy)
- **With-fat rate:** "12 of 14 doses given with a fat-containing food (86%)"
- **Common pairing:** the most-frequent fat food across the window ("usually with ghee chapati or curd")
- **Empty/gap callout:** if any day in the last 14 has no entry, list those dates compactly

Uses existing sage / amber / indigo domain tokens. Reuses the dot-plot pattern from `intelligence-cards.js` where available; otherwise minimal SVG.

**3. Smart Q&A handler upgrade (`intelligence-qa-handlers.js`):**

The existing "Vit D3 / supplement" intent (registry at `intelligence-qa.js:2079`) currently answers with adherence %. Upgrade to handle the richer surface:

- "When did Ziva get D3 today?" → `givenAt` + with-fat status
- "What's her D3 pattern?" → typical-time-of-day cluster + with-fat rate + streak
- "Is she getting D3 with fat?" → with-fat rate over the queried window + recent counter-examples if rate < 70%

Adds one new sub-intent (`vit-d3-pattern`) or extends the existing handler — Lyra's call at implementation.

## Non-goals (deferred to v2 or later)

Explicitly NOT in v1 scope:

- Reminder / notification scheduling (touches sync + notification engine — a separate effort).
- Skip-reason capture ("ran out / forgot / refused" categorisation).
- Dose override UI (Ziva's 0.5ml regimen is stable; brand swap is a metadata edit on the med definition, not a per-dose event).
- Diarrhoea-malabsorption cross-reference (interesting — D3 absorption tanks during gut illness; cross-read against `intelligence-illness.js` episodes is a v2 candidate that the with-fat detection pattern can extend cleanly).
- CareTicket auto-creation on multi-day gaps (a v2 — once the analysis surface is in place, the "3+ day gap" CareTicket trigger is a natural next).
- Multi-tenant family-config (Ziva-first per Architect doctrine).
- Vit D3 age-correlated dose escalation reminders (often 800 → 1000 IU at 12mo+; an AGE_RULES adjacent concern).

## Regression guards

`tests/e2e/vit-d3-tracking.spec.ts` — new file:

1. **`regression-guard-d3-schema-backwards-compat`** — write a legacy `'done:08:42'` string into medChecks, verify `parseMedCheck()` returns canonical object with `givenAt:'08:42'` and `withFat:null`.
2. **`regression-guard-d3-write-object-shape`** — call `markMedDone(name, idx)` (now-default), verify `medChecks[today]['Vitamin D3 Drops']` is an object with all 6 fields populated.
3. **`regression-guard-d3-with-fat-auto-detect`** — log a fat-bearing food at 8:30 in feedingData, call `markMedDone()` with `givenAt = 08:42`, verify `withFat:true` + `fatFood` non-null + `fatDelta` within ±60min window.
4. **`regression-guard-d3-with-fat-no-match`** — log a non-fat food in feedingData OR no food at all, call `markMedDone()`, verify `withFat:false`.
5. **`regression-guard-d3-adjust-flow`** — mark done, then call `adjustMedTime()` with a new time, verify both `givenAt` updates AND with-fat re-detection runs on the new time.

## QA chain (canon-cc-008)

1. Build & self-check.
2. **Maren Mode-1 (primary)** + **Kael Mode-1 (secondary)** in parallel.
3. Lyra synth.
4. Cipher Edict V final-pass.
5. Draft → ready.

## HR pre-check

| HR | Risk | Mitigation |
|----|------|------------|
| HR-1 (no emojis) | n/a | All icons via zi() — `zi('sun')`, `zi('check')`, `zi('clock')`, etc. |
| HR-2 (no inline styles) | low | One existing inline-style site in current home.js:884 (`el.style.transform = 'scale(0.97)'`); not introducing more. New micro-plot uses CSS classes + design tokens. |
| HR-3 (no inline handlers) | n/a | data-action delegation for all new buttons ("Done now" / "Done at..." / "Save" / "Cancel" / "Adjust") |
| HR-4 (escHtml at boundaries) | medium | The `fatFood` string is observed from `feedingData[date][meal]` parent input — must escHtml when rendered in Today So Far chip + reminder done-state + detail card |
| HR-5 (tokens-only) | n/a | sage / amber / indigo / sky / peach domain tokens for all colour decisions |
| HR-6 (data-action) | n/a | Universal |
| HR-7 (zi via innerHTML) | n/a | Unchanged |
| HR-8 (Coming-soon stubs) | n/a | No stubs |
| HR-9 (post-build multi-round QA) | structural | canon-cc-008 chain runs |
| HR-10 (no text-overflow ellipsis) | n/a | Done-state strings are short |
| HR-11 (Math.floor currency) | n/a | No currency |
| HR-12 (timezone-safe dates) | medium | `givenAt` is HH:MM only — no Date construction needed. `loggedAt` similar. Date keys via `today()` (existing helper). |

## Doctrinal references

- `docs/specs/food-db-cleanup-v1.md` §C-1.5 (NUTRITION factuality audit — `healthy-fats` tags now defensible; with-fat detection consumes this)
- `CLAUDE.md` §Ziva Context ("Takes Vit D3 — track administration timing, not just taken/not-taken." — this spec is the implementation of that brief)
- `intelligence-illness.js:212` (precedent for inline `<input type="time">` in a render card — UX pattern reuse)
- canon-cc-008 (QA chain gate)
- canon-cc-027 (spec amendment authority — for future v2 amendments)

---

— Lyra (main-session), 2026-05-23, against `b73ebcc` (food-DB cleanup tip; this branch's base). cc-018 status: `drafted — awaiting Maren Mode-1 primary audit on the live implementation commit, then Kael Mode-1 secondary, then Cipher Edict V before PR leaves draft`.
