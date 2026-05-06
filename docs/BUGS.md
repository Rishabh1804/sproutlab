# SproutLab — Bug Log
**Maintained by:** Lyra (Builder) · Maren (Care) · Kael (Intelligence)
**Last updated:** 2026-05-06
**Format:** P0 = visible user-facing bug · P1 = correctness/data bug · P2 = code quality / HR violation

---

## Open Bugs

### Home Tab

#### P2 — HR-1: `getMoonPhaseEmoji` returns Unicode emoji (core.js:2973)
- **Symptom:** Moon phase display on home greeting uses raw Unicode emoji characters (🌑🌒🌓…) instead of the `zi()` SVG system.
- **Rule violated:** HR-1 — no Unicode emoji; all icons via `zi()`.
- **Notes:** Pre-existing. Not reachable through Polish-11 surface area; deferred to R-10 HR-1 queue.
- **File:** `split/core.js` ~line 2973

---

### Growth Tab

#### P1 — Growth gauge hex color values hardcoded in JS (medical.js)
- **Symptom:** `wtColor = '#c06078'` and `htColor = '#4686a0'` are raw hex values in JS, not CSS custom properties. Should use design-system tokens.
- **Rule violated:** HR-2 (no inline values — tokens only) applied to JS color constants.
- **Notes:** Deferred to Stability sub-phase R-10 JS-side hex baseline sweep (~15 sites identified by Kael).
- **File:** `split/medical.js` inside `renderGrowthHero`

---

### Activities Tab

#### P0 — Recent Evidence Feed flooding ("Social Smiling" repeated entries)
- **Symptom:** Activities tab shows "Social Smiling" (a milestone display name) repeatedly, making the tab feel haphazard. Root cause: UI conflates "what to do" (Recommended Activities) with "what was done" (Recent Evidence Feed); Recent Evidence Feed lacks rollup aggregation so high-frequency milestone observations flood the view.
- **Fix shape:** Rollup aggregation (PR-β scope) — e.g. "Social Smiling — 12 observations this week, last: 3pm today"; tappable expand reveals individual entries.
- **Sequencing:** Blocked on PR-α merge (Stability sub-phase). PR-β opens post-PR-α + Sovereign real-device verification.
- **File:** `split/medical.js` — `renderRecentEvidence()` (~line 22271)

#### P1 — `_renderAttribution` not wired into Recent Evidence Feed (Phase 3 deferred PR-19.6)
- **Symptom:** Attribution chips (who logged the entry) don't appear on Recent Evidence Feed entries, only on Visit entries.
- **Fix shape:** Wire `_renderAttribution(entry)` per entry in `renderRecentEvidence()`, modeled on `renderVisits()` (~line 22353).
- **Sequencing:** PR-α scope (Stability sub-phase first feature PR).
- **File:** `split/medical.js`

#### P1 — `renderMilestones()` is a monolith (~300 LOC)
- **Symptom:** Single function bundles stats, wheels, feed, highlights, and regression alerts. Prevents independent re-renders and makes per-renderer SYNC_RENDER_DEPS wiring impossible.
- **Fix shape:** Split into `renderMilestoneStats()`, `renderCategoryWheels()`, `renderRecentEvidence()`, `renderMilestoneHighlights()`, `renderRegressionAlerts()`; update `SYNC_RENDER_DEPS` at ~line 61194.
- **Sequencing:** PR-α scope (Stability sub-phase).
- **File:** `split/medical.js` — `renderMilestones()` (~line 21640+)

---

### Data / Sync

#### P1 — `medChecks` / `feedingData` not migrated to object-keyed shape
- **Symptom:** Pre-Phase-4 data shape uses array indexing; object-keyed shape (by date string) is required for cross-device sync consistency and efficient lookups.
- **Sequencing:** Stability sub-phase carryforward item.
- **Files:** `split/medical.js`, `split/sync.js`

---

### CSS / Design System

#### P2 — Chip wrapping: multiple chip classes use `white-space:nowrap` with variable-length content
- **Symptom:** Chip text truncates or overflows on narrow screens when food names or milestone text is long.
- **Affected classes:** `.chip`, `.qa-chip`, `.outing-chip`, `.dqp-pill`, `.ql-freq-pill`
- **Fix:** Remove `white-space:nowrap`; add `flex-wrap:wrap` to containers (`.ql-meal-pills`, `.qa-chips`, `.al-slot-chips`).
- **File:** `split/styles.css`

#### P2 — Raw `px` padding debt (~259 raw-px padding declarations vs 237 tokenized)
- **Symptom:** Nearly half of all padding declarations bypass the `--sp-*` token system. Inconsistent spacing at different zoom tiers.
- **Notes:** Broad sweep; R-10 queue. Largest gap in token adoption across the design system.
- **File:** `split/styles.css`

#### P2 — DRY refactor candidate: duplicate function at medical.js:2255 vs intelligence.js:11958
- **Symptom:** Same logic exists in two files without shared abstraction. Identified by Cipher during Polish-2 build-deep.
- **File:** `split/medical.js` ~2255, `split/intelligence.js` ~11958

---

### Infrastructure / Build

#### P2 — `build.sh` must never be invoked with `2>&1`
- **Symptom:** `bash build.sh > sproutlab.html 2>&1` merges stderr into the HTML output. `bump-version.mjs` intentionally uses `console.error()` so its log stays off stdout; `2>&1` injects `[bump-version] X → Y` as line 1 of the document.
- **Status:** Triggered in Polish-11 session; fix landed (PR-41). Document here as a standing operational rule.
- **Rule:** Always build as `bash build.sh > sproutlab.html` (stderr separate). Never append `2>&1`.

---

## Fixed Bugs (Polish Sub-phase, Phase 4)

### Polish-11 (2026-05-06) — PR-40 + PR-41

| # | Description | File | PR |
|---|-------------|------|----|
| Bug 1 | Sleep Score pill: `zi()` SVG output assigned via `.textContent` (HR-7 violation) — rendered as literal markup text | `split/home.js` | PR-40 |
| Bug 2 | Growth gauge: combined "70 cm" / "7.5 kg" string at `--fs-xl` overflows 78px inner ring diameter at large zoom | `split/medical.js` | PR-41 |
| Bug 3a | Growth gauge percentile pill: `--fs-xs` ≈ 9px sub-legible for Nunito digit rendering on mobile | `split/styles.css` | PR-41 |
| Bug 3b | Growth gauge `pctText` unescaped in `innerHTML` context — `calcPercentile` can return `"<3rd"` / `">97th"` (HR-4 violation) | `split/medical.js` | PR-41 |
| Infra | SW caching HTML (Canon 0034 violation) — stale-while-revalidate served corrupted `index.html` from cache, blocking fix propagation | `sw.js` | PR-42 |
| Infra | `syncReload()` used `location.reload()` — respects browser HTTP cache, served stale HTML after SW cache cleared | `split/sync.js` | PR-43 |

### Polish-10 (2026-05-03) — PR-34 through PR-39

| # | Description | File | PR |
|---|-------------|------|----|
| SVG-in-data | Illness episode `emoji` fields stored `zi()` SVG output; leaked into `title="..."` attributes, rendering as visible markup text | `split/medical.js` | PR-34 (Polish-10a) |
| Icon sibling | `sections.diet` used `emoji: 'bowl'` string literal instead of `iconKey`; all 7 `sections.*` objects swept to `iconKey` shape | `split/medical.js` | PR-38 (Polish-10d hotfix) |
| HR-3 batch (Care) | ~24 `onclick` handlers in home.js + medical.js replaced with `data-action` delegation | `split/home.js`, `split/medical.js` | PR-35 (Polish-10b) |
| HR-3 batch (Intel) | ~15 `onclick` handlers in intelligence.js + diet.js replaced with `data-action` delegation | `split/intelligence.js`, `split/diet.js` | PR-36 (Polish-10c) |

### Polish-1 through Polish-9 (2026-04-30 – 2026-05-02)

| # | Description | PR |
|---|-------------|----|
| CSS custom property pivot | Dynamic-required surfaces converted to `--dyn-pct` CSS custom property (HR-2) | PR-28 (Polish-6) |
| Essential mode rename | `ziva_simple_mode` → `ziva_essential_mode` with boot migration | PR-31 (Polish-9) |
| Direct token hex sweep | 32 hardcoded hex values in styles.css replaced with design tokens | PR-27 (Polish-3) |
| Design token additions | 9 new tonal tokens (`--rose-deep`, `--sage-deep`, etc.) | PR-28 (Polish-4) |
| Responsive breakpoint normalization | Canonical 4-value breakpoint system enforced | PR-29 (Polish-7) |
| Insights-tier gates | Defense-in-depth essential-mode gates on medical.js insight renderers | PR-25 (Polish-1) |

---

## R-10 Queue (Deferred Hygiene — Stability Sub-phase)

Items inventoried but not yet scheduled. 16-item queue as of Polish sub-phase close.

| Priority | Area | Description |
|----------|------|-------------|
| P2 | HR-1 | `getMoonPhaseEmoji` Unicode emoji sweep (core.js) |
| P2 | HR-2 | JS-side hex color constants (~15 sites — Kael Stability baseline) |
| P2 | CSS | Raw px padding debt (~259 declarations) |
| P2 | CSS | Chip wrapping + container `flex-wrap` fixes |
| P2 | DRY | Duplicate function medical.js:2255 / intelligence.js:11958 |
| P1 | Sync | medChecks / feedingData object-keyed migration |
| P1 | Render | `render-functions-must-be-pure` audit (candidate at 0/3; `renderMilestones()` split is next opportunity) |

---

## Operational Rules (Learned from Bugs)

| Rule | Origin |
|------|--------|
| Never `bash build.sh > sproutlab.html 2>&1` — stderr must stay separate | Polish-11 build error |
| `sw.js` must not cache HTML — navigate-mode requests bypass SW entirely (Canon 0034) | PR-42 |
| `syncReload()` must cache-bust via `location.replace(pathname + '?_cb=N')` — `location.reload()` serves from browser HTTP cache | PR-43 |
| `zi()` output must be assigned via `.innerHTML`, never `.textContent` (HR-7) | Polish-11a (Bug 1) |
| `calcPercentile` returns `"<3rd"` / `">97th"` — must `escHtml()` before any `innerHTML` use (HR-4) | Polish-11b (Bug 3b) |
