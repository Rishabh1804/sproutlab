# Lean Landing v1 — the calm app-open surface

**Type:** Feature Spec (8-pass; render-first, built-before-spec — this document
ratifies and freezes what was proven in PR #219).
**Companion:** Lyra (Builder). **Governors at IMPL:** Vela (render) · Maren (Care) · Kael (engine) · Cipher (final-pass).
**Status:** Stage 1 (render) built + Architect-reviewed on the live preview; Stage 2 (wiring) + the General Emergency Room are specced here for build.
**Branch / PR:** `claude/focused-sagan-O11WS` → PR #219 (draft).
**Created:** 2026-06-03.

---

## 0. Ratification record (Architect, this session)

Locked decisions, carried forward verbatim:

1. **Option A** (lean greeting + one "today" line + soft doors) — unanimous Companion roundtable; Architect-ratified.
2. **Render-first** methodology — design and prove the visible surface against `DESIGN_PRINCIPLES.md` before wiring. Each render reviewed on the Vercel preview.
3. The dense 16-section dashboard is **renamed "Today"** (UI label) and **demoted** from the default-open slot — but keeps its id `home` (the string contract; see §6).
4. **Three doors:** **Log** (primary → Quick Log) · **Today** (→ dense dashboard) · **Ask** (→ Smart Q&A).
5. **Returning users** (`ziva_active_tab === 'home'`) open the **lean landing** on next boot (one-shot migration).
6. **§9 design language** (Recipes, `DESIGN_PRINCIPLES.md` v1.1) applies: warm-wave wavelength stripe, Fraunces-italic "voice" line, whisper-fade surfaces.
7. **Emergency** affordance on the landing — placement (bottom of the landing) **approved**. Opens a two-option chooser; **108/112** are independent `tel:` quick-dial targets.
8. **General-emergency** is a **new concept, designed fully in this spec** (§5).
9. The **footer credit** ("Built for Ziva ♥") gets the signature treatment (gradient name + heartbeat + shared warm-wave).

---

## 1. The problem this spec exists to solve

The app opens onto `home` → `renderHome()` (`split/home.js`): a 16-section data
**cockpit**. For a tired parent at 2 AM holding a baby, that wall is the wrong
front door. v1 replaces the open screen with a **calm landing** — a warm
greeting, one honest line about the day, and three soft doors — while keeping
the dense dashboard one tap behind. A live **Care signal pre-empts** the calm;
an always-present **Emergency** card puts help one tap away.

**The half-awake test governs every element:** would a parent read this
correctly at 2 AM, one-handed, holding a baby?

---

## 2. What v1 is (composition)

`#tab-landing` → `renderLanding()` fills `#ldContent`. Top → bottom:

```
┌─────────────────────────────────────────────┐
│  #headerFull (REUSED): avatar · "Good        │  ← greeting/age, shown on landing
│  morning, Ziva" (Fraunces) · age · date/wx   │
├─────────────────────────────────────────────┤
│  0 · CARE PRE-EMPT  (conditional)            │  ← loud-rose .card.card-action,
│     "Fever being tracked · Day 3 · tap →"    │     only when a live signal fires
├─────────────────────────────────────────────┤
│  1 · HERO (signature)                         │
│     ▂▂▂ 4px warm-wave wavelength stripe ▂▂▂   │  ← sheen sweeps (4.4s, ld-wave)
│     [sparkle]  TODAY SO FAR                   │  ← Nunito eyebrow (structure)
│     "2 feeds, a nap, and a happy afternoon."  │  ← Fraunces ITALIC voice (§9.6)
├─────────────────────────────────────────────┤
│  2 · DOORS                                     │
│     ┌───────────────────────────────────────┐ │
│     │ [note]  Log     Feed, nap, diaper…    │ │  ← primary, full row, sage whisper
│     └───────────────────────────────────────┘ │
│     ┌─────────────────┐ ┌───────────────────┐ │
│     │ [clock] Today   │ │ [crystal] Ask     │ │  ← sky whisper / lavender whisper
│     │ Full day        │ │ About Ziva        │ │
│     └─────────────────┘ └───────────────────┘ │
├─────────────────────────────────────────────┤
│  3 · EMERGENCY  (always present)              │
│     ┌───────────────────────────────────────┐ │
│     │ [siren] Emergency   Food or general…  │ │  ← rose whisper + outline; .ld-
│     │ ─────────────────────────────────────  │ │     emergency-main opens chooser
│     │ [phone] Ambulance·108 [phone] Emerg·112│ │  ← tel: pills (siblings; dial)
│     └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
        Built for  Ziva  ♥      ← footer: gradient name + heartbeat (global)
```

**Built (Stage 1), citable:**
- `renderLanding()`, `_ldCareAlerts()`, `_ldAnimateIn()`, `openEmergencyChooser()`, `_ldCloseEmergency()` — `split/intelligence-cards.js`.
- `ld-*` CSS block + `@keyframes ld-wave` + footer treatment — `split/styles.css`.
- `#tab-landing` / `#ldContent` + TEMP preview link + footer markup — `split/template.html`.
- `switchTab` landing render-trigger + `#headerFull` toggle + `ldAsk` + `ldEmergency` routes — `split/core.js`.

---

## 3. What v1 is NOT (scope fence)

- **No hero score/gauge** — a number is a verdict, not calm (C2). The hero carries the day's *story*, not a score.
- **No trends, heatmaps, or routine alert banners** on the landing — only the Care pre-empt passes through.
- **≤4 elements** (hero + doors + emergency, plus the conditional Care pre-empt). No re-accretion into a cockpit.
- **No new id churn** — `home` stays the dense dashboard's id; only its *label* changes (§6).
- **No food-emergency-room content** — that is PR #216's surface inside Track→Diet→Library; v1 only routes to it.
- **No backend** — all derived from existing localStorage/ISL accessors.

---

## 4. The render spec (decided; §9 design language)

### 4.1 Greeting hero anchor
Reuse `#headerFull` (`template.html`) — shown on the landing via the `switchTab`
header toggle (`name === 'home' || name === 'landing'`). Greeting/age refresh via
`updateHeader()`. **Stage 2 perf:** extract a lean greeting-only helper so cold
start does not run the full `updateHeader()` stat block.

### 4.2 Hero — the day's voice (`.ld-hero`, reuses `.card.card-hero.hero-home`)
- **Stripe:** `.card.card-hero.ld-hero::before` — height **4px**; a fixed wavelength gradient (`rose→peach→amber→sage→sky→indigo→lavender`, red→violet, §9.3) under a translucent sheen; `@keyframes ld-wave` sweeps the sheen left→right on a **4.4s** ease loop (§9.4). Band-widths fixed; only the sheen moves. Reduced-motion freezes it.
- **Eyebrow:** `.ld-hero-eyebrow` — domain icon (`sprout` empty / `sparkle` active) + Nunito uppercase "Today so far" (`.ld-hero-label`, structure register).
- **Voice:** `.ld-hero-voice` — the day's sentence in **Fraunces italic** (§9.6, italic = voice only), `--fs-xl`, `max-width:92%`, `text-wrap:balance`.
- **Source:** `_tsfGenerateSummary(today(), _tsfCollectEvents(), ctx)`. **Empty-state (decided):** landing-specific prospective copy *"A fresh day with Ziva — nothing logged yet."* + a `toggleQuickLog` "Start with breakfast" action — NOT TSF's retrospective "Quiet day so far." (Vela V-V-1).

### 4.3 Doors (`.ld-doors`, whisper-fade §9.2)
Each door: surface + `var(--shadow)` float + the §9.2 whisper-fade (`transparent → domain rgba`) + domain border; dark hue-swaps to the deep `--tc` tone.

| Door | Class | Icon | Domain | data-action | Route |
|---|---|---|---|---|---|
| **Log** (primary, full row, Fraunces label) | `.ld-door-primary` | `note` | sage (stronger) | `toggleQuickLog` | Quick Log sheet |
| **Today** | `.ld-door-today` | `clock` | sky | `switchTab` `home` | dense "Today" |
| **Ask** | `.ld-door-ask` | `crystal` | lavender | `ldAsk` | dense "Today" + focus `#qaInput` |

Sub-labels (comprehension): "Feed, nap, diaper & more" / "Full day" / "About Ziva".
Doors de-twinned by tint so they don't read as a pair (Vela V-V-2).

### 4.4 Care pre-empt (`_ldCareAlerts()`, slot 0 — Maren C1)
"Calm by default, Care pre-empts the calm." When a live signal fires, render a
persistent loud-rose `.card.card-action` above the calm, one tap to the fix; no
auto-dissolve.
- **Stage 1 (built):** active illness episodes via `getActiveIllnessPosture()`.
- **Stage 2 ship-gates (Maren, required before the default-flip):**
  (a) extend the detector to **due meds (Vit D3) + overdue/same-day vaccines + overdue CareTickets** (the silent, time-axis signals) via the `renderRemindersAndAlerts` predicate set;
  (b) give **action-needed** cards a **hotter icon tone** than the calm "being-tracked" `icon-rose`;
  (c) prefer deep-linking due-meds to the med tracker over the generic `switchTab home`.

### 4.5 Motion
`_ldAnimateIn()` — staggered fade-up (greeting→hero→doors→emergency), gated on `window.Motion`; no CSS pre-hide (accessible default); reduced-motion skips. The two warm-wave sweeps (hero stripe + footer name) share `@keyframes ld-wave`.

### 4.6 Footer credit (global, `.app-footer`)
"Built for **Ziva** ♥": "Ziva" wears the wavelength gradient via `background-clip:text` and the **shared `ld-wave` sheen sweep** (a bookend to the hero stripe); the `zi-heart` turns `--tc-rose` and beats (`@keyframes footer-beat`, reduced-motion off); set in Fraunces italic. Replaced the legacy inline `opacity:0.4` (HR-2 fix).

---

## 5. Emergency subsystem (FULL design)

### 5.1 Landing Emergency card (built; `.ld-emergency`)
Container carries **no** `data-action`. Children:
- `.ld-emergency-main` (`data-action="ldEmergency"`) → opens the chooser. The card-open survives.
- Two `<a href="tel:…">` quick-dial pills (`.ld-emergency-call`) — **siblings** of the main button, so `closest('[data-action]')` resolves to nothing → a tap dials and **never opens the chooser**; the surrounding padding is inert (container has no action). Numbers from `EMERGENCY_CONTACTS[DEFAULT_REGION]` (108 national ambulance / 112 unified), `escAttr` href + `escHtml` label, dark-safe rose-light/tc-rose chip, ≥44px, flex-wrap.

### 5.2 Chooser (built; `openEmergencyChooser()`)
Bottom-sheet overlay (mirrors `openOutingBriefing`: build → animate → scroll-lock → close on ×/outside-tap; reduced-motion floor). Two options:
- **Food emergency** → `switchTab('track')` → `switchTrackSub('diet')` → `switchDietSub('library')` (leads directly to the Library sub-tab, where **PR #216** wires the food emergency room of 4 emergencies). Toast on transit.
- **General emergency** → opens the **General Emergency Room** (§5.3). *(Stage-1 stub = "Coming soon" toast; this spec replaces it.)*

### 5.3 General Emergency Room — NEW CONCEPT (full design)

**Why a room, not a tab:** general emergencies (fall/cut/burn) are not a domain
tab and must be reachable fast and focused. The Room is a **full-screen overlay**
(parallel to the food emergency room), opened from the chooser. Namespace `ge-*`.

**Wireframe (locked reference):**

```
┌─────────────────────────────────────────────┐
│ [siren] General Emergency               [×]  │  ← .ge-head (rose, Fraunces)
│ ───────────────────────────────────────────  │
│ ⟪ CALL NOW  [phone] 112   [phone] 108 ⟫      │  ← .ge-callbar PINNED (sticky top)
│ ───────────────────────────────────────────  │
│ Not breathing / unresponsive →               │  ← .ge-item (tap to expand)
│   ▸ Call 112 NOW. Start CPR…                 │     immediate action + redflags
│ Choking (object) →                            │
│ Bad fall / head injury →                      │
│ Bleeding / deep cut →                         │
│ Burn or scald →                               │
│ Swallowed something / poison →                │
│ Seizure →                                     │
│ ───────────────────────────────────────────  │
│ This is first-aid guidance, not a diagnosis.  │  ← .ge-disclaimer (Maren floor)
│ When in doubt, call 112.                       │
└─────────────────────────────────────────────┘
```

**Content model (registry, decided shape):**
`GENERAL_EMERGENCIES` in `config.js` (render-policy/content constants co-locate
there per the config doctrine; **content is Maren's**, structure is Kael's):

```js
GENERAL_EMERGENCIES = [
  { id:'unresponsive', icon:'siren', name:'Not breathing / unresponsive',
    severity:'critical',                 // sorts first; rendered hottest
    immediate:[ '<step>', '<step>' ],    // 1–3 critical steps
    call112When:[ '<red flag>', … ],     // when to call (critical = always)
    source:'<authority>' },              // citation key
  // choking-object, fall-head, bleeding, burn, poison, seizure …
];
```

**Interaction / state:**
- Each `.ge-item` is a collapsible card (tap to expand the immediate-action detail; one open at a time, mirroring the app collapse pattern). `critical` items render expanded by default and hottest.
- `.ge-callbar` is **pinned** (sticky) — 112/108 `tel:` always one tap, independent of scroll, never behind an expansion.
- Close: × / outside-tap / back gesture; body-scroll lock; DOM cleanup on close (overlay checklist).
- Opened via the chooser's General option; also (Stage 2, optional) a deep route for the home-FAB long-press — **out of v1**.

**Safety floor (Maren jurisdiction — BLOCKING):**
- **All first-aid copy in `GENERAL_EMERGENCIES` is PLACEHOLDER** until authoritatively sourced (Red Cross / AAP / WHO / IAP / NHS) and **Maren-audited**, mirroring the §9.7 food-safety doctrine. The builder ships the structure with clearly-marked placeholder content gated behind Maren sign-off; **no invented clinical prose ships.**
- **Lead with the call.** Life-threatening items (`severity:'critical'`) lead with "Call 112 now" as the prominent clause; soft prep folds into the phrase; strict actions lead. Safety always shows first.
- The persistent disclaimer (`.ge-disclaimer`) is mandatory: "first-aid guidance, not a diagnosis; when in doubt, call 112."
- The Room must read correctly at 2 AM in a panic: large tap targets (≥44px), loud-but-legible rose, no ellipsis, no clever motion.

**Food↔object choking cross-link (ratified):** the *choking (object)* item carries a one-line link to the Diet→Library food emergency room — "Choking on **food**? →" → `switchTab('track')`→`switchTrackSub('diet')`→`switchDietSub('library')`. **Coordination note for PR #216:** the food emergency room should reciprocally link back to the General Room for object/non-food choking, so a panicking parent who picks the wrong door is one tap from the right one.

**Design language:** rose domain throughout; `.ge-item` uses the §9.2 whisper-fade; `critical` gets the Emergency-Deck loud rose (louder than every tint). zi icons only; tokens only; dark parity.

---

## 6. Stage 2 — wiring (id strategy: relabel, don't rename)

`'home'` is a string contract threaded through `TAB_ORDER`, the `#headerFull`
toggle, `homeFabAction`, bug-capture, and **7 `curTab === 'home'` re-render
guards** (`intelligence-quicklog.js` + `intelligence-qa-handlers.js`). Therefore:

- Keep id `home` = dense dashboard (`#tab-home`, `renderHome()` unchanged); **UI label → "Today."**
- New id `landing` is the default-open; nav slot index 0 (label "Home", `zi-lotus`).
- `TAB_ORDER` stays **6**: `['landing','growth','track','insights','history','info']` → no swipe/keyboard index shift. `switchTab('home')` stays valid for the Today door (guarded `indexOf === -1`).
- **Code-clarity comments** at both sites: id `home` ⇒ "Today"; id `landing` ⇒ "Home."

**Touch-points:**
- `core.js` `TAB_ORDER`; the `landing` render-trigger (built); `#headerFull` toggle (built).
- **Boot restore + migration** (`core.js` boot): one-shot, version-flagged (mirror `ziva_simple_mode → ziva_essential_mode`): if `ziva_active_tab` absent OR `=== 'home'` → resolve to `landing`; else restore saved. **Never write an unrecognized tab key.**
- `template.html`: nav button `data-tab` → `landing` (label "Home"); `#tab-landing` becomes the `.active` panel; **remove the TEMP preview link** + its `.ld-preview-*` CSS.
- **Performance:** `renderLanding()` stays off the heavy path — greeting + glance + ≤1 cached Care signal; no scoring recompute, charts, ISL summaries, combo init, sleep renders. Move init-time `renderHome()` off cold-start → lazy on first "Today" open.
- **Essential-mode + header selector audit** (`styles.css` selectors keyed on `aria-label` / `#home*` / `name==='home'`): audit each against the relabel so the dense surface still hides heavy cards and the header still toggles. Grep every `'home'` / `#home` / `aria-label="*tab"` / `headerFull` ref before the diff is final.

---

## 7. Data flow

No new storage. All derived:
- Greeting/age ← `updateHeader()` / `preciseAge()` / `DOB`.
- Hero voice ← `_tsfGenerateSummary` + `_tsfCollectEvents` + `getActiveIllnessPosture` (ISL).
- Care pre-empt ← `getActiveIllnessPosture` (Stage 1); `renderRemindersAndAlerts` predicates (Stage 2).
- Emergency numbers ← `EMERGENCY_CONTACTS` / `DEFAULT_REGION` (`config.js`).
- General Emergency Room ← `GENERAL_EMERGENCIES` static registry (`config.js`, Maren-audited content).
- Migration flag ← `localStorage` one-shot version key.

---

## 8. Edge cases (decided, so the builder doesn't)

1. **Empty day** → prospective hero copy + "Start with breakfast" (not "Quiet day so far.").
2. **Motion absent / reduced-motion** → static rainbow stripe + name; fade-ins land at final state; heartbeat off.
3. **`switchTab('home')` while `home` not in `TAB_ORDER`** → panel still activates by id; no nav button highlights (guarded). Acceptable.
4. **Care signal + Emergency both relevant** → Care pre-empt (slot 0, illness/overdue) is distinct from Emergency (slot 3, sudden events). Both may show; they don't compete (different registers, different positions).
5. **Multiple active illnesses** → one pre-empt card per active episode (existing posture array).
6. **tel: on a device with no dialer (desktop preview)** → browser handles `tel:`; no crash. The card-open still works.
7. **Food emergency tapped before PR #216 merges** → lands on the current Library sub-tab (no emergency room yet) + toast. Acceptable interim.
8. **General Emergency content not yet Maren-audited** → Room ships behind the Maren content gate; until then the chooser's General option keeps the "Coming soon" stub. **The Room does not ship with placeholder clinical prose.**
9. **Returning user mid-session on a real tab** (`ziva_active_tab==='track'`) → migration restores the real tab, not the landing.

---

## 9. Files touched + LOC estimate

| File | Region | Stage 1 (built) | Stage 2 / Room (to build) |
|---|---|---|---|
| `intelligence-cards.js` | Vela | renderLanding + chooser (~150) | General Emergency Room render (~120) |
| `styles.css` | triple-Gov | ld-* + footer (~190) | ge-* room (~90); remove ld-preview-* |
| `template.html` | triple-Gov | #tab-landing + footer (~12) | nav relabel; remove temp link |
| `core.js` | Kael | triggers + 2 routes (~6) | TAB_ORDER + migration + perf (~30) |
| `config.js` | Kael | — | GENERAL_EMERGENCIES registry (~60, Maren content) |
| `home.js` | Maren | — | lean greeting helper; renderHome lazy (~20) |

---

## 10. canon-cc-008 routing (at IMPL-PR time)

Diff touches `intelligence-cards.js` (**Vela**), `home.js` + Care pre-empt + General Emergency content (**Maren**), `core.js` + `config.js` + migration (**Kael**), and `styles.css` + `template.html` (**all three, sequential triple-Gov**, rotation Maren→Kael→Vela). Run `pnpm qa-route` on the real diff. **Maren is BLOCKING on the General Emergency Room content (safety floor §5.3) and the Care pre-empt Stage-2 extension (§4.4).** Lyra synthesizes; **Cipher** Edict V final-pass. Mark PR ready only after the chain completes.

---

## 11. Verification contract (test plan)

1. **Build:** `pnpm build` clean; all audit gates + emoji/HR-12/icon-text green.
2. **Fresh open:** cleared `localStorage` → lands on the lean landing; 6-tab nav, "Home" at index 0.
3. **Doors:** Log→Quick Log; Today→dense "Today"; Ask→dense + Q&A focus.
4. **Care pre-emption:** seed a live illness → persistent loud-rose card above the calm, routes to the fix; none → calm.
5. **Emergency tap routing:** card body → chooser; **108/112 → dialer, chooser does NOT open**; surrounding padding inert.
6. **Chooser:** Food → Track→Diet→Library; General → General Emergency Room.
7. **General Emergency Room:** pinned 112/108 call bar survives scroll/expansion; critical item leads with "call now"; disclaimer present; ×/outside-tap/scroll-lock correct.
8. **Migration:** `ziva_active_tab='home'` → next boot opens landing; `='track'` → restores track.
9. **Essential mode:** dense "Today" still hides heavy cards; header toggles correctly.
10. **Performance:** `renderHome()` not on cold start; landing open is fast.
11. **Motion:** reduced-motion → static stripe/name, no heartbeat, fades at final state; light + dark + 3 zoom tiers.

---

## 12. HR pre-check

| HR | Status |
|----|--------|
| HR-1 (no emoji) | zi() throughout; `×` (U+00D7) close glyph, `·`/`♥` via entity/zi — gates green. |
| HR-2 (no inline style) | none in ld-*/ge-*; **fixed** the legacy footer inline style. |
| HR-3 (data-action) | landing/chooser via data-action + programmatic listeners (overlay pattern); no inline handlers. |
| HR-4 (tokens) | ld-*/ge-* token-clean; gradient rgba stops are §9.2 accents (documented). |
| HR-6 (domain colour) | every surface domain-tinted (whisper-fade); reaffirmed by §9.2. |
| HR-7 (dark parity) | explicit `[data-theme="dark"]` rules for both gradients + whisper-fades. |
| HR-8 (≥36/44px) | doors/pills/options/call-bar ≥44px. |
| HR-11 (chip wrap) | call pills `flex-wrap`. |
| HR-12 (escHtml) | hero summary, tel labels escaped; Room content escaped. |

---

## 13. Charter compliance (CV3-006)

- **Axis 1 — Intellectual honesty:** the hero shows the day's *story*, never a verdict score; honest empty-state; the General Emergency Room ships **no invented clinical prose** (Maren-gated, sourced); the food-emergency interim route is labelled, not faked.
- **Axis 2 — Architectural extensibility:** relabel-don't-rename preserves the `home` contract; `landing` is a clean new id; `GENERAL_EMERGENCIES` is a data-driven registry (add an emergency = one entry); the chooser/room reuse the established overlay pattern.
- **Axis 3 — Linguistic + visual warmth:** §9 voice typography + warm-wave; "Built for Ziva" given its due; calm-by-default with Care/Emergency pre-empting only when they must.

---

## 14. Open for the Architect — RESOLVED (2026-06-03)

1. **General Emergency Room item set** — ✅ **Confirmed (7):** unresponsive/CPR · choking(object) · fall/head · bleeding · burn · poison · seizure. Maren owns the final content per the §5.3 safety floor.
2. **General Room placement** — ✅ **Overlay-from-chooser only; faster route (home-FAB long-press) OUT of v1.**
3. **Food vs object choking cross-link** — ✅ **Yes.** The General Room's *choking (object)* item carries a one-line cross-link to the Diet→Library food emergency room; PR #216's room should reciprocally link back (coordination note in §5.3).
4. **Care pre-empt Stage-2 scope** — ✅ **RATIFIED (2026-06-03):** the **default flip is gated on Maren's Care detector extension.** Before `landing` becomes the default-open screen, `_ldCareAlerts()` MUST surface **due meds (Vit D3) + overdue/same-day vaccines + overdue CareTickets** (the silent, time-axis signals) — not illness alone. *The **default flip** = the Stage-2 change that makes `landing` the app's default-open screen (nav slot 0, boot `.active` panel, temp preview link removed, returning-user migration) and demotes the dense dashboard ("Today") to one tap behind.* This is a **blocking** gate: the lean landing only *becomes* the screen a parent lands on at the flip, so "calm" must not hide a hard-deadline signal.
