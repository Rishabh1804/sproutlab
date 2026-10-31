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
# bypasses Kael and Carina found, V-K-282c-4 / V-CA-282c-1), so a scanner regression fails the
# build (PC-5).
set -euo pipefail
cd "$(dirname "$0")"
node - <<'NODE'
const fs = require('fs');
const WATCH = { growthVelocityBand: [0], gvBandVerdict: [1], gvWeightVerdict: [1, 2], _gvNewbornWindow: [0] };
const TODAY = /\bageAt\s*\(|\bgetAgeInMonths\s*\(|\btoday\s*\(\s*\)|new\s+Date\s*\(\s*\)|\bgvAgeAt\s*\(\s*\)/;
function args(src, open) {            // top-level args of the call whose '(' is at `open`; end index
  let depth = 0, cur = '', out = [], i = open;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '(' || c === '[' || c === '{') { if (depth++ > 0) cur += c; continue; }
    if (c === ')' || c === ']' || c === '}') { if (--depth === 0) { out.push(cur.trim()); break; } cur += c; continue; }
    if (c === ',' && depth === 1) { out.push(cur.trim()); cur = ''; continue; }
    if (depth >= 1) cur += c;
  }
  return out;
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
      if (TODAY.test(arg)) { bad++; log(`audit-growth-age: ${name}:${ln} ${m[1]} is given today's age: ${arg.replace(/\s+/g, ' ').slice(0, 80)}`); continue; }
      // Trace every identifier head in the argument (not property names, not callees).
      const ids = new Set();
      arg.replace(/(^|[^.\w$])([A-Za-z_$][\w$]*)(?!\s*\()/g, (_, p, id) => { if (!/^(Math|Number|null|undefined|true|false|NaN)$/.test(id)) ids.add(id); return _; });
      for (const id of ids) {
        for (let j = ln - 1; j >= Math.max(0, ln - 41); j--) {
          const am = new RegExp('(?:\\b(?:const|let|var)\\s+|^\\s*|[;,{(]\\s*)' + id.replace(/\$/g, '\\$') + '\\s*=(?![=>])\\s*(.*)').exec(lines[j]);
          if (!am) continue;
          let rhs = am[1];                                             // join continuation lines up to ';'
          for (let k = j + 1; k < Math.min(lines.length, j + 8) && !/;\s*(\/\/.*)?$/.test(rhs); k++) rhs += ' ' + lines[k].trim();
          if (TODAY.test(rhs)) { bad++; log(`audit-growth-age: ${name}:${ln} ${m[1]}(${arg.replace(/\s+/g, ' ').slice(0, 40)}) where ${id} is today's age (line ${j + 1}: ${rhs.trim().slice(0, 80)})`); }
          break;
        }
      }
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
];
let fails = 0;
T.forEach((t, i) => { const n = scan('fixture' + i, t.src, () => {}); if (n !== t.bad) { fails++; console.error(`audit-growth-age: SELF-TEST FAIL fixture ${i}: ${n} (want ${t.bad})`); } });
if (fails) { console.error(`audit-growth-age: FAIL (scanner self-test, ${fails} of ${T.length})`); process.exit(2); }
let bad = 0;
fs.readdirSync('.').filter(f => /\.js$/.test(f)).forEach(f => { bad += scan(f, fs.readFileSync(f, 'utf8'), m => console.error(m)); });
if (bad) { console.error(`audit-growth-age: FAIL (${bad} growth verdict(s) judged at today's age; use gvAgeAt(entry) / the window's measurement age — PATCH_CLASSES PC-1)`); process.exit(1); }
console.error('audit-growth-age: PASS (self-test ok; every band/verdict helper takes a measurement age)');
NODE
