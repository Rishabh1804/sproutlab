#!/usr/bin/env bash
# audit-chip-taxonomy-v3-5.sh — Charter Extensibility gate for v3-5.
# Spec: docs/specs/v3-5-chip-taxonomy-tsf-story.md §Cross-surface adoption
# (build-time audit gate row) + §Functional tests — chip-state taxonomy
# (regression-guard-v3-5-no-adhoc-class-strings row).
#
# Greps the split/ source for ad-hoc tsf-event-{skipped|late|inferred|live|
# done|calm|urgent|pending} class strings outside the canonical registry.
# Under v3-5 the chip-state attribute (data-state="...") is the single
# source of truth; class-bag drift is what the Charter Extensibility axis
# explicitly rules out (CV3-006).
#
# Opt-in escape: `// chip-taxonomy-ok:` or `/* chip-taxonomy-ok: */` on
# the same line — mirrors the `// HR-12-safe:` / `// raw-html-ok` convention.
#
# Usage:   bash split/audit-chip-taxonomy-v3-5.sh   (0 = pass)

set -e
cd "$(dirname "$0")/.."

python3 - << 'PYEOF'
import re, sys, os

# Class strings the v3-5 registry has migrated to data-state attributes.
# These must not appear as standalone classes anywhere outside the registry
# CSS itself. The audit also catches `data-calm="true"` which was the
# previous live-but-quiet discriminator.
banned = [
    r'\btsf-event-inferred\b',
    r'\btsf-event-live\b',
    r'\btsf-event-skipped\b',
    r'\btsf-event-late\b',
    r'\btsf-event-done\b',
    r'\btsf-event-calm\b',
    r'\btsf-event-urgent\b',
    r'\btsf-event-pending\b',
    r'data-calm="true"',
]
pattern = re.compile('|'.join(banned))

# Opt-in marker — must be `chip-taxonomy-ok` on the SAME line.
allow_marker = re.compile(r'chip-taxonomy-ok\s*[:.]?')

# Scope: every file in split/ EXCEPT styles.css (the registry's home — the
# CSS may legitimately reference the legacy class names inside historical
# block comments). This audit script itself is also exempted.
SCAN_DIR = 'split'
EXEMPT = {
    'split/styles.css',                       # registry block comments
    'split/audit-chip-taxonomy-v3-5.sh',      # this file
}

total_hits = 0
per_file = {}

for entry in sorted(os.listdir(SCAN_DIR)):
    path = os.path.join(SCAN_DIR, entry).replace(os.sep, '/')
    if not os.path.isfile(path):
        continue
    if path in EXEMPT:
        continue
    # Only scan source-bearing extensions
    if not path.endswith(('.js', '.css', '.html', '.mjs')):
        continue
    with open(path) as fh:
        lines = fh.read().split('\n')
    hits = []
    for i, line in enumerate(lines):
        if not pattern.search(line):
            continue
        if allow_marker.search(line):
            continue
        hits.append((i + 1, line.strip()[:140]))
    if hits:
        per_file[path] = hits
        total_hits += len(hits)

if total_hits == 0:
    print('audit-chip-taxonomy-v3-5: PASS (no ad-hoc tsf-event-{state} class strings outside registry)')
    sys.exit(0)

print(f'audit-chip-taxonomy-v3-5: FAIL ({total_hits} ad-hoc hit(s) across {len(per_file)} file(s))')
for path, hits in per_file.items():
    print(f'  {path}: {len(hits)} hit(s)')
    for ln, ctx in hits:
        print(f'    {path}:{ln}: {ctx}')
print()
print('Resolution: route chip-state through the data-state attribute. The deriver')
print('lives in _tsfDeriveChipState (intelligence-quicklog.js). If a legitimate')
print('reference is required (e.g. a historical comment), annotate the line with')
print('`// chip-taxonomy-ok: <rationale>` to document the carve-out.')
sys.exit(1)
PYEOF
