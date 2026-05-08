# SproutLab — Uniformity Contract (Phase 3 of design grounding)

**Author:** Lyra (Builder, sproutlab Province; synthesis lead)
**Status:** Draft (Phase 3 of 4 — load-bearing; codifies Phase 2 catalog into enforceable rules)
**Audit base:** `eecc994c855758cd861805e78f42ebefadfe6c59` (split-file source state — same baseline as Phase 1 + Phase 2)
**Spec base:** `a5028334875a463cf98ea0ed13cc4e3bd8b5bb1d` (`main` HEAD post Phase 2 merge — `docs/design/pattern-catalog.md` is the source of truth for PC-N entries; `docs/design/surface-inventory.md` for S-NN entries)
**Brief:** PR #52 [comment 4399402837](https://github.com/Rishabh1804/sproutlab/pull/52#issuecomment-4399402837) — Aurelius (canon-corrected workstream table at [comment 4397164732](https://github.com/Rishabh1804/sproutlab/pull/52#issuecomment-4397164732))
**Folds:** issue [#54](https://github.com/Rishabh1804/sproutlab/issues/54) (closed via Phase 2 fold; contract clause **PC-1**) · issue [#57](https://github.com/Rishabh1804/sproutlab/issues/57) (closed via PR-ε.0.1; Class C sequencing **closed** in **PC-7.3**, escape-contract **simplified to single-wrap** in **PC-2.4** + **PC-7.5**)
**Catalog input:** `docs/design/pattern-catalog.md` (PC-1..PC-10)
**Inventory cross-link:** `docs/design/surface-inventory.md` (S-01..S-17, P-1..P-9)

---

## Line-drift caveat (carry-forward from Phase 1 + Phase 2 footers)

Every line range in this contract is anchored to the audit-base SHA above. Per [issue #55](https://github.com/Rishabh1804/sproutlab/issues/55) (closed via PR #59), `CLAUDE.md`'s line counts for `sync.js` / `medical.js` / `core.js` are now current at HEAD; downstream PRs landing during Phase 3 / Phase 4 will reintroduce drift. **Resolve by function name when the line numbers don't match** — function names are stable identifiers; file:line references are starting points.

---

## Charter

Phase 1 captured reality. Phase 2 made it canonical. **Phase 3 makes it enforceable.** Phase 4 (Aurelius) conforms PR-ε.0 v6.2 against the contract.

**This document is normative.** It binds every PR landing in `sproutlab/main` from this contract's merge forward, against the audit-chain's enforcement authority. Where a PR introduces new code on a covered surface, the rules apply at code-time. Where a PR touches a covered surface that pre-dates this contract, the rules apply on a migration severity ladder set per clause.

For each pattern class (PC-1..PC-10) Phase 2 codified, this contract defines:

1. **Rule statement** — RFC 2119 register (MUST / MUST NOT / SHOULD / SHOULD NOT / MAY).
2. **Severity** — BLOCKER / MAJOR / MINOR, calibrated against intelligence-engine impact (Phase 1 gap-rank → Phase 2 cost map → Phase 3 severity).
3. **Enforcement mechanism** — grep-resolvable check, named verification, or manual-inspection criterion.
4. **Migration cost** — cheap / medium / expensive (carries forward from Phase 2).
5. **Exception conditions** — when the rule does NOT apply.
6. **Cross-reference** — Phase 2 PC-N entry, Phase 1 S-NN entries, related issues, v6.2 spec sections where applicable.

**What this contract does not do.** It does not write executable lint rules — the contract is normative prose, not a tooling configuration. (A separate tooling PR may operationalize the grep-resolvable rules into CI checks; Sovereign-routed if desired.) It does not draft Phase 4's conformance check (Aurelius's pen). It does not propose v6.3 spec amendments (Phase 4 territory). It does not introduce new pattern classes (Phase 2 polish territory). It does not implement any rule (Lyra's future Builder pen on the implementation PR).

---

## Reading guide

### Register

The contract uses RFC 2119 normative register, applied uniformly:

- **MUST / MUST NOT** — absolute requirement / prohibition. Enforced at the audit chain. New code on the covered surface that violates a MUST is a BLOCKER finding; pre-existing violations are migration-severity-flagged.
- **SHOULD / SHOULD NOT** — strong recommendation; deviation requires explicit rationale captured in the PR description.
- **MAY** — optional; the canonical form permits the variant but does not require it.

### Severity ladder

- **BLOCKER** — landing the PR with this finding open is a hard fail. Audit chain rejects until resolved or explicitly waived by Sovereign with rationale chronicled.
- **MAJOR** — landing the PR with this finding open requires a deferred-fix forward-pointer issue + rationale in the PR description. Pattern matches the v6.x spec deferral discipline (cf. issues #53 / #54 / #57).
- **MINOR** — flagged at audit but does not block landing. Captured in a follow-on cleanup queue (Polish-class hygiene).

### Enforcement mechanism types

- **grep** — a one-line `grep` / `wc -l` invocation that an auditor can run mechanically. Rule satisfied iff the invocation returns the expected count or matches the expected pattern. Most reliable; most rules are grep-resolvable.
- **named verification** — a specific test / device / tool invocation (e.g. "iOS VoiceOver real-device test on the picker modal", "Lighthouse a11y audit"). Reliable but requires the named environment.
- **manual inspection** — auditor reads the changed surface and applies judgment against the canonical form. Used sparingly, only where grep / named verification cannot cover the case.

### Migration cost

Carries forward from Phase 2 catalog. Severity is intelligence-engine-impact-driven, NOT cost-driven; the two axes co-vary in Phase 2's cost map but Phase 3 makes the severity call independently.

| Cost label | Definition |
|---|---|
| **cheap** | markup-only change, no JS/behavior touch (e.g. add an `aria-label` attribute) |
| **medium** | markup + small CSS/JS change scoped to one helper or a few sites |
| **expensive** | cross-cutting change touching many files or requiring behavioral redesign |

### HR cross-references

The contract cites SproutLab Hard Rules (HR-1..HR-12 in `CLAUDE.md`) where a rule restates an existing HR with the catalog's evidence base. HR conformance is independently enforced; the contract complements rather than supersedes.

---

## Severity calibration ladder (intelligence-engine impact axis)

The severity assignment per rule derives from this ladder. Phase 1's gap-report ranking is the input axis; Phase 2's migration cost map is the cross-axis; Phase 3's severity is the output.

| Phase 1 gap rank | Phase 2 cost rank | Pattern × surface | Phase 3 severity (this contract) | Folded clause |
|---|---|---|---|---|
| 1 | 1 | PC-4 · `#qlToast` `aria-live` trio | **BLOCKER** | PC-4.1 |
| 2 | 2 | PC-1 · Modal a11y trio + focus trap + Escape (#54) | **BLOCKER** | PC-1.1 / .2 / .3 |
| 3 | 3 | PC-1.2 / PC-2.B · `.ql-option <div>` → `<button>` | **MAJOR** | PC-1.6, PC-2.2 |
| 4 | 4 | PC-3 · Form-input idiom consolidation | **MAJOR** | PC-3.1 / .2 |
| 5 | 5 | PC-5 · Empty-state idiom consolidation | **MAJOR** | PC-5.1 |
| 6 | 6 | PC-6 · Tablist a11y posture | **MAJOR** | PC-6.1 / .2 |
| 7 | 7 | PC-4 · Undo `<button>` | **BLOCKER** | PC-4.2 (folds with PC-4.1) |
| 8 | 8 | PC-7 / #57 · `escAttr` global-fix + Class C sequencing | **MAJOR** (sequencing) / **MINOR** (Class A+B rewrite) | PC-7.3, PC-7.4 |
| 9 | 9 | PC-1 · Six-overlay-family → three canonical | **MINOR** (per surface) | PC-1.7 |
| 10 | 10 | PC-1 / PC-9 / PC-2 / PC-8 · Literal glyph sweep | **MINOR** | PC-1.4, PC-2.4, PC-8.3, PC-9.1 |
| 11 | 11 | PC-3 / PC-7 · Inline `style=""` (228) + inline handlers (36) | **MINOR** | PC-3.3, PC-7.5 |
| 12 | 12 | PC-5 · Loading-state introduction (per-surface) | **MINOR** | PC-5.2 |

**BLOCKERs (3):** the modal-a11y trio + focus trap + Escape (PC-1) and the toast `aria-live` trio + Undo button (PC-4) are the only BLOCKER-tier rules at contract launch. They are the rules where AT-user impact is immediate and mechanically verifiable; they are also the rules PR-ε.0 v6.2 either inherits or directly delivers, so Phase 4's conformance check anchors on them.

**MAJORs (5 clusters):** keyboard accessibility (PC-1.6 / PC-2.2 sheet/chip `<button>`), form-input consolidation (PC-3), empty-state consolidation (PC-5.1), tablist a11y (PC-6), and `escAttr` Class-C sequencing (PC-7.3). Each requires a forward-pointer issue + rationale to land deferred.

**MINORs:** glyph hygiene, inline-style/handler closeout, six-family overlay consolidation, loading-state introduction. Captured in a Polish-class queue.

---

## PC-1 · Modal pattern · folds issue #54

**Catalog input:** [PC-1](./pattern-catalog.md#pc-1--modal--overlay-families--folds-issue-54) (Phase 2 canonical forms 1.1 / 1.2 / 1.3)
**Inventory anchors:** S-08 (Family A modals; 10 + 1 forthcoming via PR-ε.0 v6.2), S-07 (Family B `ql-modal-overlay`; 5), S-06 (`qlSheet` bottom-sheet), S-09 (bug overlay), S-10 (crop overlay), S-11 (avatar lightbox), S-12 (settings sidebar drawer), S-17 (`scrapMilestonePickerModal`)
**Spec:** `docs/specs/lyra-pr-epsilon-0-foundation.md` v6.2 §4 (picker modal markup), §7.7 (modal-btn domain-color pairing)
**Folds:** issue [#54](https://github.com/Rishabh1804/sproutlab/issues/54) (closed via Phase 2 fold) — every #54 acceptance criterion maps to a rule below

### Rules

| ID | Rule | Severity | Enforcement | Migration | Exception |
|---|---|---|---|---|---|
| **PC-1.1** | Every `.modal-overlay > .modal` element MUST carry `role="dialog"` + `aria-modal="true"` + `aria-labelledby` referencing a stable `id` on its title element (`<h3>` or `<h2>`). | **BLOCKER** | grep: `grep -c 'role="dialog"' split/template.html` MUST equal `grep -c '<div class="modal"' split/template.html` (after counting forthcoming dynamic-render modal sites once they migrate to declarative markup) | medium (one helper edit + per-modal markup) | New code: none. Pre-existing 14 surfaces inherit the gap and migrate per the Phase 2 cost map; landing the contract does not unilaterally fail every existing modal at the merge boundary — the migration severity flag carries until each modal lands its uplift. |
| **PC-1.2** | `openModal(id)` MUST activate a focus trap that cycles Tab + Shift-Tab within the modal and never leaks to background page; `closeModal(id)` MUST deactivate the trap and return focus to the caller. A single global `Escape` keydown handler MUST close the topmost open modal. | **BLOCKER** | named verification: keyboard test (Tab to first focusable → Shift-Tab from first focusable → Tab from last focusable; Escape from any focused element). Function-name grep in `split/core.js`: `_modalActivateFocusTrap` / `_modalDeactivateFocusTrap` defined and invoked from `openModal` / `closeModal` respectively. | medium (one-helper-edit shape) | None. Helpers are central; the rule extends them rather than per-modal additions. |
| **PC-1.3** | Backdrop click on `.modal-overlay` MUST close the modal via the existing handler at `core.js:3048–3052` (resolve by function name `_handleModalOverlayClick` if line drift). | **BLOCKER** | grep: `grep -c 'closest(.modal-overlay)' split/core.js` MUST resolve to a click-handler that invokes `closeModal`. | cheap (current handler is correct; rule codifies it) | Family B `ql-modal-overlay` shares the same idiom; Family C bottom-sheet shares it via `data-action="closeQuickLog"`. Six-family overlay consolidation (PC-1.7) eventually unifies the handler; until then, parallel idioms are accepted. |
| **PC-1.4** | Modal close-control glyphs MUST NOT be the literal `&times;` / `×` Unicode glyph. Canonical close glyph is `<svg class="zi" aria-hidden="true"><use href="#zi-close"/></svg>` with `aria-label="Close"` on the parent `<button>`. | **MINOR** | grep: `grep -cE '&times;\|×' split/template.html` MUST equal 0 (or not increase from the audit-base baseline of 14 occurrences pre-migration) | medium (sprite addition `cheap`; per-site rolling `medium`; 14 occurrences in `template.html` audit-base) | The chip × in PR-ε.0 v6.2 §4 already migrates one site; the FAB `+` glyph (`template.html:2142`) is parallel-class but distinct from the close idiom — covered separately under PC-1.5. |
| **PC-1.5** | `.modal` shells MUST NOT carry inline `style=""`. Size extensions MUST ride on additive sub-classes (e.g. `.scrap-picker-modal`, `.vc-reaction-modal`). | **MAJOR** | grep: `grep -E 'class="modal" +style="' split/template.html` MUST return 0 lines. | cheap (per-site class addition + CSS rule consolidation; `foodCatModal` `template.html:2807` is the current sole violation) | None for new code. Pre-existing single-violation (`foodCatModal`) folds into the next modal-uplift PR touching that surface. |
| **PC-1.6** | `qlSheet` (bottom-sheet, S-06) `.ql-option` items MUST be `<button role="menuitem">`, not `<div data-quick-modal="...">`. Sheet container MUST carry `role="dialog" aria-modal="false"` (non-modal sheet) and `aria-labelledby` referencing the sheet title. | **MAJOR** | grep: `grep -cE '<div +class="ql-option' split/template.html` MUST equal 0; `grep -cE '<button[^>]*class="ql-option[^"]*"[^>]*role="menuitem"' split/template.html` MUST cover all 6 sheet items. | expensive (Phase 1 gap-rank-3 — 6 sites + dispatcher rewiring; PC-7 dispatcher consolidation is the natural sequencing peer) | The migration may sequence behind PC-7 dispatcher consolidation if the dispatcher rewiring proves load-bearing. Until landed, the rule applies to new sheet-class surfaces only. |
| **PC-1.7** | Bespoke overlay DOM idioms (`.bug-overlay > .bug-card`, `.crop-overlay`, `.avatar-lightbox`) MUST migrate to one of three canonical families based on interaction shape: bug → modal (form-bearing), crop → modal (selection), lightbox → modal (informational). The settings sidebar (S-12) MUST use `<aside class="sidebar" role="dialog" aria-modal="true">` element-of-record. | **MINOR** | grep: `grep -cE 'class="(bug-overlay\|crop-overlay\|avatar-lightbox)"' split/template.html` MUST equal 0 once migration completes; pre-migration the count is the migration-progress metric. | medium (per surface) × 4 surfaces | Migration is per-surface-PR; no single-PR-fail expectation. New overlay-class surfaces (post-contract) MUST land in canonical form directly. |
| **PC-1.8** | The global `prefers-reduced-motion` block (`split/styles.css:3902`; resolve by function name / selector if line drift) MUST continue to suppress modal transitions. New modal CSS MUST NOT introduce motion that the global block does not cover. | **MAJOR** | grep: `grep -cE '@media \(prefers-reduced-motion: reduce\)' split/styles.css` MUST be ≥ 1 and the matching block MUST contain the modal-transition suppressors. Manual inspection on new modal CSS for motion that escapes the global block. | cheap (existing block already correct; rule codifies it) | None. PR-ε.0 v6.2 §7 inherits this constraint; Phase 4 conformance check verifies. |
| **PC-1.9** | iOS VoiceOver MUST announce the modal title + "dialog" on open. TalkBack MUST announce the dialog role on Android. | **BLOCKER** | named verification: real-device test pre-merge for any PR introducing or migrating a modal. (Maren v4 audit MAJOR pattern; carry-forward from PR-ε.0 v6.2 §4 deferral.) | n/a (test, not code) | Pre-existing modals lacking the trio (PC-1.1) inherit the announce gap; the named verification applies on each modal as it migrates. |

### Notes

- **#54 acceptance criteria fold.** The seven acceptance criteria from issue #54 map to PC-1.1 (a11y trio), PC-1.2 (focus trap + Escape + focus return), PC-1.3 (backdrop click), PC-1.4 (close glyph), PC-1.8 (prefers-reduced-motion), PC-1.9 (real-device announce). The `aria-modal="false"` on `qlSheet` is PC-1.6's territory.
- **Bottom-sheet vs drawer-vs-modal distinction.** `qlSheet` is `aria-modal="false"` (non-modal — a launcher); settings sidebar is `aria-modal="true"` (modal-shaped — backdrop traps focus); Family A modals are `aria-modal="true"` (canonically modal). Phase 4 conformance check verifies each.
- **PR-ε.0 v6.2 §4 picker modal.** The forthcoming `scrapMilestonePickerModal` (S-17) lands canonical for PC-1.4 (uses `zi-close`) and inherits the gap on PC-1.1 / PC-1.2 / PC-1.3 / PC-1.9 — the v6.2 deferral note is explicit. Phase 4 verifies the inheritance is acceptable as a deferred-major fold (issue #54 closed via Phase 2; the contract clause is the long-lived enforcement vehicle).

---

## PC-2 · Chip pattern (Subclass A / B / C)

**Catalog input:** [PC-2](./pattern-catalog.md#pc-2--chip-variants) (Phase 2 canonical form 2.1 — three subclasses)
**Inventory anchors:** P-2 (chip variants — 26 first-class call sites + per-instance `ct-*` extensions); S-17 (PR-ε.0 v6.2 milestone chip — first canonical Subclass C instance)
**Spec:** `docs/specs/lyra-pr-epsilon-0-foundation.md` v6.2 §4 (chip × `aria-label` double-wrap; chip-with-inner-x markup)

### Rules

| ID | Rule | Severity | Enforcement | Migration | Exception |
|---|---|---|---|---|---|
| **PC-2.1** | Every chip MUST be one of three subclasses: **(A) decorative** (`<span class="chip">`, no interaction; `role="status"` only when state-bearing), **(B) action** (`<button class="chip">` whole-chip-clickable), **(C) tag-with-remove** (`<span class="chip" role="listitem">` + inner `<button class="chip-x">`; container non-interactive). Subclass detection is by interaction shape, not by visual tone. | **MAJOR** | manual inspection at PR review against the Subclass A/B/C definitions in `pattern-catalog.md` PC-2.1. New chip-generation sites cite the chosen subclass in the PR description. | cheap (Subclass A) / medium (Subclass B element swap) / cheap when landed in canonical form (Subclass C) | None for new code. Pre-existing 26 sites carry per-site migration severity per Phase 2's PC-2.6 table. |
| **PC-2.2** | Subclass B chips MUST be `<button>`. Subclass B chips MUST NOT be `<div>` or `<span>` (with or without `role="button"` / `tabindex`). | **MAJOR** | grep: `grep -cE '<(div\|span)[^>]*class="chip[^"]*"[^>]*data-action' split/{home,diet,intelligence,medical}.js split/template.html` MUST equal 0 once migration completes. Pre-migration the count is the migration-progress metric. | medium (~20 sites in `home.js` + `intelligence.js` + Notes filter pills already-canonical) | New code: none. Pre-existing CT chip generation sites (`intelligence.js:16822, 16833, 17064, …`) and `home.js:9243` (`ct-entry-chip`) migrate over a Polish-class queue; landing the contract does not unilaterally fail those PRs. |
| **PC-2.3** | Subclass C chips (tag-with-remove) MUST sit inside a `role="list"` ancestor. The container `<span class="chip">` MUST carry `role="listitem"`. The inner `<button class="chip-x">` MUST carry `aria-label="Remove ${labelText} tag"` (or domain-equivalent label). | **MAJOR** | grep: `grep -cE 'role="listitem"' split/template.html split/{home,intelligence,medical}.js` MUST equal `grep -cE 'class="chip-x"' …` (1:1 chip × ↔ listitem); `role="list"` MUST appear on each Subclass C container's parent. | cheap when landed in canonical form (PR-ε.0 v6.2 §4 picker chip is the first instance) | The pre-existing `al-chip` + `al-chip-x` pair (`intelligence.js:9605–9612`) is shape-precedent for Subclass C and lacks the `role="listitem"` + `role="list"` parent + uses literal `&times;`. PC-2.3 sequences the `al-chip` migration as a Subclass C conformance follow-up; new Subclass C surfaces (post-contract) MUST land canonical immediately. |
| **PC-2.4** | Chip body text node interpolation MUST use `escHtml(text)` (HTML context). Chip attribute interpolation containing user text MUST use single-wrap `escAttr(text)`. `escAttr` (`core.js:2565`) emits standards-compliant HTML-attribute escapes for `&` / `"` / `'` post-PR-ε.0.1; double-wrap (`escAttr(escHtml(text))`) is no longer required for entity-safety. | **MAJOR** (escape contract is load-bearing for AT pronunciation + XSS hygiene) | grep: every interpolated `${escAttr(...)` inside chip / chip-x markup MUST receive a single argument (no inner `escHtml` wrap). Reviewer manual inspection per the PC-2 catalog escape contract. | cheap (rule codifies post-PR-ε.0.1 v6.3 §4 idiom) | PR-ε.0 v6.3's chip × `aria-label` (`escAttr(labelText)`) is canonical. Pre-PR-ε.0.1 surfaces using double-wrap `escAttr(escHtml(text))` are not failing — the double-wrap is harmless on the new escAttr body — but new code MUST use single-wrap; double-wrap is a Polish-class simplification target on existing surfaces. |
| **PC-2.5** | Chip body MUST NOT contain literal Unicode glyphs (`✓`, `★`, `⭐`, etc.). All icons MUST use `<svg class="zi" aria-hidden="true"><use href="#zi-{icon}"/></svg>` per HR-1 + HR-7. | **MINOR** | grep: `grep -cE 'class="chip[^"]*"[^>]*>[^<]*[✓★⭐]' split/template.html split/*.js` MUST equal 0 once migration completes. | cheap (per-site `zi-{icon}` swap; sites enumerated in PC-2.6 catalog cost table) | None. Sprite already carries `zi-check`, `zi-star`; per-site swap is mechanical. |
| **PC-2.6** | Subclass B (action) chips with toggle state MUST use `aria-pressed="true|false"`. Notes category filter pills (`.note-cat-filter > .ncf-btn`) are Subclass B with toggle state; the `aria-pressed` requirement applies. | **MINOR** | grep: filter-pill / template-chip / toggle-class chips with `.active` CSS state MUST carry `aria-pressed`. Reviewer manual inspection per chip generation site. | cheap (Notes filter pills are already `<button>`; one-attribute add per chip) | None. |
| **PC-2.7** | Decorative state-bearing chips (Subclass A — food-safety `chip-safe` / `-caution` / `-avoid`; transient state badges) MUST carry `role="status"`. Static decorative chips (no state) MAY omit `role`. | **MINOR** | manual inspection: the chip's "is this a state announcement, or a static label?" question is a per-site judgment. | cheap (one-attribute add per state-bearing site) | Static labels (e.g. category name on a passive card) are exempt from `role="status"`. |
| **PC-2.8** | Chip click behavior MUST route through `data-action`. Inline `onclick=` / `oninput=` on chips is FORBIDDEN per HR-3. | **MAJOR** (HR-3 alignment) | grep: `grep -cE 'class="chip[^"]*"[^>]*on(click\|input)=' split/{home,diet,intelligence,medical}.js split/template.html` MUST equal 0. | cheap (`diet.js:428` food-combo chip is the current sole HR-3 violation among chips) | None. |

### Notes

- **al-chip migration.** The pre-existing `al-chip` + `al-chip-x` pair at `intelligence.js:9605–9612` is the dominant non-canonical Subclass C site. Migration is Polish-class; no PR-blocking severity at contract launch, but new Subclass C surfaces post-contract MUST land canonical (PR-ε.0 v6.2 §4 picker chip is the first canonical instance and Phase 4 verifies).
- **escAttr global-fix landed (PR-ε.0.1, closes #57 path A).** Pre-PR-ε.0.1 PC-2.4 carried a time-bound double-wrap requirement; the time-binding closes here. Post-PR-ε.0.1 PC-2.4 codifies single-wrap `escAttr(text)` as canonical: escAttr at `core.js:2565` is now standards-compliant for `&` / `"` / `'`. The 6 Class C sites that depended on pre-PR-ε.0.1 escAttr's `\'` JS-literal arm migrated to data-action in PR-ε.0.1 §1 (3 home.js + 3 medical.js per the corrected census; Cipher self-correction on #57 closed the Phase 2 cross-cut anchor-narrowness methodology defect). PC-7.3 Class C sequencing **closes** simultaneously.
- **Per-feature suffix classes.** `.ct-banner-btn`, `.ct-template-chip`, `.ct-answer-chip`, etc., are allowed feature-scoped extensions on the base `.chip` class. The contract permits arbitrary `.ct-{slug}-chip` classes provided the base `.chip` rules and one of the three subclasses still apply.

---

## PC-3 · Form-input pattern

**Catalog input:** [PC-3](./pattern-catalog.md#pc-3--form-input-idioms) (Phase 2 canonical form 3.1 — `.form-input` + `.input-ctx-{domain}`)
**Inventory anchors:** P-3 (four parallel form-input idioms); S-08 (modal forms), S-12 (settings sidebar `<select>` × 4), S-14 (Smart Q&A `.qa-input`), S-15 (scrapbook add-memory inline form × 6 inputs)

### Rules

| ID | Rule | Severity | Enforcement | Migration | Exception |
|---|---|---|---|---|---|
| **PC-3.1** | Every form input (`<input>`, `<textarea>`, `<select>`) MUST use the canonical class `.form-input` (or its sub-variants `.form-input.input-ctx-{domain}`). The four parallel idioms (`.modal-input`, `.form-input`, `.qa-input`, raw inline-styled) consolidate to one. | **MAJOR** | grep: `grep -cE 'class="(modal-input\|qa-input)' split/template.html` MUST equal 0 once consolidation completes; raw `<input>`/`<select>`/`<textarea>` without `.form-input` MUST equal 0 in `split/template.html` and dynamic-render outputs in `*.js`. | medium (CSS rule consolidation + ~50 input sites) | None for new code. Pre-existing 50+ sites migrate per Phase 2's PC-3.6 cost table; landing the contract does not unilaterally fail every existing form. |
| **PC-3.2** | Form inputs MUST have an accessible name — either an associated `<label>` or `aria-label`. `placeholder=""` is NOT an accessible name. | **MAJOR** | grep: each input element MUST resolve to a `<label for="…">` (matching its `id`) OR carry `aria-label="…"`; `placeholder` is not sufficient. Manual inspection at PR review for new inputs; mechanical scan possible via parser-pass on `split/template.html` (out-of-scope tooling). | cheap (per-input `<label>` add or `aria-label` add) | None. WCAG 4.1.2 hard requirement. |
| **PC-3.3** | Form inputs MUST NOT carry inline `style=""` (HR-2). Form inputs MUST NOT carry inline `oninput=` / `onchange=` / `onclick=` handlers (HR-3); validation routes through `data-action` (e.g. `data-action="updateGrowthSaveBtn"`). | **MINOR** (HR-2/3 hygiene; rolling closeout in progress per Phase 4 Polish-10) | grep: `grep -cE '<(input\|textarea\|select)[^>]*style="' split/template.html` MUST equal 0; `grep -cE '<(input\|textarea\|select)[^>]*on(input\|change\|click)=' split/template.html` MUST equal 0. | medium (rolling per-site closeout; Phase 4 Polish-10 batches PR-35 / PR-36 closed many) | None. Pre-existing violations migrate over a Polish-class queue; landing the contract does not unilaterally fail. |
| **PC-3.4** | Disabled state on save-class buttons sourced from form-input validity MUST use the `disabled` attribute or the `.disabled-state` class. Inline `style="opacity:0.5;pointer-events:none"` is FORBIDDEN. | **MINOR** | grep: `grep -cE '<button[^>]*style="[^"]*opacity' split/template.html` MUST equal 0. | cheap | None. |

### Notes

- **Domain-context modifier.** `.input-ctx-{lavender|rose|sage|amber|sky|indigo|peach}` is the canonical way to express domain affinity on a form input; the seven domain colors per CLAUDE.md design system apply. New form surfaces declare their domain context at markup time.
- **`<label>` association preferred over `aria-label`.** When a visible label exists, the canonical association is `<label for="…">` ↔ `id="…"`. `aria-label` is the fallback when the visible label is iconographic or absent (e.g. inline search input).

---

## PC-4 · Toast pattern · folds Phase 1 gap rank 1 (BLOCKER tier)

**Catalog input:** [PC-4](./pattern-catalog.md#pc-4--toast-idioms--folds-phase-1-gap-rank-1)
**Inventory anchors:** S-13 (`#qlToast` — 87 call-sites; PR-ε.0 v6.2 introduces 2 more); S-04 (`#syncStatus` / `#syncActivity` / `#updateToast` — already canonical); S-05 (`#offlineBadge` — already canonical); `#appVersion`

### Rules

| ID | Rule | Severity | Enforcement | Migration | Exception |
|---|---|---|---|---|---|
| **PC-4.1** | `#qlToast` MUST carry `role="status"` + `aria-live="polite"` + `aria-atomic="true"`. | **BLOCKER** | grep: `grep -cE 'id="qlToast"[^>]*role="status"[^>]*aria-live="polite"[^>]*aria-atomic="true"' split/template.html` MUST equal 1 (or the equivalent attribute set; order-independent via per-attribute counts). | cheap (3 attributes on 1 DOM element; 87 call-sites need no change) | None. PR-ε.0 v6.2 §4 introduces two new fire-sites carrying state announcements (orphan-tag confirm-time + edit-load); the gap is silent failure for AT users on every confirmation surface. |
| **PC-4.2** | The `showQLToast` Undo affordance MUST be a `<button class="ql-toast-undo">`, not a `<span>`. The `.ql-toast-undo` CSS class MUST replace inline `style=""`. | **BLOCKER** (folds with PC-4.1; recovery path keyboard accessibility) | grep: `grep -cE 'ql-toast-undo' split/intelligence.js` MUST resolve to a `<button>` element-of-record (function `showQLToast` body, resolve by function name on line drift); `grep -cE 'ql-toast-undo[^>]*style="' split/intelligence.js` MUST equal 0. | cheap (one-function edit + template rule add) | None. The Undo `<span>` (`intelligence.js:10762` audit-base) is keyboard-inaccessible — anti-trust on the recovery path. |
| **PC-4.3** | Persistent live-region surfaces (`#syncStatus`, `#syncActivity`, `#updateToast`, `#offlineBadge`, `#appVersion`) MUST use the `[hidden]` attribute when off-screen, NOT inline `style="display:none"`. | **MINOR** (HR-2 alignment; sync surfaces are already canonical at audit-base) | grep: `grep -cE 'id="(syncStatus\|syncActivity\|updateToast\|offlineBadge\|appVersion)"[^>]*style="display: *none"' split/template.html` MUST equal 0. | n/a (already canonical) | None. |
| **PC-4.4** | All `showQLToast` call sites MUST pre-escape interpolated text via `escHtml` (HR-4 alignment). Raw user-text interpolation into `t.innerHTML` is FORBIDDEN. | **MAJOR** | grep: every `showQLToast(...)` call site whose argument contains a template literal `${...}` MUST resolve via `escHtml` (or `t.innerText` assignment; latter precludes Undo affordance — use `escHtml` route). Reviewer manual inspection per call site. | cheap (per-site escape addition; 87 sites are already mostly canonical per Phase 2 audit) | Constant message strings (no interpolation) are exempt from escape. |
| **PC-4.5** | Toast severity differentiation (`is-success` / `is-warn` / `is-error`) MAY be introduced as additive class modifiers. The contract does not require severity differentiation at launch; introduction is a Phase 4 / Phase 5 decision based on per-call-site classification. Until severity variants land, `core.js:3431` `showQLToast('Export failed: …')` and similar error-state-as-success-toast usages are tech-debt-flagged but not contract-violating. | **MINOR** (deferred) | n/a (not enforced at contract launch) | n/a | The PC-5 error-state-with-retry rule (PC-5.4) supersedes for retryable errors; toast remains valid for transient informational messages. |

### Notes

- **PR-ε.0 v6.2 inheritance.** PR-ε.0 v6.2 §4 introduces two new `showQLToast` fire-sites: (a) edit-load orphan-tag toast and (b) confirm-time orphan-tag toast. Both inherit PC-4.1's gap by design — the v6.2 spec deferred the global toast a11y fix to this contract clause. **Phase 4 conformance check verifies** that the v6.2 picker modal lands canonical, and either (i) `#qlToast` has the `aria-live` trio in v6.2 (closing the gap at v6.2 merge), or (ii) the gap is captured as a forward-pointer issue with explicit BLOCKER severity in the implementation PR's audit checklist.
- **#qlToast is a singleton.** The single-slot toast design replaces messages mid-flight on rapid succession. The contract does not yet require queueing; the orphan-tag confirm-time announcement is short-lived and the trade-off is accepted at v6.2 launch. Phase 5 hygiene may revisit.

---

## PC-5 · Edge state pattern (empty / loading / error / offline / unauthenticated)

**Catalog input:** [PC-5](./pattern-catalog.md#pc-5--edge-states-empty--loading--error--offline--unauthenticated)
**Inventory anchors:** P-5 (13 empty-state sites + three idioms; `.picker-empty` lands with PR-ε.0 v6.2); S-04 (`.ob-loading` — only existing loading-state); S-05 (offline badge — best-in-class); S-12 (settings unauthenticated state)

### Rules

| ID | Rule | Severity | Enforcement | Migration | Exception |
|---|---|---|---|---|---|
| **PC-5.1** | Every empty-state surface MUST use the `.empty-state` markup with contextual icon (`<svg class="zi empty-state-icon">`) + title (`.empty-state-title`) + optional sub-text (`.empty-state-sub`). Inline-styled empty `<div>`s and bespoke `.t-sub-light` empty wrappers are FORBIDDEN for new code. | **MAJOR** | grep: `grep -cE 'class="(t-sub-light\|info-strip is-neutral)"' split/{home,diet,intelligence,medical,core}.js` is the migration-progress metric pre-migration; post-migration MUST equal 0 (or Phase-3-amended). New empty-state sites MUST use `.empty-state`. | medium (13 sites × ~5 lines per site) | None for new code. Pre-existing 13 sites migrate per Phase 2's PC-5.8 cost table. The PR-ε.0 v6.2 `.picker-empty` rule generalizes to `.empty-state-warm` post-migration. |
| **PC-5.2** | Loading states MAY appear on any surface; when present they MUST use the `.loading-state` markup with `role="status" aria-live="polite"`. Static placeholder text (e.g. `<p>Loading...</p>` in a header that may never clear) is FORBIDDEN. | **MINOR** (per-surface optional) | grep: any `<p>Loading` literal in `split/template.html` is a violation if not paired with a render-replacement on resolve. New surfaces shipping a loading state MUST use `.loading-state`. | medium (per-surface introduction) | Local-first surfaces that render synchronously DO NOT require a loading state. Firebase-attached / post-receive / async-render surfaces SHOULD ship one. |
| **PC-5.3** | The offline badge (S-05) MUST continue to use `role="status" aria-live="polite" aria-atomic="true"` and `[hidden]` attribute (not `display:none` inline). Reload affordance MUST appear only in the halted state. | **MINOR** (already canonical) | grep: `grep -cE 'id="offlineBadge"[^>]*aria-live="polite"' split/template.html` MUST equal 1. | n/a (already canonical) | None. |
| **PC-5.4** | Error states with retry MUST use the `.error-state` markup with `role="alert"` (assertive live region — distinct from `role="status"` polite) + `<button class="btn btn-ghost btn-sm error-state-action">Retry</button>`. Informational errors without retry (e.g. "No data") are empty states (PC-5.1), not error states. Toasts are NOT error states for retryable errors. | **MAJOR** | manual inspection: per-call-site classification. grep candidates: `showQLToast(.*[Ff]ailed` is a candidate-violation site requiring case-by-case judgment. | medium (per-call-site classification across `core.js`, `home.js`, `intelligence.js`) | Transient informational error messages (e.g. "Could not connect — retrying…" with auto-retry) MAY remain as toasts. |
| **PC-5.5** | The unauthenticated state MUST remain scoped to the settings card (S-12). New features that require sign-in MUST surface the unauthenticated entry-point through the settings card path; cross-app unauthenticated banners are FORBIDDEN unless this contract amends. | **MINOR** (boundary preservation) | manual inspection at PR review for any new unauthenticated UI affordance. | n/a (boundary rule) | None. Local-first design assumes unauthenticated as default operating mode. |

### Notes

- **`.picker-empty` → `.empty-state-warm`.** PR-ε.0 v6.2 §7.3 ships `.picker-empty` as the prototype for the warm-tone empty-state. PC-5.1 generalizes it; the picker-empty surface either retains its scoped class internally (using `.empty-state-warm` semantics) or migrates to the canonical class on the next post-Phase-3 surface PR. Phase 4 conformance check accepts either.
- **Severity rationale.** PC-5.1 is MAJOR (Phase 1 gap-rank 5; intelligence-engine impact: empty-state copy is the parent's "did I do this right?" feedback). PC-5.2 is MINOR because most local-first surfaces don't need it; the rule is opt-in. PC-5.4 is MAJOR because error-as-toast is an active anti-pattern (success/error visual ambiguity).

---

## PC-6 · Navigation pattern (tablist + sub-tabs)

**Catalog input:** [PC-6](./pattern-catalog.md#pc-6--navigation)
**Inventory anchors:** P-6 (three parallel tablist implementations); S-01 (top-level tab bar `.tab-btn`), S-02 (Track sub-tab bar `.track-sub-btn`), S-12 (settings sub-tabs `.settings-tab`)

### Rules

| ID | Rule | Severity | Enforcement | Migration | Exception |
|---|---|---|---|---|---|
| **PC-6.1** | Tab bars MUST carry `role="tablist"` on the container. Tab buttons MUST carry `role="tab"` + `aria-selected="true|false"` + `aria-controls="{panelId}"`. Tab panels MUST carry `role="tabpanel"` + `aria-labelledby="{tabId}"`. | **MAJOR** | grep: `grep -cE 'role="tablist"' split/template.html` MUST equal the number of tab-bar containers (top-level, Track sub-tab, settings sub-tabs); each MUST resolve to per-button `role="tab"` + `aria-selected` markup. | medium (renderer change + static markup change for 3 implementations) | None for new code. Pre-existing 3 implementations migrate per Phase 2's PC-6.7 cost table. |
| **PC-6.2** | Tab bars MUST support arrow-key navigation (Left/Right or Up/Down for vertical bars) — Tab key MUST move into/out of the tablist; arrow keys MUST move focus within the tablist. | **MAJOR** | named verification: keyboard test on each tablist (Left/Right arrow cycles; Tab moves out). Function-name grep in `split/core.js`: a tablist-keydown handler MUST be registered. | medium (one global keydown handler + per-tablist hookup) | None for new code. |
| **PC-6.3** | Sub-tab bars (Track sub-tab, settings sub-tabs) MUST share the canonical tablist form. Three parallel class prefixes (`tab-`, `track-sub-`, `settings-tab-`) MAY remain as feature-scoped extensions ON TOP of the canonical form, or MAY collapse into a single class with size/context modifiers — the contract does not prescribe; either path satisfies. | **MINOR** | manual inspection: each sub-tab-bar implementation MUST satisfy PC-6.1 + PC-6.2 regardless of class prefix. | medium (depends on consolidation choice) | The collapse-vs-extension decision is implementation-PR-time discretion. |
| **PC-6.4** | Notes category filter pills (`.note-cat-filter > .ncf-btn`) are filter-shaped, not tab-shaped — they MUST satisfy PC-2 Subclass B (action chip) rules with `aria-pressed="true|false"`, NOT PC-6.1 tablist rules. | **MINOR** | grep: `grep -cE 'class="ncf-btn"[^>]*aria-pressed' split/template.html` MUST equal the count of `.ncf-btn` elements. | cheap (already `<button>`; only need `aria-pressed` + drop `⭐ Milestone` literal emoji) | None. |

### Notes

- **WCAG 4.1.2 dependency.** PC-6.1 is the dominant WCAG 4.1.2 violation in the app shell at audit-base. Closing it is high-impact but mechanical for the renderer-change paths.
- **Renderer-change vs static-markup paths.** Top-level tab bar (S-01) is static markup; Track sub-tab bar (S-02) is dynamic-rendered in `core.js:2738+ renderTrackSubBar` (function-name resolution); settings sub-tabs (S-12) are static markup. The renderer change covers all dynamic-render output; static markup migrates per-PR.

---

## PC-7 · Action-dispatcher pattern · load-bearing for issue #57 Class C sequencing

**Catalog input:** [PC-7](./pattern-catalog.md#pc-7--action-dispatcher-patterns)
**Inventory anchors:** P-7 (dispatcher at `core.js:259+/:348+/:474+/:614+`; 36 inline-handler HR-3 violations)
**Folds:** issue [#57](https://github.com/Rishabh1804/sproutlab/issues/57) Class C sequencing — 3 sites in `home.js` (`:8010 / :8118 / :8168`) require PC-7.1 dispatcher migration first

### Rules

| ID | Rule | Severity | Enforcement | Migration | Exception |
|---|---|---|---|---|---|
| **PC-7.1** | The four dispatcher ladders (`core.js:259+`, `:348+`, `:474+`, `:614+`; resolve by function names if line drift) MUST consolidate into one location with a `_ACTION_HANDLERS` table indirection. New action keys MUST be registered as table entries, NOT as if/else if branches. | **MINOR** (architecture-driven; outside the intelligence-engine-impact severity ladder — see PC-7 Notes "PC-7.1 severity calibration") | grep: `grep -cE '^ *const +_ACTION_HANDLERS *=' split/core.js` MUST equal 1 (single table); the canonical click-listener signature `addEventListener('click', (e) => { … e.target.closest('[data-action]') … })` MUST appear exactly once in `split/core.js` (function-name-stable; resolve by function name on line drift). Pre-consolidation, the four-ladder count is the migration-progress metric. | expensive (touches `core.js:259..730` heavily; ~80+ actions register per ladder consolidation) | None for new code. Pre-existing ladders migrate in a single dispatcher-consolidation PR; no piecemeal migration. |
| **PC-7.2** | The dispatcher MUST NOT fall back to `window[action]` for unregistered action keys. Magic-method-call surface is FORBIDDEN. Unhandled action keys MUST `console.warn` with the action name and return without action. | **MINOR** | grep: `grep -cE 'window\[[^\]]*action' split/core.js` MUST equal 0 in the dispatcher body (function `_dispatchAction` resolved by function name). | cheap (one-line edit) | None for new code. Pre-existing fallback migrates with PC-7.1. |
| **PC-7.3** | Inline `onclick=` interpolations carrying `escAttr(...)` output through a JS-source-string evaluation context (whole-attribute form like `home.js:8369` `onclick="${item.action}"`, OR in-string-interpolation form like `medical.js:4374` `onclick="…upcomingToMilestone('${escAttr(...)}', …)"`) MUST migrate to `data-action` attributes routed through the dispatcher. The 6 Class C sites per the corrected #57 census (3 home.js: `:8012 / :8120 / :8170`; 3 medical.js: `:4374 / :4377 / :4378`) sequence through this clause. **CLOSED** in PR-ε.0.1 §1 (Phase 1a + 1b). | **MAJOR** (sequencing — Class C in #57 path-(a) `escAttr` rewrite gated on PC-7.3 close) | grep: `grep -nE 'onclick=.*escAttr\|onload=.*escAttr\|oninput=.*escAttr\|setTimeout.*escAttr\|Function.*escAttr' split/{home,diet,medical,intelligence}.js` MUST equal 0 active matches (informational comment matches OK). | medium (6 builder sites + 1 home.js consumer + 4 new dispatcher keys + 3 console.warn fallbacks per the Lyra synthesis fold on PR #63) | Closed in PR-ε.0.1. Cipher self-correction on #57 captured the methodology defect from the original Phase 2 cross-cut grep anchor (`onclick="${...|onclick='${...` missed the in-string-interpolation form). |
| **PC-7.4** | All other inline `on{event}=` handlers (`oninput=`, `onchange=`, surviving `onclick=` outside the Class C sequencing path) MUST migrate to `data-action`. The 36 surviving inline-handler sites (Phase 1 P-7) migrate over a Polish-class queue. | **MINOR** | grep: `grep -cE '<[a-z][^>]*on(input\|change\|click)=' split/template.html` MUST equal 0 once migration completes; pre-migration the count is the metric. | medium (rolling per-site closeout; Phase 4 Polish-10 batches PR-35/PR-36 closed many) | New code: none. Pre-existing migrate over Polish queue. |
| **PC-7.5** | `data-arg` / `data-arg2` / `data-arg3` / `data-id` interpolations carrying user-text MUST use single-wrap `escAttr(text)`. `escAttr` (`core.js:2565`) emits standards-compliant HTML-attribute escapes for `&` / `"` / `'` post-PR-ε.0.1; double-wrap is no longer required. | **MAJOR** (escape contract; identical to PC-2.4 in shape) | grep: every `${escAttr(...)` interpolation inside `data-arg*` / `data-id` MUST receive a single argument (no inner `escHtml` wrap). Reviewer manual inspection. | cheap (rule codifies post-PR-ε.0.1 v6.3 idiom) | Pre-PR-ε.0.1 surfaces using double-wrap are not failing — harmless under the new escAttr body — but new code MUST use single-wrap. Pre-existing double-wrap surfaces simplify under a Polish-class queue. |
| **PC-7.6** | Per-feature attribute extensions (`data-collapse-target`, `data-collapse-chevron`, `data-quick-modal`, `data-tab`, `data-track-sub`) MAY remain as distinct routing namespaces from `data-action`. The contract does not unify them at launch; a future Phase 5 hygiene pass MAY consolidate. | **MINOR** (deferred) | n/a | n/a | The collapse-vs-extension decision is implementation-PR-time discretion. |

### Notes

- **#57 path-split sequencing.** Per the updated #57 body (post-Phase-2): Class A + Class B (~74 sites) accept path (a) direct rewrite of `escAttr` without sequencing dependency; Class C (3 sites in `home.js`, also HR-3 violations) requires PC-7.3 (kill `home.js:8369` `onclick="${item.action}"` interpolation) to land first, then path (a) becomes globally safe. PC-7.3 + PC-7.4 are the sequencing target; #57 closes when both close.
- **Dispatcher consolidation cost.** PC-7.1 is `expensive` per Phase 2's cost table — this is the largest mechanical migration in the contract. The implementation-PR pen (Lyra, post-Phase-4) plans a single consolidation PR rather than a piecemeal migration to avoid leaving the four-ladder + table indirection in a half-state.
- **PC-7.1 severity calibration (Cipher cross-cut fold).** PC-7.1 was originally drafted at MAJOR; Cipher's Edict V cross-cut on PR #61 surfaced a weak disagreement: the contract's severity ladder is intelligence-engine-impact-driven (Phase 1 gap-rank → Phase 2 cost map → Phase 3 severity), and PC-7.1 dispatcher consolidation is architecture-driven, not gap-driven (no AT-user surface impact at audit-base; no AT regression from the four-ladder count). Recalibrated to **MINOR** to match the ladder discipline. The architecture-driven rationale (debugging surface compounds with every feature; load-bearing for Phase 3's enforcement target on `data-action` namespacing) carries forward in this Note rather than as a severity-tier elevation. Architecture-driven concerns that warrant their own enforcement weight belong in a separate architectural-decision document (out of this contract's scope).

---

## PC-8 · Button / CTA pattern

**Catalog input:** [PC-8](./pattern-catalog.md#pc-8--button--cta-variants)
**Inventory anchors:** P-8 (9 first-class button variants + bespoke families); S-09 (`.bug-btn`), S-10 (`.crop-cancel` / `.crop-save`), S-13 toast Undo (PC-4.2)

### Rules

| ID | Rule | Severity | Enforcement | Migration | Exception |
|---|---|---|---|---|---|
| **PC-8.1** | Every CTA button MUST use `class="btn btn-{domain}"` (filled) or `class="btn btn-ghost"` (secondary/cancel). Bespoke button class families (`.bug-btn`, `.crop-cancel`, `.crop-save`, `.alert-start-btn-{rose|amber}`) are FORBIDDEN. | **MINOR** (bespoke families are visible tip of per-feature CSS-class iceberg; consolidation is hygiene) | grep: `grep -cE 'class="(bug-btn\|crop-cancel\|crop-save\|alert-start-btn-(rose\|amber))"' split/template.html` MUST equal 0 once migration completes. | cheap (per-class swap; few sites) | None for new code. |
| **PC-8.2** | Cancel buttons MUST use `.btn-ghost`. Confirm/Save buttons MUST use `.btn-{domain}` matching the surface's domain (lavender for milestones, rose for medical, sage for diet, etc.). Destructive Confirm uses `.btn-rose` (rose-domain doubles as alert/warning per CLAUDE.md design system). | **MINOR** | manual inspection at PR review for new modal/CTA-bearing surfaces. | n/a | None. |
| **PC-8.3** | Save / Confirm button labels MUST NOT include literal Unicode glyphs (`✓`, `✔`, `★`, etc.). Icons, where present, MUST use `<svg class="zi" aria-hidden="true"><use href="#zi-{icon}"/></svg>` per HR-1 + HR-7. | **MINOR** | grep: `grep -cE '<button[^>]*>[^<]*[✓✔★⭐]' split/template.html` MUST equal 0. | cheap (per-label `zi-check` swap; sites enumerated in PC-8 catalog) | None. |
| **PC-8.4** | Buttons MUST NOT carry inline `style=""` (HR-2). | **MINOR** | grep: `grep -cE '<button[^>]*style="' split/template.html` MUST equal 0 (the scrap-photo-remove `template.html:1028` is the current sole violation). | cheap | None. |
| **PC-8.5** | Disabled state MUST use the `disabled` attribute or `.disabled-state` class. Inline `style="opacity:0.5;pointer-events:none"` is FORBIDDEN (cf. PC-3.4). | **MINOR** | grep: `grep -cE '<button[^>]*style="[^"]*opacity' split/template.html` MUST equal 0. | cheap | None. |
| **PC-8.6** | Buttons SHOULD use `type="button"` explicitly when not inside a `<form>` to prevent inadvertent form submission. | **MINOR** | manual inspection at PR review. | cheap | Buttons inside `<form>` semantics MAY use the default `type="submit"` or explicitly opt out. |

### Notes

- **PC-1.4 / PC-9 sprite alignment.** PC-8.3's literal-glyph prohibition aligns with PC-1.4 (close glyphs) and PC-9.1 (chevron glyphs); the sprite at audit-base already carries `zi-check`, `zi-star`, `zi-close`. PR-ε.0 v6.2 §7.1 adds `zi-close` formally; PC-9 will land `zi-chevron`.

---

## PC-9 · Collapsible-card pattern · sprite migration `▾` → `zi-chevron`

**Catalog input:** [PC-9](./pattern-catalog.md#pc-9--collapsible-card-pattern)
**Inventory anchors:** P-9 (75 occurrences of literal `▾` glyph in `template.html`; 72 `data-collapse-target` instances)

### Rules

| ID | Rule | Severity | Enforcement | Migration | Exception |
|---|---|---|---|---|---|
| **PC-9.1** | Collapsible-card chevrons MUST use `<svg class="zi"><use href="#zi-chevron"/></svg>`. Literal `▾` glyphs are FORBIDDEN. The `zi-chevron` sprite addition MUST land before per-site rolling (or land in the same PR). | **MINOR** (75 sites; mechanical; aggregate non-blocking) | grep: `grep -cE '▾' split/template.html` MUST equal 0 once migration completes; `grep -cE 'href="#zi-chevron"' split/template.html` MUST equal the count of collapse-chevron sites post-migration. | medium (sprite addition `cheap`; rolling out 75 sites `medium`) | None for new code. Pre-existing 75 sites migrate per Phase 2's PC-9.6 cost table. |
| **PC-9.2** | `.card-header` elements toggling a `.collapse-body` MUST carry `aria-expanded="true|false"` + `aria-controls="{bodyId}"`. | **MAJOR** (WCAG 4.1.2; AT users currently get no expand/collapse state) | grep: `grep -cE 'data-collapse-target' split/template.html` MUST resolve 1:1 to `aria-expanded` on the same element. | medium (parallel pass over all 72 `data-collapse-target` sites) | None for new code. |
| **PC-9.3** | `.collapse-body` elements MUST use the `[hidden]` attribute when collapsed, NOT inline `style="display:none"`. | **MINOR** (HR-2 alignment) | grep: `grep -cE 'class="collapse-body"[^>]*style="display: *none"' split/template.html` MUST equal 0. The migration may require a global CSS rule `[hidden] { display: none !important; }` if existing `.collapse-body { display: ... }` rules override the attribute behavior. | medium (CSS migration + per-site attribute swap) | None for new code. |
| **PC-9.4** | Chevron rotation on expand MUST be implemented via CSS class toggle (`.collapse-chevron.rotated .zi { transform: rotate(180deg); }`), NOT inline `style="transform:..."`. | **MINOR** | grep: `grep -cE '<span[^>]*class="collapse-chevron[^"]*"[^>]*style="transform' split/template.html` MUST equal 0. | cheap | None. |
| **PC-9.5** | Chevron rotation MUST respect `prefers-reduced-motion` (the global block at `split/styles.css:3902`; resolve by selector if line drift covers transitions on the chevron rotation). | **MAJOR** (motion accessibility; load-bearing for users who set the reduced-motion preference) | grep: the `prefers-reduced-motion` block MUST cover `.collapse-chevron .zi` transition or be explicitly extended. Manual inspection on the global block's selectors. | cheap | None. |

### Notes

- **Largest mechanical migration in the contract.** 75 sites is the dominant single-pattern migration; aggregate cost is `medium` per Phase 2 PC-9.6 but the rule severity at PC-9.1 is MINOR because the impact is hygiene-class (literal-glyph proliferation), not user-blocking.
- **PC-9.2 elevation rationale.** PC-9.2 is MAJOR (a11y) while PC-9.1 / PC-9.3 / PC-9.4 are MINOR (hygiene). The `aria-expanded` gap is universally absent at audit-base; AT users get no disclosure-state announcement on every disclosure card in the History tab. This is the load-bearing reason to elevate PC-9.2.

---

## PC-10 · Token system

**Catalog input:** [PC-10](./pattern-catalog.md#pc-10--token-system)
**Inventory anchors:** Token usage map in Phase 1 surface inventory; PC-10.1 catalog taxonomy (10 token families)

### Rules

| ID | Rule | Severity | Enforcement | Migration | Exception |
|---|---|---|---|---|---|
| **PC-10.1** | Component CSS MUST NOT contain raw hex literals. Domain colors MUST resolve to `--{domain}` / `--{domain}-light` / `--{domain}-deep` tokens. | **MINOR** (Phase 4 Polish-3 / PR-27 closed 32 sites; remaining hexes form the hygiene tail) | grep: `grep -cE '#[0-9a-fA-F]{3,6}' split/styles.css` (excluding tokens block + comments) MUST trend to 0 over the Polish-class queue. | medium (hex-literal sweep across `styles.css`; per-class reclassification) | The tokens-block-of-record (`:root` block at top of `styles.css`) is exempt — token definitions are where hex literals canonically live. |
| **PC-10.2** | Templates / dynamic markup MUST NOT contain inline `style="color:..."` / `style="background:..."` etc. — all colors / spacing / typography flow through tokens or component classes. | **MINOR** (HR-2 alignment; 228 sites in `template.html` audit-base) | grep: `grep -cE 'style="[^"]*(color\|background\|font-size\|padding\|margin)' split/template.html` MUST trend to 0 over the Polish-class queue. | medium (rolls into PC-3 / PC-9 / cumulative migrations; aggregate is the long tail) | None for new code. |
| **PC-10.3** | Token alias chain depth (`--foo: var(--bar)` → `--bar: var(--baz)`) MUST NOT exceed 2 levels. Indirection beyond 2 is FORBIDDEN as maintenance debt. | **MINOR** | grep: token-graph parse over `:root` block; chains of length > 2 are violations. (Tooling-class check; manual inspection acceptable at audit.) | cheap (one-time token-system audit) | None. |
| **PC-10.4** | Component-tier tokens (e.g. `--input-focus`, `--input-glow`) MUST stay in their component scope. `--input-focus` MUST NOT appear in `.btn` CSS, e.g. | **MINOR** | manual inspection at PR review on cross-component token leak. | cheap | None. |
| **PC-10.5** | Unused tokens MUST be removed during the Phase 3-amended hygiene census (one-time pass) and on a rolling basis thereafter. The contract does not enumerate the unused-token list at launch — Phase 3's downstream hygiene pass produces it. | **MINOR** (deferred) | grep: per-token usage scan on each `--token-name`; any `:root` token with 0 references in `split/*.css` + `split/*.js` + `split/template.html` is a candidate for removal. | cheap (Phase 3 census + delete) | None. |
| **PC-10.6** | New tokens introduced by a PR MUST resolve to one of the 10 token families in the canonical taxonomy (Spacing, Font size, Radius, Easing, Line-height, Icon size, Letter-spacing, Domain color, Surface tokens, Component-specific). Out-of-family tokens are FORBIDDEN. | **MAJOR** (taxonomy preservation; out-of-family tokens dilute the contract's enforcement surface) | manual inspection at PR review for any new `--*` token. PR description MUST cite the family. | cheap | None. |
| **PC-10.7** | Dynamic computed values (e.g. progress percentages from JS) MUST flow through `--dyn-*` CSS custom properties, NOT through inline `style=""` interpolation. (Polish-6 PR-30 carry-forward.) | **MINOR** | grep: `grep -cE 'style="[^"]*--' split/{home,diet,intelligence,medical}.js` MUST be ≥ existing `--dyn-*` surface count; `style="width: ${pct}%"` direct-interpolation patterns MUST equal 0. | cheap | None for new code. Pre-existing direct-interpolation sites migrate over the Polish queue. |

### Notes

- **`--rose` overload.** Phase 1 noted `--rose` is overloaded (global focus-visible color AND medical-domain accent). The contract does not split it at launch — splitting would be `expensive` per Phase 2 cost map and the dual role is documented. Phase 3-amended hygiene MAY revisit.
- **PR-ε.0 v6.2 §7.3 token additions.** v6.2 introduces `--lav-light`, `--surface-lav` (and the `--scrap-*` surface tokens). All resolve to PC-10.1's "Surface tokens" + "Domain color" families; canonical at v6.2 launch.

---

## Cross-pattern enforcement notes

### HR-1 · Sprite-only icons (consolidated severity)

PC-1.4 + PC-2.5 + PC-8.3 + PC-9.1 collectively enforce HR-1 across modals, chips, buttons, and chevrons. The aggregate count of literal Unicode glyphs (`×`, `+`, `▾`, `✓`, `★`, `⭐`) at audit-base is approximately **16 close-glyphs + 75 chevrons + scattered checks/stars = ~95 sites**. The `zi-close` sprite addition lands with PR-ε.0 v6.2; the `zi-chevron` addition is the next sprite expansion.

### HR-2 · No inline `style=""`

PC-1.5 + PC-3.3 + PC-4.3 + PC-8.4 + PC-9.3 + PC-9.4 + PC-10.2 + PC-10.7 collectively enforce HR-2. The 228 inline-style sites at audit-base form the dominant hygiene migration; aggregate severity is MINOR per pattern but the cumulative count is the largest single hygiene metric.

### HR-3 · No inline event handlers

PC-2.8 + PC-3.3 + PC-7.3 + PC-7.4 collectively enforce HR-3. The 36 surviving inline-handler sites at audit-base partition into PC-7.3 (3 Class C sites — MAJOR sequencing) and PC-7.4 (33 hygiene sites — MINOR). Phase 4 Polish-10 batches PR-35/PR-36 closed many; the rest land over the Polish-class queue.

### HR-4 · Escape user text at HTML/attribute context

PC-2.4 + PC-4.4 + PC-7.5 collectively enforce HR-4. The escape contract is uniform: `escHtml` for HTML body context, `escAttr(escHtml(text))` double-wrap for attribute context until #57 lands path (a), then single-wrap thereafter.

### HR-5 / HR-7 · Tokens + sprite-via-`zi()`

PC-10 enforces HR-5 (tokens for spacing/font/radius). PC-1.4 + PC-2.5 + PC-8.3 + PC-9.1 enforce HR-7 (`<svg class="zi"><use href="#zi-{icon}"/></svg>` for icons).

### HR exclusions

The contract's pattern clauses (PC-1..PC-10) inherit Phase 2 catalog scope, which is design-grounding-bounded. Hard Rules outside that bound are explicitly excluded from the contract's enforcement surface — they remain independently enforced by their existing channels:

- **HR-6** (build-pipeline / module load order) — subsumed by other patterns (PC-7 dispatcher consolidation touches the load-time registration shape; PC-10 token system constrains the CSS-side load order). HR-6's existing enforcement at the build-pipeline boundary remains authoritative; the contract neither restates nor relaxes.
- **HR-8 / HR-9 / HR-10 / HR-11 / HR-12** — out of design-grounding scope (cover non-pattern-class concerns such as data-sync invariants, sync-pipeline correctness, error-handling discipline, performance budgets, and deployment hygiene). The contract neither restates nor relaxes; HR-8..HR-12 remain independently enforced.

If a future Phase 5 hygiene cycle expands the catalog scope to absorb any of these HRs, the contract amends to add corresponding clauses. Until such an amendment, an HR-6/8/9/10/11/12 audit finding on a PR is independently dispositional and does not invoke this contract's severity ladder.

---

## Audit-chain enforcement summary

This contract is enforced by the SproutLab audit chain on every PR landing in `main`:

1. **Builder authors** the PR. Reads relevant clauses; cites canonical-form satisfaction in the PR description for any covered surface introduced or modified.
2. **Governors audit** (Maren for Care/UX surfaces; Kael for Intelligence/sync surfaces; shared on cross-jurisdiction touches per canon-gov-003). Each Governor scopes their audit to in-jurisdiction clauses. Findings are scored against this contract's severity ladder.
3. **Lyra synthesizes** Governor reports per canon-gov-002. The synthesis comment cites contract clauses by ID (e.g. "PC-1.1 BLOCKER on `growthModal` — folds Maren's finding 3").
4. **Cipher Edict V cross-cut** runs after synthesis per canon-cc-008. Cipher's cross-cut targets cross-cluster patterns (e.g. token leak across components per PC-10.4; HR aggregation per the cross-pattern notes above) that single-jurisdiction audits may miss.
5. **Aurelius final pass** verifies the audit chain ran clean and the contract's enforcement was applied. Final-pass findings result in fold-or-mark-ready.
6. **Sovereign approves**. Mark-ready ← Sovereign merges.

**Severity ladder ↔ audit-chain disposition:**

| Severity | Disposition |
|---|---|
| **BLOCKER** | Hard fail. Builder MUST fix before re-submission, or Sovereign explicitly waives with rationale chronicled. |
| **MAJOR** | Forward-pointer issue + rationale required in PR description. Land with explicit deferral note. |
| **MINOR** | Captured in Polish-class queue. PR lands; cleanup follows on a Polish-class PR. |

---

## Phase 4 conformance check input set

Phase 4 (Aurelius) reads this contract as the conformance checklist for PR-ε.0 v6.2. Each MUST clause becomes a verification target. Anticipated Phase 4 findings against v6.2:

| Clause | Expected v6.2 disposition |
|---|---|
| PC-1.1 (modal a11y trio) | **Inherits gap** — v6.2 picker modal (S-17) does not introduce the trio; deferred to issue #54 (now closed via Phase 2 fold; the contract clause is the long-lived enforcement vehicle). Phase 4 verifies the deferral is acceptable as a forward-pointer-bound MAJOR. |
| PC-1.2 (focus trap + Escape) | **Inherits gap** — same deferral basis. |
| PC-1.4 (close glyph) | **Lands canonical** — v6.2 §7.1 ships `zi-close`. |
| PC-1.5 (no inline style on `.modal`) | **Inherits gap** — `foodCatModal` `template.html:2807` is the pre-existing violation; v6.2 does not touch. |
| PC-1.8 (`prefers-reduced-motion`) | **Lands canonical** — v6.2 §7 inherits the global block. |
| PC-1.9 (real-device announce) | **Named verification pre-merge** — v6.2 spec already requires iOS VoiceOver test on the picker. |
| PC-2.1 / PC-2.3 (Subclass C canonical) | **Lands canonical** — v6.2 §4 introduces the first canonical Subclass C instance. |
| PC-2.4 (escape contract) | **Lands canonical** — v6.2 chip × `aria-label` uses `escAttr(escHtml(labelText))` double-wrap. |
| PC-4.1 / PC-4.2 (toast `aria-live` + Undo button) | **Inherits gap** — v6.2 introduces 2 new toast fire-sites without closing the gap. Phase 4 surfaces this as the dominant BLOCKER finding; v6.3 spec amendment likely (or implementation-PR-time fix). |
| PC-7.1 (dispatcher consolidation) | **Out of scope for v6.2** — v6.2 does not consolidate the dispatcher. Phase 4 captures as forward-pointer to the implementation PR. |
| PC-10.6 (new tokens in canonical families) | **Lands canonical** — v6.2 §7.3 tokens (`--lav-light`, `--surface-lav`, `--scrap-*`) all resolve to canonical families. |

The above is **anticipatory**; Phase 4 makes the actual call. This table is Phase 3's input set, not Phase 4's output.

---

## Notes for Cipher (Edict V cross-cut)

Targets I expect Cipher to challenge:

1. **Severity calibration against Phase 1 gap-rank.** I mapped gap-rank-1 + gap-rank-2 + gap-rank-7 (PC-4 toast + PC-1 modal + PC-4 Undo button) to **BLOCKER**, and gap-rank-3 through gap-rank-6 (sheet button conversion, form-input, empty-state, tablist) to **MAJOR**. The split point between BLOCKER and MAJOR is judgment — Cipher should challenge whether sheet `<button>` conversion (gap-rank-3) deserves MAJOR rather than BLOCKER given keyboard-accessibility regression on the speed-lane is mechanically equivalent to modal a11y in user impact. My read: BLOCKER tier reserves for rules that are mechanically grep-resolvable AND produce immediate AT-user impact AND either land canonical with PR-ε.0 v6.2 (PC-4.1 / PC-4.2) or have established AT-fail patterns (PC-1.1–PC-1.3). Cipher's call.

2. **Class C sequencing severity.** PC-7.3 is **MAJOR** because Class C blocks #57 path (a)'s global landing. Cipher should challenge whether PC-7.3 should instead be MINOR (the inline-`onclick=` is HR-3 hygiene; the sequencing is mechanical) or BLOCKER (the load-bearing JS-literal-escape behavior is correctness, not hygiene). My read: MAJOR matches the sequencing-dependency severity used elsewhere (the migration is required before #57 lands; the migration itself is medium-cost). Cipher's call.

3. **PC-1.7 six-overlay-family consolidation severity.** I marked PC-1.7 as **MINOR** (per surface; aggregate is medium-cost across 4 surfaces). Cipher should challenge whether this should be MAJOR — the bug overlay / crop overlay / avatar lightbox / settings sidebar consolidation is a meaningful pattern-divergence reduction and arguably load-bearing for Phase 3's enforcement surface (each non-canonical family is a dispenser-of-exceptions). My read: MINOR because no AT-user impact at audit-base beyond the modal-a11y gap (which PC-1.1 covers); the consolidation is hygiene + maintenance. Cipher's call.

4. **PC-4.5 toast severity differentiation deferral.** I deferred severity differentiation (`is-success` / `is-warn` / `is-error`) to Phase 4 / Phase 5 with a tech-debt-flag on `core.js:3431`. Cipher should challenge whether this deferral is correct, OR whether the contract should require severity differentiation at launch (driving a per-call-site classification migration as PC-4.5 MAJOR). My read: deferral is correct because (a) the 87 call-sites are not currently classified; (b) classification is a per-site judgment that Phase 2 explicitly deferred; (c) PC-5.4 (error-state with retry → `.error-state`, not toast) covers the worst case. Cipher's call.

5. **PC-7.1 dispatcher consolidation severity.** Originally drafted at MAJOR. Cipher should weigh in on whether architecture-driven severity belongs in this contract or in a separate architectural-decision document. **Cipher cross-cut resolution (folded):** weak disagreement — the severity ladder is intelligence-engine-impact-driven and PC-7.1 is architecture-driven; recalibrated to **MINOR** with rationale carry-forward in PC-7 Notes. Architecture-driven enforcement weight belongs in a separate architectural-decision document, out of this contract's scope.

6. **HR alignment vs duplication.** Several rules restate Hard Rules (HR-2 / HR-3 / HR-4 / HR-7) with the catalog's evidence base. Cipher should challenge whether this duplication is desirable (audit-chain has explicit clause IDs to cite) or undesirable (HR conformance is independently enforced; restating bloats the contract). My read: duplication is desirable because contract clauses cite the catalog evidence base + migration cost + sequencing dependencies that bare HR enforcement cannot. Cipher's call on how aggressively to deduplicate.

7. **Phase 4 input-set table accuracy.** The "Expected v6.2 disposition" table is anticipatory. Cipher cross-cut should verify the inheritance-vs-canonical claims by independently scanning the v6.2 spec (`docs/specs/lyra-pr-epsilon-0-foundation.md`) against this contract's MUST clauses. Discrepancies between my anticipatory column and Cipher's independent read are Phase 3 polish-class fold targets.

8. **Cross-pattern HR aggregation.** The "Cross-pattern enforcement notes" section consolidates HR-1 / HR-2 / HR-3 / HR-4 / HR-5 / HR-7 across pattern clauses. Cipher should challenge completeness: did I miss an HR (e.g. HR-6 / HR-8..HR-12) that the pattern clauses collectively touch? My read: HR-6 (build-pipeline) and HR-8..HR-12 (out of design-grounding scope) are not pattern-class-driven. Cipher's call on whether the contract should explicitly enumerate the HR exclusions. **Cipher cross-cut resolution (folded):** confirmed; HR exclusions enumeration added as MINOR housekeeping (Cross-pattern enforcement notes → "HR exclusions" subsection). HR-6 noted as subsumed; HR-8/9/10/11/12 noted as out of design-grounding scope.

9. **PC-10 token rules — Phase 3 contract decisions left open.** Phase 2's PC-10 ended with several "Phase 3 decides" questions. I addressed:
   - Domain-deep colors as tokens (PC-10.1 includes `--{domain}-deep`).
   - `--input-focus` / `--input-glow` retention (PC-10.4 — component-scoped).
   - Token alias chain depth (PC-10.3 — max 2 levels).
   - Unused-token census (PC-10.5 — Phase 3 hygiene census).
   I deferred the `--rose` overload split to Phase 3 hygiene. Cipher should verify the calls are consistent with Phase 2's evidence base + the design system in `CLAUDE.md`.

10. **Anchor discipline.** Every clause cites a Phase 2 PC-N entry and (where applicable) Phase 1 S-NN inventory entries + v6.2 spec sections + relevant issue. Cipher should verify the cross-references resolve at audit-base + spec-base SHAs above; line-drift caveat covers the file:line resolution.

---

## Notes for Aurelius (final pass + Phase 4 brief input)

- The contract is bound to Phase 2 catalog. No new pattern classes are introduced; no canonical forms are re-litigated.
- Severity assignments are per the calibration ladder above (gap-rank → cost → severity). Where Cipher cross-cut adjusts a severity, the change folds into the next polish revision before mark-ready.
- The contract does NOT draft Phase 4 conformance check. The Phase 4 input-set table is anticipatory only; Phase 4 makes the actual call against v6.2.
- The contract does NOT propose v6.3 spec amendments. Phase 4 surfaces those.
- The contract does NOT implement any rule. Step 4 (implementation PR) lands in `split/*` after Phase 4 conformance check; the implementation builds against the contract's MUST clauses with the audit chain enforcing.

---

*End of Phase 3 uniformity contract draft. Audit chain: Lyra → Cipher Edict V cross-cut → Aurelius final pass → Sovereign approval → mark ready → Sovereign merges.*

— Lyra (synthesis lead, sproutlab Province; designated step-4 Builder)
