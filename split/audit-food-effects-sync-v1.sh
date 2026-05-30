#!/usr/bin/env bash
# audit-food-effects-sync-v1.sh — P0.1 food-effects sync ship-gate (12th gate)
#
# Locks the three-layer food-safety spine so it can never silently drift:
#
#     docs/research/food-effects.manifest.js   (the cited source-of-truth spine)
#                  │
#                  ▼
#     split/data.js  FOOD_EFFECTS   (the in-app consequence card)
#                  │
#                  ▼
#     split/data.js  AGE_RULES      (the age-gate the card hangs off)
#
# Three drift classes — any one fails the build:
#
#   1. UNTRACEABLE CLAIM — a FOOD_EFFECTS key with no food-effects.manifest.js
#      entry. A parent-facing consequence card that traces to no cited brief is
#      a claim with no provenance. Every FOOD_EFFECTS key must resolve to a
#      manifest `food` (or one of its `aliases`).
#
#   2. SILENT GATE — a manifest entry marked `tier: 'critical'` with no
#      FOOD_EFFECTS record. A critical food the research spine knows about but
#      the app surfaces only as a passive "Not before N months" badge — the
#      acute-consequence card never fires. Every critical-tier manifest entry
#      must have a FOOD_EFFECTS record (matched by food or alias).
#
#   3. ORPHAN CARD — a FOOD_EFFECTS key that doesn't resolve through the
#      word-boundary resolver against AGE_RULES. The consequence card and the
#      age gate must agree; a card with no gate behind it can surface with no
#      "Not before N months" context. Every FOOD_EFFECTS key must resolve via
#      _lookupByFoodName(AGE_RULES, key).
#
# ENGINE (Node, not grep/python): the three checks cross-reference *evaluated*
# keys across three structured JS literals and must replicate the live resolver
# *exactly*. So this gate extracts the real _lookupByFoodName source from
# core.js and evals it (it cannot drift from the runtime resolver), and
# brace-extracts + evals FOOD_EFFECTS / AGE_RULES / FOOD_EFFECTS_MANIFEST. A
# grep gate would either miss word-boundary semantics or hard-code key lists
# that rot. (Mirrors the V-K-112 floor: the audit's matching engine must BE the
# product's matching engine, or it ships green-but-wrong.)
#
# GREEN-BUT-EMPTY GUARD: if literal extraction yields an empty set, every check
# passes vacuously — the most dangerous failure mode for a cross-reference
# audit. A self-test (exit 2, distinct from the exit-1 content failure) asserts
# the resolver behaves (honey resolves 'raw honey' but NOT 'honeydew') and that
# all three sources extracted non-empty BEFORE any check runs.
#
# Spec: docs/NEXT_SESSION_TARGET_2026-05-30.md §P0.1. Lands before the 2nd food
# so the research→spine→surface pipeline is safe to exercise carelessly.
#
# Usage:  bash split/audit-food-effects-sync-v1.sh   (0 = pass, 1 = drift, 2 = engine)
set -e
cd "$(dirname "$0")/.."

node - << 'NODEEOF'
'use strict';
const fs = require('fs');

const DATA     = 'split/data.js';
const CORE     = 'split/core.js';
const MANIFEST = 'docs/research/food-effects.manifest.js';

// ── balanced-literal extractor: walks open→close tracking depth while
// skipping string literals (', ", `) and // + /* */ comments, so braces or
// brackets inside strings/comments never confuse the matcher. Returns the
// literal text including its delimiters, or null. ─────────────────────────
function extractBalanced(src, fromIndex, open, close) {
  let i = src.indexOf(open, fromIndex);
  if (i < 0) return null;
  const start = i;
  let depth = 0, inStr = null, esc = false, lineC = false, blockC = false;
  for (; i < src.length; i++) {
    const c = src[i], n = src[i + 1];
    if (lineC) { if (c === '\n') lineC = false; continue; }
    if (blockC) { if (c === '*' && n === '/') { blockC = false; i++; } continue; }
    if (inStr) {
      if (esc) { esc = false; continue; }
      if (c === '\\') { esc = true; continue; }
      if (c === inStr) inStr = null;
      continue;
    }
    if (c === '/' && n === '/') { lineC = true; i++; continue; }
    if (c === '/' && n === '*') { blockC = true; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  return null;
}

function evalLiteral(text) {
  // text is a balanced {...} or [...] literal → parenthesize so eval reads it
  // as an expression, not a block. Source is our own repo, not user input.
  return eval('(' + text + ')'); // eslint-disable-line no-eval
}

function fail2(msg) { console.log(msg); process.exit(2); }

// ── extract the live resolver from core.js (no drift: this IS the runtime
// matcher the product uses for both the age gate and the consequence card) ──
let _lookupByFoodName;
try {
  const coreSrc = fs.readFileSync(CORE, 'utf8');
  const fnStart = coreSrc.indexOf('function _lookupByFoodName');
  if (fnStart < 0) throw new Error('function _lookupByFoodName not found in ' + CORE);
  const body = extractBalanced(coreSrc, fnStart, '{', '}');
  const headerEnd = coreSrc.indexOf('{', fnStart);
  if (!body || headerEnd < 0) throw new Error('could not brace-match _lookupByFoodName body');
  const header = coreSrc.slice(fnStart, headerEnd); // "function _lookupByFoodName(table, name) "
  _lookupByFoodName = eval('(' + header + body + ')'); // eslint-disable-line no-eval
} catch (e) {
  fail2('audit-food-effects-sync-v1: SELF-TEST FAIL — could not extract _lookupByFoodName from ' +
        CORE + ' (' + e.message + '). The audit cannot verify resolution without the live resolver.');
}

// ── extract the three data sources ──
let FOOD_EFFECTS, AGE_RULES, MANIFEST_ARR;
try {
  const dataSrc = fs.readFileSync(DATA, 'utf8');
  const feLit = extractBalanced(dataSrc, dataSrc.indexOf('const FOOD_EFFECTS'), '{', '}');
  const arLit = extractBalanced(dataSrc, dataSrc.indexOf('const AGE_RULES'), '{', '}');
  if (!feLit) throw new Error('could not extract FOOD_EFFECTS literal from ' + DATA);
  if (!arLit) throw new Error('could not extract AGE_RULES literal from ' + DATA);
  FOOD_EFFECTS = evalLiteral(feLit);
  AGE_RULES = evalLiteral(arLit);
} catch (e) {
  fail2('audit-food-effects-sync-v1: SELF-TEST FAIL — could not extract FOOD_EFFECTS/AGE_RULES from ' +
        DATA + ' (' + e.message + ').');
}
try {
  const manSrc = fs.readFileSync(MANIFEST, 'utf8');
  const arrLit = extractBalanced(manSrc, manSrc.indexOf('FOOD_EFFECTS_MANIFEST'), '[', ']');
  if (!arrLit) throw new Error('could not extract FOOD_EFFECTS_MANIFEST array from ' + MANIFEST);
  MANIFEST_ARR = evalLiteral(arrLit);
} catch (e) {
  fail2('audit-food-effects-sync-v1: SELF-TEST FAIL — could not extract FOOD_EFFECTS_MANIFEST from ' +
        MANIFEST + ' (' + e.message + ').');
}

// ── engine self-test (V-K-112 floor + green-but-empty guard) ──
// Resolver behaviour: word-boundary resolves a multi-word host but NOT a
// substring neighbour; de-pluralisation resolves a trailing-s form.
const probe = { honey: 1 };
if (_lookupByFoodName(probe, 'raw honey') !== 1)
  fail2('audit-food-effects-sync-v1: SELF-TEST FAIL — resolver did not word-boundary match "raw honey" → honey.');
if (_lookupByFoodName(probe, 'honeydew') !== null)
  fail2('audit-food-effects-sync-v1: SELF-TEST FAIL — resolver substring-matched "honeydew" → honey (must NOT).');
if (_lookupByFoodName(probe, 'honeys') !== 1)
  fail2('audit-food-effects-sync-v1: SELF-TEST FAIL — resolver did not de-pluralise "honeys" → honey.');
// Non-empty extraction guard: empty sets make every check pass vacuously.
const feKeys = Object.keys(FOOD_EFFECTS);
const arKeys = Object.keys(AGE_RULES);
if (feKeys.length === 0) fail2('audit-food-effects-sync-v1: SELF-TEST FAIL — FOOD_EFFECTS extracted empty (would pass vacuously).');
if (arKeys.length === 0) fail2('audit-food-effects-sync-v1: SELF-TEST FAIL — AGE_RULES extracted empty (would pass vacuously).');
if (!Array.isArray(MANIFEST_ARR) || MANIFEST_ARR.length === 0)
  fail2('audit-food-effects-sync-v1: SELF-TEST FAIL — FOOD_EFFECTS_MANIFEST extracted empty (would pass vacuously).');

// ── manifest name→entry lookup (food + every alias) ──
const manLookup = {};
for (const e of MANIFEST_ARR) {
  if (e && e.food) manLookup[String(e.food).toLowerCase().trim()] = e;
  if (e && Array.isArray(e.aliases)) e.aliases.forEach(a => { manLookup[String(a).toLowerCase().trim()] = e; });
}

// ── Check 1 — every FOOD_EFFECTS key traces to a manifest entry ──
const c1 = feKeys.filter(k => !_lookupByFoodName(manLookup, k));

// ── Check 2 — every critical-tier manifest entry has a FOOD_EFFECTS record ──
const c2 = [];
for (const e of MANIFEST_ARR) {
  if (!e || e.tier !== 'critical') continue;
  const names = [e.food].concat(Array.isArray(e.aliases) ? e.aliases : []).filter(Boolean);
  if (!names.some(nm => _lookupByFoodName(FOOD_EFFECTS, nm))) c2.push(e.food || '(unnamed manifest entry)');
}

// ── Check 3 — every FOOD_EFFECTS key resolves against AGE_RULES ──
const c3 = feKeys.filter(k => !_lookupByFoodName(AGE_RULES, k));

const total = c1.length + c2.length + c3.length;
if (total === 0) {
  console.log('audit-food-effects-sync-v1: PASS (' + feKeys.length + ' FOOD_EFFECTS keys, ' +
    MANIFEST_ARR.length + ' manifest entries, ' + arKeys.length + ' AGE_RULES gates; ' +
    'self-test 3/3 resolver + 3/3 non-empty; live resolver extracted from core.js)');
  process.exit(0);
}

console.log('audit-food-effects-sync-v1: FAIL (' + total + ' drift across the food-effects spine)');
if (c1.length) {
  console.log('  [1] UNTRACEABLE CLAIM — FOOD_EFFECTS key with no manifest entry: ' + c1.length);
  c1.forEach(k => console.log('      data.js FOOD_EFFECTS[\'' + k + '\'] → no food-effects.manifest.js food/alias'));
}
if (c2.length) {
  console.log('  [2] SILENT GATE — critical-tier manifest entry with no FOOD_EFFECTS record: ' + c2.length);
  c2.forEach(f => console.log('      manifest \'' + f + '\' (tier:critical) → no data.js FOOD_EFFECTS record'));
}
if (c3.length) {
  console.log('  [3] ORPHAN CARD — FOOD_EFFECTS key that does not resolve against AGE_RULES: ' + c3.length);
  c3.forEach(k => console.log('      data.js FOOD_EFFECTS[\'' + k + '\'] → no AGE_RULES gate (word-boundary resolve)'));
}
console.log('');
console.log('Resolution:');
console.log('  • [1] Add the food to docs/research/food-effects.manifest.js (food + aliases),');
console.log('        tracing it to a cited brief — or remove the orphan FOOD_EFFECTS record.');
console.log('  • [2] Project the critical food into data.js FOOD_EFFECTS (why/watchFor/seekCare),');
console.log('        or downgrade the manifest tier if it carries no acute consequence.');
console.log('  • [3] Add the matching AGE_RULES gate in data.js (the card hangs off the gate),');
console.log('        ensuring the key resolves word-boundary (not substring) against it.');
process.exit(1);
NODEEOF
