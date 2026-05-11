# Lyra Spec — 2026-05-11 — Symptom Checker HR-1 sweep + DRY consolidation

**Author:** Lyra (Builder)
**Mode:** 1 (spec authoring; signed audit-bearing artifact per canon-cc-022)
**Status:** DRAFT — awaiting Maren + Kael parallel audit, then Cipher Edict V
**Branch:** `claude/review-markdown-screenshots-uOIgQ`
**Trigger:** Sovereign screenshot review (3 captures: Constipation / Crying / Fall) revealed legacy emoji escapes that survived Polish-10/11. Spec-first per Sovereign direction.

---

## 0. Scope

### 0.1 In-scope

1. Replace **all** literal/escape-coded emoji in the Symptom Checker render path with `zi()` sprite refs (HR-1).
2. Consolidate the duplicated render function between `medical.js` and `intelligence.js` (BUGS.md P2, `docs/BUGS.md:73` — DRY refactor candidate flagged by Cipher during Polish-2).
3. Add a new `zi-phone` symbol to `template.html` sprite (no existing telephone glyph in the 62-symbol sprite).

### 0.2 Explicitly out-of-scope (deferred per Sovereign direction 2026-05-11)

- **Doctor-card gating** (Emergency-only vs. always-available). Current behavior preserved: card renders iff `hasEmergency || some entry.callDoctor === true`.
- **Wider HR-1 amnesty** (≈95 sites per `docs/design/uniformity-contract.md` §"HR-1 · Sprite-only icons", plus the broader `split/*.js` literal-emoji population — moon phases, weather glyphs, holiday icons, "🆕" markers). Tracked in R-10 queue; this spec does not touch them.
- **Crying-state severity-badge dark-mode verification** (Sovereign capture suggests the `Crying a lot` result may be visually compressing or hiding the `<span class="sc-sev-badge">`). Open question; deferred to a real-device pass after this spec lands.
- HR-2 inline styles in `_scDoctorCardHTML` (`style="font-weight:700;..."`, `style="font-size:var(--fs-md);..."`). Forward-pointer only.
- HR-3 inline handler in `_scDoctorCardHTML` no-doctor branch (`onclick="event.preventDefault();openDoctorModal()"` at `medical.js:2538`). Forward-pointer only.

### 0.3 Why spec-first

The DRY consolidation re-routes a Care-jurisdiction surface (medical.js) through an Intelligence-jurisdiction caller (intelligence.js Home overlay) — or vice versa, depending on the chosen consolidation home. Touching both files mandates **parallel Governor audit** per canon-cc-008 before any line of code changes. Mode-2 build-mode is not authorized.

---

## 1. Evidence — screenshot ↔ source mapping

Three Sovereign screenshots reviewed:

| Screenshot | Visible emoji | Source site | Escape | Status |
|---|---|---|---|---|
| Constipation | green ✅ before "Usually manageable" badge | `intelligence.js:11958` (Home overlay) **and** `medical.js:2477` (Medical-tab path) | `✅` | EMOJI — present in both copies |
| Crying a lot | red 🚨 before "WHEN TO SEEK EMERGENCY CARE" section header | `intelligence.js:11965` | `\u{1F6A8}` | EMOJI — **drift evidence**: the medical.js sibling at `:2492` already uses `zi('siren')`. Fixed in one copy, not the other. |
| Fall/injury | red 🚨 before "Emergency" badge | `intelligence.js:11958` + `medical.js:2477` | `\u{1F6A8}` | EMOJI |
| Fall/injury | 📞 before "Dr. RK Agarwal" doctor name | `medical.js:2543` (single-defined helper `_scDoctorCardHTML`, called from both files) | `\u{1F4DE}` | EMOJI |
| Fall/injury | ☎️ before "Call Now: +91…" link | `medical.js:2545` | `☎️` | EMOJI (both branches of the ternary use it) |

**Inferred-but-not-screenshot-visible:** the `warning`-severity ⚠️ branch (`⚠️ Monitor closely`) at the same `:11958` / `:2477` sites. Fires on any `SYMPTOM_DB` entry whose `severity === 'warning'`. Same fix family.

### 1.1 Drift evidence (the smoking gun)

`medical.js:2492` (When-to-seek-emergency-care section title):

```js
html += '<div class="sc-section"><div class="sc-section-title" ...>' + zi('siren') + ' When to seek emergency care</div>';
```

`intelligence.js:11965` (same line, Home overlay path):

```js
html += '<div class="sc-section"><div class="sc-section-title" ...>\u{1F6A8} When to seek emergency care</div>';
```

Identical surface, identical text, **different glyph mechanism**. This is exactly the failure mode BUGS.md P2 predicted. Fixing only the visible emoji without consolidating the duplicate guarantees the next Polish round re-discovers the same kind of drift.

---

## 2. Symbol inventory — sprite check (template.html)

| Need | Existing zi-name? | Notes |
|---|---|---|
| Emergency badge prefix | `zi-siren` ✓ (`template.html:51`) | Matches the section-header precedent at `medical.js:2492`. Consistent semantics: SIREN ⇒ emergency. |
| Monitor-closely badge prefix | `zi-warn` ✓ (`template.html:42`) | Triangle-with-exclamation; already used across illness cards, settings, ql-modals. |
| Usually-manageable badge prefix | `zi-check` ✓ (`template.html:43`) | Circle-with-check; consistent positive-status semantics. |
| When-to-seek-emergency-care section header | `zi-siren` ✓ | Mirrors medical.js — bring intelligence.js into alignment. |
| Doctor-name prefix on emergency | **`zi-phone` — MISSING** | New sprite needed; see §3. |
| "Call Now" link prefix (both branches) | **`zi-phone` — MISSING** | Same new sprite. |

Sprite additions are cheap (single SVG injection in `template.html`); cost lives in the audit chain, not the file edit.

---

## 3. New sprite — `zi-phone`

### 3.1 Insertion site

`template.html` sprite block, alphabetic neighborhood. Sit it adjacent to `zi-pill` (`:21`) and `zi-party` (`:36`) to preserve the soft alphabetic-ish order already in the sprite block. Final placement: after `zi-pill`, before `zi-shield`.

### 3.2 Candidate SVG (stroke-based, matching zi-bell / zi-syringe aesthetic)

```html
<symbol id="zi-phone" viewBox="0 0 24 24">
  <path d="M5 4c0-.5.4-1 1-1h2.5c.5 0 .9.3 1 .8l1 3.2c.1.5-.1 1-.5 1.3l-1.5 1c1 2.5 3 4.5 5.5 5.5l1-1.5c.3-.4.8-.6 1.3-.5l3.2 1c.5.1.8.5.8 1V19c0 .6-.5 1-1 1c-8.8 0-16-7.2-16-16z"
        stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="currentColor" fill-opacity="0.1"/>
</symbol>
```

### 3.3 QA notes for Maren

- The doctor-card pediatrician CTA is the load-bearing path for a 2am parent. Maren should sanity-check that the new sprite renders with **sufficient visual weight** at the badge size used in `sc-doctor-card` (`.fs-sm` for the name, `.fs-md` for the call link). Stroke-1.5 may need bumping to 1.8 if the sprite reads thin in dark-mode rose tint.
- The sprite carries `currentColor` so it inherits whatever rose/sage tint the surrounding `sc-doctor-card` class applies — no token change required.

### 3.4 Verification

After build, `grep -c 'id="zi-phone"' split/template.html` MUST equal 1.

---

## 4. DRY consolidation — three options (Sovereign decision required)

The render loop at `intelligence.js:11955–11969` and `medical.js:2474–2493` is the same surface with drift (§1.1). Both call `_scDoctorCardHTML` (defined once at `medical.js:2536`), so the doctor-card helper is **not** duplicated — only the result-list renderer is.

### Option A — Extract to `medical.js` (recommended baseline)

Add `_renderSymptomCheckerResults(matches, mo)` to `medical.js` (Care jurisdiction, where the canonical version already exists post-drift-resolution). `intelligence.js:11951–11974` collapses to:

```js
resultEl.innerHTML = _renderSymptomCheckerResults(matches, mo);
```

**Pros:** Symptom Checker is fundamentally a Care surface; medical.js is its natural home. The doctor-card helper already lives there. Concat order works (medical loads before intelligence).
**Cons:** Couples the Home overlay (Intelligence surface) to a Care helper. Slight cross-jurisdiction coupling.

### Option B — Extract to `core.js`

Neutral utility module. Both medical.js and intelligence.js call into core.js.
**Pros:** Cleanest jurisdiction separation. core.js is the canonical "shared utility" home.
**Cons:** Symptom Checker logic isn't a utility — it's a domain renderer. Adding 40+ LOC of medical-domain HTML to core.js bloats the utility module against its single-responsibility brief.

### Option C — Extract to `intelligence.js`

Home overlay is the primary user-facing call site; ISL is the parent system.
**Cons:** medical.js would call intelligence.js — **concat-order violation**. Medical loads before Intelligence. Hard-blocker.

### Recommendation: **Option A** (medical.js host).

Sovereign decision requested in §9.

### 4.1 Helper signature (Option A)

```js
function _renderSymptomCheckerResults(matches, ageMo) {
  // 1. Sort matches by severity rank, score
  // 2. shown = matches.slice(0, 2)
  // 3. hasEmergency = shown.some(...)
  // 4. Render badge + sections + emergency-care subsection per entry
  // 5. Append _scDoctorCardHTML(hasEmergency) iff hasEmergency || any callDoctor
  // 6. Append fever/diarrhoea/vomiting/cold tracking CTAs per active-episode gate
  // 7. Append disclaimer
  // Returns HTML string. Caller writes to its own result-el (homeSymptomResult vs medSymptomResult).
}
```

Caller responsibilities (preserved per file):
- `intelligence.js` `runHomeSymptomCheck()` → owns input parsing, SYMPTOM_DB matching, write to `#homeSymptomResult`.
- `medical.js` `runSymptomCheck()` (or equivalent — verify call site) → owns same, writes to `#symptomResult`.

Both compute `matches` + `mo`, then call `_renderSymptomCheckerResults(matches, mo)` and inject the returned HTML.

### 4.2 Risk: episode-tracking CTAs

The fever/diarrhoea/vomiting/cold "track this" CTAs (`intelligence.js:11976–12003`, `medical.js:~2500–2530`) reference functions defined in `medical.js` (`getActiveFeverEpisode`, `startFeverEpisode`, etc.). Concat order is fine for medical.js callers; intelligence.js already calls these today, so consolidation doesn't change the access pattern.

---

## 5. Edit list (post-audit, build-mode only)

| # | File | Site | Change |
|---|---|---|---|
| 1 | `split/template.html` | sprite block, after `zi-pill` | INSERT `<symbol id="zi-phone" …>` per §3.2 |
| 2 | `split/medical.js` | `:2477` (sevLabel ternary) | `'\u{1F6A8} Emergency'` → `zi('siren') + ' Emergency'`; `'⚠️ Monitor closely'` → `zi('warn') + ' Monitor closely'`; `'✅ Usually manageable'` → `zi('check') + ' Usually manageable'` |
| 3 | `split/medical.js` | `:2543` (doctor name prefix) | `'\u{1F4DE} '` → `zi('phone') + ' '` |
| 4 | `split/medical.js` | `:2545` (call link prefix, both branches) | `'☎️ Call Now: '` → `zi('phone') + ' Call Now: '`; `'☎️ '` → `zi('phone') + ' '` |
| 5 | `split/medical.js` | new function below existing render | DEFINE `_renderSymptomCheckerResults(matches, ageMo)` per §4.1 |
| 6 | `split/medical.js` | existing render loop `~:2474–2493` | REPLACE inline render with `html = _renderSymptomCheckerResults(matches, mo);` |
| 7 | `split/intelligence.js` | `:11955–12003` | REPLACE inline render + episode-tracking with `html = _renderSymptomCheckerResults(matches, mo);` |
| 8 | `docs/BUGS.md` | Open Bugs → CSS / Design System | MOVE the `medical.js:2255 vs intelligence.js:11958` P2 entry to "Fixed Bugs (Stability sub-phase)" once this PR merges. Append HR-1 sweep note. |

---

## 6. HR-by-HR audit (this spec)

| HR | Status | Evidence |
|---|---|---|
| HR-1 (no emojis; zi only) | **Primary purpose** | All 6 in-screenshot escapes + 1 inferred (`warning` branch) ported. Drift fix on `:11965` brings intelligence.js into alignment with medical.js. |
| HR-2 (no inline styles) | Out-of-scope; **forward-pointer** | `_scDoctorCardHTML` inline `style="font-weight:700;..."` remains. New R-10 entry to be filed. |
| HR-3 (no inline handlers) | Out-of-scope; **forward-pointer** | `medical.js:2538` `onclick="..."` remains. New R-10 entry. |
| HR-4 (escHtml at render boundaries) | ✓ preserved | All entry-data interpolations (`e.title`, `e.whatToDo`, `e.precautions`, `e.emergency`, `doc.name`, `doc.title`, `doc.phoneDisplay`, `doc.address`) remain `escHtml()`-wrapped. zi() returns trusted constant SVG markup — does not require escHtml. |
| HR-5 (token spacing) | ✓ no change | |
| HR-6 (data-action delegation) | Out-of-scope (HR-3 row) | |
| HR-7 (zi via innerHTML) | ✓ preserved | `resultEl.innerHTML = html;` set unchanged. |
| HR-8 (Coming-soon toast for stubs) | N/A | |
| HR-9 (post-build multi-round QA) | **Mandated** | Maren + Kael parallel audit on this spec → impl → Cipher Edict V post-impl. |
| HR-10 (no text-overflow ellipsis) | ✓ no change | |
| HR-11 (Math.floor currency) | N/A | |
| HR-12 (timezone-safe dates) | N/A | |

---

## 7. Audit chain (canon-cc-008)

```
[1] Lyra      → drafts this spec (DONE — this file)
[2] Maren     → audits Care jurisdiction in parallel with Kael:
                · medical.js sevLabel ternary correctness
                · doctor card visual weight (zi-phone stroke / fill)
                · _renderSymptomCheckerResults Care-side parental-safety surface
                · "what if a parent acts on this" lens on the badge/section-header glyphs
                · null-guards: confirm getPrimaryDoctor() no-doctor branch is unaffected
[3] Kael      → audits Intelligence jurisdiction in parallel with Maren:
                · intelligence.js call-site collapse correctness
                · ISL Home-overlay path (no behavior delta intended; verify identical HTML output)
                · template.html sprite addition (shared module — also reviewed by Maren)
                · episode-tracking CTA wiring preserved across the helper boundary
[4] Lyra      → synthesizes both Governor reports; folds amendments into v2 of this spec
[5] Sovereign → decides §4 consolidation option (A / B / C)
[6] Lyra      → builds per the synthesized + Sovereign-decided spec (Mode 2)
[7] Cipher    → Edict V cross-cutting pass on impl:
                · grep verification: 0 literal emoji in Symptom Checker render path
                · HR-1 / HR-4 / HR-7 holistic re-check
                · Cross-Governor integration (medical.js ↔ intelligence.js helper boundary)
                · BUGS.md P2 entry retirement correctness
```

**No short-circuits.** No Mode-2 build before [5] Sovereign §4 decision.

---

## 8. Verification fixtures

### 8.1 Static

```bash
# Symptom Checker render path must contain zero literal/escape emoji:
grep -cE "\\\\u\{1F|\\\\u26[0-9A-F][0-9A-F]|\\\\u27[0-9A-F][0-9A-F]|\\\\u2705|[\\xF0-\\xF4][\\x80-\\xBF]{3}" split/medical.js split/intelligence.js
# Must report 0 inside the Symptom Checker function bodies
# (the broader file may still contain other HR-1 violations — R-10 queue, not this PR)

# zi-phone sprite present:
grep -c 'id="zi-phone"' split/template.html  # MUST equal 1
```

### 8.2 Visual (real-device, post-build)

Re-capture all three Sovereign screenshots in both light and dark mode:
- Constipation → `zi-check` ringed circle (sage tint) before "Usually manageable"
- Crying a lot → `zi-warn` triangle (amber tint) before "Monitor closely" **AND** verify the badge is rendering (closes the §0.2 carry-over question)
- Fall/injury → `zi-siren` before "Emergency" badge AND before "WHEN TO SEEK EMERGENCY CARE" section header; `zi-phone` before "Dr. RK Agarwal" AND before "Call Now: …"

### 8.3 DOM

Inspect `#homeSymptomResult` and `#symptomResult` (whichever names exist post-rename) — every emoji site MUST resolve to `<svg class="zi"><use href="#zi-{siren|warn|check|phone}"/></svg>` with **no text-node Unicode glyph siblings**.

---

## 9. Open questions for Sovereign

| ID | Question | Default if no answer | Blocks |
|---|---|---|---|
| Q1 | §4 consolidation host: Option A (medical.js), B (core.js), or C (intelligence.js — blocked by concat order)? | A | Build phase [6] |
| Q2 | Doctor-card gating (deferred per 2026-05-11 Sovereign answer). File as separate spec post-merge, or fold into a follow-on? | Separate spec | None for this PR |
| Q3 | Crying-state severity-badge dark-mode investigation — open as bug or close as "not reproducible after rebuild"? | Open as P1 bug if reproducible post-merge | None for this PR |

---

## 10. Changelog

- **v1 (2026-05-11):** initial draft. Awaiting Maren + Kael parallel audit.
