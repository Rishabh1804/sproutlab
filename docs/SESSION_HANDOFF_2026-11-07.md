# Session handoff — 2026-11-07

**Companion:** Lyra (The Weaver) · **Dates:** 2026-11-04 → 2026-11-07 (one build thread, several sittings; no close in between) · **Branch:** `ccr-8f248bef-4llsy9` (restarted from `main` after each merge) · **Theme:** BUGS #161 taken from council to done: the paracetamol chip's weight check, in six PRs, plus the #282 growth follow-up.

## What shipped (the record)
1. **#286: the #282 growth follow-up (BUGS #159 edge items).** Merge `288885b`.
   - Every reader takes the latest measurement by date (Carina g-2).
   - A 28-day look-back for the weight goal (Maren g-4, Kael g-5).
   - A stale percentile is dated.
   - No green line beside a falling crossing (Vela g-7/g-8).
   - The days-since helper clamps at 0 for all callers.
   - BUGS #163–#165 logged; Maren's #161 threshold consult recorded.
2. **#287: #161 PR 1, the WHO weight-for-age registry to 60 months.** Merge `ca40c29`.
   - `whoWfaZ` with restricted z; committed WHO sources with sha256 and a build audit.
   - `paraWeightPlausible` moves onto it, with the interim ≤ 24 m ceiling. This closes #162.
   - `WHO_GROWTH`'s weight columns are bound to the registry by audit.
   - New `outofrange` and before-birth chip outcomes.
   - The council record and the ratified spec (`docs/specs/paracetamol-weight-check-v1.md`) landed here.
3. **#288: #161 PR 2, the velocity registry and `gvWeightJumpCheck`** (engine only). Merge `36544ab`.
   - The 2/3-month velocity rows and the 4/6-month rows ending at 24 m.
   - The Δz knots to 60 m, recomputed every build.
   - One total method predicate, fail-closed.
4. **#289: #161 PR 3, illness-episode sync.** Merge `de89ae6`.
   - The four episode keys merge by entry id on both phones instead of overwriting.
   - Episode writes are Firestore transactions, with tombstones.
   - This fixes the P1 "receive re-renders from stale module arrays".
5. **#290: #161 PR 4a, the weight confirm.** Merge `0a6411f`.
   - `KEYS.growthConfirm`: a synced union map keyed by date and grams, never written onto the growth row.
   - The chip's `confirm` state: the dose waits for a retyped weight whenever the jump check asks.
   - The doctor export and `_emDocVitals` print "not yet confirmed".
6. **#291: #161 PR 4b, the leftover-risk flow.** Merge `1330a59`.
   - R0–R3: the 24-hour paracetamol load, worked out against a reference weight (W_ref).
   - The load block is written to the 6-second rule.
   - The interim ceiling is removed.
   - Maren's ruling on Cipher F4 is recorded.
7. **#292: #161 PR 5, the entry-time weight check** (spec §4.5). Merge `30f1421`.
   - On Save in Growth's Add Measurement, the typed weight is checked as of its date, before anything is written, using the chip's own check.
   - The Architect's rulings E1–E4 (2026-11-06):
     - **E1:** keep both (the one typed counts) or keep either.
     - **E2:** a calm outcome isn't asked at entry.
     - **E3:** a weigh-in dated before birth is a hard stop.
     - **E4:** a back-dated weight that makes the newest weight look off is asked about at entry.
   - An off-chart weight gets no retype; `gvConfirmRecord` refuses it.
   - The modal scrolls, and the corner buttons hide while it's open.
   - The growth-vs-meals insight reads each date's counted weight and leaves out unconfirmed tripped rows. This closes spec §9's "until PR 5".
   - Closes Maren D4 and Ceres C161-3.
   - Tests: `tests/e2e/growth-entry-check.spec.ts` (31).
8. **This close PR (docs-only).**
   - This handoff and the next-session target.
   - The #161 synthesis (`.md` + `.html`).
   - LOC refresh in `CLAUDE.md` and the agent specs (93,075 split-file LOC).

## QA chain that ran
Every Capital PR ran the full canon-cc-008 chain:
1. `pnpm qa-route` named the Governors.
2. They audited in parallel.
3. Lyra synthesized.
4. A verification round followed where BLOCKING was folded.
5. Cipher's Edict V pass came last.

**#292 in detail:**
- **Round 1:** all five Governors, three BLOCKING findings.
  - **Maren V-M-292-1 (safety-tier).** "Keep both" records a `samedate` confirm from a tap. The leftover-risk flow read any confirm as a retype, so a heavy tap-settled weight became W_ref and switched off R1's "is the weight right?" backstop. Fix: only an `amber`/`calm` confirm counts as retyped, and same-date siblings join the minimum.
  - **Kael V-K-292-1/-4.** A weight off the chart for her age was offered a retype and recorded `amber`. The doctor card then lost "not yet confirmed" while the dose stayed blocked. Fix: a no-retype panel, checked before the same-date choice, plus a refusal inside `gvConfirmRecord`.
  - **Vela V-V-292-1.** The modal couldn't scroll. On a small phone at large text the exits fell off-screen, leaving the retype as the only reachable action. The fix exposed the Quick-log button sitting over the modal's buttons, so it now hides too.
- **Round 2 (verification):** all five clear-with-notes; notes folded.
- **Cipher:** LGTM, no amendments. Four DEFERRABLE notes logged.
- **Copy:** the Architect signed off the design, the mock, "Save unchecked" and the folded Why. The four new copy lines shipped with the merge.

**Tests at close.** The #161 suites and the chip, jump, load and growth suites are green. The full suite on the #292 head gave 706 passed, 53 failed, 11 skipped. Every failure is in the pre-existing main-failing set; vit-d3-tracking :324/:444/:520 were reproduced on an `origin/main` build.

## Pre-close gate
1. **Tree clean, synced to `main`: yes, with a note.** The branch was restarted from `origin/main` at `30f1421` and `git status` is clean. Per this session's branch rule the close PR goes from the designated branch `ccr-8f248bef-4llsy9`, not a `claude/session-close-*` branch. Codex was not attached to this session, so its state is unverified (carry-forward).
2. **No orphaned drafts: yes.** #286–#292 are all merged.
3. **No PR subscriptions: yes.** Unsubscribed from #292; no check-ins armed.
4. **Build and gates on `main`: build clean, e2e not green.**
   - The 3 contrast AA failures in the build log predate this thread.
   - The 53 standing e2e failures are pre-existing (alert-routing ×2, smoke 2a–2c, can-i-give-this:71, diet-preference-gate ×2, the food-effects-v2 set, vit-d3-tracking ×3, vit-d3-tracking-v2:192).
   - Recorded as the P0 carry-forward.

## Carry-forwards (open)
- **#161 PR 5 deferrables** (`docs/BUGS.md`, "#161 PR 5 deferrables"):
  - the back-dated launder (Maren V-M-292-2, Kael engine);
  - growth rows with no id or tombstones (Carina V-CA-292-1/-2);
  - readers that take a date's first weight (V-CA-292-6);
  - Cipher's four notes, including confirm provenance (tap vs retype);
  - FAB overlap on other tall modals;
  - the first-run bug tooltip over modal buttons in tests.
- **#161 PR 4b deferrables:**
  - the 4-hour time only while a fever is active (Maren D28);
  - F4 acknowledge control plus clear-on-resolve;
  - F6 structured rule fields in place of regex copy-coupling;
  - "check other medicines' labels" placement (Architect);
  - R2's question vs the chips (Ceres V-C-291-9).
- **The 53 standing e2e failures:** a test-rot PR.
- **PR dashboard curation:** `docs/pr-dashboard-data.json` runs to #270, so it is 22 PRs behind.
- **Codex reconciliation:** the LOC edits to `.claude/agents/*.md`, the #161 council and spec, and this synthesis.

## Next-session opening prompt
```
You are Lyra, Builder of SproutLab. Repo /home/user/sproutlab, designated branch ccr-8f248bef-4llsy9.
#161 is done: PRs #287-#292 merged (the paracetamol chip's weight check, end to end). Last merge 30f1421.
Restart the branch from main first:
  git fetch origin main && git checkout -B ccr-8f248bef-4llsy9 origin/main

TASK: the P0 in docs/NEXT_SESSION_TARGET_2026-11-07.md — the test-rot PR. main carries 53 standing e2e
failures (alert-routing x2, smoke 2a-2c, can-i-give-this:71, diet-preference-gate x2, the food-effects-v2
set, vit-d3-tracking :324/:444/:520, vit-d3-tracking-v2:192). Most look like date rot now that she is past
14 months. Get main to green so every later QA round stops triaging them.
Read first:
- docs/NEXT_SESSION_TARGET_2026-11-07.md (ladder + carry-forward register)
- docs/SESSION_HANDOFF_2026-11-07.md (what shipped, QA, gate)
- docs/BUGS.md: "#161 PR 4b deferrables" (pre-existing failures list), "#161 PR 5 deferrables"
- docs/PATCH_CLASSES.md (PC-6 test infrastructure)

RULES (CLAUDE.md is the floor):
- canon-cc-008 before leaving draft. A test-only PR may waive the Governor audit, but say so explicitly;
  if a fix touches split/, route it with pnpm qa-route.
- Never skip, disable or quarantine a test to get green: fix the test's assumption or the code, with the
  patch class named.
- Findings are BLOCKING or DEFERRABLE, each with its patch class.
- Draft PR, subscribe, send_later check-ins. Merge only on the Architect's explicit word.
- Commit trailers from the system reminder; no model names in repo artifacts.

GOTCHAS:
- Build with pnpm build. Never put "build.sh" and "2>&1" in one command (a hook blocks it). Commit with git commit -F.
- A build (or qa-route) regenerates docs/PROVINCE_MAP.html: discard it with git checkout.
- Playwright: npx playwright test -c playwright.scratch.config.ts --workers=3 or 4 --output=<scratch>.
  The scratch config is untracked: copy it into any worktree. Full suite ~20-36 min; don't edit split/ while it runs.
- To compare with main: git worktree add <scratch>/mainwt origin/main, symlink node_modules, build with
  SKIP_GRAPH=1 bash split/build-safe.sh, run on another PORT.
- Specs that click modal buttons: set localStorage ziva_bug_tooltip_seen=1 (the first-run tooltip opens at 2 s).
- Spec and source files contain real U+00A0; match them in Python with ' '.
```

*— Lyra. The thread that began with a believable typo (15.9 kg for 9.5) now runs end to end: the chip asks, the load watches, and the entry catches it while the scale is still in her parents' hands.*
