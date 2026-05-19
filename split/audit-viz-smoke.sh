#!/usr/bin/env bash
# audit-viz-smoke.sh — PR-EF viz wiring smoke test
# Confirms that the new visualization cards / containers / CSS tokens
# introduced in PR-EF are actually wired into the built HTML. Catches
# silent regressions where a renderer is removed or a template section
# is accidentally deleted without breaking the build.
#
# Usage:   bash split/audit-viz-smoke.sh   (0 = pass)
# Returns: exit 0 if all expected ids/tokens present; exit 1 otherwise.
#
# Scope: scans built artifacts (index.html, sproutlab.html, split/sproutlab.html)
# rather than source files — viz registration is build-time wiring, not source
# semantics.

set -e
cd "$(dirname "$0")/.."

python3 - << 'PYEOF'
import os, sys

REQUIRED_CARD_IDS = [
    'infoFeedingIntakeCard',
    'infoVaccGanttCard',
]
REQUIRED_CONTAINER_IDS = [
    'infoFeedingIntakeChart',
    'infoVaccGanttChart',
    # V-M-18 amendment: 'growthChartInfo' canvas removed from info-tab card
    # (Chart.js percentile bands illegible at 200px; demoted to a Medical-tab
    # link). Audit gate no longer requires the ID.
]
REQUIRED_CSS_TOKENS = [
    '--cal-poor',
    '--cal-target',
    '--con-runny',
    '--ms-emerging',
    '--ms-mastered',
]

# Scope: source files. The wiring registration happens in template.html
# (card shells + canvas mount) and styles.css (CSS tokens). Built HTML
# would be a redundant downstream check; we want to catch missing wiring
# BEFORE the concat runs, so the audit is a pre-build gate not a post-build
# one.
TEMPLATE = 'split/template.html'
STYLES = 'split/styles.css'

for required in [TEMPLATE, STYLES]:
    if not os.path.exists(required):
        print(f'audit-viz-smoke: ERROR — required source {required} missing')
        sys.exit(1)

with open(TEMPLATE) as fh:
    tpl_src = fh.read()
with open(STYLES) as fh:
    css_src = fh.read()

missing = []
for cid in REQUIRED_CARD_IDS + REQUIRED_CONTAINER_IDS:
    if cid not in tpl_src:
        missing.append('id:' + cid + ' (expected in template.html)')
for tok in REQUIRED_CSS_TOKENS:
    if tok not in css_src:
        missing.append('token:' + tok + ' (expected in styles.css)')

if not missing:
    print(f'audit-viz-smoke: PASS ({len(REQUIRED_CARD_IDS) + len(REQUIRED_CONTAINER_IDS)} ids + {len(REQUIRED_CSS_TOKENS)} tokens) across template.html + styles.css')
    sys.exit(0)

print(f'audit-viz-smoke: missing {len(missing)} required wiring item(s)')
for m in missing:
    print('  -', m)
print()
print('PR-EF viz cards must be wired in template.html and CSS tokens in styles.css.')
print('See /root/.claude/plans/now-let-s-plan-our-sequential-planet.md §B-Gate.')
sys.exit(1)
PYEOF
