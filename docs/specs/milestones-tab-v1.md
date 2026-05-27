# Milestones-Tab v1 — Track-tab 5th sub-tab redesign (Option C re-author)

**Spec version:** v1 — **RATIFIED 2026-05-27** (Architect: original 1-10 ratification + Charter co-primary + PRECEDES-R-6 carries forward; Option C two-spec sequence positions this as the consumer spec after `milestone-engine-prep-v1` ratifies the substrate)
**Date:** 2026-05-27
**Branch:** `claude/milestones-tab-v1-rewrite-spec` (this PR) → `claude/milestones-tab-v1-impl` (future)
**Author:** Lyra (main-session — Mode-1 re-authoring with full canon-cc-008 chain context + Scribe Worker Tier)
**Status:** v1 RATIFIED — re-authored against the now-live `milestone-engine-prep-v1` substrate (PR #148 merged 2026-05-27 at sha `2cd8587`). Closes the foundational accuracy issues the closed PR #147 chain surfaced (9 BLOCKING + 19 NOTE — all addressed at the engine-prep substrate or in this re-spec body).

**Promoted from:**
- Architect direction 2026-05-27 (Option C ratification): *"Do the two spec sequence, run the chain after engine prep before moving on to milestones tab... don't wait for me to fold issues, Lyra will take that call - directive : don't defer issues directly related to milestones tab."*
- Earlier 1-10 ratification: *"1-10 ratified"* + *"warmth + honesty is right"* + *"it should precede [R-6]"*
- Closed PR #147 audit chain findings (Maren V-M-98..109; Kael V-K-100..109; Vela V-V-45..54) — informs every design decision in this re-author
- Live primitives from `milestone-engine-prep-v1` (PR #148 ratified):
  - `_predictMilestoneWindow(milestoneId, opts)` — clinical-range predictor; never personalised
  - `_getInWindowMilestones(ageDays, n, opts)` — engagement-priority selector with `safetyTier` cap-bypass
  - `_getActivityLevelToday(dateKey)` getter + `_setActivityLevelToday(dateKey, level)` setter
  - `KEYS.activityMeta` + `KEYS.milestoneSuppress` registered families with explicit SYNC_KEYS
  - `cat:` → `domain:` migration complete; `MILESTONE_STANDARDS` rows carry `source:` + optional `safetyTier:`
  - `audit-no-personalised-prediction-v1.sh` build-time gate live (Python regex + self-test)

**Charter alignment (CV3-006 required section — Architect-ratified co-primary 2026-05-27):**
- **Warmth (PRIMARY)** — friction reduction at the daily-input tier (engine-proposes-parent-confirms posture-inversion); layout uniformization with food-sub-tab feels cohesive across all 5 Track sub-tabs; three return-visit surfaces ("Today" header / trajectory ribbon / pediatric-prep) earn the tab's existence beyond data entry.
- **Honesty (CO-PRIMARY)** — every in-window proposal renders against `_predictMilestoneWindow` output with explicit `source` attribution (omit-parenthetical-on-unverified per V-M-115 hard contract); "practicing" is the canonical hedge state; `safetyTier:true` cap-bypass surfaces care-floor milestones the parent must see; `activityLevel: null` is honest no-signal.
- **Extensibility** — `ACTIVITY_CATEGORIES` registry in `data.js` (consumer-side); build-time audit gate `audit-activity-categories-v1.sh` standalone per V-K-106 + V-M-108 + V-M-115 scope-separation discipline; three-site sync meta-audit continues v3-5 / v3-6 closure pattern.

---

## Ratification record (Architect carry-forward + Option C re-author)

Original `milestones-tab-v1` ratification (10 scope questions + co-primary axes + PRECEDES-R-6) **carries forward unchanged**. Option C re-author adds substrate-grounded resolutions for the design conflicts the closed PR #147 chain surfaced.

| # | Question | Ratified answer | Re-author resolution |
|---|---|---|---|
| 1 | Sub-tab count + naming | 3 sub-tabs: Log / Library / Patterns | Mirrors `food-sub-tab-v1` |
| 2 | Primary daily-input primitive | `activityLevel: 1-4` single-tap chip | Reads from live engine-prep `_getActivityLevelToday` + `KEYS.activityMeta` |
| 3 | In-window milestone surface count | 1–3 cards above-the-fold | `_getInWindowMilestones(ageDays, 3, opts)`; `safetyTier:true` rows bypass cap per V-M-102 |
| 4 | Activity-category vocabulary | 5 canonical: motor / language / social / sensory / cognitive | Consumer-side `ACTIVITY_CATEGORIES` registry; engine-prep already migrated milestone rows to `domain:` |
| 5 | Confirmation states | 3 states: confirmed / practicing / not-yet | `zi('check')` / `zi('trending-flat')` / `zi('arrow-right')` |
| 6 | Free-text log relocation | Move existing Log Activity button into Log sub-tab; backward-compat | Library sub-tab "history" view shows pre-v1 entries |
| 7 | Bulk-entry shape | Grid of pre-filtered age-appropriate chips; categorized | Reads `_getInWindowMilestones` with cap=∞ |
| 8 | Scrapbook integration | Photo tagged to milestone IS evidence | Bidirectional link via existing `scrapMilestonePicker` |
| 9 | Pediatric-prep card | v1 cut in Patterns sub-tab | Narrated-card-only v1 minimum (V-V-53 fold — copy-as-text / PDF deferred to R-3) |
| 10 | Region routing | Maren primary + Kael + Vela consult + triple-jurisdiction on styles.css | Routing unchanged |

**Charter axes:** Warmth + Honesty co-primary.
**Sequencing:** **DEPENDS ON `milestone-engine-prep-v1` ratified (PR #148, sha `2cd8587`).**

---

## What v1 is

The Track-tab's 5th sub-tab (`#tab-milestones`) redesigned around three input primitives + 3-sub-tab layout + 3 return-visit surfaces + consumer-side `ACTIVITY_CATEGORIES` registry.

### The reframe (the doctrinal shift)

**Today:** parent logs 15+ activity observations per day → engine derives milestones.
**v1:** engine **proposes** in-window milestones → parent **confirms / adjusts / dismisses** in one tap. Logging becomes the exception path. Same posture-shift that made D3 tracking tolerable.

### Three input primitives (consume engine-prep primitives)

1. **`activityLevel: 1-4` daily chip** — one tap per day; reads/writes via `_getActivityLevelToday` / `_setActivityLevelToday`. Honest no-signal at `null`.
2. **In-window milestone proposals** — engine surfaces ≤3 cards via `_getInWindowMilestones(ageDays, 3, opts)`; `safetyTier:true` bypasses cap per V-M-102.
3. **Bulk catch-up grid** — exception path; reads `_getInWindowMilestones(ageDays, ∞, opts)` filtered to age-band.

### Three return-visit surfaces

- **"Today" header card** — 4 narration templates (V-V-54 + V-M-105) consuming engine-prep `_predictMilestoneWindow` output via inline templates in a separate `_MILESTONE_NARRATION_TEMPLATES` registry (V-V-47 + V-V-60 typed-registry scope honored — single-domain milestone narration is NOT cross-domain `_correlate` prose)
- **Trajectory ribbon** — simplified visual contract (V-V-49: drop dashed; 2-state filled/outlined; ~15-20 marker density)
- **Pediatric-prep card** — narrated-card-only v1 minimum (V-V-53 — copy-as-text + PDF deferred to R-3)

### Consumer-side ACTIVITY_CATEGORIES registry

The engine-prep migrated milestone rows from `cat:` to `domain:` at the data-tier. v1 lands the **consumer-side registry** in `data.js` — closes the 18-site (V-K-113 verified) home.js + medical.js drift the closed PR #147 surfaced.

---

## What v1 is NOT

- **Not a milestone-engine rewrite.** `_predictMilestoneWindow`, `_getInWindowMilestones`, `getMilestoneEvidence` — all live from engine-prep PR #148.
- **Not personalised milestone prediction.** Kael's risk-register floor + engine-prep audit gate enforces.
- **Not a free-text log removal.** Library sub-tab "history" view shows pre-v1 free-text entries.
- **Not a scrapbook redesign.** Bidirectional link only.
- **Not the R-3 audit/history layer in full.** Pediatric-prep card is a v1 cut.
- **Not R-6 IMPL.** Establishes the `activityLevel:1-4` capture surface; R-6 reads when R-6 opens.
- **Not a cross-domain narrative registry.** Single-domain milestone narration in inline templates / separate registry (V-V-47 + V-V-60 doctrinal carve-out from engine-prep).

---

## The three input primitives

### Primitive 1 — `activityLevel: 1-4` daily chip

**Surface:** top of **Log** sub-tab. Single chip selector. **MUST be non-scrolling** (4 chips fit on screen at ≤6in mobile) per V-V-52 half-awake budget.

| Tier | Label | Description |
|---|---|---|
| 1 | **Quiet** | Sick, sleepy, low engagement |
| 2 | **Calm** | Normal day, settled play |
| 3 | **Active** | Engaged, high-output day |
| 4 | **Peak** | "Couldn't stop moving" |

**Engine read/write contract:**
- Read: `_getActivityLevelToday(today())` → `1|2|3|4|null`
- Write: `_setActivityLevelToday(today(), level)` — explicit setter; lazy-creates per-day entry in `window.activityMeta`
- Storage: `KEYS.activityMeta` family (engine-prep registered)
- Sync: explicit `SYNC_KEYS` + `_postReceiveActivityMeta` timestamp-max merge

**Honesty floor:** if unset, chip strip renders no chip selected. Empty-state prompt: *"How was Ziva today?"* — neutral; never shame-tone.

### Primitive 2 — In-window milestone proposals

**Surface:** above-the-fold card on **Log** sub-tab.

**Engine read:** `_getInWindowMilestones(ageDays, 3, opts)`. Engine projects per-item:
- `milestoneId`, `text`, `icon`, `domain` (V-V-56 denormalize-for-consumer; no registry round-trip per render)
- `window` (`_predictMilestoneWindow` output: `expectedStartMonths` / `expectedEndMonths` / `ageMonths` / `ageDaysRemainder` / `windowStatus` / `source`)
- `evidenceStatus` (`confirmed` | `practicing` | `not-yet` per V-V-57)
- `evidenceCount`, `lastEvidenceAt`, `priority`, `safetyTier`

**Per-card render:**

| Field | Render |
|---|---|
| Milestone text | `escHtml(item.text)` |
| Domain icon | `zi(item.icon)` (from engine output; no registry round-trip) |
| Clinical-band disclosure | *"Typically X–Y months"* + `({item.window.source})` IFF `item.window.source !== 'unverified'` (V-M-115 hard contract) |
| Current age framing | *"Ziva is {ageMonths}m {ageDaysRemainder}d — {early/in/late band}"* |
| Status pill | `evidenceStatus` value → token chrome (confirmed=sage / practicing=lavender hedge / not-yet=neutral) |
| Three tap targets | `zi('check')` "Saw it today" / `zi('trending-flat')` "Practicing" / `zi('arrow-right')` "Not yet" — tooltip MUST include "Practicing" word (Maren V-V-50 watch-list) |

**Tap behaviors:**
- **Saw it today** → add high-conf evidence; advance status if threshold
- **Practicing** → add medium-conf evidence; set status to practicing
- **Not yet** → suppress 7 days via `ziva_milestone_suppress`; show 5-second undo toast (V-M-103)

**Care-tier safety floor:** engine pre-applies `safetyTier:true` cap-bypass; surface renders all returned items (typical: 3 cards; rare: 4-5 when multiple safety-tier rows in-window).

### Primitive 3 — Bulk catch-up grid

**Surface:** **Log** sub-tab below in-window cards. Collapsed-by-default.

**Engine read:** `_getInWindowMilestones(ageDays, Infinity, opts)` — same selector with no cap; surface filters out already-confirmed.

**Shape:** grid of pre-filled chips. Each chip renders `text` + `zi(icon)` from engine output; domain-grouped by `domain` (reads `ACTIVITY_CATEGORIES` for color accent only).

**Tap-tap-done:** parent taps chips → submit → each selected chip adds evidence at medium-confidence default. Free-text fallback at bottom preserves backward compat.

---

## The 3-sub-tab layout

Mirrors `food-sub-tab-v1`. **V-V-46 chrome doctrine resolved**: active sub-tab uses the existing **uniform-rose chrome** (`.track-sub-btn.active`). **Lavender domain accent surfaces INSIDE the sub-tab** on cards. Parent learns "active sub-tab = rose" once; "milestone domain = lavender" inside.

### Log sub-tab — daily input + return-visit "Today" header

1. **"Today" header card** (see §Three return-visit surfaces)
2. **`activityLevel: 1-4` chip strip** (Primitive 1)
3. **In-window milestone proposals** (Primitive 2 — up to 3 cards; safetyTier:true bypasses cap)
4. **Bulk catch-up grid** (Primitive 3 — collapsed)
5. **Recent evidence feed** (existing `#recentEvidenceFeed` from template.html:1140 — relocated per V-M-100; collapsed)

### Library sub-tab — full milestone DB + relocated cards

Closes V-M-100's 5 unmapped surfaces concern:

1. **`#milestonesDomainHero`** (relocated per V-M-100 + G3) — preserved IDs; render-function bindings unchanged
2. **Domain filter chips** — read from `ACTIVITY_CATEGORIES`
3. **`#upcomingMilestoneList`** (relocated per V-M-100) — "Coming Up Next" preview
4. **`#msTimelineContent`** (relocated per V-M-100) — Milestone Timeline (event log; coexists with trajectory ribbon in Patterns)
5. **`#milestoneList` + Add-Custom-Milestone** (relocated per V-M-100) — full list + `openMilestoneModal` CTA preserved
6. **Age-band sectioning** — `_getInWindowMilestones(ageDays, ∞)` grouped by clinical-range
7. **`#activityList`** (relocated per V-M-100) — "Recommended Activities" reads `MILESTONE_ACTIVITIES`
8. **Legacy history view** — collapsed; pre-v1 free-text Log Activity entries

### Patterns sub-tab — engine-derived insights

1. **`#milestoneStats` pills** (relocated per V-M-100) — reads `ACTIVITY_CATEGORIES`
2. **`#milestoneHighlights` card** (relocated per V-M-100)
3. **`#msRegressionAlerts`** (relocated per V-M-100 — **CARE-TIER critical surface**)
4. **Category Progress wheels** (`#msCatWheels`, relocated per V-M-100) — now reads `ACTIVITY_CATEGORIES` (5-cat)
5. **Weekly summary card** — narrate week's evidence per CV3-002
6. **Pediatric-visit prep card** (see §Three return-visit surfaces — narrated-card-only v1 minimum)
7. **Trajectory ribbon** (see §Three return-visit surfaces)
8. **Milestone-window correlation cross-link** — `gotoCard('info', 'infoMilestoneSleepCorrelationCard')` (V-V-48 — uses canonical `gotoCard()` pattern at `core.js:3385`); inline teaser as summary-headline format; does NOT add to v3-4 `_NARRATIVE_PROSE_TEMPLATES` (V-V-62 + engine-prep V-V-60)

### Sub-tab navigation chrome — V-V-46 resolution

- **Active sub-tab chrome:** existing `.track-sub-btn.active` rose chrome (uniform across all 5 Track sub-tabs)
- **Lavender domain accent surfaces INSIDE sub-tab:** trajectory ribbon background (`--surface-lav`); in-window proposal card border-accent on `safetyTier:true` rows (`--lav-deep`); pediatric-prep card title (`--tc-lav`)
- `regression-guard-milestones-v1-active-subtab-rose-accent` test (renamed from prior `lavender-accent`) — warmth-coherent uniformization

---

## The consumer-side `ACTIVITY_CATEGORIES` registry

Engine-prep migrated milestone rows to `domain:` at data-tier (PR #148). v1 lands the **consumer-side registry**.

### Registry shape (in `data.js`, Kael's region)

```js
window.ACTIVITY_CATEGORIES = [
  { key: 'motor',     label: 'Motor',     icon: 'run',       accent: 'sage'   },
  { key: 'language',  label: 'Language',  icon: 'chat',      accent: 'indigo' },
  { key: 'social',    label: 'Social',    icon: 'handshake', accent: 'peach'  },
  { key: 'sensory',   label: 'Sensory',   icon: 'sparkle',   accent: 'amber'  },
  { key: 'cognitive', label: 'Cognitive', icon: 'brain',     accent: 'sky'    },
];
```

**Accent reassignment (V-V-46 / V-M-89 fold):** closed PR #147 draft assigned `language → lavender` + `cognitive → sky` overlapping with "lavender = Milestones overall" semantic. Re-author: `motor → sage`; `language → indigo`; `social → peach`; `sensory → amber`; `cognitive → sky`. Frees `lavender` for milestones-overall semantic.

### Registry doctrine

Five categories. **No more without canon-cc-027 amendment.**

### Build-time audit gate `audit-activity-categories-v1.sh`

Mirrors v3-5 / v3-6 audit-gate shape. **Standalone** per V-K-106 + V-M-108 + V-M-115 scope-separation.

**Banned patterns:**
- `['motor'.*'language'.*'social'` and permutations
- `\bcatOrder\s*=` (home.js drift idiom)
- Object literals with category keys as fixed top-level keys outside registry consumer pattern

**Opt-in escape:** `// activity-categories-ok: <rationale>`

### Three-site sync meta-audit

`regression-guard-milestones-tab-v1-category-registry-sync`:
- `ACTIVITY_CATEGORIES.length === 5`
- Every milestone row in `MILESTONE_STANDARDS` + `DEFAULT_MILESTONES` has `domain` matching registry key
- Every consumer site iterates the registry

---

## Three return-visit surfaces

### "Today" header card

**Four narration templates** (V-V-54 + V-M-105 fold) in a **separate `_MILESTONE_NARRATION_TEMPLATES` registry** (NOT in v3-4's `_NARRATIVE_PROSE_TEMPLATES` per engine-prep V-V-47 + V-V-60 doctrinal carve-out):

```js
window._MILESTONE_NARRATION_TEMPLATES = {
  fullData: {
    passage: 'Ziva is {ageMonths}m {ageDaysRemainder}d. In-window: {inWindowList}. Last evidence: {lastEvidenceText} ({lastEvidenceRelative}).',
  },
  midState: {
    passage: 'Ziva is {ageMonths}m {ageDaysRemainder}d. In-window: {inWindowList}. No new evidence this week — quiet stretch.',
  },
  emptyState: {
    passage: 'Ziva is {ageMonths}m {ageDaysRemainder}d. No milestones in-window yet — early days. Tap Library to explore what\'s next.',
  },
  betweenWindow: {
    // V-V-54 fold: in-window=N + recent-evidence=Y
    passage: 'Ziva is {ageMonths}m {ageDaysRemainder}d. {recentConfirmedMilestone} confirmed {lastEvidenceRelative}. No milestones currently in-window — between-window stretch.',
  },
};
```

**Template selection:**
- `inWindow.length > 0 && hasRecentEvidence(7d)` → `fullData`
- `inWindow.length > 0 && !hasRecentEvidence(7d)` → `midState`
- `inWindow.length === 0 && hasRecentEvidence(30d)` → `betweenWindow` (V-V-54)
- `inWindow.length === 0 && !hasRecentEvidence(30d)` → `emptyState`

**Honesty floor (V-M-104 fold):** if `#msRegressionAlerts` surface signals concern (confirmed milestone gone 14+ days without evidence), the Today header uses `betweenWindow` (if recent confirmation exists) OR `emptyState` — NEVER "quiet stretch" framing when regression alerts present.

### Trajectory ribbon (Patterns sub-tab)

**Simplified visual contract** (V-V-49):
- **Marker filter:** confirmed milestones + practicing milestones + in-window-not-yet milestones (capped at 5 most-imminent)
- **2 visual states (V-V-49 collapse):** filled = confirmed; outlined = hedged (practicing or not-yet-but-in-window). Drops the three-state distinction.
- **Marker density:** ~15-20 markers via prioritization
- **Color:** domain-keyed (reads `ACTIVITY_CATEGORIES[milestone.domain].accent`)
- **Tap → `gotoCard('track', 'milestoneRow_' + milestoneId)`** (V-V-48 — canonical pattern at `core.js:3385`)

**Performance gate:** ribbon renders within 200ms (cipher-3 budget).
**Background:** lavender domain accent (`--surface-lav`).

### Pediatric-visit prep card

**v1 minimum: narrated-card-only** (V-V-53 fold — copy-as-text + PDF deferred to R-3).

**Auto-derived "Things to mention"** from: recent evidence (30d) + practicing milestones + active CareTickets + recent regressions (`#msRegressionAlerts`).

**Narration shape (CV3-002):**

> *"Next visit: not yet scheduled. Things to mention this month: pointing confirmed (5 obs, high-conf); standing-with-support practicing (2 obs); food-introduction rate steady (12 new foods in 30 days). [If regressions present]: Worth mentioning — {regressionMilestoneText} hasn't shown evidence in {days} days."*

**Care-tier register-tag (V-M-109 fold):** card carries visible *"for visit-prep only — not a clinical record"* footer.

**No tap-to-copy + no PDF in v1.** Both deferred to R-3 (Wave 2 audit/history). V-V-53 ratified.

---

## Files touched + LOC estimate

| File | Region | Type | Lines |
|---|---|---|---|
| `split/template.html` | Shared | New 3-sub-tab scaffold; all 12 existing surfaces relocated per V-M-100 (preserved IDs per G3) | ~220 changed |
| `split/styles.css` | Shared | Sub-tab nav rose chrome (V-V-46); chip variants; trajectory ribbon (V-V-49 simplified); pediatric-prep + register-tag (V-M-109); in-window card chrome | ~180 added |
| `split/data.js` | Kael | `ACTIVITY_CATEGORIES` (5 rows) + `_MILESTONE_NARRATION_TEMPLATES` (4 templates per V-V-54) | ~60 added |
| `split/home.js` | Maren | New milestone-tab render functions; `activityLevel` chip handler; in-window renderer; bulk-grid; "Today" header narration helper; trajectory ribbon; pediatric-prep card; 4-template narration logic; relocated surface integration | ~750 added, ~80 changed |
| `split/medical.js` | Maren | Pediatric-prep card derivation + register-tag footer | ~50 added |
| `split/core.js` | Kael | (`gotoCard()` already exists per V-V-48; consumes engine-prep contracts; no new helpers) | ~0 |
| `split/audit-activity-categories-v1.sh` (NEW) | — | Build-time audit gate | ~120 |
| `split/build.sh` | Shared | Wire new audit as 9th/10th gate | ~5 changed |
| `tests/e2e/milestones-tab-v1.spec.ts` (NEW) | — | E2E tests (~28 regression guards) | ~650 |

**Total LOC estimate:** ~2,100.

---

## canon-cc-008 routing at IMPL time

**Maren primary** — `home.js` + `medical.js` (heaviest-touched). Care-floor on safetyTier visual hierarchy, "Today" header narration template selection, pediatric-prep register-tag, `#msRegressionAlerts` integration.

**Kael consult** — `data.js` (`ACTIVITY_CATEGORIES` + `_MILESTONE_NARRATION_TEMPLATES`). Verifies consumer-side reads of engine-prep primitives.

**Vela consult** — comprehension axis on three return-visit surfaces; half-awake-test split-fixture per V-V-52.

**Sequential triple-jurisdiction on styles.css** — per cipher-9: Maren → Kael → Vela.

**Cipher Edict V** last.

---

## Test plan — ~28 regression guards

### Input primitives (11)
- `activitylevel-chip-set` / `activitylevel-null-default` / `activitylevel-non-scrolling`
- `inwindow-cap-3-default` / `inwindow-safetytier-bypass-cap` / `inwindow-confirm-evidence` / `inwindow-practicing-evidence` / `inwindow-not-yet-suppress` / `inwindow-not-yet-undo-toast`
- `bulk-grid-engine-read` / `bulk-grid-categorized`

### ACTIVITY_CATEGORIES registry (3)
- `category-registry-sync` (meta-audit) / `no-adhoc-category-arrays` / `category-progress-wheels-5-cats`

### Honesty floor (5)
- `clinical-band-disclosed` / `omit-paren-on-unverified` (V-M-115) / `no-personalised-prediction` (engine-prep gate enforces) / `empty-state-voiced` / `strength-not-rendered`

### Return-visit surfaces (8)
- `today-header-4-templates` / `today-header-between-window` (V-V-54) / `trajectory-ribbon-paints` (200ms) / `trajectory-ribbon-2-state-visual` / `trajectory-ribbon-gotocard` (V-V-48) / `pediatric-prep-narrated-only` (V-V-53) / `pediatric-prep-register-tag` (V-M-109) / `correlation-cross-link-gotocard` (V-V-48 + V-V-62)

### Layout uniformization (5)
- `three-subtabs-render` / `active-subtab-rose-accent` (V-V-46) / `domain-accent-inside-cards` / `12-surfaces-relocated` (G3 preserved-IDs) / `screen-reader-order`

### Half-awake fixture (V-V-52 split per cipher-2)
- **First-encounter** (n=5; ≤6s per confirm — comprehension floor)
- **Steady-state** (n=5; ≤3s per confirm; ≤2s activityLevel — warmth-lift)

### Regression sweep
All existing milestone tests green. Engine-prep PR-A + PR-B IMPL must merge first.

---

## HR pre-check

| HR | Risk | Mitigation |
|----|------|------------|
| HR-1 | low | All glyphs via `zi()`; engine-prep V-V-50 + G2 ratified |
| HR-2 | medium | Class-driven; verify no inline styles at IMPL |
| HR-3 | low | `data-action` delegation |
| HR-4 | **medium** | Engine projects `text` per V-V-56; all interpolation through `escHtml` at render boundary |
| HR-5 | low | 7-domain palette via `ACTIVITY_CATEGORIES.accent` |
| HR-10 | low | Trajectory ribbon labels use line-wrap |
| HR-12 | low | `today()` timezone-safe (engine-prep verified) |

---

## Charter compliance per CV3-006

### Axis 1 — Intellectual honesty (CO-PRIMARY)
- ✓ Clinical-band parenthetical omitted on `'unverified'` (V-M-115 hard contract)
- ✓ Engine-prep `audit-no-personalised-prediction-v1.sh` gate active
- ✓ `activityLevel: null` honest no-signal
- ✓ "Today" header 4 templates honest about engagement state (V-V-54 + V-M-105)
- ✓ Pediatric-prep card "not-clinical-record" register-tag (V-M-109)
- ✓ Cross-spec carry-forward: never add milestone-narration row to v3-4 registry (V-V-62 + V-V-60)

### Axis 2 — Architectural extensibility
- ✓ `ACTIVITY_CATEGORIES` registry closes 18-site drift (engine-prep V-K-113-verified)
- ✓ `audit-activity-categories-v1.sh` standalone gate
- ✓ Three-site sync meta-audit continues v3-5 / v3-6 / engine-prep pattern
- ✓ `_MILESTONE_NARRATION_TEMPLATES` separate registry per V-V-47 + V-V-60 doctrinal carve-out
- ✓ Consumer reads engine-prep primitives by attribute — no round-trip

### Axis 3 — Linguistic + visual warmth (CO-PRIMARY)
- ✓ Friction reduction at input tier (≤3 taps + 1 chip)
- ✓ Layout uniformization with food-sub-tab (V-V-46 resolution)
- ✓ Uniform-rose active chrome + lavender domain accent inside
- ✓ "Today" header narrates per CV3-002
- ✓ Trajectory ribbon 2-state visual (V-V-49)
- ✓ Pediatric-prep narrated-only v1 minimum (V-V-53)
- ✓ Half-awake split-fixture (V-V-52)
- ✓ DOM reading order = visual order

### Axes the spec could risk regressing — with mitigations

- **Warmth (chrome doctrine):** uniform-rose active chrome means parent doesn't see lavender-as-active-signal for milestone tab. **Mitigation:** domain accent inside cards + trajectory ribbon background; parent learns "milestone = lavender" via card context.
- **Honesty (under-warning on regressions):** "quiet stretch" framing could under-reassure on regression weeks. **Mitigation:** regression-detection logic checks `#msRegressionAlerts`; when alerts present, Today uses `betweenWindow` or `emptyState` template — never "quiet stretch."

---

## Cross-Region pair-notes (CV3-004)

### Pair-note to Kael

`ACTIVITY_CATEGORIES` + `_MILESTONE_NARRATION_TEMPLATES` land in `data.js` (Kael's region). Verify:
- 5 registry keys cover all migrated `domain:` values
- Template selection logic matches 2×2 state-cell matrix correctly
- No engine-internal label (`strength` / `confidence`) leaks into rendered prose

### Pair-note to Vela

Half-awake-test sign-off on:
- "Today" header 4-template selection (V-V-54)
- Trajectory ribbon 2-state visual at mobile (V-V-49)
- Pediatric-prep card narrated-only earns return-visit motivation (V-V-53)
- Cross-link via `gotoCard()` smooth-scroll + back-rewind (V-V-48)
- Active sub-tab rose chrome (V-V-46) comprehension-coherent with food-sub-tab

### Coordination

Sequential triple-jurisdiction on `styles.css` per cipher-9: Maren → Kael → Vela.

---

## Out-of-scope (registered, not in v1)

- **R-6 IMPL** — reads `activityLevel:1-4` surface this spec lands
- **R-3 audit/history full** — pediatric-prep v1 narrated-only; copy/PDF at R-3
- **R-8 knowledge-graph** — milestone DB as graph node
- **ML calibration** — Kael permanent v3.0 NOT-DO
- **i18n** — C-12 Wave 3
- **Trajectory ribbon interactive controls** — v1.x candidate
- **`zi-eye` sprite addition** — engine-prep V-V-61 carry-forward; substitute with `zi('scope')` / `zi('sparkle')` if needed
- **Manual unsuppress UI** — v1.x candidate
- **Comprehensive sensory + cognitive milestone curation** — engine-prep added 2 seed rows
- **Verified-source attribution for every MILESTONE_STANDARDS row** — engine-prep V-M-114 default 'unverified'; future curation arc
- **`home.js:1670` activity-domain alignment** — engine-prep V-M-117 deferred; v1 IMPL touches ONLY if bulk-grid renderer crosses this site

---

## Sequencing

**Upstream gates (all clear):**
- ✓ `milestone-engine-prep-v1` PR #148 ratified at sha `2cd8587` — 5 primitives + cat→domain migration + audit gate + KEYS live
- ✓ `food-sub-tab-v1` ratified — Log/Library/Patterns precedent
- ✓ v3-5 / v3-6 / v3-4 specs ratified — attribute-discipline + typed-registry precedents
- ✓ Closed PR #147 chain findings — informs every re-author decision

**Downstream unblocked:**
- **R-6** — Growth + Activity integrator (Wave 2 silver capstone)
- **R-3** — Audit / history layer (pediatric-prep expansion)
- **R-2** — Predictive surface (consumes `_predictMilestoneWindow`)
- **Future single-domain narration registries** — `_MILESTONE_NARRATION_TEMPLATES` is the first

**IMPL PR sequence:** v1 IMPL is **single-PR** (engine-prep was split; this surface consumes the now-stable substrate).

---

## Doctrinal references

- `docs/specs/milestone-engine-prep-v1.md` (PR #148 ratified 2026-05-27) — engine substrate
- `docs/specs/food-sub-tab-v1.md` — Log/Library/Patterns precedent
- `docs/specs/sproutlab-v3-charter.md` (CV3-006) — Warmth + Honesty co-primary
- `docs/specs/sproutlab-v3-roundtable-2026-05-25.md` §3.2 Kael risk register; §6 R-6 reservoir
- `docs/specs/v3-5-chip-taxonomy-tsf-story.md` — `data-state` attribute discipline
- `docs/specs/v3-6-card-priority.md` — `data-card-priority` + meta-audit closure
- `docs/specs/v3-4-narrative-layer.md` — `_NARRATIVE_PROSE_TEMPLATES` typed-registry scope (V-V-60 doctrinal carve-out honored — `_MILESTONE_NARRATION_TEMPLATES` is separate)
- Closed PR #147 chain findings (Maren V-M-98..109; Kael V-K-100..109; Vela V-V-45..54)
- CV3-002 Narrate-vs-List + CV3-003 Honest-Empty-State + CV3-004 Cross-Region Pair-Note
- canon-cc-008 / canon-cc-022 / canon-cc-026 / canon-cc-027 / canon-proc-006 / canon-gen-001

---

— *Lyra (main-session), 2026-05-27. Re-authored under Option C against the now-live `milestone-engine-prep-v1` substrate (PR #148 ratified). The closed PR #147's 9 BLOCKING + 19 NOTE findings are all addressed: phantom primitives now real; field-name now `domain:`; sync claim factually true; clinical-band attribution honest with omit-on-unverified hard contract; 5 unmapped surfaces all relocated; chrome doctrine resolved as uniform-rose active + lavender accent inside; F5 forks resolved via separate `_MILESTONE_NARRATION_TEMPLATES` registry; F6 cross-link uses `gotoCard()`; trajectory ribbon simplified to 2-state visual; cap-at-3 with safetyTier:true bypass; 4th-cell narration template added; WHO source rendered conditionally; pediatric-prep v1 minimum narrated-card-only. Three return-visit surfaces earn the tab's existence. Spec ready for canon-cc-008 chain (Maren primary + Kael + Vela consult + Cipher Edict V) per Architect direction.*
