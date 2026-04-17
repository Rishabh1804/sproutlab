# SproutLab — Visual Audit Punch List
**Date:** 9 April 2026
**Source:** styles.css (7,772 lines), template.html (SVG sprite)
**Purpose:** Feed into DESIGN_PRINCIPLES.md debt log — separate "what is" from "what should be"

---

## CRITICAL: Undeclared Spacing Tokens

Three spacing tokens are **used 171 times but never declared in :root**:

| Token | Usage count | Effect |
|-------|:----------:|--------|
| `--sp-2` | 35 | Browser resolves to empty → falls back to `0` |
| `--sp-6` | 87 | Same — no padding/gap applied |
| `--sp-10` | 49 | Same |

**Fix:** Add to `:root` spacing block (line 52):
```css
--sp-2: 2px; --sp-4: 4px; --sp-6: 6px; --sp-8: 8px; --sp-10: 10px; --sp-12: 12px;
```

**Risk:** HIGH — this affects 171 layout declarations right now. Some will visually change when the tokens start resolving to their intended values, so a visual spot-check is needed after the fix.

---

## 1. Chip Wrapping Issues

### Chips with white-space:nowrap that contain variable-length text

| Class | Line | Content type | Fix |
|-------|:----:|-------------|-----|
| `.chip` (generic) | 3353 | Food names, milestone text | Remove `white-space:nowrap` |
| `.qa-chip` | 5947 | QA suggestion questions | Remove `white-space:nowrap` |
| `.outing-chip` | 6309 | Outing item names | Remove `white-space:nowrap` |
| `.dqp-pill` | 2803 | Food names (diet quick picker) | Remove `white-space:nowrap` |
| `.ql-freq-pill` | 5420 | Frequent food names | Remove `white-space:nowrap` |

### Chip containers missing flex-wrap

| Container | Line | Fix |
|-----------|:----:|-----|
| `.ql-meal-pills` | 5451 | Add `flex-wrap:wrap` |
| `.qa-chips` | 5937 | Add `flex-wrap:wrap` |
| `.al-slot-chips` | 6880 | Add `flex-wrap:wrap` |

### Chips with cramped padding (raw px, < 6px vertical)

| Class | Line | Current | Suggested |
|-------|:----:|---------|-----------|
| `.trend-chip-delta` | 2292 | `2px 8px` | `var(--sp-2) var(--sp-8)` |
| `.info-food-chip` | 2381 | `3px 10px` | `var(--sp-4) var(--sp-10)` |
| `.sp-gap-chip` | 2529 | `2px 8px` | `var(--sp-4) var(--sp-8)` |
| `.sp-gap-chip` (dupe!) | 2613 | `4px 12px` | `var(--sp-4) var(--sp-12)` |
| `.sg-chip` | 2816 | `3px 10px` | `var(--sp-4) var(--sp-10)` |
| `.fe-action-chip` | 2907 | `4px 10px` | `var(--sp-4) var(--sp-10)` |
| `.sc-quick-chip` | 5656 | `5px 12px` | `var(--sp-6) var(--sp-12)` |
| `.al-chip .al-chip-x` | 5185 | `0 2px` | `0 var(--sp-4)` |
| `.mi-chip` | 5852 | `var(--sp-2) var(--sp-8)` | OK if --sp-2 gets declared |

---

## 2. Raw px Debt Summary

| Property | Raw px count | Token count | Adoption % |
|----------|:----------:|:-----------:|:----------:|
| **padding** | 259 | 237 | 47% |
| **font-size** | 16 | ~200+ | 93% |
| **gap** | 29 | ~80+ | 73% |
| **margin** | 12 | ~50+ | 80% |
| **border-radius** | 9 | ~100+ | 92% |

**padding is the biggest gap** — nearly half of all padding declarations use raw px.

### Raw font-size (16 instances)

| Line | Class | Value | Issue |
|:----:|-------|-------|-------|
| 121 | `input, textarea, select` | `16px !important` | iOS zoom prevention — acceptable exception |
| 1044 | (vacc timeline dot) | `6px` | Too small for any token — exception |
| 2520 | `.sp-domain-label` | `10px` | → `var(--fs-2xs)` |
| 2569 | `.sp-bar-label` | `9px` | Below smallest token — needs `--fs-3xs` or exception |
| 2604 | `.sp-domain-label` (variant) | `10px` | → `var(--fs-2xs)` |
| 2674 | `.mi-frt-event` | `10px` | → `var(--fs-2xs)` |
| 2711 | `.mi-tex-week-grid` | `10px` | → `var(--fs-2xs)` |
| 2741 | `.hy-cell` | `10px` | → `var(--fs-2xs)` |
| 5551 | `.ql-suggest-time` | `15px` | → `var(--fs-md)` |
| 7022 | iOS zoom override | `16px !important` | iOS exception — keep |

### Raw rgba() colors: ~523 lines

Most are in dark mode overrides and vacc severity states. Many could be replaced with surface tokens, but scope is large — flag as ongoing, not urgent.

### Raw #hex colors: ~112 lines

Scattered across feature-specific styling. Lower priority than padding tokenization.

---

## 3. Duplicate CSS Definition

`.sp-gap-chip` is defined **twice** with different values:

| Line | padding | Other |
|:----:|---------|-------|
| 2529 | `2px 8px` | First definition |
| 2613 | `4px 12px` | Second definition (wins) |

**Fix:** Delete the first one (L2529–2535).

---

## 4. Token System Status

### Declared Tokens (complete set)

**Spacing:** `--sp-4(4) --sp-8(8) --sp-12(12) --sp-16(16) --sp-20(20) --sp-24(24) --sp-32(32)`
**MISSING:** `--sp-2(2) --sp-6(6) --sp-10(10)` ← used 171 times!

**Font size:** `--fs-2xs --fs-xs --fs-sm --fs-base --fs-md --fs-lg --fs-xl --fs-2xl --fs-3xl`
(3 tiers for text zoom: default, medium, large)

**Radius:** `--r-sm(4) --r-md(8) --r-lg(12) --r-xl(14) --r-2xl(20) --r-full(9999)`

**Icon size:** `--icon-xs(12) --icon-sm(14) --icon-base(16) --icon-md(18) --icon-lg(22)`

**Line height:** `--lh-none(1) --lh-tight(1.2) --lh-snug(1.3) --lh-normal(1.4) --lh-relaxed(1.5)`

**Letter spacing:** `--ls-tight(0.02em) --ls-normal(0.04em) --ls-wide(0.08em)`

**Animation:** `--ease-fast(0.15s) --ease-med(0.22s) --ease-slow(0.35s)`

### Domain Colors

| Domain | Light BG | Text Color | Surface |
|--------|----------|------------|---------|
| sage | `--sage-light` #e8f5ef | `--tc-sage` #3a7060 | `--surface-sage` |
| rose | `--rose-light` #fde8ed | `--tc-rose` #9e3e52 | `--surface-rose` |
| amber | `--amber-light` #fef6e8 | `--tc-amber` #8a6520 | `--surface-amber` |
| lav | `--lav-light` #f0ebfb | `--tc-lav` #6e5e9a | `--surface-lav` |
| sky | `--sky-light` #e8f4fa | `--tc-sky` #336580 | `--surface-sky` |
| indigo | `--indigo-light` #edf0fa | `--tc-indigo` #4a5080 | — |
| peach | `--peach-light` #fef3ea | — | — |

**Status triad:**
| Status | Surface | Text |
|--------|---------|------|
| Good | `--surface-sage` | `--tc-sage` |
| Caution | `--surface-warn` / `--surface-caution` | `--tc-caution` / `--tc-warn` |
| Danger | `--surface-danger` | `--tc-danger` |

### zi() Icon Set (54 icons)

```
baby balloon bars bell bolt book bowl brain bulb camera chart chat check
chef clock crystal diaper dot-red drop flame flask halfcircle handshake
hourglass info link list lotus medical moon note palette party pill
rainbow ruler run scale scope shield siren sleep sparkle spoon sprout
star steth sun syringe target timer trophy warn zzz
```

---

## 5. white-space:nowrap Audit (32 instances total)

### OK to nowrap (fixed-length labels, navigation)
`.tab-btn` `.track-sub-btn` `.settings-tab` `.sp-tab` `.al-dur-chip` `.ql-intake-pill` `.ms-action-btn` `.vc-sm-btn` `.hero-weather-pill` `.day-label` `.supp-check-btn` `.supp-skip-btn` `.mi-inline-btn`

### Should remove nowrap (variable content or can wrap)
`.chip` (generic) `.qa-chip` `.outing-chip` `.dqp-pill` `.ql-freq-pill` `.food-tag-name` `.dqp-same`

### Evaluate case by case
`.nh-label` `.hy-label` `.ms-active-obs` `.ms-active-override` `.al-feed-meta` `.ai-velocity-rate` `.ai-corr-val` `.mi-frt-event` `.ai-item-badge`

---

## 6. Tap Target Concerns

The generic `.chip` class has `min-height:44px` (good).

Classes with small min-height that are **not interactive** (data display only — OK):
`.nh-cell(28)` `.mb-weekly-cell(22)` `.mi-tl-row(28)` `.mi-sleep-cell(24)` `.mi-tex-week-cell(20)` `.hy-cell(28)` `.info-intro-bar(3)` `.si-ww-block(32)`

`.btn-compact` at `min-height:32px` is the only interactive element below 36px. Evaluate whether it's tappable in practice.

---

## 7. Recommended Fix Priority

### P0 — Fix immediately (breaks layout)
1. **Declare missing spacing tokens** `--sp-2`, `--sp-6`, `--sp-10` (1 line fix, 171 declarations affected)

### P1 — Fix in next QA session (wrapping bugs)
2. Remove `white-space:nowrap` from 5 chip classes with variable content
3. Add `flex-wrap:wrap` to 3 chip containers
4. Delete duplicate `.sp-gap-chip` definition

### P2 — Systematic debt reduction (ongoing)
5. Tokenize raw px padding (259 instances → target 50% reduction per session)
6. Tokenize raw px gap (29 instances)
7. Replace 8 raw font-sizes with tokens
8. Consolidate raw rgba() toward surface tokens

### P3 — Design polish (when touched)
9. Standardize cramped chip padding to minimum `var(--sp-4) var(--sp-8)`
10. Evaluate nowrap on edge-case classes

---

*This punch list feeds into SproutLab DESIGN_PRINCIPLES.md §8 (Debt Log). Rules go in the principles. Current violations go in the debt log.*
