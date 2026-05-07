# SproutLab — Surface Inventory (Phase 1 of design grounding)

**Author:** Maren (Care/UX Governor)
**Status:** Draft (Phase 1 of 4 — descriptive only; Phase 2 Cipher+Maren codifies canonical form, Phase 3 Cipher+Lyra writes the contract, Phase 4 Aurelius runs PR #52 conformance)
**Audit base:** `eecc994c855758cd861805e78f42ebefadfe6c59` — `main` HEAD as of capture (PR-ε.0 v6.2 spec is on PR #52 branch `claude/v5-audit-governors-18GCZ`; not yet on main)
**Brief:** PR #52 [comment #4395444408](https://github.com/Rishabh1804/sproutlab/pull/52#issuecomment-4395444408) — Aurelius
**Scope:** Descriptive — what exists, where surfaces diverge from peers, where edge states are missing. **No fixes proposed.** Modal a11y observations capture into "inconsistencies/gaps" only; Phase 2 folds issue [#54](https://github.com/Rishabh1804/sproutlab/issues/54).

---

## Line-drift caveat (carry-forward from v6.2 pseudocode footer)

Every line range in this document is anchored to the audit-base SHA above. Per [issue #55](https://github.com/Rishabh1804/sproutlab/issues/55), `CLAUDE.md`'s line counts for `sync.js` / `medical.js` / `core.js` already drift +1,002 / +134 / +127 against this base; the raw split files do not, but downstream PRs landing during Phase 2/3 will. **Resolve by function name when the line numbers don't match** — the function names below are stable identifiers; the file:line references are starting points.

| File | Lines @ audit-base | Notes |
|---|---|---|
| `split/template.html` | 2907 | DOM shell, sprite, modals, sidebar, overlays |
| `split/styles.css` | 8954 | All CSS; tokens, components, theming |
| `split/config.js` | 13 | Firebase only (PR-ε.0 v6.2 §0a will add `slugify`) |
| `split/data.js` | 3561 | Constants, `DEFAULT_MILESTONES` (line ~1468) |
| `split/core.js` | 4969 | Utilities, dispatcher, `escHtml`/`escAttr`, modal helpers, `switchTab`, `addScrapEntry` |
| `split/home.js` | 9415 | Home tab + History sub-renderers |
| `split/diet.js` | 4087 | Diet tab + UIB |
| `split/medical.js` | 9493 | Medical sub-tab + CareTickets |
| `split/intelligence.js` | 18139 | ISL, Smart Q&A, Quick Log (`showQLToast` ~line 10758), CareTickets UI |
| `split/sync.js` | 2054 | Auth + Firestore + offline-badge driver |
| `split/start.js` | 19 | Init bootstrap |

---

## Surface taxonomy (high-level map)

SproutLab's **user-visible** tab order differs from JS module concat order. The brief's `home → diet → medical → intelligence → sync → start` describes the **load order** (concat-critical for §0a/§0b primitives); the **navigation** order in the tab bar is `home → growth → track → insights → history → info`, with `track` containing five sub-tabs that backfill into `medical.js` / `diet.js` / `intelligence.js` / `home.js`. Capturing both axes since pattern divergence happens along both.

### Tier 1 — Top-level tabs (`.tab-panel`, 6)

| Tab | Anchor (template.html) | Renderer module | Sub-tabs |
|---|---|---|---|
| Home | `#tab-home` ~161 | home.js | — |
| Growth | `#tab-growth` ~439 | home.js (`renderGrowthStats`, `drawChart`) | — |
| Track | `#tab-track` ~537 | core.js (`switchTrackSub`); shell only — sub-panels render outside `#tab-track` | 5 (see Tier 2) |
| Insights | `#tab-insights` ~1403 | intelligence.js + home.js | — |
| History | `#tab-history` ~841 | home.js (`render*History`) + core.js (Notes, Scrapbook) | — |
| Info | `#tab-info` ~1500 | intelligence.js | — |

### Tier 2 — Track sub-panels (`.track-sub-panel`, 5)

`TRACK_SUB_ORDER = ['diet','sleep','poop','medical','milestones']` (`core.js:2627`). Sub-bar renders dynamically into `#trackSubBar`. All five sub-panels are siblings of `#tab-track` (not children) — they are activated when the Track tab is active AND the matching sub key is set.

| Sub-tab | Anchor | Renderer | Notes |
|---|---|---|---|
| Diet | `#tab-diet` ~724 | diet.js | Meal log forms, food intelligence, UIB |
| Sleep | `#tab-sleep` ~1129 | home.js (sleep block) | Quick log + history |
| Poop | `#tab-poop` ~1274 | home.js (poop block) | Log + diapers |
| Medical | `#tab-medical` ~548 | medical.js | Vacc, fever/diarrhoea/vomiting/cold episodes, CareTickets |
| Milestones | `#tab-milestones` ~1046 | home.js + intelligence.js (`recentEvidenceFeed` shell) | Milestone tracking; Recent Evidence Feed surface (PR-β rolled-up; PR-ε.0 v6.2 deepens via scrapbook backlinks) |

### Tier 3 — Persistent / cross-tab chrome

| Surface | Anchor | Render owner | Notes |
|---|---|---|---|
| Tab bar | `.tab-bar` ~105 | core.js (`switchTab`) | Bottom-nav style; six buttons + Settings sidebar trigger |
| Header (full / compact) | `#headerFull` ~133 | home.js (`renderHome`) | Full only on Home; collapsed elsewhere |
| Status strip / sync indicator | `#syncStatus` ~78, `#syncActivity` ~91, `#updateToast` ~98 | sync.js | Header-adjacent; live regions present |
| Offline badge (persistent) | `#offlineBadge` ~154 | sync.js (`syncRenderOfflineBadge` ~`sync.js:1999`) | `role="status" aria-live="polite"`; reload button conditionally surfaced in halted state |
| Smart Q&A | `#smartQAContainer` ~311 (inside Home) | intelligence.js | Free-text query bar + chip suggestions |
| Quick Log FAB | `#qlFab` ~2142 | intelligence.js (`toggleQuickLog`) | Bottom-centre fixed; literal `+` glyph (see HR-1 gap below) |
| Quick Log bottom sheet | `#qlSheet` ~2146 | intelligence.js | Six options: Feed / Sleep / Nap / Poop / Backfill / Activity |
| Quick Log toast | `#qlToast` ~2377 | intelligence.js (`showQLToast` ~`intelligence.js:10758`) | Singleton; optional Undo affordance |
| Settings sidebar | `#settingsSidebar` ~2438 | core.js + sync.js panes | Right-drawer pattern; 4 panes (General / Display / Data / Recovery); always-visible Sync card on top |
| Welcome Guide | `#welcomeGuide` ~165 (inside Home) | core.js (`maybeShowWelcomeGuide` ~`core.js:3693`) | First-open dismissable hero card |
| App version readout | `#appVersion` ~2674 (inside Settings) | core.js | `role="status"` |

### Tier 4 — Modals and overlays (six distinct DOM families)

This is where pattern divergence is densest. Six families coexist; only family A is what the brief and v6.2 spec call "the modal pattern":

| Family | Class root | Open helper | Close path | Backdrop | Instances |
|---|---|---|---|---|---|
| **A. `.modal-overlay > .modal`** | `.modal-overlay` | `openModal(id)` (`core.js:3041`); `history.pushState({overlay:id})` | backdrop click + popstate; **no Esc handler** | yes | 10 (see below) |
| **B. `.ql-modal-overlay > .ql-modal`** | `.ql-modal-overlay` | direct `data-quick-modal="<key>"` dispatch (`core.js:395`) | `.ql-modal-close` glyph button (literal `&times;`) + backdrop click via `closeQuickModalSelf` | yes | 5 (feed/sleep/nap/poop/activity) |
| **C. `.ql-sheet-overlay + .ql-sheet`** | `.ql-sheet` | `toggleQuickLog` | backdrop overlay click | yes | 1 (`#qlSheet`) |
| **D. `.bug-overlay > .bug-card`** | `.bug-overlay` | `openBugReporter` | `.bug-close` glyph button + backdrop via `closeBugReporterSelf` | yes | 1 (`#bugOverlay`) |
| **E. `.crop-overlay`** | `.crop-overlay` | `openCrop` | `Cancel` / `Save` buttons in `.crop-btns` | no backdrop click | 1 (`#cropOverlay`) |
| **F. `.avatar-lightbox`** | `.avatar-lightbox` | `openAvatarLightbox` | `closeAvatarSelf` (backdrop click) | yes | 1 (`#avatarLightbox`) |
| (G.) **Sidebar — drawer not modal** | `.sidebar` + `.sidebar-overlay` | `toggleSettingsSidebar` | `.sidebar-close` glyph + backdrop | yes | 1 (`#settingsSidebar`) |

Family A — the canonical `.modal-overlay > .modal` instances (PR-ε.0 v6.2 will add an 11th: `#scrapMilestonePickerModal`):

| `id` | template line | Trigger | Save action | Status |
|---|---|---|---|---|
| `growthModal` | 2704 | data-action `openModal` (`growth*`) | `addGrowth` / `saveGrowthEntry` | live |
| `vaccModal` | 2739 | `openModal` | `addVacc` (line 2751) | live |
| `vaccApptModal` | 2757 | `openModal` | confirm appointment | live |
| `vaccEditModal` | 2777 | `openModal` | save edited vacc | live |
| `vaccReactionModal` | 2799 | reaction guidance | informational only (no Save) | live |
| `foodCatModal` | 2806 | category picker | inline-styled `style="max-width:460px;padding:20px 22px 24px;"` (HR-2 leak inside the modal shell) | live |
| `medModal` | 2817 | `openModal` | save medication | live |
| `milestoneModal` | 2837 | `openModal` | `addMilestone` (line 2854) | live |
| `doctorModal` | 2859 | `openModal` | save doctor contact | live |
| `eventModal` | 2879 | `openModal` | save calendar event | live |
| **`scrapMilestonePickerModal`** | n/a (PR-ε.0 v6.2 §4) | `openScrapMilestonePicker` | `confirmScrapMilestonePicker` / `cancelScrapMilestonePicker` | **forthcoming** — PR-ε.0 v6.2 §4 / pseudocode `§4.B` |

> **Phase-2 deferral note (re: Cipher cross-cut finding 5):** The table above gives the Family-A modal census + the universal modal-a11y gap (issue #54 raw data). Per-modal divergences *beyond* the universal a11y gap — e.g. `vaccReactionModal` ships with no Save button (informational-only); `foodCatModal` (`template.html:2807`) carries inline `style="max-width:460px;padding:20px 22px 24px;"` on the `.modal` shell (HR-2 leak); `vaccReactionModal` extends sizing via `.vc-reaction-modal`, parallel to PR-ε.0 v6.2's `.scrap-picker-modal` size-extension idiom — are surfaced where they appear in S-08, but **not exhaustively per-modal**. Phase 1 is descriptive; Phase 2 catalog work has the normative authority to revisit each pattern with per-modal divergence detail folded into the issue #54 modal-a11y uplift. Capturing per-modal exhaustively in Phase 1 would be busy-work that Phase 2 redoes anyway.

---

## Per-surface entries

The capture template (per Aurelius's brief): **(1) Purpose · (2) Source anchor · (3) Interaction patterns used · (4) Tokens referenced · (5) Edge states · (6) Focus + keyboard model · (7) Motion behavior · (8) A11y posture · (9) Inconsistencies vs peer surfaces · (10) Gaps.**

I only repeat the full ten fields where the surface introduces meaningful divergence. For surfaces that conform to a peer surface's pattern, I cross-reference and note delta.

---

### S-01 · Tab bar (bottom navigation)

1. **Purpose** — Top-level wayfinding between the six tabs.
2. **Source anchor** — `template.html:105–127` (`.tab-bar` + `.tab-btn × 6` + `.tab-save-btn`); behavior `core.js:142–143` (delegated click), `core.js:2668–2710` (`switchTab`).
3. **Interaction patterns** — Click-to-switch. Swipe between tabs is opt-in (Settings → General → "Swipe between tabs" toggle, `template.html:2509`). `localStorage.setItem('ziva_active_tab', name)` persists last tab; on boot `core.js:976` restores. Many `data-tab="<key>"` deep-links from cards/pills route through the same dispatcher (`core.js:142`); some target the visible tabs, others target Track sub-keys (e.g. `data-tab="diet"` → switches to Track and then to the diet sub-tab). The two namespaces overlap in `core.js:2674`.
4. **Tokens** — `--rose` focus outline (global rule `styles.css:152–154`), unspecified bar background (verify in Phase 2). `min-height: 36px` global rule covers `.tab-btn` (`styles.css:155–156`) but does not match the WCAG 2.5.5 44×44 target affirmed elsewhere.
5. **Edge states** — Persisted tab missing or invalid: falls through `TAB_ORDER.includes(savedTab)` check (`core.js:976`) and silently defaults. No visible loading state during the renderer dispatch inside `switchTab` (e.g. `renderInsights()`); each renderer manages its own.
6. **Focus + keyboard model** — Buttons are natively focusable. **No arrow-key navigation** between tab buttons. Tab moves through them linearly. Enter/Space activates the focused button (browser default). `aria-label="<Name> tab"` is set per-button.
7. **Motion** — Tab content swap uses CSS `display: none/active` toggle on `.tab-panel`; no transition on the panel swap itself. Swipe gesture in `core.js:2870` uses raw `touchend` math (no easing token).
8. **A11y posture** — `aria-label` per tab; **no `role="tablist" / role="tab" / aria-selected"` on the tab bar**. Active state is tracked only by `.active` class on the button.
9. **Inconsistencies vs peer surfaces** — `data-tab` overload (top-level + Track sub-key) means the dispatcher resolves the same attribute against two namespaces (`core.js:2674`). Sub-tabs (`switchTrackSub`, see S-02) re-use a parallel pattern with its own `.track-sub-bar` + `.track-sub-btn` classes — close to but not identical to `.tab-btn`.
10. **Gaps** — No ARIA tablist semantics (Nielsen #4 consistency, WCAG 4.1.2). No focus-visible test in current spec checklist for tab bar specifically. No keyboard arrow nav.

---

### S-02 · Track sub-tab bar

1. **Purpose** — Secondary wayfinding between the five Track sub-panels.
2. **Source anchor** — `template.html:542` (`#trackSubBar` shell); rendered by `renderTrackSubBar` in `core.js:2738–2760`. `TRACK_SUB_ORDER` `core.js:2627`.
3. **Interaction patterns** — Click-to-switch via `data-action="switchTrackSub"` (`core.js:417`). Swipe between sub-tabs uses the same `_activeTrackSub` cursor (`core.js:2876–2891`). Persistence: `localStorage.setItem('ziva_track_sub', sub)` (`core.js:2715`).
4. **Tokens** — Same global focus rule as S-01.
5. **Edge states** — Invalid sub key: falls back to `'diet'` (`core.js:2713`).
6. **Focus + keyboard model** — Same as S-01 (Tab moves linearly; no arrow keys).
7. **Motion** — Sub-panel swap via `.active` class toggle; no transition.
8. **A11y posture** — Labels via inner text only; **no `aria-label` per button**, **no `role="tablist"`**.
9. **Inconsistencies vs peer surfaces** — Two parallel tab-bar implementations (`.tab-btn` for top-level, `.track-sub-btn` for sub) with similar but non-identical markup, classes, and a11y posture.
10. **Gaps** — No `aria-selected` semantics. No keyboard arrow nav. No `aria-label`.

---

### S-03 · Header (full / compact)

1. **Purpose** — Avatar + greeting + date/weather + (formerly) sync status.
2. **Source anchor** — `template.html:133–151` (`#headerFull`); compact-on-non-Home toggled by `core.js:2700` (`fullHeader.style.display = name === 'home' ? '' : 'none'`).
3. **Interaction patterns** — Avatar tap → `openAvatarLightbox` (F family); Edit affordance opens file picker. `localStorage`-backed avatar.
4. **Tokens** — Standard header layout tokens; `--rose` accent on edit pill.
5. **Edge states** — No avatar yet: `zi-sprout` placeholder. Loading sub-text reads "Loading..." statically until first `renderHome` finishes; no indeterminate state.
6. **Focus + keyboard model** — Avatar tile is focusable via wrapping `data-action`; Edit pill is a separate focusable element.
7. **Motion** — None on the header itself.
8. **A11y posture** — `aria-hidden="true"` on decorative icons inside; greeting `<h1>`.
9. **Inconsistencies vs peer surfaces** — Comment at `template.html:148–149` notes `#syncStatus` was relocated to `#statusStrip` above tab-bar (Phase 2 PR-2.5) — header now references this only via comment, but the relocated element doesn't appear in the `#headerFull` block. (Verify in Phase 2 — possibly a stale comment.)
10. **Gaps** — `<h1>` always reads "Hello, Ziva" — no semantic difference between Home (full chrome) and other tabs (compact). Loading sub-text never auto-clears if `renderHome` errors silently.

---

### S-04 · Status strip (sync indicator + activity + update toast)

1. **Purpose** — Persistent, header-adjacent indicator of Firebase sync state and version-update availability.
2. **Source anchor** — `template.html:78` (`#syncStatus`), `:91` (`#syncActivity`), `:98` (`#updateToast`); driver `sync.js:1726`, `sync.js:1816+` (state machine), `sync.js:1891+` (state computation).
3. **Interaction patterns** — `#syncStatus` is a button (focusable); tap opens settings or shows status detail. `#updateToast` has `data-action="syncReload"` to apply a service-worker update.
4. **Tokens** — `--tc-sky` for connected; `--tc-danger` for offline/halted; sync.js has dedicated focus-visible rule (`styles.css:8869`).
5. **Edge states** — `connecting` / `online` / `syncing` / `offline` / `halted` (`sync.js:1816+`). `offlineBadge` (S-05) handles the worse end of the spectrum. `connecting` precedes `offline` per `sync.js:1898`.
6. **Focus + keyboard model** — Native button; focus ring via `.sync-indicator:focus-visible`.
7. **Motion** — `#syncActivity` likely pulses on writes (verify in Phase 2 by inspecting `.sync-activity` rule).
8. **A11y posture** — Best in the app: `aria-live="polite" aria-atomic="true"` on all three; `role="status"` on `syncActivity` + `updateToast`.
9. **Inconsistencies vs peer surfaces** — Has the most rigorous live-region posture in the app. Most other surfaces have none.
10. **Gaps** — Copy not yet captured here verbatim — Phase 2 should diff against the offline-badge copy for unified voice.

---

### S-05 · Offline / halted persistent badge

1. **Purpose** — Below-header surface that stays visible when network connectivity or the sync circuit is degraded.
2. **Source anchor** — `template.html:154–158`; `sync.js:1999` (`syncRenderOfflineBadge`).
3. **Interaction patterns** — Read-only most of the time. Reload button `data-action="syncReload"` surfaces only in halted state (`sync.js:2022`).
4. **Tokens** — `--tc-danger` family; `--ease-fast` for state transitions.
5. **Edge states** — Visible only in `offline` or `halted` states (`sync.js:2004`). Hidden in connected/syncing/connecting via `[hidden]`.
6. **Focus + keyboard model** — Reload button is natively focusable; dedicated `.offline-badge__action:focus-visible` rule (`styles.css:8946–8950`).
7. **Motion** — Fade/slide via `.offline-badge` rule; respects global `prefers-reduced-motion` reset.
8. **A11y posture** — `role="status" aria-live="polite" aria-atomic="true"`; `aria-hidden="true"` on decorative icon.
9. **Inconsistencies vs peer surfaces** — Has its own dedicated focus-visible rule (`styles.css:8946`) — duplicates the global rule (`styles.css:152`) at a different specificity. Phase 2: confirm intentional or token-up.
10. **Gaps** — None glaring. This is the closest to canonical-form a surface gets in the app today.

---

### S-06 · Quick Log FAB + bottom sheet (`.ql-sheet`)

1. **Purpose** — Fast-path data entry from any tab — Feed / Sleep / Nap / Poop / Backfill / Activity.
2. **Source anchor** — `template.html:2142` (`#qlFab`), `:2145–2178` (`#qlSheet`); `intelligence.js:9225–9374` (open/close).
3. **Interaction patterns** — FAB tap → bottom sheet slides up; option tap → opens corresponding `.ql-modal-overlay` (S-07).
4. **Tokens** — Bottom-sheet pattern (verify token list in Phase 2; uses raw `--sp-*`).
5. **Edge states** — Sheet open during tab change: `closeQuickLogAll` (`intelligence.js:9374`) is called from several entry points; verify exhaustiveness in Phase 2.
6. **Focus + keyboard model** — FAB is a `<button>`. **No focus trap** when sheet opens; **no Esc-to-close** (only backdrop click / FAB toggle / option tap). On close, focus does not return to the FAB explicitly.
7. **Motion** — Slide-up transition; respects global `prefers-reduced-motion` reset (`styles.css:3902`).
8. **A11y posture** — `aria-label="Quick log"` on FAB. **No `role="dialog"` on the sheet.** No `aria-expanded` toggling on the FAB. The sheet's options are `<div>`s (`template.html:2150–2177`), not `<button>`s — they are wired through `data-quick-modal` rather than `data-action`. (Likely focusable only because the dispatcher wires click; tab-order coverage uncertain — verify in Phase 2.)
9. **Inconsistencies vs peer surfaces** — Sheet is its own DOM family (Family C above) — neither `.modal-overlay` nor `.ql-modal-overlay`. The `.ql-option` items are `<div>` not `<button>`, breaking the convention used everywhere else for chip-like selectables (Picker uses `<button role="checkbox">` per v6.2 spec; food-safety chips use `<span class="chip">`; CT chips also `<span class="chip">`). FAB's literal `+` (`template.html:2142`) is the same pattern PR-ε.0 §7.1 forbids for `×` — see HR-1 gap.
10. **Gaps** — Probable keyboard-accessibility regression on `.ql-option` `<div>`s. No focus trap. No Esc-to-close. No `role="dialog"`. `+` glyph contradicts HR-1.

---

### S-07 · Quick Log modals (`.ql-modal-overlay`, 5)

1. **Purpose** — Per-domain quick-log forms (feed / sleep / nap / poop / activity).
2. **Source anchor** — `template.html:2179–2376`. Five instances at `:2179, :2234, :2268, :2294, :2334`.
3. **Interaction patterns** — Open from S-06 sheet. Each has `.ql-modal-header` with `.ql-modal-close` glyph button. Save dispatches `data-action="<saveFn>"` (e.g. `qlSaveFeed`, `qlSaveSleep`).
4. **Tokens** — `.form-input` class (`styles.css:4320`), `.input-ctx-<color>` modifier classes.
5. **Edge states** — `qlBackfillWrap` / `qlFreqWrap` / `qlSameAsWrap` are conditionally shown via `style="display:none;"` inline; reveal logic in `intelligence.js`.
6. **Focus + keyboard model** — No focus trap. No Esc handler. Close glyph button has no `aria-label`.
7. **Motion** — Backdrop fade + modal slide-up; respects `prefers-reduced-motion`.
8. **A11y posture** — **No `role="dialog"`**, **no `aria-modal`**, **no `aria-labelledby`**. Close glyphs are literal `&times;` characters.
9. **Inconsistencies vs peer surfaces** — Parallel-but-not-identical to Family A (`.modal-overlay > .modal`). Family A has no inline close glyph; Family B does (and uses `&times;`). Inputs use `.form-input` (`styles.css:4320`) not `.modal-input` (`styles.css:1875`) — two parallel form-input classes with different focus rings (`.form-input:focus` uses `--input-focus, --rose` + `--input-glow, --rose-light`; `.modal-input:focus` uses bare `--rose`).
10. **Gaps** — Same modal-a11y gaps as Family A (issue #54). Plus literal `×` glyphs on close buttons (HR-1 by the same logic that forbids the chip × — addressed for the milestone chip in PR-ε.0 §7.1). Plus inline `style="display:none;"` for conditional sub-rows (HR-2).

---

### S-08 · Modals — Family A (`.modal-overlay > .modal`, 10 + 1 forthcoming)

1. **Purpose** — Form-bearing modals for full-record entries: Growth, Vacc (4 variants), FoodCat, Med, Milestone, Doctor, Event. PR-ε.0 v6.2 adds `scrapMilestonePickerModal` (chip-picker) as #11.
2. **Source anchor** — `template.html:2704–2900` (10 instances; line table above). Helpers `core.js:3041–3045` (`openModal` / `closeModal`); backdrop click `core.js:3048–3052`; popstate close `core.js:3056+`.
3. **Interaction patterns** — `openModal(id)` pushes `history.state.overlay = id`; closing pops state. Backdrop click closes via `closeModal` + `history.back()` only when `history.state?.overlay` is set (`core.js:3050`). Save action wired to a per-modal `data-action`. Inputs use `.modal-input`.
4. **Tokens** — `.modal` styles `styles.css:1860–1883`; `.modal-input` `:1875–1883` with `1.5px solid var(--rose-light)` and `:focus` `border-color: var(--rose)`. `.modal-btns` row at the bottom for primary/secondary actions.
5. **Edge states** — Backdrop-click-while-no-pushstate is a no-op for `history.back()` (handled). No "leaving with unsaved changes" prompt. Save buttons toggle `disabled-state` via `activateBtn(id, value)` style helpers and inline `oninput=` handlers (e.g. `template.html:2743` `oninput="activateBtn('vaccSaveBtn',this.value.trim())"` — HR-3 violation).
6. **Focus + keyboard model** — No focus trap. **No Esc handler.** Close path is backdrop click or back-button (popstate). Save buttons don't auto-focus on open. Tab cycles outside the modal into the underlying page (verify in Phase 2 with a real device).
7. **Motion** — `.open` class toggle on `.modal-overlay` triggers fade/scale via existing `.modal-overlay.open` rule; `prefers-reduced-motion` global reset applies.
8. **A11y posture** — **No `role="dialog"`**, **no `aria-modal="true"`**, **no `aria-labelledby"`** on any of the 10 modals. **PR-ε.0 v6.2 inherits this gap intentionally** to avoid per-modal inconsistency, deferred to issue #54 (repo-wide pass).
9. **Inconsistencies vs peer surfaces** —
   - `foodCatModal` (`template.html:2807`) carries an inline `style="max-width:460px;padding:20px 22px 24px;"` on `.modal` — the only one that does. Pattern divergence; HR-2 leak.
   - `vaccReactionModal` uses a sub-class `.vc-reaction-modal` for sizing, parallel to PR-ε.0 v6.2's `.scrap-picker-modal` extension class — Phase 2 should codify the size-extension idiom.
   - Inputs use `.modal-input` (rose focus), but the inline scrapbook add-form (S-15) uses raw `style=""` inputs with rose styling — three competing form-input idioms in the same product.
10. **Gaps** — Universal modal-a11y gap (issue #54 — capture only, not propose). No focus trap. No Esc. No labelledby. `vaccReactionModal` has no Save button (informational only) — fine, but worth catching that not all Family A modals are forms; the picker modal (forthcoming) is in this informational-action middle-ground.

---

### S-09 · Bug reporter overlay (`.bug-overlay`)

1. **Purpose** — Triggered from error toasts / sync-halt / settings; lets the parent send context-rich bug report via WhatsApp or clipboard.
2. **Source anchor** — `template.html:2380–2436`; `core.js:4815` (`closeBugReporter`).
3. **Interaction patterns** — Backdrop click closes via `closeBugReporterSelf`; explicit close via `.bug-close` glyph (`&times;`). Two CTAs: WhatsApp / clipboard.
4. **Tokens** — Domain colors mixed (`zi-warn` in amber, `zi-link` for WhatsApp button). Verify Phase 2.
5. **Edge states** — Error context section (`#bugErrorSection`) shown via inline `style="display:none;"` (HR-2).
6. **Focus + keyboard model** — No focus trap. No Esc. Close glyph has `aria-label="Close"` (better than Family A close path).
7. **Motion** — Standard fade.
8. **A11y posture** — `aria-label="Close"` on the close button. **No `role="dialog"` / `aria-modal`** on the overlay.
9. **Inconsistencies vs peer surfaces** — Has `aria-label` on close glyph (better than Family B); has its own DOM family (Family D) with bespoke close-button class. The "Send via WhatsApp" / "Copy to Clipboard" CTAs are `.bug-btn` not `.btn` — parallel button taxonomy.
10. **Gaps** — Same modal-a11y gap. Literal `×` on close.

---

### S-10 · Crop overlay (`.crop-overlay`)

1. **Purpose** — Image crop UI for avatar / scrapbook photo.
2. **Source anchor** — `template.html:2688–2702`; `core.js:2555–2558` (`closeCrop`).
3. **Interaction patterns** — Pinch / drag / range-input zoom; `Cancel` / `Save` buttons in `.crop-btns`.
4. **Tokens** — Inline white text styled via `style="color:white;font-size:var(--fs-base);font-weight:600;..."` (HR-2 leak).
5. **Edge states** — None for crop failure.
6. **Focus + keyboard model** — `Cancel` / `Save` are buttons; no Esc / focus-trap.
7. **Motion** — None on the overlay open; image transforms via inline JS.
8. **A11y posture** — Decorative icons `aria-hidden`. **No `role="dialog"`** on the overlay.
9. **Inconsistencies vs peer surfaces** — Buttons are `.crop-cancel` / `.crop-save` — bespoke class names, not the standard `.btn .btn-ghost` / `.btn .btn-rose` idiom of Family A.
10. **Gaps** — Bespoke button class taxonomy. HR-2 inline styles. Modal-a11y gap.

---

### S-11 · Avatar lightbox (`.avatar-lightbox`)

1. **Purpose** — Display the full-resolution avatar.
2. **Source anchor** — `template.html:2677+`.
3. **Interaction patterns** — Backdrop click closes (`closeAvatarSelf`).
4. **Tokens / edge states / motion / a11y / divergence / gaps** — Same family-of-six divergence story; no `role="dialog"`. Capture as a confirmed instance of overlay-pattern proliferation. Phase 2 will catalog whether this should fold into Family A.

---

### S-12 · Settings sidebar (`.sidebar`, drawer)

1. **Purpose** — Right-drawer for Sync / Account, preferences (height unit, swipe, diet, ref-std, theme), data export/recovery.
2. **Source anchor** — `template.html:2437–2675`; opened via `toggleSettingsSidebar` (tab-save-btn at `:124`).
3. **Interaction patterns** — Drawer slides in from right; backdrop click + close glyph close. Sub-tabs (`General / Display / Data / Recovery`) toggled by `data-stab="<key>"` on `.settings-tab` buttons. Sync sub-card sits **above** the sub-tabs and is always visible (pre-sub-tab content).
4. **Tokens** — Drawer-specific tokens; preferences inputs are `<select>` with raw inline `style="padding:6px 10px;border-radius:var(--r-lg);border:1.5px solid var(--peach-light);..."` (HR-2; many lines: `template.html:2496, 2509, 2521, 2530`).
5. **Edge states** — Signed-out vs signed-in states differ in the Sync card: `template.html:2466–2477` shows the signed-out variant with "Sign in with Google" CTA; signed-in variant rendered by `sync.js`.
6. **Focus + keyboard model** — Close glyph focusable. No focus trap. No Esc. Sub-tab buttons are buttons (focusable); no `role="tablist"`.
7. **Motion** — Slide-in via CSS class toggle.
8. **A11y posture** — `aria-label="Close"` on close glyph. `role="status"` on `#appVersion`.
9. **Inconsistencies vs peer surfaces** — Inline-styled `<select>` elements deviate from `.modal-input` and `.form-input`. Sub-tab nav (`settings-tab`) is a third tab-bar implementation parallel to S-01 and S-02.
10. **Gaps** — Modal-equivalent a11y posture (no `role="dialog"` / `aria-modal` even though it visually behaves modally with backdrop). HR-2 inline styles on every preference `<select>`. HR-3 `onchange="..."` handlers (`template.html:2495, 2508, 2522`).

---

### S-13 · Quick Log toast (`#qlToast`)

1. **Purpose** — Single-track confirmation/info toast surface (with optional Undo).
2. **Source anchor** — `template.html:2377` (DOM); `intelligence.js:10758–10770` (`showQLToast`); call-site frequency: 64 in `intelligence.js`, 16 in `sync.js`, 4 in `core.js`, 2 in `medical.js`, 1 in `home.js`.
3. **Interaction patterns** — Auto-dismiss after `duration` (default 2000ms). Optional `undoFn` renders a "Undo" affordance. PR-ε.0 v6.2 §4 surfaces the same toast for orphan-tag drops at edit-load AND confirm-time (Maren v5+v6 audit).
4. **Tokens** — `.ql-toast` `styles.css:5741–5751`; dark-theme override at `:5751`.
5. **Edge states** — Single-slot — calling `showQLToast` while one is showing replaces the message but resets the duration. No queue. No persistent error variant.
6. **Focus + keyboard model** — Toast is a `<div>`, not focusable. Undo affordance is a `<span data-action="undoLastQL" ...>` — not a `<button>`, not natively focusable, no `role="button"` (HR-3 / a11y gap).
7. **Motion** — Translate-Y slide-in via `.show` class; respects `prefers-reduced-motion` global reset.
8. **A11y posture** — **No `aria-live`**, **no `role="status"`**, **no `aria-atomic`**. Screen readers do not get the toast announcement. Confirmed against template line 2377.
9. **Inconsistencies vs peer surfaces** — `#syncStatus` / `#syncActivity` / `#updateToast` all have full live-region posture (S-04). The single most-used toast in the app does not.
10. **Gaps** — **Critical** — toast announcements invisible to AT users. Inline-style on Undo span (`text-decoration:underline;font-weight:700;cursor:pointer;margin-left:8px`) at `intelligence.js:10762` (HR-2). Undo affordance is a `<span>` not a `<button>` — keyboard-inaccessible. Single-slot toast collides on rapid succession. PR-ε.0 v6.2 §4 confirm-time toast inherits all of these gaps.

---

### S-14 · Smart Q&A bar (`#smartQAContainer`)

1. **Purpose** — Free-text query bar for ISL on the Home tab.
2. **Source anchor** — `template.html:311–325` (inside Home); behavior `intelligence.js:2508` (`_qaHandleKeydown`) and surrounding ISL handlers.
3. **Interaction patterns** — Type-and-Enter; chip suggestions in `#qaChips` provide canned queries.
4. **Tokens** — `.qa-input` (separate class — third form-input idiom alongside `.modal-input` and `.form-input`).
5. **Edge states** — Loading: probably shows an indeterminate state via `iqPicker` / `qaModeIndicator` (verify Phase 2). No-result state lives in `qaAnswerContainer` content.
6. **Focus + keyboard model** — Native input. Clear button `&times;` glyph (`#qaClear`).
7. **Motion** — None on the bar itself.
8. **A11y posture** — `aria-label="Clear"` on `#qaClear`. Input itself has `placeholder="Ask about Ziva..."` but no `aria-label` (placeholder is not an accessible name).
9. **Inconsistencies vs peer surfaces** — Third form-input class (`.qa-input`); Clear glyph is `&times;` (HR-1 by the same chip-× logic). `inline style="padding:0 var(--sp-16);margin-top:var(--sp-12);"` on the wrapper (`template.html:311` — HR-2).
10. **Gaps** — No `aria-label` on input. Clear glyph is literal `&times;`.

---

### S-15 · Scrapbook add-memory inline form (History → Scrapbook card)

This is the form that PR-ε.0 v6.2 §4 augments with `<div class="scrap-form-row">` for the milestone chip picker.

1. **Purpose** — Add a scrapbook entry (photo + title + date + description); on PR-ε.0 v6.2 also linked milestones.
2. **Source anchor** — `template.html:1010–1037` (inside History tab's Scrapbook card). PR-ε.0 v6.2 §4 inserts the new `.scrap-form-row` block between `#scrapTitle` (`:1030`) and `#scrapDate` (`:1031`). `addScrapEntry` at `core.js:2192`; `editScrapEntry` at `core.js:2220` (PR-ε.0 v6.2 §4 wiring extends the seed-and-filter logic here — Maren v4 audit MAJOR + v6 confirm-time toast).
3. **Interaction patterns** — Disclosure pattern: photo input is the visible affordance; the form (`#scrapPreviewArea`) reveals after photo pick (`style="display:none;"` `:1023`). Save button → `addScrapEntry`. Edit cancel → `cancelScrapEdit` (hidden until edit).
4. **Tokens** — Almost entirely **inline-styled**: every input carries its own `style="width:100%;margin-top:8px;padding:8px 12px;border-radius:var(--r-lg);border:1.5px solid var(--rose-light);font-family:'Nunito',sans-serif;font-size:var(--fs-base);background:var(--blush);color:var(--text);outline:none;"` (HR-2 — six inputs, six near-identical inline blocks, `:1030–1034`). The remove-photo button is also inline-styled with literal `×` glyph (`:1029`).
5. **Edge states** — No empty state for "no scrapbook entries yet" (the empty-list copy lives in the rendered list at `core.js:2122`, not the add form). No loading state during save. No save-failure surface (errors silently `try/catch` somewhere — verify Phase 2).
6. **Focus + keyboard model** — Native inputs. No Esc handler (since this is inline, not a modal). Save button enabled by JS (no inline disabled-state logic visible here).
7. **Motion** — None.
8. **A11y posture** — Photo upload uses `<label>` wrapping `<input type="file">` — better than icon-only. Remove-photo button has `aria-label="Remove photo"` (good). Date input is bare — no `aria-label`, relying on placeholder.
9. **Inconsistencies vs peer surfaces** —
   - **The only mutating form in the app that is NOT a modal.** All other entry forms (growth, vacc, med, milestone, doctor, event) are Family A modals; quick-log forms are Family B modals; Notes (S-16) is the only peer to Scrapbook in the inline-disclosure idiom.
   - Inline-styled inputs vs `.modal-input` / `.form-input` peer classes — fourth form-input idiom in this surface alone.
   - Remove-photo button uses literal `×` glyph (HR-1 by same logic). PR-ε.0 v6.2 §7.1 adds `zi-close` for the new chip × but does NOT migrate this peer × — pattern proliferation continues.
10. **Gaps** — Heavy HR-2 / HR-3 / HR-1 debt. No save-failure surface. The wiring will become the carry-vehicle for the chip picker (PR-ε.0 v6.2 §4); whatever divergence we capture here propagates if Phase 3 doesn't normalize.

---

### S-16 · Notes inline form (History → Notes card)

1. **Purpose** — Free-text note + category + photo / voice attachment.
2. **Source anchor** — `template.html:980–1006` (inside History tab's Notes card).
3. **Interaction patterns** — Inline disclosure (collapse-body); category pills filter list above; category select inside the form picks the new note's category.
4. **Tokens** — Inline-styled `<select>` (`:991` — HR-2); attachment buttons inline-styled.
5. **Edge states** — Empty notes list copy at `core.js:2013`; supports per-category filter empty copy too.
6. **Focus + keyboard model** — Native inputs. Save button has `disabled-state` toggled via `oninput="updateNoteSaveBtn()"` (HR-3).
7. **Motion** — None.
8. **A11y posture** — Attachment `<label>`s have `aria-label` (good — `:1000, :1003`). Hidden inputs use `style="display:none;"` (HR-2).
9. **Inconsistencies vs peer surfaces** — Same disclosure pattern as Scrapbook (S-15) — peer. Save button uses `btn-peach`; Scrapbook uses `btn-rose` — domain-color choices diverge (Notes = peach for "warm accents"; Scrapbook = rose because rose is its existing icon color).
10. **Gaps** — `⭐ Milestone` literal-emoji in category select option text (`:986, :994`) — HR-1 violation. HR-2 inline styles. HR-3 inline handlers.

---

### S-17 · Milestone chip + scrap milestone picker (PR-ε.0 v6.2 — high-care)

This surface does not yet exist on `main`. It is the proof-of-concept for the design grounding workstream.

1. **Purpose** — Tag a scrapbook memory with one or more milestones (chip pattern + checkbox-list picker modal).
2. **Source anchor** — `template.html` (forthcoming insert between `:1030` and `:1031`); `core.js` (forthcoming `addScrapEntry` ↔ milestoneIds wiring at `:2192`); spec `docs/specs/lyra-pr-epsilon-0-foundation.md` v6.2 §4 (lines 527–737); pseudocode `docs/specs/lyra-pr-epsilon-0-pseudocode.md` v6.2 §4.A / §4.B / §4.C (lines 745–854 on the PR #52 branch).
3. **Interaction patterns** — Two-stage: chip-row + button-row inline form ("Tag a milestone"); modal picker (Family A) with category-grouped `<button role="checkbox">` rows. Confirm-time orphan toast (S-13).
4. **Tokens** — Lavender domain only (foundation §7.2): `--lavender`, `--lav-light`, `--surface-lav`, `--mid`, `--text`, `--rose-light` (input focus), `--card-bg`. `--ease-fast`. `zi-link` icon (existing). `zi-close` (added §7.1 — the only Phase-1-introduced sprite addition).
5. **Edge states** —
   - Empty milestone list (entire DB empty): picker shows `.picker-empty` with `zi-sprout` icon + warm copy.
   - Empty tags on entry: `.milestone-chips[data-empty="true"]` collapses to `min-height: 0`.
   - Orphan tag at edit-load: filtered out + toast fires (`editScrapEntry`).
   - Orphan tag at confirm-time: filtered + toast fires (Aurelius/Maren v6 fix on confirm flow).
6. **Focus + keyboard model** —
   - Chip × `<button>` is in tab order; `aria-label="Remove ${labelText} tag"` with `escAttr(escHtml(labelText))` double-wrap (Maren v5 audit MAJOR; v6 fix; Aurelius polish item 3 entity-reference fixture `&mama;` in §7.7).
   - Picker rows are `<button role="checkbox">` (the codebase's first use of this WAI-ARIA pattern — `<button>` not `<input>` because HR-2 forbids inline-style overrides for cross-browser native checkbox styling).
   - **Tab between rows; arrow keys do NOT** (Maren v4 audit MAJOR — corrected from v3 plan).
   - Modal Esc / focus trap / focus return — **NOT in v6.2 scope; deferred to issue #54** (Aurelius brief: capture, don't propose).
7. **Motion** — `.chip-x` background transition; `.picker-row` hover transition; `.picker-row-check` background transition — all `var(--ease-fast)`. `prefers-reduced-motion` confirmed in §7.7 checklist (Maren v5 audit MAJOR).
8. **A11y posture** —
   - Chip: `role="listitem"` (chip is in a `role="list"` container `#scrapMilestonePicker`); `data-empty="true"` for empty container.
   - Picker row: `role="checkbox" aria-checked="${...}"`; inner check glyph `aria-hidden="true"`.
   - **iOS VoiceOver real-device verification required pre-ship** (Maren v4 audit — first use of `role=checkbox` on `<button>`; iOS may append "double-tap to activate").
   - Modal itself: **inherits the universal Family A modal-a11y gap** (no `role="dialog"`, no `aria-modal`, no `aria-labelledby`) — issue #54 fold.
9. **Inconsistencies vs peer surfaces** —
   - First chip pattern in the app to ship a **per-chip remove control** (food-safety `.chip-safe/caution/avoid` are decorative; CT-* chips are action-bearing but use whole-chip click; QL-suggest chips switch suggestion). Phase 2 needs to decide whether the per-chip × is one of N canonical chip variants.
   - First chip-row pattern with `role="list"` container — peers use bare `<div>` containers.
   - First picker that uses `<button role="checkbox">` — Phase 2 must catalog this against e.g. `.note-cat-filter > .ncf-btn` (filter pills, `template.html:983–989`) and food-cat picker.
   - Picker close path: **no Esc handler** (modal-a11y gap inherited); confirm/cancel only.
10. **Gaps** — Modal-a11y gap (issue #54). iOS VoiceOver verification not yet performed at audit-base. The peer chip × in `#scrapPreviewArea` (`template.html:1029`) — the photo-remove button — is a literal `×` glyph; this PR does not migrate it. `escAttr` global gap: it does not escape `&` (only `'` `"`); the `escHtml(escAttr(text))` double-wrap is the v6 fix for the chip — peer surfaces using `escAttr` alone may have the same gap (verify Phase 2).

---

## Cross-surface pattern instances (feeding Phase 2 catalog)

### P-1 · Modal / overlay families (six DOM idioms)

Captured above (Tier 4 table). **Six distinct idioms.** Phase 2 catalog work needs to decide which fold and which stay distinct (FAB sheet is reasonably distinct; lightbox is a distinct gesture; bug reporter is product-distinct; crop is product-distinct). Family A and Family B (`.modal` vs `.ql-modal`) are the highest-frequency divergence — 10 + 5 instances of nearly-identical-but-not patterns. PR-ε.0 v6.2 adds an 11th Family-A instance.

### P-2 · Chip variants

| Variant | Source | Container | Click target | Notes |
|---|---|---|---|---|
| `.chip` (base) | `styles.css:3401` | varies | whole chip | base hover transform |
| `.chip-safe` / `.chip-caution` / `.chip-avoid` | `styles.css:3408–3413` | food-safety surfaces | whole chip | decorative + advisory |
| `.chip ct-entry-chip` / `.chip ct-banner-btn` / `.chip ct-template-chip` / `.chip ct-answer-chip` / `.chip ct-quick-clear` / `.chip ct-resolve-btn` / `.chip ct-reason-chip` | `styles.css:8062–8540`; `home.js:9243+`; `intelligence.js:16822+` | CareTickets surfaces | whole chip | action-bearing variants in CT lifecycle |
| `.chip-base chip-compact chip-${color}` | `intelligence.js:10504–10507` | QL suggestion row | whole chip | suggestion-switching variant |
| `.chip-milestone` (PR-ε.0 v6.2) | foundation §7.3 | scrap-form-row | label is non-clickable; inner × button is the only target | first per-chip remove control |
| `.note-cat-filter > .ncf-btn` | `template.html:983–989` | History/Notes | whole button | filter-pill peer to `.chip` but bespoke class |
| `.ql-meal-pill` / `.ql-intake-pill` / `.ql-bf-row` pills | `template.html:2188+` | QL-modal feed | whole pill | divs not buttons; HR-3 risk |

**Frequency snapshot:** `class="chip` appears in **26 first-class call-sites** across home.js / diet.js / intelligence.js + per-instance `ct-*` extensions (mixed `<div>` and `<span>` containers — pattern divergence in element choice alone). One inline `onclick=` at `diet.js:428` (HR-3 violation in the food-combo chip example).

### P-3 · Form-input idioms (four parallel)

| Idiom | Anchor | Focus ring | Border | Notes |
|---|---|---|---|---|
| `.modal-input` | `styles.css:1875` | `var(--rose)` | `1.5px solid var(--rose-light)` | Family A modals |
| `.form-input` | `styles.css:4320` | `var(--input-focus, --rose)` + `box-shadow` | `1.5px solid` (themed) | Family B modals + activity textarea |
| `.qa-input` | `styles.css` (qa-* group) | bespoke | bespoke | Smart Q&A only |
| inline-styled `<input>` / `<select>` / `<textarea>` | `template.html` x36+ sites | bespoke per call | inline | Scrapbook, Notes, Settings, Diet (combo input, food input, symptom input), History sub-cards |

### P-4 · Toast idioms

| Idiom | Anchor | A11y | Notes |
|---|---|---|---|
| `#qlToast` (singleton, single-slot) | `template.html:2377`; `intelligence.js:10758` | **none** (no `aria-live`) | 87 call-sites; PR-ε.0 v6.2 §4 adds two more |
| `#syncStatus` / `#syncActivity` / `#updateToast` | `template.html:78/91/98` | full (`role="status"` + `aria-live="polite"` + `aria-atomic="true"`) | sync.js owned |
| `#offlineBadge` (persistent strip) | `template.html:154` | full | sync.js owned |
| `#appVersion` | `template.html:2674` | `role="status"` + live | settings sidebar |

### P-5 · Empty / loading / error / offline / unauthenticated states

**Empty states — 13 occurrences** (grep result above):

| Anchor | Surface | Empty copy | Idiom |
|---|---|---|---|
| `core.js:2013` | Notes list | "No notes yet — add observations…" | inline-styled `<div>` |
| `core.js:2122` | Scrapbook list | "No memories yet — tap "Add a Memory"…" | inline-styled `<div>` |
| `core.js:3599` | Recovery autosave list | "No autosaves yet…" | `.t-sub` class |
| `home.js:1381` | Vacc list | "No vaccinations recorded yet." | inline-styled `<div>` |
| `home.js:1471` | Milestones list | "No milestones tracked yet." | `.t-sub-light` class |
| `home.js:2074` | Milestone events | "No milestone events yet…" | `.t-sub-light` class |
| `home.js:2381` | Visits list | "No visits recorded yet." | `.t-sub-light` class |
| `home.js:2459` | Med log | "No medication log entries yet…" | `.t-sub-light fe-center-action` |
| `home.js:2657` | Feeding history | "No entries yet…" | `.t-sub-light fe-center-action` |
| `home.js:3016` | Food intro | "No foods introduced yet" | inline-styled `<div>` |
| `home.js:5530` | Milestones recorded | "No milestones recorded yet." | `.t-sub-light fe-center-action` |
| `home.js:5903` | Poop log | "No poop entries yet" | `.info-strip is-neutral` |
| `home.js:5919` | Poop entries | "No entries yet. Log Ziva's first poop!" | inline-styled `<div>` |
| `diet.js:3369` | Alert pattern history | "Not enough alert history…" | inline-styled `<div>` |
| **PR-ε.0 v6.2 §4** | Scrap milestone picker | "No milestones yet" + sub-copy "Add one in the Track tab first." | `.picker-empty` (NEW class) |

**Three idioms in active use:** inline-styled `<div>`, `.t-sub-light` (+ optional `fe-center-action`), and `.info-strip is-neutral`. PR-ε.0 v6.2 introduces a **fourth** (`.picker-empty`). Phase 2 should decide canonical form.

**Loading states — effectively absent.** One match: `.ob-loading` (`styles.css:6803`) for an onboarding step. The Header sub-text statically reads "Loading..." until `renderHome` finishes (`template.html:140`); no spinner / skeleton / indeterminate surface in the rest of the app.

**Error states — ad-hoc.** `showQLToast('Export failed: ' + err.message)` at `core.js:3431` is the canonical error path; no dedicated error variant of the toast (no color / icon distinction). Save-failure surfaces inside Family A and B modals are not visible in template — verify Phase 2 by tracing each `add*` action.

**Offline state — best in class.** S-04 + S-05 own the offline narrative with full live-region posture. No tab-level offline disable.

**Unauthenticated state — settings-card only.** Sync card at `template.html:2466–2477` shows the "Sign in with Google" CTA. No app-level "you're not signed in" banner. Local-first design means unauthenticated is the default and not surfaced as an exception. Worth Phase 2 catalog confirmation.

### P-6 · Tab / sub-tab / settings-tab navigation (three parallel implementations)

| Implementation | Class root | A11y posture | Persistence |
|---|---|---|---|
| Top-level tab bar | `.tab-bar > .tab-btn` | `aria-label` per button; **no `role="tablist"`** | `localStorage.ziva_active_tab` |
| Track sub-tab bar | `.track-sub-bar > .track-sub-btn` | **no `aria-label`**, **no `role="tablist"`** | `localStorage.ziva_track_sub` |
| Settings sub-tabs | `.sidebar-tabs > .settings-tab` | inner text only; **no `role="tablist"`** | none |
| Notes category filter | `.note-cat-filter > .ncf-btn` (`template.html:983`) | filter-style; not strict tabs but visually parallel | none |

### P-7 · Action-dispatcher patterns (`data-action`)

The dispatcher at `core.js:259+` (multiple `if/else if` ladders, three locations: `:259+`, `:348+`, `:474+`, `:614+`) wires up `data-action="<key>"` (+ optional `data-arg`, `data-arg2`, `data-id`, `data-stop`). PR-ε.0 v6.2 §4 adds five new actions (`openScrapMilestonePicker`, `toggleScrapPickerMilestone`, `confirmScrapMilestonePicker`, `cancelScrapMilestonePicker`, `removeScrapMilestone`) into the same dispatcher.

**Inconsistencies:**
- 36 `oninput=` / `onchange=` / `onclick=` inline handlers (HR-3 violations) coexist with the dispatcher pattern.
- Four locations of the dispatcher's switch ladder (`core.js:259+`, `:348+`, `:474+`, `:614+` — handler bodies pasted across tab-handler functions in `core.js`) — Phase 2 should consider whether this is intentional (per-tab specialization) or carry-over.
- `data-tab` is overloaded: top-level tab keys + Track sub-keys.
- `data-quick-modal` (S-06 sheet → `.ql-modal-overlay` open) is a distinct attribute, not an action — parallel routing.

### P-8 · Buttons / CTAs

| Variant | Source | Domain |
|---|---|---|
| `.btn .btn-rose` | `styles.css:311` | medical / scrapbook / focus accent |
| `.btn .btn-sage` | `:312` | diet |
| `.btn .btn-peach` | `:313` | warm / notes |
| `.btn .btn-lav` | `:314` | milestones / intelligence |
| `.btn .btn-sky` | `:315` | sleep / sync sign-in |
| `.btn .btn-indigo` | `:316` | sleep intelligence |
| `.btn .btn-ghost` | `:318` | secondary / cancel |
| `.btn .btn-amber` | (inferred — caution / trends) | caution |
| `.bug-btn` family | `styles.css` (bug-*) | bug reporter only |
| `.crop-cancel` / `.crop-save` | crop overlay | crop overlay only |
| `.alert-start-btn-rose` / `-amber` | `styles.css:4251–4252` | alert CTAs |

PR-ε.0 v6.2 §7.7 calls for `Done` button on the picker to be `btn-lav` (lavender domain consistency); `Cancel` is `btn-ghost`. Phase 2 should canonicalize the modal-button-pair convention against the existing 10 Family A modals (which use rose / sage / lav variants per their domain).

### P-9 · Collapsible card pattern

`data-collapse-target="<id>" data-collapse-chevron="<id>"` on a `.card-header` toggles `.collapse-body`. Used heavily in History tab (every history sub-card), Insights deep-dive cards, Info tab, Settings preference groups (implicit). 72 `data-collapse-target` instances in `template.html`. Chevron glyph is literal `▾` text character (**75 occurrences in `template.html`** — Cipher cross-cut count) — HR-1 by the same logic as `×` / `+`, and dwarfs the close-glyph proliferation captured in P-1 / S-09 / S-10 / S-12 / S-14 / S-15. Verify Phase 2 against `zi-chevron` if such a sprite exists; the magnitude here suggests `zi-chevron` adoption ranks at least as high as `zi-close` migration in Phase 3 contract work.

---

## Heuristic-axis cross-cutting observations

### Nielsen 10 (consolidated; per-surface notes are above)

1. **Visibility of state** — Strong on sync (S-04, S-05); weak on save outcome of Family A modals; missing on Quick-Log toast announcement (S-13 a11y).
2. **Match real world** — Domain colors map plausibly (lavender = milestones, rose = medical, sage = diet); Smart Q&A copy is warm.
3. **User control & freedom** — Back button closes Family A modals; Quick-Log sheet and Family B modals close on backdrop only (no Esc). No "leaving with unsaved changes" prompt anywhere.
4. **Consistency / standards** — **Weakest axis.** Six modal/overlay families; four form-input idioms; three tab-bar implementations; four empty-state idioms; two close-glyph patterns (literal `&times;` vs the forthcoming `zi-close` for chip ×).
5. **Error prevention** — Inputs trim+validate inline (e.g. `activateBtn(id, value.trim())`); milestone-text empty-or-whitespace fallback added in PR-ε.0 v6.2 §4. No structural prevention beyond per-field activation.
6. **Recognition over recall** — Card titles + icons throughout; chip suggestions for Smart Q&A.
7. **Flexibility / efficiency** — Quick Log FAB (S-06) is the speed lane; backfill option for past-time entries.
8. **Aesthetic / minimalist** — Cards are visually dense on Home; Insights tab leans summary. Acceptable.
9. **Recognition / recovery from errors** — Error path is `showQLToast(msg)` — no visual distinction from success toasts; no AT announcement (S-13 gap).
10. **Help / docs** — Welcome guide (S-03) is a one-time hero; otherwise inline copy / placeholders only.

### WCAG 2.1 AA — top concerns

- **2.1.1 Keyboard** — `.ql-option` items in S-06 are `<div>` not `<button>`; verify keyboard reachability. Quick-Log toast Undo affordance is `<span>` not `<button>` (S-13).
- **2.4.3 Focus order** — Not assessed end-to-end; modal-family lacks focus trap/return.
- **2.4.7 Focus visible** — Global `:focus-visible` rule (`styles.css:152`) is decent. Some surfaces add their own (offline-badge `:8946`, sync-indicator `:8869`) — duplicates of global at higher specificity; Phase 2 canonicalize.
- **3.3.1 Error identification** — Error toasts (S-13) are not announced; no error-specific styling.
- **4.1.2 Name/Role/Value** — Modal a11y gap (issue #54) is the dominant violation. Tab-bar lacks `role="tablist"`.
- **4.1.3 Status messages** — Sync surfaces (S-04, S-05, S-12 appVersion) pass; Quick-Log toast (S-13) fails.
- **2.5.5 Target size** — Global `min-height: 36px` (`styles.css:155`) is below the 44×44 affirmed by chip touch-target convention. Some surfaces enforce 44 via component CSS (`.chip` minimum, picker-row minimum); not universal.

### Responsive (320px / 414px verification status)

Not verified at audit-base — Phase 2 will run at 320 + 414 + 768. PR-ε.0 v6.2 §7.4 alignment work (picker-row `align-items: flex-start` + 2px check `margin-top`) was the last narrow-width caveat captured (Maren v5 audit MAJOR).

### Motion

Global `prefers-reduced-motion: reduce` block (`styles.css:3902`) zeroes all animation/transition durations. PR-ε.0 v6.2 §7.7 has explicit reduced-motion verification (Maren v5 audit MAJOR — "no transition flash on chip × hover, picker-row hover, or check toggle"). Per-surface motion verification is sparse; should be folded into the contract in Phase 3.

### Edge states

Captured per surface (S-01 through S-17). Empty states have four idioms (P-5); loading is effectively absent; error reuses success toast; offline is best-in-class; unauthenticated lives only in the settings card.

---

## Cross-cutting outputs (Phase 2 inputs)

### Pattern frequency / divergence count

| Pattern family | Instances | Divergence count |
|---|---|---|
| Overlay / modal families (Tier 4) | 19+ (10 A + 5 B + 1 C + 1 D + 1 E + 1 F + 1 G) | 6 distinct DOM idioms |
| Chip variants (P-2) | 20+ class-defined; many inline mixings | 7 first-class variants + per-instance `ct-*` extensions |
| Form-input idioms (P-3) | `.modal-input` + `.form-input` + `.qa-input` + 36+ inline-styled | 4 idioms |
| Toast idioms (P-4) | 4 surfaces | 1 with rigorous a11y, 1 without |
| Empty-state idioms (P-5) | 13 capture sites | 3 idioms today; 4 with PR-ε.0 v6.2 |
| Tab-nav implementations (P-6) | 3 distinct + 1 filter-style peer | 3 idioms |
| Close-glyph pattern | literal `&times;` in 6+ sites; `zi-close` (forthcoming) in PR-ε.0 v6.2 picker only | 2 idioms (transitional) |
| FAB-like glyph | literal `+` on `#qlFab` | HR-1 violation parallel to `×` |
| Inline `style=""` | 228 occurrences in `template.html` | HR-2 systemic |
| Inline `oninput=` / `onchange=` / `onclick=` | 36 in `template.html` | HR-3 systemic |

### Gap report (ranked by intelligence-engine impact)

Intelligence-engine impact = how much pattern divergence at this surface degrades the parent's trust that **what they tagged stays tagged**, **what they save persists**, and **what they read aligns with what they entered**.

| Rank | Gap | Impact | Surfaces | Evidence |
|---|---|---|---|---|
| 1 | **`#qlToast` has no `aria-live` / `role="status"`** | High — 87 call-sites including PR-ε.0 v6.2 §4 orphan-tag toasts (silent disappearance is the audit MAJOR Maren found in v4); confirm-time toast inherits this gap | S-13 + every showQLToast call-site | `template.html:2377`, `intelligence.js:10758` |
| 2 | **Modal a11y gap (issue #54)** — Family A + B + D + F (15+ surfaces) lack `role="dialog"` / `aria-modal` / `aria-labelledby` / focus trap / Esc | High — every form-bearing modal in the app + the forthcoming PR-ε.0 v6.2 picker | All Tier 4 overlays | `template.html:2704+`; v6.2 §4 deferral note; issue #54 |
| 3 | **`.ql-option` items are `<div>` not `<button>` (S-06)** | High — Quick Log is the speed-lane; keyboard regression here means data entry is gated | S-06 sheet | `template.html:2150–2177` |
| 4 | **Form-input idiom proliferation (4 idioms)** | Medium-high — every form is an "is this savable yet?" decision; visual divergence between `.modal-input` / `.form-input` / `.qa-input` / inline complicates that decision | P-3 / S-08 / S-15 / S-14 | `styles.css:1875`, `:4320`; 36+ inline call-sites |
| 5 | **Empty-state idiom proliferation (3 + 1 forthcoming)** | Medium-high — empty-state copy is the parent's "did I do this right?" feedback; mixing `.t-sub-light` with inline `<div>`s on adjacent cards visibly diverges | P-5 / 13 capture sites | as listed |
| 6 | **Tab-bar a11y gap — no `role="tablist"`, no `aria-selected`, no arrow nav, no `aria-label` on Track sub-tabs** | Medium — degrades AT navigation across the entire app shell | S-01, S-02, S-12 | `template.html:105+`; `core.js:2738` |
| 7 | **Quick-Log toast Undo affordance is `<span>` not `<button>`** | Medium — undo is the recovery path; making it keyboard-inaccessible is anti-trust | S-13 | `intelligence.js:10758–10762` |
| 8 | **`escAttr` does not escape `&`** — milestone-chip `aria-label` got the `escHtml(escAttr())` double-wrap fix in PR-ε.0 v6.2 §4; peer surfaces using bare `escAttr` for attribute interpolation may have the same gap | Medium — voice-pronunciation hazard ripples wherever `escAttr` is the sole shield | core.js:2304 (escAttr), all `aria-label`/`data-arg` interpolations | foundation §4; v5 Maren MAJOR; v6 fix |
| 9 | **Six DOM families for overlays** | Medium — long-term maintenance + a11y consolidation cost | Tier 4 | as captured |
| 10 | **Literal `×` / `+` glyphs (HR-1) at 6+ close-buttons + the `qlFab`** | Low (cosmetic) — but the chip × in PR-ε.0 v6.2 §7.1 fixes it for one site only; pattern proliferation continues unless Phase 3 normalizes | S-06 FAB; S-07 ql-modal closes; S-09 bug-close; S-10 crop-cancel? (verify); S-12 sidebar-close; S-14 qa-clear; S-15 scrap-photo-remove | `template.html:2142, 2183, 2238, 2272, 2298, 2338, 2381, 2441, 1029, 318` (qa-clear) |
| 11 | **Inline `style=""` (228) and inline handlers (36) in `template.html`** | Low (HR-2 / HR-3 hygiene) — pattern-divergence amplifier (impossible to know which token a screen "really" uses) | template-wide | as counted |
| 12 | **Loading states effectively absent** | Low — local-first means most renders are sync; but Firebase-attached views (sync states, post-receive renders) can render mid-update; a calmer indeterminate surface would land before patterns ship that need it | app-wide | `.ob-loading` only existing instance |

### Token usage map (preliminary; Phase 2 deepens)

PR-ε.0 v6.2 §7.3 provides a verified token list for the milestone-chip surface. Cross-cutting observations:

- **`--rose` is overloaded** — used as the global focus-visible color (`styles.css:152`) AND as the medical-domain accent (`.btn-rose`, `.modal-input` border on focus). Phase 2: confirm intent.
- **`--lavender` family is consistent** — milestones / intelligence / sync sign-in CTA all stay in the lavender + sky band. Good.
- **Domain-color tokens (`--sage / --rose / --amber / --lavender / --sky / --indigo / --peach`)** map cleanly to the seven domains in CLAUDE.md. New tokens introduced by PR-ε.0 v6.2 §7.3 (`--lav-light`, `--surface-lav`) are scoped lavender-only.
- **Spacing tokens** — `--sp-4/6/8/10/12/16/20/24/32` fully covered by PR-ε.0 v6.2's §7.3 audit. Compact / micro tokens may be missing — verify Phase 2.
- **Suspect tokens** — `--input-focus` and `--input-glow` referenced in `.form-input:focus` (`styles.css:4327`) with `var(--input-focus, var(--rose))` fallback — possibly unused. Phase 2: grep usage.
- **Unused tokens** — out of scope for Phase 1; Phase 2 token-map work will run a usage census.

---

## PR-ε.0 v6.2 surface concentration — high-care entry

These are the surfaces the implementation PR will touch. Captured here so Phase 4's conformance check has a single referent:

- **S-15** — Scrapbook add-memory inline form: insertion site for `<div class="scrap-form-row">` between `:1030` and `:1031` (foundation §4). Carries forward all pre-existing HR-2/HR-3/HR-1 debt; PR-ε.0 v6.2 explicitly does NOT clean it.
- **S-17** — Milestone chip + scrap milestone picker: NEW surface; v6.2 §4 + §7.1 + §7.3 + §7.7 are the source of truth. Folds Maren v3/v4/v5/v6 audit MAJORs (escAttr+escHtml double-wrap on chip × aria-label, confirm-time orphan toast, picker-row align-items: flex-start, prefers-reduced-motion checklist line). Modal-a11y gap inherited (issue #54 deferral).
- **S-13** — Quick Log toast: gains two new fire-sites (edit-load orphan + confirm-time orphan). Phase 2 must answer whether the existing no-`aria-live` posture is acceptable for these new surfaces, or whether the orphan-tag toast belongs in a new variant.
- **S-08** — Family A modal: gains an 11th instance (`scrapMilestonePickerModal`). Inherits the universal modal-a11y gap.
- **Sprite (`template.html`)** — gains `zi-close` (foundation §7.1). One-glyph addition; first new sprite icon since the 62-symbol audit baseline.
- **Token catalog (`styles.css`)** — gains `.chip-milestone`, `.chip-label`, `.chip-x`, `.scrap-form-row`, `.scrap-form-label`, `.milestone-chips`, `.scrap-tag-btn`, `.scrap-picker-modal`, `.picker-list`, `.picker-cat-group`, `.picker-cat-header`, `.picker-row`, `.picker-row-check`, `.picker-row-label`, `.picker-empty`, `.picker-empty-sub`. Sixteen new classes; lavender-domain only.

---

## Forward-pointers (deferred-MAJORs from v6/v6.1)

- **Issue #53** — sync: in-flight Firestore snapshot stragglers can mutate local state after detach. Not a UI surface, but PR-ε.0 v6.2 §6.2(d) reconnect-clear depends on the same lifecycle. Captured here for Phase 3 contract awareness (state-transition timing rules).
- **Issue #54** — a11y: repo-wide modal uplift (`role="dialog"` / `aria-modal` / `aria-labelledby`). Affects ~15 surfaces in this inventory (Family A × 10, Family B × 5, plus debatable Family D / G). Phase 2 fold; do not propose here.
- **Issue #55** — docs: CLAUDE.md line-count drift. Carry-forward via the per-file table above and per-surface anchors.

---

## Notes for Cipher (Edict V cross-cut)

Targets I expect Cipher to challenge:
1. **Completeness against Aurelius's brief surface taxonomy** — every modal, every toast, every form, every empty/loading/error/offline/unauthenticated state, every chip, every navigation; does S-1..S-17 + P-1..P-9 cover the whole graph, or did I miss the Welcome Guide / sync sign-in modal flow / appointment modal sub-states?
2. **Pattern-name uniformity** — am I calling the same thing the same name across captures? "Family A modal" vs `.modal-overlay > .modal` vs "milestone modal" — Cipher has the cross-cut authority to canonicalize before Phase 2 runs.
3. **Gap-report ranking calibration** — is intelligence-engine impact the right ordering for what Phase 2 catalog work will need? Should `escAttr & gap` (rank 8) move higher because it's a cross-cutting hazard, or stay where it is because PR-ε.0 v6.2 already ships the mitigation locally?
4. **Issue #54 raw data sufficiency** — Phase 2 will fold the modal a11y uplift. Does the Tier 4 + S-08 + S-09 + S-10 + S-11 + S-12 capture give Phase 2 enough raw data, or does Cipher want me to enumerate per-modal which a11y attributes are missing?
5. **PR-ε.0 v6.2 §4 surface (S-17)** — am I respecting the descriptive-not-prescriptive constraint, or did I creep into "should" territory?
