#!/bin/bash
# audit-vacc-age-map-v1.sh — every VACC_SCHEDULE `age` label must resolve in VACC_AGE_MONTHS.
#
# Why: due / overdue / upcoming math does `VACC_AGE_MONTHS[v.age] ?? 99`. A label missing
# from the map resolves to 99 months, so that dose silently NEVER comes due. The 2026-09-24
# 12-month audit found JE-2, Hep A-2 and Varicella-2 ('13 months', '18-19 months') lost exactly
# this way. This gate makes a new schedule label without a month value a build failure.
#
# Usage: bash split/audit-vacc-age-map-v1.sh   (0 = pass, 1 = unmapped label, 2 = engine)
set -e
cd "$(dirname "$0")/.."

node - << 'NODEEOF'
'use strict';
const fs = require('fs');
const src = fs.readFileSync('split/data.js', 'utf8');
const mapM = src.match(/const\s+VACC_AGE_MONTHS\s*=\s*(\{[\s\S]*?\});/);
const schM = src.match(/const\s+VACC_SCHEDULE\s*=\s*\[[\s\S]*?\n\];/);
if (!mapM || !schM) { console.error('audit-vacc-age-map-v1: ENGINE — VACC_AGE_MONTHS or VACC_SCHEDULE not found'); process.exit(2); }
let map;
try { map = eval('(' + mapM[1] + ')'); }
catch (e) { console.error('audit-vacc-age-map-v1: ENGINE — eval failed: ' + e.message); process.exit(2); }
const ageHits = [...schM[0].matchAll(/age:\s*'([^']+)'/g)];
const ages = [...new Set(ageHits.map(x => x[1]))];
if (ages.length === 0) { console.error('audit-vacc-age-map-v1: ENGINE — no schedule ages parsed (green-but-empty guard)'); process.exit(2); }
// Count guard (Kael V-K-266-10): every `age:` key must be a single-quoted literal we parsed —
// a double-quoted / template-literal label would otherwise be skipped silently.
const ageKeys = (schM[0].match(/\bage\s*:/g) || []).length;
if (ageKeys !== ageHits.length) { console.error('audit-vacc-age-map-v1: ENGINE — ' + ageKeys + ' age: keys but ' + ageHits.length + ' parsed single-quoted labels (non-literal age label?)'); process.exit(2); }
const missing = ages.filter(a => typeof map[a] !== 'number');
if (missing.length) {
  console.error('audit-vacc-age-map-v1: UNMAPPED — schedule age label(s) with no month value (dose would never come due): ' + missing.join(', '));
  process.exit(1);
}
console.log('audit-vacc-age-map-v1: PASS (' + ages.length + ' schedule age labels, all mapped)');
NODEEOF
