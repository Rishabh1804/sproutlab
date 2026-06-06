#!/usr/bin/env python3
"""
contrast_audit.py — WCAG colour-contrast audit for SproutLab design tokens.

A dev-side QA instrument (NOT app runtime — SproutLab ships JS to the browser;
this is a workbench tool). It reads the colour tokens straight out of
split/styles.css, resolves var() references, alpha-composites translucent
washes over their base background, and computes the WCAG 2.x contrast ratio for
the text-on-background pairs that actually render. It checks three contexts:

  - light screen   (:root)
  - dark screen    (:root + [data-theme="dark"])
  - print-from-dark (the @media print docface re-force — the scenario the
    PR #235 --tc-rose safety fix guards: a dark-mode printout of the doctor
    card, where the stamped adrenaline TIME must stay readable on white paper)

Why parse the CSS instead of hardcoding values? So the audit can never drift
from the stylesheet. The stylesheet is the single source of truth.

Usage:
    python tools/contrast_audit.py            # report, exit 0 always
    python tools/contrast_audit.py --strict   # exit 1 if any AA failure (CI gate)
    python tools/contrast_audit.py --css path/to/styles.css

No third-party dependencies — standard library only.

WCAG references: contrast ratio (L1+0.05)/(L2+0.05); AA = 4.5:1 normal text /
3:1 large text; AAA = 7:1 / 4.5:1. https://www.w3.org/TR/WCAG21/#contrast-minimum
"""

import argparse
import os
import re
import sys

# ── Colour math ────────────────────────────────────────────────────────────

def _srgb_to_linear(c):
    cs = c / 255.0
    return cs / 12.92 if cs <= 0.03928 else ((cs + 0.055) / 1.055) ** 2.4


def relative_luminance(rgb):
    r, g, b = (_srgb_to_linear(x) for x in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast_ratio(fg_rgb, bg_rgb):
    l1 = relative_luminance(fg_rgb)
    l2 = relative_luminance(bg_rgb)
    lighter, darker = (l1, l2) if l1 >= l2 else (l2, l1)
    return (lighter + 0.05) / (darker + 0.05)


def composite_over(fg_rgba, bg_rgb):
    """Alpha-blend an (r,g,b,a) foreground over an opaque (r,g,b) background."""
    r, g, b, a = fg_rgba
    return tuple(round(fg * a + bg * (1 - a)) for fg, bg in zip((r, g, b), bg_rgb))


# ── Colour-value parsing ───────────────────────────────────────────────────

_HEX = re.compile(r'^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$')
_RGB = re.compile(r'^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*(?:,\s*([0-9.]+)\s*)?\)$')
_GRAD_COLOR = re.compile(r'#[0-9a-fA-F]{3,6}|rgba?\([^)]*\)')


def parse_color(value, scope, _depth=0):
    """Resolve a CSS colour token value to (r,g,b,a). scope: name->raw value.

    Returns (rgba_tuple, note) where note flags gradients/unresolved.
    """
    if _depth > 12:
        return None, 'cyclic var()'
    v = value.strip().rstrip(';').strip()

    m = re.match(r'^var\(\s*(--[a-zA-Z0-9-]+)\s*(?:,\s*(.+))?\)$', v)
    if m:
        ref, fallback = m.group(1), m.group(2)
        if ref in scope:
            return parse_color(scope[ref], scope, _depth + 1)
        if fallback:
            return parse_color(fallback, scope, _depth + 1)
        return None, f'unresolved {ref}'

    m = _HEX.match(v)
    if m:
        h = m.group(1)
        if len(h) == 3:
            h = ''.join(c * 2 for c in h)
        return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 1.0), None

    m = _RGB.match(v)
    if m:
        r, g, b = (int(round(float(m.group(i)))) for i in (1, 2, 3))
        a = float(m.group(4)) if m.group(4) is not None else 1.0
        return (r, g, b, a), None

    if v.startswith('linear-gradient') or v.startswith('radial-gradient'):
        found = _GRAD_COLOR.search(v)
        if found:
            rgba, _ = parse_color(found.group(0), scope, _depth + 1)
            return rgba, 'gradient (first stop sampled)'
        return None, 'gradient (no stop parsed)'

    return None, 'unparseable'


# ── CSS block extraction ───────────────────────────────────────────────────

def _strip_comments(css):
    return re.sub(r'/\*.*?\*/', '', css, flags=re.DOTALL)


def extract_decls(css, selector):
    """Merge --custom-prop declarations from every rule whose selector matches
    `selector` exactly (next non-space char after the selector is `{`)."""
    out = {}
    esc = re.escape(selector)
    for m in re.finditer(r'(?:^|[}{;])\s*' + esc + r'\s*\{', css):
        i = m.end()  # just past the opening brace
        depth = 1
        start = i
        while i < len(css) and depth:
            if css[i] == '{':
                depth += 1
            elif css[i] == '}':
                depth -= 1
            i += 1
        body = css[start:i - 1]
        for d in re.finditer(r'(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);', body):
            out[d.group(1)] = d.group(2).strip()
    return out


def build_scopes(css_path):
    css = _strip_comments(open(css_path, encoding='utf-8').read())

    # Raw selectors — extract_decls applies re.escape itself.
    root = extract_decls(css, ':root')
    dark_root = extract_decls(css, '[data-theme="dark"]')
    docface = extract_decls(css, '.docface')
    dark_docface = extract_decls(css, '[data-theme="dark"] .docface')
    print_docface = extract_decls(css, 'body.doc-printing .doc-print .docface')

    light = dict(root)
    dark = {**root, **dark_root}

    # Doc-card token contexts (doc tokens live on .docface, not :root).
    doc_light = {**light, **docface}
    doc_dark = {**dark, **docface, **dark_docface}
    doc_print = {**doc_dark, **print_docface}  # print re-force wins over dark

    return {
        'light': light, 'dark': dark,
        'doc_light': doc_light, 'doc_dark': doc_dark, 'doc_print': doc_print,
    }


# ── Pair definitions ───────────────────────────────────────────────────────

# (label, fg_token, bg_token, base_token_for_compositing, large_text?)
DOMAINS = ['sage', 'rose', 'amber', 'lav', 'sky', 'caution', 'warn', 'danger']

def general_pairs(base):
    pairs = []
    surface_dom = {'lav': 'lav', 'caution': 'caution', 'warn': 'warn',
                   'danger': 'danger', 'sage': 'sage', 'rose': 'rose',
                   'amber': 'amber', 'sky': 'sky'}
    for dom in DOMAINS:
        sd = surface_dom.get(dom, dom)
        pairs.append((f'--tc-{dom} on --surface-{sd}', f'--tc-{dom}',
                      f'--surface-{sd}', base, False))
    # Text colours with no domain wash → measured on the base card.
    for tc in ['--tc-indigo', '--tc-peach', '--tc-sage-light']:
        pairs.append((f'{tc} on {base}', tc, base, None, False))
    # Body text on the three base surfaces.
    for bg in ['--surface', '--card-bg', '--surface-alt']:
        pairs.append((f'--text on {bg}', '--text', bg, None, False))
    return pairs


def doc_pairs():
    """Doctor-card text pairs. The --tc-rose/--doc-note-bg pair is the stamped
    adrenaline TIME — the PR #235 safety case."""
    return [
        ('--doc-ink on --doc-paper',        '--doc-ink',        '--doc-paper', None, False),
        ('--doc-ink-soft on --doc-paper',   '--doc-ink-soft',   '--doc-paper', None, False),
        ('--doc-muted on --doc-paper',      '--doc-muted',      '--doc-paper', None, False),
        ('--doc-placeholder on --doc-paper', '--doc-placeholder', '--doc-paper', None, False),
        ('--tc-rose (stamped TIME) on --doc-note-bg', '--tc-rose', '--doc-note-bg', '--doc-paper', False),
        ('--tc-rose (field label) on --doc-paper',    '--tc-rose', '--doc-paper',   None,          False),
    ]


# ── Evaluation + reporting ─────────────────────────────────────────────────

def resolve_bg(bg_token, base_token, scope):
    rgba, note = parse_color(scope.get(bg_token, bg_token), scope)
    if rgba is None:
        return None, note
    if rgba[3] < 1.0 and base_token:
        base_rgba, _ = parse_color(scope.get(base_token, base_token), scope)
        if base_rgba:
            return composite_over(rgba, base_rgba[:3]), (note or '')
    return rgba[:3], (note or '')


def evaluate(pairs, scope):
    rows = []
    for label, fg_tok, bg_tok, base_tok, large in pairs:
        fg_rgba, fnote = parse_color(scope.get(fg_tok, fg_tok), scope)
        bg_rgb, bnote = resolve_bg(bg_tok, base_tok, scope)
        if fg_rgba is None or bg_rgb is None:
            rows.append((label, None, None, (fnote or bnote or 'unresolved'), large))
            continue
        fg_rgb = composite_over(fg_rgba, bg_rgb) if fg_rgba[3] < 1.0 else fg_rgba[:3]
        ratio = contrast_ratio(fg_rgb, bg_rgb)
        aa_floor = 3.0 if large else 4.5
        verdict = 'PASS' if ratio >= aa_floor else 'FAIL'
        note = '; '.join(n for n in (fnote, bnote) if n)
        rows.append((label, ratio, verdict, note, large))
    return rows


def print_context(title, rows):
    print(f'\n  {title}')
    print('  ' + '-' * 74)
    fails = 0
    for label, ratio, verdict, note, large in rows:
        if ratio is None:
            print(f'    [skip] {label:<48}  {note}')
            continue
        floor = '3.0' if large else '4.5'
        mark = 'ok ' if verdict == 'PASS' else 'XX '
        if verdict == 'FAIL':
            fails += 1
        extra = f'  ({note})' if note else ''
        print(f'    [{mark}] {label:<48}  {ratio:5.2f}:1  (AA>={floor}){extra}')
    return fails


def main():
    ap = argparse.ArgumentParser(description='WCAG contrast audit for SproutLab tokens.')
    here = os.path.dirname(os.path.abspath(__file__))
    default_css = os.path.normpath(os.path.join(here, '..', 'split', 'styles.css'))
    ap.add_argument('--css', default=default_css, help='path to styles.css')
    ap.add_argument('--strict', action='store_true',
                    help='exit 1 if any AA failure (use as a build gate)')
    args = ap.parse_args()

    if not os.path.exists(args.css):
        print(f'error: stylesheet not found: {args.css}', file=sys.stderr)
        return 2

    scopes = build_scopes(args.css)

    print('SproutLab contrast audit (WCAG 2.x AA)  —  source:', os.path.relpath(args.css))
    total_fails = 0
    total_fails += print_context('LIGHT screen', evaluate(general_pairs('--card-bg'), scopes['light']))
    total_fails += print_context('DARK screen',  evaluate(general_pairs('--surface'), scopes['dark']))
    total_fails += print_context('Doctor card — LIGHT screen',     evaluate(doc_pairs(), scopes['doc_light']))
    total_fails += print_context('Doctor card — DARK screen',      evaluate(doc_pairs(), scopes['doc_dark']))
    total_fails += print_context('Doctor card — PRINT (from dark)', evaluate(doc_pairs(), scopes['doc_print']))

    print('\n  ' + '=' * 74)
    if total_fails:
        print(f'  {total_fails} AA failure(s).')
    else:
        print('  All measured pairs pass AA.')
    print('  Note: domain text colours are treated as normal text (AA>=4.5). A pair that')
    print('  only renders as large/bold headings (AA>=3.0) may pass in context.\n')

    if args.strict and total_fails:
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
