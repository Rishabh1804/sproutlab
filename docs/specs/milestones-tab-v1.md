# Milestones-Tab v1 — Track-tab 5th sub-tab redesign (Option C re-author)

**Spec version:** v1.1 — **RATIFIED 2026-05-29** (Architect ratification of v1.1 amendments folding the 2026-05-28 PM IMPL doctrine overrides into the spec body: V-V-49 3-state state-lanes; V-V-57 + V-M-103 push-to-bottom + 24h hide; Motion One §Animation Foundation; HR-2 `currentColor` carve-out)
**v1 ratified:** 2026-05-27 (Architect: original 1-10 ratification + Charter co-primary + PRECEDES-R-6 carries forward; Option C two-spec sequence positions this as the consumer spec after `milestone-engine-prep-v1` ratifies the substrate)
**Date:** 2026-05-29 (v1.1) · 2026-05-27 (v1)
**Branch:** `claude/milestones-tab-v1-rewrite-spec` (v1 PR) → `claude/milestones-tab-v1-impl` (v1 IMPL PR #159 + #160-#164 hotfix arc) → `claude/milestones-tab-v1-1-spec-amendments` (this PR — v1.1 doctrine fold)
**Author:** Lyra (main-session — Mode-1 re-authoring + v1.1 fold)
**Status:** v1.1 RATIFIED — the four IMPL doctrine overrides ratified at PRs #159-#164 (under Architect standing fold-authority on milestones-tab findings) are now folded into the spec body. v1 ratification carries forward; v1.1 amendments are additive doctrine — no scope expansion, no new primitives. The amendment-note block at the head of §Ratification record preserves the v1 → v1.1 transition history per the canon-cc-022 §artifact-test pattern Aurelius validated in the 2026-05-28 PM cross-verify brief.

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

> **v1 → v1.1 transition history — four IMPL doctrine overrides ratified 2026-05-28 PM (PRs #159-#164), folded into body 2026-05-29.** The body text below now reads as v1.1; this note preserves the ratification timeline per canon-cc-022 §artifact-test. None of the four amendments expand scope or add primitives — they refine the visual contract + tap-behavior semantics + add the §Animation Foundation reference that anchors the live IMPL pattern.
>
> 1. **V-V-49 — 3-state state-lanes** (was 2-state filled/outlined collapse). Three distinct visual states (celebrated sage filled / practicing amber donut / coming-up lavender dashed outline) on a state-lane horizontal layout (top→bottom y=18/44/70 px) with collision-aware lateral spacing per lane. Live use showed the merged hedged-bucket "Practicing or in-window" smashed two journey-states + identical lavender swatches at 12px. Folded into §"Trajectory ribbon" body.
>
> 2. **V-V-57 + V-M-103 — push-to-bottom + 24h hide** (was 7-day Not-yet suppress + 5-second undo toast). Not-yet writes to a session-local `_msNotYetSession` map that reorders the card to the bottom of the in-window stack (still visible, deprioritized via `.is-deprioritized` muted-bg + opacity 0.65). Confirm/Practicing write `milestoneSuppress[id] = now + 24h` (24h post-tap hide instead of 7-day). Folded into §"Tap behaviors" body + test-plan guard rename.
>
> 3. **Motion One adopted as app-wide animation foundation** (PRs #162 + #163). UMD via deferred CDN (`window.Motion` global with `animate` / `spring` / `timeline` / `stagger` / `inView`). Opt-in-with-fallback pattern at every call site; reduced-motion respect via `matchMedia('(prefers-reduced-motion: reduce)')`. FLIP technique for list-reorder via `_msSnapshotInWindowRects` + `_msFLIPCards` helpers. New §Animation Foundation in body cites `docs/DESIGN_PRINCIPLES.md` §Animation Foundation as canonical reference + names the in-tab consumers.
>
> 4. **HR-2 carve-out — trajectory marker `currentColor` pass-through.** Inline `style="color:..."` on `.ms-trajectory-marker` propagates the ACTIVITY_CATEGORIES domain accent via CSS `currentColor`. Mirrors the v3-6 `_setCardPriority` `// collapse-machinery-mirror` carve-out precedent. Annotated `// motion-currentcolor-carveout` at the inline-style site. Folded into §Animation Foundation cross-reference; full carve-out documentation lives in `docs/DESIGN_PRINCIPLES.md` §HR-2 carve-outs.

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
- **Trajectory ribbon** — 3-state state-lanes visual (V-V-49 v1.1: celebrated/practicing/coming-up on horizontal lanes; ~15-20 marker density; FLIP-reflow on state change)
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

**Surface:** top of **Log** sub-tab. Single chip selector. **MUST be non-scrolling** (4 chips fit on screen at ≤6in mobile) per V-V-52 half-awake budget. **Layout (V-V-65 fold):** chip strip renders **below** the empty-state prompt — prompt-as-label-above-strip arrangement. Strip MUST NOT wrap at 320px (iPhone SE 1st-gen still in field) — `chip-strip-no-wrap-at-320px` regression guard asserts.

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

**Tap behaviors** (write-side semantics; render-side prose stays in observation-count framings per V-K-120/V-K-121 fold — see §"Engine-internal label boundary" below; tap-out animation per §Animation Foundation):
- **Saw it today** → record high-confidence observation (engine-side `confidence: 'high'` write); advance `evidenceStatus` if threshold; write `milestoneSuppress[id] = now + 24h` (24h post-Confirm hide); FLIP-reorder sibling cards via `_msFLIPCards`.
- **Practicing** → record practicing observation (engine-side `confidence: 'medium'` write); set `evidenceStatus: 'practicing'`; write `milestoneSuppress[id] = now + 24h` (24h post-Practicing hide); FLIP-reorder sibling cards.
- **Not yet** (V-V-57 + V-M-103 v1.1) → write to session-local `_msNotYetSession[id] = true` map (NOT persisted); card reorders to bottom of in-window stack via FLIP + `.is-deprioritized` class (muted-bg + opacity 0.65). Still visible — deprioritized, not hidden. **No undo toast** (the visible-but-muted card IS its own affordance; tapping a different state on the same card overrides). Session-local means a page refresh restores the card to its priority slot.

**Suppress vs deprioritize doctrine (v1.1):**
- `milestoneSuppress[id] = now + 24h` (persisted via `KEYS.milestoneSuppress`) — Confirm/Practicing hide for 24h; card is gone from the in-window stack until the timestamp expires
- `_msNotYetSession[id] = true` (module-local Map, NOT persisted) — Not-yet pushes to bottom of in-window stack; card stays visible with `.is-deprioritized` muted treatment; refresh restores
- `deleteMilestone(id)` + `deleteActivityEntry` clear BOTH keys for the milestone (PR #164 — Library × delete + Recent-activity-evidence delete return the milestone to the queue cleanly)

**Engine-internal label boundary (V-K-120 + V-K-121 + V-K-123 fold):** the engine-side `confidence: 'high' | 'medium' | 'low'` write enum is **write-side vocabulary only** — it MUST NOT leak into rendered prose. The surface prose uses `evidenceStatus` value (`confirmed` / `practicing` / `not-yet` per V-V-57) and observation-count framings ONLY. Test guard `strength-not-rendered` (test plan §Honesty floor) asserts grep finds no `'high-conf'` / `'medium-conf'` / `'low-conf'` / `'high-confidence'` / `'medium-confidence'` literal strings in any milestone-tab-v1 surface render function (home.js + medical.js + intelligence-cards.js touchpoints).

**Care-tier safety floor:** engine pre-applies `safetyTier:true` cap-bypass for **in-window** safety-tier rows per engine-prep §Primitive 2 (V-M-125 fold — `safetyTier === true` rows bypass the n-cap IF in-window, not unconditionally; post-window safety-tier rows do not phantom-surface); surface renders all returned items (typical: 3 cards; rare: 4-5 when multiple safety-tier rows in-window).

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

Closes V-M-100's 5 unmapped surfaces concern + V-M-119 fold (12-surface enumeration completes):

1. **`#msActiveMilestones`** (relocated per V-M-100 + V-M-119 fold) — **evidence-driven primary view** rendered by `renderActiveMilestones` (`medical.js:457`); preserved ID; stage-grouped (emerging / practicing / consistent / mastered). Placed above `#milestonesDomainHero` because parent's "what has Ziva actually shown me lately" anchor is more frequent than the domain-hero browse path.
2. **`#milestonesDomainHero`** (relocated per V-M-100 + G3) — preserved IDs; render-function bindings unchanged
3. **Domain filter chips** — read from `ACTIVITY_CATEGORIES`
4. **`#upcomingMilestoneList`** (relocated per V-M-100) — "Coming Up Next" preview
5. **`#msTimelineContent`** (relocated per V-M-100) — Milestone Timeline (event log; coexists with trajectory ribbon in Patterns)
6. **`#milestoneList` + Add-Custom-Milestone** (relocated per V-M-100) — full list + `openMilestoneModal` CTA preserved
7. **Age-band sectioning** — `_getInWindowMilestones(ageDays, ∞)` grouped by clinical-range
8. **`#activityList`** (relocated per V-M-100) — "Recommended Activities" reads `MILESTONE_ACTIVITIES`
9. **Legacy history view** — collapsed; pre-v1 free-text Log Activity entries

### Patterns sub-tab — engine-derived insights

1. **`#milestoneStats` pills** (relocated per V-M-100) — reads `ACTIVITY_CATEGORIES`
2. **`#milestoneHighlights` card** (relocated per V-M-100)
3. **`#msRegressionAlerts`** (relocated per V-M-100 — **CARE-TIER critical surface**)
4. **Category Progress wheels** (`#msCatWheels`, relocated per V-M-100) — now reads `ACTIVITY_CATEGORIES` (5-cat)
5. **Weekly summary card** — narrate week's evidence per CV3-002
6. **Pediatric-visit prep card** (see §Three return-visit surfaces — narrated-card-only v1 minimum)
7. **Trajectory ribbon** (see §Three return-visit surfaces)
8. **Milestone-window correlation cross-link** — `gotoCard('info', 'infoMilestoneSleepCard')` (V-V-48 — uses canonical `gotoCard()` pattern at `core.js:3385`; V-V-63 fold — cardId verified against `template.html:2196` `id="infoMilestoneSleepCard"`; the renderer at `intelligence-cards.js:1064` is `renderInfoMilestoneSleepCorrelation()` — function name carries "Correlation" suffix but the *card* id does NOT); inline teaser as summary-headline format; does NOT add to v3-4 `_NARRATIVE_PROSE_TEMPLATES` (V-V-62 + engine-prep V-V-60); IMPL MUST honor the `home.js:7093` "Card ids verified present in template.html" discipline — regression guard `correlation-cross-link-cardId-verified` asserts `document.getElementById('infoMilestoneSleepCard') !== null` before the cross-link wires up

### Sub-tab navigation chrome — V-V-46 resolution

- **Active sub-tab chrome:** existing `.track-sub-btn.active` rose chrome (uniform across all 5 Track sub-tabs)
- **Lavender domain accent surfaces INSIDE sub-tab:** trajectory ribbon background (`--surface-lav`); pediatric-prep card title (`--tc-lav`)
- **Care-tier safetyTier:true border-accent (V-V-64 + V-M-124 fold):** in-window proposal card border-accent on `safetyTier:true` rows uses `border: 3px solid var(--rose-deep)` (the existing D2-DONOT border token at `styles.css:52` — token verified live). Care-tier amplification, not domain-tier emphasis: `--rose-deep` is the parent-action "this matters more" signal; lavender domain accent still surfaces inside the card body via the existing `[data-domain]` cascade. Phantom `--lav-deep` token from earlier draft REJECTED — no such token exists in styles.css (verified: only `--lav-light` `:38`, `--tc-lav` `:53`, `--lavender` `:37`, `--surface-lav` `:84`).
- `regression-guard-milestones-v1-active-subtab-rose-accent` test (renamed from prior `lavender-accent`) — warmth-coherent uniformization
- `regression-guard-safetytier-rose-deep-border` test — asserts `safetyTier:true` in-window card renders with computed `border-color` resolving to `--rose-deep`

---

## The consumer-side `ACTIVITY_CATEGORIES` registry

Engine-prep migrated milestone rows to `domain:` at data-tier (PR #148). v1 lands the **consumer-side registry**.

### Registry shape (in `data.js`, Kael's region)

```js
window.ACTIVITY_CATEGORIES = [
  { key: 'motor',     label: 'Motor',     icon: 'run',       accent: 'sage'     },
  { key: 'language',  label: 'Language',  icon: 'chat',      accent: 'lavender' },
  { key: 'social',    label: 'Social',    icon: 'handshake', accent: 'peach'    },
  { key: 'sensory',   label: 'Sensory',   icon: 'sparkle',   accent: 'amber'    },
  { key: 'cognitive', label: 'Cognitive', icon: 'brain',     accent: 'sky'      },
];
```

**Accent preservation (V-M-120 fold — Lyra synth-call):** the registry MIRRORS the existing binding `[data-domain]` cascade at `styles.css:8628-8636` (`data-domain="language" → --tc-lav`; `data-domain="cognitive" → --tc-sky`) + `CLAUDE.md:189` design-system table (*"lavender | Milestones, achievements, intelligence"* — note: at the per-domain cascade level, **language inherits lavender** as the domain-text-color token; "milestones-overall" semantic is a higher-tier surface concern, not a per-domain conflict). Closed PR #147 draft proposed `language → indigo` + `cognitive → sky` to free lavender, but Maren V-M-120 surfaced that the reassignment silently overwrites a binding contract with 18+ consumer call-sites (`.al-chip-language` `styles.css:5980`, `.al-chip-cognitive` `:5982`, `.ms-active-item.language` `:6030`, `[data-domain]` cascade `:8628-8636`, plus Activity Log + Smart Quick Log + Today So Far consumers). **Lyra fold-call:** preserve the existing cascade. Milestone-overall semantic surfaces via (a) existing Milestone Timeline header `icon-lav` glyph (template.html:1181 + line 1182 *"Milestone Timeline"* heading using `--tc-lav`); (b) trajectory ribbon `--surface-lav` background (this spec line ~278). Track sub-tab "Milestones" header chrome retains its existing identity. **No CLAUDE.md design-system table amendment required**; no shared-module CSS migration scope expansion required.

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

**Honesty floor (V-M-104 + V-M-121 fold):** if `#msRegressionAlerts` surface signals concern (confirmed milestone gone 30+ days without evidence per `home.js:2340` `REGRESSION_DAYS = 30` constant — V-M-121 fold corrects earlier "14+ days" claim to match the live producer-side logic), the Today header uses `betweenWindow` (if recent confirmation exists) OR `emptyState` — NEVER "quiet stretch" framing when regression alerts present.

### Trajectory ribbon (Patterns sub-tab)

**3-state state-lanes visual contract** (V-V-49 v1.1):
- **Marker filter (V-K-122 fold — global cap, not per-bucket cap-at-5-only):** combine three buckets — confirmed milestones + practicing milestones + in-window-not-yet milestones — then apply a **global cap of 20 markers** via priority score (recency-weighted for confirmed; engine `priority` field for not-yet/practicing). The "cap at 5 most-imminent" floor on the not-yet bucket carries forward as a sub-bucket floor; the confirmed bucket caps via recency-top-N to keep the ribbon legible at 12m+ when typically-developing tracking datasets accumulate 30+ confirmed milestones.
- **3 visual states on horizontal lanes (V-V-49 v1.1):**
  - **Celebrated** (confirmed) — top lane (y=18px) — `sage` filled disc, white check inside
  - **Practicing** — middle lane (y=44px) — `amber` donut (filled ring with hollow center)
  - **Coming up** (in-window not-yet) — bottom lane (y=70px) — `lavender` dashed outline
  - Collision-aware lateral spacing per lane (markers in the same lane don't overlap; cross-lane vertical separation always 26px apart so the lane structure reads at-a-glance)
- **Why three lanes** (closes V-V-49 v1 collapse): merging practicing + not-yet into a single "hedged" state at v1's filled-vs-outlined contract smashed two distinct journey-states; identical lavender swatches at 12px were also indistinguishable from celebrated markers at low brightness. Three lanes restore journey-state clarity + leverage spatial (vertical) hierarchy instead of overloading shape.
- **Marker density:** ~15-20 markers via prioritization (post-global-cap).
- **Pixel-scale floor (V-V-66 fold):** minimum marker diameter ≥9px at narrowest supported viewport (320px); outlined-marker `stroke-width` ≥1.8px (preserves shape distinguishability under low-brightness half-awake conditions). Regression guard `trajectory-ribbon-marker-min-diameter-9px` + screenshot-diff test at 6in viewport with 18 markers.
- **Color:** domain-keyed via `currentColor` pass-through (reads `ACTIVITY_CATEGORIES[milestone.domain].accent` injected as inline `style="color:..."` — see HR-2 carve-out §Animation Foundation; annotated `// motion-currentcolor-carveout`)
- **Age-axis + "now" indicator** (v1.1 fold from PR #161): horizontal axis labels months 4-12; vertical "now" indicator at the current age position; geometry 108px tall (was 72px at v1).
- **FLIP-reflow on state change:** when a marker promotes (e.g., practicing → celebrated on Confirm tap), snapshot rects pre-render → re-render with new lane assignment → animate from delta back to 0 via `Motion.animate` (or CSS-class fallback). See §Animation Foundation.
- **Tap → `gotoCard('track', 'milestoneRow_' + milestoneId)`** (V-V-48 — canonical pattern at `core.js:3385`; V-V-48 carry-watch — IMPL verifies `milestoneRow_<id>` ids actually render on the Library sub-tab milestone list)

**Performance gate:** ribbon renders within 200ms (cipher-3 budget).
**Background:** lavender domain accent (`--surface-lav`).

### Pediatric-visit prep card

**v1 minimum: narrated-card-only** (V-V-53 fold — copy-as-text + PDF deferred to R-3).

**Auto-derived "Things to mention"** from: recent evidence (30d) + practicing milestones + active CareTickets + recent regressions (`#msRegressionAlerts`).

**Narration shape (CV3-002, V-K-120 fold — no engine-internal `high-conf` label leak):**

> *"Next visit: not yet scheduled. Things to mention this month: pointing confirmed (5 observations); standing-with-support practicing (2 observations); food-introduction rate steady (12 new foods in 30 days). [If regressions present]: Worth mentioning — {regressionMilestoneText} hasn't shown evidence in {days} days."*

Engine-write-side `confidence: 'high' | 'medium'` enum stays in the data layer; surface prose uses observation-counts + `evidenceStatus` value (`confirmed` / `practicing` / `not-yet` per V-V-57) only. Pair-note 411 contract honored. Pre-existing leak carrier at `medical.js:531` (`% high-conf` in `renderActiveMilestones`) is out-of-jurisdiction here but Maren-primary at IMPL routes the carrier-fix in the same PR per V-K-120 pair-note.

**Care-perspective framing (V-M-123 fold):** narration prose narrates Care-tier value beyond visit-prep — reads as a weekly Care summary the parent could anchor on between visits, not as a clinical-record-builder waiting for the copy-out affordance. R-3 copy/PDF deferral is the right scope-cut; the card earns surface existence as a Care-summary card with pediatric-visit framing, not as a checklist-builder.

**Care-tier register-tag (V-M-109 + V-M-122 fold):** card carries visible *"for visit-prep only — not a clinical record"* footer. **Visual contract (V-M-122 fold):** register-tag renders with `border-top: 1px solid var(--mid)`, `font-size: var(--fs-xs)`, `color: var(--tc-rose)` (or equivalent) — sufficient visual weight to be parsed as terminal-statement, not as a skippable footnote. Sequential triple-jurisdiction on styles.css at IMPL covers the visual-tier sign-off (Maren → Kael → Vela; Vela half-awake-test confirms the footer reads as register-tag, not as soft caveat).

**Screenshot-bypass defense-in-depth (V-V-67 fold):** parents who can't copy will screenshot. Register-tag MUST stay within visible viewport at typical phone screenshot dimensions (320px / 375px / 414px widths). Regression guard `screenshot-bypass-register-tag-visible` captures rendered card height + asserts register-tag stays within viewport crop window at standard breakpoints.

**No tap-to-copy + no PDF in v1.** Both deferred to R-3 (Wave 2 audit/history). V-V-53 ratified.

### Animation Foundation (v1.1)

**Motion One** (`window.Motion`) — app-wide animation foundation adopted at this IMPL (PR #162 + #163, 2026-05-28). UMD via deferred CDN (`dist/motion.min.js`) loaded after Chart.js in `split/build.sh`. Canonical reference: **`docs/DESIGN_PRINCIPLES.md` §Animation Foundation** (opt-in-with-fallback pattern, reduced-motion contract, FLIP primitive). This spec amends the milestones-tab surfaces only — the cross-app pattern lives in DESIGN_PRINCIPLES + AGENTS.md Rule 12.

**In-tab consumers** (this spec):
- **Tap-out animation** on Confirm / Practicing / Not-yet: card slide-out via `Motion.animate(card, { x:'110%', rotate:8, opacity:0 }, { duration:0.42, easing:[0.32,0,0.67,0] })`. CSS-class fallback `.is-sliding-out` engages when `window.Motion` unavailable.
- **FLIP list-reorder** on state change: `_msSnapshotInWindowRects()` captures pre-render rects → state change + `renderMilestones()` → `_msFLIPCards(beforeRects)` computes per-card delta + animates from delta back to 0 via `Motion.animate` (or CSS class fallback). For just-deprioritized Not-yet cards: opacity tweens 1 → 0.65 in sync with the slide. Replaces the spring-physics oscillation + hard repaint jump that v1 IMPL initially shipped (PR #164 closure).
- **Trajectory ribbon marker promotion** on Confirm: lane-to-lane re-position via FLIP (practicing-lane marker → celebrated-lane marker animates the y delta back to 0).
- **activityLevel chip selection feedback** (PR #162): inline status + Today header echo pill + toast — all gated on Motion availability with CSS-fallback parity.

**Reduced-motion contract:** every animation entry-point checks `window.matchMedia('(prefers-reduced-motion: reduce)')`. If matches, the animation is skipped + the callback fires immediately so the data write still happens. The state change is the load-bearing operation; the animation is comprehension polish.

**HR-2 `currentColor` carve-out** (this tab's specific instance): `.ms-trajectory-marker` writes inline `style="color: var(--<domain>-accent)"` to propagate the ACTIVITY_CATEGORIES domain accent via CSS `currentColor`. The alternative (5 per-domain CSS rules duplicating the registry accents) is exactly the parallel-table failure-mode the 9th audit gate prevents. Registry → `currentColor` pass-through keeps `window.ACTIVITY_CATEGORIES` as the single source of truth. Annotated `// motion-currentcolor-carveout` at the inline-style site. Full carve-out doctrine in `docs/DESIGN_PRINCIPLES.md` §HR-2 Carve-outs.

**CDN URL discipline** (PR #163 closure): Motion v10.18.0 distributes only `dist/motion.min.js`, NOT `dist/motion.js`. Build.sh references the `.min.js` path explicitly. If a future Motion version bump lands, verify the asset path via `curl -sI <cdn-url>` before commit — a 404 silently falls all surfaces through to the CSS fallback (the v1 IMPL incident).

---

## Files touched + LOC estimate

| File | Region | Type | Lines |
|---|---|---|---|
| `split/template.html` | Shared | New 3-sub-tab scaffold; all 11 existing ID-bearing surfaces relocated per V-M-100 + V-M-119 fold (preserved IDs per G3): `recentEvidenceFeed`, `msActiveMilestones`, `milestonesDomainHero`, `milestoneStats`, `milestoneHighlights`, `msCatWheels`, `msRegressionAlerts`, `milestoneList`, `msTimelineContent`, `upcomingMilestoneList`, `activityList` | ~220 changed |
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
- `inwindow-cap-3-default` / `inwindow-safetytier-bypass-cap` / `inwindow-confirm-evidence` / `inwindow-practicing-evidence` / `inwindow-confirm-24h-hide` / `inwindow-practicing-24h-hide` / `inwindow-not-yet-push-to-bottom` / `inwindow-not-yet-session-local` / `inwindow-delete-clears-suppress`
- `bulk-grid-engine-read` / `bulk-grid-categorized`

### ACTIVITY_CATEGORIES registry (3)
- `category-registry-sync` (meta-audit) / `no-adhoc-category-arrays` / `category-progress-wheels-5-cats`

### Honesty floor (5)
- `clinical-band-disclosed` / `omit-paren-on-unverified` (V-M-115) / `no-personalised-prediction` (engine-prep gate enforces) / `empty-state-voiced` / `strength-not-rendered`

### Return-visit surfaces (11)
- `today-header-4-templates` / `today-header-between-window` (V-V-54) / `today-header-regression-days-30` (V-M-121) / `trajectory-ribbon-paints` (200ms) / `trajectory-ribbon-3-state-lanes` (V-V-49 v1.1) / `trajectory-ribbon-marker-min-diameter-9px` (V-V-66) / `trajectory-ribbon-global-cap-20` (V-K-122) / `trajectory-ribbon-gotocard` (V-V-48) / `trajectory-ribbon-flip-reflow` (v1.1) / `pediatric-prep-narrated-only` (V-V-53) / `pediatric-prep-register-tag` (V-M-109 + V-M-122) / `pediatric-prep-no-engine-internal-labels` (V-K-120) / `screenshot-bypass-register-tag-visible` (V-V-67) / `correlation-cross-link-cardId-verified` (V-V-63) / `correlation-cross-link-gotocard` (V-V-48 + V-V-62) / `motion-opt-in-fallback-present` (v1.1) / `reduced-motion-skip-animation` (v1.1) / `motion-currentcolor-carveout-annotated` (v1.1)

### Layout uniformization (6)
- `three-subtabs-render` / `active-subtab-rose-accent` (V-V-46) / `domain-accent-inside-cards` / `11-surfaces-relocated` (G3 preserved-IDs — enumerated 11: `recentEvidenceFeed`, `msActiveMilestones`, `milestonesDomainHero`, `milestoneStats`, `milestoneHighlights`, `msCatWheels`, `msRegressionAlerts`, `milestoneList`, `msTimelineContent`, `upcomingMilestoneList`, `activityList`; V-M-119 fold corrects earlier "12 surfaces" claim to enumerated 11 ID-bearing IDs) / `safetytier-rose-deep-border` (V-V-64 + V-M-124) / `screen-reader-order`

### Half-awake fixture (V-V-52 split per cipher-2; V-V-65 fold — per-confirm scope, not per-tab-entry)
- **First-encounter** (n=5; ≤6s **per confirm** — comprehension floor; budget applies to single chip-set OR single in-window proposal tap, NOT to whole-tab-entry comprehension time)
- **Steady-state** (n=5; ≤3s per confirm; ≤2s activityLevel — warmth-lift)
- Test names: `half-awake-first-encounter-per-confirm-le-6s`, `half-awake-steady-state-per-confirm-le-3s`, `half-awake-activitylevel-le-2s`, `chip-strip-no-wrap-at-320px` (V-V-65)

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
- ✓ Trajectory ribbon 3-state state-lanes (V-V-49 v1.1)
- ✓ Pediatric-prep narrated-only v1 minimum (V-V-53)
- ✓ Half-awake split-fixture (V-V-52)
- ✓ DOM reading order = visual order

### Axes the spec could risk regressing — with mitigations

- **Warmth (chrome doctrine):** uniform-rose active chrome means parent doesn't see lavender-as-active-signal for milestone tab. **Mitigation:** Milestone Timeline header `icon-lav` glyph (template.html:1181) + trajectory ribbon `--surface-lav` background; parent learns "milestone = lavender" via header chrome + ribbon context. Per-domain cascade (V-M-120 fold) preserves binding `language → lavender` / `cognitive → sky` semantic — no design-system contract regression on Activity Log / Smart Quick Log / Today So Far surfaces.
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
- Trajectory ribbon 3-state state-lanes visual at mobile (V-V-49 v1.1) — lane separation legibility + FLIP-reflow on state change
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

## Lyra synth-fold register (canon-cc-008 chain on PR #149)

Per Architect directive 2026-05-27 (*"don't wait for me to fold issues, Lyra will take that call — directive: don't defer issues directly related to milestones tab"*), the full canon-cc-008 chain ran on this docs-only spec PR. Three Governors deployed Scribes for parallel codebase reconnaissance. All findings folded inline above. Register:

### BLOCKING folds (4 — inline ratified)

| ID | Governor | Surface | Fold resolution |
|----|----------|---------|------------------|
| V-V-63 | Vela | phantom cardId `infoMilestoneSleepCorrelationCard` | Fixed to `infoMilestoneSleepCard` (verified at `template.html:2196`); `correlation-cross-link-cardId-verified` regression guard added |
| V-V-64 | Vela | phantom CSS token `--lav-deep` | Resolved with V-M-124 — use existing `--rose-deep` token at `styles.css:52` (Care-tier amplification on `safetyTier:true` border-accent, not domain-tier emphasis) |
| V-M-119 | Maren | `#msActiveMilestones` missing from V-M-100 relocation table | Added as Library sub-tab item 0 (evidence-driven primary view; preserved ID; `renderActiveMilestones` at `medical.js:457`); surface count corrected from "12" → enumerated 11 ID-bearing surfaces |
| V-M-120 | Maren | `ACTIVITY_CATEGORIES` accent reassignment contradicts `[data-domain]` cascade | **Lyra fold-call: preserve existing cascade.** Registry mirrors `styles.css:8628-8636` binding (language → lavender; cognitive → sky). Milestone-overall semantic surfaces via existing `icon-lav` glyph on Milestone Timeline header + trajectory ribbon `--surface-lav` background. No 18-site shared-module CSS migration required. No CLAUDE.md design-system table amendment needed |

### NOTE / carry-watch folds (10 — inline ratified)

| ID | Governor | Surface | Fold resolution |
|----|----------|---------|------------------|
| V-M-121 | Maren | REGRESSION_DAYS=30 vs spec's "14+ days" | Spec body §"Today header card" updated to cite `home.js:2340 REGRESSION_DAYS = 30` |
| V-M-122 | Maren | Register-tag visual tier discipline | Visual contract spec'd (`border-top: 1px solid var(--mid)`, `var(--fs-xs)`, `var(--tc-rose)`); sequential triple-jurisdiction on styles.css at IMPL |
| V-M-123 | Maren | Pediatric-prep Care-perspective framing | "Care-summary card with pediatric-visit framing" framing added to §Pediatric-visit prep card |
| V-M-124 | Maren | safetyTier visual tier — `--rose-deep` Care-amplification | Folded with V-V-64 (above) |
| V-M-125 | Maren | safetyTier cap-bypass "if in-window" qualifier | §Care-tier safety floor amended to "for **in-window** safety-tier rows per engine-prep §Primitive 2" |
| V-V-65 | Vela | Half-awake budget scope (per-confirm, not per-tab-entry) | §Half-awake fixture explicitly scoped per-confirm; `chip-strip-no-wrap-at-320px` regression guard added |
| V-V-66 | Vela | Trajectory ribbon marker pixel-scale floor | Minimum diameter ≥9px + stroke-width ≥1.8px at 320px viewport; screenshot-diff test |
| V-V-67 | Vela | Pediatric-prep screenshot-bypass defense-in-depth | `screenshot-bypass-register-tag-visible` regression guard added |
| V-K-120 | Kael | `(5 obs, high-conf)` engine-internal label leak in narration sample line 288 | Narration sample rewritten to `(5 observations)`; `strength-not-rendered` regression guard scope expanded with explicit grep assertion shape |
| V-K-121 | Kael | Tap-behavior write-side vocab (`high-conf` / `medium-conf` literal strings) | Spec body §Primitive 2 tap behaviors renamed to render-safe synonyms ("record high-confidence observation" — engine-side enum write only); engine-internal label boundary §added |
| V-K-122 | Kael | Trajectory ribbon marker-density inconsistency (cap-at-5 per-bucket) | Global cap of 20 markers post-bucket-merge spec'd; per-bucket sub-floors carry forward |
| V-K-123 | Kael | Pair-note 411 self-consistency vs narration sample line 288 | Closed via V-K-120 fix |

### Positive closure verifications (sign-off ratifications — no amendment)

- **V-M-126** (Maren): V-V-46 chrome doctrine uniform-rose + lavender-inside resolution is parent-coherent — sign-off ratified
- **V-M-127** (Maren): `#milestoneList` + `openMilestoneModal` Add-path correctly preserved in Library sub-tab item 6 — G3 preserved-IDs closure verified
- **V-V-68** (Vela): chrome doctrine resolution closes clean (`styles.css:5015` `.track-sub-btn.active` uniform-rose verified)
- **V-V-69** (Vela): `gotoCard()` canonical pattern at `core.js:3385` closes (reopened only via V-V-63 specific cardId — now folded)
- **V-V-70** (Vela): trajectory ribbon doctrine closes at v1.1 — 3-state state-lanes ratified (was 2-state collapse at v1; pixel-scale carried by V-V-66 fold; FLIP-reflow added at v1.1)
- **V-V-71** (Vela): half-awake split-fixture doctrine closes (budget-scope carried by V-V-65 fold)
- **V-V-72** (Vela): pediatric-prep narrated-only v1 minimum doctrine closes (screenshot-bypass carried by V-V-67 fold)
- **V-V-73** (Vela): V-V-54 4th-cell `betweenWindow` template — all four 2×2 state-cells covered cleanly
- **V-V-74** (Vela): V-V-62 cross-spec carry-forward — `_MILESTONE_NARRATION_TEMPLATES` genuinely separate from v3-4 typed-registry; doctrinal carve-out V-V-60 honored
- **V-K-124** (Kael): 5-key ACTIVITY_CATEGORIES covers 100% of migrated `domain:` values across `DEFAULT_MILESTONES` + `MILESTONE_STANDARDS`
- **V-K-125** (Kael): `_MILESTONE_NARRATION_TEMPLATES` carve-out shape-distinct from v3-4 typed registry (no `hedgeTierMap`, no `sampleFloor`)
- **V-K-126** (Kael): engine-prep output schema consumption verified field-by-field (V-V-55 month-split + V-V-56 per-item display + V-V-57 rename; `priority` enumerated but not rendered — good)
- **V-K-127** (Kael): `audit-activity-categories-v1.sh` scope-separation verified standalone (Scope C, distinct from engine-prep's Scope A + B)

### Cipher Edict V terminal pass

Folded synthesis ready for Cipher Edict V cross-cutting terminal pass.

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

— *Lyra (main-session), 2026-05-29 — v1.1 fold. Four IMPL doctrine overrides ratified at PRs #159-#164 (under Architect standing fold-authority on milestones-tab findings) now sit in the spec body: trajectory ribbon is **3-state state-lanes** (not 2-state collapse — live use showed merged hedged bucket smashed two journey-states); Not-yet is **push-to-bottom session-local** (not 7-day persisted suppress + undo toast — visible-but-muted card is its own affordance; Confirm/Practicing now write the 24h hide); **Motion One** is the app-wide animation foundation referenced via new §Animation Foundation section pointing at the canonical `docs/DESIGN_PRINCIPLES.md §Animation Foundation`; HR-2 `currentColor` carve-out for trajectory marker domain accent annotated `// motion-currentcolor-carveout`. v1 → v1.1 transition history preserved in §Ratification record amendment-note per canon-cc-022 §artifact-test. Test plan guards renamed at L354 + L364 (the four 2-state / undo-toast / 7-day-suppress guards retired; nine new v1.1 guards added covering 24h hide + push-to-bottom + session-local + delete-clears-suppress + 3-state lanes + FLIP reflow + motion opt-in fallback + reduced-motion + currentcolor carve-out). No scope expansion, no new primitives — the amendments refine visual contract + tap-behavior semantics + add the animation-foundation reference that anchors the live IMPL pattern. Per the prior session's Aurelius cross-verify brief: the amendment-note pattern is canonically sound.*
