// docs/POOP_COLOR_REFERENCE.html generator — Mode-2-consult priority-1 build artifact.
//
// Reads the canonical token + override + lexicon sources from the live tree
// and emits a self-contained reference HTML at docs/POOP_COLOR_REFERENCE.html.
// Three visually-grouped column-blocks per Maren's refinement on Kael's
// Section-2 recommendation:
//   1. Care-Region render — Maren-primary consult surface
//   2. Contrast cells — shared consult surface
//   3. Lexicon membership — Kael-primary consult surface (POOP_COLOR_HEX +
//      SAFE_POOP_COLORS), included for cross-jurisdiction visibility.
//
// Sources of truth (NOT duplicated here — read each build):
//   - split/styles.css :root --poop-c-* tokens (8 colors)
//   - split/styles.css [data-theme="dark"] .poop-swatch[data-pcolor=X] overrides
//   - split/styles.css [data-theme="dark"] .poop-bar-seg[data-pcolor=X] overrides
//   - split/styles.css [data-theme="dark"] --warm / --surface backgrounds
//   - split/styles.css .poop-swatch[data-pcolor="white"] box-shadow + border
//   - split/medical.js POOP_COLOR_HEX keys (canonical 8)
//   - split/core.js SAFE_POOP_COLORS (scoring whitelist)
//
// CLAUDE.md policy-floor clause: "the chart wins on token-value snapshots,
//  CLAUDE.md wins on usage rules" (parallel to MODULE_MAP.html precedent).
//
// Invoked from split/build.sh before HTML concat. Pure Node, zero deps.

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const stylesPath  = join(__dirname, 'styles.css');
const medicalPath = join(__dirname, 'medical.js');
const corePath    = join(__dirname, 'core.js');
const outPath     = join(__dirname, '..', 'docs', 'POOP_COLOR_REFERENCE.html');

const styles  = readFileSync(stylesPath, 'utf8');
const medical = readFileSync(medicalPath, 'utf8');
const core    = readFileSync(corePath, 'utf8');

// ── parse light-theme tokens ──
function parseToken(name) {
  const re = new RegExp('--' + name + ':\\s*([#a-zA-Z0-9(),.\\s/-]+?);');
  const m = styles.match(re);
  return m ? m[1].trim() : null;
}

// First :root block holds light theme; dark theme is at [data-theme="dark"] :root.
const lightThemeBlock = styles.split(/\[data-theme="dark"\]\s*:root/)[0];
const darkThemeMatch  = styles.match(/\[data-theme="dark"\]\s*:root\s*{([^}]+)}/);
const darkThemeBlock  = darkThemeMatch ? darkThemeMatch[1] : '';

function tokenIn(block, name) {
  const re = new RegExp('--' + name + ':\\s*([#a-zA-Z0-9(),.\\s/-]+?);');
  const m = block.match(re);
  return m ? m[1].trim() : null;
}

const COLORS = ['yellow', 'green', 'brown', 'dark', 'orange', 'red', 'white', 'black'];

const tokens = {};
for (const c of COLORS) tokens[c] = tokenIn(lightThemeBlock, 'poop-c-' + c);

// ── parse dark-theme overrides ──
const darkSwatchOverride = {};
const darkBarSegOverride = {};
for (const c of COLORS) {
  const swRe = new RegExp(
    '\\[data-theme="dark"\\]\\s*\\.poop-swatch\\[data-pcolor="' + c + '"\\][^{]*{\\s*background:\\s*([^;]+);'
  );
  const bsRe = new RegExp(
    '\\[data-theme="dark"\\]\\s*\\.poop-bar-seg\\[data-pcolor="' + c + '"\\][^{]*{\\s*background:\\s*([^;]+);'
  );
  const sm = styles.match(swRe);
  const bm = styles.match(bsRe);
  if (sm) darkSwatchOverride[c] = sm[1].trim();
  if (bm) darkBarSegOverride[c] = bm[1].trim();
}

// ── backgrounds for contrast computation ──
const lightWarm    = tokenIn(lightThemeBlock, 'warm')    || '#fef6f0';
const lightSurface = '#ffffff'; // --surface: var(--white) in light theme
const lightAmber   = tokenIn(lightThemeBlock, 'amber-light') || '#fef6e8';
const darkWarm     = tokenIn(darkThemeBlock,  'warm')    || '#221c28';
const darkSurface  = tokenIn(darkThemeBlock,  'surface') || '#2a2230';
const darkAmber    = tokenIn(darkThemeBlock,  'amber-light') || '#352e1e';

// ── lexicons ──
const hexMatch = medical.match(/const POOP_COLOR_HEX = \{([^}]+)\}/);
const poopColorHexKeys = hexMatch
  ? [...hexMatch[1].matchAll(/(\w+):\s*'#/g)].map(m => m[1])
  : [];

const safeMatch = core.match(/const SAFE_POOP_COLORS = \[([^\]]+)\]/);
const safePoopColors = safeMatch
  ? [...safeMatch[1].matchAll(/'(\w+)'/g)].map(m => m[1])
  : [];

// ── WCAG contrast ──
function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  return [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
}
function relLuminance(rgb) {
  const [r, g, b] = rgb.map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrastRatio(hex1, hex2) {
  const L1 = relLuminance(hexToRgb(hex1));
  const L2 = relLuminance(hexToRgb(hex2));
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}
function wcagFlag(ratio) {
  if (ratio >= 4.5) return { tier: 'AA', cls: 'ok'   };
  if (ratio >= 3.0) return { tier: 'AA-large', cls: 'mid' };
  return { tier: 'fail', cls: 'fail' };
}

// ── render ──
function row(c) {
  const lightHex = tokens[c];
  const darkHex  = darkSwatchOverride[c] || lightHex;

  const cLightWarm    = contrastRatio(lightHex, lightWarm);
  const cLightAmber   = contrastRatio(lightHex, lightAmber);
  const cDarkSurface  = contrastRatio(darkHex,  darkSurface);
  const cDarkWarm     = contrastRatio(darkHex,  darkWarm);

  const inHex  = poopColorHexKeys.includes(c);
  const inSafe = safePoopColors.includes(c);

  // White swatch needs the inset shadow + heavier border to crisp against cream;
  // black swatch has no special light-theme treatment; dark-theme overrides
  // already cover black/dark dissolution risk.
  const lightSwStyle = c === 'white'
    ? 'background:' + lightHex + ';border:1px solid rgba(0,0,0,0.18);box-shadow:inset 0 0 0 1px rgba(0,0,0,0.08);'
    : 'background:' + lightHex + ';border:1px solid rgba(0,0,0,0.08);';
  const darkSwStyle  = 'background:' + darkHex + ';border:1px solid rgba(255,255,255,0.20);';

  const lightAmberSwStyle = c === 'white'
    ? 'background:' + lightHex + ';border:1px solid rgba(0,0,0,0.18);box-shadow:inset 0 0 0 1px rgba(0,0,0,0.08);'
    : 'background:' + lightHex + ';border:1px solid rgba(0,0,0,0.08);';
  // Picker context: 16px + 1.5px border per .poop-color-btn .poop-swatch
  const pickerSwStyle = c === 'white'
    ? 'background:' + lightHex + ';border:1.5px solid rgba(0,0,0,0.18);width:16px;height:16px;'
    : 'background:' + lightHex + ';border:1.5px solid rgba(0,0,0,0.10);width:16px;height:16px;';

  return `
    <tr>
      <th class="row-name">${c}</th>

      <!-- Care-Region render block (Maren-primary) -->
      <td class="cell-care">
        <code>${lightHex}</code>
      </td>
      <td class="cell-care swatch-cell" style="background:${lightWarm};">
        <span class="sw" style="${lightSwStyle}"></span>
      </td>
      <td class="cell-care swatch-cell" style="background:${darkSurface};">
        <span class="sw" style="${darkSwStyle}"></span>
      </td>
      <td class="cell-care swatch-cell" style="background:${lightAmber};">
        <span class="sw" style="${lightAmberSwStyle}"></span>
      </td>
      <td class="cell-care swatch-cell picker-cell">
        <span class="picker-chip"><span class="sw" style="${pickerSwStyle}"></span> ${c[0].toUpperCase()}${c.slice(1)}</span>
      </td>

      <!-- Contrast cells (shared) -->
      <td class="cell-contrast ${wcagFlag(cLightWarm).cls}">
        ${cLightWarm.toFixed(1)}<small>${wcagFlag(cLightWarm).tier}</small>
      </td>
      <td class="cell-contrast ${wcagFlag(cLightAmber).cls}">
        ${cLightAmber.toFixed(1)}<small>${wcagFlag(cLightAmber).tier}</small>
      </td>
      <td class="cell-contrast ${wcagFlag(cDarkSurface).cls}">
        ${cDarkSurface.toFixed(1)}<small>${wcagFlag(cDarkSurface).tier}</small>
      </td>
      <td class="cell-contrast ${wcagFlag(cDarkWarm).cls}">
        ${cDarkWarm.toFixed(1)}<small>${wcagFlag(cDarkWarm).tier}</small>
      </td>

      <!-- Lexicon membership (Kael-primary) — inline SVG check per HR-1
           (this source is on the audit-emoji.sh path; U+2713 checkmark is
           blocked by the Dingbats range). HR-7-spirit: icons via SVG. -->
      <td class="cell-lex ${inHex ? 'in' : 'out'}">${inHex ? '<svg viewBox="0 0 14 14" width="14" height="14"><path d="M2 7l3 3 7-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '·'}</td>
      <td class="cell-lex ${inSafe ? 'in' : 'out'}">${inSafe ? '<svg viewBox="0 0 14 14" width="14" height="14"><path d="M2 7l3 3 7-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '·'}</td>
    </tr>
  `;
}

const generatedAt = new Date().toISOString().replace(/T.*/, '');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SproutLab Poop-Color Reference</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Nunito:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root {
  --serif: 'Fraunces', Georgia, serif;
  --sans:  'Nunito', -apple-system, BlinkMacSystemFont, sans-serif;
  --mono:  'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace;
  --ink: #2b2a28;
  --ink-soft: #5a5651;
  --ink-faint: #8c867f;
  --paper: #fdfaf4;
  --line: #e6dfd1;

  /* Block tints — match Maren's three-column-group refinement */
  --care-tint:     #fbf3f4;   /* soft rose wash — Maren-primary */
  --shared-tint:   #f7f5f1;   /* parchment — shared */
  --kael-tint:     #f5f3fb;   /* soft lavender wash — Kael-primary */

  --ok:   #1a7a42;
  --mid:  #8a6520;
  --fail: #a03030;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: var(--sans);
  color: var(--ink);
  background: var(--paper);
  padding: 32px 24px 64px;
  max-width: 1280px;
  margin: 0 auto;
}
h1 { font-family: var(--serif); font-weight: 600; font-size: 28px; margin: 0 0 4px; }
h2 { font-family: var(--serif); font-weight: 600; font-size: 18px; margin: 32px 0 8px; color: var(--ink-soft); }
.subtitle { color: var(--ink-faint); font-size: 14px; margin-bottom: 24px; }
.subtitle code { font-family: var(--mono); font-size: 12px; }
.meta-bar {
  display: flex; gap: 16px; flex-wrap: wrap;
  padding: 10px 14px;
  background: var(--shared-tint);
  border: 1px solid var(--line);
  border-radius: 8px;
  font-size: 13px;
  color: var(--ink-soft);
  margin-bottom: 20px;
}
.meta-bar span code { font-family: var(--mono); font-size: 12px; color: var(--ink); }
table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
th, td { padding: 8px 10px; text-align: center; vertical-align: middle; border-bottom: 1px solid var(--line); }
thead th { font-weight: 600; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.04em; font-size: 11px; padding-top: 12px; padding-bottom: 12px; }
.row-name { text-align: left; font-weight: 600; text-transform: capitalize; font-family: var(--serif); font-size: 15px; padding-left: 14px; }
code { font-family: var(--mono); font-size: 12px; color: var(--ink-soft); }

/* Three-column-group blocks */
.cell-care     { background: var(--care-tint); }
.cell-contrast { background: var(--shared-tint); font-family: var(--mono); }
.cell-lex      { background: var(--kael-tint); font-family: var(--mono); font-size: 16px; font-weight: 600; }
.cell-lex.out  { color: var(--ink-faint); }
.cell-lex.in   { color: var(--ok); }
.cell-contrast.ok   { color: var(--ok); font-weight: 600; }
.cell-contrast.mid  { color: var(--mid); font-weight: 600; }
.cell-contrast.fail { color: var(--fail); font-weight: 600; }
.cell-contrast small { display:block; font-size:10px; opacity:0.7; text-transform:uppercase; letter-spacing:0.04em; }

.group-care     { color: #b0485e; }
.group-shared   { color: #6a5a45; }
.group-kael     { color: #5a4ba3; }

.swatch-cell { padding: 6px 10px; }
.sw {
  display: inline-block;
  width: 22px; height: 22px; border-radius: 50%;
  vertical-align: middle;
}
.picker-chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 10px;
  background: var(--paper);
  border: 1.5px solid var(--line);
  border-radius: 999px;
  font-family: var(--sans); font-size: 12px; font-weight: 600; color: var(--ink-soft);
}
.picker-cell { background: transparent; }

.legend {
  margin-top: 24px; padding: 14px 18px;
  background: var(--shared-tint);
  border: 1px solid var(--line);
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--ink-soft);
}
.legend strong { color: var(--ink); font-weight: 600; }
.legend .swatch-key { display:inline-block; width:14px; height:14px; border-radius:50%; vertical-align:middle; margin: 0 4px; border:1px solid rgba(0,0,0,0.08); }
.legend code { color: var(--ink); }

.footer { margin-top: 32px; color: var(--ink-faint); font-size: 12px; line-height: 1.6; }
.footer code { color: var(--ink-soft); }
</style>
</head>
<body>
<h1>Poop-Color Reference</h1>
<p class="subtitle">SproutLab — token + render + contrast + lexicon snapshot. Generated <code>${generatedAt}</code>. Per the policy-floor clause in CLAUDE.md, <strong>this chart wins on token-value snapshots</strong>; CLAUDE.md wins on usage rules.</p>

<div class="meta-bar">
  <span>light <code>--warm</code> <code>${lightWarm}</code></span>
  <span>light <code>--amber-light</code> <code>${lightAmber}</code></span>
  <span>dark <code>--surface</code> <code>${darkSurface}</code></span>
  <span>dark <code>--warm</code> <code>${darkWarm}</code></span>
</div>

<h2>Render × Contrast × Lexicon</h2>
<table>
<thead>
  <tr>
    <th rowspan="2" class="row-name">Color</th>
    <th colspan="5" class="group-care">Care-Region render <small>(Maren-primary)</small></th>
    <th colspan="4" class="group-shared">Contrast vs surface <small>(shared)</small></th>
    <th colspan="2" class="group-kael">Lexicon <small>(Kael-primary)</small></th>
  </tr>
  <tr>
    <th class="group-care">Token</th>
    <th class="group-care">Light card</th>
    <th class="group-care">Dark surface</th>
    <th class="group-care">Amber card</th>
    <th class="group-care">Picker chip</th>
    <th class="group-shared">vs <code>--warm</code> light</th>
    <th class="group-shared">vs <code>--amber-light</code></th>
    <th class="group-shared">vs <code>--surface</code> dark</th>
    <th class="group-shared">vs <code>--warm</code> dark</th>
    <th class="group-kael"><code>POOP_COLOR_HEX</code></th>
    <th class="group-kael"><code>SAFE_POOP_COLORS</code></th>
  </tr>
</thead>
<tbody>
${COLORS.map(row).join('')}
</tbody>
</table>

<div class="legend">
<p><strong>Reading the chart.</strong> Three column-groups, three audit lenses:</p>
<p><strong class="group-care">Care-Region render</strong> — Maren-primary consult. Each swatch rendered against the actual background it sits on. <em>Light card</em> uses <code>--warm</code> (the page-body cream). <em>Dark surface</em> uses <code>--surface</code> (the dark-theme card body, where <code>--poop-c-black</code> and <code>--poop-c-dark</code> would dissolve without the V-M-10 overrides at <code>styles.css:4843-4846</code>; this column shows the corrected dark-theme renders). <em>Amber card</em> uses <code>--amber-light</code> (the Color-Guide tip background). <em>Picker chip</em> shows the 16px + 1.5px-border picker-context swatch.</p>
<p><strong class="group-shared">Contrast vs surface</strong> — shared consult. WCAG contrast ratios. <span class="group-shared" style="color:var(--ok);font-weight:600;">AA</span> = ratio ≥ 4.5 (text-grade). <span class="group-shared" style="color:var(--mid);font-weight:600;">AA-large</span> = ratio ≥ 3.0 (large-text or graphical-element grade; swatches qualify as graphical UI components per WCAG 1.4.11). <span class="group-shared" style="color:var(--fail);font-weight:600;">fail</span> = below 3.0 (likely visually indistinguishable on this surface).</p>
<p><strong class="group-kael">Lexicon membership</strong> — Kael-primary consult. <code>POOP_COLOR_HEX</code> at <code>medical.js:5967</code> drives the picker + render-attribute whitelist. <code>SAFE_POOP_COLORS</code> at <code>core.js:1540</code> drives the poop-score color-safety branch. A picker key absent from <code>SAFE_POOP_COLORS</code> falls through the score branch — V-K-3 (PR #75 Round 2) was this exact lens-flip on <code>'dark'</code>. The lens-flip discipline (canon-cc-2026-05-17-002) catches these; the chart visualizes them. Per the V-K-16 paired note: chart and lens-flip are <em>complementary</em>, not substitutive.</p>
</div>

<div class="footer">
<p>Generated by <code>split/build-poop-reference.mjs</code> as part of <code>bash split/build.sh</code>. Drift-check: re-run the build; <code>git diff</code> on this file shows the snapshot delta. Source-of-truth: <code>split/styles.css</code> (tokens + overrides), <code>split/medical.js</code> (<code>POOP_COLOR_HEX</code>), <code>split/core.js</code> (<code>SAFE_POOP_COLORS</code>).</p>
<p>Origin: Maren V-K-15 / V-M-10 / V-M-11 audit-cycle-counterfactual; Kael Mode-2 Section-2 recommendation (Candidate A + D + lexicon); Maren refinement (three-block column-grouping); Lyra synthesis on the s-2026-05-17-02 consult; Architect ratification 2026-05-17.</p>
</div>
</body>
</html>
`;

writeFileSync(outPath, html);
console.error('[poop-reference] wrote ' + outPath);
