# Lyra Spec — 2026-05-13 — Symptom Checker D1 Polish (severity rail + sticky CTA + severity-aware doctor-card)

**Author:** Lyra (Builder, The Weaver)
**Mode:** 1 (spec authoring; signed audit-bearing artifact per canon-cc-022)
**Status:** v3.1 — Cipher Edict V STRICT RE-AUDIT verdict PASS; NEW-C-D1-6 P2 swept; Sovereign-ratified 2026-05-13
**Branch:** `claude/d1-and-weave-isl-specs` (or successor)
**Parent spec:** `lyra-spec-2026-05-11-symptom-checker-ux-vision.md` v2.1 — this implements §6.D1 + ships §6.5.D1 phase contracts
**Predecessor spec:** `lyra-spec-2026-05-11-symptom-checker-hr1-dry.md` v3 — bridge build (Mode-2 merged 2026-05-13 as PR #67 → 7342d5d artifact regen). SG-5 tight-sequencing fires now.
**Trigger:** SG-5 tight-sequencing per Maren B-M3 — D1 phase-spec opens IMMEDIATELY on bridge-build merge with no intermediate work between.

---

## 0. Scope

### 0.1 In-scope

D1 is the **Polish** phase. It restructures the Symptom Checker result card without rewriting content. Per vision v2.1 §6.D1 deliverables list, expanded with v2 phase-contracts §6.5.D1 commitments:

1. **`.sc-rail` left-edge severity strip** on every result card — rose / amber / sage rail token; renders as a 4px wide left-edge accent bar inside the result card padding, visible through the entire scroll length of the card body. **Rose pulse-glow runs once on emergency entrance only** (1.5s, then steady — see §8 motion budget).
2. **Sticky doctor-CTA footer on emergency cards** (Home overlay path ONLY — see asymmetry note below) — `position: sticky; bottom: 0;` within the modal scroll container; transitions in shadow-grow on scroll past 100px. Sticky-CTA padding rule for modal scroll container: `padding-bottom ≥ sticky-CTA height` to prevent CTA from covering DO-NOT or emergency-criteria content (V-M1 #5 + V-M3 fold; verification fixture per §7). **Sticky footer renders the call CTA + phone number ONLY — does NOT mirror doctor name, title, or address (V-M3 fold).** Hoisted-top doctor card is the full-detail surface; sticky footer is the duplicate-action thumb-reach insurance, not duplicate information.
3. **Severity-aware doctor-card hierarchy** (V-K3 #2 + bridge B-M3) — **flip ships from day one, no unconditional render then re-differentiation.** Three variants:
   - **Emergency** (`severity === 'emergency'`): doctor card hoists to top of result card; phone number primary (`fs-md` Nunito-700, ≥60×60 tap), name as caption beneath (`fs-xs` Nunito-500); secondary "View doctor info" link below.
   - **Warning** (`severity === 'warning'`): doctor card mid-card (post-WHEN-TO-ESCALATE section); softer "📞 Dr. RK Agarwal — call if needed" pattern; phone is `fs-base` Nunito-600.
   - **Mild** (`severity === 'mild'`): doctor card de-emphasised below the Track CTA (when Track exists; else below body); phone is `fs-sm` Nunito-500; minimal visual weight.
4. **Doctor-card gating** folded into D1 (bridge §0.2 → D1 explicit per Maren B-M3): render condition unchanged from bridge (`hasEmergency || some entry.callDoctor === true`). What changes is the **visual hierarchy** per the variant table above — gating logic stays as it is in `_renderSymptomCheckerResults` post-bridge.
5. **Emergency-tier layout reflow** — primary CTA moves to **top** of result card (G2: one primary action per state). Hierarchy for emergency cards becomes: rail > severity badge > title > **doctor card (call CTA top)** > WHEN TO SEEK CARE > WHAT TO DO > body > sticky-footer mirror of doctor card.
6. **Contrast-verification fixture for all 6 severity × theme combos** (V-M6 #4 + bridge §8.2 carry-forward) — D1 cannot ship without this. See §7.
7. **`prefers-reduced-motion: reduce` override** on every animated rule D1 introduces (V-M6 #3). See §8 motion budget.
8. **Touch-target codification:** all interactive elements ≥44×44 CSS px; emergency primary CTA ≥60×60 CSS px (V-M6 #5; iOS HIG + WCAG 2.2 SC 2.5.8). See §9.
9. **Optional: `lifeThreat` rendering** for primary emergency-services CTA. **Default per Sovereign opening: SLIP TO D2** unless Sovereign explicitly green-lights D1 inclusion at this spec's ratification. Reason: shipping `lifeThreat` requires (a) `data.js` SYMPTOM_DB shape change to add `lifeThreat: boolean`, (b) Aurelius content review on which entries qualify, and (c) the locale config `emergencyContacts.{region}` table from Appendix A. All three are D2 work. Adding to D1 expands scope past Polish-CSS-only.

### 0.2 Out-of-scope (explicitly deferred per vision v2.1 phase boundaries)

- Content rewrite of ~22 SYMPTOM_DB entries (D2 — Aurelius snippet PR co-traveller, Maren content-veto gated per V-M5)
- DO-NOT callouts with critical-tier rendering (D2)
- Numbered sequences for time-critical entries (D2 — `whatToDo: string → string[]` migration)
- Per-item DO-NOT iconography (`zi-no-entry` per item) (D2)
- Critical-DO-NOT typography pass (`Nunito 800 fs-base` underlined) (D2)
- Progressive disclosure (`<details>`/`<summary>`) (D2)
- Triage flow + chip-order rule + false-negative back-channel + 3-question cap (D3)
- Lyra-weave history micro-card (D3 — consumes weave-ISL mini-spec contract)
- Voice input (D3)
- Footer triad: Save / Share / Track (D3 — severity-gated per G10 v2)
- Symptom → CareTicket promotion flow (D3)
- The QA Smart Symptom info card (`qaHandleSymptom` in `intelligence.js:~2286`) — **separate render path**, not the SC modal. Maren sign-off note from bridge §8.2 verification flagged this as a future audit candidate; not D1.

### 0.3 Why spec-first

D1 touches:
- **Care jurisdiction**: `medical.js` (severity-aware doctor-card hierarchy in `_scDoctorCardHTML` — re-shape per variant; `_renderSymptomCheckerResults` helper — emergency-tier hoist of doctor card)
- **Intelligence jurisdiction**: `intelligence.js` (no direct edit if helper accepts new `opts` param, else thin update at the call site)
- **Shared modules**: `styles.css` (extensive — rail, sticky-CTA, doctor-card variants, motion overrides, prefers-reduced-motion); possibly `template.html` (no new sprites unless Sovereign green-lights `lifeThreat` opportunistic)

Per canon-cc-008, mandates parallel Maren + Kael Governor audit on this spec before any line of code changes.

### 0.4 Carry-overs from bridge §8.2 verification

Maren signed off on bridge §8.2 with these standing observations that fold into D1 verification fixture:
- Light-mode `.sc-mild .sc-sev-badge` parallel-bump (spec §5 edit #9): **NOT NEEDED**, formally retired
- All 6 severity × theme combos visually pass at bridge merge (manifest 2026.05.13-1)
- D1 introduces `.sc-rail` and severity-aware doctor-card variants — **net new contrast surfaces**. Verification fixture re-validates these against same WCAG-AA bar.

---

## 1. Inherited contracts (vision v2.1 §6.5.D1 — mirrored as implementation contract)

This spec ships these contracts. Cipher Edict V at impl verifies presence. Downstream phases inherit (D2 may extend; D3 may extend additively):

| # | Contract | Rationale |
|---|---|---|
| 1 | Class `.sc-rail` with role: severity strip, decorative | Visual severity anchor through scroll (G6) |
| 2 | `.sc-rail` DOM position: first child of `.sc-result.sc-{severity}` | Predictable selector for D2/D3 additive extensions |
| 3 | Sticky-CTA scroll container: the modal scroll container, NOT document | Sticky-relative-to-modal so the CTA stays accessible without depending on document scroll position |
| 4 | Doctor-card hierarchy: severity-aware (emergency=top, warning=mid, mild=de-emphasised) | G2 one-primary-action-per-state; matches severity stress curve |
| 5 | Rail scope: result-card only (D3 may extend to triage card via additive rule) | Bounded surface; D3 doesn't refactor D1's selector |
| 6 | Touch-target floor: 44×44 (interactive); 60×60 (emergency primary CTA) | iOS HIG + WCAG 2.2 SC 2.5.8 + thumb-reach-under-stress |
| 7 | `prefers-reduced-motion: reduce` override exists for every animated rule introduced in D1 | Vestibular-sensitive parents on dark mode at 2am are real and disproportionately the ones up at 2am |
| 8 | `.sc-result { position: relative }` — descendant absolute-positioned elements anchor here | Required for `.sc-rail`; permanent constraint downstream. D2/D3 additions that introduce new absolute children must verify intentional anchoring (V-K13 fold) |
| 9 | Single-render doctor-card discipline — one card per result-list, not per-match (Kael V-K skill-flip at v1 drafting; codified in §2.4.1) | Eliminates duplicate-render bug class; emergency hoist-top + sticky-footer mirror express "one action, two surfaces" without violating single-render |
| 10 | No-doctor emergency fallback — text-only fallback note in the no-doctor render on emergency tier (V-M2 fold); `lifeThreat` number rendering deferred to D2 | Care P0 worst-case: parent in active emergency, no doctor saved, needs a next motor action; static text bridges the gap until D2 ships `emergencyContacts.{region}` config |

> **🎩 Cipher (skill register-flip):** the contract list above duplicates §6.5.D1 of vision v2.1. That's intentional per canon-cc-022 — phase-specs are self-contained for downstream review (Cipher Edict V on D1's impl reads only this spec, not vision v2.1, when confirming contract surface).

---

## 2. Per-deliverable specification

### 2.1 `.sc-rail` severity strip (G6 partial)

**Target structure:**

```html
<div class="sc-result sc-{emergency|warning|mild}">
  <div class="sc-rail" aria-hidden="true"></div>   <!-- D1 NEW; first child -->
  <span class="sc-sev-badge">{zi+text}</span>      <!-- bridge-shipped -->
  <div class="sc-title">{escHtml(title)}</div>
  <!-- ...sections... -->
</div>
```

**CSS:**

```css
.sc-result {
  position: relative;       /* D1 NEW; required for absolute-positioned rail */
  /* existing padding stays; rail sits inside the padding */
}
.sc-rail {
  position: absolute;
  top: var(--sp-8);          /* match top padding */
  bottom: var(--sp-8);       /* match bottom padding */
  left: var(--sp-4);         /* nudge into card */
  width: 4px;
  border-radius: 2px;
  pointer-events: none;
}
.sc-emergency .sc-rail { background: var(--rose-deep); }
.sc-warning   .sc-rail { background: var(--amber-deep); }
.sc-mild      .sc-rail { background: var(--sage-deep); }

[data-theme="dark"] .sc-emergency .sc-rail { background: var(--tc-rose); }
[data-theme="dark"] .sc-warning   .sc-rail { background: var(--tc-warn); }
[data-theme="dark"] .sc-mild      .sc-rail { background: var(--tc-sage-light); }
```

**Emergency entrance pulse-glow** (one-time, 1.5s, then steady — V-K5 + V-M6 #3 reduced-motion override):

```css
.sc-emergency .sc-rail {
  animation: sc-rail-pulse 1.5s ease-out 1;   /* runs once on first paint */
}
@keyframes sc-rail-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(220,60,60,0); }
  50%  { box-shadow: 0 0 8px 2px rgba(220,60,60,0.5); }
  100% { box-shadow: 0 0 0 0 rgba(220,60,60,0); }
}
@media (prefers-reduced-motion: reduce) {
  .sc-emergency .sc-rail { animation: none; }
}
```

**Renderer change** (`_renderSymptomCheckerResults` in `medical.js`):

Inside the `shown.forEach(...)` block, after `html += '<div class="sc-result ' + sevClass + '">';`, prepend the rail:

```js
html += '<div class="sc-result ' + sevClass + '">';
html += '<div class="sc-rail" aria-hidden="true"></div>';  // D1 NEW
html += '<span class="sc-sev-badge">' + sevLabel + '</span>';
// ...
```

> **🎩 Maren (skill register-flip):** `aria-hidden="true"` is deliberate — the rail is decorative; severity is communicated to AT users by the badge text + section structure. Don't add the rail to the SR reading order.

### 2.2 Sticky doctor-CTA footer on emergency cards — Home-overlay-only

**Surface asymmetry (V-K8 fold, P0 resolution):** the SC has TWO render entry points with DIFFERENT container topology:

| Path | Container | Scroll behavior | Sticky-footer applicability |
|---|---|---|---|
| **Home overlay** | `#homeSymptomOverlay > .modal` (created dynamically by `openHomeSymptomChecker()` in `intelligence.js:11873`; inline-styled `max-height:85vh; overflow-y:auto`) | True modal scroll container | **Sticky-footer SHIPS** |
| **Medical tab** | `#symptomResult` (inline div in `template.html:711`, page-level scroll) | NO modal scroll container; result renders inline within the Medical-tab page; page-level `<body>` scroll | **Sticky-footer DOES NOT SHIP on this path** — `position: sticky` against page-scroll would either anchor to viewport-bottom always (intrusive) or no-op (depending on ancestor `overflow` chain). Hoisted-top doctor card is the only emergency-CTA surface on Medical tab in D1. |

This asymmetry is **intentional and documented**, not a defect. D2 may revisit (e.g., refactor Medical tab SC into its own modal for parity); D1 ships the asymmetry as-is.

**Target structure (Home overlay path only):**

```html
<div class="sc-result sc-emergency">
  <!-- ...rail, badge, title... -->
  <div class="sc-doctor-card sc-doctor-card-emergency">  <!-- top, hoisted -->
    <a class="sc-call-primary" href="tel:..." style="...">
      {zi('phone')} Call Now: +91 98351 67975
    </a>
    <div class="sc-doctor-name">Dr. RK Agarwal · Pediatrician</div>
  </div>
  <!-- ...sections... -->
  <div class="sc-sticky-footer">     <!-- ONLY on Home overlay path; ONLY on emergency tier -->
    <a class="sc-call-primary" href="tel:...">
      {zi('phone')} Call Now: +91 98351 67975
    </a>
  </div>
</div>
```

**CSS:**

```css
.sc-sticky-footer {
  position: sticky;
  bottom: 0;
  z-index: 2;
  margin: var(--sp-8) calc(-1 * var(--sp-12)) calc(-1 * var(--sp-12));
  padding: var(--sp-10) var(--sp-12);
  background: var(--surface-danger);
  border-top: 1px solid rgba(220,60,60,0.2);
  box-shadow: 0 -2px 8px rgba(0,0,0,0);
  transition: box-shadow 200ms ease-out;
}
.sc-sticky-footer.is-pinned {
  box-shadow: 0 -2px 8px rgba(0,0,0,0.12);
}
@media (prefers-reduced-motion: reduce) {
  .sc-sticky-footer { transition: none; }
}
```

**Modal scroll container padding-bottom rule** (V-M1 #5 — Home overlay only):

```css
#homeSymptomOverlay > .modal { padding-bottom: 60px; }
```

(Single selector — confirmed via spec-time read of `intelligence.js:11873`. NO Medical-tab parallel because Medical-tab path has no modal container.)

**JS — pin shadow on scroll past 100px (Home overlay only):**

```js
function _scInitStickyShadow(container) {
  if (!container || container.dataset.scStickyInit === '1') return;  // V-K11 + V-M9 idempotency guard
  container.dataset.scStickyInit = '1';
  var footer = container.querySelector('.sc-sticky-footer');
  if (!footer) return;
  container.addEventListener('scroll', function() {
    footer.classList.toggle('is-pinned', container.scrollTop > 100);
  }, { passive: true });
}
```

Called from `openHomeSymptomChecker()` after the overlay is appended to body, with `_scInitStickyShadow(document.querySelector('#homeSymptomOverlay > .modal'))`. **Single call site (V-K11 fold)** — no Medical-tab parallel call. The `dataset.scStickyInit` guard makes the function idempotent against re-open: if user opens Symptom Checker, closes, re-opens, the new modal element is a fresh DOM node (the existing one is `.remove()`'d in `closeHomeSymptomChecker`), so the dataset flag will not be set. If a future refactor reuses the modal element, the guard prevents listener stacking.

> **🎩 Maren (skill register-flip on v2):** the asymmetry between Home overlay (sticky lands) and Medical tab (sticky doesn't) means a parent who happens to be in the Medical tab during an emergency loses one surface of the duplicate-action thumb-reach insurance. **The hoisted-top doctor card on Medical tab still works** — the parent can call from there. So the gap is "good ↔ better" not "broken ↔ working." Acceptable for D1; document as a known-and-accepted feature gap.

> **🎩 Kael (skill register-flip on v2):** §V-K8 P0 closed. Selectors named verbatim, modal-vs-inline asymmetry is now load-bearing in the spec rather than implicit. D2 has a clear refactor candidate if surface parity becomes important (likely when D3 footer-triad makes the Medical tab feel disjoint from Home overlay).

### 2.3 Severity-aware doctor-card hierarchy

**Renderer change** — drop the legacy `isEmergency` parameter (V-K9 P1 fold; code-search confirms zero external callers as of bridge merge sha 7342d5d):

```js
function _scDoctorCardHTML(severity) {
  // severity: 'emergency' | 'warning' | 'mild'
  var doc = getPrimaryDoctor();
  if (!doc) {
    // V-M1 + V-M2 fold per §2.3.1
    return /* see §2.3.1 */;
  }
  var cardClass = 'sc-doctor-card sc-doctor-card-' + severity;
  var html = '<div class="' + cardClass + '">';
  if (severity === 'emergency') {
    // Emergency: phone primary, name caption
    html += '<a class="sc-call-primary" href="tel:' + doc.phone + '">' +
            zi('phone') + ' Call Now: ' + escHtml(doc.phoneDisplay || doc.phone) + '</a>';
    html += '<div class="sc-doctor-name">' + escHtml(doc.name) +
            (doc.title ? ' · ' + escHtml(doc.title) : '') + '</div>';
  } else if (severity === 'warning') {
    // Warning: softer mid-card
    html += '<div class="sc-doctor-name">' + escHtml(doc.name) +
            (doc.title ? ' · ' + escHtml(doc.title) : '') + '</div>';
    if (doc.phone) {
      html += '<a class="sc-call-secondary" href="tel:' + doc.phone + '">' +
              zi('phone') + ' Call if needed: ' + escHtml(doc.phoneDisplay || doc.phone) + '</a>';
    }
  } else {
    // Mild: de-emphasised. For D1 + D2 (no Track CTA shipped yet), this
    // renders below body; D3 Track CTA insertion adjusts position. (V-M4 fold)
    html += '<div class="sc-doctor-name sc-doctor-name-mild">' + escHtml(doc.name) +
            (doc.title ? ' · ' + escHtml(doc.title) : '') + '</div>';
    if (doc.phone) {
      html += '<a class="sc-call-tertiary" href="tel:' + doc.phone + '">' +
              zi('phone') + ' ' + escHtml(doc.phoneDisplay || doc.phone) + '</a>';
    }
  }
  if (doc.address) {
    html += '<div class="sc-doctor-address">' + escHtml(doc.address) + '</div>';
  }
  html += '</div>';
  return html;
}
```

**Caller change** — `_renderSymptomCheckerResults` passes severity through:

The current bridge code calls `_scDoctorCardHTML(hasEmergency)`. D1 changes this to pass severity (legacy `isEmergency` param dropped per V-K9 — `_scDoctorCardHTML(severity)` only):

```js
// inside _renderSymptomCheckerResults, after shown.forEach(...)
if (hasEmergency || shown.some(function(m) { return m.entry.callDoctor; })) {
  var hasWarning = shown.some(function(m) { return m.severity === 'warning'; });
  var docSev = hasEmergency ? 'emergency' : (hasWarning ? 'warning' : 'mild');
  html += _scDoctorCardHTML(docSev);
}
```

### 2.3.1 D1 doctor-card render-decision matrix (V-M8 fold — Cipher Edict V verification reference)

| Severity | callDoctor | Has doctor saved | D1 render |
|---|---|---|---|
| emergency | (any) | yes | hoist-top + sticky footer (Home overlay only) — see §2.4.1 |
| emergency | (any) | no | §2.3.2 no-doctor + emergency 112 fallback (V-M2 fold) |
| warning | true | yes | mid-card softer call CTA |
| warning | true | no | bare `+ Add Doctor` + V-M1 contextual nudge ("Add a doctor so you can call if symptoms worsen") |
| warning | false | (any) | no doctor card (matches `needsDoctor` logic in §2.4.1) |
| mild | true | yes | de-emphasised below body |
| mild | true | no | bare `+ Add Doctor` (no nudge — mild doesn't warrant call-urgency framing) |
| mild | false | (any) | no doctor card |

### 2.3.2 No-doctor severity-aware fallback (Maren V-M1 + V-M2 fold)

> **🎩 Maren (skill register-flip — provenance marker):** the no-doctor branch needs to honor severity. Original 1-shape ("No doctor saved yet — + Add Doctor") is a P0 surface failure on emergency: parent in active emergency, no doctor, no fallback. D1 adds severity-aware variants with an emergency text-fallback (`lifeThreat` number rendering deferred to D2 per SG-D1-LT). v2 fold added 112-hardcode (V-M2) + warning-tier nudge (V-M1).

When `getPrimaryDoctor()` returns null, the no-doctor render is severity-aware:

```js
if (!doc) {
  var emptyHtml = '<div class="sc-doctor-card sc-doctor-card-' + severity + ' sc-doctor-card-empty">';
  emptyHtml += '<span class="sc-doctor-empty">No doctor saved yet — </span>';
  emptyHtml += '<a href="#" data-action="openDoctorModal" class="sc-doctor-add-link">+ Add Doctor</a>';
  if (severity === 'emergency') {
    // V-M2 P0 fold: hardcoded 112 (India unified emergency, live since 2019).
    // Aurelius confirms the value as known constant for the locale this app
    // ships to. D2 replaces with emergencyContacts.{region} lookup once
    // SG-WI-MODULE landing + locale-config table land.
    emptyHtml += '<div class="sc-emergency-fallback">If this is a true emergency, call your local emergency number now (in India: <strong>112</strong>).</div>';
  } else if (severity === 'warning') {
    // V-M1 P0 fold: warning-tier no-doctor needs contextual nudge so the parent
    // mentally connects "the symptom card said call if needed" with "this
    // generic +Add Doctor link is the call surface." NOT the emergency-services
    // fallback (would over-alarm); just a softer one-liner naming WHY the
    // +Add Doctor matters here.
    emptyHtml += '<div class="sc-doctor-empty-nudge">Add a doctor so you can call if symptoms worsen.</div>';
  }
  // Mild tier: bare + Add Doctor (no nudge — mild doesn't warrant the
  // call-urgency framing).
  emptyHtml += '</div>';
  return emptyHtml;
}
```

CSS:
```css
.sc-emergency-fallback {
  margin-top: var(--sp-6);
  padding: var(--sp-6) var(--sp-8);
  background: rgba(220,60,60,0.12);
  border-radius: var(--r-md);
  font-size: var(--fs-xs);
  font-weight: 600;
  color: var(--tc-danger);
}
[data-theme="dark"] .sc-emergency-fallback {
  background: rgba(220,60,60,0.2);
  color: var(--tc-danger);
}
.sc-doctor-empty-nudge {
  margin-top: var(--sp-6);
  font-size: var(--fs-xs);
  color: var(--mid);
  font-style: italic;
}
```

D2 replaces the static "112" string in the emergency fallback with the proper `lifeThreat` rendering once `emergencyContacts.{region}` lands (per SG-D1-LT default Slip).

### 2.4 Emergency-tier layout reflow

> **Note (C-D1-2 fold):** This subsection retains the pre-Kael-discipline rendering sketch for narrative context. The **canonical helper logic lives in §2.4.1** (single-render discipline). The 2-arg `_scDoctorCardHTML(severity, isEmergency)` calls below are **superseded** — actual signature per §2.3 + V-K9 fold is single-arg `_scDoctorCardHTML(severity)`. Read §2.4.1 for the implementation contract.

For `severity === 'emergency'`, the helper renders the doctor card (hoisted) BEFORE WHEN-TO-SEEK-CARE / WHAT-TO-DO sections. New helper logic inside `shown.forEach` (superseded sketch — see §2.4.1 for canonical):

```js
shown.forEach(function(m) {
  var e = m.entry;
  var sevClass = m.severity === 'emergency' ? 'sc-emergency' :
                 m.severity === 'warning'   ? 'sc-warning' : 'sc-mild';
  var sevLabel = /* unchanged */;

  html += '<div class="sc-result ' + sevClass + '">';
  html += '<div class="sc-rail" aria-hidden="true"></div>';      // D1
  html += '<span class="sc-sev-badge">' + sevLabel + '</span>';
  html += '<div class="sc-title">' + escHtml(e.title) + '</div>';

  // SUPERSEDED — see §2.4.1 single-render discipline. Doctor card is NOT
  // emitted per-match; it's emitted once per result-list outside the forEach.
  // The pre-fold sketch placed _scDoctorCardHTML calls here, which would
  // duplicate the card on emergency entries. Kael V-K skill-flip refactored
  // to single-render.

  // ...sections (what to do, precautions, when to seek care)...

  html += '</div>';
});

// SUPERSEDED — see §2.4.1.
// Aggregate doctor card now uses single-arg signature
// _scDoctorCardHTML(severity) per V-K9 fold; see §2.4.1 canonical render.
```

> **🎩 Kael (skill register-flip):** the per-match doctor-card hoist (inside forEach) plus the aggregate doctor-card render (outside forEach) duplicates the doctor card on emergency entries. **Need a discipline: render doctor card ONCE per result-list, not per-match.** Refactor: collect emergency matches' need-for-hoist boolean during the forEach, then render exactly one doctor card outside the forEach with the right severity + position. Spec edit needed in §2.4 — let me amend.

### 2.4.1 Single-render doctor card discipline (Kael-amended) + empty-state explicit (V-K7 fold) + cross-jurisdiction provenance (V-K14 note)

> *Provenance note (V-K14 fold):* this subsection's helper structure is a Kael-skill-flip amendment during drafting (single-render discipline). Maren's Mode-1 audit on §2.4.1 reviewed Kael-authored architecture inside Care-jurisdiction code (`medical.js`). cc-022 lifecycle hygiene preserves the cross-jurisdiction provenance.

**Refactored helper logic:**

```js
function _renderSymptomCheckerResults(matches, ageMo, opts) {
  opts = opts || {};
  // V-K10 fold: opts.actions is preserved from the bridge-shipped signature
  // for back-compat with intelligence.js#runHomeSymptomCheck which passes
  // closeAndPrompt* variants. D1 does NOT introduce new actions consumers;
  // D3 will add Track-CTA action wiring through opts.actions. Documenting
  // here so Cipher Edict V doesn't flag the unused-locally variable as dead.
  var actions = opts.actions || { /* unchanged defaults from bridge */ };

  // V-K7 fold: empty-state branch — when matches.length === 0, the helper
  // is NOT called by the caller (medical.js#checkSymptoms and
  // intelligence.js#runHomeSymptomCheck both return early with their
  // existing bridge-shipped no-match message). D1 does not touch
  // empty-state. This guard is defensive in case a future caller routes
  // empty matches through the helper:
  if (!matches || matches.length === 0) {
    return '';  // Caller renders no-match UI before calling helper
  }

  var html = '';
  var shown = matches.slice(0, 2);
  var hasEmergency = shown.some(function(m) { return m.severity === 'emergency'; });
  var hasWarning   = shown.some(function(m) { return m.severity === 'warning'; });
  var needsDoctor  = hasEmergency || shown.some(function(m) { return m.entry.callDoctor; });

  // For emergency: hoist doctor card to TOP of the result-list (before any cards)
  if (hasEmergency && needsDoctor) {
    html += _scDoctorCardHTML('emergency');
  }

  shown.forEach(function(m) {
    var e = m.entry;
    var sevClass = /* unchanged */;
    var sevLabel = /* unchanged */;

    html += '<div class="sc-result ' + sevClass + '">';
    html += '<div class="sc-rail" aria-hidden="true"></div>';
    html += '<span class="sc-sev-badge">' + sevLabel + '</span>';
    html += '<div class="sc-title">' + escHtml(e.title) + '</div>';
    // ...sections...
    html += '</div>';
  });

  // For non-emergency: doctor card AFTER the result cards
  if (!hasEmergency && needsDoctor) {
    var docSev = hasWarning ? 'warning' : 'mild';
    html += _scDoctorCardHTML(docSev);
  }

  // Episode tracking CTAs (unchanged from bridge — uses opts.actions)
  // ...

  // Sticky CTA mirror (Home overlay path only — see §2.2 surface asymmetry;
  // emit the markup unconditionally on emergency tier; CSS position:sticky
  // no-ops on Medical tab path since #symptomResult has no scroll container.
  // V-M3 fold: CTA + number ONLY, no doctor name/address/title.)
  if (hasEmergency) {
    var doc = getPrimaryDoctor();
    if (doc) {
      html += '<div class="sc-sticky-footer">';
      html += '<a class="sc-call-primary" href="tel:' + doc.phone + '">' +
              zi('phone') + ' Call Now: ' + escHtml(doc.phoneDisplay || doc.phone) + '</a>';
      html += '</div>';
    }
  }

  // Disclaimer (unchanged from bridge)
  html += '<div class="sc-disclaimer">…</div>';

  return html;
}
```

**Properties:**
- Doctor card rendered exactly once per result-list (Kael discipline preserved)
- Emergency: hoisted to top + sticky footer at bottom (two surfaces of the same number; V-M3 fold = CTA+number only in footer, no name duplication)
- Warning/Mild: single card after the result body, severity-tinted
- No duplication; no stale code paths
- Empty state explicit (V-K7); upstream callers handle their own no-match UI
- `opts.actions` preserved for D3 Track-CTA wiring (V-K10 documented; not D1 scope)

---

## 3. Per-file edit map

| File | Bridge state (post-PR #67) | D1 changes |
|---|---|---|
| `split/template.html` | + `zi-phone` sprite | (no change in D1 if SG-D1-LT defaults Slip; +1 sprite if SG-D1-LT amended to D1-include — see §0.1 #9 + §10 SG-D1-LT row "Status in v2" column) (V-K12 fold) |
| `split/styles.css` | + `--tc-sage-light` token (light + dark); + `[data-theme="dark"] .sc-mild .sc-sev-badge` rule | + `.sc-rail` rule + 3 severity variants + dark variants + emergency pulse-glow + reduced-motion override; + `.sc-sticky-footer` rule + pinned variant + reduced-motion override; + `.sc-doctor-card-{emergency,warning,mild}` variants + `.sc-call-primary/secondary/tertiary` size variants; + `.sc-emergency-fallback` rule (+ dark variant); + modal scroll-area `padding-bottom` rule; + `position: relative` on `.sc-result` |
| `split/medical.js` | + `_renderSymptomCheckerResults` shared helper + `_scDoctorCardHTML` HR-1 ports | refactor `_renderSymptomCheckerResults` per §2.4.1 (doctor-card discipline + rail + sticky footer + per-card layout); refactor `_scDoctorCardHTML` per §2.3 (severity-aware variants); add `_scInitStickyShadow` per §2.2 |
| `split/intelligence.js` | call site collapsed to one-liner with `opts.actions` | (no change required — helper signature stays compatible; sticky-shadow init call added at the `runHomeSymptomCheck` exit point) |
| `split/data.js` | (unchanged) | (no change in D1 — `lifeThreat` field is D2 if SG-D1-LT defaults Slip) |

**Estimated line delta:**
- styles.css: +60 to +90 lines
- medical.js: +15 to +30 lines net (refactor + variants — some lines move, some are new)
- intelligence.js: +1 to +3 lines (sticky-shadow init call)
- template.html: 0
- data.js: 0

Atomic Mode-2 PR per vision §5.2 build-rule 3.

---

## 4. Audit chain (canon-cc-008) for THIS spec

```
[1] Lyra      → drafts this spec (DONE — this file)
[2] Maren     → audits Care jurisdiction:
                · §2.3 doctor-card variants — content + tone per severity
                · §2.3.1 no-doctor emergency fallback (Maren-seeded amendment in v1; verify language)
                · §2.4.1 emergency-tier layout flow — does the hoist + sticky read as
                  "one primary action, two surfaces" or as "duplicate noise"?
                · §7 contrast verification fixture — sufficient?
                · §8 motion budget on emergency entrance — does pulse-glow read as urgent
                  without being alarming?
                · §9 touch targets — 60×60 generous enough for one-handed parent?
                · D1 explicit doctor-card gating — any P0 fallouts I'm missing?
[3] Kael      → audits Intelligence jurisdiction + cross-cut:
                · §2.4.1 single-render discipline — implementation correctness
                · §2.2 sticky-on-modal-scroll discipline — confirm modal scroll containers
                  match expectations across both Home overlay and Medical tab paths
                · §2.3 helper signature evolution — opts.actions still works; severity
                  parameter is back-compat for external callers
                · §3 per-file edit map — no missing surfaces; concat order respected
                · cross-cut: D1 ships §6.5.D1 contracts cleanly; D2/D3 inheritance
                  still works
[4] Lyra      → synthesizes both Governor reports; folds amendments into v2 of this spec
[5] Cipher    → Edict V structural pass on the spec itself:
                · HR matrix completeness (§5)
                · Audit chain integrity
                · Cross-references consistent (§N.M form)
                · Implementation contracts (§1) match shipped surfaces
[6] Sovereign → ratifies v2 OR redirects scope. If ratified:
                · SG-D1-LT (sub-Sovereign-gate per §0.1 #9): include lifeThreat
                  rendering in D1, OR slip to D2 (default: SLIP)
                · D1 Mode-2 build PR opens after ratification
[7] Lyra      → Mode-2 build per ratified v2
[8] Cipher    → Edict V on impl
[9] Maren     → §7 contrast verification fixture run on real device (parallel to Cipher
                or after Mode-2 merge — Sovereign's call at Mode-2 PR opening)
[10] Sovereign → merges D1 Mode-2 PR
```

**No short-circuits.** Per spec-iteration discipline.

---

## 5. HR-by-HR audit (this spec) — operational sentences per V-K6

| HR | Status | Operationally, this means… |
|---|---|---|
| HR-1 | Reinforced | No new emoji introduced. Doctor-card variants use `zi('phone')` exclusively. Verified at impl by `grep -cE "\\\\u\{1F\|\\\\u26[0-9A-F][0-9A-F]\|\\\\u2705\|\\\\u260E"` over modified files = 0. |
| HR-2 | Reinforced | All new colours/spacing/borders via tokens. The `.sc-emergency-fallback` rule uses `var(--tc-danger)`, `var(--r-md)`, `var(--sp-6)`. Verified by `grep -nE "style=\"|#[0-9a-f]{3,6}"` on modified surfaces. |
| HR-3 | Reinforced | All new actions (`.sc-doctor-add-link`, sticky-CTA `<a>`, etc.) use `data-action` delegation. `+ Add Doctor` link replaces the legacy inline `onclick="event.preventDefault();openDoctorModal()"` (forward-pointer from bridge §0.2 — D1 retires this HR-3 violation as a side-effect). |
| HR-4 | Reinforced | All new interpolations (`escHtml(doc.name)`, `escHtml(doc.phoneDisplay \|\| doc.phone)`) escape user-data. `zi()` returns trusted SVG. The static "If this is a true emergency…" string is constant text — no escape needed, but does not introduce raw HTML either. |
| HR-5 | Reinforced | Spacing tokens (`--sp-*`), font-size tokens (`--fs-*`), border-radius tokens (`--r-*`), color tokens (`--tc-*`, `--rose-*`, `--sage-*`) used throughout. Verified at impl. |
| HR-6 | Reinforced (HR-3 cross-ref) | Operationally identical to HR-3 row. |
| HR-7 | Reinforced | `zi()` output via `.innerHTML` only (helper returns string; caller writes innerHTML). No `.textContent` regression possible. |
| HR-8 | N/A | No stub features introduced. |
| HR-9 | Reinforced | Standard Maren ‖ Kael → Lyra synthesis → Cipher Edict V → Sovereign ratification → Mode-2 build → Cipher Edict V on impl chain. |
| HR-10 | Reinforced | No `text-overflow: ellipsis` introduced. Long doctor names wrap (Nunito, line-height-relaxed). |
| HR-11 | N/A | No currency. |
| HR-12 | N/A | No date construction. |

**Plus three D1-introduced verification gates** (not strictly HRs but enforced at Cipher Edict V on impl):

| Gate | Pattern | Verification |
|---|---|---|
| G-D1-1 | `.sc-rail` aria-hidden | `grep -n 'class="sc-rail"' split/medical.js` shows `aria-hidden="true"` on every emit |
| G-D1-2 | Modal scroll-area padding-bottom rule | `grep -n 'padding-bottom: 60px' split/styles.css` returns ≥1 selector matching the modal scroll container(s) |
| G-D1-3 | `prefers-reduced-motion: reduce` parity | Every D1 `transition`/`animation` rule has a sibling `@media (prefers-reduced-motion: reduce)` override. `grep -nB1 'prefers-reduced-motion' split/styles.css` enumerated; cross-verified against motion-introducing rules. |

---

## 6. §6.5.D1 phase contracts (re-stated for downstream inheritance)

(Mirror of §1 above; keeps phase-contract assertion local to this spec for D2/D3 reference.)

```
6.5.D1 — Contracts shipped (10 rows; mirrors §1 exactly per Cipher C-D1-1 fold):
  · Class .sc-rail with role: severity strip, decorative.
  · .sc-rail DOM position: first child of .sc-result.sc-{severity}.
  · Sticky-CTA scroll container: the modal scroll container, not document.
  · Doctor-card hierarchy: severity-aware (emergency=top hoist + sticky footer;
    warning=mid-card softer; mild=de-emphasised below body).
  · Rail scope: result-card only (D3 may extend to triage card via additive rule).
  · Touch-target floor: 44×44 (interactive); 60×60 (emergency primary CTA).
  · prefers-reduced-motion: reduce override exists for every animated rule
    introduced in D1.
  · .sc-result { position: relative } — descendant absolute-positioned
    elements anchor here. Permanent constraint downstream (V-K13).
  · Single-render doctor-card discipline — one card per result-list, not
    per-match (Kael discipline; codified in §2.4.1).
  · No-doctor emergency fallback — text-only fallback note added to no-doctor
    render on emergency tier (V-M2 fold; lifeThreat number rendering deferred
    to D2).
```

---

## 7. Contrast-verification fixture (Maren §8.2 carry-forward + D1 surfaces)

Before D1 ships (real-device verification by Maren post-Mode-2 build merge OR pre-merge at Sovereign's call):

**6 severity × theme combos** (from bridge §8.2, unchanged surfaces):
- emergency × light
- emergency × dark
- warning × light
- warning × dark
- mild × light (post-bridge — Maren retired conditional bump)
- mild × dark (post-bridge — passing 8.86:1 per real-device + math)

**+ 8 D1-NEW combos** (V-M6 fold expanded from 6 to 8):
- `.sc-rail` × {rose, amber, sage} × {light, dark} — verify rail visible against card background; verify pulse-glow steady-state does NOT compromise contrast
- `.sc-doctor-card-emergency` background + `.sc-call-primary` text — verify ≥4.5:1 in both themes
- `.sc-doctor-card-warning` background + `.sc-call-secondary` text
- `.sc-doctor-card-mild` background + `.sc-call-tertiary` text
- `.sc-emergency-fallback` background + text in both themes (the no-doctor tier; **composited capture from real-device, NOT stylesheet RGBA math** — V-M6 fold a)
- `.sc-doctor-empty-nudge` text on `.sc-doctor-card-warning` background in both themes (the new V-M1 nudge surface)
- `.sc-sticky-footer` background + `.sc-call-primary` text on emergency (with shadow)
- **Pulse-glow mid-animation frame** — capture at ~750ms post-entrance for emergency × {light, dark}; verify the 50%-keyframe `box-shadow: 0 0 8px 2px rgba(220,60,60,0.5)` glow does NOT bleed onto adjacent text and reduce title/badge contrast during the 1.5s window (V-M6 fold b)

**Mathematical pre-check** (Lyra recommends running before real-device): use the same Python contrast-ratio script from bridge §8.2 against each combo. Commit results to D1 build PR.

**Maren commitment:** real-device verification on the modal at the actual device the parent will use. Both themes. ≥4.5:1 minimum on every text-on-bg combo. Pulse-glow on emergency rail tested against vestibular-safe perception (does it agitate or assure?).

---

## 8. Motion budget (per vision v2.1 §4.4)

D1 introduces these animations:

| Selector | Property | Duration | Tier | Reduced-motion override |
|---|---|---|---|---|
| `.sc-emergency .sc-rail` | `animation: sc-rail-pulse` | 1.5s, runs once | Emergency attention-draw (separate budget per vision §4.4) | `animation: none` |
| `.sc-sticky-footer` | `transition: box-shadow` | 200ms | Within ≤200ms cap | `transition: none` |

**Mild tier:** zero animation introduced (per vision §4.4 — calm).
**Warning tier:** zero animation introduced (no entrance, no transition).
**Emergency tier:** rail pulse + sticky shadow-grow only.

Motion-budget audit (Cipher Edict V on impl):
- Enumerate every `transition:`/`animation:` rule introduced in D1
- Sum max(duration) per selector path: confirm `≤200ms` for non-emergency entrance motion
- Confirm 1.5s pulse-glow exists ONLY on `.sc-result.sc-emergency .sc-rail`
- Confirm `prefers-reduced-motion: reduce` override exists for every animated rule
- **V-M5 fold: confirm pulse-glow `.sc-rail-pulse` runs ONCE per first-paint, NEVER on focus / tab visibility-change / scroll-into-view re-trigger.** CSS `animation: ... 1` with `animation-iteration-count: 1` enforces no-loop, but does NOT prevent re-trigger on element re-mount. Cipher verifies via DOM-state inspection: under multi-card render (rare; multiple emergency matches), both rails pulse in parallel — that's fine. Re-focus/visibility-change must NOT re-trigger.

---

## 9. Touch targets (V-M6 #5)

| Element | Min size | Notes |
|---|---|---|
| `.sc-call-primary` (emergency) | 60×60 CSS px | Thumb-reach under stress; iOS HIG ≥44×44 baseline + WCAG 2.2 SC 2.5.8; emergency primary gets the bump |
| `.sc-sticky-footer` button | 60×60 CSS px | Same as above; sticky CTA = primary surface on emergency |
| `.sc-call-secondary` (warning) | 44×44 CSS px | Standard interactive baseline |
| `.sc-call-tertiary` (mild) | 44×44 CSS px | Same |
| `.sc-doctor-add-link` (no-doctor) | 44×44 CSS px | |
| `.sc-quick-chip` | 44×44 CSS px | Already meets bar; D1 verifies |

CSS pattern:
```css
.sc-call-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60px;
  min-width: 60px;
  padding: var(--sp-10) var(--sp-12);
  /* ...existing styling... */
}
.sc-call-tertiary {
  /* V-M4 fold: min-height 44px MANDATORY regardless of font-size.
     Visual de-emphasis via font-weight + color, NOT shrinking the tap target. */
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  min-width: 44px;
  padding: var(--sp-6) var(--sp-8);
  font-size: var(--fs-sm);
  font-weight: 500;
  color: var(--mid);
}
.sc-doctor-add-link {
  /* V-M7 fold: 44×44 hit-area centered on text; preserve text-link affordance
     via underline + Nunito-600 + tc-link color. Cipher Edict V on impl
     confirms visual reads as "tappable text link" not "weirdly large". */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 44px;
  padding: var(--sp-4) var(--sp-8);
  text-decoration: underline;
  font-weight: 600;
  color: var(--tc-sage);  /* tokenized link color */
}
```

---

## 10. Open questions for Sovereign — v2 stances locked

| ID | Question | Default | Audit stances | Status in v2 |
|---|---|---|---|---|
| **SG-D1-LT** | Include `lifeThreat` rendering in D1 (per §0.1 #9), or slip to D2? | Slip to D2 | Maren: Concur (slip) — V-M2 fills gap with hardcoded 112 fallback. Kael: Concur (slip) — collapses three phase boundaries. | **HOLDING DEFAULT (Slip).** Sovereign can still amend at ratification. |
| **SG-D1-PULSE** | Emergency rail pulse-glow runs once (default) vs. repeatedly vs. never? | Once | Maren: Concur (once) + V-M5 verification (no re-trigger). Kael: Concur (once). | **HOLDING DEFAULT (Once).** V-M5 verification gate added to §8. |
| **SG-D1-DOCTOR-EMPTY-WARNING** | Warning-tier no-doctor: emergency-services fallback or bare `+ Add Doctor`? | Just + Add Doctor | Maren: AMEND → bare + V-M1 contextual nudge ("Add a doctor so you can call if symptoms worsen"). NOT emergency-services fallback. Kael: Concur (no escalation to emergency-services on warning tier). | **AMENDED via Maren V-M1.** Now: bare `+ Add Doctor` PLUS contextual nudge. NOT emergency-services fallback. Both Governors converge on this stance. |

**Amendment protocol:** same as bridge v3 + vision v2.1 — Sovereign overrides any default by stating the override; Lyra revises v2 in-place (single round, no re-audit unless override changes audit-chain shape).

---

## 11. Forward-pointer (downstream phases)

D1 ships the foundation. Downstream:

- **D2 structural spec** opens post-D1-build merge. Inherits §6.5.D1 + adds §6.5.D2 (DO-NOT callouts, numbered sequences, content rewrite, footer-triad gating, `lifeThreat` if not in D1). Maren content-veto gate inserted (V-M5).
- **D2 content snippet PR** (Aurelius co-traveller). Maren content-veto per V-M5.
- **D3 spec(s)** open post-D2 merge AND post-weave-ISL-mini-spec ratification. Triage + Lyra-weave + voice + share + promote.
- **Weave-ISL mini-spec** opens in parallel with this D1 spec (per SG-6). Drafted in companion file `lyra-spec-2026-05-13-symptom-checker-weave-isl.md`. Independent track; doesn't block D1.

---

## 12. Changelog

- **v1 (2026-05-13):** initial draft. Ships §6.5.D1 phase contracts. Inherits from vision v2.1 §6.D1 + bridge v3 (post-merge). Incorporates two Maren-skill register-flips during drafting (§2.1 aria-hidden discipline, §2.3.1 no-doctor emergency fallback) and one Kael-skill register-flip (§2.4.1 single-render doctor-card discipline) and one Cipher-skill register-flip (§1 contract-mirror rationale). Three Sovereign-gates surfaced (SG-D1-LT, SG-D1-PULSE, SG-D1-DOCTOR-EMPTY-WARNING) with conservative defaults. Awaiting Maren + Kael parallel audit.
- **v3.1 (2026-05-13):** Cipher Edict V STRICT RE-AUDIT verdict — **PASS**. NEW-C-D1-6 P2 swept: v2-changelog block V-M1 + V-M2 cross-refs updated from old `§2.3.1` to `§2.3.2` (the no-doctor fallback section, post-C-D1-3 renumbering). Only V-M8 had been swept in v3; v3.1 completes the post-fold consistency sweep — itself a live instance of the "post-fold consistency sweep" canon-promotion candidate. **Sovereign-ratified 2026-05-13.** Audit chain complete: [1] Lyra → [2] Maren ‖ [3] Kael → [4] Lyra synthesis → [5] Cipher Edict V (RE-ROUND → RE-AUDIT PASS) → [6] Sovereign ratification. D1 Mode-2 build PR opens next (separate branch off main).
- **v3 (2026-05-13):** Cipher Edict V STRICT pass folded (5 findings: 0 P0 + 2 P1 + 3 P2). Surgical amendments:
  - **C-D1-1 P1:** §1 ↔ §6 contract-list reconciled. §1 expanded from 8 rows to 10 (added row 9 single-render discipline + row 10 no-doctor emergency fallback). §6 re-stated as exact 10-row mirror.
  - **C-D1-2 P1:** §2.4 explicit supersession marker added at top + inline "SUPERSEDED — see §2.4.1" comments inside the code block. Pre-Kael-discipline 2-arg `_scDoctorCardHTML` calls noted as historical-narrative; canonical helper logic lives in §2.4.1 single-arg signature.
  - **C-D1-3 P2:** §2.3.1 / §2.3.2 renumbered to align numerical order with document order. Matrix is now §2.3.1; no-doctor fallback is now §2.3.2.
  - **C-D1-4 P2:** §3 cross-ref to "§10 SG-D1-LT effect column" corrected to "§10 SG-D1-LT row 'Status in v2' column" (matches actual §10 column header).
  - **C-D1-5 P2:** Maren register-flip provenance marker relocated to live INSIDE §2.3.2 (no-doctor section it motivates). Changelog v2 entry text below updated to cite §2.3.1 (matrix) ↔ §2.3.2 (no-doctor) per new numbering.
  - **Cross-cutting:** Cipher flagged P1 audit-chain quality regression (5 V-K6 GAPs). Forward-pointer: codify "post-fold consistency sweep" as Kael completion criterion before declaring V-K* round closed. Tracked as canon-promotion candidate; no spec body change in v3.
  - **Canon-promotion candidates** surfaced by Cipher (3): "Sub-Sovereign-gate amendment-effect column" pattern (D1 §10 5-col shape), "Post-fold consistency sweep" Governor discipline, "Pre-fold draft superseded by post-fold subsection" Lyra drafting marker. Filed for Sovereign / Cipher canon-promotion review.
  - **Contract verification:** all D1 contract claims PASS against main sha 7342d5d (Cipher-verified: `_renderSymptomCheckerResults` signature; `_scDoctorCardHTML` evolution; `#homeSymptomOverlay > .modal` selector; `#symptomResult` inline; `.sc-result` position-relative introduction by D1, bridge didn't ship it).
  - Cipher Edict V STRICT re-audit NEXT.

- **v2 (2026-05-13):** Audit-chain step [4] Lyra synthesis. Folds Maren V-M1..V-M9 (2 P0 + 4 P1 + 3 P2) + Kael V-K7..V-K14 (1 P0 + 4 P1 + 3 P2) returns. Substantive amendments:
  - **V-M1 P0:** Warning-tier no-doctor contextual nudge ("Add a doctor so you can call if symptoms worsen"). §2.3.2 (no-doctor fallback) expanded. SG-D1-DOCTOR-EMPTY-WARNING AMENDED (both Governors concur).
  - **V-M2 P0:** Emergency no-doctor fallback hardcodes 112 (India unified emergency, live since 2019). §2.3.2 (no-doctor fallback) + §11 D2 forward-pointer for `emergencyContacts.{region}` lookup.
  - **V-K8 P0:** §2.2 sticky-on-modal-scroll selectors named verbatim. **Critical surface asymmetry surfaced and documented:** Home overlay path = true modal (`#homeSymptomOverlay > .modal` with `max-height:85vh; overflow-y:auto`); Medical tab path = inline (`#symptomResult` with no scroll container). **Sticky footer SHIPS on Home overlay only; Medical tab gets hoisted-top doctor card only (no sticky).** Spec acknowledges asymmetry as known-and-accepted feature gap; D2 candidate refactor.
  - **V-M3 P1:** Sticky footer renders CTA + phone number ONLY (no doctor name/address/title duplication). §2.2 + §2.4.1 amended.
  - **V-M4 P1:** `.sc-call-tertiary` `min-height: 44px` MANDATORY regardless of font-size. §9 expanded.
  - **V-M6 P1:** Contrast fixture expanded from 12 to 14 captures: composited no-doctor-fallback (real-device, not stylesheet math) + pulse-glow mid-animation frame ~750ms.
  - **V-M8 P1:** §2.3.1 NEW — D1 doctor-card render-decision matrix (8 rows) for Cipher Edict V verification reference (v3 fold renumbered §2.3.2 → §2.3.1 + §2.3.1 → §2.3.2 per Cipher C-D1-3 to align numerical order with document order).
  - **V-K7 P1:** Empty-state branch (matches.length === 0) explicit; defensive guard in helper.
  - **V-K9 P1:** Drop legacy `isEmergency` parameter NOW (code-search confirms zero external callers as of bridge merge sha 7342d5d). Helper signature is `_scDoctorCardHTML(severity)` only.
  - **V-K10 P1:** `opts.actions` documented as preserved for D3 Track-CTA wiring (not D1 scope) — prevents Cipher dead-locals flag.
  - **V-K11 P1:** `_scInitStickyShadow` idempotency via `dataset.scStickyInit` guard. Single call site (Home overlay only — Medical tab no-modal asymmetry per V-K8).
  - **V-M5 P2:** Pulse-glow no-re-trigger constraint added to §8 motion-budget audit.
  - **V-M7 P2:** `.sc-doctor-add-link` 44×44 hit-area + text-link affordance preservation in §9.
  - **V-M9 P2:** _scInitStickyShadow idempotency (covered by V-K11 fold).
  - **V-K12 P2:** `template.html` row in §3 gates on SG-D1-LT amendment.
  - **V-K13 P2:** Row 8 added to §1 / §6 contracts: `.sc-result { position: relative }` as permanent constraint.
  - **V-K14 P2:** §2.4.1 cross-jurisdiction provenance note (Kael-architected logic in Care-jurisdiction code).
  - **Sub-Sovereign-gates:** SG-D1-LT held (Slip per both Governors), SG-D1-PULSE held (Once + V-M5 verification), SG-D1-DOCTOR-EMPTY-WARNING amended (Maren V-M1 nudge; Kael concur).
  - **Edict V readiness:** Kael's V-K6 form-pass estimate at v1 = 60%; v2 fold lifts to ~85% (V-K8 selector resolution + V-K11 listener-leak commit + V-M6 fixture expansion are the largest gap-closers).
  - Cipher Edict V structural pass NEXT.
