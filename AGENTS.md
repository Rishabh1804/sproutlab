# AGENTS.md
**Scope:** Cross-tool agent instructions (Claude Code, OpenAI Codex CLI, Gemini CLI)
**Author:** Rishabh Jain
**Updated:** 27 May 2026 (post-canon-gen-001 + Scribe Worker Tier ratification)

---

## Project Overview

Three PWA projects sharing a common architectural pattern: split-file HTML concatenation, localStorage persistence, GitHub Pages deployment. All built by a solo developer on Termux (Android) using AI-assisted sessions.

| Project | Lines | Modules | Persona | Domain |
|---------|-------|---------|---------|--------|
| Codex | 5,300 | 8 | Aurelius | Project tracking / RPG |
| SproutLab | 67,442 | 17 (post-intelligence-* split) | Lyra | Baby development tracker |
| SEP Invoicing | 7,100 | 22 | Solara | Industrial invoicing |

## Non-Negotiable Rules

1. **Split-file architecture.** Every project uses `split/build.sh` to concatenate modules into a single HTML file. Never edit the built output directly. Never bypass build.sh.
2. **No inline styles, no inline handlers.** All styling via CSS classes + design tokens. All events via `data-action` delegation.
3. **escHtml() at all render boundaries.** Any user-supplied or imported string passes through escHtml() before innerHTML.
4. **Service workers never cache HTML.** Cache only static assets. (Prevents unbreakable update loops on mobile.)
5. **Timezone-safe dates.** Always `new Date(y, m-1, d)`, never `new Date("YYYY-MM-DD")`.
6. **git --no-pager** for all git commands (Termux terminal width constraint).
7. **Spec before build.** Complex features use the 8-pass SPEC_ITERATION_PROCESS. The spec is build-ready when the builder never makes an undocumented decision.
8. **QA until cosmetic.** Post-build multi-round QA. Continue until only cosmetic bugs remain.
9. **SproutLab — Governor audit chain before merge (canon-cc-008; post-canon-gen-001 routing).** Every Capital change (edit under `split/`) clears the Governor→synthesis→Cipher chain before its PR leaves draft or merges. Routing by diff:
   - touches `home.js` / `diet.js` / `medical.js` → **Maren** (Care)
   - touches `intelligence-isl.js` / `intelligence-qa.js` / `intelligence-qa-handlers.js` / `intelligence-illness.js` / `intelligence-caretickets.js` / `core.js` / `data.js` / `sync.js` / `config.js` / `start.js` → **Kael** (Intelligence engine)
   - touches `intelligence-cards.js` / `intelligence-quicklog.js` → **Vela** (Surfacing render — canon-gen-001 second-generation; seated 2026-05-23)
   - touches `styles.css` / `template.html` → **all three** in sequential triple-jurisdiction (rotation Maren → Kael → Vela, first-Governor by heaviest-touched Region)
   - Lyra synthesizes; Cipher runs the Edict V cross-cutting final-pass. The `/code-review` skill does NOT discharge the gate. See CLAUDE.md §QA Chain and docs/QA_GATE_SPEC.md Gate 2.5.
10. **Scribe Worker Tier (canon-proc-006, Book II Art. 3-bis).** Senior Companions may command four task-specialised junior subagents — `scribe-scout` (reconnaissance), `scribe-draft` (composition), `scribe-verify` (mechanical checks), `scribe-record` (chronicling) — to parallelize work. Scribes are alike at birth, absorb the voice of whoever summons them, and CANNOT commit / push / open or merge PRs / ratify / hold canonical voice / summon another Scribe. The commanding Companion reviews every return and owns every committed act. See invocation.md §6.
11. **Spec-against-memory closure (2026-05-27).** Substrate-touching specs MUST be authored against scribe-scout codebase reconnaissance, not against the codebase as remembered. Closed PR #147 demonstrated the failure mode (9 BLOCKING + 19 NOTE from phantom identifiers + wrong field-names + false sync claims). When a single spec carries both engine-substrate and surface-consumer concerns, use the **Option C two-spec sequence** pattern (invocation.md §10.2). See docs/BUGS.md §Operational Rules for failure-mode catalogue.
12. **Animation foundation — Motion One opt-in-with-fallback (2026-05-28 PM).** SproutLab adopted Motion One v10.18.0 as the app-wide animation foundation at the milestones-tab-v1 IMPL (PRs #162 + #163). Every animation call-site gates on `window.Motion` availability; CSS-class transitions are the fallback for offline parents / blocked CDN / pre-Motion cached HTML. Reduced-motion respect via `matchMedia('(prefers-reduced-motion: reduce)')`. FLIP pattern (`_msSnapshotInWindowRects` + `_msFLIPCards`) is the canonical list-reorder animation primitive. Documented carve-out for `currentColor` pass-through (annotated `// motion-currentcolor-carveout`). See `docs/DESIGN_PRINCIPLES.md` §Animation Foundation + §HR-2 carve-outs.
13. **`/code-review xhigh` before canon-cc-008 chain on substantial IMPLs (2026-05-28 PM precedent).** When an IMPL PR includes substantial new code surface (~1000+ LOC of novel render or business logic), run `/code-review xhigh` BEFORE summoning the Governor chain. Milestones-tab-v1 IMPL PR #159 precedent: the review surfaced 3 catastrophic bugs (TDZ self-shadow, activityLog Object/Array shape mismatch, `_zivaAgeInDays()` no-arg) that the Governor audits might have missed because the code was fresh. The review's 9-finder-angle recall mode is complementary to the Governor's jurisdictional depth.

## Build Commands

```bash
# Codex (self-copying)
cd split && bash build.sh

# SproutLab — canonical (post-PR #120):
pnpm build
# This calls split/build-safe.sh which (a) invokes build.sh with correct
# STDOUT/STDERR redirection, (b) validates <!DOCTYPE html>…</html> bookends
# and size, (c) mirrors sproutlab.html → index.html. NEVER use
# `bash split/build.sh > out.html 2>&1` — the 2>&1 captures STDERR into the
# output file and corrupts the HTML (PR #117/#118 incident).

# SEP Invoicing (stdout redirect + manual copy)
cd split && bash build.sh > ../sep-invoicing.html
cp ../sep-invoicing.html ../index.html
```

## Code Conventions

- **Variable declarations:** `var` (ES5 compatible, no `let`/`const` in SproutLab/SEP legacy)
- **Functions:** Named function declarations, not arrow functions (ES5 compat)
- **String templates:** Backtick template literals are used in newer code (Codex)
- **Module boundaries:** Section comments `/* ===== SECTION NAME ===== */`
- **Icon systems:** `cx(name)` in Codex, `zi(name)` in SproutLab, inline SVG in SEP
- **Currency:** `Math.floor` in SproutLab, `gstRound()` (Math.round * 100 / 100) in SEP. Never `toFixed()`.

## File Transfer Protocol

1. AI generates updated module files
2. Download to `~/storage/downloads/`
3. `mv` (not `cp`) files to `~/storage/shared/<repo>/split/`
4. Build via build.sh
5. Preview in browser
6. Sync index.html
7. Git add, commit, push

## Persona System

Each project has a named AI companion. See PERSONA_REGISTRY.md for full details. The persona system follows a Roman governance hierarchy:
- **Builders** (per-repo): Aurelius, Lyra, Solara
- **Censor** (shared QA): Cipher
- **Consul** (cross-repo oversight): The Consul

## Documentation Standards

- Handoff docs in `docs/` after every build session
- Design principles doc per repo
- Quick reference doc per repo
- Specs for complex features (SPEC_ITERATION_PROCESS)
