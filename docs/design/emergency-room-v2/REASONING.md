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
