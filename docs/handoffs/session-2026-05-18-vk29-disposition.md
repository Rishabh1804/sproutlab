---
session_id: s-2026-05-18-03
session_title: V-K-29 Disposition — "Audited, Skipped, With Rationale"
author: Aurelius (The Chronicler)
date: 2026-05-18
repo: SproutLab (primary)
edict_v_exercise: no — this artifact disposes a Cipher Edict V finding from a prior session; no new audit chain executed
prior_chronicles:
  - session-2026-05-18-pr-a-pr-b-closure.md (s-2026-05-18-02) — coda of the s-2026-05-17/-18 quadrilogy; PR-A + PR-B merged; sync-discipline cycle named as the only open thread
parent_pr: Rishabh1804/sproutlab#78 (PR-C, merged at `530ccf2`) — the sync-discipline cycle that closed the §6 entry 4 carry-forward and surfaced V-K-29 in its Edict V pass
finding_id: V-K-29
finding_jurisdiction: Kael (Intelligence — confirmAction surface at split/core.js)
disposition: SKIP — audited, no live bug, defensive widening would introduce a worse failure mode than the one it was framed to prevent
follow_up: V-M-41 (resolve-caller shield hardening) routes as the next PR-D candidate; HR-4 at core.js:3437 sits below it
---

# Chronicle — V-K-29 Disposition

**Session ID:** s-2026-05-18-03 (third session of 2026-05-18; first two were the bilateral Rung-2 discharge and the PR-A + PR-B closure coda — see frontmatter for cross-links)
**Volume:** SproutLab (primary). No code change; doc-only artifact.
**Builder:** Lyra (The Weaver) — surfacer of the disposition decision; chronicler-of-record routes to Aurelius
**Architect:** Sovereign on the disposition call ("i feel 1. should be what we should go with") — path 1 of the three options surfaced post-PR-C-merge

---

## 1. Context — where V-K-29 came from

V-K-29 was surfaced by Cipher's Edict V cross-cutting pass on PR-C (the sync-discipline cycle). Cipher's framing:

> `split/core.js:3990` — V-K-29 forward note. "This will replace all current data" is destructive, evades `\b(delete|remove|clear)\b`, currently shielded by explicit `btnText='Import'`. Same shape at `core.js:3911` (autosave restore, **no explicit btnText — falls to default 'Confirm' for a destructive action**). PR-D candidate.

The framing routed V-K-29 forward as one of three PR-D candidates filed in the PR-C body — "regex extension to `replace|overwrite|restore`" as the surgical continuation of the V-K-8 → V-K-24 doctrine line.

## 2. Re-survey — facts on disk contradict the framing

When the Architect routed PR-D for build, Lyra re-surveyed the three replace/restore callers Cipher cited. The facts:

| Caller | Line of `confirmAction` opener | Line of `btnText` arg | Argument |
|---|---|---|---|
| `core.js:3905` autosave-restore (slot) | `:3911` | `:3921` | `'Restore'` |
| `core.js:3946` data-missing recovery | `:3946` | `:3948` | `'Restore'` |
| `core.js:3990` import-backup | `:3990` | `:3997` | `'Import'` |

All three callers **already carry explicit `btnText` shields**. Cipher's Edict V note that `core.js:3911` "has no explicit btnText" is a mis-read of the call site — the `'Restore'` argument sits on the closing line of a multi-line `confirmAction` call, ten lines down from the opener, and the truncated grep snippet in the audit transcript did not surface it.

This is not a Cipher failure of substance — the surrounding analysis (regex blast-radius, shield-verification on the resolve-callers, doctrine-comment contract test) was correct on the facts. It is a single-cell mis-read on a multi-line call that the audit chain caught on re-survey, exactly as canon-cc-008 ("Builder builds → Governors audit → Cipher Edict V") is designed to.

## 3. Consequence — V-K-29 is a no-op

`confirmAction` at `core.js:3431` evaluates `label = btnText || (regex.test(msg) ? 'Delete' : 'Confirm')`. The `||` short-circuits before regex evaluation when `btnText` is truthy. All three replace/restore callers pass truthy `btnText` arguments; the regex never evaluates on any of them.

Extending the regex to `/\b(delete|remove|clear|replace|overwrite|restore)\b/i` would not change any live button rendering. V-K-29 as framed is a no-op.

## 4. Defensive-widening interpretation — declined

A reframing was considered: extend the regex defensively to catch *future* maintainers who add a new "Overwrite settings?" or "Restore defaults?" message without `btnText`. The defensive value is real — a future un-shielded destructive message would currently fall to sky `Confirm`, which is the failure mode the V-K-8 → V-K-24 doctrine line was built to prevent.

But the defensive widening introduces a worse failure mode than the one it prevents.

`confirmAction`'s `btnCls` derivation at `core.js:3432` ties button *color* to button *label*: `label === 'Delete' ? 'btn btn-rose' : label === 'Reset' ? 'btn btn-rose' : 'btn btn-sky'`. An unshielded `restore` caller — for example, a future maintainer writing `confirmAction('Restore from backup?', ...)` without `btnText` — would currently render sky `Confirm` (wrong: destructive). Under V-K-29-lite (pure regex widening), it would render rose `Delete` (also wrong: it's a *recovery* flow; the parent's mental model is restoration, not deletion; rose `Delete` is a genuine tonal injury — parent at midnight, data missing, button reads "Delete").

The right disposition for the un-shielded `restore`-class caller is rose color + custom label (rose `Restore`), which the current `btnCls` derivation cannot express. Making V-K-29 tonally correct would require decoupling color from label — a structural change to `confirmAction`'s signature (e.g., a `destructive: true` parameter, or a separate intent-detection lane), not a one-line regex extension.

That structural change was considered and declined for the same reason: the existing explicit-`btnText` pattern is documented enough (in the V-K-23 + V-K-24 doctrine comments at `core.js:3421-3430` and `sync.js:672-680`) that a future maintainer adding a new replace/restore message would likely follow it, and the audit chain itself would catch a missed shield within one PR cycle. The discipline is encoded; the structural change would add complexity to prevent a failure mode the documentation already prevents.

## 5. Disposition — SKIP, chronicled

V-K-29 is disposed as SKIP. The audit-chain ledger entry: *audited, no live bug, defensive widening declined as tonally injurious to recovery flows*. The finding is not carried forward to a future PR.

The chronicle entry is the artifact. Future sessions surveying the `confirmAction` surface (regex extension proposals, recovery-flow-tone audits, or maintainer-drift footgun reviews) will find this disposition under `docs/handoffs/session-2026-05-18-vk29-disposition.md` and need not re-discover it.

## 6. Next routing

Two PR-D candidates remain from PR-C's filed list:

1. **V-M-41 — resolve-caller shield hardening.** The four symptom-resolve callers at `intelligence.js:7419 / 8124 / 8522 / 8754` carry explicit `btnText='Resolve'` shields; a future maintainer who drops the btnText would silently re-route to rose Delete on `\bclear\b`/`\bresolved\b` matches (V-M-41 from the Maren audit). The hardening is a JSDoc note + a unit-test guard locking the explicit btnText on the four callers. **Recommended PR-D.**

2. **HR-4 at `core.js:3437`.** Standing pre-existing surface: `<p>${msg}</p>` interpolation without `escHtml`. Closest user-derived consumer is `doctors[i].name` at `medical.js:2987`, mitigated by `<p>` context + form-input source path. Worth fixing; routes after V-M-41.

CLAUDE.md headroom-quote refresh (V-K-33: Intelligence Region is 29,770 LOC, headroom 230; CLAUDE.md quotes 284) continues to defer to the next Kael-jurisdiction spec per Cipher's "merge train shouldn't pick up doc edits mid-cycle." This chronicle adds no Intelligence-region LOC; the headroom number does not move from PR-C's post-merge state.

---

## Closing note

V-K-29 is the first finding in the s-2026-05-17/-18 quadrilogy + post-coda arc to be disposed as SKIP-WITH-RATIONALE rather than folded, deferred, or carried forward. The disposition is itself a small validation of the audit chain: Cipher Edict V surfaced a candidate, the post-merge re-survey caught a mis-read, and the Architect's path-1 directive resolved it cleanly without an additional PR cycle. The chronicle is the attributable trace.

— Aurelius (The Chronicler), invoked at disposition-close by Lyra's hand
2026-05-18 — single-finding-disposition mode, fifth artifact in the s-2026-05-17/-18 arc
