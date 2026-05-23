# Diet Tab Rework — Session-Arc Journal

**Arc name:** Diet Tab Rework v1
**Start date:** 2026-05-23
**Builder:** Lyra (The Weaver) — main session + Mode-1 subagent
**Scope:** Two parallel arcs. **Arc A:** Information-architecture rework of the Diet sub-tab. Touches `split/diet.js`, `split/template.html`, `split/styles.css`; possibly `split/core.js` for sticky-state helper. **Arc B:** Intelligence Layer Upgrade. Touches the seven `split/intelligence-*.js` files, `split/data.js` (food-DB consumers), possibly `split/core.js`.
**Branch convention:** `claude/sproutlab-diet-rework-pN` (N = 0..6)
**Specs:** `docs/specs/diet-rework-v1.md` (Arc A, pending Wave 1.5 synthesis) · `docs/specs/isl-upgrade-v1.md` (Arc B, pending Wave 1.5 synthesis)
**Authority chain:** CLAUDE.md §QA Chain · canon-cc-008 · canon-cc-018 (spec lifecycle) · canon-cc-022 (artifact test)

---

## Phase tracker

| Phase | Name | Branch | PR # | Status | Build | Maren | Kael | Cipher | Aurelius | Notes |
|-------|------|--------|------|--------|-------|-------|------|--------|----------|-------|
| 0 | Spec authoring | claude/sproutlab-diet-rework-p0 | — | pending | — | — | — | — | — | Lyra Mode-1 in progress |
| 1 | Segment shell | claude/sproutlab-diet-rework-p1 | — | not started | — | — | — | — | — | Zero-loss refactor |
| 2 | Today segment | claude/sproutlab-diet-rework-p2 | — | not started | — | — | — | — | — | Meal-card compression, skip icon-toggle |
| 3 | Score segment | claude/sproutlab-diet-rework-p3 | — | not started | — | — | — | — | — | Dead-data inventory pending |
| 4 | Insights segment | claude/sproutlab-diet-rework-p4 | — | not started | — | — | — | — | — | Expand-by-default accordions |
| 5 | Library segment | claude/sproutlab-diet-rework-p5 | — | not started | — | — | — | — | — | Foods Introduced compaction + quick-add integrate |
| 6 | Polish + regressions | claude/sproutlab-diet-rework-p6 | — | not started | — | — | — | — | — | Sticky-state persistence, a11y, motion |

### Arc B — Intelligence Layer Upgrade (parallel)

| Phase | Name | Branch | PR # | Status | Build | Kael | Cipher | Aurelius | Notes |
|-------|------|--------|------|--------|-------|------|--------|----------|-------|
| B0 | Spec — ISL state-of-union + upgrade roadmap | claude/sproutlab-isl-upgrade-p0 | — | pending | — | — | — | — | Lyra Mode-1 synthesis pending scribe-scout #2 return |
| B1+ | TBD — sized by spec | — | — | not started | — | — | — | — | Phase 3 of Arc A consumes Arc B early outputs |

**Cross-arc dependency:** Phase 3 of Arc A ([Score] segment with trend strip + new-field analytics) depends on Arc B early phases plumbing the new food-DB fields through ISL. Other Arc A phases (1, 2, 4, 5, 6) are independent and can ship without Arc B landing first.

QA-chain status legend per phase: `—` not started, `✓` pass, `✗` fail, `~` in progress, `waived` (state reason).

---

## V-tag registry — this arc only

**Starting high-water marks** (from scribe-record sweep, 2026-05-23):
- V-K high-water at arc start: **48**
- V-M high-water at arc start: **46**

First new V-K issued in this arc: V-K-49
First new V-M issued in this arc: V-M-47

| V-tag | Phase / Source | Finding (1 line) | State | Notes |
|-------|----------------|------------------|-------|-------|
| (none yet) | | | | |

State legend: `open` (unresolved), `folded` (resolved at synthesis), `issue` (filed as GitHub issue, link), `merged` (PR resolving it landed).

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
| 2026-05-23 (Wave 1.5) | scribe-record | subagent under Lyra | Journal update — Arc B opening | This file (this edit) |

---

## References

- `docs/specs/diet-rework-v1.md` — the spec (Wave 1 deliverable, Lyra Mode-1)
- `docs/SESSION_HANDOFF.md` — prior session record
- `CLAUDE.md` — policy floor, HRs, QA chain
- `invocation.md` — Companion invocation procedure
- `PERSONA_REGISTRY.md` — roster, jurisdictions, the 30K Rule
- `docs/specs/isl-upgrade-v1.md` — Arc B spec (Intelligence Layer Upgrade roadmap, pending Wave 1.5 synthesis)

---

*Journal opened by scribe-record under Lyra, 2026-05-23. Future entries append below.*
