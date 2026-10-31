#!/usr/bin/env bash
# audit-growth-age-v1.sh — PC-1 ship-gate (docs/PATCH_CLASSES.md; BUGS.md S2–S4 #25).
#
# A growth-velocity verdict is judged at the age of the measurement it was computed from, never
# today's age: two cards judging the same gain at different ages disagreed at a bracket edge
# (#25). This gate fails when a growthVelocityBand(...) call is fed today's age, either directly
# (`growthVelocityBand(ageAt().months)`) or through a variable assigned from ageAt( /
# getAgeInMonths( in the lines above the call. Measurement-age helpers (gvAgeAt, ageMonthsAt, a
# window midpoint) pass. A deliberate exception carries `// growth-age-ok: <reason>` on the call
# line. Self-tests run first, so a scanner regression fails the build (PC-5).
set -euo pipefail
cd "$(dirname "$0")"
node - <<'NODE'
const fs = require('fs');
const TODAY = /\b(ageAt|getAgeInMonths)\s*\(/;
const OK = /\b(gvAgeAt|ageMonthsAt|_gvMidpoint|gvWindowMid)\w*\s*\(/;
function scan(name, src, log) {
  const lines = src.split('\n'); let bad = 0;
  lines.forEach((ln, k) => {
    if (/function\s+growthVelocityBand\s*\(/.test(ln) || /growth-age-ok:/.test(ln)) return;
    const re = /growthVelocityBand\s*\(([^)]*\)?[^)]*)\)/g; let m;
    while ((m = re.exec(ln))) {
      const arg = m[1].trim();
      if (TODAY.test(arg) && !OK.test(arg)) { bad++; log(`audit-growth-age: ${name}:${k + 1} growthVelocityBand is fed today's age: ${arg}`); continue; }
      const id = /^[A-Za-z_$][\w$]*$/.test(arg) ? arg : null;
      if (!id) continue;
      for (let j = k; j >= Math.max(0, k - 40); j--) {
        const a = new RegExp('(?:\\b(?:const|let|var)\\s+|^\\s*|[;,]\\s*)' + id.replace(/\$/g, '\\$') + '\\s*=(?!=)\\s*(.*)').exec(lines[j]);
        if (!a) continue;
        if (TODAY.test(a[1]) && !OK.test(a[1])) { bad++; log(`audit-growth-age: ${name}:${k + 1} growthVelocityBand(${id}) where ${id} is today's age (line ${j + 1}: ${a[1].trim().slice(0, 80)})`); }
        break;
      }
    }
  });
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
];
let fails = 0;
T.forEach((t, i) => { const n = scan('fixture' + i, t.src, () => {}); if (n !== t.bad) { fails++; console.error(`audit-growth-age: SELF-TEST FAIL fixture ${i}: ${n} (want ${t.bad})`); } });
if (fails) { console.error(`audit-growth-age: FAIL (scanner self-test, ${fails} of ${T.length})`); process.exit(2); }
let bad = 0;
fs.readdirSync('.').filter(f => /\.js$/.test(f)).forEach(f => { bad += scan(f, fs.readFileSync(f, 'utf8'), m => console.error(m)); });
if (bad) { console.error(`audit-growth-age: FAIL (${bad} growth verdict(s) judged at today's age; use gvAgeAt(entry) / the window's measurement age — PATCH_CLASSES PC-1)`); process.exit(1); }
console.error('audit-growth-age: PASS (self-test ok; every growthVelocityBand call takes a measurement age)');
NODE
