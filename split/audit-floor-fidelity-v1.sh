#!/usr/bin/env bash
# audit-floor-fidelity-v1.sh — never-cross safety-floor ship-gate (13th gate, food-effects-v2 S0)
#
# The emergency floors must never cross: choking first-aid is MECHANICAL airway
# rescue (back blows / chest thrusts, explicitly NO adrenaline); an allergic
# reaction is ANAPHYLAXIS (a prescribed adrenaline auto-injector, NOT back
# blows). A floor that carried the wrong first-aid would tell a parent to do the
# opposite of the life-saving action. _libBuildGuide (diet.js) renders one floor
# per hazard scoped by header, but the FLOOR COPY itself lives in the seekCare
# field of each FOOD_EFFECTS record — so this gate locks that copy.
#
# Three drift classes — any one fails the build:
#   A. CHOKING FLOOR LOST ITS MECHANICAL AID — FOOD_EFFECTS['choking hazards']
#      seekCare must name back blows AND chest thrusts, and must NOT carry the
#      adrenaline-auto-injector instruction (the "NO adrenaline" phrasing is fine
#      — we ban the affirmative anaphylaxis treatment, not the word).
#   B. ANAPHYLAXIS FLOOR LOST ITS ADRENALINE — every allergen-introduce-early
#      record's seekCare must name a (adrenaline) auto-injector and must NOT carry
#      mechanical-choking aid (back blows / chest thrusts / abdominal thrusts /
#      Heimlich).
#   C. CROSSED FLOOR (any record) — no single seekCare may carry BOTH mechanical
#      aid AND the adrenaline auto-injector. That is a floor that crossed.
#
# ENGINE (Node, not grep): brace-extracts + evals FOOD_EFFECTS so the checks read
# the real per-record seekCare / foodClass, not a line-grep that can't tell which
# record a string belongs to. GREEN-BUT-EMPTY guard (exit 2) asserts the set
# extracted non-empty and the choking + allergen records are present before any
# check runs, so the gate can't pass vacuously.
#
# Usage:  bash split/audit-floor-fidelity-v1.sh   (0 = pass, 1 = drift, 2 = engine)
set -e
cd "$(dirname "$0")/.."

node - << 'NODEEOF'
'use strict';
const fs = require('fs');
const DATA = 'split/data.js';

// balanced-literal extractor (string/comment/regex-aware) — verbatim from
// audit-food-effects-sync-v1.sh so the matcher can't be fooled by a stray brace.
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

// ── extract FOOD_EFFECTS ──
let FOOD_EFFECTS;
try {
  const dataSrc = fs.readFileSync(DATA, 'utf8');
  const lit = extractBalanced(dataSrc, dataSrc.indexOf('const FOOD_EFFECTS'), '{', '}');
  if (!lit) throw new Error('could not extract FOOD_EFFECTS literal');
  FOOD_EFFECTS = evalLiteral(lit);
} catch (e) {
  fail2('audit-floor-fidelity-v1: SELF-TEST FAIL — could not extract FOOD_EFFECTS from ' + DATA + ' (' + e.message + ').');
}

// ── floor-language matchers ──
const MECHANICAL = /back\s*blow|chest\s*thrust|abdominal\s*thrust|heimlich/i;     // choking airway rescue
const ADRENALINE = /adrenaline\s*auto-?injector|epi-?pen|epinephrine/i;           // anaphylaxis treatment (NOT bare "adrenaline" — "NO adrenaline" is legit)
const classesOf  = e => [].concat(e && (e.foodClass !== undefined ? e.foodClass : [])).filter(Boolean);
const keys = Object.keys(FOOD_EFFECTS);

// ── green-but-empty guard ──
if (keys.length === 0) fail2('audit-floor-fidelity-v1: SELF-TEST FAIL — FOOD_EFFECTS extracted empty (would pass vacuously).');
const choke = FOOD_EFFECTS['choking hazards'];
if (!choke || !choke.seekCare) fail2('audit-floor-fidelity-v1: SELF-TEST FAIL — no FOOD_EFFECTS[\'choking hazards\'] with seekCare (would pass vacuously).');
const allergens = keys.filter(k => classesOf(FOOD_EFFECTS[k]).indexOf('allergen-introduce-early') !== -1 && FOOD_EFFECTS[k].seekCare);
if (allergens.length < 3) fail2('audit-floor-fidelity-v1: SELF-TEST FAIL — fewer than 3 allergen-introduce-early records with seekCare (' + allergens.length + '); extraction likely broken.');

const A = [], B = [], C = [];

// ── A. choking floor keeps its mechanical aid, sheds the adrenaline injector ──
if (!MECHANICAL.test(choke.seekCare)) A.push('choking seekCare names no back-blows / chest-thrusts (mechanical aid missing)');
if (ADRENALINE.test(choke.seekCare))  A.push('choking seekCare carries the adrenaline auto-injector instruction (anaphylaxis aid on a choking floor)');

// ── B. every anaphylaxis floor keeps its adrenaline, sheds mechanical aid ──
allergens.forEach(k => {
  const sc = FOOD_EFFECTS[k].seekCare;
  if (!ADRENALINE.test(sc)) B.push(k + ': allergen seekCare names no adrenaline auto-injector');
  if (MECHANICAL.test(sc))  B.push(k + ': allergen seekCare carries mechanical-choking aid (back-blows/Heimlich on an anaphylaxis floor)');
});

// ── C. no floor carries both (a crossed floor), across every record ──
keys.forEach(k => {
  const sc = FOOD_EFFECTS[k].seekCare;
  if (sc && MECHANICAL.test(sc) && ADRENALINE.test(sc)) C.push(k + ': seekCare carries BOTH mechanical aid AND adrenaline injector (crossed floor)');
});

const total = A.length + B.length + C.length;
if (total === 0) {
  console.log('audit-floor-fidelity-v1: PASS (choking floor mechanical-only; ' + allergens.length +
    ' anaphylaxis floors adrenaline-only; ' + keys.length + ' records, 0 crossed)');
  process.exit(0);
}
console.log('audit-floor-fidelity-v1: FAIL (' + total + ' floor-fidelity violation(s) — a parent could be told the wrong first-aid)');
if (A.length) { console.log('  [A] CHOKING FLOOR:'); A.forEach(m => console.log('      ' + m)); }
if (B.length) { console.log('  [B] ANAPHYLAXIS FLOOR:'); B.forEach(m => console.log('      ' + m)); }
if (C.length) { console.log('  [C] CROSSED FLOOR:'); C.forEach(m => console.log('      ' + m)); }
console.log('');
console.log('Resolution: edit the offending FOOD_EFFECTS[...].seekCare in data.js so the first-aid');
console.log('  matches the hazard — choking = back blows / chest thrusts (NO adrenaline);');
console.log('  allergic reaction = prescribed adrenaline auto-injector (NOT back blows / Heimlich).');
process.exit(1);
NODEEOF
