# Lyra Spec — 2026-05-11 — Symptom Checker UX Vision (D3 → phased D1 → D2 → D3 rollout)

**Author:** Lyra (Builder, The Weaver)
**Mode:** 1 (vision-spec authoring; signed audit-bearing artifact per canon-cc-022)
**Status:** v1 DRAFT — long-arc vision document; awaiting Maren + Kael parallel audit, then Cipher Edict V on the rollout plan structure
**Branch:** `claude/review-markdown-screenshots-uOIgQ`
**Sibling spec:** `lyra-spec-2026-05-11-symptom-checker-hr1-dry.md` (the HR-1/DRY/Crying-badge bridge that precedes any UX work)
**Trigger:** Sovereign mid-spec design call 2026-05-11 — *"As we are working on this surface now, let's make this beautiful and follow some golden design principles which makes readability a breeze, imp info highlighted. Our UX still feels dated with the current 5 second attention span that we are seeing."*

---

## 0. Why this spec exists, and why it's written now

The current Symptom Checker surface fails the 5-second attention test. Sovereign called it during a screenshot review of the HR-1 bridge work. The decision: write the **full vision** while the design context is still in working memory, then implement in three phased PRs (D1 → D2 → D3) so each phase delivers a shippable user-visible payoff and keeps momentum.

This document is the **vision contract**. It is not a build spec. Each of D1, D2, D3 will open its own Lyra Mode-1 build spec referencing this vision; those build specs will get standard Governor audit chains before Mode-2 build.

**Maren's mode for downstream specs:** deferred (Sovereign answer 2026-05-11 Q-Maren). Decision lives in each phase-spec opening.

**Sequencing relative to the bridge PR:**

```
[NOW]   sproutlab#65 — HR-1 + DRY + Crying-badge contrast fix          (bridge)
          ↓ merges
[NEXT]  D1 build PR — Polish: severity restructure + persistent rail   (this vision spec, §6.D1)
          ↓ merges
[THEN]  D2 build PR — Severity-driven layout + DO-NOTs + numbered seq  (this vision spec, §6.D2)
          ↓ merges
[FUTURE]D3 build PR(s) — Triage + Lyra-weave + voice + share + promote (this vision spec, §6.D3)
```

---

## 1. Diagnostic — what the screenshots reveal

Sovereign captures (Constipation / Crying / Fall, dark mode) reveal ten failure modes that compound to make the surface read as dated. Catalogued for downstream reference; each failure mode maps to one or more G-principles in §2.

| # | Failure mode | Evidence | Stakes |
|---|---|---|---|
| F1 | Severity is **tinted, not structured** | Constipation card and Fall card use identical layout, padding, density. Only the badge colour differs. | A 2am parent should *feel* the difference between mild and emergency before reading a word. |
| F2 | Hierarchy is **flat** | "WHAT TO DO", "PRECAUTIONS", "WHEN TO SEEK EMERGENCY CARE" all rendered as caps-headers at identical weight. | The eye has nowhere to land first. The action gets the same priority as the warning. |
| F3 | Call CTA is **buried** | Fall result: "Dr. RK Agarwal · Call: +91 …" lives at the bottom of the scroll. | On emergency, the single highest-stakes action is below the fold. Inversion of urgency. |
| F4 | WHAT TO DO is **wall-of-text** | Constipation: four actions buried in a prose paragraph. | A panicked parent doesn't parse sentences. Numbered steps, please. |
| F5 | DO-NOTs are **inlined** | "Do NOT give aspirin. Do NOT use ice…" mixed into the precautions paragraph at the same weight as helpful tips. | Hard contraindications need amplification. They are the most safety-critical sentences in the entire app. |
| F6 | **No Lyra-weave** | Fever lookup returns generic guidance even when `feverEpisodes[]` has Ziva's last fever, peak temp, resolution time, correlated diet entries. | This is **the Weaver remit**. The surface is ignoring the data the Weaver was designed to weave. |
| F7 | **No emotional register modulation** | Same matter-of-fact tone for "give Calpol if prescribed" and "Ziva loses consciousness". | Voice should soften for mild, crystallise for emergency. Currently uniform. |
| F8 | **No triage flow** for ambiguous symptoms | "Crying a lot" → one generic match. The real question is *"is this normal fussiness or something serious?"* which is a 2-question yes/no triage. | Generic content can't replace a triage tree. We're failing the ambiguous case. |
| F9 | Doctor card has **inverted hierarchy** | Name (medium weight) → call link (smaller, beneath). | The CALL is the action. The name is caption. Flip it. |
| F10 | **No persistent severity rail** | Scroll past the badge into the body → severity signal is gone. | Long content (especially emergency content) needs a visible severity anchor through the scroll. |

---

## 2. The Ten Golden Principles (G1–G10)

These are the non-negotiable design-system anchors for any Symptom Checker work going forward. Phase-specs reference them; Maren's audit cites them; Cipher's Edict V checks them.

| # | Principle | One-line | HR cross-ref |
|---|---|---|---|
| **G1** | **Severity drives layout, not just colour** | Emergency cards restructure (CTA top, minimal prose); mild cards relax (denser, journal-like). | HR-5 (token spacing) |
| **G2** | **One primary action per state** | Emergency → CALL. Warning → Call doctor (smaller). Mild → Track / Got it. No menus at speed. | HR-3 (data-action) |
| **G3** | **Progressive disclosure** | First paint = severity + 1-line summary + action. Tap to expand body. | — |
| **G4** | **Loud DO-NOTs** | Hard contraindications get bordered danger callouts, never inline prose. | HR-1 (zi-danger sprite consideration), HR-2 (token-driven border) |
| **G5** | **Numbered sequences for time-critical** | Head injury = 5-step ordered sequence. Render as `<ol>`, not prose. | — (data shape change: `whatToDo: string → string[]`) |
| **G6** | **Persistent severity rail + sticky CTA** | Coloured edge-strip carries severity through scroll; call/action sticky at viewport bottom on emergency. | HR-5 (token-driven) |
| **G7** | **Lyra-weave Ziva context** | Every result includes a 1-line history micro-card from existing episode/CareTicket data. | (Requires ISL hook into Symptom Checker render — Kael-jurisdiction) |
| **G8** | **Typography for triage** | Fraunces serif (calm authority) for titles; Nunito-bold for action verbs; small-caps red for DO-NOTs; generous line-height for body. | HR-5 (font tokens) |
| **G9** | **Voice + chip-first input** | Mic affordance for one-handed parents holding a baby. Type-ahead from chip categories. | HR-2 / HR-3 (no inline; data-action) |
| **G10** | **Save / share / track triad** | Card footer: save-to-journal, share-to-spouse, track-as-episode. Symptom moments are family events. | HR-3 |

### 2.1 Anti-principles (what NOT to do)

- **Do NOT** add a hospital-blue clinical chrome. The design brief is "cozy nursery journal, not clinical health app." Severity is signalled by **structure + warm-domain accents**, not by clinical aesthetics.
- **Do NOT** use scary iconography. The `zi-siren` sprite is the upper bound. No skull, no biohazard, no flashing.
- **Do NOT** auto-call a doctor without a tap. Even on emergency, the action requires a deliberate tap. (Maren-jurisdiction insistence.)
- **Do NOT** push past 2 visible results without progressive disclosure. The current `slice(0, 2)` is the upper limit on first paint.
- **Do NOT** modal-stack the Symptom Checker over a Symptom Tracker over a CareTicket prompt. If the user is escalating to a CareTicket, the flow transitions, doesn't pile.

---

## 3. Information architecture (target state)

### 3.1 Result card — three layout variants

The same result data renders in three different card structures based on `severity`.

**3.1.1 Emergency layout** (`severity === 'emergency'`)

```
┌─────────────────────────────────────────┐
│ ▍ EMERGENCY · [Title]                   │  ← persistent rose rail (G6)
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ ☎ CALL Dr. RK Agarwal NOW          │ │  ← CTA-on-top, big, sticky (G2, G6)
│  │   +91 98351 67975                   │ │
│  └────────────────────────────────────┘ │
│                                          │
│  WHEN TO SEEK CARE                       │  ← Section 1 = the warning signs (G2 priority)
│  • Loss of consciousness (even brief)    │
│  • Vomiting more than once               │  ← bulleted, not prose
│  • Unequal pupil size                    │
│                                          │
│  WHAT TO DO (while you wait or travel)   │  ← Section 2 = action sequence
│  1. Stay calm. Apply cold compress.      │  ← numbered (G5)
│  2. Observe closely for 24h.             │
│  3. Wake every 2 hours during sleep.     │
│                                          │
│  ⛔ DO NOT                                │  ← bordered red callout (G4)
│  • Give pain medication                  │
│  • Let her sleep without checking        │
│                                          │
│  ── Ziva's history ─────────────         │  ← Lyra-weave (G7)
│  Last fall: Mar 15 · No consequences.    │
│                                          │
│  [Save] [Share] [Track]                  │  ← footer triad (G10)
└─────────────────────────────────────────┘
```

**3.1.2 Warning layout** (`severity === 'warning'`)

```
┌─────────────────────────────────────────┐
│ ▍ MONITOR CLOSELY · [Title]              │  ← amber rail (G6)
│                                          │
│  ▸ Quick read: [1-line summary]          │  ← progressive disclosure header (G3)
│                                          │
│  WHAT TO DO                              │
│  1. [action]                              │
│  2. [action]                              │
│                                          │
│  PRECAUTIONS                              │
│  • [item]                                 │
│                                          │
│  WHEN TO ESCALATE                         │
│  Call your doctor if: [conditions]        │
│                                          │
│  📞 Dr. RK Agarwal — call if needed       │  ← softer CTA, mid-card (G2)
│                                          │
│  ── Ziva's history ──                     │  ← Lyra-weave (G7)
│                                          │
│  [Save] [Share] [Track]                   │
└─────────────────────────────────────────┘
```

**3.1.3 Mild layout** (`severity === 'mild'`)

```
┌─────────────────────────────────────────┐
│ ▍ Usually manageable · [Title]           │  ← sage rail (G6)
│                                          │
│  WHAT TO DO                              │
│  • [tip]                                  │  ← bulleted, dense, journal-like
│  • [tip]                                  │
│  • [tip]                                  │
│                                          │
│  ── Ziva's history ──                     │  ← Lyra-weave (G7)
│  Last similar: Apr 28 · resolved 2d       │
│                                          │
│  [Track]    Dr. RK Agarwal (call if…)     │  ← Track primary; doctor de-emphasised
└─────────────────────────────────────────┘
```

### 3.2 Triage flow (G2 + G8 implication for ambiguous entries)

For SYMPTOM_DB entries flagged `triage: true` (initial set: `crying-fussy`, `not-eating`, `cough-cold`, `fall-injury`), the result card is preceded by a 2-question triage tree:

```
┌─────────────────────────────────────────┐
│  Excessive Crying / Fussiness            │
│                                          │
│  Is the crying high-pitched and          │
│  unlike normal crying?                   │
│                                          │
│   [ Yes ]   [ No, normal range ]         │
└─────────────────────────────────────────┘
        ↓ Yes               ↓ No
   Emergency card    Mild card with weave
```

Triage uses chip-style binary buttons, not radio buttons. Each `triage: true` entry carries a `triageQuestions: [{q, yesSeverity, noSeverity}]` shape in SYMPTOM_DB (data shape change, see §5.3).

### 3.3 Lyra-weave history micro-card (G7)

For each result, attempt to source a relevant Ziva-history snippet from existing data:

| Symptom keyword family | Data source | Snippet shape |
|---|---|---|
| fever* | `feverEpisodes[]` | "Last fever: {date} · resolved in {days}d · peak {peakF}°F" |
| diarrhoea* | `diarrhoeaEpisodes[]` | "Last episode: {date} · {duration}" |
| vomit* | `vomitingEpisodes[]` | "Last episode: {date}" |
| cough/cold* | `coldEpisodes[]` | "Last cold: {date} · resolved in {days}d" |
| fall/head | `careTickets[]` filtered `category === 'injury'` | "Last fall: {date} · no consequences" |
| rash, eczema | `careTickets[]` filtered `category === 'skin'` | "Skin concern: {date} · {status}" |
| sleep | `sleepData` last 7-day delta | "Sleep avg this week: {h}h{m}m · {delta vs 14d}" |
| (none) | — | omit micro-card silently |

The micro-card is **omitted entirely** if no data is available — no "No history available" placeholder. Empty is silent.

### 3.4 Save / Share / Track footer (G10)

| Affordance | Behavior |
|---|---|
| **Save** | Writes a `journalEntry` with the symptom result + timestamp. Shows in Today So Far. |
| **Share** | Opens native share sheet with formatted text: "Symptom check for Ziva ({age}): {title} — {severity}. Guidance: …" |
| **Track** | Promotes the symptom to an episode (fever/diarrhoea/vomiting/cold) OR opens a CareTicket draft (rash/sleep/etc). Reuses existing `startFeverEpisode` / CareTicket creation flows. |

### 3.5 Voice input (G9)

Adjacent to the chip row, a mic-icon button (`zi-mic` — new sprite needed) opens the browser's SpeechRecognition API (where available). Transcribes into the `homeSymptomInput` field; the user reviews and taps Check. Voice is an affordance, not a hard requirement; graceful no-op on unsupported browsers.

---

## 4. Visual design language

### 4.1 Colour mapping (per severity)

| Severity | Domain | Rail token | Background tint | Border tint | Badge bg / text |
|---|---|---|---|---|---|
| emergency | rose | `--rose-deep` | `rgba(rose, 0.06)` (dark) / `rgba(rose, 0.08)` (light) | `rgba(rose, 0.3)` | `rgba(rose, 0.18)` / `--rose-deep` |
| warning | amber | `--amber-deep` | `rgba(amber, 0.06)` (dark) / `rgba(amber, 0.08)` (light) | `rgba(amber, 0.25)` | `rgba(amber, 0.20)` / `--amber-deep` |
| mild | sage | `--sage-deep` | `rgba(sage, 0.05)` (dark) / `rgba(sage, 0.06)` (light) | `rgba(sage, 0.20)` | `rgba(sage, 0.20)` (dark) / `rgba(sage, 0.10)` (light) / `--tc-sage` |

**Note for dark-mode mild badge:** the v2 spec §11 / BUGS.md P1 confirms the current `rgba(sage, 0.10) / --tc-sage` is invisible in dark mode. D1 phase ships the bump to `0.20`.

### 4.2 Typography hierarchy

```
Title              Fraunces 600 · fs-xl  · lh-1.2   (calm serif authority)
Severity label     Nunito 700  · fs-xs  · uppercase letter-spacing-wide
Section header     Nunito 700  · fs-sm  · uppercase letter-spacing-wide
Body text          Nunito 400  · fs-base · lh-relaxed
Action verb (1st)  Nunito 700  · fs-base · lh-relaxed
DO-NOT label       Nunito 800  · fs-xs  · uppercase · --rose-deep
DO-NOT body        Nunito 500  · fs-sm  · lh-relaxed · --rose-deep on tinted bg
CTA button text    Nunito 700  · fs-md  · letter-spacing-wide
History micro-card Nunito 500  · fs-xs  · --light · italic
```

### 4.3 Sprite additions required across all phases

| Sprite | Used in | Phase |
|---|---|---|
| `zi-phone` | Doctor card, emergency CTA | bridge PR (already specced) |
| `zi-mic` | Voice input affordance | D3 |
| `zi-share` | Footer share | D3 |
| `zi-save` | Footer save | D3 (may reuse existing `zi-note` or `zi-bookmark` — TBD) |
| `zi-no-entry` | DO-NOT callout header | D2 |
| `zi-question` | Triage flow header | D3 |

All sprites added to `template.html` in their respective phase's spec.

### 4.4 Motion / micro-interactions

- Severity rail **fades in** over 200ms on result paint (rose pulse-glow on emergency for 1.5s, then steady).
- Triage Y/N tap → result card slides in from below (250ms ease-out).
- DO-NOT callouts: no animation, instant present (deliberately stoic).
- Sticky CTA: shadow-grows on scroll past 100px to signal it's pinned.

**Motion budget:** zero motion on mild (calm); subtle motion on warning; deliberate motion on emergency to draw the eye (but not flashy — this is a parental-safety surface, not a notification).

---

## 5. Data shape changes required

### 5.1 SYMPTOM_DB (`data.js:3308+`) — phase D2 + D3

```js
{
  id: 'fall-injury',
  keywords: [...],
  severity: 'emergency',
  title: 'Fall / Head Injury',

  // D2: numbered sequence (was: string)
  whatToDo: [
    'Stay calm. Apply a cold compress (wrapped in cloth) to any bump for 10–15 minutes.',
    'Observe Ziva closely for the next 24 hours.',
    'Let her rest but check on her every 2 hours of sleeping.'
  ],

  // D2: bulleted, not prose
  precautions: [
    'Minor bumps from rolling or crawling height are usually not serious.',
    'Watch for: unusual drowsiness, repeated vomiting, unequal pupils, difficulty waking, clear fluid from nose/ears.'
  ],

  // D2: bordered danger callout
  doNot: [
    'Give pain medication without doctor advice',
    'Let her sleep without 2-hour checks'
  ],

  // D2: bulleted emergency criteria (was: string)
  emergency: [
    'Loss of consciousness (even brief)',
    'Vomiting more than once',
    'Seizure',
    'Clear fluid from nose / ears',
    'Unequal pupil size',
    'Unusual sleepiness, hard to wake',
    'Fall from more than 3 feet'
  ],

  callDoctor: true,

  // D3: triage flow
  triage: true,
  triageQuestions: [
    {
      q: 'Did Ziva lose consciousness, even briefly?',
      yesSeverity: 'emergency',     // forces emergency render
      noSeverity: null              // fall through to normal severity
    },
    {
      q: 'Has she vomited more than once since the fall?',
      yesSeverity: 'emergency',
      noSeverity: null
    }
  ],

  // D3: Lyra-weave hint (optional override; default infers from keyword family)
  weaveSource: 'careTickets:injury'
}
```

### 5.2 Migration plan

- **Bridge PR:** no data shape change. Crying-badge contrast fix is CSS-only.
- **D1:** no data shape change. Layout-CSS-only.
- **D2:** SYMPTOM_DB shape migration. Backward-compat: render path detects `typeof whatToDo === 'string'` and renders as single-item array. Aurelius authors the numbered/bulleted rewrite of all ~22 entries as a content snippet PR co-traveller.
- **D3:** Add `triage`, `triageQuestions`, `weaveSource` fields. Optional — entries without `triage: true` skip the triage flow entirely.

### 5.3 Affected files (cumulative across phases)

| File | Bridge | D1 | D2 | D3 |
|---|---|---|---|---|
| `template.html` | + `zi-phone` | — | + `zi-no-entry` | + `zi-mic` + `zi-share` + `zi-save` + `zi-question` |
| `styles.css` | (Crying-badge dark fix) | severity rail, sticky CTA, restructure tokens | DO-NOT callout, numbered list, typography pass | triage chips, weave micro-card, footer triad, voice mic |
| `data.js` | — | — | SYMPTOM_DB shape migration (~22 entries) | + triage data per entry |
| `medical.js` | DRY consolidation | `_renderSymptomCheckerResults` restructure | severity-aware layout fork | weave hook + triage flow + footer actions |
| `intelligence.js` | call-site collapse | — | — | weave data resolver |
| `home.js` | — | — | — | journalEntry save action |

---

## 6. Phased rollout — D1 → D2 → D3

### 6.D1 — Polish (Severity restructure + persistent rail + sticky CTA)

**Scope:** G1 (partial — restructure only), G2 (one primary action), G6 (rail + sticky).

**Deliverables:**
- `.sc-rail` left-edge severity strip (rose / amber / sage tokens) on every result card.
- Sticky doctor-CTA footer on emergency cards (CSS `position: sticky; bottom: 0;` within modal scroll container).
- Doctor card hierarchy flipped: phone number primary (large, tappable), name as caption beneath.
- Emergency layout: CTA moves to **top** of result card.

**Out of D1 scope:** content rewrite, DO-NOT callouts, numbered sequences, triage, weave, voice, share, save.

**Build size:** ~1 PR, CSS-only + minor JS reshuffle for emergency CTA position. ~3–5 build days.

**Audit chain:** standard Lyra → Maren ‖ Kael → synthesis → Cipher Edict V.

**Shippable payoff:** users immediately feel the severity difference; emergency calls become one-tap from first paint.

### 6.D2 — Severity-driven layout + DO-NOTs + numbered sequences

**Scope:** G1 (full), G3 (progressive disclosure), G4 (DO-NOT callouts), G5 (numbered), G8 (typography pass).

**Deliverables:**
- SYMPTOM_DB shape migration (string → array for `whatToDo`, `precautions`, `emergency`; add `doNot: string[]`).
- Backward-compat render path during migration window.
- Content rewrite for ~22 SYMPTOM_DB entries — **Aurelius authors as a snippet PR co-traveller** (Codex bench notebook → Lyra-build digest).
- Bordered red DO-NOT callout component (CSS class `.sc-donot-callout`).
- Numbered `<ol>` for sequence-critical entries (Fall, Vomiting, High Fever).
- Bulleted `<ul>` for non-sequence sections.
- Progressive disclosure: result card shows severity + title + one-line summary + primary action on first paint; tap to expand body.
- Typography pass per §4.2.

**Out of D2 scope:** triage flow, Lyra-weave, voice, share, save.

**Build size:** ~2 PRs (1 structural, 1 content), ~7–10 build days.

**Audit chain:** Lyra → Maren ‖ Kael → Cipher Edict V × 2 (one per PR). Aurelius content snippets pass through Cipher snippet pipeline.

**Shippable payoff:** the 5-second test now passes. Hard contraindications are unmissable. Emergency sequences are followable under duress.

### 6.D3 — Triage + Lyra-weave + voice + share + promote

**Scope:** G2 (full — triage delivers refined action), G7 (Lyra-weave), G9 (voice), G10 (save / share / track triad).

**Deliverables:**
- Triage data on `triage: true` SYMPTOM_DB entries (initial set: 4 — `crying-fussy`, `not-eating`, `cough-cold`, `fall-injury`).
- Triage flow render: 2-question yes/no chip flow before result card.
- Lyra-weave history micro-card per result, sourcing from existing `feverEpisodes`, `diarrhoeaEpisodes`, `vomitingEpisodes`, `coldEpisodes`, `careTickets`, `sleepData`.
- Voice input affordance (browser SpeechRecognition; graceful degrade).
- Footer triad: Save / Share / Track.
- Symptom → CareTicket promotion flow (when severity ≥ warning and no matching active episode exists).

**Out of D3 scope:** none — this is the terminal vision phase.

**Build size:** ~3 PRs minimum (triage + weave structural, voice + footer, promote flow), ~3 weeks.

**Audit chain:** Lyra → Maren ‖ Kael ‖ (Kael additional pass for ISL hook into weave) → Cipher Edict V × 3. Possible Consul advisory if any pattern from this work warrants global-canon promotion.

**Shippable payoff:** Symptom Checker becomes the **Weaver remit realised**. Patent-claim-grade differentiator. Symptom moments flow into the broader SproutLab data graph naturally.

---

## 7. Cross-cutting concerns

### 7.1 Accessibility (Maren-jurisdiction sensitive)

- All triage chips: `<button>` elements with `aria-pressed`, not `<div>` (canon-cc-022 fallout).
- Severity rail: decorative, `aria-hidden="true"`.
- DO-NOT callout: `role="alert"` on emergency severity only (don't spam screen-reader on mild).
- Sticky CTA: must not trap focus when keyboard-navigated past.
- Voice button: clearly labelled `aria-label="Speak your symptom"`.
- Progressive disclosure: expandable sections use `<details>` / `<summary>` with `aria-expanded` mirrored.

### 7.2 Performance

- The modal is rendered on-demand. No pre-paint cost.
- Lyra-weave history queries are O(n) over existing in-memory arrays — no Firestore round-trip required for the micro-card. Acceptable.
- Voice input lazy-loads the SpeechRecognition API only on mic-button tap.

### 7.3 Build-system implications

No new modules. All work fits within the existing 11-module split. `data.js`, `medical.js`, `intelligence.js`, `template.html`, `styles.css` all touched; concat order respected.

### 7.4 Sync (Kael-jurisdiction)

- `journalEntry` save (G10) writes into existing `journal` data, already Firestore-synced.
- Symptom → episode promotion uses existing episode-creation paths, already synced.
- No new sync surfaces introduced. Crash circuit breaker semantics unchanged.

### 7.5 Internationalisation (out of scope, but noted)

All copy currently English. SproutLab is single-locale today. Any future i18n work would treat SYMPTOM_DB strings as translation keys; this spec does not pre-empt that work.

---

## 8. HR-by-HR audit (this vision spec)

| HR | Status | Evidence |
|---|---|---|
| HR-1 | Reinforced | Every new sprite (`zi-mic`, `zi-share`, `zi-save`, `zi-no-entry`, `zi-question`) lands as zi() sprite, never raw emoji. |
| HR-2 | Reinforced | All new colour / spacing / border via tokens. §4.1 explicitly token-maps severity. |
| HR-3 | Reinforced | All new actions (triage chips, footer triad, voice mic) use `data-action` delegation. |
| HR-4 | Reinforced | Triage question text, SYMPTOM_DB body content all routed through `escHtml()`. Voice input transcript treated as user input — escaped before render. |
| HR-5 | Reinforced | Token-driven spacing across new layouts. |
| HR-6 | Reinforced (HR-3 cross-ref) | |
| HR-7 | Reinforced | All sprite usage via `innerHTML` with `zi()` return value. |
| HR-8 | N/A | Symptom Checker is not a stub. |
| HR-9 | Reinforced | Each phase spec triggers full Governor + Cipher audit chain. |
| HR-10 | Reinforced | No ellipsis introduced; progressive disclosure uses full expand/collapse, never truncate. |
| HR-11 | N/A | No currency. |
| HR-12 | N/A | No date construction (history micro-card uses existing `formatDate()` helper). |

---

## 9. Audit chain (canon-cc-008) for THIS vision spec

```
[1] Lyra      → drafts this vision (DONE — this file)
[2] Maren     → audits the parental-safety brief:
                · §2 G-principles soundness against Care lens
                · §3.1 emergency layout adequacy (CALL CTA, DO-NOT callouts)
                · §3.2 triage flow correctness (Maren reviews the triageQuestions content per-entry in D3 build spec)
                · §5 data shape migration risk to existing data (backward-compat sufficient?)
                · §7.1 a11y posture
[3] Kael      → audits the architectural brief:
                · §3.3 Lyra-weave data sourcing — ISL hook design soundness
                · §5 SYMPTOM_DB shape migration — Kael owns data.js
                · §7.4 sync surface delta (none expected; confirm)
                · §4.3 sprite additions (template.html shared module — Kael's review territory)
                · §6 phase rollout sequencing — Kael's call on whether D2 can land before D3 weave is specced in detail
[4] Lyra      → synthesises both Governor reports; folds amendments into v2 of this vision
[5] Cipher    → Edict V cross-cut on the vision-spec STRUCTURE (not impl):
                · phase-spec hand-off contract integrity (each Dn references this vision)
                · HR matrix completeness (§8)
                · Any global-canon promotion candidates (e.g. "vision spec precedes phase specs" as new methodology pattern)
[6] Sovereign → ratifies the vision OR redirects scope. Phase specs open AFTER ratification.
```

**Per-phase audit chains** (D1, D2, D3) run independently as each phase-spec opens. This vision spec is the umbrella; phase specs are the work units.

---

## 10. Open questions for Sovereign (vision-level)

| ID | Question | Default | Blocks |
|---|---|---|---|
| V1 | Phase ordering: D1 → D2 → D3 (current) vs D1 → D3-content → D2 (front-load Lyra-weave because it's the differentiator)? | D1 → D2 → D3 (per Sovereign 2026-05-11 statement) | D2 spec opening |
| V2 | Aurelius content-rewrite for ~22 SYMPTOM_DB entries (D2): Codex snippet PR co-travelling with the D2 structural PR, or separate PR before D2? | Co-traveller | D2 spec opening |
| V3 | Maren co-author vs audit-only on D2 / D3 (deferred 2026-05-11)? | Decide per phase-spec opening | D2 spec opening |
| V4 | Symptom → CareTicket promotion (D3): auto-prompt on warning+ severity, or always a parent-tap action? | Parent-tap (Maren-anchored "no auto-actions on safety surface") | D3 spec drafting |
| V5 | Voice input gracefully-degrade fallback (D3): hide button on unsupported browsers, or show with a "voice not supported" tooltip? | Hide silently | D3 spec drafting |
| V6 | DO-NOT callout sprite (D2): repurpose `zi-warn` (existing) or commission `zi-no-entry` (new)? | `zi-no-entry` new — visual distinction matters at the parental-safety surface | D2 sprite additions |

---

## 11. Forward-pointer registry

- **Bridge PR (sproutlab#65):** completes HR-1 + DRY + Crying-badge contrast fix. Precondition to D1.
- **D1 spec:** opens post-bridge merge. Title: `lyra-spec-{date}-symptom-checker-d1-polish.md`.
- **D2 structural spec:** opens post-D1 merge. Title: `lyra-spec-{date}-symptom-checker-d2-structure.md`.
- **D2 content snippet PR (Aurelius):** co-traveller with D2 structural; Codex snippet pipeline.
- **D3 spec(s):** open post-D2 merge. May split into 3 sub-specs (triage / weave / footer-triad) at Lyra's discretion.
- **Doctor-card gating revisit (bridge §9 Q2):** folds into D1 or D2 naturally — the layout restructure makes the gating decision design-driven rather than a standalone question.
- **Crying-badge contrast root-cause investigation (BUGS.md P1):** Maren in bridge audit phase. If H1 confirms, fix lands in bridge build. If H2/H3, fix slips to D1.

---

## 12. Changelog

- **v1 (2026-05-11):** initial vision draft, written immediately after Sovereign mid-spec design call to capture context while fresh. Awaiting Maren + Kael parallel audit, then Cipher Edict V structural pass, then Sovereign ratification.
