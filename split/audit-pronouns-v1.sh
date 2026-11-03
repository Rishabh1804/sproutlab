#!/usr/bin/env bash
# audit-pronouns-v1.sh — child-sex S2 ship-gate (docs/specs/child-sex-v1.md §3).
#
# The app's copy follows the child's sex: render-time strings go through pron() and load-time
# tables are worded without a pronoun. This gate blocks a bare she / her / hers / herself in
# any string literal in split/*.js or any text in template.html, so a boy's family never reads
# "she" again.
#
# Comments, regex literals and object keys are not copy and are skipped. Strings that ARE meant
# to say she/her are listed in split/audit-pronouns-allow.txt (one "file|fragment" per line):
#   - Q&A match vocabulary (intent triggers, word lists, strippers) — canonical she/her, which
#     _qaNameAsShe folds a boy's he/him/his onto (V-K-281-1, V-K-281-2);
#   - activity keyword tables (match vocabulary for parents' notes, both forms listed);
#   - milestone text: fields, which are record keys (id = slugify(text); BUGS.md S2–S4 #5) and
#     frozen. Each such row MUST carry a pronoun-free `label:` on the same line (the display
#     title, shown via core.js msLabel()); an allowlisted string inside MILESTONE_STANDARDS whose
#     row has no label, or whose label has a pronoun, fails the gate;
#   - the _PRON table itself.
# A fragment starting with '=' must equal the whole string (for one-word list entries).
# An allowlist fragment that no longer matches anything fails the gate too, so the list can't rot.
# template.html: visible text AND copy attributes (placeholder, aria-label, title, alt) are scanned
# (BUGS #51). The gate self-tests against adversarial fixtures before it scans split/, so a scanner
# regression fails the build instead of passing everything silently (BUGS #54).
set -euo pipefail
cd "$(dirname "$0")"
node - <<'NODE'
const fs = require('fs');
const RX = /\b(she|her|hers|herself)\b/i;

// Pull string literals (with line numbers) out of JS, skipping comments and regex literals.
// Template literals are walked with their ${...} expressions, nested templates included.
function jsStrings(src) {
  const out = []; let i = 0, line = 1, prev = '';
  const regexOk = () => /[(,=:\[!&|?{};+\-*%<>~^]$|^$|\breturn$|\btypeof$/.test(prev.trimEnd());
  function code(stopAtBrace) {
    let depth = 0;
    while (i < src.length) {
      const c = src[i], n = src[i + 1];
      if (c === '\n') { line++; i++; prev += c; continue; }
      if (c === '/' && n === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
      if (c === '/' && n === '*') { i += 2; while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') line++; i++; } i += 2; continue; }
      if (c === '/' && regexOk()) {
        i++; let cls = false;
        while (i < src.length) { const d = src[i]; if (d === '\\') { i += 2; continue; } if (d === '[') cls = true; else if (d === ']') cls = false; else if (d === '/' && !cls) break; else if (d === '\n') break; i++; }
        i++; while (/[a-z]/i.test(src[i] || '')) i++; prev = 'x'; continue;
      }
      if (c === '"' || c === "'") {
        const q = c, start = line; let s = ''; i++;
        while (i < src.length && src[i] !== q && src[i] !== '\n') { if (src[i] === '\\') { s += src[i] + (src[i + 1] || ''); i += 2; continue; } s += src[i]; i++; }
        i++; out.push({ line: start, s }); prev = 'x'; continue;
      }
      if (c === '`') {
        const start = line; let s = ''; i++;
        while (i < src.length && src[i] !== '`') {
          if (src[i] === '\\') { s += src[i] + (src[i + 1] || ''); i += 2; continue; }
          if (src[i] === '$' && src[i + 1] === '{') { i += 2; s += ' '; prev = '('; code(true); continue; }
          if (src[i] === '\n') line++;
          s += src[i]; i++;
        }
        i++; out.push({ line: start, s }); prev = 'x'; continue;
      }
      if (c === '{') depth++;
      if (c === '}') { if (stopAtBrace && depth === 0) { i++; return; } depth--; }
      prev += c; if (prev.length > 40) prev = prev.slice(-40); i++;
    }
  }
  code(false);
  return out;
}
function htmlTexts(src) {
  const out = []; const noComments = src.replace(/<!--[\s\S]*?-->/g, m => m.replace(/[^\n]/g, ' '));
  const noScript = noComments.replace(/<(script|style)[\s\S]*?<\/\1>/gi, m => m.replace(/[^\n]/g, ' '));
  noScript.split('\n').forEach((l, k) => {
    const t = l.replace(/<[^>]*>/g, ' '); if (RX.test(t)) out.push({ line: k + 1, s: t.trim() });
  });
  // Copy that lives in attributes is read by parents (placeholders) and screen readers (BUGS #51).
  // Scanned over the whole file, so a value that spans lines is caught too (V-CA-282b-6).
  const attr = /\b(placeholder|aria-label|title|alt)\s*=\s*(["'])([\s\S]*?)\2/gi; let m;
  while ((m = attr.exec(noScript))) if (RX.test(m[3])) out.push({ line: noScript.slice(0, m.index).split('\n').length, s: m[3].replace(/\s+/g, ' ').trim() });
  return out;
}
// MILESTONE_STANDARDS line range in data.js: an allowlisted pronoun string there is a frozen
// record-key `text:` and is exempt only while its row carries a pronoun-free display `label:`.
function msBlockRange(src) {
  const lines = src.split('\n'); let start = -1;
  for (let k = 0; k < lines.length; k++) {
    if (start < 0 && /^const MILESTONE_STANDARDS = \{/.test(lines[k])) start = k + 1;
    else if (start > 0 && /^\};/.test(lines[k])) return { start, end: k + 1, lines };
  }
  return null;
}
function audit(dir, allowLines, log) {
  const files = fs.readdirSync(dir).filter(f => /\.js$/.test(f) && !/\.test\.js$/.test(f)).concat(fs.existsSync(dir + '/template.html') ? ['template.html'] : []);
  const allow = allowLines.map(l => l.trim()).filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('|'); return { file: l.slice(0, i), frag: l.slice(i + 1), used: false }; });
  let bad = 0;
  for (const f of files) {
    const src = fs.readFileSync(dir + '/' + f, 'utf8');
    const msr = f === 'data.js' ? msBlockRange(src) : null;
    // Without the anchor the milestone label rule would silently switch off (Cipher N3).
    if (f === 'data.js' && !msr) { bad++; log('audit-pronouns: data.js has no "const MILESTONE_STANDARDS = {" block; the milestone label rule cannot run'); }
    const hits = (f.endsWith('.html') ? htmlTexts(src) : jsStrings(src)).filter(h => RX.test(h.s));
    for (const h of hits) {
      const a = allow.find(a => a.file === f && (a.frag.startsWith('=') ? h.s === a.frag.slice(1) : h.s.includes(a.frag)));
      if (a && msr && h.line >= msr.start && h.line <= msr.end) {
        a.used = true;
        const ln = msr.lines[h.line - 1] || '';
        const isText = ln.includes("text:'" + h.s + "'") || ln.includes('text:"' + h.s + '"');
        const lm = ln.match(/\blabel:\s*(['"])((?:\\.|(?!\1).)*)\1/);
        if (!isText || !lm || !lm[2].trim() || RX.test(lm[2])) {
          bad++; log(`audit-pronouns: ${f}:${h.line} milestone text "${h.s.slice(0, 80)}" is a frozen record key and needs a pronoun-free label: on its row (display title via msLabel)`);
        }
        continue;
      }
      if (a) { a.used = true; continue; }
      bad++; log(`audit-pronouns: ${f}:${h.line} bare pronoun in copy: ${h.s.slice(0, 120)}`);
    }
  }
  const stale = allow.filter(a => !a.used);
  stale.forEach(a => log(`audit-pronouns: stale allowlist entry (matches nothing): ${a.file}|${a.frag}`));
  return { bad, stale: stale.length, files: files.length, allow: allow.length };
}

// ── Self-test (BUGS #54): adversarial fixtures, each with the result the scanner must give. ──
(function selfTest() {
  const os = require('os'), path = require('path');
  const T = [
    { name: 'plain string', files: { 'a.js': "var s = 'give her a nap';" }, bad: 1 },
    { name: 'comment is not copy', files: { 'a.js': "// she naps\n/* her nap */ var s = 'nap';" }, bad: 0 },
    { name: 'nested template literal', files: { 'a.js': "var s = `a ${x ? `b ${y}` : 'c'} then her nap`;" }, bad: 1 },
    { name: 'quote inside a regex, then a string', files: { 'a.js': "if (/a'b\"c/.test(x)) { var s = 'she naps'; }" }, bad: 1 },
    { name: 'division is not a regex', files: { 'a.js': "var r = a / b; var s = 'her';" }, bad: 1 },
    { name: 'html text', files: { 'template.html': '<div>She naps</div>' }, bad: 1 },
    { name: 'html placeholder attribute (#51)', files: { 'template.html': '<input placeholder="What did she eat">' }, bad: 1 },
    { name: 'html aria-label attribute (#51)', files: { 'template.html': '<button aria-label="Log her nap"></button>' }, bad: 1 },
    { name: 'html title attribute', files: { 'template.html': '<span title="Her last feed">x</span>' }, bad: 1 },
    { name: 'html alt attribute', files: { 'template.html': '<img alt="her drawing" src="a.png">' }, bad: 1 },
    { name: 'single-quoted attribute', files: { 'template.html': "<input placeholder='What did she eat'>" }, bad: 1 },
    { name: 'attribute value across lines', files: { 'template.html': '<input placeholder="What did\n she eat">' }, bad: 2 },   // the continuation line also reads as text: fails closed
    { name: 'uppercase pronoun', files: { 'a.js': "var s = 'HER NAP';" }, bad: 1 },
    { name: '.test.js files are not scanned', files: { 'a.test.js': "var s = 'her';" }, bad: 0 },
    { name: 'html comment is not copy', files: { 'template.html': '<!-- her --><div>Nap</div>' }, bad: 0 },
    { name: 'exact allow entry', files: { 'a.js': "var w = ['she'];" }, allow: ['a.js|=she'], bad: 0 },
    { name: 'exact allow entry does not cover a longer string', files: { 'a.js': "var w = ['can she eat this? she can'];" }, allow: ['a.js|=can she eat'], bad: 1, stale: 1 },
    { name: 'stale allow entry', files: { 'a.js': "var s = 'nap';" }, allow: ['a.js|=her'], bad: 0, stale: 1 },
    { name: 'milestone text with a neutral label', files: { 'data.js': "const MILESTONE_STANDARDS = {\n  x: [ { text:'Feeds herself', label:'Self-feeds' } ]\n};" }, allow: ['data.js|=Feeds herself'], bad: 0 },
    { name: 'milestone text without a label', files: { 'data.js': "const MILESTONE_STANDARDS = {\n  x: [ { text:'Feeds herself' } ]\n};" }, allow: ['data.js|=Feeds herself'], bad: 1 },
    { name: 'milestone label with a pronoun', files: { 'data.js': "const MILESTONE_STANDARDS = {\n  x: [ { text:'Feeds herself', label:'Feeds her food' } ]\n};" }, allow: ['data.js|=Feeds herself'], bad: 2 },   // the label is bare copy too
    { name: 'missing milestone anchor (N3)', files: { 'data.js': "const OTHER = {};" }, bad: 1 },
  ];
  let fails = 0;
  for (const t of T) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-pron-'));
    for (const [n, c] of Object.entries(t.files)) fs.writeFileSync(path.join(dir, n), c);
    const r = audit(dir, t.allow || [], () => {});
    fs.rmSync(dir, { recursive: true, force: true });
    if (r.bad !== t.bad || r.stale !== (t.stale || 0)) { fails++; console.error(`audit-pronouns: SELF-TEST FAIL "${t.name}": bad ${r.bad} (want ${t.bad}), stale ${r.stale} (want ${t.stale || 0})`); }
  }
  if (fails) { console.error(`audit-pronouns: FAIL (scanner self-test, ${fails} of ${T.length} fixtures)`); process.exit(2); }
})();

const r = audit('.', fs.readFileSync('audit-pronouns-allow.txt', 'utf8').split('\n'), m => console.error(m));
if (r.bad || r.stale) { console.error(`audit-pronouns: FAIL (${r.bad} bare pronoun(s), ${r.stale} stale allow entr${r.stale === 1 ? 'y' : 'ies'}) — use pron() at render time or neutral wording in load-time tables (child-sex-v1 §3)`); process.exit(1); }
console.error(`audit-pronouns: PASS (self-test ok; 0 bare she/her in copy across ${r.files} files; ${r.allow} allowlisted match/key strings)`);
NODE
