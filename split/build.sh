#!/bin/bash
# PR-8 (sl-3-pnpm-build): cd to script dir so the build can be invoked from any
# cwd (e.g. `pnpm build` from repo root). Internal cat/node calls remain
# relative to split/ as before; this just makes the cwd discipline implicit.
cd "$(dirname "$0")"
# Phase 2 PR-3: bump manifest.json version (date-stamp + same-day counter)
# before HTML concat. Errors here go to stderr so stdout (HTML) stays clean.
node bump-version.mjs ../manifest.json
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
