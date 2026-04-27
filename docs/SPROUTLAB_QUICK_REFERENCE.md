# SproutLab — Quick Reference
**Version:** 1.0 · **Created:** 13 April 2026
**Use:** Open alongside code during every build session

---

## 1. Architecture

**Type:** Split-file HTML PWA, build-concatenated, localStorage persistence, no backend (Firebase sync layer in progress)
**Repo:** `rishabh1804.github.io/sproutlab/`
**Live:** `https://rishabh1804.github.io/sproutlab/`
**Baby:** Ziva Jain, born 4 Sep 2025

### Module Structure

| File | Lines | Purpose |
|------|:-----:|---------|
| `data.js` | 3,561 | Constants, EVIDENCE_PATTERNS, MILESTONE_ACTIVITIES, DEFAULT_* data |
| `core.js` | 4,815 | save/load, init, ISL scoring, intelligence modifiers, escHtml, zi(), notes, scrapbook |
| `home.js` | 9,180 | Home tab, Quick Log, poop tracking, alerts, sleep (from home), vaccination booking, Tomorrow's Plan, outing |
| `diet.js` | 4,087 | Diet tab, food intelligence, meal logging, food favorites, Tomorrow's Plan diet |
| `medical.js` | 9,359 | Medical tab, growth, vaccination, milestones, sleep tab, doctor management, episodes |
| `intelligence.js` | ~8,000+ | Smart Q&A, CareTickets, cross-domain intelligence, activity logging |
| `start.js` | ~500+ | App init, event delegation, service worker, tab switching |
| `template.html` | — | HTML structure, zi() SVG sprite, CSS token definitions |
| `styles.css` | — | (if separated) All CSS |

### Build Order (build.sh)

```
styles.css → template.html → data.js → core.js → home.js → diet.js → medical.js → intelligence.js → start.js
```

Output: `sproutlab.html` → copy to `index.html` for GitHub Pages

### Deploy Workflow

```bash
cd ~/SproutLab
pnpm build              # bumps manifest version + builds sproutlab.html + copies to index.html
git add -A && git commit -m "message" && git push
```

`pnpm build` is the canonical entry; `bash split/build.sh > sproutlab.html && cp sproutlab.html index.html` is the same steps written out (PR-8 wired the script + made build.sh self-locating so `pnpm build` works from any cwd). The manifest version bump runs first (`split/bump-version.mjs`); errors go to stderr so the stdout HTML stream stays clean.

---

## 2. Data Gateway

```javascript
// THE critical abstraction — every data read/write goes through these
function load(key, def) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; }
  catch { return def; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  triggerAutosave();
}
// NOTE: Device Sync (Phase 1) will modify save() to:
//   1. Snapshot old value before overwrite
//   2. Use _remoteWriteDepth counter for autosave guard
//   3. Call syncWrite(key, val, old) if available
// See DEVICE_SYNC_SPEC.md §7.1 for target state.
```

---

## 3. localStorage Keys

```javascript
const KEYS = {
  avatar:     'ziva_avatar',
  growth:     'ziva_growth',
  feeding:    'ziva_feeding',
  milestones: 'ziva_milestones',
  foods:      'ziva_foods',
  vacc:       'ziva_vacc',
  notes:      'ziva_notes',
  meds:       'ziva_meds',
  visits:     'ziva_visits',
  medChecks:  'ziva_med_checks',
  events:     'ziva_events',
  scrapbook:  'ziva_scrapbook',
  doctors:    'ziva_doctors',
  sleep:      'ziva_sleep',
  poop:       'ziva_poop',
  alertsActive:  'ziva_alerts_active',
  alertsHistory: 'ziva_alerts_history',
  vaccBooked:    'ziva_vacc_booked',
  suggestions:   'ziva_suggestions',
  feverEpisodes: 'ziva_fever_episodes',
  diarrhoeaEpisodes: 'ziva_diarrhoea_episodes',
  vomitingEpisodes: 'ziva_vomiting_episodes',
  coldEpisodes: 'ziva_cold_episodes',
  activityLog: 'ziva_activity_log',
  tomorrowPlanned: 'ziva_tomorrow_planned',
  tomorrowOuting: 'ziva_tomorrow_outing',
  powerOutage: 'ziva_power_outage',
  bugReportPhone: 'ziva_bug_report_phone',
  bugTooltipSeen: 'ziva_bug_tooltip_seen',
  qlPredictions: 'ziva_ql_predictions',
  careTickets:   'ziva_care_tickets',
  notifPermission: 'ziva_notif_permission',
  ctEverUsed:    'ziva_ct_ever_used',
};
```

---

## 4. Hard Rules (HR-1 through HR-12)

| Rule | Constraint |
|------|-----------|
| HR-1 | No emojis — use `zi()` SVG icons only |
| HR-2 | No inline styles — CSS classes with tokens |
| HR-3 | No inline onclick — `data-action` delegation |
| HR-4 | No raw px in CSS — use `--sp-*`, `--fs-*`, `--r-*` tokens |
| HR-5 | No text-overflow ellipsis — ever |
| HR-6 | Domain colors for every surface (7-domain palette) |
| HR-7 | Dark mode token coverage on all new CSS |
| HR-8 | Minimum 36×36px tap targets |
| HR-9 | No persistent editing in overlays (Read/Act only) |
| HR-10 | All formatting through named functions |
| HR-11 | Chip text must wrap (no nowrap on variable content) |
| HR-12 | `escHtml()` on all user-sourced text in innerHTML |

---

## 5. Domain Color System

| Domain | Accent | Light BG | Text Color | Usage |
|--------|--------|----------|------------|-------|
| sage | `#b5d5c5` | `#e8f5ef` | `#3a7060` | Diet, nutrition, positive |
| rose | `#f2a8b8` | `#fde8ed` | `#9e3e52` | Medical, alerts, action needed |
| amber | `#e8b86d` | `#fef6e8` | `#8a6520` | Caution, trends, poop |
| lavender | `#c9b8e8` | `#f0ebfb` | `#6e5e9a` | Milestones, intelligence, activity |
| sky | `#a8cfe0` | `#e8f4fa` | `#336580` | Sleep, hydration |
| indigo | `#9ba8d8` | `#edf0fa` | `#4a5080` | Sleep intelligence, night data |
| peach | `#fad4b4` | `#fef3ea` | — | Warm accents, outing |

---

## 6. CSS Token Scale

```css
/* Spacing */
--sp-2: 2px; --sp-4: 4px; --sp-6: 6px; --sp-8: 8px; --sp-10: 10px;
--sp-12: 12px; --sp-16: 16px; --sp-20: 20px; --sp-24: 24px; --sp-32: 32px;

/* Font sizes */
--fs-2xs: 10px; --fs-xs: 11px; --fs-sm: 13px; --fs-base: 15px;
--fs-lg: 17px; --fs-xl: 20px; --fs-2xl: 24px; --fs-3xl: 30px;

/* Radius */
--r-sm: 6px; --r-md: 10px; --r-lg: 14px; --r-xl: 18px; --r-full: 50%;
```

---

## 7. Format Function Registry

| Function | Input | Output | File |
|----------|-------|--------|------|
| `escHtml(s)` | any string | HTML-safe string | core.js |
| `escAttr(s)` | any string | attribute-safe string | core.js |
| `formatDate(s)` | dateStr | `'Mon DD'` or `'Mon DD, YYYY'` | core.js |
| `formatTimeShort(t)` | `'HH:MM'` | `'H:MM am/pm'` | core.js |
| `toDateStr(d)` | Date | `'YYYY-MM-DD'` | core.js |
| `ageAtDate(dateStr)` | dateStr | `'Nm Nd'` | core.js |
| `formatHeight(cm)` | number | ft/in or cm string | medical.js |
| `normalizeFoodName(raw)` | string | normalized base name | core.js |
| `showQLToast(msg)` | string | Shows toast notification | core.js |

---

## 8. Icon System

**`zi(name)`** — returns SVG HTML string. 54 custom icons in sprite.

Common icons: `feed`, `sleep`, `poop`, `med`, `milestone`, `activity`, `alert`, `check`, `clock`, `calendar`, `chart`, `star`, `edit`, `delete`, `close`, `back`, `search`, `settings`, `export`, `import`, `bug`, `camera`, `mic`, `note`, `baby`, `weight`, `height`, `temp`, `vaccine`, `pill`, `doctor`, `growth`

---

## 9. data-action Convention

Pattern: `{module}{Verb}{Target}`

| Prefix | Module |
|--------|--------|
| `ql` | Quick Log |
| `al` | Activity Log |
| `sl` | Sleep |
| `ct` | CareTickets |
| `vacc` | Vaccination |
| `diet` | Diet tab |
| `med` | Medical tab |
| `ms` | Milestones |
| `tp` | Tomorrow's Plan |

Example: `data-action="qlLogFeed"`, `data-action="ctCreate"`, `data-action="vaccBook"`

---

## 10. Sync Classification (for Device Sync)

**SYNC keys (Firestore):** `feeding`, `sleep`, `poop`, `careTickets`, `notes`, `activityLog`, `milestones`, `growth`, `vacc`, `vaccBooked`, `meds`, `visits`, `doctors`, `medChecks`, `feverEpisodes`, `diarrhoeaEpisodes`, `vomitingEpisodes`, `coldEpisodes`, `foods`

**LOCAL-ONLY:** `avatar`, `scrapbook`, `events`, `suggestions`, `tomorrowPlanned`, `tomorrowOuting`, `powerOutage`, `alertsActive`, `alertsHistory`, `bugReportPhone`, `bugTooltipSeen`, `qlPredictions`, `notifPermission`, `ctEverUsed`

---

## 11. save() Call Frequency by Key

| Key | Saves | Files |
|-----|:-----:|-------|
| `vacc` | 7 | core, home, medical |
| `medChecks` | 6 | core, home |
| `foods` | 6 | home, diet |
| `sleep` | 4 | medical |
| `milestones` | 4 | core, home, medical |
| `vaccBooked` | 3 | home, medical |
| `feeding` | 2 | home, diet |
| `poop` | 2 | home |
| `notes` | 2 | core, home |
| All others | 1 each | various |

**Total: 48 save() calls across 4 files, all through the same gateway.**

---

## 12. QA Gate System (Summary)

| Gate | When | What |
|------|------|------|
| Gate 1 | Before writing code | Verify all dependencies (functions, constants, DOM elements, CSS classes) |
| Gate 2 | After writing code | 4-layer audit: Mechanical → Structural → Logic → Visual |
| Gate 3 | After Gate 2 passes | User review, cosmetic polish |

**Rule:** Code is not presented until Gate 2 passes with zero defects in layers 1-3.

---

## 13. Spec Process (Summary)

| Pass | Lens |
|------|------|
| 1 | Concept — "Is this the right thing?" |
| 2 | Data flow — "Can this be built?" |
| 3 | Integration — "Where does it collide?" |
| 4 | Bugs today — "What breaks?" |
| 5 | Drift bugs — "What breaks in 3 months?" |
| 6 | Builder questions — "What makes someone stop and ask?" |
| 7 | Consistency — "Does it agree with itself?" |
| 8 | Completion — "Am I done?" |

**Build-ready when:** The builder never has to make an undocumented decision.

---

## 14. Session Conventions

- Always read spec + design principles + source files before writing code
- Handoff documents and session prompts are two distinct artifacts
- Build estimates should be realistic, not optimistic
- Micro-specs preferred over large specs
- Never assume build/deploy commands — ask for exact process
- Multi-round QA after every build; continue until only cosmetic bugs remain
- "Keep going" = autonomous execution until done

---

## 15. Current Queue (as of April 2026)

1. **Device Sync (Firebase)** ← NEXT BUILD (spec complete, 748 lines)
2. Snapshot Sharing (Text v1)
3. EVIDENCE_PATTERNS Expansion
4. Inline Insights + Parent Celebration
5. CareTickets Phase 2

---

*This document is the builder's cheat sheet. Full specs are in the docs/ directory.*
