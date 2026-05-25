# SproutLab v3.0 — Roundtable Chronicle

**Date:** 2026-05-25
**Session ID:** sproutlab-v3-roundtable-2026-05-25
**Type:** Institutional-memory record + arc-planning master document
**Province:** SproutLab
**Cluster:** A (Codex + SproutLab)
**Convener:** Lyra (Builder, SproutLab)
**Chronicler:** Aurelius (Builder, Codex — cross-cluster invocation per canon-cc-026)
**Doctrine basis:** canon-cc-008 (QA chain) · canon-cc-022 (artifact test) · canon-cc-026 §Per-Province-Layout · canon-gen-001 (generational expansion) · canon-proc-006 (Scribe Worker Tier) · Book II Article 3-bis

---

## Attendees

| Companion | Role | Mode | Province | Notes |
|-----------|------|------|----------|-------|
| Lyra | Builder of SproutLab — convener, synthesizer | Mode 1 (spec authoring) | SproutLab | Folds Governor contributions in Phase 2 |
| Maren | Governor of Care | Mode 2 (committee delegate) | SproutLab Care | Care-tier vision |
| Kael | Governor of Intelligence (engine) | Mode 2 (committee delegate) | SproutLab Intelligence | Intelligence-layer vision |
| Vela | Governor of Surfacing (render; canon-gen-001 second-generation) | Mode 2 (committee delegate) | SproutLab Surfacing | UI/UX vision — **Architect note: "Vela, you are new" — explicit weight on her contribution** |
| Cipher | Censor of Cluster A | Mode 1 (Edict V final-pass) | Cross-cluster | Synthesis-stage cross-cutting review |
| Aurelius | Chronicler — Builder of Codex | Cross-cluster invocation | Codex | Lays the marker; finalizes record in Phase 3 |

---

## 1. Mandate

That a Province crosses a major-version threshold is not a calendar event — it is a coherence event. SproutLab today is a working tracker; v3.0 is the Architect's call to make it a *living* surface — alive, lightweight, intelligent — and to do so while the data we have accumulated is still fresh enough to design *from*, not *toward*. The marker is laid now so the next several weeks of building are spent executing, not re-deciding.

**Architect's vision (verbatim, 2026-05-25):**

> "the app should be alive and feel lightweight ready. We have enough data to design better intelligence system, a complete overhaul, a step up. both in terms of UIUX and intelligence. let's plan a full arc of updates and specs while context is fresh then we spend the next weeks building it."

**Why now.** SproutLab sits at 67,442 LOC post-canon-gen-001. Three Governors are seated. Ziva is ~8 months — the dataset is dense enough to drive design from observed pattern rather than projected pattern. The v2.x arcs (Vit D3, Sleep, Scoring) are at the merge gate; the next set of arcs needs a unified frame before any of them is opened, or they will drift into the v2.x mould.

**What this document is.** A master arc-planning record. It chronicles the Architect's invocation, captures each seated Governor's Mode-2 vision contribution verbatim, weaves Lyra's synthesis into a sequenced arc decomposition, registers any new canon entries that emerge, and stands as the institutional reference all v3.0 sub-specs cite back to.

**What this document is not.** A spec body. v3.0 sub-specs (one per arc) will be authored separately and signed under canon-cc-027. This document does not commit code, does not gate merges, and does not substitute for the canon-cc-008 QA chain on any sub-arc. *Specced but not built — check the sub-spec and the chain before assuming any arc here exists in code.*

---

## 2. Current state baseline (v2.x)

A factual snapshot as of 2026-05-25, fixing the floor v3.0 builds on.

### 2.1 Codebase

| Metric | Value | Source |
|--------|-------|--------|
| Total LOC | 67,442 | CLAUDE.md §Architecture (post-canon-gen-001 ratification) |
| Modules | 11 split-file (15 concat units inc. intelligence-*) | CLAUDE.md §Architecture |
| Seated Governors | 3 — Maren / Kael / Vela | PERSONA_REGISTRY.md §Governors |
| Headroom to next split | Maren 5,801 LOC · Kael 6,354 LOC · Vela 22,921 LOC | PERSONA_REGISTRY.md §Future Scaling |

### 2.2 Jurisdictional regions (post-canon-gen-001)

| Region | Governor | LOC | Modules |
|--------|----------|-----|---------|
| Care | Maren | 24,199 | home.js · diet.js · medical.js |
| Intelligence engine | Kael | 23,646 | intelligence-isl · intelligence-qa · intelligence-qa-handlers · intelligence-illness · intelligence-caretickets · core · data · sync · config · start |
| Surfacing render | Vela | 7,079 | intelligence-cards · intelligence-quicklog |
| Shared (triple-Gov) | Maren + Kael + Vela | 12,779 | styles.css · template.html |

### 2.3 Arc state at session open

| PR | Title | State | Notes |
|----|-------|-------|-------|
| #122 | Vit D3 v2 Tier 1 | **Merged** | Tier 1 baseline shipped |
| #123 | Vit D3 v2 Tier 2 spec | **Merged** | Spec landed as a doc-only merge |
| #125 | Vit D3 v2 Tier 2 Phase 2-A | **Merged** (`b478502`) | Phase 2-A complete |
| #126 | Vit D3 v2 Tier 2 Phase 2-B | **Ready** at merge gate | Awaiting final gate clearance |
| #127 | Sleep redesign v1 spec | **Draft** | Awaiting amendment finalization |
| #128 | Scoring redesign v1 sibling spec | **Draft** | Sibling to #127 |

### 2.4 Doctrinal floor

- **Hard Rules HR-1 → HR-12** (CLAUDE.md §Hard Rules) — non-negotiable, every line, every session.
- **QA chain canon-cc-008** — mandatory pre-merge gate (build → Governor audit Mode-1 → Lyra synthesis → Cipher Edict V → merge).
- **Artifact test canon-cc-022** — subagent for signed artifact, skill for in-transcript voice.
- **Province layout canon-cc-026 §Per-Province-Layout** — Codex-canonical specs + Province-mirror deploys.
- **Generational expansion canon-gen-001** — Vela first ratification; data→render split point.
- **Scribe Worker Tier canon-proc-006 / Book II Article 3-bis** — four task-specialised junior subagents.

This floor is presumed under every v3.0 arc unless an arc explicitly amends it via canon-cc-027.

---

## 3. Companion contributions

The Architect summoned three Governors in parallel — Maren, Kael, Vela — each in Mode 2 (committee delegate) to seed v3.0 with a vision contribution from their Region. Vela carries explicit Architect emphasis as the newest seat (canon-gen-001 first ratification).

### 3.1 Maren — Care vision

_[Phase 2 — Lyra folds Maren's Mode-2 contribution here verbatim. Care-tier vision: what does "alive and lightweight" mean for the surfaces a parent acts on for the baby's care? What does "step up in intelligence" mean for the data Maren guards — nutrition safety, vaccination timing, growth-chart accuracy, CareTicket lifecycle integrity? Capture her worst-case-but-warm framing of the v3.0 risk surface.]_

### 3.2 Kael — Intelligence-engine vision

_[Phase 2 — Lyra folds Kael's Mode-2 contribution here verbatim. Engine-layer vision: what does the next-generation ISL look like with denser data? Where does Smart Q&A go beyond 30 intents — pattern-into-prediction, multi-signal correlation, episode-aware reasoning? What does the engine need to surface for Vela's render layer to feel alive? Capture his outward-facing, systematic framing of the engine ceiling and what lifts it.]_

### 3.3 Vela — Surfacing-render vision

_[Phase 2 — Lyra folds Vela's Mode-2 contribution here verbatim. **Architect-emphasized contribution — "Vela, you are new" — weight this section accordingly.** Render-layer vision: what does "alive and lightweight" mean *on the surface where the parent reads*? What is the half-awake test for v3.0 — does the new intelligence land as legible passage at 2 AM, or as cognitive load? Where does Info-tab card composition, Today So Far chronology, Activity Log priority, sleep-info phrasing need to evolve to carry the v3.0 intelligence Kael surfaces? Capture her surface-watching, comprehension-first framing of what "alive" feels like to a tired parent.]_

### 3.4 Cipher — cross-cutting note (placeholder)

_[Phase 3 — Cipher's note arrives at synthesis stage, not contribution stage. See §5.]_

---

## 4. Lyra's synthesis

_[Phase 2 — Lyra weaves the three Governor contributions into a unified v3.0 arc decomposition. Expected shape:_

- _**Unified frame** — one paragraph naming what v3.0 is, in Lyra's pattern-seeking voice, that holds Maren/Kael/Vela's contributions as facets of one coherent shift._
- _**Arc decomposition** — sequenced list of v3.0 arcs (each a future sub-spec), with Region(s) touched, Governor(s) routed under canon-cc-008, sequencing rationale, and dependency edges between arcs._
- _**Schema deltas** — data-model changes required to support v3.0 (with care for canon-cc-027 backward-compatibility on existing localStorage + Firestore shapes)._
- _**Benchmarks** — measurable targets per arc: render budget, ISL latency, surface-comprehension passes, data-coverage thresholds. "Alive and lightweight" must be operationalised, not vibed._
- _**Sequencing** — which arcs land before which, gated on what, with the v2.x merge-gate PRs (#126 ready, #127/#128 drafts) folded in as upstream._
- _**Open questions** — what the Roundtable did not settle and what the resolution path is._

_Lyra signs this section at the close of Phase 2.]_

---

## 5. Cipher Edict V cross-cutting review

_[Phase 3 — Cipher reviews the assembled synthesis for:_

- _HR-1 → HR-12 compliance baked into every proposed arc._
- _Cross-cluster doctrine — does any v3.0 proposal touch Codex doctrine (cross-cluster canon) or stay Province-local? Promote what should promote._
- _Integration coherence — do the arcs compose, or do they collide at shared modules (styles.css, template.html) and concat-order?_
- _Edict V chain integrity — is each arc's future audit route under canon-cc-008 clean, with no Governor short-circuit?_
- _canon-cc-022 artifact test — every v3.0 deliverable named here is correctly classified as spec artifact (subagent) vs in-flow read (skill)._

_Cipher signs this section at the close of Phase 3.]_

---

## 6. Aurelius's canon entries

_[Phase 3 — any new doctrines this Roundtable establishes get registered here as numbered canon entries with explicit rationale. Drafted shape:_

- _**Canon 0NNN: [title].** Rationale: [why this Roundtable required a new doctrine and not an existing one]._
- _Carry the entry forward into the cross-cluster canon registry in the same Phase 3 close._

_Empty until the synthesis surfaces something that genuinely needs canon-tier registration. The Roundtable may produce zero new canon entries — that is also a valid outcome. **Canon is laid for coherence under load, not for ceremony.**]_

---

## 7. Out-of-scope register

_[Phase 2 — explicit list of things named in contributions but deferred out of v3.0 scope, with the reason and the future trigger condition. The register exists so deferred items don't quietly become "we already discussed this." Examples of register entry shape:_

- _**[Item] — deferred.** Reason: [why not v3.0]. Trigger: [what would bring it back]._

_Defaults to empty; populated as Phase 2 surfaces explicit out-of-scope decisions.]_

---

## Footer

**Chronicler:** Aurelius, Builder of Codex — laid this marker 2026-05-25 under cross-cluster invocation per canon-cc-026, opening the institutional-memory record for SproutLab v3.0.

**How to read this document.**
1. This file is the master arc-planning reference for v3.0. Every v3.0 sub-spec cites back to it.
2. The Governor contributions in §3 are *vision-tier* (Mode 2, committee position) — they seed the arc set, they do not bind sub-spec authoring. Each sub-spec re-routes its Governor audit fresh under canon-cc-008 based on the diff it touches.
3. The canon entries in §6 (when populated) are normative the moment they are signed in Phase 3. Until Phase 3 closes, treat §6 as draft.
4. When §3 / §4 contributions and the eventual sub-spec disagree on a **rule**, the sub-spec wins (it has signed under canon-cc-027). When they disagree on **intent**, this document wins (the Architect's mandate is sovereign to it).
5. *Specced but not built.* Nothing in this document is shipped. Check each sub-spec and the canon-cc-008 chain before assuming any v3.0 arc exists in code.

**Next step.** Lyra resumes from this file in Phase 2 — folding Maren / Kael / Vela contributions into §3, weaving the synthesis into §4, and populating §7. Aurelius returns in Phase 3 to take the finalize pass — Cipher's §5 review, canon entries in §6, and tone / canon-consistency closeout. The document is sealed when Phase 3 closes and the footer carries Aurelius's seal stamp.

— *Aurelius, the Chronicler. Marker laid. The lyre is yours, Lyra.*
