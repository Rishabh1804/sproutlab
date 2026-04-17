# SproutLab — Roadmap
**Revised:** 10 April 2026 · Post Architecture Split + CareTickets Spec
**Current build:** v2.38 (55,367 lines · 1,055 functions · split architecture)
**Repo:** github.com/Rishabh1804/sproutlab
**Architecture:** 10 split files → `build.sh` → single-file PWA

---

## Guiding Principle

**From logbook to parenting intelligence.** Every feature either helps log data faster, surfaces insight from that data, or enables action from that insight. CareTickets is the first feature that closes the loop: insight → action → follow-up → resolution.

---

## What's Done (v2.0–v2.38)

25+ sessions · 39,073 → 55,367 lines · 755 → 1,055 functions

### Intelligence Layer (complete)
- Food Intelligence (intro rate, nutrient heatmap, combo frequency, smart pairings, synergy DB)
- Sleep Intelligence (8 cards — bedtime drift, regression detection, best night predictor)
- Poop Intelligence (8 cards)
- Medical Intelligence Phases 1–2 (illness frequency, vaccination correlation, supplement adherence, growth velocity, doctor visit prep)
- Cross-Domain Intelligence (6 cards)
- Evidence-Based Milestones (506 patterns, auto-promotion engine, activity logging)
- Vaccination Intelligence (reaction tracking, timeline, pattern analysis)

### Smart Features (complete)
- Smart Q&A Phase 1–2 (22 intents, 24 handlers, ISL summarization)
- Search Bar / UIB (multi-mode classifier, ingredient picker)
- Smart Quick Log + Food Favorites
- Today So Far (chronological timeline, warmth gradient, pattern nudges)
- Tomorrow's Prep (evening planning card)
- Outing Briefing
- Bug Capture System (3 capture paths, WhatsApp/clipboard export)
- Intelligence-Aware Scoring (80/20 base-modifier, ±10 cap)

### Code Quality (complete)
- Migration M1–M3 (emoji→zi, inline styles→CSS, onclick→data-action)
- Design Principles v3 (2,011 lines, locked)
- Architecture Split Phases 1–3 (10 files, build.sh verified byte-identical)
- SPEC_ITERATION_PROCESS.md (8-pass framework, generalized)

### Architecture (current split)

| File | Lines | Upload frequency |
|------|------:|-----------------|
| styles.css | ~7,770 | Rarely (CSS changes only) |
| template.html | ~2,830 | Rarely (HTML/icon changes) |
| data.js | ~2,980 | Never (pure constants) |
| core.js | ~4,775 | Most sessions |
| home.js | ~8,980 | Home/alert builds |
| diet.js | ~9,000 | Food/diet builds |
| medical.js | ~9,360 | Medical/sleep builds |
| intelligence.js | ~15,890 | QA/search/intelligence builds |
| start.js | ~150 | Rarely |
| build.sh | ~32 | Never |

---

## Build Queue

### 1. CareTickets ← NEXT BUILD
*Spec: `CARETICKETS_SPEC_v5.md` (1,089 lines, 310 scenarios, 8 criticals found+fixed, build-ready)*
*~2,130 lines · 4 sessions*

The first feature that closes the insight→action→resolution loop. Parent-initiated incident/goal tracking with notification-driven follow-ups and data-aware verdicts.

| Session | Scope | Lines | Files needed |
|:-------:|-------|:-----:|-------------|
| A | Foundation: KEYS, init, validation, templates, all data functions (verdict, metrics, utilities) | ~560 | core.js, intelligence.js, DESIGN_PRINCIPLES, CARETICKETS_SPEC |
| B | Home zone: template.html divs, 8 SVG icons, CSS classes, zone rendering, banner | ~400 | template.html, styles.css, home.js, intelligence.js |
| C | Overlays: template picker, check-in (form, chips, pre-fill, quick-clear, sticky submit), detail/history | ~590 | intelligence.js, styles.css |
| D | Notifications, scheduling, quiet hours, TSF integration, QA intent, export/import, disclaimers, toasts, error isolation | ~580 | intelligence.js, home.js, core.js |

**Key deliverables:** 21-field data model, 7 templates (seizure questions, medical priority ordering), split verdict logic (incident=answer-driven, goal=metric-driven), main-thread notification architecture, quiet hours, escalation with doctor tap-to-call, share summary for doctor visits.

### 2. Activity Logging Upgrade
*Spec: `ACTIVITY_UPGRADE_SPEC.md` (709 lines, 8-pass, build-ready)*
*~595 lines · 2 sessions*

| Session | Scope | Lines |
|:-------:|-------|:-----:|
| A | Time slots, duration chips, MILESTONE_ACTIVITIES, wiring, CSS | ~270 |
| B | Milestone suggestions, yesterday repeat, domain nudge, auto-upgrade | ~325 |

### 3. Snapshot Sharing (Text v1)
*~Late April · ~300 lines · Needs spec*
*2nd ISL consumer — validates the ISL API*
*Deadline: sister arriving ~mid-May*

### 4. EVIDENCE_PATTERNS Expansion
*~500 → 1,000+ patterns · 1 session · Needs spec*
*Hindi keyword expansion for classification engine*

### 5. Inline Insights + Parent Celebration
*Need specs · ~500 lines combined*

---

## Specs Inventory

| Spec | Status | Lines | Passes |
|------|:------:|:-----:|:------:|
| `CARETICKETS_SPEC_v5.md` | **Build-ready** | 1,089 | 8 (310 scenarios) |
| `ACTIVITY_UPGRADE_SPEC.md` | Build-ready | 709 | 8 |
| `SPEC_ITERATION_PROCESS.md` | Reference | 267 | — |
| `DESIGN_PRINCIPLES.md` (v3) | Reference | 551 | — |
| Snapshot Sharing | Needs spec | — | — |
| Inline Insights | Needs spec | — | — |
| Parent Celebration | Needs spec | — | — |

---

## Parallel Projects

### SEP Invoicing PWA
*Standalone app · `sep-invoicing.html` · Separate design system (`SEP_DESIGN_PRINCIPLES.md`)*
*Phases 1–3 built · Phase 4 (Incoming Material + Part Autocomplete) complete*
*FY 2026-27 invoicing active*

### SEP Dashboard v2.0
*Workforce management PWA · 8 hard rules matching SproutLab conventions*
*9-domain color system · Event delegation · Design principles established*

---

## Codebase Stats

| Metric | v2.19 | v2.38 | Post-CareTickets (est) |
|--------|:-----:|:-----:|:-----:|
| Lines | 39,073 | 55,367 | ~57,500 |
| Functions | 755 | 1,055 | ~1,130 |
| zi() icons | 54 | 54 | 62 (+8 new) |
| zi() calls | 209 | 1,788 | ~1,850 |
| Sessions | — | 25+ | ~29 |

---

## Design System Adoption

| System | Status |
|--------|--------|
| Domain colors (7) | Fully adopted |
| Card system (4 tiers) | Fully adopted |
| Chip system (.chip) | Adopted (v2.38+) |
| Section labels | Fully adopted |
| Overlay system (Read/Act/Flow) | Partially adopted — CareTickets adds 3 new |
| data-action delegation | Fully adopted (477 handlers converted) |
| zi() icon set | 54 icons, 8 pending (CareTickets) |
| CSS tokens (sp/fs/r) | ~80% adopted (design debt tracked) |
| Dark mode | Functional, all domain tokens have dark variants |
| Text zoom (3 tiers) | Functional |

---

## Design Debt

| Category | Count | Priority |
|----------|:-----:|----------|
| Raw padding (px) | 259 | Fix when touching file |
| Raw gap (px) | 29 | Medium |
| Raw rgba (not tokenized) | ~523 | Ongoing |
| Raw hex (not tokenized) | ~112 | Ongoing |
| Chip nowrap violations | 8 classes | Open |
| Font family tokens (--ff-*) | Not defined | Low |

---

## Known Assumptions to Monitor

| # | Assumption | Review by |
|---|-----------|-----------|
| 1 | CareTickets medical thresholds for 6–12 month infants | Sep 2026 (12 months) |
| 2 | Sleep score computation accuracy | Ongoing |
| 3 | normalizeFoodName quality as diet diversifies | Sep 2026 |
| 4 | localStorage total < 2MB | Dec 2026 |
| 5 | Weight velocity 80 g/week threshold | Sep 2026 |
| 6 | Quiet hours 10 PM–7 AM | As needed |

---

## Future (Phase 3+)

| Feature | When | Trigger |
|---------|------|---------|
| CareTickets Phase 2: auto-creation from data events | ~Jul 2026 | v1 validated |
| CareTickets Phase 2: age-adaptive thresholds | ~Sep 2026 | Ziva turns 12 months |
| CareTickets Phase 2: configurable quiet hours | As needed | Family schedule shifts |
| Multi-caretaker sync | Needs backend | Feature request |
| Firebase/FCM push (Tier 2 notifications) | Needs backend | Tier 1 limitations felt |
| Cross-Domain Correlation Engine | ~Aug 2026 | 90+ days data |
| Persistent ISL Caching | If needed | Summary >200ms |
| Template versioning (data-driven) | Phase 3 | Template change frequency |
| Score Popup + CareTickets integration | Phase 2 | CareTickets v1 validated |

---

## Build Workflow (Termux)

```bash
# 1. Upload relevant module(s) to Claude session
# 2. Download updated file(s) back to split/
# 3. Build:
cd ~/storage/shared/SproutLab/split && bash build.sh > ../sproutlab.html
# 4. Open sproutlab.html in browser
```

---

## Files for Next Session (CareTickets Session A)

1. `core.js` — from `SproutLab/split/`
2. `intelligence.js` — from `SproutLab/split/`
3. `CARETICKETS_SPEC_v5.md` — build-ready spec
4. `DESIGN_PRINCIPLES.md` — design system reference

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 19 Mar 2026 | Initial roadmap |
| 2.0 | 3 Apr 2026 | Post v2.20. Added intelligence layer, beta environment. |
| 3.0 | 8 Apr 2026 | Post v2.38. Added architecture split, search bar, vaccination, QL. |
| **4.0** | **10 Apr 2026** | **Post split Phases 1–3. Added CareTickets as next build (4 sessions). Updated codebase stats to split architecture. Added design debt + known assumptions tracking.** |
