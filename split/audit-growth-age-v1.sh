#!/usr/bin/env bash
# audit-growth-age-v1.sh — PC-1 ship-gate (docs/PATCH_CLASSES.md; BUGS.md S2–S4 #25).
#
# A growth-velocity verdict is judged at the age of the measurement it was computed from, never
# today's age: two cards judging the same gain at different ages disagreed at a bracket edge
# (#25). This gate checks the age argument of every band / verdict helper —
#   growthVelocityBand(age), gvBandVerdict(gain, age), gvWeightVerdict(gain, age, latestAge),
#   _gvNewbornWindow(age)
# — and fails when it is today's age: ageAt( / getAgeInMonths( / today() / new Date() anywhere
# in the argument, a no-argument gvAgeAt() (which falls back to today), or any identifier in the
# argument whose assignment in the 40 lines above (joined across lines up to `;`) uses one of
# those, including a ternary fallback. Calls may span lines. A deliberate exception carries
# `// growth-age-ok: <reason>` on the call's first line. Self-tests run first (including the
# bypasses Kael and Carina found, V-K-282c-4 / V-CA-282c-1 / V-CA-282d-2), so a scanner
# regression fails the build (PC-5). Tracing follows destructuring, obj.prop assignments and up
# to three hops; string literals inside the arguments are skipped.
set -euo pipefail
cd "$(dirname "$0")"
node - <<'NODE'
const fs = require('fs');
const WATCH = { growthVelocityBand: [0], gvBandVerdict: [1], gvWeightVerdict: [1, 2], _gvNewbornWindow: [0] };
const TODAY = /\bageAt\s*\(|\bageAt\w*\s*\(\s*\)|\bpreciseAge\s*\(|\bgetAgeInMonths\s*\(|\btoday\s*\(\s*\)|new\s+Date\s*\(\s*\)|\bDate\.now\s*\(|\bgvAgeAt\s*\(\s*\)/;
function args(src, open) {            // top-level args of the call whose '(' is at `open`
  let depth = 0, cur = '', out = [], q = null;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (q) { cur += c; if (c === '\\') { cur += src[++i] || ''; } else if (c === q) q = null; continue; }   // inside a string
    if (c === "'" || c === '"' || c === '`') { q = c; cur += c; continue; }
    if (c === '(' || c === '[' || c === '{') { if (depth++ > 0) cur += c; continue; }
    if (c === ')' || c === ']' || c === '}') { if (--depth === 0) { out.push(cur.trim()); break; } cur += c; continue; }
    if (c === ',' && depth === 1) { out.push(cur.trim()); cur = ''; continue; }
    if (depth >= 1) cur += c;
  }
  return out;
}
const esc = x => x.replace(/[$.]/g, '\\$&');
// Names an expression reads: identifier heads and member paths (a.b, a.b.c), never callees.
function namesIn(expr) {
  const out = new Set(), noStr = expr.replace(/(['"`])(?:\\.|(?!\1).)*\1/g, '""');
  noStr.replace(/(^|[^.\w$])([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)(?!\s*\()/g, (_, p, path) => {
    const parts = path.split('.');
    if (/^(Math|Number|null|undefined|true|false|NaN|this)$/.test(parts[0])) return _;
    for (let i = parts.length; i >= 1; i--) out.add(parts.slice(0, i).join('.'));
    return _;
  });
  return out;
}
// The right-hand side assigned to `name` in the 40 lines above line index `ln` (joined up to ';'),
// covering `const x =`, `x =`, `obj.p =` and destructuring `const { p } =` / `const { p: x } =`.
function rhsOf(lines, name, ln) {
  const n = esc(name), leaf = name.split('.').pop();
  const plain = new RegExp('(?:\\b(?:const|let|var)\\s+|^\\s*|[;,{(]\\s*)' + n + '\\s*=(?![=>])\\s*(.*)');
  const destr = name.includes('.') ? null : new RegExp('\\b(?:const|let|var)\\s*\\{[^}]*?(?:\\b' + n + '\\s*(?=[,}=])|:\\s*' + n + '\\b)[^}]*\\}\\s*=\\s*(.*)');
  for (let j = ln - 1; j >= Math.max(0, ln - 41); j--) {
    const am = plain.exec(lines[j]) || (destr && destr.exec(lines[j]));
    if (!am) continue;
    let rhs = am[1];
    for (let k = j + 1; k < Math.min(lines.length, j + 30) && !/;\s*(\/\/.*)?$/.test(rhs); k++) rhs += ' ' + lines[k].trim();
    return { rhs, line: j };
  }
  return null;
}
// Does `expr` (read at line index ln) carry today's age, directly or through up to 3 assignments?
function tainted(lines, expr, ln, depth, seen) {
  if (TODAY.test(expr)) return expr;
  if (depth > 3) return null;
  for (const name of namesIn(expr)) {
    if (seen.has(name)) continue; seen.add(name);
    const a = rhsOf(lines, name, ln);
    if (!a) continue;
    const hit = tainted(lines, a.rhs, a.line, depth + 1, seen);
    if (hit) return `${name} (line ${a.line + 1}: ${a.rhs.trim().slice(0, 60)})`;
  }
  return null;
}
function scan(name, src, log) {
  let bad = 0;
  const lineOf = idx => src.slice(0, idx).split('\n').length;
  const lines = src.split('\n');
  const re = new RegExp('\\b(' + Object.keys(WATCH).join('|') + ')\\s*\\(', 'g'); let m;
  while ((m = re.exec(src))) {
    const before = src.slice(Math.max(0, m.index - 12), m.index);
    if (/function\s+$/.test(before)) continue;                       // the definition itself
    const ln = lineOf(m.index);
    if (/growth-age-ok:/.test(lines[ln - 1] || '')) continue;
    const a = args(src, m.index + m[0].length - 1);
    for (const k of WATCH[m[1]]) {
      const arg = a[k]; if (!arg) continue;
      const hit = tainted(lines, arg, ln - 1, 0, new Set());
      if (hit) { bad++; log(`audit-growth-age: ${name}:${ln} ${m[1]}(${arg.replace(/\s+/g, ' ').slice(0, 40)}) is today's age via ${hit.replace(/\s+/g, ' ').slice(0, 100)}`); }
    }
  }
  return bad;
}
// ── Self-test: each fixture with the count the scanner must give. ──
const T = [
  { src: 'const b = growthVelocityBand(ageAt().months);', bad: 1 },
  { src: 'const b = growthVelocityBand(getAgeInMonths());', bad: 1 },
  { src: 'const mo = ageAt().months;\nconst b = growthVelocityBand(mo);', bad: 1 },
  { src: 'const mo = gvAgeAt(v.wtLatest);\nconst b = growthVelocityBand(mo);', bad: 0 },
  { src: 'const b = growthVelocityBand(gvAgeAt(v.htLatest));', bad: 0 },
  { src: 'var m = ageMonthsAt(latest.date);\nvar b = growthVelocityBand(m);', bad: 0 },
  { src: 'const b = growthVelocityBand(ageAt().months); // growth-age-ok: cadence only', bad: 0 },
  { src: 'function growthVelocityBand(ageMonths) { return ageAt(); }', bad: 0 },
  // Kael's bypasses (V-K-282c-4):
  { src: 'const a = ageAt();\ngrowthVelocityBand(a.months);', bad: 1 },
  { src: 'growthVelocityBand(ageMonthsAt(today()));', bad: 1 },
  { src: 'growthVelocityBand(gvAgeAt());', bad: 1 },
  { src: 'gvWeightVerdict(gw, ageAt().months); gvBandVerdict(g, getAgeInMonths()); _gvNewbornWindow(ageAt().months);', bad: 3 },
  { src: 'const mo = ageAt().months || gvAgeAt(x);\ngrowthVelocityBand(mo);', bad: 1 },
  { src: 'growthVelocityBand(\n  ageAt().months\n);', bad: 1 },
  { src: 'gvWeightVerdict(v.g, gvBandAge(v.a, v.b), gvAgeAt(v.a));', bad: 0 },
  // Carina's bypasses (V-CA-282c-1):
  { src: 'growthVelocityBand(x ? gvAgeAt(e) : ageAt().months);', bad: 1 },
  { src: 'const mo = ageAt().months;\ngrowthVelocityBand(Math.floor(mo));', bad: 1 },
  { src: 'const ctx = { mo: ageAt().months };\ngrowthVelocityBand(ctx.mo);', bad: 1 },
  { src: 'const mo = latest\n  ? gvAgeAt(latest)\n  : ageAt().months;\ngrowthVelocityBand(mo);', bad: 1 },
  { src: 'const v = getGrowthVelocity();\ngvBandVerdict(v.g, Math.floor(v.wtBandAge));', bad: 0 },
  // Carina's round-3 bypasses (V-CA-282d-2):
  { src: 'growthVelocityBand(preciseAge().months);', bad: 1 },
  { src: 'growthVelocityBand(ageAtScrapDate());', bad: 1 },
  { src: 'const { months } = ageAt();\ngrowthVelocityBand(months);', bad: 1 },
  { src: 'const a = ageAt();\nconst mo = a.months;\ngrowthVelocityBand(mo);', bad: 1 },
  { src: 'ctx.mo = ageAt().months;\ngrowthVelocityBand(ctx.mo);', bad: 1 },
  { src: 'const mo = (Date.now() - DOB) / 2.63e9;\ngrowthVelocityBand(mo);', bad: 1 },
  { src: 'const mo = x\n||\ny\n||\nz\n||\nw\n||\nq\n||\nr\n||\ns\n|| ageAt().months;\ngrowthVelocityBand(mo);', bad: 1 },
  { src: 'growthVelocityBand(lbl(")"), ageAt().months);', bad: 0 },
  { src: 'gvWeightVerdict(g, f(")"), ageAt().months);', bad: 1 },
  { src: 'const { months: m } = getGrowthVelocity();\ngrowthVelocityBand(m);', bad: 0 },
];
let fails = 0;
T.forEach((t, i) => { const n = scan('fixture' + i, t.src, () => {}); if (n !== t.bad) { fails++; console.error(`audit-growth-age: SELF-TEST FAIL fixture ${i}: ${n} (want ${t.bad})`); } });
if (fails) { console.error(`audit-growth-age: FAIL (scanner self-test, ${fails} of ${T.length})`); process.exit(2); }
let bad = 0;
fs.readdirSync('.').filter(f => /\.js$/.test(f)).forEach(f => { bad += scan(f, fs.readFileSync(f, 'utf8'), m => console.error(m)); });
if (bad) { console.error(`audit-growth-age: FAIL (${bad} growth verdict(s) judged at today's age; use gvAgeAt(entry) / the window's measurement age — PATCH_CLASSES PC-1)`); process.exit(1); }
console.error('audit-growth-age: PASS (self-test ok; every band/verdict helper takes a measurement age)');
NODE
