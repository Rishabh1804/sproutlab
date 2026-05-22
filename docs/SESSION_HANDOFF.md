# Session Handoff — SproutLab

**Date:** 2026-05-22
**Builder:** Lyra (The Weaver)
**End state:** `main` clean, all work merged & pushed.

---

## What shipped this session — 8 PRs merged

| PR | Title | Substance |
|----|-------|-----------|
| #88 | PR-J hotfix | Trend-pill SVG leak (HR-7 regression from PR-EF); un-stuck win alerts |
| #90 | PR-K Home design | `getTrend()` return-shape restructure (V-K-14); 4-mode alert model + safety-lock; "Today for Ziva" hero card; vaccination Gantt reshape |
| #91 | Cleanup | Swept 31 inert `dismissable` flags; repointed 5 stale smoke tests off the deleted `intelligence.js` |
| #92 | Feedback fixes | Dark-mode hero bug; alert re-routing to real data cards |
| #93 | Alert interactivity | `ALERT_CARD` routing map (27 alerts); fixed dead "+N more" links; `gotoCard` expands target card + breadcrumb back-nav |
| #94 | Accuracy fixes | Feeding-intake 4-level count bug; food-repetition staple exemption; sync indicator silent-on-success |
| #95 | Status-strip collapse | Empty sync band collapses when there is nothing to show |

QA chains (canon-cc-008) were run on PR-J and PR-K — Maren + Kael + Cipher, all cleared.

## Test state

Full e2e suite **green (~116 passing)**. Test files added this session: `home-hotfix`, `alert-modes`,
`today-hero`, `vacc-gantt`, `home-feedback`, `alert-routing`, `accuracy-fixes`, `status-strip`. The 5
previously-stale smoke tests were repointed and now pass.

## Outstanding work

### PR-N — on hold, not started

The "explain, not just log" design PR. Scope locked via the user's answers:

- **Comprehensive food-chemistry DB** — add a `chem` field (fibre type, anti-nutrients, bioactives) to
  all 148 `NUTRITION` foods in `data.js`. *Caveat raised & accepted:* populate conservatively —
  high-confidence facts only, no fabricated precision; the model is labelled general-guidance, not a
  clinical reference.
- **Educational tips** — rewrite `ESCALATING_TIPS` (`data.js`) for `supp-streak-broken` (D3: why daily,
  calm missed-dose framing — 1–3 missed days is not harmful, D3 builds stores) and `food-correlation`
  (plain-language compound mechanisms). Lyra drafts conservatively + hedged; **Maren must audit** the
  clinical content.

### Deferred content asks (could fold into PR-N)

- New-food wins lack *which food / when / which meal slot* — needs a `mealSlot` data field on food entries.
- Genuinely rewarding streak views (the meal-logging-streak win currently routes to a generic breakdown card).
- Optional: quiet the transient peer-activity pill (`#syncActivity`, 45s auto-hide) — left as-is; user OK'd revisiting.

## Useful context for the next session

- **Build:** `cd split && bash build.sh > sproutlab.html` then `cp` to `../index.html` + `../sproutlab.html`.
  Four ship-gates run in-build: audit-emoji, audit-icon-text, audit-resolve-shield, audit-viz-smoke.
- **`gotoCard(tab, cardId)`** (core.js) is the standard alert→evidence navigation helper — switches tab,
  expands the card, scrolls, records a breadcrumb so the back gesture returns to the origin.
- **`ALERT_CARD` map** (home.js) is where alert→destination routing lives — add an entry when adding an alert.
- **4-mode alert model** (home.js): `getAlertMode()` derives action / snooze / acknowledge / dismiss from
  severity; `safetyLocked` (and `vacc-reminder*` / `dev-checkup*` keys) force snooze — never permanently silenced.
