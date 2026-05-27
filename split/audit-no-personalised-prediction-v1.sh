#!/usr/bin/env bash
# audit-no-personalised-prediction-v1.sh — Honesty-floor gate for the
# milestone-engine-prep-v1 surface. Spec: docs/specs/milestone-engine-prep-v1.md
# §Build-time audit gate.
#
# Two scopes, both ratified by V-K-106 + V-M-106 + V-M-115 separation:
#   • Scope A — hardcoded source attribution + unverified parenthetical.
#     Bans literal "(WHO)" / "(CDC)" / "(AAP)" / "(IAP)" / "(EU)" / "(CN)" in
#     consumer-side render code (every clinical-band source MUST be read from
#     row.source, never hardcoded). Bans literal "(unverified)" — V-M-115 hard
#     contract: rendering "(unverified)" parenthetically is the cipher-honesty
#     violation, since "unverified" reads as a category to the parent.
#   • Scope B — personalised-prediction prose. Bans "Ziva will <verb> by …" /
#     "Ziva should <verb> by …" / "Ziva is on track to …" shapes.
#     _predictMilestoneWindow returns CLINICAL bands; consumer prose must read
#     "Typically X–Y months. Ziva is Zm Wd — early band." Never personalised.
#
# Engine ratification (V-K-112): Python regex (audit-hr12-v3-3.sh precedent).
# Default `grep -E` treats \s / \w as literals — would ship green-but-empty.
#
# Engine self-test (V-K-112 hard contract): every script-startup re-validates
# its own Scope-B regex against 5 adversarial inputs. If any of those inputs
# DOESN'T match Scope-B, the gate exits non-zero with a regex-engine-mismatch
# error BEFORE scanning the codebase. Closes V-K-93 tautology-pattern carry-
# forward — the gate self-tests its own correctness before claiming green.
#
# Opt-in markers (per-scope, separable per V-K-106 + V-M-108 + V-M-115):
#   `// no-personalised-prediction-ok: <rationale>`  → Scope B exempt on that line
#   `// milestone-source-ok: <rationale>`            → Scope A exempt on that line
#
# Usage:   bash split/audit-no-personalised-prediction-v1.sh   (0 = pass)

set -e
cd "$(dirname "$0")/.."

python3 - << 'PYEOF'
import re, sys, os, glob

# ─── Scope B — personalised-prediction prose (V-K-106 broadened) ──────────
SCOPE_B = re.compile(
    r"Ziva (will|should|might|is going to|is expected to|is on track to)"
    r"\s+(be\s+)?[\w\s\-]{1,40}?\s+(by|at|around)\s+(month|week|day|\d)",
    re.IGNORECASE,
)
SCOPE_B_MARKER = re.compile(r'//\s*no-personalised-prediction-ok\s*:')

# ─── Scope A — hardcoded source attribution + unverified parenthetical ────
SCOPE_A_SOURCE = re.compile(r'\((WHO|CDC|AAP|IAP|EU|CN)\)')
SCOPE_A_UNVERIFIED = re.compile(r'\(unverified\)')
SCOPE_A_MARKER = re.compile(r'//\s*milestone-source-ok\s*:')

# ─── V-K-112 — engine self-test on 5 adversarial Scope-B inputs ────────────
SELF_TEST_ADVERSARIAL = [
    'Ziva will sit by 6',
    'Ziva will be sitting by 6 months',
    'Ziva will pull-to-stand by 9 months',
    'Ziva will say first words by 12 months',
    'Ziva should walk by month 12',
]
for adv in SELF_TEST_ADVERSARIAL:
    if not SCOPE_B.search(adv):
        print(
            'audit-no-personalised-prediction-v1: SELF-TEST FAIL — Scope-B regex '
            f'did NOT match adversarial input "{adv}". Gate is misconfigured; '
            'check the regex engine (Python re vs grep -E posix) before claiming green.'
        )
        sys.exit(2)

# ─── Scan scope: every split/ source file except the audit gates themselves ──
EXCLUDE = {
    'audit-no-personalised-prediction-v1.sh',
    'audit-hr12-v3-3.sh',
    'audit-emoji.sh',
    'audit-icon-text.sh',
    'audit-resolve-shield.sh',
    'audit-viz-smoke.sh',
    'audit-chip-taxonomy-v3-5.sh',
    'audit-card-priority-v3-6.sh',
}

# Scope discipline: "consumer-side render code" per spec §Build-time audit gate
# means JS files where milestone prose is dynamically rendered (escHtml +
# template literals). template.html carries STATIC labels for non-milestone
# UI (vaccination dropdown, help-tip text); those are not consumer-side
# milestone prose. CSS has no prose. Narrowing to JS keeps the gate faithful
# to V-M-106 + V-M-115 intent without burying the signal in HTML noise.
files = []
for f in glob.glob('split/*.js'):
    if os.path.basename(f) in EXCLUDE:
        continue
    files.append(f)

scope_b_hits = []
scope_a_source_hits = []
scope_a_unverified_hits = []

for path in files:
    try:
        with open(path) as fh:
            lines = fh.read().split('\n')
    except (IOError, OSError):
        continue
    for i, line in enumerate(lines, start=1):
        # Strip line comments AFTER capturing the opt-in marker, so the marker
        # itself is read but the rationale text isn't scanned for false hits.
        # Marker check applies to the FULL line.
        has_b_marker = bool(SCOPE_B_MARKER.search(line))
        has_a_marker = bool(SCOPE_A_MARKER.search(line))
        # Code-portion-only scan: split on `//` and read the left side.
        code_portion = line.split('//', 1)[0]
        # Scope B
        if SCOPE_B.search(code_portion) and not has_b_marker:
            scope_b_hits.append((path, i, line.strip()[:160]))
        # Scope A — sources
        for m in SCOPE_A_SOURCE.finditer(code_portion):
            if has_a_marker:
                continue
            scope_a_source_hits.append((path, i, m.group(0), line.strip()[:160]))
        # Scope A — unverified parenthetical (V-M-115 hard contract)
        if SCOPE_A_UNVERIFIED.search(code_portion) and not has_a_marker:
            scope_a_unverified_hits.append((path, i, line.strip()[:160]))

total = len(scope_b_hits) + len(scope_a_source_hits) + len(scope_a_unverified_hits)

if total == 0:
    print(
        'audit-no-personalised-prediction-v1: PASS '
        f'(Scope B: 0 personalised-prediction; Scope A: 0 hardcoded source / 0 unverified parens; '
        f'self-test: 5/5 adversarial inputs matched; scanned {len(files)} files)'
    )
    sys.exit(0)

print(f'audit-no-personalised-prediction-v1: FAIL ({total} hit(s) across the surface)')
if scope_b_hits:
    print(f'  Scope B (personalised-prediction prose): {len(scope_b_hits)} hit(s)')
    for path, ln, ctx in scope_b_hits:
        print(f'    {path}:{ln}: {ctx}')
if scope_a_source_hits:
    print(f'  Scope A (hardcoded source attribution): {len(scope_a_source_hits)} hit(s)')
    for path, ln, src, ctx in scope_a_source_hits:
        print(f'    {path}:{ln}: {src} in: {ctx}')
if scope_a_unverified_hits:
    print(f'  Scope A (unverified parenthetical, V-M-115): {len(scope_a_unverified_hits)} hit(s)')
    for path, ln, ctx in scope_a_unverified_hits:
        print(f'    {path}:{ln}: {ctx}')
print()
print('Resolution:')
print('  • Scope B — route prose through "Typically X-Y months. Ziva is Zm Wd — early band."')
print('    The window position is the clinical band; never personalised. If a line is genuinely')
print('    not a personalised-prediction (e.g. a regex/literal in the audit gate itself), annotate')
print('    with `// no-personalised-prediction-ok: <rationale>` on the same line.')
print('  • Scope A (source) — read source from row.source, NEVER hardcode "(WHO)" / "(CDC)" / etc.')
print('    The data carries per-row source attribution; consumer prose interpolates from data.')
print('    If a literal (WHO) etc. is intentional (e.g. spec body, test fixture), annotate with')
print('    `// milestone-source-ok: <rationale>` on the same line.')
print('  • Scope A (unverified) — V-M-115 hard contract: rendering "(unverified)" parenthetically')
print('    is a cipher-honesty violation. Consumers MUST omit the parenthetical entirely when')
print('    row.source === "unverified". Same opt-in marker `// milestone-source-ok:` applies.')
sys.exit(1)
PYEOF
