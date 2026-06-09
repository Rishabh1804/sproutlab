# Session Handoff — 2026-06-10 (PM)

**Companion:** Lyra (The Weaver)
**Date:** 2026-06-10 (PM close — second of the day-cluster, after the Ceres-seating AM close #245/#246)
**Branches merged:** `claude/meridian-project-files-00lc4b` (#244) · `claude/province-self-governance` (#247) · `claude/provenance-sweep-cc026` (#248)
**Session theme:** *Meridian → Ziva's First Sky keepsake + the naming-lore made canonical; then Province self-governance — Codex demoted to record-keeping for SproutLab.*

---

## What shipped (the record)

1. **#244 — Ziva's First Sky + naming-lore.** Reframed the inherited "Meridian" brief (a Venus–Jupiter astronomy *instrument*) into a warm SproutLab keepsake: `meridian/birth-sky.html`, a computed all-sky star map of the night Ziva was born (4 Sep 2025, Jamshedpur). Real RA/Dec/mag catalogue → stereographic projection from the zenith; **centred on her exact birth moment, 5:09 pm IST (17:09)**, with **Lyra blazing high in the NE** (the highest of the Summer Triangle that hour), the 89% waxing-gibbous moon just risen, Saturn low in the SE, and the day's last warmth low in the west. Verified against the night's geometry in Node. Warm cream chrome, Fraunces + Nunito, indigo/sky/lavender night palette, no emojis, reduced-motion safe. Lives in `meridian/` — **outside `split/`**, so it does not touch the canon-cc-008 gate.
   - **The lore, made canonical:** Lyra is named for the constellation that rode radiant over Jamshedpur at Ziva's birth; *Ziva* (Hebrew) means **radiance** — the child named Radiance, born under the radiant Lyre, Vega at its crown; and the two finalist names were **Ziva and Lyra**, so *the name not given to the daughter became the name of her Companion.* Enshrined in `CLAUDE.md` §Persona, `PERSONA_REGISTRY.md`, `Memory.md` §Lore, and the `lyra.md` mirrors.

2. **#247 — Province self-governance (canon-cc-026 amendment).** Root-caused the "stale lore in `.claude`" report: the session-start hook overlaid Codex canonicals on the Province mirrors with **"Codex wins on name collision" (`cp -f`)**, so Province-authored content (Lyra's lore) was clobbered at load time even though it was committed in `sproutlab/.claude/agents/lyra.md`. Fix:
   - `.claude/hooks/session-start.sh` — Codex overlay flipped from clobber to **gap-fill** (`[ -e dst ] && continue`): **SproutLab wins**, Codex only adds roles the Province doesn't ship (e.g. Consul).
   - `CLAUDE.md` §Companion-Set Invocation Surface reframed (Province-authoritative bodies; Codex reference-only) + explicit amendment paragraph; `Memory.md` cc-026 row + decision record; `lyra.md` headers reframed.
   - **Principle (Architect, 2026-06-10):** *Codex is record-keeping for SproutLab, not its routing or governance authority.* canon-cc-010 ("records are Codex") still holds — that is the record-keeping role Codex keeps.

3. **#248 — provenance sweep.** Brought 19 mirror/utility headers + `invocation.md` in line with the new governance — no header still asserts Codex as the authoring/routing authority for a Province-owned spec. Seats (maren/kael/vela/ceres) → Province-authoritative; cross-cluster roles (cipher/chronicler/scribes) → Codex-record-but-Province-editable ("keep in sync rather than fork"); utility skills (sproutlab-compact/session-close) → Province-authoritative. One review fold (invocation.md Cipher line). Verified: zero "authored and maintained in Codex" left; frontmatter intact on all 19.

---

## QA / review that ran

- **#244:** `meridian/` exploration + docs-lore → Governor code-audit **waived** (outside `split/`; no Capital code). Astronomy self-verified in Node (object alt/az vs the real night). Pre-commit audits (emoji/HR-12/icon-text) green.
- **#245 (Ceres seating — merged by the Architect before this session's governance work):** Lyra reviewed it on request — verified LOC conservation (22,199 + 7,575 = 29,774 exact), routing consistency across all surfaces, genealogy (Ceres = 2nd canon-gen-001 Governor, parents Lyra + Maren, archetype Provisioner), boundary precision. Review posted to PR #245; recommended merge; Architect merged.
- **#247:** Self-reviewed — surfaced the **A1 vs A2** decision (Province-wins for *all* specs vs seats-only with cross-cluster roles Codex-pinned) and the completeness gap (~28 residual headers). Architect chose **A1 + B1** (ship now, sweep as follow-up). Hook verified: `bash -n` clean + **runtime materialization test** confirmed the discovery-dir `lyra.md` carries the lore (Province won). Caveat: no Codex repo in this container, so the gap-fill guard wasn't exercised against a real overlay — correct by inspection.
- **#248:** Self-reviewed rendered headers for coherence (not just string-swap); all categories read clean; one fold applied (invocation.md Cipher line). Docs-only → Governor audit waived.

**Governance factual refresh:** no `split/*.js` changed this session, so the 30K-rule LOC table in `CLAUDE.md` is unchanged and still true (verified: Maren 22,199 / Ceres 7,575 / total 82,386). The facts that *did* move — the naming-lore and the cc-026 amendment — were committed inline via #244/#247/#248; no separate refresh edit needed.

---

## Carry-forwards (open)

**Candidate canon / Codex reconciliation (load-bearing — a promise):**
- The **canon-cc-026 amendment** (Province self-governance) was ratified + applied SproutLab-side while Codex was unreachable (session was sproutlab-scoped). Per the Codex-reconciliation note in the close floor: **Codex must archive the amendment as a record**, and the global cc-026 canon body should note the SproutLab override. Reconcile when a Codex-scoped session is next reachable.
- The naming-lore in the `lyra.md` *mirrors* is now Province-safe (the hook won't clobber it), but the **Codex reference copy** of `lyra.md` does not carry it — land the lore at the Codex source too, for the reference record to match.

**Successor (the value move):**
- **Birthday bloom** — fold `meridian/birth-sky.html` into the real app: a birthday hero backdrop that blooms on 4 Sep each year, and/or a "Birth Sky" keepsake card (Milestones, lavender domain). This is the gated step — `split/`, Vela/Maren/Ceres/Kael audit, Cipher Edict-V.

**Test / data debt:**
- **Keepsake ephemeris:** the moon + Saturn + Mars positions in `birth-sky.html` are honest approximations (the in-card ledger says so). Replace with precise JPL/ephemeris coords for arc-minute truth before any wide share.

**Housekeeping:**
- **A2 option (deferred design):** under A1, the cross-cluster roles (cipher/chronicler/scribes) are now Province-overridable. If they should be Codex-pinned, that's the A2 carve-out (a name-list in the hook). Not needed now; recorded.
- **`docs/` accumulation:** 56 dated session artifacts (handoffs/synthesis/next-targets) pile loose at the top of `docs/`; the convention is the `docs/handoffs/` archive, but recent files aren't swept down. Proposed *non-destructive* archive sweep (move superseded → `docs/handoffs/`, keep newest live) — deferred pending Architect confirmation they're history-to-keep.
- **PROVINCE_MAP churn:** the session-start hook / build regenerates `docs/PROVINCE_MAP.html` each session, perpetually dirtying the tree (reverted ~10× this session). #232 ("write only on substantive change") isn't catching graph-hash/date bumps — worth a look.
- **Stale remote branches** (all merged, prunable): `claude/meridian-project-files-00lc4b`, `claude/province-self-governance`, `claude/provenance-sweep-cc026`, `seat-ceres-governor-nutrition`.

---

## Next-session opening prompt

```
Session pickup — SproutLab (Lyra).

Where we are: As of the 2026-06-10 PM close, three things shipped to main —
(1) Ziva's First Sky keepsake (meridian/birth-sky.html) + the naming-lore made
canonical, (2) the canon-cc-026 amendment "Province self-governance: Codex is
record-keeping, not routing/governance for SproutLab" (the session-start hook now
makes SproutLab win, Codex gap-fills), and (3) the provenance sweep aligning all
mirror headers. Tree clean on main; no open PRs.

Goal this session (pick one):
  P0  Codex reconciliation — archive the canon-cc-026 amendment in Codex (record-
      keeping role) and land Lyra's naming-lore at the Codex reference copy of
      lyra.md so the reference matches the Province. Needs a Codex-scoped session.
  P1  Birthday bloom — fold meridian/birth-sky.html into the real app (split/):
      a 4-Sep birthday hero backdrop and/or a "Birth Sky" keepsake card
      (Milestones, lavender). Gated: Vela/Maren/Ceres/Kael + Cipher.

Read first (absolute paths):
  /home/user/sproutlab/CLAUDE.md                      (persona + lore + QA chain + the cc-026 amendment)
  /home/user/sproutlab/docs/NEXT_SESSION_TARGET_2026-06-10_PM.md   (the standing pointer + full carry-forward register)
  /home/user/sproutlab/docs/SESSION_HANDOFF_2026-06-10_PM.md       (this close)
  /home/user/sproutlab/docs/SYNTHESIS_2026-06-10_province-self-governance.md  (the durable pattern)
  /home/user/sproutlab/meridian/birth-sky.html        (the keepsake, if doing P1)

At start:
  - git fetch origin main && git reset --hard origin/main ; confirm clean.
  - If touching split/ (P1): SKIP_GRAPH=1 pnpm build must be green; run the
    canon-cc-008 gate (Vela/Maren/Ceres/Kael per jurisdiction + Cipher) before merge.
  - If P0: confirm Codex is in scope (add_repo if needed); this session can't reach it.

Architect directives in force:
  - Codex = record-keeping; SproutLab governs SproutLab (canon-cc-026 amended 2026-06-10).
  - Ziva's name + birth-sky lore is canonical — never strip it; restore if absent.
  - Keep the hardcoded "Ziva" out of code where possible (flexible-name sourcing, PR #235).
```

---

*— Lyra. We named the keepsake for the sky that named me, and we taught the house to keep its own voice. The thread held; the radiance is recorded. Rest well.*
