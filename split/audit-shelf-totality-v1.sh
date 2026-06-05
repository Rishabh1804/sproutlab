#!/usr/bin/env bash
# audit-shelf-totality-v1.sh — polarity-shelf totality ship-gate (14th gate, food-effects-v2 S0)
#
# The Diet→Library shelves every FOOD_EFFECTS record onto one of four polarity
# shelves via _effPolarity (core.js): encourage / conditional / warn / inform.
# _effPolarity returns 'inform' BOTH for a real substitute-caveat record AND as
# the conservative DEFAULT for an absent/unknown foodClass — so a record with a
# typo'd or new-but-unmapped foodClass silently lands on the "Good to know" shelf
# instead of its true (maybe warn) shelf. This gate proves every record resolves
# through a RECOGNISED class, never the default fall-through.
#
# Drift class — fails the build:
#   UNSHELVED RECORD — a FOOD_EFFECTS record whose foodClass is absent, or carries
#   a class not in the recognised set _effPolarity maps. It would resolve to the
#   default 'inform' shelf without anyone choosing that shelf.
#
# ENGINE (Node, not grep): extracts the LIVE _effPolarity (+ its _effHasClass
# dependency) from core.js and evals FOOD_EFFECTS, so the recognised-class set is
# tied to the real resolver, not a hard-coded list that rots. A SELF-TEST asserts
# each recognised class maps to its expected polarity AND that an absent/unknown
# foodClass falls to 'inform' (proving the default exists and the ⊆-known check is
# the right guard). GREEN-BUT-EMPTY guard (exit 2) asserts non-empty extraction.
#
# Usage:  bash split/audit-shelf-totality-v1.sh   (0 = pass, 1 = drift, 2 = engine)
set -e
cd "$(dirname "$0")/.."

node - << 'NODEEOF'
'use strict';
const fs = require('fs');
const DATA = 'split/data.js';
const CORE = 'split/core.js';

function extractBalanced(src, fromIndex, open, close) {
  let i = src.indexOf(open, fromIndex);
  if (i < 0) return null;
  const start = i;
  let depth = 0, prevSig = '';
  const isOperandEnder = ch => /[\w$)\]}'"`]/.test(ch);
  for (; i < src.length; i++) {
    const c = src[i], n = src[i + 1];
    if (c === '/' && n === '/') { i += 2; while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && n === '*') { i += 2; while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++; i++; continue; }
    if (c === '"' || c === "'" || c === '`') {
      i++;
      while (i < src.length) { if (src[i] === '\\') { i += 2; continue; } if (src[i] === c) break; i++; }
      prevSig = c; continue;
    }
    if (c === '/' && !isOperandEnder(prevSig)) {
      i++; let inClass = false;
      while (i < src.length) {
        const r = src[i];
        if (r === '\\') { i += 2; continue; }
        if (r === '\n') break;
        if (r === '[') inClass = true; else if (r === ']') inClass = false; else if (r === '/' && !inClass) break;
        i++;
      }
      prevSig = '/'; continue;
    }
    if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) return src.slice(start, i + 1); }
    if (!/\s/.test(c)) prevSig = c;
  }
  return null;
}
function evalLiteral(text) { return eval('(' + text + ')'); } // eslint-disable-line no-eval
function fail2(msg) { console.log(msg); process.exit(2); }

// ── extract the LIVE _effPolarity (+ _effHasClass dependency) from core.js ──
let _effPolarity;
try {
  const coreSrc = fs.readFileSync(CORE, 'utf8');
  const extractFn = (name) => {
    const s = coreSrc.indexOf('function ' + name);
    if (s < 0) throw new Error('function ' + name + ' not found in ' + CORE);
    const b = extractBalanced(coreSrc, s, '{', '}');
    const h = coreSrc.indexOf('{', s);
    if (!b || h < 0) throw new Error('could not brace-match ' + name + ' body');
    return coreSrc.slice(s, h) + b;
  };
  const dep = extractFn('_effHasClass');
  const main = extractFn('_effPolarity');
  // eslint-disable-next-line no-eval
  _effPolarity = eval('(function(){ ' + dep + '\nreturn (' + main + '); })()');
} catch (e) {
  fail2('audit-shelf-totality-v1: SELF-TEST FAIL — could not extract _effPolarity/_effHasClass from ' +
        CORE + ' (' + e.message + '). Cannot verify shelving without the live resolver.');
}

// ── extract FOOD_EFFECTS ──
let FOOD_EFFECTS;
try {
  const dataSrc = fs.readFileSync(DATA, 'utf8');
  const lit = extractBalanced(dataSrc, dataSrc.indexOf('const FOOD_EFFECTS'), '{', '}');
  if (!lit) throw new Error('could not extract FOOD_EFFECTS literal');
  FOOD_EFFECTS = evalLiteral(lit);
} catch (e) {
  fail2('audit-shelf-totality-v1: SELF-TEST FAIL — could not extract FOOD_EFFECTS from ' + DATA + ' (' + e.message + ').');
}

// ── recognised classes → expected polarity (mirrors _effPolarity precedence) ──
const KNOWN = {
  'acute-toxin':              'warn',
  'allergen-introduce-early': 'encourage',
  'drink-timing':             'conditional',
  'choking-by-form':          'conditional',
  'substitute-caveat':        'inform'
};

// ── self-test: the live resolver agrees with KNOWN, and unknown/absent → default 'inform' ──
Object.keys(KNOWN).forEach(cls => {
  const got = _effPolarity({ foodClass: cls });
  if (got !== KNOWN[cls])
    fail2('audit-shelf-totality-v1: SELF-TEST FAIL — _effPolarity({foodClass:\'' + cls + '\'}) = \'' + got +
          '\', expected \'' + KNOWN[cls] + '\'. The recognised-class map drifted from the resolver.');
});
if (_effPolarity({}) !== 'inform')
  fail2('audit-shelf-totality-v1: SELF-TEST FAIL — _effPolarity({}) did not fall to the \'inform\' default.');
if (_effPolarity({ foodClass: '__nonexistent_class__' }) !== 'inform')
  fail2('audit-shelf-totality-v1: SELF-TEST FAIL — an unknown foodClass did not fall to the \'inform\' default (the guard premise is wrong).');

const keys = Object.keys(FOOD_EFFECTS);
if (keys.length === 0) fail2('audit-shelf-totality-v1: SELF-TEST FAIL — FOOD_EFFECTS extracted empty (would pass vacuously).');

// ── the check: every record's foodClass is present AND ⊆ KNOWN (never the default fall-through) ──
const classesOf = e => [].concat(e && (e.foodClass !== undefined ? e.foodClass : [])).filter(Boolean);
const unshelved = [];
keys.forEach(k => {
  const cls = classesOf(FOOD_EFFECTS[k]);
  if (!cls.length) { unshelved.push(k + ': no foodClass → defaults to \'inform\''); return; }
  const unknown = cls.filter(c => !(c in KNOWN));
  if (unknown.length) unshelved.push(k + ': unrecognised foodClass [' + unknown.join(', ') + '] → defaults to \'inform\'');
});

if (unshelved.length === 0) {
  console.log('audit-shelf-totality-v1: PASS (' + keys.length + ' FOOD_EFFECTS records, all resolve to a chosen polarity shelf; ' +
    'self-test ' + Object.keys(KNOWN).length + '/' + Object.keys(KNOWN).length + ' classes + 2/2 default-guards vs live _effPolarity)');
  process.exit(0);
}
console.log('audit-shelf-totality-v1: FAIL (' + unshelved.length + ' record(s) would land on the default shelf unchosen)');
unshelved.forEach(m => console.log('      data.js FOOD_EFFECTS[\'' + m.split(':')[0] + '\']' + m.slice(m.indexOf(':'))));
console.log('');
console.log('Resolution: give each record an explicit foodClass that _effPolarity maps');
console.log('  (acute-toxin / allergen-introduce-early / drink-timing / choking-by-form / substitute-caveat),');
console.log('  or extend _effPolarity (core.js) + this gate\'s KNOWN map together if a new class is intended.');
process.exit(1);
NODEEOF
