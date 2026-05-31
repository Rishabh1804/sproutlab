#!/usr/bin/env bash
# PreToolUse(Bash) guard — blocks documented build antipatterns BEFORE they run.
#
# Claude Code hook protocol: tool JSON arrives on stdin; exit 2 + a stderr
# message BLOCKS the tool call and shows the message to the agent. Any other
# exit (incl. 0) allows it. FAIL-OPEN: any parse failure or unexpected input
# exits 0 (allow) — a guard bug must never brick the agent.

cmd="$(python3 -c 'import json,sys;
try:
    print(json.load(sys.stdin).get("tool_input",{}).get("command",""))
except Exception:
    pass' 2>/dev/null || true)"

[ -z "${cmd:-}" ] && exit 0

# PR #118 class: build.sh with merged STDERR leaks audit text into the HTML bundle.
if printf '%s' "$cmd" | grep -qE 'build\.sh' && printf '%s' "$cmd" | grep -qE '2>&1'; then
  echo "BLOCKED (PR #118 class): never invoke build.sh with 2>&1 — STDERR audit text leaks into the HTML and pollutes the rendered page. Use 'pnpm build' (split/build-safe.sh enforces the safe redirection)." >&2
  exit 2
fi

# "NEVER use raw cat" to assemble the bundle (CLAUDE.md Build section).
if printf '%s' "$cmd" | grep -qE '\bcat\b' && printf '%s' "$cmd" | grep -qE '(>>?)[[:space:]]*(\.\./)?(index|sproutlab)\.html'; then
  echo "BLOCKED: do not assemble the bundle with raw cat. Use 'pnpm build' — the build injects DOCTYPE, <style>/<script> tags, and the Chart.js-then-Motion-One CDN order that a raw cat cannot reproduce." >&2
  exit 2
fi

exit 0
