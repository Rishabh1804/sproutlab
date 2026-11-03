# Synthesis — patch classes and convergent verification (2026-11-03)

**Companion:** Lyra (The Weaver) · **Arc:** PR #282 (child sex S2–S4 + growth velocity) · **Skim layer:** `SYNTHESIS_2026-11-03_patch-classes.html`

## The pattern
Bugs are not one-offs; they come in **types**. The Architect asked that every open item in #282 be fixed in the same PR *and classified as a patch*, "so we can proactively look for these or similar issues in later PRs". That request became a standing QA artifact:

1. **A catalogue of bug types:** `docs/PATCH_CLASSES.md`, PC-1..PC-10. Each class has:
   - the pattern;
   - a "Look for" list to run against a diff;
   - the guard that now catches it (Guarded, Tests, Design or Rule);
   - a guard backlog.
2. **A class on every record.** Each `docs/BUGS.md` entry and each Governor finding names its class. The classes that keep growing show where the next build gate should go.
3. **Look before building.** The Builder runs the "Look for" list of every class the diff touches before opening a PR.

## What the numbers said (#282, 159 entries)
| Class | Entries | Reading |
|---|---|---|
| PC-7 safety rewording | 43 | Copy is where safety lives. Every rewrite of parent-facing care text is a risk surface. |
| PC-1 time and age | 29 | Ages, windows and dates are the engine's hardest inputs. |
| PC-10 one state, two answers | 29 | The class that kept coming back, round after round. |
| PC-2 match vocabulary | 13 | Words the app matches on are not words it shows. |
| PC-5 gate coverage | 12 | Gates were bypassed until their bypasses became self-tests. |
| PC-9 registry drift | 10 | Cited tables drift from their sources. |
| PC-3, PC-6, PC-8, PC-4 | 8, 6, 5, 3 | Dead paths, test setup, record keys used as display text, escaping. |

PC-7 and PC-10 together are nearly half the log. **Safety copy and cross-surface consistency are where this codebase breaks.**

## Rules the arc earned
1. **Share the selector, not just the rule (PC-10).** Two growth engines shared one band rule but chose their weigh-in windows separately, and disagreed in 640 of 1,467 sampled infants. One selector (`gvWeightWindow`) gave 0 disagreements in 8,826.
2. **Derive the displayed number from what decided the verdict (PC-10).** After the verdict moved to g/week, the screen still quoted hand-typed g/day ranges ("1.5 g/day — right on track … 1.7–12.3 typical"). `gvDayFromWeek` now derives every shown figure from the verdict's own unit.
3. **Key a time-based downgrade on the reading's age, not today's date (PC-1, PC-7).** A stale-reading rule keyed on the child's age flipped a baby weighed yesterday from "contact today" to "next week" at midnight on day 92.
4. **Every surface answers one question with the same first action (PC-7, PC-10).** "Not gaining" got food tips while "is she losing weight" said to book a weight check. Now one action table (`gvSlowAction`, `GV_ACT_*`) leads everywhere, with food second.
5. **Gates fail closed, and every reviewer bypass becomes a self-test (PC-5).** The growth-age gate went from 8 fixtures to 71, each one a real bypass. The HR-12 ratchet refuses to run without a baseline. A gate rewrite keeps every old fixture; one rewrite in this arc silently lost a case until Kael caught it.
6. **Re-audit every fix, the fixer's included.** Several of the worst bugs in #282 were Lyra's own folds. Verification is never waived because the person making the change wrote the original.

## Convergent verification
Six build rounds each opened the next: every Governor round surfaced fresh, smaller findings. The fix was procedural. **Governors sort verification findings into BLOCKING** (safety-tier, or a parent could act wrongly; fixed in the PR) **and DEFERRABLE** (a tagged follow-up list for the Architect). The next round closed with four small blockers and a follow-up list (BUGS #159). Cipher's Edict V pass then needed only three escapes and one docs line.

## Candidate canon
- **Patch classes as a standing QA artifact** for every Province: a catalogue, a class on every finding, "look for" before building.
- **BLOCKING/DEFERRABLE sorting** as the verification-round contract.
- The four engine rules above (selector, derived display, reading age, one first action) as SproutLab design floor.

## Where it lives
- `docs/PATCH_CLASSES.md`: the catalogue.
- `docs/BUGS.md`: the S2–S4 log, #1–#159.
- `CLAUDE.md` §QA Chain (patch classes) and the quick reference (single-source growth helpers).
- The Governor and Lyra agent specs: the patch-class convention and the compass bearings.
- `Memory.md` §Methodology Decisions.
