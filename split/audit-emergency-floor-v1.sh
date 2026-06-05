#!/usr/bin/env bash
# audit-emergency-floor-v1.sh — never-cross ship-gate for the AUTHORED Emergency Card
# steps (emergency-protocol-v1). The Library's audit-floor-fidelity-v1 locks the
# FOOD_EFFECTS.seekCare copy; this sibling locks the NEW authored EMERGENCY_PROTOCOL.steps
# the Emergency Cards render — a surface the older gate does not read.
#
# Never-cross (any failure aborts the build):
#   · anaphylaxis steps NAME adrenaline / an auto-injector, and carry NO mechanical aid
#     (back blows / chest thrusts / abdominal thrusts / Heimlich).
#   · choking steps NAME mechanical aid, and carry NO adrenaline / auto-injector.
#   · botulism routes to the doctor (call:null) yet keeps the acute escape-hatch ("112").
# GREEN-BUT-EMPTY guard (exit 2): asserts EMERGENCY_PROTOCOL extracted non-empty with the
# three hazards present, so the gate can't pass vacuously.
#
# Usage: bash split/audit-emergency-floor-v1.sh   (0 = pass, 1 = crossed, 2 = engine)
set -e
cd "$(dirname "$0")/.."

node - << 'NODEEOF'
'use strict';
const fs = require('fs');
const src = fs.readFileSync('split/data.js', 'utf8');

// brace-extract the EMERGENCY_PROTOCOL object literal
const m = src.search(/const\s+EMERGENCY_PROTOCOL\s*=\s*\{/);
if (m < 0) { console.error('audit-emergency-floor-v1: ENGINE — EMERGENCY_PROTOCOL not found'); process.exit(2); }
let i = src.indexOf('{', m), depth = 0, end = -1;
for (; i < src.length; i++) { const c = src[i]; if (c === '{') depth++; else if (c === '}') { depth--; if (depth === 0) { end = i; break; } } }
if (end < 0) { console.error('audit-emergency-floor-v1: ENGINE — unbalanced literal'); process.exit(2); }
let EP;
try { eval('EP = ' + src.slice(src.indexOf('{', m), end + 1)); }
catch (e) { console.error('audit-emergency-floor-v1: ENGINE — eval failed: ' + e.message); process.exit(2); }

const hz = Object.keys(EP || {});
for (const need of ['anaphylaxis', 'choking', 'botulism']) {
  if (!EP[need] || !Array.isArray(EP[need].steps) || EP[need].steps.length === 0) {
    console.error('audit-emergency-floor-v1: ENGINE — hazard "' + need + '" missing or has no steps (green-but-empty guard)');
    process.exit(2);
  }
}

const MECH  = /back blow|chest thrust|abdominal thrust|heimlich/i;
const ADREN = /adrenaline|auto-injector|epinephrine/i;
const stepsText = h => EP[h].steps.join(' \n ');
let fail = 0;
const bad = (msg) => { console.error('audit-emergency-floor-v1: CROSSED — ' + msg); fail = 1; };

// anaphylaxis: adrenaline present, mechanical absent
if (!ADREN.test(stepsText('anaphylaxis'))) bad('anaphylaxis steps name no adrenaline / auto-injector');
if (MECH.test(stepsText('anaphylaxis')))   bad('anaphylaxis steps carry MECHANICAL aid (crossed floor)');
// choking: mechanical present, adrenaline absent
if (!MECH.test(stepsText('choking')))      bad('choking steps name no mechanical aid (back blows / chest thrusts)');
if (ADREN.test(stepsText('choking')))      bad('choking steps name adrenaline (crossed floor — choking is mechanical)');
// botulism: doctor-routed (no Call pill) but keeps the acute escape-hatch
if (EP.botulism.call !== null) bad('botulism must route to the doctor (call:null), not an emergency number pill');
if (!/112/.test(stepsText('botulism')))    bad('botulism steps lost the acute escape-hatch ("Call 112" if she deteriorates)');

if (fail) process.exit(1);
console.log('audit-emergency-floor-v1: PASS (' + hz.length + ' hazards; anaphylaxis adrenaline-only, choking mechanical-only, botulism doctor-routed + escape-hatch; 0 crossed)');
NODEEOF
