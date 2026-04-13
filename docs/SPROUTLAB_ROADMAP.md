# SproutLab — Roadmap
**Revised:** 11 April 2026 · Post Activity Upgrade v2.42
**Current build:** v2.42 (~60,500 lines · ~1,155 functions · split architecture)
**Repo:** github.com/Rishabh1804/sproutlab
**Live:** https://rishabh1804.github.io/sproutlab/
**Architecture:** 10 split files → `build.sh` → single-file PWA

---

## Guiding Principle

**From logbook to parenting intelligence.** Every feature either helps log data faster, surfaces insight from that data, or enables action from that insight. CareTickets is the first feature that closes the loop: insight → action → follow-up → resolution.

---

## What's Done (v2.0–v2.39)

29 sessions · 39,073 → ~57,500 lines · 755 → ~1,155 functions

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
- **Activity Logging Upgrade v2.42 (8 Apr 2026, Sessions A+B):**
  - Session A: Time slots (morning/afternoon/evening/night), duration chips (5/10/15/20/30/45/60 min), MILESTONE_ACTIVITIES data (506 patterns mapped), evidence classifier, form wiring
  - Session B: Milestone-driven suggestions (top 3, domain-colored, dedup), yesterday repeat (domain-diverse top 3, batch undo), domain balance nudge (14-day scan, 0.5× threshold), auto-upgrade prompt (post-save, cooldown), `_alAttrSafe()` for JSON-in-attribute safety
  - 4 QA rounds, 11 bugs caught (invented tokens, `escHtml` `"` gap, invalid zi() icons, sage-only colors → 5-domain cascade)
  - QA_GATE_SPEC.md created (three-gate system for all future builds)

### CareTickets v1 (Sessions A–D, complete)
- **Phase A:** Data engine — 7 templates (fall, bump_head, ingestion, sleep_improve, weight_gain, feeding_variety, custom), 21-field ticket model, split verdict logic (incident=answer-driven, goal=metric-driven), illness-aware metric functions, validation + pruning (~560 lines)
- **Phase B:** Home zone rendering — entry point chip, follow-up banner (single + count-based), zone cards (max 3, sorted), 8 new SVG icons, all `ct-*` CSS classes (~400 lines)
- **Phase C:** Overlays + interaction — template picker (Flow), check-in with pre-fill/quick-clear/sticky submit (Flow), detail/history (Read), escalation card with doctor tap-to-call, de-escalation prompt, force-resolve, 24-action switch router (~590 lines)
- **Phase D:** Notifications + integration — `setTimeout` scheduling with 5 guards (exhausted/overflow/concurrent/visibility/permission), quiet hours (10PM–7AM, escalated bypasses), system Notification API, deep link (`?ct=`), TSF integration, `ct_create` QA intent, multi-tab sync via storage events, export/import, bug capture integration (~395 lines)
- **Bugfix:** `#ctStorageWarning` → `#ctStorageWarn` div ID mismatch

### Code Quality (complete)
- Migration M1–M3 (emoji→zi, inline styles→CSS, onclick→data-action)
- Design Principles v3 (2,011 lines, locked) → v1.1 update (10 Apr 2026)
- Architecture Split Phases 1–3 (10 files, build.sh verified byte-identical)
- SPEC_ITERATION_PROCESS.md (8-pass framework, generalized)
- **UX Cleanup v2.40 (10 Apr 2026):**
  - Phase 1: 14 spacing fixes — section gaps, card/chip/tab padding tokenized
  - Phase 2: 458-line bulk token migration (raw px → `--sp-*` tokens)
  - SVG bug fix in Growth↔Diet nutrient rows (`_cdBarHtml` rawLabel)
  - Domain hero HR-2/HR-3 cleanup (inline styles/onclick → CSS classes/data-action)
  - Domain-tinted cards and hero pills (warm-to-domain gradient)
  - Empty stat card wrappers removed (6 tabs)
  - Footer: "Built for Ziva ❤️"

### Architecture (current split)

| File | Lines | Upload frequency |
|------|------:|-----------------|
| styles.css | ~8,100 | Rarely (CSS changes only) |
| template.html | ~2,840 | Rarely (HTML/icon changes) |
| data.js | ~3,065 | Never (pure constants) |
| core.js | ~4,703 | Most sessions |
| home.js | ~9,260 | Home/alert builds |
| diet.js | ~9,000 | Food/diet builds |
| medical.js | ~9,640 | Medical/sleep builds |
| intelligence.js | ~15,890 | QA/search/intelligence builds |
| start.js | ~9 | Rarely |
| build.sh | ~38 | Never |

---

## Build Queue

### 1. Device Sync (Firebase + Log Master) ← NEXT BUILD
*Needs spec · ~2–3 sessions*
*Backend: Firebase Firestore (free tier). Real-time sync, offline-first, conflict resolution.*
*Log master: who updated what — tracks caretaker attribution per entry.*
*Trigger: wife is primary daily user, Rishabh is builder — need multi-device access.*

### 2. Snapshot Sharing (Text v1)
*~Late April · ~300 lines · Needs spec*
*2nd ISL consumer — validates the ISL API*
*Deadline: sister arriving ~mid-May*

### 3. EVIDENCE_PATTERNS Expansion
*~500 → 1,000+ patterns · 1 session · Needs spec*
*Hindi keyword expansion for classification engine*

### 4. Inline Insights + Parent Celebration
*Need specs · ~500 lines combined*

### 5. CareTickets Phase 2
*Depends on: v1 usage feedback over 2–4 weeks*

- `ctViewAll` / `ctViewOverdue` list overlay (currently "Coming soon" stubs)
- Score Popup integration (CT status in domain scores)
- Tomorrow's Plan awareness (upcoming follow-ups in evening card)
- Outing Planner awareness (pause non-urgent follow-ups)
- Configurable quiet hours
- Age-adaptive thresholds (currently 6–12 months)
- Auto-ticket creation from data events
- Adaptive notification frequency
- Custom metric binding
- Illness-type incident templates (link to existing episode system)

---

## Specs Inventory

| Spec | Status | Lines | Passes |
|------|:------:|:-----:|:------:|
| `CARETICKETS_SPEC_v5.md` | **Complete (shipped)** | 1,089 | 8 (310 scenarios) |
| `ACTIVITY_UPGRADE_SPEC.md` | **Complete (shipped)** | 709 | 8 |
| `QA_GATE_SPEC.md` | Reference (NEW) | — | — |
| `SPEC_ITERATION_PROCESS.md` | Reference | 267 | — |
| `DESIGN_PRINCIPLES.md` (v1.1) | Reference | 551 | — |
| Device Sync | Needs spec | — | — |
| Snapshot Sharing | Needs spec | — | — |
| Inline Insights | Needs spec | — | — |
| Parent Celebration | Needs spec | — | — |

---

## Parallel Projects

### SEP Invoicing PWA
*Standalone app · `sep-invoicing.html` · Separate design system (`SEP_DESIGN_PRINCIPLES.md`)*
*Phases 1–4 built · Phase 2 next (Invoice Register + GST Export)*
*FY 2026-27 invoicing active*

### SEP Dashboard v2.0
*Workforce management PWA · 8 hard rules matching SproutLab conventions*
*9-domain color system · Event delegation · Design principles established*

---

## Codebase Stats

| Metric | v2.19 | v2.38 | v2.39 | v2.40 | v2.42 (current) |
|--------|:-----:|:-----:|:-----:|:-----:|:-----:|
| Lines | 39,073 | 55,367 | ~57,500 | ~57,700 | ~60,500 |
| Functions | 755 | 1,055 | ~1,130 | ~1,130 | ~1,155 |
| zi() icons | 54 | 54 | 62 | 62 | 62 |
| zi() calls | 209 | 1,788 | ~1,850 | ~1,850 | ~1,850 |
| Raw px (padding) | — | — | 259 | ~44 (1px only) | ~44 (1px only) |
| Sessions | — | 25+ | 29 | 30 | 32 |

---

## Design System Adoption

| System | Status |
|--------|--------|
| Domain colors (7) | Fully adopted |
| Card system (4 tiers) | Fully adopted |
| Chip system (.chip) | Adopted (v2.38+) |
| Section labels | Fully adopted |
| Overlay system (Read/Act/Flow) | Fully adopted — CareTickets added 3 new (picker=Flow, check-in=Flow, detail=Read) |
| data-action delegation | Fully adopted (477 converted + 24 CT actions) |
| zi() icon set | 62 icons (54 base + 8 CareTickets: fall, bump, alert-circle, trending-up, goal, clipboard, follow-up, resolve) |
| CSS tokens (sp/fs/r) | ~95% adopted (458-line bulk migration, 44 remaining are 1px exceptions) |
| Dark mode | Functional, all domain tokens + domain-tinted cards have dark variants |
| Text zoom (3 tiers) | Functional |

---

## Design Debt

| Category | Count | Priority |
|----------|:-----:|----------|
| Raw padding (px) | ~44 (all 1px) | Resolved — remaining are valid exceptions |
| Raw gap (px) | ~5 | Low |
| Raw rgba (not tokenized) | ~523 | Ongoing |
| Raw hex (not tokenized) | ~112 | Ongoing |
| Chip nowrap violations | 8 classes | Open |
| Font family tokens (--ff-*) | Not defined | Low |
| styles.css dead Session B CSS | ~900 lines | Clean up next CSS touch |
| `escHtml()` missing `"` escaping | Systemic | Low (workaround: `_alAttrSafe()`) |
| 4 `data-action` names not following convention | 4 | Low (migrate when touched) |
| `ctViewAll`/`ctViewOverdue` stubs | 2 | CT Phase 2 |
| 5 inline `style=` in intelligence.js | 5 | Low (legacy weekly milestones table) |
| Diet suggestion emojis (🍓🍎) | ~4 | Low (pre-existing) |

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
| 7 | CareTickets data ~100KB at 6 months | Oct 2026 |
| 8 | Single-device acceptable for v1 | Mid-May (sister visit) |

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
| Doctor-facing export | ~May 2026 | Next pediatrician visit |
| Historical analytics on CareTickets data | ~Jul 2026 | 90 days of CT data |

---

## Build Workflow (Termux)

```bash
# 1. Upload relevant module(s) to Claude session
# 2. Download updated file(s) to ~/storage/downloads/
# 3. Move to split/:
mv ~/storage/downloads/styles.css ~/storage/shared/SproutLab/split/styles.css
# 4. Build (MUST use build.sh — never raw cat):
cd ~/storage/shared/SproutLab/split && bash build.sh > sproutlab.html
# 5. Preview sproutlab.html in browser BEFORE deploying
# 6. Deploy + push:
cp sproutlab.html ../index.html && cp sproutlab.html ../sproutlab.html
cd .. && git add split/ index.html sproutlab.html
git commit -m "Build vX.XX — description" && git push
```

**⚠ LESSON (10 Apr 2026):** A naive `cat template.html styles.css core.js...` broke the app — raw CSS/JS rendered as text because `<style>`/`<script>` wrappers were missing. `build.sh` handles these wrappers. Always use `build.sh`. If a broken build reaches `index.html`, revert with `git checkout HEAD~N -- index.html`.

**Termux notes:**
- Repo path: `~/storage/shared/SproutLab/`
- Use `git --no-pager` for all git commands (pager not configured)
- Downloads: `~/storage/downloads/` — use `mv` not `cp`

---

## Files for Next Session (Device Sync — spec needed first)

1. `QA_GATE_SPEC.md` — build QA gate system
2. `DESIGN_PRINCIPLES.md` — design system reference
3. This handoff
4. All split files will likely be needed once spec is ready

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 19 Mar 2026 | Initial roadmap |
| 2.0 | 3 Apr 2026 | Post v2.20. Added intelligence layer, beta environment. |
| 3.0 | 8 Apr 2026 | Post v2.38. Added architecture split, search bar, vaccination, QL. |
| 4.0 | 10 Apr 2026 | Post split Phases 1–3. Added CareTickets as next build (4 sessions). Updated codebase stats to split architecture. Added design debt + known assumptions tracking. |
| **5.0** | **11 Apr 2026** | **CareTickets v1 shipped (Phases A–D, ~2,130 lines, 4 sessions). Moved to "Done". Updated stats (62 icons, ~1,130 functions, ~57,500 lines). Activity Logging Upgrade now #1 in queue. Added CT Phase 2 as #5 (pending usage feedback). Added assumption #7–8. Updated design system adoption (overlay system fully adopted, 501 data-action handlers).** |
| **6.0** | **10 Apr 2026** | **UX Cleanup session → v2.40. Phase 1 spacing (14 fixes), Phase 2 bulk token migration (458 lines), SVG bug fix, domain hero HR-2/HR-3 cleanup, domain-tinted cards/pills, empty stat wrappers removed. Design debt raw padding 259→44. CSS token adoption ~80%→~95%. Device Sync (Firebase) added as #2 in queue. Build workflow lesson documented.** |
| **7.0** | **11 Apr 2026** | **Activity Logging Upgrade shipped (8 Apr, Sessions A+B, ~945 lines, 20 new functions). Moved to "Done" under Smart Features. Device Sync now #1 in queue. Updated stats (~60,500 lines, ~1,155 functions, 32 sessions). Added QA_GATE_SPEC.md. New design debt: dead CSS (~900 lines), `escHtml` `"` gap, 4 naming convention violations. Added live URL.** |
