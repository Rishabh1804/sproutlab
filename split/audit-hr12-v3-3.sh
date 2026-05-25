#!/usr/bin/env bash
# audit-hr12-v3-3.sh — HR-12 cipher-4 gate for v3-3 engine primitives.
# Spec: docs/specs/v3-3-engine-spine.md §HR-12 Test plan row 5.
#
# Greps for `new Date(` / `Date.now(` / `Date.parse(` inside the v3-3 surface:
#   - split/intelligence-correlate.js  (entire file is v3-3)
#   - split/intelligence-isl.js        (only the _resolveEventAnchor block)
#
# Any direct Date construction fails the build unless explicitly annotated
# with `// HR-12-safe:` (or `// HR-12:`) on the same line — mirroring the
# `// raw-html-ok` opt-in convention used by audit-icon-text.sh.
#
# Charter CV3-006 (honesty): the gate is mechanical, not subjective — every
# date-construction must self-disclose its rationale or fail the build.
#
# Usage:   bash split/audit-hr12-v3-3.sh   (0 = pass)

set -e
cd "$(dirname "$0")/.."

python3 - << 'PYEOF'
import re, sys

# Disallowed constructors (each fails unless the line carries the HR-12 marker).
pattern = re.compile(r'\b(new\s+Date\s*\(|Date\.now\s*\(|Date\.parse\s*\()')

# Opt-in marker — must be `// HR-12` or `// HR-12-safe` on the SAME line.
allow_marker = re.compile(r'//\s*HR-12(?:-safe)?\s*[:.]?')

# Scopes:
#   - intelligence-correlate.js — every line in this file is v3-3.
#   - intelligence-isl.js       — only lines inside the _resolveEventAnchor block
#     are v3-3 additions. Other parts pre-date the gate; bracket by sentinel
#     banner markers introduced by this PR.
files_full = ['split/intelligence-correlate.js']
files_bracketed = [
    ('split/intelligence-isl.js',
     '_resolveEventAnchor — v3-3',
     '// ── Step 2: getDomainData(\'sleep\') ──'),
]

total_hits = 0
per_file = {}

def scan(path, start_line=0, end_line=None):
    global total_hits
    with open(path) as fh:
        lines = fh.read().split('\n')
    if end_line is None:
        end_line = len(lines)
    hits = []
    for i in range(start_line, end_line):
        line = lines[i]
        if not pattern.search(line):
            continue
        if allow_marker.search(line):
            continue
        # Strip line comments to avoid false positives on documentation.
        code = line.split('//', 1)[0]
        if not pattern.search(code):
            continue
        hits.append((i + 1, line.strip()[:140]))
    if hits:
        per_file[path] = hits
        total_hits += len(hits)

for path in files_full:
    scan(path)

for path, start_marker, end_marker in files_bracketed:
    with open(path) as fh:
        lines = fh.read().split('\n')
    start_idx, end_idx = None, None
    for i, line in enumerate(lines):
        if start_idx is None and start_marker in line:
            start_idx = i
        elif start_idx is not None and end_marker in line:
            end_idx = i
            break
    if start_idx is None:
        # Sentinel missing — fail loud rather than silently passing.
        print(f'audit-hr12-v3-3: FAIL ({path} is missing the start sentinel "{start_marker}")')
        sys.exit(1)
    if end_idx is None:
        end_idx = len(lines)
    scan(path, start_idx, end_idx)

if total_hits == 0:
    print('audit-hr12-v3-3: PASS (0 unannotated `new Date(` / `Date.now(` / `Date.parse(` in v3-3 surface)')
    sys.exit(0)

print(f'audit-hr12-v3-3: FAIL ({total_hits} unannotated hit(s) across {len(per_file)} file(s))')
for path, hits in per_file.items():
    print(f'  {path}: {len(hits)} hit(s)')
    for ln, ctx in hits:
        print(f'    {path}:{ln}: {ctx}')
print()
print('Resolution: route date arithmetic through today() / _offsetDateStr /')
print('toDateStr / _hhmmToMinutes. If a raw Date construction is genuinely')
print('required (e.g. noon-construction for locale formatting), annotate the')
print('line with `// HR-12-safe: <rationale>` to document the carve-out.')
sys.exit(1)
PYEOF
