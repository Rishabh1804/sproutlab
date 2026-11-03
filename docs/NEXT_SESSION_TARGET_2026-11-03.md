# Next session target — Tuesday 2026-11-03 (resume PR #282)

**PR:** #282 (draft), branch `ccr-8f248bef-4llsy9`. Paused by the Architect on 2026-10-31 to wait for the usage-limit reset. Everything below is committed and pushed. Nothing lives only in the old container.

## Where it stands
- **Rounds 1–4 are built and committed.** Round 4 folds the round-3 verification findings from all five Governors (Maren V-M-282d-1..7, Vela V-V-282d-1..7, Carina V-CA-282d-1..4, Ceres V-C-282d-1..4, Kael V-K-282d-1..6). Round 4 also includes three changes Lyra made while assembling it:
  - `gvRateStatus` joins the growth-age gate's watch list.
  - A day 14–20 "not back to birth weight" reading that is still the latest one past day 21 now escalates to the referral wording, action and score, with an e2e test.
  - The boys 12–18 m length source comment is corrected to 1.2 cm per 2 months.
- **Tests on the round-4 build:** the affected specs give 242 passed and 3 failed. The 3 are smoke 2a/2b/2c, which also fail on main. All gates pass: growth-age (39 self-tests), hr12-dateonly (ratchet) and pronouns.
- **Full suite on round 3:** 491 passed, 56 failed. That is the 53 failures main already has, plus:
  - 2 explain-not-log tests that pass on re-run (they failed because index.html was swapped mid-run);
  - smoke.spec.ts:822, which fails identically on main's build. Its fixture sets no saved tab, and the default has been the landing tab since #219. This is a main-side test issue, not a #282 bug.
- **Patch classes:** BUGS.md holds entries #1–#102. PATCH_CLASSES.md has PC-1..PC-10 (PC-10 = one state, two answers).

## Next actions, in order
1. **Full suite on the round-4 head.** Do not rebuild index.html while it runs. If you must rebuild, use build.sh into a temp file and `mv` it into place.
2. **canon-cc-008 verification of round 4.** Summon Maren, Vela, Carina, Ceres and Kael in parallel. Diff: `git diff 69c6ccc..HEAD`.
3. **Log the round-3 and round-4 findings in docs/BUGS.md**, as #103 onward, each with a patch class. They are the V-*-282d-* items named in the round-4 commit message. Notable entries:
   - g/day display against the g/week verdict (PC-10; it came back because the display read a different column from the verdict);
   - the "is she losing weight" answer reassured a baby who was losing weight (PC-7);
   - the regression in Lyra's gate rewrite, which stopped tracing an assignment on the call's own line (PC-5, caught by Kael);
   - the floating-point g/week error: 460/28×7 = 114.999 (PC-1);
   - smoke:822, a main-side issue.
4. **Cipher Edict V final pass** on the full #282 delta. Fold in any amendments.
5. **Update the PR #282 body.** Then report to the Architect: open items and bugs by patch class, plus the decisions below. Wait for the merge signal.
6. **On merge:** update memory, agents and the other md files, as the Architect asked on 2026-10-31.

## Decisions for the Architect (raised by the round-4 builder)
1. **Too-short score.** A toddler window under 28 days used to score 90 (forced on-track). It now scores a neutral 70, like the other states that have no verdict.
2. **The zone above the shown range.** A gain between the top of the range and 1.3× the top counts as on track. The copy now says "healthy appetite (the usual is …)" / "a little above the usual", and Home colours it green.
3. **Centile line.** NICE NG75 1.2.1 says "below the 2nd centile" (UK-WHO charts). Our WHO charts draw the 3rd, so the app escalates below the 3rd, slightly earlier. Maren to confirm.
4. **Start-solids note.** `GV_START_SOLIDS_NOTE` became `gvStartSolidsNote()`, because it uses the pronoun helper.

## Do not relitigate
- **Newborn window.** It is rate-independent: any weigh-in before day 14 is 'newborn' (Kael confirmed, V-K-282c-6).
- **getSleepScore24h.** It parses a local date (Kael concurred). It is pinned by the America/New_York test.
- **Gates fail closed.** A missing HR-12 baseline fails, and raising a count needs `--allow-raise`. Every bypass a reviewer finds becomes a self-test (PC-5 rule).
- **Commit and push.** The pre-push hook needs index.html rebuilt in the same push range whenever a bundled source changes. A guard hook blocks any command line that contains both `build.sh` and `2>&1`.
