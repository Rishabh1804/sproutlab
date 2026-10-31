#!/usr/bin/env bash
# audit-hr12-dateonly-v1.sh — PC-1 ratchet (docs/PATCH_CLASSES.md; BUGS.md S2–S4 #55; HR-12).
#
# `new Date('YYYY-MM-DD')` parses as UTC midnight: in IST an age read from it is off by hours, and
# at a bracket edge that changes a verdict (#55). Many existing sites are benign (UTC minus UTC
# differences, sort keys), so this is a RATCHET, not a ban: the count of `new Date(<x>date / Date /
# dateStr / key / Key>)` per split/*.js file may only stay level or fall against
# audit-hr12-dateonly-baseline.txt. A site that is genuinely fine carries `// HR-12` on its line
# and is not counted. When the count falls, the gate passes and prints the lower number; lower the
# baseline in the same PR (`bash audit-hr12-dateonly-v1.sh --update`). Self-tests run first (PC-5).
set -euo pipefail
cd "$(dirname "$0")"
node - "$@" <<'NODE'
const fs = require('fs');
const RX = /new Date\(\s*[\w$.]*(?:date|Date|dateStr|DateStr|key|Key)\s*\)/g;
const count = src => src.split('\n').reduce((n, l) => /\/\/\s*HR-12/.test(l) ? n : n + ((l.match(RX) || []).length), 0);
const T = [
  { src: 'const d = new Date(entry.date);', n: 1 },
  { src: 'const d = new Date(dateStr);', n: 1 },
  { src: 'const d = new Date(e.date); // HR-12: UTC minus UTC difference', n: 0 },
  { src: 'const d = new Date(y, m, 1);', n: 0 },
  { src: 'const d = new Date(dayKey) - new Date(b.date);', n: 2 },
];
let fails = 0;
T.forEach((t, i) => { const n = count(t.src); if (n !== t.n) { fails++; console.error(`audit-hr12-dateonly: SELF-TEST FAIL fixture ${i}: ${n} (want ${t.n})`); } });
if (fails) { console.error('audit-hr12-dateonly: FAIL (scanner self-test)'); process.exit(2); }
const now = {};
fs.readdirSync('.').filter(f => /\.js$/.test(f)).sort().forEach(f => { const n = count(fs.readFileSync(f, 'utf8')); if (n) now[f] = n; });
const BASE = 'audit-hr12-dateonly-baseline.txt';
if (process.argv.includes('--update') || !fs.existsSync(BASE)) {
  fs.writeFileSync(BASE, '# file count — HR-12 date-only ratchet baseline (audit-hr12-dateonly-v1.sh). Only ever lower these.\n' + Object.entries(now).map(([f, n]) => f + ' ' + n).join('\n') + '\n');
  console.error('audit-hr12-dateonly: baseline written (' + Object.values(now).reduce((a, b) => a + b, 0) + ' sites)'); process.exit(0);
}
const base = {};
fs.readFileSync(BASE, 'utf8').split('\n').filter(l => l && !l.startsWith('#')).forEach(l => { const [f, n] = l.trim().split(/\s+/); base[f] = +n; });
let bad = 0, lower = [];
Object.entries(now).forEach(([f, n]) => { const b = base[f] || 0; if (n > b) { bad++; console.error(`audit-hr12-dateonly: ${f} has ${n} date-only new Date() parses (baseline ${b}); use _parseLocalDate, or mark a benign one '// HR-12: <reason>'`); } else if (n < b) lower.push(f + ' ' + b + '→' + n); });
Object.keys(base).forEach(f => { if (!now[f]) lower.push(f + ' ' + base[f] + '→0'); });
if (bad) { console.error('audit-hr12-dateonly: FAIL (ratchet; see above)'); process.exit(1); }
console.error('audit-hr12-dateonly: PASS (self-test ok; no file above its baseline)' + (lower.length ? '; lower the baseline: ' + lower.join(', ') : ''));
NODE
