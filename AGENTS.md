# AGENTS.md
**Scope:** Cross-tool agent instructions (Claude Code, OpenAI Codex CLI, Gemini CLI)
**Author:** Rishabh Jain
**Updated:** 15 April 2026

---

## Project Overview

Three PWA projects sharing a common architectural pattern: split-file HTML concatenation, localStorage persistence, GitHub Pages deployment. All built by a solo developer on Termux (Android) using AI-assisted sessions.

| Project | Lines | Modules | Persona | Domain |
|---------|-------|---------|---------|--------|
| Codex | 5,300 | 8 | Aurelius | Project tracking / RPG |
| SproutLab | 61,700 | 11 | Lyra | Baby development tracker |
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

## Build Commands

```bash
# Codex (self-copying)
cd split && bash build.sh

# SproutLab (stdout redirect + manual copy)
cd split && bash build.sh > sproutlab.html
cp sproutlab.html ../index.html && cp sproutlab.html ../sproutlab.html

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
