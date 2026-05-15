# Lyra Spec — 2026-05-14 — Symptom Checker D2 Structural (severity-driven layout + DO-NOTs + numbered sequences + lifeThreat)

**Author:** Lyra (Builder, The Weaver)
**Mode:** 1 (spec authoring; signed audit-bearing artifact per canon-cc-022)
**Status:** v2.1 — Maren ‖ Kael Governor audits folded (PASS WITH CAVEATS × 2) + Cipher Edict V STRICT folded (PASS WITH NOTES; 2 P1 + 5 P2 absorbed); Sovereign decisions applied on variant collapse / Save wiring / DO-NOT border. Awaiting Sovereign ratification.
**Branch:** `claude/d2-phase-spec`
**Parent spec:** `lyra-spec-2026-05-11-symptom-checker-ux-vision.md` v2.1 — this implements §6.D2 + ships §6.5.D2 phase contracts; absorbs `lifeThreat` slipped from D1 per SG-D1-LT default ratified
**Predecessor spec:** `lyra-spec-2026-05-13-symptom-checker-d1-polish.md` v3.1 — Mode-2 build merged 2026-05-14 (PR #69 → main `7dee90d`) + Maren §7 sign-off post hotfix `13140074` (sticky-footer `--blush`). D2 contracts EXTEND D1's §6.5.D1.
**Trigger:** D1 Mode-2 build verified in production 2026-05-14. Per vision §6 phase sequencing, D2 structural spec opens now.

**v2 fold summary** (full delta in §11 Changelog):
- Maren: 3 P0 + 4 P1 + 2 P2 findings folded. SEQUENCE_CRITICAL_IDS extended 3 → 7 ids; new sub-SG `SG-D2-PROGRESSIVE-DISCLOSURE-EMERGENCY-OVERRIDE` (force-expand emergency); shim filters empty-text DO-NOT items; back-channel copy tiered; currentRegion returns `{region, confidence}` with hospital-list suppression on default; fallback copy "If 108 unavailable, call 112".
- Kael: 1 P0 + 6 P1 + 4 P2 findings folded. SEQUENCE_CRITICAL_IDS moved from `medical.js` (renderer) to `config.js` (render-policy) co-located with EMERGENCY_CONTACTS; new G-D2-9 verifies every id resolves to a SYMPTOM_DB entry; shim cleanup trigger reframed as grep-verifiable fixture + dev-mode `console.warn`; opacity-sufficiency §7 fixture moved PRE-Edict V; ageMo dead param dropped from `_renderSymptomCheckerResults` per V-K9.
- Sovereign decisions: (1) Variant collapse 3 → 2 (`renderResultCardEmergency` + `renderResultCardNonEmergency({backChannel, footerMask})`); (2) Footer-triad Save = **STUB** in D2 (no `addJournalEntry` on main; journal infrastructure deferred to a focused phase); (3) Commission `--rose-deep` token for DO-NOT border at 2px.

---

## 0. Scope

### 0.1 In-scope — D2-A structural PR

D2 is the **structural** phase: it migrates the SYMPTOM_DB data shape, ships the new DO-NOT / numbered / progressive-disclosure / footer-triad / lifeThreat surfaces, and transitions the renderer from Option A (single helper with severity branches) to Option C (shared primitives + thin variant components) per vision §3.6 V-K4.

Per vision §6.D2 deliverables + §6.5.D2 phase contracts + V-M2/V-M3/V-M5/V-M7/V-K4 folds + SG-D1-LT slip absorbed:

1. **SYMPTOM_DB shape migration** — `whatToDo` / `precautions` / `emergency`: `string → string[]`; new `doNot: [{text, critical?: boolean}]`; new `lifeThreat: boolean` on emergency entries meeting life-threat criteria (per V-M2). Shape change applies to all ~22 entries.
2. **Dual-read shim** — render path detects `typeof field === 'string'` and renders as single-item array (+ dev-mode `console.warn` per Kael A-D2-K-2 fold). Present until a future cleanup PR (grep-fixture-gated trigger; §7 Build-rule 2). Shim removal **never** in D2 or D3 per vision §5.2 Build-rule 2.
3. **`.sc-donot-callout` component** — bordered red callout with 2px solid **`--rose-deep`** (newly commissioned token; SG-D2-DONOT-BORDER ratified) left-edge border + tinted bg + per-item `zi-no-entry` prefix (NOT generic `•`) per V-M3 #1/#2.
4. **Critical-DO-NOT typography** — DO-NOT items flagged `critical: true` render at `fs-base` Nunito 800 with underline OR boxed treatment per V-M3 #3 + Maren-veto default: any DO-NOT involving a medication name is `critical: true`.
5. **Numbered `<ol>` for sequence-critical** — initial 7-id set: `fall-injury`, `vomiting`, `fever-high`, `choking`, `seizure`, `breathing-difficulty`, `head-injury` (`allergic-reaction`, `burn`, `dehydration` are content-veto candidates for D2-B — Aurelius confirms per entry whether the `whatToDo` is actually a sequence; Maren-veto per addition). Order-of-operations carries safety meaning under stress (per G5).
6. **Bulleted `<ul>` for non-sequence sections** — Precautions, WHEN-TO-SEEK-EMERGENCY-CARE criteria, mild-tier WHAT TO DO. Bullets, not prose paragraphs.
7. **Progressive disclosure** — result card shows severity badge + title + 1-line summary + primary action on first paint; `<details>`/`<summary>` for the body expand (G3). First-paint primary-action surface remains touch-target-compliant per D1 §9. **Emergency tier force-expands** (`<details open>`) per SG-D2-PROGRESSIVE-DISCLOSURE-EMERGENCY-OVERRIDE — see §2.6.
8. **Typography pass** — per vision §4.2: Critical-DO-NOT typography (per #4 above), back-channel callout style, numbered-list digit weight. Validated against §7 contrast-verification fixture which runs **PRE-Edict V** for the D2-A build (not post-merge — D1 hotfix `13140074` lesson absorbed).
9. **Footer-triad severity-gating + Save STUB** — D2 ships the visibility-gating infrastructure (Save-only on emergency; full triad on warning/mild per G10 v2 / V-M1 #4). All three actions (Save / Share / Track) are **gated stubs** with `data-action` placeholders firing `showQLToast('… — coming soon')`. Live Save wiring (journal-write + undo affordance) is deferred to a focused phase — `addJournalEntry` does not exist on main; introducing journal infrastructure under a parental-safety surface deserves its own audit chain (SG-D2-FOOTER-SAVE-WIRING ratified STUB).
10. **Back-channel callout pattern** — `.sc-back-channel` class + persistent callout (V-M2 #3) with **tiered copy** per severity (mild: "If symptoms worsen or you're unsure, call your doctor." warning: "Symptoms suggest you should call your doctor today. Trust your gut."). D2 ships the component + the class hook on all triage-derivable mild/warning tiers; the "triage-derived" gate ITSELF lands in D3 (D2 renders unconditionally on mild/warning per the V-M2 #3 backstop pattern; D3 will refine to triage-derived-only).
11. **Option A → C component decomposition** — per vision §3.6 + Kael V-K4. Extract `renderSeverityRail`, `renderSeverityBadge`, `renderDoctorCardCompact`, `renderDoctorCardPrimary`, `renderFooterTriad(visibilityMask)`, `renderDoNotCallout(items)`, `renderNumberedSteps(steps)`, `renderBulletedItems(items)`, `renderProgressiveDisclosure(severity, summary, bodyHtml)`, `renderBackChannel(severity)`, `renderLifeThreatCTA(regionCtx)` primitives — 11 total. Variant components per Sovereign decision D1: **2 variants** (`renderResultCardEmergency` + `renderResultCardNonEmergency({backChannel, footerMask})`) — collapsed from initial 3-variant proposal per Kael V-K4 ("split where it earns its keep"; Warning/Mild differed by 2 booleans only). Severity decisions live at the CALLER (`_renderSymptomCheckerResults` iterates matches, per-match selects variant — see §2.10). Primitive-extraction policy per vision §3.6 codified.
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
- **Care jurisdiction** — `medical.js` (renderer evolution: dual-read shim, DO-NOT callout emit, numbered/bulleted sections, progressive disclosure scaffolding, footer-triad gating, stub action handlers, lifeThreat CTA emit, primitive extraction) + `config.js` **(new module per SG-D2-CONFIG-MODULE)** holding `EMERGENCY_CONTACTS.{region}` + `SEQUENCE_CRITICAL_IDS` + `currentRegion()` (Kael A-D2-K-5 fold: render-policy constants co-located, NOT renderer-side; drift hazard eliminated). `data.js` retains SYMPTOM_DB only (D2-B flips entries). Parental-safety surface throughout.
- **Intelligence jurisdiction** — `intelligence.js` (no change in D2-A; helper signature unchanged from D1).
- **Shared modules** — `template.html` (+ `zi-no-entry`, `zi-emergency` or note repurpose); `styles.css` (extensive — DO-NOT callout, critical typography, numbered/bulleted, progressive-disclosure `<details>` styling, footer-triad layout, back-channel callout, lifeThreat CTA, `--rose-deep` token commission).

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
| 2 | Dual-read shim (`typeof === 'string'` fallback) + dev-mode `console.warn` on string-shape read — present until verifiable-grep cleanup PR | Backward-compat for legacy callers; cleanup gated on grep fixture (§7 Build-rule 2 — falsifiable, not telemetry-handwave) |
| 3 | `lifeThreat: boolean` field on emergency entries meeting life-threat criteria | Drives primary CTA selection (ambulance vs pediatrician); safety-critical |
| 4 | `.sc-donot-callout` component — 2px solid **`--rose-deep`** (newly commissioned token) left-edge border + tinted bg + per-item `zi-no-entry` prefix | G4 + V-M3 #1/#2 visual amplification of hard contraindications; SG-D2-DONOT-BORDER ratified |
| 5 | Critical-DO-NOT typography — `fs-base` Nunito 800 with underline OR boxed treatment for `critical: true` items | V-M3 #3; medication-name DO-NOTs get the highest visual weight |
| 6 | Footer-triad severity-gating — Save-only slot on emergency; full Save/Share/Track on warning/mild. All three actions are **stubs** in D2 (toast: "… — coming soon"); live wiring deferred. | G10 v2 + V-M1 #4; emergency = no cognitive distraction. SG-D2-FOOTER-SAVE-WIRING ratified STUB (no `addJournalEntry` on main). |
| 7 | Component decomposition — 11 shared primitives + 2 variant components (`renderResultCardEmergency`, `renderResultCardNonEmergency({backChannel, footerMask})`) | Vision §3.6 + V-K4; Sovereign D1 decision collapsed Warning+Mild → NonEmergency (2-boolean variance). D3 weave + triage + voice extensions land additively |
| 8 | Progressive disclosure — `<details>`/`<summary>` collapsed default on warning/mild; **force-expanded on emergency** | G3 + SG-D2-PROGRESSIVE-DISCLOSURE-EMERGENCY-OVERRIDE; emergency-tier safety content cannot live behind a tap |
| 9 | Render-policy constants in `config.js` — `EMERGENCY_CONTACTS.{region}`, `DEFAULT_REGION`, `SEQUENCE_CRITICAL_IDS`, `currentRegion()` | SG-D2-CONFIG-MODULE ratified + Kael A-D2-K-5 fold: render-policy lives co-located, NOT in renderer; eliminates id-drift hazard |
| 10 | Back-channel callout — tiered copy per severity (mild: gentle escalation suggestion; warning: sharper "call today, trust your gut"); unconditionally rendered on warning/mild in D2 | V-M2 #3 backstop; D3 refines to triage-derived-only |
| 11 | Renderer applies render-policy from config.js: numbered `<ol>` for ids in `SEQUENCE_CRITICAL_IDS`; bulleted `<ul>` elsewhere | G5 sequence-safety semantics; renderer reads policy, never hard-codes id list. Cipher E-D2-1 fold — separable contract from row 9. |
| 12 | `_renderSymptomCheckerResults(matches, opts)` signature — `ageMo` dropped (V-K9; grep of main confirmed dead param) | V-K9 signature-simplification when legacy params unused. G-D2-11 verifies. Cipher E-D2-1 fold. |
| 13 | Triage data shape — `triage: boolean` + `triageQuestions: [{q, yesSeverity, noSeverity}]` optional fields on SYMPTOM_DB entries; D2 ships **data only**, D3 renders | Vision §6.D2 sub-question split: content authoring (D2-B) decouples from render-flow authoring (D3). Cipher E-D2-1 fold. |

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
  // a future cleanup PR (Build-rule 2 — NOT in D2/D3; grep fixture gated).
  if (field == null) return [];
  if (typeof field === 'string') {
    // Kael A-D2-K-2 fold: dev-mode warning makes the shim cleanup trigger
    // verifiable. In production builds the warn is dead-stripped; in dev/
    // QA, zero warnings is the cleanup precondition (alongside the §7
    // grep fixture).
    if (typeof window !== 'undefined' && window.SPROUTLAB_DEV_MODE) {
      console.warn('[sc-shim] string-shape field rendered; entry needs D2-B migration');
    }
    return [field];
  }
  if (Array.isArray(field)) return field;
  return [String(field)];
}

// _scAsDoNotItems handles the new {text, critical?} shape with legacy fallback.
// Maren C-D2-M-8 / Kael A-D2-K-1 fold: filter empty-text items so the renderer
// never emits an empty critical-DO-NOT bullet (silent corruption surface).
function _scAsDoNotItems(field) {
  if (field == null) return [];
  if (typeof field === 'string') {
    var s = field.trim();
    return s ? [{ text: s, critical: false }] : [];
  }
  if (Array.isArray(field)) {
    return field
      .map(function(it) {
        if (typeof it === 'string') {
          var s = it.trim();
          return s ? { text: s, critical: false } : null;
        }
        if (!it) return null;
        var text = String(it.text || '').trim();
        if (!text) return null;
        return { text: text, critical: !!it.critical };
      })
      .filter(Boolean);
  }
  return [];
}
```

> **🎩 Kael (skill register-flip):** the shim is the load-bearing contract for the D2-A → D2-B sequencing. Shim ships in D2-A FIRST; D2-B then flips entries to array-shape. If D2-B somehow lands first (e.g., an out-of-order merge), the bridge-shipped renderer with no shim would `escHtml(arr)` an Array, producing the string `"item1,item2"` in the DOM — wrong content rendered to a parent on a safety surface. Build-rule 1 (vision §5.2) is non-negotiable. Cipher Edict V verifies the merge order at impl-build PR time. **A-D2-K-2 fold:** Build-rule 2 cleanup trigger is now grep-verifiable (§7) + dev-mode warn — not unfalsifiable "telemetry-confirmed" language.

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
/* SG-D2-DONOT-BORDER ratified: commission --rose-deep at 2px.
   Token addition (styles.css :root + [data-theme="dark"]):
     :root           { --rose-deep: #7a2c3e; }  / light, deeper than --tc-rose (#9e3e52) /
     [data-theme=dark] { --rose-deep: #f0a6bd; }  / dark, brighter than --tc-rose dark /
   Maren §7 contrast fixture verifies ≥4.5:1 on both themes PRE-Edict V. */
.sc-donot-callout {
  margin-top: var(--sp-12);
  padding: var(--sp-10) var(--sp-12);
  border-left: 2px solid var(--rose-deep);
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

// SEQUENCE_CRITICAL_IDS lives in config.js per SG-D2-CONFIG-MODULE (ratified)
// + Kael A-D2-K-5 fold. Render-policy constants do NOT live in the renderer;
// co-locating with EMERGENCY_CONTACTS eliminates the drift hazard where a
// content author flipping an id in data.js silently breaks the numbered-list
// gate. Boot-time assertion (G-D2-9) verifies every id resolves to a
// SYMPTOM_DB entry.
//
// In config.js:
//   var SEQUENCE_CRITICAL_IDS = [
//     'fall-injury',          // head-injury sequence safety
//     'vomiting',             // dehydration assessment sequence
//     'fever-high',           // cooling sequence
//     'choking',              // back-blows/Heimlich sequence — Maren C-D2-M-1 P0
//     'seizure',              // recovery-position / time-event / do-NOT-restrain
//     'breathing-difficulty', // positional steps + when-to-call sequence
//     'head-injury'           // if authored as separate id from fall-injury
//   ];
//   // Aurelius/Maren content-veto candidates for inclusion in D2-B
//   // (Maren confirms per-entry whether whatToDo is actually a sequence):
//   //   'allergic-reaction' (epi-pen → call → position → monitor)
//   //   'burn' (cool-water duration → assess → cover)
//   //   'dehydration' (ORS sequence + escalation thresholds)
//
// In medical.js renderer:
var whatToDoArr = _scAsArray(e.whatToDo);
var whatToDoHtml = SEQUENCE_CRITICAL_IDS.indexOf(e.id) !== -1
  ? renderNumberedSteps(whatToDoArr)
  : renderBulletedItems(whatToDoArr);
```

**Boot-time assertion (G-D2-9 verifies):**

```js
// In config.js: declare the assertion, schedule it deferred. `config.js`
// loads BEFORE `data.js` per build.sh order, so SYMPTOM_DB doesn't exist
// at module-eval time — defer to the microtask queue / next tick so it
// runs after all modules concatenate-evaluate.
function _scAssertSequenceIds() {
  if (typeof SYMPTOM_DB === 'undefined') return;  // belt-and-braces guard
  var unresolved = SEQUENCE_CRITICAL_IDS.filter(function(id) {
    return !SYMPTOM_DB.some(function(e) { return e.id === id; });
  });
  if (unresolved.length && typeof window !== 'undefined' && window.SPROUTLAB_DEV_MODE) {
    console.warn('[sc-config] SEQUENCE_CRITICAL_IDS unresolved against SYMPTOM_DB:', unresolved);
  }
}
if (typeof window !== 'undefined') {
  // Schedule after concatenated-script-eval completes. setTimeout(0) is
  // sufficient — by the time it fires, data.js has run and SYMPTOM_DB exists.
  setTimeout(_scAssertSequenceIds, 0);
}
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

> **🎩 Maren (skill register-flip, v2-updated):** SEQUENCE_CRITICAL_IDS is a runtime constant, NOT a data-field on SYMPTOM_DB entries. Reason: this is a *render-format* decision, not a per-entry data attribute. Per-entry shouldn't have to declare its own format; the renderer picks. **v2 fold (Kael A-D2-K-5):** the constant moved from `medical.js` (renderer) to `config.js` (render-policy module) — co-located with `EMERGENCY_CONTACTS`. Co-location eliminates the drift hazard where a content author flipping an id in `data.js` silently de-numbers a safety-critical sequence with no error. Boot-time assertion (G-D2-9) catches unresolved ids in dev mode. **v2 fold (Maren C-D2-M-1 P0):** the initial set extends from 3 → **7 ids** (fall-injury, vomiting, fever-high + choking, seizure, breathing-difficulty, head-injury). Each addition is parent-life-changing; Maren content-veto in step [8] confirms each entry's `whatToDo` is *actually* a sequence (some D2-B candidates may collapse back to bullets). Anaphylaxis, burn, dehydration are content-veto-round candidates.

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

**SG-D2-PROGRESSIVE-DISCLOSURE-DEFAULT** (§9): first-paint expanded vs collapsed on warning/mild. Default: **collapsed** — that's the whole point of progressive disclosure (G3). Primary action surface (Save / back-channel) is visible at first paint; body is one tap away.

**SG-D2-PROGRESSIVE-DISCLOSURE-EMERGENCY-OVERRIDE** (NEW v2, Maren C-D2-M-2 P0): emergency-tier force-expands. Default: **force-expanded on emergency, collapsed on warning/mild.** Rationale: a panicking 2am parent who sees "Fall / Head Injury — Apply cold compress, observe 24h" as a one-liner does NOT know that "loss of consciousness", "vomiting more than once", "seizure" are the emergency-recognition criteria — those live in the collapsed `<details>` body. One tap on a 3am phone in a poorly-lit room is one tap too many for emergency content. Renderer emits `<details open class="sc-disclosure">` on emergency; the disclosure mechanism remains for warning/mild only.

**Maren-veto:** the SUMMARY line MUST carry the "what to do" essence (e.g., for Fall: "Apply cold compress, observe 24h, wake every 2h sleeping"). A summary that fails the 5-sec test is a D2-B Aurelius rewrite blocker.

**Component:**

```js
function renderProgressiveDisclosure(severity, summary, bodyHtml) {
  // Note: <details>/<summary> handles open-state semantics + a11y for free.
  // <summary> is the always-visible affordance row.
  // SG-D2-PROGRESSIVE-DISCLOSURE-EMERGENCY-OVERRIDE: emergency force-expands.
  var openAttr = (severity === 'emergency') ? ' open' : '';
  var html = '<details' + openAttr + ' class="sc-disclosure">';
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

### 2.8 Footer-triad severity-gating + stub actions

**Sovereign decision D2 (v2 fold):** SG-D2-FOOTER-SAVE-WIRING ratified as **STUB**. Grep of `main` confirms `addJournalEntry` does not exist anywhere in the codebase, and there is no journal-write infrastructure. Wiring live Save in this PR would require inventing journal-write semantics + storage shape + (per Maren caveat) an undo affordance — bundling that into the structural-fold PR violates atomic-PR-per-phase discipline. Save / Share / Track all render in D2 as gated stubs, firing `showQLToast('… — coming soon')` per HR-8 "Coming soon" pattern. Live wiring (for any of the three) deserves its own audit chain and is deferred to a focused phase.

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

**Stub action handlers (D2 — all three; live wiring deferred):**

```js
// All three live in medical.js per §3.1; HR-8 "Coming soon" pattern.
function scSaveResult(btn) {
  // D2 STUB per SG-D2-FOOTER-SAVE-WIRING. Live journal-write infrastructure
  // (addJournalEntry helper, storage shape, undo affordance per Maren caveat
  // C-D2-M-3) does not exist on main and is deferred to a focused phase.
  showQLToast('Save — coming soon');
}
function scShareResult(btn) {
  // D2 stub; D3 wires native share-sheet
  showQLToast('Share — coming soon');
}
function scTrackResult(btn) {
  // D2 stub; D3 wires symptom → episode/CareTicket promotion
  showQLToast('Track — coming soon');
}
```

> **🎩 Maren (skill register-flip, v2-updated):** Save-on-emergency is V-M1 #4 / G10 v2 — the parent in active emergency does NOT need a Share menu in their face. The emergency-tier render still emits only the Save slot (no Share/Track), so visibility-gating is intact. **v2 Sovereign decision:** Save itself is a stub in D2; the gating ships, the wiring waits. This is honest about state. My earlier caveat (C-D2-M-3, emergency-Save needs 5s undo) auto-resolves: no live write → no undo needed. When live wiring opens in a focused phase, undo affordance comes in scope alongside.

### 2.9 Back-channel callout (`.sc-back-channel`)

**Tiered copy per severity** (Maren C-D2-M-7 fold):

```js
function renderBackChannel(severity) {
  // severity is 'mild' or 'warning' (emergency never renders this — V-M2 #3
  // backstop is for non-emergency-tier mistrust-the-classifier protection).
  var copy = (severity === 'warning')
    ? "Symptoms suggest you should call your doctor today. Trust your gut."
    : "If symptoms worsen or you're unsure, call your doctor.";
  var html = '<div class="sc-back-channel sc-back-channel-' + severity + '">';
  html += zi('phone') + ' ' + escHtml(copy);
  html += '</div>';
  return html;
}
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
.sc-back-channel-warning {
  /* sharper visual weight matches sharper copy */
  font-weight: 700;
}
.sc-back-channel-mild {
  /* Cipher E-D2-6 fold: explicit rule for symmetry / future-edit
     safety. Currently equivalent to base .sc-back-channel; future
     refinements (e.g. softer color) land here without altering the
     class-emit contract in renderBackChannel(). */
}
[data-theme="dark"] .sc-back-channel { background: rgba(220,60,60,0.16); }
```

D2 renders this UNCONDITIONALLY on warning + mild result cards. D3 will refine to "triage-derived results only" (per vision §3.1.2 / §3.2 V-M2 #3). The backstop discipline: V-M2 #3 says the persistent callout is the safety-net for false-negative triage outcomes; on D2 there's no triage flow yet, so the conservative position is "always show" — Maren's worst-case lens prefers over-callout to silent gap.

**Contrast / opacity-sufficiency (Kael A-D2-K-9 fold — D1 hotfix lesson absorbed):** the rgba tints (`0.08` light / `0.16` dark) sit on `--bg` / `--card` surfaces — even lower opacity than D1's failed `--surface-danger`. §7 Maren contrast fixture verifies `.sc-back-channel` AND `.sc-donot-callout` text-on-tint contrast (≥4.5:1) on BOTH surfaces, BOTH themes, **PRE-Edict V** — not post-merge. If fixture fails on either, swap to opaque token (`--blush` precedent or commission `--rose-deep-tinted`). This is the D1-hotfix pattern explicitly baked into pre-merge gates.

### 2.10 Option A → C component decomposition (vision §3.6 + V-K4)

D1 used Option A — single function with severity branches. D2 transitions to Option C — shared primitives + thin variant components. Severity-decision location: **caller** (`_renderSymptomCheckerResults` iterates matches, per-match selects variant).

**Sovereign decision D1 (v2 fold):** variant count collapsed from initial 3 → **2**. Kael A-D2-K-3 finding: `renderResultCardWarning` and `renderResultCardMild` differed by 2 booleans only (back-channel on/off, footer-triad mask) — under V-K4 "split where it earns its keep" that does not warrant separate variants. Final shape: `renderResultCardEmergency` + `renderResultCardNonEmergency({backChannel, footerMask})`.

**Primitives extracted (D2-A) — 11 total:**

```js
function renderSeverityRail()                       // already in D1; promote to named primitive
function renderSeverityBadge(severity)              // sevLabel zi+text per D1; lift to primitive
function renderDoctorCardCompact(severity)          // warning/mild variants of D1 _scDoctorCardHTML; severity argument
function renderDoctorCardPrimary(severity, doc, opts)  // emergency-tier variant with optional lifeThreat first-CTA
function renderFooterTriad(visibilityMask)          // {save:true, share:bool, track:bool} per §2.8
function renderDoNotCallout(items)                  // per §2.3
function renderNumberedSteps(steps)                 // per §2.5
function renderBulletedItems(items)                 // per §2.5
function renderProgressiveDisclosure(severity, summary, bodyHtml)  // per §2.6 (emergency force-expands)
function renderBackChannel(severity)                // per §2.9 (tiered copy)
function renderLifeThreatCTA(regionCtx)             // per §2.11 (regionCtx = {region, confidence})
```

**Variant renderers (thin) — 2 variants (collapsed per Sovereign D1):**

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
  // SG-D2-PROGRESSIVE-DISCLOSURE-EMERGENCY-OVERRIDE — force-expanded
  html += renderProgressiveDisclosure('emergency', m.entry.summary || _firstLine(m.entry.whatToDo), body);
  html += renderFooterTriad({ save: true, share: false, track: false });  // V-M1 #4 — Save slot only (stub)
  html += '</div>';
  return html;
}

function renderResultCardNonEmergency(m, opts) {
  // Single variant for warning + mild (Sovereign D1: Warning/Mild differed
  // by 2 booleans; collapse per V-K4). opts = { backChannel: bool,
  // footerMask: {save, share, track} }.
  opts = opts || {};
  var sev = m.severity;  // 'warning' | 'mild'
  var html = '<div class="sc-result sc-' + sev + '">';
  html += renderSeverityRail();
  html += renderSeverityBadge(sev);
  html += '<div class="sc-title">' + escHtml(m.entry.title) + '</div>';
  var body = '';
  body += '<div class="sc-section"><div class="sc-section-title">What to do</div>';
  body += (SEQUENCE_CRITICAL_IDS.indexOf(m.entry.id) !== -1
    ? renderNumberedSteps(_scAsArray(m.entry.whatToDo))
    : renderBulletedItems(_scAsArray(m.entry.whatToDo))) + '</div>';
  if (m.entry.precautions && _scAsArray(m.entry.precautions).length) {
    body += '<div class="sc-section"><div class="sc-section-title">Precautions</div>';
    body += renderBulletedItems(_scAsArray(m.entry.precautions)) + '</div>';
  }
  if (m.entry.doNot) body += renderDoNotCallout(_scAsDoNotItems(m.entry.doNot));
  html += renderProgressiveDisclosure(sev, m.entry.summary || _firstLine(m.entry.whatToDo), body);
  if (opts.backChannel) html += renderBackChannel(sev);
  html += renderFooterTriad(opts.footerMask || { save: true, share: true, track: true });
  html += '</div>';
  return html;
}
```

**Caller** (`_renderSymptomCheckerResults` evolves from D1's Option A; ageMo dropped per Kael A-D2-K-11 / V-K9 — grep of main confirmed dead param):

```js
function _renderSymptomCheckerResults(matches, opts) {
  // V-K9 fold: ageMo dropped. Body uses ageMonthsAt() / getAgeInMonths()
  // for local computations; caller never threaded ageMo through.
  opts = opts || {};
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
    if (m.severity === 'emergency') {
      html += renderResultCardEmergency(m);
    } else {
      // SG-D2-BACK-CHANNEL-GATING: unconditionally on warning/mild in D2.
      // Footer-triad mask: full triad on non-emergency (all stubs per
      // SG-D2-FOOTER-SAVE-WIRING STUB).
      html += renderResultCardNonEmergency(m, {
        backChannel: true,
        footerMask: { save: true, share: true, track: true }
      });
    }
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

> **🎩 Kael (skill register-flip, v2-updated):** Option A → C is the architectural debt-repayment moment for the Symptom Checker. **v2 fold (Sovereign D1):** variant count is 2, not 3 — Warning/Mild collapsed under V-K4's "split where it earns its keep." Net topology: 11 primitives + 2 variants (Emergency / NonEmergency). **A-D2-K-4 annotation:** `renderLifeThreatCTA` is borderline — 2 call sites today (`renderResultCardEmergency` body + `renderDoctorCardPrimary` lifeThreat-first-CTA). Per the 3-criterion policy it clears the bar narrowly. Build-PR commit body MUST annotate this as "promote-on-D3-second-caller, otherwise inline-back" so Cipher Edict V can audit at impl whether D3-weave introduces the third caller or the primitive should fold back.

### 2.11 `lifeThreat` rendering + `EMERGENCY_CONTACTS.{region}` config

**Config table (lives in `config.js` per SG-D2-CONFIG-MODULE ratified):**

```js
// config.js — render-policy module (loads BEFORE data.js per build.sh order).
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

// Maren C-D2-M-6 fold: currentRegion returns a region-context object with a
// confidence flag. Until D3 ships the settings-panel region override, every
// non-Jamshedpur user gets confidence:'default' — renderer suppresses the
// hospital list to avoid showing Jamshedpur hospital phone numbers to a
// parent in Delhi/Mumbai/etc. The 108/112 CTAs remain (108 is national).
function currentRegion() {
  // D2: returns DEFAULT_REGION with confidence:'default'.
  // D3: reads from user settings panel; returns confidence:'known' when set.
  return {
    region: EMERGENCY_CONTACTS[DEFAULT_REGION] ? DEFAULT_REGION : 'jamshedpur',
    confidence: 'default'
  };
}
```

**`renderLifeThreatCTA(regionCtx)` primitive:**

```js
function renderLifeThreatCTA(regionCtx) {
  // regionCtx: { region: string, confidence: 'known' | 'default' }.
  // Defensive: accept either the new context object OR a bare region string
  // (D3 hand-off compatibility surface).
  var ctx = (typeof regionCtx === 'string')
    ? { region: regionCtx, confidence: 'known' }
    : (regionCtx || currentRegion());
  var contacts = EMERGENCY_CONTACTS[ctx.region] || EMERGENCY_CONTACTS[DEFAULT_REGION];
  var primary = contacts.ambulancePrimary;     // 108 for Jamshedpur
  var fallback = contacts.emergencyFallback;   // 112
  var html = '<div class="sc-lifethreat-cta">';
  html += '<a class="sc-call-emergency" href="tel:' + primary.number + '">';
  html += zi('emergency') + ' CALL AMBULANCE · ' + escHtml(primary.number);
  html += '</a>';
  // Maren C-D2-M-9 fold: fallback copy upgraded — "Or 112" downgraded the
  // fallback to a secondary option; "If 108 unavailable, call 112" gives
  // the parent a clear escalation read.
  html += '<a class="sc-call-fallback" href="tel:' + fallback.number + '">';
  html += 'If ' + escHtml(primary.number) + ' unavailable, call ' + escHtml(fallback.number);
  html += '</a>';
  html += '</div>';
  return html;
}
```

**Hospital-list rendering (separate from CTA — controlled by `confidence`):**

```js
// Used by the no-doctor + emergency fallback path that evolves D1 §2.3.2.
// Maren C-D2-M-6 fold: only render hospital list when we know the region.
function renderHospitalList(regionCtx) {
  var ctx = (typeof regionCtx === 'string')
    ? { region: regionCtx, confidence: 'known' }
    : (regionCtx || currentRegion());
  if (ctx.confidence !== 'known') return '';   // suppress on default
  var contacts = EMERGENCY_CONTACTS[ctx.region];
  if (!contacts || !contacts.hospitals) return '';
  var html = '<ul class="sc-hospital-list">';
  contacts.hospitals.forEach(function(h) {
    html += '<li><a href="tel:' + h.number + '">' + escHtml(h.name) + ' · ' + escHtml(h.number) + '</a></li>';
  });
  html += '</ul>';
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

**No-doctor + emergency tier rendering (D2 evolves D1 §2.3.2):** the static "(in India: **112**)" string is replaced by a dynamic `EMERGENCY_CONTACTS[currentRegion().region]` lookup. Functionally equivalent for Jamshedpur default; cleanly extends when D3 adds per-user region selection. Hospital list (`renderHospitalList(currentRegion())`) renders only when `confidence === 'known'` — for D2's default-only world, hospitals stay suppressed; 108/112 CTAs remain since 108 is a national service.

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
| `split/styles.css` | + .sc-rail, sticky, doctor-card variants, etc. (D1) | + `--rose-deep` token commission (`:root` + `[data-theme="dark"]`) + `.sc-donot-callout` + `.sc-donot-item` + critical typography (§2.3-§2.4) + `.sc-numbered-steps` + `.sc-bullet-list` + `.sc-step` (§2.5) + `.sc-disclosure` + `.sc-disclosure-summary` + `.sc-disclosure-toggle` (§2.6) + `.sc-footer-triad` + `.sc-footer-action` + variants (§2.8) + `.sc-back-channel` + `.sc-back-channel-warning` (§2.9) + `.sc-lifethreat-cta` + `.sc-call-emergency` + `.sc-call-fallback` + `.sc-hospital-list` (§2.11) + prefers-reduced-motion overrides for new transitions |
| **`split/config.js` (NEW)** | (does not exist) | NEW module per SG-D2-CONFIG-MODULE ratified. Contents: `EMERGENCY_CONTACTS` config table + `DEFAULT_REGION` const + `SEQUENCE_CRITICAL_IDS` (Kael A-D2-K-5 fold: render-policy here, not in renderer) + `currentRegion()` helper returning `{region, confidence}` + `_scAssertSequenceIds()` boot-time assertion. |
| `split/data.js` | (SYMPTOM_DB string-shape entries) | NO entry shape change in D2-A; entries flip in D2-B. (D2-A leaves `data.js` untouched at the structural level — Sovereign decision D2 / SG-D2-CONFIG-MODULE: locale config + render-policy moved to `config.js`.) |
| `split/medical.js` | _renderSymptomCheckerResults Option-A helper + _scDoctorCardHTML severity-aware + _scInitStickyShadow (D1) | + `_scAsArray` + `_scAsDoNotItems` dual-read shim (§2.2) + extracted primitives `renderSeverityRail` / `renderSeverityBadge` / `renderDoctorCardCompact` / `renderDoctorCardPrimary` / `renderFooterTriad` / `renderDoNotCallout` / `renderNumberedSteps` / `renderBulletedItems` / `renderProgressiveDisclosure` / `renderBackChannel` / `renderLifeThreatCTA` / `renderHospitalList` (§2.10, §2.11) + 2 variant components `renderResultCardEmergency` + `renderResultCardNonEmergency` (§2.10 per Sovereign D1) + `scSaveResult` / `scShareResult` / `scTrackResult` stubs (§2.8 per Sovereign D2). `_renderSymptomCheckerResults` refactored: delegates to variants AND drops `ageMo` dead param per V-K9 (A-D2-K-11). |
| `split/intelligence.js` | _scInitStickyShadow call + opts (D1) | No change in D2-A. (SG-D2-FOOTER-SAVE-WIRING STUB obviates journal-helper plumbing.) |
| `split/core.js` | escHtml, zi, _qaSymptomTrackMap, etc. | No change in D2-A. (`addJournalEntry` is NOT introduced — STUB defers journal infrastructure.) |

**`split/build.sh` concat-order diff (Kael A-D2-K-6 fold — explicit):**

```diff
  # Concat order: render-policy → data → core → home → diet → medical → intelligence → sync → start
+ cat split/config.js          >> "$OUT"
  cat split/data.js            >> "$OUT"
  cat split/core.js            >> "$OUT"
  cat split/home.js            >> "$OUT"
  cat split/diet.js            >> "$OUT"
  cat split/medical.js         >> "$OUT"
  cat split/intelligence.js    >> "$OUT"
  cat split/sync.js            >> "$OUT"
  cat split/start.js           >> "$OUT"
```

`config.js` MUST precede `data.js`/`medical.js` because `currentRegion()`, `EMERGENCY_CONTACTS`, and `SEQUENCE_CRITICAL_IDS` are referenced from `medical.js` (the renderer). The `_scAssertSequenceIds` boot-time check is deferred via `setTimeout(_scAssertSequenceIds, 0)` so it runs after concatenated-script eval completes (post-`data.js`); see §2.5 code. Cipher Edict V grep-verifies the build.sh diff at impl.

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
                  (resolved at v2 fold: A-D2-K-7 → STUB; addJournalEntry
                  grep-confirmed absent on main; journal infra deferred)
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
[11a] Maren   → §7 PRE-Edict V contrast / opacity-sufficiency fixture
                (Kael A-D2-K-9 + Maren §7 hardening fold — D1 hotfix lesson
                absorbed; runs against the D2-A build branch BEFORE Cipher
                Edict V, NOT post-merge):
                · .sc-donot-callout text-on-tint (rgba 0.06/0.12) ≥4.5:1
                  on --bg AND --card, light + dark
                · .sc-back-channel text-on-tint (rgba 0.08/0.16) ≥4.5:1
                  on --bg AND --card, light + dark
                · --rose-deep border visibility, light + dark
                · zi-no-entry sprite legibility at fs-xs (title row) AND
                  fs-base (critical item row)
                · zi-emergency sprite legibility at fs-md (CTA row)
                If ANY surface fails: Lyra swaps to opaque token (--blush
                precedent) before Cipher Edict V runs.
[11] Cipher   → Edict V on D2-A impl (per D1 precedent — STRICT thresholds,
                grep gates including G-D2-9 SEQUENCE id resolution, build-
                time discovery review, helper purity where applicable,
                motion-budget audit, contract verification against ratified
                spec)
[12] Sovereign→ merges D2-A
[13] Lyra     → merges D2-B content snippet PR (post-D2-A merge per Build-
                rule 1 — non-negotiable)
[14] Cipher   → Edict V on D2-B (content-level: grep against shipped
                SYMPTOM_DB shape; verify no string-shape entries remain
                in flipped entries; HR-4 escHtml coverage on new array
                items)
[15] Maren    → §7 post-merge real-device verification (live site after
                D2-B merge + artifact regen): all D1 carry-forwards + D2-NEW
                surfaces in production (DO-NOT callouts with new ids,
                critical typography, numbered steps for 7-id set,
                progressive disclosure toggle, force-expanded emergency,
                footer-triad stubs firing "Coming soon" toasts, back-
                channel tiered copy, lifeThreat CTA, emergency-fallback
                dynamic-number, hospital-list suppression on default)
[16] Sovereign→ final merge / sign-off acknowledgment (D2 phase closed)
```

**No short-circuits.** Per spec-iteration discipline + V-M5 content-veto gate.

---

## 5. HR-by-HR audit (this spec) — operational sentences per V-K6

| HR | Status | Operationally, this means… |
|---|---|---|
| HR-1 | Reinforced | New sprites (`zi-no-entry`, `zi-emergency`, `zi-chevron-down`, `zi-save`, `zi-share`, `zi-track`) all land as `zi()` SVG, never raw emoji. Verified at impl by `grep -cE '\\u\\{1F\|\\u26[0-9A-F]'` over SC + DO-NOT + footer-triad surfaces → MUST equal 0. |
| HR-2 | Reinforced | All new colour / spacing / border via tokens. `.sc-donot-callout` border-left uses commissioned **`--rose-deep`** (SG-D2-DONOT-BORDER ratified); `--tc-danger` text; `--sp-*` paddings. Verified at impl by `grep -nE 'style="\|#[0-9a-f]{3,6}'` on modified surfaces → MUST return 0 for D2-introduced lines. Token addition explicit in `:root` + `[data-theme="dark"]` blocks. |
| HR-3 | Reinforced | All new actions (`scSaveResult`, `scShareResult`, `scTrackResult`) are stubs using `data-action` delegation. `<details>`/`<summary>` toggle uses native semantics — NO custom JS handler — extra HR-3 win. |
| HR-4 | Reinforced | Every SYMPTOM_DB array element interpolated via `escHtml()` per item. `_scAsArray` + `_scAsDoNotItems` shim outputs feed into render functions that all apply `escHtml`. Aurelius-authored entries are content (not user data) and pass through `escHtml` for defense-in-depth. |
| HR-5 | Reinforced | Token-driven spacing across all new layouts. Cipher Edict V verifies at impl. |
| HR-6 | Reinforced (HR-3 cross-ref) | Operationally identical to HR-3 row. |
| HR-7 | Reinforced | Helper returns string; caller writes via `.innerHTML`. New variant renderers (`renderResultCard*`) and primitives all return strings. `<details>` markup written via innerHTML (browser natively handles the disclosure semantics; no `.textContent` regression possible). |
| HR-8 | Reinforced | Share + Track footer-triad stubs DO use the "Coming soon" pattern via `showQLToast` per HR-8. NOT silent no-ops. |
| HR-9 | Reinforced | Full audit chain per §4 (Maren + Kael + Cipher + Sovereign + V-M5 content-veto gate + Cipher Edict V × 2 + Maren §7). D2 specifically inserts the Maren content-veto gate (step [8]) — the audit chain expands at the content boundary. |
| HR-10 | Reinforced | Progressive disclosure uses expand/collapse (`<details>`), NEVER `text-overflow: ellipsis`. Verified at impl by `grep -c 'text-overflow' split/styles.css` over D2-introduced lines = 0. |
| HR-11 | N/A | No currency. |
| HR-12 | N/A | No date construction in the renderer. Save is a STUB in D2; no `journalEntry` constructed. (When live wiring opens in a focused phase, `new Date().toISOString()` will be the canonical UTC-stable approach.) |

**Plus D2-introduced verification gates** (Cipher Edict V on D2-A + D2-B):

| Gate | Pattern | Verification |
|---|---|---|
| G-D2-1 | Shim coverage | `grep -nE '_scAsArray\\(' split/medical.js` returns calls for every render-time SYMPTOM_DB field access (`whatToDo`, `precautions`, `emergency`). Zero direct `escHtml(e.whatToDo)` (legacy bridge pattern) on D2-touched paths. |
| G-D2-2 | DO-NOT items use `zi-no-entry` prefix | `grep -nE 'class="sc-donot-item"' split/medical.js` — every emit includes `zi('no-entry')`. |
| G-D2-3 | Footer-triad gating + STUB | `grep -nE 'sc-footer-triad' split/medical.js` — emergency-tier emits only `sc-footer-save` child; warning/mild emit all three children. AND `grep -nE 'function scSaveResult\\(\|function scShareResult\\(\|function scTrackResult\\(' split/medical.js` — each handler body is a single `showQLToast(...)` call (no journal-write, no addJournalEntry reference). |
| G-D2-4 | `<details>` ↔ `<summary>` first-child + emergency `open` attr | Cipher static review: every `<details ... class="sc-disclosure">` has `<summary class="sc-disclosure-summary">` as IMMEDIATE first child (HTML invariant). AND emergency-tier emits `<details open class="sc-disclosure">` per SG-D2-PROGRESSIVE-DISCLOSURE-EMERGENCY-OVERRIDE; grep `<details open` count on emergency-render path ≥1. |
| G-D2-5 | `lifeThreat` rendering reachable only when `entry.lifeThreat === true` | `grep -nE 'renderLifeThreatCTA' split/medical.js` — every call is conditional on `m.entry.lifeThreat` (or `shown.some(...lifeThreat)` at the hoisted level). |
| G-D2-6 | `EMERGENCY_CONTACTS.{region}` lookup defaults safely + confidence gate on hospitals | `grep -nE 'EMERGENCY_CONTACTS\\[' split/*.js` — every lookup has `\|\| EMERGENCY_CONTACTS[DEFAULT_REGION]` fallback. AND `renderHospitalList` body checks `ctx.confidence === 'known'` before emitting the `<ul>`. |
| G-D2-7 | Shim removal NOT in D2 PR scope | Cipher Edict V on the D2-A PR confirms the shim `_scAsArray` is INTRODUCED, not removed. (Build-rule 2: removal in a future cleanup PR — grep-fixture gated.) |
| G-D2-8 | Save action is STUB | `grep -nE 'addJournalEntry\|firestore\|localStorage\\.setItem' split/medical.js` on the D2-A diff returns 0 hits in the SC save path. The `scSaveResult` body is a `showQLToast` no-op. Kael V-K2 sync-surface-delta rule trivially satisfied (no new sync surface). |
| **G-D2-9 (NEW v2)** | `SEQUENCE_CRITICAL_IDS` ids resolve to SYMPTOM_DB entries | **Manual cross-file check (Cipher E-D2-7 acknowledged):** Cipher executes a smoke check at impl: for each id in `SEQUENCE_CRITICAL_IDS` (config.js), `SYMPTOM_DB.find(e => e.id === id)` (data.js) MUST return truthy. The `_scAssertSequenceIds` setTimeout(0) IIFE in `config.js` provides the dev-mode runtime warn as a defensive backstop. Borderline-grep-checkable; documented manual layer is the canonical enforcement surface. Kael A-D2-K-5 drift-hazard mitigation. |
| **G-D2-10 (NEW v2)** | build.sh concat order with config.js | `head -50 split/build.sh \| grep -nE 'cat split/(config\|data)\\.js'` — `config.js` line MUST precede `data.js` line. Static verifiable. Kael A-D2-K-6 fold. |
| **G-D2-11 (NEW v2)** | V-K9 dead param drop | `grep -nE '_renderSymptomCheckerResults\\(' split/*.js` — signature MUST be `(matches, opts)`, NOT `(matches, ageMo, opts)`. Kael A-D2-K-11 / V-K9 fold (grep confirmed dead on main). |
| **G-D2-12 (NEW v2)** | Variant count = 2 | `grep -nE 'function renderResultCard' split/medical.js` — exactly 2 hits (`renderResultCardEmergency`, `renderResultCardNonEmergency`). No `renderResultCardWarning` / `renderResultCardMild` (Sovereign D1 collapse). |
| **G-D2-13 (NEW v2.1)** | `--rose-deep` token declaration in styles.css | `grep -nE '\\-\\-rose-deep:' split/styles.css` MUST return **≥2 hits** (one per `:root` light block + one per `[data-theme="dark"]` block). If the token isn't declared but is used as `var(--rose-deep)`, the border-color falls back to `currentColor` silently. Cipher E-D2-3 V-K6-GAP fold. |
| **G-D2-14 (NEW v2.1)** | new sprites declared in template.html | `grep -nE 'id="(zi-no-entry\|zi-emergency\|zi-chevron-down\|zi-save\|zi-share\|zi-track)"' split/template.html` MUST return **≥6 hits**. HR-1 covers raw-emoji absence; this gate covers sprite-presence (a sprite referenced via `zi('emergency')` but missing in template.html renders an invisible SVG `<use>`). Cipher E-D2-4 fold. |

---

## 6. §6.5.D2 phase contracts (re-stated for downstream inheritance)

**§6.5.D2 — Contracts shipped (mirrors §1 above per Cipher C-D1-1 discipline):**

```
6.5.D2 — Contracts shipped (D2 extends D1's §6.5.D1) — v2 reconciled:
  · SYMPTOM_DB array shape — whatToDo / precautions / emergency as string[];
    doNot as [{text, critical?}]; lifeThreat: boolean on emergency entries
  · Dual-read shim (_scAsArray, _scAsDoNotItems) + dev-mode console.warn
    on string-shape read — present until grep-fixture-gated cleanup PR
    (Build-rule 2)
  · _scAsDoNotItems filters empty-text items (no silent corruption surface)
  · .sc-donot-callout component — 2px solid --rose-deep (newly commissioned
    token) left-edge border + tinted bg + per-item zi-no-entry prefix
  · Critical-DO-NOT typography — fs-base Nunito 800 with underline OR
    boxed treatment for critical: true items
  · Footer-triad severity-gating — Save-only slot on emergency; full
    triad on warning/mild. ALL three actions (Save/Share/Track) are
    STUBS in D2 firing "… — coming soon" toasts (live wiring deferred)
  · Component decomposition — 11 primitives + 2 variant components
    (renderResultCardEmergency, renderResultCardNonEmergency)
    [Sovereign D1 collapsed Warning+Mild → NonEmergency per V-K4]
  · Progressive disclosure — <details>/<summary> with severity + title +
    1-line summary + primary action on first paint; COLLAPSED on
    warning/mild; FORCE-EXPANDED on emergency (SG-D2-PROGRESSIVE-
    DISCLOSURE-EMERGENCY-OVERRIDE)
  · Numbered <ol> for SEQUENCE_CRITICAL_IDS (initial 7-id set;
    extensible via content-veto rounds); bulleted <ul> elsewhere
  · Back-channel callout (.sc-back-channel) — tiered copy (mild gentle;
    warning sharper); unconditional on warning/mild; D3 refines to
    triage-derived-only
  · Render-policy module config.js (new) — EMERGENCY_CONTACTS.{region},
    DEFAULT_REGION, SEQUENCE_CRITICAL_IDS, currentRegion() returning
    {region, confidence} for hospital-list suppression
  · _renderSymptomCheckerResults signature (matches, opts) — ageMo
    dropped per V-K9
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

Build-rule 2 — Shim removal (vision §5.2, D2 application; v2 fold per
                 Kael A-D2-K-2 — falsifiable trigger; v2.1 Cipher E-D2-5
                 QA-procedure spec):
   Shim removal NEVER lands in D2 or D3. Defer to a future cleanup PR
   whose precondition is BOTH of:
     (a) the verifiable grep fixture below returns 0 on all 3 patterns
         (no string-shape entries remain in data.js);
     (b) zero dev-mode console.warn outputs from `_scAsArray`
         (the [sc-shim] line) during a QA pass.

   Cipher E-D2-5 QA-procedure specification for (b):
     - Load the built artifact with window.SPROUTLAB_DEV_MODE = true
       (set via DevTools console pre-render OR via a build flag in the
       future cleanup PR's QA build).
     - Exercise the Symptom Checker by entering every entry id's
       primary keyword OR by triggering each match path; observe
       browser console.
     - Console MUST be free of `[sc-shim]` warn lines for the full
       SC exercise. Any non-zero count blocks shim removal — the
       offending entry has not yet flipped to array-shape.

   NO "telemetry-confirmed" handwave — both legs are operationally
   checkable. Cipher Edict V re-pass required before shim removal.

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
| `styles.css` | + `--rose-deep` token commission (light+dark, ~4 lines) + ~150 lines (DO-NOT, critical typography, numbered/bulleted, progressive disclosure, footer-triad, back-channel tiered, lifeThreat CTA, hospital list, prefers-reduced-motion parity) | — |
| `config.js` **(NEW)** | `EMERGENCY_CONTACTS` + `DEFAULT_REGION` + `SEQUENCE_CRITICAL_IDS` + `currentRegion()` + `_scAssertSequenceIds` (~60 lines) | — |
| `data.js` | (no D2-A change; D2-B flips entries) | + SYMPTOM_DB ~22 entries flipped to array-shape + `doNot` + `lifeThreat` + `summary` + optional `triage`/`triageQuestions` on 5 entries |
| `medical.js` | shim (`_scAsArray` + `_scAsDoNotItems` with empty-text filter) + 11 primitives + 2 variant components + 3 stub action handlers + helper refactor + `ageMo` dead-param drop (~250 lines net add; ~50 lines removed in helper restructure) | — |
| `intelligence.js` | (no change) | — |
| `core.js` | (no change — `addJournalEntry` NOT introduced per SG-D2-FOOTER-SAVE-WIRING STUB) | — |
| `build.sh` | + 1 `cat split/config.js` line BEFORE `cat split/data.js` (per §3.1 diff) | — |

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
| `EMERGENCY_CONTACTS.{region}.emergencyFallback.number` + fallback copy | D2 | config + render | **Safety-critical** — fallback link is the parent's lifeline when 108 fails. Copy upgraded from "Or 112" to "If 108 unavailable, call 112" per Maren C-D2-M-9. |
| `currentRegion().confidence` flag | D2 | config helper | **Safety-adjacent** — gates hospital-list rendering. If `'default'` (D2 default for all users), hospital list suppressed to avoid presenting Jamshedpur-specific phone numbers to non-Jamshedpur parents. 108/112 CTAs remain (108 is national). Maren C-D2-M-6 fold. |
| `SEQUENCE_CRITICAL_IDS` location | D2 | render-policy module | **Safety-critical** — if the constant lives in renderer (`medical.js`) and a content author flips an id in `data.js`, the numbered-list gate silently breaks with no warning. v2 fold: lives in `config.js` co-located with EMERGENCY_CONTACTS; G-D2-9 verifies id resolution. Kael A-D2-K-5. |
| Progressive disclosure default per severity | D2 | render gate | **Safety-critical on emergency** — collapsing emergency-tier body behind a tap hides safety-recognition criteria. SG-D2-PROGRESSIVE-DISCLOSURE-EMERGENCY-OVERRIDE forces `<details open>` on emergency. Maren C-D2-M-2. |
| Save action wiring | D2 | renderer | **Safety-adjacent (deferred)** — STUB in D2 per Sovereign decision; live wiring (with undo per Maren C-D2-M-3) deferred to a focused phase. STUB itself is safe (HR-8 toast pattern; honest about state). |

---

## 9. Sub-Sovereign-gates (v2 status)

Three gates ratified by Sovereign decision in v2 (D1/D2/D3 of synthesis). Two amended in v2 per audit folds. One new gate surfaced by Maren P0 finding. The remaining four stay at default, pending ratification.

| ID | Source | v2 Status | Resolution / amendment-effect |
|---|---|---|---|
| **SG-D2-EMERGENCY-SPRITE** | V-M3 visual-distinction precedent | **Default pending** — NEW `zi-emergency` | Maren + Kael both concur on NEW (avoids `zi-siren` conflation with section-header use). |
| **SG-D2-DONOT-BORDER** | V-M3 #1 | **Sovereign-ratified (D3)** — **commission `--rose-deep`** at 2px | New token added to styles.css `:root` + `[data-theme="dark"]`. §2.3 CSS uses `border-left: 2px solid var(--rose-deep);`. Maren §7 contrast fixture verifies pre-Edict V. |
| **SG-D2-PROGRESSIVE-DISCLOSURE-DEFAULT** | G3 + V-M / V-K UX call | **Default pending** — collapsed (warning/mild) | Kael concurs unconditionally; Maren concurs for warning/mild only. Emergency split out into the new override below. |
| **SG-D2-PROGRESSIVE-DISCLOSURE-EMERGENCY-OVERRIDE** (NEW v2) | Maren C-D2-M-2 P0 | **Default pending** — **force-expanded on emergency** | Emergency-tier renderer emits `<details open class="sc-disclosure">`. Rationale: a panicking parent shouldn't need a tap to see emergency-recognition criteria. G-D2-4 verifies `open` attribute on emergency render path. |
| **SG-D2-CONFIG-MODULE** | Kael jurisdiction call | **Amended (v2 fold)** — `config.js` AND co-located with `SEQUENCE_CRITICAL_IDS` | Original default proposed `config.js` for `EMERGENCY_CONTACTS` only; Kael A-D2-K-5 objected (drift hazard if SEQUENCE_CRITICAL_IDS stays in `medical.js`). v2 amendment: `config.js` absorbs both. G-D2-9 + G-D2-10 verify. |
| **SG-D2-FOOTER-SAVE-WIRING** | G10 + V-M5 + Sovereign sequencing call | **Sovereign-ratified (D2)** — **STUB** | All three actions (Save/Share/Track) fire `showQLToast('… — coming soon')`. `addJournalEntry` grep-confirmed absent from main; live wiring deferred to a focused phase. Maren's C-D2-M-3 undo caveat auto-resolves (no live write → no undo needed). G-D2-3 + G-D2-8 verify. |
| **SG-D2-CONTENT-VETO-ROUNDS** | V-M5 | **Default pending** — 3 rounds, with Maren reserve-extension authority | Maren caveat: 3 rounds is the floor; Maren reserves the right to call a 4th round at her discretion when a D2-B entry is materially unsafe. Sovereign escalation remains the canonical exit (not mandatory at round 3). |
| **SG-D2-SEQUENCE-CRITICAL-IDS** | V-M / Maren content-veto territory | **Amended (v2 fold)** — initial 7-id set (extensible) | Original default 3 ids; Maren C-D2-M-1 P0 found this under-populated. v2 amendment: `fall-injury`, `vomiting`, `fever-high`, `choking`, `seizure`, `breathing-difficulty`, `head-injury`. Aurelius/Maren confirm per-entry that `whatToDo` is actually a sequence in D2-B; `allergic-reaction`, `burn`, `dehydration` are content-veto-round candidates for inclusion. |
| **SG-D2-BACK-CHANNEL-GATING** | V-M2 #3 + D2-vs-D3 cut | **Default pending** — unconditional on warning/mild | Both governors concur. Maren C-D2-M-7 added tiered copy fold (mild gentle; warning sharper) — implementation-level refinement, not gating change. |

**Sovereign-ratified in v2:**
- **D1 (variant collapse, Kael A-D2-K-3):** Warning + Mild variant components collapse to `renderResultCardNonEmergency({backChannel, footerMask})`. Net: 11 primitives + 2 variants. G-D2-12 verifies.
- **D2 (Save wiring, Kael A-D2-K-7):** SG-D2-FOOTER-SAVE-WIRING = STUB. `addJournalEntry` absent from main (grep-confirmed); journal infrastructure deferred to a focused phase.
- **D3 (DO-NOT border, Maren C-D2-M-4):** SG-D2-DONOT-BORDER = commission `--rose-deep` at 2px.

**Amendment protocol:** Sovereign overrides any pending SG default by stating the override; Lyra revises v3 in-place. Single round of audit re-run only if an SG change affects audit-chain shape.

---

## 10. Forward-pointer (downstream)

D2 ships the structural foundation + content. Downstream:

- **D3 spec(s)** open post-D2-B merge AND post-weave-ISL-mini-spec re-confirm (mini-spec is already ratified canon per PR #68; D3 consumes by reference). D3 splits at Lyra's discretion: triage / weave / footer-triad-completion / voice / promote.
- **Future shim cleanup PR** — opens once the grep-fixture preconditions (§7 Build-rule 2 verifiable patterns) are met AND zero dev-mode `console.warn` outputs from `_scAsArray` are observed during QA. Cipher Edict V re-pass required (Build-rule 2).
- **D2-B Aurelius content snippet PR** — co-traveller; opens after this spec ratifies + Aurelius receives the D2-B brief. Maren content-veto gate inserted (step [8] in §4).
- **EMERGENCY_CONTACTS region expansion** — D3 settings-panel scope (user-selectable region); D2 ships only the Jamshedpur default. Per-region override = D3 work.

---

## 11. Changelog

- **v1 (2026-05-14):** initial draft. Ships §6.5.D2 phase contracts. Inherits from vision v2.1 §6.D2 + D1 phase-spec v3.1 (post-merge). Absorbs `lifeThreat` slipped from D1 per SG-D1-LT default ratified — `EMERGENCY_CONTACTS.{region}` config + `renderLifeThreatCTA` primitive folded in. Incorporates inline skill register-flips during drafting: Cipher (§1 contract-mirror discipline), Kael (§2.2 shim ordering + §2.6 `<details>` a11y + §2.10 primitive-extraction policy), Maren (§2.5 SEQUENCE_CRITICAL_IDS render-vs-data decision + §2.8 footer-triad gating Care lens). Eight sub-Sovereign-gates surfaced. Awaits Maren ‖ Kael parallel audit.

- **v2 (2026-05-15):** Maren ‖ Kael parallel audit folded + Sovereign decisions ratified. Both governors issued **PASS WITH CAVEATS**. Net: 4 P0 / 10 P1 / 6 P2 findings absorbed; 3 Sovereign decisions applied.

  **Maren P0 folds:**
  - C-D2-M-1: `SEQUENCE_CRITICAL_IDS` extended from 3 → 7 ids (added choking, seizure, breathing-difficulty, head-injury; allergic-reaction/burn/dehydration are content-veto-round candidates).
  - C-D2-M-2: New `SG-D2-PROGRESSIVE-DISCLOSURE-EMERGENCY-OVERRIDE` surfaced — emergency-tier force-expands (`<details open>`); collapsed default retained for warning/mild only.
  - C-D2-M-3: Save-on-emergency undo caveat — auto-resolved by Sovereign D2 (STUB; no live write).

  **Maren P1 folds:**
  - C-D2-M-4: SG-D2-DONOT-BORDER amended to commission `--rose-deep` (Sovereign D3).
  - C-D2-M-5: §7 fixture extended to include `zi-no-entry` sprite legibility at fs-xs + fs-base.
  - C-D2-M-6: `currentRegion()` returns `{region, confidence}`; hospital-list suppression when confidence is 'default' (new `renderHospitalList` primitive).
  - C-D2-M-7: Back-channel copy tiered per severity (mild gentle; warning sharper).

  **Maren P2 folds:**
  - C-D2-M-8: `_scAsDoNotItems` filters empty-text items (also covered by Kael A-D2-K-1 — same finding).
  - C-D2-M-9: lifeThreat fallback copy upgraded from "Or 112 (unified emergency)" to "If 108 unavailable, call 112".

  **Kael P0 fold:**
  - A-D2-K-5: `SEQUENCE_CRITICAL_IDS` moved from `medical.js` (renderer) to `config.js` (render-policy); G-D2-9 verifies every id resolves to a SYMPTOM_DB entry; SG-D2-CONFIG-MODULE scope amended to absorb it.

  **Kael P1 folds:**
  - A-D2-K-1: `_scAsDoNotItems` empty-text filter (overlap with C-D2-M-8).
  - A-D2-K-2: Build-rule 2 cleanup trigger rewritten — grep-verifiable fixture + dev-mode `console.warn` replaces "telemetry-confirmed" handwave.
  - A-D2-K-3: Sovereign D1 — variant collapse from 3 → 2 (`renderResultCardEmergency` + `renderResultCardNonEmergency({backChannel, footerMask})`). G-D2-12 verifies.
  - A-D2-K-4: `renderLifeThreatCTA` annotated "promote-on-D3-second-caller, otherwise inline-back" in Kael register-flip and build-PR commit body.
  - A-D2-K-7: Sovereign D2 — SG-D2-FOOTER-SAVE-WIRING STUB. `addJournalEntry` grep-confirmed absent on main; journal infrastructure deferred.
  - A-D2-K-9: §7 contrast / opacity-sufficiency fixture moved to PRE-Edict V step `[11a]` in audit chain — D1 hotfix lesson absorbed.

  **Kael P2 folds:**
  - A-D2-K-6: Explicit `build.sh` concat-order diff with `config.js` insertion BEFORE `data.js`. G-D2-10 verifies.
  - A-D2-K-8: `<details>` + HR-3 compatibility noted PASS (no fold required).
  - A-D2-K-10: Build-rules enforceability noted acceptable; G-D2-4 formalised as static check on emergency `open` attribute.
  - A-D2-K-11: V-K9 fold — `_renderSymptomCheckerResults` drops `ageMo` dead param (grep of main confirmed unused). Signature now `(matches, opts)`. G-D2-11 verifies.

  **Sovereign decisions:**
  - D1: Variant collapse 3 → 2 (V-K4 "split where it earns").
  - D2: SG-D2-FOOTER-SAVE-WIRING = STUB (no `addJournalEntry` on main; defer journal infrastructure).
  - D3: SG-D2-DONOT-BORDER = commission `--rose-deep` at 2px.

  **New verification gates:** G-D2-9 (SEQUENCE id resolution), G-D2-10 (build.sh order), G-D2-11 (V-K9 signature), G-D2-12 (variant count = 2). Now 12 D2-specific gates total.

  **Audit chain expansion:** new step `[11a]` Maren §7 PRE-Edict V contrast / opacity fixture (between Mode-2 build draft and Cipher Edict V).

  **Sub-SG status:** 3 Sovereign-ratified (D1/D2/D3), 2 amended via fold (CONFIG-MODULE scope, SEQUENCE-CRITICAL-IDS set), 1 new (PROGRESSIVE-DISCLOSURE-EMERGENCY-OVERRIDE), 4 pending default. Total: 9 SGs.

  Awaits Cipher Edict V STRICT on v2 → Sovereign ratification → Aurelius D2-B brief → audit chain proceeds.

- **v2.1 (2026-05-15):** Cipher Edict V STRICT folded — **PASS WITH NOTES** verdict (2 P1 + 5 P2 findings absorbed; no RE-ROUND required). v2 cleared the higher-bar post-RE-ROUND threshold; v2.1 sweep absorbs all 7 findings for a clean Sovereign-ratification artifact.

  **Cipher P1 folds:**
  - **E-D2-1 (§1 ↔ §6 mirror divergence):** added 3 rows to §1 inherited-contract table — row 11 (renderer applies numbered/bulleted render-policy from config.js), row 12 (`_renderSymptomCheckerResults(matches, opts)` ageMo dropped per V-K9), row 13 (triage data shape — D2 ships data, D3 renders). §1 now has 13 rows matching §6.5.D2's 13 bullets; mirror discipline restored to row-for-row per Cipher register-flip at §1.
  - **E-D2-3 (missing `--rose-deep` token-declaration gate):** added **G-D2-13** (`grep -nE '\-\-rose-deep:' split/styles.css` MUST return ≥2 hits — light + dark theme blocks). V-K6-GAP closed; the §7 contrast fixture remains the visual backstop.

  **Cipher P2 folds:**
  - **E-D2-2 (audit-chain step [3] Kael brief stale phrasing):** added parenthetical "(resolved at v2 fold: A-D2-K-7 → STUB; addJournalEntry grep-confirmed absent on main; journal infra deferred)" to disambiguate the historical audit-time question from current state.
  - **E-D2-4 (missing `zi-emergency` sprite-presence gate):** added **G-D2-14** covering all 6 new sprites in template.html. HR-1 covers raw-emoji absence; G-D2-14 covers sprite-defined-in-template invariant (a `zi('emergency')` call referencing a missing template definition renders an invisible `<use>`).
  - **E-D2-5 (Build-rule 2 QA-procedure under-specified):** expanded Build-rule 2 with explicit QA procedure for the "zero `[sc-shim]` console.warn during QA" precondition — load with `window.SPROUTLAB_DEV_MODE = true`, exercise every SC entry, console must be free of `[sc-shim]` lines.
  - **E-D2-6 (`.sc-back-channel-mild` class emitted with no CSS rule):** added explicit empty rule for symmetry / future-edit safety; renderer class-emit contract preserved.
  - **E-D2-7 (G-D2-9 borderline grep-checkability):** explicit "Manual cross-file check (Cipher E-D2-7 acknowledged)" note added to the gate description; the deferred `_scAssertSequenceIds` setTimeout(0) IIFE remains as dev-mode runtime backstop.

  **New gates:** G-D2-13 (--rose-deep token declaration), G-D2-14 (new sprites in template.html). Now 14 D2-specific gates total.

  **Canon-promotion candidates surfaced by Cipher (queued for separate Cipher pass; not blocking):**
  1. `confidence: 'known' | 'default'` region-aware rendering pattern (§2.11)
  2. Dual-read shim with dev-mode warn-on-old-shape (§2.2 + Build-rule 2 grep-fixture trigger)
  3. Audit-chain step [11a] PRE-Edict V contrast / opacity fixture (D1-hotfix discipline)
  4. Variant-count = 2 collapse policy / V-K4 codification (§2.10 + G-D2-12)
  5. Render-policy module co-location (`config.js` for EMERGENCY_CONTACTS + SEQUENCE_CRITICAL_IDS)

  Awaits Sovereign ratification on v2.1.
