#!/usr/bin/env bash
# audit-activity-categories-v1.sh — Charter Extensibility gate for milestones-
# tab-v1. Spec: docs/specs/milestones-tab-v1.md §Build-time audit gate.
#
# Scope C (standalone per V-K-106 + V-M-108 + V-M-115 + V-K-127 scope-
# separation discipline; distinct from Scope A + Scope B in audit-no-
# personalised-prediction-v1.sh).
#
# Three banned patterns per spec §Build-time audit gate. Mirrors v3-5 chip-
# taxonomy + v3-6 card-priority audit-gate shape. The consumer-side
# ACTIVITY_CATEGORIES registry (window.ACTIVITY_CATEGORIES in split/data.js)
# is the single source of truth for the 5-cat activity-domain vocabulary
# (motor/language/social/sensory/cognitive); ad-hoc parallel definitions
# drift.
#
#   1. ARRAY-LITERAL PERMUTATIONS — ['motor','sensory','language','social', ...]
#      with ≥3 of the 5 canonical keys as quoted strings. Spec literal:
#      `['motor'.*'language'.*'social'` and permutations.
#
#   2. catOrder= IDIOM — `\bcatOrder\s*=` is the home.js historical drift
#      pattern (V-M-117 outlier at home.js:1670 surfaced this). Spec literal:
#      `\bcatOrder\s*=`.
#
#   3. OBJECT-LITERAL with category keys as fixed top-level keys outside the
#      registry consumer pattern. ≥4 of 5 category keys appearing together
#      as object-literal keys (e.g. `{ motor: ..., language: ..., social: ...,
#      cognitive: ... }`) signals a parallel label-lookup table. The registry
#      is the consumer pattern; parallel definitions drift on rename/extend.
#      ≥4 floor (not ≥3) keeps single-domain-pair filters legitimate.
#
# Engine ratification (V-K-112 floor): Python regex (audit-hr12-v3-3.sh /
# audit-no-personalised-prediction-v1.sh precedent). Default grep -E treats
# \s / \w / \b as literals — would ship green-but-empty.
#
# Engine self-test: 5 adversarial inputs at startup verify the regex engine
# matches expected violations + 1 negative case verifies legitimate single-
# pair domain filters don't false-positive. Exits non-zero with regex-
# engine-mismatch BEFORE scanning the codebase if any input fails. Closes
# V-K-93 tautology-pattern carry-forward by construction.
#
# Opt-in escape: `// activity-categories-ok: <rationale>` on the same line.
# Useful for: (a) the registry source itself in data.js, (b) audit-script
# self-references, (c) pre-existing drift sites kept under explicit
# deprecation-cycle annotation pending follow-up dead-code-removal pass.
#
# Usage:   bash split/audit-activity-categories-v1.sh   (0 = pass)

set -e
cd "$(dirname "$0")/.."

python3 - << 'PYEOF'
import re, sys, os, glob

CAT_KEYS = ['motor', 'language', 'social', 'sensory', 'cognitive']
CAT_QUOTED = r"['\"](" + '|'.join(CAT_KEYS) + r")['\"]"

# ─── Banned pattern 1 — array-literal with ≥3 of 5 quoted keys ───────────
ARRAY_PERMUTATION = re.compile(
    r"\[\s*(?:[^\[\]]*?" + CAT_QUOTED + r"){3,}[^\[\]]*?\]"
)

# ─── Banned pattern 2 — catOrder= idiom ──────────────────────────────────
CATORDER_IDIOM = re.compile(r'\bcatOrder\s*=')

# ─── Banned pattern 3 — object-literal with ≥4 of 5 category keys ────────
# Object-literal keys: JS accepts both `motor:` (bare ident) and `'motor':`
# (quoted) at object-literal key position. Match any { ... } block (single-
# line) containing ≥4 of the 5 canonical keys at key position. Multi-line
# objects are detected by joining ≤2 consecutive lines as the audit unit
# (registry-fork tables in this codebase typically declare keys inline on
# one or two lines; the 5+-key full registry consumer pattern occupies
# more lines and is permitted via the activity-categories-ok marker on the
# canonical source).
OBJ_KEY_AT_KEY_POS = r"(?:^|[\{,\s])(" + '|'.join(CAT_KEYS) + r")\s*:"
OBJ_LITERAL_4PLUS = re.compile(
    OBJ_KEY_AT_KEY_POS,
    re.MULTILINE,
)

# ─── Opt-in marker (per-scope-shared per spec §Build-time audit gate) ───
OPT_IN_MARKER = re.compile(r'//\s*activity-categories-ok\s*:')

# ─── V-K-112 — engine self-test ─────────────────────────────────────────
SELF_TEST = [
    # (regex, sample, should-match?)
    (ARRAY_PERMUTATION, "const order = ['motor','sensory','language','social']", True),
    (ARRAY_PERMUTATION, "const order = ['motor','language','social','sensory','cognitive']", True),
    (ARRAY_PERMUTATION, "const pair = ['motor','language']", False),  # 2-key legitimate pair-filter
    (CATORDER_IDIOM, "const catOrder = ['motor','sensory']", True),
    (CATORDER_IDIOM, "// fix the categories order", False),  # 'order' alone is not catOrder=
]
for regex, sample, should_match in SELF_TEST:
    matched = bool(regex.search(sample))
    if matched != should_match:
        print(
            'audit-activity-categories-v1: SELF-TEST FAIL — adversarial input '
            f'"{sample}" expected match={should_match} actual={matched}. '
            'Regex engine mismatch (Python re vs grep -E posix). Fix before claiming green.'
        )
        sys.exit(2)

# Object-literal self-test runs differently (multi-key count on a block):
def count_obj_keys(block):
    return len({m.group(1) for m in OBJ_LITERAL_4PLUS.finditer(block)})
# 4-key positive case:
adv_obj_4 = "{ motor: 'M', language: 'L', social: 'S', cognitive: 'C' }"
if count_obj_keys(adv_obj_4) < 4:
    print('audit-activity-categories-v1: SELF-TEST FAIL — object-literal 4-key adversarial not detected')
    sys.exit(2)
# 2-key negative case:
adv_obj_2 = "{ motor: 'M', language: 'L' }"
if count_obj_keys(adv_obj_2) >= 4:
    print('audit-activity-categories-v1: SELF-TEST FAIL — 2-key object false-positive')
    sys.exit(2)

# ─── Scan scope: JS files only (registry-fork drift is consumer-side JS;
# CSS has no category arrays, HTML has static label vocabulary, audit
# gates are exempt). ────────────────────────────────────────────────────
EXCLUDE = {
    'audit-activity-categories-v1.sh',
    'audit-no-personalised-prediction-v1.sh',
    'audit-hr12-v3-3.sh',
    'audit-emoji.sh',
    'audit-icon-text.sh',
    'audit-resolve-shield.sh',
    'audit-viz-smoke.sh',
    'audit-chip-taxonomy-v3-5.sh',
    'audit-card-priority-v3-6.sh',
}
files = []
for f in glob.glob('split/*.js'):
    if os.path.basename(f) in EXCLUDE:
        continue
    files.append(f)

array_hits = []
catorder_hits = []
obj_hits = []

for path in files:
    try:
        with open(path) as fh:
            text = fh.read()
            lines = text.split('\n')
    except (IOError, OSError):
        continue
    for i, line in enumerate(lines, start=1):
        has_marker = bool(OPT_IN_MARKER.search(line))
        if has_marker:
            continue
        code_portion = line.split('//', 1)[0]
        if ARRAY_PERMUTATION.search(code_portion):
            array_hits.append((path, i, line.strip()[:180]))
        if CATORDER_IDIOM.search(code_portion):
            catorder_hits.append((path, i, line.strip()[:180]))
    # Object-literal scan: walk lines, count keys appearing in a window of
    # the current line + next line (a 2-line window catches the common
    # `{ motor: ..., language: ..., social: ..., cognitive: ... }` pattern
    # whether single-line or split across the opening brace + content). If
    # any 2-line window contains ≥4 of 5 category keys at key position AND
    # NEITHER line carries the opt-in marker, flag the starting line.
    for i in range(len(lines)):
        window_text = lines[i]
        if i + 1 < len(lines):
            window_text = window_text + '\n' + lines[i + 1]
        # Skip if either line in the window carries the marker
        if OPT_IN_MARKER.search(window_text):
            continue
        # Code-portion only for each line
        code_lines = []
        for wl in window_text.split('\n'):
            code_lines.append(wl.split('//', 1)[0])
        code_window = '\n'.join(code_lines)
        keys_present = {m.group(1) for m in OBJ_LITERAL_4PLUS.finditer(code_window)}
        if len(keys_present) >= 4:
            # Avoid duplicate flagging: only flag if the FIRST line in the
            # window is the one with the most keys (or the brace-opener).
            first_line_keys = {m.group(1) for m in OBJ_LITERAL_4PLUS.finditer(code_lines[0])}
            if len(first_line_keys) >= 1 or '{' in code_lines[0]:
                obj_hits.append((path, i + 1, lines[i].strip()[:180], sorted(keys_present)))

# De-duplicate obj_hits by (path, line)
seen = set()
deduped_obj = []
for h in obj_hits:
    key = (h[0], h[1])
    if key in seen:
        continue
    seen.add(key)
    deduped_obj.append(h)
obj_hits = deduped_obj

total = len(array_hits) + len(catorder_hits) + len(obj_hits)

if total == 0:
    print(
        'audit-activity-categories-v1: PASS '
        f'(banned-arrays: 0; catOrder-idiom: 0; obj-literal-fork: 0; '
        f'self-test: 5/5 + obj 2-case adversarial matched; scanned {len(files)} files)'
    )
    sys.exit(0)

print(f'audit-activity-categories-v1: FAIL ({total} hit(s) across the surface)')
if array_hits:
    print(f'  banned-arrays (3+ of 5 keys in literal): {len(array_hits)} hit(s)')
    for path, ln, ctx in array_hits:
        print(f'    {path}:{ln}: {ctx}')
if catorder_hits:
    print(f'  catOrder= idiom: {len(catorder_hits)} hit(s)')
    for path, ln, ctx in catorder_hits:
        print(f'    {path}:{ln}: {ctx}')
if obj_hits:
    print(f'  obj-literal-fork (4+ of 5 keys in object-literal outside registry): {len(obj_hits)} hit(s)')
    for path, ln, ctx, keys in obj_hits:
        print(f'    {path}:{ln}: [{",".join(keys)}] in: {ctx}')
print()
print('Resolution:')
print('  • banned-arrays / catOrder= — route through window.ACTIVITY_CATEGORIES.')
print('    Iterate the registry: ACTIVITY_CATEGORIES.forEach(c => ...) or')
print('    ACTIVITY_CATEGORIES.map(c => c.key) for a derived order. The')
print('    registry is the single source of truth; ad-hoc arrays drift on')
print('    rename/extend.')
print('  • obj-literal-fork — replace parallel label-lookup tables')
print('    ({ motor: "Motor", language: "Language", ... }) with reads from')
print('    ACTIVITY_CATEGORIES (e.g. ACTIVITY_CATEGORIES.find(c => c.key === domain).label).')
print('  • If a literal is genuinely legitimate (registry source in data.js,')
print('    deprecation-window technical-debt site pending follow-up dead-code')
print('    pass, audit script self-reference), annotate the line with')
print('    `// activity-categories-ok: <rationale>`.')
sys.exit(1)
PYEOF
