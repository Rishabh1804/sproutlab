# Handoff — Device Sync Spec, Session 1

**From:** Aurelius, Chronicler of the Order (Consul; Codex Builder)
**To:** Lyra, The Weaver (SproutLab Builder)
**Dated:** 17 April 2026, Jamshedpur
**Re:** SproutLab Device Sync Refinement Spec — Session 1
**Status:** Specced through Pass 7 R2. R3 pending. Build not yet begun.
**Classification:** Handoff · Chronicle-grade (source for Lore if ratified)

---

## 1. Why this letter exists

Lyra — you and I share a repo boundary and not much else. Codex is my library; SproutLab is your nursery. Usually we stay in our Provinces and Cipher carries cross-cutting concerns between us.

This one crossed the boundary before the Constitution was ratified, and I carried it too far into your house. The Architect began a refinement spec for SproutLab's device sync over seven passes of the SPEC_ITERATION_PROCESS. I scaffolded most of those passes in Consul capacity, under the Aurelius+Cipher synergy pair (spec then build, architecture clarity). The work is solid. But under Constitution v1.0 it should never have been authored without you in the room.

This letter is the correction: the spec, the decisions, the open questions, and the sign-off chain — handed to you now so the build is yours from here.

The voice of the spec is mine. The voice of the build must be yours. Read, amend, reject — your authority is absolute inside your Province.

---

## 2. What you are inheriting

A refinement spec for `split/sync.js`, anchored in the 6223185 single-doc refactor and extending it. Seven passes across four cognitive modes:

| Pass | Mode | Output |
|------|------|--------|
| 1 | Foundations (keys, config, normalization) | SYNC_KEYS audit; JSON round-trip safety; adaptive reconcile timer |
| 2 | Architectural correctness | Dirty-propagation; remote-echo depth guard; first-call boot path |
| 3 | Integration | CareTicket perms; autosave / reconcile race; sleep buffer handoff; merge-output field safety |
| 4 | Remaining scenarios | DST, print dialog, private browsing, corrupted Firestore cache, tab-close, uid rotation, null-field semantics |
| 5 | Drift | Spec maintenance, pricing model, parent-spec divergence |
| 6 | Friction | Helper function ergonomics, security rules coupling, internal organization |
| 7 | Consistency | Error-path unification, rollover race, IR numbering hygiene |

Each pass got a second round (R2). The result is ~1,250 LOC of implementation work identified: sync.js proper, plus surrounding infrastructure (SYNC_KEYS config, merge functions, storage-full UI touchpoints).

The spec's own voice is terse. Expect it to read as a change list with rationale, not as a tutorial.

---

## 3. What Constitution v1.0 changed mid-flight

I did most of the spec work before the Constitution was ratified on 15 April. It has three consequences you need to know before you open the file.

### 3.1 You are the Builder. I am not.

Under PERSONA_REGISTRY v1.1, SproutLab's Builder is Lyra. Aurelius is Codex Builder and Consul. The spec you are receiving was authored by me in Consul/spec-partner capacity — which is legitimate under Book II Article 5 (the Aurelius+Cipher seed synergy pair is exactly "spec then build") — but the *implementation* belongs to your Province. I have no authority to commit lines to sync.js, and no intention of trying.

Treat the spec as a long proposal from a friendly Consul. Push back wherever I drew a line wrong.

### 3.2 Edict III governs the subject matter directly.

Book IV, Edict III — Sync Pipeline is Authoritative. Direct quote from the ratified text: *"All writes to any in-memory store shall pass through the canonical pipeline — specifically, methods that create Write-Ahead Log entries (`store.addX`, `store.updateX`, `store.deleteX`). Direct pushes to store arrays bypass synchronization and create architecture debt."*

The spec honors this at the save() boundary. It does not fully honor it in reconcile's push path. See §5 — that open question is now a constitutional one, not just a code smell.

### 3.3 Edict V sets the sign-off bar.

sync.js is load-bearing for every Region in SproutLab. At minimum it is a Border between Care (Maren) and Intelligence (Kael). Read strictly, it may be Capital. Either reading triggers Edict V — Capital Protection — which requires:

- Your explicit review as Builder
- Cipher's formal sign-off as Censor of Cluster A
- Acknowledgment from every Governor whose Region is affected — Kael (owns sync.js) and Maren (owns the Care SYNC_KEYS: milestones, vaccBooked, foods, and anything touching medical.js state)

Four signatures, not one. Plan the QA accordingly. The order matters: you synthesize first, Governors audit their jurisdictions in parallel, Cipher does the cross-cutting final pass.

---

## 4. The four real bugs — your must-fix list

Out of ~1,250 LOC of spec output, four items are actual bug fixes. Everything else is robustness, conventions, or documentation. These four are what must ship.

### 4.1 P1R2-2 — Normalize undefined to null at save() boundary

**What:** `JSON.parse(JSON.stringify(val))` drops `undefined` properties. Some SYNC_KEYS (notably milestones entries with `manualAt: undefined`) acquire shape drift through the clone-detect-push cycle, producing false-positive change detection and — worse — undefined-valued fields that Firestore rejects or silently omits under `setDoc(..., {merge:true})`.

**Fix:** A `_syncNormalize(val)` helper applied at the save() boundary, walking the object and coercing undefined → null. Roughly 12 LOC. Apply inside save() before the JSON.stringify used for change-detect AND before the localStorage write.

**Schema convention this establishes:** every SYNC_KEYS value's fields must be null when absent, never undefined. Document this in the spec as a Hard Rule candidate — HR-13, if you're willing to promote.

### 4.2 P3R4-2 — Gate autosave during reconcile, with try/finally

**What:** Autosave fires from save() whenever `_remoteWriteDepth === 0`. During reconcile's merge-save loop, `_syncReconcileWriting` is set — but only around _markDirty, not around triggerAutosave. The window between two reconcile writes catches autosave mid-merge. User later restoreAutosave → inconsistent snapshot with some keys post-merge and some pre.

**Fix:** Extend the reconcile gate to triggerAutosave, and wrap the reconcile loop in try/finally so the flag clears on exception. Roughly 3 LOC if you add the try/finally explicitly (which you should — implicit flag-clearing is a bug farm).

**Maren should especially scrutinize this.** A restored inconsistent snapshot means the parent sees a wrong picture of Ziva's day. That is her exact jurisdiction.

### 4.3 P3R4-4 — _syncNormalize inside _reconcilePushSingleDoc

**What:** Reconcile builds a payload of merged values and calls setDoc directly, bypassing save() — and therefore bypassing the normalization from 4.1. Undefined-field problem returns at reconcile time.

**Fix:** Apply `_syncNormalize` at the reconcile push boundary too. 1 LOC per key in the payload builder, or a single pass over the payload before setDoc.

**But before you apply this, see §5.** Edict III may demand a larger refactor here that subsumes this fix.

### 4.4 P4R5-7 — MEANINGFUL_NULL_KEYS with `in` operator

**What:** The empty-field guard in the listener path treats `null` as "nothing to write, skip." For keys where null is a meaningful state (vaccBooked null = booking cancelled), peer cancellations become invisible.

**Original fix:** exempt listed keys from the empty-guard.

**Refined fix (this must go in):** distinguish between *absent* (first listener fire before anyone has written the key — `!(key in snap.data())`) and *present-but-null* (a real cancellation). Only the latter is meaningful. Roughly 5 LOC.

```js
const remoteData = snap.data();
const hasField = key in remoteData;
const isMeaningfulNull = hasField && remoteVal === null && MEANINGFUL_NULL_KEYS.has(key);
if (_syncIsEmpty(remoteVal) && !isMeaningfulNull) return;
```

**Maren must see this one.** If Parent A cancels a vaccination booking and Parent B never sees the cancellation, Parent B may drive to a booking that does not exist, or double-book. This is her canonical "what if this data is wrong and a parent acts on it?" case.

---

## 5. The Edict III question — open

The P3R4-4 fix patches the symptom. The underlying question is whether reconcile's push should route through save() at all.

The current architecture: reconcile computes the merged value in-memory, writes it to localStorage via save() on the local side, and *separately* pushes the same merged value to Firestore via a direct setDoc in _reconcilePushSingleDoc. Two writes. The localStorage one is canonical (it goes through the pipeline); the Firestore one is a side-channel.

Edict III reads strictly: "All writes to any in-memory store shall pass through the canonical pipeline." Firestore is an in-memory store from the app's perspective (the Firestore SDK caches in-memory until flush). A direct setDoc bypasses the pipeline in the Edict's sense.

A principled alternative: route the push through a `_syncPushViaSave(key, val)` wrapper that calls save() (which triggers the single-doc debounced flush). One write path. Edict III honored. Cost: latency (debounce adds ~150ms to reconcile push visibility) and loss of the "reconcile pushes immediately, no debounce" property that R4 introduced.

**I don't know which way you'll go.** Both are defensible. The fast path (current architecture) is operationally cleaner; the principled path (route through save) honors the Constitution more directly. If you choose the fast path, document the exception — "reconcile push is a deliberate Edict III carve-out, justified by latency requirements of conflict resolution." That's permitted; Edict III's rationale is anti-debt, not anti-latency.

If you choose the principled path, P3R4-4's 1-LOC fix becomes redundant. The refactor is bigger but cleaner.

**I recommend: decide before R3.** R3 is the composition pass on the four bugs and their intersection with listener-echo, reconcile, and month-rollover. If you refactor the push path, R3's scope changes. Cleaner to know now.

---

## 6. Robustness refinements — ship if you have bandwidth

These are not bugs. They are the spec's "worth doing" list. Skip any that feel speculative.

**P1R2-3 — Adaptive reconcile fallback via navigator.connection.** The 15s fallback is arbitrary. On slow-2g the listener may not have settled; on LAN it's overkill. Scale to effectiveType. +8 LOC. Low risk, easy win.

**P6R3-1 — safeKey wrapper for mergeUnionByKeyFn.** Malformed entries (food with name: null, etc.) cause keyFn to throw and the whole merge to fail. A synthetic key based on JSON.stringify of the entry preserves the bad entry without infecting dedup. 0 LOC net vs spec baseline; material robustness gain.

> **Maren note:** silent-dropping of malformed food entries is her domain too. If a food entry loses the merge because its name field is null, the parent never sees it again — and may re-introduce the allergen thinking it hasn't been logged. Edge, but worth her eyes.

**P7R2-1 — Unified quota-err event log.** Two error paths (_syncTry's crash log and _handleStorageFull's user toast) currently diverge. +3 LOC to consolidate. Pure hygiene.

**P7R2-2 — Month-rollover race guard.** IR-55's online re-arm during DA-1's month-doc subscription transition can fire reconcile before the new month's listener server-acks. `_syncMonthlyRolloverInProgress` flag + try/finally. +5 LOC.

**P5R3-1 — Section markers.** sync.js heading toward ~2,000 LOC post-Session-1. Cipher's cross-cutting audits benefit from navigational region markers. ~32 LOC of comments. Zero runtime cost. Do this last; comments don't break builds.

---

## 7. Conventions — zero LOC, non-negotiable

Document these in the spec header, not as code. They govern future sessions.

**Validation rules lock at Session 1 release.** (P2R7-1) ctValidateTickets and any sibling validators freeze their coercion tables. Fleet drift across versions produces fix-oscillation otherwise. When a rule must change, it must be versioned with a migration, not silently updated.

**Reconcile push guard scope.** (P2R7-2) `_remoteWriteDepth` guards the immediate remote-echo save path, not any side-effect renders triggered by that save. Nested render-saves to different keys go through their own path. Document this inline so the next reader doesn't re-derive it.

**Storage-full mixed-success semantics.** (P2R7-4) Under storage-full conditions with mixed-success save() calls, the eventual Firestore state reflects the last successful localStorage write, not necessarily the last save() call. This is a known limitation, not a bug.

**Schema: nulls, never undefineds, in SYNC_KEYS values.** (P1R2-2 consequence) If this becomes HR-13, the convention gets teeth automatically.

**Parent spec §4.4 local-only stays for Session 1.** (P1R2-1) I flagged three keys (events, tomorrowPlanned, tomorrowOuting) as candidates for promotion to SYNC_KEYS — they are co-parenting coordination data. But the parent spec's authors had reasoning I don't have visibility into. Honor their decision until Maren reviews. If she agrees to promotion, schedule as v1.1 migration with a seed + DS-2 extension checklist.

---

## 8. Deferred — explicitly not in Session 1

To keep the scope honest:

**Offline queue (IR-55/57 territory beyond the re-arm).** Pre-session deferral. Not Session 1.

**Firestore pricing model risk.** (P5R3-2) Operational, not architectural. Out of sync.js's scope.

**IR numbering overhaul.** (P7R2-3) Spec hygiene — renumber the chaos (I-, IR-, DA-/DO-/..., F-, C-, PR-) into REQUIREMENTS / CONVENTIONS / DEFERRED. Nice, but a separate pass. Don't block the build on this.

**Parent spec / our spec coordination.** (P5R3-3) After Session 1 ships, parent spec DEVICE_SYNC_SPEC.md §7.5 should reference our document as the authoritative reconcile design. Coordinate with whoever owns the parent spec — that may be a Consul-level conversation, not a Builder one.

**Promotion of events/tomorrowPlanned/tomorrowOuting to SYNC_KEYS.** (P1R2-1) Awaiting Maren.

**IIFE namespacing of merge functions.** (P6R3-2) Considered and rejected for Session 1 — section markers are sufficient. Revisit if sync.js crosses 3,000 LOC.

---

## 9. The sign-off chain — your path to merge

Per Edict V and the PERSONA_REGISTRY QA chain:

1. **You** finalize the spec (amend as you see fit; my authorship does not bind your signature) and implement.
2. **Kael** audits sync.js changes — his Region, his jurisdiction. His lens: Firebase sync boundaries, try/catch coverage, crash-breaker integrity, schema migration backward-compat.
3. **Maren** audits the three flagged bugs (P3R4-2 autosave gate, P4R5-7 vaccBooked cancellation, P6R3-1 malformed food entries) plus any SYNC_KEY whose merge semantics affect Care-domain data. Her lens: what if this data is wrong and a parent acts on it.
4. **Cipher** does the cross-cutting final pass — HR compliance, shared module consistency, cross-Governor integration.
5. You synthesize the Governor reports, apply fixes, and mark complete.

This is heavier than our usual QA. Edict V is what makes it so. Build the PIP-like scaffolding into the session itself: reduce other SproutLab scope during this window, use the Aurelius+Cipher synergy as coaching if you hit architectural doubt, chronicle the final decision.

---

## 10. Build sequencing — recommendation

If you take the spec as-is:

1. **Decide the Edict III question** (§5). Refactor-through-save, or documented carve-out. Do this first; it changes the shape of what follows.
2. **Land the four real bugs** (§4). Small diffs, testable in isolation. Each gets its own commit. Each commit message references the PR number from the spec.
3. **Apply the conventions** (§7) as inline comments or a spec-header block. Zero code change; pure documentation.
4. **Add robustness refinements** (§6) one at a time. Test after each. P5R3-1 section markers last.
5. **Run R3 against the integrated change** — the composition pass on the four bugs under the listener-echo + reconcile + month-rollover intersection. If R3 surfaces nothing new, lock.
6. **Sign-off chain** per §9. Expect at least one round trip to Maren on the meaningful-null logic; she has seen this class of bug before.

Do not ship conventions and refinements in the same commit as the real bugs. They have different review priorities and the four bugs are what Maren will want to see isolated.

---

## 11. What R3 will produce

R3, as I scoped it to the Architect: a focused composition pass on the four real bugs plus the three refinements from my R2 response (the `in` operator fix for 4.4, the try/finally for 4.2, the JSON.stringify fallback for 4.3's safeKey peer).

If R3 finds no new real bugs, the spec locks and you are cleared to build.

If R3 finds a new real bug, it joins the must-fix list. Another R may follow. The SPEC_ITERATION_PROCESS exit criterion is: only cosmetic bugs remain.

**I will run R3 if you want me to.** Or you can run it yourself as Lyra — your composition lens may catch patterns mine missed. Your call.

---

## 12. On picking this up — notes for the first read

A few things I would tell myself if I were opening this spec cold:

**The spec's LOC estimates are gross, not net.** Some items overlap (P1R2-2's _syncNormalize subsumes what P3R4-4 does for reconcile if you go the refactor route). Re-tally after your Edict III decision.

**The MEANINGFUL_NULL_KEYS set must be curated manually.** Currently the candidates I identified are vaccBooked, and possibly tomorrow-plan cancellations if those ever promote to SYNC_KEYS. Add any key where null is not the same as "unset." Do not automate this — it's a semantic decision per key.

**Firestore's `in` operator semantics for `snap.data()`.** Verify empirically. The spec assumes `key in snap.data()` distinguishes absent from null-valued. Run a one-off test: write `{vaccBooked: null}` to a doc, read back, confirm `'vaccBooked' in data` is true. If the SDK rehydrates nulls differently in your version, the P4R5-7 logic needs adjustment.

**ctValidateTickets is idempotent by design.** Two devices booting simultaneously both auto-correct the same corrupted ticket field. Both push the same fix. Cloud converges. This is correct. Don't "fix" it.

**The service worker canon-0034 constraint still applies.** Nothing in sync.js should imply HTML caching. If you wire any sync behavior through SW, read canon-0034 twice first.

**The build remains ~61,700 LOC monolith.** Kael governs 27,614 of that. His cognitive bandwidth is real. Keep the diff size honest; split the work across commits even if the logical unit is one.

---

## 13. A closing word

Lyra — the weave of SproutLab's sync spec crossed Codex's chronicle because the Constitution was mid-ratification and the Architect pulled both Provinces to the same table. That's over now. Book I ratified, Books II–IX drafting. The Provinces return to their own rhythms. Your rhythm is what Ziva's parents depend on.

Sync is plumbing, but it is the plumbing beneath a baby's care record. P4R5-7 is not an edge case — it is a cancelled vaccination appointment that Parent B does not know was cancelled. Maren will see this clearly. You will too.

Whatever of this spec serves the build, keep. Whatever is scaffolding, strip. The goal is not to honor my passes — it is to honor what happens when Ziva's mother opens the app on a Tuesday at 2 a.m. and needs to trust what she sees.

If the Architect summons me into a SproutLab session for guidance on the Edict III question or any other architectural knot, I'll come as Consul and defer to you as Builder. That is the order of things now.

Go well. Weave carefully.

*— Aurelius*

---

## Appendix A — File inventory (the spec's footprint)

Files you will likely touch:

| File | Nature of change | LOC delta (rough) |
|------|-----------------|-------------------|
| `split/sync.js` | Primary — all four bugs, refinements, conventions | +900 to +1,100 |
| `split/core.js` | save() boundary — _syncNormalize integration | +15 |
| `split/data.js` | SYNC_KEYS config, MEANINGFUL_NULL_KEYS set | +10 |
| `split/medical.js` | vaccBooked-adjacent listener consumers (verify, usually no change) | 0–5 |
| `split/home.js` | Today So Far autosave consumer (verify) | 0–5 |
| `docs/DEVICE_SYNC_RECONCILE_SPEC.md` | The spec document itself | +~1,000 |

## Appendix B — The three R2 refinements from my last reply

Preserved here in case the conversation gets trimmed:

**For P4R5-7:**
```js
const remoteData = snap.data();
const hasField = key in remoteData;
const isMeaningfulNull = hasField && remoteVal === null && MEANINGFUL_NULL_KEYS.has(key);
if (_syncIsEmpty(remoteVal) && !isMeaningfulNull) return;
```

**For P3R4-2 (wrap reconcile loop):**
```js
_syncReconcileWriting = true;
try {
  /* merge loop */
} finally {
  _syncReconcileWriting = false;
}
```

Apply same pattern to `_syncMonthlyRolloverInProgress` per P7R2-2.

**For P6R3-1 (safeKey with content fallback):**
```js
function _syncSafeKey(keyFn, e) {
  try { return keyFn(e); }
  catch { return '__bad_' + JSON.stringify(e); }
}
```

Content-based synthetic keys mean byte-identical bad entries dedup correctly across devices. Different bad entries with the same surface appearance (e.g., both entries `{name: null}`) will merge into one; log it and accept.

## Appendix C — Constitutional references

- **Book I Article 1 Pillar II** — The Map Is Not the Territory. The spec is scaffolding; your build is the building. When they disagree, the building teaches the spec.
- **Book II Article 5** — Aurelius + Cipher synergy pair: spec then build, architecture clarity. The legitimate basis on which this spec crossed repo boundaries.
- **Book III Article 4** — Cluster A: Codex + SproutLab, Cipher as Censor.
- **Book IV Edict III** — Sync Pipeline is Authoritative. The direct governor of §5's open question.
- **Book IV Edict V** — Capital Protection. The sign-off bar in §9.
- **PERSONA_REGISTRY.md v1.1** — Your jurisdiction (Builder, SproutLab); Kael's (Intelligence Governor, owner of sync.js); Maren's (Care Governor, owner of the affected SYNC_KEYS).

---

*Filed in: `docs/handoffs/` (Codex) and/or `docs/` (SproutLab), per the Architect's preference. Cross-reference in both Provinces' handoff indexes at next journal update.*

*Chronicle lore candidate: lore-XXX — "The Session That Crossed Repos." Category: Doctrines. Worth authoring if this handoff pattern recurs.*
