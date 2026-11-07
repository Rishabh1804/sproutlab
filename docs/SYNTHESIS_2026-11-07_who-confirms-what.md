# Synthesis — who confirms what (the #161 arc, 2026-11-04 → 11-07)

**Companion:** Lyra (The Weaver) · **PRs:** #287–#292 · **Companion view:** `SYNTHESIS_2026-11-07_who-confirms-what.html`

## The pattern
#161 began as one believable typo: 15.9 kg for her real 9.5 kg passes the WHO implausible-value flag and gets dosed at 1.7×. The fix grew into six PRs, but most of the hard findings were one question asked in different places. **When the app treats a number as confirmed, who confirmed it, and what exactly did they confirm?**

Each BLOCKING finding across the round was a confirm standing in for more than the parent did:
- **A calm confirm covering a jump** that later evidence revealed (#290, Kael V-K-290-3). Fix: a confirm records only the kind of question the parent was shown, and covers only that.
- **A tap counted as a retype** (#292, Maren V-M-292-1). "Keep both" settles *which* of two weights counts. The leftover-risk flow then treated it as proof that *the number* was right, switching off R1's weight question for a heavy default. Fix: only an `amber`/`calm` confirm (a retype) counts as confirmed, and the date's other weights join the lower bound.
- **A confirm printed beside an impossible number** (#292, Kael V-K-292-1). A retype of an off-chart weight was recorded, so the doctor card lost "not yet confirmed" while the dose stayed blocked. Fix: no retype is offered, and the record function refuses such a row.
- **A confirm written past a change** (#292, Carina V-CA-292-7). A weight arriving from the other phone while a panel was open could be removed, or covered, without being shown. Fix: a panel is bound to what it was drawn against, and redraws rather than writing.

## Rules the arc earned
1. **A confirm records only the question that was shown** (`gvConfirmRecord(row, shownKind)`). Never a broader kind, and never a fallback while the check still asks.
2. **A tap settles which, a retype settles the number.** A choice between named records is not evidence that a number is right. Provenance matters: a still-open item is to record it (Cipher #292 note 1).
3. **An optional source argument, never a second engine.** The entry check reads "as of a date" by passing rows to the chip's own check (`gvWeightNeedsConfirm(row, rows)`). The no-argument path stays byte-identical, and Kael diffed 2,016 fixtures to show the shared builders unchanged. One check, one answer (PC-10).
4. **Bind a panel to what it was drawn against.** Re-check at the tap. If the state moved, redraw; never write past it.
5. **Defence in depth sits at the write.** A rule the surface enforces (no confirm of an off-chart weight) is also refused by the record function, so a future surface can't forget it.
6. **Fail closed means falling to the slower, safer surface.** Every unsettled entry outcome saves unconfirmed and leaves the dose chip to ask at dose time. The entry never needs to be perfect because the chip is still there.

## Convergent verification, again
The Governors' lenses caught different faces of the same rule:
- **Maren:** the dose consequence of a tap.
- **Kael:** the engine's gate order.
- **Carina:** the write racing a sync.
- **Vela:** the exits a parent can't reach. That is its own way of being made to "confirm": with "Save unchecked" off-screen, typing the number back was the only way out.
- **Ceres:** the reader that kept what the dose side dropped.

No single seat would have found all three BLOCKING findings in #292.

## Candidate canon
- **Confirm provenance:** a confirm carries what was asked and how it was answered (retype, or a tap between named records).
- **As-of evaluation through the one engine:** the optional-rows pattern.
- **Panel binding:** re-check at the tap, redraw on change.

These sit beside PC-10 and PC-11 in `docs/PATCH_CLASSES.md`. A future catalogue revision could add a class for "a confirm standing in for more than the parent did".

## Where it lives
- **Spec:** `docs/specs/paracetamol-weight-check-v1.md` (§4.3 the confirm model, §4.5 the entry check, §5.1 the reference weight).
- **Council:** `docs/COUNCIL_2026-11-04_161.md`.
- **Code:**
  - `split/core.js`: `gvWeightNeedsConfirm`, `gvConfirmRecord`, `gvEntryNeedsConfirm`;
  - `split/intelligence-illness.js`: `_paraRefWeight`, the shared builders;
  - `split/medical.js`: the entry flow.
- **Open edges:** `docs/BUGS.md`, "#161 PR 5 deferrables".
