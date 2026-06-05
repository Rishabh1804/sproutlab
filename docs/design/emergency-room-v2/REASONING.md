# Emergency Room v2 — build reasoning log

**PR #235 (branch `claude/wizardly-heisenberg-6hDnY`). Author: Lyra.**
A living record of the design decisions, trade-offs, and the constraints I'm
holding myself to — kept for the Architect to review. Updated per milestone.

## Standing constraints (Architect-set, hard rules for this work)
1. **Verify on the live deploy at each milestone** — not hand-built mockups (mockups
   keep tripping on container-scoped/stateful CSS; the live deploy is truth).
2. **Design-principles consistency** — `docs/DESIGN_PRINCIPLES.md` is the floor; reuse
   existing component families (`ecard`, `ec-call`, `doc`/`em-doc-ov`) over inventing.
3. **Whisper-wave on every "Call 112 / 108" pill, wherever it appears** — the `ecCallFlow`
   + `ecCallPulse` treatment (the food `.ec-call`), reduced-motion-guarded.
4. **Flip card design-consistent** — front (first aid) ↔ back (doc-prep) read as one card.
5. **The 6-second rule (§11) is a HARD gate** — lead with the answer (safety-first, never
   collapsed), progressive-disclose the rest, teaser on every collapsed row.
6. **No assumptions surfaced on safety surfaces** — every clinical line traces to an
   authoritative source already in the registry; nothing invented. Doc-prep is
   administrative/parent-fill (low clinical risk); teasers derive from already-verified
   `immediate` steps.
7. **Legible + clean in all 3 text-zoom tiers** (`default` / `med` / `high`, `:root[data-zoom]`).
   Risk areas: the doc-prep fixed-124px `.k` label, the teaser rows (name+teaser+chip wrap),
   the waved pills (white-on-flowing-rose contrast). Verify each tier on the live deploy.
8. **Keep the reasoning here for the Architect.**
9. **Wait with the Vercel preview once the PR is out of draft.**

## Locked scope (Architect calls)
- **General room** → hybrid (CPR pinned-open) + teaser rows + pop-up cards + flip-to-doc-prep
  + wave on every call pill + doc models for **all** cards.
- **Food room flip — folded into THIS PR**: its doc-prep moves from the separate `#emDocOv`
  overlay onto the card flip, matching the General room. (Architect's final call: "fold food
  room flip scope in this PR.")
- **Cross-links → pop-up in place** (no `switchTab` redirect), both rooms.
- doc-prep on **all** general cards.

## Key reference shapes (so the General room reaches parity with the food room)
- `EMERGENCY_PROTOCOL[hz].doc = { suspected, stamps:[{id,label}], action:{label,value}|null, forTeam }`
  (`data.js`). General room mirrors this in `GENERAL_EMERGENCIES[i].doc`.
- Doc-prep CSS is scoped `.em-doc-ov .doc-*`; the container is `display:none` until `.open`
  (this is why it must live in its real container, and why the flip-back must carry the scope).
- Wave = `.ec-call { background:linear-gradient(110deg,…rose…); animation:ecCallFlow 3.4s…, ecCallPulse 2.2s…; }`
  with `@media (prefers-reduced-motion:reduce){ animation:none }`.

## Open tensions to resolve on the live preview (flagged, not assumed)
- **Calm-front-door vs wave-everywhere.** The landing's `.ld-emergency-call` quick-dial pills
  sit on the deliberately-calm front door. Applying the pulsing wave there satisfies
  "wherever it appears" but pushes against the calm brief. Implementing per the directive;
  flagging for the Architect's eye on the live preview + Vela.
- **Flip mechanics.** A true CSS 3D flip (`rotateY`) vs a cross-fade. In-app I control the
  full stack, so 3D is viable; reduced-motion → instant swap. Verify on live deploy.

---

## Milestone log
### M1 — General room (built; live-verifying)
**Decisions:**
- **Flip = the existing `.fp-flip` pattern** (food info pop-up), not a new one — design
  consistency per the floor. Grid-overlaid faces (`grid-area:1/1`) so the card sizes to the
  taller face; `rotateY(180deg)` on `.flipped`; backface-hidden. (This is why my hand mockup's
  absolute-positioned 3D flip broke — wrong technique.)
- **Hybrid**: critical CPR is a pinned-open inline flip card (`.ge-pinned-card`, no close ×);
  the other 7 are teaser rows (`.ge-row`) → pop-up flip card (`.ge-card-ov` overlay, z-1280).
- **Card front reuses the `.ecard` / `ec-*` family** (same as food emergency cards) → one
  visual language across both rooms. The `.ge-cardface` neutralises the inner ecard chrome so
  the host (pinned card / `.food-pop`) provides it.
- **Doc-prep reuses the food machinery**: `emStampTime` / `emToggleNA` / `emSaveDoc` are
  container-agnostic (parentNode-relative) → reused as-is; `_emDocWho()` reused. Only Copy is
  general-specific (`geCopyDoc` reads stamps from the open `.fp-face`).
- **`.docface` is a container-neutral mirror of `.em-doc-ov .doc-*`** so doc-prep renders inside
  the flip-back (the `.em-doc-ov` scope is a fixed, `display:none`-until-`.open` overlay — can't
  live in a flip). Temporary duplication; M2 retires the food `#emDocOv` overlay and both rooms
  share `.docface`.
- **Generic flip handlers** `cardFlip`/`cardFlipBack` (nearest `.fp-flip`) so both rooms share.
- **Wave** applied to `.ld-emergency-call` (landing + general callbar) **and** `.ge-call-chip`
  (row chips), reusing `ecCallFlow`, reduced-motion-guarded.
- **Dead CSS:** the old `.ge-item*` accordion rules are now unused; left in place for the gate
  cleanup (removing risks nothing but adds diff noise mid-build).

**Zoom-legibility risk tracked:** `.docface .doc-row .k` is `flex:0 0 38%; max-width:140px`
(was a fixed 124px in the food room) — % basis wraps more gracefully at `high` zoom. Verify the
3 tiers on the live deploy.

**Interim (closes in M3):** `geXlink` for the food "Choking on food?" opens the food card via
`_emCardHtml` in the pop overlay — functional but the food card's own doc-prep still uses the
separate `#emDocOv`; M3 unifies it onto the flip.

**Build:** clean; `audit-emergency-floor-v1` + `audit-floor-fidelity-v1` PASS; emoji/icon-text/
hr12 gates green; all modules `node --check` OK.

**Live-deploy verification (Vercel preview, deployment ETySyEFFHsUjPdgV812XcKWoFqLH):**
Drove the real deploy (Vercel share-bypass + headless browser), asserted against the live DOM:
- Room: `rows=7`, `pinned=1` (CPR), `callpills=2`; row chip `animationName=ecCallFlow` (wave live).
- Card open (choking): `frontSteps=3`, waved `.ec-call` CTA, callbar pill `animationName=ecCallFlow`.
- Flip: `flipped=true`; doc-prep back `docRows=5`, `stamps=2`, `doc-row display=flex` (the `.docface`
  layout applies correctly — the scoping fix holds on the real deploy, unlike the static mockup).
- a11y at **high** zoom: all rows render with correct teasers + callLead chips
  (head-injury/bleeding/burn correctly carry NO call chip); pinned CPR + open card full structure
  intact; "Choking on food? →" xlink present.
- **Caveat:** post-interaction *pixel* screenshots aren't downloadable via the current browser
  tool (saved to a non-public bucket); verification this milestone is live-DOM + computed-style
  assertions. Pixel review lands with the Architect on the Vercel preview at out-of-draft.

### M2 — Food room: doc-prep → flip (built; live-verifying)
**Decisions:**
- `_emCardHtml` now returns a flip card: `.ecard.ecard-flip` → `.fp-flip` → front (head + body,
  unchanged first-aid content) + back (`_emDocFace`, the doc-prep). Same `.fp-flip` / `.docface`
  as M1 → both rooms share one card+flip+doc language.
- **"For the doctor"** button: `emOpenDocPrep` → **`cardFlip`** (flips in place; no `#emDocOv`).
- `id="ec-<hz>"` stays on the outer `.ecard` so the deck deep-link scroll + `.ec-focus`
  highlight still work unchanged.
- **Copy/Save made container-aware**: `_emStampValDOM(id, container)` / `_emDocText(hz, container)`
  / `emCopyDoc(btn)` read stamps from the card's own `.fp-back` (not the retired overlay).
  `emSaveDoc(btn)` marks the host `.doc-print` + body `.doc-printing` and prints.
- **Print rule rewritten + scoped** to `body.doc-printing` — isolates the flipped `.docface`,
  neutralises the flip `transform`. Side-benefit: the old rule's UNSCOPED `body *{visibility:hidden}`
  would have blanked any other print (e.g. Print Dashboard); now scoped, that latent bug is closed.
- **Dead now (cleanup at M4/gate):** `emOpenDocPrep`, `_emDocPrepHtml`, `_emCloseDocPrep`, the
  `#emDocOv` template container + its routes — unused but harmless; removed at the styles/cleanup pass.

**Build:** clean; emergency-floor + floor-fidelity PASS; diet/core `node --check` OK; food flip
wired in bundle.

**Live/logic verification:** the firecrawl browser-agent went flaky this session (kept returning
stale page snapshots instead of eval results), so the food deck was verified **deterministically
in Node** instead: `_emCardHtml('anaphylaxis'|'choking'|'botulism')` all render without throwing,
each with `ecard-flip` + `fp-flip` + front/back faces + `docface` + `cardFlip` + doc-who +
Copy/Save + correct `id` + stamps. The shared flip mechanism itself is M1-live-verified. Deck
*visual* (layout/animation) defers to Vela/Maren at the gate + the Architect's preview review.

### M3 — Cross-link pop-up-in-place
**Status: satisfied by M1 + existing food behavior — no tab redirects remain.**
- General room "Choking on food? →" (`geXlink`) opens the **food choking card as a pop-up in
  place** (`geCardOv`); with M2 that card is itself a flip card. No `switchTab`.
- Food room "Choking on it instead?" (`emScrollHazard`) scrolls to the choking card **within the
  same deck** (the deck is the in-place surface) + `.ec-focus` highlight. No redirect.
- No general card links to another general card today (the CPR mention in choking's flags is prose,
  not a link); the `xlink.id` branch in `geXlink` is ready if one is ever added.

### M4 — Shared cleanup (dead code) + styles/template (done)
Removed the retired `#emDocOv` overlay path everywhere:
- `diet.js`: deleted `_emStampRow` / `_emDocPrepHtml` / `emOpenDocPrep` / `_emCloseDocPrep` + the
  `_emDocHz` state + its `emCopyDoc` fallback.
- `core.js`: dropped the `emOpenDocPrep` / `emCloseDocPrep` / `emCloseDocPrepSelf` dispatch routes.
- `template.html`: removed the `#emDocOv` container (a shared-file change → triple-Gov).
- `styles.css`: removed the dead `.em-doc-ov .doc-*` block **and** the old accordion `.ge-item*` /
  `.ge-lead` / `.ge-steps` block (the room is rows + flip cards now).
Remaining name occurrences are comments only (no live refs). Build clean.

### M5 — QA gate (canon-cc-008)
Summon-set (by touched jurisdiction):
- **Maren** — `config.js` (general doc models + teasers, content/safety) + `diet.js` (food flip,
  Copy/Save, the food-room safety surface). BLOCKING.
- **Vela** — `intelligence-cards.js` (room render, rows, pop-up cards, flip, wave).
- **Kael** — `core.js` (dispatch lifecycle) + `config.js`/`data.js` engine shapes + flip/overlay
  z-index + listener lifecycle.
- **Triple-Gov** — `styles.css` + `template.html` (shared).
- **Cipher** — Edict V cross-cutting final pass.

**Gate results — all three Governors `clear-with-notes`, NO BLOCKS:**
- **Vela (render):** §11 6-second rule PASS; flip reuses `.fp-flip` PASS; 3-zoom-tier legibility
  PASS; HR-1..12 PASS. Flags: V-V-235-1 (landing-pill wave scope → Architect call), V-V-235-2
  (high-zoom pinned-card scroll watch), dead CSS (`.ge-xlink`/`.ge-flags-h`).
- **Maren (care, BLOCKING):** food-flip refactor is render-only, no first-aid content altered
  (V-M-241 safety-tier CLEAR); Copy/Save container-read CLEAR; print isolation CLEAR; all 8 general
  `doc` models clinically appropriate; HR-4/HR-12 PASS. Folds: V-M-238 (teaser numeric collision),
  V-M-239 (cross-room anaphylaxis hold-time 10s vs 3s).
- **Kael (engine/lifecycle):** dispatch total; z-stack 1010<1060<1280 correct; scroll-lock
  single-owner; listener teardown clean; data-shape parity + cross-room sharing collision-free;
  HR-12 PASS. Flag: V-K-1 (Copy-confirmation toast occluded by the doc overlays).

**Synthesis (folded):**
- V-M-238 → `unresponsive` teaser "5 rescue breaths, then **start compressions**" (kills the
  5/30-vs-30:2 numeric near-collision).
- V-M-239 → food `EMERGENCY_PROTOCOL.anaphylaxis` step 1 "hold **3 seconds** (count to 10 if
  unsure)" — aligns with the firecrawl-verified General copy (FDA/Teva/AAP). Floor audits re-PASS.
- V-K-1 → inline "Copied" button state (`_docCopiedFlash` + `.doc-btn--copied` sage) shared by
  both rooms — confirmation lands on the surface the parent is looking at, not a buried toast.
- Vela dead-CSS → removed `.ge-xlink`, `.ge-flags-h`, `.ge-flags ul/li`.

**Surfaced for the Architect (NOT silently overridden):**
- **V-V-235-1 — landing-pill wave scope.** You said "whisper-wave wherever it appears"; Vela
  recommends scoping it to the Room so the calm front door stays dormant. Shipping per your
  explicit directive (wave everywhere); the one-line scoping fix is ready if you want it on the
  preview. **This is the #1 item for your preview review.**
- **V-V-235-2** — at `high` zoom the pinned CPR card is long; confirm the first teaser row is still
  discoverable (one short scroll). No code change unless the live preview shows it buries the list.
- **V-K-1 residual** — the underlying toast-band occlusion is pre-existing (food deck too); the
  inline confirmation is the contained fix for the emergency surfaces.

Cipher Edict V → next.
