# PR-ε.0 v6.1 — Foundation: stable IDs + scrapbook sync + milestone linkage

> **v6 changelog (this revision):** addresses Kael + Maren v5 dual-Governor
> audit + Cipher Edict V cross-cutting pass.
> 1 BLOCKER + 7 MAJORs folded + 1 MINOR; 2 MAJORs deferred with
> forward-pointer (filed as issues #53 + #54). 9 total MAJORs touched.
> - **BLOCKER (Cipher cross-cutting):** v5 §0a relocated `slugify` to
>   `config.js` but three index-level artifacts still said it lived in
>   `core.js` — line 183 (Build-system prose), line 191 (Critical-files
>   table: `Add genId(), slugify()` in core.js), and Phase A step 1
>   ("`genId()` and `slugify()` in `core.js`"). An implementer following
>   the Implementation Order verbatim would have re-introduced the v4
>   BLOCKER. **Fix:** updated all three sites; split Phase A step 1
>   into 1a (`slugify` in config.js per §0a) + 1b (`genId` in core.js
>   per §0b).
> - **MAJOR (Kael):** §1 — slug-uniqueness assert in `migrateMilestoneIds`
>   checks Set-size only; two empty-text DEFAULTs would produce distinct
>   `ms-fallback-*` ids and pass. **Fix:** added a parallel assert that
>   no DEFAULT id matches `/^ms-fallback-/`.
> - **MAJOR (Kael):** §6.3 — lex-smaller-id survivor selection could
>   favor UUIDs over DEFAULT slugs (UUID leading-digit < kebab-letter).
>   Custom-text-collision with a DEFAULT would have orphaned the
>   deterministic slug. **Fix:** prefer `defaultSlugIds.has(m.id)` short-
>   circuit before lex compare so DEFAULT slugs always win same-text
>   collisions.
> - **MAJOR (Kael):** §6.3 — `typeof migrateMilestoneIds === 'function'`
>   guard masked future renames. **Fix:** converted to `console.assert`
>   matching the §1 assertion idiom.
> - **MAJOR (Kael):** §6.1 — `_syncSetGlobal('scrapbook', value)`
>   reassigns; §6.3 mandates in-place mutation for `milestones` for the
>   same closure-pin hazard. Asymmetry is benign today (Maren+Kael both
>   confirm no closure-pinning reader) but undocumented. **Fix:** added
>   a comment stating the asymmetry is acceptable absent in-place mutator
>   + closure-pinning reader; flag for re-verification.
> - **MAJOR (Kael):** §6.2(c) — synchronous throw inside the orphan
>   `forEach` (e.g. firebase uninitialized) would skip subsequent orphans
>   this fire. Data still survives via concat + reattach retry, but the
>   partial-attempt path was undocumented. **Fix:** wrapped each forEach
>   body in inner `try/catch` that logs and continues, matching the
>   `.catch()` handling for async rejections.
> - **MAJOR (Maren):** §4 — `escAttr` (`core.js:2304`) only escapes `'`
>   and `"`, not `&`. Milestone text containing `&` (e.g. `Tom & Jerry`)
>   produced malformed-but-tolerated attribute markup; `&mama;` could
>   parse as a numeric/named entity reference → SR mis-announcement.
>   **Fix:** double-wrap aria-label as `${escAttr(escHtml(m.text))}`
>   for the chip × only. (Extending escAttr globally has wider blast
>   radius — deferred to a separate PR.)
> - **MAJOR (Maren):** §4 — orphan-toast fired only on `editScrapEntry`
>   open. If a remote sync dropped a milestone WHILE the form was open,
>   `confirmScrapMilestonePicker` (line ~550) silently filtered orphans
>   at confirm with no feedback — two-stage misleading UX. **Fix:** added
>   a parallel toast in `confirmScrapMilestonePicker` when the orphan-
>   filter drops anything.
> - **MAJOR (Maren):** §7.3 — `.picker-row { align-items: center; }`
>   paired with `word-break: break-word` and a 22×22 sibling check
>   vertically centers the check against multi-line wrapped labels;
>   appears mis-aligned with the first line on phone. **Fix:** changed
>   `.picker-row` to `align-items: flex-start` and added small
>   `margin-top` to `.picker-row-check` for first-line cap-height
>   alignment.
> - **MAJOR (Maren):** §7.7 — visual checklist omitted a
>   `prefers-reduced-motion` verification. `styles.css:3902` global
>   block already zeros transitions, but the spec didn't claim it.
>   **Fix:** added one §7.7 checklist line.
> - **MINOR (Maren):** §4 — chip render of a milestone with empty/
>   whitespace `text` produced an empty `.chip-label` and aria-label
>   `"Remove  tag"` (double space). `addMilestone` guards new entries
>   but legacy data could contain them. **Fix:** `(m.text || '').trim()
>   || '(unnamed milestone)'` fallback before escHtml. Doc-only:
>   `removeScrapMilestone` wait-for-save semantics noted (chip × drops
>   from pending; persists on form save; `cancelScrapEdit` discards).
> - **Deferred MAJORs (2, with forward-pointer + tracked issues):**
>   §4 picker modal lacks `role="dialog"` / `aria-modal="true"` /
>   `aria-labelledby` — pre-existing pattern gap across all SproutLab
>   modals; PR-ε.0 adopting it unilaterally would create per-modal
>   inconsistency. Filed to "Out of scope" register; **tracked as
>   issue #54** (repo-wide modal a11y uplift).
>   §6.2(d) in-flight Firestore snapshot stragglers can run
>   `save(lsKey, entries)` after detach, overwriting local with stale
>   remote. Reconcile-gate placement protects reconcile re-fire but
>   not the underlying snapshot-apply. Pre-existing pipeline limitation
>   outside §6.2's scope; forward-pointer note added in §6.2(d); defer
>   generation-counter / `_syncDisabled`-flip to a separate hardening
>   PR. **Tracked as issue #53.**
>
> **v6.1 (this push):** addresses Aurelius polish-pass review on PR #52.
> - **Item 1** (§6.3 `defaultSlugIds` invariant comment): skipped —
>   Kael + Cipher confirmed `const` declaration on `DEFAULT_MILESTONES`
>   IS the invariant; Set is rebuilt fresh per call inside the function.
> - **Item 2** (§6.2(c) write-counter one-liner): landed verbatim above
>   the new `_syncWriteCount++` in the orphan forEach. Documents
>   "overcount is fail-safe" so a future reader doesn't invert the
>   safety direction.
> - **Item 3** (§7.7 entity-reference positive verification): landed —
>   fixture string is `&mama;` (not `Tom & Jerry`); Maren caught that
>   bare `&` is HTML5-tolerated and would pass on v5 too. The canonical
>   hazard is entity-reference parsing.
> - **Item 4** (forward-pointer durability): filed issues #53 (snapshot
>   stragglers) + #54 (modal a11y) and cross-linked both into the
>   deferred bullets above + their respective spec sections.
> - **Cipher additional finding** (changelog arithmetic): clarified
>   header from "9 MAJORs" → "1 BLOCKER + 7 MAJORs folded + 1 MINOR;
>   2 MAJORs deferred (issues #53 + #54). 9 total MAJORs touched."
> - **Cipher additional finding** (CLAUDE.md line-count drift): tracked
>   as issue #55 (non-blocking; doc hygiene only).

> **v5 changelog (previous revision):** addressed Kael + Maren v4 dual-audit.
> 1 BLOCKER, 5 MAJORs, 4 MINORs folded.
> - **BLOCKER (Kael):** `slugify()` cannot run at `data.js` parse time
>   (concat order: `data → core`). **Fix:** relocate `slugify` to
>   `config.js` (first concatenated file). `genId` stays in `core.js`
>   (only ever called at runtime). Slug-uniqueness assert moves to
>   `migrateMilestoneIds()` in `core.js` (runs at init, post-parse).
> - **MAJOR (both):** §6.3 — existing `medical.js:221` does
>   `milestones = deduped` (REASSIGNMENT). v5 spec mandates **in-place
>   mutation** via `milestones.length = 0; milestones.push.apply(...)`.
>   Reassignment would break the §6.1 `_syncSetGlobal` rehydrate path
>   for any closure captured pre-reassign.
> - **MAJOR (Kael):** §2/§4 — `core.js:2135` (`openScrapPhoto` button)
>   ALSO uses index-based `data-arg`; v4 only flagged 2144–2145.
>   Add 2135 to the id-conversion list.
> - **MAJOR (Kael):** §6.2 — clarify `_reconcileDone = new Set()`
>   placement: must run AFTER `_syncDetachListeners()` (sync.js:1124)
>   to avoid in-flight snapshot races against the gate. Document the
>   ordering invariant.
> - **MAJOR (Kael):** §6.3 — survivor-mutation behavioral delta vs
>   current `Object.assign({}, grp[0])` clone pattern. Likely benign
>   for milestones (no object-pinning readers identified in
>   jurisdiction-Kael review), but flagged for code-review attention.
> - **MAJOR (Maren):** §4 — silent orphan-tag drop violates
>   parent-safety expectation. Add a one-time toast on edit-load when
>   `_scrapMilestoneIdsPending.length < (entry.milestoneIds || []).length`.
> - **MAJOR (Maren):** §4 — `role="checkbox"` on `<button>` is the
>   codebase's first use. Add a code comment pointing to WAI-ARIA
>   practices; add iOS VoiceOver verification to §7.7 checklist.
> - **MAJOR (Maren):** §7.7 — arrow-key claim is incorrect (browser
>   default for `<button>` is Tab-only, NOT arrow-key navigation
>   between siblings). Drop the claim; document Tab as the only
>   keyboard nav path.
> - **MINORs folded:** §6.2 wraps reconcile push in
>   `_syncIsReconciling = true; ...; false` (suppresses toast spam).
>   §6.2 documents empty-snapshot guard interaction (reconcile sits
>   AFTER guard — accepted, since first-sync orphan push relies on
>   subsequent local-mutation diff). `core.js:2112` gets a
>   `// DOES NOT SAVE` header comment. `addMilestone()` missing-save
>   bug added to "Out of scope" followup register. Implementation
>   order gains a "verify line numbers each phase" reminder
>   (drift ±1–2 throughout — actual `sync.js` is 2055 lines, not the
>   1052 CLAUDE.md still claims; doc-drift cleanup separate).
>
> **v4 changelog (previous revision):** addressed Cipher v3 audit. All four
> remaining defects were in §6:
> - §6.2 circuit-breaker bail no longer silently drops local data
>   (concat orphans into `entries` regardless; do NOT flip
>   `_reconcileDone` on bail — retries next session).
> - §6.2 reconcile push now stamps `__sync_createdBy` (matches
>   `_syncWritePerEntry` at `sync.js:917–918`).
> - §6.2 retry-timing comment clarified ("next sync re-attach", not
>   "next snapshot fire").
> - §6.2 line reference corrected to `sync.js:1123`.
> - §6.3 keeps `dedupeMilestonesByText()` no-arg + global-mutate +
>   boolean-return signature (preserves the 3 existing call sites at
>   `core.js:849`, `medical.js:154`, `medical.js:231`). Scrapbook
>   back-rewrite happens as a side effect inside the function.
> - §6.3 `_postReceiveMilestones` integration is a 1-line insertion,
>   not a rewrite — `migrateMilestoneIds()` goes AFTER the existing
>   per-entry status-migrate forEach, BEFORE the existing dedup call.
>
> **v3 changelog (previous revision):** addresses Cipher v2 audit findings.
> 3 blockers fixed (§6.2 colRef scope + `_reconcileDone` declaration +
> §4 Done button rose→lavender contradiction). 6 majors fixed
> (§6.2 circuit-breaker integration; §6.2 reconnect-clear; §6.3
> migrate-before-dedup in `_postReceiveMilestones`; §4 escAttr in
> aria-label; §4 keyboard a11y on picker rows; cross-cutting step
> 16+17 atomicity). Minors folded: chip-x margin-overlap fix,
> `_mergeMilestoneFields` clarification, expanded HR-9 jurisdiction,
> visual checklist additions (focus-visible, keyboard nav, SR order).
>
> **v2 changelog (previous revision):** revised after Cipher v1
> audit. Added §6 "Sync-layer integration"; §7 "HR compliance &
> visual design"; corrected scrapbook tab to `history`; chip
> composition rewrite; modal-class corrections.

## Context

This PR is the data-model foundation that PR-ε.1 (tap-on-milestone detail
view) depends on. Today the SproutLab data layer has three blockers for
linking memories to milestones:

1. **Milestones are identified by array index** (`split/home.js:1598`,
   `data-ms-idx="${m._i}"`). Indices change on insertion/deletion and don't
   survive sync re-orders.
2. **Scrapbook is local-only** (not in `SYNC_KEYS`, `core.js:45`). Memories
   created on the phone never reach the tablet.
3. **No memory↔milestone relation exists** — scrapbook entries have
   `{photo, title, desc, date, ts}` only (`core.js:2208–2214`).

Outcome: every milestone has a stable `id`; every scrapbook entry has an
`id` and an optional `milestoneIds: string[]`; scrapbook syncs across
devices via Firestore using the existing `per-entry` model (precedent:
careTickets, `sync.js:120–140`); a milestone multi-picker lives in the
scrapbook create/edit form. **No new screens or detail views — those are
PR-ε.1.**

## Decisions (locked)

- **Scrapbook sync model:** `per-entry` (one Firestore doc per memory).
- **Milestone identity:** single `id` field. Defaults use a deterministic
  text-slug; custom user-added milestones use `genId()`.
- **Memory↔milestone cardinality:** many-to-many via
  `milestoneIds: string[]`.
- **`milestoneIds` persistence:** **always write `milestoneIds: []` for
  the empty case** (do NOT omit). Firestore `set(merge: true)` keeps
  stale arrays when fields are omitted; explicit `[]` is the only way to
  clear cleanly. (Resolves audit major #6.)
- **AI tags:** reserve, don't implement. When implemented in a future PR,
  sort canonically before persist (avoids re-write churn under
  `JSON.stringify` equality at `sync.js:843`). Documented for that PR.

## Verified codebase facts (v2 — corrections from audit)

- **Per-entry docId field:** `entry.id` (`sync.js:920`:
  `colRef.doc(entry.id).set(data)`).
- **Sync metadata stamps:** auto-added: `__sync_createdBy`,
  `__sync_updatedBy`, `__sync_syncedAt`. None collide with our schema
  (`id`, `photo`, `title`, `desc`, `date`, `ts`, `milestoneIds`).
- **Scrapbook lives in the `history` tab, NOT `home`.** Comment at
  `template.html:1010`: "SCRAPBOOK (relocated from Home in v2.3)". Card
  is inside `<div class="tab-panel" id="tab-history">` (line 841). The
  bootstrap and plan v1 had this wrong. **`SYNC_RENDER_DEPS` key is
  `'history'`.** (Fixes audit blocker #9.)
- **Second scrapbook surface:** `renderScrapbookHistory` at
  `home.js:6532` (function start; line 6571 is body). Renders into
  `#scrapbookHistoryContent` and `#scrapHistPreview` on the history
  tab. Both renderers must be in `SYNC_RENDER_DEPS.scrapbook`.
- **`_syncSetGlobal` / `_syncGetGlobal` are hard-coded switches**
  (`sync.js:238–275`) with no `'scrapbook'` case. Without adding cases,
  per-entry listeners write only to localStorage; the in-memory JS
  `scrapbook` variable stays stale, and the next mutation rebuilds the
  diff against pre-listener state → clobber. (Fixes audit blocker #1.)
- **`renderScrapbook()` at `core.js:2113` calls `save(KEYS.scrapbook,
  scrapbook)` on every render** — a localStorage no-op today, but a
  Firestore write storm after PR-ε.0 wires sync. **The save call must
  be removed**, and the mutation paths (`addScrapEntry`,
  `deleteScrapEntry`, `editScrapEntry` edit-branch) must call
  `save(KEYS.scrapbook, scrapbook)` explicitly. (Fixes audit blocker #2
  and prevents the regression at audit major #10.)
- **Per-entry listener wholesale-replaces local** at `sync.js:1291`
  (`save(lsKey, entries)`). Empty-snapshot guard at
  `sync.js:1275–1279` only protects `entries.length === 0`. **For
  members with non-empty local + non-empty remote, locals not in remote
  are silently dropped** — the first sync wipes them. (Fixes audit
  blocker #4; mitigation in §6.2.)
- **`dedupeMilestonesByText` at `medical.js:170+`** merges duplicates
  by case-insensitive trimmed text and **discards all but one entry's
  `id`**. With our new `milestoneIds: string[]` linkage, this orphans
  user-created memory↔milestone links across cross-device merges.
  (Fixes audit blocker #3; mitigation in §6.3.)
- **`popstate` handler** at `core.js:3055–3068` removes `.open` from
  any open `.modal-overlay` but does **not** call action handlers. So
  back-button dismiss of the picker bypasses
  `cancelScrapMilestonePicker` and leaves `_scrapPickerWorkingSet`
  populated. (Fixes audit major #8; mitigation in §4.)
- **`escHtml(s)` at `core.js:2282`.** HR-4 mandates use at every
  innerHTML interpolation of user-provided strings.
- **`escAttr(s)` at `core.js:2304`.** Replaces `'` with `\'` and `"`
  with `&quot;` for attribute contexts (aria-label, data-arg with
  arbitrary text, etc.). `escHtml` does NOT escape quotes; using it
  in attribute contexts breaks attribute parsing on text containing
  `"`. **Use `escAttr` for every attribute interpolation of user
  text.** (Audit v2 finding §7.3 escHtml-in-aria-label.) Convention
  in existing code: `home.js:501, 508–567` shows widespread `escAttr`
  use in `data-arg` and `aria-label` contexts.
- **`_postReceiveMilestones` at `medical.js:145+`** runs as a
  `SYNC_RENDER_DEPS.postReceive` hook (`sync.js:212`) when the
  milestones single-doc updates from a remote source. **It calls
  `dedupeMilestonesByText` but NOT `migrateMilestoneIds`.** Without
  v3's fix (§6.3), entries arriving from a pre-PR-ε.0 device stay
  id-less in memory until next boot — renderers that key off `m.id`
  silently skip them. (Audit v2 finding §6.3.)
- **No UUID helper exists.** Plan adds `genId()` (§0).
- **Build system:** `bash build.sh` concatenates split files in order
  (`config → data → core → home → diet → medical → intelligence →
  sync → start`). Never edit the concatenated `sproutlab.html`
  directly; always edit `split/*` and rebuild. **Helper placement
  follows concat-order constraint:** `slugify` lives in `config.js`
  (first concatenated, in scope when `data.js` parses
  `DEFAULT_MILESTONES` slug-baking — see §0a); `genId` lives in
  `core.js` (only ever called at runtime, after `data.js` has parsed
  — see §0b). Both are visible to all later files in concat order
  (`home.js`, `medical.js`, `sync.js`).

## Critical files (v2 — added sync.js + medical.js + styles.css)

| File | Role |
|---|---|
| `split/data.js:1468–1476` | Bake `id` slug into each DEFAULT_MILESTONES entry |
| `split/core.js:9–54` (KEYS) | Confirm `KEYS.scrapbook` exists; no edit |
| `split/config.js` (top, after constants) | Add `slugify()` (see §0a — must parse before `data.js` for DEFAULT_MILESTONES slug bake) |
| `split/core.js` near utilities (next to `escHtml`/`escAttr`) | Add `genId()` (see §0b — runtime-only, safe in core.js) |
| `split/core.js:752–800` (init) | Insert `migrateMilestoneIds()` after sanitize, before first render |
| `split/core.js` (scrapbook init) | Insert `migrateScrapbookIds()` between scrapbook sanitize and first render |
| `split/core.js:2113` (`renderScrapbook`) | **Remove the `save()` call** AND add a 1-line header comment to the function: `// DOES NOT SAVE — mutators must call save(KEYS.scrapbook, scrapbook) explicitly. (PR-ε.0 §6.1 + Maren v4 audit.)` Documents the contract for future maintainers. |
| `split/core.js:2192–2218` (`addScrapEntry`) | Generate `id` for new entries; reuse `entry.id` on edit; persist `milestoneIds: []` always; explicit `save()` in both branches |
| `split/core.js:2220–2240` (`editScrapEntry`) | Look up by id; seed `_scrapMilestoneIdsPending` |
| `split/core.js:2249–2256` (`deleteScrapEntry`) | Look up by id; **delete the `_scrapEditIdx > i` shift**; explicit `save()` |
| `split/core.js:2135, 2144–2145` (entry render) | `data-arg="${e.id}"` on **all three** action buttons: `openScrapPhoto` (2135), `editScrapEntry` (2144), `deleteScrapEntry` (2145). v4 missed 2135. (Kael v4 audit MAJOR.) |
| `split/core.js:259–469` (action dispatcher) | Drop `parseInt(arg)` for scrap actions; add five new picker actions |
| `split/core.js:3055–3068` (popstate handler) | No structural change; document that picker-leak is mitigated by always-reseed in `openScrapMilestonePicker` |
| `split/home.js:1905–1914` (`addMilestone`) | Assign `id: genId()` |
| `split/home.js:6532+` (`renderScrapbookHistory`) | Audit; ensure id-based action wiring; add to `SYNC_RENDER_DEPS` |
| **`split/medical.js:170+` (`dedupeMilestonesByText`)** | **Preserve survivor `id` deterministically (lex-smaller wins); rewrite `milestoneIds` on scrapbook entries that referenced discarded ids. Keep no-arg / mutate-global / boolean-return signature so `core.js:849`, `medical.js:154`, `medical.js:231` call sites stay unchanged** |
| `split/medical.js:145–157` (`_postReceiveMilestones`) | **Single-line insertion of `migrateMilestoneIds()` after status-migrate, before dedup call** |
| `split/sync.js:120–140` (SYNC_KEYS) | Add `[KEYS.scrapbook]: { collection: 'scrapbook', model: 'per-entry' }` |
| **`split/sync.js:201–227` (SYNC_RENDER_DEPS)** | Map scrapbook → `'history'` tab → `[renderScrapbook, renderScrapbookHistory]` |
| **`split/sync.js:238–275` (`_syncSetGlobal` + `_syncGetGlobal`)** | **Add `'scrapbook'` case to both switches** |
| **`split/sync.js:1188–1320` (per-entry listener)** | **Add reconcile pass: locals not present in remote get re-pushed via `_syncWritePerEntry` before applying snapshot** |
| `split/template.html:1029–1032` (form) | Insert milestone chips region between `#scrapTitle` and `#scrapDate` |
| `split/template.html` (modal section) | New `#scrapMilestonePickerModal` markup |
| **`split/styles.css`** | New CSS classes: `.milestone-chips`, `.chip`, `.chip-x`, `.scrap-form-row`, `.picker-modal-list`, `.picker-cat-group` (HR-2: no inline styles) |

## Spec

### 0. ID generation + slug helpers

Two files, two helpers — split because of concat-order constraints
(per CLAUDE.md: `config → data → core → home → diet → medical →
intelligence → sync → start`). `slugify` MUST be available at
`data.js` parse time so DEFAULT_MILESTONES can compute slug ids
inline; `genId` only fires at runtime, so it can live in `core.js`.

#### 0a. `config.js` — `slugify` (new utility)

`config.js` is the FIRST concatenated file, so anything declared
here is in scope when `data.js` parses. Today the file holds
constants (KEYS, feature flags); this PR adds one pure utility
function as a defensible "early-load utility" carve-out. No state,
no env deps, no side effects.

Add near the top of `config.js`, after the existing constant block:
```js
// Stable-id slug for default milestones. Pure / deterministic.
// Lives in config.js (not core.js) because data.js calls it at
// parse time when baking DEFAULT_MILESTONES — and concat order
// puts data.js BEFORE core.js. (PR-ε.0 §0a — Kael v4 audit.)
function slugify(text) {
  const out = String(text || '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return out || ('ms-fallback-' + Math.random().toString(36).slice(2, 10));
}
```

**Empty-text fallback:** v4 used `'ms-' + genId()` here — but
`genId` doesn't exist at `config.js` scope (it lives in `core.js`).
Replace with an inline `Math.random` fallback. The fallback path
fires only when a default milestone has empty/whitespace-only text,
which is a developer error — the slug-uniqueness assert in
`migrateMilestoneIds` (§1) catches it.

#### 0b. `core.js` — `genId` (new utility)

`genId` is only called at runtime (custom milestones via
`addMilestone`, scrapbook entries via `addScrapEntry`). Never at
parse time. Safe to live in `core.js`.

Add near other `core.js` utilities (next to `escHtml`, `escAttr`):
```js
function genId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id-' + Date.now().toString(36) + '-'
    + Math.random().toString(36).slice(2, 10);
}
```

### 1. Milestone stable IDs

**Schema:** add `id: string` to milestone records.

**Generation rules:**
- DEFAULT_MILESTONES entries: `id: slugify(text)` baked at parse time
  in `data.js`. Works because `slugify` lives in `config.js` (§0a) —
  parsed BEFORE `data.js`. The 7 current entries produce 7 unique
  slugs (verified: `rolling`, `sitting-independently`,
  `early-teething-signs`, `sleeps-independently`, `babbling`,
  `responds-to-name`, `pulls-to-stand-using-support-from-sitting`).
- Custom milestones (`addMilestone()`, `home.js:1905`): `id = genId()`.
- IDs are immutable; renaming milestone text does NOT recompute `id`.
- **Slug-uniqueness assert moved to `migrateMilestoneIds()`** (runs at
  init, AFTER `data.js` has parsed and `core.js` is in scope). v4
  put the assert at module load in `data.js`, but `console.assert`
  fired against `DEFAULT_MILESTONES` works fine there — moving it
  to `migrateMilestoneIds` lets us also catch duplicates introduced
  by future PRs that import additional defaults from a separate
  source. Either site is acceptable; v5 picks the migration site
  for forward-compat.

**Migration** (idempotent, runs once on cold start):
```js
function migrateMilestoneIds() {
  if (!Array.isArray(milestones)) return;
  // Slug-uniqueness assert (PR-ε.0 §1, v5 — moved here from data.js).
  // Runs once at init; fires before any default-id collision could
  // poison `slugByText` lookup. Dev-time only.
  console.assert(
    new Set(DEFAULT_MILESTONES.map(m => m.id)).size === DEFAULT_MILESTONES.length,
    'PR-ε.0: duplicate milestone slug in DEFAULT_MILESTONES'
  );
  // PR-ε.0 v6 — Kael v5 audit MAJOR §0a fallback assert.
  // The §0a `slugify` empty-text fallback yields `ms-fallback-<random>`,
  // which is non-deterministic across page loads. Two empty-text DEFAULTs
  // would each get a unique fallback id, pass the Set-uniqueness assert
  // above, but break cross-device sync (every device's `milestoneIds`
  // references would point at a different fallback). This second assert
  // catches the developer error at init.
  console.assert(
    DEFAULT_MILESTONES.every(m => !/^ms-fallback-/.test(m.id || '')),
    'PR-ε.0: DEFAULT_MILESTONES contains an empty-text entry — fallback id is non-deterministic across loads'
  );
  let dirty = false;
  const slugByText = Object.fromEntries(
    DEFAULT_MILESTONES.map(m => [m.text, m.id])
  );
  milestones.forEach(m => {
    if (m.id) return;
    m.id = slugByText[m.text] || genId();
    dirty = true;
  });
  if (dirty) save(KEYS.milestones, milestones);
}
```
**Call site (precise):** between the milestone load+sanitize block at
`core.js:752–790` and the first render call (audit major #5). Identify
exact line by reading the init flow; the constraint is "after
`milestones = load(...)` and any `Array.isArray` sanitize, before any
`renderMilestones` / `renderHome` call".

### 2. Scrapbook stable IDs

**Schema:** add `id: string` (UUID) to scrapbook entry. Required.

**Migration:**
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
**Call site (precise):** between the scrapbook sanitize block (where
`scrapbook = load(...) || []` and `Array.isArray` guard live) and the
first `renderScrapbook` / `renderScrapbookHistory` call.

**Global rename:** `_scrapEditIdx` → `_scrapEditId` (string id).
- All references in `core.js` (estimated at lines 2197, 2199, 2223,
  2243, 2252, 2253) updated.
- Cancel and clear paths reset to `null`.
- **`deleteScrapEntry` index-fixup branch deleted entirely** (audit
  major #7). The current branch
  `else if (_scrapEditIdx !== null && _scrapEditIdx > i) _scrapEditIdx--;`
  is index-arithmetic that becomes nonsense after the string rename;
  with id-based identity, deleting one entry never invalidates another
  id, so the fixup is unnecessary.

**Action dispatcher migration** (`core.js:375–456`):
- `editScrapEntry(arg)`, `deleteScrapEntry(arg)`, `openScrapPhoto(arg)`
  — pass string id directly, no `parseInt`.
- Bodies use `scrapbook.find(e => e.id === id)` and
  `scrapbook.findIndex(...)` for splice.
- **Both `addScrapEntry` (edit branch) and `deleteScrapEntry` MUST
  call `save(KEYS.scrapbook, scrapbook)` explicitly** after mutation —
  no longer a free side effect of `renderScrapbook()`. (Audit major
  #10.)
- Render in `core.js:2135, 2144–2145`: `data-arg="${e.id}"` on **all
  three** action buttons (`openScrapPhoto` at 2135, `editScrapEntry`
  at 2144, `deleteScrapEntry` at 2145). v4 cited only 2144–2145 —
  Kael's v4 audit caught the miss.
- Audit `home.js:6532+` (`renderScrapbookHistory`) for any id/index
  dependency; harmonize with id-based dispatch. **Verified in v4
  audit:** uses `origIdx = scrapbook.indexOf(entry)` for `data-arg`
  at line ~6567 — harmonization is real work, not a no-op.
- **Verification greps** (run before merge):
  - `grep -n 'scrapbook\[' split/` — confirm no index access
  - `grep -n '_scrapEditIdx' split/` — confirm full rename
  - `grep -n 'parseInt.*scrap' split/` — confirm no leftover coercions

### 3. Scrapbook sync registration (per-entry)

**SYNC_KEYS** (`sync.js:120`):
```js
[KEYS.scrapbook]: { collection: 'scrapbook', model: 'per-entry' },
```

**SYNC_RENDER_DEPS** (`sync.js:201`) — **tab key is `'history'`**, not
`'home'`:
```js
[KEYS.scrapbook]: {
  global: 'scrapbook',
  renderers: { 'history': ['renderScrapbook', 'renderScrapbookHistory'] }
},
```

**Per-entry doc identity:** confirmed `_syncWritePerEntry`
(`sync.js:907–924`) uses `entry.id` as Firestore docId. Plug in.

**Conflict semantics:** last-write-wins. Acceptable.

### 4. Memory ↔ milestone link

**Schema:** `milestoneIds: string[]` on scrapbook entry. **Always
present, possibly empty.** Never omitted. (Audit major #6.)

**UI insert** between `#scrapTitle` (`template.html:1030`) and
`#scrapDate` (line 1031). Markup uses CSS classes only (HR-2),
existing zi() icons (HR-1, HR-7), `data-action` delegation (HR-3, HR-6):
```html
<div class="scrap-form-row">
  <label class="scrap-form-label">Linked milestones</label>
  <div id="scrapMilestonePicker" class="milestone-chips"></div>
  <button type="button" class="btn btn-ghost btn-sm scrap-tag-btn"
          data-action="openScrapMilestonePicker">
    <svg class="zi" aria-hidden="true"><use href="#zi-link"/></svg>
    <span>Tag a milestone</span>
  </button>
</div>
```
Icon choice: **`zi-link`** (verified present in sprite). It reads as
"link this memory to a milestone" — semantic match for the action.
The literal "+" glyph forbidden by HR-1 is avoided.

**Picker modal** appended to existing modal block in `template.html`,
following the verified pattern at `styles.css:1860–1883`
(`.modal-overlay > .modal` with `.modal-btns` for actions):
```html
<div class="modal-overlay" id="scrapMilestonePickerModal">
  <div class="modal scrap-picker-modal">
    <h3>Tag milestones</h3>
    <div id="scrapMilestonePickerList" class="picker-list"></div>
    <div class="modal-btns">
      <button class="btn btn-ghost"
              data-action="cancelScrapMilestonePicker">Cancel</button>
      <button class="btn btn-lav"
              data-action="confirmScrapMilestonePicker">Done</button>
    </div>
  </div>
</div>
```
Class corrections vs v1: `.modal` (not `.modal-card`), `<h3>` for
title (existing modal pattern at `styles.css:1873`), `.modal-btns`
(not `.modal-footer`). `.scrap-picker-modal` is a small extension
class for picker-specific sizing (described in §7).

**State globals** (parallel to `_scrapPhotoPending`):
- `_scrapMilestoneIdsPending: string[]` — selection persisted with the
  entry on save.
- `_scrapPickerWorkingSet: Set<string>` — checkbox state inside the
  open modal.

**Render functions** (HR-4: `escHtml` on every interpolated milestone
text):

`renderScrapMilestoneChips()` reads `_scrapMilestoneIdsPending`,
resolves each id via `milestones.find(...)` (silent skip on orphan),
renders into `#scrapMilestonePicker`:
```js
// PR-ε.0 v6 — Maren v5 audit MINOR: empty-text legacy guard.
// addMilestone (home.js:1907) trims+rejects empty text for new entries,
// but legacy data could contain whitespace-only text. Fall back to
// '(unnamed milestone)' so the chip and aria-label stay readable
// instead of rendering as `Remove  tag` (double space).
const labelText = (m.text || '').trim() || '(unnamed milestone)';
```
```html
<span class="chip chip-milestone" role="listitem">
  <span class="chip-label">${escHtml(labelText)}</span>
  <button type="button" class="chip-x"
          data-action="removeScrapMilestone" data-arg="${m.id}"
          aria-label="Remove ${escAttr(escHtml(labelText))} tag">
    <svg class="zi" aria-hidden="true"><use href="#zi-close"/></svg>
  </button>
</span>
```
**Escape contracts:**
- `${escHtml(labelText)}` for the visible text node (`.chip-label` body) — HTML context.
- `${escAttr(escHtml(labelText))}` for the `aria-label` — attribute context, **double-wrapped**. `escAttr` (`core.js:2304`) only escapes `'` and `"`, NOT `&` or `<`. Milestone text containing `&` (e.g. `Tom & Jerry`) would otherwise produce malformed-but-tolerated attribute markup; `&mama;` could parse as a numeric/named entity reference, causing screen-reader mis-announcement. `escHtml` (`core.js:2282`) escapes `&`, `<`, `>` first; `escAttr` then handles quotes. The result is safe in both HTML5 attribute parsing and SR pronunciation. (Maren v5 audit MAJOR; v6 fix.) Extending `escAttr` to also escape `&` globally has wider blast radius (call sites in home.js et al.) — deferred to a separate PR.
- `${m.id}` in `data-arg` is safe without escape: ids are either deterministic slugs (`[a-z0-9-]+`) or UUIDs / `'id-' + base36` — all attribute-safe by construction.
**Composition rationale:** the chip body is a label (informational,
`cursor: default` via CSS), not a click target — only the inner ×
button removes the tag. This avoids the "click anywhere on chip
deletes it" anti-pattern, gives the × a real hit area (44×44 minimum
per existing `.chip` touch-target convention), and provides a screen-
reader-readable label. The × icon uses `zi-close` (added to sprite
in this PR — see §7.1).

The container `#scrapMilestonePicker` gets `role="list"` and a
`data-empty="true"` attribute when `_scrapMilestoneIdsPending.length
=== 0`, so CSS can hide the container's min-height padding when no
chips exist (avoiding a "ghost row").

`renderScrapMilestonePickerList()` reads `milestones`, groups by
`cat`, renders one section per category. Categories with no
milestones in them are omitted entirely (no empty headers). Each row
is a `<button>` (not a `<label>`) so it's natively focusable for
keyboard nav (audit v2 finding §7 keyboard a11y).

Add a one-line code comment at the top of the renderer (Maren v4
audit MAJOR — this is the codebase's first use of
`role="checkbox"` on `<button>`; flag it so future maintainers
don't "fix" it):
```js
// PR-ε.0 §4 — picker rows are `<button role="checkbox">`, the
// WAI-ARIA pattern for native-focusable selection items.
// See https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
// Do NOT "simplify" to <input type="checkbox"> or <label>;
// it would force inline-style overrides for cross-browser
// consistency (HR-2 violation) and break tab order.
function renderScrapMilestonePickerList() { ... }
```

```html
<button type="button" class="picker-row"
        role="checkbox" aria-checked="${checked ? 'true' : 'false'}"
        data-action="toggleScrapPickerMilestone" data-arg="${m.id}">
  <span class="picker-row-check" data-checked="${checked ? '1' : '0'}"
        aria-hidden="true">
    <svg class="zi"><use href="#zi-check"/></svg>
  </span>
  <span class="picker-row-label">${escHtml(m.text)}</span>
</button>
```
**Keyboard navigation:** native `<button>` is in the tab order
without `tabindex`. Space/Enter trigger click → existing dispatcher
fires `toggleScrapPickerMilestone`. **Tab moves between rows; arrow
keys do NOT** (browser default for sibling buttons is Tab-only).
v4 plan incorrectly claimed arrow-key navigation worked by default
— Maren v4 audit MAJOR. v5 corrects: Tab is the only nav path. If
arrow-key support is later required, add a keydown handler to the
container; for v0 the Tab-only behavior is acceptable and matches
the rest of the app's modal patterns.
**Screen reader:** `role="checkbox"` + `aria-checked` reads correctly
("Rolling, checkbox, checked" / "unchecked"). The inner check
glyph is `aria-hidden="true"` so SR doesn't double-announce.
**iOS VoiceOver verification required pre-ship** (Maren v4 audit):
the pattern is standards-compliant but iOS sometimes appends
"double-tap to activate" mid-announcement; test on a real device.

Custom checkbox via `data-checked` attribute + `zi-check` icon
(existing in sprite). Native `<input type="checkbox">` is avoided
because it forces inline-style overrides for cross-browser
consistency — a CSS-styled custom check on a `<button>` stays HR-2
clean AND keyboard-accessible.

Empty state (entire milestone list empty, not just one category):
```html
<div class="picker-empty">
  <svg class="zi" aria-hidden="true"><use href="#zi-sprout"/></svg>
  <p>No milestones yet</p>
  <p class="picker-empty-sub">Add one in the Track tab first.</p>
</div>
```
HR-4: every `m.text` interpolation in this renderer goes through
`escHtml`. (Audit major #12.)

**Action handlers** (register five new cases in dispatcher,
`core.js:259–469`):

| Action | Handler |
|---|---|
| `openScrapMilestonePicker` | **Always reseed:** `_scrapPickerWorkingSet = new Set(_scrapMilestoneIdsPending)`. Render list. `openModal('scrapMilestonePickerModal')`. (Audit major #8 — back-button leak mitigated by always-reseed.) |
| `toggleScrapPickerMilestone` | Toggle id in working set; re-render list |
| `confirmScrapMilestonePicker` | **Filter against current ids:** `const pre = [..._scrapPickerWorkingSet]; _scrapMilestoneIdsPending = pre.filter(id => milestones.some(m => m.id === id)); const droppedAtConfirm = pre.length - _scrapMilestoneIdsPending.length;` Then if `droppedAtConfirm > 0`, fire `showQLToast` with the same copy used at edit-load (`"${droppedAtConfirm} ${noun} removed — milestone no longer exists"`). (Audit major #13 — drops orphans before persist; **v6 Maren MAJOR fix:** now also surfaces a toast when a remote sync deletes a milestone WHILE the picker is open — closes the two-stage misleading-UX gap.) Close modal. Render chips. |
| `cancelScrapMilestonePicker` | Discard working set. Close modal. |
| `removeScrapMilestone` | Drop id from `_scrapMilestoneIdsPending`. Re-render chips. **Note (v6 Maren MINOR):** does NOT persist until the parent saves the form (chip × is a pending-state edit, parallel to typing in the title field). `cancelScrapEdit` discards pending changes. Do NOT "fix" this to immediate-persist — it would change form-edit semantics. |

**Wiring into create/edit lifecycle:**
- `addScrapEntry()` (`core.js:2192`):
  - New-entry branch: `id: genId()`,
    `milestoneIds: [..._scrapMilestoneIdsPending]` (always present).
  - Edit branch: reuse `entry.id`; overwrite
    `entry.milestoneIds = [..._scrapMilestoneIdsPending]`.
  - **Both branches end with explicit `save(KEYS.scrapbook, scrapbook)`
    before `renderScrapbook()`** (compensates for the removed
    render-side save — audit blocker #2 + major #10).
- `editScrapEntry(id)` seeds
  `_scrapMilestoneIdsPending = (entry.milestoneIds || []).slice()`.
  **Then filter against current milestones AND surface a one-time
  toast if any orphans were dropped** (Maren v4 audit MAJOR — silent
  disappearance violates parent-safety):
  ```js
  function editScrapEntry(id) {
    const entry = scrapbook.find(e => e.id === id);
    if (!entry) return;
    _scrapEditId = id;
    const saved = (entry.milestoneIds || []).slice();
    _scrapMilestoneIdsPending = saved.filter(
      mid => milestones.some(m => m.id === mid)
    );
    const dropped = saved.length - _scrapMilestoneIdsPending.length;
    if (dropped > 0) {
      // Use existing showQLToast helper (HR-8 / quick-load toast).
      const noun = dropped === 1 ? 'milestone tag' : 'milestone tags';
      showQLToast(`${dropped} ${noun} removed — milestone no longer exists`);
    }
    // ...rest of existing seed logic (form fields, photo, etc.)
  }
  ```
  Toast copy is informational, not alarming — communicates the
  state change without implying user error or sync corruption.
- `clearScrapPhoto()` resets pending and working set.
- `cancelScrapEdit()` calls `clearScrapPhoto()` (existing).

**Reverse query** (PR-ε.1 contract):
`scrapbook.filter(e => (e.milestoneIds || []).includes(msId))`.

**Orphan-link behavior:** filter on read (chips render); also filter
on confirm (don't persist orphans — audit major #13).

### 5. Reserve aiTags

No code change. Document `aiTags?: string[]` as the planned future
field name. **Implementation note for future PR:** sort canonically
before persist to avoid `JSON.stringify`-equality re-write churn
(audit minor #17).

### 6. Sync-layer integration (NEW in v2 — addresses audit blockers 1, 3, 4)

This section did not exist in plan v1. The Cipher audit exposed three
sync-layer seams that PR-ε.0 must fix in addition to the registration
boilerplate.

#### 6.1 In-memory rehydrate on listener fire (audit blocker #1)

**Problem:** `_syncSetGlobal` and `_syncGetGlobal` (`sync.js:238–275`)
are hard-coded switches. With no `'scrapbook'` case, the per-entry
listener saves to localStorage but `window.scrapbook` (the global JS
variable) stays stale. The next mutation builds its diff against
pre-listener state → re-emits the listener-applied add as a local
delete + re-add.

**Fix:** add `'scrapbook'` to both switches:
```js
// _syncSetGlobal (around sync.js:240)
case 'scrapbook': scrapbook = value; return true;

// _syncGetGlobal (around sync.js:260)
case 'scrapbook': return scrapbook;
```
Pattern matches existing entries (`feeding`, `sleep`, etc.). Read the
existing cases for exact form before editing.

**v6 — reassignment vs in-place mutation asymmetry (Kael v5 audit MAJOR):**
the `_syncSetGlobal('scrapbook', value) → scrapbook = value` line above
is a **reassignment** of the global. §6.3 explicitly forbids
reassignment for `milestones` (mandates
`milestones.length = 0; milestones.push.apply(milestones, survivors)`)
because `dedupeMilestonesByText` runs in-place and any closure that
captured `milestones` pre-dedup would point at the orphaned old array.
The `scrapbook` reassignment here is **acceptable today** because:
(i) no in-place mutator exists for the `scrapbook` global (no
`dedupeScrapbookByText` analog); (ii) Maren v5 audit confirmed no
closure-pinning reader in `home.js`/`renderScrapbook`/
`renderScrapbookHistory`; (iii) Kael v5 audit confirmed no
closure-pinning reader in core/sync/intelligence. **If a future PR
adds either an in-place scrapbook mutator OR a closure that captures
the `scrapbook` global by reference, this case must be re-verified
and likely converted to in-place mutation** matching §6.3's pattern.
Document carried at the case-statement source comment.

#### 6.2 Per-entry listener reconcile (audit blocker #4)

**Problem:** the per-entry listener at `sync.js:1291` (`save(lsKey,
entries)`) replaces local with remote wholesale. Empty-snapshot guard
at `sync.js:1275–1279` only handles the all-empty case. A member
device with 3 unique local memories receiving admin's 5 → local
becomes 5, member's 3 are dropped before they sync up.

**Fix in three parts: (a) declare reconcile state; (b) construct
proper Firestore ref; (c) integrate with circuit breaker; (d) clear
on reconnect.**

##### (a) Module-scope state declaration

Add to the module-scope variable block in `sync.js` near lines 14–20
(where existing flags like `_syncUser`, `_syncHouseholdId` live):

```js
// PR-ε.0 §6.2 — per-entry reconcile gate.
// Keyed by collection name; entry exists once the first successful
// snapshot apply has happened for that collection in this session.
// Cleared on reconnect / household-rejoin.
var _reconcileDone = new Set();
```

##### (b) Reconcile pass with proper scope

The proposed code in v2 used `colRef` directly, but
`_syncHandlePerEntrySnapshot` only has `collection` (string) and
`snapshot` in scope at `sync.js:1188`. Construct the ref explicitly
using the same household path the existing single-doc / per-entry
write paths use (verified via `_syncWritePerEntry` at `sync.js:907+`,
which receives `hRef = firebase.firestore().collection('households')
.doc(_syncHouseholdId)` from its caller).

In `_syncHandlePerEntrySnapshot`, BEFORE the `save(lsKey, entries)`
call. **Placement vs empty-snapshot guard (`sync.js:1276–1279`)**:
the guard returns early when remote is empty AND local has entries
(audit-v3-mitigation against full-wipe races). Reconcile sits AFTER
this guard, so an empty-remote + non-empty-local case will NOT push
orphans via reconcile on first fire. **v5 decision: accept this.**
The next local mutation produces a normal diff push that includes
the locals. Moving reconcile BEFORE the guard would conflict with
the wipe-protection intent. Document the limitation; do not "fix" it:

```js
// PR-ε.0 §6.2 reconcile: push locals not in remote before adopting snapshot.
if (!_reconcileDone.has(collection)) {
  const remoteIds = new Set(entries.map(e => e && e.id).filter(Boolean));
  const orphanLocals = (current || []).filter(e => e && e.id && !remoteIds.has(e.id));
  if (orphanLocals.length) {
    // ALWAYS preserve orphans locally — independent of whether the push fires.
    // The wholesale `save(lsKey, entries)` below would otherwise drop them.
    // (Audit v3 blocker: circuit-breaker bail must not cause data loss.)
    entries = entries.concat(orphanLocals);

    if (_syncWriteCount + orphanLocals.length > CIRCUIT_BREAKER_LIMIT) {
      console.warn('[sync] reconcile would exceed circuit breaker; deferring push',
        collection, orphanLocals.length);
      // Skip remote push this fire. Do NOT add to _reconcileDone — leave the
      // gate open so a later sync re-attach (after the circuit-breaker resets)
      // can retry the push. Local data survives via the concat above.
      // (Fall through to save(lsKey, entries) — orphans persist locally.)
    } else {
      const hRef = firebase.firestore()
        .collection('households').doc(_syncHouseholdId);
      const colRef = hRef.collection(collection);
      const writerIdent = { uid: _syncUser.uid,
                            name: (_syncUser.displayName || 'Parent') };
      const stampBase = {
        __sync_createdBy: writerIdent,    // matches _syncWritePerEntry sync.js:917–918
        __sync_updatedBy: writerIdent,
        __sync_syncedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      // PR-ε.0 §6.2 v5 — suppress "X added N memories" toasts during
      // reconcile (these entries are already in the local user's UI).
      // _syncIsReconciling is the existing flag at sync.js:20.
      const wasReconciling = _syncIsReconciling;
      _syncIsReconciling = true;
      try {
        orphanLocals.forEach(e => {
          // PR-ε.0 v6 — Kael v5 audit MAJOR §6.2(c) inner try/catch.
          // A synchronous throw inside .set() (e.g. firebase not yet
          // initialized, malformed entry) would otherwise propagate out of
          // forEach and skip every subsequent orphan this fire. Data still
          // survives via `entries.concat(orphanLocals)` above + reattach retry
          // (gate stays open per §6.2(c) bail rule), but partial-attempt is
          // worth logging so the operator sees a breadcrumb. Convert sync
          // throws to the same logged-and-continue path as async rejections.
          try {
            // PR-ε.0 v6.1 — Aurelius polish item 2.
            // Increment before .set() — overcount is fail-safe (breaker bails earlier);
            // do NOT move post-resolve, async settlement would let bursts under-count
            // and overshoot the limit. Matches existing _syncWritePerEntry pattern at
            // sync.js:884.
            _syncWriteCount++;  // count toward circuit breaker
            colRef.doc(e.id).set(Object.assign({}, e, stampBase), { merge: false })
              .catch(err => {
                console.error('[sync] reconcile push failed', collection, e.id, err);
                // Local entry is already merged into `entries` above (it survives
                // this session's snapshot-apply). Retry happens on next sync
                // re-attach (offline→online, auth state change, or page reload),
                // NOT on the next snapshot fire in this same session — because
                // _reconcileDone gates within the session.
              });
          } catch (syncErr) {
            console.error('[sync] reconcile push threw synchronously', collection, e.id, syncErr);
            // Local entry already in `entries` above; survives. Continue forEach.
          }
        });
      } finally {
        _syncIsReconciling = wasReconciling;
      }
      _reconcileDone.add(collection);  // gate: don't re-push this session
    }
  } else {
    // No orphans — mark done immediately. Future fires this session skip the diff.
    _reconcileDone.add(collection);
  }
}
```

**Key invariants (audit v3 §6.2 fixes):**
1. **Local data is never dropped.** `entries.concat(orphanLocals)` runs
   on EVERY path that detects orphans — circuit-breaker bail, push
   success, push pending. Local entries survive the wholesale
   `save(lsKey, entries)`.
2. **Circuit-breaker bail leaves the gate open.** `_reconcileDone.add`
   is conditional on a successful push (or no orphans). On bail, the
   gate stays open, and the next sync re-attach (which clears
   `_reconcileDone` entirely — see §(d) below) will re-attempt.
3. **Reconcile push stamps full sync metadata** —
   `__sync_createdBy`, `__sync_updatedBy`, `__sync_syncedAt` — matching
   `_syncWritePerEntry` (`sync.js:917–918`). Without `__sync_createdBy`,
   the per-entry attribution composition at `sync.js:1238–1259` would
   silently lose creation provenance for reconciled entries. (Audit v3 major.)

##### (c) Circuit-breaker integration

The `_syncWriteCount++` increments and the pre-check against
`CIRCUIT_BREAKER_LIMIT` (existing constant at `sync.js:880`) ensure
reconcile pushes count toward the same per-session write budget as
normal mutations. **Failed pushes still count** — same convention as
`_syncWritePerEntry`. **On circuit-breaker bail:**
- Skip the remote push (no `set()` calls).
- DO concat orphans into `entries` so they survive the local
  `save(lsKey, entries)`. Local data preserved.
- Do NOT add to `_reconcileDone` — leave the gate open for retry on
  the next sync re-attach (which clears the gate per §(d)).

This is the audit-v3 fix for the original blocker: data must never be
dropped silently when the breaker fires.

##### (d) Reconnect clear

`_reconcileDone` is a one-shot per session today — but a long-running
tab that goes offline and back online will skip reconcile on the
re-fire. Clear `_reconcileDone` whenever sync re-attaches.

**Placement (Kael v4 audit MAJOR):** the reset must run AFTER
`_syncDetachListeners()` (the first call inside `_syncAttachListeners`,
sync.js:1124) — NOT before. Reasoning: `_syncDetachListeners()`
unsubscribes existing snapshot handlers; if any in-flight snapshot
callback is still on the microtask queue, it will fire AFTER detach
returns but BEFORE the new listeners arm. If the gate gets reset
BEFORE detach, that in-flight callback sees a fresh gate and
re-attempts reconcile against stale state. Resetting AFTER detach
means any straggler fires against the OLD gate (already consumed)
and is a no-op. The existing `_syncDisabled` guard at `sync.js:1152`
provides additional protection but isn't sufficient on its own.

```js
// _syncAttachListeners (sync.js:1123):
function _syncAttachListeners() {
  _syncDetachListeners();          // existing line 1124
  _reconcileDone = new Set();      // PR-ε.0 §6.2(d) — AFTER detach, before re-arm
  // ...existing arm logic
}
```

This runs once on initial attach (effectively a no-op since
`_reconcileDone` is already empty) and again on any re-attach after
offline → online or auth state change. Locals created during the
offline window — and orphans deferred during a prior circuit-breaker
bail — get pushed up on the first fire after re-attach.

**v6 — in-flight straggler limitation (Kael v5 audit MAJOR, deferred).**
Firestore `onSnapshot` callbacks that were already on the microtask
queue when `_syncDetachListeners()` ran will still fire after detach
returns. The reconcile gate placement above protects **reconcile re-fire**
(straggler runs against the OLD gate, finds it consumed, no-ops the
reconcile push), but the straggler's wholesale `save(lsKey, entries)`
at sync.js:1291 still runs and could overwrite local with stale remote
state captured at the prior listener's last snapshot. The existing
`_syncDisabled` guard at sync.js:1152 is the only flag protecting the
snapshot-apply path; it is not flipped during detach. **This is a
pre-existing snapshot-pipeline limitation outside §6.2's scope.** A
proper fix needs either (a) a generation counter on the listener so
stragglers detect they're stale, or (b) `_syncDisabled` flip during
detach windows. Defer to a separate sync-pipeline hardening PR; not
introduced by PR-ε.0 and not made worse by it.
**Tracked as issue #53** (filed v6.1 per Aurelius polish item 4 —
forward-pointer durability).

##### Verification (manual)

- Member device with 3 local entries + admin with 5 different. Both
  upgrade. Both come online. Result: each device has all 8 entries.
- Long-offline test: device A has the picker open, goes offline 6
  hours, member B adds 4 memories, A reconnects. A's listener fires
  with 9 (5 + 4); A's locally-pending entries (none in this test)
  would also reconcile. Verify A renders all 9.
- Circuit-breaker test: artificially set
  `_syncWriteCount = CIRCUIT_BREAKER_LIMIT - 1` before reconcile
  fires with 5 orphans → the warn log fires; orphans are NOT pushed;
  no partial state in Firestore.

#### 6.3 Milestone dedup ID preservation (audit blocker #3)

**Problem:** `dedupeMilestonesByText` (`medical.js:170+`) merges
case-insensitive trimmed text duplicates and silently discards all
but one entry's `id`. With our new `milestoneIds: string[]` linkage,
this orphans user-tagged links across cross-device merges — actual
data loss (the user explicitly chose those tags).

**Fix:** two parts.

> **⚠ v5 implementer warning (Kael+Maren v4 audit MAJOR):** the
> existing `dedupeMilestonesByText` at `medical.js:221` ends with
> `milestones = deduped;` — a **REASSIGNMENT** of the global. v5
> mandates **in-place mutation** via
> `milestones.length = 0; milestones.push.apply(milestones, survivors);`
> Reassignment would break the §6.1 `_syncSetGlobal('milestones', ...)`
> rehydrate path: any closure or other module that captured the
> pre-reassign reference would point at the orphaned old array
> while `_syncSetGlobal` writes to a fresh one. **Do NOT preserve
> the existing reassign idiom when porting the function.** The v5
> code below uses `length=0; push.apply` deliberately.
>
> **Survivor-mutation behavioral delta (Kael v4 audit MAJOR):** the
> existing field-merge at `medical.js:191–217` clones grp[0] into
> `merged = Object.assign({}, grp[0])` and merges loser fields INTO
> THE CLONE — the original grp[0] is never mutated. v5's
> `_mergeMilestoneFieldsInline(winner, loser)` mutates `winner`
> in place. **For 3-way duplicates**, this produces equivalent
> output (same fields end up on the survivor either way) BUT any
> external reference to the survivor object now sees merged
> fields earlier than under the clone idiom. Kael's v4 audit found
> no object-pinning readers in jurisdiction-Kael code; Maren
> confirmed no pinning in milestone renderers. **Likely benign;
> flagged for code-review attention** — if any later PR adds a
> closure that pins a milestone object, this becomes relevant.

(a) **Survivor selection + scrapbook back-rewrite, keeping the
existing function signature.** The current `dedupeMilestonesByText()`
at `medical.js:170` is no-arg, mutates the global `milestones` array
in place, and returns a boolean. Three call sites depend on this
contract: `core.js:849` (boot dedup), `medical.js:154`
(`_postReceiveMilestones`), `medical.js:231`
(`syncMilestoneStatuses`). **Changing the signature would break all
three.** v4 keeps the no-arg/mutate/boolean shape and adds the
back-rewrite as a side effect on `scrapbook` global before return:

```js
function dedupeMilestonesByText() {
  const byKey = new Map();          // normalized text -> survivor entry
  const idRewrite = new Map();      // discarded id -> survivor id
  const dropped = [];               // entries to remove from milestones
  // PR-ε.0 v6 — Kael v5 audit MAJOR: DEFAULT-slug ids win same-text
  // collisions over UUIDs/genId fallbacks. Lex-only compare can put a
  // UUID ('0abc...' or 'id-...') BEFORE a kebab slug ('babbling') in
  // ASCII order, which would orphan the deterministic DEFAULT slug
  // when a parent creates a custom milestone with the same text.
  // Build the set once before the loop.
  const defaultSlugIds = new Set(
    (typeof DEFAULT_MILESTONES !== 'undefined' ? DEFAULT_MILESTONES : [])
      .map(d => d.id).filter(Boolean)
  );

  for (let i = 0; i < milestones.length; i++) {
    const m = milestones[i];
    const key = (m.text || '').trim().toLowerCase();
    const prev = byKey.get(key);
    if (!prev) { byKey.set(key, m); continue; }
    // PR-ε.0 v6 — Kael v5 audit MAJOR survivor selection.
    // Priority: (1) DEFAULT-slug id wins over non-DEFAULT — preserves the
    // deterministic id every device computes from DEFAULT_MILESTONES at
    // boot. (2) If both or neither are DEFAULT slugs, fall back to
    // lex-smaller-id (deterministic across devices for UUID/UUID and
    // slug/slug ties).
    const mIsDefault    = defaultSlugIds.has(m.id);
    const prevIsDefault = defaultSlugIds.has(prev.id);
    let winner, loser;
    if (mIsDefault && !prevIsDefault)        { winner = m;    loser = prev; }
    else if (prevIsDefault && !mIsDefault)   { winner = prev; loser = m;    }
    else {
      winner = (m.id || '￿') < (prev.id || '￿') ? m : prev;
      loser  = winner === m ? prev : m;
    }
    if (loser.id && winner.id && loser.id !== winner.id) {
      idRewrite.set(loser.id, winner.id);
    }
    // Existing inline merge logic preserved (see medical.js:191–217 today).
    // Apply field-merge from loser into winner.
    _mergeMilestoneFieldsInline(winner, loser);
    byKey.set(key, winner);
    dropped.push(loser);
  }

  if (!dropped.length) return false;

  // Mutate the milestones global in place (existing contract).
  const survivors = Array.from(byKey.values());
  milestones.length = 0;
  milestones.push.apply(milestones, survivors);

  // PR-ε.0 §6.3 side effect: rewrite scrapbook milestoneIds that pointed at discarded ids.
  if (idRewrite.size) {
    rewriteScrapbookMilestoneIds(idRewrite);
  }

  return true;  // existing contract: returns whether milestones changed
}
```

`_mergeMilestoneFieldsInline(winner, loser)` is the existing
field-merge code at `medical.js:191–217` (latest `*At` dates,
most-advanced status, etc.). v4 implementation: if the existing code
is already inline inside the dedup function, leave it inline; if it
fits cleanly as a sub-function, extract under that name. **The
contract is: winner keeps its `id`; loser's field values fold in per
existing rules.** Do not invent new merge rules in this PR — the only
behavioral delta from today's `dedupeMilestonesByText` is (i)
survivor-id is the lex-smaller of the two (was: implicit "first
seen"), and (ii) scrapbook back-rewrite runs after.

(b) **Scrapbook back-rewrite** (sibling helper, also in
`medical.js`):

```js
function rewriteScrapbookMilestoneIds(idRewrite) {
  if (!Array.isArray(scrapbook) || !idRewrite.size) return;
  let dirty = false;
  scrapbook.forEach(e => {
    if (!Array.isArray(e.milestoneIds)) return;
    const remapped = e.milestoneIds.map(id => idRewrite.get(id) || id);
    // Dedup after remap (in case both survivor and discarded were tagged).
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

##### Migrate-before-dedup integration (audit v3 §6.3 fix)

`_postReceiveMilestones` at `medical.js:145–157` today runs per-entry
`migrateMilestoneStatus` first, then `dedupeMilestonesByText()`.
**Do not rewrite the function** — insert one line. The integration is
a single-line addition AFTER the existing per-entry status-migrate
forEach AND BEFORE the existing dedup call:

```js
function _postReceiveMilestones() {
  // existing: per-entry status migration forEach (unchanged)
  // existing: any other pre-dedup logic (unchanged)
  // PR-ε.0 v6 — Kael v5 audit MAJOR: convert silent-skip guard to assert.
  // Concat order (config → data → core → home → diet → medical) GUARANTEES
  // migrateMilestoneIds is in scope by medical.js parse time. The original
  // v5 `typeof === 'function'` guard would silently skip migration if a
  // future PR renamed the function — assert instead so the failure is loud
  // at dev time, matching the §1 assertion idiom.
  console.assert(
    typeof migrateMilestoneIds === 'function',
    'PR-ε.0 §6.3: _postReceiveMilestones expects migrateMilestoneIds in scope (concat order: core.js loads before medical.js)'
  );
  migrateMilestoneIds();  // PR-ε.0 §6.3
  dedupeMilestonesByText();  // existing call, unchanged
  // existing: any post-dedup logic (unchanged)
}
```

Concat order per CLAUDE.md is config → data → core → home → diet →
**medical** → ... so `migrateMilestoneIds` IS in scope by `medical.js`
parse time. The `console.assert` is dev-time-only — production runs
won't pay any cost — and surfaces a loud failure at init if a rename
ever breaks the contract.

`migrateMilestoneIds` is idempotent: if all entries already have ids,
it short-circuits without calling `save`. **No write loop:** when a
remote receive triggers `_postReceiveMilestones` and incoming entries
DO have ids (post-PR-ε.0 era), `migrateMilestoneIds` is a no-op.
When entries lack ids (pre-PR-ε.0 device pushed an update), the
migration writes locally → triggers single-doc sync → other devices
receive the migrated entries → their `_postReceiveMilestones` runs
migrate (idempotent — no-op since their entries already have ids).
**Loop terminates after one round-trip per legacy entry.**

##### Three call-site contract preserved

After v4 changes, `dedupeMilestonesByText()` still has the same
no-arg / mutate-global / boolean-return contract. The three existing
call sites need NO change:
1. `core.js:849` (boot dedup) — runs after v4 step 5's
   `migrateMilestoneIds()`, so all entries have ids; survivor
   selection works.
2. `medical.js:154` (`_postReceiveMilestones`) — receives the
   migrate-before-dedup wrapper from §6.3 above.
3. `medical.js:231` (`syncMilestoneStatuses`) — local-only, runs
   post-migration; survivor selection works.

**Implementation grep guard:** `grep -n 'dedupeMilestonesByText(' split/`
must show the 3 expected call sites and no others, all no-arg.

## §7 HR compliance & visual design (NEW in v2)

Cipher's audit covered correctness; this section ensures the visible
output meets SproutLab's design brief ("warm, sturdy, calm — a cozy
nursery journal, not a clinical health app") and every Hard Rule.

### 7.1 Sprite addition: `zi-close`

The 62-symbol sprite has no close/dismiss icon (`grep` against
`template.html` confirms — closest options are `zi-resolve` /
`zi-check` / `zi-x`, none of which exist). HR-1 forbids literal `×`
character; HR-7 mandates SVG via `<use href>`. Add to the
`<symbol id="zi-close">` block of `template.html`:

```html
<symbol id="zi-close" viewBox="0 0 24 24">
  <path d="M6 6 L18 18 M18 6 L6 18"
        stroke="currentColor" stroke-width="2" stroke-linecap="round"
        fill="none"/>
</symbol>
```

Stroke-only, currentColor — inherits chip color. Matches the visual
weight of existing icons (`zi-check` uses similar 2px stroke).

### 7.2 Color domain

Per CLAUDE.md design system: **lavender is the milestones / achievements
domain.** Every visual surface introduced by this PR uses tokens from
the lavender palette only — no ad-hoc hex values.

Tokens used (verified present in `styles.css`):
| Token | Hex | Where |
|---|---|---|
| `--lavender` | `#c9b8e8` | chip border, picker check accent |
| `--lav-light` | `#f0ebfb` | chip fill, picker row hover |
| `--surface-lav` | `rgba(201,184,232,0.10)` | picker check background |
| `--mid` | (existing neutral) | chip × icon color |
| `--text` | (existing neutral) | chip label, picker row label |
| `--rose-light` | (existing) | modal input focus border (matches existing modal-input pattern) |
| `--card-bg` | (existing) | modal background (white, matches `.modal`) |

**No new color values introduced.** No rose, sage, or peach tokens
used for this milestone-domain surface.

### 7.3 CSS additions to `styles.css`

All values use existing tokens (HR-2, HR-5). Append to the existing
"Chips" section near `styles.css:3401`:

```css
/* ── Milestone tag chips (PR-ε.0) ── */
.chip-milestone {
  background: var(--lav-light);
  color: var(--text);
  border-color: rgba(201, 184, 232, 0.6);
  cursor: default;          /* chip body informational, not a click target */
  padding-right: var(--sp-4); /* tighter on the × side */
  gap: var(--sp-6);
}
.chip-milestone:hover { filter: none; transform: none; } /* override base .chip:hover */
.chip-label {
  font-size: var(--fs-sm);
  white-space: normal;       /* allow wrap; HR-10 forbids ellipsis */
  word-break: break-word;
  max-width: 200px;
  line-height: var(--lh-snug);
}
.chip-x {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px;       /* visual size */
  min-width: 44px; min-height: 44px; /* WCAG 2.5.5 touch target */
  padding: var(--sp-8);
  /* Negative margin scoped to LEFT only (inward into chip body)
     and RIGHT only (inward beyond chip border).
     NOT applied vertically — would compound chip's 44px min-height.
     NOT applied symmetrically — sibling-chip overlap when wrapping
     in a `gap: var(--sp-6)` flex container would otherwise be -2px.
     (Audit v2 finding §7.3 chip-x overlap.) */
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

```css
/* ── Picker modal (PR-ε.0) ── */
.scrap-picker-modal {
  max-width: 480px;     /* slightly wider than default 420 to fit category groups */
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
  /* PR-ε.0 v6 — Maren v5 audit MAJOR: flex-start (was: center).
     With center + word-break: break-word on the label, the 22×22 check
     vertically centers against multi-line wrapped text, appearing
     mis-aligned with the first line on phone-narrow widths. flex-start
     keeps the check optically aligned with the first line; the
     margin-top below nudges it to first-line cap-height. */
  align-items: flex-start;
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
  /* PR-ε.0 v6 — Maren v5 audit MAJOR: optical-align with first-line
     cap height of the picker-row-label (--fs-base, --lh-snug). 2px
     covers the typical baseline offset between a small filled square
     and the cap height of body text in Nunito at 16px. */
  margin-top: 2px;
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

Tokens audited: every value is `var(--*)` from the verified token
list (`--sp-4/6/8/10/12/16/20/24/32`, `--fs-xs/sm/base`, `--r-sm/lg/full`,
`--lavender/lav-light/surface-lav/mid/text/light/card-bg`, `--icon-xs/sm/lg`,
`--ease-fast`, `--ls-wide`, `--lh-snug`). Two non-token values are
necessary and justified: the `0.6` alpha on chip border and the `1.5px`
border width on `picker-row-check` — both match existing precedents
in `.chip-safe` (`rgba(181,213,197,0.6)`) and `.modal-input`
(`1.5px solid var(--rose-light)`).

### 7.4 Layout & alignment

- **Form row alignment:** `.scrap-form-row` matches the vertical
  rhythm of the existing `#scrapTitle`, `#scrapDate`, `#scrapDesc`
  fields (each currently uses `margin-top:6px` inline — pre-existing
  HR-2 debt, not in our scope to fix). The new row uses `var(--sp-8)`
  top margin for slightly tighter pairing with its label, then the
  date field below uses its existing `margin-top:6px`. Visually
  reads as one block.
- **Chip wrap:** `flex-wrap: wrap` on `.milestone-chips`; chips wrap
  to next line when they overflow the form width. Long milestone
  text (e.g. "Pulls to stand using support (from sitting)") wraps
  inside the chip via `word-break: break-word` on `.chip-label` —
  HR-10 compliance (no ellipsis). Maximum chip label width 200px
  prevents one chip from monopolizing the row.
- **Picker modal sizing:** 480px max-width gives room for category
  group headers without crowding labels. `max-height: 80vh` plus
  scrollable inner `.picker-list` ensures the modal fits one-handed
  phone use (per design brief). Modal-btns footer never scrolls
  with content — always reachable.
- **Touch targets:** every interactive surface ≥44×44 (existing
  `.chip` min-height 44, `.picker-row` min-height 44, `.chip-x` uses
  negative-margin trick for 44px hit area without 44px visual). One-
  handed reachability tested mentally against typical 6.1" phone.
- **No misplaced boxes:** modal centers via existing
  `.modal-overlay { display:flex; align-items:center; justify-content:center; }`.
  No absolute positioning introduced. No z-index conflicts (existing
  modal stack is `z-index:100`; we reuse).
- **No hanging crosses:** the chip × is structurally a child button
  with an aria-label, not a floating glyph. Visually centered in a
  28×28 visual with a 44×44 hit area extending into the chip
  padding via negative margin. On hover, `--surface-lav` background
  fills the hit area so the user sees the click target before
  pressing.

### 7.5 Typography

- **Headings (`<h3>` in modal):** Fraunces serif via existing
  `.modal h3` rule at `styles.css:1873`. No override needed.
- **Body text (chip labels, picker rows, form labels):** Nunito sans
  via inheritance from `body`. No override needed.
- **Category group headers:** Nunito uppercase tracking-wide
  (`--ls-wide`), `--fs-xs` — matches the visual weight of section
  labels elsewhere in the app (e.g., settings panes).

### 7.6 HR-by-HR audit

| HR | Compliance | Evidence |
|---|---|---|
| HR-1 No emojis, all icons via zi() | ✓ | `zi-link`, `zi-close` (added §7.1), `zi-check`, `zi-sprout` only |
| HR-2 No inline styles, tokens only | ✓ | All new CSS in `styles.css`; every value uses `var(--*)` (audited above) |
| HR-3 No inline handlers | ✓ | Every interactive element uses `data-action` |
| HR-4 escHtml/escAttr at all render boundaries | ✓ | Every text-context `m.text` interpolation uses `escHtml` (`.chip-label`, `.picker-row-label`); every attribute-context `m.text` interpolation uses `escAttr` (`aria-label` on chip ×). `m.id` is attribute-safe by construction (slug or UUID — both ASCII). v3 fix per audit v2 finding §7.3. |
| HR-5 Spacing/font/radius via tokens | ✓ | All `--sp-*`, `--fs-*`, `--r-*`, `--lh-*` tokens; no raw px except hit-area sizing (44px is WCAG-mandated) |
| HR-6 data-action delegation | ✓ | Five new actions registered in central dispatcher (§4); zero inline `onclick` |
| HR-7 zi() returns SVG via innerHTML | ✓ | All icons use `<svg class="zi"><use href="#zi-..."/></svg>` |
| HR-8 Stub features → showQLToast | n/a | Nothing stubbed in this PR |
| HR-9 Post-build multi-round QA | ✓ | Cipher v1 done; Cipher v2 re-run after this revision; Maren+Kael Governor pass available pre-merge |
| HR-10 No text-overflow ellipsis | ✓ | `word-break: break-word` on chip labels and picker labels; no `text-overflow: ellipsis` anywhere |
| HR-11 Math.floor for currency | n/a | No currency display |
| HR-12 Timezone-safe date construction | n/a | No new date construction |

### 7.7 Visual sanity checklist

The pre-build visual checklist Lyra runs before opening the PR:

- [ ] Tag a milestone button is left-aligned to form, doesn't span full width
- [ ] Chips wrap below the button, never overflow horizontally
- [ ] Long milestone text wraps inside the chip, doesn't push the × off
- [ ] × hit area extends past the visible × (hover reveals lavender circle)
- [ ] Picker modal centers on screen, scrolls internally, never page-scrolls
- [ ] Empty milestone state shows zi-sprout icon + warm copy, not a flat empty box
- [ ] Category headers (uppercase, tracked) read as quiet labels, not loud
- [ ] Checked check is filled lavender; unchecked is white with lavender border
- [ ] Modal-btns row stays at bottom; Cancel/Done never scroll out of view
- [ ] **Done button uses `btn-lav`** (lavender domain — milestones); Cancel uses `btn-ghost`. (v3: rose→lavender to keep §7.2 color-domain claim consistent; audit v2 blocker §7.2/§7.3.)
- [ ] Color audit: only lavender domain tokens + neutrals (text/mid/light/card-bg) appear in any new style rule
- [ ] No emojis, no literal `×` or `+` characters, no inline `style=` attributes anywhere in the new markup
- [ ] DevTools "Inspect" on every new element shows resolved sizes that come from tokens (not raw px)
- [ ] **Focus-visible:** Tab through every interactive element (Tag-a-milestone button, picker-row buttons, Cancel, Done, chip × buttons). Each shows the global rose 2px outline (`styles.css:152`). No element has its outline suppressed. Lavender chip × hover background does NOT compete with the focus ring.
- [ ] **Keyboard navigation:** Space/Enter on a focused picker-row toggles the check; **Tab moves between rows** (NOT arrow keys — browser default for sibling `<button>` is Tab-only; v4 incorrectly claimed arrow-key support); Escape closes the modal; Tab from Done wraps back to Cancel (focus trap optional but ideal). (Maren v4 audit correction.)
- [ ] **Screen reader (mobile VoiceOver / TalkBack):** picker rows announce as "Rolling, checkbox, checked" / "Sitting, checkbox, not checked"; chip × announces as "Remove Rolling tag, button"; modal title reads on open.
- [ ] **iOS VoiceOver real-device test:** the `role="checkbox"` on `<button>` pattern is the codebase's first use; iOS sometimes appends "double-tap to activate" mid-announcement. Test on a real iPhone before ship — not just simulator. (Maren v4 audit MAJOR.)
- [ ] **Orphan-tag toast surfaces on edit-load:** create a memory tagged with a custom milestone, delete the milestone on the same device, edit the memory → toast reads "1 milestone tag removed — milestone no longer exists". Toast text is informational, not alarming. (Maren v4 audit MAJOR §4 wiring.)
- [ ] **Attribute escape audit:** every interpolation in an attribute context (`aria-label`, `data-arg` with arbitrary text) uses `escAttr`, not `escHtml`. Test: rename a custom milestone to `Said "mama"`, tag a memory, inspect chip × `aria-label` attribute — must read `Remove Said &quot;mama&quot; tag` (not `Remove Said "mama" tag`).
- [ ] **Entity-reference escape (v6 MAJOR positive verification, Aurelius polish item 3):** rename a custom milestone to `&mama;`, tag a memory, inspect the chip. Visible `.chip-label` body must render the literal string `&mama;` (DOM text node, not an entity). Chip × `aria-label` attribute must read `Remove &amp;mama; tag` in the inspector and announce as "Remove and mama semicolon tag" (or equivalent literal) in VoiceOver — never as "Remove mama tag". Confirms `escHtml` runs before `escAttr` on both surfaces; positively verifies the v6 §4 double-wrap fix (not just the regression boundary).
- [ ] **No keyboard trap when picker has 0 milestones:** picker-empty state still allows Tab to reach Cancel/Done.
- [ ] **Disabled state (Tag-a-milestone with no milestones existing):** button stays active so the user can still open the picker and see the empty-state guidance — no premature disable.
- [ ] **Reduced motion (v6 Maren MAJOR):** confirmed `styles.css:3902` `@media (prefers-reduced-motion: reduce)` global block zeroes all `--ease-fast` transitions on the new `.chip-x`, `.picker-row-check`, and `.picker-row` rules. Test: Settings → Accessibility → Reduce Motion ON → no transition flash on chip × hover, picker-row hover, or check toggle.
- [ ] **Confirm-time orphan toast (v6 Maren MAJOR):** open the picker, while the picker is open delete the milestone via another window/device, hit Done — a toast fires reading "1 milestone tag removed — milestone no longer exists". Closes the two-stage misleading-UX gap where v5 only fired on edit-load.

## Out of scope (explicitly)

- Detail modal for milestones, "Memories" tab rendering, polaroid CSS — PR-ε.1.
- AI-powered milestone suggestion.
- Cross-device dedup of two custom milestones with identical text on
  same race window — pre-existing edge case; v2 dedup fix mitigates the
  data-loss consequence (links survive) but doesn't prevent the brief
  cross-device duplicate visibility.
- The `milestones = load(...) || DEFAULT_MILESTONES` reference-leak bug
  at `core.js:752`.
- Pre-existing inline-style debt in `template.html` scrapbook form
  (HR-2 violation predates this PR; not ours to repay).
- **Modal a11y uplift (v6 Maren v5 audit MAJOR — deferred):** the picker
  modal lacks `role="dialog"` / `aria-modal="true"` /
  `aria-labelledby` pointing at the `<h3>Tag milestones</h3>` title.
  This is a **pre-existing pattern gap** across all SproutLab modals
  (`growthModal`, `vaccModal`, `milestoneModal` in `template.html`
  lines 2704–2857 — none use `role="dialog"`). PR-ε.0 inherits the
  pattern intentionally to avoid creating a per-modal a11y
  inconsistency. **Tracked as issue #54** (filed v6.1 per Aurelius
  polish item 4 — forward-pointer durability) — repo-wide modal a11y
  uplift in one pass. Until then, screen-reader users get focus
  context but no explicit dialog announcement on open — degraded but
  not broken.
- **`addMilestone()` missing-save bug** at `home.js:1905–1914` — the
  function pushes to global `milestones` but does NOT call
  `save(KEYS.milestones, milestones)`. Relies on subsequent render
  or autosave. PR-ε.0 adds `id: genId()` to the pushed entry but
  does NOT fix the missing save. Risk: a parent who adds a
  milestone, immediately tags a memory with it, and kills the tab
  before any other save fires would lose the milestone but leave
  an orphan id on the memory. PR-ε.0's orphan-tolerance (silent
  filter on read + Maren's edit-load toast) handles the consequence
  gracefully. **Followup register entry (Maren v4 audit MINOR):**
  open a separate ticket to add the missing `save()` call.

## Verification (v2 — expanded)

1. **Cold-start migration:** clear localStorage, load → milestones gain
   slug IDs, scrapbook empty, no errors. Reload → no double-write
   (idempotency).
2. **Existing-data migration:** populated localStorage → all records
   gain `id`. Spot-check shape.
3. **Edit/delete by id:** edit pre-fills, save updates same entry,
   delete removes only that entry.
4. **Milestone picker:** tap "+ Tag a milestone" → modal opens grouped
   by category. Select two → chips appear. Save → reload → chips
   persist on edit. Remove a chip → re-save → reload → gone.
5. **Per-entry sync:** two browsers same household — add on A appears
   on B within ~3s.
6. **No regressions:** milestone list still renders, status-override
   and delete still work, existing scrapbook list visually unchanged.
7. **Schema sanity:** scrapbook entry shape `{id, photo, title, desc,
   date, ts, milestoneIds}` (always-present array). Milestone has
   `{id, text, ...}`.
8. **XSS safety:** rename a custom milestone to
   `<img src=x onerror=alert(1)>`. Tag a memory. **Both** chip render
   AND picker list render literal text; no script executes. (HR-4.)
9. **Picker cancel discards:** tag two milestones, save. Edit, open
   picker, modify selection, **Cancel** → reopen → matches saved.
10. **Picker back-button discards:** open picker, toggle 3 milestones,
    press browser back → picker closes. **Reopen** → the toggled
    milestones are gone (working set was reseeded from pending on
    open). (Audit major #8.)
11. **Orphan-link tolerance (render):** tag with custom milestone,
    delete the milestone. Open memory edit → no chip, no error.
12. **Orphan-link tolerance (persist):** tag with custom milestone,
    delete the milestone, then save the memory again (e.g. edit
    title). Reload → `milestoneIds` does NOT contain the deleted
    milestone's id. (Audit major #13.)
13. **Member device first sync:** A admin has 5 memories pre-PR-ε.0;
    B member has 3 different. After both update, both see 8. **No
    data loss either side.** (Audit blocker #4 — validates §6.2
    reconcile.)
14. **Per-entry doc identity:** Firestore console shows each scrapbook
    doc uses `entry.id` as docId.
15. **In-memory rehydrate (audit blocker #1):** with browser session A
    open, add a memory on session B → A's UI updates within ~3s.
    Then on A, **edit an unrelated entry** → only that edit
    propagates to B. The B-originating entry does NOT get re-emitted
    or duplicated. (Validates `_syncSetGlobal` rehydrate.)
16. **Render-side save removed (audit blocker #2):** with sync wired,
    open the history tab and let `renderScrapbook` fire on tab
    activation. Inspect DevTools network → no Firestore writes from
    the tab activation alone. Writes only fire on actual mutations
    (add/edit/delete).
17. **Milestone dedup ID preservation (audit blocker #3):** create a
    custom milestone "Tummy time" on device A (id=UUID-A) and tag a
    memory with it; create the same-text milestone on device B
    independently (id=UUID-B). Sync. Survivor id is the lex-smaller
    of the two. The memory's `milestoneIds` array now points at the
    survivor — not orphaned. (Validates §6.3.)
17a. **Reconcile circuit-breaker bail preserves data (audit v3
    §6.2):** in DevTools, set `_syncWriteCount = CIRCUIT_BREAKER_LIMIT - 1`,
    then trigger reconcile with 5 orphan locals. The warn log fires;
    no Firestore writes happen for the orphans; **the 5 locals
    survive in localStorage and `window.scrapbook`** (inspect both).
    Then trigger a sync re-attach (toggle offline→online, or
    re-login) → `_reconcileDone` clears, breaker resets, the next
    snapshot fire pushes the 5 orphans. No data loss across the
    full cycle.
17b. **Migrate-before-dedup loop termination (audit v3 §6.3):**
    populate localStorage with a milestone missing `id`, push it
    via single-doc sync to a peer device. Verify peer's
    `_postReceiveMilestones` runs `migrateMilestoneIds()` (writes
    once, single-doc sync fires once back), then on the round-trip
    the originating device's `migrateMilestoneIds()` is a no-op
    (entries already have ids). One round-trip per legacy entry,
    then convergence — no infinite write storm.
18. **HR compliance:** no inline styles in any new markup (HR-2);
    `data-action` only, no inline handlers (HR-3); `escHtml` on every
    user-text interpolation (HR-4); zi() icons, no emojis (HR-1).
19. **Build verification:** `bash build.sh > sproutlab.html` produces
    a clean concat with no errors; `index.html` and `sproutlab.html`
    sync; smoke test the built artifact.

## Implementation order (v6 — 26 steps in 6 phases)

> **Line-number drift reminder (Kael v4 audit MINOR):** every phase
> below cites specific line numbers from the codebase as it stood
> at audit time (sproutlab default branch SHA
> `a64b80d41f900e70cc36bde7b60169802a1f5c0c`). Insertions in
> earlier phases will shift later line numbers by ±1–10. **Before
> starting each phase, re-grep the target files** to find the
> current line for the cited symbol/function — do NOT trust a
> phase-N step's line number after phase-N-1 has already inserted
> content into the same file. Specific high-risk shifts: §6.2
> reconcile insertion in `sync.js` shifts everything below
> `sync.js:1290`; §6.3 dedup rewrite in `medical.js` shifts the
> `_postReceiveMilestones` line numbers cited in step 5(b). Use
> grep, not memorized line numbers.
>
> **Doc drift footnote (Kael v4 audit):** actual `sync.js` is 2055
> lines, but `CLAUDE.md` still says 1052. Separate cleanup PR;
> not blocking this one — just don't trust the CLAUDE.md count.

### Phase A — Primitives & helpers (no behavior change)

1a. **§0a slugify in `config.js`** (Cipher v6 BLOCKER fix; was
    incorrectly listed under core.js in v5). `config.js` is the FIRST
    concatenated file, so `slugify` is in scope when `data.js` parses
    `DEFAULT_MILESTONES` and bakes slug ids inline. Use the empty-text
    `Math.random` fallback per §0a — `genId` does NOT exist at
    `config.js` scope.
1b. **§0b genId in `core.js`** next to `escHtml`/`escAttr`. Runtime-only
    (called from `home.js:addMilestone` and `core.js:addScrapEntry`),
    safe in core.js. Do NOT call `genId` from `data.js` parse-time
    contexts.
2. **§7.1 sprite:** add `<symbol id="zi-close">` to `template.html`
   sprite block (X path, currentColor, 2px stroke, matches existing
   icon weight).
3. **§7.3 styles:** add the three CSS blocks (chip-milestone,
   scrap-form-row, picker-modal) to `styles.css` near existing
   chip/modal sections. **No new color/spacing/font/radius primitives**
   — only existing tokens.

### Phase B — Schema & migrations

4. **§1 defaults:** bake `id` slug into DEFAULT_MILESTONES (`data.js`);
   add slug-uniqueness assert.
5. **§1 migration:** `migrateMilestoneIds()` + precise call sites:
   (a) between milestone sanitize and first render
   (`core.js:752–800`); (b) **single-line insertion into
   `_postReceiveMilestones` (`medical.js:145–157`) — placed AFTER
   the existing per-entry status-migrate forEach and BEFORE the
   existing `dedupeMilestonesByText()` call**. Do not rewrite the
   function; just thread one line in at the right point. (Audit v3
   §6.3 — see §6.3 "Migrate-before-dedup integration" for the exact
   line and `typeof === 'function'` guard rationale.)
6. **§2 migration:** `migrateScrapbookIds()` + precise call site
   (between scrapbook sanitize and first render).
7. **§1 home.js:** `addMilestone()` assigns `id: genId()`
   (`home.js:1905–1914`).

### Phase C — Identity refactor (scrapbook from index → id)

8. **§2 rename:** `_scrapEditIdx` → `_scrapEditId` (string) everywhere.
9. **§2 dispatcher:** drop `parseInt(arg)` from scrap action handlers
   (`core.js:375–456`); route id strings through.
10. **§2 entry render:** `data-arg="${e.id}"` on **all three** action
    buttons at `core.js:2135` (`openScrapPhoto`), `2144`
    (`editScrapEntry`), `2145` (`deleteScrapEntry`). v4 missed 2135
    — Kael v4 audit MAJOR. Then harmonize `home.js:6532+`
    (`renderScrapbookHistory`) — currently uses
    `origIdx = scrapbook.indexOf(entry)` for `data-arg`; rewrite to
    `entry.id` (real work, not no-op).
11. **§2 lookups:** `addScrapEntry`/`editScrapEntry`/`deleteScrapEntry`/
    `openScrapPhoto` use `scrapbook.find(e => e.id === id)` /
    `findIndex`. **Delete the `_scrapEditIdx > i` shift** in
    `deleteScrapEntry` (audit major #7).
12. **Render-side save removal:** strip
    `save(KEYS.scrapbook, scrapbook)` from `renderScrapbook()`
    (`core.js:2113`). Add explicit `save(...)` to mutation branches
    in `addScrapEntry` (both new and edit) and `deleteScrapEntry`
    (audit blocker #2 + major #10).

### Phase D — Sync layer integration (audit blockers 1, 3, 4)

13. **§6.3 dedup fix:** modify `dedupeMilestonesByText`
    (`medical.js:170+`) **in place** — keep the no-arg / mutate-
    global / boolean-return signature so the 3 existing call sites
    (`core.js:849`, `medical.js:154`, `medical.js:231`) need no
    change. Behavioral deltas: (i) survivor is the lex-smaller
    `id` (deterministic across devices), (ii) build the
    `idRewrite` map and call new sibling helper
    `rewriteScrapbookMilestoneIds(idRewrite)` as a side effect
    before return. Existing field-merge code (`medical.js:191–217`)
    runs unchanged — leave inline or extract under
    `_mergeMilestoneFieldsInline`, implementer's choice. **Grep
    guard:** `grep -n 'dedupeMilestonesByText(' split/` must show
    only the 3 expected call sites, all no-arg.
14. **§6.1 rehydrate:** add `'scrapbook'` case to `_syncSetGlobal`
    AND `_syncGetGlobal` (`sync.js:238–275`).
15. **§6.2 reconcile:** declare module-scope `_reconcileDone = new Set()`
    near `sync.js:14–20`. Reset it at the top of
    `_syncAttachListeners` (`sync.js:1123`) so offline→online and
    auth-state changes re-open the gate. Add orphan-locals push
    pass to `_syncHandlePerEntrySnapshot` (`sync.js:1188–1320`):
    construct `colRef` via the household ref pattern, stamp the
    full sync metadata trio (`__sync_createdBy/updatedBy/syncedAt`),
    integrate with `_syncWriteCount`/`CIRCUIT_BREAKER_LIMIT`. **On
    breaker bail:** skip the remote `set()` calls but still concat
    orphans into `entries` so they survive the local
    `save(lsKey, entries)`; do NOT add to `_reconcileDone` so the
    next re-attach retries. Full code in §6.2.
16. **§3 SYNC registration (atomic):** in a single commit, add BOTH
    `SYNC_KEYS[KEYS.scrapbook] = { collection: 'scrapbook', model: 'per-entry' }`
    (`sync.js:120`) AND `SYNC_RENDER_DEPS[KEYS.scrapbook] = { global: 'scrapbook',
    renderers: { 'history': ['renderScrapbook', 'renderScrapbookHistory'] } }`
    (`sync.js:201`). **Must commit atomically:** if SYNC_KEYS lands
    without SYNC_RENDER_DEPS, the listener fires, `_syncDispatchRender`
    gets `undefined` for `dep`, and the in-memory global stays stale
    on every remote change — same defect as audit blocker #1 in
    transient form. (Audit v2 finding cross-cutting.)

### Phase E — UI surface (chips + picker)

17. **§4 form markup:** chips region between `#scrapTitle` and
    `#scrapDate` in `template.html`. CSS classes only (HR-2).
    Uses `zi-link` icon (HR-1, HR-7). `data-action` (HR-3, HR-6).
18. **§4 modal markup:** `#scrapMilestonePickerModal` at end of
    `template.html` modal section. Pattern matches existing
    `.modal-overlay > .modal > .modal-btns`. **Done button uses
    `btn-lav` (lavender domain), not `btn-rose`** (audit v2 §7.2).
19. **§4 state globals:** `_scrapMilestoneIdsPending: string[]`,
    `_scrapPickerWorkingSet: Set<string>`.
20. **§4 renderers:** `renderScrapMilestoneChips()` and
    `renderScrapMilestonePickerList()`. **`escHtml()` for text
    contexts; `escAttr()` for attribute contexts** (chip × `aria-label`).
    Picker rows are `<button role="checkbox" aria-checked="...">` for
    keyboard a11y (audit v2 §7).
21. **§4 dispatcher:** add five `else if` branches —
    `openScrapMilestonePicker` (always-reseed working set),
    `toggleScrapPickerMilestone`, `confirmScrapMilestonePicker`
    (orphan-filter), `cancelScrapMilestonePicker`,
    `removeScrapMilestone`.
22. **§4 wiring:** `addScrapEntry` persists
    `milestoneIds: [...pending]` always (never omit). `editScrapEntry`
    seeds pending from `entry.milestoneIds || []`. `clearScrapPhoto`
    resets pending = `[]` and working set = `new Set()`.

### Phase F — Verification & ship

23. **HR + visual audit:** walk §7.6 HR table and §7.7 visual checklist
    against the running app. Every box ticked, including the v3
    additions (focus-visible, keyboard nav, screen reader, attribute
    escape audit, no keyboard trap, disabled-state).
24. **Build & verify:** `cd split/ && bash build.sh > sproutlab.html`;
    `cp sproutlab.html ../index.html && cp sproutlab.html ../sproutlab.html`.
    Run all 19 verification steps (§"Verification") on the built artifact.
25. **HR-9 multi-round QA** (per CLAUDE.md QA chain):
    - **Maren** (Governor of Care) audits `home.js`, `medical.js`
      touches — concerned with whether parents can act on wrong data,
      whether the link UX is parent-safe.
    - **Kael** (Governor of Intelligence) audits `core.js`, `sync.js`,
      `data.js` touches — concerned with sync correctness, ISL
      boundaries, schema coherence.
    - **Both Maren AND Kael** dual-audit shared modules `template.html`
      and `styles.css` (per CLAUDE.md QA chain step 3).
    - **Lyra** synthesizes both Governor reports, applies fixes.
    - **Cipher** runs final cross-cutting Edict V pass on the diff
      (HR compliance, integration across both Governor jurisdictions).
    - Do NOT short-circuit the order (canon-cc-008).

(Steps 1–3 are visual primitives that block markup; running them first
keeps every later commit visually correct. Phase B–D can be merged
incrementally if behavior preserves; Phase E lights up the user-visible
surface only after the data layer is solid. Step 16 is the only
non-decomposable step — SYNC_KEYS and SYNC_RENDER_DEPS must commit
together to avoid a transient stale-global window. Step 24 is
non-negotiable per CLAUDE.md — never edit `sproutlab.html` directly;
always rebuild via `bash build.sh`.)
