---
name: session-close
description: Run the end-of-session close sequence — the repeatable ritual for closing a build session so the next session inherits a clean, fully-recorded thread. Use when the Architect calls the close ("close out", "wrap up the session", "end of session", "/session-close"). Verifies the pre-close gate, writes the close artifacts (handoff + next-session target, synthesis if a durable pattern emerged, a governance/facts refresh, and a copiable cold-start opening prompt), and lands them as a docs-only PR. When the repo carries a local docs/SESSION_CLOSE_SEQUENCE.md (or equivalent), that doc is the authoritative floor and this skill is the portable skeleton.
trigger: /session-close
---

<!-- Canonical spec — authored and maintained in Codex per canon-cc-026.
     Portable close ritual — deploys to any Province that runs session closes.
     Deploys byte-identical to <repo>/.claude/skills/session-close/SKILL.md per
     canon-cc-026 §Per-Province-Layout — the loadable SKILL.md directory shape
     (frontmatter MUST be line 1; provenance note sits below it, never above).
     First deploy: sproutlab/.claude/skills/session-close/SKILL.md (2026-06-05).
     A Province MAY carry a local authoritative floor at docs/SESSION_CLOSE_SEQUENCE.md
     (SproutLab does); when present it WINS on repo-specific detail and this body is
     the portable skeleton. Amendment path: canon-cc-027 signing chain. -->

# /session-close — end-of-session close sequence

The repeatable procedure for closing a build session, so the next session picks up a clean, fully-recorded thread with no archaeology. A session closes clean when **the record is written, the pointer is set, the facts are true, and the opening prompt is one copy away.**

## Step 0 — defer to the local floor

If this repo carries a local close policy — `docs/SESSION_CLOSE_SEQUENCE.md` or equivalent — **read it first and follow it.** It is the authoritative floor; the steps below are the portable skeleton it specializes. (SproutLab has one.) If there is no local floor, run the skeleton as written.

## When to run

At the end of a session, **after the session's feature work is merged to `main`** (or explicitly parked by the Architect and recorded as a carry-forward), when the Architect calls the close. Do **not** close with un-merged mainline work silently in flight.

## Pre-close gate (state each — a failed item is recorded as a carry-forward, never skipped)

1. **Tree clean, on `main`.** Every session PR merged; local `main` synced to `origin/main`; `git status` clean in every repo touched.
2. **No orphaned drafts.** Every PR opened this session is merged, closed, or explicitly parked-and-recorded.
3. **No dangling PR subscriptions / watches** left unhandled.
4. **Build + checks green on `main`** — the state the next session inherits.

## The close artifacts

Produce or refresh these, bundled into **one docs-only PR**:

1. **Session handoff** — `docs/SESSION_HANDOFF_<YYYY-MM-DD>.md` *(the past — "what we just closed").*
   Header (who · date · branches merged · theme) · **What shipped** (every merged PR + what it delivered) · **QA / review that ran** (who reviewed, key findings, any safety-tier catch) · **Carry-forwards** (everything started-not-finished or inherited-not-addressed) · the copiable opening prompt (artifact 5) as the final section · sign-off.

2. **Synthesis** — `docs/SYNTHESIS_<YYYY-MM-DD>_<arc>.md` *(only when the session produced a durable pattern).*
   The pattern-read — a convention/architecture/doctrine that outlives the feature and feeds candidate canon. Not every session warrants one. If the repo renders companion HTML dashboards, emit the `.html` twin too.

3. **Next-session target** — `docs/NEXT_SESSION_TARGET_<YYYY-MM-DD>.md` *(the future — the pointer).*
   The one recommended next move (with the why) · a priority ladder (P0/P1/P2…), each startable cold · a carry-forward register grouped (human-only gates · successors · test/data debt · housekeeping · candidate canon). This file is the *standing* pointer — if priorities shift between sessions, amend **this**, not the handoff.

4. **Governance / facts refresh** *(keep the policy floor honest).*
   Update wherever the session changed a fact the repo's maps / `CLAUDE.md` assert: LOC counts and any jurisdiction/headroom tables, audit-gate counts, module/subsystem notes, any persona or routing change ratified this session. *Maps win on facts; `CLAUDE.md` wins on rules* — so refresh the asserted facts.

5. **Opening prompt** — a single copiable **fenced code block** *(the cold-start handoff).*
   Carries: one-line recap of where we are · the next session's goal · the required-context read list (absolute paths) · the required-at-start checklist · the Architect directives in force. Lives as the final section of the handoff (artifact 1). The prose is for the record; the box is for the paste.

## Execution order

1. **Verify the pre-close gate**; state each item explicitly.
2. **Branch** off fresh `main`: `claude/session-close-<YYYY-MM-DD>-*`.
3. **Write / refresh the artifacts.** Handoff (incl. the opening-prompt box) + next-target always; synthesis only if warranted; governance refresh if facts moved.
4. **Self-check:** build clean (docs changes don't break it), links resolve, any generated HTML parses and is emoji-free per the repo's icon rule, asserted numbers match source (`wc -l` etc.).
5. **Commit** (`docs: session-close <date> — …`), **push**, open a **draft** docs PR.
6. **Gate:** docs-only → repo's code-review / Governor audit **waived** (state the waiver); final cross-cutting pass optional for docs-only (state the call). Mark ready.
7. **Merge** (Architect's call, or pre-authorized for a docs-only close).
8. **Final hygiene:** drop any PR watches; confirm every repo clean on synced `main`; record stale remote branches as a housekeeping carry-forward.

## Carry-forward discipline

A carry-forward is a promise. Every open thread at close lands in the next-target register with enough context to resume cold — grouped as human-only/Architect gates · successors (next phase of in-flight work) · test/data debt · housekeeping · candidate canon entries. Nothing started-not-finished drops silently.

## Notes

- The close PR is **docs-only**; it does not ship Capital code and does not discharge any code-merge gate.
- If the session made Architect-waiver edits to governed mirrors (`.claude/agents/*`, `.claude/skills/*`) while the canon home repo was unreachable, record a **canon-reconciliation** carry-forward so the canonical bodies are reconciled when that repo is next reachable (canon-cc-026).
- Keep each artifact tight: the handoff is a record, not a transcript; the opening prompt is a launchpad, not a history.
