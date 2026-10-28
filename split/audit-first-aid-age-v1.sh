#!/bin/bash
# audit-first-aid-age-v1.sh — every first-aid surface teaches the CHILD (1 year+) technique.
#
# Why (Kael V-K-266-4, 2026-09-24): Ziva turned one on 2026-09-04 and the infant techniques
# (choking: forearm + chest thrusts; CPR: two thumbs, 4 cm, foot-tap check) were hand-rewritten
# across SIX surfaces in two files. The emergency-floor gate reads only EMERGENCY_PROTOCOL and
# checks mechanical-vs-adrenaline, not technique-vs-age — so a missed surface (it happened: the
# SYMPTOM_DB "unconsciousness" card) or a revert to infant copy passes it silently. This gate
# slices each surface out of the source text (comments stripped) and asserts the technique.
#
# Surfaces: config.js GENERAL_EMERGENCIES 'unresponsive' + 'choking'; data.js
# FOOD_EFFECTS['choking hazards'].seekCare, EMERGENCY_PROTOCOL.choking, SYMPTOM_DB 'choking' +
# 'unconsciousness'.
#
# Usage: bash split/audit-first-aid-age-v1.sh   (0 = pass, 1 = infant technique found, 2 = engine)
set -e
cd "$(dirname "$0")/.."

node - << 'NODEEOF'
'use strict';
const fs = require('fs');
const strip = (t) => t.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
const cfg = fs.readFileSync('split/config.js', 'utf8');
const dat = fs.readFileSync('split/data.js', 'utf8');

// Slice from an anchor to the next record boundary (the next `id: '` or the given end marker).
function slice(src, anchor, endRe) {
  const i = src.indexOf(anchor);
  if (i < 0) return null;
  const rest = src.slice(i + anchor.length);
  const m = rest.search(endRe);
  return strip(anchor + (m < 0 ? rest : rest.slice(0, m)));
}
const NEXT_ID = /\n\s*(\{\s*\n\s*)?id:\s*'/;
const S = {
  'config unresponsive':   slice(cfg, "id: 'unresponsive'", NEXT_ID),
  'config choking':        slice(cfg, "id: 'choking'", NEXT_ID),
  'FOOD_EFFECTS seekCare': (dat.match(/seekCare:\s*'Choking is a MECHANICAL emergency[^\n]*/) || [null])[0],
  'EMERGENCY_PROTOCOL':    slice(dat, "  choking: {\n    title: 'Choking'", /\n  botulism:\s*\{/),
  'SYMPTOM_DB choking':    slice(dat, "id: 'choking',", NEXT_ID),
  'SYMPTOM_DB unconscious':slice(dat, "id: 'unconsciousness',", NEXT_ID),
};
for (const [k, v] of Object.entries(S)) {
  if (!v || v.length < 80) { console.error('audit-first-aid-age-v1: ENGINE — surface "' + k + '" not found (green-but-empty guard)'); process.exit(2); }
}
const INFANT_CHOKE = /chest thrust|forearm|two fingers|2 fingers|never abdominal|heimlich\) on bab/i;
const INFANT_CPR   = /both thumbs|two thumbs|two-thumb|two fingers|about 4 cm|infant cpr|bottom of (her|the) foot/i;
let fail = 0;
const bad = (k, msg) => { console.error('audit-first-aid-age-v1: INFANT TECHNIQUE — ' + k + ': ' + msg); fail = 1; };
for (const k of ['config choking', 'FOOD_EFFECTS seekCare', 'EMERGENCY_PROTOCOL', 'SYMPTOM_DB choking']) {
  if (!/abdominal thrust/i.test(S[k])) bad(k, 'does not teach abdominal thrusts (child 1y+ choking)');
  const m = S[k].match(INFANT_CHOKE); if (m) bad(k, 'carries infant choking copy "' + m[0] + '"');
}
if (!/heel of one hand/i.test(S['config unresponsive'])) bad('config unresponsive', 'CPR does not teach the heel of one hand');
if (!/5 cm/.test(S['config unresponsive'])) bad('config unresponsive', 'CPR does not state the 5 cm child depth');
for (const k of ['config unresponsive', 'SYMPTOM_DB unconscious']) {
  const m = S[k].match(INFANT_CPR); if (m) bad(k, 'carries infant CPR copy "' + m[0] + '"');
}
if (fail) process.exit(1);
console.log('audit-first-aid-age-v1: PASS (6 first-aid surfaces teach the child 1y+ technique; 0 infant copy)');
NODEEOF
