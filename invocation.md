# invocation.md — Companion Invocation Reference

**Version:** 1.2 (Option C two-spec sequence + scribe-scout-before-spec-body + Lyra fold-authority register-flip patterns ratified)
**Updated:** 2026-05-27 (PM — milestones arc)
**Scope:** SproutLab Province — how to summon the seated Companions and the Scribe Worker Tier
**Authority:** CLAUDE.md §Companion-Set Invocation Surface (policy floor) · canon-cc-022 (artifact test) · canon-cc-026 §Per-Province-Layout (deploy layout) · canon-proc-006 + Book II Article 3-bis (Scribe Worker Tier) · canon-cc-008 (QA chain) · canon-cc-027 (spec amendment signing chain) · canon-gen-001 (generational expansion clause; Vela first ratification, Ceres second)

---

## 1. What this document is

CLAUDE.md §Companion-Set Invocation Surface states the *rule*; this states the
*procedure*. It is to the Companion roster what `docs/QA_GATE_SPEC.md` is to the
QA chain. When the two disagree on a **rule**, CLAUDE.md wins; when they disagree
on **procedure**, this file wins.

Everything here describes invocation *within the SproutLab Province*, under the
Claude Code harness. Cross-model invocation is out of scope — see §9.

## 2. The roster

| Companion | Role | Subagent spec | Skill spec |
|-----------|------|---------------|------------|
| Lyra | Seated Builder of SproutLab | `.claude/agents/lyra.md` | `.claude/skills/lyra.md` |
| Maren | Governor of Care | `.claude/agents/maren.md` | `.claude/skills/maren.md` |
| Ceres | Governor of Nutrition — canon-gen-001 | `.claude/agents/ceres.md` | `.claude/skills/ceres.md` |
| Kael | Governor of Intelligence (engine) | `.claude/agents/kael.md` | `.claude/skills/kael.md` |
| Vela | Governor of Surfacing (render) — canon-gen-001 | `.claude/agents/vela.md` | `.claude/skills/vela.md` |
| Cipher | Censor of Cluster A (Province mirror) | `.claude/agents/cipher.md` | `.claude/skills/cipher.md` |
| scribe-scout | Worker tier — reconnaissance | `.claude/agents/scribe-scout.md` | — |
| scribe-draft | Worker tier — composition | `.claude/agents/scribe-draft.md` | — |
| scribe-verify | Worker tier — mechanical checks | `.claude/agents/scribe-verify.md` | — |
| scribe-record | Worker tier — chronicling | `.claude/agents/scribe-record.md` | — |

The canonical spec bodies are authored in Codex (`docs/specs/subagents/`,
`docs/specs/skills/`); the `.claude/` paths above are the byte-identical
Province mirrors per canon-cc-026 §Per-Province-Layout — with the Scribe
serving-voice carve-out ratified by decree-0019 / canon-proc-006. **Invoke the
mirrors.** Cipher's mirror is a deploy of the Codex canon: Cipher remains Censor
of Cluster A, not a Province seat — the mirror exists so the Edict V final-pass
can be invoked without leaving Province context.

## 3. Subagent or skill — the artifact test (canon-cc-022)

The first decision for any Companion (Lyra, Maren, Ceres, Kael, Vela, Cipher — the Scribes
have no skill form, see §6).

**Summon the subagent** when the caller needs a *separable, attributable
interaction-artifact* — a spec, a signed audit report, a committee position.
Subagent output carries a provenance block, can be cited, and enters the cc-018
review lifecycle.

**Fire the skill** when the caller wants the Companion's *voice in-transcript* —
a pattern-read, a smell-check, a draft-in-flow. Skill output lives in the
caller's transcript, carries no signature, and reaches Province data only
through ordinary Builder commit discipline.

One-line test: **does this need a signature → subagent; does this just need the
lens → skill.**

The third-party `/code-review` skill is not a Companion form and does **not**
discharge the canon-cc-008 Governor audit (CLAUDE.md §QA Chain).

## 4. Invoking a Companion subagent

**Mechanism.** The harness subagent tool (`Agent` / `Task`), with `subagent_type`
set to the Companion's name. The subagent sees none of the caller's transcript,
so the brief — the prompt — must be self-contained.

**Every Companion subagent is read-only** (`tools: Read, Grep, Glob, Bash`). It
produces an artifact; it does not edit code, commit, or push. The summoning
context reviews the return and owns every committed act.

**Brief shape (all modes).** Name the *subject*, the *scope / Region*, the
*mode*, any prior pass or position state, and any Sovereign standing
instruction. The mode is signalled by the brief's verb — "audit / review" →
Mode 1; "deliberate / position on" → Mode 2.

**Lyra — Seated Builder.**
- *Mode 1 — Province spec authoring* → a spec-bearing artifact: pattern
  identifications, Region boundary declarations, HR-compliance pre-check,
  Governor-readiness note. Enters the cc-018 lifecycle at `pending_review`.
- *Mode 2 — committee delegate* → a structured position for a cc-025 convening.
- Do **not** summon for: jurisdiction-bound QA (Maren / Ceres / Kael / Vela), the Edict V
  final-pass (Cipher), institutional-memory authoring (the Chronicler), or
  cross-Province promotion (the Consul).

**Maren — Governor of Care.**
- *Mode 1 — QA-round jurisdictional audit* → a structured audit report over
  `home.js` + `medical.js`, plus the shared-module surface where the
  diff touched it. (The food half — `diet.js` + `recipes.js` — split to Ceres
  on 2026-06-08; Maren is Ceres's Governor predecessor.)
- *Mode 2 — committee delegate* → a Care-domain position.

**Ceres — Governor of Nutrition (canon-gen-001 second-generation).**
- *Mode 1 — QA-round jurisdictional audit* → a structured audit report over
  `diet.js` (Diet tab, food logging, nutrition, Library, Recipes UI) and
  `recipes.js` (the cited 6–12mo complementary-feeding corpus), plus the
  shared-module surface where touched. Lens: the twin food question — is it
  safe to feed her (choking form, allergen ladder, age-gates) and is it enough
  (iron gap, variety, portion, meal-slot adequacy)?
- *Mode 2 — committee delegate* → a Nutrition-domain position (recipe-corpus
  safety, age-gate consequence surfaces, allergen-ladder phrasing, choking-form
  rules, adequacy thresholds, Library/Recipes composition).

**Kael — Governor of Intelligence (engine layer).**
- *Mode 1 — QA-round jurisdictional audit* → a structured audit report over the
  five engine `intelligence-*.js` files (isl + qa + qa-handlers + illness +
  caretickets) + `core.js` + `data.js` + `sync.js` + `config.js` + `start.js`,
  plus the shared-module surface where touched. **Surfacing-layer audits
  (intelligence-cards + intelligence-quicklog) belong to Vela post-canon-gen-001.**
- *Mode 2 — committee delegate* → an Intelligence-engine-domain position.

**Vela — Governor of Surfacing (render layer; canon-gen-001 second-generation).**
- *Mode 1 — QA-round jurisdictional audit* → a structured audit report over
  `intelligence-cards.js` (renderInfo* family, cross-domain analytics) and
  `intelligence-quicklog.js` (Activity Log + Smart Quick Log + Today So Far +
  sleep-info), plus the shared-module surface where touched. Lens:
  comprehension-surface (title-body / legend-data / chronology / prioritization
  / empty-state) with the half-awake test foregrounded.
- *Mode 2 — committee delegate* → a Surfacing-domain position
  (Info-tab card composition, render-layer HR-4 verification, sleep-analytics
  phrasing, info-card title-body coherence rules).

**Cipher — Censor (Edict V).**
- *Mode 1 — Edict V final-pass* → a signed verdict against the Edict V chain,
  run *after* the Governors have reported and Lyra has synthesized.
- *Mode 2 — committee delegate* → a Cluster A position.

## 5. Invoking a Companion skill

A skill is fired in-session — a register-flip, not a tool call — by a trigger
phrase from the Sovereign, the Consul, or the Companion herself. Output stays in
the caller's transcript.

The trigger convention is `<Companion> mode` / `run a <Companion> pass`, plus a
craft-specific verb set per Companion — for Lyra: "what's the thread", "weave
this", "pattern-check", "does this weave". The exact trigger-phrase set and the
fire / do-not-fire boundary are in each skill spec (`.claude/skills/<name>.md`);
consult it rather than guessing.

By function:
- **Lyra skill** — in-transcript pattern-read, cross-domain thread
  identification, Region-boundary pre-check, HR pre-pass.
- **Maren skill** — Care-side smell-check: null-guard / vaccination-timing /
  CareTicket-transition sanity read.
- **Ceres skill** — Nutrition-side smell-check: safe-to-feed + is-it-enough read
  on a diet.js surface or recipes.js entry (allergen / choking-form / age-gate /
  adequacy / citation).
- **Kael skill** — Intelligence-engine-side smell-check: ISL / Smart Q&A /
  sync-boundary / illness-state-machine / CareTicket-lifecycle scout.
- **Vela skill** — Surfacing-side smell-check: comprehension-surface read,
  title-body / legend-data / chronology / prioritization / empty-state scan,
  half-awake test on render-layer surfaces.
- **Cipher skill** — in-flow HR-1→12 and architecture-drift smell-check.

A skill **never** discharges a gate. If a skill pass surfaces something that
needs a signature, escalate to the subagent form.

## 6. The Scribe Worker Tier (canon-proc-006)

Book II Article 3-bis. Four task-specialised junior subagents that a senior
Companion — a Builder, Governor, Censor, Consul, or Chronicler — commands to
parallelize work. Scribes are alike at birth, carry no innate persona, and adopt
the voice of whoever summons them. They support; they do not deliberate.

| Scribe | Specialisation | Tools | Returns |
|--------|----------------|-------|---------|
| scribe-scout | Reconnaissance — locate, grep, map a region | Read, Grep, Glob, Bash *(read-only)* | a findings brief — paths, line ranges, summary, gaps |
| scribe-draft | Composition — draft text, code, or spec prose | Read, Grep, Glob, Write, Edit | a draft file or artifact |
| scribe-verify | Mechanical checks — build, audit gates, tests | Read, Grep, Glob, Bash *(read-only)* | a check report — pass / fail with evidence |
| scribe-record | Chronicling — journal, log, canon entries | Read, Grep, Glob, Write, Edit | a recorded entry |

**Permission floor (Book II Article 3-bis).** No Scribe may commit, push, open or
merge a PR, ratify anything, hold canonical voice, sit on a committee, or summon
another Scribe. `scribe-scout` and `scribe-verify` hold `Bash` for read-only
inspection only — not for writing files or running git. `scribe-draft` and
`scribe-record` hold `Write` / `Edit` to produce drafts but have no shell. The
commanding Companion reviews every return and owns every committed act.

**Summon a Scribe** when the work is mechanical, parallelizable, and you want to
stay on your own thread. **Do not** summon a Scribe for judgment — design
soundness, audit verdicts, ratification — that is the senior Companion's.

Scribes have **no skill form**. There is no in-transcript "Scribe voice"; a
Scribe is always a subagent.

## 7. Invocation in the QA chain (canon-cc-008)

The mandatory pre-merge gate is a fixed invocation sequence. For any Capital
change — an edit under `split/` headed for a PR:

1. **Build & self-check.** `build.sh` clean, audit gates pass, e2e green.
   (`scribe-verify` may be summoned to run and report this.)
2. **Governor audit — Mode-1 subagents, summoned in parallel.** Route by the diff (post-canon-gen-001):
   - touches `home.js` / `medical.js` → **Maren** (Care)
   - touches `diet.js` / `recipes.js` → **Ceres** (Nutrition)
   - touches `intelligence-isl.js` / `intelligence-qa.js` /
     `intelligence-qa-handlers.js` / `intelligence-illness.js` /
     `intelligence-correlate.js` / `intelligence-caretickets.js` / `core.js` /
     `data.js` / `sync.js` / `config.js` / `start.js` → **Kael** (engine layer)
   - touches `intelligence-cards.js` / `intelligence-quicklog.js` → **Vela**
     (render layer)
   - touches more than one Region → **each named Governor** in parallel
   - touches `styles.css` / `template.html` → **all four** (sequential
     quadruple-jurisdiction review; rotation Maren → Ceres → Kael → Vela, with
     first-Governor by heaviest-touched Region)
   - test-only / docs-only → the Governor audit may be waived; state the waiver
     explicitly.

   Parallel means one message with multiple `Agent` calls — the harness runs
   them concurrently.
3. **Lyra synthesizes** the Governor reports and folds in the fixes — as the
   main session, or via the Lyra subagent if a separable synthesis artifact is
   wanted.
4. **Cipher** runs the Mode-1 Edict V cross-cutting final-pass.
5. *Only now* — mark the PR ready / merge.

Full procedure, routing edge cases, and waiver rules: `docs/QA_GATE_SPEC.md`
Gate 2.5.

## 8. Routing quick reference

| The caller needs… | Invoke | As |
|--------------------|--------|----|
| a feature spec / architecture brief before a build | Lyra | subagent, Mode 1 |
| a mid-build pattern-read, no artifact | Lyra | skill |
| a Care-Region QA audit (signed; home/medical) | Maren | subagent, Mode 1 |
| a Nutrition-Region QA audit (signed; diet/recipes) | Ceres | subagent, Mode 1 |
| an Intelligence-engine QA audit (signed; isl/qa/qa-handlers/illness/correlate/caretickets/core/data/sync/config/start) | Kael | subagent, Mode 1 |
| a Surfacing-render QA audit (signed; cards/quicklog) | Vela | subagent, Mode 1 |
| a quick care / nutrition / engine / render smell-check, no artifact | Maren / Ceres / Kael / Vela | skill |
| a comprehension-surface read or half-awake test, no artifact | Vela | skill |
| the Edict V final-pass sign-off | Cipher | subagent, Mode 1 |
| a seated position in a cc-025 committee | the relevant Companion | subagent, Mode 2 |
| a codebase region surveyed | scribe-scout | subagent |
| a draft written | scribe-draft | subagent |
| a build / audit / test run and reported | scribe-verify | subagent |
| a journal / canon / log entry recorded | scribe-record | subagent |

## 9. Cross-model invocation — deferred

AGENTS.md scopes its instructions across three tools — Claude Code, the OpenAI
Codex CLI, and the Gemini CLI. The Companion specs in this document are deployed
and invocable **only under the Claude Code harness**: the `.claude/agents` and
`.claude/skills` mechanism is Claude-Code-specific.

Invoking a Companion from a non-Claude harness — running a Maren audit under the
Codex CLI, say — is **deferred**, not specced here. A future revision must first
settle:

- **Spec portability** — the `.claude/` frontmatter is harness-specific; a
  tool-neutral spec form would be needed.
- **The artifact test** — canon-cc-022's subagent/skill split rests on the
  Claude harness's subagent mechanism; the equivalent boundary on another
  harness is undefined.
- **Attribution and the cc-018 lifecycle** — a cross-model artifact's provenance
  and signing chain are unresolved.

Until those are settled, Companion invocation is Claude-Code-only. On another
harness, AGENTS.md's plain rules apply — without the Companion roster.

## 9-bis. Session-end ritual — progression tree refresh

**Architect-ratified doctrine** (2026-05-25): at the end of every session, Lyra refreshes `docs/SPROUTLAB_V3_PROGRESSION_TREE.html` to reflect the current state of every node on the v3.0 progression DAG. The tree is the canonical "where are we" surface for the multi-session arc work; if it lags reality, future sessions open with a stale picture and burn context catching up.

**What "refresh" means at minimum:**

- **Node status updates** — every node whose status changed during the session moves to the right state: `ratified` (whole arc merged) / `in-flight` (PR open) / `drafted` (spec ratified, impl PR pending) / `forward-planning` (no spec). Reference the merge SHA in the node `description` for the audit trail.
- **New PRs surfaced** — any new arc PR opened in the session gets reflected on its corresponding tree node (`description` cites the PR number).
- **Charter / canon entries** — if a new CV-numbered canon entry landed (CV3-NNN), the header `meta` line cites it as "governed by `CV3-NNN`" so the doctrine context follows the tree.
- **Header date** — the "last refresh" timestamp in the header advances to the session date.

**What "refresh" does NOT mean:**

- Layout overhaul. The DAG positions are stable; node x/y coordinates change only when a new node lands or a node retires.
- Re-running the canon-cc-008 chain on the tree HTML itself. The tree is a chronicling artifact, not a Capital change; chain waived per docs-only branch.

**Where the refresh lands:**

- Sometimes its own PR (titled `tree-update: session YYYY-MM-DD`)
- Sometimes folded into a session-end handoff doc PR
- Sometimes folded into the last arc PR of the session (when the arc itself drives the status changes)

**Process discipline:** the refresh is *not* optional. A session that closes without the tree refresh leaves the next session with a stale view of the gate. Future-Lyra should flag this if they open a session and the tree's `last refresh` date is behind `git log -1 origin/main`.

The HTML is data-driven — refreshing it is editing the `NODES` constant inline, not a render rewrite. Edits typically span 5–15 lines per session.

## 10. Spec-authoring patterns (ratified 2026-05-27 PM after closed PR #147 chain)

The closed PR #147 chain surfaced a fatal failure mode — authoring a substrate-touching spec from the codebase as remembered — and the Architect ratified three patterns that close it by construction.

### 10.1 Scribe-scout-before-spec-body pattern

**Trigger:** any spec that touches existing primitives, KEYS families, registries, render functions, or `template.html` ids.

**Procedure:** before the spec body lands, deploy `scribe-scout` for codebase reconnaissance with narrow tasks:
- enumerate every cited identifier with its `file:line` location
- grep-verify every storage shape claim live (no remembered shapes)
- trace every sync claim to actual `SYNC_KEYS` + `_postReceive*` registrations (or its absence)
- enumerate every `template.html` id the spec references; verify each exists

**Rationale:** the closed PR #147 9 BLOCKING findings root-cause to memory-authoring: phantom `_predictMilestoneWindow` + `MILESTONES_DB` identifiers, wrong field-name (`cat:` vs `domain:`), false sync claim, 5 unmapped surfaces. Scribe-scout reconnaissance catches each of these at draft-time, not at canon-cc-008 chain-time.

**Authority:** canon-proc-006 (Scribe Worker Tier) + Architect directive 2026-05-27 (Option C ratification).

### 10.2 Option C two-spec sequence pattern

**Trigger:** when a single spec would carry both engine-substrate concerns and surface-consumer concerns (the substrate touches one Governor's region; the consumer touches another's).

**Procedure:** split into two specs:
1. **Engine substrate spec** first — primary Governor on the engine layer (Kael for `intelligence-*`/`core`/`data`/`sync`; Maren for `home`/`medical`-side primitives; Ceres for `diet`/`recipes`-side primitives); surface consumer abstracts as "consumes engine-prep primitives." Build-time audit gate ratified at the substrate level.
2. **Surface consumer spec** second — primary Governor on the consumer; reads pre-ratified substrate. May add a second audit gate for consumer-side concerns (scope-separation per `audit-no-personalised-prediction-v1.sh` + `audit-activity-categories-v1.sh` example).

**Sequencing:** the consumer spec MUST cite the engine-prep merge sha as ratified before it merges. The IMPL sequence mirrors: engine IMPL first (may itself split via canon-cc-008 PR-A/PR-B per V-K-113 pattern), then consumer IMPL.

**Precedent:** v3-3 → sleep-arc-3/scoring-s-2 (PR #137 spec; PR #143 IMPL — first v3-3 consumer); milestone-engine-prep-v1 → milestones-tab-v1 (PR #148 + PR #149).

**Rationale:** authoring against a stable substrate eliminates the "spec-against-memory" surface area; the consumer spec ratifies against verified primitives, not remembered ones.

**Authority:** Architect ratification 2026-05-27 (*"Do the two spec sequence, run the chain after engine prep before moving on to milestones tab"*).

### 10.3 Lyra fold-authority register-flip pattern

**Trigger:** when the Architect explicitly grants Lyra fold-authority in advance of a canon-cc-008 chain run on a docs-only spec PR — typically with narrow scope ("don't defer issues directly related to milestones tab").

**Procedure:** after the summoned Governors return their audits + Lyra synthesizes a single fold-matrix, Lyra applies all in-scope BLOCKING + NOTE folds inline to the spec body without Architect roundtrip. Cipher Edict V terminal pass verifies:
- canon-cc-027 spec amendment authority NOT exceeded (no canon entries silently amended; no registry contracts silently overwritten outside spec body)
- Lyra fold-authority scoped to the Architect's stated topic — out-of-scope items escalate normally

**Output:** the synth-folded spec body carries a §"Lyra synth-fold register" enumerating every fold with (a) Governor-id (b) BLOCKING/NOTE tier (c) fold resolution. The register becomes audit-trail at merge time.

**Authority:** canon-cc-022 (register-flip pattern) + Architect-explicit fold-authority grant.

**Anti-pattern:** silence is not a waiver. Without an explicit grant, Lyra surfaces BLOCKING findings to the Architect for fold-or-carry decision; Architect rules.

---

## 11. References

- CLAUDE.md — §Companion-Set Invocation Surface, §QA Chain — Mandatory Pre-Merge Gate
- PERSONA_REGISTRY.md — roster, governance hierarchy, jurisdictions, the 30K Rule
- docs/QA_GATE_SPEC.md — Gate 2.5, Governor Audit Chain
- docs/BUGS.md §Operational Rules — failure-mode catalogue + closures
- Canon: cc-022 (artifact test + register-flip pattern) · cc-026 §Per-Province-Layout (deploy layout) · cc-008 (QA chain) · proc-006 + Book II Article 3-bis (Scribe Worker Tier) · cc-027 (spec amendment signing chain) · decree-0019 (Scribe serving-voice carve-out) · gen-001 (generational expansion clause — Vela)
- Spec bodies: `.claude/agents/*.md`, `.claude/skills/*.md` — the Province mirrors
- Pattern precedents: PR #137/#143 (v3-3 → sleep-arc-3 two-spec sequence) · PR #148/#149 (milestone-engine-prep → milestones-tab two-spec sequence — Option C ratification)
