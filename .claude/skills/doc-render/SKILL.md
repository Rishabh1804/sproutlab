---
name: doc-render
description: "Lyra's Builder skill for rendering a Markdown (or committed-source) reference doc into a styled, self-contained HTML VIEW that is rebuilt every build so it can never drift. Use when a docs/*.md reference (design floor, spec, registry) needs a presentable HTML twin, or when adding a new auto-generated reference page to the build. The .md/source stays source-of-truth; the .html is a generated view with a don't-hand-edit banner. The worked instance is docs/DESIGN_PRINCIPLES.html via split/build-design-principles.mjs; its siblings are PROVINCE_MAP / POOP_COLOR_REFERENCE / CARETICKET_STATE_MACHINE. Triggered by phrases like 'render this doc as HTML', 'give the spec an HTML view', 'why does an .md reference look inconsistent', 'wire a new reference page into the build', '/doc-render'."
trigger: /doc-render
---

# /doc-render — the Builder's reference-doc → HTML-view pattern

**Owner: Lyra, the Weaver — Seated Builder of SproutLab.** This is a *Builder
capability* skill (functional, like `/design-principles`), **not** the Companion
voice mirror at `.claude/skills/lyra.md`. That mirror is the in-session Weaver
*voice*, byte-identical to Codex canon under canon-cc-026 — it is never the place
to register a build capability. The artifact test (canon-cc-022) keeps them
apart: the voice mirror is a register-flip; this is a tooling skill the Builder
reaches for mid-build. Both are Lyra's; only their *shape* differs.

> **The pattern in one line.** A `docs/*.md` reference doc — or any committed
> source the design system should present — gets a **styled, self-contained
> `docs/*.html` view that is regenerated every build from the committed source**,
> so the rendered page *cannot drift* from the doc it mirrors. The `.md`/source
> stays source-of-truth; the `.html` carries a "don't hand-edit, this is
> generated" banner. This is how a Markdown reference stops looking inconsistent
> next to the rest of the Province's auto-generated reference pages.

## When this fires

- A `docs/*.md` reference (the design floor, a spec, a registry, a state-machine
  doc) needs a presentable, linkable HTML twin — "render this doc as HTML",
  "give the spec an HTML view", "the .md looks inconsistent next to the others".
- A new auto-generated reference *page* is being added to the build (a new
  `split/build-<name>.mjs` + its build wiring).
- The half-awake test, applied to docs: would a tired reader open a raw `.md` on
  a phone at 2 AM, or a styled page with a TOC and the house type? The view is
  the courtesy.

Do **not** fire when:

- The caller wants to *change the design floor itself* — that is editing
  `docs/DESIGN_PRINCIPLES.md` (source-of-truth); regenerate the view *after*.
- The caller wants the in-session Weaver voice (pattern-read, Region pre-check,
  Governor handoff) — that is `.claude/skills/lyra.md`, the voice mirror.
- The doc's *data* comes from code symbols, not prose (a graph, a token table
  read live from `styles.css`/`*.js`). That is the sibling generators' job
  (province-map / poop-reference / careticket-state-machine); model on them, but
  this skill is for the **Markdown-prose → view** case.

## The worked instance (read this to copy the pattern)

`docs/DESIGN_PRINCIPLES.html` ← `split/build-design-principles.mjs` ←
`docs/DESIGN_PRINCIPLES.md`.

- **ES module**, mirrors `build-poop-reference.mjs` exactly:
  ```js
  import { readFileSync, writeFileSync } from 'node:fs';
  import { join, dirname, relative } from 'node:path';
  import { fileURLToPath } from 'node:url';
  const __dirname = dirname(fileURLToPath(import.meta.url));
  ```
  `require` is **not** defined in an `.mjs` — use `import`.
- **Self-contained**: Fraunces/Nunito (CDN), the design tokens inline, light +
  dark toggle, a sticky section TOC built from the `##` headings, domain-colour
  table headers + zebra, inline `code` chips. Faithful to the design system, not
  a sketch — the same floor `/design-principles` guards.
- **Focused Markdown renderer** — only the constructs the doc actually uses:
  headings `h1`–`h4` (with slug ids for deep links), tables, `ul`/`ol`,
  blockquotes, fenced code, `hr`, and inline `**bold**` / `` `code` `` /
  `[links]`. Don't reach for a full CommonMark dependency; the Province builds
  with zero runtime deps.
- **Don't-hand-edit banner** at the top of the generated `.html`: the `.md` is
  source-of-truth (CLAUDE.md `@import`s it, the QA chain reads it); the `.html`
  is a view rebuilt from it. Hand-edits to the `.html` are lost next build.

## How to wire a new one

1. **Author `split/build-<name>.mjs`** — copy the worked instance; set `SRC` to
   the `docs/*.md` and `OUT` to the `docs/*.html`. Keep the renderer to the
   constructs the source uses; add one only when the source uses it.
2. **Wire it into the build** beside its siblings, writing to **STDERR** so it
   never pollutes the HTML STDOUT stream (the PR #118 lesson):
   ```sh
   # split/build.sh — after the other doc generators
   node build-<name>.mjs >&2
   ```
   Doc generators that must run *after* HTML build + validation go in
   `split/build-safe.sh` instead (that is where `build-province-map.mjs` runs,
   `1>&2`). Never add a generator to `build.sh`'s STDOUT path.
3. **Build & verify**:
   ```sh
   pnpm build                 # the build-safe.sh wrapper; NEVER bash build.sh with 2>&1
   ```
   Open the generated `docs/*.html` in light **and** dark; confirm the TOC is
   complete, tables render, and there is **no stray Markdown** (`**`, raw `|`,
   un-rendered `` ` ``) leaking into the page.
4. **Commit the generated `.html`** alongside its `.mjs` and the build wiring
   (the doc views are committed artifacts, unlike the gitignored graph output).

## Relationship to the QA chain

This is a Builder tooling skill — an in-transcript register-flip per
canon-cc-022. It **does not** discharge the canon-cc-008 gate. A new generator
touches `split/build.sh` (Kael's jurisdiction) and ships a styled surface (the
design floor `/design-principles` guards, Vela's legibility lens on render); run
the Governor audit on the diff as normal, then Cipher's Edict V final-pass.
Rendering a doc as a view is *presentation*, not policy: when the view and the
`.md` disagree, **the `.md` wins** — regenerate, don't patch the HTML.

## References

- Worked instance: `split/build-design-principles.mjs` → `docs/DESIGN_PRINCIPLES.html`.
- Sibling generators: `split/build-poop-reference.mjs`,
  `split/build-careticket-state-machine.mjs`, `split/build-province-map.mjs`.
- Build wiring: `split/build.sh` (STDERR-only doc generators),
  `split/build-safe.sh` (`build-province-map.mjs`, post-validation).
- Source-of-truth doc: `docs/DESIGN_PRINCIPLES.md` (the `@import` floor).
- The Builder's voice mirror (separate artifact): `.claude/skills/lyra.md`.
- Companion-set placement: `CLAUDE.md` §Companion-Set Invocation Surface; canon-cc-022 (artifact test), canon-cc-026 (skill-mirror placement).
