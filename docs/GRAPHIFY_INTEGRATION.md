# Graphify × SproutLab — Integration Pilot

**Status:** pilot, on `claude/graphify-sproutlab-integration-MCUNU`.
**Companion:** Lyra (build) / Aurelius (cross-repo chronicle).
**Gate:** full canon-cc-008 chain (all four Governors + Cipher Edict V) — pending; PR stays **draft** until it clears.

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
  - **Edge-direction dependency (V-K-G2):** the ripple assumes each `calls` edge is `source`=caller, `target`=callee. The graph is `directed:false`, and networkx does not guarantee endpoint stability across graphify versions. `qa-route.sh` carries a fail-loud guard — known leaf utilities (`escHtml`/`zi`) must have zero outgoing `calls`; if that breaks, the convention has flipped and the oracle **summons all four Governors** (fail-safe) rather than trust an inverted ripple.
- **C — Visualization.** Navigation is Graphify's own **interactive node graph** `split/graphify-out/graph.html` (click / search / filter; gitignored + regenerated, open locally). `docs/PROVINCE_MAP.html` is a committed **exec summary** (jurisdiction cards + headroom-to-30K + coupling) — explicitly not navigable — that supersedes the hand-maintained, drift-prone `docs/MODULE_MAP.html`.

## Field observations (dated — so the next run has a baseline)

The bench number above (~3.7× / up to 45×) is graphify's own *generic* self-benchmark. This section logs what actually happened on real sessions, so future runs can compare against more than a synthetic. **Caveat that applies to every entry:** there is no token meter on the main agent thread and no cross-session telemetry — these are grounded estimates (counterfactual LOC + the subagent token counts the harness *does* report back), not metered totals. Don't read them as exact.

### 2026-06-01 — Allergen Introduction card (PR #203): prototype → spec → canon-cc-008 chain → merge

- **What graphify did well — two specific things, not "everything."**
  - *One-call dispatcher map.* `explain renderInfo` returned the Info-tab dispatcher's whole fan-out (~20 `renderInfo*` cards + the `switchTab` caller + `calls` edges) in **29 lines**. That's the architecture-question case (the bench's 45× end), live — it replaced several `grep` passes to assemble the same picture.
  - *Powering the routing oracle.* `pnpm qa-route` consumed the graph's `calls` edges to compute the cross-province ripple that widened the Governor summon-set to **Maren + Kael** (the card *reads* `feedingData`/`extractDayFoods` + `core.js` resolvers). That ripple is **not grep-able** and is the call I was most likely to under-scope by eye. Goal-B paid off concretely here.
- **Counterfactual (navigation only).** The four relevant modules — `intelligence-cards.js` (3,100), `core.js` (7,082), `data.js` (5,195), `diet.js` (5,052) = **~20,400 LOC** — were navigated *without* reading any of them whole (targeted `Read` windows + `grep`/`sed` + ~5 graphify calls). Reading them whole would be **~160K+ tokens**; the graphify outputs that replaced the *structural* understanding were **~100 lines / ~1.5K tokens**.
- **The bigger context lever was subagent isolation, not graphify.** The four Governor audits (Maren / Kael / Vela / Cipher) spent **~260K tokens / 80 tool-calls in their own isolated contexts**; the main thread only absorbed their final reports (~12K total). graphify made *navigation* cheap; isolation made *deep review* cheap — and isolation moved more of the budget. Worth stating plainly so graphify isn't over-credited for what the harness's fan-out architecture did.
- **Friction (real, log it).** The first `graphify query "<prose question>"` returned **empty** — `query` wants symbol-matching keywords, not natural-language prose; `explain "<symbol>"` was the reliable surface. And the CLI needed an explicit `--graph split/graphify-out/graph.json` (the default `graphify-out/` path is wrong from repo root). Two small stumbles before it paid off. For literal string-hunting (`where is this exact line`), `grep` remained the right tool — the graph is for *structure*, not *strings*.
- **Net.** graphify earned its place via the dispatcher map + the qa-route ripple; ~3.7× on the navigation component is believable and roughly matches the estimate for this session. It is one of two levers, and the smaller one.

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

## Version pin — `graphifyy==0.9.6` (2026-09-24)

The session-start hook installs **`graphifyy[mcp]==0.9.6`** and force-reinstalls on any other version. Unpinned, the container drifted to 0.9.67 and the graph went quietly wrong in two ways:

- **Cross-file `calls` stopped resolving.** SproutLab's modules are script-globals (no `import`), and from **0.9.7** onward graphify resolves `calls` only within a file. Bisected on the same source: 0.8.39 / 0.9.2 / 0.9.5 → ~2,200 cross-file calls; **0.9.6 → 2,843**; 0.9.7 … 0.9.67 → **0**. Effect: the Province Map rendered "No cross-province coupling detected", and `qa-route`'s ripple reported every change as jurisdiction-local. That is a silent canon-cc-008 under-summon, the exact class V-K-G2 guards against.
- **`source_file` became repo-relative** (`split/core.js`, from 0.9.6) where the consumers keyed on bare names (`core.js`), so every module fell through to Opera Publica with 0 LOC.

**Fixes:** both consumers now normalize `source_file` to a `split/`-relative name, and both carry a **resolution guard**. If a graph has >200 `calls` edges but 0 cross a file, the map says coupling is *unknown, not absent*, and `qa-route` **fail-safes to all four Governors**.

**Before bumping the pin**, rebuild on the candidate version and confirm cross-file calls are non-zero:

```bash
python3 -c "import json;g=json.load(open('split/graphify-out/graph.json'));f={n['id']:n.get('source_file') for n in g['nodes']};c=[e for e in g['links'] if e.get('relation')=='calls'];print(len(c),'calls,',sum(f.get(e['source'])!=f.get(e['target']) for e in c),'cross-file')"
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
