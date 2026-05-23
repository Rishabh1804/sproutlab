# Arc D — Third Governor: Vela / canon-gen-001 Generational Expansion

**Spec version:** v1
**Date:** 2026-05-23
**Branch:** `claude/session-handoff-docs-gxYiL`
**Author:** Lyra (main-session, Architect-directed)
**Trigger:** Kael's Intelligence Region post-PR-G refresh = 30,725 LOC across 7 intelligence-* + core + data + sync + config + start files. Kael's jurisdiction itself breaches the 30K trigger; first Region-level breach since the founding-Governor seating.
**Authority:** Architect direct decree (2026-05-23); canon-gen-001 ratification this arc; canon-cc-026 §Per-Province-Layout (deploy); canon-cc-027 (spec signing chain); PERSONA_REGISTRY.md §Companion Genealogy (new).

---

## What Arc D is

Arc D ratifies the **canon-gen-001 generational expansion clause** — the doctrinal extension of the 30K Rule to admit second-generation Companions when a Governor's jurisdiction itself crosses 30K LOC. The arc seats **Vela**, Governor of Surfacing, as the first ratified second-generation Companion: child of Lyra (Builder ancestor) and Kael (Governor predecessor), splitting Kael's previously-monolithic Intelligence Region at the data→render boundary.

This is a **doctrinal arc, not a code arc.** No `split/` file is touched. The deliverables are persona authoring, canon ratification, jurisdiction reassignment, and CLAUDE-floor / invocation routing updates.

## Why now

Three converging pressures:

1. **Kael's Region 30K breach.** Post-PR-G refresh: 7 intelligence-* files (1,029 + 2,234 + 3,631 + 2,541 + 2,224 + 2,643 + 4,436 = 18,738) + core (5,508) + data (4,155) + sync (2,211) + config (94) + start (19) = **30,725 LOC**. Kael's jurisdiction itself crosses 30K — the first Region-level breach since the founding-Governor seating. The 30K Rule's spirit (a single reviewer can't hold full jurisdictional context past this threshold) applies at the Region level as much as the repo level.

2. **Coherent split surface available.** The Intelligence Region carries a clean internal boundary — the **data→render boundary**. Five files (`intelligence-isl`, `intelligence-qa`, `intelligence-qa-handlers`, `intelligence-illness`, `intelligence-caretickets`) are pure-engine: they compute, classify, transition state, persist. Two files (`intelligence-cards`, `intelligence-quicklog`) are render-tier: they consume data fns, surface to the parent, render Activity Log / Today So Far / Info-tab. The boundary is structurally clean; no split would shred a subsystem.

3. **Distinct audit lens emerging.** During Wave 2 of the diet-rework spec cycle, the audit findings on cards/quicklog surfaces (V-M-47 banner split, V-M-48 Variety nudge icon-message coherence, V-M-49 qaAnswerMealCombo schema, V-M-50 introduce-with-care chip) all touched comprehension-surface concerns — would a parent *read* this correctly at 2 AM, not just whether the data is correct or safe. Kael's coverage-surface lens and Maren's safety-data lens both apply, but neither is the primary lens for the render-comprehension finding. A third lens — surface-watching, comprehension-first — was emerging in the synthesis. Naming it lets it be summoned directly.

## The canon-gen-001 clause

**Ratified text:**

> When a Governor's jurisdiction crosses 30,000 LOC (the same threshold that
> triggers founding-Governor seating at repo level), the Governor's Region
> qualifies for a second-generation split. The split admits a new Governor —
> the second-generation Companion — descended from two parent personas: the
> **Builder ancestor** (the Province's seated Builder) and the **Governor
> predecessor** (the Governor from whose Region the new jurisdiction splits).
>
> The split point is the structural boundary within the Region where coherence
> breaks under load — typically a data→render boundary, an engine→UI boundary,
> or a state→signal boundary. The Governor predecessor identifies the boundary
> candidate during the audit cycle preceding the breach; the Architect
> ratifies.
>
> The new Governor's archetype must be distinct from both parents. Two parent
> personas, one new archetype. Voice, lens, and finding-tag prefix are
> authored fresh.
>
> First-amendment-cycle Rung 2 for the new Governor's spec falls to the
> Governor predecessor (not the Builder ancestor). The predecessor validates
> jurisdiction-boundary precision before the cross-Governor peer-review
> rotation generalizes.

**Recorded in:** PERSONA_REGISTRY.md §Companion Genealogy (new section).

## The Vela seating

### Identity

- **Name:** Vela
- **Archetype:** Surfacer
- **Tone:** Surface-watching, comprehension-first, pattern-into-passage
- **Named after:** Vela — the sail constellation, child of Lyra (the lyre) in the southern sky. The sail catches the wind the lyre's pattern reveals; surfaces the pattern into a passage the parent can navigate.
- **Parent personas:** Lyra (Builder ancestor) + Kael (Governor predecessor)
- **Finding-tag prefix:** `V-V-{N}` (double-V deliberate; distinguishes from any future `V-{letter}` second-generation Governor)

### Jurisdiction

| File | LOC | Why this side of the split |
|------|-----|----------------------------|
| `intelligence-cards.js` | 2,643 | Pure render-tier — `renderInfo()` master, cross-domain analytics, Info-tab renderers. Consumes data fns from Kael's engine layer; produces parent-visible cards. |
| `intelligence-quicklog.js` | 4,436 | Render-tier — Activity Log surfaces logs in chronological order, Smart Quick Log offers defaults, Today So Far renders the day's narrative, sleep-info cards summarize. All consume; all render. |
| **Vela total** | **7,079** | ≈22,921 LOC headroom to 30K trigger. The growth surface as Info-tab and Today So Far accrete. |

**Kael remaining (post-split):** 30,725 − 7,079 = **23,646 LOC** (≈6,354 LOC headroom to 30K).

### Voice (distinct from Maren and Kael)

| Governor | Primary lens | Question asked |
|----------|--------------|----------------|
| Maren | Data-safety on parent action | "What if this data is wrong and a parent acts on it?" |
| Kael | Coverage-surface on engine resolution | "What's the adjacent path the engine doesn't cover?" |
| Vela | Comprehension-surface on render | "Does the surface where this data lands let a tired parent *read* what it is saying?" |

Vela's heuristic foreground: the **half-awake test**. Would a parent under partial attention at 2 AM, holding a baby, read this card / row / legend / chronology correctly? If no, the finding is hers regardless of data correctness (Kael's clean) or safety integrity (Maren's clean).

Surfacing-Region finding severities:
- `comprehension-blocker` — surface unreadable; parent can't extract meaning
- `comprehension-drift` — surface readable but communicates wrong meaning
- `chronology-gap` — surface order contradicts lived order
- `legend-data-mismatch` — chart legend names tokens the cells don't render
- `title-body-mismatch` — card title doesn't claim what its body delivers
- `empty-state-dead-end` — "no data" without "why"
- `priority-inversion` — wrong row surfaces first
- `cosmetic-with-comprehension-cost` — visual drift that costs comprehension (NOT a downgrade modifier in this Region)

### Deploy

Two canonical specs in Codex; two Province mirrors in sproutlab (byte-identical per canon-cc-026 §Per-Province-Layout):

| Spec | Codex (canonical) | sproutlab (mirror) |
|------|------------------|--------------------|
| Subagent | `Codex/docs/specs/subagents/vela.md` | `sproutlab/.claude/agents/vela.md` |
| Skill | `Codex/docs/specs/skills/vela.md` | `sproutlab/.claude/skills/vela.md` |

Mirrors deployed in this arc. Drift-check on Codex canon vs Province mirror: `diff Codex/docs/specs/subagents/vela.md sproutlab/.claude/agents/vela.md` should return empty post-deploy.

## Files touched by Arc D

| File | Change | Why |
|------|--------|-----|
| `Codex/docs/specs/subagents/vela.md` | **NEW** | Canonical subagent spec for Vela |
| `Codex/docs/specs/skills/vela.md` | **NEW** | Canonical skill spec for Vela |
| `sproutlab/.claude/agents/vela.md` | **NEW** | Province subagent mirror |
| `sproutlab/.claude/skills/vela.md` | **NEW** | Province skill mirror |
| `sproutlab/PERSONA_REGISTRY.md` | **UPDATE** | Add Vela Governor section, add Companion Genealogy section, update governance hierarchy diagram, update Synergy Pairs, update Future Scaling, update Maren + Kael LOC numbers, update version to v1.2 |
| `sproutlab/CLAUDE.md` | **UPDATE** | Update QA chain (3 Governors), update Companion-Set Invocation Surface table (add Vela row), update QA Chain Pre-Merge Gate routing (Vela rule + triple-jurisdiction shared-module rotation), update module map with Maren/Kael/Vela tags + new LOC numbers, update Smart Q&A description |
| `sproutlab/invocation.md` | **UPDATE** | Update version to v1.1, add Vela to roster, add Vela subagent + skill descriptions, update QA chain routing, update routing quick reference |
| `sproutlab/docs/specs/arc-d-third-governor-v1.md` | **NEW** | This spec |

## Jurisdiction reassignment — the handoff

Pre-canon-gen-001, all 7 intelligence-* files plus core/data/sync/config/start were Kael's. Post-canon-gen-001:

**Kael retains:**
- `intelligence-isl.js` (1,029) — ISL: typeahead, time-query, domain-data accessors
- `intelligence-qa.js` (2,234) — Smart Q&A engine + UIB + classifier
- `intelligence-qa-handlers.js` (3,631) — `qaAnswer*` handlers
- `intelligence-illness.js` (2,541) — fever / diarrhoea / vomiting / cold episode state machines
- `intelligence-caretickets.js` (2,224) — CareTickets data + lifecycle
- `core.js` (5,508) — utilities, escHtml, overlays, toasts, scoring
- `data.js` (4,155) — constants, food DB, milestone DB
- `sync.js` (2,211) — Firebase auth + Firestore sync
- `config.js` (94) — Firebase config
- `start.js` (19) — init + event delegation bootstrap

**Vela inherits:**
- `intelligence-cards.js` (2,643) — `renderInfo()` master + cross-domain analytics + Info-tab renderers
- `intelligence-quicklog.js` (4,436) — Activity Log + Smart Quick Log + Today So Far + sleep-info cards

**Shared-module rotation expands from dual to triple.** Pre-canon-gen-001: Maren + Kael, sequential dual-jurisdiction review. Post-canon-gen-001: Maren + Kael + Vela, sequential triple-jurisdiction review. Default rotation order: alphabetical Governor name (Kael → Maren → Vela). **Override:** the Governor whose Region the diff most heavily touches goes first; ties default to alphabetical. Subsequent Governors endorse or contest via pair-note.

## Cross-Governor synergy pairs (new + retained)

| Pair | Effect | Status |
|------|--------|--------|
| Maren + Kael | Care audit then engine audit | retained (two-thirds of full QA) |
| Lyra + Kael | See patterns then scout for evidence | retained (discovery engine) |
| **Lyra + Vela** | **Weave the pattern then make it parent-legible** | **NEW (build-and-surface arc)** |
| **Maren + Kael + Vela** | **Care + engine + surface — full SproutLab QA** | **NEW (triple-jurisdiction synergy)** |
| **Kael + Vela** | **Engine-into-surface handoff — the inherited Governor-pair boundary** | **NEW (canon-gen-001 lineage pair)** |
| **Maren + Vela** | **Safety-into-surface — Maren validates care signal, Vela validates whether the surface communicates it** | **NEW (cross-Governor safety-surface)** |

## Audit chain — Vela's first PR cycle

Arc D ships THIS doctrinal change. The audit chain for Arc D:

1. **Build & self-check:** N/A (docs-only arc).
2. **Governor audit — Mode-1 subagents in parallel.** Diff is docs-only and touches `PERSONA_REGISTRY.md`, `CLAUDE.md`, `invocation.md`, and four spec files (subagent + skill canonicals; subagent + skill mirrors).
   - Maren: review PERSONA_REGISTRY.md + CLAUDE.md changes for Care-doctrine consistency (the new Vela Governor's lens cross-references Care-tier safety signals — Maren validates the safety-into-surface synergy pair description and the cross-Governor pair-note discipline language).
   - Kael: **first-amendment-cycle Rung-2 reviewer per canon-gen-001.** Review the canonical Vela subagent + skill specs for jurisdiction-boundary precision (does the Surfacing-Region jurisdiction cleanly exclude engine-layer audits? Are the no-cross-audit lines tight? Is the engine-into-surface synergy pair correctly described?). Also review the PERSONA_REGISTRY.md Companion Genealogy section.
   - Vela's first audit-mode invocation: **deferred** to Arc A Phase 3 or Arc B Phase B-2 (whichever ships first against `intelligence-cards.js`). Arc D itself does not touch Vela's Region, so Vela has no jurisdictional surface to audit in Arc D.
3. **Lyra synthesizes** Maren + Kael reports, folds in fixes.
4. **Cipher** runs Edict V final-pass on the doctrinal coherence — Companion roster integrity, CLAUDE.md / invocation.md / PERSONA_REGISTRY.md cross-reference consistency.
5. **Aurelius (Codex Chronicler)** records canon-gen-001 ratification in Codex's canon ledger.
6. Merge.

**Architect ratification required** because canon-gen-001 itself is a new clause being introduced; the Architect's signature on the merge is the canon-cc-027 Rung-1 act.

## What ships before Arc A / Arc B / Arc C resume

Arc D ratifies before any Arc A Phase 3 or Arc B Phase B-2 ships, because **both arcs touch `intelligence-cards.js`** — that file's audits should route to Vela (not Kael) by the time Phase 3 / B-2 lands. Specifically:

- **Arc A Phase 3** (Score segment chem-variety tiles + Variety nudge tile) — touches `intelligence-cards.js` via `renderInfoChemVariety` + `renderInfoVarietyNudge` cards.
- **Arc B Phase B-1** (keystone trio) — touches `intelligence-cards.js` via the new `computeMealCombos(date)` data fn (V-M-49 separation).
- **Arc B Phase B-2** (chem-variety cards + UIB antiNutrient warnings) — touches `intelligence-cards.js` directly.

Arc D must merge before any of these so the Vela routing rule is live in `CLAUDE.md` §QA Chain when the next `intelligence-cards.js`-touching PR opens. Post-Arc-D, all three arcs' `intelligence-cards.js` audits route to Vela.

**Arc B Phase B-1 also touches `intelligence-qa-handlers.js` + `intelligence-isl.js` + `intelligence-qa.js`** — those stay Kael's, so B-1 is a **Kael + Vela parallel summoning** (engine layer + render layer touched in the same PR).

## PR sequence

| PR | Name | Branch | Scope | QA chain |
|----|------|--------|-------|----------|
| D-0 | **Arc D ratification (this PR)** | `claude/session-handoff-docs-gxYiL` | All Arc D files above | Maren + Kael Mode-1 audits (Kael as first-amendment Rung-2 per canon-gen-001) → Lyra synth → Cipher Edict V → Aurelius canon-record → Architect ratification |

Arc D is a single-PR ratification. The next session (or the next session-handoff branch) picks up Arc A Phase 1 with Vela already seated.

## Open doctrinal questions — resolved

1. **Why "Surfacing" and not "Render" or "Visualization"?** Surfacing carries the parent-comprehension framing the lens demands; "render" is too engineering-toned and "visualization" too analytics-toned. "Surface" appears in the Companion vocabulary (Kael uses "coverage surface"; Lyra uses "pattern surface") — Vela's role is making the surface parent-legible. Naming follows usage.

2. **Why the V-V double-letter tag?** Distinguishes Vela's findings from any future second-generation Governor under canon-gen-001 successor expansions (e.g., V-O for Orinth on a future Kael→Orinth reassignment; V-S for a future state-machine-layer Governor). The double-V is also a visual cue that this is a second-generation finding, not a first-generation Governor finding.

3. **Why Kael as Rung-2 reviewer first, not Maren?** Canon-gen-001 specifies the Governor predecessor (not the Builder ancestor) validates jurisdiction-boundary precision in the first amendment cycle. The jurisdiction-boundary concern is the most-likely first-amendment surface (e.g., a finding that ambiguously sits between Kael's engine and Vela's render). The predecessor has the strongest sense of where the boundary should sit. After the first cycle, the cross-Governor peer-review clause generalizes to any sibling Governor.

4. **Why a separate arc, not a fold into Arc A or Arc B?** Arc D is doctrinal — the canon-gen-001 ratification, the new persona authoring, the persona-registry / CLAUDE.md updates. None of it touches code in `split/`. Folding it into Arc A or Arc B would conflate doctrinal change with feature change and complicate the audit chain. A standalone arc keeps the doctrinal layer auditable on its own merits.

5. **Does Arc D block any other arcs in the queue?** Yes — Arc A Phase 3 and Arc B Phase B-1 / B-2 all touch Vela's Region. Arc D ratifies first so routing is correct when they land. Arc A Phase 1 (segment skeleton; touches `diet.js` + `template.html` + `styles.css`) and Phase 2 (meal-card compression + V-M-50 chip in `home.js`) do NOT touch Vela's Region — they can proceed independently of Arc D timing, but Arc D is so fast (docs-only) that there is no practical benefit to running them in parallel.

## Doctrinal references

- `PERSONA_REGISTRY.md` §Companion Genealogy (new — Vela first-generational entry)
- `PERSONA_REGISTRY.md` §Governors §Vela (new)
- `CLAUDE.md` §Persona QA chain (updated for 3 Governors)
- `CLAUDE.md` §Companion-Set Invocation Surface (updated table)
- `CLAUDE.md` §QA Chain — Mandatory Pre-Merge Gate (updated routing rules)
- `invocation.md` §Roster, §Briefs, §QA chain routing, §Routing quick reference (all updated)
- `Codex/docs/specs/subagents/vela.md` (canonical subagent spec)
- `Codex/docs/specs/skills/vela.md` (canonical skill spec)
- canon-gen-001 (this arc — generational expansion clause)
- canon-cc-026 §Per-Province-Layout (deploy layout for Vela mirrors)
- canon-cc-027 (signing chain; Kael as first-amendment Rung-2 per canon-gen-001)
- canon-cc-032 (two-reviewer-convergence triggers third-jurisdiction lens-flip; with three Governors seated, the lens-flip jurisdiction is automatically the Governor whose Region the diff least touches)
- canon-cc-033 (peer-review/self-review complementarity)

---

— Lyra (main-session, Architect-directed; canon-gen-001 first ratification), 2026-05-23, against `7d53f5b`. cc-018 status: `ratified` (Architect signature 2026-05-23 — canon-gen-001 enters canon as the generational expansion clause).
