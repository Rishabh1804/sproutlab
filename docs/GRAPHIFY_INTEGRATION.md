# Graphify × SproutLab — Integration Pilot

**Status:** pilot, on `claude/graphify-sproutlab-integration-MCUNU`.
**Companion:** Lyra (build) / Aurelius (cross-repo chronicle).
**Gate:** full canon-cc-008 chain (all three Governors + Cipher Edict V) — pending; PR stays **draft** until it clears.

## Why

SproutLab is 18 source modules / ~76K LOC; the built artifact is 3.7 MB. Navigating it the dumb way (read whole 11K-line modules) burns tokens. [Graphify](https://github.com/safishamsi/graphify) (`graphifyy`) turns the source into a queryable knowledge graph so we navigate *by query* and read only the returned slices.

## Pilot decisions (Architect-ratified)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Home | SproutLab only (pilot; promote to Codex canon if it earns its keep) |
| 2 | Artifacts | `split/graphify-out/` gitignored; regenerated from committed source |
| 3 | Surface | MCP server (`graphify-sproutlab`) + CLI + skill |
| 4 | Regen trigger | Build step in `build-safe.sh` (non-fatal; never in `build.sh` STDOUT) |
| 5 | Feed scope | Thorough (all modules incl. `styles.css`/`template.html`) |
| 6 | Backend | Configured Anthropic; **graceful-degrade to code-only** when no key |
| 7 | Visualization | `docs/PROVINCE_MAP.html` — Roman provincial map; supersedes `MODULE_MAP.html` |
| 8 | QA gate | Full canon-cc-008 chain |

## Goals + measured results

- **A — navigation token savings.** `graphify benchmark split/graphify-out/graph.json` reports **~3.7× average** token reduction vs naive full-corpus (up to ~45× on an architecture-level question), on the code-only graph.
- **B — routing oracle.** `pnpm qa-route [<base>]` computes the canon-cc-008 Governor summon-set from a diff (file-level jurisdiction routing **plus** cross-province ripple via `calls` edges). Advisory: widens the summon-set, never narrows it; does **not** discharge the gate.
- **C — Visualization.** Navigation is Graphify's own **interactive node graph** `split/graphify-out/graph.html` (click / search / filter; gitignored + regenerated, open locally). `docs/PROVINCE_MAP.html` is a committed **exec summary** (jurisdiction cards + headroom-to-30K + coupling) — explicitly not navigable — that supersedes the hand-maintained, drift-prone `docs/MODULE_MAP.html`.

## Commands

```bash
pnpm build         # builds HTML, then (non-fatal) regenerates graph + Province Map
pnpm graph         # regenerate graph + Province Map on demand
pnpm qa-route      # Governor summon-set for the current diff (vs origin/main)
SKIP_GRAPH=1 pnpm build   # skip graph regen (fast iteration / CI)

# query the graph directly (CLI surface, works this session):
graphify query "where is the hero score computed"
graphify path "renderHeroScore" "FOOD_EFFECTS"
graphify affected "computeScore"
```

## Extraction modes

`split/build-graph.sh` auto-selects:
- **thorough** (AST + semantic; includes `styles.css` + `template.html`) when `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, or a local Ollama is available;
- **code-only** (AST, tree-sitter, local, free) otherwise — shared files are left *unsurveyed* and the Province Map says so.

No code change is needed to upgrade — just supply a backend credential and rebuild.

## MCP server — discovery caveat

`.mcp.json` (repo root) registers the `graphify-sproutlab` server: `python -m graphify.serve split/graphify-out/graph.json` (needs `graphifyy[mcp]`, which the session-start hook installs). The graph is gitignored, so the server has nothing to serve until a build runs this session.

In the **remote web harness** the cwd is `~/` (above both repos), so a repo-relative `.mcp.json` is not auto-discovered. `.claude/hooks/session-start.sh` materializes an absolute-path copy to `~/.mcp.json` — which the harness only picks up on the **next** session start. So:
- **This session:** use the CLI (`graphify query/path/affected`) against `split/graphify-out/graph.json`.
- **Next session onward:** the MCP server is live.

Locally (where `sproutlab` *is* the project dir), the repo `.mcp.json` works directly.

## Governance

Graphify is a **tool** — the `scribe-scout` reconnaissance instrument — **not a Companion seat**. The third-party `.claude/skills/graphify/` skill dropped by `graphify install` is explicitly **carved out of canon-cc-026** (which governs Companion skill mirrors only). It supports; it does not deliberate, sign, or hold canonical voice.
