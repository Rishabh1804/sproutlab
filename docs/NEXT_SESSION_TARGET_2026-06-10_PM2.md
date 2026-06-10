# Next Session Target — standing pointer (refreshed 2026-06-10 PM2)

**Supersedes:** `NEXT_SESSION_TARGET_2026-06-10_PM.md` (which pointed at the food-effects/Recipes product line generally; that line now has a ratified, implementation-grade spec).

---

## The recommended next move: **F-6a — build the Feeding Composer**

`docs/specs/food-sub-tab-v1-f6-feeding-composer.md` (v1.1, **Architect-RATIFIED 2026-06-10**, reviews complete and folded) is implementation-grade: anchors verified same-day, contract clauses bound (C1–C7, S1–S7), retirements mapped (R1–R8), routing recorded. **Do not re-scout — read the spec and build.** The why: the Diet→Log sub-tab is the app's last legacy free-text feeding surface and its writer (`saveFeedingDay`) actively degrades structured data (drops the `_v1` sidecar on edit); every session that logs meals through it deepens the divergence F-6 closes.

**First, always:** clean `git status` on synced `main`; `pnpm build` green; read the spec end-to-end.

---

## Priority ladder

### P0 — F-6a implementation (one PR)
Composer extraction (`_fc*` into diet.js) + Mount A (FAB sheet rewire) + Mount B (Log sub-tab ×4) + L-2 visual refresh of both + retirements R1–R8 + L-3 riders + gate update (`audit-feed-sheet-wiring-v1.sh` → `_fc*` successor shapes, same PR).
**Gate:** full canon-cc-008. Ceres + Vela already on record (spec round); **Kael + Maren take their first full Mode-1 pass here** — pair-notes pre-recorded in spec §routing (Kael: `intakeExplicit` writer touch, `CURATED_COMBOS` Almonds form vs AGE_RULES/FOOD_EFFECTS, `derivedAllergens` deferral registration; Maren: `initFeeding` scoped-refresh clause, home.js Mount-B glue). template.html + styles.css → quad-Gov sequential, **Ceres first** (heaviest-touched Region). `pnpm qa-route` on the real diff. Draft until the chain clears.

### P1 — F-6b voice-to-text V-1 (separate fast-follow PR)
**Spike first:** on-device Web Speech verification (start/stop, interim results, `en-IN` accuracy on household food vocabulary, **iOS standalone-PWA behavior** — the named risk). If iOS-standalone fails, ship Android/desktop-only behind the same feature-detect, honestly. Then: mic on the reserved `fcVoiceStart` slot, transcript → connector tokenize → `_fdSearchNutrition` chips-for-confirmation, **never auto-saves**, bindings F6-5 a–d (source:'voice' provenance; risk-class structural chip markers; allergen-ambiguity rule — egg/eggplant never silently collapsed; watch-window insight fires). `#zi-mic` sprite addition. Privacy line ships in UI copy.

### P2 — F-4 Patterns sub-tab, then F-5 parseFeeding completion (re-sequenced behind F-6 by the ratified spec)
F-4: nutrient heatmap card (engine exists — `computeNutrientHeatmap`), allergen-trend card, chem-variety tiles (pre-require Arc B B-1, Kael). F-5: `derivedAllergens`/`derivedFatBearing` canonicalization + legacy-reader retirement queue — **now including the TSF class registered this session** (`_tsfIsMealLogged` sentinel-as-logged + TSF `_time` raw reads; own QA round, per Vela).

### P3 — PR-views curation batch (due ≈ #259)
Append merged-PR records (#250, #251, then the F-6 PRs) to `docs/pr-dashboard-data.json` per the CLAUDE.md ritual; extend Era 8's chapter in `split/app-evolution-template.html` or open a new era for the F-6 arc (the era-horizon guard will nag). The build's cadence guard goes loud at lag ≥ 10.

---

## Carry-forward register

**Human-only / Architect gates**
- AT smoke-pass checklist on real devices (inherited; `docs/AT_SMOKE_PASS.md` if present, else the 2026-05-29 close).
- F-6b iOS on-device spike requires the Architect's physical device.

**Successors (in-flight arcs)**
- F-6a → F-6b → F-4 → F-5 (ratified sequence, above).
- `derivedAllergens` write-time computation: parent-spec ratified, writer still omits it — registered deferral (spec F6-10); lands F-4/F-5.

**Test / data debt**
- `NUTRITION_QTY_DEFAULTS` 30/122 explicit coverage (gate floor only).
- Comma-dish-name parse (split sites shrink after F-6a; full fix is F-5's normalizer).
- milestones-tab-v1 e2e; `CURATED_COMBOS maxAgeMonths`; `_qlPredictFood` SKIPPED_MEAL (fixed by F-6a L-3 rider — verify at gate).
- Cipher deferred nits on the cadence guard: `git log --merges` source-filter; squash-merge subject fallback (next touch of build-safe.sh).

**Housekeeping**
- Delete stale remote branch `claude/pr-dashboard-diet-planning-2k048b` (merged via #250 + #251).
- `--doc-placeholder` printed-doctor-card contrast (recorded #242, not fixed; quad-Gov + Architect go-ahead required).
- Legacy baby-name hardcode migration `[[flexible-name-debt]]` — one deliberate pass, never opportunistic.

**Candidate canon**
- "One curated corpus → multiple regenerated views + advisory cadence guard" (PR-views pattern; CLAUDE.md-registered, not yet Codex-ratified).
- Burst-scoped undo choreography (S2–S5: snapshot incl. side-effect deltas; toast ≥ quiet period; cross-slot closes) — if F-6a proves it, it generalizes to other save-on-action surfaces.

---

*Standing pointer — amend this file, not the handoff, if priorities shift.*
