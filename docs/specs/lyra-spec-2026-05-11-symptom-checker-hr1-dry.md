# Lyra Spec — 2026-05-11 — Symptom Checker HR-1 sweep + DRY consolidation

**Author:** Lyra (Builder)
**Mode:** 1 (spec authoring; signed audit-bearing artifact per canon-cc-022)
**Status:** v3 DRAFT — Maren ‖ Kael audit returns folded; awaiting Sovereign ratification, then Mode-2 build, then Cipher Edict V on impl
**Branch:** `claude/review-markdown-screenshots-uOIgQ`
**Trigger:** Sovereign screenshot review (3 captures: Constipation / Crying / Fall) revealed legacy emoji escapes that survived Polish-10/11. Spec-first per Sovereign direction.

> **v3 changelog (2026-05-12, this revision):** Audit-chain `[4]` Lyra synthesis after Maren `[2]` + Kael `[3]` parallel returns.
> - **Maren B-M1 folded — Crying-badge root cause confirmed.** H1 (sage-on-sage dark-mode contrast collapse) is the actual mechanism; H2 keyword-overlap refuted; H3 specificity-collision spec-leans-refuted (final grep gate at build-time). Fix specced into §0.1 #4 + §5 edit list with opacity bump 0.20→0.22 and light-mode parallel verification.
> - **Maren B-M2 folded — pre-merge diff gate added.** Lyra-internal step before Mode-2 build opens: side-by-side diff of duplicated render loops + episode-CTA pairs, committed to build-PR description, Maren reads.
> - **Maren B-M3 folded — Q2 tightened.** Doctor-card gating moves into **D1 scope explicitly (not D2)**; bridge merge → D1 phase-spec opening must be tight-sequenced (no intermediate work between bridge merge and D1 opening).
> - **Kael B-K1 folded — boundary contract codified.** Helper purity invariants + canonicalization note for `_sc*` prefix convention added to §4.1 + §5 + §8.1.
> - **Kael B-K2 folded — sprite placement disambiguation.** Build-time grep enumeration required; added to §3 + §8.1.
> - **Kael B-K3 folded — escape-context audit clean.** No shifts introduced; adjacent `title=""` grep added to §8.1 as standing reinforcement.
> - **Kael B-K4 folded — escHtml stays put.** Pre-impl location grep added to §8.1; no helper move in this PR.

---

## 0. Scope

### 0.1 In-scope

1. Replace **all** literal/escape-coded emoji in the Symptom Checker render path with `zi()` sprite refs (HR-1).
2. Consolidate the duplicated render function between `medical.js` and `intelligence.js` (BUGS.md P2, `docs/BUGS.md:73` — DRY refactor candidate flagged by Cipher during Polish-2). **Host: medical.js (Option A, Sovereign-decided v2 Q1; boundary contract codified per Kael B-K1, §4.1).**
3. Add a new `zi-phone` symbol to `template.html` sprite (no existing telephone glyph in the 62-symbol sprite). **Placement disambiguation via build-time grep per Kael B-K2 (§3.1).**
4. **Crying-state severity-badge fix** (v3 — Maren B-M1 confirmed H1):
   - Add `[data-theme="dark"] .sc-mild .sc-sev-badge { background:rgba(58,112,96,0.22); color:var(--tc-sage-light); border:1px solid rgba(58,112,96,0.35); }` to `styles.css`.
   - If `--tc-sage-light` token doesn't exist, commission it (single token addition); fallback to `--rose-deep`'s sibling deep-sage if one exists in tokens already.
   - Light-mode parallel re-verification: if `.sc-mild .sc-sev-badge` sits at <4.5:1 WCAG-AA in light mode, apply the same opacity-bump to its rule.
   - Verification fixture (§8.2): Maren confirms WCAG-AA ≥4.5:1 on real device, both themes.

### 0.2 Explicitly out-of-scope (deferred per Sovereign direction 2026-05-11)

- **Doctor-card gating** (Emergency-only vs. always-available). Current behavior preserved in this PR: card renders iff `hasEmergency || some entry.callDoctor === true`. **v3 update: folds into D1 phase-spec scope (not D2), per Maren B-M3.** Lyra carries the question forward in the Mode-2 build-PR description with explicit "D1 scope" tag.
- **Wider HR-1 amnesty** (≈95 sites per `docs/design/uniformity-contract.md` §"HR-1 · Sprite-only icons", plus the broader `split/*.js` literal-emoji population — moon phases, weather glyphs, holiday icons, "🆕" markers). Tracked in R-10 queue; this spec does not touch them.
- HR-2 inline styles in `_scDoctorCardHTML` (`style="font-weight:700;..."`, `style="font-size:var(--fs-md);..."`). Forward-pointer only.
- HR-3 inline handler in `_scDoctorCardHTML` no-doctor branch (`onclick="event.preventDefault();openDoctorModal()"` at `medical.js:2538`). Forward-pointer only.

### 0.3 Why spec-first

The DRY consolidation re-routes a Care-jurisdiction surface (medical.js) through an Intelligence-jurisdiction caller (intelligence.js Home overlay). Touching both files mandates **parallel Governor audit** per canon-cc-008 before any line of code changes. Mode-2 build-mode is not authorized until audit-chain `[4]` + Sovereign ratification complete.

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

### 1.2 Pre-merge diff gate (v3 add — Maren B-M2)

Before any Mode-2 build edit, Lyra produces a **side-by-side diff** of the duplicated surfaces, committed to the build-PR description, with Maren reading:

- `medical.js:2474–2493` vs `intelligence.js:11955–11969` (render loop)
- `medical.js:~2500–2530` vs `intelligence.js:11976–12003` (episode-tracking CTAs)

Diff intent: surface every divergence (including the known siren drift), confirm medical-side semantics are the ones we want to preserve. **Any field where intelligence-side semantics are correct gets promoted into the consolidated helper before the call-site collapse**, not silently lost.

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

### 3.1 Insertion site (v3 — Kael B-K2)

Spec intent: sit `zi-phone` adjacent to `zi-pill` and `zi-shield` in the alphabetic neighborhood. The spec's original placement instruction ("after `zi-pill` (`:21`), before `zi-shield`") was correct on the spec writer's mental model but didn't account for the actual sprite order — `zi-party` (`:36`) sits between `zi-pill` and the alphabetic position phone should occupy.

**Build-time grep gate:** `grep -n '<symbol id="zi-' split/template.html` enumerates the current `<symbol>` order. Place `zi-phone` such that:
- Adjacent to `zi-pill` and `zi-shield` per the spec's neighborhood intent
- Disambiguated against `zi-party` per ground-truth ordering
- Final placement committed to Mode-2 build-PR description with the enumerated line numbers

### 3.2 Candidate SVG (stroke-based, matching zi-bell / zi-syringe aesthetic — Kael B-K2 confirmed family-consistent)

```html
<symbol id="zi-phone" viewBox="0 0 24 24">
  <path d="M5 4c0-.5.4-1 1-1h2.5c.5 0 .9.3 1 .8l1 3.2c.1.5-.1 1-.5 1.3l-1.5 1c1 2.5 3 4.5 5.5 5.5l1-1.5c.3-.4.8-.6 1.3-.5l3.2 1c.5.1.8.5.8 1V19c0 .6-.5 1-1 1c-8.8 0-16-7.2-16-16z"
        stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="currentColor" fill-opacity="0.1"/>
</symbol>
```

Per-attribute audit (Kael B-K2): `viewBox` standard 24-grid, `stroke=currentColor` theme-inheriting, `stroke-width=1.5` matches family baseline, `stroke-linejoin=round` matches family, `fill=currentColor` + `fill-opacity=0.1` subtle body; no hardcoded colours; theme-agnostic; no `<title>` slot needed (decorative only across consumers).

### 3.3 QA notes for Maren

- The doctor-card pediatrician CTA is the load-bearing path for a 2am parent. Maren should sanity-check that the new sprite renders with **sufficient visual weight** at the badge size used in `sc-doctor-card` (`.fs-sm` for the name, `.fs-md` for the call link). Kael B-K2 verdict: stroke-1.5 is correct for family consistency at spec time; visual-weight escalation to 1.8 is a real-device call.
- The sprite carries `currentColor` so it inherits whatever rose/sage tint the surrounding `sc-doctor-card` class applies — no token change required.

### 3.4 Verification

After build, `grep -c 'id="zi-phone"' split/template.html` MUST equal 1. Additionally, `zi()` helper must default to `aria-hidden="true"` (build-time grep — see §8.1 Kael-K2 #2; if not, raise separately).

---

## 4. DRY consolidation — Sovereign Q1 → Option A (medical.js host)

The render loop at `intelligence.js:11955–11969` and `medical.js:2474–2493` is the same surface with drift (§1.1). Both call `_scDoctorCardHTML` (defined once at `medical.js:2536`), so the doctor-card helper is **not** duplicated — only the result-list renderer is.

### 4.1 Helper signature + boundary contract (v3 — Kael B-K1)

```js
function _renderSymptomCheckerResults(matches, ageMo) {
  // 1. Sort matches by severity rank, score
  // 2. shown = matches.slice(0, 2)
  // 3. hasEmergency = shown.some(...)
  // 4. Render badge + sections + emergency-care subsection per entry
  // 5. Append _scDoctorCardHTML(hasEmergency) iff hasEmergency || any callDoctor
  // 6. Append fever/diarrhoea/vomiting/cold tracking CTAs per active-episode gate
  // 7. Append disclaimer
  // Returns HTML string. Caller writes to its own result-el.
}
```

**Boundary contract** (Kael B-K1):

```
medical.js (Care host — single source of truth for SC render)
├── _renderSymptomCheckerResults(matches, ageMo): string    [PURE renderer]
├── _scDoctorCardHTML(hasEmergency, doctor?): string        [pre-existing]
├── getActiveFeverEpisode / startFeverEpisode / ...         [episode helpers]
└── runSymptomCheck()                                       [Care-tab caller]
       └── target el: #symptomResult

intelligence.js (Intel consumer)
└── runHomeSymptomCheck()                                   [Home-overlay caller]
       ├── parses #homeSymptomInput
       ├── matches against SYMPTOM_DB
       ├── calls medical.js:_renderSymptomCheckerResults(matches, mo)
       └── target el: #homeSymptomResult
```

**Purity invariants on the helper (Kael-required, build-time grep verified per §8.1):**
- No `document.*` reads inside the helper.
- No `document.*` writes inside the helper.
- No event-handler binding (no `addEventListener`, no `data-action` resolution at render time — emission only).
- No mutation of `matches`, `ageMo`, or any global state.
- Return type: string (HTML fragment). Caller owns the innerHTML write to its own target el.

**Cycle check (Kael B-K1):** import direction `intelligence.js → medical.js` is one-way; medical.js loads first per concat order; helper is a pure HTML-string emitter with no back-reference path. **No cycle possible.**

**Canonicalization note (Kael B-K1):** this consolidation establishes a recurring pattern — "Care-domain renderers live in `medical.js`; Intel callers consume by named export." The `_sc*` prefix keeps it grep-able. Documented in the Mode-2 build PR description as precedent for future medical/intel surface boundaries (e.g. growth gauge, diet).

### 4.2 Risk: episode-tracking CTAs

The fever/diarrhoea/vomiting/cold "track this" CTAs (`intelligence.js:11976–12003`, `medical.js:~2500–2530`) reference functions defined in `medical.js` (`getActiveFeverEpisode`, `startFeverEpisode`, etc.). Concat order is fine for medical.js callers; intelligence.js already calls these today, so consolidation doesn't change the access pattern.

---

## 5. Edit list (post-audit, build-mode only)

| # | File | Site | Change |
|---|---|---|---|
| 1 | `split/template.html` | sprite block, disambiguated placement per §3.1 grep | INSERT `<symbol id="zi-phone" …>` per §3.2 |
| 2 | `split/medical.js` | `:2477` (sevLabel ternary) | `'\u{1F6A8} Emergency'` → `zi('siren') + ' Emergency'`; `'⚠️ Monitor closely'` → `zi('warn') + ' Monitor closely'`; `'✅ Usually manageable'` → `zi('check') + ' Usually manageable'` |
| 3 | `split/medical.js` | `:2543` (doctor name prefix) | `'\u{1F4DE} '` → `zi('phone') + ' '` |
| 4 | `split/medical.js` | `:2545` (call link prefix, both branches) | `'☎️ Call Now: '` → `zi('phone') + ' Call Now: '`; `'☎️ '` → `zi('phone') + ' '` |
| 5 | `split/medical.js` | new function below existing render | DEFINE `_renderSymptomCheckerResults(matches, ageMo)` per §4.1 (purity invariants) |
| 6 | `split/medical.js` | existing render loop `~:2474–2493` | REPLACE inline render with `html = _renderSymptomCheckerResults(matches, mo);` |
| 7 | `split/intelligence.js` | `:11955–12003` | REPLACE inline render + episode-tracking with `html = _renderSymptomCheckerResults(matches, mo);` |
| 8 | `split/styles.css` | append in dark-mode override block (near `:6021`) | INSERT `[data-theme="dark"] .sc-mild .sc-sev-badge { background:rgba(58,112,96,0.22); color:var(--tc-sage-light); border:1px solid rgba(58,112,96,0.35); }` per §0.1 #4 |
| 9 | `split/styles.css` | light-mode `.sc-mild .sc-sev-badge` rule (`:5999`) | CONDITIONAL bump if §8.2 light-mode WCAG verification fails: opacity `0.10 → 0.22` parallel to dark-mode fix |
| 10 | `docs/BUGS.md` | Open Bugs → CSS / Design System | MOVE the `medical.js:2255 vs intelligence.js:11958` P2 entry to "Fixed Bugs (Stability sub-phase)" once this PR merges. Append HR-1 sweep note. Mark Crying-badge P1 entry RESOLVED with cross-ref to §0.1 #4. |

---

## 6. HR-by-HR audit (this spec)

| HR | Status | Evidence |
|---|---|---|
| HR-1 (no emojis; zi only) | **Primary purpose** | All 6 in-screenshot escapes + 1 inferred (`warning` branch) ported. Drift fix on `:11965` brings intelligence.js into alignment with medical.js. |
| HR-2 (no inline styles) | Out-of-scope; **forward-pointer** | `_scDoctorCardHTML` inline `style="font-weight:700;..."` remains. New R-10 entry to be filed. |
| HR-3 (no inline handlers) | Out-of-scope; **forward-pointer** | `medical.js:2538` `onclick="..."` remains. New R-10 entry. |
| HR-4 (escHtml at render boundaries) | ✓ preserved | All entry-data interpolations (`e.title`, `e.whatToDo`, `e.precautions`, `e.emergency`, `doc.name`, `doc.title`, `doc.phoneDisplay`, `doc.address`) remain `escHtml()`-wrapped. zi() returns trusted constant SVG markup — does not require escHtml. Kael B-K3: no escape-context shift introduced; all 6 ports are body-text → body-text. |
| HR-5 (token spacing) | ✓ no change | |
| HR-6 (data-action delegation) | Out-of-scope (HR-3 row) | |
| HR-7 (zi via innerHTML) | ✓ preserved | `resultEl.innerHTML = html;` set unchanged. |
| HR-8 (Coming-soon toast for stubs) | N/A | |
| HR-9 (post-build multi-round QA) | **Mandated** | Maren + Kael parallel audit DONE; Lyra synthesis DONE; Cipher Edict V post-impl pending. |
| HR-10 (no text-overflow ellipsis) | ✓ no change | |
| HR-11 (Math.floor currency) | N/A | |
| HR-12 (timezone-safe dates) | N/A | |

---

## 7. Audit chain (canon-cc-008)

```
[1] Lyra      → drafted this spec (DONE — v1 → v2 Sovereign Q1/Q2/Q3 → v2.1 vision sibling)
[2] Maren     → audited Care jurisdiction (DONE 2026-05-12):
                · B-M1: §11 Crying-badge — H1 confirmed; H2 refuted; H3 spec-leans-refuted
                · B-M2: medical.js consolidation safety — pre-merge diff gate required
                · B-M3: doctor-card gating deferral — D1 (not D2), tight-sequencing
[3] Kael      → audited Intelligence jurisdiction (DONE 2026-05-12):
                · B-K1: intelligence.js boundary post-DRY — acyclic + purity-invariant
                · B-K2: zi-phone sprite — family-consistent; placement grep needed
                · B-K3: template.html surface delta — no escape-context shift
                · B-K4: helper boundary — no move in this PR; pre-impl escHtml grep
[4] Lyra      → synthesis (DONE 2026-05-12 — this v3): folded B-M1..B-M3 + B-K1..B-K4
[5] Sovereign → ratification of v3 spec (PENDING — bridge merges to main on ratification)
[6] Lyra      → Mode-2 build per v3 (PENDING ratification):
                · pre-merge diff gate (§1.2) committed to build-PR description
                · four 1-line build-time grep gates per §8.1
                · Maren WCAG-AA verification on contrast fix (§8.2)
                · Crying-badge P1 + HR-1 ports + DRY consolidation atomic
[7] Cipher    → Edict V cross-cutting pass on impl (PENDING build):
                · grep verification: 0 literal emoji in Symptom Checker render path
                · HR-1 / HR-4 / HR-7 holistic re-check
                · Cross-Governor integration (medical.js ↔ intelligence.js helper boundary)
                · BUGS.md P1 + P2 entry retirement correctness
                · _sc* canonicalization pattern documentation acceptance
```

**No short-circuits.** No Mode-2 build before [5] Sovereign ratification.

---

## 8. Verification fixtures

### 8.1 Static (build-time grep gates, committed to Mode-2 build-PR description)

```bash
# 1. Symptom Checker render path must contain zero literal/escape emoji:
grep -cE "\\\\u\{1F|\\\\u26[0-9A-F][0-9A-F]|\\\\u27[0-9A-F][0-9A-F]|\\\\u2705|[\\xF0-\\xF4][\\x80-\\xBF]{3}" split/medical.js split/intelligence.js
# Must report 0 inside the Symptom Checker function bodies
# (the broader file may still contain other HR-1 violations — R-10 queue, not this PR)

# 2. zi-phone sprite present, count = 1:
grep -c 'id="zi-phone"' split/template.html  # MUST equal 1

# 3. Sprite placement disambiguation (Kael B-K2):
grep -n '<symbol id="zi-' split/template.html
# Enumerate current order; document final zi-phone position in build PR

# 4. zi() helper aria-hidden default (Kael B-K2):
grep -n 'function zi' split/*.js
# Confirm aria-hidden="true" default; if not, raise separately (not blocking)

# 5. Adjacent title="..." attribute risk class (Kael B-K3):
grep -n 'title="' split/medical.js split/intelligence.js | grep -E 'symptom|sc-|doctor'
# Confirm 0 title="..." attributes in SC render path receive zi(...) output
# (BUGS.md Polish-10 SVG-in-data reinforcement)

# 6. _renderSymptomCheckerResults purity (Kael B-K1):
# After impl, inside the function body:
grep -nE 'document\.|addEventListener|innerHTML\s*=' split/medical.js
# In the function-body context: MUST return 0 hits

# 7. escHtml location (Kael B-K4):
grep -n 'function escHtml' split/*.js
# Commit helper location to Mode-2 build PR description for traceability
# (Expected: core.js — confirm; no move belongs in this PR regardless)
```

### 8.2 Visual (real-device, post-build) — Maren-verified

Re-capture all three Sovereign screenshots in both light and dark mode:
- Constipation → `zi-check` ringed circle (sage tint) before "Usually manageable"
- Crying a lot → `zi-warn` triangle (amber tint) before "Monitor closely" **AND** verify the badge is rendering with **WCAG-AA ≥4.5:1 contrast on real device, both themes** (closes BUGS.md P1)
- Fall/injury → `zi-siren` before "Emergency" badge AND before "WHEN TO SEEK EMERGENCY CARE" section header; `zi-phone` before "Dr. RK Agarwal" AND before "Call Now: …"

**Maren contrast-verification commitment (B-M1 #3):** "Maren confirms WCAG-AA ≥4.5:1 on `.sc-mild .sc-sev-badge` text-on-bg, dark mode, real device" added to build-PR description. Light-mode parallel re-verify identically. If either fails: don't ship D1's `0.20` value either — return to fixed `0.22`.

### 8.3 DOM

Inspect `#homeSymptomResult` and `#symptomResult` — every emoji site MUST resolve to `<svg class="zi"><use href="#zi-{siren|warn|check|phone}"/></svg>` with **no text-node Unicode glyph siblings**.

---

## 9. Open questions for Sovereign

| ID | Question | v3 Resolution | Notes |
|---|---|---|---|
| Q1 | §4 consolidation host: Option A (medical.js), B (core.js), or C (intelligence.js — blocked by concat order)? | **Option A (medical.js host)** | Sovereign accepted 2026-05-11; Kael B-K1 confirmed acyclic + clean. Boundary contract codified §4.1. |
| Q2 | Doctor-card gating — separate spec post-merge, or fold into a follow-on? | **D1 phase-spec scope (tight-sequenced)** | v3 tightening per Maren B-M3: "D1 or D2" → "D1 explicitly." Bridge merge → D1 phase-spec opening immediately; no intermediate work between. Doctor-card gating + hierarchy flip ship together in D1. |
| Q3 | Crying-state severity-badge dark-mode investigation — open as bug or close as "not reproducible after rebuild"? | **P1 fix specced** (Maren B-M1 H1 confirmed) | Mechanism: `.sc-mild .sc-sev-badge` resolves to sage-on-sage in dark mode; perceptual collapse to single hue. Fix lives in Mode-2 build (§0.1 #4, §5 edit #8/#9). |

---

## 10. Changelog

- **v1 (2026-05-11):** initial draft. Awaiting Maren + Kael parallel audit.
- **v2 (2026-05-11):** Sovereign decisions on Q1/Q2/Q3 folded. Crying-state badge pulled into scope (§0.1 #4, §11). Doctor-card gating confirmed as follow-on PR. Consolidation host confirmed as medical.js. P1 BUGS.md entry filed.
- **v2.1 (2026-05-11):** §12 forward-pointer added — Sovereign opened the long-arc Symptom Checker UX vision (D3-first vision spec; phased D1→D2→D3 implementation rollout). Bridge PR scope unchanged; vision spec is a companion artifact.
- **v3 (2026-05-12):** Audit-chain [4] Lyra synthesis. Maren B-M1/B-M2/B-M3 + Kael B-K1/B-K2/B-K3/B-K4 folded. §11 Crying-badge: H1 confirmed; fix specced into §0.1 #4 + §5 edits #8/#9 with opacity bump 0.20→0.22 and light-mode parallel. §1.2 NEW: pre-merge diff gate (Maren B-M2). §3.1 placement grep gate (Kael B-K2). §4.1 boundary contract + purity invariants + `_sc*` canonicalization (Kael B-K1). §8.1 expanded to seven build-time grep gates. Q2 tightened: D1 scope (not D1-or-D2) for doctor-card gating, per Maren B-M3.

---

## 11. Crying-state badge investigation (v3 — Maren B-M1 confirmed)

### 11.1 Sovereign evidence

Screenshot 2 of 3 (Sovereign capture, dark mode, "Crying a lot" chip-tap result) shows the result body starting directly with the title "Excessive Crying / Fussiness" and the WHAT TO DO section — **no visible `<span class="sc-sev-badge">…</span>`** between the chip row and the title. Screenshots 1 (Constipation, also `severity: 'mild'`) and 3 (Fall, `severity: 'emergency'`) both render their badges cleanly. Identical render code path; different visual outcome.

### 11.2 Source mapping

- SYMPTOM_DB entry: `data.js:3411–3419` (`id: 'crying-fussy'`, `severity: 'mild'`, `title: 'Excessive Crying / Fussiness'`).
- Render path: `intelligence.js:11955–11969` (Home overlay, the path the screenshot was taken from). Badge emit is unconditional: `html += '<span class="sc-sev-badge">' + sevLabel + '</span>';`.
- Severity → class mapping: `severity: 'mild'` → `sevClass = 'sc-mild'` → CSS `.sc-mild .sc-sev-badge { background:rgba(58,112,96,0.1); color:var(--tc-sage); }` (`styles.css:5999`).
- Dark-mode override on `.sc-mild` (container): `[data-theme="dark"] .sc-mild { background:rgba(58,112,96,0.05); border-color:rgba(58,112,96,0.15); }` (`styles.css:6021`). **No dark-mode override exists for `.sc-mild .sc-sev-badge` itself.**

### 11.3 Root-cause (v3 — Maren B-M1)

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | Sage-on-sage contrast collapse — `.sc-badge` foreground token (`--tc-sage`) resolves near-identical to `[data-theme="dark"] .sc-mild` background in dark mode. | **CONFIRMED (mechanism)** | Effective dark-mode stack: ~10% sage badge over ~5% sage container over `--bg-canvas`. Badge bg-luminance shifts toward sage-mid; foreground `--tc-sage` is sage-mid. Sub-AA contrast. Constipation card (also mild) rendered visibly in Sovereign capture → contrast margin is already at the edge and capture-condition-dependent. A margin that depends on capture conditions has already failed. |
| H2 | Keyword-overlap — `crying-fussy` triggers a class-name collision with another `.sc-*` selector that strips the badge background. | **REFUTED** | Badge emit is unconditional and severity-class-driven (`intelligence.js:11955`). No keyword-derived class is appended to `.sc-result`. Mechanism not available. |
| H3 | Specificity collision — a later rule (likely from the `crying` symptom-specific block) wins and zeroes `background` or `border`. | **SPEC-LEANS-REFUTED** (final gate at build-time) | Spec grep guidance (§11.3 in v2) found no late-winning override on `.sc-sev-badge`. Build-time confirmation: `grep -nE 'sc-sev-badge\|sc-mild' split/styles.css` against head commit before closing definitively. |
| H4 | Render function silently fails on the Crying entry. | ELIMINATED | Title + WHAT TO DO section visible in screenshot — any throw aborting forEach would lose those. |

### 11.4 Fix (Mode-2 build)

Per §0.1 #4 + §5 edit #8:

```css
[data-theme="dark"] .sc-mild .sc-sev-badge {
  background: rgba(58,112,96,0.22);
  color: var(--tc-sage-light);   /* commission if missing */
  border: 1px solid rgba(58,112,96,0.35);
}
```

Class-based and severity-keyed — applies uniformly to **all 6 mild states**, no per-entry regression risk. Constipation card improves alongside Crying. Opacity bumped from vision spec's `0.20` to `0.22` for safety margin against capture-condition variance (Maren-recommended; don't ship at the contrast edge).

### 11.5 Sequencing

Build phase [6] ships HR-1 + DRY + CSS contrast fix **atomically** in a single Mode-2 PR. Light-mode `.sc-mild .sc-sev-badge` re-verification at §8.2; if light-mode also sits <4.5:1, edit #9 fires the same opacity bump parallel.

---

## 12. Forward-pointer — Symptom Checker UX vision (D3-first)

Sovereign mid-spec call 2026-05-11: *"As we are working on this surface now, let's make this beautiful and follow some golden design principles."*

Vision spec opened as a companion to this bridge spec:
**`docs/specs/lyra-spec-2026-05-11-symptom-checker-ux-vision.md`**

The vision captures G1–G11 golden design principles + phased D1→D2→D3 implementation rollout. **It does not change the scope of this bridge PR.** The bridge ships HR-1 + DRY + Crying-badge contrast fix; the vision specs the layout/triage/weave work that follows.

**Sequencing relative to this bridge:**

```
[NOW]   This bridge PR (sproutlab#65)
          ↓ merges
[NEXT]  D1 — Polish PR (severity restructure, persistent rail, sticky CTA, doctor-card gating + flip)
          ↓ merges                                                  ▲
[THEN]  D2 — Severity-driven layout PR + Aurelius content rewrite   ║
          ↓ merges                                                   doctor-card gating
[FUTURE]D3 — Weave-ISL mini-spec + Triage + voice + share + promote  is **D1 scope**
                                                                      (v3 — Maren B-M3)
```

Maren's mode for downstream specs: **deferred** (Sovereign 2026-05-11). Standard audit chain per phase unless co-author is invoked at phase-spec opening.
