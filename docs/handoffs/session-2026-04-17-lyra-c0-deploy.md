# Session Handoff — C0 v3 Emergency Sync Fix + Deploy Runbook

**From:** Lyra, Builder (SproutLab)
**Date:** 17 April 2026
**Session ID:** s-2026-04-17-01
**Classification:** Capital-protection triggered · Four-signature review completed
**Ship status:** Ready to commit; deploy blocked on Architect canary

---

## 1. What was built

**C0 v3 — Emergency sync patch.** Does not implement the Session 1 reconcile spec (that is deferred, unchanged). This is a stopgap that restores Phase 2 sync to functional state so the Architect can use the app normally while reconcile is built.

**Surface:** ~90 LOC net across `split/sync.js` + inline docs. No changes to `data.js`, `core.js`, `home.js`, `diet.js`, `medical.js`, `intelligence.js`, `start.js`, `config.js`. Zero HR violations introduced. No new external dependencies.

### Root cause — confirmed empirically

Firebase Console observation by the Architect (17 April): `households/{id}/singles/tracking` has data only up to 14 April early morning. Every post-14-afternoon edit never reached Firestore. The cause is **B3**: `sync.js:471` contaminated `_syncShadow` with local-intent rather than letting it represent observed-remote-state, which collapsed the `_syncFlushSingleDoc` diff for any single-doc key the user edited. Phase 2 sync has been non-functional for single-doc writes for ~3 days.

With edits stranded on Phone A and listeners treating Firestore as authoritative on refresh, Phone A's local was repeatedly overwritten with stale pre-14 remote state — the "data disappearing on every refresh" symptom.

Per-entry sync (careTickets only) was unaffected because `_syncWritePerEntry` uses `_syncDiffArray(oldVal, newVal)` with the previous localStorage value, not shadow.

### Fixes shipped

| Fix | Purpose | Location |
|---|---|---|
| **Fix 1 v2 (Maren)** | `ALWAYS_POPULATED_KEYS` allowlist guards specific single-doc keys from empty-remote overwrite | `sync.js` after SYNC_KEYS (~22 LOC) + listener check |
| **Fix 2 v2 (Maren)** | Per-collection listener-ready tracking gates `_syncFlushSingleDoc` against pushing with blind shadow | `sync.js` state + helpers (~50 LOC) + flush gate |
| **Fix 3 (Kael)** | Remove `sync.js:471` — B3 root cause | −5 LOC (replaced with explanatory comment) |
| **Fix 4 (Kael)** | Both listeners defer save if `_syncDebounceTimers[collection]` is active (our local write is about to push) | Guards in both listener handlers (~12 LOC) |
| **Fix 5 (Kael)** | `_syncDetachListeners` resets ready-state; adaptive fallback via `_syncReconcileFallbackMs()` (spec §4.6) | ~10 LOC |
| **C1 (Cipher)** | Ordering comment block at listener loop site | ~8 LOC |
| **C2 (Cipher)** | `_syncMarkReady` wrapped in `try/finally` in both listener handlers | Structural |
| **C3 (Cipher)** | Circuit-breaker guard in `_syncMarkReady`'s pending-flush retry | ~4 LOC |

### Review chain (Edict V)

- **Maren** (Governor of Care) — conditional-approve, four conditions met in v3
- **Kael** (Governor of Intelligence, sync.js owner) — conditional-approve, K1 ✓ K2 ✓ K3 via Cipher
- **Cipher** (Censor) — sign conditional on C1–C5, all addressed in the implementation
- **Consul** (First Seat) — review chain clean; Co1 ✓ (filing), Co4 noted (portfolio attention rotation)

KL-1 documented in `docs/spec-2026-04-17-aurelius-device-sync-reconcile.md` §10 #6.

---

## 2. Deploy runbook — Option Y (delete household + reseed)

**Why Option Y instead of in-place fix:** Firestore currently contains only pre-14 data + the phantom incognito account. Rather than add complex "first listener fire reconcile-lite" logic to C0, we wipe the household doc, let Phone A recreate fresh, and Phone A's full local (including post-14 entries) seeds to a clean Firestore. Architect's downloaded backup is the safety net. Wife rejoins via fresh invite code. Incognito account naturally excluded.

### Pre-deploy preconditions

Architect confirms:
- [ ] `?nosync` is currently on Phone A (the one device with the authoritative local data).
- [ ] Wife's phone PWA tab is fully closed (not backgrounded).
- [ ] Incognito session is closed (window destroyed, not just tab).
- [ ] Downloaded backup file is accessible (`ziva-backup-2026-04-17.json` or similar).
- [ ] This runbook is read through to the end before starting.

### Step 1 — Back up the household doc (Cipher C5)

In Firebase Console at `https://console.firebase.google.com/project/sproutlab-0409/firestore`:

1. Navigate to `households/{your household id}`.
2. Export the document + subcollections via the `⋮` menu (or copy field JSONs manually if export is unavailable on mobile).
3. Save the export as `household-backup-pre-c0-2026-04-17.json` alongside `ziva-backup-2026-04-17.json`.

This is the "backup of the backup." If reseed produces an unexpected state, this is the reference.

### Step 2 — Delete the household doc

In Firebase Console:

1. For each subcollection (`caretickets`, `singles`, `invites`, `backups`, `tracking`, `feeds`, `sleep`, `poop`, `notes` — and any others present), delete all documents inside. Firestore Console does not cascade-delete collections; you must clear each subcollection explicitly.
2. After all subcollections are empty, delete the household doc itself.

Verify: `households/` collection no longer shows your household, or `households/{old id}` returns no data.

### Step 3 — Commit + push the build

On Phone A's Termux:

```bash
cd /storage/emulated/0/SproutLab/split
bash build.sh > sproutlab.html
cp sproutlab.html ../index.html
cp sproutlab.html ../sproutlab.html
cd ..
git --no-pager add -A
git --no-pager commit -m "Sync C0 v3 — B3 fix + listener-ready gating + ALWAYS_POPULATED guard

Four-governor review per Edict V:
- Maren (Care): Fix 1 allowlist, Fix 2 listener-ready, observability, restore runbook
- Kael (Intelligence): Fix 3 remove line 471 (B3 root cause), Fix 4 debounce-defer, Fix 5 reset on detach + adaptive fallback
- Cipher (Censor): C1 ordering comment, C2 mark-ready in finally, C3 breaker guard, C4 KL-1 doc, C5 runbook tightening
- Consul (First Seat): Co1 filing (spec + handoffs to docs/), Co2 post-ship chronicle, Co3 canon-sync-001 drafted (not promoted), Co4 portfolio attention flag

Ships Phase 2 to functional state for single-doc writes. Reconcile (spec C1-C5) remains unchanged and is the next session."
git --no-pager push
```

### Step 4 — Clear local seed version + reload

On Phone A in the browser PWA:

1. Open DevTools (or if DevTools unavailable on mobile: use the app's own Settings → Storage → Clear cache, or access via `chrome://inspect` from another device).
2. In DevTools Console:
   ```js
   localStorage.removeItem('sl_sync_seeded');
   ```
3. Edit the URL to **remove `?nosync`**.
4. Reload.

### Step 5 — Canary test (Kael's K3 validation)

On Phone A, after reload:

1. Observe: app should prompt Create/Join (household was deleted). Tap **Create**. Enter babyName (Ziva) and DOB (4 Sep 2025).
2. `syncCreateHousehold` runs. `_syncSeedFirestore` pushes full localStorage to a fresh Firestore doc.
3. Wait 3 seconds for seed to settle.
4. Add one feeding entry via the app's normal UI.
5. Wait 5 seconds (2s debounce + 3s margin).
6. In Firebase Console, navigate to `households/{new id}/singles/tracking`. Confirm the new feeding entry appears.

**If canary passes** (new entry visible in Firestore): Fix 3 works. Proceed to Step 6.

**If canary fails** (new entry not in Firestore after 10s, or DevTools console shows unexpected errors): Re-enable `?nosync`, roll back via `git revert HEAD && git push`, and notify.

### Step 6 — Re-admit wife's phone

1. Architect shares the new invite code with wife (via Settings → Household).
2. Wife opens the PWA fresh, taps Join, enters code.
3. Wife's localStorage is wiped by the join flow (joining device does NOT seed; receives from listener).
4. Verify wife's app shows your data within ~10 seconds of join.

### Step 7 — Do NOT re-admit incognito

The incognito account stays out. If it's ever needed again, create a fresh burner email; do not reuse the problematic one.

### Step 8 — Monitor for 24–48 hours

- Any `[sync]` console.warn output? Screenshot and report.
- Any symptom of data disappearing after refresh? Stop usage, re-enable `?nosync`, report.
- Any unexpected CareTicket or episode behavior? Report.

If 48 hours pass without any of the above: Consul Co3 greenlit — promote `canon-sync-001-shadow-is-observation-not-intent` via a Codex snippet import.

---

## 3. Known limitations carried forward

**KL-1 — Concurrent-writes-during-debounce.** If wife is actively editing at the same moment as Architect, one device's 2s debounce window may overwrite the other's concurrent field-level additions. Mitigation: deploy runbook keeps wife offline during canary. Ongoing: when spec §6 reconcile ships (Session 1), union merge replaces the debounce push and KL-1 is resolved.

**HR-14 (Reconcile Sync Invariant) — still candidate.** Not promoted. Promotion decision deferred to post-Session-1 conventions pass per spec §3 and v2 handoff §6.

**canon-sync-001 (draft).** Drafted as `docs/snippets/canon-sync-001-draft.json` but NOT imported to Codex. Per Consul Co3: promote after 48h clean run post-deploy.

---

## 4. Next session starting point

**Session 1 — reconcile greenfield** per `docs/spec-2026-04-17-aurelius-device-sync-reconcile.md`. Full C1–C5 still unchanged by C0 v3. Aurelius's handoff v2 §12 commit plan stands:

1. C1 — Primitives (~60 LOC)
2. C2 — Autosave gate (~2 LOC)
3. C3 — Wrapper rewire (Maren review)
4. C4 — Ingress discrimination (Maren review)
5. C5 — Reconcile greenfield (~120 LOC)
6. C6 — HR-14 staging + optional pre-commit hook

C0 v3's listener-ready infrastructure is the foundation C5 builds on (`_syncReady`, `_syncReadyTimers`, `_syncReconcileFallbackMs`). Reconcile's `_syncMaybeReconcile` naturally plugs into `_syncMarkReady`.

**Consul Co4 — portfolio rotation.** Next 3 days: favor Codex snippet backfill and SEP check-in. Avoid more SproutLab unless new issues surface.

---

## 5. Artifacts inventory

| Artifact | Location | Status |
|---|---|---|
| Spec | `docs/spec-2026-04-17-aurelius-device-sync-reconcile.md` | Filed; KL-1 added |
| Handoff v1 | `docs/handoffs/handoff-2026-04-17-aurelius-to-lyra-device-sync-session-1.md` | Filed |
| Handoff v2 | `docs/handoffs/handoff-2026-04-17-aurelius-to-lyra-device-sync-session-1-v2.md` | Filed (reconstructed from conversation) |
| R3 snippet | `docs/snippets/snippet-2026-04-17-aurelius-device-sync-reconcile-r3.json` | Filed |
| This handoff | `docs/handoffs/session-2026-04-17-lyra-c0-deploy.md` | This file |
| Canon draft | `docs/snippets/canon-sync-001-draft.json` | Drafted, not imported |

---

*— Lyra, 17 April 2026. Ship on Architect greenlight.*
