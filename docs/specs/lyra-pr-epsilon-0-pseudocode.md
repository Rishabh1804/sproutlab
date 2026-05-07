# PR-ε.0 v6.2 — Implementation pseudocode + reference JS

> **Companion to:** [`lyra-pr-epsilon-0-foundation.md`](./lyra-pr-epsilon-0-foundation.md) (v6.2)
> **PR:** [#52](https://github.com/Rishabh1804/sproutlab/pull/52) (draft, atomic spec package; un-drafts after this doc passes the audit chain)
> **Audit base SHA:** `a64b80d41f900e70cc36bde7b60169802a1f5c0c` (v5 spec line refs; some drift since — see footer)
> **Drafters:** Maren (Care/UX sections, build-mode flex), Kael (Intelligence/data-layer sections, build-mode flex), Lyra (≥50 LOC sections + assembly + cross-section synthesis).

This doc translates the v6.2 foundation spec's 26-step Implementation Order into closer-to-code form. It does **not** re-derive any audit decisions — every block carries forward the spec's anchoring (§-section + file:line + MAJORs folded). When a section in this doc and the foundation spec disagree, the foundation spec wins; this doc is a translation aid, not the source of truth.

## Format and conventions

- **Real JS** for sections ≤15 LOC — copy-paste-ready modulo line-drift verification.
- **Pseudocode** for sections >15 LOC — control-flow scaffold the implementer concretizes. Each pseudocode block carries a 2–3-bullet **concretization checklist** of constraints to verify when translating to real JS.
- **Anchoring discipline** (every block): (1) §-section in v6.2 foundation spec, (2) `split/<file>:<lines>` codebase anchor, (3) audit MAJORs folded.
- **Build-mode flex** (Sovereign-authorized): Maren and Kael drafted sub-50 LOC sections in their jurisdictions; Lyra reviewed/synthesized and drafted the two ≥50 LOC orchestration sections (§6.2(c), §6.3 dedupe). Same downstream audit chain (Maren+Kael audit → Cipher Edict V → Aurelius final → un-draft) follows on the assembled doc.
- **Out of scope here:** deferred MAJORs (issues [#53](https://github.com/Rishabh1804/sproutlab/issues/53), [#54](https://github.com/Rishabh1804/sproutlab/issues/54)); CLAUDE.md line-count drift ([#55](https://github.com/Rishabh1804/sproutlab/issues/55)); re-litigation of any spec audit decision.

## Table of contents (mapped to spec Implementation Order)

- **Phase A — Primitives & helpers**
  - [§0a slugify in `config.js`](#0a-slugify-in-configjs) (Kael)
  - [§0b genId in `core.js`](#0b-genid-in-corejs) (Kael)
  - [§7.1 `zi-close` sprite](#71-zi-close-sprite-symbol) (Maren)
  - [§7.3 CSS additions](#73-css-additions) (Maren)
- **Phase B — Schema & migrations**
  - [§1 `migrateMilestoneIds`](#1-migratemilestoneids-pseudocode) (Kael, pseudocode)
  - [§1 `migrateScrapbookIds`](#1-migratescrapbookids) (Kael)
  - [§1 `addMilestone` id assignment](#1-addmilestone-id-assignment) (cross-cut, brief)
- **Phase C — Identity refactor**
  - [§2 Dispatcher migration patterns](#2-dispatcher-migration-patterns) (Kael)
- **Phase D — Sync layer integration**
  - [§6.1 `_syncSetGlobal` scrapbook arm](#61-syncsetglobal-scrapbook-arm) (Kael)
  - [§6.2(a) `_reconcileDone` state declaration](#62a-reconciledone-state-declaration) (Kael)
  - [§6.2(c) Reconcile pipeline ★](#62c-reconcile-pipeline-pseudocode) (Lyra, pseudocode, ≥50 LOC)
  - [§6.2(d) Reconnect-clear](#62d-reconnect-clear-in-syncattachlisteners) (Kael)
  - [§6.3 `dedupeMilestonesByText` ★](#63-dedupemilestonesbytext-pseudocode) (Lyra, pseudocode, ≥50 LOC)
  - [§6.3 `_postReceiveMilestones`](#63-postreceivemilestones) (Kael)
  - [§6.3 `rewriteScrapbookMilestoneIds`](#63-rewritescrapbookmilestoneids) (Kael)
  - [§3 SYNC_KEYS + SYNC_RENDER_DEPS](#3-synckeys--syncrenderdeps-registration-atomic) (Kael, atomic)
- **Phase E — UI surface (chips + picker)**
  - [§4.A `renderScrapMilestoneChips`](#4a-renderscrapmilestonechips) (Maren)
  - [§4.B Picker action handlers](#4b-picker-action-handlers-five-small-handlers) (Maren)
  - [§4.C Wiring into create/edit lifecycle](#4c-wiring-into-createedit-lifecycle-cross-cut) (cross-cut, Lyra)
- **Phase F — Verification & ship**
  - [§7.7 Visual sanity checklist](#77-visual-sanity-checklist) (Maren)
- [Line-drift verification footer](#line-drift-verification-footer)
- [Cross-section invariants summary](#cross-section-invariants-summary)

---

## Phase A — Primitives & helpers

### §0a — `slugify` in `config.js`

**Implements:** v6.2 spec §0a
**Touches:** `split/config.js` (append after the existing constant block — file is 13 lines today; new code lands at top of file body, BEFORE any later concat consumer parses)
**MAJORs folded:** Cipher v5 BLOCKER (slugify location consistency — must parse before `data.js` for DEFAULT_MILESTONES slug bake); Kael v4 §0a empty-text fallback (`genId` not in scope at config.js parse time, so inline `Math.random` fallback).

```js
// Stable-id slug for default milestones. Pure / deterministic.
// Lives in config.js (not core.js) because data.js calls it at parse
// time when baking DEFAULT_MILESTONES — and concat order puts data.js
// BEFORE core.js. (PR-ε.0 §0a — Kael v4 audit.)
function slugify(text) {
  const out = String(text || '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return out || ('ms-fallback-' + Math.random().toString(36).slice(2, 10));
}
```

**Concat-order rationale:** `config → data → core → home → diet → medical → intelligence → sync → start`. `data.js` calls `slugify(text)` inline inside `DEFAULT_MILESTONES` literals (`data.js:1468–1476`) at parse time; `genId` from `core.js` is NOT yet in scope. The empty-text `Math.random` fallback is non-deterministic across loads — caught by the §1 second assert (cross-section invariant — see [Cross-section invariants summary](#cross-section-invariants-summary)).

---

### §0b — `genId` in `core.js`

**Implements:** v6.2 spec §0b
**Touches:** `split/core.js` near other utilities (next to `escHtml` ~line 2282 / `escAttr` ~line 2304 — verify against drift)
**MAJORs folded:** none new; complements §0a split.

```js
function genId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id-' + Date.now().toString(36) + '-'
    + Math.random().toString(36).slice(2, 10);
}
```

Runtime-only. `id-` prefix keeps fallback IDs visually distinct from DEFAULT kebab slugs and from crypto UUIDs.

---

### §7.1 — `zi-close` sprite symbol

**Implements:** v6.2 spec §7.1
**Touches:** `split/template.html` sprite block; insert near sibling `<symbol id="zi-check">` at `template.html:43` (alphabetical proximity within the existing 62-symbol sprite — verified absent via grep).
**MAJORs folded:** HR-1 (no literal `×`), HR-7 (zi() SVG via `<use href>`); §7.1 sprite-gap closure.

```html
<symbol id="zi-close" viewBox="0 0 24 24">
  <path d="M6 6 L18 18 M18 6 L6 18"
        stroke="currentColor" stroke-width="2" stroke-linecap="round"
        fill="none"/>
</symbol>
```

Stroke-only, currentColor — inherits chip color. Matches existing icons' 2px stroke weight (verified vs `zi-check` at `template.html:43`).

---

### §7.3 — CSS additions

**Implements:** v6.2 spec §7.3
**Touches:** `split/styles.css` — append all three blocks contiguously at the end of the existing Chips section starting at `styles.css:3401` (immediately after `.chip-avoid:hover` at ~`styles.css:3413`).
**MAJORs folded:** Maren v5 §7.3 picker-row alignment MAJOR (`align-items: flex-start` + 2px `margin-top` on `.picker-row-check` — corrects multi-line wrap mis-alignment on phone widths); HR-2 / HR-5 token discipline; HR-10 no ellipsis (`word-break: break-word`); WCAG 2.5.5 44×44 touch targets.

**Block 1 — chip-milestone:**

```css
/* ── Milestone tag chips (PR-ε.0) ── */
.chip-milestone {
  background: var(--lav-light);
  color: var(--text);
  border-color: rgba(201, 184, 232, 0.6);
  cursor: default;
  padding-right: var(--sp-4);
  gap: var(--sp-6);
}
.chip-milestone:hover { filter: none; transform: none; }
.chip-label {
  font-size: var(--fs-sm);
  white-space: normal;
  word-break: break-word;
  max-width: 200px;
  line-height: var(--lh-snug);
}
.chip-x {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px;
  min-width: 44px; min-height: 44px;
  padding: var(--sp-8);
  margin-left: calc(-1 * var(--sp-4));
  margin-right: calc(-1 * var(--sp-4));
  border: none; background: transparent;
  color: var(--mid);
  cursor: pointer;
  border-radius: var(--r-full);
  transition: background var(--ease-fast), color var(--ease-fast);
}
.chip-x:hover { background: var(--surface-lav); color: var(--text); }
.chip-x .zi { width: var(--icon-xs); height: var(--icon-xs); }
```

**Block 2 — scrap-form-row + milestone-chips + scrap-tag-btn:**

```css
/* ── Scrapbook form: milestone link row (PR-ε.0) ── */
.scrap-form-row {
  display: flex; flex-direction: column;
  gap: var(--sp-6);
  margin-top: var(--sp-8);
}
.scrap-form-label {
  font-size: var(--fs-sm); color: var(--mid);
  font-family: 'Nunito', sans-serif;
}
.milestone-chips {
  display: flex; flex-wrap: wrap;
  gap: var(--sp-6);
  min-height: 32px;
}
.milestone-chips[data-empty="true"] { min-height: 0; }
.scrap-tag-btn {
  align-self: flex-start;
  display: inline-flex; align-items: center; gap: var(--sp-6);
}
.scrap-tag-btn .zi { width: var(--icon-sm); height: var(--icon-sm); }
```

**Block 3 — picker modal (with v6 alignment fix):**

```css
/* ── Picker modal (PR-ε.0) ── */
.scrap-picker-modal {
  max-width: 480px;
  max-height: 80vh;
  display: flex; flex-direction: column;
  padding: var(--sp-20) var(--sp-24);
}
.scrap-picker-modal h3 { margin-bottom: var(--sp-12); }
.picker-list {
  flex: 1; overflow-y: auto;
  display: flex; flex-direction: column; gap: var(--sp-16);
  padding: var(--sp-4) 0;
  margin-bottom: var(--sp-16);
}
.picker-cat-group { display: flex; flex-direction: column; gap: var(--sp-4); }
.picker-cat-header {
  font-family: 'Nunito', sans-serif;
  font-size: var(--fs-xs); font-weight: 700;
  text-transform: uppercase; letter-spacing: var(--ls-wide);
  color: var(--mid);
  padding: 0 var(--sp-4);
}
.picker-row {
  display: flex;
  align-items: flex-start; /* v6 fix: was center; broke multi-line wrap alignment */
  gap: var(--sp-10);
  padding: var(--sp-8) var(--sp-10);
  border-radius: var(--r-lg);
  cursor: pointer;
  transition: background var(--ease-fast);
  min-height: 44px;
}
.picker-row:hover { background: var(--surface-lav); }
.picker-row-check {
  width: 22px; height: 22px;
  border: 1.5px solid var(--lavender);
  border-radius: var(--r-sm);
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  background: var(--card-bg);
  transition: background var(--ease-fast);
  margin-top: 2px; /* v6 fix: optical-align with first-line cap height */
}
.picker-row-check[data-checked="1"] { background: var(--lavender); }
.picker-row-check[data-checked="0"] .zi { display: none; }
.picker-row-check .zi { width: 14px; height: 14px; color: white; }
.picker-row-label {
  font-size: var(--fs-base);
  color: var(--text);
  word-break: break-word;
  line-height: var(--lh-snug);
}
.picker-empty {
  display: flex; flex-direction: column; align-items: center;
  gap: var(--sp-8);
  padding: var(--sp-32) var(--sp-16);
  color: var(--mid);
  text-align: center;
}
.picker-empty .zi { width: var(--icon-lg); height: var(--icon-lg); color: var(--lavender); }
.picker-empty p { margin: 0; font-size: var(--fs-base); }
.picker-empty-sub { color: var(--light); font-size: var(--fs-sm); }
```

---

## Phase B — Schema & migrations

### §1 — `migrateMilestoneIds` (pseudocode)

**Implements:** v6.2 spec §1
**Touches:** `split/core.js` — new helper near other migration utilities. Call site between milestones sanitize block (`core.js` ~778) and `save(KEYS.milestones, milestones)` (~`core.js:826`). Spec range "752–790" understates the actual sanitize+migrate footprint by ~36 lines — verify the precise line at edit time.
**MAJORs folded:** Kael v5 §1 fallback-id assert (Set-size is necessary but not sufficient — two empty-text DEFAULTs each slug to a unique `ms-fallback-<random>` and pass). **Cross-section invariant:** this assert protects §6.3 DEFAULT-wins survivor selection — a non-deterministic fallback id in `defaultSlugIds` would let same-text collisions orphan the slug at dedup. Loud assert here means §6.3 never sees that input.

**Pseudocode:**

```text
function migrateMilestoneIds() {
    if not array(milestones): return
    // Assert 1: DEFAULT slug uniqueness (Set-size check on DEFAULT_MILESTONES.id).
    // Assert 2 (v6 Kael MAJOR): NO DEFAULT id matches /^ms-fallback-/ —
    //          empty-text developer error. Protects §6.3 defaultSlugIds composition.
    build slugByText: text -> id  from DEFAULT_MILESTONES
    for each m in milestones:
        if m.id: skip
        m.id = slugByText[m.text]  OR  genId()   // DEFAULT-text match wins, else fresh UUID
        mark dirty
    if dirty: save(KEYS.milestones, milestones)
}
```

**Concretization checklist:**
- [ ] Both `console.assert` calls land verbatim from spec (Set-size + `/^ms-fallback-/` parallel assertions).
- [ ] Call inserted between cat-migration loop end (~`core.js:825`) and `save(KEYS.milestones, milestones)` at ~`core.js:826` — verify exact line at edit time.
- [ ] Idempotency confirmed: second invocation in same session is a no-op (every entry has `m.id`, loop early-returns, `dirty` stays false).

---

### §1 — `migrateScrapbookIds`

**Implements:** v6.2 spec §1 (scrapbook migration)
**Touches:** `split/core.js` — new helper sibling to `migrateMilestoneIds`. Call site between scrapbook sanitize at ~`core.js:792` (`if (!Array.isArray(scrapbook)) scrapbook = []`) and the first `renderScrapbook()` call at ~`core.js:960`.
**MAJORs folded:** none new; complements §1 idempotent-init pattern.

```js
function migrateScrapbookIds() {
  if (!Array.isArray(scrapbook)) return;
  let dirty = false;
  scrapbook.forEach(e => {
    if (e.id) return;
    e.id = genId();
    dirty = true;
  });
  if (dirty) save(KEYS.scrapbook, scrapbook);
}
```

Mirrors §1 milestones minus the slug-table — scrapbook has no deterministic id source. Idempotent on re-run.

---

### §1 — `addMilestone` id assignment

**Implements:** v6.2 spec §1 (custom milestone path)
**Touches:** `split/home.js:1905–1914` (`addMilestone` body)
**MAJORs folded:** none new.

```js
// At the existing milestones.push site in addMilestone, prepend:
milestones.push({
  id: genId(),                 // PR-ε.0 §1 — custom milestones use genId
  text: t,
  // ...existing fields preserved
});
```

**Out-of-scope reminder (Maren v5 audit MINOR, deferred):** `addMilestone` does not call `save(KEYS.milestones, milestones)` today. PR-ε.0 inherits the bug; orphan-tolerance in §4 (silent filter on read + edit-load toast) handles the consequence gracefully. Followup register only.

---

## Phase C — Identity refactor

### §2 — Dispatcher migration patterns

**Implements:** v6.2 spec §2 (identity refactor)
**Touches:** `split/core.js:454–456` (dispatcher arm — verified exact); render-side at `core.js:2128` (`origIdx = scrapbook.indexOf(entry)`), `core.js:2135` (`openScrapPhoto` data-arg), `core.js:2144–2145` (edit/delete data-arg). Function bodies at `core.js:2192–2256` (`addScrapEntry` / `editScrapEntry` / `deleteScrapEntry` / `openScrapPhoto`).
**MAJORs folded:** Kael v4 audit MAJOR — line 2135 was missed in v3; all three buttons need id-based `data-arg`, not just edit/delete.

**Dispatcher arm — three one-liners, BEFORE/AFTER:**

```js
// BEFORE (core.js:454-456):
else if (action === 'editScrapEntry')   editScrapEntry(parseInt(arg));
else if (action === 'deleteScrapEntry') deleteScrapEntry(parseInt(arg));
else if (action === 'openScrapPhoto')   openScrapPhoto(parseInt(arg));

// AFTER:
else if (action === 'editScrapEntry')   editScrapEntry(arg);
else if (action === 'deleteScrapEntry') deleteScrapEntry(arg);
else if (action === 'openScrapPhoto')   openScrapPhoto(arg);
```

**Function-body lookup pattern:**

```js
// BEFORE (e.g. editScrapEntry at core.js:2220+):
function editScrapEntry(i) {
  const entry = scrapbook[i];
  _scrapEditIdx = i;
  // ...
}

// AFTER:
function editScrapEntry(id) {
  const entry = scrapbook.find(e => e.id === id);
  if (!entry) return;
  _scrapEditId = id;            // global rename: _scrapEditIdx → _scrapEditId
  // ...rest of v6.2 §4 edit-load orphan-toast logic (see §4.B / §4.C)
}

// deleteScrapEntry — splice via findIndex, NOT array index:
const i = scrapbook.findIndex(e => e.id === id);
if (i < 0) return;
scrapbook.splice(i, 1);
save(KEYS.scrapbook, scrapbook);   // explicit — render-side save removed
// DELETE the `else if (_scrapEditIdx > i) _scrapEditIdx--` index-fixup branch entirely.
```

**Render-side `data-arg` swap — three buttons (`core.js:2135, 2144, 2145`):**

```js
// BEFORE: data-arg="${origIdx}"
// AFTER:  data-arg="${e.id}"   // also drop `const origIdx = scrapbook.indexOf(entry)` at 2128
```

Also harmonize `home.js:6532+` `renderScrapbookHistory` (currently uses `origIdx = scrapbook.indexOf(entry)`) — rewrite to `entry.id`.

**Verification grep guards (run in `split/` before merge):**

```bash
grep -n 'scrapbook\['        split/   # expect 0 hits in mutation paths
grep -n '_scrapEditIdx'      split/   # expect 0 hits — full rename
grep -n 'parseInt.*scrap'    split/   # expect 0 hits — no leftover coercions
grep -n 'origIdx'            split/   # expect 0 hits in scrapbook render
```

**[Drift correction — Kael build-time finding]** Spec §2 lists "estimated lines 2197, 2199, 2223, 2243, 2252, 2253" for `_scrapEditIdx` references — actual hits are **2190, 2197, 2199, 2223, 2243, 2252, 2253** (the `let`-declaration at 2190 is the additional one). Verify all 7 sites get renamed.

**Atomicity constraint:** the dispatcher edits, function-body lookups, and `_scrapEditIdx → _scrapEditId` rename MUST land in one commit. Intermediate state (string id flowing into `scrapbook[i]` or numeric index into `scrapbook.find(e => e.id === ...)`) yields runtime `undefined`. See [Cross-section invariants summary](#cross-section-invariants-summary).

---

## Phase D — Sync layer integration

### §6.1 — `_syncSetGlobal` scrapbook arm

**Implements:** v6.2 spec §6.1
**Touches:** `split/sync.js:238–255` (set switch ends at 255) + `split/sync.js:257–275` (get switch).
**MAJORs folded:** Cipher audit BLOCKER #1 (without scrapbook case, listener writes localStorage but in-memory `scrapbook` global stays stale → next mutation re-emits as delete+re-add). Kael v5 MAJOR (reassignment-vs-in-place asymmetry comment vs §6.3 milestones in-place mandate).

```js
// sync.js _syncSetGlobal switch (insert near case 'visits' or end of switch, before default):
// PR-ε.0 §6.1 — scrapbook reassignment is acceptable here ONLY because no
// in-place mutator (no dedupeScrapbookByText analog) and no closure-pinning
// reader exists today (Maren+Kael v5 audit). §6.3 mandates in-place mutation
// for `milestones` for the symmetric closure-pin hazard. Re-verify if either
// constraint changes (closure-pinning reader added, OR in-place scrapbook
// mutator like a future dedupeScrapbookByText).
case 'scrapbook':    scrapbook    = value; return true;

// sync.js _syncGetGlobal switch:
case 'scrapbook':    return scrapbook;
```

The asymmetry comment is the v6 fold — without it, a future reader sees `milestones` use `length=0; push.apply` and `scrapbook` use direct assignment with no rationale and could "harmonize" the wrong direction.

---

### §6.2(a) — `_reconcileDone` state declaration

**Implements:** v6.2 spec §6.2(a)
**Touches:** `split/sync.js:14–20` (module-scope var block). Verified: lines 14–20 are `var _syncShadow`, `var _syncDebounceTimers`, `var _syncWriteCount`, `var _syncWriteCountReset`, `var _syncToastQueue`, `var _syncIsMigrating`, `var _syncIsReconciling`. Line 21 flips to `const CIRCUIT_BREAKER_LIMIT`.
**MAJORs folded:** none new (foundational state for §6.2(c) + (d)).

```js
// PR-ε.0 §6.2 — per-entry reconcile gate.
// Keyed by collection name; entry exists once the first successful snapshot
// apply has happened for that collection in this session. Cleared on
// reconnect / household-rejoin (§6.2(d)).
var _reconcileDone = new Set();
```

`var` matches the surrounding seven-line idiom; `const` would not work (reassigned in §6.2(d)). Insert immediately after `var _syncIsReconciling = false;` at line 20, before the `const` boundary at 21.

---

### §6.2(c) — Reconcile pipeline (pseudocode)

**Implements:** v6.2 spec §6.2(c)
**Touches:** `split/sync.js` `_syncHandlePerEntrySnapshot` body (~lines 1188–1320 per spec). The reconcile block sits **AFTER** the empty-snapshot guard at ~`sync.js:1275–1279` and **BEFORE** the wholesale `save(lsKey, entries)` at ~`sync.js:1291`. Cross-reference: `_syncWritePerEntry` at ~`sync.js:907+` for the canonical stamp-trio + counter idiom.
**MAJORs folded (Kael v5):** circuit-breaker bail must not silently drop local data (orphans concat into `entries` regardless of push outcome); reconcile push must stamp full sync metadata trio (`__sync_createdBy/updatedBy/syncedAt`); `_reconcileDone.add` only on success path (bail leaves gate open for retry on next attach). **MAJORs folded (v6.1 Aurelius polish):** inner try/catch around each `forEach` body (sync throw inside `.set()` no longer skips subsequent orphans); counter-comment one-liner above `_syncWriteCount++` (overcount-fail-safe rationale, prevents future "fix" that would invert safety direction).

**Pseudocode (the orchestration; embeds real-JS sub-blocks where they're already concrete in the spec):**

```text
function _syncHandlePerEntrySnapshot(collection, snapshot) {
    // [existing: parse snapshot to `entries`; existing: empty-snapshot guard]

    // ── PR-ε.0 §6.2 reconcile gate (fires once per collection per session) ──
    if NOT _reconcileDone.has(collection):
        remoteIds = new Set(entries.map(e => e && e.id).filter(Boolean))
        orphanLocals = (current || []).filter(e => e && e.id AND NOT remoteIds.has(e.id))

        if orphanLocals.length > 0:
            // INVARIANT 1 (Kael v5 §6.2 MAJOR): orphans concat into `entries` IMMEDIATELY,
            // BEFORE any breaker/push branching. Survives the wholesale
            // `save(lsKey, entries)` below regardless of push outcome.
            entries = entries.concat(orphanLocals)

            if (_syncWriteCount + orphanLocals.length) > CIRCUIT_BREAKER_LIMIT:
                // INVARIANT 2 (Kael v5 §6.2(c) MAJOR): bail path.
                //   - Skip remote `set()` calls.
                //   - Local entries already concat'd into `entries` above (survive).
                //   - Do NOT add to _reconcileDone — gate stays OPEN for retry.
                //   - Next sync re-attach (§6.2(d)) clears the gate; next snapshot retries.
                console.warn('[sync] reconcile would exceed circuit breaker; deferring push',
                             collection, orphanLocals.length)
                // fall through to existing save(lsKey, entries) below
            else:
                // Push path
                hRef        = firebase.firestore().collection('households').doc(_syncHouseholdId)
                colRef      = hRef.collection(collection)
                writerIdent = { uid: _syncUser.uid, name: _syncUser.displayName || 'Parent' }
                stampBase   = {
                    __sync_createdBy: writerIdent,    // matches _syncWritePerEntry sync.js:917-918
                    __sync_updatedBy: writerIdent,
                    __sync_syncedAt:  firebase.firestore.FieldValue.serverTimestamp()
                }

                // INVARIANT 3 (v6.1 Aurelius polish item 2):
                //   - Suppress "X added N memories" toasts during reconcile.
                //   - try/finally restores _syncIsReconciling on any throw.
                wasReconciling = _syncIsReconciling
                _syncIsReconciling = true
                try:
                    for each e in orphanLocals:
                        // INVARIANT 4 (v6.1 Aurelius polish item 2):
                        //   - INNER try/catch wraps EACH forEach body (not the forEach itself).
                        //   - Sync throw on `.set()` (e.g., firebase uninit) doesn't skip
                        //     subsequent orphans this fire — log and continue.
                        try:
                            // INVARIANT 5 (v6.1 Aurelius polish item 2 counter comment):
                            //   - Increment BEFORE .set() — overcount is fail-safe (breaker
                            //     bails earlier); do NOT move post-resolve, async settlement
                            //     would let bursts under-count and overshoot the limit.
                            //   - Matches existing _syncWritePerEntry pattern at sync.js:884.
                            _syncWriteCount++
                            colRef.doc(e.id).set(Object.assign({}, e, stampBase), {merge: false})
                                  .catch(err => {
                                      console.error('[sync] reconcile push failed',
                                                    collection, e.id, err)
                                      // Local entry already in `entries`; survives this session.
                                      // Retry on next sync re-attach (§6.2(d) clears gate).
                                  })
                        catch syncErr:
                            console.error('[sync] reconcile push threw synchronously',
                                          collection, e.id, syncErr)
                            // Local entry already in `entries` above; survives. Continue forEach.
                finally:
                    _syncIsReconciling = wasReconciling

                // INVARIANT 6 (Kael v5 §6.2 MAJOR):
                //   - _reconcileDone.add ONLY on success path. Bail (above) leaves it open.
                _reconcileDone.add(collection)
        else:
            // No orphans this fire — close gate immediately. Future fires this session skip the diff.
            _reconcileDone.add(collection)

    // [existing: save(lsKey, entries)]
    // [existing: dispatch render via SYNC_RENDER_DEPS]
}
```

**Concretization checklist:**
- [ ] **Placement:** reconcile block sits AFTER the empty-snapshot guard (`sync.js:1275–1279`) and BEFORE the wholesale `save(lsKey, entries)` (`sync.js:1291`). Spec accepts this trade-off (an empty-remote + non-empty-local first fire will NOT push orphans via reconcile; next local-mutation diff push handles it).
- [ ] **Concat survival:** `entries = entries.concat(orphanLocals)` runs on EVERY orphan-detected branch (success, bail, exception). Local data must never be dropped. Single statement, before the branch split.
- [ ] **Gate-add scope:** `_reconcileDone.add(collection)` lives in TWO places — (a) end of success push path, (b) the no-orphans else-branch. NEVER inside the bail branch (gate must stay open for retry).
- [ ] **Inner try/catch (v6.1):** wraps each `forEach` body, NOT the `forEach` itself. The outer `_syncIsReconciling` try/finally remains around the whole `forEach`.
- [ ] **Counter comment (v6.1):** the multi-line comment block lands above `_syncWriteCount++` verbatim (overcount fail-safe rationale + `sync.js:884` cross-reference).
- [ ] **Stamp parity:** `stampBase` includes all three of `__sync_createdBy`, `__sync_updatedBy`, `__sync_syncedAt` — matches `_syncWritePerEntry` at `sync.js:917–918`. Without `__sync_createdBy`, the per-entry attribution composition at `sync.js:1238–1259` silently loses creation provenance for reconciled entries.

---

### §6.2(d) — Reconnect-clear in `_syncAttachListeners`

**Implements:** v6.2 spec §6.2(d)
**Touches:** `split/sync.js:1123–1124` (`_syncAttachListeners` body — verified exact: function declaration at 1123, `_syncDetachListeners()` first call at 1124).
**MAJORs folded:** Kael v4 audit MAJOR — reset MUST run AFTER `_syncDetachListeners()` so any in-flight microtask-queued snapshot callback (already armed before detach, runs after detach returns) fires against the OLD consumed gate and is a no-op for reconcile. Pre-detach reset would let stragglers re-attempt reconcile against stale state.

```js
function _syncAttachListeners(hId) {
  _syncDetachListeners();           // existing line 1124 — DO NOT reorder
  _reconcileDone = new Set();       // PR-ε.0 §6.2(d) — AFTER detach, BEFORE re-arm
  var db = firebase.firestore();    // existing line 1125
  // ...rest of existing arm logic unchanged
}
```

**Placement constraint:** the inline comment MUST stay. Moving the reset to line 1 of the function (intuitive "reset at top") re-introduces the v4 straggler-vs-fresh-gate bug. **Issue [#53](https://github.com/Rishabh1804/sproutlab/issues/53)** tracks the broader snapshot-pipeline straggler limitation; this reset only protects reconcile re-fire, not snapshot-apply.

---

### §6.3 — `dedupeMilestonesByText` (pseudocode)

**Implements:** v6.2 spec §6.3
**Touches:** `split/medical.js:170+` (`dedupeMilestonesByText` body) — body grows from existing ~50 lines to ~70 lines after v6 additions. Three call sites unchanged: `core.js:849`, `medical.js:154` (via `_postReceiveMilestones`), `medical.js:231` (via `syncMilestoneStatuses`).
**MAJORs folded:** v6 BLOCKER (in-place mutation via `length=0; push.apply` — NOT reassignment, which would orphan any closure that captured the pre-dedup reference, e.g. §6.1 `_syncSetGlobal('milestones', ...)` rehydrate path). v6 Kael MAJOR (DEFAULT-slug-wins survivor selection — lex-only could put UUID `0abc...` BEFORE kebab `babbling`, orphaning the deterministic slug on same-text custom-vs-DEFAULT collisions). v4 Kael MAJOR (survivor-mutation behavioral delta — `_mergeMilestoneFieldsInline` mutates `winner` in place; benign today since no closure pins; flagged for re-verification). Audit BLOCKER #3 fold (id-orphan on cross-device dedup — scrapbook `milestoneIds` rewritten via `rewriteScrapbookMilestoneIds` side-effect call).

**Cross-section invariant (Cipher v6.1 finding):** §1's `/^ms-fallback-/` assert is the precondition for `defaultSlugIds` determinism here. If §1 assert is ever softened, this dedup loses determinism on empty-text DEFAULT collisions. See [Cross-section invariants summary](#cross-section-invariants-summary).

**Pseudocode:**

```text
function dedupeMilestonesByText() {
    byKey      = new Map()    // normalized text → survivor entry
    idRewrite  = new Map()    // discarded id → survivor id
    dropped    = []           // entries to remove from milestones

    // INVARIANT 1 (v6 Kael MAJOR): build defaultSlugIds INSIDE the function.
    //   - Rebuilt fresh per call (not module-scope cached).
    //   - DEFAULT_MILESTONES is `const` at data.js:1468 — Kael+Cipher v6.1 confirm
    //     no mutation sites; the `const` declaration IS the load-bearing invariant.
    //   - Cross-section: §1 fallback-assert ensures `defaultSlugIds` membership
    //     is itself deterministic (no `ms-fallback-*` ids enter this Set).
    defaultSlugIds = new Set(
        (typeof DEFAULT_MILESTONES !== 'undefined' ? DEFAULT_MILESTONES : [])
            .map(d => d.id).filter(Boolean)
    )

    for i = 0 to milestones.length - 1:
        m   = milestones[i]
        key = (m.text || '').trim().toLowerCase()
        prev = byKey.get(key)

        if NOT prev:
            byKey.set(key, m); continue

        // INVARIANT 2 (v6 Kael MAJOR): DEFAULT-slug wins over UUID/genId fallback.
        //   - Priority 1: if exactly one of (m, prev) is a DEFAULT-slug id, that one wins.
        //   - Priority 2 (both DEFAULT or both custom): lex-smaller-id wins
        //     (deterministic across devices for UUID/UUID and slug/slug ties).
        mIsDefault    = defaultSlugIds.has(m.id)
        prevIsDefault = defaultSlugIds.has(prev.id)
        if mIsDefault AND NOT prevIsDefault:
            winner = m;    loser = prev
        else if prevIsDefault AND NOT mIsDefault:
            winner = prev; loser = m
        else:
            winner = (m.id || '￿') < (prev.id || '￿') ? m : prev
            loser  = winner === m ? prev : m

        if loser.id AND winner.id AND loser.id !== winner.id:
            idRewrite.set(loser.id, winner.id)

        // INVARIANT 3 (v4 Kael MAJOR — survivor-mutation behavioral delta):
        //   - _mergeMilestoneFieldsInline mutates winner IN PLACE (latest *At dates,
        //     most-advanced status, etc. — existing rules at medical.js:191-217).
        //   - Differs from prior `Object.assign({}, grp[0])` clone idiom.
        //   - Benign today (no closure pinning confirmed in jurisdiction-Kael
        //     and jurisdiction-Maren); flag for re-verification if any later PR
        //     pins a milestone object reference.
        _mergeMilestoneFieldsInline(winner, loser)
        byKey.set(key, winner)
        dropped.push(loser)

    if dropped.length === 0: return false

    // INVARIANT 4 (v6 BLOCKER): in-place mutation.
    //   - `milestones = survivors` would orphan any closure that captured the
    //     pre-dedup array reference. §6.1 _syncSetGlobal rehydrate would write
    //     to a fresh array while readers read the orphaned old one.
    //   - `length = 0; push.apply(target, source)` mutates the same array object.
    survivors = Array.from(byKey.values())
    milestones.length = 0
    milestones.push.apply(milestones, survivors)

    // INVARIANT 5 (audit BLOCKER #3 fold):
    //   - Side-effect call to rewriteScrapbookMilestoneIds when any id was rewritten.
    //   - Without this, scrapbook entries that referenced discarded ids become
    //     orphans across cross-device dedup merges.
    if idRewrite.size > 0:
        rewriteScrapbookMilestoneIds(idRewrite)

    return true   // existing contract: returns whether milestones changed
}
```

**Concretization checklist:**
- [ ] **In-place mutation:** `milestones.length = 0; milestones.push.apply(milestones, survivors)` — NOT `milestones = survivors` reassignment. The v6 BLOCKER reverts the existing `medical.js:221` reassignment idiom; verify the diff drops that line.
- [ ] **DEFAULT-wins short-circuit precedes lex compare:** the two `if mIsDefault ...` branches must run before the `winner = (m.id||...) < (prev.id||...) ? m : prev` fallback. Order matters.
- [ ] **`defaultSlugIds` Set is built INSIDE the function:** rebuilt fresh per call (not hoisted to module scope, not cached). Cipher+Kael v6.1 confirmed this satisfies the freshness invariant absent `const` mutation.
- [ ] **`_mergeMilestoneFieldsInline` mutates `winner` in place:** existing `medical.js:191–217` field-merge rules preserved; survivor-mutation behavioral delta accepted per Kael v4 audit MAJOR.
- [ ] **`rewriteScrapbookMilestoneIds(idRewrite)` called only when `idRewrite.size > 0`:** avoids needless write to scrapbook localStorage.
- [ ] **Boolean return contract preserved:** three call sites (`core.js:849`, `medical.js:154`, `medical.js:231`) all still no-arg, all expect `true`/`false`. No signature change.
- [ ] **Cross-section invariant:** §1 `/^ms-fallback-/` assert MUST hold for `defaultSlugIds` to be deterministic across loads. If §1 assert is ever softened, this dedup loses determinism on empty-text DEFAULT collisions.

---

### §6.3 — `_postReceiveMilestones`

**Implements:** v6.2 spec §6.3 (migrate-before-dedup integration)
**Touches:** `split/medical.js:145–157` — verified exact. Function signature at 145, dedupe call at 153–155, function close at 157.
**MAJORs folded:** Kael v5 MAJOR (`typeof migrateMilestoneIds === 'function'` silent-skip → `console.assert`). Concat order GUARANTEES `migrateMilestoneIds` is in scope by `medical.js` parse time (config → data → core → home → diet → medical), so the typeof guard hides nothing today but masks future renames.

```js
function _postReceiveMilestones() {
  if (!Array.isArray(milestones)) return;
  try {
    if (typeof migrateMilestoneStatus === 'function') {
      milestones.forEach(m => migrateMilestoneStatus(m));
    }
  } catch(e) { console.warn('[post-receive milestones] migrate:', e); }
  // PR-ε.0 §6.3 — Kael v5 MAJOR: assert (don't typeof-guard) migrateMilestoneIds.
  // Concat order config → data → core → home → diet → medical guarantees
  // in-scope at medical.js parse time. Assert fires loud at dev time if a
  // rename ever breaks the contract. Matches §1 assertion idiom.
  console.assert(
    typeof migrateMilestoneIds === 'function',
    'PR-ε.0 §6.3: _postReceiveMilestones expects migrateMilestoneIds in scope'
  );
  migrateMilestoneIds();   // PR-ε.0 §6.3 — runs BEFORE dedupe so all entries have ids
  try {
    if (typeof dedupeMilestonesByText === 'function') {
      dedupeMilestonesByText();
    }
  } catch(e) { console.warn('[post-receive milestones] dedupe:', e); }
}
```

Idempotent: post-PR-ε.0 receive is a no-op; pre-PR-ε.0 receive writes once, propagates via single-doc sync, other devices receive migrated entries and their own `_postReceiveMilestones` is then a no-op. Terminates in one round-trip per legacy entry.

---

### §6.3 — `rewriteScrapbookMilestoneIds`

**Implements:** v6.2 spec §6.3(b)
**Touches:** `split/medical.js` — new sibling helper to `dedupeMilestonesByText` (which lives at line 170+). Suggested placement: directly after `dedupeMilestonesByText`'s close (~line 225 today; verify against drift via the footer table).
**MAJORs folded:** Cipher audit BLOCKER #3 fold (id-orphan on cross-device dedup). Used by §6.3 dedup as a side-effect call when `idRewrite.size > 0`.

```js
function rewriteScrapbookMilestoneIds(idRewrite) {
  if (!Array.isArray(scrapbook) || !idRewrite.size) return;
  let dirty = false;
  scrapbook.forEach(e => {
    if (!Array.isArray(e.milestoneIds)) return;
    const remapped = e.milestoneIds.map(id => idRewrite.get(id) || id);
    // Dedup after remap (in case both survivor + discarded were tagged on same entry).
    const unique = Array.from(new Set(remapped));
    if (unique.length !== e.milestoneIds.length ||
        unique.some((id, i) => id !== e.milestoneIds[i])) {
      e.milestoneIds = unique;
      dirty = true;
    }
  });
  if (dirty) save(KEYS.scrapbook, scrapbook);
}
```

Called from inside `dedupeMilestonesByText` when `idRewrite.size > 0`. Side-effects on the `scrapbook` global; returns void (caller doesn't read return).

---

### §3 — SYNC_KEYS + SYNC_RENDER_DEPS registration (atomic)

**Implements:** v6.2 spec §3
**Touches:** `split/sync.js:120` (SYNC_KEYS object) + `split/sync.js:201` (SYNC_RENDER_DEPS object) — verified exact landmarks.
**MAJORs folded:** Cipher v2 BLOCKER #9 (tab key is `'history'` not `'home'` — scrapbook lives in history tab post-v2.3 relocation per `template.html:1010`).

```js
// sync.js:120 — inside SYNC_KEYS object literal, alongside per-entry siblings (notes, careTickets):
[KEYS.scrapbook]: { collection: 'scrapbook', model: 'per-entry' },

// sync.js:201 — inside SYNC_RENDER_DEPS object literal:
[KEYS.scrapbook]: {
  global: 'scrapbook',
  renderers: { 'history': ['renderScrapbook', 'renderScrapbookHistory'] }
},
```

**Atomicity constraint (spec step 16):** both registrations MUST commit together. SYNC_KEYS alone arms a listener that dispatches against an undefined dep (silent render miss); SYNC_RENDER_DEPS alone is dead config. Land in one edit; verify `KEYS.scrapbook` appears in both literals via grep.

---

## Phase E — UI surface (chips + picker)

### §4.A — `renderScrapMilestoneChips`

**Implements:** v6.2 spec §4 (chip render block)
**Touches:** `split/core.js` — new sibling function above `addScrapEntry` (~`core.js:2192`); insertion point near the existing scrapbook render block at ~`core.js:2130–2150` (verify-then-edit per Phase E).
**MAJORs folded:** Maren v5 §4 entity-reference escape (escAttr+escHtml double-wrap on `aria-label`); Maren v5 §4 empty-text legacy guard (`labelText` fallback); HR-4 escape contracts at every interpolation boundary.

```js
function renderScrapMilestoneChips() {
  const host = document.getElementById('scrapMilestonePicker');
  if (!host) return;
  const ids = _scrapMilestoneIdsPending || [];
  host.setAttribute('role', 'list');
  host.setAttribute('data-empty', ids.length === 0 ? 'true' : 'false');
  host.innerHTML = ids.map(id => {
    const m = milestones.find(x => x.id === id);
    if (!m) return ''; // silent skip on orphan; confirm-time toast covers UX
    const labelText = (m.text || '').trim() || '(unnamed milestone)';
    return `<span class="chip chip-milestone" role="listitem">
      <span class="chip-label">${escHtml(labelText)}</span>
      <button type="button" class="chip-x"
              data-action="removeScrapMilestone" data-arg="${m.id}"
              aria-label="Remove ${escAttr(escHtml(labelText))} tag">
        <svg class="zi" aria-hidden="true"><use href="#zi-close"/></svg>
      </button>
    </span>`;
  }).join('');
}
```

---

### §4.B — Picker action handlers (five small handlers)

**Implements:** v6.2 spec §4 action-handler table
**Touches:** dispatcher arm at `split/core.js:259–469` (register five new `else if` branches alongside existing `addScrapEntry` / `editScrapEntry` cases at `core.js:377` and `core.js:454`); handler bodies live as module-scope functions colocated with `addScrapEntry` near `core.js:2192`.
**MAJORs folded:** Maren v4 §4 silent-orphan-disappearance MAJOR (edit-load toast); Maren v6 §4 confirm-time orphan toast MAJOR (closes the two-stage gap where a remote-deleted milestone vanished mid-picker without explanation); audit major #8 always-reseed; audit major #13 filter-before-persist; v6.1 Maren MINOR `removeScrapMilestone` wait-for-save semantics doc.

```js
function openScrapMilestonePicker() {
  // Always reseed working set from pending — back-button-leak safe.
  _scrapPickerWorkingSet = new Set(_scrapMilestoneIdsPending || []);
  renderScrapMilestonePickerList();
  openModal('scrapMilestonePickerModal');
}

function toggleScrapPickerMilestone(id) {
  if (_scrapPickerWorkingSet.has(id)) _scrapPickerWorkingSet.delete(id);
  else _scrapPickerWorkingSet.add(id);
  renderScrapMilestonePickerList();
}

function confirmScrapMilestonePicker() {
  // v6 Maren MAJOR: surface confirm-time orphan toast for remote-deleted ids.
  const pre = [..._scrapPickerWorkingSet];
  _scrapMilestoneIdsPending = pre.filter(id => milestones.some(m => m.id === id));
  const dropped = pre.length - _scrapMilestoneIdsPending.length;
  if (dropped > 0) {
    const noun = dropped === 1 ? 'milestone tag' : 'milestone tags';
    showQLToast(`${dropped} ${noun} removed — milestone no longer exists`);
  }
  closeModal('scrapMilestonePickerModal');
  renderScrapMilestoneChips();
}

function cancelScrapMilestonePicker() {
  _scrapPickerWorkingSet = new Set(); // discard
  closeModal('scrapMilestonePickerModal');
}

function removeScrapMilestone(id) {
  // v6.1 Maren MINOR: pending-state edit; persists only on parent form save
  // (parallels the title-field input semantic — see §4.C wiring).
  // Do NOT "fix" to immediate-persist; cancelScrapEdit discards pending changes.
  _scrapMilestoneIdsPending = (_scrapMilestoneIdsPending || []).filter(x => x !== id);
  renderScrapMilestoneChips();
}
```

**Dispatcher additions** (insert into the `core.js:259–469` `if/else if` chain — group near other scrapbook actions around `core.js:454`):

```js
else if (action === 'openScrapMilestonePicker')    openScrapMilestonePicker();
else if (action === 'toggleScrapPickerMilestone')  toggleScrapPickerMilestone(arg);
else if (action === 'confirmScrapMilestonePicker') confirmScrapMilestonePicker();
else if (action === 'cancelScrapMilestonePicker')  cancelScrapMilestonePicker();
else if (action === 'removeScrapMilestone')        removeScrapMilestone(arg);
```

---

### §4.C — Wiring into create/edit lifecycle (cross-cut)

**Implements:** v6.2 spec §4 wiring section
**Touches:** `split/core.js:2192` (`addScrapEntry`), `~core.js:2220+` (`editScrapEntry`), `~core.js:2249+` (`deleteScrapEntry`), plus `clearScrapPhoto` / `cancelScrapEdit` for state-reset symmetry.
**MAJORs folded:** Cipher BLOCKER #2 (render-side `save()` removed; mutators call `save` explicitly — also matches Maren v5 `// DOES NOT SAVE` header on `renderScrapbook`); Maren v5 §4 silent-orphan edit-load toast.

This section is the cross-cut between Maren's UI surface and Kael's data-layer plumbing. The full real-JS lives in v6.2 spec §4 lines ~664–727; copy-forward verbatim — no behavioral changes since v6.2 spec landed.

**Key invariants (concretization checklist):**
- [ ] **`addScrapEntry` new-entry branch:** `id: genId()`, `milestoneIds: [..._scrapMilestoneIdsPending]` (always present, never omitted).
- [ ] **`addScrapEntry` edit branch:** reuse `entry.id`; overwrite `entry.milestoneIds = [..._scrapMilestoneIdsPending]`.
- [ ] **Both branches end with explicit `save(KEYS.scrapbook, scrapbook)`** before `renderScrapbook()` (compensates for the removed render-side save — Cipher BLOCKER #2 + Maren v5 audit major #10).
- [ ] **`editScrapEntry(id)` seeds + filters:** `_scrapMilestoneIdsPending = (entry.milestoneIds || []).slice()`, then filter against current milestones AND surface the one-time `showQLToast` when orphans were dropped (Maren v5 audit MAJOR — silent disappearance violates parent-safety).
- [ ] **`clearScrapPhoto()` resets** both `_scrapMilestoneIdsPending` and `_scrapPickerWorkingSet`.
- [ ] **`cancelScrapEdit()` calls** `clearScrapPhoto()` (existing).
- [ ] **`deleteScrapEntry(id)` looks up by id**, splices via `findIndex`, calls explicit `save(...)`. The index-fixup branch (`_scrapEditIdx > i` shift) is DELETED entirely.

---

## Phase F — Verification & ship

### §7.7 — Visual sanity checklist

**Implements:** v6.2 spec §7.7
**Touches:** Pre-PR Lyra-runs-this checklist; not a code anchor — references `styles.css:152` (focus-visible global rose 2px outline) and `styles.css:3902` (reduced-motion global block, verified at HEAD).
**MAJORs folded:** v6 reduced-motion verification line; v6.1 entity-reference (`&mama;`) positive-verification line; Maren v4 keyboard-nav correction (Tab not arrows); v6 confirm-time orphan toast verification.

```markdown
- [ ] Tag a milestone button is left-aligned to form, doesn't span full width
- [ ] Chips wrap below the button, never overflow horizontally
- [ ] Long milestone text wraps inside the chip, doesn't push the × off
- [ ] × hit area extends past the visible × (hover reveals lavender circle)
- [ ] Picker modal centers on screen, scrolls internally, never page-scrolls
- [ ] Empty milestone state shows zi-sprout icon + warm copy, not a flat empty box
- [ ] Category headers (uppercase, tracked) read as quiet labels, not loud
- [ ] Checked check is filled lavender; unchecked is white with lavender border
- [ ] Modal-btns row stays at bottom; Cancel/Done never scroll out of view
- [ ] Done button uses `btn-lav` (lavender = milestones); Cancel uses `btn-ghost`
- [ ] Color audit: only lavender domain tokens + neutrals appear in any new style rule
- [ ] No emojis, no literal `×` or `+`, no inline `style=` attributes anywhere new
- [ ] DevTools resolved sizes come from tokens (not raw px) on every new element
- [ ] Focus-visible: Tab through every interactive element shows global rose 2px outline (`styles.css:152`); chip × hover lavender does NOT compete with focus ring
- [ ] Keyboard: Space/Enter on focused picker-row toggles; Tab moves between rows (NOT arrows); Escape closes modal
- [ ] Screen reader: picker rows announce "Rolling, checkbox, checked"; chip × announces "Remove Rolling tag, button"; modal title reads on open
- [ ] iOS VoiceOver real-device test (not simulator) — first codebase use of `role="checkbox"` on `<button>`
- [ ] Orphan-tag toast surfaces on edit-load: delete tagged milestone → edit memory → toast "1 milestone tag removed — milestone no longer exists"
- [ ] Attribute escape audit: rename milestone to `Said "mama"` → chip × `aria-label` reads `Remove Said &quot;mama&quot; tag`
- [ ] **Entity-reference escape (v6.1):** rename milestone to `&mama;`, tag a memory. Visible `.chip-label` renders literal `&mama;` (text node, not entity). Chip × `aria-label` reads `Remove &amp;mama; tag` in inspector and announces as "Remove and mama semicolon tag" in VoiceOver — never as "Remove mama tag". Positively verifies `escHtml`-then-`escAttr` double-wrap.
- [ ] No keyboard trap when picker has 0 milestones — Tab still reaches Cancel/Done
- [ ] Tag-a-milestone button stays active when no milestones exist (so user reaches empty-state guidance) — no premature disable
- [ ] **Reduced motion (v6):** `styles.css:3902` `@media (prefers-reduced-motion: reduce)` global block zeroes all `--ease-fast` transitions on `.chip-x`, `.picker-row-check`, `.picker-row`. Settings → Accessibility → Reduce Motion ON → no transition flash on hover or check toggle.
- [ ] **Confirm-time orphan toast (v6):** open picker → in another window/device delete a milestone whose id is in working set → hit Done → toast fires "1 milestone tag removed — milestone no longer exists". Closes the v5 two-stage misleading-UX gap.
```

---

## Line-drift verification footer

Verified against actual `split/*` at this session's HEAD:

| File | Spec-stated length | Actual | Drift | Notes |
|------|---|---|---|---|
| `config.js` | 13 | 13 | 0 | exact |
| `data.js` | 3,561 | 3,561 | 0 | DEFAULT_MILESTONES at 1468–1476 verified |
| `core.js` | 4,842 | 4,969 | +127 | dispatcher 454–456 + scrapbook fns 2112–2256 + init 750–826 still hold; offsets at audit-base SHA |
| `medical.js` | 9,359 | 9,493 | +134 | `_postReceiveMilestones` at 145, `dedupeMilestonesByText` at 170 — exact |
| `sync.js` | 1,052 | 2,054 | **+1,002** | nearly 2x growth since spec authorship; landmark line numbers (120, 201, 238, 1123) still resolve to the named functions; verify each landmark **by name** before edit |
| `template.html` | 2,853 | 2,853 | 0 | scrapTitle/scrapDate at 1030/1031, modal pattern 2704+, sprite at 1–80 — exact |
| `styles.css` | 8,638 | 8,638 | 0 | tokens at 31–116, focus-visible at 152, chips at 3401, reduced-motion at 3902 — exact |

**Drift discipline:** before each phase, re-grep the target files to find the current line for the cited symbol/function. Do NOT trust a phase-N step's line number after phase-N-1 has already inserted content into the same file. Specific high-risk shifts: §6.2(c) reconcile insertion in `sync.js` shifts everything below `sync.js:1290`; §6.3 dedup rewrite in `medical.js` shifts `_postReceiveMilestones` line numbers cited in step 5(b). Use grep, not memorized line numbers.

CLAUDE.md line-count drift across `sync.js`/`medical.js`/`core.js` is tracked separately as issue [#55](https://github.com/Rishabh1804/sproutlab/issues/55) (non-blocking; doc hygiene only).

---

## Cross-section invariants summary

The audit chain surfaced a handful of cross-section invariants that no single section captures alone. Implementer must hold these mentally during translation:

1. **§1 fallback-assert ↔ §6.3 `defaultSlugIds` determinism** (Cipher v6.1).
   §1 `migrateMilestoneIds` includes the v6 assert `DEFAULT_MILESTONES.every(m => !/^ms-fallback-/.test(m.id))`. This assert protects §6.3 `dedupeMilestonesByText`'s DEFAULT-wins survivor selection: a non-deterministic `ms-fallback-<random>` id in the `defaultSlugIds` Set would let same-text custom-vs-DEFAULT collisions orphan the deterministic slug across page loads. **If §1 assert is ever softened, §6.3 must add an alternative determinism guard.**

2. **§2 dispatcher rename ↔ function-body atomicity** (Kael build-mode finding).
   The `_scrapEditIdx → _scrapEditId` rename, dispatcher arm edits, and function-body `find`/`findIndex` lookups MUST land in one commit. Intermediate state (string id flowing into `scrapbook[i]` array index, OR numeric index flowing into `scrapbook.find(e => e.id === ...)`) yields runtime `undefined` and broken edit/delete buttons. Spec §2 lists 7 `_scrapEditIdx` reference sites (lines 2190, 2197, 2199, 2223, 2243, 2252, 2253); all 7 must rename in the same edit.

3. **§3 SYNC_KEYS ↔ SYNC_RENDER_DEPS atomicity** (Cipher v2).
   Both Firestore registrations MUST commit together. SYNC_KEYS alone arms a listener that dispatches against an `undefined` dep (silent render miss — same defect class as Cipher BLOCKER #1 in transient form). SYNC_RENDER_DEPS alone is dead config.

4. **§6.1 reassignment ↔ §6.3 in-place mutation asymmetry** (Kael v5).
   `_syncSetGlobal('scrapbook', value)` reassigns the global; §6.3 mandates in-place mutation (`length = 0; push.apply`) for `milestones` for the symmetric closure-pin hazard. The asymmetry is benign today (Maren+Kael+Cipher v5 confirm no closure-pinning reader exists for `scrapbook`) but must be re-verified if either (a) a closure pins `scrapbook` by reference, OR (b) a future PR adds an in-place mutator for `scrapbook` (e.g., a `dedupeScrapbookByText`).

5. **§6.2(c) reconcile gate ↔ §6.2(d) reconnect-clear ordering** (Kael v4).
   The gate reset (`_reconcileDone = new Set()`) MUST run AFTER `_syncDetachListeners()` inside `_syncAttachListeners`. Pre-detach reset would let in-flight microtask-queued snapshot stragglers re-attempt reconcile against stale state. Issue [#53](https://github.com/Rishabh1804/sproutlab/issues/53) tracks the broader snapshot-pipeline straggler limitation that this ordering only partially mitigates.

6. **§6.2(c) circuit-breaker bail ↔ data preservation** (Kael v5).
   On bail, local orphans must already be concat'd into `entries` BEFORE the bail decision branches — `entries.concat(orphanLocals)` is a single statement that runs unconditionally on the orphan-detected path. The `_reconcileDone.add(collection)` call is conditional on the success branch ONLY; bail leaves the gate open so the next sync re-attach (which clears the gate via §6.2(d)) retries the push.

7. **§6.3 in-place mutation ↔ rehydrate path** (Kael+Maren v5).
   The v6 BLOCKER fix mandates `milestones.length = 0; milestones.push.apply(milestones, survivors)` instead of `milestones = deduped` reassignment. The reassignment would orphan any closure that captured the pre-dedup array reference — including the §6.1 `_syncSetGlobal('milestones', ...)` rehydrate path. Verify no Object-pinning reader exists across both Governor jurisdictions when implementing (Maren v5 confirmed home.js readers all use transient `forEach`/`filter`; Kael v5 confirmed core/sync/intelligence have no closure pins).

---

*Drafters: Maren (Care/UX, build-mode flex) · Kael (Intelligence/data-layer, build-mode flex) · Lyra (≥50 LOC sections + assembly + cross-section synthesis). v6.2 atomic spec package — folds into PR [#52](https://github.com/Rishabh1804/sproutlab/pull/52) before un-drafting.*
