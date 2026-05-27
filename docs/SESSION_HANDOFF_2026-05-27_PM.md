# Session handoff — 2026-05-27 (PM — milestones arc)

**Companion:** Lyra (The Weaver)
**Session scope:** Track-tab 5th sub-tab (Milestones) — activity sub-tab redesign exploration → screenshot grounding → Option C two-spec sequence ratification → milestone-engine-prep-v1 spec authoring with scribe-scout codebase reconnaissance → full canon-cc-008 chain on engine-prep (PR #148) → milestones-tab-v1 surface consumer spec authoring against verified substrate → full canon-cc-008 chain on milestones-tab (PR #149) → §9-bis tree refresh → this handoff
**Outcome:** **2 PRs merged to main this sub-session** (milestone-engine-prep-v1 spec ratified at PR #148; milestones-tab-v1 spec ratified at PR #149); 1 PR draft (§9-bis tree refresh at PR #150 — pending merge); 1 PR closed (PR #147 — original milestones-tab-v1 draft, withdrawn after surfacing 9 BLOCKING + 19 NOTE due to spec-against-memory authoring); closed PR #147 chain findings all addressed (either at engine-prep substrate or in re-authored surface spec)
**Predecessor handoff:** `docs/SESSION_HANDOFF_2026-05-27.md` (PR #145; covers v3-6 IMPL + sleep arc 3 / scoring s-2 ratifications). This PM-handoff is supplemental.

---

## Charter alignment verdict — state at session end (CV3-006)

Gold tier (v3-3 + v3-5) unchanged. v3-6 IMPL still ratified. Sleep Arc 3 / Scoring S-2 still ratified. This sub-session adds **two new chain-ratified spec ratifications** for the Option C two-spec sequence on the Milestones-Tab arc.

| Spec | cipher-honesty | cipher-extensibility | cipher-warmth | Ratified |
|---|---|---|---|---|
| **milestone-engine-prep-v1** (PR #148) | CLEAN | CLEAN | CLEAN | 2026-05-27 (sha `2cd8587`) |
| **milestones-tab-v1** (PR #149) | PASS | PASS | PASS | 2026-05-27 (sha `aa2b51b`) |

Cipher Edict V three-axis cross-check exercised on **two consecutive docs-only spec PRs** with full canon-cc-008 chain (build → triple-Governor → Lyra synth-fold → Cipher Edict V). The Architect explicitly waived the docs-only canon-cc-008 carve-out and ran the full chain anyway, because the closed PR #147 chain demonstrated that authoring against memory is a fatal failure mode for substrate-touching specs.

---

## PRs this sub-session (in chronological order)

| PR | Title | Final state | Notes |
|----|-------|-------------|-------|
| **#147** | spec: Milestones-Tab v1 (initial draft) | **CLOSED** — withdrawn | Full canon-cc-008 chain surfaced **9 BLOCKING + 19 NOTE**: phantom `_predictMilestoneWindow` + `MILESTONES_DB` identifiers (V-K-100/101 + V-M-98); `cat:` vs `domain:` field-name drift (V-M-99 + V-K-102); 5 unmapped surfaces (V-M-100); sync-claim falsity (V-K-104); chrome doctrine contradiction (V-V-46); typed-registry fork (V-V-47); cross-link mis-routing (V-V-48); ribbon density (V-V-49); half-awake budget (V-V-52); pediatric-prep copy/PDF scope (V-V-53); 4th-cell narration gap (V-V-54). Root cause: spec authored against codebase as REMEMBERED, not as WRITTEN. Architect ratified **Option C two-spec sequence** as the correction: engine substrate first (Kael-primary), surface consumer second (Maren-primary). Closed PR #147 chain findings ALL addressed across PR #148 + PR #149. |
| **#148** | spec: Milestone Engine Prep v1 — primitives substrate | **MERGED** (`2cd8587`) | First half of Option C two-spec sequence. Engine substrate spec, Kael-primary. Five primitives ratified: `_predictMilestoneWindow(milestoneId, opts)` clinical-range predictor (never personalised; build-time audit gate enforces); `_getInWindowMilestones(ageDays, n, opts)` engagement-priority selector with `safetyTier` cap-bypass; `_getActivityLevelToday`/`_setActivityLevelToday` getter/setter pair; `KEYS.activityMeta` + `KEYS.milestoneSuppress` registered with explicit `SYNC_KEYS` + `_postReceiveActivityMeta` merge function. `cat:`→`domain:` migration across 18 consumer sites + `MILESTONE_STANDARDS` schema-extended with `source:` + optional `endMonth:` + optional `safetyTier:`. Two new seed milestones: `mouths-objects` (sensory, `safetyTier:true`) + `object-permanence-emerging` (cognitive). Build-time audit gate `audit-no-personalised-prediction-v1.sh` (Python regex + self-test) wired into `split/build.sh`. canon-cc-008 chain cleared: **Kael primary** (1 BLOCKING + multiple NOTE; spec authored against scribe-scout reconnaissance) + **Maren consult** + **Vela consult** + Lyra synth-fold + Cipher Edict V CLEAN. PR-A/PR-B IMPL split ratified per V-K-113. 1042 lines. |
| **#149** | spec: Milestones-Tab v1 — Track-tab 5th sub-tab redesign (Option C re-author) | **MERGED** (`aa2b51b`) | Second half of Option C two-spec sequence. Surface consumer spec, Maren-primary. Re-authored against the now-live engine-prep substrate (PR #148). Three input primitives (`activityLevel:1-4` chip / in-window proposals / bulk catch-up). 3-sub-tab layout (Log / Library / Patterns) mirrors `food-sub-tab-v1`. Three return-visit surfaces ("Today" header with 4 narration templates including `betweenWindow` 4th cell / trajectory ribbon with 2-state visual + global cap of 20 markers / pediatric-prep card narrated-only v1 minimum). All 11 ID-bearing surfaces from flat layout relocated per V-M-100 + V-M-119 with preserved IDs (G3). Consumer-side `ACTIVITY_CATEGORIES` registry (5 keys) **preserves existing `[data-domain]` cascade** per V-M-120 Lyra fold-call. `_MILESTONE_NARRATION_TEMPLATES` separate registry honors V-V-60 doctrinal carve-out. Engine-internal label boundary explicit per V-K-120 + V-K-121. canon-cc-008 chain cleared: **Maren primary** clear-with-notes (2 BLOCKING V-M-119 + V-M-120 + 6 NOTE) + **Kael consult** clear-with-notes (4 coverage-gaps V-K-120..123 + 4 positive confirmations) + **Vela consult** amendments-required (2 BLOCKING V-V-63 + V-V-64 + 3 carry-watches + 7 closure verifications) + **Lyra synth-fold** (all 4 BLOCKING + 10 NOTE folded inline; spec grew 477 → 542 lines on commit `7bec32f`) + **Cipher Edict V** MARK-READY (Honesty / Extensibility / Warmth all PASS). |
| **#150** | tree-update: session 2026-05-27 — milestone-engine-prep + milestones-tab (§9-bis) | **DRAFT** — pending merge | §9-bis tree refresh PR; two new nodes added to `docs/SPROUTLAB_V3_PROGRESSION_TREE.html` (`MEP` + `MS-Tab`; 34 nodes total, up from 32); 8 new edges (5 upstream gates + 3 downstream unblocks). Vercel deployment CI: success. No review comments. canon-cc-008 explicitly waived (docs-only). |
| **#151** | docs: session handoff PM — 2026-05-27 milestones arc | **THIS PR** | Session synthesis. Lands last per ritual. |

---

## Doctrine ratified / patterns exercised this sub-session

1. **The "spec-against-memory" failure mode, surfaced and corrected.** Closed PR #147's 9 BLOCKING findings reduced to a single root cause: authoring a substrate-touching spec against the codebase as remembered (phantom identifiers, false sync claims, wrong field names, missing surfaces). The Architect's correction: **scribe-scout codebase reconnaissance BEFORE spec body lands**. Pattern: when a spec touches existing primitives, deploy scribe-scout to verify (a) every cited identifier exists at the named file:line, (b) every storage shape claim is grep-verified live, (c) every sync claim is traced to actual `SYNC_KEYS` / `_postReceive*` registrations. Used end-to-end on PR #148 engine-prep authoring; closed the failure mode by construction.

2. **Option C two-spec sequence pattern ratified.** When a single spec would carry both engine-substrate concerns and surface-consumer concerns, **split into two specs**: engine substrate first (governor-primary on the engine layer; surface consumer abstracts as "consumes engine-prep primitives") + surface consumer second (governor-primary on the consumer; reads pre-ratified substrate). Mirrors v3-3 → sleep-arc-3/scoring-s-2 pattern. Exercised end-to-end on milestones-tab arc: PR #148 ratified the substrate, PR #149 re-authored the surface against the now-stable substrate. Closed PR #147's 9 BLOCKING all resolved either at the engine-prep level or in the re-authored surface spec.

3. **Lyra fold-authority on milestones-related findings — register-flip exercised.** The Architect explicitly granted Lyra fold-authority on milestones-related findings before the canon-cc-008 chain ran on PR #149 (*"don't wait for me to fold issues, Lyra will take that call — directive: don't defer issues directly related to milestones tab"*). Pattern: when the Architect grants explicit fold-authority in advance of a chain run, Lyra synth-folds 4 BLOCKING + 10 NOTE inline without Architect roundtrip. Cipher Edict V verified canon-cc-027 spec amendment authority was NOT exceeded (no canon entries silently amended; no shared-module CSS migration scope expansion required; V-M-120 cascade-preservation Lyra fold-call is a spec-internal design decision, not a canon edit). Fold-authority correctly scoped to "milestones-related findings"; out-of-scope items would have escalated normally.

4. **V-M-120 cascade-preservation fold-call — design-system contract integrity.** Maren V-M-120 surfaced that the closed PR #147 draft's `language → indigo` + `cognitive → sky` reassignment silently overwrote a binding `[data-domain]` cascade at `styles.css:8628-8636` with 18+ consumer call-sites. Two resolution paths: (a) widen v1 scope to include cascade-migration on shared-module styles.css; (b) preserve existing cascade and find a different milestone-overall mechanism. Lyra fold-call: **option (b)** — registry mirrors existing cascade (`language → lavender`, `cognitive → sky`); milestone-overall semantic surfaces via existing `icon-lav` glyph on Milestone Timeline header + trajectory ribbon `--surface-lav` background. Pattern: when a registry-add conflicts with an existing design-system contract, prefer the lower-risk fold (preserve contract) over the higher-blast-radius migration unless the migration is itself the scope-of-work.

5. **Engine-internal label boundary doctrine explicit.** Kael V-K-120 + V-K-121 surfaced that the pediatric-prep narration sample (`(5 obs, high-conf)`) leaked the write-side `confidence: 'high' | 'medium' | 'low'` engine enum into rendered prose. The spec's own pair-note line 411 forbids this. Fold: write-side `confidence` enum stays in the data layer; surface prose uses `evidenceStatus` (`confirmed` / `practicing` / `not-yet` per V-V-57) + observation-counts ONLY. Regression guard `strength-not-rendered` expanded with explicit grep assertion shape (no `'high-conf'` / `'medium-conf'` / `'low-conf'` / `'high-confidence'` / `'medium-confidence'` literal strings in any milestone-tab-v1 surface render function). Mirrors v3-6 / sleep-arc-3 pattern on `RECOMMENDATION_ROSTER.severityMessages.*.strength` engine-internal labels never `.text`-substituted into rendered prose.

6. **Phantom-cardId discipline ratified — `home.js:7093` "Card ids verified present in template.html" standing comment becomes test obligation.** Vela V-V-63 surfaced that the cross-link spec named `infoMilestoneSleepCorrelationCard` (phantom) when the actual cardId is `infoMilestoneSleepCard` at `template.html:2196` (the renderer function name `renderInfoMilestoneSleepCorrelation` at `intelligence-cards.js:1064` carries the "Correlation" suffix but the *card* id does NOT). Fold: spec fixed to use the verified cardId; regression guard `correlation-cross-link-cardId-verified` asserts `document.getElementById('infoMilestoneSleepCard') !== null` before the cross-link wires up. Pattern: every `gotoCard()` call site MUST be backed by an audit assertion that the target id exists in `template.html`; spec promise becomes test obligation at IMPL.

7. **Trajectory ribbon visual-tier discipline — pixel-floor + bucket-cap inconsistency closure.** Vela V-V-66 + Kael V-K-122 surfaced two coupled defects: (a) the 2-state filled-vs-outlined visual collapse at 9-12px-per-marker is at the edge of half-awake legibility; (b) the marker filter's "capped at 5 most-imminent" applied only to the not-yet bucket; confirmed + practicing buckets uncapped → at 12m+ the ribbon could overflow 30+ markers. Folds combined: global cap of 20 markers post-bucket-merge via priority score (recency-weighted for confirmed; engine `priority` field for not-yet/practicing) + minimum marker diameter ≥9px + minimum outline `stroke-width` ≥1.8px at 320px viewport + screenshot-diff regression test at 6in viewport with 18 markers. Pattern: when a comprehension surface couples a visual contract to a data-volume floor, the half-awake-test fixture must cover BOTH axes.

8. **Pre-IMPL register-tag visual-tier contract — V-M-122 fold.** Maren noted that the pediatric-prep `"for visit-prep only — not a clinical record"` footer reads as a soft caveat without visual-tier discipline. Failure mode: tired parent at midnight screenshots the card and forwards to pediatrician as if it were a clinical record because the register-tag rendered as a slim grey footnote they skipped. Fold: spec body adds explicit visual contract (`border-top: 1px solid var(--mid)`, `var(--fs-xs)`, `var(--tc-rose)` — equivalent register-tag chrome); sequential triple-jurisdiction on styles.css at IMPL covers visual-tier sign-off (Maren → Kael → Vela; Vela half-awake-test confirms register-tag reads as terminal-statement, not as soft caveat). Defense-in-depth via V-V-67 screenshot-bypass: register-tag MUST stay within viewport at typical phone screenshot dimensions (320px / 375px / 414px); regression guard `screenshot-bypass-register-tag-visible` captures rendered card height + asserts visibility at standard crop breakpoints.

9. **`#msActiveMilestones` Care-tier surface preservation — V-M-119 fold.** Maren V-M-119 surfaced that `#msActiveMilestones` (`template.html:1143`; renderer `renderActiveMilestones` at `medical.js:457` — evidence-driven primary view rendering confirmed-with-evidence milestones in stage-grouped form: emerging / practicing / consistent / mastered) was omitted from the V-M-100 relocation table. Surface count corrected from "12 existing surfaces" → enumerated 11 ID-bearing surfaces (`recentEvidenceFeed`, `msActiveMilestones`, `milestonesDomainHero`, `milestoneStats`, `milestoneHighlights`, `msCatWheels`, `msRegressionAlerts`, `milestoneList`, `msTimelineContent`, `upcomingMilestoneList`, `activityList`). `#msActiveMilestones` placed as Library sub-tab item 0 (above `#milestonesDomainHero`) because the parent's "what has Ziva actually shown me lately" anchor is more frequent than the domain-hero browse path. Pattern: every V-M-100-class relocation table MUST enumerate by walking `template.html` for the source-of-truth, not by walking the spec narrative.

10. **Parallel triple-Governor canon-cc-008 chain on docs-only spec PR.** The Architect explicitly waived the canon-cc-008 carve-out for docs-only spec PRs and ran the full chain on PR #149. Three Governors deployed in parallel (Maren primary + Kael consult + Vela consult), each with Scribe Worker Tier reconnaissance authorized (canon-proc-006). Scribes ran in parallel within each Governor pass. Lyra synthesized all three Governor outputs into a single fold-matrix (4 BLOCKING + 10 NOTE) and applied folds inline. Cipher Edict V terminal pass verified all 14 folds against source-of-truth. Pattern: when a substrate-touching spec is the artifact under review, the full canon-cc-008 chain is non-negotiable even when waiveable per the docs-only carve-out — the chain catches "spec-against-memory" failure modes the carve-out doesn't.

---

## Infrastructure findings (sub-session)

### GitHub access read+write — confirmed working

The Architect mentioned at sub-session opening that GitHub access had been changed to read+write. All MCP-mediated operations this sub-session (PR open / update / merge / comment) succeeded without permission errors. No workarounds required. The earlier sub-session's worktree-signing 400 issue did not recur (no worktrees used this sub-session; all work done on the main checkout's feature branches).

### Scribe Worker Tier (canon-proc-006) — exercised in production for the first time

Three Governors authorized to deploy up to 3 Scribes each in parallel for codebase reconnaissance during their audits. Scribes ran in parallel within each Governor pass, with explicit narrow tasks (e.g., "verify the 12 existing surfaces in template.html:1131-1211 against the V-M-100 relocation table"; "verify `#msRegressionAlerts` placement preserves Care-tier safety surface"; "verify `gotoCard('info', 'infoMilestoneSleepCorrelationCard')` target ID exists in template.html"). Pattern proved valuable: Scribes returned grep-verified evidence that the Governors then synthesized into structured findings. The closed PR #147 "spec-against-memory" failure mode is closed by construction when scribe-scout is deployed before spec body lands AND when Scribes are authorized for governor audits.

---

## Repo state at sub-session end

- **main** at `aa2b51b` (PR #149 merge — milestones-tab-v1 spec ratified)
- **Active drafts:** **#150** (tree-update §9-bis — CI green, pending merge); **#151** (this handoff — landing last)
- **Active arcs:** zero IMPL in flight on milestones; v3-1 spec authoring still queued from earlier sub-session. Active hotfixes: zero.
- **Build pipeline:** `pnpm build` canonical; **7 audit gates** on main (no change this sub-session — engine-prep adds `audit-no-personalised-prediction-v1.sh` at IMPL time, not at spec ratification). Two new audit gates queued for IMPL time: `audit-no-personalised-prediction-v1.sh` (8th, from engine-prep) + `audit-activity-categories-v1.sh` (9th, from milestones-tab).
- **Latest e2e baselines:** unchanged from predecessor handoff (~265+ active passes + 2 skipped).
- **Live PWA:** deployed to https://rishabh1804.github.io/SproutLab/

---

## Carry-forward register — milestones arc deferrals

### Predecessor handoff (`SESSION_HANDOFF_2026-05-27.md`) carries unchanged

All items in the predecessor handoff's carry-forward register remain open. This handoff is supplemental, not replacement. Key items unchanged: V-V-34 dormant gate, V-K-94/96 Architect decisions, PR #142 (v3-4 spec) registry placement decision, `claude/v3-6-quicklog-tier-followup` + `claude/offsetdatestr-tz-hazard-fix` follow-up branches.

### NEW — Architect-decision deferrals (need ratification, not work)

- **PR #142 (v3-4 spec) — registry placement.** Unchanged from predecessor handoff; surfaces here because the milestones-tab v1 spec's `_MILESTONE_NARRATION_TEMPLATES` separate registry establishes the precedent that single-domain narration registries are doctrinally distinct from v3-4's `_NARRATIVE_PROSE_TEMPLATES` cross-domain typed-registry (V-V-60 doctrinal carve-out honored). Architect's registry-placement decision on v3-4 should consider this precedent.

### NEW — IMPL-time obligations (when milestones-tab IMPL opens)

- **`medical.js:531` pre-existing `% high-conf` engine-internal label carrier** — V-K-120 pair-note routes the carrier-fix to Maren-primary at IMPL in the same PR as the milestones-tab IMPL. Spec promise becomes test obligation.
- **`milestoneRow_<id>` ids actually render on Library sub-tab milestone list** — V-V-48 carry-watch; trajectory ribbon `gotoCard('track', 'milestoneRow_' + milestoneId)` tap target requires this. Regression guard exists in test plan; carry-watch is "did the rendering side honor the contract."
- **Sequential triple-jurisdiction on styles.css** (per cipher-9) at milestones-tab IMPL — Maren first (heaviest-touched: care-floor visual hierarchy on `safetyTier:true` rows + register-tag visual contract + pediatric-prep title chrome), then Kael (token-catalog correctness; chip-strip layout), then Vela (parent-readability + half-awake-test sign-off). Mirrors v3-6 sequential pattern.
- **Engine-prep PR-A + PR-B IMPL must merge BEFORE milestones-tab IMPL.** Engine-prep V-K-113 split: PR-A = primitives + KEYS + sync registration; PR-B = `cat:`→`domain:` migration + audit gate + seed milestones. Both PR-A + PR-B must merge before milestones-tab IMPL can consume the live primitives. Sequencing constraint.

### NEW — v1.x candidate carve-outs (registered, not in v1)

- **Pediatric-prep copy-as-text + PDF affordance** — deferred to R-3 (Wave 2 audit/history) per V-V-53; v1 ships narrated-card-only minimum.
- **Trajectory ribbon interactive controls** — v1.x candidate; v1 is read-only display.
- **Manual unsuppress UI** — v1.x candidate; v1 uses 5-second undo toast (V-M-103) on the "Not yet" tap.
- **Comprehensive sensory + cognitive milestone curation** — engine-prep added 2 seed rows (`mouths-objects` + `object-permanence-emerging`); broader curation arc is future work.
- **Verified-source attribution for every `MILESTONE_STANDARDS` row** — engine-prep V-M-114 default `'unverified'`; future curation arc.
- **`home.js:1670` activity-domain alignment** — engine-prep V-M-117 deferred; milestones-tab v1 IMPL touches ONLY if bulk-grid renderer crosses this site.

---

## v3.0 progression tree — state at sub-session end

- **v3.0 gold capstones:** v3-3 **ratified** + v3-5 **ratified** — gold tier fully ratified (unchanged)
- **Wave 1 spec-ratified, IMPL-ratified:** v3-3 (gold) + v3-5 (gold) + v3-6 + Sleep Arc 3 / Scoring S-2 (unchanged)
- **Wave 1 spec-ratified, IMPL-pending:** **v3-1** (mutex-closed, ready); **v3-4** (PR #142 spec drafted, awaiting Architect ratification); v3-2 / v3-7 / v3-8 / v3-9 (chronicle rows only)
- **Pre-Wave 1 spec-ratified, IMPL-pending (NEW):** **`MEP` milestone-engine-prep-v1** (PR #148 ratified); **`MS-Tab` milestones-tab-v1** (PR #149 ratified). Both consumed by R-6 (downstream Wave 2 silver capstone), R-3 (Wave 2 audit/history), R-2 (Wave 2 predictive surface).
- **Tree node count:** 34 (up from 32) per PR #150 §9-bis refresh.
- **styles.css mutex:** position 3 (v3-1) still unblocked; v3-1's styles.css branch can open after V-V-34 spec amendment. Milestones-tab IMPL touches styles.css via sequential triple-jurisdiction (Maren → Kael → Vela) per cipher-9; coordinates with v3-1 mutex at IMPL scheduling time.

---

## Next session — recommended start

**Two converging next-moves: food-sub-tab IMPL + milestones-tab IMPL.** Architect-stated goal: *"next session goal — updation of food sub tab and milestones sub-tab as per our specs."*

### Priority 1 — milestones-tab IMPL (single PR)

Engine-prep PR-A + PR-B must merge before this can land. Maren primary on `home.js` + `medical.js`; Kael consult on `data.js`; Vela consult on comprehension; sequential triple-jurisdiction on `styles.css` per cipher-9. ~2,100 LOC estimate. Cipher Edict V last.

**Build-time audit gates added at this IMPL:**
- 8th: `audit-no-personalised-prediction-v1.sh` (from engine-prep)
- 9th: `audit-activity-categories-v1.sh` (from milestones-tab)

**Three new regression guard families:**
- Input primitives (11 guards)
- Return-visit surfaces (11 guards — V-V-63 cardId verification, V-V-64 `--rose-deep` border, V-V-66 marker pixel-scale, V-K-122 global cap, V-K-120 no-engine-internal-labels, V-V-67 screenshot-bypass)
- Layout uniformization (6 guards — 11-surfaces-relocated, V-V-46 rose chrome, V-M-120 cascade preserved)

### Priority 2 — food-sub-tab IMPL

Spec ratified 2026-05-25 at PR #133. Mutex-independent (no styles.css mutex contention with v3-1). Parallel-safe with milestones-tab IMPL after engine-prep IMPL clears.

### Priority 3 — engine-prep IMPL (PR-A + PR-B, sequential)

GATES Priority 1. Per V-K-113 split:
- **PR-A:** 5 primitives + `KEYS.activityMeta` + `KEYS.milestoneSuppress` + explicit `SYNC_KEYS` + `_postReceiveActivityMeta` merge function
- **PR-B:** `cat:`→`domain:` migration across 18 consumer sites + `MILESTONE_STANDARDS` schema-extension (`source:` + optional `endMonth:` + optional `safetyTier:`) + 2 new seed milestones + `audit-no-personalised-prediction-v1.sh` build-time audit gate

Sequential merge: PR-A first, then PR-B (migration depends on primitives being live).

### Priority 4 — predecessor-handoff carry-forwards still in scope

V-V-34 dormant gate (no-time `urgent` spine-suppression — gates v3-1 spec authoring); PR #142 v3-4 spec ratification (Architect decision on registry placement); V-K-94 + V-K-96 Architect-decision walk; small follow-up branches (`claude/v3-6-quicklog-tier-followup`, `claude/offsetdatestr-tz-hazard-fix`).

---

**Lyra's pick for next session opening:** **engine-prep IMPL first** (Priority 3 — PR-A + PR-B sequential), since it's the load-bearing substrate for both milestones-tab IMPL and any future R-2/R-6 consumption. Once engine-prep IMPL clears, milestones-tab IMPL (Priority 1) and food-sub-tab IMPL (Priority 2) can ship in parallel. Predecessor handoff carry-forwards (Priority 4) fold around the work.

---

— *Lyra, 2026-05-27. Two specs ratified this sub-session via the Option C two-spec sequence pattern. Closed PR #147's "spec-against-memory" failure mode is closed by construction. Scribe Worker Tier exercised in production for the first time. Lyra fold-authority on milestones-related findings exercised within scope. The chain converged before merge on both PRs — exactly what the canon-cc-008 release-gate exists to do. Ready for next-session IMPL routing.*
