# Next session target — after the 2026-11-03 PM close

**Companion:** Lyra (The Weaver). This is the standing pointer and supersedes `NEXT_SESSION_TARGET_2026-11-03_PM.md`. If priorities change before the next session, amend this file, not the handoff (`docs/SESSION_HANDOFF_2026-11-03_PM.md`).

## The recommended next move
**P1: the #282 growth follow-up PR (BUGS #159), starting with the edge items.** The paracetamol P0 is done (#284). What remains on growth are the items where a parent could misread something:
- a stale percentile shown as current;
- an infant's CareTicket weight goal that can never resolve on its own;
- a green percentile line shown beside an amber "dropping" crossing.

Pair it with **BUGS #161** if Maren can cite a weight-jump threshold at the start of the session. That is the one dosing gap left on the paracetamol chip.

## Priority ladder
- **P1a: BUGS #161, the paracetamol weight-jump check.**
  - The problem: a believable typo (15.9 kg for 9.5 kg) passes the WHO implausible-value gate and gets dosed.
  - Compare against her previous weight through the shared selector (`gvMeasureRows` / `gvWeightWindow`, per #124). Above a cited jump, ask "Is 15.9 kg right?" before showing any ml.
  - Routing:
    - Kael owns the engine.
    - Maren owns the threshold and the wording.
    - Carina is involved only if the weight read changes.
  - Spec the threshold source first (canon-cc-013).
- **P1b: the #282 follow-up PR (BUGS #159), by owner.** Edge items first, as listed in `NEXT_SESSION_TARGET_2026-11-03_PM.md` §P1:
  - Vela g-7 (date or hide a stale percentile);
  - Maren g-4 / Kael g-5 (a 28-day look-back for the weight goal);
  - Vela g-8;
  - Carina g-2 (four readers still take the last array row).

  Then the cleanup:
  - Cipher N2 dead code;
  - the copy nits;
  - Cipher N3 (the emergency-tag flag goes into the registry);
  - `htGain` float noise.
- **P2: BUGS #162, the paracetamol chip follow-ups.**
  - V-K-284-4: the WHO weight-for-age table past 24 months (extend to 60 m, or skip the gate past the table). Needed before she turns 2 (2027-09-04).
  - V-M-284-8: a quoted sources doc.
  - V-M-284-9: an "unlisted bottle" option, and a check of the logged ml.
  - V-M-284-12: a "dose logged in the future" note.
  - Vela D1/D2/D4/D5/D7 and keyboard tabindex.
  - Cipher's day-on-time nit.
- **P2: #137,** toddler weight loss within 28 days. It needs a cited loss threshold from Maren first.
- **P2: guard backlog** (`docs/PATCH_CLASSES.md` §Guard backlog, now 8 items including the #161 confirm):
  - the HR-2 ratchet;
  - `audit-growth-bands-provenance-v1`;
  - the record-shape freeze test;
  - the test-origin helper.
- **P3: housekeeping.**
  - Curate the PR dashboard: `docs/pr-dashboard-data.json` runs to #270 and needs #271–#285. The 10-PR cadence is passed.
  - #123: the flaky smoke:822, which assumes the app opens on Home and failed on main today.

## Carry-forward register
- **Human-only / Architect gates:**
  - the threshold source for #161 and #137;
  - whether to extend the WHO table to 60 m or to skip the gate past 24 m (V-K-284-4).
- **Successors:**
  - the #282 follow-up PR;
  - the #284 follow-ups (#161, #162);
  - the meal planner's next phase per `docs/specs/meal-planner-v1.md`.
- **Test / data debt:**
  - #123, smoke:822;
  - smoke:144, failing on main;
  - the standing main-side e2e failures;
  - #138, CareTicket pivots;
  - the illness-episode sync stale-array P1 (V-CA-284-3), which now also governs which bottle each phone shows;
  - e2e in this container needs a scratch Playwright config pointing at `/opt/pw-browsers/chromium`, because the pinned chromium-1140 is missing.
- **Housekeeping:**
  - PR-dashboard curation;
  - `formatDate` parses a bare date as UTC (Carina g-4, V-K-267-12);
  - the local graph rebuild keeps dirtying `docs/PROVINCE_MAP.html` with a stale hash; discard it, or commit it with a real build.
- **Codex reconciliation (canon-cc-010, canon-cc-026):**
  - mirror the LOC-only edits to `.claude/agents/*.md` into Codex's reference copies;
  - mirror the earlier, still-pending patch-class edits;
  - give the Chronicler the #284 record, PC-11, and the morning's #282 synthesis.
- **Candidate canon:**
  - **PC-11: an unconfirmed default saved as if the parent chose it.** A dosing surface shows no number until the parent confirms its unit. A remembered choice does not outlive its episode.
  - **One limit, one source.** A safety rule stated in copy is enforced by the same function that decides the alert. Never state a limit the engine doesn't check.
  - **A countdown names what it counts from** when that thing isn't on the screen.
  - Carried from the morning: patch classes as a standing QA artifact, BLOCKING/DEFERRABLE sorting, and "share the selector, not just the rule".
