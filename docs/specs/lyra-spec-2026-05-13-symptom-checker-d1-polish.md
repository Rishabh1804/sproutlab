# Lyra Spec — 2026-05-13 — Symptom Checker D1 Polish (severity rail + sticky CTA + severity-aware doctor-card)

**Author:** Lyra (Builder, The Weaver)
**Mode:** 1 (spec authoring; signed audit-bearing artifact per canon-cc-022)
**Status:** v1 DRAFT — awaiting Maren + Kael parallel audit, then Lyra synthesis, then Cipher Edict V structural pass, then Sovereign ratification
**Branch:** `claude/d1-and-weave-isl-specs` (or successor)
**Parent spec:** `lyra-spec-2026-05-11-symptom-checker-ux-vision.md` v2.1 — this implements §6.D1 + ships §6.5.D1 phase contracts
**Predecessor spec:** `lyra-spec-2026-05-11-symptom-checker-hr1-dry.md` v3 — bridge build (Mode-2 merged 2026-05-13 as PR #67 → 7342d5d artifact regen). SG-5 tight-sequencing fires now.
**Trigger:** SG-5 tight-sequencing per Maren B-M3 — D1 phase-spec opens IMMEDIATELY on bridge-build merge with no intermediate work between.

---

## 0. Scope

### 0.1 In-scope

D1 is the **Polish** phase. It restructures the Symptom Checker result card without rewriting content. Per vision v2.1 §6.D1 deliverables list, expanded with v2 phase-contracts §6.5.D1 commitments:

1. **`.sc-rail` left-edge severity strip** on every result card — rose / amber / sage rail token; renders as a 4px wide left-edge accent bar inside the result card padding, visible through the entire scroll length of the card body. **Rose pulse-glow runs once on emergency entrance only** (1.5s, then steady — see §8 motion budget).
2. **Sticky doctor-CTA footer on emergency cards** — `position: sticky; bottom: 0;` within the modal scroll container (NOT document); transitions in shadow-grow on scroll past 100px. Sticky-CTA padding rule for modal scroll container: `padding-bottom ≥ sticky-CTA height` to prevent CTA from covering DO-NOT or emergency-criteria content (V-M1 #5; verification fixture per §7).
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

### 2.2 Sticky doctor-CTA footer on emergency cards

**Target structure:**

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
  <div class="sc-sticky-footer">
    <a class="sc-call-primary" href="tel:..." style="...">
      {zi('phone')} Call Now
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

**Modal scroll container padding-bottom rule** (V-M1 #5):

The Symptom Checker overlay container needs `padding-bottom: 60px` (matching sticky-CTA height) added to its scroll-area so the sticky CTA never covers DO-NOT or emergency-criteria content during scroll.

```css
#homeSymptomOverlay .modal-scroll-area,
#symptomResult-container { padding-bottom: 60px; }
```

(Selectors verify-on-impl per Cipher Edict V — exact selector depends on existing modal class names.)

**JS — pin shadow on scroll past 100px:**

```js
function _scInitStickyShadow(container) {
  if (!container) return;
  var footer = container.querySelector('.sc-sticky-footer');
  if (!footer) return;
  container.addEventListener('scroll', function() {
    footer.classList.toggle('is-pinned', container.scrollTop > 100);
  }, { passive: true });
}
```

Called from the SC overlay open + Medical-tab render entry points after `resultEl.innerHTML = ...`.

> **🎩 Kael (skill register-flip):** sticky-on-modal-scroll discipline (NOT document-scroll) per §6.5.D1 #3. The risk if you sloppy this: on a tall result the footer "sticks" relative to the page, not the modal, and ends up overlapping the modal close X. Verify selector against the actual modal scroll-container at impl. If the modal isn't a `overflow: auto` container, sticky won't fire — **need to verify the Home overlay vs Medical tab scroll containers behave identically.** Document the exact selectors in the build PR description.

### 2.3 Severity-aware doctor-card hierarchy

**Renderer change** — add `severity` parameter to `_scDoctorCardHTML`:

```js
function _scDoctorCardHTML(severity, isEmergency) {
  // severity: 'emergency' | 'warning' | 'mild'  (NEW; D1)
  // isEmergency: boolean (legacy; preserved for back-compat through D1 only)
  var doc = getPrimaryDoctor();
  if (!doc) {
    return '<div class="sc-doctor-card sc-doctor-card-' + severity + '"><span class="sc-doctor-empty">' +
           'No doctor saved yet — </span><a href="#" data-action="openDoctorModal" class="sc-doctor-add-link">+ Add Doctor</a></div>';
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
    // Mild: de-emphasised
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

The current bridge code calls `_scDoctorCardHTML(hasEmergency)`. D1 changes this to pass per-match severity for the doctor card placement. Need to think about which severity to use when there are multiple matches: highest-severity-shown-on-card (i.e., `hasEmergency ? 'emergency' : (hasWarning ? 'warning' : 'mild')`).

```js
// inside _renderSymptomCheckerResults, after shown.forEach(...)
if (hasEmergency || shown.some(function(m) { return m.entry.callDoctor; })) {
  var hasWarning = shown.some(function(m) { return m.severity === 'warning'; });
  var docSev = hasEmergency ? 'emergency' : (hasWarning ? 'warning' : 'mild');
  html += _scDoctorCardHTML(docSev, hasEmergency);
}
```

**Note on legacy `isEmergency` parameter:** preserved through D1 for back-compat with any existing callers (none in current code, but defensive). D2 cleanup PR can drop it after Cipher confirms no external callers.

> **🎩 Maren (skill register-flip):** the no-doctor branch needs to honor severity too. Currently it has only one shape ("No doctor saved yet — + Add Doctor"). On emergency, this is a P0 surface failure: parent in active emergency, no doctor, no fallback. **D1 must add an emergency-tier no-doctor variant that includes a fallback to "If this is a true emergency, call your local emergency services" (text only — `lifeThreat` rendering with the actual number is D2/D3).** Spec edit needed: `_scDoctorCardHTML('emergency', ...)` no-doctor branch shows `+ Add Doctor` PLUS a one-line emergency-services fallback note. Adding to §2.3 below.

### 2.3.1 No-doctor emergency fallback (Maren-amended)

When `getPrimaryDoctor()` returns null AND severity is emergency, the no-doctor render gains a fallback note:

```js
if (!doc) {
  var emptyHtml = '<div class="sc-doctor-card sc-doctor-card-' + severity + ' sc-doctor-card-empty">';
  emptyHtml += '<span class="sc-doctor-empty">No doctor saved yet — </span>';
  emptyHtml += '<a href="#" data-action="openDoctorModal" class="sc-doctor-add-link">+ Add Doctor</a>';
  if (severity === 'emergency') {
    emptyHtml += '<div class="sc-emergency-fallback">If this is a true emergency, call your local emergency services immediately.</div>';
  }
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
```

D2 will replace the static text with the proper `lifeThreat` rendering once `emergencyContacts.{region}` lands.

### 2.4 Emergency-tier layout reflow

For `severity === 'emergency'`, the helper renders the doctor card (hoisted) BEFORE WHEN-TO-SEEK-CARE / WHAT-TO-DO sections. New helper logic inside `shown.forEach`:

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

  // D1 NEW: emergency layout — hoist doctor card to top (per-match severity)
  if (m.severity === 'emergency' && (m.entry.callDoctor || hasEmergency)) {
    html += _scDoctorCardHTML('emergency', true);
  }

  // ...sections (what to do, precautions, when to seek care)...

  html += '</div>';
});

// AFTER forEach: render the AGGREGATE doctor card for warning/mild entries
// (hoisted per-emergency-match render above is per-card; this is the
//  card-list-level fallback for warning+mild OR no-emergency-but-callDoctor entries)
if (!hasEmergency && shown.some(function(m) { return m.entry.callDoctor; })) {
  var hasWarning = shown.some(function(m) { return m.severity === 'warning'; });
  html += _scDoctorCardHTML(hasWarning ? 'warning' : 'mild', false);
}

// AFTER doctor card: emergency sticky footer (only if emergency present)
if (hasEmergency) {
  var doc = getPrimaryDoctor();
  if (doc) {
    html += '<div class="sc-sticky-footer">';
    html += '<a class="sc-call-primary" href="tel:' + doc.phone + '">' +
            zi('phone') + ' Call Now: ' + escHtml(doc.phoneDisplay || doc.phone) + '</a>';
    html += '</div>';
  }
}
```

> **🎩 Kael (skill register-flip):** the per-match doctor-card hoist (inside forEach) plus the aggregate doctor-card render (outside forEach) duplicates the doctor card on emergency entries. **Need a discipline: render doctor card ONCE per result-list, not per-match.** Refactor: collect emergency matches' need-for-hoist boolean during the forEach, then render exactly one doctor card outside the forEach with the right severity + position. Spec edit needed in §2.4 — let me amend.

### 2.4.1 Single-render doctor card discipline (Kael-amended)

**Refactored helper logic:**

```js
function _renderSymptomCheckerResults(matches, ageMo, opts) {
  opts = opts || {};
  var actions = opts.actions || { /* unchanged defaults */ };

  var html = '';
  var shown = matches.slice(0, 2);
  var hasEmergency = shown.some(function(m) { return m.severity === 'emergency'; });
  var hasWarning   = shown.some(function(m) { return m.severity === 'warning'; });
  var needsDoctor  = hasEmergency || shown.some(function(m) { return m.entry.callDoctor; });

  // For emergency: hoist doctor card to TOP of the result-list (before any cards)
  if (hasEmergency && needsDoctor) {
    html += _scDoctorCardHTML('emergency', true);
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
    html += _scDoctorCardHTML(docSev, false);
  }

  // Episode tracking CTAs (unchanged from bridge)
  // ...

  // Sticky CTA mirror (only on emergency, only if doctor present)
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
- Doctor card rendered exactly once per result-list
- Emergency: hoisted to top + sticky footer at bottom (two surfaces of the same number; intentional per G2 — primary always one tap away)
- Warning/Mild: single card after the result body, severity-tinted
- No duplication; no stale code paths

---

## 3. Per-file edit map

| File | Bridge state (post-PR #67) | D1 changes |
|---|---|---|
| `split/template.html` | + `zi-phone` sprite | (no change in D1) |
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
6.5.D1 — Contracts shipped:
  · Class .sc-rail with role: severity strip, decorative.
  · .sc-rail DOM position: first child of .sc-result.sc-{severity}.
  · Sticky-CTA scroll container: the modal scroll container, not document.
  · Doctor-card hierarchy: severity-aware (emergency=top hoist + sticky footer;
    warning=mid-card softer; mild=de-emphasised below body).
  · Single-render doctor-card discipline (one per result-list, not per-match).
  · Rail scope: result-card only (D3 may extend to triage card via additive rule).
  · Touch-target floor: 44×44 (interactive); 60×60 (emergency primary CTA).
  · prefers-reduced-motion: reduce override exists for every animated rule
    introduced in D1.
  · No-doctor emergency fallback: text-only fallback note added to no-doctor
    render on emergency tier (lifeThreat number rendering deferred to D2).
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

**+ 6 D1-NEW combos:**
- `.sc-rail` × {rose, amber, sage} × {light, dark} — verify rail visible against card background; verify pulse-glow on emergency does NOT compromise contrast in steady state
- `.sc-doctor-card-emergency` background + `.sc-call-primary` text — verify ≥4.5:1 in both themes
- `.sc-doctor-card-warning` background + `.sc-call-secondary` text
- `.sc-doctor-card-mild` background + `.sc-call-tertiary` text
- `.sc-emergency-fallback` background + text in both themes (the no-doctor tier)
- `.sc-sticky-footer` background + `.sc-call-primary` text on emergency (with shadow)

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
```

---

## 10. Open questions for Sovereign

| ID | Question | Default | Effect if amended |
|---|---|---|---|
| **SG-D1-LT** | Include `lifeThreat` rendering in D1 (per §0.1 #9), or slip to D2? | **Slip to D2** — depends on `data.js` SYMPTOM_DB shape, Aurelius content review, and `emergencyContacts` config table; all D2 work | If Yes: §0.1 #9 expands; §3 per-file map adds `data.js` + `template.html` (`zi-emergency` or repurpose `zi-siren`); §2.3.1 no-doctor fallback shifts to render the actual number |
| **SG-D1-PULSE** | Emergency rail pulse-glow runs once (default) vs. repeatedly (every 5s) vs. never? | **Once** — V-K5 motion budget allows 1.5s entrance attention-draw; repeated would exceed budget; never sacrifices the attention call | If "repeatedly": §2.1 + §8 amend; possibly violates V-K5 attention-draw budget; would need Sovereign override |
| **SG-D1-DOCTOR-EMPTY-WARNING** | Warning-tier no-doctor: include emergency-services fallback like §2.3.1 emergency tier, or just `+ Add Doctor`? | **Just + Add Doctor** — warning is "monitor closely", not "act immediately"; emergency-services fallback would over-alarm | If "include fallback": §2.3.1 extends to warning tier; minor |

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
