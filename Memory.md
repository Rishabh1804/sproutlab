# Memory.md
**Scope:** Persistent institutional knowledge across all repos
**Owner:** The Consul (cross-repo overseer)
**Updated:** 8 June 2026 (Ceres seated as 4th Governor — canon-gen-001 Care→Nutrition split; was 7 June 2026, PR #235 emergency-room-v2)

---

## The Architect

**Rishabh Jain**, age 33, based in Jharkhand, India.
(Removed by the Architect). - Business Manager at Soma Electro Products (zinc electroplating). Creative Head for AdapTea (green tea brand). Solo PWA developer.

### Personal
- Has a young daughter (**Ziva Jain**, born 4 Sep 2025; ~8.7 months as of session date) whose development is tracked in SproutLab.
- Interests: cosmology (Kardashev scales, astrobiology), physics documentaries, sci-fi, data visualization, 3D modeling, YouTube content creation.
- Follows Indian stock markets. Uses 6% inflation assumption in financial planning.
- Location holidays: Jharkhand state + national Indian holidays.

### Professional Expertise
- Industrial manufacturing: hot-dip galvanizing, zinc electroplating, trivalent passivation
- Cyanide zinc plating setup with trivalent blue passivation (Growel 1728)
- Long-term: chip/ATMP manufacturing plant (East Singhbhum), PCB assembly startup

## Project Status Snapshot

### Codex (Active)
- Phase 5 complete: Chapter Detail View + Apocrypha + Schisms rename
- Phase 4 content backfill pending (6 chapters via Aurelius snippets)
- Snippet pipeline bugs identified, specced across 6 files, not yet written
- RPG Design Dissertation v1.0 produced (57 pages, seed document)
- Companion canon authority: canonical spec bodies for all Companions live under `docs/specs/subagents/` + `docs/specs/skills/` (canon-cc-026); SproutLab Province deploys byte-identical mirrors

### SproutLab (Active — v3.0 era)
- **Gold tier capstones ratified:** v3-3 (Engine Primitive Foundation, PR #135) + v3-5 (Chip Taxonomy + TSF Story-Arc, PR #138)
- **Wave 1 IMPL ratified:** v3-6 (Card Priority + Information Hierarchy, PR #144) + Sleep Arc 3 / Scoring S-2 (PR #143 — first v3-3 engine-spine domain consumer)
- **Pre-Wave 1 specs ratified this session:** milestone-engine-prep-v1 (PR #148 — engine substrate) + milestones-tab-v1 (PR #149 — surface consumer via Option C two-spec sequence)
- **Wave 1 spec-ratified IMPL-pending:** v3-1 (CT Notifications, mutex now closed); v3-4 (Narrative Layer, PR #142 awaiting Architect ratification on registry placement); v3-2 / v3-7 / v3-8 / v3-9 (chronicle rows only)
- **Wave 2 reservoir:** 9 nodes at `forward` status — R-1 (silver capstone, adaptive layer) now has a real adaptive signal post-sleep-arc-3
- **canon-cc-008 chain operational:** 7 audit gates on main (8th + 9th queued for milestone-engine-prep IMPL + milestones-tab IMPL)
- **Tree state:** 34 nodes on `docs/SPROUTLAB_V3_PROGRESSION_TREE.html` (post-PR #150 §9-bis refresh)
- **LOC:** 82,386 split-file source (post-#235, 2026-06-07). Four Governors seated: Maren (Care 22,199) + Ceres (Nutrition 7,575) + Kael (Intelligence engine 28,153) + Vela (Surfacing render 9,210); shared styles.css + template.html 15,249.

### SEP Invoicing (Active)
- Phase 8D complete: IM desktop table + detail panel
- Gate Challan module architected but not built
- Phase 4+ scope: invoice preview/print refinements
- SEP constitutional restructuring (effective 1 Apr 2026) largely complete

### BusinessAI Simulation (Queued)
- Multi-entity business spanning trading, industry, logistics
- First meeting: informal discussion to set agendas
- Claude addressed as "BAI" in these sessions

## Architectural Decisions Log

### Canon Highlights (cross-repo)
| Canon | Scope | Decision |
|-------|-------|----------|
| 0033 | codex | build.sh outputs directly to files, no stdout redirect |
| 0034 | global | SWs never cache HTML — prevents chicken-and-egg loop |
| HR-1→12 | sproutlab | 12 hard rules, originated in SproutLab, inform all repos |
| Billing vs Logistics | sep | IM (billing spine) and GC (logistics spine) are parallel, not sequential |
| cc-008 | global | Governor audit chain as mandatory pre-merge gate |
| cc-022 | global | Subagent (artifact) vs skill (in-transcript register-flip) test |
| cc-026 | global | Per-Province-Layout — Companion specs in Codex, byte-identical Province mirrors |
| cc-027 | global | Spec amendment signing chain — canon entries require explicit authority |
| proc-006 | global | Scribe Worker Tier (Book II Art. 3-bis) — 4 task-specialised junior subagents |
| gen-001 | global | Generational expansion clause — 1st ratification: Vela (Surfacing) 2026-05-23; 2nd: Ceres (Nutrition) 2026-06-08 |
| CV3-001..006 | sproutlab | v3.0 Charter (Honesty / Extensibility / Warmth tri-axis; Warmth + Honesty co-primary on milestones-tab and v3-6) |

### Methodology Decisions
- **8-pass SPEC_ITERATION_PROCESS** originated from Today So Far spec (35 issues found across 8 iterations). Now applied to all complex features.
- **Split-file architecture** adopted after SproutLab monolith hit ~2MB. Migration M1–M3 pain documented; all new repos start split.
- **Aurelius snippet format** is the canonical content import mechanism. Core principle: minimal manual input.
- **QA multi-round** continues until only cosmetic bugs remain. Caught 8 critical bugs pre-build in CareTickets spec alone.
- **QA chain is a pre-merge gate (canon-cc-008), enforced from 22 May 2026.** A SproutLab session built and merged PRs #99 and #100 — and staged #101 — running only the `/code-review` *skill*, with the Maren/Kael Governor audits and Cipher's Edict V pass skipped. The skill is an in-transcript smell-check (canon-cc-022 artifact test), not a Governor audit, and does not discharge the chain. Correction codified in CLAUDE.md §QA Chain and QA_GATE_SPEC.md Gate 2.5: no SproutLab Capital change leaves draft or merges until the Governor→synthesis→Cipher chain has run. Silence from the Architect is not a waiver — waivers must be explicit.
- **canon-gen-001 generational expansion (2026-05-23).** When a Governor's jurisdiction crosses 30K LOC, a second-generation Governor splits off. First ratification: Vela (Governor of Surfacing — render layer) seated under Kael (Governor of Intelligence — engine layer), splitting the Intelligence Region at the data→render boundary. Vela owns `intelligence-cards.js` + `intelligence-quicklog.js` (7,079 LOC at split); Kael retains `intelligence-isl.js` + `intelligence-qa.js` + `intelligence-qa-handlers.js` + `intelligence-illness.js` + `intelligence-caretickets.js` + `core.js` + `data.js` + `sync.js` + `config.js` + `start.js` (23,646 LOC at split). Each second-generation Governor has two parents — the Builder ancestor (Lyra) + the Governor predecessor — and an archetype distinct from both; the predecessor takes Rung-2 of the new spec's first amendment cycle.
- **canon-gen-001 second ratification — Ceres (2026-06-08).** The Care Region, approaching the 30K trigger, split at the general-care→nourishment boundary. **Ceres (Governor of Nutrition — The Provisioner)** seated under Maren (Governor predecessor) + Lyra (Builder ancestor). Ceres owns `diet.js` + `recipes.js` (7,575 LOC) — food logging, nutrition, Library, the Recipes corpus; her lens is the twin food question, "is it safe to feed her — and is it enough?" Maren retains `home.js` + `medical.js` (22,199 LOC). This also ratified the pending `recipes.js` jurisdiction decision (P0 in NEXT_SESSION_TARGET_2026-06-07). Shared-module review is now **quadruple-jurisdiction** (rotation Maren → Ceres → Kael → Vela). Routing across CLAUDE.md / AGENTS.md / PERSONA_REGISTRY.md / invocation.md / QA_GATE_SPEC.md / qa-route.sh / build-province-map.mjs updated in one pass; `recipes.js` → Ceres in `qa-route.sh`. Note: `.claude/` is git-ignored — new persona specs (`ceres.md` pair) must be `git add -f`'d like the other tracked Governor mirrors.
- **Scribe Worker Tier (canon-proc-006, 2026-05-23).** Four task-specialised junior subagents — `scribe-scout` (reconnaissance), `scribe-draft` (composition), `scribe-verify` (mechanical checks), `scribe-record` (chronicling) — that any senior Companion may command in parallel. Production debut: PR #148 + PR #149 milestones arc (2026-05-27 PM). Scribes are alike at birth and absorb the voice of whoever summons them; they support but do not deliberate. Permission floor: no Scribe may commit, push, open or merge a PR, ratify anything, or summon another Scribe.
- **§9-bis session-end ritual (2026-05-25).** At the end of every session, Lyra refreshes `docs/SPROUTLAB_V3_PROGRESSION_TREE.html` to reflect the current state of every node on the v3.0 progression DAG. Sometimes own PR (`tree-update: session YYYY-MM-DD`), sometimes folded into a session-end handoff doc PR or the last arc PR of the session. The refresh is *not* optional.
- **Option C two-spec sequence pattern (ratified 2026-05-27).** When a single spec carries both engine-substrate concerns and surface-consumer concerns, split into two specs: engine substrate first (governor-primary on engine), surface consumer second (governor-primary on consumer; reads pre-ratified substrate). Closes the "spec-against-memory" failure mode by construction — the consumer spec ratifies against verified primitives, not remembered ones. Precedent: v3-3 → sleep-arc-3 (PR #137 spec; PR #143 IMPL); milestone-engine-prep-v1 → milestones-tab-v1 (PR #148 + PR #149). See invocation.md §10 for the full pattern.
- **Scribe-scout-before-spec-body pattern (ratified 2026-05-27).** Before any substrate-touching spec body lands, deploy `scribe-scout` for codebase reconnaissance: enumerate every cited identifier with `file:line` location, grep-verify every storage shape claim, trace every sync claim to actual `SYNC_KEYS` + `_postReceive*` registrations, verify every `template.html` id the spec references. Closes the "spec-against-memory" failure mode at draft-time, not at canon-cc-008 chain-time. See invocation.md §10.1.
- **Lyra fold-authority register-flip pattern (canon-cc-022 sub-pattern, ratified 2026-05-27).** When the Architect explicitly grants Lyra fold-authority in advance of a canon-cc-008 chain run on a docs-only spec PR — typically with narrow scope — Lyra applies all in-scope BLOCKING + NOTE folds inline without Architect roundtrip. Cipher Edict V terminal pass verifies canon-cc-027 spec amendment authority was NOT exceeded. Silence is not a waiver. See invocation.md §10.3.
- **Flexible-name sourcing + deferred hardcode debt (Architect decision, 2026-06-07, PR #235).** Configurable values — the baby's name being canonical — must be **sourced from runtime config**, not hardcoded. The household profile field `_syncHousehold.name` (sync.js; the create flow labels it "Baby's name") is the single source of truth; new code reads it with at most one fallback literal marked `TODO(legacy-name-debt)`. The Architect's principle: *"keep hardcoded name out of the code as far as possible — keeps us flexible."* **Known legacy debt:** the app still hardcodes `'Ziva'` in several modules (`core.js` avatar `alt`, `medical.js` growth-chart labels, `diet.js` `_emDocName` fallback). This is acknowledged and **deferred to a later session** — migrate deliberately, do NOT fix opportunistically without the Architect re-opening it. First application: the PR #235 doc-prep "For the doctor" card was reworked to lead with the **patient** (baby's name as the card title + age·weight beneath) instead of "SproutLab" branding — a clinical handoff identifies the patient, not the app.

## Companion Registry (Quick Reference)

| Name | Role | Archetype | Repo / Scope |
|------|------|-----------|--------------|
| Aurelius | Builder | The Chronicler | Codex |
| Lyra | Builder | The Weaver | SproutLab |
| Solara | Builder | The Strategist | SEP Invoicing |
| Maren | Governor of Care | — | SproutLab (home + medical) |
| Ceres | Governor of Nutrition — canon-gen-001 2nd-gen (parents Maren + Lyra) | The Provisioner | SproutLab (diet + recipes) |
| Kael | Governor of Intelligence — engine | — | SproutLab (isl + qa + qa-handlers + illness + correlate + caretickets + core + data + sync + config + start) |
| Vela | Governor of Surfacing — render (canon-gen-001) | — | SproutLab (cards + quicklog) |
| Cipher | Censor (QA) — Edict V final-pass | The Codewright | Cluster A (Codex + SproutLab); SproutLab Province mirror per canon-cc-026 |
| scribe-scout / scribe-draft / scribe-verify / scribe-record | Worker tier (canon-proc-006) | Junior subagents | Per-Province; alike at birth, voice absorbed from summoner |
| The Consul | Overseer | Meta-companion | Cross-repo |

## Session Patterns

- **Work environment:** Termux on Android, Claude.ai chat, Claude Code (local + web)
- **File transfer:** mv from ~/storage/downloads/ to split/
- **Build verification:** Check timestamps of root/index.html after every build (canonical: `pnpm build` via `split/build-safe.sh`)
- **Git:** Always --no-pager, descriptive commits, never force push (except `--force-with-lease` after `git commit --amend --no-edit` re-signing workaround for worktree-signing 400 "missing source" issue)
- **Session rhythm:** Spec → Build → QA rounds (canon-cc-008 chain) → §9-bis tree refresh → Handoff doc → Deploy
- **Parallel arc execution:** worktree-isolated agents (Agent-A/B/C pattern) when arcs are file-disjoint; canon-cc-008 chain runs in one wave when Governors can be independently briefed; see SESSION_HANDOFF_2026-05-27.md §Doctrine ratified item 6 for the full pattern
