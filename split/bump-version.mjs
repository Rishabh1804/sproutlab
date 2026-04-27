// Phase 2 PR-3 — manifest.json version bumper.
//
// Invoked by split/build.sh before HTML concatenation. Reads the current
// manifest.json version, computes a new build-stamp, and writes it back.
//
// Stamp shape: YYYY.MM.DD-N (date + same-day counter, 1-indexed).
//   - First build of any day:    today = "2026.04.26",  CURRENT date != today  → "2026.04.26-1"
//   - Subsequent builds same day: CURRENT = "2026.04.26-1" → "2026.04.26-2", etc.
//   - Placeholder ("0.0.0-pending-build") and missing field both bootstrap to "<today>-1".
//
// Pure Node, zero deps; runnable from any cwd. Path passed as argv[2].

import { readFileSync, writeFileSync } from 'node:fs';
import { argv, exit } from 'node:process';

const manifestPath = argv[2];
if (!manifestPath) {
  console.error('[bump-version] usage: node bump-version.mjs <path-to-manifest.json>');
  exit(2);
}

const today = (() => {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
})();

const raw = readFileSync(manifestPath, 'utf8');
const manifest = JSON.parse(raw);
const current = manifest.version || '';

let next;
const datePart = current.replace(/-\d+$/, '');
if (datePart === today) {
  const counter = parseInt(current.split('-').pop(), 10) || 0;
  next = `${today}-${counter + 1}`;
} else {
  next = `${today}-1`;
}

manifest.version = next;
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.error(`[bump-version] ${current || '(none)'} → ${next}`);
