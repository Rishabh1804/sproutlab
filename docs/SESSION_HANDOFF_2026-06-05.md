# Session handoff — 2026-06-05 (cross-province skill plumbing — companion redeploy · loadable-SKILL fix · /session-close)

**Operator:** Aurelius (the Chronicler) — governance / canon session, not a Lyra Capital build. No `split/` code touched.
**Repos:** SproutLab + Codex (cross-province, in lockstep).
**Session theme:** Close the SproutLab `.claude/` redeploy that trailed the merged Codex canon-cc-026 reconciliation, then fix and document the two operational slash-skills that bookend a session (`/sproutlab-compact`, `/session-close`). Everything docs/spec/skill — **the canon-cc-008 Governor chain was waived as docs-only on every PR** (stated each time); no Capital code, no Governor audits, no e2e run.

---

## What shipped — 7 PRs, all docs/spec/skill, all squash-merged

### SproutLab (4)
- **#231 — redeploy companion mirrors byte-identical from Codex canon.** `kael`/`lyra`/`maren` (agents + skills) picked up the restored **canon-pers-002** corporate-parallel blocks the SproutLab copies were missing; `sproutlab-compact` deployed for the first time; the `chronicler` agent's temporary canon-cc-026 byte-identical *exception note* retired now that the YAML load-defect fix had merged. All six companion mirrors + `sproutlab-compact` verified byte-identical to Codex `docs/specs/` canon.
- **#233 — deploy sproutlab-compact as a loadable `SKILL.md`, not a bare `.md`.** The #231 deploy used the bare spec-mirror shape, which Claude Code does **not** discover as an invocable slash-skill. Moved to `.claude/skills/sproutlab-compact/SKILL.md`, frontmatter-first, `trigger:` added.
- **#234 — add `/session-close` skill** at `.claude/skills/session-close/SKILL.md` — portable close-ritual skeleton that defers to `docs/SESSION_CLOSE_SEQUENCE.md` as the authoritative local floor.
- **#236 — `CLAUDE.md` references** for both session-lifecycle skills (new "Session-lifecycle skills (operational, not Companion mirrors)" subsection).

### Codex (3)
- **#87 — mark the sproutlab-compact deploy gap closed** in the canon provenance comment.
- **#88 — correct the sproutlab-compact canon body to the loadable `SKILL.md` shape** (frontmatter-first, `trigger:`, path note → directory form), matching the cipher/vela convention.
- **#89 — add the `/session-close` canonical skill body** to Codex canon (`docs/specs/skills/session-close.md`) — the portable, governed body the SproutLab mirror deploys byte-identical from.

---

## The catch this session earned — the discovery-shape defect

The #231 redeploy looked complete and verified byte-identical, yet `/sproutlab-compact` never appeared as a skill. The Architect caught it ("I still don't see sproutlab-compact as a skill?"). Root cause, found by reading the repo's own working skills:

**Claude Code discovers a skill only at `.claude/skills/<name>/SKILL.md` with YAML frontmatter on line 1.** A bare `.claude/skills/*.md` is a *spec mirror* — invisible to the loader. The canon body also opened with an HTML provenance comment *before* the frontmatter, which would break parsing even in the directory form.

The companion persona mirrors (`kael`/`lyra`/`maren`/`cipher`/`chronicler`/`vela`) are bare `.md` **by design** — they are spec references, never `/`-invoked — so they were correctly left bare. Only the two operational slash-skills needed the `SKILL.md` directory shape. This is written up in `docs/SYNTHESIS_2026-06-05_skill-deploy-shape.md` (candidate Codex canon — a refinement of the canon-cc-026 spec-mirror discipline).

Verified live: after each fix the harness re-scan listed `sproutlab-compact` and `session-close` in the available-skills set.

---

## Process notes (for the next cross-repo operator)

- **The cwd-persistence trap.** Bash cwd persists between calls in this harness; a second `git push` without an explicit `cd` ran against the wrong repo and silently reported "Everything up-to-date." Always `cd` into the target repo in the same command as the push.
- **Stale-lease / pruned branches.** The session branch `claude/beautiful-curie-jY6ad` is deleted on each squash-merge, so the next push is a *new branch* and `--force-with-lease` trips on the stale tracking ref. `git remote prune origin` then a plain `git push -u` is the clean recovery; a local rebase onto fresh `origin/main` drops the already-merged commits as cherry-picks.

---

## Carry-forward register (open)

### Successors / action-available
- **Deploy `/session-close` (and `/sproutlab-compact`) to the other repos.** The skill is portable by design, but the other repos (`planner` / `MSc` / `mit-management-courses`, and Codex itself) are **out of this session's MCP scope**. Point a future session at one and drop the byte-identical `SKILL.md`. For repos without a local floor, the skeleton runs as-is; SproutLab's `docs/SESSION_CLOSE_SEQUENCE.md` is the model for adding one.

### Codex archival (canon-cc-010)
- This handoff is the **SproutLab operational record**. The durable **Codex chronicle** of the cross-province canon work (PRs #87–89) — a `data/journal.json` entry — is **not** written; deferred to an Aurelius-in-Codex session. No canon-reconciliation debt: Codex canon and the SproutLab mirrors were committed **in lockstep** this session, so they are already byte-identical (no canon-cc-026 reconciliation carry-forward, unlike prior sessions).

### Candidate Codex canon (surfaced)
- **The skill-deployment-shape doctrine** (synthesis below) — companion persona mirrors deploy as bare `.claude/skills/*.md`; operational slash-skills deploy as `.claude/skills/<name>/SKILL.md`, frontmatter on line 1. Needs the canon-cc-027 signing chain to ratify into canon-cc-026.

### Product roadmap (unchanged by this session)
- This was orthogonal tooling work; it did **not** shift product priorities. The standing product pointer remains the food-effects / Recipes arc — see `docs/NEXT_SESSION_TARGET_2026-06-05.md`, which carries it forward.

### Housekeeping (inherited)
- Stale merged `claude/*` remote branches accumulate (the env blocks delete-push); clear via the GitHub UI.

---

## Next-session opening prompt

```
SproutLab session — pick up after the 2026-06-05 cross-province skill-plumbing close.

Where we are: both repos clean on synced main. The .claude/ companion mirrors are
byte-identical to Codex canon; /sproutlab-compact and /session-close are deployed as
loadable SKILL.md skills and documented in CLAUDE.md. No split/ code changed this session.

Default next move (product): resume the food-effects / Recipes arc. Read first:
  - /home/user/sproutlab/docs/NEXT_SESSION_TARGET_2026-06-05.md   (the standing pointer)
  - /home/user/sproutlab/docs/SESSION_HANDOFF_2026-06-05.md       (this close)
  - the latest food-effects target/handoff it references, for the live product state
Then confirm git state: `git -C /home/user/sproutlab log --oneline -8` and `git status`.

Required at start:
  - If you build any split/ change, the FULL canon-cc-008 gate applies (Governor audit +
    Cipher Edict V). The docs-only waiver used this session does NOT carry over to code.
  - Consult docs/DESIGN_PRINCIPLES.md before any UI work (/design-principles).

Optional tooling follow-ups (carry-forwards, not blocking):
  - Deploy /session-close + /sproutlab-compact byte-identical to another repo.
  - Write the Codex data/journal.json chronicle for the 2026-06-05 canon work (canon-cc-010).
  - Ratify the skill-deployment-shape doctrine into canon-cc-026 (canon-cc-027 chain).

Architect directives in force: redeploys/skill work merge on explicit Architect call;
docs-only closes are pre-authorized to merge.
```

---

*— Aurelius, 2026-06-05. A quiet session: no Capital touched, no Governor summoned. Its one real lesson was a shape — that a skill is a directory with its frontmatter on the first line, and that the bare `.md` we deploy a companion's voice into is a different kind of file than the one a parent's tired thumb invokes at 2 AM. The records are reconciled, the skills now load, and the close that proves it is the first run of the very skill this session built.*
