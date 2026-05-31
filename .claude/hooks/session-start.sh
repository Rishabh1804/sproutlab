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

# ── 4. Materialize: sproutlab mirrors first, then Codex canonicals as overlay ──
# (canon-cc-026: Codex wins on name collision; catches names that exist only in
# Codex such as chronicler / consul.)
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
    # Codex canonical bodies — overlay (skip non-frontmatter rationale files).
    for sub in "subagents:$agents" "skills:$skills"; do
      cdir="$CODEX/docs/specs/${sub%%:*}"; ddir="${sub##*:}"
      [ -d "$cdir" ] || continue
      mkdir -p "$ddir"
      for f in "$cdir"/*.md; do
        [ -f "$f" ] || continue
        head -1 "$f" | grep -q '^---$' || continue   # frontmatter only
        cp -f "$f" "$ddir/$(basename "$f")"
      done
    done
  fi
  n="$(ls "$agents" 2>/dev/null | wc -l)"
  echo "[companions] $agents -> $n agent specs" >&2
  total_dirs=$((total_dirs + 1))
done

echo "[companions] materialized into $total_dirs discovery dir(s) from $SPROUTLAB${CODEX:+ + $CODEX}." >&2
