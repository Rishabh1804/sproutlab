# SproutLab — Design Principles
**Version:** 1.0 · **Created:** 9 April 2026 · **Updated:** 9 April 2026
**Forked from:** DESIGN_SYSTEM_TEMPLATE.md v1.0
**App:** Baby development tracker for Ziva (born Sep 2025)
**Architecture:** Split-file HTML PWA (build-concatenated), localStorage persistence, no backend
**Context:** Used on a phone by new parents, often one-handed while holding a baby — warm, gentle, reassuring

---

## 1. Brand & Visual Identity

### Personality

**Warm, sturdy, calm.** SproutLab feels like a cozy nursery journal, not a clinical health app.

- **Not clinical:** No stark whites, no hospital blues, no sharp corners. The app sits on soft cream (`--cream: #fffaf7`), not white.
- **Not flashy:** No neon accents, no aggressive animations. Transitions are gentle (`--ease-med: 0.22s`), never bouncy.
- **Warm base:** Every screen has a cream/peach warmth underneath. Cards float on soft shadows, not hard borders.
- **Sturdy surfaces:** Cards use solid backgrounds with subtle shadows. No translucent glass effects on primary content.

### Typography

| Font | Use | Token |
|------|-----|-------|
| **Fraunces** (serif) | Hero headlines, scores, card titles, countdowns, gauge values | `--ff-display` (not yet tokenized — use `'Fraunces', serif` directly) |
| **Nunito** (sans-serif) | Body text, labels, buttons, form inputs, chips, navigation | `--ff-base` (not yet tokenized — use `'Nunito', sans-serif` directly) |

Never use system fonts, Arial, or Helvetica in new code. Both Fraunces and Nunito are loaded via Google Fonts in the HTML head.

**Text zoom:** Three tiers (default, medium, large) controlled by `data-zoom` attribute on `:root`. All `--fs-*` tokens scale proportionally. The `.header` block is exempt (always uses default tier to prevent layout overflow).

### Color System

#### Domain Colors (7 domains)

| Domain | Accent | Light BG | Text Color | Usage |
|--------|--------|----------|------------|-------|
| **sage** | `--sage` #b5d5c5 | `--sage-light` #e8f5ef | `--tc-sage` #3a7060 | Diet, nutrition, positive status, "good" |
| **rose** | `--rose` #f2a8b8 | `--rose-light` #fde8ed | `--tc-rose` #9e3e52 | Medical alerts, illness, "action needed" |
| **amber** | `--amber` #e8b86d | `--amber-light` #fef6e8 | `--tc-amber` #8a6520 | Caution, trends, food warnings |
| **lavender** | `--lavender` #c9b8e8 | `--lav-light` #f0ebfb | `--tc-lav` #6e5e9a | Milestones, achievements, intelligence |
| **sky** | `--sky` #a8cfe0 | `--sky-light` #e8f4fa | `--tc-sky` #336580 | Sleep, hydration, weather |
| **indigo** | `--indigo` #9ba8d8 | `--indigo-light` #edf0fa | `--tc-indigo` #4a5080 | Sleep intelligence, night data |
| **peach** | `--peach` #fad4b4 | `--peach-light` #fef3ea | — | Warm accents, outing planner, warmth |

**Rule:** Every new card, section, or feature must use one of these domain colors. No ad-hoc hex values in innerHTML strings.

#### Domain → Element Assignments

| UI Element | Domain Color | Why |
|-----------|--------------|-----|
| Home hero score | sage (good) / amber (fair) / rose (attention) | Score-driven |
| Diet tab, food cards | sage | Nutrition = growth |
| Sleep tab, sleep cards | sky / indigo | Night sky association |
| Poop tracking | amber | Digestive caution |
| Medical tab, vaccination | rose | Medical alertness |
| Milestones, achievements | lavender | Celebration, progress |
| Activity logger | lavender | Activity = development |
| Alerts (positive) | sage | Reinforcement |
| Alerts (caution) | amber | Watch-level |
| Alerts (action) | rose | Needs intervention |
| Today So Far | neutral (cream/warm) | Timeline, not domain-specific |
| Outing planner | peach | Warm, outdoor feel |
| Score popup | per-domain | Each domain gets its own color |
| QA / search bar | lavender | Intelligence system |

#### Status Triad

| Meaning | Surface | Text | Use |
|---------|---------|------|-----|
| Good / positive | `--surface-sage` | `--tc-sage` | On-track scores, confirmations |
| Watch / caution | `--surface-warn` / `--surface-caution` | `--tc-caution` / `--tc-warn` | Declining trends, mild warnings |
| Action / urgent | `--surface-danger` | `--tc-danger` | Fever alerts, overdue vaccinations |

### Icon System

**zi() — Ziva Sketch icon set.** 54 custom SVG symbols defined as a `<symbol>` sprite in `template.html`. Rendered via the `zi(name)` helper function which returns `<svg class="zi"><use href="#zi-{name}"/></svg>`.

Available icons (54):
```
baby balloon bars bell bolt book bowl brain bulb camera chart chat check
chef clock crystal diaper dot-red drop flame flask halfcircle handshake
hourglass info link list lotus medical moon note palette party pill
rainbow ruler run scale scope shield siren sleep sparkle spoon sprout
star steth sun syringe target timer trophy warn zzz
```

Icon sizing via tokens: `--icon-xs(12) --icon-sm(14) --icon-base(16) --icon-md(18) --icon-lg(22)`

**HARD RULE: No emojis in new code. All icons via zi().** See HR-1.

---

## 2. Seven Design Principles (scored 1–5 per build)

Score each principle after every build. Track trends. A score below 3.5 on any principle triggers a focused improvement session.

### 1. Emphasis / Dominance
**Create a focal point that intentionally draws the user's attention.**

Home tab: Hero score card is the dominant element — largest card, Fraunces serif title, full-width. Each sub-tab has one hero element (growth chart, sleep stats, poop gauge). Score popup uses a full-screen overlay with a large centered score ring.

### 2. Unity / Rhythm
**Create repeating patterns for harmony and visual rhythm.**

Card anatomy is consistent: `.card-header` → `.card-title` (Fraunces + icon) → content body. Section labels use uppercase, `--fs-sm`, `--ls-wide`, `--mid` color. Chip families share border-radius `--r-2xl` and consistent padding. Domain colors repeat across related features.

### 3. Hierarchy
**Size, font, color define importance.**

| Level | Font | Size | Weight | Use |
|-------|------|------|--------|-----|
| Hero | Fraunces | `--fs-xl`+ | 700 | Hero card titles, score values |
| Primary | Fraunces | `--fs-md`–`--fs-lg` | 600 | Card titles |
| Body | Nunito | `--fs-base` | 400–500 | Content text, descriptions |
| Secondary | Nunito | `--fs-sm` | 600 | Section labels, chip text |
| Meta | Nunito | `--fs-xs`–`--fs-2xs` | 600 | Timestamps, counts, badges |

### 4. Balance
**Even distribution of shape and space.**

Cards have consistent internal padding (`18px 16px` mobile, `22px 24px` desktop). Section gaps use tokens: `--section-gap-hero(24px)` between hero and first content, `--section-gap-zone(16px)` between zones, `--card-gap-paired(12px)` between related cards. Chip grids use `flex-wrap:wrap` with `gap` tokens.

### 5. Proportion / Scale
**Consistent sizing via tokens.**

All new code must use the token scale. Zero raw px in new CSS (see HR-4).

Spacing: `--sp-2(2) --sp-4(4) --sp-6(6) --sp-8(8) --sp-10(10) --sp-12(12) --sp-16(16) --sp-20(20) --sp-24(24) --sp-32(32)`
Font sizes: `--fs-2xs → --fs-3xl` (9 steps, 3 zoom tiers)
Radii: `--r-sm(4) → --r-full(9999)` (6 steps)

### 6. Contrast
**Color, shape, size differentiate elements.**

Status triad (sage/amber/rose) provides three-level severity contrast. Score bands map to distinct visual treatments (90+ = sparkle, 75+ = check, 45+ = target, 0+ = warn). Dark mode inverts surfaces while preserving domain color identity — text colors lighten, backgrounds darken, but sage stays "green" and rose stays "pink."

### 7. Similarity
**Shared visual treatment groups related elements.**

All intelligence cards share the `si-*` prefix and consistent anatomy: section label → stat grid → insight text. All illness trackers share the `fe-*`/`de-*`/`vo-*`/`ce-*` pattern with identical card structure. Card tiers (hero/action/daily) share base `.card` styling with progressive overrides.

---

## 3. Hard Rules (Zero Tolerance)

Build failures. New code violating any of these must be fixed before the session ends.

### HR-1: No emojis in new code
Zero emojis in any new `innerHTML`, `textContent`, template literal, or HTML attribute. Use `zi()` icon helper instead.

**QA:** grep new code for Unicode ranges U+1F300–1F9FF, U+2600–27BF.

### HR-2: No inline styles in new code
Zero `style="..."` attributes in new HTML strings or innerHTML. All styling via CSS classes with design tokens.

**QA:** grep `style="` in new code → must be 0.

### HR-3: No inline event handlers in new code
Zero `onclick=`, `onchange=`, `oninput=` in new HTML. All handlers via `data-action` delegation in core.js.

**QA:** grep `onclick=` in new code → must be 0.

### HR-4: No raw px in new CSS
All spacing via `var(--sp-*)`. All font sizes via `var(--fs-*)`. All radii via `var(--r-*)`.

**Allowed exceptions:** `1px` and `2px` borders, `min-width`, `max-width`, `translateY`, `box-shadow` offset/blur values, tab/header heights (44px, 48px), `16px !important` for iOS zoom prevention.

### HR-5: No ellipsis truncation
Zero `text-overflow: ellipsis` anywhere. All text displays in full, wraps if needed.

**Current status:** ✓ Zero violations in CSS.

### HR-6: Domain colors for every surface
Every new card/section uses a domain color from the 7-domain palette. No ad-hoc hex values in innerHTML strings.

### HR-7: Dark mode token readiness
Every new CSS class with a background or text color must use tokens that have dark variants defined in the `[data-theme="dark"]` block. Dark mode is active and functional — not just token-ready.

### HR-8: Minimum tap target
All interactive elements: minimum **36×36px** tap target.

Rationale: Parent holding a baby, tapping one-handed. 44px is ideal (`.chip` class uses 44px); 36px is the floor for compact controls.

**Applies to:** buttons, chips, tappable list items, icon buttons, steppers, toggles, category cards, history headers.

### HR-9: No persistent editing in overlays
Overlays are for Read (viewing), Act (confirming), and single-field Quick Actions. Multi-field editing happens in page content or dedicated Flow overlays with dirty flags.

**Mechanical test:** If an overlay has a Save button, the total interaction before tapping it must take under 30 seconds and involve no scrolling within the overlay form.

### HR-10: All display formatting through named functions
No inline number formatting, date formatting, or currency formatting at render sites.

**Format Function Registry:**

| Function | Input | Output | Defined in |
|----------|-------|--------|------------|
| `escHtml(s)` | any string | HTML-safe string | core.js |
| `escAttr(s)` | any string | attribute-safe string | core.js |
| `formatDate(s)` | dateStr | `'Mon DD'` or `'Mon DD, YYYY'` | core.js |
| `formatTimeShort(t)` | `'HH:MM'` | `'H:MM am/pm'` | core.js |
| `toDateStr(d)` | Date | `'YYYY-MM-DD'` | core.js |
| `ageAtDate(dateStr)` | dateStr | `'Nm Nd'` | core.js |
| `formatHeight(cm)` | number | ft/in or cm string | medical.js |
| `normalizeFoodName(raw)` | string | normalized base name | core.js |

### HR-11: Chip text must wrap
No `white-space:nowrap` on chips that display variable-length content (food names, questions, milestone text). Fixed-label chips (tabs, duration selectors) may use nowrap. Chip containers must use `flex-wrap:wrap`.

### HR-12: escHtml on all user-sourced text
Every `innerHTML` assignment that includes user-entered text (food names, notes, milestone text, doctor names) must pass through `escHtml()`. No exceptions.

---

## 4. data-action Naming Convention

See ARCHITECTURE_PATTERNS.md §7.1 for the full convention: `{module}{Verb}{Target}`.

**App-specific module prefixes (CSS):**

| Prefix | Module | Scope |
|--------|--------|-------|
| `tsf-*` | Today So Far | TSF smart card (intelligence.js) |
| `tp-*` | Today's Plan | Plan card (home.js) |
| `cd-*` | Cross-Domain | Cross-domain intelligence cards (intelligence.js) |
| `si-*` | Sleep Intelligence | Sleep intel cards (intelligence.js) |
| `mi-*` | Medical Intelligence | Medical intel cards + supplement (medical.js) |
| `vc-*` | Vaccination | Vacc cards, completion, reaction (medical.js) |
| `ql-*` | Quick Log | QL sheet, modals, pills (intelligence.js) |
| `al-*` | Activity Logger | Activity log modal, chips, suggestions (intelligence.js) |
| `sp-*` | Score Popup | Score popup overlay, domain tabs (diet.js) |
| `qa-*` | Q&A / Search | Search bar, answer cards, chips (intelligence.js) |
| `fe-*` | Fever | Fever episode tracker (intelligence.js) |
| `de-*` | Diarrhoea | Diarrhoea episode tracker (intelligence.js) |
| `ep-*` | Episode (shared) | Shared illness episode UI (intelligence.js) |
| `iq-*` | Ingredient Query | Food combo / ingredient picker (intelligence.js) |
| `sg-*` | Suggestions | Food suggestion chips (intelligence.js) |
| `ob-*` | Outing Briefing | Outing planner popup (home.js) |
| `gh-*` | Growth Hero | Growth tab hero section (medical.js) |
| `nh-*` | Nutrient Heatmap | Heatmap visualization (intelligence.js) |
| `hy-*` | Hydration | Hydration intelligence (medical.js) |
| `dqp-*` | Diet Quick Picker | Diet tab quick picker pills (home.js) |
| `mb-*` | Meal Breakdown | Meal breakdown intel card (intelligence.js) |
| `wg-*` | Welcome Guide | Onboarding guide (core.js) |

**Rule:** New features pick a 2–3 letter prefix and use it consistently for all CSS classes and data-action values in that feature. The prefix is registered in this table before writing code.

---

## 5. UI Systems

### Card System (4 tiers)

| Tier | Class | Padding | Title Font | Title Size | Icon Size | Shadow | Use |
|------|-------|---------|------------|------------|-----------|--------|-----|
| **Hero** | `.card.card-hero` | 18/16 (m) 22/24 (d) | Fraunces | `--fs-xl` 700 | 40×40 `--icon-lg` | Full | Score card, tab hero |
| **Action** | `.card.card-action` | 18/16 | Fraunces | `--fs-lg` 600 | 28×28 `--icon-base` | Full + rose left border | Alerts, reminders, CTAs |
| **Daily** | `.card.card-daily` | 14/14 | Nunito | `--fs-base` 600 | 24×24 `--icon-sm` | Subtle | Meal cards, daily entries |
| **Base** | `.card` | 18/16 (m) 22/24 (d) | Fraunces | `--fs-md` 600 | — | Standard | Default, info cards |

**Card anatomy pattern:**
```html
<div class="card card-{tier}">
  <div class="card-header">
    <div class="card-title">
      <span class="icon {domain-bg}">{zi('icon')}</span>
      Title Text
    </div>
    <!-- optional: chevron, badge, action button -->
  </div>
  <!-- card body content -->
</div>
```

**Text roles inside cards:**
- `.card-body-text` — `--fs-base`, `--lh-relaxed`, `--text` color
- `.card-detail` — `--fs-sm`, `--lh-relaxed`, `--mid` color
- `.card-meta` — `--fs-xs`, uppercase, `--ls-normal`, `--light` color

### Section Label System

| Class | Color | Use |
|-------|-------|-----|
| `.section-label` | `--mid` | Default section headers |
| `.section-label-danger` | `--tc-danger` | Critical sections |
| `.section-label-warn` | `--tc-warn` | Warning sections |
| `.section-label-info` | `--mid` | Informational sections |
| `.home-section-label` | `--light` | Home tab zone labels (3 tiers: `.sec-t1` `.sec-t2` `.sec-t3`) |

All section labels: `--fs-sm`, `font-weight:600`, `text-transform:uppercase`, `letter-spacing: --ls-wide`.

### Overlay System

See ARCHITECTURE_PATTERNS.md §13 for the Read/Act/Flow framework.

| Overlay | Intent | Class | Close behavior |
|---------|--------|-------|---------------|
| Score popup | Read | `.score-popup` | Outside tap, × button |
| Modals (growth, vacc, med, etc.) | Flow | `.modal-overlay` + `.modal` | × button only |
| Confirm action | Act | `.modal-overlay` | Cancel/Confirm buttons |
| Quick Log sheet | Flow | `.quick-log` | × button, outside tap |
| Outing briefing | Read | `.ob-scrim` | × button, outside tap |
| Bug reporter | Flow | `.bug-scrim` | × button, outside tap |

### Chip System

**Base class:** `.chip` — `display:inline-flex`, `align-items:center`, `border-radius:var(--r-2xl)`, `min-height:44px`, `border:1.5px solid`, `font-family:Nunito`.

**Chip modes** (via `data-chip` attribute):
- `data-chip="single"` — radio behavior: one active in group
- `data-chip="multi"` — toggle behavior: multiple active

**Minimum chip padding:** `var(--sp-6) var(--sp-12)` for standard chips. Compact badges may use `var(--sp-4) var(--sp-8)` minimum.

**Domain-colored chips:** Use the domain's light-bg + text-color tokens for active state.

---

## 6. QA Audit Checklist (per build)

> **Sync note:** This checklist should stay in sync with QA_PROCESS.md §4.

### Hard Rule Checks
- [ ] HR-1: Zero emojis in new code
- [ ] HR-2: Zero `style="..."` in new HTML
- [ ] HR-3: Zero `onclick=`/`onchange=`/`oninput=` in new HTML
- [ ] HR-4: Zero raw px in new CSS (check allowed exceptions)
- [ ] HR-5: Zero `text-overflow: ellipsis`
- [ ] HR-6: All new surfaces use domain colors
- [ ] HR-7: New bg/color CSS uses tokens with dark variants
- [ ] HR-8: All interactive elements ≥ 36×36px
- [ ] HR-9: No multi-field editing in overlays
- [ ] HR-10: No inline formatting — all through named functions
- [ ] HR-11: No `white-space:nowrap` on variable-content chips
- [ ] HR-12: All user text through `escHtml()` in innerHTML

### Code Quality
- [ ] JS syntax valid
- [ ] CSS braces balanced
- [ ] Division-by-zero guarded
- [ ] `data-action` names follow `{module}{Verb}{Target}` pattern
- [ ] Dead code: 0 unused variables/functions
- [ ] New CSS classes use registered prefix from §4

### Overlay Checks
- [ ] Every overlay has intent classification (Read / Act / Flow)
- [ ] Close behavior matches intent
- [ ] ESC behavior matches outside-tap behavior
- [ ] Animation uses token, not raw duration
- [ ] DOM cleanup: overlay removed after animation timeout
- [ ] Body scroll: locked on open, restored on close

### Design Principle Scores
| Principle | Score |
|-----------|:-----:|
| 1. Emphasis / Dominance | /5 |
| 2. Unity / Rhythm | /5 |
| 3. Hierarchy | /5 |
| 4. Balance | /5 |
| 5. Proportion / Scale | /5 |
| 6. Contrast | /5 |
| 7. Similarity | /5 |

---

## 7. Token Reference

### Spacing (`--sp-*`)

| Token | Value | Note |
|-------|-------|------|
| `--sp-2` | 2px | Micro gap, badge padding |
| `--sp-4` | 4px | Tight internal gap |
| `--sp-6` | 6px | Compact chip vertical padding |
| `--sp-8` | 8px | Standard gap, chip horizontal |
| `--sp-10` | 10px | Chip padding, small margin |
| `--sp-12` | 12px | Card gap (paired), standard padding |
| `--sp-16` | 16px | Section zone gap, card padding |
| `--sp-20` | 20px | Large internal spacing |
| `--sp-24` | 24px | Hero section gap |
| `--sp-32` | 32px | Major section breaks |

### Font Size (`--fs-*`)

| Token | Default | Medium zoom | Large zoom | Use |
|-------|---------|-------------|------------|-----|
| `--fs-2xs` | 0.56rem | 0.644rem | 0.728rem | Tiny badges, micro labels |
| `--fs-xs` | 0.65rem | 0.748rem | 0.845rem | Meta text, timestamps |
| `--fs-sm` | 0.75rem | 0.863rem | 0.975rem | Section labels, chips, secondary |
| `--fs-base` | 0.85rem | 0.978rem | 1.105rem | Body text, daily card titles |
| `--fs-md` | 0.95rem | 1.093rem | 1.235rem | Card titles (base tier) |
| `--fs-lg` | 1.1rem | 1.265rem | 1.430rem | Action card titles |
| `--fs-xl` | 1.35rem | 1.553rem | 1.755rem | Hero card titles |
| `--fs-2xl` | 1.6rem | 1.840rem | 2.080rem | Score values, hero numbers |
| `--fs-3xl` | 2.0rem | 2.300rem | 2.600rem | Largest display values |

### Border Radius (`--r-*`)

| Token | Value | Use |
|-------|-------|-----|
| `--r-sm` | 4px | Subtle rounding, badges |
| `--r-md` | 8px | Icon containers, inputs |
| `--r-lg` | 12px | Daily cards |
| `--r-xl` | 14px | Daily card outer |
| `--r-2xl` | 20px | Cards, chips |
| `--r-full` | 9999px | Pills, avatar, circles |

### Icon Size (`--icon-*`)

| Token | Value | Use |
|-------|-------|-----|
| `--icon-xs` | 12px | Inline micro icons |
| `--icon-sm` | 14px | Daily card icons, compact |
| `--icon-base` | 16px | Standard icon size |
| `--icon-md` | 18px | Trend chip icons |
| `--icon-lg` | 22px | Hero card icons |

### Animation (`--ease-*`)

| Token | Value | Use |
|-------|-------|-----|
| `--ease-fast` | 0.15s ease | Micro-interactions, hover, chip toggle |
| `--ease-med` | 0.22s ease | Card transitions, tab switches |
| `--ease-slow` | 0.35s ease | Overlay open/close, page transitions |

### Line Height (`--lh-*`)

| Token | Value | Use |
|-------|-------|-----|
| `--lh-none` | 1 | Score values, single-line numbers |
| `--lh-tight` | 1.2 | Compact labels |
| `--lh-snug` | 1.3 | Card titles |
| `--lh-normal` | 1.4 | Meta text, section labels |
| `--lh-relaxed` | 1.5 | Body text, descriptions |

### Letter Spacing (`--ls-*`)

| Token | Value | Use |
|-------|-------|-----|
| `--ls-tight` | 0.02em | Compact labels |
| `--ls-normal` | 0.04em | Meta text, section labels |
| `--ls-wide` | 0.08em | Uppercase section headers |

### Domain Colors (light + dark)

| Domain | Light BG | Dark BG | Light Text | Dark Text |
|--------|----------|---------|------------|-----------|
| sage | #e8f5ef | #1e3028 | #3a7060 | #7ac0a0 |
| rose | #fde8ed | #3a2030 | #9e3e52 | #e090a8 |
| amber | #fef6e8 | #352e1e | #8a6520 | #d4a848 |
| lav | #f0ebfb | #2a2240 | #6e5e9a | #b8a8e0 |
| sky | #e8f4fa | #1e2838 | #336580 | #80b8d8 |
| indigo | #edf0fa | #252838 | #4a5080 | #a0b0e0 |
| peach | #fef3ea | #352820 | — | — |

### Surfaces

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `--bg` / `--body-bg` | `--cream` #fffaf7 | #1a1520 | Page background |
| `--surface` | `--white` #ffffff | #2a2230 | Card backgrounds |
| `--surface-alt` | `--warm` #fef6f0 | #221c28 | Alternate sections |
| `--glass` | rgba(255,255,255,0.5) | — | Translucent overlays |
| `--overlay-bg` | rgba(60,40,40,0.5) | rgba(10,5,15,0.7) | Modal scrims |

### Layout (fixed dimensions)

| Element | Value | Note |
|---------|-------|------|
| Tap target minimum | 36px | HR-8 floor |
| `.chip` min-height | 44px | Ideal tap target |
| Card padding (mobile) | 18px 16px | `.card` base |
| Card padding (desktop) | 22px 24px | `@media(min-width:500px)` |
| Max app width | 1100px | `.app` max-width |
| Accent border width | `--accent-w` 3px | Left-border on action cards |

---

## 8. Design Debt Log

**Source:** VISUAL_AUDIT.md (9 April 2026)

### Critical

| Item | Violation | Count | Fix |
|------|-----------|:-----:|-----|
| Missing spacing tokens | `--sp-2`, `--sp-6`, `--sp-10` used but undeclared | 171 refs | **FIXED 9 Apr 2026** — tokens added to :root |

### High — Chip wrapping

| Item | Violation | Count | Status |
|------|-----------|:-----:|--------|
| `.chip` generic — nowrap | HR-11 | 1 class | Open |
| `.qa-chip` — nowrap | HR-11 | 1 class | Open |
| `.outing-chip` — nowrap | HR-11 | 1 class | Open |
| `.dqp-pill` — nowrap | HR-11 | 1 class | Open |
| `.ql-freq-pill` — nowrap | HR-11 | 1 class | Open |
| `.ql-meal-pills` container — no flex-wrap | HR-11 | 1 class | Open |
| `.qa-chips` container — no flex-wrap | HR-11 | 1 class | Open |
| `.al-slot-chips` container — no flex-wrap | HR-11 | 1 class | Open |
| Duplicate `.sp-gap-chip` definition | Dead code | 2 defs | Open — delete L2529–2535 |

### Medium — Raw px

| Category | Raw px count | Token count | Adoption % | Priority |
|----------|:----------:|:-----------:|:----------:|----------|
| padding | 259 | 237 | 47% | Highest — fix when touching a file |
| gap | 29 | ~80 | 73% | Medium |
| font-size | 16 | ~200 | 93% | Low — mostly edge cases |
| margin | 12 | ~50 | 80% | Low |
| border-radius | 9 | ~100 | 92% | Low |

### Medium — Raw colors

| Type | Count | Priority |
|------|:-----:|----------|
| Raw `rgba()` not in token defs | ~523 lines | Ongoing — many are dark mode overrides |
| Raw `#hex` not in token defs | ~112 lines | Ongoing — convert when touching a file |

### Low — Cramped chip padding (raw px, < 6px vertical)

| Class | Current | Target | Status |
|-------|---------|--------|--------|
| `.trend-chip-delta` | `2px 8px` | `var(--sp-4) var(--sp-8)` | Open |
| `.info-food-chip` | `3px 10px` | `var(--sp-4) var(--sp-10)` | Open |
| `.sp-gap-chip` | `4px 12px` | `var(--sp-4) var(--sp-12)` | Open |
| `.sg-chip` | `3px 10px` | `var(--sp-4) var(--sp-10)` | Open |
| `.fe-action-chip` | `4px 10px` | `var(--sp-4) var(--sp-10)` | Open |
| `.sc-quick-chip` | `5px 12px` | `var(--sp-6) var(--sp-12)` | Open |
| `.fe-symptom-chip` | `6px 12px` | `var(--sp-6) var(--sp-12)` | Open |
| `.trend-chip` | `12px 14px` | `var(--sp-12) var(--sp-16)` | Open |
| `.trend-chip-detail` | `10px 14px 14px` | `var(--sp-10) var(--sp-16) var(--sp-16)` | Open |

### Low — Font family token not yet defined

`--ff-display` and `--ff-base` tokens are not in `:root`. Code currently uses raw `'Fraunces', serif` and `'Nunito', sans-serif`. Define tokens when a CSS refactor touches the font declarations.

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 9 Apr 2026 | Initial version. Forked from DESIGN_SYSTEM_TEMPLATE.md v1.0. Filled from styles.css audit (7,772 lines), template.html SVG sprite (54 icons), VISUAL_AUDIT.md. |

---

*This document is the canonical reference for SproutLab's visual design system. Every build session reads it before writing code. Update scores and debt log after every build.*
*Forked from DESIGN_SYSTEM_TEMPLATE.md v1.0.*
