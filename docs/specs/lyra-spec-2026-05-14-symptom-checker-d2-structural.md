# Lyra Spec — 2026-05-14 — Symptom Checker D2 Structural (severity-driven layout + DO-NOTs + numbered sequences + lifeThreat)

**Author:** Lyra (Builder, The Weaver)
**Mode:** 1 (spec authoring; signed audit-bearing artifact per canon-cc-022)
**Status:** v1 DRAFT — awaiting Maren ‖ Kael parallel audit, then Lyra synthesis, then Cipher Edict V STRICT, then Sovereign ratification
**Branch:** `claude/d2-phase-spec`
**Parent spec:** `lyra-spec-2026-05-11-symptom-checker-ux-vision.md` v2.1 — this implements §6.D2 + ships §6.5.D2 phase contracts; absorbs `lifeThreat` slipped from D1 per SG-D1-LT default ratified
**Predecessor spec:** `lyra-spec-2026-05-13-symptom-checker-d1-polish.md` v3.1 — Mode-2 build merged 2026-05-14 (PR #69 → main `7dee90d`) + Maren §7 sign-off post hotfix `13140074` (sticky-footer `--blush`). D2 contracts EXTEND D1's §6.5.D1.
**Trigger:** D1 Mode-2 build verified in production 2026-05-14. Per vision §6 phase sequencing, D2 structural spec opens now.

---

## 0. Scope

### 0.1 In-scope — D2-A structural PR

D2 is the **structural** phase: it migrates the SYMPTOM_DB data shape, ships the new DO-NOT / numbered / progressive-disclosure / footer-triad / lifeThreat surfaces, and transitions the renderer from Option A (single helper with severity branches) to Option C (shared primitives + thin variant components) per vision §3.6 V-K4.

Per vision §6.D2 deliverables + §6.5.D2 phase contracts + V-M2/V-M3/V-M5/V-M7/V-K4 folds + SG-D1-LT slip absorbed:

1. **SYMPTOM_DB shape migration** — `whatToDo` / `precautions` / `emergency`: `string → string[]`; new `doNot: [{text, critical?: boolean}]`; new `lifeThreat: boolean` on emergency entries meeting life-threat criteria (per V-M2). Shape change applies to all ~22 entries.
2. **Dual-read shim** — render path detects `typeof field === 'string'` and renders as single-item array. Present until a future cleanup PR (post-telemetry-confirmed). Shim removal **never** in D2 or D3 per vision §5.2 Build-rule 2.
3. **`.sc-donot-callout` component** — bordered red callout with 2px solid `--rose-deep` left-edge border + tinted bg + per-item `zi-no-entry` prefix (NOT generic `•`) per V-M3 #1/#2.
4. **Critical-DO-NOT typography** — DO-NOT items flagged `critical: true` render at `fs-base` Nunito 800 with underline OR boxed treatment per V-M3 #3 + Maren-veto default: any DO-NOT involving a medication name is `critical: true`.
5. **Numbered `<ol>` for sequence-critical** — Fall, Vomiting, High Fever (other entries flagged by Aurelius in the snippet PR + Maren-veto). Order-of-operations carries safety meaning under stress (per G5).
6. **Bulleted `<ul>` for non-sequence sections** — Precautions, WHEN-TO-SEEK-EMERGENCY-CARE criteria, mild-tier WHAT TO DO. Bullets, not prose paragraphs.
7. **Progressive disclosure** — result card shows severity badge + title + 1-line summary + primary action on first paint; `<details>`/`<summary>` for the body expand (G3). First-paint primary-action surface remains touch-target-compliant per D1 §9.
8. **Typography pass** — per vision §4.2: Critical-DO-NOT typography (per #4 above), back-channel callout style, numbered-list digit weight. Validated against §7 contrast-verification fixture.
9. **Footer-triad severity-gating + Save action** — D2 ships the visibility-gating infrastructure (Save-only on emergency; full triad on warning/mild per G10 v2 / V-M1 #4) AND ships the **Save action live** (writes `journalEntry`; flows into Today So Far). Share + Track actions are D3 scope; D2 emits their slots as gated stubs with `data-action` placeholders that no-op until D3 wires them.
10. **Back-channel callout pattern** — `.sc-back-channel` class + persistent "If symptoms worsen or you're unsure, call your doctor" callout (V-M2 #3). D2 ships the component + the class hook on all triage-derivable mild/warning tiers; the "triage-derived" gate ITSELF lands in D3 (D2 renders unconditionally on mild/warning per the V-M2 #3 backstop pattern; D3 will refine to triage-derived-only).
11. **Option A → C component decomposition** — per vision §3.6 + Kael V-K4. Extract `renderSeverityRail`, `renderDoctorCardCompact`, `renderDoctorCardPrimary`, `renderFooterTriad(visibilityMask)`, `renderDoNotCallout(items)`, `renderNumberedSteps(steps)`, `renderBulletedItems(items)` primitives. Variant decisions live at the CALLER (`_renderSymptomCheckerResults` iterates matches, per-match selects variant — see §2.10). Primitive-extraction policy per vision §3.6 codified.
12. **`lifeThreat` rendering** (absorbed from D1 slip per SG-D1-LT default ratified) — for entries with `lifeThreat: true`, emit the primary emergency-services CTA (ambulance number 108 for Jamshedpur default, per vision SG-1 amendment + Appendix A) ABOVE the pediatrician CTA. Pediatrician becomes secondary. Both ≥60×60 CSS px tap targets. NEW `EMERGENCY_CONTACTS.{region}` config table per vision Appendix A.6.
13. **New sprites** — `zi-no-entry` (DO-NOT prefix) + `zi-emergency` (lifeThreat primary CTA prefix; alternative: repurpose `zi-siren` — see SG-D2-EMERGENCY-SPRITE).

### 0.2 In-scope — D2-B content snippet PR (Aurelius co-traveller)

The 22-entry content rewrite. Authored by Aurelius via the Codex snippet pipeline; co-travels with D2-A's Mode-2 PR but lands **after** D2-A merges per Build-rule 1 (§7). Maren content-veto gate inserted between Aurelius and Cipher pipeline (V-M5; §4 audit chain step [8]).

Per-entry fields populated:
- `whatToDo: string[]` (or `string` legacy — shim covers)
- `precautions: string[]`
- `emergency: string[]`
- `doNot: [{text, critical?}]` — NEW field; per-entry list; Maren-veto on `critical` flag per medication-name default
- `lifeThreat: boolean` — emergency entries only; Maren-veto per entry (which emergencies are true life-threats vs "call doctor urgently but not 112")

### 0.3 Out-of-scope (deferred per vision phase boundaries)

- **Triage flow** — `triage: boolean` + `triageQuestions` data shape lands D2 (small addition to the shape migration); triage **rendering** lands D3 per vision §6.D2 sub-question.
- **Lyra-weave** — D3, consumes weave-ISL mini-spec contract.
- **Voice input** — D3.
- **Share + Track action wiring** — D3 (D2 ships footer-triad gating + Save action only; Share/Track slots are gated stubs).
- **Symptom → CareTicket promotion** — D3.
- **Weave-ISL mini-spec implementation** — separate D3-precursor mini-spec build (already ratified canon per PR #68).

### 0.4 Why spec-first

D2 touches:
- **Care jurisdiction** — `medical.js` (renderer evolution: dual-read shim, DO-NOT callout emit, numbered/bulleted sections, progressive disclosure scaffolding, footer-triad gating, Save action wiring, lifeThreat CTA emit, primitive extraction) + `data.js` (SYMPTOM_DB shape migration — 22 entries — + `EMERGENCY_CONTACTS.{region}` config). Parental-safety surface throughout.
- **Intelligence jurisdiction** — `intelligence.js` (minor: helper signature unchanged from D1; possibly `closeAndPrompt*` augmentation for Save action wiring).
- **Shared modules** — `template.html` (+ `zi-no-entry`, `zi-emergency` or note repurpose); `styles.css` (extensive — DO-NOT callout, critical typography, numbered/bulleted, progressive-disclosure `<details>` styling, footer-triad layout, back-channel callout, lifeThreat CTA).

Per canon-cc-008, mandates parallel Maren ‖ Kael Governor audit on this spec before Mode-2 build authorization.

### 0.5 D2 sub-phasing — TWO PRs, sequenced

```
D2-A structural Mode-2 PR
   ↓ (ships shim + new components + lifeThreat infra)
   ↓ merges first (Build-rule 1 per vision §5.2: shim before content)
D2-B Aurelius content snippet PR  (Maren-veto gated per V-M5)
   ↓ merges after D2-A
[merge sequence locked; no overlap; Build-rule 3 atomic-PR-per-phase boundary]
```

The shim discipline (vision §5.2 + Kael V-K2 + V-M7 P0 codified): D2-A shim renders OLD `string`-shape entries unchanged AND new `string[]`-shape entries correctly. D2-B then flips the entries to `string[]`. Reverse order would either ship a broken renderer or leak partial state into main.

### 0.6 SG-D1-LT slip context

D1 phase-spec v3.1 SG-D1-LT defaulted **Slip lifeThreat to D2**. Sovereign ratified that default. D2 absorbs:
- The `lifeThreat: boolean` field on SYMPTOM_DB (Maren-veto per entry)
- `EMERGENCY_CONTACTS.{region}` config table (vision Appendix A.6 proposed shape)
- Primary emergency-services CTA rendering when `lifeThreat: true` (108 Jamshedpur primary; 112 fallback)
- `zi-emergency` sprite (or repurpose `zi-siren` per SG-D2-EMERGENCY-SPRITE)
- `.sc-emergency-fallback` D1-shipped text-only fallback evolves: D2 swaps the static "in India: 112" string for `EMERGENCY_CONTACTS.{region}.emergencyFallback.number` lookup. Aurelius content-rewrite confirms 108 vs 112 ordering per Sovereign SG-1 amendment.

---

## 1. Inherited contracts (vision §6.5.D2 — mirrored as D2 implementation contract)

D2 ships these contracts. Cipher Edict V at impl verifies presence. Downstream (D3) inherits + extends additively.

| # | Contract | Rationale |
|---|---|---|
| 1 | SYMPTOM_DB array shape — `whatToDo`, `precautions`, `emergency` as `string[]`; `doNot` as `[{text, critical?}]` | G5 numbered sequences + G4 DO-NOT callouts require array structure |
| 2 | Dual-read shim (`typeof === 'string'` fallback) — present until future cleanup PR | Backward-compat for any legacy callers; shim removal in cleanup PR ≥4wk post-D2-B (Build-rule 2) |
| 3 | `lifeThreat: boolean` field on emergency entries meeting life-threat criteria | Drives primary CTA selection (ambulance vs pediatrician); safety-critical |
| 4 | `.sc-donot-callout` component — 2px solid `--rose-deep` left-edge border + tinted bg + per-item `zi-no-entry` prefix | G4 + V-M3 #1/#2 visual amplification of hard contraindications |
| 5 | Critical-DO-NOT typography — `fs-base` Nunito 800 with underline OR boxed treatment for `critical: true` items | V-M3 #3; medication-name DO-NOTs get the highest visual weight |
| 6 | Footer-triad severity-gating — Save-only on emergency; full Save/Share/Track on warning/mild | G10 v2 + V-M1 #4; emergency = no cognitive distraction beyond Save |
| 7 | Component decomposition — shared primitives extracted (`renderSeverityRail`, `renderDoctorCardCompact`, `renderDoctorCardPrimary`, `renderFooterTriad(visibilityMask)`, `renderDoNotCallout`, `renderNumberedSteps`, `renderBulletedItems`) | Vision §3.6 + V-K4; D3 weave + triage + voice extensions land additively |

Plus inherited from D1 (§6.5.D1, still in force):
- `.sc-rail`, `.sc-result { position:relative }`, sticky-CTA discipline, severity-aware doctor-card hierarchy, single-render discipline, touch-target floors, `prefers-reduced-motion` parity, no-doctor severity-aware fallback (with D2 swapping the static "112" text for `EMERGENCY_CONTACTS` lookup).

> **🎩 Cipher (skill register-flip):** §1 ↔ §6 mirror discipline locked from D1's `C-D1-1` fold. §6 below mirrors §1 *exactly* with operationally-stated rows; downstream phases (D3) read §6 as the canonical contract block.

---

## 2. Per-deliverable specification

### 2.1 SYMPTOM_DB shape migration

**Target shape (vision §5.1, expanded):**

```js
{
  id: 'fall-injury',
  keywords: [...],
  severity: 'emergency',
  lifeThreat: true,                          // NEW (D2) — drives primary CTA
  title: 'Fall / Head Injury',

  whatToDo: [                                 // CHANGED: string → string[]
    'Stay calm. Apply a cold compress (wrapped in cloth) to any bump for 10–15 minutes.',
    'Observe Ziva closely for the next 24 hours.',
    'Let her rest but check on her every 2 hours of sleeping.'
  ],

  precautions: [                              // CHANGED: string → string[]
    'Minor bumps from rolling or crawling height are usually not serious.',
    'Watch for: unusual drowsiness, repeated vomiting, unequal pupils, difficulty waking, clear fluid from nose/ears.'
  ],

  doNot: [                                    // NEW (D2)
    { text: 'Give pain medication without doctor advice', critical: true },
    { text: 'Let her sleep without 2-hour checks', critical: false }
  ],

  emergency: [                                // CHANGED: string → string[]
    'Loss of consciousness (even brief)',
    'Vomiting more than once',
    'Seizure',
    'Clear fluid from nose / ears',
    'Unequal pupil size',
    'Unusual sleepiness, hard to wake',
    'Fall from more than 3 feet'
  ],

  callDoctor: true,

  // Triage data (D2 SHAPE only; D3 RENDER): optional fields per vision §5.1
  triage: true,
  triageQuestions: [ /* same shape as vision §5.1; D2 lands data, D3 renders */ ],
  weaveSource: 'careTickets:injury'           // optional override; D3 consumes
}
```

**Maren-veto defaults (V-M3 #3 + V-M7 P0):**
- Any DO-NOT item involving a medication name → `critical: true` unless explicitly justified otherwise in the entry. No exceptions on the medication line.
- `lifeThreat: true` reserved for entries whose `.emergency` criteria include: loss of consciousness, seizure, not breathing, unresponsive/limp, unequal pupils, anaphylaxis-shape symptoms, severe dehydration with lethargy.

**Per-entry safety-impact tags (V-M7 + §8 below):** changes to `lifeThreat` / `doNot` / `whatToDo` / `precautions` / `emergency` are **safety-critical**; changes to `weaveSource` are **informational**.

### 2.2 Dual-read shim

Render path detects legacy `string` shape and adapts:

```js
function _scAsArray(field) {
  // D2 dual-read shim. Renders a string-shape legacy field as a single-item
  // array. Array-shape new fields pass through. Shim removal scheduled in
  // a future cleanup PR (≥4wk post-D2-B telemetry; Build-rule 2 — NOT in D2/D3).
  if (field == null) return [];
  if (typeof field === 'string') return [field];
  if (Array.isArray(field)) return field;
  return [String(field)];
}

// _scAsDoNotItems handles the new {text, critical?} shape with legacy fallback.
function _scAsDoNotItems(field) {
  if (field == null) return [];
  if (typeof field === 'string') return [{ text: field, critical: false }];
  if (Array.isArray(field)) {
    return field.map(function(it) {
      if (typeof it === 'string') return { text: it, critical: false };
      return { text: String(it.text || ''), critical: !!it.critical };
    });
  }
  return [];
}
```

> **🎩 Kael (skill register-flip):** the shim is the load-bearing contract for the D2-A → D2-B sequencing. Shim ships in D2-A FIRST; D2-B then flips entries to array-shape. If D2-B somehow lands first (e.g., an out-of-order merge), the bridge-shipped renderer with no shim would `escHtml(arr)` an Array, producing the string `"item1,item2"` in the DOM — wrong content rendered to a parent on a safety surface. Build-rule 1 (vision §5.2) is non-negotiable. Cipher Edict V verifies the merge order at impl-build PR time.

### 2.3 `.sc-donot-callout` component

**Target structure (rendered when `entry.doNot` exists):**

```html
<div class="sc-donot-callout">
  <div class="sc-donot-callout-title">{zi('no-entry')} DO NOT</div>
  <ul class="sc-donot-list">
    <li class="sc-donot-item">
      {zi('no-entry')} {escHtml(item.text)}
    </li>
    <li class="sc-donot-item sc-donot-critical">
      {zi('no-entry')} {escHtml(item.text)}
    </li>
  </ul>
</div>
```

**CSS:**

```css
.sc-donot-callout {
  margin-top: var(--sp-12);
  padding: var(--sp-10) var(--sp-12);
  border-left: 2px solid var(--tc-rose);         /* SG-D2-DONOT-BORDER: --tc-rose vs commission --rose-deep — see §10 */
  background: rgba(220,60,60,0.06);
  border-radius: 0 var(--r-md) var(--r-md) 0;
}
.sc-donot-callout-title {
  display: inline-flex; align-items: center; gap: var(--sp-4);
  font-size: var(--fs-xs); font-weight: 800;     /* Nunito 800 per V-M3 typography */
  text-transform: uppercase; letter-spacing: var(--ls-wide);
  color: var(--tc-danger);
  margin-bottom: var(--sp-6);
}
.sc-donot-list { list-style: none; padding: 0; margin: 0; }
.sc-donot-item {
  display: flex; align-items: flex-start; gap: var(--sp-6);
  padding: var(--sp-4) 0;
  font-size: var(--fs-sm); font-weight: 500;
  color: var(--tc-danger);
  line-height: var(--lh-relaxed);
}
.sc-donot-item.sc-donot-critical {
  /* §2.4 — critical DO-NOT typography. Per V-M3 #3. */
  font-size: var(--fs-base); font-weight: 800;
  text-decoration: underline;
  padding: var(--sp-6) 0;
}
[data-theme="dark"] .sc-donot-callout {
  background: rgba(220,60,60,0.12);
}
```

Per-item `{zi('no-entry')}` prefix on EVERY line (NOT just the title) per V-M3 #2 — each DO-NOT bullet visually communicates "forbidden action" via the sprite.

### 2.4 Critical-DO-NOT typography

Items flagged `critical: true` (per Maren-veto medication-name default + Aurelius per-entry assessment) render via `.sc-donot-item.sc-donot-critical`:
- `fs-base` (up from `fs-sm`) — bigger
- Nunito 800 (up from 500) — bolder
- Underline (added)
- Same `--tc-danger` color

The underline + boxed weight makes critical-DO-NOTs unmissable on a 5-second scan. Per V-M3 #3 logic: a 2am parent skimming should never miss "do not give aspirin" or "do not let her sleep without checks."

### 2.5 Numbered `<ol>` / Bulleted `<ul>` structure

**WHAT TO DO section** — rendered structure:

```js
function renderNumberedSteps(steps) {
  // For sequence-critical entries (Fall, Vomiting, High Fever — Aurelius flags
  // per entry in D2-B; D2-A's renderer just consumes the field as a string[]
  // and renders <ol> when the entry's id is in SEQUENCE_CRITICAL_IDS).
  var html = '<ol class="sc-numbered-steps">';
  steps.forEach(function(step) {
    html += '<li class="sc-step">' + escHtml(step) + '</li>';
  });
  html += '</ol>';
  return html;
}

function renderBulletedItems(items) {
  var html = '<ul class="sc-bullet-list">';
  items.forEach(function(it) {
    html += '<li class="sc-bullet">' + escHtml(it) + '</li>';
  });
  html += '</ul>';
  return html;
}

// In the helper:
var SEQUENCE_CRITICAL_IDS = ['fall-injury', 'vomiting', 'fever-high'];
var whatToDoArr = _scAsArray(e.whatToDo);
var whatToDoHtml = SEQUENCE_CRITICAL_IDS.indexOf(e.id) !== -1
  ? renderNumberedSteps(whatToDoArr)
  : renderBulletedItems(whatToDoArr);
```

**CSS:**

```css
.sc-numbered-steps { padding-left: var(--sp-20); margin: var(--sp-6) 0; }
.sc-step {
  margin-bottom: var(--sp-6);
  font-size: var(--fs-sm); color: var(--mid); line-height: var(--lh-relaxed);
}
.sc-step::marker {
  font-weight: 800; color: var(--text);            /* digit visual weight per V-M3 typography pass */
}
.sc-bullet-list { padding-left: var(--sp-16); margin: var(--sp-6) 0; }
.sc-bullet {
  margin-bottom: var(--sp-4);
  font-size: var(--fs-sm); color: var(--mid); line-height: var(--lh-relaxed);
}
```

**PRECAUTIONS section** and **WHEN-TO-SEEK-EMERGENCY-CARE section** → always bulleted (`renderBulletedItems`).

> **🎩 Maren (skill register-flip):** SEQUENCE_CRITICAL_IDS is a runtime constant in the renderer, NOT a data-field on SYMPTOM_DB entries. Reason: this is a *render-format* decision, not a per-entry data attribute. Per-entry shouldn't have to declare its own format; the renderer picks. If a future entry needs sequence-critical treatment, it's a one-line addition to SEQUENCE_CRITICAL_IDS (small renderer change), not a data-shape migration. Maren-veto on the initial 3-id set: Fall (head-injury sequence safety), Vomiting (dehydration assessment sequence), High Fever (cooling sequence). Other emergency entries (Rash anaphylaxis, Cough-cold dehydration) → Maren reviews per entry.

### 2.6 Progressive disclosure (G3)

First-paint shape per result card:
1. Severity rail (`.sc-rail`)
2. Severity badge
3. Title
4. **NEW: 1-line summary** (Aurelius authors per entry; field `summary?: string`)
5. **NEW: Primary action** — Call CTA on emergency (hoisted from D1, retained); footer-triad-Save on warning/mild
6. **NEW: Expand affordance** — `<details>`/`<summary>` opens the body

Body (initially collapsed under `<details>`):
- WHAT TO DO (numbered or bulleted)
- PRECAUTIONS (bulleted)
- DO-NOT callout
- WHEN TO SEEK EMERGENCY CARE (bulleted, emergency tier only)

**SG-D2-PROGRESSIVE-DISCLOSURE-DEFAULT** (§10): first-paint expanded vs collapsed. Default: **collapsed** — that's the whole point of progressive disclosure (G3). The primary action surface (Call / Save) is visible at first paint; the body is one tap away. **Maren-veto:** the SUMMARY line MUST carry the "what to do" essence (e.g., for Fall: "Apply cold compress, observe 24h, wake every 2h sleeping"). A summary that fails the 5-sec test is a D2-B Aurelius rewrite blocker.

**Component:**

```js
function renderProgressiveDisclosure(severity, summary, bodyHtml) {
  // Note: <details>/<summary> handles open-state semantics + a11y for free.
  // <summary> is the always-visible affordance row.
  var html = '<details class="sc-disclosure">';
  html += '<summary class="sc-disclosure-summary">';
  html += '<span class="sc-summary-text">' + escHtml(summary) + '</span>';
  html += '<span class="sc-disclosure-toggle" aria-hidden="true">' + zi('chevron-down') + '</span>';
  html += '</summary>';
  html += '<div class="sc-disclosure-body">' + bodyHtml + '</div>';
  html += '</details>';
  return html;
}
```

**CSS:**

```css
.sc-disclosure { margin-top: var(--sp-8); }
.sc-disclosure-summary {
  list-style: none;                                /* hide default triangle */
  display: flex; align-items: flex-start; gap: var(--sp-8);
  cursor: pointer;
  padding: var(--sp-6) 0;
  font-size: var(--fs-sm); color: var(--mid);
  line-height: var(--lh-relaxed);
}
.sc-disclosure-summary::-webkit-details-marker { display: none; }
.sc-summary-text { flex: 1; }
.sc-disclosure-toggle {
  flex: 0 0 24px;
  transition: transform 200ms ease;
}
details[open] .sc-disclosure-toggle { transform: rotate(180deg); }
@media (prefers-reduced-motion: reduce) {
  .sc-disclosure-toggle { transition: none; }
}
.sc-disclosure-body { margin-top: var(--sp-8); }
```

> **🎩 Kael (skill register-flip):** `<details>`/`<summary>` gives us `aria-expanded` mirroring, keyboard `Enter`/`Space` toggle, and screen-reader announcement for free. NO custom JS toggle handler needed → fewer event-listener-leak risks (D1's `_scInitStickyShadow` taught the lesson). a11y wins. ALSO: `<summary>` MUST be the FIRST child of `<details>`; renderer must enforce.

### 2.7 Typography pass (vision §4.2)

D2 introduces / refines:

| Surface | Spec | Implementation |
|---|---|---|
| DO-NOT label (`.sc-donot-callout-title`) | Nunito 800 · `fs-xs` · uppercase · `--ls-wide` · `--tc-danger` | §2.3 CSS |
| DO-NOT body (`.sc-donot-item`) | Nunito 500 · `fs-sm` · `--tc-danger` · tinted bg | §2.3 CSS |
| Critical DO-NOT (`.sc-donot-item.sc-donot-critical`) | Nunito 800 · `fs-base` · underline | §2.3/§2.4 CSS |
| Back-channel callout (`.sc-back-channel`) | Nunito 600 · `fs-sm` · `--tc-rose` on rose-tinted bg | §2.9 CSS |
| Step digit (`.sc-step::marker`) | Nunito 800 · `--text` | §2.5 CSS |
| Summary text (`.sc-summary-text`) | Nunito 500 · `fs-sm` · `--mid` | §2.6 CSS |

Existing surfaces (titles `--fs-md` Fraunces 600, section headers `--fs-xs` Nunito 700 uppercase) UNCHANGED.

### 2.8 Footer-triad severity-gating + Save action

**Target rendering** (only on warning/mild; emergency = Save-only):

```html
<!-- mild/warning tier -->
<div class="sc-footer-triad">
  <button class="sc-footer-action sc-footer-save" data-action="scSaveResult" data-entry-id="{e.id}">
    {zi('save')} Save
  </button>
  <button class="sc-footer-action sc-footer-share" data-action="scShareResult" data-entry-id="{e.id}">
    {zi('share')} Share
  </button>
  <button class="sc-footer-action sc-footer-track" data-action="scTrackResult" data-entry-id="{e.id}">
    {zi('track')} Track
  </button>
</div>

<!-- emergency tier -->
<div class="sc-footer-triad sc-footer-emergency">
  <button class="sc-footer-action sc-footer-save" data-action="scSaveResult" data-entry-id="{e.id}">
    {zi('save')} Save
  </button>
</div>
```

**Save action wiring (D2 ships LIVE per SG-D2-FOOTER-SAVE-WIRING default):**

```js
// in medical.js (or core.js — Cipher's call at impl; lean toward core.js since
// it's a cross-domain journal write).
function scSaveResult(btn) {
  var entryId = btn.getAttribute('data-entry-id');
  var entry = SYMPTOM_DB.find(function(e) { return e.id === entryId; });
  if (!entry) return;
  var je = {
    id: 'sc-' + entryId + '-' + Date.now(),
    type: 'symptom-result-save',
    dateLogged: new Date().toISOString(),
    title: entry.title,
    severity: entry.severity,
    source: 'symptom-checker'
  };
  // Existing journal-append path — reuse, do NOT introduce a new sync surface.
  // Kael review on the journal append: confirm it triggers the existing
  // Firestore-sync pipeline cleanly.
  addJournalEntry(je);
  showQLToast('Saved to journal');
}
```

**Share + Track stubs:**

```js
function scShareResult(btn) {
  // D2 stub; D3 wires native share-sheet
  showQLToast('Share — coming soon');
}
function scTrackResult(btn) {
  // D2 stub; D3 wires symptom → episode/CareTicket promotion
  showQLToast('Track — coming soon');
}
```

> **🎩 Maren (skill register-flip):** Save-on-emergency is V-M1 #4 / G10 v2 — the parent in active emergency does NOT need a Share menu in their face. But Save is OK on emergency because saving a snapshot of "what we saw at 2:14am" has post-event value (review with pediatrician, journal the emergency). Stubs for Share/Track on warning/mild are acceptable for D2 (the affordance exists, the action is "coming soon") because parents on warning/mild aren't in crisis mode and a stub-toast is honest about the in-flight rollout. NOT acceptable on emergency tier — that's why emergency Save is the only triad slot rendered.

### 2.9 Back-channel callout (`.sc-back-channel`)

```html
<div class="sc-back-channel">
  {zi('phone')} If symptoms worsen or you're unsure, call your doctor.
</div>
```

```css
.sc-back-channel {
  margin-top: var(--sp-10);
  padding: var(--sp-6) var(--sp-10);
  border-radius: var(--r-md);
  background: rgba(220,60,60,0.08);                  /* opaque-by-default for D2 — V-M2 #3 callout pattern */
  font-size: var(--fs-sm); font-weight: 600;
  color: var(--tc-rose);
  display: flex; align-items: center; gap: var(--sp-6);
}
[data-theme="dark"] .sc-back-channel { background: rgba(220,60,60,0.16); }
```

D2 renders this UNCONDITIONALLY on warning + mild result cards. D3 will refine to "triage-derived results only" (per vision §3.1.2 / §3.2 V-M2 #3). The backstop discipline: V-M2 #3 says the persistent callout is the safety-net for false-negative triage outcomes; on D2 there's no triage flow yet, so the conservative position is "always show" — Maren's worst-case lens prefers over-callout to silent gap.

Per Maren's bridge-precedent contrast-vigilance: `--tc-rose` on `rgba(220,60,60,0.08)` light + `rgba(220,60,60,0.16)` dark — §7 §contrast-fixture confirms ≥4.5:1.

### 2.10 Option A → C component decomposition (vision §3.6 + V-K4)

D1 used Option A — single function with severity branches. D2 transitions to Option C — shared primitives + thin variant components. Severity-decision location: **caller** (`_renderSymptomCheckerResults` iterates matches, per-match selects variant).

**Primitives extracted (D2-A):**

```js
function renderSeverityRail()                       // already in D1; promote to named primitive
function renderSeverityBadge(severity)              // sevLabel zi+text per D1; lift to primitive
function renderDoctorCardCompact(severity)          // warning/mild variants of D1 _scDoctorCardHTML; severity argument
function renderDoctorCardPrimary(severity, doc, opts)  // emergency-tier variant with optional lifeThreat first-CTA
function renderFooterTriad(visibilityMask)          // {save:true, share:bool, track:bool} per §2.8
function renderDoNotCallout(items)                  // per §2.3
function renderNumberedSteps(steps)                 // per §2.5
function renderBulletedItems(items)                 // per §2.5
function renderProgressiveDisclosure(severity, summary, bodyHtml)  // per §2.6
function renderBackChannel()                        // per §2.9
function renderLifeThreatCTA(region)                // per §2.11
```

**Variant renderers (thin) — one per severity:**

```js
function renderResultCardEmergency(m) {
  var html = '<div class="sc-result sc-emergency">';
  html += renderSeverityRail();
  html += renderSeverityBadge('emergency');
  html += '<div class="sc-title">' + escHtml(m.entry.title) + '</div>';
  if (m.entry.lifeThreat) html += renderLifeThreatCTA(currentRegion());
  // doctor card hoist handled at the result-list level per D1 §2.4.1 single-render
  var body = '';
  body += '<div class="sc-section"><div class="sc-section-title">When to seek care</div>';
  body += renderBulletedItems(_scAsArray(m.entry.emergency)) + '</div>';
  body += '<div class="sc-section"><div class="sc-section-title">What to do</div>';
  body += (SEQUENCE_CRITICAL_IDS.indexOf(m.entry.id) !== -1
    ? renderNumberedSteps(_scAsArray(m.entry.whatToDo))
    : renderBulletedItems(_scAsArray(m.entry.whatToDo))) + '</div>';
  if (m.entry.doNot) body += renderDoNotCallout(_scAsDoNotItems(m.entry.doNot));
  html += renderProgressiveDisclosure('emergency', m.entry.summary || _firstLine(m.entry.whatToDo), body);
  html += renderFooterTriad({ save: true, share: false, track: false });  // V-M1 #4 — Save-only
  html += '</div>';
  return html;
}
function renderResultCardWarning(m) { /* analogous; doctor-card mid-card; full triad */ }
function renderResultCardMild(m)    { /* analogous; doctor-card de-emphasised; full triad + back-channel */ }
```

**Caller** (`_renderSymptomCheckerResults` evolves from D1's Option A):

```js
function _renderSymptomCheckerResults(matches, ageMo, opts) {
  opts = opts || {};
  var actions = opts.actions || { /* legacy episode-CTA actions, unchanged */ };
  if (!matches || matches.length === 0) return '';

  var html = '';
  var shown = matches.slice(0, 2);
  var hasEmergency = shown.some(function(m) { return m.severity === 'emergency'; });
  var hasWarning   = shown.some(function(m) { return m.severity === 'warning'; });
  var needsDoctor  = hasEmergency || shown.some(function(m) { return m.entry.callDoctor; });

  if (hasEmergency && needsDoctor) {
    html += renderDoctorCardPrimary('emergency', getPrimaryDoctor(), {
      lifeThreat: shown.some(function(m) { return m.entry.lifeThreat; })
    });
  }

  shown.forEach(function(m) {
    if (m.severity === 'emergency') html += renderResultCardEmergency(m);
    else if (m.severity === 'warning') html += renderResultCardWarning(m);
    else html += renderResultCardMild(m);
  });

  if (!hasEmergency && needsDoctor) {
    html += renderDoctorCardCompact(hasWarning ? 'warning' : 'mild');
  }

  // Episode-tracking CTAs — unchanged from bridge/D1 logic; keep here for now
  // (could extract to renderEpisodeCTAs in a D2.1 cleanup if Kael flags as redundant).
  /* ... existing fever/diarrhoea/vomiting/cold CTA blocks ... */

  if (hasEmergency && opts.stickyFooter) {
    html += renderStickyFooter(getPrimaryDoctor());  // D1 §2.2 still in force
  }

  html += '<div class="sc-disclaimer">...</div>';
  return html;
}
```

**Primitive-extraction policy (vision §3.6 codified):** a primitive emerges when (1) ≥2 variants use it, AND (2) implementation is non-trivial (>~5 LOC), AND (3) API surface is stable (no expected per-variant signature drift in next phase). Premature extraction is forbidden.

Cipher Edict V on impl will audit: every primitive listed above satisfies the 3-criterion test. Anything that doesn't gets folded back.

> **🎩 Kael (skill register-flip):** Option A → C is the architectural debt-repayment moment for the Symptom Checker. D1 had single-component-with-branches; D2 has shared-primitives. The risk: extracting too aggressively creates microscopic primitives + indirection that Cipher will (correctly) flag as over-decomposition. The 3-criterion gate above is the safeguard. If a "primitive" has ONE caller in D2 (e.g., `renderLifeThreatCTA` only used by emergency variant) — keep it inline OR formally promote when D3 weave introduces a second caller. Mark such cases in the build PR.

### 2.11 `lifeThreat` rendering + `EMERGENCY_CONTACTS.{region}` config

**Config table (new in D2; lives in `data.js` or `config.js` — Kael's call at impl; lean `config.js`):**

```js
const EMERGENCY_CONTACTS = {
  jamshedpur: {
    label: 'Jamshedpur',
    ambulancePrimary:  { number: '108', service: 'National Ambulance Service' },
    emergencyFallback: { number: '112', service: 'Comprehensive Emergency' },
    altAmbulanceServices: [
      { number: '9931114901',      service: 'Gouri Shankar Ambulance (Mango)' },
      { number: '+91 88829 78888', service: 'Medulance (24/7)' }
    ],
    hospitals: [
      { name: 'Tata Main Hospital (TMH)',         number: '0657 6644444' },
      { name: 'MGM Medical College & Hospital',   number: '0657 2360859' },
      { name: 'Elite Hospital (Mango)',           number: '0657 6510307' }
    ]
  }
  // Future regions added by user-selectable override (D3 settings panel — SG-WI-MODULE
  // canon: per-region override capability via SproutLab settings).
};
const DEFAULT_REGION = 'jamshedpur';

function currentRegion() {
  // D2: returns DEFAULT_REGION. D3 reads from user settings panel.
  return EMERGENCY_CONTACTS[DEFAULT_REGION] ? DEFAULT_REGION : 'jamshedpur';
}
```

**`renderLifeThreatCTA(region)` primitive:**

```js
function renderLifeThreatCTA(region) {
  var contacts = EMERGENCY_CONTACTS[region] || EMERGENCY_CONTACTS[DEFAULT_REGION];
  var primary = contacts.ambulancePrimary;     // 108 for Jamshedpur
  var fallback = contacts.emergencyFallback;   // 112
  var html = '<div class="sc-lifethreat-cta">';
  html += '<a class="sc-call-emergency" href="tel:' + primary.number + '">';
  html += zi('emergency') + ' CALL AMBULANCE · ' + escHtml(primary.number);
  html += '</a>';
  html += '<a class="sc-call-fallback" href="tel:' + fallback.number + '">';
  html += 'Or ' + escHtml(fallback.number) + ' (unified emergency)';
  html += '</a>';
  html += '</div>';
  return html;
}
```

**CSS:**

```css
.sc-lifethreat-cta {
  display: flex; flex-direction: column; gap: var(--sp-6);
  margin: var(--sp-10) 0;
}
.sc-call-emergency {
  display: flex; align-items: center; justify-content: center;
  min-height: 60px; min-width: 60px;             /* per D1 §9 touch targets */
  padding: var(--sp-10) var(--sp-12);
  font-weight: 800; font-size: var(--fs-md);
  border-radius: var(--r-lg);
  background: var(--tc-danger); color: var(--white);
  text-decoration: none;
}
.sc-call-fallback {
  display: inline-flex; align-items: center; justify-content: center;
  min-height: 44px; padding: var(--sp-6) var(--sp-10);
  font-size: var(--fs-xs); color: var(--tc-danger); text-decoration: none;
  font-weight: 600;
}
```

**No-doctor + emergency tier rendering (D2 evolves D1 §2.3.2):** the static "(in India: **112**)" string is replaced by a dynamic `EMERGENCY_CONTACTS.{currentRegion()}` lookup. Functionally equivalent for Jamshedpur default; cleanly extends when D3 adds per-user region selection.

### 2.12 Triage data shape (lands D2; render lands D3)

Per vision §6.D2: "triage flow (data shape lands D2; render lands D3 to consume the dual-shipped Maren-veto'd content), Lyra-weave, voice, share, save."

D2-A adds the OPTIONAL fields to SYMPTOM_DB shape:

```js
{
  // ...existing fields...
  triage: true,                                // optional boolean (D3 renderer gates on it)
  triageQuestions: [
    {
      q: 'Did Ziva lose consciousness, even briefly?',
      yesSeverity: 'emergency',
      noSeverity: null
    }
    // ...up to 3 per entry per vision V-M2 #4 cap...
  ]
}
```

D2-B (Aurelius content rewrite) populates `triage` + `triageQuestions` for the 5 initial entries per vision SG-2: `crying-fussy`, `not-eating`, `cough-cold`, `fall-injury`, `fever-general`. Maren-veto per question.

D2 renderer **does NOT** render the triage flow — entries flagged `triage: true` render as normal result cards. D3 will gate the triage UI in front of the result render.

> **🎩 Cipher (skill register-flip):** shipping the triage DATA but not the triage RENDER in D2 is a deliberate cut. The alternative (ship both in D3) means D3 carries both a content migration AND a render migration, increasing the D3 atomic-PR-per-phase risk surface. D2-B's Aurelius content rewrite is the natural place to author the triage questions (G11 voice register applies; Maren-veto applies). D3 then consumes the ratified content via a pure-render addition.

---

## 3. Per-file edit map

### 3.1 D2-A structural PR

| File | D1 state (post-merge) | D2-A changes |
|---|---|---|
| `split/template.html` | + zi-phone (bridge) | + `zi-no-entry` (§2.3 DO-NOT prefix) + `zi-emergency` (§2.11 lifeThreat CTA prefix — SG-D2-EMERGENCY-SPRITE: NEW vs repurpose `zi-siren`) + `zi-chevron-down` (§2.6 progressive disclosure toggle) + `zi-save` (§2.8 footer-triad) + `zi-share` + `zi-track` (§2.8 footer-triad stubs) |
| `split/styles.css` | + .sc-rail, sticky, doctor-card variants, etc. (D1) | + `.sc-donot-callout` + `.sc-donot-item` + critical typography (§2.3-§2.4) + `.sc-numbered-steps` + `.sc-bullet-list` + `.sc-step` (§2.5) + `.sc-disclosure` + `.sc-disclosure-summary` + `.sc-disclosure-toggle` (§2.6) + `.sc-footer-triad` + `.sc-footer-action` + variants (§2.8) + `.sc-back-channel` (§2.9) + `.sc-lifethreat-cta` + `.sc-call-emergency` + `.sc-call-fallback` (§2.11) + prefers-reduced-motion overrides for new transitions |
| `split/data.js` | (SYMPTOM_DB string-shape entries) | + `EMERGENCY_CONTACTS` config table + `DEFAULT_REGION` const + `currentRegion()` helper. NO entry shape change in D2-A; entries flip in D2-B. |
| `split/medical.js` | _renderSymptomCheckerResults Option-A helper + _scDoctorCardHTML severity-aware + _scInitStickyShadow (D1) | + `_scAsArray` + `_scAsDoNotItems` dual-read shim (§2.2) + extracted primitives `renderSeverityRail` / `renderSeverityBadge` / `renderDoctorCardCompact` / `renderDoctorCardPrimary` / `renderFooterTriad` / `renderDoNotCallout` / `renderNumberedSteps` / `renderBulletedItems` / `renderProgressiveDisclosure` / `renderBackChannel` / `renderLifeThreatCTA` (§2.10) + variant components `renderResultCardEmergency/Warning/Mild` (§2.10) + `scSaveResult` / `scShareResult` (stub) / `scTrackResult` (stub) (§2.8). _renderSymptomCheckerResults refactored to delegate to variants. SEQUENCE_CRITICAL_IDS constant. |
| `split/intelligence.js` | _scInitStickyShadow call + opts (D1) | (likely no change in D2-A; helper signature unchanged. If `addJournalEntry` is intel-side, the Save action wiring may touch this file — Kael's call at impl.) |
| `split/core.js` | escHtml, zi, _qaSymptomTrackMap, etc. | (possibly: `addJournalEntry` helper if it doesn't already exist as a named export; Kael's call.) |

### 3.2 D2-B content snippet PR (Aurelius co-traveller)

Single file: `split/data.js` — the SYMPTOM_DB entries flipped from `string` → `string[]` for `whatToDo`/`precautions`/`emergency`; `doNot` added per entry; `lifeThreat` flagged on appropriate entries; `summary` 1-line added per entry; optional `triage`/`triageQuestions` on the 5 SG-2 entries.

**Estimated entry count:** ~22 entries per vision §6.D2.

**Aurelius authors via Codex snippet pipeline.** Snippet PR co-travels with the D2-A structural PR but does NOT merge until D2-A is in main (Build-rule 1).

**Maren content-veto gate inserted between Aurelius and Cipher snippet pipeline** per V-M5 (§4 step [8]).

---

## 4. Audit chain (canon-cc-008) for THIS spec + the D2 build PRs

```
[1] Lyra      → drafts this D2 phase-spec (DONE — this file)
[2] Maren     → audits parental-safety brief on D2 phase-spec:
                · §2.1 SYMPTOM_DB shape migration — safety-impact per field
                · §2.3 DO-NOT callout — visual amplification adequate?
                · §2.4 critical-DO-NOT — medication-name default sufficient?
                · §2.5 SEQUENCE_CRITICAL_IDS — initial 3-id set right?
                · §2.6 progressive disclosure default — collapsed vs expanded
                  (SG-D2-PROGRESSIVE-DISCLOSURE-DEFAULT)
                · §2.8 footer-triad gating — Save-only-on-emergency correct?
                  Stubs OK on warning/mild?
                · §2.9 back-channel — "always on" warning/mild D2 backstop OK?
                · §2.11 lifeThreat + EMERGENCY_CONTACTS — content accuracy
                  (Jamshedpur 108 primary, 112 fallback)
                · §6.5.D2 phase contracts soundness for D3 inheritance
                · Sub-Sovereign-gates SG-D2-* stances
[3] Kael      → audits architectural brief on D2 phase-spec:
                · §2.2 dual-read shim discipline (Build-rule 1 ordering)
                · §2.10 Option A → C decomposition — primitive-extraction
                  policy + 3-criterion gate
                · §3 per-file edit map — concat-order, jurisdictional
                  ownership of helpers (e.g. addJournalEntry location)
                · §2.11 EMERGENCY_CONTACTS module location
                  (SG-D2-CONFIG-MODULE)
                · §2.6 progressive disclosure — <details>/<summary> a11y +
                  prefers-reduced-motion parity
                · §2.8 Save action — does addJournalEntry route through
                  existing sync pipeline without new surface?
                · §7 migration build-rules — shim discipline enforceable
                  at PR time
                · §8 per-field safety-impact accuracy
                · Sub-Sovereign-gates SG-D2-* stances
[4] Lyra      → synthesises both Governor reports; folds amendments into v2
[5] Cipher    → Edict V STRICT structural pass on spec (per D1 precedent —
                strict thresholds, per-section sign-off, contract verification
                against main, V-K6-GAP retrospective, canon-promotion check)
[6] Sovereign → ratifies v2 of this phase-spec. Sub-SG decisions locked.
[7] Aurelius  → drafts D2-B content snippet PR (22 entries: whatToDo/
                precautions/emergency arrays; doNot per entry; lifeThreat
                flag; summary line; triage data on 5 SG-2 entries)
[8] Maren     → CONTENT-REVIEW GATE per V-M5:
                · reads every entry as a 2am parent
                · G11 voice register per severity tier
                · DO-NOT critical-flag per-item (medication-name default)
                · no medication dosing advice
                · no under-classification on warning/emergency
                · no alarmist phrases on mild
                · summary line passes 5-sec test
                · triage questions per V-M2 (chip-order, false-negative,
                  3-question cap)
                · lifeThreat per-entry assignment
                · iteration rounds with Aurelius until clear (SG-D2-CONTENT-
                  VETO-ROUNDS budget; escalation to Sovereign if exceeded)
                · explicit Maren sign-off required to proceed
[9] Cipher    → snippet pipeline structural pass on D2-B (per Codex snippet
                pipeline; not an Edict V on impl yet)
[10] Lyra     → Mode-2 build D2-A structural PR (per ratified v2; per-file
                map §3.1)
[11] Cipher   → Edict V on D2-A impl (per D1 precedent — STRICT thresholds,
                grep gates, build-time discovery review, helper purity
                where applicable, motion-budget audit, contract verification
                against ratified spec)
[12] Sovereign→ merges D2-A
[13] Lyra     → merges D2-B content snippet PR (post-D2-A merge per Build-
                rule 1 — non-negotiable)
[14] Cipher   → Edict V on D2-B (content-level: grep against shipped
                SYMPTOM_DB shape; verify no string-shape entries remain
                in flipped entries; HR-4 escHtml coverage on new array
                items)
[15] Maren    → §7 contrast-verification fixture on real device (live
                site after D2-B merge + artifact regen): all D1 carry-
                forwards + D2-NEW surfaces (DO-NOT callouts, critical
                typography, numbered steps, progressive disclosure
                toggle, footer-triad, back-channel, lifeThreat CTA,
                emergency-fallback dynamic-number)
[16] Sovereign→ final merge / sign-off acknowledgment (D2 phase closed)
```

**No short-circuits.** Per spec-iteration discipline + V-M5 content-veto gate.

---

## 5. HR-by-HR audit (this spec) — operational sentences per V-K6

| HR | Status | Operationally, this means… |
|---|---|---|
| HR-1 | Reinforced | New sprites (`zi-no-entry`, `zi-emergency`, `zi-chevron-down`, `zi-save`, `zi-share`, `zi-track`) all land as `zi()` SVG, never raw emoji. Verified at impl by `grep -cE '\\u\\{1F\|\\u26[0-9A-F]'` over SC + DO-NOT + footer-triad surfaces → MUST equal 0. |
| HR-2 | Reinforced | All new colour / spacing / border via tokens. `.sc-donot-callout` border-left uses `--tc-rose` (or commissioned `--rose-deep` per SG-D2-DONOT-BORDER); `--tc-danger` text; `--sp-*` paddings. Verified at impl by `grep -nE 'style="\|#[0-9a-f]{3,6}'` on modified surfaces → MUST return 0 for D2-introduced lines. |
| HR-3 | Reinforced | All new actions (`scSaveResult`, `scShareResult`, `scTrackResult`) use `data-action` delegation. `<details>`/`<summary>` toggle uses native semantics — NO custom JS handler — extra HR-3 win. |
| HR-4 | Reinforced | Every SYMPTOM_DB array element interpolated via `escHtml()` per item. `_scAsArray` + `_scAsDoNotItems` shim outputs feed into render functions that all apply `escHtml`. Aurelius-authored entries are content (not user data) and pass through `escHtml` for defense-in-depth. |
| HR-5 | Reinforced | Token-driven spacing across all new layouts. Cipher Edict V verifies at impl. |
| HR-6 | Reinforced (HR-3 cross-ref) | Operationally identical to HR-3 row. |
| HR-7 | Reinforced | Helper returns string; caller writes via `.innerHTML`. New variant renderers (`renderResultCard*`) and primitives all return strings. `<details>` markup written via innerHTML (browser natively handles the disclosure semantics; no `.textContent` regression possible). |
| HR-8 | Reinforced | Share + Track footer-triad stubs DO use the "Coming soon" pattern via `showQLToast` per HR-8. NOT silent no-ops. |
| HR-9 | Reinforced | Full audit chain per §4 (Maren + Kael + Cipher + Sovereign + V-M5 content-veto gate + Cipher Edict V × 2 + Maren §7). D2 specifically inserts the Maren content-veto gate (step [8]) — the audit chain expands at the content boundary. |
| HR-10 | Reinforced | Progressive disclosure uses expand/collapse (`<details>`), NEVER `text-overflow: ellipsis`. Verified at impl by `grep -c 'text-overflow' split/styles.css` over D2-introduced lines = 0. |
| HR-11 | N/A | No currency. |
| HR-12 | N/A | No date construction in the renderer; `journalEntry.dateLogged` uses `new Date().toISOString()` which is UTC-stable (Cipher confirms `formatDate` isn't called on the SC save path). |

**Plus D2-introduced verification gates** (Cipher Edict V on D2-A + D2-B):

| Gate | Pattern | Verification |
|---|---|---|
| G-D2-1 | Shim coverage | `grep -nE '_scAsArray\\(' split/medical.js` returns calls for every render-time SYMPTOM_DB field access (`whatToDo`, `precautions`, `emergency`). Zero direct `escHtml(e.whatToDo)` (legacy bridge pattern) on D2-touched paths. |
| G-D2-2 | DO-NOT items use `zi-no-entry` prefix | `grep -nE 'class="sc-donot-item"' split/medical.js` — every emit includes `zi('no-entry')`. |
| G-D2-3 | Footer-triad gating | `grep -nE 'sc-footer-triad' split/medical.js` — emergency-tier emits only `sc-footer-save` child; warning/mild emit all three children. |
| G-D2-4 | `<details>` ↔ `<summary>` first-child | Cipher manual review or static grep: every `<details class="sc-disclosure">` has `<summary class="sc-disclosure-summary">` as IMMEDIATE first child (HTML invariant; misorder = no progressive-disclosure semantics). |
| G-D2-5 | `lifeThreat` rendering reachable only when `entry.lifeThreat === true` | `grep -nE 'renderLifeThreatCTA' split/medical.js` — every call is conditional on `m.entry.lifeThreat` (or `shown.some(...lifeThreat)` at the hoisted level). |
| G-D2-6 | `EMERGENCY_CONTACTS.{region}` lookup defaults safely | `grep -nE 'EMERGENCY_CONTACTS\\[' split/*.js` — every lookup has `\|\| EMERGENCY_CONTACTS[DEFAULT_REGION]` fallback. |
| G-D2-7 | Shim removal NOT in D2 PR scope | Cipher Edict V on the D2-A PR confirms the shim `_scAsArray` is INTRODUCED, not removed. (Build-rule 2: removal in a future cleanup PR ≥4wk post-D2-B.) |
| G-D2-8 | Save action routes through existing journal pipeline | Cipher confirms `addJournalEntry` is a pre-existing named symbol; D2 does NOT introduce a new Firestore sync surface (Kael's V-K2 sync-surface-delta rule). |

---

## 6. §6.5.D2 phase contracts (re-stated for downstream inheritance)

**§6.5.D2 — Contracts shipped (mirrors §1 above per Cipher C-D1-1 discipline):**

```
6.5.D2 — Contracts shipped (D2 extends D1's §6.5.D1):
  · SYMPTOM_DB array shape — whatToDo / precautions / emergency as string[];
    doNot as [{text, critical?}]
  · Dual-read shim (typeof === 'string' fallback) — present until future
    cleanup PR ≥4wk post-D2-B (Build-rule 2)
  · lifeThreat: boolean field on emergency entries meeting life-threat
    criteria (per V-M2 criteria list)
  · .sc-donot-callout component — 2px solid --tc-rose left-edge border +
    tinted bg + per-item zi-no-entry prefix
  · Critical-DO-NOT typography — fs-base Nunito 800 with underline OR
    boxed treatment for critical: true items
  · Footer-triad severity-gating — Save-only on emergency; full triad
    on warning/mild (Save action LIVE in D2; Share/Track stubs)
  · Component decomposition — shared primitives extracted per §2.10
    7-primitive set + 3 thin variant components (Option C)
  · Progressive disclosure — <details>/<summary> with severity + title +
    1-line summary + primary action on first paint; body collapsed
  · Numbered <ol> for sequence-critical entries; bulleted <ul> elsewhere
  · Back-channel callout pattern (.sc-back-channel) — D2 renders
    unconditionally on warning/mild; D3 refines to triage-derived-only
  · EMERGENCY_CONTACTS.{region} config table + currentRegion() — D3 adds
    user-selectable override via settings panel
  · Triage data shape (triage: boolean + triageQuestions) — D2 ships
    data; D3 renders
```

---

## 7. Migration build-rules (per vision §5.2 — D2-specific application)

```
Build-rule 1 — Shim ordering (vision §5.2, D2 application):
   D2-A structural PR ships the _scAsArray + _scAsDoNotItems shim BEFORE
   the D2-B content PR flips the entries. D2-A merges first. D2-B
   never merges with D2-A unmerged. Non-negotiable per Kael V-K2 +
   Maren V-M7 P0.

Build-rule 2 — Shim removal (vision §5.2, D2 application):
   Shim removal NEVER lands in D2 or D3. Defer to a future cleanup PR
   after telemetry confirms 0 string-shape entries remain (≥4 weeks
   post-D2-B merge). Cipher Edict V re-pass required before shim removal.

Build-rule 3 — Atomic-PR-per-phase (vision §5.2, D2 application):
   D2-A and D2-B together form the "D2 atomic" — but they're TWO PRs by
   structural necessity (shim before content). Atomic discipline means:
   neither PR leaves a partial state in main. D2-A alone in main is
   coherent (shim renders legacy entries unchanged). D2-A+D2-B in main
   is the target state. D2-B alone in main is FORBIDDEN.

Pre-shim-removal verification fixture (future cleanup PR — NOT D2):
   grep -cE "whatToDo: '" split/data.js   MUST equal 0
   grep -cE "precautions: '" split/data.js   MUST equal 0
   grep -cE "emergency: '" split/data.js   MUST equal 0
```

---

## 8. Affected files + per-field safety-impact (per vision §5.3 + V-M7)

| File | D2-A | D2-B |
|---|---|---|
| `template.html` | + 6 sprites (`zi-no-entry`, `zi-emergency`, `zi-chevron-down`, `zi-save`, `zi-share`, `zi-track`) | — |
| `styles.css` | + ~150 lines (DO-NOT, critical typography, numbered/bulleted, progressive disclosure, footer-triad, back-channel, lifeThreat CTA, prefers-reduced-motion parity) | — |
| `data.js` | + `EMERGENCY_CONTACTS` + `DEFAULT_REGION` + `currentRegion()` (~40 lines) | + SYMPTOM_DB ~22 entries flipped to array-shape + `doNot` + `lifeThreat` + `summary` + optional `triage`/`triageQuestions` on 5 entries |
| `medical.js` | shim + 11 primitives + 3 variant components + Save action + helper refactor (~250 lines net add; ~50 lines removed in helper restructure) | — |
| `intelligence.js` | (minor — likely no change) | — |
| `core.js` | (possibly `addJournalEntry` location confirmation; Kael) | — |

### Per-field safety-impact (V-M7 + V-M3 + D2 additions)

| Field | Phase | Change shape | Safety-impact |
|---|---|---|---|
| `lifeThreat` | D2 | new `boolean` | **Safety-critical** — drives primary CTA selection on emergency. Missing on a true-emergency entry = parent calls pediatrician instead of emergency services. Maren-veto per entry. |
| `whatToDo` | D2 | `string → string[]` | **Safety-critical** — action sequence parent follows. Loss = action gap. |
| `precautions` | D2 | `string → string[]` | **Safety-critical** — what to watch for. Loss = under-classification risk. |
| `emergency` | D2 | `string → string[]` | **Safety-critical** — emergency-recognition criteria. Loss = false-negative on emergency triage. |
| `doNot` | D2 | new `[{text, critical?}]` | **Safety-critical — the most safety-critical field in the schema.** Contraindications are deadlier than missing action steps. Maren-veto on `critical` flag per medication-name default. |
| `summary` | D2 | new `string` | **Safety-adjacent** — first-paint surface under progressive disclosure. A misleading summary fails the 5-sec test. Maren-veto. |
| `triage` | D2 (data); D3 (render) | new `boolean` | **Safety-critical** — missing on an entry that should have triage = false-negative on the triage flow. Render lands D3. |
| `triageQuestions` | D2 (data); D3 (render) | new `[{q, yesSeverity, noSeverity}]` | **Safety-critical** — question copy carries the parent's triage decision. Maren-veto per question. |
| Dual-read shim (`_scAsArray` / `_scAsDoNotItems`) | D2 | runtime detect | **Safety-critical** — shim ordering is the single biggest D2 migration risk. Build-rules 1+3 mitigate. |
| `EMERGENCY_CONTACTS.{region}.ambulancePrimary.number` | D2 | config | **Safety-critical** — wrong number = parent dials wrong service in emergency. Maren-veto on Jamshedpur values (per vision Appendix A.1 + SG-1 amendment 108 primary). |

---

## 9. Open questions for Sovereign (sub-Sovereign-gates)

| ID | Source | Question | Proposed default | Effect if amended |
|---|---|---|---|---|
| **SG-D2-EMERGENCY-SPRITE** | V-M3 visual-distinction precedent | New `zi-emergency` sprite (medkit/ambulance-cross-themed) vs repurpose existing `zi-siren`? | **NEW `zi-emergency`** — visual distinction matters at parental-safety surface (`zi-siren` is already used for emergency-section headers; conflating loses semantic clarity). +1 template.html sprite. | If "repurpose": §2.11 CSS swaps `zi('emergency')` → `zi('siren')`; saves 1 sprite; small visual-conflation risk. |
| **SG-D2-DONOT-BORDER** | V-M3 #1 | `.sc-donot-callout` left-edge border colour: `--tc-rose` (theme-aware, exists) vs commission new `--rose-deep` (matches the spec §2.3 wording)? | **`--tc-rose`** — token already theme-aware (light `#9e3e52` / dark `#e090a8`); avoids commissioning unless visually inadequate at §7 contrast verification. | If "commission `--rose-deep`": add to design tokens (~+2 lines styles.css); Maren §7 retests both options. |
| **SG-D2-PROGRESSIVE-DISCLOSURE-DEFAULT** | G3 + V-M / V-K UX call | First-paint expanded (full body visible) vs collapsed (severity + title + summary + primary action only)? | **COLLAPSED** — that's the WHOLE POINT of progressive disclosure. Primary action visible immediately; body one tap away. Critical: summary line MUST pass the 5-sec test (Maren-veto on D2-B). | If "expanded": progressive disclosure becomes a no-op visual element (`<details>` always open); spec §2.6 demotes from G3 to "future enhancement". Significant scope reduction. |
| **SG-D2-CONFIG-MODULE** | Kael jurisdiction call | `EMERGENCY_CONTACTS` table + `currentRegion()` lives in `data.js` (where SYMPTOM_DB lives) vs `config.js` (where `firebaseConfig` lives) vs new `config-locale.js`? | **`config.js`** — semantic fit (locale config alongside Firebase config); concat-order safe (config.js loads first per build.sh order). | If "data.js": grouped with SYMPTOM_DB; OK but conflates content with config. If new `config-locale.js`: cleanest separation; +1 module, +1 cat line in build.sh. |
| **SG-D2-FOOTER-SAVE-WIRING** | G10 + V-M5 + Sovereign sequencing call | D2 ships Save action LIVE (writes `journalEntry`) vs stub (footer-triad gating only, Save no-op until D3)? | **LIVE** — Save is the only non-D3 footer-triad surface; gating without an action is a half-feature. Save writes flow into existing journal sync surface (no new sync surface; Kael V-K2 rule respected). | If "stub": §2.8 Save becomes `showQLToast('Save — coming soon')` like Share/Track; D3 wires all three together. Removes ~30 LOC from D2-A. |
| **SG-D2-CONTENT-VETO-ROUNDS** | V-M5 | How many Maren content-veto iterations are budgeted before Aurelius/Lyra escalate to Sovereign? | **3 rounds** — round 1 Maren reads, round 2 Aurelius reworks per Maren findings, round 3 Maren confirms. If round 3 finds new issues, Sovereign escalation. | If lower: more frequent Sovereign escalation. If higher: longer D2-B turnaround; risk of veto-fatigue. |
| **SG-D2-SEQUENCE-CRITICAL-IDS** | V-M / Maren content-veto territory | Initial SEQUENCE_CRITICAL_IDS set: `['fall-injury', 'vomiting', 'fever-high']` (3) vs broader (`+ rash-anaphylaxis`, `+ choking`, etc.)? | **3 initial** — Fall, Vomiting, Fever-high. Maren reviews per-entry in D2-B for additions. Avoids over-numbering (numbered prose for entries where order doesn't carry safety meaning is noise). | If broader: 5-7 entries get numbered treatment. Maren ‖ Aurelius decide in content-veto gate. |
| **SG-D2-BACK-CHANNEL-GATING** | V-M2 #3 + D2-vs-D3 cut | D2 renders `.sc-back-channel` unconditionally on warning/mild vs only on triage-derived (matching V-M2 #3 strict intent)? | **Unconditionally on warning/mild in D2** — conservative backstop; D3 will refine to triage-derived-only when triage flow renders. Maren's worst-case lens prefers over-callout to silent gap during the D2-D3 in-between. | If "triage-derived-only": back-channel doesn't render in D2 (no triage UI yet); D3 lights it up. Loses the backstop callout for ~1 phase cycle. |

**Amendment protocol:** Sovereign overrides any SG default by stating the override; Lyra revises v2 in-place. Single round of audit re-run only if an SG change affects audit-chain shape (e.g., SG-D2-CONFIG-MODULE = new module changes concat order → Kael re-reviews §3 + build.sh).

---

## 10. Forward-pointer (downstream)

D2 ships the structural foundation + content. Downstream:

- **D3 spec(s)** open post-D2-B merge AND post-weave-ISL-mini-spec re-confirm (mini-spec is already ratified canon per PR #68; D3 consumes by reference). D3 splits at Lyra's discretion: triage / weave / footer-triad-completion / voice / promote.
- **Future shim cleanup PR** — opens ≥4 weeks post-D2-B merge once telemetry confirms 0 string-shape entries in `SYMPTOM_DB`. Cipher Edict V re-pass required (Build-rule 2).
- **D2-B Aurelius content snippet PR** — co-traveller; opens after this spec ratifies + Aurelius receives the D2-B brief. Maren content-veto gate inserted (step [8] in §4).
- **EMERGENCY_CONTACTS region expansion** — D3 settings-panel scope (user-selectable region); D2 ships only the Jamshedpur default. Per-region override = D3 work.

---

## 11. Changelog

- **v1 (2026-05-14):** initial draft. Ships §6.5.D2 phase contracts. Inherits from vision v2.1 §6.D2 + D1 phase-spec v3.1 (post-merge). Absorbs `lifeThreat` slipped from D1 per SG-D1-LT default ratified — `EMERGENCY_CONTACTS.{region}` config + `renderLifeThreatCTA` primitive folded in. Incorporates inline skill register-flips during drafting: Cipher (§1 contract-mirror discipline), Kael (§2.2 shim ordering + §2.6 `<details>` a11y + §2.10 primitive-extraction policy), Maren (§2.5 SEQUENCE_CRITICAL_IDS render-vs-data decision + §2.8 footer-triad gating Care lens). Seven sub-Sovereign-gates surfaced (SG-D2-EMERGENCY-SPRITE / DONOT-BORDER / PROGRESSIVE-DISCLOSURE-DEFAULT / CONFIG-MODULE / FOOTER-SAVE-WIRING / CONTENT-VETO-ROUNDS / SEQUENCE-CRITICAL-IDS / BACK-CHANNEL-GATING — wait, 8 surfaced; updating count). Awaits Maren ‖ Kael parallel audit on this phase-spec.
