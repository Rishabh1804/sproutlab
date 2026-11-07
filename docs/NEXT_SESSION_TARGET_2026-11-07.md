# Next session target — after the 2026-11-07 close

**Companion:** Lyra (The Weaver). This is the standing pointer and supersedes `NEXT_SESSION_TARGET_2026-11-03_EVE.md`. If priorities change before the next session, amend this file, not the handoff (`docs/SESSION_HANDOFF_2026-11-07.md`).

## The recommended next move
**P0: the test-rot PR. Get `main` to green e2e.** `main` carries 53 standing failures. Every QA round in the #161 thread spent time proving they weren't its own (one round needed a main worktree build). Most look like date rot, now that she is past 14 months and the Caldikind switch has happened:
- vit-d3 adherence counts;
- honey and allergen floors that assume an infant;
- the diet choking intro.

A green `main` makes the pre-close gate true again and turns the next red test into a real signal.

## Priority ladder
- **P0: test rot.** The specs:
  - `alert-routing` ×2;
  - `smoke` 2a–2c;
  - `can-i-give-this:71`;
  - `diet-preference-gate` ×2;
  - the `food-effects-v2-*` set (encourage-card, p1c-choking, p1c-milk, r1-combo-checker, r2-qa-food-safety, r3-allergen-note);
  - `vit-d3-tracking` :324/:444/:520;
  - `vit-d3-tracking-v2:192`.

  Root-cause each (PC-6), fix the test's assumption or the code, never skip. Pin dates relative to a fixture DOB where the spec reads "today". Keep one commit per family, so a Governor can audit any fix that touches `split/`.
- **P1a: the #161 engine follow-ups (Kael primary, Maren consult).**
  - **The back-dated launder (Maren V-M-292-2).** The jump check should leave out an earlier row that fails its own as-of check and carries no confirm.
  - **Confirm provenance (Cipher #292 note 1).** Tap vs retype. Or the chip's samedate retype also records `calm`, so W_ref doesn't fall back after a chip retype.
  - **The 4-hour time when no fever is active (Maren V-M-291-D28).** Compute it from the engine's own dose list.
  - Spec the launder fix first (it changes the chip's check).
- **P1b: growth row identity (Carina V-CA-292-1/-2/-6).**
  - A growth row id (entry `ts`) plus removal tombstones, on the #265 ledger pattern.
  - Then widen `SYNC_ENTRY_IDENTITY[KEYS.growth]`.
  - Then fix the readers that take a date's first weight (`intelligence-correlate.js:153`, `gvWeightWindow` under 12 m).
  - Carina primary; Kael consult on the readers.
- **P2: the #161 PR 4b open list.**
  - F4: an acknowledge control, plus clear-on-resolve keyed to the reading's age (Maren's ruling).
  - F6: structured rule fields (`fact`/`tell`/`release`/`callNow`) in place of the regex copy-coupling.
  - F5: `ALERT_CARD['para-load']` routes to a hidden fever card.
  - "Check other medicines' labels" in the lead or in Why (an Architect call).
  - R2's question vs the chips (Ceres V-C-291-9).
- **P2: #137,** toddler weight loss within 28 days, plus the graded escalation for a confirmed drop (Maren V-M-290-12; CDC MMWR 2003;52(RR-16)). Needs Maren's cited thresholds.
- **P2: guard backlog** (`docs/PATCH_CLASSES.md` §Guard backlog):
  - the HR-2 ratchet;
  - growth-bands provenance;
  - the record-shape freeze test;
  - the SYNC_KEYS / SYNC_RENDER_DEPS / accessor pairing gate (Carina V-CA-290-5).
- **P3: housekeeping.**
  - **PR dashboard:** `docs/pr-dashboard-data.json` runs to #270; append #271–#293 (the 10-PR cadence is long passed).
  - **The growth modal's inline handlers and styles:** HR-2/HR-3 debt; also the date input has no `max`.
  - **The Quick-log button over other tall modals:** generalize the #292 `:has()` rule.

## Carry-forward register
- **Human-only / Architect gates:**
  - the placement of "check other medicines' labels";
  - Maren's cited thresholds for #137 and the graded drop escalation;
  - "counts for what" copy on keep-both (Maren V-M-292-7, optional).
- **Successors:**
  - the #161 engine follow-ups (P1a);
  - growth row identity (P1b);
  - the 4b open list (P2);
  - the meal planner's next phase (`docs/specs/meal-planner-v1.md`);
  - a source past 24 m for the velocity method before 2027-09-04, so a weigh-in gap over 92 days doesn't make every chip read `confirm` (council item 11(6)).
- **Test / data debt:**
  - the 53 main failures (P0);
  - Ceres V-C-292-4: the reader-branch e2e, added to V-C-290-4;
  - Carina V-CA-290-6: the confirm-only partial flush, a malformed remote entry, and the guard while growthConfirm is dirty;
  - #123 smoke:822;
  - #138 CareTicket pivots;
  - e2e needs the untracked `playwright.scratch.config.ts` (chromium at `/opt/pw-browsers/chromium`).
- **Housekeeping:**
  - PR-dashboard curation;
  - `formatDate` parses a bare date as UTC (V-K-267-12);
  - `docs/PROVINCE_MAP.html` gets dirtied by local builds and qa-route; discard it.
- **Codex reconciliation (canon-cc-010, canon-cc-026):**
  - mirror the LOC-only edits to `.claude/agents/*.md`;
  - archive the #161 council record (`docs/COUNCIL_2026-11-04_161.md`), the spec, and `docs/SYNTHESIS_2026-11-07_who-confirms-what.md` with the Chronicler;
  - Codex was not attached this thread, so its tree state is unverified.
- **Candidate canon** (from `docs/SYNTHESIS_2026-11-07_who-confirms-what.md`):
  - **A confirm records only the question that was shown.** Never a broader kind; never a fallback while the check still asks.
  - **A tap settles which, a retype settles the number.** A choice between named records is not evidence that a number is right.
  - **An optional source argument, never a second engine.** Check "as of a date" by passing rows to the one check; the no-argument path stays byte-identical.
  - **Bind a panel to what it was drawn against.** Re-check at the tap, and redraw rather than write past a change.
  - **Defence in depth sits at the write.** A rule enforced at the surface is also refused by the record function.
