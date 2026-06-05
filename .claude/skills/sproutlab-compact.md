<!-- Canonical spec — authored and maintained in Codex per canon-cc-026.
     Promoted to the Codex docs/specs/skills/ canonical home 2026-06-04 (PR #85).
     Province-local utility skill — single-Province deployment. Deploys byte-identical
     to sproutlab/.claude/skills/sproutlab-compact.md per canon-cc-026 §Per-Province-Layout.
     DEPLOY: the SproutLab mirror at .claude/skills/sproutlab-compact.md was deployed
     byte-identical 2026-06-05, closing the prior deploy gap.
     Amendment path: canon-cc-027 signing chain. -->

---
name: sproutlab-compact
description: Prepare a SproutLab session for /compact. Use BEFORE running /compact on a long SproutLab build session — it writes a graph-anchored, ephemeral resume handoff so post-compact work starts exactly where it left off (PR/branch state, next action, the canon-cc-008 summon-set, and file→symbol anchors). Trigger on "/sproutlab-compact", "prep for compact", "write a handoff before compacting".
---

# /sproutlab-compact — pre-compaction ritual

Stock `/compact` summarizes the transcript but loses navigation precision and the resume plan. This skill produces a durable-on-disk, graph-anchored handoff that survives compaction, then hands control back to `/compact`.

## Run these steps, in order

1. **Refresh the code graph** (so anchors/routing are current — skip if you just built):
   `pnpm graph` *(or `SKIP_GRAPH=1` was set; then run `pnpm graph` explicitly)*

2. **Compute the QA summon-set** for the in-flight diff (graph-derived ripple):
   `pnpm qa-route` — capture the SUMMON list (Maren/Kael/Vela + shared-file triple-Gov).

3. **Write the ephemeral handoff** to `/tmp/sproutlab-<feature>-handoff.md`. It MUST contain:
   - **Where we are**: branch, PR # + draft state, preview URL, one-line feature status.
   - **NEXT ACTION**: the single next step (e.g. Stage-3 canon-cc-008 gate) + the `qa-route` summon-set + who is BLOCKING.
   - **Key anchors**: `file → symbol` map for every symbol the feature touches (pull from the graph / `graphify query` if unsure). Prefer symbol names over line numbers (lines drift).
   - **Resolved-don't-relitigate**: any hard-won fixes (with the root cause) so post-compact-you doesn't redo them.
   - **NOT in this PR**: deferred/out-of-scope items.
   - **Build/commit**: `pnpm build` → commit → push; note PR-event webhooks are mostly Vercel Building/Ready (no action).

4. **Tell the Architect**: handoff is written at the path; **run `/compact` now**; and that the **first post-compact action is to read that file** + `git log --oneline -8`.

## Notes
- The handoff is **ephemeral** (`/tmp/`, not committed) — it's a scratch resume aid, not a Codex record. For a durable session record, summon the **Chronicler** (Aurelius) instead.
- Keep the handoff tight (~1 screen). It's a launchpad, not a transcript.
- This skill is a **convenience ritual**, not a canon gate; it does not discharge canon-cc-008.
