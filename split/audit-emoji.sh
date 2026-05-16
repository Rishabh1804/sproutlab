#!/usr/bin/env bash
# audit-emoji.sh — HR-1 comprehensive emoji audit
# Per Cipher Edict V round 2 §10 (PR #74) — codifies the regex coverage that
# audit-chain experience has shown to be necessary across three audit rounds.
#
# Usage:   bash split/audit-emoji.sh           (default scope; 0 = pass)
#          bash split/audit-emoji.sh --strict  (adds Geometric Shapes — carry-forward range)
#
# Returns: exit 0 if 0 actionable hits across split/ + built index.html /
#          sproutlab.html (if present at repo root); exit 1 otherwise.
# Surfaces: per-file hit counts with file:line:codepoint:context.
#
# DEFAULT RANGE COVERAGE (5 Unicode blocks surfaced across 3 audit rounds):
#   U+1F000-1FAFF  Supplemental Symbols / Pictographs / Symbols & Pict Ext-A
#                    surfaced in round 1 (original sweep)
#   U+1F300-1F9FF  Misc Symbols & Pictographs / Emoticons / Transport
#                    surfaced in round 1
#   U+2600-27BF    Misc Symbols + Dingbats
#                    surfaced in round 1
#   U+2300-23FF    Misc Technical (⏰⏱⏳⏭⏸⏯⌚⌛ etc.)
#                    surfaced by Maren V-M B3 cluster in round 2
#   U+2B00-2BFF    Misc Symbols & Arrows (⬜⬛⭐⬆ etc.)
#                    surfaced by Lyra broader sweep in round 3
#
#   Plus JS Unicode-escape equivalents (\u{XXXX} / \uXXXX) for the same ranges
#   — surfaced as Lyra round-2 methodology gap (commit 3).
#
# STRICT RANGE (--strict): adds U+25A0-25FF Geometric Shapes
#   (chevrons ▾▴, dots ●○, etc.) — documented carry-forward as of 2026-05-16;
#   chevron + confidence-dot refactor is a separate focused PR because the
#   click-target geometry and CSS sizing of those UI-chrome glyphs needs
#   per-surface analysis vs the in-content emoji-substitution pattern.
#
# EXCLUDED (typographic / text-class — allowed by HR-1 spirit):
#   U+2010-2027   Punctuation (em-dash —, en-dash –, smart quotes)
#   U+2190-21FF   Arrows (↑↓→←) — Maren allowance for trend-delta indicators
#   U+00B0-00FF   Latin-1 Supplement (degree °, etc.)
#
# FALSE-POSITIVE FILTER:
#   Lines containing '[\u' — defensive sanitizer regex character classes
#   (e.g. home.js:4188 strips leading emoji from labels; the codepoint
#   appears in regex source, not as a shipped glyph).

set -e
cd "$(dirname "$0")/.."

STRICT_FLAG="${1:-}"

python3 - "$STRICT_FLAG" << 'PYEOF'
import re, os, sys

strict = (len(sys.argv) > 1 and sys.argv[1] == '--strict')

# Literal codepoint matcher — default 5 ranges
default_re_pattern = (
    r'[\U0001F000-\U0001FAFF'
    r'\U0001F300-\U0001F9FF'
    r'\U00002600-\U000027BF'
    r'\U00002300-\U000023FF'
    r'\U00002B00-\U00002BFF'
    r']'
)
strict_re_pattern = (
    r'[\U0001F000-\U0001FAFF'
    r'\U0001F300-\U0001F9FF'
    r'\U00002600-\U000027BF'
    r'\U00002300-\U000023FF'
    r'\U00002B00-\U00002BFF'
    r'\U000025A0-\U000025FF'  # Geometric Shapes (chevrons, dots)
    r']'
)
literal_re = re.compile(strict_re_pattern if strict else default_re_pattern)

escape_re = re.compile(r"\\u\{?([0-9A-Fa-f]{4,5})\}?")

def in_emoji_ranges(cp: int, strict: bool) -> bool:
    base = (
        0x1F000 <= cp <= 0x1FAFF or
        0x1F300 <= cp <= 0x1F9FF or
        0x2600  <= cp <= 0x27BF  or
        0x2300  <= cp <= 0x23FF  or
        0x2B00  <= cp <= 0x2BFF
    )
    if base: return True
    if strict and 0x25A0 <= cp <= 0x25FF: return True
    return False

def is_filtered(line: str) -> bool:
    return '[\\u' in line  # defensive sanitizer regex char class

# VS16 (U+FE0F) — emoji-presentation variation selector. Forces preceding
# base character to render as colored emoji even if the base is in an
# allowed range (e.g., arrows U+2190-21FF). Per Maren V-M-10 (round 3):
# flag ALL U+FE0F occurrences; SproutLab has no legitimate use of VS16.
vs16_re = re.compile(r'️|\\uFE0F|\\u\{?FE0F\}?', re.IGNORECASE)

scopes = ['split']
for root_artifact in ['index.html', 'sproutlab.html']:
    if os.path.exists(root_artifact):
        scopes.append(root_artifact)

total_hits = 0
per_file = {}

for scope in scopes:
    if os.path.isdir(scope):
        files = [os.path.join(scope, f) for f in sorted(os.listdir(scope))
                 if f.endswith(('.js', '.html', '.css', '.sh', '.mjs'))]
    else:
        files = [scope]

    for path in files:
        if path.endswith('audit-emoji.sh'):
            continue
        with open(path) as fh:
            src = fh.read()
        lines = src.split('\n')
        hits = []
        for m in literal_re.finditer(src):
            ln_idx = src[:m.start()].count('\n')
            line = lines[ln_idx]
            if is_filtered(line): continue
            hits.append((ln_idx + 1, m.group(), ord(m.group()), line.strip()[:90]))
        for m in escape_re.finditer(src):
            try: cp = int(m.group(1), 16)
            except ValueError: continue
            if not in_emoji_ranges(cp, strict): continue
            ln_idx = src[:m.start()].count('\n')
            line = lines[ln_idx]
            if is_filtered(line): continue
            hits.append((ln_idx + 1, m.group(), cp, line.strip()[:90]))
        # VS16 (emoji-presentation selector) — flag all occurrences
        for m in vs16_re.finditer(src):
            ln_idx = src[:m.start()].count('\n')
            line = lines[ln_idx]
            if is_filtered(line): continue
            hits.append((ln_idx + 1, m.group(), 0xFE0F, line.strip()[:90]))
        if hits:
            per_file[path] = hits
            total_hits += len(hits)

mode = 'STRICT (incl. U+25A0-25FF Geometric Shapes)' if strict else 'default (5 surfaced ranges)'
if total_hits == 0:
    print(f'audit-emoji.sh [{mode}]: 0 HR-1 violations across', ', '.join(scopes))
    sys.exit(0)
else:
    for path, hits in per_file.items():
        print(f'\n{path}: {len(hits)} HR-1 hits [{mode}]')
        for ln, glyph, cp, line in hits:
            print(f'  L{ln}: {glyph!r} (U+{cp:04X})  {line}')
    print(f'\nTOTAL: {total_hits} HR-1 violations [{mode}]')
    sys.exit(1)
PYEOF
