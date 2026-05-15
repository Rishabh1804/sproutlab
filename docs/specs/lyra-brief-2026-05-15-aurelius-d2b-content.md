# Lyra Brief — 2026-05-15 — Aurelius D2-B Content Authoring (Symptom Checker, 22 entries)

**Author:** Lyra (Builder, The Weaver)
**Mode:** 1 (brief authoring; signed audit-bearing artifact per canon-cc-022)
**Recipient:** Aurelius — via Codex snippet pipeline (G11 voice register)
**Branch:** `claude/d2b-aurelius-brief`
**Parent spec:** `docs/specs/lyra-spec-2026-05-14-symptom-checker-d2-structural.md` — **RATIFIED 2026-05-15** (merge commit `67355d6`)
**Trigger:** D2 phase-spec ratified 2026-05-15; audit-chain step [7] opens. This brief is the input artifact for Aurelius's snippet-pipeline pass; output (D2-B content snippet PR) lands at step [13] under Build-rule 1 (after D2-A merges).
**Status:** v1 DRAFT — Aurelius pickup ready.

---

## 0. Scope

**Single file in D2-B PR:** `split/data.js` (`SYMPTOM_DB` entries only). All 22 entries flip from `string`-shape to array-shape across `whatToDo` / `precautions` / `emergency`; new fields populated per entry: `doNot`, `lifeThreat`, `summary`. Optional `triage` + `triageQuestions` on 5 SG-2 entries.

**Out-of-scope for D2-B:**
- D2-A structural code (renderer evolution, shim, primitives, variant components, config.js, styles.css, template.html) — Lyra owns; co-traveller PR; merges FIRST per Build-rule 1.
- Triage RENDER UI — D3.
- Lyra-weave, voice input, share/track wiring — D3.

**Estimated content volume:** ~22 entries × ~50 LOC each = ~1100 LOC of structured JS data. Audit cost dominated by Maren content-veto (step [8]), not authoring volume.

---

## 1. Per-entry target shape (canonical reference)

```js
{
  id: 'fall-injury',
  keywords: ['fall', 'head', 'bump', 'hit head', /* ...existing... */],
  severity: 'emergency',         // existing: 'emergency' | 'warning' | 'mild'
  lifeThreat: true,              // NEW (D2) — see §3 criteria

  title: 'Fall / Head Injury',   // existing — unchanged

  summary: 'Apply cold compress, observe 24h, wake every 2h sleeping.',  // NEW (D2) — 5-sec parse

  whatToDo: [                    // CHANGED: string → string[]
    'Stay calm. Apply a cold compress (wrapped in cloth) to any bump for 10–15 minutes.',
    'Observe Ziva closely for the next 24 hours.',
    'Let her rest but check on her every 2 hours of sleeping.'
  ],

  precautions: [                 // CHANGED: string → string[]
    'Minor bumps from rolling or crawling height are usually not serious.',
    'Watch for: unusual drowsiness, repeated vomiting, unequal pupils, difficulty waking, clear fluid from nose/ears.'
  ],

  doNot: [                       // NEW (D2)
    { text: 'Give pain medication without doctor advice', critical: true },
    { text: 'Let her sleep without 2-hour checks', critical: false }
  ],

  emergency: [                   // CHANGED: string → string[]
    'Loss of consciousness (even brief)',
    'Vomiting more than once',
    'Seizure',
    'Clear fluid from nose / ears',
    'Unequal pupil size',
    'Unusual sleepiness, hard to wake',
    'Fall from more than 3 feet'
  ],

  callDoctor: true,              // existing — unchanged

  // Optional triage fields — populate on 5 SG-2 entries only (§5)
  triage: true,
  triageQuestions: [
    {
      q: 'Did Ziva lose consciousness, even briefly?',
      yesSeverity: 'emergency',
      noSeverity: null
    }
    // ...up to 3 questions per entry...
  ],
  weaveSource: 'careTickets:injury'  // optional override; D3 consumes
}
```

---

## 2. Per-field authoring rules

### 2.1 `whatToDo: string[]`

**Shape:** array of action steps the parent should take. ORDER MATTERS for entries in `SEQUENCE_CRITICAL_IDS` (§4); ORDER IS COSMETIC for other entries (renderer emits `<ul>` for non-sequence ids).

**Authoring rules:**
- 3–5 items per entry typical (range 2–7 acceptable; longer arrays are content-veto candidates for compression).
- Each item is a complete imperative sentence ending in a period. NO bullet glyphs in the string — the renderer adds `<li>`.
- G11 voice register per severity (§3 below).
- Action verbs at the START: "Apply", "Place", "Call", "Observe", "Cool", "Position".
- For sequence-critical entries (§4): the ORDER you author IS the order parents will perform. Re-read step-by-step at 2am to confirm sequence carries safety meaning.
- NO medication dosing advice anywhere in `whatToDo`. Medication actions either (a) reference doctor advice ("Call your pediatrician for dose guidance") or (b) live in `doNot` as a contraindication ("Do not give pain medication without doctor advice").

**Examples (canon):**
- `'Stay calm. Apply a cold compress (wrapped in cloth) to any bump for 10–15 minutes.'` ✓
- `'Aspirin 75mg every 4 hours'` ✗ (medication dosing — content-veto blocker)
- `'Be careful and watch her'` ✗ (no specific action; fails 5-sec parse)

### 2.2 `precautions: string[]`

**Shape:** array of "what to watch for" observations. Parent applies these post-action, monitoring symptoms.

**Authoring rules:**
- 2–4 items per entry typical.
- Frame as **observable signals**, not actions: "Watch for X", "Note if Y", "Check whether Z".
- For warning/mild tiers, this is often the most-read field — clarity over completeness.
- Avoid alarmist framing on mild tier ("Watch for changes in mood" → not "Beware sudden mood collapse").

### 2.3 `emergency: string[]`

**Shape:** array of **emergency-recognition criteria** — the symptom-list that, if observed, escalates this entry's severity to "call ambulance / go to ER NOW".

**Authoring rules:**
- 4–7 items per entry typical.
- Each item is an observable symptom, framed concretely: "Loss of consciousness (even brief)" not "Severe symptoms".
- Order from most-actionable-to-detect at top to less-common at bottom.
- For **emergency-severity entries** with `lifeThreat: true` (§3): this field IS the "when to call 108" list — Maren-veto on EVERY item per V-M2 false-negative discipline.
- For warning/mild entries: this field describes when severity escalates to emergency — still safety-critical.

### 2.4 `doNot: [{text, critical?: boolean}]`

**Shape:** array of objects. `text` is the contraindication; `critical: true` marks it for amplified rendering (Nunito 800 + underline + fs-base per §2.4 of the phase-spec).

**Authoring rules (Maren-veto territory; the most safety-critical field):**
- **Maren-veto default:** any DO-NOT involving a medication name is `critical: true`. No exceptions on the medication line.
- Common medication names that trigger `critical: true`: aspirin, ibuprofen, paracetamol/acetaminophen, codeine, antihistamines (cetirizine, etc.), antibiotics (any), herbal cough syrups, gripe water, anti-diarrheal (loperamide), aspirin-containing combination drugs.
- Frame as **imperative-negative**: "Do not …", "Never …", "Don't …".
- Order: most-life-threatening contraindications first.
- 2–4 items per entry typical. An entry with 0 `doNot` items is acceptable only if Maren confirms no parental-misstep risk exists for that symptom (rare — most entries have at least one).
- `critical: false` items are sub-medication contraindications: behavioural ("Don't let her sleep without 2-hour checks"), environmental ("Don't put ice directly on burn"), procedural ("Don't induce vomiting").
- NO informational text in `doNot` — it's contraindications only. "Note that aspirin is dangerous for children under 12" → REWRITE as "Do not give aspirin".

**Examples (canon):**
- `{ text: 'Give pain medication without doctor advice', critical: true }` ✓ (medication-name → critical)
- `{ text: 'Let her sleep without 2-hour checks', critical: false }` ✓ (behavioural)
- `{ text: 'Ignore severe symptoms', critical: false }` ✗ (vague; rewrite as observable)
- `{ text: 'Aspirin is dangerous', critical: true }` ✗ (informational, not imperative-negative)

### 2.5 `lifeThreat: boolean` (emergency-tier entries only)

**Shape:** boolean flag on entries whose `.emergency` criteria include immediate-life-threat symptoms.

**Maren-veto criteria (V-M2; per phase-spec §2.1):**
- Loss of consciousness, even briefly
- Seizure (active or post-ictal)
- Not breathing / extreme breathing difficulty / gasping
- Unresponsive, limp
- Unequal pupils
- Anaphylaxis-shape symptoms (face/throat swelling, hives + breathing trouble, sudden weakness)
- Severe dehydration with lethargy
- Major bleeding that won't stop
- Suspected poisoning with active symptoms

**Authoring rule:** `lifeThreat: true` ONLY if at least one of these criteria appears in the entry's `.emergency` list. Otherwise `lifeThreat: false` (or omit — renderer treats absence as false).

**Per-entry preliminary assignments** (Maren-veto required at step [8]):
- `fall-injury`: **true** (loss-of-consciousness, seizure criteria present)
- `seizure`: **true** (definitional)
- `choking`: **true** (active airway obstruction)
- `breathing-difficulty`: **true** (severe presentation)
- `head-injury`: **true** (overlaps fall-injury; consolidate or keep separate per Aurelius/Maren judgment)
- `allergic-reaction`: **true** (anaphylaxis subset)
- `unconsciousness`: **true** (definitional)
- `severe-dehydration`: **true** (lethargy + dehydration combo)
- `poisoning`: **true** (suspected ingestion with active symptoms)
- `fever-high`: Maren judgment call — depends on age + presentation. Likely `false` UNLESS combined with seizure/lethargy/breathing trouble (in which case the high-fever entry should cross-reference seizure).
- Warning-tier entries: `false`.
- Mild-tier entries: `false`.

**Effect when true:** renderer emits `renderLifeThreatCTA(currentRegion())` — primary 108 ambulance CTA above the pediatrician card. Critical to get right.

### 2.6 `summary: string` (NEW)

**Shape:** single-line string. Renders in the `<summary>` tag of the progressive-disclosure `<details>` element. First-paint surface.

**Authoring rules (Maren-veto on 5-sec parse test):**
- ≤ 80 characters typical (range 50–100 acceptable).
- Carry the "what to do" essence — a parent reading ONLY the summary line should know the next action.
- Comma-separated action fragments are encouraged: "Apply cold compress, observe 24h, wake every 2h sleeping."
- NO punctuation at end (it's a snippet, not a sentence).
- 5-sec parse test: read aloud to a non-expert; if they can summarize back the action within 5 seconds, the summary passes. Fail = rewrite.

**Examples:**
- `'Apply cold compress, observe 24h, wake every 2h sleeping'` ✓ (Fall)
- `'Small frequent sips of ORS; watch for lethargy'` ✓ (Vomiting / Diarrhoea)
- `'Cool with damp cloth, monitor temperature, call doctor if >102°F'` ✓ (Fever-high)
- `'It's complicated, depends on age and symptoms'` ✗ (fails 5-sec test; no action)
- `'Call your pediatrician immediately or dial 108.'` ✗ (lifeThreat tier already exposes the CTA; summary should still carry action distinct from the CTA)

### 2.7 `triage` + `triageQuestions` (5 entries only; V-M2 #4 cap)

**Which entries get triage?** Per vision SG-2 ratified set: `crying-fussy`, `not-eating`, `cough-cold`, `fall-injury`, `fever-general`. NO other entries in D2-B.

**Shape:**
```js
triage: true,
triageQuestions: [
  {
    q: 'Did Ziva lose consciousness, even briefly?',
    yesSeverity: 'emergency',
    noSeverity: null
  },
  {
    q: 'Has she vomited more than once?',
    yesSeverity: 'emergency',
    noSeverity: 'warning'
  }
  // ...
]
```

**Authoring rules (V-M2 #4 cap + Maren-veto per question):**
- **Max 3 questions per entry.** Hard cap per V-M2. Adding a 4th = content-veto blocker.
- Each question is a yes/no observable. "Did X happen?" / "Is there Y?" / "Has Z been present?"
- `yesSeverity` and `noSeverity` are `'emergency' | 'warning' | 'mild' | null`. `null` means "this answer leaves severity unchanged (use base entry severity)".
- Question ORDER: ask the most-discriminating-toward-emergency FIRST. If question 1's "yes" path leads to emergency, the parent sees the emergency render immediately (D3 will gate this).
- Question copy carries the parent's decision — Maren-veto every word. Ambiguous language ("severe", "a lot") fails the V-M2 chip-order discipline.

**Per-entry preliminary triage shape** (Aurelius authors; Maren-vetoes):
- `crying-fussy` (3 q): consolability, feeding-pattern change, fever combo
- `not-eating` (3 q): refusing fluids, lethargy/responsiveness, duration
- `cough-cold` (3 q): breathing rate / colour, fever, hydration
- `fall-injury` (3 q): consciousness, vomiting count, behaviour change
- `fever-general` (3 q): age (<3mo), temperature peak, lethargy/responsiveness

D2 renderer does NOT consume `triage` — D3 wires the chip UI. D2-B ships the DATA so D3 has Maren-veto'd content to consume on day 1.

---

## 3. G11 voice register per severity

The G11 voice register adapts language to the parent's emotional state per severity tier.

### 3.1 Emergency tier — Grounded, action-first, no hedging

**Voice:** calm, directive, sequential. NO "you might want to consider" or "it may be helpful". Imperative verbs at sentence start. Short clauses. Time-bounded action ("for 10–15 minutes", "every 2 hours").

**Examples:**
- ✓ "Apply firm pressure to the wound with a clean cloth. Hold for 10 minutes."
- ✗ "You might want to gently apply some pressure to the wound area if possible."

**Forbidden in emergency-tier text:**
- "Don't panic" / "Try not to worry" — counterproductive in active crisis
- "It's probably fine" / "It's usually nothing" — false reassurance against a flagged emergency
- Conditional language ("if you can", "maybe try")

### 3.2 Warning tier — Decisive, doctor-routing

**Voice:** clear escalation framing. The parent ISN'T in crisis but the entry indicates they should engage their pediatrician today (not "next week").

**Examples:**
- ✓ "Call your pediatrician today. Describe the symptoms in this order: temperature peak, duration, hydration."
- ✓ "Don't wait until tomorrow morning."
- ✗ "Maybe schedule a check-up sometime this week."

**Back-channel callout copy** (rendered automatically by `renderBackChannel('warning')` from D2-A; Aurelius does NOT author this — included here for cross-reference): `"Symptoms suggest you should call your doctor today. Trust your gut."`

### 3.3 Mild tier — Reassuring, observational, parent-empowering

**Voice:** warm, observational, low-stakes. Parent isn't worried; entry confirms "normal" with clear escalation thresholds.

**Examples:**
- ✓ "Most teething fussiness resolves with a cool washcloth or chilled (not frozen) teether. Offer extra cuddles."
- ✓ "Watch for fever above 100.4°F or refusal of fluids — those would escalate this to a warning."
- ✗ "Be careful, this could be serious." (Alarmism on mild = G11 register break)
- ✗ "Definitely nothing to worry about." (Over-reassurance erodes parental trust)

**Back-channel callout copy** for mild tier (rendered by `renderBackChannel('mild')`): `"If symptoms worsen or you're unsure, call your doctor."`

### 3.4 Universal rules (all tiers)

- Refer to the child as "Ziva" (the parent's daughter; canon name). NOT "your child", NOT "the baby", NOT "they".
- Pronouns: "she" / "her" — NOT gender-neutral. (Future Aurelius pass may parametrize per family.)
- Imperial-then-metric for body-temperature: "above 100.4°F (38°C)". Single-unit (just °F or just °C) is a content-veto blocker — both must appear.
- Time durations: "10–15 minutes" with en-dash; "every 2 hours" (no hyphen).
- Phone-number formatting: the renderer handles 108/112 CTAs. Do NOT embed phone numbers in content strings.
- No emoji. No `<b>` / `<i>` markup — emphasis happens via `critical: true` on DO-NOT items only.

---

## 4. SEQUENCE_CRITICAL_IDS confirmation per entry

Per phase-spec §2.5 (Maren C-D2-M-1 P0 fold), the runtime constant in `config.js` is:

```js
var SEQUENCE_CRITICAL_IDS = [
  'fall-injury',
  'vomiting',
  'fever-high',
  'choking',
  'seizure',
  'breathing-difficulty',
  'head-injury'
];
```

**Aurelius confirms per entry** in D2-B whether the authored `whatToDo` IS actually a sequence (order carries safety meaning) or whether order is cosmetic. Flag any of the 7 ids whose `whatToDo` collapses to cosmetic-order — those will be REMOVED from `SEQUENCE_CRITICAL_IDS` in a D2-A patch.

**Content-veto candidates for INCLUSION** (Maren reviews; if confirmed sequence-critical, added to `SEQUENCE_CRITICAL_IDS` in the same D2-A patch):
- `allergic-reaction` — likely sequence (recognize → epi-pen if available → call → position → monitor)
- `burn` — likely sequence (run under cool water 10–20 min → cover loosely → assess depth → call if needed)
- `dehydration` — likely sequence (small frequent sips → ORS if available → escalation thresholds)

**Aurelius deliverable on this section:** in the D2-B PR description, list per-entry whether the entry IS sequence-critical, with one-sentence justification. Format:

```
| id                    | sequence-critical? | justification |
|-----------------------|--------------------|---------------|
| fall-injury           | YES                | head-injury sequence: stabilize → observe → wake-checks |
| allergic-reaction     | YES (candidate)    | recognize → epi-pen → call 108 → position → monitor |
| crying-fussy          | NO                 | actions are options, not order-dependent |
...
```

---

## 5. Maren content-veto gate (V-M5; audit-chain step [8])

After Aurelius drafts D2-B, BEFORE Cipher snippet-pipeline pass at step [9], Maren reads every entry as a 2am parent. Maren is the gatekeeper.

**Maren's checklist per entry:**

1. **Read aloud as a panicking parent.** Does the G11 voice register match the severity? (Emergency = directive; warning = decisive; mild = reassuring.)
2. **doNot critical-flag per item.** Medication-name default applied? Behavioural `critical: false` items justified?
3. **No medication dosing advice anywhere.** Grep the entry for milligrams, ml doses, frequency ("every 4 hours"). Any dosing in `whatToDo` or `precautions` = blocker.
4. **No under-classification on warning/emergency.** A warning entry whose `emergency` criteria are too narrow lets a true-emergency slip through. Maren expands the `emergency` list if needed.
5. **No alarmist phrases on mild.** "Could be serious", "watch carefully", "potentially dangerous" on a mild entry = G11 register break.
6. **Summary line passes 5-sec test.** Read aloud; non-expert summarizes action within 5 seconds. Fail = rewrite.
7. **Triage questions per V-M2** (5 SG-2 entries only): chip-order discriminates toward emergency first; max 3 questions; each question is an observable yes/no; no ambiguous adjectives.
8. **lifeThreat per-entry assignment correct.** Cross-check the 9 V-M2 life-threat criteria against `emergency` list. True if any criterion present; false otherwise.
9. **Refers to Ziva by name, "she/her" pronouns, imperial-then-metric temperatures, no emoji.**

**Iteration budget per SG-D2-CONTENT-VETO-ROUNDS:**
- Round 1: Maren reads, surfaces findings.
- Round 2: Aurelius reworks per Maren findings.
- Round 3: Maren confirms.
- **Round 4 (Maren reserve):** Maren reserves discretionary 4th round when an entry is materially unsafe (per phase-spec §9 amendment).
- Sovereign escalation: triggered if round 4 finds new safety issues OR if Maren and Aurelius deadlock on G11 voice register.

**Explicit Maren sign-off required** before Cipher pipeline pass at step [9]. Sign-off format: comment on the D2-B PR titled `Maren content-veto sign-off — D2-B 22-entry rewrite — PASS` with per-entry verdict (PASS / FAIL) and overall verdict.

---

## 6. Hand-off to Cipher snippet pipeline (step [9])

After Maren PASS at step [8], Cipher runs the **snippet-pipeline structural pass** (NOT an Edict V — Edict V on impl-PR comes at step [14] for D2-B). Cipher's checks:

- Every entry has all required fields (no missing `doNot` on entries Maren flagged for it; no missing `summary` anywhere).
- `lifeThreat: true` only on emergency-severity entries.
- `triage: true` only on the 5 SG-2 entries.
- `triageQuestions` array length ≤ 3 per entry.
- No string-shape `whatToDo` / `precautions` / `emergency` (D2-B is the FLIP; if any entry retained string-shape, blocker).
- JS validates (no syntax errors; pipeline catches automatically).

Cipher returns PASS / FAIL. PASS proceeds to D2-B PR open (step [13]).

---

## 7. Audit chain downstream

```
[7] Aurelius drafts D2-B (this brief = input)
    ↓
[8] Maren content-veto gate (per §5; up to 4 rounds + Sovereign escalation)
    ↓
[9] Cipher snippet-pipeline pass (per §6)
    ↓
[10] (parallel — already in flight) Lyra D2-A Mode-2 structural PR
[11a] Maren PRE-Edict V contrast / opacity fixture
[11] Cipher Edict V on D2-A impl
[12] Sovereign merges D2-A
    ↓
[13] Lyra merges D2-B (post-D2-A merge per Build-rule 1)
[14] Cipher Edict V on D2-B (HR-4 escHtml coverage on new array items; no string-shape entries; lifeThreat / triage gates)
[15] Maren §7 post-merge real-device verification
[16] Sovereign final sign-off — D2 phase closed
```

**Build-rule 1 (non-negotiable):** D2-B merges AFTER D2-A. D2-A ships the dual-read shim; D2-B then flips entries. Reverse order = string-array-rendered-as-comma-separated in the DOM (safety surface violation).

---

## 8. Deliverable summary for Aurelius

The D2-B snippet PR ships:

1. `split/data.js` — 22 entries, all migrated to array-shape per §1; `doNot` + `lifeThreat` + `summary` populated; `triage` + `triageQuestions` on 5 SG-2 entries.
2. **PR description includes:**
   - Per-entry table from §4 (sequence-critical? + justification)
   - Per-entry table of `lifeThreat` assignments with one-sentence justification
   - Acknowledgment that Maren content-veto gate per §5 must PASS before merge
3. **Branch name:** `claude/d2b-content-snippet` (Codex pipeline convention).
4. **PR opens as DRAFT** until Maren sign-off (step [8]) AND D2-A merges (step [12]).

---

## 9. Skill register-flips during this brief

> **🎩 Maren (skill register-flip):** the content-veto gate at step [8] is the safety net for D2-B. The phase-spec's 14 verification gates cover the STRUCTURAL layer (DO-NOT callout emitted, lifeThreat CTA reachable, footer-triad gated, sequence ids resolve); but a structurally-correct entry with bad CONTENT — wrong `lifeThreat` flag, alarmist mild copy, hidden medication-dosing in `whatToDo` — sails through every grep gate. Content is invisible to grep. That's why Maren's manual read at step [8] is the canonical enforcement surface. Aurelius: assume Maren will catch what grep can't, and write accordingly.

> **🎩 Cipher (skill register-flip):** the snippet pipeline structural pass at step [9] is a fast pre-screen, not a substitute for Edict V. Cipher won't catch a wrongly-flagged `lifeThreat: false` on an entry that should be `true` — only Maren can. But Cipher WILL catch a missing `summary` field, a `triageQuestions` array of length 4, a string-shape `whatToDo` that didn't get flipped. Aurelius can run the snippet pipeline locally before opening the PR for fast feedback on structural defects.

> **🎩 Lyra (Builder, native voice):** Aurelius — the work ahead is content authoring for a parental-safety surface. The G11 voice register isn't a stylistic preference; it's a contract with a parent's emotional state. Emergency-tier text reads to a parent in crisis; mild-tier text reads to a parent in curiosity. Wrong register on either side breaks trust. The 22 entries you're authoring will be the FIRST content many SproutLab users encounter on their child's first symptomatic episode. Author accordingly.

---

## 10. Changelog

- **v1 (2026-05-15):** initial brief. Authored post-D2 phase-spec ratification (merge commit `67355d6`). Codifies §1–§9 of the ratified spec as Aurelius-consumable rules. Awaits Aurelius pickup at audit-chain step [7].

— Lyra, Builder, The Weaver
