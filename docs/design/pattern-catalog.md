# SproutLab — Pattern Catalog (Phase 2 of design grounding)

**Author:** Maren (Care/UX Governor)
**Status:** Draft (Phase 2 of 4 — prescriptive; Phase 3 Lyra writes the load-bearing uniformity contract from this catalog; Phase 4 Aurelius runs PR #52 conformance against contract)
**Audit base:** `eecc994c855758cd861805e78f42ebefadfe6c59` (split-file source state, identical to Phase 1)
**Spec base:** `8ad5277` (`main` HEAD post Phase 1 merge — `docs/design/surface-inventory.md` is the source of truth for surface anchors)
**Brief:** PR #52 [comment 4397941145](https://github.com/Rishabh1804/sproutlab/pull/52#issuecomment-4397941145) — Aurelius (canon-corrected workstream table at [comment 4397164732](https://github.com/Rishabh1804/sproutlab/pull/52#issuecomment-4397164732))
**Folds:** issue [#54](https://github.com/Rishabh1804/sproutlab/issues/54) (modal a11y uplift) · issue [#57](https://github.com/Rishabh1804/sproutlab/issues/57) (escAttr global-fix; **census only — fix is downstream**)
**Inventory cross-link:** `docs/design/surface-inventory.md` (S-01..S-17, P-1..P-9)

---

## Charter

Phase 1 captured reality. Phase 2 makes it canonical. Phase 3 turns the catalog into enforceable rules. Phase 4 conforms PR-ε.0 to the contract.

**This document is prescriptive.** For each pattern class identified in Phase 1, this catalog defines:

1. **Canonical form** — the normative HTML / CSS / JS shape.
2. **Allowed variants** — variants permitted by the canonical form, with use cases.
3. **Prohibited variants** — variants that violate the canonical form, with concrete examples drawn from Phase 1 inventory.
4. **Rationale** — why this canonical form. What goes wrong otherwise.
5. **Audit checklist** — bullets a future PR audit chain can mechanically apply.
6. **Migration cost** — per surface, cost to bring inline (`cheap` / `medium` / `expensive`).

Phase 3's uniformity contract derives **must-fix / should-fix / may-fix** rule severities from this catalog's canonical-form definitions plus the migration cost map. Phase 4's PR-ε.0 conformance check lands against the contract, not directly against this catalog.

**What this catalog does not do.** It does not enforce. It does not rewrite code. It does not propose new abstractions. It does not draft Phase 3 (Lyra's pen). It does not land issue #57 (the fix is downstream of Phase 2; Phase 2 produces the call-site census #57's acceptance criteria require). It does not draft v6.3 spec amendments (Phase 4 / Aurelius scope).

---

## Reading guide

- **Pattern Class N (PC-N):** the catalog entry shape. PC-1 through PC-10 cover the 10 pattern classes the brief enumerated.
- **Surface anchors (S-NN):** cross-link to Phase 1 inventory, e.g. S-08 means surface #8 in `surface-inventory.md`.
- **Migration cost labels:**
  - `cheap` — markup-only change, no JS / behavior touch (e.g. add an `aria-label` attribute).
  - `medium` — markup + small CSS / JS change scoped to one helper or a few sites (e.g. wire `role="dialog"` + `aria-labelledby` + extend the existing `openModal`/`closeModal` helpers with focus management).
  - `expensive` — cross-cutting change touching many files or requiring behavioral redesign (e.g. converting all `.ql-option <div>` to `<button>` and rewiring the dispatcher).
- **HR cross-references** — every catalog entry cites the SproutLab Hard Rules (HR-1..HR-12, see CLAUDE.md) it touches.
- **Line-drift caveat** — every file:line anchor resolves against audit-base `eecc994`. When line numbers don't match, resolve by function name (per the v6.2 pseudocode footer convention; carries forward from Phase 1).

---

## PC-1 · Modal / overlay families · folds issue #54

Phase 1 captured **six DOM idioms** for overlay-style surfaces (S-08 Family A, S-07 Family B, S-06 Family C sheet, S-09 Family D bug, S-10 Family E crop, S-11 Family F lightbox, S-12 Family G drawer-not-modal). Phase 2 collapses these to **three canonical families** with normative a11y posture for the modal-shaped ones. The bottom-sheet (FAB sheet) and the drawer (settings sidebar) get distinct canonical forms because they answer distinct interaction questions; they are not modals.

### 1.1 Canonical form — modal (form-bearing or selection-bearing)

```html
<div class="modal-overlay" id="someModal">
  <div class="modal" role="dialog" aria-modal="true"
       aria-labelledby="someModalTitle">
    <h3 id="someModalTitle">Modal title</h3>
    <!-- form content / picker content -->
    <div class="modal-btns">
      <button class="btn btn-ghost" data-action="cancelSomeModal">Cancel</button>
      <button class="btn btn-{domain}" data-action="confirmSomeModal">Confirm</button>
    </div>
  </div>
</div>
```

```js
// Existing helpers, extended (single source of truth):
function openModal(id) {
  const overlay = document.getElementById(id);
  const modal = overlay.querySelector('.modal');
  _modalLastFocus = document.activeElement;        // remember caller for return
  overlay.classList.add('open');
  history.pushState({ overlay: id }, '');
  _modalActivateFocusTrap(modal);                  // cycle Tab + Shift-Tab
  const firstFocusable = modal.querySelector(_FOCUSABLE_SELECTOR);
  if (firstFocusable) firstFocusable.focus();
}
function closeModal(id) {
  const overlay = document.getElementById(id);
  overlay.classList.remove('open');
  _modalDeactivateFocusTrap();
  if (_modalLastFocus && document.contains(_modalLastFocus)) _modalLastFocus.focus();
}
// Single global Escape handler covers all .modal-overlay.open instances.
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const open = document.querySelector('.modal-overlay.open');
  if (open) closeModal(open.id);
});
```

**Mandatory attributes (issue #54 fold):**
- `role="dialog"` on `.modal`
- `aria-modal="true"` on `.modal`
- `aria-labelledby` referencing a stable `id` on the modal title (`<h3>` typically; `<h2>` permitted)
- Focus trap (Tab + Shift-Tab cycle within `.modal`; never escape to background)
- `Escape` closes (single global handler; not per-modal)
- Backdrop click closes via the existing `.modal-overlay` click handler (`core.js:3048–3052`)
- Focus return on close to the element that opened the modal
- `prefers-reduced-motion` block (`styles.css:3902`) continues to suppress modal transitions

### 1.2 Canonical form — bottom sheet (Quick Log surface; non-modal)

```html
<div class="ql-sheet-overlay" id="qlSheetOverlay" data-action="closeQuickLog"></div>
<div class="ql-sheet" id="qlSheet" role="dialog" aria-modal="false"
     aria-labelledby="qlSheetTitle" hidden>
  <div class="ql-sheet-handle" aria-hidden="true"></div>
  <h3 class="ql-sheet-title" id="qlSheetTitle">Quick Log</h3>
  <div class="ql-options" role="menu">
    <button class="ql-option qo-feed" role="menuitem"
            data-quick-modal="feed">…</button>
    <!-- … -->
  </div>
</div>
```

The sheet **is not a modal** (`aria-modal="false"`) — it is a non-modal overlay that surfaces options. The `.ql-option` items are `<button role="menuitem">`, NOT `<div data-quick-modal>` (Phase 1 gap rank 3 — `.ql-option` items as `<div>` is a keyboard-accessibility regression). Backdrop click closes via the same overlay-click idiom Family A uses.

### 1.3 Canonical form — drawer (Settings sidebar; non-modal)

```html
<div class="sidebar-overlay" id="sidebarOverlay" data-action="closeSettingsSidebar"></div>
<aside class="sidebar" id="settingsSidebar" role="dialog" aria-modal="true"
       aria-labelledby="sidebarTitle" hidden>
  <header class="sidebar-header">
    <h2 class="sidebar-title" id="sidebarTitle">
      <svg class="zi" aria-hidden="true"><use href="#zi-bars"/></svg> Settings
    </h2>
    <button class="sidebar-close" data-action="closeSettingsSidebar" aria-label="Close">
      <svg class="zi" aria-hidden="true"><use href="#zi-close"/></svg>
    </button>
  </header>
  <!-- body -->
</aside>
```

The sidebar IS modal in the WAI-ARIA sense (focus is trapped, backdrop click closes, behaves modally) — `aria-modal="true"` applies. `<aside>` is the right element-of-record. Sub-tabs (`.settings-tab`) ride on top of `role="tablist"` (see PC-6).

### 1.4 Allowed variants

| Variant | Use case | Example today |
|---|---|---|
| Modal without form (informational) | Read-only guidance — vaccine-reaction help, food-cat reference | `vaccReactionModal` (S-08); foodCatModal (S-08) |
| Modal with single Save button | Single-record entry — growth, milestone, doctor, event | growth/milestone/doctor/eventModal (S-08) |
| Modal with multi-step state | Per-stage workflows | `vaccApptModal` / `vaccEditModal` (S-08) |
| Modal as picker (selection, not entry) | The new PR-ε.0 v6.2 `scrapMilestonePickerModal` (S-17) | forthcoming |
| Modal with size-extension class | Picker / wide content — extends `.modal` via class additive | `.scrap-picker-modal` (PR-ε.0 v6.2 §7); `.vc-reaction-modal` (today) |
| Bottom sheet | Speed-lane action launcher | `qlSheet` (S-06) |
| Drawer | Hierarchical settings / profile | `settingsSidebar` (S-12) |

Each allowed variant inherits the parent canonical form's a11y posture. Size-extension classes only modify dimensions / padding; they MUST NOT modify `role` / `aria-modal` / `aria-labelledby`.

### 1.5 Prohibited variants

| Prohibition | Phase 1 reference | Why |
|---|---|---|
| **Bespoke overlay DOM idiom** (`.bug-overlay > .bug-card`, `.crop-overlay`, `.avatar-lightbox`) | S-09, S-10, S-11 | Six idioms today; canonical form is three (modal / sheet / drawer). Bug, crop, lightbox MUST migrate to one of the three families based on interaction shape. Bug = modal (form-bearing). Crop = modal (selection). Lightbox = modal (informational). |
| **Inline `style=""` on `.modal` shell** | S-08 (`foodCatModal` `template.html:2807`) | HR-2. Size extensions go on a sub-class. |
| **Literal `&times;` close glyph** | S-09, S-12, S-14, S-15, S-07 (×5 ql-modals), 2 more — **14 occurrences in `template.html`** | HR-1. PR-ε.0 v6.2 §7.1 introduces `zi-close`; canonical close glyph is `<svg class="zi"><use href="#zi-close"/></svg>`. |
| **`<div>` as interactive item** (`.ql-option`) | S-06 (Phase 1 gap rank 3) | Keyboard-accessibility regression. `<button>` is the only interactive-item element in canonical form. |
| **Modal lacking the a11y triplet** | S-08 + S-07 universally; 0 `role="dialog"` / 0 `aria-modal` / 0 `aria-labelledby` in `template.html` today | issue #54. SR users get a heading announce, not a dialog announce. |
| **No Escape handler** | S-08 universally | Keyboard users have no close-without-mouse path beyond the back-button hack. |
| **No focus trap** | S-08, S-07, S-12 universally | Tab cycles into the underlying page; visual modal but functional non-modal. |
| **No focus return on close** | S-08, S-12 universally | Caller-element focus lost; AT users re-orient mid-flow. |

### 1.6 Rationale

A modal is a contract: "your attention is required here, and only here, until you confirm or cancel." That contract is broken when Tab leaks to the background page, when the modal isn't announced as a dialog, when Escape doesn't close, or when focus doesn't return. The data on PR-ε.0 v6.2 says iOS VoiceOver already needs special-case verification for the picker; canonicalizing the dialog announce is the floor below which AT users start guessing.

The six-idiom proliferation is also a maintenance tax: every new overlay-shaped surface requires re-deciding which family it belongs to. Three families with explicit interaction-question discriminators (modal = attention-blocking; sheet = action-launcher; drawer = navigation-with-context) lets Phase 3 write a one-paragraph rule per family rather than per surface.

### 1.7 Audit checklist

- [ ] Every modal uses `.modal-overlay > .modal` family A markup.
- [ ] Every `.modal` carries `role="dialog"` + `aria-modal="true"` + `aria-labelledby` referencing a stable `id` on its title element.
- [ ] Every modal title element (`<h3>` or `<h2>`) carries the matching `id`.
- [ ] `openModal(id)` activates focus trap, focuses the first focusable in the modal, and remembers caller for focus return.
- [ ] `closeModal(id)` deactivates focus trap and returns focus to caller.
- [ ] Single global `Escape` keydown handler closes the topmost open modal.
- [ ] Backdrop click closes via the existing overlay-click handler (`core.js:3048–3052`).
- [ ] No literal `&times;` or `×` glyphs on close buttons; all close buttons use `<svg class="zi"><use href="#zi-close"/></svg>` with `aria-label="Close"` on the button itself.
- [ ] No inline `style=""` on `.modal` shell; size extensions ride on additive sub-classes (`.scrap-picker-modal`, `.vc-reaction-modal`).
- [ ] `prefers-reduced-motion` global block (`styles.css:3902`) continues to apply.
- [ ] iOS VoiceOver announces modal title + "dialog" on open (Maren v4 audit MAJOR pattern — real-device test pre-merge).
- [ ] TalkBack announces dialog role on Android.
- [ ] Bottom sheet (`qlSheet`) uses `role="dialog" aria-modal="false"` and `.ql-option` items are `<button role="menuitem">`, not `<div>`.
- [ ] Settings sidebar uses `<aside role="dialog" aria-modal="true">`.

### 1.8 Migration cost

| Surface | Cost | Notes |
|---|---|---|
| Family A modals (10 today: growth / vacc / vaccAppt / vaccEdit / vaccReaction / foodCat / med / milestone / doctor / event) | **medium** (one helper edit + per-modal markup change) | All inherit the same `openModal` / `closeModal` helper; extending the helpers handles focus trap + Escape centrally. Per-modal change is two attributes + one `id` on title. |
| `scrapMilestonePickerModal` (PR-ε.0 v6.2 §4 — forthcoming) | **cheap** when landed (lands with the canonical form) | Phase 4 conformance check. |
| Family B (5 ql-modals) | **medium** | Same helper-extension approach; close glyphs migrate to `zi-close`. |
| Bottom sheet (`qlSheet`) | **expensive** | `.ql-option` `<div>` → `<button>` + dispatcher rewiring (`data-quick-modal` may need to fold into `data-action`). 6 sites × dispatcher ladders. |
| Settings sidebar | **medium** | Element-of-record swap (`<div>` → `<aside>`); a11y triplet add; close glyph. |
| Bug reporter | **medium** | Migrate `.bug-overlay > .bug-card` to Family A markup; `.bug-btn` family folds into `.btn` (see PC-8). |
| Crop overlay | **medium** | Migrate `.crop-overlay` to Family A (form-bearing — Cancel / Save buttons fit `.modal-btns`). |
| Avatar lightbox | **medium** | Migrate to Family A (informational). |

Total: ~14 surfaces. Phase 3 will set severities; this catalog establishes the canonical form they conform to.

---

## PC-2 · Chip variants

Phase 1 captured 7+ first-class chip class definitions plus per-instance `ct-*` extensions (P-2). The chip pattern is the most-divergent classification in the codebase: 26 first-class call sites across home.js / diet.js / intelligence.js, mixing `<div>` and `<span>` containers, with whole-chip-clickable variants alongside the new PR-ε.0 v6.2 chip-with-inner-x variant (S-17).

### 2.1 Canonical form — three chip subclasses

**Subclass A · Decorative chip** (no interaction; informational status badge).

```html
<span class="chip chip-{advisory}" role="status">
  <svg class="zi" aria-hidden="true"><use href="#zi-{icon}"/></svg>
  <span class="chip-label">${escHtml(text)}</span>
</span>
```

Use cases: food-safety status (`chip-safe` / `chip-caution` / `chip-avoid`); transient state badges. `<span>` container; `role="status"` only when the chip describes a stateful condition (skip for static labels).

**Subclass B · Action chip** (whole-chip clickable; single action).

```html
<button class="chip chip-{domain}" type="button"
        data-action="{actionKey}" data-arg="${escAttr(arg)}">
  <svg class="zi" aria-hidden="true"><use href="#zi-{icon}"/></svg>
  <span class="chip-label">${escHtml(text)}</span>
</button>
```

Use cases: CareTickets banners / quick-clears / template selection (`ct-banner-btn`, `ct-quick-clear`, `ct-template-chip`); QL suggestion switching; filter pills. `<button>` container — natively focusable, in tab order, keyboard-accessible without `tabindex`.

**Subclass C · Tag chip with remove control** (label is non-interactive; inner × button removes — PR-ε.0 v6.2 §4 introduced this subclass).

```html
<span class="chip chip-{domain}" role="listitem">
  <span class="chip-label">${escHtml(labelText)}</span>
  <button type="button" class="chip-x"
          data-action="{removeAction}" data-arg="${m.id}"
          aria-label="Remove ${escAttr(escHtml(labelText))} tag">
    <svg class="zi" aria-hidden="true"><use href="#zi-close"/></svg>
  </button>
</span>
```

Container element is `<span role="listitem">`; container is non-interactive; only the inner × `<button>` is the click target. The container chip lives inside a `role="list"` ancestor (e.g. `<div id="…" class="…" role="list">`).

**Escape contracts (PC-2 binding):**
- Body text node interpolation: `${escHtml(text)}` (HTML context).
- Attribute interpolation containing user text: `${escAttr(escHtml(text))}` **double-wrap** until issue #57 lands the global `escAttr` fix; thereafter `${escAttr(text)}` single-wrap. The double-wrap is correct under both pre-#57 and post-#57 `escAttr` semantics, so canonical form for catalog purposes is the double-wrap. Phase 4 / post-#57 may simplify.
- `data-arg="${m.id}"` is safe without escape when `id` is a slug or UUID by construction (PR-ε.0 v6.2 §4 invariant).

### 2.2 Allowed variants

- **Domain-color modifiers**: `chip-{sage|rose|amber|lavender|sky|indigo|peach}` — one of the 7 domain colors (CLAUDE.md design system). Decorative subclass A may use advisory modifiers (`chip-safe` / `chip-caution` / `chip-avoid`) which are domain-shorthands (sage / amber / rose).
- **Compact size**: `.chip-compact` modifier (existing — used by QL suggestion chips).
- **Active state**: `.chip.active` for selection state in template / answer chips. Uses `aria-pressed="true|false"` on subclass B chips when toggling.
- **Per-feature suffix classes**: `.ct-banner-btn`, `.ct-template-chip`, `.ct-answer-chip` etc. — feature-scoped extensions on the base `.chip` class. Allowed when the visual variation is feature-domain (CT lifecycle states, e.g.) and the base `.chip` rules still apply.

### 2.3 Prohibited variants

| Prohibition | Phase 1 reference | Why |
|---|---|---|
| Inline `onclick=` on chip | `diet.js:428` (food-combo example chip) | HR-3 violation. All chip click behavior routes through `data-action`. |
| `<div>` as Subclass B chip container | `home.js:9243` (`ct-entry-chip`) and several adjacent | `<div>` is not focusable; whole-chip-clickable chips must be `<button>`. |
| `<span>` as Subclass B chip container | `intelligence.js:16822, 16833, 17064, …` (CT chips) | Same reason. The dispatcher fires regardless because of bubble-up, but keyboard users can't reach the chip without `tabindex` (which would be a second HR-3-adjacent hack). |
| Bare ASCII glyphs in chip body (`✓ Fine`, `Save Feed ✓`, `⭐ Milestone`) | `template.html:821, 979, 992, 2228, 2261, 2287, 2308–2311` | HR-1 violation. Use `<svg class="zi"><use href="#zi-check"/></svg>` (or `zi-star`). |
| Chip-as-status with no `role="status"` when state-bearing | (food-safety chips today) | AT users miss the state. Allowed-variant `role="status"` is required for state-bearing decorative chips. |
| Tag chip Subclass C without `role="list"` ancestor | (no current sites; PR-ε.0 v6.2 introduces the first; container has `role="list"` per spec) | `role="listitem"` orphaned without `role="list"` parent is invalid ARIA. |

### 2.4 Rationale

26 call sites with 7+ class extensions and mixed container elements means every new feature has to re-decide three things — element, class, click model — that should be one decision. Splitting into three subclasses with explicit element-of-record (decorative `<span>` / action `<button>` / tag-with-remove `<span>` + inner `<button>`) collapses the decision space.

The three-subclass split is also where keyboard-accessibility lives. Subclass B's `<button>` mandate is the load-bearing fix for the `.ql-option` regression (Phase 1 gap rank 3) and the `<span>`/`<div>` chip drift. Subclass C's `role="list"` + `role="listitem"` + inner `<button>` separation is what makes PR-ε.0 v6.2's per-chip remove control announce correctly to AT users (Maren v4 audit MAJOR; v6 fix on the entity-reference escape).

### 2.5 Audit checklist

- [ ] Every chip is one of three subclasses (decorative `<span>` / action `<button>` / tag-with-remove `<span>` + inner `<button>`).
- [ ] No inline handlers on any chip (`onclick=` / `oninput=` / etc. — dispatcher only).
- [ ] All chip body text uses `escHtml`; all chip attribute interpolations use `escAttr(escHtml(text))` double-wrap (until #57; thereafter single-wrap).
- [ ] No literal Unicode glyphs in chip body (`✓` / `★` / `⭐` / etc.) — all icons via `zi()`.
- [ ] Decorative state-bearing chips carry `role="status"`.
- [ ] Tag chips (Subclass C) sit inside a `role="list"` ancestor.
- [ ] Tag chip × inner buttons carry `aria-label` with the labeled tag-text + "tag" suffix.
- [ ] Active-state action chips use `aria-pressed="true|false"`.
- [ ] Domain colors only — no ad-hoc `style="background:..."` on chips.

### 2.6 Migration cost

| Surface | Cost | Notes |
|---|---|---|
| Food-safety chips (`chip-safe` / `-caution` / `-avoid`, decorative) | **cheap** | Add `role="status"` where state-bearing. |
| Food-combo example chip (`diet.js:428`) | **cheap** | Replace inline `onclick=` with `data-action`; convert `<span>` → `<button>`. |
| CareTickets chip extensions (`ct-entry-chip`, `ct-banner-btn`, `ct-template-chip`, `ct-answer-chip`, `ct-quick-clear`, `ct-resolve-btn`, `ct-reason-chip`) | **medium** | Container element swap (`<div>` / `<span>` → `<button>`) across ~20 generation sites in `home.js` / `intelligence.js`. |
| QL suggestion chips (`chip-base chip-compact chip-{color}`) | **medium** | Container swap (`<span>` → `<button>`) — currently uses `<span>` with bubble-dispatcher. |
| Notes category filter pills (`.note-cat-filter > .ncf-btn`) | **cheap** | Already `<button>`; only need to land `aria-pressed` + drop `⭐ Milestone` literal emoji. |
| Milestone chip Subclass C (PR-ε.0 v6.2 §4) | **cheap** when landed | Phase 4 conformance check. |
| Save-button literal-`✓` glyphs in QL modals (`Save Feed ✓` etc.) | **cheap** | Replace literal `✓` with `<svg class="zi"><use href="#zi-check"/></svg>`. |

Total: ~30 chip generation sites. Predominantly `medium` cost — element swap is mechanical.

---

## PC-3 · Form-input idioms

Phase 1 captured **four parallel form-input idioms**: `.modal-input` (Family A modals, `styles.css:1875`), `.form-input` (Family B + activity textarea, `styles.css:4320`), `.qa-input` (Smart Q&A only), and inline-styled raw `<input>` / `<select>` / `<textarea>` (36+ sites, P-3).

### 3.1 Canonical form

```html
<input type="{type}" id="someInput" class="form-input input-ctx-{domain}"
       placeholder="…" autocomplete="off"
       data-action="{validateAction}">
```

```css
.form-input {
  /* base — exists today at styles.css:4320; keep as-is */
}
.form-input:focus {
  border-color: var(--input-focus, var(--rose));
  box-shadow: 0 0 0 2px var(--input-glow, var(--rose-light));
}
.input-ctx-{domain} {
  /* domain-color modifier — sets --input-focus + --input-glow to the domain palette */
}
```

`form-input` is canonical; `input-ctx-{sage|rose|amber|lavender|sky|indigo|peach}` is the domain-color modifier (existing pattern — used by ql-modal feed input as `input-ctx-peach`).

**Canonical form deprecates `.modal-input` and `.qa-input`.** Both fold into `.form-input` + `.input-ctx-{domain}`. The `.modal-input` rules (rose-domain default) become `.form-input.input-ctx-rose`. The `.qa-input` rules (Smart Q&A bespoke) become `.form-input.input-ctx-lavender` or `.input-ctx-rose` depending on Phase 3 contract domain assignment.

### 3.2 Allowed variants

- Domain-color modifier per CLAUDE.md design system (7 domains).
- Size modifiers: `.form-input-sm` / `.form-input-lg` for compact / hero variants. (Today's hero-sized inputs use `font-size:18px` inline; Phase 3 contract codifies the sizing scale.)
- `<textarea>` and `<select>` use the same `.form-input` class with appropriate native attributes (`rows`, `multiple`, etc.).

### 3.3 Prohibited variants

| Prohibition | Phase 1 reference | Why |
|---|---|---|
| Inline `style=""` on form inputs | S-15 (Scrapbook 6 inputs at `template.html:1029–1034`); S-12 (Settings selects at `:2496, 2509, 2521, 2530`); S-14 (Smart Q&A wrapper) | HR-2; 4 distinct idioms multiply the "is this savable yet?" decision-load. |
| Inline event handlers (`oninput=` / `onchange=`) | 36+ sites in `template.html` (see S-08, S-12, S-15, S-16) | HR-3. Validation routes through `data-action` (e.g. `data-action="updateGrowthSaveBtn"`). |
| `placeholder=""` as the only accessible name | S-14 (`#qaInput`) and several form fields | WCAG 4.1.2; `aria-label` or `<label>` association is required. |
| Bespoke per-feature input class | `.qa-input`, `.meal-input`, `.note-attach-btn` (input wrappers) | Three idioms today; canonical is one. Bespoke classes allowed only as additive `.form-input + .{feature-class}` decorators, never as replacements. |

### 3.4 Rationale

A form-input class IS the boundary contract between a parent's intent ("save this") and the system's confirmation ("yes, valid; saved"). Four boundaries means four contract negotiations per session. One boundary with seven domain-color modifiers is one contract with a vocabulary.

The HR-2 inline-style proliferation specifically degrades the Phase 3 contract's enforcement surface: if the Phase 3 lint rule says "no inline `style=""` on inputs", we need to know what the canonical replacement is. PC-3 says: `.form-input + .input-ctx-{domain}`. Phase 3 then writes one rule, not many.

### 3.5 Audit checklist

- [ ] Every `<input>` / `<textarea>` / `<select>` has `class="form-input"` (alone or with `.input-ctx-{domain}` modifier).
- [ ] No inline `style=""` on any form input.
- [ ] No inline `oninput=` / `onchange=` / `onkeydown=` on any form input.
- [ ] Every form input has either a `<label for="…">` association or a `aria-label="…"` attribute.
- [ ] No bespoke per-feature input classes that duplicate `.form-input`'s rules.
- [ ] iOS Safari zoom-on-focus suppression preserved (existing global rule, `styles.css:160`: `input, textarea, select { font-size:16px !important; }`).

### 3.6 Migration cost

| Surface | Cost | Notes |
|---|---|---|
| `.modal-input` → `.form-input.input-ctx-rose` | **medium** | All 10 Family A modals; CSS rule consolidation + per-input class change in template. |
| `.qa-input` → `.form-input.input-ctx-{lavender|rose}` | **cheap** | Single surface (S-14). |
| Scrapbook add-memory inline-styled inputs (S-15) | **medium** | 6 inputs; replace inline `style=""` with `.form-input.input-ctx-rose`; remove inline handlers; add `<label>` associations. |
| Settings sidebar `<select>` inline-styled (S-12) | **medium** | 4 selects; `class="form-input input-ctx-peach"`; remove inline handlers (HR-3 sweep). |
| Smart Q&A input (S-14) | **cheap** | Single input; class swap + add `aria-label`. |
| Diet tab combo / food / symptom inputs (`template.html:705, 798, 818`) | **medium** | Inline-styled; remove + class swap + handler migration. |

Total: ~50 input sites. Predominantly `medium`; the helper isn't one helper — it's CSS rule consolidation + template-wide class change + HR-3 inline-handler sweep (which Phase 4's Polish-10 batch already covered partially per CLAUDE.md operating-state).

---

## PC-4 · Toast idioms · folds Phase 1 gap rank 1

Phase 1 captured **four toast surfaces**: `#qlToast` (singleton, no `aria-live` — gap rank 1, 87 call-sites), `#syncStatus` / `#syncActivity` / `#updateToast` (full a11y posture), `#offlineBadge` (full a11y posture), `#appVersion` (live region).

### 4.1 Canonical form — Quick Log toast

```html
<div class="ql-toast" id="qlToast"
     role="status" aria-live="polite" aria-atomic="true"></div>
```

```js
function showQLToast(msg, duration, undoFn) {
  const t = document.getElementById('qlToast');
  if (undoFn) {
    _lastQLUndo = undoFn;
    // Undo affordance is a <button>, not a <span> — keyboard-accessible.
    t.innerHTML = `${msg}<button class="ql-toast-undo"
      data-action="undoLastQL" data-stop="1">Undo</button>`;
  } else {
    _lastQLUndo = null;
    t.innerHTML = msg;  // pre-escaped at call site (HR-4)
  }
  t.classList.add('show');
  setTimeout(() => { t.classList.remove('show'); _lastQLUndo = null; }, duration || 2000);
}
```

```css
.ql-toast { /* existing rule at styles.css:5741; keep as-is */ }
.ql-toast-undo {
  margin-left: var(--sp-8);
  font-weight: 700; text-decoration: underline;
  background: transparent; border: none; color: inherit;
  cursor: pointer; padding: 0;
}
.ql-toast-undo:focus-visible {
  outline: 2px solid var(--rose); outline-offset: 2px;
}
```

**Mandatory:**
- `role="status"` + `aria-live="polite"` + `aria-atomic="true"` on the toast container (folds Phase 1 gap rank 1).
- Undo affordance is a `<button>`, not a `<span>` (Phase 1 gap rank 7).
- Inline `style=""` on the Undo affordance MUST be replaced by the `.ql-toast-undo` class (HR-2).

### 4.2 Canonical form — sync surfaces (already canonical today)

`#syncStatus` / `#syncActivity` / `#updateToast` / `#offlineBadge` / `#appVersion` retain their Phase-1-best-in-class a11y posture. PC-4 standardizes the pattern they collectively define:

```html
<button id="syncStatus" type="button" class="sync-indicator"
        hidden aria-live="polite" aria-atomic="true">…</button>
<span id="syncActivity" class="sync-activity"
      hidden role="status" aria-live="polite" aria-atomic="true"></span>
```

Persistent live-region surfaces use:
- `[hidden]` attribute when off-screen (not `display:none` inline).
- `role="status"` for non-interactive surfaces; `<button>` element with `aria-live` for interactive surfaces.
- `aria-atomic="true"` so AT reads the full updated string, not the diff.

### 4.3 Allowed variants

- **Toast severity variants** (additive): `.ql-toast.is-success` / `.is-warn` / `.is-error` for visual distinction. Optional; the canonical form ships without severity differentiation today and PR-ε.0 v6.2 §4 inherits that. Severity variant is a Phase 3 contract decision based on whether catalog work surfaces a severity-distinction need.
- **Persistent badge** (e.g. `#offlineBadge`) — same a11y posture as transient toasts; visibility controlled by `[hidden]` attribute, not classList.
- **Live-region status spans** (e.g. `#appVersion`) — `role="status"` + `aria-live="polite"` for periodic updates without visible animation.

### 4.4 Prohibited variants

| Prohibition | Phase 1 reference | Why |
|---|---|---|
| Toast container without `aria-live` | `#qlToast` (rank 1 gap, 87 call-sites) | AT users get nothing. Critical when the toast is the orphan-tag confirmation (PR-ε.0 v6.2 §4 — Maren v6 audit MAJOR). |
| Undo affordance as `<span>` | `intelligence.js:10762` | Keyboard users can't undo. |
| Inline `style=""` on toast affordance | `intelligence.js:10762` (`text-decoration:underline;font-weight:700;…`) | HR-2. |
| Error/success styling reused across types | `core.js:3431` (`showQLToast('Export failed: ' + err.message)`) | If severity variants land, error states must be visually + AT-distinguishable. Today they're not. |
| Toast queue (`showQLToast(a); showQLToast(b)`) | inherent to single-slot design | Single-slot design replaces messages mid-flight; rapid succession loses information. Not prohibited yet — Phase 3 contract decides whether queueing is canonical or whether single-slot stands. |

### 4.5 Rationale

The Phase 1 gap report ranked the qlToast a11y gap as #1 because 87 call-sites means every confirmation surface inherits the silent failure. PR-ε.0 v6.2 §4 specifically introduces TWO new toast fire-sites (edit-load orphan + confirm-time orphan, Maren v5+v6 audit MAJOR) that are themselves carrying state announcements ("1 milestone tag removed — milestone no longer exists"). Without `aria-live`, AT users see nothing despite the toast being the entire UX of the announcement.

The Undo `<span>` is the recovery path. Recovery paths cannot be keyboard-inaccessible. Period.

### 4.6 Audit checklist

- [ ] `#qlToast` carries `role="status" aria-live="polite" aria-atomic="true"`.
- [ ] Undo affordance is a `<button>` with `class="ql-toast-undo"`, not a `<span>` with inline style.
- [ ] All call sites of `showQLToast` continue to pre-escape interpolated text via `escHtml` (HR-4).
- [ ] Error path (`showQLToast('Export failed: ' + err.message)`) — Phase 3 decides severity variant; until then, this is a logged tech-debt note, not a violation.
- [ ] Persistent live-region surfaces use `[hidden]` attribute, not `display:none` inline (HR-2 + WCAG 4.1.2).
- [ ] No inline `style=""` on toast / sync-indicator / offline-badge.

### 4.7 Migration cost

| Surface | Cost | Notes |
|---|---|---|
| `#qlToast` `aria-live` add | **cheap** | Three attributes on one DOM element. 87 call-sites need no change because the call shape stays identical. |
| Undo `<span>` → `<button>` + `.ql-toast-undo` class | **cheap** | One function (`showQLToast`); template rule add. |
| Sync surfaces | **n/a** | Already canonical. |
| Toast severity variants (if Phase 3 lands them) | **medium** | Per-call-site classification of success / warn / error across 87 sites. Deferred to Phase 3 decision. |

Predominantly `cheap`. The high-impact a11y fix is one function edit + one DOM-element attribute add.

---

## PC-5 · Edge states (empty / loading / error / offline / unauthenticated)

Phase 1 captured **13 empty-state sites with three idioms** (P-5: inline-styled `<div>`, `.t-sub-light` (+ optional `fe-center-action`), `.info-strip is-neutral`); a fourth idiom (`.picker-empty`) lands with PR-ε.0 v6.2. Loading states are **effectively absent** (one site: `.ob-loading`). Error states reuse success-toast styling. Offline is best-in-class (S-04, S-05). Unauthenticated lives only in the settings card.

### 5.1 Canonical form — empty state

```html
<div class="empty-state empty-state-{tone}">
  <svg class="zi empty-state-icon" aria-hidden="true">
    <use href="#zi-{contextual-icon}"/>
  </svg>
  <p class="empty-state-title">${escHtml(title)}</p>
  <p class="empty-state-sub">${escHtml(sub)}</p>
</div>
```

```css
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  gap: var(--sp-8);
  padding: var(--sp-32) var(--sp-16);
  color: var(--mid);
  text-align: center;
}
.empty-state-icon {
  width: var(--icon-lg); height: var(--icon-lg);
  color: var(--mid);
}
.empty-state-{warm}     .empty-state-icon { color: var(--lavender); }
.empty-state-{neutral}  .empty-state-icon { color: var(--mid); }
.empty-state-{caution}  .empty-state-icon { color: var(--amber); }
.empty-state-title { margin: 0; font-size: var(--fs-base); }
.empty-state-sub   { margin: 0; color: var(--light); font-size: var(--fs-sm); }
```

The `.picker-empty` rule from PR-ε.0 v6.2 §7.3 is the prototype this canonical form generalizes. Promotion to `.empty-state` retains the picker-empty visual; PR-ε.0's `.picker-empty` becomes a feature-scoped wrapper that internally uses `.empty-state`, OR is absorbed into `.empty-state-warm` (Phase 3 decides).

### 5.2 Canonical form — loading state

```html
<div class="loading-state" role="status" aria-live="polite">
  <span class="loading-spinner" aria-hidden="true"></span>
  <span class="loading-state-text">${escHtml(label)}</span>
</div>
```

Today's only existing pattern (`.ob-loading` at `styles.css:6803`) sits inside an onboarding step and is the prototype. Most surfaces don't ship a loading state because local-first means most renders are sync; Firebase-attached views and post-receive renders (PR-β / PR-ε.0 v6.2 sync-layer integration) are the natural fits.

The canonical form does not require a loading state on every surface — it requires that **when a surface ships a loading state**, it uses this form.

### 5.3 Canonical form — error state

```html
<div class="error-state error-state-{severity}" role="alert">
  <svg class="zi error-state-icon" aria-hidden="true">
    <use href="#zi-warn"/>
  </svg>
  <div class="error-state-body">
    <p class="error-state-title">${escHtml(title)}</p>
    <p class="error-state-sub">${escHtml(sub)}</p>
    <button class="btn btn-ghost btn-sm error-state-action"
            data-action="${retryAction}">Retry</button>
  </div>
</div>
```

`role="alert"` (assertive live region — distinct from `role="status"` polite). Retry is canonical when a network-style failure can be retried; informational errors (`No data`) are empty states (PC-5.1), not error states.

### 5.4 Canonical form — offline / unauthenticated

Offline is canonical today via `#offlineBadge` (S-05). PC-5 simply codifies it: persistent badge below header, `role="status" aria-live="polite" aria-atomic="true"`, conditionally shown via `[hidden]` attribute, reload affordance only in halted state.

Unauthenticated state is a settings-card-only surface today (S-12). PC-5 leaves it scoped to settings — local-first design means unauthenticated is the default operating mode and surfacing it as an exception across the app would create alarmist drift. Phase 3 contract MAY require an unauthenticated banner if a future feature requires sign-in for entry; Phase 2 catalog scopes it to settings and notes the boundary.

### 5.5 Allowed variants

- Per-domain icon choice (`zi-sprout`, `zi-camera`, `zi-bowl`, etc.) on empty states.
- Per-tone modifier on empty states (`-warm` / `-neutral` / `-caution`).
- Loading-state spinner styles — Phase 3 picks the spinner motion (spinner / progress bar / pulse) and integrates with `prefers-reduced-motion`.
- Error-state severity (`-warn` / `-error`) for visual differentiation.

### 5.6 Prohibited variants

| Prohibition | Phase 1 reference | Why |
|---|---|---|
| Inline-styled empty `<div>` | 13 sites (P-5) — `core.js:2013, 2122, 3599`; `home.js:1381, 1471, 2074, 2381, 2459, 2657, 3016, 5530, 5903, 5919`; `diet.js:3369` | HR-2; three idioms multiply the maintenance load. |
| Empty-state copy without contextual icon | most current empty-state sites | Empty space without a visual anchor reads as broken; the icon is the anchor that says "this is intentional". |
| Loading state via static placeholder text (`<p>Loading...</p>` in header) | S-03 (`template.html:140`) | If `renderHome` errors silently, the placeholder never clears. Canonical form has the indeterminate aria-live signal that replaces with content on resolve. |
| Error state reused as success toast variant | `core.js:3431` (`showQLToast('Export failed: …')`) | Same toast surface for success and error; visual ambiguity. PC-4 deferred severity variants to Phase 3; PC-5 says error states with retry are NOT toasts. |
| Unauthenticated banner outside settings | (none today) | Local-first design boundary; if a future feature requires sign-in, Phase 3 contract defines the surfacing pattern. |

### 5.7 Audit checklist

- [ ] Every empty-state copy uses `.empty-state` markup with contextual icon + title + optional sub-text.
- [ ] No inline-styled empty `<div>` rendered from JS.
- [ ] Loading states (when present) use `.loading-state` markup with `role="status"`.
- [ ] Error states with retry use `.error-state` markup with `role="alert"`.
- [ ] Offline badge canonical (already passing today).
- [ ] Unauthenticated state scoped to settings card.

### 5.8 Migration cost

| Surface | Cost | Notes |
|---|---|---|
| 13 empty-state sites → `.empty-state` markup | **medium** | Each is a one-line markup change in JS; aggregate is medium because it touches 6 files. |
| Loading-state introduction (Firebase post-receive views) | **medium** | Phase 3 decides which surfaces ship loading states; Phase 4 / downstream PR lands them. |
| Error-state separation from toast | **medium** | Per-call-site classification (PC-4 severity variants); roll into the Phase 3 contract enforcement layer. |
| Offline badge | **n/a** | Already canonical. |
| Unauthenticated state | **n/a** | Already scoped. |

Predominantly `medium`. Empty-state migration is the largest piece (13 sites × ~5 lines per site).

---

## PC-6 · Navigation

Phase 1 captured **three parallel tab-bar implementations** (P-6: top-level `.tab-btn`, Track sub-tab `.track-sub-btn`, settings sub-tab `.settings-tab`) plus a filter-pill peer (`.note-cat-filter > .ncf-btn`).

### 6.1 Canonical form — tablist

```html
<div class="tab-bar" role="tablist" aria-label="{Section} navigation">
  <button class="tab-btn" role="tab"
          id="tab-trigger-{key}" aria-selected="{true|false}"
          aria-controls="tab-{key}" tabindex="{0|-1}"
          data-tab="{key}">
    <span class="tab-icon" aria-hidden="true">
      <svg class="zi"><use href="#zi-{icon}"/></svg>
    </span>
    <span class="tab-label">{Label}</span>
  </button>
</div>

<div class="tab-panel" id="tab-{key}"
     role="tabpanel" aria-labelledby="tab-trigger-{key}"
     tabindex="0" hidden>
  <!-- panel content -->
</div>
```

```js
// Roving tabindex — only the active tab is in tab order; arrow keys move between tabs.
function _tabBarHandleKey(e) {
  if (!e.target.matches('[role="tab"]')) return;
  const tabs = [...e.target.parentElement.querySelectorAll('[role="tab"]')];
  const i = tabs.indexOf(e.target);
  let next = i;
  if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
  else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
  else if (e.key === 'Home') next = 0;
  else if (e.key === 'End') next = tabs.length - 1;
  else return;
  e.preventDefault();
  tabs[next].focus();
  tabs[next].click();   // activate-on-focus per WAI-ARIA tablist pattern
}
```

**Mandatory:**
- `role="tablist"` on the bar; `aria-label` describing what the tabs are.
- `role="tab"` on each tab button; `aria-selected="true|false"`; `aria-controls` referencing the panel.
- `role="tabpanel"` on each panel; `aria-labelledby` referencing the tab.
- Roving tabindex (only one tab `tabindex="0"`; rest `tabindex="-1"`).
- Arrow keys move focus + activate (Home / End jump to first / last).
- `aria-label` per tab where the visible label is icon + text (e.g. "Home tab"); current `aria-label="Home tab"` pattern (`template.html:106`) is correct.

### 6.2 Canonical form — sub-tabs (Track sub-tab bar; Settings sub-tabs; Notes filter pills)

Same canonical form as PC-6.1. The Phase 1-captured proliferation is three parallel implementations of the SAME pattern with different class prefixes. Phase 3 contract decides whether the prefixes (`tab-`, `track-sub-`, `settings-tab-`, `ncf-`) collapse into a single class with size / context modifiers, or stay as feature-scoped extensions on top of the canonical form.

For Phase 2: all three implementations adopt `role="tablist"` + roving tabindex + arrow-key nav; the class-name proliferation is logged for Phase 3 normalization decision.

Notes category filter pills are filter-shaped, not tab-shaped — they're closer to PC-2 Subclass B (action chips) with `aria-pressed`. Phase 3 contract decides; Phase 2 catalogs them as "filter pills (action-chip subclass) — see PC-2.1 Subclass B".

### 6.3 Allowed variants

- Bottom-nav variant (top-level `tab-bar`) — full-width with icon + label.
- Horizontal-scroll variant (Track sub-tab; Settings sub-tab) — scrollable when overflow.
- Filter-pill variant (Notes filter) — fold into PC-2.

### 6.4 Prohibited variants

| Prohibition | Phase 1 reference | Why |
|---|---|---|
| Tab bar without `role="tablist"` | S-01, S-02, S-12 (all three current implementations) | WCAG 4.1.2; AT users navigate the wrong shape. |
| Tab buttons without `aria-selected` | S-01, S-02, S-12 | Active tab indistinguishable to AT. |
| No arrow-key nav | S-01, S-02 (Phase 1 explicit gap) | Keyboard users tab through every panel before reaching the next tab. |
| `<div>` as tab item | (no current sites; safeguard) | Same reason as PC-2 Subclass B. |
| Two namespaces overlapping on `data-tab` (top-level + Track sub-key) | `core.js:2674` | Dispatcher resolution ambiguity; Phase 3 contract decides whether `data-tab` (top-level) and `data-track-sub` are explicit attributes, or whether the dispatcher is given a discriminator. |

### 6.5 Rationale

Three nearly-identical tab implementations is the highest-frequency cross-cutting divergence below the modal proliferation. Tablist semantics are well-defined in WAI-ARIA; the cost of getting them wrong is universal AT navigation degradation. Folding the three into one canonical form with optional context modifiers makes Phase 3's contract surface single-rule.

### 6.6 Audit checklist

- [ ] Every tab bar uses `role="tablist"` with `aria-label`.
- [ ] Every tab button uses `role="tab"` + `aria-selected` + `aria-controls`.
- [ ] Every tab panel uses `role="tabpanel"` + `aria-labelledby` + `tabindex="0"`.
- [ ] Roving tabindex active.
- [ ] Arrow keys + Home + End work.
- [ ] `data-tab` attribute scoping unambiguous (top-level vs sub-key).
- [ ] Notes filter pills folded into PC-2 Subclass B (action chips with `aria-pressed`), or explicitly catalogued as a separate filter-pill subclass with rationale.

### 6.7 Migration cost

| Surface | Cost | Notes |
|---|---|---|
| Top-level tab bar (S-01) | **medium** | Class additions across 6 buttons + global keydown handler; `core.js:2738+` `renderTrackSubBar` already generates dynamic markup that picks up the canonical form once the renderer is updated. |
| Track sub-tab bar (S-02) | **medium** | Renderer change + dynamic markup. |
| Settings sub-tab bar (S-12) | **medium** | Static markup change + behavior add. |
| Notes filter pills | **cheap** (fold into PC-2) | `.ncf-btn` already `<button>`; just add `aria-pressed`. |
| Dispatcher `data-tab` namespace disambiguation | **medium** | `core.js:2674` resolution arm; introduce `data-track-sub` or similar attribute. |

---

## PC-7 · Action-dispatcher patterns

Phase 1 captured the dispatcher at `core.js:259+`, `:348+`, `:474+`, `:614+` with `data-action` / `data-arg` / `data-arg2` / `data-id` / `data-stop` attributes (P-7). 36 inline `oninput=` / `onchange=` / `onclick=` survive as HR-3 violations alongside the dispatcher pattern.

### 7.1 Canonical form

```html
<button data-action="{actionKey}"
        data-arg="${escAttr(escHtml(arg))}"
        data-arg2="${escAttr(escHtml(arg2))}"
        data-id="${escAttr(escHtml(id))}">
  …
</button>
```

```js
// Single dispatcher location (consolidate from four to one).
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  if (btn.dataset.stop) e.stopPropagation();
  const action = btn.dataset.action;
  const arg = btn.dataset.arg;
  const arg2 = btn.dataset.arg2;
  const id = btn.dataset.id;
  _dispatchAction(action, { arg, arg2, id, event: e, button: btn });
});

function _dispatchAction(action, ctx) {
  const handler = _ACTION_HANDLERS[action];
  if (!handler) {
    if (typeof window[action] === 'function') return window[action](ctx.arg, ctx.arg2, ctx.id);
    console.warn('Unhandled dispatcher action:', action);
    return;
  }
  handler(ctx);
}

// Action handlers registered as table entries, not as if/else if branches.
const _ACTION_HANDLERS = {
  switchTab:        ({ arg }) => switchTab(arg),
  switchTrackSub:   ({ arg }) => switchTrackSub(arg),
  navTabSub:        ({ arg, arg2 }) => { switchTab(arg); setTimeout(() => switchTrackSub(arg2), 100); },
  // … one entry per action key
};
```

The four-location dispatcher ladder (`core.js:259+/:348+/:474+/:614+`) collapses into one location with a handler-table indirection. The handler-table approach makes adding a new action a one-line registration rather than a per-tab-handler ladder edit.

### 7.2 Allowed variants

- **Custom keydown handlers** for keyboard-equivalent activation (e.g. `_qaHandleKeydown` `intelligence.js:2508`) — allowed when the surface needs more than Space/Enter (Smart Q&A submit-on-Enter is a clean example).
- **Per-feature attribute extensions** (`data-collapse-target`, `data-collapse-chevron`, `data-quick-modal`, `data-tab`, `data-track-sub`) — allowed when the attribute carries a distinct routing namespace from `data-action`. Phase 3 contract decides whether these collapse into `data-action` form or stay distinct.
- **`data-stop="1"`** for explicit `e.stopPropagation()` — allowed; widely used.

### 7.3 Prohibited variants

| Prohibition | Phase 1 reference | Why |
|---|---|---|
| Inline `oninput=` / `onchange=` / `onclick=` | 36 sites (P-7) | HR-3. Phase 4 Polish-10 batches (PR-35 / PR-36) closed many; the rest land in Phase 3 contract enforcement. |
| Multiple dispatcher ladders for the same `data-action` namespace | `core.js:259+`, `:348+`, `:474+`, `:614+` | Same action key may dispatch differently depending on which ladder fires first; debugging surface is bad. |
| Dispatcher fallback to `window[action]` without explicit registration | (existing fallback in current dispatcher) | Magic-method-call surface; canonical form requires explicit registration in `_ACTION_HANDLERS`. |
| `data-arg` containing un-escaped user-text | implicit risk; PC-2 escape contracts apply | XSS / SR-pronunciation risk. |

### 7.4 Rationale

The dispatcher is the spine of the app's interaction model. Four ladders sharing one attribute namespace is a debugging surface that compounds with every feature. A handler-table indirection makes the spine inspectable: `Object.keys(_ACTION_HANDLERS)` is the list of every action the app responds to. Phase 3 contract enforcement then has a single grep target.

The 36 inline-handler holdouts are HR-3 carry-over from pre-dispatcher days. Phase 4 Polish-10 batches closed the heaviest concentrations; the remainder are scattered across surfaces where the inline handler co-exists with `data-action` (e.g. Settings sidebar `<select>` `onchange="..."` alongside surrounding `data-action` buttons). Phase 3 contract sets the closeout severity.

### 7.5 Audit checklist

- [ ] Single dispatcher location; ladder consolidation done.
- [ ] All actions registered in `_ACTION_HANDLERS` (no implicit `window[action]` fallback).
- [ ] No inline `on{event}=` handlers anywhere.
- [ ] `data-arg` / `data-arg2` / `data-id` interpolations use `escAttr(escHtml(text))` double-wrap.
- [ ] `data-action` / `data-tab` / `data-track-sub` / `data-quick-modal` namespaces explicit; no overlap.

### 7.6 Migration cost

| Surface | Cost | Notes |
|---|---|---|
| Dispatcher consolidation (4 → 1 location) | **expensive** | Touches `core.js:259..730` heavily; cross-Region (action handlers in home.js, diet.js, medical.js, intelligence.js, sync.js call into the dispatcher implicitly via `window[action]`). |
| `_ACTION_HANDLERS` table population | **expensive** | Per-action registration; ~80+ actions visible in current dispatcher. |
| 36 inline-handler closeout | **medium** | Per-site replacement with `data-action`; partially closed by Polish-10 batches. |
| Namespace disambiguation (`data-tab` overload) | **medium** (also in PC-6.7) | One-time refactor. |

---

## PC-8 · Button / CTA variants

Phase 1 captured **9 first-class button variants** (`.btn` + 7 domain modifiers + `.btn-ghost`) plus bespoke families (`.bug-btn`, `.crop-cancel` / `.crop-save`, `.alert-start-btn-rose` / `-amber`).

### 8.1 Canonical form

```html
<button class="btn btn-{domain} btn-{size}" type="button"
        data-action="{actionKey}">
  <svg class="zi" aria-hidden="true"><use href="#zi-{icon}"/></svg>
  {Label}
</button>
```

```css
.btn      { /* base — exists today; padding, radius, focus ring */ }
.btn-rose / .btn-sage / .btn-peach / .btn-lav / .btn-sky / .btn-indigo / .btn-amber
{ /* domain-color filled variants */ }
.btn-ghost { /* secondary / cancel — outline-only */ }
.btn-sm / .btn-base (default) / .btn-lg { /* size scale */ }
.btn-full-base { /* full-width — already exists */ }
```

**Domain-color CTA pairing convention** (issue #54 + PR-ε.0 v6.2 §7.7 inheritance):
- Cancel uses `.btn-ghost`.
- Confirm / Save uses `.btn-{domain}` matching the surface's domain (lavender for milestones, rose for medical, sage for diet, etc.).
- Destructive Confirm uses `.btn-rose` (rose-domain doubles as the alert/warning color per CLAUDE.md design system).

### 8.2 Allowed variants

- 7 domain colors per CLAUDE.md design system.
- 3 sizes (`-sm`, default, `-lg`).
- Width modifier (`-full-base`).
- Icon inside button — `<svg class="zi">` per HR-7.
- Disabled state via `disabled` attribute or `.disabled-state` class (existing pattern at `template.html:1004` Save Note button).

### 8.3 Prohibited variants

| Prohibition | Phase 1 reference | Why |
|---|---|---|
| Bespoke button family (`.bug-btn`, `.crop-cancel`, `.crop-save`, `.alert-start-btn-{rose|amber}`) | S-09, S-10, P-8 | Five idioms today; canonical is `.btn`. |
| Inline-styled button | S-15 (scrap-photo-remove `template.html:1028` — also literal `×` glyph violation) | HR-2; HR-1. |
| Disabled state via `style="opacity:0.5;pointer-events:none;"` | (verify Phase 2; Phase 1 captured `disabled-state` class as canonical) | Use `disabled` attribute or `.disabled-state` class. |
| Domain-color mismatch between Cancel and Confirm | (no current violations; safeguard) | Cancel always `.btn-ghost`; Confirm always domain-color. |

### 8.4 Rationale

Bespoke button families are the visible tip of the per-feature CSS-class iceberg. The canonical `.btn + .btn-{domain}` system covers every CTA in the app today; bespoke families exist only because three overlay surfaces (bug, crop, alerts) didn't get folded into the system at first authoring. Folding them into `.btn` collapses to one rule surface for Phase 3 contract enforcement.

### 8.5 Audit checklist

- [ ] Every CTA uses `class="btn btn-{domain}"` or `.btn-ghost`.
- [ ] No bespoke button class families.
- [ ] No inline `style=""` on buttons.
- [ ] Disabled state via `disabled` attribute or `.disabled-state` class.
- [ ] Cancel buttons use `.btn-ghost`; Confirm buttons use domain color matching surface.
- [ ] Icon inside button uses `<svg class="zi">` per HR-7.

### 8.6 Migration cost

| Surface | Cost | Notes |
|---|---|---|
| `.bug-btn` family → `.btn` | **cheap** | 2-3 buttons; class swap. |
| `.crop-cancel` / `.crop-save` → `.btn-ghost` / `.btn-rose` | **cheap** | 2 buttons. |
| `.alert-start-btn-rose` / `-amber` → `.btn-rose` / `.btn-amber` | **cheap** | Few sites; rule consolidation. |
| Scrap-photo-remove inline-styled button | **cheap** | Class + `zi-close` migration. |
| Save-button literal `✓` glyphs (`Save Feed ✓` etc.) | **cheap** | `<svg class="zi"><use href="#zi-check"/></svg>` swap. |

Predominantly `cheap`; this is rule consolidation more than behavioral change.

---

## PC-9 · Collapsible-card pattern

Phase 1 captured **75 occurrences of literal `▾` glyph** (P-9, post-Cipher polish) and 72 `data-collapse-target` instances. The collapsible card is the most-used pattern in the History tab and Insights deep-dive cards.

### 9.1 Canonical form

```html
<div class="card card-info">
  <div class="card-header"
       data-action="toggleCollapse"
       data-collapse-target="someBody"
       data-collapse-chevron="someChevron"
       aria-expanded="{true|false}"
       aria-controls="someBody">
    <div class="card-title">
      <div class="icon icon-{domain}">
        <svg class="zi" aria-hidden="true"><use href="#zi-{icon}"/></svg>
      </div>
      Card title
    </div>
    <span class="collapse-chevron" id="someChevron" aria-hidden="true">
      <svg class="zi"><use href="#zi-chevron"/></svg>
    </span>
  </div>
  <div id="someBody" class="collapse-body" hidden>
    <!-- body content -->
  </div>
</div>
```

```js
function toggleCollapse({ button }) {
  const targetId = button.dataset.collapseTarget;
  const chevronId = button.dataset.collapseChevron;
  const body = document.getElementById(targetId);
  const chevron = chevronId && document.getElementById(chevronId);
  const isOpen = !body.hasAttribute('hidden');
  if (isOpen) {
    body.setAttribute('hidden', '');
    button.setAttribute('aria-expanded', 'false');
    if (chevron) chevron.classList.remove('rotated');
  } else {
    body.removeAttribute('hidden');
    button.setAttribute('aria-expanded', 'true');
    if (chevron) chevron.classList.add('rotated');
  }
}
```

```css
.collapse-chevron .zi {
  transition: transform var(--ease-fast);
  transform: rotate(0deg);
}
.collapse-chevron.rotated .zi { transform: rotate(180deg); }
```

**Mandatory:**
- Chevron icon is `<svg class="zi"><use href="#zi-chevron"/></svg>` — `zi-chevron` sprite addition required (parallel to PR-ε.0 v6.2 §7.1 `zi-close` addition; PC-9 is the bigger sprite-migration target, 75 sites).
- `.card-header` carries `aria-expanded` + `aria-controls`.
- `.collapse-body` uses `[hidden]` attribute, not inline `style="display:none"` — current pattern uses inline styles widely (HR-2 leak).
- Rotation via CSS class toggle, not via re-parenting the chevron.

### 9.2 Allowed variants

- **Header-as-clickable** (`data-action="toggleHomeNotes"` exists today on Notes header — works inside the canonical form).
- **Per-card chevron id** convention (`{cardKey}Chevron`) — keeps the dispatcher generic.
- **Disclosure with no chevron** (rare; exists on a few cards) — allowed when the card body's visibility is conveyed by some other affordance.

### 9.3 Prohibited variants

| Prohibition | Phase 1 reference | Why |
|---|---|---|
| Literal `▾` glyph | 75 occurrences in `template.html` | HR-1; mirrors the chip-× problem PR-ε.0 v6.2 §7.1 fixed. |
| Inline `style="display:none;"` on `.collapse-body` | most current sites (e.g. `template.html:1014, 1016, 951`) | HR-2; `[hidden]` attribute is the canonical hide-mechanism. |
| `.card-header` without `aria-expanded` | universally today | WCAG 4.1.2; AT users get no expanded/collapsed state. |
| Chevron rotation via inline style | (verify Phase 2) | HR-2. |

### 9.4 Rationale

75 chevron sites is the largest single HR-1 migration in the app. Adding `zi-chevron` to the sprite is one operation; rolling it through the 75 sites is medium-cost mechanical migration. The a11y posture (`aria-expanded` + `aria-controls`) is the load-bearing AT story for any tab / accordion / disclosure pattern; today it's universally absent.

### 9.5 Audit checklist

- [ ] `zi-chevron` sprite addition lands.
- [ ] Every `.collapse-chevron` uses `<svg class="zi"><use href="#zi-chevron"/></svg>`; no literal `▾`.
- [ ] Every `.card-header` toggling a body carries `aria-expanded` + `aria-controls`.
- [ ] `.collapse-body` uses `[hidden]` attribute, not inline `style="display:none"`.
- [ ] Chevron rotation via CSS class, not inline style.
- [ ] Rotation respects `prefers-reduced-motion` global block.

### 9.6 Migration cost

| Surface | Cost | Notes |
|---|---|---|
| `zi-chevron` sprite addition | **cheap** | One symbol addition; parallel to PR-ε.0 v6.2 §7.1. |
| 75 literal `▾` sites → `zi-chevron` | **medium** | Mechanical replacement; mostly in `template.html`. |
| 72 `aria-expanded` additions | **medium** | Parallel pass over all `data-collapse-target` sites. |
| `[hidden]` attribute migration | **medium** | Needs care — current `.collapse-body { display: ... }` rules may need `[hidden]`-aware override (`[hidden] { display: none !important; }` once globally). |

---

## PC-10 · Token system

Phase 1 deferred token-usage census to Phase 2 ("out of scope for Phase 1; Phase 2 token-map work will run a usage census"). PC-10 lands the census + canonicalizes the existing token grammar.

### 10.1 Canonical form — token taxonomy

| Family | Tokens (today) | Use |
|---|---|---|
| **Spacing** | `--sp-2`, `--sp-4`, `--sp-6`, `--sp-8`, `--sp-10`, `--sp-12`, `--sp-16`, `--sp-20`, `--sp-24`, `--sp-32` | Padding, margin, gap, row-spacing |
| **Font size** | `--fs-xs`, `--fs-sm`, `--fs-base`, `--fs-md`, `--fs-lg`, `--fs-xl` | Typography scale |
| **Radius** | `--r-sm`, `--r-md`, `--r-lg`, `--r-xl`, `--r-full` | Border-radius |
| **Easing** | `--ease-fast`, `--ease-med`, `--ease-slow`, `--ease-spring` | Transitions / animation |
| **Line-height** | `--lh-none`, `--lh-tight`, `--lh-snug`, `--lh-normal`, `--lh-relaxed` | Typography rhythm |
| **Icon size** | `--icon-xs`, `--icon-sm`, `--icon-md`, `--icon-base`, `--icon-lg` | `zi()` SVG sizing |
| **Letter-spacing** | `--ls-tight`, `--ls-normal`, `--ls-wide` | Typography micro-rhythm |
| **Domain color** | `--sage`, `--rose`, `--amber`, `--lavender`, `--sky`, `--indigo`, `--peach` (+ `-light` / `-deep` variants) | 7 domains per CLAUDE.md design system |
| **Surface tokens** | `--card-bg`, `--blush`, `--cream`, `--text`, `--mid`, `--light`, `--surface-{domain}` | Semantic surface naming |
| **Component-specific** | `--input-focus`, `--input-glow`, `--tc-{domain}` (text colors) | Component-bound tokens |

### 10.2 Allowed variants

- **Domain-light / domain-deep modifier tokens** (`--sage-light`, `--lavender-light`, `--accent-sage-deep`, etc.) — valid extensions of domain colors.
- **Surface-color tokens** (`--surface-sage`, `--surface-lav`) — semantic alpha-overlay tokens for hover / hover-bg surfaces. PR-ε.0 v6.2 §7.3 ships `--surface-lav` for the picker check background.
- **Component-tier tokens** (`--input-focus`, `--input-glow`) — bound to a component family (form-input). Allowed when the token name communicates component scope.
- **CSS custom properties for dynamic values** (`--dyn-pct` per Polish-6 PR-30) — explicit dynamic-value carriers; canonical pattern when computed values are CSS-driven.

### 10.3 Prohibited variants

| Prohibition | Phase 1 reference | Why |
|---|---|---|
| Raw hex literals in component CSS | Pre-Phase-4 sweeps closed many; `.btn-rose` `#b0485e` and similar deep-domain raw hexes survive (`styles.css:311`) — verify Phase 3 contract whether they should be tokens | HR-5 in spirit (spacing/font/radius via tokens); domain-deep colors should likely be `--{domain}-deep` tokens. |
| Inline `style="color:#xxx;"` | 228 inline-style instances in `template.html` | HR-2. |
| Token aliases without semantic value (`--foo: var(--bar);` chain depth >2) | (verify Phase 3) | Indirection without semantic clarity is maintenance debt. |
| Component-tier token leak across components | (verify Phase 3 — `--input-focus` should not appear in `.btn` CSS, e.g.) | Tokens stay in their component scope. |
| Unused tokens | (Phase 3 census enumerates) | Maintenance debt. |

### 10.4 Rationale

The token system is the design-system contract layer. Phase 3's uniformity contract derives all visual rules from this token vocabulary. Without canonicalization here, Phase 3 contract rules either leak hex literals into normative documents or under-specify the design intent.

### 10.5 Audit checklist

- [ ] Every `var(--*)` reference resolves to a token in the taxonomy above.
- [ ] No raw hex literals in component CSS (deep-domain colors as `--{domain}-deep` tokens).
- [ ] No inline `style="color:..."` / `style="background:..."` etc.
- [ ] Component-tier tokens stay in their component scope.
- [ ] `--dyn-*` pattern used for dynamic values (Polish-6 carry-forward).

### 10.6 Migration cost

| Surface | Cost | Notes |
|---|---|---|
| Hex-literal sweep (component CSS) | **medium** | Polish-3 (PR-27) closed 32 sites; remaining hexes inventory needed (Phase 3 census). |
| Inline-style sweep (template.html) | **expensive** | 228 sites; rolls into PC-3 / PC-9 / PC-15 migrations cumulatively. |
| Token taxonomy formalization | **cheap** | This catalog. |
| Unused-token cleanup | **cheap** | Phase 3 census + delete; small payoff. |

---

## Issue #54 fold — modal a11y normative form (canonical-form deliverable)

Issue #54's acceptance criteria are integrated into PC-1 above. Mapping table:

| #54 acceptance criterion | PC-1 audit checklist line |
|---|---|
| Every modal has `role="dialog"`, `aria-modal="true"`, `aria-labelledby` wired to titled `h3`/`h2` | PC-1.7 lines 2, 3 |
| iOS VoiceOver announces "Tag milestones, dialog" | PC-1.7 line 11 |
| TalkBack announces dialog role on Android | PC-1.7 line 12 |
| No focus escapes modal while open | PC-1.7 lines 4, 5, 6 |
| Escape closes every modal | PC-1.7 line 6 |
| `prefers-reduced-motion` interaction unchanged | PC-1.7 line 10 |

**When Phase 3 contract lands** with rules derived from PC-1, **issue #54 closes** with a forward-link to the catalog entry + the contract enforcement clause. Phase 4 PR-ε.0 conformance check verifies the picker modal lands canonical.

---

## Issue #57 fold — escAttr call-site census (deliverable)

Per #57: "Do not land this fix before Phase 2 completes" — Phase 2 produces the **call-site census**; the fix is downstream.

### Census summary

| File | Call sites | Function-name landmarks |
|---|---|---|
| `core.js` | 1 (+1 definition at `:2304`) | `_noteVoiceLabel` input value (`:1931`) |
| `home.js` | 31 | vacc-card render (`:501, 508, 509, 518, 519, 545, 555, 567, 899`); growth render; medication render |
| `intelligence.js` | 30 | feverEpisode (`:7196`); diarrhoeaEpisode (`:7944`); vomitingEpisode (`:8412`); coldEpisode (`:8663, 8693`); nutrient heatmap (`:14958, 14962`); nutrient-pair badge (`:15219`); CT chips (`:16822, 16833, 17064, 17079, 17250, 17258, 17274, 17275, 17372, 17378, 17396, 17400, 17404, 17406, 17407, 17525, 17532`) |
| `medical.js` | 15 | vacc-pill render (`:2624, 2629, 2637`); vacc-mark-done (`:2792, 2793`); plus 10 additional sites |
| `diet.js` | 0 | — |
| **Total** | **77 active + 1 def = 78** | All four files house attribute-context `escAttr` use |

### Class breakdown (Phase 3 input for #57's call-site audit acceptance criterion)

**Class A — safe under current escAttr semantics:** call sites where the user-text input is constrained to ASCII-printable without apostrophes (e.g. category enum keys, slug-id strings, date-key strings, JSON-stringified arrays of slug-IDs). The `'` → `\\'` mis-escape is a no-op because the input has no `'`.

| Anchor sample | Why Class A |
|---|---|
| `home.js:501` (`escAttr(JSON.stringify(names))`) | `names` is `[a-z0-9 -]+` vaccination labels; no apostrophes. |
| `home.js:545, 555` (`escAttr(upcoming.name)`) | Vacc names are controlled vocabulary. |
| `intelligence.js:7196, 7944, 8412, 8693` (`escAttr(a)`) | `a` is action-key enum; ASCII. |
| `intelligence.js:14958, 14962` (`escAttr(n.key)`, `escAttr(data.days[dayIdx])`) | Nutrient key + ISO date string. |
| `medical.js:2624, 2629` (`escAttr(upcoming.name)`) | Vacc names; controlled. |

**Class B — at risk under current escAttr semantics:** call sites where user-text input may contain apostrophes, ampersands, or entity references (custom milestone text, scrapbook titles, doctor names, food names with grammatical apostrophes like "Ann's", note text, CT incident titles).

| Anchor sample | Why Class B |
|---|---|
| `core.js:1931` (`escAttr(_noteVoiceLabel)`) | Note voice label — free-text user input; apostrophes possible. |
| `intelligence.js:8663` (`escAttr(s)` for symptom toggle `data-arg`) | Symptom strings are controlled today; verify if extensible. |
| `intelligence.js:14958, 14962` (`escAttr(foods.join(', '))` in `title="..."`) | Food names — could include `'` (e.g. "shepherd's pie") and `&` (e.g. "fish & chips"); the `title` attribute interpolation is double-quoted, so `'` arm is a no-op for parse correctness, but `&` arm is missing. |
| `intelligence.js:17064` (`escAttr(opt)` for CT answer chip `data-value`) | CT answer options — depends on template content; verify per-template. |
| `intelligence.js:17078, 17079` (`escAttr(t.id)` for `data-id`) | `t.id` is UUID or `id-{base36}` — Class A by construction; double-listing here flags a verification site. |
| `intelligence.js:17250` (`escAttr(doc.phone)` for "Copy phone" chip `data-arg`) | Phone strings — usually ASCII-numeric; safe. |
| `medical.js:*` vacc-name sites | Same controlled vocabulary as home.js Class A. |

**Class C — relies on the JS-string-literal escape behavior** (the `\\'` arm is load-bearing):

| Anchor sample | Why Class C |
|---|---|
| (none identified in current grep) | The `'` arm produces `\\'` which is HTML-attribute-incorrect; no call site appears to consume `\\'` as a JS-literal escape. **Verification target for #57's "any site relying on the JS-literal `\'` behavior is migrated explicitly" acceptance criterion.** |

### Census conclusions for #57

1. **Class A predominates.** ~50 of 77 active sites are Class A (controlled-vocabulary inputs).
2. **Class B is the at-risk surface.** ~20-25 sites carry user-text or extensible vocabulary; the `&`-not-escaped gap is the dominant hazard, not the `'`-mis-escape.
3. **Class C is empirically empty in the current census.** No call site appears to consume the `\\'` JS-literal escape behavior. Path (a) of #57 (direct rewrite) is sound for all observed sites.
4. **PR-ε.0 v6.2 chip × `aria-label` double-wrap** (`escAttr(escHtml(labelText))`) — Class B; double-wrap is correct under both pre-#57 and post-#57 semantics. Post-#57 simplification to single-wrap (`escAttr(labelText)`) is a Phase-4-or-later cleanup decision.

**Recommendation forwarded to #57:** path (a) (direct rewrite) is preferred; the call-site audit acceptance criterion can be satisfied with a Class A / Class B / Class C tagged spreadsheet derived from this census. Phase 2 catalog entry stops at the census; the fix lands downstream.

---

## Migration cost map (ranked by intelligence-engine impact)

The intelligence-engine impact axis is carried forward from Phase 1 gap-report ranking. Phase 3 contract uses this map to set must-fix / should-fix / may-fix severities; impact rank is the input, not the output.

| Rank | Pattern × Migration | Cost | Phase 1 gap rank | Notes |
|---|---|---|---|---|
| 1 | PC-4 · `#qlToast` `aria-live` triplet + Undo `<button>` | **cheap** | 1 | Three attribute adds + one element swap; immediate AT win on 87 call-sites including PR-ε.0 v6.2 orphan-tag toasts. |
| 2 | PC-1 · Modal a11y triplet + Escape + focus trap (#54 fold) | **medium** | 2 | One-helper-edit shape; per-modal markup change is mechanical. ~15 surfaces. |
| 3 | PC-1 / PC-2 · `.ql-option <div>` → `<button role="menuitem">` (S-06 sheet) | **expensive** | 3 | Dispatcher rewiring + 6 element swaps + sheet's own `aria-modal="false"` + menu role. Phase 3 contract may sequence this behind PC-7 dispatcher consolidation. |
| 4 | PC-3 · Form-input idiom consolidation (4 → 1) | **medium** | 4 | CSS rule consolidation + ~50 input sites + HR-3 inline-handler sweep. |
| 5 | PC-5 · Empty-state idiom consolidation (3 → 1; 4th ships with PR-ε.0 v6.2) | **medium** | 5 | 13 sites; rule consolidation + per-site markup change. |
| 6 | PC-6 · Tab-bar a11y posture (3 implementations × `role="tablist"` + arrow-keys) | **medium** | 6 | Renderer change (Track sub-tab) + static markup change (top-level + Settings); global keydown handler. |
| 7 | PC-4 · Undo `<span>` → `<button>` | **cheap** | 7 | Already counted under rank 1. |
| 8 | PC-2 / Issue #57 · `escAttr` `&` gap + Phase-2 census + downstream fix | **medium** (fix); **cheap** (census) | 8 | Census deliverable lives in this catalog; fix is downstream of Phase 2 per #57. |
| 9 | PC-1 · Six overlay DOM families → three canonical | **medium** (per surface) × 4 surfaces (bug, crop, lightbox, sidebar element) | 9 | Each surface's migration is medium; aggregate is the long tail of overlay normalization. |
| 10 | PC-1 / PC-9 / PC-2 / PC-8 · Literal `&times;` × 14 + `×` × 1 + `+` × 1 + `▾` × 75 + `✓`/`⭐` glyphs in JS body (HR-1 sweep) | **medium** | 10 | The chevron migration (75 sites) dominates; close-glyph migration (14 + 1 + 1 = 16 sites) is the second-largest. Sprite addition is `cheap`; rolling-out is `medium`. |
| 11 | PC-3 / PC-7 · Inline `style=""` (228) + inline handlers (36) | **medium** (rolling) | 11 | Continues Phase 4 Polish-10's HR-3/HR-2 sweeps; migration cost spread across surface migrations. |
| 12 | PC-5 · Loading-state introduction (Firebase post-receive) | **medium** (when applied) | 12 | Phase 3 contract scopes which surfaces ship loading states; Phase 4 / downstream PRs land them. |

Phase 3 contract rule severities will likely set:
- **must-fix:** Ranks 1, 2 (PC-4 a11y, PC-1 modal a11y / #54). Direct AT impact + PR-ε.0 v6.2 surface dependency.
- **should-fix:** Ranks 3-7 (keyboard accessibility, form-input consolidation, empty-state consolidation, tab a11y).
- **may-fix:** Ranks 8-12 (cross-cutting cleanup, glyph migration, hygiene).

These are catalog suggestions; Phase 3 makes the call.

---

## Cross-cutting outputs feeding Phase 3

### Canonical-form library (the catalog)

10 pattern classes (PC-1..PC-10) × 6 fields each (canonical form / allowed variants / prohibited variants / rationale / audit checklist / migration cost). Phase 3 contract derives normative rules from each entry's "audit checklist" and severity-tags from the migration-cost map.

### Migration cost map (above)

12 ranked migrations across pattern classes. Phase 3 contract rule severities derive from the rank ordering.

### Token system audit (PC-10)

Existing taxonomy formalized; deferred-to-Phase-3 questions:
- Should domain-deep colors (`--{domain}-deep`) be canonical tokens or stay as raw hex in component CSS?
- Are `--input-focus` / `--input-glow` retained as component-tier tokens or deprecated?
- Token alias chain depth (`--foo: var(--bar)` chains) — what's the canonical max depth?
- Unused-token census — Phase 3 grep + delete pass.

### escAttr call-site census (issue #57 input)

77 active sites tabulated above (Class A predominates; Class B is the at-risk surface; Class C empirically empty). Recommendation: path (a) direct rewrite per #57.

---

## Notes for Cipher (Edict V cross-cut)

Targets I expect Cipher to challenge:

1. **Completeness against the brief's 10 pattern classes** — PC-1 through PC-10 cover the brief's enumerated list. Did I miss the close-glyph as a separate pattern class (Phase 1 captured it across PC-1 / PC-2 / PC-7 / PC-8 / PC-15)? My read: close-glyph is a sub-property of multiple patterns, not its own class. Cipher's call.

2. **Canonical-form precision for Phase 3 derivability** — does each PC-N's "canonical form" subsection give Phase 3 enough to write a one-paragraph rule per pattern? Or does Phase 3 need to ask Phase 2 for refinement (which would be Phase 2 polish)? The rule-derivability target is: "given PC-1.1's canonical form, write a Phase 3 rule that lints `<div role='dialog'>` as canonical and `<div>` (no role) as non-canonical."

3. **Migration-cost calibration** — `cheap` / `medium` / `expensive` is the Phase 3 contract's input for must-fix / should-fix / may-fix severities. Did I rank the 12 migrations correctly against intelligence-engine impact? Cipher cross-cut should challenge the rank order, not the cost labels (cost labels are mechanical; rank order is judgment).

4. **Issue #57 census sufficiency** — Class A / B / C tagging is the deliverable for #57's call-site-audit acceptance criterion. Cipher should challenge the boundary: am I correctly classifying `intelligence.js:14958–14962` (food-name title attribute) as Class B? Is `JSON.stringify(names)` followed by `escAttr(...)` followed by interpolation into a single-quoted attribute (`home.js:501, 567`) correctly Class A given the JSON-doesn't-contain-bare-apostrophes invariant?

5. **Issue #54 fold mapping** — does PC-1.7's audit checklist exhaustively cover #54's acceptance criteria? My mapping table claims yes; Cipher verifies the inverse (no #54 criterion is missed).

6. **Phase-2 scope discipline** — did I stay prescriptive without proposing fixes? PC-3.6 / PC-9.6 / PC-10.6 migration-cost tables describe cost-of-bringing-inline, which is borderline-prescriptive. The brief explicitly asks for migration cost ("for each existing surface that diverges, rough cost to bring inline"); compliant. Cipher: confirm the line.

7. **Cross-cutting: PC-7 dispatcher consolidation `expensive` cost** — is this a Phase 2 catalog rule, or a Phase 3 contract decision? My read: Phase 2 catalogs the canonical-form (one dispatcher, table-indirected); Phase 3 sets the must-fix/should-fix severity given the cost. Cipher should challenge if the `_ACTION_HANDLERS` table indirection itself is over-prescriptive for a Phase 2 catalog (could leave the indirection question to Phase 3).

8. **Phase 1 cross-link discipline** — every PC-N entry references S-NN entries from Phase 1. Cipher: confirm coverage; flag any S-NN that has a pattern Phase 2 doesn't catalog (would require Phase 1 polish PR per the brief's "if Phase 1 missed one" clause).

9. **PR-ε.0 v6.2 §4 vs Phase 2 catalog inheritance** — the chip × site (S-17) is canonical-form-aligned; PC-2 Subclass C is generalized from §4. Cipher: confirm Phase 4 conformance check has a single referent (PC-2.1 Subclass C); confirm the catalog doesn't re-litigate v6.2 audit decisions.

10. **#57 census scope** — Class C is empirically empty per my grep. Cipher: re-grep independently and confirm. If Cipher finds a Class C site, the census is incomplete and Phase 2 needs polish.
