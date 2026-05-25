# Session handoff — 2026-05-25

**Companion:** Lyra (The Weaver)
**Session scope:** Vit D3 v2 Tier 1 (Arc closure) + Vit D3 v2 Tier 2 spec (drafted, ratified, merged)
**Outcome:** 2 PRs merged to main; full canon-cc-008 chain discharged on PR #122; Tier 2 implementation arc now spec-ready

---

## PRs landed this session

| PR | Title | Merge SHA | Notes |
|----|-------|-----------|-------|
| **#122** | Vit D3 v2 Tier 1: 6 verified bugs + T3-14 dependency | `94c9ba5` | Full canon-cc-008 chain (Maren V-M-77..82 + Kael V-K-88..95 + Vela V-V-25..30 + Lyra synth + Cipher LGTM); single PR for all 6 T1 items; T3-14 folded as T1-6 cleared-sentinel prerequisite |
| **#123** | spec: Vit D3 v2 Tier 2 (T2-7..T2-12 + 8 deferred Governor findings) | `d5bcf84` | Docs-only; canon-cc-008 explicitly waived; 14 items across three phases (2-A Vela primary, 2-B Maren primary, 2-C cross-cutting) |

## Doctrine ratified this session

1. **Three-Governor parallel audit dispatch in one tool-use turn.** PR #122's canon-cc-008 chain ran all three Mode-1 Governor audits as parallel `Agent` calls in a single message. The harness ran them concurrently; all three returned `clear-with-notes` within minutes. First operational confirmation that the post-canon-gen-001 three-Governor configuration works as designed under the parallel-dispatch protocol.

2. **Synth fold-in vs. Tier 2 defer — the bright line.** From the Governor audits Lyra distinguished four small high-value items (HR-4 pre-existing on a touched line, missing render call mirroring an existing contract, sync-race comment, defensive test for an explicitly-cited corner case) from nine genuinely-Tier-2 items (truth-table tightening, chained-undo audit, telemetry, performance note, schema-drift consumer guard, sync race multi-history, chip CSS variant, TSF Undo affordance, midnight-rollover doctrine). The bright line: "while the line is being touched + mechanically tiny + closes a registered finding" → fold; "scope-expansion or design choice with alternatives" → defer with a registered tag.

3. **Cleared sentinel + parseMedCheck-returns-null architectural pattern.** T1-6's audit-preserving sentinel layered with parseMedCheck's early-return-null means raw `medChecks[date][name]` carries audit data invisible to every active-state reader. Cipher reviewed and ratified the layered semantics — the asymmetry is the intended contract, not a leak. Future audit consumers go to the raw slot; UI surfaces use parseMedCheck. Established pattern for any future "preserve audit but hide from active surfaces" need.

4. **canon-cc-008 waiver protocol exercise.** PR #123 was docs-only; the chain's "test-only / docs-only → may be waived; state the waiver explicitly" branch fired for the first time this session. Waiver stated in PR body + commit message; chain bypassed cleanly; no Governor reports generated. Pattern confirmed.

5. **Branch-name mismatch surfacing.** Session opened on `claude/arc-b-chemrollup-spec-hTvrs` but Architect chose Vit D3 v2 Tier 1 instead. Lyra surfaced the mismatch + asked permission to create new branches (`claude/vit-d3-v2-tier1`, `claude/vit-d3-v2-tier-2-spec`). Establishes the precedent: when assigned branch name doesn't match the work, surface and ask — don't push misleading PR titles.

## Active backlogs

### Vit D3 v2 Tier 2 — `docs/specs/vit-d3-tracking-v2-tier-2.md` (ratified)

14 items in three phases. Implementation runs as 3 separate PRs:

- **Phase 2-A** (Vela primary; medical.js + styles.css + intelligence-quicklog.js; triple-jurisdiction on styles.css):
  - T2-A.1 (was T2-7) — Adherence denominator + unloggedDays exclude today
  - T2-A.2 (was T2-8) — Streak preserves through-yesterday on legitimate skip
  - T2-A.3 (V-V-25) — Skipped chip CSS discriminator (strikethrough + warn-color time slot + faded icon)
- **Phase 2-B** (Maren primary; home.js):
  - T2-B.1 (was T2-9) — markMedDone writes withFat:null when no meals logged today
  - T2-B.2 (was T2-10) — adjustMedTime midnight rollover handling (capture todayStr at open, toast on rollover)
  - T2-B.3 (was T2-11) — Reject future times in confirmMedDoneAt + confirmMedAdjust
  - T2-B.4 (was T2-12) — Outing-planner intent-aware skip semantics (_obCheckVitD3Needed with intent)
  - T2-B.5 (V-M-77) — preserveWithFat truth-table tightening (`fat.withFat !== true` vs `=== false`)
- **Phase 2-C** (cross-cutting; home.js + core.js + intelligence-quicklog.js):
  - T2-C.1 (V-M-78) — Chained-undo audit preservation (inspect raw slot, preserve prior across cleared → skip → cleared)
  - T2-C.2 (V-M-79) — undoMedSkip fallback delete telemetry (console.warn)
  - T2-C.3 (V-K-94) — Schema-drift consumer doctrine (added inline + spec)
  - T2-C.4 (V-K-95) — Sync-race multi-history — **recommendation: Option B (doctrine-only, no schema change)**
  - T2-C.5 (V-V-30) — TSF Undo affordance on skipped chips
- **Doctrine notes (no code):**
  - V-M-81 — Midnight-rollover cleared crosses to ydMissed (care-tier correct framing, no change)
  - V-K-91 — _refreshTodayMedWithFat performance (acceptable, no change)

**Order recommendation in the spec:** 2-A → 2-B → 2-C. Phases are independent; the order optimizes for landing the smallest+CSS-touch first (validates triple-jurisdiction flow), then the most-contained Maren-only PR, then the cross-cutting one last.

### Vit D3 v2 deeper backlog — `docs/specs/vit-d3-tracking-v2-backlog.md` (Tier 3 + Noise tier remain)

- **Tier 3 (defensive / latent)** — T3-13 (V-K-73 AM/PM range validation), T3-15 (fresh-install warm-start length=0). Fix opportunistically; not gating.
- **Noise tier** — WR-2..WR-7 + B3, D-1..D-5, D-7, C2, C5, C6/WR-4. Canon-noted only; no implementation work allocated.

### Arc B — chemRollup keystone (still unblocked, still un-specced)

Arc B Phase B-1 chemRollup was on the table at session start and remains. Predicted scope unchanged from 2026-05-24 handoff: `chemRollup()` accessor in Kael Region (`intelligence-isl.js`) aggregating `chem.fibre` / `chem.antiNutrients` / `chem.bioactives` across a meal-tuple → composite intelligence pass consumed by Q&A handlers + cross-domain cards. v0 spec not drafted; would be a fresh Lyra Mode-1 spec authoring task.

## Repo state at session end

- **main** at `d5bcf84` (PR #123 merge — Tier 2 spec)
- Latest code PR merge: `94c9ba5` (PR #122 — Tier 1 implementation)
- Active arcs: zero open. Active hotfixes: zero open.
- Build pipeline: `pnpm build` canonical, self-validating (per PR #120's build-safe.sh wrapper)
- Latest e2e: 165/166 pass — the one failure (`smoke.spec.ts:723 Build script contract`) is pre-existing from PR #120's build-safe.sh shift; the test asserts `build` script invokes `split/build.sh` directly while the script now invokes `bash split/build-safe.sh`. Out of scope for v2; surface separately when picked up.
- Live PWA: deployed to https://rishabh1804.github.io/SproutLab/

## Next session — recommended start

**Pick up Tier 2 Phase 2-A.** Smallest of the three phases, exercises the triple-jurisdiction styles.css flow, validates the chip-discriminator CSS approach before Phase 2-C's TSF Undo affordance lands on the same chip family.

Branch suggestion: `claude/vit-d3-v2-tier-2-a`.

Spec is at `docs/specs/vit-d3-tracking-v2-tier-2.md` §Phase 2-A. Each item has trigger trace + fix shape + test name pre-written.

## Files of doctrinal interest

- `CLAUDE.md` — persona, QA chain canon, build commands (unchanged this session)
- `AGENTS.md` — non-negotiable rules (unchanged this session)
- `docs/SPROUTLAB_QUICK_REFERENCE.md` — quick-ref (unchanged this session)
- `docs/specs/vit-d3-tracking-v1.md` — v1 spec (ratified; still authoritative for v1 surface contracts)
- `docs/specs/vit-d3-tracking-v2-backlog.md` — original v2 backlog (Tier 2 + Tier 3 + Noise tier; Tier 2 is now spec-ratified at vit-d3-tracking-v2-tier-2.md)
- `docs/specs/vit-d3-tracking-v2.md` — Tier 1 spec (ratified; ships §Synth fold-in + §Deferred to Tier 2 registers)
- `docs/specs/vit-d3-tracking-v2-tier-2.md` — Tier 2 spec (ratified this session; three-phase plan)
- `invocation.md` — Companion invocation procedure
- `PERSONA_REGISTRY.md` — Companion register

— Lyra, 2026-05-25, session-end at `d5bcf84`.
