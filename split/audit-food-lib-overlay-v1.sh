#!/bin/bash
# audit-food-lib-overlay-v1.sh — the recipes.js 12–24 m food-library overlay must land whole.
#
# Why (Ceres V-C-270-14): _mergeFoodLib1224() adds keys to the data.js tables add-if-absent.
# If a later data.js edit adds the same key, the overlay entry is dropped silently — including
# its age gate — and only the debug record _FOOD_LIB_1224_MERGE.skipped would show it. This
# gate turns a silent skip into a build failure: resolve the collision in one place.
#
# Usage: bash split/audit-food-lib-overlay-v1.sh   (0 = pass, 1 = skipped entries, 2 = engine)
set -e
cd "$(dirname "$0")"

node - << 'NODEEOF'
'use strict';
const fs = require('fs'), vm = require('vm');
const stub = new Proxy(function () {}, { get: (t, k) => k === Symbol.toPrimitive ? () => '' : (k === 'length' ? 0 : stub),
  apply: () => stub, construct: () => stub, set: () => true });
const ctx = { console, Math, Date, JSON, Object, Array, String, Number, RegExp, Set, Map, Promise,
  setTimeout: () => 0, clearTimeout: () => 0, setInterval: () => 0,
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  document: stub, navigator: stub, location: stub, firebase: stub, Chart: stub,
  matchMedia: () => ({ matches: false, addEventListener() {} }), addEventListener() {}, requestAnimationFrame: () => 0 };
ctx.window = ctx; ctx.self = ctx; ctx.globalThis = ctx;
vm.createContext(ctx);
// core.js rides along so its hoisted helpers (zi) exist when data.js runs at parse time.
let src = ['config.js', 'data.js', 'recipes.js', 'core.js'].map(f => fs.readFileSync(f, 'utf8')).join('\n');
src += '\n;globalThis.__merge = (typeof _FOOD_LIB_1224_MERGE !== "undefined") ? _FOOD_LIB_1224_MERGE : null;';
try { vm.runInContext(src, ctx, { filename: 'overlay-audit.js' }); }
catch (e) { console.error('audit-food-lib-overlay-v1: ENGINE — load failed: ' + e.message); process.exit(2); }
const m = ctx.__merge;
if (!m || !Array.isArray(m.skipped)) { console.error('audit-food-lib-overlay-v1: ENGINE — _FOOD_LIB_1224_MERGE record not found'); process.exit(2); }
const added = Object.keys(m).filter(k => k !== 'skipped' && Array.isArray(m[k])).reduce((n, k) => n + m[k].length, 0);
if (added === 0) { console.error('audit-food-lib-overlay-v1: ENGINE — overlay added nothing (green-but-empty guard)'); process.exit(2); }
if (m.skipped.length) {
  console.error('audit-food-lib-overlay-v1: SKIPPED — overlay entries shadowed by an existing data.js key (their gates/notes never apply): ' + m.skipped.join(', '));
  process.exit(1);
}
console.log('audit-food-lib-overlay-v1: PASS (' + added + ' overlay entries merged, 0 skipped)');
NODEEOF
