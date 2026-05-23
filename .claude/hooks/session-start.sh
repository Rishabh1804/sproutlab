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
