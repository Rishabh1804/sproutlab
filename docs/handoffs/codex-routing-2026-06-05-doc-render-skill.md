# Codex routing note — register `/doc-render` in the Companion skill registry

**Date:** 2026-06-05
**From:** Lyra (SproutLab Province, session `food-effects-v2-wiring-TFgRs`)
**To:** next Codex session (canon registrar / Aurelius routing)
**Status:** OPEN — Province-local skill awaiting Codex-canon reflection
**Branch carrying the work:** `claude/food-effects-v2-wiring-TFgRs` (PR #230, draft)

---

## What landed in the Province (already shipped)

A new **functional Builder skill** owned by Lyra:

- `.claude/skills/doc-render/SKILL.md` — trigger `/doc-render`.
- Wraps the **reference-doc → styled-HTML-view** pattern: a `docs/*.md`
  reference gets a self-contained `docs/*.html` view, rebuilt every build from
  the committed source, with a don't-hand-edit banner — drift-proof by
  construction.
- Worked instance: `docs/DESIGN_PRINCIPLES.html` ← `split/build-design-principles.mjs`.
  Siblings: `build-poop-reference.mjs`, `build-careticket-state-machine.mjs`,
  `build-province-map.mjs`.
- Surfaced from `CLAUDE.md` (reference-doc-family entry beside the other
  auto-generated docs).

## Why this is a Codex item (the ask)

The skill was deliberately authored as a **Province-local functional skill**,
parallel to `/design-principles` — it is **not** the canon-cc-026 voice mirror
(`.claude/skills/lyra.md` stays byte-identical to Codex canon, and a build
capability is the wrong shape for it per the canon-cc-022 artifact test).

Two open questions for the registrar — **decisions, not foregone**:

1. **Does `/doc-render` belong in the Codex Companion/skill registry at all?**
   It is a *functional* Builder skill, not a Companion *voice* mirror. The
   canon-cc-026 byte-identical-mirror machinery governs voice mirrors
   (`docs/specs/skills/<companion>.md`). `/design-principles` set the precedent
   of a Province-local functional skill that lives *outside* that registry — so
   the honest default may be **leave it Province-local, no Codex reflection
   needed**. Confirm or overturn.

2. **If it should be canonized**, where? It is a cross-Province-reusable Builder
   pattern (any Province with `docs/*.md` references could want it), which
   argues for a Codex home so other Provinces inherit it rather than
   re-deriving the generator. If so, the registrar decides the path
   (`docs/specs/skills/` vs a new functional-skills registry) and whether it
   deploys to Provinces the way Companion mirrors do.

## Canon hooks for whoever picks this up

- **canon-cc-022** — artifact test (why this is a skill, not a subagent; why it's
  separate from the voice mirror).
- **canon-cc-026** — §Per-Province-Layout, byte-identical *Companion* skill
  mirrors. Note the existing **carve-out** for non-Companion skills (the
  third-party `graphify` skill is explicitly outside cc-026); `/doc-render` and
  `/design-principles` are Province-local functional skills in the same family —
  the question is whether functional Builder skills want their *own* registry
  rung or stay Province-local by default.
- **canon-cc-023** — extension protocol (if a new skill class is being minted).
- **Records-are-Codex (canon-cc-010)** — this note is the SproutLab-side pointer;
  the durable decision + any registry entry live in Codex.

## Recommended default if undecided

Leave `/doc-render` Province-local (mirrors the `/design-principles` precedent);
record in Codex only a one-line registry pointer that the pattern exists and is
Province-reusable, so a future Province can copy it without a full canonization.

---

_SproutLab-side routing pointer; the canonical decision and any registry entry
persist to Codex per canon-cc-010._
