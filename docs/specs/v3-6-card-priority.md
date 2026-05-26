# v3-6 — Card Priority + Information Hierarchy

**Spec version:** v3-6
**Date:** 2026-05-27
**Branch:** `claude/v3-6-card-priority-spec-WDdiY` (spec) → `claude/v3-6-card-priority-impl` (IMPL)
**Author:** Lyra (main-session — Mode-1 spec authoring)
**Status:** v0 — Wave 1 implementation spec; v3.0 surface arc; first consumer of the v3-5 chip vocabulary at the card tier.
**Promoted from:**
- `docs/specs/sproutlab-v3-roundtable-2026-05-25.md` §3.3 vela-arc-3 + §4.2 v3-6 row (chronicle-ratified)
- `docs/specs/v3-5-chip-taxonomy-tsf-story.md` §Out-of-scope row "vela-arc-3 Card Priority (= v3-6)" — substrate deferred for separate arc
- `docs/SESSION_HANDOFF_2026-05-26.md` §Active backlogs / Wave 1 spec-ratified, impl-pending — "v3-6 — second styles.css mutex position (now unblocked)"
**Charter alignment (CV3-006 required section — full enumeration in §Charter compliance below):**
- **Honesty** — every priority tier traces to a card-internal data condition (no decorative tiers); `ambient` is the honest empty-state floor (CV3-003 cross-cut) rather than a hidden card; `urgent` never invented — fires only when the card's data deriver returns an actionable insight.
- **Extensibility** — card-priority is a row-addition substrate. Three tiers ratified, with the same canon-cc-027 amendment floor v3-5 carried; adding/removing a tier is a Charter event, not a code refactor. Producer contract is one helper call per `renderInfo*`; no class-bag drift.
- **Warmth** — the *primary axis this arc honors*. The half-awake test passes when the **single most-urgent card** is visually findable above the section-grouping scaffold without a scroll-hunt. This is the card-tier equivalent of v3-5's chip-tier gestalt lift.

---

## What v3-6 is

The **information-hierarchy layer** of v3.0 at the **card** tier. v3-5 unified the chip-state vocabulary inside Today So Far; v3-6 unifies the **priority vocabulary** across the Info tab's `renderInfo*` cards. Three named tiers + per-tier visual contract + a producer contract that every Info-tab card honors.

**v3.0 silver arc:** v3-6 is not a gold capstone (the gold tier — v3-3 engine spine + v3-5 surface vocabulary — fully ratified as of 2026-05-26). v3-6 is the next-tier consumer of v3-5, and the gate to v3-1's recommendation-pipeline producer.

**styles.css mutex 2nd** (Cipher cipher-9): v3-5 → **v3-6** → v3-1. v3-5 released position 1 at PR #138. v3-6 occupies position 2. v3-1 cannot open its styles.css branch until v3-6's canon-cc-008 chain closes.

### The three named tiers

| Tier | Definition (per-card data condition) | Visual posture |
|---|---|---|
| **urgent** | Card carries an actionable insight that the parent should see *now*. Examples: D3 not given today and `_scoreDay.severityLevel === 'urgent'`; a new food-reaction logged in the last 48 h; an active illness episode unresolved past its safety-tier window. | Rose-accent border-left (echoes v3-5 `data-state="urgent"` chip treatment, one tier larger); title in `--text` weight 600; body expanded by default. |
| **notable** | Card has a trend or pattern worth reading at a glance — present data, recent change, but no urgent action. | Default card chrome (unchanged from today). |
| **ambient** | Card has no actionable signal — either no-data (the existing `si-nodata` branch) or baseline historical data with no recent delta. | Light surface tint; title in `--mid`; body collapsed-by-default (chevron closed). |

**Three tiers. No more without a canon-cc-027 amendment.** Decorative tiers (e.g. "celebratory" / "warning-soft") are categorically out of scope per Charter axis 3 ("no chart-junk", "information density without ranking").

---

## What v3-6 is NOT

- **Not a tab-wide flat sort.** Sorting respects the existing domain section labels ("Food Intelligence" / "Sleep Intelligence" / "Poop Intelligence" / "Illness Intelligence" / etc.) — re-ordering happens **within each section**, not across them. Cross-section global priority surfacing is registered as an out-of-scope candidate for a v3.1 "Today's flags" strip (see §Out-of-scope).
- **Not a card-deletion arc.** No card is hidden by tier; `ambient` collapses its body, but the card-header (title + chevron) remains visible and tappable. CV3-003 honest-empty-state holds — an empty card still announces itself.
- **Not a card-content rewrite.** Per-card prose / chart / no-data treatments are unchanged. v3-6 declares the *priority attribute* + the *chrome*; the *render* inside each card stays as-is. (Card-content rewrites are v3-4's narrative-layer arc.)
- **Not the urgent-producer wiring.** v3-6 declares the `urgent`-tier contract shape. The actual `_scoreDay.severityLevel === 'urgent'` → tier wiring for *recommendation-derived* cards lands in v3-1 (CT Notifications). v3-6 wires the tier producer for *card-internal* signals (e.g., the card's own `si-nodata` branch routes ambient, the card's own data deriver routes notable/urgent). v3-1's spec must address the recommendation-pipeline edge cases (see §Sequencing and the V-V-34 dormant-gate cross-link).
- **Not a Home-tab arc.** Home-tab cards (reminder cards, hero card, action cards) have their own ranking discipline (maren-arc-1 reminderRegistry). v3-6 is scoped to **Info-tab** (`#tab-info` → `renderInfo*` family).
- **Not an Activity-Log arc.** Activity Log chip-state adoption landed with v3-5; AL has no card-priority surface.

---

## The three-tier card-priority registry

### Tier enumeration (the single source of truth)

```js
/**
 * Card-priority registry — three named tiers in mutex precedence order
 * (urgent > notable > ambient). The deriver picks one tier per card per
 * render; the producer contract requires every renderInfo* function to
 * call _setCardPriority(cardId, tier) exactly once per render.
 *
 * Mirrors the v3-5 _TSF_CHIP_STATES doctrine: single constant, deriver
 * call-sites read by attribute, audit-gate guards drift across all three
 * sites (constant + producers + CSS variants). The cipher-extensibility-2
 * dormant gate from v3-5 is closed by the meta-audit test in §Test plan.
 */
window._CARD_PRIORITY_TIERS = ['urgent', 'notable', 'ambient'];
```

### Registry doctrine

Three tiers. **No more without a canon-cc-027 amendment.** The constant + the producer call-sites + the CSS variants are the three sync sites; the meta-audit test (`regression-guard-v3-6-tier-registry-sync`) asserts all three stay aligned at build time — the Cipher cipher-extensibility-2 dormant gate from v3-5 closes here.

### Visual contract per tier — token-driven (Charter Warmth + HR-5)

Every visual treatment binds to existing domain tokens. No ad-hoc hex. The tier chrome lands on the card *wrapper* via `data-card-priority="<tier>"`; per-card body chrome (the section under `card-header`) is unchanged.

| Tier | Color tokens | Decoration | Initial collapse state |
|---|---|---|---|
| `urgent` | `--rose-deep` border-left 3px; `--text` title color | bold title; `--shadow-card-urgent` elevation (derived token, see IMPL note below) | expanded |
| `notable` | default (no border-left); `--text` title color | clean | preserves the card's existing default (`infoXxxBody` `display:none` per template.html) |
| `ambient` | `--glass-strong` border-left 2px; `--mid` title color; surface tint via `--card-surface-ambient` (derived token, see IMPL note below) | clean | collapsed (forced — `data-card-priority="ambient"` overrides any expanded default) |

**IMPL-note — derived tokens (F1 + F2 /review skill-pass amendment 2026-05-27):** the urgent elevation and the ambient surface tint each introduce ONE derived token in the priority-tier CSS block. Concrete IMPL form:

```css
/* v3-6 priority-tier derived tokens — compose from existing design-system tokens */
:root {
  --card-surface-ambient: var(--glass);      /* alpha already encoded in --glass */
  --shadow-card-urgent:   0 6px 24px var(--shadow);  /* slightly deeper than default --shadow */
}
[data-theme="dark"] {
  --card-surface-ambient: /* dark-theme equivalent — Maren second-round audit picks the binding */;
  --shadow-card-urgent:   /* dark-theme equivalent — Maren picks the binding */;
}
```

Two-token rule: no inline `rgba(...)` composition, no inline `box-shadow` values — the CSS-variants block owns both treatments via named tokens. This keeps the styles.css triple-jurisdiction audit on tokens-grain (HR-5) and gives Maren a concrete value to verify in the severity-floor pass.

**Maren severity-floor honor (CV3-004 pair-note enumerated below):** the `urgent` tier visual must never be visually outranked by the `notable` tier (i.e., rose-accent border-left + bold title categorically more attention-grabbing than default chrome). This mirrors the v3-5 V-M-87 floor (urgent chip vs done chip). Maren's Mode-1 audit on `styles.css` (triple-jurisdiction second round) verifies the floor holds.

### Why an attribute, not a class

`data-card-priority="..."` is single-value (one tier per card) — enforces mutual exclusion. Class-based tiering (`.card-urgent` / `.card-notable` / `.card-ambient`) historically risks accidental stacking (`.card-urgent.card-ambient` is a defect that the attribute cannot express). The attribute is the **Charter Extensibility honor** — selectors are `[data-card-priority="X"]`; renderers read derived tier once, set the attribute once, no class-bag drift.

**This mirrors v3-5's `data-state` discipline at the chip tier; v3-6 lifts it to the card tier.**

### Cross-tier interaction with v3-5 chip-state vocabulary

The two registries are scoped to different DOM tiers and read independently:

- **Chip tier (`data-state` per v3-5):** scoped to `.tsf-event` chips inside Today So Far. A `data-state="urgent"` chip carries chip-level urgency — a single event in the day's list.
- **Card tier (`data-card-priority` per v3-6, new):** scoped to `.card.card-daily.col-full[id^="info"]` wrappers inside `#tab-info`. A `data-card-priority="urgent"` card carries card-level urgency — the entire card's posture this render.

A card may contain chips of any state without affecting the card's own tier. A `data-card-priority="urgent"` card MAY contain `data-state="done"` chips (the *card* is urgent because of a different signal; individual events inside it can be any state). The two attributes do not nest-validate each other.

**Visual hierarchy preservation:** the `urgent` card border (3px rose-deep) is strictly more attention-grabbing than the `urgent` chip border (3px rose-deep with smaller padding). Maren verifies this floor in the styles.css second-round audit.

---

## The producer contract

### `_setCardPriority(cardId, tier)`

```js
/**
 * Apply a card-priority tier to an Info-tab card wrapper.
 *
 * @param {string} cardId  — the card wrapper element id (e.g. 'infoFoodIntroCard')
 * @param {string} tier    — one of _CARD_PRIORITY_TIERS values; throws on invalid tier
 *
 * Side effects:
 *   - Sets data-card-priority="<tier>" on the wrapper
 *   - For tier === 'ambient': sets the card's collapse body to display:none + flips the
 *     chevron to closed (mirrors data-collapse-target click handler outcome)
 *   - For tier === 'urgent': sets the card's collapse body to display:block + flips the
 *     chevron to open (forces expanded)
 *   - For tier === 'notable': does NOT touch the collapse body (preserves user's last
 *     tap state during the session)
 *
 * Idempotent — safe to call multiple times per render; last call wins.
 *
 * Lives in: split/intelligence-cards.js (Vela's region) — declared near
 * the top of the file with renderInfo() master.
 */
function _setCardPriority(cardId, tier) { /* ... */ }
```

### Producer contract (one rule)

**Every `renderInfo*` function that owns a card with `id="info<Name>Card"` MUST call `_setCardPriority(cardId, tier)` exactly once per invocation.** The tier deriver is per-card and lives inside the `renderInfo*` body (the card knows its own urgency posture better than a global deriver). The build-time audit gate (§Build-time audit gate below) verifies every `renderInfo*` function has at least one `_setCardPriority` call site.

### Tier-deriver patterns (recommended shapes per card class)

These are *patterns*, not a registry — each card's deriver picks the tier from its own data state. Pattern enumeration:

| Card class | `urgent` when | `notable` when | `ambient` when |
|---|---|---|---|
| **Adherence cards** (D3, vaccinations, scheduled feeds) | `_scoreDay.severityLevel === 'urgent'` for the domain on `dateKey === today()` | adherence streak present, no missed-today gap | no adherence history (`si-nodata` branch) |
| **Reaction cards** (food reactions, illness episodes) | active episode unresolved past safety-tier window (Maren consult required) | recent reaction logged ≤ 7 d | no active episode AND no recent log |
| **Trend cards** (sleep efficiency, growth velocity, food introduction rate) | NEVER urgent (trends do not escalate) | trend computable AND recent data window populated | `si-nodata` branch fired |
| **Composite cards** (cross-domain — pipelines, correlations) | NEVER urgent in v3-6 (escalation belongs to v3-4 narrative templates) | correlation computable with `_correlate` confidence ≥ medium | `_correlate` confidence === low OR `si-nodata` |
| **No-data baseline cards** (any card whose `si-nodata` branch fires) | NEVER urgent | NEVER notable | always ambient (CV3-003 honest-empty-state cross-cut) |

**Note:** the "NEVER urgent" rows are the **Honesty honor** — a trend card cannot manufacture urgency to attract attention. Cards that reach `urgent` carry an actionable parent-now signal; cards that don't, don't.

### `_scoreDay` integration (Kael pair-note — CV3-004)

Adherence cards may read `window._scoreDay(domain, todayDateKey(), <dataset>)` to derive their tier — if the returned object's `severityLevel === 'urgent'`, the card tiers urgent. This is the **first consumer of `_scoreDay` at the card render tier** (post-v3-3 ratification). Kael's pair-note enumerates the read-side contract:

- `_scoreDay` is a pure function of `(domain, dateKey, dataset)` — no side effects, safe to call in render
- The `severityLevel` field is the canonical signal (per `core.js:5839` contract)
- A `null` `severityLevel` means met-or-aged-out → card tiers notable or ambient based on data presence
- A `'gentle'` or `'firm'` severityLevel → card tiers `notable` (urgent is reserved for `'urgent'`-level severity only, mirroring the chip-state's urgent contract)

**Severity-collapse-to-notable IMPL-note (F5 /review skill-pass amendment 2026-05-27):** `'gentle'` and `'firm'` both route to `notable` by design — they do NOT carry independent card-tier visual treatments under v3-6. Visual discriminability between `gentle`-severity and `firm`-severity cards is intentionally **out-of-scope** for v3-6; the card's *internal* chips (consumed via the v3-5 chip-state attribute) remain the discriminator until v3-1 introduces a card-internal recommendation-surface-tier scheme that can wire a richer card-chrome map. Architect override is available per canon-cc-027 if `'firm'`-as-distinct-tier is preferred at v3-6 time.

**RECOMMENDATION_ROSTER.severityMessages.*.strength carry-forward (open question §3 from session handoff 2026-05-26):** when adherence cards read `_scoreDay` output, the `.strength` strings (`'strong'` / `'mild'`) are engine-internal labels — they MUST NOT be `.text`-substituted into rendered prose. v3-6 cards consume `severityLevel` only; `strength` is read in the tier deriver but never rendered. Vela's primary audit verifies this floor.

---

## Above-the-section-fold consideration

The roundtable's vela-arc-3 sketch named *"renderInfo() master sorts by tier; ambient renders collapsed by default"* — implying tab-wide sort. v3-6 narrows this to **section-internal sort** because:

1. **Domain grouping is a comprehension scaffold.** Mixing food / sleep / poop / illness cards into a flat priority list breaks the warmth axis (parent's mental model has domain affordances).
2. **The half-awake test still passes** because urgent-tier chrome (rose border-left, bold title, expanded body) is visually findable inside its section without scroll-hunting *if* the section is on-screen. The remaining failure mode — urgent card in a section the parent has scrolled past — is the v3.1 "Today's flags" strip's job (out-of-scope here).
3. **Cipher cipher-2 protocol** (half-awake-test single-urgent-action read, n=5, ≥4/5 within 3s) is still applicable; v3-6 ships the section-internal sort as the first tier of the answer. v3.1 may add a tab-wide flag strip if the protocol falls short.

This narrowing is registered as a **deliberate Charter trade-off** (Warmth axis) per the canon-cc-027 §spec-amendment-authority discipline — Architect override available if a tab-wide sort is preferred.

### Sort implementation

`renderInfo()` master post-pass after all `renderInfo*()` calls:

```js
function _sortInfoTabByPriority() {
  // Scope: each .home-section-label inside #tab-info gates a "section" — the
  // section's cards are the .card.card-daily.col-full[id^="info"] siblings
  // until the next section label.
  // Sort within each section by tier (urgent > notable > ambient), stable
  // secondary sort by template-order (preserves intra-tier order).
  // Re-append via parentNode.appendChild (preserves event listeners).
}
```

**DOM reorder, not CSS order.** Screen reader reading order matches visual priority order — half-awake-test honor at the a11y tier too.

**Sort-timing IMPL-note (F4 + F6 /review skill-pass amendment 2026-05-27):** the sort post-pass MUST run **synchronously within the same microtask** as the `renderInfo()` master — no `setTimeout`, no `requestAnimationFrame`, no `await` boundary between the last tier emission and the sort. Two reasons:

1. **Visible-reflow avoidance.** A boundary between tier emission and sort risks the browser painting the pre-sort DOM order — the parent watches a card-shuffle. Synchronous-within-microtask guarantees one paint at the post-sort order.
2. **`.card:nth-child(N)` animation-delay interaction.** styles.css:299-303 staggers card fade-up via `:nth-child(1..5)` selectors. The selectors resolve against post-DOM-order positions at the moment the animation starts. If sort runs after the animation begins, the staggered delays apply to the wrong cards. Synchronous-within-microtask sort keeps the animation aligned to the visible order.

**Performance characterization (F4):** the post-pass is one O(n log n) sort over ~45 nodes per `renderInfo()` invocation; sub-frame at every render (well under the 200 ms v3-5-cipher-3 budget). No debounce required; tier-emission idempotency is not a load-bearing optimization at this n. IMPL acceptance criterion: a tier-assignments-unchanged second consecutive `renderInfo()` call MAY skip the sort post-pass as a future optimization, but v3-6 ships the unconditional sort — the optimization is not required.

### Scope of cards

Only `.card.card-daily.col-full` with `id` matching `/^info[A-Z]/` are sortable. The Info-tab `card-hero` ("Info / PreAlpha" header at template.html:1593) is scaffolding — never sortable. Section labels (`.home-section-label.sec-t3.col-full`) are anchors — they remain in template order.

---

## styles.css mutex (Cipher cipher-9 from chronicle Edict V)

**Sequential lock — position 2 of 3:** v3-5 (✓ released 2026-05-26) → **v3-6 (this spec)** → v3-1.

v3-5 established the chip-state token vocabulary. v3-6 consumes it (the card-tier `urgent` chrome composes from the same `--rose-deep` token v3-5's chip-tier urgent border uses) AND extends it (adds the priority-tier card chrome). v3-1 reads both (composes the recommendation-surface-tier render).

**Practical implication for this PR:** the canon-cc-008 chain on v3-6 must close (all three Governor audits + Lyra synth + Cipher Edict V) before v3-1's branch opens. Coordination point: Lyra's session-end handoff doc records the mutex state.

---

## Triple-jurisdiction routing — canon-cc-008 chain

**Vela primary** (heaviest-touched Region; `intelligence-cards.js` is Vela's home file — 2,643 LOC; per `CLAUDE.md` Module map).

**Maren consult** — Maren reviews the priority-tier semantics with Care safety floor in mind. Two specific items:
1. The `urgent` tier visual must never be visually outranked by `notable` (severity floor — mirrors V-M-87 from v3-5).
2. Adherence cards reading `_scoreDay` for D3 / vaccination / feed-window domains touch Maren's surface even though the read happens in Vela's region — the deriver shape is reviewed for care-tier semantics drift. Pair-note enumerated below per CV3-004.

**Kael consult** — Kael reviews the `_scoreDay` read contract + `_correlate` confidence-tier read (for composite cards). Pair-note enumerated. Kael also confirms the `RECOMMENDATION_ROSTER.severityMessages.*.strength` carry-forward observation (no `.text`-substitution).

**Sequential triple-jurisdiction on styles.css** — rotation per canon-gen-001 + chronicle §4.2:
- **First-Governor by heaviest-touched Region:** Vela (the card-priority CSS variants land primarily as Vela's render concern)
- **Rotation order:** Vela → Maren → Kael (matches the v3-5 rotation — Vela's position is now position-1 in the styles.css rotation when Vela is the first-Gov)

Each Governor's findings inform the next round. Lyra synthesizes all three. Cipher Edict V last, with the three Charter-axis cross-checks (honesty / extensibility / warmth) plus HR-1..HR-12.

---

## Build-time audit gate (Charter Extensibility honor)

Mirrors the v3-5 `audit-chip-taxonomy-v3-5.sh` shape:

- **Banned patterns:**
  - `card-urgent`, `card-notable`, `card-ambient` as bare class strings (the attribute is the source of truth)
  - Raw color values matching `--rose-deep` / `--glass-strong` inside `intelligence-cards.js` (the CSS owns the visual contract, not the JS)
- **Producer-coverage check:** for every `function renderInfo<Name>()` in `split/intelligence-cards.js` whose body contains a `getElementById('info<Name>Card')` reference, the function body must contain at least one `_setCardPriority(` call. Functions that *don't* own a card (e.g., helpers like `_setCardPriority` itself or pure-data computers) are exempt; the audit's discriminator is the `getElementById('info...Card')` presence.
- **Opt-in escape:** `// card-priority-ok: <rationale>` on the same line, per HR-12 / chip-taxonomy convention.
- **Ship-gate wiring:** `split/build.sh` invokes `bash audit-card-priority-v3-6.sh` alongside the existing two audits (audit-hr12-v3-3, audit-chip-taxonomy-v3-5). Three audits at v3-6 ratification — six total counting the existing four.

The script name is `split/audit-card-priority-v3-6.sh`.

---

## Files touched

| File | Region | Type | Lines (estimate) |
|---|---|---|---|
| `split/styles.css` | Shared — triple-jurisdiction | 3 priority-tier card-wrapper variants + dark-theme overrides + Maren severity-floor a11y rule | ~80 added |
| `split/intelligence-cards.js` | Vela | `_setCardPriority` helper + `_sortInfoTabByPriority` helper + tier-deriver calls in 30+ `renderInfo*` functions | ~120 added |
| `split/audit-card-priority-v3-6.sh` (NEW) | — | Build-time audit gate | ~95 |
| `split/build.sh` | shared | Wire the audit gate into the ship-gate chain | ~5 changed |
| `tests/e2e/v3-6-card-priority.spec.ts` (NEW) | — | E2E tests | ~280 |

**Total LOC estimate:** ~580 (mostly per-card tier-deriver calls + tests). Smaller than v3-5 because no new render surface is built — only the existing `renderInfo*` calls grow a one-line tier emission.

---

## Test plan

### Functional tests — tier registry + visual contract

| Test | Asserts |
|---|---|
| `regression-guard-v3-6-priority-attr-mutex` | Only one `data-card-priority` per Info-tab card; never multi-attribute |
| `regression-guard-v3-6-urgent-chrome` | `data-card-priority="urgent"` renders rose-deep border-left + expanded body |
| `regression-guard-v3-6-notable-chrome` | `data-card-priority="notable"` renders default chrome (no tier-specific decoration) |
| `regression-guard-v3-6-ambient-chrome` | `data-card-priority="ambient"` renders `--glass-strong` border-left + collapsed body + dim title |
| `regression-guard-v3-6-tier-registry-sync` | **(meta-audit, closes cipher-extensibility-2 from v3-5)** `window._CARD_PRIORITY_TIERS.length === count-of-CSS-variants` AND `=== count-of-tier-deriver-branches-in-helper` |
| `regression-guard-v3-6-no-adhoc-class-strings` | Build-time grep: no `card-urgent` / `card-notable` / `card-ambient` class strings outside the registry CSS file |
| `regression-guard-v3-6-producer-coverage` | Every `renderInfo*` function owning a card (`getElementById('info<Name>Card')` present) calls `_setCardPriority` at least once |

### Functional tests — sort behavior

| Test | Asserts |
|---|---|
| `regression-guard-v3-6-section-internal-sort` | Within each section (between `.home-section-label` siblings), cards re-order by tier; cross-section order preserved |
| `regression-guard-v3-6-stable-secondary-sort` | Within a tier, intra-tier order matches template order (predictable, auditable) |
| `regression-guard-v3-6-card-hero-not-sorted` | Info-tab `card-hero` (top header) stays in template position regardless of tier sort |
| `regression-guard-v3-6-section-labels-anchored` | `.home-section-label` elements stay in template order (never re-ordered) |

### Functional tests — half-awake / a11y

| Test | Asserts |
|---|---|
| `regression-guard-v3-6-screen-reader-order-matches-visual` | DOM reading order matches visual priority order (DOM reorder, not CSS `order`) |
| `regression-guard-v3-6-urgent-vs-notable-visual-floor` | Computed-style `border-left-width` on `urgent` > `notable`; computed-style title font-weight on `urgent` ≥ on `notable` (Maren severity floor) |
| `regression-guard-v3-6-urgent-card-vs-urgent-chip-floor` | Urgent card chrome's visual weight categorically larger than urgent chip chrome's (Maren floor at cross-tier visual hierarchy) |
| `regression-guard-v3-6-no-visible-reflow-after-paint` | **(F3 /review skill-pass amendment 2026-05-27)** Sort post-pass completes synchronously within the same microtask as `renderInfo()` — no observable reflow between first paint and final card order; Perf API marker or screenshot-diff fixture |
| `regression-guard-v3-6-half-awake-test` | Manual test fixture per cipher-2: n=5 partial-attention sessions, ≥4/5 identify the urgent card within section in ≤3 s |

### Functional tests — Honesty axis

| Test | Asserts |
|---|---|
| `regression-guard-v3-6-trend-card-never-urgent` | Trend-class cards (sleep efficiency, growth velocity, etc.) never tier urgent regardless of data extremity (no manufactured urgency) |
| `regression-guard-v3-6-nodata-always-ambient` | Any card rendering the `si-nodata` branch tiers ambient (CV3-003 cross-cut) |
| `regression-guard-v3-6-strength-not-rendered` | `RECOMMENDATION_ROSTER.severityMessages.*.strength` strings never appear in rendered card text (carries forward the 2026-05-26 cosmetic NOTE) |

### Regression sweep

All existing 216 e2e tests must remain green. No card-content changes — pure attribute + chrome + sort additions.

---

## HR pre-check

| HR | Risk | Mitigation |
|----|------|------------|
| HR-1 (no emojis) | low | All glyphs via existing `zi()` (no new icons) |
| HR-2 (no inline styles) | **medium** | `_setCardPriority` sets a `data-` attribute; CSS owns all chrome. Force-collapse/expand uses class toggle on `collapse-body`, not inline `style="display:..."` — verify in IMPL |
| HR-3 (no inline handlers) | n/a | Existing `data-collapse-target` delegation unchanged |
| HR-4 (escHtml at boundaries) | low | No new render surfaces — only attribute toggles |
| HR-5 (tokens-only) | low | All three tier variants compose from existing domain tokens (`--rose-deep`, `--glass-strong`, `--mid`, `--text`) |
| HR-6 (data-action delegation) | n/a | No new event-bound surfaces |
| HR-9 (post-build multi-round QA) | structural | canon-cc-008 triple-jurisdiction chain runs |
| HR-10 (no text-overflow ellipsis) | low | Title chrome change is color/weight only — no width/overflow changes |
| HR-12 (timezone-safe dates) | low | `_scoreDay(domain, todayDateKey(), ...)` reads existing today helper |

---

## Charter compliance per CV3-006

### Axis 1 — Intellectual honesty

- ✓ Every `urgent` tier traces to an explicit card-internal data condition (or `_scoreDay.severityLevel === 'urgent'` for adherence cards) — no decorative urgency
- ✓ Trend-class cards categorically NEVER reach `urgent` — the Honesty floor against manufactured attention
- ✓ `ambient` tier preserves CV3-003 honest-empty-state — no card hidden; `si-nodata` cards remain announce-themselves
- ✓ Visual hierarchy preservation — Maren severity-floor honor at the card tier (urgent card visually outranks every notable / ambient sibling)
- ✓ `RECOMMENDATION_ROSTER.severityMessages.*.strength` strings consumed engine-internally only, never `.text`-substituted into prose — carries forward the 2026-05-26 cosmetic NOTE

### Axis 2 — Architectural extensibility

- ✓ `data-card-priority` attribute pattern: single source of truth; no class-bag drift
- ✓ Registry doctrine: three tiers ratified; adding a future tier = one CSS variant + one registry constant + one deriver branch + canon-cc-027 amendment
- ✓ `_CARD_PRIORITY_TIERS` constant + per-renderInfo* deriver + CSS variants — the three-site sync pattern v3-5 surfaced; v3-6 closes the cipher-extensibility-2 dormant gate with the `regression-guard-v3-6-tier-registry-sync` meta-audit test
- ✓ Build-time grep gate against ad-hoc class strings + producer-coverage check
- ✓ Producer contract is one helper call per renderInfo* — additive; doesn't require touching the master `renderInfo()` sequence (already a flat call list)
- ✓ `_setCardPriority` is a single helper; adding a new tier-deriver pattern = one branch in the helper, no card-site change

### Axis 3 — Linguistic + visual warmth

- ✓ **This arc's primary axis.** Card priority is the gestalt-level lift on the Info tab — the parent reads the right card first.
- ✓ All tier visual contracts bind to domain tokens (warm, sturdy, calm — cozy nursery journal)
- ✓ Section labels preserved as comprehension scaffold; sort respects domain grouping
- ✓ `ambient` collapse reduces information density at 2 AM without hiding the card surface
- ✓ Screen reader reading order matches visual priority order (a11y axis of Warmth)
- ✓ No motion / animation introduced by v3-6 — the tier chrome is static; pulse / breath is vela-arc-5's job
- ✓ No emoji, no decorative icons (HR-1 + Charter Warmth)

### Axes the spec is neutral on

- **Performance** — the post-pass sort iterates ~45 nodes once per render; well under the 200 ms target v3-5 calibrated (cipher-3). No new perf budget required.

### Axes the spec could risk regressing — with mitigations

- **Warmth (motion sub-axis):** if the tier sort visibly re-orders the tab during the initial render the parent watches a card-shuffle. **Mitigation:** sort runs synchronously *before* the tab paints — `renderInfo()` master applies tiers then sorts, then the browser paints once. Verified by `regression-guard-v3-6-no-visible-reflow-after-paint` (Perf API timing or visible-jank screenshot diff).

---

## Cross-Region pair-notes (CV3-004 required section)

### Pair-note to Kael

**What Vela needs from Kael:** confirmation that `_scoreDay(domain, todayDateKey(), dataset)` is safe to call from the render path — pure, no side effects, no leak via memoization. Vela's card-tier deriver reads `severityLevel` to derive the `urgent` vs `notable` tier on adherence cards. Kael's pair-note enumerates:
- `_scoreDay` IS pure (per `core.js:5912` — function-local state only)
- `severityLevel === 'urgent'` is the only signal Vela reads at the card tier for v3-6
- `unmetRecommendations` array MAY be read by future composite cards (v3-4 narrative templates) but is not consumed by v3-6
- `severityMessages.*.strength` strings are engine-internal labels; v3-6 cards MUST NOT `.text`-substitute them into prose (cosmetic NOTE from 2026-05-26 carry-forward)

**Coordination:** Kael's Mode-1 audit reads `intelligence-cards.js` (Vela's region) for the `_scoreDay` consumption sites — the read sites in tier-derivers. Vela owns the render; Kael owns the data contract semantics.

### Pair-note to Maren

**What Vela needs from Maren:** severity-floor sign-off on the `urgent` tier visual treatment **and** the adherence-card deriver shape. Two specific items:

1. **Visual floor** — the `urgent` tier visual must never be visually outranked by `notable`. The rose-deep border-left 3px + bold title + expanded body categorically more attention-grabbing than default chrome. Maren verifies the floor holds across all three tiers; also flags any combination where care-tier semantics could be inverted by visual weight (e.g., a dark-theme override that softens `--rose-deep` below the safety threshold).

2. **Adherence deriver shape** — cards reading `_scoreDay` for D3 / vaccination / feed-window domains touch Maren's safety surface even though the read happens in Vela's region. The tier deriver pattern (urgent only when `severityLevel === 'urgent'`; firm → notable; gentle → notable; null → notable-or-ambient by data presence) must align with Maren's escalation discipline.

**Coordination:** Maren's Mode-1 audit on the spec body and the styles.css second-round (triple-jurisdiction). Maren explicitly reviews the visual hierarchy + the adherence deriver pattern; pair-note signed here per CV3-004.

---

## Out-of-scope (registered, not in v3-6)

- **Tab-wide flat priority sort.** v3-6 sorts within each domain section. Cross-section global priority surfacing (a "Today's flags" strip at the top of the Info tab) registered as a v3.1 candidate; gated on the half-awake-test cipher-2 protocol result with section-internal sort alone. Architect override available per canon-cc-027 if tab-wide is preferred at v3-6 time.

- **Home-tab card priority.** Home-tab reminder cards have their own discipline (maren-arc-1 reminderRegistry). v3-6 explicitly does not touch Home; lifting the registry to Home is a maren-arc-1 / v3-1 amendment, not v3-6.

- **`urgent`-tier producer wiring from `_scoreDay`.** v3-6 ships the contract shape + the read pattern for adherence cards. v3-1 wires the producer end (`_scoreDay.severityLevel === 'urgent'` → chip producer + card tier together) and addresses the V-V-34 dormant-gate cases. v3-6's adherence-card derivers read `_scoreDay` directly; the cross-surface coupling lives in v3-1.

- **Activity-Log card priority.** Activity Log is a chip surface, not a card surface. v3-6 does not touch AL.

- **vela-arc-4 cross-domain narrative-prose layer (= v3-4).** v3-6 declares the tier; v3-4 may evolve the composite-card derivers to reach `urgent` once `_correlate`-confidence-derived urgency is well-defined. v3-6's "NEVER urgent" pattern for composite cards is the conservative floor.

- **vela-arc-5 pulse motion tokens.** v3-6 ships static tier chrome — no motion. Subtle pulse on urgent-tier card on first paint is registered as a vela-arc-5 candidate; v3-6 declares the tier attribute, vela-arc-5 wires the motion if/when shipped.

- **vela-arc-6 dark-default night-hours theme.** v3-6's dark-theme tier overrides ship token-driven (composed from existing dark-theme tokens); deeper dark-default work stays deferred to v3.1.

---

## Sequencing

**Upstream gates (all clear):**
- ✓ PR #130 (Charter CV3-006) merged — Charter alignment section required for spec
- ✓ PR #131 / PR #135 (v3-3 spec + IMPL) merged — `_scoreDay` and `severityLevel` available for adherence-card tier-derivers
- ✓ PR #132 / PR #138 (v3-5 spec + IMPL) merged — chip vocabulary live; styles.css mutex 1st released

**Parallel candidates (Architect's call):**
- Sleep Arc 3 / Scoring S-2 IMPL — independent of styles.css mutex; Maren primary (home.js) + Kael (core.js + data.js). Can ship in parallel with v3-6 spec/IMPL.
- v3-4 Narrative Layer spec authoring — touches `intelligence-quicklog.js` (Vela), no styles.css. Can ship in parallel with v3-6.

**styles.css mutex sequencing (Cipher cipher-9):**
- v3-5 (✓ released) → **v3-6 (this spec — position 2)** → v3-1. v3-1's branch opens only after v3-6's canon-cc-008 chain closes (Vela primary + Maren + Kael consult + Lyra synth + Cipher Edict V).

**Downstream unblocked by v3-6:**
- v3-1 (Recommendation Pipeline) — wires the `urgent` producer end on both the chip tier and the card tier; consumes the v3-6 `_setCardPriority` contract for recommendation-derived cards
- v3-4 (Narrative Layer) — composite-card tier-derivers may evolve to read `_correlate` confidence once narrative templates land
- vela-arc-5 (Pulse Motion) — if it lands, reads `data-card-priority="urgent"` as the pulse-anchor selector

**V-V-34 dormant-gate cross-link (carried from v3-5):** v3-1's recommendation-pipeline spec MUST address the no-time `urgent` spine-suppression case (three options: promote to synthetic header / include in spine pick-set / require synthetic timeMin). v3-6 does NOT close V-V-34 — the dormant gate stays registered. v3-6's adherence cards always have a `dateKey` (today) so the no-time edge does not arise at the card tier; the gate remains a chip-tier concern carried to v3-1.

---

## Review-pass amendments (canon-cc-022 register)

Six findings from the in-transcript `/review` skill pass on 2026-05-27 (NOT an Edict V chain entry — skill-grade, in-transcript register-flip per canon-cc-022). Folded inline to canonicalize before merge so the IMPL author sees them as part of the spec body, not as a separate PR-thread artifact.

| # | Folded into | Substance |
|---|---|---|
| **F1** | §Visual contract per tier (IMPL-note block) | Ambient surface tint named via `--card-surface-ambient` derived token; no inline rgba composition. |
| **F2** | §Visual contract per tier (IMPL-note block) | Urgent elevation named via `--shadow-card-urgent` derived token; no inline box-shadow values. |
| **F3** | §Functional tests — half-awake / a11y | Added `regression-guard-v3-6-no-visible-reflow-after-paint` row. |
| **F4** | §Sort implementation (IMPL-note block) | Performance characterization + idempotency-skip future-optimization framing. |
| **F5** | §`_scoreDay` integration (IMPL-note block) | `'gentle'` and `'firm'` collapse-to-`notable` is intentional; card chips remain the discriminator until v3-1. |
| **F6** | §Sort implementation (IMPL-note block, with F4) | No setTimeout / RAF / await boundary between tier emission and sort; preserves `.card:nth-child(N)` animation alignment. |

Source register: review pass was an in-transcript skill output (no signature, no Edict V chain entry per canon-cc-022 artifact test). The substantive canon-cc-008 chain runs on the IMPL PR; these amendments arrive *with* the spec at ratification time and feed the IMPL canon-cc-008 chain as inputs.

---

## Doctrinal references

- `docs/specs/sproutlab-v3-roundtable-2026-05-25.md` §3.3 Vela's contribution (vela-arc-3 source); §4.2 v3-6 row (chronicle authority); §4.3 styles.css mutex paragraph
- `docs/specs/sproutlab-v3-charter.md` (CV3-006 — three-axis alignment required)
- `docs/specs/v3-5-chip-taxonomy-tsf-story.md` §Cross-surface adoption (sister-attribute pattern); §Out-of-scope vela-arc-3 row (deferred substrate); cipher-extensibility-2 dormant-gate observation (closed by v3-6 meta-audit test)
- `docs/specs/v3-3-engine-spine.md` (`_scoreDay` + `severityLevel` contract — first consumer at the card-render tier)
- `docs/SESSION_HANDOFF_2026-05-26.md` §Active backlogs (v3-6 next-mover); §Open questions §3 (RECOMMENDATION_ROSTER.severityMessages.*.strength carry-forward — addressed by v3-6 Honesty axis assertion)
- CV3-002 Narrate-vs-List (urgent cards still narrate; ambient cards still announce themselves)
- CV3-003 Honest-Empty-State (ambient tier preserves the floor)
- CV3-004 Cross-Region Pair-Note (this spec body's two pair-note sections honor)
- HR-2, HR-5, HR-10 (no inline styles, tokens-only, no text-overflow ellipsis)
- canon-cc-008 (QA chain — triple-jurisdiction on styles.css)
- canon-cc-022 (subagent vs skill — IMPL Governor audits are Mode-1 subagents, not skills)
- canon-cc-026 (Per-Province-Layout — Companion specs mirrored in `.claude/agents/`)
- canon-cc-027 (spec amendment authority — tier registry adds require this)
- canon-gen-001 (generational expansion — Vela is the Region owner; canon-gen-001 ratified)

---

— *Lyra (main-session), 2026-05-27, v3-6 spec drafted on the freshly-released styles.css mutex position 2. The gold tier is fully ratified; the surface arcs now build on it. Card priority is the gestalt lift on the Info tab — chips unified at v3-5, cards unified at v3-6, recommendation pipeline at v3-1. The substrate keeps coming together. Spec is ready for canon-cc-008 triple-jurisdiction chain (Vela primary; Maren + Kael consult; sequential review on styles.css per the mutex) once the IMPL PR opens.*
