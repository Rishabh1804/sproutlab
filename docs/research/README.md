# SproutLab Care — Food-Effects Research Layer

Evidence base for surfacing **food effects** (acute risk, allergy, choking, timing) in the Care layer. Honey is the archetype; this folder is the template + spine for every food that follows.

## What lives here

| Artifact | Role |
|---|---|
| `food-effects.manifest.js` | **The data spine.** One summary record per food. Feeds the unified hub *and* is the drop-in for the in-app `FOOD_EFFECTS` table — research and product share one truth. |
| `_TEMPLATE.food-dashboard.html` | Canonical visual-dashboard template (tabs, swipe, charts). Copy → fill. |
| `<food>-infant-safety.md` | Full cited prose brief (source of truth). |
| `<food>-infant-safety.html` | Long-form rendered brief. |
| `<food>-infant-safety.visual.html` | Skim-layer dashboard (built from the template). |
| `index.html` | The **unified dashboard** — manifest-driven hub over all foods (Index · Compare · Reactions). Built; renders live from `food-effects.manifest.js`. |

Three depth layers per food: **`.visual.html`** (skim) → **`.html`** (full prose) → **`.md`** (source). All three carry the same verified figures.

## Authoring a new food brief — workflow

1. **Research** — `/deep-research` fan-out across the food's axes (mechanism, threshold, symptoms/reaction, forms, context). Audience: Indian family, infants 0–12mo.
2. **Gap discipline** *(learned on honey — non-negotiable)*: third-party sources are fine for *facts that exist independently* (e.g. NFHS prevalence) but **never** a substitute for *"what body X officially says."* Pull primaries (curl + pypdf for binary PDFs). Two honey "facts" (IAP/FSSAI) were *laundered blog claims* that the primary check overturned. Flag genuinely-absent data honestly; do not manufacture it.
3. **Write** `<food>-infant-safety.md` (cited) → `.html` (rendered) → copy `_TEMPLATE` to `.visual.html` and fill.
4. **Append** the food's record to `food-effects.manifest.js`.
5. Docs-only ⇒ canon-cc-008 chain-exempt. Not wired into the app until the surfacing step is ratified.

## Manifest record schema

```
food, aliases[], tier, category, effect, minMonth, thresholdBasis,
allergen, reactionType[], headline, myth{claim,truth}, watchFor[],
timeCourse, seekCare, breastfeedingSafe, culturalNote, confidence,
sources[], dashboard, brief, longform, lastReviewed
```

- **tier** — `critical` (acute illness: honey) · `allergen` (egg, nuts, soy) · `choking` (whole nuts, grapes, popcorn) · `timing` (cow milk, salt, sugar) · `nutritive` (default).
- **reactionType** — `acute-toxin` · `allergy` · `choking` · `digestive` · `dental` · `renal`. Drives the unified hub's "Reactions" cross-cut.
- **confidence** — `high` · `moderate` · `weak` (strength of the evidence base).

---

## Unified dashboard — architecture plan (proposed)

**Goal:** one hub over many per-food briefs — browse **one** food, **compare several**, or slice by **reaction**.

**Principle: the manifest is the spine; dashboards are leaves; the hub is a view.** The hub renders entirely from `food-effects.manifest.js`; each card deep-links to that food's `.visual.html`. No data is duplicated — and because the manifest is also the future app `FOOD_EFFECTS` source, the research hub and the product can never drift.

### `index.html` — three modes, one data source

1. **Index** — a filterable grid of all foods, grouped by `tier` / `category`, each card showing `headline` + `minMonth` + a confidence badge, linking to the deep dashboard.
2. **Compare** — pick 2–4 foods → a side-by-side table (minMonth, tier, allergen, effect, watch-for, seek-care). Answers "egg vs cow's milk vs honey — what's the difference?"
3. **Reactions** — cross-cut by `reactionType`: group foods by *how* they can harm (allergy / choking / acute-toxin / renal / dental) and map each to its `watchFor` signs. This is the "foods **and** reactions" axis.

### Why now (the conceptual hook)

The data model already supports this. Per food the app holds `AGE_RULES` (gate), `ALLERGENS` (note), `NUTRITION` (facts); the manifest adds the **effect + reaction** layer. The hub is just a *view-join* over the manifest — so once ~5 foods exist, the hub is a few hours of build, not a research effort. **Personalisation tie-in (later):** the in-app version can overlay Ziva's own `foods[]` log (`reaction: ok|watch`) onto the same records — "foods she's tried, and how she reacted" — using the identical spine.

### Phasing

- **Phase 0:** template + manifest + honey. ✅
- **Phase 1:** more allergen foods — peanut + tree nut (#187), then egg · soy · wheat · sesame (Phase δ, #206/#207). Manifest now holds **7** records. ✅
- **Phase 2:** build `index.html` — the manifest-driven hub (Index + Compare + Reactions). ✅
- **Phase 3:** wire the manifest into the app `data.js FOOD_EFFECTS` for the Finding-A surfacing. ✅ honey + peanut + tree nut (#187), egg + soy + wheat + sesame + polarity-aware banner (#208). *In progress: the broader food classes — **cow milk + plant milks** (the first `drink-timing` + `substitute-caveat` records; FOOD_EFFECTS wiring follows the P1c polarity spec, Kael/Vela-reviewed); **fish** (`allergen-introduce-early` + `choking-by-form`, the new mercury species-selection axis in `safeForm`, ESTABLISHED polarities — no new spec); **the choking set** (ONE combined `choking hazards` record, `choking-by-form`-PRIMARY — the first standalone; its floor is choking first aid, not anaphylaxis — needs the milk-spec §9 render resolution). All three briefs landed; manifest now holds **11** records. The milk·fish·choking triad is research-complete; FOOD_EFFECTS wiring is the next code arc.***

> Net: every food we research compounds. The manifest makes the unified dashboard nearly free, and doubles as the product's data source — one spine, three consumers (research hub, skim dashboards, in-app surfacing).
