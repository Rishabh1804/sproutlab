# Recipes tab — LOCKED design language

**Locked 2026-06-03** (Architect sign-off). The recipe-row look is **`05-meal-rows.html`**.

## What's locked
- **Rows, not grid boxes.** Full-width `.lib-book`-style rows (the Library-rework idiom), grouped by **meal slot** (Breakfast / Lunch / Dinner / Snack), with a featured **`.card-hero.hero-diet`** "Suggested for Ziva" card on top.
- **Two-channel colour** (per DESIGN_PRINCIPLES §Tint System → *Food-domain whisper*):
  - **Domain left rail** — `border-left` in the primary ingredient's FOOD_TAX domain (grains→sage, fruits→rose, vegs→peach, dairy→sky, nuts→lavender).
  - **Food-domain whisper fade** — `linear-gradient(135deg, transparent 40%, rgba(<accent>,0.22))` light / deep `--tc` hue ~0.16–0.18 dark (hue-swap). **A fade, not a flat fill.**
- **Real `zi()` sprite**, real card chrome, real `.combo-result`/`.combo-section` for detail + "Can I give this?".
- Light **and** dark both first-class (dark hue-swaps the fade).

## Superseded (do not reuse)
- `02-elements.*` — invented header-band cookbook cards + hand-drawn motifs (icons looked broken).
- `04-elements.*` — `domain-light → warm` flat-ish fade (wrong fade; not the decided whisper).

## Codified
- The whisper fade is now documented in `docs/DESIGN_PRINCIPLES.md` §Tint System → **Food-domain whisper** (`.dt-*`). When wired, `.dt-*` + `.lib-book` become shared `styles.css` classes (Library rework + Recipes consume one definition).

## Next
- Assemble the full tab (rows + detail + "Can I give this?" states) and wire per the approved plan.
