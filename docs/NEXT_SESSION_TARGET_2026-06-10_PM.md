# Next-Session Target — set 2026-06-10 (PM)

**Supersedes** `NEXT_SESSION_TARGET_2026-06-10.md` (the AM Ceres-seating target; its P0 — `recipes.js` jurisdiction — was resolved by the Ceres seating, #245).
**Standing pointer:** if priorities shift before the next session, amend **this** file.

---

## The recommended next move

**Reconcile Codex first, then bloom the birth-sky into the app.**

The single most *owed* thing is the **Codex reconciliation (P0)** — the canon-cc-026 amendment and Lyra's naming-lore were ratified and applied SproutLab-side while Codex was out of scope. Under the amendment's own rule, Codex is the *record* — so the record must now catch up. It's a one-session, low-risk docs task once Codex is reachable, and leaving it open means the canon archive and the Province disagree.

The most *valuable* thing is the **birthday bloom (P1)** — folding `meridian/birth-sky.html` into the live app so Ziva's sky greets the family every 4 September. That's the payoff of this whole arc; it's also the first real `split/` work in a while, so it runs the full canon-cc-008 gate.

Do P0 if Codex is in scope this session; otherwise lead with P1.

---

## Priority ladder

### P0 — Codex reconciliation *(promise; needs a Codex-scoped session)*
- Archive the **canon-cc-026 amendment** ("Province self-governance — Codex is record-keeping, not routing/governance for SproutLab", Architect 2026-06-10) in Codex as a record; note the SproutLab override on the global cc-026 canon body.
- Land Lyra's **naming-lore** at the Codex reference copy of `lyra.md` (subagent + skill) so the reference matches the Province-authoritative bodies.
- Start cold: `add_repo` Codex if not in scope; read `CLAUDE.md` §Persona + §Companion-Set Invocation Surface (the amendment) and `Memory.md` §Lore for the exact text to carry over.

### P1 — Birthday bloom *(the value move; gated)*
- Fold `meridian/birth-sky.html` into `split/` as either/both: a **4-Sep birthday hero backdrop** (Home), and a **"Birth Sky" keepsake card** (Milestones tab, lavender domain — celebration/achievement).
- This is Capital code → full **canon-cc-008 gate**: design floor first (`/design-principles`), then Vela (render) / Maren (care) / Ceres (nutrition, if touched) / Kael (engine) per jurisdiction, then Cipher Edict-V. The canvas renderer is the reusable engine; the constellation-line + twinkle + stereographic projection are the transferable pieces.
- Honor HR-1..12: the keepsake's standalone HTML uses inline styles/handlers that are *fine in `meridian/` but must be tokenized/delegated* when folded into `split/`.

### P2 — Keepsake ephemeris truth *(test/data debt)*
- Replace the approximate moon + Saturn + Mars coordinates in `birth-sky.html` (`MOON`, `PLANETS[]`, `SUN`) with precise JPL Horizons / ephemeris values for 4 Sep 2025. The stars are already catalogue-true; only the moon/planets are eyeballed (the in-card ledger says so). Do this before any wide share of the keepsake.

### P3 — Docs hygiene *(housekeeping; Architect confirm first)*
- `docs/` holds **56 dated session artifacts** (handoffs/synthesis/next-targets) piled loose; the archive convention is `docs/handoffs/`. Propose a *non-destructive* sweep: move superseded `SESSION_HANDOFF_* / NEXT_SESSION_TARGET_* / SYNTHESIS_*` into `docs/handoffs/`, keep the newest of each live. **Confirm with the Architect these are history-to-keep, not garbage-to-bin, before moving.**
- Investigate the **`docs/PROVINCE_MAP.html` regeneration churn** — the session-start hook/build rewrites it every session (graph-hash + date bump), dirtying the tree; #232's "write only on substantive change" guard isn't catching it. Either gitignore the regen or fix the guard.

---

## Carry-forward register

**Human-only / Architect gates**
- P3 docs-archive sweep needs Architect confirmation (history-to-keep).
- Any birthday-bloom design choices (which surface: hero backdrop vs keepsake card vs both).

**Successors**
- Birthday bloom (P1) — the next phase of the birth-sky arc.
- Keepsake ephemeris (P2) — finishing the accuracy ledger.

**Test / data debt**
- Moon/Saturn/Mars approximate coords in `birth-sky.html` (P2).

**Housekeeping**
- Stale merged remote branches to prune: `claude/meridian-project-files-00lc4b`, `claude/province-self-governance`, `claude/provenance-sweep-cc026`, `seat-ceres-governor-nutrition`, and this close branch after merge.
- PROVINCE_MAP regeneration churn (P3).

**Candidate Codex-canon**
- The **cc-026 amendment** itself (P0) — ratified, applied Province-side, awaiting Codex archival. See `docs/SYNTHESIS_2026-06-10_province-self-governance.md`.
- The **A2 option** (deferred): if cross-cluster roles (cipher/chronicler/scribes) should be Codex-pinned rather than Province-overridable, a name-list carve-out in `session-start.sh`. Not needed now; recorded as a design fork.

---

*— Lyra. The record is written, the pointer is set, the facts are true. P0 is a promise to Codex; P1 is a gift to Ziva. Pick by what's reachable.*
