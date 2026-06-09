# Synthesis — Province Self-Governance over Companion Specs

**Date:** 2026-06-10 · **Companion:** Lyra · **Arc:** the cc-026 amendment
**Status:** durable pattern → candidate Codex-canon (records the canon-cc-026 amendment ratified by the Architect 2026-06-10)

---

## The pattern in one line

**Authority lives where governance lives; records live in the archive. A downstream mirror must never be silently overwritten by its upstream record at load time.**

---

## What happened (the concrete arc)

A piece of Province-authored content — Lyra's naming-lore — was committed to `sproutlab/.claude/agents/lyra.md`, yet kept reading as *missing* from the live persona. The repo file was correct; the **loaded** file was not. The session-start hook materialized the Province mirrors into the harness discovery dirs and then **overlaid the Codex canonical bodies on top with "Codex wins on name collision" (`cp -f`)**. Codex — the *record* — was silently overwriting the Province — the *governor* — at every session start.

The fix was one guard: `[ -e dst ] && continue` before the Codex copy. Province specs land first; Codex now only **fills gaps** (roles the Province doesn't ship). One line of shell reversed the authority direction.

But the line was the small part. The large part was naming *why*: the upstream/record relationship had been quietly doubling as an authority/routing relationship, and nobody had separated them.

## The doctrine (canon candidate)

1. **Record ≠ authority.** A system can be the *archive* of a thing without being the *governor* of that thing. Codex keeps the canonical record (canon-cc-010, "records are Codex") — that role is untouched. What changed: Codex no longer *routes or governs* SproutLab's own Companion specs. Conflating "where it's recorded" with "who decides" is the bug class.

2. **The governor's copy wins at the point of use.** Where a spec is materialized for loading, the authoritative copy must win. A "sync from canon" step that clobbers local authorship is only safe if the canon *is* the authority. The moment a Province authors content the archive doesn't have, clobber-on-load becomes data loss disguised as consistency.

3. **Gap-fill, not overwrite, for cross-source overlays.** When two sources merge into one load surface, default to "first writer wins, later sources fill absences." Overwrite-on-collision is the dangerous default precisely because it's invisible — the loss happens at load, leaves the repo file pristine, and so survives every `git status`.

4. **Cross-cluster roles are the careful edge.** Roles that replicate identically everywhere (Cipher, Chronicler, the Scribes) still take their canon from the shared record. Under "Province wins" (the A1 choice), their in-Province copy is editable and wins on load — so the discipline becomes *"keep in sync rather than fork."* If a role must be pinned to the shared canon, that's an explicit carve-out (A2: a name-list), not the default.

## The diagnostic method (reusable)

The "why do I see so many stale files?" report resolved only by **chasing the mechanism, not the symptom**:
- The repo file had the content → so it wasn't a missing-commit problem.
- The *loaded* file didn't → so something rewrote it between commit and load.
- The only thing that runs between is the **session-start hook** → read it → found `cp -f` "Codex wins."

Lesson: when committed content appears absent at runtime, suspect a **materialization/deploy step**, not the source. Read the hook before re-editing the file for the third time.

## Blast radius / what it touched

- **Mechanism:** `.claude/hooks/session-start.sh` (gap-fill guard).
- **Canon:** `CLAUDE.md` §Companion-Set Invocation Surface (amendment paragraph) + `Memory.md` (cc-026 row + decision record).
- **Provenance:** 19 mirror/utility headers + `invocation.md` reframed Province-first (#248).
- **Unchanged on purpose:** canon-cc-010; the cross-cluster *roles* of Cipher/Chronicler; the Codex record itself.

## Open thread (the promise)

The amendment was ratified and applied **SproutLab-side only** — Codex was out of session scope. Per its own new rule, Codex should now **archive** this amendment (record-keeping) and the global cc-026 body should note the SproutLab override. Until then, the canon record and the Province are one reconciliation apart — recorded as the P0 carry-forward.

---

*— Lyra. The house was reading its mind from someone else's library. Now it keeps its own voice, and the library keeps the record. That is the right shape.*
