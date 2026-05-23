# Diet Tab Rework — Session-Arc Journal

**Arc name:** Diet Tab Rework v1
**Start date:** 2026-05-23
**Builder:** Lyra (The Weaver) — main session + Mode-1 subagent
**Scope:** Two parallel arcs. **Arc A:** Information-architecture rework of the Diet sub-tab. Touches `split/diet.js`, `split/template.html`, `split/styles.css`; possibly `split/core.js` for sticky-state helper. **Arc B:** Intelligence Layer Upgrade. Touches the seven `split/intelligence-*.js` files, `split/data.js` (food-DB consumers), possibly `split/core.js`.
**Branch convention:** `claude/sproutlab-diet-rework-pN` (N = 0..6)
**Specs:** `docs/specs/diet-rework-v1.md` (Arc A) · `docs/specs/isl-upgrade-v1.md` (Arc B) — both pending_review (cc-018); Wave 2 audits complete; awaiting Architect ratification.
**PR:** [#113](https://github.com/Rishabh1804/sproutlab/pull/113) (draft, Phase 0 docs-only, arc-pair)
**Authority chain:** CLAUDE.md §QA Chain · canon-cc-008 · canon-cc-018 (spec lifecycle) · canon-cc-022 (artifact test)

---

## Phase tracker

| Phase | Name | Branch | PR # | Status | Build | Maren | Kael | Cipher | Aurelius | Notes |
|-------|------|--------|------|--------|-------|-------|------|--------|----------|-------|
| 0 | Spec authoring | claude/sproutlab-diet-rework-p0 | #113 | Wave 2 complete | waived (docs-only) | ✓ V-M-47..54 | ✓ V-K-49..57 | ✓ pass-w/fixes | ✓ chronicling-ready | Awaiting Architect ratification |
| 1 | Segment shell | claude/sproutlab-diet-rework-p1 | — | not started | — | — | — | — | — | Zero-loss refactor |
| 2 | Today segment | claude/sproutlab-diet-rework-p2 | — | not started | — | — | — | — | — | Meal-card compression, skip icon-toggle |
| 3 | Score segment | claude/sproutlab-diet-rework-p3 | — | not started | — | — | — | — | — | Dead-data inventory pending |
| 4 | Insights segment | claude/sproutlab-diet-rework-p4 | — | not started | — | — | — | — | — | Expand-by-default accordions |
| 5 | Library segment | claude/sproutlab-diet-rework-p5 | — | not started | — | — | — | — | — | Foods Introduced compaction + quick-add integrate |
| 6 | Polish + regressions | claude/sproutlab-diet-rework-p6 | — | not started | — | — | — | — | — | Sticky-state persistence, a11y, motion |

### Arc B — Intelligence Layer Upgrade (parallel)

| Phase | Name | Branch | PR # | Status | Build | Kael | Cipher | Aurelius | Notes |
|-------|------|--------|------|--------|-------|------|--------|----------|-------|
| B0 | Spec — ISL state-of-union + upgrade roadmap | claude/sproutlab-diet-rework-p0 (shared, PR #113) | #113 | Wave 2 complete | waived (docs-only) | ✓ V-K-49..57 (primary) | ✓ pass-w/fixes | ✓ chronicling-ready | Co-ratified with Arc A |
| B1 | Keystone trio (chemRollup + meal_combo_check + qaAnswerMealCombo + computeMealCombos) | claude/sproutlab-isl-upgrade-p1 | — | pending B-0 ratify | — | — | — | — | ~150–200 LOC across 4 files (isl + qa + qa-handlers + cards) |
| B2 | Chem-variety cards + UIB antiNutrient warnings | claude/sproutlab-isl-upgrade-p2 | — | not started | — | — | — | — | Maren cross-consult on phrasing |
| B3 | Temporal parser ext + silent-catch console.error | claude/sproutlab-isl-upgrade-p3 | — | not started | — | — | — | — | Scope collapsed from original B-3 per V-K-49 |
| B4 | Filing-cabinet relocations (~172 LOC moved + ~30 LOC moved) | claude/sproutlab-isl-upgrade-p4 | — | not started | — | — | — | — | Includes QA_SUGGEST_POOL per V-K-51 |

**Cross-arc dependency:** Phase 3 of Arc A ([Score] segment with trend strip + new-field analytics) depends on Arc B early phases plumbing the new food-DB fields through ISL. Other Arc A phases (1, 2, 4, 5, 6) are independent and can ship without Arc B landing first.

QA-chain status legend per phase: `—` not started, `✓` pass, `✗` fail, `~` in progress, `waived` (state reason).

---

## V-tag registry — this arc only

**Starting high-water marks** (from scribe-record sweep, 2026-05-23):
- V-K high-water at arc start: **48**
- V-M high-water at arc start: **46**

First new V-K issued in this arc: V-K-49
First new V-M issued in this arc: V-M-47

**Issuance procedure:** Wave 2 audits issue V-tags sequentially by Governor; collisions resolved at Lyra synthesis. The chronicler renumbers to the next free registry slot on intake.

### Wave 2 V-tag intake (Phase 0 audits — 2026-05-23)

| V-tag | Source | Finding (1 line) | State |
|-------|--------|------------------|-------|
| V-K-49 | Kael Mode-1 | scout #2's "two undefined handlers" claim is FALSE — both wired in `intelligence-quicklog.js:1290, :1322` | **folded (blocker)** — Arc B B-3 collapsed |
| V-K-50 | Kael Mode-1 | `calcZivaScore()` is NOT cached (`core.js:1926-1979`) | folded — non-coupling rule in dispatcher contract |
| V-K-51 | Kael Mode-1 | B-4 must include `QA_SUGGEST_POOL` (78 LOC) | folded — B-4 LOC ~172 |
| V-K-52 | Kael Mode-1 | Add `console.error` to silent catch | folded — new B-3 row 13 (Cipher + Kael + Maren convergence) |
| V-K-53 | Kael Mode-1 | `COMBO_RULES` rule #6 not nutrient-keyed; handler must tri-resolve | folded — tri-resolution in B-1.3 architecture |
| V-K-54 | Kael Mode-1 | Canonical lookup is `_baseFoodName` (`core.js:2729`, 4-layer) | folded — B-1.1 updated |
| V-K-55 | Kael Mode-1 | Roadmap row 11 redundant — `_islMarkDirty('diet')` covers | folded — row dropped |
| V-K-56 | Kael Mode-1 | **Region LOC at 30,725 — 30K Rule trigger ALREADY BREACHED pre-arcs** | **open (watch-item)** — `intelligence-cards.js` natural sub-split target |
| V-K-57 | Kael Mode-1 | CLAUDE.md "22 intents" wrong (actual 30); registry location misattributed | folded — separate tiny PR post-ratify endorsed |
| V-M-47 | Maren Mode-1 | Safety-override over-broad (`renderDietIntelBanner` also carries positive synergy) | folded — `hasSafetySignal()` predicate OR banner split |
| V-M-48 | Maren Mode-1 | "Anti-Nutrient Watch" would alarm on every iron-rich Indian staple | folded — renamed "Variety nudge"; Maren-drafted copy + AND-gate + icon-ban |
| V-M-49 | Maren Mode-1 | `qaAnswerMealCombo` schema mismatch with `qaRenderAnswer` contract | folded — schema corrected (sections+signal); data-fn separated; 6-rule copy locked |
| V-M-50 | Maren Mode-1 | "Introduce with care" chip — current meal-input has ZERO proactive safety signal | folded — lifted Phase 3 → Phase 2 |
| V-M-51 | Maren Mode-1 | `dqp-zone` compression is Care-safe (no-op affirming) | resolved — no action |
| V-M-52 | Maren Mode-1 | Chip-count "≈13" → "up to 10" | folded — mechanical |
| V-M-53 | Maren Mode-1 | HR-1 latent at `diet.js:2742` is false positive | resolved — concurs with Cipher; voluntary rename only |
| V-M-54 | Maren Mode-1 | "Zero `if(true)return;`" claim scope correction (9 across codebase, not 0) | folded — scoped to intel files |

State legend: `open` (unresolved), `folded` (resolved at synthesis), `resolved` (no-op or false-positive), `issue` (filed as GitHub issue, link), `merged` (PR resolving it landed).

### Phase 0 Findings (Wave 1.5 + Wave 2 discoveries, chronicled discrete)

1. **CLAUDE.md ISL drift** — "22 intents with dedicated handlers" misattributes location (registry is in `intelligence-qa.js` not ISL) AND count (actual 30). Separate tiny PR post-ratify.
2. **Food-DB count discrepancy** — `NUTRITION` has 148 raw entries / 130 unique keys (18 duplicate keys across `// ── EXPANDED:` blocks silently overwrite earlier declarations). Architect's "146" predates EXPANDED dupes or is mid-flight. Confirm before consumers cite the count.
3. **Scout #2 methodology gap (V-K-49)** — Wave 1.5 scout swept `qa-handlers.js` only for `qaAnswer*` symbols; missed `intelligence-quicklog.js` where 2 of the 29 handlers live. Future scout briefs must instruct grep across the full file-set under audit, not the file where a symbol is "expected".
4. **30K Region breach (V-K-56)** — Kael jurisdiction at 30,725 LOC pre-arcs. `intelligence-cards.js` is the natural sub-split target if pressure escalates. Lyra/Cipher watch-item.
5. **HR-6 latent in `_qaUpdateSuggestions:180-192`** — pre-existing `addEventListener` usage. B-4 relocation surfaces it but does not fix it. **File as follow-up issue**, sibling shape to #109/#111 from prior session.

---

## Decision log

| Date | Decision | Source | Notes |
|------|----------|--------|-------|
| 2026-05-23 | IA pattern A chosen (sub-segment pills `[Today] [Score] [Insights] [Library]`) | Architect via AskUserQuestion | Hybrid B (pull-up sheets) and other variants rejected |
| 2026-05-23 | Default landing: last-used (sticky in localStorage); cold-start = `[Today]` | Architect | Optimizes for logging-first first visit, intent-respecting thereafter |
| 2026-05-23 | Branch convention: `claude/sproutlab-diet-rework-pN` | Architect | Per handoff `claude/sproutlab-<topic>` convention |
| 2026-05-23 | Phase 3 dead-data inventory deferred to separate Architect submission | Architect | Spec marks Phase 3 sizing TBD |
| 2026-05-23 | Full Companion roster + Scribe Worker Tier engaged for this arc | Architect | "Show of coordination" — Wave 1 fan-out: Lyra Mode-1 + scribe-scout + scribe-record |
| 2026-05-23 | Phase 3 dead-data identity: new fields on 146 foods in food DB; surface via intelligence layer | Architect | Resolves the `TBD pending Architect inventory` placeholder in Lyra Mode-1 spec |
| 2026-05-23 | Arc B opened: Intelligence Layer Upgrade, parallel to Diet rework | Architect | "Speaking of, go through our intelligence layer..." — ISL flagged as still pre-alpha |
| 2026-05-23 | Two-spec strategy: `diet-rework-v1.md` (Arc A) + `isl-upgrade-v1.md` (Arc B), cross-referenced | Lyra (main-session synthesis) | Allows Arc A phases 1/2/4/5/6 to ship independent of Arc B; Phase 3 depends on Arc B early phases |

---

## Companion deployment log

| Timestamp | Companion | Mode | Purpose | Returned artifact |
|-----------|-----------|------|---------|-------------------|
| 2026-05-23 (Wave 1) | Lyra | subagent, Mode-1 | Phase 0 spec authoring | `docs/specs/diet-rework-v1.md` (pending) |
| 2026-05-23 (Wave 1) | scribe-scout | subagent | Code-surface reconnaissance | In-transcript findings brief |
| 2026-05-23 (Wave 1) | scribe-record | subagent | Journal + V-tag registry setup | This file + sweep report |
| 2026-05-23 (Wave 1.5) | scribe-scout #1 | subagent under Lyra | Food DB schema survey + dead-field analytics potential | In-transcript findings brief |
| 2026-05-23 (Wave 1.5) | scribe-scout #2 | subagent under Lyra | Intelligence layer capability map + upgrade-surface inventory | In-transcript findings brief |
| 2026-05-23 (Wave 1.5) | scribe-record | subagent under Lyra | Journal update — Arc B opening | This file (Arc B section added; decision log + companion deployment log appended) |
| 2026-05-23 (Wave 1.5 synth) | Lyra | main session | Wave 1.5 fold-in synthesis (scout #1 + #2 amendments) | Two specs amended: `docs/specs/diet-rework-v1.md` + NEW `docs/specs/isl-upgrade-v1.md` — committed in `022c8ed` |
| 2026-05-23 (Wave 2) | Maren | subagent, Mode-1 | Care lens audit of both arc-pair specs | Mode-1 audit report; verdict yes-with-fixes; **V-M-47..54 issued** |
| 2026-05-23 (Wave 2) | Kael | subagent, Mode-1 | Intelligence lens audit (primary on Arc B) | Mode-1 audit report; verdict yes-with-fixes; **V-K-49..57 issued**; V-K-49 reshaped Arc B Phase B-3 |
| 2026-05-23 (Wave 2) | Cipher | subagent, Mode-1 | Edict V pre-pass on architectural shape | Verdict **pass-with-fixes**; arc-pair shape **certified**; 3 required + 6 recommended; 11 regression-guard names provided |
| 2026-05-23 (Wave 2) | Aurelius | subagent | Cross-cluster chronicling + PR #113 review | Verdict **chronicling-ready**; 4 marginal amendments; 3 Codex Memory.md candidates noted post-ratify per Chronicler discretion |
| 2026-05-23 (Wave 2 synth) | Lyra | main session | Wave 2 fold-in synthesis | Both specs re-written with all required + recommended fixes folded; this journal updated; PR #113 amended |

---

## References

- `docs/specs/diet-rework-v1.md` — Arc A spec (Lyra Mode-1 + Wave 1.5 + Wave 2 synthesis)
- `docs/specs/isl-upgrade-v1.md` — Arc B spec (Lyra Wave 1.5 main-session + Wave 2 synthesis)
- **PR #113** — https://github.com/Rishabh1804/sproutlab/pull/113 (draft, Phase 0 docs-only; Wave 2 complete; awaiting Architect ratification)
- `docs/SESSION_HANDOFF.md` — prior session record
- `CLAUDE.md` — policy floor, HRs, QA chain (note: ISL Key Subsystems line is stale — separate tiny PR planned post-ratify per V-K-57)
- `invocation.md` — Companion invocation procedure
- `PERSONA_REGISTRY.md` — roster, jurisdictions, the 30K Rule

---

*Journal opened by scribe-record under Lyra, 2026-05-23. Future entries append below.*
