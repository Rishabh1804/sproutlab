#!/usr/bin/env bash
# audit-card-priority-v3-6.sh — Charter Extensibility gate for v3-6.
# Spec: docs/specs/v3-6-card-priority.md §Build-time audit gate +
# §Functional tests row regression-guard-v3-6-no-adhoc-class-strings +
# regression-guard-v3-6-producer-coverage.
#
# Two checks:
#  1. BANNED CLASS STRINGS — `card-urgent` / `card-notable` / `card-ambient`
#     as bare class names anywhere in split/ outside the registry CSS file
#     (split/styles.css) and this audit script itself. The v3-6 doctrine is
#     that the data-card-priority attribute is the single source of truth;
#     class-bag drift is what the Charter Extensibility axis explicitly
#     rules out (CV3-006).
#
#  2. PRODUCER COVERAGE — every `function renderInfo<Name>()` in
#     split/intelligence-cards.js whose body contains a
#     `getElementById('info<Name>Card')` reference MUST contain at least
#     one `_setCardPriority(` call. Functions that don't fetch the card
#     wrapper (helpers, pure-data computers) are exempt; the discriminator
#     is the `getElementById('info<Name>Card')` presence per spec.
#
# Opt-in escape (banned-class only): `// card-priority-ok: <rationale>` on
# the same line — mirrors the chip-taxonomy / HR-12-safe convention.
#
# Usage:   bash split/audit-card-priority-v3-6.sh   (0 = pass)

set -e
cd "$(dirname "$0")/.."

python3 - << 'PYEOF'
import re, sys, os

# ── CHECK 1: banned class strings ─────────────────────────────────────
banned = [
    r'\bcard-urgent\b',
    r'\bcard-notable\b',
    r'\bcard-ambient\b',
]
pattern = re.compile('|'.join(banned))
allow_marker = re.compile(r'card-priority-ok\s*[:.]?')

SCAN_DIR = 'split'
EXEMPT = {
    'split/styles.css',                       # registry home — CSS variants live here
    'split/audit-card-priority-v3-6.sh',      # this file
}

class_hits_total = 0
class_hits_per_file = {}

for entry in sorted(os.listdir(SCAN_DIR)):
    path = os.path.join(SCAN_DIR, entry)
    if not os.path.isfile(path):
        continue
    if path in EXEMPT:
        continue
    if not path.endswith(('.js', '.css', '.html', '.mjs', '.sh')):
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
        class_hits_per_file[path] = hits
        class_hits_total += len(hits)

# ── CHECK 2: producer coverage ────────────────────────────────────────
# Spec literal: for every function renderInfo<Name>() in
# intelligence-cards.js whose body contains getElementById('info<Name>Card'),
# require at least one _setCardPriority( call site in the same body.
#
# Spec-strengthening (substantive intent): for every function
# renderInfo<Name>() in intelligence-cards.js whose body fetches the
# card wrapper EITHER directly via getElementById('info<Name>Card') OR
# indirectly via _setCardPriority('info<Name>Card', ...), require at
# least one _setCardPriority( call site. Functions that don't reference
# any "info...Card" wrapper id at all (helpers, pure-data computers,
# the master renderInfo() orchestrator) are exempt — the discriminator
# is the "info<Name>Card" presence per spec.
ICARDS = 'split/intelligence-cards.js'
producer_misses = []  # list of (func_name, expected_card_id, line)

if os.path.isfile(ICARDS):
    with open(ICARDS) as fh:
        src = fh.read()
    # Find every `function renderInfo<Name>()` declaration and its body
    # extent (naive: from declaration line through the matching closing
    # brace at column-0; the file uses top-level functions only).
    func_decl = re.compile(r'^function (renderInfo[A-Z][A-Za-z0-9_]*)\(\)\s*\{', re.MULTILINE)
    decl_iter = list(func_decl.finditer(src))
    # Either `getElementById('infoFooCard')` OR `_setCardPriority('infoFooCard', ...)`
    # counts as "owns a card" for the audit discriminator.
    owns_pattern = re.compile(
        r"(getElementById\(['\"]info[A-Za-z0-9_]+Card['\"]\)"
        r"|_setCardPriority\(['\"]info[A-Za-z0-9_]+Card['\"])"
    )
    for idx, m in enumerate(decl_iter):
        func_name = m.group(1)
        start = m.start()
        end_match = re.search(r'\n\}\s*\n', src[m.end():])
        end = (m.end() + end_match.end()) if end_match else len(src)
        body = src[start:end]
        owns = owns_pattern.search(body)
        if not owns:
            continue
        # Producer-coverage: body must contain at least one _setCardPriority( call
        if '_setCardPriority(' not in body:
            line_no = src[:start].count('\n') + 1
            producer_misses.append((func_name, owns.group(0), line_no))

# ── Report ─────────────────────────────────────────────────────────────
total_failures = class_hits_total + len(producer_misses)
if total_failures == 0:
    print('audit-card-priority-v3-6: PASS (no banned class strings + producer coverage complete)')
    sys.exit(0)

print(f'audit-card-priority-v3-6: FAIL ({total_failures} finding(s))')

if class_hits_total > 0:
    print(f'  banned-class-strings: {class_hits_total} hit(s) across {len(class_hits_per_file)} file(s)')
    for path, hits in class_hits_per_file.items():
        print(f'    {path}: {len(hits)} hit(s)')
        for ln, ctx in hits:
            print(f'      {path}:{ln}: {ctx}')

if producer_misses:
    print(f'  producer-coverage: {len(producer_misses)} renderInfo* function(s) missing _setCardPriority()')
    for fn, ref, ln in producer_misses:
        print(f'    {ICARDS}:{ln}: function {fn}() references {ref} but contains no _setCardPriority(...) call')

print()
print('Resolution:')
print('  banned-class-strings: route card priority through the data-card-priority')
print('    attribute (single source of truth). Tier vocabulary is owned by')
print('    window._CARD_PRIORITY_TIERS + the CSS variants in split/styles.css.')
print('    If a legitimate reference is required (historical comment), annotate')
print('    the line with `// card-priority-ok: <rationale>`.')
print('  producer-coverage: every renderInfo<Name>() that fetches its card')
print('    wrapper must emit a tier via _setCardPriority(cardId, tier). Choose')
print('    a tier per spec §Tier-deriver patterns (trend/composite cards never')
print('    urgent; si-nodata branches always ambient).')
sys.exit(1)
PYEOF
