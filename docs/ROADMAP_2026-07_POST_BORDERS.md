# SproutLab Roadmap — Post-Borders (2026-07-11)

**Status:** proposed v0.1, awaiting Architect priority-set. Supersedes the stale
`SPROUTLAB_ROADMAP.md` (v7.0, Apr 2026) and `REVISED_ROADMAP-10.md` for
forward planning; those are retained as history.

**North star (ratified 2026-07-11):** *a health intelligence system with the
soul of a journal* — one app, tagged to one child, that **evolves with her**
across life-stages (tracking → learning → education). Warmth is design *law*,
not a ceiling on capability.

**Two facts everything sequences against:**
1. Some work is **HELD** (the Borders charter) or **GATED** (the RED security
   fixes wait for charter ratification *and* market-readiness).
2. Some work has **hard dependencies**: Hindi needs an i18n framework first;
   correlation cards need the Age-of-Attainment field first.

Every code phase runs the **canon-cc-008 QA gate** (Governor audit by
jurisdiction → Lyra synthesis → Cipher final-pass). Routing noted per phase.

---

## Phase 0 — Make tonight durable *(immediate, low-risk)*
- **PR-1 (SproutLab, `claude/hello-lyra-uch6mt`):** 14 compass edits (7 agents + 7 skills) + the CLAUDE.md brief reframe. Docs/spec-only → Governor audit waived.
- **PR-2 (Codex, `claude/hello-lyra-uch6mt`):** the Night-of-the-Borders chronicle + Aurelius's records snippet (2 canons, 1 Doctrine, 1 Chronicle, Book X as apocrypha `foretold`). *Pending your nod on canon IDs.*
- **Close F-6a (#253)** with a real handoff (it shipped past the last recorded state).
- *Why first:* the container is ephemeral; square the record before new work.

## Phase 1 — Foundations: measure, then polish
- **1a. The benchmark** *(two-layer)* — objective gate (`audit-benchmark.sh`: cold-start budget, bundle ceiling, a11y via Playwright+axe, HR rollup, e2e pass-rate) + advisory Governor rubric (`SPROUTLAB_SCORECARD.md`: warmth / comprehension / data-safety / intelligence-correctness). *Build first so everything after is scored.* QA: tooling (Public Works) + a Playwright spec.
- **1b. Chart / visual rework + vendor Chart.js** — the two-birds move: closes **ASI04 supply-chain** (pinned, SRI-free CDN → local bundle, faster cold-start) *and* delivers Vela's smoothness doctrine (comprehension-motion, the delay-cost test, `prefers-reduced-motion`). The highest-leverage answer to the polish gap. QA: shared modules → quad-Governor.
- *Why here:* polish is the visible gap (the 3.5/10, the Kinedu contrast); the benchmark makes all later work measurable.

## Phase 2 — Evolving-thesis groundwork
- **2a. AoA engine upgrade** — record **first-emergence date** as a first-class milestone field (not a boolean) + norm-anchored adaptive re-prompt cadence. Cheap; unlocks stronger cross-domain correlation. *(Grounded in the kleineWeltentdecker paper — `docs/references/2022_kleineWeltentdecker...md`.)* QA: engine → Kael, care → Maren.
- **2b. i18n framework** — the scaffolding Hindi requires. Framework only, no content. A real foundation, not a toggle (the app has none today). QA: touches all → quad-Governor.

## Phase 3 — The content surface (the blog)
- **3a. Milestone-contextual content engine** — reuse the `/doc-render` pattern (markdown → HTML view, static, no backend). Two surfaces: a public *feed* (market/SEO) + a self-surfacing *contextual card* (the SproutLab-native form the paper points to — appears in Today So Far when Ziva hits the window). QA: content → Ceres/Vela.
- **3b. Provenance/verification** — a "verified by Dr. ___" credentialed badge (our attribution doctrine, applied to credibility). Unforgeable-attribution + trust-surface, made product.
- **3c. Hindi** — after 2b (i18n). English first.
- **Human dependencies (secure in parallel, not code):** a named pediatrician; a sustainable content cadence. *The bottleneck is editorial, not engineering.*

## Phase 4 — The Borders + market-hardening *(when you unhold)*
- **4a. Ratify Book X** — four-rung chain, dual-Builder Rung 1 (Orinth + Lyra). Charter before build.
- **4b. RED fixes, deepest-first** — ASI06 (tamper-evident memory / WAL hash-chain), ASI07 (reject-and-quarantine ingest), unforgeable attribution + social attestation. *This IS the "before it carries other families' data" work* — it aligns with any market pivot. QA: engine → Kael, sync → Kael, care → Maren.

## Ongoing — existing product roadmap (woven in as capacity allows)
- **F-6b** voice-to-text (needs an on-device Web Speech spike; iOS-standalone-PWA is the named risk).
- **F-4** Patterns sub-tab; **F-5** `parseFeeding` completion (`derivedAllergens`/`derivedFatBearing`, TSF legacy-reader retirement).
- PR-dashboard curation batch (due ~#259).

---

## Dependency graph (the load-bearing arrows)
- i18n (2b) **→** Hindi blog (3c)
- AoA field (2a) **→** stronger correlation cards (3a contextual surfacing)
- Book X ratification (4a) **→** RED fixes (4b) *(charter before build)*
- Benchmark (1a) **→** measures 1b onward
- Chart vendoring (1b) **⟺** ASI04 (4b) *(one motion closes both)*

## The one genuine fork (Architect to set)
After Phase 0 lands, what leads the next working block — **Foundations**
(1: benchmark + polish), the **Evolving thesis** (2→3: AoA, i18n, the blog),
or **Borders hardening** (4: unhold + ratify + RED fixes)? And: **when does the
Borders unhold?**
