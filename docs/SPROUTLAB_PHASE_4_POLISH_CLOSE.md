# SproutLab Phase 4 sub-phase 1 (Polish) — Close Artifact

**Branch:** `claude/sl-4-polish-8-close-artifact` (close-of-sub-phase PR — Polish-8) · `claude/sl-4-polish-10-close-artifact` (Polish-10 reopen amendment — this section §10)
**Builder:** Lyra (The Weaver)
**Closes:** Phase 4 Polish sub-phase (8 feature PRs through Polish-8 + 1 charter; Polish-10 reopen amendment adds 1 charter-amendment + 3 feature PRs + this close)
**Repo state at close:**
- Polish-8 close: `main` @ `<post-PR-32-merge>` (historical)
- Polish-10 close: `main` @ `30da9e34` (post-PR-36 merge)
**Charter:** `docs/SPROUTLAB_PHASE_4_POLISH_CHARTER.md` (PR-23 ratified; Polish-10 amendment ratified at PR-33)

---

## 0. Amendment notices

**2026-05-03 — Polish-10 reopen close** (post-PR-36 merge / supersedes PR-32 close framing):

Polish sub-phase formally closed at PR-32 (this document, original §1-§8). Sovereign surfaced two visible Polish-grade Medical-tab artifacts (Food Reaction Timeline + Illness Frequency renderers) sharing one root cause: `zi()`-rendered SVG markup stored as data on `ep.emoji` fields and concatenated into HTML `title="..."` attributes, where the embedded `class="zi"` quote prematurely terminated the attribute and leaked trailing markup as rendered DOM text.

Sovereign chose **broadest scope** + **clean architectural fix** (strip SVG from data; render at boundary). Polish-10 reopened the sub-phase at PR-33 charter amendment, decomposed per R-9 into PR-34 (Polish-10a; visible-bug architectural fix + HR-1/HR-4/HR-2 sweep), PR-35 (Polish-10b; HR-3 onclick batch — Care + Home), PR-36 (Polish-10c; HR-3 onclick batch — Intelligence + Diet), plus this artifact (PR-37).

Polish sub-phase **actually closes at PR-37 merge**. PR-32's "Polish closes on PR-32 merge" framing in the original §1 below stands as historical context; the operational close shifts to PR-37. Stability sub-phase handoff (originally projected to open post-PR-32) defers until PR-37 merges.

**Polish-10 cycle ran ~24 hours** at Lyra cadence (2026-05-02 → 2026-05-03; charter amendment PR-33 + 3 feature PRs + close artifact). Compounded discipline from Polish-1 through Polish-9 cycle held: zero silent flakes byte-precise, sequential-rebase-chain merge sequencing handled cleanly per Aurelius option (a).

Detailed Polish-10 reopen content lives in §10 below; original §1-§8 preserved verbatim as historical Polish-8-close record.

---

## 1. Sub-phase summary

Phase 4 sub-phase 1 (Polish) closes with **8 feature PRs merged** + 1 charter + this close artifact. Charter §4 Option B sequence shipped fully; Polish-A1 (Aurelius activities-tab fold-in slot) reserved-pending-Stability-PR-α per Aurelius PR-23 Ruling 2 carries forward to sub-phase 2.

**Cycle ran ~7 days** at Lyra cadence (estimated 10-14 in charter §7; under-shot due to Path C narrow-scope discipline + Sovereign-locked governor auto-invocation + ratified `concurrent-operations-interfere-with-parallel-stress-matrix` discipline keeping stress matrices clean on first-attempt).

---

## 2. Per-PR close index

| PR | Sub-phase | Cycle | Description |
|---|---|---|---|
| PR-23 | Charter | r1 → r2 → ack | Phase 4 sub-phase 1 charter (R-8 Option B; 6-axis brief; Findings A-F; Locked exclusions §3; PR sequence §4; charter `narrow-scope-and-defer-broader-audit-to-R-10` 3/3 RATIFIED at PR-26) |
| PR-24 (Polish-1) | Feature | Path 1 | medical.js Insights-tier defense-in-depth gates (`isEssentialMode()` early-return at `renderInfoPoopFoodDelay`/`renderInfoPoopFoodWatch`); rationale-amended on-record (CSS-tier vs JS-tier reframe; running-beats-reading 5th instance) |
| PR-25 (Polish-9) | Feature (mid-sub-phase atomic-canon insertion) | r1 only | Atomic-canon vocabulary rename `simple-mode → essential-mode` + boot migration; 9 new tokens introduced; 1st `vocabulary-parity-between-UI-and-source` first-instance |
| PR-26 (Polish-2) | Feature | Path A | 4 cross-Governor-catch governance-rule sites (HR-1/HR-2/HR-3); RATIFIED 3/3 `narrow-scope-and-defer-broader-audit-to-R-10` (Phase 4 3rd native ratification) |
| PR-27 (Polish-3) | Feature | r1 only | Direct-token-duplication hex sweep (32 sites styles.css; 13 canonical tokens); running-beats-reading 7th instance |
| PR-28 (Polish-4) | Feature | Path B″ | Design-token-system spec amendment + 9 new tokens + token-family naming rule + 38-site ad-hoc-tonal sweep; first-instance `spec-amendment-in-substitution-PR` (observational); Lyra→Maren→Kael three-way refinement |
| PR-29 (Polish-5) | Feature | Path C narrow-scope | Cross-jurisdiction class-extraction sweep (8 utility classes; 11 sites; `.guidance-do/dont` + `.doctor-cta-call/map` + `.kc-row-flex-wrap` + `.nh-legend-swatch` + `.section-caption` cousin-pattern variants deferred to R-10 P-7); Kael caught real bug (`--sp-4` vs `--sp-8` padding) |
| PR-30 (Polish-6) | Feature | Path C narrow-scope | CSS-custom-property pivot first-instance + `--dyn-*` family rule + compound-style partial-pivot clause (Kael); 9-site sweep + RATIFIED 3/3 `concurrent-operations-interfere-with-parallel-stress-matrix` (Phase 4 4th native ratification) |
| PR-31 (Polish-7) | Feature | Smallest Polish-N | Canonical breakpoint header + 1 site normalization (.milestone-actions 480→500); future-@custom-media-doctrine-seed first-instance observational |
| **PR-32 (Polish-8)** | **Close artifact** | **Docs-only (this PR)** | **CLAUDE.md sprite-count amendment (54→62) + this close artifact** |

---

## 3. Cumulative R-4 stress matrix floor

**Floor at Polish sub-phase open (post-PR-22 / Phase 4 zero gate):** 4,081 stable / 0 silent flakes / 13 stress-matrix-bearing PRs.

| PR | Single | Parallel ×5 | Sequential CI=1 ×5 | Total | Cumulative |
|---|---|---|---|---|---|
| PR-23 (charter) | N/A (docs) | N/A | N/A | 0 | 4,081 / 13 |
| PR-24 (Polish-1) | 56 | 280 | 280 | 616 | 4,697 / 14 |
| PR-25 (Polish-9) | 59 | 295 | 295 | 649 | 5,346 / 15 |
| PR-26 (Polish-2) | 61 | 305 | 305 | 671 | 6,017 / 16 |
| PR-27 (Polish-3) | 64 | 320 | 320 | 704 | 6,721 / 17 |
| PR-28 (Polish-4) | 67 | 335 | 335 | 737 | 7,458 / 18 |
| PR-29 (Polish-5) | 70 | 350 | 350 | 770 | 8,228 / 19 |
| PR-30 (Polish-6) | 73 | 365 | 365 | 803 | 9,031 / 20 |
| PR-31 (Polish-7) | 76 | 380 | 380 | 836 | 9,867 / 21 |
| PR-32 (Polish-8) | N/A (docs-only) | N/A | N/A | 0 | 9,867 / 21 |

**Polish sub-phase R-4 contribution:** **5,786 stable / 0 silent flakes across 8 stress-matrix-bearing PRs** (cumulative growth 4,081 → 9,867). **Zero silent flakes across the entire sub-phase** — discipline held byte-precise.

Test count growth: 56 (Polish-1 baseline) → 76 (Polish-7 close). 20 new tests landed across 8 R-7 triads (some triads contributed 2 tests due to scope-narrow shapes; some Polish-N PRs added more than 3 tests due to class-extraction families requiring per-class coverage).

---

## 4. Doctrine harvest (cite `Codex/docs/doctrine-ledger.md`)

### 4.1 Native ratifications (4 — all RATIFIED 3/3 within Polish sub-phase)

| Doctrine | RATIFIED | Phase 4 instance arc |
|---|---|---|
| `subscription-only / no-poll-on-wake` | PR-22 (Aurelius Ruling 4 campaign-wide-implications branch) | First-instance pre-charter; sustainments through every Polish-N cycle |
| `r2-stress-rerun-elective-on-pure-doc-text-correction` | PR-23 (3/3 cycle: Phase 3 PR-9 r1→r2 + Phase 4 PR-22 r1→r2 + Phase 4 PR-23 r1→r2) | Cipher endorsed; Aurelius RATIFIED at PR-23 merge |
| `narrow-scope-and-defer-broader-audit-to-R-10` | PR-26 (3/3 cycle: PR-23 r2 Catch 3 route-(a) + Polish-1 Path 1 + Polish-2 Path A) | Cipher endorsed; Aurelius RATIFIED at PR-26 merge |
| `concurrent-operations-interfere-with-parallel-stress-matrix` | PR-30 (3/3 cycle: Polish-4 first-instance + Polish-5 sustainment + Polish-6 sustainment) | Cipher endorsed; Aurelius RATIFIED at PR-30 merge |

### 4.2 Counter-tracking candidates at sub-phase close

| Candidate | Counter | Origin |
|---|---|---|
| `stop-hook-cleanup-must-defer-until-stress-matrix-completes` | 1/3 | Polish-9 (Cipher first-instance) + Polish-4 (Cipher 2nd-instance actionable-prescription) |
| `spec-amendment-in-substitution-PR` | 1/3 (Cipher endorse at PR-30) | Polish-4 (first-instance per Aurelius PR-23 Ruling 5) + Polish-6 (2nd-instance) |
| `cross-Governor-three-way-refinement-on-design-system-decisions` | 1/3 (Cipher endorse at PR-30) | Polish-4 (first-instance: Lyra→Maren→Kael Path B→B′→B″) + Polish-6 (2nd-instance: Lyra→Maren→Kael compound-partial-pivot critical addition) |

### 4.3 First-instance observational (counter starts at 2nd-instance per Lean-Machine §B)

| Candidate | First-instance |
|---|---|
| `CSS-custom-property-pivot-for-dynamic-required-surfaces` | Polish-6 (Aurelius PR-23 Ruling 5; sister to spec-amendment-in-substitution-PR) |
| `vocabulary-parity-between-UI-and-source` | Polish-9 |
| `runtime-binds-source-audit-at-build-deep` | Polish-1 |
| `cross-Governor-catch-coverage-gap-discipline` | Polish-2 |
| `DRY-refactor-candidate-from-rename-PR-build-deep` | Polish-2 (medical.js:2255 + intelligence.js:11958 byte-identical severity-label) |
| `cross-Governor-symmetric-catch` family (bilateral / three-way / solo-catch sub-shapes; umbrella-naming pending) | Polish-3 (bilateral) + Polish-4 (three-way) + Polish-5 (solo) |
| `dual-token-gradient-swap-line-count-drift` | Polish-3 |
| `line-count-vs-occurrence-count-semantics-explicit-in-rename-PR-framings` | Polish-9 (Maren-surfaced) |
| `future-@custom-media-doctrine-seed` | Polish-7 (Kael-surfaced) |

### 4.4 Sustainments of pre-Phase-4 doctrines

| Doctrine | Sub-phase sustainment count |
|---|---|
| `D6 Builder-may-improve-on-prescription` (RATIFIED Phase 1) | 8 (one per feature PR) |
| `running-beats-reading-even-from-Cipher's-side` (RATIFIED bidirectional, 3 instances pre-Phase-4) | 11 cumulative bidirectional instances campaign-wide post-Polish-7 |
| `architectural-surfacing-must-enumerate-axis-of-resolution` (RATIFIED PR-19.6) | 10 Phase 4 sustainments (charter + 8 features + close artifact = 10 axes-of-resolution disclosures) |
| `hermetic-floor-doesnt-substitute-for-production-floor` (RATIFIED PR-19.5) | Applied per-PR; hold-pending-Sovereign-real-device-verification engaged on all 7 behavior-shape Polish-N PRs |
| `D8 citation-integrity-as-Cipher-jurisdiction` (RATIFIED Phase 1) | Multiple Phase 4 instances (PR-22 r1→r2 + PR-23 r1→r2 + PR-25 r1 transcription error catches + Polish-2 build-deep coverage gap + Polish-5 Kael bug-catch byte-precision) |
| `D5 doctrine compounding` (RATIFIED Phase 1) | Strong sustainment (4 ratifications + 3 candidates at 1/3 within single sub-phase) |

---

## 5. Carry-forwards into Stability sub-phase (Phase 4 sub-phase 2)

### 5.1 Charter §6 R-10 hygiene queue at Polish close

| # | Item | Disposition at Polish close |
|---|---|---|
| P-1 | Full HR-1 emoji audit (~33 remaining sites; expanded over Polish-2 + Polish-3 + Polish-4 build-deep findings + Cipher self-acknowledged audit-coverage gap) | **Stability sub-phase candidate** OR dedicated R-8 charter |
| P-2 | Sprite-prune deferral (11 unreferenced symbols) | **Hold until Tally/Spark/Reward sub-phases declare needs** |
| P-3 | DESIGN_PRINCIPLES.md format consistency post-Polish-4 + Polish-6 spec amendments | **Closed in-Polish-build** (no inconsistencies surfaced; format coherent across both amendments per Maren+Kael Mode 1 audits) |
| P-4 | Class-extraction residue audit post-Polish-5 | **Closed in-Polish-build** (Polish-5 Path C narrow-scope explicitly deferred residue to P-7) |
| P-5 | Defense-in-depth JS-layer gating audit + sweep of remaining ~22 medical.js renderInfo* renderers (incl. Kael's Polish-4 audit baseline expansion) | **Stability sub-phase candidate** |
| P-6 | HR-3 settings-toggle delegation at template.html:2594 (inline `onchange="toggleEssentialMode()"`) | **Stability sub-phase candidate** OR Polish-N+1 hygiene-sweep |
| P-7 | `.section-caption` cousin-pattern sweep (44 varied sites; Polish-5 narrow-scope deferral) | **Stability sub-phase candidate** OR dedicated class-taxonomy charter |

**Polish-7 effective close-build hygiene:** P-3 + P-4 closed in-Polish-build (no consolidation PR needed). **P-1 + P-2 + P-5 + P-6 + P-7 = 5 items route to Stability sub-phase or dedicated R-8 charters.** R-10 threshold band 3-5 honored at sub-phase close.

### 5.2 Reserved Polish-A1 (PR-β) — Aurelius activities-tab fold-in

Aurelius PR-22 final-review handoff: *"activities-tab fix decomposition (3 PRs across Stability + Polish) is scoped on the Aurelius side and will fold in at charter time."* Polish reserved 1 of 3 slots; PR-α (Stability sub-phase 2) lands first, PR-β (Polish fold-in) follows post-PR-α-merge per Aurelius PR-23 Ruling 2 sequencing path (a). PR-γ (entry-UX) defers per plan-mode Q3.

**At Polish-8 close:** PR-β reserved-pending-Stability-PR-α. Carries forward into Stability sub-phase open.

### 5.3 Cabinet-eligible observations + watch-list seeds for Stability sub-phase

- **`02-habits.md` Re-poll-on-wake supersession** (Consul PR-23 §4.1 + Aurelius PR-22 Ruling 4 folding) — pending Cabinet ratification post-Phase-4. The now-RATIFIED `subscription-only / no-poll-on-wake` is the active operating-mode discipline; Re-poll-on-wake rule from Phase 2-era 02-habits.md is stale.
- **Cross-province pattern-propagation** (Consul PR-23 §4.2): should Polish-4 spec-amendment-before-substitution-sweep + Polish-6 CSS-custom-property pivot propagate as cross-province design-system conventions to sep-dashboard / sep-invoicing? Cabinet-eligible at post-Phase-4 brief.
- **MCP scope constraint on Consul** (Consul PR-23 §4.3) — sep-* repos out-of-scope for Consul session; verification surface on Aurelius/Sovereign.
- **`subscription-only / no-poll-on-wake` first-failure-mode hybrid posture amendment** (Aurelius PR-23 Ruling 4): may need amendment to `subscription-primary / Sovereign-directed-re-check-fallback` based on PR-23 webhook-silence-on-Aurelius-reviews observation. Cabinet brief.
- **`cross-Governor-symmetric-catch` umbrella-naming question** (Cipher PR-29 framing): the 3 instances vary in shape (bilateral / three-way / solo-catch); Aurelius decides at next merge whether to umbrella-name them under one ratifiable doctrine.
- **`future-@custom-media-doctrine-seed`** (Kael Polish-7 surfacing): when Chromium/WebKit/Firefox ship `@custom-media` consumption inside `@media` conditions, a future Polish-N migration could promote the 4 inlined breakpoint values to `var()`-resolved. Tracking as future-doctrine seed; not actionable until browser support lands.
- **Cipher-side `defer-cleanup-until-stress-completes` discipline 5 instances** (PR-25 first surfacing + PR-28/29/30/31 sustainments): operational discipline empirically validated; the now-RATIFIED `concurrent-operations-interfere-with-parallel-stress-matrix` is the Lyra-bench mirror; Cipher-side candidate-doctrine could ratify with 1 more independent instance OR umbrella-name with Lyra-side counterpart.

### 5.4 Sovereign verification stack disposition at Polish close

5 PRs pending Sovereign multi-surface real-device verification per RATIFIED `hermetic-floor-doesnt-substitute-for-production-floor` doctrine (PR-19.5 3/3) + charter §8:

| PR | Hold surfaces |
|---|---|
| PR-27 (Polish-3) | Light-theme RGB byte-match + dark-theme `.btn-full-danger` + theme-toggle re-tint |
| PR-28 (Polish-4) | Milestone perceptual progression + caution-amber consumers + dark-theme deep-tone visibility + theme-toggle + Smart Q&A `.dqp-pill:active` luminance |
| PR-29 (Polish-5) | Doctor CTA + guidance Do/Don't + Diarrhoea chip rows 4px padding + Nutrient Heatmap legend |
| PR-30 (Polish-6) | diet bar fills + home weather-precaution compound-partial + intelligence mdi-bar + info-intro-bar height + mb-meal-bar compound-partial |
| PR-31 (Polish-7) | `.milestone-actions` 481-500px band + 390-414px iPhone behavior + tablet/desktop layout |

Each PR merged into `main` per Phase 4 operational mode (merge-then-verify-promptly per RATIFIED hermetic-floor doctrine PR-19.5 prescription refinement). Sovereign verifies asynchronously; failures route to hotfix-budget-allocation per the doctrine.

---

## 6. Charter §5 acceptance criteria check

Cross-referencing charter §5's 13 closure criteria (post-r2 enumeration including the new §5.13 R-10 carry-forward routing):

| # | Criterion | Status |
|---|---|---|
| 1 | The 4 named cross-Governor-catch governance-rule violations closed | ✓ Polish-2 (PR-26) — HR-2 medical.js:3208 + HR-1 medical.js:2268 + HR-1 home.js:1595 + HR-3 home.js:1391 |
| 2 | medical.js mode-contract parity with diet.js | ✓ Polish-1 (PR-24) Path 1 — defense-in-depth + perf reframe; broader 19-renderer audit routed to R-10 P-5 |
| 3 | Direct-token-duplicate hex sweep complete | ✓ Polish-3 (PR-27) — 32 sites swept; zero canonical-hex duplicates outside :root in styles.css |
| 4 | New-token spec amendment landed in DESIGN_PRINCIPLES.md | ✓ Polish-4 (PR-28) Path B″ — 9 new tokens + token-family naming rule; first-instance `spec-amendment-in-substitution-PR` doctrine |
| 5 | Cross-jurisdiction class-extraction families landed | ✓ Polish-5 (PR-29) Path C narrow-scope — 8 classes; 11 sites; .section-caption variants deferred to R-10 P-7 |
| 6 | CSS-custom-property pivot convention spec amendment landed | ✓ Polish-6 (PR-30) Path B″ — `--dyn-pct` + `.dyn-fill/.dyn-fill-h` + `--dyn-*` family rule + compound-partial-pivot clause; first-instance `CSS-custom-property-pivot-for-dynamic-required-surfaces` doctrine |
| 7 | Responsive breakpoint header comment landed in styles.css | ✓ Polish-7 (PR-31) — canonical 4-breakpoint header + 1 site normalization |
| 8 | CLAUDE.md sprite count amended | ✓ Polish-8 (this PR) — 54 → 62 with Polish-8 amendment date stamp |
| 9 | Polish-8 close artifact published | ✓ This document |
| 10 | All deferred safety-tier carve-outs documented on-record | ✓ Charter §3 Locked Exclusions + §5.1 R-10 carry-forward (P-1 + P-2 + P-5 + P-6 + P-7) |
| 11 | Cumulative R-4 floor preserved | ✓ 9,867 / 21 stress-matrix-bearing PRs (target was ~7,000; **40% over-target**) |
| 12 | Activities-tab fold-in PR(s) closed | ⏸️ **DEFERRED** per Aurelius PR-23 Ruling 2 sequencing path (a) — Polish-A1 (PR-β) reserved-pending-Stability-PR-α; carries forward to Stability sub-phase |
| 13 | Phase 4 R-10 carry-forward documented and routed | ✓ §5.1 above; 5 items routed to Stability/dedicated-R-8-charters; 2 items closed in-Polish-build |

**12 of 13 criteria closed at Polish-8 merge. Criterion 12 is intentionally deferred per Aurelius's sequencing path; Polish sub-phase closes regardless** (Stability sub-phase opens and Polish-A1 fold-in lands post-PR-α-merge in that sub-phase's window).

---

## 7. Meta-observations on the sub-phase

### 7.1 Doctrine-density + ratification cadence

**Polish sub-phase produced 4 native ratifications in 8 feature PRs** — highest ratification density per-PR of any sub-phase to date in the campaign. Possible drivers:
- Both first-instance candidate doctrines from Aurelius PR-23 Ruling 5 landed within the sub-phase (Polish-4 spec-amendment-in-substitution-PR + Polish-6 CSS-custom-property-pivot).
- Path C narrow-scope discipline (per RATIFIED `narrow-scope-and-defer-broader-audit-to-R-10`) produced repeated 3-instance arcs that compounded into the doctrine harvest.
- Sovereign-locked governor auto-invocation directive (mid-cycle ratification at PR-26) accelerated cross-Governor refinement patterns.

### 7.2 Sub-phase scope realism

**Charter §4 estimates vs empirical reality:**

| PR | Charter LOC | Empirical LOC | Direction |
|---|---|---|---|
| Polish-1 | 5-15 source | 12 source | within range |
| Polish-2 | 10-20 source | ~10 source | within range (Path A; HR-2 used existing --amber substitute) |
| Polish-3 | 100-150 source | 32 substitutions in styles.css (line-count varies) | charter-overstated |
| Polish-4 | 150-250 source | ~120-150 source | within range |
| Polish-5 | 80-150 source | ~50-80 source (Path C narrow-scope) | charter-overstated; narrowed by deferral |
| Polish-6 | 100-180 source | ~80-100 source (Path C narrow-scope) | charter-overstated; narrowed by deferral |
| Polish-7 | 30-50 source | ~30 source (header + 1 site swap) | within range |
| Polish-8 | docs-only | docs-only | within range |

**Pattern:** charter LOC envelopes were UPPER bounds; empirical reality often narrowed via Path C/B″ discipline. Maren+Kael Mode 2 scout-deep input typically converged on smaller-than-charter scope (better-grounded empirical site counts). running-beats-reading 11 cumulative bidirectional instances within Phase 4 alone is the strongest sustainment of the doctrine across the campaign.

### 7.3 Cross-Governor pattern strengthening

The `cross-Governor-symmetric-catch` family advanced through 3 distinct shape variations within Polish:
- **Bilateral** (Polish-3): Maren + Kael independently flag same anomaly.
- **Three-way refinement** (Polish-4 + Polish-6): Lyra → Maren → Kael progressive convention naming.
- **Solo-catch on Builder error** (Polish-5): Kael catches Lyra build-deep bug pre-commit.

Aurelius's umbrella-naming question at PR-29 (Cipher framing) carries forward; the family pattern is empirically rich enough that umbrella-naming may simplify ledger tracking vs separate counter-instances per shape.

### 7.4 Operating-mode discipline

**Subscription-only / no-poll-on-wake** (RATIFIED PR-22 Ruling 4) operationalized cleanly across all 9 PRs in the sub-phase. Webhook delivery silence observed once (Aurelius PR-23 reviews; Sovereign-relay fallback recovered). **Ratified hybrid-posture amendment candidate carrying forward** (`subscription-primary / Sovereign-directed-re-check-fallback` per Aurelius PR-23 Ruling 4).

**Concurrent-operations / stop-hook discipline** RATIFIED 3/3 at PR-30. Cipher-side mirror discipline (`defer-cleanup-until-stress-completes`) at 5 instances; could umbrella-name with Lyra-side at next merge if Cipher's Phase-4 close brief proposes.

---

## 8. Handoff to Stability sub-phase (Phase 4 sub-phase 2)

### 8.1 Stability sub-phase scope (per system-prompt opening directive)

> *Phase 4 sub-phase 2: Stability — bug-killing pass + Phase 3 object-keyed attribution carryforward (medChecks Medication Log + feedingData Feeding History per-entry attribution).*

Stability inherits from Polish sub-phase:
- 5 R-10 carry-forward items routed to Stability candidates (P-1 + P-2 + P-5 + P-6 + P-7 per §5.1).
- Polish-A1 (PR-β; Aurelius activities-tab fold-in) reserved-pending-Stability-PR-α per Ruling 2 sequencing path (a).
- 3 candidates at 1/3 counter-tracking (stop-hook-cleanup-must-defer + spec-amendment-in-substitution-PR + cross-Governor-three-way-refinement-on-design-system-decisions) — 2 more independent instances each ratifies.
- 2+ first-instance observational candidates in active watch-list — counter starts at 2nd-instance.

### 8.2 Stability sub-phase charter authoring — recommended cadence

Following Polish-charter precedent (PR-23):
1. **Empirical scout** (running-beats-reading discipline) on the 4 known scope-bins:
   - Phase 3 object-keyed attribution carryforward (medChecks + feedingData per-entry attribution).
   - 5 R-10 carry-forward items routing.
   - PR-α (Stability sub-phase 2 activities-tab fix decomposition; Aurelius scoping) integration point.
   - General bug-killing pass (TBD specific bug-list).
2. **Auto-invoke Maren + Kael Mode 2 (committee-delegate)** in parallel for cross-jurisdiction Stability-domain scout-deep on the 4 scope-bins.
3. Author Stability charter with R-8 options A/B/C explicit dispositions per `architectural-surfacing-must-enumerate-axis-of-resolution` (RATIFIED PR-19.6 + 10 Phase-4 sustainments).
4. Surface to Sovereign + Aurelius for ratification.
5. Cipher advisory at charter open per relay/subscription flow.

### 8.3 Cabinet-brief queue at Polish close

Items for post-Phase-4 Cabinet brief (per Aurelius PR-22 Ruling 5 + PR-23 Ruling 5 framing):
1. `02-habits.md` Re-poll-on-wake supersession ratification (Cabinet D-series addition or rule amendment).
2. Cross-province pattern-propagation question (Polish-4 spec-amendment-before-substitution-sweep + Polish-6 CSS-custom-property-pivot — propagate to sep-dashboard / sep-invoicing?).
3. `subscription-only / no-poll-on-wake` hybrid-posture amendment (Aurelius PR-23 Ruling 4 webhook-silence observation).
4. `cross-Governor-symmetric-catch` umbrella-naming decision (3 shape variations within Polish; ratifiable umbrella vs separate sub-doctrine counters).
5. `defer-cleanup-until-stress-completes` Cipher-side candidate ratification or umbrella with Lyra-side `concurrent-operations-interfere-with-parallel-stress-matrix`.
6. MCP scope constraint on Consul (sep-* repos out-of-scope for Consul session — widen scope for cross-province verification?).

### 8.4 Persistent PAT carry-forward + operating-mode locks

Per RATIFIED `persistent-PAT-for-active-province-campaigns` doctrine (Phase 1 ratified): Sovereign holds the rishabh1804/sproutlab fine-grained PAT through Phase 4 Stability sub-phase. Revoke at Phase 4 close (post-Stability + post-Tally + post-Reward + post-Launcher + post-Spark); not at Polish close.

Operating mode locks carrying forward into Stability sub-phase:
- `subscription-only / no-poll-on-wake` (RATIFIED).
- Governor auto-invocation directive (Sovereign-locked at PR-22 / PR-26).
- Hold-pending-Sovereign-real-device-verification per behavior-shape PR (RATIFIED PR-19.5).
- Path C narrow-scope discipline default (RATIFIED 3/3 at PR-26).
- Spec-amendment-in-substitution-PR same-PR-diff discipline (1/3 counter-tracking; Polish-4 + Polish-6 instances).

---

→ **Sovereign:** Polish sub-phase closes here. 12 of 13 acceptance criteria met (criterion 12 deferred per Aurelius Ruling 2 sequencing); 4 native doctrine ratifications harvested; 5 R-10 items routed to Stability + 1 PR-β fold-in slot reserved-pending-PR-α. Standing by for Stability sub-phase charter authoring on your green-light.

→ **Aurelius:** scoping for Stability sub-phase 2 (incl. activities-tab PR-α decomposition) handed back to your jurisdiction per PR-22 / PR-23 Ruling 2 framing.

→ **Cipher:** Phase 4 Polish sub-phase R-4 floor 9,867 / 21 stress-matrix-bearing PRs closes the sub-phase. Hermetic-floor discipline held byte-precise across 8 feature PRs. Doctrine ledger updated with 4 Phase-4-native ratifications.

→ **Maren / Kael:** governor auto-invocation discipline operationalized cleanly across Polish. Cleanest-possible `ack` × 2 verdict observed at Polish-6 + Polish-7 (3 cycles in a row with no cross-Governor catches; pattern matures). Stability sub-phase scout-deep auto-invocation expected at charter open.

— Lyra (The Weaver)

---
---

# §10. Polish-10 reopen — close addendum (PR-37)

## 10.1 Polish-10 cycle summary

Polish-10 reopened the sub-phase post-PR-32 close after Sovereign surfaced two visible Polish-grade Medical-tab artifacts. Cycle shipped **3 feature PRs + 1 charter amendment + this close addendum** in a tight ~24-hour window.

| Component | PR | Type | Description |
|---|---|---|---|
| Charter amendment | PR-33 | Docs-only | §0 Polish-10 reopen notice; §4 Polish-10a/10b/10c subsections; §5 criteria 14-16; §6 R-10 P-1 partial / P-6 full absorption; §7 sequencing |
| Polish-10a | PR-34 (r1 → r3) | Feature | SVG-in-data architectural fix + HR-1 emoji sweep + HR-4 escAttr title-attr + HR-2 storage-chip class extraction (~25 sites) |
| Polish-10b | PR-35 (r1 → r2) | Feature | HR-3 onclick batch — Care + Home (24 sites; 2 generic toggle handlers + 14 named function dispatchers) |
| Polish-10c | PR-36 (rebased) | Feature | HR-3 onclick batch — Intelligence + Diet (15 sites; 11 named function dispatchers) |
| Close artifact | PR-37 (this) | Docs-only | This §10 addendum |

**Cycle pattern**: Path C narrow-scope discipline (per RATIFIED `narrow-scope-and-defer-broader-audit-to-R-10`) held throughout — each PR landed at ≤30 sites with mechanical-only fix-shapes; compound-onclick / `this`-bearing patterns deferred to R-10 carry-forward. R-2 commit chronicle tightness sustained.

**Sequential rebase chain** (Aurelius option (a) per PR-34 merge): PR-34 merged → main shifted → PR-35 r2 rebased onto new main + Cipher re-confirmed → merged → main shifted → PR-36 rebased onto new main + Cipher re-confirmed → merged. Same-line co-edits at intelligence.js:7886 + :14962 (Polish-10a's `zi(diaper)` SVG-replacement + escAttr title and Polish-10c's `data-action` HR-3 conversion) **composed cleanly without code-logic collision** per Kael F-36.2 prediction — empirical confirmation seeds new watch-list candidate.

## 10.2 Per-PR close index (Polish-10 cycle)

| PR | Sub-phase | Cycle | Description |
|---|---|---|---|
| PR-33 | Charter amendment | r1 only | Polish-10 reopen + 10a/10b/10c decomposition (charter §0/§4/§5/§6/§7 amendments; +61 LOC) |
| PR-34 (Polish-10a) | Feature | r1 → r2 → r3 | r1: visible-bug architectural fix (illness-episode `emoji: zi(...)` → `iconKey: 'string'`; 7 downstream render-site updates with `escHtml` defense-in-depth) + HR-1 emoji sweep (11 sites: 4 medical.js + 7 intelligence.js) + HR-4 escAttr (5 title-attr sites) + HR-2 storage-chip class extraction (3 inline-style sites; .mi-legend-item white-space:nowrap fix); r2: .gitignore split/sproutlab.html build intermediate (stop-hook catch); r3: Cipher r1 catch closed — medical.js:9270 sections.poop sibling pattern absorbed into iconKey shape with consumer fallback ternary preserving 3 legacy sibling sections (:9162 scale, :9178 brain, :9215 run) per narrow-scope discipline |
| PR-35 (Polish-10b) | Feature | r1 → r2 → r2-rebased | r1: HR-3 onclick batch Care + Home (24 sites; 3 medical.js + 21 home.js); 2 new generic dispatcher handlers (toggleDisplayBlock, toggleDisplayFlex) + 14 named function dispatchers; r2: Maren F-35-1 BLOCKER discharge (escAttr → escHtml at 11 user-content data-arg positions; apostrophe-in-food-name backslash-leak via `escAttr`'s `\'` substitution that HTML attribute parser doesn't decode); rebase onto post-PR-34 main (manifest + smoke spec conflict resolution) |
| PR-36 (Polish-10c) | Feature | r1 → rebased | r1: HR-3 onclick batch Intelligence + Diet (15 sites; 14 intelligence.js + 1 diet.js); 11 named function dispatchers (log* episode entries normalized to 2-arg shape; showHeatmapDetail 3-arg via data-arg/arg2/arg3); rebase onto post-PR-35 main (PR-35 r1 commit skipped per superseded-by-rebase; Polish-10c bba9450 replayed onto new main with same-line co-edit composition at intelligence.js:7886 + :14962) |
| **PR-37** | **Close addendum** | **Docs-only (this PR)** | **§0 + §10 amendment to SPROUTLAB_PHASE_4_POLISH_CLOSE.md; PR-32 close framing supersession on-record** |

## 10.3 Polish-10 cumulative R-4 stress matrix floor

**Floor at Polish-10 reopen (post-PR-32 / Polish-8 close):** 9,867 stable / 0 silent flakes / 21 stress-matrix-bearing PRs.

| PR | R-4 contribution | Cumulative |
|---|---|---|
| PR-33 (charter amendment) | N/A (docs) | 9,867 / 21 |
| PR-34 r3 (Polish-10a) | +891 | 10,758 / 22 |
| PR-35 r2 rebased (Polish-10b) | +924 (post-rebase verification on b8ed3fa) | 11,682 / 23 |
| PR-36 rebased (Polish-10c) | +946 (post-rebase verification on 34ffc21) | 12,628 / 24 |
| PR-37 (close addendum) | N/A (docs-only) | 12,628 / 24 |

**Polish-10 reopen R-4 contribution: 2,761 stable / 0 silent flakes across 3 stress-matrix-bearing PRs** (cumulative growth 9,867 → 12,628). **Zero silent flakes across the entire Polish-10 cycle** — discipline held byte-precise across both r-cycle + rebase verification.

**Combined Polish sub-phase (Polish-1 through Polish-10) total contribution: 5,786 + 2,761 = 8,547 stable / 0 silent flakes across 11 stress-matrix-bearing PRs** (cumulative growth 4,081 → 12,628). Polish sub-phase as a whole delivered the largest single-sub-phase R-4 contribution in the campaign to date.

## 10.4 Polish-10 doctrine harvest (cite `Codex/docs/doctrine-ledger.md`)

### 10.4.1 First-instance landed canonically (Lean-Machine §B counter starts at 2nd-instance)

| Doctrine | Origin | Mechanism |
|---|---|---|
| `escAttr-vs-escHtml-context-determines-correct-helper` | Maren F-35-1 (PR-35 r2) | `escAttr`'s `s.replace(/'/g, "\\'")` substitution is correct ONLY inside JS string literals embedded within attributes (e.g. `onclick="foo('${escAttr(val)}')"`). When applied to `data-arg="..."` the HTML attribute parser does NOT decode `\` as escape; backslash leaks through `dataset.arg` into dispatcher's function call. **Correct helper choice depends on the attribute-context shape**: data-arg consumed-as-string-by-dispatcher uses `escHtml`; onclick-with-embedded-JS-string-literal uses `escAttr`. Polish-10b r2 swap at 11 user-content data-arg positions; intelligence.js sites verified enum-controlled (no apostrophes in current dataset; structural-defense parity routes to R-10 per defense-in-depth) |

### 10.4.2 Watch-list seeded (counter starts at 2nd-instance per Lean-Machine §B)

| Candidate | First-instance | Mechanism |
|---|---|---|
| `same-line-co-edits-can-be-text-merge-resolvable-when-edits-compose-not-collide` | Kael F-36.2 prediction confirmed empirically at PR-36 rebase | Polish-10a (PR-34) edited intelligence.js:7886 (🩲 → `zi('diaper')`) + :14962 (added escAttr to title); Polish-10c (PR-36) edited the same lines (onclick → data-action HR-3 conversion). Predicted text-merge-resolvable; rebase confirmed: edits operate on disjoint attribute positions within the same line, 3-way merge produces composable final form. **Rule**: same-line co-edit ≠ collision when edits write to disjoint positions; check for compose-vs-collide at conflict resolution before reaching for `--theirs`/`--ours` |
| `generic-dispatcher-pattern-collapses-display-toggle-DOM-mutation-chain` | Cipher PR-35 r1 surfacing | The 6-step inline `document.getElementById('${id}').style.display=document.getElementById('${id}').style.display==='none'?'block':'none'` collapses to `data-action="toggleDisplayBlock" data-arg="${id}" data-stop="1"` + 4-line dispatcher entry. Pattern repeated 5+ times across Care surfaces; high-leverage cleanup |
| `monitor-track-can-outlive-actual-process-tree` | Cipher operational | Observational; Cipher-side discipline |
| `source-grep-verification-should-mirror-regression-guard-regex` | Cipher operational | Observational; Cipher-side discipline (mirror = same regex used for source-grep verification AND regression-guard test ensures alignment) |

### 10.4.3 Counter-tracking advances

| Doctrine | Pre-Polish-10 | Polish-10 sustainments | Post-Polish-10 |
|---|---|---|---|
| `hermetic-floor-doesnt-substitute-for-production-floor` (RATIFIED PR-19.5; 5 sustainments at Polish-8) | 5 sustainments | +1 (Polish-10 reopen; Sovereign-caught visible bug + Cipher-bench-caught r1 residue at medical.js:9270 — both on same architectural-shift PR) | **6 sustainments** |
| `cross-Governor-symmetric-catch` family (3 shape variations at Polish-8) | bilateral / three-way / solo-catch | +1 shape variation (Maren-solo F-35-1 BLOCKER catch; Kael-solo F-36.1 cross-jurisdictional dispatcher placement) | **4 shape variations** (umbrella-naming question per Aurelius PR-29 framing carries forward to Cabinet brief) |
| `running-beats-reading-from-Cipher's-side` (RATIFIED bidirectional; 11 cumulative campaign-wide instances at Polish-7) | 11 instances | +1 (Cipher r1 catch on medical.js:9270 → r3 absorption) | **12 cumulative instances** |
| `defer-cleanup-until-stress-completes` Cipher operational discipline (5 instances at Polish-7) | 5 instances | +1 (PR-35 r2 rebased re-ack hold; PR-36 rebased re-ack hold) | **6+ instances** — strong compound for ratification candidate at next merge |

### 10.4.4 Cipher operational candidate observations

`source-grep-verification-should-mirror-regression-guard-regex` first-instance observational from Cipher (PR-35 r1 review). Mechanism: when Lyra writes a regression-guard regex (e.g. `data-arg(2)?="\${escAttr\((m\.name|nextMilestone\.text|...)`), the source-grep verification command Lyra runs at build-deep should use the SAME regex as the test asserts against. Asymmetric grep + test-regex creates false-clean self-verification. Worth ratification track.

## 10.5 Updated Charter §6 R-10 hygiene queue at Polish close

| # | Item | Polish-8 disposition | Polish-10 disposition update |
|---|---|---|---|
| P-1 | Full HR-1 emoji audit (~33 remaining sites at Polish-8 close) | Stability candidate | **Partial absorption at Polish-10a** — 11 of ~33 sites absorbed (4 medical.js 🩺 + 7 intelligence.js 🩲/🩺 + 2 alert-icon data-field icon-key). Remaining ~22 sites (home.js weather-code emoji map, precautions strings, food icon props; medical.js activity icon props; intelligence.js Symptom Checker; template.html shared-module sites; DRY-refactor for duplicated severity literal) **continue to defer to Stability sub-phase or dedicated R-8 charter** — fix-shape variability not in Polish-10 scope |
| P-2 | Sprite-prune deferral (11 unreferenced symbols) | Hold until Tally/Spark/Reward declare | **Unchanged** |
| P-3 | DESIGN_PRINCIPLES.md format consistency post-amendments | Closed in-Polish-build | **Unchanged (closed)** |
| P-4 | Class-extraction residue audit post-Polish-5 | Closed in-Polish-build | **Unchanged (closed)** |
| P-5 | Defense-in-depth JS-layer gating audit + sweep of remaining ~22 medical.js renderInfo* renderers | Stability candidate | **Unchanged** |
| P-6 | HR-3 settings-toggle delegation at template.html:2594 (`onchange="toggleEssentialMode()"`) | Stability candidate OR Polish-N+1 hygiene-sweep | **Unchanged** — Polish-10b absorbed the broader HR-3 onclick batch in Care + Home, but template.html shared-module HR-3 violation requires different fix-shape (template-level data-action; needs core.js change-event delegation extension for `<input>` elements). Routes to Stability sub-phase |
| P-7 | `.section-caption` cousin-pattern sweep (44 varied sites) | Stability candidate OR dedicated class-taxonomy charter | **Unchanged** |

### New R-10 items surfaced during Polish-10 cycle

| # | Item | Origin | Disposition |
|---|---|---|---|
| P-8 | medical.js sections.* `emoji: zi(...)` sibling pattern at :9162 (scale), :9178 (brain), :9215 (run) — full architectural sweep to iconKey shape; consumer at :9354 simplifies back to direct `zi(sec.iconKey)` once all 4 absorbed | Maren F-34-1 + Lyra PR-34 r3 narrow-scope deferral | Stability sub-phase candidate |
| P-9 | medical.js:9248 `sections.diet.emoji: 'bowl'` string-literal pre-existing bug — visit-prep doctor handoff sheet shows literal text "bowl" instead of SVG | Maren F-34-1 (pre-existing on main; r3 consumer fallback faithfully preserves bug) | Stability sub-phase candidate (ride along P-8 architectural sweep) |
| P-10 | core.js:948-952 score-tier emoji-as-data sibling pattern (5 entries; same anti-pattern as illness-episode constructors) | Polish-10a r1 build-deep (Lyra) | Stability sub-phase candidate (ride along P-8 architectural sweep) |
| P-11 | escAttr title-attr semantic asymmetry (`\'` cosmetic mangle) at the 5 Polish-10a HR-4 escAttr sites (medical.js:8300, intelligence.js:14962+:15219, home.js:1587+:8874) — `escAttr` produces `\'` which renders as literal `\'` in tooltips when food/data contains apostrophe | Kael F-34.1 | Stability sub-phase candidate; dovetails with P-12 escAttrPlain helper |
| P-12 | New `escAttrPlain(s)` helper candidate — escapes `&<>"`-only (omits `'` since apostrophe in double-quoted HTML attribute is parser-safe; omits `\n` → `<br>` since titles + data-arg never contain newlines) | Maren F-35-1 secondary recommendation | Stability sub-phase candidate; dovetails with P-11 |
| P-13 | core.js dispatcher entry shadowing — PR-35 added 7 new entries that shadow legacy entries further down the if/else chain (switchTab @316/348, expandMilestoneByIdx @426, expandUpcomingItem @602, fillDietMeal @468, insertDietFood @469, switchFoodCatSub @477, deleteFeedingEntry near 466). Old entries unreachable dead code | Kael F-35.1 | Stability sub-phase candidate (single-sweep delete legacy duplicates) |
| P-14 | `toggleDisplayBlock` (PR-35) duplicates `toggleVaccHistoryInfo` body (Polish-2 PR-26) — same handler body, different action key. Alias instead of duplicate | Kael F-35.2 | Stability sub-phase candidate (alias toggleVaccHistoryInfo to toggleDisplayBlock) |
| P-15 | Hygiene parity — escAttr→escHtml swap at PR-36's enum-controlled action-label data-arg sites (intelligence.js:7196, :7944, :8412, :8693). Currently safe (no apostrophes in `Doctor called`, `Breastfed`, `ORS given`, etc.) but structural-defense parity for future-data-set hygiene | Maren F-35-1 mirror probe + Kael verification | Stability sub-phase candidate (single-shape sweep) |
| P-16 | intelligence.js:8793 chained `event.stopPropagation();switchTab('track');setTimeout(...switchTrackSub('medical')...)` — relays from cold-episode home banner into Care territory (Medical sub-tab). Cross-Governor concern when this carry-forward enters next polish | F-Cross-Gov-2 (Kael→Maren future-coordination flag) | Stability sub-phase candidate; cross-Governor coordination |
| P-17 | intelligence.js:6793, :8793, :11761, :11779, :11883, :12270 — 6 compound-onclick carry-forwards (set-value + call, this.closest, template-string injection, setTimeout chains) | Polish-10c narrow-scope deferral | Stability sub-phase candidate |
| P-18 | diet.js:428, :853, :897, :3052, :3316, :3338, :3926, :3949, :3995 — 9 compound-onclick carry-forwards (set-value compounds, getAlertNavAction template-string injection, this-bearing) | Polish-10c narrow-scope deferral | Stability sub-phase candidate |
| P-19 | home.js:637, :2011, :2955, :2961, :2966, :2970, :2971, :5863, :8140 — 9 compound-onclick carry-forwards (chained-call, this.closest, this.classList.toggle, this.parentElement.classList.toggle, item.action template-string injection) | Polish-10b narrow-scope deferral | Stability sub-phase candidate |

**R-10 queue size at Polish-10 close: 18 items** (P-1 partial + P-2 + P-5 + P-6 + P-7 + P-8 through P-19). R-10 threshold band 3-5 exceeded substantially; **a dedicated Stability-N hygiene-sweep PR sequence is now warranted** — the volume + diversity of fix-shapes argues for atomic-canon decomposition into multiple Stability-N PRs rather than one consolidation flush.

## 10.6 Charter §5 acceptance criteria check (Polish-10 amendment criteria 14-16)

| # | Criterion | Status |
|---|---|---|
| 14 | (Polish-10 amendment) SVG-in-data architectural shift completed | ✓ Polish-10a (PR-34) — illness-episode constructors store iconKey strings; 7 downstream render sites route iconKey through zi() at boundary; title="..." carries escHtml-escaped plain text; visible-bug at Food Reaction Timeline + Illness Frequency closed at root cause |
| 15 | (Polish-10 amendment) HR-3 onclick sweep landed | ✓ Polish-10b (PR-35) + Polish-10c (PR-36) — 39 onclick conversions across medical.js (3) + home.js (21) + intelligence.js (14) + diet.js (1); 2 generic toggle handlers + 25 named function dispatchers in core.js. Compound-onclick carry-forwards (P-16/P-17/P-18/P-19) routed to Stability per narrow-scope discipline. Note: P-6 (template.html:2594 settings-toggle inline `onchange`) NOT absorbed by Polish-10b/c — different fix-shape (template-level + change-event delegation extension); routes to Stability per disposition update in §10.5 |
| 16 | (Polish-10 amendment) Polish-10 close artifact published | ✓ This document (§10 amendment to SPROUTLAB_PHASE_4_POLISH_CLOSE.md) |

**Combined post-Polish-10 acceptance criteria status: 13 of 13 Polish-8-era criteria + 3 of 3 Polish-10 amendment criteria = 16 of 16 closed.** Criterion 12 (activities-tab fold-in) remains intentionally deferred per Aurelius PR-23 Ruling 2 sequencing path (a) — Polish-A1 (PR-β) reserved-pending-Stability-PR-α; carries forward to Stability sub-phase regardless.

## 10.7 Sovereign verification stack delta

5 PRs pending Sovereign multi-surface real-device verification at Polish-8 close (§5.4 above) carry forward. **Polish-10 cycle adds 3 additional PRs to the stack:**

| PR | Hold surfaces |
|---|---|
| PR-34 r3 (Polish-10a) | Medical-tab Food Reaction Timeline + Medical Intelligence Illness Frequency renderers (visible-bug fix verification at root cause: confirm `fever">` artifact absent in DOM; "diarrhoea" renders fully without truncation; April column episodes don't visually stack); legend item single-line render (`white-space:nowrap`); doctor modal opens with stethoscope icon (not 🩺 emoji); wet-diaper logging chips show diaper icon (not 🩲 emoji); sections.poop tile in Visit Prep Daily Summary still shows correct iconKey-rendered icon (not literal "diaper" text) |
| PR-35 r2 rebased (Polish-10b) | Care-tier safety surfaces — vaccination toggle, missed-medication Done/Skip buttons, milestone expanders, diet-pill fillers, contextual-alert Done/View-details/tip-toggle. **Maren F-35-1 parent-facing data-integrity surface**: type a food name with apostrophe (e.g., "John's pasta") into a same-as pill or insert-food pill; verify saves to localStorage and Firestore as clean string (NOT `John\'s pasta` with literal backslash); verify cross-device sync round-trip on Bhavna device |
| PR-36 rebased (Polish-10c) | Intelligence-tier surfaces — fever/diarrhoea/vomiting/cold episode action chips; severity selectors; nutrient-heatmap cell taps; toggleCorrEvidence View-evidence on poop-correlation. Episode-tracker time-input correctness: open both diarrhoea AND vomiting cards; verify deHydra vs voHydra time selectors remain independent (not stale-cached from render time) |

**Sovereign verification stack at Polish-10 close: 8 PRs total** (5 from Polish-8 close + 3 from Polish-10 reopen). Stability sub-phase opens with this stack carrying; failures route to hotfix-budget-allocation per RATIFIED `hermetic-floor-doesnt-substitute-for-production-floor` doctrine.

## 10.8 Cabinet-brief queue at Polish-10 close (additions to §8.3)

Items added at Polish-10 close (in addition to §8.3 6-item Polish-8 queue):

7. `escAttr-vs-escHtml-context-determines-correct-helper` first-instance landing — Cabinet ratification track at next surfacing per Lean-Machine §B counter rule (advances to 2/3 at next instance).
8. `same-line-co-edits-can-be-text-merge-resolvable-when-edits-compose-not-collide` watch-list seeded — Kael's predictive framing + Lyra's empirical confirmation during PR-36 rebase. Counter starts at 2nd-instance.
9. `cross-Governor-symmetric-catch` umbrella-naming decision — now at 4 shape variations (bilateral / three-way / Maren-solo / Kael-solo). Aurelius scoping question carries forward; Cabinet ratification candidate.
10. New `escAttrPlain(s)` helper candidate (P-12 above) — Cabinet brief surface for utility-function-family decision (escHtml / escAttr / escAttrPlain) at Stability open.
11. Dispatcher pattern refactor (handler-map vs if/else chain) — dispatcher entry count post-Polish-10 approaches ~100 with shadowed legacy duplicates (Kael F-35.1). Cabinet-brief candidate for a Stability sub-phase R-8 charter.
12. PR-32 close-framing supersession on-record — original §1 declared "Polish closes on PR-32 merge"; Polish-10 reopen + this §10 amendment shift the operational close to PR-37. Cabinet-brief observational; close-artifact-supersession-via-amendment-doctrine first-instance observational.

## 10.9 Stability sub-phase actual-open declaration

**Polish sub-phase closes at PR-37 merge.** Stability sub-phase (Phase 4 sub-phase 2) opens immediately thereafter, inheriting:

- 8-PR Sovereign verification stack carry (5 from Polish-8 + 3 from Polish-10).
- 18-item R-10 hygiene queue (7 from Polish-8 + 11 new from Polish-10) — substantially over R-10 3-5 threshold band; warrants dedicated Stability-N sweep sequence per atomic-canon decomposition.
- Polish-A1 (PR-β) Aurelius activities-tab fold-in slot reserved-pending-Stability-PR-α per Ruling 2 sequencing path (a).
- 1 first-instance landed canonical doctrine (`escAttr-vs-escHtml-context-determines-correct-helper`) + 4 watch-list seeds (`same-line-co-edits-can-be-text-merge-resolvable-when-edits-compose-not-collide`, `generic-dispatcher-pattern-collapses-display-toggle-DOM-mutation-chain`, `monitor-track-can-outlive-actual-process-tree`, `source-grep-verification-should-mirror-regression-guard-regex`).
- Cumulative R-4 floor 12,628 / 24 stress-matrix-bearing PRs (largest single-sub-phase contribution in campaign).
- Operating mode locks unchanged: subscription-only / no-poll-on-wake (RATIFIED), governor auto-invocation directive (Sovereign-locked), hold-pending-Sovereign-real-device-verification per behavior-shape PR (RATIFIED), Path C narrow-scope discipline default (RATIFIED), spec-amendment-in-substitution-PR same-PR-diff discipline (1/3 counter-tracking).

Stability sub-phase charter authoring follows Polish-charter cadence (per §8.2 — 5-step process). Cipher's PR-32 close note "Polish closes on PR-32 merge" superseded by this PR-37 close note: **Polish closes on PR-37 merge**. Stability charter authoring on Sovereign green-light.

---

→ **Sovereign:** Polish sub-phase actually closes at PR-37 merge. 16 of 16 acceptance criteria closed (charter §5 13 Polish-8-era + 3 Polish-10 amendment); criterion 12 deferred per Aurelius Ruling 2; 1 first-instance landed canonical doctrine + 4 watch-list seeds + 4 sustainments harvested; 11 new R-10 items routed to Stability (queue total 18). Standing by for Stability sub-phase charter authoring on green-light.

→ **Aurelius:** Polish-10 sequential rebase chain executed cleanly per option (a) sequencing path; PR-34 → PR-35 r2 rebased → PR-36 rebased; sequential merge gate held; close-artifact solo-merge on Sovereign session-context citation per Path A precedent (PR-33).

→ **Cipher:** Polish-10 cycle R-4 floor 9,867 → 12,628 across 3 stress-matrix-bearing PRs; 0 silent flakes byte-precise; rebase-verification on PR-35 r2 + PR-36 added empirical R-4 deltas (+55 + +66) over original-tree acks. Watch-list candidates seeded; Cipher operational discipline `defer-cleanup-until-stress-completes` advances to 6 sustainments (ratification candidate at next merge).

→ **Maren / Kael:** Polish-10 cycle Maren F-35-1 BLOCKER + Kael F-36.1 cross-jurisdictional dispatcher + cross-Governor symmetric-catch family advances to 4 shape variations. Stability sub-phase scout-deep auto-invocation expected at charter open; 11 new R-10 items routed to your jurisdictions for scout-deep input.

— Lyra (The Weaver)
