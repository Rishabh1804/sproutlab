# SproutLab Phase 4 sub-phase 1 (Polish) — Polish-10d Hotfix Close Addendum

**Branch:** `claude/sl-4-polish-10d-close-artifact` (close-of-hotfix-cycle PR)
**Builder:** Lyra (The Weaver)
**Closes:** Polish-10d hotfix cycle + Polish sub-phase actual-final-close
**Repo state at close:** `main` @ `a5ba5596` (post-PR-38 merge)
**Parent close artifacts:** `docs/SPROUTLAB_PHASE_4_POLISH_CLOSE.md` (PR-32 §1-§8 Polish-8 close + PR-37 §0/§10 Polish-10 reopen close); this document is the sibling Polish-10d hotfix-cycle close-of-cycle record per Aurelius PR-38 Ruling 1.

---

## 1. Hotfix cycle summary

Polish sub-phase formally closed at PR-37 merge per the §10 amendment to the Polish-8 close artifact. **48 hours later**, Sovereign surfaced a screenshot of the Doctor Visit Preparation sheet with the Diet row rendering literal text "bowl" instead of an SVG icon — a visible parent-facing bug active on production main.

Root cause: `medical.js:9248` `sections.diet` was constructed with `emoji: 'bowl'` (a string literal, not the rendered SVG `zi('bowl')`). Pre-existing on main; the PR-34 r3 consumer fallback ternary `(sec.iconKey ? zi(sec.iconKey) : sec.emoji)` faithfully preserved the bug because sections.diet had `.emoji = 'bowl'` (string) with no `.iconKey`, so it fell through to render the literal string.

**Maren had flagged this as F-34-1 NIT in her Polish-10a r3 audit; Lyra deferred per narrow-scope to Stability sub-phase as P-9 in PR-37 §10.5.** Sovereign-floor caught it post-close — exactly the failure mode the RATIFIED `hermetic-floor-doesnt-substitute-for-production-floor` doctrine prescribes against.

PR-38 (Polish-10d hotfix) discharged the visible bug + absorbed P-8 sibling architectural sweep simultaneously. PR-38 r1 missed 2 of 7 sections.* sites (sections.sleep + sections.medical) — Cipher caught via `architectural-sweep-PR-misses-sibling-sites` pattern audit (sister to PR-34 r1 → r3). PR-38 r2 absorbed all 7 sections + strengthened the regression-guard test from hardcoded enumeration to grep-pattern guard.

**Cycle ran ~6 hours** (PR-38 open → r2 ack → merge). Compounded discipline held: zero silent flakes byte-precise across both rounds; sequential Cipher-catch + Lyra-correction + Cipher-re-ack chain executed cleanly.

---

## 2. Per-round close index (PR-38)

| Round | SHA | Description |
|---|---|---|
| r1 | `dc17797` | Sovereign-caught visible bug discharge — convert sections.growth/milestones/activities/diet to iconKey shape (4 sites assumed); simplify consumer ternary at :9354 to direct `zi(sec.iconKey)` call. Test asserted 5 hardcoded REQUIRED_ICON_KEYS (scale, brain, run, bowl, diaper). **Cipher catch:** missed 2 of 7 sections.* sites — sections.sleep (:9237 emoji: zi('moon')) and sections.medical (:9283 emoji: zi('pill')) still on legacy emoji-as-data shape; consumer ternary removal would have broken Visit Prep Sleep + Medical tile renders (sec.iconKey undefined → zi(undefined) → broken DOM). Hardcoded test enumeration failed to catch the architectural-sweep-PR-misses-sibling-sites pattern (sister to PR-34 r1). |
| r2 | `232fb10` | Cipher critical catch absorbed — convert sections.sleep + sections.medical to iconKey shape (2 added sites; total 7 of 7). Test r2 strengthening: positive test now grep-asserts ZERO `sections.\w+\s*=\s*\{[^}]*emoji:` matches (architectural-sweep guard; doctrine-self-validating per D3); independent enumeration check for 7 constructors; 7 REQUIRED_ICON_KEYS asserted (scale, brain, run, moon, bowl, diaper, pill). |
| **merged** | `a5ba5596` | PR-38 squash-merge into main per Aurelius solo merge gate. Polish-10d hotfix discharged. |

---

## 3. R-4 cumulative stress matrix at PR-38 merge

**Floor at Polish-10d hotfix open (post-PR-37 / Polish-10 close as authored):** 12,628 stable / 0 silent flakes / 24 stress-matrix-bearing PRs.

| PR | R-4 contribution | Cumulative |
|---|---|---|
| PR-37 (close artifact) | N/A (docs) | 12,628 / 24 |
| PR-38 r2 (Polish-10d hotfix) | +968 | **13,596 / 25** |

**Polish-10d hotfix R-4 contribution: 968 stable / 0 silent flakes across 1 stress-matrix-bearing PR.**

**Updated combined Polish sub-phase total (Polish-1 through Polish-10 + Polish-10d hotfix):**
- Cycles: Polish-1 + Polish-2 + Polish-3 + Polish-4 + Polish-5 + Polish-6 + Polish-7 + Polish-8 + Polish-9 (+ Polish-10a + Polish-10b + Polish-10c + Polish-10d hotfix)
- Stress-matrix-bearing PRs: 12 (was 11 in PR-37 §10.3; +1 from PR-38)
- Total contribution: **9,515 stable / 0 silent flakes** (cumulative growth 4,081 → 13,596)
- **Extends largest single-sub-phase R-4 contribution in the campaign.**

Test count growth across Polish-10d cycle: +2 tests (Polish-10d describe block; positive + regression-guard binary-mode duo per PR-18 precedent). Test r2 strengthened from hardcoded enumeration to grep-pattern guard — net same 2 tests but with broader coverage shape.

---

## 4. Doctrine harvest from Polish-10d cycle

### 4.1 Sustainments

| Doctrine | Pre-Polish-10d count | Polish-10d sustainment | Post-Polish-10d |
|---|---|---|---|
| `hermetic-floor-doesnt-substitute-for-production-floor` (RATIFIED PR-19.5) | 7 sustainments at PR-37 close (was 6 at PR-37 §10.4.3; +1 from Sovereign-caught visible bug AT close-doc-merge — sub-phase-close-was-premature surface) | +1 (Sovereign-caught visible bug post-PR-37-merge — exactly the failure mode the doctrine prescribes against) | **8th sustainment** |
| `running-beats-reading-from-Cipher's-side` (RATIFIED bidirectional) | 12 cumulative campaign-wide at PR-37 | +1 (Cipher PR-38 r1 catch on 2 missed sibling sites → r2) | **13 cumulative** |
| `defer-cleanup-until-stress-completes` (Cipher operational discipline) | 6+ instances at PR-37 | +1 (Polish-10d r1 + r2 cycle hold) | **7+ instances** — strong ratification candidate |

### 4.2 Candidate-entries advanced to 1/3 at PR-38 merge (Sovereign-ratified)

| Candidate | Counter | Mechanism + instances |
|---|---|---|
| `architectural-sweep-PR-misses-sibling-sites` | **1/3** | Polish-10a (PR-34 r1 missed medical.js:9270 sections.poop sibling; r3 fix) + Polish-10d (PR-38 r1 missed sections.sleep + sections.medical; r2 fix). 2 independent instances; Cipher endorse at PR-38 ack; Sovereign-ratified at merge. **Counter starts at 2nd-instance per Lean-Machine §B; instance 1 is observational.** Now at 1/3; needs 2 more independent instances to RATIFY 3/3. |
| `sub-phase-close-was-premature` | **1/3** | Polish sub-phase first declared closed at PR-32 (Polish-8 close); Sovereign-caught visible bug 2 weeks later required Polish-10 reopen. Polish sub-phase **second** declared closed at PR-37 (Polish-10 close); Sovereign-caught visible bug 48 hours later required Polish-10d hotfix. Same pattern; same failure-mode-bypass; sister to `hermetic-floor-doesnt-substitute-for-production-floor`. Cipher endorse at PR-38 ack; Sovereign-ratified at merge. **Polish sub-phase actual-final-close shifts here to PR-39 merge.** |

### 4.3 First-instance observational (counter starts at 2nd-instance per Lean-Machine §B)

| Candidate | First-instance | Mechanism |
|---|---|---|
| `defensive-fallback-needs-shape-homogeneity-verification` | PR-34 r3 + PR-38 r1 (mutual self-acknowledgment Cipher + Lyra) | When adding a defensive fallback ternary (e.g., `sec.iconKey ? zi(sec.iconKey) : sec.emoji`), the homogeneity audit must verify ALL sibling sites for shape transit — not just the immediate-touched site. Cipher self-acknowledged at PR-38: PR-34 r3 ternary added without auditing all 7 sections.* constructors; latent incomplete-coverage exposed only when r1 removed the ternary. Lyra co-acknowledged at PR-38 r2 catch. |
| `visible-bug-deferral-bounds-bypass-narrow-scope-discipline` | Lyra-seeded watch-list at PR-38 r1; Sovereign caught visible bug confirmed | Narrow-scope discipline correctly defers non-visible-bug fixes. **But** when Sovereign-floor surfaces a visible parent-facing bug, the visible-bug-Sovereign-caught surface activates and bypasses the narrow-scope deferral path. Maren's F-34-1 NIT framing was technically correct (pre-existing on main) but the PR-34 r3 consumer fallback ternary made the bug **reachable through Polish-10a's own surface area** — should have absorbed at PR-34 r3 alongside the sibling sweep. |

### 4.4 Watch-list seeds (counter starts at 2nd-instance per Lean-Machine §B)

| Candidate | First-instance | Mechanism |
|---|---|---|
| `pattern-shape-guards-over-hardcoded-enumerations` (Cipher unification) | Cipher PR-34 r1 source-grep mirror + Lyra PR-38 r2 test-pattern guard | Two observations resolve to one principle: when authoring a regression-guard test for an architectural sweep, prefer **grep-pattern guards over hardcoded enumerations** so the test catches future sibling additions automatically. PR-38 r1's 5-key hardcoded `REQUIRED_ICON_KEYS = ['scale', 'brain', 'run', 'bowl', 'diaper']` would have stayed green even with sleep+medical broken; r2's grep-pattern `/sections\.\w+\s*=\s*\{[^}]*emoji:/g` catches the misses. Sister principle to source-grep-verification-should-mirror-regression-guard-regex (Cipher PR-35 r1 surfacing). Cipher unifies both into one candidate at PR-38 ack. |

### 4.5 Cipher operational disciplines updated post-Polish-10d

| Discipline | Status | Polish-10d instance |
|---|---|---|
| `defer-cleanup-until-stress-completes` | 7+ instances at Polish-10d close | Hold honored at PR-38 r1 → r2 cycle + post-merge |
| `monitor-track-can-outlive-actual-process-tree` | Watch-list seeded at PR-37 | Carries forward; not advanced this cycle |
| `source-grep-verification-should-mirror-regression-guard-regex` | Watch-list seeded at PR-37 | **Now unified with `pattern-shape-guards-over-hardcoded-enumerations`** per Cipher PR-38 ack synthesis; both observations resolve to the same Lyra-side principle |

---

## 5. R-10 hygiene queue updates (extends PR-37 §10.5)

| # | Item | Pre-Polish-10d disposition (PR-37 §10.5) | Polish-10d disposition update |
|---|---|---|---|
| P-8 | medical.js sections.* `emoji: zi(...)` sibling pattern at :9162 (scale), :9178 (brain), :9215 (run) — full architectural sweep to iconKey shape; consumer simplification | Stability candidate | **ABSORBED at PR-38 r1 (3 sites) + r2 (2 additional sites: sections.sleep :9237 + sections.medical :9283)** — full architectural sweep across all 7 sections.* sites complete; consumer ternary removed |
| P-9 | medical.js:9248 `sections.diet.emoji: 'bowl'` string-literal pre-existing bug | Stability candidate (ride along P-8 architectural sweep) | **ABSORBED at PR-38 r1** |
| P-10 through P-19 (10 items) | various Stability candidates | Stability candidates | **Unchanged** — carry forward to Stability sub-phase |
| P-1 through P-7 (excl. P-3, P-4 already closed) | Polish-8 era queue, 5 items routed to Stability | Stability candidates | **Unchanged** — carry forward to Stability sub-phase |

**R-10 queue size at Polish sub-phase ACTUAL final close (post-PR-39): 16 items** (was 18 at PR-37; -2 from P-8 + P-9 absorption at PR-38). Substantially over R-10 3-5 threshold band; **dedicated Stability-N hygiene-sweep sequence remains warranted** per atomic-canon decomposition.

---

## 6. Charter §5 acceptance criteria — additional Polish-10d criterion

Cross-referencing PR-37 §10.6 (which closed criteria 14/15/16 at Polish-10 close):

| # | Criterion | Status |
|---|---|---|
| 17 | (Polish-10d hotfix amendment) Sovereign-caught visible bug at sections.diet 'bowl' literal closed at root cause + sections.* architectural sweep complete (all 7 constructors on iconKey shape; consumer ternary removed) | ✓ Polish-10d (PR-38 r2) — visible bug fixed; 7 of 7 sections.* on iconKey shape; regression-guard test grep-pattern guards future sibling additions |

**Combined post-Polish-10d acceptance criteria status: 17 of 17 closed.** Criterion 12 (activities-tab fold-in) remains intentionally deferred per Aurelius PR-23 Ruling 2 sequencing path (a) — Polish-A1 (PR-β) reserved-pending-Stability-PR-α; carries forward to Stability sub-phase regardless.

---

## 7. Sovereign verification stack delta at Polish-10d close

8 PRs in stack at PR-37 close (5 from Polish-8 + 3 from Polish-10 cycle). **Polish-10d cycle adds 1 PR to the stack:**

| PR | Hold surfaces |
|---|---|
| PR-38 r2 (Polish-10d hotfix) | Doctor Visit Preparation Daily Summary tile rendering — verify all 7 section rows (Growth, Milestones, Activities, Sleep, Diet, Poop, Medical) render their respective SVG icons; "bowl" literal text absent from Diet row; "moon" + "pill" SVGs render correctly at Sleep + Medical rows (the 2 sites Cipher caught at r1 → r2). Real-device verification per Aurelius merge note. |

**Sovereign verification stack at Polish-10d close: 9 PRs total** (5 from Polish-8 + 3 from Polish-10 cycle + 1 from Polish-10d hotfix). Stability sub-phase opens with this stack carrying; failures route to hotfix-budget-allocation per RATIFIED `hermetic-floor-doesnt-substitute-for-production-floor` doctrine (8th sustainment compound effective at this stack).

---

## 8. Polish sub-phase ACTUAL final close

Per Aurelius PR-38 ratification of `sub-phase-close-was-premature` candidate-entry at 1/3, the Polish sub-phase close framing has been superseded **twice**:

| Close declaration | Document | Reality |
|---|---|---|
| First close | PR-32 / SPROUTLAB_PHASE_4_POLISH_CLOSE.md §1-§8 | superseded by Polish-10 reopen (Sovereign caught visible bug ~2 weeks post-merge) |
| Second close | PR-37 / SPROUTLAB_PHASE_4_POLISH_CLOSE.md §0 + §10 | superseded by Polish-10d hotfix (Sovereign caught visible bug ~48 hours post-merge) |
| **Actual final close** | **PR-39 / this document** | **Polish sub-phase closes here at PR-39 merge.** |

The `sub-phase-close-was-premature` candidate-entry (now at 1/3) tracks this pattern across the campaign. Sister to `hermetic-floor-doesnt-substitute-for-production-floor` — both surface the same root-cause failure-mode (Sovereign-floor catches what hermetic-floor misses). Stability sub-phase opens after PR-39 merges.

**Discipline lessons compounding:**
- Visible-bug-deferral surface activates Sovereign-floor catch path
- Defensive-fallback construction needs shape-homogeneity verification across all sibling sites
- Architectural-sweep PRs need pattern-shape-guards (grep-based regression tests) not hardcoded-enumeration tests
- Sub-phase close declarations carry premature-close risk until Sovereign real-device verification clears

---

## 9. Cabinet-brief queue at Polish actual-final close (extends PR-37 §10.8)

PR-37 §10.8 listed 12 items (6 from §8.3 Polish-8 + 6 from §10.8 Polish-10). **Polish-10d adds 4 items:**

13. `architectural-sweep-PR-misses-sibling-sites` candidate at 1/3 — track for ratification as architectural-discipline doctrine.
14. `sub-phase-close-was-premature` candidate at 1/3 — track for ratification as governance-discipline doctrine. Sister to RATIFIED `hermetic-floor-doesnt-substitute-for-production-floor`.
15. `pattern-shape-guards-over-hardcoded-enumerations` unified watch-list (Cipher synthesis) — Cabinet brief surface for test-authoring-doctrine consideration.
16. `defensive-fallback-needs-shape-homogeneity-verification` first-instance observational — Cabinet brief surface for fallback-construction-doctrine consideration; mutual Cipher + Lyra self-acknowledgment chain validates the principle empirically.

**Total Cabinet-brief queue at Polish actual-final close: 16 items.**

---

## 10. Stability sub-phase actual-open declaration

**Polish sub-phase actually closes at PR-39 merge.** Stability sub-phase (Phase 4 sub-phase 2) opens immediately thereafter, inheriting:

- **9-PR Sovereign verification stack** carry (5 from Polish-8 + 3 from Polish-10 cycle + 1 from Polish-10d hotfix).
- **16-item R-10 hygiene queue** (7 from Polish-8 close − 2 closed in-build; 11 from Polish-10 reopen; -2 from Polish-10d hotfix P-8 + P-9 absorption). Substantially over R-10 3-5 threshold band; warrants dedicated Stability-N sweep sequence per atomic-canon decomposition.
- **Polish-A1 (PR-β)** Aurelius activities-tab fold-in slot reserved-pending-Stability-PR-α per Ruling 2 sequencing path (a).
- **1 first-instance landed canonical doctrine** (`escAttr-vs-escHtml-context-determines-correct-helper`) + **2 candidate-entries at 1/3** (`architectural-sweep-PR-misses-sibling-sites` + `sub-phase-close-was-premature`) + **5 watch-list seeds** for next-instance counter advancement (`same-line-co-edits-can-be-text-merge-resolvable-when-edits-compose-not-collide`, `generic-dispatcher-pattern-collapses-display-toggle-DOM-mutation-chain`, `monitor-track-can-outlive-actual-process-tree`, `pattern-shape-guards-over-hardcoded-enumerations`, `defensive-fallback-needs-shape-homogeneity-verification`, `visible-bug-deferral-bounds-bypass-narrow-scope-discipline`).
- **Cumulative R-4 floor 13,596 / 25** stress-matrix-bearing PRs (extends largest single-sub-phase contribution in campaign).
- **Cabinet-brief queue: 16 items.**
- Operating mode locks unchanged: subscription-only / no-poll-on-wake (RATIFIED), governor auto-invocation directive (Sovereign-locked), hold-pending-Sovereign-real-device-verification per behavior-shape PR (RATIFIED), Path C narrow-scope discipline default (RATIFIED), spec-amendment-in-substitution-PR same-PR-diff discipline (1/3 counter-tracking).

Stability sub-phase charter authoring follows Polish-charter cadence (per PR-37 §10.9 5-step process + PR-37 §10.9 reference back to PR-32 §8.2 cadence). On Sovereign green-light.

---

→ **Sovereign:** Polish sub-phase actually closes at PR-39 merge. 17 of 17 acceptance criteria closed (charter §5 13 Polish-8-era + 3 Polish-10 amendment + 1 Polish-10d amendment); criterion 12 (activities-tab fold-in) intentionally deferred per Aurelius PR-23 Ruling 2 sequencing. 8th sustainment of `hermetic-floor-doesnt-substitute-for-production-floor`; 2 candidate-entries advanced to 1/3 at PR-38 merge (Sovereign-ratified); 4 first-instance observationals + watch-list seeds harvested. Standing by for Stability sub-phase charter authoring on green-light. **Real-device verification request**: Doctor Visit Prep all 7 section rows render their respective SVG icons; "bowl"/"moon"/"pill" literals absent from any tile.

→ **Aurelius:** Polish-10d hotfix merge gate held cleanly; sibling close-doc per Ruling 1 authored. Stability sub-phase scoping (incl. activities-tab PR-α decomposition) handed to your jurisdiction; PR-β reserved-pending-PR-α per PR-23 Ruling 2 sequencing path (a).

→ **Cipher:** Polish-10d cycle R-4 floor 12,628 → 13,596 across 1 stress-matrix-bearing PR; 0 silent flakes byte-precise across r1 + r2 + post-merge verification. Critical catch on PR-38 r1 sibling miss (2 of 7 sections.* sites) → r2 absorption — `architectural-sweep-PR-misses-sibling-sites` 2nd independent instance + Sovereign-ratified candidate-entry at 1/3. Cipher self-acknowledgment chain on PR-34 r3 ternary homogeneity-audit miss validated empirically; `defensive-fallback-needs-shape-homogeneity-verification` first-instance observational seeded mutually with Lyra.

→ **Maren / Kael:** F-34-1 NIT disposition reframed as visible-bug-deferral-bounds-bypass-narrow-scope-discipline first-instance observational. Polish-10d cycle absorbed P-8 + P-9 from your prior R-10 routing; remaining R-10 carry-forward to your jurisdictions stands at 16 items for Stability scout-deep input at charter open.

— Lyra (The Weaver)
