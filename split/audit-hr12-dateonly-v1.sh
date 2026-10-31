#!/usr/bin/env bash
# audit-hr12-dateonly-v1.sh — PC-1 ratchet (docs/PATCH_CLASSES.md; BUGS.md S2–S4 #55; HR-12).
#
# `new Date('YYYY-MM-DD')` parses as UTC midnight: in IST an age read from it is off by hours, and
# at a bracket edge that changes a verdict (#55). Many existing sites are benign (UTC minus UTC
# differences, sort keys), so this is a RATCHET, not a ban: the count of `new Date(<x>date / Date /
# key / Key / *Str>)` and `new Date(today())` per split/*.js file may only stay level or fall against
# audit-hr12-dateonly-baseline.txt. A site that is genuinely fine carries `// HR-12` on its line
# and is not counted. When the count falls, the gate passes and prints the lower number; lower the
# baseline in the same PR (`bash audit-hr12-dateonly-v1.sh --update`; it refuses to raise a count
# unless --allow-raise is given, and a missing baseline fails). Self-tests run first (PC-5).
set -euo pipefail
cd "$(dirname "$0")"
node - "$@" <<'NODE'
const fs = require('fs');
const RX = /new Date\(\s*(?:[\w$.]*(?:date|Date|key|Key|Str)|today\(\s*\))\s*\)/g;
const count = src => src.split('\n').reduce((n, l) => /\/\/\s*HR-12/.test(l) ? n : n + ((l.match(RX) || []).length), 0);
const T = [
  { src: 'const d = new Date(entry.date);', n: 1 },
  { src: 'const d = new Date(dateStr);', n: 1 },
  { src: 'const d = new Date(e.date); // HR-12: UTC minus UTC difference', n: 0 },
  { src: 'const d = new Date(y, m, 1);', n: 0 },
  { src: 'const d = new Date(dayKey) - new Date(b.date);', n: 2 },
  { src: 'const d = new Date(todayStr); d.setDate(d.getDate() - 1);', n: 1 },
  { src: 'const d = new Date(today());', n: 1 },
  { src: 'const d = new Date(ts); const e = new Date();', n: 0 },
];
let fails = 0;
T.forEach((t, i) => { const n = count(t.src); if (n !== t.n) { fails++; console.error(`audit-hr12-dateonly: SELF-TEST FAIL fixture ${i}: ${n} (want ${t.n})`); } });
if (fails) { console.error('audit-hr12-dateonly: FAIL (scanner self-test)'); process.exit(2); }
const now = {};
fs.readdirSync('.').filter(f => /\.js$/.test(f)).sort().forEach(f => { const n = count(fs.readFileSync(f, 'utf8')); if (n) now[f] = n; });
const BASE = 'audit-hr12-dateonly-baseline.txt';
const total = o => Object.values(o).reduce((a, b) => a + b, 0);
const readBase = () => { const b = {}; fs.readFileSync(BASE, 'utf8').split('\n').filter(l => l && !l.startsWith('#')).forEach(l => { const [f, n] = l.trim().split(/\s+/); b[f] = +n; }); return b; };
if (process.argv.includes('--update')) {
  // Writing the baseline may only lower counts unless --allow-raise is given (V-CA-282c-2).
  if (fs.existsSync(BASE) && !process.argv.includes('--allow-raise')) {
    const old = readBase(); const up = Object.entries(now).filter(([f, n]) => n > (old[f] || 0));
    if (up.length) { console.error('audit-hr12-dateonly: --update refused; these would rise: ' + up.map(([f, n]) => f + ' ' + (old[f] || 0) + '→' + n).join(', ') + ' (fix them, mark benign ones // HR-12, or pass --allow-raise when widening the scanner)'); process.exit(1); }
  }
  fs.writeFileSync(BASE, '# file count — HR-12 date-only ratchet baseline (audit-hr12-dateonly-v1.sh). Only ever lower these.\n' + Object.entries(now).map(([f, n]) => f + ' ' + n).join('\n') + '\n');
  console.error('audit-hr12-dateonly: baseline written (' + total(now) + ' sites)'); process.exit(0);
}
if (!fs.existsSync(BASE)) { console.error('audit-hr12-dateonly: FAIL (' + BASE + ' missing; a ratchet with no baseline cannot pass. Restore it from git, or run --update)'); process.exit(1); }
const base = readBase();
let bad = 0, lower = [];
Object.entries(now).forEach(([f, n]) => { const b = base[f] || 0; if (n > b) { bad++; console.error(`audit-hr12-dateonly: ${f} has ${n} date-only new Date() parses (baseline ${b}); use _parseLocalDate, or mark a benign one '// HR-12: <reason>'`); } else if (n < b) lower.push(f + ' ' + b + '→' + n); });
Object.keys(base).forEach(f => { if (!now[f]) lower.push(f + ' ' + base[f] + '→0'); });
if (bad) { console.error('audit-hr12-dateonly: FAIL (ratchet; see above)'); process.exit(1); }
console.error('audit-hr12-dateonly: PASS (self-test ok; no file above its baseline)' + (lower.length ? '; lower the baseline: ' + lower.join(', ') : ''));
NODE
