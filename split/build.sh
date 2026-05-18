#!/bin/bash
# PR-8 (sl-3-pnpm-build): cd to script dir so the build can be invoked from any
# cwd (e.g. `pnpm build` from repo root). Internal cat/node calls remain
# relative to split/ as before; this just makes the cwd discipline implicit.
cd "$(dirname "$0")"
# HR-1 ship-gate: audit-emoji.sh blocks the build on emoji violations across
# split/ + any built root artifact. Redirect to stderr so the audit's PASS
# line doesn't pollute the HTML on stdout. Per Cipher Edict V round 2 §10 +
# Maren V-M-10 (PR #74 carry-forward).
if ! bash audit-emoji.sh >&2; then
  echo "BUILD ABORTED: HR-1 audit failed. Fix violations above before building." >&2
  exit 1
fi
# Phase 2 PR-3: bump manifest.json version (date-stamp + same-day counter)
# before HTML concat. Errors here go to stderr so stdout (HTML) stays clean.
node bump-version.mjs ../manifest.json
# Mode-2 maren-consult priority-1 build: regenerate docs/POOP_COLOR_REFERENCE.html
# from canonical token + override + lexicon sources. Stderr-redirected per
# audit-emoji.sh precedent. Per V-K-17 (Maren-elevated to load-bearing): the
# chart must stay byte-fresh against styles.css / medical.js / core.js or it
# misleads the audit motion at the exact moment the audit needs sharpest signal.
node build-poop-reference.mjs >&2
# Mode-2 maren-consult priority-2 build: regenerate docs/CARETICKET_STATE_MACHINE.html
# from canonical CARETICKETS_SPEC_v5.md §Lifecycle + intelligence.js ct* handler
# functions. V-M-28 audit-surface visualization — drift between the spec's
# 6 transitions and the implementation's status-assignment sites surfaces as
# block/should flags in the chart's drift report.
node build-careticket-state-machine.mjs >&2
cat <<'HEAD'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Ziva's Dashboard</title>
  <style>
HEAD
cat styles.css
cat <<'MID'
  </style>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
MID
cat template.html
cat <<'SCRIPT'
<script>
SCRIPT
cat config.js
cat data.js
cat core.js
cat home.js
cat diet.js
cat medical.js
cat intelligence.js
cat sync.js
cat start.js
cat <<'FOOT'
</script>
</body>
</html>
FOOT
