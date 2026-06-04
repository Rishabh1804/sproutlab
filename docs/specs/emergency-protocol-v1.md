# Emergency Protocol v1 — spec

**Status:** draft for Maren content-audit → Architect sign-off → wiring
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
| `anaphylaxis` | Severe allergic reaction · anaphylaxis | rose | 112 | `FOOD_EFFECTS[allergen].severeSigns` | the acute adrenaline floor |
| `choking` | Choking | amber (caution) | 112 / 108 | `FOOD_EFFECTS['choking hazards'].severeSigns` | MECHANICAL — back-blows/chest-thrusts, **never adrenaline** |
| `botulism` | After honey — suspected botulism | amber (caution) | doctor (not 112) | `FOOD_EFFECTS['honey'].watchFor` | **sub-acute** — not a call-112-now event; tempo-labelled |

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
+ tap-outside, the `.fp-*` pattern). **HR-9-clean: it is a GENERATED, READ-ONLY summary —
no in-app form fields.** Blanks the parent must fill (time) render as literal `____`
placeholders in the text, completed when they paste/print/handwrite.

**Schema** `_emDocModel(hazard, ctx)`:

| Field | Source |
|---|---|
| `who` | Ziva's name · age (months) · weight (from her record) |
| `suspected` | the hazard title |
| `trigger` | the food that deep-linked here (or "—" if opened from the standing entry) |
| `time` | `____` (parent fills) |
| `symptoms` | the hazard's recognise list (comma-joined) |
| `actionTaken` | hazard-specific prompt (e.g. "Adrenaline given: Yes/No — time ____") |
| `knownAllergies` | from her record (or "none on file") |
| `forTeam` | one authored sentence per hazard — what to tell the clinician |

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
Trigger food: Peanut
Time of reaction: ____
Symptoms seen: trouble breathing, facial swelling
Adrenaline given: Yes — time ____
Known allergies: (from record)

For the team: suspected anaphylaxis after peanut; adrenaline
given; please observe for a biphasic reaction.
```

Built by joining `key: value` lines from `_emDocModel`; every value `escHtml`-free (plain
text, not HTML). The on-screen `.doc` render and the copied text are **one model**, two
renderers (no divergence).

### 5.2 Print stylesheet contract

`@media print { body * { visibility:hidden } #emDocOv .doc, #emDocOv .doc * { visibility:visible } #emDocOv .doc { position:absolute; inset:0; box-shadow:none } .doc-actions { display:none } }`
— prints the summary alone (no app chrome, no action buttons). Page-color forced light.

---

## 6. Data model — `EMERGENCY_PROTOCOL` (Maren content · `data.js`, beside FOOD_EFFECTS)

A structured map; **recognise reuses FOOD_EFFECTS** (single source for the signs);
**steps / after / forTeam / call are authored** (the new content Maren audits).

```js
const EMERGENCY_PROTOCOL = {
  anaphylaxis: {
    title: 'Severe allergic reaction · anaphylaxis',
    chrome: 'rose',
    call: '112',                       // tel:112 (India unified emergency)
    recogniseFrom: { key:'egg', field:'severeSigns' },   // representative allergen floor
    steps: [ /* authored — see §6.1 */ ],
    after: [ /* authored */ ],
    docAction: 'Adrenaline given: Yes / No — time ____',
    forTeam: 'suspected anaphylaxis after {food}; adrenaline given; please observe for a biphasic reaction.',
  },
  choking:  { title:'Choking', chrome:'amber', call:'112',
              recogniseFrom:{ key:'choking hazards', field:'severeSigns' }, steps:[…], after:[…],
              docAction:'Back blows / chest thrusts given · object cleared: Yes / No',
              forTeam:'choking on {food}; back blows + chest thrusts given; …' },
  botulism: { title:'After honey — suspected botulism', chrome:'amber', call:null,  // doctor, not 112
              recogniseFrom:{ key:'honey', field:'watchFor' }, tempo:'Not a sudden emergency — watch over the next days and call your doctor.',
              steps:[…], after:[…], docAction:'Honey given on/around ____', forTeam:'…' },
};
window.EMERGENCY_PROTOCOL = EMERGENCY_PROTOCOL;
```

### 6.1 DRAFT content — **Maren audits every line**

**Anaphylaxis — Do now**
1. **Adrenaline auto-injector** if you have one — outer thigh, hold 10 seconds.
2. **Call 112** — say the word **"anaphylaxis."**
3. **Lie her flat, legs raised.** Hard to breathe → let her sit up. Vomiting → on her side. Never stand her up.
4. No better after **5 minutes**? A second dose, if you have one.
**After:** Go to hospital even if she settles — a reaction can return hours later. · Note the time, the food, and what you gave.

**Choking — Do now** (MECHANICAL — never adrenaline)
1. **Can she cough / cry?** Encourage coughing — don't intervene.
2. **Silent / can't breathe → 5 back blows** — face-down along your forearm, head low, between the shoulder blades.
3. **Then 5 chest thrusts** — two fingers, middle of the chest. **Never abdominal thrusts under 1.**
4. **Alternate** back blows + chest thrusts. Not clearing → **Call 112 / 108**. Unresponsive → start **CPR**.
**After:** Even once cleared, get her checked — a retained fragment or airway irritation can follow.

**Botulism (after honey) — sub-acute, watch** (no 112 dash)
- This is **not a sudden emergency** — watch over the next days.
- Over the coming days, watch for: constipation · a weak cry or weak suck · unusual floppiness.
- If any appear, **call your doctor promptly** and say honey was given.

> These three Do/After blocks + the `forTeam` sentences are the **authored** content. The
> **recognise** lists come verbatim from `FOOD_EFFECTS` (unchanged). Maren's audit gates
> ship: (a) clinical accuracy vs the cited guidance, (b) the never-cross rule (choking has
> **no** adrenaline; anaphylaxis has **no** mechanical aid), (c) the botulism sub-acute
> framing isn't read as a 112-now protocol.

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
hazard = anaphylaxis for multi-class foods · `tel:112` (India unified emergency).
**Open (for Architect/Maren):** (a) does the Deck show **only** the deep-linked hazard or
**all three** (spec assumes all-three + anchor)? (b) botulism Call pill — confirm **none**
(routes to doctor)? (c) FPIES deferred to v2 — confirm.

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
