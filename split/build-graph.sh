#!/bin/bash
# build-graph.sh — regenerate the Graphify knowledge graph from SproutLab source.
#
# Graphify (PyPI `graphifyy`) turns the split-file source into a queryable
# knowledge graph (graph.json) so Companions and Governors can navigate to a
# symbol by query instead of reading 11K-line modules. This is the token-saving
# spine of the graphify-sproutlab integration pilot.
#
# TWO MODES, auto-selected by backend availability (the "graceful-degrade"
# pilot decision):
#   - thorough : AST (tree-sitter, local) PLUS semantic extraction of non-code
#                files (styles.css, template.html, *.md) via an LLM backend.
#                Requires a backend credential (ANTHROPIC_API_KEY / GEMINI /
#                GOOGLE / a local Ollama).
#   - code-only: AST only (tree-sitter, local, free, no network). styles.css
#                and template.html are NOT surveyed in this mode — the
#                Province Map marks that territory "unsurveyed" so the output
#                honestly reflects which mode ran.
#
# Output: split/graphify-out/{graph.json,graph.html,GRAPH_REPORT.md}
#   (both `graphify update split` and `graphify extract split --out split`
#    converge on split/graphify-out/). The dir is gitignored; only the derived
#    docs/PROVINCE_MAP.html is committed.
#
# All output goes to STDERR. This script is NEVER part of build.sh's HTML
# STDOUT stream (it is invoked separately by build-safe.sh, after the HTML
# build and validation) — but routing to STDERR keeps it defensive against
# the PR #118 STDOUT-leak class of bug regardless of how it is called.
#
# Escape hatch: SKIP_GRAPH=1 makes this a no-op (CI / fast iteration).

set -euo pipefail

SPLIT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SPLIT_DIR/.." && pwd)"

if [ "${SKIP_GRAPH:-}" = "1" ]; then
  echo "[build-graph] SKIP_GRAPH=1 — skipping graph regeneration." >&2
  exit 0
fi

# graphify lands in ~/.local/bin via `uv tool install graphifyy`; make sure
# that is on PATH for non-login shells (the session-start hook installs it).
export PATH="$HOME/.local/bin:$PATH"
GRAPHIFY="${GRAPHIFY_BIN:-graphify}"

if ! command -v "$GRAPHIFY" >/dev/null 2>&1; then
  echo "[build-graph] graphify not installed (run: uv tool install graphifyy)." >&2
  echo "[build-graph] skipping graph regeneration (non-fatal)." >&2
  exit 0
fi

cd "$REPO_ROOT"

# Pick the richest backend we can actually authenticate. extract = thorough
# (AST + semantic); update = code-only (AST, no LLM). Both target
# split/graphify-out/.
if [ -n "${ANTHROPIC_API_KEY:-}" ]; then
  echo "[build-graph] thorough extraction (backend=claude) over split/ ..." >&2
  "$GRAPHIFY" extract split --backend claude --out split 1>&2
elif [ -n "${GEMINI_API_KEY:-}" ] || [ -n "${GOOGLE_API_KEY:-}" ]; then
  echo "[build-graph] thorough extraction (backend=gemini) over split/ ..." >&2
  "$GRAPHIFY" extract split --backend gemini --out split 1>&2
elif command -v ollama >/dev/null 2>&1; then
  echo "[build-graph] thorough extraction (backend=ollama, local) over split/ ..." >&2
  "$GRAPHIFY" extract split --backend ollama --out split --max-concurrency 1 1>&2
else
  echo "[build-graph] no LLM backend available — code-only extraction over split/." >&2
  echo "[build-graph] styles.css + template.html will be left UNSURVEYED;" >&2
  echo "[build-graph] set ANTHROPIC_API_KEY (or GEMINI/GOOGLE, or install Ollama) for thorough mode." >&2
  "$GRAPHIFY" update split 1>&2
fi

echo "[build-graph] graph regenerated at split/graphify-out/graph.json" >&2
