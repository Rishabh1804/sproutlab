# SproutLab — Design Principles
**Version:** 1.4 · **Created:** 9 April 2026 · **Updated:** 3 June 2026
**Forked from:** DESIGN_SYSTEM_TEMPLATE.md v1.0
**App:** Baby development tracker for Ziva (born Sep 2025)
**Architecture:** Split-file HTML PWA (build-concatenated), localStorage persistence, no backend
**Context:** Used on a phone by new parents, often one-handed while holding a baby — warm, gentle, reassuring

---

## 1. Brand & Visual Identity

### Personality

**Warm, sturdy, calm.** SproutLab feels like a cozy nursery journal, not a clinical health app.

- **Not clinical:** No stark whites, no hospital blues, no sharp corners. The app sits on soft cream (`--cream: #fffaf7`), not white.
- **Not flashy:** No neon accents, no aggressive animations. Transitions are gentle (`--ease-med: 0.22s`), never bouncy.
- **Warm base:** Every screen has a cream/peach warmth underneath. Cards float on soft shadows, not hard borders.
- **Sturdy surfaces:** Cards use solid backgrounds with subtle shadows. No translucent glass effects on primary content.

### Typography

| Font | Use | Token |
|------|-----|-------|
| **Fraunces** (serif) | Hero headlines, scores, card titles, countdowns, gauge values | `--ff-display` (not yet tokenized — use `'Fraunces', serif` directly) |
| **Nunito** (sans-serif) | Body text, labels, buttons, form inputs, chips, navigation | `--ff-base` (not yet tokenized — use `'Nunito', sans-serif` directly) |

Never use system fonts, Arial, or Helvetica in new code. Both Fraunces and Nunito are loaded via Google Fonts in the HTML head.

**Text zoom:** Three tiers (default, medium, large) controlled by `data-zoom` attribute on `:root`. All `--fs-*` tokens scale proportionally. The `.header` block is exempt (always uses default tier to prevent layout overflow).

### Color System

#### Domain Colors (7 domains)

| Domain | Accent | Light BG | Text Color | Usage |
|--------|--------|----------|------------|-------|
| **sage** | `--sage` #b5d5c5 | `--sage-light` #e8f5ef | `--tc-sage` #3a7060 | Diet, nutrition, positive status, "good" |
| **rose** | `--rose` #f2a8b8 | `--rose-light` #fde8ed | `--tc-rose` #9e3e52 | Medical alerts, illness, "action needed" |
| **amber** | `--amber` #e8b86d | `--amber-light` #fef6e8 | `--tc-amber` #8a6520 | Caution, trends, food warnings |
| **lavender** | `--lavender` #c9b8e8 | `--lav-light` #f0ebfb | `--tc-lav` #6e5e9a | Milestones, achievements, intelligence |
| **sky** | `--sky` #a8cfe0 | `--sky-light` #e8f4fa | `--tc-sky` #336580 | Sleep, hydration, weather |
| **indigo** | `--indigo` #9ba8d8 | `--indigo-light` #edf0fa | `--tc-indigo` #4a5080 | Sleep intelligence, night data |
| **peach** | `--peach` #fad4b4 | `--peach-light` #fef3ea | — | Warm accents, outing planner, warmth |

**Rule:** Every new card, section, or feature must use one of these domain colors. No ad-hoc hex values in innerHTML strings.

#### Tint System

**Definition.** A *tint* is how a surface signals which domain it belongs to without competing with its content — domain identity carried by the background instead of by text or icon. Tint is the background member of the domain triad (accent = structural/border member, `--tc-*` = text member). It is **not a single scale.** The app uses **two families of tint across four registers**, and the "Light BG" column of the Domain Colors table is only *one* of them.

**Two laws hold across all four registers** — write these down because both are invisible in the token names and easy to get backwards (a wrong call here is exactly how a wash ends up "barely visible"):

1. **Light/dark hue-swap.** Light mode tints with the **pale accent** hue (`--sage` `#b5d5c5` …); dark mode tints with the **deep `--tc`** hue (`rgba(58,112,96,…)` …). *Never the same hue in both modes.* A pale-accent wash over a dark surface muddies to grey; a deep-hue wash over cream reads as dirt. The token name doesn't tell you which — the `[data-theme="dark"]` block does.
2. **A tint is never a bare fill.** Every legible tint travels with a companion — a `border-left` accent, a 5px stripe, and/or `--tc-*` text. A domain wash *alone* on a card does not read (especially `--*-light`, which sits at ~91% L). If you drop a tint with no border and no domain text, you have built the invisible case.

---

**Family 1 — Cream-card tints** *(card stays cream; the tint is layered over `--warm`)*

- **Hero cards** (`.card.card-hero.*`, `styles.css:5491–5595`). The section's top card: a **two-domain directional gradient** body (`135deg`, full `--*-light` strength) **plus a 5px top stripe** (`::before`) that is a saturated accent-pair gradient. Each pairing is **semantic, not decorative** — sage→amber = nutrition (diet), indigo→lavender = night/calm (sleep), lavender→sky = clinical/trust (medical), sage→lavender = achievement (milestones), amber→peach = gut (poop), rose→peach = body (growth), peach→lavender = analysis (insights); home is the signature rose→peach→sage→lavender rainbow. In **dark mode** the body composites warm overlays over `--surface` and goes moody/low-contrast — **the un-inverted bright stripe becomes the primary section signal** (it is the fallback identity layer, which is why `::before` is *not* dark-overridden).
- **Ambient body wash** (`#tab-* .card`, light `styles.css:5993–5997`, dark `:7634–7638`). Every *non-hero* card in a tab: `--warm` + one faint domain wash @ **8–10% α**. Faint **by design** — this is warmth, not a label. Per-tab domain map:

  | Tab | Domain | Light hue | Dark hue |
  |---|---|---|---|
  | diet | **sage** | accent @ .10 | deep @ .08 |
  | sleep | **indigo** | accent @ .10 | deep @ .08 |
  | poop | **amber** | accent @ .08 | deep @ .08 |
  | medical | **rose** | accent @ .08 | deep @ .08 |
  | milestones | **lavender** | accent @ .08 | deep @ .08 |

  **Coverage gap (deliberate):** `home` and `info/intelligence` body cards take **no** ambient wash — home leans on its hero, info-tab cards are the Receded register below. A new card in those tabs is *supposed* to be untinted; don't "fix" it.

- **Food-domain whisper** (`.dt-*` — the food/recipe-card fade; ratified 2026-06-03, Library-rework + Recipes tab). A **single-domain directional gradient layered over a cream card — a fade, never a flat fill**:
  - light: `background-image: linear-gradient(135deg, transparent 40%, rgba(<accent>, 0.22))`
  - dark (hue-swap, Law 1): `linear-gradient(135deg, transparent 30%, rgba(<deep --tc>, 0.16–0.18))`

  It carries a food's **FOOD_TAX domain** (grains→sage, fruits→rose, vegs→peach, dairy→sky, nuts→lavender, spices→amber, nonveg→rose) as **warmth, not a label**, so it always rides a **separate companion channel** (Law 2): a `border-left` rail + `--tc` text/icon. **Polarity-collision rule (load-bearing):** the food-domain palette overlaps the safety palette (sage reads "safe", rose reads "alert"), so the food domain stays a *corner whisper* and the **safety/polarity signal lives on its own channel** — the rail in the Library's polarity grouping (encourage→sage / conditional→amber / warn→rose / inform→sky), the verdict shell in "Can I give this?" — so domain and safety never compete. Per-domain accent rgba (light): sage `181,213,197` · rose `242,168,184` · peach `250,212,180` · sky `168,207,224` · lav `201,184,232` · amber `232,184,109`. Deep hue (dark): sage `58,112,96` · rose `158,62,82` · sky `58,112,144` · lav `110,94,154` · amber/peach `138,101,32`. Lands as shared `.dt-*` classes in `styles.css` when wired. **This — not the flat `_foodColorMap` `--*-light` fill — is the food/recipe *card* treatment;** the flat fill remains only for small food chips/pills (Receded, below).

**Family 2 — Colored-card tints** *(the wash IS the surface)*

- **Signaling** (`--surface-*`, defs `styles.css:81–86` light / `:5269–5274` dark). The wash that reads on its own: the **deep / `--tc` hue at ~10–12% α** (`--surface-sage: rgba(61,122,96,0.12)` — note: deep hue, *not* the pale accent). Use when the surface itself must say "domain X." Always paired with a `border-left` accent (e.g. `.enc-benefit`, `.cons-severe`, `.combo-result.caution`).
- **Receded** (`--*-light` flat fill, defs `styles.css:31–62`). The palest tier and the **most-used** fill (130 `--sage-light` sites): info-cards, pills, chips. **Only valid inside a bordered card with `--tc-*` text** — it carries no signal alone (Law 2). This is the Info-tab "cool tint, dashed border" tier (`styles.css:2537`).

---

**Component tint aliases.** Where a component is colour-agnostic and inherits its domain from a parent (`data-domain`) or variant class, it reads its wash through an alias so one rule serves every domain:

| Alias | Defined | Resolves to | Consumed by |
|---|---|---|---|
| `--al-tint` | `styles.css:9412–9416` (+ default `:6358`) | a `--*-light` per `data-domain` | Activity-Log rows, milestone bulk/domain chips |
| `--vd-tint` | `styles.css:4115–4121` | a `--*-light` per `.viz-detail-*` variant | viz-detail panels |

**Developmental-domain remap (`--al-tint`).** The Activity-Log alias is the one place tint crosses *namespaces*: the five **developmental** domains (`data-domain="motor|language|cognitive|social|sensory"`) remap onto **colour** domains — Motor→sage, Language→lavender, Cognitive→sky, Social→peach, Sensory→amber (`styles.css:9408–9416`). Intentional, not a collision: a developmental domain is not a colour domain, and the mapping is documented at its definition so a Governor auditing a `data-domain` block knows it is a deliberate cross-walk, not an ad-hoc pick.

**Authoring rule.** Never hand-mix a wash at the call site. Reach for the register that matches the job — Hero gradient for a section header, Ambient for a body card in a tinted tab, the **Food-domain whisper (`.dt-*`) for a food/recipe card**, Signaling `--surface-*` when the surface must read alone, Receded `--*-light` for a bordered info-card or chip — or a component alias. No raw light-hex (`#e8f5ef`, `#f0ebfb`, …) in CSS or innerHTML — that is the 8th-instance `running-beats-reading` drift class (see Polish-3/-4 `--lav-light` corrective, line ~147).

**Peach text-on-wash — only via `--tc-peach` (defined v1.4).** Peach was historically accent-only, with no `--tc-*` text token (the `—` in the `--tc-*` column of the Domain Colors table and the dark-mode table, line ~594) — `--peach-light` a *backing* tint only, never text-on-wash. **As of v1.4 `--tc-peach` IS defined** (light `#9a5f30` / dark `#e8b488`), introduced for the food-domain **vegetables** chip (`.fdom-chip--vegs`, §10.5) — the sanctioned "define first" path — which also retires the long-standing referenced-but-undefined `--tc-peach` dangling reference (`styles.css` `.meal-time-input:focus`). Peach text-on-wash is now permitted, but **only via the `--tc-peach` token**, never an improvised call-site hex; and the *card* register (Hero / Signaling) still keeps peach to warmth/accent, not body copy.

**Not tints (runtime-computed, palette-exempt).** Some surfaces *look* tinted but are computed at render-time from runtime data, not drawn from any register above — chiefly the **Growth-gauge ring percentile-tint** (`medical.js:1912–1932`). These are `--dyn-*` / locked-exclusion surfaces (see CSS-Custom-Property Pivot Convention below) and are explicitly **out of scope** for the tint system; do not "tokenize" them into `--*-light`.

#### Food-Domain Colour & the Polarity Collision

There is a **second** colour system in the app, orthogonal to the 7 UI domains: every food carries a **food-category colour**. It is shipped and load-bearing, but until now undocumented.

**The taxonomy** (`FOOD_TAX[*].color`, `data.js:2045`):

| Food category | Colour | | Food category | Colour |
|---|---|---|---|---|
| grains & cereals (incl. legumes) | **sage** | | nuts & seeds | **lav** |
| fruits | **rose** | | spices | **amber** |
| vegetables | **peach** | | non-veg (eggs, seafood, meat) | **rose** |
| dairy & fats | **sky** | | | |

Three shipped maps resolve a category colour to CSS (`data.js:2114–2116`): `_foodColorMap` (→ `--*-light` fill), `_foodBorderMap` (→ `rgba()` border), `_foodTextMap` (→ text colour). A food pill keys its colour off `FOOD_TAX.color`, **not** off any per-pill hex.

**The collision (the load-bearing constraint).** Food-category colour and **safety-polarity** colour (sage = "introduce early", amber = "right time/form", rose = "wait / danger", sky = "good to know") **share the same 7 tokens with opposite meanings**. The worst overlap: **`rose` means both "danger/wait" *and* "non-veg / fruit."** So a food-domain-coloured egg or fish pill (non-veg → rose) dropped into a sage "introduce early" zone reads as *"this food is unsafe"* — the exact opposite of the truth. **You cannot wash a surface with both systems at once.**

**The resolution — one structural channel, one whisper channel.** When both dimensions must appear on the same element (e.g. a Library food tile), they split across two *visually distinct* channels, and **safety always wins the structural channel**:

| Dimension | Channel | Treatment |
|---|---|---|
| **Safety polarity** (leads) | structural | left **rail** (`border-left`, the polarity accent) + the **section header** in the polarity `--tc-*` |
| **Food domain** (rides under) | a subtle **fade** | a hero-style `background-image` whisper over a solid `--card-bg` — pale **accent** ~22% in light, deep **`--tc` hue** ~16% in dark (the §Tint hue-swap law) |

Because the food-domain channel is a *whisper*, not a wash, the rose on a non-veg pill never competes with the polarity rail/zone — it's a soft corner glow, not an alarm. **Rule of thumb:** if two colour systems must coexist on one surface, give the safety-critical one the structural channel (rail/border/header/icon) and demote the other to a sub-perceptual fade — never two competing fills or two competing washes. The one true alarm (the Emergency Deck's loud rose) stays louder than every tint, in either mode.

*(Worked design record: `docs/design/library-redesign/03-*` — the Library's polarity grouping + per-food domain whisper, light and dark.)*

#### Domain → Element Assignments

| UI Element | Domain Color | Why |
|-----------|--------------|-----|
| Home hero score | sage (good) / amber (fair) / rose (attention) | Score-driven |
| Diet tab, food cards | sage | Nutrition = growth |
| Sleep tab, sleep cards | sky / indigo | Night sky association |
| Poop tracking | amber | Digestive caution |
| Medical tab, vaccination | rose | Medical alertness |
| Milestones, achievements | lavender | Celebration, progress |
| Activity logger | lavender | Activity = development |
| Alerts (positive) | sage | Reinforcement |
| Alerts (caution) | amber | Watch-level |
| Alerts (action) | rose | Needs intervention |
| Today So Far | neutral (cream/warm) | Timeline, not domain-specific |
| Outing planner | peach | Warm, outdoor feel |
| Score popup | per-domain | Each domain gets its own color |
| QA / search bar | lavender | Intelligence system |

#### Status Triad

| Meaning | Surface | Text | Use |
|---------|---------|------|-----|
| Good / positive | `--surface-sage` | `--tc-sage` | On-track scores, confirmations |
| Watch / caution | `--surface-warn` / `--surface-caution` | `--tc-caution` / `--tc-warn` | Declining trends, mild warnings |
| Action / urgent | `--surface-danger` | `--tc-danger` | Fever alerts, overdue vaccinations |

#### Token Family Naming Rule (Polish-4 doctrine codification)

Token-name prefixes carry semantic role. **Mixing prefixes for the same value at different roles is forbidden** — every token belongs to exactly one role family.

| Prefix | Role | Examples |
|---|---|---|
| `--surface-*` | **Backgrounds** (card / pill / banner fills) | `--surface-warn` `#fffdf5`, `--surface-sage`, `--surface-danger` |
| `--tc-*` | **Text colors** (text-on-light, text-on-color, text-on-dark) | `--tc-warn` `#856404`, `--tc-sage`, `--tc-danger` |
| `--border-*` | **Border-accents** (left-rule colors, separator strokes) | `--border-warn` `#ffc107`, `--border-warn-soft` `#ffd166` |
| `--accent-*` | **Structural fills + state-active backgrounds** (button fills, pill `:active`, gradient endpoints carrying perceptual hierarchy) | `--accent-w` `3px` (border-width), `--accent-sage-deep` `#3d7a60` |
| `--ff-*` | Font-families (planned; `--font-display` / `--font-body` deferred to dedicated PR) | not yet tokenized |
| `--fs-*` | Font-sizes (text scale tier-aware) | `--fs-base`, `--fs-xl`, `--fs-2xs` |
| `--sp-*` | Spacing | `--sp-2`, `--sp-8`, `--sp-16` |
| `--r-*` | Border-radius | `--r-sm`, `--r-lg`, `--r-2xl` |
| `--ease-*` | Animation timing | `--ease-fast`, `--ease-med`, `--ease-slow` |
| `--dyn-*` | **Dynamic-required values** (computed at render-time from runtime data, NOT from the sanctioned palette). Pairs with utility classes that consume them via `var()`. See "CSS-Custom-Property Pivot Convention" section below. | `--dyn-pct` (introduced Polish-6) — width/height percentage values for progress-bars / fill indicators |

**Why this rule:** prevents collision between conceptually-distinct values that share a semantic axis (e.g., `--accent-w` is a border-width, `--accent-warn` would be a border-color — code-review glance-readability is fragile when the prefix carries dual meaning). Polish-4 codified this rule alongside introducing 9 new tokens that follow it; Polish-6 extends the rule with `--dyn-*` family prefix to declare "value computed at render-time, not from the design-token palette" — load-bearing for future Governors auditing whether a value originated in a sanctioned palette or from runtime data.

#### CSS-Custom-Property Pivot Convention (introduced Polish-6)

**The pivot:** dynamic-required inline-styles (where the value is computed at render-time from runtime data — e.g., `style="width: ${pct}%"`, `style="background: ${dynColor}"`, etc.) become CSS-custom-property assignments consumed by classes via `var()`. This isolates dynamic data from the sanctioned-palette token system + reduces HR-2 inline-style surface count without losing dynamic behavior.

**Pattern:**
```html
<!-- Before (HR-2 surface; value mixes static + dynamic) -->
<div style="width: ${pct}%; background: var(--surface-warn);">

<!-- After (HR-2 surface eliminated; static props in class; dynamic in --dyn-* var) -->
<div class="dyn-fill" style="--dyn-pct: ${pct}%; background: var(--surface-warn);">
```

```css
.dyn-fill {
  width: var(--dyn-pct);
  /* other static props move out of inline */
}
```

**Compound-style partial-pivot clause (Kael's Polish-6 Mode 2 surfacing):** sites that mix multiple dynamic-required properties (e.g., `style="width: ${pct}%; background: ${dynColor}"`) require **partial pivot** — pivot the property whose convention is introduced (e.g., width via `--dyn-pct`) while leaving other dynamic properties as inline-style residue (e.g., the `background: ${dynColor}` stays inline until `--dyn-bg` introduction in a future Polish-N). Multi-property compound styles ARE NOT a single-PR scope; each `--dyn-{property}` introduction lands as its own first-instance over time, parallel to the Polish-3 → Polish-4 token-introduction cadence.

**Locked exclusions** (NOT pivot-eligible — these surfaces have semantic-color contracts that mass-pivoting would silently flip; per Maren+Kael Polish-6 Mode 2 + charter §3 locked exclusions; entire `--dyn-*` doctrine lifetime, not just Polish-6):
- CareTicket banner state-color (`medical.js:5323-5368`)
- Growth-gauge ring percentile-tint (`medical.js:1912-1932`, `:1455`, `:1485`, `:1499`, `:1925`, `:1927`)
- Vaccination urgency Fraunces countdown (`home.js:896-910`, `:1361-1372`; mirror `medical.js:413`)
- Symptom emergency callout (`medical.js:2268`; Polish-2 already swapped to `zi('siren')`)
- Doctor "Call Now" tap-target (`medical.js:2364-2365`; Polish-5 extracted to `.doctor-cta-call/.doctor-cta-map`)
- Vaccine card per-state encoding (`medical.js:3713-3717`)
- Growth delta sign-color (`medical.js:1218`, `:1227`)
- Illness-episode severity colors (Fever/Diarrhoea/Vomit/Cold; `intelligence.js:7108-7158`, `:7456`, `:7649-8142`, `:8378-8385`, `:8710`; cross-Governor cascade with `--tc-danger`/`--tc-caution`)
- Sleep Intelligence ring/SVG dynamic-color math (`intelligence.js:12920-12922`, `:13637`, `:13661-13662`)
- Smart Q&A `sa-type-pct` 3-band semantic threshold color (`intelligence.js:6745`)
- CD episode delta-sign colors (`intelligence.js:14489`, `:14494`, `:14499`, `:14504`)

#### Tonal Variants & Border-Accent Tokens (introduced Polish-4)

These tokens replace ad-hoc hex literals that were duplicated across multiple consumers. Polish-4 introduced them in the same PR as the substitution sweep (per the `spec-amendment-in-substitution-PR` doctrine candidate, first-instance pending ratification).

| Token | Hex | Family | Replaces | Consumer pattern |
|---|---|---|---|---|
| `--border-warn` | `#ffc107` | border-accent | 9 styles.css sites + `medical.js:3208` retroactive (Polish-2 substitute) | Caution-amber border-left rules on `.diet-stat.alert`, `.weighin-alert.due`, `.combo-result.caution`, `.is-warn`, `.upcoming-item.in-progress`, growth-narrative borders |
| `--border-warn-soft` | `#ffd166` | border-accent | Subset of caution-amber sites (light variant) | `.tip-item.watch`, `.badge-adv`, `.rtog.active-watch` |
| `--sage-deepest` | `#1a7a42` (+ `#0a6a32` collapse) | tonal | filled-4 gradient endpoints + `.zs-score-excellent` | Milestone-state "consistent" deepest tone |
| `--sage-mid` | `#5a9a6a` (+ `#4a8a5a` collapse) | tonal | `.milestone-item.consistent` border + filled-3 endpoints | Milestone-state mid-tone |
| `--accent-sage-deep` | `#3d7a60` | structural fill | `.dqp-pill:active`, `.sg-chip:active`, `.fe-action-chip:active`, milestone-check active states | Smart Q&A / illness-episode press-feedback active states |
| `--amber-deepest` | `#b8904a` | tonal | filled-2 gradient endpoint | Milestone-state "emerging" deepest tone (distinct from `--amber-deep`; preserves perceptual hierarchy per Maren's Polish-4 Mode 2 catch) |
| `--amber-deep` | `#d4a04a` | tonal | `.milestone-item.in-progress` border + filled-1/2 gradient | Milestone-state "in-progress" signal |
| `--amber-mid` | `#e8a840` | tonal | `.milestone-item.emerging` border + filled-1 start | Milestone-state "emerging" signal |
| `--amber-text-deep` | `#886520` (+ `#8a6418` collapse) | text-on-color | `.milestone-item.in-progress .milestone-check`, `.milestone-item.emerging .milestone-check` background | Text-on-color readable-contrast tone |

**Locked exclusions** (do NOT substitute mid-Polish): CareTicket banner state-color contract (`medical.js:5323-5368`), Growth-gauge ring percentile-tint (`medical.js:1912-1932`), Vaccination urgency Fraunces countdown (`home.js:896-910/:1361-1404`). These need explicit feature-grade R-8 charters before mass tokenization touches them.

**Polish-3 coverage-gap corrective** (Polish-4 fold-in): `#f0ebfb` duplicates → `var(--lav-light)` at 5 styles.css sites. Polish-3's canonical-13 sweep missed `--lav-light` because the naming inconsistency (`--lav-light` ≠ `--lavender-light`) tripped scout pattern-matching. 8th `running-beats-reading` instance.

### Animation Foundation

**Motion One** (`window.Motion`) — app-wide animation foundation adopted at the milestones-tab-v1 IMPL (PR #162 + #163, 2026-05-28). UMD distribution via deferred CDN in `split/build.sh:127-136` after Chart.js so chart cold-start takes priority. ~12kb gzipped; WAAPI wrapper from the Framer team.

Primitives in use: `animate`, `spring`, `timeline`, `stagger`, `inView`. Scroll-linked and gesture APIs available for future arcs.

**Opt-in-with-fallback posture** — every animation call-site gates on `window.Motion` availability:

```js
if (window.Motion && window.Motion.animate) {
  window.Motion.animate(element, { x: '110%', rotate: 8, opacity: 0 },
    { duration: 0.42, easing: [0.32, 0, 0.67, 0] });
} else {
  element.classList.add('is-sliding-out');  // CSS-class fallback
}
```

The fallback engages for offline parents (in-flight), blocked CDNs, or HTML cached from a pre-Motion build. Functionally equivalent; just simpler easing.

**Reduced-motion accessibility floor** — every animation entry-point checks `window.matchMedia('(prefers-reduced-motion: reduce)')`. If matches, the animation is skipped + the callback fires immediately so the data write still happens. Per the "warm, sturdy, calm" personality (§1 Brand & Visual Identity): motion serves clarity, not flash; respect parents who've turned animations off.

**FLIP pattern for list-reorder** (PR #164). Snapshot rects pre-render → state change + re-render → compute deltas → `Motion.animate` from delta back to 0. Helpers: `_msSnapshotInWindowRects()` + `_msFLIPCards(beforeRects, opts)` in home.js. Used for milestones-tab-v1 Not-yet card slide-to-bottom + Confirm/Practicing sibling reflow. Reusable for any future list-reorder surface.

**Carve-out for `currentColor` pass-through** — see HR-2 §Carve-outs below.

### Swipe & Gesture Navigation

**Swipe-to-navigate is a first-class navigation primitive**, not an enhancement — parents browse one-handed, thumb-first. The behaviour lives in `handleSwipe()` (`split/core.js:3654`) and was code-defined only until this section. Any new tab, sub-tab, or tabbed surface (a Recipes sub-tab, the Library's wings, etc.) **must** honour these rules so the gesture stays predictable everywhere (Vela's half-awake test: one gesture, one predictable result).

**The disambiguation rule (load-bearing).** A horizontal swipe registers only when horizontal travel dominates:
- `|Δx| ≥ 60px` **and** `|Δy| ≤ 0.7 × |Δx|` (`core.js:3662`).
- Distance + ratio only — **no velocity term**. A lazy diagonal is ignored, so vertical scrolling never mis-fires a tab change.

**Guards — swipe is suppressed when** (in order, `core.js:3665-3678`):
1. focus is in an `INPUT` / `TEXTAREA`;
2. the gesture **starts inside a horizontally-scrollable element** — walk ancestors, abort if any has `scrollWidth > clientWidth + 2` and `overflow-x` is not `hidden`/`visible` (so a scrollable chip-rail or chart keeps its own pan);
3. **any overlay is open** (`.modal-overlay.open, .crop-overlay.open, .avatar-lightbox.open, .confirm-overlay, .ql-sheet.open, .ql-modal-overlay.open, .score-popup.open, .insights-popup.open`).

**Clamp, never wrap.** Every level is index-guarded and clamps at its ends — the last tab does not loop to the first. The only edge movement is the deliberate cascade below.

**Multi-level cascade (innermost wins; edges bubble up).** One gesture, resolved top-down so the outcome is never ambiguous (`core.js:3698-3769`):
1. innermost inner-sub-tabs (Diet / Milestones `log → library → patterns`) — at an inner edge the gesture **falls through** rather than dead-ending;
2. Track sub-tabs (`TRACK_SUB_ORDER`) — at an edge, steps to the prev/next **top-level** tab;
3. top-level tabs (`TAB_ORDER`).

**Order arrays (the source of truth for direction):**
- `TAB_ORDER` — `['home','growth','track','insights','history','info']` (`core.js:3403`)
- `TRACK_SUB_ORDER` — `['diet','sleep','poop','medical','milestones']` (`core.js:3404`)
- `DIET_SUB_ORDER` — `['log','library','patterns']` (`diet.js:16`)
- `MS_SUB_ORDER` — `['log','library','patterns']` (`core.js:3729`)

> **Drift hazard (active).** `DIET_SUB_ORDER` (diet.js) and `DIET_INNER_ORDER` (`core.js:3699`) are **duplicated literals, not a shared reference** — the swipe handler hard-codes its own copy. Any sub-tab added to the Diet bar (e.g. **Recipes**) MUST be added to **both** or swipe silently de-syncs from the tab bar; same for Milestones. Unifying these into one exported constant is owed tech-debt — flag it at any touch.

**Right-edge back-gesture.** A swipe that *starts* in the rightmost 10% of the viewport and moves left (`touchStartClientX > screenW*0.90 && Δx < -60`, `core.js:3681`) is the **back/exit** gesture → `handleSafeExit()` (any tab → Home; Home → confirm-exit). It uses viewport-relative `clientX` for edge detection vs `screenX` for travel. Don't repurpose the right edge for content swipes.

**User override.** Swipe-nav is toggleable (`ziva_swipe_tabs` in localStorage; Settings). Honour it — `handleSwipe` early-returns when off (`core.js:3656`).

**Transition.** A top-level tab change plays `fadeUp 0.3s` (`styles.css:295, 3556`) + scroll-reset to top; sub-panel changes are an instant display swap. Swipe adds **no** directional slide — the fade reads as "navigated" regardless of direction.

**No visible affordance.** Swipe is discoverable-by-feel; the tab/sub-tab bar is the visible control. Don't add page-dots or hint arrows without an explicit charter.

### Icon System

**zi() — Ziva Sketch icon set.** 54 custom SVG symbols defined as a `<symbol>` sprite in `template.html`. Rendered via the `zi(name)` helper function which returns `<svg class="zi"><use href="#zi-{name}"/></svg>`.

Available icons (54):
```
baby balloon bars bell bolt book bowl brain bulb camera chart chat check
chef clock crystal diaper dot-red drop flame flask halfcircle handshake
hourglass info link list lotus medical moon note palette party pill
rainbow ruler run scale scope shield siren sleep sparkle spoon sprout
star steth sun syringe target timer trophy warn zzz
```

Icon sizing via tokens: `--icon-xs(12) --icon-sm(14) --icon-base(16) --icon-md(18) --icon-lg(22)`

**HARD RULE: No emojis in new code. All icons via zi().** See HR-1.

---

## 2. Seven Design Principles (scored 1–5 per build)

Score each principle after every build. Track trends. A score below 3.5 on any principle triggers a focused improvement session.

### 1. Emphasis / Dominance
**Create a focal point that intentionally draws the user's attention.**

Home tab: Hero score card is the dominant element — largest card, Fraunces serif title, full-width. Each sub-tab has one hero element (growth chart, sleep stats, poop gauge). Score popup uses a full-screen overlay with a large centered score ring.

### 2. Unity / Rhythm
**Create repeating patterns for harmony and visual rhythm.**

Card anatomy is consistent: `.card-header` → `.card-title` (Fraunces + icon) → content body. Section labels use uppercase, `--fs-sm`, `--ls-wide`, `--mid` color. Chip families share border-radius `--r-2xl` and consistent padding. Domain colors repeat across related features.

### 3. Hierarchy
**Size, font, color define importance.**

| Level | Font | Size | Weight | Use |
|-------|------|------|--------|-----|
| Hero | Fraunces | `--fs-xl`+ | 700 | Hero card titles, score values |
| Primary | Fraunces | `--fs-md`–`--fs-lg` | 600 | Card titles |
| Body | Nunito | `--fs-base` | 400–500 | Content text, descriptions |
| Secondary | Nunito | `--fs-sm` | 600 | Section labels, chip text |
| Meta | Nunito | `--fs-xs`–`--fs-2xs` | 600 | Timestamps, counts, badges |

### 4. Balance
**Even distribution of shape and space.**

Cards have consistent internal padding (`18px 16px` mobile, `22px 24px` desktop). Section gaps use tokens: `--section-gap-hero(24px)` between hero and first content, `--section-gap-zone(16px)` between zones, `--card-gap-paired(12px)` between related cards. Chip grids use `flex-wrap:wrap` with `gap` tokens.

### 5. Proportion / Scale
**Consistent sizing via tokens.**

All new code must use the token scale. Zero raw px in new CSS (see HR-4).

Spacing: `--sp-2(2) --sp-4(4) --sp-6(6) --sp-8(8) --sp-10(10) --sp-12(12) --sp-16(16) --sp-20(20) --sp-24(24) --sp-32(32)`
Font sizes: `--fs-2xs → --fs-3xl` (9 steps, 3 zoom tiers)
Radii: `--r-sm(4) → --r-full(9999)` (6 steps)

### 6. Contrast
**Color, shape, size differentiate elements.**

Status triad (sage/amber/rose) provides three-level severity contrast. Score bands map to distinct visual treatments (90+ = sparkle, 75+ = check, 45+ = target, 0+ = warn). Dark mode inverts surfaces while preserving domain color identity — text colors lighten, backgrounds darken, but sage stays "green" and rose stays "pink."

### 7. Similarity
**Shared visual treatment groups related elements.**

All intelligence cards share the `si-*` prefix and consistent anatomy: section label → stat grid → insight text. All illness trackers share the `fe-*`/`de-*`/`vo-*`/`ce-*` pattern with identical card structure. Card tiers (hero/action/daily) share base `.card` styling with progressive overrides.

---

## 3. Hard Rules (Zero Tolerance)

Build failures. New code violating any of these must be fixed before the session ends.

### HR-1: No emojis in new code
Zero emojis in any new `innerHTML`, `textContent`, template literal, or HTML attribute. Use `zi()` icon helper instead.

**QA:** grep new code for Unicode ranges U+1F300–1F9FF, U+2600–27BF.

### HR-2: No inline styles in new code
Zero `style="..."` attributes in new HTML strings or innerHTML. All styling via CSS classes with design tokens.

**QA:** grep `style="` in new code → must be 0.

**Documented carve-outs** (each requires a named annotation comment at the site so the carve-out is auditable):
1. **Collapse-machinery-mirror** (PR #144 v3-6 IMPL) — `_setCardPriority` writes `body.style.display` + `chev.style.transform` inline for the collapse-card pattern. Mirrors `toggleHistoryCard` (intelligence-cards.js:81/87). Annotated `// collapse-machinery-mirror`. Defer to v1.x collapse-machinery unification.
2. **Motion currentColor pass-through** (PR #162 milestones-tab-v1 IMPL) — `.ms-trajectory-marker` writes inline `style="color:..."` to propagate the ACTIVITY_CATEGORIES domain accent via CSS `currentColor`. The alternative (5 per-domain CSS rules duplicating the registry accents) is exactly the parallel-table failure-mode the 9th audit gate prevents. Registry → `currentColor` pass-through keeps `window.ACTIVITY_CATEGORIES` as the single source of truth. Annotated `// motion-currentcolor-carveout` (or referenced in the rationale comment block above the inline-style site).

### HR-3: No inline event handlers in new code
Zero `onclick=`, `onchange=`, `oninput=` in new HTML. All handlers via `data-action` delegation in core.js.

**QA:** grep `onclick=` in new code → must be 0.

### HR-4: No raw px in new CSS
All spacing via `var(--sp-*)`. All font sizes via `var(--fs-*)`. All radii via `var(--r-*)`.

**Allowed exceptions:** `1px` and `2px` borders, `min-width`, `max-width`, `translateY`, `box-shadow` offset/blur values, tab/header heights (44px, 48px), `16px !important` for iOS zoom prevention.

### HR-5: No ellipsis truncation
Zero `text-overflow: ellipsis` anywhere. All text displays in full, wraps if needed.

**Current status:** ✓ Zero violations in CSS.

### HR-6: Domain colors for every surface
Every new card/section uses a domain color from the 7-domain palette. No ad-hoc hex values in innerHTML strings.

### HR-7: Dark mode token readiness
Every new CSS class with a background or text color must use tokens that have dark variants defined in the `[data-theme="dark"]` block. Dark mode is active and functional — not just token-ready.

### HR-8: Minimum tap target
All interactive elements: minimum **36×36px** tap target.

Rationale: Parent holding a baby, tapping one-handed. 44px is ideal (`.chip` class uses 44px); 36px is the floor for compact controls.

**Applies to:** buttons, chips, tappable list items, icon buttons, steppers, toggles, category cards, history headers.

### HR-9: No persistent editing in overlays
Overlays are for Read (viewing), Act (confirming), and single-field Quick Actions. Multi-field editing happens in page content or dedicated Flow overlays with dirty flags.

**Mechanical test:** If an overlay has a Save button, the total interaction before tapping it must take under 30 seconds and involve no scrolling within the overlay form.

### HR-10: All display formatting through named functions
No inline number formatting, date formatting, or currency formatting at render sites.

**Format Function Registry:**

| Function | Input | Output | Defined in |
|----------|-------|--------|------------|
| `escHtml(s)` | any string | HTML-safe string | core.js |
| `escAttr(s)` | any string | attribute-safe string | core.js |
| `formatDate(s)` | dateStr | `'Mon DD'` or `'Mon DD, YYYY'` | core.js |
| `formatTimeShort(t)` | `'HH:MM'` | `'H:MM am/pm'` | core.js |
| `toDateStr(d)` | Date | `'YYYY-MM-DD'` | core.js |
| `ageAtDate(dateStr)` | dateStr | `'Nm Nd'` | core.js |
| `formatHeight(cm)` | number | ft/in or cm string | medical.js |
| `normalizeFoodName(raw)` | string | normalized base name | core.js |

### HR-11: Chip text must wrap
No `white-space:nowrap` on chips that display variable-length content (food names, questions, milestone text). Fixed-label chips (tabs, duration selectors) may use nowrap. Chip containers must use `flex-wrap:wrap`.

### HR-12: escHtml on all user-sourced text
Every `innerHTML` assignment that includes user-entered text (food names, notes, milestone text, doctor names) must pass through `escHtml()`. No exceptions.

---

## 4. data-action Naming Convention

See ARCHITECTURE_PATTERNS.md §7.1 for the full convention: `{module}{Verb}{Target}`.

**App-specific module prefixes (CSS):**

| Prefix | Module | Scope |
|--------|--------|-------|
| `tsf-*` | Today So Far | TSF smart card (intelligence.js) |
| `tp-*` | Today's Plan | Plan card (home.js) |
| `cd-*` | Cross-Domain | Cross-domain intelligence cards (intelligence.js) |
| `si-*` | Sleep Intelligence | Sleep intel cards (intelligence.js) |
| `mi-*` | Medical Intelligence | Medical intel cards + supplement (medical.js) |
| `vc-*` | Vaccination | Vacc cards, completion, reaction (medical.js) |
| `ql-*` | Quick Log | QL sheet, modals, pills (intelligence.js) |
| `al-*` | Activity Logger | Activity log modal, chips, suggestions (intelligence.js) |
| `sp-*` | Score Popup | Score popup overlay, domain tabs (diet.js) |
| `qa-*` | Q&A / Search | Search bar, answer cards, chips (intelligence.js) |
| `fe-*` | Fever | Fever episode tracker (intelligence.js) |
| `de-*` | Diarrhoea | Diarrhoea episode tracker (intelligence.js) |
| `ep-*` | Episode (shared) | Shared illness episode UI (intelligence.js) |
| `iq-*` | Ingredient Query | Food combo / ingredient picker (intelligence.js) |
| `sg-*` | Suggestions | Food suggestion chips (intelligence.js) |
| `ob-*` | Outing Briefing | Outing planner popup (home.js) |
| `gh-*` | Growth Hero | Growth tab hero section (medical.js) |
| `nh-*` | Nutrient Heatmap | Heatmap visualization (intelligence.js) |
| `hy-*` | Hydration | Hydration intelligence (medical.js) |
| `dqp-*` | Diet Quick Picker | Diet tab quick picker pills (home.js) |
| `mb-*` | Meal Breakdown | Meal breakdown intel card (intelligence.js) |
| `wg-*` | Welcome Guide | Onboarding guide (core.js) |

**Rule:** New features pick a 2–3 letter prefix and use it consistently for all CSS classes and data-action values in that feature. The prefix is registered in this table before writing code.

---

## 5. UI Systems

### Card System (4 tiers)

| Tier | Class | Padding | Title Font | Title Size | Icon Size | Shadow | Use |
|------|-------|---------|------------|------------|-----------|--------|-----|
| **Hero** | `.card.card-hero` | 18/16 (m) 22/24 (d) | Fraunces | `--fs-xl` 700 | 40×40 `--icon-lg` | Full | Score card, tab hero |
| **Action** | `.card.card-action` | 18/16 | Fraunces | `--fs-lg` 600 | 28×28 `--icon-base` | Full + rose left border | Alerts, reminders, CTAs |
| **Daily** | `.card.card-daily` | 14/14 | Nunito | `--fs-base` 600 | 24×24 `--icon-sm` | Subtle | Meal cards, daily entries |
| **Base** | `.card` | 18/16 (m) 22/24 (d) | Fraunces | `--fs-md` 600 | — | Standard | Default, info cards |

**Card anatomy pattern:**
```html
<div class="card card-{tier}">
  <div class="card-header">
    <div class="card-title">
      <span class="icon {domain-bg}">{zi('icon')}</span>
      Title Text
    </div>
    <!-- optional: chevron, badge, action button -->
  </div>
  <!-- card body content -->
</div>
```

**Text roles inside cards:**
- `.card-body-text` — `--fs-base`, `--lh-relaxed`, `--text` color
- `.card-detail` — `--fs-sm`, `--lh-relaxed`, `--mid` color
- `.card-meta` — `--fs-xs`, uppercase, `--ls-normal`, `--light` color

### Section Label System

| Class | Color | Use |
|-------|-------|-----|
| `.section-label` | `--mid` | Default section headers |
| `.section-label-danger` | `--tc-danger` | Critical sections |
| `.section-label-warn` | `--tc-warn` | Warning sections |
| `.section-label-info` | `--mid` | Informational sections |
| `.home-section-label` | `--light` | Home tab zone labels (3 tiers: `.sec-t1` `.sec-t2` `.sec-t3`) |

All section labels: `--fs-sm`, `font-weight:600`, `text-transform:uppercase`, `letter-spacing: --ls-wide`.

### Overlay System

See ARCHITECTURE_PATTERNS.md §13 for the Read/Act/Flow framework.

| Overlay | Intent | Class | Close behavior |
|---------|--------|-------|---------------|
| Score popup | Read | `.score-popup` | Outside tap, × button |
| Modals (growth, vacc, med, etc.) | Flow | `.modal-overlay` + `.modal` | × button only |
| Confirm action | Act | `.modal-overlay` | Cancel/Confirm buttons |
| Quick Log sheet | Flow | `.quick-log` | × button, outside tap |
| Outing briefing | Read | `.ob-scrim` | × button, outside tap |
| Bug reporter | Flow | `.bug-scrim` | × button, outside tap |

### Chip System

**Base class:** `.chip` — `display:inline-flex`, `align-items:center`, `border-radius:var(--r-2xl)`, `min-height:44px`, `border:1.5px solid`, `font-family:Nunito`.

**Chip modes** (via `data-chip` attribute):
- `data-chip="single"` — radio behavior: one active in group
- `data-chip="multi"` — toggle behavior: multiple active

**Minimum chip padding:** `var(--sp-6) var(--sp-12)` for standard chips. Compact badges may use `var(--sp-4) var(--sp-8)` minimum.

**Domain-colored chips:** Use the domain's light-bg + text-color tokens for active state.

---

## 6. QA Audit Checklist (per build)

> **Sync note:** This checklist should stay in sync with QA_PROCESS.md §4.

### Build-time audit gates (10 live as of 2026-05-29)

Every `pnpm build` runs these gates sequentially in `split/build.sh`; any failure aborts the build:

| # | Gate script | Purpose | Spec / PR |
|---|---|---|---|
| 1 | `audit-emoji.sh` | HR-1 — bans emoji in source + built artifact (Unicode range checks). | PR #74 |
| 2 | `audit-icon-text.sh` | V-K-10 — flags `(label\|text\|reason\|detail): zi(` field-assignments. | PR-A |
| 3 | `audit-resolve-shield.sh` | V-M-41 — locks `'Resolve'` btnText on 4 symptom-resolve `confirmAction` callers. | PR #78 |
| 4 | `audit-viz-smoke.sh` | PR-EF — verifies new visualization cards wire into the built HTML. | PR-EF |
| 5 | `audit-hr12-v3-3.sh` | v3-3 cipher-4 — blocks raw `new Date(` / `Date.now(` / `Date.parse(` in v3-3 engine surface unless `// HR-12-safe` annotated. | v3-3 IMPL |
| 6 | `audit-chip-taxonomy-v3-5.sh` | v3-5 — bans ad-hoc `tsf-event-{state}` class strings outside the canonical registry. | v3-5 IMPL |
| 7 | `audit-card-priority-v3-6.sh` | v3-6 — bans ad-hoc `card-{urgent\|notable\|ambient}` classes + verifies `renderInfo*` producer-coverage. | v3-6 IMPL |
| 8 | `audit-no-personalised-prediction-v1.sh` | milestone-engine-prep-v1 — Scope A bans hardcoded source attribution + `(unverified)` parenthetical; Scope B bans personalised-prediction prose. Python regex + 5 adversarial self-tests. | PR #153 |
| 9 | `audit-activity-categories-v1.sh` | milestones-tab-v1 — bans 3+-of-5 category-key array permutations + `\bcatOrder\s*=` idiom + 4+-of-5 obj-literal forks (with multi-line brace-tracking). Opt-in marker `// activity-categories-ok: <rationale>`. | PR #159 |
| 10 | `audit-feed-sheet-wiring-v1.sh` | food-sub-tab-v1 F-2 — required-presence gate. Asserts the 4 FOB Feed sheet wrap IDs (`qlFeedRepeat/Combos/Items/Next/Wrap`), the `_fdWriteStructuredMeal` writer call in `saveQLFeed`, 7 F-2 handlers, 7 core.js dispatcher routes, ≥30 `NUTRITION_QTY_DEFAULTS` entries, ≥10 `CURATED_COMBOS` with all 4 slots covered. Enforces ratification #5's hard tap-budget (3/4/6) by guarding the wiring that enables those budgets. | PR #168 |

### Hard Rule Checks
- [ ] HR-1: Zero emojis in new code
- [ ] HR-2: Zero `style="..."` in new HTML
- [ ] HR-3: Zero `onclick=`/`onchange=`/`oninput=` in new HTML
- [ ] HR-4: Zero raw px in new CSS (check allowed exceptions)
- [ ] HR-5: Zero `text-overflow: ellipsis`
- [ ] HR-6: All new surfaces use domain colors
- [ ] HR-7: New bg/color CSS uses tokens with dark variants
- [ ] HR-8: All interactive elements ≥ 36×36px
- [ ] HR-9: No multi-field editing in overlays
- [ ] HR-10: No inline formatting — all through named functions
- [ ] HR-11: No `white-space:nowrap` on variable-content chips
- [ ] HR-12: All user text through `escHtml()` in innerHTML

### Code Quality
- [ ] JS syntax valid
- [ ] CSS braces balanced
- [ ] Division-by-zero guarded
- [ ] `data-action` names follow `{module}{Verb}{Target}` pattern
- [ ] Dead code: 0 unused variables/functions
- [ ] New CSS classes use registered prefix from §4

### Overlay Checks
- [ ] Every overlay has intent classification (Read / Act / Flow)
- [ ] Close behavior matches intent
- [ ] ESC behavior matches outside-tap behavior
- [ ] Animation uses token, not raw duration
- [ ] DOM cleanup: overlay removed after animation timeout
- [ ] Body scroll: locked on open, restored on close

### Design Principle Scores
| Principle | Score |
|-----------|:-----:|
| 1. Emphasis / Dominance | /5 |
| 2. Unity / Rhythm | /5 |
| 3. Hierarchy | /5 |
| 4. Balance | /5 |
| 5. Proportion / Scale | /5 |
| 6. Contrast | /5 |
| 7. Similarity | /5 |

---

## 7. Token Reference

### Spacing (`--sp-*`)

| Token | Value | Note |
|-------|-------|------|
| `--sp-2` | 2px | Micro gap, badge padding |
| `--sp-4` | 4px | Tight internal gap |
| `--sp-6` | 6px | Compact chip vertical padding |
| `--sp-8` | 8px | Standard gap, chip horizontal |
| `--sp-10` | 10px | Chip padding, small margin |
| `--sp-12` | 12px | Card gap (paired), standard padding |
| `--sp-16` | 16px | Section zone gap, card padding |
| `--sp-20` | 20px | Large internal spacing |
| `--sp-24` | 24px | Hero section gap |
| `--sp-32` | 32px | Major section breaks |

### Font Size (`--fs-*`)

| Token | Default | Medium zoom | Large zoom | Use |
|-------|---------|-------------|------------|-----|
| `--fs-2xs` | 0.56rem | 0.644rem | 0.728rem | Tiny badges, micro labels |
| `--fs-xs` | 0.65rem | 0.748rem | 0.845rem | Meta text, timestamps |
| `--fs-sm` | 0.75rem | 0.863rem | 0.975rem | Section labels, chips, secondary |
| `--fs-base` | 0.85rem | 0.978rem | 1.105rem | Body text, daily card titles |
| `--fs-md` | 0.95rem | 1.093rem | 1.235rem | Card titles (base tier) |
| `--fs-lg` | 1.1rem | 1.265rem | 1.430rem | Action card titles |
| `--fs-xl` | 1.35rem | 1.553rem | 1.755rem | Hero card titles |
| `--fs-2xl` | 1.6rem | 1.840rem | 2.080rem | Score values, hero numbers |
| `--fs-3xl` | 2.0rem | 2.300rem | 2.600rem | Largest display values |

### Border Radius (`--r-*`)

| Token | Value | Use |
|-------|-------|-----|
| `--r-sm` | 4px | Subtle rounding, badges |
| `--r-md` | 8px | Icon containers, inputs |
| `--r-lg` | 12px | Daily cards |
| `--r-xl` | 14px | Daily card outer |
| `--r-2xl` | 20px | Cards, chips |
| `--r-full` | 9999px | Pills, avatar, circles |

### Icon Size (`--icon-*`)

| Token | Value | Use |
|-------|-------|-----|
| `--icon-xs` | 12px | Inline micro icons |
| `--icon-sm` | 14px | Daily card icons, compact |
| `--icon-base` | 16px | Standard icon size |
| `--icon-md` | 18px | Trend chip icons |
| `--icon-lg` | 22px | Hero card icons |

### Animation (`--ease-*`)

| Token | Value | Use |
|-------|-------|-----|
| `--ease-fast` | 0.15s ease | Micro-interactions, hover, chip toggle |
| `--ease-med` | 0.22s ease | Card transitions, tab switches |
| `--ease-slow` | 0.35s ease | Overlay open/close, page transitions |

### Line Height (`--lh-*`)

| Token | Value | Use |
|-------|-------|-----|
| `--lh-none` | 1 | Score values, single-line numbers |
| `--lh-tight` | 1.2 | Compact labels |
| `--lh-snug` | 1.3 | Card titles |
| `--lh-normal` | 1.4 | Meta text, section labels |
| `--lh-relaxed` | 1.5 | Body text, descriptions |

### Letter Spacing (`--ls-*`)

| Token | Value | Use |
|-------|-------|-----|
| `--ls-tight` | 0.02em | Compact labels |
| `--ls-normal` | 0.04em | Meta text, section labels |
| `--ls-wide` | 0.08em | Uppercase section headers |

### Domain Colors (light + dark)

| Domain | Light BG | Dark BG | Light Text | Dark Text |
|--------|----------|---------|------------|-----------|
| sage | #e8f5ef | #1e3028 | #3a7060 | #7ac0a0 |
| rose | #fde8ed | #3a2030 | #9e3e52 | #e090a8 |
| amber | #fef6e8 | #352e1e | #8a6520 | #d4a848 |
| lav | #f0ebfb | #2a2240 | #6e5e9a | #b8a8e0 |
| sky | #e8f4fa | #1e2838 | #336580 | #80b8d8 |
| indigo | #edf0fa | #252838 | #4a5080 | #a0b0e0 |
| peach | #fef3ea | #352820 | — | — |

### Surfaces

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `--bg` / `--body-bg` | `--cream` #fffaf7 | #1a1520 | Page background |
| `--surface` | `--white` #ffffff | #2a2230 | Card backgrounds |
| `--surface-alt` | `--warm` #fef6f0 | #221c28 | Alternate sections |
| `--glass` | rgba(255,255,255,0.5) | — | Translucent overlays |
| `--overlay-bg` | rgba(60,40,40,0.5) | rgba(10,5,15,0.7) | Modal scrims |

### Layout (fixed dimensions)

| Element | Value | Note |
|---------|-------|------|
| Tap target minimum | 36px | HR-8 floor |
| `.chip` min-height | 44px | Ideal tap target |
| Card padding (mobile) | 18px 16px | `.card` base |
| Card padding (desktop) | 22px 24px | `@media(min-width:500px)` |
| Max app width | 1100px | `.app` max-width |
| Accent border width | `--accent-w` 3px | Left-border on action cards |

---

## 8. Design Debt Log

**Source:** VISUAL_AUDIT.md (9 April 2026)

### Critical

| Item | Violation | Count | Fix |
|------|-----------|:-----:|-----|
| Missing spacing tokens | `--sp-2`, `--sp-6`, `--sp-10` used but undeclared | 171 refs | **FIXED 9 Apr 2026** — tokens added to :root |

### High — Chip wrapping

| Item | Violation | Count | Status |
|------|-----------|:-----:|--------|
| `.chip` generic — nowrap | HR-11 | 1 class | Open |
| `.qa-chip` — nowrap | HR-11 | 1 class | Open |
| `.outing-chip` — nowrap | HR-11 | 1 class | Open |
| `.dqp-pill` — nowrap | HR-11 | 1 class | Open |
| `.ql-freq-pill` — nowrap | HR-11 | 1 class | Open |
| `.ql-meal-pills` container — no flex-wrap | HR-11 | 1 class | Open |
| `.qa-chips` container — no flex-wrap | HR-11 | 1 class | Open |
| `.al-slot-chips` container — no flex-wrap | HR-11 | 1 class | Open |
| Duplicate `.sp-gap-chip` definition | Dead code | 2 defs | Open — delete L2529–2535 |

### Medium — Raw px

| Category | Raw px count | Token count | Adoption % | Priority |
|----------|:----------:|:-----------:|:----------:|----------|
| padding | 259 | 237 | 47% | Highest — fix when touching a file |
| gap | 29 | ~80 | 73% | Medium |
| font-size | 16 | ~200 | 93% | Low — mostly edge cases |
| margin | 12 | ~50 | 80% | Low |
| border-radius | 9 | ~100 | 92% | Low |

### Medium — Raw colors

| Type | Count | Priority |
|------|:-----:|----------|
| Raw `rgba()` not in token defs | ~523 lines | Ongoing — many are dark mode overrides |
| Raw `#hex` not in token defs | ~112 lines | Ongoing — convert when touching a file |

### Low — Cramped chip padding (raw px, < 6px vertical)

| Class | Current | Target | Status |
|-------|---------|--------|--------|
| `.trend-chip-delta` | `2px 8px` | `var(--sp-4) var(--sp-8)` | Open |
| `.info-food-chip` | `3px 10px` | `var(--sp-4) var(--sp-10)` | Open |
| `.sp-gap-chip` | `4px 12px` | `var(--sp-4) var(--sp-12)` | Open |
| `.sg-chip` | `3px 10px` | `var(--sp-4) var(--sp-10)` | Open |
| `.fe-action-chip` | `4px 10px` | `var(--sp-4) var(--sp-10)` | Open |
| `.sc-quick-chip` | `5px 12px` | `var(--sp-6) var(--sp-12)` | Open |
| `.fe-symptom-chip` | `6px 12px` | `var(--sp-6) var(--sp-12)` | Open |
| `.trend-chip` | `12px 14px` | `var(--sp-12) var(--sp-16)` | Open |
| `.trend-chip-detail` | `10px 14px 14px` | `var(--sp-10) var(--sp-16) var(--sp-16)` | Open |

### Low — Font family token not yet defined

`--ff-display` and `--ff-base` tokens are not in `:root`. Code currently uses raw `'Fraunces', serif` and `'Nunito', sans-serif`. Define tokens when a CSS refactor touches the font declarations.

---

## 9. Recipes — Generative Food System (incoming patterns)

> Patterns established in the **Diet → Recipes design exploration** (2026-06-03, `docs/design/recipes-tab/`).
> **Forward-looking** — these describe how the recipes feature should be built when wired into `split/`.
> The exploration is generator-backed (deterministic, data-driven); the wiring runs the canon-cc-008 Governor gate.

### 9.1 `zi_food` — the food-icon system (`zif-*` symbols)
A dedicated **full-colour** ingredient icon set (system name `zi_food`, symbol namespace `zif-*`), separate from the monochrome `zi()` system.
- **Namespace `zif-*`**, 97 symbols covering 100% of the data.js food corpus (grains, legumes, vegetables, fruits, dairy & eggs, nuts & seeds, proteins, fats & sweeteners, spices & herbs).
- **Real food colours, not domain colours.** The edible flesh uses `fill="currentColor"` so the *consumer* sets the hue — **one symbol drives every variant** (bell pepper red/yellow/green, carrot orange/purple, toor/moong/masoor/urad dal). Natural accents (green tops, brown pit/stem, egg yolk, husk) are **baked in** at fixed colours.
- **Style:** flat fill + a warm rgba outline (`rgba(74,48,22,.22)`) so whites/creams read on light surfaces. 24×24 viewBox, like `zi()`.
- **Deliberate departure from `zi()`:** `zif-*` is multi-fill colour; it is NOT a drop-in `zi()` call and does not satisfy HR-1's "icons via zi()" by itself — it is a sibling system for ingredient representation. Wire as its own sprite block.

### 9.2 Ingredient pills use the whisper fade (never flat)
Food/ingredient chips carry the **food-domain whisper fade** (`dt-*`), not a flat tint or a naked card:
`background: linear-gradient(135deg, transparent 40%, rgba(<accent>,.22))` over the card base + a domain-tinted border; dark theme swaps to `transparent 30%` + the deep `--tc-*` hue. This is the decided language (ported from the library rework) — reaffirms **HR-6 (domain colour on every surface)**.

### 9.3 Generative recipe fingerprint (quantity-weighted)
A recipe's hero renders a deterministic fingerprint from its ingredients:
- **STRIPE** (top ribbon) + **FADE** (body wash) are the recipe's primary-ingredient **domains, wavelength-ordered** (rose → peach → amber → sage → sky → indigo → lav ≈ red→violet).
- **Band-widths are weighted by ingredient quantity (grams)** — a 60% rice / 25% carrot / 15% paneer khichdi reads sage-dominant. Trace ingredients (ghee/salt/spices) are excluded so the fingerprint never muds; cap ≤ ~4 domains.
- Domain → colour: fruit→rose, veg→peach, legume→amber, grain→sage, dairy→sky, nuts→lavender. Fade uses `--*-light` (light) / deep `rgba` hue (dark).

### 9.4 Warm-wave stripe (motion)
The stripe is **narrow (~4px)**, uses **soft mid-tone** hues (between the pale `--*` and the harsh `--tc-*` — de-neoned), and **animates**: a translucent sheen sweeps left→right (~4.4s ease loop) over the static weighted gradient — the colour band-widths stay fixed (they encode quantity); only the highlight moves. Respect `prefers-reduced-motion` at wiring time.

### 9.5 Tagline system (three layers)
1. **Curated recipe taglines** — 2–3 per named recipe, rotated by a **day-seed** (fresh daily, deterministic within a day).
2. **Per-ingredient bank** — 2–3 taglines per ingredient for single-food logs (61 ingredients).
3. **Composer** (`taglines.mjs`) — for any uncurated combo: each ingredient contributes an **epithet + noun**; the **minor-share ratio picks the connector** so volume shows in the words (`<12%` "just a hint" · `~20%` "a touch" · `~30%` "a little" · `~40%` "balanced with" · `~50/50` "meets"); epithets rotate by day-seed.

### 9.6 Typography — recipe "voice" line (direction C)
Recipe titles: **roman Fraunces** (700) + a **Fraunces *italic*** descriptor line beneath (the warm "voice"). Italic is reserved for the descriptor — not eyebrows/sections. Titles: `max-width` guard + `text-wrap: balance` (the early wrap is a width guard, not a design break). Fraunces roman = structure; Fraunces italic = voice; Nunito = functional text.

### 9.7 Infant-food safety rules (content floor — Care/Maren jurisdiction)
Cross-verified against WHO 2023 / WHO-PAHO / IAP / ICMR-NIN 2024 / NHS / FAO am866e / AAP / CDC (see `docs/design/recipes-tab/RECIPE_RESEARCH.md`). **Any recipe/tagline/food surface must honour these:**
- **Honey** — none < 12 months (infant botulism). Hard no.
- **No added salt; no added sugar/jaggery; no fruit juice** < 12 months — **fruit sweetens** (adopted the stricter WHO/NHS line over IAP's sugar allowance).
- **Allergens** (egg, peanut, tree nuts, dairy, sesame, fish) — introduce early (~6m), one at a time.
- **Choking/prep** — nuts/seeds ground (never whole), grapes halved, hard veg/fruit cooked soft, egg fully cooked, fish deboned, chia soaked, raisins softened.
- **Cow's milk** — in cooking from 6m; not a main drink until 12m.
- **In taglines:** soft prep-cautions **fold into the phrase** ("ground almond", "halved grape"); **strict no's lead** as a prominent clause ("honey — only from age 1"). Safety **always shows first.**

---

## 10. Library — Living Shelf, Food Detail & Nutrient Colours (incoming patterns)

The Diet→Library "living shelf" rework (`docs/design/library-redesign/`, wiring under food-effects-v2). Forward-looking; canonical CSS lands in `styles.css` as it wires.

**10.1 The living shelf.** The Browse-foods wing groups every `FOOD_EFFECTS` record by `_effPolarity` (core.js) into four **collapsible polarity shelves** — encourage→sage / conditional→amber / warn→rose / inform→sky — each a "living book" (`.lib-book`): polarity **rail** (the safety channel) + name + EP voice + safe-form glance + allergen siren + the **journey channel**. Shelves closed by default; untried books float to the top of their shelf. A "**Suggested for Ziva**" lead card (untried priority allergens) is the entry point the eye lands on (the 6-second test); the foods-log collapses to a drawer — the shelves are the browse.

**10.2 The journey channel (`.lib-journey`).** A *second*, Receded-register channel beside the safety rail/siren — never on it (polarity-collision rule). The book's lived state, real-data-only: `_fdIsFoodTried` + `foods[].reaction` (`ok`/`watch`) + `isFoodFavorite`. Four states: **invitation** (untried) → **settled** (`ok`, sage check) → **watching** (`watch`, amber eye, hands off to Info) → **established** (favourite + `ok` + introduced ≥ 21 days, star "a regular"). Warn-shelf books carry **no** journey chip — the app never celebrates a feed it told a parent to hold.

**10.3 The food info pop-up (`.food-pop`).** Tapping a food NAME opens a **Read overlay** (HR-9 — view, not multi-field edit; × + tap-outside): domain-whisper header + name + EP voice + journey chip, then the **safety-first** body (polarity flag → age gate → the never-cross floor via `_libBuildGuide`), safe-form chips, nutrient chips (§10.4), Ziva's history, and a single Quick-Act footer — "Log a serving" → `openQuickModal('feed')` + `qlFeedAddItem`, via a **delegated** `data-action` (the pop-up renders dynamically, so init-bound `data-quick-modal` would miss it). Supersedes `renderFoodDetailSheet`. Record: `09-food-info-popup.html`.

**10.4 Nutrient colour system (`.nutri-chip`).** Nutrients must not read as one blob — each maps to one of **six nutrient-domains**, a palette colour rendered as a **tint-fade chip** (the whisper-fade language, on a chip): `growth`(sage) · `blood & iron`(rose) · `bones`(sky) · `brain`(lavender) · `immunity`(amber) · `energy & gut`(indigo). Peach is excluded (it is the food-domain *vegetables* colour, not a nutrient group); indigo carries the 6th. The `NUTRI_DOMAIN` taxonomy (nutrient → domain) ships in `data.js`/`core.js`. Reference: `nutrient-colours.html`.

**10.5 Food-domain chips (`.fdom-chip`).** Food chips (priority-allergen lists, form-transforms, search results) are **tint-fade coloured by their `FOOD_TAX` domain** — grains→sage · fruits & nonveg→rose · vegs→peach (`--tc-peach`, §Tint) · dairy→sky · nuts→lavender · spices→amber. Same tint-fade language as `.nutri-chip` and the `.dt-*` whisper — the chip variant of the food-domain colour.

**Tint-fade-on-chips (the extension).** The §Tint System historically kept chips to the **flat Receded fill**; §10.4–10.5 extend the **whisper-fade** (transparent → domain accent) onto *small* chips for **colour-coded taxonomies** (nutrients, food domains). Flat Receded stays the default chip fill; tint-fade is reserved for these meaning-bearing colour systems.

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 9 Apr 2026 | Initial version. Forked from DESIGN_SYSTEM_TEMPLATE.md v1.0. Filled from styles.css audit (7,772 lines), template.html SVG sprite (54 icons), VISUAL_AUDIT.md. |
| 1.1 | 3 Jun 2026 | Added §9 — Recipes Generative Food System (incoming patterns): `zi_food` full-colour icon system (`zif-*` symbols), whisper-fade ingredient pills, quantity-weighted generative fingerprint, warm-wave stripe, 3-layer tagline system, typography "voice" line (direction C), and the infant-food safety content floor. From the Diet→Recipes design exploration (`docs/design/recipes-tab/`). |
| 1.2 | 3 Jun 2026 | **Backfill** — Food-domain whisper-fade (`.dt-*`) ratified into the §Tint System (the food/recipe-card fade: transparent→accent over cream, hue-swap dark, polarity-collision companion channel). Added at the Library-rework / Recipes ratification without a changelog row at the time. |
| 1.3 | 3 Jun 2026 | **Backfill** — §Swipe & Gesture Navigation: codifies the code-only `handleSwipe` rules (\|Δx\|≥60 + \|Δy\|≤0.7\|Δx\|; input/scrollable/overlay guards; clamp-never-wrap; innermost-wins cascade; order arrays; right-edge back-gesture; the `DIET_SUB_ORDER`/`DIET_INNER_ORDER` duplicated-literal drift hazard). Added without a changelog row at the time. |
| 1.4 | 3 Jun 2026 | §10 — Library Living Shelf, Food Detail & Nutrient Colours: the living shelf + journey channel, the food info pop-up (Read overlay), the **nutrient colour system** (`.nutri-chip`, 6 nutrient-domains) and **food-domain chips** (`.fdom-chip`), the tint-fade-on-chips extension, and **`--tc-peach` defined** (retiring its long-standing dangling reference). From `docs/design/library-redesign/`. |

---

*This document is the canonical reference for SproutLab's visual design system. Every build session reads it before writing code. Update scores and debt log after every build.*
*Forked from DESIGN_SYSTEM_TEMPLATE.md v1.0.*
