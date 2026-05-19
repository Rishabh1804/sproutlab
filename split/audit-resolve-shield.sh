#!/usr/bin/env bash
# audit-resolve-shield.sh — V-M-41 shield (PR-D resolve-caller hardening)
#
# Locks the explicit `btnText='Resolve'` argument on every `confirmAction(...)`
# call in split/intelligence.js whose callback invokes one of the symptom-
# resolution episode handlers (resolveFeverEpisode / resolveDiarrhoeaEpisode /
# resolveVomitingEpisode / resolveColdEpisode). Per V-M-41 (Maren) +
# V-K-30 (Kael, word-boundary doctrine) on PR #78:
#
# The four resolve-callers carry messages like "Has Ziva's temperature been
# normal …?", "Has the cold/cough resolved? (Symptoms mostly cleared for
# 24+ hours)", etc. The confirmAction regex at core.js:3431 —
# `/\b(delete|remove|clear)\b/i` — does NOT match any of these because of
# word-boundary mechanics (e.g. `cleared` has no right-side word boundary on
# `\bclear\b`; `resolved` / `stopped` / `normal` are not in the regex's set).
# The V-K-24 doctrine comment at core.js:3429-3430 documents this `cleared`
# mid-word safety explicitly; the regex on disk is its consequence, the
# comment is its rationale.
# So a future maintainer who drops the `'Resolve'` btnText would NOT cause a
# rose-Delete misroute — but they WOULD cause a tonal regression from the
# sage-domain 'Resolve' label to the generic 'Confirm' label on a health-
# restoration affirmation. The shield is load-bearing for *label semantics*,
# not for *routing*; this audit guards that semantic.
#
# Usage:   bash split/audit-resolve-shield.sh   (0 = pass)
# Returns: exit 0 if every resolve-caller carries `'Resolve'` btnText; exit 1
#          if any resolve-caller lost its shield, or if the expected-count
#          drifts (added/removed caller without doctrine update).
#
# Per audit-emoji.sh + audit-icon-text.sh precedent: build.sh redirects
# stderr so this script's PASS line stays out of the concat'd HTML.

set -e
cd "$(dirname "$0")/.."

python3 - << 'PYEOF'
import re, sys

# Resolve-episode handler names — the canonical set established in
# intelligence.js. A future episode handler (e.g. resolveRashEpisode) being
# added would NOT be caught by this script's enumeration; the expected_count
# check below forces a doctrine touch when the set changes.
resolve_handlers = ['resolveFeverEpisode', 'resolveDiarrhoeaEpisode',
                    'resolveVomitingEpisode', 'resolveColdEpisode']
expected_count = 4  # PR-D V-M-41 baseline; update with doctrine if the set grows.

# PR-G split: symptom-resolve callers moved to intelligence-illness.js
# (fever / diarrhoea / vomiting / cold episode tracking subsystem).
with open('split/intelligence-illness.js') as fh:
    text = fh.read()

# Balanced-paren scan: find each `confirmAction(...)` call and capture the
# full call text (which may span multiple lines). String-aware so quoted
# parens inside messages don't confuse depth tracking.
def find_confirm_calls(src):
    pat = re.compile(r'\bconfirmAction\s*\(')
    out = []
    for m in pat.finditer(src):
        start = m.start()
        i = m.end()
        depth = 1
        in_string = None
        while i < len(src) and depth > 0:
            c = src[i]
            if in_string:
                if c == '\\':
                    i += 2
                    continue
                if c == in_string:
                    in_string = None
                i += 1
                continue
            if c in ('"', "'", '`'):
                in_string = c
            elif c == '(':
                depth += 1
            elif c == ')':
                depth -= 1
            i += 1
        line_num = src[:start].count('\n') + 1
        out.append((line_num, src[start:i]))
    return out

resolve_pat = re.compile(r'\b(' + '|'.join(resolve_handlers) + r')\b')
# Match `, 'Resolve')` or `, "Resolve")` at (or near) end-of-call. Allow
# whitespace + closing paren only after the literal.
btn_pat = re.compile(r""",\s*['"]Resolve['"]\s*\)\s*$""")

matched = []
shield_failures = []
for line_num, call_text in find_confirm_calls(text):
    if not resolve_pat.search(call_text):
        continue
    matched.append((line_num, call_text))
    # Strip a trailing semicolon if present for the closing-paren match.
    trimmed = call_text.rstrip().rstrip(';')
    if not btn_pat.search(trimmed):
        shield_failures.append((line_num, call_text.replace('\n', ' ')[:200]))

# Report.
if len(matched) != expected_count:
    print(f'audit-resolve-shield: FAIL (expected {expected_count} resolve-callers, '
          f'found {len(matched)})')
    print('  Resolve-handler set drifted. Update expected_count in '
          'split/audit-resolve-shield.sh and chronicle the addition/removal '
          'under V-M-41 doctrine before shipping.')
    for ln, ct in matched:
        print(f'    intelligence-illness.js:{ln}: {ct[:160]}')
    sys.exit(1)

if shield_failures:
    print(f'audit-resolve-shield: FAIL ({len(shield_failures)} resolve-caller(s) '
          f'lost the explicit btnText shield)')
    for ln, ct in shield_failures:
        print(f'    intelligence-illness.js:{ln}: {ct}')
    print()
    print('Resolution: restore the third argument `\'Resolve\'` to confirmAction(...).')
    print('Doctrine: V-M-41 (Maren) + V-K-30 (Kael) on PR #78. The shield preserves')
    print('the sage-toned \'Resolve\' button label on health-restoration affirmations;')
    print('without it the button falls back to generic \'Confirm\', a tonal regression')
    print('on a safety-tier illness-resolution surface.')
    sys.exit(1)

print(f'audit-resolve-shield: PASS ({len(matched)} resolve-caller(s) carry the '
      f"explicit `'Resolve'` btnText shield per V-M-41 doctrine)")
sys.exit(0)
PYEOF
