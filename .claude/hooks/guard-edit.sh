#!/usr/bin/env bash
# PreToolUse(Edit|Write) guard — protects the generated bundle from hand-edits.
#
# The root index.html / sproutlab.html are BUILD OUTPUTS (generated from split/*
# by pnpm build). Hand-editing them is overwritten on the next build and bypasses
# the audit gates. This guard blocks Edit/Write to those files specifically.
#
# Protocol: tool JSON on stdin; exit 2 + stderr = block. FAIL-OPEN on any error.

fp="$(python3 -c 'import json,sys;
try:
    print(json.load(sys.stdin).get("tool_input",{}).get("file_path",""))
except Exception:
    pass' 2>/dev/null || true)"

[ -z "${fp:-}" ] && exit 0

base="$(basename "$fp")"
case "$base" in
  index.html|sproutlab.html)
    # Only block the BUNDLE root copies: a sibling split/ dir is the reliable
    # signal that this is the build-output root (not some unrelated index.html).
    dir="$(cd "$(dirname "$fp")" 2>/dev/null && pwd || dirname "$fp")"
    if [ -d "$dir/split" ]; then
      echo "BLOCKED: $base is a BUILD OUTPUT (generated from split/* by 'pnpm build'). Edit the split/ source module and rebuild — a hand-edit here is overwritten on the next build and bypasses the audit gates." >&2
      exit 2
    fi
    ;;
esac

exit 0
