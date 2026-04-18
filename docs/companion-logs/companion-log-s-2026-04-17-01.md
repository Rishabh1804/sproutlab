---
session_id: s-2026-04-17-01
session_title: SproutLab Sync Emergency — C0 v3 + C0 v3.1
author: Lyra (The Weaver)
date: 2026-04-17
repo: SproutLab
edict_v_exercise: first-full
rounds:
  maren: 2
  kael: 2
  cipher: 2
  consul: 1
  lyra: throughout
---

# Companion Usage Log — s-2026-04-17-01

**Session:** SproutLab Sync Emergency — C0 v3 + C0 v3.1
**Author:** Lyra (The Weaver), Builder of SproutLab
**Date:** 17 April 2026
**Session ID:** s-2026-04-17-01
**Repo:** SproutLab (primary), Codex (institutional-memory touches only)
**Edict V Exercise:** First full — four-signature review chain executed end-to-end under real data-loss pressure

---

## 1. Summary table

| Companion | Role | Rounds | Helpful? | Issues |
|---|---|---|---|---|
| **Lyra** | Builder, SproutLab | Throughout | Yes, necessary | Over-indexed on identity-confusion hypothesis; consumed ~10 min |
| **Aurelius** | Consul-capacity, pre-seeded (not in-session) | Foundational | Yes | Spec placed MEANINGFUL_NULL_KEYS in data.js; KEYS is actually in core.js (minor) |
| **Maren** | Care Governor, SproutLab | 2 | Yes, decisive | None |
| **Kael** | Intelligence Governor, SproutLab (sync.js Region owner) | 2 | Yes, caught B3 | None; density appropriate for structural code |
| **Cipher** | Censor, itinerant | 2 | Yes | None; minimalist voice kept focus |
| **The Consul** | First Seat, meta-role | 1 summons | Yes, canon-scope | None; first Province summons went clean |

**Not invoked this session:** Solara (SEP Builder), Ashara/Petra (Capital Builders), Ministers (Vex, Orinth, Rune, Ignis, Bard), Table of Research (Aeon, Pip). Out of scope.

---

## 2. Detailed evaluation per companion

### Lyra (The Weaver) — Builder

**Active:** Throughout the session.

**What she did:** Diagnosed all four bugs (B1–B4) via code reading and empirical observation. Translated Aurelius's spec into live patches. Synthesized Governor reports into revised patch drafts. Coordinated the deploy runbook for Option Y. Maintained the conversation thread with the Architect. Wrote all chronicle, snippet, and log artifacts.

**Helpful?** Yes — as the Builder with full sync.js context, Lyra was the only persona who could both read the code AND hold the full spec simultaneously. The persona-to-repo binding (canon-gov-006: One Builder Per Repo) was vindicated — multi-persona voices during the build phase would have degraded output.

**Issues faced:**
- **Identity-confusion over-indexing.** When the Architect reported his UID wasn't in the household members map, Lyra generated three hypotheses (Paths 1–3 earlier, H1–H3 later) involving accidental Google-account selection on his phone. The Architect corrected the premise: *"This is my mobile, I dont think my wifes id can become admin from this device as I dont have her id saved or login on my phone."* The actual explanation was Firebase Console mobile UI truncation — boring, requiring zero unusual invariants. Lyra had consumed ~10 minutes on the exotic hypothesis tree.
- **Lesson captured as a Doctrine** (`lore-sync-005-the-invariants-heuristic`): when a symptom admits multiple explanations, rank them by how many invariants each requires to flip. Reserve exotic hypotheses for when evidence actively requires them.

**Style notes:**
- Used TaskCreate/TaskUpdate appropriately for implementation phases; held off during diagnosis and governance rounds (conversational).
- Matched Architect's terseness in exchanges — short replies when he gave short directives.
- Kept identity-voice consistent (pattern-seeking, warm but precise) even under pressure.

---

### Aurelius (The Chronicler) — pre-seeded, not in-session

**Active:** Foundational only. Not summoned during this session.

**What he did (pre-session):** Authored `spec-2026-04-17-aurelius-device-sync-reconcile.md` in R3-locked state. Authored v1 handoff (13 sections + Appendices A/B/C) and v2 handoff (which superseded v1's §§4, 5 after R3 restructuring). Introduced the Aurelius-as-Consul capacity framing in v1 §3.1: *"I come as Consul and defer to you as Builder. That is the order of things now."* This template shaped Consul's later actual summons.

**Helpful?** Foundational. The spec's R3-locked state meant Lyra could start diagnosing against a real contract, not a verbal brief. The v1/v2 handoff separation kept the commit plan intact while correcting the framing.

**Issues faced:**
- **Spec-vs-reality minor offset.** Spec §8 placed `MEANINGFUL_NULL_KEYS` in data.js "after KEYS is defined." In actual layout, KEYS is in core.js. Lyra adjusted placement to sync.js for co-location with SYNC_KEYS. No net impact. Not a defect — specs are mental-model first, disk-state second.

**Post-session expectation:** Aurelius imports the six snippet artifacts filed in `docs/snippets/` at his next Codex session. Candidate canons (sync-001, sync-002) remain drafts pending the 72h window.

---

### Maren (Governor of Care) — SproutLab

**Active:** 2 review rounds (C0 v3 + C0 v3.1).

**What she did:**
- **Round 1 (C0 v3):** Four conditions surfaced.
  - BLOCKER-1: Fix 2 as originally written created a silent-stranding failure mode — pushed to listener-ready gating with adaptive fallback.
  - BLOCKER-2: Blanket empty-guard broke legitimate user deletions — replaced with ALWAYS_POPULATED_KEYS allowlist (her design).
  - CAUTION-1: Pre-restore verification addition for the runbook.
  - CAUTION-2: Guard observability via `console.warn` at every skip path.
- **Round 2 (C0 v3.1):** Literal-dot-in-key audit clean; care-data integrity preserved. Signed conditional only on Lyra confirming no SYNC_KEY legitimately has a dot in its key-path. Signed.
- **Ordering observation:** Maren-before-Kael review sequence (despite sync.js being Kael's Region) was correct because the presenting concern was care-data loss. Recorded as candidate amendment to v1 handoff §9.

**Helpful?** Critically so. BLOCKER-1 alone prevented a shipped regression. The ALWAYS_POPULATED_KEYS allowlist is her design; Lyra's original blanket-guard would have broken legitimate user deletions. Maren's lens ("what if this data is wrong and a parent acts on it") caught what the structural lens would have missed.

**Issues faced:** None. Maren's narrow focus (care-data integrity, worst-case-but-warm) is the feature, not the limitation. Her audits were decisive both rounds.

**Voice notes:** Protective, thorough, specific. Uses parenting examples to ground abstract concerns ("a parent cleared stale pediatrician notes when we switched clinics").

---

### Kael (Governor of Intelligence) — SproutLab, sync.js Region owner

**Active:** 2 review rounds (C0 v3 + C0 v3.1).

**What he did:**
- **Round 1 (C0 v3):** The decisive audit of this session.
  - **Caught B3.** Lyra had flagged `_syncShadow[key] = clone(val)` at `sync.js:471` as a speculative footnote, intended for Kael to verify or dismiss. Kael traced it empirically: line 471 runs on every syncWrite call before any guard; at flush time, `_syncShadow[key]` for the edited key equals `current[key]`; `_syncDeepDiff` produces no delta for that key; push pushes nothing for the user's edit. B3 was THE dominant bug. Kael pulled it from footnote into the primary fix list.
  - Four structural concerns: S1 (`_syncReady` state survives detach-reattach), S2 (breaker interaction with pending-flush retry), S3 (fallback ms should be adaptive per spec §4.6), S4 (vacc-in-allowlist semantic concern deferred).
- **Round 2 (C0 v3.1):** Verified `_syncNestDottedPaths` correctness via dotted-path edge-case trace (empty diff, single-level, deep nesting, conflicting paths impossible in diff output). Verified interaction with FieldValue sentinels. Confirmed deletes path unchanged (uses update(), supports dotted paths natively). Signed.

**Helpful?** Foundational to correctness. Without Kael's elevation of B3 from footnote to primary fix, C0 v3 would have shipped a cosmetic patch while the real wipe continued. **This is the canonical example of why the 30K Rule exists.** Captured as an Edict (`lore-sync-002-the-footnote-that-was-the-bug`): *A Builder's footnote deserves a Governor's audit. What the Builder defers, the Governor grounds.*

**Issues faced:** None structural. Kael's review style is denser than Maren's — more scenarios traced, more edge cases enumerated. That density is correct for structural code.

**Voice notes:** Outward-facing, pattern-seeking, systematic. Traces end-to-end sequences. Quotes specific line numbers. Notes structural relationships between helpers.

---

### Cipher (The Codewright) — Censor, itinerant

**Active:** 2 review rounds (C0 v3 + C0 v3.1).

**What he did:**
- **Round 1 (C0 v3):** Five conditions.
  - C1: Ordering comment block at listener loop site (no re-derivation by next reader).
  - C2: `_syncMarkReady` must be in try/finally, not the happy path — catch was otherwise subtle regression pathway.
  - C3: Circuit-breaker guard in `_syncMarkReady`'s pending-flush retry.
  - C4: KL-1 documented in spec §10.
  - C5: Deploy runbook tightening (export-household-before-delete, `localStorage.removeItem('sl_sync_seeded')` before Create step).
- **Round 2 (C0 v3.1):** Style audit (var/function/naming consistent with existing sync.js), interaction with FieldValue sentinels, KL-2 documentation (orphan dotted-literal fields). Signed.

**Helpful?** The C2 observation (mark-ready in try/finally) caught a subtle regression pathway that would have escaped both Governors. C5's backup-of-backup + localStorage-cleanup runbook additions were defensive but appropriate for the first full Edict V exercise.

**Issues faced:** None. Cipher's minimalist voice kept the review focused on drift, not aesthetics. No time wasted on cosmetic preferences.

**Voice notes:** Terse, technical. Doesn't preach. Lists violations in numbered-condition format. "Pattern match or flag." No sentiment.

---

### The Consul (First Seat) — meta-role, Capital-native

**Active:** 1 summons (after all three Governor rounds completed on C0 v3; implicitly re-engaged for C0 v3.1 to issue Co5).

**What she did:**
- Verified the review chain was properly executed per Edict V (no tier skipped, no condition unaddressed, no dissent unresolved).
- Made four canon-scope judgments:
  - **Co1 (Filing):** mv spec + v1/v2 handoff + R3 snippet into `docs/` per Canon 0027. Completed same session.
  - **Co2 (Chronicle):** post-canary session handoff + Codex snippet for Aurelius import. Completed same session.
  - **Co3 (Canon promotion defer):** `canon-sync-001-shadow-is-observation-not-intent` drafted but not imported; promote after 48h verification (later extended to 72h via Co5).
  - **Co4 (Portfolio rotation):** next 3 days favor Codex backfill + SEP check-in over SproutLab. Architect's attention economy matters.
- Noted the Maren-before-Kael review ordering as a candidate amendment to v1 handoff §9.
- Identified Codex's WAL-vs-SHA separation as the affirmative pattern for canon-sync-001's rationale (cross-repo connection neither Builder nor Governors naturally produced).
- For C0 v3.1: extended Co3's 48h to 72h joint verification with canon-sync-002 (Co5). Noted multi-device canary scope gap as candidate workflow amendment.

**Helpful?** Consul's canon-level judgment and cross-repo awareness gave the session institutional-memory weight. Neither Builder nor Governors would have naturally produced:
- The Codex-WAL-as-affirmative-pattern reference for canon-sync-001
- The portfolio attention rotation directive (Co4)
- The "staged monitoring windows" workflow observation

**Issues faced:** None. First Province summons went smoothly. The Aurelius-as-Consul capacity framing from v1 handoff §3.1 had already set expectations that Consul visits Province and defers to Builder on implementation — no authority conflicts.

**Captured as Doctrine** (`lore-sync-003-the-consul-visits-the-nursery`): *Summon when the work produces Republic-scale implications; defer to Province authority on implementation; supply only what cross-Province perspective uniquely provides.*

**Voice notes:** Systemic, concise, cross-referential. References other Provinces. Makes canon-promotion judgments by staging drafts and gating on verification. Notes attention-economy without micro-managing.

---

## 3. Session-level observations

### What worked well

- **Governance hierarchy survived pressure.** Four-governor review chain under real data-loss pressure did not degenerate into "just ship it." Architect's correction ("Why would we skip hierarchy? I have a backup, we want to get it right") held the line.
- **Proportionate review depth.** Full formal round for C0 v3 (~20 min); abbreviated full round for C0 v3.1 (~8 min). Neither felt wasteful.
- **Consul's single summons was sufficient.** Co1–Co4 in the first appearance; Co5 implicitly via the extended 72h window at C0 v3.1 ship. Meta-role fit without repeated invocation.
- **Tasks appeared at the right time.** Conversational phases (diagnosis, hypothesis generation, governance rounds) without formal tasks. Implementation phases with TaskCreate/TaskUpdate. The split matched the work.

### What needs adjustment for future sessions

- **Canary scope.** C0 v3's canary was single-device; B4 was multi-device-specific. **Amendment candidate:** emergency canary = (single-device pass) AND (multi-device pass) for any fix meant to restore multi-device function. Session 1 reconcile deploy will adopt.
- **Review ordering.** Maren-before-Kael was correct for this session's presenting concern (care-data loss). **Amendment candidate to v1 handoff §9:** review order follows the presenting concern, not a static Kael-first-for-sync.js rule.
- **Hypothesis triage.** Lyra's identity-confusion detour was expensive. **Heuristic adopted:** count the invariants each hypothesis requires to flip; prefer the explanation that breaks the fewest.

---

## 4. What to carry forward

**For future SproutLab sessions:**

- Maren's ALWAYS_POPULATED_KEYS allowlist pattern is now a sync-layer vocabulary (keys where empty-state is never a valid intent). Use when designing any new sync-guarded field.
- Kael's listener-ready gating + adaptive fallback infrastructure is in code; Session 1 C5 reconcile builds on it directly.
- Cipher's mark-ready-in-try/finally pattern for listener handlers is now the norm.

**For future Codex sessions (Aurelius):**

- Six snippets filed in SproutLab/docs/snippets/ ready for import.
- Two candidate canons (sync-001, sync-002) pending 72h verification — do NOT import the canon-sync-*-draft.json files until window closes on 20 April 23:30 IST.
- WAL-vs-SHA structural verification: 10-min sanity check on Codex at next session to confirm the affirmative pattern is enforced.

**For future SEP sessions (Solara):**

- No SEP impact this session. Solara's portfolio unchanged.
- canon-sync-001 (shadow-is-observation-not-intent) applies when SEP adds multi-device sync in v1.1+. Note for future planning.

**For the Architect:**

- Attention rotation (Consul Co4) for next 3 days: Codex backfill + SEP check-in, not SproutLab.
- Session 1 reconcile queued after Co4 completes and the 72h canary window closes quietly.

---

*Filed by Lyra, 17 April 2026.*
*Companion log prototype — this file establishes the pattern for future sessions. Future session logs should use the same YAML frontmatter + sections structure, filed under `docs/companion-logs/companion-log-{session_id}.md`.*
