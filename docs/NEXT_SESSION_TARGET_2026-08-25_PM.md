# Next-Session Target — set 2026-08-25 PM (supersedes 2026-08-25 AM)

*The standing pointer. If priorities shift between sessions, amend **this** file, not the handoff.*

The PM session completed the celebration arc: the invite video shipped in two merged PRs (#259 night keepsake, #260 cartoon/character/daylight rounds), all in `meridian/` — **nothing touched `split/`, so the product ladder from 2026-07-11 still stands unchanged.**

## The recommended next move
**Begin Phase 1 — Foundations: the two-layer benchmark first**, then chart rework + Chart.js vendoring. Rationale unchanged: the benchmark is the instrument that scores everything after it.

**Time-sensitive exception (until 4 September 2026):** party-collateral changes come first if the Architect asks. New this session: the real logistics are now **known** — *Rishi Bhawan · 11:30 AM onwards* (as shipped on the invite) — so the backdrop foot line can be completed the moment the Architect says so (a `PARTY` block edit in `meridian/birthday-one/build-posters.mjs` + rebuild; minutes, outside the Capital).

## Priority ladder (each startable cold — carried from 2026-07-11)
- **P0 — Two-layer benchmark.** Objective gate (`split/audit-benchmark.sh` wired into `build.sh`) **+** advisory Governor rubric (`docs/SPROUTLAB_SCORECARD.md`). Gate: tooling (Public Works) + a `tests/e2e/*.spec.ts`.
- **P1 — Chart rework + vendor Chart.js.** Closes ASI04 (unpinned CDN → local bundle) + Vela's smoothness doctrine. Gate: shared modules → quad-Governor.
- **P2 — Evolving-thesis groundwork.** AoA engine upgrade → i18n framework (foundation for Hindi).
- **P3 — The content surface (blog).** Human deps: named pediatrician + content cadence.

## Carry-forward register (grouped)

**Human-only / Architect gates**
- **Backdrop foot line** — venue/time now known (*Rishi Bhawan · 11:30 AM onwards*); apply to the flex print only on the Architect's word.
- **Family sign-off on the invite video** — the daylight cut (`meridian/first-birthday/ziva-first-birthday-invite.mp4`) is final-as-shipped; any mother-requested tweak (shades, castle, gold) is a small `invite.html` edit + `build-video.sh` rebuild, within Cipher's standing constraint.
- **Codex structured-records snippet** — still pending Architect nod on canon IDs (inherited).
- **Book X "The Borders"** — HELD; do **not** draft the charter unbidden (inherited).
- **Drone** — FPV direction locked pending the Architect's FPV-vs-GPS cross-check (inherited).

**Successors (in-flight next phases)**
- Phase 1 → Phase 4 (Borders ratification + RED fixes) when unheld (inherited).
- Product roadmap: **F-6b** voice-to-text spike, **F-4** Patterns sub-tab, **F-5** `parseFeeding` completion (inherited).

**Test / data debt**
- Benchmark remains greenfield (P0 builds it) (inherited).
- **3 AA-contrast advisories** in the doctor-card PRINT palette (inherited; Maren-primary consult).
- **NEW — e2e unrunnable in the remote container:** pinned `@playwright/test` 1.48 requires `chromium-1140`; the container ships `chromium-1194` only (and 1.48's `--headless=old` launcher is rejected by modern Chromium anyway). All 415 tests enumerate but cannot launch. Options: upgrade `@playwright/test` (quad-Governor-adjacent tooling change, test-suite compat pass required) or provision the pinned browser in the session-start hook. Until then, e2e validation needs a local environment.

**Housekeeping**
- **PR-dashboard curation now spans #250–#261** (incl. #258 artwork, #259 + #260 invite video, and the close PRs). Append to `docs/pr-dashboard-data.json`; `build-safe.sh` keeps warning until done.
- **Stale remote branches:** prune `claude/frozen-theme-invite-video-5lquhd` (both its PRs merged) and this close branch after merge; `claude/ziva-first-birthday-art-ekh100` already pruned.
- **`meridian/` naming:** `birthday-one/` (#258 boards) and `first-birthday/` (#259–#260 video) are siblings — unify naming / add README cross-links in a small docs pass (inherited, now both shipped).
- **`playwright-core`** added to devDependencies for the video pipeline (review round) — no action; noted so the next dependency audit isn't surprised.
- **F-6a (#253)** never received its own session-close — do it with context, not blindly (inherited).

**Candidate Codex-canon**
- `compass-vs-north-star` + `north-star-amendable-between-sessions` (inherited, unratified).
- Codex canon-reconciliation: Cipher + Chronicler compass bearings on SproutLab mirrors → reconcile when Codex is next in scope (inherited, canon-cc-026).
- **The meridian print pipeline** (inherited from AM; pattern record in `meridian/birthday-one/README.md`).
- **NEW — the meridian keepsake-video pipeline** (pattern record in `meridian/first-birthday/README.md`): every visual a pure function of `t` (`window.seek`) in self-contained HTML → Playwright frame-stepping → ffmpeg encode, with numpy-synthesized public-domain audio and hand-mirrored TL↔audio cue timings. Sibling doctrine to the print pipeline; reusable for milestone videos and future keepsakes.
- **NEW — Cipher's IP composite-test doctrine** (four Edict V passes this session): character identity lives in the *composite* of silhouette + palette + motifs, not any single pillar; archetype (public-domain Snow Queen) vs expression (the studio's design); the standing queen constraint (house-idiom face only · teal gown · no snowflake motifs · golden never platinum-white hair). Chronicle entry when Codex is next in scope.

*— Lyra. The pointer stands: measure first, then polish — and the party collateral is one word from print-ready.*
