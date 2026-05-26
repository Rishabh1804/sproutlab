# Milestones-Tab v1 — Track-tab 5th sub-tab redesign

**Spec version:** v1 — **RATIFIED 2026-05-27** (Architect: *"warmth + honesty is right / it should precede / 1-10 ratified"*)
**Date:** 2026-05-27
**Branch:** `claude/milestones-tab-v1-spec` (this PR) → `claude/milestones-tab-v1-impl` (future)
**Author:** Lyra (main-session — Mode-1 spec authoring)
**Status:** v1 RATIFIED — all 10 scoping questions answered with Lyra's proposed defaults; Charter axes confirmed (Warmth + Honesty co-primary); sequencing confirmed (PRECEDES R-6 — same pattern as food-sub-tab-v1 F-2 preceding v3-8 parseFeeding). M-1 implementation arc can open against this spec.

**Promoted from:**
- Architect direction this session (2026-05-27): *"There is a lot of friction in this surface to enter all the activities done by a kid in a day. Its layout differs from other sub-tabs so we need to uniformize that anyway. A parent will not enter 15 different activities everyday."* Plus: *"taking in the 4 level of activeness during the day that we already have in plan."*
- Chronicle §6 reservoir R-6 row — "NEW 4-tier daily activity input"
- Chronicle §4.2 day-record schema reservation — `activityLevel: 1-4 | null` (chronicle line 636)
- Existing precedent: `docs/specs/food-sub-tab-v1.md` (ratified 2026-05-25) — Log / Library / Patterns 3-sub-tab pattern; "1-10 all defaults" ratification record format
- Kael's risk register from chronicle §3.2 — `_predictMilestoneWindow` returns clinical ranges; never personalised predictions ("Ziva will sit by 6 months" is the canonical NOT-DO)
- Existing live surface — `template.html:1131` `#tab-milestones` (7 stacked cards: Log Activity button + #recentEvidenceFeed + #msActiveMilestones + #milestonesDomainHero + #milestoneStats + #milestoneHighlights + #msCatWheels)

**Charter alignment (CV3-006 required section — Architect-ratified co-primary 2026-05-27):**
- **Warmth (PRIMARY)** — friction reduction is the gestalt lift the parent feels at 2 AM. The current free-text-log surface fights the parent; "log 15 things per day" is unachievable. v1 inverts to "engine proposes, parent confirms" — most days reduce to ≤3 tap-confirms plus one chip-tap. Layout uniformization with Food Sub-Tab makes the Track-tab feel cohesive across all 5 sub-tabs.
- **Honesty (CO-PRIMARY)** — every in-window milestone claim hedge-tiered against clinical bands (Kael's risk register: never personalised); "practicing" is the canonical hedge state; sample-size + confidence travel with every surfaced milestone; empty-state voiced per CV3-003 ("Not in-window for any milestones yet" rather than blank).
- **Extensibility** — `ACTIVITY_CATEGORIES` single registry in `data.js` closes the 6-site home.js category-array drift defect inline (subsumes the candidate "activity-category-registry-v1" arc); milestone DB stays the row-addition substrate.

---

## Ratification record (2026-05-27)

Architect ratified all 10 scope questions with Lyra's proposed defaults via **"1-10 ratified"** + Charter-axis call **"warmth + honesty is right"** + sequencing call **"it should precede [R-6]."** Locked answers:

| # | Question | Ratified answer |
|---|---|---|
| 1 | Sub-tab count + naming | **3 sub-tabs: Log / Library / Patterns** (mirrors `food-sub-tab-v1`) |
| 2 | Primary daily-input primitive | **`activityLevel: 1-4` single-tap chip** (consumes the chronicle-reserved field; replaces 15-activity logging burden) |
| 3 | In-window milestone surface count | **1–3 cards above-the-fold** (clinical-range proposals; tap-confirm; never personalised predictions per Kael's risk register) |
| 4 | Activity-category vocabulary | **5 canonical: `motor` / `language` / `social` / `sensory` / `cognitive`** — single source of truth in `data.js` as `ACTIVITY_CATEGORIES` registry; closes the home.js 6-site drift inline |
| 5 | Confirmation states | **3 states: `confirmed` / `practicing` / `not-yet`** ("practicing" is the canonical hedge state) |
| 6 | Free-text log relocation | **Move existing Log Activity / Observation button into Log sub-tab; backward-compatible entry shape; legacy entries surface in Library "history" view** |
| 7 | Bulk-entry shape | **Grid of pre-filtered age-appropriate milestone chips + free-text fallback; categorized in the grid (no manual tagging)** |
| 8 | Scrapbook integration | **A scrapbook photo tagged to a milestone IS evidence** — surfaces in the milestone's evidence count (mechanism partly wired today at `template.html:1109 scrapMilestonePicker`) |
| 9 | Pediatric-visit prep card | **Ship a v1 cut in Patterns sub-tab now** (pulls from existing engine machinery; R-3 reservoir gets a head start) |
| 10 | Region routing for IMPL | **Maren primary** (home.js milestone surfaces — substantive code) + **Kael consult** (data.js ACTIVITY_CATEGORIES + milestone DB) + **Vela consult** (cross-domain milestone-window correlation card) + **triple-jurisdiction on styles.css** (sub-tab chrome) |

**Charter axis ratification:** Warmth + Honesty **co-primary** (mirrors v3-5's Warmth-primary with strong Honesty cross-cut).

**Sequencing ratification:** milestones-tab-v1 **PRECEDES R-6** — same pattern as food-sub-tab-v1 F-2 preceding v3-8 parseFeeding. R-6 IMPL reads the `activityLevel:1-4` capture surface + the consolidated milestone-evidence data shape this spec establishes.

---

## What v1 is

The Track-tab's 5th sub-tab (`#tab-milestones`) redesigned around **three input primitives** that dissolve the daily-input friction the current surface imposes:

1. **`activityLevel: 1-4` daily chip** — one tap per day; replaces 15-activity-logging burden; feeds R-6 at the schema layer
2. **In-window milestone proposals** — engine surfaces 1–3 expected milestones; parent confirms / adjusts in one tap each
3. **Bulk catch-up grid** — for exception cases; pre-filtered to age-appropriate milestones; categorized so no manual tagging

Plus **layout uniformization** (3-sub-tab Log / Library / Patterns mirrors Food Sub-Tab v1 — Track-tab feels cohesive across all 5 sub-tabs).

Plus three **return-visit surfaces** that make the tab worth opening:
- **"Today" header card** — narrates Ziva's current age + in-window milestones + last evidence (CV3-002 narrate-not-list)
- **Trajectory ribbon** — milestone-onset markers along Ziva's age axis, color-coded by confidence + clinical band
- **Pediatric-visit prep card** — "Things to mention" auto-derived from recent evidence (R-3 reservoir surface, v1 cut)

Plus the **`ACTIVITY_CATEGORIES` registry** in `data.js` closes the 6-site home.js category-array drift defect inline.

### The reframe (the doctrinal shift)

**Today:** parent logs activities → engine derives milestones from evidence.
**v1:** engine **proposes** in-window milestones → parent **confirms / adjusts** in one tap. Logging becomes the exception path, not the primary one.

This is the same posture-shift that made D3 tracking tolerable (v3-3 era) — the engine knew what was expected; the parent just confirmed presence/absence. Applied to milestones, it dissolves the "15 activities per day" failure mode.

---

## What v1 is NOT

- **Not a milestone-engine rewrite.** `_predictMilestoneWindow`, `getMilestoneEvidence`, evidence-engine confidence-tier infra all stay live; v1 changes the *surface*, not the engine semantics.
- **Not personalised milestone prediction.** Kael's risk-register doctrine holds: clinical ranges only. "Ziva will sit by 6 months" remains the canonical NOT-DO.
- **Not a free-text log removal.** Free-text entry stays available (sub-tab "Log → bulk catch-up → free-text fallback") for exception cases; the *primary* path becomes engine-proposes-parent-confirms.
- **Not a scrapbook redesign.** Scrapbook ↔ milestone integration is bidirectional-link only (photo-tagged-to-milestone IS evidence; surfaces in evidence count). The scrapbook UI itself is unchanged.
- **Not the R-3 audit/history layer in full.** The pediatric-visit prep card is a v1 cut from R-3's eventual scope (Wave 2 reservoir).
- **Not R-6 IMPL.** v1 establishes the `activityLevel:1-4` capture surface; R-6 reads it for growth correlation when R-6 opens.
- **Not an activity-history visualization.** Long-window history views (week/month/quarter) belong to R-3 Wave 2; v1 surfaces only the recent-evidence collapsed list + today's posture.

---

## The three input primitives

### Primitive 1 — `activityLevel: 1-4` daily chip

**Surface:** top of the **Log** sub-tab. Single horizontally-scrollable chip selector. Stored as `activityLevel: 1-4` on the day-record (the field the chronicle §4.2 reserves at line 636).

| Tier | Label | Description (parent-legible) |
|---|---|---|
| 1 | **Quiet** | Sick, sleepy, low engagement |
| 2 | **Calm** | Normal day, settled play |
| 3 | **Active** | Engaged, high-output day |
| 4 | **Peak** | "Couldn't stop moving" |

**One tap per day.** Already-set chip carries a subtle "set today" affordance (not the full v3-5 chip-state `done` chrome — this is a daily-input primitive, not an event-state chip).

**Honesty floor:** if not set, the day-record carries `activityLevel: null` — never inferred, never defaulted to `2`. R-6 reads `null` as "no signal", never as "calm."

**Empty-state phrasing** (CV3-003 honor): if today is unset and the chip strip is shown, the affordance reads "How was Ziva today?" — neutral prompt; no shame-tone.

**Storage shape:**

```js
// On the day-record (ziva_day_<dateKey>):
{
  // ...existing fields...
  activityLevel: 1 | 2 | 3 | 4 | null,   // chronicle-reserved field, now live
}
```

### Primitive 2 — In-window milestone proposals

**Surface:** above-the-fold card on the **Log** sub-tab (immediately under the daily-activeness chip).

**Engine read:** the `_predictMilestoneWindow(milestoneId, dob)` primitive returns `{expectedStart, expectedEnd, ageWeeks, status}` (per chronicle §4.4); v1 reads this for every milestone in the `MILESTONES_DB` and surfaces the 1–3 milestones whose expected-window is **currently open** for Ziva's age.

**Per-milestone row shape:**
- Milestone name (e.g., "Pointing")
- zi() icon (domain-keyed; read from `ACTIVITY_CATEGORIES[domain].icon`)
- Clinical-band disclosure: *"Typically 9–14 months (WHO). Ziva is 7m 24d — early band."* — never personalised
- Current engine status: `confirmed` (n=5 evidence, high-conf) / `practicing` (n=2, medium-conf) / `not-yet` (n=0)
- Three tap targets (the **confirmation states** ratified at Q5) — **HR-1 floor: all glyphs via `zi()`** (F3 /review skill-pass amendment 2026-05-27):
  - **`zi('check')` Saw it today** → adds a high-confidence evidence row + advances status if threshold met
  - **`zi('trending-flat')` Practicing** → adds a medium-confidence evidence row + sets status to practicing
  - **`zi('arrow-right')` Not yet** → suppresses this milestone in the in-window proposals for 7 days (parent told us; engine doesn't re-prompt)

The three zi() names above exist in the current 109-symbol sprite (sprite includes `check`, `trending-flat`, `arrow-right` — the latter two added in PR-EF Phase A per CLAUDE.md). Vela's render-layer audit may reassign at IMPL time within the existing sprite.

**Practicing-tap glyph note (G2 /review skill-pass amendment 2026-05-27):** the Practicing tap-state glyph was originally spec'd as `zi('sparkle')` but `sparkle` is also the canonical sensory-domain icon in `ACTIVITY_CATEGORIES` — meaning a sensory-domain milestone card would render `zi('sparkle')` as BOTH its milestone-domain icon AND its Practicing tap button (visual collision; half-awake-test ambiguity). Reassigned to `zi('trending-flat')` — semantically "steady, in-progress" matches the hedge-tier of the Practicing state and avoids the cross-meaning with the sensory domain.

**Confidence-floor honor (CV3-006 Honesty + Kael risk register):** an in-window proposal NEVER reads `_predictMilestoneWindow` output and renders without the *band* disclosure. The clinical band IS the hedge tier at the card tier (just as `_tsfHedgePhrase` is the hedge tier at the prose tier).

**Cap at 3 cards:** if more than 3 milestones are in-window, surface only the top 3 by engagement priority (a heuristic the IMPL author calibrates: probably "most-recently-progressing" + "longest-in-window-without-evidence" + "newest-in-window"). Remaining in-window milestones live in the **Library** sub-tab.

**Suppression-state storage (F1 /review skill-pass amendment 2026-05-27):** the "Not yet" tap stores a per-milestone suppress-until timestamp at a dedicated localStorage key:

```js
// localStorage key: ziva_milestone_suppress
// Shape:
{
  <milestoneKey>: <epochMs>,  // e.g., 'pointing': 1717182000000
  // ...
}
```

Sync-replicable via the existing Firebase sync pipeline (same shape pattern as other ziva_* keys). The in-window proposal selector reads this map and filters out milestones whose suppress-until is still future. Auto-expires after 7 days (no manual unsuppress UI in v1; future v1.x candidate if Architect needs it). Mirrors the existing per-milestone manual-override mechanism shape at `home.js:2148` ("Edit Override (engine: practicing)").

### Primitive 3 — Bulk catch-up grid

**Surface:** **Log** sub-tab, below the in-window cards. Collapsed-by-default; expands via "Log more activities" CTA.

**Shape:** a grid of pre-filled chips keyed to **age-appropriate milestones** (every milestone in `MILESTONES_DB` where Ziva's age intersects `_predictMilestoneWindow`'s expectedStart..expectedEnd window, plus a 2-week pre-window grace). Each chip pre-categorized by domain (motor / language / social / sensory / cognitive — read from the **ACTIVITY_CATEGORIES** registry, see below).

**Tap-tap-done flow:**
1. Parent taps "Log more activities"
2. Grid expands, ordered by domain (sage = motor, lavender = language, indigo = social, peach = sensory, sky = cognitive — TBD at IMPL-time; design system 7-domain palette consulted)
3. Parent taps the chips matching what they observed
4. Submit → all selected chips add evidence rows at medium-confidence default
5. Free-text fallback at the bottom for "something else not listed" (preserves backward compatibility with existing free-text Log Activity / Observation entry)

**No manual category-tagging.** The category is the chip's domain; the parent never picks "motor" from a dropdown.

**Backward compatibility:** legacy free-text entries (pre-v1) preserve their shape; surface in Library sub-tab's "history" view (Q6 ratified). New entries via this grid carry the new structured shape.

---

## The 3-sub-tab layout

Mirrors `food-sub-tab-v1`'s Log / Library / Patterns triple. Sub-tab navigation chrome uniformized across all Track sub-tabs (styles.css touch — triple-jurisdiction).

### Log sub-tab — daily input + return-visit "Today" header

Order:

1. **"Today" header card** — see §Three return-visit surfaces below
2. **`activityLevel: 1-4` chip strip** (Primitive 1)
3. **In-window milestone proposals** (Primitive 2 — up to 3 cards)
4. **Bulk catch-up grid** (Primitive 3 — collapsed by default)
5. **Recent evidence feed** (existing surface, collapsed by default; v1 preserves the chronological history view)

**Relocation contract (G3 /review skill-pass amendment 2026-05-27):** the F2 "relocate from flat layout" operations across Library + Patterns are **template-restructure only**. Existing element IDs (`#milestonesDomainHero` / `#milestoneStats` / `#milestoneHighlights` / `#msCatWheels` / `#recentEvidenceFeed` / `#msActiveMilestones`) and their corresponding `home.js` render-function bindings (`getElementById` consumers) are **preserved unchanged**. The IMPL diff moves the `<div id="...">` wrappers into the new sub-tab containers; the JS-side fetch-by-ID contract continues to resolve. No render-function refactor required for the relocation itself.

### Library sub-tab — full milestone DB browsable

Order:

1. **`#milestonesDomainHero`** (existing card, relocated from the flat layout — F2 /review skill-pass amendment 2026-05-27) — the cross-domain milestone hero score sits at the top of Library as the "where Ziva is overall" orienting card
2. **Domain filter chips** — motor / language / social / sensory / cognitive (read from ACTIVITY_CATEGORIES)
3. **Age-band sectioning** — milestones grouped by clinical-range start age; collapses-by-default outside Ziva's current 6-month band
4. **Per-milestone card** — name + clinical band + current status + cumulative evidence count + tap-to-confirm (same three-state tap targets as Primitive 2)
5. **Legacy history view** — collapsed; lists pre-v1 free-text Log Activity entries (Q6 ratified — backward-compat surface)

### Patterns sub-tab — engine-derived insights

Order:

1. **`#milestoneStats` pills** (existing surface, relocated from the flat layout — F2 /review skill-pass amendment 2026-05-27) — the per-domain stat pills sit at the top of Patterns as the at-a-glance numeric summary
2. **`#milestoneHighlights` card** (existing surface, relocated — F2) — the celebratory + concerning highlights surface, lifted from the flat layout
3. **Category Progress wheels** — existing `#msCatWheels`; reads ACTIVITY_CATEGORIES registry (no longer the hard-coded 4-category array)
4. **Weekly summary card** — narrate this week's evidence ("3 new motor; 2 language; pointing now consistent") per CV3-002
5. **Pediatric-visit prep card** — see §Three return-visit surfaces below
6. **Milestone-window correlation card** — surfaces v3-4 `renderInfoMilestoneSleepCorrelation` from the Info tab via tap-to-jump cross-link (F6 /review skill-pass amendment 2026-05-27; tab-routing-fix per G1 amendment 2026-05-27): inline teaser passage rendered from the v3-4 narrative-prose template + a tap target with `data-action="switchTab" data-arg="info"` that opens the Info tab (template.html:1589 `id="tab-info"`) scrolled to the full card. The card itself stays canonically in `intelligence-cards.js` (Vela's region); the milestones tab renders the teaser + link.

### Sub-tab navigation chrome

Same horizontal scroll + chip-selector pattern food-sub-tab-v1 specifies. Active sub-tab carries lavender accent (the milestone domain color per the design-system 7-domain table). data-action delegation per HR-3 / HR-6.

---

## The `ACTIVITY_CATEGORIES` registry — closes the home.js 6-site drift

**Today (defect):** activity-category vocabulary is enumerated as hard-coded arrays at six different sites in `home.js`, drifting between 4-cat and 5-cat shapes:

| Site | Enumeration | Drift |
|---|---|---|
| `home.js:1670` | `['motor','sensory','language','social']` | no `cognitive` |
| `home.js:1860` | `['motor','language','social','cognitive']` | no `sensory` |
| `home.js:2258` / `:2298` / `:2312` | `['motor','language','social','cognitive']` | no `sensory` |
| `home.js:2495` | `{motor, language, social, cognitive, sensory}` (5-shape) | none — canonical |
| `home.js:3798` | `{motor, language, social, cognitive}` | no `sensory` |

This is a classic Charter axis-2 (Extensibility) defect — the enumeration is code-driven, not data-driven, and has drifted across consumer sites. **v1 closes it inline.**

### Registry shape (in `data.js`, Kael's region)

```js
/**
 * ACTIVITY_CATEGORIES — single source of truth for the activity-evidence
 * domain vocabulary. Closes the 6-site home.js drift surfaced by milestones-
 * tab-v1 ratification. Read by every milestone-tab consumer (Log / Library /
 * Patterns) + every existing home.js milestone-render site.
 *
 * 5 canonical categories per Architect ratification 2026-05-27 (Q4).
 *
 * Mirrors the v3-5 _TSF_CHIP_STATES doctrine + v3-6 _CARD_PRIORITY_TIERS
 * doctrine: single constant; consumers read by key; build-time audit gate
 * forbids ad-hoc enumeration.
 */
window.ACTIVITY_CATEGORIES = [
  { key: 'motor',     label: 'Motor',     icon: 'run',       accent: 'sage'     },
  { key: 'language',  label: 'Language',  icon: 'chat',      accent: 'lavender' },
  { key: 'social',    label: 'Social',    icon: 'handshake', accent: 'indigo'   },
  { key: 'sensory',   label: 'Sensory',   icon: 'sparkle',   accent: 'peach'    },
  { key: 'cognitive', label: 'Cognitive', icon: 'brain',     accent: 'sky'      },
];
```

**Accent assignments — v1 calibration subject to Vela's render-layer audit (F10 /review skill-pass amendment 2026-05-27):** the five accent assignments above use the design-system 7-domain palette but overlap with established semantic colors — specifically, `lavender` is the design-system color for "Milestones, achievements, intelligence" *generally* (used as the milestones-tab accent itself), and `sky` is reserved for "Sleep, hydration." Assigning these to language and cognitive sub-categories creates implicit cognitive load. The v1 assignments are a starting point; Vela's render-layer audit at IMPL time may reassign within the 7-domain palette to relieve the overlap (candidate alternative: language → indigo, social → peach, cognitive → amber, freeing sky+lavender for their established meanings; sage stays on motor as the developmental/positive-status anchor). The audit-gate enforces the registry-as-source-of-truth either way; the specific token values are calibration, not contract.

### Registry doctrine

Five categories. **No more without a canon-cc-027 amendment.** The milestone DB rows in `data.js` already carry `domain: '<one of these keys>'`; the registry locks the consumer surface to the same vocabulary.

### Build-time audit gate

`split/audit-activity-categories-v1.sh` — **8th or 9th audit gate depending on v3-4 IMPL sequencing** (F8 /review skill-pass amendment 2026-05-27): if v3-4 IMPL lands first, this is the 9th gate (audit-card-priority-v3-6 7th → audit-narrative-prose-v3-4 8th → audit-activity-categories-v1 9th); if milestones-tab-v1 IMPL lands first, this is the 8th. Either ordering is acceptable per the sequencing (mutex-independent arcs).

**Banned patterns — TWO scopes per F9 /review skill-pass amendment 2026-05-27:**

*Scope A — Activity-category enumeration drift (the spec's primary scope):*
- `['motor'.*'language'.*'social'` and permutations (hard-coded category arrays)
- `\bcatOrder\s*=` (the home.js drift idiom)
- Object literals with the category keys as fixed top-level keys (e.g., `{ motor: ..., language: ..., social: ... }`) outside the registry consumer pattern

*Scope B — Personalised-milestone-prediction prose (the Kael risk-register floor):*
- `Ziva will\s+[a-z]+\s+by\s+\d` — the canonical no-go pattern ("Ziva will sit by 6 months")
- `Ziva (should|is going to|is expected to)\s+[a-z]+\s+by\s+\d`
- Any interpolation that combines `_predictMilestoneWindow` output with `dob` to render a personalised-date prediction in rendered prose

The audit script enforces both scopes; the two banned-pattern sets are documented separately in the script body so future contributors can extend either scope without conflating the concerns.

**Opt-in escape:** `// activity-categories-ok: <rationale>` (scope A) OR `// no-personalised-prediction-ok: <rationale>` (scope B) on the same line, per HR-12 / chip-taxonomy convention.

### Three-site sync meta-audit (continues the v3-6 pattern)

`regression-guard-milestones-tab-v1-category-registry-sync` — runtime e2e:
- `window.ACTIVITY_CATEGORIES.length === 5`
- Every milestone in `MILESTONES_DB` has a `domain` matching one of the registry keys
- Every consumer site (Log / Library / Patterns sub-tabs) iterates the registry, not a hard-coded array

Closes the same Extensibility-axis pattern v3-6 closed for card priority + v3-5 closed for chip state.

---

## Three return-visit surfaces (the "worth it" tier)

These are why a parent OPENS this tab beyond data-entry burden.

### "Today" header card (top of Log sub-tab)

**Single-sentence narration** of Ziva's current milestone posture per CV3-002:

> *"Ziva is 7m 24d. In-window: pointing, pincer grasp, first words. Last evidence: pointing at the cat (yesterday)."*

Renders even when no in-window milestones (CV3-003 empty-state honor):

> *"Ziva is 4m 12d. No milestones in-window yet — early days. Tap Library to explore what's next."*

**Mid-state narration template (F5 /review skill-pass amendment 2026-05-27)** — in-window milestones present but no recent evidence (the common case for a low-engagement week):

> *"Ziva is 7m 24d. In-window: pointing, pincer grasp. No new evidence this week — quiet stretch."*

The three templates (full-data, empty-state, mid-state-no-recent-evidence) are the v1 canonical voice-set; IMPL author may add additional conditional shapes within the same hedge-tier discipline. The narration helper consumes the v3-4 `_NARRATIVE_PROSE_TEMPLATES` registry pattern at IMPL time (template-row likely keyed `'milestonesTodayHeader'` with `hedgeTierMap` / `sampleFloor` / `emptyState` fields per v3-4 spec).

Honesty floor: never overclaims; never personalises beyond clinical bands.

### Trajectory ribbon (Patterns sub-tab top OR shared across all 3 sub-tabs — IMPL call)

**Horizontal timeline ribbon** showing milestone-onset markers along Ziva's age axis (birth → current → 24m). Each marker:
- Position: confirmed-date OR clinical-band-midpoint if not-yet-confirmed
- Color: domain-keyed (read from ACTIVITY_CATEGORIES.accent)
- Shape: filled = confirmed; outlined = practicing; dashed = not-yet
- Tap → opens the milestone row in Library sub-tab

Parent sees the **arc** of Ziva's development at a glance. Lavender background accent (milestone domain).

**Marker-filter scope (F4 /review skill-pass amendment 2026-05-27):** the ribbon does NOT render every milestone in MILESTONES_DB. The v1 marker-set is constrained to **confirmed + practicing + currently-in-window**:
- All `confirmed` milestones (their actual confirmed-date marker)
- All `practicing` milestones (clinical-band-midpoint marker, outlined)
- All milestones whose clinical-band intersects `birth..currentAge+3m` (the active+near-future band, dashed)

This caps the marker count at ~30-40 in the typical case rather than the full ~100+ from MILESTONES_DB, keeping the 200ms perf budget achievable on mobile. Far-future not-yet milestones live in the Library sub-tab's age-band sectioning, not on the ribbon.

**Performance gate:** ribbon renders within 200ms of tab-switch (cipher-3 budget; same as v3-5 story-arc summary).

### Pediatric-visit prep card (Patterns sub-tab)

**Auto-derived "Things to mention"** card. Pulls from:
- Recent evidence (last 30 days) — high-conf confirmations
- In-window milestones currently practicing
- Any CareTickets active (cross-domain disclosure)
- Recent regressions (a milestone that was confirmed and is now showing no evidence for 14+ days)

Renders as a narrated passage per CV3-002:

> *"Next visit: not yet scheduled. Things to mention this month: pointing confirmed (5 obs, high-conf); standing-with-support practicing (2 obs); food-introduction rate steady (12 new foods in 30 days)."*

Includes a tap-to-export-PDF (v1 minimum: tap-to-copy-as-text; PDF export is R-3 reservoir, deferred).

---

## Files touched + LOC estimate

| File | Region | Type | Lines (estimate) |
|---|---|---|---|
| `split/template.html` | Shared — triple-jurisdiction | New 3-sub-tab scaffold replaces existing `#tab-milestones` 7-card stack | ~180 changed (mostly restructure) |
| `split/styles.css` | Shared — triple-jurisdiction | Sub-tab navigation chrome (uniformized w/ food-sub-tab); `activityLevel` chip variants; trajectory ribbon styles; pediatric-prep card styles | ~150 added |
| `split/data.js` | Kael | `ACTIVITY_CATEGORIES` registry (5 rows); milestone DB unchanged (already carries `domain` field) | ~30 added |
| `split/home.js` | Maren | New milestone-tab render functions (Log / Library / Patterns sub-tabs); `activityLevel:1-4` chip handler; in-window proposal renderer; bulk catch-up grid; "Today" header card; trajectory ribbon; pediatric-prep card; refactor 6 existing category-array sites to read `ACTIVITY_CATEGORIES` | ~600 added, ~150 changed |
| `split/core.js` | Kael | `_getActivityLevelToday(dateKey)` getter + setter; `_getInWindowMilestones(ageDays, n)` selector (caps at 3 by engagement priority) | ~80 added |
| `split/audit-activity-categories-v1.sh` (NEW) | — | Build-time audit gate (9th total at IMPL ship) | ~110 |
| `split/build.sh` | shared | Wire `audit-activity-categories-v1` alongside existing 8 audits | ~5 changed |
| `tests/e2e/milestones-tab-v1.spec.ts` (NEW) | — | E2E tests (~25 regression guards per §Test plan) | ~600 |

**Total LOC estimate:** ~1,920 (substantial — comparable to v3-6 IMPL's ~1,984). Most of the burn is in `home.js` render functions + e2e coverage.

---

## canon-cc-008 routing at IMPL time

**Maren primary** — `home.js` is the heaviest-touched Region (~600 added LOC for the new render machinery). Maren also owns the Care-floor on milestone surfaces: clinical-range disclosure discipline, "Ziva at early/typical/late band" framing, no-personalised-predictions floor.

**Kael consult** — `data.js` ACTIVITY_CATEGORIES registry + `core.js` engine helpers (`_getActivityLevelToday`, `_getInWindowMilestones`). Engine-grain audit on the milestone-engine read contract (`_predictMilestoneWindow` consumer-side discipline; never reads strength/confidence and substitutes into prose — closes the same cosmetic-NOTE floor that walked at sleep arc 3 + v3-6).

**Vela consult** — the trajectory ribbon + "Today" header card render in `home.js` (Maren's region) but the comprehension-axis half-awake-test on the warmth-primary axis is Vela's lens; pair-note enumerated.

**Sequential triple-jurisdiction on styles.css** — per cipher-9 rotation. Rotation order: **Maren → Kael → Vela** (Maren is first-Gov by heaviest-touched Region = home.js consumer surfaces). Each Governor's findings inform the next round.

**Cipher Edict V** last, with three Charter-axis cross-checks per CV3-006 (Warmth + Honesty co-primary; Extensibility cross-cut via ACTIVITY_CATEGORIES registry).

---

## Test plan

### Functional tests — input primitives

| Test | Asserts |
|---|---|
| `regression-guard-milestones-v1-activitylevel-chip-set` | Tapping a 1-4 chip sets `activityLevel` on today's day-record |
| `regression-guard-milestones-v1-activitylevel-null-default` | Unset day-record carries `activityLevel: null` (never defaults to 2) |
| `regression-guard-milestones-v1-activitylevel-idempotent` | Re-tapping the same chip is idempotent; tapping a different chip replaces |
| `regression-guard-milestones-v1-inwindow-cap-3` | At most 3 in-window milestone cards surface; overflow lives in Library |
| `regression-guard-milestones-v1-inwindow-confirm-evidence` | Tap "Saw it today" adds high-conf evidence row + advances status |
| `regression-guard-milestones-v1-inwindow-practicing-evidence` | Tap "Practicing" adds medium-conf evidence row + sets status to practicing |
| `regression-guard-milestones-v1-inwindow-not-yet-suppression` | Tap "Not yet" suppresses milestone from in-window proposals for 7 days |
| `regression-guard-milestones-v1-bulk-grid-categorized` | Bulk-grid chips render pre-categorized by domain; no manual tagging |
| `regression-guard-milestones-v1-bulk-grid-age-filtered` | Bulk-grid surfaces only age-appropriate milestones (current window + 2w pre-grace) |
| `regression-guard-milestones-v1-freetext-fallback` | Free-text entry path remains available; legacy free-text entries surface in Library history |

### Functional tests — ACTIVITY_CATEGORIES registry

| Test | Asserts |
|---|---|
| `regression-guard-milestones-v1-category-registry-sync` | **Meta-audit** — `ACTIVITY_CATEGORIES.length === 5` AND every milestone in `MILESTONES_DB` has a `domain` matching a registry key AND every consumer site iterates the registry |
| `regression-guard-milestones-v1-no-adhoc-category-arrays` | Build-time grep: no hard-coded category arrays outside the registry (closes the 6-site home.js drift) |
| `regression-guard-milestones-v1-category-progress-wheels-5-cats` | Patterns sub-tab Category Progress wheels render all 5 categories (closes the wheel-display drift) |

### Functional tests — honesty floor + clinical-range discipline

| Test | Asserts |
|---|---|
| `regression-guard-milestones-v1-clinical-band-disclosed` | Every in-window proposal renders "Typically X–Y months (standard); Ziva is Z — band" — never personalised prediction |
| `regression-guard-milestones-v1-no-personalised-prediction` | Render text NEVER contains "Ziva will [milestone] by [date]" or sibling patterns; build-time grep gate Scope B of `audit-activity-categories-v1.sh` (F9 amendment — two-scope audit script) |
| `regression-guard-milestones-v1-empty-state-voiced` | Empty in-window state renders "No milestones in-window yet — early days" per CV3-003; never blank |
| `regression-guard-milestones-v1-strength-not-rendered` | Engine-internal `strength` / `confidence` field labels never `.text`-substituted into rendered prose (carries forward from 2026-05-26 cosmetic NOTE family) |

### Functional tests — return-visit surfaces

| Test | Asserts |
|---|---|
| `regression-guard-milestones-v1-today-header-narrates` | "Today" header card renders Ziva's age + in-window list + last evidence as a single sentence (CV3-002 honor) |
| `regression-guard-milestones-v1-today-header-empty-state` | Empty-state today header renders the early-days voice (no blank) |
| `regression-guard-milestones-v1-today-header-mid-state` | **(F5 amendment)** Mid-state today header (in-window present, no recent evidence) renders the "quiet stretch" voice template — neither empty-state nor full-data |
| `regression-guard-milestones-v1-trajectory-ribbon-paints` | Trajectory ribbon paints confirmed + practicing + in-window milestones (per F4 marker-filter scope) within 200ms (cipher-3 perf budget) |
| `regression-guard-milestones-v1-trajectory-ribbon-marker-filter` | **(F4 amendment)** Ribbon does NOT render far-future not-yet milestones (those whose clinical-band starts >3m beyond currentAge); they live in Library age-band sectioning instead |
| `regression-guard-milestones-v1-trajectory-ribbon-tap-routes-to-library` | Tap on a ribbon marker opens the corresponding milestone row in Library sub-tab |
| `regression-guard-milestones-v1-pediatric-prep-derives` | Pediatric-prep card surfaces ≥1 narrated bullet when there is ≥1 high-conf confirmation OR practicing milestone OR active CareTicket in last 30 days |
| `regression-guard-milestones-v1-pediatric-prep-copy-as-text` | Tap-to-copy-as-text path delivers the rendered prose to clipboard (PDF export deferred to R-3) |
| `regression-guard-milestones-v1-patterns-correlation-cross-link` | **(F6 + G1 amendments)** Patterns sub-tab Milestone-window correlation cross-link renders an inline teaser passage + carries `data-action="switchTab" data-arg="info"` tap target (NOT `insights` — that routes to the wrong tab; G1 corrected) that opens the Info tab (`#tab-info`, template.html:1589) |

### Functional tests — backward-compat & integration (F7 /review skill-pass amendment 2026-05-27)

| Test | Asserts |
|---|---|
| `regression-guard-milestones-v1-backward-compat-legacy-entries` | Pre-v1 free-text Log Activity entries surface in Library sub-tab's "history" view (Q6 ratification); their original shape preserved; never silently dropped |
| `regression-guard-milestones-v1-scrapbook-evidence-integration` | A scrapbook photo tagged to a milestone via `scrapMilestonePicker` (template.html:1109) contributes to that milestone's evidence count rendered on its in-window proposal card + Library row (Q8 ratification — bidirectional link) |
| `regression-guard-milestones-v1-suppress-state-storage` | **(F1 amendment)** "Not yet" tap writes to `ziva_milestone_suppress` localStorage key in the documented per-milestone shape; suppression auto-expires after 7 days; suppressed milestones do NOT appear in in-window proposals during the suppress window |

### Functional tests — layout uniformization

| Test | Asserts |
|---|---|
| `regression-guard-milestones-v1-three-subtabs-render` | Log / Library / Patterns sub-tabs all exist + are navigable |
| `regression-guard-milestones-v1-subtab-chrome-matches-food` | Sub-tab navigation chrome computed-style matches food-sub-tab (uniformization) |
| `regression-guard-milestones-v1-active-subtab-lavender-accent` | Active sub-tab carries the lavender accent (milestone domain color) |
| `regression-guard-milestones-v1-screen-reader-order` | DOM reading order = visual order (a11y honor; same as v3-6 card sort) |

### Half-awake fixture (cipher-2)

| Test | Asserts |
|---|---|
| `regression-guard-milestones-v1-half-awake-test` | Manual fixture per cipher-2: n=5 partial-attention sessions, ≥4/5 set the daily `activityLevel` chip in ≤2s AND confirm an in-window milestone in ≤3s |

### Regression sweep

All existing milestone-related tests must remain green. Pre-existing free-text Log Activity / Observation entries remain readable + don't disappear from the surface.

---

## HR pre-check

| HR | Risk | Mitigation |
|----|------|------------|
| HR-1 (no emojis) | low | All glyphs via existing `zi()` symbols (run / chat / handshake / sparkle / brain already in sprite) |
| HR-2 (no inline styles) | medium | Trajectory ribbon + chip strip + bulk-grid all class-driven; no inline `style="..."` — verify in IMPL |
| HR-3 (no inline handlers) | low | `data-action` delegation throughout; tap-confirm uses existing milestone-confirm handler pattern |
| HR-4 (escHtml at boundaries) | **medium** | "Today" header narration + pediatric-prep card narration + trajectory-ribbon labels — all engine-derived prose; every interpolation passes through `escHtml` at render boundary |
| HR-5 (tokens-only) | low | All tier chrome binds to design-system 7-domain tokens (sage / rose / amber / lavender / sky / indigo / peach); no ad-hoc hex |
| HR-6 (data-action delegation) | low | Inherited from existing patterns |
| HR-9 (post-build multi-round QA) | structural | canon-cc-008 triple-jurisdiction chain runs at IMPL time |
| HR-10 (no text-overflow ellipsis) | low | Trajectory ribbon labels use line-wrap, not ellipsis; in-window proposals carry full clinical-band text |
| HR-12 (timezone-safe dates) | low | `activityLevel` writes to existing day-record (already timezone-safe via `today()` helper) |

---

## Charter compliance per CV3-006

### Axis 1 — Intellectual honesty (CO-PRIMARY)

- ✓ Every in-window milestone surfaces with clinical-band disclosure ("Typically 9–14 months (WHO)"); never personalised
- ✓ "Practicing" is the canonical hedge state — the visual contract for "engine sees evidence but threshold not met"
- ✓ Sample-size travels with every surfaced milestone (evidence count rendered alongside status)
- ✓ Empty-state voiced per CV3-003 ("No milestones in-window yet — early days" rather than blank)
- ✓ `activityLevel: null` is the honest "no signal" state — never inferred, never defaulted
- ✓ `strength` / `confidence` engine-internal labels never `.text`-substituted into rendered prose (carries forward the 2026-05-26 §3 cosmetic NOTE family closed at sleep arc 3 + v3-6)
- ✓ Pediatric-prep card derives from real evidence; doesn't fabricate

### Axis 2 — Architectural extensibility

- ✓ `ACTIVITY_CATEGORIES` single registry in `data.js` closes the 6-site home.js drift defect (subsumes candidate arc B)
- ✓ Build-time audit gate (`audit-activity-categories-v1.sh`) forbids ad-hoc category arrays; opt-in marker for legitimate carve-outs
- ✓ Three-site sync meta-audit (`regression-guard-milestones-tab-v1-category-registry-sync`) continues the v3-5 / v3-6 pattern — registry constant ↔ MILESTONES_DB domain values ↔ consumer iterations all enforced
- ✓ Milestone DB stays the row-addition substrate — adding a new milestone = adding a row, no consumer code change
- ✓ `activityLevel: 1-4` is a closed enumeration (no canon-cc-027 amendment required to add tiers — but the labels are tokens, ratifiable inline)

### Axis 3 — Linguistic + visual warmth (CO-PRIMARY)

- ✓ **Friction reduction at the input tier** — daily chip + tap-confirm collapses 15-activities-per-day to ≤3 taps most days
- ✓ Layout uniformization with food-sub-tab — Track-tab feels cohesive across all 5 sub-tabs
- ✓ "Today" header card narrates per CV3-002 (narrate-not-list)
- ✓ Trajectory ribbon = the gestalt-arc surface (parent sees Ziva's development at a glance)
- ✓ Pediatric-prep card = "open the tab between visits" value (return-visit motivation)
- ✓ All tier chrome binds to domain tokens (cozy nursery journal aesthetic preserved)
- ✓ No emoji, no decorative icons (HR-1 + Charter Warmth)
- ✓ Half-awake-test fixture at the daily-chip-tap tier (cipher-2 protocol)

### Axes the spec could risk regressing — with mitigations

- **Warmth (in-window surface noise):** if the cap-at-3 heuristic mis-prioritizes, parents see milestones they don't care about. **Mitigation:** the heuristic is calibrated at IMPL-time; "Not yet" tap suppresses for 7 days (parent feedback loop). cipher-2 fixture verifies <3-second confirmation latency.
- **Honesty (clinical-band edge cases):** Ziva is currently 7-8 months; many milestone windows are "9-14 months" — the early-band disclosure may surface too aggressively. **Mitigation:** the 2-week pre-grace already in the bulk-grid filter mirrors here; if needed at IMPL, the in-window selector ignores milestones >4 weeks ahead of expectedStart.

---

## Cross-Region pair-notes (CV3-004 required section)

### Pair-note to Kael

**What Maren needs from Kael:** the `ACTIVITY_CATEGORIES` registry placement in `data.js` (Kael's region) + the engine helpers (`_getActivityLevelToday`, `_getInWindowMilestones`) in `core.js` (Kael's region). The milestone DB itself stays where it is; the consumer surface in `home.js` reads via the new helpers + the registry.

Specific contracts Kael owns:
- `ACTIVITY_CATEGORIES` shape (5 rows, schema as enumerated above)
- `_getInWindowMilestones(ageDays, n)` returns at most `n` milestone objects ordered by engagement priority (heuristic calibrated at IMPL-time)
- `_predictMilestoneWindow` read discipline: consumer never substitutes engine-internal `strength` / `confidence` labels into rendered prose
- `MILESTONES_DB` rows keep their `domain` field; the registry locks the consumer to the same vocabulary

### Pair-note to Vela

**What Maren needs from Vela:** half-awake-test sign-off on the "Today" header card narration shape + the trajectory ribbon visual contract + the pediatric-prep card narration shape. These render in `home.js` (Maren's region) but the comprehension axis is Vela's lens — the parent at 2 AM reading the in-window proposals MUST identify the most-actionable confirm-tap within 3 seconds.

Specific items Vela signs:
- "Today" header empty-state voice ("early days" framing — not silent blank)
- Trajectory ribbon marker visual hierarchy (confirmed > practicing > not-yet; same severity-floor logic as v3-6 card tiers)
- Pediatric-prep card prose tone (warm clinical, not flat instrumental)
- Sub-tab chrome uniformization computed-style match against food-sub-tab

### Coordination — sequential triple-jurisdiction on styles.css

Per cipher-9 rotation: **Maren → Kael → Vela** (Maren first-Gov by heaviest-touched Region). Each Governor's findings inform the next round; Lyra synthesizes all three; Cipher Edict V last.

---

## Out-of-scope (registered, not in v1)

- **R-6 IMPL (Growth + Activity integrator).** v1 establishes the `activityLevel:1-4` capture surface; R-6 reads it for growth-correlation when R-6 opens. R-6 stays a Wave 2 silver capstone reservoir item.
- **R-3 audit/history layer in full.** Pediatric-visit prep card is a v1 cut from R-3's eventual scope (week / month / quarter views; PDF export; scrapbook + photo weaving). PDF export deferred — v1 minimum is tap-to-copy-as-text.
- **R-8 knowledge-graph layer.** Milestone DB as a graph node (linked to Food / Illness / NUTRITION / Standards) is R-8 reservoir; v1 doesn't reshape the milestone DB structure.
- **Activity-history visualization (week/month/quarter).** Long-window history views belong to R-3 Wave 2.
- **Multi-language milestone DB.** Hindi `_hindi_*` context strings preserved (already in MILESTONES_DB rows); i18n proper is C-12 Wave 3 catchment.
- **ML-based milestone calibration.** Kael's risk register named this as a permanent v3.0 NOT-DO (no personalised predictions); v3.x+ post-Architect-ratification under canon-cc-027.
- **Predictive milestone surfaces.** Kael's `_predictMilestoneWindow` returns clinical ranges only. R-2 forecast surfaces (Wave 2) consume the same primitive with the same hedge-tier floor; that's R-2's scope, not v1's.
- **Scrapbook UI redesign.** v1 wires scrapbook ↔ milestone link as bidirectional evidence; the scrapbook surface itself is untouched.
- **PDF export of pediatric-prep.** v1 ships tap-to-copy-as-text; PDF is R-3 territory.
- **Trajectory ribbon zoom/pan/filter.** v1 ships static-window ribbon (birth → current → 24m); interactive controls are a future v1.x candidate if cipher-2 demands.

---

## Sequencing

**Upstream gates (all clear):**
- ✓ `food-sub-tab-v1` ratified (precedent for Log/Library/Patterns shape)
- ✓ v3-5 ratified (`_tsfHedgePhrase` pattern; chip-state attribute discipline — applied to in-window confirm chips)
- ✓ v3-6 ratified (`data-card-priority` pattern + meta-audit closure — applied to in-window proposal cards)
- ✓ v3-4 spec ratified (narrative-prose templates; the pediatric-prep card + "Today" header consume the same CV3-002 narration discipline — but the templates themselves stay in v3-4's `_NARRATIVE_PROSE_TEMPLATES` registry; v1 doesn't add new template rows)
- ✓ Day-record schema reservation for `activityLevel:1-4` (chronicle §4.2)

**Downstream unblocked by v1:**
- **R-6 — Growth + Activity integrator** (Wave 2 silver capstone) — reads the `activityLevel:1-4` capture surface this spec establishes. Same sequencing pattern as food-sub-tab-v1 F-2 preceding v3-8 parseFeeding.
- **R-3 — Audit / history layer** — the v1 pediatric-prep card is the first cut; R-3 expands to week/month/quarter + PDF + scrapbook weaving.
- **R-2 — Predictive surface** (Wave 2) — the in-window proposal pattern + the clinical-band disclosure discipline both inform R-2's forecast surface shape.

**Parallel candidates with v1 IMPL:**
- v3-1 spec authoring (CT Notifications) — independent Region, mutex-independent
- v3-6-quicklog-tier-followup (V-V-39 named follow-up) — Vela-region; independent
- offsetdatestr-tz-hazard-fix (V-K-95 named follow-up) — Kael-region; independent

**styles.css mutex (Cipher cipher-9):**
- All v3.0 styles.css mutex positions (v3-5 / v3-6) are RELEASED as of session-end 2026-05-27
- v3-1 holds position 3 (still draft; styles.css branch openable)
- milestones-tab-v1 holds position 4 — sub-tab chrome triple-jurisdiction; can open after v3-1 closes OR before v3-1 opens (Architect call at IMPL-pass timing)

---

## Review-pass amendments (canon-cc-022)

Ten findings from the in-transcript `/review` skill pass on 2026-05-27 (NOT an Edict V chain entry — skill-grade, in-transcript register-flip per canon-cc-022). Folded inline to canonicalize before merge so the IMPL author sees them as part of the spec body, not as a separate PR-thread artifact. Mirrors the canon-cc-022 register-flip pattern from PR #141 (v3-6 spec F1-F6 fold).

| # | Folded into | Substance |
|---|---|---|
| **F1** | §Primitive 2 (suppression-state storage IMPL-note) | "Not yet" tap stores per-milestone suppress-until at `ziva_milestone_suppress` localStorage key in `{ <milestoneKey>: <epochMs> }` shape; Firebase-sync replicable; auto-expires after 7 days; no manual unsuppress UI in v1. |
| **F2** | §3-sub-tab layout (Library + Patterns ordering) | Existing 7-card flat layout's `#milestonesDomainHero` → top of Library sub-tab; `#milestoneStats` + `#milestoneHighlights` → top of Patterns sub-tab. Each existing surface gets an explicit new home. |
| **F3** | §Primitive 2 (zi() name mapping for tap states) | HR-1 floor on tap-target glyphs: `zi('check')` / `zi('trending-flat')` / `zi('arrow-right')` for Saw-it / Practicing / Not-yet. All three exist in the 109-symbol sprite. *(Practicing glyph reassigned from `sparkle` to `trending-flat` per G2 second-pass — see G-series below.)* |
| **F4** | §Trajectory ribbon (marker-filter scope) | Ribbon does NOT render every milestone in MILESTONES_DB. v1 marker-set = confirmed + practicing + milestones whose clinical-band intersects `birth..currentAge+3m`. Caps marker count at ~30-40; preserves 200ms perf budget on mobile. |
| **F5** | §"Today" header card (mid-state narration template) | Third canonical narration template added: in-window present, no recent evidence ("Ziva is 7m 24d. In-window: pointing, pincer grasp. No new evidence this week — quiet stretch."). Helper consumes the v3-4 `_NARRATIVE_PROSE_TEMPLATES` registry pattern at IMPL time. |
| **F6** | §Patterns sub-tab (Milestone-window correlation cross-link shape) | Cross-link is **tap-to-jump** via `data-action="switchTab" data-arg="info"`; inline teaser passage rendered from v3-4 narrative-prose template; canonical card stays in `intelligence-cards.js` (Vela's region). *(Tab-routing target corrected from `insights` → `info` per G1 second-pass — the Info tab is `id="tab-info"` at template.html:1589; `tab-insights` is a different tab. See G-series below.)* |
| **F7** | §Test plan (new §backward-compat & integration sub-section) | Three new regression guards added: backward-compat-legacy-entries (Q6); scrapbook-evidence-integration (Q8); suppress-state-storage (F1). Plus F4/F5/F6/F9-tagged additions to existing test rows. |
| **F8** | §Build-time audit gate (gate-count hedge) | "9th audit gate" softened to "8th or 9th depending on v3-4 IMPL sequencing" — both arcs are mutex-independent so either ordering is acceptable. |
| **F9** | §Build-time audit gate (banned-pattern two-scope expansion) | `audit-activity-categories-v1.sh` now declares TWO scopes: Scope A (activity-category enumeration drift) + Scope B (personalised-milestone-prediction prose; Kael risk-register floor). Two distinct opt-in markers: `// activity-categories-ok:` (A) and `// no-personalised-prediction-ok:` (B). |
| **F10** | §Registry shape (accent-assignment calibration note) | v1 accent assignments (`language → lavender`, `cognitive → sky`) overlap with established design-system semantic colors. Marked as v1 calibration subject to Vela's render-layer audit at IMPL time; alternative palette suggested (language → indigo, social → peach, cognitive → amber). Audit-gate enforces registry-as-source-of-truth either way. |

Source register: review pass was an in-transcript skill output (no signature, no Edict V chain entry per canon-cc-022 artifact test). The substantive canon-cc-008 chain runs on the IMPL PR; these amendments arrive *with* the spec at ratification time and feed the IMPL canon-cc-008 chain as inputs.

### Second-pass amendments (G-series, 2026-05-27)

A second `/review` skill pass on the F1-F10-folded spec body surfaced three additional findings; all three folded here. G4 (narration-matrix 4th-cell gap) + G5 (audit-script rename) carried as Architect-decision-deferrals — neither has concrete spec-impact at v1 ratification time; both recorded for IMPL author awareness.

| # | Folded into | Substance |
|---|---|---|
| **G1** | §Patterns sub-tab item 6 + §Functional tests row + §Review-pass F-register row | Cross-link `data-arg` corrected from `"insights"` (wrong tab — that's `tab-insights` at template.html:1492) to `"info"` (the actual Info tab at template.html:1589). The v3-4 `renderInfoMilestoneSleepCorrelation` card lives on `tab-info`; the spec previously routed taps to the wrong tab. BLOCKING for IMPL author if not folded. |
| **G2** | §Primitive 2 (Practicing tap glyph reassignment) + §Review-pass F3 register row | Practicing tap-state glyph reassigned from `zi('sparkle')` to `zi('trending-flat')`. `sparkle` is the canonical sensory-domain icon in ACTIVITY_CATEGORIES — a sensory-domain milestone card would have rendered `sparkle` twice (milestone-domain icon + Practicing tap button), creating a half-awake-test ambiguity. `trending-flat` semantically matches "steady, in-progress" and exists in the 109-symbol sprite (PR-EF Phase A). |
| **G3** | §Log sub-tab end (Relocation contract clarification) | F2 "relocate from flat layout" is **template-restructure only**. Existing element IDs and their `home.js` render-function bindings (`getElementById` consumers) are preserved unchanged. The IMPL diff moves `<div id="...">` wrappers into new sub-tab containers; no render-function refactor required for the relocation itself. |

### Carried forward (G-series deferrals, NOT folded)

- **G4** — narration-matrix 4th-cell gap. The three "Today" header templates (full-data / mid-state / empty-state) cover three of four state-cells; the missing cell is *in-window=N + recent-evidence=Y* (a late-confirming baby with nothing currently in-window). Low-probability edge case. IMPL author may add a 4th template OR fall back to the mid-state shape with "no in-window" framing dropped. Either resolution is Charter-clean. Not folded — IMPL discretion.
- **G5** — audit-script rename cosmetic. `audit-activity-categories-v1.sh` now enforces two scopes per F9; the name only describes Scope A. Candidate rename: `audit-milestones-tab-v1.sh` (scope-neutral). Cosmetic; opt-in markers stay differentiated. Not folded — IMPL author may rename at IMPL-time if desired.

---

## Doctrinal references

- `docs/specs/food-sub-tab-v1.md` — Log / Library / Patterns 3-sub-tab pattern + "1-N all defaults" ratification record format (this spec's structural twin)
- `docs/specs/sproutlab-v3-charter.md` (CV3-006 — three-axis alignment required; Warmth + Honesty co-primary for v1)
- `docs/specs/sproutlab-v3-roundtable-2026-05-25.md` §3.2 Kael's risk register (`_predictMilestoneWindow` clinical-range discipline); §4.2 day-record schema reservation `activityLevel:1-4`; §6 R-6 reservoir row
- `docs/specs/v3-5-chip-taxonomy-tsf-story.md` — `data-state` attribute discipline (applied to in-window confirm chips); `_tsfHedgePhrase` (consumed by the "Today" header narration shape, transitively via v3-4 templates)
- `docs/specs/v3-6-card-priority.md` — `data-card-priority` attribute + meta-audit closure of three-site sync (mirrored here for `ACTIVITY_CATEGORIES`); the `_setCardPriority` producer-contract pattern (applied to in-window milestone proposal cards via tier emission)
- `docs/specs/v3-4-narrative-layer.md` — CV3-002 narrate-vs-list discipline; the registry-in-`data.js` pattern (`_NARRATIVE_PROSE_TEMPLATES` ratified placement; mirrored by `ACTIVITY_CATEGORIES`)
- `docs/specs/v3-3-engine-spine.md` — `_correlate` + `_scoreDay` consumer pattern; milestone-window correlation card reads `_correlate` via existing `renderInfoMilestoneSleepCorrelation` (cross-linked from Patterns sub-tab)
- CV3-002 Narrate-vs-List ("Today" header + pediatric-prep card narrate, not list)
- CV3-003 Honest-Empty-State (empty in-window state voiced; `activityLevel: null` is honest "no signal")
- CV3-004 Cross-Region Pair-Note (this spec body's two pair-note sections honor)
- HR-1, HR-2, HR-4, HR-5, HR-10 (icon discipline, no inline styles, escHtml at narration boundaries, tokens-only, no ellipsis on trajectory ribbon labels)
- canon-cc-008 (QA chain — triple-jurisdiction on styles.css at IMPL)
- canon-cc-022 (subagent vs skill — Governor audits at IMPL are Mode-1 subagents)
- canon-cc-026 (Per-Province-Layout — Companion specs mirrored in `.claude/agents/`)
- canon-cc-027 (spec amendment authority — registry tier additions require this)
- canon-gen-001 (generational expansion — Maren primary on home.js Region, Vela consult on cross-tier comprehension axis)

---

— *Lyra (main-session), 2026-05-27. The milestones sub-tab was a mature working surface the v3.0 roadmap was consuming at the edges (narrative prose, ISL temporal anchors, eventual R-2 forecasts) but never targeted as an arc of its own. The Architect named the friction directly — "a parent will not enter 15 different activities everyday" — and the fix is the same posture-inversion that made D3 tracking tolerable: engine proposes, parent confirms. The 4-tier daily activeness chip the chronicle reserved for R-6 lands here as the daily input primitive; the milestone surface lifts from a free-text log to a confirmation register; the layout uniformizes with food-sub-tab so the Track-tab finally feels cohesive across all five sub-tabs. Plus the ACTIVITY_CATEGORIES registry closes a real Extensibility-axis defect (6-site home.js drift) inline. Spec is ready for canon-cc-008 chain (Maren primary; Kael + Vela consult; sequential triple-jurisdiction on styles.css per cipher-9) once the IMPL PR opens. PRECEDES R-6 — when R-6 opens, the `activityLevel:1-4` capture surface is already live and the milestone-evidence data shape is consolidated.*
