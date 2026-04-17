# SproutLab — Session Handoff
**Date:** 9 April 2026
**Session type:** Architecture / Documentation
**Build:** No version bump (no feature changes)

## What Was Built

This was a structural session — zero behavior changes, all architecture and documentation.

**SHARED_API.md (722 lines)** — Cross-module contract for the split-file architecture. Documents every function (286 cross-module refs), global variable, and constant that crosses module boundaries. Includes builder quick-reference ("I'm working on X, what do I upload?") and renderer routing table.

**Utility migration to core.js** — 13 functions moved from feature modules to core.js where they belong: `ageAt`, `preciseAge`, `getAgeInMonths`, `ageAtDate`, `daysBetween`, `_baseFoodName`, `normalizeFoodName`, `escAttr`, `isRealMeal` + `SKIPPED_MEAL`, `_offsetDateStr`, `addDays`, `formatTimeShort`, `capitalize`. Net: -556 lines from feature modules.

**Constants migration to data.js** — 4 pure-data constants moved: MILESTONE_TIDBITS (152 lines), SYMPTOM_DB (173), VACC_GUIDANCE (77), ESCALATING_TIPS (81). Total: 483 lines out of feature modules.

**Duplicate fix** — `undoLastActivity` removed from medical.js. Intelligence.js version kept (handles batch undo + TSF dirty marking).

**Spacing token fix** — `--sp-2`, `--sp-6`, `--sp-10` declared in `:root`. Were used 171 times but never defined — padding was silently resolving to 0. Immediately improved chip spacing across the app.

**Visual audit (VISUAL_AUDIT.md)** — Grep-driven audit of styles.css: chip wrapping issues (5 classes with bad nowrap, 3 containers missing flex-wrap), raw px counts (259 raw padding, 47% token adoption), 16 raw font-sizes, duplicate `.sp-gap-chip` definition, tap target check. Prioritized P0–P3.

**DESIGN_PRINCIPLES.md (550 lines)** — Forked from DESIGN_SYSTEM_TEMPLATE.md with zero placeholders. 7-domain color palette with light+dark values, 54 zi() icons, 4 card tiers, 22 CSS prefix families, 12 hard rules (template's 10 + HR-11 chip wrapping + HR-12 escHtml), full token reference with all 3 zoom tiers, format function registry, debt log with real counts from audit.

## Key Decisions

- **HR-11 added:** `white-space:nowrap` banned on variable-content chips. Not in the original template — SproutLab-specific rule born from the cramped chip bugs.
- **HR-12 added:** `escHtml()` on all user-sourced innerHTML made an explicit hard rule, not just a code quality check.
- **Font family tokens deferred:** `--ff-display` and `--ff-base` not yet in `:root`. Raw font strings used everywhere. Logged as low-priority debt — define when a CSS refactor touches fonts.
- **Constants blocked from data.js:** ALL_TIPS (359 lines), DYNAMIC_ACTIVITIES (122), SYNTHESIS_RULES (51) contain `zi()` calls, which isn't available when data.js loads. They stay in feature modules until someone refactors them to use string icon names instead.

## QA Audit

Not applicable — no feature code written. All changes verified via:
- Zero duplicate function definitions across all 5 modules
- Braces balanced in all files
- App tested after build — header age, food names, sleep times, milestone tidbits, symptom checker, vaccination guidance, activity undo all working

## Known Issues

- 5 chip classes still have `white-space:nowrap` on variable content (P1)
- 3 chip containers missing `flex-wrap:wrap` (P1)
- Duplicate `.sp-gap-chip` CSS definition (P1)
- 259 raw px padding declarations, 47% token adoption (P2, ongoing)
- ~523 raw rgba() lines, ~112 raw hex lines (P3, ongoing)

## Next Session Scope

Options in priority order:

1. **P1 chip wrapping QA session** — Fix the 5 nowrap chips + 3 containers + duplicate CSS. Small, grep-countable, high visual impact. Upload: styles.css only. ~30 minutes.
2. **Feature build** — Resume normal feature development. The architecture docs are done — upload DESIGN_PRINCIPLES.md + SHARED_API.md + core.js + target module.
3. **P2 padding tokenization** — Systematic raw px → `var(--sp-*)` conversion, scoped to one module's CSS per session.

## Files

| File | Location | Status |
|------|----------|--------|
| DESIGN_PRINCIPLES.md | `SproutLab/` | New |
| SHARED_API.md | `SproutLab/` | New |
| VISUAL_AUDIT.md | `SproutLab/` | New (reference) |
| core.js | `SproutLab/split/` | Modified (+72 lines) |
| home.js | `SproutLab/split/` | Modified (-277 lines) |
| medical.js | `SproutLab/split/` | Modified (-278 lines) |
| intelligence.js | `SproutLab/split/` | Modified (-1 line) |
| data.js | `SproutLab/split/` | Modified (+483 lines appended) |
| styles.css | `SproutLab/split/` | Modified (1 line — spacing tokens) |
| diet.js | `SproutLab/split/` | Unchanged |
