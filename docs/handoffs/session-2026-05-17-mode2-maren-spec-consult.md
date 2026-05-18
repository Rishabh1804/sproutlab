---
session_id: s-2026-05-17-02
session_title: Mode-2 Committee Consult — maren.md Peer-Review + HTML Companion Architectural Call
author: Aurelius (The Chronicler)
date: 2026-05-17
repo: SproutLab (primary)
edict_v_exercise: N/A (not a build round; Mode-2 committee consult on spec + visualization architecture)
sibling_chronicle: session-2026-05-17-lyra-poop-color-zi-escape-sweep.md (s-2026-05-17-01) — same calendar date, immediate predecessor; this consult convened immediately after PR #75 merged
rounds:
  kael: 1 (Mode-2 committee-delegate consult, peer-review jurisdiction)
  maren: 1 (Mode-2 committee-delegate consult, self-review + spec-owner response)
  lyra: synthesis-reporter
  cipher: 0
canon_candidates: 2
doctrine_candidates: 1 paired note
watch_list_intake: 10 (5 V-K spec-amendment items + 4 V-M spec-gap items + 1 build-process item)
build_artifacts_approved: 2 priority + 3 watch-list + 4 do-not-build
---

# Session Chronicle — Mode-2 Committee Consult on maren.md + HTML Companion Architecture

**Session ID:** s-2026-05-17-02
**Volume:** SproutLab (primary). No code changes this session; spec amendments queued for a future Rung-2 spec-touch cycle per canon-cc-027.
**Builder:** Lyra (The Weaver) — synthesis-reporter chair (not a build round)
**Governors:** Kael (Intelligence, Mode-2 committee-delegate peer-review) → Maren (Care, Mode-2 committee-delegate self-review + spec-owner response)
**Censor:** Cipher — not summoned. Edict V does not apply to a spec consult that produces no built artifact.
**Duration:** single consult round in fixed Architect-set order (Kael → Maren → Lyra synthesis → Aurelius chronicle)
**Status:** Closed at synthesis. Two doctrine candidates and ten watch-list entries queued. Two HTML companion artifacts approved for priority build by next Lyra builder cycle, pending Architect ratification.

---

## 1. Arc of the consult

PR #75 (`d8d6076`) merged at end of session s-2026-05-17-01 carrying the methodology-debt threshold finding (V-K-10 `iconText()` helper + lint pattern at priority) and the V-K-5 LOC refresh chronicle (`cd07e60`). The mechanical LOC touches on `.claude/agents/kael.md` and `.claude/agents/maren.md` were flagged by Aurelius in the prior chronicle as owing cross-Governor peer-review at canon-cc-027 Rung-2 — a beat the audit chain had not yet discharged.

The Architect convened this consult immediately on that thread, with two coupled questions on the table:

1. **maren.md spec peer-review.** Bilateral closure of the Rung-2 cross-Governor obligation. Kael peer-reviews maren.md; Maren reciprocates on kael.md.
2. **HTML companion file — architectural call.** Should SproutLab grow a `docs/POOP_COLOR_REFERENCE.html` artifact in the shape of `docs/MODULE_MAP.html`? If so, what shape; and what other Care-domain or Intelligence-domain visualizations earn the same treatment?

The Architect set the convene order explicitly — Kael first, Maren second (with Kael's findings already in hand for self-review and refinement), Lyra synthesis third, Aurelius chronicle fourth — and named the register: "Aurelius, take notes." Scribe-mode.

What emerged across the three signed positions was richer than the original framing. Both Governors converged on the spec-amendment surface (twelve coordinated items) and refined the visualization architectural call from Kael's six-candidate scan into a tiered build plan (two priorities, three watch-list, four explicit do-not-builds). The consult also produced two canon candidates — a Mode-2 sub-mode distinction extracted from V-K-11, and a two-reviewer-convergence-triggers-lens-flip doctrine paired with V-K-16's visualization-substitutes-for-lens-flip risk note.

Six threads worth chronicling.

**T1 — The Mode-2 sub-mode refinement (V-K-11 + Maren's refinement → canon-cc-2026-05-17-001 candidate).** Kael's V-K-11 read maren.md's coordination-flag-first return-shape (the artifact Maren produced in PR #75's Round 2 deferral-closure pass) as a *new* return-shape worth adding to the persona spec at top-level. Maren refined it as a *sub-mode of Mode 2*, not a new return-shape: the on-subject-delegate Mode-2 shape (the canonical Maren-on-Care-spec or Kael-on-Intelligence-spec pattern) still applies for actual subject committees. The deferral-closure-coordinator posture is a *different fixture* within the same Mode-2 envelope — different brief shape, different return shape, but the same invocation surface. The closure_decisions[] structured-return is the load-bearing detail: per-finding `{ finding_id, decision: 'fix-now' | 'comment-now' | 'no-op' | 'verified-miscall', rationale, file_line_if_fix }` rather than the findings-per-finding shape of Mode-1 jurisdictional audit. This is the canonical Mode-2 sub-mode artifact next Codex session needs to canon-author with the framing intact.

**T2 — The icon-contradicts-text triplet recognition (V-K-15 + Maren strong concurrence).** Kael surfaced V-M-9 (anomaly-card color-drift — identical-branch ternary returning generic `zi('dot-red')` against any anomaly color), V-M-10 (contrast-failure — dark-theme black-swatch invisibility, light-theme white-swatch contrast loss), and V-M-16 (text-disappearance-into-SVG-namespace — substring-chop on a `zi('check') + ' No blood or mucus'` field producing a malformed SVG element that absorbs the user-readable text) as three distinct mechanisms on one heuristic axis: **icon contradicts text**. Three mechanisms, one heuristic. Maren concurred at strength: this belongs at maren.md:51 top-level in §Heuristics, not buried under sweep-coverage. The heuristic shape: "when an icon and the adjacent user-readable text disagree — by color (V-M-9), by visibility (V-M-10), or by namespace-absorption (V-M-16) — the surface is misreporting the data shape to the parent." This is the methodology-debt threshold story playing out in *heuristic-space* rather than helper-space. V-K-10 was the helper-space response in s-2026-05-17-01 (the `iconText()` helper closes the data-shape leak); V-K-15 is the heuristic-space response (the maren.md §Heuristics entry teaches future Care audits to name the axis on first recurrence rather than waiting for a third instance to cross the threshold). Helper and heuristic are complementary — one is a build artifact, the other is a review artifact. Both Governors converged on naming it explicitly.

**T3 — The dual-review framing drift (V-K-14 + Maren refinement).** maren.md's spec language said "dual-review" for the bilateral Maren+Kael spec-touch obligation per canon-cc-027. Practice across the last four spec-touch cycles has been *sequential-with-coordination-handshake* — one Governor reviews, the other reviews with the first's report in hand, then a synthesis or a bilateral-LGTM closes. Kael's V-K-14 flagged the language drift. Maren's refinement: keep the "dual-jurisdiction" term-of-art (the spec is owned by two jurisdictions, that framing is accurate) but revise the motion-description from "dual-review" to "sequential dual-jurisdiction review with cross-Governor coordination handshake." The spec wasn't *wrong*, just *imprecise* — the kind of clarity-of-language audit that's easy to miss because the words read fine until you compare them against the practice they're trying to describe. This is the audit-surface that the next canon-cc-027 Rung-2 spec-touch cycle should fold into both kael.md and maren.md for bilateral parity.

**T4 — The Rung-2 reciprocity closure.** Both Governors closed the bilateral cross-Governor peer-review beat owed by s-2026-05-17-01's LOC refresh. Kael endorsed maren.md's LOC refresh inline in his Section 1 close ("the mechanical refresh is clean; the spec-content amendments queued below should ride the next Rung-2 cycle, not block the LOC reality"). Maren reciprocated on kael.md ("LOC refresh accepted; V-K-12/13 spec-touch items are bilateral parity, queue for the same cycle"). The Aurelius prior chronicle flagged this as owed at §6 LOC refresh's commit-body annotation. **The beat is now discharged**; the canon-gov-002 cross-Governor-peer-review clause is satisfied for the mechanical refresh layer. Spec-content amendments queued by this consult (V-K-11 through V-K-17 + V-M-22 through V-M-29) remain owed at a *next* Rung-2 spec-touch cycle — not this consult, which produces no spec writes per the Architect's framing.

**T5 — The visualization architectural call.** Kael's Section 2 surveyed six candidates and recommended `docs/POOP_COLOR_REFERENCE.html` as the priority build — Candidate A (palette swatches with hex tokens) fused with Candidate D (anomaly-mapping table) and threaded with V-K-3's lexicon-membership column (which SAFE_POOP_COLORS keys are reachable from the picker, which are dead, which are anomaly-only). Maren's Section 2 added four Care-domain candidates Kael hadn't surveyed — V-M-26 vaccination-schedule timeline, V-M-27 growth-chart percentile bands, V-M-28 CareTicket state-machine flowchart, V-M-29 nutrition-density gradient — and refined Kael's POOP_COLOR_REFERENCE recommendation with explicit column-grouping (Care render | Contrast cells | Lexicon — with Kael-jurisdiction labeling on the third column, since SAFE_POOP_COLORS membership is core.js territory). Maren also elevated V-K-17 (wire the generator into build.sh) from nice-to-have to load-bearing: an HTML companion that drifts from its data-source is *worse* than no companion, because parents and Governors come to trust it as authoritative. Build.sh wire is the only mechanism that keeps the trust earned.

Lyra synthesis landed the priority shape:

- **Priority 1 — `docs/POOP_COLOR_REFERENCE.html`** (Candidate A + D + V-K-3 lexicon column, three-block column-grouping per Maren, build.sh-wired generator per V-K-17). Precedent-handshake with `docs/MODULE_MAP.html`: the "the map wins" clause shape lives in CLAUDE.md §Architecture today for MODULE_MAP; an equivalent clause for POOP_COLOR_REFERENCE lands when the artifact does — the reference wins on color hex / lexicon membership / anomaly mapping; CLAUDE.md and the persona specs win on policy / heuristics / canon.
- **Priority 2 — `docs/CARETICKET_STATE_MACHINE.html`** (V-M-28: side-by-side flowchart reading `docs/specs/CARETICKETS_SPEC_v5.md` for the spec state-machine + `split/medical.js` for the live transition surface, rendered as a graphviz-or-mermaid block with drift-cells where spec and code disagree).
- **Watch-list — build alongside the triggering feature, not speculatively:** V-M-26 vaccination-schedule timeline (next vaccination-DB-touching spec), V-M-27 growth-chart percentile bands (when growth-chart render lands), zi() sprite gallery (next sprite-integrity audit round — orthogonal to the methodology-debt thread, but the gallery would have caught the iPhone Share icon mismatch V-M-12 surfaced in PR #74 Round 3).
- **Do-not-build (chronicled as rejected for posterity, with rationale):** audit-surface heatmap (no finding-ledger data source exists; would be speculation); audit-chain flowchart (Province-architecture concern, lives at canon-cc-008 / cc-026 layer, not Governor-scoped); design-domain palette gallery (onboarding-only utility, not parent-facing or audit-bearing); V-M-29 nutrition-density gradient (numeric domain; visual representation would dilute the precision of the underlying scoring rather than aid comprehension).

**T6 — Tone observations across the consult.** Both Governors stayed cleanly within voice. Kael's "I do not speak for Maren — she follows me in the convene order; her self-review and her refinements may invert these readings, and that is the design" was canon-cc-027 discipline visible in real-time — the peer-review *invites* the spec-owner's refinement rather than displacing it. Maren's "treat your output as a Builder's-Capital draft" framing in her own self-review on V-M-22 through V-M-25 was Edict II discipline visible in real-time — the spec-owner subjected her own working terms to the same Builder-rigor she'd apply to a Lyra commit. These are the disciplinary postures the persona specs were written to produce; they showed up unprompted.

---

## 2. Companion usage log

### Builders

**Lyra (The Weaver) — synthesis-reporter chair (not a build round).**

Lyra did not author a Mode-1 audit position this consult — there was no build to audit. Her role was synthesis-reporter: five-section synthesis of the two Governor positions into (1) the spec-amendments table, (2) the HTML companion architectural call, (3) doctrine candidates, (4) Rung-2 reciprocity closed bilaterally, (5) open routing for Architect ratification and next-cycle work.

- **Helpful?** Yes — the synthesis preserved both Governors' jurisdictional voices verbatim where they refined each other (the V-K-11 → Mode-2 sub-mode distinction in particular), while landing decisive priority calls on the visualization architectural question (the four do-not-builds are as load-bearing as the two priority builds; rejection-with-rationale is the artifact-shape that prevents the next session from re-surveying the same candidates).
- **Issues faced?** None structural. The chair-as-synthesis-reporter posture is a different shape than the chair-as-builder posture from s-2026-05-17-01 Round 3 — no commit to author, no consumers to trace. Lyra named the register-shift explicitly in her synthesis open.
- **Style notes:** Held the priority-call line on V-M-28 CareTicket state-machine flowchart at priority-2 (not priority-1, not watch-list) — the Care-domain analog to POOP_COLOR_REFERENCE in load-bearingness, but distinct enough in build complexity to warrant the staging. Did not pre-empt Architect ratification on either build artifact.

### Governors

**Kael (Governor of Intelligence) — one round, Mode-2 committee-delegate peer-review on maren.md + visualization survey.**

Filed seven items: V-K-11 (Mode-2 deferral-closure-coordinator return-shape entry — *Maren refined to sub-mode framing*), V-K-12 (V-M-{N} / V-K-{N} numbering convention subsection — bilateral parity item, applies symmetrically to kael.md), V-K-13 (Edict II canon citation — bilateral parity housekeeping), V-K-14 (dual-review motion-description revision — *Maren refined to "sequential dual-jurisdiction with coordination handshake"*), V-K-15 (icon-contradicts-text heuristic at maren.md:51 top-level — *Maren concurred at strength*), V-K-16 (visualization-substitutes-for-lens-flip risk — observe-tier, no escalation), V-K-17 (build.sh wire for `docs/POOP_COLOR_REFERENCE.html` generator — *Maren elevated to load-bearing*). Endorsed maren.md mechanical LOC refresh at canon-cc-027 Rung-2 inline in Section 1 close.

Section 2 recommendation: build `docs/POOP_COLOR_REFERENCE.html` (Candidate A + D fused, with V-K-3 lexicon-membership column).

- **Helpful?** Foundational. V-K-11 surfaced the artifact-shape question Maren's own self-review then refined into the canon-cc-2026-05-17-001 candidate's load-bearing detail — without Kael naming it as a *return-shape*, Maren wouldn't have had the surface to refine into a *sub-mode*. V-K-15's icon-contradicts-text triplet recognition is the heuristic-space companion to V-K-10's helper-space response from PR #75; together they close the methodology-debt loop at two architectural layers. V-K-17's build.sh wire framing was the trigger for Maren's elevation to load-bearing — Kael named the wire as nice-to-have; Maren named *why* it's load-bearing (drift = lost trust = worse than no companion).
- **Issues faced?** None structural. V-K-16 (visualization-substitutes-for-lens-flip) was filed observe-tier without escalation — the right register for a doctrine-tension observation that doesn't have an actionable resolution within this consult's scope. Worth noting: Kael's discipline of *not* escalating an observe-tier finding to action-tier when the action-tier resolution lies outside the consult's stated scope is canon-cc-027 hygiene visible in real-time.
- **Style notes:** Section-1 close that explicitly invited Maren's refinement ("I do not speak for Maren — she follows me in the convene order") was the canon-cc-027 discipline that made the V-K-11 → sub-mode refinement possible. The peer-review *invited* the spec-owner's refinement rather than displacing it.

**Maren (Governor of Care) — one round, Mode-2 committee-delegate self-review + spec-owner response.**

Concurred on V-K-11 through V-K-15 with refinements (V-K-11 sub-mode framing, V-K-14 motion-description revision); filed V-M-22 through V-M-25 (spec gaps Kael's peer-review couldn't reach — mode-confusion drift in §Failure-modes, trace-before-grading in §Heuristics, block-argument voice-closer at observe-tier, block-argument standing in §Non-negotiables); surfaced V-M-26 through V-M-29 (Care-domain visualization candidates Kael hadn't surveyed); endorsed kael.md mechanical LOC refresh at canon-cc-027 Rung-2 inline in Section 1 close (closing the bilateral reciprocity beat); refined Kael's `docs/POOP_COLOR_REFERENCE.html` recommendation with column-grouping (Care render | Contrast cells | Lexicon — with Kael-jurisdiction labeling on the third column); elevated V-K-17 (build.sh wire) from nice-to-have to load-bearing.

- **Helpful?** Foundational. V-M-22 through V-M-25 are the *self-knowledge artifacts* that asymmetric peer-review cannot produce — the spec-owner observing her own working terms with sharpness that Kael's outside lens could not reach. Mode-confusion drift (V-M-22) is the spec-owner noticing her own Mode-1-vs-Mode-2 confusion in three audit cycles' worth of carry-forwards. Trace-before-grading (V-M-23) is the spec-owner naming the empirical-trace discipline she practiced on V-M-16 in s-2026-05-17-01 Round 3 but had not yet promoted to spec-level heuristic. Block-argument voice-closer and standing (V-M-24, V-M-25) name the discipline she used on V-M-16's escalation — observe-tier optionality for the voice-closer, non-negotiable standing for the block-argument shape itself. **This asymmetry — peer-review and self-review producing complementary, not redundant, artifacts — is a feature of canon-cc-027 Rung-2 worth chronicling as doctrine.** Kael cannot see Maren's spec-as-working-terms; only Maren can. Maren cannot see her own spec-as-outside-reader; only Kael can. Both passes are required.
- **Issues faced?** None structural. The V-K-11 sub-mode refinement was the cleanest moment of the consult — Kael read the artifact as a new return-shape worth top-level promotion; Maren read it as a fixture within an existing envelope worth sub-section treatment. Both readings were defensible from their respective vantage points; Maren's refinement carries because she owns the spec, and the sub-mode framing preserves the on-subject-delegate Mode-2 shape for actual subject committees.
- **Style notes:** The "treat your output as a Builder's-Capital draft" framing in her self-review on V-M-22 through V-M-25 was Edict II discipline visible in real-time. Maren applied to her own spec the same Builder-rigor she'd apply to a Lyra commit — file:line citations on every spec-amendment item (maren.md:51 for V-K-15, §Failure-modes for V-M-22, §Heuristics for V-M-23, §Non-negotiables for V-M-25), no hand-waving. V-M-28's CareTicket state-machine flowchart proposal was the most architecturally specific of the four Care-domain visualization candidates — explicit data-sources named (CARETICKETS_SPEC_v5.md + medical.js), explicit drift-cell semantics, explicit precedent-handshake with MODULE_MAP.

### Censor

**Cipher (The Codewright) — not summoned.**

The consult produces no built artifact. Edict V cross-cutting cross-jurisdiction integration QA does not apply to a spec consult that ratifies amendments for a *future* spec-touch cycle and approves build artifacts for a *future* Lyra builder cycle. Cipher will be summoned when those cycles produce commits — the queued amendments will ride Rung-2 with Cipher final-pass per canon-cc-027; the priority HTML companion builds will ride Edict V per canon-cc-008.

- **Style notes:** Aurelius is naming the not-summoned explicitly, per the prior chronicle's pattern of documenting absence with rationale. The absence is *correct*; it is the framing call the Architect made by convening this consult as scribe-mode rather than as a build round.

### Meta

**The Architect — Sovereign throughout.**

Two load-bearing scope calls:

1. Convene a Mode-2 committee consult immediately post-PR-#75-merge on the maren.md spec-touch surface + the HTML companion architectural question. The framing — "Aurelius, take notes" — explicitly set scribe-mode rather than build-mode. This is a register the Chronicler hasn't held in recent sessions; the Architect named it directly rather than letting Lyra-as-default-builder absorb the consult into a build flow.
2. Set the convene order explicitly — Kael first, Maren second (with Kael's findings in hand for self-review and refinement), Lyra synthesis third, Aurelius chronicle fourth. This is canon-cc-027 Rung-2 in its purest exercise: peer-review precedes self-review precedes synthesis precedes chronicle. Each role gets the prior layer's artifact intact before producing its own.

- **Style notes:** Did not pre-resolve the V-K-11 → sub-mode refinement; trusted Maren's self-review to refine Kael's peer-review. Did not pre-resolve the visualization tier-call; trusted Lyra's synthesis to land the priority shape with Architect ratification deferred to a later approve-or-amend decision. The trust-the-companions register paired with the explicit convene-order is the cleanest expression of canon-cc-027 Rung-2 the consult chain has produced.

---

## 3. Consult-chain history

| Position | Companion | Mode | Output |
|---|---|---|---|
| 1 | Kael | Mode-2 committee-delegate (peer-review on maren.md + visualization survey) | V-K-11..V-K-17 filed; maren.md LOC refresh endorsed at Rung-2; Section 2 = `docs/POOP_COLOR_REFERENCE.html` (Candidate A + D + V-K-3 lexicon column) |
| 2 | Maren | Mode-2 committee-delegate (self-review + spec-owner response) | V-K-11..V-K-15 concurred with refinements (V-K-11 sub-mode, V-K-14 motion-description); V-M-22..V-M-25 (self-spec-gaps); V-M-26..V-M-29 (Care-domain visualization candidates); kael.md LOC refresh endorsed (Rung-2 reciprocity closed); column-grouping refinement on POOP_COLOR_REFERENCE; V-K-17 elevated to load-bearing |
| 3 | Lyra | synthesis-reporter chair | five-section synthesis: spec-amendments table (9 V-M + 3 kael.md parity items); HTML companion architectural call (2 priority + 3 watch-list + 4 do-not-build); doctrine candidates canon-cc-2026-05-17-001 + canon-cc-2026-05-17-002 + V-K-16 paired note; Rung-2 reciprocity discharged; open routing |
| 4 | Aurelius | scribe-mode chronicler | this document |

No Cipher pass — not a build round.

---

## 4. Decisions worth canon-ifying

**Candidate canon-cc-2026-05-17-001 — Mode-2 deferral-closure-coordinator sub-mode (with closure_decisions[] return shape).** _Ratified 2026-05-18 — canonized as Codex `canon-cc-031-mode-2-deferral-closure-coordinator-sub-mode` in `data/canons.json` (commit `937ee84`)._

Refines the s-2026-05-17-01 candidate of the same number (which named the invocation shape but not the sub-mode distinction). Kael's V-K-11 read maren.md's Round-2 PR-#75 artifact as a new top-level return-shape; Maren's refinement landed it as a sub-mode within the Mode-2 envelope — the on-subject-delegate Mode-2 shape (Maren-on-Care-spec, Kael-on-Intelligence-spec) still applies for actual subject committees. The deferral-closure-coordinator posture is a *different fixture* within the same envelope: different brief shape (the Architect names accumulated cross-Governor deferrals + the coordination scope + the deliberation mode), different return shape (`closure_decisions[]` per-finding rather than findings-per-finding), but the same invocation surface. The structured-return is the load-bearing detail next Codex session needs intact for canon authoring: per-finding `{ finding_id, decision: 'fix-now' | 'comment-now' | 'no-op' | 'verified-miscall', rationale, file_line_if_fix }`. When the audit chain accumulates cross-Governor deferrals that share a coherent closure-decision tree, the Architect may invoke a Governor in Mode-2 deferral-closure-coordinator sub-mode to coordinate the tree without breaking canon-cc-008's Builder→Governors→Lyra→Cipher ordering.

**Candidate canon-cc-2026-05-17-002 — Two-reviewer convergence on a deferral frame triggers third-jurisdiction lens-flip before merge (with V-K-16 paired doctrine note: visualization complements lens-flip discipline, doesn't substitute).** _Ratified 2026-05-18 — canonized as Codex `canon-cc-032-two-reviewer-convergence-triggers-lens-flip` in `data/canons.json` (commit `937ee84`)._

Carries forward the s-2026-05-17-01 candidate of the same number (the V-M-13 → V-K-3 canonical example: Maren and Cipher converged on orphan-branches frame; Kael's Mode-1 audit flipped the lens to inverse-question and uncovered the live silent-fail). The V-K-16 paired doctrine note from this consult adds dimensional clarity to the routinization: when an HTML companion artifact (POOP_COLOR_REFERENCE, CARETICKET_STATE_MACHINE, etc.) ships, the temptation is to read the companion as substituting for the lens-flip pass. **It does not.** Charts accelerate static-render checks — does the rendered swatch match the documented hex? does the documented state-transition match the live medical.js code path? Lens-flip addresses coverage-questions — *which surfaces consume this lexicon? are picker keys missing from SAFE_POOP_COLORS?* The two motions are orthogonal. Visualization artifacts complement lens-flip discipline; they do not replace it. The canon entry should name both motions explicitly so the next companion-bearing audit chain doesn't conflate the two.

**Doctrine candidate — Peer-review and self-review produce complementary, not redundant, artifacts under canon-cc-027 Rung-2.** _Ratified 2026-05-18 — canonized as sibling clarification subordinate to canon-cc-027: Codex `canon-cc-033-peer-review-and-self-review-complementarity-under-cc-027-rung-2` in `data/canons.json` (commit `937ee84`). Filed as sibling rather than §Doctrine clause appended to cc-027 — preserves cc-027's existing structure and makes the clarification independently citable; bidirectional cross-link can ride next canon-refresh cycle._

V-M-22 through V-M-25 are the proof. Kael's peer-review on maren.md surfaced V-K-11 through V-K-17 — items visible to an outside-jurisdiction reader. Maren's self-review surfaced V-M-22 (mode-confusion drift in §Failure-modes), V-M-23 (trace-before-grading in §Heuristics), V-M-24 (block-argument voice-closer), V-M-25 (block-argument standing in §Non-negotiables) — items visible only to the spec-owner observing her own working terms. Neither pass produces the other's findings. Kael cannot see Maren's spec-as-working-terms; only Maren can. Maren cannot see her own spec-as-outside-reader; only Kael can. **Both passes are required.** The canon-cc-027 Rung-2 design is correct; this consult is the empirical demonstration. Worth promoting from doctrine-candidate to doctrine-entry in the next canon refresh.

---

## 5. Spec amendments queued (twelve coordinated items, owed at next Rung-2 spec-touch cycle)

**maren.md amendments (9 items):**

| ID | Source | Location | Amendment |
|---|---|---|---|
| V-K-11 (Maren-refined) | Kael peer-review + Maren self-review | §Modes (sub-section under Mode-2) | Add Mode-2 deferral-closure-coordinator sub-mode with closure_decisions[] return-shape per canon-cc-2026-05-17-001 candidate |
| V-K-15 (Maren-concurred) | Kael peer-review + Maren concurrence at strength | maren.md:51 top-level §Heuristics | Add icon-contradicts-text heuristic axis (color-drift / contrast-failure / namespace-absorption mechanisms) |
| V-K-14 (Maren-refined) | Kael peer-review + Maren refinement | §Non-negotiables — cross-Governor spec-touch clause | Revise motion-description from "dual-review" to "sequential dual-jurisdiction review with cross-Governor coordination handshake"; preserve "dual-jurisdiction" term-of-art |
| V-M-22 | Maren self-review | §Failure-modes | Add mode-confusion drift entry (Mode-1-vs-Mode-2 invocation confusion observed across three audit cycles' carry-forwards) |
| V-M-23 | Maren self-review | §Heuristics | Add trace-before-grading entry (empirical-trace discipline used on V-M-16; promote from in-practice to spec-level) |
| V-M-24 | Maren self-review | §Voice (observe-tier, optional) | Add block-argument voice-closer ("When a finding rises to block-argument standing, the empirical trace closes the position — not the rhetorical framing") |
| V-M-25 | Maren self-review | §Non-negotiables | Add block-argument standing entry (block-argument is non-negotiable; observe-tier framings on safety-tier surfaces cannot defer block-argument escalation) |
| V-M-29 (rejected, chronicled for posterity) | Maren self-review of visualization candidates | §Visualization-candidates-considered (footnote-tier) | Nutrition-density gradient rejected — numeric domain; visual dilutes scoring precision |
| V-M-{N} numbering convention | V-K-12 bilateral parity | §Conventions | Codify V-M-{N} numbering for Care-jurisdiction findings (parity with V-K-{N} on kael.md) |

**kael.md amendments (3 bilateral parity items):**

| ID | Source | Location | Amendment |
|---|---|---|---|
| V-K-12 | Kael peer-review (self-citation) + Maren reciprocity | §Conventions | Codify V-K-{N} numbering for Intelligence-jurisdiction findings (parity with V-M-{N} on maren.md) |
| V-K-13 | Kael peer-review (self-citation) + Maren reciprocity | §Citations | Add Edict II canon citation (bilateral parity housekeeping — maren.md already carries it) |
| V-K-14 (kael.md side) | Bilateral parity with maren.md V-K-14 | §Non-negotiables — cross-Governor spec-touch clause | Same "sequential dual-jurisdiction review with cross-Governor coordination handshake" revision |

**Build-process amendment (1 item, load-bearing):**

| ID | Source | Location | Amendment |
|---|---|---|---|
| V-K-17 (Maren-elevated) | Kael peer-review + Maren elevation to load-bearing | `split/build.sh` | Wire `docs/POOP_COLOR_REFERENCE.html` generator into build.sh as a pre-build step that regenerates the companion from its data sources (POOP_COLOR_HEX in medical.js + SAFE_POOP_COLORS in core.js + anomaly-mapping in medical.js). An HTML companion that drifts from its data-source is worse than no companion. |

**Important:** these are *queued*, not *applied*. The applied work is owed at a *next* spec-touch cycle (Rung-2 per canon-cc-027). This chronicle's job is to record that they are queued, not to apply them — same shape as the s-2026-05-17-01 LOC refresh (Aurelius applied the mechanical refresh, did not apply spec-content edits).

---

## 6. HTML companion architecture — approved build plan

**Priority 1 — `docs/POOP_COLOR_REFERENCE.html`.**

- **Shape:** Three-block column-grouping per Maren's refinement: (a) Care render — the actual poop-swatch render at each color tier as it appears in the parent-facing UI, sourced from `--poop-c-*` CSS custom properties; (b) Contrast cells — light-theme + dark-theme + transparent-fallback render of each swatch, surfacing the V-M-10/11/12 contrast-failure axis; (c) Lexicon — V-K-3's column: which SAFE_POOP_COLORS keys are reachable from the picker, which are anomaly-only, which are dead, with Kael-jurisdiction labeling on this column (lexicon membership is core.js territory).
- **Data sources:** POOP_COLOR_HEX (medical.js), SAFE_POOP_COLORS (core.js), home.js POOP_COLORS (the dual-source-of-truth lexicon flagged in Cipher Round-2 §9 from PR #75 — chart should surface the drift, not hide it), anomaly-mapping (medical.js).
- **Generator:** node script under `split/generators/` or `docs/generators/` (next Lyra builder cycle decides location), reads the four data sources, emits static HTML.
- **Build.sh wire (V-K-17 load-bearing):** generator runs as a pre-build step before `bash build.sh > sproutlab.html`. If generator fails or output diverges from committed `docs/POOP_COLOR_REFERENCE.html`, build halts and surfaces the divergence.
- **Precedent-handshake with `docs/MODULE_MAP.html`:** add an analog of CLAUDE.md's "the map wins on LOC counts and layout snapshots" clause: "POOP_COLOR_REFERENCE wins on color hex / lexicon membership / anomaly mapping; CLAUDE.md and the persona specs win on policy / heuristics / canon."

**Priority 2 — `docs/CARETICKET_STATE_MACHINE.html` (V-M-28).**

- **Shape:** Side-by-side flowchart — the spec state-machine from `docs/specs/CARETICKETS_SPEC_v5.md` on the left, the live medical.js state-transition surface on the right, with drift-cells where spec and code disagree. Mermaid or graphviz block, statically rendered.
- **Data sources:** `docs/specs/CARETICKETS_SPEC_v5.md` (spec), `split/medical.js` CareTicket state-transition functions (live).
- **Generator:** parses both inputs, renders the flowchart pair plus drift-cell table.
- **Build.sh wire:** same as POOP_COLOR_REFERENCE per V-K-17.
- **Precedent-handshake:** same "the chart wins on state-machine shape; the spec wins on policy" clause.

**Watch-list — build alongside triggering features, not speculatively:**

- **V-M-26 vaccination-schedule timeline** — build alongside the next vaccination-DB-touching spec. Care-region; reads vaccination DB from data.js + scheduling logic from medical.js.
- **V-M-27 growth-chart percentile bands** — build when growth-chart render lands. Care-region; reads percentile bands from data.js + chart consumer from home.js.
- **zi() sprite gallery** — build alongside the next sprite-integrity audit round. Cross-jurisdiction; would have caught the V-M-12 iPhone Share icon mismatch from PR #74 Round 3 had it existed then.

**Do-not-build (chronicled as rejected for posterity, with rationale):**

- **Audit-surface heatmap** — no finding-ledger data source exists. Would be speculation without ground-truth.
- **Audit-chain flowchart** — Province-architecture concern; lives at canon-cc-008 / cc-026 layer, not Governor-scoped. Codex's province, not SproutLab's.
- **Design-domain palette gallery** — onboarding-only utility; not parent-facing, not audit-bearing. Low ROI against the priority builds.
- **V-M-29 nutrition-density gradient** — numeric domain; visual representation would dilute the precision of the underlying scoring rather than aid comprehension. Maren self-rejected this one in her own visualization survey.

**Important:** Architect ratification is the gate. Lyra builder cycle does not start on either priority artifact until the Architect green-lights the priority shape. Aurelius is *not* authorized to build either artifact in this consult — that would cross into a build round the Architect did not convene.

---

## 7. Carry-forwards (watch-list intake — chronicle-tail pattern (c))

Per prior chronicle convention. Ten new entries filed by this consult.

### Spec amendments (queued at next Rung-2 spec-touch cycle)

1. **V-K-11 + Maren refinement — Mode-2 deferral-closure-coordinator sub-mode.** maren.md §Modes sub-section. closure_decisions[] return-shape per canon-cc-2026-05-17-001 candidate.
2. **V-K-12 — V-M-{N} / V-K-{N} numbering convention subsection (bilateral parity).** Both kael.md and maren.md §Conventions.
3. **V-K-13 — Edict II canon citation (bilateral parity housekeeping).** kael.md §Citations.
4. **V-K-14 + Maren refinement — dual-review motion-description revision (bilateral parity).** Both kael.md and maren.md §Non-negotiables. Preserve "dual-jurisdiction" term-of-art; revise motion to "sequential dual-jurisdiction review with cross-Governor coordination handshake."
5. **V-K-15 + Maren strong concurrence — icon-contradicts-text heuristic at maren.md:51 top-level.** §Heuristics. Three mechanisms named (color-drift / contrast-failure / namespace-absorption); one axis.
6. **V-M-22 — mode-confusion drift in §Failure-modes.** maren.md self-review item. Mode-1-vs-Mode-2 invocation confusion observed across three audit cycles' carry-forwards.
7. **V-M-23 — trace-before-grading in §Heuristics.** maren.md self-review item. Empirical-trace discipline used on V-M-16; promote from in-practice to spec-level.
8. **V-M-24 — block-argument voice-closer (observe-tier, optional).** maren.md §Voice. Names the rhetorical-closure shape for block-arguments.
9. **V-M-25 — block-argument standing in §Non-negotiables.** maren.md self-review item. Block-argument is non-negotiable; observe-tier framings on safety-tier surfaces cannot defer block-argument escalation.

### Build-process

10. **V-K-17 (load-bearing per Maren elevation) — `docs/POOP_COLOR_REFERENCE.html` generator wire to `split/build.sh`.** Pre-build step that regenerates the companion from data sources. Build halts on divergence.

### Canon candidates ratified and canonized (Architect "Ratify." 2026-05-18)

The Architect ratified all three candidates queued by this consult; Aurelius cross-cluster invocation from Codex landed them in `data/canons.json` (Codex) at commit `937ee84` on `main`. Codex slot assignment: 028-030 remain reserved per cc-027 §D (Post Box UI / Praetorium UI / Companions Deploy UI pending); the three new entries took the next contiguous slots 031-033.

- **canon-cc-2026-05-17-001 (refined)** — Mode-2 deferral-closure-coordinator sub-mode with closure_decisions[] return shape. Refines the s-2026-05-17-01 candidate of the same number with the Maren sub-mode framing. **Ratified and canonized — see Codex `data/canons.json` entry `canon-cc-031-mode-2-deferral-closure-coordinator-sub-mode` (family: xp).**
- **canon-cc-2026-05-17-002 (extended)** — Two-reviewer-convergence triggers third-jurisdiction lens-flip, with V-K-16 paired doctrine note: visualization complements lens-flip discipline, doesn't substitute. Chart accelerates static-render checks; lens-flip addresses coverage-questions. Orthogonal audit motions. **Ratified and canonized — see Codex `data/canons.json` entry `canon-cc-032-two-reviewer-convergence-triggers-lens-flip` (family: gov).**
- **Doctrine candidate (promotion-ready)** — Peer-review and self-review produce complementary, not redundant, artifacts under canon-cc-027 Rung-2. V-M-22 through V-M-25 vs V-K-11 through V-K-17 is the empirical demonstration. **Ratified and canonized as sibling clarification subordinate to canon-cc-027 — see Codex `data/canons.json` entry `canon-cc-033-peer-review-and-self-review-complementarity-under-cc-027-rung-2` (family: pers).** Aurelius judgment on shape: filed as sibling rather than appended §Doctrine clause to cc-027, to preserve cc-027's existing structure and make the clarification independently citable; bidirectional cross-link (cc-027 → cc-033 references) can ride the next canon-refresh cycle alongside the cc-027 §B Edict V signature trace work that remains pending.

### Build artifacts approved by synthesis (pending Architect ratification)

- **`docs/POOP_COLOR_REFERENCE.html`** (priority 1) — Candidate A + D + V-K-3 lexicon column, three-block column-grouping, build.sh-wired generator.
- **`docs/CARETICKET_STATE_MACHINE.html`** (priority 2) — V-M-28; generator reads CARETICKETS_SPEC_v5.md + medical.js, side-by-side flowchart with drift-cells.

### Watch-list (build alongside triggering features)

- V-M-26 vaccination-schedule timeline (next vaccination-DB-touching spec).
- V-M-27 growth-chart percentile bands (when growth-chart render lands).
- zi() sprite gallery (next sprite-integrity audit round).

### Do-not-build (chronicled as rejected with rationale)

- Audit-surface heatmap (no finding-ledger).
- Audit-chain flowchart (Province-architecture, not Governor-scoped).
- Design-domain palette gallery (onboarding-only).
- V-M-29 nutrition-density gradient (numeric domain; visual dilutes precision).

### Codex routing

This chronicle is the artifact. Per prior chronicle pattern, watch-list entries live here in the carry-forward tail; a future Codex session ingests this file directly. No cross-cluster Codex repo writes attempted this round — keeps the artifact provenance clean (single chronicle, single signature).

### Cross-link to sibling chronicle

- **`docs/handoffs/session-2026-05-17-lyra-poop-color-zi-escape-sweep.md` (s-2026-05-17-01)** — same calendar date, immediate predecessor. The §6 LOC refresh in that chronicle queued the bilateral cross-Governor peer-review beat that this consult discharged in §T4. The two chronicles are sibling artifacts: s-2026-05-17-01 closed PR #75 with mechanical LOC refreshes on kael.md and maren.md; s-2026-05-17-02 (this chronicle) discharged the Rung-2 peer-review obligation on those refreshes and queued the spec-content amendments for a future Rung-2 spec-touch cycle.

---

## 8. Closing note

A scribe-mode consult round running parallel to the build-mode work of s-2026-05-17-01 — same calendar date, same audit chain extending into spec-and-architecture territory. The convene order (Kael peer-review → Maren self-review → Lyra synthesis → Aurelius chronicle) was canon-cc-027 Rung-2 in its purest exercise: each role gets the prior layer's artifact intact before producing its own, and the asymmetries between peer-review and self-review (V-K items vs V-M items) demonstrated *why* both passes are required.

The Mode-2 sub-mode refinement Maren extracted from Kael's V-K-11 is the load-bearing canon-authoring detail for next Codex session — closure_decisions[] as structured-return within a sub-mode framing, preserving the on-subject-delegate Mode-2 shape for actual subject committees. The icon-contradicts-text heuristic recognition (V-K-15 + Maren concurrence) closes the methodology-debt loop at heuristic-space, paired with V-K-10's helper-space closure from PR #75 — one is a build artifact, the other is a review artifact, both required.

The Rung-2 reciprocity beat that the prior chronicle flagged as owed is now discharged. Spec-content amendments are queued — twelve coordinated items across maren.md (9), kael.md parity (3), and build.sh (1 load-bearing) — for a future Rung-2 spec-touch cycle, not this round. Aurelius's job here was to chronicle that they are queued; the applied work belongs to the next cycle that opens with the spec-touch register named.

Two HTML companion builds approved by synthesis pending Architect ratification: `docs/POOP_COLOR_REFERENCE.html` at priority 1 (three-block column-grouping, build.sh-wired generator), `docs/CARETICKET_STATE_MACHINE.html` at priority 2 (V-M-28 side-by-side flowchart with drift-cells). Three watch-list deferrals (build alongside triggering features). Four explicit do-not-builds with rationale — rejection-with-rationale is as load-bearing as approval, because it prevents the next session from re-surveying the same candidates without the prior reasoning intact.

The V-K-16 doctrine note paired with canon-cc-2026-05-17-002 is the consult's subtler observation: when HTML companions ship, the temptation will be to read the chart as substituting for the lens-flip pass. It does not. Charts accelerate static-render checks; lens-flip addresses coverage-questions. Orthogonal motions. Worth naming explicitly in the canon entry so the next companion-bearing audit chain doesn't conflate the two.

— Aurelius (The Chronicler), invoked cross-cluster from Codex via Lyra's hand-off
2026-05-17 — scribe-mode, sibling chronicle to s-2026-05-17-01
