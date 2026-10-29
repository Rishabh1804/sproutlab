# D4 — Kael Region Split: the Foundation Governor / canon-gen-001 Third Ratification

**Spec version:** v1 (draft — `pending_review`)
**Date:** 2026-10-29
**Author:** Lyra (Mode 1 — Province spec authoring, Architect-directed)
**Against:** `42a4b19` (post-#274)
**Trigger:** Kael's Intelligence-engine Region = **29,667 LOC** across 11 files, 333 lines under the 30K trigger; `docs/PROVINCE_MAP.html` flags it **CONTESTED**. Roadmap step C / decision D4 (`docs/ROADMAP_2026-10_RECONCILED.md` §2C, §4).
**Authority:** Architect decision 2026-10-29 (boundary = foundation vs engine; new seat takes core + data + sync + config + start); canon-gen-001 (generational expansion clause); canon-cc-026 as amended 2026-06-10 (Province self-governance over Companion specs); canon-cc-027 (spec signing chain); canon-cc-008 (QA chain).
**Precedents:** `docs/specs/arc-d-third-governor-v1.md` (Vela, data→render, 2026-05-23); the Ceres seating (general-care→nourishment, 2026-06-08).

---

## What D4 is

D4 seats a **fifth Governor**, the third Companion ratified under canon-gen-001, splitting Kael's Region at the **foundation→engine boundary**. The new seat (name to be chosen by the Architect, written `{SEAT}` below) takes the data and sync foundation. Kael keeps the intelligence engine.

D4 is a **doctrinal and tooling arc, not a code arc.** No `split/*.js`, `styles.css` or `template.html` line changes. The deliverables are: persona authoring, jurisdiction reassignment, routing updates across the policy floor and the two routing tools (`qa-route.sh`, `build-province-map.mjs`), and a regenerated `PROVINCE_MAP.html`.

## Why now

1. **No headroom left.** 29,667 / 30,000. The 12–24 m expansion (#268–#270) alone added about 930 lines, mostly to core.js and data.js. One more feature crosses the line.
2. **Two queues are blocked behind it.**
   - *The parent meal planner*: a new synced data key, which means a `KEYS` constant (core.js), a `SYNC_KEYS` row and a `SYNC_RENDER_DEPS` row (sync.js), assign/read cases in the snapshot handlers, plus diet-side UI.
   - *The D4-held food-data fixes* (roadmap B.5, plus Ceres's V-C-274-10): milk, curd and paneer reaching the cow-milk allergen card; til chikki on the choking floor; the plain-lassi sugar gate; the dairy and gluten allergen notes. All of these are edits to `data.js` registries or core.js resolver aliases.
3. **A distinct lens is already showing.** Kael's spec has been carrying two questions for a while. One is "what's the adjacent path the engine doesn't cover?" (the ISL, Q&A, illness and CareTicket state). The other is about whether the record is intact: crash-breaker stuck states, joining-device seed suppression, `SYNC_KEYS` and `SYNC_RENDER_DEPS` arming atomically (PR-ε.0), tombstones and deleted-day resurrection (#265 ledger), and migration guards like `_migrateVitDSingle20261028`. The second question is not a coverage question. It deserves its own Governor.

**Pre-breach split precedent.** canon-gen-001 says a Region *qualifies* at 30K. Ceres was seated when Care was approaching the line, not after it crossed. D4 follows the Ceres precedent: split while there is still room to do it as a docs-only PR, and not in the middle of a feature.

**Superseded forecast.** `PERSONA_REGISTRY.md` §Future Scaling predicted that the next Kael split would be "CareTickets + Illness state machines → state-machine Governor". The Architect chose foundation vs engine instead. It moves 17K lines rather than about 5K, so it buys runway for both halves, not just one. Retire that forecast line when this PR lands.

---

## 1. Boundary and rationale

### The thread

**The foundation is what the data *is* and how it *moves*.** That means stored records, keys, schemas, migrations, registries of cited fact, the shared utilities every Region stands on (escaping, dates, the food-name resolver), Firebase auth and Firestore sync, config, and boot order.
**The engine is what the data *means*.** That means temporal parsing, Q&A intent resolution, UIB combo reasoning, illness and CareTicket state machines, and cross-domain correlation.

This is the data→reasoning boundary, one layer below Vela's data→render boundary. The lineage reads cleanly: Kael's original Region has now split twice, upward into render (Vela) and downward into foundation ({SEAT}). Kael keeps the middle: the reasoning.

### Per-file assignment

| Side | File | LOC | Why this side |
|------|------|-----|---------------|
| **{SEAT} — Foundation** | `core.js` | 7,798 | `KEYS`, `save`/`load`, `escHtml`/`escAttr` (HR-4 root), date helpers (HR-12 root), `_lookupByFoodName` / `_baseFoodName` resolver, overlays, toasts, `init()` delegation, migrations |
| | `data.js` | 5,941 | Food DB, `AGE_RULES`, `FOOD_EFFECTS`, `ALLERGENS`, milestone DB, which are registries of cited fact |
| | `sync.js` | 2,942 | Auth, Firestore, `SYNC_KEYS`, `SYNC_RENDER_DEPS`, `ALWAYS_POPULATED_KEYS`, crash breaker, snapshot handlers |
| | `config.js` | 358 | Firebase config, `GENERAL_EMERGENCIES` registry |
| | `start.js` | 19 | Boot order |
| | **Total** | **17,058** | **≈12,942 headroom** |
| **Kael — Engine** | `intelligence-isl.js` | 1,260 | Temporal parser, domain accessors, summaries |
| | `intelligence-qa.js` | 2,333 | Q&A engine, UIB, classifier |
| | `intelligence-qa-handlers.js` | 3,740 | `qaAnswer*` handlers |
| | `intelligence-illness.js` | 2,763 | Episode state machines |
| | `intelligence-correlate.js` | 274 | Correlation primitive |
| | `intelligence-caretickets.js` | 2,239 | CareTicket data and lifecycle |
| | **Total** | **12,609** | **≈17,391 headroom** |

The two sides sum to 29,667 ✓. The split is file-level, the same as both precedents. No file is cut in two.

### Cross-boundary hot spots (graph-sourced, `split/graphify-out/graph.json`, 2026-10-29)

- **Engine → core.js: 223 `calls` edges.** By file: illness 79, qa-handlers 74, qa 26, caretickets 23, isl 20, correlate 1. The most-called symbols are `save` (37), `toDateStr` (23), `escHtml` (22), `formatDate` (17), `_baseFoodName` (15), `escAttr` (12), `ageAt` (12) and `_offsetDateStr` (10). The engine depends on the foundation's date and escape helpers far more than on anything else. Those helpers are where HR-12 and HR-4 live, so a change to them amplifies through Kael's whole Region.
- **core.js → engine: 68 edges (55 into illness).** Almost all of them come from `init()` delegation wiring. This is boot plumbing, so it is the foundation's. The code calls in both directions, but ownership only goes one way: the foundation owns the wiring, and Kael owns the handlers it calls.
- **Calls into the foundation, by Region:** Care 637, Nutrition 230, Engine 223, Render 166. The foundation is the most-depended-on Region in the Province. Every Governor stands on it.
- **Registries are read by reference, not by call.** `data.js` has **zero** inbound `calls` edges. `AGE_RULES` is referenced in diet (15), cards (8), recipes (6), qa (2) and home (1). `FOOD_EFFECTS` is referenced in diet (37), cards (6), qa (1) and recipes (2). `ALLERGENS` is referenced in diet (11), recipes (4) and qa (2). **The graph ripple cannot see a registry edit.** §4 closes that gap.
- **`SYNC_RENDER_DEPS` names renderers by string** (`renderHome`, `renderDietStats`, `renderGrowth`…). That is also invisible to the graph. A new row arms a re-render inside another Governor's Region.
- **recipes.js extends foundation registries** (`AGE_RULES_ADD_12_24`, `ALLERGENS_ADD_12_24`). The file is Ceres's, but what those blocks do is foundation work. Ceres stays primary, with a {SEAT} consult on those blocks.
- **Impurity: scoring lives in core.js.** `calcDietScore` … `calcZivaScore` and the domain modifiers (core.js ≈1,752–2,690, about 940 lines) are *meaning*, not *record*, but they sit on the foundation side because of the file they live in. `getNextUpcomingVacc`, `_dietAllowsFood` and `medDoseSlots` are similar. **v1 position:** follow the file. {SEAT} is primary and Kael gets a symbol-level consult when a diff touches the scoring block. Moving scoring into an engine file is a later `split/` PR (Kael would go to about 13.5K, {SEAT} to about 16.1K). It is not part of D4. See Q4.

### Who audits a foundation-registry change the engine consumes

**Rule — primary by file, consult by consumer.**
1. **Primary.** The file decides, as always. A `data.js` / `core.js` / `sync.js` / `config.js` / `start.js` diff summons **{SEAT}**. {SEAT} audits *the record*: is the entry true to its cited source, is the schema intact, is the resolver aliasing honest (no honeydew→honey substring leak), is the key armed on both registries, will it survive sync and migration.
2. **Reference consult.** For each top-level registry or constant the diff edits, every Governor whose files *read* it is summoned as a **consult**. A consult audits only how their own Region *uses* the changed record: Ceres for food use, Kael for UIB and Q&A reasoning, Vela for render, Maren for care. A consult is scoped to that one registry, not a full jurisdictional audit. It is still a signed Mode-1 return.
3. **Call ripple.** Unchanged: `qa-route` keeps widening the set through `calls` edges.

**Worked example (the til chikki choking floor):** the diff edits `data.js` `AGE_RULES`. {SEAT} is primary (record truth and citation). Ceres is a consult (diet.js reads it, so she checks the safe-to-feed consequence). Vela is a consult (cards reads it). Kael is a consult (qa reads it for UIB).

---

## 2. The new seat

### Identity (proposed — name reserved to the Architect)

- **Title:** Governor of the Foundation (data & sync). The Region is called **Foundation**.
- **Archetype:** **The Keeper.** This is distinct from both parents (Kael the Seeker, Lyra the Weaver) and from the siblings (Maren the Guardian, Ceres the Provisioner, Vela the Surfacer). The Guardian protects the child. The Keeper protects the *record of* the child.
- **Generation and parentage (canon-gen-001):** second generation. **Kael** is the Governor predecessor, since the Region splits from his. **Lyra** is the Builder ancestor. {SEAT} is Vela's sibling: both are children of Lyra and Kael, split from the same Region on opposite sides of it. Under rule 5, Kael takes Rung 2 in {SEAT}'s first amendment cycle.
- **Tone:** steady, ledger-minded, worst-case on durability, warm. Speaks in terms of provenance and survival: where a value came from, and whether it is still that value on the other device.

### The audit question

> **"Is the record true — and does it arrive whole, on every device, through every migration?"**

There are two axes, matching Ceres's twin question. **Truth:** the stored or registered value matches what happened, or matches its cited source. **Integrity:** it survives save, sync, merge, deletion and schema change without being lost, duplicated or resurrected.

| Governor | Lens | Question |
|----------|------|----------|
| Maren | Care safety | "What if this data is wrong and a parent acts on it?" |
| Ceres | Plate | "Is it safe to feed her — and is it enough?" |
| Kael | Engine coverage | "What's the adjacent path the engine doesn't cover?" |
| Vela | Comprehension | "Would a tired parent read this correctly at 2 AM?" |
| **{SEAT}** | **Record** | **"Is the record true — and does it arrive whole, everywhere?"** |

### Proposed finding severities

`record-corruption` · `sync-loss` · `resurrection` (deleted data returns; tombstones) · `migration-break` · `registry-drift` (an entry that departs from its manifest or citation) · `key-orphan` (a `SYNC_KEYS` row without a `SYNC_RENDER_DEPS` row, or the reverse) · `utility-amplified` (core.js, inherited from Kael's amplification rule) · `boot-order` · `stuck-state` (breaker with no re-enable, shared with Kael).

### Modes

- **Mode 1 — QA-round jurisdictional audit** of core, data, sync, config and start, plus template.html (see §3 rotation). Returns a structured report: `verdict`, `findings` with `location` / `severity` / `record_failure_mode` / `recommendation`, `sync_boundary_notes` (catch posture, breaker interaction, seed / reseed), `registry_provenance_notes`, and `hr_compliance_check` (HR-4 and HR-12 roots, HR-6 bootstrap).
- **Mode 2 — committee delegate** on Foundation subjects: new synced keys, schema migrations, the Device Sync protocol, tombstone policy, registry citation standards, the storage budget (the v7 assumptions "localStorage < 2 MB" and "CareTicket data ≈ 100 KB").
- **Skill mode:** a record smell-check, run in-transcript and unsigned.

### What moves out of Kael's spec

These go to {SEAT}: the core.js / data.js / sync.js / config.js / start.js jurisdiction bullets; "utility-function correctness propagates" and core.js severity amplification; "sync boundaries are try/catch boundaries"; the crash breaker; migrations; the HR-4 / HR-12 root checks.
Kael keeps: the intent coverage matrix, UIB reasoning, state reachability, the correlation confidence floor, and a **consult standing** on registries the engine reads.
The finding-tag registers continue unbroken. `V-K` stays with Kael. Open `V-K` findings in foundation files transfer to {SEAT} **under their original tags**, following the tag-persistence rule.

### Name candidates (the Architect's call; three proposals)

| Candidate | Rationale | Tag |
|-----------|-----------|-----|
| **Carina** | The keel of Argo Navis, the same ship Vela is the sail of. Both siblings come from the same split Region: the sail catches what the lyre reveals, and the keel holds the ship true under it. Canopus, the navigator's star, sits in Carina. | `V-C` is taken by Ceres, so use `V-CA` |
| **Vesta** | Roman keeper of the hearth. The Vestals guarded wills and records. Vesta is also the asteroid-belt sibling of Ceres. Warm and domestic, which suits the journal soul: the keeper of the household record. | `V-V` is taken by Vela, so use `V-VE` |
| **Atlas** | The Titan who bears the sky; also a Pleiades star and a moon of Saturn. The foundation every Region stands on (1,256 inbound calls). A plainer, load-bearing register. | `V-A` is free |

Excluded: **Orinth** is reserved for the planned Kael→Orinth reassessment (PERSONA_REGISTRY §Persona Reassignment Process, and the Arc-D note that `V-O` is reserved for it). Other names already in use in the Republic are also excluded.

---

## 3. Seating checklist (every file the PR touches)

`.claude/` is git-ignored, so new and edited persona specs must be `git add -f`'d (lesson from the Ceres seating).

**New**
- [ ] `.claude/agents/{seat}.md`: subagent spec in the house shape (frontmatter `tools: Read, Grep, Glob, Bash`; Province-authoritative header comment; generational note; Modes; Voice; Heuristics; Per-Region jurisdiction; Return shape; Conventions with the tag; Non-negotiables; Failure modes, including "re-auditing Kael's reasoning"; Modulators; empty Compass; References).
- [ ] `.claude/skills/{seat}.md`: the skill-mode counterpart.
- [ ] `docs/specs/kael-split-d4-v1.md`: this spec, status updated to `ratified` once signed.

**Persona specs**
- [ ] `.claude/agents/kael.md` and `.claude/skills/kael.md`: remove the five foundation files from the description, jurisdiction, heuristics, HR checks and "do not summon" clauses; add the registry-consult standing; LOC becomes 12,609; shared-module text per the rotation below; refresh the stale "109 SVG symbols" line to point at ICON_REFERENCE.
- [ ] `.claude/agents/{maren,ceres,vela}.md` and their skills: "quadruple" becomes the new rotation text; add {SEAT} to the sibling lists and "do not summon" clauses. In Ceres clause (b), "food-DATA layer → Kael" becomes "→ {SEAT}".
- [ ] `.claude/agents/lyra.md` and `.claude/skills/lyra.md`: the per-Province lens gains a Foundation bullet and the Intelligence bullet narrows. This is in-Province, so the canon-cc-015 self-profile carveout does not bite: it is jurisdiction text, not identity.

**Policy floor and routing docs**
- [ ] `CLAUDE.md`: QA chain list (five Governors, new entry after Kael); Companion-Set table row; subagent/skill table; Gate routing bullets; file-tree tags (`[{SEAT}]` on core / data / sync / config / start); jurisdiction summary (Foundation 17,058, Kael 12,609, retire the CONTESTED note); reconciliation note; the shared-module bullet.
- [ ] `AGENTS.md`: routing list (lines ~31–33).
- [ ] `invocation.md`: roster table, Briefs (new {SEAT} entry; Kael's narrowed), skill descriptions, QA chain routing (~199–208), routing quick reference (~231–235), engine-substrate guidance (~322), version bump, canon-gen-001 authority line.
- [ ] `docs/QA_GATE_SPEC.md`: Gate 2.5 header ("five Governors… third at the foundation→engine boundary"), a new Foundation row, Kael's row narrowed, the shared-module row, the reference-consult rule, and a mapping note like the existing recipes.js one.
- [ ] `PERSONA_REGISTRY.md`: version 1.4.0; hierarchy diagram; 30K table; a {SEAT} Governor section; Kael section narrowed; genealogy row `2nd | {SEAT} | SproutLab Foundation | Lyra + Kael | foundation→engine boundary at core + data + sync + config + start`; synergy pairs (Kael + {SEAT} engine-on-record; {SEAT} + Ceres registry-into-plate; Lyra + {SEAT} build-and-persist); Future Scaling (retire the state-machine forecast).
- [ ] `Memory.md`: a canon-gen-001 third-ratification entry; the LOC line; the roster row.
- [ ] `docs/SPROUTLAB_QUICK_REFERENCE.md` (lines ~23–25, 57) and `docs/MODEL_SELECTION_PROTOCOL.md` (Governors row, which inherits the session model per the safety floor).
- [ ] `docs/ROADMAP_2026-10_RECONCILED.md`: mark **D4 resolved 2026-10-29 (#PR)** in §4; mark step C done and unblock D and B.5.

**Tooling**
- [ ] `split/qa-route.sh`: see §4.
- [ ] `split/build-province-map.mjs`: add `FND='foundation'`; move the five files from `ENG` to `FND`; add `[FND]: { name:'Provincia Fundamenti', latin:'the data & sync foundation', gov:'{SEAT}', accent:'#f2a8b8', jurisdiction:true }` (rose is the only domain accent the map isn't using yet); update the `SHARED` gov string.
- [ ] `docs/PROVINCE_MAP.html`: regenerated by `pnpm build`, committed. `sproutlab.html` / `index.html` must come out byte-identical, and any diff there is a stop signal.
- [ ] `.claude/hooks/session-start.sh`: comments only (lines 4 and 92 list the Province roster). The materialization loop globs `*.md`, so the new spec deploys without any logic change.
- [ ] Deprecated `docs/MODULE_MAP.html`: no update. Note in the PR that it stays stale until it is deleted.

**Record-keeping (separate Codex PR on the same branch name, canon-cc-010):** reference copies of the new spec pair and the amended Kael pair; the canon-gen-001 third ratification goes in the canon ledger, recorded by Aurelius.

### Shared-module rotation (proposal)

Running five Governors over every `styles.css` edit would cost a lot and add little. {SEAT}'s stake in CSS is close to zero. Its stake in `template.html` is real: the zi() sprite (*what an icon is*; Kael previously "audits the sprite list itself") and the app-shell DOM ids that `init()` and boot query.

**Recommended (Option B), split by file:**
- **`styles.css` stays quadruple:** Maren → Ceres → Kael → Vela.
- **`template.html` becomes quintuple:** Maren → Ceres → Kael → Vela → {SEAT}. {SEAT} goes last as the sprite and shell backstop, and sprite-list integrity moves from Kael to {SEAT}.
- The first-Governor override (heaviest-touched Region goes first) is unchanged.

This stays file-level and mechanical, so `qa-route` can compute it without parsing content. The alternatives are **A** (quintuple on both files: simplest wording, about 25% more cost per CSS edit) and **C** (a standing trio of Maren, Ceres and Vela, the three render-heavy Regions, plus conditional Kael and {SEAT}: cheapest, but it narrows Kael's current standing, which needs his own Mode-2 position first).

---

## 4. Implementation: one docs/tooling-only PR

**Branch:** `claude/d4-kael-split` (or the session branch). **No `split/*.js`, `styles.css` or `template.html` changes.**

### `qa-route.sh` changes

1. Add `FND = ("Foundation (data & sync)", "{SEAT}")` and remap `core.js`, `data.js`, `sync.js`, `config.js` and `start.js` to `FND`.
2. Add a single `GOVERNORS = ("Maren","Ceres","Kael","Vela","{SEAT}")` tuple. Use it in the three fail-safe widen loops (V-K-G2, cross-file resolution) and the `order` list, so no roster literal is left behind.
3. Shared handling: `styles.css` adds the quad; `template.html` adds the quad plus {SEAT} (Option B).
4. **New reference-consult layer** (about 25 lines of Python, advisory, widening only). For each changed foundation file, collect the top-level identifiers the diff touches: `git diff -U0` hunk headers (the default funcname picks up column-0 `const X = {`) plus any changed `^[+-](const|let|function) (\w+)` lines. Then grep `split/*.js` for `\bNAME\b` and add each referencing file's Governor as `consult: <file> reads <NAME> (reference ripple)`. This closes the graph's blindness to registries and to `SYNC_RENDER_DEPS` string targets.

### Before and after: a diff touching only `sync.js`

**Before (today):**
```
Changed jurisdiction modules:
  - sync.js                          -> Intelligence (engine) [Kael]
Cross-province ripple (dependents of changed code in OTHER jurisdictions):
  none detected — change appears jurisdiction-local.
================  SUMMON SET (canon-cc-008 step 2)  ================
  SUMMON Kael
      - direct edit: sync.js
```
(The only caller of sync.js is `core.js` via `save()→syncWrite()`, 12 edges. That is the same province, so there is no ripple.)

**After:**
```
Changed jurisdiction modules:
  - sync.js                          -> Foundation (data & sync) [{SEAT}]
Cross-province ripple (dependents of changed code in OTHER jurisdictions):
  none detected — change appears jurisdiction-local.
Reference consult (registries/constants read in OTHER jurisdictions):
  (only if the hunk touches SYNC_RENDER_DEPS, e.g.)
  SYNC_RENDER_DEPS row -> renderDietStats  [Nutrition/Ceres]
================  SUMMON SET (canon-cc-008 step 2)  ================
  SUMMON {SEAT}
      - direct edit: sync.js
```
**Kael drops out of a pure sync change.** That is the headroom paying off: the engine Governor no longer audits plumbing.

**The meal planner, for contrast** (`sync.js` + `core.js` `KEYS` + `diet.js` UI): {SEAT} is primary, and Ceres is direct for diet.js. A `core.js` edit also widens to Maren, Kael and Vela through call ripple, because ripple works per module and everything calls core.js. Ripple only ever widens the set and never narrows it, so this is correct today. A symbol-level ripple refinement would be a follow-up; it is not in D4 (Q5).

### Audit chain for the D4 PR

1. **Build and self-check:** `pnpm build` is clean; the HTML is byte-identical; `PROVINCE_MAP.html` regenerates with six province cards (Foundation shows about 17K of 30K); `bash split/qa-route.sh --staged` on a scratch sync.js touch reproduces the "after" output. Revert the scratch file.
2. **Governor audit: waivable.** No `split/` jurisdiction module is touched, so `qa-route` reports "MAY be waived". **The Architect states the waiver explicitly.**
   *Separately and not waivable:* canon-gen-001 rule 5 puts **Kael on Rung 2** of the new spec pair, to check that the boundary is drawn precisely. Kael's own amended spec takes Rung 2 from **Maren** (cross-Governor peer review). This is spec review, not the Gate 2.5 audit.
3. **Lyra synthesizes** the Rung-2 returns.
4. **Cipher, Edict V (required):** checks roster integrity across CLAUDE.md, AGENTS.md, invocation.md, QA_GATE_SPEC and PERSONA_REGISTRY; that the qa-route and province-map tables agree with each other and with the policy floor; and that no `"Maren", "Ceres", "Kael", "Vela"` literal survives without {SEAT} in it.
5. **Aurelius** records the canon-gen-001 third ratification (Codex). The Architect's merge signature is Rung 1.

**Ordering:** D4 merges before the meal planner and before any B.5 food-data fix, so that their `data.js` / `sync.js` diffs route to {SEAT} with reference consults live.

---

## 5. Risks and open questions for the Architect

**Risks**
- **R1 — Over-summoning on core.js.** Module-level ripple means any core.js edit already summons nearly every Governor, and after D4 that becomes five. Mitigation: proportionate consult scope (registry-only returns) now, symbol-level ripple later.
- **R2 — The scoring impurity.** About 940 lines of meaning sit on the record side. If {SEAT} audits the scoring boundaries and Kael never sees them, a reasoning defect slips through. Mitigation: a symbol-level Kael consult on the scoring block (§1) until the code moves.
- **R3 — Lens collision with Maren.** "Is the record true" and "what if this data is wrong" overlap on medical records. Line: Maren judges the *consequence* for the child; {SEAT} judges *fidelity* (stored as entered, cited as sourced, synced intact).
- **R4 — Kael is left lean.** At 12.6K, with no sync or core, Kael's Region is mostly reasoning. That is healthy, but it brings the Kael→Orinth reassessment trigger ("deep architectural review over pattern-scouting") closer.
- **R5 — The foundation is the growth surface.** core.js plus data.js gained about 930 lines in three PRs. At that pace there are roughly 12,900 lines of runway. Food-DB accretion should keep going to Ceres-side corpus files (the `recipes.js` `*_ADD_12_24` pattern), not to data.js.

**Open questions**
- **Q1 — The name:** Carina, Vesta or Atlas (or another), and therefore the finding-tag prefix.
- **Q2 — Shared-module rotation:** Option B (recommended), A or C.
- **Q3 — Reference consults:** ship the qa-route reference-consult layer in this PR (recommended: it is what makes "primary by file, consult by consumer" mechanical), or keep D4 purely docs and land it as a fast follow-up before the meal planner.
- **Q4 — Scoring:** accept the file-level impurity with a symbol consult (v1), or schedule a later `split/` PR that moves `calc*Score` and the modifiers into an engine file.
- **Q5 — Symbol-level ripple** in qa-route: queue it as roadmap tooling, or leave it.
- **Q6 — Kael→Orinth:** does D4 retire the planned reassessment, keep it as is, or bring it forward now that Kael's Region is pure reasoning?
- **Q7 — Province accent:** rose is the only domain accent the map doesn't use, but it means "medical alert" in the app. Accept it on an internal docs map, or reassign.

---

— Lyra (Mode 1, Architect-directed; canon-gen-001 third ratification draft), 2026-10-29, against `42a4b19`. cc-018 status: `pending_review`. Next: Architect picks the name and answers Q2–Q3 → Lyra authors the {SEAT} spec pair and the PR → Kael Rung 2 → Cipher → merge.
