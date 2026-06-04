# Emergency Protocol v1 — spec

**Status:** Maren content-audit **PASSED (amended — V-M-225…235 folded)** → Architect sign-off → wiring
**Feature:** deep-linkable per-hazard **Emergency Cards**, landed from a food, with
actionable numbered steps, recognise/after, and a save/copy/share **doc-prep** card.
**Surface owner:** **Maren** (Governor of Care) — this is a safety surface; every
first-aid string below is **drafted** (Resuscitation Council UK / AAP HealthyChildren /
WHO / NHS) and is **not ratified until Maren's content audit passes**.
**Prefix:** `ec-*` (Emergency Card) — registered DESIGN_PRINCIPLES v1.5.
**Design record:** `docs/design/emergency-card/01-anaphylaxis-template.html` (S2, signed off).
**Builds on:** the food-effects-v2 Library redesign (the Deck, the 6-second food card),
the never-cross floor doctrine (`audit-floor-fidelity-v1`), HR-1…12, HR-9 (Read overlay).

---

## 0. What changes

Today the Deck (`_libDeckHtml`) renders three compact Recognise/Do **floor blocks**.
v1 replaces them with full **Emergency Cards** (`ec-*`) and makes them **deep-linkable**:
tapping "If a reaction happens" on a food lands the Deck **anchored to that food's
hazard** (peanut → Anaphylaxis, honey → Botulism, a choking food → Choking), not the top.
Each card gains **numbered Do-now steps**, a **one-tap Call**, an **After** section, and a
**doc-prep** summary the parent can **Copy** (Notes-readable text), **Save** (print-to-PDF),
or **Share**.

---

## 1. The hazard set (v1)

| Hazard id | Title | Chrome | Call | Recognise source | Notes |
|---|---|---|---|---|---|
| `anaphylaxis` | Severe allergic reaction · anaphylaxis | rose | `tel:112` | **authored** (V-M-232) | the acute adrenaline floor |
| `choking` | Choking | amber (caution) | `tel:112` (V-M-226) | **authored** — no FOOD_EFFECTS source exists (V-M-225) | MECHANICAL — back-blows/chest-thrusts, **never adrenaline** |
| `botulism` | After honey — suspected botulism | amber (caution) | none (→ your doctor) | `FOOD_EFFECTS['honey'].watchFor` | **sub-acute** — not a call-112-now event; tempo-labelled + acute escape-hatch (V-M-229) |

**FPIES** (delayed forceful vomiting, soy/grains) is a **v2 candidate** — deferred; soy's
`seekCare` already names it inline, and it has no dedicated `FOOD_EFFECTS` floor today.

**Chrome rule (carries V-M-224):** anaphylaxis = rose (the acute adrenaline emergency);
choking + botulism = amber caution (mechanical / sub-acute). Never cross.

---

## 2. Deep-link: food → its hazard

`_emHazardFor(foodKeyOrName)` → hazard id | null. Routed through the **same resolver** as
the floor (`getFoodEffect` / `_effHasClass`) — one resolver, no divergence:

```
foodClass membership (multi-valued):
  allergen-introduce-early           → 'anaphylaxis'   (PRIMARY — wins on multi-class)
  choking-by-form (and NOT allergen) → 'choking'
  acute-toxin (honey)                → 'botulism'
  else                               → null  (no emergency card; food has no floor)
```

**Primary-hazard rule (load-bearing).** Peanut/tree-nut/fish carry **both**
`allergen-introduce-early` and `choking-by-form`. Their deep-link lands on **anaphylaxis**
(the allergen response is the higher-acuity, time-critical one). The choking card remains
reachable in the Deck by scroll. Verified: `isChoke` in `_libPopHtml` already encodes
"choking only when NOT also an allergen" — `_emHazardFor` reuses that precedence.

**The link.** The food pop-up's floor row deep-link (`libPopToDeck`, today → `libOpenDeck`)
becomes `libPopToDeck(hazard)` → opens the Deck **and scrolls/anchors** to
`#ec-<hazard>` (CSS `scroll-margin-top` on the card + `scrollIntoView({block:'start'})`),
with a brief highlight pulse. Corpus foods (no `FOOD_EFFECTS` record) have no hazard → no
deep-link (their pop-up carries no floor row, unchanged).

---

## 3. Surface & overlay-stack model

The **Deck** stays the home of the Emergency Cards — it renders **all** hazard cards
(so a parent can reach the others) and the deep-link anchors to the target. This keeps one
emergency surface, not N.

**Overlay stack (z-index + close routing):**

| Layer | Element | z-index | Opened by | Close → returns to |
|---|---|---|---|---|
| 1 | food pop-up `#libPopOv` | 1200 | book tap / search | Library |
| 2 | Emergency Deck `#libDeckOv` | 1300 | `emerg-entry` / `libPopToDeck` | (closes both; → Library) |
| 3 | doc-prep pop-up `#emDocOv` | 1400 | "For the doctor" | the Deck (layer 2) |

- Bump the Deck to **1300** (above the food pop-up) and the doc-prep to **1400**.
- `libPopToDeck(hazard)` closes the food pop-up (layer 1) then opens the Deck at the
  hazard — the parent is now in the emergency surface, not stacked three deep.
- The doc-prep pop-up (layer 3) opens **over** the Deck; its close (× / tap-outside)
  returns to the Deck, not all the way out.
- `lib-overlay-open` body-class (FAB hide) stays set while **any** layer is open;
  cleared only when the last closes.

---

## 4. The Emergency Card layout (`ec-*` template — the reusable contract)

One builder `_emCardHtml(hazard)`; every hazard fills it. Structure (matches the record):

```
.ecard  (per-hazard: .ecard--rose | .ecard--amber)
  .ec-head            header — kicker "In an emergency" + food/hazard name + sub + ×
  .ec-body
    .ec-do            DO NOW (hero)
      .ec-do-h        "Do now"
      .ec-step × N    numbered immediate steps  (.ec-step-n + .ec-step-t)
      .ec-call        one-tap Call (tel:) — rose whisper-fade gradient   [hazard-gated]
    .ec-sec RECOGNISE .ec-signs (bullets)        ← FOOD_EFFECTS severeSigns/watchFor
    .ec-sec AFTER     .ec-next (bullets)         ← authored
    .ec-docprep       "For the doctor" → opens the doc-prep pop-up (§5)
```

- **Chrome.** `.ecard--rose` (anaphylaxis) / `.ecard--amber` (choking, botulism) drive
  header band, step-number bg, Call gradient, section accents. Mirrors the food-card
  per-hazard chrome (V-M-224).
- **Call button.** Shown only for hazards with an emergency number (`anaphylaxis`,
  `choking`). Botulism shows **no Call pill** (it routes to "your doctor", not 112) — its
  Do/After say so. `tel:` value per hazard (§6). Rose/amber **whisper-fade gradient**
  highlight (design-ratified).
- **Type.** Fraunces = the food/hazard name (identity); Nunito = everything functional
  (steps, labels, Call, doc-prep) — the v1.4 split.
- **HR:** icons via `zi()` (need `zi-phone`, `zi-doc`, `zi-copy`, `zi-share` — §7); no
  inline styles; `escHtml` every dynamic value; tokens only.

---

## 5. The doc-prep card (`#emDocOv`) — Read overlay

Tapping **"For the doctor"** opens the doc-prep as a **pop-up card** (Read overlay — ×
+ tap-outside + Esc, the `.fp-*` pattern). It is a **generated summary** — every field is
auto-filled or read-only **except the two time fields**, which are **tap-to-stamp** with **three states**: blank → tap the field → current time
(`HH:MM AM/PM`) → tap again → blank; **and an `N/A` pill** marks the field *deliberately
not applicable* (e.g. adrenaline not given / not owned), clearing any stamp. `N/A` is
distinct from a blank — a blank reads as "not filled," `N/A` tells the clinician it was
considered and doesn't apply. All one-tap Quick acts, **not a text form** — HR-9-clean
(the parent taps/toggles, never types). Field value flows to Copy/print as the time, `N/A`,
or `____` (unfilled). **HR-12: the stamp uses timezone-safe local-time construction.**
*(Wiring note: the static "Adrenaline given: Yes/No" row becomes a Yes / No / N-A selector
to match — the same three-state affordance, Maren to confirm at the code gate.)*

**Schema** `_emDocModel(hazard, ctx)` — field ORDER matters (V-M-230: time-of-reaction is
the clinician's first question, so it sits high, not mid-list):

| # | Field | Source |
|---|---|---|
| 1 | `who` | Ziva's name · age (months) · **weight** (from her record — weight is load-bearing for dosing, V-M-230) |
| 2 | `suspected` | the hazard title |
| 3 | `time` | **Time of reaction** + (anaphylaxis) **Adrenaline given at** — promoted directly under `suspected` (V-M-230). **Tap-to-stamp** (one-tap current time, second tap clears; HR-9 single-Quick, HR-12 local-time). Unstamped → `____`. |
| 4 | `trigger` | the food that deep-linked here (or "—" if opened from the standing entry) |
| 5 | `symptoms` | the hazard's recognise list (comma-joined) |
| 6 | `actionTaken` | hazard-specific prompt (`docAction`, e.g. "Adrenaline given: Yes/No — time ____") |
| 7 | `knownAllergies` | from her record, or — when empty — **"none recorded yet (this may be a first reaction)"** (V-M-231: never "none on file", which reads as *cleared* mid-event) |
| 8 | `forTeam` | the authored sentence (V-M-230: neutral — does **not** assert an intervention that may not have happened) |

**Actions (footer):**
- **Copy** → `navigator.clipboard.writeText(_emDocText(model))` — the **Notes-readable
  plain-text** format (§5.1). Toast "Copied for the doctor."
- **Save / share** → `window.print()` against a **`@media print` stylesheet** that prints
  only `.doc` (the summary), clean — the browser's native Save-as-PDF / phone share sheet.
  No PDF dependency (decision locked).

### 5.1 The Copy plain-text format (`_emDocText`)

Exact template — labelled lines, blank line between blocks, no markup, ≤ ~72 cols so it
wraps legibly in Notes / WhatsApp:

```
SproutLab — Emergency summary
Ziva Jain · 9 months · 8.1 kg

Suspected: Anaphylaxis (severe allergic reaction)
Time of reaction: ____
Adrenaline given at: ____
Trigger food: Peanut
Symptoms seen: trouble breathing, facial swelling
Adrenaline given: Yes / No
Known allergies: none recorded yet (this may be a first reaction)

For the team: suspected anaphylaxis after peanut; see the
"adrenaline given" line; please observe for a biphasic reaction.
```

Built by joining `key: value` lines from `_emDocModel`; every value `escHtml`-free (plain
text, not HTML). The on-screen `.doc` render and the copied text are **one model**, two
renderers (no divergence).

### 5.2 Print stylesheet contract

`@media print { body * { visibility:hidden } #emDocOv .doc, #emDocOv .doc * { visibility:visible } #emDocOv .doc { position:absolute; inset:0; box-shadow:none } .doc-actions { display:none } }`
— prints the summary alone (no app chrome, no action buttons). Page-color forced light.

---

## 6. Data model — `EMERGENCY_PROTOCOL` (Maren content · `data.js`, beside FOOD_EFFECTS)

A structured map. **recognise is AUTHORED per hazard** (Maren V-M-225: no `FOOD_EFFECTS`
record holds the choking signs — its record is only `minMonth`+`reason`; and V-M-232:
don't hard-couple anaphylaxis to egg's floor). Botulism's recognise may reuse
`FOOD_EFFECTS['honey'].watchFor` (a real field). **steps / after / forTeam / call /
recognise are authored** (the content Maren audits).

```js
const EMERGENCY_PROTOCOL = {
  anaphylaxis: {
    title: 'Severe allergic reaction · anaphylaxis',
    chrome: 'rose',
    call: '112',                       // tel:112 (India unified emergency)
    recognise: [                       // AUTHORED (V-M-232 — not coupled to egg's floor)
      'trouble breathing or wheezing',
      'swelling of the face, lips, or tongue',
      'going floppy, pale, or very sleepy',
    ],
    steps: [ /* authored — see §6.1 */ ],
    after: [ /* authored */ ],
    docAction: 'Adrenaline given: Yes / No — time ____',
    // V-M-230: forTeam must NOT assert adrenaline was given (it may not have been) — neutral.
    forTeam: 'suspected anaphylaxis after {food}; see the "adrenaline given" line; please observe for a biphasic reaction.',
  },
  choking:  { title:'Choking', chrome:'amber', call:'112',   // V-M-226: pill + step both 112
              recognise: [             // AUTHORED (V-M-225 — no FOOD_EFFECTS source exists)
                'silent — cannot cough, cry, or make a sound',
                'cannot breathe, or a high-pitched squeak',
                'going blue around the lips, or going floppy',
              ],
              steps:[…], after:[…],
              docAction:'Back blows / chest thrusts given · object cleared: Yes / No',
              forTeam:'choking on {food}; back blows + chest thrusts given; object cleared per the line above.' },
  botulism: { title:'After honey — suspected botulism', chrome:'amber', call:null,  // doctor, not 112
              recogniseFrom:{ key:'honey', field:'watchFor' },   // real field — single source ok
              tempo:'Not a sudden emergency — watch over the next days and call your doctor.',
              steps:[…], after:[…], docAction:'Honey given on/around ____', forTeam:'…' },
};
window.EMERGENCY_PROTOCOL = EMERGENCY_PROTOCOL;
```

> **Recognise sourcing (post-Maren):** `anaphylaxis` + `choking` recognise lists are
> **authored** in `EMERGENCY_PROTOCOL` (choking has no FOOD_EFFECTS source — V-M-225 block;
> anaphylaxis authored to avoid the egg hard-coupling — V-M-232). `botulism` reuses
> `FOOD_EFFECTS['honey'].watchFor` (a real field, kept single-source).

### 6.1 DRAFT content — **Maren audits every line**

> **Maren content audit: AFFIRMED clinically.** Adrenaline-first (V-M-227), the infant
> choking algorithm incl. the abdominal-thrust ban (V-M-228), and the botulism sub-acute
> framing (V-M-229) are all correct. The wording fixes below are folded.

**Anaphylaxis — Do now** (V-M-227 no-injector escape · V-M-234 don't gate the call on a diagnosis)
1. **If you have an adrenaline auto-injector — use it now.** Outer thigh, hold 10 seconds. *(Most families won't have one — if not, go straight to step 2.)*
2. **Call 112** — tell them your baby has trouble breathing after food; say **"anaphylaxis"** if you can.
3. **Lie her flat, legs raised.** Hard to breathe → let her sit up. Vomiting → on her side. **Never stand her up.**
4. No better after **5 minutes**? A second dose, if you have one.
**After:** Go to hospital even if she settles — a reaction can return hours later. · Note the **time** of the reaction, the **food**, and what you **gave**.

**Choking — Do now** (MECHANICAL — never adrenaline)
*Recognise (authored — V-M-225):* silent · cannot cough/cry/make a sound · cannot breathe or a high-pitched squeak · going blue or floppy. (A coughing, crying baby is **not** this — that's step 1.)
1. **Can she cough / cry?** Encourage coughing — don't intervene.
2. **Silent / can't breathe → 5 back blows** — face-down along your forearm, head low, between the shoulder blades. *(If someone is with you, have them call 112 now.)*
3. **Then 5 chest thrusts** — two fingers, middle of the chest. **Never abdominal thrusts under 1.**
4. **Alternate** back blows + chest thrusts. Not clearing → **Call 112**. Unresponsive → start **CPR**.
**After:** Even once cleared, get her checked — a retained fragment or airway irritation can follow.

**Botulism (after honey) — sub-acute, watch** (no Call pill — routes to your doctor)
- This is **not a sudden emergency** — watch over the next days.
- Over the coming days, watch for: constipation · a weak cry or weak suck · unusual floppiness.
- If any appear, **call your doctor promptly** and say honey was given.
- **But if she struggles to breathe, can't feed, or goes limp — don't wait. Call 112.** *(V-M-229 deterioration escape-hatch — the one acute path out of the sub-acute frame.)*

> The Do / After blocks + the `forTeam` sentences + the `anaphylaxis`/`choking` **recognise**
> lists are **authored** content (botulism recognise reuses `FOOD_EFFECTS['honey'].watchFor`).
> **Maren content audit — PASSED (amended):** affirmed clinically; the folded amendments are
> V-M-225 (choking recognise authored, not the non-existent `severeSigns`), V-M-226 (Call
> `tel:112`, step text matches), V-M-227 (no-injector escape), V-M-228 (call-in-parallel),
> V-M-229 (botulism acute escape-hatch), V-M-230/231 (doc-prep time-prominence + neutral
> forTeam + allergies fallback), V-M-232 (anaphylaxis recognise authored). Never-cross
> confirmed clean in the authored copy (choking ∌ adrenaline; anaphylaxis ∌ mechanical aid).

---

## 7. Wiring plan (files · jurisdiction)

| File | Jurisdiction | Change |
|---|---|---|
| `data.js` | Kael (file) · **Maren** (content) | `EMERGENCY_PROTOCOL` constant + `window.` export |
| `diet.js` | **Maren** | `_emHazardFor`, `_emCardHtml`, `_emDocModel`, `_emDocText`, `_emDocPrepHtml`; rewrite `_libDeckHtml` to render `ec-*` cards; `libPopToDeck(hazard)` deep-link + anchor; `emOpenDocPrep` / `_emCloseDocPrep` / `emCopyDoc` / `emSaveDoc` handlers |
| `core.js` | Kael | dispatch routes: `emOpenDocPrep`, `emCloseDocPrep`/`Self`, `emCopyDoc`, `emSaveDoc`; the `libPopToDeck` arg pass-through; z-index lifecycle |
| `styles.css` | triple-Gov | `.ec-*` + `.ecard--rose/--amber` + `.ec-call` gradient + `.doc*` + `@media print` |
| `template.html` | triple-Gov | `#emDocOv` overlay container; sprites `zi-phone`, `zi-doc`, `zi-copy`, `zi-share` |
| `tests/e2e/emergency-card.spec.ts` | — | §9 |

---

## 8. Decisions (locked) & open items

**Locked:** print-to-PDF + share (no PDF dep) · Anaphylaxis the template-first hazard ·
"For the doctor" opens a pop-up card · doc-prep is read-only/generated (HR-9) · primary-
hazard = anaphylaxis for multi-class foods (Maren-affirmed V-M-233) · `tel:112`.
**Resolved by Maren's audit:** (a) Deck shows **all three** + anchor — confirmed (a parent
who deep-links to Anaphylaxis but faces choking must reach the choking card). (b) Botulism
**no Call pill** — confirmed, conditional on the V-M-229 escape-hatch line (now folded).
(c) FPIES deferred to v2 — concurred (soy's `seekCare` names it inline, no gap).
**Folded nit (V-M-233):** the Anaphylaxis card carries a one-line cross-link — *"Choking on
it instead? See the Choking card below."* — so a mis-routed choking parent is handed the
bridge, not left to scroll-discover.

---

## 9. QA gate (canon-cc-008) & verification

- **Maren-primary** — the content audit (§6.1) is the gate; plus deep-link safety
  (primary-hazard rule), doc-prep accuracy, the read-only/HR-9 posture.
- **Vela** — card legibility, the overlay stack, the half-awake read of the steps.
- **Kael** — `_emHazardFor` resolver parity, dispatch totality, the z-index lifecycle,
  `tel:`, the `EMERGENCY_PROTOCOL` data shape, the Copy/print logic.
- **Cipher** — Edict V final-pass.
- **Floor-fidelity** — extend `audit-floor-fidelity-v1` (or a sibling) to assert the
  **rendered** Emergency Card steps never cross (choking ∌ adrenaline; anaphylaxis ∌ back
  blows) — the render now carries authored steps, not just FOOD_EFFECTS seekCare.
- **e2e:** deep-link lands on the right hazard (peanut→anaphylaxis, honey→botulism);
  Call is `tel:`-wired and absent for botulism; "For the doctor" opens the pop-up; Copy
  writes the plain-text format; print stylesheet isolates `.doc`; overlay-stack closes
  return to the layer beneath.

---

## 10. Reusability

`_emCardHtml(hazard)` + `EMERGENCY_PROTOCOL` make the Emergency Card a **template**: a new
hazard is a data row + (if novel) one chrome variant — no new layout code. The doc-prep,
deep-link, Copy/print are hazard-agnostic. This is the "label it Emergency Card layout,
reuse later" the Architect asked for.
