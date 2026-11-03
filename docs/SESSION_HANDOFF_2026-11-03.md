# Session handoff — 2026-11-03

**Companion:** Lyra (The Weaver) · **Dates:** 2026-10-28 → 2026-11-03, paused 31 Oct–3 Nov for the usage reset · **Branch:** `ccr-8f248bef-4llsy9`, merged PR by PR · **Theme:** a pre-15-month care pass, the meal planner, privacy, and the child-sex arc that grew into growth-velocity correctness and a bug-type catalogue.

## What shipped (the record)
1. **#273 — pre-15-month care fixes.**
   - Old Vit D drops no longer show as due.
   - A next-vaccine helper and a "Mark given" button.
   - A toddler fever threshold.
   - Safe-sleep guidance for bed-sharing.
   - Complete CPR steps.
2. **#274 — recipes.** 14 new toddler recipes and a travel set.
3. **#275 — D4.** Carina seated as Governor of the Foundation (core, data, sync, config, start), plus the meal-planner spec v0.3.
4. **#276 — one food-identity rule.** Egg was merging into eggplant. Also fixed a combo-checker crash.
5. **#277 — meal-planner spec v0.4,** folding in Carina's data and sync position.
6. **#278 — meal planner P1a.** Design mock-ups in the Surface Catalog.
7. **#279 — meal planner P0 + P1b.**
   - The plan record, with two-phone sync.
   - The planner in Diet → Recipes.
   - The Architect's feedback folded in: recipe steps in the slot, chip colour, sheet scroll lock, and planned meals in logging.
8. **#280 — privacy v1 P2.**
9. **#281 — child sex S1.** A `sex` field on the household profile, so a full phone can't loop on the profile screen.
10. **#282 — child sex S2–S4 and growth velocity.** The big one; six build rounds.
    - Pronouns through `pron()`.
    - Cited body-care guidance, with emergency cards for torsion and a stuck hernia.
    - WHO sex-specific growth bands.
    - A newborn weight model, citing NICE NG75 and AAP.
    - Doctor actions in two time tiers.
    - One weigh-in window and one row filter for both growth engines.
    - `docs/PATCH_CLASSES.md`.
    - Three new self-tested gates: `audit-pronouns-v1`, `audit-growth-age-v1` and `audit-hr12-dateonly-v1`.
11. **#283 (this close PR, docs-only).**
    - Patch classes and BLOCKING/DEFERRABLE sorting written into Memory.md, the Governor and Lyra specs, AGENTS.md, CLAUDE.md and the quick reference.
    - The LOC and governance refresh.
    - This handoff, the synthesis and the next-session target.

## QA chain that ran
- **Governors:**
  - Every Capital PR cleared canon-cc-008.
  - For #282, all five Governors (Maren, Ceres, Kael, Carina, Vela) verified **every** build round.
  - The last round sorted findings into BLOCKING (all folded in bcc371e) and DEFERRABLE (BUGS #159).
- **Safety-tier catches in #282:**
  - **"Is she losing weight" reassured a baby who was losing weight (#110).**
  - **"Not gaining" got food tips only (#140).**
  - **A baby weighed yesterday at 13 weeks, still below birth weight, would have been told the doctor could wait a week (#139).** This was Lyra's own fold; Maren caught it.
  - **A small baby back to birth weight but below the 3rd centile read "within normal range" (#157).**
  - **The paracetamol dose vanished when the last growth row had no weight (#142, pre-existing).**
- **Cipher Edict V on #282:** *amended*, A1–A4 (three HR-4 escapes and one docs correction). All four were folded (9783d51), which met Cipher's condition for LGTM.
- **Full e2e on the final #282 head:** 537 passed. The 53 failures match main's set, plus the flaky smoke:822 (#123), which fails on main's own build too.
- **Bug log:** `docs/BUGS.md` holds the S2–S4 section, #1–#159, every entry carrying a patch class:
  - PC-7 safety rewording: 43;
  - PC-1 time/age: 29;
  - PC-10 one state, two answers: 29;
  - PC-2: 13;
  - PC-5: 12;
  - PC-9: 10;
  - PC-3: 8;
  - PC-6: 6;
  - PC-8: 5;
  - PC-4: 3.

## Pre-close gate
1. **Tree clean, on main:** main is at 8f18144, the #282 merge. This close rides on the session branch as PR #283, since the session is pinned to its branch rather than a `claude/session-close-*` one. Once #283 merges, main carries everything.
2. **No orphaned drafts:** #273–#282 are merged; #283 is this close PR.
3. **PR subscriptions:** #282 is unsubscribed. #283 is watched until it merges, then I drop the watch.
4. **Build and gates green on main:** the final #282 build was clean, all audit gates passed, and e2e matched main's baseline (above).

## Carry-forwards (open)
The full register, with context to start each item cold, is in `docs/NEXT_SESSION_TARGET_2026-11-03_PM.md`. In summary:
- the paracetamol-chip priority PR;
- the #282 follow-up (BUGS #159);
- #137, which needs a cited threshold;
- the guard backlog;
- PR-dashboard curation for #271–#283;
- #123 and #138;
- a Codex reconciliation of the edited agent specs, plus a Chronicler record of #282.

## Next-session opening prompt
```
SproutLab — resume after the 2026-11-03 close. Lyra builds; canon-cc-008 gates every split/ change.

Where we are: PR #282 (child sex S2–S4 + growth velocity + docs/PATCH_CLASSES.md) and the
docs close PR #283 are on main. Growth helpers are single sources (core.js): gvWeightWindow,
gvMeasureRows, gvNewbornCheck, gvSlowAction + GV_ACT_*, gvAboveBandLine, ordinal/pctOrdinal.

Goal: P0 — the paracetamol dose chip (Maren V-M-282g-6). Show the weight, its date and the
formulation; add a plausibility gate on a mistyped weight and an old-weight note. Spec it
briefly with cited numbers first. Then P1 — the #282 follow-up PR (BUGS #159, by owner).

Read first:
  /home/user/sproutlab/CLAUDE.md
  /home/user/sproutlab/docs/NEXT_SESSION_TARGET_2026-11-03_PM.md
  /home/user/sproutlab/docs/SESSION_HANDOFF_2026-11-03.md
  /home/user/sproutlab/docs/PATCH_CLASSES.md
  /home/user/sproutlab/docs/BUGS.md  (S2–S4 section, #159 and #137)
  /home/user/sproutlab/split/intelligence-illness.js  (getParacetamolDose and its callers)

At start:
  - git fetch; branch from fresh main; pnpm build is clean.
  - Run the "Look for" list of every patch class the work will touch, before building.
  - Never rebuild index.html while an e2e suite is running. Test in a separate serve dir on its own PORT.

Directives in force:
  - Every bug is logged in docs/BUGS.md with its cause, fix and patch class.
  - Verification rounds sort findings into BLOCKING (fix in the PR) and DEFERRABLE (a tagged follow-up list).
  - Care and dosing claims cite their source (canon-cc-013). Silence is not a waiver.
  - Merge only on the Architect's explicit call.
```

*— Lyra. The threads are tied off and labelled; the next weaver starts from the knot, not the tangle.*
