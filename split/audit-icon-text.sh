#!/usr/bin/env bash
# audit-icon-text.sh — V-K-10 lint pattern (PR-A icon-data-shape closure)
# Flags `(label|text|reason|detail):\s*zi\(` field-assignments in split/*.js,
# the canonical bug shape from V-M-9 / V-M-10 / V-M-16 surfaced across PR
# #74 + #75: an SVG fragment lands in a field that downstream renderers
# pass through escHtml() at the boundary, collapsing the <use href=...>
# element into &lt;use&gt; and absorbing the user-readable text into the
# closing SVG tag. Adopt iconText(name, text) from core.js to escape the
# text component at helper-time and emit the SVG as raw HTML, OR annotate
# the line with `// raw-html-ok` when the surrounding render path is a
# sanctioned raw-HTML emit (htmlDetail: true, ins.text, etc.).
#
# Usage:   bash split/audit-icon-text.sh   (0 = pass)
# Returns: exit 0 if 0 unannotated hits; exit 1 otherwise.
# Surfaces: per-file hit counts with file:line:context.
#
# Per audit-emoji.sh precedent: build.sh redirects stderr so this script's
# PASS line stays out of the concat'd HTML.

set -e
cd "$(dirname "$0")/.."

python3 - << 'PYEOF'
import re, os, sys

# Brief-specified pattern (s-2026-05-18 PR-A): `(label|text|reason|detail):
# zi(`. Anchored to the start of the field token to skip incidental
# occurrences inside strings or comments.
pattern = re.compile(r'\b(label|text|reason|detail)\s*:\s*zi\s*\(')

# Sanctioned raw-HTML opt-in marker. Mirror the comment-annotation pattern
# audit-emoji.sh uses for its defensive sanitizer carve-outs.
allow_marker = '// raw-html-ok'

scopes = ['split']
total_hits = 0
per_file = {}

for scope in scopes:
    if os.path.isdir(scope):
        files = [os.path.join(scope, f) for f in sorted(os.listdir(scope))
                 if f.endswith('.js')]
    else:
        files = [scope]

    for path in files:
        with open(path) as fh:
            lines = fh.read().split('\n')
        hits = []
        for i, line in enumerate(lines, 1):
            if not pattern.search(line):
                continue
            if allow_marker in line:
                continue
            hits.append((i, line.strip()[:140]))
        if hits:
            per_file[path] = hits
            total_hits += len(hits)

if total_hits == 0:
    print('audit-icon-text: PASS (0 unannotated `(label|text|reason|detail): zi(` field-assignments)')
    sys.exit(0)

print(f'audit-icon-text: FAIL ({total_hits} unannotated hits across {len(per_file)} files)')
for path, hits in per_file.items():
    print(f'  {path}: {len(hits)} hit(s)')
    for ln, ctx in hits:
        print(f'    {path}:{ln}: {ctx}')
print()
print('Resolution: adopt iconText(name, text) from core.js (escapes the text')
print('component, preserves the SVG as raw HTML — safe for sanctioned raw-HTML')
print('emit sites). When the surrounding render path is a known raw-HTML emit')
print('(htmlDetail: true, ins.text, etc.), annotate the line with `// raw-html-ok`.')
sys.exit(1)
PYEOF
