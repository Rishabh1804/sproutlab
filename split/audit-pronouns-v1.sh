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
set -euo pipefail
cd "$(dirname "$0")"
node - <<'NODE'
const fs = require('fs');
const files = fs.readdirSync('.').filter(f => /\.js$/.test(f) && !/\.test\.js$/.test(f)).concat(['template.html']);
const allow = fs.readFileSync('audit-pronouns-allow.txt', 'utf8').split('\n')
  .map(l => l.trim()).filter(l => l && !l.startsWith('#'))
  .map(l => { const i = l.indexOf('|'); return { file: l.slice(0, i), frag: l.slice(i + 1), used: false }; });
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
  noScript.split('\n').forEach((l, k) => { const t = l.replace(/<[^>]*>/g, ' '); if (RX.test(t)) out.push({ line: k + 1, s: t.trim() }); });
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
let bad = 0;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const msr = f === 'data.js' ? msBlockRange(src) : null;
  const hits = (f.endsWith('.html') ? htmlTexts(src) : jsStrings(src)).filter(h => RX.test(h.s));
  for (const h of hits) {
    const a = allow.find(a => a.file === f && (a.frag.startsWith('=') ? h.s === a.frag.slice(1) : h.s.includes(a.frag)));
    if (a && msr && h.line >= msr.start && h.line <= msr.end) {
      a.used = true;
      const ln = msr.lines[h.line - 1] || '';
      const isText = ln.includes("text:'" + h.s + "'") || ln.includes('text:"' + h.s + '"');
      const lm = ln.match(/\blabel:\s*(['"])((?:\\.|(?!\1).)*)\1/);
      if (!isText || !lm || !lm[2].trim() || RX.test(lm[2])) {
        bad++; console.error(`audit-pronouns: ${f}:${h.line} milestone text "${h.s.slice(0, 80)}" is a frozen record key and needs a pronoun-free label: on its row (display title via msLabel)`);
      }
      continue;
    }
    if (a) { a.used = true; continue; }
    bad++; console.error(`audit-pronouns: ${f}:${h.line} bare pronoun in copy: ${h.s.slice(0, 120)}`);
  }
}
const stale = allow.filter(a => !a.used);
stale.forEach(a => console.error(`audit-pronouns: stale allowlist entry (matches nothing): ${a.file}|${a.frag}`));
if (bad || stale.length) { console.error(`audit-pronouns: FAIL (${bad} bare pronoun(s), ${stale.length} stale allow entr${stale.length === 1 ? 'y' : 'ies'}) — use pron() at render time or neutral wording in load-time tables (child-sex-v1 §3)`); process.exit(1); }
console.error(`audit-pronouns: PASS (0 bare she/her in copy across ${files.length} files; ${allow.length} allowlisted match/key strings)`);
NODE
