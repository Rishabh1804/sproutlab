# SproutLab — Quick Reference
**Version:** 2.0 · **Updated:** 5 June 2026 (was v1.0, 13 April 2026 — methodology rewrite)
**Use:** Open alongside code during every build session — the builder's cheat sheet.

> **Authoritative-source rule** (mirrors `CLAUDE.md`): when this sheet and the maps disagree on **counts / LOC / token values**, the maps win (`docs/PROVINCE_MAP.html`, `docs/ICON_REFERENCE.html` — regenerated each build). When they disagree on **rules / HRs / persona / build commands**, `CLAUDE.md` wins. This sheet points at the live sources for drift-prone facts rather than re-asserting them (the v1.0 sheet froze "54 icons" and drifted ~4×).

---

## 1. Architecture

**Type:** Split-file HTML PWA — build-concatenated, localStorage + Firebase (Firestore) sync, no backend server. Used one-handed on a phone by tired parents.
**Repo:** `rishabh1804.github.io/sproutlab/` · **Live:** `https://rishabh1804.github.io/sproutlab/`
**Baby:** Ziva Jain, born 4 Sep 2025.

### Modules + Governor jurisdiction (30K Rule)

16 JS modules + 2 shared files. **Live LOC + headroom: `docs/PROVINCE_MAP.html`.** Jurisdiction (who audits what under canon-cc-008) is stable:

| Module(s) | Governor |
|-----------|----------|
| `home.js` · `medical.js` | **Maren** — Care |
| `diet.js` · `recipes.js` | **Ceres** — Nutrition (food logging, Library, Recipes, adequacy; canon-gen-001 2nd-gen Governor, split from Care 2026-06-08) |
| `intelligence-isl.js` · `intelligence-qa.js` · `intelligence-qa-handlers.js` · `intelligence-illness.js` · `intelligence-correlate.js` · `intelligence-caretickets.js` · `core.js` · `data.js` · `sync.js` · `config.js` · `start.js` | **Kael** — Intelligence (engine: what the data *does* before it renders) |
| `intelligence-cards.js` · `intelligence-quicklog.js` | **Vela** — Surfacing (render: where data becomes parent-legible; canon-gen-001 2nd-gen Governor) |
| `styles.css` · `template.html` (shared) | **all four** — sequential quadruple-jurisdiction review (Maren → Ceres → Kael → Vela) |

> `recipes.js` is mapped to **Ceres** (Nutrition) in `qa-route.sh` + `CLAUDE.md` as of the 2026-06-08 Care→Nutrition split.

### Concat order (split/build.sh)

```
config → data → recipes → core → home → diet → medical →
intelligence-isl → intelligence-qa → intelligence-qa-handlers →
intelligence-illness → intelligence-correlate → intelligence-quicklog →
intelligence-cards → intelligence-caretickets → sync → start
```

`template.html` (shell + zi()/zif() sprite + CSS tokens) and `styles.css` are injected by the build; two CDN scripts ride in fixed order — **Chart.js** (blocking) then **Motion One** (`defer`).

### Build & deploy

```bash
pnpm build      # → split/build-safe.sh: builds sproutlab.html, validates (<!DOCTYPE…>, >100KB), mirrors to index.html
git add -A && git commit -m "msg" && git --no-pager push
```

- **NEVER** `bash split/build.sh > out.html 2>&1` — the `2>&1` merges STDERR (audit gates + version bump) into the HTML and corrupts it (PR #118 lesson). `build-safe.sh` enforces `> $OUT 2> $LOG`.
- The build also (non-fatally) regenerates the **auto-generated reference docs** — all rebuilt from committed source so they can't drift: `PROVINCE_MAP.html`, `POOP_COLOR_REFERENCE.html`, `CARETICKET_STATE_MACHINE.html`, `DESIGN_PRINCIPLES.html`, the doc-views (`SESSION_CLOSE_SEQUENCE` / `QA_GATE_SPEC` / `SPROUTLAB_QUICK_REFERENCE`), and `ICON_REFERENCE.html`, plus the Graphify graph (`split/graphify-out/`, gitignored).

---

## 2. The QA chain — canon-cc-008 (NON-NEGOTIABLE pre-merge gate)

**Lyra builds alone; Governors activate only during QA rounds.** Every `split/` change headed for a PR clears the chain *before* the PR leaves draft or merges. Full procedure: `docs/QA_GATE_SPEC.md`.

1. **Build & self-check** — `pnpm build` clean, audit gates pass, e2e green.
2. **Governor audit** (Mode-1 subagents, parallel, by jurisdiction above) — summon **Maren** / **Kael** / **Vela** for whichever Region the diff touches; **both** Kael+Vela if it spans engine+render; **all three** for `styles.css`/`template.html`. Docs-/test-only → audit waivable (state it).
3. **Lyra synthesizes** the Governor reports and folds the fixes.
4. **Cipher** (Censor of Cluster A) runs the Edict V cross-cutting final-pass.
5. *Only now* — mark PR ready / merge.

- **`pnpm qa-route`** computes the summon-set from a diff (file routing + graph-traced cross-province ripple). **Advisory — widens, never narrows; does not discharge the gate.**
- **`/code-review` is NOT a Governor audit** (canon-cc-022 artifact test — a skill is an in-transcript smell-check, no signature, no Edict V entry). It may supplement; it never replaces.
- **Scribe Worker Tier** (canon-proc-006): each senior companion may command four task-Scribes — `scribe-scout` (recon) · `scribe-draft` (compose) · `scribe-verify` (mechanical checks) · `scribe-record` (chronicle). They support, never deliberate/commit/ratify.
- An **Architect waiver** ("merge it directly") is valid only when *explicitly* given. Silence is not a waiver.

---

## 3. Hard Rules (HR-1 … HR-12) — canonical, from CLAUDE.md

| HR | Rule |
|----|------|
| HR-1 | No emojis. All icons via `zi()` SVG system. |
| HR-2 | No inline styles. CSS classes + design tokens only. |
| HR-3 | No inline handlers. `data-action` delegation only. |
| HR-4 | `escHtml()` at all render boundaries. |
| HR-5 | All spacing/font/radius via CSS tokens. |
| HR-6 | `data-action` delegation universal. |
| HR-7 | `zi()` returns SVG HTML, set via innerHTML. |
| HR-8 | Stub features show "Coming soon" toast via `showQLToast()`. |
| HR-9 | Post-build multi-round QA audit. |
| HR-10 | No text-overflow ellipsis. |
| HR-11 | `Math.floor` for all currency display. |
| HR-12 | Timezone-safe date construction. |

*(The v1.0 sheet carried a different, conflicting HR numbering — this table is the canonical one. `CLAUDE.md` wins on any disagreement.)*

---

## 4. Design system

**Design floor — read it before touching any surface: `docs/DESIGN_PRINCIPLES.md`** (skill: `/design-principles`). The doc wins on any disagreement below.

**Type:** Fraunces (serif — hero/scores/card-titles/gauges) · Nunito (sans — body/labels/buttons/nav).
**Text zoom:** 3 tiers via `data-zoom` on `:root` (header block exempt).

### 7 domain colors
| Domain | Accent | Light BG | Text | Usage |
|--------|--------|----------|------|-------|
| sage | `#b5d5c5` | `#e8f5ef` | `#3a7060` | Diet, nutrition, positive |
| rose | `#f2a8b8` | `#fde8ed` | `#9e3e52` | Medical, alerts, action needed |
| amber | `#e8b86d` | `#fef6e8` | `#8a6520` | Caution, trends, food warnings |
| lavender | `#c9b8e8` | `#f0ebf9` | `#6e5e9a` | Milestones, achievements, intelligence |
| sky | `#a8cfe0` | `#e8f4fa` | `#336580` | Sleep, hydration |
| indigo | `#9ba8d8` | `#edf0fa` | `#4a5080` | Sleep intelligence, night data |
| peach | `#fad4b4` | `#fef3ea` | — | Warm accents, outing planner |

Every new card/section uses one domain color. No ad-hoc hex.

### Icons — two namespaces
- **`zi(name)`** → `<svg class="zi"><use href="#zi-{name}"/></svg>` — general icon set.
- **`zif-`** food icons → `<svg class="zif" style="--zif-c:…"><use href="#zif-{name}"/></svg>` (per-food color; resolved via `recipeFoodIcon()` in recipes.js; falls back to `zi('bowl')`).

**The live, complete, per-namespace icon list is `docs/ICON_REFERENCE.html`** (auto-generated from the `template.html` sprite each build — the authoritative source; do not hard-code a count).

### CSS tokens (scale; `styles.css` is source of truth)
```css
--sp-2..--sp-32     /* spacing: 2,4,6,8,10,12,16,20,24,32 */
--fs-2xs..--fs-3xl  /* font sizes */
--r-sm..--r-full    /* radius */
```

---

## 5. Data layer

### The gateway — every read/write goes through these (core.js)
```javascript
function load(key, def) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; } }
function save(key, val) { /* persists + autosave + (if SYNC_KEYS) Firestore write path */ }
```

### localStorage KEYS (core.js — current set)
`avatar · growth · feeding · milestones · foods · vacc · notes · meds · visits · medChecks · events · scrapbook · doctors · sleep · poop · alertsActive · alertsHistory · vaccBooked · suggestions · feverEpisodes · diarrhoeaEpisodes · vomitingEpisodes · coldEpisodes · activityLog · tomorrowPlanned · tomorrowOuting · powerOutage · bugReportPhone · bugTooltipSeen · qlPredictions · careTickets · notifPermission · ctEverUsed · lastWriters · milestoneSuppress · activityMeta`
*(All `ziva_*`-prefixed. `lastWriters` / `milestoneSuppress` / `activityMeta` are post-v1.0 additions.)*

### Firebase sync (sync.js)
Auth + Firestore. `SYNC_KEYS` (sync.js) is the authoritative sync allow-list — sync-internal metadata (`lastWriters`) is **never** roundtripped. Crash circuit breaker auto-disables after 3 errors; joining devices must not seed.

### data-action convention — `{module}{Verb}{Target}`
| Prefix | Module | | Prefix | Module |
|--------|--------|-|--------|--------|
| `ql` | Quick Log | | `ct` | CareTickets |
| `al` | Activity Log | | `vacc` | Vaccination |
| `sl` | Sleep | | `tp` | Tomorrow's Plan |
| `diet` | Diet tab | | `ms` | Milestones |
| `med` | Medical tab | | | |

e.g. `data-action="qlLogFeed"`, `data-action="ctCreate"`.

### Key helpers
`escHtml(s)` · `escAttr(s)` · `formatDate(s)` · `formatTimeShort(t)` · `toDateStr(d)` — **core.js**. `showQLToast(msg)` — **intelligence-quicklog.js**. `formatHeight(cm)` — **medical.js**. `recipeFoodIcon(name)` — **recipes.js**.

---

## 6. Key subsystems

- **ISL (Intelligence Service Layer)** — temporal query parser + 6 domain-data accessors + day/range summary generators (`intelligence-isl.js`).
- **Smart Q&A** — 30 intents (registry in `intelligence-qa.js`); handlers in `intelligence-qa-handlers.js`.
- **UIB (Unified Intelligence Bar)** — ingredient combos, food safety, symptom guidance.
- **CareTickets** — concern tracking with notification-driven follow-ups. 21-field model, 6-transition state machine (`docs/CARETICKET_STATE_MACHINE.html`). Engine in `intelligence-caretickets.js`.
- **Today So Far** — chronological daily activity timeline (`intelligence-quicklog.js`).
- **Illness episodes** — fever / diarrhoea / vomiting / cold state machines (`intelligence-illness.js`).

---

## 7. Session lifecycle (operational slash-skills)

| Skill | When | What |
|-------|------|------|
| `/design-principles` | before ANY UI work | surfaces the design floor (`DESIGN_PRINCIPLES.md`) |
| `/doc-render` | giving a `docs/*.md` an HTML twin | the build-wired Markdown→view pattern |
| `/sproutlab-compact` | BEFORE `/compact` on a long session | graph-anchored `/tmp` resume handoff |
| `/session-close` | END of a session, after merge | the close sequence → `docs/SESSION_CLOSE_SEQUENCE.md` |

**Spec process** (micro-spec discipline, 8 passes): `docs/SPEC_ITERATION_PROCESS.md`. Build-ready when the builder never makes an undocumented decision.

---

## 8. Ziva context

Born 4 Sep 2025 (~9 months). Milestones in flight: crawling, pulling to stand, cruising, pincer grasp, babbling, object permanence. Takes Vit D3 — track administration *timing*, not just taken/not-taken.

---

*The builder's cheat sheet. Full specs in `docs/`. The maps win on facts; `CLAUDE.md` wins on rules; this sheet points you to both.*
