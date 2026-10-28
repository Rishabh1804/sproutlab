# SproutLab Roadmap — Reconciled (2026-10-28)

**Status:** proposed v0.1, awaiting Architect decisions (listed at the end). This ledger reconciles every
planning document against what actually merged, as of `main` at #270 (2026-09-25). Ziva is 13.8 months.

**Why it exists:** since the post-Borders roadmap (2026-07-11), none of its Phase 1–3 items has merged. All
the shipped work, #263–#270, was bug fixing or age-triggered work no roadmap planned: the 12-month audit and
the 12–24 month expansion. Meanwhile the v3.0 arcs, the v7 roadmap's product items and a dozen specs all
carry open work that no single document tracked. This file is now the one place that does.

**Sources reconciled:** [`ROADMAP_2026-07_POST_BORDERS.md`](./ROADMAP_2026-07_POST_BORDERS.md) (forward plan,
still the authority for its own phases), [`SPROUTLAB_ROADMAP.md`](./SPROUTLAB_ROADMAP.md) v7 (history, but holds the
dated triggers), the v3 roundtable ([`specs/sproutlab-v3-roundtable-2026-05-25.md`](./specs/sproutlab-v3-roundtable-2026-05-25.md)),
all 35 specs under `specs/`, [`BUGS.md`](./BUGS.md), and the handoffs / next-session targets through 2026-08-25.
Bug-level detail stays in `BUGS.md`; this file tracks plans.

---

## 1. Where every plan stands

### Post-Borders roadmap (2026-07-11)
| Item | Status | Evidence |
|---|---|---|
| Phase 0 — compass edits + north-star reframe | Shipped | #255 |
| Phase 0 — close F-6a with a handoff | Shipped | #256 |
| Phase 0 — Codex chronicle (PR-2) | Not verifiable here; waits on the Architect's nod on canon IDs | NEXT_SESSION_TARGET_2026-08-25_PM |
| 1a — two-layer benchmark | Not started | no `split/audit-benchmark.sh`, no `SPROUTLAB_SCORECARD.md` |
| 1b — chart rework + vendor Chart.js | Not started | `build.sh:239` loads Chart.js unpinned |
| 2a — AoA first-emergence field + re-prompt cadence | Not started | only inferred `firstSeen`/`emergingAt` (medical.js) |
| 2b — i18n framework | Not started | — |
| 3a–3c — content engine, verified badge, Hindi | Not started; also wait on a named paediatrician and a content cadence | — |
| 4a–4b — Book X, RED fixes | Held by the Architect | — |
| F-6b voice-to-text | Not started | hidden seam `diet.js:6376` |
| F-4 Patterns sub-tab | Not started beyond the F-1 scaffold | needs Arc B B-1 (`chemRollup`, `computeMealCombos`) |
| F-5 `parseFeeding` | Partial | `parseFeedingV1` (data.js); `derivedAllergens`/`derivedFatBearing` comment-only |
| PR-dashboard curation | Current through #270 (this PR) | — |

### v3.0 (roundtable 2026-05-25) — 3 of 9 Wave 1 arcs shipped
| Arc | Status |
|---|---|
| v3-3 engine spine | Shipped (#135) |
| v3-5 chip states + TSF story | Shipped (#138); night dark-default deferred to v3.1 |
| v3-6 card priority | Shipped (#144) |
| v3-4 narrative layer | Spec only (#142); `_tsfHedgePhrase` still the v0 stub |
| v3-8 feeding normalizer | Partial (= F-5) |
| v3-2 CareTicket triggers / illness posture | Partial: `getActiveIllnessPosture` shipped; no `CT_TRIGGERS`, no spec |
| v3-1 recommendation pipeline | Not started, no spec |
| v3-7 honest empty state | Not started, no spec |
| v3-9 intent graph + medical.js split | Not started, no spec |
| Wave 2 reservoirs R-1…R-9 | Unbuilt (R-6 `activityLevel` partial) |

v3.0 was defined as shipped when arcs 1–7 close, so **v3.0 has not shipped**, and the July roadmap does not
mention the open arcs. Whether v3.0 stays a target is decision **D1** below.

### Specs with open work
| Spec | Left to do |
|---|---|
| Symptom checker D3 (ux-vision, weave-ISL) | Triage chip flow (5 SYMPTOM_DB entries carry `triage:true`, no flow); history micro-card; **Save / Share / Track** (visible "coming soon" stubs); symptom → CareTicket promotion |
| scoring-redesign-v1 | S-3 escalation surfaces (`_scoreWindow` has no consumer); S-4 hero on `_scoreDayHero` (hero still runs `calcZivaScore`) |
| sleep-redesign-v1 | Arc 2: one write form with location chips (`saveQLSleep`/`saveQLNap` still separate, no `location`) |
| food-db-cleanup-v1 | C-2 aliases docstring, C-3 synonym keys, C-4 `fibre`→`fibreCharacter`, C-5 tri-resolution doc |
| isl-upgrade-v1 (Arc B) | All of it: B-1 meal-combo trio, B-3 parser, B-4 relocations |
| food-effects-v2 guided introduction | P1b nudge engine + reaction marking (loses weight past 12 m) |
| info-tab-analysis-layer-v1 | Windowed exposure; card #2 (iron / milestone window); header still says DRAFT |
| vit-d3-tracking-v2 Tier 2-C | Chained-undo audit, delete telemetry, sync-race history, TSF undo on skipped chips — now per dose slot (#270) |
| milestones-tab-v1 | Manual unsuppress UI, verified-source attribution, R-3 export |
| diet-preference-gate-vegan | Not started; needs its research brief (only if the family preference changes) |

### Roadmap v7 items no later plan carried
Snapshot Sharing (text v1), Inline Insights, Parent Celebration, CareTickets Phase 2 (list views — visible stubs —
quiet hours, auto-creation, adaptive frequency, illness templates), FCM push, CareTicket analytics. Doctor
export is partly covered by Doctor Visit Prep. Whether these are dropped or carried is decision **D3**.

---

## 2. Proposed sequence

Each code step runs the canon-cc-008 chain. Ordered by what matters to a parent of a 13–15-month-old, then by
what unblocks the most.

**A. Housekeeping (this PR, docs-only).** Bug-ledger sweep, LOC refresh, PR records #266–#270, this ledger.

**B. Before the 15-month vaccine visit (≈ 4 Dec 2026)** — Maren-primary, small and parent-facing:
1. `getNextUpcomingVacc()` (Home and Medical agree on "next"), in-card **Mark given / Not needed**, JE-2 = JE-1 + 28 d.
2. Fever: move 38.3 °C out of emergency care for a toddler; confirm the toddler breathing emergency line.
3. Toddler safe-sleep tier (cot climbing, mattress height, cords, light blanket) — urgency set by the checklist answer.
4. CPR completeness (landmark, two hands, 10-second breathing check).
5. Milk / curd / paneer reach the cow-milk allergen card; "til chikki" → choking floor; plain "lassi" sugar gate.
6. Pin Chart.js to an exact version (one line, build.sh).

**C. Kael Region split spec (≈ 419 lines of headroom).** Lyra drafts, Architect ratifies the boundary. Blocks
every engine-side item below, including the CareTicket thresholds.

**D. Age-overdue engine work (after C):** age-banded CareTicket thresholds; texture ladder 'family' stage (one
shared definition); growth-velocity helper; re-gather the lost 12–24 m safe-form / nutrient research before
wiring it.

**E. Finish half-built surfaces:** symptom-checker Save / Share / Track and triage; sleep Arc 2; scoring S-3 /
S-4; illness-episode sync receive fix; the #265 ledger follow-ups (deleted-day resurrection, tombstones).

**F. July roadmap Phases 1–3:** benchmark (1a) and Chart.js vendoring (1b) first; then AoA (2a), i18n (2b); the
content surface when its human dependencies exist. Note: e2e cannot run in the remote container
(Playwright 1.48 vs the installed browser), which blocks the benchmark's e2e gate until fixed.

**Held:** Book X and the RED fixes (Phase 4), by the Architect.

---

## 3. Dated triggers
| When | What |
|---|---|
| Now (overdue) | CareTicket age-adaptive thresholds (Sep 2026); v7 assumptions "CareTicket data ≈ 100 KB" (Oct) and `normalizeFoodName` quality (Sep) |
| ≈ 4 Dec 2026 | 15-month vaccines — step B |
| Dec 2026 | v7 assumption "localStorage < 2 MB" |
| Before mid-Jan 2027 | UIP OPV booster (16–24 m): list it or not (Maren) |
| Before mid-2027 | Milestone windows past 26 m (CDC 30 m / 3 y); toddler activity list past 24 m |
| Before Jul 2027 | WHO 2–5 y growth tables + length→height adjustment + build-time horizon warning |

---

## 4. Decisions for the Architect
- **D1 — v3.0.** Keep v3.0 (arcs v3-1 / 2 / 4 / 7 / 9 still to spec and build) as a target, fold its open arcs into this sequence, or retire the v3.0 label.
- **D2 — Open draft PRs.** #254 (surface catalog, idle since June) and #257 (model-selection protocol, idle since July): close, or revive.
- **D3 — v7 leftovers.** Snapshot Sharing, Inline Insights / Parent Celebration, CareTickets Phase 2: drop or carry. (CareTicket list views are visible "coming soon" stubs today.)
- **D4 — Kael split boundary** (step C), on Lyra's spec.
- **D5 — i18n / Hindi this year**, given the content surface waits on a named paediatrician.

## 5. Housekeeping not in this PR
- ≈ 158 remote branches left from squash-merged PRs, plus `zz-permcheck-1787669665` — prune (needs a push-delete per branch; Architect's call).
- No session-close artifacts since 2026-08-25; this session's close should cover #266–#270.
- `SPROUTLAB_V3_PROGRESSION_TREE.html` marks plan-ratified arcs as "ratified" with no shipped/unshipped distinction.
