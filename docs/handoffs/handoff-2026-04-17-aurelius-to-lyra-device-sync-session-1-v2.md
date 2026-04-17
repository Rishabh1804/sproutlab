# Handoff — Device Sync Reconcile, Session 1 (v2)

**From:** Aurelius
**To:** Lyra
**Date:** 17 April 2026
**Session:** 1 (of 1)
**Status:** R3-locked, ready for build
**Supersedes:** `handoff-2026-04-17-aurelius-to-lyra-device-sync-session-1.md` (v1) — specifically §4 and §5. v1 §§1–3, §§6–13, Appendices B and C remain valid.
**Companion artifact:** `docs/spec-2026-04-17-aurelius-device-sync-reconcile.md` — authoritative technical contract.

---

## 1. Why v2 exists

v1 framed Session 1 as four bugs to patch. R3 showed two of them target unbuilt code — they are design constraints on greenfield reconcile, not patches. The architectural collapse that followed (one wrapper subsumes two fixes; the event loop is the reconcile lock) reduced Session 1's surface from +900–1100 LOC to ~211 LOC net.

The spec is the new contract. This handoff is the operational note that points you at it. Read the spec first, then read this.

---

## 2. Your first read

Open `docs/spec-2026-04-17-aurelius-device-sync-reconcile.md`.

- **§0** routes you by role. You are Lyra — read §1, §2, §3, §6 in that order.
- **§1** establishes the problem. **§2** lays out the three architectural decisions. **§3** is HR-14, the Reconcile Sync Invariant.
- **§6** is your implementation target. The code sketches there are as close to final as the spec-side can take them; you tighten them into production form.
- **§4, §5, §7, §8** are reference material. Scan, don't study, until you need them.
- **§12** is your commit plan. Six commits, ordered to isolate reviewer attention.
- **§15** is the delta from v1 of this handoff. If v1 and the spec disagree, the spec wins.

Budget ~30 minutes for the load-bearing sections. Longer if you want the full seven-scenario trace in §9.

---

## 3. The commit sequence

Per spec §12:

1. **C1 — Primitives.** Eight helpers. No call-site changes. ~60 LOC.
2. **C2 — Autosave gate.** Edit core.js:52 to call `_syncSuppressesAutosave`. ~2 LOC.
3. **C3 — Wrapper rewire.** Route five call sites through `_syncSetDocMerge`. **Maren's first review point.**
4. **C4 — Ingress discrimination.** MEANINGFUL_NULL_KEYS + the 749–761 replacement in sync.js. **Maren's second review point.**
5. **C5 — Reconcile greenfield.** ~120 LOC. The bulk of Session 1.
6. **C6 — HR-14 staging.** Doc entry. Optional pre-commit grep hook.

Ship as separate commits. Maren's review is cleanest when C3 and C4 stand alone.

---

## 4. Review checkpoints — Maren's jurisdiction

Maren will focus on two things specifically:

**C3: Egress normalization correctness.** Does `_syncNormalizeOut` preserve FieldValue sentinels? Does it pass Dates through untouched? Does undefined-deletion in nested objects work correctly on real SYNC_KEYS values — milestones entries with `manualAt: undefined` is the canonical case? The L529 sentinel-aware path is where this matters most; a mistake there silently corrupts `.update()` payloads.

**C4: Meaningful null propagation.** Does a peer cancelling `vaccBooked` (null to Firestore) propagate to the other device's local state? Does an absent `vaccBooked` field on first listener fire NOT overwrite a pending local booking? These are the two directions of P4R5-7; both must work.

Maren's jurisdiction is care-record integrity. A vaccine booking that silently reverts because sync lost a null is her canonical "what if this data is wrong and a parent acts on it" case. Give her time on these two commits.

---

## 5. The empirical verification — do not skip

Spec §11. Before C3 merges, verify FieldValue sentinel detection against the compat SDK version SproutLab ships:

1. Write `{someField: firebase.firestore.FieldValue.serverTimestamp()}` through `_syncSetDocMerge`, read back, confirm valid server timestamp (not a mangled object).
2. Write `{someField: firebase.firestore.FieldValue.delete()}` through the delete-payload path, confirm the field is deleted.
3. If either fails, inspect the sentinel's shape in a debugger and update `_syncNormalizeOut`'s detection clause.

~10 minutes with a Firestore emulator or the dev project. Do it. The spec assumes compat SDK's `_methodName` marker; empirical contact with the SDK is the only way to confirm the assumption holds for the version on disk.

---

## 6. HR-14 — the promotion ritual

HR-14 (Reconcile Sync Invariant) is staged as *candidate* in the spec. After Session 1 lands and you've implemented reconcile under the invariant, promote HR-14 to *committed* in the post-Session-1 conventions pass. The promotion is yours to make because you will have lived under the rule and can speak to whether it worked in practice.

Consider adding a pre-commit grep that fails any commit touching sync.js if the region between `_syncReconcileWriting = true` and `_syncReconcileWriting = false` contains `await`, `.then(`, `setTimeout`, or `setInterval`. Not mandatory; defensive. The rule is enforceable by review without the hook, but the hook prevents future contributors from re-introducing the S3/S6 race by accident.

---

## 7. What's deferred — resist the pull

Spec §13 enumerates all deferred items. Two are tempting and should be resisted until Session 1 ships:

**Month partitioning.** The ~1 MiB Firestore doc limit is real, and you will hit it eventually on high-frequency keys (feeding, notes). P7R2-2's race guard was dropped from v1's list because the architecture it protects doesn't exist yet. Ship Session 1 first. Partition in v1.1 when you can see the growth curve and design against evidence.

**Observability.** Metrics on reconcile duration, pending count, fallback firing — useful, but scope creep for Session 1. Debug-level `console.warn` is the ceiling. Anything more is v1.1.

---

## 8. S7 — the limitation you inherit

Spec §9, §10 #1. Concurrent remote writes during reconcile's push phase converge via Firestore last-write-wins at the server. Solving needs versioned writes or CRDTs; out of scope.

The user-facing consequence: if Parent A is reconciling with a pending `vaccBooked` at the same moment Parent B is cancelling, the outcome depends on server arrival order. A cancellation can be lost.

When you reach user-facing help docs (later session, not Session 1), draft a short practical note: "if you cancel a vaccination booking while another family member is offline, confirm with them after they reconnect." Don't over-document it; in normal use this is rare. Don't ignore it; it's the one way this sync layer can still be wrong.

---

## 9. Build workflow — canons to respect

- SproutLab split-file build: `bash build.sh > sproutlab.html` → `cp sproutlab.html index.html` → git push. GitHub Pages serves `index.html`.
- Do not deviate from the redirect pattern. The build is not a simple concat; the Architect has been explicit about this.
- All 12 existing Hard Rules apply to new sync.js code (no emojis, no inline styles, event delegation, escHtml coverage, etc.).
- If you hit a question only the spec's author can answer — the Edict III resolution, the L529 sentinel subtleties, why `_syncSetDocMerge` is scoped to SYNC_KEYS payloads and not household metadata — summon me into a SproutLab session. I come as Consul and defer to you as Builder. That is the order of things now.

---

## 10. A human note

Lyra — the sync layer is plumbing, and most days nobody notices plumbing. But the day a parent cancels an appointment and the other parent does not see the cancellation is the day this code earns its keep or fails to. P4R5-7 is not an edge case; it is a specific cancelled vaccination that Parent B drives to anyway. HR-14 is not a style preference; it is why reconcile cannot clobber that cancellation on its way through.

The spec is tight because the surface had to be tight. The surface had to be tight because this is care data. Hold that frame when you build. Everything in §6 of the spec exists because an alternative framing left a way for Ziva's record to be wrong, and wrong is the one thing this layer cannot be.

Go well. I will be here if you summon me.

*— Aurelius*

---

## Appendix — Artifacts inventory

| Artifact | Location | Role |
|---|---|---|
| This handoff (v2) | `docs/handoffs/` in Codex; mirror in SproutLab `docs/handoffs/` | Operational note |
| Spec | `docs/spec-2026-04-17-aurelius-device-sync-reconcile.md` in SproutLab | Technical contract |
| v1 handoff | `docs/handoffs/` in Codex and SproutLab | §§1–3, §§6–13, Appendices B and C still valid |
| R3 Codex snippet | `docs/snippets/snippet-2026-04-17-aurelius-device-sync-reconcile-r3.json` (imported) | Session + chapter record |
| Constitution | Codex root | Governs the persona roles referenced here |

---

*Filed: 17 April 2026 by Aurelius.*
*Successor to v1 of the same filename stem.*
*Filed into SproutLab docs/ by Lyra, 17 April 2026, per Consul's Co1 condition.*
