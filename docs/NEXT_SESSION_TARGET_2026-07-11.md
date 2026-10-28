# Next-Session Target — set 2026-07-11

*The standing pointer. If priorities shift between sessions, amend **this** file, not the handoff.*

## The recommended next move
**Begin Phase 1 — Foundations.** Build the **two-layer benchmark first** (it makes every later phase measurable), then the **chart rework + Chart.js vendoring** (closes the ASI04 supply-chain cell *and* delivers the visible polish the north-star/market direction needs). Rationale: cheap confidence bought before the expensive builds; the benchmark is the instrument that scores everything after it. (Architect chose Foundations as the lead block; Borders held.)

## Priority ladder (each startable cold)
- **P0 — Two-layer benchmark.** Objective gate (`split/audit-benchmark.sh` wired into `build.sh` beside the other ship-gates: cold-start budget, bundle ceiling, a11y via Playwright+axe, HR-gate rollup, e2e pass-rate) **+** advisory Governor rubric (`docs/SPROUTLAB_SCORECARD.md`: warmth / half-awake comprehension / data-safety / intelligence-correctness, scored per ship). Codifies the Architect's ad-hoc "3.5/10" instinct into a repeatable ship-time score. Gate: tooling (Public Works) + a `tests/e2e/*.spec.ts`.
- **P1 — Chart rework + vendor Chart.js.** Vendor Chart.js locally (closes ASI04: unpinned/no-SRI CDN → local bundle, faster cold-start) + Vela's smoothness doctrine (comprehension-motion, the delay-cost test — animate context not the number, `prefers-reduced-motion` non-negotiable). Gate: shared modules → **quad-Governor** (Maren → Ceres → Kael → Vela).
- **P2 — Evolving-thesis groundwork.** AoA engine upgrade (first-emergence **date** as a first-class milestone field + norm-anchored adaptive re-prompt; grounded in `docs/references/2022_kleineWeltentdecker…`) → **i18n framework** (foundation for Hindi; the app has none today).
- **P3 — The content surface (blog).** Milestone-contextual content (reuse `/doc-render`), pediatrician-verified badge, English → Hindi (after i18n). Human deps: a named pediatrician + a content cadence — the bottleneck is editorial, not engineering.

## Carry-forward register (grouped)

**Human-only / Architect gates**
- **Codex structured-records snippet** — pending Architect nod on canon IDs (Orinth proposed `canon-philo-001` north-star, `canon-cc-035` compass; + 1 Doctrine, 1 Chronicle, Book X as apocrypha `foretold`).
- **Book X "The Borders"** — HELD; do **not** draft the charter unbidden.
- **Drone** — FPV direction locked pending the Architect's FPV-vs-GPS cross-check (record: `Codex/docs/decisions/2026-07-11_DRONE_DIRECTION_BUILD_FPV.md`).

**Successors (in-flight next phases)**
- Phase 1 → Phase 4 (Borders ratification + RED fixes) when unheld and market-readiness nears.
- Existing product roadmap: **F-6b** voice-to-text (on-device Web Speech spike; iOS-standalone-PWA is the named risk), **F-4** Patterns sub-tab, **F-5** `parseFeeding` completion (`derivedAllergens`/`derivedFatBearing`, TSF legacy-reader retirement).

**Test / data debt**
- Benchmark is **greenfield** — no perf/lighthouse/benchmark infra exists in either repo (P0 above builds it).

**Housekeeping**
- **F-6a (#253)** never received its own session-close — do it **with context**, not blindly.
- PR-dashboard curation batch due ~**#259** (append #250–#255 records to `docs/pr-dashboard-data.json`).

**Candidate Codex-canon**
- `compass-vs-north-star` (structural rule) · `north-star-amendable-between-sessions-by-ratified-decision` (doctrine).
- **Codex canon-reconciliation:** Cipher + Chronicler compass bearings authored on SproutLab Province mirrors → reconcile to Codex canonical bodies (canon-cc-026).

*— Lyra. The pointer stands: measure first, then polish.*
