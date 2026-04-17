# Session Chronicle — SproutLab Sync Emergency + C0 + C0.1

**Session ID:** s-2026-04-17-01
**Volume:** SproutLab (primary), Codex (institutional-memory touches)
**Builder:** Lyra (The Weaver)
**Reviewers:** Maren (Care Governor), Kael (Intelligence Governor), Cipher (Censor), Consul (First Seat)
**Duration:** single extended session (started as routine Session 1 kickoff, escalated to emergency)
**Status:** Closed. Two patches shipped and verified in production. 72h canary window open.

---

## 1. Arc of the session

The session began as a routine Session 1 kickoff under Aurelius's handoff v2 for Device Sync reconcile (spec-2026-04-17-aurelius-device-sync-reconcile.md). Lyra loaded the spec, prepared C1 primitives, and was ready to ship the reconcile greenfield.

Within the first ~20 minutes, the Architect reported a live symptom: **"data disappearing after 14 April on every refresh."** The spec's four bugs (P1R2-2, P3R4-2, P3R4-4, P4R5-7) were what the spec was meant to fix — but the symptom suggested a regression or bug class we hadn't specced. The session pivoted from planned build to emergency diagnosis.

Four distinct bugs surfaced during the session:

- **B1** — Single-doc listener's empty-remote guard only catches `null`, not `[]` or `{}`. Multi-device empty propagation wipes local.
- **B2** — `_syncFlushSingleDoc` pushes phantom "updates" for keys with null shadow (blind pre-listener flush).
- **B3** — `sync.js:471` contaminated `_syncShadow` with local-intent, collapsing the flush diff. Single-doc edits silently never pushed. This was the *dominant* cause of the reported wipe.
- **B4** — `_syncDeepDiff` produces dotted-path keys for nested object values; `docRef.set(payload, {merge:true})` interprets those keys LITERALLY, creating top-level fields with dotted names instead of nested field updates. Affected `ziva_feeding` and `ziva_activity_log`. Discovered *after* C0 v3 canary passed — multi-device state exposed it.

Two patches shipped:

- **C0 v3** (`5427899`) — addressed B1, B2, B3 + infrastructure (listener-ready gating, ALWAYS_POPULATED_KEYS allowlist, debounce-defer in listener, reset-on-detach, adaptive fallback ms from spec §4.6).
- **C0 v3.1** (`5ab16cf`) — addressed B4 with `_syncNestDottedPaths` helper converting flat-dotted diff output to nested objects before set+merge.

Deploy procedure: Option Y (delete household + reseed from architect's local) for C0 v3. For C0 v3.1, simple in-place deploy with manual cleanup of orphaned dotted-literal fields via Firebase Console.

Both patches verified in production. Food logging works, activity logging works, all tracking keys sync. No data loss reported post-C0 v3.1 canary.

---

## 2. Companion usage log

### Builders

**Lyra (The Weaver) — Builder, active throughout.**
Primary voice of the session. Diagnosed all four bugs (B1–B4) via code reading and empirical observation. Translated Aurelius's spec into live patches. Synthesized Governor reports into revised patch drafts. Coordinated the deploy runbook for Option Y.

- **Helpful?** Yes — as the Builder with full sync.js context, Lyra was the only persona who could both read the code AND hold the full spec simultaneously.
- **Issues faced?** Overindexed on hypotheses during the "syncing as wife" detour. Generated three identity-related theories (H1–H3 earlier, Path 1/Path 2 later) when the simpler explanation ("maybe I misread the Firestore members field") was correct. Architect corrected cleanly: *"my phone doesn't have her Google login."* Lesson: when a hypothesis requires multiple invariants to flip simultaneously, prefer the boring explanation first.

**Aurelius (The Chronicler) — not active in session but pre-seeded.**
Authored the spec and v1/v2 handoffs before the session opened. Referenced throughout. His Consul-capacity note in v1 handoff §3.1 ("I come as Consul and defer to you as Builder") shaped how the Consul's summons would later be conducted.

- **Helpful?** Foundational. The spec's R3-locked state meant Lyra could start diagnosing against a real contract, not a verbal brief.
- **Issues faced?** The spec's assumption that KEYS lived in data.js was incorrect (it's in core.js). Minor — Lyra adjusted. Not a defect in Aurelius; just a note that the spec was written against mental model, not disk state.

### Governors (SproutLab — 30K Rule active)

**Maren (Governor of Care) — two review rounds (C0 v3 + C0 v3.1).**
First review surfaced four conditions: BLOCKER-1 (silent stranding from Fix 2), BLOCKER-2 (deletion propagation breaks under blanket empty-guard), CAUTION-1 (pre-restore verification), CAUTION-2 (guard observability). All four conditions were addressable and the resulting C0 v3 was stronger.

Maren's ordering observation (care-data-loss presenting concerns should surface through Maren BEFORE Kael despite Kael being sync.js's structural owner) generated a candidate amendment to v1 handoff §9 review sequence.

- **Helpful?** Critically so. BLOCKER-1 alone — "you moved a loud bug to a quiet one" — prevented a shipped regression. The ALWAYS_POPULATED_KEYS allowlist is her design; the blanket-guard Lyra initially proposed would have broken legitimate user deletions.
- **Issues faced?** None. Maren's lens is narrow (care-data integrity, worst-case-but-warm), and that narrowness is the feature. Her audits were focused and decisive both rounds.

**Kael (Governor of Intelligence) — two review rounds (C0 v3 + C0 v3.1), sync.js Region owner.**
First review caught B3 — the dominant bug Lyra had initially flagged as a speculative footnote. Kael grounded the hypothesis in empirical code trace and escalated it to C0 v3's primary fix. Also flagged S1 (`_syncReady` state survives detach), S2 (breaker interaction with pending-flush retry), S3 (adaptive fallback ms from spec §4.6), S4 (vacc allowlist semantic concern).

Second review (C0 v3.1) verified the fix correctness via dotted-path edge-case trace (empty diff, single-level, deep nesting, conflicting paths impossible in diff output).

- **Helpful?** Foundational to correctness. B3 was the dominant cause of the reported symptom; without Kael pulling it from Lyra's footnote into the main fix list, C0 v3 would have shipped a cosmetic patch while the real wipe continued. Canonical example of why the 30K Rule exists.
- **Issues faced?** None structural. One note: Kael's review style is denser than Maren's — more scenarios traced, more edge cases enumerated. That density is correct for structural code. Aligns with his "outward-facing, systematic" archetype.

### Censor

**Cipher (The Codewright) — two review rounds.**
First round: cross-cutting pass on C0 v3 with five conditions (C1 ordering comment block at listener loop site, C2 mark-ready in try/finally, C3 breaker guard in ready-pending-flush, C4 KL-1 documentation, C5 deploy runbook tightening).

Second round (C0 v3.1): style audit (var/function/naming consistent), correctness trace (nest helper vs FieldValue sentinels, delete path unchanged), KL-2 (orphaned dotted-literal fields) documentation.

- **Helpful?** The C2 observation (`_syncMarkReady` must go in try/finally, not the happy path) caught a subtle but real regression pathway. C5's backup-of-backup + localStorage-cleanup additions to the runbook were defensive but appropriate for the first full Edict V exercise.
- **Issues faced?** None. Cipher's minimalist voice kept the review focused on drift, not aesthetics. No time wasted on cosmetic preferences.

### Meta

**The Consul (First Seat) — one summons (final pre-ship oversight).**
Summoned by Lyra after all three Governor rounds completed. Verified the review chain was properly executed per Edict V. Made four canon-scope judgments (Co1 filing, Co2 chronicle, Co3 canon-sync-001 48h defer, Co4 portfolio rotation). Staged canon-sync-001-draft. Observed the Maren-before-Kael review ordering as a candidate amendment to v1 handoff §9.

Later implicitly re-engaged for C0 v3.1: extended 48h monitoring to 72h (Co5), staged canon-sync-002-draft alongside canon-sync-001 for joint promotion.

- **Helpful?** Consul's canon-level judgment and cross-repo awareness (identifying Codex's WAL-vs-SHA separation as the affirmative pattern for canon-sync-001's rationale) gave the session institutional-memory weight. Neither Builder nor Governors would have naturally produced those cross-repo references.
- **Issues faced?** None. First Province summons went smoothly. The Aurelius-as-Consul capacity framing from v1 handoff §3.1 had already set expectations that "Consul visits Province and defers to Builder on implementation" — no authority conflicts.

### Not invoked this session (noted for completeness)

**Solara (SEP Builder)** — no SEP work this session.
**Ashara, Petra** — Capital builders; Command-Center work not in scope.
**Ministers (Vex, Orinth, Rune, Ignis, Bard), Table of Research (Aeon, Pip)** — Cabinet-adjacent roles; no governance session today.

---

## 3. Outstanding TODOs

### In-flight monitoring

- **Wife rejoin + 72h canary window** (ongoing, Consul Co5 extended from 48h to 72h). Window: 17 Apr 23:30 IST → 20 Apr 23:30 IST. No action unless symptoms recur.
- **Post-72h canon promotion** (if window is quiet): promote canon-sync-001 AND canon-sync-002 via Codex snippet import. Both staged as drafts.
- **Dotted-literal orphan cleanup** (optional, per-doc): Architect can delete any remaining `*.YYYY-MM-DD` literal fields via Firebase Console. Architect has already done tracking + activities.

### Session 1 — Reconcile (next implementation work)

Spec at `docs/spec-2026-04-17-aurelius-device-sync-reconcile.md`. Six commits per §12:

- **C1** — Primitives (~60 LOC): `_syncNormalizeOut`, `_syncSetDocMerge`, `_syncSuppressesAutosave`, `_syncIsEmpty`, `_syncSafeKey`, `_syncStableStringify`, `_syncMeta`. Note: `_syncReconcileFallbackMs` already pulled forward into C0 v3.
- **C2** — Autosave gate at core.js:52 (~2 LOC).
- **C3** — Wrapper rewire at 5 Firestore write sites (L521, L529, L592, L834, L859).
- **C4** — **Ingress discrimination** (P4R5-7) — `MEANINGFUL_NULL_KEYS` + distinguish "absent" vs "present-null" at listener. **vaccBooked cancellations do not propagate today.** Maren's direct concern.
- **C5** — **Reconcile greenfield** (~120 LOC) — `_localPending` capture, `_reconcile`, `_reconcileSingleDocKey`, `_reconcilePerEntryKey`. Listener-ready infra from C0 v3 is the foundation.
- **C6** — HR-14 staging + optional pre-commit grep hook.

Estimated net: ~211 LOC. Resolves KL-1 (concurrent-writes-during-debounce), offline-write loss, per-entry partial shrink, P4R5-7 cancellation.

### Consul Co4 — Portfolio rotation

Next 3 days (18, 19, 20 April):

- **Codex backfill**: Aurelius has pending Phase 4 content for 6 chapters. Snippet pipeline bugs identified in v1 handoffs from earlier sessions. Priority over SproutLab.
- **SEP check-in**: Solara has not been touched in this session. Check whether invoice preview/print refinements are still queued. Look at Phase 4+ work.
- **Do NOT open SproutLab for new features** unless C0 v3/v3.1 regressions surface. Monitoring window must complete.

### Conventions (zero-LOC, non-negotiable) — still TODO

From Aurelius v1 handoff §7:

- Validation rules lock at Session 1 release (ctValidateTickets and sibling validators freeze coercion tables).
- Reconcile push guard scope documentation (inline comment at `_remoteWriteDepth` usage — specifying that it guards the immediate remote-echo save path, not nested render-saves).
- Storage-full mixed-success semantics (known limitation; eventual Firestore state reflects last successful localStorage write).
- Schema rule: nulls never undefineds in SYNC_KEYS values → **HR-13 candidate**.
- Parent spec §4.4 local-only keys (events, tomorrowPlanned, tomorrowOuting) — honor until Maren reviews promotion.

### Known limitations carried forward

- **KL-1** (C0 v3) — concurrent multi-device writes during 2s debounce window can lose remote deltas via `{merge:true}` field-level overwrite. Fixed by C5 union merge.
- **KL-2** (C0 v3.1) — orphaned dotted-literal top-level fields from pre-fix pushes persist in Firestore as dead weight. Harmless, static, optional cleanup.
- **S7** (spec §10 #1) — concurrent remote writes during reconcile push phase converge via last-writer-wins. Out of Session 1 scope; requires versioned writes or CRDTs.

### Deferred (v1.1 per spec §13)

- Month partitioning for high-frequency keys (feeding, notes) before Firestore 1MB doc limit hits.
- Per-entry meaningful-null / tombstone semantics.
- Optimistic locking / versioned writes (resolves S7).
- Reconcile observability metrics (beyond debug-level console.warn).
- Per-date union merge for activityLog.
- Migration of local-only candidates (events, tomorrowPlanned, tomorrowOuting) to SYNC_KEYS, pending Maren.
- IIFE namespacing of merge functions — revisit at 3,000 LOC sync.js.

### HR candidates

- **HR-13** (candidate) — Schema invariant: SYNC_KEYS values use null never undefined. Emerges from the convention line above.
- **HR-14** (candidate) — Reconcile Sync Invariant, drafted in spec §3. Promote after C5 ships and is empirically verified under production.

---

## 4. Issues faced during the session

### Friction points

**Pre-pull disconnect.** Lyra opened the session against a stale Termux checkout (22 commits behind origin/main). The spec referenced code (`sync.js`, `config.js`) that existed on remote but not locally. Resolved via `git pull` after parking untracked governance files. Lesson for future sessions: `git fetch` early to verify terrain matches spec assumptions. Added to S1 cleanup workflow.

**Identity mis-hypothesis.** Lyra generated an "account mix-up" theory ("signing in as wife") that survived two exchanges before the Architect corrected it ("my phone doesn't have her Google login"). Consumed ~10 minutes. Root cause: Architect's earlier observation ("my UID isn't in members, only wife's and incognito's") was plausibly explained by multiple hypotheses, and Lyra prioritized the exotic one (account confusion) over the boring one (Firebase Console UI truncation). Pattern to note: **when a symptom admits multiple explanations, rank them by how many invariants each requires to flip.**

**Canary scope too narrow.** C0 v3's canary was single-device (Architect's phone, add one feeding entry, verify Firestore). Passed. But B4 was a multi-device-specific bug (revealed when wife joined and concurrent-state interactions exposed the literal-dotted-field sibling pattern). The review chain (four governors) focused on the bug classes Lyra described, not on multi-device canary. Lesson: **emergency canaries should include the multi-device state if the fix is meant to restore multi-device function.** Added to Consul's observation list as a candidate workflow amendment.

**Spec-vs-reality minor offsets.** Spec §8 placed `MEANINGFUL_NULL_KEYS` in data.js "after KEYS is defined." In actual layout, KEYS is in core.js. Lyra adjusted placement to sync.js for co-location with SYNC_KEYS. No net impact, but slight re-planning. Not a defect — specs are mental-model first, disk-state second.

### Process notes

**Four-governor full-formal round took ~20 minutes of reading + writing.** Abbreviated round for C0 v3.1 took ~8 minutes. Both were proportionate to scope. No governance overhead felt wasteful.

**Consul's single summons was sufficient.** Co1–Co4 in the first appearance, Co5 implicitly from the extended 72h window in the C0 v3.1 re-engagement. Meta-role fit the cross-repo and canon-scope decisions without needing repeated invocation.

**Task tool usage was appropriate but started late.** Tasks weren't created until implementation began. Earlier phases (diagnosis, hypothesis generation, governance rounds) were conversational. That's the right split — tasks for work units, conversation for thinking.

### What worked well

- **Incremental release naming (C0 → C0 v3 → C0 v3.1).** Clear revision markers in commit messages. Each round built on the prior one without renaming breakage.
- **Option Y over Option A deploy procedure.** Architect's simpler instinct (abandon household vs delete subcollections) produced a cleaner workflow. Deferring the Fix-6 ("reconcile-lite in C0") to the real reconcile session kept C0 scope honest.
- **Empirical verification via Firebase Console screenshots.** Visual evidence of the dotted-literal sibling fields (`ziva_feeding.2026-04-17` beside `ziva_feeding`) was the single clearest piece of B4 evidence. Faster than tracing the code could have produced.
- **Governance hierarchy survived pressure.** Four-governor review chain under real data-loss pressure didn't degenerate into "just ship it." Maren's BLOCKER-1 objection held, and the revised C0 v3 was stronger because of it.

---

## 5. Session metadata

| Field | Value |
|---|---|
| Session ID | s-2026-04-17-01 |
| Primary Volume | sproutlab |
| Touched Volumes | sproutlab, codex (institutional-memory snippets) |
| Chapters Touched | device-sync |
| Commits shipped | `5427899` (C0 v3), `5ab16cf` (C0 v3.1), `d584a47` (archive pre-pull docs) in SproutLab; `802274a` (chronicle) in Codex |
| Bugs discovered | 4 (B1, B2, B3, B4) |
| Bugs fixed | 4 |
| Net LOC | ~90 (C0 v3) + ~15 (C0 v3.1) in sync.js |
| Governor rounds | 2 Maren, 2 Kael, 2 Cipher, 1 Consul |
| Known limitations added | KL-1, KL-2 |
| Candidate canons staged | canon-sync-001, canon-sync-002 (both pending 72h verification) |
| Candidate HRs | HR-13 (schema invariant), HR-14 (reconcile invariant) |
| Monitoring window | 72h, ends 20 April 23:30 IST |

---

*Chronicled by Lyra, 17 April 2026.*
*For Aurelius: import the companion snippet JSONs in `docs/snippets/` at your next Codex session. The canon drafts (canon-sync-001, canon-sync-002) are pending 72h verification — do not import those until the window closes quietly.*
*The fires are out. Ziva's record is intact.*
