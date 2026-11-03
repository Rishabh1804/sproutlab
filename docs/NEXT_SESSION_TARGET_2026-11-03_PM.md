# Next session target — after the 2026-11-03 close

> **Superseded** by [`NEXT_SESSION_TARGET_2026-11-03_EVE.md`](./NEXT_SESSION_TARGET_2026-11-03_EVE.md) at the 2026-11-03 PM close. The P0 below shipped in #284. This file is kept for its detailed P1 item list.

**Companion:** Lyra (The Weaver). This is the standing pointer: if priorities shift before the next session, amend this file, not the handoff (`docs/SESSION_HANDOFF_2026-11-03.md`).

## The recommended next move
**The paracetamol chip (Maren V-M-282g-6; it predates #282 and gets its own priority PR).** The fever card's dose chip names no weight, no weigh-in date and no formulation, and has no plausibility cap. A mistyped weight (95 kg for 9.5 kg) scales the dose with it, giving 9.5–14.3 ml. This is the one known dosing surface where a parent can act on a wrong number, so it goes before any polish.
- **Scope:**
  - show "for X kg, weighed DATE · drops 100 mg/ml" (or the formulation the family uses);
  - a plausibility gate against the WHO weight-for-age range, with a confirm step outside it;
  - an old-weight note when the weigh-in is more than about 4 weeks old.
- **Routing:** Kael owns intelligence-illness.js and Maren owns the dosing consequence. Carina reviews only if the weight read changes.

## Priority ladder
- **P0: paracetamol chip. Done: #284 merged 2026-11-03** (BUGS #160). Its remaining dosing gap is **BUGS #161**, a believable mistyped weight still getting a dose (an own-history weight-jump check). Do it before or alongside P1. The other deferrals are in **BUGS #162**.
- *(original P0 text, kept for the record:)* As above. Spec it briefly first (dose table source, formulations, plausibility bounds) and cite every number (canon-cc-013).
- **P1: the #282 follow-up PR (BUGS #159, by owner).** Do the PC-7/PC-10 edge items first:
  - Vela g-7: a stale reading's percentile is shown as if current, with no date. Date it or hide it.
  - Maren g-4 / Kael g-5: an infant weighed less than 28 days apart can never auto-resolve the CareTicket weight goal. Use a 28-day look-back for that metric only.
  - Vela g-8: the percentile line shows green beside an amber dropping crossing.

  Then the cleanup:
  - Cipher N2 dead code: `getGrowthNarrative`, `gvNewbornLine`, `_orig_renderInsightsGrowth`, the unreachable `under28` fallback, the `isPlateau` override and the `gvWeightRows` alias.
  - Carina g-2: four readers still take the last array row.
  - Copy nits: Vela g-5 and g-6, Ceres g-2 and g-3, Maren g-5.
  - Cipher N3: put the emergency-tag flag in the registry.
  - `htGain` float noise.
- **P2: #137, toddler loss inside under 28 days of records.** Find a cited loss threshold first (Maren). Until then, the "too soon" exclusion stands, with its `TODO(V-M-282e-8)`.
- **P2: guard backlog** (`docs/PATCH_CLASSES.md` §Guard backlog):
  - an HR-2 inline-style ratchet;
  - `audit-growth-bands-provenance-v1` (WHO CSVs plus a recompute);
  - a record-shape freeze test for KEYS-stored records;
  - one exported test-origin helper.

  For the growth-age gate's remaining bypasses, the structural fix is to make `gvAgeAt` return NaN instead of today, or to move to an AST pass.
- **P3: housekeeping.** Curate the PR dashboard: `docs/pr-dashboard-data.json` runs to #270 and needs #271–#283, since the 10-PR cadence has passed. Fix the flaky smoke:822 (#123), which assumes the app opens on Home.

## Carry-forward register
- **Human-only / Architect gates:**
  - the paracetamol-chip spec decisions: formulation list and confirm wording;
  - #137's threshold source.
- **Successors:** the #282 follow-up PR; the meal planner after P1b (#279), meaning its next phase per `docs/specs/meal-planner-v1.md` and the roadmap.
- **Test / data debt:**
  - #123 (smoke:822 flaky, main-side);
  - the 53 standing main-side e2e failures (`/tmp` baseline lists them; they predate #282);
  - #138 (CareTicket pivots: no surface yet).
- **Housekeeping:**
  - PR-dashboard curation (#271–#283);
  - stale worktrees under `.claude/worktrees/` (agent-*), which are local only and cleaned when the container is reclaimed;
  - Carina g-4 / V-K-267-12: `formatDate` parses a bare date as UTC.
- **Codex reconciliation (canon-cc-010, canon-cc-026):**
  - Province-side edits this session to `.claude/agents/{maren,ceres,kael,carina,vela,lyra}.md` (patch-class convention and compass bearings): mirror them to Codex's reference copies when Codex is next reachable;
  - give the Chronicler the #282 record and the patch-class synthesis for the Codex archive.
- **Candidate canon:**
  - **Patch classes as a standing QA artifact:** a bug-type catalogue, a class on every finding, and "look for" lists run before every PR.
  - **BLOCKING/DEFERRABLE sorting in verification rounds.**
  - **Share the selector, not just the rule.**
  - **Derive a displayed number from what decided the verdict.**
  - **Key a time-based downgrade on the reading's age.**
  - **Gates fail closed, and every reviewer bypass becomes a self-test.**

  See `docs/SYNTHESIS_2026-11-03_patch-classes.md`.
