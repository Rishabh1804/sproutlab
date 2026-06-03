# Session Handoff — Diet → Recipes design exploration

**Session date:** 2026-06-03 · **Companion:** Lyra (Builder) · **Status:** design exploration complete, **app-wiring pending**
**Where the work lives:** branch `claude/food-effects-v2-wiring-TFgRs` (PR #216), under `docs/design/` — *design records only, not yet in `split/`.*
**This doc + the DESIGN_PRINCIPLES update:** branch `claude/recipes-design-system` (separate PR).

> Session-close for the **recipes sub-thread only**. PR #216 itself stays open; the
> food-effects-v2 wiring continues after a `/compact`.

---

## What was built (all in `docs/design/`, generator-backed)

| Artifact | File(s) | What it is |
|---|---|---|
| **`zi_food` icon system** | `gen-zi-food.mjs` → `zi-food-sheet.html/.png` | 97 full-colour food symbols (`zif-*`), 104 cells incl. variants. 100% of the data.js food corpus. |
| **Icon coverage roadmap** | `gen-zi-food-coverage.mjs` → `zi-food-coverage.*` | 102/102 base ingredients mapped to icons. |
| **`zi` inventory** | `gen-zi-inventory.mjs` → `zi-inventory.*` | All 109 existing `zi-*` sprites categorised into 8 groups. |
| **Generative hero** | `recipes-tab/gen-hero.mjs` → `09-hero-motion.html/.png` | Recipe-of-the-day card: quantity-weighted fingerprint + warm-wave stripe + zif watermark + typography C. Light + dark. |
| **Warm-wave filmstrip** | `recipes-tab/09-stripe-filmstrip.*` | Static proof of the moving stripe (no GIF tooling in env). |
| **Typography directions** | `recipes-tab/10-typography.*` | The 4 title treatments; **C (italic warmth) ratified.** |
| **Per-ingredient tagline bank** | `gen-ingredient-taglines.mjs` → `ingredient-taglines.*` | 61 ingredients × 2–3 taglines (126), safety-aware. **Copy ratified.** |
| **Tagline composer** | `taglines.mjs` + `gen-combo-taglines.mjs` → `combo-taglines.*` | Shared module: builds a weighted tagline for ANY combo. EP bank = full ~97-ingredient DB. |
| **Recipe research** | `recipes-tab/RECIPE_RESEARCH.md` | Cited authoritative recipes + safety table (WHO/IAP/ICMR-NIN/NHS/FAO/AAP/CDC). |

All HTML renders via `recipes-tab/render-to-png.mjs` (Playwright). Generators are
data-driven — add an icon/recipe/tagline = one entry, re-run, re-render.

## Ratified decisions (Architect, this session)
1. **Food icons = real food colours**, not domain colours. Flesh uses `currentColor` (consumer sets hue → variants from one symbol: bell pepper r/y/g, carrot orange/purple, dals). Natural accents (green tops, brown pit/stem, yolk) baked in.
2. **Pills use the whisper-fade** (`dt-*`: `linear-gradient(135deg, transparent 40%, rgba(accent,.22))` over the card base) — never flat fills, never naked white/dark.
3. **Stripe** = narrow (4px), **de-neoned** soft mid-tones, **animated** warm-wave sheen sweep (~4.4s). Band-widths **weighted by ingredient quantity**, wavelength-ordered.
4. **Fade** = same weighting (135deg `--*-light` light / deep `rgba` dark).
5. **Typography C** — roman Fraunces title + a Fraunces *italic* "voice" descriptor. Italic = descriptor only. Title wrap fixed (`max-width:92%` + `text-wrap:balance`).
6. **Tagline system, 3 layers:** curated recipe taglines (2–3, rotate by day-seed) → per-ingredient bank → **composer** for uncurated combos (weight-ratio picks the connector; epithets rotate; safety enforced).
7. **Safety:** soft prep-cautions **fold** into the phrase (ground almond, halved grape, cooked egg, boneless fish, soaked chia); **strict no's lead** (honey 1y+, jaggery/added sugar). Adopted the **stricter WHO/NHS line on added sugar** over IAP's allowance.

## Open items (for the wiring phase)
- **Wire into `split/`** — this is all `docs/design/`. Real feature = move `zif-*` sprite into `template.html`, the composer + bank into the engine layer, the hero render into the Diet→Recipes surface. **Runs the canon-cc-008 Governor QA gate** (Maren = Care/safety, Kael = engine, Vela = render; Cipher final-pass).
- **`zif-*` is full-colour** — a deliberate departure from the monochrome `zi()` `currentColor` system. Wiring decision: new sub-system, not a drop-in `zi()` call. Token cleanup: `--tc-peach` is *referenced* in `styles.css` (`.meal-time-input:focus`, lines ~486/488) but **never defined** — defining it would fix that latent dangling reference *and* retire the stripe's one deep-peach literal (`#df9356`).
- **Minor icon polish backlog:** ginger/turmeric/garlic are acceptable but the weakest.
- **Tagline copy** is design-quality, not clinically reviewed — Maren must audit before ship (it carries safety phrasing).

## How to resume
`pnpm`-free: `node docs/design/<generator>.mjs` then `node docs/design/recipes-tab/render-to-png.mjs <in.html> <out.png> [width]`. Start at `recipes-tab/gen-hero.mjs` (imports `../taglines.mjs`).
