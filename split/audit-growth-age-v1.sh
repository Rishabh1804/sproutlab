#!/usr/bin/env bash
# audit-growth-age-v1.sh — PC-1 ship-gate (docs/PATCH_CLASSES.md; BUGS.md S2–S4 #25).
#
# A growth-velocity verdict is judged at the age of the measurement it was computed from, never
# today's age: two cards judging the same gain at different ages disagreed at a bracket edge
# (#25). This gate checks the age argument of every band / verdict helper —
#   growthVelocityBand(age), gvBandVerdict(gain, age), gvWeightVerdict(gain, age, latestAge) (removed
#   in round 5; kept watched so it can't return unguarded),
#   gvRateStatus(gPerWeek, age), _gvNewbornWindow(age)
# — and fails when it is today's age: ageAt( / getAgeInMonths( / today() / new Date() anywhere
# in the argument, a no-argument gvAgeAt() (which falls back to today), or any identifier in the
# argument whose assignment in the 40 lines above (joined across lines up to `;`) uses one of
# those, including a ternary fallback. Calls may span lines. A deliberate exception carries
# `// growth-age-ok: <reason>` on the call's first line. Self-tests run first (including the
# bypasses Kael and Carina found, V-K-282c-4 / V-CA-282c-1 / V-CA-282d-2), so a scanner
# regression fails the build (PC-5). Tracing follows destructuring, obj.prop assignments and up
# to three hops; string literals inside the arguments are skipped (names in a template literal's
# ${…} are read). Known structural limits, by design (V-CA-282e-2): a today helper hidden behind
# another function name, a parameter passed through from a caller, an assignment more than 40
# lines up, chains of four or more hops, Object.assign / spread into an object, and one exemption
# covering every call on its line. Review those by hand (PATCH_CLASSES PC-1).
set -euo pipefail
cd "$(dirname "$0")"
node - <<'NODE'
const fs = require('fs');
const WATCH = { growthVelocityBand: [0], gvBandVerdict: [1], gvWeightVerdict: [1, 2], gvRateStatus: [1], _gvNewbornWindow: [0] };
const TODAY = /\bageAt\s*(?:\?\.\s*)?(?:\.\s*(?:call|apply)\s*)?\(|\bageAt\w*\s*\(\s*(?:null|undefined|''|\"\"|0|false)?\s*\)|\bpreciseAge\s*\(|\bgetAgeInMonths\s*\(|\btoday\s*\(\s*\)|new\s+Date\s*\(\s*\)|new\s+Date\b(?!\s*\()|new\s+(?:globalThis|window|self)\s*\.\s*Date\b|(?<![\w.$])Date\s*\(\s*\)|\bDate\.now\s*\(|\b_offsetDateStr\s*\(\s*0?\s*\)|\bgvAgeAt\s*\(\s*(?:null|undefined|''|""|0|false|void\s+0|NaN|\{\s*\})?\s*\)|\[\s*['"]ageAt\w*['"]\s*\]\s*\(|\bgvBandAge\s*\(\s*(?:null|undefined)?\s*[,)]/;
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
// The ${…} interpolations of a template literal, with nested braces balanced (V-CA-282f-1).
function interps(t) {
  const out = [];
  for (let i = 0; i < t.length; i++) {
    if (t[i] === '$' && t[i + 1] === '{') {
      let depth = 0, j = i + 1;
      for (; j < t.length; j++) { if (t[j] === '{') depth++; else if (t[j] === '}' && --depth === 0) break; }
      out.push(t.slice(i + 2, j)); i = j;
    }
  }
  return out;
}
// Names an expression reads: identifier heads and member paths (a.b, a.b.c), never callees.
function namesIn(expr) {
  const out = new Set();
  // Names inside a template literal's ${…} are read; the literal text is not (V-CA-282e-2).
  const noStr = expr.replace(/`(?:\\.|[^`])*`/g, t => ' ' + interps(t).join(' ') + ' ')
    .replace(/(['"])(?:\\.|(?!\1).)*\1/g, '""');
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
function rhsOf(lines, name, ln, upto) {
  const n = esc(name);
  const plain = new RegExp('(?:\\b(?:const|let|var)\\s+|^\\s*|(?:[;,{(:?)]|\\belse\\b)\\s*)' + n + '\\s*(?:\\?\\?|\\|\\||&&|\\*\\*|<<|>>>?|[-+*/%|&^])?=(?![=>])\\s*(.*)');   // = and every compound assignment (V-CA-282e-2, V-K-282e-5)
  const forOf = name.includes('.') ? null : new RegExp('\\bfor\\s*\\(\\s*(?:const|let|var)\\s+' + n + '\\s+(?:of|in)\\s+(.*)');   // V-CA-282f-1
  const arr = name.includes('.') ? null : new RegExp('(?:\\b(?:const|let|var)\\s*|(?:^|[;,{(])\\s*)\\[[^\\]]*\\b' + n + '\\b[^\\]]*\\]\\s*=\\s*(.*)');
  const destr = name.includes('.') ? null : new RegExp('(?:\\b(?:const|let|var)\\s*|\\(\\s*)\\{[^}]*?(?:\\b' + n + '\\s*(?=[,}=])|:\\s*' + n + '\\b)[^}]*\\}\\s*=\\s*(.*)');
  const out = [];
  // Every assignment in the window counts, not only the nearest (a clean reassignment can sit in
  // front of a today default: V-K-282d-3). The call's own line counts too, up to the call (V-K-282d-4).
  for (let j = ln; j >= Math.max(0, ln - 40); j--) {
    const text = (j === ln && upto != null) ? lines[j].slice(0, upto) : lines[j];
    const am = plain.exec(text) || (destr && destr.exec(text)) || (arr && arr.exec(text)) || (forOf && forOf.exec(text));
    if (!am) continue;
    let rhs = am[1];
    for (let k = j + 1; k < Math.min(lines.length, j + 30) && !/;\s*(\/\/.*)?$/.test(rhs); k++) rhs += ' ' + lines[k].trim();
    out.push({ rhs, line: j });
  }
  return out;
}
// Does `expr` (read at line index ln) carry today's age, directly or through up to 3 assignments?
function tainted(lines, expr, ln, depth, seen, upto) {
  if (TODAY.test(expr)) return expr;
  if (depth > 3) return null;
  for (const name of namesIn(expr)) {
    if (seen.has(name)) continue; seen.add(name);
    for (const a of rhsOf(lines, name, ln, upto)) {
      const hit = tainted(lines, a.rhs, a.line, depth + 1, seen, null);
      if (hit) return `${name} (line ${a.line + 1}: ${a.rhs.trim().slice(0, 60)})`;
    }
  }
  return null;
}
function scan(name, src, log) {
  let bad = 0;
  // Block comments become spaces (same length, newlines kept), so `ageAt /* x */ ()` is read as a call
  // and positions still line up (V-CA-282f-1).
  src = src.replace(/\/\*[\s\S]*?\*\//g, c => c.replace(/[^\n]/g, ' '));
  const lineOf = idx => src.slice(0, idx).split('\n').length;
  const lines = src.split('\n');
  // A watched call, also through ?.(), .call( / .apply( or a bracket lookup ['name']( (V-CA-282f-1).
  const names = Object.keys(WATCH).join('|');
  const re = new RegExp('(?:\\b(' + names + ')|\\[\\s*[\'"](' + names + ')[\'"]\\s*\\])\\s*(?:\\?\\.\\s*)?(?:\\.\\s*(call|apply)\\s*)?\\(', 'g'); let m;
  while ((m = re.exec(src))) {
    const before = src.slice(Math.max(0, m.index - 12), m.index);
    if (/function\s+$/.test(before)) continue;                       // the definition itself
    const fn = m[1] || m[2], via = m[3];
    const ln = lineOf(m.index);
    // An exemption is a // comment with a reason, not the words anywhere on the line (V-K-282e-5, V-CA-282f-1).
    if (/\/\/\s*growth-age-ok:\s*[^\s.,;:-]*[A-Za-z]{3}/.test(lines[ln - 1] || '')) continue;   // a reason with a word in it (V-K-282f-7)
    const a = args(src, m.index + m[0].length - 1);
    // .call(thisArg, …) shifts the arguments by one; .apply(thisArg, [ … ]) is checked as a whole.
    const idxs = via === 'apply' ? [1] : WATCH[fn].map(k => via === 'call' ? k + 1 : k);
    for (const k of idxs) {
      const arg = a[k]; if (!arg) continue;
      const col = m.index - (src.lastIndexOf('\n', m.index) + 1);   // the call's column on its line
      const hit = tainted(lines, arg, ln - 1, 0, new Set(), col);
      if (hit) { bad++; log(`audit-growth-age: ${name}:${ln} ${fn}(${arg.replace(/\s+/g, ' ').slice(0, 40)}) is today's age via ${hit.replace(/\s+/g, ' ').slice(0, 100)}`); }
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
  // Kael's round-3 bypasses (V-K-282d-3, -4):
  { src: 'let mo = ageAt().months;\nif (e) { mo = gvAgeAt(e); }\ngrowthVelocityBand(mo);', bad: 1 },
  { src: 'growthVelocityBand(gvAgeAt(null)); growthVelocityBand(gvAgeAt(undefined));', bad: 2 },
  { src: 'growthVelocityBand(gvBandAge()); gvBandVerdict(g, gvBandAge(null, p));', bad: 2 },
  { src: 'const mo = ageAt().months; growthVelocityBand(mo);', bad: 1 },
  { src: 'var mo = e ? gvAgeAt(e) : ageAt().months; var b = growthVelocityBand(mo);', bad: 1 },
  { src: 'function f(mo = ageAt().months) {\n  return growthVelocityBand(mo);\n}', bad: 1 },
  { src: 'const mo = gvAgeAt(e); growthVelocityBand(mo); const later = ageAt().months;', bad: 0 },
  { src: 'gvRateStatus(gw, ageAt().months);', bad: 1 },
  { src: 'gvRateStatus(gw, gvBandAge(v.a, v.b));', bad: 0 },
  // Carina's round-4 bypasses (V-CA-282e-2):
  { src: 'growthVelocityBand(ageAtScrapDate(null)); growthVelocityBand(ageAtScrapDate(undefined));', bad: 2 },
  { src: "growthVelocityBand(gvAgeAt('')); growthVelocityBand(gvAgeAt(0)); growthVelocityBand(gvAgeAt(false));", bad: 3 },
  { src: 'const d = new Date;\ngrowthVelocityBand(ageMonthsAt(d));', bad: 1 },
  { src: 'growthVelocityBand(ageMonthsAt(Date()));', bad: 1 },
  { src: 'growthVelocityBand(ageMonthsAt(_offsetDateStr(0))); growthVelocityBand(ageMonthsAt(_offsetDateStr()));', bad: 2 },
  { src: 'let mo;\nmo ??= ageAt().months;\ngrowthVelocityBand(mo);', bad: 1 },
  { src: 'let mo = x;\nmo ||= ageAt().months;\ngrowthVelocityBand(mo);', bad: 1 },
  { src: 'const [mo] = [ageAt().months];\ngrowthVelocityBand(mo);', bad: 1 },
  { src: 'const mo = ageAt().months;\ngrowthVelocityBand(Number(`${mo}`));', bad: 1 },
  { src: 'growthVelocityBand(ageMonthsAt(_offsetDateStr(-28)));', bad: 0 },
  { src: 'growthVelocityBand(gvAgeAt(latest.date));', bad: 0 },
  // Kael's round-4 bypasses (V-K-282e-5):
  { src: 'let mo = 0;\nmo += ageAt().months;\ngrowthVelocityBand(mo);', bad: 1 },
  { src: 'const b = growthVelocityBand(ageAt().months); // growth-age-ok:', bad: 1 },
  // Carina's round-5 bypasses (V-CA-282f-1):
  { src: 'growthVelocityBand(ageAt?.().months);', bad: 1 },
  { src: 'growthVelocityBand(ageAt.call(null).months);', bad: 1 },
  { src: 'growthVelocityBand.call(null, ageAt().months);', bad: 1 },
  { src: 'growthVelocityBand?.(ageAt().months);', bad: 1 },
  { src: "window['growthVelocityBand'](ageAt().months);", bad: 1 },
  { src: "growthVelocityBand(ageAt().months, 'growth-age-ok: x');", bad: 1 },
  { src: 'for (const mo of [ageAt().months]) { growthVelocityBand(mo); }', bad: 1 },
  { src: 'const mo = ageAt().months;\ngrowthVelocityBand(Number(`${f({a:1}) + mo}`));', bad: 1 },
  { src: 'growthVelocityBand(ageMonthsAt(new globalThis.Date()));', bad: 1 },
  { src: 'growthVelocityBand(ageAt /* now */ ().months);', bad: 1 },
  { src: 'growthVelocityBand.call(null, gvAgeAt(e));', bad: 0 },
  // Kael's round-5 bypasses (V-K-282f-7):
  { src: 'let mo = gvAgeAt(e);\nif (!e) mo = ageAt().months;\ngrowthVelocityBand(mo);', bad: 1 },
  { src: 'let mo = gvAgeAt(e);\nif (e) {} else mo = ageAt().months;\ngrowthVelocityBand(mo);', bad: 1 },
  { src: 'let mo;\nswitch (k) { case 1: mo = ageAt().months; }\ngrowthVelocityBand(mo);', bad: 1 },
  { src: 'let mo;\n[mo] = [ageAt().months];\ngrowthVelocityBand(mo);', bad: 1 },
  { src: 'let mo;\n({ months: mo } = ageAt());\ngrowthVelocityBand(mo);', bad: 1 },
  { src: 'growthVelocityBand(gvAgeAt(void 0)); growthVelocityBand(gvAgeAt(NaN)); growthVelocityBand(gvAgeAt({}));', bad: 3 },
  { src: "growthVelocityBand(window['ageAt']().months);", bad: 1 },
  { src: 'const b = growthVelocityBand(ageAt().months); // growth-age-ok: .', bad: 1 },
];
let fails = 0;
T.forEach((t, i) => { const n = scan('fixture' + i, t.src, () => {}); if (n !== t.bad) { fails++; console.error(`audit-growth-age: SELF-TEST FAIL fixture ${i}: ${n} (want ${t.bad})`); } });
if (fails) { console.error(`audit-growth-age: FAIL (scanner self-test, ${fails} of ${T.length})`); process.exit(2); }
let bad = 0;
fs.readdirSync('.').filter(f => /\.js$/.test(f)).forEach(f => { bad += scan(f, fs.readFileSync(f, 'utf8'), m => console.error(m)); });
if (bad) { console.error(`audit-growth-age: FAIL (${bad} growth verdict(s) judged at today's age; use gvAgeAt(entry) / the window's measurement age — PATCH_CLASSES PC-1)`); process.exit(1); }
console.error('audit-growth-age: PASS (self-test ok; every band/verdict helper takes a measurement age)');
NODE
