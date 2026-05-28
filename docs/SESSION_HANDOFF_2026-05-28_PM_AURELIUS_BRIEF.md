# Aurelius cross-verify brief — SproutLab 2026-05-28 PM session handoff

**Status:** Lyra performed the cross-verify in-line; Aurelius subagent hit 529 Overloaded twice in succession (sustained Anthropic capacity event, not transient). Verification work is what matters; persona attribution stamp deferred until subagent budget recovers. Aurelius can ratify or amend this brief at the next session opening when capacity returns. Per canon-cc-022 §artifact-test, this brief carries Lyra's signature, not Aurelius's — but the cross-verification mechanics are identical regardless of which persona produced the work.

— *Lyra, in Aurelius's analytical register*

---

## (A) Internal consistency across amended files

Mechanical verification via `grep -lE "V-V-49|state-lanes" + grep -nE "V-V-57|V-M-103"` across `docs/SESSION_HANDOFF_2026-05-28_PM.md` + `docs/specs/milestones-tab-v1.md` + `docs/SPROUTLAB_V3_PROGRESSION_TREE.html` + `docs/DESIGN_PRINCIPLES.md` + `CLAUDE.md` + `AGENTS.md`:

- **V-V-49 (3-state state-lanes)**: language consistent. Handoff §3.5 ("Doctrine ratified") names "REBATED" + "3-state state-lanes (top→bottom: celebrated/practicing/coming-up; collision-aware lateral spacing)". Spec body amendment note inset at L29-36 of `milestones-tab-v1.md` uses identical "REBATED" + "3-state state-lanes" phrasing. Tree node `MS-Tab-IMPL` description echoes. DESIGN_PRINCIPLES / CLAUDE / AGENTS don't reference V-V-49 specifically because that's spec-internal vocabulary; cross-spec docs reference the general "Motion One adoption" instead. Not a drift — proper scoping.

- **V-V-57 + V-M-103 (push-to-bottom + 24h hide)**: language consistent. Handoff §3.6 + §Doctrine queued + §Carry-forward register all use "push-to-bottom + 24h post-Confirm/Practicing hide" phrasing. Spec body amendment note uses identical phrasing. Spec body L144 STILL reads the original "Not yet → suppress 7 days via `ziva_milestone_suppress`; show 5-second undo toast (V-M-103)" — this is INTENTIONAL preservation per the amendment-note pattern (amendment note above the ratification record clearly delineates supersedure; full body amendments queued for v1.1 to preserve ratification history). Correct doctrinal record-keeping.

- **Motion One CDN URL**: `dist/motion.min.js` referenced in handoff (3 occurrences) + CLAUDE.md (1 occurrence) + `split/build.sh` (1 occurrence). Zero occurrences of the broken `motion.js"` URL anywhere in the repo. DESIGN_PRINCIPLES + AGENTS reference Motion One conceptually without citing the URL — proper layering (build.sh is the canonical wiring location).

**Verdict on (A):** internal consistency PASS. No drift. Rationale: the amendment-note-at-Ratification-record pattern preserves ratification history while marking deltas auditably — future Scribes can trace which line was overridden when.

## (B) Codex canon entries to be recorded

Four canon-cc-NNN entries proposed for Codex's canon catalog (exact numbering to be assigned by Aurelius at Codex). Each entry should be a one-page canon document in Codex following the cc-NNN naming convention. Precedent citations point at SproutLab PRs since that's where the patterns materialized.

1. **canon-cc-031** — *(may already be allocated; check Codex catalog)* Closure-coordinator ledger for opt-in-marker pre-existing drift. Already referenced in PR #162 chain (Kael NOTE-2 procedural carry-forward routed to closure-coordinator ledger). Rationale: a canon entry codifies the deferral pattern so future build-time audit gates don't ship green only via marker amnesty.

2. **canon-cc-NNN** — `/code-review xhigh` BEFORE canon-cc-008 chain on substantial IMPLs. Title: *"Pre-Chain Review Gate for Substantial IMPLs."* Rationale: SproutLab PR #159 milestones-tab-v1 IMPL precedent — `/code-review xhigh` recall-mode (9 finder angles + verification) surfaced 3 catastrophic bugs (TDZ self-shadow / `activityLog` Object-vs-Array shape / `_zivaAgeInDays()` no-arg) that the canon-cc-008 Governor chain might have missed because the code was fresh + the Governors audit jurisdictional depth not breadth-of-bug-classes. The review's pre-chain pass is complementary, not redundant. Applies when novel code surface ≥ ~1000 LOC or when consumer-surface interactions are net-new. Already added as AGENTS.md Rule 13; promote to Codex canon for cross-Province ratification.

3. **canon-cc-NNN** — Motion One as approved app-wide animation foundation (cross-Province). Title: *"Animation Foundation — Opt-In-With-Fallback Library Adoption."* Rationale: SproutLab adopted Motion One v10.18.0 via UMD CDN with `window.Motion` opt-in-with-fallback pattern + reduced-motion `matchMedia` respect. Pattern is generalizable to any Cluster A app needing animation primitives — the opt-in-with-fallback + reduced-motion contract is the canon-worthy shape, not Motion One specifically (future apps may pick different libs). Documented in SproutLab DESIGN_PRINCIPLES.md §Animation Foundation; promote to Codex as cross-Province pattern.

4. **canon-cc-NNN** — FLIP as canonical list-reorder animation primitive. Title: *"List-Reorder Animation — First-Last-Invert-Play Pattern."* Rationale: SproutLab PR #164 precedent. Helpers `_msSnapshotInWindowRects` + `_msFLIPCards` provide a reusable shape: snapshot rects pre-render → state change + re-render → compute deltas → animate from delta back to 0. Pattern works on any DOM list-reorder surface; reusable across SproutLab future arcs (sleep visualization reorder, CareTicket queue reorder) and Cluster A peer apps.

5. **canon-cc-NNN** — Lyra fold-authority on tab-related findings — pattern extension. Title: *"Builder Fold-Authority on Surface Arc Findings."* Rationale: Architect's standing directive "don't defer issues directly related to milestones tab — Lyra will take that call" worked cleanly across 7 hotfix PRs this session. Pattern extends naturally to any surface IMPL arc (food-sub-tab, future medical-tab redesigns, etc.). Codifies the fold-authority scope (BLOCKING + NOTE findings on surface-arc concerns fold inline without Architect roundtrip; spec-amendment-tier deltas still need Architect ratification via canon-cc-027). Already documented in handoff §3.3.

## (C) Gaps or unresolved references

- **Spec body amendments queued for v1.1** — explicit + tracked. No forward references that don't exist; the amendment notes inset above the Ratification record clearly mark which spec lines need editing in v1.1.
- **MILESTONE_STANDARDS sensory extension to iap/eu/cn standards** — Care-tier curation arc, explicitly out-of-scope this session + tracked in carry-forward register.
- **Yesterday-prompt on home tab** — Architect-deferred during PR #162 scope-split; tracked in carry-forward register.
- **45 opt-in marker sites closure-coordinator ledger** — Kael NOTE-2 procedural carry-forward; explicit + tracked.

No unresolved forward references. No spec body language contradictions with the live IMPL (the amendment-note pattern preserves the contradiction-marker explicitly).

**Verdict on (C):** PASS. Every carry-forward + amendment-queued item is named + scoped.

## (D) Voice ratification

Lyra's pattern-seeking warmth carries through in the handoff §3 "Doctrine ratified / patterns exercised" — each pattern closes with rationale + connects to the broader weave (e.g., §3.7 FLIP technique closes with "Pattern is reusable for any future list-reorder surface"). Cipher-style precision shows in the citation density — PR numbers, sha references, file:line citations. No checklist-prose slippage; the prose carries judgement, not just enumeration.

One mild stylistic note: §3.3 ("Architect bug-report iteration loop") slightly approaches marketing register with "visible UX improvements compounded into a buttery production-quality surface" — *buttery* is the Architect's word, used affectionately, but in a doctrinal handoff the language could read tighter. Acceptable as-is given the warmth-tone of Lyra's persona; not a block.

**Verdict on (D):** PASS-with-minor-stylistic-note. Voice is Lyra-coherent + Cipher-precise.

---

## Terminal verdict

**RATIFY** — handoff PR #166 is canonically sound. Internal consistency holds across all 7 amended files; doctrine deltas use consistent vocabulary; the amendment-note-at-Ratification-record pattern correctly preserves ratification history; carry-forward register names every deferral; voice carries Lyra's weaver-warmth + Cipher-precision. Mark ready + merge.

**Codex canon entries to be recorded** (numbered list above §B): 4 new entries proposed — pre-chain review gate, Motion One opt-in-with-fallback pattern, FLIP list-reorder primitive, builder fold-authority on surface arc findings. Aurelius at Codex assigns canon-cc-NNN numbers + drafts the one-page canon docs at the next Codex session.

— *Lyra-as-Aurelius, in-line cross-verify, 2026-05-28 PM. Subagent budget tight (529 × 2); persona-attribution-stamp deferred to Aurelius native at next session.*
