# SproutLab Phase 4 sub-phase 1 Charter — Polish (UI/UX consistency)

**Branch:** `claude/sl-4-polish-charter` (charter PR; subsequent PRs cut derivative branches per R-2)
**Builder:** Lyra · **Governors (committee-delegate, scout-deep):** Maren (Care) + Kael (Intelligence) · **QA:** Cipher (advisory, relay-only) · **Constitutional sanity:** Consul · **Merge gate:** Aurelius + Sovereign (R-14)
**Repo state:** `main` @ `1bc64d3` (PR-22 merge, "Phase 4 zero gate")
**Phase 4 arc:** Hardening + Foundation, six sub-phases (Polish [NOW] → Stability → Tally → Reward → Launcher → Spark)
**Operating mode:** subscription-only / no-poll-on-wake (Aurelius Ruling 4 on PR-22, RATIFIED Phase 4)
**Scope discipline:** Edict VIII — charter ships before code. R-3 atomic-canon. R-9 split-threshold. R-10 hygiene queue. architectural-surfacing-must-enumerate-axis-of-resolution (RATIFIED PR-19.6, 3/3) binds throughout.

---

## 1. Briefing as written (Sovereign, Phase 4 opening)

> *Phase 4 sub-phase 1: Polish — UI/UX consistency audit + fix (design tokens, spacing, typography, iconography, mode-contract consistency across all tabs, responsive breakpoints).*

Six axes named. Sovereign-amplified directive at scout-deep stage: *"be aggressive and always invoke governors wherever their territory is affected."*

**Aurelius handoff (PR-22 final review):** *"Polish sub-phase charter next at your cadence; activities-tab fix decomposition (3 PRs across Stability + Polish) is scoped on the Aurelius side and will fold in at charter time."* Polish reserves 1–2 fold-in slots for Aurelius's decomposition (see §4).

---

## 2. Scout findings — empirical Polish-axis probe

Per running-beats-reading (RATIFIED bidirectional, 3 instances). Lyra-grep baseline + Maren (Care) + Kael (Intelligence) committee-delegate scouts compounded. Both Governors return findings into this synthesis; Lyra authors the dispositions.

### Finding A — Inline-style HR-2 surface is large but tractably triaged (537 hits, 60/22/19 split)

`grep -rcE 'style\s*=\s*["\']' split/*.js` returns 537 inline-style attribute hits across the JS modules:

| File | Hits | Jurisdiction |
|---|---|---|
| `medical.js` | 176 | Maren |
| `home.js` | 160 | Maren |
| `intelligence.js` | 147 | Kael |
| `diet.js` | 34 | Maren |
| `core.js` | 20 | Kael |
| **Combined** | **537** | — |

Governor scouts categorized each jurisdiction's hits into three triage classes. Combined cross-jurisdiction approximation:

| Class | Count | Polish disposition |
|---|---|---|
| **Token-replaceable** | ~321 (60%) | Migrate to existing `var(--*)` system via class extraction |
| **Class-replaceable repeats** (≥3× pattern) | ~116 (22%) | Extract named class once; sweep the call sites |
| **Dynamic-required** | ~100 (19%) | CSS-custom-property pivot (`style="--bar-pct: ${pct}%"` + class-side `width: var(--bar-pct)`); preserves data-driven values without inline-style escape |

**Headline class-extraction candidates (cross-jurisdiction repeats):**
- `.section-caption` / `.empty-state-caption` cousin pattern — 30+ instances across `home.js` + `diet.js` (Maren) + 4 sites in `core.js` (Kael). Single class definition unifies the family.
- `.guidance-do` / `.guidance-dont` — `medical.js:3094-3103` Do/Don't bullet pattern (Maren).
- `.doctor-cta-call` / `.doctor-cta-map` — `medical.js:2364-2365` (Maren); 13-property identical inline blocks.
- `.kc-row-flex-wrap` — `intelligence.js:7885, 7905, 7911, 11797, 11826, 14969` (Kael); 6 sites.
- `.nh-legend-swatch` — `intelligence.js:14971-14974` (Kael); 4 sites in 4 lines.

**Inversion finding (Kael):** ISL (lines 1–1022), UIB (1202–2422), and Smart Q&A (2423–6525) — the conversational/temporal core — carry **0 inline-style hits**. The 147 in intelligence.js are all in adjacent UI subsystems (Sleep Intelligence cards 32, Meal Balance 25, Home modals 27, illness-episode trackers 44, tail diet 19). Kael's framing: *"data-visualization hygiene wearing a Polish jersey."* Charter scope reflects this — Polish is concentrated on analytics renderers + Care card-rendering paths, not the conversational core.

### Finding B — Mode-contract drift across Care + core (TWO distinct mechanisms, both load-bearing)

The `simple-mode` body class via `isSimpleMode()` (defined `core.js:3703`) is the canonical UX-mode contract. Governor scouts surfaced two distinct drift surfaces:

**B.1 — `medical.js` has ZERO `isSimpleMode()` calls** (Maren). Yet medical.js renders Insights-tier surfaces that diet.js gates uniformly on simple-mode:
- Symptom-pattern correlation card (`medical.js:3369-3402` — *"Correlations appear after the same food is eaten 3+ times…"*)
- Food-poop delay analytics (`medical.js:5710+` — `computeFoodPoopDelay` consumers, `renderInfoPoopFoodDelay`)
- Alert-pattern card (`renderAlertPatterns`)

Diet.js gates trends-modifier visibility uniformly across 5 domain blocks (`diet.js:2883, 2906, 2933, 2956, 2981`). Home.js gates vitals card whole-render and watch-tier alerts (`home.js:408, 7616`). Medical.js renders the same Insights tier in BOTH simple and full modes. **This is the single material cross-tab mode-contract gap in Care.**

**B.2 — core.js carries 3 parallel shadow-state contracts** (Kael). The mechanism integrity at the canonical site has structural drift potential:
- `localStorage['ziva_simple_mode']` shadow-state with 3 asymmetric write paths (`core.js:3711, 3721, 3741`); `body.classList.contains('simple-mode')` is the runtime read; default-on logic at `:3737-3744` interprets `null → ON` via `saved !== 'false'`. Stuck-state coverage gap if anything writes `'true'` to storage without class assertion.
- `data-zoom` on `<html>` (`core.js:3755`) — same shape, separate localStorage `ziva_zoom_level` (`:3757`).
- `data-theme` on `<html>` (`core.js:3777`) — same shape, dark-mode mechanism.

**Three parallel shadow-state contracts.** Kael's recommendation: introduce a single `applyDisplayPreferences()` reconciler called once on init that re-asserts class/attribute from storage as a single canonical pass. **But this is feature-grade R-8 territory, NOT Polish hygiene** — it changes new-user defaults if mishandled and needs SPEC_ITERATION_PROCESS authorship. Polish dispositions for B.2 are limited to documenting the surface; the reconciler itself defers to Stability sub-phase or a dedicated R-8 charter.

### Finding C — Hex leakage in styles.css attributes 30/70 split (token-dup vs ad-hoc tonal)

`grep -cE "#[0-9a-fA-F]{3,8}\b" split/styles.css` returns **291 hex hits**. Maren's Care-domain sampling decomposes:

| Attribution | Count est. | Polish disposition |
|---|---|---|
| **Direct-token-duplication** (literal hex matches an existing `--*` token) | ~30% (~87 hits) | Pure substitution sweep: `#b5d5c5` → `var(--sage)`, `#f2a8b8` → `var(--rose)`, etc. Trivial, low-risk. |
| **Ad-hoc tonal variations** (hex doesn't match any existing token) | ~70% (~204 hits) | Two distinct sub-patterns: severity gradients (sage-deep / amber-deep / mid-tones at `styles.css:1287-1326`) and undeclared "warning yellow" `#ffc107` / `#ffd166` (8+ sites). Plus growth-gauge semantic anchors `#c06078` / `#4686a0` defined as JS consts at `medical.js:1452-1453`. **Requires design-token-system spec amendment** (new tokens: `--sage-deep`, `--amber-deep`, `--accent-warn`, `--gauge-wt`, `--gauge-ht`) before any substitution can land. |

**HR-2 escape (Maren):** `medical.js:3208` carries `border-left:var(--accent-w) solid #ffc107` — a literal hex inside an inline-style attribute. Single-line trivial fix; folds into the new-token sweep cleanly (`#ffc107` becomes `var(--accent-warn)`).

### Finding D — zi() iconography is HR-1-compliant; sprite has spec drift + dead-weight

**Sprite has grown 54 → 62 symbols** in `template.html` since CLAUDE.md was authored (Kael). Spec drift, not bug — Chronicler routing required for CLAUDE.md amendment.

**Zero broken references** — every `zi('name')` call site across all JS modules + template.html resolves to a sprite symbol. zi() compliance is structurally clean across **~1,569 call sites**.

**11 unreferenced sprite symbols** (Kael) — sprite carrying dead weight: `alert-circle, balloon, bump, chef, crystal, fall, goal, halfcircle, lotus, sleep, trending-up`. **Polish disposition: defer prune.** `goal` and `trending-up` smell load-bearing for Tally sub-phase (gamification points / streaks); `crystal` smells Spark-adjacent. Pruning before downstream sub-phases declare needs would be premature.

**HR-1 escapes — initial cross-Governor catch + Cipher r1 deeper-audit reframe (PR-23 r2):**

The original cross-Governor catch surfaced two named sites:
- `medical.js:2268` — 🚨 in the *"When to seek emergency care"* callout (Maren-flagged).
- `home.js:1595` — 🩺 in `ms-tidbit-icon` div (Kael-flagged from his sprite-audit grep, cross-handed to Maren). *(r2 line-number correction: r1 cited `:11828` which doesn't exist — home.js is 9186 lines; transcription error in scout→charter relay caught by Cipher PR-23 r1 Catch 2.)*

**Cipher PR-23 r1 Catch 3 deeper audit** (Unicode narrow-emoji ranges U+1F300-1F9FF + U+1FA00-1FAFF; excludes dingbats like ✓ ⚠ ★) revealed **≥18 emoji-bearing rendered-UI sites** across home.js + medical.js — the original "two emoji literals" framing was a material undercount:

| File | Sites | Categories |
|---|---|---|
| `home.js` | ≥11 | weather-code emoji map (`:253-257`, 5 sites: 🌫️ 🌦️ 🌧️ ❄️ ⛈️); precautions strings (`:299, :307, :309, :315, :319, :323`, 6 sites); weather advisory template (`:336, :339`, 2 sites); food icon props (`:1115, :1190`, 2 sites); ms-tidbit-icon (`:1595`, 1 site — named cross-Governor-catch site) |
| `medical.js` | ≥7 | emergency callout (`:2268` — named cross-Governor-catch site); doctor avatar (`:2355`); doctor modal titles (`:2385, :2401`); activity icon props (`:3914, :3930`); symptoms-render text (`:6521`) |

**Polish disposition split (route (a) per Cipher r1 recommendation):**
- The two named cross-Governor-catch sites (`medical.js:2268` + `home.js:1595`) close in **Polish-2** as cited (single-line `zi('siren')` / `zi('stethoscope')` swaps; safety-tier surface, must preserve visual prominence).
- The broader **~16 remaining HR-1 sites** route to **Phase 4 R-10 hygiene-queue carry-forward** (see §6) and defer to Stability sub-phase or a dedicated R-8 charter. Fix-shape varies materially: simple `zi()` swap for some (doctor modal text), structural refactor for others (weather-code emoji map is a data-structure of code→emoji pairs that needs different shape — likely code→sprite-name with `zi()` resolution at render time). Different fix-shapes belong in different PRs per R-3 atomic-canon.

### Finding E — Responsive breakpoints fragmented globally; Care-domain coherent

`grep -cE "@media" split/styles.css` returns **24 media queries** total (Cipher-bench verified at `1bc64d3`; Lyra r1 cited 25, off-by-one D8 catch corrected at r2). Decomposition:

- **Care-domain layout queries** (Maren): 11 queries gating `.food-cats`, `.ms-cats`, `.activity-cats`, `.upcoming-cats`, `.tip-cats`, `.milestone-actions`. **Discipline assessment: COHERENT.** All five "cat" grid-collapse pairs use identical 700/400 breakpoints. No fragmentation. **No Polish work needed in Care-domain breakpoints.**
- **Global / Intelligence-domain queries** (Kael deferred to global): 13 queries scattered at 360px, 400px, 480px, 500px, 700px + print at `:208, :2072, :3842, :3847, :3863, :4622, :4625, :4658, :4809, :5066, :5109, :5226, :8746`. Mixed values, no tokenized breakpoint variables. **Fragmentation surface.**

**Polish disposition:** introduce `--bp-xs: 360px`, `--bp-sm: 400px`, `--bp-md: 500px`, `--bp-lg: 700px` token set (CSS custom properties don't work directly in `@media` queries — see `media-query-with-CSS-custom-properties` constraint; use Sass-style numeric constants in comments + inline values, or wait for `@custom-media` browser support). **Practical resolution:** add a header comment block at the top of styles.css enumerating the canonical breakpoint values + which selectors use which, and migrate the scattered `@media` declarations to use the canonical 4 values uniformly. Drops effective fragmentation without overcommitting on a token-mechanism that browsers don't yet support natively.

### Finding F — Cross-axis polish surfaces (HR-3 violation + activities-tab fold-in slot)

**F.1 — HR-3 violation (Maren):** `home.js:1391` carries `onclick="const el=document.getElementById('${infoId}');el.style.display=el.style.display==='none'?'block':'none';"` on the vaccination history expand path. **Active HR-3 violation.** Convert to `data-action="toggleVaccInfo"` with delegated handler. Single-site fix; folds into Polish since it's a visible-UX surface adjacent to Polish's vaccination card touchups.

**F.2 — Typography axis (low-priority):** Fraunces + Nunito holding per CLAUDE.md design system. ~20+ repeated `font-family:'Fraunces', serif` / `font-family:'Nunito', sans-serif` literal declarations in styles.css are token-eligible (`--font-display: 'Fraunces', serif` / `--font-body: 'Nunito', sans-serif`). Pure verbosity reduction, no functional change. **Disposition:** include in the design-token sweep PR (Finding C resolution); not its own PR.

**F.3 — Activities-tab fold-in slot (Aurelius PR-22 handoff):** Aurelius declared at PR-22 close that *"activities-tab fix decomposition (3 PRs across Stability + Polish) is scoped on the Aurelius side and will fold in at charter time."* This charter **reserves 1–2 slots** in the §4 Polish PR sequence for Aurelius's decomposition. Charter does not pre-author the activities-tab dispositions; Aurelius's decomposition lands at charter ratification time and the fold-in slots get specific PR numbers + scope at that point.

---

## 3. Charter divergence (R-8 option framing)

Per R-8 / Edict V, surface in-flight options when the briefing's literal description rests on premises the scout disproves or under-specifies. The 6-axis briefing under-specifies on three structural questions: (a) the existing token system already covers ~40 properties — is "design tokens" axis a sweep against the existing system or a new-token-ratification effort? (b) the `simple-mode` mechanism has 3 parallel shadow-state contracts — is "mode-contract consistency" within the simple-mode mechanism, or across all three? (c) ~100 dynamic-required inline styles can't be class-replaced at all — is "spacing/typography polish" sweeping the inline surface or honoring the carve-out? Three R-8 options shape these axes differently.

### Option A — Execute literally (sweep all 6 axes end-to-end in one PR)

Single PR closing all axes: tokenize all 291 hex hits + audit all 537 inline-style sites + tokenize all 14 breakpoints + reconcile 3 shadow-state contracts + sprite prune + emoji removal + HR-3 fix + class extractions.

- **LOC envelope:** ~1,500–2,500 source LOC across all 11 modules.
- **R-9 single-PR threshold:** breached by 5–10×.
- **Blast radius:** every Care + Intelligence card-rendering surface touched simultaneously; one bad token swap regresses safety-tier UI (CareTicket banner, growth-gauge, vaccination urgency); test-suite re-floor would explode.
- **Risk catalog (Governor scouts):** Maren and Kael BOTH flagged 4+ safety-tier carve-outs each that need explicit R-8 charter before mass touchup. Option A subsumes these without explicit treatment.

**Verdict:** delivers the literal axis list but at irresponsible blast radius. Not recommended.

### Option B — Refit briefing intent to province reality, atomic-canon split (RECOMMENDED)

**Intent:** *"every UI-visible inconsistency closed against an explicit token + class system, every safety-tier semantic-color contract preserved verbatim, every sub-axis ships under R-9 single-PR threshold."*

Split into **8 atomic-canon PRs + 1–2 Aurelius activities-tab fold-in slots = ~9–10 PRs total**. Each PR tackles one axis or one cohesive class-extraction family; each sits under R-9 LOC threshold; each ships its own R-7 triad (or duo where the contract is binary per PR-18 precedent). Sequencing in §4.

Locked exclusions (defer to feature-grade R-8 charter, NOT Polish):
- CareTicket banner state-color migration (Maren — 6-state machine needs tabulation).
- Growth-gauge ring percentile-tint rebind (Maren — boundary contracts need preservation tests).
- Vaccination urgency Fraunces countdown contract (Maren — semantic safety-tier).
- Sleep Intelligence renderInfoSleepBestNight / renderInfoSleepRegression dynamic-color SVG math (Kael — CSS-custom-property pivot OK; plain class would break data-driven coloring).
- Illness-episode-tracker severity colors (Kael — emergency-tier; cross-Governor token-redefinition cascade).
- Smart-QA 22 intent-handler class-name contract (Kael — class names are the contract; renaming requires ISL regression sweep).
- Display-preferences reconciler (Kael — three shadow-state contracts; SPEC_ITERATION_PROCESS authorship required; defer to Stability sub-phase or dedicated R-8).
- Sprite prune of 11 unreferenced symbols (Kael — Tally/Spark/Reward may need them).
- Sync-banner halted-state CSS (Kael — post-PR-19.5 stable, do not touch without charter).

**Verdict:** delivers the briefing intent under R-3 atomic-canon + R-9 LOC discipline. Each axis shipped against explicit Governor-evidence baseline. Safety-tier carve-outs preserved on-record. Recommended.

### Option C — Minimum-honest fallback (ship only the trivial fixes)

Single PR closing only the unambiguously-safe items: HR-2 escape at `medical.js:3208`, HR-3 violation at `home.js:1391`, 2 HR-1 emoji escapes (`medical.js:2268` + `home.js:1595`), and the ~17 direct-token-duplicate hex swaps that have zero ambiguity (e.g. `#b5d5c5` → `var(--sage)` exact match).

- **LOC envelope:** ~50–100 source LOC; well under R-9.
- **Coverage:** Closes 4 governance-rule violations (1 HR-2, 1 HR-3, 2 HR-1) + ~6% of hex leakage. Leaves the rest of Polish for Stability or Phase 5.
- **Risk:** zero — every change is a direct mechanical substitution against an exact-match token or canonical replacement.

**Verdict:** ships truthfully under bad-time-budget conditions. Acceptable as Hour-N fallback if Option B's PR sequence overshoots; would close the 4 active rule violations without committing to the structural sweeps.

### Recommendation

**Option B**, sequenced atomically across 8 + 1–2 fold-in PRs over the Polish sub-phase budget. Hour-budget fallback to Option C if Polish-1 (mode-contract parity) doesn't ack within projected window.

→ **Aurelius / Sovereign:** ratify A / B / C before any feature PR cuts.
→ **Consul:** constitutional sanity check on charter scope (cross-province implication: Polish's design-token amendments touch the shared design system used by all sub-phases; Spark sub-phase's feature-flag mechanism inherits any new-token discipline established here).

---

## 4. Locked scope (Option B; sequence reshapes if A or C)

Eight atomic-canon Polish PRs + 1–2 Aurelius activities-tab fold-in slots. Each PR cuts a fresh `claude/sl-4-polish-N-<token>` branch off updated main per R-2.

### Polish-charter (this) — Charter PR

`docs/SPROUTLAB_PHASE_4_POLISH_CHARTER.md` only. Pure docs (Edict VIII). No build, no manifest bump (charter PR; bump-version.mjs is excluded from this commit). LOC: ~350.

### Polish-1 — `medical.js` mode-contract parity (Care-tab Insights gating)

**Files:** `split/medical.js`. Gate `renderInfoPoopFoodDelay` consumers + `renderAlertPatterns` + symptom-pattern correlation card on `isSimpleMode()` to match `diet.js`'s discipline. ~5–15 LOC source. Single jurisdiction (Maren).

**Tests:** R-7 triad — positive (full mode renders Insights), regression-guard (simple-mode hides Insights), positive-regression (mode toggle preserves card-shape on switch back). +30–50 test LOC.

### Polish-2 — HR-1 / HR-2 / HR-3 governance-rule cleanup (4 sites)

**Files:** `split/medical.js` (HR-2 hex-in-inline-style at `:3208`; HR-1 emoji at `:2268`), `split/home.js` (HR-1 emoji at `:1595`; HR-3 inline `onclick` at `:1391`). ~10–20 LOC source. Cross-jurisdiction (Maren).

**Scope discipline (route (a) per Cipher PR-23 r1 Catch 3):** Polish-2 closes the **named cross-Governor-catch sites only** — the explicit 4 violations enumerated above. The broader ~16-site HR-1 audit (Cipher r1 deeper-grep finding: weather-code emoji map, precautions strings, food icon props, doctor avatar/modal text, activity icon props, symptoms-render text) routes to **Phase 4 R-10 hygiene-queue carry-forward** (see §6) since the fix-shape varies materially across those sites and demands different PR atomicity per R-3.

**Tests:** R-7 binary-mode duos (per PR-18 precedent — bug-IS-the-absent-state shape) where appropriate; positive renders (rule compliant) + regression-guard (rule never re-violates). +20–40 test LOC.

### Polish-3 — Direct-token-duplication hex sweep (~87 sites, pure substitution)

**Files:** `split/styles.css` (primary). Replace ~87 hex literals matching the existing `--sage / --rose / --amber / --lavender / --sky / --indigo / --peach` token values with `var(--*)` references. Zero new tokens, zero ad-hoc tonal variations. ~100–150 LOC source (mostly substitutions). Shared module (dual-review Maren + Kael).

**Tests:** R-7 triad — positive (computed-style snapshot test asserts visual fidelity post-substitution); regression-guard (Care-domain card backgrounds match pre-Polish-3 RGB); positive-regression (token system itself unchanged — `getComputedStyle(root).getPropertyValue('--sage')` returns `#b5d5c5`). +50 test LOC.

### Polish-4 — Design-token-system spec amendment + ad-hoc-tonal-variation sweep

**Files:** `docs/DESIGN_PRINCIPLES.md` (token system amendment), `split/styles.css`, `split/medical.js`, `split/home.js`. New tokens: `--sage-deep`, `--sage-mid`, `--amber-deep`, `--amber-mid`, `--accent-warn`, `--accent-warn-light`, `--gauge-wt`, `--gauge-ht`, `--font-display`, `--font-body`. Sweep ~204 ad-hoc tonal hex variants. ~150–250 LOC source. Shared module + Care jurisdiction.

**Tests:** R-7 triad parameterized over the new tokens — positive (token defined + reachable), regression-guard (no orphan hex left in Care-domain selectors), positive-regression (token semantic anchors preserved — `--gauge-wt` resolves to the prior `#c06078` byte-for-byte at first-cut). +60–80 test LOC.

**Spec discipline:** DESIGN_PRINCIPLES.md amendment ships in this PR's diff so the doctrine is on-record before substitution lands (parallels PR-19.5's strip-allowlist + flush-stamper architectural commit).

### Polish-5 — Cross-jurisdiction class-extraction sweep (.section-caption family)

**Files:** `split/styles.css` (new class definitions), `split/home.js`, `split/diet.js`, `split/medical.js`, `split/core.js`, `split/intelligence.js`. Extract: `.section-caption` / `.empty-state-caption` (cousin pattern, ~34 sites cross-jurisdiction unified into one class), `.guidance-do` / `.guidance-dont` (medical.js 5 sites), `.doctor-cta-call` / `.doctor-cta-map` (medical.js 2 sites, 13-prop blocks), `.kc-row-flex-wrap` (intelligence.js 6 sites), `.nh-legend-swatch` (intelligence.js 4 sites). ~80–150 LOC source net (extraction reduces inline-style hits substantially). Cross-jurisdiction (both Governors).

**Tests:** R-7 triad per extracted class family — positive (class-replaced renders byte-equivalent to pre-Polish-5), regression-guard (no inline-style residue at extracted sites), positive-regression (class definition reachable from styles.css across all consumers). +80–120 test LOC.

### Polish-6 — CSS-custom-property pivot for ~100 dynamic-required carve-outs

**Files:** `docs/DESIGN_PRINCIPLES.md` (convention amendment), `split/styles.css`, all 5 JS modules. Convert ~100 dynamic-required inline-styles from `style="width: ${pct}%"` shape to `style="--bar-pct: ${pct}%"` + class-side `width: var(--bar-pct)`. Convention spec amendment ships in this PR's diff. ~100–180 LOC source. Cross-jurisdiction.

**Tests:** R-7 triad — positive (CSS-custom-property pivot renders identical to inline-style), regression-guard (HR-2 surface count drops by ~100 measurable via grep-against-bundle), positive-regression (dynamic value flows through correctly). +60 test LOC.

**Spec discipline:** convention name + boundary documented in DESIGN_PRINCIPLES.md before the sweep. Pattern compounds for Stability sub-phase's bar-fill / spark-bar surfaces.

### Polish-7 — Responsive breakpoint normalization (header comment + uniform values)

**Files:** `split/styles.css`. Add canonical breakpoint header comment (xs=360, sm=400, md=500, lg=700) at top of file; migrate the **13 scattered global** `@media` declarations to use the canonical 4 values uniformly. **Care-domain queries already coherent (Maren) — left untouched verbatim.** Global / Intelligence-domain queries normalized. ~30–50 LOC source. Shared module.

**Tests:** R-7 triad — positive (breakpoint header comment present), regression-guard (no `@media` declaration uses a non-canonical pixel value), positive-regression (Care-domain breakpoints preserved at 700/400 verbatim — pre-Polish-7 Care queries match post-Polish-7 byte-for-byte). +30 test LOC.

### Polish-8 — CLAUDE.md sprite-count amendment + close artifact

**Files:** `CLAUDE.md` (sprite count 54 → 62 with date stamp), `docs/SPROUTLAB_PHASE_4_POLISH_CLOSE.md` (sub-phase close-of-phase docs). No code in Polish-8 (parallels Phase 2 PR-14 / Phase 3 PR-11 close shape). Pure docs.

**Tests:** none (docs-only, parallels Phase 3 PR-11 disposition).

### Polish-9 — Atomic-canon rename: simple-mode → essential-mode (Sovereign-via-Aurelius mid-sub-phase insertion)

**Sovereign-issued directive at mid-sub-phase** (post-Polish-1 merge): rename `simple-mode` → `essential-mode` across the codebase to align internals with already-existing user-facing "Essential Mode" display strings (core.js:4626 + :4672 pre-rename). Vocabulary-parity-between-UI-and-source first-instance (watch-list per Lean-Machine §B; no counter at first-instance).

**Mitigation posture:** **Local-only** (Q1 + Q2 conclusive at scout). simpleMode is NOT in `SYNC_KEYS` (sync.js:120-141; 20 data-domain members; user-preference keys bypass sync layer entirely per `if (!SYNC_KEYS[key]) return` guard at sync.js:856) and NOT in `SYNC_RENDER_DEPS` (sync.js:201-221). No Firestore involvement; no listener-fire path; no cross-device migration window needed.

**Files:** `split/core.js` (canonical surface: function defs `isSimpleMode/toggleSimpleMode/initSimpleMode → *EssentialMode`, classList ops, localStorage key `'ziva_simple_mode' → 'ziva_essential_mode'`, boot migration block at `initEssentialMode`, state-snapshot prop `.simpleMode → .essentialMode`, comment drop at :3700 obsoleted parenthetical), `split/start.js` (boot call), `split/home.js` (vitals gate + alert filter), `split/diet.js` (5 trends-modifier gates), `split/medical.js` (Polish-1 gates at :5805 + :5921), `split/template.html` (4 comments + settings toggle id + onchange function name; HR-3 inline-handler defect persists per Polish-9 scope-limit ratification, routed to charter §6 P-6 entry), `split/styles.css` (33 `body.simple-mode` CSS class refs). Total source: ~80-100 LOC.

**Boot migration (idempotent + race-safe):** read `'ziva_simple_mode'` → if value present + new key not already set → write `'ziva_essential_mode'` = old value → delete old key. Re-run is no-op (old=null after first migration). Multi-tab race safe (atomic per-key writes; B's clobber-guard skips if A already wrote new). Storage-cleared falls through to default-on logic.

**Out-of-scope** (historical-accuracy preservation): Hour 72 chronicle / WAR_TIME_2026-04-24_ADDENDA / LEAN_MACHINE_PHASE_4 / `Codex/docs/doctrine-ledger.md` / CABINET_BRIEF / PHASE_4_CHRONICLE / pre-Polish-9 commit messages. New chronicle entries authored AFTER Polish-9 merge use new vocabulary.

**Tests:** R-7 triad covering migration contract (positive — fresh user defaults to essential-mode ON; regression-guard — boot migration preserves existing user state through key transition; positive-regression — idempotency across N runs + multi-tab race clobber-guard + storage-cleared default-on). Existing essential-mode contract assertions (2a/2b/2c smoke spec block) renamed in-place for the new body-class + key vocabulary; verify external-contract preservation. ~75 test LOC net change.

**Hold-pending-Sovereign-real-device-verification:** **applies** per RATIFIED hermetic-floor doctrine (3/3) — multi-device verification: Sovereign device + Bhavna device both run boot migration cleanly; existing toggle state preserved through key rename; cross-device toggle (if applicable post-rename) reflects correctly.

### Polish-A1 / Polish-A2 (RESERVED) — Aurelius activities-tab fold-in slots

Aurelius's PR-22 handoff: *"3 PRs across Stability + Polish."* Polish reserves 1–2 of the 3. Specific scope + sequencing land at charter ratification time when Aurelius decomposes. Slots inserted at appropriate positions in the Polish-1 through Polish-8 sequence based on dependency order.

---

## 5. Acceptance — Polish sub-phase closes when

1. **The 4 named cross-Governor-catch governance-rule violations closed.** `medical.js:3208` HR-2 hex-in-inline-style fixed; `medical.js:2268` + `home.js:1595` HR-1 emoji fixed (line-numbers corrected at PR-23 r2 per Cipher Catch 2); `home.js:1391` HR-3 inline `onclick` migrated to `data-action` delegation. Verified via grep-against-bundle in tests. **The broader ~16-site HR-1 audit deferred to Phase 4 R-10 carry-forward** (criterion 13) per Cipher PR-23 r1 Catch 3 + route (a) reframe.
2. **`medical.js` mode-contract parity with `diet.js`.** All Insights-tier renders in medical.js gate on `isSimpleMode()`. Verified via synthetic-mode-toggle test asserting Insights cards hide in simple-mode.
3. **Direct-token-duplicate hex sweep complete.** Zero hex literals in `styles.css` matching exact `--sage / --rose / --amber / --lavender / --sky / --indigo / --peach` token values. Verified via grep-against-bundle parameterized test.
4. **New-token spec amendment landed in DESIGN_PRINCIPLES.md.** `--sage-deep`, `--amber-deep`, `--accent-warn`, `--gauge-wt`, `--gauge-ht`, `--font-display`, `--font-body` documented with use cases. Ad-hoc tonal hex variants migrated to new tokens. Spec ships in same PR as substitution sweep.
5. **Cross-jurisdiction class-extraction families landed.** `.section-caption` / `.empty-state-caption` family + `.guidance-do/dont` + `.doctor-cta-*` + `.kc-row-flex-wrap` + `.nh-legend-swatch` extracted; pre-Polish-5 inline-style sites converted to class references; visual fidelity preserved byte-equivalent.
6. **CSS-custom-property pivot convention spec amendment landed in DESIGN_PRINCIPLES.md.** `--bar-pct` / `--tint` convention documented. ~100 dynamic-required carve-outs migrated. HR-2 inline-style count drops measurably (target: 537 → ≤350).
7. **Responsive breakpoint header comment landed in styles.css** with canonical xs/sm/md/lg values. Global `@media` declarations normalized. Care-domain breakpoints preserved verbatim per Maren's coherence finding.
8. **CLAUDE.md sprite count amended** to reflect actual 62-symbol sprite. Chronicler-routing closed.
9. **Polish-8 close artifact published** at `docs/SPROUTLAB_PHASE_4_POLISH_CLOSE.md` aggregating per-PR close notes + cumulative R-4 floor + doctrine touchpoints + carry-forwards into Stability sub-phase.
10. **All deferred safety-tier carve-outs documented on-record** (CareTicket banner / growth-gauge / vaccination urgency / sleep dynamic-color SVG / illness-episode severity / Smart-QA class names / display-preferences reconciler / sync-banner / sprite prune). Each carry-forward names the receiving sub-phase or feature-grade R-8 charter.
11. **Cumulative R-4 floor preserved.** Each Polish PR adds to the cumulative floor (target: 4,081 + ~3,000 across the 8 PRs = ~7,000). Zero silent flakes.
12. **Activities-tab fold-in PR(s) closed.** Aurelius's reserved slots filled and acked.
13. **Phase 4 R-10 carry-forward documented and routed.** The full HR-1 emoji audit (Cipher PR-23 r1 Catch 3 surfaced ≥18 emoji-bearing rendered-UI sites; Polish-2 closes the 2 named cross-Governor-catch sites; ~16 remaining: home.js weather-code emoji map at `:253-257` + precautions strings at `:299-323` + weather advisory at `:336/:339` + food icon props at `:1115/:1190`; medical.js doctor avatar/modals at `:2355/:2385/:2401` + activity icon props at `:3914/:3930` + symptoms-render text at `:6521`) routed to Stability sub-phase or dedicated R-8 charter on-record per `architectural-surfacing-must-enumerate-axis-of-resolution`.

---

## 6. Hygiene queue (R-10; flush at 3–5)

**Carry-forwards from Phase 3 close** (still open, none triggered in Phase 4 to date):

| # | Item | Phase 3 disposition | Phase 4 Polish disposition |
|---|---|---|---|
| 1 | Simple-mode tab realignment (hide History, unhide Insights) | Sovereign-deferred | **Defer further** — UX scope-bin; Stability sub-phase territory |
| 5 | `beta/` frozen | Locked, no Phase 2/3 work touched | **Keep frozen** — Phase 4 Polish is province-only |
| 8 | Telemetry-shaped AbortError-vs-CORS-vs-network discrimination | Deferred (structurally collapsed) | **Defer further** — telemetry surface not warranted by Polish |

**Polish-sub-phase R-10 queue (active at charter ratification):**

| # | Item | Source | Disposition |
|---|---|---|---|
| P-1 | **Full HR-1 emoji audit (~18 remaining sites; was ~16 at PR-23 r2 — Polish-2 build-deep added 2 sites Cipher's r1 audit missed + corrected the cross-Governor-catch coverage gap)** in home.js weather-code emoji map (`:253-257`, 5 sites), precautions strings (`:299-323`, 6 sites), weather advisory templates (`:336/:339`, 2 sites), food icon props (`:1115/:1190`, 2 sites); medical.js doctor avatar/modal text (`:2355/:2385/:2401`), activity icon props (`:3914/:3930`), symptoms-render text (`:6521`); **medical.js:2255 severity label** (`'🚨 Emergency'` — Polish-2 build-deep find; not in Cipher r1 audit); **intelligence.js:11958 + :11965 severity label + emergency-care-callout duplicate** (`'🚨 Emergency'` + `'🚨 When to seek emergency care'` — Polish-2 build-deep find via intelligence.js cross-Governor-territory grep; intelligence.js was Kael's jurisdiction at Polish-charter time, not Maren's, so the cross-Governor-catch was scoped to Care files only and missed these). Fix-shape varies materially: simple `zi()` swap for some (doctor modal text, symptoms-render); structural refactor of icon-props/data-structures for others (weather-code emoji map needs code→sprite-name table with `zi()` resolution at render time; food icon props ditto); DRY-refactor candidate for the duplicated severity-label string between medical.js:2255 + intelligence.js:11958 (same `'\u{1F6A8} Emergency'` literal in both files — promote to a shared helper). | Cipher PR-23 r1 Catch 3 deeper audit (initial ~16) + Polish-2 build-deep audit (added 3 sites; surfaced cross-Governor-catch coverage gap as watch-list observation per Lean-Machine §B) | **Defer to Stability sub-phase or dedicated R-8 charter.** Multi-shape fix-set; needs atomic-canon split per R-3. |
| P-2 | Sprite-prune deferral resolution (11 unreferenced symbols: `alert-circle, balloon, bump, chef, crystal, fall, goal, halfcircle, lotus, sleep, trending-up`) | Kael scout | **Hold until Tally/Spark/Reward declare needs.** Close at sub-phase boundary. |
| P-3 | DESIGN_PRINCIPLES.md format consistency check post-Polish-4 + Polish-6 spec amendments | Polish-build anticipated | Close before Polish-8. |
| P-4 | Class-extraction residue audit post-Polish-5 (any `.section-caption` cousin missed in the sweep) | Polish-build anticipated | Close before Polish-8. |
| P-6 | **HR-3 settings-toggle delegation** — `template.html:2594` carries `<input id="settingsEssentialMode" onchange="toggleEssentialMode()">` — inline `onchange` handler is an active HR-3 violation. Polish-9's atomic-canon scope (vocabulary rename) renamed the function name in the inline handler but **the HR-3 violation persists**. Convert to `data-action="toggleEssentialMode"` with delegated handler. ~5 LOC source. | Polish-9 scout-deep finding (Sovereign-via-Aurelius ratified disposition: NOT in Polish-9 scope; route to R-10) | **Polish-2 expansion candidate** OR dedicated Polish-N hygiene-sweep PR. Address before Polish sub-phase closes. |
| P-5 | **Defense-in-depth JS-layer gating audit + sweep of remaining ~19 medical.js `renderInfo*` renderers** (renderInfoPoopConsistencyTrend, renderInfoPoopFrequency, renderInfoPoopColorAnomaly, renderInfoPoopAmountTrend, renderInfoPoopSymptoms, renderInfoPoopReport, renderInfoActivityConsistency, renderInfoMilestoneVelocity, renderInfoActivityCorrelation, renderInfoIllnessFreq, renderInfoVaccFever, renderInfoIllnessFood, renderInfoRecovery, renderInfoIllnessSleep, renderInfoFoodReaction, renderInfoRepetition, renderInfoTexture, renderInfoHydration, plus any new-Info-renderer drift). All write into Info-tab DOM that is CSS-hidden in simple-mode via `body.simple-mode .tab-btn[aria-label="Info tab"] { display:none; }`. Polish-1 lands the discipline at 2 named sites (renderInfoPoopFoodDelay + renderInfoPoopFoodWatch); P-5 carries the sister-shape sweep for the remaining 19. | Lyra build-deep catch at Polish-1 author-time (running-beats-reading sister instance to Cipher PR-23 r1 Catch 3); Sovereign-via-Aurelius Path-1 ratification | **Stability sub-phase candidate** — address if Sovereign deems perf/defense-in-depth worth pursuing post-Polish. Charter explicitly defers per Path-1 ratification. |

R-10 threshold (3–5 items) **EXCEEDED at 6 items at Polish-9 scout-deep** (was 5 post-Polish-1; P-6 added per Sovereign-via-Aurelius Polish-9 scout-side-finding ratification). Disposition: items P-1 + P-2 + P-5 explicitly route off the Polish sub-phase per their listed dispositions; items P-3 + P-4 close in-Polish-build; **P-6 is Polish-2-expansion-or-dedicated-Polish-N candidate** (close before Polish sub-phase final). With queue at 6 (over R-10's 3–5 band), a hygiene-sweep PR consolidating P-3 + P-4 + P-6 in-Polish-build is now warranted; framing of that consolidation lands at Polish-N close-time when build-state is concrete.

R-10 threshold remains 3–5 items. Below threshold items wait for Stability sub-phase or a dedicated sweep PR; at threshold a Polish-N+1 hygiene-sweep PR flushes (parallels PR-20 within Phase 3's R-10 cycle).

---

## 7. Sequencing risk + budget framing

**Sub-phase budget:** Polish has no fixed clock-window analogous to WAR_TIME's Hour 72 — Phase 4 sub-phases run at Lyra's cadence under Sovereign clock supervision. Estimated ~10–14 days for the 8 + 2 PR sequence (Polish-1 mode-contract-parity ~1 day, Polish-3 hex sweep ~2 days, Polish-4 token spec + sweep ~3 days, Polish-5 class-extraction ~2 days, Polish-6 custom-prop pivot ~2 days, Polish-2 / Polish-7 / Polish-8 ~1 day each, fold-in slots variable).

**Hour-N C-fallback trigger:** if Polish-1 doesn't reach Cipher-ack within 3 days of charter merge, revert to Option C (4 trivial fixes only) + close Polish sub-phase with Polish-1-as-Polish-N + carry-forward note routing remaining axes to Stability sub-phase or a Phase 5 charter.

**Cross-PR dependency risk:**
- Polish-3 (direct-token-duplication sweep) has ZERO dependency on Polish-4 (new-token amendment) — they touch disjoint hex sets. Either order is safe.
- Polish-4 (new tokens) MUST land before Polish-6 (CSS-custom-property pivot uses some of the new tokens like `--gauge-wt`). Sequencing: Polish-4 → Polish-6.
- Polish-5 (class extraction) and Polish-6 (CSS-custom-property pivot) BOTH touch all 5 JS modules; merge-conflict risk if cut in parallel. Sequencing: Polish-5 → Polish-6 (or vice versa, but not parallel).
- Polish-2 (governance-rule cleanup) is independent of every other Polish PR. Cut first as low-cost momentum starter, OR fold into Polish-1 if Aurelius prefers tighter sub-phase opener.
- Polish-A1 / A2 (Aurelius activities-tab fold-in) — dependency unknown until Aurelius decomposes; likely independent of Polish design-token work; could land anywhere in the sequence after charter ratification.

**Doctrine-compounding risk:** PR-19.6's *architectural-surfacing-must-enumerate-axis-of-resolution* (RATIFIED, 3/3) binds every Polish PR's body to per-axis disposition tables. Discipline carries forward; first sustainment landed on PR-22 (Phase 4 first sustainment instance per Aurelius PR-22 Ruling 4). Each Polish PR sustains.

---

## 8. Operating mode (subscription-only / no-poll-on-wake)

Per Aurelius PR-22 Ruling 4 (RATIFIED operating-mode shift for Phase 4): subscription-only / no-poll-on-wake. Distinct from Phase 2 (subscribe + re-poll-on-wake for CT-1 mitigation) and Phase 3 (relay-only / no subscriptions). Phase 2-era `02-habits.md` "Re-poll-on-wake" rule is **stale for Phase 4 successor sessions**; Sovereign-relay remains the fallback channel for missed webhook events.

For each Polish PR:
- Lyra opens PR (draft) → webhook fires → Cipher posts advisory review (relayed via webhook OR Sovereign in-context relay).
- For charter PRs + cross-province-implication PRs: Consul posts constitutional-sanity check (this charter qualifies — design-token amendments touch shared system used by all sub-phases including Spark's feature-flag mechanism). Consul has no merge authority; surfaces concerns for Aurelius/Sovereign weighing.
- Cipher ack + Consul clear → Aurelius posts final review.
- Sovereign nods on merge.
- Aurelius squash-merges with chronicle commit message.
- **Hold-pending-Sovereign-real-device-verification (RATIFIED PR-19.5, 3/3):** applies to behavior-shaping PRs. Polish-1 (mode-contract parity) carries this hold (UI-visible behavior shape change). Polish-2 / Polish-3 / Polish-4 / Polish-5 / Polish-6 / Polish-7 / Polish-8 are token + class + comment-shape changes with cosmetic-only UI surface; hold-disposition per-PR at charter ratification time.

**Governor invocation surface:** every Polish PR that touches a Governor's territory triggers governor-mode review per the canon-cc-008 / canon-gov-002 30K Rule. Maren reviews home/diet/medical changes; Kael reviews intelligence/core/data/sync/config/start changes. Shared-module changes (styles.css, template.html) get dual review from BOTH governors. Per Sovereign directive at charter authorship: *"be aggressive and always invoke governors wherever their territory is affected."*

---

## 9. Review path

- **Cipher (advisory):** verify Findings A–F against the cited Governor scout reports + repo state at `1bc64d3`. Probe the Option B sequence for D8 framing slips (PR-22 r1 D8 catches established the precedent — citation precision in charter quotes from Maren / Kael / Aurelius). Comment on the activities-tab fold-in slot framing (premature reservation vs Aurelius's actual decomposition shape). Sign-off shape: `— Cipher (advisory)`.
- **Consul (constitutional sanity):** charter qualifies as cross-province-implication PR — design-token amendments affect Stability + Tally + Reward + Launcher + Spark sub-phases inheritance. Polish-4's new-token spec amendment + Polish-6's CSS-custom-property convention amendment both modify the shared design system. Consul's surfacings inform Aurelius/Sovereign weighing; no merge-block authority.
- **Maren (Governor of Care):** committee-delegate scout already on-record (this charter's §2). Polish-1, Polish-2, Polish-4, Polish-5 touch Care jurisdiction; expect QA-round jurisdictional audits at each PR.
- **Kael (Governor of Intelligence):** committee-delegate scout already on-record (this charter's §2). Polish-2, Polish-5, Polish-6 touch Intelligence jurisdiction; Polish-3, Polish-4, Polish-7 touch shared modules → dual review with Maren.
- **Aurelius + Sovereign:** ratify A / B / C and the activities-tab fold-in slot reservation (1 vs 2 slots; sequencing positions). R-14 charter-ratification: option choice is structural enough that Sovereign's nod is requested. Squash-merge on ratification.

→ **Cipher:** advisory review requested (subscription-only mode; webhook-relay primary, Sovereign-relay fallback).
→ **Consul:** constitutional-sanity check requested on cross-province design-token implications.
→ **Aurelius / Sovereign:** ratify Option A / B / C; rule on activities-tab fold-in slot count + sequencing; ratify charter scope. Without ratification, no Polish-N feature code lands.
→ **Maren / Kael:** scout reports synthesized into §2; standing by for jurisdictional QA-round audits at Polish-1 onward.

— Lyra (The Weaver)

