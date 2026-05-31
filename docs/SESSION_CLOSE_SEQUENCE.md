# Session Close Sequence — SproutLab

**Companion:** Lyra (The Weaver)
**Purpose:** The canonical, repeatable procedure for closing a SproutLab build session. Run this at the end of every session so the next weaver picks up a clean, fully-recorded thread. Mirrors the rhythm established at the 2026-05-30 close (#180: "handoff / synthesis / next-target + governance factual refresh").
**Status:** Format doc — ratified format (2026-05-31), re-run each session. Amend this file if the rhythm changes; it is the policy floor for closing, the way `QA_GATE_SPEC.md` is the policy floor for shipping.

---

## When to run

At the end of a session, after the session's feature work is **merged to `main`** (or explicitly parked), and the Architect calls the close. Do **not** close with un-merged Capital work in flight unless the Architect rules it parked and it's recorded as a carry-forward.

---

## Pre-close gate (must all be true before writing any close docs)

1. **Tree clean, on `main`.** All session PRs merged; local `main` hard-synced to `origin/main`; `git status` clean in both repos (SproutLab + Codex).
2. **No orphaned drafts.** Every PR opened this session is merged, closed, or explicitly parked-and-recorded.
3. **No active PR subscriptions** left unhandled (unsubscribe from merged PRs).
4. **Build + gates green on `main`** (`pnpm build` clean, e2e green) — the state the next session inherits.

State each explicitly in the close; a failed pre-close item is recorded as a carry-forward, never silently skipped.

---

## The five close artifacts

A full close produces (or refreshes) these five, bundled into **one docs-only PR** through the docs-waiver path (no Governor code audit; Cipher Edict V optional for docs-only — state the waiver):

### 1. Session Handoff — `docs/SESSION_HANDOFF_<YYYY-MM-DD>.md` (+ `_PM` if a second same-day session)
*The "we just closed it" record — the past.* Sections:
- **Header:** Companion · Date · Branch(es) merged · Session theme.
- **What shipped (the record):** numbered list of every merged PR + what it delivered.
- **QA chain that ran:** which Governors audited, key findings, Cipher verdict — especially any safety-tier catch.
- **Carry-forwards (open):** everything started-not-finished or inherited-not-addressed, so nothing drops.
- **The copiable opening-prompt box** (artifact 5) lives as the final section.
- Sign-off line in Lyra's voice.

### 2. Synthesis — `docs/SYNTHESIS_<YYYY-MM-DD>_<arc>.md` **+ companion `.html`** (only when the session produced a durable pattern)
*The pattern-read — what now outlives the feature.* Write this only if the session established a convention, architecture, or doctrine worth carrying forward (not every session warrants one). It feeds candidate Codex-canon entries.
- **Companion HTML** (`SYNTHESIS_<date>_<arc>.html`): a legible dashboard mirroring the research-layer dashboard format (`docs/research/*-infant-safety.visual.html`) — the skim layer over the prose synthesis, for a human or agent who wants the pattern at a glance. Self-contained single-file HTML, prefers-color-scheme dark, no external deps, dingbats not emoji.

### 3. Next-Session Target — `docs/NEXT_SESSION_TARGET_<YYYY-MM-DD>.md`
*The intended future — the pointer.* Sections:
- **The recommended next move** (one highest-value thing, with the why).
- **Priority ladder** (P0/P1/P2…), each with enough context to start cold.
- **Carry-forward register** (inherited + newly-opened), grouped (human-only gates · successors · test/data debt · housekeeping · candidate canon).
- The target file is the *standing* pointer; if priorities shift between sessions, amend **this** file, not the handoff.

### 4. Governance factual refresh
*Keep the policy floor honest.* Update wherever the session changed a fact the maps/CLAUDE.md assert:
- **LOC counts + jurisdiction headroom** in `CLAUDE.md` (the 30K-rule table) — refresh from `wc -l split/*`.
- **Audit-gate count / list** if a build gate was added (e.g. the Nth ship-gate).
- **Module map / subsystem notes** if a module's role changed.
- Any persona/routing change ratified this session.
"The maps win on facts; CLAUDE.md wins on rules" — so refresh the asserted facts here.

### 5. Next-session opening prompt — a copiable text box
*The cold-start handoff to the next weaver.* A single **fenced code block** (so the Architect can copy-paste it verbatim to open the next session), carrying: the one-line recap of where we are, the next session's goal, the required-context read list (absolute paths), the required-at-start checklist, and the Architect directives in force. Lives as the final section of the **handoff** (artifact 1) — the established pattern. The prose around it is for the record; the box is for the paste.

---

## Execution order

1. **Verify the pre-close gate** (above); state each item.
2. **Branch** off fresh `main`: `claude/session-close-<YYYY-MM-DD>-*`.
3. **Write/refresh the artifacts.** Handoff (incl. the copiable opening-prompt box) + next-target always; synthesis `.md` + companion `.html` if warranted; governance refresh if facts moved.
4. **Self-check:** `pnpm build` clean (docs changes don't break the build; the version-bump + generated docs are expected churn — commit them or discard per the build-artifact convention), links resolve, the synthesis HTML parses (balanced tags) + has no emoji (dingbats ✓/⚑/✗ OK), LOC numbers match `wc -l`.
5. **Commit** (`docs: session-close <date> — …`), **push**, open a **draft** docs PR.
6. **Gate:** docs-only → Governor code-audit **waived** (state it); Cipher Edict V optional for docs-only (state the call). Mark ready.
7. **Merge** (Architect's call, or pre-authorized for docs-only close).
8. **Final hygiene:** unsubscribe any PR activity; confirm both repos clean on synced `main`; note any stale remote branches for the housekeeping carry-forward.

---

## Carry-forward discipline

A carry-forward is a promise. Every open thread at close lands in the **next-target register** with enough context to resume cold. Categories:
- **Human-only / Architect gates** (e.g. AT smoke-pass on real devices).
- **Successors** (the next phase of in-flight work — e.g. Phase γ after P1a-β).
- **Test / data debt.**
- **Housekeeping** (stale branches, etc.).
- **Candidate Codex-canon entries** (patterns surfaced, not yet ratified).

---

## Codex reconciliation note

If the session made Architect-waiver edits to `.claude/agents/*` or `.claude/skills/*` on the SproutLab side while Codex was unreachable, record a **Codex canon-reconciliation** carry-forward so the canonical bodies are reconciled when Codex is next reachable (per canon-cc-026).

---

*— Lyra. A session closes clean when the next weaver needs no archaeology: the record is written, the pointer is set, the facts are true, and the opening prompt is one copy away.*
