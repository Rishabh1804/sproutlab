#!/bin/bash
# PR-8 (sl-3-pnpm-build): cd to script dir so the build can be invoked from any
# cwd (e.g. `pnpm build` from repo root). Internal cat/node calls remain
# relative to split/ as before; this just makes the cwd discipline implicit.
cd "$(dirname "$0")"
# HR-1 ship-gate: audit-emoji.sh blocks the build on emoji violations across
# split/ + any built root artifact. Redirect to stderr so the audit's PASS
# line doesn't pollute the HTML on stdout. Per Cipher Edict V round 2 §10 +
# Maren V-M-10 (PR #74 carry-forward).
if ! bash audit-emoji.sh >&2; then
  echo "BUILD ABORTED: HR-1 audit failed. Fix violations above before building." >&2
  exit 1
fi
# V-K-10 ship-gate: audit-icon-text.sh flags `(label|text|reason|detail): zi(`
# field-assignments — the canonical icon-data-shape leak class. PR-A landed
# iconText() in core.js as the canonical replacement; this lint catches future
# regressions. Stderr-redirected per audit-emoji.sh precedent.
if ! bash audit-icon-text.sh >&2; then
  echo 'BUILD ABORTED: V-K-10 icon-text audit failed. Adopt iconText() or annotate `// raw-html-ok`.' >&2
  exit 1
fi
# V-M-41 ship-gate: audit-resolve-shield.sh locks the `'Resolve'` btnText on
# the four symptom-resolve confirmAction callers in intelligence.js. The shield
# preserves the sage-domain label on health-restoration affirmations; without
# it the button falls back to generic 'Confirm', a tonal regression on a
# safety-tier illness-resolution surface. Per V-M-41 (Maren) + V-K-30 (Kael
# word-boundary doctrine) on PR #78. Stderr-redirected per ship-gate precedent.
if ! bash audit-resolve-shield.sh >&2; then
  echo "BUILD ABORTED: V-M-41 resolve-shield audit failed. Restore the explicit 'Resolve' btnText argument." >&2
  exit 1
fi
# PR-EF ship-gate: audit-viz-smoke.sh confirms the new visualization cards
# (infoFeedingIntakeCard, infoVaccGanttCard), chart containers (growthChartInfo,
# etc.), and CSS tokens (--cal-poor, --con-runny, --ms-emerging) are wired
# into the built HTML. Catches silent regressions where a viz wiring is
# removed without a build break.
if ! bash audit-viz-smoke.sh >&2; then
  echo "BUILD ABORTED: PR-EF viz-smoke audit failed. Restore the missing wiring." >&2
  exit 1
fi
# v3-3 HR-12 cipher-4 ship-gate: audit-hr12-v3-3.sh blocks raw `new Date(` /
# `Date.now(` / `Date.parse(` constructions inside the v3-3 engine surface
# (intelligence-correlate.js + the _resolveEventAnchor block in intelligence-isl.js)
# unless annotated `// HR-12-safe: <rationale>`. Spec: docs/specs/v3-3-engine-spine.md
# §HR-12 Test plan row 5. Stderr-redirected per audit-emoji.sh precedent.
if ! bash audit-hr12-v3-3.sh >&2; then
  echo "BUILD ABORTED: v3-3 HR-12 cipher-4 audit failed. Annotate or refactor." >&2
  exit 1
fi
# v3-5 Charter Extensibility ship-gate: audit-chip-taxonomy-v3-5.sh blocks
# ad-hoc tsf-event-{state} class strings outside the canonical registry
# (split/styles.css). Spec: docs/specs/v3-5-chip-taxonomy-tsf-story.md
# §Cross-surface adoption (build-time audit gate row). Charter CV3-006
# extensibility axis: data-state attribute is the single source of truth;
# class-bag drift is what the Charter explicitly rules out.
if ! bash audit-chip-taxonomy-v3-5.sh >&2; then
  echo "BUILD ABORTED: v3-5 chip-taxonomy audit failed. Migrate to data-state or annotate." >&2
  exit 1
fi
# v3-6 Charter Extensibility ship-gate: audit-card-priority-v3-6.sh blocks
# ad-hoc card-{urgent|notable|ambient} class strings outside the canonical
# registry (split/styles.css) AND verifies that every renderInfo* function
# in intelligence-cards.js that fetches its card wrapper also emits a tier
# via _setCardPriority. Spec: docs/specs/v3-6-card-priority.md §Build-time
# audit gate. Charter CV3-006 extensibility axis: data-card-priority is
# the single source of truth at the card tier (parallels v3-5 data-state
# at the chip tier).
if ! bash audit-card-priority-v3-6.sh >&2; then
  echo "BUILD ABORTED: v3-6 card-priority audit failed. Migrate to data-card-priority or annotate." >&2
  exit 1
fi
# milestone-engine-prep-v1 ship-gate (8th audit gate): audit-no-personalised-
# prediction-v1.sh blocks two cipher-honesty violation classes on the milestone
# surface — Scope B personalised-prediction prose ("Ziva will <verb> by …") and
# Scope A hardcoded source attribution ("(WHO)"/"(IAP)"/etc.) + V-M-115 unverified
# parenthetical ("(unverified)") in JS render code. Python regex engine (V-K-112
# floor) with self-test on 5 adversarial inputs at startup. Spec:
# docs/specs/milestone-engine-prep-v1.md §Build-time audit gate.
if ! bash audit-no-personalised-prediction-v1.sh >&2; then
  echo "BUILD ABORTED: milestone-engine-prep-v1 audit failed. Read clinical bands from row.source; never personalise; never render '(unverified)'." >&2
  exit 1
fi
# milestones-tab-v1 ship-gate (9th audit gate): audit-activity-categories-v1.sh
# blocks registry-fork drift on the 5-cat activity-domain vocabulary
# (motor/language/social/sensory/cognitive). Three banned patterns: array-
# literal permutations of category keys (≥3 of 5), `\bcatOrder\s*=` idiom,
# and parallel object-literal label tables (≥4 of 5 category keys outside
# the registry consumer pattern). Python regex (V-K-112 floor) + self-test.
# Opt-in escape `// activity-categories-ok: <rationale>` for genuine
# exemptions; pre-existing drift sites are marker-annotated pending follow-
# up dead-code-removal pass. Spec: docs/specs/milestones-tab-v1.md §Build-
# time audit gate. Charter CV3-006 extensibility axis: window.ACTIVITY_CATEGORIES
# in data.js is the single source of truth at the activity-domain tier
# (parallels v3-5 data-state at chip + v3-6 data-card-priority at card).
if ! bash audit-activity-categories-v1.sh >&2; then
  echo "BUILD ABORTED: milestones-tab-v1 audit failed. Consume ACTIVITY_CATEGORIES; never fork the registry." >&2
  exit 1
fi
# food-sub-tab-v1 F-2 ship-gate (10th audit gate): audit-feed-sheet-wiring-v1.sh
# blocks regressions that silently unwire the autofill rails or the
# structured-shape writer in the FOB → FEED Log Feed sheet. Six required-
# presence assertions: 4 template wraps (qlFeedRepeat/Combos/Items/Next),
# the _fdWriteStructuredMeal call in saveQLFeed, 7 F-2 handlers, 7 core.js
# dispatcher routes, ≥30 NUTRITION_QTY_DEFAULTS entries, ≥10 CURATED_COMBOS
# with all 4 slots covered. Together these enforce ratification #5's hard
# tap-budget (3-tap repeat / 4-tap combo / 6-tap novel) by guaranteeing the
# wiring that enables those budgets stays intact. Spec: docs/specs/food-
# sub-tab-v1.md §F-2. Charter CV3-006 warmth axis (friction reduction).
if ! bash audit-feed-sheet-wiring-v1.sh >&2; then
  echo "BUILD ABORTED: food-sub-tab-v1 F-2 wiring audit failed. Restore the FOB Feed sheet structural surface." >&2
  exit 1
fi
# food-sub-tab-v1 F-3 ship-gate (11th audit gate): audit-food-library-wiring-v1.sh
# blocks regressions that silently unwire the diet-tab Library surface — the
# search box, filter-chip rail, flattened results list, per-food detail sheet
# (nutrition + allergen/age + Chemistry fold), and the dispatch routes + lazy-
# render hook that drive them. Required-presence assertions across template.html
# + diet.js + core.js. Spec: docs/specs/food-sub-tab-v1.md §F-3. Charter CV3-006
# warmth axis: the Library is the parent-facing food-DB browse surface.
if ! bash audit-food-library-wiring-v1.sh >&2; then
  echo "BUILD ABORTED: food-sub-tab-v1 F-3 wiring audit failed. Restore the Library search/filter/detail-sheet surface." >&2
  exit 1
fi
# P0.1 food-effects sync ship-gate (12th audit gate): audit-food-effects-sync-v1.sh
# locks the three-layer safety spine — docs/research/food-effects.manifest.js
# (cited source) → data.js FOOD_EFFECTS (consequence card) → data.js AGE_RULES
# (the gate the card hangs off). Fails the build on three drift classes: an
# untraceable FOOD_EFFECTS claim with no manifest entry, a critical-tier
# manifest entry with no FOOD_EFFECTS record (silent gate), or a FOOD_EFFECTS
# key that doesn't word-boundary-resolve against AGE_RULES (orphan card). Node
# engine: extracts the live _lookupByFoodName from core.js + evals the three
# literals so the audit's matcher IS the product's matcher (no drift), with a
# green-but-empty self-test guard (exit 2). Lands before the 2nd food so the
# research→spine→surface pipeline is safe to exercise. Spec:
# docs/NEXT_SESSION_TARGET_2026-05-30.md §P0.1. Stderr-redirected per precedent.
if ! bash audit-food-effects-sync-v1.sh >&2; then
  echo "BUILD ABORTED: P0.1 food-effects sync audit failed. Reconcile FOOD_EFFECTS ↔ food-effects.manifest.js ↔ AGE_RULES." >&2
  exit 1
fi
# Phase 2 PR-3: bump manifest.json version (date-stamp + same-day counter)
# before HTML concat. Errors here go to stderr so stdout (HTML) stays clean.
node bump-version.mjs ../manifest.json
# Mode-2 maren-consult priority-1 build: regenerate docs/POOP_COLOR_REFERENCE.html
# from canonical token + override + lexicon sources. Stderr-redirected per
# audit-emoji.sh precedent. Per V-K-17 (Maren-elevated to load-bearing): the
# chart must stay byte-fresh against styles.css / medical.js / core.js or it
# misleads the audit motion at the exact moment the audit needs sharpest signal.
node build-poop-reference.mjs >&2
# Mode-2 maren-consult priority-2 build: regenerate docs/CARETICKET_STATE_MACHINE.html
# from canonical CARETICKETS_SPEC_v5.md §Lifecycle + intelligence.js ct* handler
# functions. V-M-28 audit-surface visualization — drift between the spec's
# 6 transitions and the implementation's status-assignment sites surfaces as
# block/should flags in the chart's drift report.
node build-careticket-state-machine.mjs >&2
cat <<'HEAD'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Ziva's Dashboard</title>
  <style>
HEAD
cat styles.css
cat <<'MID'
  </style>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<!-- Motion One — app-wide animation foundation (UMD build exposes window.Motion
     with animate / spring / timeline / stagger / inView). ~12kb gzipped; WAAPI
     wrapper from the Framer team. Adopted at the milestones-tab-v1 IMPL for
     production-quality tap-out/reorder + opens the door for richer animations
     across other tabs (sleep visualizations, growth ring draw-in, etc.).
     The library is OPT-IN at the call site — every animation entry-point
     checks `window.Motion` and falls back to CSS-class transitions if it
     hasn't loaded (offline parent on a flight, blocked CDN, etc.). Loaded
     after Chart.js so chart rendering takes priority on cold-start. -->
<script src="https://cdn.jsdelivr.net/npm/motion@10.18.0/dist/motion.min.js" defer></script>
</head>
<body>
MID
cat template.html
cat <<'SCRIPT'
<script>
SCRIPT
cat config.js
cat data.js
cat core.js
cat home.js
cat diet.js
cat medical.js
cat intelligence-isl.js
cat intelligence-qa.js
cat intelligence-qa-handlers.js
cat intelligence-illness.js
cat intelligence-correlate.js
cat intelligence-quicklog.js
cat intelligence-cards.js
cat intelligence-caretickets.js
cat sync.js
cat start.js
cat <<'FOOT'
</script>
</body>
</html>
FOOT
