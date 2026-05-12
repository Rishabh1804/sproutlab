# Lyra Spec — 2026-05-11 — Symptom Checker UX Vision (D3 → phased D1 → D2 → D3 rollout)

**Author:** Lyra (Builder, The Weaver)
**Mode:** 1 (vision-spec authoring; signed audit-bearing artifact per canon-cc-022)
**Status:** v2.1 — SG-1 amended by Sovereign 2026-05-12 (108 ambulance primary for Jamshedpur locale; 112 unified emergency fallback); Cipher Edict V structural pass after vision ratification
**Branch:** `claude/review-markdown-screenshots-uOIgQ`
**Sibling spec:** `lyra-spec-2026-05-11-symptom-checker-hr1-dry.md` v3 (the bridge — HR-1/DRY/Crying-badge — that precedes any UX work)
**Trigger:** Sovereign mid-spec design call 2026-05-11 — *"As we are working on this surface now, let's make this beautiful and follow some golden design principles which makes readability a breeze, imp info highlighted. Our UX still feels dated with the current 5 second attention span that we are seeing."*

> **v2 changelog (2026-05-12, this revision):** Audit-chain `[4]` Lyra synthesis after Maren `[2]` + Kael `[3]` parallel returns. Substantive additions:
>
> - **G11 NEW** (§2) — voice-register-by-severity (Maren V-M4).
> - **G7 refined** (§2 + §3.3) — weave omits on emergency tier (Maren V-M1 #1).
> - **§3.1.1 emergency layout** — history micro-card removed; primary emergency-services CTA added with `lifeThreat: true` gate; footer triad → Save-only (Maren V-M1 #1/#2/#4). Emergency-services number convention SG-1 **amended 2026-05-12 by Sovereign**: **108 (National Ambulance Service) primary** for Jamshedpur target user; **112 (unified emergency) fallback**. Per-region override capability preserved. Operational locale data → Appendix A NEW.
> - **§3.2 triage** — fever-family added to initial set (SG-2 default Yes); chip-order rule codified (escalating-first); false-negative back-channel; 3-question cap (Maren V-M2).
> - **§3.6 NEW** — Component decomposition strategy: Option A (D1) → Option C (D2+) transition (Kael V-K4).
> - **§4.1** — sage 0.20 → 0.22; Maren contrast-verification step for all 6 severity × theme combos (Maren V-M6 #4).
> - **§4.2 + §4.3** — DO-NOT reinforcements: left-edge border, per-item `zi-no-entry`, `critical: true` rendering at fs-base Nunito 800 (Maren V-M3).
> - **§4.4 motion budget refined** — concurrent-vs-sequential definition; per-tier caps; `prefers-reduced-motion: reduce` override (Kael V-K5 + Maren V-M6 #3).
> - **§5.1** — SYMPTOM_DB adds `lifeThreat: boolean`, `doNot: [{text, critical?}]`.
> - **§5.2** — shim-ordering build-rule codified: "shim lands strictly before content; shim removal never in D2/D3" (Kael V-K2 + Maren V-M7).
> - **§5.3** — per-field safety-impact tags (Maren V-M7).
> - **§6.5 NEW** — Phase contracts: each phase declares DOM/class/scroll-container contracts shipped (Kael V-K3). D1 ships severity-aware doctor-card flip from day one (V-K3 #2 + Maren B-M3 fold from bridge v3).
> - **§6.D2 governance** — Maren content-veto checkpoint inserted between Aurelius snippet PR and Cipher pipeline (Maren V-M5).
> - **§7.1 a11y** — explicit no-aria-live on sticky transition; 44×44 / 60×60 touch-target codification; `prefers-reduced-motion` override.
> - **§8 HR rows** — per-row "operationally, this means…" sentence (Kael V-K6 #2).
> - **§10 Sovereign-gates** — SG-1..SG-6 listed with proposed defaults (folded into v2 pending ratification; Sovereign can amend any without re-running audit chain).
> - **§11** — weave-ISL mini-spec added to forward-pointer registry (Kael V-K1, pending SG-6).

---

## 0. Why this spec exists, and why it's written now

The current Symptom Checker surface fails the 5-second attention test. Sovereign called it during a screenshot review of the HR-1 bridge work. The decision: write the **full vision** while the design context is still in working memory, then implement in three phased PRs (D1 → D2 → D3) so each phase delivers a shippable user-visible payoff and keeps momentum.

This document is the **vision contract**. It is not a build spec. Each of D1, D2, D3 will open its own Lyra Mode-1 build spec referencing this vision; those build specs will get standard Governor audit chains before Mode-2 build.

**Maren's mode for downstream specs:** deferred (Sovereign answer 2026-05-11 Q-Maren). Decision lives in each phase-spec opening. **v2 update:** Maren-veto authority on D2 content surface added per V-M5 (SG-4 default Yes — see §6.D2).

**Sequencing relative to the bridge PR:**

```
[NOW]   sproutlab#65 — HR-1 + DRY + Crying-badge contrast fix          (bridge v3)
          ↓ merges
[NEXT]  Weave-ISL mini-spec   (Kael V-K1 — opens after vision ratification, before D3)
          ↓ ratifies
[THEN1] D1 build PR — Polish: severity restructure + persistent rail + sticky CTA
        + severity-aware doctor-card flip (folded per V-K3 + bridge B-M3)
          ↓ merges
[THEN2] D2 build PR — Severity-driven layout + DO-NOTs + numbered seq
        + Aurelius content rewrite (Maren content-veto gated per V-M5)
          ↓ merges
[FUTURE]D3 build PR(s) — Triage + Lyra-weave (per mini-spec contract) + voice + share + promote
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
| F7 | **No emotional register modulation** | Same matter-of-fact tone for "give Calpol if prescribed" and "Ziva loses consciousness". | Voice should soften for mild, crystallise for emergency. Currently uniform. (Codified as **G11** in v2.) |
| F8 | **No triage flow** for ambiguous symptoms | "Crying a lot" → one generic match. The real question is *"is this normal fussiness or something serious?"* which is a 2-question yes/no triage. | Generic content can't replace a triage tree. We're failing the ambiguous case. |
| F9 | Doctor card has **inverted hierarchy** | Name (medium weight) → call link (smaller, beneath). | The CALL is the action. The name is caption. Flip it. **v2: D1 ships severity-aware flip from day one (per Kael V-K3 #2).** |
| F10 | **No persistent severity rail** | Scroll past the badge into the body → severity signal is gone. | Long content (especially emergency content) needs a visible severity anchor through the scroll. |

---

## 2. The Eleven Golden Principles (G1–G11)

These are the non-negotiable design-system anchors for any Symptom Checker work going forward. Phase-specs reference them; Maren's audit cites them; Cipher's Edict V checks them.

| # | Principle | One-line | HR cross-ref |
|---|---|---|---|
| **G1** | **Severity drives layout, not just colour** | Emergency cards restructure (CTA top, minimal prose); mild cards relax (denser, journal-like). | HR-5 (token spacing) |
| **G2** | **One primary action per state** | Emergency → CALL EMERGENCY SERVICES (lifeThreat) or CALL doctor. Warning → Call doctor (smaller). Mild → Track / Got it. No menus at speed. | HR-3 (data-action) |
| **G3** | **Progressive disclosure** | First paint = severity + 1-line summary + action. Tap to expand body. | — |
| **G4** | **Loud DO-NOTs with critical tier** | Hard contraindications get bordered danger callouts with left-edge red border (per-item `zi-no-entry`), never inline prose. Critical DO-NOTs (medication names, deadly-consequence actions) render at fs-base Nunito 800 with underline/boxed treatment. | HR-1 (`zi-no-entry` sprite), HR-2 (token-driven border) |
| **G5** | **Numbered sequences for time-critical** | Head injury = 5-step ordered sequence. Render as `<ol>`, not prose. | — (data shape change: `whatToDo: string → string[]`) |
| **G6** | **Persistent severity rail + sticky CTA** | Coloured edge-strip carries severity through scroll; call/action sticky at viewport bottom on emergency. Sticky scroll container is the modal scroll, not document. | HR-5 (token-driven) |
| **G7** | **Lyra-weave Ziva context — mild & warning only** | Every mild/warning result includes a 1-line history micro-card from existing episode/CareTicket data. **Emergency variant omits the weave entirely from first paint** (added v2 per Maren V-M1 #1). Reassurance is wrong-tier for the surface; mid-emergency anchor-to-prior-outcome is a documented failure mode. | (Requires ISL hook into Symptom Checker render — Kael-jurisdiction; weave-ISL mini-spec per §11) |
| **G8** | **Typography for triage** | Fraunces serif (calm authority) for titles; Nunito-bold for action verbs; small-caps red for DO-NOTs; generous line-height for body. | HR-5 (font tokens) |
| **G9** | **Voice + chip-first input** | Mic affordance for one-handed parents holding a baby. Type-ahead from chip categories. | HR-2 / HR-3 (no inline; data-action) |
| **G10** | **Save / share / track triad (severity-gated)** | Card footer per severity: emergency = Save only (Save / Share / Track is cognitive distraction in an active emergency); warning + mild = full triad. | HR-3 |
| **G11** | **Voice register modulates by severity** (v2 NEW) | **Mild** = reassuring, journal-tone, second-person warmth, optional-modal verbs ("You can try…"). Sentence length flexible. **Warning** = watchful, instructional, neutral-clear, direct-modal verbs ("Monitor closely. Call if…"). Sentence length ≤15 words. **Emergency** = direct, imperative, no decoration ("Call now. Do not delay."). Sentence length ≤10 words. No softening qualifiers; no "if" clauses except in DO-NOTs. **Mild→warning drift is the higher-risk direction** (over-alarming causes alarm fatigue; under-alarming is per-instance, recoverable). | — (codified content rule for Aurelius D2 rewrite per V-M5 Maren-veto checklist) |

### 2.1 Anti-principles (what NOT to do)

- **Do NOT** add a hospital-blue clinical chrome. The design brief is "cozy nursery journal, not clinical health app." Severity is signalled by **structure + warm-domain accents**, not by clinical aesthetics.
- **Do NOT** use scary iconography. The `zi-siren` sprite is the upper bound. No skull, no biohazard, no flashing.
- **Do NOT** auto-call a doctor (or emergency services) without a tap. Even on emergency, the action requires a deliberate tap. (Maren-jurisdiction insistence.)
- **Do NOT** push past 2 visible results without progressive disclosure. The current `slice(0, 2)` is the upper limit on first paint.
- **Do NOT** modal-stack the Symptom Checker over a Symptom Tracker over a CareTicket prompt. If the user is escalating to a CareTicket, the flow transitions, doesn't pile.
- **Do NOT** show Lyra-weave history on emergency cards (G7 v2 refinement; per Maren V-M1 #1).
- **Do NOT** show Save/Share/Track on emergency cards beyond Save (G10 v2 refinement; per Maren V-M1 #4).
- **Do NOT** invert chip ordering for triage answers — escalating answer renders first, every entry (per Maren V-M2 #2). Per-entry inversion is forbidden.

---

## 3. Information architecture (target state)

### 3.1 Result card — three layout variants

The same result data renders in three different card structures based on `severity`.

**3.1.1 Emergency layout** (`severity === 'emergency'`) — v2 revised

```
┌─────────────────────────────────────────┐
│ ▍ EMERGENCY · [Title]                   │  ← persistent rose rail (G6)
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ ⛑ CALL AMBULANCE · 108              │ │  ← primary CTA on lifeThreat:true (G2, V-M1)
│  │   Or 112 (unified emergency)        │ │     SG-1 amended 2026-05-12 (Jamshedpur locale)
│  └────────────────────────────────────┘ │
│  ☎ Or call Dr. RK Agarwal (pediatrician)│  ← secondary, smaller (V-M1)
│    +91 98351 67975                       │
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
│  ⛔ DO NOT                                │  ← bordered red callout, left-edge 2px (G4)
│  ⊘ Give pain medication                  │  ← per-item zi-no-entry, critical: true
│  ⊘ Let her sleep without checking        │
│                                          │
│  [Save]                                   │  ← Save only on emergency (G10 v2 / V-M1 #4)
└─────────────────────────────────────────┘
```

**Emergency-only layout rules** (v2 codification):

- **No Lyra-weave** — G7 v2: weave omits entirely on emergency tier from first paint (per V-M1 #1; anchor-to-prior-outcome failure mode).
- **No Share, no Track** — G10 v2: footer triad reduces to Save-only (Share/Track are after-action concerns, irrelevant during the active moment per V-M1 #4).
- **Primary CTA on `lifeThreat: true` is the ambulance number** — locale-appropriate per SG-1 (default for Jamshedpur target user, per Sovereign 2026-05-12 amendment: **108 (National Ambulance Service) primary**; **112 (unified emergency) fallback**, exposed as a smaller "Or call 112" link beneath the primary 108 button). Pediatrician CTA is secondary, smaller, beneath the emergency-services block. All three buttons distinct tap targets ≥60×60 CSS px (V-M6 #5). Future per-region override consumes Appendix A's `emergencyContacts.{region}` config table (D2 build scope per §7.5).
- **Sticky CTA padding rule** — modal scroll container must have `padding-bottom ≥ sticky-CTA height` to prevent CTA from covering DO-NOT or emergency-criteria content. D1 phase-spec verification fixture (V-M1 #5).

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
│  If symptoms worsen or you're unsure,    │  ← persistent back-channel callout (V-M2 #3)
│  call your doctor.                        │
│                                          │
│  ── Ziva's history ──                     │  ← Lyra-weave (G7 — present on warning)
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
│  ── Ziva's history ──                     │  ← Lyra-weave (G7 — present on mild)
│  Last similar: Apr 28 · resolved 2d       │
│                                          │
│  If symptoms worsen or you're unsure,    │  ← back-channel callout (V-M2 #3 — present
│  call your doctor.                        │     on triage-derived mild only)
│                                          │
│  [Track]    Dr. RK Agarwal (call if…)     │  ← Track primary; doctor de-emphasised
│                                          │     (D1 ships severity-aware flip — V-K3 #2)
└─────────────────────────────────────────┘
```

### 3.2 Triage flow (v2 expanded)

For SYMPTOM_DB entries flagged `triage: true`, the result card is preceded by a triage tree. **Initial set (v2):** `crying-fussy`, `not-eating`, `cough-cold`, `fall-injury`, **`fever-general`** (added per Maren V-M2 #1, SG-2 default Yes).

```
┌─────────────────────────────────────────┐
│  Excessive Crying / Fussiness            │
│                                          │
│  Did Ziva lose consciousness, even       │   ← copy pattern V-M2: direct, no jargon,
│  briefly?                                 │     yes/no, "even briefly" closes false-neg
│                                          │
│   [ Yes ]   [ No, normal range ]         │   ← chip-order rule: escalating-first (V-M2 #2)
└─────────────────────────────────────────┘
        ↓ Yes               ↓ No
   Emergency card    Mild card with weave + back-channel callout
                     + "← Change my answer" back-link (V-M2 #3)
```

**Triage rules (v2 codified):**

- **Chip-order rule:** "the severity-escalating chip (the answer that maps to higher severity) renders first (left in LTR; top in stacked layout)." Per-entry inversion is forbidden (per V-M2 #2 + anti-principle in §2.1).
- **Triage cap:** entries needing >3 questions split into sub-entries with distinct `id`s. Decision tree under stress is a failure mode (decision fatigue) (per V-M2 #4).
- **False-negative back-channel:** every triage-derived mild/warning result MUST include (a) a persistent "If symptoms worsen or you're unsure, call your doctor" callout at same visual weight as DO-NOT callout pattern, AND (b) a "← Change my answer" back-link to re-enter the triage tree without retyping (per V-M2 #3).
- **Fever-family initial entry** (V-M2 #1, SG-2): `fever-general` triage with questions: (a) "Is the baby under 3 months with any fever?" → yes=emergency. (b) "Is the temperature above 102°F / 39°C and not responding to medication?" → yes=warning. (c) "Is the baby unresponsive, lethargic, or having a seizure?" → yes=emergency. Multiple yes paths → emergency precedence.

Triage uses chip-style binary buttons, not radio buttons. Each `triage: true` entry carries a `triageQuestions: [{q, yesSeverity, noSeverity}]` shape in SYMPTOM_DB (data shape change, see §5.3).

### 3.3 Lyra-weave history micro-card (G7 — v2 refined)

For each **mild and warning** result, attempt to source a relevant Ziva-history snippet from existing data. **Emergency tier omits the weave entirely** (G7 v2 / V-M1 #1).

| Symptom keyword family | Data source | Snippet shape |
|---|---|---|
| fever* | `feverEpisodes[]` | "Last fever: {date} · resolved in {days}d · peak {peakF}°F" |
| diarrhoea* | `diarrhoeaEpisodes[]` | "Last episode: {date} · {duration}" |
| vomit* | `vomitingEpisodes[]` | "Last episode: {date}" |
| cough/cold* | `coldEpisodes[]` | "Last cold: {date} · resolved in {days}d" |
| fall/head | `careTickets[]` filtered `category === 'injury'` | "Last fall: {date} · no consequences" |
| rash, eczema | `careTickets[]` filtered `category === 'skin'` | "Skin concern: {date} · {status}" |
| sleep | `sleepData` last 7-day delta | "Sleep avg this week: {h}h{m}m · {delta vs 14d}" |
| **emergency-tier (any keyword family)** | **— (G7 v2 omit)** | **micro-card omitted from emergency card render** |
| (none) | — | omit micro-card silently |

The micro-card is **omitted entirely** if no data is available — no "No history available" placeholder. Empty is silent.

**Forward-pointer:** ISL contract for the weave hook is specced in the **weave-ISL mini-spec** (§11 forward-pointer; opens after vision-spec ratification, before D3 phase-spec — per Kael V-K1).

### 3.4 Save / Share / Track footer (G10 — v2 with per-severity visibility)

| Affordance | Behavior | Visibility by severity |
|---|---|---|
| **Save** | Writes a `journalEntry` with the symptom result + timestamp. Shows in Today So Far. | All tiers (emergency / warning / mild) |
| **Share** | Opens native share sheet with formatted text: "Symptom check for Ziva ({age}): {title} — {severity}. Guidance: …" | warning + mild only (hidden on emergency per V-M1 #4) |
| **Track** | Promotes the symptom to an episode (fever/diarrhoea/vomiting/cold) OR opens a CareTicket draft. Reuses existing `startFeverEpisode` / CareTicket creation flows. | warning + mild only (hidden on emergency per V-M1 #4) |

### 3.5 Voice input (G9)

Adjacent to the chip row, a mic-icon button (`zi-mic` — new sprite needed) opens the browser's SpeechRecognition API (where available). Transcribes into the `homeSymptomInput` field; the user reviews and taps Check. Voice is an affordance, not a hard requirement; graceful no-op on unsupported browsers.

### 3.6 Component decomposition strategy (v2 NEW — Kael V-K4)

**Trajectory:**

- **D1 — Option A** (single component with severity branching). D1 deliverables are limited (rail, sticky CTA, severity-aware doctor flip). Variants are mostly identical; single function with severity branches keeps complexity proportional.
- **D2 — transition to Option C** (shared primitives + thin variant components). D2 adds DO-NOT callouts, numbered sequences, progressive disclosure — multiple shared primitives across variants. Extract them at the D2 boundary.
- **D3 — maintain Option C.** Add weave (per weave-ISL mini-spec contract) and footer triad as new primitives.

**Severity-decision location:** lives at the **caller** (`_renderSymptomCheckerResults` iterates over matches; per-match selects variant based on `match.severity`). Variant renderer does not re-derive severity. Single source.

**Primitive-extraction policy** (codified): a primitive emerges when (1) ≥2 variants use it, AND (2) implementation is non-trivial (>~5 LOC), AND (3) API surface is stable (no expected per-variant signature drift in next phase). Premature extraction is forbidden.

---

## 4. Visual design language

### 4.1 Colour mapping (per severity) — v2 revised

| Severity | Domain | Rail token | Background tint | Border tint | Badge bg / text |
|---|---|---|---|---|---|
| emergency | rose | `--rose-deep` | `rgba(rose, 0.06)` (dark) / `rgba(rose, 0.08)` (light) | `rgba(rose, 0.3)` | `rgba(rose, 0.18)` / `--rose-deep` |
| warning | amber | `--amber-deep` | `rgba(amber, 0.06)` (dark) / `rgba(amber, 0.08)` (light) | `rgba(amber, 0.25)` | `rgba(amber, 0.20)` / `--amber-deep` |
| mild | sage | `--sage-deep` | `rgba(sage, 0.05)` (dark) / `rgba(sage, 0.06)` (light) | `rgba(sage, 0.20)` | **`rgba(sage, 0.22)` (dark)** / `rgba(sage, 0.10)` (light) / **`--tc-sage-light` (dark)** / `--tc-sage` (light) |

**v2 updates to mild badge** (per Maren V-M6 #4 + bridge B-M1):
- Dark-mode mild opacity bumped `0.20 → 0.22` for safety margin against capture-condition variance.
- Dark-mode foreground shifts from `--tc-sage` to `--tc-sage-light` (commission token if missing).
- Light-mode `.sc-mild .sc-sev-badge` re-verified at WCAG-AA; bump opacity to `0.22` parallel if <4.5:1.

**Maren contrast-verification fixture** (v2 NEW — V-M6 #4 + V-M6 #5):

> Before D1 ships: compute and verify every severity × theme combo (6 combos: emergency/warning/mild × light/dark) against WCAG-AA 4.5:1 minimum. Evidence committed to D1 phase-spec verification fixture. **D1 cannot ship without this.** High-risk row: **warning amber** (amber-on-amber traditionally weaker contrast than rose-on-rose because of where amber sits on the luminance curve).

### 4.2 Typography hierarchy — v2 augmented

```
Title              Fraunces 600 · fs-xl  · lh-1.2   (calm serif authority)
Severity label     Nunito 700  · fs-xs  · uppercase letter-spacing-wide
Section header     Nunito 700  · fs-sm  · uppercase letter-spacing-wide
Body text          Nunito 400  · fs-base · lh-relaxed
Action verb (1st)  Nunito 700  · fs-base · lh-relaxed
DO-NOT label       Nunito 800  · fs-xs  · uppercase · --rose-deep
DO-NOT body        Nunito 500  · fs-sm  · lh-relaxed · --rose-deep on tinted bg
Critical DO-NOT    Nunito 800  · fs-base · --rose-deep · underline OR boxed treatment
                   (v2 NEW — V-M3 #3; applies to DO-NOTs flagged critical: true)
CTA button text    Nunito 700  · fs-md  · letter-spacing-wide
History micro-card Nunito 500  · fs-xs  · --light · italic
Back-channel call  Nunito 600  · fs-sm  · --rose-deep on rose-tinted bg
                   (v2 NEW — V-M2 #3 "If symptoms worsen…" callout, same visual weight
                   as DO-NOT callout pattern)
```

### 4.3 Sprite additions required across all phases

| Sprite | Used in | Phase |
|---|---|---|
| `zi-phone` | Doctor card, emergency CTA | bridge PR (already specced) |
| `zi-emergency` (or repurpose `zi-siren`) | Primary emergency-services CTA prefix | D1 if `lifeThreat` rendering lands in D1; else D2 |
| `zi-mic` | Voice input affordance | D3 |
| `zi-share` | Footer share | D3 |
| `zi-save` | Footer save | D3 (may reuse existing `zi-note` or `zi-bookmark` — TBD) |
| `zi-no-entry` | **DO-NOT callout header + per-item prefix** (v2 — V-M3 #2: each DO-NOT bullet gets `zi-no-entry` prefix, not generic `•`) | D2 |
| `zi-question` | Triage flow header | D3 |
| `zi-back` (or repurpose `zi-chevron-left`) | Triage "← Change my answer" back-link | D3 |

All sprites added to `template.html` in their respective phase's spec.

### 4.4 Motion / micro-interactions — v2 refined (Kael V-K5 + Maren V-M6 #3)

**Motion budget definition** (v2 — replaces prior loose budget):

```
Motion budget (per severity tier):

· Mild:      total concurrent-animation duration on any .sc-result.sc-mild
             element-tree node MUST equal 0ms.

· Warning:   ≤200ms cumulative on any single element transition.
             Concurrent animations across the result-card subtree:
             max single duration counts, not sum.

· Emergency: ≤200ms for non-pulse entrance motion (rail fade, slide-in).
             + Reserved budget: pulse-glow 1.5s, runs once on first paint
               then steady-state. Counted as a separate "attention-draw"
               budget tier, not subject to the 200ms cap.

· Weave-card entrance: at most one ≤200ms entrance animation per result
             view. Enforced structurally by the renderer template
             (single ${weaveHtml} slot; see weave-ISL mini-spec).

· prefers-reduced-motion: reduce — all entrance animations disabled
             (instant present); pulse-glow replaced with steady-state on
             emergency rail; triage slide-in replaced with fade or no
             animation. Vestibular-sensitive parents on dark mode at 2am
             are real and disproportionately the ones up at 2am.
```

**Specific animations (unchanged from v1):**
- Severity rail **fades in** over 200ms on result paint (rose pulse-glow on emergency for 1.5s, then steady).
- Triage Y/N tap → result card slides in from below (250ms ease-out).
- DO-NOT callouts: no animation, instant present (deliberately stoic).
- Sticky CTA: shadow-grows on scroll past 100px to signal it's pinned.

**Enforcement** (Kael V-K5): **manual review at Cipher Edict V**, per-phase CSS additions. Edict V checklist item per phase that ships CSS:

```
Motion-budget audit (Cipher Edict V, per phase):
· enumerate every transition:/animation: rule introduced in this phase
· sum max(duration) per selector path
· confirm cumulative ≤200ms for non-emergency entrance motion
· confirm 1.5s pulse-glow exists only on .sc-result.sc-emergency
· confirm prefers-reduced-motion: reduce override exists for every
  animated rule (Care-jurisdiction cross-cut)
```

Lint or runtime guard rejected — over-engineered for SproutLab's CSS-author-by-hand workflow. The "≤1 weave-card entrance" rule is **structurally enforced** by the renderer template shape (single `${weaveHtml}` slot, see weave-ISL mini-spec).

---

## 5. Data shape changes required

### 5.1 SYMPTOM_DB (`data.js:3308+`) — phase D2 + D3 (v2 expanded)

```js
{
  id: 'fall-injury',
  keywords: [...],
  severity: 'emergency',
  lifeThreat: true,            // v2 NEW (V-M1 #2): drives primary CALL EMERGENCY SERVICES CTA
                               //                   on emergency entries whose criteria include
                               //                   loss of consciousness, seizure, not breathing,
                               //                   unresponsive, unequal pupils, etc.
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

  // D2: per-item shape with critical flag (v2 — V-M3 #3)
  doNot: [
    { text: 'Give pain medication without doctor advice', critical: true },   // medication name → critical
    { text: 'Let her sleep without 2-hour checks', critical: false }
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

  // D3: triage flow (max 3 questions per V-M2 #4)
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

**Maren-veto default** (V-M3 #3): **any DO-NOT involving a medication name is `critical: true`** unless explicitly justified otherwise in the entry. No exceptions on the medication line.

### 5.2 Migration plan — v2 with codified build-rules

- **Bridge PR:** no data shape change. Crying-badge contrast fix is CSS-only.
- **D1:** no data shape change. Layout-CSS-only + severity-aware doctor-card flip (V-K3 #2) from day one.
- **D2:** SYMPTOM_DB shape migration. Backward-compat: render path detects `typeof whatToDo === 'string'` and renders as single-item array. Aurelius authors the numbered/bulleted rewrite of all ~22 entries as a content snippet PR co-traveller. **Maren content-veto gate inserted between Aurelius snippet PR and Cipher pipeline acceptance** (V-M5; see §6.D2 audit chain).
- **D3:** Add `triage`, `triageQuestions`, `weaveSource`, `lifeThreat` fields. Optional — entries without `triage: true` skip the triage flow entirely. (Note: `lifeThreat` may opportunistically ship in D1 if emergency-services CTA is in D1 scope — see §6.D1.)

**v2 codified build-rules (per Kael V-K2 + Maren V-M7):**

```
Migration build-rule 1 — shim ordering:
   D2-shim PR ships strictly BEFORE D2-content PR. Content PR never lands
   without shim already in prod. Order non-negotiable.

Migration build-rule 2 — shim removal:
   Shim removal NEVER lands in D2 or D3. Defer to a future cleanup PR
   after telemetry confirms 0 string-shape entries remain (≥4 weeks).
   Cipher Edict V re-pass required before shim removal.

Migration build-rule 3 — atomic-PR-per-phase:
   Each phase ships as a single mergeable unit. No phase boundary leaves
   a partial state in main. Mitigates D1+D2 partial-state rollback risk
   (V-K3 #2).

Pre-shim-removal verification fixture (in future cleanup PR):
   grep -cE "whatToDo: '|precautions: '|emergency: '" split/data.js
   MUST equal 0. Same for any other migrated field.
```

### 5.3 Affected files + per-field safety-impact (v2 — Maren V-M7)

| File | Bridge | D1 | D2 | D3 |
|---|---|---|---|---|
| `template.html` | + `zi-phone` | severity-aware doctor-card flip (no sprite delta) | + `zi-no-entry` | + `zi-mic` + `zi-share` + `zi-save` + `zi-question` + `zi-back` |
| `styles.css` | (Crying-badge dark fix per bridge v3) | severity rail, sticky CTA, restructure tokens, contrast-verification fixture | DO-NOT callout (left-edge border), numbered list, typography pass (incl. critical-DO-NOT rendering), back-channel callout | triage chips, weave micro-card, footer triad (severity-gated), voice mic |
| `data.js` | — | — | SYMPTOM_DB shape migration (~22 entries) + `lifeThreat` flag on emergency entries meeting criteria | + triage data per entry; `weaveSource` per entry |
| `medical.js` | DRY consolidation | `_renderSymptomCheckerResults` restructure (Option A) | severity-aware layout fork → primitive extraction (Option A → C transition per §3.6) | weave hook + triage flow + footer actions; consume weave-ISL mini-spec contract |
| `intelligence.js` | call-site collapse | — | — | weave data resolver (location per weave-ISL mini-spec — likely new `weave.js` module per Kael V-K1) |
| `home.js` | — | — | — | journalEntry save action |

**Per-field safety-impact (V-M7):**

| Field | Phase | Change shape | Safety-impact |
|---|---|---|---|
| `id`, `keywords`, `severity`, `title`, `callDoctor` | (unchanged) | none | n/a (would be safety-critical if touched) |
| `lifeThreat` | D2 (or D1 opportunistic) | new `boolean` | **Safety-critical** — drives primary CTA selection on emergency. Missing on a true-emergency entry = parent calls pediatrician instead of emergency services. |
| `whatToDo` | D2 | `string → string[]` | **Safety-critical** — action sequence parent follows. Loss = action gap = parental-safety failure. |
| `precautions` | D2 | `string → string[]` | **Safety-critical** — what to watch for. Loss = under-classification risk. |
| `emergency` | D2 | `string → string[]` | **Safety-critical** — emergency-recognition criteria. Loss = false-negative on emergency triage. |
| `doNot` | D2 | new `[{text, critical?}]` | **Safety-critical — the most safety-critical field in the schema.** Contraindications are deadlier than missing action steps. |
| `triage` | D3 | new `boolean` | **Safety-critical** — missing on an entry that should have triage = false-negative on the triage flow. |
| `triageQuestions` | D3 | new `[{q, yesSeverity, noSeverity}]` | **Safety-critical** — question copy and severity mapping carry the parent's triage decision. Maren-veto per question. |
| `weaveSource` | D3 | new `string` (optional) | **Informational** — drives history micro-card. Missing = silent omit. No safety impact. |
| (D2 dual-read shim: `typeof whatToDo === 'string'` → render as single-item array) | D2 | runtime detect | **Safety-critical** — shim removal timing is the single biggest migration risk. Build-rules 2 + 3 above mitigate. |

---

## 6. Phased rollout — D1 → D2 → D3 (v2 augmented)

### 6.D1 — Polish (Severity restructure + persistent rail + sticky CTA + severity-aware doctor-card)

**Scope:** G1 (partial — restructure only), G2 (one primary action), G6 (rail + sticky), G7 (no weave touched), G11 partial (voice register applies only where copy changes, which is minimal in D1).

**Deliverables (v2 expanded):**
- `.sc-rail` left-edge severity strip (rose / amber / sage tokens) on every result card.
- Sticky doctor-CTA footer on emergency cards (CSS `position: sticky; bottom: 0;` within modal scroll container). **Sticky-CTA padding rule:** modal scroll container `padding-bottom ≥ sticky-CTA height` (V-M1 #5).
- **Severity-aware doctor-card hierarchy** (V-K3 #2 + bridge B-M3): phone number primary, name as caption beneath on emergency; mid-card softer on warning; de-emphasised below Track on mild. **Ships from day one — no unconditional flip then re-differentiation.**
- **Doctor-card gating** folded into D1 (bridge B-M3 tightening): card renders iff `hasEmergency || some entry.callDoctor === true`; gating logic unchanged from bridge but the visual treatment becomes severity-aware in this phase.
- Emergency layout: CTA moves to **top** of result card.
- Contrast-verification fixture for all 6 severity × theme combos (V-M6 #4) — **D1 cannot ship without this**.
- `prefers-reduced-motion: reduce` override on all D1-introduced animations (V-M6 #3).
- Touch-target codification: all interactive elements ≥44×44 CSS px; emergency primary CTA ≥60×60 CSS px (V-M6 #5).
- `lifeThreat` rendering for emergency-services CTA: opportunistic for D1 if scope allows; else slips to D2 (Sovereign call at D1 phase-spec opening).

**Out of D1 scope:** content rewrite, DO-NOT callouts, numbered sequences, triage, weave, voice, share, save (other than existing).

**Build size:** ~1 PR, CSS-only + minor JS reshuffle for emergency CTA position + severity-aware doctor-card branching. ~3–5 build days.

**Audit chain:** standard Lyra → Maren ‖ Kael → synthesis → Cipher Edict V (+ motion-budget audit step per §4.4).

**Shippable payoff:** users immediately feel the severity difference; emergency calls become one-tap from first paint; mild surfaces stop visually escalating themselves through doctor-card weight.

### 6.D2 — Severity-driven layout + DO-NOTs + numbered sequences (v2 augmented)

**Scope:** G1 (full), G3 (progressive disclosure), G4 (DO-NOT callouts with critical tier), G5 (numbered), G8 (typography pass), G10 (severity-gated visibility), G11 (full — Aurelius content rewrite per voice register).

**Deliverables:**
- SYMPTOM_DB shape migration (string → array for `whatToDo`, `precautions`, `emergency`; add `doNot: [{text, critical?}]`; add `lifeThreat: boolean` if not in D1).
- **Shim ships strictly before content** (Build-rule 1 per §5.2).
- Backward-compat render path during migration window.
- Content rewrite for ~22 SYMPTOM_DB entries — **Aurelius authors as a snippet PR co-traveller** (Codex bench notebook → Lyra-build digest).
- Bordered red DO-NOT callout component (CSS class `.sc-donot-callout`) with **2px solid `--rose-deep` left-edge border** + per-item `zi-no-entry` prefix (not generic `•`) per V-M3 #1/#2.
- Critical-DO-NOT rendering at fs-base Nunito 800 (V-M3 #3).
- Numbered `<ol>` for sequence-critical entries (Fall, Vomiting, High Fever).
- Bulleted `<ul>` for non-sequence sections.
- Progressive disclosure: result card shows severity + title + one-line summary + primary action on first paint; tap to expand body.
- Typography pass per §4.2.
- Footer-triad severity-gating implementation (Save-only on emergency).
- Back-channel callout pattern (V-M2 #3) for triage-derived mild/warning results.
- **Option A → C component decomposition transition** (per §3.6 + V-K4).

**Out of D2 scope:** triage flow (data shape lands D2; render lands D3 to consume the dual-shipped Maren-veto'd content), Lyra-weave, voice, share, save.

**Build size:** ~2 PRs (1 structural, 1 content), ~7–10 build days.

**Audit chain (v2 — Maren content-veto inserted per V-M5):**

```
[1] Lyra        → drafts D2 phase-spec (references this vision §6.D2)
[2] Maren ‖ Kael → audit D2 phase-spec
[3] Lyra        → synthesises; v2 of D2 phase-spec
[4] Sovereign   → ratifies D2 phase-spec
[5] Aurelius    → drafts content snippet PR (22 entries: whatToDo,
                  precautions, emergency, doNot arrays)
[6] Maren       → CONTENT-REVIEW GATE  ←← INSERTED HERE per V-M5
                · reads every entry as a 2am parent
                · confirms voice register matches severity tier (G11)
                · confirms DO-NOT critical-flagging per-item (V-M3 #3)
                · confirms no medication dosing advice (Care-jurisdictional limit)
                · confirms no "should be fine" / "usually nothing"
                  under-classification language
                · confirms no advice that overrides clinician judgment
                · iterations with Aurelius until clear
                · explicit sign-off required to proceed
[7] Cipher      → snippet pipeline structural pass
[8] Lyra        → builds D2 structural PR + merges snippet PR
[9] Cipher      → Edict V × 2 (structural + content) + motion-budget audit
```

**Maren-veto content checklist (per entry, ~30 min total for 22 entries):**
- Voice register matches severity tier (G11).
- Every DO-NOT correctly tagged `critical: true` if it involves a medication name or a deadly-consequence action.
- No dosing instructions ("give 2.5ml of Calpol every 6h" → no; "as prescribed by your doctor" → yes).
- No under-classification phrases ("nothing to worry about", "should be fine on its own") on warning or emergency tiers.
- No alarmist phrases ("could be life-threatening") on mild tier.
- Triage-derived mild/warning results include the "If symptoms worsen, call your doctor" back-channel callout (V-M2 #3).
- Emergency entries: no decoration, no qualifying language. Imperative only (G11).

**Shippable payoff:** the 5-second test now passes. Hard contraindications are unmissable. Emergency sequences are followable under duress. Voice register stops drifting across tiers.

### 6.D3 — Triage + Lyra-weave + voice + share + promote (v2 augmented)

**Scope:** G2 (full — triage delivers refined action), G7 (Lyra-weave on mild/warning), G9 (voice), G10 (save / share / track triad on non-emergency tiers).

**Deliverables:**
- **Triage data on `triage: true` SYMPTOM_DB entries** (initial set: 5 — `crying-fussy`, `not-eating`, `cough-cold`, `fall-injury`, **`fever-general`**).
- Triage flow render: 2-question yes/no chip flow before result card (cap 3 per V-M2 #4).
- Chip-order rule enforcement (escalating-first per V-M2 #2).
- False-negative back-channel: "← Change my answer" back-link on every triage-derived result.
- **Lyra-weave history micro-card** per result (mild/warning only per G7 v2). **Consumes weave-ISL mini-spec contract** (see §11 forward-pointer; mini-spec ratifies BEFORE this phase opens).
- Voice input affordance (browser SpeechRecognition; graceful degrade).
- Footer triad: Save / Share / Track on warning + mild only (Save-only on emergency per V-M1 #4 + G10 v2).
- Symptom → CareTicket promotion flow (when severity ≥ warning and no matching active episode exists).

**Out of D3 scope:** none — this is the terminal vision phase.

**Build size:** ~3 PRs minimum (triage + weave structural, voice + footer, promote flow), ~3 weeks.

**Audit chain:** Lyra → Maren ‖ Kael → Cipher Edict V × 3 (+ motion-budget audit per ship). Maren content-veto extends to triage-question copy. Possible Consul advisory if any pattern from this work warrants global-canon promotion.

**Shippable payoff:** Symptom Checker becomes the **Weaver remit realised**. Patent-claim-grade differentiator. Symptom moments flow into the broader SproutLab data graph naturally.

### 6.5 Phase contracts (v2 NEW — Kael V-K3)

Each phase declares the DOM contracts / class-name contracts / scroll-container assumptions it ships that downstream phases inherit. Cipher Edict V form-pass verifies §6.5 phase-contracts section exists per phase; flags any contract not declared.

**§6.5.D1 — Contracts shipped:**
- Class `.sc-rail` with role: severity strip, decorative.
- `.sc-rail` DOM position: first child of `.sc-result.sc-{severity}`.
- Sticky-CTA scroll container: the modal scroll container, not document.
- Doctor-card hierarchy: severity-aware (emergency = CALL primary; warning = call mid-card; mild = de-emphasised below Track).
- Rail scope: result-card only (D3 may extend to triage card via additive rule).
- Touch-target floor: 44×44 CSS px (interactive); 60×60 CSS px (emergency primary CTA).
- `prefers-reduced-motion: reduce` override exists for every animated rule introduced in D1.

**§6.5.D2 — Contracts shipped:**
- SYMPTOM_DB array shape (`whatToDo`, `precautions`, `emergency` as `string[]`; `doNot` as `[{text, critical?}]`).
- Dual-read shim (`typeof === 'string'` fallback) — present until future cleanup PR.
- `lifeThreat: boolean` field on emergency entries meeting life-threat criteria.
- `.sc-donot-callout` component: 2px solid `--rose-deep` left-edge border + tinted bg + per-item `zi-no-entry` prefix.
- Critical-DO-NOT typography: fs-base Nunito 800 with underline/boxed treatment.
- Footer-triad severity-gating: Save-only on emergency; full triad on warning/mild.
- Component decomposition: shared primitives extracted (`renderSeverityRail`, `renderDoctorCardCompact`, `renderDoctorCardPrimary`, `renderFooterTriad(visibilityMask)` per §3.6 V-K4).

**§6.5.D3 — Contracts shipped:**
- `triage: boolean` + `triageQuestions: [{q, yesSeverity, noSeverity}]` fields (optional; entries without skip the flow).
- Triage flow rendering primitives (`renderTriageGate`, chip-order escalating-first).
- `weaveSource: string` field (optional; default infers from keyword family).
- Weave-ISL hook (`resolveSymptomWeave(symptomEntry, childContext): {html, source} | null` per mini-spec).
- Rail scope extended to triage card (additive rule against D1's contract).
- Back-channel callout pattern (`.sc-back-channel`) on triage-derived results.

---

## 7. Cross-cutting concerns

### 7.1 Accessibility (Maren-jurisdiction sensitive) — v2 augmented

- All triage chips: `<button>` elements with `aria-pressed`, not `<div>` (canon-cc-022 fallout).
- Severity rail: decorative, `aria-hidden="true"`.
- DO-NOT callout: `role="alert"` on emergency severity only (don't spam screen-reader on mild).
- Sticky CTA: must not trap focus when keyboard-navigated past. **No `aria-live` announcement on sticky transition** — sticky is visual-only; CTA remains in reading order at its DOM position (v2 — V-M6 #2).
- Voice button: clearly labelled `aria-label="Speak your symptom"`.
- Progressive disclosure: expandable sections use `<details>` / `<summary>` with `aria-expanded` mirrored.
- **Touch-target minimums (v2 — V-M6 #5):** all interactive elements ≥44×44 CSS px (iOS HIG; WCAG 2.2 SC 2.5.8 ≥24×24 floor). Emergency primary CTA ≥60×60 CSS px for thumb-reach under stress. Footer-triad buttons ≥44×44.
- **`prefers-reduced-motion: reduce` override (v2 — V-M6 #3):** all entrance animations disabled; pulse-glow replaced with steady-state; triage slide-in replaced with fade or no animation. Codified in §4.4 motion budget.
- Lyra-weave micro-card: silent-empty when no data (omit entire `── Ziva's history ──` block); SR experience matches visual.

### 7.2 Performance

- The modal is rendered on-demand. No pre-paint cost.
- Lyra-weave history queries are O(n) over existing in-memory arrays — no Firestore round-trip required for the micro-card. Acceptable. (Per Kael V-K1: sub-millisecond on contemporary devices; no cache initially; add only if telemetry post-D3 shows weave resolution >2ms on p95 devices.)
- Voice input lazy-loads the SpeechRecognition API only on mic-button tap.

### 7.3 Build-system implications

No new modules in D1/D2. **D3 may introduce `weave.js`** per weave-ISL mini-spec — Kael's call (concat order: after data.js, before medical.js; or fold into core.js if Cipher prefers). All other work fits within the existing 11-module split. `data.js`, `medical.js`, `intelligence.js`, `template.html`, `styles.css` all touched; concat order respected.

### 7.4 Sync (Kael-jurisdiction)

- `journalEntry` save (G10) writes into existing `journal` data, already Firestore-synced.
- Symptom → episode promotion uses existing episode-creation paths, already synced.
- **SYMPTOM_DB shape migration is static-config-only**, not user-data. Not synced to Firestore (per Kael V-K2). No sync surface delta.
- Weave is **read-only** from existing synced arrays (`feverEpisodes`, `careTickets`, etc.). No sync impact (per Kael V-K1).
- Crash circuit breaker semantics unchanged.

### 7.5 Internationalisation (out of scope, but noted)

All copy currently English. SproutLab is single-locale today. Any future i18n work would treat SYMPTOM_DB strings as translation keys; this spec does not pre-empt that work. **Locale-appropriate ambulance / emergency number (SG-1)** is the single i18n-adjacent decision in this spec. Default for Jamshedpur target user (Sovereign 2026-05-12 amendment): **108 (National Ambulance Service) primary, 112 (unified emergency) fallback** (112 unified India gov standard since 2019; 108 is the direct-to-ambulance route per Sovereign's locale evidence). Operational locale data captured in **Appendix A**. D2 phase-spec implementation surface: `emergencyContacts.{region}` config table holding `{ambulancePrimary, emergencyFallback, hospitals, altAmbulanceServices, label}` per region; default lookup keys to Jamshedpur. Per-region override mechanism: SproutLab settings panel exposing user-region selector (D3 scope).

---

## 8. HR-by-HR audit (this vision spec) — v2 with operational clarifications

| HR | Status | Operationally, this means… (v2 NEW per Kael V-K6 #2) |
|---|---|---|
| HR-1 | Reinforced | Every new sprite (`zi-mic`, `zi-share`, `zi-save`, `zi-no-entry`, `zi-question`, `zi-back`) lands as zi() sprite, never raw emoji. Verified at each phase by `grep -cE '\\u\{1F\|\\u26[0-9A-F]' split/*.js` over Symptom Checker function bodies → MUST equal 0. |
| HR-2 | Reinforced | All new colour / spacing / border via tokens. §4.1 explicitly token-maps severity. No inline `style="…"` introduced; verified at each phase by `grep -n 'style="' split/*.js \| grep -E 'sc-\|symptom\|doctor'` → MUST return 0. |
| HR-3 | Reinforced | All new actions (triage chips, footer triad, voice mic, back-link) use `data-action` delegation. No inline `onclick=`; verified at each phase by `grep -n 'onclick="' split/*.js \| grep -E 'sc-\|symptom\|doctor'` → MUST return 0. |
| HR-4 | Reinforced | Triage question text, SYMPTOM_DB body content all routed through `escHtml()`. Voice input transcript treated as user input — escaped before render. Verified at each phase by manual review of every `${…}` interpolation in `_renderSymptomCheckerResults` and its primitive descendants. |
| HR-5 | Reinforced | Token-driven spacing across new layouts. No hard-coded `px` values for spacing/font/radius; verified at Cipher Edict V per phase. |
| HR-6 | Reinforced (HR-3 cross-ref) | Operationally identical to HR-3 row. |
| HR-7 | Reinforced | All sprite usage via `innerHTML` with `zi()` return value; never via `textContent` or template-literal-without-innerHTML. |
| HR-8 | N/A | Symptom Checker is not a stub. |
| HR-9 | Reinforced | Each phase spec triggers full Governor + Cipher audit chain per canon-cc-008. D2 additionally inserts Maren content-veto gate (V-M5). |
| HR-10 | Reinforced | No ellipsis introduced; progressive disclosure uses full expand/collapse, never truncate. Verified at Cipher Edict V per phase. |
| HR-11 | N/A | No currency. |
| HR-12 | N/A | No date construction (history micro-card uses existing `formatDate()` helper). |

---

## 9. Audit chain (canon-cc-008) for THIS vision spec

```
[1] Lyra      → drafted this vision (DONE — v1 2026-05-11)
[2] Maren     → audited parental-safety brief (DONE 2026-05-12):
                · V-M1: P1 — three emergency-layout findings (weave-omit, lifeThreat
                  emergency-services CTA, footer-triad severity-gating)
                · V-M2: P1 — fever missing from initial triage; chip-order rule;
                  false-negative back-channel; 3-question cap
                · V-M3: direction confirmed; reinforcements (left-edge border,
                  per-item iconography, critical-DO-NOT flag)
                · V-M4: P1 — G11 voice-register-by-severity codification required
                · V-M5: P1 — Maren-veto content checkpoint in D2 phase-spec
                · V-M6: P1 reduced-motion + contrast verification; P2 elsewhere
                · V-M7: P0 — D2 field migrations safety-critical; migration sound
                  iff shim discipline holds
[3] Kael      → audited architectural brief (DONE 2026-05-12):
                · V-K1: P0 — weave-ISL needs own mini-spec before D3 opens
                · V-K2: migration plan sound; codify cut-point ordering rule
                · V-K3: P1 — hidden couplings; need §6.5 phase-contracts section
                · V-K4: A → C decomposition transition at D2; codify in §3.6
                · V-K5: manual review at Edict V; refine §4.4 budget definition
                · V-K6: ~85% Edict-V-ready; predictable form gaps from K1/K3/K4/K5
[4] Lyra      → synthesis (DONE 2026-05-12 — this v2):
                · all P0/P1 folded into this revision (see §10 SG-1..SG-6 for
                  Sovereign-gated decisions; proposed defaults pre-applied)
                · §6.5 NEW (V-K3), §3.6 NEW (V-K4), G11 NEW (V-M4), §4.4 refined
                  (V-K5), §5.2 build-rules codified (V-K2 + V-M7)
                · weave-ISL forward-pointer added §11 (V-K1)
[5] Cipher    → Edict V cross-cut on the vision-spec STRUCTURE (PENDING — not impl):
                · phase-spec hand-off contract integrity (each Dn references vision)
                · HR matrix completeness (§8 — operational sentences now per-row)
                · §6.5 phase-contracts presence per phase
                · §3.6 component-decomposition strategy committed
                · Cross-reference style consistency (§N.M form)
                · Data-binding hints per layout variant (§3.1.1–3.1.3)
                · Single-round pass expected per V-K6 if all v2 folds clean
[6] Sovereign → ratifies the vision OR redirects scope (PENDING):
                · SG-1..SG-6 (proposed defaults pre-applied to v2 body — Sovereign
                  amends in-place if a default is wrong)
                · phase specs open AFTER ratification
                · weave-ISL mini-spec opens between ratification and D3 phase-spec
```

**Per-phase audit chains** (D1, D2, D3) run independently as each phase-spec opens. This vision spec is the umbrella; phase specs are the work units. **D2 adds Maren-veto content-review gate** per V-M5 (§6.D2 audit chain).

---

## 10. Open questions for Sovereign (vision-level) — v2 with Sovereign-gates

| ID | Question | Default | Status / Blocks |
|---|---|---|---|
| V1 | Phase ordering: D1 → D2 → D3 (current) vs D1 → D3-content → D2 (front-load Lyra-weave)? | D1 → D2 → D3 | Resolved per Sovereign 2026-05-11 statement; reinforced by audit chain. |
| V2 | Aurelius content-rewrite for ~22 SYMPTOM_DB entries (D2): Codex snippet PR co-travelling with D2 structural, or separate PR before D2? | Co-traveller (Maren-veto gated per V-M5) | Resolved with Maren-veto checkpoint inserted (§6.D2 audit chain). |
| V3 | Maren co-author vs audit-only on D2 / D3 (deferred 2026-05-11)? | **Maren content-veto on D2/D3 by default; co-author optional at phase-spec opening** (closed per V-M5) | Resolved; lands as SG-4. |
| V4 | Symptom → CareTicket promotion (D3): auto-prompt on warning+ severity, or always parent-tap action? | Parent-tap (Maren-anchored "no auto-actions on safety surface") | Open; resolves at D3 phase-spec opening. |
| V5 | Voice input gracefully-degrade fallback (D3): hide button on unsupported browsers, or show with a "voice not supported" tooltip? | Hide silently | Open; resolves at D3 phase-spec opening. |
| V6 | DO-NOT callout sprite (D2): repurpose `zi-warn` (existing) or commission `zi-no-entry` (new)? | `zi-no-entry` new — visual distinction matters at the parental-safety surface (also used per-item, per V-M3 #2) | Resolved; folded into §4.3. |

**Sovereign-gates (v2 NEW — six decisions pre-applied with proposed defaults; amend in-place if any default is wrong):**

| SG | Source | Question | Proposed default (applied to v2 body) | Effect if amended |
|---|---|---|---|---|
| **SG-1** | V-M1 #3 | Emergency-services number convention | **AMENDED 2026-05-12 by Sovereign** — primary: **108 (National Ambulance Service)** direct ambulance for Jamshedpur target user; fallback: **112 (unified emergency)**; per-region override via SproutLab settings (D3 scope); operational locale data → **Appendix A NEW** | Folded into §3.1.1 ASCII + §3.1.1 emergency-only layout rules + §7.5 i18n note + Appendix A NEW. v2 → v2.1. |
| **SG-2** | V-M2 #5 | Add fever-family to D3 triage initial set (~+1 entry) | **Yes** | §3.2 initial-set list + §6.D3 deliverable count |
| **SG-3** | V-M4 #4 | G11 voice-register codification blocks D2 phase-spec opening | **Yes** | §2 G11 + §6.D2 audit chain (Aurelius rewrite gates on G11) |
| **SG-4** | V-M5 | Maren-veto authority on D2 content — Care-jurisdictional, blocking on Cipher pipeline | **Yes; default Maren content-veto on D2/D3; co-author optional** | §6.D2 audit chain step [6] Maren content-review gate |
| **SG-5** | B-M3 (bridge) | D1 phase-spec opens immediately on bridge merge, with doctor-card gating in D1 scope (not D2) | **Yes** | §6.D1 deliverable list; tight-sequencing rule between bridge merge and D1 opening |
| **SG-6** | V-K1 | Weave-ISL mini-spec lands between vision ratification and D3 phase-spec opening (1-week scope) | **Yes** | §11 forward-pointer; D3 phase-spec consumes mini-spec by reference, not re-derives |

**Amendment protocol:** Sovereign overrides any SG default by stating the override; Lyra revises v2 in-place (single round, no re-audit unless override changes audit-chain shape — e.g. SG-4 = No would require V-M5 re-discussion).

---

## 11. Forward-pointer registry (v2 expanded)

- **Bridge PR (sproutlab#65):** completes HR-1 + DRY + Crying-badge contrast fix. Precondition to D1. **Status (v2): bridge v3 specced; awaiting Sovereign ratification of bridge v3 + this vision v2.**
- **Weave-ISL mini-spec** (v2 NEW — per Kael V-K1, pending SG-6): `lyra-spec-{date}-symptom-checker-weave-isl.md`. Opens between vision ratification `[6]` and D3 phase-spec opening. Scope: ISL contract (`resolveSymptomWeave(symptomEntry, childContext): {html, source} | null`), source-table extensibility rules, ranking algorithm (explicit `weaveSource` > keyword-family match > recency), null-return discipline, cache policy (initial: none; cache only if telemetry shows >2ms p95), fixture matrix (≥7 source families + 1 null-return). Single Lyra audit-chain round.
- **D1 spec:** opens post-bridge merge and post-vision-ratification. Title: `lyra-spec-{date}-symptom-checker-d1-polish.md`. Inherits §6.5.D1 phase contracts.
- **D2 structural spec:** opens post-D1 merge. Title: `lyra-spec-{date}-symptom-checker-d2-structure.md`. Inherits §6.5.D2 phase contracts.
- **D2 content snippet PR (Aurelius):** co-traveller with D2 structural; Codex snippet pipeline; Maren content-veto gate inserted per V-M5.
- **D3 spec(s):** open post-D2 merge AND post-weave-ISL-mini-spec ratification. May split into 3 sub-specs (triage / weave / footer-triad) at Lyra's discretion. Inherits §6.5.D3 phase contracts.
- **Doctor-card gating revisit (bridge §9 Q2):** **closed** — folded into D1 scope explicitly per Maren B-M3 / bridge v3 §0.2.
- **Crying-badge contrast root-cause investigation (BUGS.md P1):** **closed** — Maren B-M1 confirmed H1; fix specced into bridge v3 §0.1 #4. Ships in Mode-2 bridge build.
- **MODULE_MAP v2 improvements** (cross-repo forward-pointer to `Codex/pull/67` Lyra forward-pointers comment): read-path overlay, phase-status dashboard candidate, HR overlay, region-badge drift fix. Aurelius's call on bundling.

---

## 12. Changelog

- **v1 (2026-05-11):** initial vision draft, written immediately after Sovereign mid-spec design call to capture context while fresh. Awaiting Maren + Kael parallel audit, then Cipher Edict V structural pass, then Sovereign ratification.
- **v2 (2026-05-12):** Audit-chain [4] Lyra synthesis after Maren V-M1..V-M7 + Kael V-K1..V-K6 parallel returns. Substantive folds: G11 voice register codified (V-M4); G7 emergency-tier omit refined (V-M1 #1); §3.1.1 emergency layout revised (history micro-card removed, lifeThreat emergency-services primary CTA added, footer triad Save-only); §3.2 triage expanded (fever-family added, chip-order rule, false-negative back-channel, 3-question cap); §3.6 NEW component decomposition strategy (Option A→C at D2 boundary, V-K4); §4.1 contrast bump 0.20→0.22 + verification fixture (V-M6 #4 + bridge B-M1); §4.4 motion budget definition refined with `prefers-reduced-motion` clause (V-K5 + V-M6 #3); §5.1 SYMPTOM_DB adds `lifeThreat` + `doNot` per-item shape (V-M3 #3 + V-M1 #2); §5.2 build-rules codified for shim discipline (V-K2 + V-M7); §5.3 per-field safety-impact tags (V-M7); §6.5 NEW phase contracts per phase (V-K3); §6.D2 audit chain inserts Maren content-veto gate (V-M5); §7.1 a11y augmented with touch-targets + reduced-motion + no-aria-live-on-sticky (V-M6 #2/#3/#5); §8 HR rows operational sentences per-row (V-K6 #2); §10 SG-1..SG-6 Sovereign-gates with proposed defaults pre-applied; §11 weave-ISL mini-spec forward-pointer added (V-K1, pending SG-6). Cipher Edict V structural-pass readiness: single-round expected.

- **v2.1 (2026-05-12):** SG-1 amendment per Sovereign — Jamshedpur locale data folded. Primary emergency-services CTA = **108 (National Ambulance Service)** direct (was: 112 unified). 112 retained as documented fallback ("Or call 112" smaller link beneath primary 108 button). Per-region override capability via SproutLab settings panel preserved (D3 scope). Locale-config surface for `emergencyContacts.{region}` table specced into §7.5 + §5.3. **Appendix A NEW** captures operational Jamshedpur contacts table (ambulance services, hospitals) for D2 build-PR consumption. No other SG amendments; SG-2..SG-6 proposed defaults stand. Affects §3.1.1, §7.5, §10 SG-1 row, header status, top changelog block. Audit chain unchanged: still PENDING Cipher Edict V structural pass `[5]` + Sovereign ratification `[6]`.

---

## Appendix A — Jamshedpur emergency contacts (v2.1 NEW, per Sovereign 2026-05-12)

Operational locale data for the `emergencyContacts.jamshedpur` config table consumed by D2 build-PR implementation of the `lifeThreat: true` CTA. **Spec captures the data; D2 build PR implements the lookup.**

### A.1 Primary CTA targets (lifeThreat rendering)

| Tier | Number | Service | Use case |
|---|---|---|---|
| **Primary** | **108** | National Ambulance Service | Direct-to-ambulance, fastest route to immediate critical care (Sovereign-stated bottom line 2026-05-12) |
| **Fallback** | **112** | Comprehensive Emergency (unified, Indian gov standard since 2019) | Routes via PCR (Police Control Room) to ambulance; use when 108 unreachable or for non-medical emergency overlap |

The `lifeThreat: true` emergency-services CTA renders both: primary 108 button (≥60×60 CSS px tap target, top-of-card prominence per §3.1.1 ASCII); secondary smaller "Or call 112" link beneath.

### A.2 Out-of-scope for Symptom Checker emergency CTA (logged for completeness, not rendered)

These numbers are operationally relevant in a broader parental-emergency context but **do not belong in the Symptom Checker `lifeThreat` CTA** — the surface is medical-emergency-specific and G2 ("one primary action per state") forbids menu-stacking. They land in the broader SproutLab `emergencyContacts` config table for use by other surfaces (e.g. a future general "Emergency" tab) but not by the Symptom Checker CTA renderer:

| Number | Service | Why excluded from SC CTA |
|---|---|---|
| 100 | Police | Non-medical; included for SproutLab-wide config completeness |
| 101 | Fire | Non-medical; same rationale |

### A.3 Alternate ambulance services (Jamshedpur, secondary tier)

For D2 config table reference. **Not rendered in the lifeThreat CTA itself** — these are post-108 fallbacks, surfaced only if the 108 connection fails (D3 scope: failover UI is out of D1/D2). Currently logged for D2 to load into the locale config.

| Service | Number | Notes |
|---|---|---|
| Gouri Shankar Ambulance (Mango) | 9931114901 | Mango-area-specific |
| Medulance (24/7) | +91 88829 78888 | 24/7 private |

### A.4 Hospital reference data (Jamshedpur)

For D2 config table reference. **Not rendered in the lifeThreat CTA** — hospital triage is a downstream decision after ambulance dispatch (the ambulance crew chooses the receiving hospital based on bed availability and case acuity). Logged for use in:
- Doctor card "Or visit a hospital" secondary surface (post-emergency-call context — D3 scope)
- Future "Find a hospital" feature outside the Symptom Checker (out of vision spec scope)

| Hospital | Type | Number | Notes |
|---|---|---|---|
| Tata Main Hospital (TMH) | Emergency / Appointment | 0657 6644444 | Primary tertiary care; appointment/query line |
| MGM Medical College & Hospital | Tertiary / Government | 0657 2360859 | Tertiary care, government-run |
| Elite Hospital (Mango) | General / Multispecialty | 0657 6510307 / 9204622496 | Mango-area-specific; two lines (landline + mobile) |

### A.5 Pediatrician (existing data, unchanged — for reference vs SC doctor-card)

Already rendered by the existing `_scDoctorCardHTML` doctor card, sourced from user's `getPrimaryDoctor()` data. Currently **Dr. RK Agarwal · +91 98351 67975**. Independent of Appendix A's emergency-contacts table; doctor card data flows through `getPrimaryDoctor()` → SproutLab user data, not through `emergencyContacts.{region}`. Listed here only to disambiguate from emergency-services CTA.

### A.6 D2 build-PR config table shape (proposed)

```js
// split/data.js (or split/config.js if Kael prefers separation in D2 phase-spec):
const EMERGENCY_CONTACTS = {
  jamshedpur: {
    label: 'Jamshedpur',
    ambulancePrimary:  { number: '108', service: 'National Ambulance Service' },
    emergencyFallback: { number: '112', service: 'Comprehensive Emergency' },
    altAmbulanceServices: [
      { number: '9931114901',     service: 'Gouri Shankar Ambulance (Mango)' },
      { number: '+91 88829 78888', service: 'Medulance (24/7)' }
    ],
    hospitals: [
      { name: 'Tata Main Hospital (TMH)', number: '0657 6644444' },
      { name: 'MGM Medical College & Hospital', number: '0657 2360859' },
      { name: 'Elite Hospital (Mango)', number: '0657 6510307' }
    ]
  }
  // Future regions added by user-selectable override (D3 scope settings panel).
};

const DEFAULT_REGION = 'jamshedpur';
```

### A.7 Maintenance discipline (v2.1 codified)

This appendix carries operational locale data; emergency numbers change rarely but do change. **Source-of-truth ownership:**
- Numbers in §A.1 / §A.3 / §A.4 update only on Sovereign-confirmed change-of-record evidence (e.g. government gazette, hospital website official update, Sovereign-direct statement).
- Each entry footnotes the **as-of date** of the data point (here: all entries are as-of Sovereign 2026-05-12 statement, except 112 which is Indian-gov standard since 2019).
- Maren-jurisdiction review on any future appendix amendment (parental-safety surface).
- BUGS.md-style entry if any number is reported nonfunctional by a user.

**As-of dates (initial v2.1 set):** all entries 2026-05-12 per Sovereign-direct statement; 112 unified standard 2019.
