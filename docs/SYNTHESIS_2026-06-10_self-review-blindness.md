# Synthesis — Self-review is blind to its own coverage gaps (2026-06-10)

**Arc:** the Ceres seating (canon-gen-001 second split) · PR #245
**Companion:** Lyra (The Weaver)
**Status:** pattern-read — candidate Codex canon (not yet ratified)

---

## The pattern in one line

**The author of a broad mechanical propagation inherits their own blind spots: the surfaces they didn't think to *touch*, they also don't think to *check*. The independent reviewer's only durable value is re-deriving the coverage set from scratch.**

---

## What happened (the proof case)

Seating Ceres meant propagating one fact — *the Care Region splits into Care (Maren) and Nutrition (Ceres)* — through every surface that asserts the Governor model: `CLAUDE.md`, `AGENTS.md`, `PERSONA_REGISTRY.md`, `invocation.md`, three `docs/*` references, the `qa-route.sh` + `build-province-map.mjs` tooling, and five `.claude/` persona mirrors. ~21 surfaces.

Lyra (the same agent that did the propagation) then reviewed the PR and posted a verdict: *"clean, complete, internally consistent… **no half-updated surface**."* The review traced the change through six named surfaces and found them consistent.

Cipher's independent Edict-V pass returned **`amended`** and named **four** things the self-review had missed:

1. `SPROUTLAB_QUICK_REFERENCE.md:57` — the QA-chain summon line still said "Maren / Kael / Vela … all three." A `diet.js` diff routed off it would **skip Ceres entirely** — a live canon-cc-008 short-circuit, not a cosmetic miss.
2. `.claude/agents/lyra.md` — still bundled `diet.js` into Maren's Care Region at the *old* 26,892 LOC. A residual `diet.js→Maren` claim **in the reviewer's own spec file**.
3. `.claude/skills/lyra.md:66` — boundary pre-check omitted Ceres.
4. `PERSONA_REGISTRY.md` — the PR bumped the headline total to 82,386 but left two component rows at old figures, so the parts summed to 80,475 ≠ the whole.

All four were real; all four were mechanical; none were caught by the author.

---

## Why the self-review missed them

Not carelessness — **structural blindness.** The author built a mental list of "surfaces that assert the Governor model" while propagating, then reviewed *against that same list*. The surfaces missed in propagation (the QA summon-line buried in a quick-reference; the author's own spec's Region prose; the registry's component rows vs its headline) were missed in review **for the identical reason** — they weren't on the list the author was carrying. You cannot audit a checklist for the items it doesn't contain by re-reading the same checklist.

The LOC contradiction is the sharpest instance: the author *changed the headline* and *changed two rows* in the same pass, and the act of changing some rows is exactly what hid the un-changed ones — the diff looked like "I updated the LOC," so the eye reads it as done.

---

## The doctrine

- **An independent reviewer is not a second pair of eyes on your list — it is a fresh derivation of the list.** Cipher didn't re-read Lyra's review; it asked "where must this fact be true?" from scratch and reached surfaces the author's working set never contained. That re-derivation is the whole value; a reviewer who trusts the author's coverage map reproduces the author's blind spots.
- **This is why the canon-cc-008 Cipher Edict-V pass is load-bearing even when the Governor audit is waived.** A docs/tooling-only change waives the *Governor* audit (no Capital code), but the **cross-cutting consistency pass is exactly where self-review fails** — broad mechanical propagation is the canonical generator of "half-updated surface" bugs, and the author is its worst auditor. Waiving Cipher on a docs-only change because "it's just docs" inverts the risk: docs-only changes are *more* propagation-shaped, not less.
- **Generated artifacts amplify the blindness.** The same session's silent render bug (the Nutrition province dropped from the Province-Map `cardOrder`) is the same failure in a different register: the generator ran cleanly and produced a complete-looking artifact that was one province short. A clean exit code is not coverage. Eyeball the rendered output.

---

## How to apply

1. **On any change that propagates one fact across many surfaces, the final-pass reviewer must re-derive the surface set independently** — never review against the author's enumeration. Phrase the reviewer's brief as a question ("where must X be true?"), not a checklist ("confirm X in these files").
2. **Never waive the cross-cutting final-pass on a docs-only / governance change.** That is the exact change-shape where it pays. Waive the Governor *code* audit if no Capital code moved; keep Cipher.
3. **For generated artifacts, verify the rendered output, not just the build exit.** Grep the artifact for the thing that should now be present (here: the new province card).

---

*— Lyra, 2026-06-10. I reviewed my own work and called it complete with the same blind spot that made it incomplete. The list I checked against was the list I'd built — so it could not contain what I'd forgotten. Cipher's worth wasn't sharper eyes; it was starting the list over.*
