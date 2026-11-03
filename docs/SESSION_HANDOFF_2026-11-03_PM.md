# Session handoff — 2026-11-03 (PM)

**Companion:** Lyra (The Weaver) · **Date:** 2026-11-03, the second session that day · **Branch:** `ccr-8f248bef-4llsy9` (restarted from `main` after each merge) · **Theme:** the P0 from the morning close, the fever card's paracetamol chip, taken from spec to merged through a full canon-cc-008 round.

## What shipped (the record)
1. **#284: the paracetamol chip** (Maren V-M-282g-6; BUGS #160). Merge `24971a4`.
   - **Bottle picker.** The parent picks drops (100 mg in 1 ml), syrup (120 mg in 5 ml) or syrup (250 mg in 5 ml). This was the Architect's decision: the parent picks per dose. Until a bottle is tapped in this fever, no ml is shown.
     - The bottle is remembered only within the active episode.
     - A bottle from an earlier fever shows as a hint, never preselected.
     - An unconfirmed bottle is never saved to the record.
   - **Dose line.** It reads "X–Y ml of <bottle>", then "N–M mg, for W kg, weighed DATE".
     - The dose is 10–15 mg/kg, rounded inward with float noise removed, so it never shows more than 15 mg/kg.
     - The weigh-in date includes the year when it isn't this year.
   - **Weight gates.**
     - **Implausible weight:** the WHO Anthro weight-for-age flags (z < −6 or > +5) at the weigh-in age. The Architect's decision: hide the dose and ask the parent to check the weight.
     - **Newborn weights:** a newborn weight under 3 kg shows no dose. Under 3 months, the card says to ask the doctor.
     - **Bad or old dates:** future-dated weights are flagged. A weight older than 28 days gets a note.
   - **Dose timing.** The 4 h gap and the 4-in-24 h limit are now enforced, not just stated.
     - One countdown counts doses across all episodes, keyed on the latest dose by time.
     - The card and the Home alert both read it.
     - When a fever comes back, a new episode names the earlier dose it counts from.
   - **History and copy.**
     - History rows show the amount first.
     - The NICE NG143 wording: give it for distress, not the number; measure with a dropper or oral syringe, never a kitchen spoon.
   - **Tests.** `tests/e2e/fever-paracetamol-chip.spec.ts` has 9 cases; with `fever-readings-toggle` that makes 12/12 green.
2. **This close PR (docs-only, #285).**
   - BUGS #160–#162.
   - PC-11 added to `docs/PATCH_CLASSES.md`.
   - LOC refresh.
   - This handoff and the next-session target.

## QA chain that ran
- **Round 1, all five Governors in parallel** on the first commit:
  - **Kael:** 3 BLOCKING.
    - A newborn weight under 3 kg was "ok" with a null dose, which crashed the card.
    - The 4-in-24 h limit was stated but not enforced.
    - The bottle carried over between episodes.
  - **Maren:** 4 BLOCKING.
    - The same bottle carry-over. She rated it **safety-tier**: syrup ml read as drops is a 2–4× overdose.
    - The 24 h limit.
    - The safety copy.
    - Chip contrast.
  - **Vela:** 3 BLOCKING.
    - The selected chip was about 1.6:1 contrast.
    - The selector was unlabelled and looked like the action chips.
    - History rows read "250 mg/5 ml 2.5 ml".
  - **Carina:** clear-with-notes. Two one-line fixes folded in: a renamed dose drops its bottle, and day counts use `gvDaysBetween`.
  - **Ceres:** clear. One contrast note, folded in.
  - All of it was folded into commit `0012957`.
- **Cipher, Edict V:** **amended** at first. The countdown still returned early on an empty episode, so after a resolved-then-recurring fever the dose given an hour earlier was ignored. Fixed in `fda5761`.
- **Scoped re-audits of the countdown:**
  - **Kael:** clear.
  - **Maren:** one BLOCKING copy item (V-M-284-11): the countdown didn't name the earlier dose. Fixed in `3152118`, with Kael's alert-key and readings guards.
- **Cipher close:** **LGTM.** Merged on the Architect's call.
- **Safety-tier catch:** the cross-episode bottle default, which Maren, Kael and Vela each found independently. It became **PC-11**.

## Pre-close gate
1. **Tree clean, on `main`:**
   - #284 merged.
   - Local `main` is at `origin/main` (`24971a4`), and the close branch is `main` plus docs.
   - Working tree clean. The local graph rebuild keeps regenerating `docs/PROVINCE_MAP.html` with a stale hash; that is discarded each time and regenerates on the next `main` build.
2. **No orphaned drafts:**
   - #285 is this close PR.
   - No other PR from this session is open.
3. **PR subscriptions:**
   - #284 unsubscribed at merge, and its safety-net check-in cancelled.
   - #285 is watched until it merges.
4. **Build and gates green on `main`:**
   - `pnpm build` is clean and all audit gates pass.
   - **Not met:** 3 doctor-card print AA contrast failures, present on main before this session.
   - **Not met:** e2e has the known main-side failures, including `smoke.spec.ts:822` (#123, flaky; it assumes the app opens on Home and failed on main today) and `smoke.spec.ts:144`.
   - The full e2e suite was not re-run on `main` this session; the fever specs and the fever-adjacent suites were compared against main.

## Carry-forwards (open)
- **BUGS #161 (P1, dosing).** A believable mistyped weight (15.9 kg for 9.5 kg) still gets a dose. It needs a check against her own previous weight, with a cited threshold from Maren. This is the next dosing item.
- **BUGS #162 (P2).** The #284 deferrals, grouped by owner:
  - the WHO table past 24 months;
  - a quoted sources doc;
  - an "unlisted bottle" option and a check of the logged ml;
  - a clock-skew note;
  - Vela's display items D1, D2, D4, D5 and D7, and keyboard tabindex;
  - Cipher's day-on-time nit;
  - the stale-array episode sync.
- **Inherited from the morning close, unchanged:**
  - the #282 follow-up PR (BUGS #159);
  - #137;
  - the guard backlog;
  - PR-dashboard curation, now #271–#285;
  - #123.
- **Environment.** In this container Playwright's pinned chromium-1140 is absent, so e2e here needs `launchOptions.executablePath: '/opt/pw-browsers/chromium'` via a scratch config. Governor subagents could not run the spec for this reason.
- **Codex reconciliation (canon-cc-010, canon-cc-026).**
  - Only LOC figures changed this session in `.claude/agents/{carina,ceres,kael,lyra,maren,vela}.md`; mirror them to Codex's reference copies.
  - Give the Chronicler the #284 record and PC-11.

## Opening prompt for the next session

```
Lyra, SproutLab. Last session (2026-11-03 PM) shipped #284: the fever card's paracetamol chip now names
the weight, weigh-in date and bottle, shows no ml until the parent picks a bottle, hides the dose on an
implausible weight, and enforces the 4 h gap and 4-in-24 h limit across episodes. Full canon-cc-008
round + Cipher LGTM. Close PR #285 (docs) records BUGS #160-#162 and new patch class PC-11.

Goal this session: P1, the #282 growth follow-up PR (BUGS #159), edge items first. Fold in BUGS #161
(paracetamol weight-jump check against her own last weight) in the same session if Maren can cite a
threshold first; otherwise it leads the session after.

Read first:
- /home/user/sproutlab/docs/NEXT_SESSION_TARGET_2026-11-03_EVE.md
- /home/user/sproutlab/docs/SESSION_HANDOFF_2026-11-03_PM.md
- /home/user/sproutlab/docs/BUGS.md (#159, #160-#162)
- /home/user/sproutlab/docs/PATCH_CLASSES.md (run the touched classes' Look-for lists; PC-1, PC-5, PC-7, PC-10, PC-11)

At start:
- git fetch; branch from fresh origin/main; confirm #285 merged.
- pnpm build clean (3 doctor-card AA failures are pre-existing).
- e2e here: Playwright wants chromium-1140; use a scratch config with
  launchOptions.executablePath '/opt/pw-browsers/chromium'.
- pnpm qa-route on the diff before summoning Governors.

Directives in force: canon-cc-008 before any PR leaves draft; Governors sort BLOCKING/DEFERRABLE with a
patch class; no dosing number without a confirmed unit (PC-11); cite every clinical number
(canon-cc-013); half-awake test on every surface; Ziva is 14 months, read every age gate as toddler.
```

*— Lyra. One number a parent might act on at 2 AM: it now says whose weight, which bottle, and when it is safe to give it again.*
