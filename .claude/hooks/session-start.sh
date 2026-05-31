#!/bin/bash
# SessionStart hook — materializes the Companion subagent + skill specs from
# both Provinces (SproutLab mirrors at sproutlab/.claude/, Codex canonicals at
# Codex/docs/specs/) into ~/.claude/agents/ + ~/.claude/skills/ so the harness
# can discover them as registered subagent_type values.
#
# Why this exists: Claude Code on the web sets the primary working directory
# to ~/ (above both repo roots) so multi-repo sessions can edit both Provinces.
# The harness's agent-discovery pass at session start looks at <cwd>/.claude/
# only — it does not descend into repo subdirectories. Without this hook, the
# canon-cc-022 Companion subagents (maren, kael, vela, cipher, chronicler,
# consul, scribes) cannot be summoned via the Agent tool.
#
# Discipline: canon-cc-026 §Per-Province-Layout names sproutlab/.claude/ as
# the Province mirror set, and Codex/docs/specs/ as the canonical authority.
# Materialization order: sproutlab mirrors first, then Codex canonicals as
# overlay (Codex wins on name collision — byte-identical for Cipher; catches
# names that exist only in Codex like chronicler / consul).
#
# Web sessions only; local machines manage their own ~/.claude/ layout.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

USER_AGENTS="$HOME/.claude/agents"
USER_SKILLS="$HOME/.claude/skills"
mkdir -p "$USER_AGENTS" "$USER_SKILLS"

copied=0

# SproutLab Province mirrors (canon-cc-026 §Per-Province-Layout)
SPROUTLAB="$HOME/sproutlab"
if [ -d "$SPROUTLAB/.claude/agents" ]; then
  for f in "$SPROUTLAB/.claude/agents/"*.md; do
    [ -f "$f" ] || continue
    cp -f "$f" "$USER_AGENTS/$(basename "$f")"
    copied=$((copied + 1))
  done
fi
if [ -d "$SPROUTLAB/.claude/skills" ]; then
  for f in "$SPROUTLAB/.claude/skills/"*.md; do
    [ -f "$f" ] || continue
    cp -f "$f" "$USER_SKILLS/$(basename "$f")"
    copied=$((copied + 1))
  done
fi

# Codex canonical bodies — overlay (Codex wins on name collision; catches
# names that exist only in Codex: chronicler, consul, cipher-canonical).
CODEX="$HOME/Codex"
if [ -d "$CODEX/docs/specs/subagents" ]; then
  for f in "$CODEX/docs/specs/subagents/"*.md; do
    [ -f "$f" ] || continue
    # Skip non-frontmatter files (rationale documents etc.)
    head -1 "$f" | grep -q '^---$' || continue
    cp -f "$f" "$USER_AGENTS/$(basename "$f")"
    copied=$((copied + 1))
  done
fi
if [ -d "$CODEX/docs/specs/skills" ]; then
  for f in "$CODEX/docs/specs/skills/"*.md; do
    [ -f "$f" ] || continue
    head -1 "$f" | grep -q '^---$' || continue
    cp -f "$f" "$USER_SKILLS/$(basename "$f")"
    copied=$((copied + 1))
  done
fi

echo "Companion subagents materialized to ~/.claude/ ($copied specs copied)." >&2
echo "  Agents: $(ls "$USER_AGENTS" 2>/dev/null | wc -l) | Skills: $(ls "$USER_SKILLS" 2>/dev/null | wc -l)" >&2

# ── Graphify bootstrap (graphify-sproutlab integration pilot) ──
# The container is ephemeral and graphify-out/ is gitignored, so every remote
# session must (re)install graphify and (re)build the graph before the MCP
# server or `graphify query` has anything to serve. All steps are best-effort
# and NON-FATAL — a graphify hiccup must never break session start. Entirely
# scoped to the remote-only branch above (CLAUDE_CODE_REMOTE=true).
if command -v uv >/dev/null 2>&1; then
  export PATH="$HOME/.local/bin:$PATH"

  # 1. Install graphifyy WITH the [mcp] extra (the MCP stdio server needs it).
  if ! command -v graphify >/dev/null 2>&1; then
    echo "[graphify] installing graphifyy[mcp] ..." >&2
    uv tool install "graphifyy[mcp]" >/dev/null 2>&1 \
      && echo "[graphify] installed." >&2 \
      || echo "[graphify] install failed (non-fatal)." >&2
  fi

  # 2. Best-effort skill drop for Claude Code (does NOT touch CLAUDE.md; the
  #    `claude install` subcommand would, so we deliberately avoid it).
  graphify install --platform claude >/dev/null 2>&1 || true

  # 3. Build the initial graph so the MCP server / CLI have data. Code-only
  #    unless a backend credential is present (build-graph.sh auto-selects).
  if [ -f "$HOME/sproutlab/split/build-graph.sh" ]; then
    echo "[graphify] building initial SproutLab graph ..." >&2
    bash "$HOME/sproutlab/split/build-graph.sh" >&2 || echo "[graphify] graph build failed (non-fatal)." >&2
    node "$HOME/sproutlab/split/build-province-map.mjs" >&2 || true
  fi

  # 4. Materialize an absolute-path MCP config to ~/.mcp.json so the harness
  #    (cwd = ~/, above both repos) can discover the server on the NEXT session
  #    start. Merges our entry without clobbering any existing servers.
  GVENV_PY="$HOME/.local/share/uv/tools/graphifyy/bin/python"
  GRAPH_JSON="$HOME/sproutlab/split/graphify-out/graph.json"
  if [ -x "$GVENV_PY" ]; then
    GVENV_PY="$GVENV_PY" GRAPH_JSON="$GRAPH_JSON" MCP_OUT="$HOME/.mcp.json" python3 - <<'PYMCP' 2>/dev/null || true
import json, os
out=os.environ["MCP_OUT"]; py=os.environ["GVENV_PY"]; gj=os.environ["GRAPH_JSON"]
try:
    cfg=json.load(open(out)) if os.path.exists(out) else {}
except Exception:
    cfg={}
cfg.setdefault("mcpServers",{})["graphify-sproutlab"]={
    "command": py, "args": ["-m","graphify.serve", gj]
}
json.dump(cfg, open(out,"w"), indent=2)
print()
PYMCP
    echo "[graphify] ~/.mcp.json updated (graphify-sproutlab server; active next session)." >&2
  fi
fi
