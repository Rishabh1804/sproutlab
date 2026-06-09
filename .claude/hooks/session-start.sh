#!/bin/bash
# SessionStart hook — materialize Companion subagent + skill specs into the
# harness's agent-discovery directories so the five seated Companions
# (lyra, maren, kael, vela, cipher) plus the four scribes are available as
# `subagent_type` values via the Agent tool.
#
# WHY THE REWRITE (companion auto-load fix):
# The harness discovers subagents at session start from `<cwd>/.claude/agents`
# and `$HOME/.claude/agents`. In a MULTI-REPO web session the cwd is the PARENT
# of the repos (e.g. /home/user, with repos at /home/user/sproutlab) and HOME may
# be /root — so the repo's own committed specs (sproutlab/.claude/agents) are
# never discovered, and `subagent_type: maren` fails ("Agent type not found"),
# forcing a fallback to general-purpose agents wearing the persona by hand.
#
# The previous version hardcoded `$HOME` for BOTH the source (`$HOME/sproutlab`,
# which does not exist when HOME=/root) and the target (`$HOME/.claude`, which is
# not the cwd discovery dir). This rewrite resolves the repo from robust signals
# (this script's own location, $CLAUDE_PROJECT_DIR, known paths) and writes the
# specs to EVERY plausible discovery dir (the stdin `cwd`, $HOME, /home/user,
# $CLAUDE_PROJECT_DIR, pwd) so the harness finds them wherever it looks.
#
# SYNCHRONOUS by design — NOT async. Materialization must finish BEFORE the
# harness's discovery pass; an async hook would race it (the exact source of the
# "lots of times it isn't loaded" intermittency).
#
# Safe to run from the environment setup script too (tolerates no stdin):
#   bash /home/user/sproutlab/.claude/hooks/session-start.sh < /dev/null
# Idempotent — re-running only re-copies byte-identical canonical specs.

set -euo pipefail

# ── 0. Enforcement: activate this repo's git hooks (.githooks) every session ──
# The hooks are DORMANT by default — git only honors .githooks after an explicit
# `git config core.hooksPath .githooks`, which is per-clone and easy to forget.
# Without it the pre-commit (HR-1/HR-12/icon-text) and pre-push (bundle-sync)
# gates silently do not run. Activate idempotently for the repo this hook lives in.
_SS_REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." 2>/dev/null && pwd || true)"
if [ -n "${_SS_REPO:-}" ] && [ -e "$_SS_REPO/.git" ] && [ -d "$_SS_REPO/.githooks" ]; then
  if git -C "$_SS_REPO" config core.hooksPath .githooks 2>/dev/null; then
    echo "[hooks] git enforcement active: core.hooksPath -> .githooks ($_SS_REPO)" >&2
  fi
fi

# ── 1. Locate the SproutLab repo (source of the Province mirror specs) ──
_self_repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." 2>/dev/null && pwd || true)"
SPROUTLAB=""
for cand in "$_self_repo" "${CLAUDE_PROJECT_DIR:-}" "/home/user/sproutlab" "$HOME/sproutlab"; do
  if [ -n "${cand:-}" ] && [ -d "$cand/.claude/agents" ]; then SPROUTLAB="$cand"; break; fi
done

# ── 2. Locate Codex (canonical spec authority; overlay) ──
CODEX=""
_parent="$(dirname "${SPROUTLAB:-/home/user/sproutlab}")"
for cand in "$_parent/Codex" "/home/user/Codex" "$HOME/Codex"; do
  if [ -n "${cand:-}" ] && [ -d "$cand/docs/specs/subagents" ]; then CODEX="$cand"; break; fi
done

# ── 3. Determine the harness agent-discovery dir(s) ──
# The harness reads <cwd>/.claude/agents and $HOME/.claude/agents. Read the cwd
# from the SessionStart stdin JSON when present; always include $HOME and the
# conventional /home/user so we cover every layout. Materialize to all of them.
_stdin_cwd=""
if [ ! -t 0 ]; then
  _input="$(cat 2>/dev/null || true)"
  if [ -n "${_input:-}" ]; then
    _stdin_cwd="$(printf '%s' "$_input" | python3 -c 'import json,sys
try:
    print(json.load(sys.stdin).get("cwd",""))
except Exception:
    pass' 2>/dev/null || true)"
  fi
fi

TARGETS=""
for d in "$_stdin_cwd" "${CLAUDE_PROJECT_DIR:-}" "$HOME" "/home/user" "$(pwd)"; do
  [ -z "${d:-}" ] && continue
  # dedupe
  case " $TARGETS " in *" $d "*) continue ;; esac
  TARGETS="$TARGETS $d"
done

if [ -z "${SPROUTLAB:-}" ]; then
  echo "[companions] could not locate the SproutLab repo; skipping (non-fatal)." >&2
  exit 0
fi

# ── 4. Materialize: SproutLab mirrors win; Codex canonicals fill gaps only ──
# canon-cc-026 amended (Architect, 2026-06-10 — Province self-governance):
# SproutLab GOVERNS its own Companion specs. Codex is record-keeping, NOT the
# routing/governance authority for SproutLab. The Codex overlay therefore only
# ADDS specs the Province does not ship (e.g. consul); it never clobbers a
# Province-owned spec (lyra / maren / kael / vela / ceres / cipher / chronicler).
# (Was: "Codex wins on name collision" — reversed so Province-authored lore,
# e.g. Lyra's naming-lore, survives every session-start materialization.)
copy_specs() {
  local src="$1" dst="$2"
  [ -d "$src" ] || return 0
  mkdir -p "$dst"
  # Skip when dst resolves to the same dir as src (a target == the repo itself,
  # e.g. cwd or $CLAUDE_PROJECT_DIR is the sproutlab root): the specs are already
  # there, and cp'ing a file onto itself errors.
  if [ "$(cd "$src" && pwd)" = "$(cd "$dst" && pwd)" ]; then return 0; fi
  for f in "$src"/*.md; do
    [ -f "$f" ] || continue
    cp -f "$f" "$dst/$(basename "$f")"
  done
}

total_dirs=0
for base in $TARGETS; do
  # Never materialize INTO a source repo's own tree. Its specs are already there,
  # and the Codex overlay would otherwise corrupt the tracked sproutlab mirror
  # (overwrite kael/lyra/... with Codex canonicals) and add Codex-only specs
  # (chronicler/consul) to it. Skip the sproutlab + Codex repo roots as targets.
  _rb="$(cd "$base" 2>/dev/null && pwd || echo "$base")"
  [ "$_rb" = "$(cd "$SPROUTLAB" && pwd)" ] && continue
  [ -n "${CODEX:-}" ] && [ "$_rb" = "$(cd "$CODEX" && pwd)" ] && continue
  agents="$base/.claude/agents"; skills="$base/.claude/skills"
  copy_specs "$SPROUTLAB/.claude/agents" "$agents"
  copy_specs "$SPROUTLAB/.claude/skills" "$skills"
  if [ -n "${CODEX:-}" ]; then
    # Codex canonical bodies — GAP-FILL overlay (skip non-frontmatter rationale
    # files). Province-self-governance (2026-06-10): only copy a Codex spec when
    # the Province did NOT already place one of that name — SproutLab wins.
    for sub in "subagents:$agents" "skills:$skills"; do
      cdir="$CODEX/docs/specs/${sub%%:*}"; ddir="${sub##*:}"
      [ -d "$cdir" ] || continue
      mkdir -p "$ddir"
      for f in "$cdir"/*.md; do
        [ -f "$f" ] || continue
        head -1 "$f" | grep -q '^---$' || continue   # frontmatter only
        [ -e "$ddir/$(basename "$f")" ] && continue   # Province wins — no clobber
        cp -f "$f" "$ddir/$(basename "$f")"
      done
    done
  fi
  n="$(ls "$agents" 2>/dev/null | wc -l)"
  echo "[companions] $agents -> $n agent specs" >&2
  total_dirs=$((total_dirs + 1))
done

echo "[companions] materialized into $total_dirs discovery dir(s) from $SPROUTLAB${CODEX:+ + $CODEX}." >&2

# ── Graphify bootstrap (graphify-sproutlab integration pilot) ──
# The container is ephemeral and graphify-out/ is gitignored, so every remote
# session must (re)install graphify and (re)build the graph before the MCP
# server or `graphify query` has anything to serve. All steps are best-effort
# and NON-FATAL — a graphify hiccup must never break session start. Remote
# (web) sessions only, matching the original pilot scoping. Repo paths use the
# resolved $SPROUTLAB (NOT $HOME/sproutlab — same multi-repo path bug the
# companion-autoload fix above removed).
if [ "${CLAUDE_CODE_REMOTE:-}" = "true" ] && command -v uv >/dev/null 2>&1; then
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
  if [ -n "${SPROUTLAB:-}" ] && [ -f "$SPROUTLAB/split/build-graph.sh" ]; then
    echo "[graphify] building initial SproutLab graph ..." >&2
    bash "$SPROUTLAB/split/build-graph.sh" >&2 || echo "[graphify] graph build failed (non-fatal)." >&2
    node "$SPROUTLAB/split/build-province-map.mjs" >&2 || true
  fi

  # 4. Materialize an absolute-path MCP config to ~/.mcp.json so the harness
  #    can discover the server on the NEXT session start. Merges our entry
  #    without clobbering any existing servers.
  GVENV_PY="$HOME/.local/share/uv/tools/graphifyy/bin/python"
  GRAPH_JSON="${SPROUTLAB:-/home/user/sproutlab}/split/graphify-out/graph.json"
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
