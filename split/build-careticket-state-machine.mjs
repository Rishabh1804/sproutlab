// docs/CARETICKET_STATE_MACHINE.html generator — Mode-2-consult priority-2
// build artifact (V-M-28 — Maren-surfaced; ranked above V-M-26/V-M-27
// because CareTicket transitions are an active audit surface).
//
// Side-by-side spec-authoritative vs implementation-actual rendering for
// the 6-transition state machine documented in CARETICKETS_SPEC_v5.md §2
// "Lifecycle". Surfaces drift between the spec's canonical transitions and
// the intelligence-caretickets.js functions that implement them. Generator is mechanical:
// re-run reveals new drift via `git diff` on the generated HTML.
//
// Sources of truth:
//   - docs/CARETICKETS_SPEC_v5.md §2 §Lifecycle (6 transitions)
//   - split/intelligence-caretickets.js — ctHandleEscalation / ctResolveTicket /
//     ctReopenTicket / ctDeEscalate (4 functions effecting the 6 transitions)
//
// Per V-M-28 chronicle: "active audit surface; ranks higher than V-M-26
// vaccination timeline and V-M-27 growth-chart bands because CareTicket
// spec drift is closer to the active audit surface than vaccination-schedule
// drift or growth-chart drift."
//
// Pure Node, zero deps; invoked from split/build.sh.

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const specPath   = join(__dirname, '..', 'docs', 'CARETICKETS_SPEC_v5.md');
const intelPath  = join(__dirname, 'intelligence-caretickets.js');
const outPath    = join(__dirname, '..', 'docs', 'CARETICKET_STATE_MACHINE.html');

const spec  = readFileSync(specPath, 'utf8');
const intel = readFileSync(intelPath, 'utf8');

// ── parse spec lifecycle block ──
const lifecycleMatch = spec.match(/### Lifecycle \(6 transitions\)\s*\n\s*```\s*\n([\s\S]+?)```/);
if (!lifecycleMatch) {
  console.error('[careticket-sm] could not locate §Lifecycle block in CARETICKETS_SPEC_v5.md — abort');
  process.exit(1);
}
const lifecycleBlock = lifecycleMatch[1];

// Each line is: "  from → to  (rationale...)"
const specTransitions = [];
for (const line of lifecycleBlock.split('\n')) {
  const m = line.match(/^\s*(\w+)\s*→\s*(\w+)\s+(.*?)\s*$/);
  if (m) {
    specTransitions.push({ from: m[1], to: m[2], rationale: m[3].replace(/^\(|\)$/g, '').trim() });
  }
}

// ── parse implementation transition sites ──
// For each line of intelligence-caretickets.js where `*.status = 'X'` is set, attribute
// to the enclosing top-level function. Walk linearly.
const intelLines = intel.split('\n');
const fnHeaderRe = /^function\s+(\w+)\s*\(/;
const statusAssignRe = /\.status\s*=\s*['"](\w+)['"]/;
const implAssignments = []; // { line, fn, toState, snippet }

let currentFn = null;
for (let i = 0; i < intelLines.length; i++) {
  const fm = intelLines[i].match(fnHeaderRe);
  if (fm) currentFn = fm[1];
  const sm = intelLines[i].match(statusAssignRe);
  if (sm && currentFn && /^ct[A-Z]/.test(currentFn)) {
    implAssignments.push({
      line: i + 1,
      fn: currentFn,
      toState: sm[1],
      snippet: intelLines[i].trim()
    });
  }
}

// ── map spec transitions to implementing functions ──
// Heuristic mapping (the implementing-function names communicate intent):
//   active → escalated:    ctHandleEscalation
//   active → resolved:     ctResolveTicket (non-force path)
//   escalated → active:    ctDeEscalate
//   escalated → escalated: ctHandleEscalation (re-fires)
//   escalated → resolved:  ctResolveTicket (force=true path)
//   resolved → active:     ctReopenTicket
const TRANSITION_FUNCTIONS = {
  'active->escalated':    { fn: 'ctHandleEscalation', note: 'fires on highest-severity trigger' },
  'active->resolved':     { fn: 'ctResolveTicket',    note: 'criteria met + confirm, OR manual close' },
  'escalated->active':    { fn: 'ctDeEscalate',       note: 'clear check-in + confirm de-escalation' },
  'escalated->escalated': { fn: 'ctHandleEscalation', note: 're-fires with different/higher trigger' },
  'escalated->resolved':  { fn: 'ctResolveTicket',    note: 'force=true path; explicit confirmation + reason' },
  'resolved->active':     { fn: 'ctReopenTicket',     note: 'reopen — suggest fresh ticket after 2 reopens' }
};

for (const t of specTransitions) {
  const key = t.from + '->' + t.to;
  const entry = TRANSITION_FUNCTIONS[key];
  if (entry) {
    t.implFn = entry.fn;
    t.implNote = entry.note;
    // Locate the function's line number in intel
    const fnLine = intelLines.findIndex(l => new RegExp('^function\\s+' + entry.fn + '\\s*\\(').test(l));
    t.implLine = fnLine >= 0 ? fnLine + 1 : null;
    // Find the toState-assignment lines within this function
    t.implSites = implAssignments
      .filter(a => a.fn === entry.fn && a.toState === t.to)
      .map(a => ({ line: a.line, snippet: a.snippet }));
  } else {
    t.implFn = null;
  }
}

// ── drift report ──
const driftFlags = [];

// 1. Spec transitions without an implementation site
for (const t of specTransitions) {
  if (!t.implFn) driftFlags.push({
    severity: 'block',
    text: 'Spec transition `' + t.from + ' → ' + t.to + '` has no mapped implementing function in intelligence-caretickets.js. Drift: spec defines a transition the implementation does not effect.'
  });
  else if (t.implFn && t.implSites.length === 0) driftFlags.push({
    severity: 'should',
    text: 'Spec transition `' + t.from + ' → ' + t.to + '` maps to function `' + t.implFn + '` but the function contains no `*.status = ' + JSON.stringify(t.to) + '` assignment. Drift: function exists but does not effect the target-state transition.'
  });
}

// 2. Implementation status-assignments not covered by any spec transition
const specTargets = new Set(specTransitions.map(t => t.to));
for (const a of implAssignments) {
  if (!specTargets.has(a.toState)) driftFlags.push({
    severity: 'should',
    text: '`' + a.fn + '` at intelligence-caretickets.js:' + a.line + ' assigns status `' + a.toState + '` which is not a target-state in the spec\'s 6-transition lifecycle. Drift: implementation effects a transition the spec does not document.'
  });
}

const generatedAt = new Date().toISOString().replace(/T.*/, '');

// ── render state-machine SVG diagram ──
// 3 states (active, escalated, resolved) laid out in a triangle.
// 6 transitions as arrows. Self-loop on escalated.
const STATE_LAYOUT = {
  active:    { x: 120, y: 200, label: 'active' },
  escalated: { x: 380, y:  90, label: 'escalated' },
  resolved:  { x: 380, y: 310, label: 'resolved' }
};
const STATE_RADIUS = 50;

function arrow(from, to, label, curveOffset = 0, labelOffset = { dx: 0, dy: 0 }) {
  const a = STATE_LAYOUT[from];
  const b = STATE_LAYOUT[to];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / dist;
  const uy = dy / dist;
  // Anchor at circle edge
  const x1 = a.x + ux * STATE_RADIUS;
  const y1 = a.y + uy * STATE_RADIUS;
  const x2 = b.x - ux * STATE_RADIUS;
  const y2 = b.y - uy * STATE_RADIUS;
  // Curve via control point perpendicular offset
  const mx = (x1 + x2) / 2 + (-uy * curveOffset);
  const my = (y1 + y2) / 2 + (ux * curveOffset);
  const labelX = mx + labelOffset.dx;
  const labelY = my + labelOffset.dy;
  return `
    <path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}"
          fill="none" stroke="var(--ink-soft)" stroke-width="1.5" marker-end="url(#arrowhead)"/>
    <text x="${labelX.toFixed(1)}" y="${labelY.toFixed(1)}" class="trans-label" text-anchor="middle">${label}</text>
  `;
}

function selfLoop(state, label) {
  const s = STATE_LAYOUT[state];
  // Loop above the node
  const x1 = s.x - 18;
  const y1 = s.y - STATE_RADIUS + 4;
  const x2 = s.x + 18;
  const y2 = s.y - STATE_RADIUS + 4;
  return `
    <path d="M ${x1} ${y1} C ${s.x - 40} ${s.y - STATE_RADIUS - 50}, ${s.x + 40} ${s.y - STATE_RADIUS - 50}, ${x2} ${y2}"
          fill="none" stroke="var(--ink-soft)" stroke-width="1.5" marker-end="url(#arrowhead)"/>
    <text x="${s.x}" y="${s.y - STATE_RADIUS - 36}" class="trans-label" text-anchor="middle">${label}</text>
  `;
}

const stateColors = {
  active:    '#a8cfe0', // sky
  escalated: '#f2a8b8', // rose
  resolved:  '#b5d5c5'  // sage
};

const svgStates = Object.entries(STATE_LAYOUT).map(([k, s]) => `
    <circle cx="${s.x}" cy="${s.y}" r="${STATE_RADIUS}" fill="${stateColors[k]}" stroke="var(--ink)" stroke-width="1.5"/>
    <text x="${s.x}" y="${s.y + 5}" class="state-label" text-anchor="middle">${s.label}</text>
`).join('');

const svgTransitions = [
  arrow('active',    'escalated', '1',  30, { dx: 0,  dy: -8 }),
  arrow('active',    'resolved',  '2', -30, { dx: 0,  dy: 10 }),
  arrow('escalated', 'active',    '3', -30, { dx: -10, dy: 12 }),
  selfLoop('escalated', '4'),
  arrow('escalated', 'resolved',   '5',  20, { dx: 18, dy: 0 }),
  arrow('resolved',  'active',    '6',  30, { dx: 10, dy: -10 })
].join('');

// ── render side-by-side spec/impl table ──
const tableRows = specTransitions.map((t, idx) => {
  const sitesHtml = (t.implSites && t.implSites.length > 0)
    ? t.implSites.map(s => `<code>${t.implFn}</code> @ <code>intelligence-caretickets.js:${s.line}</code>`).join('<br>')
    : (t.implFn ? `<code>${t.implFn}</code> @ <code>intelligence-caretickets.js:${t.implLine || '?'}</code>` : `<span class="missing">no mapped implementation</span>`);
  return `
    <tr>
      <td class="cell-num">${idx + 1}</td>
      <td class="cell-spec">
        <span class="state-chip" style="background:${stateColors[t.from]}">${t.from}</span>
        <span class="arrow">→</span>
        <span class="state-chip" style="background:${stateColors[t.to]}">${t.to}</span>
      </td>
      <td class="cell-rationale">${t.rationale}</td>
      <td class="cell-impl">${sitesHtml}</td>
      <td class="cell-note">${t.implNote || ''}</td>
    </tr>
  `;
}).join('');

const driftBlock = driftFlags.length === 0
  ? `<div class="drift-clean">No spec/implementation drift detected. The 6 spec transitions all map to existing intelligence-caretickets.js functions, and no implementation status-assignment lands on a state outside the spec's 3-state lifecycle.</div>`
  : `<ul class="drift-list">${driftFlags.map(f => `<li class="drift-${f.severity}"><strong>${f.severity}</strong> · ${f.text}</li>`).join('')}</ul>`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SproutLab CareTicket State Machine</title>
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
  --spec-tint:   #fbf3f4;   /* soft rose — spec authority */
  --impl-tint:   #f5f3fb;   /* soft lavender — implementation */
  --shared-tint: #f7f5f1;   /* parchment */
  --drift-block: #a03030;
  --drift-should:#8a6520;
  --drift-clean: #1a7a42;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: var(--sans);
  color: var(--ink);
  background: var(--paper);
  padding: 32px 24px 64px;
  max-width: 1200px;
  margin: 0 auto;
}
h1 { font-family: var(--serif); font-weight: 600; font-size: 28px; margin: 0 0 4px; }
h2 { font-family: var(--serif); font-weight: 600; font-size: 18px; margin: 32px 0 12px; color: var(--ink-soft); }
.subtitle { color: var(--ink-faint); font-size: 14px; margin-bottom: 24px; }
.subtitle code { font-family: var(--mono); font-size: 12px; }

.diagram-wrap {
  display: flex; align-items: center; justify-content: center;
  background: var(--shared-tint);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 28px;
}
.diagram-wrap svg { max-width: 100%; height: auto; }
.state-label { font-family: var(--serif); font-weight: 600; font-size: 16px; fill: var(--ink); }
.trans-label { font-family: var(--mono); font-size: 13px; font-weight: 600; fill: var(--ink-soft); }

table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
thead th { font-weight: 600; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.04em; font-size: 11px; padding: 12px 10px; text-align: left; border-bottom: 2px solid var(--line); }
tbody td { padding: 10px; vertical-align: top; border-bottom: 1px solid var(--line); }
.cell-num { font-family: var(--mono); font-weight: 600; color: var(--ink-faint); width: 30px; text-align: center; }
.cell-spec  { background: var(--spec-tint); white-space: nowrap; width: 220px; }
.cell-rationale { background: var(--spec-tint); color: var(--ink-soft); }
.cell-impl  { background: var(--impl-tint); font-family: var(--mono); font-size: 12px; }
.cell-note  { background: var(--impl-tint); color: var(--ink-soft); }
.state-chip {
  display: inline-block; padding: 3px 10px; border-radius: 999px;
  font-family: var(--serif); font-weight: 600; font-size: 13px; color: var(--ink);
  border: 1px solid rgba(0,0,0,0.08);
}
.arrow { color: var(--ink-faint); margin: 0 6px; font-family: var(--mono); }
code { font-family: var(--mono); font-size: 12px; color: var(--ink); }
.missing { color: var(--drift-block); font-weight: 600; font-style: italic; }

.drift-clean { padding: 12px 16px; background: rgba(26,122,66,0.08); border-left: 3px solid var(--drift-clean); border-radius: 4px; color: var(--drift-clean); font-weight: 600; }
.drift-list { padding: 0; list-style: none; margin: 0; }
.drift-list li { padding: 10px 14px; border-radius: 4px; margin-bottom: 6px; font-size: 13px; }
.drift-block  { background: rgba(160,48,48,0.08); border-left: 3px solid var(--drift-block); }
.drift-should { background: rgba(138,101,32,0.08); border-left: 3px solid var(--drift-should); }
.drift-list strong { text-transform: uppercase; letter-spacing: 0.04em; font-size: 11px; }

.legend {
  margin-top: 24px; padding: 14px 18px;
  background: var(--shared-tint);
  border: 1px solid var(--line);
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--ink-soft);
}
.legend strong { color: var(--ink); }
.footer { margin-top: 32px; color: var(--ink-faint); font-size: 12px; line-height: 1.6; }
.footer code { color: var(--ink-soft); }
</style>
</head>
<body>
<h1>CareTicket State Machine</h1>
<p class="subtitle">SproutLab — 6-transition lifecycle, spec vs implementation. Generated <code>${generatedAt}</code>. Per the policy-floor clause in CLAUDE.md, <strong>this chart wins on transition-layout snapshots</strong>; <code>CARETICKETS_SPEC_v5.md</code> wins on transition rationale; CLAUDE.md wins on rules, HRs, build commands, persona.</p>

<div class="diagram-wrap">
<svg viewBox="0 0 520 420" width="520" height="420">
  <defs>
    <marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--ink-soft)"/>
    </marker>
  </defs>
  ${svgStates}
  ${svgTransitions}
</svg>
</div>

<h2>Spec ↔ Implementation</h2>
<table>
<thead>
  <tr>
    <th>#</th>
    <th>Transition <small>(spec)</small></th>
    <th>Rationale <small>(spec)</small></th>
    <th>Implementing function <small>(intelligence-caretickets.js)</small></th>
    <th>Note</th>
  </tr>
</thead>
<tbody>
${tableRows}
</tbody>
</table>

<h2>Drift report</h2>
${driftBlock}

<div class="legend">
<p><strong>Reading the chart.</strong> The 6 spec transitions are numbered 1-6 in the diagram and the table. <strong>Spec columns (rose tint)</strong> are authoritative on rationale; <strong>implementation columns (lavender tint)</strong> name the function in <code>intelligence-caretickets.js</code> that effects each transition. The drift report flags two failure modes: <strong>block</strong> — a spec transition with no implementation function mapped (the implementation can't produce the documented transition); <strong>should</strong> — implementation effects a transition the spec doesn't document, OR the mapped function exists but doesn't assign the documented target state.</p>
<p><strong>Per V-M-28 origin:</strong> Maren-surfaced visualization candidate from the s-2026-05-17-02 Mode-2 consult (chronicle §6); ranked priority-2 by Lyra synthesis because CareTicket transitions are an active audit surface where spec-implementation drift is consequential — <code>active → resolved</code> drift could silently mark a parent's escalation as resolved without the criteria-met-or-manual-close gate firing.</p>
</div>

<div class="footer">
<p>Generated by <code>split/build-careticket-state-machine.mjs</code> as part of <code>bash split/build.sh</code>. Drift-check: re-run the build; <code>git diff</code> shows the snapshot delta. Source-of-truth: <code>docs/CARETICKETS_SPEC_v5.md</code> §Lifecycle, <code>split/intelligence-caretickets.js</code> <code>ct*</code> handler functions.</p>
<p>Origin: Maren V-M-28 Mode-2 consult surface; Lyra synthesis priority-2; canon-cc-031 (Mode-2 deferral-closure coordinator) the procedural canon under which V-M-28 was filed; canon-cc-032 (two-reviewer-convergence-triggers-lens-flip) the parallel doctrine recognizing visualizations as audit-cycle-load-bearing artifacts; Architect ratification 2026-05-17.</p>
</div>
</body>
</html>
`;

writeFileSync(outPath, html);
console.error('[careticket-sm] wrote ' + outPath + ' — ' + specTransitions.length + ' transitions, ' + driftFlags.length + ' drift flags');
