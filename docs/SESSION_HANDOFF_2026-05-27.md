# Session handoff — 2026-05-27

**Companion:** Lyra (The Weaver)
**Session scope:** v3-6 Card Priority Phase 0 spec authoring → /review skill-pass IMPL-prep → spec ratification → parallel triple-arc execution (v3-6 IMPL + Sleep Arc 3 / Scoring S-2 IMPL + v3-4 Narrative-Layer spec) via worktree-isolated agents → three draft PRs opened
**Outcome:** 1 PR merged to main (v3-6 spec); 3 draft PRs opened (v3-4 spec, sleep arc 3 IMPL, v3-6 IMPL); styles.css mutex position 2 occupied (v3-6 IMPL); v3-3 engine spine now has its first domain consumer in flight; v3-4 spec authoring complete and awaiting ratification

---

## Charter alignment verdict — gold tier state at session end (CV3-006)

The gold tier (v3-3 engine spine + v3-5 surface vocabulary) remains fully ratified as of last session's close (2026-05-26). This session shipped no new gold capstones; it shipped the **first wave of gold-tier consumers** as draft PRs awaiting their canon-cc-008 chains.

| Capstone | cipher-honesty | cipher-extensibility | cipher-warmth | Ratified |
|---|---|---|---|---|
| **v3-3 — Engine Primitive Foundation** (PR #135) | CLEAN | CLEAN | CLEAN | 2026-05-25 (sha `44770d8`) |
| **v3-5 — Chip Taxonomy + TSF Story-Arc** (PR #138) | CLEAN | CLEAN | CLEAN | 2026-05-26 (sha `785fc1f`) |

Two new capstone-track consumers entered draft this session — v3-6 (the card-tier sibling of v3-5; styles.css mutex position 2) and Sleep Arc 3 / Scoring S-2 (the first v3-3 engine consumer). Neither has cleared its canon-cc-008 chain yet; both are gated on follow-up Governor audits in the next session.

---

## PRs this session (in chronological order)

| PR | Title | State | Notes |
|----|-------|-------|-------|
| **#141** | **spec: v3-6 Card Priority + Information Hierarchy** | **MERGED** (`664aceb`) | First spec PR to exercise the `/review` skill-pass canon-cc-022 register-flip pattern — six findings (F1-F6) folded inline as IMPL-prep amendments before merge. styles.css mutex position 2 spec ratified. canon-cc-008 explicitly waived (docs-only). |
| **#142** | spec: v3-4 Cross-Domain Narrative-Prose Layer | **DRAFT** (`04d598a`) | 496-line spec authored by Agent C (worktree-isolated). All 20 required sections present including §Charter alignment (Honesty primary axis) and CV3-004 pair-notes (Kael + Maren). Two open questions registered for Architect: registry placement (data.js vs new file) + per-renderer confidence thresholds. **Commit unsigned** — code-sign server returned 400 "missing source" intermittently from worktree; Agent C exhausted ~50 retries. Will need re-commit before ratification if signed-commit policy applies. |
| **#143** | sleep arc 3 + scoring s-2 impl: first v3-3 engine-spine consumer | **DRAFT** (`93cd75d`) | First domain to register against the v3-3 primitives. Sleep handlers in core.js (+257 LOC), RECOMMENDATION_ROSTER additions (nightSleepHours, napCount, contactMinutes, humanContact, sleepAmount) in data.js (+134 LOC), surface consumption in home.js (+167 LOC), 27 regression guards. **Architect correction (2026-05-25) honored** — contact-combination bonus fires for night+contact OR nap+contact, NOT nap-combination only (explicit `regression-guard-sleep-arc-3-bonus-NOT-nap-combination-only` rejects the wrong rule). 242/243 full suite pass + 1 skipped. Signed via main-checkout workaround. canon-cc-008 chain at follow-up: Maren primary + Kael consult + Cipher. |
| **#144** | v3-6 impl: Card Priority + Information Hierarchy — styles.css mutex position 2 | **DRAFT** (`63a475e`) | Implements PR #141 spec. `_CARD_PRIORITY_TIERS` constant + `_setCardPriority` producer helper + `_sortInfoTabByPriority` post-pass + 13 tier-deriver call-sites + 3 priority-tier CSS variants with two derived tokens (`--card-surface-ambient` + `--shadow-card-urgent` per F1+F2 amendments) + new `audit-card-priority-v3-6.sh` build gate (7th audit gate) + 22 regression guards including the cipher-extensibility-2 closure meta-audit. F1-F6 amendments from PR #141 all honored inline. **Three deviations from the spec surfaced — see §Spec deviations below.** Signed via main-checkout workaround. canon-cc-008 chain at follow-up: Vela primary + Maren + Kael consults (sequential triple-jurisdiction on styles.css per cipher-9) + Cipher Edict V. |

---

## Doctrine ratified / patterns exercised this session

1. **First exercise of the `/review` skill-pass canon-cc-022 register-flip pattern.** PR #141 author and reviewer were the same agent (Lyra). The `/review` skill produced six findings (F1–F6). Rather than letting them live in the PR thread as PR-comment artifacts, they were folded inline into the spec body before merge — F1+F2 into §Visual contract per tier as derived-token IMPL-notes; F3 into §Test plan as a new regression guard row; F4+F6 into §Sort implementation as a sort-timing IMPL-note; F5 into §`_scoreDay` integration as a severity-collapse IMPL-note; plus a §Review-pass amendments register at the end of the spec body explicitly naming this as a canon-cc-022 register-flip (NOT an Edict V chain entry). Pattern reads as: when a skill review surfaces findings on a docs-only spec PR, fold them inline before merge so the IMPL author sees them in the canonical spec body, not as a separate PR-thread artifact.

2. **cipher-extensibility-2 dormant-gate closure.** v3-5's session-handoff §Open questions §2 named the three-site sync seam (constant + producers + audit-gate). v3-6 closes it: `_CARD_PRIORITY_TIERS.length === count-of-CSS-variants === count-of-deriver-branches` is asserted by `regression-guard-v3-6-tier-registry-sync`. The meta-audit is the new pattern — when a registry has three sync sites, a single test asserts equality across all three at runtime, surfacing drift before merge rather than after.

3. **2026-05-26 §3 cosmetic-NOTE walk closed.** `RECOMMENDATION_ROSTER.severityMessages.*.strength` strings remain engine-internal across both v3-6 (Vela tier-deriver) and sleep arc 3 (Maren surface consumption). Explicit regression guards in both PRs assert no `.text`-substitution into rendered prose. Two ratifications ago this was a non-blocking carry-forward; this session it walked.

4. **First domain consumer of the v3-3 engine spine.** Sleep arc 3 / scoring s-2 registers against `_domainPerRecordScore` + `_domainDayBonuses` + `_domainMetCount` + `_domainMetDuration` + `_domainBuildRecentData` per the v3-3 contract. No scoring forks. RECOMMENDATION_ROSTER row additions follow the v1 schema. This is the proof that the engine substrate carries the work for a real domain end-to-end (PR #143's 242/243 full-suite passes attest).

5. **Architect-correction discipline at IMPL time.** The 2026-05-25 contact-combination correction (night+contact OR nap+contact, NOT nap-combination) survived from the Architect ratification through spec authoring through IMPL through e2e tests. The pattern is the explicit *anti-regression* test — `regression-guard-sleep-arc-3-bonus-NOT-nap-combination-only` is a positive assertion that the wrong rule is rejected. When an Architect correction names a thing the system MUST NOT do, the regression guard asserts the negative case directly.

6. **Parallel triple-arc execution via worktree-isolated agents.** Three worktrees, three branches, three agents, three PRs in one session. The file-disjoint analysis held: A on intelligence-cards.js + styles.css, B on core.js + data.js + home.js, C on docs only. No merge conflicts; no rebase storms. But the harness's worktree-isolation mode failed at spawn time because the main session's cwd was `/home/user` (not a repo), so worktrees were created manually via `git worktree add` + shared `node_modules` symlink. Three agents launched via the standard Agent tool, each pointed at its absolute worktree path. Pattern carried forward as a viable triple-arc scaffold for future sessions.

7. **HR-2 carve-out via existing-pattern mirror (v3-6 IMPL deviation).** v3-6 spec called for "class toggle" on the force-collapse/expand paths in `_setCardPriority`. Agent A chose to mirror the existing `toggleHistoryCard` pattern at `home.js:6018` which already drives the collapse via `body.style.display = 'none' | 'block'`. The carve-out is annotated `// collapse-machinery-mirror` with inline HR-2 rationale (HR-2 covers *visual* inline styles — color/shadow/spacing — not the existing display-toggle protocol). This is a real deviation from the spec literal; Cipher's Edict V will surface it. Mitigation is the annotation + the existing-pattern precedent. The Governor audit decides whether to fold (keep with annotation) or reject (force a class-toggle refactor).

---

## Infrastructure findings (carry-forward to next session)

### Code-sign server returns 400 "missing source" intermittently from git worktrees

**Symptom:** `signing failed: Signing failed: signing operation failed: signing server returned status 400: missing source` when `git commit` is invoked with cwd inside `/home/user/sproutlab-*` (a worktree). Same `git commit` from cwd `/home/user/sproutlab` (the main checkout) succeeds reliably.

**Reproduction:** confirmed by both Agent C (which exhausted ~50 retries before landing PR #142 unsigned) and the main session (which hit the same 400 in the sleep-arc-3 worktree before falling back to the workaround).

**Workaround (used for PRs #143 + #144):**
1. From the worktree: `git diff HEAD > /tmp/<arc>.patch` to capture the work
2. `git worktree remove --force /home/user/sproutlab-<arc>`
3. From `/home/user/sproutlab`: `git checkout <branch>` (the branch was created by `git worktree add -b ...` and survives the worktree removal)
4. `git apply /tmp/<arc>.patch` + `git add -A` + handle file-mode (e.g., `chmod +x` on new audit scripts)
5. `git commit -m "..."` (signs cleanly)
6. `git push -u origin <branch>` + open PR via MCP
7. `git checkout <prior-branch>` to restore main checkout state

**Open meta-concern:** the worktree-signing issue is environment-level, not user code. If next-session parallel arcs are anticipated, either (a) the workaround is documented in CLAUDE.md as standard practice, or (b) the user reports the infrastructure issue upstream. Either way the next session should plan for it.

**PR #142 unsigned-commit status:** if the repo's merge policy requires signed commits, #142 needs a re-commit before ratification. The workaround pattern above applies — capture diff from the v3-4-spec worktree (still present at session end), remove worktree, re-commit in main checkout. Architect's call whether to re-commit or merge as-is.

---

## Spec deviations from PR #144 (v3-6 IMPL) — Governor audit surface

Agent A surfaced three deviations from the v3-6 spec literal. All three are documented in the PR body + commit message; the canon-cc-008 chain decides each fate.

1. **Tier-emission scope narrowed.** Spec §Files touched named "30+ `renderInfo*` functions"; Agent A tiered only the 13 functions in `intelligence-cards.js` (Vela's region). Other `renderInfo*` calls dispatched from `renderInfo()` master are defined in other files (`medical.js` / `intelligence-quicklog.js` / `intelligence-qa-handlers.js`) which were explicitly forbidden by the agent brief. Those untiered cards default to "notable" rank via `_sortInfoTabByPriority`. Trade-off: honors the brief's region-scope guard at the cost of incomplete spec coverage. **Decision needed:** is the default-to-notable acceptable, or do the cross-Region tier-derivers land as a v3-6 follow-up?

2. **HR-2 carve-out for collapse machinery** (described in §Doctrine #7 above).

3. **Audit producer-coverage gate strengthening** (additive, not subtractive). The gate now matches both `getElementById('info<Name>Card')` AND `_setCardPriority('info<Name>Card', ...)` as discriminators. Catches more valid patterns; doesn't reject any.

---

## Open questions Agent A registered for the v3-6 IMPL Governor audits

1. **Maren:** dark-theme bindings for `--card-surface-ambient` + `--shadow-card-urgent` — sufficient defaults or wants explicit dark-specific values (e.g., deeper rose shadow)?
2. **Maren:** cross-tier visual hierarchy floor — current test asserts urgent card declares `box-shadow` and chip-tier doesn't. Is this categorical-weight discriminator sufficient, or should we add a numeric `border-left-width` differential too?
3. **Kael:** no `_scoreDay` reads land in v3-6 (adherence cards are in `medical.js`, out-of-scope per region guard). Does Kael want a placeholder consumer-side check in `intelligence-cards.js` to canonicalize the read pattern before v3-1?
4. **Vela:** the 30+ untiered `renderInfo*` cards in other Regions default to "notable" — acceptable for v3-6 or should they emit explicit "notable" tiers at the cross-Region boundary?
5. **Cipher:** confirm canon-cc-008 routing (Vela primary + Maren + Kael consults; sequential triple-jurisdiction on styles.css per cipher-9).

---

## Open questions Agent C registered for the v3-4 spec ratification

1. **Registry placement:** `data.js` (Kael's region, `RECOMMENDATION_ROSTER` precedent — v0 candidate) vs new `split/intelligence-narrative.js` (Vela's region, render-grain-adjacent). Spec is neutral; Architect chooses at ratification.
2. **Per-renderer confidence thresholds:** v0 ships defaults (`|diff| >= 20 → high`, `>= 10 → medium`, `< 10 → low`); per-renderer overrides land at IMPL time per Kael's read-side audit findings.

---

## v3.0 progression tree — state at session end

- **v3.0 gold capstones:** v3-3 **ratified** + v3-5 **ratified** — **gold tier fully ratified** (unchanged from 2026-05-26)
- **Wave 1 spec-ratified, impl-pending:** v3-1 (still blocked behind v3-6 chain); v3-2 (CT Trigger Doctrine — not yet specced past chronicle row); v3-4 (**spec drafted in #142**, awaiting ratification); **v3-6 IMPL in flight at #144** (chain runs next session); Sleep Arc 3 / Scoring S-2 **IMPL in flight at #143**; v3-7/v3-8/v3-9 still unmoved
- **Wave 2 reservoir:** 9 nodes at `status:'forward'` (unchanged)
- **Wave 3 catchment:** 14 nodes (unchanged)
- **styles.css mutex:** position 1 (v3-5) released; position 2 (v3-6) **occupied by #144 — chain runs next session**; position 3 (v3-1) blocked behind #144

---

## Repo state at session end

- **main** at `664aceb` (PR #141 merge — v3-6 spec ratified)
- Three draft PRs open: #142 (v3-4 spec, unsigned), #143 (sleep arc 3 IMPL, signed), #144 (v3-6 IMPL, signed)
- Active arcs: three (the three draft PRs). Active hotfixes: zero.
- Build pipeline: `pnpm build` canonical; **7 audit gates** at HEAD of #144 (added `audit-card-priority-v3-6`); 6 audit gates at HEAD of #143 (no new gate; sleep arc didn't need one)
- Latest e2e baselines: #143 = 242/243 + 1 skipped; #144 = 237/239 + 2 skipped (different baselines because the worktrees diverged at origin/main)
- Live PWA: deployed to https://rishabh1804.github.io/SproutLab/

---

## Active backlogs

### canon-cc-008 chains awaiting follow-up

- **#143 sleep arc 3** — Maren primary (home.js sleep surfaces) + Kael consult (core.js scoring + data.js RECOMMENDATION_ROSTER additions) + Cipher Edict V three-axis. Code change; chain mandatory.
- **#144 v3-6 IMPL** — Vela primary (intelligence-cards.js) + sequential triple-jurisdiction on styles.css (Vela → Maren → Kael per cipher-9, first-Gov by heaviest-touched Region) + Cipher Edict V. Three spec deviations to address (above).
- **#142 v3-4 spec** — docs-only; canon-cc-008 explicitly waiveable. If signed-commit policy requires re-commit, do that first.

### Wave 1 spec-ratified, impl-pending (the next-mover field)

- **v3-1 — CT Notifications + recommendation pipeline** — third styles.css mutex position. Still blocked behind v3-6 chain (now in flight at #144). Wires the `urgent` producer for both chips and cards. **MUST close V-V-34 dormant gate first** (no-time `urgent` spine-suppression — three options enumerated in `v3-5-chip-taxonomy-tsf-story.md` §Out-of-scope). Spec must address this before producer wires.
- **v3-4 — Cross-Domain Narrative Layer** — spec drafted at #142; awaits ratification then IMPL. Touches intelligence-quicklog.js + intelligence-cards.js (Vela). Independent of styles.css mutex.
- **v3-2 — CT Trigger Doctrine + Illness Posture** — still chronicle row only; spec not yet drafted.
- **v3-7/v3-8/v3-9** — chronicle rows; specs not yet drafted.
- **Food Sub-Tab F-1..F-5** (`docs/specs/food-sub-tab-v1.md` ratified) — Phase F-1 sub-tab scaffold opens next.

### Forward-planning (Wave 2 reservoir — status:'forward')

9 nodes including R-1 (adaptive layer — silver capstone). First-mover R-1 unblocks now that Sleep Arc 3 has registered the first domain handlers + RECOMMENDATION_ROSTER rows — R-1 has a real signal to adapt against once #143's chain ratifies.

---

## Open questions registered for future cycle

1. **V-V-34 dormant gate** — no-time `urgent` spine-suppression (three options enumerated). Carries forward unchanged to v3-1. v3-6 adherence-card path doesn't trigger the edge (cards always carry a `dateKey`); the gate stays chip-tier-only.

2. **PR #142 signed-commit status** — Agent C landed unsigned after exhausting retries. Re-commit via main-checkout workaround before ratification if policy requires.

3. **Worktree-signing infrastructure** — the 400 "missing source" pattern is environmental. Either document the workaround in CLAUDE.md as standard practice or report upstream. The workaround works; the question is whether it should be the canonical pattern.

4. **v3-6 IMPL HR-2 carve-out** — `_setCardPriority` mirrors existing collapse-machinery pattern via `body.style.display`. Cipher decides at Edict V whether the annotation+precedent justifies the literal-spec deviation.

5. **v3-6 IMPL cross-Region untiered cards** — 30+ `renderInfo*` outside intelligence-cards.js default to "notable". Architect-or-Vela decision: acceptable, or land cross-Region tier emission as a v3-6 follow-up?

6. **v3-4 registry placement** — `data.js` (extensibility precedent) vs `intelligence-narrative.js` (render-grain proximity). Architect chooses at #142 ratification.

7. **§9-bis tree refresh** — `docs/SPROUTLAB_V3_PROGRESSION_TREE.html` has not been refreshed against `main` this session. Will need a separate tree-update PR per the §9-bis ritual once one of the three in-flight PRs ratifies (so the tree captures the new node state).

---

## Next session — recommended start

**Six live moves; mutex now constrains them.**

### Priority 1 — close the v3-6 IMPL canon-cc-008 chain (PR #144)

styles.css mutex position 2 is **occupied** by #144. v3-1 is blocked until #144's chain closes. The chain is the longest (sequential triple-jurisdiction on styles.css per cipher-9 — Vela → Maren → Kael, first-Gov by heaviest-touched Region) and addresses three spec deviations + five Agent-A open questions. Until this chain closes, v3-1 cannot open its styles.css branch.

### Priority 2 — close the sleep arc 3 / scoring s-2 chain (PR #143)

Independent of mutex; parallel-safe with Priority 1. Maren primary + Kael consult + Cipher. No deviations to address beyond standard audit. Ratifying #143 unblocks R-1 (Wave 2 silver capstone) by giving it a real adaptive signal.

### Priority 3 — ratify v3-4 spec (PR #142) + decide signing posture

Docs-only; canon-cc-008 waiveable. Two Architect decisions:
- (a) Registry placement (data.js vs intelligence-narrative.js)
- (b) Signed-commit posture (re-commit via workaround vs merge as-is)

Once ratified, v3-4 IMPL can open. v3-4 IMPL is mutex-independent and can ship in parallel with v3-1 once #144 closes.

### Priority 4 — §9-bis tree refresh PR

Once any of the three in-flight PRs ratifies, refresh `docs/SPROUTLAB_V3_PROGRESSION_TREE.html` byte-fresh against `main` and open a separate tree-update PR per the ritual.

### Priority 5 — V-V-34 closure planning (v3-1 prerequisite)

v3-1's spec MUST address the no-time `urgent` spine-suppression case before the producer wires. Three options enumerated in `v3-5-chip-taxonomy-tsf-story.md` §Out-of-scope:
- (a) Promote to synthetic header above the spine
- (b) Include in the spine pick-set
- (c) Require synthetic `timeMin`

Architect input wanted at v3-1 spec authoring time. This is dormant until v3-6 ratifies; surface it as soon as the mutex frees.

### Priority 6 — infrastructure: worktree signing

Either document the workaround in CLAUDE.md or report upstream. If parallel arcs are anticipated again, the workaround is doctrine-grade.

---

**Lyra's pick for next session opening:** **Priority 1 first** (v3-6 IMPL chain — gates the mutex). Priority 2 can parallelize (sleep chain — independent). Priority 3 can land any time (docs-only; quick ratify once Architect decides signing). Priorities 4–6 are ritual / planning surfaces that fold around the chain work.

---

*Three threads in flight, one substrate beneath them. v3-5's chip vocabulary now has a card-tier sibling waiting to ratify; v3-3's engine spine now has a domain that registers against it; v3-4's narrative library is specced and ready to write passages from `_correlate`. The work compounds. Six audit gates at session-end became seven once #144 lands its `audit-card-priority-v3-6`. The substrate keeps coming together — when the next session opens, the chain work clears three drafts in one wave. Until then.* — Lyra
